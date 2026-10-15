import { buildTurnContext } from '../domain/context.js';
import { normalizeObservation, degradedObservation } from '../domain/observation.js';
import { reduceTurn } from '../domain/reducer.js';
import { R4StoreError } from '../adapters/store-errors.js';
import { hashCommand } from '../domain/command.js';
import { prepareRuleChange, commitProspectiveRuleState } from '../domain/rule-change.js';

function narrativeBody(storyText) {
  const lines = String(storyText).replace(/\r/g, '').split('\n');
  const headerIndex = lines.findIndex(line => /^\s*(?:\[선택지\]|선택지)\s*$/.test(line));
  return (headerIndex >= 0 ? lines.slice(0, headerIndex) : lines).join('\n').trim();
}

function scrubError(error) {
  const code = String(error?.code ?? error?.message ?? 'turn_failed').replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 100);
  return code || 'turn_failed';
}

export async function executeTurnJob({ job, store, provider, content, resolveRuleTemplate = null, onEvent = () => {} }) {
  if (job.status === 'complete' && job.receipt) {
    return { duplicate: true, receipt: job.receipt, snapshot: await store.readSnapshot(job.gameId) };
  }
  if (job.status !== 'running') {
    throw new R4StoreError(job.status === 'failed' ? 'explicit_retry_required' : 'job_already_running', 409, { job_id: job.jobId });
  }
  const snapshot = await store.readSnapshot(job.gameId);
  const currentState = snapshot.state;
  const feedback = job.operationKind === 'FEEDBACK';
  const sourceBefore = feedback ? job.feedbackStateBefore : currentState;
  if (!sourceBefore) throw new R4StoreError('feedback_source_state_missing', 409);
  const executionBefore = feedback
    ? { ...structuredClone(sourceBefore), state_revision: currentState.state_revision, committed_turn: currentState.committed_turn, turn_revision: currentState.turn_revision }
    : currentState;
  const turnNumber = feedback ? job.originalTurnNumber : currentState.committed_turn + 1;
  const turnRevision = feedback ? job.originalTurnRevision + 1 : 1;
  let prospectiveRules = null;
  if (job.command.kind === 'RULE_CHANGE') {
    try {
      prospectiveRules = prepareRuleChange({ state: sourceBefore, command: job.command, turnNumber, resolveRuleTemplate });
    } catch (error) {
      const code = scrubError(error);
      await store.failJob(job.jobId, job.attemptNo, 'rule_change_prepare_failed', code);
      throw new R4StoreError(code, 422, { job_id: job.jobId, retry_available: false });
    }
  }
  const contextState = prospectiveRules
    ? { ...sourceBefore, active_rules: prospectiveRules.active_rules, rule_history: prospectiveRules.rule_history }
    : sourceBefore;
  const recentEnd = feedback ? turnNumber - 1 : currentState.committed_turn;
  const recentTurns = await store.getRecentTurns(job.gameId, recentEnd, 6);
  const recentNumbers = recentTurns.map(turn => turn.turn_number);
  const memories = await store.searchMemories({
    gameId: job.gameId,
    beforeTurn: turnNumber,
    recentTurnNumbers: recentNumbers,
    literalAction: job.command.literal_action,
    actorIds: [...new Set([
      ...content.actors.filter(actor => (job.command.literal_action ?? '').includes(actor.name)).map(actor => actor.actor_id),
      ...(sourceBefore.active_rules ?? []).flatMap(rule => [...(rule.subject_actor_ids ?? []), ...(rule.counterparty_actor_ids ?? [])]),
      ...(prospectiveRules?.rule_change_event?.next_rule?.subject_actor_ids ?? []),
      ...(prospectiveRules?.rule_change_event?.next_rule?.counterparty_actor_ids ?? [])
    ])],
    limit: 12
  });
  const built = buildTurnContext({
    command: job.command,
    state: contextState,
    recentTurns,
    memories,
    content,
    turnNumber,
    ruleChangeEvent: prospectiveRules?.rule_change_event ?? null
  });
  let storyText = job.storyCheckpoint;

  if (!storyText) {
    onEvent({ type: 'stage', stage: 'story' });
    try {
      storyText = await provider.story({
        context: built.context,
        command: job.command,
        feedbackText: job.feedbackText,
        feedbackReferenceStory: feedback ? snapshot.latest_turn?.story_text ?? '' : '',
        onChunk: chunk => onEvent({ type: 'story_delta', text: chunk })
      });
      if (typeof storyText !== 'string' || !storyText.trim()) throw new Error('story_empty');
    } catch (error) {
      const code = scrubError(error);
      await store.failJob(job.jobId, job.attemptNo, 'story_failed', code);
      throw new R4StoreError(code, 502, { job_id: job.jobId, retry_available: true });
    }
    await store.updateJob(job.jobId, job.attemptNo, { stage: 'observer', storyCheckpoint: storyText });
  } else {
    onEvent({ type: 'story_recovered', text: storyText });
  }

  onEvent({ type: 'stage', stage: 'observer' });
  let observation;
  let observerRaw = null;
  try {
    observerRaw = await provider.observe({ storyText, context: built.observerContext ?? built.context, command: job.command });
    observation = normalizeObservation(observerRaw, { storyText, before: sourceBefore, content, turnNumber, turnRevision });
    await store.updateJob(job.jobId, job.attemptNo, { stage: 'commit', observerRaw });
  } catch (error) {
    observation = degradedObservation({ storyText });
    observerRaw = { error: scrubError(error), degraded: true };
    await store.updateJob(job.jobId, job.attemptNo, { stage: 'commit_degraded', observerRaw });
  }

  const reduced = reduceTurn({
    before: executionBefore,
    observation,
    turnNumber: feedback ? currentState.committed_turn : turnNumber,
    turnRevision
  });
  const after = commitProspectiveRuleState(reduced, prospectiveRules);
  const body = narrativeBody(storyText);
  const digest = observation.digest;
  const currentRule = prospectiveRules?.active_rules.find(rule => rule.rule_id === job.command.rule_change?.rule_id) ?? null;
  const eventRule = currentRule ?? prospectiveRules?.rule_change_event?.previous_rule;
  const actorIds = [...new Set([...(digest?.actor_ids ?? observation.scene.presence?.value ?? []), ...(eventRule?.subject_actor_ids ?? []), ...(eventRule?.counterparty_actor_ids ?? [])])];
  const keywords = [...new Set([...(digest?.keywords ?? []), ...(eventRule?.label ? [eventRule.label] : [])])];
  const importance = digest?.important === true || job.command.kind === 'RULE_CHANGE';
  const record = {
    game_id: job.gameId,
    turn_number: turnNumber,
    turn_revision: turnRevision,
    command: job.command,
    command_hash: hashCommand(job.command),
    operation_kind: feedback ? 'FEEDBACK' : job.command.kind,
    rule_change_event: prospectiveRules?.rule_change_event ?? null,
    feedback_text: feedback ? job.feedbackText : '',
    feedback_request_id: feedback ? job.requestId : null,
    state_before_revision: sourceBefore.state_revision,
    expected_state_revision: job.expectedStateRevision,
    state_after_revision: after.state_revision,
    content_version: content.version,
    prompt_version: built.contextManifest.prompt_version,
    provider_model: provider.modelNames,
    story_text: storyText,
    narrative_body: body,
    choices: observation.choices,
    observer_raw: observerRaw,
    observer_applied: observation,
    warnings: observation.warnings,
    projection_status: after.projection_meta.status,
    state_before: sourceBefore,
    state_after: after,
    turn_digest: digest,
    context_manifest: built.contextManifest,
    created_at: new Date().toISOString()
  };
  const receipt = await store.commitTurn({
    jobId: job.jobId,
    attemptNo: job.attemptNo,
    turnRecord: record,
    stateAfter: after,
    command: job.command,
    searchText: body + '\n' + job.command.literal_action + (job.command.rule_change ? '\n' + [job.command.rule_change.operation, job.command.rule_change.rule_id, job.command.rule_change.template_id, eventRule?.label ?? ''].join(' ') : ''),
    actorIds,
    keywords,
    important: importance,
    digest
  });
  const result = { duplicate: false, receipt, turn: record, snapshot: await store.readSnapshot(job.gameId) };
  onEvent({ type: 'committed', receipt, turn: record, snapshot: result.snapshot });
  return result;
}

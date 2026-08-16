import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  assertTestGameId,
  choiceContract,
  classifyParserResult,
  errorDetails,
  openingFailureClassification,
  openingFollowUpAllowed,
  writeVerifiedArtifact,
  projectionSnapshot,
  buildCompanyEditionMaster,
  buildCanaryProjectionParity,
  buildStoryFailureDiagnostic,
  canaryMode,
  parseCanaryArgs,
  assertCanaryOutputPath,
  defaultCanaryArtifactPath,
  OPENING_ONLY_MODE,
  CUT1_AUTHORITY_MODE,
  CUT3_RELATION_EVENT_MODE,
  PLAYABILITY_MAX_TURNS,
  TEST_GAME_ID,
  PRODUCTION_GAME_ID,
  selectOpeningChoiceLiteral,
  resolveOpeningPlayerAction
} from '../scripts/live-playtest-canary.mjs';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';

const master = {
  characters: [{ character_id: 'heroine1', name: '윤민아', gender: 'female' }],
  general_npcs: []
};

const validStory = `[SCENE]\n사무실이 조용하다.\n[DIALOGUE speaker_id="heroine1"]\n안녕하세요.\n[THOUGHT]\n오늘은 차분히 시작하자.\n[CHOICE]\n업무를 확인한다.\n[CHOICE]\n동료에게 인사한다.\n[CHOICE]\n자료를 정리한다.\n[CHOICE]\n잠시 주변을 살핀다.`;

test('live canary production guard rejects production and accepts designated test game', () => {
  assert.throws(() => assertTestGameId(PRODUCTION_GAME_ID), /PRODUCTION_GAME_GUARD/);
  assert.equal(assertTestGameId(TEST_GAME_ID), true);
});

test('phase 12K playability canary is bounded to three gameplay turns', () => {
  assert.equal(PLAYABILITY_MAX_TURNS, 3);
});

test('live canary captures exact structured error body fields', () => {
  assert.deepEqual(errorDetails({ error: { code: 'INVALID_EXTRACT_OBSERVATION', message: 'scene required', retryable: false, issues: [{ path: 'scene' }] } }, 422), {
    status: 422, code: 'INVALID_EXTRACT_OBSERVATION', message: 'scene required', retryable: false, issues: [{ path: 'scene' }]
  });
});

test('opening failure is a hard stop classification', () => {
  assert.equal(openingFailureClassification({ http_status: 200, terminal_event: 'error', sse_error_code: 'story_protocol_invalid' }, { status: 'failure' }), 'STORY_PROTOCOL_INVALID');
  assert.equal(openingFailureClassification({ http_status: 200, terminal_event: 'error', sse_error_code: 'provider_upstream_error' }, { status: 'unavailable' }), 'PROVIDER_UPSTREAM_ERROR');
  assert.equal(openingFailureClassification({ http_status: 200, terminal_event: 'complete' }, { status: 'failure' }), 'STORY_PROTOCOL_INVALID');
});

test('opening hard stop schedules no gameplay follow-up calls', () => {
  const calls = [];
  const failedOpening = { http_status: 200, terminal_event: 'error', sse_error_code: 'provider_upstream_error' };
  if (openingFollowUpAllowed(failedOpening, { status: 'unavailable' })) calls.push('turn1', 'turn2', 'csa', 'retry');
  assert.deepEqual(calls, []);
});

test('opening artifact helper verifies persistence outside the repository', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'company-v1-canary-test-'));
  const file = join(directory, 'artifact.json');
  const artifact = { terminal_event: 'error', follow_up_calls: { turn1: 0, turn2: 0, retry: 0 } };
  try {
    await writeVerifiedArtifact(file, artifact);
    const persisted = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(persisted, artifact);
    assert.throws(() => assertCanaryOutputPath(process.cwd()), /CANARY_OUTPUT_PATH_FORBIDDEN/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('live canary classifies parser success and preserves block sequence/warnings', () => {
  const result = classifyParserResult(validStory, master);
  assert.equal(result.status, 'success');
  assert.deepEqual(result.block_sequence, ['scene', 'dialogue', 'player_inner_thought', 'choice', 'choice', 'choice', 'choice']);
  assert.deepEqual(result.warnings, []);
});

test('live canary parser diagnostic unwraps a persisted master wrapper', () => {
  const wrappedMaster = { data: { characters: [{ character_id: 'heroine1', name: 'A' }], general_npcs: [] } };
  const result = classifyParserResult('[DIALOGUE speaker_id="heroine1"]\nHello.', wrappedMaster);
  assert.equal(result.status, 'success');
  assert.equal(result.dialogue_count, 1);
});

test('live canary accepts plain narrative without rewriting raw Story', () => {
  const raw = '서술 marker가 없는 본문';
  const result = classifyParserResult(raw, master);
  assert.equal(result.status, 'success');
  assert.deepEqual(result.block_sequence, ['narrative']);
  assert.equal(raw, '서술 marker가 없는 본문');
});

test('live canary records choice soft contract separately from parser hard status', () => {
  const parsed = classifyParserResult(validStory.replace(/\[CHOICE\][\s\S]*$/, '[CHOICE]하나만 남긴다.'), master).parsed;
  const result = choiceContract(parsed, { last_choices: [] });
  assert.equal(result.raw_count, 1);
  assert.equal(result.canonical_exact_four, false);
  assert.equal(result.invariant_ok, false);
});

test('Opening literal selection returns the exact provider value without numbering or metadata', () => {
  const literal = '  그대로 전달한다: 한글, punctuation?!  ';
  const parsedOpening = { canonical_choices: [literal, '둘', '셋', '넷'] };
  const selected = resolveOpeningPlayerAction({ parsedOpening, choiceIndex: 0, freeText: '사용하지 않는 자유 입력' });
  assert.equal(selected.mode, 'opening-literal');
  assert.equal(selected.choice_index, 0);
  assert.equal(selected.player_action, literal);
  assert.equal(selected.player_action, parsedOpening.canonical_choices[0]);
  assert.equal(selected.player_action.includes('1.'), false);
  assert.equal(selected.player_action.includes('player_action'), false);
});

test('Opening literal selection fails closed when the requested returned choice is unavailable', () => {
  assert.throws(
    () => selectOpeningChoiceLiteral({ canonical_choices: ['하나'] }, 0),
    /CANARY_OPENING_CHOICE_UNAVAILABLE/
  );
  assert.throws(
    () => selectOpeningChoiceLiteral({ canonical_choices: ['하나', '둘', '셋', '넷'] }, 4),
    /CANARY_OPENING_CHOICE_UNAVAILABLE/
  );
  assert.throws(
    () => selectOpeningChoiceLiteral({ canonical_choices: ['하나', '둘', '셋', '넷'] }, 1.5),
    /CANARY_OPENING_CHOICE_INDEX_INVALID/
  );
});

test('Cut 1 keeps free-text mode unchanged when no Opening literal is requested', () => {
  const freeText = '공백과 unicode를 그대로 보내는 자유 입력';
  assert.deepEqual(resolveOpeningPlayerAction({ parsedOpening: null, freeText }), {
    mode: 'free-text', choice_index: null, player_action: freeText
  });
});

test('Opening choice CLI option is explicit and bounded to Cut 1', () => {
  const parsed = parseCanaryArgs(['--cut1-authority', '--opening-choice-index', '3'], {});
  assert.equal(parsed.openingChoiceIndex, 3);
  assert.throws(
    () => parseCanaryArgs(['--cut1-authority', '--opening-choice-index', 'x'], {}),
    /CANARY_OPENING_CHOICE_INDEX_INVALID/
  );
  assert.throws(
    () => parseCanaryArgs(['--opening-only', '--opening-choice-index', '0'], {}),
    /CANARY_OPENING_CHOICE_MODE_REQUIRED/
  );
});

test('Opening literal mode changes only player_action while replay identity stays stable', () => {
  const parsedOpening = { canonical_choices: ['선택 literal', '둘', '셋', '넷'] };
  const selected = resolveOpeningPlayerAction({ parsedOpening, choiceIndex: 0, freeText: 'free text' });
  const identity = { game_id: TEST_GAME_ID, action_id: 'action-1', expected_turn: 1 };
  const firstRequest = { ...identity, player_action: selected.player_action };
  const replayRequest = { ...identity, player_action: selected.player_action };
  assert.deepEqual(replayRequest, firstRequest);
  assert.deepEqual({ game_id: replayRequest.game_id, action_id: replayRequest.action_id, expected_turn: replayRequest.expected_turn }, identity);
});

test('live canary captures CSA projection snapshot without mutating save', () => {
  const save = {
    csa_active: ['csa_1'],
    csa_rules: { csa_1: { active: true, content: '회사 여성 직원은 브래지어 없이 근무한다.', strength: 'weak', preset: { template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee', mode: 'continuous' } } },
    npc_scene_state: { heroine1: { clothing: { underwear_top: 'worn' } } }
  };
  save.csa_rules.csa_1.preset.execution = { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { underwear_top: 'removed' } };
  const masterWithRule = { characters: [{ character_id: 'heroine1', name: '윤민아', gender: 'female' }], general_npcs: [] };
  const projection = buildStoryWorldProjection({ save, master: masterWithRule, sceneActorIds: ['heroine1'], expectedTurn: 2 });
  const snapshot = projectionSnapshot(projection);
  assert.equal(snapshot.world_rules.length, 1);
  assert.equal('scene_obligations' in snapshot, false);
  assert.equal('execution_contract' in snapshot.world_rules[0], false);
  assert.equal(save.npc_scene_state.heroine1.clothing.underwear_top, 'worn');
});

test('canary uses the Company edition master shape instead of context.master', () => {
  const companyMaster = buildCompanyEditionMaster();
  assert.ok(companyMaster.characters.some(item => item.character_id === 'heroine1'));
  assert.ok(Array.isArray(companyMaster.general_npcs));
  const save = {
    csa_active: ['csa_1'],
    csa_rules: { csa_1: { active: true, content: 'rule', strength: 'weak', preset: { template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee', mode: 'continuous', execution: { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { underwear_top: 'removed' } } } } },
    npc_scene_state: { heroine1: { clothing: { underwear_top: 'worn' } } }
  };
  const parity = buildCanaryProjectionParity({ save, contextMaster: undefined, sceneActorIds: ['heroine1'], expectedTurn: 2 });
  assert.equal(parity.context_master_present, false);
  assert.equal(parity.context_master_required, false);
  assert.equal(parity.status, 'CONTEXT_MASTER_NOT_REQUIRED');
  assert.deepEqual(parity.local_projection.world_rules[0].applicable_scene_actor_ids, ['heroine1']);
  assert.equal('scene_obligations' in parity.local_projection, false);
  assert.equal(parity.actor_profiles[0].gender, 'female');
});

test('live canary preserves bounded Story failure evidence without hidden request data', () => {
  const diagnostic = buildStoryFailureDiagnostic({
    gameId: TEST_GAME_ID,
    turn: 1,
    playerAction: 'ask about work',
    actionId: 'action-1',
    story: {
      endpoint: '/api/story',
      http_status: 200,
      terminal_event: 'error',
      sse_error_code: 'STORY_PROTOCOL_INVALID',
      sse_error_message: 'invalid story',
      raw_story: '[SCENE]visible',
      visible_story: 'visible',
      raw_story_available: true,
      events: [{ name: 'meta', data: { action_id: 'action-1' } }, { name: 'error', data: { code: 'STORY_PROTOCOL_INVALID' } }]
    },
    parser: { status: 'failure', error: { code: 'STORY_PROTOCOL_INVALID', message: 'invalid story' }, block_sequence: [] },
    actionStatus: { processing_status: 'story_failed', error_code: 'STORY_PROTOCOL_INVALID' },
    beforeContext: { committed_turn: 0, save_revision: 1 },
    afterContext: { committed_turn: 0, save_revision: 1 }
  });
  assert.equal(diagnostic.request.endpoint, '/api/story');
  assert.equal(diagnostic.story.raw_story_available, true);
  assert.equal(diagnostic.story.raw_story_char_count, 14);
  assert.equal(diagnostic.story.events.length, 2);
  assert.equal(diagnostic.action_status.processing_status, 'story_failed');
  assert.deepEqual(diagnostic.context_before, { committed_turn: 0, save_revision: 1 });
  assert.equal('prompt' in diagnostic, false);
  assert.equal('authorization' in diagnostic, false);
});

test('cut1 authority mode is distinct from the broad Phase 12K diagnostic', () => {
  assert.equal(canaryMode([`--${CUT1_AUTHORITY_MODE}`]), CUT1_AUTHORITY_MODE);
  assert.equal(canaryMode(['--phase12k-playability']), 'phase12k-playability');
  assert.notEqual(canaryMode([`--${CUT1_AUTHORITY_MODE}`]), 'phase12k-playability');
});

test('cut3 relation/event mode is distinct and bounded separately from Cut 1 and Phase 12K', () => {
  assert.equal(canaryMode([`--${CUT3_RELATION_EVENT_MODE}`]), CUT3_RELATION_EVENT_MODE);
  assert.notEqual(CUT3_RELATION_EVENT_MODE, CUT1_AUTHORITY_MODE);
  assert.notEqual(canaryMode([`--${CUT3_RELATION_EVENT_MODE}`]), 'phase12k-playability');
});

test('canary CLI help and invalid modes are side-effect free', () => {
  const directory = mkdtempSync(join(tmpdir(), 'company-v1-canary-cli-'));
  const artifactPath = join(directory, 'artifact.json');
  const reportPath = join(directory, 'report.json');
  const script = resolve('scripts/live-playtest-canary.mjs');
  const env = { ...process.env, CANARY_ARTIFACT_PATH: artifactPath, CANARY_REPORT_PATH: reportPath };
  const before = readdirSync(directory);
  const help = spawnSync(process.execPath, [script, '--help'], { cwd: process.cwd(), env, encoding: 'utf8' });
  const shortHelp = spawnSync(process.execPath, [script, '-h'], { cwd: process.cwd(), env, encoding: 'utf8' });
  const unknown = spawnSync(process.execPath, [script, '--unknown'], { cwd: process.cwd(), env, encoding: 'utf8' });
  const noArgs = spawnSync(process.execPath, [script], { cwd: process.cwd(), env, encoding: 'utf8' });
  const conflict = spawnSync(process.execPath, [script, '--opening-only', '--cut1-authority'], { cwd: process.cwd(), env, encoding: 'utf8' });
  try {
    assert.equal(help.status, 0);
    assert.equal(shortHelp.status, 0);
    assert.notEqual(unknown.status, 0);
    assert.notEqual(noArgs.status, 0);
    assert.notEqual(conflict.status, 0);
    assert.match(help.stdout, /Usage: node scripts\/live-playtest-canary\.mjs/);
    assert.match(shortHelp.stdout, /--opening-only/);
    assert.match(unknown.stderr, /CANARY_CLI_UNKNOWN_OPTION/);
    assert.match(noArgs.stderr, /CANARY_CLI_MODE_REQUIRED/);
    assert.match(conflict.stderr, /CANARY_CLI_MODE_CONFLICT/);
    assert.deepEqual(readdirSync(directory), before);
    assert.equal(existsSync(artifactPath), false);
    assert.equal(existsSync(reportPath), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('canary CLI recognizes only explicit live modes and uses TEMP defaults', () => {
  const modes = [
    ['--opening-only', OPENING_ONLY_MODE],
    ['--phase12k-playability', 'phase12k-playability'],
    [`--${CUT1_AUTHORITY_MODE}`, CUT1_AUTHORITY_MODE],
    [`--${CUT3_RELATION_EVENT_MODE}`, CUT3_RELATION_EVENT_MODE]
  ];
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error('fetch must not run during parse'); };
  try {
    for (const [flag, expectedMode] of modes) {
      const parsed = parseCanaryArgs([flag], {});
      assert.equal(parsed.kind, 'run');
      assert.equal(parsed.mode, expectedMode);
      assert.equal(parsed.artifactPath.startsWith(tmpdir()), true);
      assert.equal(parsed.artifactPath.includes(resolve('.')), false);
    }
    assert.equal(canaryMode(['--opening-only']), OPENING_ONLY_MODE);
    assert.throws(() => canaryMode([]), /CANARY_CLI_MODE_REQUIRED/);
    assert.throws(() => parseCanaryArgs(['--opening-only', '--cut3-relation-event']), /CANARY_CLI_MODE_CONFLICT/);
    assert.throws(() => parseCanaryArgs(['--opening-only', '--artifact-path', resolve('phase12h-opening-success.json')]), /CANARY_OUTPUT_PATH_FORBIDDEN/);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetchCalls, 0);
  assert.equal(defaultCanaryArtifactPath(OPENING_ONLY_MODE).startsWith(tmpdir()), true);
});

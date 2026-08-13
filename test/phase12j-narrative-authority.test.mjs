import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt, buildMindMonitorContext } from '../src/engine/extract-prompt.js';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { resolvePlayerDialoguePolicy, validatePlayerDialogueAgainstPolicy } from '../src/engine/scene-cast.js';

const master = {
  characters: [
    { character_id: 'heroine1', name: '윤민아', gender: 'female', position: '사원', role_title: '기획자', prompt_card: { personality: '신중하고 관찰형이다.', speech: '짧고 정확하게 말한다.', csa_style: '겉으로 차분하지만 속으로 오래 생각한다.' } },
    { character_id: 'heroine3', name: '서원희', gender: 'female', position: '대리', role_title: '팀 리더', prompt_card: { personality: '단호하고 실무적이다.', speech: '간결한 존댓말을 쓴다.', csa_style: '규정과 관계를 분리해 판단한다.' } }
  ],
  general_npcs: []
};

const rule = {
  id: 'csa-required', active: true, content: '업무 중에는 지정된 복장을 착용하지 않는다.', strength: 'medium', created_turn: 2,
  preset: {
    template_id: 'work_without_underwear', authority_tier: 'medium', subject_scope: 'female_employee', mode: 'continuous',
    execution: { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { underwear_bottom: 'removed' } }
  }
};

function saveWithRule() {
  return {
    csa_active: ['csa-required'], csa_rules: { 'csa-required': rule },
    scene: { version: 1, scene_id: 'office', location_id: 'office', present_npc_ids: ['heroine1', 'heroine3'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 },
    npc_scene_state: {
      heroine1: { clothing: { underwear_bottom: 'worn' }, posture: 'standing', position_label: '회의실' },
      heroine3: { clothing: { underwear_bottom: 'worn' }, posture: 'standing', position_label: '회의실' }
    },
    npc_relationship_state: { heroine1: { closeness: 2 }, heroine3: { closeness: 8 } },
    world_state: { game_time: { day: 1, minute_of_day: 600 } }
  };
}

test('required-now CSA projects mandatory execution and no implementation delay', () => {
  const projection = buildStoryWorldProjection({ save: saveWithRule(), master, sceneActorIds: ['heroine1', 'heroine3'], expectedTurn: 2 });
  const worldRule = projection.world_rules[0];
  assert.equal(worldRule.execution_policy, 'mandatory_execution');
  assert.ok(worldRule.resolved_facts.every(fact => fact.trigger_state === 'required_now'));
  assert.ok(worldRule.resolved_facts.every(fact => fact.execution_policy === 'mandatory_execution'));
  assert.ok(worldRule.resolved_facts.every(fact => fact.implementation_delay_allowed === false));
  assert.equal(projection.scene_obligations.length, 2);
});

test('Story prompt keeps required execution authoritative while reaction remains free', () => {
  const messages = buildStoryPrompt({
    edition: { editionId: 'company-v1', characters: { characters: Object.fromEntries(master.characters.map(item => [item.character_id, item])) }, generalNpcs: { profiles: {} } },
    context: { save: { data: saveWithRule() }, recent_turns: [] }, expectedTurn: 2,
    sceneCastContract: { present_npc_ids: ['heroine1', 'heroine3'], entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null }
  });
  const system = messages[0].content;
  assert.match(system, /mandatory_execution/);
  assert.match(system, /standalone visible \[ACTING enactment_id/);
  assert.match(system, /Do not repeat, defer, renegotiate, await approval for/);
  assert.match(system, /reaction-only presentation/);
  assert.match(system, /never a new plan, promise, apology, concession/);
  assert.match(system, /Do not invent an unrequested player movement, dialogue, apology/);
});

test('player dialogue may paraphrase intent but cannot introduce a reversal or apology decision', () => {
  const policy = resolvePlayerDialoguePolicy('"당장 규정대로 해."', master);
  assert.equal(validatePlayerDialogueAgainstPolicy('지금 바로 규정대로 적용해 주세요.', policy).ok, true);
  assert.equal(validatePlayerDialogueAgainstPolicy('제가 꼭 책임지고 약속할게요.', policy).ok, false);
});

test('Mind Monitor prompt receives per-NPC canon and active rule context, never player THOUGHT', () => {
  const edition = { editionId: 'company-v1', characters: { characters: Object.fromEntries(master.characters.map(item => [item.character_id, item])) }, generalNpcs: { profiles: {} } };
  const context = { save: { data: saveWithRule() }, recent_turns: [] };
  const monitorContext = buildMindMonitorContext({ context, edition, targetIds: ['heroine1', 'heroine3'], expectedTurn: 2 });
  assert.equal(monitorContext.length, 2);
  assert.equal(monitorContext[0].personality, '신중하고 관찰형이다.');
  assert.equal(monitorContext[1].personality, '단호하고 실무적이다.');
  assert.equal(monitorContext[0].active_csa[0].execution_policy, 'mandatory_execution');
  assert.equal('player_inner_thought' in monitorContext[0], false);

  const payload = JSON.parse(buildExtractPrompt({
    context, edition, npcIds: new Set(['heroine1', 'heroine3']), expectedTurn: 2,
    storyText: '[SCENE]회의실이다.[THOUGHT]나는 깜짝 놀랐다.',
    parsedStory: { dialogue_lines: [{ speaker_id: 'heroine1', text: '알겠습니다.' }] }
  })[1].content);
  assert.deepEqual(payload.mind_monitor_targets, ['heroine1', 'heroine3']);
  assert.deepEqual(payload.mind_monitor_context, monitorContext);
  assert.match(JSON.stringify(payload.mind_monitor_context), /신중하고 관찰형/);
  assert.doesNotMatch(JSON.stringify(payload.mind_monitor_context), /나는 깜짝 놀랐다/);
});

test('malformed one-NPC Mind Monitor remains fail-open with a warning', () => {
  const result = normalizeFreshExtractObservationV2({
    extract_version: 2, outcome: 'success',
    scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: ['heroine1'], focal_candidate_id: null, remote_speaker_ids: [], evidence: [] },
    player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
    mind_monitor: { heroine1: { surface: 42, subconscious: '괜찮다.' } }, action_target_id: null, image_character_id: null, image_selection: null,
    csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: []
  }, { npcIds: new Set(['heroine1']), storyText: '윤민아가 고개를 끄덕였다.', requiredMindMonitorIds: ['heroine1'] });
  assert.deepEqual(result.mind_monitor, {});
  assert.ok(result.warnings.some(warning => warning.startsWith('extract_optional_dropped:mind_monitor')));
  assert.ok(result.warnings.includes('mind_monitor_missing:heroine1'));
});

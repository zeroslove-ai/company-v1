import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { composeCanonicalStory } from '../src/engine/csa/mandatory-enactment.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';

const save = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));
const npcIds = new Set(['npc-hayeon', 'npc-areum', 'npc-minsu']);
const observation = {
  extract_version: 2, outcome: 'success',
  scene_observation: { scene_id: null, location_id: null, final_present_npc_ids: null, entered_npc_ids: [], exited_npc_ids: [], presence_is_final: false, remote_speaker_ids: [], evidence: [] },
  player_observation: {}, npc_observations: {}, events: { general: [], sexual: [] }, evidence: {}, elapsed_minutes: 3,
  mind_monitor: {}, action_target_id: null, image_character_id: null, image_selection: null,
  csa_trigger_evaluations: [], csa_runtime_updates: [], turn_summary: '', warnings: []
};

test('12Q Engine mandatory enactments are metadata-only and never enter visible canonical Story', () => {
  const story = composeCanonicalStory({
    institutionalSegments: [{ canonical_text: '회사 공지' }],
    engineEnactments: [{ canonical_text: 'Engine prose must not be visible' }],
    providerNarrative: 'Provider narrative'
  });
  assert.equal(story, '회사 공지\n\nProvider narrative');
});

test('12Q fresh Extract CSA compatibility arrays are ignored', () => {
  const normalized = normalizeFreshExtractObservationV2({
    ...observation,
    csa_trigger_evaluations: [{ csa_id: 'fake', trigger_state: 'required_now' }],
    csa_runtime_updates: [{ csa_id: 'fake', character_id: 'npc-hayeon', status: 'active' }]
  }, { npcIds, storyText: 'ordinary Story' });
  assert.deepEqual(normalized.csa_trigger_evaluations, []);
  assert.deepEqual(normalized.csa_runtime_updates, []);
  assert.ok(normalized.warnings.includes('fresh_csa_observation_ignored'));
});

test('12Q Commit ignores fake Extract CSA runtime updates', () => {
  const currentSave = { ...structuredClone(save), csa_active: [], csa_rules: {} };
  const nextSave = structuredClone(currentSave);
  const result = reduceCsaCommitState({
    currentSave, nextSave,
    observation: { ...observation, csa_runtime_updates: [{ csa_id: 'fake', character_id: 'npc-hayeon', status: 'active' }], csa_trigger_evaluations: [{ csa_id: 'fake' }] },
    canonicalScene: { present_npc_ids: ['npc-hayeon'] },
    action: { action_kind: 'player_turn' }, expectedTurn: 1
  });
  assert.deepEqual(result.nextSave.csa_runtime_state, currentSave.csa_runtime_state);
});

test('12Q visible ACTING preserves source order and exact enactment identity', () => {
  const raw = '[SCENE]room[/SCENE]\n[ACTING enactment_id="turn:1:csa_2:heroine3:0"]\nShe moves.\n[/ACTING]\n[DIALOGUE speaker_id="heroine3"]\nHello.\n[/DIALOGUE]\n[THOUGHT]Think.[/THOUGHT]\n[CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d';
  const parsed = parseFreshNarrativeV2(raw, { master: { characters: [{ character_id: 'heroine3', name: 'Jena' }] } });
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'acting', 'dialogue', 'player_inner_thought', 'choice', 'choice', 'choice', 'choice']);
  assert.equal(parsed.acting_events[0].enactment_id, 'turn:1:csa_2:heroine3:0');
  assert.equal(parsed.acting_events[0].text, 'She moves.');
});

test('player ACTING posture is not a durable observation without Extract evidence', () => {
  const rawStory = '[SCENE]room[/SCENE]\nPlayer sits.';
  const result = reduceGameplayCommit({
    currentSave: save,
    observation,
    parsedStory: { raw: rawStory, acting_events: [{ actor_id: 'player', posture_after: 'sitting', text: 'Player sits.' }], dialogue_lines: [], choices: [] },
    rawStory,
    action: { action_id: 'a', turn_id: 't', action_kind: 'player_turn' },
    expectedTurn: 8, npcIds, mapLocations: []
  });
  assert.equal(result.nextSave.player_scene_state.posture, undefined);
  assert.notEqual(result.nextSave.player_scene_state.updated_turn, 8);
});

test('12Q player private CSA origin is present in Story payload but not ordinary player_action', () => {
  const [system, user] = buildStoryPrompt({
    edition: { id: 'company-v1', characters: { characters: {} }, map: { locations: [] } },
    context: { save: { data: save } },
    playerAction: '',
    expectedTurn: 1,
    npcIds: [],
    catalogs: {},
    engineCanonicalSegments: [],
    playerPrivateOrigin: { kind: 'csa_transaction', initiated_by_player: true, operation: 'activate', affected_rule_ids: ['csa_1'] }
  });
  const payload = JSON.parse(user.content);
  assert.equal(payload.player_action, undefined);
  assert.deepEqual(payload.player_private_origin.affected_rule_ids, ['csa_1']);
  assert.match(system.content, /ACTING enactment_id/);
});

test('12Q.1 signed activation and Engine ACTING reach one Commit result', () => {
  const currentSave = structuredClone(save);
  currentSave.csa_active = [];
  currentSave.csa_rules = {};
  const rule = {
    id: 'csa_2', active: true, source_type: 'preset', created_turn: 8,
    content: 'female employees work without a bra',
    preset: {
      template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee', mode: 'continuous',
      execution: { kind: 'clothing_state', action: 'set_clothing_state', trigger_kind: 'always_during_work', target_required: false, required_state: { underwear_top: 'removed' } }
    }
  };
  const rawStory = '[ACTING enactment_id="turn:8:csa_2:npc-hayeon:0"]\\nThe required state is visible.\\n[/ACTING]';
  const result = reduceGameplayCommit({
    currentSave,
    observation,
    parsedStory: { raw: rawStory, acting_events: [{ enactment_id: 'turn:8:csa_2:npc-hayeon:0', actor_id: 'npc-hayeon', text: 'The required state is visible.' }], dialogue_lines: [], choices: [] },
    rawStory,
    action: { action_id: 'action-8', turn_id: 'turn-8', action_kind: 'app_transaction' },
    expectedTurn: 8,
    master: { characters: [], general_npcs: [
      { npc_id: 'npc-hayeon', name: 'Hayeon', sex: 'female', type: 'employee' },
      { npc_id: 'npc-areum', name: 'Areum', sex: 'female', type: 'employee' },
      { npc_id: 'npc-minsu', name: 'Minsu', sex: 'female', type: 'employee' }
    ] },
    npcIds,
    structuredAction: { version: 1, type: 'app_transaction', operations: [{ domain: 'csa', operation: 'activate', id: 'csa_2' }] },
    transactionResolution: { previous_csa_active: [], previous_csa_rules: {}, next_csa_active: ['csa_2'], next_csa_rules: { csa_2: rule } },
    engineEnactments: [{ authority: 'engine', segment_id: 'turn:8:csa_2:npc-hayeon:0', source_rule_id: 'csa_2', actor_id: 'npc-hayeon', execution_kind: 'clothing_state', action: 'set_clothing_state', required_state: { underwear_top: 'removed' } }]
  });
  assert.deepEqual(result.nextSave.csa_active, ['csa_2']);
  assert.equal(result.nextSave.csa_rules.csa_2.active, true);
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.underwear_top, 'removed');
  assert.equal(result.nextSave.turn_state.committed_turn, 7);
  assert.equal(result.nextSave.turn_state.expected_turn, 9);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { composeCanonicalStory } from '../src/engine/csa/mandatory-enactment.js';
import { normalizeFreshExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';
import { reduceCsaCommitState } from '../src/engine/runtime-core/csa-commit-reducer.js';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
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

test('player private CSA origin is present in Story payload but does not create a physical enactment contract', () => {
  const [, user] = buildStoryPrompt({
    edition: { id: 'company-v1', characters: { characters: {} }, map: { locations: [] } },
    context: { save: { data: save } },
    playerAction: '',
    expectedTurn: 1,
    npcIds: [],
    catalogs: {},
    playerPrivateOrigin: { kind: 'csa_transaction', initiated_by_player: true, operation: 'activate', affected_rule_ids: ['csa_1'] }
  });
  const payload = JSON.parse(user.content);
  assert.equal(payload.player_action, undefined);
  assert.deepEqual(payload.player_private_origin.affected_rule_ids, ['csa_1']);
  assert.equal(payload.player_private_origin.initiated_by_player, true);
  assert.equal(payload.player_private_origin.operation, 'activate');
  assert.equal(payload.player_private_origin.kind, 'csa_transaction');
});

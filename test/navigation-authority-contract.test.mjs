import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import edition from '../src/api/edition.js';
import { resolvePlayerNavigationIntent } from '../src/engine/scene-cast.js';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { normalizeExtractObservationV2 } from '../src/engine/runtime-core/extract-observation.js';

const master = {
  characters: Object.values(edition.characters.characters),
  general_npcs: Object.values(edition.generalNpcs.profiles)
};
const mapLocations = edition.map.locations;
const npcIds = new Set(master.characters.concat(master.general_npcs).map(entry => entry.character_id ?? entry.npc_id));
const baseSave = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url)));

function navigationSave(locationId = 'brand_strategy_meeting_room') {
  const save = structuredClone(baseSave);
  save.player = { ...(save.player ?? {}), player_id: 'player-1', department_id: 'brand_strategy' };
  save.scene = {
    version: 1,
    scene_id: locationId,
    location_id: locationId,
    beat: 1,
    goal: null,
    focus_thread: null,
    present_npc_ids: [],
    focal_character_id: null,
    last_speaker_id: null,
    updated_turn: 1
  };
  save.scene_state = { ...(save.scene_state ?? {}), location_id: locationId, participants: ['player-1'] };
  save.player_scene_state = { ...(save.player_scene_state ?? {}), location_id: locationId };
  return save;
}

function intent(playerAction, locationId = 'brand_strategy_meeting_room') {
  return resolvePlayerNavigationIntent({
    save: navigationSave(locationId),
    master,
    playerAction,
    mapLocations
  });
}

function observation(locationId, rawStory) {
  return normalizeExtractObservationV2({
    extract_version: 2,
    outcome: 'success',
    scene_observation: {
      scene_id: null,
      location_id: locationId,
      final_present_npc_ids: [],
      entered_npc_ids: [],
      exited_npc_ids: [],
      focal_candidate_id: null,
      presence_is_final: false,
      remote_speaker_ids: [],
      evidence: []
    },
    player_observation: {},
    npc_observations: {},
    events: { general: [], sexual: [] },
    evidence: {},
    elapsed_minutes: 3,
    mind_monitor: {},
    action_target_id: null,
    image_character_id: null,
    image_selection: null,
    csa_trigger_evaluations: [],
    csa_runtime_updates: [],
    turn_summary: '',
    warnings: []
  }, { npcIds, storyText: rawStory, expectedTurn: 2, actionId: 'navigation-authority' });
}

test('explicit player navigation resolves a registered destination', () => {
  assert.deepEqual(intent('브랜드전략팀 회의실로 이동한다', 'brand_strategy_office'), {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_meeting_room',
    target_npc_id: null,
    source: 'explicit_location'
  });
});

test('explicit self movement preserves player navigation', () => {
  assert.deepEqual(intent('내가 1층 로비로 이동한다'), {
    kind: 'player_navigation',
    destination_location_id: 'lobby',
    target_npc_id: null,
    source: 'explicit_location'
  });
});

test('registered NPC-directed movement does not become player navigation', () => {
  assert.equal(intent('서원희가 1층 로비로 이동한다'), null);
  assert.equal(intent('윤민아는 교육장으로 이동한다'), null);
});

test('unknown or ambiguous movement subject fails closed for player navigation', () => {
  assert.equal(intent('홍길동이 1층 로비로 이동한다'), null);
  assert.equal(intent('윤민아와 서원희가 1층 로비로 이동한다'), null);
});

test('registered NPC object/goal form still navigates the player to the catalog destination', () => {
  assert.deepEqual(intent('민아 보러간다'), {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_office',
    target_npc_id: 'heroine2',
    source: 'registered_npc_destination'
  });
});

test('NPC movement text cannot change canonical player location through Commit', () => {
  const currentSave = navigationSave('brand_strategy_meeting_room');
  const playerAction = '서원희가 1층 로비로 이동한다';
  const result = reduceGameplayCommit({
    currentSave,
    observation: observation('lobby', playerAction),
    parsedStory: { choices: [], dialogue_lines: [] },
    rawStory: playerAction,
    action: { action_id: 'npc-movement', turn_id: 'turn-2', action_kind: 'player_turn', player_action: playerAction },
    expectedTurn: 2,
    master,
    npcIds,
    mapLocations,
    navigationIntent: intent(playerAction)
  });
  assert.equal(result.canonical_scene.location_id, 'brand_strategy_meeting_room');
  assert.equal(result.nextSave.player_scene_state.location_id, 'brand_strategy_meeting_room');
});

test('player navigation wins over a conflicting Extract location proposal', () => {
  const currentSave = navigationSave('brand_strategy_office');
  const navigationIntent = intent('브랜드전략팀 회의실로 이동한다', 'brand_strategy_office');
  const rawStory = 'The story observes the lobby.';
  const extracted = observation('lobby', rawStory);
  extracted.scene_observation.evidence = [{ kind: 'scene', location_id: 'lobby', quote: rawStory }];
  const result = reduceGameplayCommit({
    currentSave,
    observation: extracted,
    parsedStory: { choices: [], dialogue_lines: [] },
    rawStory,
    action: { action_id: 'player-movement', turn_id: 'turn-2', action_kind: 'player_turn', player_action: '브랜드전략팀 회의실로 이동한다' },
    expectedTurn: 2,
    master,
    npcIds,
    mapLocations,
    navigationIntent
  });
  assert.equal(result.canonical_scene.location_id, 'brand_strategy_meeting_room');
});

test('stale NPC scene location is not used as navigation authority', () => {
  const save = navigationSave();
  save.npc_scene_state = { heroine2: { location_id: 'unrelated_stale_location' } };
  const result = resolvePlayerNavigationIntent({
    save,
    master,
    playerAction: '민아 보러간다',
    mapLocations
  });
  assert.equal(result.destination_location_id, 'brand_strategy_office');
});

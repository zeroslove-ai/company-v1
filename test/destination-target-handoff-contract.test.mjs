import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { projectStorySaveForNavigation } from '../src/api/turn-routes.js';
import { buildStoryCharacterProjection } from '../src/engine/story-prompt.js';
import { reduceGameplayCommit } from '../src/engine/runtime-core/commit-reducer.js';
import { reduceCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';
import { resolvePlayerNavigationIntent } from '../src/engine/scene-cast.js';

const master = {
  characters: Object.values(edition.characters.characters),
  general_npcs: Object.values(edition.generalNpcs.profiles)
};
const mapLocations = edition.map.locations;
const action = '\uC724\uBBFC\uC544 \uBCF4\uB7EC\uAC04\uB2E4';
const sourceScene = {
  version: 1,
  scene_id: 'brand_strategy_meeting_room',
  location_id: 'brand_strategy_meeting_room',
  beat: 2,
  goal: null,
  focus_thread: null,
  present_npc_ids: ['heroine4'],
  focal_character_id: 'heroine4',
  last_speaker_id: 'heroine4',
  updated_turn: 2
};
const sourceSave = {
  edition: 'company-v1',
  save_schema_version: 1,
  turn_state: { committed_turn: 2 },
  player: { player_id: 'player-1' },
  scene: sourceScene,
  player_scene_state: {},
  player_sexual_state: {},
  npc_scene_state: {},
  csa_active: [],
  csa_rules: {},
  world_state: { game_time: { day: 1, minute_of_day: 600 } },
  last_choices: [],
  last_choice_meta: []
};
const sameLocationSave = {
  ...sourceSave,
  scene: {
    ...sourceScene,
    scene_id: 'brand_strategy_office',
    location_id: 'brand_strategy_office',
    present_npc_ids: ['heroine3', 'heroine1'],
    focal_character_id: 'heroine3',
    last_speaker_id: 'heroine1',
    updated_turn: 4
  }
};

function exactNavigation(save = sourceSave) {
  return resolvePlayerNavigationIntent({ save, master, mapLocations, playerAction: action });
}

function observation({ entered_npc_ids = [], evidence = [], speakers = [], elapsed_minutes = 3 } = {}) {
  return {
    outcome: 'success',
    scene_observation: {
      scene_id: null,
      location_id: null,
      final_present_npc_ids: null,
      entered_npc_ids,
      exited_npc_ids: [],
      presence_is_final: false,
      focal_candidate_id: null,
      remote_speaker_ids: [],
      evidence
    },
    player_observation: { physical: null, sexual: null },
    npc_observations: {},
    mind_monitor: {},
    turn_summary: 'navigation handoff',
    dialogue_lines: speakers.map(speaker_id => ({ speaker_id })),
    elapsed_minutes
  };
}

test('exact registered NPC navigation keeps the canonical destination and target', () => {
  assert.deepEqual(exactNavigation(), {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_office',
    target_npc_id: 'heroine2',
    source: 'explicit_npc_destination'
  });
});

test('destination Story save and cast contain only the exact registered target', () => {
  const projected = projectStorySaveForNavigation(sourceSave, exactNavigation(), { master, mapLocations });
  assert.equal(projected.scene.location_id, 'brand_strategy_office');
  assert.deepEqual(projected.scene.present_npc_ids, ['heroine2']);
  assert.equal(projected.scene.present_npc_ids.includes('heroine4'), false);

  const projection = buildStoryCharacterProjection({
    edition,
    playerAction: action,
    sceneCastContract: { present_npc_ids: projected.scene.present_npc_ids }
  });
  assert.deepEqual(projection.scene_actor_ids, ['heroine2']);
  assert.equal(Object.hasOwn(projection.scene_actors, 'heroine2'), true);
  assert.equal(Object.hasOwn(projection.scene_actors, 'heroine4'), false);
});

test('canonical commit carries the exact destination target but not source presence', () => {
  const result = reduceGameplayCommit({
    currentSave: sourceSave,
    observation: observation({ speakers: ['heroine4'] }),
    parsedStory: { dialogue_lines: [{ speaker_id: 'heroine4' }] },
    rawStory: 'heroine4 remains at the source location',
    action: { action_id: 'action-1', turn_id: 'turn-3', action_kind: 'ordinary' },
    expectedTurn: 3,
    master,
    npcIds: new Set(Object.keys(edition.characters.characters).concat(Object.keys(edition.generalNpcs.profiles))),
    mapLocations,
    navigationIntent: exactNavigation()
  });
  assert.equal(result.nextSave.scene.location_id, 'brand_strategy_office');
  assert.deepEqual(result.nextSave.scene.present_npc_ids, ['heroine2']);
  assert.equal(result.nextSave.scene.present_npc_ids.includes('heroine4'), false);
});

test('destination Story evidence may add a valid accompanying NPC', () => {
  const result = reduceCanonicalScene({
    currentScene: sourceScene,
    authoritativeLocationId: 'brand_strategy_office',
    mapLocations,
    master,
    npcIds: new Set(['heroine1', 'heroine2', 'heroine4']),
    expectedTurn: 3,
    observation: {
      outcome: 'success',
      location_id: null,
      entered_npc_ids: ['heroine2'],
      exited_npc_ids: [],
      explicit_speaker_ids: [],
      remote_speaker_ids: [],
      evidence: [{ kind: 'presence', character_id: 'heroine1', location_id: 'brand_strategy_office', quote: 'heroine1 is here' }]
    }
  });
  assert.deepEqual(result.present_npc_ids, ['heroine2', 'heroine1']);
});

test('location-only navigation does not invent a target NPC', () => {
  const intent = resolvePlayerNavigationIntent({
    save: sourceSave,
    master,
    mapLocations,
    playerAction: '\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uC0AC\uBB34\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4'
  });
  assert.deepEqual(intent, {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_office',
    source: 'explicit_location'
  });
  const projected = projectStorySaveForNavigation(sourceSave, intent, { master, mapLocations });
  assert.deepEqual(projected.scene.present_npc_ids, []);
});

test('same-location exact registered NPC visits hand off Story and Commit cast without moving time or location', () => {
  const sameLocation = exactNavigation(sameLocationSave);
  assert.deepEqual(sameLocation, {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_office',
    target_npc_id: 'heroine2',
    source: 'explicit_npc_destination'
  });
  const projected = projectStorySaveForNavigation(sameLocationSave, sameLocation, { master, mapLocations });
  assert.equal(projected.scene.location_id, 'brand_strategy_office');
  assert.equal(projected.scene.scene_id, 'brand_strategy_office');
  assert.deepEqual(projected.scene.present_npc_ids, ['heroine2']);
  assert.equal(projected.scene.present_npc_ids.includes('heroine3'), false);
  assert.equal(projected.scene.present_npc_ids.includes('heroine1'), false);
  assert.deepEqual(projected.world_state.game_time, sameLocationSave.world_state.game_time);
  const projection = buildStoryCharacterProjection({
    edition,
    playerAction: action,
    sceneCastContract: { present_npc_ids: projected.scene.present_npc_ids }
  });
  assert.deepEqual(projection.scene_actor_ids, ['heroine2']);
  assert.equal(Object.hasOwn(projection.scene_actors, 'heroine2'), true);
  assert.equal(Object.hasOwn(projection.scene_actors, 'heroine3'), false);
  assert.equal(Object.hasOwn(projection.scene_actors, 'heroine1'), false);

  const result = reduceGameplayCommit({
    currentSave: sameLocationSave,
    observation: observation({ speakers: ['heroine2'], elapsed_minutes: 0 }),
    parsedStory: { dialogue_lines: [{ speaker_id: 'heroine2' }] },
    rawStory: 'heroine2 receives the exact registered visit at the existing office location',
    action: { action_id: 'same-location-action', turn_id: 'turn-5', action_kind: 'ordinary' },
    expectedTurn: 5,
    master,
    npcIds: new Set(Object.keys(edition.characters.characters).concat(Object.keys(edition.generalNpcs.profiles))),
    mapLocations,
    navigationIntent: sameLocation
  });
  assert.equal(result.nextSave.scene.location_id, 'brand_strategy_office');
  assert.equal(result.nextSave.scene.scene_id, 'brand_strategy_office');
  assert.deepEqual(result.nextSave.scene.present_npc_ids, ['heroine2']);
  assert.equal(result.nextSave.scene.focal_character_id, 'heroine2');
  assert.equal(result.nextSave.scene.present_npc_ids.includes('heroine3'), false);
  assert.equal(result.nextSave.scene.present_npc_ids.includes('heroine1'), false);
});

test('same-location, ambiguous, and unregistered visits remain unresolved', () => {
  assert.equal(resolvePlayerNavigationIntent({ save: sameLocationSave, master, mapLocations, playerAction: '브랜드전략팀 사무실로 이동한다' }), null);
  assert.equal(resolvePlayerNavigationIntent({ save: sourceSave, master, mapLocations, playerAction: '\uC724\uBBFC\uC544\uAC00 \uB85C\uBE44\uC5D0\uC11C \uC77C\uD55C\uB2E4' }), null);
  assert.equal(resolvePlayerNavigationIntent({ save: sourceSave, master, mapLocations, playerAction: 'visit Unknown Person' }), null);
});

test('general NPCs use the same unique canonical destination identity rule', () => {
  const generalMaster = { characters: [], general_npcs: [{ npc_id: 'general_test', id: 'general_test', name: 'Taylor' }] };
  const generalMap = [{ location_id: 'source' }, { location_id: 'target', default_npc_ids: ['general_test'] }];
  const save = { scene: { ...sourceScene, scene_id: 'source', location_id: 'source', present_npc_ids: [], focal_character_id: null, last_speaker_id: null } };
  const intent = resolvePlayerNavigationIntent({ save, master: generalMaster, mapLocations: generalMap, playerAction: 'go see Taylor' });
  assert.deepEqual(intent, { kind: 'player_navigation', destination_location_id: 'target', target_npc_id: 'general_test', source: 'explicit_npc_destination' });
  const projected = projectStorySaveForNavigation(save, intent, { master: generalMaster, mapLocations: generalMap });
  assert.deepEqual(projected.scene.present_npc_ids, ['general_test']);
});

test('crafted unknown target and duplicate evidence cannot create a fake identity', () => {
  const projected = projectStorySaveForNavigation(sourceSave, {
    kind: 'player_navigation',
    destination_location_id: 'brand_strategy_office',
    target_npc_id: 'fake-mina',
    source: 'explicit_npc_destination'
  }, { master, mapLocations });
  assert.deepEqual(projected.scene.present_npc_ids, []);
  const wrongDestination = projectStorySaveForNavigation(sourceSave, {
    kind: 'player_navigation',
    destination_location_id: 'lobby',
    target_npc_id: 'heroine2',
    source: 'explicit_npc_destination'
  }, { master, mapLocations });
  assert.deepEqual(wrongDestination.scene.present_npc_ids, []);
  const result = reduceCanonicalScene({
    currentScene: sourceScene,
    authoritativeLocationId: 'brand_strategy_office',
    mapLocations,
    master,
    npcIds: new Set(['heroine2', 'heroine4']),
    expectedTurn: 3,
    observation: { outcome: 'success', location_id: null, entered_npc_ids: ['heroine2', 'heroine2', 'fake-mina'], exited_npc_ids: [], explicit_speaker_ids: [], remote_speaker_ids: [], evidence: [] }
  });
  assert.deepEqual(result.present_npc_ids, ['heroine2']);
});

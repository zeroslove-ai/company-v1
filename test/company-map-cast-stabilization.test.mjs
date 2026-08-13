import test from 'node:test';
import assert from 'node:assert/strict';
import characterContent from '../content/characters.json' with { type: 'json' };
import mapContent from '../content/map.json' with { type: 'json' };
import {
  buildSceneCastContract,
  resolveNavigationLocation,
  resolveNpcLocationId
} from '../src/engine/scene-cast.js';

const CHARACTERS = characterContent.characters;
const LOCATIONS = mapContent.locations;
const LOCATION_IDS = new Set(LOCATIONS.map(location => location.location_id));
const MASTER = {
  characters: Object.entries(CHARACTERS).map(([id, value]) => ({ character_id: id, ...value })),
  general_npcs: []
};

function save({ participants = ['player-1'], npcSceneState = {}, locationId = 'brand_strategy_meeting_room' } = {}) {
  return {
    scene: {
      version: 1,
      scene_id: locationId,
      location_id: locationId,
      present_npc_ids: participants.filter(id => id !== 'player-1'),
      focal_character_id: null,
      last_speaker_id: null,
      beat: 0,
      updated_turn: 1
    },
    scene_state: { scene_id: 'legacy', location_id: locationId, participants },
    npc_scene_state: npcSceneState,
    last_npcs_present: ['heroine1', 'heroine2']
  };
}

test('canonical scene presence wins over conflicting legacy participants', () => {
  const contract = buildSceneCastContract({
    save: {
      ...save({ participants: ['player-1', 'heroine1'] }),
      scene: { ...save({ participants: ['player-1', 'heroine1'] }).scene, present_npc_ids: ['heroine1'] },
      scene_state: { location_id: 'brand_strategy_meeting_room', participants: ['player-1', 'heroine1', 'heroine2'] }
    },
    master: MASTER,
    mapLocations: LOCATIONS,
    playerAction: '업무를 진행한다.'
  });
  assert.deepEqual(contract.present_npc_ids, ['heroine1']);
  assert.equal('allowed_speaker_ids' in contract, false);
});

test('legacy-only save still hydrates presence through the compatibility adapter', () => {
  const contract = buildSceneCastContract({
    save: { scene_state: { location_id: 'brand_strategy_meeting_room', participants: ['player-1', 'heroine1'] } },
    master: MASTER,
    mapLocations: LOCATIONS,
    playerAction: '업무를 진행한다.'
  });
  assert.deepEqual(contract.present_npc_ids, ['heroine1']);
  assert.deepEqual(contract.present_npc_ids, ['heroine1']);
});

test('pending entrance and remote contact remain explicit projections, not canonical presence', () => {
  const base = { scene: { version: 1, scene_id: 'brand_strategy_meeting_room', location_id: 'brand_strategy_meeting_room', present_npc_ids: [], focal_character_id: null, last_speaker_id: null, beat: 0, goal: null, focus_thread: null, updated_turn: 1 } };
  const entering = buildSceneCastContract({ save: { ...base, pending_scene_entrances: ['heroine2'] }, master: MASTER, mapLocations: LOCATIONS, playerAction: '업무를 진행한다.' });
  assert.deepEqual(entering.present_npc_ids, []);
  assert.deepEqual(entering.entering_npc_ids, ['heroine2']);
  assert.equal('allowed_speaker_ids' in entering, false);

  const remote = buildSceneCastContract({ save: { ...base, pending_remote_contacts: ['heroine2'] }, master: MASTER, mapLocations: LOCATIONS, playerAction: '업무를 진행한다.' });
  assert.deepEqual(remote.present_npc_ids, []);
  assert.deepEqual(remote.remote_npc_ids, ['heroine2']);
  assert.equal('allowed_speaker_ids' in remote, false);
});

test('registered NPC defaults and stored locations resolve independently of scene presence', () => {
  const charactersMap = Object.fromEntries(Object.entries(CHARACTERS).map(([id, value]) => [id, value]));
  assert.equal(resolveNpcLocationId({ save: save(), npcId: 'heroine2', charactersMap, mapLocations: LOCATIONS }), 'brand_strategy_office');
  assert.equal(resolveNpcLocationId({ save: save({ npcSceneState: { heroine2: { location_id: 'lounge' } } }), npcId: 'heroine2', charactersMap, mapLocations: LOCATIONS }), 'lounge');
});

test('explicit location movement resolves only a location id', () => {
  const resolved = resolveNavigationLocation({ save: save({ locationId: 'brand_strategy_office' }), master: MASTER, playerAction: '직원 라운지로 이동한다', mapLocations: LOCATIONS });
  assert.equal(resolved, 'employee_lounge');
});

test('NPC-name movement resolves the NPC location without creating a destination actor', () => {
  const resolved = resolveNavigationLocation({ save: save({ locationId: 'brand_strategy_meeting_room' }), master: MASTER, playerAction: '윤민아 보러 간다', mapLocations: LOCATIONS });
  assert.equal(resolved, 'brand_strategy_office');
});

test('unsupported movement evidence resolves to null and same-location navigation is a no-op', () => {
  assert.equal(resolveNavigationLocation({ save: save(), master: MASTER, playerAction: '어디론가 이동하고 싶다', mapLocations: LOCATIONS }), null);
  assert.equal(resolveNavigationLocation({ save: save(), master: MASTER, playerAction: '브랜드전략팀 회의실로 이동한다', mapLocations: LOCATIONS }), null);
});

test('SceneCast exposes generic speaker projections and no movement contract fields', () => {
  const contract = buildSceneCastContract({ save: save({ participants: ['player-1', 'heroine1'] }), master: MASTER, mapLocations: LOCATIONS, playerAction: '브랜드전략팀 사무실로 이동한다' });
  for (const key of ['transition_mode', 'destination_npc_ids', 'destination_scene_id', 'destination_location_id']) assert.equal(key in contract, false, key);
  assert.deepEqual(contract.present_npc_ids, ['heroine1']);
});

test('all registered NPCs have valid default locations', () => {
  for (const [id, character] of Object.entries(CHARACTERS)) {
    assert.ok(character.default_location_id, `${id} missing default_location_id`);
    assert.ok(LOCATION_IDS.has(character.default_location_id), `${id} default location is not registered`);
  }
});

test('relative private-office navigation resolves only an unambiguous department office', () => {
  const map = [{ location_id: 'brand_strategy_office', name: '\uBE0C\uB79C\uB4DC\uC804\uB7B5\uD300 \uC0AC\uBB34\uC2E4', location_type: 'office_floor', department_id: 'brand_strategy' }];
  const resolved = resolveNavigationLocation({
    save: { ...save(), player: { department_id: 'brand_strategy' } },
    master: MASTER,
    playerAction: '\uB0B4 \uAC1C\uC778\uC2E4\uB85C \uC774\uB3D9\uD55C\uB2E4',
    mapLocations: map
  });
  assert.equal(resolved, 'brand_strategy_office');
});

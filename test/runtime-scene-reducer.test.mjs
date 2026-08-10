import test from 'node:test';
import assert from 'node:assert/strict';
import { GameCoreError } from '../src/engine/errors.js';
import { hydrateCanonicalScene, reduceCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';
import { projectCanonicalSceneToLegacy } from '../src/engine/runtime-core/projections.js';
import { assertCanonicalSceneInvariants } from '../src/engine/runtime-core/invariants.js';

const NPCS = new Set(['heroine1', 'heroine2', 'heroine3', 'general_park_jungwoo']);
const LOCATIONS = [{ location_id: 'origin' }, { location_id: 'destination' }, { location_id: 'meeting_room' }];
const clone = value => structuredClone(value);
function save(overrides = {}) {
  const base = {
    edition: 'company-v1', save_schema_version: 1,
    player: { player_id: 'player-1' },
    scene_state: { scene_id: 'origin-scene', location_id: 'origin', participants: ['player-1', 'heroine1'], beat: 2, scene_goal: 'goal', focus_thread: 'thread' },
    npc_scene_state: { heroine1: { present: true, location_id: 'origin', scene_id: 'origin-scene', clothing: { uniform_top: 'worn' } }, heroine2: { present: false, location_id: 'destination' } },
    last_npcs_present: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', scene: undefined
  };
  return { ...base, ...overrides };
}
function observation({ location_id = null, final = null, focal = null, speakers = [], outcome = 'success', scene_id = null, remote = [], exited = [] } = {}) {
  return { scene_id, location_id, final_present_npc_ids: final, focal_candidate_id: focal, explicit_speaker_ids: speakers, last_explicit_speaker_id: speakers.at(-1) ?? null, scene_goal: null, focus_thread: null, scene_goal_provided: false, focus_thread_provided: false, outcome, presence_is_final: final !== null, remote_speaker_ids: remote, exited_npc_ids: exited };
}
function reduce(input) { return reduceCanonicalScene({ currentScene: hydrateCanonicalScene(input.save ?? save(), { npcIds: NPCS }), npcIds: NPCS, mapLocations: LOCATIONS, expectedTurn: 8, ...input }); }

// Bootstrap 1-7
test('scene bootstrap uses explicit participants before legacy arrays', () => assert.deepEqual(hydrateCanonicalScene(save(), { npcIds: NPCS }).present_npc_ids, ['heroine1']));
test('scene bootstrap preserves explicit empty participants', () => assert.deepEqual(hydrateCanonicalScene(save({ scene_state: { participants: [] }, last_npcs_present: ['heroine1'] }), { npcIds: NPCS }).present_npc_ids, []));
test('scene bootstrap uses last_npcs_present only when participants are absent', () => assert.deepEqual(hydrateCanonicalScene(save({ scene_state: {}, last_npcs_present: ['heroine2'] }), { npcIds: NPCS }).present_npc_ids, ['heroine2']));
test('scene bootstrap uses present flags only when no snapshots exist', () => assert.deepEqual(hydrateCanonicalScene(save({ scene_state: {}, last_npcs_present: undefined, npc_scene_state: { heroine2: { present: true } } }), { npcIds: NPCS }).present_npc_ids, ['heroine2']));
test('version one canonical scene ignores legacy presence', () => assert.deepEqual(hydrateCanonicalScene(save({ scene: { version: 1, present_npc_ids: ['heroine2'], scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, last_npcs_present: ['heroine1'] }), { npcIds: NPCS }).present_npc_ids, ['heroine2']));
test('bootstrap excludes player aliases and unknown ids', () => assert.deepEqual(hydrateCanonicalScene(save({ scene_state: { participants: ['player', 'player-1', 'heroine1', 'ghost'] } }), { npcIds: NPCS }).present_npc_ids, ['heroine1']));
test('bootstrap does not mutate input save', () => { const input = save(); const snapshot = clone(input); hydrateCanonicalScene(input, { npcIds: NPCS }); assert.deepEqual(input, snapshot); });

// Presence 8-13
test('null final presence preserves canonical presence', () => assert.deepEqual(reduce({ observation: observation({ final: null }) }).present_npc_ids, ['heroine1']));
test('empty final presence is an explicit player-only scene', () => assert.deepEqual(reduce({ observation: observation({ final: [] }) }).present_npc_ids, []));
test('final presence replaces rather than unions legacy ids', () => assert.deepEqual(reduce({ observation: observation({ final: ['heroine2'] }) }).present_npc_ids, ['heroine2']));
test('duplicate and player ids are removed from final presence', () => assert.deepEqual(reduce({ observation: observation({ final: ['heroine2', 'heroine2', 'player-1'] }) }).present_npc_ids, ['heroine2']));
test('unknown final presence ids are ignored', () => assert.deepEqual(reduce({ observation: observation({ final: ['ghost', 'heroine2'] }) }).present_npc_ids, ['heroine2']));
test('explicit speaker outside final presence fails without remote evidence', () => assert.throws(() => reduce({ observation: observation({ final: [], speakers: ['heroine1'] }) }), error => error instanceof GameCoreError && error.code === 'SCENE_PRESENCE_CONTRADICTS_STORY'));
test('successful movement tolerates an origin speaker without a movement presence gate', () => {
  const next = reduce({ movementDestinationId: 'destination', observation: observation({ location_id: 'destination', final: [], speakers: ['heroine1'] }) });
  assert.equal(next.location_id, 'destination');
  assert.deepEqual(next.present_npc_ids, []);
});
test('successful movement tolerates a registered arrival speaker absent from the snapshot', () => {
  const next = reduce({ movementDestinationId: 'destination', observation: observation({ location_id: 'destination', final: [], speakers: ['heroine3'] }) });
  assert.equal(next.location_id, 'destination');
  assert.deepEqual(next.present_npc_ids, []);
});

test('movement final presence array is the only destination presence input', () => {
  const next = reduce({ movementDestinationId: 'destination', observation: observation({ location_id: 'destination', final: ['heroine2'], speakers: ['heroine2'] }) });
  assert.deepEqual(next.present_npc_ids, ['heroine2']);
});

test('movement null final presence starts destination with no origin NPC union', () => {
  const next = reduce({ movementDestinationId: 'destination', observation: observation({ location_id: null, final: null, speakers: ['heroine2'] }) });
  assert.equal(next.location_id, 'destination');
  assert.deepEqual(next.present_npc_ids, []);
});

// Movement 14-22
test('location change updates canonical location', () => assert.equal(reduce({ observation: observation({ location_id: 'destination', final: ['heroine2'] }) }).location_id, 'destination'));
test('location change clears scene id without explicit destination scene', () => assert.equal(reduce({ observation: observation({ location_id: 'destination', final: ['heroine2'] }) }).scene_id, null));
test('location change keeps explicit scene id', () => assert.equal(reduce({ observation: observation({ location_id: 'destination', scene_id: 'dest-scene', final: ['heroine2'] }) }).scene_id, 'dest-scene'));
test('location change resets beat', () => assert.equal(reduce({ observation: observation({ location_id: 'destination', final: [] }) }).beat, 0));
test('deterministic movement input does not require a final presence snapshot', () => assert.equal(
  reduce({ movementDestinationId: 'destination', movementPresenceNpcIds: [], observation: observation({ location_id: null, final: null }) }).location_id,
  'destination'
));
test('unknown location is rejected', () => assert.throws(() => reduce({ observation: observation({ location_id: 'unknown', final: [] }) }), error => error.code === 'SCENE_LOCATION_UNKNOWN'));
test('blocked movement preserves scene', () => assert.equal(reduce({ observation: observation({ location_id: 'destination', final: ['heroine2'], outcome: 'blocked' }) }).location_id, 'origin'));
test('degraded extract cannot change presence', () => assert.deepEqual(reduce({ observation: observation({ final: [], outcome: 'degraded' }) }).present_npc_ids, ['heroine1']));
test('feedback revision preserves canonical scene', () => assert.equal(reduce({ actionKind: 'feedback_revision', observation: observation({ location_id: 'destination', final: [] }) }).location_id, 'origin'));

// Focal / speaker 23-31
test('valid focal candidate is retained', () => assert.equal(reduce({ observation: observation({ final: ['heroine1', 'heroine2'], focal: 'heroine2', speakers: ['heroine1'] }) }).focal_character_id, 'heroine2'));
test('stale focal candidate is ignored', () => assert.equal(reduce({ observation: observation({ final: ['heroine2'], focal: 'heroine1' }) }).focal_character_id, null));
test('single acting current NPC becomes focal', () => assert.equal(reduce({ observation: observation({ final: ['heroine2'], speakers: ['heroine2'] }) }).focal_character_id, 'heroine2'));
test('multiple acting NPCs produce null focal', () => assert.equal(reduce({ observation: observation({ final: ['heroine1', 'heroine2'], speakers: ['heroine1', 'heroine2'] }) }).focal_character_id, null));
test('no acting NPC produces null focal', () => assert.equal(reduce({ observation: observation({ final: ['heroine1'] }) }).focal_character_id, null));
test('current Story last speaker replaces prior speaker', () => assert.equal(reduce({ observation: observation({ final: ['heroine1'], speakers: ['heroine1'] }) }).last_speaker_id, 'heroine1'));
test('player is a valid last speaker', () => assert.equal(reduce({ observation: observation({ final: ['heroine1'], speakers: ['player-1'] }) }).last_speaker_id, 'player-1'));
test('speaker absent from final presence remains a strict presence contradiction', () => assert.throws(() => reduce({ observation: observation({ final: [], speakers: ['heroine1'], exited: ['heroine1'] }) }), error => error.code === 'SCENE_PRESENCE_CONTRADICTS_STORY'));
test('remote speaker does not get auto-added to presence', () => { const scene = reduce({ observation: observation({ final: [], speakers: ['heroine1'], remote: ['heroine1'] }) }); assert.deepEqual(scene.present_npc_ids, []); });

// Projection 32-38
test('projection writes canonical scene version', () => assert.equal(projectCanonicalSceneToLegacy(save(), reduce({ observation: observation({ final: ['heroine2'] }) }), { playerId: 'player-1', npcIds: NPCS }).scene.version, 1));
test('projection participants contain player then NPCs', () => assert.deepEqual(projectCanonicalSceneToLegacy(save(), reduce({ observation: observation({ final: ['heroine2'] }) }), { playerId: 'player-1', npcIds: NPCS }).scene_state.participants, ['player-1', 'heroine2']));
test('projection last_npcs_present equals canonical presence', () => { const scene = reduce({ observation: observation({ final: ['heroine2'] }) }); assert.deepEqual(projectCanonicalSceneToLegacy(save(), scene, { npcIds: NPCS }).last_npcs_present, scene.present_npc_ids); });
test('projection focal never adds presence', () => { const scene = reduce({ observation: observation({ final: [], focal: 'heroine1' }) }); assert.equal(scene.focal_character_id, null); });
test('projection preserves physical clothing', () => { const source = save(); const scene = reduce({ observation: observation({ final: ['heroine1'] }) }); const next = projectCanonicalSceneToLegacy(source, scene, { npcIds: NPCS }); assert.deepEqual(next.npc_scene_state.heroine1.clothing, source.npc_scene_state.heroine1.clothing); });
test('projection marks existing absent NPC state false', () => { const next = projectCanonicalSceneToLegacy(save(), reduce({ observation: observation({ final: [] }) }), { npcIds: NPCS }); assert.equal(next.npc_scene_state.heroine1.present, false); });
test('projection is idempotent', () => { const scene = reduce({ observation: observation({ final: ['heroine2'] }) }); const once = projectCanonicalSceneToLegacy(save(), scene, { npcIds: NPCS }); assert.deepEqual(projectCanonicalSceneToLegacy(once, scene, { npcIds: NPCS }), once); });

// Operational regressions 39-42
test('turn 12 local speaker without final evidence is unresolved', () => assert.throws(() => reduce({ observation: observation({ final: null, speakers: ['heroine1', 'heroine2'] }) }), error => error.code === 'SCENE_PRESENCE_UNRESOLVED'));
test('turn 16 registered NPC is not added without final evidence', () => assert.deepEqual(reduce({ observation: observation({ final: null, speakers: [] }) }).present_npc_ids, ['heroine1']));
test('turn 17 stale present flag cannot override participants', () => { const current = save({ scene_state: { participants: ['player-1', 'heroine1'] }, npc_scene_state: { heroine1: { present: false } } }); assert.deepEqual(hydrateCanonicalScene(current, { npcIds: NPCS }).present_npc_ids, ['heroine1']); });

// Route/commit boundary contracts 43-50
test('canonical reducer returns a new scene object', () => { const current = hydrateCanonicalScene(save(), { npcIds: NPCS }); const next = reduce({ currentScene: current, observation: observation({ final: ['heroine2'] }) }); assert.notEqual(next, current); assert.deepEqual(current.present_npc_ids, ['heroine1']); });
test('canonical invariants reject player in present NPC ids', () => assert.throws(() => assertCanonicalSceneInvariants({ save: save(), scene: { ...hydrateCanonicalScene(save(), { npcIds: NPCS }), present_npc_ids: ['player-1'] }, npcIds: NPCS }), error => error.code === 'CANONICAL_SCENE_INVARIANT'));

test('canonical null fields do not fall back to stale legacy values', () => {
  const source = save({ scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 4 }, last_npcs_present: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1' });
  assert.deepEqual(hydrateCanonicalScene(source, { npcIds: NPCS }), { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 4 });
});
test('malformed canonical scene fails without legacy recovery', () => assert.throws(() => hydrateCanonicalScene(save({ scene: { version: 1, present_npc_ids: ['heroine1', 'heroine1'] }, last_npcs_present: ['heroine2'] }), { npcIds: NPCS }), error => error.code === 'CANONICAL_SCENE_INVALID'));
test('failed movement increments beat and preserves destination fields', () => {
  const next = reduce({ observation: observation({ location_id: 'destination', final: ['heroine2'], outcome: 'partial' }) });
  assert.equal(next.location_id, 'origin');
  assert.equal(next.beat, 3);
  assert.deepEqual(next.present_npc_ids, ['heroine1']);
});
test('stationary partial increments beat while applying no presence snapshot', () => {
  const next = reduce({ observation: observation({ final: ['heroine2'], outcome: 'partial' }) });
  assert.equal(next.beat, 3);
  assert.deepEqual(next.present_npc_ids, ['heroine1']);
});
test('degraded turn increments beat and updated turn', () => {
  const next = reduce({ observation: observation({ final: [], outcome: 'degraded' }) });
  assert.equal(next.beat, 3);
  assert.equal(next.updated_turn, 8);
  assert.deepEqual(next.present_npc_ids, ['heroine1']);
});
test('feedback revision preserves beat and updated turn and ignores speaker projection', () => {
  const current = hydrateCanonicalScene(save({ scene: { version: 1, scene_id: 's', location_id: 'origin', beat: 7, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 6 } }), { npcIds: NPCS });
  const next = reduce({ currentScene: current, actionKind: 'feedback_revision', observation: observation({ location_id: 'destination', final: [], speakers: ['heroine2'] }) });
  assert.deepEqual(next, current);
});
test('final null local speaker is unresolved and not auto-added', () => {
  const current = hydrateCanonicalScene(save(), { npcIds: NPCS });
  assert.throws(() => reduce({ currentScene: current, observation: observation({ final: null, speakers: ['heroine2'] }) }), error => error.code === 'SCENE_PRESENCE_UNRESOLVED');
});
test('remote speaker with final null does not alter presence', () => {
  const next = reduce({ observation: observation({ final: null, speakers: ['heroine2'], remote: ['heroine2'] }) });
  assert.deepEqual(next.present_npc_ids, ['heroine1']);
  assert.equal(next.last_speaker_id, 'heroine2');
});
test('projection writes updated_turn to legacy scene_state', () => {
  const scene = reduce({ observation: observation({ final: [] }) });
  assert.equal(projectCanonicalSceneToLegacy(save(), scene, { npcIds: NPCS }).scene_state.updated_turn, scene.updated_turn);
});

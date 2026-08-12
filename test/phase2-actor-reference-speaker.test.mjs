import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryCharacterProjection, buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractRelevantNpcIds, buildExtractPrompt } from '../src/engine/extract-prompt.js';
import { reduceCanonicalScene } from '../src/engine/runtime-core/scene-reducer.js';

const edition = {
  editionId: 'company-v1',
  characters: { characters: {
    heroine1: { name: 'Alpha', position: 'Lead', role_title: 'Manager', prompt_card: { personality: 'calm' } },
    heroine2: { name: 'Beta', position: 'Designer', role_title: 'Designer', prompt_card: { personality: 'direct' } },
    heroine3: { name: 'Gamma', position: 'Analyst', role_title: 'Analyst', prompt_card: { personality: 'bright' } }
  } },
  generalNpcs: { profiles: {} }
};
const save = { scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 }, npc_scene_state: {} };

test('reference is not an actor and receives no full prompt card', () => {
  const projection = buildStoryCharacterProjection({ edition, save, playerAction: 'Beta를 생각한다', sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [] }, workplace: { eligible_nearby_npcs: [] } });
  assert.deepEqual(Object.keys(projection.scene_actors), ['heroine1']);
  assert.equal(projection.reference_characters[0].id, 'heroine2');
  assert.equal('prompt_card' in projection.reference_characters[0], false);
});

test('explicit entrant and remote contact stay separate from current presence', () => {
  const projection = buildStoryCharacterProjection({ edition, save, playerAction: 'Beta에게 전화한다', sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: ['heroine2'], remote_npc_ids: ['heroine3'] }, workplace: { eligible_nearby_npcs: [] } });
  assert.deepEqual(projection.scene_actor_ids, ['heroine1']);
  assert.equal(projection.possible_entrants[0].id, 'heroine2');
  assert.equal(projection.remote_contacts[0].id, 'heroine3');
  assert.equal(projection.reference_characters.length, 0);
});

test('Story payload exposes the separated projections', () => {
  const payload = JSON.parse(buildStoryPrompt({ edition, context: { game: {}, save, recent_turns: [] }, playerAction: 'Beta를 생각한다', expectedTurn: 2, sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [] } })[1].content);
  assert.ok(payload.scene_actors.heroine1);
  assert.equal(payload.reference_characters[0].id, 'heroine2');
  assert.equal('prompt_card' in payload.reference_characters[0], false);
  assert.equal('scene_cast_contract' in payload, false);
  assert.equal('active_character_canon' in payload, false);
  assert.equal('active_general_npc_canon' in payload, false);
});

test('Story context quarantines unregistered scene ids without mutating the save', () => {
  const staleSave = {
    scene: {
      version: 1,
      scene_id: 'room',
      location_id: 'room',
      present_npc_ids: ['heroine1', 'npc-hayeon', 'npc-areum', 'npc-minsu'],
      focal_character_id: 'npc-hayeon',
      last_speaker_id: 'npc-areum',
      beat: 0,
      updated_turn: 0
    },
    npc_scene_state: {
      heroine1: { present: true },
      'npc-hayeon': { present: true },
      'npc-areum': { present: true },
      'npc-minsu': { present: true }
    },
    npc_emotion: { 'npc-hayeon': { mood: 'tense' } },
    npc_relationship_state: { 'npc-areum': { closeness: 'familiar' } },
    npc_stats: { 'npc-minsu': { affinity: 20 } }
  };
  const before = structuredClone(staleSave);
  const payload = JSON.parse(buildStoryPrompt({
    edition,
    context: { game: {}, save: { data: staleSave }, recent_turns: [] },
    playerAction: '주변 상황을 살핀다.',
    expectedTurn: 2,
    sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [] }
  })[1].content);
  assert.deepEqual(payload.registered_identities.map(entry => entry.id), ['heroine1', 'heroine2', 'heroine3']);
  assert.deepEqual(payload.scene_actors && Object.keys(payload.scene_actors), ['heroine1']);
  assert.equal('participants' in payload.context.scene, false);
  assert.deepEqual(payload.context.scene.present_npc_ids, ['heroine1']);
  assert.deepEqual(Object.keys(payload.context.active_npc_state.npc_scene_state ?? {}), ['heroine1']);
  assert.equal(JSON.stringify(payload).includes('npc-hayeon'), false);
  assert.equal(JSON.stringify(payload).includes('npc-areum'), false);
  assert.equal(JSON.stringify(payload).includes('npc-minsu'), false);
  assert.deepEqual(staleSave, before);
});

test('Story projection preserves stale ids inside historical raw turns', () => {
  const rawStory = '[SCENE] npc-hayeon appeared in an old committed turn.';
  const payload = JSON.parse(buildStoryPrompt({
    edition,
    context: {
      game: {},
      save: { data: { scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 } } },
      recent_turns: [{ turn_number: 1, story_text: rawStory, parsed_blocks: null, choices: [] }]
    },
    playerAction: '계속 진행한다.',
    expectedTurn: 2,
    sceneCastContract: { present_npc_ids: ['heroine1'], entering_npc_ids: [], remote_npc_ids: [] }
  })[1].content);
  assert.equal(payload.context.recent_turns[0].story_text, rawStory);
});

test('registered local Story speaker supplements an unknown final snapshot', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: [], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const next = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: null, explicit_speaker_ids: ['heroine2'], remote_speaker_ids: [] }, expectedTurn: 2 });
  assert.deepEqual(next.present_npc_ids, ['heroine2']);
});

test('complete final presence snapshot wins over a speaker who later leaves', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: [], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const next = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: [], explicit_speaker_ids: ['heroine2'], remote_speaker_ids: [] }, expectedTurn: 2 });
  assert.deepEqual(next.present_npc_ids, []);
});

test('autonomous registered local entrance can be committed from final presence evidence', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const next = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine1', 'heroine3']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: ['heroine1', 'heroine3'], explicit_speaker_ids: ['heroine3'], remote_speaker_ids: [] }, expectedTurn: 2 });
  assert.deepEqual(next.present_npc_ids, ['heroine1', 'heroine3']);
});

test('remote speaker does not become local presence and unknown speaker fails closed', () => {
  const scene = { scene_id: 'room', location_id: 'room', present_npc_ids: [], focal_character_id: null, last_speaker_id: null, beat: 0, updated_turn: 1 };
  const remote = reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: [], explicit_speaker_ids: ['heroine2'], remote_speaker_ids: ['heroine2'] }, expectedTurn: 2 });
  assert.deepEqual(remote.present_npc_ids, []);
  assert.throws(() => reduceCanonicalScene({ currentScene: scene, npcIds: new Set(['heroine2']), mapLocations: [{ location_id: 'room' }], observation: { outcome: 'success', final_present_npc_ids: [], explicit_speaker_ids: ['unknown'], remote_speaker_ids: [] }, expectedTurn: 2 }), /not a registered/);
});

test('Extract observer context includes post-Story speakers and exact full-name entrances only', () => {
  const observerEdition = { characters: { characters: { heroine1: { name: 'Alpha' }, heroine2: { name: 'Beta' } } }, generalNpcs: { profiles: {} } };
  const context = { save: { data: { scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, goal: null, focus_thread: null, updated_turn: 1 } } } };
  const parsedStory = { dialogue_lines: [{ speaker_id: 'heroine2', text: 'hello' }] };
  assert.deepEqual(buildExtractRelevantNpcIds({ context, parsedStory, storyText: 'Beta가 서류를 들고 들어왔다.', edition: observerEdition, npcIds: new Set(['heroine1', 'heroine2']) }), ['heroine1', 'heroine2']);
  assert.deepEqual(buildExtractRelevantNpcIds({ context, parsedStory: { dialogue_lines: [] }, storyText: 'Beta를 생각했다.', edition: observerEdition, npcIds: new Set(['heroine1', 'heroine2']) }), ['heroine1', 'heroine2']);
  assert.deepEqual(buildExtractRelevantNpcIds({ context, parsedStory: { dialogue_lines: [] }, storyText: '그녀는 조용했다.', edition: observerEdition, npcIds: new Set(['heroine1', 'heroine2']) }), ['heroine1']);
});

test('Extract payload uses observer identities/state and no Story active canon', () => {
  const observerEdition = { characters: { characters: { heroine1: { name: 'Alpha' }, heroine2: { name: 'Beta' } } }, generalNpcs: { profiles: {} } };
  const messages = buildExtractPrompt({
    context: { save: { data: { scene: { version: 1, scene_id: 'room', location_id: 'room', present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, beat: 0, goal: null, focus_thread: null, updated_turn: 1 }, npc_emotion: { heroine2: { mood: 'neutral' } } } } },
    storyText: 'Beta가 들어왔다.', parsedStory: { dialogue_lines: [{ speaker_id: 'heroine2' }] }, playerAction: 'x', expectedTurn: 2, edition: observerEdition, npcIds: new Set(['heroine1', 'heroine2'])
  });
  const payload = JSON.parse(messages[1].content);
  assert.deepEqual(payload.registered_identities, [{ id: 'heroine1', name: 'Alpha' }, { id: 'heroine2', name: 'Beta' }]);
  assert.equal('active_character_canon' in payload, false);
  assert.equal('active_general_npc_canon' in payload, false);
  assert.deepEqual(Object.keys(payload.context.active_npc_state.npc_emotion), ['heroine2']);
});

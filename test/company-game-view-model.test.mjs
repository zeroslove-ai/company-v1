import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/phase-0.5/canonical-save-v1.json'), 'utf8'));

function context({ lastChoices = fixture.last_choices, turns = [] } = {}) {
  return { game: { edition_id: 'company-v1' }, save: { data: { ...structuredClone(fixture), last_choices: lastChoices } }, recent_turns: turns };
}

test('Company game view model uses authoritative choices and the newest committed fallback', () => {
  const latest = { turn_id: 'turn-8', action_id: 'action-8', choices: ['turn one', 'turn two'], mind_monitor: { npc: { mood: 'focused' } }, parsed_blocks: { choices: ['parsed'] } };
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: ['save one', 'save two'], turns: [latest] })).story.choices, ['save one', 'save two']);
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: [], turns: [{ choices: ['old'] }, latest] })).story.choices, ['turn one', 'turn two']);
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: [], turns: [{ parsed_blocks: { choices: ['parsed only'] } }] })).story.choices, ['parsed only']);
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: [], turns: [latest] })).media.mind_monitor, latest.mind_monitor);
});

test('Company game view model preserves an external committed turn and numeric image ID', () => {
  const input = context();
  input.save.committed_turn = 12;
  delete input.save.data.turn_state;
  input.save.data.last_image_id = 123;
  const model = buildCompanyGameViewModel(input);
  assert.equal(model.turn.committed_turn, 12);
  assert.equal(model.media.image_id, 123);
});

test('Company game view model keeps identity axes separate and does not invent NPC state', () => {
  const input = context({ turns: [{ parsed_blocks: { player_status: 'ready' } }] });
  input.save.data.focal_character_id = 'npc-hayeon';
  input.save.data.last_speaker_id = 'npc-areum';
  input.save.data.npc_stats = {};
  input.save.data.npc_relationship_state = {};
  input.save.data.npc_emotion = {};
  const snapshot = structuredClone(input);
  const model = buildCompanyGameViewModel(input);
  assert.equal(model.focal_character.id, 'npc-hayeon');
  assert.equal(model.focal_character.last_speaker_id, 'npc-areum');
  assert.equal(model.focal_character.character, null);
  assert.equal(model.story.player_inner_thought, '');
  assert.deepEqual(model.scene.clothing_state, {});
  assert.deepEqual(input, snapshot);
});

test('Company game view model projects every interacting NPC and player clothing without inference', () => {
  const input = context();
  input.save.data.player = { ...(input.save.data.player ?? {}), player_id: 'player', name: '플레이어' };
  input.save.data.player_scene_state = {
    clothing: { uniform_top: 'worn', uniform_bottom: 'removed' }
  };
  input.save.data.focal_character_id = 'heroine3';
  input.save.data.last_npcs_present = ['heroine1', 'heroine3'];
  input.save.data.scene_state = {
    ...(input.save.data.scene_state ?? {}),
    participants: ['player', 'heroine1', 'heroine3']
  };
  input.save.data.npc_scene_state = {
    heroine1: { present: true, clothing: { uniform_top: 'worn' } },
    heroine3: { present: true, clothing: { uniform_top: 'removed', underwear_top: 'worn' } },
    heroine4: { present: false, clothing: { uniform_top: 'worn' } }
  };
  input.display = {
    npc_directory: {
      heroine1: { name: '윤민아' },
      heroine3: { name: '김제나' },
      heroine4: { name: '퇴장 인물' }
    }
  };

  const model = buildCompanyGameViewModel(input);
  assert.deepEqual(model.interacting_characters.map(character => character.id), ['heroine3', 'heroine1']);
  assert.deepEqual(model.interacting_characters[0].scene_state.clothing, { uniform_top: 'removed', underwear_top: 'worn' });
  assert.deepEqual(model.interacting_characters[1].scene_state.clothing, { uniform_top: 'worn' });
  assert.deepEqual(model.player.clothing, { uniform_top: 'worn', uniform_bottom: 'removed' });
  assert.equal(model.interacting_characters.some(character => character.id === 'heroine4'), false);
});

test('Company game view model uses participants as the only current-scene NPC membership source', () => {
  const staleAbsent = context();
  staleAbsent.save.data.player = { player_id: 'player-1' };
  staleAbsent.save.data.scene_state = { participants: ['player-1', 'heroine1'] };
  staleAbsent.save.data.npc_scene_state = {
    heroine1: { present: false, clothing: { uniform_top: 'removed' } }
  };
  let model = buildCompanyGameViewModel(staleAbsent);
  assert.deepEqual(model.interacting_characters.map(character => character.id), ['heroine1']);
  assert.deepEqual(model.interacting_characters[0].scene_state.clothing, { uniform_top: 'removed' });

  const outside = context();
  outside.save.data.player = { player_id: 'player-1' };
  outside.save.data.scene_state = { participants: ['player-1', 'heroine1'] };
  outside.save.data.last_npcs_present = ['heroine3'];
  outside.save.data.npc_scene_state = {
    heroine1: { present: true },
    heroine3: { present: true }
  };
  model = buildCompanyGameViewModel(outside);
  assert.deepEqual(model.interacting_characters.map(character => character.id), ['heroine1']);

  const focal = context();
  focal.save.data.player = { player_id: 'player-1' };
  focal.save.data.scene_state = { participants: ['player-1', 'heroine1', 'heroine3'] };
  focal.save.data.focal_character_id = 'heroine3';
  model = buildCompanyGameViewModel(focal);
  assert.deepEqual(model.interacting_characters.map(character => character.id), ['heroine3', 'heroine1']);

  const staleFocal = context();
  staleFocal.save.data.player = { player_id: 'player-1' };
  staleFocal.save.data.scene_state = { participants: ['player-1'] };
  staleFocal.save.data.focal_character_id = 'heroine1';
  staleFocal.save.data.last_npcs_present = ['heroine1'];
  model = buildCompanyGameViewModel(staleFocal);
  assert.deepEqual(model.interacting_characters, []);
});

test('Company game view model is a pure module without network or DOM dependencies', () => {
  const source = fs.readFileSync(path.join(root, 'src/frontend/pages/view-model.js'), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|\bdocument\s*\.|\bwindow\s*\.|\blocalStorage\b|\bsessionStorage\b/);
  assert.deepEqual(Object.keys(buildCompanyGameViewModel({})), ['turn', 'story', 'scene', 'interacting_characters', 'focal_character', 'player', 'media']);
});

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

test('Company game view model ignores save mirrors and reads committed parsed choices', () => {
  const latest = { turn_id: 'turn-8', action_id: 'action-8', choices: ['turn one', 'turn two'], mind_monitor: { npc: { mood: 'focused' } }, parsed_blocks: { choices: ['parsed'] } };
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: ['stale one', 'stale two'], turns: [latest] })).story.choices, ['parsed']);
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: [], turns: [{ choices: ['old'] }, latest] })).story.choices, ['parsed']);
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: [], turns: [{ parsed_blocks: { choices: ['parsed only'] } }] })).story.choices, ['parsed only']);
  assert.deepEqual(buildCompanyGameViewModel(context({ lastChoices: [], turns: [latest] })).media.mind_monitor, latest.mind_monitor);
  assert.deepEqual(buildCompanyGameViewModel({ ...context({ lastChoices: ['stale'] }), opening_turn: { choices: ['Opening A', 'Opening B', 'Opening C', 'Opening D'] } }).story.choices, []);
});

test('Company game view model uses server display projections over save mirrors after refresh', () => {
  const input = context({ lastChoices: ['stale A', 'stale B', 'stale C', 'stale D'], turns: [{ parsed_blocks: { choices: ['A', 'B', 'C', 'D'] } }] });
  input.save.data.player = { player_id: 'player', name: '플레이어' };
  input.save.data.scene = { version: 1, scene_id: 'raw-scene', location_id: 'raw-location', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 1 };
  input.save.data.npc_stats = { heroine1: { affinity: 1 } };
  input.save.data.npc_relationship_state = { heroine1: { relationship_summary: 'raw mirror' } };
  input.save.data.csa_active = ['raw-rule'];
  input.save.data.csa_rules = { 'raw-rule': { active: true, content: 'raw rule' } };
  input.display = {
    scene: { version: 1, scene_id: 'display-scene', location_id: 'display-location', beat: 2, goal: 'display goal', focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 2 },
    active_csa: [{ id: 'display-rule', content: 'display rule', strength: 'medium' }],
    character_details: {
      heroine1: {
        stats: { affinity: 9, resistance: 8, csa_acceptance: 7, sexual_arousal: 6 },
        relationship_summary: 'display relationship', relationship_record: { total_events: 3 }, profile: {}, body: {}
      }
    }
  };
  const model = buildCompanyGameViewModel(input);
  assert.equal('scene_id' in model.scene, false);
  assert.equal(model.scene.location_id, 'display-location');
  assert.deepEqual(model.story.choices, ['A', 'B', 'C', 'D']);
  assert.deepEqual(model.focal_character.character.stats, { affinity: 9, resistance: 8, csa_acceptance: 7, sexual_arousal: 6 });
  assert.equal(model.focal_character.character.relationship_summary, 'display relationship');
  assert.deepEqual(model.focal_character.character.relationship_record, { total_events: 3 });
  assert.equal('relationship' in model.focal_character.character, false);
  assert.deepEqual(model.player.active_csa.map(rule => rule.id), ['display-rule']);
  assert.deepEqual(model.scene.csa_active, ['display-rule']);
});

test('Company game view model keeps canonical identity and map location ahead of save/detail aliases', () => {
  const input = context({ turns: [{ parsed_blocks: { dialogue_lines: [{ speaker_id: 'heroine1', text: 'Hello', order: 0 }] } }] });
  input.save.data.player = { player_id: 'player-1', name: 'Canonical player', department_id: 'brand_strategy' };
  input.save.data.player_name = 'stale player name';
  input.save.data.player_department = 'stale department';
  input.save.data.player_scene_state = { location_label: 'stale location', posture: 'standing' };
  input.save.data.characters = { heroine1: { name: 'stale save name' } };
  input.save.data.scene = { version: 1, scene_id: 'canonical-scene', location_id: 'canonical-location', beat: 1, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: null, updated_turn: 1 };
  input.display = {
    npc_directory: { heroine1: { name: 'Canonical directory name' } },
    character_details: { heroine1: { name: 'stale detail name', profile: {}, body: {} } },
    map_locations: [{ location_id: 'canonical-location', name: 'Canonical map room' }]
  };
  const model = buildCompanyGameViewModel(input);
  assert.equal(model.player.name, 'Canonical player');
  assert.notEqual(model.player.department, 'stale department');
  assert.equal(model.player.location_label, 'Canonical map room');
  assert.equal(model.focal_character.name, 'Canonical directory name');
  assert.equal(model.story.dialogue_lines[0].speaker_name, 'Canonical directory name');
});

test('Company game view model preserves an external committed turn without a retired image root', () => {
  const input = context();
  input.save.committed_turn = 12;
  delete input.save.data.turn_state;
  const model = buildCompanyGameViewModel(input);
  assert.equal(model.turn.committed_turn, 12);
  assert.equal(model.media.image_id, null);
});

test('Company game view model keeps identity axes separate and does not invent NPC state', () => {
  const input = context({ turns: [{ parsed_blocks: { player_status: 'ready' } }] });
  input.save.data.focal_character_id = 'npc-hayeon';
  input.save.data.last_speaker_id = 'npc-areum';
  input.save.data.npc_stats = {};
  input.save.data.npc_relationship_state = {};
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
  input.save.data.scene.focal_character_id = 'heroine3';
  input.save.data.scene.present_npc_ids = ['heroine1', 'heroine3'];
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
  staleAbsent.save.data.scene.present_npc_ids = ['heroine1'];
  staleAbsent.save.data.scene_state = { participants: ['player-1', 'heroine1'] };
  staleAbsent.save.data.npc_scene_state = {
    heroine1: { present: false, clothing: { uniform_top: 'removed' } }
  };
  let model = buildCompanyGameViewModel(staleAbsent);
  assert.deepEqual(model.interacting_characters.map(character => character.id), ['heroine1']);
  assert.deepEqual(model.interacting_characters[0].scene_state.clothing, { uniform_top: 'removed' });

  const outside = context();
  outside.save.data.player = { player_id: 'player-1' };
  outside.save.data.scene.present_npc_ids = ['heroine1'];
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
  focal.save.data.scene.present_npc_ids = ['heroine1', 'heroine3'];
  focal.save.data.scene.focal_character_id = 'heroine3';
  focal.save.data.scene_state = { participants: ['player-1', 'heroine1', 'heroine3'] };
  focal.save.data.focal_character_id = 'heroine3';
  model = buildCompanyGameViewModel(focal);
  assert.deepEqual(model.interacting_characters.map(character => character.id), ['heroine3', 'heroine1']);

  const staleFocal = context();
  staleFocal.save.data.player = { player_id: 'player-1' };
  staleFocal.save.data.scene.present_npc_ids = [];
  staleFocal.save.data.scene.focal_character_id = null;
  staleFocal.save.data.scene_state = { participants: ['player-1'] };
  staleFocal.save.data.focal_character_id = 'heroine1';
  staleFocal.save.data.last_npcs_present = ['heroine1'];
  model = buildCompanyGameViewModel(staleFocal);
  assert.deepEqual(model.interacting_characters, []);
});

test('Company game view model resolves player aliases to the saved player name without changing parser order', () => {
  const input = context({ turns: [{ parsed_blocks: { dialogue_lines: [
    { speaker_id: 'player', speaker_name: '플레이어', text: '제가 먼저 말할게요.', order: 0 },
    { speaker_id: 'player-1', speaker_name: '플레이어', text: '이어서 설명할게요.', order: 1 },
    { speaker_id: 'heroine1', speaker_name: '', text: '알겠습니다.', order: 2 }
  ] } }] });
  input.save.data.player = { ...(input.save.data.player ?? {}), player_id: 'player-1', name: '김하늘' };
  input.display = { npc_directory: { heroine1: { name: '서원희' } } };
  const lines = buildCompanyGameViewModel(input).story.dialogue_lines;
  assert.deepEqual(lines.map(line => line.speaker_name), ['김하늘', '김하늘', '서원희']);
  assert.deepEqual(lines.map(line => line.order), [0, 1, 2]);
});

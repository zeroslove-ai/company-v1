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

test('Company game view model prefers current Extract Mind Monitor without mutating inputs', () => {
  const input = context({ turns: [{ mind_monitor: { source: 'committed turn' } }] });
  const runtime = { currentExtract: { mind_monitor: { source: 'current Extract' } } };
  const inputSnapshot = structuredClone(input);
  const runtimeSnapshot = structuredClone(runtime);
  const model = buildCompanyGameViewModel(input, runtime);
  assert.deepEqual(model.media.mind_monitor, { source: 'current Extract' });
  assert.deepEqual(buildCompanyGameViewModel(input).media.mind_monitor, { source: 'committed turn' });
  assert.deepEqual(input, inputSnapshot);
  assert.deepEqual(runtime, runtimeSnapshot);
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
  assert.equal(model.scene.clothing_state, null);
  assert.deepEqual(input, snapshot);
});

test('Company game view model is a pure module without network or DOM dependencies', () => {
  const source = fs.readFileSync(path.join(root, 'src/frontend/pages/view-model.js'), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|\bdocument\s*\.|\bwindow\s*\.|\blocalStorage\b|\bsessionStorage\b/);
  assert.deepEqual(Object.keys(buildCompanyGameViewModel({})), ['turn', 'story', 'scene', 'focal_character', 'player', 'media']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  advanceGameTime,
  deriveTurnChanges,
  formatGameTime,
  hydrateGameplayState,
  migrateCompanySave,
  normalizeElapsedMinutes,
  normalizeGameplayExtractEnvelope,
  normalizeMindMonitor,
  parseNarrative,
  reducePlayerSexualState
} from '../src/engine/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));

test('gameplay state documents fix v1 compatibility and global CSA ownership', () => {
  const state = read('docs/COMPANY_GAMEPLAY_STATE_CONTRACT_V1.md');
  const narrative = read('docs/COMPANY_NARRATIVE_CONTRACT_V1.md');
  assert.match(state, /save_schema_version: 1/);
  assert.match(state, /csa_active.*csa_rules.*csa_runtime_state.*csa_aftereffect_state/s);
  assert.match(state, /temporarily_interrupted/);
  assert.match(state, /active_suggestions.*forbidden/i);
  assert.match(narrative, /exactly four parsed Story choices are authoritative/i);
  assert.match(narrative, /never selects the player's next action/i);
  assert.match(narrative, /\[1\. 서사 및 행동\].*\[2\. 플레이어 속마음\].*\[3\. 플레이어 상황판\].*\[4\. 선택지\]/s);
  assert.match(narrative, /no separate user-visible `\[DIALOGUE\]` section/i);
});

test('Story parser keeps authored inner thought and malformed story nonblocking', () => {
  const structured = parseNarrative(read('fixtures/gameplay-state-v1/story-structured.txt'));
  const malformedRaw = read('fixtures/gameplay-state-v1/story-malformed-nonblocking.txt');
  const malformed = parseNarrative(malformedRaw);
  assert.ok(structured.player_inner_thought.length >= 180);
  assert.ok(structured.player_inner_thought.length <= 500);
  assert.equal(structured.player_inner_thought.includes('"'), false);
  assert.ok(structured.blocks.some(block => block.type === 'player_inner_thought'));
  assert.equal(structured.choices.length, 4);
  assert.equal(malformed.raw, malformedRaw);
  assert.ok(malformed.warnings.includes('choices_not_exactly_four'));
});

test('gameplay Extract preserves parser authority and independent identity IDs', () => {
  const extract = readJson('fixtures/gameplay-state-v1/extract-gameplay-valid.json');
  const story = parseNarrative(read('fixtures/gameplay-state-v1/story-structured.txt'));
  const input = structuredClone(extract);
  const parsedInput = structuredClone(story);
  const normalized = normalizeGameplayExtractEnvelope(input, { parsedStory: parsedInput });
  assert.deepEqual(normalized.choices, story.choices);
  assert.equal(normalized.player_inner_thought, story.player_inner_thought);
  assert.equal(normalized.action_target_id, 'npc-existing');
  assert.equal(normalized.focal_character_id, 'npc-focal');
  assert.equal(normalized.last_speaker_id, 'npc-last');
  assert.equal(normalized.image_character_id, 'npc-image');
  assert.equal(normalized.mind_monitor['npc-existing'].surface, extract.mind_monitor['npc-existing'].surface);
  assert.equal(normalized.mind_monitor['npc-existing'].subconscious, extract.mind_monitor['npc-existing'].subconscious);
  assert.equal(normalized.mind_monitor['npc-existing'].body, undefined);
  assert.ok(normalized.mind_monitor['npc-existing'].surface.length >= 150);
  assert.ok(normalized.mind_monitor['npc-existing'].surface.length <= 300);
  assert.ok(normalized.mind_monitor['npc-existing'].subconscious.length >= 180);
  assert.ok(normalized.mind_monitor['npc-existing'].subconscious.length <= 350);
  assert.equal(normalized.mind_monitor['npc-existing'].surface.includes('calm'), false);
  assert.equal(normalized.mind_monitor['npc-existing'].subconscious.includes('uncertain'), false);
  assert.deepEqual(input, extract);
  assert.deepEqual(parsedInput, story);
});

test('Mind Monitor emits only surface and subconscious without manufacturing NPCs', () => {
  const input = {
    'npc-a': { surface: 'aware', subconscious: 'worried', body: 'hidden', physical_action: 'hidden' },
    'npc-b': 'legacy per-npc text'
  };
  const copy = structuredClone(input);
  const normalized = normalizeMindMonitor(input);
  assert.deepEqual(normalized.mind_monitor, { 'npc-a': { surface: 'aware', subconscious: 'worried' } });
  assert.ok(normalized.warnings.some(warning => warning.includes('body')));
  assert.ok(normalized.warnings.some(warning => warning.includes('npc-b')));
  assert.deepEqual(input, copy);
  const legacy = normalizeMindMonitor('unstructured legacy monitor');
  assert.equal(legacy.legacy_text, 'unstructured legacy monitor');
  assert.deepEqual(legacy.mind_monitor, {});
});

test('time proposals default safely and advance rolls across days', () => {
  const current = { day: 2, minute_of_day: 1438 };
  const copy = structuredClone(current);
  assert.equal(normalizeElapsedMinutes(1000), 3);
  assert.equal(normalizeElapsedMinutes(120, { time_advance: true }), 120);
  assert.deepEqual(advanceGameTime(current, 5), { day: 3, minute_of_day: 3 });
  assert.deepEqual(current, copy);
  assert.equal(formatGameTime({ day: 3, minute_of_day: 3 }), 'Day 3 00:03');
});

test('sexual reducer clamps deltas and ignores unsupported completion without blocking the turn', () => {
  const base = { arousal: 95, ejaculation_progress: 99, ejaculation_count: 2, updated_turn: 4 };
  const ignored = reducePlayerSexualState(base, { arousal_delta: 10, ejaculation_progress_delta: 10, ejaculation_completed: true });
  assert.deepEqual(ignored.state, { arousal: 100, ejaculation_progress: 100, ejaculation_count: 2, updated_turn: 4 });
  assert.deepEqual(ignored.warnings, ['unauthorized_ejaculation_completion_ignored']);
  assert.deepEqual(
    reducePlayerSexualState(base, { arousal_delta: 10, ejaculation_progress_delta: 10, ejaculation_completed: true }, { storyEvidence: { sexual_resolution: true }, updatedTurn: 5 }),
    { state: { arousal: 0, ejaculation_progress: 0, ejaculation_count: 3, updated_turn: 5 }, warnings: [] }
  );
});

test('pure v1 migration preserves unknown fields and hydration never overwrites existing NPC data', () => {
  const legacy = readJson('fixtures/gameplay-state-v1/legacy-current-save.json');
  const original = structuredClone(legacy);
  const migrated = migrateCompanySave(legacy);
  assert.equal(migrated.save_schema_version, 1);
  assert.deepEqual(migrated.world_state.game_time, { day: 1, minute_of_day: 540 });
  assert.equal(migrated.unknown_legacy_field.keep, true);
  assert.deepEqual(legacy, original);
  assert.deepEqual(migrateCompanySave(migrated), migrated);
  const hydrated = hydrateGameplayState(migrated, {
    characters: [
      { character_id: 'npc-existing', initial_stats: { affection: 0 } },
      { character_id: 'npc-new', initial_stats: { affection: 1 } }
    ]
  });
  assert.equal(hydrated.npc_stats['npc-existing'].affection, 4);
  assert.equal(hydrated.npc_stats['npc-new'].affection, 1);
});

test('turn changes use only guarded before and after state', () => {
  const before = { player_sexual_state: { arousal: 10 }, npc_stats: { 'npc-a': { affection: 1 } } };
  const after = { player_sexual_state: { arousal: 12 }, npc_stats: { 'npc-a': { affection: 2 } } };
  assert.deepEqual(deriveTurnChanges(before, after), [
    { path: 'player_sexual_state.arousal', from: 10, to: 12 },
    { path: 'npc_stats.npc-a.affection', from: 1, to: 2 }
  ]);
});

test('required gameplay fixtures define three CSA axes and five resolved heroine characters', () => {
  const csa = readJson('fixtures/gameplay-state-v1/global-csa-npc-attitudes.json');
  const master = readJson('fixtures/gameplay-state-v1/five-character-master-v1.json');
  assert.equal(csa.csa_active.length, 1);
  assert.equal(csa.csa_attitudes['npc-a']['csa-global'].resistance, 80);
  assert.equal(master.characters.length, 5);
  assert.deepEqual(master.characters.map(character => character.character_id), ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5']);
  assert.ok(master.characters.every(character => character.mapping_status === 'resolved'));
  assert.ok(master.characters.every(character => character.voice_id === null));
  assert.deepEqual(master.characters.map(character => character.initial_csa_attitudes), [{}, {}, {}, {}, {}]);
  const requiredNonNullFields = ['name', 'age', 'department', 'position', 'role_title', 'appearance', 'personality', 'addressing_rules', 'storage_bucket', 'storage_prefix', 'primary_image_path', 'adult_image_prefix'];
  for (const character of master.characters) {
    for (const field of requiredNonNullFields) assert.notEqual(character[field], null, `${character.character_id}.${field}`);
  }
  assert.deepEqual(csa.csa_runtime_state['csa-global'], {
    lifecycle: 'temporarily_interrupted', applicability: 'applicable', execution_state: 'interrupted'
  });
  assert.equal(normalizeGameplayExtractEnvelope(readJson('fixtures/gameplay-state-v1/extract-invalid-time.json')).elapsed_minutes, 3);
  assert.deepEqual(
    reducePlayerSexualState({}, readJson('fixtures/gameplay-state-v1/extract-invalid-sexual-completion.json').state_delta.player_sexual_state).warnings,
    ['unauthorized_ejaculation_completion_ignored']
  );
});

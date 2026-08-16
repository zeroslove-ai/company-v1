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
  reducePlayerSexualState,
  buildExtractPrompt
} from '../src/engine/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));

test('gameplay state and narrative contracts retain the current v1 boundaries', () => {
  const state = read('docs/COMPANY_GAMEPLAY_STATE_CONTRACT_V1.md');
  const narrative = read('docs/COMPANY_NARRATIVE_CONTRACT_V1.md');
  assert.match(state, /save_schema_version: 1/);
  assert.match(state, /csa_active.*csa_rules.*csa_runtime_state.*csa_aftereffect_state/s);
  assert.match(narrative, /canonical_choices[\s\S]*exactly four non-empty, non-duplicate choices/i);
  assert.match(narrative, /free input remains available/i);
  assert.match(narrative, /speaker_id/);
});

test('time proposals default safely and advance across days without mutating input', () => {
  const current = { day: 2, minute_of_day: 1438 };
  const copy = structuredClone(current);
  assert.equal(normalizeElapsedMinutes(1000), 3);
  assert.equal(normalizeElapsedMinutes(120, { time_advance: true }), 120);
  assert.deepEqual(advanceGameTime(current, 5), { day: 3, minute_of_day: 3 });
  assert.deepEqual(current, copy);
  assert.equal(formatGameTime({ day: 3, minute_of_day: 3 }), 'Day 3 00:03');
});

test('sexual reducer requires evidence for completion and clamps supported deltas', () => {
  const base = { arousal: 95, ejaculation_progress: 99, ejaculation_count: 2, updated_turn: 4 };
  const ignored = reducePlayerSexualState(base, { arousal_delta: 10, ejaculation_progress_delta: 10, ejaculation_completed: true });
  assert.deepEqual(ignored.state, base);
  assert.deepEqual(ignored.warnings, ['unevidenced_arousal_change', 'unevidenced_ejaculation_progress_change', 'unauthorized_ejaculation_completion_ignored']);
  const completed = reducePlayerSexualState(base, { arousal_delta: 10, ejaculation_progress_delta: 10, ejaculation_completed: true }, { storyEvidence: { sexual_resolution: true }, updatedTurn: 5 });
  assert.deepEqual(completed.state, { arousal: 0, ejaculation_progress: 0, ejaculation_count: 3, updated_turn: 5 });
  assert.deepEqual(completed.warnings, ['unevidenced_arousal_change', 'unevidenced_ejaculation_progress_change']);
});

test('sexual mechanical deltas require exact Story evidence independently', () => {
  const base = { arousal: 10, ejaculation_progress: 20, ejaculation_count: 0, updated_turn: 4 };
  const storyText = 'Story: direct stimulation raises arousal and progress.';
  const completeEvidence = { changed: ['player_sexual_state.arousal_delta', 'player_sexual_state.ejaculation_progress_delta'], quote: storyText };
  const complete = reducePlayerSexualState(base, { arousal_delta: 5, ejaculation_progress_delta: 4 }, { storyEvidence: completeEvidence, storyText, updatedTurn: 5 });
  assert.deepEqual(complete.state, { arousal: 15, ejaculation_progress: 24, ejaculation_count: 0, updated_turn: 5 });
  assert.deepEqual(complete.warnings, []);
  const partialEvidence = { changed: ['player_sexual_state.arousal_delta'], quote: storyText };
  const partial = reducePlayerSexualState(base, { arousal_delta: 5, ejaculation_progress_delta: 4 }, { storyEvidence: partialEvidence, storyText, updatedTurn: 5 });
  assert.equal(partial.state.arousal, 15);
  assert.equal(partial.state.ejaculation_progress, 20);
  assert.deepEqual(partial.warnings, ['unevidenced_ejaculation_progress_change']);
});

test('sexual progress is bounded per turn and never decreases from a negative proposal', () => {
  const base = { arousal: 0, ejaculation_progress: 20, ejaculation_count: 0, updated_turn: 0 };
  const storyText = 'Story: sustained direct stimulation continues.';
  const evidence = { changed: ['player_sexual_state.ejaculation_progress_delta'], quote: storyText };
  assert.equal(reducePlayerSexualState(base, { ejaculation_progress_delta: 50 }, { storyEvidence: evidence, storyText }).state.ejaculation_progress, 26);
  const negative = reducePlayerSexualState(base, { ejaculation_progress_delta: -50 });
  assert.equal(negative.state.ejaculation_progress, 20);
  assert.deepEqual(negative.warnings, ['unevidenced_ejaculation_progress_change']);
});

test('Extract prompt keeps sexual completion evidence separate from mere exposure or request', () => {
  const prompt = buildExtractPrompt({
    context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } },
    storyText: 'The player made a request.', parsedStory: {}, playerAction: 'x', expectedTurn: 1
  });
  assert.match(prompt[0].content, /Exposure, erection, conversation, or requests alone never raise it/);
  assert.match(prompt[0].content, /completion requires evidence/);
});

test('pure v1 migration preserves unknown fields and hydration does not overwrite existing NPC data', () => {
  const legacy = readJson('fixtures/gameplay-state-v1/legacy-current-save.json');
  const original = structuredClone(legacy);
  const migrated = migrateCompanySave(legacy);
  assert.equal(migrated.save_schema_version, 1);
  assert.equal(migrated.unknown_legacy_field.keep, true);
  assert.deepEqual(legacy, original);
  assert.deepEqual(migrateCompanySave(migrated), migrated);
  const hydrated = hydrateGameplayState(migrated, {
    characters: [
      { character_id: 'npc-existing', initial_stats: { affinity: 0 } },
      { character_id: 'npc-new', initial_stats: { affinity: 1 } }
    ]
  });
  assert.equal(hydrated.npc_stats['npc-existing'].affection, 4);
  assert.equal(hydrated.npc_stats['npc-new'].affinity, 1);
});

test('turn changes use guarded before and after state', () => {
  assert.deepEqual(deriveTurnChanges(
    { player_sexual_state: { arousal: 10 }, npc_stats: { 'npc-a': { affinity: 1 } } },
    { player_sexual_state: { arousal: 12 }, npc_stats: { 'npc-a': { affinity: 2 } } }
  ), [
    { path: 'player_sexual_state.arousal', from: 10, to: 12 },
    { path: 'npc_stats.npc-a.affinity', from: 1, to: 2 }
  ]);
});

test('required fixtures retain CSA lifecycle state and registered character identity', () => {
  const csa = readJson('fixtures/gameplay-state-v1/global-csa-npc-attitudes.json');
  const master = readJson('fixtures/gameplay-state-v1/five-character-master-v1.json');
  assert.equal(csa.csa_active.length, 1);
  assert.equal(master.characters.length, 5);
  assert.deepEqual(master.characters.map(character => character.character_id), ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5']);
  assert.ok(master.characters.every(character => character.mapping_status === 'resolved'));
  assert.deepEqual(csa.csa_runtime_state['csa-global'], { lifecycle: 'temporarily_interrupted', applicability: 'applicable', execution_state: 'interrupted' });
});

test('unsupported sexual completion fixture remains warning-only', () => {
  const result = reducePlayerSexualState({}, readJson('fixtures/gameplay-state-v1/extract-invalid-sexual-completion.json').state_delta.player_sexual_state);
  assert.deepEqual(result.warnings, ['unauthorized_ejaculation_completion_ignored']);
});

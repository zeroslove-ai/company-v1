import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));

const phaseDocs = [
  'docs/PHASE_0_5_GAMEPLAY_CONTRACT.md',
  'docs/TURN_RECOVERY_CONTRACT.md',
  'docs/GUARDED_STATE_MERGE_CONTRACT.md',
  'docs/FEEDBACK_REVISION_CONTRACT.md',
  'docs/SAVE_SCHEMA_MIGRATION_CONTRACT.md'
];

test('Phase 0.5 fixtures parse and canonical save has required shape', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const required = ['save_schema_version', 'edition', 'turn_state', 'player', 'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state', 'npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state', 'npc_work_state', 'csa_active', 'csa_rules', 'csa_attitudes', 'csa_runtime_state', 'csa_aftereffect_state', 'event_ledger', 'story_summary_overall', 'story_summary_recent', 'focal_character_id', 'last_speaker_id', 'last_npcs_present', 'last_image_id', 'last_choices', 'last_choice_meta'];
  for (const field of required) assert.ok(Object.hasOwn(save, field), `missing ${field}`);
  assert.equal(save.save_schema_version, 1);
  assert.notEqual(save.focal_character_id, save.last_speaker_id);
  assert.ok(Object.keys(save.npc_relationship_state).length >= 2);
  assert.ok(save.csa_active.length <= 4);
});

test('relationships and CSA attitudes use independent axes', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const relationship = save.npc_relationship_state['npc-hayeon'];
  for (const field of ['closeness', 'romance_status', 'current_boundary', 'milestones', 'relationship_summary']) assert.ok(Object.hasOwn(relationship, field));
  const attitude = save.csa_attitudes['npc-hayeon'];
  assert.ok(Object.hasOwn(attitude, 'common_sense_baseline'));
  assert.ok(Object.hasOwn(attitude, 'csa_attitudes'));
  assert.ok(Object.hasOwn(attitude.csa_attitudes, 'csa-dress-code'));
  assert.equal(save.csa_rules['csa-dress-code'].execution_mode, 'mandatory');
  assert.equal(save.csa_rules['csa-reporting'].execution_mode, 'normative');
});

test('recovery, merge, and revision fixtures cover guarded behavior', () => {
  const recovery = readJson('fixtures/phase-0.5/recovery-cases.json');
  const states = new Set(recovery.map(item => item.state));
  for (const state of ['story_streaming', 'extracting', 'committing', 'commit_failed']) assert.ok(states.has(state));
  const recoveryIds = new Set(recovery.map(item => item.id));
  for (const id of ['stream-interrupted', 'story-complete-before-extract', 'extract-complete-before-commit', 'commit-response-lost', 'commit-replay', 'commit-conflict', 'rapid-duplicate-click']) assert.ok(recoveryIds.has(id));

  const merge = readJson('fixtures/phase-0.5/state-merge-cases.json');
  for (const item of merge) {
    assert.ok(Array.isArray(item.accepted));
    assert.ok(Array.isArray(item.rejected));
    assert.ok(Array.isArray(item.warnings));
  }
  const revision = readJson('fixtures/phase-0.5/feedback-revision-cases.json');
  assert.equal(revision.find(item => item.id === 'latest-turn-revision').expected, 'revision_allowed');
  assert.equal(revision.find(item => item.id === 'historical-turn-with-successor').expected, 'revision_rejected');
});

test('Phase 0.5 documents and adopted options are present', () => {
  for (const file of phaseDocs) assert.equal(fs.existsSync(path.join(root, file)), true, file);
  const options = read('docs/GAMEPLAY_DESIGN_OPTIONS.md');
  assert.doesNotMatch(options, /^상태:\s*pending user decisions\s*$/m);
  assert.match(options, /^상태:\s*adopted\s*$/m);
  for (const code of ['2C', '3C2', '4C', '5C', '6C', '7C', '8C', '9C', '10C', '11C', '12C', '13C', '14C', '15C', '16C']) assert.ok(options.includes(code));
  const gameplayContract = read('docs/PHASE_0_5_GAMEPLAY_CONTRACT.md');
  assert.match(gameplayContract, /"closeness"/);
  assert.match(gameplayContract, /"romance_status"/);
  assert.match(gameplayContract, /"current_boundary"/);
  assert.doesNotMatch(
    gameplayContract,
    /none\|familiar\|trusted\|romantic_interest\|dating\|kissed\|sexual_relationship/
  );
});

test('Phase 0.5 introduces no SQL, Worker creation, or deployment scripts', () => {
  const changedScope = [...phaseDocs, 'docs/GAMEPLAY_DESIGN_OPTIONS.md', 'docs/GAME_SYSTEM_DESIGN.md', 'docs/NEXT_PHASE_PLAN.md', 'docs/NEW_SESSION_HANDOFF.md'];
  for (const file of changedScope) {
    const source = read(file);
    assert.doesNotMatch(source, /CREATE\s+TABLE|wrangler\s+deploy|cloudflare\s+workers\s+deploy/i, file);
  }
});

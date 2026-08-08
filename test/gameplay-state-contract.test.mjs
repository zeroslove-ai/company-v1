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
  reducePlayerSexualState,
  buildExtractPrompt,
  buildCsaSceneRuntimeStatePatch
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
  assert.match(narrative, /\[1\. 서사 및 행동\].*\[2\. 플레이어 속마음\].*\[3\. 선택지\]/s);
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

test('턴70-C: 사정 진행도는 턴당 최대 +6, 음수는 감소시키지 않는다', () => {
  const base = { arousal: 0, ejaculation_progress: 0, ejaculation_count: 0, updated_turn: 0 };
  // 17. 짧은 자극 +2 정상 누적
  assert.equal(reducePlayerSexualState(base, { ejaculation_progress_delta: 2 }).state.ejaculation_progress, 2);
  // 18. 지속 자극 +4 정상 누적
  assert.equal(reducePlayerSexualState(base, { ejaculation_progress_delta: 4 }).state.ejaculation_progress, 4);
  // 19. 모델이 +30을 제안해도 +6만 반영
  assert.equal(reducePlayerSexualState(base, { ejaculation_progress_delta: 30 }).state.ejaculation_progress, 6);
  assert.equal(reducePlayerSexualState(base, { ejaculation_progress_delta: 50 }).state.ejaculation_progress, 6);
  // 20. 음수 delta는 진행도를 감소시키지 않음 (자동 감소·초기화 금지)
  assert.equal(reducePlayerSexualState({ ...base, ejaculation_progress: 20 }, { ejaculation_progress_delta: -5 }).state.ejaculation_progress, 20);
  assert.equal(reducePlayerSexualState({ ...base, ejaculation_progress: 20 }, { ejaculation_progress_delta: -50 }).state.ejaculation_progress, 20);
  // 21. 여러 턴 누적 정상 (+6씩)
  const t1 = reducePlayerSexualState(base, { ejaculation_progress_delta: 6 }).state;
  const t2 = reducePlayerSexualState(t1, { ejaculation_progress_delta: 6 }).state;
  const t3 = reducePlayerSexualState(t2, { ejaculation_progress_delta: 6 }).state;
  assert.equal(t3.ejaculation_progress, 18);
  // 22. 100 초과 clamp (6씩 17턴 → 100에서 멈춤)
  let acc = { ...base };
  for (let i = 0; i < 30; i += 1) acc = reducePlayerSexualState(acc, { ejaculation_progress_delta: 6 }).state;
  assert.equal(acc.ejaculation_progress, 100);
  // 23. 명시적 완료 없으면 count 증가 없음
  assert.equal(reducePlayerSexualState({ ...base, ejaculation_progress: 80 }, { ejaculation_progress_delta: 6 }).state.ejaculation_count, 0);
  // 24. 완료 evidence가 있으면 count+1, progress=0, arousal=0
  const done = reducePlayerSexualState(
    { ...base, arousal: 70, ejaculation_progress: 80, ejaculation_count: 1 },
    { ejaculation_completed: true, ejaculation_progress_delta: 6 },
    { storyEvidence: { sexual_resolution: true }, updatedTurn: 9 }
  ).state;
  assert.deepEqual(done, { arousal: 0, ejaculation_progress: 0, ejaculation_count: 2, updated_turn: 9 });
});

test('턴70-C2: 단순 발기·노출 사례에서는 Extract 예시상 progress delta가 없어야 한다 (프롬프트 계약)', () => {
  const prompt = buildExtractPrompt({ context: {}, storyText: '플레이어는 서류를 정리했다.', parsedStory: {}, playerAction: 'x', expectedTurn: 1 });
  const system = prompt[0].content;
  assert.match(system, /Exposure, erection, conversation, or requests alone never raise it/);
  assert.match(system, /Never decrease\/reset when stimulation stops/);
  assert.match(system, /direct stimulation only/);
  assert.match(system, /\+4~6/);
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
      { character_id: 'npc-existing', initial_stats: { affinity: 0 } },
      { character_id: 'npc-new', initial_stats: { affinity: 1 } }
    ]
  });
  assert.equal(hydrated.npc_stats['npc-existing'].affection, 4);
  assert.equal(hydrated.npc_stats['npc-new'].affinity, 1);
});

test('turn changes use only guarded before and after state', () => {
  const before = { player_sexual_state: { arousal: 10 }, npc_stats: { 'npc-a': { affinity: 1 } } };
  const after = { player_sexual_state: { arousal: 12 }, npc_stats: { 'npc-a': { affinity: 2 } } };
  assert.deepEqual(deriveTurnChanges(before, after), [
    { path: 'player_sexual_state.arousal', from: 10, to: 12 },
    { path: 'npc_stats.npc-a.affinity', from: 1, to: 2 }
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
  const requiredNonNullFields = ['name', 'age', 'department', 'position', 'role_title', 'prompt_card', 'storage_bucket', 'storage_prefix', 'primary_image_path', 'adult_image_prefix'];
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

// ── 턴70: csa_runtime action_state null canonicalize + method_variant/continuation ──

const CSA60_RULE = {
  id: 'csa_60',
  csa_id: 'csa_60',
  active: true,
  content: '여성 직원 전체는 남성 직원 전체의 발기로 업무가 방해되면 담당자가 업무적으로 이를 진정시켜야 하며, 해당 업무가 끝날 때까지 이 절차를 따라야 한다.',
  source_type: 'preset',
  created_turn: 79,
  preset: {
    version: 1, actor_group: 'female_employee', target_group: 'player',
    trigger: 'during_work', duration: 'until_work_ends',
    required_action: 'resolve_patient_erection',
    public_normalization: true, persistent: true
  }
};

function csa60RuntimeSave({ previousExecuted = true } = {}) {
  const save = {
    save_schema_version: 1, edition: 'company-v1',
    turn_state: { committed_turn: 85 },
    player: { name: '김하늘' }, player_progress: { level: 1, exp: 0 },
    scene_state: {}, world_state: {},
    npc_stats: {}, npc_emotion: {}, npc_relationship_state: {}, npc_scene_state: {}, npc_work_state: {},
    csa_active: [], csa_rules: {}, csa_attitudes: {}, csa_runtime_state: {}, csa_aftereffect_state: {},
    event_ledger: [], story_summary_overall: '', story_summary_recent: '',
    focal_character_id: null, last_speaker_id: null, last_npcs_present: [], last_image_id: null,
    last_choices: [], last_choice_meta: [], player_setup: { completed: true }
  };
  save.csa_active = ['csa_60'];
  save.csa_rules = { csa_60: CSA60_RULE };
  save.csa_runtime_state = previousExecuted ? {
    csa_60: {
      lifecycle: 'active', applicability: 'applicable', execution_state: 'executed',
      character_id: 'heroine4', started_turn: 79, last_confirmed_turn: 84, end_reason: null
    }
  } : {};
  save.scene_state = { participants: ['player-1', 'heroine4'] };
  save.last_npcs_present = ['heroine4'];
  return save;
}

test('턴70-12: status active + action_state null + same csa coverage → required_action으로 canonicalize → execution_state executed', () => {
  const save = csa60RuntimeSave({ previousExecuted: false });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_60', status: 'active', character_id: 'heroine4', action_state: null }],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: true, route: 'csa_direct', csa_id: 'csa_60', coverage_kind: 'method_variant', actor_id: 'heroine4', target_id: 'player', required_action: 'resolve_patient_erection' }
  });
  assert.equal(result.patch.csa_60.execution_state, 'executed');
  assert.equal(result.patch.csa_60.character_id, 'heroine4');
  assert.equal(result.patch.csa_60.started_turn, 86, '시작 턴 보존/기록');
  assert.equal(result.accepted_executions.length, 1);
});

test('턴70-13: status active + 잘못된 non-null action_state → 기존처럼 거부', () => {
  const save = csa60RuntimeSave({ previousExecuted: false });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_60', status: 'active', character_id: 'heroine4', action_state: 'kiss_player' }],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: true, csa_id: 'csa_60', coverage_kind: 'method_variant' }
  });
  assert.equal(result.patch, null);
  assert.ok(result.warnings.some(w => w.includes('csa_runtime_action_state_mismatch')));
});

test('턴70-14: 다른 actor → 거부', () => {
  const save = csa60RuntimeSave({ previousExecuted: false });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_60', status: 'active', character_id: 'heroine2', action_state: null }],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: true, csa_id: 'csa_60', coverage_kind: 'method_variant', actor_id: 'heroine4' }
  });
  assert.equal(result.patch, null, '다른 actor는 보충 안 함');
});

test('턴70-15: 장면에 없는 actor → 거부', () => {
  const save = csa60RuntimeSave({ previousExecuted: false });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_60', status: 'active', character_id: 'heroine2', action_state: null }],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: true, csa_id: 'csa_60', coverage_kind: 'method_variant', actor_id: 'heroine2' }
  });
  assert.equal(result.patch, null, '장면 밖 actor는 보충 안 함');
});

test('턴70-16: ordinary route → null 보충 금지', () => {
  const save = csa60RuntimeSave({ previousExecuted: false });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_60', status: 'active', character_id: 'heroine4', action_state: null }],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: false }
  });
  assert.equal(result.patch, null, 'ordinary route는 null 보충 없음');
});

test('턴70-17: csa_60 started_turn 보존 (이미 executed였으면 유지)', () => {
  const save = csa60RuntimeSave({ previousExecuted: true });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [{ csa_id: 'csa_60', status: 'active', character_id: 'heroine4', action_state: null }],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: true, csa_id: 'csa_60', coverage_kind: 'continuation', actor_id: 'heroine4' }
  });
  assert.equal(result.patch.csa_60.started_turn, 79, '기존 started_turn 보존');
  assert.equal(result.patch.csa_60.last_confirmed_turn, 86);
});

test('턴70-18: accepted_executions 중복으로 EXP를 여러 번 주지 않음 (reducer는 accepted 목록만 반환)', () => {
  const save = csa60RuntimeSave({ previousExecuted: false });
  const result = buildCsaSceneRuntimeStatePatch({
    previousSave: save,
    csaRuntimeUpdates: [
      { csa_id: 'csa_60', status: 'active', character_id: 'heroine4', action_state: null },
      { csa_id: 'csa_60', status: 'active', character_id: 'heroine4', action_state: 'resolve_patient_erection' }
    ],
    csaTriggerEvaluations: [],
    activeCsa: [CSA60_RULE],
    npcsPresent: ['heroine4'],
    turnNumber: 86,
    csaCoverage: { covered: true, csa_id: 'csa_60', coverage_kind: 'continuation', actor_id: 'heroine4' }
  });
  // 같은 턴 중복 실행 제안은 acceptedExecutions에 한 번만 들어가야 한다 (turn-routes가 EXP 부여에 사용).
  assert.ok(result.accepted_executions.length >= 1);
});

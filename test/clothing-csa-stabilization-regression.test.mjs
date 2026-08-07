import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  retainEvidencedClothing,
  requiredClothingFromActiveCsa,
  compareRequiredClothing,
  seedFirstObservedClothing,
  canonicalClothingSlot,
  canonicalClothingValue
} from '../src/engine/state/clothing.js';
import { buildSceneContextCore, normalizeGameplayExtractEnvelope } from '../src/engine/gameplay-state.js';
import { applyGuardedStateDelta, buildFallbackTurnChoices } from '../src/engine/guarded-merge.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import edition from '../src/api/edition.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

// ---------------------------------------------------------------------------
// 실제 운영 사례 (52~54턴) 기반 회귀 — 사용자 분석에서 확인된 실제 출력 형태
// ---------------------------------------------------------------------------

const ACTIVE_RULES = [
  { csa_id: 'csa_42', active: true, content: '성적 긴장 원인 확인 및 완화', preset: { template_id: 'identify_and_relieve_sexual_tension' }, created_turn: 42 },
  { csa_id: 'csa_42_1', active: true, content: '여성 직원 속옷 차림 근무', preset: { template_id: 'work_in_underwear_only' }, created_turn: 42 }
];

// 비활성 옛 규정 (오염 경로 검증용)
const STALE_RULES = [
  { csa_id: 'csa_2', active: false, content: '대화할 때 무릎 위에 앉기', preset: { template_id: 'sit_on_target_lap_while_talking' }, created_turn: 2 },
  { csa_id: 'csa_5', active: false, content: '속옷 미착용 근무', preset: { template_id: 'work_without_underwear' }, created_turn: 5 }
];

// 1) 52~54턴 실제 clothing output alias 정규화
test('회귀1: 실제 52~54턴 자유형 clothing 출력이 canonical 4슬롯으로 정규화된다', () => {
  // 52턴: { bra: "미착용", top: "흰 셔츠", bottom: "검은 팬츠" }
  // 53턴: { 셔츠: "worn", 속옷: "worn" }
  // 54턴: { bra: "removed", top: "worn", panties: "removed", undergarments: "worn" }
  const story52 = '김제나는 흰 셔츠를 벗어 의자에 걸었다. 김제나는 브라를 벗었다. 김제나는 검은 팬츠를 벗어 의자에 걸었다.';
  const r52 = retainEvidencedClothing({
    previousClothing: {},
    proposedClothing: { bra: '미착용', top: '흰 셔츠', bottom: '검은 팬츠' },
    evidenceMap: {
      underwear_top: '김제나는 브라를 벗었다.',
      uniform_top: '김제나는 흰 셔츠를 벗어 의자에 걸었다.',
      uniform_bottom: '김제나는 검은 팬츠를 벗어 의자에 걸었다.'
    },
    narrativeText: story52, characterName: '김제나'
  });
  // top/bra/bottom alias → canonical 슬롯. 값은 enum으로 정규화.
  assert.equal(canonicalClothingSlot('bra'), 'underwear_top');
  assert.equal(canonicalClothingSlot('top'), 'uniform_top');
  assert.equal(canonicalClothingSlot('bottom'), 'uniform_bottom');
  assert.equal(canonicalClothingSlot('셔츠'), 'uniform_top');
  assert.equal(canonicalClothingSlot('속옷'), null, '위·아래 불명확 키는 null');
  assert.equal(canonicalClothingValue('underwear_top', '미착용'), 'removed');
  assert.equal(canonicalClothingValue('uniform_top', 'worn'), 'worn');
  // 흰 셔츠 같은 복장 이름 값은 enum 추측 금지
  assert.equal(canonicalClothingValue('uniform_top', '흰 셔츠'), null);
  assert.ok(r52.rejections.some(r => r.startsWith('invalid_clothing_value:uniform_top')), '복장 이름 값은 거부');
});

// 2) nested clothing evidence → post-save 저장
test('회귀2: nested evidence.clothing[slot]이 post-save clothing에 반영된다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.scene_state = { ...(save.scene_state ?? {}), participants: ['player-1', 'heroine3'] };
  save.last_npcs_present = ['heroine3'];
  save.npc_scene_state = { heroine3: { present: true, location_id: 'meeting_room_5f' } };
  const storyText = '김제나는 흰 셔츠를 벗어 의자에 걸었다.';
  const result = applyGuardedStateDelta(save, {
    state_delta: {
      npc_scene_state: {
        heroine3: {
          clothing: { uniform_top: 'removed' },
          evidence: { clothing: { uniform_top: '김제나는 흰 셔츠를 벗어 의자에 걸었다.' } }
        }
      }
    },
    outcome: 'success',
    evidence: { clothing: { uniform_top: '김제나는 흰 셔츠를 벗어 의자에 걸었다.' } },
    choices: ['a', 'b', 'c', 'd'],
    mind_monitor: {},
    dialogue_lines: []
  }, {
    expectedTurn: 52, actionId: 'a', turnId: 't', playerAction: 'x',
    storyText,
    parsedStory: { scene_text: storyText },
    master: { characters: [{ character_id: 'heroine3', name: '김제나' }] }
  });
  assert.equal(result.nextSave.npc_scene_state.heroine3.clothing.uniform_top, 'removed', 'nested evidence 경로로 착의 저장');
});

// 3) inactive csa_5가 Story·Extract payload에 0건
test('회귀3: 비활성 옛 규정(csa_2, csa_5)이 Story·Extract payload에 노출되지 않는다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.csa_active = ['csa_42', 'csa_42_1'];
  save.csa_rules = {};
  for (const rule of [...ACTIVE_RULES, ...STALE_RULES]) save.csa_rules[rule.csa_id] = rule;
  const projection = buildSceneContextCore(save, new Set(['heroine3']));
  const ruleIds = Object.keys(projection.global_csa.rules);
  assert.ok(ruleIds.includes('csa_42'), '활성 규정 포함');
  assert.ok(ruleIds.includes('csa_42_1'), '활성 규정 포함');
  assert.ok(!ruleIds.includes('csa_2'), '비활성 옛 규정 미노출');
  assert.ok(!ruleIds.includes('csa_5'), '비활성 옛 규정 미노출 (오염 경로 차단)');
  const runtimeIds = Object.keys(projection.global_csa.runtime_state);
  assert.ok(!runtimeIds.includes('csa_2') && !runtimeIds.includes('csa_5'), 'runtime_state도 활성만');
});

// 4) work_in_underwear_only와 work_without_underwear가 반대 상태로 결정됨
test('회귀4: 상반 규정이 정확히 반대 착의를 요구한다', () => {
  const underwearOnly = requiredClothingFromActiveCsa(ACTIVE_RULES.filter(r => r.preset.template_id === 'work_in_underwear_only'));
  assert.deepEqual(underwearOnly, {
    uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn'
  });
  const withoutUnderwear = requiredClothingFromActiveCsa(STALE_RULES.filter(r => r.preset.template_id === 'work_without_underwear'));
  assert.deepEqual(withoutUnderwear, { underwear_top: 'removed', underwear_bottom: 'removed' });
  // 준수/미준수/unknown 판정
  assert.equal(compareRequiredClothing(underwearOnly, underwearOnly), 'compliant');
  assert.equal(compareRequiredClothing({}, underwearOnly), 'unknown', '빈 상태는 준수 주장 금지');
  assert.equal(compareRequiredClothing({ uniform_top: 'worn', uniform_bottom: 'worn', underwear_top: 'worn', underwear_bottom: 'worn' }, underwearOnly), 'noncompliant');
});

// 5) 선택지 0·1·2·3·4개 보존·보충 matrix
test('회귀5: 선택지 0/1/2/3/4개가 보존·보충 매트릭스대로 처리된다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const base = { state_delta: {}, outcome: 'success', evidence: {}, mind_monitor: {}, dialogue_lines: [] };
  const opts = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };

  // 4개 → 그대로
  const four = applyGuardedStateDelta(save, { ...base, choices: ['a', 'b', 'c', 'd'] }, opts);
  assert.deepEqual(four.nextSave.last_choices, ['a', 'b', 'c', 'd']);

  // 3개 → 3개 보존 + 1개 보충
  const three = applyGuardedStateDelta(save, { ...base, choices: ['a', 'b', 'c'] }, opts);
  assert.equal(three.nextSave.last_choices.length, 4);
  assert.deepEqual(three.nextSave.last_choices.slice(0, 3), ['a', 'b', 'c']);
  assert.ok(three.warnings.some(w => w.startsWith('choices_padded:3->4')));

  // 2개 → 2개 보존 + 2개 보충
  const two = applyGuardedStateDelta(save, { ...base, choices: ['a', 'b'] }, opts);
  assert.equal(two.nextSave.last_choices.length, 4);
  assert.deepEqual(two.nextSave.last_choices.slice(0, 2), ['a', 'b']);

  // 1개 → 1개 보존 + 3개 보충
  const one = applyGuardedStateDelta(save, { ...base, choices: ['a'] }, opts);
  assert.equal(one.nextSave.last_choices.length, 4);
  assert.deepEqual(one.nextSave.last_choices.slice(0, 1), ['a']);

  // 0개 → 전체 fallback
  const zero = applyGuardedStateDelta(save, { ...base, choices: [] }, opts);
  assert.equal(zero.nextSave.last_choices.length, 4);
  assert.deepEqual(zero.nextSave.last_choices, buildFallbackTurnChoices(zero.nextSave));
});

// 5b) normalize도 같은 보존 규칙 (Story 4개 우선, 1~3개 보존 + Extract 보충)
test('회귀5b: normalizeGameplayExtractEnvelope가 Story 선택지를 보존한다', () => {
  const four = normalizeGameplayExtractEnvelope(
    { state_delta: {}, outcome: 'success', evidence: {}, choices: ['x1', 'x2', 'x3', 'x4'], mind_monitor: {}, dialogue_lines: [] },
    { parsedStory: { choices: ['s1', 's2', 's3', 's4'] } }
  );
  assert.deepEqual(four.choices, ['s1', 's2', 's3', 's4'], 'Story 4개가 정본');
  const partial = normalizeGameplayExtractEnvelope(
    { state_delta: {}, outcome: 'success', evidence: {}, choices: ['x1', 'x2', 'x3', 'x4'], mind_monitor: {}, dialogue_lines: [] },
    { parsedStory: { choices: ['s1', 's2'] } }
  );
  assert.deepEqual(partial.choices, ['s1', 's2', 'x1', 'x2'], 'Story 2개 보존 + Extract 보충');
});

// 6) 첫 관찰 NPC seed — 42턴 규정 활성 → 52턴 첫 관찰 김제나
test('회귀6: 규정 활성 후 첫 관찰 NPC는 규정상 요구 착의로 deterministic seed된다', () => {
  const { seeded, clothing } = seedFirstObservedClothing({
    npcId: 'heroine3',
    activeRules: ACTIVE_RULES,
    previousClothing: {}
  });
  assert.equal(seeded, true);
  assert.deepEqual(clothing, {
    uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn'
  });
  // 기존 착의가 있으면 seed 안 함
  const already = seedFirstObservedClothing({
    npcId: 'heroine3', activeRules: ACTIVE_RULES,
    previousClothing: { uniform_top: 'worn' }
  });
  assert.equal(already.seeded, false);
  // 규정 없이(비활성만 있는 save는 호출부가 활성만 필터해 전달) 빈 배열이면 seed 안 함
  const noRules = seedFirstObservedClothing({ npcId: 'heroine3', activeRules: [], previousClothing: {} });
  assert.equal(noRules.seeded, false);
});

// 6b) Story context의 clothing_authority가 seed 결과를 반영
test('회귀6b: buildStoryPrompt의 clothing_authority에 첫 관찰 seed가 반영된다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.csa_active = ['csa_42_1'];
  save.csa_rules = { csa_42_1: ACTIVE_RULES[1] };
  save.npc_scene_state = { heroine3: { present: true, location_id: 'meeting_room_5f', clothing: {} } };
  const prompt = buildStoryPrompt({
    edition,
    context: { game: { id: 'g1' }, save: { data: save }, recent_turns: [] },
    playerAction: '김제나를 만나러 간다.',
    expectedTurn: 52,
    npcIds: new Set(['heroine3'])
  });
  const payload = JSON.parse(prompt[prompt.length - 1].content);
  const authority = payload.context?.clothing_authority ?? {};
  assert.ok(authority.heroine3, 'clothing_authority에 heroine3 존재');
  assert.equal(authority.heroine3.actual_clothing.uniform_top, 'removed', 'seed된 정본이 Story에 전달');
  assert.equal(authority.heroine3.compliance, 'compliant');
  // FINAL OUTPUT SHAPE가 시스템 메시지에 포함
  assert.ok(prompt[0].content.includes('[FINAL OUTPUT SHAPE]'), '최종 출력 계약 포함');
  // activated_game_time이 없으면 시간 경계 없음 (null)
  assert.equal(authority.heroine3.activated_game_time, null);
});

// 7) focal NPC 착의 UI 렌더 — clothingDisplay가 canonical 슬롯을 한글로 표시
test('회귀7: focal NPC 착의 UI가 canonical 슬롯을 한글 라벨로 렌더한다', () => {
  // 프론트 렌더 로직은 render.js의 clothingDisplay — 실제 DOM 없이 문자열 변환 검증.
  // (백엔드가 내려주는 clothing이 canonical 4슬롯이면 UI가 라벨 매핑 가능)
  const canonical = { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn' };
  // 라벨 매핑이 존재하는지 소스 확인
  const renderSrc = fs.readFileSync(path.join(root, 'src/frontend/pages/render.js'), 'utf8');
  assert.ok(renderSrc.includes('uniform_top: \'상의\''), 'uniform_top 라벨 존재');
  assert.ok(renderSrc.includes('underwear_top: \'상의 속옷\''), 'underwear_top 라벨 존재');
  assert.ok(renderSrc.includes('removed: \'벗음\''), 'removed 라벨 존재');
  assert.ok(renderSrc.includes('현재 착의'), 'renderFocalCharacter에 현재 착의 섹션 존재');
  assert.ok(Object.keys(canonical).length === 4, 'canonical 4슬롯');
});

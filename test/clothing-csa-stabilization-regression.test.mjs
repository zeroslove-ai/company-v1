import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  retainEvidencedClothing,
  requiredClothingFromActiveCsa,
  compareRequiredClothing,
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
  { csa_id: 'csa_42_1', active: true, content: '여성 직원 속옷 차림 근무', preset: { template_id: 'work_in_underwear_only', affected_group: 'female_employee', mode: 'continuous' }, created_turn: 42 }
];

// 1) 52~54턴 실제 clothing output alias 정규화
test('회귀1: 실제 52~54턴 자유형 clothing 출력이 canonical 4슬롯으로 정규화된다', () => {
  const story = '김제나는 흰 셔츠를 벗어 의자에 걸었다. 김제나는 브라를 벗었다. 김제나는 검은 팬츠를 벗어 의자에 걸었다.';
  const r52 = retainEvidencedClothing({
    previousClothing: {},
    proposedClothing: { bra: '미착용', top: '흰 셔츠', bottom: '검은 팬츠' },
    evidenceMap: {
      underwear_top: '김제나는 브라를 벗었다.',
      uniform_top: '김제나는 흰 셔츠를 벗어 의자에 걸었다.',
      uniform_bottom: '김제나는 검은 팬츠를 벗어 의자에 걸었다.'
    },
    narrativeText: story, characterName: '김제나'
  });
  assert.equal(canonicalClothingSlot('bra'), 'underwear_top');
  assert.equal(canonicalClothingSlot('top'), 'uniform_top');
  assert.equal(canonicalClothingSlot('bottom'), 'uniform_bottom');
  assert.equal(canonicalClothingSlot('셔츠'), 'uniform_top');
  assert.equal(canonicalClothingSlot('속옷'), null, '위·아래 불명확 키는 null');
  assert.equal(canonicalClothingValue('underwear_top', '미착용'), 'removed');
  assert.equal(canonicalClothingValue('uniform_top', 'worn'), 'worn');
  assert.equal(canonicalClothingValue('uniform_top', '흰 셔츠'), null, '복장 이름 값은 enum 추측 금지');
  assert.ok(r52.rejections.some(r => r.startsWith('invalid_clothing_value:uniform_top')), '복장 이름 값은 거부');
});

// 2) nested clothing evidence → post-save 저장
test('회귀2: actor-level evidence.clothing[actor_id]이 post-save clothing에 반영된다', () => {
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
          evidence: { clothing: '김제나는 흰 셔츠를 벗어 의자에 걸었다.' }
        }
      }
    },
    outcome: 'success',
    evidence: {
      clothing: { heroine3: { quote: '김제나는 흰 셔츠를 벗어 의자에 걸었다.', character_id: 'heroine3' } }
    },
    choices: ['a', 'b', 'c', 'd'],
    mind_monitor: {},
    dialogue_lines: []
  }, {
    expectedTurn: 52, actionId: 'a', turnId: 't', playerAction: 'x',
    storyText,
    parsedStory: { scene_text: storyText },
    master: { characters: [{ character_id: 'heroine3', name: '김제나' }] }
  });
  assert.equal(result.nextSave.npc_scene_state.heroine3.clothing.uniform_top, 'removed', 'actor-level evidence 경로로 착의 저장');
});

// 3) inactive csa_5가 Story·Extract payload에 0건
test('회귀3: 비활성 옛 규정(csa_2, csa_5)이 Story·Extract payload에 노출되지 않는다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.csa_active = ['csa_42', 'csa_42_1'];
  save.csa_rules = {};
  for (const rule of [...ACTIVE_RULES, { csa_id: 'csa_2', active: false, content: '대화할 때 무릎 위에 앉기' }, { csa_id: 'csa_5', active: false, content: '속옷 미착용 근무' }]) save.csa_rules[rule.csa_id] = rule;
  const projection = buildSceneContextCore(save, new Set(['heroine3']));
  const ruleIds = Object.keys(projection.global_csa.rules);
  assert.ok(ruleIds.includes('csa_42'));
  assert.ok(ruleIds.includes('csa_42_1'));
  assert.ok(!ruleIds.includes('csa_2'));
  assert.ok(!ruleIds.includes('csa_5'));
  const runtimeIds = Object.keys(projection.global_csa.runtime_state);
  assert.ok(!runtimeIds.includes('csa_2') && !runtimeIds.includes('csa_5'));
});

test('회귀3b: scene participants가 stale NPC present/location을 projection에서 덮는다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.scene_state = { ...save.scene_state, location_id: 'meeting_room', participants: ['player', 'heroine3'] };
  save.npc_scene_state = {
    ...(save.npc_scene_state ?? {}),
    heroine3: { present: false, location_id: 'old_room', posture: '서 있다' },
    heroine4: { present: true, location_id: 'meeting_room' }
  };
  const before = structuredClone(save);
  const projection = buildSceneContextCore(save, ['heroine3', 'heroine4']);
  assert.equal(projection.active_npc_state.npc_scene_state.heroine3.present, true);
  assert.equal(projection.active_npc_state.npc_scene_state.heroine3.location_id, 'meeting_room');
  assert.equal(projection.active_npc_state.npc_scene_state.heroine4.present, false);
  assert.deepEqual(save, before, 'projection does not mutate save');
});

// 4) 상반 규정 최소 정책 — 0개/1개/2개+ conflicted
test('회귀4: 상반 규정이 정확히 반대 착의를 요구한다 (0개/1개/2개+ conflicted)', () => {
  // female_employee 규정이므로 여성 NPC 프로필을 넘긴다
  const femaleProfile = { gender: 'female' };
  const underwearOnly = requiredClothingFromActiveCsa(ACTIVE_RULES.filter(r => r.preset.template_id === 'work_in_underwear_only'), femaleProfile);
  assert.deepEqual(underwearOnly.required_clothing, {
    uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn'
  });
  assert.equal(underwearOnly.source_csa_id, 'csa_42_1');
  assert.equal(underwearOnly.conflicted, false);

  const withoutUnderwear = requiredClothingFromActiveCsa([{ csa_id: 'csa_5', active: true, preset: { template_id: 'work_without_underwear', affected_group: 'female_employee', mode: 'continuous' } }], femaleProfile);
  assert.deepEqual(withoutUnderwear.required_clothing, { underwear_top: 'removed', underwear_bottom: 'removed' });

  // 규정 0개 → 빈 required
  const none = requiredClothingFromActiveCsa([], femaleProfile);
  assert.deepEqual(none.required_clothing, {});
  assert.equal(none.source_csa_id, null);

  // 상반 규정 2개 이상 → 미확정 (우선순위 추론 없음)
  const both = requiredClothingFromActiveCsa([
    { csa_id: 'x1', active: true, preset: { template_id: 'work_in_underwear_only', affected_group: 'female_employee', mode: 'continuous' } },
    { csa_id: 'x2', active: true, preset: { template_id: 'work_without_underwear', affected_group: 'female_employee', mode: 'continuous' } }
  ], femaleProfile);
  assert.deepEqual(both.required_clothing, {});
  assert.equal(both.source_csa_id, null);
  assert.equal(both.conflicted, true);

  // 준수/미준수/unknown 판정
  const req = underwearOnly.required_clothing;
  assert.equal(compareRequiredClothing(req, req), 'compliant');
  assert.equal(compareRequiredClothing({}, req), 'unknown', '빈 상태는 준수 주장 금지');
  assert.equal(compareRequiredClothing({ uniform_top: 'worn', uniform_bottom: 'worn', underwear_top: 'worn', underwear_bottom: 'worn' }, req), 'noncompliant');
});

// 4b) female_employee 규정은 gender==='female' NPC에게만 적용
test('회귀4b: female_employee 규정이 남성/성별 미상 NPC에게 적용되지 않는다', () => {
  const rule = { csa_id: 'csa_42_1', active: true, preset: { template_id: 'work_in_underwear_only', affected_group: 'female_employee', mode: 'continuous' } };
  const female = requiredClothingFromActiveCsa([rule], { gender: 'female' });
  assert.ok(Object.keys(female.required_clothing).length > 0, '여성 NPC는 적용');
  const male = requiredClothingFromActiveCsa([rule], { gender: 'male' });
  assert.deepEqual(male.required_clothing, {}, '남성 NPC required_clothing은 빈 객체');
  assert.equal(male.source_csa_id, null);
  const unknown = requiredClothingFromActiveCsa([rule], {});
  assert.deepEqual(unknown.required_clothing, {}, 'gender 미상 NPC도 미적용');
});

// 5) 선택지 0·1·2·3·4개 보존·보충 matrix
test('회귀5: 선택지 0/1/2/3/4개가 Story 정본 기준 보존·보충된다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  const base = { state_delta: {}, outcome: 'success', evidence: {}, mind_monitor: {}, dialogue_lines: [] };
  const opts = { expectedTurn: 8, actionId: 'a', turnId: 't', playerAction: 'x' };

  // Extract choices는 저장 정본이 아니다 — parsed Story 선택지만 사용한다.
  const four = applyGuardedStateDelta(save, { ...base, choices: ['x1', 'x2', 'x3', 'x4'] }, {
    ...opts, parsedStory: { choices: ['a', 'b', 'c', 'd'] }
  });
  assert.deepEqual(four.nextSave.last_choices, ['a', 'b', 'c', 'd'], 'Story 4개가 정본');

  const three = applyGuardedStateDelta(save, { ...base, choices: ['x1', 'x2', 'x3', 'x4'] }, {
    ...opts, parsedStory: { choices: ['a', 'b', 'c'] }
  });
  assert.equal(three.nextSave.last_choices.length, 4, '3개 보존 + 1개 보충');
  assert.deepEqual(three.nextSave.last_choices.slice(0, 3), ['a', 'b', 'c']);
  assert.ok(three.warnings.some(w => w.startsWith('choices_padded:3->4')));

  const two = applyGuardedStateDelta(save, { ...base, choices: [] }, {
    ...opts, parsedStory: { choices: ['a', 'b'] }
  });
  assert.equal(two.nextSave.last_choices.length, 4);
  assert.deepEqual(two.nextSave.last_choices.slice(0, 2), ['a', 'b']);

  const one = applyGuardedStateDelta(save, { ...base, choices: [] }, {
    ...opts, parsedStory: { choices: ['a'] }
  });
  assert.equal(one.nextSave.last_choices.length, 4);
  assert.deepEqual(one.nextSave.last_choices.slice(0, 1), ['a']);

  const zero = applyGuardedStateDelta(save, { ...base, choices: [] }, {
    ...opts, parsedStory: { choices: [] }
  });
  assert.equal(zero.nextSave.last_choices.length, 4, '0개면 UI 안전 기본 4개');
  assert.deepEqual(zero.nextSave.last_choices, buildFallbackTurnChoices(zero.nextSave));
});


// 5b) normalize도 같은 보존 규칙 (Story 4개 우선, 1~3개 보존 + Extract 보충)
test('회귀5b: normalizeGameplayExtractEnvelope가 Story 선택지(parsed)만 정본으로 쓴다', () => {
  const four = normalizeGameplayExtractEnvelope(
    { state_delta: {}, outcome: 'success', evidence: {}, choices: ['x1', 'x2', 'x3', 'x4'], mind_monitor: {}, dialogue_lines: [] },
    { parsedStory: { choices: ['s1', 's2', 's3', 's4'] } }
  );
  assert.deepEqual(four.choices, ['s1', 's2', 's3', 's4'], 'Story 4개가 정본');
  const partial = normalizeGameplayExtractEnvelope(
    { state_delta: {}, outcome: 'success', evidence: {}, choices: ['x1', 'x2', 'x3', 'x4'], mind_monitor: {}, dialogue_lines: [] },
    { parsedStory: { choices: ['s1', 's2'] } }
  );
  assert.deepEqual(partial.choices, ['s1', 's2'], 'Extract choices는 저장 정본으로 사용하지 않는다');
  const none = normalizeGameplayExtractEnvelope(
    { state_delta: {}, outcome: 'success', evidence: {}, choices: ['x1', 'x2', 'x3', 'x4'], mind_monitor: {}, dialogue_lines: [] },
    { parsedStory: { choices: [] } }
  );
  assert.deepEqual(none.choices, [], '0개면 빈 배열 (guarded-merge가 보충)');
});


// 6) actual_clothing은 저장값만 — 규정/빈 clothing으로 생성하지 않는다
test('회귀6: save clothing={} → Story actual_clothing={} (규정만으로 생성 안 함)', () => {
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
  // 검토 판정: 저장값이 비어 있으면 actual_clothing={} — 규정만으로 생성·승격 금지
  assert.deepEqual(authority.heroine3.actual_clothing, {}, '저장값 그대로 (빈 객체)');
  // suggested_initial_clothing / observation_status 필드가 없어야 한다
  assert.ok(!('suggested_initial_clothing' in authority.heroine3), 'suggested 필드 없음');
  assert.ok(!('observation_status' in authority.heroine3), 'observation status 없음');
  // 여성 NPC에게는 required가 표시된다 (규정 1개)
  assert.ok(Object.keys(authority.heroine3.required_clothing).length > 0, '여성 NPC required 표시');
});

// 6b) 남성 NPC의 clothing_authority.required_clothing은 빈 객체
test('회귀6b: 남성 NPC는 female_employee 규정의 required_clothing이 빈 객체다', () => {
  const save = readJson('fixtures/phase-0.5/canonical-save-v1.json');
  save.csa_active = ['csa_42_1'];
  save.csa_rules = { csa_42_1: ACTIVE_RULES[1] };
  // 남성 일반 NPC — female_employee 규정 적용 금지
  save.npc_scene_state = { male_npc: { present: true, location_id: 'office', clothing: {} } };
  const maleEdition = {
    ...edition,
    generalNpcs: { profiles: { male_npc: { id: 'male_npc', name: '남성 직원', gender: 'male' } } }
  };
  const prompt = buildStoryPrompt({
    edition: maleEdition,
    context: { game: { id: 'g1' }, save: { data: save }, recent_turns: [] },
    playerAction: '남성 직원을 본다.',
    expectedTurn: 52,
    npcIds: new Set(['male_npc'])
  });
  const payload = JSON.parse(prompt[prompt.length - 1].content);
  const authority = payload.context?.clothing_authority ?? {};
  assert.ok(authority.male_npc, 'clothing_authority에 male_npc 존재');
  assert.deepEqual(authority.male_npc.required_clothing, {}, '남성 NPC required_clothing은 빈 객체');
  assert.equal(authority.male_npc.rule_id, null);
});

// 7) focal NPC 착의 UI — canonical 슬롯 라벨
test('회귀7: focal NPC 착의 UI가 canonical 슬롯을 한글 라벨로 렌더한다', () => {
  const canonical = { uniform_top: 'removed', uniform_bottom: 'removed', underwear_top: 'worn', underwear_bottom: 'worn' };
  const renderSrc = fs.readFileSync(path.join(root, 'src/frontend/pages/render.js'), 'utf8');
  assert.ok(renderSrc.includes('uniform_top: \'상의\''), 'uniform_top 라벨 존재');
  assert.ok(renderSrc.includes('underwear_top: \'상의 속옷\''), 'underwear_top 라벨 존재');
  assert.ok(renderSrc.includes('removed: \'벗음\''), 'removed 라벨 존재');
  assert.ok(renderSrc.includes('현재 착의'), 'renderFocalCharacter에 현재 착의 섹션 존재');
  assert.ok(renderSrc.includes('확인되지 않음'), '빈 상태는 확인되지 않음 표시');
  assert.ok(Object.keys(canonical).length === 4, 'canonical 4슬롯');
});

test('V2 복장 정본: on_player_request 노출 프리셋은 요청 전 required_clothing을 만들지 않는다', () => {
  const rules = [
    { csa_id: 'expose-breasts', active: true, preset: { template_id: 'expose_breasts_on_request', affected_group: 'female_employee', mode: 'on_player_request' } },
    { csa_id: 'expose-genitals', active: true, preset: { template_id: 'expose_genitals_on_request', affected_group: 'female_employee', mode: 'on_player_request' } }
  ];
  assert.deepEqual(requiredClothingFromActiveCsa(rules, { gender: 'female' }).required_clothing, {});
});

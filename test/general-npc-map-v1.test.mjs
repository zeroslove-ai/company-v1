import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listGeneralNpcs, getGeneralNpc, isGeneralNpcId } from '../src/engine/npc/catalog.js';
import { resolveGeneralNpcForGroup } from '../src/engine/npc/resolver.js';
import { findNpc } from '../src/engine/npc/location.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const generalNpcs = readJson('content/general_npcs.json');
const map = readJson('content/map.json');
const organization = readJson('content/organization.json');

const EXPECTED = [
  { id: 'general_park_jungwoo', name: '박정우', sex: 'male', age: 38, department_id: 'brand_strategy', type: 'employee' },
  { id: 'general_lee_minseok', name: '이민석', sex: 'male', age: 29, department_id: 'design', type: 'employee' },
  { id: 'general_choi_yujin', name: '최유진', sex: 'female', age: 27, department_id: 'finance', type: 'employee' },
  { id: 'general_seo_hyejin', name: '서혜진', sex: 'female', age: 34, department_id: 'hr', type: 'employee' },
  { id: 'general_oh_sehoon', name: '오세훈', sex: 'male', age: 46, department_id: 'operations', type: 'employee' },
  { id: 'general_yoon_taekyung', name: '윤태경', sex: 'male', age: 31, department_id: null, type: 'partner' },
  { id: 'general_jung_daeun', name: '정다은', sex: 'female', age: 25, department_id: 'marketing', type: 'employee' },
  { id: 'general_han_jiseok', name: '한지석', sex: 'male', age: 40, department_id: 'management_support', type: 'employee' }
];

test('general NPC catalog: exactly the 8 specified people, with exact id/name/sex/age/department_id/type', () => {
  const npcs = listGeneralNpcs(generalNpcs);
  assert.equal(npcs.length, 8);
  for (const expected of EXPECTED) {
    const actual = getGeneralNpc(generalNpcs, expected.id);
    assert.ok(actual, `missing ${expected.id}`);
    assert.equal(actual.name, expected.name);
    assert.equal(actual.sex, expected.sex);
    assert.equal(actual.age, expected.age);
    assert.equal(actual.department_id, expected.department_id);
    assert.equal(actual.type, expected.type);
  }
});

test('general NPC catalog: none of the 8 ids collide with an existing heroine id', () => {
  const heroines = readJson('content/characters.json');
  const heroineIds = new Set(Object.keys(heroines.characters ?? heroines));
  for (const npc of listGeneralNpcs(generalNpcs)) assert.equal(heroineIds.has(npc.id), false, `${npc.id} collides with a heroine id`);
});

test('general NPC catalog: every non-null department_id referenced by a general NPC is defined (either in the player-setup departments list or general_npc_departments); external partners use department_id:null + affiliation_type:"partner" instead of a fake internal department', () => {
  const validDepartments = new Set([
    ...organization.departments.map(d => d.department_id),
    ...organization.general_npc_departments.map(d => d.department_id)
  ]);
  for (const npc of listGeneralNpcs(generalNpcs)) {
    if (npc.department_id === null) {
      assert.equal(npc.affiliation_type, 'partner', `${npc.id} has department_id:null but is not tagged affiliation_type:'partner'`);
      continue;
    }
    assert.ok(validDepartments.has(npc.department_id), `undefined department_id: ${npc.department_id}`);
    assert.equal(npc.affiliation_type, 'employee');
  }
});

test('general NPC catalog: general_npc_departments never duplicates a department_id already in the player-facing departments list', () => {
  const playerFacing = new Set(organization.departments.map(d => d.department_id));
  for (const dept of organization.general_npc_departments) assert.equal(playerFacing.has(dept.department_id), false, `${dept.department_id} duplicated across both lists`);
});

test('map catalog: all 16 specified location_ids are present', () => {
  const expectedIds = ['lobby', 'training_room', 'office', 'team_office', 'small_meeting_room', 'meeting_room', 'project_room', 'cross_team_space', 'cross_dept_meeting_room', 'large_meeting_room', 'executive_meeting_room', 'project_report_room', 'pantry', 'employee_lounge', 'elevator_hall', 'archive_room'];
  const actualIds = map.locations.map(l => l.location_id);
  assert.equal(actualIds.length, 16);
  for (const id of expectedIds) assert.ok(actualIds.includes(id), `missing location_id: ${id}`);
});

const VISIBILITY_VALUES = new Set(['public', 'restricted', 'private']);

test('map catalog: every location has the full required schema (location_id, name, floor, department_id-or-null, location_type, visibility, access_roles, adjacent_location_ids, default_npc_ids, scene_tags)', () => {
  for (const location of map.locations) {
    assert.equal(typeof location.location_id, 'string');
    assert.equal(typeof location.name, 'string');
    assert.ok(location.name, `${location.location_id} has an empty name`);
    assert.equal(typeof location.floor, 'number');
    assert.ok(location.department_id === null || typeof location.department_id === 'string');
    assert.equal(typeof location.location_type, 'string');
    assert.ok(VISIBILITY_VALUES.has(location.visibility), `${location.location_id} has an invalid visibility: ${location.visibility}`);
    assert.ok(Array.isArray(location.access_roles));
    assert.ok(Array.isArray(location.adjacent_location_ids));
    assert.ok(Array.isArray(location.default_npc_ids));
    assert.ok(Array.isArray(location.scene_tags));
  }
});

test('map catalog: every adjacent_location_id refers to a real location in this same catalog', () => {
  const validIds = new Set(map.locations.map(l => l.location_id));
  for (const location of map.locations) {
    for (const adjacentId of location.adjacent_location_ids) {
      assert.ok(validIds.has(adjacentId), `${location.location_id} references unknown adjacent location: ${adjacentId}`);
    }
  }
});

test('map catalog: every default_npc_id refers to a real general NPC or heroine', () => {
  const heroines = readJson('content/characters.json');
  const heroineIds = new Set(Object.keys(heroines.characters ?? heroines));
  for (const location of map.locations) {
    for (const npcId of location.default_npc_ids) {
      assert.ok(isGeneralNpcId(generalNpcs, npcId) || heroineIds.has(npcId), `${location.location_id} references unknown default_npc_id: ${npcId}`);
    }
  }
});

test('map catalog: every non-null location department_id is a real defined department', () => {
  const validDepartments = new Set([
    ...organization.departments.map(d => d.department_id),
    ...organization.general_npc_departments.map(d => d.department_id)
  ]);
  for (const location of map.locations) {
    if (location.department_id === null) continue;
    assert.ok(validDepartments.has(location.department_id), `${location.location_id} references undefined department_id: ${location.department_id}`);
  }
});

// ---------- Role/sex/department resolver ----------

function present(...ids) { return ids.map(id => getGeneralNpc(generalNpcs, id)); }

test('resolver: role match — female_staff resolves unambiguously when exactly one present NPC is a female employee', () => {
  const result = resolveGeneralNpcForGroup('female_staff', present('general_choi_yujin', 'general_yoon_taekyung'));
  assert.deepEqual(result, { id: 'general_choi_yujin' });
});

test('resolver: sex mismatch — male_staff never resolves to a present female NPC', () => {
  const result = resolveGeneralNpcForGroup('male_staff', present('general_choi_yujin', 'general_seo_hyejin'));
  assert.equal(result, null);
});

test('resolver: role/type mismatch — visitor (partner-type) never resolves to a present employee', () => {
  const result = resolveGeneralNpcForGroup('visitor', present('general_park_jungwoo'));
  assert.equal(result, null);
});

test('resolver: visitor correctly resolves to the one present partner-type NPC', () => {
  const result = resolveGeneralNpcForGroup('visitor', present('general_park_jungwoo', 'general_yoon_taekyung'));
  assert.deepEqual(result, { id: 'general_yoon_taekyung' });
});

test('resolver: department mismatch — a department filter excludes a same-sex/type NPC from the wrong department', () => {
  const result = resolveGeneralNpcForGroup('male_staff', present('general_park_jungwoo', 'general_oh_sehoon'), { departmentId: 'operations' });
  assert.deepEqual(result, { id: 'general_oh_sehoon' });
  const mismatched = resolveGeneralNpcForGroup('male_staff', present('general_park_jungwoo'), { departmentId: 'operations' });
  assert.equal(mismatched, null, 'general_park_jungwoo is brand_strategy, not operations');
});

test('resolver: ambiguous match (two present NPCs satisfy the same group) never resolves — no guessing', () => {
  const result = resolveGeneralNpcForGroup('male_staff', present('general_park_jungwoo', 'general_oh_sehoon'));
  assert.equal(result, null);
});

test('resolver: Company-native groups and legacy aliases resolve identically', () => {
  const scene = present('general_choi_yujin', 'general_yoon_taekyung');
  assert.deepEqual(resolveGeneralNpcForGroup('female_employee', scene), { id: 'general_choi_yujin' });
  assert.deepEqual(resolveGeneralNpcForGroup('female_staff', scene), { id: 'general_choi_yujin' });
  assert.deepEqual(resolveGeneralNpcForGroup('business_visitor', scene), { id: 'general_yoon_taekyung' });
  assert.deepEqual(resolveGeneralNpcForGroup('visitor', scene), { id: 'general_yoon_taekyung' });
});

test('resolver: manager and stable selectors resolve one exact present NPC only', () => {
  const scene = present('general_park_jungwoo', 'general_choi_yujin');
  assert.deepEqual(resolveGeneralNpcForGroup('manager', scene), { id: 'general_park_jungwoo' });
  assert.deepEqual(resolveGeneralNpcForGroup('character:general_choi_yujin', scene), { id: 'general_choi_yujin' });
  assert.deepEqual(resolveGeneralNpcForGroup('department:finance', scene), { id: 'general_choi_yujin' });
  assert.equal(resolveGeneralNpcForGroup('company_employee', scene), null, 'two employees remain ambiguous');
});

// ---------- find_npc ----------

function isKnown(id) { return isGeneralNpcId(generalNpcs, id) || id === 'heroine1'; }
const validLocationIds = new Set(map.locations.map(l => l.location_id));

test('find_npc: zero-LLM lookup succeeds when the NPC has a known location and is not already present', () => {
  const save = { last_npcs_present: [], focal_character_id: null, npc_scene_state: { general_park_jungwoo: { location_label: '대회의실', location_id: 'large_meeting_room' } } };
  const result = findNpc({ save, characterId: 'general_park_jungwoo', isKnownCharacterId: isKnown, validLocationIds });
  assert.equal(result.ok, true);
  assert.equal(result.location_id, 'large_meeting_room');
});

test('find_npc: NPC_NOT_FOUND for an id that is neither a heroine nor a general NPC', () => {
  const result = findNpc({ save: {}, characterId: 'nobody', isKnownCharacterId: isKnown, validLocationIds });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NPC_NOT_FOUND');
});

test('find_npc: NPC_ALREADY_PRESENT when the NPC is already in the current scene', () => {
  const save = { last_npcs_present: ['general_park_jungwoo'], focal_character_id: null, npc_scene_state: {} };
  const result = findNpc({ save, characterId: 'general_park_jungwoo', isKnownCharacterId: isKnown, validLocationIds });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NPC_ALREADY_PRESENT');
});

test('find_npc: NPC_LOCATION_UNKNOWN when no location has ever been recorded for that NPC', () => {
  const save = { last_npcs_present: [], focal_character_id: null, npc_scene_state: {} };
  const result = findNpc({ save, characterId: 'general_oh_sehoon', isKnownCharacterId: isKnown, validLocationIds });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NPC_LOCATION_UNKNOWN');
});

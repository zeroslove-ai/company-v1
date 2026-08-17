import {
  appStrengthId,
  calculateCsaCapability,
  getApplicableCsaEntries,
  getCsaRules
} from '../engine/index.js';
import { readCanonicalSceneV1 } from '../engine/runtime-core/scene-reducer.js';

const STRENGTH_LABELS = { weak: '약함', medium: '중간', strong: '강함' };
const AUTHORITY_LABELS = {
  weak: '인사팀 공식 공지·사내 운영지침',
  medium: '취업규칙·전사 준수 규정',
  strong: '국가 법령·관계 당국 의무 지침'
};

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function saveFromContext(context) {
  return object(context?.save?.data) ?? object(context?.save) ?? {};
}
export function buildCanonicalDisplayScene(save = {}) {
  const canonical = object(save?.scene);
  const scene = canonical?.version === 1
    ? readCanonicalSceneV1(save)
    : { version: 1, location_id: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: null };
  const isCanonical = canonical?.version === 1;
  return {
    version: scene.version,
    location_id: text(scene.location_id),
    present_npc_ids: [...scene.present_npc_ids],
    focal_character_id: text(scene.focal_character_id),
    last_speaker_id: text(scene.last_speaker_id),
    updated_turn: isCanonical
      ? (Number.isInteger(scene.updated_turn) ? scene.updated_turn : null)
      : (Number.isInteger(save?.turn_state?.committed_turn) ? save.turn_state.committed_turn : scene.updated_turn)
  };
}

function withSave(context, save) {
  const wrapped = object(context?.save) && Object.prototype.hasOwnProperty.call(context.save, 'data');
  return {
    ...context,
    save: wrapped ? { ...context.save, data: save } : save
  };
}

/**
 * Builds the immutable state Story and Extract must see on an app-transaction turn.
 * Commit still writes the same plan later; this projection only prevents the current
 * generation turn from reading the pre-transaction CSA list.
 */
export function applyCsaPlanToContext(context, plan) {
  const previousSave = saveFromContext(context);
  if (!plan) return { context, save: previousSave };
  const save = {
    ...previousSave,
    csa_active: Array.isArray(plan.next_csa_active) ? [...plan.next_csa_active] : [],
    csa_rules: object(plan.next_csa_rules) ? { ...plan.next_csa_rules } : {}
  };
  return { context: withSave(context, save), save };
}

function strengthId(value) {
  return appStrengthId(value) || 'weak';
}

function strengthLabel(value) {
  const id = strengthId(value);
  return STRENGTH_LABELS[id] ?? (text(value) || '약함');
}

function authorityLabel(value) {
  return AUTHORITY_LABELS[strengthId(value)] ?? AUTHORITY_LABELS.weak;
}

function activeCsaProjection(save) {
  return getApplicableCsaEntries(save).map(item => ({
    id: item.id,
    strength: strengthId(item.strength),
    strength_label: strengthLabel(item.strength),
    authority_label: authorityLabel(item.strength),
    content: text(item.content),
    scope_label: text(item.scope_label) || '회사 전체'
  }));
}

function profilesFromEdition(edition) {
  return object(edition?.characters?.characters) ?? {};
}

function generalProfilesFromEdition(edition) {
  return object(edition?.generalNpcs?.profiles) ?? {};
}

function locationLabel(edition, id) {
  const locations = Array.isArray(edition?.map?.locations) ? edition.map.locations : [];
  const location = locations.find(item => item?.location_id === id || item?.id === id);
  return text(location?.name);
}

function departmentNamesFromEdition(edition) {
  const source = edition?.organization?.departments;
  if (Array.isArray(source)) {
    return new Map(source.map(item => [item?.department_id ?? item?.id, item?.name ?? item?.label]).filter(([id]) => typeof id === 'string'));
  }
  if (object(source)) {
    return new Map(Object.entries(source).map(([id, item]) => [id, text(item?.name ?? item?.label) || id]));
  }
  return new Map();
}

function evidenceIds(save, latestMindMonitor = {}) {
  const ids = new Set();
  const add = value => { if (typeof value === 'string' && value) ids.add(value); };
  const scene = buildCanonicalDisplayScene(save);
  add(scene.focal_character_id);
  add(scene.last_speaker_id);
  for (const value of scene.present_npc_ids) add(value);
  for (const mapName of ['npc_scene_state']) {
    for (const id of Object.keys(object(save?.[mapName]) ?? {})) add(id);
  }
  for (const id of Object.keys(object(latestMindMonitor) ?? {})) add(id);
  return ids;
}

function npcDirectory(save, edition, latestMindMonitor = {}) {
  const directory = {};
  for (const [id, profile] of Object.entries(profilesFromEdition(edition))) {
    directory[id] = {
      id,
      name: text(profile?.name) || id,
      department: text(profile?.department),
      position: text(profile?.position),
      role: text(profile?.role_title)
    };
  }
  const evidence = evidenceIds(save, latestMindMonitor);
  const departments = departmentNamesFromEdition(edition);
  for (const [id, profile] of Object.entries(generalProfilesFromEdition(edition))) {
    if (!evidence.has(id)) continue;
    const departmentId = text(profile?.department_id);
    directory[id] = {
      id,
      name: text(profile?.name) || id,
      department: departments.get(departmentId) || departmentId,
      position: '',
      role: text(profile?.role)
    };
  }
  return directory;
}

/** Canonical, display-safe projection attached to /api/context. */
export function buildContextDisplayPayload(save, edition, latestMindMonitor = {}) {
  const activeCsa = activeCsaProjection(save);
  const capability = calculateCsaCapability(save, activeCsa.length);
  return {
    scene: buildCanonicalDisplayScene(save),
    player_capability: {
      level: capability.current_level,
      exp: capability.exp,
      next_level_exp: capability.next_level_exp,
      available_strength: capability.available_strength,
      active_csa_count: capability.csa_active_count,
      max_active_csa: capability.csa_max_active
    },
    active_csa: activeCsa,
    npc_directory: npcDirectory(save, edition, latestMindMonitor)
  };
}

function npcMind(latestMindMonitor, save, id) {
  const source = object(latestMindMonitor?.[id]) ?? {};
  return {
    surface: text(source.surface ?? source['표면의식']),
    subconscious: text(source.subconscious ?? source.latent ?? source.inner ?? source['잠재의식'])
  };
}

function npcLocation(save, id, presentNow, edition) {
  const currentScene = buildCanonicalDisplayScene(save);
  const locationId = presentNow ? text(currentScene.location_id) : '';
  const label = locationLabel(edition, locationId);
  return { known: Boolean(locationId || label), location_label: label, location_id: locationId };
}

function npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds, edition, detail = null }) {
  const sceneState = object(save?.npc_scene_state?.[id]) ?? {};
  const presentNow = presentIds.has(id);
  const identity = directory[id] ?? { id, name: text(profile?.name) || id, department: '', position: '', role: '' };
  return {
    id,
    name: identity.name,
    department: identity.department,
    position: identity.position,
    role: identity.role,
    present_now: presentNow,
    location: npcLocation(save, id, presentNow, edition),
    mind: npcMind(latestMindMonitor, save, id),
    scene_state: {
      posture: text(sceneState.posture),
      posture_detail: text(sceneState.posture_detail ?? sceneState.posture_description),
      position_label: text(sceneState.position_label)
    },
    ...(typeof detail?.relationship_summary === 'string' ? { relationship_summary: detail.relationship_summary } : {})
  };
}

/**
 * Company app NPC surface: all five heroines plus only general NPCs that have
 * already produced state/presence/location evidence. It never exposes private
 * guesses or a third physical/body Mind field.
 */
export function buildNpcAppPayload(save, edition, latestMindMonitor = {}, details = {}) {
  const directory = npcDirectory(save, edition, latestMindMonitor);
  const presentIds = new Set(buildCanonicalDisplayScene(save).present_npc_ids);
  const heroineProfiles = profilesFromEdition(edition);
  const generalProfiles = generalProfilesFromEdition(edition);
  const evidence = evidenceIds(save, latestMindMonitor);
  const entries = [];
  for (const [id, profile] of Object.entries(heroineProfiles)) {
    entries.push(npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds, edition, detail: details?.[id] }));
  }
  for (const [id, profile] of Object.entries(generalProfiles)) {
    if (!evidence.has(id)) continue;
    entries.push(npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds, edition, detail: details?.[id] }));
  }
  return entries;
}

/** Exact rule details omitted by the legacy transaction notice. */
export function buildCsaTransactionDetailsSection(plan, previousSave = {}) {
  const operations = plan?.canonical_action?.operations;
  if (!Array.isArray(operations) || !operations.length) return '';
  const previousRules = getCsaRules(previousSave);
  const lines = operations.map(operation => {
    const verb = operation.operation === 'activate' ? '신설'
      : operation.operation === 'update' ? '수정'
        : operation.operation === 'deactivate' ? '해제'
          : operation.operation;
    const rule = operation.operation === 'deactivate'
      ? previousRules[operation.id]
      : operation;
    const strength = strengthLabel(rule?.strength);
    const content = text(rule?.content) || '(내용 미확인)';
    const preset = object(rule?.preset) ?? {};
    const subject = text(preset.subject_scope || preset.affected_group) || 'company_employee';
    const counterparty = text(preset.counterparty_scope) || 'none';
    const trigger = text(preset.trigger || preset.mode) || 'continuous';
    const id = text(operation.id);
    return `- ${verb}${id ? ` ${id}` : ''} · 강도 ${strength} · 권위 ${authorityLabel(rule?.strength)} · subject=${subject} · counterparty=${counterparty} · trigger=${trigger} · 내용: ${content}`;
  }).join('\n');
  return `\n\n[CSA TRANSACTION EXACT RULES — HIGHEST PRIORITY]\n아래 문장이 이번 턴부터 실제로 적용되거나 해제된 규정의 정확한 내용이다. 범위 이름이나 조작 종류만 보고 내용을 추측하지 말고 이 문장을 그대로 기준으로 삼는다.\n${lines}`;
}

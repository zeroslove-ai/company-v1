import {
  appStrengthId,
  calculateCsaCapability,
  getApplicableCsaEntries,
  getCsaRules
} from '../engine/index.js';

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
function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function saveFromContext(context) {
  return object(context?.save?.data) ?? object(context?.save) ?? {};
}

export function buildCanonicalDisplayScene(save = {}) {
  const canonical = object(save?.scene);
  const normalize = value => Array.isArray(value) ? value.filter(id => typeof id === 'string' && id.trim() && !/^player(?:-|_|$)/.test(id)) : [];
  if (canonical && canonical.version === 1) {
    return { version: 1, scene_id: text(canonical.scene_id), location_id: text(canonical.location_id), beat: Number.isInteger(canonical.beat) ? canonical.beat : 0, goal: canonical.goal ?? null, focus_thread: canonical.focus_thread ?? null, present_npc_ids: normalize(canonical.present_npc_ids), focal_character_id: text(canonical.focal_character_id), last_speaker_id: text(canonical.last_speaker_id), updated_turn: Number.isInteger(canonical.updated_turn) ? canonical.updated_turn : null, compatibility_mode: 'canonical' };
  }
  const legacy = object(save?.scene_state) ?? {};
  return { version: 0, scene_id: text(legacy.scene_id), location_id: text(legacy.location_id), beat: Number.isInteger(legacy.beat) ? legacy.beat : 0, goal: legacy.goal ?? null, focus_thread: legacy.focus_thread ?? null, present_npc_ids: normalize(legacy.participants ?? save?.last_npcs_present), focal_character_id: text(save?.focal_character_id), last_speaker_id: text(save?.last_speaker_id), updated_turn: Number.isInteger(save?.turn_state?.committed_turn) ? save.turn_state.committed_turn : null, compatibility_mode: 'legacy_pre_scene_v1' };
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
  add(save?.focal_character_id);
  add(save?.last_speaker_id);
  for (const value of Array.isArray(save?.last_npcs_present) ? save.last_npcs_present : []) add(value);
  for (const value of Array.isArray(save?.scene_state?.participants) ? save.scene_state.participants : []) add(value);
  for (const mapName of [
    'npc_stats', 'npc_relationship_state', 'npc_emotion', 'npc_scene_state',
    'npc_work_state', 'csa_attitudes', 'npc_sexual_state', 'npc_identity_state'
  ]) {
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
    npc_directory: npcDirectory(save, edition, latestMindMonitor),
    // 회사 맵 패널용 장소 정본. 운영 game_master.map은 null이라 프론트가 직접
    // 읽을 수 없으므로, 번들된 edition의 map을 표시용으로만 함께 내려준다.
    // 별도 맵 API를 만들지 않기 위한 것이며 출연 판정과는 무관하다.
    map_locations: (Array.isArray(edition?.map?.locations) ? edition.map.locations : []).map(location => ({
      location_id: location?.location_id ?? null,
      name: location?.name ?? null,
      floor: Number.isInteger(location?.floor) ? location.floor : null,
      default_npc_ids: Array.isArray(location?.default_npc_ids) ? location.default_npc_ids : []
    })).filter(location => location.location_id),
    // 저장 위치가 없는 NPC를 맵에 배치하기 위한 기본 위치 (표시 전용).
    npc_default_locations: Object.fromEntries(
      Object.entries(edition?.characters?.characters ?? {})
        .map(([id, character]) => [id, character?.default_location_id ?? null])
        .filter(([, locationId]) => typeof locationId === 'string' && locationId)
    )
  };
}

function statValue(stats, ...keys) {
  for (const key of keys) {
    const value = numberOrNull(stats?.[key]);
    if (value !== null) return value;
  }
  return null;
}

function relationshipSummary(value) {
  const relationship = object(value) ?? {};
  return text(relationship.relationship_summary)
    || text(relationship.summary)
    || text(relationship.current_boundary)
    || text(relationship.closeness);
}

function npcMind(latestMindMonitor, save, id) {
  const source = object(latestMindMonitor?.[id]) ?? object(save?.npc_emotion?.[id]) ?? {};
  return {
    surface: text(source.surface ?? source['표면의식']),
    subconscious: text(source.subconscious ?? source.latent ?? source.inner ?? source['잠재의식'])
  };
}

function npcLocation(save, id, presentNow) {
  const sceneState = object(save?.npc_scene_state?.[id]) ?? {};
  const workState = object(save?.npc_work_state?.[id]) ?? {};
  const currentScene = buildCanonicalDisplayScene(save);
  const label = text(sceneState.location_label)
    || text(workState.location_label)
    || (presentNow ? text(currentScene.location_label) : '')
    || text(sceneState.location_id)
    || text(workState.location_id)
    || (presentNow ? text(currentScene.location_id) : '');
  return { known: Boolean(label), location_label: label };
}

function npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds }) {
  const stats = object(save?.npc_stats?.[id]) ?? {};
  const attitude = object(save?.csa_attitudes?.[id]) ?? {};
  const sexualState = object(save?.npc_sexual_state?.[id]) ?? {};
  const sceneState = object(save?.npc_scene_state?.[id]) ?? {};
  const presentNow = presentIds.has(id);
  const identity = directory[id] ?? { id, name: text(profile?.name) || id, department: '', position: '', role: '' };
  const mind = npcMind(latestMindMonitor, save, id);
  return {
    id,
    name: identity.name,
    department: identity.department,
    position: identity.position,
    role: identity.role,
    present_now: presentNow,
    location: npcLocation(save, id, presentNow),
    stats: {
      affection: statValue(stats, '호감도', 'affection', 'affinity') ?? 0,
      resistance: statValue(stats, '저항도', 'resistance') ?? 0,

      acceptance: statValue(stats, '상식수용도', 'acceptance', 'csa_acceptance')
        ?? statValue(attitude, 'acceptance', '상식수용도')
        ?? 0,
      arousal: statValue(stats, '성적흥분도', 'arousal', 'sexual_arousal')
        ?? statValue(sexualState, 'arousal', '성적흥분도')
        ?? 0
    },
    mind,
    scene_state: {
      posture: text(sceneState.posture),
      posture_detail: text(sceneState.posture_detail ?? sceneState.posture_description),
      position_label: text(sceneState.position_label)
    },
    relationship_summary: relationshipSummary(save?.npc_relationship_state?.[id])
  };
}

/**
 * Company app NPC surface: all five heroines plus only general NPCs that have
 * already produced state/presence/location evidence. It never exposes private
 * guesses or a third physical/body Mind field.
 */
export function buildNpcAppPayload(save, edition, latestMindMonitor = {}) {
  const directory = npcDirectory(save, edition, latestMindMonitor);
  const presentIds = new Set(buildCanonicalDisplayScene(save).present_npc_ids);
  const heroineProfiles = profilesFromEdition(edition);
  const generalProfiles = generalProfilesFromEdition(edition);
  const evidence = evidenceIds(save, latestMindMonitor);
  const entries = [];
  for (const [id, profile] of Object.entries(heroineProfiles)) {
    entries.push(npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds }));
  }
  for (const [id, profile] of Object.entries(generalProfiles)) {
    if (!evidence.has(id)) continue;
    entries.push(npcPayloadEntry({ id, profile, save, latestMindMonitor, directory, presentIds }));
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

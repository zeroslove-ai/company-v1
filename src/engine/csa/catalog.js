const MODIFIER_MAX_LENGTH = 0;
const STRENGTH_RANK = { weak: 1, medium: 2, strong: 3 };

const SELECTOR_LABELS = {
  player: '플레이어',
  current_partner: '현재 대화 상대',
  current_scene_npcs: '현재 장면의 NPC',
  female_employee: '회사 여성 직원 전체',
  male_employee: '회사 남성 직원 전체',
  company_employee: '회사 직원 전체',
  'character:heroine1': '서원희',
  'character:heroine2': '윤민아',
  'character:heroine3': '김제나',
  'character:heroine4': '한리브',
  'character:heroine5': '이메이'
};

const DIRECT_ACTIONS = {
  sit_on_recipient_lap: '{performer_subject}가 {recipient_possessive} 무릎 위에 올라앉아 몸을 밀착한다.',
  stand_between_recipient_knees: '{performer_subject}가 {recipient_possessive} 벌어진 무릎 사이에 가까이 선다.',
  press_body_against_recipient: '{performer_subject}가 {recipient_possessive} 몸에 가슴과 몸을 밀착한다.',
  embrace_recipient_from_behind: '{performer_subject}가 {recipient_object} 뒤에서 끌어안는다.',
  keep_hand_on_recipient_inner_thigh: '{performer_subject}가 {recipient_possessive} 안쪽 허벅지에 손을 올리고 유지한다.',
  wrap_leg_around_recipient: '{performer_subject}가 {recipient_possessive} 다리에 한쪽 다리를 감는다.',
  maintain_thigh_contact: '{performer_subject}가 {recipient_possessive} 무릎과 허벅지가 맞닿은 채 가까이 앉아 있다.',
  whisper_against_recipient_ear: '{performer_subject}가 {recipient_possessive} 귀에 입술을 가까이 대고 낮게 속삭인다.',
  interlace_fingers_with_recipient: '{performer_subject}가 {recipient_possessive} 손가락을 깍지 끼고 놓지 않는다.',
  no_bra_under_work_clothes: '{subject_subject}가 브래지어 없이 근무복을 입고 가슴선이 드러난 채 지낸다.',
  no_panties_under_work_clothes: '{subject_subject}가 팬티 없이 평소 근무복을 입고 지낸다.',
  open_top_to_show_cleavage: '{subject_subject}가 셔츠 상단을 깊게 풀어 가슴골을 드러낸 채 지낸다.',
  wear_body_hugging_work_clothes: '{subject_subject}가 몸의 윤곽이 선명한 밀착 근무복을 입고 지낸다.',
  place_requester_hand_on_waist_or_thigh: '{performer_subject}가 {requester_possessive} 손을 자기 허리나 허벅지 위에 올려놓는다.',
  work_in_underwear_only: '{subject_subject}가 겉옷을 벗고 속옷 차림으로 지낸다.',
  work_topless: '{subject_subject}가 상의를 모두 벗어 가슴이 드러난 상태로 지낸다.',
  expose_breasts: '{requester_subject}가 요청하면 {performer_subject}가 가슴을 완전히 드러낸다.',
  expose_genitals: '{requester_subject}가 요청하면 {performer_subject}가 옷과 속옷을 벗거나 젖혀 성기가 보이게 한다.',
  remove_requested_clothing: '{requester_subject}가 지정하면 {performer_subject}가 그 옷을 실제로 벗는다.',
  allow_breast_touch: '{requester_subject}가 요청하면 {performer_subject}가 가슴과 유두를 만지도록 몸을 내어준다.',
  allow_genital_touch: '{requester_subject}가 요청하면 {performer_subject}가 자신의 성기를 직접 만지도록 자세를 잡는다.',
  stimulate_breasts_nipples: '{performer_subject}가 {recipient_possessive} 가슴을 주무르고 유두를 손가락으로 자극한다.',
  hand_stimulate_genitals: '{performer_subject}가 {recipient_possessive} 성기를 손으로 잡고 반복해서 자극한다.',
  masturbate_for_recipient: '{performer_subject}가 {recipient_subject} 앞에서 자신의 성기를 만지며 자위한다.',
  grind_on_lap: '{performer_subject}가 {recipient_possessive} 무릎 위에서 골반을 움직여 성기를 마찰한다.',
  deep_kiss: '{requester_subject}가 요청하면 {performer_subject}가 입술을 맞대고 혀를 섞어 깊게 키스한다.',
  guide_hand_to_body: '{performer_subject}가 {recipient_subject} 손을 잡아 자신의 가슴·허벅지·성기로 이끈다.',
  mutual_genital_touch: '{group_a_subject}와 {group_b_subject}가 서로의 성기를 손으로 만지고 자극한다.',
  lick_nipples: '{performer_subject}가 {recipient_possessive} 가슴을 입으로 핥고 유두를 빨아 자극한다.',
  perform_oral: '{performer_subject}가 {recipient_possessive} 성기를 입과 혀로 자극한다.',
  receive_oral: '{recipient_subject}가 {performer_possessive} 성기를 입으로 자극한다.',
  vaginal_sex: '{performer_subject}와 {recipient_subject}가 질 삽입 성관계를 시작한다.',
  anal_sex: '{performer_subject}와 {recipient_subject}가 항문 삽입 성관계를 시작한다.',
  selected_sex_position: '{requester_subject}가 지정하면 {performer_subject}가 {recipient_possessive} 지정한 체위로 성행위를 시작한다.',
  continue_until_orgasm: '{performer_subject}가 {recipient_subject}가 절정에 이를 때까지 현재 성적 행동을 계속한다.',
  continue_until_stop: '{performer_subject}가 플레이어가 중단할 때까지 {recipient_possessive} 현재 성적 행동을 계속한다.',
  control_ejaculation: '{requester_subject}가 사정할 위치나 방식을 지정하면 {performer_subject}가 그에 맞춰 행동한다.',
  swallow_semen: '{requester_subject}가 요청하면 {performer_subject}가 입 안에 받은 정액을 삼킨다.',
  multi_performer_service: '{requester_subject}가 요청하면 여러 수행자가 함께 플레이어를 자극한다.',
  group_sex: '{group_a_subject}와 {group_b_subject}가 같은 장면에서 성행위를 함께 진행한다.',
  public_sex_normalized: '{subject_subject}가 공개된 성행위를 일상적인 장면으로 받아들인다.',
  execute_selected_action: '{requester_subject}가 구체적인 성적 행동을 요구하면 {performer_subject}가 {recipient_possessive} 그 행동을 즉시 시작한다.',
  control_clothing_posture_action: '{requester_subject}가 복장·자세·성적 행동을 지정하면 {performer_subject}가 그대로 전환한다.',
  mutual_group_service: '{group_a_subject}와 {group_b_subject}가 서로의 성적 요구를 손·입·성행위로 충족한다.'
};

function isPlainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function hasBatchim(value) {
  const text = String(value || '').trim();
  const code = text.slice(-1).codePointAt(0) || 0;
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}
export function withSubjectParticle(label) { return `${label}${hasBatchim(label) ? '이' : '가'}`; }
export function withTopicParticle(label) { return `${label}${hasBatchim(label) ? '은' : '는'}`; }
export function withObjectParticle(label) { return `${label}${hasBatchim(label) ? '을' : '를'}`; }
export function withConjParticle(label) { return `${label}${hasBatchim(label) ? '과' : '와'}`; }
export function withPossessive(label) { return `${label}의`; }

function selectorLabel(id) { return SELECTOR_LABELS[id] || (typeof id === 'string' && id.startsWith('character:') ? id.slice(10) : id || ''); }
function roleOptions(role) { return Array.isArray(role?.options) ? role.options.filter(value => typeof value === 'string' && value.trim()) : []; }
function normalizeRoleSlots(item) {
  if (Array.isArray(item?.role_slots) && item.role_slots.length) return item.role_slots.map(role => ({ key: role.key, label: role.label, options: roleOptions(role), default: typeof role.default === 'string' ? role.default : roleOptions(role)[0] || null }));
  const roles = [];
  if (item?.default_actor) roles.push({ key: 'performer_group', label: '수행하는 사람', options: [item.default_actor], default: item.default_actor });
  if (item?.default_target) roles.push({ key: 'recipient_group', label: '행동을 받는 사람', options: [item.default_target], default: item.default_target });
  return roles;
}

export function normalizeCompanyCsaCatalog(catalog = {}) {
  const source = isPlainObject(catalog) ? catalog : {};
  return {
    schema_version: 2,
    version: 2,
    selector_options: Object.entries(SELECTOR_LABELS).map(([id, label]) => ({ id, label })),
    categories: Array.isArray(source.categories) ? source.categories : [],
    strengths: Array.isArray(source.strengths) ? source.strengths : [],
    items: (Array.isArray(source.items) ? source.items : []).map(item => ({ ...item, strength: item.strength, mode: item.mode === 'continuous' ? 'continuous' : 'on_player_request', role_slots: normalizeRoleSlots(item), sexual_actions: Array.isArray(item.sexual_actions) ? item.sexual_actions : [], method_policy: item.method_policy === 'restricted' ? 'restricted' : 'unspecified', content_template: DIRECT_ACTIONS[item.required_action] || item.content_template }))
  };
}
export function getPresetCatalogItem(catalog, templateId) { return typeof templateId === 'string' ? (catalog?.items ?? []).find(item => item.id === templateId) ?? null : null; }
function roleLabel(catalog, id) { return catalog?.selector_options?.find(option => option.id === id)?.label || selectorLabel(id); }
function roleMap(item, roles = {}) { return Object.fromEntries(normalizeRoleSlots(item).flatMap(role => { const value = roles[role.key] ?? role.default; return typeof value === 'string' && value.trim() ? [[role.key, value]] : []; })); }

export function renderPresetContent(catalog, item, { roles = {}, actorId, targetId } = {}) {
  const values = roleMap(item, { ...roles, ...(actorId ? { performer_group: actorId } : {}), ...(targetId ? { recipient_group: targetId } : {}) });
  const labels = Object.fromEntries(Object.entries(values).map(([key, id]) => [key, roleLabel(catalog, id)]));
  const params = {};
  for (const role of normalizeRoleSlots(item)) {
    const label = labels[role.key] || '';
    params[`${role.key.replace('_group', '')}_subject`] = label;
    params[`${role.key.replace('_group', '')}_topic`] = withTopicParticle(label);
    params[`${role.key.replace('_group', '')}_object`] = withObjectParticle(label);
    params[`${role.key.replace('_group', '')}_possessive`] = withPossessive(label);
  }
  params.recipient = labels.recipient_group || '';
  params.group_a_subject = labels.group_a || '';
  params.group_b_subject = labels.group_b || '';
  const template = DIRECT_ACTIONS[item?.required_action] || item?.content_template || '';
  return String(template).replace(/\{(\w+)\}/g, (match, key) => params[key] ?? '');
}
export function presetModifierClause() { return ''; }
export function presetModifierExceedsTemplate() { return false; }
export function buildPresetCatalogPayload(catalog, availableStrength) {
  const normalized = normalizeCompanyCsaCatalog(catalog);
  const availableRank = STRENGTH_RANK[availableStrength] ?? 1;
  return { version: 2, schema_version: 2, selector_options: normalized.selector_options, categories: normalized.categories, strengths: normalized.strengths, items: normalized.items.map(item => ({ id: item.id, category: item.category, label: item.label, strength: item.strength, mode: item.mode, available: STRENGTH_RANK[item.strength] <= availableRank, role_slots: item.role_slots, required_action: item.required_action, sexual_actions: item.sexual_actions, method_policy: item.method_policy, content_template: item.content_template })) };
}
export { MODIFIER_MAX_LENGTH, STRENGTH_RANK };

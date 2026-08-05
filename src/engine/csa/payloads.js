import { calculateCsaCapability, getCsaLimits, appStrengthId } from './capability.js';
import { getActiveCsaEntries, normalizeCsaScope } from './applicability.js';
import { buildCsaSemanticContract } from './semantic-contract.js';
import { buildPresetCatalogPayload } from './catalog.js';

const GAMEPLAY_MODE = 'csa_only';

const MANUAL_TIER_META = [
  ['weak', '약함', 1, '감각·주의·기분·가벼운 충동을 변화시키지만 핵심 금기와 행동 선택은 유지합니다.'],
  ['medium', '중간', 3, '특정 조건에서 부끄러움·거리감·행동 기준을 바꾸고 실제 행동을 자연스럽게 유도합니다.'],
  ['strong', '강함', 7, '관계 인식·핵심 금기·반복 행동·자동 반응을 지속적으로 재작성합니다.']
];

/**
 * Manual payload for the 상식개변 앱's 매뉴얼 tab — status/quick-start/rules/
 * tier examples/unlock milestones/active-effects/common failures. Ported
 * from buildAppManualPayload; company-wide scope replaces hospital-wide.
 */
export function buildAppManualPayload(save, catalog) {
  const activeCsa = getActiveCsaEntries(save);
  const capability = calculateCsaCapability(save, activeCsa.length);
  const level = capability.current_level;
  const progress = level >= 10 ? 100 : Math.max(0, Math.min(100, Math.round((capability.exp / capability.next_level_exp) * 100)));
  const tierRank = { weak: 0, medium: 1, strong: 2 };
  const csaTiers = MANUAL_TIER_META.map(([id, label, unlockLevel]) => ({
    id, label, unlock_level: unlockLevel, available: level >= unlockLevel,
    description: {
      weak: '대화·분위기·가벼운 접촉과 부끄러움 완화처럼 제한적인 사회적 관습을 바꿉니다.',
      medium: '특정 공간의 점검·상담 행동과 제한적 노출·접촉을 정상 절차로 재해석합니다.',
      strong: '공간 전체의 사회 규범과 업무·절차·예절, 핵심 금기를 재작성합니다.'
    }[id]
  }));
  const remainingSlots = Math.max(0, capability.csa_max_active - capability.csa_active_count);
  const diagnostics = [remainingSlots > 0
    ? { type: 'success', text: `새 상식개변을 등록할 수 있습니다. 남은 슬롯 ${remainingSlots}개.` }
    : { type: 'warning', text: `활성 슬롯이 ${capability.csa_active_count}/${capability.csa_max_active}로 가득 찼습니다. 기존 개변을 수정하거나 해제할 수 있습니다.` }];

  return {
    version: 2,
    mode: GAMEPLAY_MODE,
    title: '상식개변 앱 사용자 매뉴얼',
    subtitle: '이 버전은 개인 암시와 최면 기능 없이 공간의 사회적 상식만 변경합니다.',
    status: {
      level, exp: capability.exp, next_level_exp: capability.next_level_exp, exp_percent: progress,
      available_strength: capability.available_strength, csa_active: capability.csa_active_count, csa_max: capability.csa_max_active,
      csa_scope_type: 'world', csa_scope_label: '회사 전체'
    },
    diagnostics,
    quick_start: [
      '모든 상식개변은 회사 전체의 공동 사회 규범으로 적용됩니다.',
      '변경은 반드시 상식개변 앱 UI에서 생성·수정·해제합니다.',
      '강도는 직접 의미 범위 안의 확신과 사회적 압력만 바꾸며 의미 범위를 넓히지 않습니다.',
      '해제하면 현재 규범 적용만 멈추고 이미 벌어진 사건의 기억과 물리 상태는 유지됩니다.',
      '매뉴얼 열람과 탭 이동은 턴을 소비하지 않습니다.'
    ],
    common_sense: {
      title: '상식개변',
      description: '특정 개인이 아니라 회사 전체의 사회적 규범을 변경합니다. 인물은 각자의 성격을 유지한 채 그 규범을 당연한 전제로 받아들입니다.',
      rules: [
        'activate는 새 항목과 활성 슬롯을 만듭니다.',
        'update는 같은 슬롯에서 내용과 강도를 변경합니다.',
        'deactivate는 효과만 해제하며 기억과 현재 물리 상태는 유지합니다.',
        '여러 항목을 합쳐 어느 항목에도 없는 더 강한 규칙을 만들지 않습니다.',
        '직접 의미 범위 밖 행동은 NPC의 성격·관계·상황과 자발적 선택으로 별도 판정합니다.',
        '레벨은 사용할 수 있는 강도와 동시에 활성화할 수 있는 개수만 늘립니다.'
      ],
      current_scope: normalizeCsaScope(),
      scope_unlocks: [[1, 'Lv.1~2'], [3, 'Lv.3~4'], [5, 'Lv.5~9'], [10, 'Lv.10']]
        .map(([unlockLevel, levelRange]) => ({ level_range: levelRange, scope_type: 'world', scope_label: '회사 전체', max_active: getCsaLimits(unlockLevel).max_active, available: level >= unlockLevel })),
      tiers: csaTiers
    },
    stats: [
      { id: 'affinity', label: '호감도', range: '0~100', description: 'NPC가 플레이어에게 느끼는 감정적 호의입니다.', change_rule: '턴당 최대 -5~+5' },
      { id: 'acceptance', label: '상식개변 수용도', range: '0~100', description: '활성 상식개변의 직접 의미를 얼마나 자연스럽고 적극적으로 실행하는지 나타냅니다. 플레이어에 대한 호감·복종·동의와는 별개입니다.', change_rule: '실제 직접 적용 장면에서만 변화' }
    ],
    unlocks: [
      { level: 1, items: ['약함 강도', '회사 전체 범위', '활성 2개'] },
      { level: 3, items: ['중간 강도', '활성 3개'] },
      { level: 5, items: ['활성 4개'] },
      { level: 7, items: ['강함 강도'] },
      { level: 10, items: ['활성 5개'] }
    ],
    active_effects: { common_sense: activeCsa.filter(item => item.active).map(item => ({ strength: item.strength || 'weak', scope_label: item.scope_label || '회사 전체', content: item.content || '' })) },
    common_failures: [
      { title: '새 상식개변을 만들 수 없음', reasons: ['활성 슬롯이 가득 찼습니다.', '요청 범위나 강도가 현재 레벨 한도를 넘었습니다.', '내용이 앱 지원 범위를 벗어났습니다.'] },
      { title: '수정·해제가 적용되지 않음', reasons: ['대상 항목을 찾지 못했습니다.', '실제로 변경되는 값이 없습니다.', '이미 비활성 상태입니다.'] }
    ]
  };
}

/**
 * State payload feeding every app tab. NPC data is a display-safe projection
 * prepared by the API from registered Company canon plus persisted evidence;
 * this module never invents identity, location, Mind, or relationship fields.
 */
export function buildAppStatePayload(save, catalog, sexualActionContract, player, npcs = []) {
  const manual = buildAppManualPayload(save, catalog);
  const activeCsa = getActiveCsaEntries(save);
  const strengthOptions = [['weak', '약함', 1], ['medium', '중간', 3], ['strong', '강함', 7]]
    .map(([id, label, unlockLevel]) => ({ id, label, available: manual.status.level >= unlockLevel, unlock_level: unlockLevel }));
  const scopeOptions = [{ id: 'world', label: '회사 전체', available: true, unlock_level: 1 }];
  const commonSense = activeCsa.filter(item => item.active).map(item => ({
    id: item.id, strength: appStrengthId(item.strength), strength_label: item.strength || 'weak', content: item.content || '',
    ...normalizeCsaScope(), created_turn: item.created_turn ?? null,
    source_type: item.source_type === 'preset' ? 'preset' : 'custom',
    preset: item.source_type === 'preset' && item.preset ? item.preset : null,
    semantic_contract: buildCsaSemanticContract(item, sexualActionContract)
  }));
  return {
    version: 2,
    mode: GAMEPLAY_MODE,
    title: '상식개변 앱',
    turn_count: Number.isInteger(save?.turn_state?.committed_turn) ? save.turn_state.committed_turn : 0,
    home: { status: manual.status, diagnostics: manual.diagnostics },
    strength_options: strengthOptions,
    scope_options: scopeOptions,
    common_sense: commonSense,
    csa_presets: buildPresetCatalogPayload(catalog, appStrengthId(manual.status.available_strength)),
    manual,
    player_info: player,
    npcs: Array.isArray(npcs) ? npcs : []
  };
}

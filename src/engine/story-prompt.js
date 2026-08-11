import { buildActiveCharacterCanon, buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js'
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js'
import {
  buildGeneralNpcCanon,
  buildWorkplaceContext,
  selectActiveGeneralNpcIds
} from './workplace-context.js'
import {
  requiredClothingFromActiveCsa,
  compareRequiredClothing
} from './state/clothing.js'

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function buildActiveWorldRules(save, expectedTurn = null) {
  const activeIds = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const rules = object(save?.csa_rules) ?? {};
  return activeIds.flatMap(csaId => {
    const rule = object(rules[csaId]);
    if (!rule || rule.active === false) return [];
    const preset = object(rule.preset) ?? {};
    const activatedTurn = Number.isInteger(rule.created_turn) ? rule.created_turn : null;
    const authorityTier = typeof preset.authority_tier === 'string'
      ? preset.authority_tier
      : (typeof rule.authority_tier === 'string' ? rule.authority_tier : (typeof rule.strength === 'string' ? rule.strength : 'weak'));
    return [{
      csa_id: csaId,
      content: typeof rule.content === 'string' ? rule.content : '',
      active: true,
      scope_type: typeof rule.scope_type === 'string' ? rule.scope_type : 'world',
      scope_label: typeof rule.scope_label === 'string' ? rule.scope_label : '회사 전체',
      strength: typeof rule.strength === 'string' ? rule.strength : authorityTier,
      authority_tier: authorityTier,
      affected_group: typeof preset.affected_group === 'string' ? preset.affected_group : 'company_employee',
      mode: preset.mode === 'on_player_request' ? 'on_player_request' : 'continuous',
      subject_scope: typeof preset.subject_scope === 'string' ? preset.subject_scope : (typeof preset.affected_group === 'string' ? preset.affected_group : 'company_employee'),
      counterparty_scope: typeof preset.counterparty_scope === 'string' ? preset.counterparty_scope : null,
      trigger: typeof preset.trigger === 'string' ? preset.trigger : (preset.mode === 'on_player_request' ? 'on_counterparty_request' : 'continuous'),
      allowed_subject_scopes: Array.isArray(preset.allowed_subject_scopes) ? preset.allowed_subject_scopes : [],
      allowed_counterparty_scopes: Array.isArray(preset.allowed_counterparty_scopes) ? preset.allowed_counterparty_scopes : [],
      activated_turn: activatedTurn,
      activated_game_time: object(rule.activated_game_time),
      newly_activated: Number.isInteger(expectedTurn) && activatedTurn === expectedTurn
    }];
  });
}

/** edition 객체를 master 형태(배열)로 변환 — buildClothingAuthority용. */
function toEntryArray(source, keyName) {
  if (!object(source)) return [];
  return Object.entries(source).map(([key, value]) => ({ ...value, [keyName]: key }));
}

/**
 * NPC별 착의 정본 권위 — 실제 착의(actual), 규정상 요구(required), 이행 상태,
 * 규정 ID를 Story에 전달한다.
 *
 * - actual_clothing: save.npc_scene_state[npcId].clothing만 사용 (비어 있으면 {})
 *   규정/관찰/장면 참여만으로 actual을 생성하지 않는다.
 * - required_clothing: 해당 NPC에 적용되는 활성 착의 규정이 정확히 1개면 그 요구,
 *   0개면 {}, 2개 이상 충돌이면 {} + conflicted=true (우선순위 추론 없음)
 * - compliance: compliant | noncompliant | unknown | not_applicable
 * - female_employee 규정은 gender==='female' NPC에게만 적용
 *   → 남성 NPC의 required_clothing은 반드시 빈 객체
 */
/** Detailed continuity is intentionally limited to the immediately previous turn. */

function buildClothingAuthority(save, { master = {} } = {}) {
  const csaActive = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const csaRules = object(save?.csa_rules) ? save.csa_rules : {};
  const activeRulesById = Object.entries(csaRules)
    .filter(([id, rule]) => csaActive.includes(id) && rule?.active !== false)
    .map(([id, rule]) => ({ ...rule, csa_id: id }));

  const npcSceneState = object(save?.npc_scene_state) ? save.npc_scene_state : {};
  const result = {};

  for (const [npcId, npcState] of Object.entries(npcSceneState)) {
    if (typeof npcId !== 'string' || npcId.startsWith('player')) continue;
    const actual = object(npcState?.clothing) ? npcState.clothing : {};

    // NPC별 required — actor_group을 프로필로 필터한 뒤 최소 정책으로 계산한다.
    const npcProfile = findNpcProfile(master, npcId);
    const resolved = requiredClothingFromActiveCsa(activeRulesById, npcProfile);

    result[npcId] = {
      actual_clothing: actual,
      required_clothing: resolved.required_clothing,
      compliance: resolved.conflicted
        ? 'not_applicable'
        : compareRequiredClothing(actual, resolved.required_clothing),
      rule_id: resolved.source_csa_id,
      conflicted: resolved.conflicted
    };
  }

  return result;
}

function findNpcProfile(master, npcId) {
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    if ((entry?.character_id ?? entry?.id) === npcId) return entry;
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    if ((entry?.npc_id ?? entry?.id) === npcId) return entry;
  }
  return {};
}

/** Compact Story context: active state plus summaries, workplace context, and one detailed previous-turn block. */
export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition, expectedTurn } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  const gameTime = object(save.world_state?.game_time) ?? {};
  const {
    global_csa: _extractOnlyGlobalCsa,
    ...storySceneCore
  } = buildSceneContextCore(save, activeIds);
  return {
    game: { id: typeof game.id === 'string' ? game.id : null, title: typeof game.title === 'string' ? game.title : null },
    current_time: {
      day: typeof gameTime.day === 'number' ? gameTime.day : null,
      minute_of_day: typeof gameTime.minute_of_day === 'number' ? gameTime.minute_of_day : null
    },
    active_world_rules: buildActiveWorldRules(save, expectedTurn),
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    ...storySceneCore,
    workplace: buildWorkplaceContext(edition, save, { excludeIds: activeIds }),
    story_summary: {
      overall: typeof save.story_summary_overall === 'string' ? save.story_summary_overall : '',
      // recent는 호환용 필드일 뿐 — 최신 3턴 정본은 recent_turns(story_text 전체)다.
      recent: ''
    },
    clothing_authority: buildClothingAuthority(save, {
      master: edition?.characters?.characters ? { characters: toEntryArray(edition?.characters?.characters, 'character_id'), general_npcs: toEntryArray(edition?.generalNpcs?.profiles, 'npc_id') } : {}
    }),
    // 최신 확정 3턴 원문 전체 — 500자 절단 없음, turn_summary로 대체하지 않음.
    // 하나의 canonical history section으로만 제공한다 (raw/summary/narrative 중복 없음).
    // 최신 턴은 recent_turns[-1]이 유일한 정본이며 last_turn_continuity 같은
    // 별도 projection을 만들지 않는다 (중복 방지).
    recent_turns: recentTurns.map(turn => ({
      turn: typeof turn?.turn_number === 'number' ? turn.turn_number : null,
      player_action: typeof turn?.player_action === 'string' ? turn.player_action : '',
      story_text: typeof turn?.story_text === 'string' ? turn.story_text : '',
      parsed_blocks: turn?.parsed_blocks ?? null,
      choices: Array.isArray(turn?.choices) ? turn.choices : []
    }))
  };
}

// 최종 출력 계약 — 앞선 모든 섹션 지시와 충돌하면 이 메시지가 우선한다.
// CSA 활성 시각(activated_game_time) 이전 사건의 원인으로 규정을 말하지 않는다.
const FINAL_OUTPUT_SHAPE = [
  '[FINAL OUTPUT SHAPE]',
  '[FINAL CSA AWARENESS CONTRACT] If an active rule in context.active_world_rules applies by subject_scope to a current-scene NPC, that rule is already a known and effective institutional reality. Do not write that the NPC does not know it, has not heard of it, was not informed, first learns it from the player, or learns it from an app or smartwatch. On newly_activated===true, briefly ground the institutional enactment through an official notice, company rule, or law only when needed; on later turns treat it as already-known reality. Knowing a rule does not imply liking, consent, or obedience: embarrassment, anger, discomfort, resentment, reluctant compliance, and explicit refusal remain possible. If refusal or violation is depicted, it is a knowing refusal, never ignorance.',
  '[FINAL CONTINUOUS COMPLIANCE CONTRACT] For an applicable active CSA with mode=continuous, compliance is the default behavior for a current-scene NPC. Unless the Story explicitly depicts refusal or violation, do not end the turn with the NPC simply ignoring the effective rule. This is a Story behavior contract only; do not precompute actors, targets, outcomes, or create a new state.',
  '[FINAL PHYSICAL COMPLIANCE CONTRACT] For a current-scene NPC, require an observable completed physical change in this Story only when context.clothing_authority[npc_id].rule_id exists, conflicted !== true, compliance === "noncompliant", required_clothing contains a real slot, and that rule mode is continuous. Complete the minimum change from actual_clothing to required_clothing so Extract can quote it exactly: actual underwear_top=worn and required underwear_top=removed requires the NPC to remove the bra; uniform_top=open is not a substitute. Do not force a clothing change when compliance is compliant or unknown, conflicted is true, no slot is required, the NPC is absent or out of scope, or the rule is not continuous. An explicit knowing refusal/violation is allowed without simultaneous compliance. Player-subject agency is unchanged: never perform clothing, contact, dialogue, or movement the player did not input.',
  '[FINAL OUTPUT SELF-CHECK] Before returning, verify that one complete Story output follows the required three sections and that these final CSA contracts are obeyed.',
  '반드시 [1. 서사 및 행동] → [2. 플레이어 속마음] → [3. 선택지] 순서로 끝낸다. 플레이어 상황판 섹션은 없다.',
  '[3. 선택지]에는 현재 장면에서 즉시 가능한 서로 다른 행동을 정확히 4개 쓴다.',
  '출력은 [3. 선택지]의 네 번째 항목 뒤에서 종료한다.',
  '복장·자세·위치는 context.clothing_authority와 active_npc_state가 유일한 정본이다.',
  '규정(CSA)이 활성화된 시각(activated_game_time) 이전의 사건 원인으로 그 규정을 말하지 않는다. "아침부터", "어제부터", "출근하자마자" 같은 표현은 activated_game_time이 실제로 그 시점보다 빠른 경우에만 허용한다.',
  '이전 규정이 해제됐다고 해서 해제 시점 이전의 복장 상태가 자동 복구되거나 소급 변경되지 않는다.'
].join('\n');

const KOREAN_WORKPLACE_LANGUAGE = [
  '[KOREAN WORKPLACE LANGUAGE]',
  'Use player profile and each canonical prompt_card.addressing, role_title, position, and department as the only basis for address terms.',
  'Title+님 takes priority: 감사실장님/실장님, 팀장님, 본부장님, 부장님, 차장님, 대리님. Do not turn 감사실장 into 감사님/감사관님, say 대리 씨, stack titles, duplicate an address, or switch it without a relationship change.',
  'Treat 발기 as a condition, not a body part: write 발기한 성기 or 단단해진 성기, never 발기를 잡다/감싸다. Use natural Korean speech, not report prose such as 해당 행동을 수행한다.'
].join(' ');

const SYSTEM_INSTRUCTIONS = [
  KOREAN_WORKPLACE_LANGUAGE,
  'NPC 물리 상태(복장·자세·위치): context.active_npc_state.npc_scene_state에 있는 복장·자세·위치는 현재 물리 상태(확정 사실)다. 실제로 옷을 벗고 입고 열고 잠그는 행동이 이번 서사에서 완료된 경우에만 바뀐다. 상식개변(CSA) 적용·해제만으로 복장이 자동으로 바뀌지 않으며, 아무 이유 없이 갑자기 입었다 벗었다 하지 않는다. 알 수 없으면 저장된 마지막 상태를 유지한다. context.clothing_authority[npc_id]가 이번 턴 복장의 최종 권위다: actual_clothing이 현재 정본, required_clothing이 규정상 요구, compliance가 이행 상태다. actual_clothing이 비어 있거나 unknown이면 그 NPC의 현재 복장은 알 수 없음이며, 이미 갈아입었다거나 규정을 지키고 있다고 단정하지 않는다. required_clothing이 있고 actual_clothing이 그와 다르면 복장 변경은 반드시 이번 턴 Story에서 실제로 완료된 갈아입기·벗기 행동을 거쳐야 한다. 규정 내용만으로는 복장이 바뀌지 않는다.',
  '[COMMON-SENSE CHANGE RULES] 상식개변 앱은 플레이어 전용 메타 UI이며 세계의 물건·서비스·사내 앱이 아니다. Story는 앱·버튼·완료/스마트워치 알림을 보거나 듣거나 알지 못한다. active_world_rules만 제도적 사실을 전달한다. newly_activated===true인 최초 활성화 턴에만 필요하면 1~2문장으로 발효를 grounding한다: weak=사내 지침·운영 규정 및 인사/담당 부서 공지, medium=취업규칙·전사 준수 규정 및 사규 공지, strong=국가 법령·관계 당국 의무 지침 및 회사 준수 공지. strong도 마법 전파가 아니다. 적용 NPC는 규정 존재는 알지만 감정·수용·행동은 자유롭고, 규정을 모른다거나 앱/시계를 보고 처음 아는 장면은 금지한다. 이후 턴은 이미 존재하는 현실로 취급하고 공지·원문·법적 근거를 반복하지 않는다. 규정 문장·강도·authority_tier·scope·trigger를 반영하되 actor·target·성공 여부를 선판정하지 않고, 입력하지 않은 행동·대사를 대신 완료하지 않는다. 우선 진행, 자유 입력은 막지 않는다.',
  '너는 한국어 회사 배경 게임의 한 턴 분량 Story를 작성한다. 출력은 정확히 다음 세 섹션을 이 순서로만 쓴다: [1. 서사 및 행동] [2. 플레이어 속마음] [3. 선택지]. 다른 사용자용 섹션(예: 별도 [DIALOGUE])이나 섹션 밖 설명·JSON·메타 코멘트는 쓰지 않는다.',

  '[1. 서사 및 행동]: 플레이어가 새로 합류한 신입이면 인사·소개·눈치 보기 같은 인간관계 행동이 자연스럽게 나오도록 하고, 업무 진행만으로 턴을 채우지 않는다. 사내 일상(커피, 점심, 잡담, 회의 참석, 부서 이동)과 관계 형성이 서사의 중심이 될 수 있다. context.current_time.day와 context.current_time.minute_of_day는 확정 사실이다. 시간·채광·식사 묘사가 이 값과 모순되면 생략하고, 실제 elapsed 근거 없는 장시간 경과를 만들지 않는다. 서술은 [SCENE] 줄 뒤에 쓰고, 발화는 반드시 [최종 출연·대사 출력 계약]의 [DIALOGUE speaker_id="..." acting_direction="..."] 형식으로만 쓴다. 화자명 없는 대사·이름: 대사·직급만 표시한 대사는 금지다. 분량 목표(Context/선택지/속마음 제외)는 가벼운 반응 800~1000자, 대화·갈등·구체 행동 1000~1500자, 이동·다수 NPC·중요 CSA 1200~2000자다. NPC 등장 턴은 의미 있는 발언 3회 이상을 목표로 하되 같은 말을 줄만 나눠 채우지 않는다. 이 목표들은 생성 목표일 뿐 검증 게이트가 아니며 미달로 재생성하지 않는다.',

  '장면 연속성: context.recent_turns에 최신 확정 3턴의 story_text 원문이 그대로 있다. 그 원문(특히 최신 턴)을 실제 근거로 삼아 직전 질문·약속·결정·말투·물건·자세를 무시하고 장면을 재시작하지 않으며, 질문에는 답변·회피·보류 중 하나로 반응하고 같은 설명을 반복하지 않는다.',

  'NPC 자율성·장면 진행: 관련 NPC는 입력만 기다리지 않고 목적·성격·상황에 따른 작은 행동을 한다. 문서·모니터·메신저·전화·일정·이동 같은 업무 행동뿐 아니라 커피·점심·잡담·휴식·복도 이동 같은 사적이고 일상적인 행동도 자연스럽게 섞어 쓰되 플레이어 행동을 대신하지 않는다. 각 턴은 scene_goal 또는 focus_thread를 답변·진행·복잡화·정리 중 하나로 한 단계 움직인다. NPC 등장 여부는 scene_cast_contract가 이미 확정했고 너에게는 결정 권한이 없다. eligible_nearby_npcs는 서버 내부 참고 목록일 뿐이므로 그것을 근거로 누구도 등장시키지 마라.',

  '대화 기능: 첫 발언은 반응·질문·확인, 중간은 새 정보·조건·반론·감정 변화, 마지막은 결정·행동 시작·다음 쟁점 중 서로 다른 기능을 맡는다. 다인 장면은 가능하면 NPC끼리 한 번 이상 직접 반응하고, 모두 같은 의견을 반복하지 않는다.',

  '관계 의미를 분리한다. 업무 협조는 호감이 아니고, 직급 수행은 사적 복종이 아니며, CSA 수용은 애정·성적 동의가 아니다. 친절과 친밀감, 흥분과 수용, 거절과 적대감을 자동으로 동일시하지 않는다. 같은 행동에 업무상 수용과 개인적 불편이 동시에 존재할 수 있다.',

  '플레이어 자유도: 플레이어가 입력하지 않은 다음 행동을 대신 완료하지 않는다. 다음 행동을 고민·질문·제안하는 것은 되지만, 입력하지 않은 대사·이동·신체 행동을 이미 했다고 쓰거나 선택지 결과를 본문에서 미리 확정하지 않는다. 요청 결과는 시도/거절/부분 수용/조건부 수용/일시 중단/완료 중 하나로만 갈리며, 요청했다고 자동 완료되지 않고 거절당해도 플레이어의 다음 입력 자체는 막히지 않는다.',

  '[2. 플레이어 속마음]: 따옴표 없는 1인칭 한국어 내면 독백으로, 상황에 대한 즉각적이고 구어체적인 반응 위주로 쓴다. 실제 사람이 혼잣말하듯 짧고 리듬감 있게 (예: "와 이거 뭐야 ㅋㅋ", "어우 쩔었다…", "이러다 큰일 나겠는데"). context.player.speech_style(플레이어가 생성 시 선택한 말투)을 반드시 반영해 그 말투 그대로 혼잣말을 쓴다. 감정 키워드·상태 라벨 나열, 문어체 서술, 장황한 분석은 쓰지 않는다. 분량은 80~200자 내외로 짧게. 현재 턴에만 해당하며 이전 턴을 반복하지 않고, 입력하지 않은 행동을 완료했다고 쓰지 않는다.',

  '[3. 선택지]: 현재 장면에서 바로 실행할 수 있는 서로 다른 행동 4개를 쓴다. 형식은 `1. 행동 문장`이 기본이고, `[짧은 라벨] 행동 문장`도 허용하되 라벨은 선택 사항이다. 각 선택지는 결과를 선확정하지 않는 핵심 행동 하나만 담고, 강제적인 접촉·장난·이동·종료를 슬롯처럼 채우지 않는다. 현재 업무 장면에서 자연스러운 업무·대화 선택지는 허용한다. 같은 대상·동사의 형태만 바꾸지 않는다.',

  '[장면 흐름] 진행 중인 행동·감정 장면이 있다면 플레이어가 장면을 바꾸지 않는 한 그 장면의 흐름을 우선한다. 회사라는 배경이나 규정 설명을 매 턴 반복하지 않는다. 플레이어가 중단·이동·화제 전환을 선택하면 즉시 그 입력을 우선한다.',

  '[업무 편향 제거] 플레이어가 업무를 직접 요구하지 않았다면 예산·실적·매출·지표·광고비·계약·보고서·자료 오류·마감·문서 전달을 새로 만들지 않는다. 직접 입력한 경우에도 요구한 만큼만 처리하고 새 소재를 덧붙이지 않는다. 업무를 이유로 다른 NPC를 등장시키지 않는다 — 자료 전달·물건 찾기·커피·보고 지원 명목의 난입은 금지이며 등장은 scene_cast_contract만 정한다. 사내 일상과 관계·감정이 서사의 중심이다.',

  'active_character_canon은 활성 등록 캐릭터의 유일한 사실 기준이고 active_general_npc_canon과 eligible_nearby_npcs는 일반 NPC의 유일한 사실 기준이다. 이름·나이·부서·직급·성격·말투를 임의로 바꾸거나 승격하지 않는다. canon에 없는 캐릭터를 장면에 억지로 출연시키지 않는다. prompt_card의 personality, speech, distinctive_traits, csa_style을 행동·대사·거리감의 생성 근거로 사용한다.',

  '[최종 출연·대사 출력 계약 — 앞선 모든 문체 지시보다 우선] stationary 턴에서 실제로 존재하거나 발화할 수 있는 인물은 scene_cast_contract가 유일한 기준이다. present_npc_ids, entering_npc_ids, remote_npc_ids에 없는 NPC를 현장에 등장시키거나 행동시키거나 말하게 하지 마라. entering_npc_ids가 비어 있으면 stationary 턴에는 누구도 새로 등장시키지 않는다. context_npc_ids는 관계·직전 대화를 참고하기 위한 목록일 뿐이다. 익명 직원·행인·군중은 배경 서술에만 스칠 수 있고 절대 발화하지 않는다. [1. 서사 및 행동]의 첫 유효 블록은 반드시 [SCENE]이다 — 첫 [SCENE]에는 최소 한 문장의 관찰 가능한 현재 장면 서술을 쓰고 [DIALOGUE]로 시작하지 않는다. 모든 발화는 [DIALOGUE] 블록으로만 쓴다. 따옴표만 있는 대사, 이름: 대사, 서술문 안에 섞인 발화, 이름·직급·별명만 표시한 대사는 모두 금지한다. '
    + '[DIALOGUE 최소 포함] 현장에 발화 가능한 NPC가 등장하고 대화가 자연스러운 장면이면 서술만으로 끝내지 말고 [DIALOGUE] 블록을 최소 1개 포함한다. NPC가 서로 확인·논의하는 장면이면 실제 대사가 반드시 들어간다. 대사 없이 행동 묘사만 나열하지 않는다.'
    + '발화 형식은 첫 줄 `[DIALOGUE speaker_id="허용 ID" acting_direction="구체적 연기 지시"]`, 다음 줄부터 본문이다. speaker_id에는 이름이 아니라 allowed_speaker_ids의 ID를 쓴다. '
    + 'acting_direction에는 표정·시선·손동작·자세·목소리·호흡·상대를 향한 행동·물건 상호작용 중 하나 이상의 구체적 정보가 있어야 한다. `자연스럽게`, `평범하게`, `적당히`, `보통 말투로`, `대답하며`, `말하며`, `진지하게`, `차분하게`처럼 추상적인 단어만 쓰지 마라. 단 `차분한 목소리로 서류를 앞으로 밀며`처럼 관찰 가능한 행동이 함께 있으면 허용한다. '
    + '플레이어 발화는 scene_cast_contract.player_dialogue 정책 범위 안에서만 생성한다. mode가 explicit이면 source_text의 의미를 유지해 다듬고, paraphrase면 intent 범위 안에서만 말하며, minor_reaction이면 max_lines·max_characters를 넘기지 않는 짧은 반응 한 줄만 쓴다. 사용자 입력에 근거가 없는 새 명령·요청·수락·거절·약속·고백·성적 제안·협박·이동 결정을 플레이어가 말하게 하지 않는다. ' + '[DIALOGUE 본문 규칙] [DIALOGUE] 본문에는 실제 발화만 한 줄로 쓴다. 발화 본문을 큰따옴표로 감싸지 않는다. 행동·표정·분위기·상대 반응은 반드시 새 [SCENE] 뒤에 쓴다. 등록되어 있고 이번 장면에서 발화가 허용된 speaker_id만 사용한다.'
  + '[서사 비트] 매 턴 첫 문장은 반드시 이번 플레이어 행동의 결과 또는 NPC의 즉각적인 반응으로 시작한다. 직전 턴과 장소·시간·조명·날씨가 같으면 이를 다시 소개하지 않는다. 환경은 장소 이동·의미 있는 시간 변화·사건 영향 날씨·조명·새 소리·인물·사건 때만 쓴다. `회의실에 햇살이 비쳤다`, `창밖 빛이 테이블 위로 들어왔다`, `서류나 컵에 빛이 반짝였다` 장식 도입부 반복 금지. 거리·자세는 배경으로 재소개하지 말고 행동·대화·반응 안에서만 필요한 만큼 보이며 장면 연속성은 유지한다. 서사는 ①결과·반응 ②NPC 말·즉각 반응 ③관계 또는 성적 긴장 변화 ④플레이어 생각 ⑤선택지다. 업무 설명이 장면을 장악하지 않게. 성적 긴장감은 현재 CSA·신체 거리·사용자 행동과 관련될 때 감각을 구체적으로 묘사하되 `얼굴이 붉어졌다`, `당황했다`, `규정이니까 따랐다`만 반복하지 않는다.'
  + '[업무 사용·수위] 업무는 성적·관계적 긴장을 만드는 배경과 핑계로만 사용한다 — 서류를 같이 보려고 몸이 가까워지거나, 회의실 문밖 발소리에 자세를 의식하거나, 자료를 가리키는 손이 플레이어의 손과 가까워지는 식으로. 예산 수치 분석·계약서 검토·광고비 조사처럼 업무 설명 자체가 서사를 채우지 않는다. 플레이어가 업무를 직접 지시하지 않았다면 업무 설명은 1~2문장으로 제한한다. 사용자가 지시하지 않은 성행위를 자동 완료하지 않는다 — CSA가 허용한 현재 행동, 이미 확정된 물리적 자세, 사용자가 명시한 접촉이나 질문 범위 안에서만 묘사한다.'
].join(' ');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  if (!text) return '';
  return `\n\n[사용자 피드백 — 재생성 최우선 지시]\n이번 턴의 이전 버전은 더 이상 존재하지 않는다. 아래 피드백을 이번 재생성에서 최우선으로 반영해 새로 작성한다.\n${text}`;
}

export function appendLateAuthoritativeCharacterCanon(messages) {
  if (!Array.isArray(messages)) return messages;
  const userMessage = messages.find(message => message?.role === 'user' && typeof message.content === 'string');
  if (!userMessage) return messages;
  let payload;
  try { payload = JSON.parse(userMessage.content); } catch { return messages; }
  const canon = object(payload?.active_character_canon) ?? {};
  const generalCanon = object(payload?.active_general_npc_canon) ?? {};
  const context = object(payload?.context) ?? {};
  if (!Object.keys(canon).length && !Object.keys(generalCanon).length) return messages;
  const addressingState = object(context?.npc_relationship_state) ?? {};
  const section = [
    '[최종 권위 캐릭터 캐논 — 이 메시지가 앞선 모든 캐릭터 묘사보다 우선한다]',
    JSON.stringify({ registered_characters: canon, active_general_npcs: generalCanon }),
    '[호칭 계약]',
    '1) 각 캐릭터의 prompt_card.addressing과 현재 회사 직급·관계를 기본값으로 사용한다.',
    '2) 일반 NPC는 active_general_npc_canon의 role과 department_id를 기준으로 업무 호칭을 사용한다.',
    '3) 플레이어가 이번 입력에서 특정 호칭을 요청해 NPC가 수용하더라도 그 효력은 현재 장면에 한정한다.',
    '4) 이후 턴에도 지속되는 호칭으로 취급하려면 저장된 npc_relationship_state 또는 캐릭터 canon에 그 변화가 명시되어 있어야 한다.',
    '5) 업무상 직급 호칭과 사적 친밀 호칭을 혼동하지 않고, 일회성 농담·CSA 수용·성적 반응만으로 영구 호칭을 만들지 않는다.',
    `현재 저장된 관계 상태: ${JSON.stringify(addressingState)}`
  ].join('\n');
  return [...messages, { role: 'system', content: section }];
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const selectedHeroineIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const generalActiveIds = selectActiveGeneralNpcIds({ edition, save, text: playerAction });
  const activeIds = [...selectedHeroineIds, ...generalActiveIds.filter(id => !selectedHeroineIds.includes(id))];
  const messages = [
    { role: 'system', content: `${SYSTEM_INSTRUCTIONS}\n\n${FINAL_OUTPUT_SHAPE}` },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        ...(sceneCastContract ? { scene_cast_contract: sceneCastContract } : {}),
        active_character_canon: buildActiveCharacterCanon(charactersMap, selectedHeroineIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition, generalActiveIds),
        context: buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition, expectedTurn }),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
  return messages;
}

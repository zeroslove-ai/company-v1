import { buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js';
import {
  buildGeneralNpcCanon,
  buildRegisteredGeneralNpcs,
  selectActiveGeneralNpcIds
} from './workplace-context.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function text(value, maxLength = 420) {
  if (typeof value !== 'string') return '';
  return Array.from(value.trim()).slice(0, maxLength).join('');
}

export function buildRegisteredCharacters(edition) {
  const charactersMap = object(edition?.characters?.characters);
  if (!charactersMap) return [];
  return Object.entries(charactersMap)
    .filter(([, character]) => object(character) && typeof character.name === 'string')
    .map(([character_id, character]) => ({ character_id, name: character.name }));
}

/** Compact author canon for character-specific Mind Monitor prose; never a state authority. */
export function buildExtractCharacterCanon(charactersMap, activeIds) {
  const map = object(charactersMap) ?? {};
  const result = {};
  for (const id of Array.isArray(activeIds) ? activeIds.slice(0, 4) : []) {
    const character = object(map[id]);
    if (!character) continue;
    const card = object(character.prompt_card) ?? {};
    result[id] = {
      name: text(character.name, 60),
      position: text(character.position, 60),
      role_title: text(character.role_title, 100),
      identity: text(card.identity),
      personality: text(card.personality),
      speech: text(card.speech),
      addressing: text(card.addressing),
      distinctive_traits: Array.isArray(card.distinctive_traits)
        ? card.distinctive_traits.filter(item => typeof item === 'string' && item.trim()).slice(0, 5)
        : [],
      csa_style: text(card.csa_style)
    };
  }
  return result;
}

export function buildParsedStoryProjection(parsedStory) {
  const p = object(parsedStory) ?? {};
  return {
    player_inner_thought: typeof p.player_inner_thought === 'string' ? p.player_inner_thought : '',
    player_status: typeof p.player_status === 'string' ? p.player_status : '',
    choices: Array.isArray(p.choices) ? p.choices.filter(item => typeof item === 'string') : [],
    dialogue_lines: Array.isArray(p.dialogue_lines) ? p.dialogue_lines : [],
    warnings: Array.isArray(p.warnings) ? p.warnings : []
  };
}

/**
 * 수정 E + 최종 단순화 수정 1 — V2 Extract 전용 직렬화.
 * parsedStory.blocks만 사용한다 (stream_segments는 transport/replay 전용이며 참조하지 않는다).
 * 검증된 구조화 블록(장면·대사)을 원래 순서대로 직렬화한다.
 * 화자 추론·이름 추정·대명사 추정·따옴표 추론·직전 화자 추정·교대 규칙을 절대 사용하지 않는다.
 * speaker_name은 서버 canon에서 이미 확정된 값을 그대로 쓴다.
 */
export function buildStructuredStoryV2ExtractText(parsedStory) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const parts = [];

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'scene' && typeof block.text === 'string') {
      const text = block.text.trim();
      if (text) parts.push(text);
      continue;
    }
    if (block.type === 'dialogue') {
      const name = typeof block.speaker_name === 'string' ? block.speaker_name.trim() : '';
      const direction = typeof block.acting_direction === 'string'
        ? block.acting_direction.trim()
        : (typeof block.direction === 'string' ? block.direction.trim() : '');
      const text = typeof block.text === 'string' ? block.text.trim() : '';
      if (!name || !text) continue;
      parts.push(direction ? `${name} (${direction}): “${text}”` : `${name}: “${text}”`);
      continue;
    }
  }

  // 기존 속마음·상황판·선택지 직렬화 유지 — blocks의 장면·대사 뒤에 기존 순서대로 추가
  const inner = typeof parsedStory?.player_inner_thought === 'string' && parsedStory.player_inner_thought ? parsedStory.player_inner_thought.trim() : '';
  const status = typeof parsedStory?.player_status === 'string' && parsedStory.player_status ? parsedStory.player_status.trim() : '';
  if (inner) parts.push(`[2. 플레이어 속마음]\n${inner}`);
  if (status) parts.push(`[3. 플레이어 상황판]\n${status}`);
  if (Array.isArray(parsedStory?.choices) && parsedStory.choices.length) {
    parts.push('[4. 선택지]\n' + parsedStory.choices.map((c, i) => `${i + 1}. ${c}`).join('\n'));
  }
  return parts.join('\n\n');
}

function buildExtractContextProjection(context, activeIds) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  return buildSceneContextCore(save, activeIds);
}

const SYSTEM_INSTRUCTIONS = [
  'Return one JSON object only; no prose or Markdown.',
  'Include exactly: state_delta (object),outcome,evidence (object),turn_summary,mind_monitor,choices,dialogue_lines,npcs_present,action_target_id,focal_character_id,last_speaker_id,image_character_id,player_inner_thought,player_status,elapsed_minutes,warnings; with active CSA also csa_trigger_evaluations,csa_runtime_updates.',
  'state_delta contains changed values only. outcome=success|partial|refused|interrupted|blocked. Ground every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence; never invent changes.',
  'Identity fields are independent; never copy one into another. registered_characters lists the only stable character ids; registered_general_npcs lists the only stable general-NPC ids. never invent, guess, or reuse an id. narrator/unknown=null. A nearby/default/eligible NPC is not present unless Story explicitly shows their entrance, presence, action, or dialogue. List every present NPC.',
  'Story choices are authoritative and preserved: with four parsed choices return choices:[]. With 1-3 parsed choices, return them verbatim FIRST in the same order, then create only the missing count of new choices fitting the current scene, NPCs, and rules, to reach exactly 4. With 0 parsed choices, create 4 new choices for the current scene. Never drop or rewrite a parsed choice. Parsed player_inner_thought/player_status are authoritative; Extract can never override them. dialogue_lines may only add missing speaker_id to the same order/text. Spoken lines use `등록 이름 (짧고 구체적인 연기톤): 대사`; preserve text/direction. The Story below is already normalized: EVERY spoken line carries an explicit speaker name inserted by the pipeline. dialogue_lines must include every spoken line and copy the stated speaker name exactly — do not infer, reassign, or drop any line. An unlabeled line is UNASSIGNED — skip it.',
  'mind_monitor only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. For Mind Monitor interpretation, use Story, active canon, and saved state; it may not invent a new event, memory, agreement, contact, or fact. surface=conscious judgment, subconscious=distinct unadmitted conflict. Write both as the NPC\'s own casual spoken inner monologue (short, sighing, exclamatory, elliptical self-talk) — never narration, labels, system terms, physical_reaction, other body/action fields, or player thoughts. Each of surface and subconscious must be a substantial monologue of at least 100 Korean characters; never one-line summaries.',
  'CSA authority: weak=인사팀 공식 공지·사내 운영지침, medium=취업규칙·전사 준수 규정, strong=국가 법령·관계 당국 의무 지침. Higher authority raises compliance pressure/self-rationalization, not affection, private submission, or sexual consent. Preserve evidenced discomfort, questions, embarrassment, scope objections, and personality resistance.',
  'npc_stats only affinity(-5..5), csa_acceptance(-20..30), sexual_arousal(-20..15) for present NPC IDs, each with exact-evidence reason. resistance is a fixed per-NPC value and is NEVER included in npc_stats; it never changes. Announcement, compliance, embarrassment, arousal, or body reaction alone never raises affinity; announcement alone never changes csa_acceptance. On the first turn after the opening, set each present NPC affinity to 1~20 based on the player profile and the first-impression scene (reserved/guarded characters get 1~8, neutral 8~14, warm 14~20). Omit unchanged axes.',
  'elapsed_minutes is your only time proposal: 1-30 normally; <=480 only when evidence.time_advance=true. Never compute Day/absolute time.',
  'CSA runtime via csa_runtime_updates/csa_trigger_evaluations only; state_delta.csa_runtime_state[csa_id] ignored. active(executed) needs evidence.csa_runtime[csa_id].quote — verbatim action line (rule mention never suffices). trigger_evaluations never changes execution_state. csa_attitudes stays in state_delta.',
  'player_sexual_state uses only arousal_delta, ejaculation_progress_delta, and ejaculation_completed; completion requires evidence.sexual_resolution === true.',
  'Physical patches may set concise Korean location_label, posture, position_label from exact Story evidence; posture/position evidence quotes must be verbatim in Story and name the character. Clothing patches MUST use exactly the canonical four slots with enum values: state_delta.npc_scene_state[npc_id].clothing = { "uniform_top": "worn|removed|open|unknown", "uniform_bottom": "worn|removed|open|unknown", "underwear_top": "worn|removed|unknown", "underwear_bottom": "worn|removed|unknown" }. Free-form keys (bra, top, panties, 셔츠, 속옷, undergarments) are REJECTED — never output them. Every changed slot requires a matching evidence entry under evidence.clothing[slot] whose quote is verbatim in Story, names the character, and describes an actually completed action (no CSA-rule-only changes, no magical wording 저절로/순식간에, no planning). Keep only changed slots; unchanged or uncertain fields are omitted. CSA rule text alone never changes clothing — actual Story actions must exist.',
  'npc_stats and sexual_event_ledger each need an exact Story quote. Distinguish attempt, refusal, partial, conditional acceptance, pause, completion. Human-readable strings are Korean; IDs unchanged.',
  'Movement transition contract: scene_cast_contract.transition_mode=movement일 때 이번 턴은 장소 이동 완료 턴이다. destination_location_id가 존재하고 Story가 목적지 도착(발견·마주침 서술)까지 완료했다면 state_delta.scene_state.location_id는 destination_location_id로, scene_state.participants는 player와 Story에서 실제로 발견된 destination NPC만 기록한다. 기존 장소 NPC를 participants에 유지하지 않는다. npcs_present와 last_npcs_present도 destination NPC로 갱신하고 focal_character_id는 destination NPC로 옮긴다. Story가 목적지 도착 전에 중단됐다면(이동 도중 중단) destination NPC를 participants에 넣지 않는다.'
].join(' ');

export function buildExtractPrompt({ context, storyText, parsedStory, playerAction, expectedTurn, edition, npcIds, sceneCastContract }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const heroineActiveIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const generalActiveIds = selectActiveGeneralNpcIds({ edition, save, text: storyText });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter(id => !heroineActiveIds.includes(id))];
  const cast = object(sceneCastContract) ?? {};
  const movementContract = cast.transition_mode === 'movement'
    ? {
        transition_mode: 'movement',
        destination_npc_ids: Array.isArray(cast.destination_npc_ids) ? cast.destination_npc_ids : [],
        destination_location_id: typeof cast.destination_location_id === 'string' ? cast.destination_location_id : null
      }
    : null;
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        registered_characters: buildRegisteredCharacters(edition),
        registered_general_npcs: buildRegisteredGeneralNpcs(edition),
        active_character_canon: buildExtractCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition, generalActiveIds),
        story_text: storyText,
        parsed_story: buildParsedStoryProjection(parsedStory),
        ...(movementContract ? { scene_cast_contract: movementContract } : {}),
        context: buildExtractContextProjection(context, activeIds),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}

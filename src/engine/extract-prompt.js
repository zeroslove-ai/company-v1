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

  // 기존 속마음·선택지 직렬화 유지 — blocks의 장면·대사 뒤에 기존 순서대로 추가
  const inner = typeof parsedStory?.player_inner_thought === 'string' && parsedStory.player_inner_thought ? parsedStory.player_inner_thought.trim() : '';
  if (inner) parts.push(`[2. 플레이어 속마음]\n${inner}`);
  if (Array.isArray(parsedStory?.choices) && parsedStory.choices.length) {
    parts.push('[3. 선택지]\n' + parsedStory.choices.map((c, i) => `${i + 1}. ${c}`).join('\n'));
  }
  return parts.join('\n\n');
}

function buildExtractContextProjection(context, activeIds) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  return buildSceneContextCore(save, activeIds);
}

const SYSTEM_INSTRUCTIONS = [
  'Return one JSON object only; no prose or Markdown.',
  'Before returning image_selection, reread the final physical scene only. If a sexual physical act is still being performed at the final moment, pool must be sex and tags must describe that ongoing act.',
  'Final presence: participants/npcs_present/focal_character_id reflect the last Story moment; an exited/disappeared NPC is absent, last_speaker_id may remain. Mid-turn dialogue alone is not presence; inside/doorway is present. Set evidence.scene_presence_final=true when explicit.',
  'Include exactly: state_delta (object),outcome,evidence (object),turn_summary,mind_monitor,choices,dialogue_lines,npcs_present,action_target_id,focal_character_id,last_speaker_id,image_character_id,image_selection (object),player_inner_thought,elapsed_minutes,warnings; with active CSA also csa_trigger_evaluations,csa_runtime_updates.',
  'state_delta contains changed values only. outcome=success|partial|refused|interrupted|blocked. Ground every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence; never invent changes.',
  'Identity fields are independent; never copy one into another. registered_characters lists the only stable character ids; registered_general_npcs lists the only stable general-NPC ids. never invent, guess, or reuse an id. narrator/unknown=null. A nearby/default/eligible NPC is not present unless Story explicitly shows their entrance/presence/action/dialogue. List every present NPC.',
  'Story choices are authoritative and preserved: never create, rewrite, or drop a parsed choice; always return choices:[] (Story is the only stored choices source; the UI shows exactly the 4 Story choices). Parsed player_inner_thought is authoritative; Extract can never override it. dialogue_lines may only add missing speaker_id to the same order/text. Spoken lines use `등록 이름 (짧고 구체적인 연기톤): 대사`; preserve text/direction. The Story is already normalized: EVERY spoken line carries an explicit speaker name. dialogue_lines must include every spoken line and copy the stated speaker name exactly — do not infer, reassign, or drop any line. An unlabeled line is UNASSIGNED — skip it.',
  'Mind Monitor interpretation: mind_monitor only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. Use Story, canon, and saved state; may not invent a new event, memory, agreement, contact, or fact, nor narration, labels, system terms, physical_reaction/body fields, or player thoughts. surface=conscious judgment, subconscious=distinct unadmitted conflict. Write each as the NPC\'s casual Korean inner monologue of at least 100 characters, not a summary or repeated regulation metadata.',
  'CSA observation: weak=밀착·접촉·부분 노출, medium=직접 노출·가슴·성기 접촉·손을 이용한 성적 행동, strong=구강·삽입·체위·사정·다인 성행위. Record only results actually shown in Story. Institutional compliance is separate from affinity, private obedience, and sexual consent. Preserve Story-grounded discomfort, shame, self-justification, and resentment. csa_acceptance records acceptance or resistance to that rule only; it never cancels or rewrites an evidenced action.',
  'npc_stats[npc_id] uses only affinity_delta(-5..5), csa_acceptance_delta(-20..30), sexual_arousal_delta(-20..15) for present NPCs; deltas are this turn only and each needs exact Story evidence in reasons. resistance is fixed and never included. Omit unchanged axes. Announcement, compliance, embarrassment, or body reaction alone never raises affinity or sexual_arousal; embarrassment without explicit sexual evidence is not arousal. Announcement alone never changes csa_acceptance. Positive affinity needs an exact evidence.npc_stats[npc_id].affinity quote; initial affinity comes from characters.json.',
    'elapsed_minutes is your only time proposal: 1-30 normally; <=480 only with evidence.time_advance=true. It covers this turn only; never infer unsupported duration, history, Day, absolute time, or length-based time.',
  'CSA runtime via csa_runtime_updates/csa_trigger_evaluations only; state_delta.csa_runtime_state[csa_id] ignored. trigger_evaluations never changes execution_state. csa_attitudes stays in state_delta. status=active(executed) records only a Story-evidenced active observation; no catalog action label or preset metadata is used to pre-validate it.',
  'player_sexual_state uses only arousal_delta, ejaculation_progress_delta, ejaculation_completed, and erection_state; completion requires evidence.sexual_resolution === true. ejaculation_progress_delta: direct stimulation only — none: omit; brief: +1~2; sustained: +2~4; strong: +4~6. Exposure, erection, conversation, or requests alone never raise it. Never decrease/reset when stimulation stops. ejaculation_completed=true only on explicit completion. arousal and progress deltas are independent. erection_state (unknown|flaccid|partial|erect) is the current physical state, not a delta — set it only when Story directly shows the player erection (evidence.player_erection={state,quote}); copy the quote VERBATIM as a contiguous exact Story substring — never summarize, paraphrase, reorder, or translate. Never infer from arousal, CSA, requests, clothing, or image tags. No new erection evidence: keep the saved value; never auto-flaccid on paused stimulation or on completion. Integer values only.',
  'Physical patches may set Korean location_label, posture, position_label from Story evidence. Clothing uses only uniform_top,uniform_bottom,underwear_top,underwear_bottom with worn|removed|open|unknown. Write NPC/player patches only when final visible attire is directly shown, including when saved clothing is empty. When only a regulation/plan exists and the attire is not shown in Story, make no clothing patch. Underwear-only is uniform_top:removed, uniform_bottom:removed, underwear_top:worn, underwear_bottom:worn. evidence.clothing[actor_id]={quote,character_id}; actor_id is player for the player, and player/player-1/player_* or player-* aliases canonicalize to player. quote is an exact Story substring and character_id equals canonical actor_id.',
  'sexual_event_ledger is an array of events: [{actor_id,target_id,action_type,direction,completed,interrupted,evidence}]. action_type uses the canonical enum only: kiss, sexual_touch, genital_exposure, genital_touch, oral, penetration, orgasm. Map handjob/sustained_handjob/손으로 남성 성기 자극 and fingering/손가락으로 여성 성기 자극 to genital_touch; fellatio/cunnilingus/deepthroat to oral; vaginal/anal/missionary/doggystyle/cowgirl to penetration. actor_id/target_id must be registered IDs; actor and target differ; evidence must be an exact Story substring; completed=true only when Story states completion; interrupted=true only when Story states interruption. Record when an act starts, changes method, completes, or is interrupted. A new event is allowed for the same action_type when Story shows real new development (speed/intensity change, new NPC reaction, meaningful progress, phase change, resumption after interruption, pre-climax entry). Skip only when the same act is merely re-described with no new reaction, progress, or state change. Distinguish attempt, refusal, partial, conditional acceptance, pause, completion. Human-readable strings are Korean; IDs unchanged.',
  'Movement transition: transition_mode=movement면 이번 턴은 이동 완료 턴이다. destination_location_id 존재 + Story가 도착(발견·마주침)까지 완료 시 location은 destination으로 제안할 수 있다. 최종 participants/npcs_present/focal_character_id는 Story 마지막 장면에서 실제로 남아 있는 인물만 기록하고, NPC가 없으면 player만 남긴다. 기존 장소 NPC는 마지막 장면에서 퇴장했다면 제외한다. 도착 전 중단(이동 도중)이면 destination NPC를 넣지 않는다.',
  'image_selection: sex with ongoing tags; refused-request tags excluded; no contact=>general',
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

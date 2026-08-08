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
  'mind_monitor only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. For Mind Monitor interpretation, use Story, active canon, and saved state; may not invent a new event, memory, agreement, contact, or fact. surface=conscious judgment, subconscious=distinct unadmitted conflict. Write both as the NPC\'s own casual spoken inner monologue (short, sighing, exclamatory, elliptical self-talk) — never narration, labels, system terms, physical_reaction, other body/action fields, or player thoughts. Each must be a substantial monologue of at least 100 Korean characters; never one-line summaries.',
  'CSA authority: weak=인사팀 공식 공지·사내 운영지침, medium=취업규칙·전사 준수 규정, strong=국가 법령·관계 당국 의무 지침. Higher authority raises compliance pressure/self-rationalization, not affection, private submission, or sexual consent. Preserve evidenced discomfort, questions, embarrassment, scope objections, and personality resistance.',
  'npc_stats[npc_id] uses only affinity_delta(-5..5), csa_acceptance_delta(-20..30), sexual_arousal_delta(-20..15) for present NPC IDs — deltas are this turn change, never target values; each needs an exact-evidence reason in reasons.affinity/reasons.csa_acceptance/reasons.sexual_arousal. resistance is a fixed per-NPC value and is NEVER included in npc_stats; it never changes. Omit unchanged axes. Announcement, compliance, embarrassment, arousal, or body reaction alone never raises affinity; announcement alone never changes csa_acceptance. Affinity rises only on respecting the NPC wishes, noticing discomfort and caring, emotional empathy, keeping promises, personal help, or a clear relationship scene. Positive affinity_delta requires evidence.npc_stats[npc_id].affinity={quote} (VERBATIM exact Story substring of the caring/empathy moment); without it the delta is dropped. Initial affinity is authoritative from characters.json initial_stats — never set affinity to 1~20.',
  'elapsed_minutes is your only time proposal: 1-30 normally; <=480 only when evidence.time_advance=true. Never compute Day/absolute time.',
  'CSA runtime via csa_runtime_updates/csa_trigger_evaluations only; state_delta.csa_runtime_state[csa_id] ignored. trigger_evaluations never changes execution_state. csa_attitudes stays in state_delta. status=active(executed) requires action_state exactly equal to the rule\'s required_action (e.g. "relieve_sexual_tension"); anything else is discarded.',
  'player_sexual_state uses only arousal_delta, ejaculation_progress_delta, ejaculation_completed, and erection_state; completion requires evidence.sexual_resolution === true. ejaculation_progress_delta: direct stimulation only — none: omit; brief: +1~2; sustained: +2~4; strong: +4~6. Exposure, erection, conversation, or requests alone never raise it. Never decrease/reset when stimulation stops. ejaculation_completed=true only on explicit completion. arousal and progress deltas are independent. erection_state (unknown|flaccid|partial|erect) is the current physical state, not a delta — set it only when Story directly shows the player erection (evidence.player_erection={state,quote}); copy the quote VERBATIM as a contiguous exact Story substring — never summarize, paraphrase, reorder, or translate. Never infer from arousal, CSA, requests, clothing, or image tags. No new erection evidence: keep the saved value; never auto-flaccid on paused stimulation or on completion. Integer values only.',
  'Physical patches may set concise Korean location_label, posture, position_label from Story evidence. NPC/player clothing uses only uniform_top,uniform_bottom,underwear_top,underwear_bottom with worn|removed|open|unknown. Write to state_delta.npc_scene_state[npc_id].clothing or state_delta.player_scene_state.clothing. Record the final attire directly revealed in Story. Underwear-only attire is generally uniform_top:removed, uniform_bottom:removed, underwear_top:worn, underwear_bottom:worn. One quote per actor: evidence.clothing[actor_id]={quote,character_id}; actor_id is player for the player. quote must be an exact Story substring; character_id must equal actor_id. When only a regulation/plan exists and the attire is not shown in Story, make no clothing patch.',
  'sexual_event_ledger is an array of events: [{actor_id,target_id,action_type,direction,completed,interrupted,evidence}]. action_type uses the canonical enum only: kiss, sexual_touch, genital_exposure, genital_touch, oral, penetration, orgasm. Map handjob/sustained_handjob/손으로 남성 성기 자극 and fingering/손가락으로 여성 성기 자극 to genital_touch; fellatio/cunnilingus/deepthroat to oral; vaginal/anal/missionary/doggystyle/cowgirl to penetration. actor_id/target_id must be registered IDs; actor and target differ; evidence must be an exact Story substring; completed=true only when Story states completion; interrupted=true only when Story states interruption. Record when an act starts, changes method, completes, or is interrupted. A new event is allowed for the same action_type when Story shows real new development (speed/intensity change, new NPC reaction, meaningful progress, phase change, resumption after interruption, pre-climax entry). Skip only when the same act is merely re-described with no new reaction, progress, or state change. Distinguish attempt, refusal, partial, conditional acceptance, pause, completion. Human-readable strings are Korean; IDs unchanged.',
  'Movement transition: transition_mode=movement면 이번 턴은 이동 완료 턴이다. destination_location_id 존재 + Story가 도착(발견·마주침)까지 완료 시 state_delta.scene_state.location_id=destination_location_id, participants=player+실제 발견된 destination NPC만. 기존 장소 NPC 미유지. npcs_present/last_npcs_present/focal_character_id도 destination NPC로 갱신. 도착 전 중단(이동 도중)이면 destination NPC를 participants에 넣지 않는다.',
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

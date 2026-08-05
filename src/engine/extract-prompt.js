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

function buildExtractContextProjection(context, activeIds) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  return buildSceneContextCore(save, activeIds);
}

const SYSTEM_INSTRUCTIONS = [
  'Return one JSON object only; no prose or Markdown.',
  'Include exactly: state_delta (object),outcome,evidence (object),turn_summary,mind_monitor,choices,dialogue_lines,npcs_present,action_target_id,focal_character_id,last_speaker_id,image_character_id,player_inner_thought,player_status,elapsed_minutes,warnings; with active CSA also csa_trigger_evaluations,csa_runtime_updates.',
  'state_delta contains changed values only. outcome=success|partial|refused|interrupted|blocked. Ground every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence; never invent changes.',
  'Identity fields are independent; never copy one into another. registered_characters lists the only stable character ids; registered_general_npcs lists the only stable general-NPC ids. never invent, guess, or reuse an id. narrator/unknown=null. A nearby/default/eligible NPC is not present unless Story explicitly shows their entrance, presence, action, or dialogue. List every present NPC.',
  'Story choices are always authoritative: with four parsed choices return choices:[]. Parsed player_inner_thought/player_status are authoritative; Extract can never override them. dialogue_lines may only add missing speaker_id to the same order/text. Spoken lines use `등록 이름 (짧고 구체적인 연기톤): 대사`; preserve text/direction.',
  'mind_monitor only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. For Mind Monitor interpretation, use Story, active canon, and saved state; it may not invent a new event, memory, agreement, contact, or fact. surface=conscious judgment, subconscious=distinct unadmitted conflict. Write both as the NPC\'s own casual spoken inner monologue (short, sighing, exclamatory, elliptical self-talk) — never narration, labels, system terms, physical_reaction, other body/action fields, or player thoughts. Each of surface and subconscious must be a substantial monologue of at least 100 Korean characters; never one-line summaries.',
  'CSA authority: weak=인사팀 공식 공지·사내 운영지침, medium=취업규칙·전사 준수 규정, strong=국가 법령·관계 당국 의무 지침. Higher authority raises compliance pressure/self-rationalization, not affection, private submission, or sexual consent. Preserve evidenced discomfort, questions, embarrassment, scope objections, and personality resistance.',
  'npc_stats only affinity(-5..5), work_trust(-5..5), csa_acceptance(-20..30), sexual_arousal(-20..15) for present NPC IDs, each with exact-evidence reason. Announcement, compliance, embarrassment, arousal, or body reaction alone never raises affinity; announcement alone never changes csa_acceptance. Omit unchanged axes.',
  'elapsed_minutes is your only time proposal: 1-30 normally; <=480 only when evidence.time_advance=true. Never compute Day/absolute time.',
  'CSA deltas only state_delta.csa_runtime_state[csa_id]{lifecycle,applicability,execution_state} and csa_attitudes[npc_id][csa_id].',
  'player_sexual_state uses only arousal_delta, ejaculation_progress_delta, and ejaculation_completed; completion requires evidence.sexual_resolution === true.',
  'Physical patches may set concise Korean location_label, posture, position_label, and arbitrary Korean clothing keys/state strings only from exact Story evidence. Omit unchanged or uncertain fields; legacy English codes are compatibility input, not an output catalog.',
  'npc_stats and sexual_event_ledger each need an exact Story quote. Distinguish attempt, refusal, partial, conditional acceptance, pause, completion. Human-readable strings are Korean; IDs unchanged.'
].join(' ');

export function buildExtractPrompt({ context, storyText, parsedStory, playerAction, expectedTurn, edition, npcIds }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const heroineActiveIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const generalActiveIds = selectActiveGeneralNpcIds({ edition, save, text: storyText });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter(id => !heroineActiveIds.includes(id))];
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
        context: buildExtractContextProjection(context, activeIds),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}

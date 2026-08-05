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
  'Include exactly: state_delta (object), outcome, evidence (object), turn_summary(string), mind_monitor(object), choices(array), dialogue_lines(array), npcs_present(array), action_target_id, focal_character_id, last_speaker_id, image_character_id, player_inner_thought(string), player_status(string), elapsed_minutes(number), warnings(array); with active CSA also csa_trigger_evaluations(array) and csa_runtime_updates(array).',
  'state_delta contains changed values only. outcome=success|partial|refused|interrupted|blocked. Ground every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence; never invent changes.',
  'Identity fields are independent; never copy one into another. registered_characters lists the only stable character ids; registered_general_npcs lists the only stable general-NPC ids. Never invent, guess, or reuse an id. narrator/unknown=null. A nearby/default/eligible NPC is not present until Story explicitly shows entry, presence, action, or dialogue. List every present NPC.',
  'Story is authoritative: if parsed Story has four choices return choices:[]; never override player_inner_thought/player_status. dialogue_lines may only add a missing speaker_id to the same order/text. Spoken lines use `등록 이름 (짧고 구체적인 연기톤): 대사`; preserve parser text/direction.',
  'mind_monitor only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. Use Story, active canon, and saved state; invent no fact. surface=conscious judgment, subconscious=distinct unadmitted conflict. Natural first-person Korean, personality-specific, nonrepetitive; no labels, system terms, body/action fields, or player thoughts.',
  'CSA authority: weak=인사팀 공식 공지·사내 운영지침, medium=취업규칙·전사 준수 규정, strong=국가 법령·관계 당국 의무 지침. Higher authority may increase compliance pressure/self-rationalization, never affection, private submission, or sexual consent. Preserve supported discomfort, questions, embarrassment, scope objections, and personality resistance.',
  'npc_stats only affinity(-5..5), work_trust(-5..5), csa_acceptance(-20..30), sexual_arousal(-20..15), under present NPC IDs, each with concise exact-evidence reason. Announcement, routine cooperation, CSA compliance, embarrassment, arousal, or bodily reaction alone never raises affinity; announcement alone never changes csa_acceptance. Omit unchanged axes.',
  'elapsed_minutes only: 1-30 normally; <=480 only when evidence.time_advance=true. Never compute Day/absolute time.',
  'CSA deltas only state_delta.csa_runtime_state[csa_id]{lifecycle,applicability,execution_state} and csa_attitudes[npc_id][csa_id].',
  'player_sexual_state only arousal_delta, ejaculation_progress_delta, ejaculation_completed; completion requires evidence.sexual_resolution=true.',
  'Physical patches may set location_label, posture, position_label, clothing, evidence, posture_end_reason only with exact Story substrings. Posture change needs movement|task_ended|explicit_change|physical_interruption|player_request.',
  'npc_stats and sexual_event_ledger each need their own exact Story quote. Distinguish attempt, refusal, partial, conditional acceptance, pause, and completion. Human-readable strings are Korean; IDs unchanged.'
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
        expected_turn: expectedTurn,
        player_action: playerAction,
        story_text: storyText,
        parsed_story: buildParsedStoryProjection(parsedStory),
        context: buildExtractContextProjection(context, activeIds),
        registered_characters: buildRegisteredCharacters(edition),
        registered_general_npcs: buildRegisteredGeneralNpcs(edition),
        active_character_canon: buildExtractCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition, generalActiveIds)
      })
    }
  ];
}

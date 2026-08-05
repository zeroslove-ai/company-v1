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
  'Include exactly: state_delta (object), outcome, evidence (object), turn_summary(string), mind_monitor(object), choices(array), dialogue_lines(array), npcs_present(array), action_target_id, focal_character_id, last_speaker_id, image_character_id, player_inner_thought(string), player_status(string), elapsed_minutes(number), warnings(array); with active CSA also csa_trigger_evaluations(array), csa_runtime_updates(array).',
  'state_delta is changed values only. outcome: success, partial, refused, interrupted, or blocked. Ground every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence; never invent changes.',
  'Identity fields are independent; never copy one into another. Narrator is never an NPC; unknown is null. registered_characters lists the only stable character ids: never invent, guess, or reuse an id. registered_general_npcs lists the only stable general-NPC ids. Use exact ids/names and list every present NPC.',
  'A nearby/default/eligible NPC is not present merely because a catalog or location suggests them. Add a general NPC to npcs_present or identity fields only when Story explicitly shows their entrance, presence, action, or dialogue.',
  'If parsed Story has four choices, return choices:[]; Story choices are always authoritative. Leave parsed player_inner_thought/player_status empty because Extract can never override them. dialogue_lines may only add a missing speaker_id to the same text/order. A spoken line is expected in the Story as `등록된 캐릭터 이름 (짧고 구체적인 연기톤): 대사`; preserve the parser text and direction exactly instead of rewriting them.',
  'mind_monitor is only {"npc-id":{"surface":"...","subconscious":"..."}} for present NPCs. For Mind Monitor interpretation, use exact Story dialogue/actions, active_character_canon, active_general_npc_canon, and saved relationship/emotion. It may not invent a new event, memory, agreement, contact, or fact. surface=conscious current judgment; subconscious=a distinct unadmitted motive/conflict. Reflect personality, speech, boundaries, and traits; do not repeat. Natural first-person Korean: surface 150-300 chars, subconscious 180-350 chars. No quotes, labels, keyword lists, CSA/system terms, physical_reaction or other body/action fields, or player thoughts.',
  'CSA authority is fixed by strength: weak=인사팀 공식 공지·사내 운영지침, medium=취업규칙·전사 준수 규정, strong=국가 법령·관계 당국 의무 지침. Higher authority can increase compliance pressure and self-rationalization, but never means affection, private submission, or sexual consent. Preserve discomfort, questioning, embarrassment, scope objections, and personality-specific resistance when Story supports them.',
  'npc_stats may use only affinity, work_trust, csa_acceptance, sexual_arousal under each present NPC id. affinity is the overall personal impression toward the player and is limited to -5..+5; routine cooperation, CSA compliance, embarrassment, arousal, or bodily reaction alone never raises it. work_trust is professional reliability and is limited to -5..+5. csa_acceptance is limited to -20..+30 and changes only when an active CSA direct meaning actually affects judgment or behavior; creating/editing/announcing a rule alone is not enough. sexual_arousal is limited to -20..+15 and needs direct Story evidence. Put a concise exact-evidence explanation in the NPC patch reason. Omit unchanged axes rather than mechanically changing every stat.',
  'elapsed_minutes is your only time proposal: 1-30 normally, up to 480 only with evidence.time_advance===true; never compute Day/absolute time.',
  'CSA changes only in state_delta.csa_runtime_state[csa_id]{lifecycle,applicability,execution_state} and csa_attitudes[npc_id][csa_id].',
  'player_sexual_state uses only arousal_delta, ejaculation_progress_delta, and ejaculation_completed; completion requires evidence.sexual_resolution === true.',
  'With clear Story proof, player_scene_state or npc_scene_state[id] may set location_label, posture, position_label, clothing, evidence, posture_end_reason. evidence.posture/position must be exact Story substrings; omit unknowns. A real posture change needs an evidenced reason: movement, task_ended, explicit_change, physical_interruption, or player_request.',
  'npc_stats and sexual_event_ledger changes each need their own exact Story quote. Distinguish attempt, refusal, partial, conditional acceptance, pause, and completion; never assume completion. Human-readable strings are Korean; IDs stay unchanged.'
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

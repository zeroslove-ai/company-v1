import { buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

/** The stable id/name pairs Extract may resolve identity fields and Mind Monitor keys to. */
export function buildRegisteredCharacters(edition) {
  const charactersMap = object(edition?.characters?.characters);
  if (!charactersMap) return [];
  const registered = [];
  for (const [id, character] of Object.entries(charactersMap)) {
    if (!object(character) || typeof character.name !== 'string') continue;
    registered.push({ character_id: id, name: character.name });
  }
  return registered;
}

/** Only the parser fields Extract actually needs; raw/scene_text/blocks never duplicate story_text. */
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

/** Compact Extract context: current turn/time/scene/global CSA and only the active NPCs' mutable state. */
function buildExtractContextProjection(context, activeIds) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  return buildSceneContextCore(save, activeIds);
}

const SYSTEM_INSTRUCTIONS = [
  'Return one JSON object only, no explanation or Markdown.',
  'Include exactly: state_delta(object), outcome, evidence(object), turn_summary(string), mind_monitor(object), choices(array), dialogue_lines(array), npcs_present(array), action_target_id, focal_character_id, last_speaker_id, image_character_id, player_inner_thought(string), player_status(string), elapsed_minutes(number), warnings(array); with active CSA also include csa_trigger_evaluations(array), csa_runtime_updates(array).',
  'state_delta contains changed values only. outcome is success, partial, refused, interrupted, or blocked. Ground every proposal in exact Story evidence; never invent NPCs or changes.',
  'action_target_id, focal_character_id, last_speaker_id, image_character_id are independent: never copy one into another. Narrator is never an NPC; unknown is null. Use only exact registered_characters ids/names and list every present NPC in npcs_present.',
  'If parsed Story has exactly four choices, return choices:[]; Story choices are always authoritative. Leave parsed player_inner_thought/player_status empty because Extract can never override them. dialogue_lines may only add a missing speaker_id to the same text/order.',
  'mind_monitor uses only { "npc-id": { "surface": "...", "subconscious": "..." } } for present NPCs. Write natural first-person Korean: surface 150-300 chars, subconscious 180-350 chars. No quotes, labels, keyword lists, CSA/system terms, physical/body/action reaction fields, or player thoughts.',
  'elapsed_minutes is your only time proposal; never compute Day/absolute time. Use 1-30, or up to 480 only when evidence.time_advance === true.',
  'CSA changes belong only in state_delta.csa_runtime_state[csa_id]{lifecycle,applicability,execution_state} and state_delta.csa_attitudes[npc_id][csa_id].',
  'player_sexual_state uses only arousal_delta, ejaculation_progress_delta, and ejaculation_completed; completion requires evidence.sexual_resolution === true.',
  'Only when Story clearly proves it, state_delta may set player_scene_state or npc_scene_state[id]{location_label,posture,position_label,clothing,evidence,posture_end_reason}. position_label briefly states relative position/current action. evidence.posture and evidence.position must be exact Story substrings; omit unknown player posture/position. posture_end_reason is only for a real posture change and one of movement, task_ended, explicit_change, physical_interruption, player_request with exact evidence.',
  'state_delta may also set npc_stats[id]{affinity,csa_acceptance,sexual_arousal,work_trust,reason} and sexual_event_ledger[{actor_id,target_id,action_type,direction,completed,interrupted,evidence}]. Every physical/stat change needs its own exact Story quote.',
  'Distinguish attempt, refusal, partial, conditional acceptance, pause, completion; never assume completion. Human-readable strings are Korean; IDs stay unchanged. Keep summaries/deltas/monitor concise.'
].join(' ');

export function buildExtractPrompt({ context, storyText, parsedStory, playerAction, expectedTurn, edition, npcIds }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const activeIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
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
        registered_characters: buildRegisteredCharacters(edition)
      })
    }
  ];
}

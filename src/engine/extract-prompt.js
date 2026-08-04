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
  'Return one JSON object only, with no explanation or Markdown fences.',
  'The object must include exactly these fields: state_delta (object), outcome, evidence (object), turn_summary (string), mind_monitor (object), choices (array), dialogue_lines (array), npcs_present (array), action_target_id, focal_character_id, last_speaker_id, image_character_id, player_inner_thought (string), player_status (string), elapsed_minutes (number), warnings (array). When context lists an active CSA, also include csa_trigger_evaluations (array) and csa_runtime_updates (array).',
  'state_delta holds changed values only, never a full save. outcome is one of success, partial, refused, interrupted, blocked. Every proposal must be grounded in Story evidence; never invent an NPC or a state change Story gives no evidence for.',
  'action_target_id, focal_character_id, last_speaker_id, and image_character_id are independent: never copy one into another, never infer a narrator as an NPC id, use null for anything unknown.',
  'registered_characters lists the only stable character ids you may use. Return an id only when its name matches a Story character exactly; never invent, guess, or reuse an id for someone not in that list or not actually in Story, and never turn the narrator into an NPC id. Include every NPC actually present in Story in npcs_present.',
  'If parsed Story already produced exactly four choices, return an empty choices array; Story choices are always authoritative. Leave player_inner_thought/player_status empty when the parser already has verbatim values, since Extract can never override them. Only add dialogue_lines to resolve a speaker_id the parser could not match; never change parser wording or order.',
  'mind_monitor uses only { "npc-id": { "surface": "...", "subconscious": "..." } } per NPC actually present in Story, natural first-person Korean, no quotation marks, no status labels, no body/physical text.',
  'elapsed_minutes is your only time proposal; never compute Day or absolute time. Use 1-30 normally, up to 480 only with evidence.time_advance === true.',
  'CSA changes belong only under state_delta.csa_runtime_state[csa_id] (lifecycle/applicability/execution_state) and state_delta.csa_attitudes[npc_id][csa_id]; never a personal or per-NPC-only suggestion list.',
  'player_sexual_state deltas use arousal_delta, ejaculation_progress_delta, and ejaculation_completed only; set ejaculation_completed true only when evidence.sexual_resolution === true.',
  'state_delta may add player_scene_state/npc_scene_state[id]{location_label,posture,clothing:{uniform_top,uniform_bottom,underwear_top,underwear_bottom},evidence} and npc_stats[id]{affinity,csa_acceptance,sexual_arousal,work_trust,reason} deltas, and sexual_event_ledger[{actor_id,target_id,action_type,direction,completed,interrupted,evidence}]. Every physical/stat change needs its own exact Story quote as evidence.',
  'Distinguish attempt/refusal/partial/conditional-acceptance/pause/completion; never assume automatic completion.',
  'All human-readable strings must be Korean. IDs remain unchanged. Do not repeat Story text in turn_summary; keep turn_summary, state_delta, and mind_monitor concise.'
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

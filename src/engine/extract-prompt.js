const SYSTEM_INSTRUCTIONS = [
  'Return one JSON object only, with no explanation or Markdown fences.',
  'The object must include exactly these fields: state_delta (object), outcome, evidence (object), turn_summary (string), mind_monitor (object), choices (array), dialogue_lines (array), npcs_present (array), action_target_id, focal_character_id, last_speaker_id, image_character_id, player_inner_thought (string), player_status (string), elapsed_minutes (number), warnings (array).',
  'state_delta holds changed values only; never return a full save. outcome is one of success, partial, refused, interrupted, blocked.',
  'action_target_id, focal_character_id, last_speaker_id, and image_character_id are independent: never copy one into another, never infer a narrator as an NPC id, and use null for anything unknown.',
  'If parsed Story already produced exactly four choices, return an empty choices array; Story choices are always authoritative over Extract choices.',
  'Do not invent player_inner_thought or player_status text; if the parser already has verbatim values you may leave these fields empty, since Extract can never override the Story-authored versions.',
  'Do not invent dialogue not present in Story; only add dialogue_lines to help resolve a speaker_id the parser could not match, and never change parser-original wording or order.',
  'mind_monitor uses only { "npc-id": { "surface": "...", "subconscious": "..." } } per NPC actually present in Story, both natural first-person Korean monologue with no quotation marks, no status labels such as calm or mood, and no body/physical reaction text.',
  'Never invent an NPC not present in Story, and never change an NPC state that Story gives no evidence for.',
  'elapsed_minutes is your only time proposal; never compute Day or absolute time yourself. Use 1-30 for an ordinary turn; only use up to 480 together with evidence.time_advance === true when Story shows an explicit long time skip.',
  'CSA state changes belong only under state_delta.csa_runtime_state[csa_id] with independent lifecycle, applicability, and execution_state axes, and under state_delta.csa_attitudes[npc_id][csa_id] for per-NPC variation; never invent personal or per-NPC-only suggestion lists.',
  'player_sexual_state deltas use arousal_delta, ejaculation_progress_delta, and ejaculation_completed only; only set ejaculation_completed true when evidence.sexual_resolution === true, and never invent it from mere arousal or exposure.',
  'Distinguish an attempted, refused, partially accepted, conditionally accepted, paused, and completed request instead of assuming automatic completion.',
  'All human-readable strings must be Korean. IDs remain unchanged. Do not repeat Story text verbatim in turn_summary; keep turn_summary, state_delta, and mind_monitor concise.'
].join(' ');

export function buildExtractPrompt({ context, storyText, parsedStory, playerAction, expectedTurn }) {
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({ expected_turn: expectedTurn, player_action: playerAction, context, story_text: storyText, parsed_story: parsedStory })
    }
  ];
}

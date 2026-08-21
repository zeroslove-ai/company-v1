export function buildStoryContext(context, literalAction) {
  const turns = Array.isArray(context?.turns) ? context.turns : [];
  const recent = turns.slice(-8).map(turn => ({ turn_number: turn.turn_number, literal_action: turn.literal_action, story_text: turn.story_text }));
  const older = turns.slice(0, -8).map(turn => ({ turn_number: turn.turn_number, turn_summary: turn.turn_summary || String(turn.story_text ?? '').slice(0, 400) })).slice(-24);
  return { literal_action: literalAction, profile: context?.state?.state?.profile ?? {}, time: context?.state?.state?.time ?? {}, scene: context?.state?.state?.scene ?? {}, clothing: context?.state?.state?.clothing ?? {}, active_rules: [], recent_turns: recent, older_summaries: older };
}

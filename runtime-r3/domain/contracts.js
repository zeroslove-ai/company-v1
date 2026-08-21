export const MAX_LITERAL_ACTION = 2000;

export function clone(value) { return value === undefined ? undefined : structuredClone(value); }

export function requireLiteralAction(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_LITERAL_ACTION) throw new Error('r3_literal_action_invalid');
  return value;
}

export function assertExpectedTurn(expectedTurn, committedTurn) {
  if (!Number.isInteger(expectedTurn) || expectedTurn !== committedTurn + 1) throw new Error('r3_turn_conflict');
}

export function createInitialState(profile, locationId) {
  return {
    profile: clone(profile),
    time: { day: 1, minute: 540 },
    scene: { location_id: locationId ?? null, present_actor_ids: [], scene_note: '' },
    active_rules: [],
    clothing: {}
  };
}

export function boundedSummary(storyText, observerSummary) {
  const summary = typeof observerSummary === 'string' ? observerSummary.trim() : '';
  if (summary) return summary.slice(0, 600);
  return String(storyText ?? '').trim().slice(0, 600);
}

export function advanceTime(time, elapsedMinutes) {
  const minutes = Number.isInteger(elapsedMinutes) && elapsedMinutes >= 0 ? Math.min(elapsedMinutes, 24 * 60) : 0;
  const absolute = Math.max(0, (Number(time?.day) - 1) * 1440 + Number(time?.minute)) + minutes;
  return { day: Math.floor(absolute / 1440) + 1, minute: absolute % 1440 };
}

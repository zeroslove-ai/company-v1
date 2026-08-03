/**
 * Story/Extract/Commit run as three separate HTTP calls, so a single request can only
 * ever time its own stage. Each stage logs one line tagged with request_id/action_id/
 * expected_turn so the three lines can be joined downstream into a full turn timeline.
 */
export function logTurnTiming(fields) {
  const { warning_codes, ...rest } = fields;
  console.log(JSON.stringify({
    event: 'company_turn_timing',
    ...rest,
    warning_codes: Array.isArray(warning_codes) ? warning_codes : []
  }));
}

export function newRequestId() {
  return typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

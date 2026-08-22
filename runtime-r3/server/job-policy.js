// These are durable stage leases, not provider timeout changes.  Story keeps
// the existing 120s provider budget plus a small scheduling grace; the
// Observer/fail-open window gets its own independent lease after Story ends.
export const R3_STORY_STAGE_LEASE_MS = 130_000;
export const R3_OBSERVER_STAGE_LEASE_MS = 85_000;
export const R3_TURN_LEASE_MS = R3_STORY_STAGE_LEASE_MS;
export const R3_PROGRESS_INTERVAL_CHARS = 512;
export const R3_MAX_PROGRESS_WRITES = 4;

export function r3StageLeaseMs(stage) {
  return stage === 'story_complete' ? R3_OBSERVER_STAGE_LEASE_MS : R3_STORY_STAGE_LEASE_MS;
}

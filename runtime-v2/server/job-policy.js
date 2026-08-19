export const V2_TURN_LEASE_MS = 180_000;
export const MAX_PROGRESS_WRITES_PER_ATTEMPT = 4;
export const PROGRESS_SNAPSHOT_INTERVAL_CHARS = 512;

export function isStaleTurn(updatedAt, now = Date.now(), leaseMs = V2_TURN_LEASE_MS) {
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) && now - timestamp >= leaseMs;
}

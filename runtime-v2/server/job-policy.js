export const V2_TURN_LEASE_MS = 180_000;

export function isStaleTurn(updatedAt, now = Date.now(), leaseMs = V2_TURN_LEASE_MS) {
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) && now - timestamp >= leaseMs;
}

/**
 * Deterministic image selection — zero LLM calls. Scores at most 8 candidates (already
 * filtered by the caller to the requested character_id + pool) and returns exactly one, or a
 * documented fallback. Never asked to rank the whole image_library catalog — the caller
 * queries only this one character's active rows first.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * candidate: a row from image_library (character_id, situation, tags[], image_pool,
 * is_sexual, curation_rank, image_url, image_id, active).
 * request: { characterId, situation, tags, pool ('general'|'sex'), locationId }.
 * Score is purely additive from exact/overlap matches — never randomized, never LLM-derived.
 */
function scoreCandidate(candidate, request) {
  let score = 0;
  if (typeof request.situation === 'string' && request.situation && candidate.situation === request.situation) score += 10;
  const requestedTags = new Set([...(Array.isArray(request.tags) ? request.tags : []), request.locationId].filter(Boolean));
  const candidateTags = new Set(Array.isArray(candidate.tags) ? candidate.tags : []);
  for (const tag of requestedTags) if (candidateTags.has(tag)) score += 2;
  return score;
}

/**
 * Evaluates at most the first 8 candidates given (the caller is responsible for narrowing to
 * character_id + active=true + the requested pool before calling this). Ties broken by lower
 * curation_rank, then by image_id for a fully stable, reproducible result. Returns
 * { image_id, image_url, source: 'match' } on a real match, { ..., source: 'primary' } when no
 * candidate scores above zero but a lowest-curation_rank fallback exists for this character,
 * or null when there is nothing at all to show for this character/pool.
 */
export function selectImage(candidates, request = {}) {
  const pool = (Array.isArray(candidates) ? candidates : []).filter(isPlainObject).slice(0, 8);
  if (!pool.length) return null;
  const scored = pool
    .map(candidate => ({ candidate, score: scoreCandidate(candidate, request) }))
    .sort((a, b) => b.score - a.score
      || (a.candidate.curation_rank ?? Infinity) - (b.candidate.curation_rank ?? Infinity)
      || String(a.candidate.image_id).localeCompare(String(b.candidate.image_id)));
  const best = scored[0];
  if (best.score > 0) return { image_id: best.candidate.image_id, image_url: best.candidate.image_url, source: 'match' };
  // No real match — fall back to this character's lowest-curation_rank (primary) image in the pool.
  const primary = [...pool].sort((a, b) => (a.curation_rank ?? Infinity) - (b.curation_rank ?? Infinity) || String(a.image_id).localeCompare(String(b.image_id)))[0];
  return { image_id: primary.image_id, image_url: primary.image_url, source: 'primary' };
}

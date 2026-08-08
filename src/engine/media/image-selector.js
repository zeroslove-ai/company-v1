/**
 * Deterministic image selection — zero LLM calls. Scores at most 8 candidates (already
 * filtered by the caller to the requested character_id + pool) and returns exactly one, or a
 * documented fallback. Never asked to rank the whole image_library catalog — the caller
 * queries only this one character's active rows first.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// generic 태그 일치만으로는 성적 행동 이미지가 매칭됐다고 보지 않는다.
const GENERIC_TAGS = new Set(['adult', 'sex', 'office', 'general', 'default', 'portrait', 'solo']);

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
 * curation_rank, then by image_id for a fully stable, reproducible result.
 *
 * sex pool 정책 (턴70 수정):
 * - non-generic action tag 정확 일치가 있어야 성적 행동 이미지로 매칭한다.
 * - generic 태그(adult/sex/office/general/default/portrait/solo) 일치만으로는 매칭으로 보지 않는다.
 * - 정확 일치가 없고 sexual_generic 태그 후보가 있으면 제한적으로 fallback한다.
 * - 그 외에는 null — 잘못된 explicit 이미지보다 이미지 없음이 낫다.
 *
 * general pool은 기존 fallback 허용: score 0이어도 최저 curation_rank(primary) 이미지 반환.
 */
export function selectImage(candidates, request = {}) {
  const pool = (Array.isArray(candidates) ? candidates : []).filter(isPlainObject).slice(0, 8);
  if (!pool.length) return null;
  const requestedTags = new Set([...(Array.isArray(request.tags) ? request.tags : []), request.locationId].filter(Boolean));
  const requestedActionTags = [...requestedTags].filter(tag => !GENERIC_TAGS.has(tag));

  if (request.pool === 'sex') {
    // 1. non-generic action tag 정확 일치
    const exact = pool.find(candidate => (Array.isArray(candidate.tags) ? candidate.tags : [])
      .some(tag => requestedActionTags.includes(tag)));
    if (exact) return { image_id: exact.image_id, image_url: exact.image_url, source: 'match' };
    // 2. sexual_generic 태그 후보 — 별도 정확 이미지가 없을 때만 제한적 fallback
    const sexualGeneric = pool
      .filter(candidate => (Array.isArray(candidate.tags) ? candidate.tags : []).includes('sexual_generic'))
      .sort((a, b) => (a.curation_rank ?? Infinity) - (b.curation_rank ?? Infinity)
        || String(a.image_id).localeCompare(String(b.image_id)))[0];
    if (sexualGeneric) return { image_id: sexualGeneric.image_id, image_url: sexualGeneric.image_url, source: 'sexual_generic' };
    // 3. 그 외 null — 임의 sex 이미지로 대체하지 않는다.
    return null;
  }

  // general pool — 기존 동작 유지
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

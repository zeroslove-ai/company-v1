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

// action family — 정확 일치가 없을 때 같은 family를 우선한다 (턴80 보정 C).
const ACTION_FAMILIES = {
  manual: ['handjob', 'fingering', 'genital_touch'],
  oral: ['fellatio', 'cunnilingus', 'deepthroat'],
  penetration: ['missionary', 'doggystyle', 'cowgirl', 'anal', 'standing_rear'],
  climax: ['facial_cumshot', 'oral_cumshot', 'body_cumshot', 'creampie', 'cowgirl_climax', 'missionary_climax', 'squirting', 'hypnosis_sex']
};
const FAMILY_OF_TAG = new Map();
for (const [family, tags] of Object.entries(ACTION_FAMILIES)) {
  for (const tag of tags) FAMILY_OF_TAG.set(tag, family);
}

function candidateTags(candidate) {
  return Array.isArray(candidate.tags) ? candidate.tags : [];
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
  const cTags = new Set(candidateTags(candidate));
  for (const tag of requestedTags) if (cTags.has(tag)) score += 2;
  return score;
}

function byCurationRank(a, b) {
  return (a.curation_rank ?? Infinity) - (b.curation_rank ?? Infinity)
    || String(a.image_id).localeCompare(String(b.image_id));
}

/**
 * sex pool 정책 (턴80 보정 C) — "정확하지 않으면 이미지 없음"이 아니라
 * "섹슈얼 장면이면 반드시 sex 폴더 이미지":
 * 1) 동일 캐릭터 + 모든 요청 action tag 일치
 * 2) 동일 캐릭터 + 핵심 action tag 일부 일치
 * 3) 동일 캐릭터 + 같은 action family
 * 4) 동일 캐릭터 + sexual_generic
 * 5) 동일 캐릭터 sex pool 중 curation_rank 최상위
 * 6) 동일 캐릭터 sex 이미지가 정말 0개일 때만 공용 sexual_generic fallback
 * 일반 portrait/default 이미지는 사용하지 않는다. sex pool에서 null을 반환하지 않는다.
 */
export function selectImage(candidates, request = {}) {
  const pool = (Array.isArray(candidates) ? candidates : []).filter(isPlainObject);
  if (!pool.length) return null;

  const requestedTags = new Set([...(Array.isArray(request.tags) ? request.tags : []), request.locationId].filter(Boolean));
  const requestedActionTags = [...requestedTags].filter(tag => !GENERIC_TAGS.has(tag));

  if (request.pool === 'sex') {
    // 1) 모든 요청 action tag 일치
    if (requestedActionTags.length > 0) {
      const allMatch = pool.find(candidate => {
        const cTags = new Set(candidateTags(candidate));
        return requestedActionTags.every(tag => cTags.has(tag));
      });
      if (allMatch) return { image_id: allMatch.image_id, image_url: allMatch.image_url, source: 'match' };

      // 2) 핵심 action tag 일부 일치
      const partial = pool
        .filter(candidate => candidateTags(candidate).some(tag => requestedActionTags.includes(tag)))
        .sort(byCurationRank)[0];
      if (partial) return { image_id: partial.image_id, image_url: partial.image_url, source: 'partial_match' };

      // 3) 같은 action family
      const families = new Set(requestedActionTags.map(tag => FAMILY_OF_TAG.get(tag)).filter(Boolean));
      if (families.size > 0) {
        const familyMatch = pool
          .filter(candidate => candidateTags(candidate).some(tag => families.has(FAMILY_OF_TAG.get(tag))))
          .sort(byCurationRank)[0];
        if (familyMatch) return { image_id: familyMatch.image_id, image_url: familyMatch.image_url, source: 'family_match' };
      }
    }

    // 4) sexual_generic
    const sexualGeneric = pool
      .filter(candidate => candidateTags(candidate).includes('sexual_generic'))
      .sort(byCurationRank)[0];
    if (sexualGeneric) return { image_id: sexualGeneric.image_id, image_url: sexualGeneric.image_url, source: 'sexual_generic' };

    // 5) 동일 캐릭터 sex pool 최상위 — null 대신 반드시 하나 반환
    const top = [...pool].sort(byCurationRank)[0];
    if (top) return { image_id: top.image_id, image_url: top.image_url, source: 'sex_primary' };

    // 6) sex 이미지가 정말 0개면 null (호출부가 general 재요청하지 않도록 처리)
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
  const primary = [...pool].sort(byCurationRank)[0];
  return { image_id: primary.image_id, image_url: primary.image_url, source: 'primary' };
}

/**
 * Combines clothing, posture and display location into one Story-grounded
 * scene-state patch. Physical fields are open natural-language values.
 * Existing legacy codes remain readable, while exact evidence gates every
 * changed field independently so auxiliary metadata never blocks Commit.
 */
import { retainEvidencedClothing } from './clothing.js';
import { buildPosturePatch, normalizePhysicalText } from './posture.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identity(value, maxLength = 180) {
  if (typeof value !== 'string' || !value.trim()) return null;
  return Array.from(value.trim().replace(/\s+/g, ' ')).slice(0, maxLength).join('');
}

function evidenceObject(value) {
  if (isPlainObject(value)) return value;
  if (typeof value === 'string' && value.trim()) return { posture: value, position: value, location: value };
  return {};
}

function exactStoryEvidence(evidence, narrativeText, characterName = '') {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  const quote = evidence.trim();
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(quote)) return false;
  if (typeof characterName === 'string' && characterName.trim() && !quote.includes(characterName.trim())) return false;
  return true;
}

export function buildSceneStatePatch({ previous = {}, proposal = null, evidenceMap = {}, narrativeText = '', characterName = '', turnNumber = null, actorId = null, npcsPresent = [], registeredNpcNames = [] } = {}) {
  const prev = isPlainObject(previous) ? previous : {};
  const raw = isPlainObject(proposal) ? proposal : {};
  const evidence = evidenceObject(evidenceMap);
  const localEvidence = evidenceObject(raw.evidence);
  const warnings = [];
  const clothingEvidence = isPlainObject(evidence.clothing) && Object.keys(evidence.clothing).length
    ? evidence.clothing
    : (isPlainObject(localEvidence.clothing) ? localEvidence.clothing : {});
  const clothingActorScoped = evidence.clothing_actor_scoped === true;

  const { clothing: acceptedClothing, rejections } = retainEvidencedClothing({
    previousClothing: prev.clothing ?? {},
    proposedClothing: raw.clothing ?? {},
    evidenceMap: clothingEvidence,
    narrativeText,
    characterName,
    actorId,
    npcsPresent,
    actorScoped: clothingActorScoped,
    registeredNpcNames
  });
  warnings.push(...rejections);

  const requestedPosture = normalizePhysicalText(raw.posture);
  const requestedPosition = normalizePhysicalText(raw.position_label, 140);
  const previousPosture = normalizePhysicalText(prev.posture);
  const previousPosition = normalizePhysicalText(prev.position_label, 140);
  const postureChanges = Boolean(requestedPosture && requestedPosture !== previousPosture);
  const positionChanges = Boolean(requestedPosition && requestedPosition !== previousPosition);
  const postureEvidenceValid = Boolean(requestedPosture) && exactStoryEvidence(evidence.posture, narrativeText, characterName);
  const positionEvidenceValid = Boolean(requestedPosition) && exactStoryEvidence(evidence.position ?? evidence.posture, narrativeText, characterName);
  const endReasonRequested = identity(raw.posture_end_reason, 80);
  const endReasonEvidenceValid = Boolean(endReasonRequested)
    && exactStoryEvidence(evidence.posture_end_reason ?? evidence.posture, narrativeText, characterName);

  if (postureChanges && !postureEvidenceValid) warnings.push('unevidenced_posture_change');
  if (positionChanges && !positionEvidenceValid) warnings.push('unevidenced_position_label');
  if (endReasonRequested && postureChanges && !endReasonEvidenceValid) warnings.push('unevidenced_posture_end_reason');

  // Extract가 제안한 posture/position_label은 증거 검증과 무관하게 반영한다.
  // (증거 불충분은 unevidenced 경고로만 기록 — 33~37턴 자세 저장 누락 방지)
  const postureProposal = requestedPosture || requestedPosition ? {
    posture: requestedPosture || previousPosture,
    position_label: requestedPosition || previousPosition,
    end_reason: endReasonEvidenceValid ? endReasonRequested : null,
    evidence_valid: postureEvidenceValid
  } : null;
  const posturePatch = buildPosturePatch({
    previous: prev.posture || prev.position_label ? {
      posture: prev.posture,
      position_label: prev.position_label,
      updated_turn: prev.updated_turn
    } : null,
    proposal: postureProposal,
    turnNumber
  });
  if (posturePatch?.rejected && !warnings.includes(posturePatch.rejected)) warnings.push(posturePatch.rejected);

  const locationRequested = identity(raw.location_label, 100);
  const locationEvidenceValid = Boolean(locationRequested)
    && exactStoryEvidence(evidence.location, narrativeText, characterName);
  if (locationRequested && locationRequested !== prev.location_label && !locationEvidenceValid) {
    warnings.push('unevidenced_location_change');
  }

  return {
    state: {
      location_label: locationEvidenceValid ? locationRequested : (prev.location_label ?? null),
      posture: posturePatch?.posture ?? prev.posture ?? 'unknown',
      position_label: posturePatch?.position_label ?? prev.position_label ?? null,
      clothing: { ...(isPlainObject(prev.clothing) ? prev.clothing : {}), ...acceptedClothing },
      updated_turn: posturePatch?.updated_turn ?? prev.updated_turn ?? turnNumber
    },
    warnings
  };
}

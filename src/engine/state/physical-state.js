/**
 * Combines clothing + posture + location into the full scene-state patch builders for the
 * player and for a single NPC. Deactivate (or any CSA activate/update) never reaches these
 * builders with a physical-change proposal of its own — CSA transaction application and
 * physical-state application are structurally separate.
 */
import { retainEvidencedClothing } from './clothing.js';
import { buildPosturePatch, POSTURE_VALUES } from './posture.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function evidenceObject(value) {
  if (isPlainObject(value)) return value;
  if (typeof value === 'string' && value.trim()) return { posture: value, position: value, location: value };
  return {};
}

function exactStoryEvidence(evidence, narrativeText, characterName = '') {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  const quote = evidence.trim();
  if (!text.includes(quote)) return false;
  if (typeof characterName === 'string' && characterName.trim() && !quote.includes(characterName.trim())) return false;
  return true;
}

/**
 * Builds the next scene-state object for one character. Posture, position_label and location
 * are accepted only when an exact supporting Story substring is supplied. Missing or rejected
 * proposals carry the previous physical state forward; a turn boundary or CSA deactivation is
 * never an implicit reset.
 */
export function buildSceneStatePatch({ previous = {}, proposal = null, evidenceMap = {}, narrativeText = '', characterName = '', turnNumber = null } = {}) {
  const prev = isPlainObject(previous) ? previous : {};
  const raw = isPlainObject(proposal) ? proposal : {};
  const evidence = evidenceObject(evidenceMap);
  const warnings = [];

  const { clothing: acceptedClothing, rejections } = retainEvidencedClothing({
    previousClothing: prev.clothing ?? {}, proposedClothing: raw.clothing ?? {},
    evidenceMap: isPlainObject(evidence.clothing) ? evidence.clothing : {}, narrativeText, characterName
  });
  for (const rejection of rejections) warnings.push(rejection);

  const postureRequested = POSTURE_VALUES.has(raw.posture);
  const postureChanges = postureRequested && raw.posture !== prev.posture;
  const postureEvidenceValid = postureRequested && exactStoryEvidence(evidence.posture, narrativeText, characterName);
  const positionRequested = identity(raw.position_label);
  const positionEvidenceValid = Boolean(positionRequested) && exactStoryEvidence(evidence.position ?? evidence.posture, narrativeText, characterName);
  const endReasonRequested = identity(raw.posture_end_reason);
  const endReasonEvidenceValid = Boolean(endReasonRequested)
    && exactStoryEvidence(evidence.posture_end_reason ?? evidence.posture, narrativeText, characterName);

  if (postureRequested && !postureEvidenceValid && postureChanges) warnings.push('unevidenced_posture_change');
  if (positionRequested && !positionEvidenceValid && positionRequested !== prev.position_label) warnings.push('unevidenced_position_label');
  if (endReasonRequested && postureChanges && !endReasonEvidenceValid) warnings.push('unevidenced_posture_end_reason');

  const acceptedPosture = postureRequested && (!postureChanges || postureEvidenceValid) ? raw.posture : prev.posture;
  const acceptedPosition = positionEvidenceValid ? positionRequested : (prev.position_label ?? null);
  const canBuildPosture = POSTURE_VALUES.has(acceptedPosture);
  const postureProposal = canBuildPosture && (postureRequested || positionEvidenceValid)
    ? {
        posture: acceptedPosture,
        position_label: acceptedPosition,
        end_reason: postureChanges && endReasonEvidenceValid ? endReasonRequested : null
      }
    : null;
  const posturePatch = buildPosturePatch({
    previous: prev.posture ? { posture: prev.posture, position_label: prev.position_label, updated_turn: prev.updated_turn } : null,
    proposal: postureProposal,
    turnNumber
  });
  if (posturePatch?.rejected && !warnings.includes(posturePatch.rejected)) warnings.push(posturePatch.rejected);

  const locationRequested = identity(raw.location_label);
  const locationEvidenceValid = Boolean(locationRequested) && exactStoryEvidence(evidence.location, narrativeText, characterName);
  const locationLabel = locationEvidenceValid ? locationRequested.slice(0, 60) : (prev.location_label ?? null);
  if (locationRequested && !locationEvidenceValid && locationRequested !== prev.location_label) warnings.push('unevidenced_location_change');

  const next = {
    location_label: locationLabel,
    posture: posturePatch?.posture ?? prev.posture ?? 'unknown',
    position_label: posturePatch?.position_label ?? acceptedPosition ?? null,
    clothing: { ...(prev.clothing ?? {}), ...acceptedClothing },
    updated_turn: posturePatch?.updated_turn ?? turnNumber
  };
  return { state: next, warnings };
}

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

function exactStoryEvidence(evidence, path, narrativeText, characterName = '') {
  if (!isPlainObject(evidence) || !Array.isArray(evidence.changed) || !evidence.changed.includes(path)) return false;
  const quote = typeof evidence.quote === 'string' ? evidence.quote.trim() : '';
  if (!quote) return false;
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(quote)) return false;
  // Actor-scoped evidence is already the identity authority. Requiring the
  // full display name again rejects valid natural Korean prose.
  return true;
}

export function buildSceneStatePatch({ previous = {}, proposal = null, evidence = {}, narrativeText = '', characterName = '', turnNumber = null, actorId = null, npcsPresent = [], registeredNpcNames = [] } = {}) {
  const prev = isPlainObject(previous) ? previous : {};
  const raw = isPlainObject(proposal) ? proposal : {};
  const warnings = [];
  const actorPrefix = actorId === 'player' || /^player(?:[-_].*)?$/i.test(actorId) ? 'player_scene_state' : `npc_scene_state.${actorId}`;
  const clothingEvidence = Array.isArray(evidence.changed) && evidence.changed.some(path => path.startsWith(`${actorPrefix}.clothing.`))
    ? evidence.quote
    : null;

  const { clothing: acceptedClothing, rejections } = retainEvidencedClothing({
    previousClothing: prev.clothing ?? {},
    proposedClothing: raw.clothing ?? {},
    evidenceQuote: clothingEvidence,
    narrativeText,
    characterName,
    actorId,
    npcsPresent,
    registeredNpcNames
  });
  warnings.push(...rejections);

  const requestedPosture = normalizePhysicalText(raw.posture);
  const requestedPosition = normalizePhysicalText(raw.position_label, 140);
  const previousPosture = normalizePhysicalText(prev.posture);
  const previousPosition = normalizePhysicalText(prev.position_label, 140);
  const postureChanges = Boolean(requestedPosture && requestedPosture !== previousPosture);
  const positionChanges = Boolean(requestedPosition && requestedPosition !== previousPosition);
  const postureEvidenceValid = Boolean(requestedPosture) && exactStoryEvidence(evidence, `${actorPrefix}.posture`, narrativeText, characterName);
  const positionEvidenceValid = Boolean(requestedPosition) && exactStoryEvidence(evidence, `${actorPrefix}.position_label`, narrativeText, characterName);
  const endReasonRequested = identity(raw.posture_end_reason, 80);
  const endReasonEvidenceValid = Boolean(endReasonRequested)
    && exactStoryEvidence(evidence, `${actorPrefix}.posture`, narrativeText, characterName);

  if (postureChanges && !postureEvidenceValid) warnings.push('unevidenced_posture_change');
  if (positionChanges && !positionEvidenceValid) warnings.push('unevidenced_position_label');
  if (endReasonRequested && postureChanges && !endReasonEvidenceValid) warnings.push('unevidenced_posture_end_reason');

  // Each optional posture/position axis is accepted only with its own exact Story quote.
  // Missing evidence remains warning-only for the turn and preserves the prior axis.
  const postureProposal = postureEvidenceValid || positionEvidenceValid ? {
    posture: postureEvidenceValid ? requestedPosture : previousPosture,
    position_label: positionEvidenceValid ? requestedPosition : previousPosition,
    end_reason: endReasonEvidenceValid ? endReasonRequested : null,
    evidence_valid: postureEvidenceValid || positionEvidenceValid
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

  return {
    state: {
      posture: posturePatch?.posture ?? prev.posture ?? 'unknown',
      position_label: posturePatch?.position_label ?? prev.position_label ?? null,
      clothing: { ...(isPlainObject(prev.clothing) ? prev.clothing : {}), ...acceptedClothing },
      updated_turn: posturePatch?.updated_turn ?? prev.updated_turn ?? turnNumber
    },
    warnings
  };
}

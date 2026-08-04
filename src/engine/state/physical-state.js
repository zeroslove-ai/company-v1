/**
 * Combines clothing + posture + location into the full scene-state patch builders for the
 * player and for a single NPC. Deactivate (or any CSA activate/update) never reaches these
 * builders with a physical-change proposal of its own — CSA transaction application and
 * physical-state application are structurally separate, exactly like donor's
 * buildCsaRuntimeStatePatch never touching npc_scene_state at all.
 */
import { retainEvidencedClothing } from './clothing.js';
import { buildPosturePatch, POSTURE_VALUES } from './posture.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Builds the next scene-state object (location/posture/clothing) for one character (player or
 * a single NPC) from the previous state plus a raw proposal + its evidence map. Every accepted
 * clothing/posture change carries forward everything else from the previous state unchanged —
 * this is what makes "scene transitions alone don't reset clothing" hold: an empty/absent
 * proposal for a field is simply not a change, never a reset to a default.
 */
export function buildSceneStatePatch({ previous = {}, proposal = null, evidenceMap = {}, narrativeText = '', characterName = '', turnNumber = null } = {}) {
  const prev = isPlainObject(previous) ? previous : {};
  const raw = isPlainObject(proposal) ? proposal : {};
  const evidence = isPlainObject(evidenceMap) ? evidenceMap : {};
  const warnings = [];

  const { clothing: acceptedClothing, rejections } = retainEvidencedClothing({
    previousClothing: prev.clothing ?? {}, proposedClothing: raw.clothing ?? {},
    evidenceMap: evidence.clothing ?? {}, narrativeText, characterName
  });
  for (const rejection of rejections) warnings.push(rejection);

  const postureProposal = POSTURE_VALUES.has(raw.posture)
    ? { posture: raw.posture, position_label: raw.position_label, end_reason: raw.posture_end_reason }
    : null;
  const posturePatch = buildPosturePatch({ previous: prev.posture ? { posture: prev.posture, position_label: prev.position_label, updated_turn: prev.updated_turn } : null, proposal: postureProposal, turnNumber });
  if (posturePatch?.rejected) warnings.push(posturePatch.rejected);

  const locationLabel = identity(raw.location_label) && evaluateLocationEvidence(evidence.location, narrativeText, characterName)
    ? raw.location_label.trim().slice(0, 60)
    : (prev.location_label ?? null);
  if (identity(raw.location_label) && !evaluateLocationEvidence(evidence.location, narrativeText, characterName) && raw.location_label !== prev.location_label) {
    warnings.push('unevidenced_location_change');
  }

  const next = {
    location_label: locationLabel,
    posture: posturePatch?.posture ?? prev.posture ?? 'unknown',
    position_label: posturePatch?.position_label ?? prev.position_label ?? null,
    clothing: { ...(prev.clothing ?? {}), ...acceptedClothing },
    updated_turn: turnNumber
  };
  return { state: next, warnings };
}

function evaluateLocationEvidence(evidence, narrativeText, characterName) {
  if (typeof evidence !== 'string' || !evidence.trim()) return false;
  const text = typeof narrativeText === 'string' ? narrativeText : '';
  if (!text.includes(evidence)) return false;
  if (typeof characterName === 'string' && characterName.trim() && !text.includes(characterName)) return false;
  return true;
}

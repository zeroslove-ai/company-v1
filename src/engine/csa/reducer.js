/**
 * Scene-execution tracking for active preset CSAs, adapted onto Company's
 * existing three-axis csa_runtime_state contract (lifecycle/applicability/
 * execution_state — see gameplay-state.js CSA_LIFECYCLE/APPLICABILITY/
 * EXECUTION_STATE, already guarded by validateCsaRuntimeStatePatch).
 *
 * Donor tracks a fourth, narrower per-csa_id status (inactive/active/paused/
 * ended) purely for "is the rule's required_action being physically
 * performed in the current scene right now" — that is Company's
 * execution_state axis. Donor's rule-level active:true/false (a completely
 * separate concept — is the rule itself still registered) is Company's
 * lifecycle axis. There is no donor equivalent of 'suspended'/'completed';
 * only 'active'/'deactivated' are ever written here, matching donor's own
 * two-state rule registration exactly.
 *
 * donor status -> execution_state: inactive/ended -> not_started, active ->
 * executed, paused -> interrupted.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const DONOR_STATUS_TO_EXECUTION_STATE = { inactive: 'not_started', active: 'executed', paused: 'interrupted', ended: 'not_started' };

function normalizeRuntimeEntry(entry = {}) {
  return {
    lifecycle: ['active', 'deactivated'].includes(entry?.lifecycle) ? entry.lifecycle : 'active',
    applicability: ['applicable', 'not_applicable', 'unknown'].includes(entry?.applicability) ? entry.applicability : 'unknown',
    execution_state: ['not_started', 'proposed', 'executed', 'refused', 'interrupted'].includes(entry?.execution_state) ? entry.execution_state : 'not_started',
    character_id: typeof entry?.character_id === 'string' && entry.character_id ? entry.character_id : null,
    started_turn: Number.isInteger(entry?.started_turn) ? entry.started_turn : null,
    last_confirmed_turn: Number.isInteger(entry?.last_confirmed_turn) ? entry.last_confirmed_turn : null,
    end_reason: typeof entry?.end_reason === 'string' && entry.end_reason ? entry.end_reason.slice(0, 100) : null
  };
}

/**
 * Builds the next csa_runtime_state patch from Extract-reported updates.
 * Never trusts an update naming a csa_id that isn't currently active-preset,
 * or a character who isn't actually present this scene. A rule that stopped
 * being an active preset (deactivated, edited to custom) is auto-marked
 * lifecycle:'deactivated' by the reducer itself, with no Extract involvement.
 */
export function buildCsaRuntimeStatePatch({ previousSave, csaRuntimeUpdates = [], activeCsa = [], npcsPresent = [], turnNumber } = {}) {
  const previous = isPlainObject(previousSave?.csa_runtime_state) ? previousSave.csa_runtime_state : {};
  const presentIds = new Set(Array.isArray(npcsPresent) ? npcsPresent.filter(id => typeof id === 'string' && id) : []);
  const activeById = new Map(activeCsa.map(item => [item.id, item]));
  const next = {};
  let changed = false;

  for (const [csaId, entry] of Object.entries(previous)) {
    const normalized = normalizeRuntimeEntry(entry);
    const stillTrackable = activeById.has(csaId) && activeById.get(csaId)?.source_type === 'preset';
    if (!stillTrackable && normalized.lifecycle !== 'deactivated') {
      next[csaId] = { ...normalized, lifecycle: 'deactivated', execution_state: 'not_started', end_reason: normalized.end_reason || '상식개변 비활성화 또는 해제' };
      changed = true;
    } else {
      next[csaId] = normalized;
    }
  }

  for (const update of (Array.isArray(csaRuntimeUpdates) ? csaRuntimeUpdates : [])) {
    if (!isPlainObject(update)) continue;
    const csaId = typeof update.csa_id === 'string' ? update.csa_id : '';
    const csa = activeById.get(csaId);
    if (!csa || csa.source_type !== 'preset') continue;
    const characterId = typeof update.character_id === 'string' ? update.character_id : '';
    if (!characterId || !presentIds.has(characterId)) continue;
    const donorStatus = ['inactive', 'active', 'paused', 'ended'].includes(update.status) ? update.status : null;
    if (!donorStatus) continue;
    const existing = previous[csaId] ? normalizeRuntimeEntry(previous[csaId]) : null;
    const executionState = DONOR_STATUS_TO_EXECUTION_STATE[donorStatus];
    next[csaId] = {
      lifecycle: 'active',
      applicability: 'applicable',
      execution_state: executionState,
      character_id: characterId,
      started_turn: executionState === 'executed' ? (existing?.started_turn ?? turnNumber) : (existing?.started_turn ?? null),
      last_confirmed_turn: turnNumber,
      end_reason: donorStatus === 'ended' ? (typeof update.reason === 'string' && update.reason.trim() ? update.reason.trim().slice(0, 100) : (existing?.end_reason ?? null)) : null
    };
    changed = true;
  }

  return changed ? next : null;
}

/**
 * Aftermath tracking for freshly-deactivated CSAs — the NPC's initial
 * shock at the norm's disappearance settles over a few encounters into
 * ordinary re-evaluation, without ever deleting the memory of what
 * happened while it was active.
 */
export function buildCsaAftereffectPatch({ previousSave, deactivatedIds = [], npcsPresent = [], turnNumber = 0 } = {}) {
  const previous = isPlainObject(previousSave?.csa_aftereffect_state) ? structuredClone(previousSave.csa_aftereffect_state) : {};
  let changed = false;
  const present = new Set((Array.isArray(npcsPresent) ? npcsPresent : []).filter(id => typeof id === 'string'));
  for (const [characterId, entries] of Object.entries(previous)) {
    if (!present.has(characterId) || !isPlainObject(entries)) continue;
    for (const [csaId, state] of Object.entries(entries)) {
      if (!isPlainObject(state) || state.phase === 'integrated') continue;
      if (state.phase === 'shock') entries[csaId] = { ...state, phase: 'processing', processed_encounters: 1, last_processed_turn: turnNumber };
      else if (state.phase === 'processing' && Number(state.processed_encounters) >= Number(state.required_processing_encounters || 1)) entries[csaId] = { ...state, phase: 'integrated', last_processed_turn: turnNumber };
      else entries[csaId] = { ...state, processed_encounters: Number(state.processed_encounters || 0) + 1, last_processed_turn: turnNumber };
      changed = true;
    }
  }

  const rules = isPlainObject(previousSave?.csa_rules) ? previousSave.csa_rules : {};
  const runtime = isPlainObject(previousSave?.csa_runtime_state) ? previousSave.csa_runtime_state : {};
  for (const csaId of deactivatedIds) {
    const csa = rules[csaId];
    const runtimeEntry = runtime[csaId];
    const characterId = runtimeEntry?.execution_state === 'executed' && typeof runtimeEntry.character_id === 'string' && runtimeEntry.character_id ? runtimeEntry.character_id : null;
    if (!csa || !characterId) continue;
    const rank = { weak: 1, medium: 2, strong: 3 }[csa.strength] || 1;
    previous[characterId] ||= {};
    previous[characterId][csaId] = {
      phase: 'shock', strength: csa.strength || 'weak', started_turn: turnNumber, last_processed_turn: turnNumber,
      processed_encounters: 0, required_processing_encounters: rank >= 3 ? 3 : rank === 2 ? 2 : 1,
      canonical_content: csa.content || ''
    };
    changed = true;
  }
  return changed ? previous : null;
}

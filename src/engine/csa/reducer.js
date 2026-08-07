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

/**
 * runtime update의 executed/active 승격은 Story evidence를 요구한다.
 * required action을 실제 수행한 quote가 storyText에 정확히 존재해야 한다.
 * (설명·질문·규정 언급만으로는 executed가 될 수 없다 — 56턴 회귀)
 */
function hasCsaExecutionEvidence(evidence, csaId, narrativeText) {
  if (typeof narrativeText !== 'string' || !narrativeText.trim()) return false;
  const entries = (evidence && typeof evidence === 'object') ? evidence : {};
  const candidates = [];
  // evidence.csa_runtime[csa_id] = { quote, changed } | "quote"
  const nested = entries.csa_runtime?.[csaId];
  if (typeof nested === 'string' && nested.trim()) candidates.push(nested.trim());
  if (nested && typeof nested === 'object' && typeof nested.quote === 'string' && nested.quote.trim()) candidates.push(nested.quote.trim());
  // evidence[csa_id] = { quote, changed } | "quote"
  const flat = entries[csaId];
  if (typeof flat === 'string' && flat.trim()) candidates.push(flat.trim());
  if (flat && typeof flat === 'object' && typeof flat.quote === 'string' && flat.quote.trim()) candidates.push(flat.quote.trim());
  return candidates.some(quote => narrativeText.includes(quote));
}

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
 *
 * Channel single-writer: csa_runtime_updates is the ONLY input that moves
 * execution_state. executed/active promotion additionally requires a
 * verbatim Story evidence quote of the required action being performed.
 * csa_trigger_evaluations is a trigger/applicability-only signal and never
 * demotes execution_state (57턴 not_satisfied → not_started 역행 금지).
 */
export function buildCsaRuntimeStatePatch({ previousSave, csaRuntimeUpdates = [], csaTriggerEvaluations = [], activeCsa = [], npcsPresent = [], turnNumber, evidence = {}, narrativeText = '' } = {}) {
  const previous = isPlainObject(previousSave?.csa_runtime_state) ? previousSave.csa_runtime_state : {};
  const presentIds = new Set(Array.isArray(npcsPresent) ? npcsPresent.filter(id => typeof id === 'string' && id) : []);
  const activeById = new Map(activeCsa.map(item => [item.id, item]));
  const next = {};
  const touchedByRuntimeUpdate = new Set();
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
    touchedByRuntimeUpdate.add(csaId);
    const existing = previous[csaId] ? normalizeRuntimeEntry(previous[csaId]) : null;
    const executionState = DONOR_STATUS_TO_EXECUTION_STATE[donorStatus];
    // executed/active 승격은 required action을 실제 수행한 Story evidence가 필요하다.
    // 설명·질문·규정 언급만으로는 executed가 될 수 없다 (56턴 회귀).
    if (executionState === 'executed' && !hasCsaExecutionEvidence(evidence, csaId, narrativeText)) {
      if (existing) {
        // evidence 없으면 기존 상태를 유지하고 덮어쓰지 않는다.
        next[csaId] = { ...existing, last_confirmed_turn: turnNumber };
        changed = true;
      }
      continue;
    }
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

  // csa_trigger_evaluations는 trigger/applicability 신호로만 취급한다.
  // execution_state를 not_started로 강등하는 경로는 제거했다 (57턴 역행 방지).
  // not_satisfied/ended가 실행 상태를 직접 바꾸지 않는다.
  for (const evaluation of (Array.isArray(csaTriggerEvaluations) ? csaTriggerEvaluations : [])) {
    if (!isPlainObject(evaluation)) continue;
    const csaId = typeof evaluation.csa_id === 'string' ? evaluation.csa_id : '';
    const csa = activeById.get(csaId);
    if (!csa || csa.source_type !== 'preset' || touchedByRuntimeUpdate.has(csaId)) continue;
    // trigger evaluation은 execution_state를 변경하지 않는다 — 무시한다.
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

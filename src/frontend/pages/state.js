import { FRONTEND_CONFIG } from './config.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const pendingKey = gameId => `company-v1:pending-action:${gameId}`;
export function resolveGameId(search = '', fallback = FRONTEND_CONFIG.defaultGameId) { const value = new URLSearchParams(search).get('game'); return value && uuid.test(value) ? value : fallback; }
export function saveFromContext(context) { return context?.save?.data ?? context?.save ?? {}; }
export function validateContext(context, editionId = FRONTEND_CONFIG.editionId) { const save = saveFromContext(context); return context?.game?.edition_id === editionId && save.edition === editionId && save.save_schema_version === 1; }
function integer(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isInteger(Number(value))) return Number(value);
  return null;
}
export function committedTurn(context) { return integer(context?.save?.committed_turn) ?? integer(saveFromContext(context)?.turn_state?.committed_turn) ?? 0; }
const validChoice = value => typeof value === 'string' && value.trim();
export function contextChoices(context) {
  const opening = context?.opening_turn?.choices;
  if (Array.isArray(opening) && opening.some(validChoice)) return opening.filter(validChoice);
  const latest = Array.isArray(context?.recent_turns) ? context.recent_turns.at(-1) : undefined;
  const committedChoices = latest?.parsed_blocks?.choices;
  return Array.isArray(committedChoices) ? committedChoices.filter(validChoice) : [];
}
export function loadPending(storage, gameId) { try { const value = JSON.parse(storage?.getItem(pendingKey(gameId)) ?? 'null'); return value?.game_id === gameId && value.action_id && value.player_action ? value : null; } catch { return null; } }

function notifyPendingStage(action) {
  if (typeof globalThis.dispatchEvent !== 'function' || typeof globalThis.CustomEvent !== 'function') return;
  globalThis.dispatchEvent(new globalThis.CustomEvent('company:pending-step', { detail: action ?? null }));
}

export function savePending(storage, action) {
  storage?.setItem(pendingKey(action.game_id), JSON.stringify(action));
  notifyPendingStage(action);
}
export function clearPending(storage, gameId) {
  storage?.removeItem(pendingKey(gameId));
  notifyPendingStage(null);
}
export function recoveryFor(status) { const step = status?.recoverable_step ?? 'unknown'; return ['resume_story', 'retry_story', 'resume_extract', 'retry_extract', 'resume_commit', 'retry_commit', 'complete', 'wait_story'].includes(step) ? step : 'unknown'; }

function legacyProgressedSave(context) {
  const save = saveFromContext(context);
  return !Object.prototype.hasOwnProperty.call(save, 'player_setup')
    && !Object.prototype.hasOwnProperty.call(save, 'opening_state')
    && committedTurn(context) > 0
    && save.npc_stats !== null
    && typeof save.npc_stats === 'object'
    && !Array.isArray(save.npc_stats);
}

/**
 * Setup/opening were added after early Company saves already had committed turns.
 * Explicit setup/opening state remains authoritative. Only a genuinely legacy
 * gameplay save — both keys absent, committed turns present, and canonical
 * pre-setup gameplay state already populated — is treated as complete. This keeps
 * the real turn-3 save playable without letting a synthetic or partially-created
 * setup state skip the turn-0 contract.
 */
export function playerSetupCompleted(context) {
  const save = saveFromContext(context);
  if (save?.player_setup?.completed === true) return true;
  return legacyProgressedSave(context);
}
export function reservedPlayerSetupId(context) {
  const setup = saveFromContext(context)?.player_setup;
  const setupId = setup?.setup_id;
  return setup?.completed !== true && typeof setupId === 'string' && setupId.trim() ? setupId : null;
}
export function openingHistoryTurn(context) {
  const projection = context?.opening_turn;
  if (!projection || typeof projection.story_text !== 'string' || !projection.story_text.trim()) return null;
  return {
    player_action: projection.player_action ?? '(opening)',
    story_text: projection.story_text,
    parsed_blocks: projection.parsed_blocks ?? null,
    turn_summary: projection.turn_summary ?? '',
    choices: Array.isArray(projection.choices) ? projection.choices : [],
    turn_number: 0,
    turn_id: projection.turn_id ?? 'opening',
    action_id: projection.action_id ?? 'opening'
  };
}
export function openingCompleted(context) {
  const save = saveFromContext(context);
  if (save?.opening_state?.status === 'complete') return true;
  return legacyProgressedSave(context);
}

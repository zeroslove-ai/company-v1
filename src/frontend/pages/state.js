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
  const saved = saveFromContext(context)?.last_choices;
  if (Array.isArray(saved) && saved.some(validChoice)) return saved.filter(validChoice);
  const latest = Array.isArray(context?.recent_turns) ? context.recent_turns.at(-1) : undefined;
  const committedChoices = Array.isArray(latest?.choices) ? latest.choices : latest?.parsed_blocks?.choices;
  return Array.isArray(committedChoices) ? committedChoices.filter(validChoice) : [];
}
export function loadPending(storage, gameId) { try { const value = JSON.parse(storage?.getItem(pendingKey(gameId)) ?? 'null'); return value?.game_id === gameId && value.action_id && value.player_action ? value : null; } catch { return null; } }
export function savePending(storage, action) { storage?.setItem(pendingKey(action.game_id), JSON.stringify(action)); }
export function clearPending(storage, gameId) { storage?.removeItem(pendingKey(gameId)); }
export function recoveryFor(status) { const step = status?.recoverable_step ?? 'unknown'; return ['retry_story', 'resume_extract', 'retry_extract', 'resume_commit', 'retry_commit', 'complete', 'wait_story'].includes(step) ? step : 'unknown'; }
export function playerSetupCompleted(context) { return saveFromContext(context)?.player_setup?.completed === true; }
export function reservedPlayerSetupId(context) {
  const setup = saveFromContext(context)?.player_setup;
  const setupId = setup?.setup_id;
  return setup?.completed !== true && typeof setupId === 'string' && setupId.trim() ? setupId : null;
}
export function openingHistoryTurn(context) {
  const opening = saveFromContext(context)?.opening_state;
  if (!opening || opening.status !== 'complete' || typeof opening.story_text !== 'string' || !opening.story_text.trim()) return null;
  return { player_action: '(오프닝)', story_text: opening.story_text, turn_summary: '', choices: Array.isArray(opening.choices) ? opening.choices : [] };
}

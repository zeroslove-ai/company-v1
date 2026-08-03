import { FRONTEND_CONFIG } from './config.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const pendingKey = gameId => `company-v1:pending-action:${gameId}`;
export function resolveGameId(search = '', fallback = FRONTEND_CONFIG.defaultGameId) { const value = new URLSearchParams(search).get('game'); return value && uuid.test(value) ? value : fallback; }
export function saveFromContext(context) { return context?.save?.data ?? context?.save ?? {}; }
export function validateContext(context, editionId = FRONTEND_CONFIG.editionId) { const save = saveFromContext(context); return context?.game?.edition_id === editionId && save.edition === editionId && save.save_schema_version === 1; }
export function committedTurn(context) { return Number(saveFromContext(context)?.turn_state?.committed_turn ?? 0); }
export function contextChoices(context) { const values = saveFromContext(context)?.last_choices; return Array.isArray(values) ? values.filter(value => typeof value === 'string' && value.trim()) : []; }
export function loadPending(storage, gameId) { try { const value = JSON.parse(storage?.getItem(pendingKey(gameId)) ?? 'null'); return value?.game_id === gameId && value.action_id && value.player_action ? value : null; } catch { return null; } }
export function savePending(storage, action) { storage?.setItem(pendingKey(action.game_id), JSON.stringify(action)); }
export function clearPending(storage, gameId) { storage?.removeItem(pendingKey(gameId)); }
export function recoveryFor(status) { const step = status?.recoverable_step ?? 'unknown'; return ['retry_story', 'resume_extract', 'retry_extract', 'resume_commit', 'retry_commit', 'complete', 'wait_story'].includes(step) ? step : 'unknown'; }

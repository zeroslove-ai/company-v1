import { createHash, randomUUID } from 'node:crypto';

export const COMMAND_KINDS = Object.freeze(['OPENING', 'FREE_ACTION']);

export function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function hashCommand(command) {
  return createHash('sha256').update(stableJson(command)).digest('hex');
}

export function createCommand({ gameId, kind, expectedStateRevision, literalAction = '', commandId = randomUUID(), createdAt = new Date().toISOString() }) {
  if (!gameId || typeof gameId !== 'string') throw new TypeError('game_id_required');
  if (!COMMAND_KINDS.includes(kind)) throw new TypeError('unsupported_command_kind');
  if (!Number.isInteger(expectedStateRevision) || expectedStateRevision < 0) throw new TypeError('expected_state_revision_invalid');
  if (kind === 'FREE_ACTION' && (typeof literalAction !== 'string' || !literalAction.trim() || literalAction.length > 2000)) {
    throw new TypeError('literal_action_invalid');
  }
  return Object.freeze({
    schema_version: 1,
    command_id: commandId,
    game_id: gameId,
    expected_state_revision: expectedStateRevision,
    kind,
    literal_action: kind === 'FREE_ACTION' ? literalAction : '',
    rule_change: null,
    created_at: createdAt
  });
}

export function parseStoryChoices(storyText) {
  const lines = String(storyText ?? '').replace(/\r/g, '').split('\n');
  let header = -1;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (/^\s*(?:\[선택지\]|선택지)\s*$/.test(lines[index])) {
      header = index;
      break;
    }
  }
  if (header < 0) return [];
  const choices = lines.slice(header + 1)
    .map(line => line.match(/^\s*([1-4])[.)、]\s*(\S.*)\s*$/))
    .filter(Boolean);
  if (choices.length !== 4 || choices.some((choice, index) => Number(choice[1]) !== index + 1)) return [];
  return choices.map(choice => choice[2].trim());
}

export function compactChoice(literal) {
  const value = String(literal ?? '').trim();
  const words = value.split(/\s+/);
  let label = '';
  for (const word of words) {
    if ((label + (label ? ' ' : '') + word).length > 6) break;
    label += (label ? ' ' : '') + word;
  }
  if (!label) label = Array.from(value).slice(0, 5).join('');
  return Array.from(label).length > 5 ? Array.from(label).slice(0, 5).join('') + '…' : label;
}

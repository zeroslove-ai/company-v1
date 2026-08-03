import { GameCoreError } from './errors.js';

const OUTCOMES = new Set(['success', 'partial', 'refused', 'interrupted', 'blocked']);
const KNOWN_FIELDS = new Set(['state_delta', 'outcome', 'evidence', 'turn_summary', 'mind_monitor', 'choices', 'dialogue_lines', 'warnings']);

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeExtractEnvelope(value) {
  if (!plainObject(value) || !plainObject(value.state_delta)) {
    throw new GameCoreError('INVALID_EXTRACT', 'Extract must contain an object state_delta');
  }
  if (!OUTCOMES.has(value.outcome)) {
    throw new GameCoreError('INVALID_EXTRACT', 'Extract outcome is invalid');
  }
  const preservedWarnings = Array.isArray(value.warnings)
    ? value.warnings.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim())
    : [];
  const warnings = [...new Set([
    ...preservedWarnings,
    ...Object.keys(value).filter(key => !KNOWN_FIELDS.has(key)).map(key => `unknown_extract_field:${key}`)
  ])];
  const choices = Array.isArray(value.choices) ? value.choices.filter(item => typeof item === 'string') : [];
  const dialogueLines = Array.isArray(value.dialogue_lines) ? value.dialogue_lines.filter(plainObject) : [];
  return {
    state_delta: value.state_delta,
    outcome: value.outcome,
    evidence: plainObject(value.evidence) ? value.evidence : {},
    turn_summary: typeof value.turn_summary === 'string' ? value.turn_summary : '',
    mind_monitor: plainObject(value.mind_monitor) ? value.mind_monitor : {},
    choices,
    dialogue_lines: dialogueLines,
    warnings
  };
}

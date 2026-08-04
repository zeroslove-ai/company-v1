/**
 * Resolves a player's numbered-choice shorthand (1-4, A-D/a-d, ①-④) back to the exact
 * previously-rendered choice text and its structured meta, so a plain "2" click/keystroke
 * submits the SAME text as clicking the rendered choice would — never a separate, looser
 * "the player typed a number" interpretation. If the input isn't one of these forms at all,
 * this resolves to null and the caller treats it as ordinary free-typed text.
 */
const DIGIT_INDEX = { '1': 0, '2': 1, '3': 2, '4': 3 };
const LETTER_INDEX = { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
const CIRCLED_INDEX = { '①': 0, '②': 1, '③': 2, '④': 3 };

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseChoiceIndex(rawInput) {
  const trimmed = typeof rawInput === 'string' ? rawInput.trim() : '';
  if (!trimmed) return null;
  if (trimmed.length === 1) {
    if (trimmed in DIGIT_INDEX) return DIGIT_INDEX[trimmed];
    if (trimmed in LETTER_INDEX) return LETTER_INDEX[trimmed];
    if (trimmed in CIRCLED_INDEX) return CIRCLED_INDEX[trimmed];
  }
  return null;
}

/**
 * Returns:
 * - null when rawInput isn't a numbered-choice form at all (caller falls through to free text)
 * - { ok: false, code: 'CHOICE_INDEX_OUT_OF_RANGE' } when it IS a numbered form but there's no
 *   such rendered choice right now (never silently executed as free text)
 * - { ok: true, choice_index, text, structured_meta } on a valid resolution
 */
export function resolveNumberedChoiceInput(rawInput, save) {
  const index = parseChoiceIndex(rawInput);
  if (index === null) return null;
  const choices = Array.isArray(save?.last_choices) ? save.last_choices : [];
  if (choices.length !== 4 || index >= choices.length || typeof choices[index] !== 'string' || !choices[index].trim()) {
    return { ok: false, code: 'CHOICE_INDEX_OUT_OF_RANGE' };
  }
  const meta = Array.isArray(save?.last_choice_meta) ? save.last_choice_meta.find(entry => isPlainObject(entry) && entry.choice_index === index) ?? null : null;
  return { ok: true, choice_index: index, text: choices[index], structured_meta: meta };
}

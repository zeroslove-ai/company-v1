/**
 * Deterministic Extract JSON repair — no LLM call. Company's llm.js already strips a
 * ```json fence and detects finish_reason==='length'; this fills the remaining gap from
 * donor's robustness contract: a balanced-brace extraction (in case the model wrapped the
 * object in stray prose before/after it) and trailing-comma removal, tried only as a fallback
 * after a direct JSON.parse fails — never silently "fixing" content that already parsed.
 */

/** Finds the first top-level {...} object in text, respecting nested braces and quoted strings, and returns just that substring (or null if unbalanced/absent). */
export function extractBalancedJsonObject(text) {
  const source = String(text ?? '');
  const start = source.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null; // never closed — unbalanced, nothing safe to extract
}

/** Removes a comma immediately before a closing } or ], outside of quoted strings. */
export function stripTrailingCommas(jsonText) {
  const source = String(jsonText ?? '');
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; result += char; continue; }
    if (char === ',') {
      let j = i + 1;
      while (j < source.length && /\s/.test(source[j])) j += 1;
      if (source[j] === '}' || source[j] === ']') continue; // drop this comma
    }
    result += char;
  }
  return result;
}

/**
 * Tries, in order: the raw text as-is; then a balanced-brace extraction; then that extraction
 * with trailing commas stripped. Returns the parsed object from the first attempt that
 * succeeds, or throws the original error from the first (raw) attempt if every repair fails —
 * the caller's existing retryable-HttpError handling is unchanged either way.
 */
export function repairAndParseExtractJson(rawText) {
  const raw = String(rawText ?? '');
  try {
    return JSON.parse(raw);
  } catch (rawError) {
    const balanced = extractBalancedJsonObject(raw);
    if (balanced) {
      try { return JSON.parse(balanced); } catch { /* fall through to comma-stripped attempt */ }
      try { return JSON.parse(stripTrailingCommas(balanced)); } catch { /* fall through */ }
    }
    try { return JSON.parse(stripTrailingCommas(raw)); } catch { /* fall through */ }
    throw rawError;
  }
}

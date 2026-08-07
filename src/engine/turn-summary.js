/**
 * Deterministic turn summary — the single writer for both
 * nextSave.story_summary_recent and game_turns.turn_summary.
 *
 * Extract's free-form turn_summary is never used as the authoritative value;
 * the summary is derived exclusively from the parsed Story's actual scene and
 * dialogue text (no new LLM call, no Extract sentence, no invented events).
 */
const MAX_SUMMARY_CHARS = 500;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clip(text) {
  const cleaned = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return Array.from(cleaned).slice(0, MAX_SUMMARY_CHARS).join('');
}

export function buildDeterministicTurnSummary(parsedStory, fallbackText = '') {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  const parts = [];
  for (const block of blocks) {
    if (!isPlainObject(block)) continue;
    if (block.type === 'scene' || block.type === 'dialogue') {
      const text = typeof block.text === 'string' ? block.text.trim() : '';
      if (text) parts.push(text);
    }
  }
  const fromBlocks = clip(parts.join(' '));
  if (fromBlocks) return fromBlocks;

  // blocks가 없으면 scene_text → 마지막 fallback으로 raw 텍스트 앞부분.
  const sceneText = typeof parsedStory?.scene_text === 'string' ? parsedStory.scene_text.trim() : '';
  if (sceneText) return clip(sceneText);
  return clip(fallbackText);
}

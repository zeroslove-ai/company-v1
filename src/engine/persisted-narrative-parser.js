import { parseFreshNarrativeV2 } from './fresh-narrative-parser.js';
import { parseNarrative } from './narrative-parser.js';

export function parsePersistedNarrative(rawText, { master } = {}) {
  const raw = String(rawText ?? '');
  // Historical section/choice/dialogue syntax must remain on the explicit
  // persisted-read adapter even though Fresh now treats unknown brackets as
  // narrative literals.
  const legacyShape = /\[(?:1\.\s*서사|2\.\s*플레이어|3\.\s*(?:플레이어|선택)|4\.\s*선택|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES)|\[DIALOGUE\s+(?:speaker|name)=/u.test(raw);
  if (legacyShape) {
    const legacy = parseNarrative(raw, { master });
    return {
      raw,
      scene_text: legacy.scene_text ?? '',
      blocks: Array.isArray(legacy.blocks) ? legacy.blocks : [],
      player_inner_thought: legacy.player_inner_thought ?? '',
      choices: Array.isArray(legacy.choices) ? legacy.choices : [],
      ...(Array.isArray(legacy.choice_labels) ? { choice_labels: legacy.choice_labels } : {}),
      dialogue_lines: Array.isArray(legacy.dialogue_lines) ? legacy.dialogue_lines : [],
      warnings: [...(Array.isArray(legacy.warnings) ? legacy.warnings : []), 'legacy_narrative_adapter_used']
    };
  }
  try {
    return parseFreshNarrativeV2(raw, { master });
  } catch (freshError) {
    const legacy = parseNarrative(raw, { master });
    return {
      raw,
      scene_text: legacy.scene_text ?? '',
      blocks: Array.isArray(legacy.blocks) ? legacy.blocks : [],
      player_inner_thought: legacy.player_inner_thought ?? '',
      choices: Array.isArray(legacy.choices) ? legacy.choices : [],
      ...(Array.isArray(legacy.choice_labels) ? { choice_labels: legacy.choice_labels } : {}),
      dialogue_lines: Array.isArray(legacy.dialogue_lines) ? legacy.dialogue_lines : [],
      warnings: [...(Array.isArray(legacy.warnings) ? legacy.warnings : []), 'legacy_narrative_adapter_used']
    };
  }
}

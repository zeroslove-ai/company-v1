import { parseFreshNarrativeV2 } from './fresh-narrative-parser.js';
import { parseNarrative } from './legacy-narrative-parser.js';

export function parsePersistedNarrative(rawText, { master } = {}) {
  try {
    return parseFreshNarrativeV2(rawText, { master });
  } catch (freshError) {
    const legacy = parseNarrative(rawText, { master });
    return {
      raw: String(rawText ?? ''),
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

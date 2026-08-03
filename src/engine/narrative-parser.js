function parseChoices(text) {
  return text
    .split(/\r?\n/)
    .map(line => /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim())
    .filter(Boolean);
}

export function parseNarrative(rawText) {
  const raw = String(rawText ?? '');
  const marker = /\[(SCENE|PLAYER_STATUS|CHOICES|DIALOGUE\s+[^\[\]]*)\]/g;
  const matches = [...raw.matchAll(marker)];
  const blocks = [];
  const warnings = [];
  let playerStatus = '';
  let choices = [];

  if (matches.length === 0) {
    return { raw, blocks: raw.trim() ? [{ type: 'unparsed', text: raw.trim() }] : [], player_status: '', choices: [], warnings: ['no_recognized_markers', 'choices_not_exactly_four'] };
  }

  const prefix = raw.slice(0, matches[0].index).trim();
  if (prefix) {
    blocks.push({ type: 'unparsed', text: prefix });
    warnings.push('unparsed_prefix');
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const start = current.index + current[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
    const text = raw.slice(start, end).trim();

    if (label === 'SCENE') {
      const malformedMarkerIndex = text.search(/\[(?:SCENE|PLAYER_STATUS|CHOICES|DIALOGUE)\b/);
      if (malformedMarkerIndex === -1) {
        if (text) blocks.push({ type: 'scene', text });
      } else {
        const sceneText = text.slice(0, malformedMarkerIndex).trim();
        const fallbackText = text.slice(malformedMarkerIndex).trim();
        if (sceneText) blocks.push({ type: 'scene', text: sceneText });
        if (fallbackText) blocks.push({ type: 'unparsed', text: fallbackText });
        warnings.push('malformed_marker_fallback');
      }
      continue;
    }
    if (label === 'PLAYER_STATUS') {
      playerStatus = text;
      continue;
    }
    if (label === 'CHOICES') {
      choices = parseChoices(text);
      if (choices.length !== 4) warnings.push('choices_not_exactly_four');
      continue;
    }

    const speaker = /speaker="([^"]+)"/.exec(label)?.[1];
    const direction = /direction="([^"]+)"/.exec(label)?.[1];
    if (!speaker || !direction) {
      blocks.push({ type: 'unparsed', text: `${current[0]}${text}`.trim() });
      warnings.push('malformed_dialogue_marker');
      continue;
    }
    blocks.push({ type: 'dialogue', speaker, direction, text });
  }

  if (choices.length !== 4 && !warnings.includes('choices_not_exactly_four')) {
    warnings.push('choices_not_exactly_four');
  }
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  return { raw, blocks, player_status: playerStatus, choices, warnings };
}

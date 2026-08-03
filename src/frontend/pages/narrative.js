function parseChoices(text) { return text.split(/\r?\n/).map(line => /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim()).filter(Boolean); }

export function parseNarrative(rawText) {
  const raw = String(rawText ?? ''); const marker = /\[(SCENE|PLAYER_STATUS|CHOICES|DIALOGUE\s+[^\[\]]*)\]/g;
  const matches = [...raw.matchAll(marker)], blocks = [], warnings = []; let player_status = '', choices = [];
  if (!matches.length) return { raw, blocks: raw.trim() ? [{ type: 'unparsed', text: raw.trim() }] : [], player_status, choices, warnings: ['no_recognized_markers', 'choices_not_exactly_four'] };
  const prefix = raw.slice(0, matches[0].index).trim(); if (prefix) { blocks.push({ type: 'unparsed', text: prefix }); warnings.push('unparsed_prefix'); }
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index], label = current[1], start = current.index + current[0].length, end = index + 1 < matches.length ? matches[index + 1].index : raw.length, text = raw.slice(start, end).trim();
    if (label === 'SCENE') { if (text) blocks.push({ type: 'scene', text }); continue; }
    if (label === 'PLAYER_STATUS') { player_status = text; continue; }
    if (label === 'CHOICES') { choices = parseChoices(text); continue; }
    const speaker = /speaker="([^"]+)"/.exec(label)?.[1], direction = /direction="([^"]+)"/.exec(label)?.[1];
    if (!speaker || !direction) { blocks.push({ type: 'unparsed', text: `${current[0]}${text}`.trim() }); warnings.push('malformed_dialogue_marker'); continue; }
    blocks.push({ type: 'dialogue', speaker, direction, text });
  }
  if (choices.length !== 4) warnings.push('choices_not_exactly_four');
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  return { raw, blocks, player_status, choices, warnings };
}

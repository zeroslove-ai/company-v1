const SECTION_LABELS = {
  SCENE: 'scene', '1': 'scene',
  PLAYER_INNER_THOUGHT: 'thought', '2': 'thought',
  PLAYER_STATUS: 'status', '3': 'status',
  CHOICES: 'choices', '4': 'choices'
};
const MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지|DIALOGUE\s+[^\[\]]*)\]/g;
const CHOICE_LABEL = /^\[([^\[\]\r\n]{2,6})\]\s*(.+)$/u;

function labelRole(label) {
  if (SECTION_LABELS[label]) return SECTION_LABELS[label];
  const number = /^(\d)\./.exec(label)?.[1];
  return number ? SECTION_LABELS[number] ?? null : null;
}

function parseChoices(text) {
  const choices = [];
  const choice_labels = [];
  for (const line of text.split(/\r?\n/)) {
    const numbered = /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim();
    if (!numbered) continue;
    const labeled = CHOICE_LABEL.exec(numbered);
    choice_labels.push(labeled?.[1]?.trim() ?? '');
    choices.push((labeled?.[2] ?? numbered).trim());
  }
  return { choices, choice_labels };
}

export function parseNarrative(rawText) {
  const raw = String(rawText ?? '');
  const matches = [...raw.matchAll(MARKER)];
  const blocks = [];
  const warnings = [];
  let player_status = '';
  let player_inner_thought = '';
  let choices = [];
  let choice_labels = [];

  if (!matches.length) {
    return {
      raw,
      blocks: raw.trim() ? [{ type: 'unparsed', text: raw.trim() }] : [],
      player_status,
      player_inner_thought,
      choices,
      warnings: ['no_recognized_markers', 'choices_not_exactly_four']
    };
  }

  const prefix = raw.slice(0, matches[0].index).trim();
  if (prefix) { blocks.push({ type: 'unparsed', text: prefix }); warnings.push('unparsed_prefix'); }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const role = labelRole(label);
    const start = current.index + current[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
    const value = raw.slice(start, end).trim();
    if (role === 'scene') { if (value) blocks.push({ type: 'scene', text: value }); continue; }
    if (role === 'thought') { player_inner_thought = value; if (value) blocks.push({ type: 'player_inner_thought', text: value }); continue; }
    if (role === 'status') { player_status = value; continue; }
    if (role === 'choices') {
      const parsed = parseChoices(value);
      choices = parsed.choices;
      choice_labels = parsed.choice_labels;
      continue;
    }
    const speaker = /speaker="([^"]+)"/.exec(label)?.[1];
    const direction = /direction="([^"]+)"/.exec(label)?.[1];
    if (!speaker || !direction) {
      blocks.push({ type: 'unparsed', text: `${current[0]}${value}`.trim() });
      warnings.push('malformed_dialogue_marker');
      continue;
    }
    blocks.push({ type: 'dialogue', speaker, direction, text: value });
  }

  if (choices.length !== 4) warnings.push('choices_not_exactly_four');
  const suppliedLabels = choice_labels.filter(Boolean);
  if (suppliedLabels.length > 0 && suppliedLabels.length !== choices.length) warnings.push('choice_labels_missing');
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  const result = { raw, blocks, player_status, player_inner_thought, choices, warnings };
  if (choice_labels.some(Boolean)) result.choice_labels = choice_labels;
  return result;
}

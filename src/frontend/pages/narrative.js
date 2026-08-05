const SECTION_LABELS = {
  SCENE: 'scene', '1': 'scene',
  PLAYER_INNER_THOUGHT: 'thought', '2': 'thought',
  PLAYER_STATUS: 'status', '3': 'status',
  CHOICES: 'choices', '4': 'choices'
};
const MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지|DIALOGUE\s+[^\[\]]*)\]/g;
const DIALOGUE_LINE = /^([\p{L}][^\n():："“”]{0,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const REGISTERED_SPEAKER_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const QUOTE_ONLY_LINE = /^["“]([^"”]+)["”]$/u;
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

function directoryEntries(speakerDirectory) {
  if (!speakerDirectory || typeof speakerDirectory !== 'object' || Array.isArray(speakerDirectory)) return [];
  return Object.entries(speakerDirectory).map(([id, value]) => ({
    id,
    name: typeof value === 'string' ? value.trim() : (typeof value?.name === 'string' ? value.name.trim() : '')
  })).filter(entry => entry.name);
}

function speakerId(name, speakerDirectory) {
  const matches = directoryEntries(speakerDirectory).filter(entry => entry.name === String(name ?? '').trim());
  return matches.length === 1 ? matches[0].id : '';
}

function lastMentionedSpeaker(value, speakerDirectory, previous = null) {
  const line = String(value ?? '');
  let selected = previous;
  let selectedIndex = -1;
  for (const entry of directoryEntries(speakerDirectory)) {
    const index = line.lastIndexOf(entry.name);
    if (index > selectedIndex) {
      selected = entry;
      selectedIndex = index;
    }
  }
  return selected;
}

function normalizedDialogue(name, direction, value, speakerDirectory, order) {
  const speaker = String(name ?? '').trim();
  const acting = String(direction ?? '').trim();
  const text = String(value ?? '').trim().replace(/^["“”']+|["“”']+$/g, '').trim();
  if (!speaker || !acting || !text) return null;
  return { speaker_id: speakerId(speaker, speakerDirectory), speaker_name: speaker, direction: acting, text, order };
}

function parseDialogueLine(rawLine, speakerDirectory, order) {
  const line = String(rawLine ?? '').trim();
  if (!line) return null;
  const canonical = DIALOGUE_LINE.exec(line);
  if (canonical) return normalizedDialogue(canonical[1], canonical[2], canonical[3] ?? canonical[4], speakerDirectory, order);
  const fallback = REGISTERED_SPEAKER_LINE.exec(line);
  if (!fallback) return null;
  const id = speakerId(fallback[1], speakerDirectory);
  if (!id) return null;
  return normalizedDialogue(fallback[1], '자연스럽게', fallback[2] ?? fallback[3], speakerDirectory, order);
}

function appendSceneBlocks(blocks, dialogueLines, value, speakerDirectory) {
  const narrative = [];
  let recentSpeaker = null;
  const flush = () => {
    const text = narrative.join('\n').trim();
    narrative.length = 0;
    if (text) blocks.push({ type: 'scene', text });
  };
  const appendDialogue = dialogue => {
    flush();
    dialogueLines.push(dialogue);
    blocks.push({
      type: 'dialogue',
      speaker_id: dialogue.speaker_id,
      speaker: dialogue.speaker_name,
      speaker_name: dialogue.speaker_name,
      direction: dialogue.direction,
      text: dialogue.text
    });
  };

  for (const rawLine of value.split(/\r?\n/)) {
    const dialogue = parseDialogueLine(rawLine, speakerDirectory, dialogueLines.length);
    if (dialogue) {
      recentSpeaker = dialogue.speaker_id ? { id: dialogue.speaker_id, name: dialogue.speaker_name } : recentSpeaker;
      appendDialogue(dialogue);
      continue;
    }

    const quote = QUOTE_ONLY_LINE.exec(rawLine.trim());
    if (quote && recentSpeaker && !/^\([^)]*\)$/.test(quote[1].trim())) {
      appendDialogue(normalizedDialogue(recentSpeaker.name, '자연스럽게', quote[1], speakerDirectory, dialogueLines.length));
      continue;
    }

    recentSpeaker = lastMentionedSpeaker(rawLine, speakerDirectory, recentSpeaker);
    narrative.push(rawLine);
  }
  flush();
}

export function parseNarrative(rawText, { speakerDirectory = {} } = {}) {
  const raw = String(rawText ?? '');
  const matches = [...raw.matchAll(MARKER)];
  const blocks = [];
  const dialogue_lines = [];
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
      dialogue_lines,
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
    if (role === 'scene') { if (value) appendSceneBlocks(blocks, dialogue_lines, value, speakerDirectory); continue; }
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
    const dialogue = normalizedDialogue(speaker, direction, value, speakerDirectory, dialogue_lines.length);
    if (!dialogue) continue;
    dialogue_lines.push(dialogue);
    blocks.push({ type: 'dialogue', speaker_id: dialogue.speaker_id, speaker, speaker_name: speaker, direction, text: dialogue.text });
  }

  if (choices.length !== 4) warnings.push('choices_not_exactly_four');
  const suppliedLabels = choice_labels.filter(Boolean);
  if (suppliedLabels.length > 0 && suppliedLabels.length !== choices.length) warnings.push('choice_labels_missing');
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  const result = { raw, blocks, player_status, player_inner_thought, choices, dialogue_lines, warnings };
  if (choice_labels.some(Boolean)) result.choice_labels = choice_labels;
  return result;
}

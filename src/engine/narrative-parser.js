const SECTION_LABELS = {
  SCENE: 'scene',
  '1': 'scene',
  PLAYER_INNER_THOUGHT: 'thought',
  '2': 'thought',
  PLAYER_STATUS: 'status',
  '3': 'status',
  CHOICES: 'choices',
  '4': 'choices'
};

const MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지|DIALOGUE\s+[^\[\]]*)\]/g;
const QUOTED_INLINE_DIALOGUE = /([\p{L}][^\n():"“”]{0,40}?)\s*\(([^()\n]{0,160})\)\s*[:：]\s*["“]([^"”]*)["”]/gsu;
const DIALOGUE_LINE = /^([\p{L}][^\n():："“”]{0,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const CHOICE_LABEL = /^\[([^\[\]\r\n]{2,6})\]\s*(.+)$/u;

function labelRole(label) {
  if (SECTION_LABELS[label]) return SECTION_LABELS[label];
  const numberMatch = /^(\d)\./.exec(label);
  if (numberMatch && SECTION_LABELS[numberMatch[1]]) return SECTION_LABELS[numberMatch[1]];
  return null;
}

function parseChoices(text) {
  const choices = [];
  const choiceLabels = [];
  for (const line of text.split(/\r?\n/)) {
    const numbered = /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim();
    if (!numbered) continue;
    const labeled = CHOICE_LABEL.exec(numbered);
    if (labeled) {
      choiceLabels.push(labeled[1].trim());
      choices.push(labeled[2].trim());
    } else {
      choiceLabels.push('');
      choices.push(numbered);
    }
  }
  return { choices, choice_labels: choiceLabels };
}

function masterCharacters(master) {
  return [
    ...(Array.isArray(master?.characters) ? master.characters : []),
    ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])
  ];
}

function resolveSpeakerId(name, master) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return null;
  const matches = masterCharacters(master).filter(character => typeof character?.name === 'string' && character.name.trim() === trimmed);
  if (matches.length !== 1) return null;
  const id = matches[0].character_id ?? matches[0].npc_id ?? matches[0].id;
  return typeof id === 'string' ? id : null;
}

function appendDialogue(lines, seen, { speakerName, direction, dialogueText }, master, orderRef) {
  const name = typeof speakerName === 'string' ? speakerName.trim() : '';
  const acting = typeof direction === 'string' ? direction.trim() : '';
  const text = typeof dialogueText === 'string' ? dialogueText.trim().replace(/^["“”']+|["“”']+$/g, '').trim() : '';
  if (!name || !acting || !text) return;
  const signature = `${name}\n${acting}\n${text}`;
  if (seen.has(signature)) return;
  seen.add(signature);
  lines.push({
    speaker_id: resolveSpeakerId(name, master),
    speaker_name: name,
    direction: acting,
    text,
    order: orderRef.value++
  });
}

function extractInlineDialogue(text, master, orderRef) {
  const lines = [];
  const seen = new Set();
  if (!text) return lines;

  for (const rawLine of text.split(/\r?\n/)) {
    const match = DIALOGUE_LINE.exec(rawLine.trim());
    if (!match) continue;
    appendDialogue(lines, seen, {
      speakerName: match[1],
      direction: match[2],
      dialogueText: match[3] ?? match[4]
    }, master, orderRef);
  }

  QUOTED_INLINE_DIALOGUE.lastIndex = 0;
  let match;
  while ((match = QUOTED_INLINE_DIALOGUE.exec(text)) !== null) {
    appendDialogue(lines, seen, {
      speakerName: match[1],
      direction: match[2],
      dialogueText: match[3]
    }, master, orderRef);
  }
  return lines;
}

export function parseNarrative(rawText, { master } = {}) {
  const raw = String(rawText ?? '');
  const matches = [...raw.matchAll(MARKER)];
  const blocks = [];
  const warnings = [];
  const dialogueLines = [];
  const orderRef = { value: 0 };
  let playerStatus = '';
  let playerInnerThought = '';
  let choices = [];
  let choiceLabels = [];
  const sceneParts = [];

  if (matches.length === 0) {
    return {
      raw,
      scene_text: '',
      blocks: raw.trim() ? [{ type: 'unparsed', text: raw.trim() }] : [],
      player_status: '',
      player_inner_thought: '',
      choices: [],
      dialogue_lines: [],
      warnings: ['no_recognized_markers', 'choices_not_exactly_four']
    };
  }

  const prefix = raw.slice(0, matches[0].index).trim();
  if (prefix) {
    blocks.push({ type: 'unparsed', text: prefix });
    warnings.push('unparsed_prefix');
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const role = labelRole(label);
    const start = current.index + current[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
    const text = raw.slice(start, end).trim();

    if (role === 'scene') {
      const malformedMarkerIndex = text.search(/\[(?:SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|DIALOGUE|\d\.\s*(?:서사\s*및\s*행동|플레이어\s*속마음|플레이어\s*상황판|선택지))\b/);
      if (malformedMarkerIndex === -1) {
        if (text) {
          blocks.push({ type: 'scene', text });
          sceneParts.push(text);
          dialogueLines.push(...extractInlineDialogue(text, master, orderRef));
        }
      } else {
        const sceneText = text.slice(0, malformedMarkerIndex).trim();
        const fallbackText = text.slice(malformedMarkerIndex).trim();
        if (sceneText) {
          blocks.push({ type: 'scene', text: sceneText });
          sceneParts.push(sceneText);
          dialogueLines.push(...extractInlineDialogue(sceneText, master, orderRef));
        }
        if (fallbackText) blocks.push({ type: 'unparsed', text: fallbackText });
        warnings.push('malformed_marker_fallback');
      }
      continue;
    }
    if (role === 'status') {
      playerStatus = text;
      continue;
    }
    if (role === 'thought') {
      playerInnerThought = text;
      if (text) blocks.push({ type: 'player_inner_thought', text });
      continue;
    }
    if (role === 'choices') {
      const parsed = parseChoices(text);
      choices = parsed.choices;
      choiceLabels = parsed.choice_labels;
      if (choices.length !== 4) warnings.push('choices_not_exactly_four');
      const suppliedLabels = choiceLabels.filter(Boolean);
      if (suppliedLabels.length > 0 && suppliedLabels.length !== choices.length) warnings.push('choice_labels_missing');
      if (new Set(suppliedLabels).size !== suppliedLabels.length) warnings.push('choice_labels_duplicated');
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
    dialogueLines.push({
      speaker_id: resolveSpeakerId(speaker, master),
      speaker_name: speaker,
      direction,
      text,
      order: orderRef.value++
    });
  }

  if (choices.length !== 4 && !warnings.includes('choices_not_exactly_four')) {
    warnings.push('choices_not_exactly_four');
  }
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  const result = {
    raw,
    scene_text: sceneParts.join('\n'),
    blocks,
    player_status: playerStatus,
    player_inner_thought: playerInnerThought,
    choices,
    dialogue_lines: dialogueLines,
    warnings
  };
  if (choiceLabels.some(Boolean)) result.choice_labels = choiceLabels;
  return result;
}

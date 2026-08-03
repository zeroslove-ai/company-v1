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

const INLINE_DIALOGUE = /([\p{L}][^\n():"“”]{0,40}?)\s*\(([^()\n]{0,160})\)\s*[:：]\s*["“]([^"”]*)["”]/gsu;

function labelRole(label) {
  if (SECTION_LABELS[label]) return SECTION_LABELS[label];
  const numberMatch = /^(\d)\./.exec(label);
  if (numberMatch && SECTION_LABELS[numberMatch[1]]) return SECTION_LABELS[numberMatch[1]];
  return null;
}

function parseChoices(text) {
  return text
    .split(/\r?\n/)
    .map(line => /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim())
    .filter(Boolean);
}

function resolveSpeakerId(name, master) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return null;
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  const matches = characters.filter(character => typeof character?.name === 'string' && character.name.trim() === trimmed);
  return matches.length === 1 && typeof matches[0].character_id === 'string' ? matches[0].character_id : null;
}

function extractInlineDialogue(text, master, orderRef) {
  const lines = [];
  if (!text) return lines;
  INLINE_DIALOGUE.lastIndex = 0;
  let match;
  while ((match = INLINE_DIALOGUE.exec(text)) !== null) {
    const speakerName = match[1].trim();
    const direction = match[2].trim();
    const dialogueText = match[3].trim();
    if (!speakerName || !dialogueText) continue;
    lines.push({
      speaker_id: resolveSpeakerId(speakerName, master),
      speaker_name: speakerName,
      direction,
      text: dialogueText,
      order: orderRef.value++
    });
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
  return {
    raw,
    scene_text: sceneParts.join('\n'),
    blocks,
    player_status: playerStatus,
    player_inner_thought: playerInnerThought,
    choices,
    dialogue_lines: dialogueLines,
    warnings
  };
}

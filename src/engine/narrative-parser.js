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
const SECTION_LINE = /^\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지)\]$/;
const QUOTED_INLINE_DIALOGUE = /([\p{L}][^\n():"“”]{0,40}?)\s*\(([^()\n]{0,160})\)\s*[:：]\s*["“]([^"”]*)["”]/gsu;
const DIALOGUE_LINE = /^([\p{L}][^\n():："“”]{0,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const REGISTERED_SPEAKER_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const QUOTE_ONLY_LINE = /^["“]([^"”]+)["”]$/u;
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

function registeredSpeakers(master) {
  return masterCharacters(master)
    .map(character => ({
      id: character?.character_id ?? character?.npc_id ?? character?.id ?? null,
      name: typeof character?.name === 'string' ? character.name.trim() : ''
    }))
    .filter(character => character.id && character.name);
}

function shortAlias(name) {
  const characters = Array.from(String(name ?? '').trim());
  if (characters.length !== 3 || !characters.every(character => /[가-힣]/u.test(character))) return '';
  return characters.slice(1).join('');
}

function resolveRegisteredSpeaker(name, master) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return null;
  const speakers = registeredSpeakers(master);
  const exact = speakers.filter(character => character.name === trimmed);
  if (exact.length === 1) return exact[0];
  const alias = shortAlias(trimmed) || trimmed;
  const aliasMatches = speakers.filter(character => shortAlias(character.name) === alias);
  return aliasMatches.length === 1 ? aliasMatches[0] : null;
}

function resolveSpeakerId(name, master) {
  return resolveRegisteredSpeaker(name, master)?.id ?? null;
}

function lastMentionedSpeaker(line, speakers, previous = null) {
  const value = String(line ?? '');
  let selected = previous;
  let selectedIndex = -1;
  const aliasOwners = new Map();
  for (const speaker of speakers) {
    const alias = shortAlias(speaker.name);
    if (!alias) continue;
    const owners = aliasOwners.get(alias) ?? [];
    owners.push(speaker);
    aliasOwners.set(alias, owners);
  }
  for (const speaker of speakers) {
    const exactIndex = value.lastIndexOf(speaker.name);
    if (exactIndex > selectedIndex) {
      selected = speaker;
      selectedIndex = exactIndex;
    }
    const alias = shortAlias(speaker.name);
    if (!alias || aliasOwners.get(alias)?.length !== 1) continue;
    const aliasIndex = value.lastIndexOf(alias);
    if (aliasIndex > selectedIndex) {
      selected = speaker;
      selectedIndex = aliasIndex;
    }
  }
  return selected;
}

function isInternalQuotedThought(value) {
  const text = String(value ?? '').trim();
  return /^\([^)]*\)$/.test(text);
}

/**
 * Actual production Story rows sometimes contain only “대사” even though the
 * prompt asks for a speaker. Recover those lines only when the preceding scene
 * prose names one uniquely registered character, including a unique Korean
 * given-name reference such as “민아” -> “윤민아”.
 */
export function normalizeQuoteOnlyDialogue(rawText, { master } = {}) {
  const source = String(rawText ?? '');
  const speakers = registeredSpeakers(master);
  if (!source || !speakers.length) return source;

  let role = null;
  let recentSpeaker = null;
  const output = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    const section = SECTION_LINE.exec(trimmed);
    if (section) {
      role = labelRole(section[1]);
      recentSpeaker = null;
      output.push(rawLine);
      continue;
    }
    if (role !== 'scene') {
      output.push(rawLine);
      continue;
    }

    const canonical = DIALOGUE_LINE.exec(trimmed);
    if (canonical) {
      const resolved = resolveRegisteredSpeaker(canonical[1], master);
      if (resolved) recentSpeaker = resolved;
      output.push(rawLine);
      continue;
    }
    const named = REGISTERED_SPEAKER_LINE.exec(trimmed);
    if (named) {
      const resolved = resolveRegisteredSpeaker(named[1], master);
      if (resolved) recentSpeaker = resolved;
      output.push(rawLine);
      continue;
    }

    const quote = QUOTE_ONLY_LINE.exec(trimmed);
    if (quote && recentSpeaker && !isInternalQuotedThought(quote[1])) {
      const indent = rawLine.slice(0, rawLine.indexOf(trimmed));
      output.push(`${indent}${recentSpeaker.name} (자연스럽게): “${quote[1].trim()}”`);
      continue;
    }

    recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
    output.push(rawLine);
  }
  return output.join('\n');
}

function normalizedDialogue({ speakerName, direction, dialogueText }, master, order) {
  const suppliedName = typeof speakerName === 'string' ? speakerName.trim() : '';
  const resolved = resolveRegisteredSpeaker(suppliedName, master);
  const name = resolved?.name ?? suppliedName;
  const acting = typeof direction === 'string' ? direction.trim() : '';
  const text = typeof dialogueText === 'string' ? dialogueText.trim().replace(/^["“”']+|["“”']+$/g, '').trim() : '';
  if (!name || !acting || !text) return null;
  return {
    speaker_id: resolved?.id ?? null,
    speaker_name: name,
    direction: acting,
    text,
    order
  };
}

function parseDialogueLine(rawLine, master, order) {
  const line = typeof rawLine === 'string' ? rawLine.trim() : '';
  if (!line) return null;
  const canonical = DIALOGUE_LINE.exec(line);
  if (canonical) {
    return normalizedDialogue({
      speakerName: canonical[1],
      direction: canonical[2],
      dialogueText: canonical[3] ?? canonical[4]
    }, master, order);
  }
  const fallback = REGISTERED_SPEAKER_LINE.exec(line);
  if (!fallback) return null;
  const speakerName = fallback[1].trim();
  if (!resolveSpeakerId(speakerName, master)) return null;
  return normalizedDialogue({
    speakerName,
    direction: '자연스럽게',
    dialogueText: fallback[2] ?? fallback[3]
  }, master, order);
}

function appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef) {
  const narrativeLines = [];
  const signatures = new Set();
  const flushNarrative = () => {
    const value = narrativeLines.join('\n').trim();
    narrativeLines.length = 0;
    if (value) blocks.push({ type: 'scene', text: value });
  };
  const appendLine = line => {
    const signature = `${line.speaker_name}\n${line.direction}\n${line.text}`;
    if (signatures.has(signature)) return;
    signatures.add(signature);
    dialogueLines.push(line);
    blocks.push({
      type: 'dialogue',
      speaker_id: line.speaker_id,
      speaker: line.speaker_name,
      speaker_name: line.speaker_name,
      direction: line.direction,
      text: line.text
    });
  };

  for (const rawLine of sceneText.split(/\r?\n/)) {
    const dialogue = parseDialogueLine(rawLine, master, orderRef.value);
    if (!dialogue) {
      narrativeLines.push(rawLine);
      continue;
    }
    flushNarrative();
    orderRef.value += 1;
    appendLine(dialogue);
  }
  flushNarrative();

  QUOTED_INLINE_DIALOGUE.lastIndex = 0;
  let match;
  while ((match = QUOTED_INLINE_DIALOGUE.exec(sceneText)) !== null) {
    const dialogue = normalizedDialogue({
      speakerName: match[1],
      direction: match[2],
      dialogueText: match[3]
    }, master, orderRef.value);
    if (!dialogue) continue;
    const signature = `${dialogue.speaker_name}\n${dialogue.direction}\n${dialogue.text}`;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    dialogueLines.push(dialogue);
    orderRef.value += 1;
  }
}

export function parseNarrative(rawText, { master } = {}) {
  const originalRaw = String(rawText ?? '');
  const normalizedRaw = normalizeQuoteOnlyDialogue(originalRaw, { master });
  const raw = normalizedRaw;
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
      raw: originalRaw,
      normalized_raw: normalizedRaw,
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
          sceneParts.push(text);
          appendSceneBlocks(blocks, dialogueLines, text, master, orderRef);
        }
      } else {
        const sceneText = text.slice(0, malformedMarkerIndex).trim();
        const fallbackText = text.slice(malformedMarkerIndex).trim();
        if (sceneText) {
          sceneParts.push(sceneText);
          appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef);
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
    const dialogue = normalizedDialogue({ speakerName: speaker, direction, dialogueText: text }, master, orderRef.value++);
    if (!dialogue) continue;
    blocks.push({ type: 'dialogue', speaker_id: dialogue.speaker_id, speaker: dialogue.speaker_name, speaker_name: dialogue.speaker_name, direction, text: dialogue.text });
    dialogueLines.push(dialogue);
  }

  if (choices.length !== 4 && !warnings.includes('choices_not_exactly_four')) {
    warnings.push('choices_not_exactly_four');
  }
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  const result = {
    raw: originalRaw,
    normalized_raw: normalizedRaw,
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

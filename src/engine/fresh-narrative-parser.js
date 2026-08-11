import { GameCoreError } from './errors.js';

const SECTION_1 = '[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]';
const SECTION_2 = '[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]';
const SECTION_3 = '[3. \uC120\uD0DD\uC9C0]';
const SECTION_HEADERS = [SECTION_1, SECTION_2, SECTION_3];

function fail(message) {
  throw new GameCoreError('STORY_PROTOCOL_INVALID', message);
}

function entries(value, idField) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).map(([id, item]) => ({ [idField]: id, ...(item && typeof item === 'object' ? item : {}) }));
}

function speakerDirectory(master = {}) {
  const directory = new Map([['player', '\uD50C\uB808\uC774\uC5B4']]);
  for (const item of entries(master.characters, 'character_id')) {
    const id = item?.character_id ?? item?.id;
    if (typeof id === 'string' && id.trim()) directory.set(id, String(item.name ?? id));
  }
  for (const item of entries(master.general_npcs, 'npc_id')) {
    const id = item?.npc_id ?? item?.id;
    if (typeof id === 'string' && id.trim()) directory.set(id, String(item.name ?? id));
  }
  return directory;
}

function splitSections(raw) {
  const lines = raw.split(/\r?\n/);
  const found = [];
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (SECTION_HEADERS.includes(trimmed)) found.push({ header: trimmed, index });
  }
  if (found.length !== 3 || found.some((item, index) => item.header !== SECTION_HEADERS[index])) {
    fail('Story must contain the three canonical sections in order');
  }
  if (found.some((item, index) => found.findIndex(other => other.header === item.header) !== index)) {
    fail('Story contains duplicate protocol sections');
  }
  const first = found[0].index;
  if (lines.slice(0, first).some(line => line.trim())) fail('Unexpected text before the Story protocol');
  const sections = {};
  for (let index = 0; index < found.length; index += 1) {
    const start = found[index].index + 1;
    const end = index + 1 < found.length ? found[index + 1].index : lines.length;
    sections[found[index].header] = lines.slice(start, end).join('\n');
  }
  return sections;
}

function parseStorySection(text, directory) {
  const lines = text.split(/\r?\n/);
  const marker = /^(?:\[SCENE\]|\[DIALOGUE speaker_id="([^"]+)" acting_direction="([^"]+)"\])$/;
  const blocks = [];
  const dialogueLines = [];
  const sceneParts = [];
  let current = null;
  let sawMarker = false;
  const flush = () => {
    if (!current) return;
    const body = current.lines.join('\n').trim();
    if (!body) fail('Scene or dialogue block must contain text');
    if (current.type === 'scene') {
      sceneParts.push(body);
      blocks.push({ type: 'scene', text: body });
    } else {
      const line = {
        speaker_id: current.speakerId,
        speaker: directory.get(current.speakerId),
        speaker_name: directory.get(current.speakerId),
        direction: current.direction,
        acting_direction: current.direction,
        text: body,
        order: dialogueLines.length
      };
      dialogueLines.push(line);
      blocks.push({ type: 'dialogue', speaker_id: line.speaker_id, speaker: line.speaker_name, speaker_name: line.speaker_name, direction: line.direction, acting_direction: line.acting_direction, text: line.text });
    }
    current = null;
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const match = marker.exec(trimmed);
    if (match) {
      flush();
      sawMarker = true;
      if (trimmed === '[SCENE]') {
        current = { type: 'scene', lines: [] };
      } else {
        const speakerId = match[1];
        const direction = match[2].trim();
        if (!directory.has(speakerId)) fail(`Unknown Story speaker_id: ${speakerId}`);
        if (!direction) fail('DIALOGUE acting_direction must be non-empty');
        current = { type: 'dialogue', speakerId, direction, lines: [] };
      }
      continue;
    }
    if (/^\[[^\]]*\]/.test(trimmed)) fail(`Unknown or malformed Story marker: ${trimmed}`);
    if (!sawMarker && trimmed) fail('Story text must begin with [SCENE] or [DIALOGUE]');
    if (current) current.lines.push(line);
    else if (trimmed) fail('Unexpected Story text outside a block');
  }
  flush();
  if (!blocks.length || !blocks.some(block => block.type === 'scene')) fail('Story section requires a [SCENE] block');
  return { blocks, dialogueLines, sceneText: sceneParts.join('\n') };
}

function parseThought(text) {
  const value = text.trim();
  if (!value) fail('Player inner thought must be non-empty');
  if (/^(?:["“”'‘’]).*(?:["“”'‘’])$/.test(value)) fail('Player inner thought must not be quote-wrapped');
  return value;
}

function parseChoices(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length !== 4) fail('Story must contain exactly four choices');
  const choices = [];
  const labels = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\d+)\.\s+\[([^\[\]\r\n]{2,6})\]\s+(.+?)\s*$/.exec(lines[index].trim());
    if (!match || Number(match[1]) !== index + 1 || !match[2].trim() || !match[3].trim()) fail('Malformed Story choice');
    const label = match[2].trim();
    if (label.length < 2 || label.length > 6) fail('Story choice labels must be 2 to 6 characters');
    if (labels.includes(label)) fail('Story choice labels must be distinct');
    labels.push(label);
    choices.push(match[3].trim());
  }
  return { choices, labels };
}

export function parseFreshNarrativeV2(rawText, { master } = {}) {
  const raw = String(rawText ?? '');
  const sections = splitSections(raw);
  const directory = speakerDirectory(master);
  const story = parseStorySection(sections[SECTION_1], directory);
  const playerInnerThought = parseThought(sections[SECTION_2]);
  const choiceResult = parseChoices(sections[SECTION_3]);
  const blocks = [
    ...story.blocks,
    { type: 'player_inner_thought', text: playerInnerThought }
  ];
  return {
    raw,
    scene_text: story.sceneText,
    blocks,
    player_inner_thought: playerInnerThought,
    choices: choiceResult.choices,
    choice_labels: choiceResult.labels,
    dialogue_lines: story.dialogueLines,
    warnings: []
  };
}

export { SECTION_1, SECTION_2, SECTION_3 };

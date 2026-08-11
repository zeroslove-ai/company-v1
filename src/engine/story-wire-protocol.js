import { GameCoreError } from './errors.js';

export const STORY_BLOCK_TYPES = Object.freeze(['scene', 'dialogue', 'thought', 'choice']);

function protocolError(message) {
  return new GameCoreError('STORY_PROTOCOL_INVALID', message);
}

function entries(value, idField) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).map(([id, item]) => ({
    [idField]: id,
    ...(item && typeof item === 'object' ? item : {})
  }));
}

export function buildStoryIdentityDirectory(master = {}) {
  const directory = new Map([['player', '플레이어']]);
  const identities = Array.isArray(master?.registered_identities) ? master.registered_identities : [];
  for (const item of identities) {
    if (typeof item?.id === 'string' && item.id.trim()) directory.set(item.id, String(item.name ?? item.id));
  }
  for (const item of entries(master?.characters, 'character_id')) {
    const id = item?.character_id ?? item?.id;
    if (typeof id === 'string' && id.trim()) directory.set(id, String(item.name ?? id));
  }
  for (const item of entries(master?.general_npcs ?? master?.generalNpcs, 'npc_id')) {
    const id = item?.npc_id ?? item?.id;
    if (typeof id === 'string' && id.trim()) directory.set(id, String(item.name ?? id));
  }
  return directory;
}

function parseQuotedAttributes(source, allowed) {
  const attributes = {};
  let rest = source.trim();
  while (rest) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]*)"(?:\s+|$)/.exec(rest);
    if (!match) throw protocolError('Malformed Story marker attributes');
    const [, name, value] = match;
    if (!allowed.has(name)) throw protocolError(`Unknown Story marker attribute: ${name}`);
    if (Object.prototype.hasOwnProperty.call(attributes, name)) throw protocolError(`Duplicate Story marker attribute: ${name}`);
    if (!value.trim()) throw protocolError(`${name} must be non-empty`);
    attributes[name] = value;
    rest = rest.slice(match[0].length).trimStart();
  }
  return attributes;
}

/** Parse a single semantic control marker at the beginning of input. */
export function parseStoryControlMarker(input, { directory = null } = {}) {
  const value = String(input ?? '');
  const leading = /^(\s*)/.exec(value)?.[1] ?? '';
  const source = value.slice(leading.length);
  if (!source.startsWith('[')) return null;
  const close = source.indexOf(']');
  if (close < 0) return { incomplete: true, prefix: source };
  const token = source.slice(0, close + 1);
  const remainder = source.slice(close + 1);
  const simple = new Map([
    ['[SCENE]', { type: 'block_start', block_type: 'scene' }],
    ['[/SCENE]', { type: 'block_end', block_type: 'scene' }],
    ['[ACTING]', { type: 'acting' }],
    ['[/ACTING]', { type: 'acting_end' }],
    ['[THOUGHT]', { type: 'block_start', block_type: 'thought' }],
    ['[/THOUGHT]', { type: 'block_end', block_type: 'thought' }],
    ['[/CHOICE]', { type: 'block_end', block_type: 'choice' }]
  ]);
  if (simple.has(token)) return { ...simple.get(token), raw: token, remainder, leadingWhitespace: leading, end: leading.length + close + 1 };
  if (token === '[/DIALOGUE]') return { type: 'block_end', block_type: 'dialogue', raw: token, remainder, leadingWhitespace: leading, end: leading.length + close + 1 };
  if (source.startsWith('[DIALOGUE')) {
    if (!/^\[DIALOGUE(?:\s|\])/.test(token)) throw protocolError('Malformed DIALOGUE marker');
    const attributes = parseQuotedAttributes(token.slice('[DIALOGUE'.length, -1), new Set(['speaker_id']));
    if (!attributes.speaker_id) throw protocolError('DIALOGUE requires speaker_id');
    if (directory && !directory.has(attributes.speaker_id)) throw protocolError(`Unknown Story speaker_id: ${attributes.speaker_id}`);
    return { type: 'block_start', block_type: 'dialogue', raw: token, remainder, speaker_id: attributes.speaker_id, acting_direction: null, leadingWhitespace: leading, end: leading.length + close + 1 };
  }
  if (source.startsWith('[CHOICE')) {
    if (!/^\[CHOICE(?:\s|\])/.test(token)) throw protocolError('Malformed CHOICE marker');
    const attributes = parseQuotedAttributes(token.slice('[CHOICE'.length, -1), new Set(['label']));
    return { type: 'block_start', block_type: 'choice', raw: token, remainder, label: attributes.label ?? null, leadingWhitespace: leading, end: leading.length + close + 1 };
  }
  return { invalid: true, raw: token, remainder, leadingWhitespace: leading, end: leading.length + close + 1 };
}

function knownPrefix(value) {
  return ['[SCENE]', '[/SCENE]', '[/DIALOGUE]', '[ACTING]', '[/ACTING]', '[THOUGHT]', '[/THOUGHT]', '[/CHOICE]', '[DIALOGUE', '[CHOICE'].some(prefix => prefix.startsWith(value) || value.startsWith(prefix));
}

function visibleRemainder(value) { return String(value ?? '').replace(/^[ \t]+/, ''); }

/** Incremental semantic decoder. It buffers only a possible control marker. */
export function createStoryStreamDecoder({ registeredIdentities = null, master = null } = {}) {
  const directory = registeredIdentities instanceof Map
    ? registeredIdentities
    : buildStoryIdentityDirectory(master ?? { registered_identities: registeredIdentities });
  let candidate = '';
  let candidateLineStart = false;
  let lineStart = true;
  let afterMarker = false;
  let finished = false;
  let activeDialogue = false;
  let activeBlockType = null;
  let awaitingActing = false;
  let actingBuffer = '';
  let canAttachActing = false;

  const emitText = (events, text) => {
    if (!text) return;
    events.push({ type: 'text_delta', text });
    lineStart = text.endsWith('\n');
  };
  const controlEvents = (marker, events) => {
    if (marker.type === 'block_start') {
      if (activeBlockType) events.push({ type: 'block_end', block_type: activeBlockType, implicit: true });
      activeDialogue = marker.block_type === 'dialogue';
      activeBlockType = marker.block_type;
      canAttachActing = marker.block_type === 'dialogue';
      const data = { type: 'block_start', block_type: marker.block_type };
      if (marker.block_type === 'dialogue') {
        activeDialogue = true;
        data.speaker_id = marker.speaker_id;
        data.speaker_name = directory.get(marker.speaker_id);
        data.acting_direction = null;
      } else if (marker.block_type === 'choice') data.label = marker.label;
      events.push(data);
    } else if (marker.type === 'block_end') {
      if (!activeBlockType) return;
      if (activeBlockType !== marker.block_type) {
        events.push({ type: 'block_end', block_type: activeBlockType, implicit: true });
      } else events.push({ type: 'block_end', block_type: marker.block_type });
      activeDialogue = false;
      canAttachActing = marker.block_type === 'dialogue';
      activeBlockType = null;
    } else if (marker.type === 'acting') {
      if (!activeDialogue && !canAttachActing) throw protocolError('ACTING must follow DIALOGUE');
      const direction = visibleRemainder(marker.remainder).split(/\r?\n/, 1)[0];
      if (direction && !direction.startsWith('[')) events.push({ type: 'acting', acting_direction: direction });
      else awaitingActing = true;
    } else if (marker.type === 'acting_end') {
      return;
    }
  };
  const consume = events => {
    const marker = parseStoryControlMarker(candidate, { directory });
    if (!marker || marker.incomplete) return false;
    if (marker.invalid) throw protocolError(`Unknown or malformed Story marker: ${marker.raw}`);
    controlEvents(marker, events);
    candidate = '';
    lineStart = false;
    afterMarker = true;
    const remainder = marker.type === 'acting'
      ? visibleRemainder(marker.remainder).replace(/^[^\r\n]*(?:\r?\n|$)/, '')
      : visibleRemainder(marker.remainder);
    if (remainder) {
      afterMarker = false;
      const nextControl = remainder.search(/\[(?:\/?SCENE|\/?DIALOGUE|\/?ACTING|\/?THOUGHT|\/?CHOICE)(?:\s|\]|\/)/);
      if (nextControl >= 0) {
        if (nextControl > 0) emitText(events, remainder.slice(0, nextControl));
        candidate = remainder.slice(nextControl);
        candidateLineStart = false;
        consume(events);
      } else emitText(events, remainder);
    }
    return true;
  };
  function push(chunk) {
    if (finished) throw protocolError('Story stream decoder already finished');
    const input = String(chunk ?? '');
    const events = [];
    let visible = '';
    const flush = () => { if (visible) { emitText(events, visible); visible = ''; } };
    let index = 0;
    while (index < input.length) {
      const character = input[index];
      if (awaitingActing) {
        if (character === '[') {
          const direction = actingBuffer.trim();
          if (direction) events.push({ type: 'acting', acting_direction: direction });
          actingBuffer = ''; awaitingActing = false; afterMarker = false;
          continue;
        }
        if (character === '\n') {
          const direction = actingBuffer.trim();
          if (direction && !direction.startsWith('[')) events.push({ type: 'acting', acting_direction: direction });
          actingBuffer = ''; awaitingActing = false; afterMarker = false; lineStart = true; index += 1; continue;
        }
        actingBuffer += character; index += 1; continue;
      }
      if (candidate) {
        candidate += character; index += 1;
        if (character === ']') {
          flush();
          if (knownPrefix(candidate) || candidateLineStart) consume(events);
          else { visible += candidate; candidate = ''; afterMarker = false; lineStart = false; }
        } else if (candidate.length > 512 || (!knownPrefix(candidate) && !candidate.startsWith('[D'))) {
          visible += candidate; candidate = ''; afterMarker = false; lineStart = false;
        }
        continue;
      }
      if (afterMarker && (character === ' ' || character === '\t')) { index += 1; continue; }
      if (afterMarker && character === '\n') { afterMarker = false; lineStart = true; index += 1; continue; }
      if (afterMarker && character === '[') { afterMarker = false; candidate = '['; candidateLineStart = false; lineStart = false; index += 1; continue; }
      if (afterMarker) afterMarker = false;
      if (character === '[') { candidate = '['; candidateLineStart = lineStart; lineStart = false; index += 1; continue; }
      visible += character; lineStart = character === '\n'; index += 1;
    }
    flush();
    return events;
  }
  function finish() {
    if (finished) return [];
    finished = true;
    const events = [];
    if (awaitingActing) {
      const direction = actingBuffer.trim();
      if (direction && !direction.startsWith('[')) events.push({ type: 'acting', acting_direction: direction });
      actingBuffer = ''; awaitingActing = false;
    }
    if (candidate && knownPrefix(candidate)) throw protocolError('Incomplete Story control marker');
    if (candidate) emitText(events, candidate);
    return events;
  }
  return { push, finish };
}

export function normalizeMarkerRemainder(value) { return visibleRemainder(value); }

import { GameCoreError } from './errors.js';
import { buildStoryIdentityDirectory, parseStoryControlMarker } from './story-wire-protocol.js';

function fail(message) { throw new GameCoreError('STORY_PROTOCOL_INVALID', message); }

function normalizeProjectionText(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]*\n{2,}/g, '\n\n')
    .trim();
}

function knownMarkerStart(value) {
  return ['[SCENE', '[/SCENE', '[DIALOGUE', '[/DIALOGUE', '[ACTING', '[/ACTING', '[THOUGHT', '[/THOUGHT', '[CHOICE', '[/CHOICE']
    .some(prefix => String(value ?? '').startsWith(prefix));
}

function tokenize(raw, directory) {
  const tokens = [];
  let text = '';
  const flushText = () => { if (text) { tokens.push({ type: 'text', value: text }); text = ''; } };
  const value = String(raw ?? '');
  for (let index = 0; index < value.length;) {
    if (value[index] !== '[') { text += value[index++]; continue; }
    const slice = value.slice(index);
    const marker = parseStoryControlMarker(slice, { directory });
    if (!marker) { text += value[index++]; continue; }
    if (marker.incomplete) {
      if (knownMarkerStart(slice)) fail('Incomplete Story control marker');
      text += value[index++];
      continue;
    }
    if (marker.invalid) {
      // Unknown bracket literals are ordinary narrative, not control syntax.
      text += marker.raw;
      index += marker.end;
      continue;
    }
    flushText();
    tokens.push({ type: 'marker', marker });
    index += marker.end;
  }
  flushText();
  return tokens;
}

export function parseFreshNarrativeV2(rawText, { master } = {}) {
  const raw = String(rawText ?? '');
  const directory = buildStoryIdentityDirectory(master);
  const blocks = [];
  const dialogueLines = [];
  const warnings = [];
  const choices = [];
  let current = null;
  let thoughtCount = 0;
  let lastDialogue = null;
  let canAttachActing = false;

  const projectActing = (target, direction) => {
    if (!target || !direction) return;
    target.acting_direction = direction;
    target.direction = direction;
    const projected = blocks.find(block => block.type === 'dialogue' && block.order === target.order);
    if (projected) {
      projected.acting_direction = direction;
      projected.direction = direction;
    }
  };

  const flush = () => {
    if (!current) return;
    const text = normalizeProjectionText(current.lines.join('\n'));
    if (!text && (current.type === 'dialogue' || current.type === 'scene')) fail(`${current.type} block must contain text`);
    if (current.type === 'narrative') {
      if (text) {
        const prior = blocks.at(-1);
        if (prior?.type === 'narrative') prior.text = normalizeProjectionText(`${prior.text}\n${text}`);
        else blocks.push({ type: 'narrative', text });
      }
    } else if (current.type === 'dialogue') {
      const item = {
        speaker_id: current.speaker_id,
        speaker: directory.get(current.speaker_id),
        speaker_name: directory.get(current.speaker_id),
        direction: current.acting_direction,
        acting_direction: current.acting_direction,
        text,
        order: dialogueLines.length
      };
      dialogueLines.push(item);
      blocks.push({ type: 'dialogue', ...item });
      lastDialogue = item;
      canAttachActing = true;
    } else if (current.type === 'scene') {
      blocks.push({ type: 'scene', text });
      canAttachActing = false;
    } else if (current.type === 'thought') {
      thoughtCount += 1;
      blocks.push({ type: 'player_inner_thought', text });
      canAttachActing = false;
    } else if (current.type === 'choice') {
      choices.push(text);
      blocks.push({ type: 'choice', text });
      canAttachActing = false;
    }
    current = null;
  };

  const appendText = value => {
    if (!value) return;
    if (current?.type === 'dialogue') {
      const paragraph = /\r?\n[ \t]*\r?\n/.exec(value);
      if (paragraph) {
        const before = value.slice(0, paragraph.index);
        const after = value.slice(paragraph.index + paragraph[0].length);
        if (before) current.lines.push(before);
        flush();
        if (after) appendText(after);
        return;
      }
    }
    if (!current) {
      if (value.trim()) current = { type: 'narrative', lines: [] };
      else return;
    }
    current.lines.push(value);
  };

  const tokens = tokenize(raw, directory);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'text') { appendText(token.value); continue; }
    const marker = token.marker;
    if (marker.type === 'acting') {
      const target = current?.type === 'dialogue' ? current : (canAttachActing ? lastDialogue : null);
      if (!target) warnings.push('acting_without_dialogue');
      const next = tokens[index + 1]?.type === 'text' ? tokens[index + 1].value : '';
      const directionSource = next.replace(/^[ \t]*(?:\r?\n)?/, '');
      const direction = directionSource.split(/\r?\n/, 1)[0].replace(/^[ \t]+/, '').trim();
      if (direction && !direction.startsWith('[')) {
        if (target?.acting_direction !== null) warnings.push('dialogue_acting_duplicate');
        else projectActing(target, direction);
        if (tokens[index + 1]?.type === 'text') {
          const remainder = directionSource.replace(/^[^\r\n]*(?:\r?\n|$)/, '');
          if (remainder) tokens[index + 1].value = remainder;
          else tokens.splice(index + 1, 1);
        }
      }
      continue;
    }
    if (marker.type === 'acting_end') continue;
    if (marker.type === 'block_end') {
      if (current) flush();
      canAttachActing = marker.block_type === 'dialogue';
      continue;
    }
    if (marker.type !== 'block_start') fail('Unexpected Story control marker');
    flush();
    current = { type: marker.block_type, speaker_id: marker.speaker_id, acting_direction: null, lines: [] };
    canAttachActing = marker.block_type === 'dialogue';
  }
  flush();

  const hasBody = blocks.some(block => ['scene', 'narrative', 'dialogue'].includes(block.type) && String(block.text ?? '').trim());
  if (!hasBody) fail('Story body is missing');
  if (!blocks.some(block => block.type === 'player_inner_thought' && String(block.text ?? '').trim())) warnings.push('player_inner_thought_missing');
  if (thoughtCount > 1) warnings.push('player_inner_thought_duplicate');
  if (choices.length !== 4) warnings.push('choices_not_exactly_four');
  if (choices.some(choice => !String(choice ?? '').trim())) warnings.push('choices_empty');
  const nonEmptyChoices = choices.map(choice => String(choice ?? '').trim()).filter(Boolean);
  if (new Set(nonEmptyChoices).size !== nonEmptyChoices.length) warnings.push('choices_exact_duplicate');
  const canonicalChoices = choices.length === 4
    && choices.every(choice => typeof choice === 'string' && choice.trim())
    && new Set(choices.map(choice => choice.trim())).size === 4
    ? choices.slice()
    : [];
  return {
    raw,
    scene_text: blocks.filter(block => block.type === 'scene' || block.type === 'narrative').map(block => block.text).join('\n'),
    blocks,
    player_inner_thought: blocks.filter(block => block.type === 'player_inner_thought').at(-1)?.text ?? '',
    choices,
    canonical_choices: canonicalChoices,
    dialogue_lines: dialogueLines,
    warnings
  };
}

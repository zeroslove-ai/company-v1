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
  const actingEvents = [];
  const warnings = [];
  const choices = [];
  let current = null;
  let thoughtCount = 0;
  const flush = () => {
    if (!current) return;
    const text = normalizeProjectionText(current.lines.join('\n'));
    if (!text) {
      if (current.type === 'dialogue' || current.type === 'scene') {
        warnings.push(`empty_${current.type}_dropped`);
        current = null;
        return;
      }
      if (current.type === 'acting') {
        warnings.push('empty_acting_dropped');
        current = null;
        return;
      }
    }
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
    } else if (current.type === 'acting') {
      if (!text) fail('ACTING block must contain text');
      const item = {
        type: 'acting',
        text,
        order: blocks.length
      };
      blocks.push(item);
      actingEvents.push({ ...item });
    } else if (current.type === 'scene') {
      blocks.push({ type: 'scene', text });
    } else if (current.type === 'thought') {
      thoughtCount += 1;
      if (thoughtCount === 1) blocks.push({ type: 'player_inner_thought', text });
    } else if (current.type === 'choice') {
      choices.push(text);
      blocks.push({ type: 'choice', text });
    }
    current = null;
  };

  const appendText = value => {
    if (!value) return;
    if (current?.type === 'dialogue' || current?.type === 'thought') {
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
      flush();
      current = {
        type: 'acting',
        lines: []
      };
      continue;
    }
    if (marker.type === 'acting_end') {
      if (current?.type === 'acting') flush();
      continue;
    }
    if (marker.type === 'block_end') {
      if (current) flush();
      continue;
    }
    if (marker.type !== 'block_start') fail('Unexpected Story control marker');
    flush();
    current = { type: marker.block_type, speaker_id: marker.speaker_id, acting_direction: null, lines: [] };
  }
  flush();

  // Fail-open structural recovery for legacy/plain quoted dialogue.  This is
  // intentionally exact-name only: no fuzzy speaker inference or semantic
  // repair is allowed at the parser boundary.
  const exactNameEntries = [...directory.entries()]
    .filter(([id, name]) => id !== 'player' && typeof name === 'string' && name.trim())
    .sort((a, b) => b[1].length - a[1].length);
  for (const block of [...blocks]) {
    if (block.type !== 'narrative') continue;
    const line = String(block.text ?? '').trim();
    const match = exactNameEntries.find(([, name]) => line.startsWith(`${name}:`));
    if (!match) continue;
    const text = line.slice(match[1].length + 1).trim().replace(/^["“]|["”]$/gu, '').trim();
    if (!text) continue;
    const dialogue = { type: 'dialogue', speaker_id: match[0], speaker: match[1], speaker_name: match[1], direction: null, acting_direction: null, text, order: dialogueLines.length };
    const index = blocks.indexOf(block);
    blocks.splice(index, 1, dialogue);
    dialogueLines.push(dialogue);
    warnings.push('dialogue_marker_fallback_applied');
  }

  const hasBody = blocks.some(block => ['scene', 'narrative', 'dialogue', 'acting'].includes(block.type) && String(block.text ?? '').trim());
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
    acting_events: actingEvents,
    warnings
  };
}

const OBSERVATION_BLOCK_TYPES = new Set(['scene', 'narrative', 'dialogue', 'acting']);

/**
 * Stable structural inputs for the fresh Story -> Extract observation
 * contract.  This is an accounting projection of already parsed Story
 * blocks; it does not infer whether any block contains a durable fact.
 */
export function buildStoryObservationBlocks(parsedStory) {
  const blocks = Array.isArray(parsedStory?.blocks) ? parsedStory.blocks : [];
  return blocks
    .map((block, blockIndex) => ({
      block_id: `story:${blockIndex}`,
      block_index: blockIndex,
      block_type: block?.type ?? null,
      text: normalizeProjectionText(block?.text ?? '')
    }))
    .filter(block => OBSERVATION_BLOCK_TYPES.has(block.block_type) && block.text);
}

import { GameCoreError } from './errors.js';
import { buildStoryIdentityDirectory, parseStoryControlMarker } from './story-wire-protocol.js';

function fail(message) { throw new GameCoreError('STORY_PROTOCOL_INVALID', message); }
function lines(raw) { return String(raw ?? '').split(/\r?\n/); }

function tokenize(raw, directory) {
  const tokens = [];
  let text = '';
  const flushText = () => { if (text) { tokens.push({ type: 'text', value: text }); text = ''; } };
  const value = String(raw ?? '');
  for (let index = 0; index < value.length;) {
    if (value[index] !== '[') { text += value[index++]; continue; }
    const marker = parseStoryControlMarker(value.slice(index), { directory });
    if (!marker || marker.invalid) fail(`Unknown or malformed Story marker: ${marker?.raw ?? value.slice(index, index + 32)}`);
    if (marker.incomplete) fail('Incomplete Story control marker');
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
  let current = null;
  let sawThought = false;
  let thoughtCount = 0;
  const choices = [];
  let lastDialogue = null;
  let canAttachActing = false;
  const flush = () => {
    if (!current) return;
    const text = current.lines.join('\n').trim();
    const actionText = text;
    if (!actionText && current.type !== 'choice') fail(`${current.type} block must contain text`);
    if (current.type === 'dialogue') {
      const item = {
        speaker_id: current.speaker_id,
        speaker: directory.get(current.speaker_id),
        speaker_name: directory.get(current.speaker_id),
        direction: current.acting_direction,
        acting_direction: current.acting_direction,
        text: actionText,
        order: dialogueLines.length
      };
      dialogueLines.push(item);
      blocks.push({ type: 'dialogue', ...item });
      lastDialogue = item;
      canAttachActing = true;
    } else if (current.type === 'scene') {
      blocks.push({ type: 'scene', text: actionText });
      canAttachActing = false;
    } else if (current.type === 'thought') {
      thoughtCount += 1;
      sawThought = true;
      blocks.push({ type: 'player_inner_thought', text: actionText });
      canAttachActing = false;
    } else if (current.type === 'choice') {
      choices.push(actionText);
      blocks.push({ type: 'choice', text: actionText });
      canAttachActing = false;
    }
    current = null;
  };
  const tokens = tokenize(raw, directory);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'text') {
      if (!current) { if (token.value.trim()) fail('Story text must begin with a semantic block marker'); continue; }
      current.lines.push(token.value);
      continue;
    }
    const marker = token.marker;
    if (marker.type === 'acting') {
      const target = current?.type === 'dialogue' ? current : (canAttachActing ? lastDialogue : null);
      if (!target) fail('ACTING must follow DIALOGUE');
      if (target.acting_direction !== null) fail('DIALOGUE has duplicate ACTING metadata');
      const next = tokens[index + 1]?.type === 'text' ? tokens[index + 1].value : '';
      const directionSource = next.replace(/^[ \t]*(?:\r?\n)?/, '');
      const direction = directionSource.split(/\r?\n/, 1)[0].replace(/^[ \t]+/, '').trim();
      if (direction && !direction.startsWith('[')) {
        target.acting_direction = direction;
        target.direction = direction;
        if (!current) {
          const projected = blocks.find(block => block.type === 'dialogue' && block.order === target.order);
          if (projected) { projected.acting_direction = direction; projected.direction = direction; }
        }
      }
      if (direction && !direction.startsWith('[') && tokens[index + 1]?.type === 'text') {
        const remainder = directionSource.replace(/^[^\r\n]*(?:\r?\n|$)/, '');
        if (remainder) tokens[index + 1].value = remainder;
        else tokens.splice(index + 1, 1);
      }
      continue;
    }
    if (marker.type === 'acting_end') continue;
    if (marker.type === 'block_end') {
      if (current) flush();
      continue;
    }
    if (marker.type !== 'block_start') fail('Unexpected Story control marker');
    flush();
    current = {
      type: marker.block_type,
      speaker_id: marker.speaker_id,
      acting_direction: null,
      lines: []
    };
    canAttachActing = marker.block_type === 'dialogue';
  }
  flush();
  if (!blocks.some(block => block.type === 'scene')) fail('Story requires a SCENE block');
  const warnings = [];
  if (!sawThought) warnings.push('player_inner_thought_missing');
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
    scene_text: blocks.filter(block => block.type === 'scene').map(block => block.text).join('\n'),
    blocks,
    // Multiple raw THOUGHT blocks are preserved for audit/replay, while the
    // canonical footer value is the last valid literal thought.
    player_inner_thought: blocks.filter(block => block.type === 'player_inner_thought').at(-1)?.text ?? '',
    choices,
    canonical_choices: canonicalChoices,
    dialogue_lines: dialogueLines,
    warnings
  };
}

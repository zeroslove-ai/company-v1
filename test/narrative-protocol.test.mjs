import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryStreamDecoder, parseStoryControlMarker } from '../src/engine/story-wire-protocol.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

const master = { characters: [{ character_id: 'heroine2', name: 'Jena' }] };

test('semantic markers enforce dialogue identity while ACTING remains visible-only', () => {
  const marker = parseStoryControlMarker('[ACTING enactment_id="turn:1:csa:heroine2:0" actor_id="heroine2"]', { directory: new Map([['heroine2', 'Jena']]) });
  assert.equal(marker.type, 'acting');
  assert.equal('enactment_id' in marker, false);
  assert.equal('actor_id' in marker, false);
  assert.throws(() => parseStoryControlMarker('[DIALOGUE]', { directory: new Map([['heroine2', 'Jena']]) }), error => error.code === 'STORY_PROTOCOL_INVALID');
});

test('fresh bare ACTING is a visible block, not dialogue direction metadata', () => {
  const raw = '[SCENE]room[/SCENE]\n[DIALOGUE speaker_id="heroine2"]first line[/DIALOGUE]\n[ACTING]\nvisible action\n[/ACTING]\n[DIALOGUE speaker_id="heroine2"]second line[/DIALOGUE]\n[THOUGHT]think[/THOUGHT]\n[CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d';
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'dialogue', 'acting', 'dialogue', 'player_inner_thought', 'choice', 'choice', 'choice', 'choice']);
  assert.deepEqual(parsed.dialogue_lines.map(line => line.text), ['first line', 'second line']);
  assert.equal(parsed.dialogue_lines[0].acting_direction, null);
  assert.equal(parsed.acting_events[0].text, 'visible action');
});

test('fresh ACTING preserves source order and same-speaker dialogue does not merge across it', () => {
  const raw = '[DIALOGUE speaker_id="heroine2"]one[/DIALOGUE][ACTING]move[/ACTING][DIALOGUE speaker_id="heroine2"]two[/DIALOGUE]';
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.deepEqual(parsed.blocks.map(block => block.type), ['dialogue', 'acting', 'dialogue']);
  assert.deepEqual(parsed.dialogue_lines.map(line => line.text), ['one', 'two']);
});

test('fresh duplicate ACTING blocks remain visible without suppression warnings', () => {
  const parsed = parseFreshNarrativeV2('[SCENE]room[ACTING]first[ACTING]second[THOUGHT]t', { master });
  assert.deepEqual(parsed.acting_events.map(event => event.text), ['first', 'second']);
  assert.equal(parsed.warnings.includes('dialogue_acting_duplicate'), false);
});

test('stream decoder emits visible ACTING blocks in source order', () => {
  const decoder = createStoryStreamDecoder({ master });
  const raw = '[DIALOGUE speaker_id="heroine2"]one[/DIALOGUE][ACTING]move[/ACTING][DIALOGUE speaker_id="heroine2"]two[/DIALOGUE]';
  const events = [...decoder.push(raw.slice(0, 35)), ...decoder.push(raw.slice(35)), ...decoder.finish()];
  assert.deepEqual(events.filter(event => event.type === 'block_start').map(event => event.block_type), ['dialogue', 'acting', 'dialogue']);
  assert.equal(events.filter(event => event.type === 'acting').length, 1);
  assert.equal(events.filter(event => event.type === 'text_delta').map(event => event.text).join(''), 'onemovetwo');
  assert.equal(events.some(event => event.data?.acting_direction), false);
});

test('stream legacy ACTING attributes remain visible text without metadata authority', () => {
  const decoder = createStoryStreamDecoder({ master });
  const events = [
    ...decoder.push('[ACTING enactment_id="turn:1:csa:heroine2:0"]'),
    ...decoder.push('\nvisible'),
    ...decoder.push(' action[/ACTING]'),
    ...decoder.finish()
  ];
  assert.equal('enactment_id' in (events.find(event => event.type === 'acting') ?? {}), false);
  assert.equal(events.filter(event => event.type === 'text_delta').map(event => event.text).join(''), 'visible action');
});

test('stream plain narrative is visible and marker-free', () => {
  const decoder = createStoryStreamDecoder({ master });
  const events = [...decoder.push('[unknown]literal'), ...decoder.finish()];
  assert.equal(events.filter(event => event.type === 'text_delta').map(event => event.text).join(''), '[unknown]literal');
});

test('fresh choices remain literal and exact four choices are canonical', () => {
  const parsed = parseFreshNarrativeV2('[SCENE]s[THOUGHT]t[CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master });
  assert.deepEqual(parsed.canonical_choices, ['a', 'b', 'c', 'd']);
});

test('fresh parser rejects THOUGHT and CHOICE without a visible Story body', () => {
  assert.throws(
    () => parseFreshNarrativeV2('[THOUGHT]t[/THOUGHT][CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master }),
    error => error.code === 'STORY_PROTOCOL_INVALID' && error.message === 'Story body is missing'
  );
});

test('fresh parser accepts plain narrative with THOUGHT and exact choices', () => {
  const parsed = parseFreshNarrativeV2('A visible scene begins.[THOUGHT]t[/THOUGHT][CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master });
  assert.equal(parsed.blocks.some(block => block.type === 'narrative' && block.text.includes('A visible scene begins.')), true);
  assert.equal(parsed.choices.length, 4);
});

test('fresh parser accepts SCENE, DIALOGUE, and ACTING as visible body forms', () => {
  const scene = parseFreshNarrativeV2('[SCENE]room[/SCENE][THOUGHT]t[/THOUGHT][CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master });
  const dialogue = parseFreshNarrativeV2('[DIALOGUE speaker_id="heroine2"]hello[/DIALOGUE][THOUGHT]t[/THOUGHT][CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master });
  const acting = parseFreshNarrativeV2('[ACTING]move[/ACTING][THOUGHT]t[/THOUGHT][CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master });
  assert.equal(scene.blocks.some(block => block.type === 'scene'), true);
  assert.equal(dialogue.dialogue_lines[0].text, 'hello');
  assert.equal(acting.acting_events[0].text, 'move');
});

test('stream decoder rejects missing and unknown speaker IDs without inference', () => {
  assert.throws(() => createStoryStreamDecoder({ master }).push('[DIALOGUE]'), error => error.code === 'STORY_PROTOCOL_INVALID');
  assert.throws(() => createStoryStreamDecoder({ master }).push('[DIALOGUE speaker_id="unknown"]'), error => error.code === 'STORY_PROTOCOL_INVALID');
  assert.throws(() => createStoryStreamDecoder({ master }).push('[DIALOGUE speaker_id="hero5ine"]'), error => error.code === 'STORY_PROTOCOL_INVALID' && error.message === 'Unknown Story speaker_id: hero5ine');
});

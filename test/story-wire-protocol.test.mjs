import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryStreamDecoder, parseStoryControlMarker } from '../src/engine/story-wire-protocol.js';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';

const master = { characters: [{ character_id: 'heroine2', name: '윤민아' }] };
const valid = `[SCENE]\n회의실에 햇빛이 들었다.\n[/SCENE]\n[DIALOGUE speaker_id="heroine2"]\n[ACTING] 당황하며\n네, 잠깐만요.\n[THOUGHT]\n나는 상황부터 살펴본다.\n[CHOICE label="확인"]\n자료를 확인한다.\n[CHOICE label="질문"]\n상황을 묻는다.\n[CHOICE label="대기"]\n잠시 기다린다.\n[CHOICE label="이동"]\n다른 곳으로 간다.`;

test('semantic markers expose exact identity and optional acting metadata', () => {
  const marker = parseStoryControlMarker('[DIALOGUE speaker_id="heroine2"]', { directory: new Map([['heroine2', '윤민아']]) });
  assert.equal(marker.speaker_id, 'heroine2');
  assert.equal(marker.acting_direction, null);
  assert.throws(() => parseStoryControlMarker('[DIALOGUE]', { directory: new Map([['heroine2', '윤민아']]) }), error => error.code === 'STORY_PROTOCOL_INVALID');
});

test('parser preserves unlimited block order and keeps acting on its dialogue only', () => {
  const parsed = parseFreshNarrativeV2(valid, { master });
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'dialogue', 'player_inner_thought', 'choice', 'choice', 'choice', 'choice']);
  assert.equal(parsed.dialogue_lines[0].acting_direction, '당황하며');
  assert.equal(parsed.choices.length, 4);
  assert.equal(parsed.raw, valid);
});

test('parser preserves multiple scene and dialogue blocks in exact source order', () => {
  const raw = '[SCENE]first[/SCENE]\n[DIALOGUE speaker_id="heroine2"]one[/DIALOGUE]\n' +
    '[SCENE]second[/SCENE]\n[DIALOGUE speaker_id="heroine2"]two\n' +
    '[THOUGHT]think\n[CHOICE label="A"]a[CHOICE label="B"]b[CHOICE label="C"]c[CHOICE label="D"]d';
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'dialogue', 'scene', 'dialogue', 'player_inner_thought', 'choice', 'choice', 'choice', 'choice']);
  assert.deepEqual(parsed.dialogue_lines.map(line => line.text), ['one', 'two']);
  assert.equal(parsed.scene_text, 'first\nsecond');
});

test('repeated scene and dialogue blocks preserve the exact source order', () => {
  const raw = [
    '[SCENE]first',
    '[DIALOGUE speaker_id="heroine2"]one',
    '[SCENE]second',
    '[DIALOGUE speaker_id="heroine2"]two',
    '[DIALOGUE speaker_id="heroine2"]three',
    '[SCENE]third',
    '[DIALOGUE speaker_id="heroine2"]four',
    '[THOUGHT]thought',
    '[CHOICE label="A"]a',
    '[CHOICE label="B"]b',
    '[CHOICE label="C"]c',
    '[CHOICE label="D"]d'
  ].join('\n');
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.deepEqual(parsed.blocks.map(block => block.type), [
    'scene', 'dialogue', 'scene', 'dialogue', 'dialogue', 'scene', 'dialogue',
    'player_inner_thought', 'choice', 'choice', 'choice', 'choice'
  ]);
  assert.deepEqual(parsed.dialogue_lines.map(line => line.text), ['one', 'two', 'three', 'four']);
});

test('missing acting remains valid and does not infer a direction', () => {
  const raw = valid.replace('[ACTING] 당황하며\n', '');
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.dialogue_lines[0].acting_direction, null);
});

test('acting cannot carry across a new block', () => {
  const raw = valid.replace('[DIALOGUE speaker_id="heroine2"]\n[ACTING] 당황하며\n네, 잠깐만요.', '[DIALOGUE speaker_id="heroine2"]\n네, 잠깐만요.\n[SCENE]\n[ACTING] 당황하며');
  assert.throws(() => parseFreshNarrativeV2(raw, { master }), error => error.code === 'STORY_PROTOCOL_INVALID');
});

test('stream decoder emits semantic events without markers in text', () => {
  const decoder = createStoryStreamDecoder({ master });
  const events = [...decoder.push(valid.slice(0, 70)), ...decoder.push(valid.slice(70)), ...decoder.finish()];
  assert.equal(events.filter(event => event.type === 'block_start').length, 7);
  assert.equal(events.filter(event => event.type === 'acting')[0].acting_direction, '당황하며');
  assert.equal(events.filter(event => event.type === 'text_delta').map(event => event.text).join('').includes('[SCENE]'), false);
  assert.equal(events.some(event => event.type === 'text_delta' && event.text.includes('[CHOICE')), false);
});

test('each block marker closes the prior block and preserves source order', () => {
  const decoder = createStoryStreamDecoder({ master });
  const raw = '[DIALOGUE speaker_id="heroine2"]\n[ACTING] shy\nhello\n[SCENE]room\n[THOUGHT]think\n[CHOICE label="A"]pick';
  const events = [...decoder.push(raw), ...decoder.finish()];
  assert.deepEqual(
    events.filter(event => event.type === 'block_start' || event.type === 'block_end')
      .map(event => `${event.type}:${event.block_type}`),
    [
      'block_start:dialogue',
      'block_end:dialogue',
      'block_start:scene',
      'block_end:scene',
      'block_start:thought',
      'block_end:thought',
      'block_start:choice'
    ]
  );
  assert.equal(events.filter(event => event.type === 'acting').length, 1);
  assert.equal(events.filter(event => event.type === 'text_delta').map(event => event.text).join(''), 'hello\nroom\nthink\npick');
});

test('stream ACTING cannot carry across a new block marker', () => {
  const decoder = createStoryStreamDecoder({ master });
  const events = decoder.push('[DIALOGUE speaker_id="heroine2"]hello\n[ACTING]\n[SCENE]room');
  assert.equal(events.some(event => event.type === 'acting'), false);
  assert.deepEqual(events.filter(event => event.type === 'block_start').map(event => event.block_type), ['dialogue', 'scene']);
});

test('known closing markers are deterministic no-op syntax', () => {
  const decoder = createStoryStreamDecoder({ master });
  const events = decoder.push('[SCENE]scene[/SCENE]\n[DIALOGUE speaker_id="heroine2"]hello[/DIALOGUE]\n[ACTING] calm[/ACTING]\n[THOUGHT]thought[/THOUGHT]\n[CHOICE label="A"]a[/CHOICE]');
  assert.equal(events.some(event => event.type === 'text_delta' && event.text.includes('hello')), true);
  assert.equal(events.some(event => event.type === 'text_delta' && event.text.includes('scene')), true);
});

test('ACTING accepts same-line, next-line, and adjacent post-dialogue forms', () => {
  const sameLine = parseFreshNarrativeV2('[SCENE]s\n[DIALOGUE speaker_id="heroine2"]\n[ACTING] calm\nhello\n[THOUGHT]t\n[CHOICE label="A"]a\n[CHOICE label="B"]b\n[CHOICE label="C"]c\n[CHOICE label="D"]d', { master });
  assert.equal(sameLine.dialogue_lines[0].acting_direction, 'calm');
  const nextLine = parseFreshNarrativeV2('[SCENE]s\n[DIALOGUE speaker_id="heroine2"]\n[ACTING]\ncalm\nhello\n[/ACTING]\n[THOUGHT]t\n[CHOICE label="A"]a\n[CHOICE label="B"]b\n[CHOICE label="C"]c\n[CHOICE label="D"]d', { master });
  assert.equal(nextLine.dialogue_lines[0].acting_direction, 'calm');
  const adjacent = parseFreshNarrativeV2('[SCENE]s\n[DIALOGUE speaker_id="heroine2"]hello[/DIALOGUE]\n[ACTING]\ncalm\n[/ACTING]\n[THOUGHT]t\n[CHOICE label="A"]a\n[CHOICE label="B"]b\n[CHOICE label="C"]c\n[CHOICE label="D"]d', { master });
  assert.equal(adjacent.dialogue_lines[0].acting_direction, 'calm');
});

test('choice label length is presentation-only while empty choice is a soft warning', () => {
  const long = '[SCENE]s\n[THOUGHT]t\n[CHOICE label="very long presentation label"]a\n[CHOICE label="B"]b\n[CHOICE label="C"]c\n[CHOICE label="D"]d';
  assert.equal(parseFreshNarrativeV2(long, { master }).choices.length, 4);
  const empty = parseFreshNarrativeV2('[SCENE]s\n[THOUGHT]t\n[CHOICE]\n[CHOICE]b\n[CHOICE]c\n[CHOICE]d', { master });
  assert.ok(empty.warnings.includes('choices_empty'));
  assert.deepEqual(empty.canonical_choices, []);
});

test('duplicate literal choices remain observed but are not canonical', () => {
  const duplicate = parseFreshNarrativeV2('[SCENE]s\n[THOUGHT]t\n[CHOICE]same\n[CHOICE]same\n[CHOICE]other\n[CHOICE]last', { master });
  assert.equal(duplicate.choices.length, 4);
  assert.ok(duplicate.warnings.includes('choices_exact_duplicate'));
  assert.deepEqual(duplicate.canonical_choices, []);
});

test('footer omissions remain parseable while canonical choices stay unavailable', () => {
  const noThought = parseFreshNarrativeV2('[SCENE]s\n[DIALOGUE speaker_id="heroine2"]hello\n[CHOICE]a\n[CHOICE]b\n[CHOICE]c\n[CHOICE]d', { master });
  assert.equal(noThought.player_inner_thought, '');
  assert.ok(noThought.warnings.includes('player_inner_thought_missing'));
  assert.deepEqual(noThought.canonical_choices, ['a', 'b', 'c', 'd']);
  const three = parseFreshNarrativeV2('[SCENE]s\n[THOUGHT]t\n[CHOICE]a\n[CHOICE]b\n[CHOICE]c', { master });
  assert.ok(three.warnings.includes('choices_not_exactly_four'));
  assert.deepEqual(three.canonical_choices, []);
});

test('adjacent semantic markers close the prior block and preserve source order', () => {
  const decoder = createStoryStreamDecoder({ master });
  const raw = '[SCENE]one[DIALOGUE speaker_id="heroine2"]two[THOUGHT]three[CHOICE label="A"]four[CHOICE label="B"]five[CHOICE label="C"]six[CHOICE label="D"]seven';
  const events = [...decoder.push(raw), ...decoder.finish()];
  assert.deepEqual(events.filter(event => event.type === 'block_start').map(event => event.block_type), ['scene', 'dialogue', 'thought', 'choice', 'choice', 'choice', 'choice']);
  assert.equal(events.filter(event => event.type === 'text_delta').map(event => event.text).join(''), 'onetwothreefourfivesixseven');
});

test('stream decoder rejects missing and unknown speaker IDs without inference', () => {
  const missing = createStoryStreamDecoder({ master });
  assert.throws(() => missing.push('[DIALOGUE]'), error => error.code === 'STORY_PROTOCOL_INVALID');
  const unknown = createStoryStreamDecoder({ master });
  assert.throws(() => unknown.push('[DIALOGUE speaker_id="unknown"]'), error => error.code === 'STORY_PROTOCOL_INVALID');
});

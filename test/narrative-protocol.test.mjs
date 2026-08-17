import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryStreamDecoder, parseStoryControlMarker } from '../src/engine/story-wire-protocol.js';
import { buildStoryObservationBlocks, parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';
import { projectStoryChoiceProjection, reduceStoryChoiceProjection } from '../src/engine/runtime-core/observation-reducers.js';

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

test('fresh duplicate THOUGHT blocks stay private across adjacent, separated, and paragraph-boundary forms', () => {
  const choices = ['A', 'B', 'C', 'D'].map(choice => `[CHOICE]${choice}[/CHOICE]`).join('');
  const cases = [
    '[SCENE]visible scene[/SCENE][THOUGHT]first private[/THOUGHT][THOUGHT]adjacent duplicate[/THOUGHT]',
    '[SCENE]visible scene[/SCENE][THOUGHT]first private[/THOUGHT][DIALOGUE speaker_id="heroine2"]visible dialogue[/DIALOGUE][THOUGHT]separated duplicate[/THOUGHT][ACTING]visible acting[/ACTING]',
    '[SCENE]visible scene[/SCENE][THOUGHT]\nfirst private\n\n[/THOUGHT][THOUGHT]\nparagraph duplicate\n\n[/THOUGHT]'
  ];

  for (const prefix of cases) {
    const parsed = parseFreshNarrativeV2(`${prefix}${choices}`, { master });
    const publicBlocks = parsed.blocks.filter(block => block.type !== 'player_inner_thought');
    const observations = buildStoryObservationBlocks(parsed);

    assert.equal(parsed.player_inner_thought, 'first private');
    assert.equal(parsed.warnings.includes('player_inner_thought_duplicate'), true);
    assert.equal(publicBlocks.some(block => block.text?.includes('duplicate')), false);
    assert.equal(parsed.scene_text.includes('duplicate'), false);
    assert.equal(observations.some(block => block.text.includes('duplicate')), false);
    assert.deepEqual(parsed.canonical_choices, ['A', 'B', 'C', 'D']);
  }
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

test('fresh parser rejects attributed SCENE markers at the strict wire boundary', () => {
  assert.throws(
    () => parseFreshNarrativeV2('[SCENE brand_strategy_meeting_room]\\nVisible story[THOUGHT]t[/THOUGHT][CHOICE]a[CHOICE]b[CHOICE]c[CHOICE]d', { master }),
    error => error.code === 'STORY_PROTOCOL_INVALID' && error.message === 'Malformed Story control marker'
  );
});

test('fresh choices remain literal and exact four choices are canonical', () => {
  const choices = ['literal A', 'literal B', 'literal C', 'literal D'];
  const raw = `[SCENE]s[THOUGHT]t${choices.map(choice => `[CHOICE]${choice}[/CHOICE]`).join('')}`;
  const parsed = parseFreshNarrativeV2(raw, { master });
  const projected = reduceStoryChoiceProjection({ parsedStory: parsed });
  assert.deepEqual(parsed.canonical_choices, choices);
  assert.deepEqual(projected.state, choices);
  assert.deepEqual(parsed.blocks.filter(block => block.type === 'choice').map(block => block.text), choices);
});

test('normal Story choice projection fails open to one deterministic exact-four set', () => {
  const fallback = [
    '현재 대화를 조금 더 이어간다.',
    '상대에게 지금 상황을 차분히 물어본다.',
    '주변 반응을 잠시 살펴본다.',
    '대화를 정리하고 다음 행동을 생각한다.'
  ];
  const cases = [
    { choices: [], expected: fallback },
    { choices: ['provider A'], expected: ['provider A', ...fallback.slice(0, 3)] },
    { choices: ['provider A', 'provider B'], expected: ['provider A', 'provider B', ...fallback.slice(0, 2)] },
    { choices: ['provider A', 'provider B', 'provider C'], expected: ['provider A', 'provider B', 'provider C', fallback[0]] },
    { choices: ['A', 'B', 'C', 'D'], expected: ['A', 'B', 'C', 'D'] },
    { choices: ['A', 'B', 'C', 'D', 'E'], expected: ['A', 'B', 'C', 'D'] },
    { choices: ['A', '', 'A', 'B'], expected: ['A', 'B', ...fallback.slice(0, 2)] }
  ];

  for (const { choices, expected } of cases) {
    const blocks = choices.map(text => ({ type: 'choice', text }));
    const parsedStory = { raw: 'provider raw Story', blocks, choices, canonical_choices: choices, warnings: ['provider_warning'] };
    const projected = projectStoryChoiceProjection({ parsedStory, allowDeterministicFallback: true });
    assert.deepEqual(projected.state, expected);
    assert.deepEqual(projected.parsedStory.choices, expected);
    assert.deepEqual(projected.parsedStory.canonical_choices, expected);
    assert.deepEqual(projected.parsedStory.blocks, blocks);
    assert.equal(projected.parsedStory.raw, 'provider raw Story');
    assert.equal(projected.parsedStory.warnings.includes('provider_warning'), true);
    if (choices.length !== 4 || new Set(choices.filter(Boolean)).size !== choices.filter(Boolean).length || choices.some(choice => !choice)) {
      assert.equal(projected.parsedStory.warnings.includes('choices_fallback_applied'), true);
    }
  }
});

test('normal Story choice projection remains coherent through persisted, Extract, Commit, history, and replay views', () => {
  const providerBlocks = [{ type: 'scene', text: 'raw narrative' }, { type: 'choice', text: 'Only provider choice' }];
  const storyComplete = projectStoryChoiceProjection({
    parsedStory: {
      raw: 'raw Story with one provider choice',
      blocks: providerBlocks,
      choices: ['Only provider choice'],
      warnings: ['choices_not_exactly_four']
    },
    allowDeterministicFallback: true
  });
  const persisted = structuredClone(storyComplete.parsedStory);
  const extractView = projectStoryChoiceProjection({ parsedStory: persisted, allowDeterministicFallback: true });
  const commitView = projectStoryChoiceProjection({ parsedStory: extractView.parsedStory, allowDeterministicFallback: true });
  const historyRow = { parsed_blocks: persisted, choices: commitView.state };
  const replayView = projectStoryChoiceProjection({ parsedStory: historyRow.parsed_blocks, allowDeterministicFallback: true });

  assert.equal(storyComplete.state.length, 4);
  assert.deepEqual(extractView.state, storyComplete.state);
  assert.deepEqual(commitView.state, storyComplete.state);
  assert.deepEqual(historyRow.choices, storyComplete.state);
  assert.deepEqual(replayView.state, storyComplete.state);
  assert.equal(persisted.raw, 'raw Story with one provider choice');
  assert.deepEqual(persisted.blocks, providerBlocks);
  assert.equal(replayView.parsedStory.warnings.includes('choices_fallback_applied'), true);
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

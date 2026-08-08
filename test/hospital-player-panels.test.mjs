import test from 'node:test';
import assert from 'node:assert/strict';
import { playerSupplementalDisplay } from '../src/frontend/pages/render.js';

test('projects existing Company state into Hospital player detail panels', () => {
  assert.deepEqual(playerSupplementalDisplay({
    turn: { turn_summary: '김제나와의 대화가 시작되었다.' },
    scene: { world_state: { day: 2, time_block: '오후', game_time: { day: 2, minute_of_day: 822 } } },
    player: { inner_thought: '조금 더 지켜보자.', ejaculation_progress: 64, ejaculation_count: 1 }
  }), {
    innerThought: '조금 더 지켜보자.',
    gameTime: 'Day 2 · 13:42',
    ejaculationProgress: 64,
    ejaculationCount: 1,
    turnSummary: '김제나와의 대화가 시작되었다.'
  });
});

test('does not invent missing supplemental state and clamps progress for display', () => {
  assert.deepEqual(playerSupplementalDisplay({ player: { ejaculation_progress: 140 } }), {
    innerThought: '',
    gameTime: '',
    ejaculationProgress: 100,
    ejaculationCount: null,
    turnSummary: ''
  });
});

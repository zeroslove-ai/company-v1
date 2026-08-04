import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceFromBottom, nextGentleScrollTop } from '../src/frontend/pages/hospital-scroll.js';

test('distanceFromBottom measures the remaining story distance', () => {
  assert.equal(distanceFromBottom({ scrollHeight: 1000, clientHeight: 400, scrollTop: 500 }), 100);
  assert.equal(distanceFromBottom({ scrollHeight: 300, clientHeight: 400, scrollTop: 0 }), 0);
});

test('gentle follow advances by a bounded step and never jumps to the bottom', () => {
  const element = { scrollHeight: 1600, clientHeight: 400, scrollTop: 500 };
  assert.equal(nextGentleScrollTop(element, 48), 548);
  assert.notEqual(nextGentleScrollTop(element, 48), 1200);
});

test('gentle follow clamps at the maximum scroll position', () => {
  const element = { scrollHeight: 1000, clientHeight: 400, scrollTop: 580 };
  assert.equal(nextGentleScrollTop(element, 48), 600);
});

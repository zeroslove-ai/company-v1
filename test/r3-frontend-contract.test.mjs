import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
const client = await readFile(new URL('../frontend-r3/r3-client.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../frontend-r3/index.html', import.meta.url), 'utf8');
const render = await readFile(new URL('../frontend-r3/render.js', import.meta.url), 'utf8');
const setup = await readFile(new URL('../frontend-r3/setup.js', import.meta.url), 'utf8');
const map = await readFile(new URL('../frontend-r3/company-map.js', import.meta.url), 'utf8');

test('R3 frontend sends exact literal input through one server turn endpoint', () => {
  assert.match(app, /literal_action: literalAction/);
  assert.match(app, /choice-list/);
  assert.match(app, /renderCompanyMap/);
  assert.match(app, /renderMindMonitor/);
  assert.match(render, /renderNarrative/);
  assert.match(render, /parsePlainStoryForPresentation/);
  assert.match(map, /company-map-floor/);
  assert.match(map, /onFill/);
  assert.match(setup, /validateSetupValues/);
  assert.match(client, /\/turn/);
  assert.doesNotMatch(app, /createTurnCoordinator|\/extract|\/commit/);
  assert.doesNotMatch(client, /\/extract|\/commit/);
  assert.match(html, /id="player-action"/);
  assert.match(html, /data-phase="milestone0-r3"/);
  assert.match(html, /id="tts-toggle"[^>]*disabled/);
});

test('R3 presentation adapter preserves raw Story and canonical choice literals', async () => {
  const { parsePlainStoryForPresentation } = await import('../frontend-r3/render.js');
  const choices = ['첫 번째 행동을 한다.', '두 번째 행동을 한다.', '세 번째 행동을 한다.', '네 번째 행동을 한다.'];
  const parsed = parsePlainStoryForPresentation(`장면 설명이다.\n서원희: "안녕하세요."\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n4. ${choices[3]}`, { choices, actorNames: { heroine1: '서원희' } });
  assert.equal(parsed.blocks.length, 2);
  assert.equal(parsed.blocks[1].speaker, '서원희');
  assert.deepEqual(parsed.choices, choices);
  assert.equal(parsed.blocks.some(block => block.text.includes('1.')), false);
  const fallback = parsePlainStoryForPresentation('구조를 알아볼 수 없는 원문입니다.', { choices });
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.raw, '구조를 알아볼 수 없는 원문입니다.');
});

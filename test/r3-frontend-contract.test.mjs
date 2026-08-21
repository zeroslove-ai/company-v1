import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
const client = await readFile(new URL('../frontend-r3/r3-client.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../frontend-r3/index.html', import.meta.url), 'utf8');

test('R3 frontend sends exact literal input through one server turn endpoint', () => {
  assert.match(app, /literal_action: literalAction/);
  assert.match(app, /choice-list/);
  assert.match(app, /company-map/);
  assert.match(client, /\/turn/);
  assert.doesNotMatch(app, /createTurnCoordinator|\/extract|\/commit/);
  assert.doesNotMatch(client, /\/extract|\/commit/);
  assert.match(html, /id="player-action"/);
  assert.match(html, /data-phase="milestone0-r3"/);
  assert.match(html, /id="tts-toggle"[^>]*disabled/);
});

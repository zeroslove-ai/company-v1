import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createApiWorker } from '../src/api/index.js';

test('public NPC finder endpoint is removed while ordinary Story actions remain', async () => {
  const worker = createApiWorker({ fetchImpl: async () => { throw new Error('network should not be called'); } });
  const response = await worker.fetch(new Request('https://company.invalid/api/find-npc', { method: 'POST' }), {}, {});
  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.error.code, 'not_found');
});

test('frontend has no NPC finder client, modal, or utility wiring', () => {
  const html = fs.readFileSync(new URL('../src/frontend/pages/index.html', import.meta.url), 'utf8');
  const api = fs.readFileSync(new URL('../src/frontend/pages/api.js', import.meta.url), 'utf8');
  const utility = fs.readFileSync(new URL('../src/frontend/pages/utility-ui.js', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../src/frontend/pages/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /find-npc|npc-finder/);
  assert.doesNotMatch(api, /findNpc|\/api\/find-npc/);
  assert.doesNotMatch(utility, /npcFinder|openNpcFinder|npc-finder/);
  assert.doesNotMatch(app, /canFindNpc|openNpcFinder|get\('find-npc'\)/);
});

test('dialogue renderer persists verified speaker ids for TTS policy', () => {
  const render = fs.readFileSync(new URL('../src/frontend/pages/render.js', import.meta.url), 'utf8');
  assert.match(render, /setDataValue\(card, 'speakerId', block\.speaker_id\)/);
  const tts = fs.readFileSync(new URL('../src/frontend/pages/tts.js', import.meta.url), 'utf8');
  assert.doesNotMatch(tts, /return selectedCharacterId\(documentRef\);/);
});

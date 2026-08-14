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

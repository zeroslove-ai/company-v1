import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createTurnCoordinator, toolbarCapabilities } from '../src/frontend/pages/app.js';
import { createUtilityUi } from '../src/frontend/pages/utility-ui.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '11111111-1111-4111-8111-111111111111';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

class FakeNode {
  constructor() { this.children = []; this.listeners = new Map(); this.hidden = false; this.disabled = false; this.checked = false; this.value = ''; this.textContent = ''; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  focus() {}
}

function documentWith(ids) {
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode()]));
  return { nodes, documentRef: { querySelector: selector => nodes[selector.slice(1)] ?? null, createElement: () => new FakeNode() } };
}

test('toolbar enables implemented utilities only when their actual DOM/API contract exists', () => {
  const context = { save: { committed_turn: 3, data: { player_setup: { completed: true }, opening_state: { status: 'complete' } } } };
  const capabilities = toolbarCapabilities(
    { turn: { committed_turn: 3 } },
    null,
    { context, utilityAvailable: { history: true, feedback: true, npcFinder: true } }
  );
  assert.deepEqual(capabilities, {
    canResume: true,
    canOpenHistory: true,
    canSendFeedback: true,
    canOpenApps: true,
    canFindNpc: true
  });
});

test('feedback revision reuses the action reserved by the existing revision RPC', async () => {
  const calls = [];
  const structuredAction = { version: 1, type: 'csa_app_transaction', base_turn_count: 2, operations: [] };
  const api = {
    story: async body => {
      calls.push(['story', body]);
      return new Response('unused');
    },
    extract: async body => { calls.push(['extract', body]); return { extract: {} }; },
    commit: async body => { calls.push(['commit', body]); return { commit: { success: true } }; }
  };
  const coordinator = createTurnCoordinator({
    api,
    storage: storage(),
    gameId,
    getContext: () => ({ save: { committed_turn: 2 } }),
    refreshContext: async () => {},
    consumeStory: async (_response, onEvent) => {
      onEvent({ event: 'meta', data: {} });
      onEvent({ event: 'delta', data: { text: '[1. 서사 및 행동]\n수정된 이야기' } });
    }
  });

  await coordinator.startReservedAction({
    action_id: 'feedback-action-1',
    expected_turn: 2,
    original_player_action: '원래 행동',
    structured_action: structuredAction,
    revision_request_id: 'revision-1'
  });

  assert.equal(calls[0][1].action_id, 'feedback-action-1');
  assert.equal(calls[0][1].expected_turn, 2);
  assert.deepEqual(calls[0][1].structured_action, structuredAction);
  assert.equal(calls[2][1].action_id, 'feedback-action-1');
  assert.deepEqual(calls[2][1].structured_action, structuredAction);
});

test('TTS disabled means zero TTS requests even when a dialogue line exists', async () => {
  const { nodes, documentRef } = documentWith(['tts-enabled', 'play-tts']);
  let ttsCalls = 0;
  createUtilityUi({
    documentRef,
    api: { tts: async () => { ttsCalls += 1; return new Response(); } },
    gameId,
    getViewModel: () => ({ media: { image_character_id: 'heroine1', dialogue_lines: [{ text: '대사' }] } })
  });

  assert.equal(nodes['tts-enabled'].checked, false);
  assert.equal(nodes['play-tts'].disabled, true);
  await nodes['play-tts'].listeners.get('click')();
  assert.equal(ttsCalls, 0);
});

test('frontend shell includes the utility controls and responsive stylesheet', () => {
  const html = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/frontend/pages/utility.css'), 'utf8');
  for (const id of ['character-image', 'tts-enabled', 'open-history', 'send-feedback', 'find-npc', 'history-overlay', 'feedback-overlay', 'npc-finder-overlay']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /utility\.css/);
  assert.match(css, /@media \(max-width: 720px\)/);
});

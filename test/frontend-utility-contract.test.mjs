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
  constructor() { this.children = []; this.listeners = new Map(); this.hidden = false; this.disabled = false; this.checked = false; this.value = ''; this.textContent = ''; this.dataset = {}; this.title = ''; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  focus() {}
}

class FakeAudio {
  constructor() {
    this.playCalls = 0;
    this.pauseCalls = 0;
    this.muted = false;
    this.src = '';
    this.currentTime = 0;
  }
  play() { this.playCalls += 1; return Promise.resolve(); }
  pause() { this.pauseCalls += 1; }
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
    { context, utilityAvailable: { history: true, feedback: true } }
  );
  assert.deepEqual(capabilities, {
    canResume: true,
    canOpenHistory: true,
    canSendFeedback: true,
    canOpenApps: true
  });
});

test('legacy progressed Company save still exposes the CSA app entry', () => {
  const context = {
    save: {
      committed_turn: 4,
      data: {
        edition: 'company-v1',
        scene: { version: 1 },
        player: { player_id: 'player-1' },
        turn_state: { committed_turn: 4 },
      }
    }
  };
  const capabilities = toolbarCapabilities(
    { turn: { committed_turn: 4 } },
    null,
    { context, utilityAvailable: { history: true, feedback: true } }
  );
  assert.equal(capabilities.canOpenApps, true);
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

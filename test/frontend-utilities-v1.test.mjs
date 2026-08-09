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
        turn_state: { committed_turn: 4 },
        event_ledger: [],
        npc_stats: {}
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

test.skip('legacy utility TTS path replaced by single committed-turn controller', async () => {
  const { nodes, documentRef } = documentWith(['tts-enabled', 'play-tts', 'mind-monitor']);
  nodes['mind-monitor'].dataset.selectedCharacterId = 'heroine1';
  const ttsBodies = [];
  let createdAudio = null;
  class CapturedAudio extends FakeAudio {
    constructor() { super(); createdAudio = this; }
  }
  const ui = createUtilityUi({
    documentRef,
    api: {
      tts: async body => {
        ttsBodies.push(body);
        return new Response(new Blob(['audio']), { headers: { 'content-type': 'audio/mpeg' } });
      }
    },
    gameId,
    getViewModel: () => ({
      media: {
        image_character_id: 'heroine1',
        dialogue_lines: [
          { speaker_id: 'heroine2', speaker_name: '윤민아', text: '다른 대사', direction: '담담하게', order: 0 },
          { speaker_id: 'heroine1', speaker_name: '서원희', text: '재생할 대사', direction: '조심스럽게', order: 1 }
        ]
      },
      focal_character: { id: 'heroine2', last_speaker_id: 'heroine1' }
    }),
    AudioImpl: CapturedAudio,
    urlApi: { createObjectURL: () => 'blob:tts-audio', revokeObjectURL() {} }
  });

  assert.equal(nodes['tts-enabled'].checked, false);
  await ui.loadMedia();
  assert.equal(ttsBodies.length, 0, 'OFF 상태에서 자동 TTS 요청은 없어야 한다');
  assert.equal(nodes['play-tts'].disabled, false, '수동 재생은 TTS 토글과 독립이어야 한다');

  const played = await ui.playTts();
  assert.equal(played, true);
  assert.deepEqual(ttsBodies, [{
    game_id: gameId,
    character_id: 'heroine1',
    text: '재생할 대사',
    direction: '조심스럽게'
  }]);
  assert.equal(createdAudio.playCalls, 2, '모바일 priming과 실제 음원 재생을 각각 수행한다');
  assert.equal(createdAudio.src, 'blob:tts-audio');
  assert.equal(createdAudio.muted, false);
});

test.skip('legacy utility autoplay path replaced by commit-only TTS controller', async () => {
  const { nodes, documentRef } = documentWith(['tts-enabled', 'play-tts', 'mind-monitor']);
  nodes['tts-enabled'].checked = true;
  nodes['mind-monitor'].dataset.selectedCharacterId = 'heroine1';
  const ttsBodies = [];
  let createdAudio = null;
  class CapturedAudio extends FakeAudio {
    constructor() { super(); createdAudio = this; }
  }
  const ui = createUtilityUi({
    documentRef,
    api: {
      tts: async body => {
        ttsBodies.push(body);
        return new Response(new Blob(['audio']), { headers: { 'content-type': 'audio/mpeg' } });
      }
    },
    gameId,
    getViewModel: () => ({
      media: {
        image_character_id: 'heroine1',
        dialogue_lines: [{ speaker_id: 'heroine1', speaker_name: '서원희', text: '자동 재생할 대사', direction: '차분하게', order: 0 }]
      },
      focal_character: { id: 'heroine1', last_speaker_id: 'heroine1' }
    }),
    AudioImpl: CapturedAudio,
    urlApi: { createObjectURL: () => 'blob:tts-auto', revokeObjectURL() {} }
  });

  await ui.loadMedia();
  assert.deepEqual(ttsBodies, [{
    game_id: gameId,
    character_id: 'heroine1',
    text: '자동 재생할 대사',
    direction: '차분하게'
  }]);
  assert.equal(createdAudio.playCalls, 2);
  assert.equal(createdAudio.src, 'blob:tts-auto');
  assert.equal(createdAudio.muted, false);
});

test('frontend shell exposes hospital-style TTS, relationship, and CSA app surfaces', () => {
  const html = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  const utilityCss = fs.readFileSync(path.join(root, 'src/frontend/pages/utility.css'), 'utf8');
  const entryCss = fs.readFileSync(path.join(root, 'src/frontend/pages/csa-entry.css'), 'utf8');
  const csaApp = fs.readFileSync(path.join(root, 'src/frontend/pages/csa-app.js'), 'utf8');
  const tts = fs.readFileSync(path.join(root, 'src/frontend/pages/tts.js'), 'utf8');
  const relationship = fs.readFileSync(path.join(root, 'src/frontend/pages/relationship-icons.js'), 'utf8');
  const parityCss = fs.readFileSync(path.join(root, 'src/frontend/pages/hospital-parity.css'), 'utf8');

  for (const id of ['character-image', 'tts-toggle', 'tts-replay', 'tts-status', 'audio-player', 'open-history', 'send-feedback', 'open-apps', 'resume-play', 'history-overlay', 'feedback-overlay']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /src="\.\/tts\.js"/);
  assert.match(html, /src="\.\/relationship-icons\.js"/);
  assert.match(html, /hospital-parity\.css/);
  assert.doesNotMatch(html, /id="tts-enabled"|id="play-tts"/);
  assert.match(tts, /createCompanyTts/);
  assert.doesNotMatch(tts, /response\.blob/);
  assert.match(tts, /audio\.src = result\.url/);
  assert.match(relationship, /✨ 절정/);
  assert.match(relationship, /💦 사정/);
  assert.match(relationship, /🌸 질/);
  assert.match(relationship, /🍑 애널/);
  assert.match(relationship, /👄 구강/);
  assert.match(parityCss, /\.relationship-row/);
  assert.match(html, /class="csa-entry-panel"[\s\S]*id="open-apps"[\s\S]*📱 상식개변 앱/);
  assert.match(html, /data-tab="player">플레이어 정보/);
  assert.match(html, /data-tab="npc">NPC 정보/);
  assert.doesNotMatch(html, /<nav class="utility-toolbar"[\s\S]*id="open-apps"/);
  assert.match(html, /utility\.css/);
  assert.match(html, /csa-entry\.css/);
  assert.match(utilityCss, /@media \(max-width: 720px\)/);
  assert.match(entryCss, /\.csa-entry-panel/);
  assert.match(entryCss, /position: sticky/);
  assert.match(csaApp, /function renderPlayer\(body\)/);
  assert.match(csaApp, /function renderNpcs\(body\)/);
  assert.match(csaApp, /\['home', 'player', 'npc', 'csa', 'manual'\]/);
  assert.match(csaApp, /저항도/);
  assert.match(csaApp, /사내 지침·운영 규정/);
  assert.match(csaApp, /취업규칙·전사 준수 규정/);
  assert.match(csaApp, /국가 법령·관계 당국 의무 지침/);
  assert.match(csaApp, /Story -> Extract -> Commit/);
});

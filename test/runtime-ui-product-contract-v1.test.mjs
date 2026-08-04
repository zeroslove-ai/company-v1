import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiWorker } from '../src/api/index.js';
import { renderHistory, renderMindMonitor } from '../src/frontend/pages/render.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const gameId = '11111111-1111-4111-8111-111111111111';

class FakeNode {
  constructor(tag = 'div', id = '') {
    this.tag = tag;
    this.id = id;
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.dataset = {};
    this.listeners = new Map();
    this.ariaSelected = 'false';
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this[name] = value; }
}

function withFakeDocument(run) {
  const previous = globalThis.document;
  globalThis.document = { createElement: tag => new FakeNode(tag) };
  try { return run(); } finally { globalThis.document = previous; }
}

function contextWithMindMonitor() {
  return {
    save: {
      committed_turn: 3,
      data: {
        edition: 'company-v1',
        save_schema_version: 1,
        turn_state: { committed_turn: 3 },
        focal_character_id: 'heroine3',
        last_speaker_id: 'heroine5',
        scene_state: { location_id: 'office' },
        world_state: {},
        player: { name: '플레이어' },
        npc_scene_state: { heroine3: { posture: 'kneeling' } }
      }
    },
    recent_turns: [{
      turn_number: 3,
      turn_summary: '김제나와 이메이가 보고서 검토를 이어갔다.',
      parsed_blocks: {
        blocks: [{ type: 'scene', text: '서사 본문' }],
        dialogue_lines: [
          { speaker_id: 'heroine3', speaker_name: '김제나', direction: '조심스럽게', text: '보고서를 볼까요?', order: 0 },
          { speaker_id: 'heroine5', speaker_name: '이메이', direction: '밝게', text: '같이 봐요!', order: 1 }
        ]
      },
      mind_monitor: {
        heroine3: {
          surface: '보고서 설명을 차분히 이어가야겠다.',
          subconscious: '새 인턴이 나를 어떻게 볼지 조금 신경 쓰인다.',
          physical_reaction: '표시되면 안 되는 값'
        },
        heroine5: {
          surface: '분위기를 편하게 만들어야겠다.',
          subconscious: '둘 사이의 어색함이 빨리 풀리면 좋겠다.'
        }
      }
    }]
  };
}

test('view model projects the NPC-keyed two-field Mind Monitor with canonical names', () => {
  const model = buildCompanyGameViewModel(contextWithMindMonitor());
  assert.deepEqual(model.media.mind_monitor_entries, [
    {
      id: 'heroine3',
      name: '김제나',
      surface: '보고서 설명을 차분히 이어가야겠다.',
      subconscious: '새 인턴이 나를 어떻게 볼지 조금 신경 쓰인다.'
    },
    {
      id: 'heroine5',
      name: '이메이',
      surface: '분위기를 편하게 만들어야겠다.',
      subconscious: '둘 사이의 어색함이 빨리 풀리면 좋겠다.'
    }
  ]);
  assert.equal(JSON.stringify(model.media.mind_monitor_entries).includes('physical_reaction'), false);
  assert.equal(model.media.default_mind_character_id, 'heroine3');
});

test('Mind Monitor renders character tabs and surface/subconscious only', () => {
  const model = buildCompanyGameViewModel(contextWithMindMonitor());
  withFakeDocument(() => {
    const container = new FakeNode('div', 'mind-monitor');
    renderMindMonitor(container, model.media.mind_monitor_entries, { preferredId: 'heroine3' });

    assert.equal(container.children.length, 2);
    const tabs = container.children[0];
    const content = container.children[1];
    assert.deepEqual(tabs.children.map(button => button.textContent), ['김제나', '이메이']);
    assert.equal(tabs.children[0].ariaSelected, 'true');
    assert.equal(content.children[0].children[0].children[0].textContent, '표면의식');
    assert.equal(content.children[0].children[1].children[0].textContent, '잠재의식');
    assert.equal(JSON.stringify(container).includes('physical_reaction'), false);

    tabs.children[1].listeners.get('click')();
    assert.equal(container.dataset.selectedCharacterId, 'heroine5');
    assert.equal(tabs.children[1].ariaSelected, 'true');
    assert.equal(content.children[0].children[0].children[1].textContent, '분위기를 편하게 만들어야겠다.');
  });
});

test('Mind Monitor keeps an explicit empty state instead of disappearing', () => {
  withFakeDocument(() => {
    const container = new FakeNode('div', 'mind-monitor');
    renderMindMonitor(container, []);
    assert.equal(container.children.length, 1);
    assert.equal(container.children[0].textContent, '이번 턴 Mind Monitor 정보가 없습니다.');
  });
});

test('main story history omits duplicate turn summaries while the history modal keeps them', () => {
  const turns = [{
    player_action: '보고서를 본다.',
    parsed_blocks: { blocks: [{ type: 'scene', text: '서사 본문' }] },
    turn_summary: '짧은 턴 요약'
  }];
  withFakeDocument(() => {
    const main = new FakeNode('div', 'story-history');
    const modal = new FakeNode('div', 'history-list');
    renderHistory(main, turns);
    renderHistory(modal, turns);
    assert.equal(main.children[0].children.length, 2);
    assert.equal(modal.children[0].children.length, 3);
    assert.equal(modal.children[0].children[2].textContent, '짧은 턴 요약');
  });
});

test('Company /api/tts uses the existing TTS Worker service binding and streams its audio URL', async () => {
  const bindingCalls = [];
  const audioFetches = [];
  const worker = createApiWorker({
    fetchImpl: async url => {
      audioFetches.push(String(url));
      if (String(url) === 'https://audio.test/heroine3.mp3') {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
      }
      throw new Error(`unexpected fetch ${url}`);
    }
  });
  const env = {
    TTS_WORKER_URL: 'https://fancy-dust-7f8c.zeroslove.workers.dev/',
    TTS_WORKER: {
      async fetch(url, init) {
        bindingCalls.push({ url: String(url), body: JSON.parse(init.body) });
        return new Response(JSON.stringify({ url: 'https://audio.test/heroine3.mp3' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
    }
  };
  const request = new Request('https://company-api.test/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      game_id: gameId,
      character_id: 'heroine3',
      text: '보고서를 함께 볼까요?',
      direction: '조심스럽게'
    })
  });

  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(bindingCalls, [{
    url: 'https://fancy-dust-7f8c.zeroslove.workers.dev/',
    body: {
      voice_id: '46939387dd944a45a399bd92b8de52cb',
      text: '보고서를 함께 볼까요?',
      direction: '조심스럽게'
    }
  }]);
  assert.deepEqual(audioFetches, ['https://audio.test/heroine3.mp3']);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
});

test('Company /api/tts rejects a missing service binding and unknown speakers before synthesis', async () => {
  const worker = createApiWorker({ fetchImpl: async () => { throw new Error('must not fetch'); } });
  const makeRequest = characterId => new Request('https://company-api.test/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, character_id: characterId, text: '대사' })
  });

  const missingBinding = await worker.fetch(makeRequest('heroine3'), {});
  assert.equal(missingBinding.status, 500);
  assert.equal((await missingBinding.json()).error.code, 'configuration_error');

  let bindingCalls = 0;
  const unknown = await worker.fetch(makeRequest('unknown-character'), {
    TTS_WORKER: { async fetch() { bindingCalls += 1; return new Response(); } }
  });
  assert.equal(unknown.status, 422);
  assert.equal((await unknown.json()).error.code, 'unknown_speaker');
  assert.equal(bindingCalls, 0);
});

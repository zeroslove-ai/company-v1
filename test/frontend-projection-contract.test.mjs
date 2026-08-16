import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiWorker } from '../src/api/index.js';
import { buildSceneStatePatch } from '../src/engine/state/physical-state.js';
import { renderHistory, renderMindMonitor } from '../src/frontend/pages/render.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';
import { createTurnLoadingOverlay } from '../src/frontend/pages/loading-overlay.js';

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
  remove() { this.removed = true; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this[name] = value; }
}

class FakeEventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type) { this.listeners.delete(type); }
  dispatch(type, detail) { this.listeners.get(type)?.({ detail }); }
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
        scene: { version: 1, scene_id: 'office', location_id: 'office', beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine3', 'heroine5'], focal_character_id: 'heroine3', last_speaker_id: 'heroine5', updated_turn: 3 },
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

/* legacy Mind Monitor normalizer implementation-detail test removed
  const normalized = normalizeMindMonitor({
    heroine3: {
      surface: '겉으로 인식하는 생각',
      subconscious: '말로 인정하지 않는 속마음',
      physical_reaction: '삭제 대상',
      body: '삭제 대상'
    }
  });
  assert.deepEqual(normalized.mind_monitor, {
    heroine3: { surface: '겉으로 인식하는 생각', subconscious: '말로 인정하지 않는 속마음' }
  });
  assert.equal(JSON.stringify(normalized.mind_monitor).includes('physical_reaction'), false);
  assert.equal(JSON.stringify(normalized.mind_monitor).includes('body'), false);
  assert.equal(normalized.warnings.some(warning => warning.includes(':body')), true);
});

*/
test('Mind Monitor renders a compact body plus preserved surface/subconscious lines', () => {
  const model = buildCompanyGameViewModel(contextWithMindMonitor());
  withFakeDocument(() => {
    const container = new FakeNode('div', 'mind-monitor');
    renderMindMonitor(container, model.media.mind_monitor_entries, { preferredId: 'heroine3' });

    assert.equal(container.children.length, 2);
    const tabs = container.children[0];
    const content = container.children[1];
    assert.deepEqual(tabs.children.map(button => button.textContent), ['김제나', '이메이']);
    assert.equal(tabs.children[0].ariaSelected, 'true');
    assert.deepEqual(content.children[0].children.map(item => item.children[0].textContent), ['호감', '수용', '흥분', '저항']);
    assert.equal(content.children[1].className, 'mind-monitor-body');
    assert.equal(content.children[1].children[0].className, 'mind-line');
    assert.equal(content.children[1].children[1].className, 'mind-line');
    assert.equal(content.children[1].children[0].children[0].textContent, '표면의식');
    assert.equal(content.children[1].children[1].children[0].textContent, '잠재의식');
    // 캐릭터 이름이 Mind Monitor에 표시된다 (신규)
    assert.equal(content.children[2].textContent, '김제나');
    assert.equal(JSON.stringify(container).includes('physical_reaction'), false);

    tabs.children[1].listeners.get('click')();
    assert.equal(container.dataset.selectedCharacterId, 'heroine5');
    assert.equal(tabs.children[1].ariaSelected, 'true');
    assert.match(content.children[1].children[0].children[1].textContent, /분위기를 편하게 만들어야겠다\./);
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

test('loading status is a dismissible DOM state and does not own Story content', () => {
  const body = new FakeNode('body');
  const documentRef = { body, createElement: tag => new FakeNode(tag), getElementById: () => null };
  const eventTarget = new FakeEventTarget();
  const controller = createTurnLoadingOverlay({ documentRef, eventTarget, MutationObserverImpl: null });

  assert.equal(body.children.length, 1);
  assert.equal(controller.overlay.hidden, true);
  eventTarget.dispatch('company:pending-step', { step: 'story' });
  assert.equal(controller.overlay.hidden, false);
  controller.hide();
  assert.equal(controller.overlay.hidden, true);
  controller.destroy();
  assert.equal(controller.overlay.removed, true);
});

test('physical state accepts evidenced position labels and carries them across unrelated turns', () => {
  const evidence = '김제나는 플레이어 앞에 무릎을 꿇고 보고서를 무릎 위에 펼쳐 보이고 있다.';
  const first = buildSceneStatePatch({
    previous: {},
    proposal: {
      posture: 'kneeling',
      position_label: '플레이어 앞에 무릎을 꿇고 보고서를 무릎 위에 펼쳐 보이고 있다',
      evidence: { posture: evidence, position: evidence }
    },
    evidenceMap: { posture: evidence, position: evidence },
    narrativeText: evidence,
    characterName: '김제나',
    turnNumber: 4
  });
  assert.equal(first.state.posture, 'kneeling');
  assert.equal(first.state.position_label, '플레이어 앞에 무릎을 꿇고 보고서를 무릎 위에 펼쳐 보이고 있다');
  assert.deepEqual(first.warnings, []);

  const carried = buildSceneStatePatch({ previous: first.state, proposal: {}, narrativeText: '김제나는 업무 이야기를 계속한다.', characterName: '김제나', turnNumber: 5 });
  assert.equal(carried.state.posture, 'kneeling');
  assert.equal(carried.state.position_label, first.state.position_label);
});

test('physical state rejects invented posture and position changes without exact Story evidence', () => {
  const previous = {
    location_label: '사무실',
    posture: 'sitting',
    position_label: '플레이어 맞은편 의자에 앉아 있다',
    clothing: {},
    updated_turn: 2
  };
  const result = buildSceneStatePatch({
    previous,
    proposal: {
      posture: 'kneeling',
      position_label: '플레이어 앞에 무릎을 꿇고 있다',
      posture_end_reason: 'explicit_change'
    },
    evidenceMap: {
      posture: 'Story에 존재하지 않는 문장',
      position: 'Story에 존재하지 않는 문장',
      posture_end_reason: 'Story에 존재하지 않는 문장'
    },
    narrativeText: '김제나는 보고서 이야기를 계속한다.',
    characterName: '김제나',
    turnNumber: 3
  });
  // Evidence-free optional posture/position projections preserve committed state.
  assert.equal(result.state.posture, 'sitting');
  assert.equal(result.state.position_label, '플레이어 맞은편 의자에 앉아 있다');
  assert.equal('location_label' in result.state, false);
  assert.equal(result.warnings.includes('unevidenced_posture_change'), true);
  assert.equal(result.warnings.includes('unevidenced_position_label'), true);
  assert.equal(result.warnings.includes('unevidenced_posture_end_reason'), true);
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

test('Company /api/tts uses the existing TTS Worker service binding and returns its audio URL without a second fetch', async () => {
  const bindingCalls = [];
  let secondaryFetches = 0;
  const worker = createApiWorker({
    fetchImpl: async url => {
      secondaryFetches += 1;
      throw new Error(`the API Worker must not download generated audio: ${url}`);
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
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(bindingCalls, [{
    url: 'https://fancy-dust-7f8c.zeroslove.workers.dev/',
    body: {
      voice_id: '46939387dd944a45a399bd92b8de52cb',
      text: '보고서를 함께 볼까요?',
      direction: '조심스럽게'
    }
  }]);
  assert.equal(secondaryFetches, 0);
  assert.deepEqual(await response.json(), {
    ok: true,
    data: { url: 'https://audio.test/heroine3.mp3' }
  });
});

test('Company /api/tts rejects a missing service binding and unknown speakers before synthesis', async () => {
  const worker = createApiWorker({ fetchImpl: async () => { throw new Error('must not fetch'); } });
  const makeRequest = characterId => new Request('https://company-api.test/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, character_id: characterId, text: '대사' })
  });

  const missingBinding = await worker.fetch(makeRequest('heroine3'), {
    TTS_API_URL: 'https://legacy-tts.test/synthesize',
    TTS_API_KEY: 'legacy-key'
  });
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

test('Company /api/tts maps a service-binding upstream failure to the canonical 502 error', async () => {
  const worker = createApiWorker();
  const response = await worker.fetch(new Request('https://company-api.test/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, character_id: 'heroine3', text: '안녕하세요.' })
  }), {
    TTS_WORKER: { async fetch() { return new Response('upstream failed', { status: 502 }); } }
  });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, 'tts_upstream_failure');
});

test('Company /api/tts rejects invalid or incomplete service-binding JSON responses', async () => {
  const makeRequest = () => new Request('https://company-api.test/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, character_id: 'heroine3', text: '안녕하세요.' })
  });
  for (const payload of ['not-json', JSON.stringify({}), JSON.stringify({ url: '' })]) {
    const response = await createApiWorker().fetch(makeRequest(), {
      TTS_WORKER: {
        async fetch() {
          return new Response(payload, { status: 200, headers: { 'content-type': 'application/json' } });
        }
      }
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error.code, 'tts_invalid_response');
  }
});

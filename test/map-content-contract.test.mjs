import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { enrichContextEnvelope } from '../src/api/product-response.js';
import { renderHistory } from '../src/frontend/pages/render.js';
import { createFrontendApp, mergeSessionTurns } from '../src/frontend/pages/app.js';
import {
  buildCompanyMapModel,
  locationPromptText,
  npcPromptText,
  renderCompanyMap
} from '../src/frontend/pages/company-map.js';

const locations = edition.map.locations;
const characters = edition.characters.characters;

function save() {
  return {
    scene_state: {
      location_id: 'brand_strategy_meeting_room',
      participants: ['player-1', 'heroine2']
    },
    npc_scene_state: {
      heroine1: { location_id: 'brand_strategy_office', present: false },
      heroine2: { location_id: 'brand_strategy_meeting_room', present: true },
      heroine5: { location_id: 'brand_strategy_office', present: false }
    }
  };
}

function flattenPlaces(model) {
  return model.floors.flatMap(floor => floor.places);
}

test('회사맵 제품: API context 보강 응답에 24개 맵 장소와 NPC 기본 위치가 들어간다', () => {
  const payload = { ok: true, data: { context: { save: { data: save() }, recent_turns: [] } } };
  enrichContextEnvelope(payload, edition);
  const display = payload.data.context.display;
  assert.equal(display.map_locations.length, 24);
  assert.equal(display.npc_default_locations.heroine2, 'brand_strategy_office');
  assert.ok(display.map_locations.some(location => location.location_id === 'audit_office'));
  assert.ok(display.map_locations.some(location => location.location_id === 'design_office'));
});

test('회사맵 제품: 1~5층과 빈 장소를 포함한 전체 24개 구조도를 유지한다', () => {
  const model = buildCompanyMapModel({ save: save(), characters, locations });
  assert.deepEqual(model.floors.map(floor => floor.floor), [5, 4, 3, 2, 1]);
  assert.equal(flattenPlaces(model).length, 24);
  assert.equal(model.player_location_name, '브랜드전략팀 회의실');
  assert.equal(model.current_floor, 3);
  assert.deepEqual(model.scene_npc_names, ['윤민아']);
  assert.ok(flattenPlaces(model).some(place => place.location_id === 'training_room' && place.npcs.length === 0));
});

test('회사맵 제품: 번들 맵 기본 배치만으로 일반 NPC 8명을 표시한다', () => {
  const model = buildCompanyMapModel({ save: save(), characters, locations });
  const people = flattenPlaces(model).flatMap(place => place.npcs);
  for (const name of ['박정우', '이민석', '최유진', '서혜진', '오세훈', '윤태경', '정다은', '한지석']) {
    assert.ok(people.some(npc => npc.name === name), `${name} 기본 위치 누락`);
  }
  assert.equal(people.find(npc => npc.name === '윤민아')?.inScene, true);
  assert.equal(people.find(npc => npc.name === '서원희')?.inScene, false);
});

test('회사맵 제품: 한국어 조사에 맞는 이동·찾아가기 문장을 만든다', () => {
  assert.equal(locationPromptText('브랜드전략팀 사무실'), '브랜드전략팀 사무실로 이동한다');
  assert.equal(locationPromptText('교육장'), '교육장으로 이동한다');
  assert.equal(npcPromptText('윤민아'), '윤민아를 찾아간다');
  assert.equal(npcPromptText('한지석'), '한지석을 찾아간다');
});

class FakeClassList {
  constructor(node) { this.node = node; }
  add(name) {
    const values = new Set(String(this.node.className ?? '').split(/\s+/).filter(Boolean));
    values.add(name);
    this.node.className = [...values].join(' ');
  }
}

class FakeNode {
  constructor(tag, doc) {
    this.tagName = String(tag).toUpperCase();
    this.ownerDocument = doc;
    this.children = [];
    this.className = '';
    this.classList = new FakeClassList(this);
    this.dataset = {};
    this.listeners = {};
    this.textContent = '';
    this.innerHTML = '';
    this.open = false;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  focus() {}
}

class FakeDocument {
  constructor() {
    this.head = new FakeNode('head', this);
    this.links = [];
  }
  createElement(tag) { return new FakeNode(tag, this); }
  querySelector(selector) {
    if (selector === 'link[data-company-map-style]') return this.links[0] ?? null;
    return null;
  }
}

function walk(node) {
  return [node, ...node.children.flatMap(walk)];
}

test('회사맵 제품: 실제 DOM 렌더가 빈 패널이 아니며 클릭은 문장만 채운다', () => {
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = () => { networkCalls += 1; throw new Error('맵은 네트워크를 호출하면 안 된다'); };
  try {
    const doc = new FakeDocument();
    const container = new FakeNode('div', doc);
    const model = buildCompanyMapModel({ save: save(), characters, locations });
    const filled = [];
    renderCompanyMap(container, model, { onFill: value => filled.push(value) });
    const nodes = walk(container);
    assert.ok(nodes.some(node => node.className.includes('company-map-current')));
    assert.equal(nodes.filter(node => String(node.className).split(/\s+/).includes('company-map-place')).length, 24);
    const office = nodes.find(node => node.className === 'company-map-place-name' && node.textContent.includes('브랜드전략팀 사무실'));
    const minah = nodes.find(node => node.className.includes('company-map-npc') && node.textContent === '윤민아');
    assert.ok(office?.listeners.click, '장소 클릭 handler 없음');
    assert.ok(minah?.listeners.click, 'NPC 클릭 handler 없음');
    office.listeners.click();
    minah.listeners.click();
    assert.deepEqual(filled, ['브랜드전략팀 사무실로 이동한다', '윤민아를 찾아간다']);
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ── History timeline: 세션 단위 누적 (새 브라우저 세션 = 최신 1턴 + 메모리 누적) ─

test('timeline: 프론트는 최초 로드에 최근 1턴만 요청한다', async () => {
  const { FRONTEND_CONFIG } = await import('../src/frontend/pages/config.js');
  assert.equal(FRONTEND_CONFIG.recentTurns, 1, '최초 로드는 최신 1턴만 받아온다');
});

test('timeline: renderHistory는 넘겨받은 턴 수만큼 카드를 만든다 (1/5/20/25)', async () => {
  const { renderHistory } = await import('../src/frontend/pages/render.js');
  const turn = n => ({
    turn_number: n,
    player_action: `행동 ${n}`,
    turn_summary: `요약 ${n}`,
    parsed_blocks: { blocks: [{ type: 'scene', text: `장면 ${n}` }], choices: [] }
  });
  // 세션 누적 기록은 잘리지 않는다 — 넘겨받은 만큼 그대로 카드가 된다.
  const cases = [[1, 1], [5, 5], [20, 20], [25, 25]];
  for (const [total, expected] of cases) {
    const turns = Array.from({ length: total }, (_, i) => turn(i + 1));
    const doc = new FakeDocument();
    const container = new FakeNode('div', doc);
    const previousDocument = globalThis.document;
    globalThis.document = doc;
    try { renderHistory(container, turns, { showSummary: true }); }
    finally { globalThis.document = previousDocument; }
    const cards = container.children.filter(child => child.className === 'turn-card');
    assert.equal(cards.length, expected, `${total}턴 → ${expected}장 기대`);
  }
});

test('timeline: 세션 기록이 비어 있을 때만 recent_turns/opening fallback을 쓴다', () => {
  const openingTurn = { turn_number: 0, player_action: '오프닝' };
  const pick = (session, recent) => (session.length ? session : (recent.length ? recent : (openingTurn ? [openingTurn] : [])));
  assert.equal(pick([], []).length, 1, '세션·API 모두 비어 있으면 opening');
  assert.equal(pick([], [])[0], openingTurn);
  const three = [{ turn_number: 1 }, { turn_number: 2 }, { turn_number: 3 }];
  assert.deepEqual(pick(three, [{ turn_number: 4 }]), three, '세션 기록이 있으면 API recent_turns로 덮어쓰지 않는다');
  assert.deepEqual(pick([], [{ turn_number: 9 }]), [{ turn_number: 9 }], '세션이 비면 API recent_turns를 사용');
});

// ── 세션 단위 타임라인 통합 (createFrontendApp + mock api) ────────────────

function pageFixture() {
  const ids = ['game-main', 'game-title', 'day-time', 'turn-number', 'api-status', 'status-banner', 'error-banner', 'story-history', 'current-story', 'current-action', 'choice-list', 'player-action', 'submit-action', 'recovery-action', 'stream-status', 'scene-state', 'focal-character', 'mind-monitor', 'player-situation', 'resume-play', 'open-history', 'send-feedback', 'open-apps', 'reset-game', 'player-setup-overlay', 'player-setup-form', 'setup-error', 'setup-status', 'setup-submit', 'setup-name', 'setup-department', 'setup-position', 'setup-age', 'setup-height', 'setup-weight', 'setup-penis-length', 'setup-body-type', 'setup-speech-style'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id)]));
  return { nodes, documentRef: { querySelector: selector => nodes[selector.slice(1)] ?? null, createElement: tag => new FakeNode(tag) } };
}

function validContext({ turns = [] } = {}) {
  return {
    game: { edition_id: 'company-v1', title: '상식개변: 회사편' },
    save: { committed_turn: 2, data: { edition: 'company-v1', save_schema_version: 1, turn_state: { committed_turn: 1 }, last_choices: ['A', 'B', 'C', 'D'], scene_state: { location_id: 'office' }, world_state: { day: 1, time_block: 'morning', game_time: { day: 1, minute_of_day: 742 } }, csa_active: ['csa-1'], player_setup: { completed: true } } },
    recent_turns: turns
  };
}

async function withFakeDocument(run) {
  const previousDocument = globalThis.document;
  const fixture = pageFixture();
  globalThis.document = fixture.documentRef;
  try { return await run(fixture); } finally { globalThis.document = previousDocument; }
}

function fakeStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

const sessionTurn = n => ({
  turn_number: n,
  player_action: `행동 ${n}`,
  turn_summary: `요약 ${n}`,
  parsed_blocks: { blocks: [{ type: 'scene', text: `장면 ${n}` }], choices: [] }
});

test('session timeline: 최초 로드는 recent_turns=1을 요청하고 최신 1턴만 표시한다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    const context = validContext({ turns: [sessionTurn(32)] });
    let requestedTurns = null;
    const api = {
      context: async ({ recent_turns }) => { requestedTurns = recent_turns; return { context }; },
      actionStatus: async () => ({})
    };
    const app = createFrontendApp({ documentRef, storage: fakeStorage(), api });
    await app.refreshContext();
    assert.equal(requestedTurns, 1, '최초 API 요청은 recent_turns=1');
    const cards = nodes['story-history'].children.filter(child => child.className === 'turn-card');
    assert.equal(cards.length, 1, '최신 1턴만 표시한다');
    assert.equal(cards[0].children[0].textContent, '행동 32');
  });
});

test('session timeline: 같은 페이지에서 2턴 진행하면 카드가 누적되고 refresh는 삭제하지 않는다', async () => {
  await withFakeDocument(async ({ nodes, documentRef }) => {
    let recentTurns = [sessionTurn(32)];
    const base = validContext({ turns: recentTurns });
    const sseStory = () => new Response(
      'event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"[1. 서사 및 행동]\\n새로운 턴의 이야기입니다."}\n\nevent: complete\ndata: {"parsed_blocks":{"blocks":[{"type":"scene","text":"새로운 턴의 이야기입니다."}]}}\n\n',
      { headers: { 'content-type': 'text/event-stream' } }
    );
    const api = {
      context: async () => ({ context: { ...base, recent_turns: recentTurns } }),
      actionStatus: async () => ({}),
      story: async () => sseStory(),
      extract: async () => ({ extract: {}, parsed_blocks: { blocks: [] } }),
      commit: async () => {
        recentTurns = [...recentTurns, sessionTurn(recentTurns.length + 32)];
        return { commit: { success: true } };
      }
    };
    const app = createFrontendApp({ documentRef, storage: fakeStorage(), api });
    await app.refreshContext(); // 최초 로드: 최신 1턴
    const cards = () => nodes['story-history'].children.filter(child => child.className === 'turn-card');
    assert.equal(cards().length, 1, '최초 1턴');
    await app.startNewAction('새 행동 1'); // 턴 33 commit
    assert.equal(cards().length, 2, '1턴 진행 후 2턴');
    await app.startNewAction('새 행동 2'); // 턴 34 commit
    assert.equal(cards().length, 3, '2턴 진행 후 3턴');
    await app.refreshContext(); // refresh가 최신 1턴(34)만 돌려줘도 세션 기록 유지
    assert.equal(cards().length, 3, 'context refresh 후에도 3턴 유지');
    const merged = mergeSessionTurns(recentTurns, [sessionTurn(34)]);
    assert.deepEqual(merged.map(turn => turn.turn_number), [32, 33, 34], 'session timeline은 오래된 턴부터 정렬한다');
    assert.equal(merged.length, 3, '동일 턴 재수신에도 중복이 생기지 않는다');
    assert.equal(new Set(merged.map(t => t.turn_number)).size, 3, 'turn_number 중복 없음');
  });
});

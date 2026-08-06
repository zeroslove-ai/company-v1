import test from 'node:test';
import assert from 'node:assert/strict';
import edition from '../src/api/edition.js';
import { enrichContextEnvelope } from '../src/api/product-response.js';
import { renderHistory } from '../src/frontend/pages/render.js';
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

// ── History timeline 회귀 (이전 작업 미작성 항목) ─────────────────────────

test('timeline: 프론트가 최근 20턴을 요청한다 (recentTurns=1이면 slice(-20)이 무의미)', async () => {
  const { FRONTEND_CONFIG } = await import('../src/frontend/pages/config.js');
  assert.equal(FRONTEND_CONFIG.recentTurns, 20, '요청 자체가 20턴이어야 timeline이 이어진다');
});

test('timeline: renderHistory는 넘겨받은 턴 수만큼 카드를 만든다 (1/5/20/21)', async () => {
  const { renderHistory } = await import('../src/frontend/pages/render.js');
  const turn = n => ({
    turn_number: n,
    player_action: `행동 ${n}`,
    turn_summary: `요약 ${n}`,
    parsed_blocks: { blocks: [{ type: 'scene', text: `장면 ${n}` }], choices: [] }
  });
  const cases = [[1, 1], [5, 5], [20, 20], [25, 20]];
  for (const [total, expected] of cases) {
    const turns = Array.from({ length: total }, (_, i) => turn(i + 1));
    const shown = turns.length ? turns.slice(-20) : turns;
    const doc = new FakeDocument();
    const container = new FakeNode('div', doc);
    const previousDocument = globalThis.document;
    globalThis.document = doc;
    try { renderHistory(container, shown, { showSummary: true }); }
    finally { globalThis.document = previousDocument; }
    const cards = container.children.filter(child => child.className === 'turn-card');
    assert.equal(cards.length, expected, `${total}턴 → ${expected}장 기대`);
  }
});

test('timeline: recent_turns가 비어 있을 때만 opening turn fallback을 쓴다', () => {
  const openingTurn = { turn_number: 0, player_action: '오프닝' };
  const pick = recent => (recent.length ? recent.slice(-20) : (openingTurn ? [openingTurn] : recent));
  assert.equal(pick([]).length, 1, '비어 있으면 opening');
  assert.equal(pick([])[0], openingTurn);
  const three = [{ turn_number: 1 }, { turn_number: 2 }, { turn_number: 3 }];
  assert.deepEqual(pick(three), three, '턴이 있으면 opening을 쓰지 않는다');
});

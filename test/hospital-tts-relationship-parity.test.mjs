import test from 'node:test';
import assert from 'node:assert/strict';

import { batchDialogueLines, createHospitalTts, dialogueLinesFromDom } from '../src/frontend/pages/tts.js';
import { renderHospitalRelationshipIcons } from '../src/frontend/pages/relationship-icons.js';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  toggle(value, enabled) { if (enabled) this.values.add(value); else this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}

class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.muted = false;
    this.src = '';
    this.currentTime = 0;
    this.playCalls = 0;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? (name === 'src' ? this.src : null); }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'src') this.src = ''; }
  load() {}
  pause() {}
  play() { this.playCalls += 1; return Promise.resolve(); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

function dialogueDocument() {
  const audio = new FakeNode('audio');
  const toggle = new FakeNode('button');
  const replay = new FakeNode('button');
  const status = new FakeNode('p');
  const turn = new FakeNode('span'); turn.textContent = 'Turn 7';
  const mind = new FakeNode('div'); mind.dataset.selectedCharacterId = 'heroine1';
  const history = new FakeNode('div');
  const current = new FakeNode('div');
  const card = new FakeNode('article');
  const speaker = new FakeNode('strong'); speaker.textContent = '서원희';
  const direction = new FakeNode('span'); direction.textContent = '차분하게';
  const line = new FakeNode('p'); line.textContent = '병원편 방식으로 직접 재생합니다.';
  card.querySelector = selector => ({ '.dialogue-speaker': speaker, '.dialogue-direction': direction, '.dialogue-text': line }[selector] ?? null);
  current.querySelectorAll = selector => selector === '.dialogue-card' ? [card] : [];
  const tab = new FakeNode('button'); tab.textContent = '서원희'; tab.dataset.characterId = 'heroine1';
  const nodes = {
    'audio-player': audio, 'tts-toggle': toggle, 'tts-replay': replay, 'tts-status': status,
    'turn-number': turn, 'mind-monitor': mind, 'story-history': history, 'current-story': current
  };
  const documentRef = {
    defaultView: { location: { href: 'https://game.example/?game=11111111-1111-4111-8111-111111111111' } },
    body: new FakeNode('body'),
    getElementById: id => nodes[id] ?? null,
    querySelector: selector => selector === '#story-history .turn-card:last-child' ? null : null,
    querySelectorAll: selector => selector === '.mind-monitor-tab' ? [tab] : [],
    createElement: tag => new FakeNode(tag)
  };
  return { documentRef, audio, replay, status };
}

async function settle() {
  for (let index = 0; index < 6; index += 1) await new Promise(resolve => setImmediate(resolve));
}

test('Hospital TTS extracts a rendered dialogue card and plays the Worker URL directly on manual replay', async () => {
  const { documentRef, audio, replay } = dialogueDocument();
  const calls = [];
  const controller = createHospitalTts({
    documentRef,
    api: { tts: async body => { calls.push(body); return { url: 'https://audio.example/line.mp3' }; } },
    storage: storage({ autoTts: 'false' }),
    session: storage(),
    MutationObserverImpl: null,
    AudioContextImpl: null,
    setTimeoutImpl: () => 0
  });
  assert.equal(controller.init(), true);
  assert.deepEqual(dialogueLinesFromDom(documentRef), [{
    speaker: '서원희', character_id: 'heroine1', text: '병원편 방식으로 직접 재생합니다.', direction: '차분하게', order: 0
  }]);
  controller.prepareLatest();
  assert.equal(replay.hidden, false);
  assert.equal(replay.disabled, false);
  assert.equal(await controller.replay(), true);
  await settle();
  assert.deepEqual(calls, [{
    game_id: '11111111-1111-4111-8111-111111111111',
    character_id: 'heroine1',
    text: '병원편 방식으로 직접 재생합니다.',
    direction: '차분하게'
  }]);
  assert.equal(audio.src, 'https://audio.example/line.mp3');
  assert.ok(audio.playCalls >= 2, 'silent priming and real URL playback must both touch the persistent audio element');
});

test('Hospital TTS batches only adjacent lines with the same speaker and tone', () => {
  const batches = batchDialogueLines([
    { speaker: '서원희', character_id: 'heroine1', direction: '차분하게', text: '첫 문장' },
    { speaker: '서원희', character_id: 'heroine1', direction: '담담하게', text: '둘째 문장' },
    { speaker: '윤민아', character_id: 'heroine2', direction: '차분하게', text: '다른 화자' }
  ]);
  assert.equal(batches.length, 2);
  assert.equal(batches[0].text, '첫 문장 둘째 문장');
  assert.equal(batches[1].character_id, 'heroine2');
});

function relationshipFixture() {
  const documentRef = { createElement: tag => new FakeNode(tag) };
  const section = new FakeNode('section');
  section.ownerDocument = documentRef;
  const heading = new FakeNode('h3'); heading.textContent = '관계·사정 기록';
  const dl = new FakeNode('dl');
  const values = [
    ['플레이어 사정', '2회'], ['NPC 절정', '3회'], ['질 성교', '1회'], ['애널 성교', '0회'], ['구강 성교', '4회'],
    ['질내 사정', '1회'], ['애널내 사정', '0회'], ['입안 사정', '2회'], ['얼굴 사정', '0회'], ['몸 사정', '1회'],
    ['성적 이벤트', '7건'], ['완료/중단', '5 / 2'], ['첫 기록', 'Turn 4'], ['최근 기록', 'Turn 11']
  ];
  for (const [label, value] of values) {
    const dt = new FakeNode('dt'); dt.textContent = label;
    const dd = new FakeNode('dd'); dd.textContent = value;
    dl.append(dt, dd);
  }
  section.querySelector = selector => selector === 'h3' ? heading : selector === 'dl' ? dl : null;
  return section;
}

function flattenedText(node) {
  return [node.textContent, ...node.children.flatMap(child => flattenedText(child))].filter(Boolean);
}

test('relationship record is transformed into Hospital icon summary and collapsible details', () => {
  const section = relationshipFixture();
  assert.equal(renderHospitalRelationshipIcons(section), true);
  assert.equal(section.classList.contains('relationship-icon-card'), true);
  const labels = flattenedText(section);
  for (const expected of ['관계 기록', '✨ 절정', '💦 사정', '🌸 질', '🍑 애널', '👄 구강', '상세 기록', '💦 질내', '🍑 애널내', '👄 입안']) {
    assert.ok(labels.includes(expected), `${expected} icon/label must be rendered`);
  }
  assert.ok(labels.includes('3'));
  assert.ok(labels.includes('2'));
  assert.equal(renderHospitalRelationshipIcons(section), false, 'an already enhanced card must not be transformed twice');
});

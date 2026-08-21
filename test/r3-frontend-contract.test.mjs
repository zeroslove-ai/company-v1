import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
const client = await readFile(new URL('../frontend-r3/r3-client.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../frontend-r3/index.html', import.meta.url), 'utf8');
const render = await readFile(new URL('../frontend-r3/render.js', import.meta.url), 'utf8');
const setup = await readFile(new URL('../frontend-r3/setup.js', import.meta.url), 'utf8');
const map = await readFile(new URL('../frontend-r3/company-map.js', import.meta.url), 'utf8');

test('R3 frontend sends exact literal input through one server turn endpoint', () => {
  assert.match(app, /literal_action: literalAction/);
  assert.match(app, /choice-list/);
  assert.match(app, /renderCompanyMap/);
  assert.match(app, /renderMindMonitor/);
  assert.match(render, /renderNarrative/);
  assert.match(render, /parsePlainStoryForPresentation/);
  assert.match(map, /company-map-floor/);
  assert.match(map, /onFill/);
  assert.match(setup, /validateSetupValues/);
  assert.match(client, /\/turn/);
  assert.doesNotMatch(app, /createTurnCoordinator|\/extract|\/commit/);
  assert.doesNotMatch(client, /\/extract|\/commit/);
  assert.match(html, /id="player-action"/);
  assert.match(html, /data-phase="milestone0-r3"/);
  assert.match(html, /id="tts-toggle"[^>]*disabled/);
});

test('R3 presentation adapter preserves raw Story and canonical choice literals', async () => {
  const { narrativeChoiceItems, parsePlainStoryForPresentation, renderChoices, renderNarrative } = await import('../frontend-r3/render.js');
  const choices = ['첫 번째 행동을 한다.', '두 번째 행동을 한다.', '세 번째 행동을 한다.', '네 번째 행동을 한다.'];
  const parsed = parsePlainStoryForPresentation(`장면 설명이다.\n서원희(조금 고개를 기울이며): "안녕하세요."\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n4. ${choices[3]}`, { choices, actorNames: { heroine1: '서원희' } });
  assert.equal(parsed.blocks.length, 2);
  assert.deepEqual(parsed.blocks[1], { type: 'dialogue', speaker: '서원희', direction: '조금 고개를 기울이며', text: '안녕하세요.' });
  assert.deepEqual(parsed.choices, choices);
  assert.deepEqual(narrativeChoiceItems(parsed.choices), choices);
  assert.equal(parsed.blocks.some(block => block.text.includes('1.')), false);
  const simple = parsePlainStoryForPresentation('서원희: "간단한 대사"', { actorNames: { heroine1: '서원희' } });
  assert.deepEqual(simple.blocks[0], { type: 'dialogue', speaker: '서원희', direction: '', text: '간단한 대사' });
  assert.match(render, /narrative-choices/);
  assert.match(render, /narrative-choice-item/);
  assert.match(render, /choiceLiteral/);
  assert.match(render, /dialogue-direction/);
  const fallback = parsePlainStoryForPresentation('구조를 알아볼 수 없는 원문입니다.', { choices });
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.raw, '구조를 알아볼 수 없는 원문입니다.');

  class FakeNode {
    constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = new Map(); this.textContent = ''; this.className = ''; this.disabled = false; }
    append(...nodes) { this.children.push(...nodes); }
    prepend(...nodes) { this.children.unshift(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, listener) { this.listeners.set(name, listener); }
  }
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const narrative = new FakeNode('narrative');
    renderNarrative(narrative, parsed);
    const dialogue = narrative.children[1];
    assert.equal(dialogue.className, 'narrative-dialogue dialogue-card');
    assert.deepEqual(dialogue.children[0].children.map(node => node.textContent), ['서원희', '조금 고개를 기울이며']);
    assert.equal(dialogue.children[1].textContent, '안녕하세요.');
    const narrativeChoices = narrative.children.at(-1);
    assert.equal(narrativeChoices.className, 'narrative-choices');
    assert.deepEqual(narrativeChoices.children[1].children.map(item => item.textContent), choices);
    const launcher = new FakeNode('launcher'); let chosen = null;
    renderChoices(launcher, parsed.choices, { onChoose: value => { chosen = value; } });
    assert.equal(launcher.children.length, 4);
    assert.deepEqual(launcher.children.map(button => button.title), choices);
    launcher.children[2].listeners.get('click')();
    assert.equal(chosen, choices[2]);
    assert.equal(narrativeChoiceItems(['only one']).length, 0);
  } finally { globalThis.document = previousDocument; }
});

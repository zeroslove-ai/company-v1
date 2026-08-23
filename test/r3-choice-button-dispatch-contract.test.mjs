import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { renderChoices } from '../frontend-r3/render.js';

class FakeNode {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.disabled = false;
    this.listeners = new Map();
    this.title = '';
    this.attributes = new Map();
  }

  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
}

function withFakeDocument(callback) {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: tag => new FakeNode(tag) };
  try { return callback(); } finally { globalThis.document = previousDocument; }
}

const currentChoices = [
  '자리에서 일어나 커피를 한 잔 더 따라온다.',
  '팀장에게 오늘 업무 지시가 있는지 물어본다.',
  '서류를 정리하며 주변 동료들의 분위기를 살핀다.',
  '책상 서랍을 슬쩍 열어 그 낯선 앱을 확인한다.'
];

test('enabled current choice submits exactly one canonical full literal', () => withFakeDocument(() => {
  const container = new FakeNode('choices');
  const submitted = [];
  renderChoices(container, currentChoices, { onChoose: value => submitted.push(value) });

  assert.equal(container.children.length, 4);
  assert.equal(container.children[1].disabled, false);
  assert.equal(container.children[1].title, currentChoices[1]);
  container.children[1].listeners.get('click')();
  assert.deepEqual(submitted, [currentChoices[1]]);
}));

test('busy choice controls are disabled and rerender does not duplicate controls', () => withFakeDocument(() => {
  const container = new FakeNode('choices');
  const submitted = [];
  renderChoices(container, currentChoices, { busy: true, onChoose: value => submitted.push(value) });
  assert.equal(container.children.length, 4);
  assert.equal(container.children.every(button => button.disabled), true);

  renderChoices(container, currentChoices, { onChoose: value => submitted.push(value) });
  assert.equal(container.children.length, 4);
  container.children[1].listeners.get('click')();
  assert.deepEqual(submitted, [currentChoices[1]]);
}));

test('desktop shell reserves separate rows for the visible gameplay surfaces', () => {
  const css = fs.readFileSync('frontend-r3/hospital-shell.css', 'utf8');
  assert.match(css, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto auto auto;/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../frontend-r3/app.js', import.meta.url), 'utf8');
const csa = await readFile(new URL('../frontend-r3/csa.js', import.meta.url), 'utf8');
const client = await readFile(new URL('../frontend-r3/r3-client.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../frontend-r3/index.html', import.meta.url), 'utf8');
const render = await readFile(new URL('../frontend-r3/render.js', import.meta.url), 'utf8');
const setup = await readFile(new URL('../frontend-r3/setup.js', import.meta.url), 'utf8');
const map = await readFile(new URL('../frontend-r3/company-map.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../frontend-r3/hospital-shell.css', import.meta.url), 'utf8');

const { resolveR3ApiBase } = await import('../frontend-r3/r3-config.js');

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
  assert.match(html, /id="player-inner-thought"/);
  assert.match(app, /renderPlayerInnerThought/);
  assert.match(render, /renderPlayerInnerThought/);
  assert.match(html, /data-phase="milestone0-r3"/);
  assert.match(html, /id="tts-toggle"[^>]*disabled/);
  assert.match(app, /openHistory/);
  assert.match(app, /history-download-md/);
  assert.match(app, /SpeechSynthesisUtterance/);
  assert.match(app, /historyExport/);
});

test('R3 boot fallback is dismissed after boot and API origin survives game URL updates', () => {
  assert.match(app, /setHidden\('boot-fallback', true\)/);
  assert.match(app, /setBootFailure\(error\)/);
  assert.match(app, /query\.has\('api'\)/);
  assert.match(app, /next\.searchParams\.set\('api', query\.get\('api'\)\)/);
  assert.match(app, /state\.busy = false; csaUi\.sync\(\); refreshChoices\(\)/);
  assert.match(app, /recoverPendingTurn/);
  assert.match(app, /context\.job\?\.status === 'processing'/);
  assert.match(app, /r3_stream_reconnect_required/);
  assert.doesNotMatch(app, /replaceState\(null, '', `\?game_id=/);
});

test('R3 refresh view model reconstructs the latest committed player thought', async () => {
  const { buildR3ViewModel } = await import('../frontend-r3/r3-view-model.js');
  const view = buildR3ViewModel({
    game: { game_id: 'thought-game', profile: { name: 'Player', department_id: 'brand_strategy', position_id: 'intern' } },
    state: { committed_turn: 1, state: { time: { day: 1, minute: 552 }, scene: { location_id: 'brand_strategy_office', present_actor_ids: [], scene_note: '' } } },
    turns: [{ turn_number: 1, story_text: 'Story', choices: ['a', 'b', 'c', 'd'], observer_applied: { player_inner_thought: '지금은 먼저 상황을 살펴보자.' } }]
  }, { locations: [], actors: [], departments: [], positions: [] });
  assert.equal(view.playerInnerThought, '지금은 먼저 상황을 살펴보자.');
});

test('R3 public frontend resolves its split TEST API origin without overriding explicit api query binding', () => {
  assert.equal(
    resolveR3ApiBase({ protocol: 'https:', hostname: 'gamebuilder-company-r3.zeroslove.workers.dev' }),
    'https://game-proxy-company-r3.zeroslove.workers.dev/api/r3'
  );
  assert.equal(resolveR3ApiBase({ protocol: 'http:', hostname: 'localhost' }), '/api/r3');
  assert.match(app, /query\.get\('api'\) \|\| resolveR3ApiBase\(\)/);
});

test('R3 free-input submit readiness mirrors the busy and failed guards', () => {
  assert.match(app, /function syncActionControls\(\)[\s\S]*submitAction\.disabled = state\.busy \|\| !state\.gameId \|\| state\.context\?\.job\?\.status === 'failed'/);
  assert.match(app, /state\.busy = true; syncActionControls\(\)/);
  assert.match(app, /finally \{ state\.busy = false; csaUi\.sync\(\); refreshChoices\(\); \}/);
  assert.doesNotMatch(app, /submit-action\.disabled = false/);
});

test('R3 CSA operation closes its modal before the normal turn can stream and re-syncs controls after busy clears', () => {
  assert.match(csa, /function transact\(operation\) \{[\s\S]*overlay\.hidden = true;[\s\S]*onOperation/);
  assert.match(app, /finally \{ state\.busy = false; csaUi\.sync\(\); refreshChoices\(\); \}/);
});

test('R3 action panel reserves its controls above the audio bar after bootstrap', () => {
  assert.match(shell, /\.action-panel\s*\{[\s\S]*?min-height:\s*min-content;/);
});

test('R3 failed job exposes editable literal and an explicit retry-only control', () => {
  assert.match(app, /context\?\.job\?\.status === 'failed'/);
  assert.match(app, /context\.job\.literal_action/);
  assert.match(app, /Retry failed action/);
  assert.match(app, /retryFailed = false/);
  assert.match(app, /payload\.retry_failed = true/);
  assert.match(app, /use the explicit retry control/);
  assert.match(app, /recovery-action.*submit\(null, \{ retryFailed: true \}\)/s);
  assert.doesNotMatch(app, /loadContext[\s\S]{0,500}retryFailed: true/);
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

test('R3 presentation adapter strips the supported symmetric emphasis choice tail', async () => {
  const { parsePlainStoryForPresentation } = await import('../frontend-r3/render.js');
  const choices = ['first complete action', 'second complete action', 'third complete action', 'fourth complete action'];
  const story = `Scene body.\n\n**1. ${choices[0]}**\n**2. ${choices[1]}**\n**3. ${choices[2]}**\n**4. ${choices[3]}**`;
  const parsed = parsePlainStoryForPresentation(story, { choices });
  assert.deepEqual(parsed.choices, choices);
  assert.equal(parsed.blocks.some(block => block.text.includes('**1.')), false);
  assert.equal(parsed.blocks.some(block => block.text.includes('first complete action')), false);
  const underscored = parsePlainStoryForPresentation(story.replace(/\*\*/g, '__'), { choices });
  assert.deepEqual(underscored.choices, choices);
  assert.equal(underscored.blocks.some(block => block.text.includes('__1.')), false);

  const malformed = parsePlainStoryForPresentation(story.replace('**4.', '*4.'), { choices });
  assert.deepEqual(malformed.choices, choices);
  assert.match(malformed.raw, /\*4\./);
});

test('R3 choice labels are presentation-only and clicks preserve the complete Story literal', async () => {
  const { renderChoices } = await import('../frontend-r3/render.js');
  const canonical = [String.raw`full \\"quoted\\" literal`, 'second complete action', 'third complete action', 'fourth complete action'];
  class FakeNode {
    constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.listeners = new Map(); this.textContent = ''; this.title = ''; this.disabled = false; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, listener) { this.listeners.set(name, listener); }
  }
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: tag => new FakeNode(tag) };
  try {
    const container = new FakeNode('choices'); let chosen = null;
    renderChoices(container, canonical, { onChoose: value => { chosen = value; } });
    assert.equal(container.children.length, 4);
    assert.deepEqual(container.children.map(button => button.title), canonical);
    assert.notEqual(container.children[0].textContent, canonical[0]);
    container.children[0].listeners.get('click')();
    assert.equal(chosen, canonical[0]);
  } finally { globalThis.document = previousDocument; }
});

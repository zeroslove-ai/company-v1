import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCsaApp } from '../src/frontend/pages/csa-app.js';
import { ApiError } from '../src/frontend/pages/api.js';
import { activeItems, applyPresetDefaults, createDraft, dirty, operations, presetPreviewContent } from '../src/frontend/pages/csa-app-state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const catalog = readJson('content/csa_presets.json');

function sampleAppState(overrides = {}) {
  return {
    turn_count: 3,
    home: { status: { level: 1, exp: 0, next_level_exp: 100, csa_active: 0, csa_max: 2 }, diagnostics: [] },
    strength_options: [{ id: 'weak', label: '약함', available: true, unlock_level: 1 }, { id: 'medium', label: '중간', available: false, unlock_level: 3 }, { id: 'strong', label: '강함', available: false, unlock_level: 7 }],
    csa_presets: { actor_options: catalog.actor_options, target_options: catalog.target_options, trigger_options: catalog.trigger_options, duration_options: catalog.duration_options, categories: catalog.categories, items: catalog.items.map(item => ({ ...item, available: item.strength === 'weak' })) },
    common_sense: [],
    manual: { title: '상식개변 앱 매뉴얼', status: { level: 1, exp: 0, next_level_exp: 100, csa_active: 0, csa_max: 2, csa_scope_label: '회사 전체' }, diagnostics: [], quick_start: [], common_sense: { rules: [], current_scope: { label: '회사 전체' }, tiers: [] }, unlocks: [], active_effects: { common_sense: [] }, common_failures: [] },
    ...overrides
  };
}

// ---------- Pure draft-state logic ----------

test('csa-app-state: activating a preset produces a valid operation, and dirty() reflects the draft diff', () => {
  const appState = sampleAppState();
  const draft = createDraft(appState, 'csa');
  assert.equal(dirty(appState, draft), false);
  const presetItem = catalog.items.find(item => item.strength === 'weak' && item.category === 'posture');
  const item = { _new: true, client_id: 'draft_1', source_type: 'preset', strength: null, content: '', modifier: '' };
  draft.csa.push(item);
  applyPresetDefaults(item, presetItem);
  assert.equal(dirty(appState, draft), true);
  const ops = operations(appState, draft);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].operation, 'activate');
  assert.equal(ops[0].domain, 'csa');
  assert.equal(presetPreviewContent(appState, item), presetItem.content_template);
  assert.equal(activeItems(draft).length, 1);
});

test('csa-app-state: deactivating an existing entry produces a deactivate operation keyed by id', () => {
  const appState = sampleAppState({ common_sense: [{ id: 'csa_1', source_type: 'custom', content: '자유 근무복을 허용한다', strength: 'weak', created_turn: 1 }] });
  const draft = createDraft(appState, 'csa');
  draft.csa[0]._deleted = true;
  const ops = operations(appState, draft);
  assert.deepEqual(ops, [{ client_id: 'csa:csa_1', domain: 'csa', operation: 'deactivate', id: 'csa_1' }]);
});

// ---------- DOM controller ----------

class FakeNode {
  constructor(tag) { this.tag = tag; this.children = []; this.className = ''; this.textContent = ''; this.hidden = false; this.disabled = false; this.onclick = null; this.onchange = null; this.oninput = null; this.listeners = new Map(); this.value = ''; this.dataset = {}; }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  setAttribute(name, value) { this[name] = value; }
  querySelectorAll(selector) {
    if (selector === '[data-tab]') return this.children.filter(child => child?.dataset?.tab !== undefined);
    return [];
  }
  prepend(node) { this.children.unshift(node); }
}

function pageFixture() {
  const ids = ['csa-app-overlay', 'csa-app-body', 'csa-app-draft-bar', 'csa-app-close', 'csa-app-tabs'];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode(id)]));
  const tabButtons = ['home', 'csa', 'manual'].map(tab => { const button = new FakeNode('button'); button.dataset.tab = tab; return button; });
  nodes['csa-app-tabs'].children = tabButtons;
  return { nodes, documentRef: { querySelector: selector => nodes[selector.slice(1)] ?? null, createElement: tag => new FakeNode(tag) } };
}

function findByText(node, text) {
  if (node.textContent === text) return node;
  for (const child of node.children ?? []) { const found = findByText(child, text); if (found) return found; }
  return null;
}
function findByTag(node, tag) {
  if (node.tag === tag) return node;
  for (const child of node.children ?? []) { const found = findByTag(child, tag); if (found) return found; }
  return null;
}
function findAllByTag(node, tag, out = []) {
  if (node.tag === tag) out.push(node);
  for (const child of node.children ?? []) findAllByTag(child, tag, out);
  return out;
}

test('csa app modal: open() fetches app-state once and renders the home tab', async () => {
  const { nodes, documentRef } = pageFixture();
  const appState = sampleAppState({ common_sense: [] });
  let appStateCalls = 0;
  let appStateArgs = null;
  const api = { appState: async (...args) => { appStateCalls += 1; appStateArgs = args; return { app: appState }; } };
  const csaApp = createCsaApp({ documentRef, api, gameId: 'game-1' });

  await csaApp.open('home');
  assert.equal(appStateCalls, 1);
  assert.equal(appStateArgs.length, 1, 'api.appState is called with exactly one argument');
  assert.notEqual(typeof appStateArgs[0], 'string', 'the argument must not be the bare game id string (that produces a non-object JSON body)');
  assert.deepEqual(appStateArgs[0], { game_id: 'game-1' });
  assert.equal(nodes['csa-app-overlay'].hidden, false);
  assert.equal(csaApp.isOpen(), true);
  assert.ok(findByText(nodes['csa-app-body'], 'Lv.1'));

  csaApp.close();
  assert.equal(nodes['csa-app-overlay'].hidden, true);
  assert.equal(csaApp.isOpen(), false);
});

test('csa app modal: a custom activation goes through app-validate exactly once, then hands off to onSubmit — never a separate save call', async () => {
  const { nodes, documentRef } = pageFixture();
  const appState = sampleAppState({ common_sense: [] });
  let validateCalls = 0;
  const api = {
    appState: async () => ({ app: appState }),
    validateAppAction: async (gameId, structuredAction) => {
      validateCalls += 1;
      assert.equal(gameId, 'game-1');
      assert.equal(structuredAction.operations.length, 1);
      assert.equal(structuredAction.operations[0].source_type, 'custom');
      return { canonical_action: { ...structuredAction, validation_proof: 'sig' }, display_input: '상식개변 앱에서 상식개변 1건의 변경사항을 적용한다.', summary: { total: 1 } };
    }
  };
  let submitted = null;
  const csaApp = createCsaApp({ documentRef, api, gameId: 'game-1', onSubmit: (displayInput, canonicalAction) => { submitted = { displayInput, canonicalAction }; } });

  await csaApp.open('csa');
  findByText(nodes['csa-app-body'], '+ 상식개변 추가').onclick();
  findByText(findByTag(nodes['csa-app-body'], 'article'), '직접 작성').onclick();

  // Every interaction below re-renders the tab (a fresh DOM tree), so the target
  // node is re-located from the live body each time rather than cached.
  const strengthSelect = findAllByTag(findByTag(nodes['csa-app-body'], 'article'), 'select')[0];
  strengthSelect.value = 'weak'; strengthSelect.onchange();

  const textarea = findByTag(findByTag(nodes['csa-app-body'], 'article'), 'textarea');
  assert.ok(textarea, 'the custom form textarea should be enabled once a strength is chosen');
  textarea.value = '자유로운 근무복을 허용한다'; textarea.oninput();

  const applyButton = findByText(nodes['csa-app-draft-bar'], '적용');
  assert.equal(applyButton.disabled, false);
  await applyButton.onclick();

  assert.equal(validateCalls, 1);
  assert.ok(submitted, 'onSubmit should fire with the server-validated canonical_action + display_input');
  assert.equal(submitted.canonicalAction.validation_proof, 'sig');
  assert.equal(csaApp.isOpen(), false, 'the modal closes once the transaction is handed off to the normal turn pipeline');
});

function driveCustomActivation(nodes, { content = '자유로운 근무복을 허용한다' } = {}) {
  findByText(nodes['csa-app-body'], '+ 상식개변 추가').onclick();
  findByText(findByTag(nodes['csa-app-body'], 'article'), '직접 작성').onclick();
  const strengthSelect = findAllByTag(findByTag(nodes['csa-app-body'], 'article'), 'select')[0];
  strengthSelect.value = 'weak'; strengthSelect.onchange();
  const textarea = findByTag(findByTag(nodes['csa-app-body'], 'article'), 'textarea');
  textarea.value = content; textarea.oninput();
  return findByText(nodes['csa-app-draft-bar'], '적용');
}

test('csa app modal: a handoff failure (onSubmit returns false) keeps the modal open with the draft and shows an error, without a second validate call', async () => {
  const { nodes, documentRef } = pageFixture();
  const appState = sampleAppState({ common_sense: [] });
  let validateCalls = 0;
  const api = {
    appState: async () => ({ app: appState }),
    validateAppAction: async (gameId, structuredAction) => {
      validateCalls += 1;
      return { canonical_action: { ...structuredAction, validation_proof: 'sig' }, display_input: '상식개변 앱에서 상식개변 1건의 변경사항을 적용한다.', summary: { total: 1 } };
    }
  };
  const csaApp = createCsaApp({ documentRef, api, gameId: 'game-1', onSubmit: async () => false });

  await csaApp.open('csa');
  const applyButton = driveCustomActivation(nodes);
  await applyButton.onclick();

  assert.equal(validateCalls, 1, 'a failed hand-off must never trigger a second app-validate call');
  assert.equal(csaApp.isOpen(), true, 'the modal stays open when the hand-off to the turn pipeline fails');
  assert.ok(findByTag(nodes['csa-app-body'], 'textarea'), 'the custom draft (source_type/content) survives the failed hand-off');
  assert.ok(findByText(nodes['csa-app-body'], '변경사항은 확인되었지만 적용에 실패했습니다. 다시 시도해 주세요.'), 'the specific hand-off failure message is shown, not silence');
});

test('csa app modal: app-validate issue codes (slot full, strength locked, etc.) are surfaced individually, not collapsed into one generic message', async () => {
  const { nodes, documentRef } = pageFixture();
  const appState = sampleAppState({ common_sense: [] });
  const api = {
    appState: async () => ({ app: appState }),
    validateAppAction: async () => {
      throw new ApiError({
        endpoint: '/api/app-validate', status: 422, code: 'app_action_invalid', message: '변경사항을 적용할 수 없습니다.', retryable: false,
        issues: [
          { code: 'CSA_SLOT_FULL', message: '상식개변 활성 슬롯이 부족합니다.' },
          { code: 'STRENGTH_LOCKED', message: '현재 레벨에서 사용할 수 없는 강도입니다.' }
        ]
      });
    }
  };
  const csaApp = createCsaApp({ documentRef, api, gameId: 'game-1', onSubmit: async () => true });

  await csaApp.open('csa');
  const applyButton = driveCustomActivation(nodes);
  await applyButton.onclick();

  assert.equal(csaApp.isOpen(), true);
  assert.ok(findByText(nodes['csa-app-body'], '상식개변 활성 슬롯이 부족합니다.'), 'the slot-full reason is shown verbatim');
  assert.ok(findByText(nodes['csa-app-body'], '현재 레벨에서 사용할 수 없는 강도입니다.'), 'the strength-locked reason is shown verbatim');
  assert.equal(findByText(nodes['csa-app-body'], '변경사항을 적용할 수 없습니다.'), null, 'the generic envelope message is not shown when specific issues exist');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPrimaryTtsLines, batchDialogueLines, createCompanyTts } from '../src/frontend/pages/tts.js';
import { createUtilityUi } from '../src/frontend/pages/utility-ui.js';
import { renderHospitalRelationshipIcons } from '../src/frontend/pages/relationship-icons.js';

function imageDocument() {
  const nodes = new Map();
  for (const id of ['character-image', 'image-status']) nodes.set(id, { hidden: false, textContent: '', removeAttribute() {} });
  return { querySelector(selector) { return nodes.get(selector.slice(1)) ?? null; }, nodes };
}

function eventAudio() {
  const listeners = new Map();
  return {
    src: '', playCalls: [], pauseCalls: 0,
    play: async function () { this.playCalls.push(this.src); },
    pause() { this.pauseCalls += 1; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    end() { listeners.get('ended')?.(); }
  };
}

class MiniNode {
  constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.classList = { add: (...names) => { this.classes = [...(this.classes ?? []), ...names]; } }; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  querySelector(selector) { if (selector === 'h3') return this.children.find(child => child.tagName === 'h3') ?? null; if (selector === 'dl') return this.children.find(child => child.tagName === 'dl') ?? null; return null; }
}

function relationshipSection() {
  const section = new MiniNode('section');
  const heading = new MiniNode('h3'); heading.textContent = '관계·사정 기록';
  const dl = new MiniNode('dl');
  for (const [label, value] of [['NPC 절정', '2'], ['플레이어 사정', '1'], ['질 성교', '0'], ['애널 성교', '0'], ['구강 성교', '1']]) { const dt = new MiniNode('dt'); dt.textContent = label; const dd = new MiniNode('dd'); dd.textContent = value; dl.append(dt, dd); }
  section.append(heading, dl);
  return section;
}

test('TTS selects one present parser speaker and preserves Story order', () => {
  const lines = selectPrimaryTtsLines({ presentNpcIds: ['heroine1', 'heroine2'], selectedCharacterId: 'heroine2', focalCharacterId: 'heroine1', dialogueLines: [
    { speaker_id: 'heroine1', speaker_name: '서원희', text: '첫 대사', order: 0 },
    { speaker_id: 'heroine2', speaker_name: '윤민아', text: '선택 대사', order: 1 },
    { speaker_id: 'heroine2', speaker_name: '윤민아', text: '이어지는 대사', order: 2 },
    { speaker_id: 'player', text: '플레이어', order: 3 }
  ] });
  assert.deepEqual(lines.map(line => line.text), ['선택 대사', '이어지는 대사']);
  assert.equal(batchDialogueLines(lines).length, 1);
});

test('TTS excludes remote, exited, unknown, and player speakers', () => {
  assert.deepEqual(selectPrimaryTtsLines({ presentNpcIds: ['heroine1'], dialogueLines: [
    { speaker_id: 'player', text: 'x', order: 0 }, { speaker_id: 'remote', text: 'y', order: 1 }, { speaker_id: 'heroine2', text: 'z', order: 2 }
  ] }), []);
});

test('Company TTS calls API with committed parser line and direct URL', async () => {
  const audio = { src: '', play: async () => {}, pause() {} };
  const calls = [];
  const controller = createCompanyTts({ api: { tts: async body => { calls.push(body); return { url: 'https://audio.test/a.mp3' }; } }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, gameId: 'game', getCommittedTurnIdentity: () => 'turn:action', getViewModel: () => ({ scene: { present_npc_ids: ['heroine1'] }, focal_character: { id: 'heroine1' }, media: { dialogue_lines: [{ speaker_id: 'heroine1', speaker_name: '서원희', text: '안녕하세요', direction: '차분하게', order: 0 }] } }) });
  controller.onCommittedTurn();
  await controller.drain();
  assert.equal(calls.length, 1);
  assert.equal(audio.src, 'https://audio.test/a.mp3');
});

test('same committed TTS identity is deduplicated while queued and completed', async () => {
  const audio = { src: '', play: async () => {}, pause() {} };
  let calls = 0;
  const controller = createCompanyTts({ api: { tts: async () => { calls += 1; return { url: 'https://audio.test/cached.mp3' }; } }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, getCommittedTurnIdentity: () => 'turn:1:action:a', getViewModel: () => ({ scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [{ speaker_id: 'heroine1', text: '반복 재생', order: 0 }] } }) });
  controller.onCommittedTurn();
  controller.onCommittedTurn();
  await controller.drain();
  assert.equal(calls, 1);
  assert.equal(controller.state.completedKeys.size, 1);
});

test('TTS replay uses the cached URL without another API request', async () => {
  const audio = { src: '', play: async () => {}, pause() {} };
  let calls = 0;
  const controller = createCompanyTts({ api: { tts: async () => { calls += 1; return { url: 'https://audio.test/replay.mp3' }; } }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, getCommittedTurnIdentity: () => 'turn:3:action:c', getViewModel: () => ({ scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [{ speaker_id: 'heroine1', text: '다시 듣기', order: 0 }] } }) });
  controller.onCommittedTurn();
  await controller.drain();
  assert.equal(controller.replayLatest(), true);
  await controller.drain();
  assert.equal(calls, 1);
  assert.equal(audio.src, 'https://audio.test/replay.mp3');
});

test.skip('obsolete contract: cross-turn TTS queue preserves older queued batches before the new turn', async () => {
  const audio = eventAudio();
  const calls = [];
  let viewModel = { turn: { committed_turn: 10, turn_id: 'turn-10', action_id: 'action-10' }, scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [
    { speaker_id: 'heroine1', text: '턴10 첫 문장', direction: '차분하게', order: 0 },
    { speaker_id: 'heroine1', text: '턴10 두 번째 문장', direction: '속삭이듯', order: 1 }
  ] } };
  const controller = createCompanyTts({ api: { tts: async body => { calls.push(body.text); return { url: `https://audio.test/${calls.length}.mp3` }; } }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, getViewModel: () => viewModel, getCommittedTurnIdentity: () => `${viewModel.turn.turn_id}:${viewModel.turn.action_id}` });
  controller.onCommittedTurn();
  await Promise.resolve();
  viewModel = { turn: { committed_turn: 11, turn_id: 'turn-11', action_id: 'action-11' }, scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [{ speaker_id: 'heroine1', text: '턴11 문장', direction: '담담하게', order: 0 }] } };
  controller.onCommittedTurn();
  assert.deepEqual(controller.queue.map(job => job.batch.text), ['턴10 두 번째 문장', '턴11 문장']);
  assert.deepEqual(audio.playCalls, ['https://audio.test/1.mp3']);
  await new Promise(resolve => setImmediate(resolve));
  audio.end();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls[1], '턴10 두 번째 문장');
  assert.equal(audio.playCalls[1], 'https://audio.test/2.mp3');
  await new Promise(resolve => setImmediate(resolve));
  audio.end();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls[2], '턴11 문장');
  assert.equal(audio.playCalls[2], 'https://audio.test/3.mp3');
  audio.end();
  await controller.drain();
});

test('cross-turn TTS drops stale older queued batches before the new turn', async () => {
  const audio = eventAudio();
  let viewModel = { turn: { committed_turn: 10, turn_id: 'turn-10', action_id: 'action-10' }, scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [
    { speaker_id: 'heroine1', text: 'old first', order: 0 },
    { speaker_id: 'heroine1', text: 'old second', order: 1 }
  ] } };
  const calls = [];
  const controller = createCompanyTts({ api: { tts: async body => { calls.push(body.text); return { url: `https://audio.test/current-${calls.length}.mp3` }; } }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, getViewModel: () => viewModel, getCommittedTurnIdentity: () => `${viewModel.turn.turn_id}:${viewModel.turn.action_id}` });
  controller.onCommittedTurn();
  await Promise.resolve();
  viewModel = { turn: { committed_turn: 11, turn_id: 'turn-11', action_id: 'action-11' }, scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [{ speaker_id: 'heroine1', text: 'current', order: 0 }] } };
  controller.onCommittedTurn();
  assert.deepEqual(controller.queue.map(job => job.batch.text), ['current']);
  await new Promise(resolve => setImmediate(resolve));
  controller.stop();
  audio.end();
  await controller.drain();
  assert.ok(calls.length <= 1);
});

test('same-turn feedback revision replaces only queued old revision batches', async () => {
  const audio = eventAudio();
  const calls = [];
  let viewModel = { turn: { committed_turn: 20, turn_id: 'turn-20-a', action_id: 'action-20-a' }, scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [
    { speaker_id: 'heroine1', text: 'A 첫 문장', direction: '차분하게', order: 0 },
    { speaker_id: 'heroine1', text: 'A 버려질 문장', direction: '속삭이듯', order: 1 }
  ] } };
  const controller = createCompanyTts({ api: { tts: async body => { calls.push(body.text); return { url: `https://audio.test/revision-${calls.length}.mp3` }; } }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, getViewModel: () => viewModel, getCommittedTurnIdentity: () => `${viewModel.turn.turn_id}:${viewModel.turn.action_id}` });
  controller.onCommittedTurn();
  await Promise.resolve();
  viewModel = { turn: { committed_turn: 20, turn_id: 'turn-20-b', action_id: 'action-20-b' }, scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [
    { speaker_id: 'heroine1', text: 'B 새 문장', direction: '차분하게', order: 0 },
    { speaker_id: 'heroine1', text: 'B 두 번째 문장', direction: '속삭이듯', order: 1 }
  ] } };
  controller.onCommittedTurn();
  assert.deepEqual(controller.queue.map(job => job.batch.text), ['B 새 문장', 'B 두 번째 문장']);
  await new Promise(resolve => setImmediate(resolve));
  audio.end();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.includes('A 버려질 문장'), false);
  assert.equal(calls[1], 'B 새 문장');
  await new Promise(resolve => setImmediate(resolve));
  audio.end();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls[2], 'B 두 번째 문장');
  audio.end();
  await controller.drain();
});

test('TTS stop invalidates a late API response and clears playback state', async () => {
  const audio = { src: '', playCalls: 0, play: async () => { audio.playCalls += 1; }, pauseCalls: 0, pause() { audio.pauseCalls += 1; }, currentTime: 8, removeAttribute() {}, load() {} };
  let resolveApi;
  const controller = createCompanyTts({ api: { tts: async () => new Promise(resolve => { resolveApi = resolve; }) }, documentRef: { getElementById: id => id === 'audio-player' ? audio : null }, getCommittedTurnIdentity: () => 'turn:2:action:b', getViewModel: () => ({ scene: { present_npc_ids: ['heroine1'] }, media: { dialogue_lines: [{ speaker_id: 'heroine1', text: '늦은 응답', order: 0 }] } }) });
  controller.onCommittedTurn();
  controller.stop();
  resolveApi({ url: 'https://audio.test/late.mp3' });
  await controller.drain();
  assert.equal(audio.playCalls, 0);
  assert.equal(audio.pauseCalls, 1);
  assert.equal(controller.state.queuedKeys.size, 0);
  assert.equal(controller.state.inFlightKey, null);
});

test('image tags stay a single normalized key and failed requests can retry', async () => {
  const documentRef = imageDocument();
  let calls = 0;
  let fail = true;
  const ui = createUtilityUi({ documentRef, gameId: 'game', getViewModel: () => ({ turn: { committed_turn: 3, turn_id: 't3', action_id: 'a3' }, scene: { location_id: 'room' }, media: { image_character_id: 'heroine1', image_pool: 'sex', image_tags: ['handjob', 'office'] } }), api: { image: async request => { calls += 1; assert.deepEqual(request.tags, ['handjob', 'office']); if (fail) { fail = false; throw new Error('retry'); } return { image: { image_url: 'https://img.test/1.png', situation: '장면' } }; } } });
  await ui.loadMedia();
  await ui.loadMedia();
  assert.equal(calls, 2);
  await ui.loadMedia();
  assert.equal(calls, 2);
});

test('stale image success and failure cannot overwrite the latest request', async () => {
  const documentRef = imageDocument();
  const requests = [];
  const errors = [];
  const loading = [];
  let viewModel = { turn: { committed_turn: 1, turn_id: 'a', action_id: 'a' }, scene: { location_id: 'room-a' }, media: { image_character_id: 'heroine1', image_pool: 'general', image_tags: [] } };
  const ui = createUtilityUi({ documentRef, gameId: 'game', getViewModel: () => viewModel, onError: error => errors.push(error.message), onMediaLoading: value => loading.push(value), api: { image: async request => new Promise((resolve, reject) => requests.push({ request, resolve, reject })) } });
  const first = ui.loadMedia();
  viewModel = { turn: { committed_turn: 2, turn_id: 'b', action_id: 'b' }, scene: { location_id: 'room-b' }, media: { image_character_id: 'heroine2', image_pool: 'sex', image_tags: ['oral'] } };
  const second = ui.loadMedia();
  requests[1].resolve({ image: { image_url: 'https://img.test/latest.png', situation: '최신' } });
  await second;
  requests[0].resolve({ image: { image_url: 'https://img.test/stale.png', situation: '오래된 응답' } });
  await first;
  assert.equal(documentRef.nodes.get('character-image').src, 'https://img.test/latest.png');
  assert.deepEqual(errors, []);
  assert.deepEqual(loading, [true, true, false]);
});

test('stale image failure cannot clear the latest image or emit an error', async () => {
  const documentRef = imageDocument();
  const requests = [];
  const errors = [];
  let viewModel = { turn: { committed_turn: 3, turn_id: 'c', action_id: 'c' }, scene: { location_id: 'room-c' }, media: { image_character_id: 'heroine1', image_pool: 'general', image_tags: [] } };
  const ui = createUtilityUi({ documentRef, gameId: 'game', getViewModel: () => viewModel, onError: error => errors.push(error.message), api: { image: async request => new Promise((resolve, reject) => requests.push({ request, resolve, reject })) } });
  const first = ui.loadMedia();
  viewModel = { turn: { committed_turn: 4, turn_id: 'd', action_id: 'd' }, scene: { location_id: 'room-d' }, media: { image_character_id: 'heroine2', image_pool: 'general', image_tags: [] } };
  const second = ui.loadMedia();
  requests[1].resolve({ image: { image_url: 'https://img.test/latest-2.png', situation: '최신' } });
  await second;
  requests[0].reject(new Error('stale failure'));
  await first;
  assert.equal(documentRef.nodes.get('character-image').src, 'https://img.test/latest-2.png');
  assert.deepEqual(errors, []);
});

test('relationship record projection keeps the product icon surface active', () => {
  const section = relationshipSection();
  const documentRef = { createElement: tag => new MiniNode(tag) };
  assert.equal(renderHospitalRelationshipIcons(section, documentRef), true);
  const labels = JSON.stringify(section).match(/✨ 절정|💦 사정|🌸 질|🍑 애널|👄 구강/g) ?? [];
  assert.equal(labels.length >= 5, true);
});

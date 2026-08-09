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

test('relationship record projection keeps the product icon surface active', () => {
  const section = relationshipSection();
  const documentRef = { createElement: tag => new MiniNode(tag) };
  assert.equal(renderHospitalRelationshipIcons(section, documentRef), true);
  const labels = JSON.stringify(section).match(/✨ 절정|💦 사정|🌸 질|🍑 애널|👄 구강/g) ?? [];
  assert.equal(labels.length >= 5, true);
});

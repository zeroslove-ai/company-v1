import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPrimaryTtsLines, batchDialogueLines, createCompanyTts } from '../src/frontend/pages/tts.js';

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

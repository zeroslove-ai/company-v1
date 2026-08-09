import test from 'node:test';
import assert from 'node:assert/strict';
import { batchDialogueLines } from '../src/frontend/pages/tts.js';

test('Company TTS batches adjacent parser lines from one speaker', () => {
  const batches = batchDialogueLines([
    { speaker_id: 'heroine1', speaker_name: '서원희', direction: '차분하게', text: '첫 문장', order: 0 },
    { speaker_id: 'heroine1', speaker_name: '서원희', direction: '차분하게', text: '둘째 문장', order: 1 },
    { speaker_id: 'heroine2', speaker_name: '윤민아', direction: '차분하게', text: '다른 화자', order: 2 }
  ]);
  assert.equal(batches.length, 2);
  assert.equal(batches[0].text, '첫 문장 둘째 문장');
  assert.equal(batches[1].character_id, 'heroine2');
});

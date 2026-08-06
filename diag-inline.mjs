
import { parseNarrative } from './src/engine/narrative-parser.js';
import { collectUnresolvedDialogue } from './src/engine/speaker-tagger.js';
const master = { characters: [{ character_id: 'heroine5', name: '이메이' }], general_npcs: [] };
// 지시 입력 (화행 주어 있음)
const s1 = '[1. 서사 및 행동]\n이메이는 화면을 보며 “확인해 보겠습니다.”라고 말했다.\n[2. 플레이어 속마음]\n좋아.';
const p1 = parseNarrative(s1, { master });
console.log('s1 blocks:', p1.blocks.map(b => `${b.type}:${b.speaker_id ?? 'null'}:${String(b.text ?? '').slice(0, 25)}`).join(' | '));
console.log('s1 unresolved:', collectUnresolvedDialogue(p1).length);
// 주어 없는 inline
const s2 = '[1. 서사 및 행동]\n화면을 보며 “확인해 보겠습니다.”라고 말했다.\n[2. 플레이어 속마음]\n좋아.';
const p2 = parseNarrative(s2, { master });
console.log('s2 blocks:', p2.blocks.map(b => `${b.type}:${b.speaker_id ?? 'null'}:${String(b.text ?? '').slice(0, 25)}`).join(' | '));
console.log('s2 unresolved:', collectUnresolvedDialogue(p2).length);
console.log('s2 normalized_raw:', JSON.stringify(p2.normalized_raw));

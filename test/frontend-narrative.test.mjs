import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNarrative, projectStreamingSections, projectStreamingText } from '../src/frontend/pages/narrative.js';

test('frontend narrative parser preserves scene and dialogue order', () => {
  const parsed = parseNarrative('[SCENE]\nOffice lights are low.\n[DIALOGUE speaker="Hayeon" direction="quietly"]\nAre you ready?\n[PLAYER_STATUS]\nFocused\n[CHOICES]\n1. Ask\n2. Wait\n3. Leave\n4. Work');
  assert.deepEqual(parsed.blocks.map(block => block.type), ['scene', 'dialogue']);
  assert.equal(parsed.blocks[1].speaker, 'Hayeon');
  assert.equal(parsed.player_status, undefined, 'player_status는 저장하지 않는다 ([PLAYER_STATUS]는 읽기만)');
  assert.equal(parsed.choices.length, 4);
  assert.equal(parsed.warnings.includes('choices_not_exactly_four'), false);
});

test('frontend narrative parser preserves malformed and markerless Story text', () => {
  const malformed = '[SCENE]\nOnly one choice\n[CHOICES]\n1. Continue';
  const parsed = parseNarrative(malformed);
  assert.equal(parsed.raw, malformed);
  assert.ok(parsed.warnings.includes('choices_not_exactly_four'));
  const fallback = parseNarrative('Plain Story text');
  assert.deepEqual(fallback.blocks, [{ type: 'unparsed', text: 'Plain Story text' }]);
  assert.ok(fallback.warnings.includes('no_recognized_markers'));
});

test('streaming projection hides protocol markers while preserving raw prose and partial markers', () => {
  const raw = '[SCENE]\n사무실에 들어선다.\n[DIALOGUE speaker="heroine1" direction="차분하게"]\n안녕하세요.\n[2. 플레이어 속마음]\n긴장된다.';
  const visible = projectStreamingText(raw);
  assert.doesNotMatch(visible, /\[(?:SCENE|DIALOGUE|2\.)/);
  assert.match(visible, /사무실에 들어선다/);
  assert.match(visible, /안녕하세요/);
  assert.match(visible, /긴장된다/);
  assert.equal(projectStreamingText('첫 문장\n[DIAL'), '첫 문장\n');
});

test('streaming hides the opening background marker without dropping its prose', () => {
  const visible = projectStreamingText('[배경] 테스트 배경\n[1. 서사 및 행동]\n새 장면');
  assert.equal(visible, '테스트 배경\n\n새 장면');
  assert.doesNotMatch(visible, /\[배경\]|\[1\./u);
});

test('streaming closing dialogue marker returns following text to scene projection', () => {
  const projection = projectStreamingSections('[DIALOGUE speaker="heroine1" direction="calm"]\n대사\n[/DIALOGUE]\n뒤따른 서술');
  assert.deepEqual(projection.segments.map(segment => segment.type), ['dialogue', 'scene']);
  assert.equal(projection.segments[0].text, '대사');
  assert.equal(projection.segments[1].text, '뒤따른 서술');
  assert.equal(projectStreamingText('대사\n[/DIALOGUE] 뒤따른 서술'), '대사\n뒤따른 서술');
});

test('streaming hides inline and chunk-split closing dialogue markers', () => {
  const inline = projectStreamingSections('[DIALOGUE speaker="heroine1" direction="calm"] 대사 [/DIALOGUE] 장면');
  assert.deepEqual(inline.segments.map(segment => segment.type), ['dialogue', 'scene']);
  assert.equal(inline.segments[1].text, '장면');
  assert.equal(projectStreamingText('문장\n[/DIAL'), '문장\n');
  assert.equal(projectStreamingSections('문장\n[/DIAL').segments.at(-1).text, '문장');
  assert.doesNotMatch(projectStreamingText('[DIALOGUE]\n대사\n[/DIALOGUE]'), /\[DIALOGUE|\[\/DIALOGUE\]|\]/u);
});

test('syntax-only streaming projection separates scene, dialogue, thought, and choices without speaker inference', () => {
  const projection = projectStreamingSections('[SCENE]\n장면 본문\n[DIALOGUE speaker="heroine1" direction="차분하게"]\n어서 와.\n[2. 플레이어 속마음]\n긴장된다.\n[CHOICES]\n1. 앉는다');
  assert.deepEqual(projection.segments.map(segment => segment.type), ['scene', 'dialogue', 'thought', 'choices']);
  assert.equal(projection.segments[1].text, '어서 와.');
  assert.equal(projectStreamingSections('장면\n[DIALOGUE speaker="heroine1"').segments.at(-1).text, '장면');
});

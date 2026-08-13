import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFreshNarrativeV2 } from '../src/engine/fresh-narrative-parser.js';
import { parsePersistedNarrative } from '../src/engine/persisted-narrative-parser.js';
import { splitOpeningSections } from '../src/engine/opening-prompt.js';
import { DURABLE_STORY_RULES } from '../src/engine/story-prompt.js';

const master = {
  characters: [{ character_id: 'heroine1', name: '\uC11C\uC6D0\uD76C' }],
  general_npcs: [{ npc_id: 'general1', name: '\uAC15\uB300\uB9AC' }]
};

const canonical = [
  '[SCENE]',
  '\uD68C\uC758\uC2E4\uC5D0 \uC870\uC6A9\uD55C \uC5B4\uC0C9\uD568\uC774 \uD750\uB978\uB2E4.',
  '[DIALOGUE speaker_id="heroine1"]',
  '[ACTING] \uCC28\uBD84\uD558\uAC8C',
  '\uC900\uBE44\uD55C \uC790\uB8CC\uB97C \uD655\uC778\uD558\uACA0\uC2B5\uB2C8\uB2E4.',
  '[THOUGHT]',
  '\uC0C1\uD669\uC744 \uCC28\uBD84\uD788 \uC815\uB9AC\uD574\uC57C\uACA0\uB2E4.',
  '[CHOICE]',
  '\uC8FC\uBCC0\uC744 \uC0B4\uD3B4\uBCF8\uB2E4.',
  '[CHOICE]',
  '\uC790\uB8CC\uB97C \uBB3B\uB294\uB2E4.',
  '[CHOICE]',
  '\uC7A0\uC2DC \uAE30\uB2E4\uB9B0\uB2E4.',
  '[CHOICE]',
  '\uB2E4\uB978 \uC7A5\uC18C\uB85C \uAC04\uB2E4.'
].join('\n');

test('fresh parser accepts canonical Story and preserves raw bytes', () => {
  const parsed = parseFreshNarrativeV2(canonical, { master });
  assert.equal(parsed.raw, canonical);
  assert.equal('normalized_raw' in parsed, false);
  assert.equal(parsed.warnings.length, 0);
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(parsed.choices.length, 4);
  assert.equal('choice_labels' in parsed, false);
  assert.equal('label' in parsed.blocks.find(block => block.type === 'choice'), false);
});

test('thought fallback stops at a blank paragraph when the closing marker is missing', () => {
  const raw = '[THOUGHT]\n첫 문단의 플레이어 생각이다.\n\nNPC의 이어지는 서술이다.\n[SCENE]\n사무실이 조용하다.';
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.raw, raw);
  assert.equal(parsed.player_inner_thought, '첫 문단의 플레이어 생각이다.');
  assert.ok(parsed.blocks.some(block => block.type === 'narrative' && block.text.includes('NPC의 이어지는 서술')));
});

test('duplicate thought blocks keep one canonical player thought and preserve a warning', () => {
  const raw = '[THOUGHT]\n첫 생각\n[/THOUGHT]\n[THOUGHT]\n두 번째 생각\n[/THOUGHT]';
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.player_inner_thought, '첫 생각');
  assert.match(parsed.warnings.join(' '), /duplicate/i);
  assert.equal(parsed.blocks.filter(block => block.type === 'player_inner_thought').length, 1);
  assert.ok(parsed.raw.includes('두 번째 생각'));
});

test('fresh parser accepts player speaker only by canonical ID', () => {
  const raw = canonical.replace('speaker_id="heroine1"', 'speaker_id="player"');
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'player');
});

for (const [name, raw] of [
  ['unknown speaker', canonical.replace('heroine1', 'unknown')],
  ['speaker name as id', canonical.replace('heroine1', '\uC11C\uC6D0\uD76C')],
  ['legacy speaker attributes', canonical.replace('[DIALOGUE speaker_id="heroine1"]', '[DIALOGUE speaker="\uC11C\uC6D0\uD76C" direction="calm"]')],
  ['malformed dialogue marker', canonical.replace('[DIALOGUE speaker_id="heroine1"]', '[DIALOGUE speaker="\uC11C\uC6D0\uD76C" direction="calm"]')]
]) {
  test(`fresh parser rejects ${name}`, () => {
    assert.throws(() => parseFreshNarrativeV2(raw, { master }), error => error.code === 'STORY_PROTOCOL_INVALID');
  });
}

test('plain narrative is the Fresh default and old section literals stay narrative', () => {
  const raw = `첫 문단이다.\n\n[메모] 회의실에 들어선다.\n[DIALOGUE speaker_id="heroine1"]\n확인했습니다.\n\n다음 문단이다.`;
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.deepEqual(parsed.blocks.map(block => block.type), ['narrative', 'dialogue', 'narrative']);
  assert.equal(parsed.raw, raw);
});

test('quoted text inside SCENE is never inferred as dialogue', () => {
  const raw = canonical.replace('회의실에 조용한 어색함이 흐른다.', '회의실에서 "그 자료를 보죠"라는 말이 들렸다.');
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.dialogue_lines.length, 1);
  assert.equal(parsed.blocks.filter(block => block.type === 'dialogue').length, 1);
});

for (const replacement of [
  canonical.replace('[CHOICE]\n다른 장소로 간다.', ''),
  canonical + '\n[CHOICE]\n추가',
  canonical.replace('다른 장소로 간다.', '다른 장소로 간다.'),
  canonical.replace('[CHOICE]\n주변을 살펴본다.', '[CHOICE]\n주변을 살펴본다.')
]) {
  test('fresh parser preserves incomplete choice shape as a soft warning', () => {
    const parsed = parseFreshNarrativeV2(replacement, { master });
    if (parsed.choices.length !== 4) assert.ok(parsed.warnings.includes('choices_not_exactly_four'));
    else assert.equal(parsed.canonical_choices.length, 4);
    assert.equal(parsed.raw, replacement);
  });
}

test('choice body is preserved literally and label attributes are rejected', () => {
  assert.equal(parseFreshNarrativeV2(canonical, { master }).choices[0], '주변을 살펴본다.');
  assert.throws(() => parseFreshNarrativeV2(canonical.replace('[CHOICE]', '[CHOICE label="A"]'), { master }), error => error.code === 'STORY_PROTOCOL_INVALID');
});

test('persisted boundary keeps fresh rows clean and adapts legacy rows only on read', () => {
  const fresh = parsePersistedNarrative(canonical, { master });
  assert.equal(fresh.warnings.length, 0);
  const legacy = parsePersistedNarrative('[SCENE]\nlegacy scene\n[PLAYER_STATUS]\nFocused\n[CHOICES]\n1. Ask\n2. Wait\n3. Leave\n4. Work', { master });
  assert.ok(legacy.warnings.includes('legacy_narrative_adapter_used'));
  assert.equal('normalized_raw' in legacy, false);
});

test('opening splitter preserves background and canonical body boundary', () => {
  const result = splitOpeningSections(`[\uBC30\uACBD] \uCCAB \uB0A0\n${canonical}`);
  const legacy = splitOpeningSections('[\uBC30\uACBD] \uCCAB \uB0A0\n[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]\nlegacy body');
  assert.equal(legacy.body.startsWith('[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]'), true);
  assert.equal(legacy.background, '\uCCAB \uB0A0');
  assert.equal(result.body, '');
});

test('Story durable output contract uses semantic blocks and UI-owned presentation', () => {
  assert.match(DURABLE_STORY_RULES, /plain narrative by default/);
  assert.match(DURABLE_STORY_RULES, /\[DIALOGUE speaker_id=/);
  assert.match(DURABLE_STORY_RULES, /four literal \[CHOICE\] action blocks/);
  assert.doesNotMatch(DURABLE_STORY_RULES, /\[CHOICE label=/);
  assert.match(DURABLE_STORY_RULES, /Engine metadata defines WHAT/);
  assert.match(DURABLE_STORY_RULES, /standalone visible \[ACTING enactment_id/);
  assert.match(DURABLE_STORY_RULES, /Provider supplies natural narrative HOW/);
  assert.doesNotMatch(DURABLE_STORY_RULES, /\[1\. \uC11C\uC0AC \uBC0F \uD589\uB3D9\]|\[2\. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C\]|\[3\. \uC120\uD0DD\uC9C0\]/);
  assert.equal(DURABLE_STORY_RULES.includes('?쒖궗'), false);
  assert.equal(DURABLE_STORY_RULES.includes('?뚮젅'), false);
  assert.equal(DURABLE_STORY_RULES.includes('?좏깮'), false);
});

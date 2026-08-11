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
  '[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]',
  '[SCENE]',
  '\uD68C\uC758\uC2E4\uC5D0 \uC870\uC6A9\uD55C \uC5B4\uC0C9\uD568\uC774 \uD750\uB978\uB2E4.',
  '[DIALOGUE speaker_id="heroine1" acting_direction="\uCC28\uBD84\uD558\uAC8C"]',
  '\uC900\uBE44\uD55C \uC790\uB8CC\uB97C \uD655\uC778\uD558\uACA0\uC2B5\uB2C8\uB2E4.',
  '[2. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C]',
  '\uC0C1\uD669\uC744 \uCC28\uBD84\uD788 \uC815\uB9AC\uD574\uC57C\uACA0\uB2E4.',
  '[3. \uC120\uD0DD\uC9C0]',
  '1. [\uAD00\uCC30] \uC8FC\uBCC0\uC744 \uC0B4\uD3B4\uBCF8\uB2E4.',
  '2. [\uB300\uD654] \uC790\uB8CC\uB97C \uBB3B\uB294\uB2E4.',
  '3. [\uB300\uAE30] \uC7A0\uC2DC \uAE30\uB2E4\uB9B0\uB2E4.',
  '4. [\uC774\uB3D9] \uB2E4\uB978 \uC7A5\uC18C\uB85C \uAC04\uB2E4.'
].join('\n');

test('fresh parser accepts canonical Story and preserves raw bytes', () => {
  const parsed = parseFreshNarrativeV2(canonical, { master });
  assert.equal(parsed.raw, canonical);
  assert.equal('normalized_raw' in parsed, false);
  assert.equal(parsed.warnings.length, 0);
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(parsed.choices.length, 4);
});

test('fresh parser accepts player speaker only by canonical ID', () => {
  const raw = canonical.replace('speaker_id="heroine1"', 'speaker_id="player"');
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'player');
});

for (const [name, raw] of [
  ['unknown speaker', canonical.replace('heroine1', 'unknown')],
  ['speaker name as id', canonical.replace('heroine1', '\uC11C\uC6D0\uD76C')],
  ['legacy speaker attributes', canonical.replace('speaker_id="heroine1" acting_direction="\uCC28\uBD84\uD558\uAC8C"', 'speaker="\uC11C\uC6D0\uD76C" direction="calm"')],
  ['legacy sections', canonical.replace('[3. \uC120\uD0DD\uC9C0]', '[4. \uC120\uD0DD\uC9C0]')],
  ['markerless', canonical.replace('[SCENE]\n', '')],
  ['quote wrapped thought', canonical.replace('\uC0C1\uD669\uC744 \uCC28\uBD84\uD788 \uC815\uB9AC\uD574\uC57C\uACA0\uB2E4.', '"\uC0C1\uD669\uC744 \uCC28\uBD84\uD788 \uC815\uB9AC\uD574\uC57C\uACA0\uB2E4."')]
]) {
  test(`fresh parser rejects ${name}`, () => {
    assert.throws(() => parseFreshNarrativeV2(raw, { master }), error => error.code === 'STORY_PROTOCOL_INVALID');
  });
}

test('quoted text inside SCENE is never inferred as dialogue', () => {
  const raw = canonical.replace('회의실에 조용한 어색함이 흐른다.', '회의실에서 "그 자료를 보죠"라는 말이 들렸다.');
  const parsed = parseFreshNarrativeV2(raw, { master });
  assert.equal(parsed.dialogue_lines.length, 1);
  assert.equal(parsed.blocks.filter(block => block.type === 'dialogue').length, 1);
});

for (const replacement of [
  canonical.replace(/\n4\. \[[^\n]+/, ''),
  `${canonical}\n5. [\uCD94\uAC00] \uCD94\uAC00`,
  canonical.replace('[\uB300\uD654]', '[\uAD00\uCC30]'),
  canonical.replace('1. [\uAD00\uCC30]', '1. Choice without a label')
]) {
  test('fresh parser rejects invalid choice shape', () => {
    assert.throws(() => parseFreshNarrativeV2(replacement, { master }), /STORY_PROTOCOL_INVALID|choices|choice/i);
  });
}

test('persisted boundary keeps fresh rows clean and adapts legacy rows only on read', () => {
  const fresh = parsePersistedNarrative(canonical, { master });
  assert.equal(fresh.warnings.length, 0);
  const legacy = parsePersistedNarrative('[SCENE]\nlegacy scene\n[PLAYER_STATUS]\nFocused\n[CHOICES]\n1. Ask\n2. Wait\n3. Leave\n4. Work', { master });
  assert.ok(legacy.warnings.includes('legacy_narrative_adapter_used'));
  assert.equal('normalized_raw' in legacy, false);
});

test('opening splitter preserves background and canonical body boundary', () => {
  const result = splitOpeningSections(`[\uBC30\uACBD] \uCCAB \uB0A0\n${canonical}`);
  assert.equal(result.body.startsWith('[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]'), true);
  assert.equal(result.background, '\uCCAB \uB0A0');
});

test('Story durable output contract uses the canonical Korean section headers', () => {
  assert.match(DURABLE_STORY_RULES, /\[1\. \uC11C\uC0AC \uBC0F \uD589\uB3D9\]/);
  assert.match(DURABLE_STORY_RULES, /\[2\. \uD50C\uB808\uC774\uC5B4 \uC18D\uB9C8\uC74C\]/);
  assert.match(DURABLE_STORY_RULES, /\[3\. \uC120\uD0DD\uC9C0\]/);
  assert.equal(DURABLE_STORY_RULES.includes('?쒖궗'), false);
  assert.equal(DURABLE_STORY_RULES.includes('?뚮젅'), false);
  assert.equal(DURABLE_STORY_RULES.includes('?좏깮'), false);
});

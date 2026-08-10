import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyRegisteredNpcPolicy, resolveActionCharacterTarget } from '../src/api/npc-policy-fetch.js';
import { parseNarrative as parseEngineNarrative } from '../src/engine/narrative-parser.js';
import { resolveMovementCharacterTarget } from '../src/engine/story-prompt.js';
import { parseNarrative as parseFrontendNarrative } from '../src/frontend/pages/narrative.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const master = {
  characters: [
    { character_id: 'heroine1', name: '서원희' },
    { character_id: 'heroine2', name: '윤민아' }
  ],
  general_npcs: []
};
const speakerDirectory = { heroine1: { name: '서원희' }, heroine2: { name: '윤민아' } };

function fourSections(scene) {
  return `[1. 서사 및 행동]\n${scene}\n[2. 플레이어 속마음]\n민아를 제대로 찾았다.\n[3. 플레이어 상황판]\n장소: 복도\n[4. 선택지]\n1. [인사] 인사한다\n2. [업무] 업무를 묻는다\n3. [관찰] 반응을 본다\n4. [이동] 함께 이동한다`;
}

test('민아를 찾으러 가는 이동 행동 uniquely activates canonical 윤민아', () => {
  const charactersMap = {
    heroine1: { name: '서원희' },
    heroine2: { name: '윤민아' }
  };
  assert.equal(
    resolveMovementCharacterTarget(charactersMap, '이제 다른 팀원 중 하나인 민아를 찾으러 가본다'),
    'heroine2'
  );
  assert.equal(resolveMovementCharacterTarget(charactersMap, '민아의 보고서를 읽는다'), null, '일반 부분 이름 언급은 활성화하지 않는다');
});

test('final Story transport binds 민아 to 윤민아 and forbids substitution or room spawning', () => {
  const payload = {
    edition: 'company-v1',
    active_character_canon: {
      heroine1: { character_id: 'heroine1', name: '서원희' },
      heroine2: { character_id: 'heroine2', name: '윤민아' }
    },
    active_general_npc_canon: {},
    context: { workplace: { location: { location_id: 'conference_room' }, eligible_nearby_npcs: [] } },
    player_action: '이제 다른 팀원 중 하나인 민아를 찾으러 가본다',
    expected_turn: 14
  };
  assert.deepEqual(resolveActionCharacterTarget(payload), { id: 'heroine2', name: '윤민아' });
  const init = { body: JSON.stringify({ stream: true, messages: [
    { role: 'system', content: 'STATIC' },
    { role: 'user', content: JSON.stringify(payload) }
  ] }) };
  const body = JSON.parse(applyRegisteredNpcPolicy(init).body);
  const final = body.messages.at(-1).content;
  assert.match(final, /“민아”[\s\S]*“윤민아”/);
  assert.match(final, /다른 성·다른 이름의 새 NPC/);
  assert.match(final, /실제 이동/);
  assert.match(final, /기존 장소에 대상이 근거 없이 갑자기 나타났다고 처리하지 않는다/);
});

test('engine and streaming parsers assign the production quote-only 민아 line to 윤민아, never 서원희', () => {
  const story = fourSections('서원희가 플레이어를 번갈아 보며 소개했다. 민아가 고개를 숙여 가볍게 인사하며 출력물을 정리했다.\n“아, 네. 민아입니다. 잘 부탁드립니다.”');
  const engine = parseEngineNarrative(story, { master });
  const frontend = parseFrontendNarrative(story, { speakerDirectory });
  for (const parsed of [engine, frontend]) {
    const recovered = parsed.dialogue_lines.find(line => line.text.includes('민아입니다'));
    assert.equal(recovered?.speaker_id, 'heroine2');
    assert.equal(recovered?.speaker_name, '윤민아');
  }
});

test('wrong surname with a unique registered given name canonicalizes to 윤민아', () => {
  const story = fourSections('김민아 (자연스럽게): “잘 부탁드립니다.”');
  for (const parsed of [
    parseEngineNarrative(story, { master }),
    parseFrontendNarrative(story, { speakerDirectory })
  ]) {
    assert.equal(parsed.dialogue_lines[0]?.speaker_id, 'heroine2');
    assert.equal(parsed.dialogue_lines[0]?.speaker_name, '윤민아');
  }
});

test('loading is nonblocking, inner thought is boxed, and NPC finder is not loaded', () => {
  const css = fs.readFileSync(path.join(root, 'src/frontend/pages/runtime-hotfix.css'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  assert.match(css, /\.turn-loading-overlay[\s\S]*pointer-events:\s*none/);
  assert.doesNotMatch(css, /backdrop-filter:\s*blur/);
  assert.match(css, /\.narrative-player_inner_thought[\s\S]*content:\s*'플레이어 속마음'/);
  assert.doesNotMatch(html, /find-npc|npc-finder/);
  assert.match(html, /runtime-hotfix\.css/);
  assert.doesNotMatch(html, /tts-product-policy\.js/);
  assert.doesNotMatch(html, /src="\.\/npc-finder\.js"/);
});

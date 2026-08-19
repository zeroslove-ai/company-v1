import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContentAdapter } from '../runtime-v2/domain/content.js';
import { COMPANY_APP_PREMISE, openingStory, parseStoryBlocks } from '../runtime-v2/domain/story.js';
import { buildStoryMessages } from '../runtime-v2/server/provider.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = createContentAdapter();

test('v2 content adapter is sourced from the canonical Company edition', async () => {
  const edition = JSON.parse(await fs.readFile(path.join(root, 'content/edition.json'), 'utf8'));
  const characters = JSON.parse(await fs.readFile(path.join(root, 'content/characters.json'), 'utf8'));
  const generalNpcs = JSON.parse(await fs.readFile(path.join(root, 'content/general_npcs.json'), 'utf8'));
  const map = JSON.parse(await fs.readFile(path.join(root, 'content/map.json'), 'utf8'));
  assert.equal(content.edition.title, edition.title);
  assert.deepEqual(content.npcIds().slice(0, 5), Object.keys(characters.characters));
  assert.deepEqual(content.npcIds().slice(5), Object.keys(generalNpcs.profiles));
  assert.deepEqual(content.npcIds().slice(0, 5).map((id) => content.getNpc(id).name), ['서원희', '윤민아', '김제나', '한리브', '이메이']);
  assert.equal(content.npcIds().length, 13);
  assert.deepEqual(content.npcIds().slice(5).map((id) => content.getNpc(id).name), Object.values(generalNpcs.profiles).map((npc) => npc.name));
  assert.deepEqual(content.locationIds(), map.locations.map((location) => location.location_id));
  assert.ok(content.locationIds().length > 2);
  assert.equal(content.getNpc('heroine2').aliases.includes('다현'), false);
  assert.equal(content.getNpc('heroine5').aliases.includes('민지'), false);
});

test('opening establishes the private app premise without choices or reality mutation', () => {
  const story = openingStory({ playerName: '테스트 플레이어', content });
  const parsed = parseStoryBlocks(story, { content });
  assert.deepEqual(parsed.choices, []);
  assert.match(story, /상식개변/);
  assert.match(story, /평범하고 자연스럽다고 받아들이는 규칙/);
  assert.match(story, /아직 앱을 사용하지 않았다/);
  assert.match(story, /다른 사람들은 이 앱을 모르고/);
  assert.match(story, /현실은 아무것도 바뀌지 않았다/);
  assert.match(story, /브랜드전략팀 사무실/);
  assert.match(story, /서원희/);
  assert.equal(parsed.blocks.some((block) => block.speaker_id === 'heroine1'), true);
});

test('Story request carries only relevant canonical context and the literal action', () => {
  const messages = buildStoryMessages({
    content,
    literalAction: '서원희에게 오늘 일정을 묻는다.',
    context: { state: { state: { player: { name: '플레이어' }, time: { day: 1, minute: 540 }, scene: { location_id: 'brand_strategy_office', present_npc_ids: ['heroine1'] } } }, turns: [{ literal_action: '이전 행동', story_text: '이전 장면', turn_summary: '이전 요약' }] }
  });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.edition.title, '상식개변: 회사편');
  assert.equal(payload.literal_action, '서원희에게 오늘 일정을 묻는다.');
  assert.equal(payload.scene.location.name, '브랜드전략팀 사무실');
  assert.deepEqual(payload.present_npc_ids, ['heroine1']);
  assert.equal(payload.actors[0].name, '서원희');
  assert.equal(payload.recent_turns[0].literal_action, '이전 행동');
  assert.equal(payload.app.name, COMPANY_APP_PREMISE.name);
});

test('frontend-v2 is a presentation shell with server-owned free-form turns', async () => {
  const html = await fs.readFile(path.join(root, 'frontend-v2/index.html'), 'utf8');
  const app = await fs.readFile(path.join(root, 'frontend-v2/app.js'), 'utf8');
  assert.match(html, /상식개변: 회사편/);
  for (const marker of ['story-panel', 'mind-monitor', 'player-situation', 'character-catalog', 'company-map', 'action-panel']) assert.match(html, new RegExp(`id="${marker}"`));
  assert.match(html, /FREE-FORM INPUT/);
  assert.match(html, /LOCKED/);
  assert.match(app, /\/api\/v2\/turn/);
  assert.match(app, /literal_action/);
  assert.doesNotMatch(app, /choice-list|choices\.map|renderChoices|client.*navigation/i);
  assert.doesNotMatch(app, /src\/engine|runtime-core/);
});

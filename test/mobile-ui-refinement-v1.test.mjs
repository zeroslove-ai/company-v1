import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  choiceLabel,
  compactSummary,
  normalizeInnerThought,
  parsedTurnNarrative,
  physicalRelationDisplay,
  renderChoices,
  renderHistory,
  renderFocalCharacter,
  renderNarrative,
  stateDisplayValues
} from '../src/frontend/pages/render.js';
import { parseNarrative as parseFrontendNarrative } from '../src/frontend/pages/narrative.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class FakeNode {
  constructor(tag, id = '') {
    this.tag = tag;
    this.id = id;
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.title = '';
    this.ariaLabel = '';
    this.disabled = false;
    this.dataset = {};
    this.listeners = new Map();
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
}

function withFakeDocument(run) {
  const previous = globalThis.document;
  globalThis.document = { createElement: tag => new FakeNode(tag) };
  try { return run(); } finally { globalThis.document = previous; }
}

test('Story-authored compact labels drive the buttons while the full action payload is preserved', () => {
  const choices = [
    '김제나가 가리키는 브랜드 포지셔닝 문구를 함께 살펴보고 의견을 말한다.',
    '무릎을 꿇고 있는 김제나 곁에 빈 의자를 가져다 놓는다.',
    '이메이에게 타깃 정렬을 해결했던 사례를 묻는다.',
    '김제나가 더 편한 자세를 취해도 된다고 말한다.'
  ];
  const labels = ['자료검토', '의자가져오기', '사례질문', '자세배려'];
  const parsed = parseFrontendNarrative(`[1. 서사 및 행동]\n본문\n[2. 플레이어 속마음]\n생각\n[3. 플레이어 상황판]\n상태\n[4. 선택지]\n${choices.map((choice, index) => `${index + 1}. [${labels[index]}] ${choice}`).join('\n')}`);
  assert.deepEqual(parsed.choices, choices);
  assert.deepEqual(parsed.choice_labels, labels);

  withFakeDocument(() => {
    const current = new FakeNode('div', 'current-story');
    renderNarrative(current, parsed);
    const container = new FakeNode('div', 'choice-list');
    let selected = '';
    renderChoices(container, choices, { onChoose: value => { selected = value; } });
    assert.equal(container.children.length, 4);
    assert.deepEqual(container.children.map(button => button.textContent), ['1 자료검토', '2 의자가져오기', '3 사례질문', '4 자세배려']);
    assert.equal(container.children[0].title, choices[0]);
    assert.equal(container.children[0].ariaLabel, `1번 선택지: ${choices[0]}`);
    container.children[0].listeners.get('click')();
    assert.equal(selected, choices[0]);
  });
});

test('legacy unlabeled choices use a neutral prefix fallback rather than semantic guessing', () => {
  const choice = '김제나 선배가 바닥에 무릎을 꿇은 채 자료를 보여준다.';
  assert.equal(choiceLabel(choice), '김제나선배');
  assert.notEqual(choiceLabel(choice), '자료보기');
});

test('committed labels are reused only when the exact four full choices match', () => {
  const choices = ['첫 행동 전문', '둘 행동 전문', '셋 행동 전문', '넷 행동 전문'];
  const labels = ['첫행동', '둘행동', '셋행동', '넷행동'];
  withFakeDocument(() => {
    const storyHistory = new FakeNode('div', 'story-history');
    renderHistory(storyHistory, [{
      player_action: '이전 행동',
      parsed_blocks: { blocks: [{ type: 'scene', text: '본문' }], choices, choice_labels: labels },
      choices
    }]);
    const matched = new FakeNode('div', 'choice-list');
    renderChoices(matched, choices);
    assert.deepEqual(matched.children.map(button => button.textContent), ['1 첫행동', '2 둘행동', '3 셋행동', '4 넷행동']);

    const different = new FakeNode('div', 'choice-list');
    renderChoices(different, ['다른 선택지 하나', '다른 선택지 둘', '다른 선택지 셋', '다른 선택지 넷']);
    // J — 선택지 버튼은 더 이상 5글자로 자르지 않고 전체 문구를 표시한다 (CSS 말줄임).
    assert.equal(different.children[0].textContent, choiceLabel('다른 선택지 하나', 5));
  });
});

test('full choices remain visible in the narrative even when parsed blocks store them separately', () => {
  const choices = ['첫 번째 전체 선택지', '두 번째 전체 선택지', '세 번째 전체 선택지', '네 번째 전체 선택지'];
  const parsed = parsedTurnNarrative({
    parsed_blocks: { blocks: [{ type: 'scene', text: '서사 본문' }] },
    choices
  });
  assert.deepEqual(parsed.choices, choices);

  withFakeDocument(() => {
    const container = new FakeNode('story');
    renderNarrative(container, parsed);
    const choiceSection = container.children.at(-1);
    assert.equal(choiceSection.className, 'narrative-choices');
    assert.equal(choiceSection.children[0].textContent, '선택지');
    assert.deepEqual(choiceSection.children[1].children.map(item => item.textContent), choices);
  });
});

test('status projection removes focus, last-speaker, duplicate time, and fake recent-summary rows', () => {
  const values = stateDisplayValues({
    scene: {
      scene_state: { location_id: 'office', scene_goal: '팀에 적응하기', focus_thread: 'report_review' },
      world_state: { time_block: 'afternoon', work_hook: 'report_review' },
      story_summary_recent: '오프닝 원문 전체에 가까운 긴 문자열',
      csa_active: ['csa_1']
    },
    focal_character: { id: 'heroine3', last_speaker_id: 'heroine5' }
  });
  assert.equal(values.장소, '사무실');
  assert.equal(values.업무, '보고서 검토');
  assert.equal(values.활성규정, '1');
  assert.equal(values.흐름, '');
  assert.equal('초점' in values, false);
  assert.equal('마지막 화자' in values, false);
  assert.equal('시간' in values, false);
  assert.equal('최근요약' in values, false);
});

test('physical relation describes the player and counterpart without exposing internal ids', () => {
  const result = physicalRelationDisplay({
    id: 'heroine3',
    name: '김제나',
    last_speaker_id: 'heroine5',
    scene_state: { posture: 'kneeling', relative_position: 'front_of_player' }
  }, { posture: 'sitting' });
  assert.equal(result, '플레이어는 앉아 있다. 김제나는 플레이어 앞에서 무릎을 꿇고 있다.');
  assert.equal(result.includes('heroine3'), false);
  assert.equal(result.includes('heroine5'), false);
});

test('view-model resolves the canonical heroine name for the display-only posture card', () => {
  const model = buildCompanyGameViewModel({
    save: {
      committed_turn: 3,
      data: {
        turn_state: { committed_turn: 3 },
        focal_character_id: 'heroine3',
        last_speaker_id: 'heroine5',
        scene_state: { location_id: 'office' },
        world_state: {},
        npc_scene_state: { heroine3: { posture: 'kneeling', relative_position: 'front_of_player' } },
        player_scene_state: { posture: 'sitting' }
      }
    },
    recent_turns: []
  });
  assert.equal(model.focal_character.name, '김제나');
  assert.equal(model.focal_character.scene_state.relative_position, 'front_of_player');
});

test('only the real turn summary is compacted for the summary card', () => {
  const long = `  ${'요약 '.repeat(80)}  `;
  const compact = compactSummary(long, 20);
  assert.equal(Array.from(compact).length, 21);
  assert.equal(compact.endsWith('…'), true);
});

test('mobile CSS fixes four choices to one row and puts the compact input beside submit', () => {
  const css = fs.readFileSync(path.join(root, 'src/frontend/pages/hospital-panels.css'), 'utf8');
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.narrative-choices\s*\{/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) 82px/);
  assert.match(css, /#player-action[\s\S]*height:\s*42px/);
});

// ── 서사 표시 정상화: 플레이어 생각 중앙 복구 / 빈 상태 UI ────────────────

function sectionTitles(container) {
  return container.children
    .filter(child => child.className === 'character-detail-section')
    .map(child => child.children[0]?.textContent ?? '');
}

test('중앙 Story: parsed.player_inner_thought만 있으면 선택지 앞에 한 번만 표시한다', () => {
  withFakeDocument(() => {
    const container = new FakeNode('div', 'current-story');
    const parsed = {
      choices: ['A', 'B', 'C', 'D'],
      player_inner_thought: '와, 저거 완전 당황했네. 한 번만 더 놀려볼까.',
      blocks: [{ type: 'scene', text: '회의실 안이 조용해졌다.' }]
    };
    renderNarrative(container, parsed);
    const thoughts = container.children.filter(child => child.className === 'narrative-player_inner_thought');
    assert.equal(thoughts.length, 1, '생각은 정확히 한 번만');
    const thoughtText = thoughts[0].textContent;
    assert.ok(!thoughtText.includes('"'), '바깥 따옴표 제거');
    assert.ok(!thoughtText.includes('.\n'), '문장부호 뒤 자동 개행 없음 (모델 줄바꿈만 유지)');
    const thoughtIndex = container.children.indexOf(thoughts[0]);
    const choicesIndex = container.children.findIndex(child => child.className === 'narrative-choices');
    assert.ok(thoughtIndex < choicesIndex, '플레이어 생각이 선택지보다 앞');
    const container2 = new FakeNode('div', 'current-story');
    const parsed2 = {
      choices: ['A', 'B', 'C', 'D'],
      player_inner_thought: '중복 생각',
      blocks: [{ type: 'scene', text: '서사' }, { type: 'player_inner_thought', text: '블록 생각' }]
    };
    renderNarrative(container2, parsed2);
    const thoughts2 = container2.children.filter(child => child.className === 'narrative-player_inner_thought');
    assert.equal(thoughts2.length, 1, 'thought 블록이 있으면 삽입하지 않는다');
    assert.ok(thoughts2[0].textContent.includes('중복 생각'), 'canonical last thought is rendered');
  });
});

test('빈 상태 UI: 자세·관계 기록이 없으면 안내 문구와 0 기록 섹션을 만들지 않는다', () => {
  withFakeDocument(() => {
    const container = new FakeNode('div', 'focal-character');
    const focal = {
      name: '윤민아',
      id: 'heroine2',
      character: {
        stats: { affection: 10, acceptance: 8, arousal: 3, resistance: 2 },
        profile: { age: 27, department: '브랜드전략팀', position: '대리' },
        body: { height_cm: 164, weight_kg: 49 }
      }
    };
    renderFocalCharacter(container, focal, {});
    assert.ok(!container.children.some(child => child.className === 'physical-relation'), '빈 자세 안내 문구 미출력');
    const titles = sectionTitles(container);
    assert.ok(!titles.includes('관계·사정 기록'), '0뿐인 관계·사정 기록 섹션 미출력');
    assert.ok(!titles.includes('은밀정보'), '잠금 상태 은밀정보 섹션 미출력');
    assert.ok(titles.includes('인물정보'), '인물정보 유지');
    assert.ok(container.children.some(child => child.className === 'mind-stat-strip'), '스탯 스트립 유지');
    const container2 = new FakeNode('div', 'focal-character');
    const focal2 = {
      name: '윤민아',
      id: 'heroine2',
      scene_state: { posture: '앉아 있음', position_label: '플레이어 무릎 위에' },
      character: { stats: {} }
    };
    renderFocalCharacter(container2, focal2, {});
    assert.ok(container2.children.some(child => child.className === 'physical-relation'), '자세 정보가 있으면 표시');
  });
});

// ── 턴70: 속마음 표시 최소 정규화 (문장부호 자동 개행 제거) ──

test('턴70-B: 속마음 정규화 — 문장부호 자동 개행 없음, "."/".." 줄 제거, 연속 빈 줄 축소, 문단 유지', () => {
  // 9. 문장부호마다 강제 개행하지 않음
  const single = normalizeInnerThought('와, 저거 완전 당황했네. 한 번만 더 놀려볼까?');
  assert.equal(single, '와, 저거 완전 당황했네. 한 번만 더 놀려볼까?', '마침표·물음표 뒤 자동 개행 없음');
  // 10-11. "." / ".." / "..."만 있는 줄 제거
  const dots = normalizeInnerThought('첫 문장.\n.\n..\n...\n·\n-');
  assert.equal(dots, '첫 문장.', '점·기호만 있는 줄 제거');
  // 12. 연속 빈 줄 최대 한 줄
  const blanks = normalizeInnerThought('첫 줄\n\n\n\n\n둘째 줄');
  assert.equal(blanks, '첫 줄\n\n둘째 줄', '연속 빈 줄은 최대 한 줄');
  // 13. 정상 문단 줄바꿈 유지
  const paragraph = normalizeInnerThought('첫 문단입니다.\n둘째 문단입니다.');
  assert.equal(paragraph, '첫 문단입니다.\n둘째 문단입니다.', '모델 줄바꿈 유지');
  // 바깥 따옴표 제거
  assert.equal(normalizeInnerThought('"따옴표 안 생각"'), '따옴표 안 생각');
});

test('턴70-B2: Story/UI 계약 — player-status-slot 제거, 현재 상황 자연어 카드 렌더 없음, focal 2열 CSS', () => {
  const renderSrc = fs.readFileSync(path.join(root, 'src/frontend/pages/render.js'), 'utf8');
  assert.doesNotMatch(renderSrc, /player-status-slot/, 'render.js에서 player-status-slot 렌더 제거');
  assert.doesNotMatch(renderSrc, /플레이어 상황/, '현재 상황 자연어 카드 렌더 제거');
  assert.doesNotMatch(renderSrc, /playerStatus/, 'playerStatus display 제거');
  const htmlSrc = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  assert.doesNotMatch(htmlSrc, /player-status-slot/, 'index.html에서 player-status-slot 제거');
  const cssSrc = fs.readFileSync(path.join(root, 'src/frontend/pages/hospital-panels.css'), 'utf8');
  // 14. focal-character grid 2열
  assert.match(cssSrc, /\.focal-character \.state-list,[\s\S]*?grid-template-columns: max-content minmax\(0, 1fr\);/);
  // 15. 긴 위치 문장이 글자 단위로 깨지지 않음
  assert.match(cssSrc, /word-break: keep-all/);
  assert.match(cssSrc, /overflow-wrap: break-word/);
  assert.match(cssSrc, /white-space: nowrap/);
  // 16. 상호작용 인물 착의 이름/내용 한 행
  assert.match(cssSrc, /interacting-character-attire[\s\S]*?grid-template-columns: max-content minmax\(0, 1fr\);/);
});

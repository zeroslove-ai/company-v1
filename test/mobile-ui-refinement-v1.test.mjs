import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  choiceLabel,
  compactSummary,
  parsedTurnNarrative,
  physicalRelationDisplay,
  renderChoices,
  renderNarrative,
  stateDisplayValues
} from '../src/frontend/pages/render.js';
import { buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class FakeNode {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.title = '';
    this.ariaLabel = '';
    this.disabled = false;
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

test('compact choice buttons use about five characters while preserving the full action payload', () => {
  const choices = [
    '김제나 선배가 바닥에 무릎을 꿇은 채 자료를 보여주는 것을 살펴본다.',
    '이메이 선배와 대화에 합류한다.',
    '보고서 범위에 대해 질문한다.',
    '잠시 물러나 조용히 지켜본다.'
  ];
  assert.equal(choiceLabel(choices[0]), '자료보기');
  assert.equal(choiceLabel(choices[1]), '대화합류');
  assert.equal(Array.from(choiceLabel(choices[2])).length <= 5, true);

  withFakeDocument(() => {
    const container = new FakeNode('choices');
    let selected = '';
    renderChoices(container, choices, { onChoose: value => { selected = value; } });
    assert.equal(container.children.length, 4);
    assert.equal(container.children[0].textContent, '1 자료보기');
    assert.equal(container.children[0].title, choices[0]);
    assert.equal(container.children[0].ariaLabel, `1번 선택지: ${choices[0]}`);
    container.children[0].listeners.get('click')();
    assert.equal(selected, choices[0]);
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

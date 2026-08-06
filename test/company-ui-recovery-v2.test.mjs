import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCharacterDisplayDetails, buildPlayerSexualDisplay } from '../src/api/character-display.js';
import { parseNarrative as parseEngineNarrative } from '../src/engine/narrative-parser.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { parseNarrative as parseFrontendNarrative } from '../src/frontend/pages/narrative.js';
import { createUtilityUi } from '../src/frontend/pages/utility-ui.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '11111111-1111-4111-8111-111111111111';
const edition = {
  editionId: 'company-v1',
  characters: {
    characters: {
      heroine1: {
        character_id: 'heroine1', name: '서원희', age: 33, department: '브랜드전략팀', position: '차장', role_title: '팀장', company_tenure: '9년 차',
        prompt_card: { appearance: '단정한 정장' },
        body: { height_cm: 168, weight_kg: 55, body_type: '균형 잡힌 체형', cup: 'C컵' },
        private_info: {
          nipple: '분홍빛', areola_size: '보통', areola_color: '옅은 갈색', pubic_hair: '정리됨',
          past_partner_count: 2, past_orgasm_count: 7, relationship: '현재 연인 없음', intimate_notes: '명확한 합의를 중요하게 여긴다.'
        }
      }
    }
  },
  generalNpcs: { profiles: {} },
  organization: { departments: [] }
};

class FakeNode {
  constructor() {
    this.children = [];
    this.listeners = new Map();
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.value = '';
    this.textContent = '';
    this.dataset = {};
    this.title = '';
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  focus() {}
}

class FakeAudio {
  constructor() { this.playCalls = 0; this.pauseCalls = 0; this.muted = false; this.src = ''; this.currentTime = 0; }
  play() { this.playCalls += 1; return Promise.resolve(); }
  pause() { this.pauseCalls += 1; }
}

function fakeDocument(ids) {
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode()]));
  return {
    nodes,
    documentRef: {
      querySelector: selector => nodes[selector.slice(1)] ?? null,
      createElement: () => new FakeNode()
    }
  };
}

test('engine and frontend parsers split canonical dialogue into visible TTS lines', () => {
  const story = [
    '[1. 서사 및 행동]',
    '서원희 (낮고 단호하게): “보고서를 다시 확인하세요.”',
    '서원희: “이번에는 숫자부터 봐요.”',
    '[2. 플레이어 속마음]', '다시 보자.',
    '[3. 플레이어 상황판]', '검토 중.',
    '[4. 선택지]', '1. A', '2. B', '3. C', '4. D'
  ].join('\n');
  const master = { characters: [{ character_id: 'heroine1', name: '서원희' }] };
  const engine = parseEngineNarrative(story, { master });
  assert.equal(engine.dialogue_lines.length, 2);
  assert.equal(engine.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(engine.dialogue_lines[1].direction, '자연스럽게');
  assert.equal(engine.blocks.filter(block => block.type === 'dialogue').length, 2);

  const frontend = parseFrontendNarrative(story, { speakerDirectory: { heroine1: { name: '서원희' } } });
  assert.equal(frontend.dialogue_lines.length, 2);
  assert.equal(frontend.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(frontend.blocks.filter(block => block.type === 'dialogue').length, 2);
});

test('Story prompt ends with an exact registered-name acting-tone dialogue contract', () => {
  const messages = buildStoryPrompt({
    edition,
    context: { game: {}, save: { edition: 'company-v1', save_schema_version: 1, scene_state: { participants: ['heroine1'] }, world_state: {} }, recent_turns: [] },
    playerAction: '보고서를 확인한다.',
    expectedTurn: 1
  });
  const system = messages[0].content;
  assert.match(system, /최종 대사 출력 계약/);
  assert.match(system, /등록된 전체 이름/);
  assert.match(system, /괄호·연기톤·콜론·한국어 큰따옴표/);
  assert.match(system, /서술문 안에 섞인 발화/);
});

test('manual TTS recovers a registered line from an existing Story without stored dialogue_lines', async () => {
  const { nodes, documentRef } = fakeDocument(['tts-enabled', 'play-tts', 'mind-monitor']);
  const requests = [];
  let audio = null;
  class CapturedAudio extends FakeAudio { constructor() { super(); audio = this; } }
  const context = { display: { npc_directory: { heroine1: { name: '서원희' } } }, save: { data: {} } };
  const ui = createUtilityUi({
    documentRef,
    api: {
      tts: async body => {
        requests.push(body);
        return new Response(new Blob(['audio']), { headers: { 'content-type': 'audio/mpeg' } });
      }
    },
    gameId,
    getContext: () => context,
    getViewModel: () => ({
      story: { story_text: '[1. 서사 및 행동]\n서원희: “기존 기록도 읽을 수 있어요.”\n[2. 플레이어 속마음]\n확인했다.' },
      media: { dialogue_lines: [], image_character_id: 'heroine1' },
      focal_character: { id: 'heroine1', last_speaker_id: 'heroine1' }
    }),
    AudioImpl: CapturedAudio,
    urlApi: { createObjectURL: () => 'blob:recovered-tts', revokeObjectURL() {} }
  });
  ui.syncTtsControl();
  assert.equal(nodes['play-tts'].disabled, false);
  await ui.playTts();
  assert.deepEqual(requests, [{
    game_id: gameId,
    character_id: 'heroine1',
    text: '기존 기록도 읽을 수 있어요.',
    direction: '자연스럽게'
  }]);
  assert.equal(audio.src, 'blob:recovered-tts');
});

test('character display derives stat deltas from pre/post saves and unlocks private records from committed ledger', () => {
  const save = {
    npc_stats: { heroine1: { affinity: 4, resistance: 40, csa_acceptance: 12, sexual_arousal: 3 } },
    npc_relationship_state: { heroine1: { relationship_summary: '서로의 경계를 확인한 관계다.', milestones: { sexual_relationship_started_turn: 4 } } },
    sexual_event_ledger: [
      { turn: 4, actor_id: 'player', target_id: 'heroine1', action_type: 'ejaculation', completed: true, interrupted: false, evidence: '합의된 장면이 완료되었다.' }
    ],
    player_sexual_state: { arousal: 22, ejaculation_progress: 60, ejaculation_count: 1 }
  };
  const latestTurn = {
    pre_save: { npc_stats: { heroine1: { affinity: 2, resistance: 40, csa_acceptance: 5, sexual_arousal: 0 } } },
    post_save: { npc_stats: save.npc_stats }
  };
  const details = buildCharacterDisplayDetails(save, edition, latestTurn).heroine1;
  assert.deepEqual(details.stat_changes, {
    affinity: { from: 2, to: 4, delta: 2 },
    csa_acceptance: { from: 5, to: 12, delta: 7 },
    sexual_arousal: { from: 0, to: 3, delta: 3 }
  });
  assert.equal(details.relationship_record.player_ejaculation_count, 1);
  assert.equal(details.relationship_record.total_events, 1);
  assert.equal(details.private_info.unlocked, true);
  assert.equal(details.private_info.past_partner_count, 2);

  const player = buildPlayerSexualDisplay(save);
  assert.equal(player.ejaculation_progress, 60);
  assert.equal(player.ejaculation_count, 1);
  assert.equal(player.total_sexual_events, 1);
});

test('CSA app handoff closes synchronously instead of awaiting Story Extract Commit', () => {
  const source = fs.readFileSync(path.join(root, 'src/frontend/pages/app.js'), 'utf8');
  assert.match(source, /onSubmit:\s*\(displayInput, canonicalAction\)\s*=>\s*\{/);
  assert.match(source, /const handoff = startNewAction\(displayInput, canonicalAction\);/);
  assert.match(source, /Promise\.resolve\(handoff\)/);
  assert.match(source, /return true;/);
  assert.doesNotMatch(source, /onSubmit:\s*async\s*\(displayInput, canonicalAction\)/);
});

test('production Turn 20 speaker rules: vocative 씨 → player, 팀장님 excludes team lead, speech-subject wins', () => {
  const story = [
    '[1. 서사 및 행동]',
    '이메이의 손끝이 내 바지 위에서 망설이듯 멈춰 있었다.',
    '"이메이 씨, 여기까지 오면 좀 더 편하게 해줘도 되지 않겠어?"',
    '이메이의 눈동자가 흔들렸다.',
    '"저... 감사님, 이거 진짜 처음인데..."',
    '"처음이니까 더 잘해주고 싶은 거 아니야? 느낌 가는 대로 해."',
    '그때, 서원희가 슬라이드 정리를 멈추고 우리 쪽을 바라보고 있었다.',
    '"태양 감사님, 시간 괜찮으시면 슬라이드 마지막 부분만 짚고 넘어가려고요. 이메이 씨, 감사님이랑 준비됐어?"',
    '서원희가 딱딱하게 말했다. 이메이가 화들짝 놀라 손을 빼려는 듯 움직였다.',
    '"네... 팀장님, 조금만, 저... 정리하고 바로."',
    '"그럼 천천히 해. 일단 감사님한테 핵심만 말씀드릴게."',
    '[2. 플레이어 속마음]', '아이고.',
    '[3. 플레이어 상황판]', '보고실.',
    '[4. 선택지]', '1. A', '2. B', '3. C', '4. D'
  ].join('\n');
  const expected = ['player', 'heroine5', 'player', 'heroine1', 'heroine5', 'heroine1'];
  const dir = { heroine1: { name: '서원희' }, heroine5: { name: '이메이' } };
  const mstr = { characters: [
    { character_id: 'heroine1', name: '서원희' },
    { character_id: 'heroine5', name: '이메이' }
  ]};
  for (const parsed of [
    parseFrontendNarrative(story, { speakerDirectory: dir }),
    parseEngineNarrative(story, { master: mstr })
  ]) {
    const dialogues = parsed.blocks.filter(b => b.type === 'dialogue');
    assert.equal(dialogues.length, expected.length);
    expected.forEach((exp, i) => {
      assert.equal(dialogues[i].speaker_id, exp, `대사 ${i + 1} 화자`);
    });
  }
});

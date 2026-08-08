import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPosturePatch } from '../src/engine/state/posture.js';
import { retainEvidencedClothing } from '../src/engine/state/clothing.js';
import { buildSceneStatePatch } from '../src/engine/state/physical-state.js';
import { applyGuardedStateDelta } from '../src/engine/guarded-merge.js';
import { physicalRelationDisplay, stateDisplayValues } from '../src/frontend/pages/render.js';

const canonicalSave = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url), 'utf8'));

function clothingEnvelope({ stateDelta, evidence, story, npcsPresent = ['npc-hayeon'], focal = 'npc-hayeon' }) {
  return {
    state_delta: stateDelta,
    outcome: 'success',
    evidence,
    turn_summary: '',
    mind_monitor: {},
    choices: ['계속한다', '질문한다', '반응을 본다', '기다린다'],
    dialogue_lines: [],
    npcs_present: npcsPresent,
    action_target_id: focal,
    focal_character_id: focal,
    last_speaker_id: null,
    image_character_id: focal,
    player_inner_thought: '',
    player_status: '',
    elapsed_minutes: 1,
    warnings: [],
    story
  };
}

function applyClothing(save, envelope, story, {
  npcIds = new Set(['npc-hayeon']),
  master = { characters: [{ character_id: 'npc-hayeon', name: '김하연' }] },
  castNpcIds = ['npc-hayeon'],
  enteringNpcIds = null,
  hasCastContract = null
} = {}) {
  // scene_cast_contract 구성 — PR #30: present + entering union이 물리적 정본.
  // hasCastContract=false면 contract 자체를 넣지 않는다 (legacy fallback).
  const includeCast = hasCastContract === false ? false : (Array.isArray(castNpcIds) || Array.isArray(enteringNpcIds));
  return applyGuardedStateDelta(save, envelope, {
    storyText: story,
    parsedStory: {
      choices: envelope.choices,
      dialogue_lines: [],
      ...(includeCast ? {
        scene_cast_contract: {
          present_npc_ids: Array.isArray(castNpcIds) ? castNpcIds : [],
          entering_npc_ids: Array.isArray(enteringNpcIds) ? enteringNpcIds : []
        }
      } : {})
    },
    npcIds,
    master,
    expectedTurn: 8,
    actionId: 'action-8',
    turnId: 'turn-8'
  });
}

test('posture accepts Story-grounded Korean text without an enum entry', () => {
  const first = buildPosturePatch({ proposal: { posture: '의자 끝에 비스듬히 걸터앉아 있다' }, turnNumber: 17 });
  assert.equal(first.posture, '의자 끝에 비스듬히 걸터앉아 있다');
  const changed = buildPosturePatch({
    previous: first,
    proposal: { posture: '책상에 한 손을 짚고 몸을 숙이고 있다', evidence_valid: true },
    turnNumber: 18
  });
  assert.equal(changed.posture, '책상에 한 손을 짚고 몸을 숙이고 있다');
});

test('clothing normalizes free-form Extract keys/values into canonical slots with exact evidence', () => {
  const story = '김제나는 흰 셔츠를 벗어 의자에 걸었다. 김제나는 브라를 벗었다.';
  const result = retainEvidencedClothing({
    previousClothing: {},
    proposedClothing: { top: 'removed', bra: 'removed' },
    evidenceMap: '김제나는 흰 셔츠를 벗어 의자에 걸었다.',
    narrativeText: story, characterName: '김제나',
    actorId: 'heroine3', npcsPresent: ['heroine3'], registeredNpcNames: ['김하연', '김제나', '윤민아']
  });
  assert.deepEqual(result.clothing, { uniform_top: 'removed', underwear_top: 'removed' });
  assert.deepEqual(result.rejections, []);
});

test('clothing rejects free-form keys, ambiguous keys, and garment-name-only values', () => {
  const story = '김제나가 셔츠를 정리했다.';
  const noMap = retainEvidencedClothing({
    proposedClothing: { 상의: 'worn' },
    evidenceMap: story, narrativeText: story, characterName: '김제나',
    actorId: 'heroine3', npcsPresent: ['heroine3'], registeredNpcNames: ['김하연', '김제나', '윤민아']
  });
  assert.deepEqual(noMap.clothing, { uniform_top: 'worn' }, '상의 alias는 uniform_top으로 정규화');
  const ambiguous = retainEvidencedClothing({
    proposedClothing: { 속옷: 'worn' },
    evidenceMap: story, narrativeText: story, characterName: '김제나',
    actorId: 'heroine3', npcsPresent: ['heroine3'], registeredNpcNames: ['김하연', '김제나', '윤민아']
  });
  assert.deepEqual(ambiguous.clothing, {}, '속옷은 어느 슬롯인지 불명확 — 복제 금지');
  assert.ok(ambiguous.rejections.some(r => r.startsWith('invalid_clothing_key')));
  const garmentName = retainEvidencedClothing({
    proposedClothing: { uniform_top: '흰 셔츠' },
    evidenceMap: story, narrativeText: story, characterName: '김제나',
    actorId: 'heroine3', npcsPresent: ['heroine3'], registeredNpcNames: ['김하연', '김제나', '윤민아']
  });
  assert.deepEqual(garmentName.clothing, {}, '복장 이름 값은 enum 추측 금지');
  assert.ok(garmentName.rejections.some(r => r.startsWith('invalid_clothing_value')));
});

test('Commit reads actor-scoped top-level clothing evidence for NPC and player', () => {
  const save = structuredClone(canonicalSave);
  save.player_scene_state = { ...save.player_scene_state, clothing: {} };
  save.npc_scene_state['npc-hayeon'] = { ...save.npc_scene_state['npc-hayeon'], clothing: {} };
  const npcQuote = '김하연은 재킷을 벗어 의자에 걸고 흰색 브래지어 차림을 드러냈다.';
  const playerQuote = '플레이어는 정장 바지를 벗어 의자 위에 올려두었다.';
  const story = `${npcQuote} ${playerQuote}`;
  const envelope = clothingEnvelope({
    story,
    stateDelta: {
      npc_scene_state: {
        'npc-hayeon': { clothing: { uniform_top: 'removed', underwear_top: 'worn' } }
      },
      player_scene_state: { clothing: { uniform_bottom: 'removed' } }
    },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: npcQuote, character_id: 'npc-hayeon'
        },
        player: {
          quote: playerQuote, character_id: 'player'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story);
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {
    uniform_top: 'removed', underwear_top: 'worn'
  });
  assert.deepEqual(result.nextSave.player_scene_state.clothing, { uniform_bottom: 'removed' });
});

test('Commit accepts actor-level clothing evidence only when actor ownership matches', () => {
  const save = structuredClone(canonicalSave);
  save.npc_scene_state['npc-hayeon'] = { ...save.npc_scene_state['npc-hayeon'], clothing: {} };
  const quote = '김하연은 재킷을 벗어 옆자리 의자 등받이에 걸쳤다.';
  const envelope = clothingEnvelope({
    story: quote,
    stateDelta: {
      npc_scene_state: {
        'npc-hayeon': { clothing: { uniform_top: 'removed' } }
      }
    },
    evidence: {
      clothing: {
        'npc-hayeon': { quote, character_id: 'npc-hayeon' }
      }
    }
  });
  const result = applyClothing(save, envelope, quote);
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.uniform_top, 'removed');
});

test('bad auxiliary physical fields degrade independently and carry prior state', () => {
  const result = buildSceneStatePatch({
    previous: { posture: '책상 앞에 서 있다', location_label: '대회의실', clothing: {} },
    proposal: { posture: '소파에 누워 있다', location_label: '옥상' },
    evidenceMap: {}, narrativeText: '윤민아는 보고서를 넘겼다.', characterName: '윤민아', turnNumber: 18
  });
  assert.equal(result.state.posture, '소파에 누워 있다');
  assert.equal(result.state.location_label, '대회의실');
  assert.ok(result.warnings.includes('unevidenced_posture_change'));
  assert.ok(result.warnings.includes('unevidenced_location_change'));
});

test('frontend passes Korean physical text through and hides unknown internal codes', () => {
  const relation = physicalRelationDisplay({
    name: '윤민아', scene_state: { posture: '책상에 손을 짚고 플레이어 쪽으로 몸을 기울이고 있다' }
  }, { posture: '회의실 의자에 편하게 앉아 있다' });
  assert.match(relation, /회의실 의자에 편하게 앉아 있다/);
  assert.match(relation, /책상에 손을 짚고 플레이어 쪽으로 몸을 기울이고 있다/);
  assert.equal(stateDisplayValues({ scene: { scene_state: { location_id: 'large_meeting_room' } } }).장소, '');
});

test('frontend source renders interacting NPC clothing and always exposes player clothing state', () => {
  const render = fs.readFileSync(new URL('../src/frontend/pages/render.js', import.meta.url), 'utf8');
  assert.match(render, /상호작용 인물 착의/);
  assert.match(render, /model\.interacting_characters/);
  assert.match(render, /clothingDisplay\(player\?\.clothing\) \|\| '확인되지 않음'/);
  assert.match(render, /LEGACY_CLOTHING_LABELS/);
  const css = fs.readFileSync(new URL('../src/frontend/pages/hospital-panels.css', import.meta.url), 'utf8');
  assert.match(css, /-webkit-line-clamp: unset/);
});

// ── 단일 NPC 장면 actor-scoped 착의 evidence 예외 (운영 64·65턴 실패 수정) ──

const HAYEON_MASTER = {
  characters: [{ character_id: 'npc-hayeon', name: '김하연' }]
};
const TWO_NPC_MASTER = {
  characters: [
    { character_id: 'npc-hayeon', name: '김하연' },
    { character_id: 'heroine3', name: '김제나' },
    { character_id: 'heroine2', name: '윤민아' }
  ]
};

function sceneSave() {
  const save = structuredClone(canonicalSave);
  save.npc_scene_state['npc-hayeon'] = { ...save.npc_scene_state['npc-hayeon'], clothing: {} };
  return save;
}

test('회귀1: 단일 NPC + nested actor evidence + 이름 없는 exact quote → 저장 성공 (실제 65턴 형태)', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 아예 벗어 의자에 걸었다. 속옷 차림으로 사무실에 서 있는 게 규정이라지만.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '그녀가 셔츠를 아예 벗어 의자에 걸었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.uniform_top, 'removed',
    '단일 NPC 장면 + nested actor evidence는 이름 없이 저장');
});

test('회귀2: 단일 NPC + nested actor evidence + 대상 전체 이름 포함 → 기존대로 저장 성공', () => {
  const save = sceneSave();
  const story = '김하연이 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '김하연이 셔츠를 벗어 의자에 걸었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.uniform_top, 'removed');
});

test('회귀3: NPC 2명 + 이름 없는 quote → 저장 거부, 이전 clothing 유지', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['npc-hayeon', 'heroine3'],
    focal: 'npc-hayeon',
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '그녀가 셔츠를 벗어 의자에 걸었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  // PR #30 — 단일 NPC 판정은 scene cast 정본 사용 (envelope.npcs_present 아님).
  // cast가 2명이면 단일 NPC 예외 비활성 → 이름 없는 quote 거부.
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER, npcIds: new Set(['npc-hayeon', 'heroine3']),
    castNpcIds: ['npc-hayeon', 'heroine3']
  });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    '다중 NPC 장면은 이름 없는 quote 거부');
  assert.ok(result.warnings.some(w => w.includes('unevidenced_clothing_change')), result.warnings.join(' '));
});

test('회귀4: NPC 2명 + 대상 이름 포함 + actor_id 일치 → 해당 NPC만 저장', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '김제나가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['npc-hayeon', 'heroine3'],
    focal: 'heroine3',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '김제나가 셔츠를 벗어 의자에 걸었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER, npcIds: new Set(['npc-hayeon', 'heroine3'])
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed');
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {}, 'heroine3에만 저장');
});

test('회귀5: 단일 NPC 장면이라도 quote에 다른 등록 NPC 이름이 명시되면 거부', () => {
  const save = sceneSave();
  const story = '윤민아가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '윤민아가 셔츠를 벗어 의자에 걸었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: TWO_NPC_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    '다른 NPC 이름이 명시되면 잘못된 귀속 — 거부');
  assert.ok(result.warnings.some(w => w.includes('unevidenced_clothing_change')), result.warnings.join(' '));
});

test('회귀6: 현재 장면에 없는 actor_id → 저장 거부', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['npc-hayeon'],
    focal: 'npc-hayeon',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '그녀가 셔츠를 벗어 의자에 걸었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER, npcIds: new Set(['npc-hayeon', 'heroine3'])
  });
  // heroine3는 장면(npc-hayeon만)에 없으므로 patch 자체가 거부된다.
  assert.deepEqual(result.nextSave.npc_scene_state['heroine3']?.clothing ?? {}, {},
    '장면 밖 actor는 착의 patch 없음');
});

test('회귀7: actor 키 없는 evidence + 이름 없는 quote → 거부', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        uniform_top: { quote: '그녀가 셔츠를 벗어 의자에 걸었다.', character_id: 'npc-hayeon' }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    'flat evidence는 단일 NPC 예외 없음 — 이름 필요');
});

test('회귀8: player actor 경로는 기존대로 저장 성공', () => {
  const save = sceneSave();
  save.player_scene_state = { ...save.player_scene_state, clothing: {} };
  const story = '플레이어는 정장 바지를 벗어 의자 위에 올려두었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { player_scene_state: { clothing: { uniform_bottom: 'removed' } } },
    evidence: {
      clothing: {
        player: {
          quote: story, character_id: 'player'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.equal(result.nextSave.player_scene_state.clothing.uniform_bottom, 'removed');
});

test('회귀9: player alias actor key는 canonical player로 보존', () => {
  const save = sceneSave();
  save.player_scene_state = { ...save.player_scene_state, clothing: {} };
  const story = '플레이어는 정장 바지를 벗어 의자 위에 올려두었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { player_scene_state: { clothing: { uniform_bottom: 'removed' } } },
    evidence: {
      clothing: {
        'player-1': {

          quote: story, character_id: 'player-1'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.equal(result.nextSave.player_scene_state.clothing.uniform_bottom, 'removed',
    'player-1 키는 canonical player로 정규화');
});

test('회귀10: 규정 문구만 존재하면 actual clothing 생성 없음', () => {
  const save = sceneSave();
  const story = '여성 직원은 속옷 차림으로 근무해야 한다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '여성 직원은 속옷 차림으로 근무해야 한다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    '규정 문구는 실제 착의 근거가 아님');
});

test('회귀11: planned-only 행동은 착의 변화 없음', () => {
  const save = sceneSave();
  const story = '김하연은 셔츠를 벗으려고 손을 뻗었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '김하연은 셔츠를 벗으려고 손을 뻗었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    '완료되지 않은 행동은 removed 저장 금지');
});

test('회귀12: posture·position은 기존 동작 유지 (evidence gate 회귀 없음)', () => {
  // posture는 evidence 없이도 텍스트 반영, location은 evidence 필요 (기존 계약 유지)
  const result = buildSceneStatePatch({
    previous: { posture: '서 있다', location_label: '사무실', clothing: {} },
    proposal: { posture: '앉아 있다', location_label: '회의실' },
    evidenceMap: {}, narrativeText: '김하연은 자리에 앉았다.', characterName: '김하연', turnNumber: 18
  });
  assert.equal(result.state.posture, '앉아 있다');
  assert.equal(result.state.location_label, '사무실');
  assert.ok(result.warnings.includes('unevidenced_location_change'));
  // 단일 NPC 파라미터가 posture/position 경로에 영향을 주지 않는다.
  const withScene = buildSceneStatePatch({
    previous: { posture: '서 있다', location_label: '사무실', clothing: {} },
    proposal: { posture: '걷고 있다' },
    evidenceMap: {}, narrativeText: '김하연이 복도를 걸었다.', characterName: '김하연',
    actorId: 'npc-hayeon', npcsPresent: ['npc-hayeon'], registeredNpcNames: ['김하연'], turnNumber: 19
  });
  assert.equal(withScene.state.posture, '걷고 있다');
});

test('회귀14: extract-prompt는 착의 actor-level evidence 계약을 담는다', () => {
  const extractPrompt = fs.readFileSync(new URL('../src/engine/extract-prompt.js', import.meta.url), 'utf8');
  assert.match(extractPrompt, /actor_id is player for the player/);
  assert.match(extractPrompt, /evidence\.clothing\[actor_id\]=\{quote,character_id\}/);
  assert.match(extractPrompt, /When only a regulation\/plan exists and the attire is not shown in Story, make no clothing patch/);
});

// ── 후속 보정: scene cast 정본 + character_id 충돌/필수 (authority 누수 3건) ──

test('회귀A: post-Story npcs_present가 최종 착의 presence 권위다', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '그녀가 셔츠를 벗었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['heroine3'],   // Extract가 한 명만 반환 (누락)
    focal: 'heroine3',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '그녀가 셔츠를 벗었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['npc-hayeon', 'heroine3']),
    castNpcIds: ['heroine2', 'heroine3']  // scene cast 정본은 2명
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed',
    '최종 Story presence에 포함된 heroine3 착의는 저장');
});

test('회귀B: nested actor key와 내부 character_id 충돌 → 저장 거부', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '그녀가 셔츠를 벗어 의자에 걸었다.', character_id: 'heroine2'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: TWO_NPC_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    'nested여도 내부 character_id가 충돌하면 무시하지 않는다 — 거부');
});

test('회귀C: actor 키 없는 evidence에 character_id 없음 → 이름이 있어도 저장 거부', () => {
  const save = sceneSave();
  const story = '김하연이 셔츠를 벗었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        uniform_top: { quote: '김하연이 셔츠를 벗었다.' }  // character_id 없음
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    'flat evidence는 character_id 필수 — 이름이 있어도 거부');
});

test('회귀D: actor 키 + character_id 정확 일치 + 이름 포함 → 기존대로 저장 성공', () => {
  const save = sceneSave();
  const story = '김하연이 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': { quote: '김하연이 셔츠를 벗어 의자에 걸었다.', character_id: 'npc-hayeon' }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.uniform_top, 'removed');
});

test('회귀E: 단일 NPC scene cast + nested actor + 이름 없는 quote → 65턴 성공 유지', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 아예 벗어 의자에 걸었다. 속옷 차림으로 사무실에 서 있는 게 규정이라지만.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '그녀가 셔츠를 아예 벗어 의자에 걸었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  // scene cast가 단일 NPC로 확정된 장면 — cast 기반 정본으로도 예외 동작 유지.
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER, castNpcIds: ['npc-hayeon'] });
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.uniform_top, 'removed');
});

test('회귀F: 다중 NPC scene cast + 대상 이름 포함 → 해당 NPC만 저장 (기존 성공 유지)', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '김제나가 셔츠를 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['heroine3'],
    focal: 'heroine3',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '김제나가 셔츠를 벗어 의자에 걸었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['npc-hayeon', 'heroine3']),
    castNpcIds: ['npc-hayeon', 'heroine3']
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed');
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {}, 'heroine3에만 저장');
});

// ── PR #30 보정: 단일 NPC 판정 = present + entering union (envelope.npcs_present 제거) ──

test('PR30-A: post-Story presence가 누락된 cast를 축소해도 최종 actor evidence를 저장', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '그녀가 셔츠를 벗었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['heroine3'],   // Extract가 1명만 반환 (entering의 heroine2 누락)
    focal: 'heroine3',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '그녀가 셔츠를 벗었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['npc-hayeon', 'heroine3', 'heroine2']),
    castNpcIds: ['heroine3'],     // present 1명
    enteringNpcIds: ['heroine2']  // entering 1명 → 물리적 union 2명
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed');
});

test('PR30-B: present 0명 + entering 1명 → 물리적 단일 NPC, nested actor-scoped 이름 없는 quote 저장 성공', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '그녀가 셔츠를 벗었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['heroine3'],
    focal: 'heroine3',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '그녀가 셔츠를 벗었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['heroine3']),
    castNpcIds: [],              // present 0명
    enteringNpcIds: ['heroine3'] // entering 1명 → 물리적 단일 NPC
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed',
    'entering 1명은 물리적 현장 인물 — 단일 NPC 예외 성립');
});

test('PR30-C: cast보다 post-Story npcs_present가 최종 장면을 결정', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '그녀가 셔츠를 벗었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['heroine3'],   // Extract만 1명 주장
    focal: 'heroine3',
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '그녀가 셔츠를 벗었다.', character_id: 'heroine3'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['heroine3']),
    castNpcIds: [],  // present 0명
    enteringNpcIds: [] // entering 0명 → 물리적 0명
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed');
});

test('PR30-D: scene_cast_contract 없음 → legacy participants fallback 단일 NPC, nested actor-scoped 이름 없는 quote 저장 성공', () => {
  const save = sceneSave();
  save.scene_state = { ...save.scene_state, participants: ['player', 'heroine3'] };
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '그녀가 셔츠를 벗었다.';
  const envelope = clothingEnvelope({
    story,
    npcsPresent: ['heroine3'],
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': {

          quote: '그녀가 셔츠를 벗었다.', character_id: 'heroine3'
        }
      }
    }
  });
  // hasCastContract=false → scene_cast_contract 미포함 → preSave.scene_state.participants fallback
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['heroine3']),
    hasCastContract: false
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed',
    'legacy fallback participants(player 제외) 단일 NPC — 저장 성공');
});

test('PR30-E: 기존 65턴 fixture — present 1명 + entering 0명 → uniform_top=removed 성공 유지', () => {
  const save = sceneSave();
  const story = '그녀가 셔츠를 아예 벗어 의자에 걸었다. 속옷 차림으로 사무실에 서 있는 게 규정이라지만.';
  const envelope = clothingEnvelope({
    story,
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': {

          quote: '그녀가 셔츠를 아예 벗어 의자에 걸었다.', character_id: 'npc-hayeon'
        }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: HAYEON_MASTER,
    castNpcIds: ['npc-hayeon'],  // present 1명
    enteringNpcIds: []           // entering 0명 → 물리적 단일 NPC 유지
  });
  assert.equal(result.nextSave.npc_scene_state['npc-hayeon'].clothing.uniform_top, 'removed',
    '65턴 형태 present 1명 + entering 0명 — 기존 성공 유지');
});

// ── 턴70: 착의 evidence actor 단위 단순화 — 필수 회귀 26~28 ──

test('턴70-26: actor별 evidence 하나로 단일 슬롯 변경 성공', () => {
  const save = sceneSave();
  const story = '김제나는 재킷을 벗어 의자에 걸었다.';
  const envelope = clothingEnvelope({
    story,
    focal: 'heroine3',
    npcsPresent: ['heroine3'],
    stateDelta: { npc_scene_state: { 'heroine3': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'heroine3': { quote: '김제나는 재킷을 벗어 의자에 걸었다.', character_id: 'heroine3' }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['heroine3']),
    castNpcIds: ['heroine3']
  });
  assert.equal(result.nextSave.npc_scene_state['heroine3'].clothing.uniform_top, 'removed');
});

test('턴70-27: "속옷 차림" fixture — actor evidence 하나로 canonical 4슬롯 모두 저장', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '속옷 차림으로 서 있는 그녀';
  const envelope = clothingEnvelope({
    story,
    focal: 'heroine3',
    npcsPresent: ['heroine3'],
    stateDelta: {
      npc_scene_state: {
        'heroine3': {
          clothing: {
            uniform_top: 'removed', uniform_bottom: 'removed',
            underwear_top: 'worn', underwear_bottom: 'worn'
          }
        }
      }
    },
    evidence: {
      clothing: {
        'heroine3': { quote: '속옷 차림으로 서 있는 그녀', character_id: 'heroine3' }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['heroine3']),
    castNpcIds: ['heroine3']
  });
  assert.deepEqual(result.nextSave.npc_scene_state['heroine3'].clothing, {
    uniform_top: 'removed', uniform_bottom: 'removed',
    underwear_top: 'worn', underwear_bottom: 'worn'
  }, 'quote 하나로 제안된 네 슬롯 모두 적용');
});

test('턴70-28: 같은 quote로 네 슬롯 모두 worn 제안 — Commit은 의미 재판정 없이 canonical proposal 적용', () => {
  const save = sceneSave();
  save.npc_scene_state['heroine3'] = { ...save.npc_scene_state['heroine3'], clothing: {} };
  const story = '속옷 차림으로 서 있는 그녀';
  const envelope = clothingEnvelope({
    story,
    focal: 'heroine3',
    npcsPresent: ['heroine3'],
    stateDelta: {
      npc_scene_state: {
        'heroine3': {
          clothing: {
            uniform_top: 'worn', uniform_bottom: 'worn',
            underwear_top: 'worn', underwear_bottom: 'worn'
          }
        }
      }
    },
    evidence: {
      clothing: {
        'heroine3': { quote: '속옷 차림으로 서 있는 그녀', character_id: 'heroine3' }
      }
    }
  });
  const result = applyClothing(save, envelope, story, {
    master: TWO_NPC_MASTER,
    npcIds: new Set(['heroine3']),
    castNpcIds: ['heroine3']
  });
  // Commit은 slot 의미 regex 없이 제안을 그대로 적용한다 (Extract 프롬프트가 올바른 proposal을 만들 책임).
  assert.deepEqual(result.nextSave.npc_scene_state['heroine3'].clothing, {
    uniform_top: 'worn', uniform_bottom: 'worn',
    underwear_top: 'worn', underwear_bottom: 'worn'
  });
});

test('턴70-29: 규정만 존재하고 실제 복장이 Story에 드러나지 않으면 patch 없음 (재확인)', () => {
  const save = sceneSave();
  const story = '회의가 계속되었다.';
  const envelope = clothingEnvelope({
    story,
    focal: 'npc-hayeon',
    npcsPresent: ['npc-hayeon'],
    stateDelta: { npc_scene_state: { 'npc-hayeon': { clothing: { uniform_top: 'removed' } } } },
    evidence: {
      clothing: {
        'npc-hayeon': { quote: '여성 직원은 속옷 차림으로 근무해야 한다.', character_id: 'npc-hayeon' }
      }
    }
  });
  const result = applyClothing(save, envelope, story, { master: HAYEON_MASTER });
  assert.deepEqual(result.nextSave.npc_scene_state['npc-hayeon'].clothing, {},
    '규정 문구는 actual clothing 근거가 아님');
});

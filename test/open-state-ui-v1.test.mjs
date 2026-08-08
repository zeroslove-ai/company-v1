import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPosturePatch } from '../src/engine/state/posture.js';
import { retainEvidencedClothing } from '../src/engine/state/clothing.js';
import { buildSceneStatePatch } from '../src/engine/state/physical-state.js';
import { applyGuardedStateDelta } from '../src/engine/guarded-merge.js';
import { physicalRelationDisplay, stateDisplayValues } from '../src/frontend/pages/render.js';

const canonicalSave = JSON.parse(fs.readFileSync(new URL('../fixtures/phase-0.5/canonical-save-v1.json', import.meta.url), 'utf8'));

function clothingEnvelope({ stateDelta, evidence, story }) {
  return {
    state_delta: stateDelta,
    outcome: 'success',
    evidence,
    turn_summary: '',
    mind_monitor: {},
    choices: ['계속한다', '질문한다', '반응을 본다', '기다린다'],
    dialogue_lines: [],
    npcs_present: ['npc-hayeon'],
    action_target_id: 'npc-hayeon',
    focal_character_id: 'npc-hayeon',
    last_speaker_id: null,
    image_character_id: 'npc-hayeon',
    player_inner_thought: '',
    player_status: '',
    elapsed_minutes: 1,
    warnings: [],
    story
  };
}

function applyClothing(save, envelope, story) {
  return applyGuardedStateDelta(save, envelope, {
    storyText: story,
    parsedStory: { choices: envelope.choices, dialogue_lines: [] },
    npcIds: new Set(['npc-hayeon']),
    master: { characters: [{ character_id: 'npc-hayeon', name: '김하연' }] },
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
  // 실제 모델 출력 형태 (52~54턴) — bra/top/panties/셔츠/속옷 등 자유형 키가
  // canonical 4슬롯으로 정규화되고, 한국어 값이 enum으로 매핑된다.
  const story = '김제나는 흰 셔츠를 벗어 의자에 걸었다. 김제나는 브라를 벗었다.';
  const result = retainEvidencedClothing({
    previousClothing: {},
    proposedClothing: { top: 'removed', bra: 'removed' },
    evidenceMap: {
      uniform_top: '김제나는 흰 셔츠를 벗어 의자에 걸었다.',
      underwear_top: '김제나는 브라를 벗었다.'
    },
    narrativeText: story, characterName: '김제나'
  });
  assert.deepEqual(result.clothing, { uniform_top: 'removed', underwear_top: 'removed' });
  assert.deepEqual(result.rejections, []);
});

test('clothing rejects free-form keys, ambiguous keys, and garment-name-only values', () => {
  const story = '김제나가 셔츠를 정리했다.';
  // 1) 영어 자유형 키(셔츠/속옷 등)는 canonical 슬롯으로 매핑 불가 시 거부
  const noMap = retainEvidencedClothing({
    proposedClothing: { 상의: 'worn' },
    evidenceMap: { 상의: story }, narrativeText: story, characterName: '김제나'
  });
  assert.deepEqual(noMap.clothing, { uniform_top: 'worn' }, '상의 alias는 uniform_top으로 정규화');
  // 2) 위·아래 불명확한 키(속옷)는 임의 복제 없이 warning으로 버림
  const ambiguous = retainEvidencedClothing({
    proposedClothing: { 속옷: 'worn' },
    evidenceMap: { 속옷: story }, narrativeText: story, characterName: '김제나'
  });
  assert.deepEqual(ambiguous.clothing, {}, '속옷은 어느 슬롯인지 불명확 — 복제 금지');
  assert.ok(ambiguous.rejections.some(r => r.startsWith('invalid_clothing_key')));
  // 3) 복장 이름만 값으로 온 경우 worn 추측 금지
  const garmentName = retainEvidencedClothing({
    proposedClothing: { uniform_top: '흰 셔츠' },
    evidenceMap: { uniform_top: story }, narrativeText: story, characterName: '김제나'
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
          uniform_top: { quote: npcQuote, character_id: 'npc-hayeon' },
          underwear_top: { quote: npcQuote, character_id: 'npc-hayeon' }
        },
        player: {
          uniform_bottom: { quote: playerQuote, character_id: 'player' }
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

test('Commit accepts the recent flat Extract clothing evidence only when actor ownership matches', () => {
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
        uniform_top: { quote, character_id: 'npc-hayeon' }
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
  // posture는 Extract 제안을 반영(경고만 기록), location은 증거 필요 시 이전 유지
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
  assert.doesNotMatch(render, /raw\.replaceAll\('_', ' '\)/);
  const css = fs.readFileSync(new URL('../src/frontend/pages/hospital-panels.css', import.meta.url), 'utf8');
  assert.match(css, /-webkit-line-clamp: unset/);
});

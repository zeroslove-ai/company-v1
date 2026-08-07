import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPosturePatch } from '../src/engine/state/posture.js';
import { retainEvidencedClothing } from '../src/engine/state/clothing.js';
import { buildSceneStatePatch } from '../src/engine/state/physical-state.js';
import { physicalRelationDisplay, stateDisplayValues } from '../src/frontend/pages/render.js';

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

test('clothing accepts arbitrary Korean garment keys and state text with exact evidence', () => {
  const story = '윤민아는 네이비 재킷 단추를 풀어 의자 등받이에 걸쳐 두었다.';
  const result = retainEvidencedClothing({
    proposedClothing: { '네이비 재킷': '단추를 풀어 의자 등받이에 걸쳐 둠' },
    evidenceMap: { '네이비 재킷': story }, narrativeText: story, characterName: '윤민아'
  });
  assert.deepEqual(result.clothing, { '네이비 재킷': '단추를 풀어 의자 등받이에 걸쳐 둠' });
  assert.deepEqual(result.rejections, []);
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

test('frontend source keeps legacy labels only as compatibility and shows full summaries', () => {
  const render = fs.readFileSync(new URL('../src/frontend/pages/render.js', import.meta.url), 'utf8');
  assert.match(render, /LEGACY_CLOTHING_LABELS/);
  assert.doesNotMatch(render, /raw\.replaceAll\('_', ' '\)/);
  const css = fs.readFileSync(new URL('../src/frontend/pages/hospital-panels.css', import.meta.url), 'utf8');
  assert.match(css, /-webkit-line-clamp: unset/);
});

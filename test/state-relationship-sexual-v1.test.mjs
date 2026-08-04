import test from 'node:test';
import assert from 'node:assert/strict';
import { retainEvidencedClothing, isMagicalPhysicalTransitionEvidence, isPlanningOnlyEvidence } from '../src/engine/state/clothing.js';
import { buildPosturePatch } from '../src/engine/state/posture.js';
import { buildSceneStatePatch } from '../src/engine/state/physical-state.js';
import { applyNpcStatChanges } from '../src/engine/relationship/reducer.js';
import { hasAffinityOnlyEvidence, hasIndependentAffinityEvent } from '../src/engine/relationship/guards.js';
import { appendSexualEvents, reduceEjaculationCounts, sexualEventId } from '../src/engine/sexual-state/ledger.js';
import { resolveIntimacyStageAdvancement, validateIntimacyStagePatch } from '../src/engine/sexual-state/validator.js';

// ---------- Clothing continuity ----------

test('clothing: an already-removed slot proposed as removed again is a no-op, not a re-evidenced change', () => {
  const { clothing, rejections } = retainEvidencedClothing({
    previousClothing: { uniform_top: 'removed' },
    proposedClothing: { uniform_top: 'removed' },
    evidenceMap: {}, narrativeText: '', characterName: '한소영'
  });
  assert.deepEqual(clothing, {});
  assert.deepEqual(rejections, []);
});

test('clothing: a real change is accepted only when its own narrative-quote evidence actually appears in the Story text and names the character', () => {
  const narrativeText = '한소영은 천천히 유니폼 상의를 벗었다.';
  const { clothing, rejections } = retainEvidencedClothing({
    previousClothing: { uniform_top: 'worn' },
    proposedClothing: { uniform_top: 'removed' },
    evidenceMap: { uniform_top: '한소영은 천천히 유니폼 상의를 벗었다.' },
    narrativeText, characterName: '한소영'
  });
  assert.deepEqual(clothing, { uniform_top: 'removed' });
  assert.deepEqual(rejections, []);
});

test('clothing: a change with no evidence, or evidence not actually present in the final Story text, is rejected and the previous value is kept by the caller', () => {
  const { clothing, rejections } = retainEvidencedClothing({
    previousClothing: { uniform_top: 'worn' },
    proposedClothing: { uniform_top: 'removed' },
    evidenceMap: { uniform_top: '이 문장은 실제 Story 본문에 없다' },
    narrativeText: '한소영은 평범하게 대화했다.', characterName: '한소영'
  });
  assert.deepEqual(clothing, {});
  assert.deepEqual(rejections, ['unevidenced_clothing_change:uniform_top']);
});

test('clothing: a change attributed to the rule/system/app itself (a magical transition) is always rejected, even with matching text', () => {
  const narrativeText = '규칙이 적용되자 속옷이 저절로 사라졌다.';
  const { clothing, rejections } = retainEvidencedClothing({
    previousClothing: { underwear_top: 'worn' },
    proposedClothing: { underwear_top: 'removed' },
    evidenceMap: { underwear_top: '규칙이 적용되자 속옷이 저절로 사라졌다.' },
    narrativeText, characterName: '한소영'
  });
  assert.deepEqual(clothing, {});
  assert.deepEqual(rejections, ['unevidenced_clothing_change:underwear_top']);
  assert.equal(isMagicalPhysicalTransitionEvidence('규칙이 적용되자 속옷이 저절로 사라졌다.'), true);
});

test('clothing: evidence describing only an intent/plan to act (not yet completed) is rejected', () => {
  assert.equal(isPlanningOnlyEvidence('그녀는 옷을 벗으려고 한다.'), true);
  const { clothing } = retainEvidencedClothing({
    previousClothing: { uniform_top: 'worn' },
    proposedClothing: { uniform_top: 'removed' },
    evidenceMap: { uniform_top: '그녀는 옷을 벗으려고 한다.' },
    narrativeText: '그녀는 옷을 벗으려고 한다.', characterName: '한소영'
  });
  assert.deepEqual(clothing, {});
});

test('clothing: CSA activate/update/deactivate alone (no narrative evidence at all) never changes a clothing slot', () => {
  const { clothing, rejections } = retainEvidencedClothing({
    previousClothing: { uniform_bottom: 'worn' },
    proposedClothing: { uniform_bottom: 'open' },
    evidenceMap: {}, narrativeText: '상식개변이 활성화되었다.', characterName: '한소영'
  });
  assert.deepEqual(clothing, {});
  assert.deepEqual(rejections, ['unevidenced_clothing_change:uniform_bottom']);
});

// ---------- Posture continuity ----------

test('posture: a persisted posture carries forward across a turn with no ending reason, never restarted from scratch', () => {
  const patch = buildPosturePatch({ previous: { posture: 'kneeling', position_label: '책상 앞', updated_turn: 3 }, proposal: null, turnNumber: 4 });
  assert.equal(patch.posture, 'kneeling');
  assert.equal(patch.position_label, '책상 앞');
});

test('posture: a proposed posture change without a real end_reason is rejected and the previous posture persists', () => {
  const patch = buildPosturePatch({ previous: { posture: 'kneeling', updated_turn: 3 }, proposal: { posture: 'standing', end_reason: null }, turnNumber: 4 });
  assert.equal(patch.posture, 'kneeling');
  assert.equal(patch.rejected, 'unevidenced_posture_change');
});

test('posture: a proposed change WITH a real end_reason (movement/task_ended/explicit_change/physical_interruption/player_request) is accepted', () => {
  const patch = buildPosturePatch({ previous: { posture: 'kneeling', updated_turn: 3 }, proposal: { posture: 'standing', end_reason: 'player_request' }, turnNumber: 4 });
  assert.equal(patch.posture, 'standing');
  assert.equal(patch.updated_turn, 4);
});

test('scene state: player and NPC physical state stay on separate patches (never merged into one object)', () => {
  const playerPatch = buildSceneStatePatch({ previous: { clothing: { uniform_top: 'worn' } }, proposal: {}, turnNumber: 1, characterName: '플레이어' });
  const npcPatch = buildSceneStatePatch({ previous: { clothing: { uniform_top: 'removed' } }, proposal: {}, turnNumber: 1, characterName: '한소영' });
  assert.equal(playerPatch.state.clothing.uniform_top, 'worn');
  assert.equal(npcPatch.state.clothing.uniform_top, 'removed');
});

test('scene state: deactivating a CSA (no physical proposal at all) leaves the previous clothing/posture completely untouched', () => {
  const previous = { location_label: '사무실', posture: 'sitting', clothing: { uniform_top: 'removed' }, updated_turn: 5 };
  const { state, warnings } = buildSceneStatePatch({ previous, proposal: null, narrativeText: 'CSA가 해제되었다.', characterName: '한소영', turnNumber: 6 });
  assert.equal(state.clothing.uniform_top, 'removed');
  assert.equal(state.posture, 'sitting');
  assert.equal(state.location_label, '사무실');
  assert.deepEqual(warnings, []);
});

// ---------- Relationship guards ----------

test('relationship: work cooperation and CSA compliance alone never raise affinity, even with a large delta claim', () => {
  const { state, warnings } = applyNpcStatChanges({ affinity: 50 }, { affinity: 5 }, { reason: '상식개변을 성실히 수행했다' });
  assert.equal(state.affinity, 50, 'delta rejected, affinity unchanged');
  assert.ok(warnings.includes('csa_compliance_or_bodily_reaction_alone_not_affinity'));
});

test('relationship: physical arousal/blushing/moaning alone never raises affinity', () => {
  assert.equal(hasAffinityOnlyEvidence('그녀는 얼굴이 붉어지며 신음했다'), true);
  assert.equal(hasIndependentAffinityEvent('그녀는 얼굴이 붉어지며 신음했다'), false);
  const { state, warnings } = applyNpcStatChanges({ affinity: 30 }, { affinity: 3 }, { reason: '그녀는 얼굴이 붉어지며 신음했다' });
  assert.equal(state.affinity, 30);
  assert.ok(warnings.length > 0);
});

test('relationship: a genuinely independent emotional event (e.g. respecting the player\'s wishes) is allowed to raise affinity', () => {
  const { state, warnings } = applyNpcStatChanges({ affinity: 30 }, { affinity: 4 }, { reason: '그는 플레이어의 의사를 존중해 대화를 멈췄다' });
  assert.equal(state.affinity, 34);
  assert.equal(warnings.length, 0);
});

test('relationship: an out-of-range per-turn delta is zeroed entirely, never truncated to the cap', () => {
  const { state, warnings } = applyNpcStatChanges({ affinity: 10 }, { affinity: 40 }, { reason: '그는 플레이어의 의사를 존중했다' });
  assert.equal(state.affinity, 10, 'a +40 proposal (cap is +5) is rejected outright, not silently capped to +5');
  assert.ok(warnings.includes('stat_delta_out_of_range:affinity'));
});

test('relationship: every stat re-clamps to [0,100] after applying its delta', () => {
  const { state } = applyNpcStatChanges({ sexual_arousal: 98 }, { sexual_arousal: 15 }, {});
  assert.equal(state.sexual_arousal, 100);
});

test('relationship: a player-declared/self-reported outcome is never a valid basis for an affinity change', () => {
  const { state, warnings } = applyNpcStatChanges({ affinity: 20 }, { affinity: 5 }, { reason: '플레이어가 좋아한다고 선언했다' });
  assert.equal(state.affinity, 20);
  assert.ok(warnings.includes('player_declared_result_not_a_basis'));
});

// ---------- Sexual event ledger ----------

test('sexual ledger: an accepted event is deduped by turn+actor+type+content-hash, not by a client-supplied action_id', () => {
  const candidate = { actor_id: 'heroine1', target_id: 'player', action_type: 'penetration', direction: 'npc_to_player', completed: true, evidence: '두 사람은 관계를 맺었다.' };
  const first = appendSexualEvents([], [candidate], { turnNumber: 10, actionId: 'action-a' });
  assert.equal(first.accepted.length, 1);
  // A retry/replay with the same turn/actor/type/evidence, even under a different action_id, is the same fact.
  const replay = appendSexualEvents(first.ledger, [candidate], { turnNumber: 10, actionId: 'action-b' });
  assert.equal(replay.accepted.length, 0, 'the duplicate fact must be silently deduped, not appended again');
  assert.equal(replay.ledger.length, 1);
});

test('sexual ledger: completed vs interrupted are both recorded, distinctly', () => {
  const { ledger } = appendSexualEvents([], [
    { actor_id: 'heroine1', target_id: 'player', action_type: 'oral', direction: 'npc_to_player', completed: true, evidence: '완료된 사건 1' },
    { actor_id: 'heroine1', target_id: 'player', action_type: 'oral', direction: 'npc_to_player', completed: false, interrupted: true, evidence: '중단된 사건 2' }
  ], { turnNumber: 11 });
  assert.equal(ledger.length, 2);
  assert.equal(ledger[0].completed, true);
  assert.equal(ledger[1].interrupted, true);
  assert.equal(ledger[1].completed, false);
});

test('sexual ledger: player-initiated vs NPC-initiated events are distinguished by actor_id/direction, and only a completed event attributed to the right actor increments their ejaculation count', () => {
  const { accepted } = appendSexualEvents([], [
    { actor_id: 'player', target_id: 'heroine1', action_type: 'penetration', direction: 'player_to_npc', completed: true, evidence: '플레이어가 주도한 사건' },
    { actor_id: 'heroine1', target_id: 'player', action_type: 'orgasm', direction: 'npc_to_player', completed: false, interrupted: true, evidence: '중단된 사건이라 카운트되지 않음' }
  ], { turnNumber: 12 });
  const counts = reduceEjaculationCounts({}, accepted);
  assert.equal(counts.player, 1);
  assert.equal(counts.heroine1, undefined, 'an interrupted event never increments the counter');
});

test('sexual ledger: the counter is monotonic — never resets or decreases across turns', () => {
  let counts = { heroine1: 3 };
  const events = [{ actor_id: 'heroine1', target_id: 'player', action_type: 'orgasm', direction: 'npc_to_player', completed: true, evidence: '네번째' }];
  counts = reduceEjaculationCounts(counts, events);
  assert.equal(counts.heroine1, 4);
});

test('sexual ledger: sexualEventId is stable for the same normalized evidence text regardless of surrounding whitespace/quote differences', () => {
  const a = sexualEventId(5, 'heroine1', 'kiss', '  "정말 좋아하는 키스"  ');
  const b = sexualEventId(5, 'heroine1', 'kiss', '정말 좋아하는 키스');
  assert.equal(a, b);
});

// ---------- Sexual event -> relationship-stage boundary ----------

test('intimacy stage: a csa_direct-routed completed event never advances relationship stage on its own', () => {
  const event = { completed: true, action_type: 'kiss' };
  const next = resolveIntimacyStageAdvancement({ event, route: 'csa_direct', currentStage: 'romantic_interest' });
  assert.equal(next, null);
});

test('intimacy stage: a genuinely voluntary completed event advances exactly one stage, never skipping', () => {
  const event = { completed: true, action_type: 'penetration' }; // would map to 'intercourse', rank 5
  const next = resolveIntimacyStageAdvancement({ event, route: 'voluntary', currentStage: 'none' });
  assert.equal(next, null, 'intercourse is rank 5 but current stage is rank 0 — skipping straight there is rejected');
  const validKiss = resolveIntimacyStageAdvancement({ event: { completed: true, action_type: 'kiss' }, route: 'voluntary', currentStage: 'romantic_interest' });
  assert.equal(validKiss, 'kissed');
});

test('intimacy stage: a proposed stage patch not backed by any accepted voluntary event this turn is rejected', () => {
  const result = validateIntimacyStagePatch({ proposedStage: 'sexual_touch', currentStage: 'kissed', acceptedEventsWithRoutes: [] });
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'kissed');
});

test('intimacy stage: repeated sexual contact alone (multiple completed events, same turn) does not fast-track past the one-rank-per-turn rule', () => {
  const acceptedEventsWithRoutes = [
    { event: { completed: true, action_type: 'kiss' }, route: 'voluntary' },
    { event: { completed: true, action_type: 'penetration' }, route: 'voluntary' } // both proposed same turn, but intercourse still requires the intermediate ranks first
  ];
  const result = validateIntimacyStagePatch({ proposedStage: 'intercourse', currentStage: 'romantic_interest', acceptedEventsWithRoutes });
  assert.equal(result.ok, false, 'intercourse is not the immediate next rank after romantic_interest, even with a voluntary penetration event present');
});

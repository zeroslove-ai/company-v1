import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTestGameId,
  choiceContract,
  classifyParserResult,
  errorDetails,
  openingFailureClassification,
  openingFollowUpAllowed,
  writeVerifiedArtifact,
  projectionSnapshot,
  TEST_GAME_ID,
  PRODUCTION_GAME_ID
} from '../scripts/live-playtest-canary.mjs';
import { buildStoryWorldProjection } from '../src/engine/csa/story-projection.js';

const master = {
  characters: [{ character_id: 'heroine1', name: '윤민아', gender: 'female' }],
  general_npcs: []
};

const validStory = `[SCENE]\n사무실이 조용하다.\n[DIALOGUE speaker_id="heroine1"]\n안녕하세요.\n[THOUGHT]\n오늘은 차분히 시작하자.\n[CHOICE]\n업무를 확인한다.\n[CHOICE]\n동료에게 인사한다.\n[CHOICE]\n자료를 정리한다.\n[CHOICE]\n잠시 주변을 살핀다.`;

test('live canary production guard rejects production and accepts designated test game', () => {
  assert.throws(() => assertTestGameId(PRODUCTION_GAME_ID), /PRODUCTION_GAME_GUARD/);
  assert.equal(assertTestGameId(TEST_GAME_ID), true);
});

test('live canary captures exact structured error body fields', () => {
  assert.deepEqual(errorDetails({ error: { code: 'INVALID_EXTRACT_OBSERVATION', message: 'scene required', retryable: false, issues: [{ path: 'scene' }] } }, 422), {
    status: 422, code: 'INVALID_EXTRACT_OBSERVATION', message: 'scene required', retryable: false, issues: [{ path: 'scene' }]
  });
});

test('opening failure is a hard stop classification', () => {
  assert.equal(openingFailureClassification({ http_status: 200, terminal_event: 'error', sse_error_code: 'story_protocol_invalid' }, { status: 'failure' }), 'STORY_PROTOCOL_INVALID');
  assert.equal(openingFailureClassification({ http_status: 200, terminal_event: 'error', sse_error_code: 'provider_upstream_error' }, { status: 'unavailable' }), 'PROVIDER_UPSTREAM_ERROR');
  assert.equal(openingFailureClassification({ http_status: 200, terminal_event: 'complete' }, { status: 'failure' }), 'STORY_PROTOCOL_INVALID');
});

test('opening hard stop schedules no gameplay follow-up calls', () => {
  const calls = [];
  const failedOpening = { http_status: 200, terminal_event: 'error', sse_error_code: 'provider_upstream_error' };
  if (openingFollowUpAllowed(failedOpening, { status: 'unavailable' })) calls.push('turn1', 'turn2', 'csa', 'retry');
  assert.deepEqual(calls, []);
});

test('opening artifact helper verifies persistence before any reset decision', async () => {
  const file = `${process.cwd()}\\.phase12h-opening-artifact-test.json`;
  const artifact = { terminal_event: 'error', follow_up_calls: { turn1: 0, turn2: 0, retry: 0 } };
  await writeVerifiedArtifact(file, artifact);
  const persisted = JSON.parse(await (await import('node:fs/promises')).readFile(file, 'utf8'));
  assert.deepEqual(persisted, artifact);
  await (await import('node:fs/promises')).unlink(file);
});

test('live canary classifies parser success and preserves block sequence/warnings', () => {
  const result = classifyParserResult(validStory, master);
  assert.equal(result.status, 'success');
  assert.deepEqual(result.block_sequence, ['scene', 'dialogue', 'player_inner_thought', 'choice', 'choice', 'choice', 'choice']);
  assert.deepEqual(result.warnings, []);
});

test('live canary accepts plain narrative without rewriting raw Story', () => {
  const raw = '서술 marker가 없는 본문';
  const result = classifyParserResult(raw, master);
  assert.equal(result.status, 'success');
  assert.deepEqual(result.block_sequence, ['narrative']);
  assert.equal(raw, '서술 marker가 없는 본문');
});

test('live canary records choice soft contract separately from parser hard status', () => {
  const parsed = classifyParserResult(validStory.replace(/\[CHOICE\][\s\S]*$/, '[CHOICE]하나만 남긴다.'), master).parsed;
  const result = choiceContract(parsed, { last_choices: [] });
  assert.equal(result.raw_count, 1);
  assert.equal(result.canonical_exact_four, false);
  assert.equal(result.invariant_ok, false);
});

test('live canary captures CSA projection snapshot without mutating save', () => {
  const save = {
    csa_active: ['csa_1'],
    csa_rules: { csa_1: { active: true, content: '회사 여성 직원은 브래지어 없이 근무한다.', strength: 'weak', preset: { template_id: 'no_bra_under_work_clothes', subject_scope: 'female_employee', mode: 'continuous' } } },
    npc_scene_state: { heroine1: { clothing: { underwear_top: 'worn' } } }
  };
  const masterWithRule = { characters: [{ character_id: 'heroine1', name: '윤민아', gender: 'female' }], general_npcs: [] };
  const projection = buildStoryWorldProjection({ save, master: masterWithRule, sceneActorIds: ['heroine1'], expectedTurn: 2 });
  const snapshot = projectionSnapshot(projection);
  assert.equal(snapshot.world_rules.length, 1);
  assert.equal(snapshot.scene_obligations.length, 1);
  assert.equal(save.npc_scene_state.heroine1.clothing.underwear_top, 'worn');
});

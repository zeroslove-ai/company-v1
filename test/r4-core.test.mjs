import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createR4Store } from '../runtime-r4/adapters/postgres-store.js';
import { executeTurnJob } from '../runtime-r4/application/turn-pipeline.js';
import { createCommand, hashCommand } from '../runtime-r4/domain/command.js';
import { buildTurnContext } from '../runtime-r4/domain/context.js';
import { loadCompanyContent, setupSceneForProfile } from '../runtime-r4/domain/content.js';
import { normalizeObservation } from '../runtime-r4/domain/observation.js';
import { validateCommittedDialogueRequest } from '../runtime-r4/domain/voice.js';
import { createScriptedProvider, providerAvailability } from '../runtime-r4/adapters/provider.js';
import { parseCommittedDialogue, primaryBatches } from '../frontend-r4/tts.js';

const content = loadCompanyContent();

async function tempDir(t) {
  const path = await mkdtemp(join(tmpdir(), 'company-r4-test-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

async function setupGame(store) {
  const gameId = await store.createGame(content);
  const profile = { name: 'R4 검증', age: 29, department: '브랜드전략팀', position: '대리' };
  await store.saveSetup(gameId, profile, setupSceneForProfile(content, profile));
  return gameId;
}

async function runCommand(store, provider, gameId, kind, literalAction = '') {
  const snapshot = await store.readSnapshot(gameId);
  const command = createCommand({ gameId, kind, literalAction, expectedStateRevision: snapshot.state.state_revision });
  const { job } = await store.beginCommand({ command });
  return executeTurnJob({ job, store, provider, content });
}

test('R4 projects one source heroine into Story context and keeps scene media for Observer only', async () => {
  const sourceCharacters = JSON.parse(await readFile(resolve('content/characters.json'), 'utf8')).characters;
  const sourceMedia = JSON.parse(await readFile(resolve('content/media_catalog.json'), 'utf8')).entries;
  const profile = { name: 'R4 검증', age: 29, department: '브랜드전략팀', position: '대리' };
  const scene = setupSceneForProfile(content, profile);
  const opening = buildTurnContext({
    command: createCommand({ gameId: 'source-preserve-test', kind: 'OPENING', expectedStateRevision: 0 }),
    state: { profile, time: { day: 1, minutes: 540 }, scene, active_rules: [], projection_meta: {} },
    recentTurns: [], memories: [], content, turnNumber: 1
  });
  assert.equal(content.edition.title, '상식개변: 회사편');
  assert.deepEqual(content.departments, ['브랜드전략팀', '감사실', '인사팀', '신사업TF', '재무기획팀', '홍보팀']);
  assert.deepEqual(content.positions.map(position => position.name), ['인턴', '대리', 'TF팀장', '임원']);
  assert.equal(scene.location_id, 'brand_strategy_office');
  assert.deepEqual(content.actors.find(actor => actor.actor_id === 'heroine1').source_record, sourceCharacters.heroine1);
  assert.deepEqual(content.media_catalog, sourceMedia);
  const openingHeroines = opening.context.registered_characters.filter(actor => actor.kind === 'heroine');
  assert.equal(openingHeroines.length, 1);
  assert.ok(['서원희', '윤민아', '김제나', '한리브', '이메이'].includes(openingHeroines[0].name));
  assert.equal(openingHeroines[0].dramatization.personality, sourceCharacters[openingHeroines[0].actor_id].prompt_card.personality);
  assert.ok(openingHeroines[0].dramatization.dramatization.dialogue_examples.length > 0);
  assert.equal('source_record' in openingHeroines[0], false);
  assert.equal('body' in openingHeroines[0], false);
  assert.equal('private_info' in openingHeroines[0], false);
  assert.match(opening.context.world_premise.private_discovery, /처음에는.*설치한 기억이/u);
  assert.match(opening.context.world_premise.npc_knowledge, /드러내기 전/u);
  assert.match(opening.context.world_premise.opening_effect, /세계가 바뀌지 않는다/u);
  assert.deepEqual(opening.context.character_directory.filter(actor => actor.kind === 'heroine').map(actor => actor.name), ['서원희', '윤민아', '김제나', '한리브', '이메이']);
  assert.equal('available_media' in opening.context, false);
  assert.ok(opening.observerContext.available_media.some(item => item.character_id === openingHeroines[0].actor_id && item.pool === 'sex'));
  assert.ok(opening.observerContext.available_media.every(item => item.character_id === openingHeroines[0].actor_id));
  assert.equal(opening.contextManifest.token_budget_overflow, false);
});

test('R4 does not select a scripted preview as the default live provider', () => {
  assert.equal(providerAvailability({}).mode, 'company-unconfigured');
  assert.equal(providerAvailability({ LLM_API_URL: 'https://model.invalid', LLM_API_KEY: 'test', STORY_MODEL: 's', EXTRACT_MODEL: 'e' }).mode, 'company-configured');
});

test('R4 voice UI resolves only committed heroine dialogue to its source voice mapping', () => {
  const lines = parseCommittedDialogue('서원희 (낮게 웃으며): “그건 아직 기억하고 있어요.”\n서원희가 잠시 창밖을 봤다.', [
    { actor_id: 'heroine1', name: '서원희', voice_available: true },
    { actor_id: 'general_park_jungwoo', name: '박정우', voice_available: false }
  ]);
  assert.deepEqual(lines, [{ speaker_id: 'heroine1', speaker_name: '서원희', direction: '낮게 웃으며', text: '그건 아직 기억하고 있어요.', evidence_quote: '서원희 (낮게 웃으며): “그건 아직 기억하고 있어요.”', order: 0 }]);
});

test('R4 voice dialogue is committed only when Observer verifies exact present-character lines', () => {
  const storyText = '서원희가 옆자리에 앉아 고개를 끄덕였다.\n서원희 (낮게 웃으며): “기억했어요.”\n[선택지]\n1. 대화를 잇는다.\n2. 잠시 기다린다.\n3. 다른 이야기를 꺼낸다.\n4. 자리를 옮긴다.';
  const observer = {
    scene: {
      present_actor_ids: ['heroine1'],
      presence_evidence: [{ actor_id: 'heroine1', quote: '서원희가 옆자리에 앉아 고개를 끄덕였다.' }]
    },
    dialogue_lines: [
      { speaker_id: 'heroine1', text: '기억했어요.', direction: '낮게 웃으며', evidence_quote: '서원희 (낮게 웃으며): “기억했어요.”', order: 0 },
      { speaker_id: 'heroine1', text: '아직 나오지 않은 말', direction: '', evidence_quote: '서원희: “아직 나오지 않은 말”', order: 1 }
    ]
  };
  const result = normalizeObservation(observer, {
    storyText,
    before: { state_revision: 0, committed_turn: 0, turn_revision: 0, profile: {}, time: { day: 1, minutes: 540 }, scene: { location_id: 'brand_strategy_office', present_actor_ids: [] }, active_rules: [], projection_meta: {} },
    content,
    turnNumber: 1
  });
  assert.deepEqual(result.dialogueLines, [{
    speaker_id: 'heroine1', speaker_name: '서원희', text: '기억했어요.', direction: '낮게 웃으며', evidence_quote: '서원희 (낮게 웃으며): “기억했어요.”', order: 0
  }]);
});

test('R4 voice requests retain exact observer evidence and direction across serialized playback', () => {
  const committedLine = { speaker_id: 'heroine1', text: '기억했어요.', direction: '낮게 웃으며', evidence_quote: '서원희 (낮게 웃으며): “기억했어요.”', order: 0 };
  const batches = primaryBatches({
    lines: [committedLine, { ...committedLine, text: '아직도요.', evidence_quote: '서원희 (낮게 웃으며): “아직도요.”', order: 1 }],
    presentActorIds: ['heroine1'],
    focalActorId: 'heroine1'
  });
  assert.equal(batches.length, 1);
  const request = { speaker_id: 'heroine1', text: '기억했어요. 아직도요.', direction: '낮게 웃으며', lines: batches[0].lines };
  assert.equal(validateCommittedDialogueRequest(request, { speakerId: 'heroine1', committedLines: [committedLine, { ...committedLine, text: '아직도요.', evidence_quote: '서원희 (낮게 웃으며): “아직도요.”', order: 1 }], presentActorIds: ['heroine1'] }).valid, true);
  assert.equal(validateCommittedDialogueRequest({ ...request, lines: [{ ...request.lines[0], evidence_quote: '임의의 대사' }] }, { speakerId: 'heroine1', committedLines: [committedLine], presentActorIds: ['heroine1'] }).valid, false);
  assert.equal(validateCommittedDialogueRequest(request, { speakerId: 'heroine1', committedLines: [committedLine], presentActorIds: [] }).valid, false);
});

test('R4 observation requires exact story evidence and never clears unverified fields', () => {
  const before = {
    state_revision: 3,
    committed_turn: 3,
    turn_revision: 1,
    profile: { name: 'R4 검증' },
    time: { day: 1, minutes: 600 },
    scene: { location_id: 'lobby', present_actor_ids: ['general_oh_sehoon'], scene_note: '기존 메모' },
    active_rules: [],
    projection_meta: { status: 'complete', last_verified_turn: { location: 2 }, unverified: [] }
  };
  const storyText = '오세훈이 지금은 로비에 있다고 말했다.\n[선택지]\n1. 이동한다.\n2. 묻는다.\n3. 기다린다.\n4. 돌아간다.';
  const observation = normalizeObservation({
    scene: {
      location_id: 'brand_strategy_office',
      location_evidence: '오세훈이 지금은 로비에 있다고 말했다.',
      present_actor_ids: [],
      empty_presence_evidence: '',
      scene_note_status: 'empty',
      scene_note_evidence: ''
    },
    elapsed_minutes: 120,
    elapsed_evidence: '두 시간이 흘렀다.'
  }, { storyText, before, content, turnNumber: 4 });
  assert.equal(observation.scene.location, null);
  assert.equal(observation.scene.presence, null);
  assert.equal(observation.scene.sceneNote, null);
  assert.equal(observation.elapsedMinutes, null);
  assert.ok(observation.warnings.includes('digest_missing'));
});

test('R4 context includes a whole raw fallback and excludes oversized raw records whole', () => {
  const state = {
    profile: { name: 'R4 검증', age: 29, department: '브랜드전략팀', position: '대리' },
    time: { day: 1, minutes: 540 },
    scene: { location_id: 'lobby', present_actor_ids: ['general_oh_sehoon'], scene_note: '' }
  };
  const command = createCommand({ gameId: 'context-test', kind: 'FREE_ACTION', expectedStateRevision: 0, literalAction: '오늘의 공지 확인' });
  const recentTurns = [1, 2].map(turn_number => ({ turn_number, turn_revision: 1, command_json: { literal_action: '최근 입력 ' + turn_number }, narrative_body: '최근 원문 전체 ' + turn_number }));
  const memories = [
    { turn_number: 3, source_revision: 1, turn_digest: null, actor_ids: [], memory_keywords: ['공지'], memory_important: false, score: 100, command_json: { literal_action: '보존할 원본 명령' }, narrative_body: '보존할 원문 전체 내용.' },
    { turn_number: 4, source_revision: 1, turn_digest: null, actor_ids: [], memory_keywords: [], memory_important: false, score: 1, command_json: { literal_action: '큰 원본 명령' }, narrative_body: '전체 원문.' .repeat(12000) }
  ];
  Object.assign(memories, { excluded_sources: [] });
  const built = buildTurnContext({ command, state, recentTurns, memories, content, turnNumber: 5 });
  assert.deepEqual(built.context.relevant_past_memories.map(item => item.source_turn), [3]);
  assert.equal(built.context.relevant_past_memories[0].raw_record.literal_action, '보존할 원본 명령');
  assert.equal(built.context.relevant_past_memories[0].raw_record.narrative_body, '보존할 원문 전체 내용.');
  assert.ok(built.contextManifest.excluded_candidate_sources.some(item => item.turn_number === 4 && item.reason === 'context_budget_whole_record_excluded'));
  assert.equal(built.contextManifest.token_budget_overflow, false);
});

test('PGlite persists Setup and fences retry attempts while retaining the original Command', async t => {
  const root = await tempDir(t);
  const dbPath = join(root, 'db');
  let store = await createR4Store({ dbPath });
  const gameId = await setupGame(store);
  const command = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: 0, literalAction: '원본 입력: 점심 공지를 확인한다.' });
  const first = await store.beginCommand({ command });
  assert.equal(first.duplicate, false);
  const replay = await store.beginCommand({ command });
  assert.equal(replay.duplicate, true);
  assert.equal(replay.job.commandHash, hashCommand(command));
  const conflict = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: 0, literalAction: '바뀐 입력', commandId: command.command_id });
  await assert.rejects(store.beginCommand({ command: conflict }), error => error.code === 'command_id_payload_conflict');
  const stale = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: 1, literalAction: '낡은 revision' });
  await assert.rejects(store.beginCommand({ command: stale }), error => error.code === 'state_revision_conflict');

  await store.updateJob(first.job.jobId, first.job.attemptNo, { stage: 'observer', storyCheckpoint: '완결된 Story checkpoint' });
  await store.failJob(first.job.jobId, first.job.attemptNo, 'observer_failed', 'test_failure');
  const retry = await store.retryJob(first.job.jobId, gameId);
  assert.equal(retry.job.attemptNo, 2);
  assert.equal(retry.job.stage, 'observer');
  assert.deepEqual(retry.job.command, command);
  assert.equal(retry.job.commandHash, first.job.commandHash);
  await store.close();

  store = await createR4Store({ dbPath });
  t.after(() => store.close());
  const recovered = await store.getJob(first.job.jobId, gameId);
  assert.equal(recovered.status, 'failed');
  assert.equal(recovered.error.code, 'process_interrupted');
  assert.equal(recovered.storyCheckpoint, '완결된 Story checkpoint');
  assert.deepEqual(recovered.command, command);
  const recoveredRetry = await store.retryJob(first.job.jobId, gameId);
  assert.equal(recoveredRetry.job.attemptNo, 3);
  assert.equal(recoveredRetry.job.stage, 'observer');
  assert.deepEqual(recoveredRetry.job.command, command);
  const restored = await store.readSnapshot(gameId);
  assert.equal(restored.profile.name, 'R4 검증');
  assert.equal(restored.state.committed_turn, 0);
});

test('PGlite Story pipeline keeps feedback on the original gameplay turn and replays idempotently', async t => {
  const root = await tempDir(t);
  const store = await createR4Store({ dbPath: join(root, 'db') });
  t.after(() => store.close());
  const provider = createScriptedProvider();
  const gameId = await setupGame(store);
  await runCommand(store, provider, gameId, 'OPENING');
  const firstAction = await runCommand(store, provider, gameId, 'FREE_ACTION', '오세훈에게 점심 메뉴를 묻는다.');
  assert.equal(firstAction.receipt.committed_turn, 2);
  assert.equal(firstAction.turn.projection_status, 'complete');
  const sourceCommand = firstAction.turn.command;
  const snapshot = await store.readSnapshot(gameId);
  const feedbackText = '원본 질문은 유지하면서 답변이 실제 확인한 내용만 반영해 줘.';
  const feedback = await store.beginFeedback({ gameId, requestId: 'feedback-r4-test', feedbackText, expectedStateRevision: snapshot.state.state_revision });
  const revised = await executeTurnJob({ job: feedback.job, store, provider, content });
  assert.equal(revised.receipt.committed_turn, 2);
  assert.equal(revised.receipt.turn_revision, 2);
  assert.deepEqual(revised.turn.command, sourceCommand);
  assert.equal(revised.turn.feedback_text, feedbackText);
  const duplicate = await store.beginFeedback({ gameId, requestId: 'feedback-r4-test', feedbackText, expectedStateRevision: snapshot.state.state_revision });
  assert.equal(duplicate.duplicate, true);
  const afterReplay = await store.readSnapshot(gameId);
  assert.equal(afterReplay.state.committed_turn, 2);
  assert.equal(afterReplay.state.turn_revision, 2);
  assert.equal(afterReplay.state.state_revision, revised.receipt.state_revision);
  const history = await store.readHistory(gameId, 2147483647, 100);
  assert.equal(history.length, 2);
  assert.deepEqual(history[1].command, sourceCommand);
});

test('PGlite scripted 40-turn structural campaign retrieves an important old digest beyond six recent turns', async t => {
  const root = await tempDir(t);
  const store = await createR4Store({ dbPath: join(root, 'db') });
  t.after(() => store.close());
  const provider = createScriptedProvider();
  const gameId = await setupGame(store);
  await runCommand(store, provider, gameId, 'OPENING');
  for (let index = 1; index <= 39; index += 1) {
    const literal = index === 1
      ? '박정우 팀장과 1분기 제안 발표 약속을 정리한다.'
      : `${index}번째 일상 대화를 회사 라운지에서 이어간다.`;
    await runCommand(store, provider, gameId, 'FREE_ACTION', literal);
  }
  const after40 = await store.readSnapshot(gameId);
  assert.equal(after40.state.committed_turn, 40);
  const recall = await runCommand(store, provider, gameId, 'FREE_ACTION', '점심 메뉴를 가볍게 살펴본다.');
  const recentNumbers = recall.turn.context_manifest.raw_turn_sources.map(item => item.turn_number);
  assert.deepEqual(recentNumbers, [35, 36, 37, 38, 39, 40]);
  assert.ok(recall.turn.context_manifest.retrieved_digest_sources.some(item => item.turn_number === 2));
  assert.equal(provider.mode, 'scripted-preview');
});

test('PGlite latest snapshot, whole-turn raw fallback, and history pages cover 1,005 synthetic turns', async t => {
  const root = await tempDir(t);
  const dbPath = join(root, 'db');
  const db = await PGlite.create(dbPath);
  const schema = await readFile(new URL('../supabase/r4/001_company_r4.sql', import.meta.url), 'utf8');
  await db.exec(schema);
  const gameId = 'synthetic-1005';
  const state = { state_revision: 1005, committed_turn: 1005, turn_revision: 1, profile: { name: 'Synthetic' }, time: { day: 1, minutes: 540 }, scene: { location_id: 'lobby', present_actor_ids: [] }, active_rules: [], projection_meta: { status: 'complete', last_verified_turn: {}, unverified: [] } };
  await db.query('INSERT INTO company_r4_games(game_id,status,profile,state,content_version) VALUES($1,\'ready\',$2::jsonb,$3::jsonb,\'test\')', [gameId, JSON.stringify(state.profile), JSON.stringify(state)]);
  await db.query(`
    INSERT INTO company_r4_turns(game_id,turn_number,turn_revision,turn_record,command_json,state_before,state_after,story_text,narrative_body,search_text)
    SELECT $1::text,n,1,jsonb_build_object('turn_number',n),
      jsonb_build_object('game_id',$1::text,'command_id','synthetic-'||n::text,'literal_action','turn '||n::text),
      '{}'::jsonb,'{}'::jsonb,'story '||n::text,'narrative '||n::text,'narrative '||n::text
    FROM generate_series(1,1005) n
  `, [gameId]);
  await db.query(
    'INSERT INTO company_r4_memory_index(game_id,turn_number,source_revision,turn_digest,actor_ids,memory_keywords,memory_important,search_text) ' +
    'VALUES($1,1,1,NULL,ARRAY[\'general_oh_sehoon\'],ARRAY[\'약속\'],true,\'원문 검색 약속\')',
    [gameId]
  );
  await db.close();

  const store = await createR4Store({ dbPath });
  t.after(() => store.close());
  const snapshot = await store.readSnapshot(gameId);
  assert.equal(snapshot.latest_turn.turn_number, 1005);
  assert.equal(snapshot.state.committed_turn, 1005);
  const allTurns = [];
  let cursor = 2147483647;
  while (true) {
    const page = await store.readHistory(gameId, cursor, 100);
    if (!page.length) break;
    allTurns.unshift(...page.map(item => item.turn_number));
    cursor = page[0].turn_number;
  }
  assert.equal(allTurns.length, 1005);
  assert.deepEqual(allTurns, Array.from({ length: 1005 }, (_, index) => index + 1));
  const memories = await store.searchMemories({ gameId, beforeTurn: 1006, recentTurnNumbers: [1000, 1001, 1002, 1003, 1004, 1005], literalAction: '약속', actorIds: ['general_oh_sehoon'] });
  assert.equal(memories[0].turn_number, 1);
  assert.equal(memories[0].narrative_body, 'narrative 1');
  assert.equal(memories[0].command_json.literal_action, 'turn 1');
  const command = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: 1005, literalAction: '약속 내용을 다시 살펴본다.' });
  const built = buildTurnContext({ command, state, recentTurns: [], memories, content, turnNumber: 1006 });
  assert.deepEqual(built.context.relevant_past_memories[0].raw_record, { literal_action: 'turn 1', narrative_body: 'narrative 1' });
  assert.deepEqual(built.contextManifest.retrieved_raw_sources, [{ turn_number: 1, turn_revision: 1 }]);
});

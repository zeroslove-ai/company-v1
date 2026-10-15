import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createR4Store } from '../runtime-r4/adapters/postgres-store.js';
import { executeTurnJob, normalizeStoryOutput } from '../runtime-r4/application/turn-pipeline.js';
import { createCommand, hashCommand, parseStoryChoices } from '../runtime-r4/domain/command.js';
import { buildTurnContext } from '../runtime-r4/domain/context.js';
import { loadCompanyContent, setupSceneForProfile } from '../runtime-r4/domain/content.js';
import { normalizeObservation } from '../runtime-r4/domain/observation.js';
import { reduceTurn } from '../runtime-r4/domain/reducer.js';
import { validateCommittedDialogueRequest } from '../runtime-r4/domain/voice.js';
import { buildOfficialRuleAnnouncement, createCanonicalRuleResolver, publicCanonicalRuleCatalog } from '../runtime-r4/domain/rule-catalog.js';
import { createConfiguredProvider, createScriptedProvider, providerAvailability } from '../runtime-r4/adapters/provider.js';
import { committedDialogueForVoice, createCompanyTts, parseCommittedDialogue, primaryBatches } from '../frontend-r4/tts.js';
import { observerSystemPrompt, storySystemPrompt } from '../runtime-r4/prompts/story.js';

const content = loadCompanyContent();

test('R4 normalizes a provider escaped narrative block before observation and commit', () => {
  const raw = '장면이 이어진다.\\n\\n[선택지]\\n1. \\"이유를 묻는다.\\"\\n2. 기다린다.\\n3. 사과한다.\\n4. 자리를 비운다.';
  const normalized = normalizeStoryOutput(raw);
  assert.equal(normalized.includes('\\n'), false);
  assert.ok(normalized.includes('\n[선택지]\n'));
  assert.deepEqual(parseStoryChoices(normalized), [
    '\"이유를 묻는다.\"', '기다린다.', '사과한다.', '자리를 비운다.'
  ]);
  assert.equal(normalizeStoryOutput('문자열 안의 \\n 표기만 있는 서술'), '문자열 안의 \\n 표기만 있는 서술');
});

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
  assert.deepEqual(opening.context.scene.present_actor_ids, [openingHeroines[0].actor_id]);
  assert.deepEqual(opening.context.opening_focus, { actor_id: openingHeroines[0].actor_id, name: openingHeroines[0].name });
  assert.ok(['서원희', '윤민아', '김제나', '한리브', '이메이'].includes(openingHeroines[0].name));
  assert.equal(openingHeroines[0].dramatization.personality, sourceCharacters[openingHeroines[0].actor_id].prompt_card.personality);
  assert.ok(openingHeroines[0].dramatization.dramatization.dialogue_examples.length > 0);
  assert.equal('source_record' in openingHeroines[0], false);
  assert.equal('body' in openingHeroines[0], false);
  assert.equal('private_info' in openingHeroines[0], false);
  assert.match(opening.context.world_premise.private_discovery, /처음에는.*설치한 기억이/u);
  assert.match(opening.context.world_premise.npc_knowledge, /드러내기 전/u);
  assert.match(opening.context.world_premise.opening_effect, /세계가 바뀌지 않는다/u);
  assert.ok(opening.context.story_constraints.some(rule => /공유된 과거 대화|지난번|전에 들었다/u.test(rule)));
  assert.ok(opening.context.story_constraints.some(rule => /모든 턴에서 과거 사실은/u.test(rule)));
  assert.equal(opening.contextManifest.prompt_version, 'r4-company-rule-context-15');
  assert.match(storySystemPrompt(), /Continuity wording in a dramatization card.*not proof that it happened/u);
  assert.match(storySystemPrompt(), /Do not state unsupported heroine biography as established fact.*childhood habits/u);
  assert.match(storySystemPrompt(), /including the four choice lines/u);
  assert.match(storySystemPrompt(), /explicitly asks the player to recall.*matching recorded detail exists.*accurately/u);
  assert.match(storySystemPrompt(), /Execute speech or actions the current literal explicitly requests.*completed Story.*Do not stop at.*about to.*future option/u);
  assert.match(observerSystemPrompt(), /Past-event memories may be referenced only when that exact past fact appears/u);
  assert.match(observerSystemPrompt(), /Do not infer a character’s earlier biography or the duration of a habit/u);
  assert.match(observerSystemPrompt(), /elapsed_minutes describes only time passing.*completed Story.*retain the last verified clock.*Never reuse.*prior Story/u);
  assert.deepEqual(opening.context.character_directory.filter(actor => actor.kind === 'heroine').map(actor => actor.name), ['서원희', '윤민아', '김제나', '한리브', '이메이']);
  assert.equal('available_media' in opening.context, false);
  assert.ok(opening.observerContext.available_media.some(item => item.character_id === openingHeroines[0].actor_id && item.pool === 'general'));
  assert.ok(opening.observerContext.available_media.every(item => item.character_id === openingHeroines[0].actor_id && item.pool === 'general'));
  assert.equal(opening.contextManifest.token_budget_overflow, false);
});

test('R4 does not select a scripted preview as the default live provider', () => {
  assert.equal(providerAvailability({}).mode, 'company-unconfigured');
  assert.equal(providerAvailability({ LLM_API_URL: 'https://model.invalid', LLM_API_KEY: 'test', STORY_MODEL: 's', EXTRACT_MODEL: 'e' }).mode, 'company-configured');
});

test('R4 Story request disables hidden reasoning so its output limit is reserved for narrative', async () => {
  let requestPayload;
  const frames = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: '윤민아가 컵을 내려놓는다.' }, finish_reason: null }] })}`,
    `data: ${JSON.stringify({ choices: [{ delta: { content: '' }, finish_reason: 'stop' }] })}`,
    'data: [DONE]'
  ].join('\n\n') + '\n\n';
  const provider = createConfiguredProvider({
    env: { LLM_API_URL: 'https://model.invalid', LLM_API_KEY: 'test-only', STORY_MODEL: 'deepseek-flash', EXTRACT_MODEL: 'deepseek-flash' },
    fetchImpl: async (_url, options) => {
      requestPayload = JSON.parse(options.body);
      return new Response(frames, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    }
  });
  const story = await provider.story({ context: {}, command: { game_id: 'provider-test', command_id: 'provider-test-command', kind: 'FREE_ACTION', literal_action: '대화를 이어 간다.' } });
  assert.equal(story, '윤민아가 컵을 내려놓는다.');
  assert.deepEqual(requestPayload.thinking, { type: 'disabled' });
  assert.equal(requestPayload.max_tokens, 3500);
});

test('R4 resolves original adult CSA catalog selectors, group scopes, names, and finite conflicts', () => {
  const resolver = createCanonicalRuleResolver(content);
  const state = {
    profile: { name: '플레이어', age: 30 },
    active_rules: [],
    scene: { present_actor_ids: ['heroine1'] }
  };
  const clothingRule = resolver('no_bra_under_work_clothes', { subject_scope: 'female_employee' }, { state });
  assert.equal(clothingRule.rule_text, content.csa_catalog.items.find(item => item.id === 'no_bra_under_work_clothes').rule_text);
  assert.ok(content.actors.filter(actor => actor.kind === 'heroine').every(actor => clothingRule.subject_actor_ids.includes(actor.actor_id)));
  assert.equal(clothingRule.subject_scope, 'female_employee');
  assert.throws(() => resolver('no_bra_under_work_clothes', { subject_scope: 'company_employee' }, { state }), /scope_invalid/u);
  assert.throws(() => resolver('lap_facing_conversation', {
    subject_scope: 'female_employee', subject_actor_id: 'general_park_jungwoo',
    counterparty_scope: 'male_employee', counterparty_actor_id: 'heroine1'
  }, { state }), /out_of_scope/u);

  const activeState = { ...state, active_rules: [{ ...clothingRule, rule_id: 'existing-clothing-rule', version: 1 }] };
  assert.throws(() => resolver('work_in_underwear_only', { subject_scope: 'female_employee' }, { state: activeState }), /rule_conflict/u);

  const pair = resolver('recurring_light_kiss_conversation', {
    subject_scope: 'female_employee', subject_actor_id: 'heroine3',
    counterparty_scope: 'company_employee', counterparty_actor_id: 'heroine2'
  }, { state });
  assert.deepEqual(pair.subject_actor_ids, ['heroine3']);
  assert.deepEqual(pair.counterparty_actor_ids, ['heroine2']);
  const announcement = buildOfficialRuleAnnouncement({ operation: 'APPLY', effective_turn: 1, next_rule: {
    ...pair, rule_id: 'story-rule', version: 1, selectors: {
      subject_scope: 'female_employee', subject_actor_id: 'heroine3',
      counterparty_scope: 'company_employee', counterparty_actor_id: 'heroine2'
    }
  } }, content, state);
  assert.match(announcement, /사내 메신저/u);
  assert.match(announcement, /김제나/u);
  assert.match(announcement, /윤민아/u);
  assert.doesNotMatch(announcement, /상식개변/u);
  assert.equal(publicCanonicalRuleCatalog(content.csa_catalog).items.length, 21);
});

test('R4 voice UI resolves only committed heroine dialogue to its source voice mapping', () => {
  const lines = parseCommittedDialogue('서원희 (낮게 웃으며): “그건 아직 기억하고 있어요.”\n서원희가 잠시 창밖을 봤다.', [
    { actor_id: 'heroine1', name: '서원희', voice_available: true },
    { actor_id: 'general_park_jungwoo', name: '박정우', voice_available: false }
  ]);
  assert.deepEqual(lines, [{ speaker_id: 'heroine1', speaker_name: '서원희', direction: '낮게 웃으며', text: '그건 아직 기억하고 있어요.', evidence_quote: '서원희 (낮게 웃으며): “그건 아직 기억하고 있어요.”', order: 0 }]);
});

test('R4 voice UI accepts server-verified Korean narrative quotes and requires committed presence', () => {
  const actors = [{ actor_id: 'heroine1', name: '서원희', voice_available: true }];
  const line = { speaker_id: 'heroine1', speaker_name: '서원희', text: '목요일 오후에 다시 설명할게요.', direction: '', evidence_quote: '"목요일 오후에 다시 설명할게요." 그녀가 화이트보드에서 돌아섰다.', order: 0 };
  const turn = { story_text: '서원희가 화이트보드에서 돌아섰다. "목요일 오후에 다시 설명할게요." 그녀가 화이트보드에서 돌아섰다.', observer_applied: { dialogueLines: [line] } };
  assert.deepEqual(committedDialogueForVoice(turn, actors, ['heroine1']), [line]);
  assert.deepEqual(committedDialogueForVoice(turn, actors, []), []);
  assert.deepEqual(committedDialogueForVoice({ ...turn, story_text: '다른 이야기' }, actors, ['heroine1']), []);
});

test('R4 voice dialogue is committed only when Observer verifies exact present-character lines', () => {
  const storyText = '서원희가 옆자리에 앉아 고개를 끄덕였다.\n서원희는 낮게 웃었다. “기억했어요.”\n[선택지]\n1. 대화를 잇는다.\n2. 잠시 기다린다.\n3. 다른 이야기를 꺼낸다.\n4. 자리를 옮긴다.';
  const observer = {
    scene: {
      present_actor_ids: ['heroine1'],
      presence_evidence: [{ actor_id: 'heroine1', quote: '서원희가 옆자리에 앉아 고개를 끄덕였다.' }]
    },
    dialogue_lines: [
      { speaker_id: 'heroine1', text: '기억했어요.', direction: '', evidence_quote: '서원희가 옆자리에 앉아 고개를 끄덕였다.\n서원희는 낮게 웃었다. “기억했어요.”', order: 0 },
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
    speaker_id: 'heroine1', speaker_name: '서원희', text: '기억했어요.', direction: '', evidence_quote: '서원희가 옆자리에 앉아 고개를 끄덕였다.\n서원희는 낮게 웃었다. “기억했어요.”', order: 0
  }]);
});

test('R4 voice projection splits exact attributed dialogue around narration without losing a heroine scene', () => {
  const first = '어땠냐고요.';
  const second = '라떼보다 제 대답이 더 궁금하다는 거, 그거 들으면 보통 준비된 답부터 꺼내게 돼요.';
  const evidence = `"${first}" 목소리가 평소보다 반 박자 느리다. "${second}"`;
  const storyText = `윤민아는 컵을 두 손으로 감싼다. ${evidence}\n[선택지]\n1. 더 묻는다.\n2. 듣는다.\n3. 라떼 얘기로 돌아간다.\n4. 자리를 옮긴다.`;
  const result = normalizeObservation({
    scene: {
      present_actor_ids: ['heroine2'],
      presence_evidence: [{ actor_id: 'heroine2', quote: '윤민아는 컵을 두 손으로 감싼다.' }]
    },
    dialogue_lines: [{ speaker_id: 'heroine2', text: `${first} ${second} 임의로 더한 말`, evidence_quote: evidence }]
  }, {
    storyText,
    before: { state_revision: 0, committed_turn: 0, turn_revision: 0, profile: {}, time: { day: 1, minutes: 540 }, scene: { location_id: 'brand_strategy_office', present_actor_ids: [] }, active_rules: [], projection_meta: {} },
    content,
    turnNumber: 1
  });
  assert.deepEqual(result.dialogueLines.map(line => line.text), [first, second]);
  assert.deepEqual(result.dialogueLines.map(line => line.speaker_id), ['heroine2', 'heroine2']);
  assert.equal(result.warnings.includes('presence_unverified'), false);
});

test('R4 verifies a quoted heroine line from its nearest exact narrative attribution', () => {
  const storyText = '윤민아 대리는 창가 쪽 자기 자리에 앉아 노트북 화면을 넘기고 있었다.\n\n"대리님, 혹시 그 카페 신메뉴 드셔 보셨어요?" 컵 쪽으로 턱짓을 했다.\n[선택지]\n1. 메뉴 얘기를 잇는다.\n2. 창을 물어본다.\n3. 앱을 살펴본다.\n4. 잠시 기다린다.';
  const spoken = '대리님, 혹시 그 카페 신메뉴 드셔 보셨어요?';
  const observer = {
    scene: {
      present_actor_ids: ['heroine2'],
      presence_evidence: [{ actor_id: 'heroine2', quote: `"${spoken}` }]
    },
    dialogue_lines: [{ speaker_id: 'heroine2', text: spoken, evidence_quote: `"${spoken}"`, order: 0 }]
  };
  const result = normalizeObservation(observer, {
    storyText,
    before: { state_revision: 0, committed_turn: 0, turn_revision: 0, profile: {}, time: { day: 1, minutes: 540 }, scene: { location_id: 'brand_strategy_office', present_actor_ids: [] }, active_rules: [], projection_meta: {} },
    content,
    turnNumber: 1
  });
  assert.deepEqual(result.scene.presence.value, ['heroine2']);
  assert.deepEqual(result.dialogueLines.map(line => line.speaker_id), ['heroine2']);
  assert.equal(result.warnings.includes('presence_unverified'), false);
});

test('R4 voice projection uses the nearest Story attribution when Observer cites only the exact spoken line', () => {
  const storyText = '직원 라운지에서 김제나가 컵을 두 손으로 감싼다. 제나는 잠깐 눈을 내렸다가 다시 올려다본다. "네, 괜찮아요." 대답은 짧지만 흘리듯 나오지 않는다.\n[선택지]\n1. 음악을 묻는다.\n2. 잠깐 기다린다.\n3. 자리를 비켜 준다.\n4. 물을 마신다.';
  const evidenceQuote = '"네, 괜찮아요." 대답은 짧지만 흘리듯 나오지 않는다.';
  const result = normalizeObservation({
    scene: {
      present_actor_ids: ['heroine3'],
      presence_evidence: [{ actor_id: 'heroine3', quote: '직원 라운지에서 김제나가 컵을 두 손으로 감싼다.' }]
    },
    dialogue_lines: [{ speaker_id: 'heroine3', text: '네, 괜찮아요.', direction: '', evidence_quote: evidenceQuote }],
    turn_digest: { summary: '김제나가 잠시 망설이다가 대답한다.', important: false },
    actor_ids: ['heroine3'],
    keywords: ['음악']
  }, {
    storyText,
    before: { state_revision: 0, committed_turn: 0, turn_revision: 0, profile: {}, time: { day: 1, minutes: 555 }, scene: { location_id: 'employee_lounge', present_actor_ids: [] }, active_rules: [], projection_meta: {} },
    content,
    turnNumber: 1
  });
  assert.deepEqual(result.dialogueLines.map(line => line.text), ['네, 괜찮아요.']);
  assert.deepEqual(result.dialogueLines.map(line => line.speaker_id), ['heroine3']);
  assert.equal(result.warnings.includes('presence_unverified'), false);
});

test('R4 voice projection ignores a recently mentioned absent character and uses the sole present cast member', () => {
  const firstQuote = '"이름 붙이는 얘기." 그녀가 되받는다. 말이 조금 빨라진다. "보리차 향이랑 그게 무슨 상관인데요."';
  const secondQuote = '"제가 아침에 그 얘기 꺼냈을 때, 대리님 별 반응 없었잖아요. 그러다 오후에 다시 꺼내셨고. 저는 그걸 계속 세고 있었어요."';
  const storyText = `김제나 씨와 나눈 이야기를 전한다. 윤민아의 눈이 아주 살짝 가늘어진다. ${firstQuote} 잠깐 숨을 고르고, 그녀는 마우스에서 손을 뗀다. ${secondQuote}`;
  const result = normalizeObservation({
    scene: {
      present_actor_ids: ['heroine2'],
      presence_evidence: [{ actor_id: 'heroine2', quote: '윤민아의 눈이 아주 살짝 가늘어진다.' }]
    },
    dialogue_lines: [
      { speaker_id: 'heroine2', text: '이름 붙이는 얘기. 보리차 향이랑 그게 무슨 상관인데요.', evidence_quote: firstQuote },
      { speaker_id: 'heroine2', text: '제가 아침에 그 얘기 꺼냈을 때, 대리님 별 반응 없었잖아요. 그러다 오후에 다시 꺼내셨고. 저는 그걸 계속 세고 있었어요.', evidence_quote: secondQuote }
    ],
    turn_digest: { summary: '윤민아가 보리차를 기억한다.', important: false },
    actor_ids: ['heroine2'],
    keywords: ['보리차']
  }, {
    storyText,
    before: { state_revision: 0, committed_turn: 35, turn_revision: 1, profile: {}, time: { day: 1, minutes: 560 }, scene: { location_id: 'brand_strategy_office', present_actor_ids: ['heroine2'] }, active_rules: [], projection_meta: {} },
    content,
    turnNumber: 36
  });
  assert.deepEqual(result.dialogueLines.map(line => line.speaker_id), ['heroine2', 'heroine2', 'heroine2']);
  assert.deepEqual(result.dialogueLines.map(line => line.text), [
    '이름 붙이는 얘기.',
    '보리차 향이랑 그게 무슨 상관인데요.',
    '제가 아침에 그 얘기 꺼냈을 때, 대리님 별 반응 없었잖아요. 그러다 오후에 다시 꺼내셨고. 저는 그걸 계속 세고 있었어요.'
  ]);
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

test('R4 manual voice replay uses the latest committed source line while autoplay stays off', async () => {
  const listeners = new Map();
  const replayListeners = new Map();
  const audioListeners = new Map();
  const toggle = { addEventListener: (name, fn) => listeners.set(name, fn), setAttribute() {}, textContent: '' };
  const replay = { addEventListener: (name, fn) => replayListeners.set(name, fn) };
  const audio = {
    hidden: false,
    src: '',
    currentTime: 14,
    paused: true,
    addEventListener: (name, fn) => audioListeners.set(name, fn),
    removeAttribute(name) { if (name === 'src') this.src = ''; },
    pause() { this.paused = true; },
    async play() { this.paused = false; }
  };
  const status = { textContent: '' };
  const documentRef = { getElementById(id) { return ({ 'tts-toggle': toggle, 'tts-replay': replay, 'tts-status': status, 'audio-player': audio })[id] ?? null; } };
  const calls = [];
  const controller = createCompanyTts({
    documentRef,
    api: { async tts(payload) { calls.push(payload); return { url: 'https://audio.invalid/heroine1.mp3' }; } },
    getView: () => ({
      identity: 'game:2:2', turn: { turn_number: 2, turn_revision: 2 },
      dialogueLines: [{ speaker_id: 'heroine1', speaker_name: '서원희', text: '지금은 괜찮아요.', direction: '낮게 말한다.', evidence_quote: '서원희가 "지금은 괜찮아요."라고 낮게 말한다.', order: 0 }],
      presentActorIds: ['heroine1'], focalActorId: 'heroine1'
    }),
    storage: { getItem: () => null, setItem() {} }
  });
  controller.onCommittedTurn();
  assert.equal(controller.state.enabled, false);
  assert.equal(calls.length, 0);
  assert.equal(audio.paused, true);
  replayListeners.get('click')();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].speaker_id, 'heroine1');
  assert.equal(calls[0].text, '지금은 괜찮아요.');
  assert.equal(audio.src, 'https://audio.invalid/heroine1.mp3');
  assert.equal(audio.paused, false);
  assert.equal(status.textContent, '서원희 대사 재생 중');
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

test('R4 keeps the last verified game clock without degrading a turn that states no elapsed passage', () => {
  const before = {
    state_revision: 7,
    committed_turn: 7,
    turn_revision: 1,
    profile: { name: 'R4 검증' },
    time: { day: 1, minutes: 555 },
    scene: { location_id: 'brand_strategy_office', present_actor_ids: ['heroine2'], scene_note: '대화 중' },
    active_rules: [],
    projection_meta: { status: 'complete', last_verified_turn: { time: 7 }, unverified: [] }
  };
  const evidence = '브랜드전략팀 사무실에서 윤민아는 창밖을 바라보다가 다시 말을 이었다.';
  const storyText = `${evidence}\n[선택지]\n1. 대답한다.\n2. 기다린다.\n3. 다른 얘기를 한다.\n4. 자리를 옮긴다.`;
  const noElapsedObserver = {
    scene: {
      location_id: 'brand_strategy_office',
      location_evidence: evidence,
      present_actor_ids: ['heroine2'],
      presence_evidence: [{ actor_id: 'heroine2', quote: evidence }],
      scene_note_status: 'observed',
      scene_note: '윤민아가 말을 잇는다.',
      scene_note_evidence: evidence
    },
    turn_digest: { summary: '윤민아가 창밖을 바라보다가 대화를 이어 간다.', important: false },
    actor_ids: ['heroine2'],
    keywords: ['대화']
  };
  const observation = normalizeObservation(noElapsedObserver, {
    storyText,
    before,
    content,
    turnNumber: 8
  });
  assert.deepEqual(observation.elapsedMinutes, { status: 'unchanged', value: 0 });
  assert.equal(observation.warnings.includes('elapsed_time_unverified'), false);
  const schemaDefaultObservation = normalizeObservation({ ...noElapsedObserver, elapsed_minutes: 0 }, {
    storyText,
    before,
    content,
    turnNumber: 8
  });
  assert.deepEqual(schemaDefaultObservation.elapsedMinutes, { status: 'unchanged', value: 0 });
  assert.equal(schemaDefaultObservation.warnings.includes('elapsed_time_unverified'), false);
  const after = reduceTurn({ before, observation, turnNumber: 8, turnRevision: 1 });
  assert.deepEqual(after.time, before.time);
  assert.equal(after.projection_meta.status, 'complete');
  assert.equal(after.projection_meta.last_verified_turn.time, 7);
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

test('synthetic rule-state fixture keeps a targeted old event recallable after history rollover and restart', async t => {
  const root = await tempDir(t);
  const dbPath = join(root, 'db');
  let store = await createR4Store({ dbPath });
  const gameId = await setupGame(store);
  const contexts = [];
  const subjectIds = ['heroine1', 'heroine2'];
  const selectors = { subject_actor_id: 'heroine1', counterparty_actor_id: 'heroine2' };
  const rules = {
    structural_policy_anchor: { template_id: 'structural_policy_anchor', label: 'anchor_before_repeated_changes', rule_text: 'test-only structural description anchor', authority_label: 'test fixture', selector_schema: 'test_fixture' },
    structural_policy_a: { template_id: 'structural_policy_a', label: 'fixture policy A', rule_text: 'test-only structural description A', authority_label: 'test fixture', selector_schema: 'test_fixture' },
    structural_policy_b: { template_id: 'structural_policy_b', label: 'fixture policy B', rule_text: 'test-only structural description B', authority_label: 'test fixture', selector_schema: 'test_fixture' }
  };
  const resolveRuleTemplate = (templateId, requestedSelectors) => {
    assert.deepEqual(requestedSelectors, selectors);
    const descriptor = rules[templateId];
    return descriptor ? { ...descriptor, subject_actor_ids: ['heroine1', 'heroine2'], counterparty_actor_ids: ['heroine2'] } : null;
  };
  const provider = {
    mode: 'test-only-structural-provider',
    modelNames: { story: 'test-only', observer: 'test-only' },
    async story({ context }) {
      contexts.push(structuredClone(context));
      const location = content.locations.find(item => item.location_id === context.scene.location_id);
      const rule = context.rule_change_event?.next_rule ?? context.active_rules.find(item => item.rule_id === 'fixture-rule') ?? context.rule_change_event?.previous_rule;
      const eventLine = context.rule_change_event
        ? `사내 모니터에는 ${context.rule_change_event.operation}으로 새 효력이 반영된 ${rule.label} 공지가 나타났다.`
        : `현재 장면에는 ${context.active_rules.length ? '활성 규정이 이어지고 있다' : '활성 규정이 남아 있지 않다'}.`;
      return [
        `${location.name}에서 이야기가 이어졌다.`,
        eventLine,
        '서원희는 공지 화면을 한 번 더 확인하고 표정을 다잡았다.',
        '윤민아는 화면을 가리키며 변경된 내용을 먼저 물었다.',
        '잠시 뒤 두 사람이 다시 대화를 이었다.',
        '두 분이 지났다.',
        '[선택지]', '1. 서원희에게 생각을 묻는다.', '2. 윤민아에게 변경 이유를 묻는다.', '3. 잠시 둘의 대화를 지켜본다.', '4. 다른 이야기를 꺼낸다.'
      ].join('\n');
    },
    async observe({ storyText, context }) {
      const location = content.locations.find(item => item.location_id === context.scene.location_id);
      const locationEvidence = `${location.name}에서 이야기가 이어졌다.`;
      const wunheeEvidence = '서원희는 공지 화면을 한 번 더 확인하고 표정을 다잡았다.';
      const minahEvidence = '윤민아는 화면을 가리키며 변경된 내용을 먼저 물었다.';
      assert.ok(storyText.includes(locationEvidence));
      return {
        elapsed_minutes: 2,
        elapsed_evidence: '두 분이 지났다.',
        scene: {
          location_id: location.location_id,
          location_evidence: locationEvidence,
          present_actor_ids: subjectIds,
          presence_evidence: [
            { actor_id: 'heroine1', quote: wunheeEvidence },
            { actor_id: 'heroine2', quote: minahEvidence }
          ]
        },
        actor_ids: subjectIds,
        keywords: ['test_fixture_scope'],
        turn_digest: { summary: 'test-only structural memory of a staged rule event and two source characters', important: true },
        active_rules: [{ rule_id: 'observer-forgery' }],
        rule_history: [],
        mind_monitor: {
          heroine1: { surface: '공지 화면을 다시 확인한다.', subconscious: '새 변화에 당황했지만 태도를 정돈하려 한다.' },
          heroine2: { surface: '변경된 조항을 질문한다.', subconscious: '예상하지 못한 변경의 범위를 파악하려 한다.' }
        }
      };
    }
  };

  const submitRuleChange = async (operation, templateId, expectedRuleVersion) => {
    const snapshot = await store.readSnapshot(gameId);
    const command = createCommand({
      gameId,
      kind: 'RULE_CHANGE',
      expectedStateRevision: snapshot.state.state_revision,
      ruleChange: { operation, rule_id: 'fixture-rule', template_id: templateId, selectors, expected_rule_version: expectedRuleVersion }
    });
    const reserved = await store.beginCommand({ command });
    return { command, job: reserved.job };
  };

  const failedApply = await submitRuleChange('APPLY', 'structural_policy_anchor', 0);
  await assert.rejects(
    executeTurnJob({ job: failedApply.job, store, provider: { ...provider, async story() { throw new Error('test_story_failure'); } }, content, resolveRuleTemplate }),
    error => error.code === 'test_story_failure'
  );
  assert.deepEqual((await store.readSnapshot(gameId)).state.active_rules, []);
  assert.deepEqual((await store.readSnapshot(gameId)).state.rule_history, []);
  const applyRetry = await store.retryJob(failedApply.job.jobId, gameId);
  assert.deepEqual(applyRetry.job.command, failedApply.command);
  await executeTurnJob({ job: applyRetry.job, store, provider, content, resolveRuleTemplate });
  let snapshot = await store.readSnapshot(gameId);
  assert.deepEqual(snapshot.state.active_rules.map(rule => [rule.rule_id, rule.template_id, rule.version]), [['fixture-rule', 'structural_policy_anchor', 1]]);
  assert.equal(snapshot.latest_turn.observer_applied.raw.active_rules[0].rule_id, 'observer-forgery');
  assert.equal(snapshot.latest_turn.command.rule_change.operation, 'APPLY');
  assert.deepEqual(snapshot.latest_turn.rule_change_event.next_rule.subject_actor_ids, subjectIds);
  assert.equal(contexts[0].mode, 'rule_change');
  assert.deepEqual(contexts[0].registered_characters.map(actor => actor.actor_id).filter(id => subjectIds.includes(id)).sort(), subjectIds);
  assert.equal(contexts[0].registered_characters.find(actor => actor.actor_id === 'heroine1').dramatization.personality, content.actors.find(actor => actor.actor_id === 'heroine1').prompt_card.personality);
  assert.equal(contexts[0].rule_change_event.operation, 'APPLY');
  assert.deepEqual(contexts[0].active_rules.map(rule => rule.template_id), ['structural_policy_anchor']);

  snapshot = await store.readSnapshot(gameId);
  const feedbackText = '공지 장면은 유지하고 두 인물의 서로 다른 반응을 또렷하게 보여 준다.';
  const feedback = await store.beginFeedback({ gameId, requestId: 'fixture-rule-feedback', feedbackText, expectedStateRevision: snapshot.state.state_revision });
  const feedbackResult = await executeTurnJob({ job: feedback.job, store, provider, content, resolveRuleTemplate });
  assert.deepEqual(feedbackResult.turn.command, applyRetry.job.command);
  assert.equal(feedbackResult.turn.feedback_text, feedbackText);
  assert.equal(feedbackResult.receipt.committed_turn, 1);
  assert.equal(feedbackResult.receipt.turn_revision, 2);
  assert.deepEqual(feedbackResult.snapshot.state.active_rules.map(rule => rule.template_id), ['structural_policy_anchor']);
  const originalRuleEvent = structuredClone(feedbackResult.turn.rule_change_event);

  const ordinary = await store.readSnapshot(gameId);
  const ordinaryCommand = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: ordinary.state.state_revision, literalAction: '서원희와 윤민아에게 새 공지에 대해 묻는다.' });
  const ordinaryJob = await store.beginCommand({ command: ordinaryCommand });
  await executeTurnJob({ job: ordinaryJob.job, store, provider, content, resolveRuleTemplate });
  assert.deepEqual(contexts[2].active_rules.map(rule => rule.template_id), ['structural_policy_anchor']);
  assert.equal(contexts[2].historical_rule_events.at(-1).operation, 'APPLY');
  assert.equal(contexts[2].recent_committed_turns[0].turn_number, 1);

  for (let index = 0; index < 6; index += 1) {
    const prior = await store.readSnapshot(gameId);
    const followUp = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: prior.state.state_revision, literalAction: `짧은 후속 대화 ${index + 1}를 이어간다.` });
    const followUpJob = await store.beginCommand({ command: followUp });
    await executeTurnJob({ job: followUpJob.job, store, provider, content, resolveRuleTemplate });
  }
  const longMemoryState = await store.readSnapshot(gameId);
  const recallCommand = createCommand({ gameId, kind: 'FREE_ACTION', expectedStateRevision: longMemoryState.state.state_revision, literalAction: '서원희와 윤민아가 이전 공지를 두고 나눈 대화를 떠올린다.' });
  const recallJob = await store.beginCommand({ command: recallCommand });
  await executeTurnJob({ job: recallJob.job, store, provider, content, resolveRuleTemplate });
  assert.ok(contexts[9].relevant_past_memories.some(memory => memory.source_turn === 1));
  assert.equal(contexts[9].historical_rule_events.at(-1).operation, 'APPLY');

  const change = await submitRuleChange('CHANGE', 'structural_policy_b', 1);
  await executeTurnJob({ job: change.job, store, provider, content, resolveRuleTemplate });
  snapshot = await store.readSnapshot(gameId);
  assert.deepEqual(snapshot.state.active_rules.map(rule => [rule.template_id, rule.version]), [['structural_policy_b', 2]]);
  assert.equal(snapshot.latest_turn.rule_change_event.previous_rule.template_id, 'structural_policy_anchor');
  assert.equal(snapshot.latest_turn.rule_change_event.next_rule.template_id, 'structural_policy_b');
  assert.deepEqual(contexts[10].active_rules.map(rule => rule.template_id), ['structural_policy_b']);
  assert.equal(contexts[10].rule_change_event.previous_rule.template_id, 'structural_policy_anchor');

  const remove = await submitRuleChange('REMOVE', 'structural_policy_b', 2);
  await executeTurnJob({ job: remove.job, store, provider, content, resolveRuleTemplate });
  snapshot = await store.readSnapshot(gameId);
  assert.deepEqual(snapshot.state.active_rules, []);
  assert.deepEqual(snapshot.state.rule_history.map(event => event.operation), ['APPLY', 'CHANGE', 'REMOVE']);
  assert.equal(contexts[11].active_rules.length, 0);
  assert.equal(contexts[11].rule_change_event.operation, 'REMOVE');
  assert.equal(contexts[11].rule_change_event.previous_rule.template_id, 'structural_policy_b');
  assert.deepEqual(snapshot.latest_turn.command.rule_change, remove.command.rule_change);

  for (let index = 0; index < 9; index += 1) {
    const cycleApply = await submitRuleChange('APPLY', 'structural_policy_a', 0);
    await executeTurnJob({ job: cycleApply.job, store, provider, content, resolveRuleTemplate });
    const cycleRemove = await submitRuleChange('REMOVE', 'structural_policy_a', 1);
    await executeTurnJob({ job: cycleRemove.job, store, provider, content, resolveRuleTemplate });
  }

  snapshot = await store.readSnapshot(gameId);
  assert.deepEqual(snapshot.state.active_rules, []);
  assert.equal(snapshot.state.rule_history.length, 8);
  assert.equal(snapshot.state.rule_history.some(event => event.command_id === originalRuleEvent.command_id), false);
  assert.equal(snapshot.state.committed_turn, 29);

  await store.close();
  store = await createR4Store({ dbPath });
  t.after(() => store.close());
  const restored = await store.readSnapshot(gameId);
  assert.deepEqual(restored.state.active_rules, []);
  assert.equal(restored.state.rule_history.length, 8);
  assert.equal(restored.state.committed_turn, 29);
  assert.equal(restored.state.state_revision, 30);

  const oldRuleRecallCommand = createCommand({
    gameId,
    kind: 'FREE_ACTION',
    expectedStateRevision: restored.state.state_revision,
    literalAction: 'anchor_before_repeated_changes를 다시 떠올려 본다.'
  });
  const oldRuleRecallJob = await store.beginCommand({ command: oldRuleRecallCommand });
  await executeTurnJob({ job: oldRuleRecallJob.job, store, provider, content, resolveRuleTemplate });
  const recallContext = contexts.at(-1);
  assert.deepEqual(recallContext.active_rules, []);
  assert.ok(recallContext.relevant_past_memories.some(memory => memory.source_turn === originalRuleEvent.effective_turn));
  assert.ok(recallContext.historical_rule_events.some(event => event.command_id === originalRuleEvent.command_id));
  assert.equal((await store.readSnapshot(gameId)).state.active_rules.length, 0);
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

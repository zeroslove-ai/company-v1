import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiWorker } from '../src/api/index.js';
import {
  buildOpeningNextSave,
  buildOpeningPlan,
  buildOpeningPrompt,
  buildPlayerPromptProjection,
  buildStoryPrompt,
  resolvePlayerCanonicalNames,
  splitOpeningSections,
  validatePlayerSetupInput
} from '../src/engine/index.js';
import edition from '../src/api/edition.js';
import { DEPARTMENTS, POSITIONS, BODY_TYPES, SPEECH_STYLES } from '../src/frontend/pages/catalogs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJsonFile = file => JSON.parse(read(file));
const gameId = '11111111-1111-4111-8111-111111111111';

const env = {
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  LLM_API_URL: 'https://llm.test',
  LLM_API_KEY: 'test-llm-key',
  STORY_MODEL: 'story-test',
  EXTRACT_MODEL: 'extract-test'
};

const catalogs = {
  departments: DEPARTMENTS.map(({ department_id, name }) => ({ department_id, name })),
  positions: POSITIONS.map(({ position_id, name }) => ({ position_id, name })),
  bodyTypes: BODY_TYPES,
  speechStyles: SPEECH_STYLES
};
const heroineIds = Object.keys(edition.characters.characters);

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const request = (pathName, body) => new Request(`https://worker.test${pathName}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

function freshSave() {
  return {
    save_schema_version: 1, edition: 'company-v1',
    turn_state: { committed_turn: 0 },
    player: {}, scene_state: {}, world_state: {},
    npc_stats: {}, npc_emotion: {}, npc_relationship_state: {}, npc_scene_state: {}, npc_work_state: {},
    csa_active: [], csa_rules: {}, csa_attitudes: {}, csa_runtime_state: {}, csa_aftereffect_state: {},
    event_ledger: [], story_summary_overall: '', story_summary_recent: '',
    focal_character_id: null, last_speaker_id: null, last_npcs_present: [], last_image_id: null,
    last_choices: [], last_choice_meta: []
  };
}

const openingSse = 'data: {"choices":[{"delta":{"content":"[배경] 신입사원으로 출근한 첫날이다."}}]}\n\n'
  + 'data: {"choices":[{"delta":{"content":"\\n[1. 서사 및 행동]\\n로비가 분주하다."}}]}\n\n'
  + 'data: {"choices":[{"delta":{"content":"\\n[2. 플레이어 속마음]\\n긴장된다."}}]}\n\n'
  + 'data: {"choices":[{"delta":{"content":"\\n[3. 플레이어 상황판]\\n장소: 로비"}}]}\n\n'
  + 'data: {"choices":[{"delta":{"content":"\\n[4. 선택지]\\n1. 인사한다\\n2. 둘러본다\\n3. 자리를 찾는다\\n4. 대기한다"}}]}\n\n'
  + 'data: [DONE]\n';

function createSetupMockFetch({ initialSave = freshSave(), masterInitialSave = freshSave(), gameTitle = '상식개변: 회사편', storySseText = openingSse, storyThrows = false } = {}) {
  const calls = [];
  let currentSave = structuredClone(initialSave);
  masterInitialSave = structuredClone(masterInitialSave);
  let saveRevision = 1;
  let storyCallCount = 0;
  let remainingStoryFailures = Number(storyThrows) || 0;

  async function fetchImpl(url, init = {}) {
    const textUrl = String(url);
    calls.push({ url: textUrl, method: init.method ?? 'GET', body: init.body });
    if (textUrl.startsWith('https://llm.test')) {
      const body = JSON.parse(init.body);
      if (body.stream) {
        storyCallCount += 1;
        if (remainingStoryFailures > 0) { remainingStoryFailures -= 1; throw new Error('llm upstream unavailable'); }
        return new Response(storySseText, { headers: { 'content-type': 'text/event-stream' } });
      }
      throw new Error('unexpected non-streaming LLM call in setup/opening flow');
    }
    const parsed = new URL(textUrl);
    const rpc = parsed.pathname.split('/').pop();
    const args = init.body ? JSON.parse(init.body) : {};
    if (rpc === 'get_company_context') {
      return json({ game: { id: gameId, edition_id: 'company-v1', title: gameTitle }, save: { data: currentSave, committed_turn: currentSave.turn_state?.committed_turn ?? 0 }, recent_turns: [] });
    }
    if (rpc === 'reset_company_game') {
      currentSave = structuredClone(masterInitialSave);
      return json({ success: true, game_id: args.p_game_id, committed_turn: 0 });
    }
    if (rpc === 'reserve_company_player_setup') {
      if (currentSave.player_setup?.completed === true) {
        return json({ code: '22023', message: 'player setup is already completed for this game; reset to configure again' }, 500);
      }
      const plan = args.p_opening_plan;
      const participants = ['player-1', plan.primary_character_id, ...plan.supporting_character_ids];
      currentSave = {
        ...currentSave,
        player: { player_id: 'player-1', adult: true, ...args.p_player, background: '' },
        player_setup: { version: 1, completed: false, status: 'reserved', setup_id: args.p_setup_id },
        opening_state: { setup_id: args.p_setup_id, plan, status: 'planned' },
        scene_state: { scene_id: 'opening', location_id: plan.location_id, participants, scene_goal: plan.scene_goal, beat: 0 },
        player_scene_state: { location_id: plan.location_id, updated_turn: 0 },
        npc_scene_state: Object.fromEntries([plan.primary_character_id, ...plan.supporting_character_ids].map(id => [id, { present: true }]))
      };
      return json({ success: true, idempotent: false, setup_id: args.p_setup_id, opening_plan: plan });
    }
    if (rpc === 'commit_company_opening') {
      if (currentSave.player_setup?.setup_id !== args.p_setup_id) return json({ code: '22023', message: 'player setup identity mismatch' }, 500);
      if (currentSave.player_setup?.completed === true) return json({ success: true, replayed: true, save_revision: saveRevision });
      const plan = currentSave.opening_state?.plan;
      currentSave = {
        ...currentSave,
        player: { ...currentSave.player, background: args.p_background },
        opening_state: { ...currentSave.opening_state, story_text: args.p_story_text, choices: args.p_choices, status: 'complete' },
        player_setup: { ...currentSave.player_setup, status: 'complete', completed: true },
        last_choices: args.p_choices,
        last_npcs_present: [plan?.primary_character_id, ...(plan?.supporting_character_ids ?? [])].filter(Boolean),
        focal_character_id: plan?.primary_character_id ?? null,
        story_summary_overall: args.p_background || '회사에서의 첫 장면이 시작되었다.',
        story_summary_recent: args.p_story_text.slice(0, 500)
      };
      saveRevision += 1;
      return json({ success: true, replayed: false, save_revision: saveRevision });
    }
    throw new Error(`Unhandled mock RPC: ${rpc}`);
  }
  return { fetchImpl, calls, getSave: () => currentSave, storyCallCount: () => storyCallCount };
}

function validPlayerBody() {
  return {
    name: '김하늘', department_id: 'brand_strategy', position_id: 'intern',
    height_cm: 170, weight_kg: 65, penis_length_cm: 13,
    body_type_id: 'balanced', speech_style_id: 'polite'
  };
}

async function readSseText(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (value) text += decoder.decode(value, { stream: !done });
    if (done) break;
  }
  return text;
}

// ---------- Engine layer ----------

test('validatePlayerSetupInput enforces every range and catalog allow-list and never trusts client-only checks', () => {
  const valid = validatePlayerSetupInput(validPlayerBody(), catalogs);
  assert.equal(valid.valid, true);
  assert.deepEqual(Object.keys(valid.player).sort(), ['body_type_id', 'department_id', 'height_cm', 'name', 'penis_length_cm', 'position_id', 'speech_style_id', 'weight_kg'].sort());

  const cases = [
    [{ height_cm: 139 }, 'invalid_height_cm'], [{ height_cm: 221 }, 'invalid_height_cm'],
    [{ weight_kg: 39 }, 'invalid_weight_kg'], [{ weight_kg: 181 }, 'invalid_weight_kg'],
    [{ penis_length_cm: 4 }, 'invalid_penis_length_cm'], [{ penis_length_cm: 31 }, 'invalid_penis_length_cm'],
    [{ name: '' }, 'invalid_name'], [{ name: 'x'.repeat(21) }, 'invalid_name'],
    [{ department_id: 'not_a_department' }, 'invalid_department_id'],
    [{ position_id: 'ceo' }, 'invalid_position_id'],
    [{ body_type_id: 'invalid' }, 'invalid_body_type_id'],
    [{ speech_style_id: 'invalid' }, 'invalid_speech_style_id']
  ];
  for (const [override, expectedError] of cases) {
    const result = validatePlayerSetupInput({ ...validPlayerBody(), ...override }, catalogs);
    assert.equal(result.valid, false, JSON.stringify(override));
    assert.equal(result.errors.includes(expectedError), true, `${expectedError} for ${JSON.stringify(override)}`);
  }

  // Extra/forbidden fields on the input are silently ignored, never carried into the validated player.
  const withJunk = validatePlayerSetupInput({ ...validPlayerBody(), work_strength: '기획력', difficulty: 'hard', personality_list: ['a'] }, catalogs);
  assert.equal(withJunk.valid, true);
  assert.equal('work_strength' in withJunk.player, false);
  assert.equal('difficulty' in withJunk.player, false);
  assert.equal('personality_list' in withJunk.player, false);
});

test('buildOpeningPlan is deterministic, picks exactly one primary and at most one distinct supporting heroine, and gates locations by position', () => {
  const seedA = [1, 2, 3, 4, 5, 6, 7, 8];
  const planA1 = buildOpeningPlan({ positionId: 'intern', seedBytes: seedA, heroineIds });
  const planA2 = buildOpeningPlan({ positionId: 'intern', seedBytes: seedA, heroineIds });
  assert.deepEqual(planA1, planA2);
  assert.equal(['월요일', '화요일', '수요일', '목요일', '금요일'].includes(planA1.weekday), true);
  assert.equal(planA1.date_label, `Day 1 · ${planA1.weekday}`);
  assert.equal(planA1.date_label.includes('요일요일'), false);

  const internLocations = new Set(['office', 'training_room', 'lobby', 'small_meeting_room']);
  assert.equal(internLocations.has(planA1.location_id), true);

  const executiveLocations = new Set(['executive_meeting_room', 'large_meeting_room', 'project_report_room']);
  const execPlan = buildOpeningPlan({ positionId: 'executive', seedBytes: seedA, heroineIds });
  assert.equal(executiveLocations.has(execPlan.location_id), true);

  for (let seed = 0; seed < 40; seed += 1) {
    const plan = buildOpeningPlan({ positionId: 'assistant_manager', seedBytes: [seed, seed + 7, seed + 13], heroineIds });
    assert.equal(heroineIds.includes(plan.primary_character_id), true);
    assert.equal(plan.supporting_character_ids.length <= 1, true);
    assert.equal(plan.supporting_character_ids.includes(plan.primary_character_id), false);
    const present = new Set([plan.primary_character_id, ...plan.supporting_character_ids]);
    assert.equal(present.size < heroineIds.length, true, 'opening never seats every heroine at once');
  }

  const seedB = [9, 40, 121, 200];
  const planB = buildOpeningPlan({ positionId: 'intern', seedBytes: seedB, heroineIds });
  assert.notDeepEqual(planA1, planB);
});

test('buildPlayerPromptProjection always sends canonical identity and speech style, and gates body/sexual/background fields on relevance', () => {
  const player = { name: '김하늘', height_cm: 170, weight_kg: 65, penis_length_cm: 13, background: '전 직장에서 마케팅을 했다.' };
  const canonical = { departmentName: '브랜드전략팀', positionName: '인턴', bodyTypeName: '균형 잡힌 체형', speechStyleName: '정중한 존댓말' };

  const ordinary = buildPlayerPromptProjection({ player, canonical, playerAction: '회의실로 이동해서 하연에게 인사한다.' });
  assert.deepEqual(ordinary, { name: '김하늘', department: '브랜드전략팀', position: '인턴', speech_style: '정중한 존댓말' });
  assert.equal('height_cm' in ordinary, false);
  assert.equal('penis_length_cm' in ordinary, false);
  assert.equal('background' in ordinary, false);

  const bodyRelevant = buildPlayerPromptProjection({ player, canonical, playerAction: '거울 앞에서 옷차림과 체형을 확인한다.' });
  assert.equal(bodyRelevant.height_cm, 170);
  assert.equal(bodyRelevant.body_type, '균형 잡힌 체형');
  assert.equal('penis_length_cm' in bodyRelevant, false);

  for (const playerAction of ['키스한다.', '포옹한다.', '가슴에 손을 댄다.', '가벼운 스킨십을 시도한다.']) {
    const nonDirect = buildPlayerPromptProjection({ player, canonical, playerAction });
    assert.equal('penis_length_cm' in nonDirect, false, playerAction);
  }

  const sexualRelevant = buildPlayerPromptProjection({ player, canonical, playerAction: '성기를 노출하고 삽입을 시도한다.' });
  assert.equal(sexualRelevant.penis_length_cm, 13);

  const backgroundRelevant = buildPlayerPromptProjection({ player, canonical, playerAction: '이전 직장에서의 경력을 이야기한다.' });
  assert.equal(backgroundRelevant.background, player.background);

  const evidenceForced = buildPlayerPromptProjection({ player, canonical, playerAction: '평범한 인사.', evidence: { sexual_relevant: true } });
  assert.equal(evidenceForced.penis_length_cm, 13);
});

test('buildStoryPrompt never leaks body measurements into an ordinary Story turn and includes them only for sexual context', () => {
  const context = {
    game: { id: gameId, title: '상식개변: 회사편' },
    save: { data: { ...freshSave(), player: { name: '김하늘', department_id: 'brand_strategy', position_id: 'intern', height_cm: 170, weight_kg: 65, penis_length_cm: 13, body_type_id: 'balanced', speech_style_id: 'polite' } } },
    recent_turns: []
  };
  const ordinary = buildStoryPrompt({ edition, context, playerAction: '팀장에게 오늘 일정을 물어본다.', expectedTurn: 1, npcIds: new Set(heroineIds), catalogs });
  const ordinaryPayload = JSON.parse(ordinary[1].content);
  assert.equal('penis_length_cm' in ordinaryPayload.context.player, false);
  assert.equal('height_cm' in ordinaryPayload.context.player, false);
  assert.equal(ordinaryPayload.context.player.speech_style, '정중한 존댓말');

  const sexual = buildStoryPrompt({ edition, context, playerAction: '성기를 노출하고 삽입을 시도한다.', expectedTurn: 1, npcIds: new Set(heroineIds), catalogs });
  const sexualPayload = JSON.parse(sexual[1].content);
  assert.equal(sexualPayload.context.player.penis_length_cm, 13);
});

test('splitOpeningSections extracts a background under the 120-char cap and truncates with a warning when the model overruns it', () => {
  const short = splitOpeningSections('[배경] 짧은 배경.\n[1. 서사 및 행동]\n본문');
  assert.equal(short.background, '짧은 배경.');
  assert.equal(short.warnings.length, 0);
  assert.match(short.body, /^\[1\. 서사 및 행동\]/);

  const longBackground = '가'.repeat(150);
  const truncated = splitOpeningSections(`[배경] ${longBackground}\n[1. 서사 및 행동]\n본문`);
  assert.equal(Array.from(truncated.background).length, 120);
  assert.equal(truncated.background.endsWith('…'), true);
  assert.equal(truncated.warnings.includes('opening_background_truncated'), true);
});

test('buildOpeningPrompt only surfaces the plan\'s active heroines and adds the TF-lead cross-team note only when it applies', () => {
  const openingPlan = buildOpeningPlan({ positionId: 'intern', seedBytes: [3, 6, 9], heroineIds });
  const canonical = { departmentName: '브랜드전략팀', positionName: '인턴', bodyTypeName: '균형 잡힌 체형', speechStyleName: '정중한 존댓말' };
  const prompt = buildOpeningPrompt({ edition, player: { name: '김하늘', position_id: 'intern', department_id: 'brand_strategy' }, canonical, openingPlan });
  const payload = JSON.parse(prompt[1].content);
  assert.equal('penis_length_cm' in payload.player, false);
  const activeIds = [openingPlan.primary_character_id, ...openingPlan.supporting_character_ids].filter(Boolean);
  assert.deepEqual(Object.keys(payload.active_character_canon).sort(), [...new Set(activeIds)].sort());
  assert.equal(payload.cross_team_note, null);

  const tfPrompt = buildOpeningPrompt({ edition, player: { name: '김하늘', position_id: 'tf_lead', department_id: 'brand_strategy' }, canonical, openingPlan });
  const tfPayload = JSON.parse(tfPrompt[1].content);
  assert.match(tfPayload.cross_team_note, /서원희/);
  assert.match(tfPayload.cross_team_note, /대체하지 않는다/);
});

test('buildOpeningNextSave marks setup complete, leaves committed_turn at 0, and never mutates the pre-save', () => {
  const preSave = freshSave();
  const snapshot = structuredClone(preSave);
  const openingPlan = buildOpeningPlan({ positionId: 'intern', seedBytes: [2, 4, 6], heroineIds });
  const parsedOpening = { raw: '오프닝 본문', choices: ['A', 'B', 'C', 'D'] };
  const nextSave = buildOpeningNextSave({ preSave, player: { name: '김하늘' }, openingPlan, background: '배경 요약.', parsedOpening });
  assert.deepEqual(preSave, snapshot);
  assert.equal(nextSave.turn_state.committed_turn, 0);
  assert.equal(nextSave.player_setup.completed, true);
  assert.equal(nextSave.opening_state.status, 'complete');
  assert.deepEqual(nextSave.opening_state.plan, openingPlan);
  assert.equal(nextSave.opening_state.story_text, parsedOpening.raw);
  assert.equal('opening_plan' in nextSave, false);
  assert.equal(nextSave.player.background, '배경 요약.');
  assert.deepEqual(nextSave.scene_state.participants, [openingPlan.primary_character_id, ...openingPlan.supporting_character_ids].filter(Boolean));
});

test('resolvePlayerCanonicalNames resolves every catalog axis independently', () => {
  const canonical = resolvePlayerCanonicalNames({ department_id: 'audit', position_id: 'executive', body_type_id: 'muscular', speech_style_id: 'cold' }, catalogs);
  assert.equal(canonical.departmentName, '감사실');
  assert.equal(canonical.positionName, '임원');
  assert.equal(canonical.bodyTypeName, '근육질');
  assert.equal(canonical.speechStyleName, '냉정한 말투');
});

// ---------- Content and scope ----------

test('frontend catalogs mirror the authoritative content catalogs exactly, and every ui_hint stays under 10 characters', () => {
  const organization = readJsonFile('content/organization.json');
  const positions = readJsonFile('content/positions.json');
  const bodyTypes = readJsonFile('content/body_types.json');
  const speechStyles = readJsonFile('content/speech_styles.json');
  assert.deepEqual(DEPARTMENTS, organization.departments);
  assert.deepEqual(POSITIONS, positions.positions);
  assert.deepEqual(BODY_TYPES, bodyTypes.body_types);
  assert.deepEqual(SPEECH_STYLES, speechStyles.speech_styles);
  for (const entry of [...organization.departments, ...positions.positions]) {
    assert.equal(Array.from(entry.ui_hint).length < 10, true, `${entry.name} ui_hint too long`);
  }
});

test('all five Company heroines retain their configured voice IDs', () => {
  const characters = readJsonFile('content/characters.json').characters;
  assert.deepEqual(Object.fromEntries(Object.entries(characters).map(([id, character]) => [id, character.voice_id])), {
    heroine1: '259d7fde62cd445fbde3ce2d8d4f2f3b',
    heroine2: '85ac82e33b014a16abe9d0b4b9b0cb68',
    heroine3: '46939387dd944a45a399bd92b8de52cb',
    heroine4: 'd06889767ac5416293584676309fa740',
    heroine5: '03a79d68ca184930a1215f9b1b8eb5b5'
  });
});

test('forbidden player-setup fields never appear in catalogs, engine source, or the opening prompt contract', () => {
  const forbidden = [/업무\s*장점/, /업무\s*약점/, /플레이\s*난이도/, /추천\s*플레이\s*성향/, /히로인\s*초기\s*호감도/, /히로인별\s*초기\s*접점/, /성격\s*목록/, /말투\s*자유서술/, /후보\s*추천\s*이유/];
  const sources = [
    read('content/positions.json'), read('content/body_types.json'), read('content/speech_styles.json'), read('content/organization.json'),
    read('src/engine/player-setup.js'), read('src/engine/opening-prompt.js'), read('src/frontend/pages/setup.js'), read('src/frontend/pages/catalogs.js'),
    read('src/frontend/pages/index.html')
  ];
  for (const source of sources) {
    for (const pattern of forbidden) assert.doesNotMatch(source, pattern);
  }
});

test('no LLM-based player-candidate generation route or helper exists anywhere in the API or engine surface', () => {
  const apiIndexSource = read('src/api/index.js');
  const turnRoutesSource = read('src/api/turn-routes.js');
  const engineIndexSource = read('src/engine/index.js');
  assert.doesNotMatch(apiIndexSource, /player-candidate|candidate-generation|generate-candidate/i);
  assert.doesNotMatch(turnRoutesSource, /player-candidate|candidate-generation|generate-candidate/i);
  assert.doesNotMatch(engineIndexSource, /Candidate/);
});

// ---------- API layer ----------

test('/api/reset restores player/setup/opening state via reset_company_game without touching game_master, and is idempotent', async () => {
  const primed = freshSave();
  primed.player = { name: 'Old Player' };
  primed.player_setup = { version: 1, completed: true, setup_id: 'setup-old' };
  primed.opening_state = { story: 'old opening', choices: ['a', 'b', 'c', 'd'], status: 'complete' };
  primed.turn_state = { committed_turn: 3 };
  const mock = createSetupMockFetch({ initialSave: primed });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  const first = await worker.fetch(request('/api/reset', { game_id: gameId }), env);
  assert.equal(first.status, 200);
  assert.equal(mock.getSave().player_setup, undefined);
  assert.equal(mock.getSave().turn_state.committed_turn, 0);

  const second = await worker.fetch(request('/api/reset', { game_id: gameId }), env);
  assert.equal(second.status, 200);
  assert.equal(mock.calls.filter(call => call.url.includes('/reset_company_game')).length, 2);
});

test('/api/player-setup re-validates server-side, rejects invalid submissions before any RPC write, and rolls exactly one opening plan', async () => {
  const mock = createSetupMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  const invalid = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: { ...validPlayerBody(), height_cm: 999 } }), env);
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'invalid_player_setup');
  assert.equal(mock.calls.some(call => call.url.includes('/reserve_company_player_setup')), false);

  const response = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  assert.equal(response.status, 200);
  const payload = (await response.json()).data;
  assert.match(payload.setup_id, /^[0-9a-f-]{36}$/i);
  assert.equal(heroineIds.includes(payload.opening_plan.primary_character_id), true);
  assert.equal(payload.opening_plan.supporting_character_ids.length <= 1, true);
});

test('/api/player-setup rejects a resubmission once setup is already completed for the game', async () => {
  const primed = freshSave();
  primed.player_setup = { version: 1, completed: true, setup_id: 'setup-done' };
  const mock = createSetupMockFetch({ initialSave: primed });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const response = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  assert.equal(response.status, 409);
});

test('/api/opening streams background plus four choices, commits turn 0, and never advances committed_turn', async () => {
  const mock = createSetupMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const setupResponse = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  const { setup_id: setupId } = (await setupResponse.json()).data;

  const openingResponse = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  assert.equal(openingResponse.status, 200);
  const text = await readSseText(openingResponse);
  assert.match(text, /event: complete/);
  const completeLine = text.split('\n\n').find(frame => frame.includes('event: complete'));
  const completeData = JSON.parse(completeLine.split('data:')[1].trim());
  assert.equal(completeData.choices.length, 4);
  assert.equal(completeData.background.length <= 120, true);
  assert.equal(completeData.replayed, false);

  const save = mock.getSave();
  assert.equal(save.turn_state.committed_turn, 0);
  assert.equal(save.player_setup.completed, true);
  assert.equal(save.opening_state.status, 'complete');
});

test('/api/opening replays a completed setup without calling the LLM again, and rejects a mismatched setup_id', async () => {
  const mock = createSetupMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const setupResponse = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  const { setup_id: setupId } = (await setupResponse.json()).data;

  const first = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  await readSseText(first);
  assert.equal(mock.storyCallCount(), 1);

  const replay = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  const replayText = await readSseText(replay);
  assert.match(replayText, /"replayed":true/);
  assert.equal(mock.storyCallCount(), 1, 'a duplicate opening request must not call the LLM again');

  const mismatched = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: 'not-the-real-setup-id' }), env);
  const mismatchedText = await readSseText(mismatched);
  assert.match(mismatchedText, /setup_id_mismatch/);
});

test('/api/opening never seats more than two heroines and a failed attempt preserves the persisted opening plan for a retry', async () => {
  const failingMock = createSetupMockFetch({ storyThrows: true });
  const worker = createApiWorker({ fetchImpl: failingMock.fetchImpl });
  const setupResponse = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  const { setup_id: setupId, opening_plan: planBeforeFailure } = (await setupResponse.json()).data;

  const failed = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  const failedText = await readSseText(failed);
  assert.match(failedText, /event: error/);
  assert.deepEqual(failingMock.getSave().opening_state.plan, planBeforeFailure);
  assert.equal(failingMock.getSave().player_setup.completed, false, 'a failed opening attempt must not mark setup complete');
  assert.equal(failingMock.storyCallCount(), 1);
});

test('/api/opening retries an existing reserved setup without another player-setup RPC or setup ID', async () => {
  const mock = createSetupMockFetch({ storyThrows: 1 });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const setupResponse = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  const { setup_id: setupId, opening_plan: initialPlan } = (await setupResponse.json()).data;

  const failed = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  await readSseText(failed);
  const retry = await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  const retryText = await readSseText(retry);

  assert.match(retryText, /event: complete/);
  assert.equal(mock.calls.filter(call => call.url.includes('/reserve_company_player_setup')).length, 1);
  assert.deepEqual(mock.getSave().opening_state.plan, initialPlan);
  assert.equal(mock.getSave().opening_state.setup_id, setupId);
  assert.equal(mock.getSave().player_setup.completed, true);
  assert.equal(mock.storyCallCount(), 2);
});

test('/api/player-setup permits a new setup only after reset clears a reserved setup', async () => {
  const reserved = freshSave();
  reserved.player_setup = { version: 1, setup_id: 'reserved-setup', status: 'reserved', completed: false };
  reserved.opening_state = { setup_id: 'reserved-setup', status: 'planned', plan: {} };
  const mock = createSetupMockFetch({ initialSave: reserved, masterInitialSave: freshSave() });
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });

  const blocked = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  assert.equal(blocked.status, 409);
  assert.equal(mock.calls.filter(call => call.url.includes('/reserve_company_player_setup')).length, 0);

  await worker.fetch(request('/api/reset', { game_id: gameId }), env);
  const allowed = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  assert.equal(allowed.status, 200);
  assert.equal(mock.calls.filter(call => call.url.includes('/reserve_company_player_setup')).length, 1);
});

test('/api/opening active_character_canon sent to the LLM never includes more than two heroines', async () => {
  const mock = createSetupMockFetch();
  const worker = createApiWorker({ fetchImpl: mock.fetchImpl });
  const setupResponse = await worker.fetch(request('/api/player-setup', { game_id: gameId, player: validPlayerBody() }), env);
  const { setup_id: setupId } = (await setupResponse.json()).data;
  await worker.fetch(request('/api/opening', { game_id: gameId, setup_id: setupId }), env);
  const llmCall = mock.calls.find(call => call.url.startsWith('https://llm.test'));
  const messages = JSON.parse(llmCall.body).messages;
  const payload = JSON.parse(messages[1].content);
  assert.equal(Object.keys(payload.active_character_canon).length <= 2, true);
});

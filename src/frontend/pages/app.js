import { createApiClient, ApiError } from './api.js';
import { CATALOGS } from './catalogs.js';
import { createCsaApp } from './csa-app.js';
import { FRONTEND_CONFIG } from './config.js';
import { renderChoices, renderHistory, renderNarrative, renderState, setCommittedStatDeltas, text } from './render.js';
import { catalogOptions, validateSetupValues } from './setup.js';
import { consumeStorySse } from './sse.js';
import { clearPending, committedTurn, loadPending, openingCompleted, openingHistoryTurn, playerSetupCompleted, recoveryFor, reservedPlayerSetupId, resolveGameId, savePending, saveFromContext, validateContext } from './state.js';
import { createUtilityUi } from './utility-ui.js';
import { createCompanyTts } from './tts.js';
import { buildCompanyGameViewModel } from './view-model.js';
import { computeTurnPhase, turnPhaseUiFlags } from './turn-phase.js';
import { buildCompanyMapModel, renderCompanyMap } from './company-map.js';

// Duplicated (deliberately, not imported) from src/engine/choice-input.js: the frontend Worker
// serves only src/frontend/pages as static assets (wrangler.frontend.jsonc), so a relative
// import reaching into src/engine/ would 404 in production even though it resolves locally.
const CHOICE_DIGIT_INDEX = { 1: 0, 2: 1, 3: 2, 4: 3 };
const CHOICE_LETTER_INDEX = { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
const CHOICE_CIRCLED_INDEX = { '①': 0, '②': 1, '③': 2, '④': 3 };
function resolveNumberedChoiceInput(rawInput, save) {
  const trimmed = typeof rawInput === 'string' ? rawInput.trim() : '';
  let index = null;
  if (trimmed.length === 1) {
    if (trimmed in CHOICE_DIGIT_INDEX) index = CHOICE_DIGIT_INDEX[trimmed];
    else if (trimmed in CHOICE_LETTER_INDEX) index = CHOICE_LETTER_INDEX[trimmed];
    else if (trimmed in CHOICE_CIRCLED_INDEX) index = CHOICE_CIRCLED_INDEX[trimmed];
  }
  if (index === null) return null;
  const choices = Array.isArray(save?.last_choices) ? save.last_choices : [];
  // 현재 화면에 유효한 네 선택지가 있을 때만 1~4를 번호 선택으로 해석한다.
  // 부족/범위 밖이면 일반 자유 입력으로 처리한다 (CHOICE_INDEX_OUT_OF_RANGE로 턴 차단 금지).
  if (choices.length !== 4 || typeof choices[index] !== 'string' || !choices[index].trim()) return null;
  return { ok: true, choice_index: index, text: choices[index] };
}

function newActionId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; }
function messageFor(error) {
  if (error instanceof ApiError) return error.code === 'turn_conflict' ? '턴 충돌이 발생했습니다. 현재 상태를 다시 불러오세요.' : error.message;
  return '예상하지 못한 오류가 발생했습니다.';
}
function hasFourChoices(value) { return Array.isArray(value) && value.length === 4 && value.every(choice => typeof choice === 'string' && choice.trim()); }

/**
 * 세션 단위 Story 타임라인 병합 — 새 브라우저 세션에서 진행한 턴을 누적한다.
 * - turn_number가 유효한 턴만 취급한다.
 * - 같은 turn_number는 교체한다(피드백 revision이 같은 턴 카드를 갱신).
 * - 결과는 오래된 턴부터 오름차순 정렬한다.
 * refresh가 recent_turns(최신 1턴)로 세션 기록을 덮어쓰지 않게 하는 유일한 게이트다.
 */
export function mergeSessionTurns(current, incoming) {
  const map = new Map();
  for (const item of [...(current ?? []), ...(incoming ?? [])]) {
    if (!Number.isInteger(item?.turn_number)) continue;
    map.set(item.turn_number, item);
  }
  return [...map.values()].sort((a, b) => a.turn_number - b.turn_number);
}

export function choicesForRenderer(viewModel, streamedStoryChoices = []) {
  return hasFourChoices(streamedStoryChoices) ? streamedStoryChoices : viewModel?.story?.choices ?? [];
}

export function toolbarCapabilities(viewModel, pendingAction, { context, busy = false, recoveryPending = false, utilityAvailable = null } = {}) {
  const committed = (viewModel?.turn?.committed_turn ?? 0) >= 1;
  const ready = playerSetupCompleted(context) && openingCompleted(context) && !busy && !pendingAction && !recoveryPending;
  const capabilities = {
    canResume: committed && !pendingAction,
    canOpenHistory: committed && !busy && !pendingAction && utilityAvailable?.history === true,
    canSendFeedback: committed && !busy && !pendingAction && !recoveryPending && utilityAvailable?.feedback === true,
    canOpenApps: ready
  };
  return capabilities;
}

function withStructuredAction(body, pending) {
  return pending.structured_action ? { ...body, structured_action: pending.structured_action } : body;
}

/**
 * Commit 응답의 실제 turn_changes → {npcId: {statKey: delta}} 일시 표시용.
 * 서버가 확정한 before/after 차이만 사용한다 (프론트 수치 계산기 없음).
 */
export function statDeltasFromTurnChanges(turnChanges) {
  const deltas = {};
  for (const change of Array.isArray(turnChanges) ? turnChanges : []) {
    const match = /^npc_stats\.([^.]+)\.(affinity|csa_acceptance|sexual_arousal|resistance)$/.exec(change?.path ?? '');
    if (!match) continue;
    const from = Number(change?.from);
    const to = Number(change?.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    const npcId = match[1];
    deltas[npcId] = deltas[npcId] ?? {};
    deltas[npcId][match[2]] = to - from;
  }
  return deltas;
}

export function createTurnCoordinator({ api, storage, gameId, getContext, refreshContext, onStory, onExtract, onCommitStart, onCommitted, onPendingChange, createActionId = newActionId, consumeStory = consumeStorySse, onTerminated = null }) {
  function persistPending(pending) { savePending(storage, pending); onPendingChange?.(pending); }
  function dropPending(pendingGameId) { clearPending(storage, pendingGameId); onPendingChange?.(null); }

  async function runCommitForPending(pending) {
    pending.step = 'commit'; persistPending(pending);
    onCommitStart?.();
    const committed = await api.commit(withStructuredAction({ game_id: pending.game_id, action_id: pending.action_id, expected_turn: pending.expected_turn }, pending));
    // Commit이 턴 충돌 등으로 종료된 경우 — 정상 종료로 간주해 pending을 비우고
    // 오류 배너를 지우고 context를 다시 불러온다 (committing 고착·복구 재시도 루프 방지).
    // terminated는 응답 최상위와 commit 안쪽 어느 형태든 모두 종료로 처리한다.
    if (committed.terminated === true || committed.commit?.terminated === true) {
      dropPending(pending.game_id); onTerminated?.(); await refreshContext(); return committed;
    }
    if (committed.commit?.success !== true) throw new ApiError({ endpoint: '/api/commit', status: 502, code: 'invalid_commit', message: 'Commit 결과가 올바르지 않습니다.' });
    dropPending(pending.game_id); await refreshContext(); onCommitted?.(committed, pending); return committed;
  }

  async function runExtractForPending(pending) {
    pending.step = 'extract'; persistPending(pending);
    const extracted = await api.extract(withStructuredAction({ game_id: pending.game_id, action_id: pending.action_id }, pending));
    onExtract?.(extracted); pending.step = 'commit'; persistPending(pending);
    return runCommitForPending(pending);
  }

  async function runStoryForPending(pending) {
    pending.step = 'story'; persistPending(pending);
    let rawStory = '', sawMeta = false;
    onStory?.({ item: { event: 'start' }, pending, streaming: true });
    const response = await api.story(withStructuredAction({ game_id: pending.game_id, action_id: pending.action_id, expected_turn: pending.expected_turn, player_action: pending.player_action }, pending));
    await consumeStory(response, item => {
      if (item.event === 'meta') {
        sawMeta = true;
        // 서버가 같은 입력의 기존 액션을 재사용한 경우(reserve 반환 action_id가 다르면)
        // pending.action_id를 서버 값으로 교체해 이후 extract/commit이 정본 액션을 따른다.
        const serverActionId = item.data?.action_id;
        if (serverActionId && pending.action_id !== serverActionId) {
          pending.action_id = serverActionId;
          persistPending(pending);
        }
      }
      if (item.event === 'delta') {
        const text = item.data?.text ?? '';
        rawStory += text;
        onStory?.({ rawStory, text, item, pending, streaming: true });
      }
      if (item.event === 'complete') {
        const canonical = item.data?.parsed_blocks;
        onStory?.({ rawStory, parsed: canonical, item, pending, complete: true });
      }
    });
    if (!sawMeta || !rawStory.trim()) throw new ApiError({ endpoint: '/api/story', status: 502, code: 'incomplete_story_stream', message: '서사 스트림이 불완전합니다.', retryable: true });
    pending.step = 'extract'; persistPending(pending);
    return runExtractForPending(pending);
  }

  async function startNewAction(playerAction, structuredAction = null) {
    const action = String(playerAction ?? '').trim(); const context = getContext();
    if (!action || !context) return null;
    const pending = { game_id: gameId, action_id: createActionId(), expected_turn: committedTurn(context) + 1, player_action: action, structured_action: structuredAction, created_at: new Date().toISOString(), step: 'story' };
    persistPending(pending); return runStoryForPending(pending);
  }

  async function startReservedAction(reservation) {
    const action = String(reservation?.original_player_action ?? reservation?.player_action ?? '').trim();
    if (!action || !reservation?.action_id || !Number.isInteger(reservation?.expected_turn)) return null;
    const pending = {
      game_id: gameId,
      action_id: reservation.action_id,
      expected_turn: reservation.expected_turn,
      player_action: action,
      structured_action: reservation.structured_action ?? null,
      revision_request_id: reservation.revision_request_id ?? null,
      created_at: new Date().toISOString(),
      step: 'story'
    };
    persistPending(pending);
    return runStoryForPending(pending);
  }

  async function runRecovery(pending, step) {
    // wait_story: 스토리가 아직 시작되지 않은 좌초 액션 → 스토리 생성을 새로 시작한다
    if (step === 'wait_story') return runStoryForPending(pending);
    if (step === 'resume_story' || step === 'retry_story') return runStoryForPending(pending);
    if (step === 'resume_extract' || step === 'retry_extract') return runExtractForPending(pending);
    if (step === 'resume_commit' || step === 'retry_commit') return runCommitForPending(pending);
    if (step === 'complete') { clearPending(storage, pending.game_id); return refreshContext(); }
    return null;
  }

  return { startNewAction, startReservedAction, runStoryForPending, runExtractForPending, runCommitForPending, runRecovery };
}

export function createBusyGuard({ onChange = () => {} } = {}) {
  let active = false;
  return {
    get busy() { return active; },
    async run(operation) {
      if (active) return false;
      active = true; onChange(true);
      try { return await operation(); } finally { active = false; onChange(false); }
    }
  };
}

export function createFrontendApp({ documentRef = globalThis.document, storage = globalThis.localStorage, api = createApiClient(), locationSearch = globalThis.location?.search ?? '', confirmImpl = (...args) => globalThis.confirm?.(...args) ?? false } = {}) {
  if (!documentRef) return null;
  const get = id => documentRef.querySelector(`#${id}`);
  const elements = {
    title: get('game-title'), dayTime: get('day-time'), turn: get('turn-number'), api: get('api-status'), status: get('status-banner'), error: get('error-banner'),
    history: get('story-history'), current: get('current-story'), currentAction: get('current-action'), choices: get('choice-list'), input: get('player-action'), submit: get('submit-action'),
    recovery: get('recovery-action'), stream: get('stream-status'), scene: get('scene-state'), focal: get('focal-character'), mind: get('mind-monitor'), player: get('player-situation'),
    resume: get('resume-play'), historyButton: get('open-history'), feedback: get('send-feedback'), apps: get('open-apps'), reset: get('reset-game'), ttsToggle: get('tts-toggle')
  };
  const setupElements = {
    overlay: get('player-setup-overlay'), form: get('player-setup-form'), error: get('setup-error'), status: get('setup-status'), submit: get('setup-submit'),
    name: get('setup-name'), department: get('setup-department'), position: get('setup-position'), age: get('setup-age'), height: get('setup-height'), weight: get('setup-weight'),
    penisLength: get('setup-penis-length'), bodyType: get('setup-body-type'), speechStyle: get('setup-speech-style')
  };
  const gameId = resolveGameId(locationSearch);
  let context = null, viewModel = null, viewModelContext = null, streamedStoryChoices = [], busy = false, recoveryPending = false, progressTimer = null, mediaLoading = false, utilityUi = null, ttsController = null;
  // 세션 단위 Story 타임라인 — 페이지 로드 시 최신 1턴으로 시작하고, 같은 세션에서
  // 완료된 턴을 메모리에 누적한다. 새로고침하면 다시 최신 1턴만 표시한다.
  let sessionHistory = [];
  const showStatus = value => text(elements.status, value);
  const setConnection = ready => { text(elements.api, ready ? '●' : '○'); if (elements.api) { elements.api.title = ready ? '연결됨' : '연결 확인 중'; elements.api.ariaLabel = ready ? '연결됨' : '연결 확인 중'; } };
  const clearProgressTimer = () => { if (progressTimer) { clearInterval(progressTimer); progressTimer = null; } };
  const showProgress = value => { clearProgressTimer(); let elapsed = 0; text(elements.stream, value); progressTimer = setInterval(() => { elapsed += 1; text(elements.stream, `${value} ${elapsed}초`); }, 1000); };
  const showError = error => { text(elements.error, messageFor(error)); if (elements.error) elements.error.hidden = false; };
  const clearError = () => { if (elements.error) elements.error.hidden = true; text(elements.error, ''); };
  const clearCurrentTurn = () => { text(elements.currentAction, ''); if (elements.currentAction) elements.currentAction.hidden = true; elements.current?.replaceChildren?.(); if (elements.current) elements.current.textContent = ''; };
  const resetRawStory = () => { elements.current?.replaceChildren?.(); if (elements.current) { elements.current.textContent = ''; elements.current.classList?.add?.('raw-story-stream'); } };
  const appendRawStory = value => {
    if (!elements.current || !value) return;
    const nearBottom = typeof elements.current.scrollHeight === 'number'
      && elements.current.scrollHeight - elements.current.scrollTop - elements.current.clientHeight <= 120;
    elements.current.classList?.add?.('raw-story-stream');
    elements.current.textContent = `${elements.current.textContent ?? ''}${value}`;
    if (nearBottom) elements.current.scrollTop = elements.current.scrollHeight;
  };
  const showCurrentAction = value => { text(elements.currentAction, value); if (elements.currentAction) elements.currentAction.hidden = false; };
  function refreshViewModel() {
    viewModel = buildCompanyGameViewModel(context);
    viewModelContext = context;
  }
  function resumePlay() {
    const target = elements.current?.children?.length ? elements.current : elements.history;
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
  function renderToolbar() {
    const capabilities = toolbarCapabilities(viewModel, loadPending(storage, gameId), { context, busy, recoveryPending, utilityAvailable: utilityUi?.available ?? null });
    if (elements.resume) { elements.resume.disabled = !capabilities.canResume; elements.resume.onclick = capabilities.canResume ? resumePlay : null; }
    if (elements.historyButton) { elements.historyButton.disabled = !capabilities.canOpenHistory; elements.historyButton.onclick = capabilities.canOpenHistory ? () => utilityUi?.openHistory() : null; }
    if (elements.feedback) { elements.feedback.disabled = !capabilities.canSendFeedback; elements.feedback.onclick = capabilities.canSendFeedback ? () => utilityUi?.openFeedback() : null; }
    if (elements.apps) { elements.apps.disabled = !capabilities.canOpenApps; elements.apps.onclick = capabilities.canOpenApps ? () => csaApp.open('home') : null; }
  }
  function setupPending() { return !playerSetupCompleted(context); }
  function populateSetupSelect(select, list, idField) {
    if (!select) return;
    select.replaceChildren();
    for (const option of catalogOptions(list, idField)) {
      const optionEl = documentRef.createElement('option');
      optionEl.value = option.value; optionEl.textContent = option.label;
      select.append(optionEl);
    }
  }
  function populateSetupOptions() {
    populateSetupSelect(setupElements.department, CATALOGS.departments, 'department_id');
    populateSetupSelect(setupElements.position, CATALOGS.positions, 'position_id');
    populateSetupSelect(setupElements.bodyType, CATALOGS.bodyTypes, 'body_type_id');
    populateSetupSelect(setupElements.speechStyle, CATALOGS.speechStyles, 'speech_style_id');
  }
  const showSetupError = error => { text(setupElements.error, typeof error === 'string' ? error : messageFor(error)); if (setupElements.error) setupElements.error.hidden = false; };
  const clearSetupError = () => { if (setupElements.error) setupElements.error.hidden = true; text(setupElements.error, ''); };
  function readSetupFormValues() {
    return {
      name: setupElements.name?.value ?? '', department_id: setupElements.department?.value ?? '', position_id: setupElements.position?.value ?? '',
      age: Number(setupElements.age?.value), height_cm: Number(setupElements.height?.value), weight_kg: Number(setupElements.weight?.value), penis_length_cm: Number(setupElements.penisLength?.value),
      body_type_id: setupElements.bodyType?.value ?? '', speech_style_id: setupElements.speechStyle?.value ?? ''
    };
  }
  /** 맵 표시용 캐릭터 — 이름과 default_location_id만 필요하다. */
  function mapCharacters() {
    const directory = context?.display?.npc_directory ?? {};
    const defaults = context?.display?.npc_default_locations ?? {};
    const fromMaster = context?.master?.characters ?? {};
    const ids = new Set([...Object.keys(directory), ...Object.keys(defaults), ...Object.keys(fromMaster)]);
    const out = {};
    for (const id of ids) {
      const name = fromMaster[id]?.name ?? directory[id]?.name ?? null;
      if (!name) continue;
      out[id] = { name, default_location_id: fromMaster[id]?.default_location_id ?? defaults[id] ?? null };
    }
    return out;
  }

  /** 회사 맵 — 이미 받은 context.save만 읽는다. 추가 API 요청 0회. */
  function renderCompanyMapPanel() {
    // 테스트 하네스는 최소 document 스텁만 제공하므로 조회 자체를 방어한다.
    if (typeof document?.getElementById !== 'function') return;
    const container = document.getElementById('company-map');
    if (!container) return;
    const save = context?.save?.data ?? context?.save ?? {};
    const model = buildCompanyMapModel({
      save,
      characters: mapCharacters(),
      locations: context?.display?.map_locations ?? context?.master?.map?.locations ?? []
    });
    renderCompanyMap(container, model, {
      onFill: value => {
        const field = document.getElementById('player-action');
        if (!field) return;
        field.value = value;
        field.focus();
      }
    });
  }

  function render() {
    if (!viewModel || viewModelContext !== context) refreshViewModel();
    renderState(elements, viewModel, { title: context?.game?.title });
    const openingTurn = openingHistoryTurn(context);
    // 본문 timeline: 세션 단위 누적 기록(sessionHistory)을 표시한다.
    // 세션 기록이 비어 있으면(최초 로드 직후 등) API recent_turns를 사용하고,
    // 그것마저 비어 있으면 오프닝 턴으로 대체한다.
    const recent = sessionHistory.length ? sessionHistory : (context?.recent_turns ?? []);
    renderHistory(elements.history, recent.length ? recent : (openingTurn ? [openingTurn] : []));
    renderCompanyMapPanel();
    const setupOpen = setupPending();
    // 오버레이는 순수 설정 폼 전용. 저장된 설정(reserved)은 init에서 자동 진행되고
    // 재시도 팝업은 완전히 제거되었다(사용자 요구).
    if (setupElements.overlay) setupElements.overlay.hidden = !setupOpen;
    if (setupElements.form) setupElements.form.hidden = false;
    const pendingStep = loadPending(storage, gameId)?.step ?? null;
    const phase = computeTurnPhase({ busy, recoveryPending, pendingStep, mediaLoading });
    const flags = turnPhaseUiFlags(phase);
    if (elements.input) elements.input.disabled = !flags.inputEditable || setupOpen;
    if (elements.submit) elements.submit.disabled = flags.inputSubmitDisabled || setupOpen;
    renderChoices(elements.choices, choicesForRenderer(viewModel, streamedStoryChoices), { busy: flags.choicesDisabled || setupOpen, onChoose: startNewAction });
    renderToolbar();
    // 초기 로드 시 최근 턴(current)이 보이도록 1회 스크롤 — 오프닝부터 쭉 내려야 하는 낭비 제거.
    // 이후 렌더링(턴 갱신)에서는 사용자 스크롤 위치를 침범하지 않는다.
  }
  // Commit delta 일시 표시 타이머 (2~3초 후 클리어).
  let committedStatDeltaTimer = null;
  const setBusy = value => { busy = value; render(); };
  const setMediaLoading = value => { mediaLoading = value; render(); };
  function clearRecoveryUi() {
    recoveryPending = false;
    if (elements.recovery) { elements.recovery.hidden = true; elements.recovery.textContent = ''; elements.recovery.onclick = null; }
    render();
  }
  const busyGuard = createBusyGuard({ onChange: setBusy });
  async function refreshContext({ preserveStreamedChoices = false } = {}) {
    showStatus('현재 상태를 불러오는 중…'); setConnection(false);
    const data = await api.context({ game_id: gameId, recent_turns: FRONTEND_CONFIG.recentTurns });
    if (!validateContext(data.context)) throw new ApiError({ endpoint: '/api/context', status: 502, code: 'invalid_context', message: '게임 데이터 계약이 올바르지 않습니다.' });
    context = data.context;
    if (!preserveStreamedChoices) streamedStoryChoices = [];
    // 세션 타임라인 누적 — refresh가 recent_turns(최신 1턴)로 세션 기록을 덮어쓰지 않는다.
    // 같은 turn_number는 교체(피드백 revision이 해당 카드를 갱신), 새 턴만 추가, 중복 금지.
    sessionHistory = mergeSessionTurns(sessionHistory, context?.recent_turns ?? []);
    refreshViewModel(); render();
    if (!loadPending(storage, gameId)) clearRecoveryUi();
    setConnection(true); showStatus('준비되었습니다.'); return context;
  }
  const coordinator = createTurnCoordinator({
    api, storage, gameId, getContext: () => context, refreshContext,
    onStory: ({ item, text: deltaText, parsed }) => {
      if (item?.event === 'start') { resetRawStory(); return; }
      if (item?.event === 'delta') { appendRawStory(deltaText); return; }
      if (item?.event === 'complete') {
        const choices = hasFourChoices(item.data?.choices) ? item.data.choices : parsed?.choices;
        if (parsed?.blocks) renderNarrative(elements.current, choices ? { ...parsed, choices } : parsed);
        if (hasFourChoices(choices)) { streamedStoryChoices = choices; render(); }
      }
    },
    onExtract: () => {
      // Extract 응답의 canonical parsed_blocks(서버가 최종 사용한 태거/파서 결과)로
      // 현재 턴 대사 카드를 교체한다 — Story SSE(parser_canonical)보다 정확한 화자 표시.
      showProgress('상태를 정리하는 중…');
    },
    onCommitStart: () => { showProgress('결과를 반영하는 중…'); },
    onCommitted: (committed, pending) => {
      // Commit이 확정된 경우에만 실제 turn_changes 기반 delta를 잠시 표시한다.
      // replayed Commit(피드백 재생)은 변화 애니메이션을 반복하지 않는다.
      // Extract가 제안했지만 Commit에서 거부된 delta는 turn_changes에 없으므로 표시되지 않는다.
      if (committed?.commit?.success === true && committed?.commit?.replayed !== true && !committed?.terminated) {
        const deltas = statDeltasFromTurnChanges(committed.turn_changes);
        if (Object.keys(deltas).length) {
          setCommittedStatDeltas(deltas);
          render();
          clearTimeout(committedStatDeltaTimer);
          committedStatDeltaTimer = setTimeout(() => {
            setCommittedStatDeltas({});
            render();
          }, 2500);
        }
      }
      // Commit 화면 인계 — refreshContext가 방금 커밋한 턴을 정본(recent_turns + action_id 일치)으로
      // 반영했을 때만 current-story를 비운다. 확인이 안 되면 실시간 Story를 그대로 유지하고
      // 오류로 턴을 막지 않는다 (terminated/failed/refresh 실패에서는 절대 지우지 않는다).
      const turnNumber = committed?.commit?.turn_number ?? null;
      const canonicalTurn = Number.isInteger(turnNumber)
        ? (context?.recent_turns ?? []).find(turn => turn.turn_number === turnNumber && turn.action_id === pending.action_id)
        : null;
      if (canonicalTurn) {
        showStatus('턴이 완료되었습니다.');
      } else {
        showStatus('저장된 기록을 다시 확인하는 중…');
      }
      clearRecoveryUi();
      utilityUi?.loadMedia().catch(showError);
      ttsController?.onCommittedTurn?.();
    },
    onPendingChange: () => renderToolbar(),
    onTerminated: clearError
  });
  // 저장 파이프라인 핫픽스 — 새 행동 시작 전에 pending을 정리한다.
  // 실제 in-flight(story_streaming/extracting/committing/ready)만 자동 재개하고,
  // 이미 종료된 stale pending(committed / commit_failed+expected_turn_conflict /
  // recoverable_step complete / action_not_found / expected_turn이 지난 경우)은
  // 즉시 삭제해 같은 클릭에서 새 행동을 진행한다.
  async function settlePendingBeforeNewAction(pending) {
    let data = null;
    try {
      data = await api.actionStatus({ game_id: gameId, action_id: pending.action_id });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'action_not_found') {
        clearPending(storage, gameId); clearRecoveryUi(); return 'cleaned';
      }
      showError(error); return 'error';
    }
    const status = data?.processing_status ?? null;
    const step = recoveryFor(data);
    // 이어받기 대상은 실제 서버 in-flight(story_streaming/extracting/committing)뿐이다.
    // committed/failed/ready는 deriveRecoverableStep이 complete를 주므로 전부 stale —
    // pending을 비우고 같은 클릭에서 새 행동을 진행한다.
    const inFlight = status === 'story_streaming' || status === 'extracting' || status === 'committing';
    const stale = status == null
      || !inFlight
      || pending.expected_turn <= committedTurn(context)
      || step === 'complete';
    if (stale) {
      clearPending(storage, gameId); clearRecoveryUi(); return 'cleaned';
    }
    recoveryPending = true;
    try {
      await resumePending(pending, step);
      return 'resumed';
    } catch (error) {
      showError(error); return 'error';
    } finally {
      recoveryPending = false;
    }
  }
  async function checkRecovery() {
    const pending = loadPending(storage, gameId);
    if (!pending) { clearRecoveryUi(); return; }
    try {
      const data = await api.actionStatus({ game_id: gameId, action_id: pending.action_id }); const step = recoveryFor(data);
      if (step === 'complete') { await coordinator.runRecovery(pending, step); clearRecoveryUi(); return; }
      // 사용자 요구: 복구 버튼 없이 자동으로 이어서 실행
      recoveryPending = true;
      if (elements.recovery) { elements.recovery.hidden = true; elements.recovery.textContent = ''; elements.recovery.onclick = null; }
      await resumePending(pending, step);
      recoveryPending = false;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'action_not_found') {
        recoveryPending = true;
        if (elements.recovery) { elements.recovery.hidden = true; elements.recovery.textContent = ''; elements.recovery.onclick = null; }
        await resumePending(pending, 'retry_story');
        recoveryPending = false;
        return;
      }
      showError(error);
      recoveryPending = false;
      if (elements.recovery) { elements.recovery.hidden = true; elements.recovery.textContent = ''; elements.recovery.onclick = null; }
    }
  }
  async function withBusy(operation) {
    if (busy) return false;
    clearError();
    return busyGuard.run(async () => {
      try { await operation(); return true; }
      catch (error) { showError(error); return false; } // 중첩 복구 없음 — 실패는 호출부가 pending 정리·입력 복원
      finally { clearProgressTimer(); text(elements.stream, ''); }
    });
  }
  async function startNewAction(playerAction, structuredAction = null) {
    let action = String(playerAction ?? elements.input?.value ?? '').trim(); if (!action || busy || !context || setupPending()) return false;
    // 저장 파이프라인 핫픽스 — 이미 종료된 과거 액션(stale pending)은 자동 정리하고
    // 실제 in-flight 상태만 자동 재개한다. 정리된 경우 같은 클릭에서 새 행동을 계속 진행한다.
    const pending = loadPending(storage, gameId);
    if (pending) {
      const outcome = await settlePendingBeforeNewAction(pending);
      if (outcome === 'resumed') return true;   // in-flight 재개 중 — 새 행동은 재개 완료 후
      if (outcome === 'error') return false;    // actionStatus 실패 — 오류 배너가 표시됨
      // 'cleaned' — stale pending 제거됨. 아래에서 새 행동을 계속 진행한다.
    }
    const numbered = resolveNumberedChoiceInput(action, saveFromContext(context));
    if (numbered?.ok) action = numbered.text;
    return withBusy(async () => {
      showCurrentAction(action);
      text(elements.stream, 'Story를 생성하는 중…');
      try {
        await coordinator.startNewAction(action, structuredAction);
        // 정상 commit 확인 — 입력창과 선택 상태를 초기화한다.
        // 실패·미확정·재시도 상태에서는 사용자 입력을 지우지 않는다 (실패 시 catch가 복원).
        if (elements.input) elements.input.value = '';
        streamedStoryChoices = [];
        render();
      } catch (error) {
        // Story 생성 실패 등 — pending을 비우고 원래 행동을 입력창에 복원한다.
        // failed 상태가 새 턴 입력을 막지 않게 한다 (하드락 전면 제거).
        clearPending(storage, gameId);
        if (elements.input) elements.input.value = action;
        throw error;
      }
    });
  }
  async function startFeedbackRevision(reservation) {
    if (busy || loadPending(storage, gameId)) return false;
    return withBusy(async () => {
      showCurrentAction(reservation.original_player_action);
      text(elements.stream, '피드백을 반영해 Story를 다시 생성하는 중…');
      await coordinator.startReservedAction(reservation);
    });
  }
  async function resumePending(pending, step) {
    return withBusy(async () => {
      // wait_story/unknown을 checkRecovery()로 되돌리면 무한 재귀 — coordinator가 직접 처리한다
      if (step === 'wait_story' || step === 'unknown') { await coordinator.runRecovery(pending, step); return; }
      if (step === 'retry_story') { showCurrentAction(pending.player_action); text(elements.stream, 'Story를 다시 시도하는 중…'); }
      await coordinator.runRecovery(pending, step);
    });
  }
  async function handleSetupSubmit(event) {
    event?.preventDefault?.();
    if (busy) return false;
    return busyGuard.run(async () => {
      clearSetupError();
      const validation = validateSetupValues(readSetupFormValues(), CATALOGS);
      if (!validation.valid) { showSetupError('입력값을 확인해 주세요.'); return false; }
      if (setupElements.submit) setupElements.submit.disabled = true;
      try {
        text(setupElements.status, '설정 저장 중…');
        const saveResult = await api.playerSetup({ game_id: gameId, player: validation.player });
        // 설정 저장 성공 → 팝업 즉시 닫기. 서사 출력 시작과 동시에 창이 닫히도록
        // 스트리밍 완료를 기다리지 않는다 (사용자 요구).
        if (setupElements.overlay) setupElements.overlay.hidden = true;
        await streamOpening(saveResult.setup_id, setupElements.status);
        return true;
      } catch (error) {
        await refreshContext().catch(() => undefined);
        showSetupError(error);
        text(setupElements.status, '');
        return false;
      } finally {
        if (setupElements.submit) setupElements.submit.disabled = false;
      }
    });
  }
  async function streamOpening(setupId, statusElement = setupElements.reservedStatus) {
    text(statusElement, '오프닝을 준비하는 중…');
    const response = await api.opening({ game_id: gameId, setup_id: setupId });
    let raw = '';
    resetRawStory();
    await consumeStorySse(response, item => {
      if (item.event === 'delta') {
        const text = item.data?.text ?? '';
        raw += text;
        appendRawStory(text);
      }
      if (item.event === 'complete') {
        const choices = hasFourChoices(item.data?.choices)
          ? item.data.choices
          : item.data?.parsed_blocks?.choices;
        if (item.data?.parsed_blocks?.blocks) {
          renderNarrative(elements.current, choices
            ? { ...item.data.parsed_blocks, choices }
            : item.data.parsed_blocks);
        }
        if (hasFourChoices(choices)) {
          streamedStoryChoices = choices;
          render();
        }
      }
    });
    text(statusElement, '');
    await refreshContext({ preserveStreamedChoices: true });
  }
  async function retryOpening(setupId) {
    if (busy || !setupId) return false;
    return busyGuard.run(async () => {
      clearSetupError();
      try {
        await streamOpening(setupId);
        return true;
      } catch (error) {
        showSetupError(error);
        render();
        return false;
      } finally {
      }
    });
  }
  async function handleReset() {
    if (busy) return false;
    if (!confirmImpl('정말로 초기화하시겠습니까? 진행 상황이 모두 사라집니다.')) return false;
    return withBusy(async () => {
      await api.reset({ game_id: gameId });
      clearPending(storage, gameId);
      clearCurrentTurn();
      if (setupElements.form) for (const field of [setupElements.name, setupElements.height, setupElements.weight, setupElements.penisLength]) if (field) field.value = '';
      clearSetupError(); text(setupElements.status, '');
      await refreshContext();
    });
  }
  const csaApp = createCsaApp({
    documentRef, api, gameId,
    onSubmit: (displayInput, canonicalAction) => {
      const handoff = startNewAction(displayInput, canonicalAction);
      Promise.resolve(handoff).then(result => {
        if (result === false) showStatus('상식개변 적용 행동을 시작하지 못했습니다. 복구 상태를 확인해 주세요.');
      }).catch(showError);
      return true;
    },
    onError: showError
  });
  utilityUi = createUtilityUi({
    documentRef,
    api,
    gameId,
    getContext: () => context,
    getViewModel: () => viewModel,
    onFeedbackReserved: startFeedbackRevision,
    onError: showError,
    onStatus: showStatus,
    onMediaLoading: setMediaLoading
  });
  ttsController = createCompanyTts({
    api, documentRef, gameId,
    getViewModel: () => viewModel,
    getSelectedMindCharacterId: () => elements.mind?.dataset?.selectedCharacterId ?? '',
    getCommittedTurnIdentity: () => `${viewModel?.turn?.turn_id ?? ''}:${viewModel?.turn?.action_id ?? ''}`,
    getTtsEnabled: () => elements.ttsToggle?.getAttribute?.('aria-pressed') !== 'false'
  });
  elements.ttsToggle?.addEventListener('click', () => {
    const enabled = elements.ttsToggle.getAttribute?.('aria-pressed') !== 'false';
    elements.ttsToggle.setAttribute?.('aria-pressed', String(!enabled));
    ttsController?.setEnabled?.(!enabled);
  });
  async function init() {
    populateSetupOptions();
    elements.submit?.addEventListener('click', () => startNewAction());
    elements.reset?.addEventListener('click', () => handleReset());
    setupElements.form?.addEventListener('submit', event => handleSetupSubmit(event));
    await refreshContext();
    // checkRecovery는 페이지 시작을 막지 않는다 — pending은 reconnect hint일 뿐이며,
    // 새 턴 입력을 가로막지 않도록 백그라운드로 이어받기를 진행한다.
    checkRecovery().catch(() => undefined);
    // 저장된 설정이 있으면 오프닝을 자동으로 재시도 — 사용자가 버튼을 눌러야만
    // 시작할 수 있는 막힌 화면(모바일에서 화면을 가리는)을 제거한다.
    const reservedSetupId = reservedPlayerSetupId(context);
    if (reservedSetupId) await retryOpening(reservedSetupId);
  }
  return { gameId, init, refreshContext, startNewAction, startFeedbackRevision, checkRecovery, resumePending, resumePlay, retryOpening, csaApp, utilityUi, get context() { return context; }, get viewModel() { return viewModel; }, get capabilities() { return toolbarCapabilities(viewModel, loadPending(storage, gameId), { context, busy, recoveryPending, utilityAvailable: utilityUi?.available ?? null }); }, get busy() { return busy; } };
}

if (globalThis.document?.querySelector('#game-main')) {
  const app = createFrontendApp(); app.init().catch(error => { const target = document.querySelector('#error-banner'); if (target) { target.hidden = false; target.textContent = messageFor(error); } });
}

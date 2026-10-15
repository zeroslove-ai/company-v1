import { createCompanyTts, committedDialogueForVoice, parseCommittedDialogue } from './tts.js';

const state = {
  gameId: '',
  content: null,
  snapshot: null,
  pendingCommand: null,
  activeJobId: '',
  isBusy: false,
  historyBefore: 2147483647,
  historyTurns: [],
  mediaPaused: false,
  mediaFallback: false,
  mediaSource: '',
  mediaKind: 'none',
  providerMode: '',
  voiceHealth: null,
  csaTier: 'weak'
};

const byId = id => document.getElementById(id);
const els = {
  providerBadge: byId('provider-badge'),
  welcome: byId('welcome-card'),
  welcomeImage: byId('welcome-image'),
  playSurface: byId('play-surface'),
  sceneTitle: byId('scene-title'),
  sceneSubtitle: byId('scene-subtitle'),
  turnCount: byId('turn-count'),
  sceneTime: byId('scene-time'),
  gameNotice: byId('game-notice'),
  storyContent: byId('story-content'),
  pendingStory: byId('pending-story'),
  pendingStage: byId('pending-stage'),
  storyPreview: byId('story-preview'),
  fullChoices: byId('full-choices'),
  choiceButtons: byId('choice-buttons'),
  actionForm: byId('action-form'),
  actionInput: byId('action-input'),
  actionCounter: byId('action-counter'),
  sendAction: byId('send-action'),
  retryRow: byId('retry-row'),
  retryMessage: byId('retry-message'),
  retryButton: byId('retry-command'),
  currentLocation: byId('current-location'),
  locationFloor: byId('location-floor'),
  locationSelect: byId('location-select'),
  locationDescription: byId('location-description'),
  mapMarker: byId('map-marker'),
  presentPeople: byId('present-people'),
  peopleCount: byId('people-count'),
  peopleDirectory: byId('people-directory'),
  mediaCard: byId('media-card'),
  mediaImage: byId('media-image'),
  mediaStatus: byId('media-status'),
  mediaFallback: byId('media-fallback'),
  mediaControls: byId('media-controls'),
  mindCard: byId('mind-card'),
  mindMonitor: byId('mind-monitor'),
  voiceCard: byId('voice-card'),
  voiceToggle: byId('tts-toggle'),
  voiceReplay: byId('tts-replay'),
  voiceStatus: byId('tts-status'),
  audioPlayer: byId('audio-player'),
  setupDialog: byId('setup-dialog'),
  setupForm: byId('setup-form'),
  setupError: byId('setup-error'),
  setupName: byId('setup-name'),
  setupAge: byId('setup-age'),
  setupDepartment: byId('setup-department'),
  setupPosition: byId('setup-position'),
  csaDialog: byId('csa-dialog'),
  csaActiveRules: byId('csa-active-rules'),
  csaActiveCount: byId('csa-active-count'),
  csaCatalogList: byId('csa-catalog-list'),
  csaChangeEditor: byId('csa-change-editor'),
  activeRuleSummary: byId('active-rule-summary'),
  openCsa: byId('open-csa'),
  historyDialog: byId('history-dialog'),
  historyList: byId('history-list'),
  historyMore: byId('history-more'),
  feedbackDialog: byId('feedback-dialog'),
  feedbackForm: byId('feedback-form'),
  feedbackInput: byId('feedback-input'),
  feedbackError: byId('feedback-error')
};

function option(label, value) {
  const node = document.createElement('option');
  node.value = value;
  node.textContent = label;
  return node;
}

const ttsUi = createCompanyTts({
  api: {
    tts: payload => api('/api/games/' + encodeURIComponent(state.gameId) + '/tts', { method: 'POST', body: JSON.stringify(payload) })
  },
  getView: () => {
    const turn = state.snapshot?.latest_turn;
    const scene = state.snapshot?.state?.scene;
    if (!turn || !scene) return null;
    return {
      turn,
      identity: [state.gameId, turn.turn_number, turn.turn_revision].join(':'),
      dialogueLines: committedDialogueFor(turn),
      presentActorIds: scene.present_actor_ids ?? [],
      focalActorId: scene.focal_actor_id ?? ''
    };
  }
});

function committedDialogueFor(turn) {
  return committedDialogueForVoice(turn, state.content?.actors ?? [], state.snapshot?.state?.scene?.present_actor_ids ?? []);
}

function showNotice(message, kind = '') {
  els.gameNotice.textContent = message;
  els.gameNotice.className = 'notice' + (kind ? ' notice-' + kind : '');
  els.gameNotice.hidden = false;
}

function hideNotice() {
  els.gameNotice.hidden = true;
  els.gameNotice.textContent = '';
}

function setBusy(busy) {
  state.isBusy = busy;
  els.sendAction.disabled = busy;
  byId('start-opening').disabled = busy;
  els.actionInput.disabled = busy;
  els.choiceButtons.querySelectorAll('button').forEach(button => { button.disabled = busy; });
  byId('open-history').disabled = busy || !state.gameId;
  byId('open-feedback').disabled = busy || !state.snapshot?.latest_turn;
  byId('new-game').disabled = busy;
  els.openCsa.disabled = busy || !state.snapshot?.profile;
  els.csaDialog.querySelectorAll('button, select').forEach(control => { control.disabled = busy; });
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderStory(text) {
  clearChildren(els.storyContent);
  const paragraphs = String(text ?? '').split(/\n{2,}/).map(value => value.trim()).filter(Boolean);
  if (!paragraphs.length) {
    const empty = document.createElement('p');
    empty.className = 'story-placeholder';
    empty.textContent = '첫 장면을 준비하고 있습니다.';
    els.storyContent.append(empty);
    return;
  }
  for (const paragraph of paragraphs) {
    const node = document.createElement('p');
    node.textContent = paragraph;
    els.storyContent.append(node);
  }
}

function compactChoiceLabel(literal) {
  const rules = [
    [/앱.{0,12}열|열어.{0,8}앱/u, '앱 열기'],
    [/사과/u, '사과하기'],
    [/거절/u, '거절하기'],
    [/도와|도움|건네|챙겨/u, '도와주기'],
    [/농담|장난/u, '농담하기'],
    [/생각.{0,12}묻|의견.{0,8}물|질문/u, '생각 묻기'],
    [/다가가|가까이/u, '다가가기'],
    [/말을?\s*건|이야기.{0,8}나누/u, '말 걸기'],
    [/기다리/u, '기다리기'],
    [/(?:주변|현재 장소|장면).{0,20}(?:지켜|살펴|둘러|관찰)|둘러보/u, '둘러보기'],
    [/지켜보|관찰/u, '지켜보기'],
    [/남아|머물/u, '머물기'],
    [/떠나|이동|향하/u, '이동하기'],
    [/연락|전화|메시지/u, '연락하기'],
    [/함께/u, '함께하기']
  ];
  return rules.find(([pattern]) => pattern.test(literal))?.[1] ?? '선택하기';
}

function renderChoices(choices) {
  clearChildren(els.fullChoices);
  clearChildren(els.choiceButtons);
  const compactLabels = choices.map(compactChoiceLabel);
  const duplicateCounts = new Map();
  compactLabels.forEach(label => duplicateCounts.set(label, (duplicateCounts.get(label) ?? 0) + 1));
  (choices ?? []).forEach((literal, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    const text = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    text.textContent = literal;
    item.append(number, text);
    els.fullChoices.append(item);

    const button = document.createElement('button');
    button.type = 'button';
    const target = literal.match(/([\p{Script=Hangul}]{2,5})(?:에게|한테)/u)?.[1] ?? '';
    const baseLabel = compactLabels[index];
    button.textContent = duplicateCounts.get(baseLabel) > 1 && target ? target + ' ' + baseLabel : baseLabel;
    button.title = literal;
    button.setAttribute('aria-label', '선택: ' + literal);
    button.addEventListener('click', () => submitCommand('FREE_ACTION', literal));
    els.choiceButtons.append(button);
  });
}

function actorById(actorId) {
  return state.content?.actors.find(actor => actor.actor_id === actorId) ?? null;
}

function renderPeople() {
  const ids = state.snapshot?.state?.scene?.present_actor_ids ?? [];
  clearChildren(els.presentPeople);
  els.peopleCount.textContent = String(ids.length);
  if (!ids.length) {
    const empty = document.createElement('p');
    empty.className = 'muted-note';
    empty.textContent = '현재 장면에 확인된 인물이 없습니다.';
    els.presentPeople.append(empty);
    return;
  }
  ids.forEach(id => {
    const actor = actorById(id);
    if (!actor) return;
    const row = document.createElement('div');
    row.className = 'person-row';
    const avatar = document.createElement('span');
    avatar.className = 'person-avatar';
    if (actor.portrait?.asset_url) {
      const image = document.createElement('img');
      image.src = actor.portrait.asset_url;
      image.alt = actor.name + ' 원본 초상화';
      image.addEventListener('error', () => { avatar.replaceChildren(document.createTextNode(Array.from(actor.name)[0] ?? '?')); }, { once: true });
      avatar.append(image);
    } else avatar.textContent = Array.from(actor.name)[0] ?? '?';
    const info = document.createElement('span');
    const name = document.createElement('strong');
    const role = document.createElement('small');
    name.textContent = actor.name;
    role.textContent = actor.position || actor.role_title || '';
    info.append(name, role);
    row.append(avatar, info);
    els.presentPeople.append(row);
  });
}

function renderLocation() {
  const scene = state.snapshot?.state?.scene;
  const current = state.content?.locations.find(item => item.location_id === scene?.location_id);
  if (!current) {
    els.currentLocation.textContent = '아직 시작 전';
    els.locationFloor.textContent = '층 정보';
    els.mapMarker.style.left = '35%';
    els.mapMarker.style.top = '40%';
    return;
  }
  els.currentLocation.textContent = current.name;
  els.locationFloor.textContent = current.floor || current.zone || '';
  const index = state.content.locations.indexOf(current);
  els.mapMarker.style.left = (16 + (index % 5) * 13) + '%';
  els.mapMarker.style.top = (25 + (Math.floor(index / 5) % 3) * 20) + '%';
}

function renderDirectory() {
  clearChildren(els.peopleDirectory);
  for (const actor of state.content.actors) {
    const row = document.createElement('div');
    row.className = 'directory-person';
    const portrait = document.createElement('span');
    portrait.className = 'directory-portrait';
    if (actor.portrait?.asset_url) {
      const image = document.createElement('img');
      image.src = actor.portrait.asset_url;
      image.alt = actor.name + ' 원작 이미지';
      image.addEventListener('error', () => {
        portrait.replaceChildren();
        portrait.textContent = Array.from(actor.name)[0] ?? '?';
      }, { once: true });
      portrait.append(image);
    } else {
      portrait.textContent = Array.from(actor.name)[0] ?? '?';
      portrait.title = actor.portrait?.image_id
        ? '원본 이미지 참조: ' + actor.portrait.image_id
        : '이미지 카탈로그에 연결된 초상화 없음';
    }
    const details = document.createElement('span');
    details.className = 'directory-details';
    const name = document.createElement('strong');
    const role = document.createElement('small');
    const identity = document.createElement('span');
    name.textContent = actor.name + ' · ' + actor.age;
    role.textContent = [actor.department, actor.position || actor.role_title].filter(Boolean).join(' · ');
    identity.textContent = actor.prompt_card?.appearance ?? actor.profile_card?.appearance ?? '';
    details.append(name, role, identity);
    row.append(portrait, details);
    els.peopleDirectory.append(row);
  }
}

function formatTime(minutes = 540) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

function showMediaFallback(message) {
  els.mediaImage.hidden = true;
  els.mediaImage.removeAttribute('src');
  els.mediaFallback.textContent = message;
  els.mediaFallback.hidden = false;
}

function renderMedia(turn) {
  const scene = state.snapshot?.state?.scene;
  const hint = turn?.observer_applied?.mediaHint ?? { kind: 'none' };
  state.mediaSource = '';
  state.mediaKind = 'none';
  state.mediaPaused = false;
  state.mediaFallback = false;
  els.mediaControls.hidden = true;
  els.mediaFallback.hidden = true;
  els.mediaImage.hidden = true;
  els.mediaImage.removeAttribute('src');
  if (!turn || !scene) { els.mediaCard.hidden = true; return; }

  if (hint.kind === 'company_notice' && state.providerMode === 'scripted-preview') {
    state.mediaKind = 'gif-demo';
    state.mediaSource = '/assets/company-notice-demo.gif?turn=' + String(turn.turn_number) + '-' + String(turn.turn_revision);
    els.mediaControls.hidden = false;
    els.mediaImage.alt = '일반 사내 알림을 위한 중립 UI 기술 fixture';
    els.mediaImage.hidden = false;
    els.mediaImage.onerror = () => {
      if (state.mediaKind !== 'gif-demo') return;
      state.mediaFallback = true;
      els.mediaImage.src = '/assets/company-notice-demo.png';
      els.mediaStatus.textContent = 'GIF 로딩에 실패해 기술 fixture의 정지 포스터를 표시합니다.';
    };
    els.mediaImage.src = state.mediaSource;
    els.mediaStatus.textContent = '스크립트 구조 검증용 알림 fixture입니다. 원작 캐릭터 아트가 아닙니다.';
    els.mediaCard.hidden = false;
    return;
  }

  const present = new Set(scene.present_actor_ids ?? []);
  const story = String(turn.story_text ?? '');
  const dialogue = parseCommittedDialogue(story, state.content.actors);
  const counts = new Map();
  dialogue.filter(line => present.has(line.speaker_id)).forEach(line => counts.set(line.speaker_id, (counts.get(line.speaker_id) ?? 0) + 1));
  const speakingId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const hintedId = hint.kind === 'asset' && present.has(hint.actor_id) ? hint.actor_id : '';
  const solePresentHeroine = [...present].filter(id => actorById(id)?.kind === 'heroine');
  const imageActorId = hintedId || speakingId || (solePresentHeroine.length === 1 ? solePresentHeroine[0] : '');
  if (!imageActorId) { els.mediaCard.hidden = true; return; }

  const actor = actorById(imageActorId);
  const selected = hint.kind === 'asset' && hintedId
    ? state.content.media_catalog.find(item => item.image_id === hint.image_id && item.active && item.character_id === imageActorId)
    : state.content.media_catalog.find(item => item.image_id === imageActorId + '-main' && item.active);
  if (!selected) { els.mediaCard.hidden = true; return; }
  state.mediaKind = 'asset';
  els.mediaControls.hidden = true;
  els.mediaImage.alt = actor?.name ? actor.name + (hint.kind === 'asset' ? ' 장면 원본 이미지' : ' 원본 초상화') : 'Company 원본 이미지';
  if (!selected.asset_url) {
    showMediaFallback('이 장면의 원본 이미지를 불러올 수 없습니다.');
  } else {
    els.mediaImage.hidden = false;
    els.mediaImage.onerror = () => showMediaFallback('이 장면의 원본 이미지를 표시할 수 없습니다.');
    els.mediaImage.src = selected.asset_url;
  }
  els.mediaStatus.textContent = hint.kind === 'asset'
    ? [actor?.name, selected.situation].filter(Boolean).join(' · ')
    : [actor?.name, '현재 장면 인물'].filter(Boolean).join(' · ');
  els.mediaCard.hidden = false;
}

function renderMindMonitor(turn) {
  els.mindMonitor.replaceChildren();
  const entries = Object.entries(turn?.observer_applied?.mindMonitor ?? {});
  let rendered = 0;
  for (const [actorId, perspective] of entries) {
    const actor = actorById(actorId);
    if (!actor || !perspective || typeof perspective.surface !== 'string') continue;
    const item = document.createElement('article');
    item.className = 'mind-entry';
    const name = document.createElement('strong');
    const surface = document.createElement('p');
    name.textContent = actor.name;
    surface.textContent = perspective.surface;
    item.append(name, surface);
    if (typeof perspective.subconscious === 'string' && perspective.subconscious.trim()) {
      const subconscious = document.createElement('p');
      subconscious.className = 'mind-subconscious';
      subconscious.textContent = perspective.subconscious;
      item.append(subconscious);
    }
    els.mindMonitor.append(item);
    rendered += 1;
  }
  els.mindCard.hidden = rendered === 0;
}

function updateVoiceControls() {
  const hasTurn = Boolean(state.snapshot?.latest_turn);
  const mappings = state.voiceHealth?.mappingsLoaded === true && state.content?.actors.some(actor => actor.voice_available);
  const ready = mappings && state.voiceHealth?.synthesisConfigured === true;
  if (!ready && ttsUi.state.enabled) ttsUi.setEnabled(false);
  const hasDialogue = hasTurn && committedDialogueFor(state.snapshot.latest_turn).length > 0;
  els.voiceToggle.disabled = !hasTurn || !ready || !hasDialogue;
  els.voiceReplay.disabled = !hasTurn || !ready || !hasDialogue;
  els.voiceToggle.textContent = ttsUi.state.enabled ? '자동 재생 끄기' : '자동 재생 켜기';
  els.voiceToggle.setAttribute('aria-pressed', ttsUi.state.enabled ? 'true' : 'false');
  els.audioPlayer.hidden = !ready;
  if (!mappings) els.voiceStatus.textContent = '캐릭터 음성을 연결할 수 없습니다.';
  else if (!ready) els.voiceStatus.textContent = '이 실행에서는 대사 음성을 재생할 수 없습니다.';
  else if (!hasTurn) els.voiceStatus.textContent = '확정된 캐릭터 대사가 있을 때 선택해 재생할 수 있습니다. 자동 재생은 기본 꺼짐입니다.';
  else if (!hasDialogue) els.voiceStatus.textContent = '이 장면에서 재생할 수 있는 캐릭터 대사가 없습니다.';
  else if (!ttsUi.state.enabled) els.voiceStatus.textContent = '자동 재생 꺼짐 · 원작 인물 대사는 선택 재생할 수 있습니다.';
}

function renderSnapshot() {
  if (!state.snapshot) return;
  const snapshot = state.snapshot;
  const hasTurn = Boolean(snapshot.latest_turn);
  const setupNeeded = !snapshot.profile || snapshot.status === 'setup_needed';
  renderCsa();
  els.welcome.hidden = true;
  els.playSurface.hidden = setupNeeded;
  els.sceneTitle.textContent = snapshot.profile
    ? (state.content.edition?.title ?? '상식개변: 회사편') + ' · ' + snapshot.profile.name
    : '새로운 이야기를 시작합니다';
  els.sceneSubtitle.textContent = snapshot.profile
    ? [state.content.company?.name, snapshot.profile.department, snapshot.profile.position].filter(Boolean).join(' · ')
    : '원작 인물과 세계관을 이어가는 성인 서사';
  els.turnCount.textContent = hasTurn ? 'TURN ' + snapshot.latest_turn.turn_number : '시작 전';
  els.sceneTime.textContent = formatTime(snapshot.state?.time?.minutes);
  renderLocation();
  renderPeople();
  if (hasTurn) {
    byId('start-opening').hidden = true;
    els.actionForm.hidden = false;
    renderStory(snapshot.latest_turn.narrative_body);
    renderChoices(snapshot.latest_turn.choices ?? []);
    byId('revision-label').textContent = snapshot.latest_turn.provider_model?.story === 'scripted-preview'
      ? '구조 검증용 스크립트 결과 · v' + snapshot.latest_turn.turn_revision
      : '확정 장면 · v' + snapshot.latest_turn.turn_revision;
    renderMedia(snapshot.latest_turn);
    renderMindMonitor(snapshot.latest_turn);
    updateVoiceControls();
    ttsUi.onCommittedTurn();
  } else {
    byId('start-opening').hidden = !snapshot.profile || Boolean(state.activeJobId);
    els.actionForm.hidden = true;
    renderStory('');
    renderChoices([]);
    renderMedia(null);
    renderMindMonitor(null);
    updateVoiceControls();
  }
  byId('open-feedback').disabled = !hasTurn || state.isBusy;
  byId('open-history').disabled = !state.gameId || state.isBusy;
  if (setupNeeded && !els.setupDialog.open) els.setupDialog.showModal();
}

function setProviderBadge(health) {
  const provider = health.provider;
  state.providerMode = provider.mode;
  els.providerBadge.hidden = false;
  if (provider.mode === 'scripted-preview') {
    els.providerBadge.textContent = '스크립트 · 모델 아님';
    els.providerBadge.title = '고정 시나리오입니다. 실제 모델·서사 품질 검증으로 보지 않습니다.';
  } else if (provider.mode === 'company-configured') {
    els.providerBadge.textContent = '기존 Company 모델 설정';
    els.providerBadge.title = 'Story와 Observer 모델 호출을 사용합니다.';
  } else {
    els.providerBadge.textContent = '모델 설정 없음';
    els.providerBadge.title = 'Story/Observer 모델이 설정되지 않아 새 턴은 실행되지 않습니다. 저장된 장면은 계속 열람할 수 있습니다.';
  }
  state.voiceHealth = health.voice ?? null;
  updateVoiceControls();
}

function setupOptions() {
  clearChildren(els.setupDepartment);
  clearChildren(els.setupPosition);
  const departments = state.content.setup_options.departments;
  const positions = state.content.setup_options.positions;
  departments.forEach((value, index) => els.setupDepartment.append(option(value, index === 0 ? value : value)));
  positions.forEach((value, index) => els.setupPosition.append(option(value, index === 0 ? value : value)));
  if (departments.includes('브랜드전략팀')) els.setupDepartment.value = '브랜드전략팀';
  if (positions.includes('대리')) els.setupPosition.value = '대리';
}

const csaScopeLabels = {
  female_employee: '여성 직원 전체',
  male_employee: '남성 직원 전체',
  company_employee: '회사 직원 전체',
  player: '플레이어'
};

function csaActorOptions(scope) {
  if (scope === 'player') return state.snapshot?.profile
    ? [{ value: 'player', label: state.snapshot.profile.name + ' · 플레이어' }]
    : [];
  const gender = value => value === 'female' || value === '여성' ? 'female' : value === 'male' || value === '남성' ? 'male' : '';
  const actors = state.content.actors.filter(actor => {
    if (!Number.isInteger(actor.age) || actor.age < 18) return false;
    if (scope === 'female_employee') return gender(actor.gender) === 'female';
    if (scope === 'male_employee') return gender(actor.gender) === 'male';
    return scope === 'company_employee';
  }).map(actor => ({ value: actor.actor_id, label: actor.name + ' · ' + (actor.role_title || actor.position || actor.department) }));
  if (scope === 'company_employee' && state.snapshot?.profile) {
    actors.unshift({ value: 'player', label: state.snapshot.profile.name + ' · 플레이어' });
  }
  return actors;
}

function buildCsaSelectorEditor(item, initial = {}) {
  const root = document.createElement('div');
  root.className = 'csa-selector-editor';
  const values = { ...initial };

  function addSelect(labelText, key, options, selectedValue, onChange = null) {
    const label = document.createElement('label');
    label.className = 'csa-field';
    const caption = document.createElement('span');
    caption.textContent = labelText;
    const select = document.createElement('select');
    options.forEach(optionData => select.append(option(optionData.label, optionData.value)));
    if (selectedValue !== undefined && options.some(entry => entry.value === selectedValue)) select.value = selectedValue;
    else if (options.length) select.value = options[0].value;
    values[key] = select.value || '';
    select.addEventListener('change', () => {
      values[key] = select.value;
      onChange?.();
    });
    label.append(caption, select);
    root.append(label);
    return select;
  }

  function render() {
    clearChildren(root);
    const subjectScopes = item.subject_scopes ?? [];
    const fixedSubject = values.subject_scope ?? item.default_subject_scope ?? subjectScopes[0];
    if (subjectScopes.length > 1) {
      addSelect('대상 범위', 'subject_scope', subjectScopes.map(value => ({ value, label: csaScopeLabels[value] ?? value })), fixedSubject, () => {
        values.subject_actor_id = '';
        render();
      });
    } else values.subject_scope = subjectScopes[0] ?? null;

    if (item.selector_schema === 'actor_pair' || item.selector_schema === 'named_actor') {
      const subjectOptions = csaActorOptions(values.subject_scope);
      addSelect('대상 인물', 'subject_actor_id', subjectOptions, values.subject_actor_id);
      if (item.selector_schema === 'actor_pair') {
        const counterpartyScopes = item.counterparty_scopes ?? [];
        const fixedCounterparty = values.counterparty_scope ?? item.default_counterparty_scope ?? counterpartyScopes[0];
        if (counterpartyScopes.length > 1) {
          addSelect('상대 범위', 'counterparty_scope', counterpartyScopes.map(value => ({ value, label: csaScopeLabels[value] ?? value })), fixedCounterparty, () => {
            values.counterparty_actor_id = '';
            render();
          });
        } else values.counterparty_scope = counterpartyScopes[0] ?? null;
        addSelect('상대 인물', 'counterparty_actor_id', csaActorOptions(values.counterparty_scope), values.counterparty_actor_id);
      } else {
        values.counterparty_scope = item.default_counterparty_scope ?? null;
        delete values.counterparty_actor_id;
      }
    } else {
      values.counterparty_scope = item.default_counterparty_scope ?? null;
      delete values.subject_actor_id;
      delete values.counterparty_actor_id;
    }
  }
  render();
  return { node: root, getValue: () => ({ ...values }) };
}

function ruleScopeSummary(rule) {
  const selected = rule.selectors?.subject_actor_id;
  const actor = selected === 'player'
    ? { name: state.snapshot?.profile?.name }
    : state.content.actors.find(person => person.actor_id === selected);
  const subject = actor?.name ?? csaScopeLabels[rule.subject_scope] ?? '설정된 범위';
  if (!rule.counterparty_scope) return subject;
  const selectedOther = rule.selectors?.counterparty_actor_id;
  const other = selectedOther === 'player'
    ? { name: state.snapshot?.profile?.name }
    : state.content.actors.find(person => person.actor_id === selectedOther);
  return subject + ' · 상대 ' + (other?.name ?? csaScopeLabels[rule.counterparty_scope] ?? '설정된 범위');
}

function submitRuleChange(operation, ruleId, item, selectors, version) {
  if (!state.snapshot?.profile || state.isBusy) return;
  state.pendingCommand = { kind: 'RULE_CHANGE', operation, ruleId, templateId: item.template_id };
  postStream('/api/games/' + encodeURIComponent(state.gameId) + '/commands', {
    command_id: crypto.randomUUID(),
    kind: 'RULE_CHANGE',
    expected_state_revision: state.snapshot.state.state_revision,
    rule_change: {
      operation,
      rule_id: ruleId,
      template_id: item.template_id,
      selectors,
      expected_rule_version: version
    }
  });
}

function createRuleCard(item) {
  const card = document.createElement('article');
  card.className = 'csa-rule-card';
  const header = document.createElement('div');
  header.className = 'csa-rule-heading';
  const title = document.createElement('h3');
  title.textContent = item.label;
  const authority = document.createElement('span');
  authority.textContent = item.authority_label;
  header.append(title, authority);
  const text = document.createElement('p');
  text.textContent = item.rule_text;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button-outline csa-open-editor';
  button.textContent = '적용 설정';
  const editor = document.createElement('div');
  editor.className = 'csa-inline-editor';
  editor.hidden = true;
  button.addEventListener('click', () => {
    editor.hidden = !editor.hidden;
    button.textContent = editor.hidden ? '적용 설정' : '설정 닫기';
    if (!editor.hidden && !editor.childElementCount) {
      const selectorEditor = buildCsaSelectorEditor(item);
      const help = document.createElement('p');
      help.className = 'csa-scope-note';
      help.textContent = item.selector_schema === 'none'
        ? '대상 범위는 이 규칙의 정본 설정을 따릅니다.'
        : '선택한 성인 인물과 적용 범위만 규칙에 포함됩니다.';
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'button button-primary button-wide';
      submit.textContent = '이 규칙 발효';
      submit.addEventListener('click', () => submitRuleChange('APPLY', crypto.randomUUID(), item, selectorEditor.getValue(), 0));
      editor.append(help, selectorEditor.node, submit);
    }
  });
  card.append(header, text, button, editor);
  return card;
}

function openChangeEditor(rule) {
  const host = els.csaChangeEditor;
  clearChildren(host);
  host.hidden = false;
  const heading = document.createElement('div');
  heading.className = 'csa-section-heading';
  const title = document.createElement('strong');
  title.textContent = rule.label + ' · 변경';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'close-dialog';
  cancel.textContent = '×';
  cancel.setAttribute('aria-label', '변경 닫기');
  cancel.addEventListener('click', () => { host.hidden = true; clearChildren(host); });
  heading.append(title, cancel);
  host.append(heading);

  const selectLabel = document.createElement('label');
  selectLabel.className = 'csa-field';
  const caption = document.createElement('span');
  caption.textContent = '새 규칙';
  const select = document.createElement('select');
  const allItems = state.content.csa_catalog.items;
  allItems.forEach(item => select.append(option(item.label + ' · ' + item.authority_label, item.template_id)));
  select.value = rule.template_id;
  selectLabel.append(caption, select);
  host.append(selectLabel);
  const selectorHost = document.createElement('div');
  host.append(selectorHost);
  let selectorEditor;
  const draw = () => {
    const item = allItems.find(candidate => candidate.template_id === select.value);
    selectorEditor = buildCsaSelectorEditor(item, item.template_id === rule.template_id ? rule.selectors : {});
    selectorHost.replaceChildren(selectorEditor.node);
  };
  select.addEventListener('change', draw);
  draw();
  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'button button-primary button-wide';
  submit.textContent = '개정 규칙 적용';
  submit.addEventListener('click', () => {
    const item = allItems.find(candidate => candidate.template_id === select.value);
    submitRuleChange('CHANGE', rule.rule_id, item, selectorEditor.getValue(), rule.version);
  });
  host.append(submit);
}

function renderCsa() {
  if (!state.content?.csa_catalog || !state.snapshot) return;
  const active = state.snapshot.state?.active_rules ?? [];
  els.openCsa.disabled = !state.snapshot.profile || state.isBusy;
  els.csaActiveCount.textContent = String(active.length);
  els.csaActiveRules.replaceChildren();
  els.activeRuleSummary.replaceChildren();
  if (!active.length) {
    const emptyDialog = document.createElement('p');
    emptyDialog.className = 'muted-note';
    emptyDialog.textContent = '아직 활성 규칙이 없습니다.';
    els.csaActiveRules.append(emptyDialog);
    const emptyCard = document.createElement('p');
    emptyCard.className = 'muted-note';
    emptyCard.textContent = '아직 활성 규칙이 없습니다.';
    els.activeRuleSummary.append(emptyCard);
  } else {
    for (const rule of active) {
      const row = document.createElement('article');
      row.className = 'active-rule-row';
      const title = document.createElement('strong');
      title.textContent = rule.label;
      const scope = document.createElement('small');
      scope.textContent = ruleScopeSummary(rule);
      const actions = document.createElement('div');
      actions.className = 'active-rule-actions';
      const change = document.createElement('button');
      change.type = 'button';
      change.className = 'button button-outline';
      change.textContent = '변경';
      change.addEventListener('click', () => openChangeEditor(rule));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-outline';
      remove.textContent = '해제';
      remove.addEventListener('click', () => {
        const item = state.content.csa_catalog.items.find(candidate => candidate.template_id === rule.template_id);
        if (item) submitRuleChange('REMOVE', rule.rule_id, item, rule.selectors, rule.version);
      });
      actions.append(change, remove);
      row.append(title, scope, actions);
      els.csaActiveRules.append(row);

      const summary = document.createElement('p');
      summary.className = 'active-rule-summary-item';
      summary.textContent = rule.label + ' · ' + ruleScopeSummary(rule);
      els.activeRuleSummary.append(summary);
    }
  }
  const selectedTier = state.csaTier;
  document.querySelectorAll('#csa-tabs [data-tier]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.tier === selectedTier)));
  els.csaCatalogList.replaceChildren(...state.content.csa_catalog.items.filter(item => item.tier === selectedTier).map(createRuleCard));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(value.error ?? 'request_failed'), { code: value.error, status: response.status });
  return value;
}

async function createFreshGame() {
  if (state.isBusy) return;
  const result = await api('/api/games', { method: 'POST', body: '{}' });
  state.gameId = result.game_id;
  state.snapshot = result.snapshot;
  localStorage.setItem('company-r4-current-game', state.gameId);
  history.replaceState({}, '', '/?gameId=' + encodeURIComponent(state.gameId));
  els.setupForm.reset();
  setupOptions();
  renderSnapshot();
}

async function loadGame(gameId) {
  state.gameId = gameId;
  state.snapshot = await api('/api/games/' + encodeURIComponent(gameId));
  localStorage.setItem('company-r4-current-game', gameId);
  if (!state.snapshot.profile) setupOptions();
  renderSnapshot();
  const savedJob = localStorage.getItem('company-r4-job-' + gameId);
  const latestJob = savedJob
    ? { job_id: savedJob }
    : await api('/api/games/' + encodeURIComponent(gameId) + '/jobs/current');
  if (latestJob.job_id) await resumeJob(latestJob.job_id);
}

function updateCommittedSnapshot(snapshot) {
  if (state.gameId !== snapshot.game_id) return false;
  const current = state.snapshot;
  const incomingRevision = snapshot.state?.state_revision ?? -1;
  const currentRevision = current?.state?.state_revision ?? -1;
  if (incomingRevision < currentRevision) return false;
  state.snapshot = snapshot;
  renderSnapshot();
  return true;
}

function displayError(code, message = '') {
  const messages = {
    story_output_limit: '이야기 응답이 길이 제한에서 끝났습니다. 마지막 확정 장면은 유지됩니다.',
    story_stream_incomplete: '이야기 전송이 정상 종료되지 않았습니다. 일부 미리보기는 저장하지 않았습니다.',
    provider_timeout: '모델 응답 시간이 초과됐습니다. 원본 입력은 보존되어 있습니다.',
    company_model_configuration_unavailable: 'Company 모델 설정이 이 실행 환경에 없습니다.',
    live_model_call_budget_exhausted: '설정된 모델 호출 예산을 모두 사용했습니다.',
    live_model_call_budget_insufficient_for_turn: 'Story와 Observer 두 단계에 필요한 예산이 부족해 새 턴을 시작하지 않았습니다.',
    live_model_call_budget_insufficient_for_retry: '재시도 단계에 필요한 예산이 남지 않았습니다. 원본 명령은 그대로 보존되어 있습니다.',
    state_revision_conflict: '다른 화면에서 장면이 바뀌었습니다. 최신 저장 내용을 불러왔습니다.',
    observer_failed: '관찰 정리에 실패했지만 이야기 본문은 낮은 신뢰 상태로 저장했습니다.',
    explicit_retry_required: '실패한 원본 명령이 보존되어 있습니다. 원본 명령 재시도를 선택해 주세요.'
  };
  if (String(code ?? '').startsWith('rule_conflict')) return '활성 규칙과 대상 범위가 충돌합니다. 기존 규칙을 변경하거나 다른 범위를 선택해 주세요.';
  if (String(code ?? '').startsWith('rule_selector_')) return '선택한 규칙의 대상 범위를 확인해 주세요.';
  return messages[code] ?? message ?? '요청을 완료하지 못했습니다. 원본 입력과 마지막 확정 장면은 유지됩니다.';
}

async function consumeEvent(event, requestGameId, requestToken) {
  if (state.gameId !== requestGameId || state.streamToken !== requestToken) return;
  if (event.type === 'accepted') {
    state.activeJobId = event.job_id;
    localStorage.setItem('company-r4-job-' + requestGameId, event.job_id);
  }
  if (event.type === 'stage') {
    els.pendingStage.textContent = event.stage === 'observer' ? '장면과 인물 정보를 정리하는 중' : event.stage === 'commit' ? '장면을 로컬 저장소에 기록하는 중' : '이야기를 이어 쓰는 중';
  }
  if (event.type === 'story_delta') {
    els.pendingStory.hidden = false;
    els.storyPreview.textContent += event.text;
  }
  if (event.type === 'story_recovered') {
    els.pendingStory.hidden = false;
    els.storyPreview.textContent = event.text;
  }
  if (event.type === 'in_progress') {
    showNotice('이 원본 명령은 이미 처리 중입니다. 새로고침 뒤 자동으로 다시 생성하지 않습니다.');
  }
  if (event.type === 'committed') {
    state.activeJobId = '';
    localStorage.removeItem('company-r4-job-' + requestGameId);
    if (event.snapshot) updateCommittedSnapshot(event.snapshot);
    els.pendingStory.hidden = true;
    els.storyPreview.textContent = '';
    els.retryRow.hidden = true;
    hideNotice();
    if (state.pendingCommand?.kind === 'FREE_ACTION' && els.actionInput.value === state.pendingCommand.literal_action) els.actionInput.value = '';
    if (state.pendingCommand?.kind === 'FEEDBACK') {
      els.feedbackInput.value = '';
      if (els.feedbackDialog.open) els.feedbackDialog.close();
    }
    if (state.pendingCommand?.kind === 'RULE_CHANGE' && els.csaDialog.open) els.csaDialog.close();
    renderCounter();
    setBusy(false);
  }
  if (event.type === 'error') {
    const retryJobId = event.job_id ?? state.activeJobId;
    if (event.retry_available && retryJobId) {
      state.activeJobId = retryJobId;
      localStorage.setItem('company-r4-job-' + requestGameId, state.activeJobId);
      els.retryRow.hidden = false;
      els.retryMessage.textContent = '실패한 입력을 그대로 보존했습니다. 재시도는 서버에 저장된 원본 명령을 사용합니다.';
    } else {
      state.activeJobId = '';
      localStorage.removeItem('company-r4-job-' + requestGameId);
      els.retryRow.hidden = true;
    }
    els.pendingStage.textContent = event.retry_available ? '미저장 미리보기 · 원본 명령 보존' : '요청이 완료되지 않았습니다';
    els.pendingStory.hidden = !els.storyPreview.textContent;
    showNotice(displayError(event.error), 'error');
    if (event.error === 'state_revision_conflict') {
      const fresh = await api('/api/games/' + encodeURIComponent(requestGameId));
      updateCommittedSnapshot(fresh);
    }
    setBusy(false);
  }
}

async function readEventStream(response, requestGameId, requestToken) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';
    for (const raw of events) {
      const data = raw.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
      if (data) {
        try { await consumeEvent(JSON.parse(data), requestGameId, requestToken); } catch (error) { console.error(error); }
      }
    }
    if (done) break;
  }
  if (buffer.trim()) {
    const data = buffer.split(/\r?\n/).find(line => line.startsWith('data:'))?.slice(5).trim();
    if (data) await consumeEvent(JSON.parse(data), requestGameId, requestToken);
  }
}

async function postStream(path, body) {
  const requestGameId = state.gameId;
  const requestToken = crypto.randomUUID();
  state.streamToken = requestToken;
  els.pendingStory.hidden = false;
  els.storyPreview.textContent = '';
  els.pendingStage.textContent = '이야기를 이어 쓰는 중';
  setBusy(true);
  hideNotice();
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const payload = await response.json();
      throw Object.assign(new Error(payload.error ?? 'request_failed'), { code: payload.error });
    }
    await readEventStream(response, requestGameId, requestToken);
  } catch (error) {
    showNotice(displayError(error.code, error.message), 'error');
    setBusy(false);
  } finally {
    if (state.streamToken === requestToken && !state.activeJobId) {
      els.pendingStory.hidden = true;
      els.storyPreview.textContent = '';
    }
  }
}

function submitCommand(kind, literalAction = '', ruleChange = null) {
  if (!state.snapshot || state.isBusy || !state.snapshot.profile) return;
  state.pendingCommand = { kind, literal_action: literalAction, rule_change: ruleChange };
  postStream('/api/games/' + encodeURIComponent(state.gameId) + '/commands', {
    command_id: crypto.randomUUID(),
    kind,
    expected_state_revision: state.snapshot.state.state_revision,
    literal_action: literalAction,
    ...(ruleChange ? { rule_change: ruleChange } : {})
  });
}

async function resumeJob(jobId) {
  if (!state.gameId || !jobId) return;
  try {
    const value = await api('/api/games/' + encodeURIComponent(state.gameId) + '/jobs/' + encodeURIComponent(jobId));
    if (value.status === 'complete') {
      localStorage.removeItem('company-r4-job-' + state.gameId);
      updateCommittedSnapshot(value.snapshot);
      return;
    }
    if (value.status === 'failed') {
      state.activeJobId = jobId;
      els.retryRow.hidden = false;
      els.retryMessage.textContent = '서버가 중단된 단계와 원본 명령을 보존했습니다. 같은 Story를 자동 재생성하지 않았습니다.';
      showNotice(displayError(value.error ?? 'explicit_retry_required'), 'error');
      return;
    }
    state.activeJobId = jobId;
    setBusy(true);
    els.pendingStory.hidden = false;
    els.pendingStage.textContent = value.stage === 'observer' ? '장면 정보를 정리하는 중' : '서버에서 원본 명령을 처리 중';
    if (value.story_checkpoint) els.storyPreview.textContent = value.story_checkpoint;
    setTimeout(() => resumeJob(jobId), 1500);
  } catch {
    localStorage.removeItem('company-r4-job-' + state.gameId);
  }
}

function renderCounter() {
  els.actionCounter.textContent = Array.from(els.actionInput.value).length + ' / 2000';
}

function appendHistoryEntries(turns, prepend = false) {
  const nodes = turns.map(turn => {
    const article = document.createElement('article');
    article.className = 'history-entry';
    const header = document.createElement('header');
    const title = document.createElement('strong');
    const version = document.createElement('span');
    title.textContent = 'TURN ' + turn.turn_number;
    version.textContent = 'revision ' + turn.turn_revision;
    header.append(title, version);
    const body = document.createElement('p');
    body.textContent = turn.narrative_body;
    article.append(header, body);
    return article;
  });
  if (prepend) nodes.reverse().forEach(node => els.historyList.prepend(node));
  else nodes.forEach(node => els.historyList.append(node));
}

async function loadHistory(reset = false) {
  if (reset) {
    state.historyTurns = [];
    state.historyBefore = 2147483647;
    clearChildren(els.historyList);
  }
  const result = await api('/api/games/' + encodeURIComponent(state.gameId) + '/history?before=' + state.historyBefore + '&limit=20');
  appendHistoryEntries(result.turns, false);
  state.historyTurns.push(...result.turns);
  const oldest = result.turns[0]?.turn_number;
  state.historyBefore = oldest ?? 2147483647;
  els.historyMore.hidden = result.turns.length < 20;
}

async function handleCommitted(event) {
  if (!event.snapshot) return;
  updateCommittedSnapshot(event.snapshot);
}

async function start() {
  const [content, health] = await Promise.all([api('/api/content'), api('/api/health')]);
  state.content = content;
  const leadPortrait = content.actors.find(actor => actor.kind === 'heroine')?.portrait?.asset_url;
  if (leadPortrait) {
    els.welcomeImage.src = leadPortrait;
    els.welcomeImage.hidden = false;
    els.welcomeImage.addEventListener('error', () => { els.welcomeImage.hidden = true; }, { once: true });
  }
  setProviderBadge(health);
  renderDirectory();
  for (const location of content.locations) els.locationSelect.append(option(location.name + ' · ' + (location.floor || location.zone || ''), location.location_id));
  const params = new URLSearchParams(location.search);
  const queryGame = params.get('gameId');
  if (queryGame) {
    await loadGame(queryGame);
  } else if (params.has('fresh')) {
    await createFreshGame();
  } else {
    const savedGame = localStorage.getItem('company-r4-current-game');
    if (savedGame) {
      try { await loadGame(savedGame); }
      catch { localStorage.removeItem('company-r4-current-game'); els.welcome.hidden = false; }
    } else {
      els.welcome.hidden = false;
      els.playSurface.hidden = true;
    }
  }

}

byId('start-opening').addEventListener('click', () => submitCommand('OPENING'));
byId('start-new-game').addEventListener('click', () => createFreshGame().catch(error => showNotice(displayError(error.code, error.message), 'error')));
byId('new-game').addEventListener('click', () => createFreshGame().catch(error => showNotice(displayError(error.code, error.message), 'error')));

els.setupForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.gameId) return;
  els.setupError.hidden = true;
  try {
    state.snapshot = await api('/api/games/' + encodeURIComponent(state.gameId) + '/setup', {
      method: 'POST',
      body: JSON.stringify({
        name: els.setupName.value,
        age: Number(els.setupAge.value),
        department: els.setupDepartment.value,
        position: els.setupPosition.value
      })
    });
    els.setupDialog.close();
    renderSnapshot();
    submitCommand('OPENING');
  } catch (error) {
    els.setupError.textContent = displayError(error.code, error.message);
    els.setupError.hidden = false;
  }
});

els.actionForm.addEventListener('submit', event => {
  event.preventDefault();
  const literal = els.actionInput.value;
  if (literal.trim()) submitCommand('FREE_ACTION', literal);
});
els.actionInput.addEventListener('input', renderCounter);

els.retryButton.addEventListener('click', () => {
  if (!state.activeJobId || !state.gameId || state.isBusy) return;
  state.pendingCommand = { kind: 'RETRY' };
  postStream('/api/games/' + encodeURIComponent(state.gameId) + '/jobs/' + encodeURIComponent(state.activeJobId) + '/retry', {});
});

byId('open-history').addEventListener('click', async () => {
  if (!state.gameId) return;
  try {
    await loadHistory(true);
    els.historyDialog.showModal();
  } catch (error) { showNotice(displayError(error.code, error.message), 'error'); }
});
els.historyMore.addEventListener('click', () => loadHistory(false).catch(error => showNotice(displayError(error.code, error.message), 'error')));

byId('open-feedback').addEventListener('click', () => {
  if (state.snapshot?.latest_turn) els.feedbackDialog.showModal();
});
els.openCsa.addEventListener('click', () => {
  if (state.snapshot?.profile && !state.isBusy) els.csaDialog.showModal();
});
document.querySelectorAll('#csa-tabs [data-tier]').forEach(tab => tab.addEventListener('click', () => {
  state.csaTier = tab.dataset.tier;
  renderCsa();
}));
els.feedbackForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!state.snapshot?.latest_turn || !els.feedbackInput.value.trim()) return;
  state.pendingCommand = { kind: 'FEEDBACK' };
  postStream('/api/games/' + encodeURIComponent(state.gameId) + '/feedback', {
    feedback_id: crypto.randomUUID(),
    feedback_text: els.feedbackInput.value,
    expected_state_revision: state.snapshot.state.state_revision
  });
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => byId(button.dataset.close).close()));

els.locationSelect.addEventListener('change', () => {
  const value = state.content.locations.find(item => item.location_id === els.locationSelect.value);
  els.locationDescription.textContent = value
    ? value.description + ' · 지도 둘러보기는 현재 장면을 바꾸지 않습니다.'
    : '장소 둘러보기는 정보 확인용이며 현재 장면을 바꾸지 않습니다.';
});

byId('media-stop').addEventListener('click', () => {
  if (!state.mediaSource || state.mediaKind !== 'gif-demo') return;
  state.mediaPaused = true;
  els.mediaImage.src = '/assets/company-notice-demo.png';
  els.mediaStatus.textContent = '정지 포스터를 표시하고 있습니다.';
});
byId('media-play').addEventListener('click', () => {
  if (!state.mediaSource || state.mediaKind !== 'gif-demo') return;
  state.mediaPaused = false;
  state.mediaFallback = false;
  els.mediaImage.src = state.mediaSource + '&play=' + Date.now();
  els.mediaStatus.textContent = '확정된 장면의 애니메이션을 재생하고 있습니다.';
});
els.mediaImage.addEventListener('error', () => {
  if (state.mediaKind === 'asset') {
    els.mediaImage.removeAttribute('src');
    els.mediaStatus.textContent = '원본 이미지 참조는 유지됩니다 · 로컬 브라우저에서 자료를 불러오지 못했습니다.';
    return;
  }
  if (!state.mediaFallback) {
    state.mediaFallback = true;
    state.mediaPaused = true;
    els.mediaImage.src = '/assets/company-notice-demo.png';
    els.mediaStatus.textContent = 'GIF를 불러오지 못해 정지 포스터로 표시합니다.';
  } else {
    els.mediaCard.hidden = true;
  }
});

start().catch(error => {
  showNotice(displayError(error.code, error.message), 'error');
});

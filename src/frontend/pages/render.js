import { parseNarrative } from './narrative.js';

export function text(element, value) { if (element) element.textContent = value ?? ''; }

function displayValue(value) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null; }

const DISPLAY_LABELS = {
  office: '사무실', meeting_room: '회의실', conference_room: '대회의실', lobby: '로비',
  hallway: '복도', elevator: '엘리베이터', break_room: '휴게실', cafeteria: '구내식당',
  morning: '오전', afternoon: '오후', evening: '저녁', night: '밤',
  report_review: '보고서 검토', team_meeting: '팀 회의', onboarding: '신입 적응',
  standing: '서 있음', sitting: '앉아 있음', kneeling: '무릎을 꿇고 있음',
  lying: '누워 있음', crouching: '몸을 낮추고 있음', walking: '이동 중'
};

function localizedValue(value) {
  const raw = displayValue(value).trim();
  if (!raw) return '';
  return DISPLAY_LABELS[raw] ?? raw.replaceAll('_', ' ');
}

function workHook(value) {
  const raw = typeof value === 'string' ? value : displayValue(value?.id) || displayValue(value?.status);
  return localizedValue(raw);
}

function definitionList(container, entries) {
  if (!container) return;
  container.replaceChildren();
  for (const [label, value] of entries) {
    if (value === '' || value === null || value === undefined) continue;
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = String(value); container.append(dt, dd);
  }
}

function parsedChoices(turn, parsed) {
  const candidates = [parsed?.choices, turn?.choices, turn?.parsed_blocks?.choices];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.some(choice => typeof choice === 'string' && choice.trim())) {
      return candidate.filter(choice => typeof choice === 'string' && choice.trim());
    }
  }
  return [];
}

export function parsedTurnNarrative(turn) {
  let parsed;
  if (Array.isArray(turn?.parsed_blocks)) parsed = { blocks: turn.parsed_blocks };
  else if (Array.isArray(turn?.parsed_blocks?.blocks)) parsed = turn.parsed_blocks;
  else parsed = parseNarrative(turn?.story_text ?? '');
  return { ...parsed, choices: parsedChoices(turn, parsed) };
}

export function stateDisplayValues(viewModel) {
  const scene = object(viewModel?.scene?.scene_state) ?? {};
  const world = object(viewModel?.scene?.world_state) ?? {};
  return {
    장소: localizedValue(scene.location_label || scene.location_id),
    업무: workHook(world.work_hook),
    목표: localizedValue(scene.scene_goal),
    흐름: localizedValue(scene.focus_thread) || localizedValue(scene.beat),
    활성규정: Array.isArray(viewModel?.scene?.csa_active) ? String(viewModel.scene.csa_active.length) : ''
  };
}

const CHOICE_INTENTS = [
  { pattern: /자료|문서|보고서|화면|파일/, label: '자료보기' },
  { pattern: /대화.*(?:합류|끼어)|(?:합류|끼어).*대화/, label: '대화합류' },
  { pattern: /질문|물어|묻/, label: '질문하기' },
  { pattern: /도와|돕|지원/, label: '도와주기' },
  { pattern: /거절|중단|물러|하지 않/, label: '거절하기' },
  { pattern: /기다|지켜보|관찰|살펴보/, label: '지켜보기' },
  { pattern: /무릎|곁|옆.*앉|앉아|착석/, label: '곁에앉기' },
  { pattern: /다가가|접근|이동|찾아가/, label: '다가가기' },
  { pattern: /인사|말을 걸|대화를 시작|말을 꺼/, label: '말걸기' },
  { pattern: /설명|이야기|말해/, label: '설명하기' },
  { pattern: /검토|확인|점검/, label: '확인하기' },
  { pattern: /업무|집중|정리|작성/, label: '업무집중' }
];

export function choiceLabel(choice, maxLength = 5) {
  const value = String(choice ?? '').replace(/^\s*\d+\.\s*/, '').trim();
  const matched = CHOICE_INTENTS.find(intent => intent.pattern.test(value));
  const label = matched?.label ?? value.replace(/[“”"'()[\]{}]/g, '').trim();
  return Array.from(label).slice(0, Math.max(1, maxLength)).join('');
}

function renderNarrativeChoices(container, choices) {
  const normalized = Array.isArray(choices) ? choices.filter(choice => typeof choice === 'string' && choice.trim()) : [];
  if (!container || normalized.length === 0) return;
  const section = document.createElement('section'); section.className = 'narrative-choices';
  const heading = document.createElement('h3'); heading.textContent = '선택지';
  const list = document.createElement('ol');
  for (const choice of normalized) {
    const item = document.createElement('li'); item.textContent = choice; list.append(item);
  }
  section.append(heading, list); container.append(section);
}

export function renderNarrative(container, parsed) {
  if (!container) return;
  container.replaceChildren();
  let embeddedChoices = false;
  for (const block of parsed?.blocks ?? []) {
    if (block.type === 'choices') {
      renderNarrativeChoices(container, block.choices ?? parsed?.choices);
      embeddedChoices = true;
      continue;
    }
    if (block.type === 'dialogue') {
      const card = document.createElement('article'); card.className = 'narrative-dialogue dialogue-card';
      const meta = document.createElement('header'); meta.className = 'dialogue-meta';
      const speaker = document.createElement('strong'); speaker.className = 'dialogue-speaker'; speaker.textContent = block.speaker ?? '';
      const direction = document.createElement('span'); direction.className = 'dialogue-direction'; direction.textContent = block.direction ?? '';
      const line = document.createElement('p'); line.className = 'dialogue-text'; line.textContent = block.text ?? '';
      meta.append(speaker, direction); card.append(meta, line); container.append(card);
      continue;
    }
    const paragraph = document.createElement('p'); paragraph.className = `narrative-${block.type ?? 'unparsed'}`; paragraph.textContent = block.text ?? ''; container.append(paragraph);
  }
  if (!embeddedChoices) renderNarrativeChoices(container, parsed?.choices);
}

export function renderChoices(container, choices, { busy = false, onChoose } = {}) {
  if (!container) return;
  container.replaceChildren();
  for (const [index, choice] of (choices ?? []).entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button';
    button.textContent = `${index + 1} ${choiceLabel(choice)}`;
    button.title = choice;
    button.ariaLabel = `${index + 1}번 선택지: ${choice}`;
    button.disabled = busy;
    button.addEventListener('click', () => onChoose?.(choice)); container.append(button);
  }
}

export function renderHistory(container, turns) {
  if (!container) return;
  container.replaceChildren();
  for (const turn of turns ?? []) {
    const card = document.createElement('article'); card.className = 'turn-card';
    const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.player_action ?? '이전 행동';
    const narrative = document.createElement('div'); narrative.className = 'turn-narrative';
    card.append(action, narrative); renderNarrative(narrative, parsedTurnNarrative(turn));
    if (turn.turn_summary) { const summary = document.createElement('p'); summary.className = 'turn-summary'; summary.textContent = turn.turn_summary; card.append(summary); }
    container.append(card);
  }
}

function firstMonitorValue(monitor, keys) {
  for (const key of keys) if (monitor[key] !== undefined && monitor[key] !== null) return monitor[key];
  return null;
}

export function mindMonitorDisplay(monitor) {
  const source = object(monitor) ?? {};
  return [
    ['표면의식', firstMonitorValue(source, ['표면의식', 'surface', 'surface_consciousness', 'conscious'])],
    ['잠재의식', firstMonitorValue(source, ['잠재의식', 'latent', 'subconscious', 'subconsciousness'])]
  ].filter(([, value]) => value !== null).map(([label, value]) => [label, typeof value === 'string' ? value : JSON.stringify(value)]);
}

export function renderMindMonitor(container, monitor) {
  if (!container) return;
  container.replaceChildren();
  for (const [label, value] of mindMonitorDisplay(monitor)) {
    const card = document.createElement('section'); card.className = 'mind-card';
    const heading = document.createElement('h3'); heading.textContent = label;
    const detail = document.createElement('p'); detail.textContent = value;
    card.append(heading, detail); container.append(card);
  }
}

const POSTURE_SENTENCES = {
  standing: '서 있다', sitting: '앉아 있다', kneeling: '무릎을 꿇고 있다',
  lying: '누워 있다', crouching: '몸을 낮추고 있다', walking: '이동하고 있다'
};

const RELATIVE_POSITIONS = {
  front: '플레이어 앞에서', front_of_player: '플레이어 앞에서',
  beside: '플레이어 곁에서', beside_player: '플레이어 곁에서', next_to_player: '플레이어 곁에서',
  behind: '플레이어 뒤에서', behind_player: '플레이어 뒤에서',
  facing: '플레이어를 마주 보며', facing_player: '플레이어를 마주 보며',
  close: '플레이어 가까이에서', near_player: '플레이어 가까이에서'
};

function topicName(name) {
  const normalized = displayValue(name).trim() || '상대';
  const last = normalized.codePointAt(normalized.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${normalized}${hasBatchim ? '은' : '는'}`;
}

function postureSentence(value, detail = '') {
  const detailed = displayValue(detail).trim();
  if (detailed) return detailed.replace(/[.。]$/, '');
  const raw = displayValue(value).trim();
  if (!raw) return '';
  return POSTURE_SENTENCES[raw] ?? `${localizedValue(raw)} 자세를 취하고 있다`;
}

export function physicalRelationDisplay(focal, player) {
  const sceneState = object(focal?.scene_state) ?? {};
  const name = displayValue(focal?.name).trim() || displayValue(focal?.id).trim() || '상대';
  const relativeRaw = displayValue(sceneState.relative_position).trim();
  const relative = RELATIVE_POSITIONS[relativeRaw] ?? (relativeRaw ? localizedValue(relativeRaw) : '같은 공간에서');
  const counterpartPosture = postureSentence(sceneState.posture, sceneState.posture_detail);
  const playerPosture = postureSentence(player?.posture, player?.posture_detail);
  const counterpart = counterpartPosture ? `${topicName(name)} ${relative} ${counterpartPosture}` : `${topicName(name)} ${relative} 플레이어와 함께 있다`;
  return playerPosture ? `플레이어는 ${playerPosture}. ${counterpart}.` : `${counterpart}.`;
}

function renderFocalCharacter(container, focal, player) {
  if (!container) return;
  const hasPhysicalState = Boolean(focal?.name || focal?.id || focal?.scene_state?.posture || player?.posture);
  if (!hasPhysicalState) { container.hidden = true; container.replaceChildren(); return; }
  container.hidden = false; container.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = '현재 자세';
  const relation = document.createElement('p'); relation.className = 'physical-relation'; relation.textContent = physicalRelationDisplay(focal, player);
  container.append(heading, relation);
}

function renderPlayer(container, player, scene) {
  const clothing = object(player?.clothing) ?? {};
  const clothingSummary = Object.values(clothing).some(value => value === 'removed' || value === 'open') ? '흐트러짐' : (Object.keys(clothing).length ? '정상 착용' : '');
  definitionList(container, [
    ['이름', displayValue(player?.name)],
    ['소속', [displayValue(player?.department), displayValue(player?.position)].filter(Boolean).join(' · ')],
    ['현재 장소', localizedValue(player?.location_label || scene?.scene_state?.location_label || scene?.scene_state?.location_id)],
    ['복장', clothingSummary],
    ['적용 규정', Array.isArray(scene?.csa_active) ? String(scene.csa_active.length) : ''],
    ['흥분도', typeof player?.excitement === 'number' && player.excitement > 0 ? String(player.excitement) : '']
  ]);
}

function supplementalElement(elements, key, id) {
  if (elements?.[key]) return elements[key];
  const documentRef = elements?.player?.ownerDocument ?? globalThis.document;
  return documentRef?.getElementById?.(id) ?? null;
}

function renderTextSlot(container, { heading, value, className = '' }) {
  if (!container) return;
  container.replaceChildren();
  const normalized = displayValue(value).trim();
  if (!normalized) { container.hidden = true; container.className = 'future-slot'; return; }
  container.hidden = false;
  container.className = ['future-slot', className].filter(Boolean).join(' ');
  const title = document.createElement('p'); title.className = 'future-slot-heading'; title.textContent = heading;
  const detail = document.createElement('p'); detail.className = 'future-slot-value'; detail.textContent = normalized; detail.title = normalized;
  container.append(title, detail);
}

function progressValue(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
}

export function compactSummary(value, maxLength = 140) {
  const normalized = displayValue(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const characters = Array.from(normalized);
  return characters.length > maxLength ? `${characters.slice(0, maxLength).join('')}…` : normalized;
}

export function playerSupplementalDisplay(viewModel) {
  const model = viewModel ?? {};
  const world = object(model.scene?.world_state) ?? {};
  const day = displayValue(world.day ?? world.day_index);
  const timeBlock = localizedValue(world.time_block);
  const progress = progressValue(model.player?.ejaculation_progress);
  const count = typeof model.player?.ejaculation_count === 'number' && Number.isFinite(model.player.ejaculation_count)
    ? model.player.ejaculation_count
    : null;
  return {
    innerThought: displayValue(model.player?.inner_thought),
    gameTime: [day ? `Day ${day}` : '', timeBlock].filter(Boolean).join(' · '),
    ejaculationProgress: progress,
    ejaculationCount: count,
    turnSummary: compactSummary(model.turn?.turn_summary)
  };
}

function renderProgressSlot(container, { progress, count }) {
  if (!container) return;
  container.replaceChildren();
  if (progress === null) { container.hidden = true; container.className = 'future-slot'; return; }
  container.hidden = false;
  container.className = ['future-slot', 'player-progress-card', progress >= 50 ? 'ready' : '', progress >= 100 ? 'maximum' : ''].filter(Boolean).join(' ');

  const head = document.createElement('div'); head.className = 'player-progress-head';
  const label = document.createElement('span'); label.textContent = count === null ? '사정 진행도' : `사정 진행도 · 누적 ${count}회`;
  const value = document.createElement('strong'); value.textContent = `${Math.round(progress)}%`;
  head.append(label, value);

  const track = document.createElement('div'); track.className = 'player-progress-track';
  const fill = document.createElement('div'); fill.className = 'player-progress-fill'; fill.style?.setProperty?.('--progress', `${progress}%`);
  const threshold = document.createElement('span'); threshold.className = 'player-progress-threshold'; threshold.ariaHidden = 'true';
  track.append(fill, threshold);
  container.append(head, track);
}

function renderSupplementalPanels(elements, model) {
  const display = playerSupplementalDisplay(model);
  renderTextSlot(supplementalElement(elements, 'playerInnerThought', 'player-inner-thought'), {
    heading: '플레이어 속마음', value: display.innerThought, className: 'player-inner-thought-card'
  });
  // Time already appears in the fixed header; keep the legacy slot hidden to avoid duplicate vertical space.
  renderTextSlot(supplementalElement(elements, 'gameTime', 'game-time-slot'), {
    heading: '현재 시간', value: '', className: 'game-time-card'
  });
  renderProgressSlot(supplementalElement(elements, 'ejaculationProgress', 'ejaculation-progress-slot'), {
    progress: display.ejaculationProgress, count: display.ejaculationCount
  });
  renderTextSlot(supplementalElement(elements, 'turnChanges', 'turn-changes-slot'), {
    heading: '이번 턴 요약', value: display.turnSummary, className: 'turn-change-card'
  });
}

export function renderState(elements, viewModel, { title = '상식개변: 회사편' } = {}) {
  const model = viewModel ?? {};
  const world = object(model.scene?.world_state) ?? {};
  const day = displayValue(world.day ?? world.day_index);
  const timeBlock = displayValue(world.time_block);
  text(elements.title, title || '상식개변: 회사편');
  text(elements.turn, `Turn ${model.turn?.committed_turn ?? 0}`);
  text(elements.dayTime, [day ? `Day ${day}` : '', timeBlock].filter(Boolean).join(' · '));
  definitionList(elements.scene, Object.entries(stateDisplayValues(model)));
  renderFocalCharacter(elements.focal, model.focal_character, model.player);
  renderMindMonitor(elements.mind, model.media?.mind_monitor);
  renderPlayer(elements.player, model.player, model.scene);
  renderSupplementalPanels(elements, model);
}

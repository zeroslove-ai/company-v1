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
  lying: '누워 있음', lying_supine: '바로 누워 있음', lying_prone: '엎드려 있음', side_lying: '옆으로 누워 있음',
  crouching: '몸을 낮추고 있음', walking: '이동 중', leaning: '기대어 있음', bent_forward: '몸을 앞으로 숙이고 있음',
  weak: '약함', medium: '중간', strong: '강함'
};

let currentChoiceSet = null;
let committedChoiceSet = null;

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

function normalizedStrings(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()) : [];
}

function parsedChoices(turn, parsed) {
  const candidates = [parsed?.choices, turn?.choices, turn?.parsed_blocks?.choices];
  for (const candidate of candidates) {
    const normalized = normalizedStrings(candidate);
    if (normalized.length) return normalized;
  }
  return [];
}

function parsedChoiceLabels(turn, parsed, choiceCount) {
  const candidates = [parsed?.choice_labels, turn?.choice_labels, turn?.parsed_blocks?.choice_labels];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate) || candidate.length !== choiceCount) continue;
    const labels = candidate.map(label => typeof label === 'string' ? label.trim() : '');
    if (labels.every(label => Array.from(label).length >= 2 && Array.from(label).length <= 6)
      && new Set(labels).size === labels.length) return labels;
  }
  return [];
}

function choiceSignature(choices) {
  return JSON.stringify(normalizedStrings(choices));
}

function choiceSet(choices, labels) {
  const normalizedChoices = normalizedStrings(choices);
  if (!normalizedChoices.length) return null;
  const normalizedLabels = parsedChoiceLabels({ choice_labels: labels }, {}, normalizedChoices.length);
  return { signature: choiceSignature(normalizedChoices), choices: normalizedChoices, labels: normalizedLabels };
}

function labelsForChoices(choices) {
  const signature = choiceSignature(choices);
  if (currentChoiceSet?.signature === signature && currentChoiceSet.labels.length === normalizedStrings(choices).length) return currentChoiceSet.labels;
  if (committedChoiceSet?.signature === signature && committedChoiceSet.labels.length === normalizedStrings(choices).length) return committedChoiceSet.labels;
  return [];
}

export function parsedTurnNarrative(turn) {
  let parsed;
  if (Array.isArray(turn?.parsed_blocks)) parsed = { blocks: turn.parsed_blocks };
  else if (Array.isArray(turn?.parsed_blocks?.blocks)) parsed = turn.parsed_blocks;
  else parsed = parseNarrative(turn?.story_text ?? '');
  const choices = parsedChoices(turn, parsed);
  return { ...parsed, choices, choice_labels: parsedChoiceLabels(turn, parsed, choices.length) };
}

export function stateDisplayValues(viewModel) {
  const scene = object(viewModel?.scene?.scene_state) ?? {};
  const world = object(viewModel?.scene?.world_state) ?? {};
  const work = workHook(world.work_hook);
  const flow = localizedValue(scene.focus_thread) || localizedValue(scene.beat);
  return {
    장소: localizedValue(scene.location_label || scene.location_id),
    업무: work,
    목표: localizedValue(scene.scene_goal),
    흐름: flow && flow !== work ? flow : '',
    활성규정: Array.isArray(viewModel?.scene?.csa_active) ? String(viewModel.scene.csa_active.length) : ''
  };
}

export function choiceLabel(choice, maxLength = 5, explicitLabel = '') {
  const label = typeof explicitLabel === 'string' ? explicitLabel.trim() : '';
  if (Array.from(label).length >= 2 && Array.from(label).length <= 6) return label;
  const value = String(choice ?? '')
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/[“”"'()[\]{}.,!?…·:;\s]/g, '')
    .trim();
  return Array.from(value || '선택').slice(0, Math.max(1, maxLength)).join('');
}

function renderNarrativeChoices(container, choices, labels = []) {
  const normalized = normalizedStrings(choices);
  if (!container || normalized.length === 0) return;
  const section = document.createElement('section'); section.className = 'narrative-choices';
  const heading = document.createElement('h3'); heading.textContent = '선택지';
  const list = document.createElement('ol');
  for (const [index, choice] of normalized.entries()) {
    const item = document.createElement('li'); item.textContent = choice;
    if (labels[index]) item.dataset.choiceLabel = labels[index];
    list.append(item);
  }
  section.append(heading, list); container.append(section);
}

export function renderNarrative(container, parsed) {
  if (!container) return;
  container.replaceChildren();
  const choices = normalizedStrings(parsed?.choices);
  const labels = parsedChoiceLabels({ choice_labels: parsed?.choice_labels }, {}, choices.length);
  if (container.id === 'current-story') currentChoiceSet = choiceSet(choices, labels);
  let embeddedChoices = false;
  for (const block of parsed?.blocks ?? []) {
    if (block.type === 'choices') {
      renderNarrativeChoices(container, block.choices ?? choices, block.choice_labels ?? labels);
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
  if (!embeddedChoices) renderNarrativeChoices(container, choices, labels);
}

export function renderChoices(container, choices, { busy = false, onChoose } = {}) {
  if (!container) return;
  container.replaceChildren();
  const normalized = normalizedStrings(choices);
  const labels = labelsForChoices(normalized);
  for (const [index, choice] of normalized.entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button';
    button.textContent = `${index + 1} ${choiceLabel(choice, 5, labels[index])}`;
    button.title = choice;
    button.ariaLabel = `${index + 1}번 선택지: ${choice}`;
    button.disabled = busy;
    button.addEventListener('click', () => onChoose?.(choice)); container.append(button);
  }
}

export function renderHistory(container, turns, { showSummary = container?.id !== 'story-history' } = {}) {
  if (!container) return;
  container.replaceChildren();
  const parsedTurns = (turns ?? []).map(turn => ({ turn, parsed: parsedTurnNarrative(turn) }));
  if (container.id === 'story-history') {
    const latest = parsedTurns.at(-1)?.parsed;
    committedChoiceSet = latest ? choiceSet(latest.choices, latest.choice_labels) : null;
  }
  for (const { turn, parsed } of parsedTurns) {
    const card = document.createElement('article'); card.className = 'turn-card';
    const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.player_action ?? '이전 행동';
    const narrative = document.createElement('div'); narrative.className = 'turn-narrative';
    card.append(action, narrative); renderNarrative(narrative, parsed);
    if (showSummary && turn.turn_summary) {
      const summary = document.createElement('p'); summary.className = 'turn-summary'; summary.textContent = turn.turn_summary; card.append(summary);
    }
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

function normalizedMindEntries(value) {
  if (Array.isArray(value)) {
    return value.filter(entry => object(entry) && (displayValue(entry.surface).trim() || displayValue(entry.subconscious).trim()));
  }
  const source = object(value) ?? {};
  const direct = mindMonitorDisplay(source);
  if (direct.length) return [{ id: '', name: '', surface: direct.find(([label]) => label === '표면의식')?.[1] ?? '', subconscious: direct.find(([label]) => label === '잠재의식')?.[1] ?? '' }];
  return Object.entries(source).filter(([, entry]) => object(entry)).map(([id, entry]) => ({
    id,
    name: id,
    surface: displayValue(entry.surface ?? entry['표면의식']),
    subconscious: displayValue(entry.subconscious ?? entry.latent ?? entry['잠재의식'])
  })).filter(entry => entry.surface || entry.subconscious);
}

function renderMindEntry(container, entry) {
  const body = document.createElement('div'); body.className = 'mind-monitor-body';
  for (const [label, value] of [['표면의식', entry.surface], ['잠재의식', entry.subconscious]]) {
    const card = document.createElement('section'); card.className = 'mind-card';
    const heading = document.createElement('h3'); heading.textContent = label;
    const detail = document.createElement('p'); detail.textContent = value || '이번 턴에는 확인할 수 없습니다.';
    card.append(heading, detail); body.append(card);
  }
  container.append(body);
}

export function renderMindMonitor(container, monitor, { preferredId = '' } = {}) {
  if (!container) return;
  container.replaceChildren();
  const entries = normalizedMindEntries(monitor);
  if (!entries.length) {
    container.dataset.selectedCharacterId = '';
    const empty = document.createElement('p'); empty.className = 'mind-monitor-empty'; empty.textContent = '이번 턴 Mind Monitor 정보가 없습니다.';
    container.append(empty);
    return;
  }

  let selected = entries.find(entry => entry.id === preferredId) ?? entries[0];
  container.dataset.selectedCharacterId = selected.id ?? '';
  const bodyHost = document.createElement('div'); bodyHost.className = 'mind-monitor-content';

  const show = entry => {
    selected = entry;
    container.dataset.selectedCharacterId = entry.id ?? '';
    bodyHost.replaceChildren();
    renderMindEntry(bodyHost, entry);
  };

  if (entries.length > 1) {
    const tabs = document.createElement('div'); tabs.className = 'mind-monitor-tabs'; tabs.setAttribute?.('role', 'tablist');
    for (const entry of entries) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'mind-monitor-tab';
      button.textContent = entry.name || entry.id;
      button.dataset.characterId = entry.id;
      button.ariaSelected = entry.id === selected.id ? 'true' : 'false';
      button.addEventListener('click', () => {
        for (const sibling of tabs.children ?? []) sibling.ariaSelected = sibling === button ? 'true' : 'false';
        show(entry);
      });
      tabs.append(button);
    }
    container.append(tabs);
  }
  container.append(bodyHost);
  show(selected);
}

const POSTURE_SENTENCES = {
  standing: '서 있다', sitting: '앉아 있다', kneeling: '무릎을 꿇고 있다',
  lying: '누워 있다', lying_supine: '바로 누워 있다', lying_prone: '엎드려 있다', side_lying: '옆으로 누워 있다',
  crouching: '몸을 낮추고 있다', walking: '이동하고 있다', leaning: '기대어 있다', bent_forward: '몸을 앞으로 숙이고 있다'
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

function sentence(value) {
  const normalized = displayValue(value).trim().replace(/[.。]$/, '');
  return normalized ? `${normalized}.` : '';
}

export function physicalRelationDisplay(focal, player) {
  const sceneState = object(focal?.scene_state) ?? {};
  const name = displayValue(focal?.name).trim() || displayValue(focal?.id).trim() || '상대';
  const playerPosition = displayValue(player?.position_label).trim();
  const counterpartPosition = displayValue(sceneState.position_label).trim();
  const playerPosture = postureSentence(player?.posture, player?.posture_detail);
  const counterpartPosture = postureSentence(sceneState.posture, sceneState.posture_detail);
  const parts = [];

  if (playerPosition) parts.push(sentence(`플레이어는 ${playerPosition}`));
  else if (playerPosture) parts.push(sentence(`플레이어는 ${playerPosture}`));

  if (counterpartPosition) parts.push(sentence(`${topicName(name)} ${counterpartPosition}`));
  else {
    const relativeRaw = displayValue(sceneState.relative_position).trim();
    const location = localizedValue(sceneState.location_label || player?.location_label);
    const relative = RELATIVE_POSITIONS[relativeRaw] ?? (relativeRaw ? localizedValue(relativeRaw) : (location ? `${location}에서` : ''));
    if (counterpartPosture) parts.push(sentence(`${topicName(name)} ${relative} ${counterpartPosture}`.replace(/\s+/g, ' ')));
    else if (relative) parts.push(sentence(`${topicName(name)} ${relative} 플레이어와 함께 있다`));
  }

  return parts.filter(Boolean).join(' ') || '현재 자세 정보가 없습니다.';
}

function renderFocalCharacter(container, focal, player) {
  if (!container) return;
  const hasPhysicalState = Boolean(focal?.name || focal?.id || focal?.scene_state?.posture || focal?.scene_state?.position_label || player?.posture || player?.position_label);
  if (!hasPhysicalState) { container.hidden = true; container.replaceChildren(); return; }
  container.hidden = false; container.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = '현재 자세';
  const relation = document.createElement('p'); relation.className = 'physical-relation'; relation.textContent = physicalRelationDisplay(focal, player);
  container.append(heading, relation);
}

function clothingDisplay(clothing) {
  const source = object(clothing) ?? {};
  if (!Object.keys(source).length) return '';
  return Object.values(source).some(value => value === 'removed' || value === 'open') ? '흐트러짐' : '정상 착용';
}

function playerPositionDisplay(player) {
  return displayValue(player?.position_label).trim()
    || postureSentence(player?.posture, player?.posture_detail)
    || '';
}

function playerProgressDisplay(player) {
  const exp = typeof player?.exp === 'number' ? player.exp : null;
  const next = typeof player?.next_level_exp === 'number' ? player.next_level_exp : null;
  if (exp === null) return '';
  return next === null || next <= 0 ? String(exp) : `${exp} / ${next}`;
}

function renderPlayer(container, player, scene) {
  const activeRules = Array.isArray(player?.active_csa) ? player.active_csa : [];
  const activeCount = typeof player?.active_csa_count === 'number' ? player.active_csa_count : activeRules.length;
  const activeMax = typeof player?.max_active_csa === 'number' ? player.max_active_csa : null;
  const entries = [
    ['이름', displayValue(player?.name)],
    ['소속', [displayValue(player?.department), displayValue(player?.position)].filter(Boolean).join(' · ')],
    ['현재 장소', localizedValue(player?.location_label || scene?.scene_state?.location_label || scene?.scene_state?.location_id)],
    ['현재 자세', playerPositionDisplay(player)],
    ['복장', clothingDisplay(player?.clothing)],
    ['레벨', typeof player?.level === 'number' ? `Lv.${player.level}` : ''],
    ['EXP', playerProgressDisplay(player)],
    ['활성 규정', activeMax === null ? String(activeCount) : `${activeCount} / ${activeMax}`],
    ['흥분도', typeof player?.excitement === 'number' ? String(player.excitement) : ''],
    ['현재 상황', displayValue(player?.status)]
  ];
  activeRules.forEach((rule, index) => {
    const strength = localizedValue(rule?.strength_label || rule?.strength);
    const scope = displayValue(rule?.scope_label) || '회사 전체';
    entries.push([`규정 ${index + 1}${strength ? ` · ${strength}` : ''}`, `${scope} · ${displayValue(rule?.content)}`]);
  });
  definitionList(container, entries);
}

function supplementalElement(elements, key, id) {
  if (elements?.[key]) return elements[key];
  const documentRef = elements?.player?.ownerDocument ?? globalThis.document;
  return documentRef?.getElementById?.(id) ?? null;
}

function renderTextSlot(container, { heading, value, className = '' }) {
  if (!container) return;
  container.replaceChildren();
  container.scrollTop = 0;
  const normalized = displayValue(value).trim();
  if (!normalized) { container.hidden = true; container.className = 'future-slot'; return; }
  container.hidden = false;
  container.className = ['future-slot', className].filter(Boolean).join(' ');
  const title = document.createElement('p'); title.className = 'future-slot-heading'; title.textContent = heading;
  const detail = document.createElement('p'); detail.className = 'future-slot-value'; detail.textContent = normalized; detail.title = normalized; detail.scrollTop = 0;
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
  const duplicateInnerThought = supplementalElement(elements, 'playerInnerThought', 'player-inner-thought');
  if (duplicateInnerThought) {
    duplicateInnerThought.replaceChildren();
    duplicateInnerThought.hidden = true;
    duplicateInnerThought.className = 'future-slot';
  }
  renderTextSlot(supplementalElement(elements, 'gameTime', 'game-time-slot'), {
    heading: '현재 시간', value: display.gameTime, className: 'game-time-card'
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
  const timeBlock = localizedValue(world.time_block);
  text(elements.title, title || '상식개변: 회사편');
  text(elements.turn, `Turn ${model.turn?.committed_turn ?? 0}`);
  text(elements.dayTime, [day ? `Day ${day}` : '', timeBlock].filter(Boolean).join(' · '));
  definitionList(elements.scene, Object.entries(stateDisplayValues(model)));
  renderFocalCharacter(elements.focal, model.focal_character, model.player);
  renderMindMonitor(elements.mind, model.media?.mind_monitor_entries ?? model.media?.mind_monitor, {
    preferredId: model.media?.default_mind_character_id
  });
  renderPlayer(elements.player, model.player, model.scene);
  renderSupplementalPanels(elements, model);
}

import { parseNarrative } from './narrative.js';

export function text(element, value) { if (element) element.textContent = value ?? ''; }

function displayValue(value) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function workHook(value) { return typeof value === 'string' ? value : displayValue(value?.id) || displayValue(value?.status); }
function definitionList(container, entries) {
  if (!container) return;
  container.replaceChildren();
  for (const [label, value] of entries) {
    if (!value) continue;
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; container.append(dt, dd);
  }
}

export function parsedTurnNarrative(turn) {
  if (Array.isArray(turn?.parsed_blocks)) return { blocks: turn.parsed_blocks };
  if (Array.isArray(turn?.parsed_blocks?.blocks)) return turn.parsed_blocks;
  return parseNarrative(turn?.story_text ?? '');
}

export function stateDisplayValues(viewModel) {
  const scene = object(viewModel?.scene?.scene_state) ?? {};
  const world = object(viewModel?.scene?.world_state) ?? {};
  return {
    위치: displayValue(scene.location_id),
    시간: displayValue(world.time_block),
    업무: workHook(world.work_hook),
    초점: displayValue(viewModel?.focal_character?.id),
    목표: displayValue(scene.scene_goal),
    흐름: displayValue(scene.focus_thread) || displayValue(scene.beat),
    최근요약: displayValue(viewModel?.scene?.story_summary_recent),
    활성규정: Array.isArray(viewModel?.scene?.csa_active) ? String(viewModel.scene.csa_active.length) : ''
  };
}

export function choiceLabel(choice, maxLength = 30) {
  const value = String(choice ?? '');
  return Array.from(value).length > maxLength ? `${Array.from(value).slice(0, maxLength).join('')}…` : value;
}

export function renderNarrative(container, parsed) {
  if (!container) return;
  container.replaceChildren();
  for (const block of parsed?.blocks ?? []) {
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
}

export function renderChoices(container, choices, { busy = false, onChoose } = {}) {
  if (!container) return;
  container.replaceChildren();
  for (const [index, choice] of (choices ?? []).entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button';
    button.textContent = `${index + 1}. ${choiceLabel(choice)}`; button.title = choice; button.disabled = busy;
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

function renderFocalCharacter(container, focal) {
  if (!container) return;
  const character = object(focal?.character);
  if (!focal?.id && !focal?.last_speaker_id && !character) { container.hidden = true; container.replaceChildren(); return; }
  container.hidden = false; container.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = '주요 인물'; container.append(heading);
  const values = [['초점', displayValue(focal?.id)], ['마지막 화자', displayValue(focal?.last_speaker_id)]];
  for (const [label, value] of values) { if (!value) continue; const line = document.createElement('p'); line.textContent = `${label}: ${value}`; container.append(line); }
  const sceneState = object(focal?.scene_state) ?? {};
  for (const [label, value] of [['위치', sceneState.location_label], ['자세', sceneState.posture]]) {
    if (!value) continue;
    const line = document.createElement('p'); line.textContent = `${label}: ${value}`; container.append(line);
  }
  const stats = object(character?.stats) ?? {};
  const statLabels = { affinity: '호감도', csa_acceptance: '상식수용도', sexual_arousal: '성적흥분도', work_trust: '업무 신뢰도' };
  for (const [key, label] of Object.entries(statLabels)) {
    if (!(key in stats)) continue;
    const line = document.createElement('p'); line.textContent = `${label}: ${stats[key]}`; container.append(line);
  }
  const relationship = object(character?.relationship) ?? {};
  if (typeof relationship.intimacy_stage === 'string' && relationship.intimacy_stage) {
    const line = document.createElement('p'); line.textContent = `관계 단계: ${relationship.intimacy_stage}`; container.append(line);
  }
  const emotion = object(character?.emotion) ?? {};
  for (const [label, value] of [['표면 감정', emotion.surface], ['속마음', emotion.subconscious]]) {
    if (!value) continue;
    const line = document.createElement('p'); line.textContent = `${label}: ${value}`; container.append(line);
  }
}

function renderPlayer(container, player, scene) {
  const clothing = object(player?.clothing) ?? {};
  const clothingSummary = Object.values(clothing).some(value => value === 'removed' || value === 'open') ? '흐트러짐' : (Object.keys(clothing).length ? '정상 착용' : '');
  definitionList(container, [
    ['이름', displayValue(player?.name)], ['부서', displayValue(player?.department)],
    ['현재 장소', displayValue(player?.location_label) || displayValue(scene?.scene_state?.location_id)],
    ['자세', displayValue(player?.posture)],
    ['복장', clothingSummary],
    ['시간 블록', displayValue(scene?.world_state?.time_block)],
    ['적용 규정', Array.isArray(scene?.csa_active) ? String(scene.csa_active.length) : ''],
    ['상태', displayValue(player?.status)],
    ['속마음', displayValue(player?.inner_thought)],
    ['흥분도', player?.excitement === null ? '' : displayValue(player?.excitement)],
    ['사정 진행도', player?.ejaculation_progress === null ? '' : displayValue(player?.ejaculation_progress)],
    ['누적 사정 횟수', player?.ejaculation_count === null ? '' : displayValue(player?.ejaculation_count)]
  ]);
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
  renderFocalCharacter(elements.focal, model.focal_character);
  renderMindMonitor(elements.mind, model.media?.mind_monitor);
  renderPlayer(elements.player, model.player, model.scene);
}

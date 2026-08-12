import { parseNarrative } from './narrative.js';

export function text(element, value) { if (element) element.textContent = value ?? ''; }

function displayValue(value) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function normalizeNarrativeDisplay(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
export { normalizeNarrativeDisplay };

/**
 * 플레이어 속마음 표시 전용 최소 정규화 — 문장부호 자동 개행 없음, 모델 줄바꿈 유지.
 * - 각 줄 앞뒤 공백 제거
 * - 줄 전체가 "." / ".." / "..." / "·" / "-" 뿐이면 삭제
 * - 연속 빈 줄은 최대 한 줄로 축소
 * - 바깥쪽 불필요한 따옴표 제거
 */
function normalizeInnerThought(value) {
  const trimmed = String(value ?? '').replace(/^["“”']+|["“”']+$/gu, '');
  const lines = trimmed.split('\n').map(line => line.trim());
  const cleaned = lines.filter(line => !/^[.．·\-–—]{1,4}$/u.test(line));
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
export { normalizeInnerThought };

function dataAttributeName(key) {
  return `data-${String(key).replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
}

function setDataValue(node, key, value) {
  if (node?.dataset) node.dataset[key] = value;
  else node?.setAttribute?.(dataAttributeName(key), value);
}

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
const STAT_LABELS = {
  affinity: '호감', csa_acceptance: '수용', sexual_arousal: '흥분', resistance: '저항'
};
const SEXUAL_ACTION_LABELS = {
  none: '기타', kiss: '키스', sexual_touch: '성적 접촉', genital_exposure: '성기 노출',
  genital_touch: '성기 자극', oral: '구강 행위', penetration: '삽입', orgasm: '절정'
};

let currentChoiceSet = null;
let committedChoiceSet = null;

// Commit 직후 확정 수치 옆에 잠시(+N/-N) 표시하기 위한 일시 delta 상태.
// 데이터 출처는 서버 Commit 응답의 turn_changes뿐 (프론트 계산기 없음).
// replayed Commit은 세팅하지 않으며, 2~3초 뒤 render()가 빈 상태로 덮어쓴다.
let committedStatDeltas = {};

/** Commit 응답 turn_changes → {npcId: {statKey: delta}} (일시 표시용, app.js에서 호출). */
export function setCommittedStatDeltas(deltas) {
  committedStatDeltas = deltas;
}

function localizedValue(value) {
  const raw = displayValue(value).trim();
  if (!raw) return '';
  return DISPLAY_LABELS[raw] ?? (/^[a-z0-9_:-]+$/i.test(raw) ? '' : raw);
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
    if (labels[index]) setDataValue(item, 'choiceLabel', labels[index]);
    list.append(item);
  }
  section.append(heading, list); container.append(section);
}

// 대사칸 왼쪽 바 색: 플레이어=파랑, 히로인 5명=각각, 기타 NPC=기본(검정)
function dialogueToneClass(speakerId) {
  const id = String(speakerId ?? '');
  if (id === 'player') return 'speaker-player';
  const heroine = /^heroine([1-9])$/.exec(id);
  if (heroine) return `speaker-heroine${heroine[1]}`;
  return '';
}

export function renderNarrative(container, parsed) {
  if (!container) return;
  container.replaceChildren();
  const choices = normalizedStrings(parsed?.choices);
  const labels = parsedChoiceLabels({ choice_labels: parsed?.choice_labels }, {}, choices.length);
  if (container.id === 'current-story') currentChoiceSet = choiceSet(choices, labels);
  let lastDialogueCard = null;
  for (const block of parsed?.blocks ?? []) {
    // THOUGHT and CHOICE are footer blocks.  Their raw blocks remain part of
    // the parsed projection, but the narrative body renders each canonical
    // value once below so mid-story/duplicate blocks cannot become paragraphs.
    if (block.type === 'player_inner_thought' || block.type === 'choice' || block.type === 'choices') continue;
    if (block.type === 'dialogue') {
      // 같은 화자가 연속으로 말하면 한 대사칸에 이어 붙인다
      if (lastDialogueCard && lastDialogueCard.dataset?.speakerId === block.speaker_id) {
        const line = lastDialogueCard.querySelector('.dialogue-text');
        if (line) line.textContent += `\n${block.text}`;
        continue;
      }
      const card = document.createElement('article'); card.className = 'narrative-dialogue dialogue-card';
      if (block.speaker_id) setDataValue(card, 'speakerId', block.speaker_id);
      const speakerTone = dialogueToneClass(block.speaker_id);
      if (speakerTone) card.classList.add(speakerTone);
      const meta = document.createElement('header'); meta.className = 'dialogue-meta';
      const speaker = document.createElement('strong'); speaker.className = 'dialogue-speaker'; speaker.textContent = block.speaker ?? block.speaker_name ?? '';
      const direction = document.createElement('span'); direction.className = 'dialogue-direction'; direction.textContent = normalizeNarrativeDisplay(block.direction ?? '');
      const line = document.createElement('p'); line.className = 'dialogue-text'; line.textContent = normalizeNarrativeDisplay(block.text ?? '');
      meta.append(speaker, direction); card.append(meta, line); container.append(card);
      lastDialogueCard = card;
      continue;
    }
    lastDialogueCard = null;
    const paragraph = document.createElement('p'); paragraph.className = `narrative-${block.type ?? 'unparsed'}`;
    paragraph.textContent = normalizeNarrativeDisplay(block.text ?? '');
    container.append(paragraph);
  }
  // Canonical footer projection: one thought card, followed by one narrative
  // choice box.  Missing thought/partial choices remain observable in the
  // parsed result and are handled as soft completeness warnings.
  const thought = normalizeInnerThought(displayValue(parsed?.player_inner_thought));
  if (thought) {
    const paragraph = document.createElement('p');
    paragraph.className = 'narrative-player_inner_thought';
    paragraph.textContent = thought;
    container.append(paragraph);
  }
  renderNarrativeChoices(container, choices, labels);
}

export function renderChoices(container, choices, { busy = false, onChoose } = {}) {
  if (!container) return;
  container.replaceChildren();
  const normalized = normalizedStrings(choices);
  const labels = labelsForChoices(normalized);
  for (const [index, choice] of normalized.entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button';
    const compact = choiceLabel(choice, 5, labels[index]);
    button.textContent = labels[index] ? `${index + 1} ${compact}` : compact;
    button.title = choice;
    button.ariaLabel = `${index + 1}번 선택지: ${choice}`;
    button.disabled = busy;
    button.addEventListener('click', () => onChoose?.(choice)); container.append(button);
  }
}

export function renderHistory(container, turns, { showSummary = true, collapsible = false } = {}) {
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
      const summary = document.createElement('p'); summary.className = 'turn-summary'; summary.textContent = turn.turn_summary; summary.setAttribute?.('aria-label', '요약 기록 ·');
      if (container.id === 'story-history') narrative.append(summary);
      else card.append(summary);
    }
    // 병원편 스타일 상세보기: 모달에서 턴 요약은 펼쳐 두고 세부(속마음/선택지/원문)는 접기
    if (collapsible) {
      appendCollapsibleSection(card, '💭 플레이어 속마음', displayValue(turn.player_inner_thought) || parsed?.player_inner_thought);
      const choiceItems = (parsed?.choices ?? []).map((c, i) => `${i + 1}. ${c}`).join('\n');
      appendCollapsibleSection(card, '🔀 선택지', choiceItems);
      appendCollapsibleSection(card, '📄 원문', displayValue(turn.story_text));
    }
    container.append(card);
  }
}

function appendCollapsibleSection(card, title, value) {
  const textValue = String(value ?? '').trim();
  if (!textValue) return;
  const details = document.createElement('details'); details.className = 'history-detail-section';
  const summary = document.createElement('summary'); summary.textContent = title;
  const body = document.createElement('div'); body.className = 'history-detail-body';
  body.textContent = textValue;
  details.append(summary, body);
  card.append(details);
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
  if (Array.isArray(value)) return value.filter(entry => object(entry) && entry.id);
  const source = object(value) ?? {};
  const direct = mindMonitorDisplay(source);
  if (direct.length) return [{ id: '', name: '', surface: direct.find(([label]) => label === '표면의식')?.[1] ?? '', subconscious: direct.find(([label]) => label === '잠재의식')?.[1] ?? '', stats: {}, stat_changes: {} }];
  return Object.entries(source).filter(([, entry]) => object(entry)).map(([id, entry]) => ({
    id,
    name: id,
    surface: displayValue(entry.surface ?? entry['표면의식']),
    subconscious: displayValue(entry.subconscious ?? entry.latent ?? entry['잠재의식']),
    stats: object(entry.stats) ?? {},
    stat_changes: object(entry.stat_changes) ?? {}
  })).filter(entry => entry.surface || entry.subconscious || Object.keys(entry.stats).length);
}

function statDisplay(entry, key) {
  const value = Number(entry?.stats?.[key]);
  // 증감 표시는 Commit 직후 일시 delta(committedStatDeltas)만 사용한다.
  // context.character_details.stat_changes는 최신 턴마다 재생성되므로 fallback으로
  // 쓰면 +N/-N이 계속 남는다 — 실시간 패널에는 사용하지 않는다.
  const committedDelta = Number(committedStatDeltas?.[entry?.id]?.[key]);
  return {
    value: Number.isFinite(value) ? value : null,
    delta: Number.isFinite(committedDelta) && committedDelta !== 0 ? committedDelta : null
  };
}

function renderStatStrip(container, entry) {
  const stats = document.createElement('div'); stats.className = 'mind-stat-strip';
  for (const key of Object.keys(STAT_LABELS)) {
    const display = statDisplay(entry, key);
    const item = document.createElement('span'); item.className = 'mind-stat';
    const label = document.createElement('small'); label.textContent = STAT_LABELS[key];
    const value = document.createElement('strong'); value.textContent = display.value === null ? '-' : String(display.value);
    item.append(label, value);
    if (display.delta !== null) {
      const delta = document.createElement('small');
      delta.className = display.delta > 0 ? 'delta-up' : 'delta-down';
      delta.textContent = `${display.delta > 0 ? '+' : ''}${display.delta}`;
      item.append(delta);
    }
    stats.append(item);
  }
  container.append(stats);
}

function renderMindEntry(container, entry) {
  renderStatStrip(container, entry);
  const body = document.createElement('div'); body.className = 'mind-monitor-body';
  for (const [label, value] of [['표면의식', entry.surface], ['잠재의식', entry.subconscious]]) {
    const card = document.createElement('section'); card.className = 'mind-line';
    const heading = document.createElement('h4'); heading.textContent = label;
    const detail = document.createElement('p'); detail.textContent = value || '이번 턴에는 확인할 수 없습니다.';
    card.append(heading, detail); body.append(card);
  }
  container.append(body);
  const name = displayValue(entry.name) || displayValue(entry.id);
  if (name && !container.querySelector?.('.mind-monitor-name')) {
    const nameHeading = document.createElement('h3'); nameHeading.className = 'mind-monitor-name'; nameHeading.textContent = name;
    container.append(nameHeading);
  }
}

export function renderMindMonitor(container, monitor, { preferredId = '' } = {}) {
  if (!container) return;
  container.replaceChildren();
  const entries = normalizedMindEntries(monitor);
  if (!entries.length) {
    setDataValue(container, 'selectedCharacterId', '');
    const empty = document.createElement('p'); empty.className = 'mind-monitor-empty'; empty.textContent = '이번 턴 Mind Monitor 정보가 없습니다.';
    container.append(empty);
    return;
  }

  let selected = entries.find(entry => entry.id === preferredId) ?? entries[0];
  setDataValue(container, 'selectedCharacterId', selected.id ?? '');
  const bodyHost = document.createElement('div'); bodyHost.className = 'mind-monitor-content';

  const show = entry => {
    selected = entry;
    setDataValue(container, 'selectedCharacterId', entry.id ?? '');
    bodyHost.replaceChildren();
    renderMindEntry(bodyHost, entry);
  };

  if (entries.length > 1) {
    const tabs = document.createElement('div'); tabs.className = 'mind-monitor-tabs'; tabs.setAttribute?.('role', 'tablist');
    for (const entry of entries) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'mind-monitor-tab';
      button.textContent = entry.name || entry.id;
      setDataValue(button, 'characterId', entry.id);
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
  return POSTURE_SENTENCES[raw] ?? localizedValue(raw).replace(/[.。]$/, '');
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

  // 정보가 없으면 문구로 채우지 않고 빈 문자열을 반환한다 —
  // 렌더러가 해당 줄 자체를 표시하지 않도록 한다(사용자 요구).
  return parts.filter(Boolean).join(' ');
}

function recordValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function detailsSection(title, rows, className = '') {
  const section = document.createElement('section');
  section.className = ['character-detail-section', className].filter(Boolean).join(' ');
  const heading = document.createElement('h3'); heading.textContent = title;
  const list = document.createElement('dl'); list.className = 'state-list character-detail-list';
  definitionList(list, rows);
  section.append(heading, list);
  return section;
}

// 관계 서사 요약은 2열 grid에 넣으면 긴 문장이 레이아웃을 깨므로 별도 전체 폭 섹션으로
// 관계·사정 기록이 실제 값(이벤트 1+ 또는 기록 턴 존재)을 가질 때만 표시한다.
// 전부 0이고 기록 턴도 없으면 섹션 자체를 만들지 않는다(사용자 요구).
function hasRelationshipRecord(record) {
  const counts = [
    record.player_ejaculation_count, record.npc_orgasm_count,
    record.vaginal_sex_count, record.anal_sex_count, record.oral_sex_count,
    record.vaginal_ejaculation_count, record.anal_ejaculation_count, record.oral_ejaculation_count,
    record.facial_ejaculation_count, record.body_ejaculation_count, record.total_events
  ];
  return counts.some(value => recordValue(value) >= 1)
    || Number.isInteger(record.first_event_turn)
    || Number.isInteger(record.last_event_turn);
}

function renderRelationshipRecord(container, character) {
  const record = object(character?.relationship_record) ?? {};
  if (!hasRelationshipRecord(record)) return;
  container.append(detailsSection('관계·사정 기록', [
    ['플레이어 사정', `${recordValue(record.player_ejaculation_count)}회`],
    ['NPC 절정', `${recordValue(record.npc_orgasm_count)}회`],
    ['질 성교', `${recordValue(record.vaginal_sex_count)}회`],
    ['애널 성교', `${recordValue(record.anal_sex_count)}회`],
    ['구강 성교', `${recordValue(record.oral_sex_count)}회`],
    ['질내 사정', `${recordValue(record.vaginal_ejaculation_count)}회`],
    ['애널내 사정', `${recordValue(record.anal_ejaculation_count)}회`],
    ['입안 사정', `${recordValue(record.oral_ejaculation_count)}회`],
    ['얼굴 사정', `${recordValue(record.facial_ejaculation_count)}회`],
    ['몸 사정', `${recordValue(record.body_ejaculation_count)}회`],
    ['성적 이벤트', `${recordValue(record.total_events)}건`],
    ['완료/중단', `${recordValue(record.completed_events)} / ${recordValue(record.interrupted_events)}`],
    ['첫 기록', Number.isInteger(record.first_event_turn) ? `${record.first_event_turn}턴` : '없음'],
    ['최근 기록', Number.isInteger(record.last_event_turn) ? `${record.last_event_turn}턴` : '없음']
  ]));
}

function renderPrivateInfo(container, character) {
  const privateInfo = object(character?.private_info) ?? { unlocked: false };
  // 잠금 상태의 빈 안내 섹션은 만들지 않는다 — 실제로 해금됐을 때만 표시(사용자 요구).
  if (privateInfo.unlocked !== true) return;
  container.append(detailsSection('은밀정보', [
    ['유두', displayValue(privateInfo.nipple)],
    ['유륜 크기', displayValue(privateInfo.areola_size)],
    ['유륜 색', displayValue(privateInfo.areola_color)],
    ['음모 상태', displayValue(privateInfo.pubic_hair)],
    ['과거 남성 경험', privateInfo.past_partner_count === null || privateInfo.past_partner_count === undefined ? '' : `${privateInfo.past_partner_count}명`],
    ['과거 절정 경험', privateInfo.past_orgasm_count === null || privateInfo.past_orgasm_count === undefined ? '' : `${privateInfo.past_orgasm_count}회`],
    ['연인 관계', displayValue(privateInfo.relationship)],
    ['은밀 메모', displayValue(privateInfo.intimate_notes)]
  ], 'private-info-unlocked'));
}

function renderInteractingAttire(container, characters) {
  const entries = Array.isArray(characters) ? characters.filter(character => object(character) && character.id) : [];
  if (!entries.length) return false;
  container.append(detailsSection('상호작용 인물 착의', entries.map(character => [
    displayValue(character.name) || displayValue(character.id),
    clothingDisplay(character.scene_state?.clothing) || '확인되지 않음'
  ]), 'interacting-attire-section'));
  return true;
}

export function renderFocalCharacter(container, focal, player, interactingCharacters = []) {
  if (!container) return;
  const character = object(focal?.character) ?? {};
  const hasInteracting = Array.isArray(interactingCharacters) && interactingCharacters.length > 0;
  const hasState = Boolean(hasInteracting || focal?.name || focal?.id || focal?.scene_state?.posture || focal?.scene_state?.position_label || player?.posture || player?.position_label || Object.keys(character).length);
  if (!hasState) { container.hidden = true; container.replaceChildren(); return; }
  container.hidden = false; container.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = focal?.name ? `${focal.name} 현재 상태` : '현재 캐릭터 상태';
  container.append(heading);
  const attireRosterShown = renderInteractingAttire(container, interactingCharacters);
  // 자세 정보가 실제로 있을 때만 자세 문단을 추가한다 (빈 문구 노출 방지).
  const relationText = physicalRelationDisplay(focal, player);
  if (relationText) {
    const relation = document.createElement('p'); relation.className = 'physical-relation'; relation.textContent = relationText;
    container.append(relation);
  }
  // 상호작용 인물 roster가 없을 때만 포컬 착의를 여기서 표시한다. 중복 표시 금지.
  const currentRows = [];
  if (!attireRosterShown) currentRows.push(['현재 착의', clothingDisplay(focal?.scene_state?.clothing) || '확인되지 않음']);
  currentRows.push(
    ['현재 자세', postureSentence(
      focal?.scene_state?.posture,
      focal?.scene_state?.posture_detail
    ) || '확인되지 않음'],
    ['현재 위치', displayValue(focal?.scene_state?.position_label) || '확인되지 않음']
  );
  container.append(detailsSection('현재 상태', currentRows));
  if (Object.keys(character).length) {
    renderStatStrip(container, { id: focal?.id ?? character?.id, stats: character.stats, stat_changes: character.stat_changes });
    const profile = object(character.profile) ?? {};
    const body = object(character.body) ?? {};
    container.append(detailsSection('인물정보', [
      ['나이', profile.age === null || profile.age === undefined ? '' : `${profile.age}세`],
      ['소속', displayValue(profile.department)],
      ['직급', displayValue(profile.position)],
      ['역할', displayValue(profile.role)],
      ['근속', displayValue(profile.company_tenure)],
      ['키', body.height_cm === null || body.height_cm === undefined ? '' : `${body.height_cm}cm`],
      ['몸무게', body.weight_kg === null || body.weight_kg === undefined ? '' : `${body.weight_kg}kg`],
      ['체형', displayValue(body.body_type)],
      ['가슴', displayValue(body.cup)]
    ]));
    renderRelationshipRecord(container, character);
    renderPrivateInfo(container, character);
  }
}

const LEGACY_CLOTHING_LABELS = {
  uniform_top: '상의', uniform_bottom: '하의', underwear_top: '상의 속옷', underwear_bottom: '하의 속옷',
  worn: '착용', removed: '벗음', open: '풀어 둠'
};

function clothingDisplay(clothing) {
  const source = object(clothing) ?? {};
  return Object.entries(source).flatMap(([key, value]) => {
    const label = LEGACY_CLOTHING_LABELS[key] ?? localizedValue(key);
    const state = LEGACY_CLOTHING_LABELS[value] ?? localizedValue(value);
    return label && state ? [`${label} ${state}`] : [];
  }).join(' · ');
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

function sexualEventDisplay(event) {
  const source = object(event);
  if (!source) return '';
  const type = SEXUAL_ACTION_LABELS[source.type] ?? localizedValue(source.type);
  const turn = Number.isInteger(source.turn) ? `${source.turn}턴` : '';
  const status = source.completed === true ? '완료' : source.interrupted === true ? '중단' : '';
  return [turn, type, status].filter(Boolean).join(' · ');
}

// 플레이어 발기 상태 표시 (지시 22) — unknown → 확인되지 않음.
const ERECTION_LABELS = { unknown: '확인되지 않음', flaccid: '이완', partial: '부분 발기', erect: '발기' };
function erectionDisplay(state) {
  return ERECTION_LABELS[state] ?? '확인되지 않음';
}

function renderPlayer(container, player, scene) {
  // 상식개변 칸은 매 렌더링마다 새로 그리므로, 이전에 붙인 중복 섹션을 먼저 제거한다
  (container.parentElement ?? container)?.querySelector?.('.player-active-rules')?.remove();
  const activeRules = Array.isArray(player?.active_csa) ? player.active_csa : [];
  const activeCount = typeof player?.active_csa_count === 'number' ? player.active_csa_count : activeRules.length;
  const activeMax = typeof player?.max_active_csa === 'number' ? player.max_active_csa : null;
  const compact = container.parentElement?.querySelector?.('#player-compact-summary');
  if (compact) compact.textContent = [typeof player?.level === 'number' ? `Lv.${player.level}` : '', `규정 ${activeMax === null ? activeCount : `${activeCount}/${activeMax}`}`].filter(Boolean).join(' · ');
  const entries = [
    ['이름', displayValue(player?.name)],
    ['소속', [displayValue(player?.department), displayValue(player?.position)].filter(Boolean).join(' · ')],
    ['현재 장소', localizedValue(player?.location_label || scene?.scene_state?.location_label || scene?.scene_state?.location_id)],
    ['현재 자세', playerPositionDisplay(player)],
    ['복장', clothingDisplay(player?.clothing) || '확인되지 않음'],
    ['레벨', typeof player?.level === 'number' ? `Lv.${player.level}` : ''],
    ['EXP', playerProgressDisplay(player)],
    ['활성 규정', activeMax === null ? String(activeCount) : `${activeCount} / ${activeMax}`],
    ['흥분도', typeof player?.excitement === 'number' ? String(player.excitement) : ''],
    ['발기 상태', erectionDisplay(player?.erection_state)],
    ['누적 사정', typeof player?.ejaculation_count === 'number' ? `${player.ejaculation_count}회` : '0회'],
    ['성적 이벤트', typeof player?.total_sexual_events === 'number' ? `${player.total_sexual_events}건` : '0건'],
    ['최근 성적 기록', sexualEventDisplay(player?.last_sexual_event) || '없음']
  ];
  definitionList(container, entries);
  // 상식개변(활성 규정)은 별도 칸 — 2열 그리드에 넣으면 내용이 잘리므로 분리
  if (activeRules.length) {
    const section = document.createElement('section');
    section.className = 'player-active-rules';
    const heading = document.createElement('h3');
    heading.textContent = '상식개변';
    section.append(heading);
    const list = document.createElement('ul');
    activeRules.forEach((rule, index) => {
      const strength = localizedValue(rule?.strength_label || rule?.strength);
      const authority = displayValue(rule?.authority_label);
      const scope = displayValue(rule?.scope_label) || '회사 전체';
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = [`규정 ${index + 1}`, strength].filter(Boolean).join(' · ');
      const body = document.createElement('span');
      body.textContent = [authority, scope, displayValue(rule?.content)].filter(Boolean).join(' · ');
      li.append(title, body);
      list.append(li);
    });
    section.append(list);
    // dl(#player-situation) 안에 넣으면 2열 grid 아이템이 되어 좁은 칸에 찌그러진다.
    // dl 바로 뒤(부모 패널)에 배치해 전체 폭을 사용한다.
    container.after?.(section) ?? container.parentElement?.append(section);
  }
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
  const gameTime = object(world.game_time) ?? {};
  const day = displayValue(gameTime.day ?? world.day ?? world.day_index);
  const clock = formatClock(gameTime.minute_of_day);
  const progress = progressValue(model.player?.ejaculation_progress);
  const count = typeof model.player?.ejaculation_count === 'number' && Number.isFinite(model.player.ejaculation_count)
    ? model.player.ejaculation_count
    : null;
  return {
    innerThought: displayValue(model.player?.inner_thought),
    gameTime: [day ? `Day ${day}` : '', clock].filter(Boolean).join(' · '),
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
    heading: '요약 기록', value: display.turnSummary, className: 'turn-change-card'
  });
}

function formatClock(minuteOfDay) {
  if (!Number.isInteger(minuteOfDay) || minuteOfDay < 0) return '';
  const hour = Math.floor(minuteOfDay / 60);
  const minute = String(minuteOfDay % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function renderState(elements, viewModel, { title = '상식개변: 회사편' } = {}) {
  const model = viewModel ?? {};
  const world = object(model.scene?.world_state) ?? {};
  const gameTime = object(world.game_time) ?? {};
  const day = displayValue(gameTime.day ?? world.day ?? world.day_index);
  const clock = formatClock(gameTime.minute_of_day);
  text(elements.title, title || '상식개변: 회사편');
  text(elements.turn, `Turn ${model.turn?.committed_turn ?? 0}`);
  text(elements.dayTime, [day ? `Day ${day}` : '', clock].filter(Boolean).join(' · '));
  // scene-state: 활성 규정은 플레이어 상태창으로 통합되어 여기선 비움 (중복 방지)
  renderFocalCharacter(elements.focal, model.focal_character, model.player, model.interacting_characters);
  renderMindMonitor(elements.mind, model.media?.mind_monitor_entries ?? model.media?.mind_monitor, {
    preferredId: model.media?.default_mind_character_id
  });
  renderPlayer(elements.player, model.player, model.scene);
  renderSupplementalPanels(elements, model);
}

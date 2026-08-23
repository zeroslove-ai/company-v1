// High-parity presentation transplant boundary. These helpers only turn
// committed R3 data into donor-shaped DOM; they never classify or mutate play.
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function displayValue(value) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
export function text(element, value) { if (element) element.textContent = value ?? ''; }
export function normalizeNarrativeDisplay(value) { return String(value ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }

function strings(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : []; }
function canonicalChoices(value) {
  const choices = strings(value);
  return choices.length === 4 ? choices : [];
}
export function narrativeChoiceItems(choices) { return canonicalChoices(choices); }
function normalizeInnerThought(value) { return String(value ?? '').replace(/^["“”']+|["“”']+$/gu, '').split('\n').map(line => line.trim()).filter(line => !/^[.．·\-–—]{1,4}$/u.test(line)).join('\n').replace(/\n{3,}/g, '\n\n').trim(); }
export function renderPlayerInnerThought(container, thought) {
  if (!container) return;
  const value = normalizeInnerThought(thought);
  container.replaceChildren();
  container.hidden = !value;
  if (!value) return;
  const heading = document.createElement('h3'); heading.className = 'future-slot-heading'; heading.textContent = '플레이어 속마음';
  const body = document.createElement('p'); body.className = 'future-slot-value'; body.textContent = value;
  container.append(heading, body);
}

function choiceTail(lines) {
  const last = lines.length - 1; let index = last;
  while (index >= 0 && !lines[index].trim()) index -= 1;
  const found = [];
  for (let number = 4; number >= 1; number -= 1) {
    const match = index >= 0 ? /^\s*([1-4])[.)]\s+(.+?)\s*$/.exec(lines[index]) : null;
    if (!match || Number(match[1]) !== number) return null;
    found.unshift(match[2]); index -= 1;
    while (index >= 0 && !lines[index].trim()) index -= 1;
  }
  return { choices: found, end: index };
}

/**
 * Presentation-only adapter for plain Story. It recognizes only unambiguous
 * quoted dialogue and strips a terminal four-line choice tail supplied by the
 * server. Unknown text is preserved as narration; failure returns raw text.
 */
export function parsePlainStoryForPresentation(storyText, { choices = [], actorNames = {} } = {}) {
  const raw = normalizeNarrativeDisplay(storyText);
  const lines = raw ? raw.split('\n') : [];
  const tail = choiceTail(lines);
  const canonical = canonicalChoices(choices);
  const bodyLines = tail && canonical.length === 4 ? lines.slice(0, tail.end + 1) : lines;
  const blocks = [];
  let paragraph = [];
  const flush = () => { const value = normalizeNarrativeDisplay(paragraph.join('\n')); if (value) blocks.push({ type: 'scene', text: value }); paragraph = []; };
  for (const line of bodyLines) {
    const quoted = /^\s*(.{1,40}?)\s*(?:\(([^()\n]{1,80})\)\s*)?:\s*["“](.+?)["”]\s*$/.exec(line);
    const speaker = quoted?.[1]?.trim();
    const direction = quoted?.[2]?.trim() ?? '';
    const known = speaker && (!Object.keys(actorNames).length || Object.values(actorNames).includes(speaker) || speaker === '나' || speaker === '플레이어');
    if (quoted && known) { flush(); blocks.push({ type: 'dialogue', speaker, direction, text: quoted[3].trim() }); }
    else if (line.trim()) paragraph.push(line);
    else flush();
  }
  flush();
  return { raw, blocks, choices: canonical, fallback: Boolean(raw && (!blocks.length || (blocks.length === 1 && blocks[0].type === 'scene' && !tail))) };
}

export function renderNarrative(container, presentation) {
  if (!container) return;
  container.replaceChildren();
  const model = presentation?.raw !== undefined ? presentation : parsePlainStoryForPresentation(presentation?.story_text ?? presentation ?? '', presentation ?? {});
  if (!model.raw) return;
  for (const block of model.blocks) {
    if (block.type === 'dialogue') {
      const card = document.createElement('article'); card.className = 'narrative-dialogue dialogue-card';
      const meta = document.createElement('header'); meta.className = 'dialogue-meta';
      const speaker = document.createElement('strong'); speaker.className = 'dialogue-speaker'; speaker.textContent = block.speaker;
      meta.append(speaker);
      if (block.direction) { const direction = document.createElement('span'); direction.className = 'dialogue-direction'; direction.textContent = block.direction; meta.append(direction); }
      const line = document.createElement('p'); line.className = 'dialogue-text'; line.textContent = normalizeNarrativeDisplay(block.text);
      card.append(meta, line); container.append(card);
    } else {
      const paragraph = document.createElement('p'); paragraph.className = 'narrative-scene'; paragraph.textContent = normalizeNarrativeDisplay(block.text); container.append(paragraph);
    }
  }
  if (!model.blocks.length) { const fallback = document.createElement('p'); fallback.className = 'narrative-raw-story'; fallback.textContent = model.raw; container.append(fallback); }
  const choices = narrativeChoiceItems(model.choices);
  if (choices.length === 4) {
    const section = document.createElement('section'); section.className = 'narrative-choices';
    const heading = document.createElement('h3'); heading.textContent = '선택지';
    const list = document.createElement('ol');
    for (const [index, choice] of choices.entries()) {
      const item = document.createElement('li'); item.className = 'narrative-choice-item'; item.textContent = choice;
      item.dataset.choiceIndex = String(index); item.dataset.choiceLiteral = choice; list.append(item);
    }
    section.append(heading, list); container.append(section);
  }
}

export function choiceLabel(choice, maxLength = 5) {
  const value = String(choice ?? '').replace(/^\s*\d+[.)]\s*/, '').replace(/[“”"'()[\]{}.,!?…·:;\s]/g, '').trim();
  return Array.from(value || '선택').slice(0, maxLength).join('');
}

export function renderChoices(container, choices, { busy = false, onChoose } = {}) {
  if (!container) return;
  container.replaceChildren();
  for (const [index, choice] of narrativeChoiceItems(choices).entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button'; button.textContent = `${index + 1} ${choiceLabel(choice)}`; button.title = choice; button.setAttribute('aria-label', `${index + 1}번 선택지: ${choice}`); button.disabled = busy; button.addEventListener('click', () => onChoose?.(choice)); container.append(button);
  }
}

export function renderHistory(container, turns, { actors = {} } = {}) {
  if (!container) return;
  container.replaceChildren();
  for (const turn of Array.isArray(turns) ? turns : []) {
    const card = document.createElement('article'); card.className = 'turn-card';
    const label = document.createElement('p'); label.className = 'turn-label'; label.textContent = `Turn ${turn.turn_number ?? 0}`;
    const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.literal_action || 'Opening';
    const narrative = document.createElement('div'); narrative.className = 'turn-narrative';
    const presentation = parsePlainStoryForPresentation(turn.story_text, { choices: turn.choices, actorNames: actors });
    renderNarrative(narrative, presentation);
    card.append(label, action, narrative);
    if (turn.turn_summary) { const summary = document.createElement('p'); summary.className = 'turn-summary'; summary.textContent = turn.turn_summary; card.append(summary); }
    container.append(card);
  }
}

function monitorEntries(value) {
  const source = object(value); return Object.entries(source).map(([id, item]) => {
    const monitor = object(item); return { id, name: monitor.name || id, surface: monitor.surface ?? monitor['표면의식'] ?? '', subconscious: monitor.subconscious ?? monitor.latent ?? monitor['잠재의식'] ?? '' };
  }).filter(item => item.surface || item.subconscious);
}

export function renderMindMonitor(container, monitor, { preferredId = '', actorNames = {} } = {}) {
  if (!container) return;
  container.replaceChildren();
  const entries = monitorEntries(monitor).map(entry => ({ ...entry, name: actorNames[entry.id] || entry.name }));
  if (!entries.length) { const empty = document.createElement('p'); empty.className = 'mind-monitor-empty'; empty.textContent = '이번 턴 Mind Monitor 정보가 없습니다.'; container.append(empty); return; }
  const tabs = document.createElement('div'); tabs.className = 'mind-monitor-tabs'; tabs.setAttribute('role', 'tablist');
  const body = document.createElement('div'); body.className = 'mind-monitor-content';
  let selected = entries.find(entry => entry.id === preferredId) || entries[0];
  const show = entry => { selected = entry; body.replaceChildren(); const heading = document.createElement('h3'); heading.className = 'mind-monitor-name'; heading.textContent = entry.name; body.append(heading); for (const [label, value] of [['표면의식', entry.surface], ['잠재의식', entry.subconscious]]) { const section = document.createElement('section'); section.className = 'mind-line'; const title = document.createElement('h4'); title.textContent = label; const detail = document.createElement('p'); detail.textContent = value || '이번 턴에는 확인할 수 없습니다.'; section.append(title, detail); body.append(section); } };
  for (const entry of entries) { const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'mind-monitor-tab'; tab.textContent = entry.name; tab.dataset.characterId = entry.id; tab.setAttribute('aria-selected', entry.id === selected.id ? 'true' : 'false'); tab.addEventListener('click', () => { tabs.querySelectorAll('button').forEach(item => item.setAttribute('aria-selected', item === tab ? 'true' : 'false')); show(entry); }); tabs.append(tab); }
  container.append(tabs, body); show(selected);
}

export function renderFocalCharacter(container, actor) {
  if (!container) return;
  container.replaceChildren();
  if (!actor?.name) { container.hidden = true; return; }
  container.hidden = false;
  const heading = document.createElement('h2'); heading.textContent = actor.name; container.append(heading);
  const list = document.createElement('dl'); list.className = 'state-list character-detail-list';
  for (const [label, value] of [['직무', actor.role], ['부서', actor.department], ['나이', actor.age], ['말투', actor.speech_style]]) {
    if (value === '' || value == null) continue;
    const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = String(value); list.append(dt, dd);
  }
  container.append(list);
}

export function renderState(elements, view) {
  const scene = elements?.scene; if (scene) { scene.replaceChildren(); for (const [label, value] of [['장소', view.scene.location?.name], ['현재 인물', view.scene.present_actors.map(actor => actor.name).join(', ')], ['장면 메모', view.scene.scene_note]]) { if (!value) continue; const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; scene.append(dt, dd); } }
  const profile = elements?.player; if (profile) { profile.replaceChildren(); for (const [label, value] of [['이름', view.profile.name], ['부서', view.profile.department], ['직급', view.profile.position], ['나이', view.profile.age], ['키', view.profile.height_cm], ['몸무게', view.profile.weight_kg], ['말투', view.profile.speech_style]]) { if (value === '' || value == null) continue; const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = String(value); profile.append(dt, dd); } }
}

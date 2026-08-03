import { parseNarrative } from './narrative.js';

export function text(element, value) { if (element) element.textContent = value ?? ''; }
function displayValue(value) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function workHook(value) { return typeof value === 'string' ? value : displayValue(value?.id) || displayValue(value?.status); }

export function parsedTurnNarrative(turn) {
  if (Array.isArray(turn?.parsed_blocks)) return { blocks: turn.parsed_blocks };
  if (Array.isArray(turn?.parsed_blocks?.blocks)) return turn.parsed_blocks;
  return parseNarrative(turn?.story_text ?? '');
}

export function stateDisplayValues(context) {
  const save = context?.save?.data ?? context?.save ?? {}, scene = save.scene_state ?? {}, world = save.world_state ?? {};
  return {
    위치: displayValue(scene.location_id), 시간: displayValue(world.time_block), 업무: workHook(world.work_hook),
    초점: displayValue(save.focal_character_id), 목표: displayValue(scene.scene_goal),
    흐름: displayValue(scene.focus_thread) || displayValue(scene.beat), 최근요약: displayValue(save.story_summary_recent),
    활성규정: Array.isArray(save.csa_active) ? String(save.csa_active.length) : ''
  };
}
export function renderNarrative(container, parsed) {
  if (!container) return; container.replaceChildren();
  for (const block of parsed?.blocks ?? []) {
    const element = document.createElement(block.type === 'dialogue' ? 'article' : 'p'); element.className = `narrative-${block.type}`;
    element.textContent = block.type === 'dialogue' ? `${block.speaker} · ${block.direction}\n${block.text}` : block.text; container.append(element);
  }
}
export function renderChoices(container, choices, { busy = false, onChoose } = {}) {
  if (!container) return; container.replaceChildren();
  choices.forEach((choice, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'choice-button'; button.textContent = `${index + 1}. ${choice}`; button.title = choice; button.disabled = busy; button.addEventListener('click', () => onChoose?.(choice)); container.append(button); });
}
export function renderHistory(container, turns) {
  if (!container) return; container.replaceChildren();
  for (const turn of turns ?? []) {
    const card = document.createElement('article'); card.className = 'turn-card';
    const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.player_action ?? '이전 행동';
    const narrative = document.createElement('div'); narrative.className = 'turn-narrative';
    card.append(action, narrative); renderNarrative(narrative, parsedTurnNarrative(turn));
    if (turn.turn_summary) { const summary = document.createElement('p'); summary.className = 'turn-summary'; summary.textContent = turn.turn_summary; card.append(summary); }
    container.append(card);
  }
}
export function latestMindMonitor(context, result = {}) {
  const current = result?.mind_monitor;
  if (current && typeof current === 'object' && !Array.isArray(current) && Object.keys(current).length > 0) return current;
  const latest = Array.isArray(context?.recent_turns) ? context.recent_turns.at(-1)?.mind_monitor : undefined;
  return latest && typeof latest === 'object' && !Array.isArray(latest) ? latest : {};
}
export function renderState(elements, context, result = {}) {
  const save = context?.save?.data ?? context?.save ?? {};
  text(elements.title, context?.game?.title ?? '회사편'); text(elements.turn, `Turn ${save.turn_state?.committed_turn ?? 0}`);
  if (elements.scene) { elements.scene.replaceChildren(); for (const [label, value] of Object.entries(stateDisplayValues(context))) { if (!value) continue; const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; elements.scene.append(dt, dd); } }
  if (elements.mind) { elements.mind.replaceChildren(); for (const [id, value] of Object.entries(latestMindMonitor(context, result))) { const card = document.createElement('p'); card.textContent = `${id}: ${typeof value === 'string' ? value : JSON.stringify(value)}`; elements.mind.append(card); } }
  if (elements.warnings) { elements.warnings.replaceChildren(); for (const warning of result.warnings ?? []) { const item = document.createElement('li'); item.textContent = warning; elements.warnings.append(item); } }
}

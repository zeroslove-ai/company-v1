export function text(element, value) { if (element) element.textContent = value ?? ''; }
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
  for (const turn of [...(turns ?? [])].reverse()) { const card = document.createElement('article'); card.className = 'turn-card'; const action = document.createElement('p'); action.className = 'action-chip'; action.textContent = turn.player_action ?? '이전 행동'; card.append(action); renderNarrative(card, turn.parsed_blocks ? { blocks: turn.parsed_blocks } : { blocks: [{ type: 'unparsed', text: turn.story_text ?? '' }] }); if (turn.turn_summary) { const summary = document.createElement('p'); summary.className = 'turn-summary'; summary.textContent = turn.turn_summary; card.append(summary); } container.append(card); }
}
export function renderState(elements, context, result = {}) {
  const save = context?.save?.data ?? context?.save ?? {}; const state = save.scene_state ?? {};
  text(elements.title, context?.game?.title ?? '회사편'); text(elements.turn, `Turn ${save.turn_state?.committed_turn ?? 0}`);
  if (elements.scene) { elements.scene.replaceChildren(); for (const [label, value] of Object.entries({ 위치: state.location ?? state.current_location, 시간: state.time_of_day, 업무: state.work_hook, 초점: state.focal_character, 목표: state.scene_goal })) { if (!value) continue; const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = String(value); elements.scene.append(dt, dd); } }
  if (elements.mind) { elements.mind.replaceChildren(); for (const [id, value] of Object.entries(result.mind_monitor ?? {})) { const card = document.createElement('p'); card.textContent = `${id}: ${typeof value === 'string' ? value : JSON.stringify(value)}`; elements.mind.append(card); } }
  if (elements.warnings) { elements.warnings.replaceChildren(); for (const warning of result.warnings ?? []) { const item = document.createElement('li'); item.textContent = warning; elements.warnings.append(item); } }
}

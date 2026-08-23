import { actorDirectory, locationIds, registeredActorIds } from './content.js';

const CLOTHING_SLOTS = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_VALUES = new Set(['worn', 'removed', 'unknown']);
const text = value => typeof value === 'string' ? value.trim() : '';

function evidenceQuote(value, storyText) { const quote = text(value); return quote && storyText.includes(quote) ? quote : ''; }

function groundedActorEvidence(item, storyText, directory) {
  const actorId = item?.actor_id;
  const quote = evidenceQuote(item?.quote, storyText);
  const actorName = directory[actorId]?.name;
  return actorId && actorName && quote && quote.includes(actorName) ? { actor_id: actorId, quote } : null;
}

function choiceLine(line, expectedNumber) {
  const wrapped = new RegExp(`^\\s*(\\*\\*|__)(?:${expectedNumber})[.)]\\s+(.+?)\\1\\s*$`).exec(line);
  if (wrapped?.[2]) return wrapped[2];
  const plain = new RegExp(`^\\s*${expectedNumber}[.)]\\s+(.+?)\\s*$`).exec(line);
  return plain?.[1] ?? null;
}

function storyChoiceTail(storyText) {
  const lines = String(storyText ?? '').replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  if (lines.length < 4) return null;
  const choices = lines.slice(-4).map((line, index) => choiceLine(line, index + 1));
  return choices.every(choice => choice) && new Set(choices).size === 4 ? choices : null;
}

function choiceParityKey(value) { return value.replace(/\\"/g, '"'); }

function projectChoices(storyText, observerChoices) {
  const storyChoices = storyChoiceTail(storyText);
  const choices = Array.isArray(observerChoices) ? observerChoices.map(text) : [];
  if (!storyChoices) return { choices: null, warning: observerChoices !== undefined ? 'choices_projection_dropped' : null };
  const observerMatches = choices.length === 4
    && new Set(choices).size === 4
    && choices.every((choice, index) => choice && choiceParityKey(choice) === choiceParityKey(storyChoices[index]));
  return { choices: storyChoices, warning: observerMatches ? null : 'choices_observer_mismatch' };
}

function locationIdFromCanonicalName(quote, content) {
  return (content?.locations ?? [])
    .filter(location => location?.location_id && typeof location.name === 'string' && quote.includes(location.name))
    .sort((left, right) => right.name.length - left.name.length)[0]?.location_id ?? null;
}

export function normalizeObserver(input, { storyText = '', content, currentState } = {}) {
  const observer = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const actors = registeredActorIds(content);
  const locations = locationIds(content);
  const warnings = [];
  const normalized = { elapsed_minutes: 0, entered: [], exited: [], scene_note: null, clothing_changes: [], choices: null, turn_summary: '', player_inner_thought: '', mind_monitor: {}, warnings };
  const location = observer.location && typeof observer.location === 'object' ? observer.location : null;
  const locationQuote = location ? evidenceQuote(location.quote, storyText) : '';
  const canonicalLocationId = locationQuote ? locationIdFromCanonicalName(locationQuote, content) : null;
  if (location && locations.has(location.location_id) && locationQuote) {
    const locationId = canonicalLocationId ?? location.location_id;
    if (canonicalLocationId && canonicalLocationId !== location.location_id) warnings.push('location_projection_corrected');
    normalized.location = { location_id: locationId, quote: locationQuote };
  }
  else if (location && canonicalLocationId) normalized.location = { location_id: canonicalLocationId, quote: locationQuote };
  else if (location) warnings.push('location_projection_dropped');
  const directory = actorDirectory(content);
  const eligibleMonitorActors = new Set([...currentState?.scene?.present_actor_ids ?? []].filter(actorId => actors.has(actorId)));
  for (const key of ['entered', 'exited']) {
    const source = Array.isArray(observer[key]) ? observer[key] : [];
    normalized[key] = source.flatMap(item => {
      const grounded = groundedActorEvidence(item, storyText, directory);
      if (!grounded) { warnings.push(`${key}_projection_dropped`); return []; }
      if (key === 'entered') eligibleMonitorActors.add(grounded.actor_id);
      else eligibleMonitorActors.delete(grounded.actor_id);
      return [grounded];
    });
  }
  if (Array.isArray(observer.present_actor_ids)) {
    const valid = observer.present_actor_ids.filter(id => actors.has(id));
    if (valid.length === observer.present_actor_ids.length) normalized.present_actor_ids = [...new Set(valid)];
    else warnings.push('present_actor_projection_dropped');
  }
  const note = text(observer.scene_note);
  if (note) normalized.scene_note = note.slice(0, 1000);
  const projectedChoices = projectChoices(storyText, observer.choices);
  if (projectedChoices.choices) normalized.choices = projectedChoices.choices;
  if (projectedChoices.warning) warnings.push(projectedChoices.warning);
  normalized.turn_summary = text(observer.turn_summary).slice(0, 600);
  normalized.player_inner_thought = text(observer.player_inner_thought).slice(0, 600);
  const elapsed = Number(observer.elapsed_minutes);
  if (Number.isInteger(elapsed) && elapsed >= 0) normalized.elapsed_minutes = Math.min(elapsed, 1440);
  const monitor = observer.mind_monitor && typeof observer.mind_monitor === 'object' ? observer.mind_monitor : {};
  for (const [actorId, value] of Object.entries(monitor)) {
    if (!eligibleMonitorActors.has(actorId) || !directory[actorId] || !value || typeof value !== 'object') { warnings.push('mind_monitor_projection_dropped'); continue; }
    normalized.mind_monitor[actorId] = { surface: text(value.surface).slice(0, 600), subconscious: text(value.subconscious).slice(0, 600) };
  }
  const clothing = Array.isArray(observer.clothing_changes) ? observer.clothing_changes : [];
  for (const item of clothing) {
    if (!actors.has(item?.actor_id) || !evidenceQuote(item?.quote, storyText) || !item.slots || typeof item.slots !== 'object') { warnings.push('clothing_projection_dropped'); continue; }
    const slots = {};
    for (const [slot, value] of Object.entries(item.slots)) if (CLOTHING_SLOTS.has(slot) && CLOTHING_VALUES.has(value)) slots[slot] = value;
    if (Object.keys(slots).length) normalized.clothing_changes.push({ actor_id: item.actor_id, quote: text(item.quote), slots });
  }
  return normalized;
}

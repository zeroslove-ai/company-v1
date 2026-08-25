import { actorDirectory, locationIds, registeredActorIds } from './content.js';

const CLOTHING_SLOTS = new Set(['uniform_top', 'uniform_bottom', 'underwear_top', 'underwear_bottom']);
const CLOTHING_VALUES = new Set(['worn', 'removed', 'unknown']);
const text = value => typeof value === 'string' ? value.trim() : '';
const SEXUAL_MEDIA_CUE = /(?:성기|삽입|사정|오르가즘|유두|알몸|벗은|애무|자위|섹스|sex|orgasm|nude|naked|masturbat|vagina|penis)/iu;
const REFUSAL_MEDIA_CUE = /(?:싫어|하지[ ]*마|멈춰|거절|거부|중단|stop|refus|declin|no)/iu;

function evidenceQuote(value, storyText) { const quote = text(value); return quote && storyText.includes(quote) ? quote : ''; }
function dialogueEvidenceQuote(value, storyText) {
  const quote = text(value);
  const normalizedQuote = String(quote).replace(/\\+"/g, '"');
  const normalizedStory = String(storyText ?? '').replace(/\\+"/g, '"');
  return normalizedQuote && normalizedStory.includes(normalizedQuote) ? normalizedQuote : '';
}

function groundedActorEvidence(item, storyText, directory) {
  const actorId = item?.actor_id;
  const quote = evidenceQuote(item?.quote, storyText);
  const actorName = directory[actorId]?.name;
  return actorId && actorName && quote && quote.includes(actorName) ? { actor_id: actorId, quote } : null;
}

function groundedPresenceReconciliation(item, storyText, directory) {
  const status = item?.status;
  if (status !== 'absent' && status !== 'present') return null;
  const grounded = groundedActorEvidence(item, storyText, directory);
  return grounded ? { ...grounded, status } : null;
}

function heroineDirectory(content) {
  return Object.fromEntries(Object.entries(content?.characters ?? {}).filter(([id, actor]) => actor?.character_id === id && text(actor?.name)).map(([id, actor]) => [id, actor]));
}

function groundedFocalActor(item, storyText, content, presentActorIds) {
  const directory = heroineDirectory(content);
  const actorId = item?.actor_id;
  const quote = evidenceQuote(item?.quote, storyText);
  const name = directory[actorId]?.name;
  return actorId && presentActorIds.has(actorId) && name && quote && quote.includes(name) ? { actor_id: actorId, quote } : null;
}

function groundedDialogueLine(item, storyText, content, presentActorIds, order) {
  const directory = heroineDirectory(content);
  const speakerId = item?.speaker_id;
  const name = directory[speakerId]?.name;
  const spokenText = text(item?.text);
  const evidence = dialogueEvidenceQuote(item?.evidence_quote, storyText);
  if (!speakerId || !presentActorIds.has(speakerId) || !name || !spokenText || !storyText.includes(spokenText) || !evidence || !evidence.includes(name) || !evidence.includes(spokenText)) return null;
  return { speaker_id: speakerId, speaker_name: name, text: spokenText, direction: text(item?.direction).slice(0, 80), evidence_quote: evidence, order: Number.isInteger(item?.order) ? item.order : order };
}

function choiceLine(line, expectedNumber) {
  const wrapped = new RegExp(`^\\s*(\\*\\*|__)(?:${expectedNumber})[.)]\\s+(.+?)\\1\\s*$`).exec(line);
  if (wrapped?.[2]) return wrapped[2];
  const tokenWrapped = new RegExp(`^\\s*(\\*\\*|__)(?:${expectedNumber})[.)]\\1\\s+(.+?)\\s*$`).exec(line);
  const tokenAction = tokenWrapped?.[2]?.trim() ?? '';
  if (tokenAction && !/^(?:\*\*|__)/.test(tokenAction) && !/(?:\*\*|__)$/.test(tokenAction)) return tokenAction;
  const plain = new RegExp(`^\\s*${expectedNumber}[.)]\\s+(.+?)\\s*$`).exec(line);
  return plain?.[1] ?? null;
}

function storyChoiceTail(storyText) {
  const lines = String(storyText ?? '').replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  if (lines.length < 4) return null;
  const choices = [];
  let index = lines.length - 1;
  for (let number = 4; number >= 1; number -= 1) {
    while (index >= 0 && !lines[index].trim()) index -= 1;
    const choice = index >= 0 ? choiceLine(lines[index], number) : null;
    if (!choice) return null;
    choices.unshift(choice);
    index -= 1;
  }
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

const PLAYER_LOCATION_SUBJECT = /\b(?:I|me|myself|you|player)\b|(?:\uB098\uB294|\uB0B4\uAC00|\uC81C\uAC00|\uC800\uB294|\uD50C\uB808\uC774\uC5B4|\uB2F9\uC2E0)/iu;
const NON_PLAYER_LOCATION_SUBJECT = /\b(?:npc|they|he|she|employee|colleague)\b|(?:\uADF8\uB4E4|\uADF8\uB140|\uC9C1\uC6D0|\uB3D9\uB8CC)/iu;

function hasPlayerLocationEvidence(quote, content) {
  if (PLAYER_LOCATION_SUBJECT.test(quote)) return true;
  const actorMention = Object.values(actorDirectory(content))
    .some(actor => text(actor?.name) && quote.includes(actor.name));
  return !actorMention && !NON_PLAYER_LOCATION_SUBJECT.test(quote);
}

function groundedMediaHint(item, storyText, content, presentActorIds) {
  if (!item || typeof item !== 'object') return null;
  const actorId = text(item.actor_id);
  const actor = heroineDirectory(content)[actorId];
  const quote = evidenceQuote(item.quote, storyText);
  const pool = item.pool === 'sex' ? 'sex' : item.pool === 'general' ? 'general' : '';
  if (!actor || !presentActorIds.has(actorId) || !quote || !quote.includes(actor.name) || !pool) return null;
  if (pool === 'sex' && (!SEXUAL_MEDIA_CUE.test(quote) || REFUSAL_MEDIA_CUE.test(quote))) return null;
  return { actor_id: actorId, pool, quote, tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim()).slice(0, 8) : [] };
}

function explicitPlayerPerspective(literalAction) {
  return /(?:생각|느끼|기분|마음|의도|결심|원하|궁금|걱정|긴장|기대|불안|좋아|싫어|두렵|안심|마음속|속으로|i\s+(?:think|feel|want|decide)|i'm\s+ worried)/iu.test(text(literalAction));
}

export function normalizeObserver(input, { storyText = '', literalAction = '', content, currentState } = {}) {
  const observer = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const actors = registeredActorIds(content);
  const locations = locationIds(content);
  const warnings = [];
  const normalized = { elapsed_minutes: 0, entered: [], exited: [], scene_note: null, clothing_changes: [], choices: null, turn_summary: '', player_inner_thought: '', mind_monitor: {}, media_hint: null, warnings };
  const location = observer.location && typeof observer.location === 'object' ? observer.location : null;
  const locationQuote = location ? evidenceQuote(location.quote, storyText) : '';
  const canonicalLocationId = locationQuote ? locationIdFromCanonicalName(locationQuote, content) : null;
  const playerLocationEvidence = locationQuote ? hasPlayerLocationEvidence(locationQuote, content) : false;
  if (location && locations.has(location.location_id) && locationQuote && playerLocationEvidence) {
    const locationId = canonicalLocationId ?? location.location_id;
    if (canonicalLocationId && canonicalLocationId !== location.location_id) warnings.push('location_projection_corrected');
    normalized.location = { location_id: locationId, quote: locationQuote };
  }
  else if (location && canonicalLocationId && playerLocationEvidence) normalized.location = { location_id: canonicalLocationId, quote: locationQuote };
  else if (location) warnings.push('location_projection_dropped');
  const directory = actorDirectory(content);
  const eligibleMonitorActors = new Set([...currentState?.scene?.present_actor_ids ?? []].filter(actorId => actors.has(actorId)));
  const groundedTransitions = { entered: new Set(), exited: new Set() };
  for (const key of ['entered', 'exited']) {
    const source = Array.isArray(observer[key]) ? observer[key] : [];
    normalized[key] = source.flatMap(item => {
      const grounded = groundedActorEvidence(item, storyText, directory);
      if (!grounded) { warnings.push(`${key}_projection_dropped`); return []; }
      groundedTransitions[key].add(grounded.actor_id);
      if (key === 'entered') eligibleMonitorActors.add(grounded.actor_id);
      else eligibleMonitorActors.delete(grounded.actor_id);
      return [grounded];
    });
  }
  const groundedPresence = Array.isArray(observer.presence_reconciliation) ? observer.presence_reconciliation.flatMap(item => {
    const grounded = groundedPresenceReconciliation(item, storyText, directory);
    if (!grounded) { warnings.push('presence_reconciliation_projection_dropped'); return []; }
    return [grounded];
  }) : [];
  if (Array.isArray(observer.presence_reconciliation)) normalized.presence_reconciliation = groundedPresence;
  const validPresentIds = Array.isArray(observer.present_actor_ids) ? observer.present_actor_ids.filter(id => actors.has(id)) : null;
  if (Array.isArray(observer.present_actor_ids) && validPresentIds.length !== observer.present_actor_ids.length) warnings.push('present_actor_projection_dropped');
  if ((Array.isArray(observer.present_actor_ids) && validPresentIds.length === observer.present_actor_ids.length) || groundedTransitions.entered.size || groundedTransitions.exited.size || groundedPresence.length) {
    const reconciled = new Set(Array.isArray(observer.present_actor_ids) && validPresentIds.length === observer.present_actor_ids.length ? validPresentIds : [...currentState?.scene?.present_actor_ids ?? []].filter(actorId => actors.has(actorId)));
    for (const actorId of groundedTransitions.exited) {
      if (reconciled.delete(actorId)) warnings.push('present_actor_reconciled_exited');
    }
    for (const actorId of groundedTransitions.entered) {
      if (reconciled.add(actorId)) warnings.push('present_actor_reconciled_entered');
    }
    for (const { actor_id: actorId, status } of groundedPresence) {
      if (status === 'absent') {
        if (reconciled.delete(actorId)) warnings.push('present_actor_reconciled_absent_evidence');
      } else if (reconciled.add(actorId)) warnings.push('present_actor_reconciled_present_evidence');
    }
    normalized.present_actor_ids = [...reconciled];
    for (const actorId of normalized.present_actor_ids) eligibleMonitorActors.add(actorId);
    for (const actorId of actors) if (!normalized.present_actor_ids.includes(actorId)) eligibleMonitorActors.delete(actorId);
  }
  const postStoryPresentActors = new Set(normalized.present_actor_ids ?? [...eligibleMonitorActors]);
  const focal = observer.focal_actor === null || observer.focal_actor === undefined ? null : groundedFocalActor(observer.focal_actor, storyText, content, postStoryPresentActors);
  normalized.focal_actor = focal;
  if (observer.focal_actor && !focal) warnings.push('focal_actor_projection_dropped');
  const rawDialogue = Array.isArray(observer.dialogue_lines) ? observer.dialogue_lines : [];
  normalized.dialogue_lines = rawDialogue.flatMap((item, order) => {
    const line = groundedDialogueLine(item, storyText, content, postStoryPresentActors, order);
    if (!line) warnings.push('dialogue_projection_dropped');
    return line ? [line] : [];
  });
  const note = text(observer.scene_note);
  if (note) normalized.scene_note = note.slice(0, 1000);
  const projectedChoices = projectChoices(storyText, observer.choices);
  if (projectedChoices.choices) normalized.choices = projectedChoices.choices;
  if (projectedChoices.warning) warnings.push(projectedChoices.warning);
  normalized.turn_summary = text(observer.turn_summary).slice(0, 600);
  const playerInnerThought = text(observer.player_inner_thought);
  if (playerInnerThought && explicitPlayerPerspective(literalAction)) normalized.player_inner_thought = playerInnerThought.slice(0, 600);
  else if (playerInnerThought) warnings.push('player_inner_thought_projection_dropped');
  const elapsed = Number(observer.elapsed_minutes);
  if (Number.isInteger(elapsed) && elapsed >= 0) normalized.elapsed_minutes = Math.min(elapsed, 1440);
  const monitor = observer.mind_monitor && typeof observer.mind_monitor === 'object' ? observer.mind_monitor : {};
  for (const [actorId, value] of Object.entries(monitor)) {
    if (!postStoryPresentActors.has(actorId) || !directory[actorId] || !value || typeof value !== 'object') { warnings.push('mind_monitor_projection_dropped'); continue; }
    const surface = text(value.surface).slice(0, 600); const subconscious = text(value.subconscious).slice(0, 600);
    if (!surface || !subconscious) { warnings.push('mind_monitor_projection_dropped'); continue; }
    normalized.mind_monitor[actorId] = { surface, subconscious };
  }
  const mediaHint = groundedMediaHint(observer.media_hint, storyText, content, postStoryPresentActors);
  if (observer.media_hint && !mediaHint) warnings.push('media_hint_projection_dropped');
  normalized.media_hint = mediaHint;
  const clothing = Array.isArray(observer.clothing_changes) ? observer.clothing_changes : [];
  for (const item of clothing) {
    if (!actors.has(item?.actor_id) || !evidenceQuote(item?.quote, storyText) || !item.slots || typeof item.slots !== 'object') { warnings.push('clothing_projection_dropped'); continue; }
    const slots = {};
    for (const [slot, value] of Object.entries(item.slots)) if (CLOTHING_SLOTS.has(slot) && CLOTHING_VALUES.has(value)) slots[slot] = value;
    if (Object.keys(slots).length) normalized.clothing_changes.push({ actor_id: item.actor_id, quote: text(item.quote), slots });
  }
  return normalized;
}

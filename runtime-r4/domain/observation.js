import { findActor, findLocation } from './content.js';
import { parseStoryChoices } from './command.js';

const validText = (value, max = 1200) => typeof value === 'string' && value.length <= max;
const exactEvidence = (quote, storyText) => validText(quote, 800) && quote.length > 0 && storyText.includes(quote);
function actorNameVariants(actor) {
  const names = [actor.name];
  if (/^[가-힣]{3}$/u.test(actor.name)) names.push(actor.name.slice(1));
  return [...new Set(names)];
}
function nearestActorMention(text, content, allowedActorIds = null) {
  const allowed = allowedActorIds ? new Set(allowedActorIds) : null;
  return content.actors.filter(actor => !allowed || allowed.has(actor.actor_id)).flatMap(actor => actorNameVariants(actor).map(name => ({
    actorId: actor.actor_id,
    index: text.lastIndexOf(name)
  }))).filter(actor => actor.index >= 0).sort((a, b) => b.index - a.index)[0] ?? null;
}
function exactAttributedDialogueSegments(storyText, evidenceQuote, actorId, spokenText, content, presentActorIds) {
  if (!validText(evidenceQuote, 800)) return [];
  const quoteIndex = storyText.indexOf(evidenceQuote);
  if (quoteIndex < 0) return [];
  const solePresentSpeaker = presentActorIds.length === 1 && presentActorIds[0] === actorId;
  return [...evidenceQuote.matchAll(/["“]([^"“”\n]{1,600})["”]/gu)].flatMap(match => {
    const text = match[1].trim();
    if (!text || !spokenText.includes(text)) return [];
    const segmentIndex = quoteIndex + match.index;
    const attributionWindow = storyText.slice(Math.max(0, segmentIndex - 320), segmentIndex);
    const nearestPresentActor = nearestActorMention(attributionWindow, content, presentActorIds);
    return nearestPresentActor?.actorId === actorId || (!nearestPresentActor && solePresentSpeaker) ? [{ text }] : [];
  });
}

function matchesActorEvidence(storyText, evidenceQuote, actorId, content) {
  if (!exactEvidence(evidenceQuote, storyText)) return false;
  const quoteIndex = storyText.indexOf(evidenceQuote);
  const nearby = storyText.slice(Math.max(0, quoteIndex - 320), quoteIndex + evidenceQuote.length);
  const nearestActor = nearestActorMention(nearby, content);
  return nearestActor?.actorId === actorId;
}

export function parseObserverPayload(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') throw new TypeError('observer_payload_not_text');
  const fence = String.fromCharCode(96).repeat(3);
  const candidate = raw.trim()
    .replace(new RegExp('^' + fence + '(?:json)?\\s*', 'i'), '')
    .replace(new RegExp('\\s*' + fence + '$'), '');
  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('observer_root_invalid');
  return parsed;
}

export function normalizeObservation(raw, { storyText, before, content, turnNumber, turnRevision = 1 }) {
  const source = parseObserverPayload(raw);
  const warnings = [];
  const scene = source.scene && typeof source.scene === 'object' ? source.scene : {};
  let location = null;
  if (typeof scene.location_id === 'string' && exactEvidence(scene.location_evidence, storyText)) {
    const candidate = findLocation(content, scene.location_id);
    if (candidate && scene.location_evidence.includes(candidate.name)) location = { status: 'verified', value: candidate.location_id, evidence: scene.location_evidence };
  }
  if (!location) warnings.push('location_unverified');

  let presence = null;
  if (Array.isArray(scene.present_actor_ids) && Array.isArray(scene.presence_evidence)) {
    const ids = [...new Set(scene.present_actor_ids)];
    const evidenceById = new Map();
    for (const evidence of scene.presence_evidence) {
      const actor = findActor(content, evidence?.actor_id);
      if (actor && matchesActorEvidence(storyText, evidence?.quote, actor.actor_id, content)) evidenceById.set(actor.actor_id, evidence.quote);
    }
    const everyActorGrounded = ids.every(id => evidenceById.has(id));
    const emptyGrounded = ids.length === 0 && exactEvidence(scene.empty_presence_evidence, storyText);
    if (everyActorGrounded && (ids.length > 0 || emptyGrounded)) {
      presence = { status: 'verified', value: ids, evidence: Object.fromEntries(ids.map(id => [id, evidenceById.get(id)])), emptyEvidence: emptyGrounded ? scene.empty_presence_evidence : '' };
    }
  }
  if (!presence) warnings.push('presence_unverified');

  let sceneNote = null;
  if (scene.scene_note_status === 'observed' && validText(scene.scene_note, 1000) && exactEvidence(scene.scene_note_evidence, storyText)) {
    sceneNote = { status: 'verified', value: scene.scene_note, evidence: scene.scene_note_evidence };
  } else if (scene.scene_note_status === 'empty' && exactEvidence(scene.scene_note_evidence, storyText)) {
    sceneNote = { status: 'verified', value: '', evidence: scene.scene_note_evidence };
  }
  if (!sceneNote) warnings.push('scene_note_unverified');

  let elapsedMinutes = null;
  const noElapsedClaim = (source.elapsed_minutes == null || source.elapsed_minutes === 0) &&
    (source.elapsed_evidence == null || source.elapsed_evidence === '');
  if (noElapsedClaim) {
    elapsedMinutes = { status: 'unchanged', value: 0 };
  } else if (Number.isInteger(source.elapsed_minutes) && source.elapsed_minutes >= 0 && source.elapsed_minutes <= 1440 && exactEvidence(source.elapsed_evidence, storyText)) {
    elapsedMinutes = { status: 'verified', value: source.elapsed_minutes, evidence: source.elapsed_evidence };
  } else warnings.push('elapsed_time_unverified');

  const actorIds = Array.isArray(source.actor_ids)
    ? [...new Set(source.actor_ids.filter(id => findActor(content, id)))]
    : [];
  const keywords = Array.isArray(source.keywords)
    ? [...new Set(source.keywords.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim().slice(0, 60)))].slice(0, 12)
    : [];
  const digestSummary = validText(source.turn_digest?.summary, 360) ? source.turn_digest.summary.trim() : '';
  const digest = digestSummary ? {
    summary: digestSummary,
    actor_ids: actorIds,
    keywords,
    important: source.turn_digest?.important === true,
    source_turn: turnNumber,
    source_revision: turnRevision
  } : null;
  if (!digest) warnings.push('digest_missing');

  const choices = parseStoryChoices(storyText);
  if (choices.length !== 4) warnings.push('choices_missing_or_invalid');
  const dialogueLines = Array.isArray(source.dialogue_lines)
    ? source.dialogue_lines.slice(0, 40).flatMap((line, order) => {
      const actor = findActor(content, line?.speaker_id);
      const spoken = typeof line?.text === 'string' ? line.text.trim() : '';
      const quote = line?.evidence_quote;
      const direction = typeof line.direction === 'string' ? line.direction.trim().slice(0, 80) : '';
      if (actor?.kind !== 'heroine' || !presence?.value.includes(actor.actor_id) || !spoken || !exactEvidence(quote, storyText)) return [];
      const spokenSegments = exactAttributedDialogueSegments(storyText, quote, actor.actor_id, spoken, content, presence?.value ?? []);
      if (!spokenSegments.length) return [];
      const quoteIndex = storyText.indexOf(quote);
      const audioContext = storyText.slice(Math.max(0, quoteIndex - 120), quoteIndex + quote.length + 160);
      const groundedDirection = direction && audioContext.includes(direction) ? direction : '';
      return spokenSegments.map((segment, segmentOrder) => ({
        speaker_id: actor.actor_id,
        speaker_name: actor.name,
        text: segment.text,
        direction: groundedDirection,
        evidence_quote: quote,
        order: (Number.isInteger(line.order) ? line.order : order) * 40 + segmentOrder
      }));
    })
    : [];
  const mindMonitor = source.mind_monitor && typeof source.mind_monitor === 'object' && !Array.isArray(source.mind_monitor)
    ? Object.fromEntries(Object.entries(source.mind_monitor).filter(([id, value]) => findActor(content, id) && validText(value?.surface, 500) && validText(value?.subconscious, 500)))
    : {};
  const playerThought = '';
  let mediaHint = { kind: 'none' };
  if (source.media_hint?.kind === 'company_notice') {
    mediaHint = { kind: 'company_notice' };
  } else if (source.media_hint?.kind === 'asset') {
    const actor = findActor(content, source.media_hint.actor_id);
    const quote = source.media_hint.quote;
    const pool = source.media_hint.pool;
    const image = content.media_catalog.find(item => item.image_id === source.media_hint.image_id && item.active === true && item.character_id === actor?.actor_id && item.pool === pool);
    if (actor?.kind === 'heroine' && presence?.value.includes(actor.actor_id) && image && (pool === 'general' || pool === 'sex') && exactEvidence(quote, storyText) && quote.includes(actor.name)) {
      mediaHint = { kind: 'asset', image_id: image.image_id, actor_id: actor.actor_id, pool, quote, tags: image.tags ?? [], situation: image.situation };
    }
  }

  return {
    complete: true,
    elapsedMinutes,
    scene: { location, presence, sceneNote },
    digest,
    choices,
    dialogueLines,
    mindMonitor,
    playerThought,
    mediaHint,
    warnings,
    raw: source
  };
}

export function degradedObservation({ storyText }) {
  return {
    complete: false,
    elapsedMinutes: null,
    scene: { location: null, presence: null, sceneNote: null },
    digest: null,
    choices: parseStoryChoices(storyText),
    dialogueLines: [],
    mindMonitor: {},
    playerThought: '',
    mediaHint: { kind: 'none' },
    warnings: ['observer_failed', 'location_unverified', 'presence_unverified', 'scene_note_unverified'],
    raw: null
  };
}

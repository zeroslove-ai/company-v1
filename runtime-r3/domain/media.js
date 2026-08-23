import { selectImage } from '../../src/engine/media/image-selector.js';
import { resolveTtsEligibility } from '../../src/engine/media/tts-contract.js';

const DIALOGUE_LINE = /^\s*(.{1,40}?)\s*(?:\(([^()\n]{1,80})\)\s*)?:\s*["“](.+?)["”]\s*$/u;

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function heroineIds(content) { return new Set(Object.values(content?.characters ?? {}).map(character => character?.character_id).filter(id => typeof id === 'string' && id)); }
function actorNames(content) { return Object.fromEntries(Object.values(content?.characters ?? {}).map(character => [character.character_id, character.name]).filter(([id, name]) => id && text(name))); }

export function parseCommittedDialogue(storyText, content) {
  const names = actorNames(content);
  const idByName = new Map(Object.entries(names).map(([id, name]) => [name, id]));
  const lines = [];
  for (const [order, rawLine] of String(storyText ?? '').replace(/\r\n?/g, '\n').split('\n').entries()) {
    const match = DIALOGUE_LINE.exec(rawLine);
    if (!match) continue;
    const speaker = text(match[1]); const speakerId = idByName.get(speaker);
    if (!speakerId || !text(match[3])) continue;
    lines.push({ speaker_id: speakerId, speaker_name: speaker, direction: text(match[2]), text: text(match[3]), order });
  }
  return lines;
}

function toneGroup(direction = '') {
  if (/속삭|낮은 목소리/u.test(direction)) return 'whisper';
  if (/울먹|슬픈|눈물/u.test(direction)) return 'sad';
  if (/분노|화난|날카/u.test(direction)) return 'angry';
  if (/밝게|장난|웃/u.test(direction)) return 'happy';
  if (/긴장|떨림|머뭇/u.test(direction)) return 'nervous';
  return 'neutral';
}

export function selectPrimaryDialogueLines({ dialogueLines = [], presentActorIds = [], focalActorId = '' } = {}) {
  const present = new Set(Array.isArray(presentActorIds) ? presentActorIds : []);
  const lines = (Array.isArray(dialogueLines) ? dialogueLines : [])
    .filter(line => typeof line?.speaker_id === 'string' && present.has(line.speaker_id) && text(line.text))
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const preferred = focalActorId && present.has(focalActorId) ? focalActorId : '';
  let speaker = preferred && lines.some(line => line.speaker_id === preferred) ? preferred : '';
  if (!speaker) {
    const counts = new Map();
    for (const line of lines) counts.set(line.speaker_id, (counts.get(line.speaker_id) ?? 0) + 1);
    speaker = lines.find(line => line.speaker_id === [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a))[0])?.speaker_id ?? '';
  }
  return speaker ? lines.filter(line => line.speaker_id === speaker) : [];
}

export function batchDialogueLines(lines) {
  const batches = [];
  let current = null;
  for (const line of Array.isArray(lines) ? lines : []) {
    const speakerId = line.speaker_id;
    const tone = toneGroup(line.direction);
    const merged = current ? `${current.text} ${line.text}` : line.text;
    if (current && current.character_id === speakerId && current.tone === tone && merged.length <= 350) {
      current.text = merged; current.lines.push(line);
    } else {
      current = { character_id: speakerId, speaker_name: line.speaker_name, direction: line.direction, tone, text: line.text, lines: [line] };
      batches.push(current);
    }
  }
  return batches;
}

function latestCommittedTurn(context) {
  const state = object(context?.state);
  const committedTurn = Number(state.committed_turn ?? 0);
  return (Array.isArray(context?.turns) ? context.turns : []).find(turn => Number(turn?.turn_number) === committedTurn) ?? null;
}

function sexualEvidence(context, turn) {
  const state = object(context?.state?.state);
  const applied = object(turn?.observer_applied);
  const evidence = state.sexual ?? state.sexual_state ?? applied.sexual ?? applied.sexual_state;
  return evidence === true || evidence?.active === true || evidence?.scene === true || evidence?.status === 'active';
}

export function projectCurrentMedia({ context, content, requestedCharacterId = '', requestedPool = 'general' } = {}) {
  const state = object(context?.state?.state); const scene = object(state.scene);
  const registered = heroineIds(content);
  const present = [...new Set(Array.isArray(scene.present_actor_ids) ? scene.present_actor_ids : [])];
  const presentHeroines = present.filter(id => registered.has(id));
  const turn = latestCommittedTurn(context);
  const dialogueLines = parseCommittedDialogue(turn?.story_text, content);
  const focal = registered.has(scene.focal_actor_id) && presentHeroines.includes(scene.focal_actor_id) ? scene.focal_actor_id : '';
  const dialogueSpeakers = [...new Set(dialogueLines.map(line => line.speaker_id).filter(id => presentHeroines.includes(id)))];
  let characterId = '';
  if (requestedCharacterId) {
    if (presentHeroines.includes(requestedCharacterId)) characterId = requestedCharacterId;
    else return { character_id: null, pool: 'general', dialogue_lines: dialogueLines, reason: 'character_not_present' };
  } else if (focal) characterId = focal;
  else if (dialogueSpeakers.length === 1) characterId = dialogueSpeakers[0];
  else if (presentHeroines.length === 1) characterId = presentHeroines[0];
  const pool = requestedPool === 'sex' && sexualEvidence(context, turn) ? 'sex' : 'general';
  return { character_id: characterId || null, pool, dialogue_lines: dialogueLines, situation: text(scene.scene_note), tags: [], location_id: scene.location_id ?? null, reason: characterId ? null : 'no_unambiguous_present_heroine' };
}

export function selectApprovedImage({ candidates = [], projection } = {}) {
  if (!projection?.character_id) return null;
  const usable = (Array.isArray(candidates) ? candidates : []).filter(candidate => /^https?:\/\//i.test(candidate?.image_url ?? ''));
  return selectImage(usable.slice(0, 8), { pool: projection.pool, situation: projection.situation, tags: projection.tags, locationId: projection.location_id });
}

export function resolveCommittedTtsBatch({ context, content, speakerId, spokenText } = {}) {
  const projection = projectCurrentMedia({ context, content });
  const lines = selectPrimaryDialogueLines({ dialogueLines: projection.dialogue_lines, presentActorIds: context?.state?.state?.scene?.present_actor_ids, focalActorId: context?.state?.state?.scene?.focal_actor_id });
  const batches = batchDialogueLines(lines);
  return batches.find(batch => batch.character_id === speakerId && batch.text === text(spokenText)) ?? null;
}

export function resolveCommittedTtsVoice({ content, speakerId, spokenText } = {}) {
  return resolveTtsEligibility({ speakerId, text: spokenText, master: { characters: Object.values(content?.characters ?? {}) } });
}

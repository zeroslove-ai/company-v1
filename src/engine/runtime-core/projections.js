import { GameCoreError } from '../errors.js';
import { hydrateCanonicalScene, isPlayerId } from './scene-reducer.js';

function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function id(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }

/** Write the canonical scene to the legacy compatibility fields, and only those fields. */
export function projectCanonicalSceneToLegacy(save, scene, options = {}) {
  const next = clone(plain(save) ? save : {});
  const canonical = plain(scene) ? scene : hydrateCanonicalScene(next, options);
  const playerId = id(options.playerId) ?? id(next.player?.player_id) ?? id(next.player?.id) ?? 'player-1';
  const present = [...new Set((Array.isArray(canonical.present_npc_ids) ? canonical.present_npc_ids : [])
    .filter(value => id(value) && !isPlayerId(value, playerId)))];
  const participants = [playerId, ...present];
  next.scene = {
    version: 1,
    scene_id: canonical.scene_id ?? null,
    location_id: canonical.location_id ?? null,
    beat: Number.isInteger(canonical.beat) ? canonical.beat : 0,
    goal: canonical.goal ?? null,
    focus_thread: canonical.focus_thread ?? null,
    present_npc_ids: present,
    focal_character_id: canonical.focal_character_id ?? null,
    last_speaker_id: canonical.last_speaker_id ?? null,
    updated_turn: Number.isInteger(canonical.updated_turn) ? canonical.updated_turn : 0
  };
  const oldScene = plain(next.scene_state) ? next.scene_state : {};
  next.scene_state = {
    ...oldScene,
    scene_id: canonical.scene_id ?? null,
    location_id: canonical.location_id ?? null,
    beat: Number.isInteger(canonical.beat) ? canonical.beat : 0,
    scene_goal: canonical.goal ?? null,
    focus_thread: canonical.focus_thread ?? null,
    participants
  };
  next.last_npcs_present = [...present];
  next.focal_character_id = canonical.focal_character_id ?? null;
  next.last_speaker_id = canonical.last_speaker_id ?? null;
  const npcState = plain(next.npc_scene_state) ? { ...next.npc_scene_state } : {};
  const presentSet = new Set(present);
  for (const npcId of new Set([...Object.keys(npcState), ...present])) {
    const prior = plain(npcState[npcId]) ? npcState[npcId] : {};
    if (presentSet.has(npcId)) {
      npcState[npcId] = { ...prior, present: true, scene_id: canonical.scene_id ?? null, location_id: canonical.location_id ?? null };
    } else {
      npcState[npcId] = { ...prior, present: false };
    }
  }
  next.npc_scene_state = npcState;
  return next;
}

/** Build a normalized legacy-shaped observation for diagnostics and compatibility callers. */
export function buildLegacySceneProjection(save, options = {}) {
  const scene = hydrateCanonicalScene(save, options);
  return projectCanonicalSceneToLegacy(save, scene, options);
}

export function assertCanonicalSceneInvariants({ save, scene, npcIds, parsedStory, playerId } = {}) {
  const current = plain(scene) ? scene : {};
  const registered = npcIds instanceof Set ? npcIds : new Set(Array.isArray(npcIds) ? npcIds : []);
  const player = id(playerId) ?? id(save?.player?.player_id) ?? id(save?.player?.id) ?? 'player-1';
  if (!Array.isArray(current.present_npc_ids)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'present_npc_ids must be an array');
  if (new Set(current.present_npc_ids).size !== current.present_npc_ids.length) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'present_npc_ids must be unique');
  for (const npcId of current.present_npc_ids) {
    if (!id(npcId) || isPlayerId(npcId, player) || (registered.size && !registered.has(npcId))) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `invalid present NPC: ${npcId}`);
  }
  if (current.focal_character_id !== null && !current.present_npc_ids.includes(current.focal_character_id)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'focal_character_id must be present');
  const parsedIds = Array.isArray(parsedStory?.dialogue_lines) ? parsedStory.dialogue_lines.map(line => id(line?.speaker_id)).filter(Boolean) : null;
  if (parsedIds && parsedIds.length > 0 && current.last_speaker_id !== null && !parsedIds.includes(current.last_speaker_id)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'last_speaker_id is not from current Story');
  const projected = projectCanonicalSceneToLegacy(save ?? {}, current, { playerId: player });
  if (JSON.stringify(projected.scene_state.participants) !== JSON.stringify([player, ...current.present_npc_ids])) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'legacy participants diverge');
  if (JSON.stringify(projected.last_npcs_present) !== JSON.stringify(current.present_npc_ids)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'legacy presence diverges');
  for (const [npcId, state] of Object.entries(plain(save?.npc_scene_state) ? save.npc_scene_state : {})) {
    const expectedPresent = current.present_npc_ids.includes(npcId);
    if (Boolean(state?.present) !== expectedPresent) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `legacy NPC presence diverges: ${npcId}`);
    if (expectedPresent && (state?.location_id !== (current.location_id ?? null) || state?.scene_id !== (current.scene_id ?? null))) {
      throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `legacy NPC location diverges: ${npcId}`);
    }
  }
  return true;
}

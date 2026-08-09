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
    updated_turn: Number.isInteger(canonical.updated_turn) ? canonical.updated_turn : 0,
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

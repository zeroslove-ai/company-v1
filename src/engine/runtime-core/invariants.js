import { GameCoreError } from '../errors.js';
import { isPlayerId } from './scene-reducer.js';

function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function id(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function same(a, b) { return JSON.stringify(stable(a)) === JSON.stringify(stable(b)); }

export function assertCanonicalSceneInvariants({ save, scene, npcIds, parsedStory, actionKind, playerId } = {}) {
  const current = plain(scene) ? scene : {};
  const source = plain(save) ? save : {};
  const registered = npcIds instanceof Set ? npcIds : new Set(Array.isArray(npcIds) ? npcIds : []);
  const player = id(playerId) ?? id(source.player?.player_id) ?? id(source.player?.id) ?? 'player-1';
  if (!Array.isArray(current.present_npc_ids)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'present_npc_ids must be an array');
  if (new Set(current.present_npc_ids).size !== current.present_npc_ids.length) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'present_npc_ids must be unique');
  for (const npcId of current.present_npc_ids) {
    if (!id(npcId) || isPlayerId(npcId, player) || (registered.size && !registered.has(npcId))) {
      throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `invalid present NPC: ${npcId}`);
    }
  }
  if (current.focal_character_id !== null && !current.present_npc_ids.includes(current.focal_character_id)) {
    throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'focal_character_id must be present');
  }
  const expectedScene = {
    version: 1,
    scene_id: current.scene_id ?? null,
    location_id: current.location_id ?? null,
    beat: current.beat,
    goal: current.goal ?? null,
    focus_thread: current.focus_thread ?? null,
    present_npc_ids: [...current.present_npc_ids],
    focal_character_id: current.focal_character_id ?? null,
    last_speaker_id: current.last_speaker_id ?? null,
    updated_turn: current.updated_turn
  };
  if (!same(source.scene, expectedScene)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'canonical scene object diverges');
  if (actionKind !== 'feedback_revision' && parsedStory && Array.isArray(parsedStory.dialogue_lines)) {
    const parsedIds = parsedStory.dialogue_lines.map(line => id(line?.speaker_id)).filter(Boolean);
    const expectedLast = parsedIds.at(-1) ?? null;
    if ((current.last_speaker_id ?? null) !== expectedLast) {
      throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'canonical last speaker diverges from current Story');
    }
  }
  return true;
}

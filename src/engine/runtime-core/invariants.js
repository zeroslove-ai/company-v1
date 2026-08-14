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
  const sceneState = plain(source.scene_state) ? source.scene_state : null;
  const participants = [player, ...current.present_npc_ids];
  if (sceneState) {
    for (const [field, expected] of [
      ['scene_id', current.scene_id ?? null],
      ['location_id', current.location_id ?? null],
      ['beat', current.beat],
      ['scene_goal', current.goal ?? null],
      ['focus_thread', current.focus_thread ?? null],
      ['updated_turn', current.updated_turn]
    ]) {
      if (Object.prototype.hasOwnProperty.call(sceneState, field) && !same(sceneState[field], expected)) {
        throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `scene_state.${field} diverges`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(sceneState, 'participants') && !same(sceneState.participants, participants)) {
      throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'scene_state.participants diverges');
    }
  }
  if (Object.prototype.hasOwnProperty.call(source, 'last_npcs_present')
    && !same(source.last_npcs_present, current.present_npc_ids)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'legacy presence diverges');
  if (Object.prototype.hasOwnProperty.call(source, 'focal_character_id')
    && (source.focal_character_id ?? null) !== (current.focal_character_id ?? null)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'legacy focal diverges');
  if (Object.prototype.hasOwnProperty.call(source, 'last_speaker_id')
    && (source.last_speaker_id ?? null) !== (current.last_speaker_id ?? null)) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'legacy last speaker diverges');
  for (const [npcId, state] of Object.entries(plain(source.npc_scene_state) ? source.npc_scene_state : {})) {
    const expectedPresent = current.present_npc_ids.includes(npcId);
    if (Object.prototype.hasOwnProperty.call(state ?? {}, 'present')
      && Boolean(state?.present) !== expectedPresent) throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `legacy NPC presence diverges: ${npcId}`);
    if (expectedPresent && Object.prototype.hasOwnProperty.call(state ?? {}, 'location_id')
      && (state?.location_id !== (current.location_id ?? null) || (Object.prototype.hasOwnProperty.call(state, 'scene_id') && state?.scene_id !== (current.scene_id ?? null)))) {
      throw new GameCoreError('CANONICAL_SCENE_INVARIANT', `legacy NPC location diverges: ${npcId}`);
    }
  }
  if (actionKind !== 'feedback_revision' && parsedStory && Array.isArray(parsedStory.dialogue_lines)) {
    const parsedIds = parsedStory.dialogue_lines.map(line => id(line?.speaker_id)).filter(Boolean);
    const expectedLast = parsedIds.at(-1) ?? null;
    if ((current.last_speaker_id ?? null) !== expectedLast) {
      throw new GameCoreError('CANONICAL_SCENE_INVARIANT', 'canonical last speaker diverges from current Story');
    }
  }
  return true;
}

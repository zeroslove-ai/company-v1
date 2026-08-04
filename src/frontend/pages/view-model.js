function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function text(value) {
  return typeof value === 'string' ? value : '';
}

function integer(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isInteger(Number(value))) return Number(value);
  return null;
}

function imageId(value) {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : null;
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function strings(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : [];
}

function saveFromContext(context) {
  return object(context?.save?.data) ?? object(context?.save) ?? {};
}

function latestTurn(context) {
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return object(turns.at(-1)) ?? {};
}

function parsed(turn) {
  return object(turn?.parsed_blocks) ?? {};
}

function choices(save, turn) {
  const saved = strings(save.last_choices);
  if (saved.length > 0) return saved;
  const committed = strings(turn.choices);
  if (committed.length > 0) return committed;
  return strings(parsed(turn).choices);
}

function committedTurn(context, save) {
  return integer(context?.save?.committed_turn) ?? integer(save.turn_state?.committed_turn) ?? 0;
}

function mindMonitor(currentExtract, turn) {
  return object(object(currentExtract)?.mind_monitor) ?? object(turn.mind_monitor) ?? {};
}

function npcView(save, id) {
  if (!id) return null;
  const stats = object(save.npc_stats)?.[id];
  const relationship = object(save.npc_relationship_state)?.[id];
  const emotion = object(save.npc_emotion)?.[id];
  if (!stats && !relationship && !emotion) return null;
  return { id, stats: object(stats) ?? {}, relationship: object(relationship) ?? {}, emotion: object(emotion) ?? {} };
}

/**
 * Converts immutable Company Context data to display-safe values.
 * It deliberately does not merge, persist, fetch, or infer missing game state.
 */
export function buildCompanyGameViewModel(context, runtime = {}) {
  const save = saveFromContext(context);
  const turn = latestTurn(context);
  const parsedStory = parsed(turn);
  const currentExtract = object(runtime)?.currentExtract;
  const focalId = text(save.focal_character_id);
  const lastSpeakerId = text(save.last_speaker_id);
  const scene = object(save.scene_state) ?? {};
  const player = object(save.player) ?? {};
  const playerSexualState = object(save.player_sexual_state) ?? {};
  const playerSceneState = object(save.player_scene_state) ?? {};
  const focalSceneState = object(object(save.npc_scene_state)?.[focalId]) ?? {};

  return {
    turn: {
      committed_turn: committedTurn(context, save),
      turn_id: text(turn.turn_id),
      action_id: text(turn.action_id),
      player_action: text(turn.player_action),
      turn_summary: text(turn.turn_summary),
      replayed: turn.replayed === true
    },
    story: {
      story_text: text(turn.story_text),
      blocks: Array.isArray(parsedStory.blocks) ? parsedStory.blocks : [],
      choices: choices(save, turn),
      player_status: text(parsedStory.player_status),
      player_inner_thought: text(parsedStory.player_inner_thought),
      dialogue_lines: [],
      warnings: strings(parsedStory.warnings)
    },
    scene: {
      scene_state: scene,
      world_state: object(save.world_state) ?? {},
      story_summary_recent: text(save.story_summary_recent),
      csa_active: strings(save.csa_active),
      npcs_present: strings(save.last_npcs_present),
      action_target_id: '',
      clothing_state: null
    },
    focal_character: {
      id: focalId,
      last_speaker_id: lastSpeakerId,
      character: npcView(save, focalId),
      scene_state: {
        location_label: text(focalSceneState.location_label),
        posture: text(focalSceneState.posture),
        clothing: object(focalSceneState.clothing) ?? {}
      }
    },
    player: {
      state: player,
      stats: object(save.npc_stats)?.player ?? {},
      name: text(player.name ?? save.player_name),
      department: text(player.department ?? save.player_department),
      excitement: numberOrNull(playerSexualState.arousal),
      ejaculation_progress: numberOrNull(playerSexualState.ejaculation_progress),
      ejaculation_count: numberOrNull(playerSexualState.ejaculation_count),
      status: text(parsedStory.player_status),
      inner_thought: text(parsedStory.player_inner_thought),
      location_label: text(playerSceneState.location_label),
      posture: text(playerSceneState.posture),
      clothing: object(playerSceneState.clothing) ?? {}
    },
    media: {
      image_id: imageId(save.last_image_id),
      image_character_id: '',
      image_selection: null,
      mind_monitor: mindMonitor(currentExtract, turn)
    }
  };
}

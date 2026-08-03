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
      player_inner_thought: '',
      dialogue_lines: [],
      warnings: strings(parsedStory.warnings)
    },
    scene: {
      scene_state: scene,
      npcs_present: strings(save.last_npcs_present),
      action_target_id: '',
      clothing_state: null
    },
    focal_character: {
      id: focalId,
      last_speaker_id: lastSpeakerId,
      character: npcView(save, focalId)
    },
    player: {
      state: object(save.player) ?? {},
      stats: object(save.player_stats) ?? {},
      status: text(parsedStory.player_status),
      inner_thought: ''
    },
    media: {
      image_id: imageId(save.last_image_id),
      image_character_id: '',
      image_selection: null,
      mind_monitor: mindMonitor(currentExtract, turn)
    }
  };
}

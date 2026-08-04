import { CATALOGS } from './catalogs.js';

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

function catalogName(list, idField, id) {
  if (typeof id !== 'string' || !id) return '';
  return text(list.find(item => item?.[idField] === id)?.name);
}

function characterName(save, id) {
  if (!id) return '';
  for (const source of [save.characters, save.npc_profiles, save.npc_identity_state, save.npc_state]) {
    const name = text(object(object(source)?.[id])?.name);
    if (name) return name;
  }
  return catalogName(CATALOGS.characters ?? [], 'character_id', id);
}

function normalizeDialogueLines(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => object(item))
    .map((item, index) => ({
      speaker_id: text(item.speaker_id ?? item.character_id),
      speaker_name: text(item.speaker_name ?? item.speaker),
      direction: text(item.direction),
      text: text(item.text),
      order: integer(item.order) ?? index
    }))
    .filter(item => item.text.trim())
    .sort((left, right) => left.order - right.order);
}

function dialogueLines(currentExtract, parsedStory) {
  const extractLines = normalizeDialogueLines(currentExtract?.dialogue_lines);
  if (extractLines.length) return extractLines;
  const parsedLines = normalizeDialogueLines(parsedStory?.dialogue_lines);
  if (parsedLines.length) return parsedLines;
  if (!Array.isArray(parsedStory?.blocks)) return [];
  return normalizeDialogueLines(parsedStory.blocks
    .filter(block => block?.type === 'dialogue' && typeof block.text === 'string' && block.text.trim())
    .map((block, order) => ({
      speaker_id: block.speaker_id ?? block.character_id,
      speaker_name: block.speaker ?? block.speaker_name,
      text: block.text,
      direction: block.direction,
      order
    })));
}

function mindMonitorEntries(save, monitor, preferredIds = []) {
  const source = object(monitor) ?? {};
  const entries = Object.entries(source)
    .filter(([, value]) => object(value))
    .map(([id, value]) => ({
      id,
      name: characterName(save, id) || id,
      surface: text(value.surface ?? value['표면의식']),
      subconscious: text(value.subconscious ?? value.latent ?? value['잠재의식'])
    }))
    .filter(entry => entry.surface || entry.subconscious);
  const rank = new Map(preferredIds.filter(Boolean).map((id, index) => [id, index]));
  return entries.sort((left, right) => (rank.get(left.id) ?? 99) - (rank.get(right.id) ?? 99));
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
  const imageCharacterId = text(currentExtract?.image_character_id ?? currentExtract?.character_id) || focalId || lastSpeakerId;
  const monitor = mindMonitor(currentExtract, turn);
  const monitorEntries = mindMonitorEntries(save, monitor, [imageCharacterId, focalId, lastSpeakerId]);

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
      dialogue_lines: dialogueLines(currentExtract, parsedStory),
      warnings: strings(parsedStory.warnings)
    },
    scene: {
      scene_state: scene,
      world_state: object(save.world_state) ?? {},
      story_summary_recent: text(save.story_summary_recent),
      csa_active: Array.isArray(save.csa_active) ? save.csa_active : [],
      npcs_present: strings(save.last_npcs_present),
      action_target_id: text(currentExtract?.action_target_id),
      clothing_state: object(currentExtract?.clothing_state)
    },
    focal_character: {
      id: focalId,
      name: characterName(save, focalId),
      last_speaker_id: lastSpeakerId,
      character: npcView(save, focalId),
      scene_state: {
        location_label: text(focalSceneState.location_label),
        posture: text(focalSceneState.posture),
        posture_detail: text(focalSceneState.posture_detail ?? focalSceneState.posture_description),
        position_label: text(focalSceneState.position_label),
        relative_position: text(
          focalSceneState.relative_position
          ?? focalSceneState.position_relative_to_player
          ?? focalSceneState.relative_to_player
          ?? focalSceneState.physical_relation
        ),
        clothing: object(focalSceneState.clothing) ?? {}
      }
    },
    player: {
      state: player,
      stats: object(save.npc_stats)?.player ?? {},
      name: text(player.name ?? save.player_name),
      department: text(player.department)
        || catalogName(CATALOGS.departments, 'department_id', player.department_id)
        || text(save.player_department),
      position: text(player.position)
        || catalogName(CATALOGS.positions, 'position_id', player.position_id),
      excitement: numberOrNull(playerSexualState.arousal),
      ejaculation_progress: numberOrNull(playerSexualState.ejaculation_progress),
      ejaculation_count: numberOrNull(playerSexualState.ejaculation_count),
      status: text(parsedStory.player_status),
      inner_thought: text(parsedStory.player_inner_thought),
      location_label: text(playerSceneState.location_label),
      posture: text(playerSceneState.posture),
      posture_detail: text(playerSceneState.posture_detail ?? playerSceneState.posture_description),
      position_label: text(playerSceneState.position_label),
      clothing: object(playerSceneState.clothing) ?? {}
    },
    media: {
      image_id: imageId(currentExtract?.image_id ?? save.last_image_id),
      image_character_id: imageCharacterId,
      image_selection: object(currentExtract?.image_selection),
      image_pool: currentExtract?.is_sexual === true ? 'sex' : 'general',
      image_situation: text(currentExtract?.image_reasoning) || text(turn.turn_summary),
      dialogue_lines: dialogueLines(currentExtract, parsedStory),
      mind_monitor: monitor,
      mind_monitor_entries: monitorEntries,
      default_mind_character_id: monitorEntries[0]?.id ?? ''
    }
  };
}

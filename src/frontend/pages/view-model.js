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
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
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

function characterName(save, id, directory = {}, details = {}) {
  if (!id) return '';
  const detailedName = text(object(details)?.[id]?.name);
  if (detailedName) return detailedName;
  const projectedName = text(object(directory)?.[id]?.name);
  if (projectedName) return projectedName;
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

function normalizedStats(value) {
  const source = object(value) ?? {};
  return {
    affinity: numberOrNull(source.affinity ?? source.affection ?? source['호감도']) ?? 0,
    resistance: numberOrNull(source.resistance ?? source['저항도']) ?? 0,
    csa_acceptance: numberOrNull(source.csa_acceptance ?? source.acceptance ?? source['상식수용도']) ?? 0,
    sexual_arousal: numberOrNull(source.sexual_arousal ?? source.arousal ?? source['성적흥분도']) ?? 0
  };
}

function normalizedChanges(value) {
  const source = object(value) ?? {};
  const result = {};
  for (const key of ['affinity', 'resistance', 'csa_acceptance', 'sexual_arousal']) {
    const entry = object(source[key]);
    const delta = numberOrNull(entry?.delta);
    if (delta === null || delta === 0) continue;
    result[key] = { from: numberOrNull(entry.from), to: numberOrNull(entry.to), delta };
  }
  return result;
}

function detailFor(details, id) {
  const detail = object(object(details)?.[id]) ?? {};
  return {
    profile: object(detail.profile) ?? {},
    body: object(detail.body) ?? {},
    stats: normalizedStats(detail.stats),
    stat_changes: normalizedChanges(detail.stat_changes),
    relationship_summary: text(detail.relationship_summary),
    relationship_record: object(detail.relationship_record) ?? {},
    private_info: object(detail.private_info) ?? { unlocked: false }
  };
}

function mindMonitorEntries(save, monitor, preferredIds = [], directory = {}, details = {}) {
  const source = object(monitor) ?? {};
  const ids = new Set([...Object.keys(source), ...preferredIds.filter(Boolean), ...strings(save.last_npcs_present)]);
  const rank = new Map(preferredIds.filter(Boolean).map((id, index) => [id, index]));
  return [...ids].map(id => {
    const value = object(source[id]) ?? {};
    const detail = detailFor(details, id);
    const savedStats = object(object(save.npc_stats)?.[id]);
    const hasDetail = Boolean(object(details)?.[id]);
    const entry = {
      id,
      name: characterName(save, id, directory, details) || id,
      surface: text(value.surface ?? value['표면의식']),
      subconscious: text(value.subconscious ?? value.latent ?? value['잠재의식'])
    };
    if (hasDetail || savedStats) {
      entry.stats = hasDetail ? detail.stats : normalizedStats(savedStats);
      entry.stat_changes = hasDetail ? detail.stat_changes : {};
    }
    if (hasDetail) {
      entry.relationship_summary = detail.relationship_summary;
      entry.relationship_record = detail.relationship_record;
      entry.private_info = detail.private_info;
    }
    return entry;
  }).filter(entry => entry.id && (entry.surface || entry.subconscious || object(details)?.[entry.id] || object(save.npc_stats)?.[entry.id]))
    .sort((left, right) => (rank.get(left.id) ?? 99) - (rank.get(right.id) ?? 99));
}

function npcView(save, id, details = {}) {
  if (!id) return null;
  const stats = object(save.npc_stats)?.[id];
  const relationship = object(save.npc_relationship_state)?.[id];
  const emotion = object(save.npc_emotion)?.[id];
  const detail = object(details?.[id]);
  if (!stats && !relationship && !emotion && !detail) return null;
  return {
    id,
    stats: detail ? normalizedStats(detail.stats) : normalizedStats(stats),
    stat_changes: normalizedChanges(detail?.stat_changes),
    relationship: object(relationship) ?? {},
    emotion: object(emotion) ?? {},
    profile: object(detail?.profile) ?? {},
    body: object(detail?.body) ?? {},
    relationship_summary: text(detail?.relationship_summary),
    relationship_record: object(detail?.relationship_record) ?? {},
    private_info: object(detail?.private_info) ?? { unlocked: false }
  };
}

function npcSceneView(save, id) {
  const state = object(object(save.npc_scene_state)?.[id]) ?? {};
  return {
    location_label: text(state.location_label),
    posture: text(state.posture),
    posture_detail: text(state.posture_detail ?? state.posture_description),
    position_label: text(state.position_label),
    relative_position: text(state.relative_position ?? state.position_relative_to_player ?? state.relative_to_player ?? state.physical_relation),
    clothing: object(state.clothing) ?? {}
  };
}

/** 현재 장면 참여 정본만 사용한다. focal을 먼저 두고, 퇴장(present:false)은 제외한다. */
function interactingCharacterViews(save, focalId, directory = {}, details = {}) {
  const playerId = text(object(save.player)?.player_id) || 'player';
  const participantIds = strings(object(save.scene_state)?.participants);
  const orderedIds = [...new Set([focalId, ...strings(save.last_npcs_present), ...participantIds])];
  return orderedIds
    .filter(id => id && id !== 'player' && id !== playerId && !id.startsWith('player'))
    .filter(id => object(object(save.npc_scene_state)?.[id])?.present !== false)
    .map(id => ({
      id,
      name: characterName(save, id, directory, details) || id,
      scene_state: npcSceneView(save, id)
    }));
}

function fallbackActiveRules(save) {
  const rules = object(save.csa_rules) ?? {};
  return strings(save.csa_active).flatMap(id => {
    const rule = object(rules[id]);
    if (!rule || rule.active === false) return [];
    return [{ id, strength: text(rule.strength), strength_label: text(rule.strength), authority_label: text(rule.authority_label), scope_label: text(rule.scope_label) || '회사 전체', content: text(rule.content ?? rule.required_action) }];
  });
}

export function buildCompanyGameViewModel(context, runtime = {}) {
  const save = saveFromContext(context);
  const turn = latestTurn(context);
  const parsedStory = parsed(turn);
  const currentExtract = object(runtime)?.currentExtract;
  const display = object(context?.display) ?? {};
  const directory = object(display.npc_directory) ?? {};
  const details = object(display.character_details) ?? {};
  const capability = object(display.player_capability) ?? {};
  const sexualDisplay = object(display.player_sexual) ?? {};
  const activeRules = Array.isArray(display.active_csa) ? display.active_csa.filter(object) : fallbackActiveRules(save);
  const focalId = text(save.focal_character_id);
  const lastSpeakerId = text(save.last_speaker_id);
  const scene = object(save.scene_state) ?? {};
  const player = object(save.player) ?? {};
  const playerProgress = object(save.player_progress) ?? {};
  const playerSexualState = object(save.player_sexual_state) ?? {};
  const playerSceneState = object(save.player_scene_state) ?? {};
  const focalSceneState = npcSceneView(save, focalId);
  const interactingCharacters = interactingCharacterViews(save, focalId, directory, details);
  const imageCharacterId = text(currentExtract?.image_character_id ?? currentExtract?.character_id) || focalId || lastSpeakerId;
  const monitor = mindMonitor(currentExtract, turn);
  const monitorEntries = mindMonitorEntries(save, monitor, [imageCharacterId, focalId, lastSpeakerId], directory, details);

  return {
    turn: {
      committed_turn: committedTurn(context, save), turn_id: text(turn.turn_id), action_id: text(turn.action_id),
      player_action: text(turn.player_action), turn_summary: text(turn.turn_summary),
      turn_changes: Array.isArray(turn.turn_changes) ? turn.turn_changes : [], replayed: turn.replayed === true
    },
    story: {
      story_text: text(turn.story_text), blocks: Array.isArray(parsedStory.blocks) ? parsedStory.blocks : [],
      choices: choices(save, turn), player_inner_thought: text(parsedStory.player_inner_thought),
      dialogue_lines: dialogueLines(currentExtract, parsedStory), warnings: strings(parsedStory.warnings)
    },
    scene: {
      scene_state: scene, world_state: object(save.world_state) ?? {}, story_summary_recent: text(save.story_summary_recent),
      csa_active: Array.isArray(save.csa_active) ? save.csa_active : [], csa_rules: activeRules,
      npcs_present: strings(save.last_npcs_present), action_target_id: text(currentExtract?.action_target_id), clothing_state: object(currentExtract?.clothing_state)
    },
    interacting_characters: interactingCharacters,
    focal_character: {
      id: focalId, name: characterName(save, focalId, directory, details), last_speaker_id: lastSpeakerId,
      character: npcView(save, focalId, details),
      scene_state: focalSceneState
    },
    player: {
      state: player, stats: object(save.npc_stats)?.player ?? {}, name: text(player.name ?? save.player_name),
      department: text(player.department) || catalogName(CATALOGS.departments, 'department_id', player.department_id) || text(save.player_department),
      position: text(player.position) || catalogName(CATALOGS.positions, 'position_id', player.position_id),
      level: integer(capability.level) ?? integer(playerProgress.level) ?? 1,
      exp: integer(capability.exp) ?? integer(playerProgress.exp) ?? 0,
      next_level_exp: integer(capability.next_level_exp), active_csa_count: integer(capability.active_csa_count) ?? activeRules.length,
      max_active_csa: integer(capability.max_active_csa),
      active_csa: activeRules.map(rule => ({ id: text(rule.id), strength: text(rule.strength), strength_label: text(rule.strength_label), authority_label: text(rule.authority_label), scope_label: text(rule.scope_label) || '회사 전체', content: text(rule.content) })),
      excitement: numberOrNull(sexualDisplay.arousal) ?? numberOrNull(playerSexualState.arousal),
      ejaculation_progress: numberOrNull(sexualDisplay.ejaculation_progress) ?? numberOrNull(playerSexualState.ejaculation_progress ?? playerSexualState.ejaculation_meter),
      ejaculation_count: numberOrNull(sexualDisplay.ejaculation_count) ?? numberOrNull(playerSexualState.ejaculation_count),
      total_sexual_events: numberOrNull(sexualDisplay.total_sexual_events), last_sexual_event: object(sexualDisplay.last_sexual_event),
      inner_thought: text(parsedStory.player_inner_thought),
      location_label: text(playerSceneState.location_label) || text(scene.location_label),
      posture: text(playerSceneState.posture), posture_detail: text(playerSceneState.posture_detail ?? playerSceneState.posture_description),
      position_label: text(playerSceneState.position_label), clothing: object(playerSceneState.clothing) ?? {}
    },
    media: {
      image_id: imageId(currentExtract?.image_id ?? save.last_image_id), image_character_id: imageCharacterId,
      image_selection: object(currentExtract?.image_selection), image_pool: currentExtract?.is_sexual === true ? 'sex' : 'general',
      image_situation: text(currentExtract?.image_reasoning) || text(turn.turn_summary), dialogue_lines: dialogueLines(currentExtract, parsedStory),
      mind_monitor: monitor, mind_monitor_entries: monitorEntries, default_mind_character_id: monitorEntries[0]?.id ?? ''
    }
  };
}

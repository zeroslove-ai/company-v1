import { CATALOGS } from './catalogs.js';
import { contextChoices } from './state.js';

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

function strings(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : [];
}

function isPlayerAlias(id, playerId) {
  return id === 'player' || id === playerId || id.startsWith('player-') || id.startsWith('player_');
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

function committedTurn(context, save) {
  return integer(context?.save?.committed_turn) ?? integer(save.turn_state?.committed_turn) ?? 0;
}

export function canonicalSceneView(save, projectedScene = null) {
  const source = object(projectedScene) ?? object(save?.scene);
  const playerId = text(object(save?.player)?.player_id) || 'player';
  const normalizeIds = value => strings(value).filter(id => !isPlayerAlias(id, playerId));
  if (source && source.version === 1) {
    return {
      version: 1,
      location_id: text(source.location_id),
      present_npc_ids: normalizeIds(source.present_npc_ids),
      focal_character_id: text(source.focal_character_id),
      last_speaker_id: text(source.last_speaker_id),
      updated_turn: integer(source.updated_turn)
    };
  }
  return {
    version: 1,
    location_id: '',
    present_npc_ids: [],
    focal_character_id: '',
    last_speaker_id: '',
    updated_turn: null
  };
}

function mindMonitor(turn) {
  // Extract is a pre-Commit working observation, never a readback authority.
  return object(turn?.mind_monitor) ?? {};
}

const MEDIA_ACTION_TAGS = Object.freeze([
  'handjob', 'fellatio', 'deepthroat', 'fingering', 'cunnilingus', 'breast_sucking',
  'missionary', 'doggystyle', 'cowgirl', 'anal', 'standing_rear', 'penetration',
  'facial_cumshot', 'body_cumshot', 'oral_cumshot', 'creampie', 'cumshot', 'genital_touch'
]);
const MEDIA_TAG_ALIASES = Object.freeze({
  oral: ['fellatio', 'cunnilingus'], climax: ['cumshot'], orgasm: ['cumshot'],
  '성기': ['genital_touch'], '구강': ['fellatio'], '삽입': ['penetration'],
  '사정': ['cumshot'], '오르가즘': ['cumshot'], '절정': ['cumshot']
});

/** Committed-text-only, presentation-only media hint; never gameplay authority. */
export function deriveCommittedMediaHint(turn = {}, scene = {}) {
  const parsedTurn = object(turn?.parsed_blocks) ?? {};
  const visibleText = [
    turn?.story_text, turn?.turn_summary,
    ...(Array.isArray(parsedTurn.dialogue_lines) ? parsedTurn.dialogue_lines.map(line => line?.text) : [])
  ].filter(value => typeof value === 'string' && value.trim()).join('\n').toLowerCase();
  const tags = [];
  for (const tag of MEDIA_ACTION_TAGS) if (visibleText.includes(tag)) tags.push(tag);
  for (const [needle, aliases] of Object.entries(MEDIA_TAG_ALIASES)) if (visibleText.includes(needle)) tags.push(...aliases);
  const uniqueTags = [...new Set(tags)];
  const pool = uniqueTags.length ? 'sex' : 'general';
  const locationId = text(scene?.location_id);
  const contextTag = ['brand_strategy_office', 'office', 'meeting_room', 'private_room', 'lounge', 'restroom']
    .find(tag => locationId === tag || visibleText.includes(tag));
  if (contextTag && pool === 'general') uniqueTags.push(contextTag);
  return { pool, tags: [...new Set(uniqueTags)], situation: text(turn?.turn_summary || turn?.story_text) };
}

function catalogName(list, idField, id) {
  if (typeof id !== 'string' || !id) return '';
  return text(list.find(item => item?.[idField] === id)?.name);
}

function characterName(id, directory = {}) {
  if (!id) return '';
  const projectedName = text(object(directory)?.[id]?.name);
  if (projectedName) return projectedName;
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

function dialogueLines(parsedStory, { playerName = '', save = {}, directory = {} } = {}) {
  const parsedLines = normalizeDialogueLines(parsedStory?.dialogue_lines);
  const lines = parsedLines.length ? parsedLines : (!Array.isArray(parsedStory?.blocks) ? [] : normalizeDialogueLines(parsedStory.blocks
    .filter(block => block?.type === 'dialogue' && typeof block.text === 'string' && block.text.trim())
    .map((block, order) => ({
      speaker_id: block.speaker_id ?? block.character_id,
      speaker_name: block.speaker ?? block.speaker_name,
      text: block.text,
      direction: block.direction,
      order
    }))));
  return lines.map(line => {
    const id = line.speaker_id;
    const resolved = isPlayerAlias(id, text(object(save.player)?.player_id) || 'player')
      ? playerName
      : characterName(id, directory);
    return resolved ? { ...line, speaker_name: resolved } : line;
  });
}

function detailFor(details, id) {
  const detail = object(object(details)?.[id]) ?? {};
  return {
    profile: object(detail.profile) ?? {},
    body: object(detail.body) ?? {},
    private_info: object(detail.private_info) ?? { unlocked: false }
  };
}

function mindMonitorEntries(save, monitor, scene, preferredIds = [], directory = {}) {
  const source = object(monitor) ?? {};
  const present = new Set(strings(scene?.present_npc_ids));
  const ids = new Set(Object.keys(source).filter(id => present.has(id)));
  const rank = new Map(strings(scene?.present_npc_ids).map((id, index) => [id, index]));
  return [...ids].map(id => {
    const value = object(source[id]) ?? {};
    const entry = {
      id,
      name: characterName(id, directory) || id,
      surface: text(value.surface ?? value['표면의식']),
      subconscious: text(value.subconscious ?? value.latent ?? value['잠재의식'])
    };
    return entry;
  }).filter(entry => entry.id && (entry.surface || entry.subconscious))
    .sort((left, right) => (rank.get(left.id) ?? 99) - (rank.get(right.id) ?? 99));
}

function npcView(save, id, details = {}) {
  if (!id) return null;
  const detail = object(details?.[id]);
  if (!detail) return null;
  return {
    id,
    profile: object(detail?.profile) ?? {},
    body: object(detail?.body) ?? {},
    private_info: object(detail?.private_info) ?? { unlocked: false }
  };
}

function npcSceneView(save, id) {
  const state = object(object(save.npc_scene_state)?.[id]) ?? {};
  return {
    posture: text(state.posture),
    posture_detail: text(state.posture_detail ?? state.posture_description),
    position_label: text(state.position_label),
    relative_position: text(state.relative_position ?? state.position_relative_to_player ?? state.relative_to_player ?? state.physical_relation),
    clothing: object(state.clothing) ?? {}
  };
}

/** 현재 장면 참여 정본만 사용한다. focal을 먼저 두고, 퇴장(present:false)은 제외한다. */
function interactingCharacterViews(save, scene, directory = {}) {
  const playerId = text(object(save.player)?.player_id) || 'player';
  const participantIds = strings(scene?.present_npc_ids);
  const focalId = text(scene?.focal_character_id);
  const orderedIds = focalId && participantIds.includes(focalId)
    ? [focalId, ...participantIds.filter(id => id !== focalId)]
    : participantIds;
  return orderedIds
    .filter(id => id && !isPlayerAlias(id, playerId))
    .map(id => ({
      id,
      name: characterName(id, directory) || id,
      scene_state: npcSceneView(save, id)
    }));
}

export function buildCompanyGameViewModel(context) {
  const save = saveFromContext(context);
  const turn = latestTurn(context);
  const parsedStory = parsed(turn);
  const display = object(context?.display) ?? {};
  const directory = object(display.npc_directory) ?? {};
  const details = object(display.character_details) ?? {};
  const capability = object(display.player_capability) ?? {};
  const activeRules = Array.isArray(display.active_csa) ? display.active_csa.filter(object) : [];
  const scene = canonicalSceneView(save, display.scene);
  const focalId = text(scene.focal_character_id);
  const lastSpeakerId = text(scene.last_speaker_id);
  const player = object(save.player) ?? {};
  const playerProgress = object(save.player_progress) ?? {};
  const playerSceneState = object(save.player_scene_state) ?? {};
  const focalSceneState = npcSceneView(save, focalId);
  const playerName = text(player.name);
  const projectedDialogueLines = dialogueLines(parsedStory, { playerName, save, directory });
  const interactingCharacters = interactingCharacterViews(save, scene, directory);
  const presentNpcIds = new Set(strings(scene.present_npc_ids));
  const lastLocalDialogueId = [...projectedDialogueLines].reverse().find(line => presentNpcIds.has(line.speaker_id))?.speaker_id ?? '';
  const focalFallback = focalId && presentNpcIds.has(focalId) ? focalId : '';
  const firstPresentFallback = [...presentNpcIds][0] ?? '';
  // Media is a deterministic post-commit sidecar; fresh Extract fields never select it.
  const imageCharacterId = lastLocalDialogueId || focalFallback || firstPresentFallback || '';
  const mediaHint = deriveCommittedMediaHint(turn, scene);
  const monitor = mindMonitor(turn);
  const monitorEntries = mindMonitorEntries(save, monitor, scene, [imageCharacterId, focalId], directory);

  return {
    turn: {
      committed_turn: committedTurn(context, save), turn_id: text(turn.turn_id), action_id: text(turn.action_id),
      player_action: text(turn.player_action), turn_summary: text(turn.turn_summary),
      turn_changes: Array.isArray(turn.turn_changes) ? turn.turn_changes : [], replayed: turn.replayed === true
    },
    story: {
      story_text: text(turn.story_text), blocks: Array.isArray(parsedStory.blocks) ? parsedStory.blocks : [],
      choices: strings(contextChoices(context)), player_inner_thought: text(parsedStory.player_inner_thought),
      dialogue_lines: projectedDialogueLines, warnings: strings(parsedStory.warnings)
    },
    scene: {
      ...scene,
      scene_state: { ...scene }, world_state: object(save.world_state) ?? {},
      csa_active: activeRules.map(rule => text(rule.id)).filter(Boolean), csa_rules: activeRules,
      npcs_present: strings(scene.present_npc_ids), action_target_id: '', clothing_state: {}
    },
    interacting_characters: interactingCharacters,
    focal_character: {
      id: focalId, name: characterName(focalId, directory), last_speaker_id: lastSpeakerId,
      character: npcView(save, focalId, details),
      scene_state: focalSceneState
    },
    player: {
      state: player, name: playerName,
      department: text(player.department) || catalogName(CATALOGS.departments, 'department_id', player.department_id),
      position: text(player.position) || catalogName(CATALOGS.positions, 'position_id', player.position_id),
      level: integer(capability.level) ?? integer(playerProgress.level) ?? 1,
      exp: integer(capability.exp) ?? integer(playerProgress.exp) ?? 0,
      next_level_exp: integer(capability.next_level_exp), active_csa_count: integer(capability.active_csa_count) ?? activeRules.length,
      max_active_csa: integer(capability.max_active_csa),
      active_csa: activeRules.map(rule => ({ id: text(rule.id), strength: text(rule.strength), strength_label: text(rule.strength_label), authority_label: text(rule.authority_label), scope_label: text(rule.scope_label) || '회사 전체', content: text(rule.content) })),
      erection_state: ['unknown', 'flaccid', 'partial', 'erect'].includes(save.player_sexual_state?.erection_state) ? save.player_sexual_state.erection_state : 'unknown',
      inner_thought: text(parsedStory.player_inner_thought),
      location_label: text((Array.isArray(display.map_locations) ? display.map_locations : []).find(location => location?.location_id === scene.location_id || location?.id === scene.location_id)?.name),
      posture: text(playerSceneState.posture), posture_detail: text(playerSceneState.posture_detail ?? playerSceneState.posture_description),
      position_label: text(playerSceneState.position_label), clothing: object(playerSceneState.clothing) ?? {}
    },
    media: {
      image_id: null, image_character_id: imageCharacterId,
      image_selection: mediaHint, image_pool: mediaHint.pool, image_tags: mediaHint.tags,
      image_situation: mediaHint.situation, dialogue_lines: projectedDialogueLines,
      mind_monitor: monitor, mind_monitor_entries: monitorEntries, default_mind_character_id: monitorEntries[0]?.id ?? ''
    }
  };
}

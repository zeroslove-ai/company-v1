import { buildSceneContextCore } from './gameplay-state.js';
import { buildRegisteredGeneralNpcs } from './workplace-context.js';
import { buildStoryWorldProjection } from './csa/story-projection.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function text(value, maxLength = 420) {
  if (typeof value !== 'string') return '';
  return Array.from(value.trim()).slice(0, maxLength).join('');
}

export function buildRegisteredCharacters(edition) {
  const charactersMap = object(edition?.characters?.characters);
  if (!charactersMap) return [];
  return Object.entries(charactersMap)
    .filter(([, character]) => object(character) && typeof character.name === 'string')
    .map(([character_id, character]) => ({ character_id, name: character.name }));
}

export function buildRegisteredLocations(edition) {
  const locations = Array.isArray(edition?.map?.locations) ? edition.map.locations : [];
  return locations
    .filter(location => object(location) && typeof location.location_id === 'string' && typeof location.name === 'string')
    .map(location => ({
      location_id: location.location_id,
      name: text(location.name, 80),
      aliases: Array.isArray(location.aliases)
        ? location.aliases.filter(alias => typeof alias === 'string' && alias.trim()).map(alias => text(alias, 80)).slice(0, 8)
        : [],
      floor: Number.isInteger(location.floor) ? location.floor : null,
      department_id: typeof location.department_id === 'string' ? location.department_id : null
    }));
}

function registeredIdentityEntries(edition) {
  return [
    ...buildRegisteredCharacters(edition).map(({ character_id, name }) => ({ id: character_id, name })),
    ...buildRegisteredGeneralNpcs(edition).map(({ npc_id, name }) => ({ id: npc_id, name }))
  ];
}

/**
 * Extract is a post-Story observer.  This set selects committed state to
 * show the observer; it is not an actor, speaker, or presence authority.
 */
export function buildExtractRelevantNpcIds({ context, parsedStory, storyText = '', edition, npcIds } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const registered = registeredIdentityEntries(edition);
  const registeredIds = npcIds instanceof Set && npcIds.size > 0
    ? npcIds
    : new Set(registered.map(entry => entry.id));
  const ids = new Set(buildSceneContextCore(save, []).scene.present_npc_ids);
  for (const line of Array.isArray(parsedStory?.dialogue_lines) ? parsedStory.dialogue_lines : []) {
    if (registeredIds.has(line?.speaker_id)) ids.add(line.speaker_id);
  }
  for (const entry of registered) {
    if (registeredIds.has(entry.id) && entry.name && storyText.includes(entry.name)) ids.add(entry.id);
  }
  return [...ids].filter(id => id && id !== 'player' && id !== 'player-1' && registeredIds.has(id));
}

/** Fresh Mind Monitor requires only actors observed in this turn. */
export function buildMindMonitorTargetIds({ context, parsedStory, npcIds } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const registeredIds = npcIds instanceof Set
    ? npcIds
    : new Set(Array.isArray(npcIds) ? npcIds : []);
  const ids = new Set(buildSceneContextCore(save, []).scene.present_npc_ids);
  for (const line of Array.isArray(parsedStory?.dialogue_lines) ? parsedStory.dialogue_lines : []) {
    if (registeredIds.has(line?.speaker_id)) ids.add(line.speaker_id);
  }
  return [...ids].filter(id => id && id !== 'player' && id !== 'player-1' && registeredIds.has(id));
}

export function buildExtractCharacterCanon(charactersMap, activeIds) {
  const map = object(charactersMap) ?? {};
  const result = {};
  for (const id of Array.isArray(activeIds) ? activeIds.slice(0, 4) : []) {
    const character = object(map[id]);
    if (!character) continue;
    const card = object(character.prompt_card) ?? {};
    result[id] = {
      name: text(character.name, 60), position: text(character.position, 60), role_title: text(character.role_title, 100),
      identity: text(card.identity), personality: text(card.personality), speech: text(card.speech),
      addressing: text(card.addressing),
      distinctive_traits: Array.isArray(card.distinctive_traits) ? card.distinctive_traits.filter(item => typeof item === 'string' && item.trim()).slice(0, 5) : [],
      csa_style: text(card.csa_style)
    };
  }
  return result;
}

function profileForMindMonitor(edition, id) {
  const character = object(edition?.characters?.characters?.[id])
    ?? object(edition?.generalNpcs?.profiles?.[id])
    ?? {};
  const card = object(character.prompt_card) ?? {};
  return {
    id,
    name: text(character.name, 60),
    position: text(character.position, 60),
    role_title: text(character.role_title ?? character.role, 100),
    personality: text(card.personality ?? character.personality, 420),
    speech: text(card.speech ?? character.speech, 420),
    csa_style: text(card.csa_style ?? character.csa_style, 420)
  };
}

function relationshipContext(save, id) {
  const value = object(save?.npc_relationship_state?.[id]) ?? {};
  return Object.fromEntries(['closeness', 'romance_status', 'current_boundary']
    .filter(key => value[key] !== undefined)
    .map(key => [key, value[key]]));
}

function sceneContext(save, id) {
  const value = object(save?.npc_scene_state?.[id]) ?? {};
  return Object.fromEntries(['present', 'location_id', 'position_label', 'posture', 'current_action']
    .filter(key => value[key] !== undefined)
    .map(key => [key, value[key]]));
}

/**
 * Identity-specific, read-only context for Mind Monitor generation.  Player
 * THOUGHT and raw Story text are deliberately not copied into this object.
 */
export function buildMindMonitorContext({ context, edition, targetIds = [], expectedTurn = null } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const ids = [...new Set((Array.isArray(targetIds) ? targetIds : []).filter(id => typeof id === 'string' && id.trim()))];
  const master = {
    characters: Object.entries(object(edition?.characters?.characters) ?? {}).map(([id, profile]) => ({ ...profile, character_id: profile?.character_id ?? id })),
    general_npcs: Object.entries(object(edition?.generalNpcs?.profiles) ?? {}).map(([id, profile]) => ({ ...profile, npc_id: profile?.npc_id ?? id }))
  };
  const world = buildStoryWorldProjection({ save, master, sceneActorIds: ids, expectedTurn });
  return ids.map(id => {
    const rules = world.world_rules
      .filter(rule => rule.applicable_scene_actor_ids?.includes(id))
      .map(rule => ({
        id: rule.id,
        content: rule.content,
        phase: rule.phase,
        institutional_form: rule.institutional_form,
        mode: rule.mode,
        clothing_projection: rule.clothing_projection?.actors?.find(actor => actor.actor_id === id) ?? null
      }));
    return {
      ...profileForMindMonitor(edition, id),
      relationship: relationshipContext(save, id),
      scene: sceneContext(save, id),
      active_csa: rules
    };
  });
}

function buildExtractContextProjection(context, activeIds) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  return buildSceneContextCore(save, activeIds);
}

const SYSTEM_INSTRUCTIONS = [
  'Return one JSON object only; no prose or Markdown.',
  'This is Extract Observation V2. Return extract_version exactly 2 and only the observation contract fields. Never return a save patch or arbitrary persistence path.',
  `Output exactly this V2 JSON shape (values may contain only observed data): ${JSON.stringify({
    extract_version: 2,
    outcome: 'success',
    scene_observation: {
      scene_id: null,
      location_id: null,
     final_present_npc_ids: null,
      entered_npc_ids: [],
      exited_npc_ids: [],
      presence_is_final: false,
     focal_candidate_id: null,
      remote_speaker_ids: [],
      evidence: []
    },
    player_observation: {},
    npc_observations: {},
     evidence: {},
    elapsed_minutes: 3,
    mind_monitor: {},
    action_target_id: null,
    image_character_id: null,
    image_selection: null,
    csa_trigger_evaluations: [],
    csa_runtime_updates: [],
    turn_summary: '',
    warnings: []
  })}`,
  'Never return these save-patch or parser fields: state_delta, choices, dialogue_lines, player_inner_thought, last_speaker_id, npcs_present, focal_character_id, csa_active, csa_rules, world_state, save.',
  'Observe only facts shown in the complete raw Story. Do not reconstruct, normalize, rewrite, or omit any Story text.',
  'Presence is fail-closed. registered identities list the only stable NPC ids; never invent, guess, or reuse an id. final_present_npc_ids is only a snapshot observation and omission from it never removes an NPC already present. Use entered_npc_ids and exited_npc_ids only when the Story explicitly shows the entrance or departure; each id must have a matching scene evidence quote of kind entrance or exit. A current scene actor remains present unless an exact quoted departure is supplied. Remote contacts/speakers are not local presence.',
  'Return final_present_npc_ids:null unless the Story explicitly establishes a complete final presence snapshot. If a current actor is omitted but no exact exit evidence exists, keep it out of exited_npc_ids and let the reducer preserve it. A newly seen actor may be entered only with exact entrance evidence.',
  'Parser projections are authoritative for the displayed Story selections, spoken-line order, and player inner monologue. Do not generate replacements for those projections in this observation. Mind Monitor interpretation evidence is separate from exact state evidence; it may not invent a new event, memory, agreement, contact, or fact.',
  'Return narrow player_observation and npc_observations projections only when a proven product/UI or mechanical consumer needs them. Compact clothing may use the four existing UI slots; physical posture/position and sexual counters are optional projections, never the universe of valid facts. Never propose scene, location, presence, or ID fields through a projection.',
   'Return npc_observations only for registered NPCs and only for narrow projections that the current product consumes. Do not use emotion/mood or relationship fields as the authority for arbitrary narrative meaning. Never return arbitrary nested save patches, absolute stats, resistance, last_changed_turn, milestones, or relationship_summary.',
  'The top-level keys of npc_observations must be registered NPC IDs, never a domain key; for example: {"npc_observations":{"heroine2":{"emotion":{"mood":"..."}}}}.',
   'If a narrow projection has no exact observed change, omit it. The safe minimal observation for ordinary dialogue is empty projections, no semantic event/relation taxonomy, scene_observation with final_present_npc_ids:null, and the remaining structural defaults.',
  'Exact evidence contract: evidence is a top-level sibling of player_observation and npc_observations. Never put an evidence key inside a player or NPC object. Use evidence.clothing.<actor_id>={quote,character_id}, evidence.changed {changed:[path],quote}, and scene evidence uses {kind,character_id or location_id,quote}; kind is presence, entrance, exit, or scene. Entrance/exit require registered ids and exact contiguous Story quotes; kind:"scene" requires scene_observation.scene_id. Copy quotes verbatim from story_text; never compose a quote from inferred facts or any input outside story_text. Omit unsupported or unobserved evidence; locations must be registered.',
  'Illustrative physical shape (not mandatory output): {"npc_observations":{"heroine2":{"physical":{"position_label":"회의실 테이블 옆","clothing":{"underwear_bottom":"removed"}}}},"evidence":{"clothing":{"heroine2":{"character_id":"heroine2","quote":"exact Story substring"}},"physical_change":{"changed":["npc_scene_state.heroine2.clothing.underwear_bottom"],"quote":"same exact substring"}}}. Use position_label, never position/label; posture is only "sitting" or "standing" when clear. In a multi-NPC scene, include the actor name in physical/clothing quotes. Clothing slots are uniform_top, uniform_bottom, underwear_top, underwear_bottom with states worn, removed, open, unknown. Copy the real Story substring and omit unobserved fields.',
   'Every retained narrow projection requires exact Story evidence. Narrative meaning that does not fit a proven compact projection remains ordinary Story/turn-summary continuity. Do not emit semantic event or relation arrays for fresh Extract; counters and projections never decide arbitrary narrative meaning.',
  'turn_summary is the compressed continuity memory for this completed Story only. Write concise free natural text covering important commitments, refusals, relationships, work, physical, clothing, or intimate continuity when actually present; do not use a taxonomy, labels, or invented detail. Empty text is allowed only when the Story genuinely has no continuity content. Do not summarize future intent or rewrite the raw Story.',
  'elapsed_minutes is the only time proposal: 1-30 normally, up to 480 only with evidence.time_advance=true. Never propose world clock fields.',
  'mind_monitor_targets is authoritative. For each target return nonempty unquoted first-person Korean surface/subconscious talk, grounded in that NPC only. Differentiate by personality/voice and never copy one into another. Before output, verify one entry per target with non-empty surface and subconscious; missing entries are fail-open warnings, never retries. [THOUGHT] is player-only; NPCs know rules, not app/player action.',
  'CSA observation is limited to csa_trigger_evaluations and csa_runtime_updates arrays. Never return csa_active, csa_rules, or a csa runtime save object.',
  'Announcement, compliance, embarrassment, or body reaction alone never raises affinity or sexual arousal. csa_acceptance records acceptance or resistance to that rule only. Exposure, erection, conversation, or requests alone never raise it (ejaculation progress). Progress is direct stimulation only: brief +1~2, sustained +2~4, strong +4~6. completion requires evidence.sexual_resolution === true when Story explicitly shows resolution. Never decrease/reset when stimulation stops. Before returning image_selection, reread the final physical scene only. If a sexual physical act is still being performed at the final moment, do not omit image_selection; return the existing sex-pool contract and tags describing that ongoing act.',
  'Mind Monitor style contract: surface and subconscious are each one natural Korean first-person inner monologue, spoken to self in conversational language. Do not write reports, status summaries, narrator prose, labels, "NPC는..." sentences, or the player THOUGHT; surface and subconscious must be distinct and personality-specific. Missing Mind Monitor remains fail-open. Final scene presence: a local dialogue speaker is evidence of presence during the Story, but removal requires an explicit exact quoted exit; if the final snapshot cannot be established, preserve null rather than guessing.'
   , 'Do not emit semantic relation_updates or closed events for fresh Extract. Narrative meaning without a proven narrow machine/UI consumer remains in the raw Story and turn_summary; never infer a durable state change from player intent alone.',
  'Explicit player physical continuity: preserve the observable kind and strength of player contact or sexual facts in Story evidence; do not euphemize them into an unidentifiable thing or pressure.',
].join(' ');

export function buildExtractPrompt({ context, storyText, parsedStory, expectedTurn, edition, npcIds, mindMonitorTargets = null }) {
  const relevantIds = buildExtractRelevantNpcIds({ context, parsedStory, storyText, edition, npcIds });
  const monitorIds = Array.isArray(mindMonitorTargets)
    ? mindMonitorTargets
    : buildMindMonitorTargetIds({ context, parsedStory, npcIds });
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        extract_version: 2,
        registered_identities: registeredIdentityEntries(edition),
        registered_locations: buildRegisteredLocations(edition),
        story_text: storyText,
        context: buildExtractContextProjection(context, relevantIds),
        mind_monitor_targets: monitorIds,
        mind_monitor_context: buildMindMonitorContext({ context, edition, targetIds: monitorIds, expectedTurn }),
        expected_turn: expectedTurn
      })
    }
  ];
}

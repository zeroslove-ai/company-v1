import { buildActiveCharacterCanon, buildSceneContextCore } from './gameplay-state.js';
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js';
import { buildGeneralNpcCanon, buildWorkplaceContext } from './workplace-context.js';
import { buildStoryWorldProjection } from './csa/story-projection.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function registeredIdentityEntries(edition) {
  const entries = [];
  for (const [id, character] of Object.entries(object(edition?.characters?.characters) ?? {})) {
    const name = identity(character?.name);
    if (name) entries.push({ id, name, kind: 'character' });
  }
  for (const [id, profile] of Object.entries(object(edition?.generalNpcs?.profiles) ?? {})) {
    const name = identity(profile?.name);
    if (name) entries.push({ id, name, kind: 'general_npc' });
  }
  return entries;
}

function compactReference(entry, source = null) {
  if (!entry) return null;
  return {
    id: entry.id,
    name: entry.name,
    ...(identity(entry.position) ? { position: entry.position } : {}),
    ...(identity(entry.role_title ?? entry.role) ? { role: entry.role_title ?? entry.role } : {}),
    ...(source ? { source } : {})
  };
}

/** Ephemeral Story character projection. It is never persisted or used as a state authority. */
export function buildStoryCharacterProjection({ edition, playerAction = '', sceneCastContract = null, workplace = null } = {}) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const registered = registeredIdentityEntries(edition);
  const byId = new Map(registered.map(entry => [entry.id, entry]));
  const sceneIds = [...new Set(Array.isArray(sceneCastContract?.present_npc_ids) ? sceneCastContract.present_npc_ids : [])]
    .filter(id => byId.has(id));
  const entrantIds = [...new Set(Array.isArray(sceneCastContract?.entering_npc_ids) ? sceneCastContract.entering_npc_ids : [])]
    .filter(id => byId.has(id) && !sceneIds.includes(id));
  const remoteIds = [...new Set(Array.isArray(sceneCastContract?.remote_npc_ids) ? sceneCastContract.remote_npc_ids : [])]
    .filter(id => byId.has(id) && !sceneIds.includes(id) && !entrantIds.includes(id));
  const nearbyIds = (Array.isArray(workplace?.eligible_nearby_npcs) ? workplace.eligible_nearby_npcs : [])
    .map(entry => identity(entry?.npc_id))
    .filter(id => id && byId.has(id) && !sceneIds.includes(id) && !entrantIds.includes(id) && !remoteIds.includes(id));
  const possibleIds = [...new Set([...entrantIds, ...nearbyIds])];
  const referenceIds = registered
    .filter(entry => typeof playerAction === 'string' && playerAction.includes(entry.name))
    .map(entry => entry.id)
    .filter(id => !sceneIds.includes(id) && !possibleIds.includes(id) && !remoteIds.includes(id));
  const sceneHeroineIds = sceneIds.filter(id => Object.prototype.hasOwnProperty.call(charactersMap, id));
  const sceneGeneralIds = sceneIds.filter(id => !sceneHeroineIds.includes(id));
  const sceneActors = {
    ...buildActiveCharacterCanon(charactersMap, sceneHeroineIds),
    ...buildGeneralNpcCanon(edition, sceneGeneralIds)
  };
  const compactFor = (id, source) => {
    const entry = byId.get(id);
    const character = charactersMap[id];
    const profile = object(edition?.generalNpcs?.profiles?.[id]);
    return compactReference({ ...entry, position: character?.position, role_title: character?.role_title ?? profile?.role }, source);
  };
  return {
    scene_actors: sceneActors,
    possible_entrants: possibleIds.map(id => compactFor(id, entrantIds.includes(id) ? 'explicit_or_pending' : 'nearby_candidate')).filter(Boolean),
    remote_contacts: remoteIds.map(id => compactFor(id, 'remote')).filter(Boolean),
    reference_characters: referenceIds.map(id => compactFor(id, 'player_reference')).filter(Boolean),
    registered_identities: registered.map(({ id, name }) => ({ id, name })),
    scene_actor_ids: sceneIds,
    projection_ids: [...new Set([...sceneIds, ...entrantIds, ...remoteIds])]
  };
}

export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition, registeredIds = null } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const allRecentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  const recentTurns = allRecentTurns.slice(-6);
  const turnSummaryMemory = allRecentTurns.slice(0, -6).map(turn => ({
    turn: typeof turn?.turn_number === 'number' ? turn.turn_number : null,
    turn_summary: typeof turn?.turn_summary === 'string' ? turn.turn_summary : ''
  }));
  const gameTime = object(save.world_state?.game_time) ?? {};
  const sceneCore = buildSceneContextCore(save, activeIds);
  const registeredSet = registeredIds instanceof Set ? registeredIds : null;
  const filterRegistered = values => {
    const ids = Array.isArray(values) ? values : [];
    return registeredSet ? ids.filter(id => registeredSet.has(id)) : ids;
  };
  const sceneIds = filterRegistered(sceneCore.scene?.present_npc_ids);
  const rawScene = {
    ...sceneCore.scene,
    participants: filterRegistered(sceneCore.scene?.participants),
    present_npc_ids: sceneIds
  };
  const sceneRest = { ...sceneCore };
  delete sceneRest.scene;
  delete sceneRest['global_' + 'csa'];
  delete sceneRest.time;
  if (registeredSet && object(sceneRest.active_npc_state)) {
    const filteredActiveNpcState = {};
    for (const [mapName, stateMap] of Object.entries(sceneRest.active_npc_state)) {
      if (!object(stateMap)) continue;
      const filtered = Object.fromEntries(Object.entries(stateMap).filter(([id]) => registeredSet.has(id)));
      if (Object.keys(filtered).length) filteredActiveNpcState[mapName] = filtered;
    }
    sceneRest.active_npc_state = filteredActiveNpcState;
  }
  const { participants: _participants, ...scene } = rawScene;
  return {
    game: { id: typeof game.id === 'string' ? game.id : null, title: typeof game.title === 'string' ? game.title : null },
    current_time: { day: typeof gameTime.day === 'number' ? gameTime.day : null, minute_of_day: typeof gameTime.minute_of_day === 'number' ? gameTime.minute_of_day : null },
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    scene,
    ...sceneRest,
    workplace: buildWorkplaceContext(edition, save, { excludeIds: activeIds }),
    recent_turns: recentTurns.map(turn => ({
      turn: typeof turn?.turn_number === 'number' ? turn.turn_number : null,
      player_action: typeof turn?.player_action === 'string' ? turn.player_action : '',
      story_text: typeof turn?.story_text === 'string' ? turn.story_text : '',
      parsed_blocks: turn?.parsed_blocks ?? null,
      choices: Array.isArray(turn?.choices) ? turn.choices : []
    })),
    turn_summary_memory: turnSummaryMemory
  };
}

export const DURABLE_STORY_RULES = [
  '[WORLD FACTS]',
  'Treat the canonical JSON payload as fact. scene_actors are present now; possible_entrants are optional registered candidates; remote_contacts are remote only; reference_characters are context only and never create presence, action, or dialogue authority. world_rules are institutional rule/context facts only. Never invent an unregistered named NPC.',
 '[PLAYER AGENCY]',
  'Preserve explicit player physical action without expanding its meaning. A choice is only a proposal, never a completed player action. Institutional rules are context, not proof of physical enactment, consent, emotion, or relationship change; never add unrequested contact, movement, undressing, or sexual escalation.',
  'Player input is the authority for player intent and current explicit target. Do not let stale position labels select a different NPC. Target authority order is current explicit player target, current canonical focal interaction, then registered current scene actors/speakers. Do not invent an unrequested player movement, dialogue, apology, concession, withdrawal, promise, contact, physical action, consent, refusal, or outcome. Player dialogue may paraphrase supplied intent without changing its meaning; it must not create a new decision. NPC responses and consequences are authored naturally in the Story.',
  '[NPC AUTONOMY]',
  'NPCs act from their established profiles and current situation. A registered possible entrant may appear occasionally when the scene makes it meaningful; most turns should add no new NPC. Do not create probability, cooldown, or scheduler state.',
 '[CSA AND WORLD RULES]',
  'Institutional rules provide workplace context and human-readable constraints only. Story authors the natural observable outcome; no finite CSA physical action, posture token, enactment id, direct-coverage marker, or mandatory ACTING block is required.',
  'player_private_origin is private causal knowledge for the player only. Never reveal it through NPC dialogue, NPC behavior as explicit knowledge, Mind Monitor, or world facts; NPCs may react only to observable scene consequences.',
  'world_rules are Worker-resolved institutional facts for this turn. Narrate them as workplace context, never as app/player mechanics or proof that a physical outcome occurred. NPC attitude, emotion, discomfort, and personal judgment remain free as reaction. Provider supplies natural narrative HOW; Extract observes exact Story evidence and Commit persists only validated observations.',
  '[THOUGHT OWNERSHIP]',
  '[THOUGHT] belongs exclusively to the player and is reaction-only presentation: use immediate emotion, surprise, doubt, or impression from the current scene, never a new plan, promise, apology, concession, withdrawal, moral conclusion, or next-action decision. Never place an NPC thought, sensation, memory, embarrassment, or private reaction in [THOUGHT]; NPC inner states belong in Mind Monitor, not Story THOUGHT.',
  '[PHYSICAL CONTINUITY]',
  'Saved actual physical and clothing state is current fact. A rule sentence alone is not a physical transition, and unknown actual state is never guessed. Explicit player physical facts needed for continuity must remain identifiable in Story; do not euphemize away erection, direct contact, or the identity of an acted body part. Preserve kind and strength without erotic escalation.',
  '[STORY QUALITY]',
  'Write natural Korean workplace fiction with appropriate title-plus-name address. The canonical player position_id, position, and address_title in the payload are authoritative; do not downgrade the player to a different team title. Preserve relationship and emotion continuity using the latest six raw turns in context.recent_turns and older committed continuity only through context.turn_summary_memory in chronological order. Summary memory is compressed context, never a raw Story replacement; do not invent detail that is absent from it. Keep the scene flow natural and do not let routine work explanation overwhelm the requested scene. context.current_time.day and context.current_time.minute_of_day are hard facts; never invent elapsed time.',
 '[OUTPUT PROTOCOL]',
  'Every response must contain at least one non-empty player-visible Story body segment: plain narrative text, [SCENE], [DIALOGUE], or visible [ACTING] text. A [THOUGHT] plus [CHOICE] blocks alone is invalid and does not count as Story body. Output one short player-only [THOUGHT] paragraph closed by [/THOUGHT], and four literal [CHOICE] action blocks without labels or numbers. Choices are proposals, not completed actions.',
  'Write plain narrative by default, preserving source order. Mark each spoken line with [DIALOGUE speaker_id="registered_id_or_player"] using an exact registered ID; never infer a speaker from a name, quote, or previous line. Player posture may be structurally annotated only when the narrative visibly establishes it, and no ACTING token is required for CSA. Before ending, verify exactly one [THOUGHT], every spoken line has a DIALOGUE marker, and exactly four non-empty distinct [CHOICE] blocks. Add [THOUGHT] and four literal [CHOICE] action blocks when possible; choices are concrete proposals (not completed actions), and preserve the kind, strength, and scope of explicit player actions without strengthening them. The UI owns headings and choice ordering. Do not turn app, marker, and presentation mechanics into world knowledge.',
].join('\n');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  return text ? text : '';
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null, turnTrigger = null, actionKind = 'ordinary', feedbackText = '', storyWorld: precomputedStoryWorld = null, playerPrivateOrigin = null }) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const canonicalScene = buildSceneContextCore(save, []).scene;
  const canonicalCast = sceneCastContract ?? { present_npc_ids: canonicalScene.present_npc_ids, entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null };
  const workplace = buildWorkplaceContext(edition, save);
  const storyPlayerAction = typeof playerAction === 'string' && playerAction.trim() ? playerAction : '';
  const projection = buildStoryCharacterProjection({ edition, playerAction: storyPlayerAction, sceneCastContract: canonicalCast, workplace });
  const registeredIdSet = new Set(projection.registered_identities.map(({ id }) => id));
 const storyWorld = precomputedStoryWorld ?? buildStoryWorldProjection({ save, master: { characters: Object.values(object(edition?.characters?.characters) ?? {}), general_npcs: Object.values(object(edition?.generalNpcs?.profiles) ?? {}) }, sceneActorIds: projection.scene_actor_ids, expectedTurn, playerAction: storyPlayerAction });
  const registeredLocations = (Array.isArray(edition?.map?.locations) ? edition.map.locations : [])
    .map(location => ({
      id: identity(location?.location_id),
      name: identity(location?.name),
      aliases: Array.isArray(location?.aliases) ? location.aliases.filter(identity).slice(0, 6) : []
    }))
    .filter(location => location.id && location.name);
 const payload = {
    edition: edition.editionId,
    turn_trigger: turnTrigger ?? { kind: actionKind === 'feedback_revision' ? 'feedback_revision' : 'player_action' },
    registered_identities: projection.registered_identities,
    scene_actors: projection.scene_actors,
    possible_entrants: projection.possible_entrants,
    remote_contacts: projection.remote_contacts,
    reference_characters: projection.reference_characters,
    player_dialogue_policy: canonicalCast.player_dialogue ?? null,
    target_authority: {
      explicit_player_target_ids: Array.isArray(canonicalCast.player_dialogue?.allowed_target_ids)
        ? canonicalCast.player_dialogue.allowed_target_ids.slice()
        : []
    },
    world_rules: storyWorld.world_rules,
    registered_locations: registeredLocations,
    context: buildStoryContextProjection(context, projection.projection_ids, { catalogs, playerAction: storyPlayerAction, edition, registeredIds: registeredIdSet }),
    ...(storyPlayerAction ? { player_action: storyPlayerAction } : {}),
    ...(playerPrivateOrigin ? { player_private_origin: playerPrivateOrigin } : {}),
    ...(feedbackText ? { feedback_text: feedbackText } : {}),
    expected_turn: expectedTurn
  };
  return [
    { role: 'system', content: DURABLE_STORY_RULES },
    { role: 'user', content: JSON.stringify(payload) }
  ];
}

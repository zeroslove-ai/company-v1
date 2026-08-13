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

function projectEngineCanonicalSegment(segment) {
  const source = object(segment) ?? {};
  return {
    segment_id: source.segment_id,
    segment_kind: source.segment_kind ?? source.execution_kind ?? 'mandatory_enactment',
    ...(identity(source.source_rule_id) ? { source_rule_id: source.source_rule_id } : {}),
    ...(identity(source.actor_id) ? { actor_id: source.actor_id } : {}),
    ...(identity(source.execution_kind) ? { execution_kind: source.execution_kind } : {}),
    ...(identity(source.action) ? { action: source.action } : {}),
    ...(identity(source.phase) ? { phase: source.phase } : {}),
    ...(source.required_state && typeof source.required_state === 'object' && !Array.isArray(source.required_state)
      ? { required_state: source.required_state }
      : {}),
    ...(identity(source.state_effect) ? { state_effect: source.state_effect } : {}),
   ...(Number.isInteger(source.effective_turn) ? { effective_turn: source.effective_turn } : {}),
   ...(source.effective_game_time && typeof source.effective_game_time === 'object' ? { effective_game_time: source.effective_game_time } : {}),
    ...(Array.isArray(source.delivery_channels) ? { delivery_channels: source.delivery_channels.slice() } : {}),
    canonical_text: source.canonical_text
  };
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
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
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
    story_summary: { overall: typeof save.story_summary_overall === 'string' ? save.story_summary_overall : '' },
    recent_turns: recentTurns.map(turn => ({
      turn: typeof turn?.turn_number === 'number' ? turn.turn_number : null,
      player_action: typeof turn?.player_action === 'string' ? turn.player_action : '',
      story_text: typeof turn?.story_text === 'string' ? turn.story_text : '',
      parsed_blocks: turn?.parsed_blocks ?? null,
      choices: Array.isArray(turn?.choices) ? turn.choices : []
    }))
  };
}

export const DURABLE_STORY_RULES = [
  '[WORLD FACTS]',
  'Treat the canonical JSON payload as fact. scene_actors are present now; possible_entrants are optional registered candidates; remote_contacts are remote only; reference_characters are context only and never create presence, action, or dialogue authority. world_rules are institutional facts and scene_obligations are read-only current-turn requirements. Never invent an unregistered named NPC.',
 '[PLAYER AGENCY]',
  'Preserve explicit player physical action without expanding its meaning. A choice is only a proposal, never a completed player action. CSA mandatory enactment is distinct from optional player agency; never add unrequested contact, movement, undressing, or sexual escalation.',
  'Player input is the authority for player intent. Do not invent an unrequested player movement, dialogue, apology, concession, withdrawal, promise, contact, physical action, consent, refusal, or outcome. Player dialogue may paraphrase supplied intent without changing its meaning; it must not create a new decision. NPC responses and consequences are authored naturally in the Story.',
  '[NPC AUTONOMY]',
  'NPCs act from their established motives, relationships, and situation. A registered possible entrant may appear occasionally when the scene makes it meaningful; most turns should add no new NPC. Do not create probability, cooldown, or scheduler state.',
 '[CSA AND WORLD RULES]',
  'Engine canonical segments already contain the real observable enactment and its completion before provider continuation. Never repeat the action, turn it into a future plan, defer it, renegotiate it, await approval, undo it, or contradict the completed required result; write only natural aftermath and free NPC reaction.',
  'world_rules and scene_obligations are Worker-resolved institutional facts for this turn. Treat each world_rules.resolved_facts entry as current-turn authority: already_effective/current_state/required_state describe canonical state, and transition_required_now means the concrete observable enactment or result is required now. When trigger_state is required_now or execution_policy is mandatory_execution, the applicable NPC must enact the rule now; do not defer it, deny its existence, await approval, or replace it with a plan. Conditional triggers remain conditional. Narrate institutional rules as workplace facts or enactment, never as app/player mechanics. Use known_scene_actor_ids and applicable_scene_actor_ids as identity scope, not as permission to invent action. NPC attitude, emotion, discomfort, and personal judgment remain free as reaction, but they do not cancel required execution. A scene obligation is fulfilled only through a concrete, observable, non-magical action or result. engine_canonical_segments are authoritative Worker-confirmed events/results that already occurred before your continuation and are shown to the player before provider text. Do not repeat, undo, defer, renegotiate, await approval for, or contradict them; continue naturally from their aftermath. Engine fixes the behavior/outcome; provider writes only the subsequent NPC reaction, emotion, dialogue, work flow, and other free narrative.',
  '[THOUGHT OWNERSHIP]',
  '[THOUGHT] belongs exclusively to the player and is reaction-only presentation: use immediate emotion, surprise, doubt, or impression from the current scene, never a new plan, promise, apology, concession, withdrawal, moral conclusion, or next-action decision. Never place an NPC thought, sensation, memory, embarrassment, or private reaction in [THOUGHT]; NPC inner states belong in Mind Monitor, not Story THOUGHT.',
  '[PHYSICAL CONTINUITY]',
  'Saved actual physical and clothing state is current fact. A scene_obligation describes a required transition; show its concrete, observable, non-magical action or result. A rule sentence alone is not a physical transition, and unknown actual state is never guessed.',
  '[STORY QUALITY]',
  'Write natural Korean workplace fiction with appropriate title-plus-name address, relationship and emotion continuity, the last three turns as context.recent_turns, differentiated functional dialogue, NPC autonomy, and minimal repeated setting exposition. Keep the scene flow natural and do not let routine work explanation replace a required current-turn enactment or overwhelm the requested scene. context.current_time.day and context.current_time.minute_of_day are hard facts; never invent elapsed time.',
 '[OUTPUT PROTOCOL]',
  'Output one short player-only [THOUGHT] paragraph closed by [/THOUGHT], and four literal [CHOICE] action blocks without labels or numbers. Choices are proposals, not completed actions.',
  'Write plain narrative by default, preserving source order. Mark each spoken line with [DIALOGUE speaker_id="registered_id_or_player"] using an exact registered ID; never infer a speaker from a name, quote, or previous line. [ACTING] is optional metadata for the adjacent dialogue only. Add [THOUGHT] and four literal [CHOICE] action blocks when possible; choices are concrete actions (usually around 30 Korean characters as quality guidance only), without labels or numbers. The UI owns headings and choice ordering. Do not turn app, marker, or presentation mechanics into world knowledge.'
].join('\n');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  return text ? text : '';
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null, turnTrigger = null, actionKind = 'ordinary', feedbackText = '', storyWorld: precomputedStoryWorld = null, engineCanonicalSegments = [] }) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const canonicalScene = buildSceneContextCore(save, []).scene;
  const canonicalCast = sceneCastContract ?? { present_npc_ids: canonicalScene.present_npc_ids, entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null };
  const workplace = buildWorkplaceContext(edition, save);
  const storyPlayerAction = typeof playerAction === 'string' && playerAction.trim() ? playerAction : '';
  const projection = buildStoryCharacterProjection({ edition, playerAction: storyPlayerAction, sceneCastContract: canonicalCast, workplace });
  const registeredIdSet = new Set(projection.registered_identities.map(({ id }) => id));
 const storyWorld = precomputedStoryWorld ?? buildStoryWorldProjection({ save, master: { characters: Object.values(object(edition?.characters?.characters) ?? {}), general_npcs: Object.values(object(edition?.generalNpcs?.profiles) ?? {}) }, sceneActorIds: projection.scene_actor_ids, expectedTurn });
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
    world_rules: storyWorld.world_rules,
   scene_obligations: storyWorld.scene_obligations,
    registered_locations: registeredLocations,
    ...(Array.isArray(engineCanonicalSegments) && engineCanonicalSegments.length
      ? { engine_canonical_segments: engineCanonicalSegments.map(projectEngineCanonicalSegment) }
      : {}),
    context: buildStoryContextProjection(context, projection.projection_ids, { catalogs, playerAction: storyPlayerAction, edition, registeredIds: registeredIdSet }),
    ...(storyPlayerAction ? { player_action: storyPlayerAction } : {}),
    ...(feedbackText ? { feedback_text: feedbackText } : {}),
    expected_turn: expectedTurn
  };
  return [
    { role: 'system', content: DURABLE_STORY_RULES },
    { role: 'user', content: JSON.stringify(payload) }
  ];
}

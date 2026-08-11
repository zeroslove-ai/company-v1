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

export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  const gameTime = object(save.world_state?.game_time) ?? {};
  const sceneCore = buildSceneContextCore(save, activeIds);
  const rawScene = sceneCore.scene;
  const sceneRest = { ...sceneCore };
  delete sceneRest['global_' + 'csa'];
  delete sceneRest.time;
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
  'Player input is an attempt or intent. Do not decide an unrequested player movement, dialogue, contact, physical action, consent, refusal, promise, or outcome. NPC responses and consequences are authored naturally in the Story.',
  '[NPC AUTONOMY]',
  'NPCs act from their established motives, relationships, and situation. A registered possible entrant may appear occasionally when the scene makes it meaningful; most turns should add no new NPC. Do not create probability, cooldown, or scheduler state.',
  '[CSA AND WORLD RULES]',
  'world_rules are real institutional facts enacted in the Company world. An applicable NPC already knows an effective rule; do not make an NPC learn it from a device or the player. A newly activated rule may be grounded briefly as an institutional enactment, then is established reality. Continuous rules default to compliance. Emotion is free and can coexist with compliance. Explicit knowing refusal or violation is exceptional and needs a strong conflict or serious situational reason; do not silently ignore a rule. Rule acceptance is not affection, sexual consent, or private obedience.',
  '[PHYSICAL CONTINUITY]',
  'Saved actual physical and clothing state is current fact. A rule never changes actual state by itself. If scene_obligations contains a clothing_transition, a compliant Story must make the listed slot transitions observable; another slot is not a substitute. A strong-reason knowing violation may leave the state unchanged. Unknown actual state is never guessed.',
  '[STORY QUALITY]',
  'Write natural Korean workplace fiction with appropriate title-plus-name address, relationship and emotion continuity, the last three turns as context.recent_turns, differentiated functional dialogue, NPC autonomy, and minimal repeated setting exposition. Keep the scene flow natural and do not let routine work explanation overwhelm the requested scene. context.current_time.day and context.current_time.minute_of_day are hard facts; never invent elapsed time.',
  '[OUTPUT PROTOCOL]',
  'Return exactly three sections in order: [1. 서사 및 행동], [2. 플레이어 속마음], [3. 선택지]. Use [SCENE] for narration and [DIALOGUE speaker_id="..." acting_direction="..."] for spoken lines only; speaker_id must be a registered identity ID or "player". Dialogue must use the marker, never a name:line or quote-only form. acting_direction is required and non-empty. Inner thought is first-person without outer quotation marks. Provide exactly four distinct choices in the form 1. [짧은라벨] 전문 through 4. [짧은라벨] 전문; labels are 2–6 characters. Stop after the fourth choice.'
].join('\n');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  return text ? text : '';
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null, turnTrigger = null, actionKind = 'ordinary', feedbackText = '' }) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const canonicalScene = buildSceneContextCore(save, []).scene;
  const canonicalCast = sceneCastContract ?? { present_npc_ids: canonicalScene.present_npc_ids, entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null };
  const workplace = buildWorkplaceContext(edition, save);
  const storyPlayerAction = typeof playerAction === 'string' && playerAction.trim() ? playerAction : '';
  const projection = buildStoryCharacterProjection({ edition, playerAction: storyPlayerAction, sceneCastContract: canonicalCast, workplace });
  const storyWorld = buildStoryWorldProjection({ save, master: { characters: Object.values(object(edition?.characters?.characters) ?? {}), general_npcs: Object.values(object(edition?.generalNpcs?.profiles) ?? {}) }, sceneActorIds: projection.scene_actor_ids, expectedTurn });
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
    context: buildStoryContextProjection(context, projection.projection_ids, { catalogs, playerAction: storyPlayerAction, edition }),
    ...(storyPlayerAction ? { player_action: storyPlayerAction } : {}),
    ...(feedbackText ? { feedback_text: feedbackText } : {}),
    expected_turn: expectedTurn
  };
  return [
    { role: 'system', content: DURABLE_STORY_RULES },
    { role: 'user', content: JSON.stringify(payload) }
  ];
}

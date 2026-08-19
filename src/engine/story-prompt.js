import { buildActiveCharacterCanon, buildSceneContextCore } from './gameplay-state.js';
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js';
import { buildGeneralNpcCanon } from './workplace-context.js';
import { buildStoryWorldProjection } from './csa/story-projection.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function identity(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function formatClock24(minuteOfDay) {
  if (!Number.isInteger(minuteOfDay) || minuteOfDay < 0 || minuteOfDay > 1439) return null;
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`;
}

function registeredEntries(edition) {
  const entries = [];
  for (const [id, character] of Object.entries(object(edition?.characters?.characters) || {})) {
    const name = identity(character?.name);
    if (name) entries.push({ id, name, position: character?.position, role: character?.role_title });
  }
  for (const [id, profile] of Object.entries(object(edition?.generalNpcs?.profiles) || {})) {
    const name = identity(profile?.name);
    if (name) entries.push({ id, name, position: profile?.position, role: profile?.role });
  }
  return entries;
}

function compact(entry) {
  if (!entry) return null;
  return {
    id: entry.id,
    name: entry.name,
    ...(identity(entry.position) ? { position: entry.position } : {}),
    ...(identity(entry.role) ? { role: entry.role } : {})
  };
}

function boundedStoryFallback(turn) {
  const raw = typeof turn?.story_text === 'string' ? turn.story_text.trim() : '';
  if (!raw) return null;
  return Array.from(raw).slice(0, 1200).join('');
}

/** Fresh Story receives current actors and only directly relevant identity canon. */
export function buildStoryCharacterProjection({ edition, playerAction = '', sceneCastContract = null, clothingById = {} } = {}) {
  const characters = object(edition?.characters?.characters);
  const entries = registeredEntries(edition);
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const sceneIds = [...new Set(sceneCastContract?.present_npc_ids ?? [])]
    .map(identity).filter(id => id && byId.has(id));
  const characterIds = sceneIds.filter(id => Object.prototype.hasOwnProperty.call(characters, id));
  const generalIds = sceneIds.filter(id => !characterIds.includes(id));
  const mentioned = entries.filter(entry => typeof playerAction === 'string' && playerAction.includes(entry.name))
    .filter(entry => !sceneIds.includes(entry.id)).map(compact).filter(Boolean).slice(0, 6);
  return {
    scene_actors: {
      ...buildActiveCharacterCanon(characters, characterIds, clothingById),
      ...buildGeneralNpcCanon(edition, generalIds)
    },
    reference_characters: mentioned,
    scene_actor_ids: sceneIds,
    projection_ids: sceneIds
  };
}

export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition } = {}) {
  const save = object(context?.save?.data) || object(context?.save) || {};
  const game = object(context?.game) || {};
  const player = object(save.player) || {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  const recentTurns = turns.slice(-6).map(turn => ({
    turn: Number.isInteger(turn?.turn_number) ? turn.turn_number : null,
    player_action: typeof turn?.player_action === 'string' ? turn.player_action : '',
    story_text: typeof turn?.story_text === 'string' ? turn.story_text : '',
    parsed_blocks: turn?.parsed_blocks ?? null,
    choices: Array.isArray(turn?.choices) ? turn.choices : []
  }));
  const summaries = turns.slice(0, -6).map(turn => {
    const turnSummary = typeof turn?.turn_summary === 'string' ? turn.turn_summary : '';
    return {
      turn: Number.isInteger(turn?.turn_number) ? turn.turn_number : null,
      turn_summary: turnSummary,
      ...(turnSummary.trim() || typeof turn?.story_text !== 'string' || !turn.story_text.trim()
        ? {}
        : {
            raw_story_fallback: boundedStoryFallback(turn),
            continuity_source: 'committed_story'
          })
    };
  });
  const core = buildSceneContextCore(save, activeIds);
  const gameTime = object(save.world_state?.game_time) || {};
  const minuteOfDay = Number.isInteger(gameTime.minute_of_day) ? gameTime.minute_of_day : 540;
  return {
    game: { id: identity(game.id), title: identity(game.title) },
    current_time: {
      day: Number.isInteger(gameTime.day) ? gameTime.day : 1,
      minute_of_day: minuteOfDay,
      clock_24h: formatClock24(minuteOfDay)
    },
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    scene: core.scene,
    active_npc_state: core.active_npc_state,
    recent_turns: recentTurns,
    turn_summary_memory: summaries
  };
}

export const FRESH_MARKER_GRAMMAR = [
  'Control-marker grammar is exact: [SCENE] is bare; [DIALOGUE speaker_id="registered_id"] carries an exact registered speaker id; [ACTING], [THOUGHT], and [CHOICE] use the documented markers.',
  'The JSON scene context is data, not marker syntax. Never emit an attributed [SCENE] marker.',
  'Plain narrative by default. Every response contains at least one non-empty player-visible Story body segment; a [THOUGHT] plus [CHOICE] blocks alone is invalid.'
].join(' ');

export const PROVIDER_CHOICE_OUTPUT_PROTOCOL = [
  '[CHOICE OUTPUT PROTOCOL]',
  'This requirement is mandatory and unconditional: emit exactly four repeated [CHOICE] ... [/CHOICE] blocks.',
  'Each is one distinct, non-empty literal player-action proposal. The four choices must be distinct literal strings. Preserve exact text and order; choices are proposals, not completed player actions.',
  'Do not emit server/UI numbering or a human heading; the UI owns numbering. Before ending, verify exactly four choice blocks.'
].join(' ');

export const DURABLE_STORY_RULES = [
  '[FACTUAL CONTEXT]',
  'Treat the canonical payload as fact. scene_actors are the compact current actor canon; current scene actors, location, time, physical/clothing facts, player action, and committed history are the only narrative authority. Never invent an unregistered named NPC or silently replace an explicit player action.',
  '[PLAYER AGENCY]',
  'Preserve the player action and its scope. A choice is only a proposal. Do not add unrequested movement, contact, undressing, sexual escalation, consent, refusal, apology, promise, or outcome.',
  '[CSA PREMISE]',
  'An active and applicable company rule is background workplace reality from its activation/effective time. Mention or explain it when newly changed, directly questioned, or materially needed to understand the current action; otherwise let people and consequences unfold naturally without repeating the regulation. The rule changes only its exact direct meaning: it never implies indefinite continuation, general obedience, consent, comfort, affection, trust, romance, or arousal.',
  '[STORY MEMORY AND OUTPUT]',
  'Use recent raw turns and chronological older summaries as read-only continuity. If an older summary is blank, use its bounded committed raw_story_fallback instead; a blank summary never means that turn had no continuity. The context.turn_summary_memory is compressed continuity, never a replacement for raw Story. context.current_time.day, context.current_time.minute_of_day, and context.current_time.clock_24h are hard facts; use clock_24h as the unambiguous 24-hour display time. Do not invent semantic ledgers or future-planning state. Write natural Korean fiction in the supplied company setting, mark spoken lines with exact dialogue ids, keep [THOUGHT] player-only and reaction-only, and never put an NPC private thought in [THOUGHT]; NPC private thought belongs to the same post-Story Extract Mind Monitor. Preserve the exact structural marker protocol.',
  '[SAME-TURN CLOTHING AND PROGRESSION]',
  'If clothing_projection.required_state changes an actor current_state on this turn, describe that exact transition in the same Story and never contradict the projected post-state. When the literal player request is executable, advance it to a meaningful same-turn consequence instead of default preparation, waiting, restarting, or asking again. During intense physical action, prefer varied short vocal, breath, and body reactions in dialogue over repeated explanatory speeches; this is presentation guidance, not a numeric validator.',
  FRESH_MARKER_GRAMMAR,
  PROVIDER_CHOICE_OUTPUT_PROTOCOL
].join('\n');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  return text;
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null, turnTrigger = null, actionKind = 'ordinary', feedbackText = '', storyWorld: precomputedStoryWorld = null, playerPrivateOrigin = null }) {
  const save = object(context?.save?.data) || object(context?.save) || {};
  const canonicalScene = buildSceneContextCore(save, []).scene;
  const cast = sceneCastContract ?? { present_npc_ids: canonicalScene.present_npc_ids };
  const action = typeof playerAction === 'string' ? playerAction.trim() : '';
  const clothingById = Object.fromEntries(
    Object.entries(save.npc_scene_state ?? {})
      .filter(([, state]) => object(state?.clothing))
      .map(([id, state]) => [id, state.clothing])
  );
  const projection = buildStoryCharacterProjection({ edition, playerAction: action, sceneCastContract: cast, clothingById });
  const storyWorld = precomputedStoryWorld ?? buildStoryWorldProjection({
    save,
    master: { characters: Object.values(object(edition?.characters?.characters) || {}), general_npcs: Object.values(object(edition?.generalNpcs?.profiles) || {}) },
    sceneActorIds: projection.scene_actor_ids,
    expectedTurn
  });
  const registeredLocations = (Array.isArray(edition?.map?.locations) ? edition.map.locations : [])
    .map(location => ({ id: identity(location?.location_id), name: identity(location?.name), aliases: Array.isArray(location?.aliases) ? location.aliases.filter(identity).slice(0, 6) : [] }))
    .filter(location => location.id && location.name);
  const payload = {
    edition: edition?.editionId,
    turn_trigger: turnTrigger ?? { kind: actionKind === 'feedback_revision' ? 'feedback_revision' : 'player_action' },
    scene_actors: projection.scene_actors,
    reference_characters: projection.reference_characters,
    world_rules: storyWorld.world_rules,
    registered_locations: registeredLocations,
    context: buildStoryContextProjection(context, projection.projection_ids, { catalogs, playerAction: action, edition }),
    ...(action ? { player_action: action } : {}),
    ...(playerPrivateOrigin ? { player_private_origin: playerPrivateOrigin } : {}),
    ...(feedbackText ? { feedback_text: feedbackText } : {}),
    expected_turn: expectedTurn
  };
  return [
    { role: 'system', content: DURABLE_STORY_RULES },
    { role: 'user', content: JSON.stringify(payload) }
  ];
}

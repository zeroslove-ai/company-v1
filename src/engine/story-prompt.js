import { buildActiveCharacterCanon, buildSceneContextCore } from './gameplay-state.js'
import { buildPlayerPromptProjection, resolvePlayerCanonicalNames } from './player-setup.js'
import { buildGeneralNpcCanon, buildWorkplaceContext } from './workplace-context.js'
import { requiredClothingFromActiveCsa, compareRequiredClothing } from './state/clothing.js'

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
export function buildStoryCharacterProjection({ edition, save, playerAction = '', sceneCastContract = null, workplace = null } = {}) {
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

function buildActiveWorldRules(save, expectedTurn = null) {
  const activeIds = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const rules = object(save?.csa_rules) ?? {};
  return activeIds.flatMap(csaId => {
    const rule = object(rules[csaId]);
    if (!rule || rule.active === false) return [];
    const preset = object(rule.preset) ?? {};
    const activatedTurn = Number.isInteger(rule.created_turn) ? rule.created_turn : null;
    const authorityTier = typeof preset.authority_tier === 'string'
      ? preset.authority_tier
      : (typeof rule.authority_tier === 'string' ? rule.authority_tier : (typeof rule.strength === 'string' ? rule.strength : 'weak'));
    return [{
      csa_id: csaId,
      content: typeof rule.content === 'string' ? rule.content : '',
      active: true,
      scope_type: typeof rule.scope_type === 'string' ? rule.scope_type : 'world',
      scope_label: typeof rule.scope_label === 'string' ? rule.scope_label : '회사 전체',
      strength: typeof rule.strength === 'string' ? rule.strength : authorityTier,
      authority_tier: authorityTier,
      affected_group: typeof preset.affected_group === 'string' ? preset.affected_group : 'company_employee',
      mode: preset.mode === 'on_player_request' ? 'on_player_request' : 'continuous',
      subject_scope: typeof preset.subject_scope === 'string' ? preset.subject_scope : (typeof preset.affected_group === 'string' ? preset.affected_group : 'company_employee'),
      counterparty_scope: typeof preset.counterparty_scope === 'string' ? preset.counterparty_scope : null,
      trigger: typeof preset.trigger === 'string' ? preset.trigger : (preset.mode === 'on_player_request' ? 'on_counterparty_request' : 'continuous'),
      allowed_subject_scopes: Array.isArray(preset.allowed_subject_scopes) ? preset.allowed_subject_scopes : [],
      allowed_counterparty_scopes: Array.isArray(preset.allowed_counterparty_scopes) ? preset.allowed_counterparty_scopes : [],
      activated_turn: activatedTurn,
      activated_game_time: object(rule.activated_game_time),
      newly_activated: Number.isInteger(expectedTurn) && activatedTurn === expectedTurn
    }];
  });
}

function toEntryArray(source, keyName) {
  if (!object(source)) return [];
  return Object.entries(source).map(([key, value]) => ({ ...value, [keyName]: key }));
}

function findNpcProfile(master, npcId) {
  for (const entry of Array.isArray(master?.characters) ? master.characters : []) {
    if ((entry?.character_id ?? entry?.id) === npcId) return entry;
  }
  for (const entry of Array.isArray(master?.general_npcs) ? master.general_npcs : []) {
    if ((entry?.npc_id ?? entry?.id) === npcId) return entry;
  }
  return {};
}

function buildClothingAuthority(save, { master = {} } = {}) {
  const activeIds = Array.isArray(save?.csa_active) ? save.csa_active : [];
  const rules = object(save?.csa_rules) ?? {};
  const activeRules = Object.entries(rules)
    .filter(([id, rule]) => activeIds.includes(id) && rule?.active !== false)
    .map(([id, rule]) => ({ ...rule, csa_id: id }));
  const result = {};
  for (const [npcId, npcState] of Object.entries(object(save?.npc_scene_state) ?? {})) {
    if (npcId.startsWith('player')) continue;
    const actual = object(npcState?.clothing) ? npcState.clothing : {};
    const resolved = requiredClothingFromActiveCsa(activeRules, findNpcProfile(master, npcId));
    result[npcId] = {
      actual_clothing: actual,
      required_clothing: resolved.required_clothing,
      compliance: resolved.conflicted ? 'not_applicable' : compareRequiredClothing(actual, resolved.required_clothing),
      rule_id: resolved.source_csa_id,
      conflicted: resolved.conflicted
    };
  }
  return result;
}

export function buildStoryContextProjection(context, activeIds, { catalogs, playerAction, edition, expectedTurn } = {}) {
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const game = object(context?.game) ?? {};
  const player = object(save.player) ?? {};
  const canonical = resolvePlayerCanonicalNames(player, catalogs);
  const recentTurns = Array.isArray(context?.recent_turns) ? context.recent_turns.slice(-3) : [];
  const gameTime = object(save.world_state?.game_time) ?? {};
  const { global_csa: _unused, ...sceneCore } = buildSceneContextCore(save, activeIds);
  return {
    game: { id: typeof game.id === 'string' ? game.id : null, title: typeof game.title === 'string' ? game.title : null },
    current_time: { day: typeof gameTime.day === 'number' ? gameTime.day : null, minute_of_day: typeof gameTime.minute_of_day === 'number' ? gameTime.minute_of_day : null },
    active_world_rules: buildActiveWorldRules(save, expectedTurn),
    player: buildPlayerPromptProjection({ player, canonical, playerAction }),
    ...sceneCore,
    workplace: buildWorkplaceContext(edition, save, { excludeIds: activeIds }),
    story_summary: { overall: typeof save.story_summary_overall === 'string' ? save.story_summary_overall : '', recent: '' },
    clothing_authority: buildClothingAuthority(save, { master: edition?.characters?.characters ? { characters: toEntryArray(edition.characters.characters, 'character_id'), general_npcs: toEntryArray(edition?.generalNpcs?.profiles, 'npc_id') } : {} }),
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
  'Treat the canonical JSON payload as fact. scene_actors are present now; possible_entrants are optional registered candidates; remote_contacts are remote only; reference_characters are context only and never create presence, action, or dialogue authority. Never invent an unregistered named NPC.',
  '[PLAYER AGENCY]',
  'Player input is an attempt or intent. Do not decide an unrequested player movement, dialogue, contact, physical action, consent, refusal, promise, or outcome. NPC responses and consequences are authored naturally in the Story.',
  '[NPC AUTONOMY]',
  'NPCs act from their established motives, relationships, and situation. A registered possible entrant may appear occasionally when the scene makes it meaningful; most turns should add no new NPC. Do not create probability, cooldown, or scheduler state.',
  '[CSA AND WORLD RULES]',
  'active_world_rules are real institutional facts of the Company world. An applicable NPC already knows an effective rule; do not make an NPC learn it from the app, a smartwatch, or the player. On newly_activated, ground the institutional enactment briefly when useful, then treat it as established reality. Continuous rules default to compliance. Emotion is free and can coexist with compliance. Explicit knowing refusal or violation is exceptional and needs a strong conflict or serious situational reason; do not silently ignore a rule. Rule acceptance is not affection, sexual consent, or private obedience. If action_kind is app_transaction, player_action is metadata describing a completed rule change, not an in-world app, device alert, command, or physical action.',
  '[PHYSICAL CONTINUITY]',
  'Saved actual physical and clothing state is current fact. A rule never changes actual state by itself. A compliant physical transition must be observable in this Story; use the required slot itself and never substitute another clothing slot. A strong-reason knowing violation may leave the state unchanged. Do not invent unknown actual state.',
  '[STORY QUALITY]',
  'Write natural Korean workplace fiction with appropriate title-plus-name address, relationship and emotion continuity, the last three turns as context.recent_turns, differentiated functional dialogue, NPC autonomy, and minimal repeated setting exposition. Keep the scene flow natural and do not let routine work explanation overwhelm the requested scene. context.current_time.day and context.current_time.minute_of_day are hard facts; never invent elapsed time.',
  '[OUTPUT PROTOCOL]',
  'Return exactly three sections in order: [1. 서사 및 행동], [2. 플레이어 속마음], [3. 선택지]. Use [SCENE] for narration and [DIALOGUE speaker_id="..." acting_direction="..."] for spoken lines only; speaker_id must be a registered identity. Inner thought is first-person without quotation marks. Provide exactly four immediately usable choices and stop after the fourth choice.'
].join('\n');

export function buildRegenerationFeedbackSection(feedbackText) {
  const text = typeof feedbackText === 'string' ? feedbackText.trim() : '';
  return text ? text : '';
}

export function buildStoryPrompt({ edition, context, playerAction, expectedTurn, npcIds, catalogs, sceneCastContract = null, actionKind = 'ordinary', feedbackText = '' }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const canonicalScene = buildSceneContextCore(save, []).scene;
  const canonicalCast = sceneCastContract ?? { present_npc_ids: canonicalScene.present_npc_ids, entering_npc_ids: [], remote_npc_ids: [], player_dialogue: null };
  const workplace = buildWorkplaceContext(edition, save);
  const projection = buildStoryCharacterProjection({ edition, save, playerAction, sceneCastContract: canonicalCast, workplace });
  const playerDialoguePolicy = canonicalCast.player_dialogue ?? null;
  const payload = {
    edition: edition.editionId,
    action_kind: actionKind,
    registered_identities: projection.registered_identities,
    scene_actors: projection.scene_actors,
    possible_entrants: projection.possible_entrants,
    remote_contacts: projection.remote_contacts,
    reference_characters: projection.reference_characters,
    player_dialogue_policy: playerDialoguePolicy,
    context: buildStoryContextProjection(context, projection.projection_ids, { catalogs, playerAction, edition, expectedTurn }),
    player_action: playerAction,
    expected_turn: expectedTurn,
    ...(feedbackText ? { feedback_text: feedbackText } : {})
  };
  return [
    { role: 'system', content: DURABLE_STORY_RULES },
    { role: 'user', content: JSON.stringify(payload) }
  ];
}

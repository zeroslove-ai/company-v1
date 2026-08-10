import { buildSceneContextCore, selectActiveCharacterIds } from './gameplay-state.js';
import { buildGeneralNpcCanon, buildRegisteredGeneralNpcs, selectActiveGeneralNpcIds } from './workplace-context.js';

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
      focal_candidate_id: null,
      presence_is_final: false,
      remote_speaker_ids: [],
      evidence: []
    },
    player_observation: {},
    npc_observations: {},
    events: { general: [], sexual: [] },
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
  'The scene observation distinguishes final_present_npc_ids=null (final snapshot unobserved) from [] (explicit player-only final scene). presence_is_final=true requires an array. registered_characters lists the only stable character ids; never invent, guess, or reuse an id; a nearby/default/eligible NPC is not present unless Story explicitly shows their entrance/presence/action/dialogue.',
  'If the Story does not explicitly establish a complete final presence snapshot, return final_present_npc_ids:null and presence_is_final:false. Use presence_is_final:true only when the Story explicitly states who remains or who has left, and then return the matching array (including [] only for an explicitly empty NPC scene). Do not mix the null form with the final flag.',
  'Parser projections are authoritative for the displayed Story selections, spoken-line order, and player inner monologue. Do not generate replacements for those projections in this observation. Mind Monitor interpretation evidence is separate from exact state evidence; it may not invent a new event, memory, agreement, contact, or fact.',
  'Return player_observation only for evidenced physical or sexual changes. Physical fields are posture, position_label, and the four clothing slots; never propose scene, location, presence, or ID fields. Sexual state uses arousal_delta, ejaculation_progress_delta, ejaculation_completed, and erection_state under the existing evidence and enum/range rules. actor_id is player for the player, and evidence.clothing[actor_id]={quote,character_id}; quote is an exact Story substring.',
  'Return npc_observations only for registered NPCs and only observed physical, emotion, relationship, stats, work, or csa_attitude fields. Relationship keys are limited to closeness, romance_status, and current_boundary; csa_attitude is limited to familiarity. Never return affection, present, scene_id, location_id, updated_turn, arbitrary nested save patches, absolute stats, resistance, last_changed_turn, milestones, or relationship_summary.',
  'If a domain has no exact observed change, omit that domain; do not invent descriptive keys such as affection, team_daily_schedule, relationship_summary, or other human-readable labels. The safe minimal observation for an ordinary dialogue is empty player_observation, empty npc_observations, empty events, scene_observation with final_present_npc_ids:null and presence_is_final:false, and the remaining skeleton defaults.',
  'Final consistency check is mandatory: ordinary dialogue with no explicit entrance, exit, or complete presence statement MUST use exactly `"final_present_npc_ids":null,"presence_is_final":false`; never output an empty array with false. If you output any array, including [], you MUST set presence_is_final:true.',
  'Exact evidence contract: use evidence.clothing.<actor_id>={quote,character_id} for clothing, evidence.changed entries such as {changed:["npc_scene_state.heroine1.clothing.uniform_top"],quote:"exact words from Story"} for other fields, scene_observation.evidence entries such as {kind:"presence|entrance|exit|movement|scene",character_id or location_id,quote:"exact contiguous Story substring"}, and event evidence with the same exact quote. Never summarize, translate, or reconstruct a quote; every quote must be copied verbatim from story_text. For stationary scene observations, use scene evidence only when the corresponding presence, entrance, exit, movement, or scene fact is directly shown. Movement destination and success are already resolved by the stored player action and canonical navigation; do not require movement quotes, destination matches, or final presence snapshots to authorize movement. Use only location_id values from registered_locations when reporting an observed non-movement location fact.',
  'Every state, numeric, relationship, clothing, posture, position, and event proposal in exact Story evidence is required. Every proposal requires exact Story evidence. When only a regulation/plan exists and the attire is not shown in Story, make no clothing patch. actor_id/target_id must be registered IDs and must identify distinct observed participants. Events contain only observed general or sexual events with registered actor/target IDs, canonical action types, and exact Story evidence. Counters and milestones are derived by reducers, never proposed directly.',
  'elapsed_minutes is the only time proposal: 1-30 normally, up to 480 only with evidence.time_advance=true. Never propose world clock fields.',
  'mind_monitor is a turn-level projection for present NPCs with only surface and subconscious. image_selection and image_character_id are observation projections, not save patches. Identity axes are independent; never copy one into another.',
  'CSA observation is limited to csa_trigger_evaluations and csa_runtime_updates arrays. Never return csa_active, csa_rules, or a csa runtime save object.',
  'Announcement, compliance, embarrassment, or body reaction alone never raises affinity or sexual arousal. csa_acceptance records acceptance or resistance to that rule only. Exposure, erection, conversation, or requests alone never raise it (ejaculation progress). Progress is direct stimulation only: brief +1~2, sustained +2~4, strong +4~6. completion requires evidence.sexual_resolution === true when Story explicitly shows resolution. Never decrease/reset when stimulation stops. Before returning image_selection, reread the final physical scene only. If a sexual physical act is still being performed at the final moment, pool must be sex and tags must describe that ongoing act.',
  'Final scene presence: an exited/disappeared NPC is absent, last speaker may remain historical, and an NPC standing inside or in a doorway remains present.'
].join(' ');

export function buildExtractPrompt({ context, storyText, playerAction, expectedTurn, edition, npcIds }) {
  const charactersMap = object(edition?.characters?.characters) ?? {};
  const save = object(context?.save?.data) ?? object(context?.save) ?? {};
  const heroineActiveIds = selectActiveCharacterIds({ charactersMap, npcIds, save, playerAction });
  const generalActiveIds = selectActiveGeneralNpcIds({ edition, save, text: storyText });
  const activeIds = [...heroineActiveIds, ...generalActiveIds.filter(id => !heroineActiveIds.includes(id))];
  return [
    { role: 'system', content: SYSTEM_INSTRUCTIONS },
    {
      role: 'user',
      content: JSON.stringify({
        extract_version: 2,
        registered_characters: buildRegisteredCharacters(edition),
        registered_general_npcs: buildRegisteredGeneralNpcs(edition),
        registered_locations: buildRegisteredLocations(edition),
        active_character_canon: buildExtractCharacterCanon(charactersMap, heroineActiveIds),
        active_general_npc_canon: buildGeneralNpcCanon(edition, generalActiveIds),
        story_text: storyText,
        context: buildExtractContextProjection(context, activeIds),
        player_action: playerAction,
        expected_turn: expectedTurn
      })
    }
  ];
}

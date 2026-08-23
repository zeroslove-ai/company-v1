import { parseR3DialogueLines, projectR3Media } from './media.js';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function strings(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : []; }
function label(items, key, value) { return items.find(item => item?.[key] === value)?.name ?? value ?? ''; }

export function buildR3ViewModel(context = {}, catalogs = {}) {
  const stateEnvelope = object(context.state); const state = object(stateEnvelope.state);
  const turns = Array.isArray(context.turns) ? context.turns : [];
  const latest = turns.at(-1) ?? {};
  const locationById = new Map((catalogs.locations ?? []).map(location => [location.location_id, location]));
  const actorById = new Map((catalogs.actors ?? []).map(actor => [actor.id ?? actor.character_id, actor]));
  const actorNames = Object.fromEntries([...actorById].map(([id, actor]) => [id, actor.name]));
  const profile = object(context.game?.profile ?? state.profile);
  const scene = object(state.scene);
  const presentIds = strings(scene.present_actor_ids);
  const presentActors = presentIds.map(id => actorById.get(id)).filter(Boolean);
  const monitorSource = object(latest.mind_monitor);
  const mindMonitor = Object.fromEntries(Object.entries(monitorSource).filter(([id]) => presentIds.includes(id)).map(([id, monitor]) => [id, { ...object(monitor), name: actorNames[id] ?? monitor?.name ?? id }]));
  const committedTurn = stateEnvelope.committed_turn ?? context.state?.committed_turn ?? 0;
  const latestIsCurrent = latest.turn_number === committedTurn;
  const observerApplied = object(latest.observer_applied);
  const dialogueLines = latestIsCurrent ? parseR3DialogueLines(latest.story_text, actorNames) : [];
  const view = {
    gameId: context.game?.game_id ?? '',
    committedTurn,
    profile: { ...profile, department: label(catalogs.departments ?? [], 'department_id', profile.department_id), position: label(catalogs.positions ?? [], 'position_id', profile.position_id), body_type: label(catalogs.body_types ?? [], 'body_type_id', profile.body_type_id), speech_style: label(catalogs.speech_styles ?? [], 'speech_style_id', profile.speech_style_id) },
    time: object(state.time),
    scene: { location_id: scene.location_id ?? '', location: locationById.get(scene.location_id) ?? null, present_actor_ids: presentIds, present_npc_ids: presentIds, present_actors: presentActors, scene_note: typeof scene.scene_note === 'string' ? scene.scene_note : '', focal_actor: actorById.get(scene.focal_actor_id) ?? null, focal_character: actorById.get(scene.focal_actor_id) ?? null },
    csa: { active_ids: Array.isArray(state.csa_active) ? state.csa_active : [], rules: object(state.csa_rules), revision: stateEnvelope.revision ?? 0 },
    story: latest.story_text ?? '',
    history: turns,
    choices: latestIsCurrent ? strings(latest.choices).slice(0, 4) : [],
    playerInnerThought: latestIsCurrent ? (typeof observerApplied.player_inner_thought === 'string' ? observerApplied.player_inner_thought : '') : '',
    mindMonitor,
    actorNames,
    dialogue_lines: dialogueLines,
    turn: { committed_turn: committedTurn, turn_id: latestIsCurrent ? `${committedTurn}:${latest.revision ?? 0}` : '', revision: latestIsCurrent ? Number(latest.revision ?? 0) : 0, action_id: latest.action_id ?? '' },
    job: context.job ?? null
  };
  view.media = projectR3Media({ ...view, media: { dialogue_lines: dialogueLines } });
  return view;
}

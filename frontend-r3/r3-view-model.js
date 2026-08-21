function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function strings(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : []; }

export function buildR3ViewModel(context = {}, catalogs = {}) {
  const state = object(context.state?.state); const turns = Array.isArray(context.turns) ? context.turns : []; const latest = turns.at(-1) ?? {};
  const locationById = new Map((catalogs.locations ?? []).map(location => [location.location_id, location]));
  const actorById = new Map((catalogs.actors ?? []).map(actor => [actor.id, actor]));
  const profile = object(context.game?.profile ?? state.profile);
  const label = (items, key, value) => items.find(item => item[key] === value)?.name ?? value ?? '';
  const sceneLocation = locationById.get(state.scene?.location_id) ?? null;
  const sceneActors = strings(state.scene?.present_actor_ids).map(id => actorById.get(id)).filter(Boolean);
  const mindMonitor = Object.entries(object(latest.mind_monitor)).map(([id, monitor]) => ({ id, name: actorById.get(id)?.name ?? monitor?.name ?? '기록된 인물', ...object(monitor) }));
  return {
    gameId: context.game?.game_id ?? '', committedTurn: context.state?.committed_turn ?? 0,
    profile: { ...profile, department: label(catalogs.departments ?? [], 'department_id', profile.department_id), position: label(catalogs.positions ?? [], 'position_id', profile.position_id), body_type: label(catalogs.body_types ?? [], 'body_type_id', profile.body_type_id), speech_style: label(catalogs.speech_styles ?? [], 'speech_style_id', profile.speech_style_id) }, time: object(state.time),
    scene: { location_id: state.scene?.location_id ?? '', location: sceneLocation, present_actor_ids: strings(state.scene?.present_actor_ids), present_actors: sceneActors, scene_note: typeof state.scene?.scene_note === 'string' ? state.scene.scene_note : '' },
    story: latest.story_text ?? '', history: turns, choices: latest.turn_number === context.state?.committed_turn ? strings(latest.choices) : [],
    mindMonitor, job: context.job ?? null
  };
}

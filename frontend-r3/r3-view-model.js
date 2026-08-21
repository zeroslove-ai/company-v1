function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function strings(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : []; }

export function buildR3ViewModel(context = {}) {
  const state = object(context.state?.state); const turns = Array.isArray(context.turns) ? context.turns : []; const latest = turns.at(-1) ?? {};
  return {
    gameId: context.game?.game_id ?? '', committedTurn: context.state?.committed_turn ?? 0,
    profile: object(context.game?.profile ?? state.profile), time: object(state.time),
    scene: { location_id: state.scene?.location_id ?? '', present_actor_ids: strings(state.scene?.present_actor_ids), scene_note: typeof state.scene?.scene_note === 'string' ? state.scene.scene_note : '' },
    story: latest.story_text ?? '', history: turns, choices: latest.turn_number === context.state?.committed_turn ? strings(latest.choices) : [],
    mindMonitor: object(latest.mind_monitor), job: context.job ?? null
  };
}

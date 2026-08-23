const text = value => typeof value === 'string' ? value.trim() : '';
const identity = value => text(value) || null;
const EXPLICIT_MOVEMENT = /\b(?:go|move|walk|enter|visit|leave)\b|(?:\uC774\uB3D9|\uAC00\uB2E4|\uAC04\uB2E4|\uB098\uAC00|\uB4E4\uC5B4\uAC00|\uBC29\uBB38|\uCC3E\uC544\uAC00|\uB9CC\uB098\uB7EC)/iu;

function locationCandidates(content) {
  const candidates = [];
  for (const location of Array.isArray(content?.locations) ? content.locations : []) {
    const id = identity(location?.location_id);
    if (!id) continue;
    for (const name of [location?.name, ...(Array.isArray(location?.aliases) ? location.aliases : [])]) {
      const label = identity(name);
      if (label) candidates.push({ id, label });
    }
  }
  return candidates;
}

function destinationActors(content, destinationId) {
  const location = (content?.locations ?? []).find(item => item?.location_id === destinationId);
  return [...new Set((location?.default_npc_ids ?? []).filter(id => typeof id === 'string' && id.trim()))];
}

export function resolvePlayerNavigationIntent({ content, state = {}, literalAction = '' } = {}) {
  const source = text(literalAction);
  if (!source || !EXPLICIT_MOVEMENT.test(source)) return null;
  const currentId = identity(state?.scene?.location_id);
  const matches = locationCandidates(content).filter(candidate => source.includes(candidate.label));
  if (!matches.length) return null;
  const longest = Math.max(...matches.map(candidate => candidate.label.length));
  const ids = [...new Set(matches.filter(candidate => candidate.label.length === longest).map(candidate => candidate.id))];
  if (ids.length !== 1 || ids[0] === currentId) return null;
  return { kind: 'player_navigation', destination_location_id: ids[0], source: 'explicit_location' };
}

export function projectNavigationContext(context, navigationIntent, content) {
  if (navigationIntent?.kind !== 'player_navigation') return context;
  const next = structuredClone(context);
  const state = next?.state?.state;
  if (!state || typeof state !== 'object') return context;
  const scene = state.scene && typeof state.scene === 'object' ? state.scene : {};
  state.scene = {
    ...scene,
    location_id: navigationIntent.destination_location_id,
    present_actor_ids: destinationActors(content, navigationIntent.destination_location_id),
    scene_note: ''
  };
  return next;
}

export function applyNavigationPostcondition(state, observation, navigationIntent, content) {
  if (navigationIntent?.kind !== 'player_navigation') return state;
  const next = structuredClone(state);
  const scene = next.scene && typeof next.scene === 'object' ? next.scene : {};
  const groundedEntrants = Array.isArray(observation?.entered)
    ? observation.entered.map(item => item?.actor_id).filter(id => typeof id === 'string' && id.trim())
    : [];
  scene.location_id = navigationIntent.destination_location_id;
  scene.present_actor_ids = [...new Set([
    ...destinationActors(content, navigationIntent.destination_location_id),
    ...groundedEntrants
  ])];
  next.scene = scene;
  return next;
}

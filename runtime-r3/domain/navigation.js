import { actorDirectory } from './content.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const identity = value => text(value) || null;
const EXPLICIT_MOVEMENT = /\b(?:go|move|walk|enter|visit|leave)\b|(?:\uC774\uB3D9|\uAC00\uB2E4|\uAC04\uB2E4|\uB098\uAC00|\uB4E4\uC5B4\uAC00|\uBC29\uBB38|\uCC3E\uC544\uAC00|\uB9CC\uB098\uB7EC)/iu;
const EXPLICIT_MOVEMENT_GLOBAL = /\b(?:go|move|walk|enter|visit|leave)\b|(?:\uC774\uB3D9|\uAC00\uB2E4|\uAC04\uB2E4|\uB098\uAC00|\uB4E4\uC5B4\uAC00|\uBC29\uBB38|\uCC3E\uC544\uAC00|\uB9CC\uB098\uB7EC)/igu;
const PLAYER_BINDING = /\b(?:I|me|myself)\b|(?:나는|내가|제가|저는|저\b)/iu;
const CLAUSE_BOUNDARY = /[.!?\u3002\uFF01\uFF1F;]|\s+(?:그리고|하지만|그러나|한\s*뒤(?:에도)?|뒤에|후에)\s*/u;

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

function movementClauses(source) {
  return source.split(CLAUSE_BOUNDARY).map(part => part.trim()).filter(Boolean);
}

function actorNames(content) {
  return Object.values(actorDirectory(content)).map(actor => identity(actor?.name)).filter(Boolean);
}

function actorDestinationCandidates(content, clause) {
  const destinations = [];
  for (const actor of Object.values(actorDirectory(content))) {
    if (!actor?.name || !clause.includes(actor.name) || !actor.default_location_id) continue;
    destinations.push(actor.default_location_id);
  }
  return [...new Set(destinations)];
}

function hasCanonicalNpcSubjectBeforeDestination(clause, destinationLabel, names) {
  const destinationIndex = clause.indexOf(destinationLabel);
  if (destinationIndex < 0) return false;
  const beforeDestination = clause.slice(0, destinationIndex);
  const previousMovement = [...beforeDestination.matchAll(EXPLICIT_MOVEMENT_GLOBAL)].at(-1);
  const movementSubject = previousMovement
    ? beforeDestination.slice(previousMovement.index + previousMovement[0].length)
    : beforeDestination;
  return names.some(name => {
    const subjectPattern = new RegExp(`${name}(?:\\s+\\S+){0,2}\\s*(?:은|는|이|가|께서)(?=\\s|$|[^\\p{L}])`, 'u');
    return subjectPattern.test(movementSubject);
  });
}

function hasCanonicalNpcSubject(clause, names) {
  return names.some(name => {
    const subjectPattern = new RegExp(`${name}(?:\\s+\\S+){0,2}\\s*(?:은|는|이|가|께서)(?=\\s|$|[^\\p{L}])`, 'u');
    return subjectPattern.test(clause);
  });
}

export function resolvePlayerNavigationIntent({ content, state = {}, literalAction = '' } = {}) {
  const source = text(literalAction);
  if (!source || !EXPLICIT_MOVEMENT.test(source)) return null;
  const currentId = identity(state?.scene?.location_id);
  const names = actorNames(content);
  const candidates = [];
  for (const clause of movementClauses(source)) {
    if (!EXPLICIT_MOVEMENT.test(clause)) continue;
    const playerBound = PLAYER_BINDING.test(clause);
    const matches = locationCandidates(content).filter(candidate => clause.includes(candidate.label));
    if (matches.length) {
      const longest = Math.max(...matches.map(candidate => candidate.label.length));
      const playerDestinations = matches
        .filter(candidate => candidate.label.length === longest)
        .filter(candidate => !hasCanonicalNpcSubjectBeforeDestination(clause, candidate.label, names));
      candidates.push(...playerDestinations.map(candidate => candidate.id));
    } else if (playerBound && !hasCanonicalNpcSubject(clause, names)) {
      candidates.push(...actorDestinationCandidates(content, clause));
    }
  }
  const ids = [...new Set(candidates)];
  if (ids.length !== 1 || ids[0] === currentId) return null;
  return { kind: 'player_navigation', destination_location_id: ids[0], source: 'explicit_player_binding' };
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

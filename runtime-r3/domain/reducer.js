import { advanceTime, clone } from './contracts.js';
import { applyNavigationPostcondition } from './navigation.js';

export function reduceObservation({ state, observation, turnNumber, navigationIntent = null, content = null }) {
  const next = clone(state);
  next.time = advanceTime(next.time, observation?.elapsed_minutes);
  const scene = next.scene ?? (next.scene = { location_id: null, present_actor_ids: [], scene_note: '' });
  if (observation?.location?.location_id) scene.location_id = observation.location.location_id;
  const present = new Set(scene.present_actor_ids ?? []);
  for (const item of observation?.entered ?? []) present.add(item.actor_id);
  for (const item of observation?.exited ?? []) present.delete(item.actor_id);
  if (Array.isArray(observation?.present_actor_ids)) scene.present_actor_ids = [...new Set(observation.present_actor_ids)];
  else scene.present_actor_ids = [...present];
  scene.scene_note = typeof observation?.scene_note === 'string' ? observation.scene_note.trim().slice(0, 1000) : '';
  if (!next.clothing || typeof next.clothing !== 'object') next.clothing = {};
  for (const change of observation?.clothing_changes ?? []) next.clothing[change.actor_id] = { ...(next.clothing[change.actor_id] ?? {}), ...change.slots };
  return { state: applyNavigationPostcondition(next, observation, navigationIntent, content), applied: observation ?? {}, turnNumber };
}

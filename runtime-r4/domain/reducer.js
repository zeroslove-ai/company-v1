export function reduceTurn({ before, observation, turnNumber, turnRevision }) {
  const after = structuredClone(before);
  const verified = {};
  const unverified = [];
  if (observation.scene.location?.status === 'verified') {
    after.scene.location_id = observation.scene.location.value;
    verified.location = turnNumber;
  } else unverified.push({ field: 'location', reason: 'not_observed_or_evidence_rejected' });
  if (observation.scene.presence?.status === 'verified') {
    after.scene.present_actor_ids = [...observation.scene.presence.value];
    verified.present_actor_ids = turnNumber;
  } else unverified.push({ field: 'present_actor_ids', reason: 'not_observed_or_evidence_rejected' });
  if (observation.scene.sceneNote?.status === 'verified') {
    after.scene.scene_note = observation.scene.sceneNote.value;
    verified.scene_note = turnNumber;
  } else unverified.push({ field: 'scene_note', reason: 'not_observed_or_evidence_rejected' });
  if (observation.elapsedMinutes?.status === 'verified') {
    const totalMinutes = after.time.minutes + observation.elapsedMinutes.value;
    after.time.day += Math.floor(totalMinutes / (24 * 60));
    after.time.minutes = totalMinutes % (24 * 60);
    verified.time = turnNumber;
  } else if (observation.elapsedMinutes?.status !== 'unchanged') unverified.push({ field: 'time', reason: 'not_observed_or_evidence_rejected' });
  after.state_revision = before.state_revision + 1;
  after.committed_turn = turnNumber;
  after.turn_revision = turnRevision;
  after.projection_meta = {
    status: unverified.length || !observation.complete ? 'degraded' : 'complete',
    last_verified_turn: { ...(before.projection_meta?.last_verified_turn ?? {}), ...verified },
    unverified
  };
  return after;
}

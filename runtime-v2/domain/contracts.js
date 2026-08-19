export const PLAYER_ID = 'player-1';
export const MAX_ACTION_LENGTH = 2000;

export function createInitialState({ playerName = '플레이어', locationId = 'lobby' } = {}) {
  return {
    player: { id: PLAYER_ID, name: String(playerName), level: 7, exp: 0 },
    time: { day: 1, minute: 540 },
    scene: { location_id: locationId, present_npc_ids: [] }
  };
}

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function requireLiteralAction(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_ACTION_LENGTH || value.trim() === '') {
    throw new Error('literal_action_invalid');
  }
  return value;
}

export function assertExpectedTurn({ expectedTurn, committedTurn }) {
  if (!Number.isInteger(expectedTurn) || expectedTurn !== committedTurn + 1) throw new Error('expected_turn_conflict');
}

export function exactFourChoices(choices) {
  if (!Array.isArray(choices) || choices.length !== 4 || choices.some((choice) => typeof choice !== 'string' || choice.trim() === '')) {
    throw new Error('choices_invalid');
  }
  return choices.map((choice) => choice);
}

export function reduceObservation({ state, observation, storyText, content, targetIds = [] }) {
  const next = clone(state);
  const elapsed = Number.isInteger(observation?.elapsed_minutes) && observation.elapsed_minutes >= 0
    ? observation.elapsed_minutes : 0;
  next.time.minute += elapsed;
  while (next.time.minute >= 1440) {
    next.time.minute -= 1440;
    next.time.day += 1;
  }

  const scene = observation?.scene;
  if (scene && typeof scene === 'object') {
    const validEntered = Array.isArray(scene.entered)
      ? scene.entered.filter((entry) => isExactNpcEvidence(entry, storyText, content)).map((entry) => entry.actor_id)
      : [];
    const validExited = Array.isArray(scene.exited)
      ? scene.exited.filter((entry) => isExactNpcEvidence(entry, storyText, content)).map((entry) => entry.actor_id)
      : [];
    next.scene.present_npc_ids = [...new Set([
      ...next.scene.present_npc_ids.filter((id) => !validExited.includes(id)),
      ...validEntered
    ])];
    if (typeof scene.location_id === 'string' && content.getLocation(scene.location_id)) next.scene.location_id = scene.location_id;
  }

  const relevant = new Set(targetIds.filter((id) => content.getNpc(id)));
  const mind = {};
  if (observation?.mind_monitor && typeof observation.mind_monitor === 'object') {
    for (const [id, value] of Object.entries(observation.mind_monitor)) {
      if (relevant.has(id) && value && typeof value === 'object') mind[id] = { surface: String(value.surface ?? ''), subconscious: String(value.subconscious ?? '') };
    }
  }
  return { state: next, mindMonitor: mind };
}

function isExactNpcEvidence(entry, storyText, content) {
  return entry && content.getNpc(entry.actor_id) && typeof entry.quote === 'string' && entry.quote.length > 0 && storyText.includes(entry.quote);
}

export function boundedSummary(storyText, summary) {
  if (typeof summary === 'string' && summary.trim()) return summary.trim().slice(0, 500);
  return storyText.replace(/\s+/g, ' ').trim().slice(0, 240) || '이야기 진행이 기록되었습니다.';
}

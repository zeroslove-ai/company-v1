function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value, fallback = 0) {
  const resolved = Number(value);
  return Number.isFinite(resolved) ? resolved : fallback;
}

/** Presentation identity only; historical turn snapshots are not fresh state. */
export function buildCharacterDisplayDetails(_save, edition) {
  const result = {};
  for (const [id, profile] of Object.entries(object(edition?.characters?.characters))) {
    result[id] = {
      id,
      name: text(profile?.name) || id,
      profile: {
        age: Number.isFinite(Number(profile?.age)) ? Number(profile.age) : null,
        department: text(profile?.department),
        position: text(profile?.position),
        role: text(profile?.role_title),
        company_tenure: text(profile?.company_tenure),
        appearance: text(profile?.prompt_card?.appearance)
      },
      body: {
        height_cm: Number.isFinite(Number(profile?.body?.height_cm)) ? Number(profile.body.height_cm) : null,
        weight_kg: Number.isFinite(Number(profile?.body?.weight_kg)) ? Number(profile.body.weight_kg) : null,
        body_type: text(profile?.body?.body_type),
        cup: text(profile?.body?.cup)
      }
    };
  }
  return result;
}

/** Player sexual UI is derived only from the retained narrow player mechanic. */
export function buildPlayerSexualDisplay(save) {
  const state = object(save?.player_sexual_state);
  const latest = object(state.last_sexual_event) ? state.last_sexual_event : null;
  return {
    arousal: number(state.arousal),
    ejaculation_progress: number(state.ejaculation_progress ?? state.ejaculation_meter),
    ejaculation_count: Math.max(0, number(state.ejaculation_count)),
    total_sexual_events: Math.max(0, number(state.total_sexual_events)),
    last_sexual_event: latest ? {
      turn: latest.turn ?? null,
      type: text(latest.type ?? latest.action_type),
      completed: latest.completed === true,
      interrupted: latest.interrupted === true,
      evidence: text(latest.evidence)
    } : null
  };
}

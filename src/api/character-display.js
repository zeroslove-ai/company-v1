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

function profiles(edition) {
  return object(edition?.characters?.characters);
}

const STAT_KEYS = {
  affinity: ['affinity', 'affection', '호감도'],
  work_trust: ['work_trust', '업무신뢰도'],
  csa_acceptance: ['csa_acceptance', 'acceptance', '상식수용도'],
  sexual_arousal: ['sexual_arousal', 'arousal', '성적흥분도']
};

function statValue(stats, keys) {
  for (const key of keys) {
    if (Number.isFinite(Number(stats?.[key]))) return Number(stats[key]);
  }
  return 0;
}

function recentChanges(turn, id) {
  const source = Array.isArray(turn?.turn_changes) ? turn.turn_changes : [];
  const changes = {};
  for (const item of source) {
    const path = text(item?.path);
    const match = /^npc_stats\.([^.]+)\.([^.]+)$/.exec(path);
    if (!match || match[1] !== id) continue;
    const canonical = Object.entries(STAT_KEYS).find(([, aliases]) => aliases.includes(match[2]))?.[0];
    if (!canonical) continue;
    const from = Number(item?.from);
    const to = Number(item?.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) continue;
    changes[canonical] = { from, to, delta: to - from };
  }
  if (Object.keys(changes).length) return changes;

  const before = object(object(turn?.pre_save).npc_stats)[id] ?? {};
  const after = object(object(turn?.post_save).npc_stats)[id] ?? {};
  for (const [canonical, aliases] of Object.entries(STAT_KEYS)) {
    const from = statValue(before, aliases);
    const to = statValue(after, aliases);
    if (from === to) continue;
    changes[canonical] = { from, to, delta: to - from };
  }
  return changes;
}

function eventRecord(save, id) {
  const relationship = object(object(save?.npc_relationship_state)[id]);
  const history = object(relationship.sexual_history);
  const ledger = (Array.isArray(save?.sexual_event_ledger) ? save.sexual_event_ledger : [])
    .filter(event => event?.actor_id === id || event?.target_id === id);
  const completed = ledger.filter(event => event?.completed === true);
  const interrupted = ledger.filter(event => event?.interrupted === true);
  const playerEjaculations = completed.filter(event => event?.actor_id === 'player'
    && event?.target_id === id
    && ['orgasm', 'penetration', 'ejaculation'].includes(event?.action_type)).length;
  const npcOrgasms = completed.filter(event => event?.actor_id === id
    && ['orgasm', 'penetration'].includes(event?.action_type)).length;
  const turnValues = ledger.map(event => Number(event?.turn)).filter(Number.isInteger).sort((a, b) => a - b);
  return {
    player_ejaculation_count: Math.max(0, number(history.player_ejaculation_count, number(relationship.player_ejaculation_count, playerEjaculations))),
    npc_orgasm_count: Math.max(0, number(history.npc_orgasm_count, number(relationship.npc_orgasm_count, number(object(save?.ejaculation_counts)[id], npcOrgasms)))),
    vaginal_sex_count: Math.max(0, number(history.vaginal_sex_count)),
    anal_sex_count: Math.max(0, number(history.anal_sex_count)),
    oral_sex_count: Math.max(0, number(history.oral_sex_count)),
    vaginal_ejaculation_count: Math.max(0, number(history.vaginal_ejaculation_count)),
    anal_ejaculation_count: Math.max(0, number(history.anal_ejaculation_count)),
    oral_ejaculation_count: Math.max(0, number(history.oral_ejaculation_count)),
    facial_ejaculation_count: Math.max(0, number(history.facial_ejaculation_count)),
    body_ejaculation_count: Math.max(0, number(history.body_ejaculation_count)),
    first_vaginal_turn: Number.isInteger(history.first_vaginal_turn) ? history.first_vaginal_turn : null,
    first_anal_turn: Number.isInteger(history.first_anal_turn) ? history.first_anal_turn : null,
    total_events: ledger.length,
    completed_events: completed.length,
    interrupted_events: interrupted.length,
    first_event_turn: turnValues[0] ?? null,
    last_event_turn: turnValues.at(-1) ?? null,
    last_event: ledger.at(-1) ? {
      turn: ledger.at(-1).turn,
      action_type: ledger.at(-1).action_type,
      completed: ledger.at(-1).completed === true,
      interrupted: ledger.at(-1).interrupted === true,
      evidence: text(ledger.at(-1).evidence)
    } : null
  };
}

function privateInfo(profile, record, relationship) {
  const unlocked = record.player_ejaculation_count > 0
    || record.npc_orgasm_count > 0
    || Number.isInteger(relationship?.milestones?.sexual_relationship_started_turn);
  const source = object(profile?.private_info);
  return unlocked ? {
    unlocked: true,
    nipple: text(source.nipple),
    areola_size: text(source.areola_size),
    areola_color: text(source.areola_color),
    pubic_hair: text(source.pubic_hair),
    past_partner_count: Number.isFinite(Number(source.past_partner_count)) ? Number(source.past_partner_count) : null,
    past_orgasm_count: Number.isFinite(Number(source.past_orgasm_count)) ? Number(source.past_orgasm_count) : null,
    relationship: text(source.relationship),
    intimate_notes: text(source.intimate_notes)
  } : { unlocked: false };
}

export function buildCharacterDisplayDetails(save, edition, latestTurn = {}) {
  const result = {};
  for (const [id, profile] of Object.entries(profiles(edition))) {
    const stats = object(object(save?.npc_stats)[id]);
    const relationship = object(object(save?.npc_relationship_state)[id]);
    const record = eventRecord(save, id);
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
      },
      stats: {
        affinity: statValue(stats, STAT_KEYS.affinity),
        work_trust: statValue(stats, STAT_KEYS.work_trust),
        csa_acceptance: statValue(stats, STAT_KEYS.csa_acceptance),
        sexual_arousal: statValue(stats, STAT_KEYS.sexual_arousal)
      },
      stat_changes: recentChanges(latestTurn, id),
      relationship_summary: text(relationship.relationship_summary)
        || text(relationship.summary)
        || text(relationship.current_boundary),
      relationship_record: record,
      private_info: privateInfo(profile, record, relationship)
    };
  }
  return result;
}

export function buildPlayerSexualDisplay(save) {
  const state = object(save?.player_sexual_state);
  const ledger = (Array.isArray(save?.sexual_event_ledger) ? save.sexual_event_ledger : [])
    .filter(event => event?.actor_id === 'player' || event?.target_id === 'player');
  const latest = state.last_sexual_event ?? ledger.at(-1) ?? null;
  return {
    arousal: number(state.arousal),
    ejaculation_progress: number(state.ejaculation_progress ?? state.ejaculation_meter),
    ejaculation_count: Math.max(0, number(state.ejaculation_count, number(object(save?.ejaculation_counts).player))),
    total_sexual_events: ledger.length,
    last_sexual_event: latest ? {
      turn: latest.turn ?? null,
      type: text(latest.type ?? latest.action_type),
      completed: latest.completed === true,
      interrupted: latest.interrupted === true,
      evidence: text(latest.evidence)
    } : null
  };
}

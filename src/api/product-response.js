import { buildContextDisplayPayload, buildNpcAppPayload } from './runtime-display.js';
import { buildCharacterDisplayDetails, buildPlayerSexualDisplay } from './character-display.js';
import { buildFullPlayerInfo } from './product-recovery.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function responseData(payload) {
  return object(payload?.data) ?? object(payload);
}

function contextSave(context) {
  return object(context?.save?.data) ?? object(context?.save) ?? {};
}

function latestTurn(context) {
  const turns = Array.isArray(context?.recent_turns) ? context.recent_turns : [];
  return object(turns.at(-1)) ?? {};
}

function latestMind(context) {
  return object(latestTurn(context)?.mind_monitor) ?? {};
}

function canonicalMapLocations(edition) {
  return (Array.isArray(edition?.map?.locations) ? edition.map.locations : [])
    .filter(location => typeof location?.location_id === 'string' && location.location_id);
}

function canonicalNpcDefaultLocations(edition) {
  const defaults = {};
  for (const [id, profile] of Object.entries(object(edition?.characters?.characters) ?? {})) {
    if (typeof profile?.default_location_id === 'string' && profile.default_location_id) {
      defaults[id] = profile.default_location_id;
    }
  }
  for (const [id, profile] of Object.entries(object(edition?.generalNpcs?.profiles) ?? {})) {
    if (typeof profile?.default_location_id === 'string' && profile.default_location_id) {
      defaults[id] = profile.default_location_id;
    }
  }
  for (const location of canonicalMapLocations(edition)) {
    for (const id of Array.isArray(location.default_npc_ids) ? location.default_npc_ids : []) {
      if (typeof id === 'string' && id && !defaults[id]) defaults[id] = location.location_id;
    }
  }
  return defaults;
}

function mergeNpcPayload(save, edition, latestMindMonitor, details) {
  return buildNpcAppPayload(save, edition, latestMindMonitor).map(base => {
    const detail = details[base.id] ?? {};
    return {
      ...base,
      // App NPC identity/scope comes only from the evidence-aware app projection.
      profile: detail.profile ?? base.profile ?? {},
      body: detail.body ?? base.body ?? {},
      stat_changes: detail.stat_changes ?? base.stat_changes ?? {},
      relationship_summary: base.relationship_summary || detail.relationship_summary || '',
      relationship_record: detail.relationship_record ?? {},
      private_info: detail.private_info ?? { unlocked: false }
    };
  });
}

export function enrichContextEnvelope(payload, edition) {
  const data = responseData(payload);
  const context = object(data?.context);
  if (!data || !context) return payload;
  const save = contextSave(context);
  const currentTurn = latestTurn(context);
  const baseDisplay = buildContextDisplayPayload(save, edition, latestMind(context));
  data.context = {
    ...context,
    display: {
      ...(object(context.display) ?? {}),
      ...baseDisplay,
      // 회사 맵은 축약 projection이 아니라 번들 정본 전체를 보낸다.
      // description/zone/type/default_npcs가 빠지면 프론트가 빈 구조도로 축약된다.
      map_locations: canonicalMapLocations(edition),
      npc_default_locations: canonicalNpcDefaultLocations(edition),
      character_details: buildCharacterDisplayDetails(save, edition, currentTurn),
      player_sexual: buildPlayerSexualDisplay(save)
    }
  };
  return payload;
}

export function enrichAppEnvelope(payload, context, edition) {
  const data = responseData(payload);
  const app = object(data?.app);
  const resolvedContext = object(context);
  if (!data || !app || !resolvedContext) return payload;
  const save = contextSave(resolvedContext);
  const details = buildCharacterDisplayDetails(save, edition, latestTurn(resolvedContext));
  data.app = {
    ...app,
    player_info: buildFullPlayerInfo(save, edition),
    npcs: mergeNpcPayload(save, edition, latestMind(resolvedContext), details)
  };
  return payload;
}

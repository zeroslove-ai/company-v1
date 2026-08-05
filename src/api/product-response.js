import { buildContextDisplayPayload, buildNpcAppPayload } from './runtime-display.js';
import { buildCharacterDisplayDetails, buildPlayerSexualDisplay } from './character-display.js';
import { buildFullPlayerInfo, buildFinderNpcList } from './product-recovery.js';

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

function mergeNpcPayload(save, edition, latestMindMonitor, details) {
  const existing = new Map(buildNpcAppPayload(save, edition, latestMindMonitor).map(item => [item.id, item]));
  return buildFinderNpcList(save, edition).map(finder => {
    const base = existing.get(finder.id) ?? {
      id: finder.id,
      name: finder.name,
      department: finder.department,
      position: finder.position,
      role: finder.role,
      present_now: finder.present_now,
      location: {
        known: finder.known,
        location_label: finder.location_label,
        location_id: finder.location_id,
        suggested_location_label: finder.suggested_location_label,
        suggested_location_id: finder.suggested_location_id
      },
      stats: { affection: 0, work_trust: 0, acceptance: 0, arousal: 0 },
      mind: { surface: '', subconscious: '' },
      scene_state: {},
      relationship_summary: ''
    };
    const detail = details[finder.id] ?? {};
    return {
      ...base,
      name: base.name || finder.name,
      department: base.department || finder.department,
      position: base.position || finder.position,
      role: base.role || finder.role,
      present_now: finder.present_now,
      location: {
        known: finder.known,
        location_label: finder.location_label,
        location_id: finder.location_id,
        suggested_location_label: finder.suggested_location_label,
        suggested_location_id: finder.suggested_location_id
      },
      profile: detail.profile ?? {},
      body: detail.body ?? {},
      stat_changes: detail.stat_changes ?? {},
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
  data.context = {
    ...context,
    display: {
      ...(object(context.display) ?? {}),
      ...buildContextDisplayPayload(save, edition, latestMind(context)),
      player_info: buildFullPlayerInfo(save, edition),
      npc_finder: buildFinderNpcList(save, edition),
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
    npcs: mergeNpcPayload(save, edition, latestMind(resolvedContext), details),
    finder_npcs: buildFinderNpcList(save, edition)
  };
  return payload;
}

export function envelopeContext(payload) {
  return object(responseData(payload)?.context);
}

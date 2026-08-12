import { getActiveCsaEntries } from './applicability.js';
import { compareRequiredClothing, requiredClothingFromActiveCsa } from '../state/clothing.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function profileFor(master, id) {
  const characters = Array.isArray(master?.characters) ? master.characters : [];
  const generalNpcs = Array.isArray(master?.general_npcs) ? master.general_npcs : [];
  return characters.find(entry => (entry?.character_id ?? entry?.id) === id)
    ?? generalNpcs.find(entry => (entry?.npc_id ?? entry?.id) === id)
    ?? {};
}

function authorityFor(rule, preset) {
  return text(preset?.authority_tier)
    ?? text(rule?.authority_tier)
    ?? text(rule?.strength)
    ?? 'weak';
}

function subjectScopeFor(rule, preset) {
  return text(preset?.subject_scope) ?? text(preset?.affected_group) ?? text(rule?.subject_scope) ?? 'company_employee';
}

function modeFor(rule, preset) {
  return preset?.mode === 'on_player_request' ? 'on_player_request' : 'continuous';
}

function phaseFor(rule, expectedTurn) {
  const createdTurn = Number.isInteger(rule?.created_turn) ? rule.created_turn : null;
  const updatedTurn = Number.isInteger(rule?.updated_turn) ? rule.updated_turn : null;
  if (createdTurn !== null && createdTurn === expectedTurn) return 'newly_activated';
  if (updatedTurn !== null && updatedTurn === expectedTurn) return 'updated';
  return 'ongoing';
}

function institutionalFormFor(authority) {
  if (authority === 'strong') return 'national_law_or_regulatory_directive_and_company_notice';
  if (authority === 'medium') return 'company_work_rule_or_enterprise_compliance_policy';
  return 'internal_company_guidance_or_operating_rule';
}

function projectWorldRule(entry, expectedTurn) {
  const rule = object(entry);
  const preset = object(rule.preset);
  const authority = authorityFor(rule, preset);
  return {
    id: entry.id,
    content: text(rule.content) ?? '',
    authority,
    phase: phaseFor(rule, expectedTurn),
    institutional_form: institutionalFormFor(authority),
    mode: modeFor(rule, preset),
    subject_scope: subjectScopeFor(rule, preset),
    counterparty_scope: text(preset.counterparty_scope) ?? text(rule.counterparty_scope),
    trigger: text(preset.trigger) ?? (modeFor(rule, preset) === 'on_player_request' ? 'on_counterparty_request' : 'continuous'),
    newly_activated: phaseFor(rule, expectedTurn) === 'newly_activated'
  };
}

function projectObligations(save, master, sceneActorIds, activeEntries) {
  const state = object(save?.npc_scene_state);
  const obligations = [];
  for (const actorId of Array.isArray(sceneActorIds) ? sceneActorIds : []) {
    if (!text(actorId) || actorId === 'player') continue;
    const profile = profileFor(master, actorId);
    const actual = object(state[actorId]?.clothing);
    const resolved = requiredClothingFromActiveCsa(activeEntries, { ...profile, id: actorId });
    if (resolved.conflicted || !Object.keys(resolved.required_clothing).length) continue;
    const rule = activeEntries.find(entry => entry.id === resolved.source_csa_id);
    const preset = object(rule?.preset);
    if (modeFor(rule, preset) !== 'continuous') continue;
    if (Object.keys(resolved.required_clothing).some(slot => actual[slot] === undefined || actual[slot] === 'unknown')) continue;
    if (compareRequiredClothing(actual, resolved.required_clothing) !== 'noncompliant') continue;
    obligations.push({
      actor_id: actorId,
      source_rule_id: resolved.source_csa_id,
      type: 'clothing_transition',
      changes: Object.entries(resolved.required_clothing).map(([slot, required]) => ({ slot, current: actual[slot], required }))
    });
  }
  return obligations;
}

/** Read-only, per-turn Story projection of canonical institutional rules and obligations. */
export function buildStoryWorldProjection({ save = {}, master = {}, sceneActorIds = [], expectedTurn = null } = {}) {
  const activeEntries = getActiveCsaEntries(save);
  return {
    world_rules: activeEntries.map(entry => projectWorldRule(entry, expectedTurn)),
    scene_obligations: projectObligations(save, master, sceneActorIds, activeEntries)
  };
}

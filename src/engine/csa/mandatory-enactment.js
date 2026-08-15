/**
 * Institutional notice projection and persisted metadata compatibility only.
 * Fresh Story turns do not build physical enactments or require ACTING tokens.
 */

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function institutionalLabel(segment) {
  const phaseText = segment.phase === 'updated' ? '\uD68C\uC0AC \uADDC\uCE59\uC774 \uAC31\uC2E0\uB418\uC5B4' : '\uC0C8\uB85C\uC6B4 \uD68C\uC0AC \uADDC\uCE59\uC774 \uAC8C\uC2DC\uB418\uC5B4';
  const content = text(segment.content);
  const time = segment.effective_game_time;
  const timeLabel = Number.isInteger(time?.day) && Number.isInteger(time?.minute_of_day)
    ? ' \uD68C\uC0AC \uC2DC\uAC01 ' + time.day + '\uC77C ' + String(Math.floor(time.minute_of_day / 60)).padStart(2, '0') + '\uC2DC ' + String(time.minute_of_day % 60).padStart(2, '0') + '\uBD84'
    : '';
  const body = content ? ' \uB0B4\uC6A9\uC740 \uB2E4\uC74C\uACFC \uAC19\uB2E4. ' + content : '';
  return '\uC0AC\uB0B4 \uACF5\uC6A9 \uBAA8\uB2C8\uD130\uC640 \uACF5\uC6A9 \uB514\uC2A4\uD50C\uB808\uC774, \uC9C1\uC6D0 \uD734\uB300\uD3F0 \uC5C5\uBB34 \uC54C\uB9BC\uC5D0 \uC0C8 \uADDC\uC815\uC774 \uB3D9\uC2DC\uC5D0 \uD45C\uC2DC\uB418\uC5C8\uB2E4. ' + phaseText + body + timeLabel + '\uBD80\uD130 \uC989\uC2DC \uD6A8\uB825\uC774 \uBC1C\uC0DD\uD588\uB2E4.';
}

/** Build only the visible institutional notice for a newly activated/updated rule. */
export function buildInstitutionalSegments({ worldRules = [], expectedTurn = null } = {}) {
  return (Array.isArray(worldRules) ? worldRules : [])
    .filter(rule => rule?.phase === 'newly_activated' || rule?.phase === 'updated')
    .map((rule, index) => ({
      segment_id: `turn:${Number.isInteger(expectedTurn) ? expectedTurn : 'unknown'}:institutional:${text(rule?.id) || 'rule'}:${index}`,
      authority: 'engine',
      segment_kind: 'institutional_rule_change',
      source_rule_id: text(rule?.id),
      phase: rule.phase,
      institutional_form: text(rule?.institutional_form),
      content: text(rule?.content),
      effective_turn: Number.isInteger(rule?.updated_turn) && rule.phase === 'updated' ? rule.updated_turn : (Number.isInteger(rule?.created_turn) ? rule.created_turn : expectedTurn),
      effective_game_time: rule?.updated_game_time ?? rule?.activated_game_time ?? rule?.effective_game_time ?? null,
      delivery_channels: ['office_display', 'company_mobile_notice'],
      canonical_text: institutionalLabel({ ...rule, effective_game_time: rule?.updated_game_time ?? rule?.activated_game_time ?? rule?.effective_game_time ?? null })
    }));
}

export function composeCanonicalStory({ institutionalSegments = [], providerNarrative = '' } = {}) {
  const engineText = (Array.isArray(institutionalSegments) ? institutionalSegments : [])
    .map(segment => text(segment?.canonical_text)).filter(Boolean).join('\n\n');
  const providerText = String(providerNarrative ?? '');
  if (!engineText) return providerText;
  if (!providerText) return engineText;
  return `${engineText}\n\n${providerText}`;
}

/** Persisted V1 metadata is reattached for replay only; this never creates fresh authority. */
export function attachEngineEnactments(parsedBlocks = {}, _legacyEnactments = [], institutionalSegments = []) {
  const result = { ...object(parsedBlocks) };
  if (Array.isArray(institutionalSegments) && institutionalSegments.length) {
    result.engine_institutional_segments = institutionalSegments.map(item => ({ ...item }));
  }
  return result;
}

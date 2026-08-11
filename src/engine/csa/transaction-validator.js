import { APP_STRENGTH_RANK, APP_STRENGTH_LABELS, appStrengthId } from './capability.js';
import { normalizeCsaSemanticContract, validateCustomCsaSemanticContract } from './semantic-contract.js';
import { normalizeAppContent } from './transaction-planner.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Deterministic key-sorted JSON so the same logical payload always signs/verifies to the same digest. */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function bytesToBase64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function sha256Base64url(text) {
  return bytesToBase64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))));
}

/** HMAC-SHA256 over a versioned namespace + the payload's stable JSON — the proof the client must carry unmodified back through Story/Extract/Commit. */
export async function signAppValidationProof(secret, payload, version = 1) {
  if (!secret) throw new Error('app validation signing secret unavailable');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`company-app-validation-v${version}\n${stableStringify(payload)}`))));
}

export async function verifyAppValidationProof(secret, payload, signature, version = 1) {
  if (typeof signature !== 'string' || !signature) return false;
  return (await signAppValidationProof(secret, payload, version)) === signature;
}

/** Structural shape check for a raw structured_action before it's planned. */
export function normalizeStructuredAction(rawAction) {
  if (!isPlainObject(rawAction) || rawAction.type !== 'app_transaction') return null;
  if (!Number.isInteger(rawAction.base_turn_count) || rawAction.base_turn_count < 0) return null;
  if (!Array.isArray(rawAction.operations) || !rawAction.operations.length) return null;
  if (rawAction.operations.some(operation => operation?.domain !== 'csa')) return null;
  return { version: 1, type: 'app_transaction', base_turn_count: rawAction.base_turn_count, operations: rawAction.operations };
}

/** Only custom (non-preset) activate/update operations ever need an LLM strength opinion — preset strength is fixed by the catalog. */
export function collectSemanticStrengthCandidates(previousSave, canonicalAction, csaRules) {
  return canonicalAction.operations.flatMap(operation => {
    if (operation.domain !== 'csa' || !['activate', 'update'].includes(operation.operation) || operation.source_type === 'preset') return [];
    const previous = operation.operation === 'update' ? csaRules?.[operation.id] : null;
    const contentChanged = operation.operation === 'activate' || normalizeAppContent(previous?.content) !== normalizeAppContent(operation.content);
    const strengthChanged = operation.operation === 'activate' || previous?.strength !== operation.strength;
    return contentChanged || strengthChanged
      ? [{ client_id: operation.client_id, domain: 'csa', operation: operation.operation, selected_strength: operation.strength, content: operation.content }]
      : [];
  });
}

export function buildAppStrengthValidationPrompt(candidates) {
  return `너는 상식개변 앱에 입력된 사회 규범의 최소 필요 강도를 판정한다.

각 입력마다 weak, medium, strong, unsupported 중 하나를 반환한다.
- weak: 분위기·대화·가벼운 접촉·부끄러움 완화 수준
- medium: 직접적인 신체 노출과 가슴·성기 접촉이 자연스러운 행동으로 이어짐
- strong: 공간 전체의 업무·절차·예절·핵심 금기를 직접 재작성
- unsupported: 물리적으로 불가능하거나 세계 규칙을 무시하거나 즉각적인 자기파괴를 요구

강도는 확신과 사회적 압력만 바꾸며 문장의 의미 범위를 확대하지 않는다.
selected_strength에 맞춰 required_strength를 낮추지 않는다.
모든 후보에 정확히 하나의 결과를 반환하고 client_id를 그대로 복사한다.
custom 상식개변에는 semantic_contract도 반환한다. 주어·대상·방향을 뒤집지 말고, 설명·상담·질문·평가·주변 정상화는 direct sexual authorization이 아니다. 성적 행동 종류, actor/target/direction/action/trigger 중 하나라도 불명확하면 confidence="ambiguous"와 actions=[]을 쓴다. ambiguous sexual contract는 허용되지 않는다.
reason은 80자 이하 한국어 문장으로 작성하고 JSON 이외의 텍스트를 출력하지 않는다.

[판정 대상]
${JSON.stringify(candidates)}

[요구 JSON]
{"results":[{"client_id":"입력값 그대로","required_strength":"weak|medium|strong|unsupported","reason":"80자 이하 이유","semantic_contract":{"version":1,"sexual_authorization":false,"directions":[],"actions":[],"actor_group":"unknown","target_group":"unknown","trigger":"custom_condition","duration":"continuous","public_normalization":false,"direct_execution":false,"confidence":"exact|ambiguous"}}]}`;
}

/** Calls the LLM once for the whole batch of custom candidates (never once per operation). */
export async function classifyAppOperationStrengths(candidates, requestJson) {
  if (!candidates.length) return [];
  const parsed = await requestJson(buildAppStrengthValidationPrompt(candidates));
  const rows = Array.isArray(parsed?.results) ? parsed.results : [];
  const expected = new Set(candidates.map(item => item.client_id));
  if (rows.length !== candidates.length || new Set(rows.map(item => item?.client_id)).size !== expected.size
    || rows.some(item => !expected.has(item?.client_id) || !['weak', 'medium', 'strong', 'unsupported'].includes(item?.required_strength))) {
    throw new Error('invalid strength validation response');
  }
  return rows.map(item => ({
    client_id: item.client_id,
    required_strength: item.required_strength,
    reason: typeof item.reason === 'string' ? item.reason.slice(0, 160) : '',
    raw_semantic_contract: isPlainObject(item.semantic_contract) ? item.semantic_contract : {},
    semantic_contract: normalizeCsaSemanticContract(item.semantic_contract)
  }));
}

export function semanticStrengthIssues(candidates, results, availableStrength) {
  const byId = new Map(results.map(item => [item.client_id, item]));
  const availableRank = APP_STRENGTH_RANK[availableStrength] || 1;
  return candidates.flatMap(candidate => {
    const result = byId.get(candidate.client_id);
    const requiredRank = APP_STRENGTH_RANK[result.required_strength] || 0;
    const selectedRank = APP_STRENGTH_RANK[candidate.selected_strength] || 0;
    if (result.required_strength === 'unsupported') {
      return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: 'CONTENT_OUTSIDE_APP_CAPABILITY', message: '이 내용은 강한 단계에서도 적용할 수 없습니다.', selected_strength: candidate.selected_strength, required_strength: 'unsupported' }];
    }
    const contractValidation = validateCustomCsaSemanticContract({ rawContract: result.raw_semantic_contract, normalizedContract: result.semantic_contract });
    if (!contractValidation.ok) return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: contractValidation.code, message: contractValidation.message }];
    if (requiredRank > availableRank) {
      return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: 'CONTENT_STRENGTH_LOCKED', message: `이 내용은 ${APP_STRENGTH_LABELS[result.required_strength]} 단계가 필요하지만 현재 사용 가능한 단계는 ${APP_STRENGTH_LABELS[availableStrength]}입니다.`, selected_strength: candidate.selected_strength, required_strength: result.required_strength, available_strength: availableStrength, reason: result.reason }];
    }
    if (requiredRank > selectedRank) {
      return [{ client_id: candidate.client_id, domain: candidate.domain, operation: candidate.operation, code: 'CONTENT_REQUIRES_HIGHER_STRENGTH', message: `이 내용은 ${APP_STRENGTH_LABELS[result.required_strength]} 상식개변 강도가 필요합니다. 선택 강도를 변경해 주세요.`, selected_strength: candidate.selected_strength, required_strength: result.required_strength, available_strength: availableStrength, suggested_strength: result.required_strength, reason: result.reason }];
    }
    return [];
  });
}

/** Re-verified independently at each of /api/story, /api/extract, /api/commit — never trusts the client's plan, only the signed digest. */
export async function verifyStructuredActionValidation(secret, gameId, structuredAction) {
  if (structuredAction?.type !== 'app_transaction') return { ok: true };
  const semantic = structuredAction.semantic_validation;
  if (!isPlainObject(semantic) || typeof structuredAction.validation_proof !== 'string' || semantic.game_id !== gameId || semantic.base_turn_count !== structuredAction.base_turn_count) return { ok: false, reason: 'missing or mismatched proof' };
  const actionDigest = await sha256Base64url(stableStringify({ version: structuredAction.version, type: structuredAction.type, base_turn_count: structuredAction.base_turn_count, operations: structuredAction.operations }));
  if (semantic.action_digest !== actionDigest) return { ok: false, reason: 'action digest mismatch' };
  const results = Array.isArray(semantic.results) ? semantic.results : [];
  const mutableOperations = structuredAction.operations.filter(item => ['activate', 'update'].includes(item?.operation));
  const byClientId = new Map(mutableOperations.map(item => [item.client_id, item]));
  if (new Set(results.map(item => item?.client_id)).size !== results.length
    || results.some(item => !byClientId.has(item?.client_id) || !['weak', 'medium', 'strong', 'unsupported'].includes(item?.required_strength))) {
    return { ok: false, reason: 'semantic result mismatch' };
  }
  if (semantic.version !== 1) return { ok: false, reason: 'unsupported semantic validation version' };
  const payload = { game_id: gameId, base_turn_count: structuredAction.base_turn_count, action_digest: actionDigest, semantic_results: results };
  return (await verifyAppValidationProof(secret, payload, structuredAction.validation_proof)) ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}

export { appStrengthId };

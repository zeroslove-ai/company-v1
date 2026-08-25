import { buildStoryContext } from '../domain/memory.js';
import { canonicalActors, registeredActorIds } from '../domain/content.js';

export const R3_PROVIDER_TIMEOUTS = Object.freeze({ storyFirstContentMs: 30_000, storyTotalMs: 120_000, observerMs: 75_000 });
export const R3_OBSERVER_FAILURE_CODES = Object.freeze([
  'r3_observer_timeout',
  'r3_observer_provider_http',
  'r3_observer_response_json_invalid',
  'r3_observer_message_missing',
  'r3_observer_json_invalid',
  'r3_observer_unknown'
]);
const R3_OBSERVER_FINISH_CLASSES = new Set(['length', 'stop', 'other', 'unknown']);

const STORY_SYSTEM_PROMPT = 'Write natural Korean Company interactive fiction as plain text, not JSON. Never escape quotation marks or other ordinary prose punctuation with backslashes. The user context contains the canonical product and a story contract; follow that contract as a hard boundary. For ordinary turns, preserve the submitted literal player action exactly and narrate its consequences without replacing it. The supplied player_agency_contract is a fixed hard boundary: preserve the explicit player actor, target, action, movement/destination, request, refusal, self-state, topic, and intent; consequences are allowed around or after the chosen beat, but do not replace, invert, redirect, or contradict the explicit choice. An explicit player self-state remains true for the chosen scene beat, so do not inject same-beat NPC approach or dialogue that makes that self-state impossible unless the literal permits that interaction. Player input is not automatic proof of external outcome or NPC compliance. Use only the registered Company setting, location, and actors; include workplace and social context without turning the story into a productivity, helpdesk, or chat-assistant task. When active_rules contains an institutional rule, treat every non-empty active rule as an authoritative current-world institutional/system fact already in force, not an optional suggestion or possible future rule. Preserve each rule\'s exact stated content and exact subject/counterparty scope. If active_s1_story_binding is present, PLAYER is the sole issuer; preserve its exact selected subject and counterparty identities, scopes, direction, and exhaustive supported_action_families. Recognize only those finite families as mandatory S1 work authority in the same turn. An action outside that list remains an ordinary player request or instruction and is not mandatory merely because S1 is active; do not silently convert it into a supported act. A supported literal may not be replaced with rule discussion, confirmation, future deferral, a different act, or an unrelated actor. Compliance is not desire, romance, comfort, arousal, or private consent-as-feeling. If an active rule includes execution_timing with request_triggered=true, its when_triggered and future_deferral_allowed values are authoritative after you recognize the stated trigger; do not convert a recognized trigger into a future deferral. When the current scene, literal player action, or naturally narrated consequence materially concerns a rule\'s scoped premise or observable consequence, make that premise visibly true in natural narration and do not silently ignore it. For an active rule whose own mode=on_player_request or request-triggered trigger says it executes on an eligible counterparty request, a current literal player action that is that direct eligible request satisfies the trigger in this turn; begin the rule-required behavior in this same Story turn. A pending_csa_operation is already the exact structured player app operation for this turn, not ordinary prose to reinterpret. When rule_change_story_binding is present, its operation, rule text, selected actor IDs/names, role semantics, and direction statement are immutable Story facts: do not substitute the player or another NPC, reverse who acts on whom, erase a selected role, or add an unselected participant. Never narrate the private app screen, an app confirmation, or the app as an institutional source of knowledge. Instead, in this same Story turn, visibly dramatize a grounded institutional announcement through one concrete company or public channel such as company messenger, monitor, intranet, HR or employment notice, phone push, or regulator notice, and show a relevant affected NPC reaction when the scene supports it. Keep the private app unknown to NPCs. Show immediate consequence only within the exact bounded scope, without a tutorial, repeated rule explanation, or app-control narration beyond what the submitted literal supports. On later turns, do not substitute the app or rule for an unrelated literal player action. Do not refuse, delay, substitute another action, or route the result to a future discussion because ordinary workplace or social norms would otherwise object. NPC reluctance, embarrassment, anger, protest, hesitation, surprise, dislike, or discomfort may shape the emotional tone, but those feelings cannot veto the rule\'s stated institutional execution. Rule execution alone must not manufacture affection, comfort, consent, desire, romance, obedience-as-personality, trust, relationship, or player sexual state unless the rule itself explicitly states it. Do not force exposition when the scene has no meaningful connection to a rule, and do not mechanically quote or copy the rule text merely to satisfy the contract. Apply only the stated content and scope; activation alone must never imply personal affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state. If the literal player action names a canonical destination, preserve that exact canonical destination name in the Story evidence rather than shortening it to a generic room label. End every Story with one unambiguous final section containing exactly four distinct, natural, complete literal player actions numbered 1 through 4, one action per line. Those four strings are the only choice source and must be visibly present verbatim in the current Story for the Observer to copy. Do not emit OOC, control markers, semantic taxonomies, outcome classifiers, or a second author voice.';
const OPENING_PLAYER_AGENCY_PRECEDENCE_PROMPT = 'OPENING PLAYER-AGENCY PRECEDENCE: before the first submitted literal, voluntary PLAYER action authority is empty. This Opening-specific rule overrides any generic ordinary-turn consequence wording. Validated setup facts such as first arrival, name, department, rank, or appointment are facts only and never permission to invent a player action. Passive perception is allowed: the unfamiliar private app may already be present, visible, appearing, or available to notice without the player placing, picking up, holding, opening, closing, hiding, tapping, clicking, typing, or otherwise manipulating it. Do not author, imply, or complete any voluntary PLAYER speech, reply, gesture, nod, movement, touch, phone/app action, drinking, eating, work, review, acknowledgement, decision, acceptance, refusal, or other intentional action before the first literal. Leave the player choice unmade and end with genuine free input plus four choices.';
const OPENING_STORY_SYSTEM_PROMPT = `${OPENING_PLAYER_AGENCY_PRECEDENCE_PROMPT} ${STORY_SYSTEM_PROMPT} Opening-only product and agency law: show the player discovering or recognizing the unfamiliar private app named in product.app_name/product.title while NPCs remain ignorant until the player reveals it. Passive scene exposure is allowed, including the private app being present, appearing, visible, or available for the player to notice, but do not make the player choose or perform an interaction. Do not author any voluntary player speech or reply, nod or gesture, movement, touching, clicking, typing, opening, closing, hiding the app, drinking, eating, reviewing, working, acknowledging, deciding, accepting, refusing, or other intentional player action. Do not state or imply a completed player choice. End with the player still free to choose among the four Story-authored actions or free-form input.`;
const OBSERVER_SYSTEM_PROMPT = 'Return JSON only for the completed current Story using these exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, mind_monitor, choices, and warnings. The user payload includes canonical_actor_directory with exact registered {id,name} pairs and canonical_location_directory with exact registered {location_id,name} pairs. A pending_csa_operation is a bounded operation identity supplied by the server, not prose to reinterpret; extract only evidence present in the Story. Compliance with an institutional rule or treating it as normal is not evidence of affection, comfort, desire, arousal, attraction, excitement, trust, or liking toward the player. Any positive private-emotion claim requires independent Story/character evidence; neutral, conflicted, embarrassed, annoyed, uneasy, practical, or curious states remain valid when supported. For mind_monitor, use exact canonical actor IDs from that directory as object keys, never actor names, invented IDs, or player state; include only relevant current or post-Story NPCs materially present in the scene. For entered/exited items, actor_id must come from that directory and the exact contiguous quote must contain that actor\'s exact canonical name; a quote only about the player moving cannot establish an NPC transition. The location value must be either null or {"location_id":"<registered canonical id>","quote":"<exact contiguous quote from the current Story>"}. The location.location_id MUST come from canonical_location_directory. If the current Story explicitly says that the player enters, arrives at, moves to, or is now in a registered directory location, use that destination ID with an exact contiguous current-Story quote; this evidence overrides merely copying the previous location from current_context. Do not copy the previous location and do not return location_evidence or any other location key. Use only a registered canonical location id and an exact Story quote. The player literal action alone is intent/input, not successful movement evidence. Project elapsed_minutes, entered/exited actor evidence, scene_note, clothing_changes, the turn_summary, relevant Mind Monitor surface/subconscious, and warnings. scene_note is one bounded natural-language snapshot of the current post-Story scene, synthesized from the completed current Story/current scene; it is replacement state, not historical memory. Do not copy a previous scene_note merely because it existed in prior context, and do not retain ended source-location actions or entities unless the current Story explicitly re-establishes them. If the current Story does not ground a useful scene_note, return an empty string. The Story is the only choice authority: return choices as the exact four final numbered Story action strings in their original order, character-for-character. Preserve a literal backslash immediately before an ASCII double quote in a Story choice; the JSON string may need two backslashes to represent that one literal backslash. If the current Story does not contain exactly four distinct non-empty literal actions, return an empty choices array; never invent, mutate, pad, truncate, deduplicate, or use prior-turn choices. Never invent choices or unknown IDs. This is not a second narrative.';

const PLAYER_IDENTITY_PROMPT = 'The supplied canonical_player_identity and player_identity_contract are authoritative on every Story turn. The canonical player name, department, and formal position/rank are immutable Story facts unless an explicit future product mechanic changes the canonical profile; no such mechanic exists in this task. Never replace, normalize, downgrade, upgrade, or invent a formal department, rank, title, business-card identity, badge identity, introduction, signature, or address. Whenever Story chooses to mention one of those identity references, use the exact canonical labels from canonical_player_identity. Do not infer formal identity from scene context, NPC roles, department names, seniority stereotypes, or model inference. Observer and post-processing have no authority to mutate player identity.';
const STORY_RULE_CHANGE_CONTINUATION_PROMPT = 'For a rule_change_story_binding, S1 is closed-world: mandatory authority requires a positive semantic match to one of the finite supported_action_families; an unmatched or ambiguous action remains ordinary even when the literal says official, order, or instruct. The server-owned official announcement is already rendered before your continuation and is the single institutional issuance. Do not emit a second notice, pseudo-policy, code block, sender/recipient relabeling, or contradictory role assignment; continue only with grounded human reactions and scene consequences. Never narrate the private app screen opening, flashing, disappearing, activating, or acting as the cause of the rule, and never make an NPC aware of the app.';
const STORY_NPC_MOVEMENT_PROMPT = 'The player_agency_contract.npc_movement_boundary and player_movement_authority_contract are hard boundaries: voluntary PLAYER movement is authored only when the submitted literal explicitly chooses it; the submitted literal is the sole authority for voluntary PLAYER movement. NPC-only movement, NPC-to-NPC action, remote target location, stale scene context, or narrative convenience never authorizes PLAYER standing to go, following, walking, approaching, entering, knocking, accompanying, returning, teleport, or another voluntary bridge action. An external consequence may displace PLAYER only when the world physically causes it; it is not permission for Story-authored voluntary travel. Preserve the canonical player scene unless the literal explicitly binds player movement. A remote instruction must be delivered without moving PLAYER, while true explicit literal navigation remains supported.';
const STORY_PRODUCT_PROMPT = `${STORY_SYSTEM_PROMPT} ${STORY_NPC_MOVEMENT_PROMPT} ${PLAYER_IDENTITY_PROMPT} ${STORY_RULE_CHANGE_CONTINUATION_PROMPT} Four actions must differ in meaningful intent, not merely wording. When the scene supports it, distribute choices across conversation/social follow-up, movement or scene change, work/context action, and self-directed/non-work/refusal/change-of-mind/exploration; do not force an absurd category and do not turn every choice into CSA escalation. Write the final four numbered choice lines as plain text without Markdown emphasis, bullets, or code fences.`;
const OPENING_PRODUCT_PROMPT = `${OPENING_STORY_SYSTEM_PROMPT} ${PLAYER_IDENTITY_PROMPT} This first-arrival contract is binding for every selected profile: explicitly establish first day/first arrival/first appointment, preserve the selected department and rank including senior/executive status, and give a plausible immediate arrival or introduction context without prior tenure or relationships.`;
const OBSERVER_SCENE_PRESENCE_PROMPT = 'Scene fields are one post-Story snapshot, not a copy of the prior context. Before returning JSON, (1) treat current_context.scene.present_actor_ids and observer_scene_contract.prior_scene.present_actor_ids only as the prior-state baseline, (2) read the completed Story and enumerate every registered actor physically co-located in the player\'s canonical location at Story end, including a registered actor absent from the baseline who explicitly returns, enters, arrives, or is physically present and acts there, and (3) set present_actor_ids to that complete post-Story set. present_actor_ids is the exact set of registered actors physically co-located in that player scene at Story end. Never omit a returning actor merely because that actor was absent from the baseline, and never copy the baseline as the answer when the completed Story changes membership. location is the player\'s canonical location. Grounded entered/exited evidence must agree with present_actor_ids: a grounded exited actor is absent and a grounded entered actor is present. When the Story provides a suitable exact contiguous quote for a returning actor, emit grounded entered for that actor; if it does not, do not invent a quote merely for bookkeeping, but still include the actor when the Story explicitly grounds physical co-location. A remote or historical actor mention is not physical presence. scene_note must describe that same current player scene; it may mention a remote actor or event as history, but must not claim an actor left while present_actor_ids keeps that actor physically present. NPC-only movement never moves the player.';
const OBSERVER_PRODUCT_PROMPT = `${OBSERVER_SYSTEM_PROMPT.replace('exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, mind_monitor, choices, and warnings', 'exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, player_inner_thought, mind_monitor, choices, and warnings').replace('canonical_actor_directory with exact registered {id,name} pairs', 'canonical_actor_directory with bounded registered character canon')} ${OBSERVER_SCENE_PRESENCE_PROMPT} Add one player_inner_thought string: short, substantive, natural first-person Korean from the player\'s immediate perspective, grounded in literal_action, Story, current context, and profile. It must not invent an unchosen action, decision, consent, desire, relationship, or external outcome; Opening may express first-arrival uncertainty or curiosity but not a decision to use the unfamiliar app. For mind_monitor, use the bounded canonical role, personality, speech, and distinctive traits to write character-specific first-person Korean surface and subconscious thoughts; never use third-person analyst prose, one-word labels, or copied dialogue. Invalid one-NPC entries fail open locally. 0 elapsed minutes is only for an essentially instantaneous beat; ordinary conversation, walking, work, food, and meetings usually consume plausible positive minutes without a fixed constant.`;
const OBSERVER_PRESENTATION_PROMPT = 'For presentation-only media routing, also return focal_actor (null or {actor_id,quote}) and dialogue_lines (an array of {speaker_id,text,direction,evidence_quote}). Use only registered heroine IDs that are present after the Story; focal_actor.quote and each dialogue_lines.evidence_quote must be exact contiguous substrings of the current Story and contain the canonical actor name. Each dialogue_lines.text must be non-empty, copied verbatim from the current Story, and also occur inside its evidence_quote. Do not attribute anonymous quotes by proximity or guesswork. Drop unsupported, remote, player, narrator, thought, or non-verbatim projections; return focal_actor:null or omit invalid dialogue lines. These fields are presentation evidence only and must not describe or mutate gameplay state.';
const OBSERVER_DIALOGUE_COMPLETENESS_PROMPT = 'Completeness is mandatory for safely supported heroine speech: after enumerating the completed Story, if it contains one or more clearly attributable direct quoted speech lines by registered heroine IDs that are present after the Story and for which a single exact contiguous Story span contains both that heroine canonical name and the exact spoken text, you MUST return every such supported heroine line in dialogue_lines; dialogue_lines MUST NOT be [] in that case. Do not omit a supported heroine line because focal_actor is null, general NPCs speak more often, or presentation metadata is otherwise optional. For consecutive lines by the same explicitly named heroine where a later local sentence uses a pronoun, a larger exact contiguous evidence_quote may span back to the nearest explicit canonical heroine-name attribution, but never infer a speaker across an ambiguous speaker change. This completeness rule applies to registered heroines only; do not add general-NPC, player, narrator, thought, anonymous, or ambiguous lines.';
const OBSERVER_ACCEPTANCE_PROMPT = `${OBSERVER_PRODUCT_PROMPT.replace('exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, player_inner_thought, mind_monitor, choices, and warnings', 'exact top-level keys: elapsed_minutes, location, entered, exited, present_actor_ids, scene_note, clothing_changes, turn_summary, player_inner_thought, mind_monitor, choices, media_hint, and warnings')} ${OBSERVER_PRESENTATION_PROMPT} ${OBSERVER_DIALOGUE_COMPLETENESS_PROMPT} player_inner_thought is optional and must be empty unless literal_action explicitly establishes the player's thought, feeling, or intention; never invent a player mind from a physical action, NPC behavior, or general scene perspective. For presentation-only media routing, return media_hint as null or {actor_id,pool,quote,tags}; use a registered present heroine, an exact contiguous Story quote containing her canonical name, pool general or sex, and never use sex for refusal, stop, or non-sexual text. Invalid media_hint and mind_monitor entries must be returned as raw observer evidence and are dropped fail-open by the runtime. Do not let an omitted or invalid projection block Story commit.`;

function canonicalActorDirectory(content) {
  return canonicalActors(content, [...registeredActorIds(content)]);
}

function canonicalLocationDirectory(content) {
  return (content?.locations ?? []).map(({ location_id, name }) => ({ location_id, name }));
}

function observerCurrentState(state) {
  const currentState = state && typeof state === 'object' ? state : {};
  const currentScene = currentState.scene && typeof currentState.scene === 'object' ? currentState.scene : {};
  const { scene_note: _previousSceneNote, ...scene } = currentScene;
  return { ...currentState, scene };
}

function observerSceneContract(state) {
  const currentContext = observerCurrentState(state);
  return {
    prior_scene: {
      location_id: currentContext.scene?.location_id ?? null,
      present_actor_ids: Array.isArray(currentContext.scene?.present_actor_ids) ? [...currentContext.scene.present_actor_ids] : []
    },
    post_story_snapshot: 'Recompute the player\'s final co-located registered actors from the completed Story; prior_scene is a baseline only and is never the answer.'
  };
}

const STORY_PROMPT_EXTERNAL_OUTCOME_PRECEDENCE = 'For ordinary requests without an applicable rule-owned same-turn authority exception, player input is not automatic proof of external outcome or NPC compliance. When the exact active S1 subject/counterparty scope matches one of its finite supported action families, rule-owned institutional authority takes precedence over this ordinary boundary and the supported action must begin in this same Story turn.';

function withPromptContent(payload, promptContent = null) {
  if (!promptContent) return payload;
  return { ...payload, messages: [{ ...payload.messages[0], content: String(promptContent).replace('Player input is not automatic proof of external outcome or NPC compliance.', STORY_PROMPT_EXTERNAL_OUTCOME_PRECEDENCE) }, ...payload.messages.slice(1)] };
}

const deterministicChoices = Object.freeze([
  '주변의 상황을 차분히 살펴본다.', '가까운 누군가에게 인사한다.',
  '현재 장면을 다시 확인한다.', '원하는 행동을 직접 입력한다.'
]);

export function createDeterministicR3Provider() {
  return {
    async *story({ opening = false, literalAction = '' }) {
      if (opening) yield '첫 출근일의 아침, 회사 로비에서 안내 데스크와 사람들의 목소리가 서로 섞인다.\n\n';
      else yield `당신은 “${literalAction}”이라는 행동을 선택했다. 주변의 상황이 잠시 멈추고 다음 장면이 자연스럽게 이어진다.\n\n`;
      yield `현재 장면에는 아직 확정되지 않은 여백이 남아 있다.\n\n다음 행동\n1. ${deterministicChoices[0]}\n2. ${deterministicChoices[1]}\n3. ${deterministicChoices[2]}\n4. ${deterministicChoices[3]}`;
    },
    async observe({ storyText }) { return { elapsed_minutes: 3, choices: [...deterministicChoices], player_inner_thought: '', turn_summary: storyText.slice(0, 180), mind_monitor: {} }; }
  };
}

export function createR3Provider({ env, fetchImpl = fetch, timeouts: overrides = {} } = {}) {
  const baseUrl = env?.LLM_API_URL?.replace(/\/$/, ''); const apiKey = env?.LLM_API_KEY; const storyModel = env?.STORY_MODEL; const observerModel = env?.EXTRACT_MODEL; const timeouts = { ...R3_PROVIDER_TIMEOUTS, ...overrides };
  if (!baseUrl || !apiKey || !storyModel || !observerModel) throw new Error('r3_provider_configuration_invalid');
  const completionUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  async function request(payload, timeoutMs, code, { firstContentMs = null, promptContent = null, onResponseHeaders = null } = {}) {
    const controller = new AbortController(); let timedOut = null;
    const totalDeadline = Date.now() + timeoutMs;
    const totalTimer = setTimeout(() => { timedOut = timeoutError(code); controller.abort(timedOut); }, Math.max(0, totalDeadline - Date.now()));
    const firstDeadline = firstContentMs === null ? null : Date.now() + firstContentMs;
    const firstTimer = firstContentMs === null ? null : setTimeout(() => { timedOut = timeoutError('r3_story_first_content_timeout'); controller.abort(timedOut); }, firstContentMs);
    const cancelFirst = () => { if (firstTimer) clearTimeout(firstTimer); };
    const cancel = () => { clearTimeout(totalTimer); cancelFirst(); };
    try {
      const response = await fetchImpl(completionUrl, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(withPromptContent(payload, promptContent)), signal: controller.signal });
      if (!response.ok) throw new Error(`r3_provider_${response.status}`);
      onResponseHeaders?.();
      return { response, deadline: totalDeadline, firstDeadline, cancel, cancelFirst, abort: reason => controller.abort(reason), timedOut: () => timedOut };
    } catch (error) { cancel(); throw timedOut ?? error; }
  }

  return {
    async *story({ context, literalAction = '', opening = false, content, feedbackText = '', feedbackReferenceStory = '', csaOperation = null, ruleChangeEvent = null, ruleChangeBinding = null, onTiming = null }) {
      const handle = await request({ model: storyModel, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000, messages: [
        { role: 'system', content: STORY_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ opening, ...(feedbackReferenceStory ? { feedback_reference_story: String(feedbackReferenceStory).slice(0, 4000) } : {}), ...buildStoryContext(context, literalAction, { content, opening, feedbackText, csaOperation, ruleChangeEvent, ruleChangeBinding }) }) }
      ] }, timeouts.storyTotalMs, 'r3_story_timeout', { firstContentMs: timeouts.storyFirstContentMs, promptContent: opening && !literalAction ? OPENING_PRODUCT_PROMPT : STORY_PRODUCT_PROMPT, onResponseHeaders: () => onTiming?.('story_response_headers') });
      try { yield* readOpenAiStream(handle.response, { firstDeadline: handle.firstDeadline, totalDeadline: handle.deadline, cancelFirst: handle.cancelFirst, abort: handle.abort, onFirstDelta: () => onTiming?.('story_first_delta') }); }
      catch (error) { throw handle.timedOut() ?? error; }
      finally { handle.cancel(); }
    },
    async observe({ context, literalAction, storyText, content, csaOperation = null }) {
      let handle = null;
      try {
        const currentContext = observerCurrentState(context?.state?.state);
        handle = await request({ model: observerModel, stream: false, thinking: { type: 'disabled' }, temperature: 0, max_tokens: 2400, response_format: { type: 'json_object' }, messages: [
          { role: 'system', content: OBSERVER_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({ literal_action: literalAction, ...(csaOperation ? { pending_csa_operation: csaOperation } : {}), story_text: storyText, current_context: currentContext, observer_scene_contract: observerSceneContract(context?.state?.state), canonical_actor_directory: canonicalActorDirectory(content), canonical_location_directory: canonicalLocationDirectory(content) }) }
        ] }, timeouts.observerMs, 'r3_observer_timeout', { promptContent: OBSERVER_ACCEPTANCE_PROMPT });
        let payload;
        try { payload = await handle.response.json(); }
        catch { throw observerFailureError('r3_observer_response_json_invalid'); }
        const raw = payload?.choices?.[0]?.message?.content;
        if (typeof raw !== 'string') throw observerFailureError('r3_observer_message_missing');
        try { return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')); }
        catch {
          throw observerFailureError('r3_observer_json_invalid', {
            observerFinishClass: sanitizeObserverFinishClass(payload?.choices?.[0]?.finish_reason),
            observerCompletionTokens: boundedCompletionTokens(payload?.usage?.completion_tokens)
          });
        }
      } catch (error) {
        throw observerFailureError(sanitizeObserverFailure(error), {
          observerFinishClass: error?.observerFinishClass,
          observerCompletionTokens: error?.observerCompletionTokens
        });
      } finally { handle?.cancel(); }
    }
  };
}

export function sanitizeObserverFailure(error) {
  const code = String(error?.code ?? error?.message ?? '');
  if (R3_OBSERVER_FAILURE_CODES.includes(code)) return code;
  if (code === 'r3_observer_missing') return 'r3_observer_message_missing';
  if (/^r3_provider_\d{3}$/.test(code)) return 'r3_observer_provider_http';
  return 'r3_observer_unknown';
}

export function sanitizeObserverFailureEvidence(error) {
  if (sanitizeObserverFailure(error) !== 'r3_observer_json_invalid') return {};
  const finishClass = R3_OBSERVER_FINISH_CLASSES.has(error?.observerFinishClass) ? error.observerFinishClass : 'unknown';
  const evidence = { observer_finish_warning: `r3_observer_finish_${finishClass}` };
  if (Number.isSafeInteger(error?.observerCompletionTokens) && error.observerCompletionTokens >= 0 && error.observerCompletionTokens <= 1_000_000) {
    evidence.observer_completion_tokens = error.observerCompletionTokens;
  }
  return evidence;
}

function sanitizeObserverFinishClass(value) {
  if (value === 'length' || value === 'stop') return value;
  if (typeof value === 'string' && value.trim()) return 'other';
  return 'unknown';
}

function boundedCompletionTokens(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000 ? value : null;
}

function observerFailureError(code, details = {}) {
  const error = new Error(code); error.code = code;
  if (code === 'r3_observer_json_invalid') {
    error.observerFinishClass = R3_OBSERVER_FINISH_CLASSES.has(details.observerFinishClass) ? details.observerFinishClass : 'unknown';
    error.observerCompletionTokens = details.observerCompletionTokens;
  }
  return error;
}

function timeoutError(code) { const error = new Error(code); error.code = code; return error; }
function timeoutPromise(ms, code, onTimeout) { let timer; const promise = new Promise((_, reject) => { timer = setTimeout(() => { onTimeout?.(); reject(timeoutError(code)); }, Math.max(0, ms)); }); return { promise, cancel: () => clearTimeout(timer) }; }

async function* readOpenAiStream(response, { firstDeadline, totalDeadline, cancelFirst, abort, onFirstDelta = null } = {}) {
  if (!response.body) throw new Error('r3_story_empty_stream');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let received = false; let firstExpired = false; let totalExpired = false;
  const cancelReader = reason => { try { const pending = reader.cancel(reason); pending?.catch?.(() => {}); } catch {} };
  const first = timeoutPromise(Math.max(0, (firstDeadline ?? Date.now()) - Date.now()), 'r3_story_first_content_timeout', () => { firstExpired = true; abort?.('r3_story_first_content_timeout'); cancelReader('r3_story_first_content_timeout'); });
  const total = timeoutPromise(Math.max(0, (totalDeadline ?? Date.now()) - Date.now()), 'r3_story_timeout', () => { totalExpired = true; abort?.('r3_story_timeout'); cancelReader('r3_story_timeout'); });
  try {
    while (true) {
      const result = await Promise.race([reader.read(), first.promise, total.promise]); if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
      for (const line of lines) { if (!line.startsWith('data:')) continue; const data = line.slice(5).trim(); if (data === '[DONE]') continue; const payload = JSON.parse(data); const delta = payload?.choices?.[0]?.delta?.content; if (typeof delta === 'string' && delta) { if (!received) onFirstDelta?.(); received = true; first.cancel(); cancelFirst?.(); yield delta; } }
    }
  } catch (error) { if (totalExpired) throw timeoutError('r3_story_timeout'); if (firstExpired && !received) throw timeoutError('r3_story_first_content_timeout'); throw error; }
  finally { first.cancel(); total.cancel(); }
  if (totalExpired) throw timeoutError('r3_story_timeout'); if (firstExpired && !received) throw timeoutError('r3_story_first_content_timeout'); if (!received) throw new Error('r3_story_no_content');
}

# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: GENERIC PLAYER AGENCY CONTRACT -> ONE SELF-STATE REPLAY -> REMAINING D3 -> ORTHOGONAL LIVE QA
Updated: 2026-08-22 20:52 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 0. Binding authority

Continue the same Task ID under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`;
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`;
- Issue #68 owner UX/CSA directives;
- operator review `5380176275`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Provider/model/config remain frozen. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden while any objective blocker remains.

## 1. Reviewed terminal / accepted and frozen evidence

Reviewed terminal:
- terminal `5380111237`;
- prior CURRENT_TASK blob `aa53e96ce0f0c0bc817fa9fe94c8434c87453e4b`;
- start main `84785d5eefe86f048200a560d0be7a628b090ca1`;
- accepted/current executable main `4836f5915977a0a65c0c0859198a1abba3e6f644`;
- operator review `5380176275`.

Current TEST identities:
- API `game-proxy-company-r3` Worker `9cede09a-0e2a-4e8e-8022-d099a70bab01`;
- frontend `gamebuilder-company-r3` Worker `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

### 1.1 Frontend submit/SSE lifecycle — GREEN and frozen

Accepted source `1202b19c...` closed the enabled-control submit no-op race. One enabled browser click now yields exactly one `/turn`, exact literal, and one committed turn. Do not reopen without new evidence.

### 1.2 Canonical location identity + D1 four-location chain — GREEN and frozen

Accepted source `d8748bc...` supplies Observer with canonical `content.locations` exact `{location_id,name}` identity.

Accepted game `80b6c133-41df-4c60-8581-32de18defe7d` proved four distinct locations:
1. `브랜드전략팀 회의실로 이동한다.` -> `brand_strategy_meeting_room`;
2. `브랜드전략팀 사무실로 돌아간다.` -> `brand_strategy_office`;
3. `1층 로비로 이동한다.` -> `lobby`;
4. `엘리베이터 홀로 이동한다.` -> `elevator_hall`.

For all four:
`Story exact destination -> observer_raw -> observer_applied -> state_after -> refresh/context/map` parity passed.

Do not rerun D1 for pass seeking.

### 1.3 scene_note replacement + exercised D2 presence/MM — GREEN and frozen

Accepted source `4836f591...` changed only:
- `runtime-r3/server/provider.js`;
- `runtime-r3/domain/reducer.js`;
- `test/r3-opening-contract.test.mjs`;
- `test/r3-source-correction.test.mjs`.

Accepted validation:
- focused R3 29/29 PASS;
- full 480/480 PASS;
- `node --check` + `git diff --check` PASS;
- TEST API deployed exactly once as `9cede09a-0e2a-4e8e-8022-d099a70bab01`;
- frontend unchanged.

Fresh Phase-C game `a99298cb-955e-4a28-be73-0ca38a8479ff`:
- `브랜드전략팀 회의실로 이동한다.` -> meeting room, fresh scene_note, refresh parity;
- `1층 로비로 이동한다.` -> lobby, fresh scene_note, refresh parity;
- previous `scene_note` is omitted from Observer pre-turn state projection;
- current observation replaces prior note; missing/empty note clears rather than carries stale state.

Fresh D2 game `3b21d934-024e-412a-9781-b7371563a6a5` additionally proved on the exercised path:
- movement-only transitions did not leave the prior source cast as final presence;
- current/grounded registered actors received MM;
- no unknown MM actor keys were accepted;
- committed scene/scene_note matched refresh.

Freeze these accepted boundaries unless new contradictory evidence appears.

### 1.4 CSA capability evidence remains frozen

Do not rerun accepted/known fixtures for pass seeking:
- GREEN: no-panties, no-bra, hand/contact, work-nude, work-in-underwear-only, masturbate-for-recipient, `player_request_executes_immediately`;
- `vaginal_sex_with_recipient` remains frozen `BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_CANONICAL_REQUEST_RULE`;
- `continue_until_recipient_orgasm` recipient/subject mismatch remains same provider-capability-family evidence;
- request timing source/prompt boundary is frozen; no further CSA prompt/context/provider/model tuning.

Known CSA provider capability blockers still prevent objective all-green acceptance but do not hide orthogonal local QA.

## 2. Current decisive blocker — D3 player self-state agency

Fresh disposable game:
`41d79782-4377-42e1-8ec2-5084d1b16a98`.

Exact literal submitted once through the real browser:
`혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`

Accepted terminal facts:
- one browser submission;
- exactly one `/turn` POST;
- HTTP 200;
- stored literal matched exact codepoints;
- one committed turn;
- location/Observer/scene_note/refresh path itself remained coherent;
- Story nevertheless introduced `이메이` and `한리브` approaching/speaking to the player and proposing lunch in the same Story turn.

Classification:
`BLOCKED_R3_D3_LITERAL_SELF_STATE_AGENCY`.

This violates the owner-locked player-agency invariant. The player explicitly chose an alone/self-reflective state and Story silently contradicted that choice. It is a Story semantic agency defect, not transport, location, Observer, reducer, DB, or frontend failure.

## 3. Existing source gap and architecture decision

Current Story system contract already says:
`preserve the submitted literal player action exactly and narrate its consequences without replacing it`.

That generic prose is insufficiently explicit about the semantic dimensions that must not be rewritten.

Owner-locked invariant is broader and fixed:
Story must not silently substitute or contradict explicit player:
- actor;
- target;
- action;
- movement/destination;
- request;
- refusal;
- self-state;
- topic;
- intent.

The next correction is **one fixed generic player-agency contract**, not a literal parser or semantic runtime authority.

## 4. PHASE A — bounded generic player-agency contract

### A1. Add static machine-readable Story context contract

Add one small fixed contract to the normal Story context, preferably in the existing `buildStoryContext()` projection, e.g. `player_agency_contract` or equivalently explicit bounded field.

The contract must be static metadata, not computed by analyzing `literal_action`.

It must express at minimum:
- `literal_action_is_player_choice = true`;
- preserve explicit dimensions: actor, target, action, movement/destination, request, refusal, self-state, topic, intent;
- Story may narrate consequences/reactions but must not replace, invert, redirect, or contradict those explicit dimensions;
- an explicit player self-state must remain true for the chosen action/scene beat; Story must not inject NPC interaction that makes that chosen self-state impossible during the beat unless the literal itself permits such interaction;
- world/NPC consequences remain free after/around the chosen beat so long as they do not rewrite the player's choice;
- player input is not automatic proof of every external outcome or NPC compliance.

Do not build a parsed per-turn list of recognized dimensions. The same fixed object must be supplied regardless of literal contents.

### A2. Bind Story system contract to the static agency contract

Update the existing Story system prompt minimally so the supplied `player_agency_contract` is a hard boundary.

Required generic semantics:
- preserve the literal player's chosen actor/target/action/movement/request/refusal/self-state/topic/intent when explicitly present;
- narrate consequences without silently swapping to another actor, target, action, topic, destination, or opposite decision;
- do not turn an explicit refusal into acceptance;
- do not turn an explicit alone/self-state into unsolicited same-beat NPC approach/dialogue that contradicts it;
- do not replace an explicit physical action with a different object/action merely to avoid narrating the chosen action;
- do not guarantee external success where the literal expresses only an attempt/request and no active canonical rule requires success.

This must stay rule-generic and action-generic.

### A3. Explicitly forbidden

No:
- keyword handling for `혼자` or any other literal;
- NER or entity extraction from player input;
- actor/target/action/topic/refusal/self-state parser;
- fuzzy/nearest matching;
- semantic classifier/router/gate/verifier;
- deterministic player-action executor;
- deterministic prose rewrite/fallback;
- location-specific, actor-specific, action-specific or fixture-specific branches;
- second Story/Observer LLM;
- Story retry/regeneration/resample;
- provider/model/temperature/token/timeout/config changes;
- Observer/reducer/DB/schema/migration/frontend changes unless an independently proven source dependency makes one strictly necessary; stop for review instead of broadening if so;
- CSA semantic/timing changes;
- Production access.

## 5. Required deterministic tests

Add focused source regressions proving at minimum:
1. ordinary Story context contains exactly one fixed `player_agency_contract`.
2. The fixed contract explicitly covers actor, target, action, movement/destination, request, refusal, self-state, topic, and intent.
3. The contract says consequences are allowed but substitution/inversion/contradiction of explicit player choice is not.
4. The contract distinguishes preserving player choice from guaranteeing external-world/NPC success.
5. The same agency contract is emitted for materially different literal strings; no literal-dependent parsing/classification occurs.
6. Story system prompt binds to the supplied agency contract as a hard boundary.
7. Existing opening agency rules remain intact and Opening still authors no voluntary player action before input.
8. Existing CSA request timing, location-directory, scene_note, choice-authority, literal-action, presence/MM and frontend transport tests remain green.
9. No semantic parser/classifier/gate, keyword list, location/actor/action-specific branch, retry, second LLM or deterministic executor is introduced.

Validation before deploy:
- relevant focused R3 Story/context/provider tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- `git diff --check`;
- changed-path review proving bounded Story-context/provider/test scope only.

Land source directly on `main`; no branch/PR.

## 6. PHASE B — TEST API rollout only

After validation:
- deploy TEST API exactly once if source changed;
- record exact Worker Version ID;
- keep frontend exactly `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c` if unchanged;
- no migration;
- `/api/r3/catalogs` HTTP 200 gate;
- no Production.

## 7. PHASE C — exactly one fresh self-state acceptance replay

Do not reuse or mutate `41d79782-4377-42e1-8ec2-5084d1b16a98`.

Use ONE new disposable current-R3 TEST game through the real browser.

1. Setup once.
2. Opening once; wait until committed/actionable.
3. Enter exactly:
   `혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`
4. Click `행동 실행` exactly once.
5. Require exactly one `/turn` POST, exact stored literal parity, and exactly one committed turn.
6. Capture raw Story, Observer raw/applied, state_after, scene_note, presence, choices, warnings, revision/turn and refresh context.
7. Story acceptance requirement:
   - the player actually performs the chosen alone/self-reflective scene beat;
   - Story does not introduce an NPC approach/dialogue/interruption that contradicts `혼자` during that beat;
   - Story does not substitute a different player action/topic/intent;
   - later consequences are allowed only if they do not erase/rewrite the chosen beat.
8. No retry/resubmit/resample.

If the one replay still contradicts the explicit self-state despite the fixed generic agency contract:
STOP exactly:
`BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_GENERIC_PLAYER_AGENCY_CONTRACT`

Preserve the fixture and capture Story/context contract/literal/state. Do not make a second prompt/context edit, second sample, provider/model change, semantic validator or deterministic repair in this task.

If GREEN, freeze self-state evidence and continue automatically.

## 8. PHASE D — remaining D3 one-shot agency probes

Use separate fresh disposable fixtures where practical. Each required probe is one-shot: one exact literal, one browser submission, no retry/sample-until-pass.

### D3-A actor + topic
Exact literal:
`한리브 대리와 점심 메뉴에 대해 가볍게 이야기한다.`

Require Story to preserve:
- target/person = 한리브;
- topic = 점심 메뉴;
- action = light conversation.

Must not silently become 김제나, another NPC, work/brand discussion, or unrelated task.

### D3-B action + target
Exact literal:
`서원희 차장의 허리를 만진다.`

Judge player-agency semantics only. Require Story not to substitute a table/desk edge, different object, different target, or different player action. Do not add any deterministic success state or consent/physical ontology for this probe.

### D3-C movement/destination
Exact literal:
`엘리베이터 홀로 이동한다.`

Require Story exact canonical destination evidence and existing Observer/state location parity. No generic-room substitution.

### D3-D refusal
Exact literal:
`오늘 점심은 같이 가지 않겠다고 한리브 대리에게 말한다.`

Require Story preserve the refusal/negative decision and target. It must not silently convert the player into agreeing to go to lunch.

For every probe:
- exact stored literal;
- one POST / one committed turn;
- Story semantic fidelity;
- relevant Observer/state/refresh parity;
- no retry.

After the generic agency contract is present, the first deterministic substitution on any remaining dimension is terminal. Do not add a second semantic workaround in this task. Classify the exact violated dimension and preserve evidence.

If all remaining D3 probes are GREEN, continue automatically.

## 9. PHASE E — independent human-like campaigns

Do not combine these into one fixture. Use independent fresh ordinary non-CSA games.

### E1. Ordinary 30+
At least 30 committed ordinary turns.
Mix:
- free text and current Story choices;
- social interaction;
- mundane office/background actions;
- movement;
- requests;
- refusals;
- changes of mind;
- quiet/self-directed actions;
- character-specific interaction.

### E2. Materially different 15+
At least 15 committed turns with materially different phrasing/style/route from E1.

### E3. Long-memory 50+
At least 50 committed turns in a separate fixture.
Establish distinctive early facts/promises and later reference them after recent raw-window rollover.

Per turn collect:
- literal parity;
- Story actor/target/action/topic/intent fidelity;
- location/presence;
- scene_note;
- choice status;
- MM actor IDs;
- warnings;
- revision/committed_turn;
- key timing data.

Long-memory specifically inspect:
- older summaries chronological ordering;
- useful preservation of distinctive older facts;
- next-Story use of older summaries after recent raw turns roll over;
- absence of stale Opening/current-scene contamination.

STOP on first NEW deterministic locally actionable defect. Provider-level isolated capability misses must be reported precisely; do not tune/sample until pass.

## 10. PHASE F — choice reliability

Across independent campaigns measure:
- Story exact-four valid terminal-tail count/rate;
- no-tail count/rate;
- maximum consecutive no-tail streak;
- Observer exact-copy count;
- Observer mismatch count;
- fabricated/prior fallback MUST remain 0;
- displayed choice click submits the complete displayed Story literal exactly once.

Rules remain:
- Story is sole current-choice authority;
- Observer cannot replace/reorder/veto a valid Story tail;
- no valid Story tail -> choices empty;
- `choices_observer_mismatch` alone is diagnostic when valid Story choices survive.

STOP for deterministic local choice-authority regression.

## 11. PHASE G — latency / lifecycle / reconnect / retained surfaces

Capture where available:
- submit;
- provider/request start;
- first Story token;
- Story complete;
- Observer start/complete;
- commit/readback.

Report p50/p95 for collected ordinary-turn samples. Do not tune provider/model/config from latency.

Also verify through disposable TEST fixtures / natural failures where available:
- duplicate submit/idempotence;
- explicit failed Retry remains user-only and same-row semantics;
- no hidden Story regeneration;
- normal flow remains Story once -> Observer once -> atomic commit;
- refresh/reconnect retains game/save/turn/state and does not auto-resubmit;
- history order and literal/story canonical parity;
- export/download if retained;
- TTS/feedback remain presentation-only and do not duplicate gameplay submission;
- desktop;
- 390x844;
- wider mobile/tablet;
- Story streaming remains visible with no blocking full-screen loading overlay;
- free input remains usable when choices are absent.

STOP on first NEW deterministic local lifecycle/UI/state defect.

## 12. Stop rules / terminal semantics

STOP immediately on:
- self-state replay failure after the explicit generic agency contract;
- first new deterministic D3 agency substitution;
- first new deterministic local defect in E/F/G.

Never:
- retry/sample until pass;
- reuse/mutate preserved evidence/manual games;
- use direct API gameplay as a substitute for browser acceptance;
- parse literal text into deterministic semantic success;
- add NER/fuzzy/nearest/semantic matching or semantic gates/classifiers;
- add deterministic player-action or physical/consent executors;
- add second Story/Observer LLM;
- regenerate/replay Story automatically;
- change provider/model/temperature/token/timeout/config;
- reopen frozen CSA request prompt/context;
- access Production;
- create another CURRENT_TASK file, ops branch, or recovery branch;
- generate owner handoff while objective blockers remain.

If all orthogonal local QA completes with no new local defect, terminal remains BLOCKED because frozen provider capability blockers still prevent objective all-green. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden.

## 13. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and during long campaigns.

Terminal report must include:
- Task ID + CURRENT_TASK blob + START/FINAL SHA;
- exact changed paths/tests;
- fixed `player_agency_contract` shape and proof it is static/non-parsing;
- TEST API version and proof frontend remained unchanged;
- self-state replay game ID, exact literal, raw Story and semantic judgement;
- remaining D3 probe game IDs/literals/results if reached;
- D2 frozen status and any contradictory evidence if found;
- E1/E2/E3 committed-turn counts if reached;
- choice metrics if reached;
- latency p50/p95 if reached;
- reconnect/history/export/TTS/feedback/mobile results if reached;
- warnings;
- first NEW blocker or final known-provider-blocker-only state;
- explicit confirmation of no retry-until-pass, literal semantic parser, semantic gate, deterministic executor, provider/model/config change, Production access, preserved-game mutation, new CURRENT_TASK file/branch, or owner handoff.

Continue autonomously until the first NEW deterministic blocker or all orthogonal QA is exhausted.
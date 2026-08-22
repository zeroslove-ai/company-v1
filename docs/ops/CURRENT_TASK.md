# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: FRONTEND SSE TERMINAL LIFECYCLE CLOSURE -> ONE CLEAN FIRST-TURN REPLAY -> RESUME ORTHOGONAL LIVE QA
Updated: 2026-08-22 19:49 KST
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
- operator review `5379846236`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Provider/model/config remain frozen. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden while the known provider capability blocker is open and the objective matrix is incomplete.

## 1. Reviewed terminal / frozen evidence

Reviewed terminal:
- terminal `5379835717`;
- previous task blob `bade6cfd51d7819ee20b91e092e26310ea04012b`;
- start/final main `278737297949a5e837b73ea3ff899f1a5ad3dd36`;
- operator review `5379846236`.

Current TEST identities before this task:
- API `game-proxy-company-r3` Worker `e76b936c-f28a-4ec9-aec3-e7968587e9cc`;
- frontend `gamebuilder-company-r3` Worker `c297425c-3fa8-4025-a514-5ac908606c36`.

Freeze and do not rerun for pass seeking:
- accepted CSA campaigns: no-panties, no-bra, contact/hand placement, work-nude, work-in-underwear-only, masturbate-for-recipient;
- `player_request_executes_immediately` fixture `564312c2-eff5-4686-a8bd-67a8e8eae2b8` is GREEN through apply/request/remove/post-remove;
- known `vaginal_sex_with_recipient` provider/model capability blocker remains `BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_CANONICAL_REQUEST_RULE`;
- `continue_until_recipient_orgasm` fixture `71a57139-e322-4f89-92de-0dc6ef875923` kept engine/state continuity coherent but Story mismatched recipient/subject; retain as the same provider-capability family, not a local transaction defect;
- request-timing source `e646fb9664878b81020e4fedaa5e587149b82851` remains frozen. No further prompt/context/provider/model tuning.

## 2. Current decisive local blocker

Fresh clean ordinary fixture, no CSA mutation:
`b0443068-8b78-455d-ada6-f8f30a69df7f`.

Observed once, no retry:
- Opening visibly rendered at Turn 0;
- free-input field usable;
- exact literal entered: `브랜드전략팀 회의실로 이동한다.`;
- exactly one enabled `행동 실행` button was resolved and clicked once;
- after 45 seconds, UI still showed Turn 0 and the literal still in the textbox;
- no Story append;
- read-only context remained revision=0 / committed_turn=0 / Opening-only / job=null;
- no player action persisted;
- console error/warning empty.

Classification:
`BLOCKED_R3_ORTHOGONAL_MOVEMENT_SUBMIT_NOOP_WITH_ENABLED_CONTROL`.

This is not a movement-semantic failure because `/turn` was never sent.

## 3. Proven frontend lifecycle cause

Current `frontend-r3/app.js`:
- `openOpening()` sets `state.busy=true`;
- a committed terminal event immediately calls `renderContext(data.context)`, making committed Turn 0 visible;
- `state.busy=false` is only set after `consumeR3Sse()` returns in `finally`;
- free submit control is not synchronized to `state.busy`;
- `submit()` begins with a silent `if (state.busy || !state.gameId) return`.

Current `frontend-r3/r3-client.js`:
- `consumeR3Sse()` records a valid `terminal` event;
- but it continues `reader.read()` until response-body EOF before returning.

Therefore a valid committed terminal can already be rendered while the operation is still client-busy waiting for EOF. During that interval the UI can expose an enabled submit button whose click is silently discarded by the busy guard. The live fixture matches this boundary exactly.

## 4. PHASE A — minimal generic frontend correction

Correct only this generic client lifecycle/control boundary.

Required invariants:
1. A valid terminal SSE frame is the protocol completion boundary for the current Opening/Turn operation. The client must not remain indefinitely busy solely waiting for later network EOF after a valid terminal has already been received.
2. Preserve terminal validation: terminal must still be valid `committed`/`failed`; missing terminal remains reconnect failure. Do not invent another protocol or hidden retry.
3. Free-input submit readiness must truthfully reflect whether submit would be accepted. A visible enabled `행동 실행` control must not intentionally fall through the silent `state.busy` return path.
4. A click while legitimately busy must not be queued, replayed, or automatically resubmitted later.
5. Literal input must remain intact until an actual submitted turn succeeds or existing explicit recovery semantics say otherwise.
6. Preserve choice buttons' current busy behavior, explicit Retry, transport reconciliation, CSA UI, setup/opening, reload/reconnect, history and TTS boundaries.
7. No automatic Story replay/regeneration and no duplicate `/turn` POST.

Preferred smallest implementation shape:
- make `consumeR3Sse()` complete/cancel the reader once a valid terminal frame has been fully handled, rather than waiting for EOF;
- centralize/synchronize `submit-action.disabled` (and only other directly relevant free-input readiness if necessary) with `state.busy`, failed-job state, and game readiness so rendered control state matches the submit guard.

Do not broaden beyond evidence if a smaller equivalent implementation is cleaner.

Forbidden:
- API/runtime/Observer/reducer/CSA semantic changes;
- DB/schema/migration changes;
- provider/model/temperature/token/timeout/config changes;
- semantic gate/classifier/NER/fuzzy matching;
- deterministic movement resolver as a response to this no-request defect;
- click queue, automatic replay/resubmit, second Story call, hidden retry;
- Production access.

## 5. Required deterministic tests

Add focused frontend/client regressions proving at minimum:
1. SSE with a valid terminal frame followed by a reader that never reaches EOF resolves at terminal and does not hang waiting for EOF.
2. Terminal event is delivered exactly once to the application handler before completion.
3. A stream that ends without terminal remains `r3_stream_reconnect_required`.
4. Invalid/failed terminal semantics remain handled according to existing contract.
5. During true busy state, free submit is disabled or otherwise visibly non-actionable; after terminal completion it becomes actionable.
6. No enabled-control path can be deterministically swallowed only by the initial `state.busy` guard.
7. Literal preservation and existing `turn-transport.js` reconciliation tests remain green.
8. Explicit failed Retry remains explicit and user-triggered.
9. No automatic duplicate POST/replay is introduced.

Validation:
- focused frontend/R3 tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- `git diff --check`;
- changed-path review proving frontend-only scope unless an independently required test helper changes.

Land source directly on `main`; no branch/PR.

## 6. PHASE B — TEST frontend rollout only

After tests are green:
- deploy TEST frontend exactly once from the accepted source commit;
- record exact Worker Version ID;
- do not redeploy API;
- do not apply migrations;
- confirm frontend source assets and `/api/r3/catalogs` health;
- Production forbidden.

## 7. PHASE C — exactly one fresh clean first-turn replay

Do not reuse `b0443068...`.

Use one new disposable current-R3 TEST game through the real browser UI.

1. Fresh Setup once.
2. Opening once.
3. As soon as committed Turn 0 is visibly ready, verify `행동 실행` readiness is truthful.
4. Enter exactly: `브랜드전략팀 회의실로 이동한다.`
5. Click `행동 실행` exactly once.
6. Capture DOM/control state and network.
7. Require exactly one `/turn` request.
8. Require exact stored literal parity.
9. Require one committed Turn 1 and coherent revision/committed_turn.
10. Capture Story/Observer/state/location/presence/choices/MM/warnings, but movement semantics are judged only after submission transport is proven.
11. No retry/resubmit if the first click fails.

If no `/turn` is sent again despite an enabled control:
STOP `BLOCKED_R3_FRONTEND_SUBMIT_NOOP_AFTER_SSE_TERMINAL_CLOSURE`.

If transport submits once but a distinct local movement/location/presence defect appears, STOP on that new concrete blocker.

If GREEN, continue automatically.

## 8. PHASE D — resume orthogonal objective matrix

Resume from the location phase; do not rerun accepted CSA capability fixtures.

### D1. Four canonical locations
Fresh ordinary non-CSA fixture if needed. Prove four distinct registered locations through:
`literal -> Story exact canonical destination -> observer_raw -> observer_applied -> state_after -> refresh/context -> next Story`.
No fuzzy/generic destination upgrade.

### D2. Presence / MM / scene_note
Prove exact registered actor evidence, no movement-only NPC teleport, correct MM actor IDs, no off-scene MM, no wrong-person quotes, and stale scene_note cleanup.

### D3. Player agency
One-shot probes:
- 한리브/lunch must not become 김제나/work;
- `혼자 있고 싶다` respected;
- `허리를 만진다` not substituted with table/desk edge;
- explicit movement/destination preserved;
- explicit refusal not silently inverted.

Stop on first NEW deterministic locally actionable defect.

### D4. Independent human-like campaigns
Separate fresh fixtures:
- ordinary 30+ committed turns;
- materially different 15+;
- long-memory 50+.

Collect literal parity, Story fidelity, location/presence, choices, MM IDs, warnings, revision/turn and timing. Inspect older-summary continuity after the recent raw-turn window rolls over.

### D5. Choice reliability / latency / retained surfaces
Measure exact-four Story-tail rate, no-tail rate/streak, Observer exact/mismatch, zero fabricated/prior fallback, click literal parity, lifecycle timing p50/p95 where useful, duplicate-submit/idempotence, explicit failed Retry, reload/reconnect, history/export/download, TTS/feedback if retained, desktop 390x844 and wider mobile/tablet.

Known provider CSA capability failures remain recorded and skipped; they do not authorize prompt/model tuning and still prevent all-green acceptance.

## 9. Stop rules

STOP immediately on the first NEW deterministic local defect after the replay correction.

Never:
- sample/retry until pass;
- mutate preserved evidence/manual games;
- use direct API gameplay instead of browser acceptance;
- change provider/model/config/timeouts;
- add semantic validators, fuzzy matching, physical/consent DSL, deterministic behavior executor, or second LLM;
- auto-regenerate/replay Story;
- access Production;
- create another CURRENT_TASK file/branch.

If all orthogonal local QA completes with no new local defect, terminal status is still BLOCKED because the frozen provider capability blocker prevents objective all-green. `OWNER_READY` remains forbidden.

## 10. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and during long campaigns.

Terminal report must include:
- Task ID + CURRENT_TASK blob + start/final SHA;
- exact changed paths/tests;
- TEST frontend version and proof API remained unchanged;
- fresh replay game ID and exact literal;
- submit control readiness before click;
- `/turn` request count and exact literal persistence;
- revision/committed_turn and Story/Observer/state evidence;
- subsequent orthogonal matrix progress and first new blocker if any;
- confirmation of no provider/model/config change, retry-until-pass, Production access, preserved-game mutation, new task file/branch, or owner handoff.

Continue autonomously until the first NEW deterministic local blocker or all orthogonal QA is exhausted.
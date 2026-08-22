# Company — CURRENT TASK

Status: READY
Task ID: company-r3-same-game-reset-source-v1
Mode: IMPLEMENT CAPABILITY-PROTECTED SAME-GAME RESET -> FOCUSED TESTS -> STOP BEFORE APPLY/DEPLOY
Updated: 2026-08-23 01:31 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, reset framework, compatibility layer, or competing execution authority.

## 0. Authority / frozen baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- capability TEST terminal `5381363356` and operator freeze `5381387742`;
- image-sidecar audit terminal `5381425374` and operator review `5381439776`;
- accepted secured executable source `b511b35c3e294f77ecdffdcc2ad870c446a10e7b`;
- current TEST API `game-proxy-company-r3` version `52439f14-235f-4c1d-ac24-1ca30abc5e95`;
- current TEST frontend `gamebuilder-company-r3` version `50387103-1a97-4774-ac42-4368844cde58`;
- this exact CURRENT_TASK blob after registration.

Frozen areas:
- per-game capability boundary remains GREEN/frozen;
- feedback revision remains GREEN/frozen;
- image sidecar is deferred until verified approved media input exists; do not touch it here;
- CSA rules 7/9 remain frozen provider/model capability exceptions;
- Story/Observer/reducer/provider/model/config/timeouts remain behaviorally unchanged except reusing the existing Opening path after reset.

## 1. Proven user-visible gap

Current R3 frontend visibly includes `#reset-game`, but current controller does not wire a reset action and the current secured Worker/store expose no reset route/store operation.

This is a dead user-visible control. Fix only this gap.

Required product behavior:
- reset the current game while keeping the same `game_id`;
- preserve the existing player profile/setup and the same per-game bearer capability;
- clear prior gameplay chronology/state side effects back to canonical initial game state;
- immediately start a fresh Opening through the existing normal Opening Story -> Observer -> reducer -> commit path;
- after reset, the user should see a fresh Opening without being sent back through player setup.

Do not create a new game, new token, account/session system, or alternate Opening implementation.

## 2. Required reset semantics

The reset boundary must be explicit and narrow.

### Preserve
- `game_id`;
- player profile/setup stored for that game;
- content version / game identity fields required by current R3;
- existing browser capability token because it is bound to the unchanged game_id;
- capability security boundary itself.

### Clear/reset atomically before fresh Opening
At minimum, all current-game chronology and gameplay projections that would make the reset non-fresh must be removed/reset consistently:
- committed ordinary turns;
- turn jobs including failed/processing/completed job rows;
- feedback attempts/revision-history rows belonging to prior chronology;
- committed_turn back to 0;
- canonical state body rebuilt from the preserved player profile plus current canonical opening location/presence rules;
- CSA active state / scene / mind-monitor-derived durable state / other current gameplay state contained in the canonical state body must return to the same initial shape produced by current `createInitialState`/setup semantics.

Do not leave orphan audit rows that can re-enter normal context/history after reset.

If another R3 table added by accepted migrations references the game chronology, inspect it and include it only if required for a truly fresh same-game chronology. Do not broaden to unrelated v1/v2 tables.

### Revision/fencing
- client sends `expected_state_revision` from current canonical context;
- reset must reject stale revision;
- reset must reject/stop safely if a normal turn or feedback operation is actively processing rather than racing it;
- DB clearing + initial-state replacement must be one atomic service-role transaction/RPC;
- state revision must remain monotonic across reset (do not rewind revision to an old value). Increment once for the reset transaction; the subsequent fresh Opening may increment according to the existing Opening commit contract.

Do not add hidden retry/regeneration.

## 3. Minimal server design

Add one capability-protected game-scoped reset route, preferred:
`POST /api/r3/games/:game_id/reset`

Requirements:
- it must pass through the same exact-game bearer capability gate as context/opening/turn/feedback/CSA before any game-specific read/write;
- request contains only the narrow reset fence data needed, e.g. `expected_state_revision`;
- no client-supplied profile, state body, opening location, or capability authority;
- server reads the current game/profile and canonical content, derives the same opening location/presence rules already used by setup, and builds initial state using existing domain helpers;
- store performs one atomic reset transaction;
- after the atomic reset succeeds, reuse the existing `openingResponse` / `processOpening` path to stream a fresh Opening immediately;
- no duplicate Story/Observer implementation for reset.

If the existing response architecture makes a single reset-and-opening SSE route awkward, keep the solution minimal but preserve the user-visible one-click reset -> fresh Opening behavior. Do not add a second orchestration system.

## 4. Minimal persistence delta

A new additive migration/RPC is authorized in source only if required because the current store has no atomic reset primitive.

Preferred RPC responsibility:
- lock/verify exact game/state row;
- enforce `expected_state_revision`;
- reject an active processing turn/feedback race;
- clear only the R3 chronology/revision sidecar rows belonging to the target game;
- replace canonical state with server-computed initial state;
- set committed_turn=0;
- increment state revision monotonically;
- return a compact success result.

Security:
- `SECURITY DEFINER` only if consistent with current R3 RPC pattern;
- execute restricted to `service_role` as existing R3 write RPCs are;
- no anon/authenticated table/RPC exposure expansion;
- no RLS redesign.

Historical already-applied migrations are immutable. Add one new migration file if necessary; never edit/reorder/reapply old migrations in this task.

## 5. Store/client/frontend wiring

### Store
Add only the narrow store method needed for reset in both:
- in-memory R3 store for deterministic tests;
- Supabase R3 store using the new RPC if required.

Both implementations must share the same externally observable reset contract.

### Thin client
Add `reset(gameId, payload)` using the existing stored exact-game capability. Token remains out of URL/body.

### Frontend
Wire the existing `#reset-game` button.

Required UX:
- enable only when a game/context exists and no operation is busy/processing;
- use one simple destructive confirmation before reset if consistent with the current UI/browser primitives; do not build a new modal framework;
- on confirm, send current `state.revision` as the expected fence;
- clear stale rendered Story/choices only as presentation state while request is in progress;
- stream/render the fresh Opening through the existing SSE/render path;
- on success show canonical refreshed context: same player setup, same game_id, Turn 0/fresh Opening chronology, no old turns;
- on failure preserve/reload the server-accepted current context and show a clear error; do not fake a local reset.

No auto-generated new capability and no setup overlay after successful reset.

## 6. Deterministic focused tests

Add focused tests proving at minimum:

1. reset route requires valid exact-game capability before any store mutation;
2. missing/wrong/cross-game capability fails before reset work;
3. same game_id and same player profile survive reset;
4. capability token remains usable after reset without replacement;
5. prior ordinary turns/jobs are gone from canonical context;
6. prior feedback attempts/revision-history are cleared or otherwise proven incapable of re-entering new chronology according to the chosen exact schema contract;
7. prior CSA/current scene/gameplay state is replaced by canonical initial state derived server-side;
8. committed_turn becomes 0;
9. state revision increases monotonically rather than rewinding;
10. stale `expected_state_revision` is rejected without mutation;
11. active processing work is rejected/fenced without partial clearing;
12. after atomic reset the existing Opening path is invoked exactly once and commits one fresh Opening with no ordinary Turn consumed;
13. no old turn appears after reset + Opening readback;
14. frontend client sends bearer header and current revision only;
15. reset button is wired, remains disabled while busy/processing, and one successful reset re-renders fresh context without showing setup;
16. failure does not locally erase accepted server history/state.

Use current focused R3 route/store/frontend test style. Do not create a reset harness project.

## 7. Validation

Run only what this bounded correction needs:
- new reset tests;
- directly affected R3 Worker/store/client/frontend tests;
- migration SQL/static contract checks already used by this repo where applicable;
- JS/MJS syntax checks for modified files;
- `git diff --check`.

Under the lean directive, do not run a broad full-repo suite unless the implementation unexpectedly crosses a shared boundary and focused evidence is insufficient. If you do run broader tests, explain why in terminal.

## 8. Forbidden in this task

Do NOT:
- apply any migration to TEST or Production;
- deploy/redeploy API/frontend;
- create/reset/play a live TEST game;
- touch Production;
- change `R3_GAME_ACCESS_SECRET` or other secrets;
- change RLS/grants beyond the exact new RPC execute hardening required in the migration source;
- change provider/model/temperature/token/timeout/config;
- change Story/Observer prompts or reducer semantics;
- invoke feedback/CSA live;
- rerun CSA7/9;
- modify image/media work;
- add account/login/session/auth framework;
- add semantic gates/classifiers/parsers;
- create a new CURRENT_TASK file/ops branch;
- overwrite CURRENT_TASK after execution.

## 9. Terminal

Commit and push the source/test/migration-source correction to `main`, then post exactly one terminal comment to Issue #68 and STOP.

Success:
`STATUS: WAITING_REVIEW_R3_RESET_SOURCE_IMPLEMENTED_NOT_APPLIED`

If existing schema/contracts make a safe atomic same-game reset require a materially larger architecture decision, STOP:
`STATUS: BLOCKED_R3_RESET_DESIGN_BOUNDARY`

Terminal must include:
- Task ID/current task blob/execution lease;
- start/final main SHA and implementation source commit;
- exact changed paths;
- exact same-game reset contract;
- exact rows/state cleared vs preserved;
- revision/active-job fencing behavior;
- proof reset remains capability-protected;
- proof existing Opening path is reused exactly once after reset;
- focused test counts + syntax/diff/SQL checks;
- confirmation migration was source-only and NOT applied;
- confirmation no deploy/live game/Production/provider/model/CSA/feedback/image mutation occurred;
- any narrow follow-up required for TEST rollout.

Then STOP. Do not overwrite CURRENT_TASK or choose the next task.
# Company — CURRENT TASK

Status: READY
Task ID: company-r3-feedback-revision-implementation-v1
Mode: IMPLEMENT FEEDBACK REVISION SOURCE + ADDITIVE MIGRATION + FOCUSED TESTS -> STOP BEFORE LIVE
Updated: 2026-08-22 23:02 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, QA framework, compatibility layer, or competing execution authority.

## 0. Authority and reviewed decision

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `A-FEEDBACK-001 — Revise latest turn, do not advance chronology`;
- `docs/FEEDBACK_REVISION_CONTRACT.md`;
- owner lean-development directives `5380380688` and `5380381500`;
- wake decision `5380754235`;
- completed audit terminal `5380794753`;
- operator review `5380805884`;
- this exact CURRENT_TASK blob after registration.

Accepted audit recommendation:
`IMPLEMENT_WITH_MINIMAL_ADDITIVE_MIGRATION`.

Core architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Feedback is a sidecar revision of the latest committed ordinary turn. It is NOT a new player action, NOT a new chronological turn, and MUST NOT restore browser-owned Story -> Observer -> Commit orchestration.

CSA rules 7/9 remain frozen capability exceptions and are completely outside this task.

## 1. Baseline / do not reopen

Registration starts from main `ae868f7be1a74db0bd1321569a4f8703d20974a7`, whose executable source lineage remains accepted at `9e91227302a041f1d588e3b260aa3951da3ea9bd` plus docs-only task registrations.

Accepted TEST identities remain frozen and MUST NOT be changed in this task:
- API `game-proxy-company-r3` version `23da269d-45df-4c39-89e0-35dc99b82505`;
- frontend `gamebuilder-company-r3` version `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

Do not rerun player-agency/location/scene_note/choice/SSE/retry/history/mobile/TTS matrices. Do not touch preserved evidence games.

## 2. Task scope

Implement the smallest complete SOURCE vertical slice for latest-turn feedback revision, including:
1. one additive migration source file;
2. in-memory + Supabase persistence interfaces;
3. server-owned feedback SSE endpoint;
4. minimal provider prompt/input support for revision guidance;
5. existing frontend feedback modal/button/client wiring;
6. focused deterministic tests and syntax/diff checks.

This task MUST STOP before any migration application, TEST deployment, TEST DB/game mutation, live browser feedback replay, or Production action.

### Allowed source areas

Only change files directly required for this feature, expected among:
- `supabase/migrations/<next-unused>_company_r3_feedback_revision.sql`;
- `runtime-r3/server/worker.js`;
- `runtime-r3/server/store.js`;
- `runtime-r3/server/supabase-store.js`;
- `runtime-r3/server/provider.js` only for a narrow optional feedback-revision input/prompt contract;
- `frontend-r3/app.js`;
- `frontend-r3/r3-client.js`;
- `frontend-r3/index.html` only if a minimal provisional-preview/status element is needed inside the existing feedback modal;
- focused `test/r3-*.test.mjs` files.

Do not edit canonical Company content or CSA implementation.

## 3. Persistence model — exact narrow shape

### 3.1 Keep canonical latest projection singular

`company_r3_turns` remains the sole normal gameplay projection and remains one row per `(game_id, turn_number)`.

After feedback succeeds:
- same `turn_number`;
- exact original `literal_action` unchanged;
- canonical row contains only the newly accepted Story/observer/state projection;
- logical turn `revision` increments by exactly 1;
- `company_r3_state.committed_turn` does NOT change;
- `company_r3_state.revision` increments exactly once as the optimistic world-state fence.

Normal context/history/export must continue to expose exactly one accepted row per chronological turn. Prior revisions are audit data, not extra gameplay turns.

### 3.2 Add one append-only revision-history table

Add narrowly scoped `company_r3_turn_revision_history` (exact naming may differ only if there is a concrete repository naming collision).

It must durably snapshot every accepted revision going forward, including initial normal Opening/turn commits and feedback replacements, with enough exact data to satisfy `A-FEEDBACK-001` without inference:
- `game_id`;
- `turn_number`;
- logical turn `revision`;
- revision/request identity where applicable;
- revision kind/source (initial vs feedback) if needed structurally;
- `feedback_text` nullable for normal commits;
- exact original `literal_action`;
- Story text;
- choices;
- turn summary;
- Mind Monitor;
- observer raw/applied;
- warnings;
- exact `state_before`;
- exact `state_after`;
- state revision before;
- state revision after;
- superseded/prior logical revision linkage for feedback replacement;
- committed timestamp.

Use a narrow unique key such as `(game_id, turn_number, revision)`. Do not build a generic event-sourcing/versioning framework.

Historical existing turn rows that lack an exact stored `state_before` are NOT feedback-eligible. Do not guess, infer, or bulk-backfill them.

### 3.3 Add one narrow feedback-attempt table

Add `company_r3_feedback_attempts` for idempotency/concurrency fencing only.

Minimum durable identity/state:
- `game_id`;
- `revision_request_id`;
- target turn number;
- target logical turn revision;
- expected current state revision;
- server-recovered exact original literal action;
- feedback text;
- status (`processing|committed|failed` or equally narrow finite set);
- error code nullable;
- created/updated timestamps.

Unique request identity must make replay of the same `(game_id, revision_request_id)` incapable of causing a second Story call/commit.

Do not use `company_r3_system_events` as revision authority.

## 4. Capture exact pre-turn truth on normal commits

Future feedback requires an exact stored pre-turn snapshot.

Update the current Opening/ordinary Commit persistence transaction(s) in the additive migration so accepted initial revisions are written into revision history atomically.

Important:
- `state_before` comes from the DB-locked current `company_r3_state.state`, never from a browser-supplied snapshot;
- state revision before/after comes from the same locked transaction;
- do not create parallel v2 compatibility RPCs merely to avoid touching the canonical RPC definitions;
- preserve the current accepted Opening stale-revision fence and ordinary turn attempt fence;
- preserve normal turn chronology and current context shape.

If SQL can capture exact `state_before` from the existing locked state row without changing existing RPC signatures, prefer that. Do not broaden the API contract unnecessarily.

In-memory store behavior must match the same semantics for deterministic tests.

## 5. Feedback begin / commit / fail transaction

Add three narrowly named persistence operations/RPCs equivalent to:
- `company_r3_begin_feedback_revision`;
- `company_r3_commit_feedback_revision`;
- `company_r3_fail_feedback_revision`.

### Begin requirements

Under row locks/fences:
- game exists;
- target is exactly `company_r3_state.committed_turn` and `> 0`;
- target `company_r3_turns` row exists;
- exact revision-history snapshot for the currently accepted target revision exists and contains `state_before`;
- request `expected_turn` equals latest committed turn;
- request `expected_state_revision` equals current `company_r3_state.revision`;
- current world-state revision still equals the target accepted revision's recorded state-revision-after; if a later CSA/sidecar changed state, reject instead of erasing/inferencing it;
- no unresolved next-turn job may be silently overwritten; reject when the next canonical turn job is processing or failed;
- original literal action comes from the server-side accepted row/history and is never trusted from the request;
- insert-or-read the unique feedback attempt.

If the same request ID already exists:
- never start a second provider call;
- return/replay existing terminal state if already committed/failed where practical;
- an in-flight duplicate must not create another generation attempt.

### Commit requirements

Atomically:
- recheck attempt identity/status, latest-turn identity, logical target revision and state revision fence;
- require the exact stored pre-turn snapshot;
- update the SAME `company_r3_turns` chronological row to logical revision +1 using the replacement Story/observer/state data;
- preserve exact original literal action;
- update `company_r3_state.state` to replacement `state_after` and increment only state revision once;
- DO NOT advance `committed_turn`;
- append the newly accepted replacement snapshot to revision history with linkage to the prior logical revision;
- mark feedback attempt committed.

The original/prior accepted revision must remain audit-visible in revision history and never appear as a second normal gameplay turn.

### Fail requirements

Provider/Observer/reducer/commit failure must leave:
- existing canonical `company_r3_turns` row unchanged;
- `company_r3_state` unchanged;
- chronology unchanged.

Only the feedback attempt may become failed with an error code.

## 6. Server-owned feedback SSE

Add:
`POST /api/r3/games/:game_id/feedback`

Request contains only:
- `revision_request_id` (fresh UUID from client);
- `expected_turn`;
- `expected_state_revision`;
- `feedback_text`.

Do NOT accept original literal action or pre-turn state from the browser.

Execution for a newly created attempt:
1. begin feedback revision / obtain server-owned target snapshot;
2. construct a pre-turn Story context whose world state is the exact stored `state_before` and whose committed prior-turn history ends before the target chronological turn;
3. retain the currently accepted target Story only as revision/reference material if useful to the Story prompt; it is NOT pre-turn world-state authority;
4. call Story exactly once using the original literal action + bounded feedback guidance;
5. call Observer exactly once on replacement Story using the same exact pre-turn state/context;
6. run the existing small reducer from that pre-turn state;
7. atomic feedback revision commit;
8. emit one committed terminal containing canonical context.

No hidden retry/regeneration and no second Story call to repair choices/observer fields.

Observer failure must follow the existing R3 fail-open philosophy only if it is safe under the accepted normal-turn contract; do not invent replacement structural facts. Keep behavior consistent with current normal turn semantics rather than creating a feedback-only semantic verifier.

A duplicate/in-flight `revision_request_id` MUST NOT invoke Story again.

## 7. Provider boundary

If provider changes are needed, add only a narrow optional revision input such as bounded `feedbackText` / prior accepted Story reference.

Requirements:
- no model/provider/temperature/token/timeout/config changes;
- no semantic parser/classifier/router/gate;
- no deterministic prose rewrite;
- feedback is guidance to revise the same original player action from the same pre-turn world state;
- static player-agency contract remains binding;
- Story still owns natural narrative and choices.

## 8. Frontend wiring — reuse existing modal

Use the existing `#send-feedback` + feedback modal. Do not redesign the UI.

Enable feedback only when:
- a committed ordinary latest turn exists (`committed_turn > 0`);
- no normal turn/recovery is busy;
- no pending/failed next-turn job is active;
- feedback request is not already active.

Behavior:
- button opens existing modal;
- close works when not submitting;
- trim/validate one feedback text;
- one submit creates one fresh `revision_request_id` and one feedback request;
- disable modal submit/feedback control while active to prevent double submit;
- provisional replacement Story may stream inside the feedback modal/preview area, but DO NOT erase or replace the currently committed Story/history before terminal success;
- on committed terminal: replace local context with returned canonical context, clear/close modal, render revised latest turn once;
- on failed request: keep old committed Story/state/history intact and show feedback error/status;
- refresh after success reconstructs the revised canonical row from server context;
- no browser-owned logical revision ledger/coordinator.

Add only the smallest markup needed for provisional feedback preview/status if current modal cannot display it cleanly.

## 9. Focused tests only

Add/adjust focused deterministic tests sufficient to protect this slice. Cover at minimum:
- normal initial committed turn writes exact revision-history snapshot with state_before/state_after + state revision boundaries;
- latest-turn feedback uses stored exact pre-turn state and exact original literal action;
- one feedback request -> one Story + one Observer;
- success keeps same chronological turn and increments logical turn revision once;
- success leaves `committed_turn` unchanged and increments state revision once;
- prior revision remains in audit history while context/history exposes one latest gameplay row;
- replacement becomes authority for subsequent context/history/refresh;
- stale expected turn/state revision rejected before provider work;
- later CSA/sidecar state revision fence rejects rather than erasing state;
- duplicate request ID never calls Story twice;
- processing/failed next-turn job blocks feedback;
- provider failure preserves old projection/state;
- commit/fence failure preserves old projection/state;
- exact literal action cannot be changed by feedback request;
- frontend modal single-submit, provisional-old-story preservation, success swap, failure preservation;
- migration/source contract exposes only service-role RPC/table access consistent with current R3 boundary.

Run only relevant R3 focused tests plus syntax/diff checks. Do not automatically run the entire historical suite.

If implementation unexpectedly changes a cross-cutting shared runtime primitive beyond this vertical slice, STOP and report rather than expanding the task into broad regression work.

## 10. Forbidden work

Absolutely no:
- migration application to any environment;
- TEST or Production deploy;
- DB write/query for mutation purposes;
- game creation/reset/live feedback play;
- preserved/manual/evidence game mutation;
- CSA rerun/change, especially rules 7/9;
- provider/model/config/timeout tuning;
- 30/50-turn campaign;
- generic semantic/consent/relationship/action executor machinery;
- second Story/choice LLM;
- hidden retries;
- browser-owned Story -> Observer -> Commit coordinator;
- unrelated cleanup/refactor.

## 11. Stop / terminal report

When source implementation is complete, post one terminal report to Issue #68 and STOP.

Required terminal evidence:
- Task ID + CURRENT_TASK blob + execution lease;
- start/final main SHA;
- exact changed paths/commits;
- migration filename and compact schema/RPC summary;
- confirmation migration was CREATED AS SOURCE ONLY and NOT APPLIED;
- exact feedback endpoint/request shape;
- persistence fencing/idempotency behavior;
- how exact pre-turn state is captured and used;
- how prior revisions remain auditable while normal context remains singular;
- frontend existing-modal behavior;
- focused tests run and pass/fail counts;
- syntax/diff checks;
- no TEST/Production deploy, no DB/game mutation;
- CSA 7/9 untouched;
- any real blocker/deviation from this narrow design.

Expected success status:
`STATUS: WAITING_REVIEW_SOURCE_IMPLEMENTED_NOT_DEPLOYED`

Do not apply the migration or deploy after terminal. Do not create the next CURRENT_TASK yourself.

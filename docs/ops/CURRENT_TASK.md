# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-clean-vertical-slice-v1
Mode: CORRECTION ROUND 3 — STUCK TURN CLOSURE
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

This remains the SAME Phase 1 task, implementation branch, and Draft PR. It is not a new feature cut.

- canonical Draft PR: `#87`
- implementation branch: `company-v2/phase1-clean-vertical-slice-v1`
- deployment-boundary terminal: Issue #68 comment `5339250233`
- operator review: Issue #68 comment `5339311603` — `CHANGES_REQUIRED_STUCK_TURN_CLOSURE`
- reviewed head before this correction: `8030739a3dc2d98638c7e707617fe9b03419a35d`
- exact-head CI already reviewed: run `32230547982` SUCCESS

All v1/manual/QA/evidence games, especially `df3045fd-c359-4cdc-8783-357ddfebe398`, remain READ-ONLY.

Do not create a replacement PR, implementation branch, or Task ID.

## 1. Keep all accepted Phase 1 work

Do not regress:

- physical isolation under `runtime-v2/**` and `frontend-v2/**`;
- production/default Worker uses `SupabaseV2Store` from env;
- `InMemoryV2Store` and deterministic provider are explicit test-only injection paths;
- real env-configured Story/Observation provider is the production/default path;
- one browser/server `/api/v2/turn` operation with server-owned Story -> optional Observation -> reducer -> commit;
- durable `company_v2_*` persistence and one canonical `(game_id, turn_number)` job row;
- literal player action fidelity;
- exactly four provider-authored choices;
- optional Observation fail-open and bounded non-empty summary fallback;
- minimal scene/time state and relevant-only Mind Monitor;
- no client Story/Extract/Commit stage machine;
- explicit retry only after terminal failed status; no automatic LLM retry/regeneration;
- dedicated API/frontend identities `game-proxy-company-v2` / `gamebuilder-company-v2`;
- explicit frontend v2 API base and browser-valid CORS/preflight;
- Story uses `STORY_MODEL`, Observation uses `EXTRACT_MODEL`;
- no Phase 2/3 mechanics.

## 2. Goal — make a turn always reach a terminal state

Company v2 exists specifically to eliminate the v1 hard-lock class. Before TEST rollout, every reserved Phase 1 turn must deterministically end as either:

- `committed`; or
- terminal `failed` that the user may explicitly retry.

A job must not remain `processing` forever because of upstream silence, Worker/isolate loss, or reservation races.

This correction is structural only. Do not add semantic verification, regeneration, fallback Story calls, or a retry loop.

## 3. Blocker A — bounded provider timeouts

Current defect:

- `runtime-v2/server/provider.js` has no bounded Story first-content / Story total / Observation timeout;
- an upstream fetch/body read can hang until infrastructure termination, leaving the durable job `processing`.

Required:

- add v2-local transport timeouts without importing old gameplay runtime modules;
- use the repository's currently proven timeout class unless a smaller v2-safe bound is justified:
  - Story first content: approximately 30 seconds;
  - Story total: approximately 120 seconds;
  - Observation: approximately 75 seconds;
- AbortSignal/AbortController must cover both upstream fetch and Story stream body read;
- timeout/transport failure must throw one structural error into the existing server-owned turn boundary;
- `processTurn` must terminalize the current job as `failed` through the existing fail path;
- Observation timeout remains optional/fail-open and must not fail an otherwise valid Story commit;
- no second Story/Observation request and no automatic retry.

Do not change provider/model values.

## 4. Blocker B — abandoned processing lease must terminalize

Current defect:

- Story progress is durable, but if the Worker/isolate disappears before catch/fail/commit, the row can remain `processing` forever;
- reconstructed Worker/frontend only reads and polls that row.

Add one narrow structural lease/expiry rule for `company_v2_turn_jobs`.

Requirements:

- `processing` jobs have a deterministic heartbeat/lease represented by existing `updated_at` or one narrowly added structural timestamp;
- Story progress updates refresh the lease;
- normal long-running Story within the configured total timeout must not be expired early;
- after a conservative bound greater than the maximum normal Story request window, a subsequent server read/reserve/reconnect may atomically transition an abandoned `processing` row to terminal `failed` with a structural error such as `stale_turn_timeout`;
- expiry must be implemented through one narrow v2 RPC/transaction boundary if DB mutation is required;
- expiry MUST NOT invoke Story, Observation, Commit, or any automatic retry;
- after terminalization, the normal explicit failed-turn retry protocol may reopen the same canonical row with incremented `attempt_no`;
- no background scheduler is required for Phase 1: deterministic detection on server interaction/readback is sufficient;
- preserve exactly one row per `(game_id, turn_number)`.

Migration remains additive source only in this correction task; do not apply it live.

## 5. Blocker C — concurrent first reservation must converge

Current defect in the authored SQL:

- `company_v2_reserve_turn` does `SELECT ... FOR UPDATE`;
- if no row exists it performs a plain INSERT;
- two simultaneous initial reservations can both observe no row and one can fail on the primary-key conflict instead of returning the canonical processing job.

Required:

- make initial reservation transactionally race-safe;
- concurrent first submissions for the same `(game_id, turn_number)` must converge on exactly one canonical row;
- at most one caller becomes the creator/Story owner;
- losing callers deterministically receive the existing processing/terminal job as reconnect/non-created, not an unhandled unique violation;
- never overwrite a processing or committed action with a replacement action;
- explicit retry semantics for an already-failed row remain as previously accepted;
- no advisory-lock system or generic job framework unless strictly necessary; prefer the smallest PostgreSQL row/unique-conflict pattern.

Add a regression that exercises the production persistence contract/race shape rather than only the in-memory store behavior.

## 6. Blocker D — frontend failed terminal is immediately retryable

Current defect:

- `frontend-v2/readStream()` handles `terminal: committed` but ignores `terminal: failed`;
- after an SSE failure, `state.retryFailed` is not immediately armed and the user receives no clear terminal failure state;
- the next click first re-discovers the failed job instead of being the explicit retry attempt.

Required:

- on `terminal: failed`:
  - show a clear user-visible failure/status message;
  - preserve the literal input in the input control;
  - reconcile/render the returned canonical failed context or fetch it once from `/api/v2/context`;
  - set client retry intent from canonical `job.status === 'failed'`;
  - re-enable input/send through the normal submit `finally` path;
- the next user click is the one explicit retry submission with a new `action_id` and `retry_failed=true`;
- do not auto-submit, auto-retry, regenerate, or create a hidden timer-based retry;
- non-SSE JSON error responses must surface their actual server error cleanly rather than failing through an undefined data object.

## 7. Required focused tests

Keep the suite compact. Add/adjust tests proving at minimum:

1. Story first-content timeout aborts and terminalizes the job failed; Story call count remains 1;
2. Story total timeout aborts and terminalizes failed; no Observation/Commit follows;
3. Observation timeout/failure is fail-open and valid Story still commits;
4. abandoned durable processing job older than the lease bound becomes terminal `failed` on subsequent server interaction without any Story call;
5. stale terminalization preserves committed turn/history/state;
6. explicit retry after stale terminalization reopens the same row with incremented `attempt_no`;
7. simultaneous initial DB reservations converge on one canonical row and one creator instead of a unique-violation error;
8. simultaneous explicit failed-row retries still produce one processing attempt;
9. frontend handles SSE `terminal: failed`, preserves literal input, surfaces failure, and arms the next explicit retry;
10. frontend does not automatically retry;
11. JSON error response handling surfaces the server error;
12. all deployment-boundary, CORS, API-base, model-role, DB-store, reconnect, clean-room/import-boundary tests remain green.

Do not port old v1 tests.

## 8. Safety / forbidden

This remains source/test/PR only.

Do NOT:

- apply any migration;
- deploy either v2 Worker;
- create/play a live v2 game;
- write/reset/reseed/replay/revise any preserved v1 game;
- access Production/hospital-v2;
- change provider or configured model values;
- add automatic Story/Observation retry/regeneration;
- add semantic router/verifier/classifier/generic job framework;
- merge PR #87;
- create another PR/branch/task;
- start CSA/clothing/navigation/Image/TTS/feedback/sexual meter or any Phase 2/3 work.

## 9. Validation / terminal

Before terminal require:

- focused v2 tests: 0 fail / 0 skip;
- full repository tests: 0 fail;
- changed JS/MJS `node --check`: PASS;
- `git diff --check`: PASS;
- both dedicated v2 wrangler dry-runs remain PASS;
- exact-head GitHub CI: SUCCESS;
- PR #87 remains OPEN / DRAFT / UNMERGED / mergeable;
- branch copy of `docs/ops/CURRENT_TASK.md` is synchronized to this current main registration and introduces no obsolete ops conflict;
- zero migration apply/deploy/live game/Production/preserved-game mutation.

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_STUCK_TURN_CLOSURE_READY_FOR_REVIEW`

Include:

- exact final head;
- previous review `5339311603`;
- PR #87;
- focused/full counts;
- exact-head CI run/job;
- both v2 wrangler dry-run results;
- changed paths;
- proof of bounded provider timeout behavior;
- proof of stale-processing terminalization with no LLM retry;
- proof of race-safe initial reservation;
- proof of immediate frontend failed-terminal explicit-retry behavior;
- confirmation of zero live operations.

Then STOP. Do not generate the rollout task.
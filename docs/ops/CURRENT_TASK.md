# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-clean-vertical-slice-v1
Mode: CORRECTION ROUND
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

This is a correction of the existing Phase 1 source task, not a new feature cut.

- previous terminal: Issue #68 comment `5338745066`
- owner review: Issue #68 comment `5338847812` — `CHANGES_REQUIRED`
- canonical Draft PR: `#87`
- implementation branch: `company-v2/phase1-clean-vertical-slice-v1`
- reviewed pre-correction PR head: `1db01faff6346311a8292c2e9ce768e945130344`
- reviewed implementation source before correction: `f49098efdf0bdf9abfe77a39d6807a4542437f0f`

Do not create a replacement PR or implementation branch. Correct PR #87 in place.

All v1/manual/QA/evidence games, especially `df3045fd-c359-4cdc-8783-357ddfebe398`, remain READ-ONLY.

## 1. Start / branch hygiene

1. Fetch `main` and require this correction registration as current authority.
2. Continue only on `company-v2/phase1-clean-vertical-slice-v1` and PR #87.
3. Before source correction, replace the branch copy of `docs/ops/CURRENT_TASK.md` with the exact registered main copy so the PR does not carry an obsolete/conflicting ops document.
4. Do not mutate `docs/ops/CURRENT_TASK.md` again on the implementation branch. Lifecycle/terminal status for this correction belongs in immutable Issue #68 comments.
5. Do not import or merge old v1 runtime repair work.

If unrelated main/source drift makes the clean-room correction unsafe, STOP rather than rebase old gameplay code into v2.

## 2. Correction goal

Keep the current clean-room architecture, but turn the Phase 1 prototype into an actually deployable five-turn runtime.

The four owner-review blockers below are mandatory. Do not add Phase 2/3 mechanics.

## 3. Blocker A — production runtime must use durable v2 persistence

Current defect: the default Worker creates `InMemoryV2Store`, while the `company_v2_*` SQL is only unused migration source.

Required:

- implement a clean `SupabaseV2Store`/repository under `runtime-v2/**`;
- production/default Worker path must construct and use the DB-backed store from Worker env;
- `InMemoryV2Store` may remain only as an explicitly injected unit-test double;
- setup, opening, context, reserve/reconnect, progress, fail, explicit retry, and commit must use v2 durable tables/RPCs;
- `(game_id, turn_number)` remains the one canonical durable job identity;
- state + committed turn + committed job terminalization must remain one authoritative commit boundary;
- no v1 `game_actions/game_save/game_turns` compatibility path.

Do not apply the migration in this source correction task.

## 4. Blocker B — production runtime must use a real Story/Observation provider

Current defect: the default Worker uses `createDeterministicProvider()` with fixed text/choices/MM.

Required:

- create a clean v2 production provider adapter under `runtime-v2/**`;
- use the repository's currently configured provider/model through environment/config without changing provider or model;
- no import from `src/engine`, old runtime-core, old Extract adapters/reducers, or old frontend turn state machine;
- generic transport/auth helpers may be reused only if they carry no old gameplay semantics; prefer a small v2-local adapter;
- one player turn makes exactly one Story generation call and at most one Observation call;
- no automatic LLM retry/regeneration;
- deterministic/fake providers remain test-only injection paths;
- production/default Worker must fail configuration clearly rather than silently falling back to the deterministic provider.

Story must preserve exact literal player input and return exactly four provider-authored choices for a playable commit. Observation remains optional/fail-open with bounded Story-summary fallback.

## 5. Blocker C — reconnect must survive Worker reconstruction

Current defect: processing reconnect is JSON-only, frontend ignores the in-flight job on refresh, and Story progress is not durably accumulated.

Required:

- durably persist accumulated canonical/raw Story progress to the single v2 turn job while processing, at a bounded cadence appropriate for streaming;
- reconstructing a Worker/store instance must still read the same processing job and accumulated progress from DB;
- a second request for the same processing `(game_id, turn_number)` must never start a second Story call or create a second job;
- frontend-v2 boot/refresh must inspect the server job and restore visible in-flight Story from durable progress;
- reconnect may attach to an existing stream or use a bounded server-owned status/stream continuation mechanism, but it must follow the SAME job and never regenerate Story;
- after the original job commits/fails, refreshed frontend must converge on canonical terminal context without local stage authority.

No client `story/extract/commit` step machine and no automatic retry.

## 6. Blocker D — explicit retry after terminal failure

Current defect: one failed `(game_id, turn_number)` row can block that turn forever.

Required:

- preserve exactly one canonical row per `(game_id, turn_number)`;
- only after `status=failed`, an explicit user submission may atomically reopen that same row for a new attempt, incrementing `attempt_no` and installing the new explicit `action_id`/literal action;
- this must be an explicit protocol signal/operation, never automatic retry;
- concurrent retry attempts must resolve deterministically so only one becomes `processing`;
- a `processing` or `committed` row can never be replaced by another action;
- failure of attempt N must not advance committed turn/state/history.

## 7. Persistence source corrections

Update the additive v2 migration source as needed to support the actual store contract.

Requirements remain:

- isolated `company_v2_games`, `company_v2_state`, `company_v2_turn_jobs`, `company_v2_turns` only;
- least privilege/service-role structural RPCs;
- fixed `search_path`;
- no semantic catalog duplication in SQL;
- non-empty committed Story and summary;
- exactly four committed choices;
- atomic revision/turn fencing;
- structural reservation/retry/progress/commit semantics that the production store actually calls.

Migration source only. No TEST/Production apply in this correction task.

## 8. Required correction tests

Keep the existing compact Phase 1 tests, but add deployable-architecture tests proving at minimum:

1. production/default Worker selects DB-backed store, not `InMemoryV2Store`;
2. production/default Worker selects the real provider adapter and never silently falls back to deterministic provider;
3. reconstructed Worker/store instance reads the same game/state/history/job from a persistent-store test double/contract boundary;
4. same-turn concurrent requests create/use one durable job and invoke Story once;
5. in-flight Story progress is persisted and read back after simulated refresh/reconstruction;
6. frontend refresh renders/reconnects the same processing job rather than starting a replacement action;
7. terminal Story failure performs no observation/commit and does not auto-retry;
8. explicit retry of a failed row increments attempt identity and can continue the same expected turn;
9. simultaneous explicit retries cannot create two processing attempts;
10. processing/committed rows reject replacement actions;
11. real-provider request construction includes literal action, minimal v2 context, four-choice contract, and separate typed Observation request without old Extract schema;
12. import boundary against old gameplay modules still passes;
13. Phase 2/3 mechanics remain absent.

Do not inflate the suite by porting old v1 tests.

## 9. Keep from the accepted direction

Do not regress these already-correct decisions:

- physically isolated `runtime-v2/**` and `frontend-v2/**`;
- one browser `/api/v2/turn` operation;
- server-owned Story → one optional Observation → small reducer → durable commit;
- literal player action fidelity;
- minimal scene/time state;
- summary fallback;
- relevant-only Mind Monitor;
- no old Story/Extract/Commit client orchestration;
- no CSA, clothing, sexual meter, feedback, Image/TTS, relationship/event/physical ledgers in Phase 1.

## 10. Safety / forbidden

This correction is source/test/PR only.

Do NOT:

- apply any migration;
- deploy any Worker/frontend;
- create or play a live v2 game;
- write/reset/reseed/replay/revise any preserved v1 game;
- access Production/hospital-v2;
- change provider/model;
- merge PR #87;
- create another PR/branch/task;
- start Phase 2.

## 11. Validation / terminal

Before terminal:

- focused v2 tests: 0 fail / 0 skip;
- full repository tests: 0 fail; classify stale old-runtime tests rather than bending v2 architecture to them;
- changed JS/MJS `node --check`: PASS;
- `git diff --check`: PASS;
- exact-head GitHub CI: SUCCESS;
- PR #87 remains OPEN / DRAFT / UNMERGED / mergeable;
- branch contains no obsolete CURRENT_TASK delta versus current main;
- no live DB/deploy/game operation occurred.

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_CORRECTION_READY_FOR_REVIEW`

Include:

- Task ID
- previous review `5338847812`
- PR #87
- exact final head
- correction source SHA if docs-only descendants exist
- exact-head CI run/job
- focused/full counts
- changed paths
- proof for DB-store default, real-provider default, durable reconnect, explicit failed retry
- confirmation of zero migration apply/deploy/live game/Production/preserved-game mutation

Then STOP. Do not generate the rollout task.
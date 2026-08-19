# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-clean-vertical-slice-v1
Mode: CORRECTION ROUND 4 — ATTEMPT FENCING
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

This is the SAME Phase 1 task, SAME implementation branch, and SAME Draft PR.

- canonical Draft PR: `#87`
- implementation branch: `company-v2/phase1-clean-vertical-slice-v1`
- stuck-turn terminal: Issue #68 comment `5339480574`
- operator review: Issue #68 comment `5339522677` — `CHANGES_REQUIRED_ATTEMPT_FENCING`
- reviewed head: `53a6daf0aee614feee0c15dc499cbe0bc0ab8e4b`
- exact-head CI reviewed: run `32232199902` SUCCESS

All v1/manual/QA/evidence games, especially `df3045fd-c359-4cdc-8783-357ddfebe398`, remain READ-ONLY.

Do not create a replacement Task ID, implementation branch, or PR.

## 1. Keep all accepted Phase 1 work

Do not regress the accepted clean-room/runtime/deployment/stuck-turn work:

- `runtime-v2/**` / `frontend-v2/**` isolation;
- one server-owned `/api/v2/turn` operation;
- DB-backed production store and real env-backed provider;
- exactly one canonical `(game_id, turn_number)` row;
- literal player-action fidelity and exactly four provider choices;
- bounded Story first-content/total timeout with no automatic Story retry;
- Observation timeout/failure remains fail-open after valid Story;
- durable Story progress and same-job reconnect;
- stale processing lease terminalizes to failed with no LLM call;
- initial reservation race converges with `ON CONFLICT`;
- frontend immediately handles `terminal: failed` and arms an explicit user retry;
- dedicated v2 API/frontend identities, API base, CORS/preflight;
- Story uses `STORY_MODEL`; Observation uses `EXTRACT_MODEL`;
- minimal Phase 1 state only; no Phase 2/3 mechanics.

## 2. Remaining blocker — stale attempt can mutate a newer retry

The current retry design correctly reuses one canonical `(game_id, turn_number)` row and changes:

- `action_id` to the new retry action id;
- `attempt_no` from N to N+1;
- status back to `processing`.

But current write RPCs still authorize by turn identity only:

- `company_v2_update_turn_progress(game_id, turn_number, ...)`;
- `company_v2_fail_turn(game_id, turn_number, ...)`;
- `company_v2_commit_turn(game_id, turn_number, revision, ...)`.

They do not prove that the caller is still the active attempt.

Unsafe sequence:

1. attempt 1 is processing;
2. lease expires attempt 1 to terminal failed;
3. user explicitly starts attempt 2 on the same canonical row;
4. old attempt-1 Worker/isolate wakes up later;
5. because its DB writes are not fenced, it can update progress, fail, or commit the now-processing attempt-2 row.

The commit case is critical: the DB can read attempt 2's current `literal_action` while receiving Story/parsed output produced by attempt 1. That violates literal action fidelity and the single-attempt authority boundary.

Phase 1 cannot merge until every post-reservation write is fenced to the exact reserved attempt.

## 3. Required attempt fence

Use the existing structural attempt identity. Prefer BOTH:

- `action_id`;
- `attempt_no`.

Do not introduce a semantic ledger/router/verifier.

At reservation success, snapshot an immutable attempt fence, for example:

- `game_id`;
- `turn_number`;
- `action_id`;
- `attempt_no`.

Important: do not rely on retaining a mutable in-memory job object as the fence. The in-memory retry path currently mutates the same canonical job object in place, so an old attempt holding that object could observe the new attempt's fields. `processTurn` must carry a value snapshot captured at reservation time.

## 4. Fence every post-reservation mutation

The following writes must require the exact active attempt identity:

### Progress

`updateProgress` / DB progress RPC must mutate only when all match:

- `game_id`;
- `turn_number`;
- `status='processing'`;
- expected `action_id`;
- expected `attempt_no`.

A stale mismatch must fail structurally and must not touch the current row.

### Failure

`failJob` / DB fail RPC must require the same fence.

A stale attempt waking after retry MUST NOT mark the newer attempt failed.

If a stale attempt receives a fencing conflict while handling its own late error, treat that as "this attempt no longer owns the row". Do not convert it into another mutation against the current attempt.

### Commit

`commitTurn` / DB commit RPC must require the same fence before any state/history/job mutation.

The commit transaction must prove:

- state revision/turn boundary is valid;
- current job is processing;
- current job `action_id` equals the reserved attempt's action id;
- current job `attempt_no` equals the reserved attempt's attempt number.

Only then may it write state, history, and committed job status.

No stale attempt may commit under the newer attempt's literal action.

## 5. SQL / RPC contract

Implement the smallest structural migration correction.

Requirements:

- final effective RPC surface must expose only fenced progress/fail/commit signatures used by v2 runtime;
- do not leave an unfenced callable overload that can bypass the fence;
- if changing signatures, explicitly drop superseded unfenced signatures in the unapplied v2 migration sequence and preserve service-role-only execution;
- keep `SECURITY DEFINER` and `search_path = public, pg_temp`;
- no semantic allowlists/catalogs in SQL;
- no change to Production/v1 tables or RPCs;
- migration source remains unapplied in this source task.

Because the v2 migrations in PR #87 are not yet applied, it is acceptable to correct the unapplied v2 migration sequence directly or add one narrowly scoped additive correction migration. The final sequence that will be applied during rollout must have no usable unfenced writer.

## 6. In-memory parity

`InMemoryV2Store` must enforce the same attempt fence as Supabase.

Do not let a stale attempt succeed only because tests share mutable object references.

Required behavior:

- retry increments `attempt_no` and replaces `action_id` on the canonical row;
- an old fence from attempt 1 cannot update progress, fail, or commit after attempt 2 has started;
- attempt 2 can still progress/commit normally;
- one canonical job row remains.

## 7. Required regression — exact stale-wakeup sequence

Add one direct scenario regression, not just source-regex proof:

1. reserve attempt 1 and capture its immutable fence;
2. advance clock / expire its lease to `failed`;
3. explicitly retry the same turn as attempt 2 and confirm `attempt_no=2` + new `action_id`;
4. simulate old attempt 1 waking up;
5. prove old attempt 1 cannot:
   - update Story progress;
   - mark attempt 2 failed;
   - commit a turn;
6. prove state/history remain unchanged by all stale writes;
7. then let attempt 2 complete successfully;
8. prove committed `literal_action`, Story text, parsed blocks/summary, and job identity all belong to attempt 2;
9. prove exactly one job row and exactly one committed gameplay turn exist.

Also keep regressions for:

- provider timeouts;
- stale lease terminalization;
- initial reservation race convergence;
- simultaneous explicit retries;
- frontend failed-terminal explicit retry;
- reconnect/history/summary/MM;
- CORS/deployment configs/model roles;
- clean-room import boundary.

Do not port old v1 tests.

## 8. Safety / forbidden

Source/test/PR only.

Do NOT:

- apply any migration;
- deploy either v2 Worker;
- create or play a live v2 game;
- mutate/reset/reseed/replay/revise any preserved v1 game;
- access Production/hospital-v2;
- change provider or configured model values;
- add automatic Story/Observation retry/regeneration;
- add semantic router/verifier/classifier, generic job framework, compatibility shadow writer, or second canonical row;
- merge PR #87;
- create another PR/branch/task;
- start CSA/clothing/navigation/Image/TTS/feedback/sexual meter or any Phase 2/3 work.

## 9. Validation / terminal

Before terminal require:

- focused v2 tests: 0 fail / 0 skip;
- full repository tests: 0 fail;
- changed JS/MJS `node --check`: PASS;
- `git diff --check`: PASS;
- both v2 Wrangler dry-runs remain PASS;
- exact-head GitHub CI: SUCCESS;
- PR #87 remains OPEN / DRAFT / UNMERGED / mergeable;
- branch copy of `docs/ops/CURRENT_TASK.md` is synchronized to this main registration;
- zero migration apply/deploy/live game/Production/preserved-game mutation.

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_ATTEMPT_FENCING_READY_FOR_REVIEW`

Include:

- exact final head;
- previous review `5339522677`;
- PR #87;
- focused/full counts;
- exact-head CI run/job;
- both v2 Wrangler dry-run results;
- changed paths;
- final fenced RPC signatures and superseded-signature removal proof;
- direct stale-attempt-wakeup regression result;
- proof that stale attempt cannot progress/fail/commit newer attempt;
- proof that committed literal action and Story originate from the same active attempt;
- confirmation of zero live operations.

Then STOP. Do not merge and do not generate the rollout task.
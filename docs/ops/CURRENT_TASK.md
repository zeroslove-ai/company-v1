# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-acl-closure-v1
Mode: SOURCE CORRECTION — ACL CLOSURE
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted Phase 1 source:

- source task: `company-v2-phase1-clean-vertical-slice-v1`
- accepted source head: `d339517bfa9df5ec6162b5bfdc91d6b4fa9db06e`
- source acceptance review: Issue #68 comment `5339692420`
- PR #87 merged at exact reviewed head
- merge commit: `f80830e48f227e5a3718ecacaec82d9d3427b504`

Rollout evidence:

- rollout task: `company-v2-phase1-test-rollout-v1`
- rollout BLOCKED terminal: Issue #68 comment `5339791555`
- operator verification/review: Issue #68 comment `5339859038` — `REVIEW: BLOCKED`
- TEST project: `fmcrspgxstsmxxsmkeee`
- migrations `20260819000200`, `20260819000300`, `20260819000400` are already applied in TEST and MUST be treated as historical applied migrations.

All preserved v1/manual/QA/evidence games remain READ-ONLY. Production/hospital-v2 is forbidden.

## 1. Goal

Close the one rollout-discovered Company v2 database ACL defect without changing gameplay behavior.

The live TEST schema has the correct v2 tables and fenced RPC signatures, but several RPCs remain executable by `anon` and `authenticated` because earlier migrations revoked only `PUBLIC` while Supabase role/default privileges left explicit grants.

This source task must author one additive ACL-closure migration and compact tests. It must NOT apply the migration or deploy anything.

## 2. Implementation branch / PR

This is a new narrow source correction after PR #87 was merged.

Create exactly one implementation branch from current `main`:

`company-v2/phase1-acl-closure-v1`

Create exactly one Draft PR targeting `main`.

Do not create any ops branch. Do not create another CURRENT_TASK file. Do not reopen or modify PR #87.

Before implementation, synchronize the branch copy of `docs/ops/CURRENT_TASK.md` to this exact main registration and do not mutate CURRENT_TASK again on the implementation branch. Lifecycle and terminal reporting belong in immutable Issue #68 comments.

## 3. Required additive migration

Add exactly one new migration source:

`supabase/migrations/20260819000500_company_v2_acl_closure.sql`

Do NOT edit these already-applied migrations:

- `20260819000200_company_v2_phase1_vertical_slice.sql`
- `20260819000300_company_v2_stuck_turn_closure.sql`
- `20260819000400_company_v2_attempt_fencing.sql`

The new migration must normalize the final v2 ACL contract explicitly rather than relying on default privileges.

### RPC execution ACL

For every active Company v2 mutation RPC below, explicitly revoke EXECUTE from:

- `PUBLIC`
- `anon`
- `authenticated`

and normalize `service_role` to the only non-owner runtime EXECUTE role.

Functions:

- `company_v2_create_game(text,jsonb)`
- `company_v2_create_opening(uuid,text,jsonb,jsonb,text,jsonb)`
- `company_v2_reserve_turn(uuid,integer,uuid,text,boolean)`
- `company_v2_expire_stale_turn(uuid,integer)`
- fenced `company_v2_update_turn_progress(uuid,integer,uuid,integer,text)`
- fenced `company_v2_fail_turn(uuid,integer,uuid,integer,text)`
- fenced `company_v2_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,jsonb,text,jsonb,jsonb)`

Prefer explicit normalization:

- revoke all from `PUBLIC, anon, authenticated, service_role`;
- grant EXECUTE back only to `service_role`.

PostgreSQL function owner/admin capability is not part of the runtime ACL requirement and must not be altered.

### Table ACL / sole-writer boundary

Live TEST currently shows `service_role` full table DML privileges even though v2 runtime writes are designed to go through SECURITY DEFINER RPCs.

Normalize all four v2 tables:

- `company_v2_games`
- `company_v2_state`
- `company_v2_turn_jobs`
- `company_v2_turns`

Required runtime ACL:

- `PUBLIC`: no table privileges
- `anon`: no table privileges
- `authenticated`: no table privileges
- `service_role`: SELECT only

Explicitly revoke existing table privileges from the above runtime roles as needed, then grant SELECT to `service_role` only.

Do not revoke owner/admin privileges. Do not touch v1 tables.

Because all mutations are inside SECURITY DEFINER functions owned by the database owner, direct service-role table INSERT/UPDATE/DELETE must not be required by the current v2 runtime.

## 4. Preserve structural contracts

Do not change:

- `runtime-v2/**` gameplay behavior;
- `frontend-v2/**`;
- provider/model values;
- Story/Observation prompts;
- retry/timeout/lease/fencing behavior;
- v2 table shape;
- RPC signatures or function bodies;
- CORS or Worker configs;
- content/catalog semantics.

No new semantic validation/router/verifier/classifier, no compatibility writer, no automatic retry/regeneration.

The final effective migration sequence must still have no unfenced progress/fail/commit overload.

## 5. Tests / proof

Add the smallest focused source tests proving at minimum:

1. the new ACL migration exists and does not modify historical migration files;
2. all seven active v2 RPC signatures explicitly revoke `PUBLIC`, `anon`, and `authenticated` and grant runtime EXECUTE only to `service_role`;
3. fenced progress/fail/commit signatures remain the only callable writer signatures in the final source sequence;
4. all four v2 tables explicitly deny `PUBLIC`, `anon`, and `authenticated` privileges;
5. `service_role` table privileges are normalized to SELECT only;
6. `runtime-v2/server/supabase-store.js` performs direct table reads only and routes all v2 mutations through RPCs, so SELECT-only table access is sufficient;
7. v1 tables/RPCs are not named or altered by the new migration;
8. all existing Phase 1 tests remain green.

Do not add broad legacy tests.

## 6. Safety / forbidden

This task is source/test/PR only.

Do NOT:

- apply `20260819000500` to TEST;
- deploy `game-proxy-company-v2` or `gamebuilder-company-v2`;
- create a fresh v2 game;
- submit gameplay turns;
- access Production/hospital-v2;
- mutate any preserved v1/manual/QA game;
- change provider/model values;
- edit already-applied migrations 002/003/004;
- change gameplay/runtime/frontend behavior;
- start Phase 2;
- merge the new PR automatically.

## 7. Validation

Before terminal require:

- focused v2/ACL tests: 0 fail / 0 skip;
- full repository tests: 0 fail;
- changed JS/MJS syntax checks if any JS/MJS changed;
- `git diff --check`: PASS;
- exact-head GitHub Actions: SUCCESS;
- Draft PR OPEN / UNMERGED / mergeable;
- diff is limited to the additive ACL migration, narrow tests, and synchronized CURRENT_TASK copy only;
- zero additional DB writes/migrations/deployments/live games after the previously blocked rollout;
- Production/v1/preserved games untouched.

## 8. Required terminal

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_ACL_CLOSURE_READY_FOR_REVIEW`

Include:

- exact final head;
- task ID;
- branch and Draft PR number;
- previous blocked rollout terminal `5339791555`;
- operator review `5339859038`;
- changed paths;
- exact additive migration filename;
- normalized RPC ACL proof;
- normalized table ACL proof;
- proof service_role SELECT-only tables are compatible with current Supabase store call shape;
- focused/full test counts;
- exact-head CI run/job;
- confirmation that migration 005 was NOT applied and no Worker/gameplay operation occurred.

Then STOP at `WAITING_REVIEW`. Do not merge and do not resume rollout yourself.

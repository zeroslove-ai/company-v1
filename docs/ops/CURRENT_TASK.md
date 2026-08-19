# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-choice-db-contract-closure-v1
Mode: SOURCE/MIGRATION CORRECTION — FREE-INPUT DB CONTRACT CLOSURE
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / review evidence

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted product-baseline source:

- source terminal: Issue #68 comment `5341256206`
- source acceptance: Issue #68 comment `5341316161`
- accepted head: `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`
- source merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`

Triggering rollout evidence:

- prior rollout blocked: `5341454708`
- auth-resume terminal: `5341558932`
- operator review/root-cause confirmation: `5341646266`
- failed fresh Game A: `360725ca-6369-420a-a740-3f9c787e157c`
- TEST project: `fmcrspgxstsmxxsmkeee`

This task is SOURCE REVIEW ONLY. Do not deploy or apply any migration to TEST.

## 1. Proven root cause

Auth/clock recovered without any secret repair or redeploy. The first fresh Setup then succeeded, but Opening failed with:

`company_v2_opening_invalid`

The failure is a proven source/live-DB contract mismatch caused by removing active Phase-1 choices in source while the already-applied DB contract still requires exactly four choices.

Independent live catalog evidence proves all three stale gates:

1. `company_v2_create_opening(uuid,text,jsonb,jsonb,text,jsonb)` rejects unless `jsonb_array_length(p_choices)=4`.
2. `company_v2_turns` has constraint `company_v2_turns_choices_check` requiring `jsonb_array_length(choices)=4`.
3. fenced `company_v2_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,jsonb,text,jsonb,jsonb)` rejects unless `jsonb_array_length(p_choices)=4`.

Accepted active source now sends `choices=[]` for fresh Opening/gameplay writes. Therefore fixing only Opening would merely move the deterministic failure to first gameplay commit.

## 2. Historical evidence compatibility

Do not mutate or rewrite existing v2 rows.

Current historical turn-0 evidence rows with `choices` length 4 must remain readable and immutable.

Preserve all current v2 games, including:

- `88625b46-20fa-42c6-82d5-050a98ee2aad`
- `0daec355-47a8-4b81-a87d-a47dc25b5b96`
- `09bece94-f2f3-4936-baab-42f64d078708`
- `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
- `360725ca-6369-420a-a740-3f9c787e157c`

The new structural rule must enforce empty choices for NEW writes without rewriting historical length-4 rows.

Preferred table-constraint strategy:

- drop the old exact-four `company_v2_turns_choices_check` in the new additive migration;
- add a new CHECK requiring `choices` to be a JSON array of length 0 for new/updated rows;
- add it `NOT VALID` so preserved historical length-4 rows remain untouched/readable while the constraint is still enforced on future writes;
- do not validate it against historical rows in this task.

Do not weaken the active RPC write contract to allow new 4-choice writes merely for historical compatibility.

## 3. Additive migration only — never edit 002-005

Create exactly one new migration source file:

`supabase/migrations/20260819000600_company_v2_choice_contract_closure.sql`

Historical/live migrations are immutable and MUST NOT be edited, replayed, squashed, renamed, or replaced:

- `20260819000200_company_v2_phase1_vertical_slice.sql`
- `20260819000300_company_v2_stuck_turn_closure.sql`
- `20260819000400_company_v2_attempt_fencing.sql`
- `20260819000500_company_v2_acl_closure.sql`

The new migration must close all three stale gates atomically.

### A. `company_v2_turns` constraint

Replace only the stale exact-four choices CHECK.

New-row behavior:

- `choices` must be JSON array;
- length must be exactly 0;
- historical existing length-4 rows remain untouched via `NOT VALID` compatibility.

Do not update/delete/backfill existing rows.

### B. `company_v2_create_opening`

`CREATE OR REPLACE` the existing exact signature only:

`company_v2_create_opening(uuid,text,jsonb,jsonb,text,jsonb)`

Preserve all current structural checks except the stale exact-four requirement.

Required new choices rule:

- non-null JSON array;
- length exactly 0.

Preserve:

- non-empty Story requirement;
- non-empty summary requirement;
- turn 0 insert shape;
- `ON CONFLICT (game_id, turn_number) DO NOTHING` behavior unless source review proves a separate existing defect (if so STOP rather than broaden this task).

### C. fenced `company_v2_commit_turn`

`CREATE OR REPLACE` only the current fenced signature:

`company_v2_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,jsonb,text,jsonb,jsonb)`

Required new choices rule:

- non-null JSON array;
- length exactly 0.

Preserve exactly:

- `p_action_id` + `p_attempt_no` fencing;
- revision/turn conflict checks;
- one canonical job row semantics;
- processing-status requirement;
- state revision advance;
- turn insert;
- committed job update fenced by action/attempt/status;
- no unfenced overload creation.

Do not change Story/summary requirements, state shape, job lifecycle, retry semantics, or provider behavior.

### D. ACL re-assertion

After replacing the two RPCs, explicitly reassert the accepted ACL contract for those exact signatures:

- PUBLIC: no EXECUTE
- anon: no EXECUTE
- authenticated: no EXECUTE
- service_role: EXECUTE only as already intended

Do not broaden table privileges. Do not change the other five v2 RPC ACLs.

## 4. Player-name `????` observation is NOT this root cause

Game A Setup state stored player name as `????`.

Do not guess a runtime/source fix from that observation in this task. It did not cause `company_v2_opening_invalid`; the stale choices=4 DB contract did.

Source already contains literal UTF-8 `플레이어` in `frontend-v2/app.js` and JSON serialization through browser `fetch`.

Required in this source task only:

- add/retain a focused regression proving the v2 setup/state serialization path preserves a Korean player name in JavaScript/source-level tests if such coverage can be added without runtime behavior change;
- do not change frontend/runtime behavior solely to address the observed `????`.

The later TEST rollout must use an explicitly UTF-8-safe client (prefer Node `fetch`/native JS JSON rather than a shell codepage-sensitive body) and verify stored player name exactly equals the submitted Korean string.

## 5. Scope / branch / PR

Create source branch:

`company-v2/phase1-choice-db-contract-closure-v1`

Open one Draft PR against `main`.

Allowed changes:

- new `supabase/migrations/20260819000600_company_v2_choice_contract_closure.sql`
- focused `test/**` regressions for this contract and UTF-8 setup serialization
- `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md` only if a stale DB-contract statement must be updated

Not authorized:

- runtime-v2 behavior changes
- frontend-v2 behavior changes
- edits to migrations 002-005
- migration application
- TEST DB writes
- Worker deploy/redeploy
- secret/provider/model changes
- v1/Production access
- Phase 2 work
- mutation/reset/delete/reuse of any preserved v2 game

If implementation appears to require runtime/frontend code changes beyond tests, STOP and report why rather than broadening scope.

## 6. Required tests / source proof

Add focused regression coverage that proves at least:

1. active Phase-1 source Opening uses `choices=[]`;
2. active gameplay commit payload uses `choices=[]`;
3. migration removes the stale exact-four table CHECK;
4. replacement table CHECK enforces JSON array length 0 for future writes while remaining `NOT VALID` for historical compatibility;
5. replacement Opening RPC accepts only empty choices and still rejects malformed/non-array/non-empty choices;
6. replacement fenced Commit RPC accepts only empty choices and retains the exact attempt fence conditions;
7. no unfenced progress/fail/commit overload is introduced;
8. ACL for both replaced RPC signatures remains service_role-only;
9. migration performs no UPDATE/DELETE/backfill of existing v2 turns;
10. Korean player name `플레이어` survives the source-level setup/JSON serialization path unchanged, without changing runtime behavior.

Also run:

- focused Company v2 tests;
- full repository `npm test`;
- syntax checks for any JS test changes;
- `git diff --check`;
- migration diff review proving 002-005 unchanged;
- exact-head GitHub Actions success.

If a disposable local PostgreSQL/Supabase environment already exists and can execute this migration without touching TEST, an execution proof is welcome but not required. Do not create or mutate TEST data for source review.

## 7. Review stop

Codex stops at source review. Do NOT merge, deploy, apply migration 006, create TEST games, retry failed Game A, or start the rollout.

Required terminal:

`COMPANY_V2_PHASE1_CHOICE_DB_CONTRACT_READY_FOR_REVIEW`

Include:

- TASK_ID;
- branch;
- Draft PR number;
- final head SHA;
- exact changed files;
- exact migration filename;
- proof 002-005 unchanged;
- table constraint before/after semantics;
- Opening RPC before/after choices contract;
- fenced Commit RPC before/after choices contract and fence preservation;
- ACL proof;
- historical-row no-mutation proof;
- focused/full test results;
- exact-head CI run/job IDs;
- explicit confirmation of zero deploy, zero TEST migration apply, zero live DB write, zero preserved-game mutation, zero provider/model/v1/Production/Phase2 change.

Then STOP at `WAITING_REVIEW`. Do not create the rollout task yourself.
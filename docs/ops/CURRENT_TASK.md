# Company v1 — CURRENT TASK

Status: READY
Task ID: fresh-level7-test-fixture-writer-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This existing `docs/ops/CURRENT_TASK.md` is reused in place on `main`. Do not create a new CURRENT_TASK file and do not create a new ops/task-registration branch.

## 0. Owner review decision and blocker

Predecessor task: `hospital-spine-test-manual-handoff-v1`.

Accepted blocker terminal: Issue #68 comment `5327098320`.

Classification: `BLOCKED_HOSPITAL_HANDOFF_NO_FRESH_LEVEL7_WRITER`.

Verified facts from the blocked run:

- exact registered main CI run `32125901150` succeeded;
- exact main deployed to TEST API Worker `game-proxy-company-v1` as version `5eb3ebc7-a4a3-43c0-ba0b-b159ee93ce52`;
- deployed source tree is `b397708faa738d41bd7c682af60d6e1e4d091936`;
- action/scene gates, `/health`, `/api/version`, preserved-game read-only API smoke, and frontend route/assets all passed;
- fresh candidate UUID `1ee28d34-af78-4a07-a784-248e075ebd9c` was proven absent before any write in `games`, `game_save`, `game_actions`, and `game_turns`;
- no fixture write was attempted and all existing games were preserved;
- current TEST RPC `prepare_company_test_level7_fixture(uuid,text)` hard-codes existing dedicated game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` and calls `reset_company_game`, so it cannot satisfy fresh-UUID/no-reuse/no-reset manual-handoff requirements.

Owner decision: the block is valid. Authorize only the smallest TEST-fixture tooling/DB-contract repair required to create one genuinely new Level-7 turn-zero game. Do not alter gameplay semantics.

## 1. Frozen start and branch rule

At execution start:

1. fresh-fetch `origin/main`;
2. require exact registration main SHA/blob from the latest Issue #68 `CURRENT_TASK_READY` comment for this Task ID;
3. require current `src` tree remains `b397708faa738d41bd7c682af60d6e1e4d091936` and current `test` tree remains `9f24659243417edb40d38d7e0fdce9c7397fc19b` before implementation;
4. create/use one normal implementation branch `company/fresh-level7-test-fixture-writer-v1` from exact registration main;
5. this implementation branch is allowed; a new ops/task-registration branch is not;
6. if unrelated non-doc drift exists, STOP `BLOCKED_FRESH_LEVEL7_WRITER_MAIN_DRIFT`.

## 2. Preserve historical migration and old dedicated seam

Historical applied migration:

`supabase/migrations/20260815000100_company_v1_test_level7_acceleration.sql`

Do not edit, rename, rewrite, or delete it.

The existing RPC `prepare_company_test_level7_fixture(uuid,text)` and the existing dedicated-game helper behavior may remain for historical/dedicated TEST use. Do not broaden that old RPC by removing its fixed-ID guard.

Add a new additive TEST-only migration/RPC for fresh fixture creation instead.

## 3. Required fresh fixture contract

Create one new additive migration defining a distinctly named fresh-fixture RPC, e.g. `create_company_test_level7_fixture(uuid,text)`.

The exact implementation may vary only where current schema requires it, but it must prove these properties:

1. service-role only; revoke from `public`, `anon`, and `authenticated`;
2. target UUID is explicit and non-null;
3. target UUID must be absent before write from `games`, `game_master`, `game_save`, `game_actions`, and `game_turns`; any presence fails closed and performs no mutation;
4. reject known preserved/dedicated identities, including at minimum:
   - `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
   - `9755b57b-5cbb-44dd-a624-020fe516c16d`;
   - `78fb1d94-266f-455a-bda4-7656cc2370c1`;
   - the repository's explicit production/forbidden game identity if one is defined by current tooling;
5. use the current dedicated TEST fixture only as a read-only template if a template is necessary; never reset, update, reseed, or otherwise mutate it;
6. atomically create only the new target game's required `games` / `game_master` / `game_save` rows under current schema;
7. produce a valid Company v1 save with `player_progress.level=7`, `player_progress.exp=0`, `committed_turn=0`, idle/no pending action state, and current canonical save validation PASS;
8. create no `game_actions` and no `game_turns` rows;
9. do not call `reset_company_game` for the new UUID;
10. return enough structured evidence to verify `game_id`, `committed_turn=0`, Level 7, test-only/fresh creation status, and that no reset/reuse occurred.

Do not introduce a generic arbitrary-game cloning API. This is a narrow TEST acceptance seam only.

## 4. Tooling contract

Update `scripts/test-level7-acceleration.mjs` only as needed to add a separate fresh-fixture path.

Required boundaries:

- keep the existing dedicated Level-7 seam hard-locked to its existing UUID;
- do not simply weaken `assertLevel7SeamTarget()` to accept arbitrary games;
- fresh creation must have a separate explicit opt-in guard/environment path;
- fresh path must require the dedicated TEST Supabase project and an explicitly supplied target UUID/title; no implicit fallback to the old dedicated UUID;
- fresh path calls only the new fresh-fixture RPC and must not call `get_company_context` first for a UUID that does not yet exist;
- fresh creation helper exposes no reset operation;
- Production/preserved/dedicated UUIDs must fail before RPC invocation.

## 5. Tests

Add/adjust focused tests proving at minimum:

1. existing dedicated seam still accepts only the old dedicated UUID and explicit TEST enablement;
2. fresh seam accepts a well-formed arbitrary new UUID only on the dedicated TEST project with separate explicit enablement;
3. fresh seam rejects dedicated, preserved, production/forbidden, missing, and malformed UUIDs;
4. fresh seam requires a non-empty title;
5. fresh helper makes exactly the new RPC call and does not first fetch an existing game/reset/directly mutate REST tables;
6. new migration contains fail-closed preexistence checks covering `games`, `game_master`, `game_save`, `game_actions`, and `game_turns`;
7. new migration does not call `reset_company_game` and does not modify the template UUID;
8. new save is validated and Level 7 / committed-turn-zero semantics are explicit;
9. RPC ACL remains service-role only;
10. no gameplay/runtime semantics outside fixture tooling changed.

Run focused tests, full `npm.cmd test`, changed JS/MJS syntax checks, SQL/static contract checks where current harness supports them, and `git diff --check`.

## 6. PR and review boundary

After all checks pass:

1. open exactly one PR from `company/fresh-level7-test-fixture-writer-v1` to `main`;
2. PR scope may contain only:
   - the new additive TEST-only migration;
   - `scripts/test-level7-acceleration.mjs` if required;
   - focused test changes;
   - this same `docs/ops/CURRENT_TASK.md` lifecycle update on the branch;
3. require exact-head `Company v1 tests` CI SUCCESS;
4. do not merge the PR;
5. do not apply the new migration to TEST yet;
6. do not redeploy API/frontend;
7. do not create any game or run any gameplay call;
8. overwrite this same CURRENT_TASK file on the implementation branch to `Status: WAITING_REVIEW`, record PR/head/test/CI evidence, post terminal classification `FRESH_LEVEL7_TEST_FIXTURE_WRITER_READY`, and STOP.

The owner/reviewer will decide merge + TEST migration application + final fresh manual fixture creation in the next task.

## 7. Absolute prohibitions

- no new CURRENT_TASK file;
- no new ops/task-registration branch;
- no edit of historical migration `20260815000100_company_v1_test_level7_acceleration.sql`;
- no weakening/reusing the old dedicated RPC for arbitrary UUIDs;
- no gameplay Story/Extract/Commit semantics change;
- no Story/Extract prompt change;
- no relationship/event/emotion/open-fact ledger or generic CSA DSL;
- no Production/hospital-v2 operation;
- no TEST migration application before owner review;
- no game creation/reset/reseed/mutation in this task;
- no migration-history repair or broad DB push;
- no provider/model/TTS/binding change;
- no retry/regeneration loop;
- no merge;
- no next roadmap Cut.

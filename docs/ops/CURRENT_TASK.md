# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: fresh-level7-test-fixture-writer-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This existing `docs/ops/CURRENT_TASK.md` is reused in place on `main`. Do not create a new CURRENT_TASK file and do not create a new ops/task-registration branch.

## 0. Owner review: CHANGES_REQUIRED on PR #84

Predecessor terminal: Issue #68 comment `5327244814`.

Reviewed PR:
- PR #84
- reviewed head: `cbf8ad941e0022ec1b954d442bbf20b68594b30d`
- exact-head Company v1 tests: run `32129624924` — SUCCESS
- branch: `company/fresh-level7-test-fixture-writer-v1`

Accepted parts of PR #84:
- additive TEST-only fresh-fixture RPC direction;
- historical `20260815000100_company_v1_test_level7_acceleration.sql` remains unchanged;
- old dedicated fixed-ID RPC remains narrow;
- separate fresh opt-in tooling path;
- dedicated TEST Supabase project guard;
- dedicated/preserved/production UUID rejection;
- fail-closed preexistence checks across `games`, `game_master`, `game_save`, `game_actions`, `game_turns`;
- service-role-only ACL;
- no reset call, no gameplay semantic change, no deployment/migration application.

Blocking defect independently proven by owner review:

The new migration currently inserts `v_template_master.initial_save` into the new game's `game_master.initial_save`, while it builds and validates a different `v_data` from the template's current `game_save.data` for the new `game_save.data`.

Read-only TEST DB evidence for dedicated template `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`:
- current `game_save.data`: `validate_company_save_v1(...).valid = true`;
- current `game_master.initial_save`: `valid = false`, error `missing required key: scene`;
- dedicated template currently has `committed_turn=0`, `game_actions=0`, `game_turns=0`;
- current save is Level 7 / idle, while historical initial save is Level 1 and structurally stale.

Therefore PR #84 would create a new game whose live save is valid but whose own canonical reset baseline is invalid/stale. That violates coherent fresh turn-zero fixture semantics and must be fixed before merge/application.

## 1. Frozen rework identity

The latest Issue #68 `CURRENT_TASK_REARMED_IN_PLACE` comment for this same Task ID supplies exact:
- `REGISTRATION_MAIN_SHA`;
- `CURRENT_TASK_BLOB_SHA`;
- expected existing implementation branch and PR/head.

At execution start:
1. fresh-fetch `origin/main`;
2. require exact registered main SHA/blob;
3. require drift from previous registration `f61f611d...` to current registration is only this `docs/ops/CURRENT_TASK.md` review authority update;
4. reuse existing branch `company/fresh-level7-test-fixture-writer-v1`; do not create another branch;
5. reuse PR #84; do not create a replacement PR;
6. synchronize the existing implementation branch with exact registered main using a normal non-force operation; resolve only the CURRENT_TASK lifecycle file as needed;
7. no rebase/force-push is required or authorized;
8. if unrelated source/test/config/content/migration drift exists, STOP `BLOCKED_FRESH_LEVEL7_WRITER_REWORK_DRIFT`.

## 2. Required migration correction

Modify only the already-unapplied additive migration:

`supabase/migrations/20260818000100_company_v1_fresh_level7_test_fixture.sql`

It is not historical/applied yet, so correcting it before merge/application is authorized.

Required semantics:

1. Continue reading the dedicated TEST fixture only as a read-only template.
2. Build one normalized candidate `v_data` from the current valid template `game_save.data`.
3. Force/normalize at minimum:
   - `player_progress.level = 7`;
   - `player_progress.exp = 0`;
   - `turn_state.committed_turn = 0`;
   - `turn_state.expected_turn = 1`;
   - `turn_state.processing_status = 'idle'`;
   - `turn_state.turn_id = null`;
   - `turn_state.action_id = null`.
4. Validate that exact `v_data` with `validate_company_save_v1` before any target insert.
5. Use the SAME validated `v_data` as:
   - new `game_master.initial_save`;
   - new `game_save.data`.
6. Do not copy `v_template_master.initial_save` into the new game.
7. Preserve template `game_master.data` as read-only content/world definition unless schema proof requires otherwise.
8. Prefer template save schema version rather than an unrelated hard-coded value if the current row exposes it.
9. New target remains atomic fresh creation only: `games` + `game_master` + `game_save`, zero actions/turns.
10. No reset of template or target; no update/delete to any pre-existing game.
11. RPC response must still report fresh/no-reuse/no-reset/zero-turn evidence.

Resulting invariant:

`new game_master.initial_save == new game_save.data == one current-valid Level-7 turn-zero idle baseline` at creation time.

This is a TEST fixture consistency repair only, not a gameplay/save-schema redesign.

## 3. Focused regression requirements

Update focused tests so they fail on the reviewed defect and pass only after correction.

Prove at minimum:
1. migration inserts `v_data` (or exact equivalent normalized validated baseline) into `game_master.initial_save`;
2. migration does NOT insert `v_template_master.initial_save` as the new initial save;
3. same baseline is used for initial_save and live game_save data;
4. candidate baseline is validated before inserts;
5. five-table preexistence guard remains;
6. dedicated/preserved/Production guards remain;
7. ACL remains service-role only;
8. no `reset_company_game` call exists;
9. old historical dedicated seam remains unchanged;
10. fresh tooling remains separate and makes only the fresh RPC call.

Run:
- focused fixture tests;
- full `npm.cmd test`;
- changed JS/MJS syntax checks;
- migration/static contract checks;
- `git diff --check`.

## 4. PR #84 update and review boundary

1. Update the SAME PR #84 / SAME implementation branch.
2. Allowed implementation changes are limited to:
   - the unapplied fresh-fixture migration correction;
   - focused tests needed for the baseline invariant;
   - tooling only if strictly required by that invariant;
   - this CURRENT_TASK lifecycle file on the implementation branch.
3. No Story/Extract/runtime gameplay semantic changes.
4. Require PR #84 mergeable against current main after synchronization.
5. Require exact-head `Company v1 tests` CI SUCCESS.
6. Do NOT merge PR #84.
7. Do NOT apply the migration to TEST.
8. Do NOT deploy API/frontend.
9. Do NOT create/reset/reseed any game.
10. Do NOT run Setup/Opening/Story/Extract/Commit.
11. Set this same CURRENT_TASK on the implementation branch to `Status: WAITING_REVIEW`, record final head/tests/CI and the explicit baseline invariant proof.
12. Post one terminal classification `FRESH_LEVEL7_TEST_FIXTURE_WRITER_REWORK_READY` and STOP.

## 5. Absolute prohibitions

- no new CURRENT_TASK file;
- no new ops/task-registration branch;
- no new implementation branch or replacement PR;
- no force-push/rebase history rewrite;
- no edit of historical applied migration `20260815000100_company_v1_test_level7_acceleration.sql`;
- no weakening of the old dedicated fixed-ID seam;
- no TEST migration application yet;
- no game creation/reset/reseed/mutation;
- no Production/hospital-v2;
- no gameplay/Story/Extract semantics change;
- no provider/model/TTS/binding change;
- no generic cloning API;
- no semantic router/classifier/verifier;
- no relationship/event/emotion/open-fact ledger or generic CSA DSL;
- no retry/regeneration loop;
- no merge;
- no next roadmap Cut.

## 6. Rework execution record

- Final status: `WAITING_REVIEW`.
- Registration main: `3b8537ccfc3c67ad8ad726a033722261c6732fdf`.
- Execution lease start head: `87a46880fdc69b2210b064dce617bd14dc0d7e7e`.
- Correction commit: `e570aabb0251ba7ca5f673f36c4123cd6f2b22b7`.
- Implementation branch / PR: `company/fresh-level7-test-fixture-writer-v1` / `#84`.
- Final PR head: `e570aabb0251ba7ca5f673f36c4123cd6f2b22b7`.
- PR state: open, non-draft, mergeable and clean; not merged.
- Exact-head `Company v1 tests`: GitHub Actions run `32130673396`, job `95690897162`, SUCCESS.
- Focused fixture tests: 9/9 pass.
- Full `npm.cmd test`: 363/363 pass.
- Changed JS/MJS syntax, migration/static contract checks, and `git diff --check`: pass.
- Baseline invariant proof: the current template `game_save.data` is normalized to one validated Level-7, committed-turn-zero, idle baseline; that same `v_data` is used for both new `game_master.initial_save` and new `game_save.data`. The migration contains no `v_template_master.initial_save` copy, and the template save/master rows remain read-only.
- No migration application, TEST game creation/reset/reseed, gameplay call, deployment, provider/model change, merge, or historical migration edit was performed.
- Terminal classification: `FRESH_LEVEL7_TEST_FIXTURE_WRITER_REWORK_READY`.

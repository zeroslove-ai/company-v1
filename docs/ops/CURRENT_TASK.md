# Company v1 — CURRENT TASK

Status: READY
Task ID: fresh-level7-test-fixture-rollout-handoff-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place on `main`. Do not create a new CURRENT_TASK file or a new ops/task-registration branch.

## 0. Owner review decision

Predecessor terminal: Issue #68 comment `5327387270`.

Review: ACCEPT.

Reviewed PR #84:
- final head `489c421ea24737dada4a84b2fe3b86a10ac7837a`;
- correction commit `e570aabb0251ba7ca5f673f36c4123cd6f2b22b7`;
- exact final-head Company v1 tests run `32130763820` SUCCESS;
- focused fixture tests 9/9 PASS;
- full tests 363/363 PASS;
- syntax/static/diff checks PASS;
- no gameplay/Story/Extract runtime semantics changed.

Independent TEST DB review also proved that the dedicated template's current save is an unconfigured valid turn-zero baseline: player unset, scene=`setup`, committed_turn=0, processing_status=`idle`, Level 7, actions=0, turns=0. Replaying the migration normalization against TEST returned `validate_company_save_v1(...).valid=true`.

The corrected migration uses the same validated `v_data` for both the new `game_master.initial_save` and new `game_save.data`, and does not copy the stale historical template initial_save.

PR #84 was merged with exact-head protection.

Merged main authority: `64928ea0cf6a1174de4fdb269bd3be9db8ae75c8`.

This task is only: post-merge verification -> apply the reviewed additive migration to TEST -> create exactly one genuinely fresh Level-7 turn-zero manual fixture -> verify -> STOP for user live acceptance.

## 1. Frozen registration / drift gate

Use the exact `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA` from the latest Issue #68 `CURRENT_TASK_READY` comment for this Task ID.

At start:
1. fresh-fetch `origin/main`;
2. require exact registered main SHA/blob;
3. require the registered main is a docs-only descendant of merge `64928ea0...`;
4. require PR #84 is MERGED with merge commit `64928ea0...` and reviewed head `489c421...`;
5. require no unexpected source/config/content/migration drift after the reviewed merge;
6. if any mismatch, STOP `BLOCKED_FRESH_LEVEL7_ROLLOUT_DRIFT`.

No implementation branch is needed or authorized for this task.

## 2. Post-merge verification before DB write

Before applying anything to TEST:
1. require merged-main Company v1 tests SUCCESS for the exact merged/runtime lineage; if the workflow system does not produce a merge-push run, record that fact and require the already-successful exact PR head CI plus clean merged tree equivalence;
2. run focused fixture tests;
3. run full `npm.cmd test`;
4. run changed JS/MJS syntax checks as applicable;
5. run migration/static contract checks;
6. run `git diff --check`;
7. require all PASS;
8. verify TEST project is exactly `fmcrspgxstsmxxsmkeee`;
9. verify migration `20260818000100_company_v1_fresh_level7_test_fixture.sql` is not already recorded/applied unexpectedly;
10. verify preserved/dedicated games remain present/readable and do not mutate them.

Any failure -> STOP. Do not repair source in this task.

## 3. Apply reviewed migration to TEST only

Apply exactly the merged migration:

`supabase/migrations/20260818000100_company_v1_fresh_level7_test_fixture.sql`

to TEST project `fmcrspgxstsmxxsmkeee` only.

After application verify read-only:
- function `public.create_company_test_level7_fixture(uuid,text)` exists;
- executable only by `service_role`/postgres administrative role as appropriate;
- `public`, `anon`, `authenticated` have no EXECUTE;
- historical `prepare_company_test_level7_fixture(uuid,text)` remains unchanged/fixed-ID;
- no Production/hospital-v2 operation occurred.

Do not deploy API/frontend: PR #84 contains no runtime/frontend source changes and the currently deployed TEST API already carries the accepted Hospital-aligned runtime source tree. This task changes only the TEST DB fixture seam.

## 4. Final manual fixture — genuinely new UUID only

This is the LAST operational step.

1. Generate a genuinely new UUID locally at execution time. Do not reuse any UUID from prior reports, comments, tests, examples, preserved games, or earlier failed candidates.
2. Before any write, prove the exact candidate UUID is absent from ALL five tables:
   - `games`
   - `game_master`
   - `game_save`
   - `game_actions`
   - `game_turns`
3. If any row exists, discard that UUID, generate another, and repeat the read-only absence proof before any write.
4. Also fail closed if the UUID equals any dedicated/preserved/Production identity.
5. Give it a clearly TEST-only title such as `Company v1 Manual Acceptance 2026-08-18`.
6. Call the NEW RPC exactly once for that UUID/title. Do not call reset first or after. Do not directly insert/update/delete fixture rows through REST/SQL outside the RPC.
7. Do not mutate the template or any pre-existing game.

## 5. Post-create acceptance proof

For the newly-created UUID, verify read-only:
- exactly one `games` row;
- exactly one `game_master` row;
- exactly one `game_save` row;
- `game_actions` count = 0;
- `game_turns` count = 0;
- `game_save.committed_turn = 0`;
- `game_save.save_revision = 0` unless current merged contract proves another creation value;
- `player_progress.level = 7`, `exp = 0`;
- `turn_state.committed_turn = 0`;
- `turn_state.expected_turn = 1`;
- `turn_state.processing_status = idle`;
- `turn_state.turn_id = null`;
- `turn_state.action_id = null`;
- `scene.scene_id = setup` and player remains unconfigured;
- `validate_company_save_v1(game_save.data).valid = true`;
- `validate_company_save_v1(game_master.initial_save).valid = true`;
- `game_master.initial_save = game_save.data` at creation;
- RPC result reports `fresh_creation=true`, `target_reused=false`, `template_read_only=true`, `reset_performed=false`;
- preserved/dedicated game action/turn counts and identity remain unchanged.

Then verify the public TEST frontend route for this exact UUID returns HTTP 200 and can load the game shell. Do not perform Setup/Opening/Story/Extract/Commit to prove this; route/asset/readback smoke only.

## 6. Zero gameplay rule

For this final manual game, automated gameplay calls are absolutely forbidden:
- Setup: 0
- Opening: 0
- Story: 0
- Extract: 0
- Commit: 0
- clicked choice/direct-input gameplay turns: 0

Do not run an automated 15/20/30/50-turn session. Do not retry until lucky. The user is the gameplay-quality acceptance authority.

## 7. Success terminal

On success, overwrite THIS SAME `docs/ops/CURRENT_TASK.md` in place on `main` to:

`Status: WAITING_USER_LIVE_ACCEPTANCE`

Record:
- exact registration main/blob;
- PR #84 merge SHA;
- verification results;
- TEST migration application identity/result;
- new manual game UUID/title;
- pre-write five-table absence proof;
- post-create validation/row counts;
- exact public TEST frontend URL;
- explicit `AUTOMATED_GAMEPLAY_TURNS: 0`.

Post one Issue #68 terminal classification:

`FRESH_LEVEL7_MANUAL_FIXTURE_WAITING_USER_LIVE_ACCEPTANCE`

Then STOP. Do not generate/register another CURRENT_TASK. The user will manually play 30–50+ turns and provide evidence before any further repair/task decision.

## 8. Absolute prohibitions

- no new CURRENT_TASK file;
- no new ops/task-registration branch;
- no source/test/config/content repair;
- no new migration beyond the already-reviewed merged migration;
- no historical migration edit/history repair/broad DB push;
- no reset/reseed/reuse/mutation of any pre-existing game;
- no Production/hospital-v2;
- no API/frontend redeploy unless a new independently verified runtime drift makes this task BLOCKED first;
- no provider/model/TTS/binding change;
- no Story/Extract/gameplay semantic change;
- no automated gameplay in the final fixture;
- no retry/regeneration loop;
- no semantic router/classifier/verifier;
- no relationship/event/emotion/open-fact ledger;
- no generic physical/sexual grammar or generic CSA DSL;
- no next roadmap Cut.

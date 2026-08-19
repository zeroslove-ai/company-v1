# Company v2 — CURRENT TASK

Status: WAITING_USER_5TURN
Task ID: company-v2-phase1-test-auth-probe-and-handoff-v1
Mode: MANUAL ACCEPTANCE HOLD — USER 5 TURNS
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Successful TEST handoff terminal:

- Issue #68 comment `5340544017`
- terminal: `COMPANY_V2_PHASE1_TEST_READY_FOR_USER_5TURN`
- terminal status: `WAITING_USER_5TURN`
- registration main SHA: `7f271bd5e603352bc6bce7db4fcd50975ceef2d9`
- prior task blob: `dcec0529e3ec43665deeafb190fc3dc1d1c9e30e`

Accepted source lineage remains:

- Phase 1 merge: `f80830e48f227e5a3718ecacaec82d9d3427b504`
- ACL closure merge: `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`
- fetch-binding accepted head: `a30c6650817985ca4345687ed11549ba7eadd8f9`
- fetch-binding merge: `272e58d39e7d063923d063467602b54d750d5d60`

TEST project:

`fmcrspgxstsmxxsmkeee`

## Manual acceptance game

Fresh owner acceptance game:

`0daec355-47a8-4b81-a87d-a47dc25b5b96`

Manual URL:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=0daec355-47a8-4b81-a87d-a47dc25b5b96`

Terminal-proven turn-0 state:

- Setup exactly once: PASS
- Opening exactly once on same game: PASS
- committed_turn = 0
- revision = 0
- exactly one turn row, turn_number 0
- Opening Story non-empty
- exactly four non-empty choices
- state keys exactly `player`, `scene`, `time`
- zero turn-job rows
- automated `/api/v2/turn` calls = 0
- no frontend redeploy
- no source/config/test/content/migration change
- no v1/Production/preserved-game mutation

Operator read-only recheck after the terminal still showed:

- committed_turn = 0
- revision = 0
- turn_count = 1
- job_count = 0

Preserved rollout evidence game remains immutable and MUST NOT be reused or mutated:

`88625b46-20fa-42c6-82d5-050a98ee2aad`

## Current required action

No Hermes/Codex task should run now.

Owner/user must manually play at least 5 committed gameplay turns on the fresh acceptance game above.

Manual focus:

- Story streaming is visibly incremental and not hidden by a blocking loading overlay;
- literal player action fidelity is preserved;
- exactly four usable choices remain available;
- one user input produces one gameplay turn;
- no duplicate turn/job rows;
- no stuck `processing` state;
- refresh/reconnect returns to the same canonical job/turn;
- history remains ordered;
- summaries are non-empty after gameplay turns;
- Mind Monitor is relevant-NPC-only;
- no protocol/OOC garbage leaks;
- no player/NPC identity corruption.

Do not treat Phase 2/3 features as Phase 1 blockers.

## Hold rules

Until the user reports the manual 5-turn result:

- do NOT create or register another CURRENT_TASK;
- do NOT post a new `CURRENT_TASK_READY` trigger;
- do NOT submit automated gameplay turns;
- do NOT open the acceptance URL in a browser/headless client on behalf of the user;
- do NOT reset/delete/reuse either v2 evidence game;
- do NOT deploy, migrate, modify secrets, change provider/model values, or start Phase 2;
- do NOT touch v1/Production/preserved games.

If the user reports a bug before completing five turns, inspect that exact game/turn read-only first and register only the narrow source correction required by the proven defect.

If the user completes five committed turns, inspect `company_v2_state`, `company_v2_turns`, and `company_v2_turn_jobs` read-only for turns 1–5 and compare the user-reported semantic behavior against the Phase 1 acceptance criteria before deciding the next task.

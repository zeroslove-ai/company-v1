# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-choice-db-contract-test-rollout-v1
Mode: TEST ROLLOUT — APPLY CHOICE CONTRACT 006 + ONE-TURN SMOKE + OWNER HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted product baseline:

- product-baseline source terminal: Issue #68 `5341256206`
- product-baseline source acceptance: `5341316161`
- product-baseline accepted head: `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`
- product-baseline merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`
- owner product rejection that governs handoff: `5341086841`
- owner rich-narrative law: `5341147788`

Choice DB contract closure:

- triggering TEST terminal: `5341558932`
- root-cause/operator review: `5341646266`
- source task: `company-v2-phase1-choice-db-contract-closure-v1`
- source terminal: `5341760236`
- source acceptance: `5341789672`
- accepted exact head: `ef23d6c9090af17f5eca6f07689fb8067bb75bc1`
- exact-head CI: run `32249903643`, job `96058364387`, SUCCESS
- PR #91 merged at exact reviewed head
- merge commit: `2c010a3ffac07750db72c4ee6035e8a8f1a2f253`
- post-merge TEST baseline note: `5341806014`

TEST project:

`fmcrspgxstsmxxsmkeee`

Existing live Workers are already the accepted product runtime and were not changed by PR #91:

- API: `game-proxy-company-v2`, version `efddd1cb-5421-424c-b399-b7368b7de5a3`
- Frontend: `gamebuilder-company-v2`, version `916dd497-0119-4649-9754-b2e52be84f5f`

Do NOT redeploy either Worker in this task unless unexpected drift is proven; if drift exists, STOP rather than overwriting it.

## 1. Start-state guard / immutable evidence

Independent operator readback after merge proved:

- total `company_v2_games` = **6**;
- migration `20260819000600` count = **0**.

Treat all six existing v2 games as immutable evidence. Do not reset/delete/reuse/mutate them and do not call Company v2 API context on them. Direct read-only SQL only.

1. `88625b46-20fa-42c6-82d5-050a98ee2aad`
2. `09bece94-f2f3-4936-baab-42f64d078708`
3. `0daec355-47a8-4b81-a87d-a47dc25b5b96`
4. `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
5. failed DB-contract smoke game `360725ca-6369-420a-a740-3f9c787e157c`
6. externally created / origin-unresolved setup-only evidence `baab2c62-6782-4023-a55d-eea9f6b22237`

Game 6 was independently observed with exact Korean stored name `플레이어`, committed_turn=0, revision=0, turns=0, jobs=0. Do not infer its origin.

At task start, direct read-only verify:

- total game count is still exactly 6;
- all six IDs exist with unchanged turn/job counts and revisions;
- migrations 002/003/004/005 are recorded exactly once;
- migration 006 is not yet recorded.

Any unexplained game-count drift before this task's first authorized Setup => STOP immediately. Do not delete or absorb the new game.

## 2. Apply exactly one migration: 006 only

The ONLY authorized DB schema/function mutation is applying exactly this already-reviewed migration once:

`supabase/migrations/20260819000600_company_v2_choice_contract_closure.sql`

Never edit/reapply/replay/squash historical migrations:

- `20260819000200_company_v2_phase1_vertical_slice`
- `20260819000300_company_v2_stuck_turn_closure`
- `20260819000400_company_v2_attempt_fencing`
- `20260819000500_company_v2_acl_closure`

Do not modify migration 006 source in this rollout. If application fails, STOP; do not hotfix SQL in TEST.

After apply, prove by read-only catalog queries:

1. migration 006 is recorded exactly once;
2. 002-005 remain exactly once and unchanged;
3. old `company_v2_turns_choices_check` no longer exists;
4. `company_v2_turns_choices_empty_check` exists and requires JSON array length 0;
5. that new CHECK is `NOT VALID` / `convalidated=false`, so historical length-4 rows remain preserved;
6. historical turn rows with choices length 4 are still present/readable and unchanged;
7. `company_v2_create_opening(uuid,text,jsonb,jsonb,text,jsonb)` requires non-null JSON array length 0 while preserving Story/summary/turn-0 behavior;
8. exact fenced `company_v2_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,jsonb,text,jsonb,jsonb)` requires choices length 0;
9. fenced Commit still checks `action_id` and `attempt_no` and uses both in the committed-job update predicate;
10. no unfenced progress/fail/commit overload exists;
11. both replaced RPCs remain SECURITY DEFINER with `search_path=public, pg_temp`;
12. PUBLIC/anon/authenticated have no EXECUTE; service_role alone has EXECUTE for the replaced RPCs;
13. the previously accepted table privilege contract remains unchanged.

No data backfill, historical-row update, reset, deletion, RLS work, or unrelated migration is authorized.

## 3. Deployment / transport guard — NO REDEPLOY

Read-only verify the existing Worker identities/versions and static frontend assets.

Require:

- API remains `game-proxy-company-v2` version `efddd1cb-5421-424c-b399-b7368b7de5a3` unless an external later version exists; if different, identify and STOP;
- Frontend remains `gamebuilder-company-v2` version `916dd497-0119-4649-9754-b2e52be84f5f` under the same rule;
- `/`, `/index.html`, `/config.js`, `/app.js`, `/styles.css` return 200;
- frontend API base is only `https://game-proxy-company-v2.zeroslove.workers.dev`;
- free-form composer/product shell exists and active choice UI is absent;
- CORS OPTIONS `/api/v2/turn` remains browser-valid.

Do not execute the bare frontend root in a browser/headless browser.

Run one verified-absent DB-backed context probe with a fresh UUID.

Expected: canonical structured `game_not_found`.

If the known transient `JWT issued at future` signature appears, one additional fresh verified-absent no-mutation probe is authorized after re-reading trusted UTC. If the second probe also fails, STOP as an ops/auth blocker. Do not rewrite secrets or redeploy in this task.

Any other transport/source error => STOP.

## 4. Fresh smoke game A — UTF-8-safe Setup + Opening

Only after sections 1-3 pass.

Before Setup, re-read total game count; it must still be exactly 6.

Use a UTF-8-safe JavaScript/Node client (`fetch` + `JSON.stringify`), not a shell/codepage-sensitive request body.

### Setup A

Call `/api/v2/setup` exactly once with literal player name:

`플레이어`

No retry/replacement if Setup fails.

Immediately direct-read DB and require:

- exactly one new game A;
- total game count = 7;
- stored `state.player.name` is exactly `플레이어` (not `????`, escaped garbage, mojibake, or fallback text);
- committed_turn=0;
- revision=0;
- turns=0;
- jobs=0.

Any name mismatch => STOP and preserve game A untouched. Do not patch runtime in rollout.

### Opening A

Call `/api/v2/opening` exactly once on the same game A.

No retry/regeneration/replacement if Opening fails.

Require API + direct DB readback:

- committed_turn=0;
- revision=0;
- exactly one turn row: turn 0;
- non-empty Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` exactly;
- zero gameplay jobs;
- stored player name still exactly `플레이어`.

This step must prove the previous `company_v2_opening_invalid` failure is closed by migration 006.

## 5. Smoke game A — exactly ONE automated free-form turn

Submit exactly this literal action once:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Rules:

- exactly one `/api/v2/turn` request;
- action_id generated once;
- expected_turn=1;
- retry_failed=false;
- no hidden or explicit retry/regeneration if anything fails.

Capture the real SSE stream.

Require:

1. at least one `story_delta` event containing actual Story text before terminal;
2. exactly one authoritative terminal event;
3. terminal status `committed`;
4. no silent stream close without authoritative terminal/readback.

After terminal, direct DB readback must prove:

- committed_turn=1;
- revision=1;
- turn rows exactly 0 and 1;
- one canonical turn-1 job only;
- job status `committed`;
- attempt_no=1;
- job literal_action exactly `서원에게 오늘 첫 업무가 무엇인지 물어본다.`;
- turn-1 literal_action exact same string;
- non-empty Story;
- meaningful parsed blocks;
- non-empty turn summary;
- `choices=[]` on both new turn-0 and turn-1 rows;
- no duplicate job/turn;
- no processing/failed residue;
- state_after/readback remains structurally valid.

### Story product judgment

Inspect the actual turn-1 Story text and record its character length.

Reject the smoke if it is:

- a terse status/update;
- only one or two perfunctory sentences;
- bullet/protocol/OOC text;
- replacement of the player's literal intent rather than consequence elaboration.

It should provide substantial interactive-fiction scene progression with concrete reaction/environment/context and character behavior/dialogue when relevant, per owner narrative law `5341147788`.

This is an acceptance judgment only; do not add a new deterministic semantic gate or regenerate the Story.

Any failure in this section => STOP, preserve game A, create no handoff game B.

## 6. Fresh handoff game B — only after smoke A fully passes

Before Setup B, total game count must be exactly 7.

Create exactly one separate fresh game B using the same UTF-8-safe Node/JS client.

### Setup B

- `/api/v2/setup` exactly once;
- player name exactly `플레이어`;
- verify stored Korean name exactly;
- no retry/replacement.

### Opening B

- `/api/v2/opening` exactly once;
- no gameplay turn.

Require:

- total game count = 8;
- committed_turn=0;
- revision=0;
- exactly one turn-0 row;
- non-empty Opening Story;
- `choices=[]`;
- zero gameplay jobs;
- stored player name exactly `플레이어`.

Do not browser-open the handoff URL in this task.

Return exactly:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<HANDOFF_GAME_B>`

Then STOP for owner manual acceptance.

## 7. Operation limits

Across this rollout:

- migration applications: exactly 1 (`006`) if task reaches apply;
- edits to migration files: 0;
- Worker deployments: 0;
- secret changes: 0;
- fresh v2 games: at most 2;
- expected game-count sequence: 6 -> 7 -> 8;
- automated gameplay turns: exactly 1 total on smoke A;
- automated gameplay on handoff B: 0;
- retries/regenerations/resets/deletions: 0;
- v1 access/mutation: 0;
- Production access/mutation: 0;
- provider/model changes: 0;
- Phase 2 work: 0.

Any source defect discovered after applying 006 => STOP and preserve evidence. Do not hotfix inside rollout; register a narrow source correction only after operator review.

## 8. Required terminal

### Success

Post:

`COMPANY_V2_PHASE1_CHOICE_DB_CONTRACT_TEST_READY_FOR_USER`

Status: `WAITING_USER_ACCEPTANCE`

Include:

- task identity and execution lease;
- accepted source head / merge / source review;
- migration 006 apply proof and ledger count;
- live constraint definition + `convalidated=false` proof;
- historical four-choice rows preserved/readable;
- Opening/Commit function definitions and empty-choice rule;
- fencing/ACL/no-overload proof;
- unchanged Worker versions and zero deploys;
- transport/CORS/auth probe result;
- baseline six immutable game IDs and confirmation untouched;
- smoke game A ID;
- exact UTF-8 player-name DB readback;
- exact one literal action;
- SSE event counts/order and terminal status;
- turn/job/revision/count readback;
- Story character length and product-law judgment;
- handoff game B ID;
- handoff DB readback;
- full handoff URL;
- `automated_gameplay_turns_total=1`;
- `authorized_new_games_created<=2`;
- final game count exactly 8;
- confirmation: no v1/Production/provider/model/secret/retry/reset/Phase2 operation.

Then STOP. Do not create another CURRENT_TASK.

### Failure

Post:

`COMPANY_V2_PHASE1_CHOICE_DB_CONTRACT_TEST_BLOCKED`

Status: `BLOCKED`

Identify the first deterministic failure and stop immediately. Preserve any fresh game created before failure. No retry, replacement, reset, delete, redeploy, secret repair, source hotfix, extra migration, or second gameplay attempt.

Then STOP at review boundary. Do not create another CURRENT_TASK.
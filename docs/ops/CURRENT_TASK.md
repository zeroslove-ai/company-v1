# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-choice-db-contract-test-rollout-resume-v1
Mode: TEST OPS RESUME — FREEZE EXECUTION BASELINE + APPLY 006 + ONE-TURN SMOKE + OWNER HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration/source branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted product baseline:

- product source terminal: Issue #68 `5341256206`
- product source acceptance: `5341316161`
- accepted product head: `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`
- product merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`
- owner product rejection / free-input law: `5341086841`
- owner rich-narrative law: `5341147788`

Choice DB contract closure:

- root-cause review: `5341646266`
- source task: `company-v2-phase1-choice-db-contract-closure-v1`
- source terminal: `5341760236`
- source acceptance: `5341789672`
- accepted exact head: `ef23d6c9090af17f5eca6f07689fb8067bb75bc1`
- exact-head CI: run `32249903643`, job `96058364387`, SUCCESS
- PR #91 exact-head merge: `2c010a3ffac07750db72c4ee6035e8a8f1a2f253`
- migration source: `supabase/migrations/20260819000600_company_v2_choice_contract_closure.sql`

Previous rollout:

- prior rollout task: `company-v2-phase1-choice-db-contract-test-rollout-v1`
- prior READY: `5341829424`
- execution lease: `5341847680`
- blocked terminal: `5341868849`
- operator blocked review: `5341898813`

TEST project:

`fmcrspgxstsmxxsmkeee`

Accepted live Workers were not changed by PR #91:

- API Worker: `game-proxy-company-v2`
- accepted live API version: `efddd1cb-5421-424c-b399-b7368b7de5a3`
- Frontend Worker: `gamebuilder-company-v2`
- accepted live frontend version: `916dd497-0119-4649-9754-b2e52be84f5f`

Do NOT redeploy either Worker in this task. If the live version has changed externally, identify it and STOP rather than overwriting it.

## 1. Why the previous rollout stopped

The previous run reached no DB mutation and no API request.

Its start guard expected the six previously catalogued games, but direct SQL found one additional pre-existing setup-only game:

`e2b7019b-ed17-493f-8871-502acbc6e795`

Observed state:

- created_at: `2026-08-19T12:02:41.457Z`
- revision = 0
- committed_turn = 0
- turns = 0
- jobs = 0

The runner did not infer its origin, did not call API context on it, and did not mutate it.

Because the old task required total game count exactly 6, it correctly STOPPED before migration 006.

Operator readback after the terminal confirmed:

- total v2 games = 7;
- migration 006 count = 0;
- all seven rows remain preserved.

This is an ops start-state race/baseline issue, not evidence that the accepted source or migration 006 is defective.

## 2. Execution-start baseline freeze — refined race guard

The purpose of this rule is to distinguish a game that already existed before this runner obtained its execution lease from a game created during this runner's operation.

### 2.1 Known immutable baseline at registration

The currently known seven v2 games are immutable evidence:

1. `88625b46-20fa-42c6-82d5-050a98ee2aad`
2. `09bece94-f2f3-4936-baab-42f64d078708`
3. `0daec355-47a8-4b81-a87d-a47dc25b5b96`
4. `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
5. `360725ca-6369-420a-a740-3f9c787e157c`
6. `baab2c62-6782-4023-a55d-eea9f6b22237`
7. `e2b7019b-ed17-493f-8871-502acbc6e795`

Do not reset/delete/reuse/mutate them. Do not call Company v2 API context on them. Direct read-only SQL only.

### 2.2 One-time execution-start absorption rule

Immediately after posting the task's `EXECUTION: STARTED` lease comment, capture trusted UTC and read all `company_v2_games/state/turn/job` rows directly.

Let `N` be the frozen baseline game count.

If the DB contains only the seven known games, set `N=7`.

If one or more additional IDs exist, they may be absorbed into the immutable baseline ONLY when ALL are true:

1. `created_at` is strictly earlier than the execution-lease timestamp;
2. revision = 0;
3. committed_turn = 0;
4. turn count = 0;
5. job count = 0;
6. the current runner has not called any API endpoint for that ID;
7. no origin is inferred or invented.

For every absorbed ID, record its ID/created_at/state counts in the terminal evidence and treat it immutable for the rest of the task.

If any additional game fails any one of those conditions, STOP before migration application.

After this single execution-start baseline freeze, the absorption rule is CLOSED. From that moment until authorized Setup A, any new game ID or game-count increase is an unexplained in-run drift and forces immediate STOP.

Do not delete/reset/repair any unexpected game.

## 3. Migration preflight

Before applying anything, direct-read and require:

- migrations `20260819000200`, `00300`, `00400`, `00500` each recorded exactly once;
- migration `20260819000600` recorded exactly zero times;
- reviewed migration file in current main is byte-identical to accepted/merged PR #91 source;
- no source/runtime/frontend/config delta exists that requires a Worker deploy.

If migration 006 is already recorded, STOP rather than replay it.

Historical migrations 002-005 are immutable. Never edit/replay/squash/rename them.

## 4. Apply exactly migration 006 once

The ONLY authorized DB schema/function mutation is applying exactly:

`20260819000600_company_v2_choice_contract_closure.sql`

Apply it through the normal isolated migration path exactly once.

Do not apply any other pending migration.
Do not edit migration source in this rollout.
If apply fails, STOP. Do not hotfix SQL in TEST.

After apply, direct-read catalog and prove:

1. migration 006 ledger count = 1;
2. migrations 002-005 remain exactly once;
3. old `company_v2_turns_choices_check` is absent;
4. `company_v2_turns_choices_empty_check` exists;
5. its definition requires JSON array length exactly 0;
6. `convalidated=false` / NOT VALID remains, preserving historical rows;
7. historical length-4 choice rows remain present, readable, byte/logically unchanged;
8. `company_v2_create_opening(uuid,text,jsonb,jsonb,text,jsonb)` requires non-null JSON-array `choices=[]` while retaining Story/summary/turn-0 semantics;
9. exact fenced `company_v2_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,jsonb,text,jsonb,jsonb)` requires `choices=[]`;
10. Commit still checks `action_id` and `attempt_no` before commit and uses both in the final committed-job update predicate;
11. no unfenced progress/fail/commit overload exists;
12. the two replaced RPCs remain SECURITY DEFINER with `search_path=public, pg_temp`;
13. PUBLIC/anon/authenticated have no EXECUTE and service_role has EXECUTE for those exact RPC signatures;
14. accepted table privileges remain unchanged.

No backfill/update/delete/reset/RLS/unrelated DB work is authorized.

## 5. Deployment / transport guard — zero redeploy

Read-only verify live Worker identities and versions.

Require exact versions unless an external later deployment is present:

- API: `efddd1cb-5421-424c-b399-b7368b7de5a3`
- Frontend: `916dd497-0119-4649-9754-b2e52be84f5f`

If either differs, record the newer version and STOP. Do not overwrite it.

Static HTTP only for frontend:

- `/`
- `/index.html`
- `/config.js`
- `/app.js`
- `/styles.css`

Require 200, product shell/free-form composer present, active choice UI absent, API base only `https://game-proxy-company-v2.zeroslove.workers.dev`, and no v1 runtime authority.

Do not execute the bare frontend root in browser/headless JavaScript.

Verify CORS OPTIONS `/api/v2/turn`.

Generate one fresh absent UUID, direct-confirm absent, then call context exactly once.
Expected: canonical `game_not_found`.

If the known transient `JWT issued at future` signature appears, one second fresh verified-absent no-mutation probe is allowed after re-reading trusted UTC. If the second fails, STOP. No secret rewrite/redeploy in this task.

Any other transport/source error => STOP.

After these gates, re-read total game count. It must still equal frozen baseline `N`. If it does not, STOP.

## 6. Smoke game A — UTF-8-safe Setup + Opening

Use only UTF-8-safe JavaScript/Node `fetch` + `JSON.stringify`. Do not use shell/codepage-sensitive body construction.

### Setup A

Call `/api/v2/setup` exactly once with player name exactly:

`플레이어`

No retry/replacement.

Direct-read immediately and require:

- exactly one new game A;
- total game count = `N+1`;
- stored `state.player.name` exactly `플레이어`;
- committed_turn = 0;
- revision = 0;
- turns = 0;
- jobs = 0.

Any mismatch => STOP and preserve game A.

### Opening A

Call `/api/v2/opening` exactly once on game A.
No retry/regeneration/replacement.

Require API + direct DB:

- committed_turn = 0;
- revision = 0;
- exactly one turn-0 row;
- non-empty Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` exactly;
- zero gameplay jobs;
- stored Korean player name still exactly `플레이어`;
- total count remains `N+1`.

This must prove the former `company_v2_opening_invalid` exact-four failure is closed.

## 7. Smoke game A — exactly ONE automated gameplay turn

Submit exactly once:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Request requirements:

- one `/api/v2/turn` call total;
- one newly generated action_id;
- expected_turn = 1;
- retry_failed = false;
- no retry/regeneration under any failure.

Capture real SSE bytes/events.

Require:

1. at least one real `story_delta` before terminal;
2. exactly one authoritative terminal;
3. terminal status `committed`;
4. no silent close without authoritative terminal/readback.

Direct DB after commit must prove:

- committed_turn = 1;
- revision = 1;
- turn rows exactly 0 and 1;
- one canonical turn-1 job;
- job status `committed`;
- attempt_no = 1;
- job literal_action exact input string;
- turn-1 literal_action exact input string;
- turn-1 Story non-empty;
- parsed blocks meaningful;
- summary non-empty;
- `choices=[]` for both new turn 0 and 1;
- no duplicate turn/job;
- no processing/failed residue;
- state_after structurally valid;
- total game count remains `N+1`.

### Rich narrative owner-law judgment

Record turn-1 Story character length and actual content for operator review.

Reject if it is only a terse status/update, one or two perfunctory sentences, bullet/protocol/OOC text, or replaces the player's literal intent instead of elaborating consequences.

Require substantial interactive-fiction scene progression with concrete reaction/environment/context and character behavior/dialogue where relevant, per `5341147788`.

Do not regenerate a weak Story to make the test pass.

Any failure => STOP and preserve A. Do not create B.

## 8. Handoff game B — only after A fully passes

Before Setup B, require total game count exactly `N+1`.

Using the same UTF-8-safe Node/JS client:

### Setup B

- `/api/v2/setup` exactly once;
- player name exactly `플레이어`;
- DB name exactly `플레이어`;
- no retry/replacement.

### Opening B

- `/api/v2/opening` exactly once;
- zero gameplay turns.

Require:

- total game count = `N+2`;
- committed_turn = 0;
- revision = 0;
- exactly one turn-0 row;
- non-empty Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` exactly;
- zero jobs;
- stored Korean player name exactly `플레이어`.

Do not browser-open B.

Handoff URL:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<HANDOFF_GAME_B>`

Then STOP for owner manual play acceptance.

## 9. Hard operation limits

- baseline game count: `N`, frozen exactly once at execution start;
- current known registration baseline: 7;
- pre-lease setup-only absorption: allowed only once under section 2.2;
- post-freeze unexplained game drift: immediate STOP;
- migration applications: exactly 1, migration 006 only, if task reaches apply;
- migration source edits: 0;
- Worker deployments: 0;
- secret/config/provider/model changes: 0;
- new authorized games: at most 2;
- expected authorized count path after freeze: `N -> N+1 -> N+2`;
- automated gameplay turns: exactly 1 total, smoke A only;
- handoff B automated gameplay: 0;
- retries/regenerations/resets/deletions: 0;
- preserved-game API context calls: 0;
- v1 access/mutation: 0;
- Production access/mutation: 0;
- Phase 2 work: 0.

If a true source defect appears after migration application, STOP and preserve evidence. Do not hotfix within rollout.

## 10. Required terminal

### Success

Post:

`COMPANY_V2_PHASE1_CHOICE_DB_CONTRACT_TEST_READY_FOR_USER`

Status: `WAITING_USER_ACCEPTANCE`

Include at minimum:

- task ID / execution lease / registration SHA / task blob;
- frozen baseline `N` and all immutable baseline IDs;
- any pre-lease absorbed IDs and exact eligibility proof;
- migration 006 apply/ledger proof;
- live choice CHECK definition + `convalidated=false`;
- historical four-choice rows preserved;
- Opening/Commit empty-choice contract;
- fencing/ACL/no-unfenced-overload proof;
- unchanged Worker versions and zero deployments;
- transport/CORS/auth probe;
- smoke game A ID;
- exact UTF-8 Korean DB name;
- exact literal action;
- SSE event counts/order and committed terminal;
- turn/job/revision DB readback;
- Story character length and owner-law judgment;
- handoff game B ID and DB readback;
- explicit handoff URL;
- final game count `N+2`;
- automated gameplay turns total = 1;
- confirmation of zero retry/reset/secret/provider/model/v1/Production/Phase2 actions.

Then STOP. Do not create the next CURRENT_TASK.

### Failure

Post:

`COMPANY_V2_PHASE1_CHOICE_DB_CONTRACT_TEST_RESUME_BLOCKED`

Status: `BLOCKED`

Identify the first deterministic failure and preserve all evidence. Include whether migration 006 was applied and whether A/B were created.

No retry/replacement/reset/delete/redeploy/secret repair/source hotfix/extra migration/second gameplay attempt.

Then STOP at review boundary. Do not create another CURRENT_TASK.
# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-subrequest-budget-test-rollout-v1
Mode: TEST ROLLOUT — DEPLOY ACCEPTED API + FRESH ONE-TURN SMOKE + OWNER HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted product / choice contract:

- owner free-input/product law: Issue #68 `5341086841`
- owner rich-narrative law: `5341147788`
- product baseline merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`
- choice DB source acceptance: `5341789672`
- choice DB merge: `2c010a3ffac07750db72c4ee6035e8a8f1a2f253`
- migration 006: `20260819000600_company_v2_choice_contract_closure.sql`

Accepted subrequest-budget closure:

- source task: `company-v2-phase1-subrequest-budget-closure-v1`
- source terminal: `5342205511`
- operator source acceptance: `5342251062`
- accepted exact head: `0b7aaeb1c44c034384198cfd6108b1e4ed726a1a`
- exact-head CI: run `32253580067`, job `96069985737`, SUCCESS
- PR #92 exact-head merge: `ccdf41f432102cbf7e930732bacdd8d8d3667c22`

TEST project:

`fmcrspgxstsmxxsmkeee`

Pre-rollout live Worker identities from the last accepted TEST evidence:

- API: `game-proxy-company-v2`, version `efddd1cb-5421-424c-b399-b7368b7de5a3`
- Frontend: `gamebuilder-company-v2`, version `916dd497-0119-4649-9754-b2e52be84f5f`

This task may deploy the API Worker exactly once from the accepted merged source. Frontend deployment is not authorized.

## 1. Immutable evidence / execution-start baseline freeze

Independent operator readback after PR #92 merge proved:

- total `company_v2_games` = **8**;
- migration `20260819000600` ledger count = **1**.

Known immutable v2 games:

1. `88625b46-20fa-42c6-82d5-050a98ee2aad`
2. `09bece94-f2f3-4936-baab-42f64d078708`
3. `0daec355-47a8-4b81-a87d-a47dc25b5b96`
4. `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
5. `360725ca-6369-420a-a740-3f9c787e157c`
6. `baab2c62-6782-4023-a55d-eea9f6b22237`
7. `e2b7019b-ed17-493f-8871-502acbc6e795`
8. prior subrequest-failure smoke `9cda9783-76ae-436e-a517-a5c9377d273f`

Game 8 is especially sensitive. Latest direct SQL proves:

- committed_turn=0 / revision=0;
- exactly one turn-0 Opening row;
- exactly one turn-1 job;
- action_id `168c405a-08a6-4d19-87b6-2b52637028d1`;
- attempt_no=1;
- status=`processing`;
- literal action `서원에게 오늘 첫 업무가 무엇인지 물어본다.`;
- partial story length=53;
- error_code NULL.

Never retry/reset/delete/reuse/repair Game 8. **Never call Company v2 context/getJob API on it**, because those paths can run stale-expiry mutation. Direct read-only SQL only.

Immediately after posting `EXECUTION: STARTED`, capture trusted UTC and direct-read all v2 game/state/turn/job rows. Freeze baseline count as `N`.

If only the eight known IDs exist, `N=8`.

A pre-lease additional ID may be absorbed into immutable baseline only if ALL are true:

- created_at is strictly before the execution-lease timestamp;
- revision=0;
- committed_turn=0;
- turn count=0;
- job count=0;
- this runner has not called any API endpoint for it;
- origin is not inferred.

Record every absorbed ID. If an additional row fails any condition, STOP.

After the one-time freeze, absorption closes. Any unexplained new game/count increase before authorized Setup C forces STOP.

## 2. DB contract preflight — no migration apply

Direct-read and require:

- migrations 002/003/004/005/006 each recorded exactly once;
- no later Company v2 migration has appeared unexpectedly;
- `company_v2_turns_choices_empty_check` exists, requires JSON-array length 0, and remains `convalidated=false`;
- old exact-four choices CHECK remains absent;
- historical exact-four rows remain readable/untouched;
- Opening and exact fenced Commit still require `choices=[]`;
- Commit action_id + attempt_no fencing remains intact;
- no unfenced progress/fail/commit overload exists;
- replaced RPC ACL remains service_role-only;
- service_role table privileges remain SELECT-only as accepted.

Migration applications in this task: **0**.

Any DB contract drift => STOP. Do not repair it in this rollout.

## 3. Deploy accepted API source exactly once

Before deploy, verify repository main is the accepted merge lineage and contains:

- merge `ccdf41f432102cbf7e930732bacdd8d8d3667c22`;
- accepted source head `0b7aaeb1c44c034384198cfd6108b1e4ed726a1a` as its reviewed parent;
- `MAX_PROGRESS_WRITES_PER_ATTEMPT = 4`;
- `PROGRESS_SNAPSHOT_INTERVAL_CHARS = 512`;
- unchanged `wrangler.v2.api.jsonc` provider/model/config values.

Read live Worker versions before mutation.

Require pre-deploy API version `efddd1cb-5421-424c-b399-b7368b7de5a3`. If an external later API deployment exists, identify it and STOP rather than overwriting unknown work.

Require frontend version remains `916dd497-0119-4649-9754-b2e52be84f5f`. If different, identify and STOP. Never deploy frontend.

Deploy exactly once from current accepted main using the dedicated config:

`wrangler.v2.api.jsonc`

Target must remain:

`game-proxy-company-v2`

Capture the new API Worker version/deployment identity and prove it is the deployment produced by this execution.

Forbidden:

- second API deploy;
- frontend deploy;
- secret rewrite;
- provider/model/config change;
- subrequest-limit/plan configuration change;
- v1 or Production deploy/access.

If deploy fails, STOP. Do not repair with a second deploy.

## 4. Transport/static gates after deploy

Require:

- API Worker is the newly deployed version from section 3;
- frontend Worker version is unchanged;
- `/`, `/index.html`, `/config.js`, `/app.js`, `/styles.css` return 200;
- frontend API base remains only `https://game-proxy-company-v2.zeroslove.workers.dev`;
- free-form composer/product shell exists;
- active choice UI is absent;
- CORS OPTIONS `/api/v2/turn` is browser-valid.

Do not browser/headless-open the bare frontend root.

Run one fresh verified-absent context probe. Expected canonical `game_not_found`.

If the known transient `JWT issued at future` appears, exactly one additional fresh verified-absent probe is allowed after trusted UTC comparison. If the second fails, STOP. No secret rewrite/redeploy.

Before creating a game, direct-read count and require it still equals frozen `N`.

## 5. Fresh Smoke C — Setup + Opening

Use UTF-8-safe JavaScript/Node `fetch` + `JSON.stringify` only.

### Setup C

Call `/api/v2/setup` exactly once with player name exactly:

`플레이어`

No retry/replacement.

Direct DB require:

- exactly one new game C;
- total count=`N+1`;
- stored `state.player.name` exactly `플레이어`;
- committed_turn=0;
- revision=0;
- turns=0;
- jobs=0.

### Opening C

Call `/api/v2/opening` exactly once on C.
No retry/regeneration/replacement.

Require:

- committed_turn=0 / revision=0;
- exactly one turn-0 row;
- non-empty Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` exactly;
- jobs=0;
- Korean player name unchanged;
- total count=`N+1`.

Any failure => STOP and preserve C. Do not create handoff D.

## 6. Fresh Smoke C — exactly one automated gameplay turn

Submit exactly once:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Request:

- one `/api/v2/turn` request total;
- one newly generated action_id;
- expected_turn=1;
- retry_failed=false;
- no retry/regeneration under any outcome.

Capture the real SSE stream.

Require:

1. at least one real `story_delta` before terminal;
2. every observed delta remains ordinary streamed Story text, not protocol/error payload;
3. exactly one authoritative terminal;
4. terminal status=`committed`;
5. terminal/error stream must not contain `Too many subrequests` or equivalent Worker subrequest exhaustion;
6. no silent close without authoritative terminal/readback.

Direct DB after terminal must prove:

- committed_turn=1;
- revision=1;
- turn rows exactly 0 and 1;
- exactly one canonical turn-1 job;
- job status=`committed`;
- attempt_no=1;
- literal_action in job and turn exactly `서원에게 오늘 첫 업무가 무엇인지 물어본다.`;
- non-empty full turn-1 Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` on turn 0 and turn 1;
- no duplicate turn/job;
- no processing/failed residue for C;
- structurally valid state_after;
- total count=`N+1`.

Record SSE delta count/order, terminal, Story character length, and elapsed timing evidence available from the runner.

### Owner rich-narrative judgment

Reject if Story is merely a terse status/update, one or two perfunctory sentences, bullet/protocol/OOC text, or replaces the literal player intent rather than elaborating consequences.

Require substantial interactive-fiction scene progression with concrete reaction/environment/context and character behavior/dialogue where relevant, per owner law `5341147788`.

Do not regenerate a weak Story.

Any failure => STOP and preserve C. Do not create D.

## 7. Handoff D — only after Smoke C fully passes

Before Setup D require total count exactly `N+1`.

Create exactly one separate game D using the same UTF-8-safe Node/JS path.

### Setup D

- `/api/v2/setup` exactly once;
- player name exactly `플레이어`;
- direct DB name exactly `플레이어`;
- no retry/replacement.

### Opening D

- `/api/v2/opening` exactly once;
- zero gameplay turns.

Require:

- total count=`N+2`;
- committed_turn=0;
- revision=0;
- exactly one turn-0 row;
- non-empty Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]`;
- zero jobs;
- stored Korean name exactly `플레이어`.

Do not browser-open D.

Return exactly:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<HANDOFF_GAME_D>`

Then STOP for owner manual play acceptance.

## 8. Hard operation limits

- execution baseline: `N`, frozen once;
- known registration baseline: 8;
- API deployments: exactly 1 if task reaches deploy;
- frontend deployments: 0;
- migration applications/edits: 0;
- secret/provider/model/config changes: 0;
- fresh authorized games: at most 2;
- expected authorized count path: `N -> N+1 -> N+2`;
- automated gameplay turns: exactly 1 total, Smoke C only;
- handoff D automated gameplay: 0;
- retries/regenerations/resets/deletes/repairs: 0;
- preserved-game API context/getJob calls: 0;
- v1/Production access/mutation: 0;
- Phase 2 work: 0.

If a source defect appears, STOP and preserve evidence. Do not hotfix source during rollout.

## 9. Required terminal

### Success

Post:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_TEST_READY_FOR_USER`

Status: `WAITING_USER_ACCEPTANCE`

Include at minimum:

- task ID / execution lease / registration SHA / CURRENT_TASK blob;
- accepted source head / merge / source review;
- frozen baseline `N` and immutable IDs;
- any pre-lease absorbed IDs and eligibility proof;
- migration 002-006 readback and choice/fencing/ACL proof;
- pre/post API Worker version and exact one-deploy proof;
- unchanged frontend version and zero frontend deploys;
- transport/static/CORS/auth probe results;
- Smoke C ID;
- exact Korean player-name readback;
- exact literal action and action_id;
- real SSE delta count/order and exactly one committed terminal;
- explicit no-subrequest-exhaustion result;
- turn/job/revision/count readback;
- Story character length and owner-law judgment;
- Handoff D ID and DB readback;
- full handoff URL;
- final game count=`N+2`;
- automated_gameplay_turns_total=1;
- confirmation of zero retry/reset/delete/secret/provider/model/config/frontend-deploy/migration/v1/Production/Phase2 actions.

Then STOP. Do not create another CURRENT_TASK.

### Failure

Post:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_TEST_BLOCKED`

Status: `BLOCKED`

Identify the first deterministic failure and stop immediately. Preserve any fresh game created before failure. No retry, replacement, reset, delete, second deploy, secret repair, source hotfix, migration, or additional gameplay attempt.

Then STOP at the review boundary. Do not create another CURRENT_TASK.
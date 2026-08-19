# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-subrequest-budget-test-rollout-utf8-resume-v1
Mode: TEST ROLLOUT RESUME — REUSE DEPLOYED API + ASCII-ONLY UTF-8 HARNESS + FRESH ONE-TURN SMOKE + OWNER HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / accepted source

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted product law:

- owner free-input/product law: Issue #68 `5341086841`
- owner rich-narrative law: `5341147788`
- product baseline merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`

Accepted choice DB contract:

- source acceptance: `5341789672`
- source merge: `2c010a3ffac07750db72c4ee6035e8a8f1a2f253`
- migration 006: `20260819000600_company_v2_choice_contract_closure.sql`

Accepted subrequest-budget source correction:

- source terminal: `5342205511`
- source acceptance: `5342251062`
- accepted head: `0b7aaeb1c44c034384198cfd6108b1e4ed726a1a`
- exact-head CI run/job: `32253580067` / `96069985737`, SUCCESS
- merge: `ccdf41f432102cbf7e930732bacdd8d8d3667c22`

Previous TEST rollout:

- task: `company-v2-phase1-subrequest-budget-test-rollout-v1`
- READY: `5342303801`
- execution lease: `5342332288`
- BLOCKED terminal: `5342409308`
- operator review: `5342470445`

TEST project:

`fmcrspgxstsmxxsmkeee`

This task is an operational resume only. No source correction, migration, or redeploy is authorized.

## 1. Proven first failure from previous rollout

The previous rollout reached fresh Setup C only after its authorized API deploy and read-only preflight stages had completed.

Its first deterministic failure was the test harness itself:

- intended player name: `플레이어`
- intended code points: `[54028,47112,51060,50612]`
- actual stored name: `????`
- actual stored code points: `[63,63,63,63]`
- cause: PowerShell here-string/codepage transport converted the Korean literal before Node received it.

No runtime/provider/gameplay quality conclusion is valid from that request.

Failed harness evidence game:

`cc6d45ab-c261-43b0-a84a-93f661ec1683`

Independent DB readback:

- committed_turn=0
- revision=0
- turns=0
- jobs=0
- player.name=`????`

Preserve it immutable. Never retry, open, reset, delete, repair, reuse, or context/getJob API-call it.

## 2. Current immutable TEST baseline

Independent operator readback after the BLOCKED terminal proves:

- total `company_v2_games` = **9**
- migration 006 ledger count = **1**

The exact nine immutable game IDs are:

1. `88625b46-20fa-42c6-82d5-050a98ee2aad`
2. `09bece94-f2f3-4936-baab-42f64d078708`
3. `0daec355-47a8-4b81-a87d-a47dc25b5b96`
4. `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
5. `360725ca-6369-420a-a740-3f9c787e157c`
6. `baab2c62-6782-4023-a55d-eea9f6b22237`
7. `e2b7019b-ed17-493f-8871-502acbc6e795`
8. prior subrequest-failure smoke `9cda9783-76ae-436e-a517-a5c9377d273f`
9. harness-corrupted Setup-only smoke `cc6d45ab-c261-43b0-a84a-93f661ec1683`

Games 8 and 9 are especially sensitive. Direct SQL only. Never call context/getJob API on either.

Immediately after posting `EXECUTION: STARTED`, direct-read the current v2 games/state/turn/jobs and require the exact nine IDs above and total count=9. No pre-lease absorption is allowed in this resume task. Any unexplained tenth game before authorized fresh Setup E => STOP.

Expected successful fresh-game count path is exactly:

`9 -> 10 -> 11`

## 3. Reuse the API deployment already produced by the previous rollout

API deployments authorized in this resume task: **0**.
Frontend deployments: **0**.

The previous rollout had to pass its deploy gate before it reached Setup C. Therefore do not deploy again.

Before any API request:

1. Read Issue #68 previous execution/terminal evidence and recover the exact API Worker deployment/version identity produced by `company-v2-phase1-subrequest-budget-test-rollout-v1`.
2. Read current live deployment/version identity of `game-proxy-company-v2`.
3. Require exact parity with that previous-run deployment identity.
4. Require frontend `gamebuilder-company-v2` unchanged from the prior accepted TEST identity; never deploy it.
5. Verify current main remains a docs-only descendant of source merge `ccdf41f432102cbf7e930732bacdd8d8d3667c22` and runtime still contains `MAX_PROGRESS_WRITES_PER_ATTEMPT = 4` and `PROGRESS_SNAPSHOT_INTERVAL_CHARS = 512`.

If the prior deployment identity cannot be recovered exactly, or live API identity differs, STOP. Do not deploy over unknown work.

No secret/provider/model/config/subrequest-limit change.

## 4. Read-only DB and transport preflight

Before creating a game require:

- migrations 002/003/004/005/006 each exactly once;
- no unexpected later Company v2 migration;
- active `company_v2_turns_choices_empty_check` still enforces array length 0 and remains NOT VALID / `convalidated=false`;
- old exact-four choices CHECK absent;
- Opening and fenced Commit remain empty-choice-only;
- action_id + attempt_no/status/revision/turn fencing intact;
- no unfenced progress/fail/commit overload;
- RPC ACL still service_role-only;
- service_role table privileges not broadened;
- current game count still 9.

Read-only transport/static gates:

- frontend static shell assets return 200;
- API base remains `https://game-proxy-company-v2.zeroslove.workers.dev`;
- free-form composer/product shell present;
- active choice UI absent;
- `/api/v2/turn` OPTIONS remains browser-valid;
- one fresh verified-absent context probe returns canonical `game_not_found`.

If the known transient `JWT issued at future` occurs on that absent probe, exactly one second verified-absent probe is allowed after trusted UTC comparison. No secret repair/redeploy.

## 5. Mandatory ASCII-only Node harness

Do not reuse the failed stdin/here-string Korean path.

Create one temporary `.mjs` file **outside the repository**. It is test machinery only and must not be committed.

The file source bytes must be ASCII-only. Korean literals must not physically appear in the temp source file.

Construct the player name in JavaScript from code points or Unicode escapes, for example:

```js
const playerName = String.fromCodePoint(0xD50C, 0xB808, 0xC774, 0xC5B4);
```

This must yield exactly `플레이어`.

Construct the gameplay action from ASCII-only Unicode escapes/code points equivalent to:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

A valid escaped form is:

```js
const literalAction = "\uC11C\uC6D0\uC5D0\uAC8C \uC624\uB298 \uCCAB \uC5C5\uBB34\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uBB3C\uC5B4\uBCF8\uB2E4.";
```

Before the first HTTP request the Node process itself must assert:

- playerName code points exactly `[54028,47112,51060,50612]`;
- playerName UTF-8 round-trip through `Buffer.from(playerName, 'utf8').toString('utf8')` is unchanged;
- literalAction round-trip through UTF-8 is unchanged;
- temp script source contains no byte > 0x7F.

Use Node native `fetch` and native `JSON.stringify` inside that same process. Do not pipe JSON through PowerShell stdin. Do not interpolate Korean in shell variables. Do not use curl body literals.

If any local harness assertion fails, STOP **before** any Setup request.

## 6. Fresh Smoke E — one Setup, one Opening, one gameplay turn

After all gates pass, direct-read game count and require exactly 9.

### Setup E

Call `/api/v2/setup` exactly once from the verified ASCII-only Node harness.

Body must be generated inside Node from:

```js
{ player_name: playerName }
```

No retry/replacement.

Immediately direct-read DB and require:

- one new game E only;
- total count=10;
- stored `state.player.name` exactly `플레이어`;
- stored name code points exactly `[54028,47112,51060,50612]`;
- committed_turn=0;
- revision=0;
- turns=0;
- jobs=0.

Any mismatch => STOP and preserve E. Do not call Opening.

### Opening E

Call `/api/v2/opening` exactly once.

Require direct DB:

- total count=10;
- committed_turn=0 / revision=0;
- exactly one turn-0 row;
- non-empty/substantial Opening story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` exactly;
- jobs=0;
- player name remains exact Korean.

Any failure => STOP and preserve E.

### Gameplay E

Submit exactly once, using the ASCII-only Node-generated `literalAction`:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Request contract:

- one `/api/v2/turn` request total;
- one newly generated action_id;
- expected_turn=1;
- retry_failed=false;
- no retry/regeneration/replacement under any outcome.

Capture the real SSE stream.

Require:

1. at least one real non-empty `story_delta` before terminal;
2. Story deltas remain ordinary narrative, not protocol/error payload;
3. exactly one authoritative terminal;
4. terminal status=`committed`;
5. no `Too many subrequests` or equivalent exhaustion signature;
6. no silent close without authoritative terminal.

Direct DB after terminal must prove:

- total count=10;
- committed_turn=1;
- revision=1;
- turns exactly [0,1];
- exactly one canonical turn-1 job;
- job status=`committed`;
- attempt_no=1;
- job/turn literal_action exactly the intended Korean action;
- non-empty substantial full Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]` on turn0 and turn1;
- no duplicate turn/job;
- no processing/failed residue for E;
- structurally valid state_after;
- relevant-NPC-only Mind Monitor if any entries are present.

Record SSE delta count/order, terminal, Story character length, elapsed timing, action_id, and direct DB result.

Owner narrative law `5341147788` is binding. Reject terse 1–2 sentence status text, bullets/protocol/OOC output, or Story that replaces the literal player intent instead of elaborating its consequences. Do not regenerate weak output.

## 7. Handoff F — only after Smoke E fully passes

Before Setup F require count exactly 10.

Create exactly one separate handoff game F using the same verified ASCII-only Node harness.

### Setup F

- exactly one Setup request;
- player name exactly `플레이어`;
- direct DB code points exactly `[54028,47112,51060,50612]`;
- no retry/replacement.

### Opening F

- exactly one Opening request;
- zero gameplay turns.

Require:

- total count=11;
- committed_turn=0;
- revision=0;
- exactly one turn-0 row;
- non-empty/substantial Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- `choices=[]`;
- zero jobs;
- Korean player name exact.

Do not browser-open or auto-play F.

Return:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<HANDOFF_GAME_F>`

Then STOP for owner manual play acceptance.

## 8. Hard operation limits

- starting TEST game baseline: exactly 9;
- fresh authorized games: at most 2;
- successful count path: exactly `9 -> 10 -> 11`;
- API deploys: 0;
- frontend deploys: 0;
- migration apply/edit: 0;
- source/runtime/config changes: 0;
- secret/provider/model/subrequest-limit changes: 0;
- automated gameplay turns: exactly 1 total, Smoke E only;
- Handoff F gameplay: 0;
- retries/regenerations/resets/deletes/repairs: 0;
- existing-nine-game API context/getJob calls: 0;
- v1/Production/Phase2 operations: 0.

If a source/runtime/DB/deployment defect appears, STOP. Do not hotfix it under this rollout task.

## 9. Required terminal

### Success

Post:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_UTF8_RESUME_READY_FOR_USER`

Status: `WAITING_USER_ACCEPTANCE`

Include:

- task identity / execution lease / registration SHA / CURRENT_TASK blob;
- source acceptance/head/merge;
- previous BLOCKED terminal + operator review;
- exact current baseline nine IDs;
- migration/choice/fencing/ACL readback;
- exact API deployment identity recovered from previous rollout and live parity proof;
- explicit API deploys=0 / frontend deploys=0;
- ASCII-only harness path and proof its source bytes are ASCII-only;
- local player-name code points and UTF-8 round-trip proof before HTTP;
- Smoke E ID;
- exact Korean DB readback after Setup;
- Opening E choices/story/summary result;
- gameplay action_id and exact literal action;
- real SSE delta count/order and exactly one committed terminal;
- explicit no-subrequest-exhaustion result;
- turn/job/revision/story/summary/MM/count readback;
- Handoff F ID and DB readback;
- handoff URL;
- final total count=11;
- zero retry/reset/delete/repair/migration/source/provider/model/config/secret/v1/Production/Phase2 operations.

Then STOP. Do not create another CURRENT_TASK.

### Failure

Post:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_UTF8_RESUME_BLOCKED`

Status: `BLOCKED`

Identify the first deterministic failure and stop immediately. Preserve any newly created game. No retry, replacement, reset, delete, repair, deploy, source hotfix, migration, or extra gameplay attempt.

Then STOP at review boundary. Do not create another CURRENT_TASK.
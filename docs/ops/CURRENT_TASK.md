# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-subrequest-budget-test-rollout-harness-correct-resume-v1
Mode: TEST ROLLOUT RESUME — CORRECT HARNESS ASSERTION + REUSE DEPLOYED API + FRESH ONE-TURN SMOKE + OWNER HANDOFF
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

Accepted subrequest-budget correction:

- source terminal: `5342205511`
- source acceptance: `5342251062`
- accepted head: `0b7aaeb1c44c034384198cfd6108b1e4ed726a1a`
- merge: `ccdf41f432102cbf7e930732bacdd8d8d3667c22`
- exact-head CI: run `32253580067`, job `96069985737`, SUCCESS

Previous rollout evidence:

- first harness-corruption terminal: `5342409308`
- operator review: `5342470445`
- UTF-8 resume terminal: `5342641296`
- operator review accepting task-spec typo: `5342773106`

TEST project:

`fmcrspgxstsmxxsmkeee`

This is TEST OPS RESUME only. No source correction, migration, Worker redeploy, provider/model/config/secret change, retry, repair, or Phase 2 work is authorized.

## 1. Proven blocker is the registered harness assertion, not runtime

The previous UTF-8 resume stopped before any HTTP request because the registered task contained a wrong decimal code point.

The correct player name is:

`플레이어`

Correct JavaScript construction:

```js
const playerName = String.fromCodePoint(0xD50C, 0xB808, 0xC774, 0xC5B4);
```

Correct decimal code points:

```text
[54540,47112,51060,50612]
```

The previous value `54028` is wrong and MUST NOT be used as an assertion anywhere in this task.

This task does not modify repository source to fix that typo. The corrected assertion exists only in the temporary external test harness.

## 2. Immutable TEST evidence baseline

At operator registration time, direct SQL shows 10 Company v2 games.

Known immutable IDs:

1. `88625b46-20fa-42c6-82d5-050a98ee2aad`
2. `09bece94-f2f3-4936-baab-42f64d078708`
3. `0daec355-47a8-4b81-a87d-a47dc25b5b96`
4. `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
5. `360725ca-6369-420a-a740-3f9c787e157c`
6. `baab2c62-6782-4023-a55d-eea9f6b22237`
7. `e2b7019b-ed17-493f-8871-502acbc6e795`
8. prior subrequest-failure smoke `9cda9783-76ae-436e-a517-a5c9377d273f`
9. harness-corrupted Setup-only smoke `cc6d45ab-c261-43b0-a84a-93f661ec1683`
10. unresolved pre-registration Opening-only game `ae7b5146-7f6c-4b66-977f-849a7842623a`

Game 10 was observed at registration with:

- created_at `2026-08-19T13:18:25.465386Z`
- committed_turn=0
- revision=0
- player name exactly `플레이어`
- exactly one turn-0 Opening row
- Opening choices=[]
- jobs=0

Do not infer its origin. Preserve it immutable.

All baseline games are direct-SQL-only. Do not call context/getJob/opening/turn/setup/reset APIs on them. Do not repair, retry, delete, reuse, or mutate them.

### Execution-start baseline freeze

Immediately after posting the execution lease, direct-read all Company v2 games.

Let the frozen baseline count be `N`.

1. If the exact 10 registered IDs are present and there are no others, freeze `N=10`.
2. If additional game(s) appeared before the execution lease, they may be absorbed into the immutable baseline only when every additional game satisfies all of:
   - created_at strictly before the execution lease;
   - committed_turn=0;
   - revision=0;
   - jobs=0;
   - and either:
     - turns=0, or
     - exactly one turn row with turn_number=0, empty literal_action, choices=[] and no gameplay job.
3. Do not guess their origin. Add them to the terminal baseline list and never API-context them.
4. If any additional game was created at/after the execution lease, has committed_turn>0, revision>0, any gameplay turn, or any job, STOP.
5. After `N` is frozen, any unexplained game-count drift before the authorized fresh Setup below => STOP.

Successful authorized count path is dynamically:

`N -> N+1 -> N+2`

## 3. Reuse the already-deployed API

API deployments authorized by this task: **0**.
Frontend deployments authorized: **0**.

Before any mutating request:

- recover the exact `game-proxy-company-v2` deployment identity produced by the prior accepted rollout from Issue #68 runner evidence;
- compare it with the current live Worker identity;
- require exact parity;
- require `gamebuilder-company-v2` has not been newly deployed by this task;
- verify current main is only an ops/docs descendant of source merge `ccdf41f432102cbf7e930732bacdd8d8d3667c22`;
- verify runtime source still contains `MAX_PROGRESS_WRITES_PER_ATTEMPT = 4` and the accepted bounded-progress policy.

If deployment identity cannot be proven or live identity drifted, STOP. Do not redeploy over unknown work.

No secret/provider/model/config/subrequest-limit change.

## 4. Read-only DB and transport gates

Before fresh Setup require:

- migrations 002/003/004/005/006 each exactly once;
- no unexpected later Company v2 migration;
- migration 006 choice contract unchanged;
- `company_v2_turns_choices_empty_check` present, array length 0, `convalidated=false`;
- old exact-four choice CHECK absent;
- Opening empty-choice-only;
- fenced Commit empty-choice-only;
- action_id + attempt_no + status + revision + turn fencing intact;
- no unfenced progress/fail/commit overload;
- RPC EXECUTE remains service_role-only;
- table privileges not broadened;
- current game count still exactly frozen `N`.

Transport/static gates:

- `/`, `/index.html`, `/config.js`, `/app.js`, `/styles.css` on frontend return 200;
- frontend API base remains Company v2 API only;
- free-form composer present;
- active choices UI absent;
- browser-valid OPTIONS `/api/v2/turn` passes;
- one fresh verified-absent context probe returns canonical `game_not_found`.

If the known `JWT issued at future` signature occurs, exactly one second verified-absent probe is allowed after trusted UTC re-read. No secret repair and no deploy. Second failure => STOP.

## 5. Mandatory corrected ASCII-only Node harness

Create one temporary `.mjs` outside the repository. Do not commit it.

The source bytes must be ASCII-only. Korean literals must not physically occur in the temp file.

Construct the player name only as ASCII source, for example:

```js
const playerName = String.fromCodePoint(0xD50C, 0xB808, 0xC774, 0xC5B4);
```

Construct the gameplay action from ASCII Unicode escapes:

```js
const literalAction = "\uC11C\uC6D0\uC5D0\uAC8C \uC624\uB298 \uCCAB \uC5C5\uBB34\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uBB3C\uC5B4\uBCF8\uB2E4.";
```

Before the first HTTP request, the Node process itself must assert all of:

- `Array.from(playerName, c => c.codePointAt(0))` equals exactly `[54540,47112,51060,50612]`;
- `playerName === "\uD50C\uB808\uC774\uC5B4"`;
- playerName UTF-8 Buffer round-trip unchanged;
- literalAction UTF-8 Buffer round-trip unchanged;
- literalAction equals the intended Korean action after JavaScript escape interpretation;
- temp source contains no byte > 0x7F.

Use native Node `fetch` and native `JSON.stringify` in that same process.

Forbidden:

- PowerShell here-string JSON body;
- Korean shell variables;
- curl body literals;
- stdin transport of Korean request JSON;
- changing code page to make a literal path appear to work.

Any local harness failure => STOP before Setup.

## 6. Fresh Smoke G

After all gates pass, require game count=`N`.

### Setup G

Call `/api/v2/setup` exactly once with body constructed inside Node:

```js
{ player_name: playerName }
```

No retry or replacement.

Direct DB must prove:

- exactly one new game G;
- count=`N+1`;
- player name exactly `플레이어`;
- player code points exactly `[54540,47112,51060,50612]`;
- committed_turn=0;
- revision=0;
- turns=0;
- jobs=0.

Failure => preserve G and STOP. Do not Opening.

### Opening G

Call `/api/v2/opening` exactly once.

Require:

- count=`N+1`;
- committed_turn=0 / revision=0;
- exactly one turn-0 row;
- substantial non-empty Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- choices=[] exactly;
- jobs=0;
- player name/code points unchanged.

Failure => preserve G and STOP.

### Gameplay G

Submit exactly one `/api/v2/turn` request with:

- one fresh action_id;
- expected_turn=1;
- retry_failed=false;
- exact literal action `서원에게 오늘 첫 업무가 무엇인지 물어본다.` generated by the ASCII-only harness.

Capture real SSE.

Require:

- at least one non-empty real `story_delta` before terminal;
- all deltas remain narrative, not protocol/error payload;
- exactly one terminal;
- terminal status `committed`;
- no `Too many subrequests` or equivalent exhaustion signature;
- no silent close.

Direct DB after terminal must prove:

- count=`N+1`;
- committed_turn=1;
- revision=1;
- turns exactly [0,1];
- exactly one turn-1 canonical job;
- job status=committed;
- attempt_no=1;
- job/turn literal_action exact;
- substantial full Story;
- meaningful parsed blocks;
- non-empty summary;
- choices=[] on turn0 and turn1;
- no duplicate turn/job;
- no processing/failed residue for G;
- valid state_after;
- Mind Monitor only for relevant NPCs if present.

Record Story delta count/order, terminal, action_id, Story character length, elapsed timing and DB readback.

Owner rich-narrative law `5341147788` is binding. Reject terse status text, bullet/protocol/OOC output, or replacement of the literal player intent. Do not regenerate weak output.

Any failure => preserve G and STOP. No second gameplay attempt.

## 7. Owner Handoff H — only after G fully passes

Before Setup H require count=`N+1`.

Create exactly one fresh H using the same verified ASCII-only Node harness.

Setup exactly once, then Opening exactly once. No gameplay.

Require direct DB:

- count=`N+2`;
- committed_turn=0;
- revision=0;
- exactly one turn-0 row;
- substantial Opening Story;
- meaningful parsed blocks;
- non-empty summary;
- choices=[];
- jobs=0;
- player exactly `플레이어` with code points `[54540,47112,51060,50612]`.

Do not browser-open or auto-play H.

Return:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<HANDOFF_GAME_H>`

Then STOP for owner manual acceptance.

## 8. Hard operation limits

- baseline: freeze `N` exactly once at execution start;
- fresh authorized games: at most 2;
- successful count path: `N -> N+1 -> N+2`;
- API deploys=0;
- frontend deploys=0;
- migration apply/edit=0;
- source/runtime/config changes=0;
- secret/provider/model/subrequest-limit changes=0;
- automated gameplay turns=exactly 1 total, Smoke G only;
- Handoff H gameplay=0;
- retries/regenerations/resets/deletes/repairs=0;
- baseline-game context/getJob/mutating API calls=0;
- v1/Production/Phase2 operations=0.

If a source/runtime/DB/deployment defect appears, STOP. Do not hotfix under this task.

## 9. Required terminal

### Success

Post:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_HARNESS_CORRECT_RESUME_READY_FOR_USER`

Status: `WAITING_USER_ACCEPTANCE`

Include:

- TASK_ID / execution lease / registration SHA / CURRENT_TASK blob;
- prior terminal `5342641296` and operator review `5342773106`;
- frozen baseline N and every immutable game ID;
- any pre-lease absorbed IDs and their zero-gameplay proof;
- migration/choice/fencing/ACL proof;
- recovered live API deployment identity parity and deploys=0;
- ASCII-only temp harness path plus byte-range proof;
- corrected player code points `[54540,47112,51060,50612]` before HTTP;
- Smoke G ID and exact DB Korean-name proof;
- Opening G readback;
- gameplay action_id, literal action, SSE delta count/order, one committed terminal;
- explicit no-subrequest-exhaustion result;
- turn/job/revision/story/summary/MM readback;
- Handoff H ID, DB readback and handoff URL;
- final count=`N+2`;
- zero retry/reset/delete/repair/migration/source/provider/model/config/secret/v1/Production/Phase2 operations.

Then STOP. Do not create another CURRENT_TASK.

### Failure

Post:

`COMPANY_V2_PHASE1_SUBREQUEST_BUDGET_HARNESS_CORRECT_RESUME_BLOCKED`

Status: `BLOCKED`

Report the first deterministic failure and preserve any newly created game. No retry, replacement, reset, delete, repair, deploy, source hotfix, migration, or extra gameplay attempt.

Then STOP at review boundary. Do not create another CURRENT_TASK.

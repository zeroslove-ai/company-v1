# Company v2 — CURRENT TASK

Status: WAITING_USER_ACCEPTANCE
Task ID: company-v2-phase1-subrequest-budget-test-rollout-harness-correct-resume-v1
Mode: OWNER MANUAL PLAY ACCEPTANCE CHECKPOINT
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Stop state

This task completed its automated TEST rollout successfully and is now intentionally waiting for owner/user manual acceptance.

Hermes/Codex MUST NOT execute another automated task while this file remains `WAITING_USER_ACCEPTANCE`.

Do not create a source branch, PR, new task file, new ops branch, deploy, migration, retry, reset, delete, repair, or automated gameplay run from this checkpoint.

## 1. Accepted source/runtime baseline

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted source lineage:

- product baseline merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`
- choice DB contract source merge: `2c010a3ffac07750db72c4ee6035e8a8f1a2f253`
- subrequest-budget source acceptance: Issue #68 `5342251062`
- accepted subrequest source head: `0b7aaeb1c44c034384198cfd6108b1e4ed726a1a`
- subrequest source merge: `ccdf41f432102cbf7e930732bacdd8d8d3667c22`
- source exact-head CI: run `32253580067`, job `96069985737`, SUCCESS

TEST project:

`fmcrspgxstsmxxsmkeee`

Migration `20260819000600_company_v2_choice_contract_closure.sql` is already applied exactly once. Do not reapply it.

## 2. Successful automated rollout evidence

Execution task:

`company-v2-phase1-subrequest-budget-test-rollout-harness-correct-resume-v1`

- READY registration: Issue #68 `5342794459`
- execution lease: `5342808396`
- success terminal: `5342855166`
- terminal status: `WAITING_USER_ACCEPTANCE`
- registration/start main SHA: `9e7286be761e681648216d0f2367c4273f7dbb61`
- prior CURRENT_TASK blob: `deda5ac589f3ffce20cffc3b49e188b1d6908d89`

The corrected ASCII-only harness proved the exact player-name code points:

`플레이어` = `[54540,47112,51060,50612]`

The obsolete incorrect first value `54028` is permanently rejected.

### Smoke G — automated one-turn acceptance

Game:

`903b6b79-d934-46bf-a3d0-1711e294fe5e`

Exact gameplay action:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Action ID:

`e3cb4827-5833-4d10-990a-ce5c46d46f6d`

Verified result:

- Setup exactly once;
- Opening exactly once;
- one gameplay request only;
- expected_turn=1;
- retry_failed=false;
- 594 non-empty `story_delta` events;
- exactly one terminal, status=`committed`;
- no subrequest-exhaustion signature;
- committed_turn=1;
- revision=1;
- turns exactly `[0,1]`;
- exactly one turn-1 job;
- job status=`committed`;
- attempt_no=1;
- no error / processing / failed residue;
- literal action persisted exactly;
- `choices=[]` on Opening and turn 1;
- substantial Story and non-empty summary;
- rich narrative acceptance passed.

This closes the known Cloudflare subrequest-budget defect for the bounded one-turn TEST acceptance path.

## 3. Owner handoff game — manual play only

Handoff H:

`161dda85-5cb4-4598-8331-1b9adc0d64f4`

Owner URL:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=161dda85-5cb4-4598-8331-1b9adc0d64f4`

Handoff state at automated stop:

- player name exactly `플레이어`;
- committed_turn=0;
- revision=0;
- exactly one Opening turn row;
- Opening story present;
- parsed blocks present;
- summary present;
- `choices=[]`;
- jobs=0;
- automated gameplay turns=0;
- browser was not opened by the runner.

This game is now reserved for owner manual play. Do not reset, delete, retry, replace, auto-play, or mutate it outside the owner's actual gameplay.

## 4. Owner acceptance decision

The next action is NOT another Codex task.

Owner should open the Handoff H URL and manually play the game for as many turns as needed to judge the product behavior.

Primary acceptance points:

- free-form input works without active choices;
- Story streams visibly in real time;
- no blocking loading overlay hides the Story;
- each submitted action advances exactly one turn;
- literal player intent is preserved;
- narrative remains rich rather than terse/status-like;
- refresh/reconnect/history remain coherent;
- no stuck `processing`, duplicate job, duplicate turn, or silent failure appears;
- NPC identity/dialogue remains coherent;
- summary/Mind Monitor behavior is plausible for Phase 1;
- no unexpected v1/legacy stage-machine behavior appears.

If the owner reports a defect, the operator must first inspect the exact affected game/turn/job and Issue #68 race guard, then register the narrowest justified next task by overwriting this same file in place.

If the owner accepts the Phase 1 manual play, the operator may then register the next Company v2 phase/task by overwriting this same file in place.

Until one of those owner outcomes is provided, remain in `WAITING_USER_ACCEPTANCE`.

## 5. Hard safety rules during this wait

- no new CURRENT_TASK file;
- no ops/task-registration branch;
- no automatic next task;
- no API/frontend deploy;
- no migration apply/edit;
- no provider/model/config/secret change;
- no retry/regeneration;
- no reset/delete/repair of evidence games;
- no automated long-play acceptance;
- no v1/Production access;
- no Phase 2 work before owner decision.

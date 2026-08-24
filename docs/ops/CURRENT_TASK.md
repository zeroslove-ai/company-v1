# Company — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: company-r3-owner-manual-test-play-gate-v1
Mode: OWNER MANUAL TEST PLAY — NO AUTONOMOUS EXECUTION
Updated: 2026-08-24 18:25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Accepted terminal: Issue #68 comment `5393222222`
Trigger registration: Issue #68 comment `5392758196`
Owner priority override: Issue #68 comment `5392739865`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` path. Do not create another CURRENT_TASK path.

## 0. Operator review result

The completed task `company-r3-final-critical-only-seal-for-owner-playtest-v1` is ACCEPTED.

Verified:
- terminal: `OWNER_TEST_PLAY_READY`;
- terminal main: `55bcb14edaa35cc417d2e993a9b6979c79b4d58d`;
- registration `99debe1ffb21cc5d44cbe9107495fc158d3279b1` -> terminal main is exactly one commit ahead;
- the only changed path is `docs/ops/CURRENT_TASK.md`;
- accepted executable/source remained frozen at `5709c4a894430b74cf5a985da57747c1cafcfd15`;
- source edits: `0`;
- TEST deploys: `0`;
- full test baseline: `547/547 PASS`;
- fresh junior smoke: Opening + 4 ordinary turns;
- visible native choices and free input worked;
- refresh/re-entry worked;
- desktop and ~390x844 remained usable;
- current Story/History/profile/state isolation passed;
- no new `r3_observer_finish_stop` or `r3_observer_finish_length` occurred;
- no proven P0/P1 blocker was found;
- preserved V5/TTS/image fixtures were untouched.

Fresh accepted smoke fixture is READ ONLY:
- `d69dfccd-9276-4787-b90a-f8260d869b35`

## 1. Frozen TEST build for owner play

Accepted executable/source:
- `5709c4a894430b74cf5a985da57747c1cafcfd15`

TEST deployments:
- R3 API `game-proxy-company-r3@bee01bf9-b79f-433e-9cfb-6fc09a2379cc`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- legacy worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`

Owner play URL:
- `https://gamebuilder-company-r3.zeroslove.workers.dev`

Do not redeploy, reset preserved fixtures, change provider/model/config, or mutate Production while this gate is waiting.

## 2. Owner gate

The next useful evidence is the owner's normal manual TEST play, not another autonomous QA campaign.

Owner should use the product normally and report concrete gameplay issues or product-quality judgments, especially where relevant:
- whether Story follows the player's literal actor/target/action/refusal/self-state/topic/intent;
- whether characters feel distinct and consistent;
- whether dialogue and pacing feel natural;
- whether choices feel useful and varied;
- whether work remains world texture rather than compulsory task funneling;
- whether location/presence/scene continuity feels correct;
- whether Mind Monitor, History, CSA, image/TTS and retained UI surfaces feel correct when naturally encountered;
- any UI/readability/friction issue visible in actual use.

No fixed turn count is required. This is product play, not an automation coverage exercise.

## 3. Stop law

While Status is `WAITING_OWNER_DECISION`:
- Codex/Hermes MUST NOT start another autonomous gameplay/QA/source-fix cycle;
- do not manufacture a new READY task from deferred P2/P3 debt;
- do not replay V5/TTS/image evidence;
- do not touch Production;
- do not mutate preserved fixtures;
- do not create a new branch/PR merely to wait for feedback.

When the owner reports an actual issue or gives a new product direction, the ChatGPT operator must:
1. read the reported live evidence and current main;
2. classify the first broken product/implementation boundary;
3. register a new bounded `READY` task only if autonomous work is actually required;
4. preserve this owner-play gate as audit history in Issue #68.

## 4. Current disposition

`OWNER_TEST_PLAY_READY` is accepted.

Current gate:
`WAITING_OWNER_DECISION`

No autonomous next task is authorized until owner manual-play feedback or an explicit new owner instruction arrives.

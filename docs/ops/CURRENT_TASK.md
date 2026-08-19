# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-product-baseline-test-rollout-v1
Mode: TEST ROLLOUT — PRODUCT BASELINE + ONE-TURN SMOKE + OWNER HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / accepted source

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Owner product rejection / laws:

- previous product handoff rejection: Issue #68 comment `5341086841`
- rich narrative law: Issue #68 comment `5341147788`

Accepted source task:

- Task ID: `company-v2-phase1-product-baseline-v1`
- source terminal: Issue #68 comment `5341256206`
- source acceptance: Issue #68 comment `5341316161`
- accepted exact head: `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`
- exact-head CI: run `32245960387`, test job `96046401180`, SUCCESS
- PR #90 merged at that exact reviewed head
- merge commit: `ee46977747dc89b04dca65fc4632e88b45cae7e0`

The accepted source changes:

- restore Company product UI shell in `frontend-v2` as presentation only;
- free-form input only; active Phase-1 choices removed;
- durable `choices` remains `[]` only for schema compatibility;
- rich Story prompt preserves literal action and substantial scene progression;
- first-turn stuck-processing root cause fixed by attaching `processTurn()` to `ReadableStream.start()` lifecycle;
- SSE close without terminal reconnects to the same canonical job;
- no hidden retry/regeneration;
- clean-room server-owned v2 authority remains intact.

## 1. TEST environment / immutable evidence

TEST Supabase project:

`fmcrspgxstsmxxsmkeee`

Historical live migrations already applied exactly once and MUST NOT be changed/applied/replayed:

- `20260819000200_company_v2_phase1_vertical_slice`
- `20260819000300_company_v2_stuck_turn_closure`
- `20260819000400_company_v2_attempt_fencing`
- `20260819000500_company_v2_acl_closure`

Existing isolated Workers before this rollout:

- API: `game-proxy-company-v2`
- previous API version: `e66d87c1-b3d6-4e59-8c32-bf8d36d4add0`
- Frontend: `gamebuilder-company-v2`
- previous accepted frontend version: `cdbd6c10-0193-487e-a390-2c120946bfdd`

Immutable v2 evidence games:

- failed owner-product evidence: `0daec355-47a8-4b81-a87d-a47dc25b5b96`
- preserved rollout evidence: `88625b46-20fa-42c6-82d5-050a98ee2aad`

Do not mutate, retry, reset, delete, expire intentionally, reuse, or call API context on either evidence game. If verification is needed, use direct read-only SQL only.

All v1/manual/QA/preserved games and Production/hospital-v2 remain forbidden.

## 2. Goal

Deploy the exact accepted product-baseline merge to isolated TEST and prove the concrete repaired path live before owner handoff.

Required sequence:

1. read-only preflight;
2. deploy only Company v2 API and frontend from merge `ee469777...`;
3. verify DB-backed API auth/transport and deployed frontend assets;
4. create exactly one dedicated smoke game;
5. Setup once + Opening once;
6. submit exactly ONE automated free-form gameplay turn;
7. prove incremental Story streaming, terminal commit, durable readback, no stuck processing, and `choices=[]`;
8. if smoke passes, create exactly one separate fresh owner-handoff game with Setup + Opening only;
9. hand off that turn-0 URL and STOP for owner manual acceptance.

Maximum authorized new games in this task: **2 total**.

- game A = one-turn automated smoke game;
- game B = fresh owner handoff game, zero gameplay turns.

No replacement games and no retries after a failed deterministic gate.

## 3. Start guard

Before deploy or live write:

1. fetch `main` and require merge commit `ee46977747dc89b04dca65fc4632e88b45cae7e0`;
2. verify runtime/frontend/canon/test executable lineage is exactly the accepted PR #90 merge plus this CURRENT_TASK registration only;
3. verify TEST project exactly `fmcrspgxstsmxxsmkeee`;
4. read migration ledger and confirm 002/003/004/005 are present exactly once; apply zero migrations;
5. verify four v2 tables, canonical `(game_id, turn_number)` job PK, fenced writer signatures, and accepted ACL shape remain present read-only;
6. read-only SQL verify both immutable evidence games still exist as evidence; do not invoke API context on them;
7. verify API Worker secret names include `SUPABASE_SERVICE_ROLE_KEY` and `LLM_API_KEY` without printing values;
8. preserve existing `SUPABASE_URL`, provider URL, `STORY_MODEL`, `EXTRACT_MODEL`, CORS and Worker identities exactly;
9. verify v1/Production targets are not selected.

Any migration/ACL/PK/fencing/source-lineage drift => STOP BLOCKED. Do not repair inside rollout.

## 4. Deploy exact accepted API + frontend

Deploy API from current merged main using:

`wrangler.v2.api.jsonc`

Required target:

`game-proxy-company-v2`

Deploy frontend from the same current merged main using:

`wrangler.v2.frontend.jsonc`

Required target:

`gamebuilder-company-v2`

Record both resulting Worker version IDs.

Do not deploy v1 Workers. Do not change secrets, provider/model values, config vars, migrations, DB schema, or content.

If deploy alters or loses required secret/var bindings, STOP BLOCKED rather than silently repairing credentials/config.

## 5. Post-deploy API transport smoke

Before any new game:

1. generate one random UUID;
2. direct SQL verify it is absent from `company_v2_games`;
3. call exactly once:
   `GET /api/v2/context?game_id=<ABSENT_UUID>`
4. require canonical structured `game_not_found`-class response from the DB-backed path;
5. `Illegal invocation`, JWT/auth error, v1 payload, or transport 5xx => STOP BLOCKED;
6. verify `OPTIONS /api/v2/turn` CORS remains accepted.

Do not rewrite Worker secrets in this rollout.

## 6. Post-deploy frontend product-shell verification

Verify deployed frontend assets correspond to the accepted v2 product shell:

- title/header;
- day/time;
- turn indicator;
- connection/runtime status;
- Story history region;
- distinct current streaming Story region;
- right-side current scene / Mind Monitor / player situation panels;
- free-input composer;
- inline non-blocking status/error treatment;
- responsive/mobile CSS;
- no active choice list or choice buttons;
- API base points only to `https://game-proxy-company-v2.zeroslove.workers.dev`.

Static HTTP asset verification is mandatory.

An executing browser/headless client is allowed only with an explicit smoke `?game_id=` after game A exists. Never open the bare frontend root in an executing browser because it may create a game automatically.

Do not redeploy again if the first deploy is wrong; STOP BLOCKED with evidence.

## 7. Game A — one-turn automated live smoke

Only after Sections 3-6 pass.

Create exactly one dedicated smoke game A:

1. `POST /api/v2/setup` exactly once;
2. `POST /api/v2/opening` exactly once for the same game;
3. verify turn-0 context/API + direct DB:
   - committed_turn = 0;
   - revision = 0;
   - exactly one turn 0 row;
   - Opening Story non-empty;
   - durable `choices = []`;
   - zero job rows.

Then submit exactly one automated free-form gameplay action to game A:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Requirements for this single smoke turn:

- exactly one `/api/v2/turn` submission;
- one action_id;
- expected_turn = 1;
- retry_failed = false;
- no retry and no replacement action if anything fails;
- capture the SSE stream and prove at least one `story_delta` is received before terminal;
- terminal must be `committed`;
- no terminal-less close accepted as success;
- no second Story generation call is allowed by task behavior.

If possible, also load the explicit game-A frontend URL in a browser/headless client and verify the deployed product shell displays current/committed Story without blocking overlay. This browser check must not submit an additional action.

## 8. Game A durable post-smoke verification

After terminal commit, verify via API context and direct read-only DB:

- `committed_turn = 1`;
- state revision advanced exactly once;
- exactly one gameplay turn 1 row;
- exactly one canonical turn-1 job row;
- turn-1 job status = `committed`;
- attempt_no = 1;
- literal_action exactly equals the submitted Korean smoke text;
- non-empty Story persisted;
- durable `choices = []`;
- non-empty summary;
- no duplicate turn/job;
- no processing job remains;
- no failed job remains for turn 1;
- no turn 2 exists;
- minimal Phase-1 state contract remains intact.

Narrative acceptance is product-level, not a new runtime hard gate:

- record Story length and parsed block types;
- inspect the actual Story text;
- reject the rollout if it is merely a terse status/result, one-line summary, protocol/OOC text, or if it replaces the literal player action with a different action;
- require substantial scene progression consistent with owner narrative law `5341147788`.

Do not modify source/prompt/model in this rollout if Story quality fails. STOP BLOCKED and preserve game A as evidence.

## 9. Game B — fresh owner handoff only after game A passes

If and only if all game-A smoke checks pass, create exactly one new fresh game B:

1. Setup exactly once;
2. Opening exactly once;
3. zero gameplay turns;
4. verify committed_turn 0 / revision 0 / one Opening row / choices `[]` / zero jobs;
5. game B must differ from game A and both immutable prior evidence games.

Construct:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<GAME_B_ID>`

Do not browser-submit any gameplay action to game B.

Owner/user will manually play at least 5 natural free-form turns.

Manual focus:

- product UI shell is visually acceptable;
- Story visibly streams without blocking modal/overlay;
- rich narrative remains substantial;
- literal action fidelity;
- free input only, no choices;
- one input = one turn;
- no duplicate/stuck processing;
- refresh/reconnect durability;
- ordered history and non-empty summaries;
- relevant-NPC-only Mind Monitor;
- no protocol/OOC garbage;
- no identity corruption.

## 10. Forbidden

Do NOT:

- create a source branch or PR;
- modify source/tests/frontend/config/content/canon during rollout;
- add/edit/apply/replay migrations;
- change ACL/RLS/schema manually;
- modify secrets or provider/model values;
- touch v1 Workers or Production/hospital-v2;
- mutate the two prior v2 evidence games;
- reset/delete any evidence game;
- create more than two new games;
- retry Setup/Opening/gameplay after a failed gate;
- submit more than one automated gameplay turn total;
- automatically play game B;
- run automated 5-turn acceptance;
- start Phase 2/3.

First deterministic defect => preserve evidence and STOP.

## 11. Required terminal

On full success post one immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_PRODUCT_BASELINE_TEST_READY_FOR_USER`

Include:

- Task ID;
- registration main SHA / CURRENT_TASK blob;
- accepted source head `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`;
- source acceptance comment `5341316161`;
- merge commit `ee46977747dc89b04dca65fc4632e88b45cae7e0`;
- TEST project;
- proof migrations 002-005 untouched;
- previous and new API Worker version IDs;
- previous and new frontend Worker version IDs;
- absent-game DB-backed smoke + CORS result;
- deployed frontend product-shell checks;
- game A ID;
- exactly-one smoke action and SSE `story_delta -> terminal committed` evidence;
- game-A DB/API committed_turn=1 / one turn / one job / attempt 1 / choices=[] / non-empty summary / no processing residue;
- Story length + concise narrative-quality inspection result;
- explicit automated gameplay turn count = 1 total;
- game B fresh handoff ID;
- game-B committed_turn=0 / choices=[] / zero jobs / zero gameplay turns;
- confirmation source/config/migrations/provider/model/v1/Production/prior evidence games untouched;
- full owner manual URL near the bottom.

Then STOP at `WAITING_USER_ACCEPTANCE`. Do not create another CURRENT_TASK.

If blocked, post one immutable terminal beginning:

`COMPANY_V2_PHASE1_PRODUCT_BASELINE_TEST_BLOCKED`

Include the exact failed gate, HTTP/SSE/DB evidence, created game IDs if any, and explicit counts for Setup/Opening/automated gameplay attempts. Do not repair or retry inside this task.
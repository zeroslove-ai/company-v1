# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-opening-agency-test-rerun-v1
Mode: TEST / ONE-FRESH-GAME OPENING PRODUCT ACCEPTANCE ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Trigger / accepted source

This task follows accepted source correction:

- prior task: `company-full-redesign-milestone0-opening-agency-boundary-correction-v1`
- terminal: Issue #68 `5369232213`
- operator source acceptance: Issue #68 `5369286080`
- reviewed PR: #100
- exact reviewed source SHA: `4a253756f172862219729429a7e11ceb9ec69254`
- exact merge main SHA: `af52e198d6f958aa1b97a0a5e0e18699e011806d`
- exact-head CI: run `32477177006` SUCCESS

The preceding failed Opening acceptance remains immutable evidence:

- failed terminal: `5369127101`
- operator failure review: `5369164396`
- failure class: `FAILED_OPENING_COMPLETES_UNREQUESTED_PLAYER_ACTION`
- evidence game: `80095cdd-c901-4370-8387-66dcb756b72a`

Do not retry, reset, repair, delete, or otherwise mutate that evidence game.

## 1. Binding authority

Obey, in order:

1. PR #95 Product-first redesign canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine/acceptance canon at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. Company v1 complete UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
4. accepted Milestone 0 R3 source on main through merge `af52e198d6f958aa1b97a0a5e0e18699e011806d`;
5. source review comment `5369286080` and failed-live evidence `5369127101` / `5369164396`.

Product acceptance outranks green tests.

## 2. Exact purpose

Run exactly one fresh TEST Setup + Opening against the corrected R3 runtime and answer one product question:

> Before the first player input, does Opening preserve player agency by limiting the player to passive perception/exposure while NPC/environment actions proceed, without inventing voluntary player speech, gesture, movement, interaction, task execution, decision, or other intentional action?

This is not a broad gameplay test and not Milestone 1.

## 3. Preflight — read-only first

Before any write/deploy/game creation:

1. re-read latest Issue #68 comments as race/duplicate guard;
2. confirm `main` contains merge `af52e198d6f958aa1b97a0a5e0e18699e011806d` and PR #100 exact reviewed source ancestry;
3. confirm current task blob matches this task;
4. verify TEST migration ledger contains `20260821000100_company_r3_milestone0` exactly once;
5. do NOT reapply that migration;
6. read back the isolated `company_r3_*` namespace/RPC/ACL shape sufficiently to confirm the previously accepted R3 persistence boundary is still present;
7. confirm historical v1/v2/manual/QA/evidence games are not targets.

If migration/RPC/schema state is unexpectedly different, STOP `BLOCKED_TEST_BASELINE_DRIFT` without repairing it in this task.

## 4. Exact deployment authority

Only the R3 API runtime changed in PR #100.

Authorized:

- deploy the exact accepted merged R3 API source from main `af52e198d6f958aa1b97a0a5e0e18699e011806d` using `wrangler.r3.api.jsonc`;
- Worker identity must remain `game-proxy-company-r3`;
- run dry-run/config/import checks first as appropriate;
- verify `/api/r3/catalogs` or equivalent health/catalog endpoint after deploy.

Do NOT redeploy the frontend unless a read-only check proves the existing accepted `gamebuilder-company-r3` deployment is unavailable or cannot target the R3 API. If frontend redeploy appears necessary for a reason other than availability/config parity, STOP and report instead.

Do not change provider/model/temperature/token/config/secrets.

## 5. Exactly one fresh R3 TEST game

Create exactly one new R3 TEST game. Do not reuse any prior R3/v2/v1 evidence game.

Use a UTF-8-safe harness/request path and the full accepted Company Setup profile contract from the redesign canon. Do Setup exactly once.

Read back and prove:

- exactly one new game ID;
- full setup profile round-trip, including all active setup fields;
- canonical Company content IDs/names are used, with no fabricated actor/location;
- game is in the expected pre-Opening state before Opening.

If Setup fails, STOP. Do not create a second game and do not retry until lucky.

## 6. Opening — exactly once

Invoke Opening exactly once on that fresh game through the normal R3 API/provider path.

Capture/preserve:

- streamed Story text in source order;
- terminal event/status;
- Observer output;
- committed DB turn/state readback;
- current Story-authored choice literals and committed choice projection;
- relevant current actor/location/Mind Monitor/summary projection;
- worker/version identity and game ID.

No ordinary Turn 1 gameplay is authorized in this task.

### 6.1 Mandatory PASS conditions

Opening passes only if all are true:

1. **Player agency before first input**
   - environment/NPC actions/dialogue may occur;
   - private `상식개변` app may be present/appear/be visible/available to notice;
   - Story does NOT make the player voluntarily speak/reply;
   - Story does NOT make the player nod/gesture;
   - Story does NOT make the player move;
   - Story does NOT make the player touch/click/type/open/close/hide the app or another object;
   - Story does NOT make the player drink/eat;
   - Story does NOT make the player review/work/perform a task;
   - Story does NOT make the player acknowledge/decide/accept/refuse or otherwise complete a choice;
   - passive perception must not smuggle in a decision or voluntary completion.

2. **Product identity**
   - clearly `상식개변: 회사편`, not productivity assistant/helpdesk/chatbot framing;
   - private unfamiliar app premise is visible to the player;
   - NPCs do not know the private app premise unless revealed by the player;
   - registered Company setting/location/actors only;
   - rich workplace/social Opening rather than terse status prose.

3. **Next-action contract**
   - Story visibly authors exactly four distinct natural complete next actions;
   - Observer copies those four current-Story literals character-for-character and in order, or if provider Story genuinely fails exact-four, Observer fails open with `choices=[]` without invalidating an otherwise valid Story;
   - no stale/prior-turn choice fallback, padding, truncation, dedupe rewrite, or second choice author.

4. **Durability/transport**
   - one Opening Story stream reaches one terminal outcome;
   - Opening commits exactly one turn-0 record/state transition through the accepted A-prime server-owned path;
   - no duplicate job/turn/commit residue;
   - committed Story/Observer/choices/summary/state agree with the observed request result.

### 6.2 Failure handling

If any player-agency violation occurs, classify:

`FAILED_OPENING_COMPLETES_UNREQUESTED_PLAYER_ACTION`

Preserve the new game and exact Story/Observer/DB evidence, then STOP.

If another first product/runtime defect occurs, name the narrowest evidence-based failure class, preserve the game, and STOP.

No source hotfix, no second Opening, no second game, no retry/regeneration, no prompt tweaking, no provider/model/config change in this task.

## 7. Hard prohibitions

- no migration edit/new migration/reapply;
- no schema/RPC repair;
- no Production access/change;
- no v1/v2/hospital/manual/QA/evidence game mutation;
- no reset/delete/repair of failed game `80095cdd-c901-4370-8387-66dcb756b72a`;
- no source/runtime/frontend patch;
- no provider/model/temperature/token/config/secret change;
- no retry-until-pass or hidden regeneration;
- no ordinary Turn 1 gameplay;
- no CSA/TTS/Image/Feedback implementation;
- no Milestone 1;
- no merge/PR/source branch creation.

## 8. Completion / stop boundary

### PASS terminal

Post exactly one Issue #68 terminal report:

`COMPANY_FULL_REDESIGN_MILESTONE0_OPENING_AGENCY_ACCEPTANCE_PASSED`

Status: `WAITING_REVIEW`

Include:

- Task ID and task blob SHA;
- accepted source SHA + merge main SHA;
- API Worker version/deployed source;
- whether frontend was left untouched;
- migration readback/apply count=0;
- fresh game ID;
- setup field round-trip summary;
- Opening Story and agency inspection findings;
- exact four Story choice literals and Observer parity, or valid fail-open evidence;
- DB turn/state/job counts and committed readback;
- canonical cast/location/product-premise proof;
- confirmation no ordinary Turn 1 was performed;
- confirmation all preserved games untouched.

Then STOP for operator review. Do not automatically register Milestone 1.

### FAIL terminal

Post exactly one Issue #68 terminal report with `Status: FAILED`, the narrow failure class, exact new game ID, relevant Story/Observer/DB evidence, and STOP. Do not retry or repair.

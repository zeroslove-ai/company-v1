# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-test-rollout-resume-v1
Mode: TEST ROLLOUT RESUME + FRESH GAME HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted Phase 1 runtime source:

- source task: `company-v2-phase1-clean-vertical-slice-v1`
- accepted source head: `d339517bfa9df5ec6162b5bfdc91d6b4fa9db06e`
- source acceptance review: Issue #68 comment `5339692420`
- PR #87 merge commit: `f80830e48f227e5a3718ecacaec82d9d3427b504`

Accepted ACL correction:

- ACL task: `company-v2-phase1-acl-closure-v1`
- ACL terminal: Issue #68 comment `5339962390`
- ACL acceptance review: Issue #68 comment `5339992227`
- exact reviewed ACL head: `6368f08218b3fba4dcd0b1c8910efb6fedd8fb72`
- exact-head CI: run `32235845767` SUCCESS
- PR #88 merge commit: `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`

Prior blocked rollout evidence:

- prior rollout task: `company-v2-phase1-test-rollout-v1`
- blocked terminal: Issue #68 comment `5339791555`
- operator blocked review: Issue #68 comment `5339859038`
- TEST project: `fmcrspgxstsmxxsmkeee`
- migrations `20260819000200`, `20260819000300`, `20260819000400` are already applied in TEST and MUST NOT be reapplied or edited.
- the blocked rollout stopped before v2 Worker deployment and before fresh-game creation because live ACL verification failed.

All preserved v1/manual/QA/evidence games remain READ-ONLY, especially:

- `df3045fd-c359-4cdc-8783-357ddfebe398`
- `587de547-8bb7-4a92-a7c2-07f2831e2d38`
- `9755b57b-5cbb-44dd-a624-020fe516c16d`
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- `78fb1d94-266f-455a-bda4-7656cc2370c1`
- Production sentinel `11111111-1111-4111-8111-111111111111`

Never reset, reseed, replay, revise, or mutate those games. Production/hospital-v2 is forbidden.

## 1. Goal

Resume the previously blocked Company v2 Phase 1 TEST rollout from the exact point of failure:

1. apply ONLY the accepted ACL closure migration `20260819000500_company_v2_acl_closure.sql` to TEST;
2. prove the live v2 DB now matches the accepted table/RPC/fencing/ACL contract;
3. deploy only the isolated v2 API and frontend Workers;
4. create exactly one fresh Company v2 game with Setup + Opening only;
5. hand the exact play URL to the owner/user for manual 5-turn acceptance;
6. submit zero gameplay turns automatically.

This task is operations/acceptance only. Do not patch source/runtime/frontend/tests/migrations during execution.

Required live targets:

- TEST Supabase project: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v2`
- Frontend Worker: `gamebuilder-company-v2`
- API URL: `https://game-proxy-company-v2.zeroslove.workers.dev`
- Frontend URL: `https://gamebuilder-company-v2.zeroslove.workers.dev`

## 2. Start guard

Before any new write/deploy:

1. fetch remote `main` and verify this CURRENT_TASK is the active main blob;
2. verify main contains both merge commits `f80830e48f227e5a3718ecacaec82d9d3427b504` and `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`;
3. verify no runtime/config/provider/content/migration source change occurred after PR #88 merge other than this CURRENT_TASK registration;
4. verify target Supabase ref is exactly `fmcrspgxstsmxxsmkeee`;
5. verify migration history still contains exactly the already-applied Company v2 migrations `20260819000200`, `20260819000300`, `20260819000400`, while `20260819000500` is not yet applied;
6. verify Cloudflare target identities are exactly `game-proxy-company-v2` and `gamebuilder-company-v2`;
7. verify required secret material for the new v2 API Worker is available through the authorized runner without printing values:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LLM_API_KEY`
8. preserve the merged `wrangler.v2.api.jsonc` provider/model/config values exactly; no provider/model substitution.

If any target identity, source lineage, secret source, or migration-history fact cannot be proven, STOP without touching v1/Production.

## 3. Apply ONLY migration 005

Apply exactly this one accepted migration to TEST:

`supabase/migrations/20260819000500_company_v2_acl_closure.sql`

Hard constraints:

- do NOT reapply 002/003/004;
- do NOT use a bulk migration command that could apply unrelated pending migrations;
- do NOT edit historical migrations;
- do NOT apply any unrelated migration;
- if an explicit single-migration method cannot be proven safe, STOP.

After apply, verify Supabase migration history records `20260819000500` exactly once.

## 4. Mandatory live DB gate after 005

Before any Worker deployment, verify the live TEST database directly.

### 4.1 V2 tables

These four v2 mutable tables exist:

- `company_v2_games`
- `company_v2_state`
- `company_v2_turn_jobs`
- `company_v2_turns`

Verify `company_v2_turn_jobs` still has the canonical primary key `(game_id, turn_number)`.

Do not touch old v1 tables.

### 4.2 Required RPC surface

The active v2 RPC surface must include exactly the expected signatures for:

- `company_v2_create_game(text,jsonb)`
- `company_v2_create_opening(uuid,text,jsonb,jsonb,text,jsonb)`
- `company_v2_reserve_turn(uuid,integer,uuid,text,boolean)`
- `company_v2_expire_stale_turn(uuid,integer)`
- `company_v2_update_turn_progress(uuid,integer,uuid,integer,text)`
- `company_v2_fail_turn(uuid,integer,uuid,integer,text)`
- `company_v2_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,jsonb,text,jsonb,jsonb)`

Verify superseded unfenced progress/fail/commit overloads are absent.

### 4.3 Live ACL acceptance

For ALL seven v2 RPCs above:

- `anon`: no EXECUTE
- `authenticated`: no EXECUTE
- PUBLIC/default runtime access: no EXECUTE
- `service_role`: EXECUTE
- owner/admin capability may remain

For ALL four v2 tables:

- PUBLIC: no privileges
- `anon`: no privileges
- `authenticated`: no privileges
- `service_role`: SELECT only
- owner/admin capability may remain

Do not infer ACL from source text only. Query the live PostgreSQL catalogs/effective privileges.

If any RPC/table ACL, signature, PK, or fencing mismatch remains, STOP before Worker deployment and post a new BLOCKED terminal with the exact live mismatch. Do not hotfix source or DB manually outside the accepted 005 migration.

## 5. Deploy isolated v2 API

Only after the live DB gate passes, deploy using:

`wrangler.v2.api.jsonc`

Required target:

- Worker name: `game-proxy-company-v2`
- entry: `runtime-v2/server/worker.js`

Provision only the required v2 Worker secrets through the authorized runner; never print values.

Preserve merged values for:

- `SUPABASE_URL`
- `LLM_API_URL`
- `STORY_MODEL`
- `EXTRACT_MODEL`

Do not deploy or modify `game-proxy-company-v1`.

Record the deployed API Worker version/deployment identifier.

## 6. API smoke gate

Before frontend deploy, perform bounded smoke checks only:

1. `OPTIONS /api/v2/turn` returns the expected CORS contract;
2. invalid/missing `GET /api/v2/context` returns a structured v2 error, not a v1 payload;
3. no gameplay turn is submitted;
4. no automatic retry/regeneration is triggered.

If API identity/routing/config is wrong, STOP before frontend deploy.

## 7. Deploy isolated v2 frontend

Deploy using only:

`wrangler.v2.frontend.jsonc`

Required target:

- Worker name: `gamebuilder-company-v2`
- assets: `frontend-v2`

Do not deploy or modify `gamebuilder-company-v1`.

Record the frontend Worker version/deployment identifier.

Verify the live frontend uses:

`https://game-proxy-company-v2.zeroslove.workers.dev`

as its API base.

## 8. Create exactly one fresh manual-acceptance game

After both Workers are verified live:

1. call `POST /api/v2/setup` exactly once to create one fresh TEST v2 game;
2. call `POST /api/v2/opening` for that same game;
3. call `GET /api/v2/context` read-only and verify:
   - returned game_id matches the fresh game;
   - `committed_turn = 0`;
   - Opening exists as turn 0/history;
   - Opening has exactly four non-empty choices;
   - state shape contains only accepted Phase 1 top-level state keys: `player`, `scene`, `time`;
   - there is no turn-1 processing/failed/committed job before the user acts;
4. do NOT call `/api/v2/turn`.

Create exactly one fresh game. If setup/opening fails after game creation, preserve that fresh game as failure evidence and STOP; do not silently create a replacement game.

## 9. User handoff

Construct the exact play URL:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<FRESH_GAME_ID>`

The terminal must put the fresh `game_id` and full URL near the bottom.

The owner/user will perform at least 5 committed gameplay turns manually. Codex must not pre-play those turns.

Manual acceptance focus:

- visible Story streaming;
- literal player-action fidelity;
- exactly four usable choices;
- one input = one turn;
- no duplicate job/turn;
- no permanent processing lock;
- refresh/reconnect durability;
- sensible committed history and non-empty summaries;
- relevant-only Mind Monitor;
- no protocol/OOC garbage;
- no player/NPC identity corruption.

Deferred and not Phase 1 blockers:

- CSA
- clothing
- sexual gauges
- feedback
- Image
- TTS
- relationship/event systems
- Phase 2/3 features

## 10. Safety / forbidden

Do NOT:

- access or deploy Production/hospital-v2;
- deploy/change either v1 Worker;
- mutate/reset/reseed/replay any preserved v1 evidence game;
- change provider/model values;
- modify gameplay/runtime/frontend/config/content/test/migration source during rollout;
- create a source branch/PR;
- add retries/regeneration/semantic verifier/router;
- reapply migrations 002/003/004;
- apply unrelated pending migrations;
- create more than one fresh v2 game;
- submit any gameplay turn automatically;
- start Phase 2.

If rollout reveals a source defect, preserve evidence and STOP. Do not hotfix inside this operations task.

## 11. Required terminal

On success, post one immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_TEST_READY_FOR_USER_5TURN`

Include:

- task ID;
- registration main SHA and CURRENT_TASK blob;
- source merge commit `f80830e48f227e5a3718ecacaec82d9d3427b504`;
- ACL merge commit `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`;
- TEST project ref;
- proof 002/003/004 were already applied and not reapplied;
- proof 005 was applied exactly once;
- live v2 table/PK/RPC/fenced-signature verification;
- live RPC ACL results for all seven functions;
- live table ACL results for all four tables;
- API Worker name + deployed version/deployment identifier;
- Frontend Worker name + deployed version/deployment identifier;
- API smoke results;
- fresh game ID;
- Opening/context verification;
- explicit confirmation that `/api/v2/turn` was called zero times;
- explicit confirmation that Production/v1/preserved games were untouched;
- full manual play URL.

Then STOP at `WAITING_USER_5TURN`. Do not generate another CURRENT_TASK and do not begin Phase 2.

If blocked, post one immutable terminal beginning with:

`COMPANY_V2_PHASE1_TEST_ROLLOUT_RESUME_BLOCKED`

with exact evidence and STOP without a hotfix.

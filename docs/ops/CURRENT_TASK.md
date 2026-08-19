# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-test-rollout-v1
Mode: TEST ROLLOUT + FRESH GAME HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted source:

- source task: `company-v2-phase1-clean-vertical-slice-v1`
- accepted terminal: Issue #68 comment `5339663041`
- source acceptance review: Issue #68 comment `5339692420`
- exact reviewed source head: `d339517bfa9df5ec6162b5bfdc91d6b4fa9db06e`
- exact-head CI: run `32233726231` / job `96008963602` SUCCESS
- PR #87 merged exactly at that reviewed head
- merge commit: `f80830e48f227e5a3718ecacaec82d9d3427b504`

This task is operations/acceptance only. Do not change gameplay source, provider/model values, content semantics, or Phase 2 scope.

All preserved v1/manual/QA/evidence games remain READ-ONLY, especially:

- `df3045fd-c359-4cdc-8783-357ddfebe398`
- `587de547-8bb7-4a92-a7c2-07f2831e2d38`
- `9755b57b-5cbb-44dd-a624-020fe516c16d`
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- `78fb1d94-266f-455a-bda4-7656cc2370c1`
- Production sentinel `11111111-1111-4111-8111-111111111111`

Never reset, reseed, replay, revise, or mutate those games.

## 1. Goal

Bring the accepted Company v2 Phase 1 vertical slice live on isolated TEST identities and create exactly one fresh game for the owner/user to play manually.

Required live targets:

- TEST Supabase project: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v2`
- Frontend Worker: `gamebuilder-company-v2`
- frontend URL base: `https://gamebuilder-company-v2.zeroslove.workers.dev`
- API URL base: `https://game-proxy-company-v2.zeroslove.workers.dev`

The task ends after Setup + Opening + bounded read-only smoke verification for one fresh game. Do NOT automatically play turns 1–5. The owner/user must do the 5-turn gameplay manually.

## 2. Start guard

Before any write/deploy:

1. fetch remote `main` and verify this CURRENT_TASK is the active main blob;
2. verify merged source lineage includes `f80830e48f227e5a3718ecacaec82d9d3427b504`;
3. verify no runtime/config/migration/content changes were introduced after that merge other than this CURRENT_TASK registration;
4. verify target Supabase project ref is exactly `fmcrspgxstsmxxsmkeee`;
5. verify Cloudflare target identities are exactly `game-proxy-company-v2` and `gamebuilder-company-v2`;
6. verify required secret material for the NEW v2 API Worker is available through the authorized runner without printing secret values:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LLM_API_KEY`
7. verify current provider/model values remain exactly those in merged `wrangler.v2.api.jsonc`; do not substitute provider/model values.

If target project/Worker identity or secret source cannot be proven, STOP without changing v1/Production resources.

## 3. TEST migration preflight

The v2 migration sequence to apply is exactly:

1. `20260819000200_company_v2_phase1_vertical_slice.sql`
2. `20260819000300_company_v2_stuck_turn_closure.sql`
3. `20260819000400_company_v2_attempt_fencing.sql`

Before applying anything:

- inspect linked TEST migration history;
- confirm these v2 migrations are not already partially applied in an inconsistent state;
- confirm there are no unrelated pending migrations that would be applied by the chosen command;
- if a bulk migration command would apply unrelated pending migrations, do NOT use it; choose an explicit safe method or STOP;
- do not edit historical migration files.

Apply only the three accepted v2 migrations to TEST in order.

## 4. Live DB contract verification

After migration apply, verify against TEST with read-only catalog/query checks:

### Tables

Exactly the v2 mutable truth exists:

- `company_v2_games`
- `company_v2_state`
- `company_v2_turn_jobs`
- `company_v2_turns`

Do not modify old `game_actions`, `game_save`, or `game_turns`.

### Canonical job key

Verify `company_v2_turn_jobs` has one canonical primary key on:

- `(game_id, turn_number)`

### Required live RPCs

Verify the effective callable v2 surface contains the accepted functions, including:

- `company_v2_create_game`
- `company_v2_create_opening`
- `company_v2_reserve_turn`
- `company_v2_expire_stale_turn`
- fenced `company_v2_update_turn_progress`
- fenced `company_v2_fail_turn`
- fenced `company_v2_commit_turn`

### Attempt fencing

Verify the LIVE progress/fail/commit signatures require both:

- `action_id`
- `attempt_no`

Verify the superseded unfenced progress/fail/commit signatures are absent.

### ACL

Verify mutation RPC execution is service-role only as authored. No `anon`/`authenticated` mutation execution grant may be introduced.

If live schema/signatures/ACL do not match accepted source, STOP before Worker deployment.

## 5. Deploy isolated v2 API

Deploy using only:

`wrangler.v2.api.jsonc`

Target must be:

- name: `game-proxy-company-v2`
- main: `runtime-v2/server/worker.js`

Set/provision the required Worker secrets from the authorized runner without logging values. Do not copy values into source or Issue comments.

Preserve merged config values for:

- `SUPABASE_URL`
- `LLM_API_URL`
- `STORY_MODEL`
- `EXTRACT_MODEL`

Do not deploy or modify `game-proxy-company-v1`.

Record deployed v2 API Worker version/deployment identifier.

## 6. API live smoke gate

Before frontend deploy, perform only bounded live smoke checks against `game-proxy-company-v2`:

- CORS OPTIONS on `/api/v2/turn` returns required origin/method/header contract;
- invalid/missing context request returns a structured v2 error rather than a v1 payload;
- no automatic retry/regeneration is triggered by smoke checks.

Do not create gameplay turns for smoke testing.

If API identity/routing/configuration is wrong, STOP before frontend deploy.

## 7. Deploy isolated v2 frontend

Deploy using only:

`wrangler.v2.frontend.jsonc`

Target must be:

- name: `gamebuilder-company-v2`
- assets: `frontend-v2`

Do not deploy or modify `gamebuilder-company-v1`.

Record deployed v2 frontend Worker version/deployment identifier.

Verify the live frontend asset/config points to:

`https://game-proxy-company-v2.zeroslove.workers.dev`

## 8. Create exactly one fresh Phase 1 manual game

After both v2 Workers are live:

1. call `POST /api/v2/setup` exactly once to create one fresh TEST v2 game;
2. call `POST /api/v2/opening` for that same game;
3. call `GET /api/v2/context` read-only and verify:
   - game identity matches;
   - `committed_turn = 0`;
   - Opening is present in history;
   - Opening exposes exactly four choices;
   - state shape is only the accepted minimal Phase 1 shape (`player`, `scene`, `time`);
   - no processing/failed turn-1 job exists before the user acts;
4. do NOT submit `/api/v2/turn` on behalf of the user.

This fresh v2 game becomes manual acceptance evidence. Do not reset or reseed it after handing it to the user.

## 9. User handoff URL

Construct the exact manual play URL:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<FRESH_GAME_ID>`

The terminal report must put BOTH the fresh `game_id` and the full play URL near the bottom so the owner/user can immediately open it.

## 10. Manual acceptance boundary

The owner/user, not Codex, performs the first gameplay session.

Requested manual session:

- play at least 5 committed turns;
- use natural free input and choices as desired;
- refresh/reload at least once during the session if convenient to exercise durable readback;
- report any visible failure immediately rather than pushing through it.

Codex must not pre-play these 5 turns and must not fabricate acceptance evidence.

After handing off the URL, STOP. Do not register Phase 2.

## 11. What to preserve during manual play

Phase 1 acceptance focuses on:

- natural Story quality sufficient for continued play;
- literal player-action fidelity;
- exactly four usable choices;
- one input = one turn;
- visible Story streaming;
- no duplicate turn/job;
- no permanent processing lock;
- refresh/reconnect to same durable game/job;
- sensible history and non-empty summaries;
- relevant-only Mind Monitor;
- no protocol/OOC garbage in committed display;
- no player/NPC identity corruption.

Deferred and NOT blockers for this Phase 1 manual session:

- CSA
- clothing
- sexual gauges
- feedback
- Image
- TTS
- relationship/event systems
- Phase 2/3 presentation features

## 12. Safety / forbidden

Do NOT:

- access or deploy Production/hospital-v2;
- deploy/change v1 API or frontend Workers;
- mutate/reset/reseed/replay any preserved v1 evidence game;
- change provider/model values;
- modify gameplay source/runtime/config/content/tests/migrations during rollout;
- create another source PR/branch;
- add retries/regeneration/semantic verifier/router;
- automatically play the fresh game beyond Setup + Opening;
- start Phase 2.

If rollout reveals a source defect, record evidence and STOP. Do not hotfix inside this operations task.

## 13. Required terminal

Post one new immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_TEST_READY_FOR_USER_5TURN`

Include:

- task ID;
- registration main SHA/blob;
- accepted source head `d339517bfa9df5ec6162b5bfdc91d6b4fa9db06e`;
- merge commit `f80830e48f227e5a3718ecacaec82d9d3427b504`;
- TEST project ref;
- exact migrations applied and migration-history evidence;
- live v2 table/RPC/ACL/fenced-signature verification;
- API Worker name + deployed version/deployment identifier;
- Frontend Worker name + deployed version/deployment identifier;
- API smoke results;
- fresh game ID;
- Opening/context verification;
- confirmation that zero gameplay turns were auto-submitted;
- confirmation that Production/v1/preserved games were untouched;
- full manual play URL.

Then STOP at `WAITING_USER_5TURN`. Do not generate another CURRENT_TASK and do not begin Phase 2.

# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-test-rollout-after-fetch-fix-v1
Mode: TEST ROLLOUT RESUME — API REDEPLOY + FRESH GAME HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / accepted state

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted source lineage:

- original Phase 1 merge: `f80830e48f227e5a3718ecacaec82d9d3427b504`
- ACL closure merge: `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`
- rollout BLOCKED terminal: Issue #68 comment `5340154630`
- rollout BLOCKED review: Issue #68 comment `5340209458`
- fetch-binding correction terminal: Issue #68 comment `5340279492`
- fetch-binding source acceptance: Issue #68 comment `5340298816`
- accepted fetch-binding head: `a30c6650817985ca4345687ed11549ba7eadd8f9`
- exact-head CI run `32238411429`: SUCCESS
- PR #89 merged at exact reviewed head
- fetch-binding merge commit: `272e58d39e7d063923d063467602b54d750d5d60`

TEST project:

`fmcrspgxstsmxxsmkeee`

Accepted live DB state from the blocked rollout:

- migrations `20260819000200`, `20260819000300`, `20260819000400`, `20260819000500` are already applied exactly once;
- live v2 table / canonical `(game_id, turn_number)` job PK / fenced-RPC / ACL gate passed;
- all seven active v2 RPCs are service_role-only for runtime EXECUTE;
- all four v2 tables expose SELECT only to service_role and no runtime DML;
- unfenced progress/fail/commit overloads are absent;
- `company_v2_games` count after the failed Setup was `0`;
- previous Setup failed before durable game creation;
- `/api/v2/opening` was not called;
- `/api/v2/turn` automated calls remain `0`.

Accepted deployed v2 state before this correction:

- API Worker: `game-proxy-company-v2`, previous version `83569011-ecf9-4e61-8e42-50d26ef27f46`;
- Frontend Worker: `gamebuilder-company-v2`, accepted version `cdbd6c10-0193-487e-a390-2c120946bfdd`;
- frontend API base is `https://game-proxy-company-v2.zeroslove.workers.dev`.

All v1/manual/QA/preserved evidence games are READ-ONLY. Production/hospital-v2 is forbidden.

## 1. Goal

Resume only from the proven failed Setup boundary after the fetch receiver correction.

1. verify the merged source and already-live DB contract without applying migrations;
2. redeploy ONLY the changed v2 API Worker from the merged source;
3. prove the deployed API can execute a real read-only Supabase transport call without `Illegal invocation`;
4. verify the existing v2 frontend is still the accepted deployment and still targets the v2 API; do not redeploy it unless source/config drift is first proven, and if drift exists STOP for review instead of silently changing scope;
5. perform exactly one new fresh Setup attempt;
6. if Setup succeeds, perform Opening exactly once on that same game;
7. verify turn-0/context/DB state;
8. hand the exact URL to the user for manual 5-turn acceptance;
9. submit zero gameplay turns automatically.

This is operations/acceptance only. No source hotfix is authorized inside this task.

## 2. Start guard

Before any deploy or live write:

1. fetch `main` and verify it contains merge commit `272e58d39e7d063923d063467602b54d750d5d60`;
2. verify no runtime/config/provider/frontend/content/migration change exists after that merge other than this CURRENT_TASK registration;
3. verify TEST project is exactly `fmcrspgxstsmxxsmkeee`;
4. read migration ledger and confirm 002/003/004/005 are already present exactly once; do NOT apply any migration;
5. verify live `company_v2_games` currently has zero rows before creating the new acceptance game; if not zero, identify whether an unexpected v2 game was created after the blocked terminal and STOP rather than deleting/mutating it;
6. verify required API Worker secrets are available without printing values:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LLM_API_KEY`;
7. preserve `wrangler.v2.api.jsonc` values exactly, including SUPABASE_URL, LLM_API_URL, STORY_MODEL, EXTRACT_MODEL and Worker identity;
8. verify Production/v1 targets are not selected.

## 3. No migration work

Hard rule: migrations 002/003/004/005 are historical live state.

Do NOT:

- reapply them;
- edit them;
- run bulk migration commands;
- add another migration;
- change ACLs manually.

Only read-only DB catalog/ledger checks are allowed before Setup.

## 4. Redeploy only the corrected v2 API

Deploy from current main using:

`wrangler.v2.api.jsonc`

Required target:

- Worker: `game-proxy-company-v2`
- entry: `runtime-v2/server/worker.js`
- source lineage includes merge `272e58d39e7d063923d063467602b54d750d5d60`.

Do not deploy or modify:

- `game-proxy-company-v1`
- `gamebuilder-company-v1`
- Production/hospital-v2.

Do not change provider/model/config values or secret values.

Record the new API Worker version/deployment identifier.

## 5. Mandatory DB-backed API smoke before Setup

The previous smoke missed the defect because missing `game_id` returned before Supabase transport execution.

After API redeploy, perform a read-only smoke that MUST reach `SupabaseV2Store` / Supabase HTTP transport:

1. generate one random UUID solely for this read-only probe;
2. verify directly in TEST DB that this UUID does not exist in `company_v2_games`;
3. call `GET /api/v2/context?game_id=<ABSENT_UUID>`;
4. require a structured Company v2 not-found response from the DB-backed path (expected `game_not_found` class); it must NOT return `Illegal invocation`, configuration error, v1 payload, or 5xx transport failure;
5. do not create a game during this probe;
6. `/api/v2/turn` calls remain zero.

Also verify `OPTIONS /api/v2/turn` still returns expected CORS.

If the DB-backed context probe fails, STOP. Do not attempt Setup and do not hotfix source.

## 6. Existing frontend verification only

Do not redeploy the frontend merely because the API changed.

Verify read-only:

- Worker identity remains `gamebuilder-company-v2`;
- deployed version is still the accepted version `cdbd6c10-0193-487e-a390-2c120946bfdd` unless an externally proven deployment occurred;
- live assets load;
- frontend API base remains `https://game-proxy-company-v2.zeroslove.workers.dev`;
- no v1 API base is present.

If frontend deployment/config drift is detected, STOP for operator review rather than expanding this task.

## 7. Exactly one fresh Setup attempt

Only after the DB-backed API smoke passes:

1. call `POST /api/v2/setup` exactly once;
2. do not retry Setup on failure;
3. do not create a replacement game;
4. record the returned game_id on success;
5. if Setup fails, query TEST DB read-only to determine whether a partial game row exists, preserve it as evidence if present, and STOP;
6. do not call Opening after a failed Setup.

The prior failed Setup does not count as this run's one authorized attempt because it occurred before the reviewed source fix and created no row.

## 8. Opening exactly once on the same game

If and only if Setup succeeds:

1. call `POST /api/v2/opening` exactly once for that game;
2. if Opening fails, preserve that same game as failure evidence and STOP;
3. do not create another game and do not retry Opening;
4. never call `/api/v2/turn` automatically.

## 9. Turn-0 acceptance verification

After Opening succeeds, verify through live API context and direct read-only DB checks:

- game_id matches the new game;
- `company_v2_state.committed_turn = 0`;
- state revision is the expected turn-0 revision;
- turn 0 exists exactly once;
- Opening story is non-empty;
- Opening choices are exactly four and all non-empty;
- accepted Phase 1 state remains minimal (`player`, `scene`, `time` only at top level unless the canonical contract proves equivalent wrapping);
- there is no turn-1 job in `company_v2_turn_jobs`;
- no processing/failed/committed gameplay job exists before user action;
- no duplicate game/state/turn rows;
- no v1 table dependency is introduced;
- automated `/api/v2/turn` call count = 0.

## 10. User handoff

Construct:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<FRESH_GAME_ID>`

The user will manually play at least 5 committed turns.

Manual focus:

- Story visibly streams;
- literal action fidelity;
- exactly four usable choices;
- one input = one turn;
- no duplicate job/turn;
- no stuck processing;
- refresh/reconnect durability;
- history ordering and non-empty summaries;
- relevant-only Mind Monitor;
- no protocol/OOC garbage;
- no player/NPC identity corruption.

CSA, clothing, sexual gauges, feedback, Image, TTS, relationship/event and other Phase 2/3 features are deferred and are not Phase 1 blockers.

## 11. Forbidden

Do NOT:

- modify source/config/tests/migrations/content during this rollout;
- create a branch/PR;
- apply/reapply migrations;
- redeploy frontend without a separately reviewed reason;
- touch v1 Workers;
- access Production/hospital-v2;
- mutate preserved v1/manual/QA games;
- change provider/model values;
- add retries/regeneration;
- create more than one fresh Setup game;
- automatically play any gameplay turn;
- start Phase 2.

First deterministic defect => preserve evidence and STOP.

## 12. Required terminal

On success post one immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_TEST_READY_FOR_USER_5TURN`

Include:

- task ID;
- registration main SHA / CURRENT_TASK blob;
- fetch-binding accepted head `a30c6650817985ca4345687ed11549ba7eadd8f9`;
- fetch-binding merge `272e58d39e7d063923d063467602b54d750d5d60`;
- TEST project ref;
- proof migrations 002-005 were already present and none were applied in this run;
- read-only live DB preflight result;
- corrected API Worker name + new version;
- DB-backed absent-game context smoke result proving native Supabase fetch works;
- CORS result;
- existing frontend version and API-base verification;
- exactly one Setup attempt result;
- fresh game_id;
- exactly one Opening result;
- turn-0 API/DB verification including exactly four choices and no turn-1 job;
- explicit `automated_gameplay_turns=0`;
- confirmation Production/v1/preserved games untouched;
- full manual play URL near the bottom.

Then STOP at `WAITING_USER_5TURN`. Do not generate another CURRENT_TASK.

If blocked, post one immutable terminal beginning:

`COMPANY_V2_PHASE1_TEST_AFTER_FETCH_FIX_BLOCKED`

with exact evidence and STOP without hotfix/retry/replacement game.
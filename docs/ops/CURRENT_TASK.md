# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-test-auth-probe-and-handoff-v1
Mode: TEST OPS RESUME — AUTH PROBE + FRESH GAME HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / accepted state

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted source lineage:

- original Phase 1 merge: `f80830e48f227e5a3718ecacaec82d9d3427b504`
- ACL closure merge: `ebdf1529dd05b7feafbb5857ffde1eb6e3e30617`
- fetch-binding accepted head: `a30c6650817985ca4345687ed11549ba7eadd8f9`
- fetch-binding merge: `272e58d39e7d063923d063467602b54d750d5d60`
- fetch-binding source acceptance: Issue #68 comment `5340298816`
- latest rollout terminal: Issue #68 comment `5340416019`
- latest operator review: Issue #68 comment `5340464723`

TEST project:

`fmcrspgxstsmxxsmkeee`

Current deployed v2 runtime:

- API Worker: `game-proxy-company-v2`
- corrected API version from latest run: `e66d87c1-b3d6-4e59-8c32-bf8d36d4add0`
- Frontend Worker: `gamebuilder-company-v2`
- accepted frontend version before latest run: `cdbd6c10-0193-487e-a390-2c120946bfdd`
- frontend API base: `https://game-proxy-company-v2.zeroslove.workers.dev`

Historical live DB state that MUST NOT be reapplied or edited:

- `20260819000200_company_v2_phase1_vertical_slice`
- `20260819000300_company_v2_stuck_turn_closure`
- `20260819000400_company_v2_attempt_fencing`
- `20260819000500_company_v2_acl_closure`

The latest rollout proved the fetch receiver correction is live: the DB-backed request reached Supabase and the prior `Illegal invocation` did not recur.

## 1. Latest BLOCKED evidence

Authoritative terminal: Issue #68 comment `5340416019`.

One verified-absent UUID context probe reached TEST Supabase but returned:

`JWT issued at future`

Independent Supabase API logs show the corresponding REST request returned HTTP 401 at approximately `2026-08-19T09:46:56Z`.

About 18 seconds later, the same TEST project logged successful HTTP 200 calls for:

- `company_v2_create_game`
- `company_v2_create_opening`
- v2 context table reads

Therefore:

- this is NOT evidence of a DB schema/RPC/fencing/source gameplay defect;
- do not reopen or change the accepted fetch-binding source;
- the next boundary is credential/clock/ops verification only.

## 2. Preserve unexpected v2 evidence game

A v2 game appeared during the latest run even though that runner reported no Setup call:

`88625b46-20fa-42c6-82d5-050a98ee2aad`

Verified live state:

- `created_at = 2026-08-19T09:47:15.050883Z`
- `content_version = company-v2-phase1`
- `committed_turn = 0`
- `revision = 0`
- exactly one turn row
- zero turn-job rows

Treat this game as immutable rollout evidence.

Do NOT:

- reset it;
- delete it;
- mutate it;
- submit a gameplay turn to it;
- use it as the owner manual 5-turn acceptance game;
- reuse it to avoid creating the one explicitly authorized fresh handoff game later in this task.

## 3. Frontend side-effect finding

Current `frontend-v2/app.js` calls Setup then Opening automatically when it executes without a `game_id` query parameter.

Therefore a browser/headless-browser execution of the bare frontend root is NOT a read-only verification.

For this task:

- NEVER execute/open `https://gamebuilder-company-v2.zeroslove.workers.dev/` without `?game_id=` in a browser or JS-executing client;
- do not use Playwright/Puppeteer/browser navigation against the bare root;
- verify frontend only with non-executing HTTP/static reads such as HTML/config/app source retrieval;
- fetching static files with curl/Invoke-WebRequest/HTTP is allowed only if JavaScript is not executed;
- do not redeploy the frontend.

The final handoff URL with an explicit fresh `game_id` may be constructed for the user, but Codex must not navigate it as a browser gameplay client.

## 4. Goal

Close the TEST auth/ops boundary without changing gameplay source or migrations, then hand off one clean fresh v2 game for owner manual 5-turn acceptance.

Sequence:

1. verify current main/source lineage and existing live DB/migration state read-only;
2. verify TEST Supabase project health and the current corrected API Worker identity;
3. perform exactly one fresh DB-backed absent-game context probe against the already-deployed corrected API;
4. if that probe succeeds with canonical `game_not_found`, make NO credential change and proceed;
5. if that probe fails with a Supabase auth/JWT error, diagnose and, only if a known-good authorized TEST service-role credential is available, repair ONLY `game-proxy-company-v2` `SUPABASE_SERVICE_ROLE_KEY` without exposing the value, then perform exactly one explicit post-repair absent-game probe;
6. after a successful auth probe, verify frontend only by static/non-executing HTTP reads;
7. create exactly one new fresh Setup game;
8. Opening exactly once on that same fresh game;
9. verify turn-0 invariants;
10. provide the exact frontend `?game_id=` URL for owner manual 5-turn play;
11. automated gameplay turns remain zero.

No source branch/PR/source edit is authorized.

## 5. Start guard

Before any secret mutation or Setup:

1. verify `main` contains `272e58d39e7d063923d063467602b54d750d5d60` and only CURRENT_TASK docs registrations followed it;
2. verify runtime/config/provider/frontend/content/migration files have no unreviewed drift;
3. verify TEST project exactly `fmcrspgxstsmxxsmkeee` and status healthy;
4. read migration ledger and prove 002/003/004/005 are already present exactly once; apply zero migrations;
5. read-only verify the four v2 tables and existing fenced RPC/ACL contract remain present;
6. read-only verify evidence game `88625b46-20fa-42c6-82d5-050a98ee2aad` still has committed_turn 0, exactly one turn row and zero job rows; do not mutate it;
7. verify API Worker is exactly `game-proxy-company-v2` and current deployed code includes accepted fetch-binding merge;
8. verify Worker secret names include `SUPABASE_SERVICE_ROLE_KEY` and `LLM_API_KEY` without printing values;
9. verify Production/v1 targets are not selected.

Do NOT require `company_v2_games` count to be zero; the preserved evidence game is expected to exist.

## 6. Credential / clock diagnostics — no secret disclosure

Never print, echo, commit, comment, hash-dump, or otherwise expose the raw `SUPABASE_SERVICE_ROLE_KEY`.

Before changing any secret, record only safe metadata sufficient to classify the failure:

- runner UTC clock;
- an external/server Date header or other trusted UTC comparison if available;
- whether runner clock differs materially from trusted UTC;
- whether an authorized local TEST credential source is available;
- if the credential is a JWT, decode payload locally only to inspect safe claims such as `role`, `iat`, `exp` and project/ref identity when present; do not print the token itself;
- require role/service identity to correspond to `service_role` for TEST project `fmcrspgxstsmxxsmkeee`;
- if `iat` is materially in the future relative to trusted UTC, do not deploy that credential; STOP with evidence unless another known-good authorized TEST credential is available.

Do not rotate Supabase project keys globally. Do not modify v1 Worker secrets.

## 7. First auth probe — exactly once

Use the already-deployed corrected API before any secret rewrite.

1. generate one new random UUID for the probe;
2. directly verify it is absent from `company_v2_games`;
3. call exactly once:
   `GET https://game-proxy-company-v2.zeroslove.workers.dev/api/v2/context?game_id=<ABSENT_UUID>`
4. expected result: structured Company v2 `game_not_found` class response;
5. `Illegal invocation` must not recur;
6. any Supabase/JWT/auth error means the first probe failed;
7. do not call Setup while the probe is failing.

CORS `OPTIONS /api/v2/turn` may be checked read-only.

## 8. Optional narrow TEST Worker secret repair

This section is authorized ONLY if the first auth probe fails with a Supabase auth/JWT error.

If and only if a known-good authorized service-role credential for TEST project `fmcrspgxstsmxxsmkeee` is available to the runner:

1. validate safe metadata as above without exposing the value;
2. update ONLY Cloudflare Worker `game-proxy-company-v2` secret `SUPABASE_SERVICE_ROLE_KEY`;
3. do not modify `LLM_API_KEY`;
4. do not modify config vars, provider URL, STORY_MODEL, EXTRACT_MODEL, Supabase URL, or frontend;
5. do not change Supabase project keys globally;
6. record the resulting API Worker version/deployment identifier if Cloudflare creates one;
7. perform exactly ONE explicit post-repair absent-game context probe with a newly verified-absent UUID;
8. require canonical `game_not_found` before continuing.

If no known-good authorized TEST service-role credential is available, STOP and name only the missing credential source; do not guess or manufacture a JWT.

If the explicit post-repair probe still returns a JWT/auth error, STOP. Do not rewrite the secret again and do not create a game.

This explicit ops probe/repair sequence is not an LLM/gameplay retry and must not introduce any gameplay regeneration/retry behavior.

## 9. Frontend verification — static HTTP only

After API auth probe passes, verify frontend without executing JavaScript:

- fetch static root HTML as text only if the client does not execute JS;
- fetch `/config.js` as text;
- fetch `/app.js` as text;
- prove API base is `https://game-proxy-company-v2.zeroslove.workers.dev`;
- prove no v1 API base is configured;
- prove `app.js` behavior is understood to auto-Setup only when `game_id` is absent;
- do not open/navigate bare root in browser/headless browser;
- do not redeploy frontend.

If frontend config/source drift is found, STOP rather than patching or deploying.

## 10. Exactly one fresh acceptance Setup

Only after auth probe and static frontend verification pass:

1. call `POST /api/v2/setup` exactly once with the normal Phase-1 player payload;
2. do not retry Setup on failure;
3. do not create a replacement game;
4. record the fresh game_id on success;
5. fresh game_id MUST differ from preserved evidence game `88625b46-20fa-42c6-82d5-050a98ee2aad`;
6. if Setup fails, inspect DB read-only for partial rows, preserve evidence, and STOP;
7. do not call Opening after failed Setup.

## 11. Opening exactly once

If Setup succeeds:

1. call `POST /api/v2/opening` exactly once for that same fresh game;
2. do not retry Opening;
3. on failure preserve that same game and STOP;
4. never call `/api/v2/turn` automatically.

## 12. Turn-0 acceptance checks

After Opening succeeds, verify API context and direct TEST DB state:

- fresh game_id matches;
- `committed_turn = 0`;
- expected turn-0 revision;
- exactly one turn 0 row;
- non-empty Opening story;
- exactly four non-empty choices;
- minimal Phase-1 state only (`player`, `scene`, `time` top-level unless canonically equivalent);
- zero job rows for the fresh game;
- no turn 1 or gameplay turn exists;
- no duplicate game/state/turn rows;
- automated `/api/v2/turn` calls = 0;
- preserved evidence game remains unchanged.

## 13. User handoff

Construct but do not browser-open:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<FRESH_GAME_ID>`

Owner/user will manually play 5 turns.

Manual focus:

- Story streaming visible without screen-blocking modal behavior;
- literal player action fidelity;
- exactly four usable choices;
- one input = one turn;
- no duplicate job/turn;
- no stuck processing;
- refresh/reconnect durability;
- correct ordered history and non-empty summaries;
- relevant-NPC-only Mind Monitor;
- no protocol/OOC garbage;
- no player/NPC identity corruption.

Do not test Phase 2/3 features as Phase-1 blockers.

## 14. Forbidden

Do NOT:

- create a branch or PR;
- modify runtime/source/tests/frontend/config/content/migrations;
- apply/reapply/edit migrations 002-005;
- enable/alter RLS or table ACLs in this task;
- rotate Supabase project keys globally;
- modify v1 Worker secrets or deploy v1;
- redeploy frontend;
- open bare frontend root in an executing browser/headless browser;
- mutate/delete/reset/reuse evidence game `88625b46-20fa-42c6-82d5-050a98ee2aad`;
- touch preserved v1/manual/QA games;
- access Production/hospital-v2;
- change provider/model values;
- add retries/regeneration;
- create more than one fresh acceptance Setup game;
- submit any gameplay turn automatically;
- start Phase 2.

First deterministic defect after the explicitly authorized credential repair boundary => preserve evidence and STOP.

## 15. Required terminal

On success post one immutable Issue #68 terminal:

`COMPANY_V2_PHASE1_TEST_READY_FOR_USER_5TURN`

Include:

- task ID;
- registration main SHA / CURRENT_TASK blob;
- prior BLOCKED terminal `5340416019` and review `5340464723`;
- accepted fetch-binding source head and merge;
- TEST project ref;
- proof migrations 002-005 were not changed/applied;
- preserved evidence game readback before and after;
- first auth probe result;
- whether Worker secret repair occurred (`0` or `1`) without secret value;
- if repair occurred: safe credential classification and resulting API Worker version only;
- final successful absent-game probe result;
- CORS result;
- static-only frontend verification result and explicit `bare_frontend_browser_opens=0`;
- exactly one acceptance Setup result and fresh game_id;
- exactly one Opening result;
- turn-0 API/DB checks;
- explicit `automated_gameplay_turns=0`;
- explicit Production/v1/preserved games untouched;
- manual play URL near the bottom.

Then STOP at `WAITING_USER_5TURN`. Do not create another CURRENT_TASK.

If blocked, post one immutable terminal beginning:

`COMPANY_V2_PHASE1_TEST_AUTH_PROBE_BLOCKED`

with the exact first failed boundary, secret-repair count, safe clock/credential metadata only, and explicit confirmation that no gameplay turn was submitted. Then STOP.
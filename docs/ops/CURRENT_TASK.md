# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-product-baseline-auth-resume-v1
Mode: TEST OPS RESUME — AUTH/CLOCK STABILIZATION + ONE-TURN SMOKE + OWNER HANDOFF
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

Accepted product-baseline source:

- source terminal: Issue #68 comment `5341256206`
- source acceptance: Issue #68 comment `5341316161`
- accepted head: `16c5fecd1e407acf9f2f629a1b719e300f11b0ff`
- source merge: `ee46977747dc89b04dca65fc4632e88b45cae7e0`
- previous rollout task: `company-v2-phase1-product-baseline-test-rollout-v1`
- blocked terminal: Issue #68 comment `5341454708`
- operator blocked review: Issue #68 comment `5341509581`

TEST project:

`fmcrspgxstsmxxsmkeee`

Already-deployed exact accepted product baseline:

- API Worker: `game-proxy-company-v2`
- API version: `efddd1cb-5421-424c-b399-b7368b7de5a3`
- Frontend Worker: `gamebuilder-company-v2`
- Frontend version: `916dd497-0119-4649-9754-b2e52be84f5f`

Do NOT redeploy either Worker merely because this task restarted.

## 1. Why the previous rollout stopped

The accepted source deployed successfully. Static frontend reads and CORS passed.

Before Setup, one verified-absent DB-backed context request returned:

`JWT issued at future`

instead of canonical `game_not_found`.

The previous run therefore stopped with:

- new games created = 0
- Setup = 0
- Opening = 0
- `/api/v2/turn` = 0
- automated gameplay turns = 0

This exact auth/clock signature has occurred before and later cleared on the same TEST path without source change or secret repair. Therefore this task must diagnose the auth/clock boundary before considering any credential mutation. Do not reopen the accepted product source from this evidence alone.

## 2. Immutable existing v2 games / start count

Before any authorized Setup, TEST currently contains exactly four pre-existing v2 games. Treat all four as immutable evidence:

1. `88625b46-20fa-42c6-82d5-050a98ee2aad`
   - turn 0
   - zero jobs

2. `0daec355-47a8-4b81-a87d-a47dc25b5b96`
   - failed-user evidence
   - committed_turn 0
   - one historical stuck/failure job

3. `09bece94-f2f3-4936-baab-42f64d078708`
   - pre-existing historical turn-0 Opening
   - old active choices=4
   - zero jobs
   - origin unresolved; do not guess or reuse

4. `70ac9956-b82e-4ca2-905b-ae5b011ae9e4`
   - pre-existing historical turn-0 Opening
   - old active choices=4
   - zero jobs
   - origin unresolved; do not guess or reuse

At task start, read-only verify total `company_v2_games = 4` and these identities/states.

If the count is already greater than 4, or changes before this task's first explicitly authorized Setup, STOP and report the unexpected game(s). Do not delete/reset/reuse them.

Do not call the Company v2 API context endpoint on any of these four games. Direct read-only SQL only.

## 3. Migration / DB guard

Migrations are historical/live and immutable:

- `20260819000200_company_v2_phase1_vertical_slice`
- `20260819000300_company_v2_stuck_turn_closure`
- `20260819000400_company_v2_attempt_fencing`
- `20260819000500_company_v2_acl_closure`

Verify read-only that all four remain recorded exactly once.

Apply/reapply/edit zero migrations.

No RLS/ACL/schema/function/source changes are authorized.

## 4. Live deployment guard — NO REDEPLOY

Read-only verify:

- API target remains `game-proxy-company-v2`, version `efddd1cb-5421-424c-b399-b7368b7de5a3` unless Cloudflare itself reports a later externally-created deployment; if a different version exists, identify it and STOP rather than overwriting it.
- Frontend target remains `gamebuilder-company-v2`, version `916dd497-0119-4649-9754-b2e52be84f5f` under the same rule.
- API secret names include `SUPABASE_SERVICE_ROLE_KEY` and `LLM_API_KEY`; never print values.
- provider URL, STORY_MODEL, EXTRACT_MODEL, SUPABASE_URL and worker identities remain the accepted TEST values.

Do not redeploy API or frontend in this task unless a later section explicitly authorizes only a secret update. A secret update is not a source/config deployment.

## 5. Clock / credential diagnostics before mutation

Never expose raw credentials.

Record only safe metadata:

- runner UTC time;
- trustworthy server UTC from HTTP Date headers from Cloudflare and/or Supabase;
- measured skew;
- whether the current `SUPABASE_SERVICE_ROLE_KEY` is JWT-shaped or opaque;
- if JWT-shaped, locally decode payload only and record safe claims: role, iat, exp, and project/ref-like claim when present;
- require service-role identity and TEST project association where represented.

Do not manufacture/sign/refresh a JWT manually.
Do not rotate Supabase project keys globally.
Do not touch any v1 secret.

## 6. Auth probe A — exactly once

1. Generate a new random UUID.
2. Verify it is absent in `company_v2_games` by direct SQL.
3. Call exactly once:

`GET https://game-proxy-company-v2.zeroslove.workers.dev/api/v2/context?game_id=<ABSENT_UUID_A>`

Expected: structured canonical `game_not_found`.

Also verify CORS OPTIONS `/api/v2/turn` read-only.

If probe A succeeds:

- credential repair count remains 0;
- go directly to section 9.

If probe A returns `JWT issued at future` or equivalent Supabase auth/JWT failure:

- create no game;
- continue only to section 7.

Any source/transport/Illegal-invocation/unrelated deterministic error => STOP immediately.

## 7. One bounded no-mutation re-probe for the known transient signature

This is an ops/auth probe, not a gameplay retry and not LLM regeneration.

Only when probe A failed specifically with `JWT issued at future`/equivalent:

1. Re-read trusted UTC and runner UTC; record skew.
2. Do not change secrets or deploy anything.
3. After a short bounded interval sufficient to distinguish the previously observed transient edge-clock condition, generate a NEW verified-absent UUID B.
4. Call context exactly once for UUID B.

If probe B returns canonical `game_not_found`:

- classify the boundary as transient auth/edge-clock recovery;
- secret repair count = 0;
- continue to section 9.

If probe B fails with the same JWT/auth error:

- continue to section 8.

No third no-mutation probe is allowed.

## 8. Credential decision — at most one correction, only with objective evidence

After two auth failures:

### Case A — current credential metadata is internally valid

If JWT safe metadata shows service_role and `iat` is NOT actually in the future relative to trustworthy UTC, or an opaque key is authoritatively associated with the correct TEST project:

- do NOT rewrite the Worker secret just to try again;
- if available, perform one direct read-only Supabase REST authentication sanity request using the same in-memory credential without printing it, solely to prove whether Supabase itself rejects the credential;
- collect Supabase/API log timing if available;
- STOP with `COMPANY_V2_PHASE1_PRODUCT_BASELINE_AUTH_RESUME_BLOCKED`.

This is evidence of an external/auth-edge condition, not permission to churn secrets.

### Case B — current Worker credential is objectively invalid/stale/mis-associated

Only if safe metadata/source association proves the Worker credential itself is wrong AND a known-good already-authorized TEST service-role credential is available:

1. update ONLY `game-proxy-company-v2` secret `SUPABASE_SERVICE_ROLE_KEY` once;
2. preserve `LLM_API_KEY` and all vars/provider/models/config;
3. record resulting Worker version/deployment identifier if Cloudflare creates one;
4. generate verified-absent UUID C;
5. perform exactly one post-correction context probe.

Require canonical `game_not_found`.

If C fails, STOP. No second secret rewrite.

If no known-good credential source exists, STOP. Never guess or create one.

Maximum Worker service-role secret rewrites in this task: 1.

## 9. Frontend verification — static only

After auth is healthy, verify deployed frontend using raw/static HTTP only:

- `/`
- `/index.html`
- `/config.js`
- `/app.js`
- `/styles.css`

Do not execute JavaScript in a browser/headless browser at the bare root.

Require:

- API base points only to `https://game-proxy-company-v2.zeroslove.workers.dev`;
- product shell regions exist;
- free-form composer exists;
- active choice list is absent;
- no v1 API/runtime authority;
- inline/non-blocking status UI remains present.

No frontend redeploy.

## 10. Smoke game A — exactly one Setup + Opening

Only after auth and static frontend verification pass:

1. Re-read total v2 game count. It must still be exactly 4.
2. POST `/api/v2/setup` exactly once.
3. Record smoke game A ID.
4. POST `/api/v2/opening` exactly once on A.
5. No Setup/Opening retry or replacement if either fails.

After Opening require:

- committed_turn = 0;
- exactly one turn-0 row;
- `choices = []`;
- zero jobs;
- minimal Phase-1 state.

At this point expected total game count = 5.

## 11. Smoke game A — exactly ONE automated gameplay turn

Submit exactly this free-form literal action once:

`서원에게 오늘 첫 업무가 무엇인지 물어본다.`

Requirements:

- one `/api/v2/turn` request only;
- no automatic retry/regeneration;
- capture actual SSE;
- at least one `story_delta` must be observed before terminal;
- terminal must be `committed`;
- no terminal-less stuck stream;
- no second Story call.

Then direct API/DB readback must prove:

- committed_turn = 1;
- turn 1 exists exactly once;
- canonical turn-1 job exists exactly once;
- job status = committed;
- attempt_no = 1;
- literal action exactly matches the submitted Korean text;
- durable `choices = []`;
- non-empty summary;
- no processing residue;
- state revision advanced exactly once;
- Opening remains turn 0;
- all four pre-existing evidence games remain untouched.

### Rich narrative owner law

Inspect the actual committed Story semantically.

It must be a substantial interactive-fiction turn with concrete scene/action/reaction/context and relevant character behavior/dialogue, not a terse status response, protocol text, or one/two-sentence summary.

Literal player intent must be preserved.

If this product law fails, STOP BLOCKED; do not generate another Story to try for a better sample.

## 12. Handoff game B — fresh turn 0 only

Only after smoke game A fully passes:

1. total game count must be exactly 5;
2. create exactly one separate fresh Setup game B;
3. Opening exactly once on B;
4. do not call `/api/v2/turn` for B.

Require B:

- distinct from all five prior games;
- committed_turn = 0;
- one Opening row only;
- `choices = []`;
- zero jobs;
- zero gameplay turns;
- product-baseline Opening/current context readable.

Expected final total game count = 6.

Construct but do not browser-open:

`https://gamebuilder-company-v2.zeroslove.workers.dev/?game_id=<GAME_B_ID>`

Owner/user will manually play 5 natural turns.

## 13. Hard limits

Across this task:

- baseline pre-existing games = 4, all immutable;
- maximum newly created games = 2 (A and B);
- maximum automated gameplay turns = 1 total (A only);
- game B automated gameplay turns = 0;
- source/config/content/test changes = 0;
- migration applies = 0;
- normal Worker redeploys = 0;
- service-role secret rewrites = 0 or 1 only under section 8 Case B;
- no v1/Production/Phase 2 access;
- no preserved-game mutation;
- no bare-root executing browser verification;
- no hidden LLM retry/regeneration.

If any unexplained game appears before an authorized Setup or counts do not match the expected 4 -> 5 -> 6 sequence, STOP and preserve it.

## 14. Terminal

Success terminal:

`COMPANY_V2_PHASE1_PRODUCT_BASELINE_TEST_READY_FOR_USER`

Include:

- task ID / registration SHA / CURRENT_TASK blob;
- previous BLOCKED terminal `5341454708` and review `5341509581`;
- live API/frontend versions actually used;
- migration ledger unchanged;
- baseline four evidence games readback and final unchanged status;
- clock/credential safe metadata summary;
- probe A result;
- probe B result if used;
- secret repair count and post-repair probe if used;
- static frontend verification;
- smoke game A ID, Setup=1, Opening=1, gameplay turn=1;
- real SSE order/evidence;
- A durable turn/job/attempt/choices/summary/readback;
- actual Story product-law assessment;
- handoff game B ID, Setup=1, Opening=1, gameplay=0;
- final total game count=6;
- exact owner manual URL;
- explicit Production/v1/preserved-game/source/migration restrictions honored.

Then STOP at `WAITING_USER_5TURN`.

Blocked terminal:

`COMPANY_V2_PHASE1_PRODUCT_BASELINE_AUTH_RESUME_BLOCKED`

or, after auth passes but a later deterministic boundary fails:

`COMPANY_V2_PHASE1_PRODUCT_BASELINE_TEST_BLOCKED`

Include the first failed boundary and exact operation counts. Then STOP. Do not create another CURRENT_TASK.
# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-r3-native-fetch-binding-correction-v1
Mode: SOURCE/TEST CORRECTION — R3 SUPABASE NATIVE FETCH BINDING ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Watcher re-kick: 2026-08-21 19:08 KST. The prior READY registration at `f49f2ac623a08895a5e1b8b2d1ca75004df07df5` produced no execution lease, no expected source branch, and no `EXECUTION: STARTED` signal after more than 30 minutes. This is the same Task ID and same scope; do not register a new task. Execute this reused CURRENT_TASK exactly once and stop at the declared source-review boundary.

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Why this task exists

Milestone 0 TEST rollout failed before any R3 game was created.

Authoritative failure evidence:

- failed rollout task: `company-full-redesign-milestone0-test-rollout-l0-v1`
- terminal Issue #68 comment: `5368025850`
- operator review: `5368094133`
- rollout registration main: `760532a306794c87cf7f1b754e742ba32ef99a3c`
- accepted Milestone 0 source: PR #97 head `fed4e05108573bb71bb9086a95b9f85e592ebd29`
- merged source on main: `0106cba1860376d35b830c750ee3173e547c044f`
- Product/UI authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- A′ Engine authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`

Live rollout facts already established and MUST NOT be repeated in this source task:

- TEST migration `20260821000100_company_r3_milestone0` was applied exactly once and is now live.
- R3 API Worker deployed as `game-proxy-company-r3`, Version `53b24119-4fbb-47c4-82ca-debb32cb381c`.
- R3 frontend Worker deployed as `gamebuilder-company-r3`, Version `117650ff-b7bb-42f9-81ea-c0a8969f0b9e`.
- Catalog GET and frontend root returned HTTP 200.
- one invalid PowerShell-path Korean Setup attempt became `???`; treat it as harness-invalid evidence only.
- one separately codepoint-constructed UTF-8-safe Setup profile (`김도윤`) also returned HTTP 500 Cloudflare Worker exception.
- no R3 game/state/turn/job row was created; final counts remained zero.
- Opening and ordinary gameplay were not attempted.

## 1. Proven/high-confidence source seam

Current R3 source:

`runtime-r3/server/supabase-store.js`

`R3SupabaseHttp.request()` invokes the injected/native fetch as a property call:

```js
await this.fetchImpl(url, options)
```

That binds `this` to the `R3SupabaseHttp` instance.

The repository's already-corrected production v2 store uses the Cloudflare-safe form:

```js
const fetchImpl = this.fetchImpl;
await fetchImpl(url, options);
```

The rollout evidence matches this boundary:

- `/api/r3/catalogs` succeeds because it does not call Supabase;
- `POST /api/r3/games` is the first public path that calls `SupabaseR3Store.createGame()` -> `R3SupabaseHttp.rpc()` -> `request()`;
- the UTF-8-safe Setup still fails at that boundary with a Worker exception and no DB row.

`runtime-r3/server/provider.js` already calls closure `fetchImpl(...)`; do not modify provider fetch semantics in this task.

## 2. Required correction

Create one source branch from the exact current `main` at lease time.

Recommended branch:

`company-redesign/milestone0-r3-native-fetch-binding-correction-v1`

Open one Draft PR and STOP at source review. Do not merge or deploy.

### 2.1 Regression first

Add a focused regression that is receiver-sensitive and proves the defect rather than merely mocking a permissive fetch.

The regression must exercise the R3 Supabase store/production Setup path with a fetch implementation that fails if invoked with an object receiver and succeeds when invoked as a plain function.

Required proof:

1. the pre-fix call shape would fail because `this !== undefined` (or equivalent receiver-sensitive assertion);
2. after the correction, the same test reaches the expected Supabase RPC/read sequence;
3. the exact Korean profile values remain JSON/UTF-8-safe in the request body;
4. the test does not require a real network, DB, Worker deploy, or provider call.

Use the existing R3 production/store test suite where appropriate; a new focused R3 test file is acceptable if cleaner.

If a receiver-sensitive regression does NOT reproduce/prove this source seam, STOP `BLOCKED_SOURCE_ROOT_CAUSE_NOT_PROVEN` and do not broaden the patch.

### 2.2 Minimal runtime fix

Only after the regression proves the seam, make the minimal production fix in:

`runtime-r3/server/supabase-store.js`

Detach the fetch function before invocation so Cloudflare native fetch is not called as an object method.

Do not change:

- Supabase URL construction;
- headers/auth;
- RPC names or payloads;
- profile schema;
- game/state schema;
- provider behavior/models/timeouts;
- Story/Observer/reducer semantics;
- frontend behavior;
- migration `20260821000100`;
- existing R3 DB/RPC contracts.

Audit all call sites in this file for the same receiver mistake, but do not refactor unrelated code.

## 3. UTF-8 harness finding

The first rollout attempt passed literal Korean through a PowerShell command path and produced `???`. This is a TEST harness/operator transport defect, not product evidence.

Do NOT add runtime normalization, fallback, repair, or encoding heuristics for this.

Record in test/ops evidence that the next live rollout must use an ASCII-only temporary Node `.mjs` (or equivalent byte-safe path) that constructs Korean from Unicode escapes/code points and uses native Node `fetch` + `JSON.stringify` directly.

No Korean JSON body may be piped through PowerShell/cmd stdin/here-string/codepage in the next rollout.

## 4. Migration/live state boundary

Migration `20260821000100_company_r3_milestone0` is already applied on TEST exactly once. It is now historical live migration evidence.

In this task:

- do not edit that applied migration;
- do not apply/reapply any migration;
- do not write a new migration;
- do not mutate R3 ACLs/tables/data;
- do not create, reset, delete, repair, or play any game.

The rollout also observed service_role direct table DML privileges in TEST. Record that observation as follow-up evidence only unless the accepted PR #95/#96 authority explicitly proves it is a blocker for this fetch correction. Do not silently change ACL design inside this task.

## 5. Validation

Required before terminal:

- focused receiver-sensitive R3 Supabase/Setup regression: PASS;
- existing R3 focused tests: PASS;
- full repository test suite: PASS if practical;
- `node --check` on changed JS/test files;
- `git diff --check`: PASS;
- API Wrangler dry-run with `wrangler.r3.api.jsonc`: PASS;
- confirm frontend diff = 0;
- confirm migration/SQL diff = 0;
- confirm provider/model/config/secret diff = 0;
- confirm no live HTTP/DB/deploy/gameplay was performed.

The review report must explicitly compare the corrected R3 fetch invocation with the already-correct v2 fetch-binding pattern and explain why the production boundary is now receiver-safe.

## 6. Forbidden operations

- no migration edit/apply or SQL source change;
- no DB write/read acceptance run beyond static/source inspection;
- no Worker deploy;
- no TEST game creation/Setup/Opening/gameplay;
- no Production/hospital/v1/v2 game access;
- no preserved evidence game mutation;
- no frontend-r3 source change;
- no provider/model/temperature/token/secret/config change;
- no Story/Observer/reducer semantic change;
- no CSA/TTS/Image/Feedback/NPC-search work;
- no Milestone 1;
- no retry-until-pass live behavior;
- no merge/auto-merge.

## 7. Completion boundary

Post one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_R3_NATIVE_FETCH_BINDING_READY_FOR_SOURCE_REVIEW`

Status:

`WAITING_REVIEW`

Include:

- Task ID;
- starting main SHA;
- final source SHA;
- Draft PR number;
- changed paths;
- exact pre-fix receiver-sensitive failure proof;
- exact corrected fetch call form;
- focused/full test results;
- API dry-run result;
- confirmation frontend diff 0;
- confirmation SQL/migration diff 0;
- confirmation DB writes/deploy/gameplay 0;
- confirmation provider/model/config/secret changes 0.

Then STOP for operator source review. Do not merge, redeploy, rerun Setup, or register the rollout resume automatically.
# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-deployability-correction-v1
Mode: SOURCE CORRECTION — R3 DEPLOY ENTRY + ISOLATED WRANGLER WIRING
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Review result / why this task exists

Prior task:

`company-full-redesign-milestone0-choice-dialogue-presentation-correction-v1`

Prior terminal / reviewed source:

- Issue #68 terminal: `5367654843`
- exact reviewed source SHA: `61b106cbd91cf31630db86906969325ec974cdc7`
- Draft PR: #97
- branch: `company-redesign/milestone0-v1`

Operator review:

- Issue #68 comment: `5367754833`
- decision: `CHANGES_REQUIRED_DEPLOYABILITY_ONLY`

The gameplay/product source at `61b106c...` is accepted except for one deployment-boundary blocker: there is no reviewed Cloudflare R3 Worker entry module or isolated R3 Wrangler configuration. Existing repository Wrangler configs still point to Company v1 source/assets. An exact-reviewed-source TEST rollout would therefore require an unreviewed temporary wrapper/config, which is forbidden.

Continue the SAME `company-redesign/milestone0-v1` branch and SAME Draft PR #97. Do not create a parallel source branch or PR.

Before editing, re-read latest Issue #68 comments and verify PR #97 head is exactly `61b106cbd91cf31630db86906969325ec974cdc7` or a descendant containing only this authorized deployability correction. If unrelated source appears, STOP.

## 1. Binding authority

- Product/UI authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- Engine/live-acceptance authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- UI donor: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- reviewed Milestone 0 source: PR #97 @ `61b106cbd91cf31630db86906969325ec974cdc7`
- operator deployability finding: Issue #68 `5367754833`

This task does NOT reopen product design, runtime semantics, provider behavior, persistence semantics, or UI presentation.

## 2. Preserve accepted Milestone 0 source exactly

Do not regress or redesign any accepted behavior at `61b106c...`, including:

- canonical Company `content/*.json` binding;
- complete accepted Setup/profile validation and persistence contract;
- high-parity Company v1 shell/map/Mind Monitor/player presentation;
- full literal Story-authored four-choice surface plus compact launcher and free input;
- direction-bearing dialogue presentation;
- literal action identity;
- one server-owned Story → Observer → reducer → atomic commit operation;
- one `(game, turn)` job, action/attempt fencing, bounded progress writes, reconnect/readback;
- Observer fail-open and no hidden retry/regeneration;
- minimal R3 state / bounded `scene_note`;
- isolated `company_r3_*` migration source;
- no active CSA/TTS/Image/Feedback/dynamic sexual gauge/relation-event/generic physical engine in Milestone 0.

Do not edit runtime/domain/frontend gameplay logic merely to make deployment convenient.

## 3. Required correction A — reviewed Cloudflare R3 API entrypoint

Add the smallest explicit production Worker entry module under `runtime-r3/`.

Recommended path:

`runtime-r3/worker-entry.js`

It must:

- export a Cloudflare module-worker default `fetch` handler;
- construct/use the already-reviewed `createProductionR3Worker({ env, ... })` boundary;
- pass the incoming Request and Cloudflare env into the existing R3 worker without changing gameplay semantics;
- perform no provider fallback, retry, demo-provider substitution, DB compatibility routing, or v1/v2 routing;
- have no imported old `src/engine`, `runtime-v2`, or old frontend authority;
- expose only the existing `/api/r3/*` contract implemented by reviewed source.

Do not create a second R3 runtime or duplicate turn logic in the entrypoint.

## 4. Required correction B — isolated R3 API Wrangler config

Add one repository-tracked R3 API Wrangler config, recommended:

`wrangler.r3.api.jsonc`

Binding deployment identity for TEST/dev Worker:

- Worker name: `game-proxy-company-r3`
- main: the reviewed R3 Worker entry module from Section 3
- workers.dev enabled
- compatibility date may follow the current repository Worker compatibility baseline unless a concrete syntax requirement needs a later compatible date

Use the existing approved provider endpoints/models; do not invent new model/provider settings:

- `SUPABASE_URL = https://fmcrspgxstsmxxsmkeee.supabase.co`
- `LLM_API_URL = https://api.deepseek.com`
- `STORY_MODEL = deepseek-v4-flash`
- `EXTRACT_MODEL = deepseek-v4-flash`

Required secrets are names only; never commit secret values:

- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_API_KEY`

Do NOT add:

- TTS service binding;
- Image service;
- Production route/domain;
- v1/v2 compatibility variables;
- hidden retry flags;
- provider/model changes.

## 5. Required correction C — isolated R3 frontend Wrangler config

Add one repository-tracked static frontend config, recommended:

`wrangler.r3.frontend.jsonc`

Binding identity:

- Worker/assets name: `gamebuilder-company-r3`
- static assets directory: `frontend-r3`
- no Production custom route

The existing reviewed frontend already supports an explicit `?api=<R3 API base>` override. Milestone 0 TEST rollout may use that exact API URL to avoid creating another frontend proxy/state authority.

Do not hardcode the old v1/v2 API Worker into R3 frontend. Do not add a browser Story→Observer→Commit coordinator.

If a tiny static config value is strictly required for deployability, keep it presentation/config-only and report it explicitly. Do not widen product behavior.

## 6. Dry-run / deployability proof

This task is SOURCE ONLY. Do not actually deploy.

Before terminal, prove from the exact PR #97 head:

1. API Wrangler config resolves the intended R3 entry module.
2. Frontend Wrangler config resolves `frontend-r3` assets.
3. Wrangler dry-run/build for both configs succeeds without modifying remote Workers.
4. The API entrypoint can be imported/instantiated with test env bindings and exposes the existing R3 fetch contract.
5. Existing focused R3 tests still pass.
6. Exact-head CI succeeds.
7. Diff check/syntax checks pass.

Add at most one very small deployment-boundary regression test if needed. Do not create a broad deployment test framework.

## 7. Allowed changed paths

Expected narrow additions/changes only:

- `runtime-r3/worker-entry.js` (or one equivalently small R3 production entry module);
- `wrangler.r3.api.jsonc`;
- `wrangler.r3.frontend.jsonc`;
- at most one existing narrow R3 production-boundary test if necessary;
- branch copy of `docs/ops/CURRENT_TASK.md` only if runner lifecycle requires it.

If deployability requires changing Story/Observer/reducer/store/frontend gameplay semantics, STOP and report the exact reason rather than widening this task.

## 8. Operational prohibitions

SOURCE ONLY:

- no PR merge / auto-merge;
- no Supabase migration apply;
- no DB write;
- no Worker/frontend deploy;
- no TEST/Production game creation or gameplay;
- no reset/delete/repair;
- no preserved/manual/evidence game mutation;
- no provider/model/temperature/token/secret change;
- no Milestone 1;
- no active CSA/TTS/Image/Feedback implementation.

Historical v1/v2 data remains read-only.

## 9. Completion boundary

Update the SAME Draft PR #97 and post exactly one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_DEPLOYABILITY_READY_FOR_SOURCE_REVIEW`

Include:

- Task ID;
- starting reviewed SHA `61b106cbd91cf31630db86906969325ec974cdc7`;
- final exact PR #97 head;
- exact changed paths;
- R3 API Worker entrypoint proof;
- R3 API Worker name/config summary;
- R3 frontend Worker name/config summary;
- Wrangler API dry-run result;
- Wrangler frontend dry-run result;
- focused R3 validation + exact-head CI;
- confirmation accepted gameplay/product semantics unchanged;
- migration applies 0;
- DB writes 0;
- deploys 0;
- gameplay 0;
- preserved-game mutations 0.

Then STOP `WAITING_REVIEW`.

Do not merge or deploy automatically.

## 10. Next action after this review passes

This is intended to be the LAST Milestone 0 source correction before live TEST.

On successful operator source review:

1. accept the exact PR #97 head;
2. merge PR #97 with `expected_head_sha` equal to the exact reviewed head;
3. register a separate `company-full-redesign-milestone0-test-rollout-l0-v1` CURRENT_TASK;
4. that rollout task may apply the reviewed `20260821000100_company_r3_milestone0.sql` migration exactly once to TEST, deploy only the reviewed R3 API/frontend Workers, create one fresh R3 TEST game, perform Setup + Opening only, inspect DB/SSE/product evidence, and STOP for owner review before ordinary automated gameplay.

If Opening feels like a helpdesk/demo, uses wrong Company people/location, speaks for the player, misses the private `상식개변` premise, hides streaming, or visibly fails Company v1 UI parity, the build fails immediately and deeper Milestone work must not proceed.
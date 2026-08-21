# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-test-rollout-l0-v1
Mode: TEST ROLLOUT / SETUP + OPENING ACCEPTANCE ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Why this task exists

Company Full Redesign Milestone 0 source has completed operator source review.

Accepted source identity:

- Product/UI authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- Engine/live-acceptance authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- Company v1 UI donor snapshot: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- Milestone 0 source PR: #97
- exact accepted PR #97 head: `fed4e05108573bb71bb9086a95b9f85e592ebd29`
- source acceptance Issue #68 comment: `5367890436`
- exact merge commit on `main`: `0106cba1860376d35b830c750ee3173e547c044f`
- reviewed migration source: `supabase/migrations/20260821000100_company_r3_milestone0.sql`
- API Wrangler config: `wrangler.r3.api.jsonc`
- Frontend Wrangler config: `wrangler.r3.frontend.jsonc`

This task is the first live TEST gate for the R3 redesign. It is NOT Milestone 1 and it does not authorize ordinary automated gameplay.

## 1. Hard scope

Execute only the following bounded rollout:

1. verify TEST DB pre-state and that migration `20260821000100_company_r3_milestone0` has not already been applied;
2. apply that reviewed migration exactly once to TEST if absent;
3. verify the exact `company_r3_*` tables, RPC signatures, ACLs, and no mutation of historical v1/v2 namespaces;
4. deploy only the reviewed R3 API Worker from exact merged source/config;
5. deploy only the reviewed R3 frontend Worker from exact merged source/config;
6. verify both deployed Worker identities/health/basic catalog response;
7. create exactly one fresh R3 TEST game through the reviewed public R3 API;
8. submit one complete canonical Setup/profile only once;
9. create/stream Opening exactly once;
10. inspect DB + SSE + rendered product evidence for Setup and Opening;
11. STOP `WAITING_OWNER_REVIEW` before any ordinary Turn 1 gameplay.

No free-text action and no choice click after Opening in this task.

## 2. Binding product/runtime requirements

The rollout passes only if the deployed product matches the accepted redesign authority, not merely if HTTP succeeds.

### 2.1 Product identity

The screen and Opening must unmistakably be `상식개변: 회사편`, a company-life interactive fiction game.

Immediate FAIL if the product behaves like:

- a productivity assistant;
- a generic chat/helpdesk;
- a blank R3 demo shell;
- an unrelated company simulator without the private `상식개변` premise.

### 2.2 UI donor parity

Use the already reviewed `frontend-r3` built from the Company v1 donor snapshot `5ec1a76...`.

At Setup/Opening verify, at minimum:

- title/header/day/time/turn/connectivity hierarchy;
- Story/history/current-stream area is the primary surface;
- streaming Story stays visible while generating; no blocking loading overlay covers it;
- Setup UI exposes the accepted full profile fields, including name, department, position, age, height, weight, `penis_length_cm`, body type, and speech style;
- company map presentation is present at donor-level information architecture, not a generic flat debug list;
- Mind Monitor surface exists and never exposes raw actor IDs to the user;
- current character/scene and player panels use canonical Korean names/labels, not catalog IDs;
- four-choice presentation and free-input surface are visible only according to the accepted Opening result and product authority; do not submit either in this rollout;
- disabled/deferred Milestone 0 features do not claim fake functionality.

### 2.3 Canonical Company content

Opening must use repository Company canon:

- canonical registered actors only;
- canonical location ID resolved to the correct Korean location name/context;
- relevant heroine/general-NPC facts where applicable;
- no fabricated `서원/다현/민지` demo roster or unknown semantic NPC;
- no raw internal IDs in visible prose/UI.

### 2.4 Opening narrative law

Opening must establish a real company scene and the player's private unfamiliar `상식개변` app premise.

Immediate FAIL if Opening:

- asks `무슨 업무를 도와드릴까요?` or equivalent assistant/help framing;
- invents an unregistered person;
- uses the wrong character identity/name;
- speaks or chooses an action for the player beyond the accepted opening setup;
- loses the private-app premise;
- produces only a terse status/protocol response rather than a meaningful scene;
- hides Story streaming behind loading UI.

The four Story-authored next actions may be observed and inspected, but must NOT be clicked in this task.

## 3. Migration gate

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.

Before apply:

- query `supabase_migrations.schema_migrations` for version `20260821000100`;
- inventory existing `company_r3_*` relations/functions;
- if the migration is already present, do NOT apply it again; verify exact expected objects and report that it was pre-existing;
- if absent, apply exactly the reviewed file from merge source `0106cba...` once;
- no broad migration push or unrelated migration apply.

After apply verify:

Tables:

- `company_r3_games`
- `company_r3_state`
- `company_r3_turn_jobs`
- `company_r3_turns`
- `company_r3_system_events`

RPCs:

- `company_r3_create_game(text,jsonb,jsonb)`
- `company_r3_create_opening(uuid,text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)`
- `company_r3_expire_stale_turn(uuid,integer)`
- `company_r3_reserve_turn(uuid,integer,uuid,text,boolean)`
- `company_r3_update_turn_progress(uuid,integer,uuid,integer,text)`
- `company_r3_mark_story_complete(uuid,integer,uuid,integer,text)`
- `company_r3_fail_turn(uuid,integer,uuid,integer,text)`
- `company_r3_commit_turn(uuid,integer,uuid,integer,integer,text,jsonb,text,jsonb,jsonb,jsonb,jsonb,jsonb)`

ACL requirements:

- public/anon/authenticated have no table or RPC authority;
- service_role has SELECT on R3 tables and EXECUTE on the exact R3 RPCs;
- do not alter historical v1/v2 tables/RPCs/data.

## 4. Exact deployment gate

Deploy from `main` containing merge commit `0106cba1860376d35b830c750ee3173e547c044f` plus only this CURRENT_TASK registration commit.

### API Worker

Use:

`wrangler.r3.api.jsonc`

Expected identity:

`game-proxy-company-r3`

Expected entry:

`runtime-r3/worker-entry.js`

Preserve reviewed vars/models and existing authorized secrets. Do not change provider/model/temperature/tokens/secrets.

### Frontend Worker

Use:

`wrangler.r3.frontend.jsonc`

Expected identity:

`gamebuilder-company-r3`

Expected assets:

`frontend-r3`

No Production custom route and no v1/v2 Worker overwrite.

Record exact resulting Worker version/deployment identifiers in the terminal report.

## 5. Fresh TEST game protocol

Create exactly one new R3 TEST game through the deployed R3 API.

Do not reuse, reset, delete, repair, or mutate any historical v1/v2/R3 evidence game.

### Setup

Use one valid canonical profile. Preserve Korean UTF-8 exactly; do not use a shell path that can corrupt Korean text.

The exact chosen profile values must be reported in the terminal evidence. Do not alter the accepted setup schema merely for the smoke.

After Setup, inspect direct DB state for the new game and prove:

- one `company_r3_games` row;
- one `company_r3_state` row;
- profile values round-trip exactly;
- canonical content version stored;
- committed turn remains 0 before Opening;
- no job rows created by Setup.

### Opening

Call the deployed Opening endpoint exactly once for that game:

`POST /api/r3/games/{game_id}/opening`

Capture the actual SSE sequence.

Required evidence:

- Story emits one or more `story_delta` events before terminal;
- exactly one terminal event;
- terminal is `committed`;
- no retry/regeneration;
- no subrequest-exhaustion error;
- no second Opening request;
- turn 0 is durably stored once;
- no gameplay turn job is created by Opening.

After Opening, direct DB read must prove:

- `company_r3_state.committed_turn = 0`;
- revision remains the reviewed Opening value;
- exactly one `company_r3_turns` row at turn 0;
- `literal_action = ''` for Opening;
- non-empty rich `story_text`;
- `choices` is an array containing the actual Story-authored Opening choices when extraction succeeds;
- non-empty `turn_summary`;
- `state_after` present;
- canonical location/present actor state is valid;
- zero `company_r3_turn_jobs` rows for the game.

Observer is fail-open: an Observer failure alone does not invalidate a valid Story, but it must be reported with warnings and must not invent actor/location state.

## 6. Visual/product inspection

This rollout must inspect the deployed frontend using the fresh game, not only API/DB output.

Capture/report whether each gate passes:

1. full Setup surface parity;
2. Opening Story visibly streams without a blocking overlay;
3. correct `상식개변: 회사편` identity;
4. canonical Korean actor/location labels;
5. no raw IDs in user-facing Mind Monitor/current-character/player surfaces;
6. company map keeps the accepted donor presentation;
7. four full natural Story-authored choices are presented when available;
8. free input remains available;
9. deferred Milestone 0 features are not falsely active.

If any of these visibly fails, STOP as `FAILED_PRODUCT_ACCEPTANCE`; do not continue to ordinary gameplay and do not patch during rollout.

## 7. Forbidden in this task

- no source/runtime/frontend patch;
- no migration source edit;
- no second migration or broad migration push;
- no ordinary Turn 1 automated gameplay;
- no choice submission;
- no free-text action submission;
- no retries/regeneration unless an existing explicit failed-attempt contract is separately authorized (it is not authorized here);
- no reset/delete/repair of any existing game;
- no Production/hospital-v2 access;
- no v1/v2 Worker deployment or routing change;
- no active CSA implementation or transaction;
- no TTS;
- no Image;
- no Feedback revision;
- no standalone NPC search;
- no dynamic sexual gauge/progression;
- no relationship/event engine;
- no generic physical ontology;
- no provider/model/config/secret change;
- no Milestone 1;
- no new PR/branch/source commit except runner-required evidence outside repository; no merge.

If a source defect is found, STOP and report exact evidence. The next task must be a narrow source correction; do not hotfix the deployed Worker in this rollout.

## 8. Completion boundary

On success post exactly one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_TEST_OPENING_READY_FOR_OWNER`

Status:

`WAITING_OWNER_REVIEW`

Include:

- Task ID;
- registration main SHA/current task blob;
- accepted source head `fed4e051...` and merge SHA `0106cba...`;
- migration pre-state and whether apply count was 0 or 1;
- exact R3 DB object/ACL verification;
- API Worker version/deployment ID;
- frontend Worker version/deployment ID;
- fresh R3 game ID;
- exact Setup profile used and UTF-8 proof;
- Setup DB readback;
- Opening SSE event counts/order/terminal;
- Opening DB readback;
- actual Opening Story/product inspection summary;
- actual Opening choices observed but confirmation none were submitted;
- UI parity checklist results;
- confirmation ordinary gameplay turns = 0;
- confirmation old/preserved game mutations = 0;
- source changes = 0;
- provider/model/config changes = 0.

Then STOP. Do not register Milestone 1 automatically.

On failure post one terminal report with exact failure classification and evidence, then STOP. Do not patch or continue deeper rollout.

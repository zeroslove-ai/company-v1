# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-source-correction-v1
Mode: SOURCE CORRECTION — A′ MILESTONE 0 REVIEW FIX
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Why this correction exists

Milestone 0 candidate PR #97 was reviewed at exact source SHA:

`7c0ffda17606fc6ae63f8e3c3822cca1030c5c7f`

Operator review comment:

`5366531619`

Decision: `CHANGES_REQUIRED`.

Do not merge or deploy the reviewed candidate. This task is a narrow source correction of Milestone 0 only. Do not start Milestone 1.

Continue the existing source branch / Draft PR rather than opening a parallel implementation line:

- branch: `company-redesign/milestone0-v1`
- Draft PR: #97
- exact reviewed starting source head: `7c0ffda17606fc6ae63f8e3c3822cca1030c5c7f`

Before editing, verify PR #97 still points to that exact head or a descendant containing only this authorized correction work. If unrelated source has appeared, STOP and report the mismatch.

## 1. Binding authority remains unchanged

Product / UI authority:

- PR #95 design head: `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- latest locked owner decisions in Issue #68, especially `5364770509`

Engine / acceptance authority:

- PR #96 design head: `9d44c4719fa6b098d53cac5cf946b93fafa6786b`

Presentation donor:

- exact Company v1 snapshot: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- donor presentation root: `src/frontend/pages/*`

Do not reopen product decisions for implementation convenience.

## 2. Preserve the accepted Milestone 0 direction

Keep these already-valid properties unless the correction itself requires a narrow mechanical change:

- isolated `runtime-r3/` + `frontend-r3/` roots;
- canonical repository `content/*.json` semantic authority;
- accepted full Setup/profile contract including `penis_length_cm`;
- one server-owned player turn;
- Story once and visibly streamed;
- one small post-Story Observer;
- Observer fail-open;
- pure minimal reducer;
- one atomic Commit boundary;
- one job per `(game_id, turn_number)`;
- action identity and attempt fencing;
- bounded Story progress writes;
- explicit retry only, no hidden regeneration;
- isolated additive `company_r3_*` namespace;
- no old v1/v2 game migration or compatibility writer;
- no browser-owned Story → Observer → Commit coordinator;
- no active CSA/TTS/Image/Feedback runtime in Milestone 0;
- no dynamic sexual gauges, relation/event engine, generic physical ontology, or speculative memory system.

## 3. Correction A — make Company canon real Story/Opening input

Current defect:

`runtime-r3/domain/memory.js::buildStoryContext()` currently projects profile/time/scene/clothing/recent history but does not project the actual Company semantic context required by the design.

Correct the production Story context so the Story LLM receives a bounded, canonical projection including:

1. literal player action verbatim;
2. validated player profile projection appropriate to Story;
3. current company time;
4. canonical current location:
   - stable location ID;
   - user-facing name;
   - source description;
   - only bounded relevant adjacency/context if needed;
5. currently present/relevant registered actor IDs and user-facing names;
6. compact prompt-card canon for relevant heroines only;
7. role/department/personality/speech facts needed for relevant general NPCs only;
8. bounded `scene_note`;
9. recent raw committed turns;
10. older chronological summaries under the accepted budget;
11. the private `상식개변` product premise appropriate to the current phase.

Opening must receive an explicit opening-mode product context, not only `opening=true`.

Opening contract must make clear to Story that:

- this is `상식개변: 회사편`, not a productivity assistant;
- the player privately discovers/has the unfamiliar `상식개변` app premise defined by the Product Constitution;
- NPCs do not know that private app premise unless the player reveals it;
- only registered Company actors may be used as identified NPCs;
- no unrequested player action is completed for the player;
- the scene returns agency to free input + Story-authored choices.

Do not hard-code heroine prose or a shadow roster in runtime. Resolve semantic data from the canonical content adapter.

Add focused tests that fail if Story/Opening context omits canonical location description, relevant actor canon, registered general-NPC facts, or the private app premise.

## 4. Correction B — implement a real Worker-compatible canonical content path

Current defect:

`runtime-r3/domain/content-loader.js` uses `node:fs`, which is suitable for Node tests but is not the production Cloudflare Worker content-loading path. The default production worker currently receives no `content` object.

Required result:

- keep a Node loader for tests if useful;
- add a Worker-compatible content binding/build path that consumes the same repository `content/*.json` authority without runtime `node:fs`;
- the actual production R3 Worker entry must construct/receive canonical content deterministically;
- no copied hand-maintained semantic lists in `runtime-r3`, `frontend-r3`, SQL, or tests;
- prove finite catalog identity/count parity against repository source in focused tests.

Do not solve this by moving demo/static names into another JS file.

## 5. Correction C — implement the actual async Supabase R3 store

Current defect:

Milestone 0 authored `company_r3_*` tables/RPC SQL but source exposes only `InMemoryR3Store`. Worker methods currently assume synchronous store calls. `createProductionR3Worker()` expects injected `env.R3_STORE`/provider/content, while the default export does not construct a deployable production stack.

Implement a real Supabase-backed R3 store adapter matching the authored migration/RPC contract.

The production store must support at minimum:

- create game / profile + initial state;
- context read;
- Opening durable write/readback;
- get canonical job;
- reserve turn;
- bounded progress update;
- mark Story-complete semantics if required by the chosen store contract;
- fail turn;
- fenced atomic commit;
- chronological committed-turn readback;
- stale-job expiry/reconnect behavior required by A′.

Make the runtime boundary explicitly async where remote persistence is involved. Do not hide network I/O behind fake synchronous APIs.

Production worker construction must be real and reviewable: given the approved environment/bindings it must instantiate the provider, canonical content, and Supabase-backed store rather than requiring an impossible prebuilt JS object on `env`.

Preserve:

- exact one-job identity;
- `action_id` + `attempt_no` fencing;
- committed-turn/revision conflict protection;
- literal action stored from the reserved job;
- one atomic durable commit;
- no direct browser DB writes;
- no v1/v2 table access.

If the current migration/RPC source lacks a narrow RPC needed for the accepted A′ lifecycle, edit the unapplied R3 migration source in this same PR. Do not create compatibility aliases or touch historical migration files.

### Source-only boundary remains

Do NOT apply the migration in this task.
Do NOT write to Supabase.
Do NOT deploy a Worker.
Do NOT create/play a game.

## 6. Correction D — restore real donor presentation wiring, not reduced renderers

Current defect:

The candidate copied much of the donor HTML/CSS but `frontend-r3/app.js` reconstructs important surfaces in reduced form.

Correct the thin R3 presentation layer so the established donor presentation is actually used at high parity while the old coordinator authority remains excluded.

### Company map

Do not replace the donor map with a flat location-button list.

Preserve the donor building/floor/location presentation and current-location indication from snapshot `5ec1a76...`, with only a thin data adapter to canonical R3 catalogs/state.

Map click remains presentation-only intent assistance:

- it may prefill a literal movement/action sentence;
- it must not mutate scene/location directly;
- it must not become a second navigation writer.

### Mind Monitor

Preserve the donor tabs/cards/empty-state presentation.

- never show internal actor IDs to the player;
- display canonical actor names;
- only current observer-provided `{surface, subconscious}` data;
- explicit empty state when no monitor exists;
- no fabricated monitor entries.

### Current character / scene

Populate the donor current-character/scene presentation using canonical labels/names rather than raw IDs.

Do not invent a focal actor when none is authoritative.

### Player profile/state

Render canonical department/position/body/speech labels from catalog IDs. Internal IDs may remain durable authority but are not the default player-facing text.

### Story / choices / input

Preserve current good behavior:

- streaming Story stays visible;
- no blocking loading overlay;
- four valid Story-authored choices render when available;
- free input always remains available;
- choice click submits the exact full literal action;
- no stale prior choices.

### Excluded sidecars

CSA/TTS/Image/Feedback remain disabled/nonfunctional in Milestone 0 exactly as the authority requires. Do not activate them while fixing presentation parity.

## 7. Strengthen focused forward tests

Existing test `test/r3-frontend-contract.test.mjs` is insufficient because string-presence assertions can pass a reduced reimplementation.

Add focused forward tests that directly prove:

1. Story context contains canonical location name/description and relevant actor canon without shadow lists;
2. Opening context contains the private `상식개변` premise and registered actor authority;
3. production entry has Worker-compatible canonical content wiring and no production dependency on `node:fs`;
4. Supabase R3 store maps each lifecycle operation to the expected `company_r3_*` RPC/read boundary and is awaited by Worker code;
5. production worker construction does not require injected fake JS store/provider objects;
6. company map renderer preserves floor/location grouping rather than a flat list;
7. Mind Monitor and player/scene presentation resolve canonical display names/labels, not internal IDs;
8. free input and choice click send exact literal actions;
9. no browser `/story`→`/observer`→`/commit` stage coordinator exists;
10. excluded runtime features remain absent.

Keep tests small and forward-facing. Do not resurrect obsolete v1/v2 architecture merely to satisfy old tests.

Run:

- focused R3 tests;
- relevant exact-head CI;
- syntax checks for changed JS/MJS;
- `git diff --check`;
- any Worker dry-run/build check that performs no deploy and no DB/network mutation.

## 8. Files / scope

Expected edits are limited to the existing Milestone 0 source family, such as:

- `runtime-r3/**`;
- `frontend-r3/**`;
- `test/r3-*.test.mjs`;
- the unapplied `supabase/migrations/20260821000100_company_r3_milestone0.sql` only if required to make the accepted R3 persistence contract coherent.

Do not edit old `runtime-v2/`, `frontend-v2/`, `src/engine/`, or old Company frontend implementation except read-only donor inspection.

Do not edit PR #95/#96 design authority from this source correction task.

## 9. Operational prohibitions

Until a later source acceptance and rollout task:

- no merge;
- no auto-merge;
- no migration apply;
- no DB writes;
- no Worker deploy;
- no TEST/Production game creation or gameplay;
- no reset/delete/repair of any existing game;
- no Production/hospital access;
- no provider/model/temperature/token/secret changes;
- no start of Milestone 1;
- no CSA/TTS/Image/Feedback runtime activation.

## 10. Completion / stop boundary

Update existing Draft PR #97 with the correction and stop for operator source review.

Post one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_CORRECTION_READY_FOR_SOURCE_REVIEW`

Include:

- `TASK_ID: company-full-redesign-milestone0-source-correction-v1`;
- starting reviewed source SHA `7c0ffda17606fc6ae63f8e3c3822cca1030c5c7f`;
- final source SHA;
- PR #97 exact head;
- exact changed paths;
- Story/Opening canonical-context proof;
- Worker-compatible content proof;
- Supabase R3 store/async lifecycle inventory;
- donor UI renderer parity proof;
- focused tests + CI/build results;
- confirmation: migration applies 0, DB writes 0, deploys 0, gameplay 0, preserved games mutated 0.

Then STOP at `WAITING_REVIEW`.

Do not merge or register a rollout/Milestone 1 task automatically.

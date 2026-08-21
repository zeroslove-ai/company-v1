# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-ui-parity-first-content-correction-v1
Mode: SOURCE CORRECTION — DONOR UI PARITY + STORY FIRST-CONTENT BOUNDARY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Review result

Prior task:

`company-full-redesign-milestone0-production-boundary-correction-v1`

Prior terminal / reviewed source:

- Issue #68 terminal: `5367097429`
- exact reviewed source SHA: `80594a1b9c9c26c007cc72879086b8e6cf962421`
- Draft PR: #97
- branch: `company-redesign/milestone0-v1`

Operator review:

- Issue #68 comment: `5367229499`
- decision: `CHANGES_REQUIRED`

Do not merge, deploy, or apply the migration at `80594a1...`.

Continue the SAME `company-redesign/milestone0-v1` branch and Draft PR #97. Do not create a parallel implementation branch or PR.

Before editing, re-check Issue #68 and verify PR #97 exact head is `80594a1b9c9c26c007cc72879086b8e6cf962421` or a descendant containing only this authorized correction. If unrelated source appeared, STOP.

## 1. Binding authority

- Product/UI authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- Engine/acceptance authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- exact Company v1 UI donor snapshot: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- owner redesign decisions: Issue #68, especially `5364770509`

This task does NOT reopen product design.

The binding donor boundary is explicit:

- `src/frontend/pages/index.html` + responsive shell/CSS: HIGH-PARITY TRANSPLANT;
- `render.js`: TRANSPLANT Story/dialogue/history/four-choice presentation; narrow R3 data rewiring only;
- Setup DOM + `setup.js`: KEEP / near-verbatim; new R3 creation API wiring only;
- `company-map.js/css`: KEEP / LIGHT REWIRE; clicks only prefill literal action;
- Mind Monitor presentation: TRANSPLANT; observer supplies new data;
- `view-model.js`: REBUILD around minimal R3 state;
- old `app.js` browser Story→Extract→Commit coordinator: DO NOT TRANSPLANT; replace only controller authority with one thin server-turn client.

Do not reinterpret “clean runtime” as permission to redesign or simplify the product UI.

## 2. Preserve accepted work from `80594a1...`

Do not regress:

- canonical `content/*.json` binding and real Company characters/locations;
- canonical Company Opening / Story context;
- A′ one server-owned turn;
- Story once + one post-Story Observer;
- Observer fail-open;
- one `(game_id, turn_number)` job;
- literal action identity + action/attempt fencing;
- bounded progress writes;
- atomic ordinary-turn Commit;
- atomic canonical Opening state persistence on Supabase;
- terminal-required SSE success contract;
- total Story deadline through streamed body;
- non-next turn reservation rejection;
- real async `SupabaseR3Store` production construction;
- isolated `company_r3_*` namespace source;
- no v1/v2 compatibility writer;
- no active CSA/TTS/Image/Feedback runtime in Milestone 0;
- no dynamic sexual gauge, relationship/event engine, generic physical ontology, or speculative memory engine.

The unapplied migration remains unapplied.

## 3. Correction A — actually transplant the completed Company UI presentation

### Proven defect

Current `frontend-r3/app.js` is a new all-in-one renderer. It reimplements:

- Story/history rendering;
- choice rendering;
- Setup handling;
- company map rendering;
- Mind Monitor rendering.

Committed `turn.story_text` is currently rendered as one plain paragraph and choices are rebuilt directly from strings. This violates PR #95/#96, which intentionally separated runtime-kernel replacement from Company product/UI salvage.

### Required outcome

Milestone 0 must look and behave like the completed Company donor, not like a new demo shell.

1. Transplant the donor presentation modules/surfaces at high parity into `frontend-r3/` rather than reimplementing them in `app.js`.
2. Preserve the donor Story/dialogue/history/choice cards and compact four-choice launcher behavior with only the smallest R3 data adaptation.
3. Preserve donor Setup presentation/fields, including all accepted profile fields, and move Setup presentation/event logic out of the all-in-one controller into the donor-style module boundary.
4. Preserve donor company-map presentation and interaction. Map/location/NPC clicks may only prefill a literal action; they never mutate movement or scene state directly.
5. Preserve donor Mind Monitor presentation while feeding it only R3 observer data for currently relevant/present actors.
6. Keep `frontend-r3/app.js` thin: load context/catalogs, submit one literal action, consume one server-owned SSE turn, update the view. It must not become a second rendering/product implementation or a browser turn coordinator.
7. Do not activate deferred sidecars. Existing TTS/Image/Feedback/history-download/CSA mutation controls may remain disabled/placeholder exactly as Milestone 0 authority allows; do not invent replacement UX.
8. Do not import the old v1 runtime/turn coordinator or old semantic engine.

### Plain Story / presentation adapter law

PR #96 deliberately keeps canonical Story as plain player-visible text.

It also explicitly allows a **safe presentation-only parser after Commit** to turn unambiguous visible dialogue / choice text into the existing donor cards/buttons. Therefore:

- implement only a display parser/adapter needed by the donor renderer;
- it is NOT durable authority and NOT a Story validity gate;
- parser failure falls back to readable raw Story;
- no retry/regeneration/provider change because presentation parsing is imperfect;
- use observer-projected current-turn choices as the canonical button literals;
- do not create a second semantic parser/protocol or rewrite the literal choices;
- avoid duplicate display of the trailing four choices in both raw Story and the separate choice UI after Commit.

Recommended visible dialogue convention from A′ remains readable plain text, e.g. `서원희(조금 고개를 기울이며): "대사"`.

## 4. Correction B — first-content deadline must start at Story invocation

### Remaining boundary defect

At `80594a1...`, `storyFirstContentMs` starts inside `readOpenAiStream()` only after `fetch()` has already returned response headers.

A slow header response can therefore exceed the nominal first-content deadline while remaining below the total Story deadline.

### Required behavior

- first-content deadline spans Story invocation/request start through the first non-empty Story content delta;
- once first non-empty content arrives, only that deadline is cleared;
- independent total Story deadline still spans request + complete body stream;
- no hidden retry/regeneration;
- Observer timeout behavior remains unchanged.

Add one deterministic slow-header regression proving header latency counts toward first-content timeout, while preserving the already-passing tests for first delta / continued stream / total timeout / one provider call.

## 5. Product-parity verification before another rollout task

This is still source-only, but UI parity is now a review gate.

Required evidence:

1. file/module inventory showing how each binding donor surface maps into `frontend-r3/`;
2. focused tests proving free-form literal submission and exact four current-turn literals remain unchanged;
3. focused presentation test/fixture proving a committed plain Story with at least narration + dialogue + four choices renders through the donor-style presentation and raw fallback remains readable;
4. Setup and map clicks remain presentation/prefill only;
5. if existing local/headless browser tooling is available without adding a heavy new framework, capture desktop + mobile local screenshots against a deterministic mock R3 context and report artifact paths; otherwise report the exact tooling absence and provide DOM/module parity evidence. Do not deploy merely to obtain screenshots;
6. exact-head CI, changed JS/MJS syntax, `git diff --check`, and Worker/build dry-run if available with zero network mutation.

Do not count broad legacy test totals as product acceptance.

## 6. Allowed scope

Expected edits only in the existing Milestone 0 family:

- `frontend-r3/**`;
- `runtime-r3/server/provider.js` only for the first-content boundary;
- narrow `test/r3-*.test.mjs` / presentation fixtures;
- branch copy of `docs/ops/CURRENT_TASK.md` only if runner lifecycle requires it.

Do not touch the R3 migration or persistence unless a direct regression from this task proves it necessary. The accepted production-boundary fixes should remain unchanged.

Do not edit:

- `runtime-v2/` / `frontend-v2/`;
- old `src/engine/` or old frontend implementation in place;
- PR #95/#96 authority docs;
- historical applied migrations;
- preserved games/data.

Donor files at `5ec1a76...` are read-only source material; transplant/copy into `frontend-r3/` as needed rather than modifying historical authority.

## 7. Operational prohibitions

SOURCE ONLY:

- no merge / auto-merge;
- no migration apply;
- no Supabase DB write;
- no Worker/frontend deploy;
- no TEST/Production game creation or gameplay;
- no reset/delete/repair;
- no provider/model/temperature/token/secret/config change;
- no Milestone 1;
- no active CSA/TTS/Image/Feedback implementation.

All historical/manual/evidence games remain read-only.

## 8. Completion boundary

Update the SAME Draft PR #97 and post one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_UI_PARITY_READY_FOR_SOURCE_REVIEW`

Include:

- Task ID;
- starting reviewed SHA `80594a1b9c9c26c007cc72879086b8e6cf962421`;
- final exact PR #97 head;
- exact changed paths;
- donor module mapping (`index/CSS`, render, Setup, map, Mind Monitor, thin controller);
- plain-Story safe presentation adapter/fallback proof;
- four literal choice identity proof;
- first-content slow-header timeout proof;
- focused validation + exact-head CI;
- screenshot artifact paths if available;
- migration applies 0;
- DB writes 0;
- deploys 0;
- gameplay 0;
- preserved-game mutations 0.

Then STOP `WAITING_REVIEW`.

Do not merge or register TEST rollout/Milestone 1 automatically.
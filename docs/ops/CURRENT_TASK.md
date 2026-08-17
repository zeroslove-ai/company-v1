# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: gameplay-core-simplification-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active **gameplay implementation** execution authority for this branch. This is a bounded rework of the same Cut 1 task after operator `CHANGES_REQUIRED`; it is not a new Cut. PR #69 remains separate infrastructure-only scope and is out of scope.

## Rework authority

Review requiring correction:
- Issue #68 comment: `5316218766`
- Review node: `IC_kwDOTfvo8c8AAAABPN8Pjg`
- Review: `CHANGES_REQUIRED`
- Verified baseline SHA: `7b4964d647550f658bb47bb4b5eea35b63ee50db`
- Canonical PR: #70
- Previous final task blob: `0b69e6a00a503bc78049e64234fd9dcb3edba69a`

The owner/operator authorizes **only the eight required corrections below inside the existing `gameplay-core-simplification-v1` Cut 1 scope**. Preserve the deletion-first architecture direction. Do not restore removed contracts merely to make stale tests pass.

Read before editing:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
6. `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`
7. Issue #68 review comment `5316218766`
8. this file

Then fresh-fetch `main`, this branch, PR #70, and Issue #68. If a newer owner instruction supersedes this rework, STOP.

## Canonical identities

Repository: `zeroslove-ai/company-v1`
Implementation branch: `company/gameplay-core-simplification-v1`
Canonical PR: #70
Rework baseline: `7b4964d647550f658bb47bb4b5eea35b63ee50db`
Base `main` at Cut 1 design start: `9d1a80137980baa67ccfba60bae2173ca17cf8d8`
Accepted landed Minimal Story Runtime executable ancestor: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
Owner canon: `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`
Separate infra PR #69: OUT OF SCOPE

## Objective

Finish the already-started deletion-first Cut 1 so the fresh runtime remains explainable as:

`literal input → minimal context → Story → narrow Extract → one Commit → committed readback`

Correct the eight review findings without adding a semantic verifier, compatibility mirror, generic execution gateway, retry loop, provider/model workaround, or new parser generation.

## Required corrections — all eight are binding

### 1. Remove universal workplace-fiction / work-agenda authority

Remove the remaining universal `Write natural Korean workplace fiction` / workplace-fiction / work-motive framing from fresh Story and Opening. Company, department, role, map, and workplace identity may remain as world facts, but Story/Opening must not impose a work quest, onboarding agenda, meeting agenda, or replacement genre/work gate after the player chooses another focus.

Do not restore removed `work_hook`, work goal/focus, or semantic scene identity contracts.

### 2. Human-centered heroine prompt cards

Revise `content/characters.json` and the fresh character projection as needed so heroine prompt cards express human characterization, speech, individuality, preferences, temperament, and role identity separately.

Remove old permanent work-performance / mandatory-enactment language, including directives that an already-decided or confirmed action must be performed or continued. Department/position/role remain ordinary identity fields, not behavioral compulsion.

### 3. Exact clothing CSA subject scope, including player

Fix exact structured `clothing_state.required_state` synchronization and Story projection so they honor the **existing** CSA subject scope. Reuse existing scope matching; do not invent a new DSL or gateway.

At minimum preserve correct behavior for existing scopes:
- `player`
- `female_employee`
- `male_employee`
- `company_employee`

Requirements:
- a player-scoped clothing rule updates the existing player clothing state (`player_scene_state` / canonical player clothing path), not NPC state;
- NPC-scoped rules apply only to matching present NPCs;
- do not apply every active clothing rule to every present NPC;
- Story clothing projection must expose only subjects actually in scope;
- unrelated contact/consent/affection/relationship/arousal remains independent from clothing-rule compliance.

### 4. Extract prompt/schema parity

Make the fresh Extract prompt exactly match the already reduced fresh physical observation contract.

Do not reintroduce finite `posture` taxonomy for stale tests. Keep only the proven narrow physical representation, including free `position_label` where currently retained and compact four-slot clothing evidence/state.

Remove stale prompt instructions/examples that ask the provider to emit fields no longer accepted by the fresh Extract schema.

### 5. Deterministic clothing-visible body canon

Implement the owner-required deterministic projection of existing character body canon into fresh Story context using **confirmed four-slot clothing state only**.

Requirements:
- ordinary/non-private character body canon can remain available as already intended;
- intimate/body facts are surfaced only when the exact confirmed clothing slots make the relevant area exposed;
- covered intimate facts remain hidden;
- no LLM/regex/semantic visibility classifier;
- no new body-state authority or duplicate durable writer;
- use existing character canon and exact clothing state as inputs only.

Add focused covered-vs-exposed tests.

### 6. Delete proven dead work residue; narrow retained helper

Delete proven dead Cut-1 residue instead of renaming or commenting it out, including:
- unused legacy Opening hook/goal helpers remaining in `src/engine/player-setup.js`;
- dead work helper / commented work-goal display residue in `src/frontend/pages/render.js`.

For `src/engine/csa/execution-policy.js`, which is now effectively clothing-only, do one of:
- inline/rename the surviving exact clothing-state normalization into a clearly narrow clothing mechanic; or
- retain only with concrete fresh caller proof and document why it is not a generic execution gateway.

Do not recreate a generic execution layer.

### 7. Rewrite/delete stale tests and add focused current-contract coverage

The previous exact-head CI failure (`Company v1 tests` run `32030017605`) was 304/312 pass with 8 failures. Do not restore removed `scene_id`, Opening work hooks/goals, or old Opening-choice fallback to satisfy them.

Delete or rewrite stale old-contract assertions to the current Cut 1 authority, and add focused behavioral coverage for:
- exact female/male/company/player clothing scopes;
- player-scoped clothing state;
- covered vs exposed body-canon projection;
- Extract prompt/schema parity;
- absence of universal workplace-fiction/work-agenda directives;
- absence of mandatory-enactment/permanent work-performance directives;
- deletion/narrowing of proven dead work/execution residue.

Reuse existing literal-input / exact-choice tests instead of duplicating equivalent coverage.

### 8. Full validation and exact-head GitHub CI SUCCESS

Before terminal:
1. run focused tests for all corrected behaviors;
2. run full `npm test` and require zero failures under the current contract;
3. run syntax checks for all modified JavaScript modules;
4. run `git diff --check`;
5. confirm no `.github/workflows/**` change;
6. confirm no PR #69 change;
7. confirm the existing additive Cut 1 migration was **not applied** and no second migration is created merely for this source/test correction unless a correction genuinely requires the already-authorized fresh contract file to be amended before application;
8. push normally to PR #70 branch;
9. wait for `Company v1 tests` on the **exact new final PR #70 head** and require `SUCCESS`;
10. report exact run ID/conclusion.

## Allowed change areas

Only files necessary for these same-Cut corrections may change, primarily:
- `src/engine/**`
- `src/api/**` only where the current fresh prompt/runtime contract requires the correction
- `src/frontend/pages/**` only for deleting the specified dead work residue or a directly required Cut-1 reader fix
- `content/characters.json`
- `test/**`
- `scripts/**` only if an existing validation must be aligned with the smaller current contract
- the existing Cut 1 additive migration file only if source/DB fresh-shape parity genuinely requires correction before it is ever applied
- `CURRENT_TRUTH.md` / the 2026-08-17 canon only if a verified current fact from this correction must be recorded
- `docs/ops/CURRENT_TASK.md`

Do **not** edit `.github/workflows/**`.

## Explicit prohibitions

Do not:
- start or create Cut 2 / `presentation-sidecars-cleanup-v1`;
- merge PR #70 or any PR;
- touch PR #69 or its branch/workflow scope;
- deploy API/frontend Workers;
- apply any migration;
- write/reset TEST DB or any Supabase row;
- access or mutate Production/game IDs;
- run live gameplay acceptance in this rework;
- add semantic action routers/verifiers/gates;
- add retries/regeneration-until-valid behavior;
- add provider/model fallback as correctness repair;
- add compatibility mirrors for removed state;
- add a generic CSA execution DSL/gateway;
- restore finite posture/contact/work/event/relation grammars merely for tests;
- create a new parser generation.

## Rework terminal requirements

Terminal report must include:
- Task ID `gameplay-core-simplification-v1`;
- rework READY registration SHA/blob;
- rework START SHA and FINAL SHA;
- exact changed/deleted files;
- resolution evidence for each correction 1 through 8;
- exact clothing-scope behavior including player scope;
- covered-vs-exposed body-canon behavior;
- final fresh Story/Opening and Extract prompt/schema shape relevant to these corrections;
- dead helper/gateway deletion or concrete retained-caller proof;
- stale-test disposition and focused replacement coverage;
- full-suite result;
- syntax / `git diff --check` result;
- exact final-head GitHub `Company v1 tests` run ID and SUCCESS conclusion;
- migration apply count `0`;
- merge count `0`;
- deploy count `0`;
- TEST/Production DB write count `0`;
- Production/game access count `0`;
- PR #69/workflow change count `0`;
- Cut 2 start count `0`.

## Stop condition

After all eight corrections and exact-head CI SUCCESS:
1. update this file to `Status: WAITING_REVIEW` on `company/gameplay-core-simplification-v1`;
2. post exactly one immutable terminal report to Issue #68;
3. do not merge, deploy, apply migration, access live games, or start Cut 2;
4. STOP for owner/operator review.

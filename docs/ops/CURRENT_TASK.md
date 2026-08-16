# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-navigation-phase-closure-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308271987` — CHANGES_REQUIRED for `minimal-story-runtime-semantic-cut-v1`.
Candidate final SHA under correction: `e2deee44202e732dd6c15907eb77c8cc35892669`.
Actual source commit in that ancestry: `211344faea7a064b8f3bced8f10e7b30997da431` (the prior terminal report transcribed this SHA incorrectly).

Binding semantic canon:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- `CURRENT_TRUTH.md`
- accepted audit review `5308024297` / audit SHA `7418750a84b0b2925330330469c5a519d0dd11a2`.

The broad semantic reductions in the candidate are the intended direction. This task is a narrow correction of two proven movement/scene regressions plus zero-caller residue cleanup. Do not reopen or reverse the accepted Minimal Story Runtime architecture.

Safety:
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`: READ ONLY; do not access unless the task explicitly needs a previously recorded fact, and never mutate/reset it.
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`: FORBIDDEN to access or mutate.
- disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`: no gameplay/reset/write in this source/test correction.
- Production: forbidden.
- Migration `20260816050000_company_v1_minimal_story_runtime_contract.sql` is still UNAPPLIED and must remain unapplied in this task.

## Objective

Close the two movement/scene chronology defects found in operator review without restoring the old semantic routing engine:

1. explicit player navigation to an exact registered NPC destination must work again (`민아 보러간다` class), using only registered identity + canonical repo/catalog location authority;
2. after authoritative movement A -> B, source-phase speaker/presence/entrance evidence from A must not repopulate final presence in B unless destination-phase evidence establishes accompaniment/entry/presence in B.

Also delete the private zero-caller `hydrateGameplayStateLegacy()` semantic hydration body if caller proof remains zero. Do not replace it with another compatibility bag.

## Required implementation

### A. Restore narrow registered-NPC destination navigation

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Inspect current `src/engine/scene-cast.js`, edition/content character/general-NPC location fields, map `default_npc_ids`, turn-route callers and navigation regressions.
3. Preserve the new canon's narrow structural navigation only. Do NOT restore `HIGH_IMPACT_INTENTS`, generic dialogue-policy classification, fuzzy Korean-name matching, possible-entrant scheduling, semantic success routing, or another intent ontology.
4. Resolve an NPC destination only when all of the following are structurally clear:
   - the player's own input contains one exact registered full NPC name/identity;
   - the phrasing clearly expresses the player visiting/going to/find/meet/see that NPC, rather than stating that the NPC is the mover;
   - exactly one canonical destination can be obtained from repository/content authority (`default_location_id` and/or map catalog `default_npc_ids` as already modeled), never from stale `npc_scene_state.location_id` or another mutable mirror;
   - the destination differs from current canonical location.
5. Return the narrow typed navigation intent with destination and target identity. Keep explicit registered-location navigation working.
6. Required positive regression: `민아 보러간다` (using the actual registered Mina identity/catalog) resolves to the canonical catalog destination and preserves `target_npc_id`.
7. Required negatives:
   - `서원희가 로비로 이동한다` must NOT move the player;
   - an NPC name mentioned without a visit/go/find intent must not navigate;
   - ambiguous/multiple NPC destinations must not guess;
   - stale NPC scene location must not override repo/catalog destination.

### B. Make authoritative movement presence phase/location-aware

8. Trace `normalizeFreshExtractObservationV2` -> `canonicalObservation()` -> `reduceCanonicalScene()` for ordered scene evidence on a turn that moves A -> B.
9. Preserve exact Story evidence and registered IDs, but on an authoritative location change:
   - clear source-location local presence as today;
   - whole-turn source speakers must not be carried into B;
   - source-phase `presence`/`entrance` evidence must not be re-added to B merely because the quote exists somewhere in the Story;
   - destination presence may be established only by destination-phase/local evidence that is attributable to B, explicit destination entry/presence, or another already accepted complete destination snapshot path;
   - accompaniment/following is allowed only when Story/Extract provides exact destination-phase evidence for that NPC;
   - remote speakers never become local presence.
10. Use the existing ordered parsed Story/evidence sequence and the existing scene evidence `location_id` field where possible. If authoritative movement requires scene evidence location to disambiguate source vs destination, make that a narrow structural Extract contract/prompt rule for movement turns. Do not create a second parser, fuzzy phase classifier, semantic gate, or NPC-specific exception.
11. Do not discard source-phase evidence from the historical turn record; only prevent it from becoming final destination membership.
12. Required scenario regression modeled on the owner canon/QA class:
   - A: heroine4 speaks/is present in meeting room;
   - player explicitly moves to B office;
   - B: heroine1 speaks/is established in office;
   - final canonical location is B;
   - heroine1 may be present;
   - heroine4 is NOT present in B solely because she spoke or had presence evidence in A.
13. Add accompaniment positive regression: if heroine4 is explicitly evidenced as accompanying/entering/present at B, she may remain/become present at B.
14. Add a regression specifically covering the review hole: source-location `scene_observation.evidence[{kind:'presence'|'entrance', character_id:..., location_id:A, quote:...}]` must not populate destination B after authoritative movement.

### C. Delete zero-caller semantic hydration residue

15. Re-run caller proof for private `hydrateGameplayStateLegacy()` in `src/engine/gameplay-state.js` and its old impossible `npc_stats`/relationship/CSA-attitude hydration branches.
16. If caller count remains zero, delete the function, impossible branches, stale comments/constants/tests in this same cut. Do not keep unreachable semantic code solely as historical documentation.
17. Preserve the genuinely used one-way old-save -> canonical `scene` ingress (`hydrateLegacySceneV1`) and the separately proven persisted legacy Extract read-only boundary. Do not conflate those with the dead gameplay semantic hydration body.

### D. Preserve the semantic reset

18. Do not reintroduce into fresh Story/Extract/Commit:
   - `npc_stats`, affinity/resistance/csa_acceptance;
   - generic `npc_relationship_state` narrative authority;
   - `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`;
   - fresh sexual-event ledger taxonomy;
   - image/media semantic authority;
   - generic relation/event/emotion/work/fact memory bags.
19. Preserve canonical scene/time/physical/clothing, direct-evidence `player_sexual_state`, CSA rule lifecycle/progression/capability, exact literal choices, latest-six raw + older `turn_summary`, committed parsed blocks, transaction/replay/idempotence, Mind/TTS/media as side/presentation systems.
20. Do not change provider/model/temperature/tokens, retries/regeneration, parser generation, or compatibility layers.
21. Keep `supabase/migrations/20260816050000_company_v1_minimal_story_runtime_contract.sql` unapplied. Modify it only if this source correction proves a direct structural contract mismatch; movement behavior itself should not require DB schema expansion. No second migration file.

## Validation

22. Run focused tests for:
   - exact registered location navigation;
   - exact registered NPC destination navigation;
   - non-player NPC movement negative cases;
   - A -> B source/destination speaker chronology;
   - source presence-evidence location isolation;
   - destination accompaniment positive case;
   - Minimal Story payload remains free of retired semantic roots;
   - fresh Extract remains narrow;
   - current save hydration does not resurrect retired roots.
23. Run full `npm.cmd test` as regression signal; report semantic coverage and deleted obsolete tests/code, not just count.
24. Run `node --check` for all changed JS/MJS, JSON checks if content changes, and `git diff --check`.
25. Source-scan for the removed `hydrateGameplayStateLegacy` and for accidental reintroduction of the retired semantic surfaces.
26. Verify the source/test correction is a descendant of `e2deee44202e732dd6c15907eb77c8cc35892669`, branch is pushed normally, and PR #67 remains Draft/unmerged.

## Forbidden operations

- no migration/DDL apply;
- no TEST/QA gameplay, setup, Opening, reset or DB write;
- no API/frontend deployment;
- no Production access/deploy;
- no preserved manual-game access;
- no mutation/reset of QA evidence game;
- no provider/model/retry/regeneration changes;
- no new semantic router/gate/fuzzy matcher/parser/compatibility bag;
- no new branch/PR, rebase, squash, force-push, Ready or merge.

## Execution validation

- Start HEAD: `02f6ff81a24406baeb39064d5933de98a32e560d`.
- Focused navigation/scene regressions: 11 passed, 0 failed, 0 skipped, 0 todo.
- Full `npm.cmd test`: 287 passed, 0 failed, 0 skipped, 0 todo.
- Changed JS/MJS syntax: 5 files checked and passed; JSON contract/content checks passed; `git diff --check` passed.
- `hydrateGameplayStateLegacy` and `HYDRATION_SOURCES` have no remaining source/test references. Retired-root names remain only in the intentional legacy-save stripping list.
- The exact registered-NPC visit path resolves `윤민아 보러간다` to `brand_strategy_office` / `heroine2`; stale scene mirrors do not control the destination, and unmarked/NPC-directed movement remains rejected.
- Authoritative movement from source location A to destination B excludes source-location presence evidence; destination-phase accompaniment evidence remains accepted.
- `supabase/migrations/20260816050000_company_v1_minimal_story_runtime_contract.sql` is unchanged and unapplied.
- Source correction is a descendant of `e2deee44202e732dd6c15907eb77c8cc35892669`; push and PR #67 draft/unmerged state remain pending final handoff.

## Acceptance

PASS only if both operator-proven movement defects are closed by deterministic structural behavior, the Minimal Story Runtime semantic reductions remain intact, and zero-caller legacy semantic hydration is removed when still unreferenced.

On PASS or first real blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, source/final SHA, exact navigation behavior, exact movement-phase evidence behavior, dead-code deletion result, focused/full tests, migration untouched/unapplied confirmation, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not apply migration, deploy, run live TEST, generate the next task, or start another cut.

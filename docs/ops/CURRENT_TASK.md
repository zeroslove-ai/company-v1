# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-semantic-cut-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308024297` ACCEPTED `minimal-story-runtime-authority-audit-v1`.
Accepted audit/final docs SHA: `7418750a84b0b2925330330469c5a519d0dd11a2`.

Binding semantic canon:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- `CURRENT_TRUTH.md`
- the four accepted audit documents under `docs/audit/company-v1-minimal-story-runtime-reset-2026-08-16/`.

The previous `relationship-history-mirror-boundary-closure-v1` is superseded and must not execute independently.

Evidence/safety games:
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`: READ ONLY / do not mutate or reset in this task.
- historical preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`: FORBIDDEN to access or mutate.
- disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`: no gameplay/reset/write in this source cut.
- Production: forbidden.

## Objective

Implement one coherent **Minimal Story Runtime semantic reset** from the accepted audit. Make the fresh gameplay spine materially smaller:

`player input / literal choice + minimal committed facts -> Story -> raw Story stream -> Extract narrow observation -> Commit narrow structural/mechanical persistence -> committed readback`

Do not split this into symptom patches or preserve a removed semantic layer merely because another current layer still reads it. If a duplicate consumer is the only reason a retired root appears necessary, remove/derive that consumer in this same cut.

This is a source/test/content + DB-contract-source implementation task. It is NOT a rollout task.

## Binding product semantics

1. Story remains narrative authority.
2. A CSA may become valid at activation time as a company notice/rule/regulation; no retroactive memory is required.
3. Once active and applicable, following the valid company rule is the altered ordinary/common-sense workplace premise. Dislike, embarrassment, resentment or other personal reaction may coexist with compliance but cannot make the applicable rule optional/not in force.
4. CSA compliance does not imply unrelated consent, comfort, affection, trust, romance or arousal.
5. Do not restore finite physical/sexual execution authority to enforce CSA.
6. Seo Won-hee informal speech to an intern/junior is not inherently a bug. Do not add an always-honorific gate/regression.
7. Recent raw Story + older natural-language `turn_summary` remains narrative memory; do not replace deleted semantics with a new relationship/event/fact/memory graph.
8. Player input is intent/attempt, but Story must not silently substitute a materially different explicit player action/self-state.

## Required implementation

### A. Collapse fresh Story input authority

1. Rework `src/engine/story-prompt.js`, `src/engine/gameplay-state.js`, `src/engine/csa/story-projection.js`, `src/engine/workplace-context.js`, `src/engine/player-setup.js` and exact callers so ordinary Story receives only facts it genuinely needs:
   - current raw `player_action` / feedback revision text;
   - canonical current time;
   - canonical current location and current present NPC IDs;
   - compact relevant character canon and stable player canon;
   - confirmed narrow player/NPC physical/clothing facts required for continuity;
   - active CSA human-readable content + human subject/counterparty scope when required + activation/effective fact + genuinely necessary trigger facts;
   - exact deterministic navigation destination when explicitly resolved;
   - latest six committed raw turns + chronological older committed `turn_summary` memory;
   - narrow player-private origin for the player's own structured rule transaction when applicable.
2. Remove from fresh Story payload/authority:
   - `npc_stats` including affinity/affection/resistance/csa_acceptance/NPC generic arousal;
   - `csa_attitudes`;
   - generic `npc_relationship_state`;
   - `csa_runtime_state` / `csa_aftereffect_state`;
   - full all-NPC/all-location directories as narrative context;
   - nearby candidate/possible entrant scheduler context;
   - semantic `player_dialogue_policy` / target authority;
   - CSA strength/authority tier as narrative pressure;
   - precomputed applicable/known actor lists and compliance booleans;
   - scene goal/focus/focal/last-speaker as future Story semantic planning state;
   - media/image selection semantics.
3. Keep full registered identity/location universes only outside Story where strict parser/ID/navigation validation needs them.
4. Rewrite the CSA Story premise once and positively. It must state active+applicable rule compliance as ordinary workplace reality while keeping emotion/unrelated consent separate. Do not introduce required action tokens, pose grammar, mandatory ACTING, direct-coverage or semantic execution contracts.
5. Opening remains narrow. Do not import retired ordinary-turn semantic roots into Opening. Preserve the already accepted shared provider exact-four literal-choice protocol.

### B. Delete pre-Story semantic adjudication

6. In `src/engine/scene-cast.js` and callers, remove fresh semantic meaning authority including:
   - `HIGH_IMPACT_INTENTS` / regex intent ontology;
   - semantic `classifyDialogueIntents`, `resolvePlayerDialoguePolicy`, `validatePlayerDialogueAgainstPolicy` fresh enforcement;
   - fuzzy unique Korean given-name target resolution;
   - generic entering-NPC / remote-NPC inference and possible-entrant scheduling;
   - any pending semantic cast queue with no separate proven structural use.
7. Preserve/refactor only exact structural responsibilities:
   - registered ID/full-name validation/resolution;
   - exact registered location/alias resolution;
   - narrow deterministic navigation destination when the player's explicit input resolves unambiguously;
   - current canonical presence.
8. Do not replace deleted semantics with another regex ontology, classifier, semantic route, LLM gate, fuzzy repair or compatibility wrapper.
9. Story may naturally narrate a requested contact/arrival/departure. Extract observes what actually happened; Commit persists the observed final state.

### C. Collapse fresh Extract to observation

10. Rework `src/engine/extract-prompt.js` and `src/engine/runtime-core/extract-observation.js` so the fresh V2 contract contains only product-proven observation fields:
   - end/ordered scene evidence sufficient for final location/presence;
   - narrow player/NPC physical/clothing observations;
   - direct-evidence retained `player_sexual_state` mechanical observations only where current product/UI still consumes them;
   - exact evidence/provenance;
   - elapsed minutes;
   - one natural-language `turn_summary`;
   - Mind Monitor only as presentation/readback output if retained in the same call;
   - structural warnings only where useful.
11. Remove from the fresh Extract contract/instructions/normalizers:
   - NPC generic stats;
   - CSA attitudes;
   - generic relationship/emotion/work/event ghost surfaces;
   - `csa_trigger_evaluations` / `csa_runtime_updates` provider semantic channels;
   - closed fresh `events.sexual` taxonomy/ledger output;
   - semantic `action_target_id`;
   - `image_character_id` / image tags/pool/selection.
12. Do not keep removed domains merely so fresh normalization can warning-drop them. They should cease to be fresh output vocabulary.
13. Preserve `persisted-extract-observation.js` and its private legacy `state_delta` adapter only as the already-proven historical read boundary. Fresh provider output must not enter that compatibility path.

### D. Collapse Commit to narrow persistence

14. Rework `src/engine/runtime-core/observation-reducers.js`, `commit-reducer.js`, `csa-commit-reducer.js` and exact callers so fresh Commit writes only retained narrow domains.
15. Delete fresh reducers/writers for:
   - generic NPC stats;
   - generic relationship state/mirrors as narrative authority;
   - CSA attitudes/runtime/aftereffect semantic updates;
   - closed sexual-event ledger taxonomy if no retained narrow mechanical caller requires it after the same-cut presentation rewrite.
16. Preserve the direct-evidence `player_sexual_state` mechanic only to the extent current product/UI genuinely consumes arousal/progress/count/erection. Do not infer relationship/consent from it.
17. Preserve canonical physical/clothing reducers and evidence requirements.
18. Preserve CSA definition/activation/deactivation + progression/capability/slot mechanics. These are institutional/product mechanics, not Story physical execution authority.
19. `migrateCompanySave()` / fresh runtime migration must strip retired active-save roots rather than carrying them into the next Commit. Historical committed `game_turns.pre_save/post_save` snapshots remain untouched.

### E. Fix scene chronology at the root

20. In `src/engine/runtime-core/scene-reducer.js` and the observation path, delete the rule equivalent to:
   `registered local speaker anywhere in the whole Story => present at final destination`.
21. Preserve exact authoritative navigation destination as the final location when structurally resolved.
22. Derive final presence from ordered destination-phase Story/Extract evidence:
   - a local speaker proves presence only at that point in Story;
   - source-location speakers before a movement boundary do not automatically survive into destination presence;
   - destination-phase local dialogue/presence/entrance evidence may establish final presence;
   - explicit exit evidence removes actors;
   - remote speakers never become local presence;
   - a complete valid final snapshot may be used when genuinely evidenced.
23. Use the existing ordered parsed Story blocks / Extract evidence. Do not create a second narrative parser or an NPC-specific exception.
24. Required regression based on QA Turn 6: heroine4 speaks in meeting room, player leaves for office, heroine1 speaks in office -> final location office; heroine1 may be present; heroine4 must not be carried into office solely because she spoke before departure.

### F. Remove source/content hydration resurrection

25. In `src/engine/gameplay-state.js` and content defaults, remove fresh hydration/default-fill for retired generic semantic state:
   - `npc_stats` generic affinity/affection/resistance/csa_acceptance/NPC arousal model;
   - `npc_relationship_state` generic mutable model;
   - `csa_attitudes`.
26. Remove corresponding legacy mutable bootstrap data such as heroine `initial_stats`, `initial_relationship`, `initial_csa_attitudes` from `content/characters.json` when their only purpose is the retired model.
27. Preserve authored immutable character canon: identity, role, personality, speech/address style, background/content facts and narrative `csa_style` guidance. `csa_style` may shape emotional reaction but may not veto an applicable active rule.
28. Preserve `npc_scene_state` only for proven narrow physical/clothing continuity, not semantic location/presence mirrors.

### G. Presentation/readback derivation

29. Rework `src/api/runtime-display.js`, `src/api/product-response.js`, frontend view-model/render helpers and related app payloads so retired generic semantic roots are not kept alive merely for UI.
30. Remove presentation dependence on generic NPC affinity/resistance/csa_acceptance/NPC arousal/relationship object and closed sexual-event ledger when those are removed as fresh state.
31. Derive presentation-only surfaces from existing committed authority instead of writing new gameplay semantics:
   - image character/pool/tags/selection from committed parsed Story + final scene + visible physical facts + media catalog;
   - focal/last-speaker highlighting from committed Story/current scene;
   - CSA labels from retained rule/capability/catalog mechanics;
   - TTS from committed dialogue blocks;
   - relationship/history labels only if product still needs them, derived from committed Story/turn summaries/history rather than a new mutable relationship memory bag;
   - Mind Monitor stays presentation/readback and must not feed Story/Commit authority.
32. `last_image_id`, if still needed as a client/presentation cache, must not remain a required gameplay save semantic root.

### H. Fresh save / DB structural contract source

33. Author **at most one additive migration source** for the new fresh-save contract. Historical applied migrations are immutable. Do NOT apply the migration in this task.
34. The migration source/function revisions must make current structural DB boundaries accept the minimal fresh save and stop requiring/preserving retired roots, including as necessary:
   - `validate_company_save_v1`;
   - `create_company_game`;
   - `reset_company_game`;
   - `reserve_company_player_setup`;
   - `commit_company_opening`;
   - helper functions that canonicalize initial/current save.
35. Remove fresh-save requirements/preservation for at least:
   - `npc_stats`;
   - `npc_relationship_state`;
   - `csa_attitudes`;
   - `csa_runtime_state`;
   - `csa_aftereffect_state`;
   - `last_image_id` as a gameplay root.
36. Preserve strict canonical scene validation, transaction ownership, save/version identity, CSA active/rule structural shape, physical/clothing/player-sexual retained mechanics, choices, clock/progression and atomic commit.
37. Do **not** include a bulk data scrub of current games, the QA game, preserved manual game, or Production in this source migration. It is acceptable for legacy `game_master.initial_save` JSON to contain retired keys temporarily if reset/setup/runtime strips them before current-save validation/writing. Exact live row cleanup, if ever needed, requires later rollout authorization.
38. Historical `game_turns.pre_save/post_save` and old Extract payloads must remain untouched/readable.

### I. Tests: reset around product authority, not old shape

39. Rewrite/delete stale tests that require removed fields, semantic routers, candidate casts, closed Extract taxonomies, old scene speaker-union behavior or generic display metrics.
40. Keep/reinforce structural tests for identity, exact navigation, parser wire markers, choice literal transport, atomic commit/replay/idempotence, save schema, current scene, physical evidence, clock and CSA lifecycle/progression.
41. Add scenario-level deterministic regressions modeled on the accepted QA evidence/canon, including:
   - active company rule from activation time is treated as in-force when applicable;
   - different character emotions may coexist with compliance;
   - an unrelated request outside CSA scope may still be refused;
   - no `csa_acceptance`/resistance/relationship map in Story payload;
   - movement A -> B with source speaker and destination speaker does not teleport source NPC;
   - remote speaker does not become local presence;
   - canonical time is preserved;
   - explicit player movement/action/self-state is not silently substituted by runtime semantic routing;
   - provider-authored four literal choices remain exact/order-preserved;
   - latest six raw + older summaries remain intact;
   - media/Mind/TTS presentation cannot block or redefine Story/Extract/Commit;
   - minimal fresh reset/save shape contains no retired semantic roots.
42. Do NOT add a `Won-hee always honorific` test.
43. An evaluation-only LLM judge is NOT part of this source cut. Do not add runtime or CI dependency on another model.

## Implementation discipline

44. Treat the accepted 152-item classification as the baseline, but re-check the current caller before deleting a field that might be a retained narrow mechanic or required historical reader. The task must not blindly delete:
   - historical `game_turns.pre_save/post_save`;
   - persisted legacy Extract read boundary;
   - direct-evidence `player_sexual_state` mechanic;
   - canonical scene/time/physical/clothing state;
   - CSA lifecycle/capability/progression;
   - committed `parsed_blocks`, exact literal choices, `turn_summary`, replay/idempotence.
45. If a claimed REMOVE item has an unavoidable proven current product need that cannot be derived/preserved within this architecture, record the exact blocker and STOP for operator review rather than inventing a replacement semantic subsystem.
46. Do not split this task into a chain of independently deployable semantic patches. Internal implementation commits are allowed, but the terminal review unit is the one complete semantic cut.

## Required validation

47. Run focused tests for Story prompt authority, scene chronology, Extract observation, Commit reducers, gameplay save hydration, CSA lifecycle/premise, runtime display/frontend and DB migration static contract.
48. Run full `npm.cmd test` as regression signal; report semantic coverage, not merely pass count.
49. Run syntax checks for all changed JS/MJS, JSON parse checks for changed content/config, migration/static SQL contract checks, and `git diff --check`.
50. Verify by source search that fresh runtime no longer exposes/writes the retired semantic surfaces and that no renamed equivalent/replacement bag was introduced.
51. Verify PR #67 remains OPEN / DRAFT / UNMERGED and branch HEAD is pushed normally.

## Explicitly forbidden in this task

- no TEST gameplay/setup/opening/reset or DB writes;
- no QA game mutation/reset;
- no migration/DDL application;
- no API/frontend deployment;
- no Production access/deploy;
- no access/mutation of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- no provider/model/temperature/token changes;
- no retry/regeneration;
- no new parser generation or parser relaxation;
- no semantic hard gate/verifier/evidence existence gateway as replacement runtime;
- no generic fact/relationship/event/memory ledger, entity graph, vector DB or importance scoring;
- no fuzzy identity/cast repair;
- no new branch/PR, merge, Ready, rebase, squash or force-push.

Read-only inspection of source/Git/PR and TEST DB catalog/function definitions is authorized if necessary. The QA game should not need another read during implementation because accepted audit docs already contain the evidence; if a read is absolutely necessary it must remain read-only and be explicitly reported.

## Acceptance

PASS only if the source/test/content/migration-source cut materially implements the new Minimal Story Runtime as one coherent authority model:

- Story payload is factual/minimal and no longer contaminated by generic stats/relationship/CSA attitude/runtime semantics;
- pre-Story engine no longer interprets general narrative meaning beyond exact structural identity/navigation;
- active applicable CSA is represented to Story as an in-force common-sense workplace premise while emotion/unrelated consent remain separate;
- fresh Extract is an observer with no generic stats/attitude/closed sexual-event/image/runtime semantic outputs;
- Commit writes only retained structural/narrow mechanics and no retired generic roots;
- movement chronology cannot teleport a source-location speaker into the final destination;
- fresh hydration/reset/save contract does not resurrect retired roots;
- UI/media/readback no longer requires retired roots as gameplay authority;
- historical committed snapshots and legacy Extract read compatibility remain intact;
- choices/history/replay/transaction/canonical scene/time/physical and retained player-sexual + CSA lifecycle mechanics are preserved;
- no replacement semantic system has been introduced.

On PASS or first real blocker:
- set this file to `WAITING_REVIEW` in the same implementation lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE/TEST/FINAL SHA(s), changed/deleted surfaces, exact migration source name if any, focused/full test evidence, source-search proof, any retained exception with caller reason, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not apply migration, deploy, run live TEST, generate the rollout task, or start another semantic cut yourself.

## Implementation validation — 2026-08-16

This task reached the required source-cut PASS boundary and is waiting for operator review.

- Start HEAD: `e6c4bb9d096b908093d4a59bc67922af38bc2fbe`.
- Full regression: `npm.cmd test` — 283 passed, 0 failed, 0 skipped, 0 todo.
- Changed JavaScript/ES modules: `node --check` passed for all 36 existing changed files; deleted files were excluded from the syntax invocation.
- Content JSON: `content/characters.json` parses successfully.
- Additive migration source: `supabase/migrations/20260816050000_company_v1_minimal_story_runtime_contract.sql`; static contract passed for the minimal validator, save/opening/reset/commit boundaries, retired-root stripping, helper revoke/no-grant, and the existing setup caller's helper boundary.
- `git diff --check` passed.
- No live TEST/QA/Production access, DB write/reset, migration apply, or deployment was performed.
- Retained compatibility surfaces are read-only historical boundaries: persisted legacy Extract normalization, old save-root stripping during migration, and the existing `character_details` input tolerated by frontend view-model tests; current API/UI projections no longer source retired NPC metric/relationship/ledger state.

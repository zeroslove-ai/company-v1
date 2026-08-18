# Company v1 — CURRENT TASK

Status: READY
Task ID: hospital-reference-spine-alignment-v1
Rework: true
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Operator review decision

Previous execution trigger: Issue #68 comment `5323477562`.
Previous terminal: Issue #68 comment `5323612084`.
Previous candidate source/test commit: `0a7e0214ae15cc17bdaa9fe56ef9c96075c16352`.
Previous source branch: `company/hospital-reference-spine-alignment-canon-v2`.

Review classification: `CHANGES_REQUIRED_HOSPITAL_REFERENCE_ALIGNMENT_INCOMPLETE`.

Newest binding design remains:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Do not start a new architecture or a new Cut. This is bounded rework of the same Hospital Reference Spine Alignment task identity.

## 1. Frozen clean lineage

Repository: `zeroslove-ai/company-v1`
Required base main: `20080497d782598600200afa45b5171087595ff9`
Expected branch: `company/hospital-reference-spine-alignment-v1-rework`

The prior execution branch is graph-diverged from main because the owner READY rearm commit was independently created on main and on the previous branch. This is content-safe but should not be carried into the final PR:

- previous branch start `b54b360685dc800f3569f629fe15f279bfaf2df8`
- current main `20080497d782598600200afa45b5171087595ff9`
- both commits have the same tree `8dcf7ad66d199d32e2e11d3ffc7f3e4ecd8bf354`
- the previous source commit `0a7e021...` is therefore a clean source/test patch over content identical to current main, despite commit-graph divergence.

Reapply/transplant the reviewed candidate source/test changes onto this new branch from exact main. Do not merge the old diverged branch wholesale and do not preserve its duplicate rearm commit in the final PR lineage.

Before editing:
1. fresh-fetch main and require exact `20080497d782598600200afa45b5171087595ff9`;
2. verify this branch is exactly one docs-only registration commit ahead of main;
3. re-read the Hospital Reference Spine Alignment canon, terminal `5323612084`, and this exact CURRENT_TASK;
4. inspect candidate `0a7e021...` directly and preserve only behavior that satisfies the canon;
5. if main or candidate changed materially, STOP `BLOCKED_HOSPITAL_ALIGNMENT_REWORK_DRIFT` rather than guessing.

## 2. What the previous candidate got right and should be preserved

The rework should keep these accepted directions unless a concrete regression is discovered:

1. One actor-scoped fresh evidence shape:
   `evidence.actors.<actor_id>={character_id,quote,changed[]}`.
2. Actor identity and exact contiguous Story quote remain the provenance boundary for retained optional machine projections.
3. Malformed optional actor evidence drops locally with warnings rather than becoming narrative authority.
4. Player sexual state continues through the existing sole reducer only when exact Story evidence supports the proposed delta/state.
5. Older blank summaries use a deterministic bounded committed-Story fallback instead of disappearing from long-term context.
6. Mind Monitor stays in the same Extract call, presentation-only, fail-open, no retry.
7. Exact single/multi-NPC same-destination structural navigation remains intact.
8. Existing exact structured clothing CSA bootstrap/synchronization remains intact.
9. Non-navigation provider focal candidates do not decide durable focus; current structural dialogue/navigation signals remain the authority.
10. Historical persisted Extract/legacy rows remain compatibility-only and must not become fresh semantic authority.

Do not revert these merely because the previous branch is being replayed cleanly.

## 3. Review finding A — Fresh Extract prompt is still not materially lightweight

The previous candidate changed `src/engine/extract-prompt.js` by only `+3/-3` while the binding canon requires a real fresh-contract reduction.

The current candidate prompt still explicitly teaches dead/superseded vocabulary by naming it in prohibitions, including examples such as:
- `relation_updates`
- `events.general`
- `npc_observations.relationship`
- `npc_observations.emotion`
- `npc_observations.work`
- generic stats/events/target/media/CSA attitude/runtime/aftereffect surfaces
- other old semantic taxonomy names whose only purpose is telling the provider not to emit historical fields.

This violates the canon rule: **delete fresh legacy vocabulary; do not merely tell the model not to use it.**

Required correction:
- rewrite the fresh Extract system instructions around the positive current contract only;
- keep concise generic structural guardrails such as “return only this schema / no arbitrary save patch”, but stop enumerating dead semantic field names and old taxonomies;
- the output example and explanatory prose must describe only fields that the fresh normalizer/reducers actually consume;
- do not add a replacement list of semantic prohibitions under new names;
- reduce prompt size/authority, not just rename evidence fields.

The intended fresh conceptual output remains only current product needs:
- extract_version/outcome
- structural scene observation
- retained player physical/sexual projection only where current consumer exists
- retained NPC physical/clothing projection only where current consumer exists
- one actor evidence vocabulary
- elapsed time
- turn_summary
- mind_monitor
- warnings

## 4. Review finding B — remove dead fresh focal authority surface

The candidate already makes Commit ignore non-navigation provider focal proposals, but fresh Extract still exposes and normalizes `focal_candidate_id`.

Current proof:
- candidate `canonicalObservation()` derives `focal_candidate_id` only from deterministic destination target and does not consume provider `scene_observation.focal_candidate_id`;
- canonical scene reduction can derive presentation focus from exact structural dialogue/navigation signals;
- frontend still consumes canonical `scene.focal_character_id`, not provider `focal_candidate_id` directly.

Therefore fresh provider `focal_candidate_id` has no current authority/consumer and should not remain a fresh field.

Required correction:
- remove `focal_candidate_id` from the fresh Extract output example/instructions;
- remove it from fresh-only scene field allowlist/normalization/return shape;
- keep historical persisted compatibility only where concrete old rows require it;
- do not add a new focus classifier/router;
- keep deterministic destination-target and exact dialogue-derived focal behavior already present in scene reduction.

## 5. Review finding C — remove dead fresh posture evidence vocabulary

Fresh physical normalization currently accepts `position_label` + compact clothing, but candidate actor-evidence path validation still accepts `*.posture` changed paths.

That is stale fresh vocabulary: a fresh provider cannot propose posture through the current `normalizePhysical()` contract, so posture evidence has no corresponding fresh write path.

Required correction:
- fresh actor evidence may authorize only fields that the fresh provider can actually propose and current consumers use;
- remove fresh `player_scene_state.posture` / `npc_scene_state.<id>.posture` evidence-path acceptance unless a concrete fresh proposal + current consumer path is proven before edit;
- historical posture state/readers/adapters may remain if genuinely needed for old committed data or current UI readback; do not rewrite history merely to remove a fresh field;
- `position_label` may remain because current frontend readback has a concrete consumer;
- compact four-slot clothing remains retained.

## 6. Retained player physical/sexual product ownership

Do not over-delete current product mechanics during rework.

Independent current UI inspection confirms `src/frontend/pages/view-model.js` still reads:
- player/NPC posture/position presentation from scene state;
- player excitement/arousal;
- ejaculation progress/count;
- erection state.

For this rework:
- retain `position_label` fresh observation because there is a current UI consumer;
- retain the player sexual mechanic because there is a current UI consumer and the candidate reconnects it to one exact actor-evidence path;
- do not create sexual event ledgers, consent matrices, action taxonomies, or semantic outcome classifiers;
- input intent alone never writes sexual/physical success.

If re-reading current source proves any of those UI consumers were removed after registration, STOP `BLOCKED_HOSPITAL_ALIGNMENT_REWORK_DRIFT` rather than silently changing product scope.

## 7. Fresh-vs-historical boundary

The rework must distinguish:

Fresh generation/runtime:
- positive minimal current schema only;
- one actor evidence vocabulary;
- no dead semantic vocabulary;
- no provider focal candidate;
- no unsupported fresh posture evidence;
- optional observation failure cannot discard a valid Story turn.

Historical persisted compatibility:
- may retain proven adapters/readers for old V1/V2 stored rows;
- must stay inert and isolated from fresh prompt/provider schema;
- do not mutate historical applied migrations or old evidence rows;
- do not add new compatibility mirrors simply to satisfy stale tests.

## 8. Required regression/contract proof

At minimum add/update tests proving:

1. fresh Extract prompt/schema contains the one actor evidence vocabulary and current positive fields only;
2. fresh prompt no longer enumerates dead relation/event/emotion/work/stats/CSA-runtime/media/target taxonomies as negative instructions;
3. fresh `scene_observation` no longer accepts/projects provider `focal_candidate_id`;
4. non-navigation dialogue focus is still derived deterministically by the existing canonical scene path, and destination navigation focus still works;
5. fresh actor evidence rejects unsupported posture changed paths while exact `position_label` and clothing paths remain valid;
6. one actor quote cannot authorize another NPC;
7. malformed/unsupported optional evidence remains local/drop-warning behavior and does not lose a valid Story turn;
8. retained player sexual updates require exact Story-backed `evidence.actors.player` paths and input intent without evidence does nothing;
9. ordinary clothing evidence remains actor-scoped, and exact structured clothing CSA synchronization remains unchanged;
10. empty old summary still yields bounded committed-Story fallback in chronological memory;
11. empty/partial Mind Monitor remains presentation-only/fail-open;
12. exact multi-NPC same-destination routing remains correct and ambiguous/non-movement cases remain unresolved;
13. refresh/replay current committed reality remains unchanged;
14. historical persisted Extract fixtures required by actual readers remain readable through the historical boundary;
15. no new generic semantic router/verifier/retry/ledger/DSL appears in the executable diff.

Prefer current scenario/contract tests. Delete/rewrite stale tests that exist only to preserve superseded fresh vocabulary.

## 9. Verification and PR boundary

After the coherent rework:
1. run focused Hospital-alignment / Extract / navigation / scene / physical / sexual / memory / replay tests;
2. run full `npm test` with zero failures;
3. run `node --check` on every changed JS/MJS file;
4. run `git diff --check`;
5. inspect the final executable diff against the binding canon;
6. open one PR against `main` from this clean rework branch;
7. require `Company v1 tests` SUCCESS on the exact PR head;
8. do NOT merge in this rework task;
9. set CURRENT_TASK to `WAITING_REVIEW`, post one terminal report, and STOP.

Terminal success classification:
`HOSPITAL_REFERENCE_SPINE_ALIGNMENT_REWORK_READY`

Blocked classifications:
- `BLOCKED_HOSPITAL_ALIGNMENT_REWORK_DRIFT`
- `BLOCKED_HOSPITAL_ALIGNMENT_REWORK_CONTRACT`

## 10. Hard prohibitions

- no TEST Worker deploy in this rework task
- no TEST gameplay/manual-game creation/reset/mutation
- no DB write, migration, DDL, migration-history repair, or broad db push
- no Production/hospital-v2 mutation
- no provider/model/TTS/binding change
- no Hospital source architecture copy/paste
- no giant Worker consolidation
- no semantic router/classifier/verifier
- no relationship/event/emotion/open-fact ledger reintroduction
- no finite generic physical/sexual action grammar
- no generic CSA execution DSL
- no third parser generation
- no retry/regenerate-until-lucky
- no separate Mind Monitor LLM stage
- no Cut3 or unrelated roadmap work
- no merge before the next operator review

## 11. What happens after this review boundary

If and only if the exact-head PR is independently accepted:
- next task will normal-merge the reviewed PR;
- verify merged-main CI;
- deploy exact merged main to TEST;
- run structural/API smoke only;
- create one fresh Level-7 disposable manual-test game/URL with ZERO automated gameplay turns;
- stop at `WAITING_USER_LIVE_ACCEPTANCE` for the user’s 30–50+ turn manual acceptance.

Do not perform those post-review operations in this task.

# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-authority-audit-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Owner canon added on this branch:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- root `CURRENT_TRUTH.md` now requires that canon to be read for semantic-runtime decisions.

The previously READY task `relationship-history-mirror-boundary-closure-v1` is **SUPERSEDED and must not be executed**. Its narrower cleanup may later be absorbed into the single semantic simplification cut if the audit proves it should be removed.

Current accepted transport/readback lineage remains useful evidence, but it is not product-play acceptance. Do not treat `N/N tests pass`, transport success, replay success, or an `ACCEPTED` evidence report as proof that narrative semantics are correct.

### Owner corrections that are binding

1. Seo Won-hee speaking informally to an intern/junior player is not inherently a bug. Do not create an `always honorific` rule or regression test.
2. Common-sense alteration may validly appear as a **company notice/rule/regulation that begins at its activation time**. It is not retroactive memory.
3. Once such a rule is active and applicable, **following the valid company rule is itself the altered natural/common-sense workplace premise**. An NPC may dislike, resent, enjoy or feel awkward about it, but personal reaction must not turn the active rule into an optional/not-yet-in-force policy.
4. CSA compliance remains separate from unrelated consent, comfort, affection, trust, romance and sexual arousal.
5. The target is a smaller Story-first runtime. Audit first; after review, perform one coherent semantic simplification cut rather than a chain of P0/P1 patches.

### Evidence games

- User QA regression evidence: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f` — READ ONLY for this audit. Do not reset or mutate it.
- Historical preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` — FORBIDDEN to access or mutate.
- Disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` — do not run gameplay or write/reset it in this audit.
- Production is forbidden.

## Objective

Perform one exhaustive **source + actual Story-payload + TEST DB residue + preserved QA evidence audit** that explains why the supposedly Story-first runtime still produces repeated old semantic failure classes.

The audit must identify every field/helper/state/mirror/gate that can influence fresh Opening or ordinary Story, every Extract/Commit path that can discard or rewrite meaning after Story, and every current DB/save residue that can leak obsolete semantic assumptions back into Story.

The output must be concrete enough that the next operator/session can author **one large `minimal-story-runtime-semantic-cut-v1` implementation task** without rediscovering the system or falling back to symptom patching.

This task is audit/design only. Do not change gameplay runtime behavior.

## Required work

### A. Freeze and authority preflight

1. Record exact START HEAD and verify PR #67 is OPEN / DRAFT / UNMERGED, base `main`.
2. Read, in order:
   - `AGENTS.md`;
   - `CURRENT_TRUTH.md`;
   - `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`;
   - `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`;
   - `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`.
3. Treat the 2026-08-16 owner canon as controlling where older semantic implementation assumptions conflict.

### B. Fresh Story prompt contamination inventory

4. Trace the exact fresh Opening prompt construction and exact ordinary Story prompt construction from request boundary to provider messages.
5. Produce the **actual field-level payload inventory**, not just file names. For every field/section sent to Story, record:
   - exact JSON/message path;
   - source file/function;
   - source of data: repository content / `game_master` / `game_save` / recent turns / derived helper / compatibility mirror;
   - whether the value is raw, normalized or inferred;
   - which character(s)/turn conditions expose it;
   - what narrative meaning the model can reasonably infer from it;
   - current tests protecting it.
6. Specifically prove current Story visibility or non-visibility for at least:
   - `npc_stats.affinity`;
   - `npc_stats.affection`;
   - `npc_stats.resistance`;
   - `npc_stats.csa_acceptance`;
   - `npc_stats.sexual_arousal`;
   - `csa_attitudes`;
   - `npc_relationship_state` and any derived relationship summary/boundary;
   - `csa_runtime_state`;
   - `csa_aftereffect_state`;
   - active CSA rule `content`, scope, strength/authority, preset metadata, trigger/mode/execution metadata;
   - compact clothing/physical state;
   - scene/presence/focal/last-speaker state;
   - player body/sexual state;
   - navigation intent/destination metadata;
   - recent raw Story and older summaries;
   - image/TTS/media metadata if any reaches Story.
7. Search for prompt wording that tells the model to use, ignore, negotiate, interpret, comply with or react to those fields. Identify contradictory instructions in the same prompt.

### C. Pre-Story semantic authority inventory

8. Inventory every fresh gameplay helper that executes before Story and can decide or narrow narrative meaning, including but not limited to:
   - action classifiers/routes;
   - actor/target resolution;
   - navigation resolvers;
   - Scene Cast / active-character selection;
   - CSA applicability/scope/trigger helpers;
   - any `bold`/risk/probability machinery still reachable;
   - relationship/consent/privacy/authority logic if reachable;
   - physical/sexual action taxonomies;
   - parser-driven preconditions;
   - compatibility adapters.
9. For each, classify whether it is:
   - structural identity/navigation only;
   - a real narrow product mechanic;
   - Story prompt projection only;
   - semantic authority that should likely be deleted.
10. Do not infer reachability from file name. Prove fresh callers.

### D. Extract / Commit semantic authority inventory

11. Trace every current Extract output field and every Commit/reducer consumer.
12. Record every place a valid Story-established fact can be:
   - rejected;
   - dropped;
   - normalized into a different meaning;
   - overwritten by an earlier save value;
   - mapped into a closed enum/taxonomy;
   - lost because actor/presence/scene evidence was precomputed before Story.
13. Separate structural validation from semantic adjudication. Structural examples to keep include ID membership, exact quote provenance, turn/revision ownership and atomicity. Semantic interpretation beyond those must be justified.

### E. Scene / movement / presence audit

14. Trace the exact path for the QA movement case where a source-location NPC spoke before the player moved and a destination NPC spoke after arrival.
15. Prove why `save.scene.present_npc_ids` could end with both source and destination NPCs.
16. Inventory every rule equivalent to `speaker => current presence`, `acted => presence`, `final snapshot`, `entered/exited`, authoritative navigation, and any legacy scene mirror.
17. The design recommendation must preserve one simple rule: destination presence comes from destination-phase evidence; a speaker from the source phase must not teleport merely because they spoke somewhere in the same Story.
18. Do not propose a new fuzzy NPC-search/cast gateway.

### F. CSA semantic audit

19. Audit current CSA from activation transaction through Story projection, Extract, Commit, progression and UI.
20. Reconstruct how older design changes transformed the concept across time, especially where `common-sense premise` became merely `institutional context` or `company regulation` without preserving natural compliance.
21. Prove whether `csa_acceptance`, `resistance`, `csa_attitudes`, strength/authority tier, execution metadata or other legacy values can bias Story toward treating an active rule as negotiable/optional.
22. Distinguish these three facts explicitly:
   - rule becomes valid at activation time;
   - applicable staff naturally treat following the valid rule as ordinary/common-sense workplace behavior;
   - feelings and unrelated consent remain character-specific.
23. Identify every current test whose PASS condition proves removal of old CSA execution authority but does **not** prove the positive common-sense premise.
24. Recommend the minimal Story-facing CSA projection. Default target is only the premise/content, scope/applicability, activation phase/time and genuinely necessary trigger facts—not acceptance scores or execution grammar.
25. Do not implement the future content/preset redesign in this audit. Only map dependencies that the later content redesign must know.

### G. DB / save / reset / migration residue audit

26. Inspect current TEST DB schema/catalog/functions read-only. Do not apply DDL/DML.
27. Inventory `game_master.data`, `game_master.initial_save`, current save roots/defaults/reset bootstrapping and validators relevant to semantic state.
28. Quantify which stale/legacy semantic fields still exist in supported TEST saves and whether fresh runtime reads them.
29. A DB field being present is not proof it should be deleted; a DB field being historical is also not proof it should reach Story. Classify storage and Story visibility separately.
30. Inspect stored procedure/RPC bodies only to distinguish structural DB responsibility from hidden semantic authority. Confirm whether DB itself is deciding narrative meaning or merely preserving values that Worker later projects.
31. No migration may be authored or applied in this audit. The report may propose a later additive migration only if the implementation cut truly needs a structural contract change.

### H. Preserved QA evidence audit

32. Read only game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f` and extract the exact relevant evidence for all committed turns, including player action, Story text/parsed blocks, Extract observation, Commit/post-save state, scene, CSA state, physical/clothing state, summary and Mind Monitor where available.
33. Re-evaluate the previous bug list under the corrected owner canon. Explicitly mark:
   - **NOT A BUG:** Won-hee informal speech to an intern/junior by itself;
   - **BUG/SEMANTIC FAILURE:** active applicable company rule treated as optional/not-yet-enforceable merely from personal resistance;
   - movement/presence contamination;
   - canonical time contradiction;
   - duplicate/misplaced THOUGHT handling if proven;
   - material explicit player intent/self-state loss if proven;
   - repetitive non-progressing reaction/choice loops if proven;
   - any additional defect discovered independently.
34. Do not modify/reset the QA game after evidence extraction.

### I. Test-quality audit

35. Inventory tests that protect transport/shape/implementation but miss product semantics.
36. Identify tests that currently certify an undesirable intermediate state, such as proving execution authority is absent while never proving the positive common-sense premise.
37. Produce a proposed **Golden Play Regression** suite covering at least:
   - activation-time company rule + natural compliance;
   - differentiated character emotion without premise denial;
   - unrelated request refusal remains possible;
   - movement A->B with source speaker and destination speaker without teleport;
   - canonical time fidelity;
   - player explicit intent/self-state fidelity;
   - exactly-four literal choices plus meaningful action diversity evaluated at product level;
   - long-horizon continuity after raw-turn window;
   - refresh/readback/replay parity.
38. Explicitly exclude `Won-hee always honorific` from the golden regressions.
39. Recommend whether a separate evaluation-only LLM judge should score semantic regressions. It must never become runtime authority.

### J. Required classification and target cut plan

40. Produce one exhaustive classification table. Every audited item must land in exactly one bucket:
   - `KEEP_STORY_INPUT`;
   - `KEEP_NARROW_MECHANIC_NOT_STORY`;
   - `KEEP_HISTORICAL_READ_ONLY`;
   - `DERIVE_AT_PRESENTATION`;
   - `REMOVE`.
41. Every KEEP must cite a concrete current caller/product need. Default for unexplained Story prompt fields is `REMOVE` from Story projection.
42. Estimate the semantic simplification cut by concrete files/symbols to remove/change, but **do not implement it in this audit**.
43. The proposed implementation must be one coherent `minimal-story-runtime-semantic-cut-v1`, not a sequence of symptom hotfixes. It should preferentially:
   - delete Story prompt contamination;
   - remove pre-Story semantic adjudication;
   - remove duplicate/mirror authority;
   - simplify scene/presence temporal handling;
   - restore the corrected CSA premise semantics;
   - keep structural transaction/replay/identity work intact;
   - delete stale tests and add scenario-level product regressions.
44. If the audit proves one area cannot safely be included in that single cut, identify the exact structural reason and the smallest prerequisite boundary. Do not split merely because the codebase is large.

## Required deliverables

Create/update docs only:

1. `docs/audit/company-v1-minimal-story-runtime-reset-2026-08-16/01_STORY_PROMPT_AUTHORITY_INVENTORY.md`
2. `docs/audit/company-v1-minimal-story-runtime-reset-2026-08-16/02_DB_SAVE_RESIDUE_AND_QA_EVIDENCE.md`
3. `docs/audit/company-v1-minimal-story-runtime-reset-2026-08-16/03_REMOVE_KEEP_CLASSIFICATION.md`
4. `docs/audit/company-v1-minimal-story-runtime-reset-2026-08-16/04_SINGLE_SEMANTIC_CUT_PLAN.md`

The four docs together must be sufficient for another fresh session to author the implementation CURRENT_TASK without relying on chat memory.

## Architecture constraints

- Story remains narrative authority.
- Active CSA is an activation-time company rule whose compliance is natural/common-sense for applicable staff; do not restore finite physical execution authority.
- Do not add `always honorific` character enforcement.
- Do not build a new generic memory/relationship/event graph.
- Do not add a semantic verifier/gate to runtime as the answer to LLM inconsistency.
- Do not add retry/regeneration/provider/model changes.
- Do not add fuzzy identity/cast repair.
- Do not preserve dead runtime solely for stale tests.
- Do not rewrite historical applied migrations or immutable evidence.
- Do not modify gameplay source/tests/config in this audit except `docs/ops/CURRENT_TASK.md` completion-state change; audit deliverables are docs only.

## Authorized operations

Authorized:
- read-only Git/PR/source/history inspection;
- read-only TEST DB schema/catalog/data inspection;
- read-only access to QA regression game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- creation/update of the four audit docs and this CURRENT_TASK completion state;
- static source searches and non-mutating local analysis scripts if useful.

Not authorized:
- gameplay runtime/source/test/config behavior changes;
- TEST gameplay/setup/opening/reset or other DB writes;
- any QA-game mutation/reset;
- any access/mutation of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- migration authoring/application or DDL/DML;
- API/frontend deployment;
- Production access/deployment;
- live provider/LLM gameplay calls;
- retry/regeneration/provider/model changes;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the four audit documents give a complete, evidence-backed explanation of the current semantic runtime and a concrete one-cut simplification plan, including actual Story payload fields, fresh caller reachability, DB/save residue, QA turn evidence, false-positive bug corrections, test gaps, and exact REMOVE/KEEP classifications.

The audit must answer, with evidence:

- Why did repeated live/CI acceptance miss basic product-semantic failures?
- Which old semantic values still enter Story and through what exact path?
- Which values may remain stored but must no longer enter Story?
- Which runtime helpers are genuinely structural vs unnecessary semantic authority?
- Why did movement merge source/destination presence?
- How should CSA remain activation-time company regulation while making compliance the natural common-sense premise?
- What exactly will the single implementation cut delete/change/keep?
- What scenario-level regressions will prove product behavior afterward?

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same docs-only lineage;
- post one immutable terminal report to Issue #68 with START SHA, FINAL DOCS SHA, major findings, QA/DB access confirmation, REMOVE/KEEP counts, proposed semantic-cut scope, forbidden-operation confirmation and PR state;
- STOP for operator review.

**Do not generate or start the implementation task yourself.** A fresh operator/session must review the audit and then author the single `minimal-story-runtime-semantic-cut-v1` CURRENT_TASK from these four docs.

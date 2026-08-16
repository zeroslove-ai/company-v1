# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-destination-target-handoff-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308823061` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-test-rollout-v6`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
V6 terminal docs SHA: `0da414578ef77420701a0b79ca273a19a82a2c66`.
Terminal comment: `5308794650`.

TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied exactly once. DO NOT EDIT, REAPPLY OR REPLACE IT in this task.

Disposable TEST game remains `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, but this source/test task is NOT authorized to run gameplay, reset, write DB state or deploy.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`, QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`, and Production are forbidden.

## Proven blocker

V6 used the canonical Setup -> `/api/opening` -> Story/Extract/Commit flow and reached a deterministic product defect:

- exact action: `윤민아 보러간다`;
- canonical source location: `brand_strategy_meeting_room`;
- resolver correctly produced destination `brand_strategy_office`, target `heroine2`, source `explicit_npc_destination`;
- canonical location moved to `brand_strategy_office`;
- committed destination `present_npc_ids=[]` instead of carrying the uniquely resolved registered destination target.

Independent source review confirms the handoff loss:

1. `resolvePlayerNavigationIntent()` already produces `target_npc_id` for exact registered-NPC destination navigation.
2. `projectStorySaveForNavigation()` consumes only `destination_location_id` and clears destination presence/focal state.
3. `reduceGameplayCommit()` forwards navigation for authoritative location but does not carry destination target identity into the canonical scene reducer.
4. `reduceCanonicalScene()` therefore has no destination-target input. Source-phase speakers/presence are correctly filtered on authoritative A->B movement, but the registered target is also lost.

This task fixes only that dropped handoff. Do not restore the old semantic router.

## Objective

Make exact registered-NPC destination navigation carry its already-resolved target identity through the existing navigation -> Story scene/cast -> Extract/Commit -> canonical scene path, while preserving Minimal Story Runtime authority boundaries.

Expected user-visible meaning:
- `윤민아 보러간다` may deterministically navigate to Mina's uniquely registered canonical destination and carry `heroine2` as the destination target/cast identity;
- no generated/fake duplicate Mina may appear;
- source-location NPCs must not teleport into the destination;
- ordinary location-only navigation must not invent an NPC;
- ambiguous/unregistered NPC movement must remain unresolved;
- this target handoff must not become relationship, consent, affection, trust, CSA, sexual or general semantic-memory authority.

## Required implementation

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Re-inventory current callers of:
   - `resolvePlayerNavigationIntent()`;
   - `projectStorySaveForNavigation()`;
   - `navigationIntent.target_npc_id`;
   - `reduceGameplayCommit()`;
   - `reduceCanonicalScene()`;
   - Story active-character/cast projection and Extract scene observation.
3. Prove the exact current loss point before editing. Do not add a second navigation resolver or a new semantic target bag.
4. For `navigationIntent.source === 'explicit_npc_destination'` only, validate that:
   - `target_npc_id` is a registered NPC;
   - destination is uniquely derived from existing repository character/general-NPC + map location authority;
   - target and destination still match the canonical catalog relationship used by the resolver.
5. Carry that target through existing structures only. Prefer existing `scene.present_npc_ids` / `focal_character_id` or an existing reducer argument over inventing a new persisted schema.
6. Story projection for the destination must receive the exact registered destination target so the Story is not asked to narrate an empty destination after resolving `윤민아 보러간다`.
7. Commit/canonical scene handling must preserve phase correctness:
   - source-location speakers/presence remain excluded after authoritative A->B movement;
   - destination target may be present only because it is the uniquely registered exact NPC destination and/or because destination-phase Story evidence establishes it;
   - destination-phase exact presence/entrance/speaker evidence continues to work;
   - remote dialogue never creates local presence;
   - unknown IDs still fail closed structurally.
8. Do not generalize this into "named NPC in player input => present". Only the existing exact `explicit_npc_destination` result may use this narrow handoff.
9. Do not make arbitrary player action/intent equal physical or relationship success. This task is limited to deterministic navigation/world-cast identity from repository content authority.
10. Add focused behavioral regressions covering at minimum:
   - `윤민아 보러간다` from another location resolves destination `brand_strategy_office` and target `heroine2`;
   - destination Story projection carries only the registered target, not source presence;
   - canonical committed destination contains `heroine2` on the exact registered destination path under the chosen narrow authority rule;
   - source speaker/presence cannot teleport to destination;
   - destination evidence can add valid accompanying NPCs;
   - explicit location-only navigation does not invent Mina or another default NPC;
   - same-location NPC visit does not create a fake movement;
   - ambiguous/unregistered NPC visit does not resolve;
   - general registered NPC with a unique canonical destination behaves by the same identity rule without hardcoding Mina/heroine2;
   - no duplicate/fake identity can be produced.
11. Preserve the accepted Minimal Story Runtime reductions and already-applied DB contract. Do not resurrect retired semantic roots, generic NPC relationship/emotion/work state, csa attitude/acceptance semantic memory, event ledgers, old hydration, old semantic router or finite physical execution authority.
12. Run focused navigation/scene/Story-context/Commit regressions, full `npm.cmd test`, changed JS/MJS syntax checks and `git diff --check`.
13. Report actual caller map, exact source/test SHA, changed files, focused/full test result, and explicit proof that no new compatibility/semantic layer was introduced.

## Architecture constraints

- Story LLM remains narrative author.
- Extract remains one narrow Story-grounded observer plus natural-language `turn_summary`.
- Commit remains structural transaction authority.
- Registered character/location identity and exact deterministic navigation are permitted narrow mechanics.
- Do not add generic target memory, relationship memory, entity graph, semantic gateway, fuzzy name matching, fallback NPC generation, retry/regeneration, provider/model changes, new parser generation or compatibility runtime.
- CSA remains institutional lifecycle/context/capability only.
- Historical migrations are immutable.
- The already-applied Minimal Story Runtime migration is unchanged in this task.

## Authorized operations

Authorized:
- read-only Git/PR/source inspection;
- source/test/docs edits on the canonical branch limited to this handoff;
- local focused/full tests and static checks.

Not authorized:
- TEST gameplay/setup/opening/reset/write;
- DB write or migration/DDL authoring/application/edit;
- API/frontend deploy;
- Production access/deploy;
- preserved manual or QA evidence game access;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate or compatibility layer;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Acceptance

PASS only if the resolved exact registered destination target no longer disappears between navigation resolution and canonical destination scene, while source-phase presence remains filtered and no broader semantic authority is introduced.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact handoff changes, regression results, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.

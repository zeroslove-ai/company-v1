# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-final-residue-test-rollout-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309724395` — ACCEPTED `minimal-story-runtime-final-residue-closure-v1`.
Reviewed source/test SHA: `907eee3bcace9918e4965221eec2f44719213682`.
Reviewed docs/final SHA: `ed3437c2563863a768793f4f8b1989b892ccf09c`.
Reviewed additive migration source: `supabase/migrations/20260817000100_company_v1_final_residue_closure.sql`.

Independent operator preflight after review:
- TEST migration ledger already contains `20260816050000 company_v1_minimal_story_runtime_contract`.
- `20260817000100 company_v1_final_residue_closure` is NOT yet applied.
- live `public.company_minimalize_save_v1(p_data jsonb)` is still the prior SQL implementation. It strips the Minimal Story Runtime retired semantic roots but does not yet strip `last_choices`, `last_choice_meta`, final legacy scene mirrors, or duplicate scene location labels.
- PR #67 was independently verified OPEN / DRAFT / UNMERGED / mergeable at `ed3437c2563863a768793f4f8b1989b892ccf09c`.

The accepted source closure removes the zero-caller `npcPayloadEntryLegacy()` fallback stack, removes fresh `last_choices`/`last_choice_meta` authority, narrows identity to server directory + registered catalog identity, removes duplicate scene/location mirrors from fresh physical state, and removes `compatibility_mode`. `world_state` remains canonical game-time state. Narrow posture/position/clothing and direct-evidence sexual mechanics remain product side mechanics; they must not be broadened or inferred.

Disposable TEST game authorized for this rollout only:
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.

Forbidden game IDs — do not read, mutate, reset, or use for evidence:
- preserved manual: `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- production/sentinel: `11111111-1111-4111-8111-111111111111`.

Production is forbidden.

## Objective

Roll out the accepted final Minimal Story Runtime residue closure to TEST only and prove the live fresh path no longer recreates removed save/presentation mirrors while preserving the canonical Story → Extract → Commit spine, literal choices, canonical scene, readback/replay, and reset.

This is a bounded rollout/smoke task, not another architecture cut and not another 12-turn product-play. Do not patch source inside this task.

## Required execution

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Verify executable equivalence before any deployment:
   - `907eee3bcace9918e4965221eec2f44719213682` is the reviewed source/test SHA;
   - all commits after it up to START HEAD must be docs/ops-only for executable surfaces used by this rollout;
   - if any runtime/frontend/config/content/migration behavior changed after `907eee3...`, STOP before migration/deploy and report BLOCKED.
3. Reconfirm TEST DB preflight read-only:
   - `20260816050000 company_v1_minimal_story_runtime_contract` is applied;
   - `20260817000100 company_v1_final_residue_closure` is absent;
   - current live `company_minimalize_save_v1` is the prior implementation;
   - do not query forbidden game rows.
4. Apply exactly one additive migration to TEST:
   - `supabase/migrations/20260817000100_company_v1_final_residue_closure.sql`;
   - use the established migration mechanism and record the actual migration ledger version/name;
   - do not apply, reapply, repair, rollback, or author any other migration.
5. Immediately verify live DB contract after migration:
   - migration ledger contains the new closure exactly once;
   - `company_minimalize_save_v1(p_data jsonb)` strips `last_choices`, `last_choice_meta`; once canonical `scene` exists it strips `scene_state`, `last_npcs_present`, top-level `focal_character_id`, top-level `last_speaker_id`; it strips `player_scene_state.location_id/location_label` and NPC `present/scene_id/location_id/location_label` while preserving other narrow physical/clothing fields;
   - `validate_company_save_v1` no longer requires choice mirrors and still requires canonical structural keys/scene;
   - `company_minimalize_save_v1` remains non-callable by public/anon/authenticated/service_role; `validate_company_save_v1` remains service_role-only as intended.
6. Verify current TEST API and Frontend deployed source identities. Because `907eee3...` changed both server and frontend, deploy the exact reviewed executable-equivalent lineage to TEST API Worker and TEST Frontend Worker if either is not already at that source. Do not deploy Production.
   - API Worker: `game-proxy-company-v1`.
   - Frontend Worker: `gamebuilder-company-v1`.
   - record resulting Worker version IDs/source equivalence and health/readability.
7. Run one canonical reset of only the disposable TEST game. Read back the save and prove:
   - committed_turn=0, history/action count=0, Level 1, setup/opening not_started;
   - canonical `scene.version=1`, scene_id=`setup`, empty presence;
   - fresh save roots do NOT contain `scene_state`, `last_npcs_present`, top-level `focal_character_id`, top-level `last_speaker_id`, `last_choices`, `last_choice_meta`;
   - `player_scene_state` has no `location_id`/`location_label` mirror;
   - each present `npc_scene_state` entry has no `present`/`scene_id`/`location_id`/`location_label` mirror;
   - narrow surviving physical/clothing fields, if present, are not erased merely for this assertion.
8. Run Setup + Opening once using the normal TEST API route. Verify after Opening:
   - Opening succeeds and returns exactly four provider-authored literal choices;
   - `opening_state` persists story/choices/parsed_blocks as the committed Opening authority;
   - removed save roots/mirrors above remain absent after setup/opening;
   - context/display scene and registered identity resolve from canonical server projection/catalog, not stale aliases.
9. Select exactly one actual Opening provider choice literal and transport that exact text as ordinary Turn 1 `player_action`. Run Story → Extract → Commit once. Do not use numbered shorthand for this proof and do not synthesize a choice.
10. Verify Turn 1 committed/readback authority:
   - turn commits successfully;
   - committed `parsed_blocks.choices` is the ordinary choice readback authority;
   - no fresh `save.last_choices` or `save.last_choice_meta` appears;
   - canonical scene/readback remains valid;
   - `world_state.game_time` remains present and coherent;
   - frontend/context display payload has no `compatibility_mode` and uses server directory/catalog identity plus canonical map location presentation;
   - no removed scene/location mirror is recreated by Story/Extract/Commit.
11. Perform same-action replay for the committed Turn 1 through Story/Extract/Commit recovery and verify replay/idempotence with no extra committed turn and no resurrected removed roots.
12. Verify `/api/context` and `/api/history` readback after Turn 1 succeeds and the current committed Story/parsed blocks/literal choices remain usable. Do not invent a compatibility fallback if a field is absent.
13. Finish with exactly one canonical reset of the disposable TEST game and re-run the same reset residue assertions from step 7. Final state must be committed_turn=0, history/action=0, Level 1, setup/opening not_started, canonical scene=setup.
14. Evidence may be stored under OS TEMP only. Do not add new repository evidence artifacts.

## Stop-on-defect policy

- One rollout sequence only. No provider retry/regeneration to obtain a prettier Story/Extract.
- If migration application, DB contract, API/frontend deployment, reset/setup/opening, literal Turn 1, replay, or final reset exposes a deterministic defect, capture the smallest exact evidence, perform final disposable-game cleanup reset if safe, then STOP as BLOCKED/FAILED for operator review.
- Do not patch source, author a second migration, add a compatibility field, restore `last_choices`, restore legacy scene mirrors, change provider/model/config, or create a new parser/gate/retry inside this rollout task.

## Architecture constraints

- Story remains narrative authority.
- Extract remains one observer LLM with narrow grounded projections + natural-language `turn_summary`.
- Commit remains structural/transaction authority.
- `save.scene` is the only active durable scene/location/presence/focal/last-speaker authority.
- Opening choices live in committed Opening projection; ordinary choices live in committed parsed blocks. No fresh save choice cache.
- `world_state` remains the canonical game-time state.
- `player_scene_state` / `npc_scene_state` retain only narrow physical/clothing continuity fields with proven consumers, not location/presence identity mirrors.
- Registered repository/catalog identity remains valid finite product identity; stale save identity bags must not regain precedence.
- CSA remains institutional lifecycle/context/progression, separate from consent/emotion/relationship semantics.
- No generic relationship/event/emotion/work/open-fact memory ledger, compatibility bag, semantic gateway, third Summary/Memory LLM, new parser generation, fuzzy repair, retry/regeneration, or provider/model change.
- Preserve the existing one persisted legacy Extract read-only boundary; this rollout does not attempt to delete it.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- TEST schema/function/migration-ledger reads;
- exactly one application of `20260817000100_company_v1_final_residue_closure.sql` to TEST;
- TEST API and TEST Frontend deployment of the exact reviewed executable-equivalent source only;
- disposable TEST game reset/setup/opening/one ordinary turn/context/history/replay/final reset;
- read-only TEST DB verification for that disposable game;
- OS TEMP evidence;
- docs-only completion record and one immutable Issue #68 terminal report.

Not authorized:
- any other migration or DDL;
- source/runtime/test/content/config behavior edits;
- Production access/deployment;
- any access to preserved manual, QA evidence, production/sentinel, or any other game IDs;
- provider/model/temperature/token changes or retry/regeneration;
- parser relaxation/new parser, fuzzy repair, semantic gate, compatibility replacement;
- additional product-play loops or forcing physical/clothing/sexual positive outcomes;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the exact reviewed migration/source is live on TEST and the bounded reset → setup/opening → exact literal Turn 1 → readback/replay → final reset proves:
- removed fresh choice/scene/location mirrors remain absent at every fresh durable boundary;
- canonical scene, game time, registered identity, Opening/ordinary choices, context/history and replay still work;
- frontend/server presentation no longer needs `compatibility_mode` or stale identity/location fallbacks;
- no replacement semantic/compatibility authority was introduced.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post exactly one immutable terminal report to Issue #68 with START SHA, migration ledger identity, live function/ACL verification, API/Frontend Worker versions/source equivalence, reset/setup/opening/Turn1/replay/readback/final-reset evidence, forbidden-operation confirmation and final docs SHA;
- STOP. Do not generate the next CURRENT_TASK yourself.

# Company v1 — CURRENT TASK

Status: READY
Task ID: scene-legacy-mirror-test-rollout-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5305266344` ACCEPTED source/test/migration SHA:
`cd615b4926a5a7092247459d44d25f886b8ac92b`.

Terminal docs SHA before this registration:
`7dae17475d40bde00598340d22806ea0e1c83506`.

Reviewed additive migration, not yet applied at review time:
`supabase/migrations/20260816030000_company_v1_scene_mirror_residue_closure.sql`.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden: do not read, mutate, reset, or include it in any migration/data operation.
Production access is forbidden.

## Accepted architecture

`save.scene` is the only active durable authority for scene id, location, presence, focal NPC, last speaker, beat, goal, and focus thread.

The reviewed source removes active persistence/readback of these duplicate mirrors:
- `scene_state` scene/location/participants/beat/goal/focus fields;
- top-level `last_npcs_present`, `focal_character_id`, `last_speaker_id`;
- `player_scene_state.location_id`;
- `npc_scene_state[*].present`, `.location_id`, `.scene_id`.

`hydrateLegacySceneV1()` remains only as one bounded old-save/master-shape -> canonical `scene` ingress. Canonical state must never be projected back into the removed mirrors.

`npc_scene_state` and `player_scene_state` remain for proven physical/clothing/posture/position continuity. Do not delete those real consumer fields.

Existing SQL semantic heroine/world allowlists are separate pre-existing setup/opening authority debt. Do not expand, redesign, or compatibility-patch them in this rollout.

## Objective

Roll out the exact reviewed Scene mirror closure to TEST and prove the live canonical contract end-to-end without reintroducing compatibility state.

## Required work

1. Freeze exact start HEAD and verify it is the accepted source/test/migration lineage plus docs-only descendants only. Verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Re-read the exact reviewed migration and confirm no executable source has changed since `cd615b4926a5a7092247459d44d25f886b8ac92b`. If executable HEAD moved, STOP for operator review.
3. Read-only inspect TEST before mutation: migration ledger and live definitions/ACL/security/search_path for `validate_company_save_v1(jsonb)`, `reset_company_game(uuid,text)`, `company_apply_opening_scene_v1(jsonb)`, `company_bootstrap_scene_v1(jsonb)`, and any setup/opening writer directly affected by the reviewed migration.
4. Apply exactly the reviewed additive migration `20260816030000_company_v1_scene_mirror_residue_closure.sql` to TEST once. Historical migrations are immutable. Do not add or edit another migration in this rollout.
5. Immediately read back the TEST migration ledger and affected live function bodies/ACL/security/search_path. Verify canonical `scene` remains strict and the dead scene mirrors are no longer required/recreated by reset/opening contract.
6. Deploy the exact reviewed executable lineage to TEST API/frontend only if required by the source changes. Verify deployed Worker identities correspond to the reviewed executable; do not deploy a later unreviewed executable. Do not redeploy unrelated services.
7. Use only the dedicated TEST game. Run canonical reset once before the smoke. Verify turn/actions/history are clean, `save.scene` exists and validates, the five previously deleted semantic residue keys remain absent, and removed Scene mirror keys are absent from reset output.
8. Run Setup -> Opening using the existing canonical paths. Verify Opening succeeds and committed/readback state contains canonical `scene` but does not recreate removed mirrors.
9. Run a bounded ordinary gameplay smoke sufficient to exercise both input forms without retry-for-luck:
   - submit one provider-authored literal choice exactly as returned by the committed UI/context path if available;
   - submit one ordinary free-text action;
   - require Story -> Extract -> Commit success for each attempted ordinary turn;
   - verify committed `parsed_blocks`, `turn_summary`, literal-choice identity where exercised, replay/recovery idempotence, and canonical scene/presence/location continuity.
   If the provider does not return a usable literal choice in this single bounded run, record that as evidence; do not synthesize a server fallback or regenerate solely to obtain one.
10. After each reset/opening/Commit readback, assert removed mirrors remain absent:
   - root `scene_state`;
   - root `last_npcs_present`, `focal_character_id`, `last_speaker_id`;
   - `player_scene_state.location_id`;
   - every `npc_scene_state[*].present/location_id/scene_id`.
11. Simultaneously prove retained physical/presentation state was not structurally lost: player/NPC physical maps, NPC clothing/posture/position fields when present, `npc_stats`, `npc_relationship_state`, sexual/media-compatible state, CSA, progression/TEST-Level7 seam, stable identity, choices, Mind Monitor/TTS contracts remain structurally available. Do not require a sexual/media scenario merely for this Scene rollout.
12. Verify frontend/API display/map/navigation derive membership/location from canonical `scene`; no live path requires the removed durable mirrors.
13. Finish by canonical-resetting only the dedicated TEST game and verify clean turn 0 plus mirror absence. Do not touch any other game.
14. On the first deterministic source/DB/deploy/runtime defect, preserve exact evidence and STOP. No retry/regeneration, provider/model change, parser relaxation, fuzzy repair, compatibility bag/alias, second scene writer, or direct DB manufacture of gameplay state.

## Test policy

- This rollout is Scene-authority acceptance, not a new deep Level-7 scenario. Use the existing TEST-only Level-7 seam only if already required by the chosen dedicated TEST setup; do not modify progression or add a second seam.
- No fixed turn count beyond the bounded choice/free-text smoke is required. Do not waste turns solely for depth already proven by V9.
- Media/image catalogs, sexual image families, general/sex pools, and deterministic image selection are protected presentation adapters. Do not alter them; image classification must not gate narrative facts.

## Authorized operations

Authorized in TEST only:
- apply exactly the reviewed Scene mirror closure migration once;
- deploy exact reviewed API/frontend executable lineage as required;
- reset/setup/opening/bounded ordinary gameplay/replay/recovery on dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- read-only TEST catalog/data/deployment verification needed for acceptance.

Not authorized:
- Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- bulk migration of Company game rows or direct DB gameplay-state manufacture;
- new migration/source/runtime semantic changes during rollout;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- provider/model/config changes, retries/regeneration, semantic hard gates, parser relaxation/new parser, fuzzy repair, compatibility bags/aliases.

## Acceptance

PASS only if exact reviewed migration/source lineage is live in TEST and:
- canonical `save.scene` alone owns scene/location/presence/focal/last-speaker durable state;
- removed mirrors stay absent across reset -> Setup -> Opening -> ordinary Commit -> recovery/replay -> final reset;
- bounded gameplay succeeds or any unrelated deterministic blocker is accurately evidenced without workaround;
- physical/clothing/posture/position and other protected real-consumer systems remain intact;
- no Production/manual-game access or unrelated mutation occurs.

A deterministic unrelated blocker may be reported as BLOCKED evidence; do not patch it inside this rollout.

## Completion

On PASS or deterministic BLOCKED evidence:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit;
- report exact start SHA, reviewed executable SHA, applied migration ledger version/name, live function/ACL/search_path facts, deployed Worker identities if deployment occurred, dedicated TEST reset/setup/opening/turn/replay results, mirror-absence checks, protected-state checks, final reset result, and final docs SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate the next task yourself.

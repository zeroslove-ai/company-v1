# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: cut2-scene-stage-b-apply-and-closure
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 2 Scene / Location / Presence live acceptance has now passed on the exact reviewed runtime executable:

`a919baf87d92e841e64b731576ccb176d5745570`

The accepted live run proved on the dedicated TEST game that:

- Setup and fresh Opening completed successfully under the reviewed runtime
- a normal Story -> Extract -> Commit turn completed
- explicit player navigation moved canonical/player projection from `brand_strategy_office` to `brand_strategy_meeting_room`
- NPC-directed input `서원희가 1층 로비로 이동한다.` did **not** move the Player; canonical and player projection remained `brand_strategy_meeting_room`
- context/history readback succeeded
- the dedicated TEST game was finally reset clean

Independent operator readback after the run confirmed:

- game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- committed_turn = 0
- save_revision = 876
- player_setup/opening = not_started
- Scene v1 = setup / location null / empty presence
- actions = 0
- turns = 0

PR #67 remains OPEN / DRAFT / UNMERGED. The current branch HEAD after the acceptance completion state is docs-only relative to the reviewed runtime.

Scene Stage A and its ACL closure are already applied in TEST. Scene Stage B is still absent. Direct live inspection confirms the current `validate_company_save_v1(jsonb)` still structurally requires legacy `scene_state`, `last_npcs_present`, `focal_character_id`, and `last_speaker_id`, and calls `company_validate_scene_v1(p_save, false)`. This is the compatibility window that Stage B is designed to close.

The repository already contains the reviewed, unapplied additive migration:

`supabase/migrations/20260814000600_company_v1_scene_authority_stage_b.sql`

Its intended change is narrow: make canonical `save.scene` structurally required, make the legacy scene mirror fields optional when present, call `company_validate_scene_v1(p_save, true)`, and retain validator EXECUTE only for `service_role`.

## Binding authority

Read and obey:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 operator review for `cut2-final-navigation-live-acceptance-after-opening-contract`

Current Git/source/live TEST DB/deployed identity outrank report prose. Historical applied migrations are immutable. One durable domain has one canonical writer. Do not add compatibility code or preserve a legacy requirement merely for old tests.

Manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` must not be reset or mutated.

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Reviewed runtime executable remains:

`a919baf87d92e841e64b731576ccb176d5745570`

Current deployed TEST API evidence from the accepted run:

- Worker: `game-proxy-company-v1`
- Version reported by the accepted execution: `9a466eaf-7a9a-4850-9e02-89f6be1b09cf`
- deployed source: exact reviewed `a919baf...`

Before any DB mutation:

1. verify current branch/remote HEAD and ancestry
2. verify every commit after `a919baf...` is test/docs/workflow-only and no runtime/config/migration source changed
3. verify the Stage B migration file is byte-identical to the already-reviewed repository source and has not been historically applied
4. verify Scene Stage A and ACL closure are present in the live migration ledger
5. verify the current live validator is still the Stage A compatibility form
6. verify the dedicated TEST game is still clean
7. verify no operator review already handled this exact task identity

If any guard fails, STOP BLOCKED. Do not rewrite an applied migration or improvise a substitute migration.

## Goal

Apply the existing additive Scene Authority Stage B migration to TEST, prove that the DB validator now treats canonical `save.scene` as the structural authority while legacy scene mirrors are optional compatibility fields, and complete a scoped post-Stage-B live acceptance without changing runtime source.

## Authorized migration

Exactly one TEST migration apply is authorized, using the existing source file:

`supabase/migrations/20260814000600_company_v1_scene_authority_stage_b.sql`

Apply it through the normal Supabase migration mechanism under a migration name that clearly records:

`company_v1_scene_authority_stage_b`

Do not edit the historical Stage A migrations. Do not edit the Stage B SQL merely to make application easier. If the existing migration does not apply cleanly against current TEST truth, report BLOCKED/FAILED with evidence and STOP.

## Required post-apply DB proof

After application, independently verify from the live TEST catalog/function body:

1. the new Stage B migration ledger entry exists
2. `validate_company_save_v1(jsonb)` requires canonical `scene`
3. legacy `scene_state`, `last_npcs_present`, `focal_character_id`, and `last_speaker_id` are no longer required keys
4. when those legacy fields are present, their types are still structurally checked
5. the validator calls `company_validate_scene_v1(p_save, true)`
6. validator is `SECURITY DEFINER` with `search_path = public, pg_temp`
7. validator EXECUTE remains available to `service_role` and unavailable to public/anon/authenticated
8. the current dedicated TEST save validates successfully after the migration

Also prove there is no unrelated DDL/DML change from this task.

## Scoped post-Stage-B acceptance

Use only dedicated TEST game:

`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Do not access Production.

After DB proof:

1. health-check the currently deployed API; do not redeploy it
2. run normal player setup
3. run fresh Opening once
4. run one ordinary Story -> Extract -> Commit turn
5. run one explicit player navigation turn through the normal Story -> Extract -> Commit path, to a catalog-grounded destination
6. verify after commits that canonical `save.scene` is valid and player/intentional legacy projection parity remains correct
7. verify normal context/history readback succeeds
8. final-reset the dedicated TEST game
9. directly read back clean final state: committed_turn=0, setup/opening reset, Scene v1 setup/location null/empty presence, actions=0, turns=0, and record final save_revision

This is not a provider-quality experiment. There is no retry/regeneration loop. If a live Story/Opening protocol failure occurs, preserve Worker-facing evidence, final-reset TEST, report FAILED, and STOP. Do not patch source or change provider/model/config.

## Validation

Required:

- exact pre/post migration ledger evidence
- exact pre/post validator body/security/grant evidence
- current save validation result
- scoped post-Stage-B live acceptance result
- final TEST clean readback
- PR #67 remains Draft/Open/Unmerged

If repository source/tests are unchanged, do not manufacture a test-only commit. Existing source CI evidence may be referenced, but live DB and live acceptance are the decisive gates for this task.

## Allowed

- read-only Git/GitHub/source inspection
- read-only TEST DB/catalog inspection
- apply exactly the existing Scene Stage B migration to TEST
- dedicated TEST setup/Opening/Story/Extract/Commit/context/history/reset for the scoped acceptance
- out-of-repo temporary evidence capture if needed
- docs-only CURRENT_TASK completion state
- Issue #68 lease/terminal report

## Forbidden

- any Production access/write/reset/deploy
- manual playtest game mutation/reset
- runtime/source/test/config behavior edits
- migration source edits
- historical migration edits
- additional migrations
- API or frontend redeploy
- provider/model/temperature/token/config changes
- retry/regeneration
- parser/wire relaxation or fuzzy repair
- broad Cut 3+ implementation
- PR Ready/merge
- direct DB mutation to manufacture gameplay state outside the authorized migration and normal game APIs

## Success criteria

Success requires all of the following:

1. existing Stage B migration applies exactly once to TEST
2. live validator now requires canonical `scene` and no longer structurally requires the legacy scene mirrors
3. legacy mirror types remain checked when present
4. validator security/search_path/grants remain correct
5. current reset save validates
6. scoped Setup/Opening/normal turn/navigation/context/history path succeeds under the unchanged deployed runtime
7. canonical scene and intentional projections remain coherent
8. final dedicated TEST reset/readback is clean
9. runtime/frontend deployment = 0
10. Production/manual-playtest mutation = 0
11. source/test/config/migration-file edits = 0
12. PR #67 remains Draft/Open/Unmerged

## Stop boundary

On success:

- set this task to `Status: WAITING_REVIEW`
- do not begin Cut 3
- do not merge or mark PR Ready
- post a COMPLETE terminal report with exact live migration version/name, post-apply validator evidence, scoped acceptance result, and final TEST state
- STOP for operator review

On failure/block:

- if TEST writes began, final-reset the dedicated TEST game when safely possible
- set this task to `Status: WAITING_REVIEW`
- post FAILED/BLOCKED with exact evidence
- STOP

Success phrase:

`CUT 2 SCENE STAGE B APPLIED AND VERIFIED — AWAITING OPERATOR REVIEW`

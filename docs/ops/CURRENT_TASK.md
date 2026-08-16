# Company v1 — CURRENT TASK

Status: READY
Task ID: setup-opening-world-authority-test-rollout-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5305771557` ACCEPTED the corrected Setup/Opening world-authority candidate.

Reviewed source/test/migration SHA:
`1a221665f91b352607724912ba8a06250ac60fc5`.

Reviewed unapplied migration:
`supabase/migrations/20260816040000_company_v1_setup_opening_world_authority.sql`.

Current accepted/deployed Scene executable remains:
`cd615b4926a5a7092247459d44d25f886b8ac92b`.
The Setup/Opening candidate changes SQL/test/docs only; there is no new API/frontend executable source to deploy.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production is forbidden.

## Proven pre-rollout facts

- Live TEST `reserve_company_player_setup` still contains duplicated SQL semantic allowlists for departments, positions, body types, speech styles and heroine1..heroine5.
- The reviewed migration removes those semantic catalogs and duplicate turn-0 scene mirrors.
- Repository/application remains semantic authority for setup catalogs and opening-plan meaning.
- DB retains narrow structural/transactional checks and dynamic registered-character integrity by reading per-game `game_master.data.characters` + `game_master.data.general_npcs` object keys.
- Registered future IDs can pass without SQL edits; ghost primary/supporting IDs fail before durable mutation.
- Canonical `save.scene` remains the only scene/location/presence/focal/last-speaker authority.

## Objective

Roll out the exact reviewed Setup/Opening authority migration to TEST, prove the live DB no longer duplicates repository semantic catalogs while retaining registered-ID integrity, and close the rollout with one bounded dedicated TEST smoke and final reset.

## Required work

1. Freeze exact START HEAD. Verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED and the reviewed migration text at HEAD is byte-for-byte the reviewed candidate from SHA `1a221665...` except docs-only descendants.
2. Read-only verify before apply:
   - migration `company_v1_setup_opening_world_authority` is absent from TEST migration ledger;
   - current `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)` is the old semantic-allowlist implementation;
   - current canonical Scene mirror-closure functions/validator/reset contract are still live.
3. Apply exactly `20260816040000_company_v1_setup_opening_world_authority.sql` to TEST once. Do not edit it during rollout and do not create a second migration.
4. Immediately read back live DB function contracts:
   - `reserve_company_player_setup` no longer contains finite department/position/body/speech/weekday/location/work-hook/scene-goal/heroine semantic allowlists;
   - it dynamically validates primary/supporting IDs against `game_master.data.characters` + `general_npcs` before any save mutation;
   - `company_apply_opening_scene_v1` writes canonical `save.scene` and strips the already-deleted scene mirrors while retaining physical/clothing map data;
   - function identity, SECURITY DEFINER/search_path/ACL and turn-0/idempotence checks remain correct;
   - migration ledger contains this migration exactly once.
5. Do not redeploy API or Frontend merely for ritual: reviewed candidate contains no executable API/frontend source delta. Confirm current TEST workers remain healthy and on the previously accepted Scene lineage.
6. Use only the dedicated TEST game. Start with one canonical reset and confirm clean turn-0 state and canonical scene.
7. Prove DB registered-ID integrity without manufacturing state:
   - read the dedicated game master registered character/general-NPC IDs;
   - make one direct transactional RPC probe using an unregistered/ghost primary or supporting ID and require rejection before mutation; read back save revision/setup/opening/scene unchanged;
   - do not retry the same probe or add aliases/fuzzy handling if it fails unexpectedly: preserve first evidence and STOP BLOCKED.
8. Run normal application Setup -> Opening with valid repository-backed current IDs. Confirm:
   - setup/opening succeeds;
   - canonical scene contains only registered participant IDs;
   - removed Scene mirrors remain absent;
   - player/npc physical-clothing state remains available;
   - no deleted narrative residue fields are recreated.
9. Run one provider-authored literal choice ordinary turn and one free-text ordinary turn through Story -> Extract -> Commit. Do not force a special semantic scenario.
10. Verify committed `parsed_blocks` and `turn_summary`, canonical scene continuity, exact literal-choice identity, recovery/replay, and no recreation of removed Setup/Scene semantic/mirror state.
11. Protected real-consumer systems must remain intact: physical/clothing, `npc_stats`, retained relationship display state, sexual/media presentation state where present, CSA institutional state, progression, stable identity, Mind Monitor, TTS, literal choices.
12. Final dedicated TEST reset is required. Confirm `committed_turn=0`, setup/opening `not_started`, actions=0, turns=0, canonical scene valid, deleted save residue and removed Scene mirrors absent.
13. If migration/function contract, ghost-ID rejection, valid Setup/Opening, Story/Extract/Commit, replay/recovery or final reset fails deterministically, preserve the first evidence and STOP BLOCKED. No retry/regeneration/source patch under this rollout.

## Architecture constraints

- Repository/application owns semantic catalogs and world meaning.
- DB owns transactionality, structural validation, idempotence and dynamic registered-ID integrity only.
- No hardcoded heroine/world semantic catalog in SQL.
- No compatibility alias, fuzzy ID repair, regex semantic classifier, generic state bag, new parser, semantic gate, retry, provider/model/config change or server-authored choice fallback.
- `save.scene` remains sole Scene authority; do not recreate `scene_state`, root presence/focal/last-speaker mirrors, player location mirror or NPC present/location/scene mirrors.
- Narrative continuity remains recent six raw turns + older `game_turns.turn_summary`; do not create a new narrative fact ledger.
- Institutional CSA compliance remains separate from consent/comfort/affection/emotion.
- Media/image taxonomy remains presentation-only.

## Authorized operations

Authorized:
- read-only Git/PR/TEST DB inspection;
- apply exactly the reviewed TEST migration once;
- dedicated TEST reset/setup/opening/ghost-rejection probe/ordinary two-turn smoke/replay/readback/final reset;
- health/identity readback for current TEST workers;
- TEMP/local evidence capture;
- docs-only completion update.

Not authorized:
- source/test/migration/config edits;
- API/frontend redeploy absent an unexpected executable identity defect;
- second migration or rollback;
- Production access;
- any access/mutation/reset of preserved manual game;
- retries/regeneration to obtain a pass;
- provider/model/temperature/token change;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Acceptance

PASS only if the exact reviewed migration is applied once and live TEST proves:
- SQL semantic catalog duplication is removed;
- registered character integrity is dynamic from the per-game master projection;
- ghost IDs are rejected before mutation while normal registered Setup/Opening succeeds;
- canonical Scene and deleted mirror/residue cleanup remain intact;
- literal-choice and free-text ordinary turns plus replay/recovery succeed;
- protected real-consumer state remains structurally intact;
- final dedicated TEST reset is clean;
- no Production/manual-game access or unauthorized source/deploy/retry occurred.

## Completion

On PASS or deterministic BLOCKED evidence:
- set this file to `WAITING_REVIEW` in one docs-only completion commit;
- report exact START SHA, reviewed SHA, migration ledger version/name, live function/ACL facts, worker health identities, ghost-ID probe result, valid Setup/Opening/turn/replay evidence, final reset state, and FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not create the next task yourself.

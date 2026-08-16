# Company v1 — CURRENT TASK

Status: READY
Task ID: legacy-save-db-residue-test-rollout-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5305063507` ACCEPTED the deletion-first source/test/migration candidate from `legacy-save-db-residue-deletion-v1`.

Reviewed source/test/migration SHA:
`9c52e74a8e32278207e6e9b729c33d64eb770fd1`

Terminal docs SHA before this registration:
`33c790348179d438f62c912345e656e7181cd42b`

Reviewed additive migration source:
`supabase/migrations/20260816000200_company_v1_legacy_save_residue_cleanup.sql`

Independent live TEST migration-ledger read before registration confirmed that `company_v1_opening_structured_persistence` is applied and `company_v1_legacy_save_residue_cleanup` is not yet applied.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden and must not be read, mutated, or reset.
Production access is forbidden.

## Objective

Roll out and verify the already-reviewed legacy save/DB residue deletion on TEST without adding any compatibility runtime or changing gameplay semantics.

The five deleted save-level residues are:
- `story_summary_overall`
- `story_summary_recent`
- `npc_emotion`
- `npc_work_state`
- general `event_ledger`

`npc_relationship_state` is intentionally retained because current frontend/relationship/sexual-record consumers still read it. `sexual_event_ledger` is a separate protected sexual/media consumer. `game_turns.turn_summary` remains the memory authority beyond the recent raw-turn window.

## Required work

1. Freeze exact start HEAD and re-check PR #67 is still base `main`, OPEN / DRAFT / UNMERGED, with no ancestry conflict and no executable change after reviewed SHA `9c52e74...` except docs/ops registration.
2. Re-read the exact reviewed migration and verify the live TEST preconditions read-only before applying anything:
   - migration `company_v1_legacy_save_residue_cleanup` is absent from the live ledger;
   - current Opening structured-persistence contract remains live;
   - current canonical function identities/ACL/security/search_path needed by the migration are present.
3. Apply exactly the reviewed additive migration `20260816000200_company_v1_legacy_save_residue_cleanup.sql` to TEST once. Do not edit the migration before application. If source text at HEAD differs from reviewed SHA, STOP BLOCKED.
4. Immediately read back live TEST facts after migration:
   - migration ledger contains the new migration exactly once;
   - `validate_company_save_v1(jsonb)` no longer requires the five deleted keys and still validates required protected structure;
   - canonical six-argument `commit_company_opening(uuid,uuid,text,text,jsonb,jsonb)` remains the sole Opening writer and its body strips the five deleted keys while preserving committed `parsed_blocks`;
   - `reset_company_game(uuid,text)` strips the five deleted keys from reset materialization;
   - all relevant functions remain `SECURITY DEFINER`, `search_path = public, pg_temp`, executable only by the intended role(s); do not widen ACLs.
5. Deploy the exact reviewed runtime/source identity `9c52e74a8e32278207e6e9b729c33d64eb770fd1` to the TEST-facing Company workers only where that SHA changed executable code:
   - API Worker because `src/engine/gameplay-state.js` changed;
   - Frontend Worker because `src/frontend/pages/view-model.js` changed.
   Use the existing reviewed deployment paths. Do not modify source/config to make deployment pass. Record exact Worker Version IDs and `/health`/identity evidence where available.
6. Run one bounded dedicated TEST structural acceptance using only the dedicated TEST game. Reuse existing reviewed canary/reset helpers; do not create a new harness.
7. Acceptance flow:
   - reset the dedicated TEST game through the canonical reset RPC;
   - read back reset save and prove all five deleted keys are absent;
   - Setup -> Opening and read back committed Opening/save; prove the five deleted keys remain absent and Opening `parsed_blocks` remains committed;
   - execute at least one ordinary provider-authored literal choice turn and one ordinary free-text turn through Story -> Extract -> Commit;
   - after each commit, read back save/history and prove the five deleted keys are not recreated;
   - prove literal choice identity round-trips unchanged when selected;
   - prove `game_turns.turn_summary` is populated/readable under the current contract and replay/recovery uses committed state without recreating deleted keys;
   - read a normal frontend/context projection and confirm relationship display can still consume retained `npc_relationship_state` without inventing a replacement relation/event authority.
8. Protected systems must remain intact. Do not force a sexual scenario merely to prove this structural rollout, but verify source/live projection boundaries still preserve `sexual_event_ledger`, player/NPC physical-clothing state, image/media presentation adapters, `npc_stats`, CSA, progression/TEST-only Level-7 seam, stable identity, literal choices, Mind Monitor, and TTS. Media classification must remain presentation-only and must not gate Story/Extract facts.
9. Final dedicated TEST reset is authorized and required after evidence capture. Confirm committed_turn=0 / no recent turns or actions / setup-opening reset state as provided by the canonical reset contract.
10. If migration application, DB contract readback, exact-SHA deploy, Story/Extract/Commit, literal-choice round-trip, replay/recovery, or residue absence fails deterministically, preserve the first authoritative evidence and STOP as BLOCKED. Do not retry/regenerate to obtain a pass.

## Architecture constraints

- One durable domain -> one canonical writer.
- This is rollout/acceptance, not a license for source changes.
- No new generic state bag, relation/event ledger, summary mirror, alias map, semantic enum/gate, parser, compatibility overload, retry, provider/model/config change, fuzzy repair, or fallback Story.
- Do not delete `npc_relationship_state` or sexual/media state in this task; current consumer proof keeps them until a later caller-removal cut proves zero consumer.
- Exactly-four choices remain provider-authored literal strings; exactly-four is presentation shape, not semantic taxonomy.
- Story authors narrative; Extract observes; Commit/DB owns structural persistence.
- Unknown optional media/projection failure must fail open and must never erase a narrative fact.

## Authorized operations

Authorized:
- read-only Git/source/PR/TEST DB inspection;
- apply exactly the reviewed TEST migration `company_v1_legacy_save_residue_cleanup` once;
- exact reviewed API/Frontend TEST-facing deployment for SHA `9c52e74...` only;
- dedicated TEST game reset/setup/opening/ordinary gameplay/readback/replay necessary for the bounded acceptance;
- final reset of that dedicated TEST game;
- TEMP/local evidence capture outside the repository;
- docs-only completion update.

Not authorized:
- any Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- source/runtime/test/migration/config edits;
- editing any historical applied migration;
- a second migration or compatibility overload;
- direct DB mutation to manufacture state;
- provider/model/temperature/token changes, retries/regeneration, parser relaxation/new parser, fuzzy repair, semantic hard gates;
- new branch/PR, reopening #65/#66, merge, Ready, rebase, squash, or force-push.

## Acceptance

PASS only if all are proven on the exact reviewed lineage:
- migration applied exactly once and live function/ACL/security contract matches the reviewed additive migration;
- exact reviewed executable is the deployed TEST identity for changed workers;
- reset, Opening, literal-choice ordinary turn, free-text ordinary turn, replay/recovery all complete through canonical paths;
- the five deleted save-level residues are absent after reset, Opening, and ordinary commits;
- `game_turns.turn_summary` and committed `parsed_blocks` remain intact;
- retained relationship display consumer still works from retained `npc_relationship_state` without new writer/taxonomy;
- protected scene/physical/clothing/sexual/media/stats/CSA/progression/identity/TTS systems are not structurally removed;
- final dedicated TEST reset is clean;
- no Production/manual-game access and no unauthorized source/config change occurred.

## Completion

On completion:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only commit;
- report exact START SHA, reviewed executable SHA, migration apply result/version/name, post-apply live function/ACL facts, API/Frontend deployed identities, dedicated TEST game ID, reset/Opening/turn/replay evidence, deleted-key absence probes, protected-consumer checks, final reset state, and exact FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not create the next task yourself.

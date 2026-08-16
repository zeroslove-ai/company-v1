# Company v1 — CURRENT TASK

Status: READY
Task ID: legacy-save-db-residue-deletion-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5304988730` closes `story-speaker-identity-live-evidence-closure-v1` without another evidence-only rerun. The latest bounded TEST run functionally passed canonical speaker identity, provider-authored literal choice, ordinary free text, Story -> Extract -> Commit and replay; its remaining failure was temporary `/api/history` evidence-orchestrator bookkeeping, not a gameplay/runtime defect.

Current reviewed gameplay lineage includes the accepted Story marker consolidation and Opening structured persistence contract. Do not reopen those incidents unless a new deterministic product defect proves they are wrong.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production access is forbidden.

## Objective

Perform one deletion-first cleanup of legacy save/DB shape residue that no longer participates in the canonical gameplay spine.

The current canonical memory/read path is recent raw Story plus `game_turns.turn_summary` memory; current Story does not use the old save-level summary fields. Current fresh semantic runtime also no longer uses the old general relation/emotion/work/event-ledger authorities.

Candidate residue to audit first:
- `story_summary_overall`
- `story_summary_recent`
- `npc_relationship_state`
- `npc_emotion`
- `npc_work_state`
- `event_ledger`

These are deletion candidates, not assumptions. Prove actual current consumers before deleting. A field with a real current product consumer may remain, but the consumer and reason must be concrete. Do not keep a field merely because an old validator, reset shape, fixture, migration body, mock, or stale test mentions it.

## Required work

1. Freeze exact start HEAD and inspect current source plus TEST DB catalog/function bodies read-only where needed.
2. For each candidate field, trace all current authorities and consumers across:
   - Story/Extract prompt/context projections;
   - Commit/reducers and gameplay-state hydration;
   - API context/history/app/display readers;
   - frontend state/render/recovery readers;
   - save validator/reset/setup/opening/commit SQL writers;
   - migrations/config contracts/tests/fixtures.
3. Classify every candidate as `DELETE` or `KEEP_WITH_PROVEN_CONSUMER`.
4. For every `DELETE` field, remove the residue in the same cut wherever the active contract permits:
   - source hydration/projection/change-root/read aliases;
   - current API/frontend readers;
   - current writer/default/reset/setup/opening/commit creation paths;
   - validator required-key residue;
   - stale mocks/fixtures/tests that only preserve the superseded field.
5. Do not stop merely because the live validator or an applied function currently requires/writes a deleted field. Historical applied migrations are immutable, but the current contract may be superseded by exactly one new additive migration authored in this task.
6. If DB contract changes are required, author exactly one additive migration that updates only the current affected functions/contracts. Prefer replacing the current canonical function signature/body in place over retaining compatibility overloads. Do not edit any historical applied migration.
7. In particular, if source/consumer proof confirms the old save-level summary fields are dead:
   - stop `commit_company_opening` and reset/bootstrap writers from creating/updating `story_summary_overall` / `story_summary_recent`;
   - remove them from current save validation requirements/default shape;
   - preserve `game_turns.turn_summary` and the Story contract of latest six raw turns + older chronological `turn_summary_memory`.
8. If `npc_relationship_state`, `npc_emotion`, `npc_work_state`, or `event_ledger` have no current gameplay/UI consumer, remove their active save-shape/hydration/validator/reset residues rather than leaving empty placeholder maps/arrays.
9. Do not replace deleted fields with a new generic state bag, alias map, compatibility projection, open-fact ledger, relation/event taxonomy, semantic enum, synthetic memory, or second writer.
10. Preserve actual consumer systems unless this audit independently proves them dead:
    - canonical scene/location/presence;
    - player/NPC physical and compact clothing continuity;
    - player sexual state and the existing sexual/media adapters;
    - `npc_stats`;
    - CSA rule/lifecycle/capability/attitude mechanics;
    - progression and TEST-only Level-7 seam;
    - stable registered character/location identity;
    - `game_turns.turn_summary` memory;
    - provider-authored literal choices;
    - image/media presentation and TTS.
11. Keep Story as narrative author, Extract as observer, Commit/DB as structural persistence authority. Do not add semantic hard gates, retries, provider/model changes, parser relaxation, fuzzy repair, another parser, or fallback Story.
12. Update tests according to the new contract. Delete stale compatibility tests instead of writing runtime compatibility code to keep them green. Test count is only a regression signal.

## Acceptance

The source/test/migration candidate is acceptable when:
- each candidate field has an explicit DELETE or KEEP_WITH_PROVEN_CONSUMER decision;
- all DELETE fields have no active source reader/writer/default/hydration residue left except immutable historical migrations/documentation;
- any additive migration removes deleted fields from the current live contract without compatibility overloads or duplicate writers;
- current-format Opening/ordinary turn/reset fixtures no longer manufacture deleted fields;
- `game_turns.turn_summary` and recent-six + older-summary memory remain intact;
- protected scene/physical/clothing/sexual/media/stats/CSA/progression/identity/TTS systems are not accidentally removed;
- focused tests, relevant syntax checks, `git diff --check`, and full suite regression signal are recorded;
- no new semantic gate/enum/ledger/adapter is introduced as a replacement.

## Authorized operations

Authorized:
- source/history inspection on the canonical branch;
- read-only TEST DB catalog/function/validator inspection only when needed to prove current contract shape;
- source/test/config cleanup;
- exactly one additive migration authored but NOT applied if required by proven deletion scope;
- docs-only completion update.

Not authorized:
- applying a migration or DDL to TEST/live DB;
- TEST gameplay/reset/write or live LLM calls;
- Worker/frontend deploy;
- Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- provider/model/temperature/token changes or retries/regeneration;
- a new compatibility layer, parser, semantic gateway, or duplicate durable writer.

## Completion

On completion:
- commit and push the source/test/migration candidate on the canonical branch;
- set CURRENT_TASK to `WAITING_REVIEW` in the completion update;
- report exact START SHA, executable/source-test SHA, migration filename if authored, final docs SHA, files changed, DELETE/KEEP decisions with consumer proof, tests/checks, and explicit zero live mutation/deploy statement;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate another evidence-only acceptance task.
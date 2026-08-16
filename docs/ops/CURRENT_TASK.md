# Company v1 — CURRENT TASK

Status: READY
Task ID: relationship-history-mirror-boundary-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307646651` ACCEPTED `client-readback-projection-test-rollout-v2`.
Accepted current runtime/readback lineage includes:
- client committed-readback projection authority: `f5d93f9563fa23f16c1e599e4a51e38c846c890d`;
- shared Opening/ordinary Story provider choice protocol: `a176e997f3dac1e03968f92b07ab50f37e1b49ec`;
- rollout completion docs head: `1997a4d89c81d2e2d4dc2bc1cdb606c48051de1a`.

The V2 rollout is accepted live evidence: four provider-authored Opening choices, exact literal Turn 1, free-text Turn 2, committed readback/history/replay, and canonical final reset all passed without retry/regeneration.

Owner narrative-memory direction remains binding:
- Story authors narrative;
- Extract emits narrow proven machine/UI observations plus one natural-language `turn_summary`;
- latest six raw committed turns + chronological older `turn_summary` entries are narrative continuity;
- generic relation/emotion/work/event/open-fact style durable memory is not to be rebuilt as another semantic authority.

Current concrete residue to inspect is `npc_relationship_state`. Frontend raw relationship authority has already been removed, but server display code still reads this generic map for relationship summary and historical sexual-history/milestone/counter fields. `sexual_event_ledger`, `ejaculation_counts`, `player_sexual_state`, `npc_stats`, canonical scene, CSA institutional state and turn-summary memory remain separate proven narrow domains.

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate.
Production is forbidden.

## Objective

Narrow or delete the remaining `npc_relationship_state` generic mirror authority using actual current callers, writers and supported stored-data proof. Keep only proven historical/mechanical/display compatibility that cannot yet be reconstructed from an existing canonical narrow domain. Do not turn sexual events, CSA mechanics, stats, or summaries into a replacement relationship/consent/emotion system.

This is an implementation cut, not another memo. Inventory and delete in the same cut where proof is complete.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Build an exact source + current TEST catalog/data caller map for:
   - `npc_relationship_state` itself;
   - `relationship_summary`, `summary`, `current_boundary`, `closeness`;
   - `sexual_history` and all nested sexual counters/first-turn fields;
   - relationship-level ejaculation counter mirrors;
   - `milestones.sexual_relationship_started_turn` or equivalent unlock fields;
   - `sexual_event_ledger`;
   - `ejaculation_counts`;
   - `player_sexual_state` / any current NPC sexual mechanical state;
   - server `character-display` / `runtime-display` / context/history/recovery consumers;
   - save defaults/migration helper/validator/reset/setup/opening contracts and tests.
3. Classify each current field/path as one of:
   - `CANONICAL_NARROW_MECHANIC`;
   - `PRESENTATION_DERIVED`;
   - `HISTORICAL_READ_ONLY`;
   - `REMOVE`.
   Classification must be justified by a concrete current writer/reader or supported historical stored-data need, not by field name or stale tests.
4. Relationship narrative boundary:
   - `npc_relationship_state` must not remain or become general narrative memory for promises, consent, comfort, affection, trust, emotion, work facts, arbitrary relations, or Story truth.
   - Do not create a new relationship ledger, enum, stage machine, summary store, graph, vector memory, inference rule, or compatibility bag.
   - Current narrative continuity remains latest-six raw Story + older natural-language `turn_summary` memory.
5. Sexual/mechanical boundary:
   - preserve `sexual_event_ledger`, `ejaculation_counts`, `player_sexual_state`, and any other narrow state only where current mechanics/UI actually consume them;
   - never infer or mutate consent/comfort/trust/affection/relationship stage from a sexual event;
   - where current display can derive counts/last-event/unlock from the canonical sexual ledger/counters without semantic loss, remove duplicate relationship-map fallback precedence;
   - where legacy route-specific counters (for example vaginal/anal/oral or first-turn fields) cannot be reconstructed from the current ledger shape, retain them only through one explicit historical read-only boundary and state the deletion condition. Do not add fields to the current ledger merely to preserve stale historical shape unless a current product mechanic proves the need.
6. Inspect `src/api/character-display.js` specifically. Its current `eventRecord()` reads both `npc_relationship_state[id].sexual_history` and current ledger/counters, and `privateInfo()` also consults a relationship milestone. Collapse duplicate current authority where proof permits. Historical fallbacks must be visibly historical and must not affect fresh narrative truth.
7. Inspect `src/api/runtime-display.js` evidence/directory logic. A generic historical relationship map must not by itself become current gameplay/identity evidence for a general NPC unless a unique visible product requirement proves that behavior is necessary. Preserve stable registered identity/catalog and canonical scene evidence.
8. Trace fresh-turn writers. If current Story/Extract/Commit still actively writes generic `npc_relationship_state` narrative semantics despite the simplified memory direction, remove that writer/reader/test surface in this cut. If there is no fresh writer, document the map as historical/readback only and prevent accidental active-authority use.
9. Inspect save migration/default/validation/DB contract:
   - if current save shape structurally requires `npc_relationship_state` even though active gameplay no longer does, remove the source/default requirement where safe;
   - author at most one additive migration candidate only if a proven current DB validator/reset/RPC contract must change to stop requiring/writing the generic mirror;
   - do NOT apply any migration in this task;
   - historical applied migrations are immutable;
   - do not mutate preserved manual-game data to make the field disappear.
10. If supported non-preserved TEST stored data still contains relationship historical data, quantify shape/count read-only. Do not access the preserved manual game. Historical data presence alone does not make the field current narrative authority; it may justify only a narrow read-only boundary.
11. Frontend must continue to consume committed server display projections only. Do not reintroduce raw `save.npc_relationship_state` fallback or client semantic reconstruction.
12. Preserve the accepted current boundaries:
   - provider-authored exactly-four literal choices;
   - committed `parsed_blocks` replay/history authority;
   - one persisted legacy Extract read-only boundary;
   - canonical `save.scene`;
   - `npc_stats`;
   - evidence-gated physical posture/position and compact clothing;
   - CSA institutional lifecycle/context;
   - progression;
   - Mind Monitor / media / image / TTS presentation sidecars;
   - latest-six raw + older `turn_summary` memory;
   - transaction/idempotence/replay identity.
13. Delete stale source exports, fallback branches, fixtures and tests in the same cut when their protected current caller/data path is removed. Rewrite tests around the surviving canonical/historical boundary rather than preserving implementation-detail assertions.
14. Run focused relationship/display/sexual/history/recovery/save-contract tests, full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`.
15. Report a concrete REMOVE/KEEP result, any additive migration candidate (authored but not applied), exact source/test SHA, test results, and forbidden-operation confirmation.

## Architecture constraints

- No new general narrative-memory system.
- No semantic gate/evidence completeness gate around ordinary Story/Extract/Commit.
- No fuzzy identity matching, relationship inference, sexual-to-consent inference, retry/regeneration, provider/model changes, parser generation, or compatibility bag.
- Do not preserve dead runtime solely for stale tests.
- One supported historical need may keep one explicit read-only boundary; it may never become a fresh writer.
- Current sexual/media taxonomies are narrow mechanics/presentation only and must not decide whether arbitrary narrative meaning occurred.
- Historical migrations and immutable evidence are not edited.

## Authorized operations

Authorized:
- read-only Git/PR/source/history inspection;
- read-only TEST DB catalog/data inspection excluding the preserved manual game;
- source/test/config/docs cleanup on the canonical branch;
- at most one additive migration candidate authored but NOT applied, only if proven current DB structural contracts require it;
- local focused/full tests and static checks.

Not authorized:
- TEST gameplay/setup/opening/reset or other DB writes;
- migration/DDL application;
- API/frontend deployment;
- Production access/deployment;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes;
- retry/regeneration;
- new semantic memory/relationship system, parser, fuzzy repair, semantic hard gate, compatibility runtime;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if `npc_relationship_state` and its sexual/history mirrors are reduced to their smallest caller/data-proven role: active generic narrative-memory authority is removed, duplicate display/mechanical fallback precedence is deleted where canonical narrow state already exists, and any unavoidable old-save fields survive only behind an explicit read-only historical boundary with a clear deletion condition. Current UI/readback and narrow mechanics must remain intact without inventing replacement semantic state.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact REMOVE/KEEP classification, stored-data proof, migration-candidate status, focused/full tests, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not generate the next task yourself.

# Company v1 — CURRENT TASK

Status: READY
Task ID: cut3-relation-event-live-acceptance-resume
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Context

Cut 3 Relationship / Event Authority source is operator-accepted at exact gameplay executable SHA `1a5c5540a0235fb2e53b2452516897af7664eba1` and is already deployed to the TEST API as Worker version `6f0940d5-3145-4301-bcdf-61bdccc3cdac` from the first acceptance attempt.

The first live acceptance stopped because its canary discarded decisive Story failure evidence. Follow-up task `cut3-story-failure-observability-root-cause` classified that as a harness defect and added diagnostic-only commit `4e2e788db6cc4cf1327c118db9e7199ac7f11ca6`; no gameplay runtime/provider/parser/relation-event behavior changed. A single diagnostic TEST invocation then passed Setup/Opening/ordinary turns/Extract/Commit and reset clean, so no deterministic Story runtime defect was proven.

Resume the actual Cut 3 live acceptance now. Do not deploy merely because the diagnostic harness commit moved Git HEAD.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected base: `main`
Expected PR state: OPEN / DRAFT / UNMERGED
Accepted Cut 3 gameplay executable: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Diagnostic harness executable-only commit: `4e2e788db6cc4cf1327c118db9e7199ac7f11ca6`
Known TEST Worker version: `6f0940d5-3145-4301-bcdf-61bdccc3cdac`
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Preserved manual evidence game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable and must not be accessed or mutated.

PR #65/#66 remain superseded closed containers. No new branch/PR. No merge/Ready/rebase/squash.

## Goal

Close Cut 3 with real TEST evidence that the canonical Relationship/Event reducer persists meaningful relation/event consequences through the normal Setup -> Opening -> Story -> Extract -> Commit path, while replay/recovery remain idempotent and ordinary game flow is preserved.

## Preflight

1. Fetch origin and verify #67 remains OPEN/DRAFT/UNMERGED based on `main`.
2. Prove current HEAD descends from accepted gameplay executable `1a5c5540...` and that gameplay runtime/config/migration diff since it is zero; diagnostic harness/test/docs changes are allowed.
3. Verify TEST Worker identity is still `6f0940d5-3145-4301-bcdf-61bdccc3cdac` and corresponds to gameplay source `1a5c5540...`. If identity drifted, STOP; do not deploy under this task.
4. Verify dedicated TEST game starts clean. Never access the manual evidence game.
5. Re-read CURRENT_TRUTH.md, AGENTS.md, 09_CURRENT_TRUTH.md, 10_SOLE_WRITER_DECISION.md, POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md, and the accepted Cut 3 source/participant-closure reviews in Issue #68.

## One bounded live acceptance

Run exactly ONE bounded normal-API Golden Path on the dedicated TEST game using the improved diagnostic harness. No automatic Story retry/regeneration.

The scenario must create at least one exact-evidence ordinary non-CSA relationship/event consequence involving a registered participant, then verify after Commit:

- `active_relations` is written only through the canonical Relation/Event reducer semantics;
- the expected relation/event consequence is durable in committed context/save;
- registered participant identity is preserved exactly;
- unknown/unresolved participants cannot become durable relation/event facts;
- same-turn Engine mandatory relation input, when applicable in the exercised path, has deterministic precedence over conflicting observational Extract input;
- event and sexual-event ledgers are replay-safe/idempotent and do not duplicate on same-action recovery/re-read;
- relation supersede/end behavior remains deterministic where exercised;
- scene/location/presence authority from Cut 2 remains unchanged;
- player input remains intent/attempt rather than automatic durable success;
- warnings/no-op semantic uncertainty does not reject an otherwise valid ordinary turn.

Use existing targeted/unit evidence for invariants that cannot be naturally exercised in this single bounded live scenario; do not manufacture DB state merely to hit every branch.

If Story fails before relation/event proof, preserve the new diagnostic bundle (HTTP/SSE/action-status/parser/context) and STOP as BLOCKED. Do not retry and do not patch under this lease.

## Recovery / replay proof

After the successful committed relation/event turn:

- read context/history through normal APIs;
- exercise only the existing safe same-action/recovery path already supported by the canary, without creating a second semantic event;
- prove durable relation/event ledger counts/identities are unchanged after recovery/re-read;
- prove committed parsed/history/context projections agree on the committed turn identity.

## Final reset

Reset only the dedicated TEST game through the normal reset API and verify clean baseline (`committed_turn=0`, setup/opening not started, no active CSA, idle processing). Do not reset the preserved manual game.

## Required validation

- existing focused Cut 3 relation/event reducer tests;
- participant identity closure tests;
- Story/SSE/action lifecycle and diagnostic harness tests;
- full current test suite if practical within the lease;
- syntax checks for changed local JS/MJS only if any (no source change is expected);
- `git diff --check`;
- exact Worker identity and final TEST reset proof.

Test count is a regression signal, not correctness proof.

## Operations boundary

Allowed: read-only Git/source/TEST inspection; normal API Setup/Opening/Story/Extract/Commit/context/history/recovery on the dedicated TEST game; exactly one bounded live acceptance; final normal reset; local tests.

Forbidden: Production; manual evidence game access/mutation/reset; API/frontend deploy; migration/DDL; direct DB gameplay-state manufacture/repair; gameplay runtime source patch; provider/model/temperature/token changes; retry/regeneration; fuzzy repair; parser relaxation; semantic hard gate; new parser; new branch/PR; merge/Ready/rebase/squash.

If a repository defect is discovered, do not patch it here. Preserve evidence and report BLOCKED so the operator can create a separate root-cause task.

## Completion

Post one terminal report to Issue #68 containing:

- exact PR/head and deployed Worker identity;
- exact live turn/action IDs and bounded scenario;
- durable `active_relations` / `event_ledger` / `sexual_event_ledger` before/after evidence;
- replay/recovery idempotence evidence;
- Story diagnostic evidence if blocked;
- focused/full validation results;
- final dedicated TEST reset proof;
- explicit DB migration/deploy/Production/manual-game operations;
- STOP for operator review.

Set CURRENT_TASK to WAITING_REVIEW in a separate docs-only commit after the evidence run.

Success phrase only if relation/event live acceptance and reset both pass:

`CUT 3 RELATIONSHIP/EVENT AUTHORITY LIVE ACCEPTED — AWAITING OPERATOR REVIEW`

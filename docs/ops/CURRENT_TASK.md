# Company v1 — CURRENT TASK

Status: READY
Task ID: cut3-relation-event-registered-participant-closure
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Context

The first Cut 3 implementation candidate is executable SHA `c1b14b8d19b76e14f5a56379d5ff6117ca1daea5` with docs-only completion SHA `6f49eb3b7fc420268c5e9df7c467b7fad1494d17` on `company/scene-location-presence-v1` / canonical Draft PR #67.

Operator review is `CHANGES_REQUIRED` for one concrete authority gap. The architecture direction is otherwise retained: `reduceRelationEventDomains()` is the single fresh-turn relation/event durable writer; `csa-commit-reducer.js` no longer writes `active_relations`; `observation-reducers.js` delegates the targeted domains.

The gap is in general-event identity validation. `reduceGeneralEvents()` currently checks only that participant entries are non-empty strings. A non-empty unknown ID such as `ghost_npc` can therefore be persisted into `event_ledger` when its evidence quote appears in Story. This violates the Cut 3 contract that observational relation/event consequences require registered identities and that unknown actor/target observations degrade to warning + no durable mutation.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected base: `main`
Expected PR state: OPEN / DRAFT / UNMERGED
Starting executable candidate: `c1b14b8d19b76e14f5a56379d5ff6117ca1daea5`
Starting branch HEAD before this handoff: `6f49eb3b7fc420268c5e9df7c467b7fad1494d17`

PR #65/#66 are superseded closed containers. Do not reopen them. Do not create a branch or PR. Do not rebase/squash/merge/mark Ready.

Read CURRENT_TRUTH.md, AGENTS.md, 09_CURRENT_TRUTH.md, 10_SOLE_WRITER_DECISION.md, POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md, then this task. Current source/Git truth outranks prose.

## Required correction

Keep the canonical Cut 3 reducer design. Correct only the missing identity invariant at the canonical relation/event boundary.

1. General-event participant IDs must be validated against the registered identity set supplied to the canonical reducer.
2. `player` and already-supported canonical player aliases may normalize to canonical `player`; do not invent new aliases.
3. Every non-player participant must be a registered NPC/character ID in the authoritative `npcIds` set.
4. If any participant is unknown/unresolved, drop that observational general event, append a deterministic warning, and continue the ordinary turn.
5. Do not fuzzy-match names/IDs and do not infer a replacement participant from Story text.
6. Exact Story evidence remains required. Registered identity is an additional authority requirement, not a replacement for evidence.
7. Preserve deterministic replay-safe dedupe for accepted general events.
8. Do not change Engine relation precedence, relation supersession/end semantics, relationship-field evidence gates, sexual-event semantics, physical state, memory/summary, Scene, Setup/Opening, provider/prompt/parser behavior, or frontend architecture.

If actual source proves a broader identity leak in the same general-event input boundary, fix the shared normalization narrowly rather than adding downstream patches. Do not expand into unrelated domains.

## Required focused proof

Add/adjust behavior tests proving at minimum:

- exact-evidence general event with a registered participant is accepted;
- the same accepted event replay does not duplicate the ledger entry;
- exact-evidence general event with a non-empty unknown participant ID is dropped and produces warning only;
- unknown participant does not fail Commit/ordinary turn;
- player canonical identity/allowed existing alias remains valid if currently supported;
- existing Cut 3 Engine-vs-Extract precedence and relation tests remain green.

Run focused relation/event/commit suites, full current `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`. Test count is regression signal; inspect any failure against the canonical contract rather than adding compatibility.

## Operations boundary

Allowed: source/test/docs changes on the existing branch; local tests/static checks; read-only inspection.

Forbidden: TEST gameplay write/reset, DB migration/DDL/DML, API/frontend deploy, Production, manual playtest mutation/reset, provider/model/config changes, retry/regeneration, fuzzy repair, semantic hard gate, parser generation, new branch/PR, merge/Ready/rebase/squash.

Manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` remains immutable READ-ONLY evidence.

## Completion

On success:

- produce one new exact executable SHA descending from `c1b14b8...` with the narrow closure and tests;
- set CURRENT_TASK to WAITING_REVIEW in a separate docs-only commit;
- post a terminal COMPLETE report to Issue #68 with START_SHA, FINAL_EXECUTABLE_SHA, FINAL_SHA, changed files, focused/full validation, and explicit zero DB/deploy/Production/manual-game mutations;
- STOP for operator review.

Success phrase:

`CUT 3 REGISTERED PARTICIPANT AUTHORITY CLOSED — AWAITING OPERATOR REVIEW`

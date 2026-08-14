# Company v1 — CURRENT TASK

Status: READY
Task ID: cut3-relation-event-observation-contract-root-cause
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 3 Relationship / Event Authority source is accepted at gameplay executable `1a5c5540a0235fb2e53b2452516897af7664eba1`. The canonical reducer/participant closure is structurally accepted, but two bounded TEST acceptance turns completed Story -> Extract -> Commit with `relation_updates=[]`, `events.general=[]`, and `events.sexual=[]`. Therefore the new reducer had no typed ordinary observation to persist and live Cut 3 acceptance remains unproven.

Do not solve this by retrying Story/Extract, changing provider/model/prompt sampling, adding fuzzy inference, manufacturing DB state, or treating player input as successful durable fact. Determine whether the Story -> Extract -> canonical Relation/Event observation contract is missing, disconnected, overconstrained, or the prior acceptance scenario simply failed to produce qualifying exact Story evidence.

## Binding topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected base: `main`
Expected PR state: OPEN / DRAFT / UNMERGED
Accepted Cut 3 gameplay executable: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Current docs-only head at handoff descends from `0c00fd6cfcff6f87693b96cb7a28279eda0ea059`.
Known TEST Worker remains evidence only; do not deploy in this task.
Dedicated TEST game was reset clean by the prior task.
Preserved manual evidence game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable: do not access or mutate it.
PR #65/#66 remain closed superseded containers. No new branch/PR, merge, Ready, rebase, or squash.

## Goal

Recover the exact ordinary Relationship/Event observation pipeline and fix only a proven repository contract/ownership defect so that meaningful exact Story evidence can become typed canonical Relation/Event reducer input without making semantic uncertainty a turn blocker.

## Required investigation before any patch

Trace current source end-to-end for ordinary non-CSA relation/event consequences:

1. Story generation contract: what visible evidence can/should express relationship change, boundary change, apology/reconciliation, general events, and sexual events.
2. Extract request/schema/normalization: exact fields for `relation_updates`, `events.general`, `events.sexual`; whether they are requested, accepted, normalized, or silently dropped.
3. Story-evidence validation: what exact quote/participant/type requirements an observation must satisfy before becoming typed reducer input.
4. Commit orchestration: prove where Extract observations are converted to the canonical Relation/Event reducer input and that no superseded writer independently mutates the same durable fields.
5. Canonical reducer: confirm registered-participant closure, Engine mandatory precedence, idempotence, supersede/end, and ledger dedupe remain intact.
6. Acceptance harness/scenario: inspect the exact bounded scenario used in the blocked live run and determine whether its Story actually contained qualifying evidence. If the scenario itself did not create meaningful observable relation/event evidence, classify that as an acceptance-design defect rather than weakening runtime semantics.

Write a concise root-cause note in the terminal report before describing any fix.

## Allowed implementation

Only if investigation proves a repository defect, make the smallest upstream ownership/contract correction needed to restore the intended typed observation path. Examples of acceptable classes, only when proven:

- a missing Extract schema/request field that prevents intended relation/event observations from being emitted;
- a normalization/wiring defect that drops valid typed observations before the canonical reducer;
- a mismatch between existing Story evidence contract and existing Extract structural contract;
- a deterministic acceptance-harness scenario defect that can be corrected without changing gameplay semantics.

Do not add a second relation/event writer. Do not infer durable success directly from player input. Do not make absence of optional relation/event observations fail the ordinary turn. Unknown/unregistered participant remains warning + no durable mutation.

If no repository defect is proven and the only fact is that a stochastic provider emitted no qualifying observation, STOP BLOCKED with exact evidence. Do not add prompt hotfixes or retries just to force acceptance.

## Tests / proof

Classify affected tests KEEP / REWRITE / DELETE against the canonical architecture. Add focused regression proof for the exact root cause. At minimum preserve/prove:

- valid registered-participant exact-evidence relation observation reaches canonical reducer input and persists in reducer result;
- valid general/sexual event observation reaches canonical ledger input where applicable;
- empty/uncertain observation is no-op and does not reject an ordinary turn;
- unknown participant is warning + no durable mutation;
- same-turn valid Engine mandatory relation input wins over conflicting observational Extract;
- same-action/replay remains idempotent;
- no direct duplicate `active_relations`/event-ledger writer is reintroduced;
- player input alone cannot create a successful durable relation/event fact;
- Cut 2 scene/location/presence invariants remain unchanged.

Run focused tests, current full suite if practical, syntax checks for changed JS/MJS, and `git diff --check`. Test count alone is not correctness proof.

## Operations boundary

Allowed: Git/source/test inspection and source/test/harness changes on existing #67 branch when root cause is proven; local tests; read-only public TEST identity inspection if needed.

Forbidden: Production; manual evidence game access; TEST gameplay mutation/reset; deploy; migration/DDL; direct DB gameplay-state manufacture/repair; provider/model/temperature/token changes; automatic retry/regeneration; fuzzy repair; parser relaxation; semantic hard gate; new parser generation; new branch/PR; merge/Ready/rebase/squash; historical migration edits.

## Completion

Post one terminal report to Issue #68 with:

- STATUS COMPLETE/BLOCKED/FAILED;
- START_SHA / FINAL_SHA and exact executable candidate if changed;
- root-cause classification with exact source path/contract evidence;
- whether the blocked live scenario contained qualifying Story evidence;
- changed files and why each belongs to the canonical ownership boundary;
- focused/full test results and invariant proof;
- explicit confirmation that no retry/provider/model/fuzzy/parser relaxation/semantic gate/duplicate writer was added;
- DB/deploy/Production/manual-game operations = none;
- PR #67 remains OPEN/DRAFT/UNMERGED;
- STOP for operator review.

Set CURRENT_TASK to WAITING_REVIEW in a separate docs-only commit after the terminal evidence is ready.

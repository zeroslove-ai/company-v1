# Company v1 — CURRENT TASK

Status: READY
Task ID: cut3-relation-event-deterministic-acceptance-scenario
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 3 Relationship / Event Authority source is structurally accepted at gameplay executable `1a5c5540a0235fb2e53b2452516897af7664eba1`. The follow-up root-cause audit proved that the Story -> Extract -> typed canonical Relation/Event reducer boundary is connected and that the prior live acceptance scenario itself was non-probative: its two ordinary meeting-preparation Stories contained no qualifying explicit registered-participant relation/event evidence, so empty observations were correct fail-open behavior.

Do not patch runtime semantics to make a weak scenario pass. Correct the acceptance design and obtain bounded live evidence that the accepted canonical reducer persists a real ordinary relation/event observation when Story itself contains qualifying evidence.

## Binding topology / identity

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected base/state: `main`, OPEN / DRAFT / UNMERGED
Accepted gameplay executable: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Current TEST Worker identity from prior evidence: `6f0940d5-3145-4301-bcdf-61bdccc3cdac`; verify before relying on it.
PR #65/#66 remain closed superseded containers. No new branch/PR, merge, Ready, rebase, squash.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable: DO NOT ACCESS OR MUTATE IT.

## Goal

Close Cut 3 with one bounded, evidence-bearing TEST Golden Path that proves:

Story explicit registered-participant evidence -> normalized typed relation/event observation -> canonical reducer -> durable committed relation/event consequence -> recovery/replay parity and idempotence.

The scenario must test the real authority path, not manufacture the desired state.

## Required work

### A. Acceptance scenario design

Inspect the existing canary/live helpers and add or adjust only the minimum harness capability needed to express a deterministic/probative player situation. The player action may deliberately request a clear social action involving an already-present registered NPC, but player input remains intent/attempt and is NOT acceptance evidence by itself.

The run is probative only if the resulting Story itself contains an exact, visible, registered actor-target fact that qualifies under the existing relation/event observation contract. Examples of acceptable evidence classes include an explicit apology accepted/reconciliation/boundary change or another canonical relation/event type already supported by current source. Do not invent a new event taxonomy merely for the test.

Do not force provider output, inject Extract JSON, patch Story text after generation, write DB state directly, or retry until a desired output appears.

### B. Preflight

Before any TEST gameplay mutation:

1. verify PR #67 remains OPEN/DRAFT/UNMERGED and based on main;
2. verify current branch ancestry still contains accepted gameplay executable `1a5c5540...` and inspect any executable drift after it;
3. verify deployed TEST API identity/source corresponds to the accepted gameplay executable or STOP if identity cannot be proven;
4. run focused Relation/Event + Extract/Commit/replay tests and syntax/diff checks for any harness change;
5. verify the dedicated TEST game is the disposable test target and is not the preserved manual game.

If executable gameplay source has drifted beyond the accepted candidate, STOP for operator review rather than silently deploying a new candidate.

### C. One bounded live TEST run

Use the dedicated TEST game only. Setup/Opening normally if required, then perform a bounded acceptance interaction. No automatic retry/regeneration loop.

Capture immutable evidence for the acceptance turn:

- player action;
- raw Story and parsed blocks;
- exact Story quote(s) claimed as relation/event evidence;
- normalized Extract `relation_updates`, `events.general`, `events.sexual`;
- action status/error and committed turn id;
- post-save `active_relations`, `event_ledger`, `sexual_event_ledger` relevant entries;
- registered participant IDs;
- committed context/recovery result.

Acceptance requires at least one qualifying Story-backed ordinary Relation/Event typed observation and the corresponding canonical durable consequence. Empty observation is not failure of ordinary gameplay, but it is BLOCKED acceptance evidence for this task; do not retry for luck.

### D. Replay / idempotence

Using normal read/recovery/replay-safe paths only, prove the committed consequence does not duplicate on recovery/replay and that same-action idempotence remains intact. Do not manufacture a second commit.

### E. Cleanup

After evidence capture, reset only the dedicated disposable TEST game using the existing authorized reset path and verify clean baseline. Never reset or query the preserved manual game.

## Architecture invariants

- one canonical Relation/Event durable reducer/writer;
- Engine mandatory relation input wins same-turn conflict with observational Extract;
- unknown/unregistered participant => warning + no durable mutation;
- absent/uncertain optional observation => no-op; ordinary turn continues;
- player input alone cannot establish successful durable fact;
- exact Story evidence remains required for observational durability;
- no direct duplicate `active_relations`/event-ledger writer;
- Cut 2 scene/location/presence invariants unchanged.

## Operations authority

Authorized in this task: existing-branch harness/test changes if needed; local tests; read-only deployed identity verification; bounded gameplay through normal TEST APIs on the dedicated disposable TEST game; final reset of that dedicated TEST game.

Not authorized: gameplay runtime semantic patch; API/frontend deploy; migration/DDL; Production; preserved manual-game access; direct DB gameplay-state manufacture/repair; provider/model/temperature/token change; retry/regeneration loop; fuzzy inference; parser relaxation; semantic hard gate; new parser generation; new branch/PR; merge/Ready/rebase/squash; historical migration edits.

If a new runtime defect or deployment mismatch is discovered, STOP BLOCKED with exact evidence and do not patch/deploy inside this task.

## Validation

Run focused affected suites plus the current full suite if practical, relevant JS/MJS syntax checks, and `git diff --check`. Test count is regression evidence only; the live authority chain above is the acceptance proof.

## Completion report

Post one terminal report to Issue #68 with:

- STATUS COMPLETE/BLOCKED/FAILED;
- START_SHA / FINAL_SHA;
- exact accepted gameplay executable and verified deployed TEST identity;
- harness-only changes, if any;
- exact player action, Story evidence quote, normalized typed observation, durable post-save consequence, participant IDs;
- recovery/replay/idempotence proof;
- dedicated TEST reset result;
- focused/full/syntax/diff validation;
- explicit confirmation: no runtime semantic patch, deploy, migration, Production/manual-game access, retry/provider/model/fuzzy/parser relaxation/semantic gate/direct DB manufacture;
- PR #67 remains OPEN/DRAFT/UNMERGED;
- STOP for operator review.

Set CURRENT_TASK to WAITING_REVIEW in a separate docs-only commit after terminal evidence is ready.
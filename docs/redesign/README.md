# Company Full Redesign — Canon Index

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This directory is the proposed replacement authority for the failed v1/v2 design chain. It is intentionally product-first.

Read in order:

1. [`00_AUTHORITY_AND_CHANGE_CONTROL.md`](00_AUTHORITY_AND_CHANGE_CONTROL.md)
2. [`01_PRODUCT_CONSTITUTION.md`](01_PRODUCT_CONSTITUTION.md)
3. [`02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`](02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md)
4. [`03_GOLDEN_UI_CONTENT_MASTER.md`](03_GOLDEN_UI_CONTENT_MASTER.md)
5. [`04_GAMEPLAY_STATE_MEMORY_MODEL.md`](04_GAMEPLAY_STATE_MEMORY_MODEL.md)
6. [`05_ARCHITECTURE_DECISION_FRAMEWORK.md`](05_ARCHITECTURE_DECISION_FRAMEWORK.md)
7. [`07_CSA_MVP_CATALOG.md`](07_CSA_MVP_CATALOG.md)
8. [`06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md`](06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md)

`07_CSA_MVP_CATALOG.md` specializes the Product Constitution for `상식개변`: the initial active catalog is exactly 9 templates (weak 3 / medium 3 / strong 3), selected from measurable historical TEST play exposure. Historical non-MVP templates are `UNSELECTED_CANDIDATE`, not forward/deferred requirements, and may return only one at a time after explicit owner approval.

The old generic CSA subject/counterparty selector breadth is **not** automatically retained. Historical use is narrower, so final scope UI/semantics remain an explicit OPEN_DECISION before CSA implementation.

## Current status

These documents are drafts for owner review. They do not authorize implementation, deployment, DB mutation, or gameplay.

`docs/ops/CURRENT_TASK.md` on main remains `WAITING_OWNER_DECISION`.

After owner review:

1. resolve remaining OPEN_DECISION items;
2. explicitly accept product/scenario/golden/state authority and the nine-rule CSA MVP;
3. perform a bounded architecture-candidate audit;
4. create the target Gap Matrix;
5. only then register the first narrow implementation task.

## Current design review verdict

The product-first hierarchy is retained.

The redesign rejects both extremes:

- do not continue the existing v2 product layer merely because it exists;
- do not discard independently useful streaming/concurrency/persistence work merely to claim a clean slate.

Leading technical candidate: **kernel salvage only**. Audit product-neutral v2 transport/concurrency/persistence pieces, then rewrite Company product/domain/UI around accepted canon. Hospital remains donor/reference. A completely new kernel remains allowed if the bounded audit shows v2 cannot be hidden behind a small, understandable interface.

Story contract should prefer natural player-visible narrative + a small post-Story observer instead of requiring the Story model to be both novelist and fragile semantic-protocol compiler.

## Remaining owner decisions before architecture lock

The major unresolved product questions are now deliberately small:

1. choice suggestions: none vs optional four;
2. generic physical continuity representation: bounded scene snapshot vs minimal extra structure;
3. player sexual meter: retain or remove from core;
4. exact per-template CSA subject/counterparty scope controls for the nine-rule MVP.

None of these may be silently decided by implementation.

The technical recommendation remains non-binding until owner architecture review.

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

`07_CSA_MVP_CATALOG.md` is a product/content specialization of the Product Constitution: the initial active `상식개변` catalog is exactly 9 templates (weak 3 / medium 3 / strong 3). Historical non-MVP templates are not forward product authority.

## Current status

These documents are drafts for owner review. They do not authorize implementation, deployment, DB mutation, or gameplay.

`docs/ops/CURRENT_TASK.md` on main remains `WAITING_OWNER_DECISION`.

After owner review:

1. correct these drafts;
2. explicitly accept product/scenario/golden/state authority and the 9-rule CSA MVP;
3. perform a bounded architecture-candidate audit;
4. create the target Gap Matrix;
5. only then register the first narrow implementation task.

## Provisional technical recommendation

Do not continue the current v2 product layer.

The leading candidate remains to salvage only independently useful v2 transport/concurrency/persistence kernel pieces while rewriting the Company product/domain/UI layer from this canon. Hospital remains donor/reference. A totally new kernel remains allowed if the v2 kernel fails the simplicity audit.

This recommendation is not binding until owner architecture review.

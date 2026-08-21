# Company Full Redesign — Canon Index

Status: OWNER-REVIEW DRAFT / PRODUCT DECISIONS LOCKED  
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

## Locked product decisions

The four previously open questions are resolved by owner decision on 2026-08-21:

1. **Choices** — keep free-form input and exactly four Story-authored natural choices each ordinary turn. The same post-Story Extract/observer structures the four literal choices for UI; no separate choice LLM.
2. **Physical continuity** — start with one bounded replaceable `scene_note` plus structured location/present actors. No parallel generic physical ontology.
3. **Player sexual gauge** — remove dynamic arousal/erection/ejaculation gameplay state and its supporting event ledger. Static adult profile/setup facts remain separate.
4. **CSA scope** — keep the 9-rule MVP but allow flexible supported subject/counterparty scope through one shared finite vocabulary rather than hard-fixing each rule to one historical pairing. Scope flexibility is not a generic execution DSL; if this proves materially too complex, return evidence to owner before narrowing.

## `상식개변` MVP

`07_CSA_MVP_CATALOG.md` specializes the Product Constitution for `상식개변`:

- weak: 3
- medium: 3
- strong: 3
- total active templates: exactly 9

The nine were selected from measurable historical TEST play exposure. Historical non-MVP templates are `UNSELECTED_CANDIDATE`, not forward/deferred requirements, and may return only one at a time after explicit owner approval and real-play validation.

## Current status

These documents remain drafts for owner review. They do not authorize implementation, deployment, DB mutation, or gameplay.

`docs/ops/CURRENT_TASK.md` on main remains `WAITING_OWNER_DECISION`.

The product decisions are now sufficiently closed to move next to a **bounded architecture audit**, not source implementation.

Next sequence:

1. owner reviews/accepts this product-first authority set;
2. compare Candidate A/B/C against the locked requirements;
3. select exact architecture and write the architecture decision/gap matrix;
4. only then register the first narrow implementation task.

## Current technical recommendation

The redesign rejects both extremes:

- do not continue existing v2 product layer merely because it exists;
- do not discard independently useful streaming/concurrency/persistence work merely to claim a clean slate.

Leading candidate remains **kernel salvage only**: audit product-neutral v2 transport/concurrency/persistence pieces, then rewrite Company product/domain/UI around accepted canon. Hospital remains donor/reference, especially for the natural Story + four-choice play feel. A completely new kernel remains allowed if v2 cannot be hidden behind a small, understandable interface.

Story contract should prefer natural player-visible narrative + four natural Story choices + one small post-Story observer instead of forcing the Story model to be both novelist and fragile semantic-protocol compiler.

The remaining major unresolved decision is now **architecture selection itself**, not product behavior.

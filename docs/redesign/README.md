# Company Full Redesign — Canon Index

Status: SOURCE-AUDITED / OWNER DECISION PENDING
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
8. [`08_COMPANY_V1_SALVAGE_MATRIX.md`](08_COMPANY_V1_SALVAGE_MATRIX.md)
9. [`06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md`](06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md)
10. [`09_RUNTIME_KERNEL_SOURCE_AUDIT.md`](09_RUNTIME_KERNEL_SOURCE_AUDIT.md)

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

## Company v1 salvage is a separate architecture axis

Candidate A/B/C describe **runtime kernel choices only**. They do not mean the Company v1 product/UI is rebuilt from scratch.

`08_COMPANY_V1_SALVAGE_MATRIX.md` records the source audit of the complete Company v1 snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`.

Current leading product composition is:

```text
Company v1 complete presentation shell ----- high-parity transplant
Company v1 canonical content --------------- keep
Company v1 render/map/setup components ----- keep / light rewire
Company v1 CSA modal presentation ---------- transplant, semantics rebuild
Company v1 TTS/history/media UI ------------ defer-keep
new thin frontend controller --------------- rebuild
new minimal view-model/state/domain -------- rebuild
selected runtime kernel -------------------- choose A / B / C separately
```

The reduced `frontend-v2/` shell is not the forward UI target.

Most of the visible Company v1 UI should remain recognizably the same. Runtime replacement should primarily change **wiring and authority**, not throw away completed presentation work.

## Current status

These documents remain drafts for owner review. They do not authorize implementation, deployment, DB mutation, or gameplay.

`docs/ops/CURRENT_TASK.md` on main remains `WAITING_OWNER_DECISION`.

The product decisions are sufficiently closed to move next to a **bounded architecture + salvage audit**, not source implementation.

Next sequence:

1. owner reviews/accepts this product-first authority set;
2. audit Candidate A/B/C as kernel alternatives (recorded in `09_RUNTIME_KERNEL_SOURCE_AUDIT.md`);
3. finalize the Company v1 file/module salvage matrix;
4. select the exact composed architecture and write the target Gap Matrix;
5. only then register the first narrow implementation task.

## Current technical recommendation

The redesign rejects both extremes:

- do not continue the existing v2 product layer merely because it exists;
- do not discard independently useful streaming/concurrency/persistence work merely to claim a clean slate.

The leading composition is **Company v1 high-parity UI/content salvage + new minimal Company domain + a separately selected runtime kernel**. Candidate A remains a strong kernel possibility because it may preserve hard-earned server-owned streaming/concurrency work, but A is not the product/UI plan.

Hospital remains a donor/reference, especially for natural Story + four-choice play feel. A completely new kernel remains allowed if v2 cannot be hidden behind a small understandable interface.

Story should use natural player-visible narrative + four natural Story choices + one small post-Story observer rather than forcing the Story model to be both novelist and fragile semantic-protocol compiler.

The remaining major unresolved decision is the **kernel architecture selection and exact salvage boundary**, not product behavior.

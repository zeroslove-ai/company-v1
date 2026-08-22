# Company Redesign — Authority & Change Control

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21  
Branch: `company-redesign/product-first-canon-v1`

## 1. Purpose

The previous process failed because product truth, architecture truth, task instructions, implementation details, and late Issue comments could supersede one another.

This redesign uses a strict hierarchy. Lower layers implement higher layers; they do not reinterpret or weaken them.

## 2. Authority hierarchy

### L0 — Product Constitution

File: `01_PRODUCT_CONSTITUTION.md`

Defines what the game is, what experience must survive a rewrite, explicit removals, and owner-locked product laws.

Only an explicit owner product decision may change L0.

### L1 — Executable Acceptance Scenarios

File: `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`

Defines observable player scenarios that prove L0 is actually present. A feature is not accepted because unit tests or schemas exist; relevant L1 scenarios must pass.

### L2 — Golden UI / Content Master

File: `03_GOLDEN_UI_CONTENT_MASTER.md`

Defines canonical semantic catalogs and approved presentation surfaces while allowing layout redesign.

### L3 — Gameplay / State / Memory Model

File: `04_GAMEPLAY_STATE_MEMORY_MODEL.md`

Defines durable truth, narrative truth, derived presentation, and optional mechanics. L3 may not invent new product requirements.

### L4 — Architecture Decision

File: `05_ARCHITECTURE_DECISION_FRAMEWORK.md`

Chooses how to implement L0–L3. Existing v1, v2, and Hospital assets are candidates only.

### L4-S — Specialized accepted product catalogs

A specialized catalog may narrow a product domain only when L0 explicitly delegates it.

Current specialized draft:

- `07_CSA_MVP_CATALOG.md` — initial active `상식개변` catalog, exactly 9 templates (weak 3 / medium 3 / strong 3).

Historical CSA templates outside those nine are `UNSELECTED_CANDIDATE`, not implicit future requirements.

### L5 — Gap Matrix / Implementation Plan

Created only after L0–L4 owner acceptance.

Maps current assets to target architecture as KEEP / REWIRE / REBUILD / DELETE / DEFER.

### L6 — CURRENT_TASK

`docs/ops/CURRENT_TASK.md` is execution authority only.

It may specify exact branch/SHA/scope/tests/deploy boundaries. It MUST NOT:

- change a product decision;
- supersede L0–L4;
- remove a required scenario/product surface;
- convert an OPEN decision into an implementation assumption;
- treat current code/tests as product authority;
- reinterpret owner acceptance;
- bulk-restore an unselected historical catalog.

Every implementation task cites exact requirement/scenario IDs.

## 3. Decision status vocabulary

### OWNER_LOCKED

Explicit current product decision. Implementation cannot change it.

### RETAIN_BY_DEFAULT

Established behavior/surface retained unless owner deliberately redesigns it.

### OPEN_DECISION

Not fixed yet. Architecture/implementation may not choose and normalize an answer through tests before owner review.

### REMOVED_BY_OWNER_DECISION

Deliberately excluded. Historical existence does not create a future requirement.

### UNSELECTED_CANDIDATE

Historical/product candidate intentionally outside the active product. It is not a deferred implementation requirement.

Historical non-MVP CSA rules use this status.

## 4. Current owner-locked redesign decisions — 2026-08-21

The following previously-open product decisions are now closed and must be treated as architecture inputs:

1. **Choices** — ordinary turns keep free-form input and also provide exactly four natural choices authored by the same Story LLM; post-Story Extract/observer structures those literal choices for UI. No separate choice LLM. Extract failure does not invalidate Story and never falls back to prior-turn choices.
2. **Immediate physical continuity** — start with one bounded replaceable natural-language `scene_note` plus separately structured location/present actors. Do not retain a generic posture/contact ontology in parallel. If real play proves this insufficient, return the concrete failing case before adding structure.
3. **Dynamic player sexual gauge** — remove arousal/erection/ejaculation progress/count and supporting sexual-event-ledger gameplay state from the redesign. Static adult setup/profile facts are unaffected.
4. **CSA scope** — the 9-rule MVP should support flexible subject/counterparty scope through a small shared canonical scope vocabulary rather than hard-fixing each template to one historical pairing. Scope flexibility is data only; it does not authorize a generic CSA execution/consent/relationship DSL. If this proves materially too complex, return evidence to owner before narrowing.

No implementation task may silently reopen these four decisions.

## 5. Evidence ranking

When recovering prior requirements:

1. explicit current owner redesign decisions;
2. accepted L0–L4 redesign documents and specialized accepted catalogs;
3. current accepted repository semantic content facts;
4. prior product contracts/completed UI snapshots as historical product evidence;
5. preserved live/manual DB evidence;
6. current v1/v2 code/tests as implementation evidence only;
7. old Issue comments/tasks as audit history only.

A later task comment never outranks accepted product authority.

## 6. Change protocol

Any L0–L3 change requires:

1. explicit proposal with affected requirement ID;
2. reason and affected acceptance scenarios;
3. owner acceptance;
4. document update first;
5. only then implementation task registration.

No code-first product decision.

A specialized CSA catalog change also requires explicit owner selection of the added/removed rule and scenario coverage. Bulk historical reimport is prohibited.

## 7. Loop safety model

Automation is not authorized merely because a task says READY.

Future execution requires both:

```text
LOOP_CONTROL.enabled = true
AND
CURRENT_TASK.Status = READY
```

`LOOP_CONTROL` carries a monotonically increasing generation. A worker snapshots the generation at lease acquisition and rechecks it before every mutation boundary: commit, PR mutation, merge, migration/DB write, deploy, game creation/reset, and live gameplay.

If generation changed or enabled=false, the lease stops without further mutation.

Until such a mechanism exists, the loop remains manually disabled.

## 8. Review gates

No implementation starts until:

- L0 Product Constitution accepted;
- L1 acceptance scenarios accepted;
- L2 Golden Master accepted;
- L3 gameplay/state/memory model accepted;
- L4 architecture choice accepted;
- current specialized product catalogs, including the 9-rule CSA MVP, are accepted.

Passing CI is necessary but never sufficient for product acceptance.

## 9. Current redesign stop state

All prior Company v1/v2 implementation and candidate product-canon work is historical evidence during this review.

No runtime/frontend/SQL/DB/deploy/gameplay action is authorized by these draft documents.

# Company Redesign — Authority & Change Control

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21  
Branch: `company-redesign/product-first-canon-v1`

## 1. Purpose

The redesign failed previously because product truth, architecture truth, task instructions, implementation details, and late Issue comments could all supersede one another.

This document defines a strict authority hierarchy. Lower layers may implement higher layers. They may not reinterpret or weaken them.

## 2. Authority hierarchy

### L0 — Product Constitution

File: `01_PRODUCT_CONSTITUTION.md`

Defines what the game is, what experience must survive any rewrite, explicit removals, and owner-locked product laws.

Only an explicit owner product decision may change L0.

### L1 — Executable Acceptance Scenarios

File: `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`

Defines observable player scenarios that prove L0 is actually present in the product.

A feature is not considered implemented merely because unit tests or schemas exist. Relevant L1 scenarios must pass.

### L2 — Golden UI / Content Master

File: `03_GOLDEN_UI_CONTENT_MASTER.md`

Defines canonical semantic catalogs and approved presentation surfaces. It distinguishes content identity from UI layout so redesign remains possible without losing the product.

### L3 — Gameplay / State / Memory Model

File: `04_GAMEPLAY_STATE_MEMORY_MODEL.md`

Defines what is durable truth, narrative truth, derived presentation, and optional mechanics.

L3 may not invent new product requirements.

### L4 — Architecture Decision Record

File: `05_ARCHITECTURE_DECISION_FRAMEWORK.md`

Chooses how to implement L0–L3. Existing v1, v2, and Hospital assets are candidates only. No architecture receives authority merely because code already exists.

### L5 — Gap Matrix / Implementation Plan

Created only after L0–L4 owner acceptance.

Maps current assets to target architecture as KEEP / REWIRE / REBUILD / DELETE / DEFER.

### L6 — CURRENT_TASK

`docs/ops/CURRENT_TASK.md` is execution authority only.

It may specify exact branch/SHA/scope/tests/deploy boundaries. It MUST NOT:

- change a product decision;
- supersede L0–L4;
- remove a required scenario or product surface;
- convert an OPEN product decision into an implementation assumption;
- treat current code/tests as product authority;
- reinterpret owner acceptance.

Every implementation task must cite exact requirement/scenario IDs it implements.

Example:

```text
Implements: P-AGENCY-001, P-STORY-001
Acceptance: A-TURN-001, A-STREAM-001
Golden: G-CONTENT-CHARACTERS, G-UI-STORY
No product decision changes authorized.
```

## 3. Decision status vocabulary

Every redesign requirement uses one of three statuses.

### OWNER_LOCKED

Directly supported by explicit owner decision or indispensable product identity. Implementation may not change it.

### RETAIN_BY_DEFAULT

Established product behavior that should remain unless owner deliberately removes/redesigns it. A task cannot silently drop it for convenience.

### OPEN_DECISION

Not yet fixed. Architecture and implementation must not choose one interpretation and normalize it through tests before owner review.

## 4. Evidence ranking

When recovering prior requirements:

1. explicit current owner redesign decisions;
2. accepted L0–L4 redesign documents;
3. current authoritative `content/*.json` for semantic content facts;
4. prior product contracts and completed UI snapshots as historical product evidence;
5. preserved live/manual DB evidence;
6. current v1/v2 code and tests as implementation evidence only;
7. old Issue comments/tasks as audit history only.

A later task comment does not outrank accepted product authority.

## 5. Change protocol

Any change to L0–L3 requires:

1. explicit proposal with old requirement ID and new requirement;
2. reason and affected acceptance scenarios;
3. owner acceptance;
4. document update first;
5. only then implementation task registration.

No code-first product decision is permitted.

## 6. Loop safety model

Automation is not authorized merely because a task says READY.

Future automated execution must require both:

```text
LOOP_CONTROL.enabled = true
AND
CURRENT_TASK.Status = READY
```

`LOOP_CONTROL` should carry a monotonically increasing generation. A worker snapshots the generation at lease acquisition and rechecks it before every mutation boundary: commit, PR mutation, merge, migration/DB write, deploy, game creation/reset, and live gameplay.

If generation changed or enabled=false, the lease must terminalize without further mutation.

Until such a mechanism exists, the loop remains manually disabled.

## 7. Review gates

No implementation starts until:

- L0 Product Constitution accepted;
- L1 acceptance scenarios accepted;
- L2 Golden Master accepted;
- L3 gameplay/state/memory model accepted;
- L4 architecture choice accepted.

Passing CI is necessary but never sufficient for product acceptance.

## 8. Current redesign stop state

All prior Company v1/v2 implementation and candidate product-canon work is historical evidence during this review.

No runtime/frontend/SQL/DB/deploy/gameplay action is authorized by these draft documents.

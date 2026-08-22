# Company Redesign — Design Review & Implementation Gates

Status: OWNER-REVIEW DRAFT / PRODUCT DECISIONS LOCKED  
Date: 2026-08-21

The previous process accumulated engineering before checking whether the build was still the intended game. This document reverses that order.

## 1. Gate 0 — Product authority review

Owner reviews:

- `00_AUTHORITY_AND_CHANGE_CONTROL.md`
- `01_PRODUCT_CONSTITUTION.md`
- `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`
- `03_GOLDEN_UI_CONTENT_MASTER.md`
- `04_GAMEPLAY_STATE_MEMORY_MODEL.md`
- `05_ARCHITECTURE_DECISION_FRAMEWORK.md`
- `07_CSA_MVP_CATALOG.md`
- `08_COMPANY_V1_SALVAGE_MATRIX.md`

The locked product decisions include:

- four Story-authored choices + free input;
- one `scene_note` initial physical-continuity model;
- dynamic player sexual gauge removed;
- flexible supported CSA subject/counterparty scope;
- complete Company v1 presentation is the primary high-parity UI donor, not the reduced `frontend-v2` shell.

No code task may reopen or silently reinterpret these decisions.

## 2. Gate 1 — Composed architecture selection

Gate 1 has **two independent audit outputs**.

### 2.1 Kernel audit

Compare Candidate A/B/C as runtime-kernel alternatives only.

Required:

- exact kernel modules/assets KEEP/REPLACE;
- one-turn sequence including Story-authored choices + Extract projection;
- failure/reconnect sequence;
- mutable DB authority;
- proof retained kernel contains no demo/product semantic authority or removed player-meter baggage;
- proof flexible CSA scope can be represented simply, or exact blocker/cost returned to owner.

### 2.2 Company v1 salvage audit

Finalize `08_COMPANY_V1_SALVAGE_MATRIX.md` file-by-file/module-by-module using:

- `KEEP`
- `TRANSPLANT`
- `REWIRE`
- `REBUILD`
- `DELETE`
- `DEFER_KEEP`

At minimum prove treatment for:

- `index.html` + responsive CSS shell;
- `render.js`;
- `setup.js`;
- `company-map.js/css`;
- Mind Monitor presentation;
- `view-model.js`;
- `app.js` and its old `createTurnCoordinator()`;
- `api.js` / `sse.js`;
- `csa-app.js` / `csa-app-state.js`;
- TTS/history/feedback/image UI;
- canonical `content/*.json`.

Owner selects the **composed architecture** before implementation:

```text
selected kernel + accepted Company v1 salvage boundary
```

A kernel choice cannot justify replacing the completed Company v1 presentation with a reduced shell.

## 3. Gate 2 — Milestone 0: recognizably the right game in the salvaged UI

Required:

- Company v1 Story/action/MM/setup presentation transplanted at high parity;
- canonical Setup/profile;
- canonical Company content;
- correct Opening;
- one ordinary Story turn;
- Story-authored four current-turn choices projected by Extract;
- free-form action always available;
- one `scene_note` continuity skeleton;
- committed refresh/readback;
- visible streaming;
- no dynamic sexual gauge in state/UI/prompt/observer.

Not required yet: active CSA mutation, Image/TTS, feedback, full memory compaction.

Acceptance order:

1. product-contract tests;
2. structural tests for changed spine;
3. desktop/mobile screenshot comparison against `5ec1a76...`;
4. TEST deploy;
5. owner Opening review immediately;
6. owner 3–5 turn play including UI parity, choice quality/extraction and scene_note continuity;
7. only if accepted, proceed.

Do not spend a milestone rebuilding presentation already available in Company v1.

## 4. Gate 3 — Core continuity

Add/verify location/presence, `scene_note` continuity, grounded older memory, multi-character conversation, refresh/reconnect, relevant Mind Monitor.

Owner performs 10–20 turn play focused on scene/conversation/memory quality.

If one scene_note demonstrably fails an acceptance scenario, stop and propose the smallest extra structure. Do not revive a generic physical ontology by default.

## 5. Gate 4 — `상식개변` nine-rule MVP

Reuse/transplant the Company v1 app presentation where practical, but replace old CSA semantics/submission flow.

Implement exactly:

- 3 weak + 3 medium + 3 strong templates;
- one shared finite scope vocabulary;
- flexible supported subject scope;
- optional counterparty scope only where meaningful;
- dedicated app apply/change/remove transaction;
- durable rule lifecycle + selected scope;
- non-turn application;
- four-slot clothing only where retained rules require it;
- no historical non-MVP activation path;
- no generic action/execution DSL for hypothetical future rules.

Owner tests all nine in real narrative play with multiple scope combinations, application/removal, and clothing continuity.

If flexible scope is materially too complex or semantically incoherent for a retained rule, Gate 4 stops and returns exact evidence/cost to owner. It may not silently hard-fix scope.

**A tenth rule is forbidden until the nine-rule MVP is accepted.** Future rules enter one at a time with new owner decision and acceptance scenario.

## 6. Gate 5 — Secondary mechanics

Only after core product + nine-rule CSA acceptance:

- feedback revision using salvaged Company v1 presentation;
- image using salvaged media surface;
- TTS using salvaged TTS UX/controller pieces where compatible;
- history/export polish;
- remaining UI/tooling.

The removed dynamic player sexual gauge is not a deferred secondary feature. Reintroducing it requires a new owner product decision.

## 7. Test portfolio

### Product tests

Assert canonical characters/map/Setup/Opening/UI, high-parity Company v1 surface inventory, four Story-authored choices, free input, scene_note model, removed player gauge, exact nine CSA IDs, and flexible supported scope.

### Structural tests

Concurrency, transaction, fencing, memory/readback, reducers. Never normalize a demo product through tests.

### Provider tests

Prove literal action unchanged, relevant actor canon/location/accepted active rules + selected scopes present, continuity within budget, exactly four Story-authored choices recoverable in normal cases, and forbidden generic semantic taxonomies absent.

### Visual review

Desktop/mobile screenshots + Golden/Salvage checklist against `5ec1a76...`. DOM existence alone is insufficient.

### Manual acceptance

Owner acceptance is release gate. Failure means PRODUCT_REJECTED/CHANGES_REQUIRED regardless of CI.

## 8. Merge rules

Player-facing PR merges only when requirement/scenario IDs are listed, relevant product + structural tests pass, required artifact exists, salvage/parity differences are explicit, and owner gate is satisfied.

## 9. Main branch protection recommendation

Before automation restarts:

- no direct runtime/product push to `main`;
- PR required;
- CI required;
- owner review for Product Constitution/Golden/Salvage changes;
- product acceptance check/label where practical.

Docs-only emergency STOP/current-truth corrections may use a narrow documented owner path.

## 10. Automation restart requirements

Do not restart old watcher unchanged.

Future loop requires `LOOP_CONTROL.enabled`, generation fencing, CURRENT_TASK READY, authority/supersession recheck at each mutation boundary, terminal stop states, and owner supersession checks before mutations.

## 11. What counts as progress

1. owner recognizes the **same intended Company product UI** at Opening;
2. 5 turns feel like correct Company game with natural choices + free input;
3. 20 turns preserve continuity through scene_note + memory;
4. exact nine-rule `상식개변` MVP works with flexible scope without distorting agency;
5. secondary systems attach without destabilizing Story;
6. only then rules expand one by one.
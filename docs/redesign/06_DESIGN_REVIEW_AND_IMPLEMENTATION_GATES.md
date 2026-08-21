# Company Redesign — Design Review & Implementation Gates

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

The previous process accumulated engineering before checking whether the build was still the intended game. This document reverses that order.

## 1. Gate 0 — Product authority review

Before architecture or implementation is accepted, owner reviews:

- `00_AUTHORITY_AND_CHANGE_CONTROL.md`
- `01_PRODUCT_CONSTITUTION.md`
- `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`
- `03_GOLDEN_UI_CONTENT_MASTER.md`
- `04_GAMEPLAY_STATE_MEMORY_MODEL.md`
- `05_ARCHITECTURE_DECISION_FRAMEWORK.md`
- `07_CSA_MVP_CATALOG.md`

Every OPEN_DECISION is explicitly decided, explicitly deferred with no implementation assumption, or removed. No code task may silently decide one.

## 2. Gate 1 — Architecture selection

Perform bounded source audit comparing Candidate A/B/C.

Required output:

- exact modules/assets KEEP;
- exact modules/assets REPLACE;
- one-turn sequence diagram;
- failure/reconnect sequence;
- mutable DB authority;
- conceptual surface estimate;
- proof retained kernel contains no product/demo semantic authority.

Owner selects architecture before implementation.

## 3. Gate 2 — Milestone 0: recognizably the right game

Required:

- canonical Setup/profile;
- canonical Company content;
- correct Opening;
- actual Company Story/action/Mind Monitor presentation;
- one ordinary free-form Story turn;
- committed refresh/readback;
- visible streaming.

Not required yet: CSA mutation, secondary clothing mechanics beyond chosen state skeleton, Image/TTS, feedback, player meter, full memory compaction.

Acceptance order:

1. product-contract tests;
2. structural tests for changed spine;
3. TEST deploy;
4. owner Opening review immediately;
5. owner 3–5 turn play;
6. only if accepted, proceed.

## 4. Gate 3 — Core continuity

Add/verify location/presence, current-scene continuity, grounded older memory, multi-character conversation, refresh/reconnect, relevant Mind Monitor.

Owner performs 10–20 turn play focused on scene/conversation/memory quality.

## 5. Gate 4 — `상식개변` nine-rule MVP

Before coding Gate 4, resolve CSA scope OPEN_DECISION from `07_CSA_MVP_CATALOG.md`:

- fixed affected group per retained template;
- which request-triggered templates need counterparty selector;
- exact allowed counterparty values exposed in UI/API.

Do not default to historical every-group × every-group selector matrix.

Then implement exactly:

- 3 weak + 3 medium + 3 strong templates;
- app apply/change/remove transaction;
- rule lifecycle and exact accepted scope;
- non-turn application;
- four-slot clothing only where retained rules require it;
- no historical non-MVP activation path;
- no generic DSL for hypothetical future rules.

Owner tests all nine in real narrative play, including application/removal and representative scope behavior.

**A tenth rule is forbidden until the nine-rule MVP is accepted.** Future rules enter one at a time with new owner decision and acceptance scenario.

## 6. Gate 5 — Secondary mechanics

Only after core product + nine-rule CSA acceptance:

- feedback revision;
- player meter if retained;
- image;
- TTS;
- history/export polish;
- remaining UI/tooling.

## 7. Test portfolio

### Product tests

Assert canonical characters/map/Setup/Opening/UI, removed features, exact nine CSA IDs, and no unaccepted scope combinations.

### Structural tests

Concurrency, transaction, fencing, memory/readback, reducers. Never normalize a demo product through tests.

### Provider tests

Prove literal action unchanged, relevant actor canon/location/accepted active rules present, continuity within budget, and forbidden generic semantic taxonomies absent.

### Visual review

Screenshots/mobile captures + Golden checklist. DOM existence alone is insufficient.

### Manual acceptance

Owner acceptance is release gate. Failure means PRODUCT_REJECTED/CHANGES_REQUIRED regardless of CI.

## 8. Merge rules

Player-facing PR merges only when requirement/scenario IDs are listed, relevant product + structural tests pass, required artifact exists, and owner gate is satisfied.

## 9. Main branch protection recommendation

Before automation restarts:

- no direct runtime/product push to `main`;
- PR required;
- CI required;
- owner review for Product Constitution/Golden changes;
- product acceptance check/label where practical.

Docs-only emergency STOP/current-truth corrections may use a narrow documented owner path.

## 10. Automation restart requirements

Do not restart old watcher unchanged.

Future loop requires `LOOP_CONTROL.enabled`, generation fencing, CURRENT_TASK READY, authority/supersession recheck at each mutation boundary, terminal stop states, and owner supersession checks before mutations.

## 11. What counts as progress

1. owner recognizes correct product at Opening;
2. 5 turns feel like correct Company game;
3. 20 turns preserve continuity;
4. exact nine-rule `상식개변` MVP works without distorting agency;
5. secondary systems attach without destabilizing Story;
6. only then rules expand one by one.

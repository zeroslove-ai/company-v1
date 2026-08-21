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

Perform a bounded source audit comparing Candidate A/B/C from the architecture framework.

Required output:

- exact modules/assets proposed KEEP;
- exact modules/assets proposed REPLACE;
- one-turn sequence diagram;
- failure/reconnect sequence;
- mutable DB authority;
- estimated conceptual surface, not just file count;
- proof retained kernel contains no product/demo semantic authority.

Owner selects architecture before implementation begins.

## 3. Gate 2 — Milestone 0: recognizably the right game

Required:

- canonical player Setup/profile;
- canonical Company content projection;
- correct Opening;
- actual Company Story/action/Mind Monitor presentation;
- one ordinary free-form Story turn;
- committed refresh/readback;
- visible streaming.

Not required yet:

- CSA mutation;
- clothing mechanics beyond what chosen state skeleton needs;
- Image/TTS;
- feedback revision;
- player meter;
- full memory compaction.

Acceptance order:

1. focused product-contract tests;
2. structural unit tests for changed spine;
3. TEST deploy;
4. owner Opening review immediately;
5. owner 3–5 turn play;
6. only if accepted, proceed.

Do not close every secondary runtime edge before the owner can see the product.

## 4. Gate 3 — Core continuity

Add/verify:

- location/presence;
- current-scene continuity solution;
- grounded older memory;
- multi-character conversation;
- refresh/reconnect;
- relevant Mind Monitor.

Owner performs 10–20 turn play focused on scene/conversation/memory quality.

## 5. Gate 4 — `상식개변` nine-rule MVP

Only after core Story continuity feels correct, implement the accepted CSA MVP from `07_CSA_MVP_CATALOG.md`.

Hard scope:

- exactly 3 weak + 3 medium + 3 strong templates;
- app apply/change/remove transaction;
- rule lifecycle and exact scope;
- non-turn application;
- four-slot clothing support only where retained MVP rules require it;
- no historical non-MVP rule activation path;
- no generic DSL built for hypothetical future rules.

Owner tests all nine inside real narrative play, including application/removal and representative scope behavior.

**A tenth rule is forbidden until the nine-rule MVP is accepted.** After acceptance, add future rules one at a time with a new owner decision and acceptance scenario before considering the next rule.

## 6. Gate 5 — Secondary mechanics

Only after core product and the nine-rule CSA MVP are accepted:

- feedback revision;
- player meter if retained;
- image;
- TTS;
- history/export polish;
- remaining UI/tooling.

## 7. Test portfolio rules

### Product tests

Must assert source-of-truth identity and visible requirements, including:

- exact canonical character IDs/names/counts;
- map IDs/count;
- Setup owner-accepted fields;
- Opening premise/canon;
- no demo identities;
- accepted UI surfaces;
- removed features absent;
- active CSA catalog is exactly the accepted nine template IDs.

### Structural tests

Test concurrency, transaction, fencing, memory/readback and reducers. Structural tests may not hard-code a wrong demo product and legitimize it.

### Provider contract tests

At least prove:

- literal action appears unchanged;
- relevant actor canon is present;
- current location description is present;
- only relevant active rule premises are present;
- recent raw continuity + older grounded memory fit budget;
- forbidden generic success/relationship/consent taxonomies are absent.

### Visual review

Major UI changes require screenshots/mobile captures and the Golden surface checklist. DOM existence alone is insufficient.

### Manual acceptance

Owner acceptance is a release gate. A failed owner scenario produces PRODUCT_REJECTED/CHANGES_REQUIRED regardless of CI.

## 8. Merge rules

A player-facing PR may merge only when:

- exact requirement/scenario IDs are listed;
- relevant product tests pass;
- structural tests pass;
- required deployed/review artifact exists;
- owner gate for that milestone is satisfied.

Early Milestone 0 source may be reviewed before deploy, but phase progression requires deployed owner acceptance.

## 9. Main branch protection recommendation

Before automation restarts:

- no direct runtime/product push to `main`;
- PR required;
- CI required;
- owner review required for Product Constitution/Golden Master changes;
- product acceptance check/label where practical.

Docs-only emergency STOP/current-truth corrections may use a narrow documented owner path.

## 10. Automation restart requirements

Do not restart the old watcher unchanged.

Future loop requires:

- explicit `LOOP_CONTROL.enabled`;
- generation fencing;
- CURRENT_TASK READY;
- authority/supersession recheck at each mutation boundary;
- stop states treated as terminal;
- owner supersession checked before commit/PR/merge/deploy/DB/game operations.

## 11. What counts as progress

Progress milestones are:

1. owner recognizes the correct product at Opening;
2. 5 turns feel like the correct Company game;
3. 20 turns preserve continuity;
4. the exact 9-rule `상식개변` MVP works without distorting narrative agency;
5. secondary systems attach without destabilizing Story;
6. only then, rules may expand one by one.

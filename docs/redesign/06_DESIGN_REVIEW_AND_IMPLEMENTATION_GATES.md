# Company Redesign — Design Review & Implementation Gates

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

The previous process allowed large amounts of correct-looking engineering to accumulate before checking whether the build was still the intended game. This document reverses that order.

## 1. Gate 0 — Product authority review

Before architecture or implementation is accepted, owner reviews:

- `00_AUTHORITY_AND_CHANGE_CONTROL.md`
- `01_PRODUCT_CONSTITUTION.md`
- `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`
- `03_GOLDEN_UI_CONTENT_MASTER.md`
- `04_GAMEPLAY_STATE_MEMORY_MODEL.md`
- `05_ARCHITECTURE_DECISION_FRAMEWORK.md`

Every OPEN_DECISION is either:

- explicitly decided;
- explicitly deferred with no implementation assumption;
- removed by owner decision.

No code task may silently decide an open product question.

## 2. Gate 1 — Architecture selection

Perform a short source audit comparing Candidate A/B/C from the architecture framework.

Required output:

- exact modules/assets proposed KEEP;
- exact modules/assets proposed REPLACE;
- one-turn sequence diagram;
- failure/reconnect sequence;
- mutable DB authority;
- estimated conceptual surface, not just file count;
- proof that retained kernel contains no product/demo semantic authority.

Owner selects architecture before source implementation begins.

## 3. Gate 2 — Milestone 0: recognizably the right game

The first implementation milestone intentionally does less infrastructure work than previous v2 rounds.

Required:

- canonical player Setup/profile path;
- canonical Company content projection;
- correct Opening;
- actual Company Story/action/Mind Monitor presentation;
- one ordinary free-form Story turn;
- committed refresh/readback;
- streaming visible.

Not required yet unless chosen architecture structurally needs them:

- CSA mutation;
- clothing;
- image/TTS;
- feedback revision;
- player sexual meter;
- long-term memory compaction beyond enough scaffolding to avoid redesign dead-end.

### Milestone 0 acceptance order

1. focused product-contract tests;
2. structural unit tests for changed spine;
3. TEST deploy;
4. **owner Opening review immediately**;
5. owner 3–5 turn play;
6. only if accepted, proceed.

Do not spend days closing every secondary runtime edge before the owner can see whether the product is correct.

## 4. Gate 3 — Core continuity

Add/verify:

- location/presence;
- current-scene continuity solution;
- grounded older memory;
- multi-character conversation;
- refresh/reconnect;
- relevant Mind Monitor.

Owner performs 10–20 turn play focused on `A-SCENE-*`, `A-CONVERSATION-001`, `A-MEMORY-001`.

## 5. Gate 4 — `상식개변` mechanic

Only after core Story continuity feels correct:

- app mutation transaction;
- rule lifecycle;
- exact scope;
- non-turn application;
- four-slot clothing if retained.

Owner tests rule apply/change/remove inside real narrative play.

## 6. Gate 5 — Secondary mechanics

Only after core product and CSA are accepted:

- feedback revision;
- player meter if retained;
- image;
- TTS;
- history/export polish;
- remaining UI/tooling.

## 7. Test portfolio rules

### 7.1 Product tests

Must assert source-of-truth identity and visible requirements.

Examples:

- content projection exactly matches canonical character IDs/names/counts;
- map projection matches canonical location IDs/count;
- Setup contains all owner-accepted fields;
- Opening prompt/context contains real Company premise/canon;
- generic demo identities are absent;
- accepted UI surface inventory exists;
- removed features remain absent.

### 7.2 Structural tests

Test concurrency, transaction, fencing, memory/readback and reducers.

Structural tests must not hard-code a wrong demo product and then legitimize it.

### 7.3 Provider contract tests

Validate prompt projection and output boundaries, not only API shape.

At least test:

- exact literal action appears unchanged;
- relevant actor canon is present;
- current location description is present;
- relevant active rule premise is present;
- recent raw continuity + older memory are present within budget;
- forbidden generic success/relationship/consent taxonomies are absent.

### 7.4 Visual tests/review

For major UI changes, provide screenshots/mobile captures and surface checklist. DOM existence alone does not prove a usable game.

### 7.5 Manual tests

Manual owner acceptance is a release gate, not informal feedback.

A failed owner scenario changes status to PRODUCT_REJECTED/CHANGES_REQUIRED regardless of CI.

## 8. Merge rules

A PR implementing player-facing behavior may merge only when:

- exact requirement/scenario IDs are listed;
- relevant product tests pass;
- structural tests pass;
- exact deployed or review artifact is available when required;
- owner gate for that milestone is satisfied.

For early Milestone 0, source may be reviewed before deploy, but final phase progression requires deployed owner acceptance.

## 9. Main branch protection recommendation

Before restarting automation, enable repository protections if operationally available:

- no direct runtime/product push to `main`;
- PR required;
- CI required;
- owner review required for Product Constitution/Golden Master changes;
- separate label/check for product acceptance where appropriate.

Docs-only emergency STOP/current-truth corrections may use a narrowly documented owner path.

## 10. Automation restart requirements

Do not restart the old watcher unchanged.

Future loop needs:

- explicit `LOOP_CONTROL.enabled`;
- generation fencing;
- CURRENT_TASK READY;
- recheck at each mutation boundary;
- stop states treated as terminal, not inactivity errors;
- owner supersession checked before commit/PR/merge/deploy/DB/game operations.

## 11. What counts as progress

Progress is not number of PRs, test count, or lines of code.

Progress milestones are:

1. owner recognizes correct product at Opening;
2. 5 turns feel like correct Company game;
3. 20 turns preserve continuity;
4. `상식개변` works without distorting narrative agency;
5. secondary systems attach without destabilizing Story.

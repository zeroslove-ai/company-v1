# Company Redesign — Design Review & Implementation Gates

Status: OWNER-REVIEW DRAFT / PRODUCT LOCKED / A′ ENGINE AUDITED  
Date: 2026-08-21

The previous process accumulated engineering and automated tests before checking whether the build was still the intended game. This document reverses that order.

## 1. Gate 0 — Product authority

Binding redesign inputs:

- `00_AUTHORITY_AND_CHANGE_CONTROL.md`
- `01_PRODUCT_CONSTITUTION.md`
- `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`
- `03_GOLDEN_UI_CONTENT_MASTER.md`
- `04_GAMEPLAY_STATE_MEMORY_MODEL.md`
- `05_ARCHITECTURE_DECISION_FRAMEWORK.md`
- `07_CSA_MVP_CATALOG.md`
- `08_COMPANY_V1_SALVAGE_MATRIX.md`

Locked product decisions include:

- four Story-authored choices + free input;
- one bounded `scene_note` initial physical-continuity model;
- dynamic player sexual gauge removed;
- flexible finite CSA subject/counterparty scope;
- complete Company v1 presentation is the primary high-parity UI donor.

No code task may reopen these decisions for implementation convenience.

## 2. Gate 1 — Engine architecture audit

The bounded source audit is recorded in:

- `09_ENGINE_ARCHITECTURE_DECISION_A_PRIME.md`
- `10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`
- `11_TARGET_GAP_MATRIX_A_PRIME.md`

Audit result: **A′** is the selected engine recommendation.

```text
Company v1 high-parity UI/content
+ new thin client controller
+ new minimal Company domain/view model
+ trimmed v2 server-owned turn kernel
+ Story + one observer
+ isolated new persistence namespace
```

A′ keeps only v2's product-neutral concurrency/streaming/commit lessons. The v2 demo product/domain/frontend are rejected. Hospital remains a play-feel/prompt donor only.

No source implementation begins until the owner accepts this composed architecture.

## 3. Gate 2 — Milestone 0: recognizable game first

Required:

- Company v1 Story/action/MM/Setup presentation transplanted at high parity;
- canonical Setup/profile;
- canonical Company content;
- correct Opening;
- one ordinary server-owned Story turn;
- Story-authored four current-turn choices projected by the observer;
- free-form action always available;
- one `scene_note` continuity skeleton;
- committed refresh/readback;
- visible streaming with no blocking loader;
- no removed dynamic sexual gauge.

Not required yet:

- active CSA mutation;
- Image/TTS;
- feedback revision;
- separate memory compactor;
- speculative physical/relationship systems.

Acceptance order:

1. small A′ invariant suite only;
2. desktop/mobile screenshot check against Company v1 donor;
3. TEST deploy;
4. **owner Opening review immediately**;
5. owner 3–5 free live turns;
6. fix actual product failures before deeper implementation.

Do not spend another long phase growing tests before the owner sees live Story.

## 4. Gate 3 — Core continuity through live play

Verify through 10–20 owner-played turns:

- location/presence;
- canonical identity;
- direct question/follow-up continuity;
- multi-character dialogue;
- `scene_note` physical/object continuity;
- recent + older-summary memory;
- refresh/reconnect;
- relevant Mind Monitor.

If `scene_note` fails a real scenario, show the exact failure and add only the smallest structure necessary. Do not revive a generic physical ontology by default.

## 5. Gate 4 — Recovery mini-pass

Before CSA expansion, perform only a few high-value recovery checks on TEST:

- double submit;
- refresh/reconnect during Story stream;
- one explicit failed-turn retry;
- one observer fail-open case where practical.

Pass condition:

- one action never becomes two committed turns;
- stale attempt never overwrites a newer attempt;
- successful Story is not silently regenerated because an optional observer field failed;
- readback equals committed state.

## 6. Gate 5 — `상식개변` nine-rule MVP

Reuse/transplant the Company v1 app presentation but replace old CSA runtime semantics.

Implement exactly:

- 3 weak + 3 medium + 3 strong templates;
- one finite shared scope vocabulary;
- flexible supported subject scope;
- optional counterparty scope only where meaningful;
- dedicated apply/change/remove transaction;
- durable active-rule lifecycle + selected scope;
- **zero ordinary Story turns consumed by rule transaction**;
- exact four-slot clothing mechanic where required;
- no non-MVP activation path;
- no generic execution/action/consent DSL.

Owner tests all nine in real narrative play. Use representative scope combinations rather than building a combinatorial automated matrix first.

A tenth rule is forbidden until the nine-rule MVP passes live owner play.

## 7. Gate 6 — 20–30+ turn long play

Only after the core + CSA feel correct, run longer natural play to answer:

- do older important facts survive beyond the raw recent window?;
- are chronological turn summaries enough?;
- do character voices remain distinct?;
- is one `scene_note` enough?;
- is prompt/context size still reasonable?;
- does UI remain responsive and readable?

Only this evidence may justify a separate memory compactor or additional scene structure.

## 8. Gate 7 — Secondary sidecars

After core acceptance:

- feedback revision;
- image;
- TTS;
- history/export polish;
- remaining UI tooling.

These are nonblocking sidecars. They never redefine Story/Commit.

## 9. Minimal automated test policy

Binding detail: `10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`.

Forward CI protects only expensive invariants:

1. canonical content + Setup;
2. literal action + fencing + atomic Commit;
3. stream/reconnect;
4. observer fail-open + minimal reducer;
5. 9-rule non-turn CSA transaction;
6. optionally one tiny frontend literal-submission contract.

No target test count exists.

Old tests are deleted/stopped when they protect obsolete v1/v2 orchestration, compatibility, removed mechanics, old Story wire, historical 44-rule semantics, source-regex assertions, prompt snapshots or demo behavior.

A new regression test is added only for a catastrophic invariant or a concrete live failure that is cheap and deterministic to protect.

## 10. Live acceptance outranks CI

The release truth is:

```text
small structural suite green
AND
exact TEST deploy healthy
AND
owner live acceptance green
```

A green CI run cannot override bad gameplay.

An obsolete old test cannot force the new product backward.

## 11. Evidence-game safety

Every redesign smoke/manual test uses a fresh TEST game ID.

Preserved v1/v2/manual evidence games are read-only. Automation never resets or consumes the owner's preserved gameplay fixture.

## 12. Merge rules

Player-facing implementation merges only when:

- exact redesign requirement/scenario IDs are cited;
- the small relevant invariant tests pass;
- visible UI differences from the Company v1 donor are intentional;
- the required TEST/live gate for that milestone has passed;
- owner product rejection is not outstanding.

Do not require unrelated legacy tests to pass.

## 13. Automation restart

Do not restart the old watcher unchanged.

Future automated execution requires both loop enablement and a READY task plus generation fencing/recheck at mutation boundaries.

Automation may run small structural smoke tests. It does not replace owner live play.

## 14. What counts as progress

1. owner recognizes the intended Company product at Opening;
2. 3–5 turns feel correct in the real UI;
3. 10–20 turns preserve identity/scene/conversation continuity;
4. recovery does not duplicate/corrupt turns;
5. all nine CSA rules work naturally and consume zero fake Story turns;
6. 20–30+ turns preserve useful memory;
7. only then secondary systems and future rules expand.

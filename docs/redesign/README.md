# Company Full Redesign — Canon Index

Status: OWNER-REVIEW DRAFT / PRODUCT LOCKED / ENGINE AUDITED  
Date: 2026-08-21

This directory is the proposed replacement authority for the failed v1/v2 design chain. It is intentionally product-first and live-play-first.

Read in order:

1. [`00_AUTHORITY_AND_CHANGE_CONTROL.md`](00_AUTHORITY_AND_CHANGE_CONTROL.md)
2. [`01_PRODUCT_CONSTITUTION.md`](01_PRODUCT_CONSTITUTION.md)
3. [`02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`](02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md)
4. [`03_GOLDEN_UI_CONTENT_MASTER.md`](03_GOLDEN_UI_CONTENT_MASTER.md)
5. [`04_GAMEPLAY_STATE_MEMORY_MODEL.md`](04_GAMEPLAY_STATE_MEMORY_MODEL.md)
6. [`05_ARCHITECTURE_DECISION_FRAMEWORK.md`](05_ARCHITECTURE_DECISION_FRAMEWORK.md)
7. [`07_CSA_MVP_CATALOG.md`](07_CSA_MVP_CATALOG.md)
8. [`08_COMPANY_V1_SALVAGE_MATRIX.md`](08_COMPANY_V1_SALVAGE_MATRIX.md)
9. [`09_ENGINE_ARCHITECTURE_DECISION_A_PRIME.md`](09_ENGINE_ARCHITECTURE_DECISION_A_PRIME.md)
10. [`10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`](10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md)
11. [`11_TARGET_GAP_MATRIX_A_PRIME.md`](11_TARGET_GAP_MATRIX_A_PRIME.md)
12. [`06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md`](06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md)

## Locked product decisions

Owner decisions on 2026-08-21:

1. ordinary turns keep free-form input plus exactly four natural Story-authored choices; the one post-Story observer projects them for UI;
2. immediate physical continuity starts with one bounded replaceable `scene_note` plus structured location/present actors;
3. dynamic player sexual/arousal/erection/ejaculation gauge and supporting ledger are removed;
4. first `상식개변` product exposes exactly 9 rules with flexible finite subject/counterparty scope;
5. Company v1 complete presentation is the primary UI donor rather than the reduced `frontend-v2` shell.

## Engine audit result

The bounded source audit selects **A′** as the forward engine recommendation:

```text
Company v1 high-parity UI/content salvage
+ new thin frontend controller
+ new minimal Company view model/domain
+ trimmed v2 server-owned turn kernel
+ Story LLM + one small post-Story observer
+ isolated new persistence namespace
```

A′ is not “continue v2”. It keeps only the expensive product-neutral infrastructure ideas proven in v2:

- one server-owned turn lifecycle;
- one `(game, turn)` job;
- attempt fencing;
- bounded Story progress/reconnect;
- atomic Commit;
- explicit retry.

The v2 demo product/domain/frontend are rejected.

Hospital remains a play-feel/prompt reference, especially for natural Story + four Story-authored choices, not the runtime base.

## Company v1 salvage

`08_COMPANY_V1_SALVAGE_MATRIX.md` records the source audit of `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`.

Core direction:

```text
Company v1 complete presentation shell ----- high-parity transplant
Company v1 canonical content --------------- keep
render/map/setup ---------------------------- keep / light rewire
CSA modal presentation --------------------- transplant, semantics rebuild
TTS/history/media UI ----------------------- defer-keep
old browser turn coordinator --------------- delete
old large semantic runtime ----------------- delete
```

## Testing direction

`10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md` explicitly rejects test-count-driven development.

Forward CI protects only catastrophic invariants:

- canonical content/Setup;
- literal action + fencing + atomic Commit;
- stream/reconnect;
- fail-open observer/minimal reducer;
- 9-rule non-turn CSA transaction;
- optionally one tiny frontend submission contract.

Old v1/v2 tests are deletion candidates by default when they protect obsolete orchestration, compatibility, removed mechanics, old Story wire, old 44-rule semantics, source-regex assertions or demo behavior.

The primary product gate is real TEST play:

1. Opening immediately;
2. 3–5 free live turns;
3. 10–20 turn continuity play;
4. a few failure/reconnect checks;
5. all 9 CSA rules in real play;
6. 20–30+ turn long-play memory check.

If CI is green but live play is bad, the build is bad.

## Current status

These documents are still design/review authority only. They do not authorize runtime/frontend/SQL/DB/deploy/gameplay mutation yet.

`docs/ops/CURRENT_TASK.md` on main remains `WAITING_OWNER_DECISION`.

The next legitimate step after owner acceptance is the first narrow A′ implementation cut from `11_TARGET_GAP_MATRIX_A_PRIME.md`, followed by TEST deployment and live owner play immediately rather than another long test-only phase.

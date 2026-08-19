# Company v2 — CURRENT TASK

Status: WAITING_LEASE_TERMINAL
Task ID: company-v2-product-baseline-rebuild-plan-v1
Mode: OWNER STOP — PRODUCT CANON / UI / DB / PROMPT BASELINE REBUILD PLAN
Updated: 2026-08-20
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Stop state

The prior source-correction task `company-v2-phase1-product-identity-shell-restoration-v1` is OWNER-ABORTED.

Issue #68 stop instruction: `5348820636`.

Its lease must terminalize as `OWNER_ABORTED_DESIGN_CANON_AUDIT_REQUIRED` before any new executable task is registered.

Until then:

- no source implementation;
- no new source branch/PR;
- no merge;
- no deploy;
- no migration/DB mutation;
- no TEST gameplay;
- no evidence-game mutation;
- no continuation of the aborted correction branch as an implementation candidate.

Handoff H remains immutable evidence:

`161dda85-5cb4-4598-8331-1b9adc0d64f4`

## 1. Verified failure classification

This is not a missing-design problem. Company product/design canon already existed, and the initial v2 task itself required canonical Company content reuse.

The failure is `V2_PRODUCT_CANON_INHERITANCE_AND_ACCEPTANCE_GATE_FAILURE`:

1. v2 runtime architecture work preserved the structural turn spine but did not preserve the product baseline;
2. PR #87 introduced fabricated/demo content (`서원`, `다현`, `민지`, two locations) instead of the authoritative repository catalogs;
3. PR #87 tests validated structural runtime invariants but did not validate canonical product identity/content parity;
4. PR #90 interpreted “bring the existing UI” as a reduced shell recreation instead of presentation parity with the established Company UI donor;
5. source review accepted runtime/SSE/fencing/test correctness without a product-parity acceptance gate;
6. current v2 persistence/state is too minimal to represent parts of the established Company player/product contract.

Issue #68 durable audit finding: `5348837128`.

## 2. Recovery direction — keep runtime spine, rebuild product layer

### KEEP

Preserve only independently useful clean-runtime infrastructure unless later audit disproves it:

- physically isolated `runtime-v2` / `frontend-v2` deployment identity;
- one server-owned turn request;
- real-time Story SSE;
- one canonical `(game_id, turn_number)` job;
- reconnect to same job;
- explicit failed-attempt retry only;
- attempt fencing;
- bounded Story progress persistence / subrequest budget closure;
- one durable commit boundary;
- isolated `company_v2_*` persistence namespace;
- no old frontend Story→Extract→Commit coordinator authority.

These are infrastructure, not proof of product correctness.

### REBUILD / REPLACE

Treat the following current v2 product layer as non-authoritative and replace from canon:

- `runtime-v2/domain/content.js` demo catalog;
- v2 Setup/player-profile contract;
- v2 Opening;
- Story context/canon projection;
- product state projection;
- `frontend-v2` presentation shell;
- product-parity tests and acceptance gates.

Do not patch fabricated/demo values one by one.

### DELETE AS PRODUCT AUTHORITY

The following concepts must not survive as defaults/authority:

- fabricated `서원/다현/민지` catalog;
- two-location demo world;
- generic work-assistant Opening/phrasing;
- “header + Story + a few panels = UI restored” acceptance rule;
- tests that pass without comparing against authoritative Company catalogs/UI contracts.

## 3. Next task after this lease terminalizes — docs/audit only

Register exactly one docs/audit task by overwriting this same CURRENT_TASK in place.

Planned Task ID:

`company-v2-product-canon-and-gap-matrix-v1`

No product source implementation in that task.

It must produce one binding `Company v2 Product Canon` derived from, and explicitly reconciling, the existing authoritative sources:

- latest explicit owner decisions;
- `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`;
- `docs/COMPANY_PROMPT_V2_DESIGN.md`;
- `docs/COMPANY_GAME_CONTRACT_V1.md`;
- `docs/COMPANY_NARRATIVE_CONTRACT_V1.md`;
- `CURRENT_TRUTH.md`;
- `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`;
- authoritative `content/*.json` catalogs;
- established Company UI donor/reference, including exact donor commit where applicable.

The canon must explicitly state what carries into v2 and what is deferred. No implicit “historical as needed” product requirements.

## 4. Mandatory canon sections

The new v2 product canon must freeze at minimum:

1. **Game identity / premise** — `상식개변: 회사편`, company-life interactive fiction, player-private app premise, player agency.
2. **Canonical world/content** — exact heroine/general-NPC/location/catalog authority comes from repository content, never duplicated hand-maintained demo lists.
3. **Player Setup/profile** — exact fields the product exposes and which are static profile vs mutable gameplay state.
4. **Opening** — canonical setup/location/NPC selection and `상식개변` premise; no assistant framing.
5. **Story context** — exact current location, relevant actors, compact character canon, player profile projection, recent turns/summaries, and literal action authority.
6. **UI parity** — identify the exact established UI donor and enumerate every visible product section to preserve. “Bring the UI” means presentation parity first, not a newly invented reduced shell.
7. **Frontend authority boundary** — donor HTML/CSS/presentation/components may be reused; old client-owned turn coordinator may not.
8. **V2 persistence contract** — which product fields need v2-native durable storage versus static catalog lookup. If current schema is insufficient, authorize a later additive migration rather than faking values in frontend/prompt code.
9. **Phase boundaries** — features visibly present but disabled/deferred versus active, without false functionality.
10. **Acceptance gates** — exact product-parity checks required before source merge and before TEST handoff.

## 5. Required gap matrix

For every product domain, compare `authoritative product canon` vs `current v2` and classify:

- KEEP;
- REWIRE;
- REBUILD;
- DELETE;
- DEFER.

At minimum cover:

- UI shell/components;
- player Setup/profile;
- heroine/general NPC identity;
- map/location catalog;
- Opening;
- Story prompt context;
- Mind Monitor;
- current character/player state panels;
- history/summary;
- `상식개변` app/tool presentation;
- CSA runtime boundary;
- image/TTS/feedback presentation boundary;
- DB state fields/RPC needs;
- frontend/server ownership;
- tests/acceptance.

## 6. Implementation direction after canon approval

After the product canon + gap matrix are reviewed, register one integrated source rebuild task. Do not make another sequence of tiny symptom patches.

That source rebuild must:

1. transplant the established Company UI presentation/layout/components into `frontend-v2` at high parity, while replacing only old controller/API authority with the thin v2 client;
2. wire `runtime-v2` directly to authoritative `content/*.json` through a small static adapter — zero fabricated semantic lists;
3. restore the canonical player Setup/profile path;
4. restore Opening and Story context from the v2 product canon;
5. add an additive v2 migration only if the approved product state contract proves current `company_v2_state` cannot hold required product fields;
6. preserve the accepted clean turn/job/SSE/commit spine;
7. add product-parity tests that compare against canonical content and UI contracts, not merely structural existence;
8. stop at source review before deploy.

## 7. New acceptance gates

A future source rebuild is NOT acceptable merely because unit/full tests pass.

Before merge, operator review must directly verify:

- exact heroine/general NPC IDs and names from authoritative content;
- exact map/location catalog source;
- no fabricated product semantic lists;
- player Setup/profile contract parity;
- Opening premise parity;
- Story request contains the correct relevant canon;
- literal player action remains unchanged;
- established Company UI sections/layout are present at product parity;
- old frontend coordinator authority is absent;
- v2 DB contract actually stores every approved mutable product field;
- deferred features are clearly disabled rather than faked.

Before TEST owner handoff:

- deploy only exact reviewed head;
- create a fresh v2 game only after DB/API/UI contract verification;
- verify Setup + Opening + one bounded automated turn in DB/SSE;
- inspect real Story for product identity and canon coherence;
- then hand the fresh game to owner for manual play.

No repeated owner handoff until these product gates pass.

## 8. Current decision

Do not attempt another quick repair of the current demo product layer.

Recovery strategy is:

`freeze → single v2 product canon → full current-v2 gap matrix → integrated product-layer rebuild on preserved runtime spine → exact source review → TEST rollout → owner play`

This file is a stop/planning state only. It authorizes no implementation while the aborted lease remains unterminated.

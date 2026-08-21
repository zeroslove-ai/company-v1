# Company Current Truth

**Current owner decision: full product-and-runtime redesign is in progress. No Company v1/v2/Hospital gameplay architecture is currently binding as the forward implementation target.**

Updated: 2026-08-21

## Read order

Before any Company implementation/review/deploy decision, read:

1. `AGENTS.md`
2. this `CURRENT_TRUTH.md`
3. `docs/ops/CURRENT_TASK.md`
4. after owner acceptance, the redesign authority under `docs/redesign/` in its declared hierarchy
5. prior v1/v2/Hospital documents only as historical product/design/failure evidence

## Current stop state

The prior Company v1 repair line and Company v2 clean-runtime/product-canon line are both superseded as forward authority.

The current task is `company-full-redesign-reset-v1` with `Status: WAITING_OWNER_DECISION`.

No runtime/frontend/SQL/DB/deploy/gameplay implementation is authorized until the new redesign canon is owner-accepted.

Draft PR #94 and previous v2 product-canon candidates are historical evidence only and must not be merged/reopened as forward authority.

All preserved manual/QA/evidence games remain read-only.

## Why the authority was reset

The 2026-08-19 clean-runtime rebuild solved or addressed several structural transport/concurrency issues, but it also demonstrated a product-authority failure: runtime/UI work progressed before the actual Company product identity, canonical content, setup, UI surfaces, and owner-visible acceptance scenarios were made hard gates.

The deployed/implemented v2 line could pass large structural test suites while still presenting a generic office-assistant/demo product instead of `상식개변: 회사편`.

Therefore neither current code nor current tests define the product.

## New authority order

The redesign is rebuilt in this order:

1. Product Constitution — what game this is.
2. Executable Acceptance Scenarios — what the player must actually experience.
3. Golden UI / Content Master — canonical content and deliberate product surfaces.
4. Gameplay / State / Memory Model — what becomes durable truth.
5. Architecture Decision Record — choose implementation only after 1–4.
6. Gap Matrix — compare chosen target to current assets.
7. CURRENT_TASK — execute a narrow accepted slice only.

`CURRENT_TASK.md` is execution authority only. It may not supersede or reinterpret accepted higher-level product/design authority.

## Existing assets during redesign

Treat all existing implementation as candidates, not authority:

- Company v1 runtime: historical/reference only;
- current Company v2 transport/concurrency/persistence kernel: possible KEEP candidate, not presumed;
- current v2 product layer/frontend: implementation evidence, not target product definition;
- Hospital runtime: donor/reference only;
- `content/*.json`: authoritative established semantic content facts unless owner explicitly redesigns that content;
- completed prior Company UI: product-surface/golden evidence, not automatically frozen pixel layout.

The redesign may KEEP, REWIRE, REBUILD, DELETE, or DEFER any technical asset after owner review.

## Loop / mutation rule

The automation loop is intentionally stopped.

No `CURRENT_TASK_READY` should be generated from the redesign drafts themselves. Future automation must require an explicit owner re-enable plus an accepted implementation task.

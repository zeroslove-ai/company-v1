# Company — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: company-full-redesign-reset-v1
Mode: OWNER DESIGN RESET / NO IMPLEMENTATION
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## OWNER STOP

The owner has stopped the prior Company v1/v2 implementation loop and requested a complete product-and-runtime redesign.

The previous executable task `company-v2-product-canon-gap-matrix-review-correction-v1` is superseded and MUST NOT resume.

Draft PR #94 and all previous Company v2 product-canon/runtime candidates are historical evidence only until the new redesign authority is explicitly accepted by the owner.

## Current authority state

There is intentionally **no executable implementation task**.

Do not:
- edit runtime-v2/frontend-v2/src implementation code;
- merge or reopen prior implementation/product-canon PRs as forward authority;
- deploy Workers;
- apply migrations or write/reset/reseed TEST/Production DB data;
- create/play/revise games;
- change provider/model/config/secrets;
- register another READY implementation task;
- infer product decisions from the old v1/v2 task chain.

All preserved manual/QA/evidence games remain READ-ONLY.

## Redesign order

The next authority must be created and owner-reviewed in this order:

1. Product Constitution — what game this is and what must never be lost.
2. Executable Acceptance Scenarios — what a player must actually experience.
3. Golden UI / Content Master — exact product surfaces and semantic catalogs.
4. Gameplay / State / Memory Model — what becomes durable truth and what remains narrative/derived.
5. Architecture Decision Record — only then choose whether to keep, replace, or partially reuse the current v2 kernel / Hospital reference / a new spine.
6. Gap Matrix — compare the selected target against current repository assets.
7. Implementation Task — a narrow task may be registered only after owner acceptance of 1–6.

`CURRENT_TASK.md` is execution authority only. It may not create, weaken, supersede, or reinterpret Product Constitution, Acceptance Scenarios, Golden Master, or accepted Architecture decisions.

## Resume condition

Remain STOPPED until the owner explicitly accepts the new redesign canon and authorizes a specific implementation phase.

No `CURRENT_TASK_READY` is authorized by this reset itself.

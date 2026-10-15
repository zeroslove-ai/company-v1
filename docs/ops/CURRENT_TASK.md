# Company — CURRENT TASK (R4 candidate branch only)

Status: PREPARED_FOR_OWNER_START
Task ID: company-core-r4-bounded-rebuild-20261015
Branch: rebuild/company-core-r4-20261015
Base main: 7780759fd595247bd05d13f89ce44847e4551d8a
Updated: 2026-10-15 KST

## Branch-local owner direction

The owner requested a decision on rebuild versus repair, a fresh branch, an implementation specification, and one Codex instruction that can carry the work through without repeated routine approval. This branch contains the bounded rebuild plan. This preparation commit does not mean runtime implementation or overnight execution has started.

When the owner supplies the accompanying execution prompt, set this task to RUNNING and execute docs/rebuild-r4/IMPLEMENTATION_SPEC_KO.md. Do not wait again at each implementation phase. The earlier manual-playtest hold remains binding for main and existing R3 deployments/evidence, not an excuse to halt this separately requested candidate work.

## Scope

Preserve the two-call Story -> Observer -> atomic Commit spine and reuse ordinary Company content/presentation assets. Independently rebuild the turn-command/context/state/persistence/recovery boundaries. Use non-explicit ordinary company-life fixtures. Explicit sexual content generation and implementation/improvement of sexual-coercion mechanics are outside this task. General-core acceptance is not full original-content or release acceptance.

## Deliverables

A runnable local browser candidate with real disposable persistence; unified command/turn/retry/feedback semantics; grounded memory retrieval; safe versioned media/GIF presentation; tests tied to actual failures; actual model/browser evidence where authorized; PROGRESS.md and FINAL_REPORT.md under docs/rebuild-r4; pushed commits and a draft PR.

## Protected scope

No main or PR #104 mutation, force-push, historical migration edits, existing Worker changes, remote DB activation/migration/repair, preserved game writes, new paid services, or production rollout. Local test databases are allowed. Remote preview requires a separately authorized isolated target. The product canon on main is not amended by this experimental plan.

## Execution

Follow specification sections 10-12. First deliver a thin Setup -> Opening -> one turn -> DB -> reload flow, then finish the remaining boundaries. Continue useful independent work when externally blocked. Never relabel in-memory/scripted checks as live product evidence. Final status: LOCAL_CANDIDATE_READY, PARTIAL_BLOCKED, or FAILED_NEEDS_FIX. Full product/owner approval is separate.

# Company v1 — CURRENT TASK

Status: READY
Task ID: cut3-story-failure-observability-root-cause
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Context

Cut 3 Relationship / Event Authority source is still operator-accepted at exact executable SHA `1a5c5540a0235fb2e53b2452516897af7664eba1`. The first TEST live-acceptance attempt deployed that exact executable successfully, passed Setup/Opening, then failed on the first ordinary Story before Extract/Commit/relation-event proof. The existing canary artifact did not preserve enough failed-turn request/action/status/SSE detail to classify the failure.

This task is NOT permission to retry until green and NOT permission to patch blindly. First make one bounded reproduction diagnostically useful, classify the exact root cause, then repair only if the evidence proves a repository source/protocol defect within the allowed scope.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected base: `main`
Expected PR state: OPEN / DRAFT / UNMERGED
Accepted Cut 3 executable before this diagnostic: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Current branch HEAD before handoff: `85cab2df6e2600d09e8f0f05f62568e9a8649439`
Known TEST Worker version from failed acceptance: `6f0940d5-3145-4301-bcdf-61bdccc3cdac`
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Preserved manual evidence game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable and must not be accessed/mutated.

PR #65/#66 remain superseded closed containers. No new branch/PR. No merge/Ready/rebase/squash.

## Goal

Determine why the first ordinary Story failed under the exact reviewed Cut 3 TEST deployment without adding retry/regeneration, provider/model/config changes, fuzzy repair, semantic hard gates, or compatibility patches. Preserve ordinary game flow and fix the authority/protocol root cause only if it is proven.

## Preflight

1. Fetch origin; verify #67 remains OPEN/DRAFT/UNMERGED based on `main`.
2. Prove current HEAD descends from `1a5c5540...` and executable/config/migration diff since `1a5c5540...` is zero before any new source edit.
3. Re-read CURRENT_TRUTH.md, AGENTS.md, 09_CURRENT_TRUTH.md, 10_SOLE_WRITER_DECISION.md, POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md, and the previous BLOCKED report comment `5296679769`.
4. Verify TEST Worker identity and dedicated TEST game. Never touch the manual evidence game.
5. Keep the currently deployed exact Cut 3 executable unless a proven source fix later requires a new TEST deployment in a subsequent task. This task does not authorize deployment of a new executable.

## Phase A — make one reproduction observable

Inspect `scripts/live-playtest-canary.mjs` and the actual Story API/SSE/action-status paths. The previous artifact only said `cut1 turn 1 Story failure`; that is insufficient.

Add or adjust DIAGNOSTIC HARNESS behavior only as necessary so a single ordinary Story attempt records, without secrets or full prompt dumps:

- endpoint and HTTP status;
- action_id / turn_no / relevant request identity;
- complete Worker-facing SSE event sequence and terminal error code/message;
- action processing_status/error readback after failure;
- whether raw Story bytes/text were received before parser/protocol rejection;
- if rejection is parser/protocol-side, the structural reason and safe bounded shape metadata needed to identify it;
- save_revision/committed_turn before and after;
- enough context to distinguish transport/provider failure, Story protocol failure, action lifecycle failure, stale deployment mismatch, or harness bug.

Do not log secrets, auth headers, provider credentials, full hidden prompts, or unrelated private data. Do not loosen runtime validation merely to collect evidence.

Run exactly ONE fresh bounded Setup/Opening/ordinary Story reproduction on the dedicated TEST game using the normal API path. No automatic retry/regeneration. Capture the new diagnostic artifact outside preserved repository evidence unless a small sanitized fixture is required for a test.

After capture, reset only the dedicated TEST game through the normal reset path and verify clean baseline.

## Phase B — classify before fixing

Based on captured evidence, choose exactly one:

A. TRANSIENT/EXTERNAL: transport/provider transient with no repository defect proven. Do not change runtime/provider/retry policy. Report BLOCKED with exact evidence; do not rerun.

B. HARNESS DEFECT: production runtime is not proven defective, but canary incorrectly classifies/loses the response. Fix only the harness observability/classification, add focused harness test if practical, do not alter gameplay runtime. Do not rerun live a second time under this lease; report COMPLETE for diagnostic closure and let operator queue live acceptance again.

C. REPOSITORY STORY/PROTOCOL ROOT CAUSE: exact evidence proves a deterministic source/protocol mismatch in our runtime. Fix the upstream contract/representation at the narrowest correct ownership boundary. Do not loosen parser/wire validation, add retry, fuzzy repair, synthetic Story, semantic gate, or provider/model/config change. Do not stack another prompt sentence if the failure shows representation/ownership brittleness; redesign the structural contract instead.

D. OTHER AUTHORITY DEFECT: if evidence points outside Story/protocol and requires a different durable-domain redesign, do not patch it here. Report BLOCKED with the exact path and proposed separate authority task.

## Allowed source scope if and only if Phase B proves B or C

- `scripts/live-playtest-canary.mjs` and focused harness tests for B.
- For C, only the proven Story request/wire/parser/route ownership files plus focused tests and required audit docs.
- Keep Cut 3 relation/event reducer semantics unchanged unless the evidence directly proves they caused the Story failure before Extract/Commit.

Any source fix must create one exact executable candidate commit, followed by a docs-only CURRENT_TASK WAITING_REVIEW commit. Do not deploy the new candidate under this task.

## Required validation

- focused tests for the proven defect/diagnostic behavior;
- existing Story/SSE/action lifecycle tests;
- existing Cut 3 relation/event/commit tests remain green;
- full current test suite;
- syntax checks for changed JS/MJS;
- `git diff --check`;
- explicit KEEP / REWRITE / DELETE decision for affected old tests; never add compatibility to save stale tests.

Test count is regression signal, not correctness proof.

## Operations boundary

Allowed: read-only Git/source/TEST inspection; local tests; diagnostic harness source/test edit; exactly one normal dedicated TEST Setup/Opening/Story reproduction; normal dedicated TEST reset; narrow runtime source fix only after deterministic evidence proves category C.

Forbidden: Production; manual evidence game access/mutation/reset; DB migration/DDL; direct DB gameplay-state manufacture/repair; frontend deploy; API deploy of any new source candidate; provider/model/temperature/token changes; retry/regeneration loops; fuzzy repair; parser relaxation; new semantic hard gate; synthetic Story; new branch/PR; merge/Ready/rebase/squash.

## Completion

Post one terminal report to Issue #68 containing:

- classification A/B/C/D;
- exact captured failure identity/status/SSE/action-state evidence;
- TEST game final clean reset proof;
- changed files and exact executable SHA if B/C produced a source change;
- focused/full validation;
- explicit deployment/migration/Production/manual-game operations;
- STOP for operator review.

If B/C changed source, set CURRENT_TASK to WAITING_REVIEW in a separate docs-only commit. If A/D has no source change, set CURRENT_TASK to WAITING_REVIEW docs-only after evidence capture.

Success phrase for diagnostic completion:

`CUT 3 STORY FAILURE ROOT CAUSE CLASSIFIED — AWAITING OPERATOR REVIEW`

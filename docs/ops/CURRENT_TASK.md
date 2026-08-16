# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: canary-opening-choice-option-plumbing-fix-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306683174` accepted the prior live run as accurate BLOCKED evidence.
Blocked terminal comment: `5306542914`.
Reviewed harness/source-test ancestor: `545541d8e83a89e5b090d201ae5e2c2952894f63`.
Current registration parent: `a78d442accd468ed9d3942f1e8fe133e090a0354`.

## Proven root cause

`parseCanaryArgs()` returns the validated `openingChoiceIndex` as a top-level field on the parsed run object. `run()` assigns `const args = parsed.args`, where `parsed.args` is a Set of raw CLI tokens. The Cut-1 branch then reads `args.openingChoiceIndex`, which is undefined. Therefore an explicitly supplied `--opening-choice-index 0` deterministically falls back to the existing free-text path even though Opening returned four valid provider-authored literals.

The prior bounded TEST run proved Setup/Opening, exactly-four provider choices, ordinary Story -> Extract -> Commit, replay/idempotence, free-text Turn 2, and final reset. It did not prove exact literal round-trip. This task fixes only that harness option plumbing defect.

## Objective

Make the existing canonical canary consume the already-validated parsed `openingChoiceIndex` from the correct authority and prove by source tests that an explicit Opening choice index selects the actual returned literal unchanged. Preserve all existing free-text behavior.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED and based on `main`.
2. Inspect the current `parseCanaryArgs()` -> `run()` -> Cut-1 call chain and confirm the root cause above before editing.
3. Fix the smallest owning boundary so Cut-1 uses the top-level parsed `openingChoiceIndex` (or an equivalently single canonical parsed-options object) rather than reading a property from the raw-token Set.
4. Do not change `selectOpeningChoiceLiteral()` semantics: the selected value must remain exactly `canonical_choices[index]`, with no trim/rewrite/numbering/metadata/fallback/truncate/pad.
5. Preserve no-option free-text mode exactly.
6. Add/adjust focused tests that exercise the actual `run()` option plumbing boundary, not only helper functions. At minimum prove:
   - explicit valid index reaches Opening-literal mode;
   - index 0 is not lost because it is falsy;
   - selected player_action is byte/string identical to the provider literal;
   - absent option remains free text;
   - invalid/missing choice still fails closed under the existing contract;
   - replay identity semantics are unchanged.
7. Remove or rewrite any stale test that encoded the broken `args.openingChoiceIndex` assumption; do not preserve it with compatibility code.
8. Run focused canary tests, full repository tests, syntax checks for modified JS/MJS, and `git diff --check`.
9. Record exact source/test SHA and executable diff scope. STOP for operator review.

## Architecture constraints

- Harness-only source/test correction. Gameplay runtime, Story, Extract, Commit, parser, provider, DB, frontend, progression, CSA, scene, clothing, sexual/media/image semantics must not change.
- Provider remains sole author of exactly four literal choices; the harness transports one returned literal unchanged.
- No second gameplay protocol, choice metadata authority, fallback, normalization, fuzzy repair, parser relaxation/new parser, retry/regeneration, provider/model/temperature/token change, or semantic gate.
- No compatibility runtime to preserve stale tests.
- TEST Level-7 acceleration seam remains unchanged and is not exercised in this source/test task.
- Sexual/image catalogs and media selection remain protected presentation adapters and are not in scope.

## Authorized operations

Authorized:
- read-only Git/PR/source inspection;
- edits only to the canonical canary harness and directly relevant tests/docs completion record;
- local source/test validation.

Not authorized:
- TEST live gameplay/setup/opening/reset;
- TEST DB writes, migration/DDL application or authoring;
- API/frontend deployment;
- Production access;
- any access to preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- provider/model/config/retry/parser/runtime semantic changes.

## Acceptance

PASS only if the actual canary run-path plumbing consumes the validated explicit Opening choice index, including index 0, and focused tests prove the exact returned literal becomes Turn-1 player_action unchanged while free-text mode remains unchanged when no index is supplied.

If fixing this requires gameplay/runtime/provider/parser/DB changes, STOP as BLOCKED rather than expanding scope.

## Completion

On PASS or first deterministic blocker:
- update this file to `WAITING_REVIEW` in the same source/test lineage;
- post one immutable terminal report to Issue #68 with START SHA, FINAL source/test SHA, exact files changed, focused/full test results, syntax/diff checks, and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next task yourself.

## Execution record

- Task ID: `canary-opening-choice-option-plumbing-fix-v1`
- Start SHA: `0a6ea8d9437d354ef16bd98e4c30b49fbdd22497`
- Current task blob SHA at start: `a3f5a1d1cfae09081c4c8a7c762f40c514610359`
- Source/test SHA: `5c14561f478859309c26100c6d9217734a23018b`
- Changed source/test files: `scripts/live-playtest-canary.mjs`, `test/live-canary-contract.test.mjs`
- Fix: Cut 1 now passes the parsed top-level `openingChoiceIndex` into the existing literal-selection path; index `0` is preserved and the selected canonical literal is transported unchanged. No-option free text remains unchanged.
- Focused canary contract: `24/24 PASS`
- Full `npm.cmd test`: `427/427 PASS`
- Syntax: both modified JS/MJS files `node --check PASS`
- `git diff --check`: `PASS`
- TEST live/DB/reset: `0`
- Migration/DDL application: `0`
- API/frontend deploy: `0`
- Production/manual-game access: `0`
- Provider/model/config/retry/parser/runtime semantic changes: `0`
- Final docs completion commit: pending

STOP for operator review. Do not start the live closure task or generate the next task from this record.

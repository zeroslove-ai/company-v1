# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: live-e2e-cli-prod-guard-closure-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308971717` — ACCEPTED_BLOCKED_EVIDENCE for `minimal-story-runtime-destination-target-handoff-test-rollout-v1`.
Blocked rollout final docs SHA: `dc1c279c91fd78012aa3a53e7f99e0942d7c6728`.
Accepted destination-target runtime SHA remains: `beae855ebc5a9706bae234af80b2569d73566f0a`.
TEST API Worker deployed during the blocked rollout: `game-proxy-company-v1`, Version `51c5ac28-8d52-49bc-bb14-fdd1f0164126`.

The blocked rollout did not exercise the destination product behavior. It stopped before touching the disposable TEST game because `node scripts/live-phase-2-e2e.mjs --help` unexpectedly executed the script and performed a forbidden read against its hard-coded sentinel target. No Production write occurred, but the forbidden read invalidated that rollout.

Current source proof:
- `scripts/live-phase-2-e2e.mjs` has no argv/help guard;
- direct execution always calls `main()`;
- `main()` loads environment, constructs the worker, and performs `/api/context` before any intended help behavior could occur;
- the script carries a hard-coded legacy game identity and is not the current disposable TEST-game acceptance authority.

Disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`, QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`, and Production are all forbidden to access in this task.

## Objective

Close the proven CLI/operator safety hole around `scripts/live-phase-2-e2e.mjs` in one deletion-first source/test cut, without changing gameplay/runtime semantics.

The preferred result is the smallest safe surface:
- if the script has no current canonical caller or product acceptance role, delete it and stale references/tests/docs that exist only for that dead path;
- if a current canonical caller is proven, retain only a fail-closed CLI whose `--help` and invalid/inspection-only invocations exit before secrets, worker construction, network/API/DB access, and whose live target must be explicitly authorized rather than silently defaulting to a Production/QA/sentinel game.

Do not create a new live harness merely to replace this script.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Inventory all current repository callers/references of:
   - `scripts/live-phase-2-e2e.mjs`;
   - its exported helpers `expectedCommitRevision` / `expectedCleanupRevision`;
   - `test-results/phase-2-live-e2e.json` assumptions;
   - docs/package scripts/tests that still treat it as a current acceptance runner.
3. Classify the script as either:
   - `DELETE_ZERO_CALLER`, or
   - `KEEP_EXPLICIT_OPERATOR_TOOL` with a concrete current caller/operation that cannot use an existing safer canonical TEST path.
4. If `DELETE_ZERO_CALLER`:
   - delete the script and only stale tests/docs/package references whose sole purpose is that path;
   - do not create a replacement harness;
   - preserve any generic helper only if another proven caller uses it.
5. If `KEEP_EXPLICIT_OPERATOR_TOOL`:
   - parse argv before `requiredEnvironment()`, `createApiWorker()`, any fetch, file report mutation, or other side effect;
   - `--help` / `-h` must print usage and exit 0 with zero environment-secret requirement and zero external calls;
   - unknown/invalid flags must fail before any external call;
   - no implicit default Production/QA/preserved/sentinel target is allowed for live execution;
   - require an explicit recognized authorization/target mode, and fail closed if absent or mismatched;
   - do not broaden allowed targets beyond a proven current need;
   - do not change Story/Extract/Commit/navigation/gameplay behavior.
6. Add focused behavioral regression(s) that prove the chosen safety boundary. At minimum, if the script is retained:
   - `--help` succeeds without required secrets;
   - `--help` performs zero fetch/worker/DB/API side effects;
   - invalid args fail before external access;
   - ordinary execution without explicit target authorization cannot silently reach the old hard-coded sentinel.
   Prefer testing exported pure argument/guard behavior over spawning a real networked process if that keeps the test deterministic.
7. Search similar current operator scripts only for the same exact class of dangerous `--help`/unknown-arg fallthrough. Fix/delete a sibling only if the identical defect is proven and the change is mechanical; do not expand into a general CLI framework/refactor.
8. Run focused script/operator tests, full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`.
9. No live rerun in this task. The destination-target runtime `beae855...` remains accepted and must not be modified to fix an operator-script defect.
10. Set this file to `WAITING_REVIEW`, post one immutable terminal report to Issue #68 with exact caller classification, deleted/retained surfaces, focused/full tests and forbidden-operation confirmation, and STOP.

## Architecture / safety constraints

- Minimal Story Runtime gameplay spine and destination-target logic are out of scope.
- No Story/Extract/Commit/navigation/runtime semantic edits.
- No new live test harness, generic CLI framework, compatibility layer, semantic gate, retry/regeneration, provider/model change, parser change or fuzzy logic.
- Deletion is preferred over preserving obsolete dangerous tooling.
- Inspection/help commands must be side-effect-free.
- Live target selection must be explicit and fail closed if the tool is retained.
- Historical applied migrations are immutable.

## Authorized operations

Authorized:
- read-only Git/source/package/docs/test inspection;
- source/test/docs deletion or minimal CLI safety fix on the canonical branch;
- local deterministic tests/static checks;
- docs completion commit and immutable Issue #68 terminal report.

Not authorized:
- any TEST gameplay/setup/opening/reset/write;
- any TEST/Production/QA/preserved-game API or DB access;
- API/frontend deployment;
- migration/DDL authoring/application/reapplication/edit;
- gameplay/runtime/content behavior changes;
- provider/model/retry/regeneration/parser/fuzzy/semantic/compatibility changes;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Acceptance

PASS only if the exact unsafe operator path is removed or made fail-closed with deterministic tests proving that help/invalid invocation cannot perform external access, without adding a replacement harness or changing gameplay semantics.

On PASS or first deterministic blocker:
- set Status to `WAITING_REVIEW`;
- post one immutable terminal report with START SHA, FINAL SHA, caller classification, exact deletion/fix, tests/static checks, and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.

## Execution result — WAITING_REVIEW / COMPLETE

- Start HEAD: `672d6273b1740f5e23c931c203cbb166e88de310`.
- Reviewed destination runtime SHA remains `beae855ebc5a9706bae234af80b2569d73566f0a`; no gameplay/runtime semantics were changed.
- Caller classification: `DELETE_ZERO_CALLER`. Repository inventory found zero current callers of `scripts/live-phase-2-e2e.mjs`, zero callers of `expectedCommitRevision` / `expectedCleanupRevision`, zero package/test references, and no tracked `test-results/phase-2-live-e2e.json` assumption. The only remaining path mentions are this execution record and historical audit evidence.
- Deleted `scripts/live-phase-2-e2e.mjs` in full. No replacement harness, CLI framework, guard layer, or sibling refactor was added. Historical `06_TEST_HARNESS_BASELINE.md` remains unchanged as immutable audit evidence.
- `test/live-canary-contract.test.mjs`: 24/24 PASS. Full `npm.cmd test`: 295/295 PASS. No JS/MJS files remain changed for syntax validation. `git diff --check`: PASS.
- No TEST/API/DB/Production/QA/preserved-game access, reset, write, migration/DDL, deployment, provider/model/retry/parser/semantic change, merge, or Ready occurred.
- Stop for operator review. No next task generated.

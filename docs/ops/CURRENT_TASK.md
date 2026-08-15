# Company v1 — CURRENT TASK

Status: READY
Task ID: canary-cli-evidence-safety-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Last accepted gameplay executable: `0627f01d5118e3a936d9280fb8f889644137550c` (`open-fact-persisted-read-contract-v1`).
Current docs/audit registration ancestor: `7a99e70df9f7d28e4135dbb2f4598139dd901907`.
V5 BLOCKED terminal report: Issue #68 comment `5300864698`.
Operator BLOCKED review: Issue #68 comment `5300987365`.

TEST Supabase project remains `fmcrspgxstsmxxsmkeee`, but **no TEST gameplay/DB/deploy/reset operation is authorized in this task**.
Dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` was independently read back after V5 cleanup at committed_turn=0, save_revision=929, level1/exp0, setup/opening not_started, csa_active empty, actions=0, turns=0.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must not be accessed.

Durable local evidence authority is `docs/audit/PRESERVED_EVIDENCE_APPROVAL_2026-08-15.md`:
- 15 trusted preserved untracked artifacts carry forward only while unchanged/untracked/unstaged/uncommitted;
- `phase12h-opening-success.json` is no longer trusted evidence and is a known-corrupted quarantine artifact only at SHA-256 `53758E55A651CDB506510A91C118E6E6D57620B73067A38E9C60A2C11A0D9A2F`;
- do not clean/delete/move/rename/rewrite/stage/commit any trusted or quarantined artifact.

## Proven operator/harness defect

V5 never reached product acceptance. Before the intended flow, Codex invoked:

`node scripts/live-playtest-canary.mjs --help`

Actual source behavior at accepted executable `0627f01...` proves:

1. CLI mode selection recognizes only a few positive mode flags and otherwise silently returns `opening-only`.
2. `--help` is therefore not help; it falls into a live opening path.
3. The opening-only success path defaults `CANARY_ARTIFACT_PATH` to repo-root `phase12h-opening-success.json`.
4. The command performed a live TEST opening and overwrote previously preserved evidence.

This is a harness safety contract defect. Do not rerun V5 until the harness is made fail-safe.

## Goal

Make `scripts/live-playtest-canary.mjs` impossible to trigger live TEST/network/filesystem evidence mutation through help, unknown arguments, or implicit/default mode selection, and make all generated canary evidence default outside the repository.

This task is source/test only. It must not execute a live canary against the actual TEST Worker.

## Mandatory Phase 0 — caller and CLI inventory

Before editing:

1. Read the complete current `scripts/live-playtest-canary.mjs`, all tests importing its exported helpers, package scripts/callers, and docs that invoke it.
2. Enumerate every currently supported live mode and all artifact/report output paths:
   - opening-only;
   - `--phase12k-playability`;
   - `--cut1-authority`;
   - `--cut3-relation-event`;
   - any other actual caller-proven mode.
3. Identify whether any current caller intentionally relies on **no arguments** meaning opening-only. Do not preserve an unsafe implicit behavior merely for stale tests; if a real operational caller relies on it, migrate that caller to an explicit mode in the same task.
4. Identify all repo-root/default artifact filenames used by the script.
5. Do not run the script in any mode that can perform network/live mutation during this source task.

## Required implementation

### A. Explicit CLI modes only

Introduce one clear argument parsing boundary before any environment-sensitive, network, reset, setup, opening, Story, Extract, Commit, or artifact-writing operation.

Required behavior:

- `--help` and `-h`: print usage and exit success with **zero network calls and zero file writes**.
- unknown option: fail non-zero before network/filesystem side effects.
- conflicting multiple live modes: fail non-zero before side effects.
- no explicit live mode: fail safe or show help; it must **not** execute opening-only.
- opening-only must have an explicit flag, e.g. `--opening-only`.
- existing legitimate modes remain explicit and behaviorally equivalent after successful parse.

Do not make `canaryMode()` silently convert unknown/no args into opening-only.

### B. Evidence output must not default into the repository

The canary must not have a default artifact/report path in repo root.

Preferred contract:

- use explicit env/CLI output path when provided; otherwise generate under `os.tmpdir()` with a deterministic/purpose-labelled filename, or fail requiring an explicit output path;
- all built-in defaults must resolve outside the repository;
- opening-only must never default to `phase12h-opening-success.json` in cwd;
- playability/authority-mode artifact defaults must also be audited and made safe;
- an explicitly supplied path inside the repo should be rejected by default unless there is a separate, deliberately named operator-only override with no current use. Prefer simply rejecting repo-contained output for this harness.

The active preserved/quarantine files are forensic state and must never be valid implicit output targets.

### C. Side-effect boundary must be testable

Separate/structure CLI parsing and execution enough that tests can prove side-effect-free behavior without contacting the real Worker.

At minimum tests must prove:

1. `--help` returns/prints usage and performs zero `fetch` calls and zero writes.
2. `-h` same.
3. unknown option fails before fetch/write.
4. no args does not start opening/live work.
5. conflicting live mode options fail before fetch/write.
6. explicit `--opening-only` is recognized as opening-only but can be tested with mocked execution only; do not live-call TEST.
7. every existing legitimate mode remains recognized.
8. default artifact path is OS TEMP/outside repo, or missing output is rejected before live execution according to the chosen design.
9. repo-contained artifact output is rejected if implementing path validation.
10. imported-module behavior remains side-effect free.

Prefer unit/child-process tests with mocked/stubbed execution boundaries; do not make test success depend on real network credentials.

### D. Preserve product architecture

Do not change gameplay runtime semantics:
- Story/Extract/Commit contracts;
- open facts;
- turn_summary memory;
- CSA;
- scene/navigation;
- progression;
- provider/model/prompt;
- DB schema/RPCs.

This is a harness/ops safety correction only.

## Validation

Run:
- focused canary/ops tests;
- full `npm.cmd test`;
- syntax checks for modified JS/MJS;
- `git diff --check`.

Test count is regression evidence only.

## Forbidden

- Any live TEST gameplay/LLM call.
- Any TEST DB write/reset.
- API/frontend deploy.
- Migration edit/apply/reapply/rollback.
- Production access.
- Any access to preserved manual game.
- Provider/model/temperature/token changes.
- Retry/regeneration.
- Any modification/deletion/move/rename/stage/commit of the 15 trusted preserved artifacts.
- Any modification/deletion/move/rename/stage/commit of quarantined `phase12h-opening-success.json`.
- `git clean -fd` / `git reset --hard`.
- New branch/PR, merge, Ready, rebase, squash, force-push.

## Completion

Before COMPLETE:

1. report exact START_SHA and executable FINAL_SHA;
2. show old unsafe parse/default-output behavior and new fail-safe behavior;
3. enumerate supported explicit live modes after the change;
4. report exact artifact path policy;
5. show behavioral proof that help/unknown/no-arg/conflicting modes produce no network/file side effects;
6. report focused/full/syntax/diff-check results;
7. verify live TEST/DB/deploy/migration/Production/manual-game operations all 0;
8. verify 15 trusted preserved artifacts and one quarantine artifact remain untouched;
9. verify PR #67 remains OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP.

Do not launch V5/V6 acceptance yourself. A separately reviewed live task will follow only after operator approval.

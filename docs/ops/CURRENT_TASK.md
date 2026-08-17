# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-final-release-handoff-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-remaining-coverage-v10`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5311126886` (`IC_kwDOTfvo8c8AAAABPJFdZg`)
- STARTED: Issue #68 comment `5311145046`
- Terminal: Issue #68 comment `5311255370` (`IC_kwDOTfvo8c8AAAABPJNTSg`) — `EXECUTION: COMPLETE`, terminal classification `COVERAGE_NOT_REACHED_CLOTHING_POSITIVE`
- Previous START SHA: `5bac8732d2eea994cbeb6a8f0ec856db00fec37d`
- Previous final docs SHA: `6f9e38b0e178ff747134c89459609e1dde7207db`
- Previous final CURRENT_TASK blob: `8cf7924e39cdaf1af204d4efac5b0e372f564d85`
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- Accepted TEST API Worker: `761a01bb-8cca-47ad-afde-87c0ba85c01d` (version 173)
- Accepted source GitHub Actions run: `31986414926` = SUCCESS.
- v10 final-docs GitHub Actions run: `31989482449` = SUCCESS.

## Operator review of v10

Classification: `ACCEPTED_RELEASE_HANDOFF_ELIGIBLE`.

Independent verification:
- The supplied Trigger resolves exactly to the v10 CURRENT_TASK_READY comment `5311126886`.
- The corresponding immutable terminal is Issue #68 comment `5311255370`.
- START `5bac8732...` -> FINAL `6f9e38b0...` is exactly one fast-forward commit touching only `docs/ops/CURRENT_TASK.md`.
- Accepted executable SHA `f03e32c4...` is an ancestor of v10 START; every descendant between accepted source and START is docs-only.
- PR #67 is independently OPEN / DRAFT / UNMERGED / mergeable and its reviewed v10 final head was `6f9e38b0...`.
- GitHub Actions for `f03e32c4...` and v10 final docs are SUCCESS.
- v10 reused the already-reviewed source-equivalent TEST API Worker `761a01bb...`; terminal reports no redeploy, migration/DDL, frontend deploy, source/test/runtime/content patch, provider retry/regeneration/config change, or forbidden-game access.

Accepted product evidence carried from v9 + closed by v10:
- exact UTF-8 Setup/Opening path and exact literal player-action transport;
- ordinary Story -> Extract -> Commit lifecycle and committed readback;
- exact-four projected choices with exact `/api/history` order/text parity on every accepted turn;
- free-text movement, registered identity, same-location `윤민아 보러간다` handoff, canonical scene/presence/time;
- duplicate-THOUGHT privacy boundary and side-system non-authority;
- same-action Story/Extract/Commit replay/idempotence;
- canonical final reset and disposable-TEST isolation;
- six-raw + older chronological summary memory: v10 reproduced the accepted Story projection as raw recent turns `[5,6,7,8,9,10]` plus chronological `turn_summary_memory` `[1,2,3,4]`; the early Turn-1 fact was outside raw context, present through summary memory, and retained at the later query without intentional intervening restatement;
- CSA activation-time premise/isolation: v10 used the supported App/CSA transaction path with existing `csa_7`, did not use the Level-7 seam, proved activation from the committed effective time rather than retroactive memory, and kept unrelated consent/comfort/affection/trust/romance/arousal state separate.

Remaining explicit evidence gap:
- v10 made exactly one permitted supported compact-clothing positive-path attempt.
- Story/Extract did not establish a completed clothing transition: Extract clothing evidence was empty and committed player clothing correctly remained `worn -> worn`.
- This is **not** a demonstrated persistence defect because the evidence boundary never authorized a state change.
- Per v10's binding decision rule, this sole positive/stochastic non-reach does not authorize another retry-until-lucky gameplay loop. Preserve it as a named release risk/coverage gap in the final handoff.

Do not describe this result as an unqualified `PRODUCT_PLAY_PASS`. The correct conclusion is: the release-candidate gameplay/architecture evidence is accepted for handoff, with one explicitly bounded positive clothing-coverage gap that did not demonstrate a product defect.

## Objective

Produce the final **release/landing handoff** for the current Minimal Story Runtime candidate without changing executable behavior.

This task is a read-only/source-audit + documentation/PR-metadata reconciliation task. It must answer, from current Git/source/CI/TEST deployment/DB facts:

1. What exact executable source is the accepted Company v1 release candidate?
2. What exact TEST Worker and DB migration contract correspond to it?
3. What product-play evidence is accepted, and what explicit gap/risk remains?
4. Does PR #67 contain any executable change after the accepted source that has not been reviewed?
5. Is PR #67 structurally suitable for an owner landing decision as-is, or does its ancestry/diff require a separate cleanup/landing strategy before merge?
6. Which current-truth/PR descriptions are stale and must be reconciled so the next owner decision is based on current facts?

Do **not** merge, mark Ready, deploy, mutate TEST gameplay, or start another acceptance loop.

## Mandatory fresh preflight

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Fresh-read `CURRENT_TRUTH.md`, `AGENTS.md`, `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`, `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`, and `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`.
3. Fresh-read Issue #68 v9/v10 operator review/terminal evidence and this CURRENT_TASK.
4. Verify PR #67 is OPEN / DRAFT / UNMERGED and head equals START.
5. Verify accepted source `f03e32c4194c114d702c43df1f6122c17c4ca7c1` is an ancestor of START.
6. Enumerate every commit and changed path from accepted source -> START. Any `src/**`, `test/**`, migration, config, worker, frontend, content, or script executable drift after `f03e32c4...` is a landing blocker unless separately reviewed in immutable Issue #68 evidence. Do not assume docs-only; prove it.
7. Verify GitHub Actions:
   - accepted source `f03e32c4...` / run `31986414926` SUCCESS;
   - v10 final docs `6f9e38b0...` / run `31989482449` SUCCESS;
   - current START CI if a new docs registration run exists.
8. Read-only verify the TEST deployment identity still resolves to API Worker `761a01bb-8cca-47ad-afde-87c0ba85c01d` or clearly report drift. No redeploy.
9. Read-only verify expected TEST migration/runtime contract remains present, including:
   - `20260816050000 / company_v1_minimal_story_runtime_contract`
   - `20260817000100 / company_v1_final_residue_closure`
   Do not author/apply migrations or DDL.
10. Do not access any game row. This handoff task requires **zero gameplay/game-ID reads or writes**, including the disposable TEST game. Deployment/DB catalog/migration metadata may be read-only inspected without touching game data.

If accepted source ancestry, CI, deployment identity, or live DB contract has materially drifted, classify the exact drift and stop any release-ready claim. Documentation may still record the blocker; do not repair executable/runtime state in this task.

## PR #67 landing audit

Audit the current PR against `main` without changing runtime code.

Record:
- exact base SHA and current head SHA;
- mergeability, Draft/open/unmerged status;
- commit count and changed-file count;
- high-level changed domains (`src`, `test`, migrations, scripts/config, frontend, docs/content);
- whether all executable portions of the current head are covered by accepted Issue #68 source/test reviews and live evidence;
- whether PR #67's ancestry includes superseded/intermediate work that is harmless history or creates a landing/review problem;
- relationship to other still-open Company PRs such as historical/test-consolidation PRs only where ancestry/diff actually proves a dependency or duplication. Do not close or modify other PRs.

Do not treat a large commit count by itself as a blocker. The question is whether the current diff against `main` is coherent, reviewed, and intentionally owned by PR #67.

Classify landing state as exactly one of:
- `HANDOFF_READY_OWNER_DECISION` — no unreviewed executable drift; current TEST contract matches; PR diff/ancestry is coherent enough for the owner to decide merge/deploy strategy.
- `LANDING_STRUCTURE_BLOCKED` — no product runtime defect is implied, but PR ancestry/diff/dependency requires an explicit cleanup or reconstructed landing branch before an owner merge decision.
- `HANDOFF_BLOCKED_LIVE_DRIFT` — accepted source no longer matches deployed TEST/runtime DB contract or required CI/evidence identity cannot be established.
- `HANDOFF_BLOCKED_UNREVIEWED_EXECUTABLE_DRIFT` — executable changes exist after the accepted source without reviewed evidence.

Do not invent another classification.

## Final release handoff document

Create or replace:

`docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`

It must be concise but sufficient for a fresh operator/owner session and include:

### A. Exact release-candidate identity
- repo, branch, PR, base/head;
- accepted executable/source-test SHA `f03e32c4...`;
- TEST API Worker version/ID;
- expected live migration contract;
- relevant successful CI run IDs.

### B. Canonical runtime architecture
Summarize only current accepted boundaries from current canon/source:
- player input/literal -> Story -> Extract -> Commit -> `game_save + game_turns` -> committed readback;
- Story narrative authority;
- Extract observation boundary;
- Commit structural/provenance/transaction authority;
- canonical `save.scene` narrow scene/presence authority;
- choice durable authority in committed `game_turns.choices`, not save mirrors;
- six raw + older chronological summary memory;
- CSA activation-time premise and isolation;
- compact clothing evidence-gated projection;
- side-system non-authority.

### C. Accepted release evidence
Separate deterministic/source evidence from live product-play evidence. Include v9/v10 exact Issue comment IDs and the important proven contracts. Do not equate raw test count with product acceptance.

### D. Explicit unresolved/non-blocking risk
Record the exact compact-clothing positive-path gap: one legitimate attempt, no Story/Extract completion evidence, no state mutation, therefore no demonstrated persistence failure. State explicitly that retry-until-lucky is not authorized and this gap should not be silently rewritten as a PASS.

### E. Landing audit
Record the exact PR #67 diff/ancestry conclusion and the classification chosen above.

### F. Owner-only next decisions
List decisions that require explicit owner authorization, for example merge/landing strategy, Draft->Ready, main landing, TEST->Production rollout, or additional product work. Do not perform them.

## Current-truth reconciliation

Current repository truth documents and PR #67 body contain historical/stale status text. Reconcile documentation only where current facts are independently proven.

Allowed docs edits in this task:
- `docs/ops/COMPANY_V1_RELEASE_CANDIDATE_HANDOFF_2026-08-17.md`;
- `CURRENT_TRUTH.md` — add/update a short current release-candidate status section without rewriting architecture unnecessarily;
- `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md` — update current identity/status fields or append a clearly dated verified supersession section; preserve historical evidence sections rather than pretending old rollout timestamps never existed;
- `docs/ops/CURRENT_TASK.md`.

PR #67 body may be updated to point to the final handoff and current release-candidate status. This is metadata only; keep PR Draft and do not mark Ready.

Do not edit `10_SOLE_WRITER_DECISION.md` unless a statement is factually contradicted by already-accepted current canon and the change is purely documentary. Prefer a dated supersession note in `09_CURRENT_TRUTH.md` rather than rewriting historical decision text.

## Validation

Because this task changes no executable behavior:
- verify `git diff --check`;
- verify changed files are limited to the authorized docs above;
- if running `npm test`, treat it as a regression signal only; do not patch runtime to satisfy an obsolete test;
- verify source CI and v10 docs CI remain SUCCESS;
- verify PR #67 remains OPEN / DRAFT / UNMERGED after any PR body edit;
- verify no deployment/gameplay/DB write occurred.

## Forbidden

Do NOT:
- change `src/**`, `test/**`, runtime, frontend, content, config, scripts, package/dependency files, migrations, or workflow behavior;
- author/apply DDL or migration;
- access or mutate any game ID, including disposable TEST;
- deploy API or frontend;
- access Production/preserved/QA/sentinel game data;
- change provider/model/retry/regeneration/config;
- run a new gameplay acceptance loop;
- create a clothing workaround or direct state seed;
- merge PR #67, mark Ready, rebase, squash, force-push, close other PRs, or push to `main`;
- describe the clothing positive gap as proven PASS;
- declare Production readiness merely from TEST evidence.

## Landing / terminal protocol

1. Perform the audit and documentary reconciliation only.
2. Make one coherent docs-only source commit for handoff/truth reconciliation if needed. PR-body metadata update does not require a repo commit.
3. Then update this file to `Status: WAITING_REVIEW` in the same docs-only landing commit if practical, or one final docs-only status commit if sequencing requires it. No executable change is allowed either way.
4. Normal fast-forward push only.
5. Post exactly one immutable terminal report to Issue #68 and STOP. Do not generate the next CURRENT_TASK.

Terminal must include:
- exact START and FINAL SHA;
- accepted executable SHA;
- changed files and proof of docs-only scope;
- source/v10/current CI status;
- TEST deployment and migration-contract read-only verification;
- zero game access/write/deploy confirmation;
- PR #67 base/head/state/mergeability/commit+file counts;
- executable-drift inventory after `f03e32c4...`;
- final handoff document path/blob;
- current-truth/PR-body reconciliation performed;
- exact remaining clothing coverage gap wording;
- one of the four exact landing classifications;
- owner-only next decisions;
- final PR state.

Then STOP.
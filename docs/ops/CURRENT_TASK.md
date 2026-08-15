# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: deep-level7-live-acceptance-v5-rerun
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted gameplay executable under test:
`0627f01d5118e3a936d9280fb8f889644137550c` (`open-fact-persisted-read-contract-v1`).

Accepted canary harness safety executable:
`521e8acf6c519ea05b92a45caef2f1ff601ad27c` (`canary-cli-evidence-safety-v1`).
Operator ACCEPTED review: Issue #68 comment `5301070173`.

Current branch HEAD before this task is a docs-only descendant of the accepted harness completion. Comparison from gameplay executable `0627f01...` to the pre-registration branch showed only:
- docs/audit evidence authority;
- docs/ops CURRENT_TASK;
- `scripts/live-playtest-canary.mjs` harness safety;
- `test/live-canary-contract.test.mjs`.
No Story/Extract/Commit/CSA/scene/progression/provider/DB gameplay source changed after `0627f01...`.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Existing Level-7 migration `20260815000100 / company_v1_test_level7_acceleration` is already applied. Do not edit or reapply it.
Preserved manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must not be accessed.

Preserved evidence authority:
- 15 trusted preserved untracked artifacts remain approved only while unchanged/untracked/unstaged/uncommitted;
- `phase12h-opening-success.json` is quarantined, not trusted evidence, and must remain untouched at SHA-256 `53758E55A651CDB506510A91C118E6E6D57620B73067A38E9C60A2C11A0D9A2F`;
- all new V5 rerun evidence must be written under OS TEMP, never inside the repository.

## Purpose

Resume the previously interrupted deep Level-7 acceptance. The prior V5 attempt did not classify any product defect; it was stopped before scenario execution because an unsafe `--help` invocation triggered live opening and overwrote preserved evidence. That harness defect is now independently accepted as fixed.

This task adds no new gameplay feature, semantic gate, wrapper, parser, writer, or compatibility layer. It is live acceptance only.

## Mandatory preflight

Before any live mutation:

1. Fresh-fetch PR #67 and verify OPEN / DRAFT / UNMERGED, base `main`.
2. Verify accepted gameplay executable `0627f01...` is an ancestor of current branch HEAD.
3. Prove all executable changes after `0627f01...` are harness/test-only and do not alter Worker gameplay runtime semantics.
4. Record current TEST Worker version and diagnostic configuration.
5. Verify the dedicated TEST game baseline is canonical and clean: committed_turn=0, level1/exp0, setup/opening not_started, csa_active empty, actions=0, turns=0.
6. Verify the Level-7 migration/function exists; do not reapply it.
7. Verify local worktree contains only the approved 15 trusted artifacts plus the known quarantined artifact, all in their approved states.
8. Do not access the preserved manual game.
9. Choose one OS TEMP evidence bundle before the first live call and record its path.
10. Do not invoke any live-capable script merely to inspect its interface. `--help` is now safe, but source inspection is preferred. Never probe unknown flags against live tooling.

If identity, evidence state, or baseline cannot be proven, STOP before live mutation.

## Authorized TEST operations

1. Deploy the exact reviewed gameplay runtime represented by `0627f01d5118e3a936d9280fb8f889644137550c` to TEST API Worker `game-proxy-company-v1` only. Harness/test/docs differences must not be part of gameplay-runtime reasoning.
2. Enable `COMPANY_V1_EXTRACT_DIAGNOSTIC=true` only for this TEST acceptance window.
3. Run the existing guarded Level-7 fixture seam exactly once on the dedicated TEST game.
4. Run normal TEST setup/opening/Story/Extract/Commit/context/history/app/CSA paths needed for scenarios A-I below.
5. On the first decisive architecture/protocol defect: capture evidence, do not retry/regenerate/patch, then perform final cleanup and STOP.
6. At finalization, always canonical-reset the dedicated TEST game and disable `COMPANY_V1_EXTRACT_DIAGNOSTIC` again. If diagnostic cleanup requires redeploy, use the same exact reviewed gameplay runtime only.

No migration apply/edit/reapply is authorized.
No source/runtime patch is authorized after execution starts.

## Harness safety rules

The accepted canary safety boundary is an operator tool only, not a gameplay gateway.

- Explicit live modes only.
- If `scripts/live-playtest-canary.mjs` is used, use only a caller-proven explicit mode and explicit/validated OS TEMP output.
- Do not invent a new canary mode or wrapper for V5.
- Do not add a generic gateway around Story/Extract/Commit.
- Do not use the canary where direct normal API/app flow is clearer.
- No repo-contained artifact/report output.
- Never touch the quarantined `phase12h-opening-success.json`.

## Evidence bundle

Use one OS TEMP bundle such as `%TEMP%/company-v1-deep-level7-v5-rerun-evidence.json`.

Capture at minimum:
- PR/branch/executable/Worker identity;
- diagnostic state before/after;
- dedicated TEST baseline;
- Level-7 seam result;
- exact player input or selected literal choice per turn;
- action id / expected turn;
- raw Story and parser-owned blocks;
- raw provider Extract response when diagnostic is available;
- normalized Extract response;
- canonical open_facts before Commit and committed/readback form;
- Commit result;
- committed `turn_summary`;
- context/history after each decisive turn;
- scene/location/presence/CSA state;
- later Story input proving latest-three raw + older summary memory;
- final reset proof;
- diagnostic-disabled proof.

Terminal report must include TEMP path + SHA-256. Never commit evidence.

## No-retry / no-mask rule

For Story/Extract/Commit/context/history authority defects:
- no retry;
- no regeneration;
- no provider/model/temperature/token change;
- no source/prompt/parser patch;
- no fuzzy repair;
- no synthetic facts/summary/state;
- no manual semantic DB repair.

A failed ordinary turn is evidence, not permission to make it pass.

## Scenario coverage

### A. Fixture / Opening / literal-choice integrity
- Level-7 seam exactly once.
- Normal setup/opening.
- Exactly four non-empty unique opening choices.
- Select at least one displayed literal unchanged and prove exact literal becomes player_action.

### B. Open-fact persisted round trip
Run ordinary workplace/dialogue turns and prove the defect fixed by `0627f01...` in the real TEST runtime:
- Story succeeds;
- Extract accounts structurally for parser-owned observation blocks;
- `facts: []` works for zero-fact blocks;
- facts preserve registered IDs + exact Story quote provenance;
- canonical facts include server metadata;
- persisted reader + Commit accepts `fact_id/action_id/turn_number/source_block` without self-rejection;
- durable `open_observations`, history, and context read back correctly;
- committed `turn_summary` equals Extract-authored summary rather than server synthesis.

### C. Scene / navigation / presence
Exercise explicit player navigation and NPC-directed movement/visit when naturally reachable.
Verify canonical player location/presence does not get rewritten by NPC movement, no wrong NPC duplication occurs, and next Story sees the committed scene.

### D. CSA natural-rule behavior at Level 7
Exercise at least one applicable CSA through the normal product transaction path, including strong capability if naturally available.
Verify CSA supplies institutional context/rule state only; Story authors HOW; Extract observes actual Story; compliance does not mechanically imply consent, comfort, affection, trust, emotion, relationship, or physical outcome.

### E. Open semantic durability
When naturally present, verify arbitrary work/agreement/refusal/relationship/emotion/physical/clothing/intimate observations persist without a closed event/relation/posture/sexual taxonomy deciding whether they exist.
`block_observations[].facts` are evidence-grounded observations, not an importance-to-memory gate.

### F. Turn-summary memory beyond latest three raw turns — mandatory
Create an early continuity fact/commitment and continue at least four newer committed turns.
Then prove:
- old raw Story body is outside the latest-three raw Story window supplied to fresh Story;
- its committed summary appears chronologically in `turn_summary_memory`;
- stale `story_summary_recent` / `story_summary_overall` does not compete in the fresh Story prompt path;
- later Story preserves continuity without inventing unsupported detail.

### G. Feedback revision parity
Only if the existing canonical harness/product path already supports safe feedback revision. Verify revised Story and regenerated turn_summary align with one active revision. If not safely supported, report `NOT EXERCISED — harness limitation` with source proof. Do not create new feedback tooling.

### H. Deep physical / intimate coverage
Continue naturally far enough to exercise deeper physical/intimate behavior when Level-7 state/rules/player steering make it reachable. This is coverage, not a forced per-turn outcome.
When reached, verify:
- player action kind/strength/scope fidelity;
- Story owns what actually happens;
- Extract preserves exact evidence without closed sexual-action truth gating;
- clothing/image tags remain projection/presentation only;
- CSA compliance remains separate from personal acceptance/consent/emotion/relationship.
If substantial natural play cannot reach this without prohibited synthetic state, report exact reached state and the coverage gap.

### I. Post-deep continuity / cleanup
If a deep turn is reached, continue several turns and verify continuity does not snap back and processing does not stick.
Always final-reset and prove:
- committed_turn=0;
- actions=0;
- turns/history=0;
- processing/pending clean;
- setup/opening baseline;
- progression level1/exp0 baseline;
- csa_active empty;
- Scene v1 setup baseline;
- manual game untouched;
- TEST Extract diagnostic disabled.

## Acceptance criteria

PASS only if mandatory A-F and final cleanup in I succeed with no decisive architecture/protocol defect.
G/H may be explicit coverage gaps only if the normal product/harness path genuinely cannot reach them without prohibited synthetic state.
Do not label an untested row PASS.

## Forbidden

- Production access/deploy/mutation.
- Any access/mutation/reset of preserved manual game.
- Migration edit/apply/reapply/rollback.
- Direct semantic DB edits.
- Provider/model/temperature/token changes except TEST-only diagnostic flag.
- Retry/regeneration/fuzzy repair/synthetic facts/summaries.
- Source/runtime patch after lease starts.
- New gameplay gate/wrapper/parser/writer/ledger.
- New canary mode or broad harness redesign.
- Frontend deployment.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- `git clean -fd` / `git reset --hard`.
- deletion/move/rename/rewrite/stage/commit of the 15 trusted evidence artifacts or quarantined artifact.
- repo-contained new evidence output.

## Terminal report

Before terminal report:
1. final-reset the dedicated TEST game even on failure;
2. disable TEST Extract diagnostic and prove it;
3. verify PR #67 OPEN/DRAFT/UNMERGED;
4. verify trusted/quarantined repo evidence unchanged and no new repo artifact;
5. report exact deployed gameplay executable + Worker Version(s);
6. report A-I PASS/FAIL/NOT EXERCISED with evidence references;
7. report every failing action/turn if any;
8. report open-fact persisted round-trip proof and scenario F summary-memory proof if reached;
9. report final reset state;
10. report TEMP evidence path + SHA-256;
11. report source/runtime changes = 0 during this live task.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push only the completion-state docs update if needed, post one immutable terminal report to Issue #68, and STOP.

Do not generate or execute any follow-up fix yourself.

## Execution completion state (2026-08-15)

This task is terminally blocked pending operator review; no follow-up execution is authorized.

- Start SHA: `885608e9c7b4192a93f761b9d7053c0dca932006`
- Gameplay executable under test: `0627f01d5118e3a936d9280fb8f889644137550c`
- Accepted canary safety SHA: `521e8acf6c519ea05b92a45caef2f1ff601ad27c`
- Issue #68 lease comment: `5301222785`
- PR #67 remained OPEN / DRAFT / UNMERGED.
- TEST Worker diagnostic-enabled deployment: `e5a951b4-46b8-4249-b7eb-6e5c114edc97` (`COMPANY_V1_EXTRACT_DIAGNOSTIC=true`)
- Level-7 guarded fixture seam: executed exactly once; `test_only=true`, `reset_before_seed=true`, `level=7`.
- Opening-only acceptance: HTTP 200 / terminal complete / 4 canonical choices; exact first literal was recorded in TEMP evidence.
- Direct V5 scenario: blocked at the first Story call for turn 1 by the local temporary evidence reader's SSE frame parsing defect. The Worker response was HTTP 200 with no parsed terminal event; this is not classified as a provider/runtime defect and no retry was made.
- A: BLOCKED after opening-only PASS; B-F: NOT EXERCISED; G-H: NOT EXERCISED; I: final cleanup PASS.
- Final reset: PASS; committed_turn=0, processing_status=idle, setup/opening not_started, csa_active empty, history=0.
- Diagnostic-disabled cleanup deployment: `0c3c350b-2eb5-403d-950e-0319eb8716d7`; `wrangler versions view` verified `COMPANY_V1_EXTRACT_DIAGNOSTIC=false`; health HTTP 200.
- TEMP evidence: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v5-rerun-evidence-5301222785.json`
- TEMP evidence SHA-256: `160B6D040A945258BD5C751F4E88FA9D44BFF8ED7B7F629801E4E0730BEA43BB`
- No migration was applied or edited; no Production/manual-game access occurred; no source/runtime patch was made during execution.

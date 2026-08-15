# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: deep-level7-live-acceptance-v4
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Exact reviewed executable to test: `1ffc3ca269fcf34d748d5380c2b70be19696b5d4` (`extract-turn-summary-memory-authority-v1`).
Previous accepted prompt-closure executable: `47f6ff08497189e0fa2c917ae9b3e311f8b631e0`.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
TEST Level-7 migration `20260815000100 / company_v1_test_level7_acceleration` is already applied. Do not edit or reapply it.
Preserved manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must not be accessed in this task.

Durable preserved-evidence authority: `docs/audit/PRESERVED_EVIDENCE_APPROVAL_2026-08-15.md`.
The exact previously approved 16-path local untracked evidence snapshot carries forward automatically while unchanged/untracked/unstaged/uncommitted. Do not STOP merely because that same approved snapshot exists.

Canonical loop under acceptance:
`player input / literal choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.

## Why this live acceptance exists

The previous deep Level-7 live acceptance V3 stopped at Turn 1 Extract with:

`story_observation_coverage_mismatch — Block story:0 declares facts without a fact`

That failure exposed two structural protocol defects which have now been independently fixed and accepted:

1. Fresh Extract provider wire is one block-local `block_observations[]` structure; each parser-owned Story block is supplied with exact `{block_id, block_index, block_type, text}` and facts are nested only at `block_observations[i].facts`.
2. Extract `turn_summary` is now the same-call per-turn compressed memory output; Commit persists it, feedback revision preserves parity, latest three turns remain raw Story context, and older selected turns are summary-only memory. No third Summary/Memory LLM exists.

This task tests those accepted source contracts against the actual TEST Worker/runtime. It is observation/acceptance, not an implementation task.

## Goal

Run a scenario-driven deep Company v1 live acceptance at TEST Level 7 that proves the current two-LLM architecture works across multiple turns and beyond the three-raw-turn context window.

Do not target a fixed small turn count. Continue only as many turns as needed to cover the required scenarios below. Stop immediately on the first decisive architecture/protocol defect. A long scenario is expected if necessary.

## Mandatory Phase 0 — preflight identity proof

Before any live mutation:

1. Fresh-fetch PR #67 and verify:
   - base `main`;
   - OPEN;
   - DRAFT;
   - UNMERGED.
2. Verify exact executable `1ffc3ca269fcf34d748d5380c2b70be19696b5d4` is an ancestor of the current branch HEAD and that any descendant delta before execution is docs/workflow-only.
3. Verify current TEST Worker identity/version before deployment and record it.
4. Verify the Level-7 migration exists in TEST and do not reapply it.
5. Verify the dedicated TEST game id is exactly `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
6. Verify the preserved manual game id is different and do not read/write/reset it.
7. Verify the repo worktree contains only the already-approved preserved 16-path untracked snapshot and no tracked dirt/unknown new untracked path.
8. All new V4 evidence must be written outside the repository, under the OS TEMP directory. Do not create a new untracked repo artifact.

If any identity cannot be proven, STOP before deployment/live mutation.

## Authorized TEST operations

This task may perform only the following live TEST operations:

1. Deploy exactly executable SHA `1ffc3ca269fcf34d748d5380c2b70be19696b5d4` to TEST API Worker `game-proxy-company-v1`.
2. Enable `COMPANY_V1_EXTRACT_DIAGNOSTIC=true` only for this TEST Worker acceptance so raw provider Extract content can be captured from TEST Worker diagnostics. Do not enable it in Production and do not persist raw provider output to DB/client payloads.
3. Run the existing named Level-7 fixture seam exactly once for the dedicated TEST game with the existing safety guards.
4. Run actual setup/opening/Story/Extract/Commit/context/history/app operations through normal TEST APIs/RPC paths needed for the acceptance scenarios.
5. At the end, or after any failure, reset the dedicated TEST game through the canonical reset path and prove final clean state.

No migration apply/reapply/edit is authorized.

## Evidence handling

Use one TEMP evidence bundle, for example:

`%TEMP%/company-v1-deep-level7-v4-evidence.json`

The exact temp filename may differ, but it must remain outside the repo.

Capture at minimum:
- preflight PR / branch / executable identity;
- pre-deploy and post-deploy TEST Worker version/health;
- Level-7 seam result;
- each player input or exact selected literal choice;
- each action id / expected turn;
- raw Story text;
- parsed Story block ids/types/text sufficient to map Extract observations;
- normalized Extract response;
- raw provider Extract response when diagnostic capture is available;
- Commit result;
- context/history after Commit;
- committed `turn_summary`;
- committed/open observations and source block evidence;
- scene/location/presence continuity;
- active CSA / app state when used;
- image/Mind Monitor sidecar observations when returned;
- final reset proof.

At terminal report, provide TEMP path and SHA-256 of the evidence bundle. Do not commit it.

## No-retry rule

For Story or Extract provider/protocol failures:
- no automatic retry;
- no regeneration;
- no provider/model/temperature/token change;
- no prompt/source patch;
- no parser relaxation;
- no fuzzy repair;
- no synthetic observation/summary;
- no DB manual repair.

Capture the exact failing Story + raw provider response + normalized error, perform final canonical reset, report BLOCKED/FAILED, and STOP.

Network/auth/transient infrastructure errors may be distinguished from semantic/protocol defects, but do not conceal a reproducible runtime defect with retries.

## Required scenario coverage

### A. Fixture / Opening / literal-choice integrity

- Apply the Level-7 seam once and prove level 7 derives existing strong CSA capability without manufacturing semantic game state.
- Complete setup/opening through the normal flow.
- Opening must expose exactly four non-empty literal choices.
- Select at least one displayed literal choice exactly as shown and prove that exact literal becomes `player_action`; no silent semantic substitution.

### B. Multi-turn ordinary continuity

Run ordinary workplace/dialogue turns long enough to establish several continuity facts such as work commitments, refusals/boundaries, relationship reactions, or scene changes.

For each committed turn verify:
- Story succeeds;
- Extract observes every supplied parser-owned body block structurally with exactly one `block_observations` entry per supplied observation block;
- `facts: []` is allowed for genuinely zero-fact blocks;
- nested facts, when present, retain registered IDs and exact quote provenance;
- Commit succeeds without a semantic hard gate;
- committed `turn_summary` is the Extract-authored string for that Story, not server-synthetic text.

### C. Scene / navigation / presence

Exercise at least one player navigation or NPC-directed location interaction through normal player input/choice.

Verify:
- explicit player navigation wins over stale/conflicting presentation state;
- moving/visiting an NPC does not fabricate a duplicate NPC or wrong speaker identity;
- canonical scene/location/presence remains consistent after Commit and in the next Story context.

### D. CSA natural-rule behavior at Level 7

Use normal app/transaction paths to exercise at least one CSA rule available under Level-7 capability, including strong capability if the existing catalog/product flow permits it.

Verify:
- CSA remains institutional rule/context input, not a second physical-story engine;
- Story authors the natural observable HOW;
- Extract observes actual Story outcomes;
- rule compliance does not mechanically imply consent, comfort, affection, trust, emotion, intimacy, or a physical outcome that Story did not show;
- no old direct-coverage/mandatory-enactment/physical-action grammar becomes a gameplay hard gate.

Do not directly patch CSA state in DB.

### E. Open observation durability

Produce multiple meaningful Story outcomes across different domains when they arise naturally: agreement/refusal, work, relationship/emotional reaction, physical/clothing/intimate facts, etc.

Verify:
- open facts are accepted from arbitrary exact Story observations without closed event/relation/posture/sexual taxonomies defining whether the fact exists;
- canonical durable observations survive Commit/history/context;
- source block and exact quote provenance remain valid;
- block observations are raw observations, not a `worth remembering`/importance filter.

### F. Turn-summary memory beyond the raw three-turn window

Create at least one continuity fact/commitment early enough that it falls outside the latest three raw Story turns.

After at least four newer committed turns:
- inspect the next Story request/context;
- prove the old raw Story body is no longer duplicated in `context.recent_turns`;
- prove its committed `turn_summary` appears in chronological `context.turn_summary_memory`;
- prove stale `story_summary_overall` / `story_summary_recent` is not competing in the fresh Story input;
- verify later Story can preserve the earlier continuity without inventing details beyond current canonical state + summary/open observations.

This is a required acceptance point, not optional.

### G. Feedback-revision parity

If the existing normal acceptance harness supports feedback revision safely, revise one committed turn through the canonical feedback path and verify the active revised Story is aligned with its regenerated Extract `turn_summary`, with no duplicate active turn or stale summary winning.

If the existing harness cannot safely express feedback revision, record `NOT EXERCISED — harness limitation` with source proof; do not invent a new broad harness solely for this row unless CURRENT_TASK/AGENTS already permits the narrow addition.

### H. Deep physical / intimate domain

Continue the scenario far enough to exercise at least one deeper physical/intimate interaction when the game's normal Level-7 state/rules and player steering make it contextually reachable. Sexual/intimate behavior is a coverage domain, not a required forced outcome on a specific turn.

Verify when such content occurs:
- exact player action kind/strength/scope is not silently substituted;
- Story remains the author of what actually happens;
- Extract preserves exact-evidence observations without requiring a closed narrative sexual-action enum;
- compact clothing/image tags may project presentation state but do not decide narrative truth;
- institutional CSA compliance remains separate from NPC personal acceptance/consent/emotion/relationship reaction.

Do not force a synthetic semantic state merely to satisfy this row. If the scenario remains legitimately not yet contextually reachable after substantial natural play, report the exact reached state and coverage gap rather than mutating DB state.

### I. Post-deep continuity and recovery

After any deep physical/intimate turn, continue for several additional committed turns if reached and verify:
- continuity survives subsequent turns;
- prior facts/summary memory remain coherent;
- scene/presence and relationship/world context do not snap back merely because the recent raw window moved;
- no turn is left stuck in processing state.

Finally reset the dedicated TEST game through the canonical reset path and prove:
- committed_turn = 0;
- actions = 0;
- turns = 0;
- processing_status / pending action state clean;
- player_setup/opening reset to baseline;
- Level-7 fixture state is gone and player progression is baseline level 1 unless the canonical reset contract defines otherwise;
- CSA active state empty/baseline;
- canonical Scene v1 baseline restored;
- no preserved manual game was accessed.

## Acceptance criteria

PASS only if all mandatory structural scenarios A-F and I's final-reset proof succeed, and no decisive architectural defect is observed.

Rows G/H may be reported as explicit coverage gaps only when the normal product/harness path genuinely cannot reach them without prohibited synthetic state. Do not mislabel an untested row as PASS.

Any first decisive Story/Extract/Commit/context/history authority failure is enough to BLOCK/FAIL the acceptance. Preserve evidence and STOP rather than patching inline.

## Forbidden operations

- Production access/deploy/mutation.
- Any access/mutation/reset of manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- Any migration edit/apply/reapply/rollback.
- Direct manual DB edits to manufacture gameplay semantics or Level 7.
- New provider/model/temperature/token configuration except the explicit TEST-only diagnostic flag.
- Retry/regeneration/fuzzy semantic repair/synthetic facts/synthetic summaries.
- Source/runtime patch after the execution lease starts.
- Frontend deployment.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- `git clean -fd`, `git reset --hard`, deletion/move/commit of preserved evidence.

## Completion / terminal report

Before terminal report:
1. final-reset the dedicated TEST game even on failure;
2. verify PR #67 remains OPEN / DRAFT / UNMERGED;
3. verify repository preserved evidence remains the same approved snapshot and no new repo evidence artifact was created;
4. report exact deployed executable SHA and TEST Worker Version ID;
5. report exact scenario matrix A-I as PASS / FAIL / NOT EXERCISED with evidence references;
6. report every action id/turn where a defect occurred;
7. if Extract protocol fails, include raw provider response and exact block mapping from the TEMP evidence bundle;
8. report committed `turn_summary` and older summary-memory proof for scenario F;
9. report final reset state;
10. report TEMP evidence path + SHA-256.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push only that completion-state docs change if needed, post one immutable terminal report to Issue #68, and STOP. Do not patch the defect or generate the next task yourself.

## V4 terminal result — BLOCKED at first decisive commit boundary

- Executed exact reviewed executable `1ffc3ca269fcf34d748d5380c2b70be19696b5d4` on TEST Worker `game-proxy-company-v1`, Version `997a89f4-f129-4fca-b42c-d1ee62df0bfd`.
- Stage B action gate and Scene Stage A gate dry-run: PASS. Level-7 seam `prepare_company_test_level7_fixture` was invoked exactly once for the dedicated TEST game and returned `test_only=true`, `player_progress.level=7`, `reset_before_seed=true`.
- Initial TEST readback: `committed_turn=0`, `save_revision=920`, `processing_status=idle`, setup/opening `not_started`, `actions=0`, `turns=0`.
- Opening PASS: four unique non-empty literal choices; Turn 1 used the first displayed literal unchanged.
- Turn 1 Story PASS and Extract PASS. Action `f1f599f5-6349-44f5-8306-dd5c698125bf`, expected turn 1. Extract returned three exact `open_facts` with `source_block=story:0`, exact Story quotes, and `turn_summary`.
- First decisive failure: `/api/commit` HTTP 422, `invalid_open_fact`, `Unknown observation field: fact_id`. No retry, regeneration, source patch, provider change, or manual DB repair was performed.
- The failure evidence is outside the repository at `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v4-evidence.json`, SHA-256 `EE1A086291BE01EFB866E5C21EFE97F0B96AAD01458E71078D07A78695B61C7E`.
- Final canonical reset PASS: `committed_turn=0`, `save_revision=926`, `processing_status=idle`, setup/opening `not_started`, `csa_active=[]`, `actions=0`, `turns=0`, Level-7/player progression baseline restored. Preserved manual game was not accessed.
- Scenario matrix: A `PASS` through opening/literal choice; B `FAIL` at Turn 1 Commit; C/D/E/F/G/H/I `NOT EXERCISED` after the decisive failure, except I final reset `PASS`.
- API deploys in this task: 1 TEST-only; frontend deploys 0; migrations 0; Production access 0. Acceptance is `BLOCKED` pending the commit open-fact contract correction and a separately authorized reviewed rerun.

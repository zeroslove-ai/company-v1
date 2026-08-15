# Company v1 — CURRENT TASK

Status: READY
Task ID: deep-level7-live-acceptance-v5
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted / reviewed starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Exact reviewed executable to test: `0627f01d5118e3a936d9280fb8f889644137550c` (`open-fact-persisted-read-contract-v1`).
Operator ACCEPTED review: Issue #68 comment `5300826049`.
Previous V4 blocker evidence: Issue #68 comment `5300672729`.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Existing Level-7 migration `20260815000100 / company_v1_test_level7_acceleration` is already applied. Do not edit or reapply it.
Preserved manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must not be accessed.

Durable preserved-evidence authority: `docs/audit/PRESERVED_EVIDENCE_APPROVAL_2026-08-15.md`. The unchanged approved 16-path untracked snapshot carries forward automatically. All new V5 evidence must be written under OS TEMP, never inside the repo.

Canonical loop under acceptance:
`player input / literal choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.

## Why V5 exists

V4 proved the new block-local Extract wire itself succeeded on Turn 1 and produced canonical open facts + turn_summary, but Commit rejected its own persisted canonical fact metadata (`fact_id`) because the persisted reader reused the fresh/provider allowlist.

Accepted source correction `0627f01...` now:
- keeps fresh provider block facts narrow (`subject_id/object_id/fact_text/story_quote` only);
- validates persisted canonical `fact_id/action_id/turn_number/source_block` separately;
- checks deterministic identity, action/turn boundary, registered IDs, exact Story quote, parser-owned source block;
- passes parser-owned Story blocks to persisted read in replay and Commit;
- proves fresh normalize -> persisted read -> reducer round trip with non-empty turn_summary.

V5 must determine whether the real TEST runtime now survives that boundary and then continue deep scenario coverage beyond the first turn.

## Mandatory preflight

Before live mutation:
1. Fresh-fetch PR #67 and verify base `main`, OPEN, DRAFT, UNMERGED.
2. Verify exact executable `0627f01d5118e3a936d9280fb8f889644137550c` is an ancestor of current branch HEAD and any descendant delta is docs/workflow-only.
3. Record current TEST Worker version/config. V4 left `COMPANY_V1_EXTRACT_DIAGNOSTIC=true` on TEST; do not assume otherwise—verify.
4. Verify Level-7 migration already exists; do not reapply.
5. Verify dedicated TEST game id exactly and prove current canonical baseline before acceleration: committed_turn=0, level1/exp0, setup/opening not_started, csa_active empty, actions=0, turns=0.
6. Do not access preserved manual game.
7. Verify repo dirt is only the already-approved preserved evidence snapshot.
8. New evidence bundle must be under `%TEMP%` / OS TEMP.

If identity cannot be proven, STOP before deployment/live mutation.

## Authorized TEST operations

1. Deploy exactly executable SHA `0627f01d5118e3a936d9280fb8f889644137550c` to TEST API Worker `game-proxy-company-v1` only.
2. Enable `COMPANY_V1_EXTRACT_DIAGNOSTIC=true` only while this TEST acceptance runs.
3. Run existing guarded `prepare_company_test_level7_fixture` exactly once for the dedicated TEST game.
4. Run normal TEST setup/opening/Story/Extract/Commit/context/history/app flows required below.
5. On first decisive architecture/protocol defect: capture evidence, do not retry/regenerate/patch, canonical-reset the dedicated TEST game, report, STOP.
6. At task finalization (PASS or FAIL), disable `COMPANY_V1_EXTRACT_DIAGNOSTIC` again on TEST and prove health/config. If disabling requires a redeploy, it must use the exact same reviewed executable `0627f01...`; no source change is authorized.
7. Always final-reset the dedicated TEST game and prove clean baseline.

No migration apply/edit is authorized.

## Evidence handling

Use one TEMP bundle such as `%TEMP%/company-v1-deep-level7-v5-evidence.json`.
Capture at minimum:
- PR/branch/executable identity;
- TEST Worker version + diagnostic state before/after;
- Level-7 seam result;
- each exact player input / selected literal choice;
- action ids / expected turns;
- raw Story, parsed Story body blocks;
- raw provider Extract response when diagnostic is available;
- normalized Extract response;
- canonical open_facts before Commit and committed/readback form;
- Commit result;
- committed turn_summary;
- context/history after Commit;
- scene/location/presence/CSA state;
- later Story input proving latest-three raw + older summary-only memory;
- final reset proof;
- final diagnostic-disabled proof.

Terminal report must include TEMP path + SHA-256. Never commit evidence.

## No-retry / no-mask rule

For Story/Extract/Commit/context/history authority defects:
- no retry;
- no regeneration;
- no provider/model/temperature/token change;
- no source/prompt/parser patch;
- no fuzzy repair;
- no synthetic facts/summary/state;
- no manual DB repair.

Stop at first decisive reproducible defect after evidence capture and final cleanup.

## Required scenario coverage

### A. Fixture / Opening / literal-choice integrity
- Level-7 seam exactly once; no synthetic semantic state.
- Normal setup/opening.
- Exactly four non-empty unique opening choices.
- Select at least one displayed literal unchanged and prove exact literal becomes player_action.

### B. Multi-turn ordinary continuity + open-fact round trip
Run multiple ordinary workplace/dialogue turns.
For every committed turn verify:
- Story succeeds;
- Extract structurally accounts for every parser-owned Story body block via one `block_observations` entry per block;
- `facts: []` works for zero-fact blocks;
- nested facts keep registered IDs and exact quote provenance;
- normalized canonical facts contain server metadata;
- persisted-read/Commit accepts those canonical facts without self-rejection;
- durable `open_observations`/history/context preserve provenance;
- committed `turn_summary` equals Extract-authored summary, not server synthesis.

### C. Scene / navigation / presence
Exercise player navigation or NPC-directed movement/visit.
Verify no duplicate/wrong NPC creation, no wrong speaker identity, explicit player navigation authority, and canonical scene/location/presence continuity through next Story.

### D. CSA natural-rule behavior at Level 7
Use normal app/transaction path for at least one applicable CSA, including strong capability if naturally available.
Verify CSA is institutional context only, Story authors observable HOW, Extract observes Story, and compliance does not mechanically imply consent/comfort/affection/trust/emotion/physical outcome.

### E. Open semantic durability
Across turns, when naturally present, preserve arbitrary work/agreement/refusal/relationship/emotion/physical/clothing/intimate observations without closed semantic event/relation/posture/sexual taxonomy deciding existence.
Block facts are observations, not importance gates.

### F. Turn-summary memory beyond latest 3 raw turns — mandatory
Create an early continuity fact/commitment and continue at least four newer committed turns.
Then inspect the next Story request/context and prove:
- old raw Story body is outside `context.recent_turns`;
- its committed summary appears chronologically in `context.turn_summary_memory`;
- stale `story_summary_overall` / `story_summary_recent` does not compete in fresh Story input;
- later Story preserves continuity without inventing unsupported detail.

### G. Feedback revision parity
If existing normal harness safely supports it, revise one committed turn through canonical feedback flow and verify active revised Story + regenerated turn_summary align with one active revision. If harness genuinely cannot, report `NOT EXERCISED — harness limitation` with source proof; do not invent broad new harness.

### H. Deep physical / intimate coverage
Continue naturally far enough to exercise deeper physical/intimate behavior when Level-7 state/rules/player steering make it reachable. This is a coverage domain, not a forced outcome on a specific turn.
When reached verify player action kind/strength/scope fidelity, Story authors what actually happens, Extract preserves exact evidence without closed sexual-action truth gate, compact clothing/image tags remain projection-only, and CSA compliance stays separate from personal acceptance/consent/emotion/relationship.
If substantial natural play still cannot reach it without prohibited synthetic state, report exact reached state and coverage gap.

### I. Post-deep continuity / cleanup
After any deep turn, continue several turns if reached and verify continuity does not snap back and no processing state sticks.
Always final-reset and prove:
- committed_turn=0;
- actions=0;
- turns=0;
- processing/pending clean;
- setup/opening baseline;
- progression baseline level1/exp0 unless canonical reset contract says otherwise;
- csa_active empty/baseline;
- Scene v1 setup baseline;
- manual game untouched;
- TEST Extract diagnostic disabled.

## Acceptance criteria

PASS only if mandatory A-F plus final cleanup in I succeed and no decisive architecture/protocol defect occurs.
G/H may be explicit coverage gaps only if normal product/harness path genuinely cannot reach them without prohibited synthetic state.
Do not mislabel untested rows as PASS.

## Forbidden

- Production access/deploy/mutation.
- Any access/mutation/reset of preserved manual game.
- Migration edit/apply/reapply/rollback.
- Direct semantic DB edits.
- Provider/model/temperature/token changes other than TEST-only diagnostic flag.
- Retry/regeneration/fuzzy repair/synthetic facts/summaries.
- Source/runtime patch after lease starts.
- Frontend deployment.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- `git clean -fd`, `git reset --hard`, deletion/move/commit of preserved evidence.

## Terminal report

Before terminal report:
1. final-reset dedicated TEST game even on failure;
2. disable TEST Extract diagnostic and prove it;
3. verify PR #67 OPEN/DRAFT/UNMERGED;
4. verify preserved repo evidence unchanged and no new repo artifact;
5. report exact deployed executable + Worker Version(s);
6. report scenario A-I PASS/FAIL/NOT EXERCISED with evidence references;
7. report every failing action/turn if any;
8. report open-fact persisted round-trip proof and scenario F summary-memory proof if reached;
9. report final reset state;
10. report TEMP evidence path + SHA-256.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push only the completion-state docs update if needed, post one immutable terminal report to Issue #68, and STOP. Do not patch a discovered defect or generate the next task yourself.

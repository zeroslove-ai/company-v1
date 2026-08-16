# Company v1 — CURRENT TASK

Status: READY
Task ID: opening-literal-choice-live-closure-v2
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306830655` ACCEPTED `canary-opening-choice-option-plumbing-fix-v1`.
Reviewed harness/source-test SHA: `5c14561f478859309c26100c6d9217734a23018b`.
Previous live blocker: `opening-literal-choice-live-closure-v1`, terminal comment `5306542914`; operator review `5306683174` accepted the blocker as harness-wiring evidence, not gameplay failure.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` only.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production is forbidden.

## Proven state

- Setup/Opening world-authority migration is already applied on TEST.
- Live SQL duplicate semantic allowlists were removed while dynamic registered-character integrity remained.
- The previous bounded run reached valid Setup, valid Opening with exactly four non-empty unique provider-authored literals, ordinary Story -> Extract -> Commit, same-action replay, free-text Turn 2, and final reset.
- Exact Opening literal round-trip failed only because the canary read `openingChoiceIndex` from the raw-token Set instead of the parsed top-level option.
- Reviewed harness SHA `5c14561...` fixes that exact plumbing defect. Index `0` is preserved and selects `canonical_choices[0]` unchanged.
- No gameplay/runtime/provider/parser/DB defect is presently proven by the prior blocker.

## Objective

Run one bounded TEST-only closure proving an actual provider-returned Opening choice literal is selected by the reviewed canonical canary and submitted unchanged as Turn-1 `player_action`, then committed/read back/replayed through the normal gameplay path. If this passes, close this acceptance gap and do not create further Opening-choice harness work.

## Required work

1. Freeze START HEAD and verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Verify the working lineage contains reviewed harness SHA `5c14561f478859309c26100c6d9217734a23018b` and no unreviewed executable delta affecting this live run.
3. Use the existing canonical canary only. Do not create a new script/parser/client protocol.
4. Use only dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
5. Canonical reset at start if needed; verify clean turn/action state before Setup.
6. Run valid Setup and Opening through the currently deployed TEST runtime.
7. Opening must return exactly four non-empty unique canonical/provider-authored choices. Do not retry/regenerate if it does not.
8. Invoke the reviewed Cut-1 harness option with explicit `--opening-choice-index 0` (or another explicitly recorded valid index only if the harness invocation contract requires it; no semantic substitution).
9. Capture and prove, in the same run:
   - the exact returned Opening literal selected;
   - canary `opening.next_player_action.player_action` equals that literal string-for-string;
   - Turn-1 Story request/player_action equals that same literal;
   - Story -> Extract -> Commit succeeds;
   - committed action/history/readback preserves the exact literal;
   - same-action replay preserves action identity and does not advance committed_turn/save_revision;
   - one ordinary free-text Turn 2 still succeeds as a sanity check.
10. Do not turn choice selection into a semantic taxonomy. No numbering, metadata, normalization, trim, fallback, truncate/pad, retry, fuzzy repair, parser relaxation, or provider/model/config change.
11. Do not modify source, migration, DB functions, runtime semantics, frontend, CSA, scene, progression, clothing, open-fact memory, sexual/media/image adapters, or choice authority during this task.
12. Final canonical reset is required after evidence capture; verify committed_turn=0 and zero action/turn rows.
13. Preserve one evidence artifact outside the repository if the canary normally produces one. Do not commit generated evidence.

## Architecture constraints

- Provider authors the four literal choices. Harness may select and transport one only.
- One ordinary gameplay protocol and one canonical action writer.
- Exact literal identity is the acceptance target; server-authored fallback prose remains forbidden.
- This is acceptance, not a new feature cut.
- Do not add any new gate, compatibility adapter, semantic layer, parser, retry, or fallback.
- Setup/stable identity, canonical scene, compact clothing UI projection, open narrative memory, CSA lifecycle, and media/image presentation boundaries remain unchanged.

## Authorized operations

Authorized:
- read-only Git/PR inspection;
- dedicated TEST reset/setup/opening and bounded two-turn live gameplay through the existing deployed runtime;
- same-action replay/readback;
- final dedicated TEST reset;
- evidence artifact outside repo;
- docs-only completion record.

Not authorized:
- source/test/runtime/config edits;
- migration/DDL application or DB function patch;
- API/frontend deployment;
- Production access;
- any access to preserved manual game;
- provider/model/temperature/token changes or retry/regeneration;
- parser changes/relaxation, fuzzy repair, compatibility workaround;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if one actual provider-returned Opening literal is transported unchanged through Turn-1 action -> Story -> Extract -> Commit -> committed readback and same-action replay, free-text Turn 2 remains usable, and final reset returns the dedicated TEST game to canonical turn 0.

On the first deterministic failure, preserve exact evidence and STOP BLOCKED. Do not retry or patch around it.

## Completion

On PASS or first deterministic blocker:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit;
- post one immutable terminal report to Issue #68 containing exact START SHA, reviewed harness SHA, selected Opening literal/index, Turn-1 exact-literal proof, Story/Extract/Commit/replay result, Turn-2 result if reached, final reset/readback, operations performed, and FINAL_DOCS_SHA;
- STOP for operator review. Do not generate the next task yourself.

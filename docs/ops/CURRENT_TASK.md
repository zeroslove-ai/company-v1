# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-story-body-protocol-root-cause
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The prior live navigation acceptance deployed the reviewed navigation executable `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd` to the TEST API and passed reset/setup/opening, but the Golden Path stopped at Turn 1 Story before Extract/Commit/navigation assertions.

Observed failure:

- Story endpoint: HTTP 200 SSE
- raw provider delta was observed
- terminal runtime error: `story_protocol_invalid: Story body is missing`
- Extract/Commit not reached
- navigation acceptance not reached
- final TEST reset/readback clean

This is not evidence that the navigation authority fix failed. The next task must prove the exact Story protocol root cause before any further Scene acceptance or Stage B work.

## Binding operator review

Read the Issue #68 operator review for:

- `TASK_ID: cut2-navigation-fix-deploy-live-acceptance`
- `REVIEW: ACCEPTED`
- `VERIFIED_SHA: e90252e260bfe0f01832109391ee43a5b2caf69a`

Key accepted facts:

- navigation source must not be changed based on this failure
- PR #67 remained Draft/Open/Unmerged
- TEST was independently clean after the failed run
- source inspection narrowed the failure boundary to Story provider output / stream accumulation / Story wire+fresh parser handling

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Task-registration parent HEAD: `e90252e260bfe0f01832109391ee43a5b2caf69a`
Reviewed navigation executable lineage: `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before edits:

1. verify current branch/HEAD and ancestry
2. inspect every executable delta after `c3fc61f...`; task-registration/review handoff must be docs/workflow-only before your new work
3. verify PR #67 remains Draft/Open/Unmerged
4. do not touch preserved manual playtest evidence

## TEST scope

TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Manual playtest game: `78fb1d94-266f-455a-bda4-7656cc2370c1` — DO NOT RESET OR MUTATE.
Production: forbidden.

Last operator readback after prior failure:

- committed_turn = 0
- save_revision = 858
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- canonical scene v1 at `setup`, location null, empty presence

Do not mutate TEST unless a narrow reproduction is necessary after static/local evidence. If TEST is used, final reset of only the dedicated TEST game is mandatory.

## Goal

Determine and repair the single root cause of `story_protocol_invalid: Story body is missing` without broadening architecture or masking the failure.

You must classify the failure into one proven category before patching:

A. provider emitted no valid visible Story body despite emitting deltas
B. OpenAI-compatible SSE parser/stream accumulation lost or misclassified provider content
C. Story wire decoder altered presentation only while `upstreamRaw` remained correct, exposing a separate full-parser mismatch
D. canonical Story composition/fresh parser incorrectly rejected valid provider body
E. temporary acceptance runner misread the server SSE terminal state while server persistence was actually valid
F. another concrete cause demonstrated by evidence

Do not guess. Preserve the exact failing bytes/events or construct a deterministic equivalent that proves the same boundary.

## Required investigation

Inspect at minimum:

- `src/api/llm.js`
- Story route in `src/api/turn-routes.js`
- `src/engine/story-wire-protocol.js`
- `src/engine/fresh-narrative-parser.js`
- `src/engine/csa/mandatory-enactment.js`
- relevant Story/narrative protocol tests and live canary behavior

Trace one Story response through:

`provider SSE -> parseOpenAiSse -> streamStory chunks -> upstreamRaw -> composeCanonicalStory -> parseFreshNarrativeV2 -> persisted Story result / emitted terminal SSE`

Record for the failing shape:

- exact upstream SSE delta content shape
- accumulated `upstreamRaw` length/content class
- canonical Story length/content class
- parsed block types before failure when available
- whether UI-visible wire events can diverge from full-parser acceptance
- whether the temporary runner is interpreting server SSE correctly

## Repair rules

A source change is allowed only after root cause is proven.

Allowed:

- minimal correction at the proven authority/protocol boundary
- focused regression tests that fail before and pass after
- deletion of a superseded/broken path if caller/evidence proves it is no longer needed
- docs/audit updates describing the exact defect and fix

Forbidden:

- provider or model change
- retry/regeneration loop to make the test pass
- semantic hard gate added to compensate for malformed architecture
- a third narrative parser generation
- compatibility code solely to preserve stale tests
- navigation authority changes
- Scene reducer changes unrelated to this Story failure
- migration edits/apply
- Scene Stage B apply
- API/frontend deploy in this task
- Production access
- manual playtest mutation/reset
- PR Ready/merge
- broad Cut 3+ work

If the evidence proves the provider simply violated the existing valid protocol on this single stochastic sample and no runtime defect exists, do not add compatibility or retry code. Report BLOCKED/FAILED with the captured evidence and stop for operator decision.

## Required tests

At minimum run the focused suites covering:

- narrative protocol/fresh parser
- Story request/response protocol
- frontend stream contract only if the failure crosses the server/client SSE boundary
- navigation authority regression to prove no collateral change

Then run the full Company v1 suite if source changed.

The regression must include the exact structural shape that produced `Story body is missing` or a byte-equivalent/minimal deterministic reproduction.

## Live reproduction policy

Prefer static/local deterministic reproduction first.

A single narrow TEST Story reproduction is allowed only if needed to distinguish provider output from runtime parsing. No automatic retry. Capture the first result and stop if it is materially informative.

If TEST is touched:

- use only `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- do not deploy
- do not mutate manual playtest game
- final reset and readback are mandatory

## Success criteria

Success requires all of the following:

1. root cause category is proven with concrete evidence
2. if runtime defect: minimal root-cause patch exists at the correct boundary
3. focused regression demonstrates fail-before/pass-after semantics
4. navigation authority tests remain green and navigation source is unchanged unless evidence unexpectedly proves direct coupling
5. full suite passes if source changed
6. PR #67 remains Draft/Open/Unmerged
7. no deploy, migration, Stage B, Production, manual-playtest mutation
8. TEST ends clean if used
9. exact executable candidate SHA is reported separately from any docs-only terminal descendant

## Stop boundary

Do not rerun full navigation live acceptance in this task.
Do not deploy the repair in this task.
Do not apply Scene Stage B.

After a successful runtime fix, stop for operator review so the next task can deploy the exact reviewed candidate and rerun the navigation acceptance.

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-story-body-protocol-root-cause
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- root cause classification (A-F) and evidence
- exact failing data/event shape
- files changed and why
- executable candidate SHA
- docs-only descendant SHA if any
- focused tests + full suite result when applicable
- navigation regression result
- PR #67 state
- TEST use/write/reset summary
- deployment = 0
- migration/Scene Stage B apply = 0
- frontend deploy = 0
- Production access = 0
- manual playtest mutation/reset = 0
- exact STOP state

Success phrase:

`CUT 2 STORY BODY PROTOCOL ROOT CAUSE RESOLVED — AWAITING OPERATOR REVIEW`

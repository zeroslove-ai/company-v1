# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: cut2-story-visible-body-contract-closure
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The prior task `cut2-story-body-protocol-root-cause` correctly stopped BLOCKED instead of guessing.

Accepted prior evidence:

- the original live failure was a real server terminal error: `story_protocol_invalid: Story body is missing`
- the historical failure artifact did not preserve the exact upstream SSE bytes / delta text / `upstreamRaw`, so the original occurrence cannot now be proven as provider category A versus stream category B
- deterministic standard SSE with a valid visible body is accumulated correctly
- `parseFreshNarrativeV2()` accepts a valid visible body
- a deterministic THOUGHT+CHOICE-only response reproduces exactly `STORY_PROTOCOL_INVALID / Story body is missing`
- a single authorized TEST reproduction later succeeded, so the original stochastic occurrence did not reproduce on demand
- the dedicated TEST game was returned clean

The operator therefore does **not** claim the original A/B root cause is proven.

However, independent source inspection establishes a separate contract defect that must be closed before another live acceptance:

- the fresh parser requires at least one non-empty `scene`, `narrative`, `dialogue`, or `acting` body block
- Story output rules strongly require one player-only `[THOUGHT]` and four `[CHOICE]` blocks, but do not state with equivalent explicitness that THOUGHT/CHOICE alone are invalid and that at least one non-empty visible Story body is mandatory
- therefore the generation contract is weaker than the parser acceptance contract

This task closes that exact prompt/parser contract gap. It must not loosen the parser, add retries, change provider/model, or claim to have reconstructed missing historical bytes.

## Binding operator decision

Issue #68 prior terminal report:

- Task: `cut2-story-body-protocol-root-cause`
- Status: `BLOCKED`
- Final SHA: `4dd46cc3c56c8c3ae4d74599929ebf736c1a303a`
- report comment: `5293233088`

Operator independently verified after that run:

- dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` is clean
- committed_turn = 0
- save_revision = 862
- actions = 0
- turns = 0
- player setup/opening = not_started
- canonical scene v1 = setup / location null / empty presence
- PR #67 remained OPEN / DRAFT / UNMERGED

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Task-registration parent HEAD: `4dd46cc3c56c8c3ae4d74599929ebf736c1a303a`
Reviewed navigation executable lineage: `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before edits:

1. verify current branch/HEAD and ancestry
2. verify the task-registration commit is docs/workflow-only relative to the prior executable lineage
3. verify no operator review already handled this exact task identity
4. verify PR #67 remains Draft/Open/Unmerged
5. do not touch preserved manual playtest evidence

## Goal

Make the Story generation contract explicitly match the existing fresh parser acceptance contract:

> Every generated Story must contain at least one non-empty player-visible Story body segment in addition to THOUGHT and CHOICE. Plain narrative text, SCENE, DIALOGUE, or ACTING can satisfy the body requirement. THOUGHT and CHOICE do not count as Story body. A THOUGHT+CHOICE-only response is invalid.

This is a contract-alignment change, not a parser relaxation and not a retry policy.

## Required source inspection

Inspect at minimum:

- `src/engine/story-prompt.js`
- `src/engine/fresh-narrative-parser.js`
- `src/engine/story-wire-protocol.js`
- `src/api/turn-routes.js` only to confirm the contract boundary and no unrelated change is needed
- `test/narrative-request-contract.test.mjs`
- `test/narrative-protocol.test.mjs`
- any current prompt-boundary test that already owns `DURABLE_STORY_RULES`

Confirm before patching:

1. `parseFreshNarrativeV2()` rejects when there is no non-empty scene/narrative/dialogue/acting block
2. THOUGHT and CHOICE are presentation/control outputs and are not counted by `hasBody`
3. the Story prompt does not currently state this parser requirement explicitly enough to make THOUGHT+CHOICE-only output unambiguously invalid

If any of these three facts is false at current HEAD, STOP BLOCKED with evidence; do not force this task through.

## Required implementation

Prefer the smallest correct change at the generation-contract boundary.

Expected shape:

- strengthen the durable Story output protocol in `src/engine/story-prompt.js`
- explicitly require at least one non-empty visible Story body in every response
- explicitly state that `[THOUGHT]` and `[CHOICE]` alone do not satisfy the body requirement
- preserve plain narrative as valid; do **not** require `[SCENE]` if the existing contract allows plain narrative
- preserve exact registered speaker IDs / ACTING rules / THOUGHT ownership / exact-four CHOICE rules

Do not change `parseFreshNarrativeV2()` merely to accept bodyless output.
Do not add fallback prose.
Do not synthesize a body in the Worker.
Do not add retry/regeneration.
Do not change provider/model/temperature/token limits.

## Required regression tests

Add or strengthen focused tests proving the contract boundary.

At minimum prove:

1. built Story prompt explicitly contains the mandatory visible-body requirement
2. prompt explicitly distinguishes visible body from THOUGHT/CHOICE
3. parser still rejects a deterministic THOUGHT+CHOICE-only Story with `STORY_PROTOCOL_INVALID / Story body is missing`
4. parser still accepts:
   - plain narrative body + THOUGHT + four CHOICE blocks
   - valid SCENE body + THOUGHT + four CHOICE blocks
   - valid DIALOGUE or ACTING body where current contract already permits it
5. navigation authority regression remains green and no navigation source changes occur

Avoid brittle whole-prompt snapshots. Test the durable semantic requirement, not incidental wording beyond what is necessary.

## Validation

Required:

- focused Story prompt / narrative protocol tests
- navigation authority regression tests
- any prompt-boundary tests affected by the change
- full `npm test` if source or tests changed
- syntax checks for modified JS/MJS
- `git diff --check`

Report exact counts.

## Allowed

- minimal source change in Story generation contract
- focused tests
- docs/audit update after validation if needed
- docs-only CURRENT_TASK completion update
- normal Git commit/push on the existing branch
- Issue #68 lease / terminal report

## Forbidden

- API or frontend deploy
- TEST live Story reproduction in this task
- TEST DB writes/reset
- migration edits/apply
- Scene Stage B apply
- Production access
- manual playtest mutation/reset
- provider/model/config change
- retry/regeneration loop
- parser relaxation to accept bodyless output
- fallback/synthetic Story body
- third parser generation
- navigation authority or Scene reducer changes
- broad Cut 3+ work
- PR Ready/merge
- historical migration edits

## Success criteria

Success requires all of the following:

1. prompt/parser contract mismatch is demonstrated at pre-patch HEAD
2. durable Story prompt explicitly requires at least one non-empty visible Story body
3. THOUGHT+CHOICE-only remains invalid at parser boundary
4. no parser relaxation/fallback/retry/provider change
5. focused regressions pass
6. full suite passes
7. navigation authority tests remain green
8. PR #67 remains Draft/Open/Unmerged
9. deployment/migration/TEST write/Production/manual playtest mutation = 0
10. exact executable candidate SHA is reported separately from any docs-only terminal descendant

## Stop boundary

Do not deploy the candidate.
Do not rerun live navigation acceptance.
Do not apply Scene Stage B.

After success, set this task to `Status: WAITING_REVIEW`, commit/push the source+tests and any docs-only completion state, post the terminal report to Issue #68, and STOP for operator review.

The next operator task, if this candidate is accepted, will deploy the exact reviewed executable and rerun the existing navigation live acceptance with full SSE/event capture retained for any Story failure.

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-story-visible-body-contract-closure
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- pre-patch prompt/parser mismatch evidence
- exact files changed
- exact durable output-contract rule added
- tests added/changed
- focused + full suite results
- navigation regression result
- executable candidate SHA
- docs-only descendant SHA if any
- PR #67 state
- TEST writes/reset = 0
- deployment = 0
- migration/Scene Stage B = 0
- frontend deploy = 0
- Production access = 0
- manual playtest mutation/reset = 0
- exact STOP state

Success phrase:

`CUT 2 STORY VISIBLE BODY CONTRACT CLOSED — AWAITING OPERATOR REVIEW`

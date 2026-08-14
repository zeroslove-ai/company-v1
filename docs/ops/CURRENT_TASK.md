# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-navigation-live-acceptance-after-story-contract
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 2 Scene Stage A is live, but its final navigation acceptance was interrupted by a Turn 1 Story terminal error before the navigation assertions could run.

The prior diagnostic task correctly stopped BLOCKED because the original failing provider bytes were not preserved and category A vs B could not be reconstructed without guessing.

The immediately completed task `cut2-story-visible-body-contract-closure` then closed a separately proven generation-contract mismatch without relaxing the parser:

- fresh parser already requires at least one non-empty visible Story body (`scene`, `narrative`, `dialogue`, or `acting`)
- THOUGHT and CHOICE do not satisfy that body requirement
- Story output rules now explicitly require at least one non-empty player-visible body in addition to THOUGHT and four CHOICE blocks
- THOUGHT+CHOICE-only output remains invalid
- parser, retry policy, provider/model, token limits, navigation authority, and Scene reducer were not changed

Operator review accepted exact executable candidate:

`72012e00685bb12ed0defe66f52df44613cc1a20`

This task deploys that exact reviewed executable-equivalent source to the TEST API and reruns the previously blocked narrow Scene/navigation live acceptance. It does not authorize Scene Stage B.

## Mandatory authority / operating rules

Before any operation, read and obey:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 operator review for `cut2-story-visible-body-contract-closure`
7. relevant Cut 2 acceptance failure reports only as evidence, not authority

Binding principles:

- current Git/source/live TEST DB/deployed identity outrank completion prose
- one durable domain has one canonical writer
- no compatibility code for stale tests
- no retry/provider/model/semantic hard gate used to hide a structural problem
- historical applied migrations are immutable
- superseded writer/reader/gate/test is removed in its proven Cut rather than carried indefinitely
- manual playtest evidence is preserved

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Reviewed executable candidate: `72012e00685bb12ed0defe66f52df44613cc1a20`
Navigation-fix ancestor: `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before deploy or TEST mutation:

1. verify current branch/HEAD
2. verify `72012e0...` is an ancestor of current HEAD
3. inspect every commit after `72012e0...`; all later commits, if any, must be docs/workflow-only
4. verify runtime/config/migration/test executable source at current HEAD is equivalent to `72012e0...`
5. verify PR #67 remains Draft/Open/Unmerged
6. verify no operator review already handled this task identity

If any executable delta exists after `72012e0...`, STOP for operator review. Do not silently deploy a different source.

## TEST / safety scope

TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Manual playtest game: `78fb1d94-266f-455a-bda4-7656cc2370c1` — DO NOT RESET OR MUTATE.
Production game: `11111111-1111-4111-8111-111111111111` — forbidden.

Last independently verified dedicated TEST readback before this handoff:

- committed_turn = 0
- save_revision = 862
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- canonical scene v1 = setup
- location_id = null
- present_npc_ids = []

Re-read current TEST before use; do not assume the state is unchanged.

Scene Stage A + ACL closure are live. Scene Stage B is NOT authorized by this task.

## Goal

Prove in the real TEST runtime that the accepted Story contract closure and the previously reviewed navigation authority fix coexist correctly.

Required outcomes:

1. exact executable-equivalent `72012e0...` is deployed to the Company v1 TEST API
2. health/edition and deployed identity are recorded
3. setup/opening creates canonical Scene v1 correctly
4. normal Story/Extract/Commit succeeds
5. explicit player navigation changes canonical player location as intended
6. canonical compatibility mirrors derive from canonical scene
7. exact NPC-directed action `서원희가 1층 로비로 이동한다.` does not move the player's canonical location merely because the NPC was directed to move
8. the NPC-directed turn remains processable
9. context/history readback remains coherent
10. final dedicated TEST reset is clean
11. Scene Stage B remains unapplied/unmodified by this task

## Step 1 — exact preflight

Record:

- current branch/HEAD
- exact ancestry/equivalence proof from `72012e0...`
- PR #67 state
- current TEST readback
- current Scene migration ledger relevant to Stage A/Stage B
- current deployed Worker identity and `/health`
- focused deterministic Story protocol + navigation authority tests at executable-equivalent source

The full-suite count is supporting evidence only; targeted invariant tests are the acceptance signal.

## Step 2 — deploy exact reviewed candidate to TEST API only

Use the existing canonical Company v1 API deployment path and contract gate.

Requirements:

- deployment source must be executable-equivalent to `72012e00685bb12ed0defe66f52df44613cc1a20`
- API Worker only
- no frontend deploy
- no provider/model/config change
- no migration apply
- record new Worker Version ID
- verify `/health` HTTP 200 and `edition_id=company-v1`
- verify TEST Supabase binding still points to `fmcrspgxstsmxxsmkeee`

If exact deployment identity cannot be established, STOP before Story calls.

## Step 3 — live acceptance runner and evidence capture

Prefer the existing Company v1 canary/E2E/reset helpers. Do not create a new repository harness merely for convenience.

A temporary runner outside the repository is allowed only where needed to orchestrate the narrow acceptance or preserve response evidence that the existing helper does not expose.

For every Story call, retain the complete Worker-facing SSE transcript/events needed to distinguish:

- `meta`
- all visible text/block events
- terminal `complete` or `error`
- action/request IDs

If a Story protocol failure occurs again:

- preserve the full Worker-facing SSE transcript exactly
- preserve action/request IDs and server readback
- do not retry/regenerate
- do not patch during this rollout task
- final-reset the dedicated TEST game if safe
- report FAILED/BLOCKED and STOP

Do not claim raw upstream provider bytes were captured unless they actually were. Worker-facing SSE evidence is not automatically equivalent to provider-wire bytes.

## Step 4 — minimum live flow

Use only the dedicated TEST game.

1. verify/reset clean TEST setup state if needed
2. player setup
3. Opening
4. verify canonical `save.scene.version=1`
5. run a normal Story/Extract/Commit turn if needed to establish the expected scene
6. perform the same previously proven explicit player-navigation case that moved the player from `brand_strategy_office` to `brand_strategy_meeting_room`; reuse the exact prior accepted input from preserved evidence/runner rather than inventing a new semantic variant
7. record before/after canonical scene and `player_scene_state.location_id`
8. confirm Engine canonical navigation wins any conflicting observational Extract location
9. run exact regression action: `서원희가 1층 로비로 이동한다.`
10. record before/after canonical scene
11. prove player canonical location does not change solely because that NPC-directed command contains a registered location
12. prove the turn still reaches Commit successfully
13. verify canonical-to-legacy location/presence projection parity
14. verify context/history readback
15. final reset dedicated TEST game

Do not manufacture provider output.

## Required deterministic support

At minimum rerun current focused suites covering:

- Story prompt visible-body contract
- fresh narrative parser bodyless rejection
- Story request/response wire contract
- `test/navigation-authority-contract.test.mjs`
- relevant Scene reducer/Commit projection tests

Required invariants include:

- THOUGHT+CHOICE-only remains invalid
- plain narrative/valid semantic body remains accepted
- registered/unknown/ambiguous non-player mover cannot become authoritative player navigation
- explicit/self player navigation remains valid
- catalog-grounded player-to-NPC destination navigation remains valid
- Engine navigation wins conflicting Extract location
- stale compatibility NPC scene location is not authority
- canonical projections remain derived/idempotent

Do not add or modify source/tests in this rollout task.

## Final TEST reset requirement

Dedicated TEST final state must read back as:

- committed_turn = 0
- processing_status = idle or equivalent no-active-processing state
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- scene.version = 1
- scene_id = setup
- location_id = null
- present_npc_ids = []
- focal_character_id = null
- last_speaker_id = null

Record final save_revision rather than assuming `862`.

## Allowed

- read-only Git/source/PR/TEST/deployment inspection
- focused deterministic tests without source edits
- deploy exact reviewed executable-equivalent source to TEST API Worker only
- dedicated TEST setup/opening/Story/Extract/Commit/context/history/reset calls for this acceptance
- temporary out-of-repo orchestration/evidence runner when needed
- docs/audit/CURRENT_TASK truth updates only after successful acceptance
- Issue #68 lease and terminal report

## Forbidden

- runtime/source/test edits
- parser relaxation
- fallback/synthetic Story body
- retry/regeneration loop
- provider/model/temperature/token-limit/config changes
- navigation authority or Scene reducer changes
- frontend deploy
- migration edits/apply, including Scene Stage B
- Production access/write/reset
- manual playtest mutation/reset
- broad Cut 3+ work
- PR Ready/merge
- historical migration edits
- `git reset --hard`
- `git clean -fd`

If any unrelated defect appears, preserve evidence and STOP. Do not patch it incidentally.

## Success criteria

Success requires:

1. exact reviewed executable `72012e0...` deployment identity verified
2. Story/Extract/Commit Golden Path succeeds without retry
3. explicit player navigation succeeds
4. exact NPC-directed regression does not move the player canonical location
5. canonical/legacy projection parity remains coherent
6. context/history succeeds
7. no Story protocol regression is observed
8. TEST final reset is clean
9. no migration/Scene Stage B/frontend/Production/manual-playtest operation occurred
10. PR #67 remains Draft/Open/Unmerged

Only after all success criteria pass:

- update Cut 2 audit/current-truth documents with verified deployed identity and acceptance evidence
- set CURRENT_TASK to `WAITING_REVIEW`
- commit/push docs-only completion state
- post terminal report
- STOP before Scene Stage B

Success phrase:

`CUT 2 NAVIGATION LIVE ACCEPTANCE PASSED AFTER STORY CONTRACT CLOSURE — AWAITING OPERATOR REVIEW`

## Failure policy

On any failure, preserve exact evidence, perform only the safe dedicated TEST cleanup authorized here, post terminal report, and STOP. No runtime patch in this task.

Failure phrase:

`CUT 2 NAVIGATION LIVE ACCEPTANCE FAILED AFTER STORY CONTRACT CLOSURE — STOPPED BEFORE STAGE B`

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-navigation-live-acceptance-after-story-contract
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- task blob SHA / lease comment
- reviewed executable `72012e00685bb12ed0defe66f52df44613cc1a20`
- executable-equivalence proof
- PR #67 state
- focused deterministic tests/results
- pre-deploy Worker identity
- new deployed Worker Version ID
- `/health` and edition result
- TEST preflight state
- runner/evidence path and whether repository or out-of-repo
- Story SSE transcript/evidence location for each live Story call
- player navigation exact input and before/after canonical scene
- conflicting Extract result if observed
- NPC-directed exact input and before/after canonical scene
- NPC-directed turn processability
- projection parity
- context/history result
- final TEST reset + final save_revision
- TEST writes/reset summary
- deployment count/scope
- migration/Scene Stage B apply = 0
- frontend deploy = 0
- Production access = 0
- runtime/source/test edits = 0
- manual playtest mutation/reset = 0
- exact STOP state

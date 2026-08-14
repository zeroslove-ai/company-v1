# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-navigation-live-acceptance-location-normalized
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The prior task `cut2-navigation-live-acceptance-after-story-contract` correctly stopped FAILED without claiming navigation success.

Verified facts from that run and operator review:

- reviewed executable remains `72012e00685bb12ed0defe66f52df44613cc1a20`
- TEST API Worker Version `726420b6-5850-41c1-bc4b-178fffb9238d` was deployed through the existing contract-gated path
- health returned HTTP 200 with `edition_id=company-v1`
- Story contract did not regress: Opening, Turn 1 Story, Extract, and Commit all completed without retry
- the run did not reach navigation assertions because Opening itself started at `brand_strategy_meeting_room`, while the temporary acceptance scenario assumed the player would already be at `brand_strategy_office` before sending the exact office -> meeting-room navigation command
- no explicit player-navigation command and no NPC-directed regression command were sent
- therefore the prior failure is an acceptance-orchestration/precondition failure, not evidence of a runtime navigation defect
- final dedicated TEST reset was independently verified clean at committed_turn=0, save_revision=867, actions=0, turns=0, setup/not_started, opening/not_started, Scene v1 setup/location null/empty presence
- PR #67 remains OPEN / DRAFT / UNMERGED
- Scene Stage B remains unapplied and unauthorized

This task reruns only the remaining live acceptance with a start-location-independent precondition. Do not redeploy or patch runtime merely to make the test scenario convenient.

## Binding authority and operating rules

Read and obey before acting:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 operator review for `cut2-navigation-live-acceptance-after-story-contract`

Binding principles:

- current Git/source/live TEST DB/deployed identity outrank completion prose
- one durable domain has one canonical writer
- no compatibility code for stale tests
- no retry/provider/model/semantic hard gate to hide structural defects
- historical applied migrations are immutable
- superseded writer/reader/gate/test is removed only with proof
- manual playtest evidence is preserved
- a test harness precondition defect must be fixed in orchestration, not converted into runtime compatibility behavior

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Reviewed executable candidate: `72012e00685bb12ed0defe66f52df44613cc1a20`
Current deployed TEST API Worker Version expected at task start: `726420b6-5850-41c1-bc4b-178fffb9238d`
Navigation-fix ancestor: `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before TEST mutation:

1. verify current branch/HEAD and ancestry from `72012e0...`
2. inspect all commits after `72012e0...`; later commits must remain docs/workflow-only
3. verify runtime/config/migration/test executable source is still equivalent to `72012e0...`
4. verify PR #67 remains Draft/Open/Unmerged
5. verify no operator review already handled this task identity
6. verify currently deployed Worker identity and `/health`
7. verify deployed Worker still targets TEST project `fmcrspgxstsmxxsmkeee`

If deployed executable identity has changed or cannot be established, STOP BLOCKED. Do not redeploy in this task.

## TEST scope

TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Manual playtest game: `78fb1d94-266f-455a-bda4-7656cc2370c1` — DO NOT RESET OR MUTATE.
Production game: `11111111-1111-4111-8111-111111111111` — forbidden.

Last operator readback:

- committed_turn = 0
- save_revision = 867
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- canonical Scene v1 = setup / location null / empty presence

Re-read current TEST before use.

## Goal

Complete the live navigation acceptance against the already deployed reviewed executable without assuming a fixed Opening location.

Required outcomes:

1. Story/Extract/Commit remains healthy without retry
2. player can be placed at canonical `brand_strategy_office` through an ordinary explicit player-navigation turn when needed
3. exact accepted player-navigation input from office to `brand_strategy_meeting_room` changes canonical player location correctly
4. Engine canonical navigation wins any conflicting observational Extract location
5. exact NPC-directed input `서원희가 1층 로비로 이동한다.` does not move the player's canonical location merely because a registered location is named
6. the NPC-directed turn remains processable through Commit
7. canonical-to-legacy scene/location/presence projection remains coherent
8. context/history readback remains coherent
9. final dedicated TEST reset is clean
10. no runtime/source/test/migration/frontend/Production/manual-playtest mutation outside the authorized TEST flow occurs

## Step 1 — deterministic navigation input preflight

Before live navigation calls, use current source/tests only to prove the exact textual inputs resolve as intended.

Required exact target command already accepted by prior evidence:

`브랜드전략팀 회의실로 이동한다.`

It must resolve as player navigation to `brand_strategy_meeting_room` when the player is at `brand_strategy_office`.

For normalization to the office, first determine from the existing canonical location catalog and current resolver the shortest ordinary explicit player command that resolves unambiguously to `brand_strategy_office`. Prefer the canonical visible label already present in repository content. Do not invent aliases and do not add source/tests.

Expected example only if current catalog/resolver proves it exactly:

`브랜드전략팀 사무실로 이동한다.`

If that exact example does not resolve to `brand_strategy_office`, use the existing catalog-grounded phrase that does. Record the phrase and deterministic resolution evidence.

The normalization command is test orchestration only. It must travel through the normal Story/Extract/Commit pipeline; no DB shortcut or save mutation is allowed.

## Step 2 — setup/opening and location-normalized live flow

Use only the dedicated TEST game.

1. verify/reset clean TEST setup state only if needed
2. player setup
3. Opening
4. read canonical `save.scene.version` and actual `location_id`
5. do not assume Opening starts in any particular location
6. if actual canonical location is not `brand_strategy_office`, send the deterministically proven explicit player-navigation command to `brand_strategy_office` through normal Story -> Extract -> Commit
7. verify after Commit:
   - canonical `save.scene.location_id = brand_strategy_office`
   - `player_scene_state.location_id` is only the derived compatibility projection and matches canonical scene
   - no unrelated location authority overrides the Engine navigation result
8. once canonical location is `brand_strategy_office`, send exact prior accepted input:
   `브랜드전략팀 회의실로 이동한다.`
9. process Story -> Extract -> Commit with no retry
10. verify canonical location changed to `brand_strategy_meeting_room`
11. record any Extract location observation and prove canonical Engine navigation wins on conflict
12. from the committed meeting-room state send exact regression input:
   `서원희가 1층 로비로 이동한다.`
13. process Story -> Extract -> Commit with no retry
14. verify player canonical `save.scene.location_id` remains `brand_strategy_meeting_room` solely with respect to this NPC-directed command; do not infer NPC movement success unless the normal Story/Extract evidence supports it
15. verify canonical-to-legacy location/presence projection parity
16. verify context/history readback contains the committed turns coherently
17. final-reset only the dedicated TEST game and perform readback

If Opening happens to start at `brand_strategy_office`, skip only the normalization turn and continue with the exact meeting-room command.

If a navigation Story/Extract/Commit fails, preserve evidence, do not retry, final-reset if safe, report terminal failure, and STOP.

## SSE / failure evidence

For every Story call in this acceptance retain complete Worker-facing SSE evidence:

- meta
- visible block/text events
- terminal complete or error
- action/request IDs

If any Story protocol failure recurs:

- retain complete Worker-facing SSE transcript exactly
- retain action/request IDs and server readback
- no retry/regeneration
- no source patch in this task
- do not call Worker-facing evidence provider-wire bytes
- final-reset dedicated TEST if safe
- report FAILED/BLOCKED and STOP

## Required readbacks

For each navigation turn record before/after:

- committed_turn
- canonical `save.scene`
- `player_scene_state.location_id`
- relevant `npc_scene_state` membership/location compatibility fields if present
- Extract candidate location/presence observations if present
- action processing/commit result

For the NPC-directed regression explicitly record whether the player location changed and why.

## Final TEST reset requirement

Final dedicated TEST state must read back as:

- committed_turn = 0
- no active processing
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

Record final save_revision; do not assume `867`.

## Allowed

- read-only Git/source/PR/TEST/deployment inspection
- focused deterministic resolver/Story/Scene tests with no source edits
- dedicated TEST setup/opening/Story/Extract/Commit/context/history/reset calls
- temporary out-of-repository runner/evidence capture when existing helper cannot express the location-normalized orchestration
- docs/audit/current-truth updates only after full successful acceptance
- Issue #68 lease and terminal report
- normal docs-only completion commit after success

## Forbidden

- API redeploy in this task
- frontend deploy
- runtime/source/test edits
- direct DB/save shortcut to force location
- synthetic provider output
- retry/regeneration
- parser relaxation
- fallback/synthetic Story body
- provider/model/temperature/token/config changes
- navigation authority or Scene reducer changes
- migration edits/apply, including Scene Stage B
- Production access
- manual playtest mutation/reset
- broad Cut 3+ work
- PR Ready/merge
- historical migration edits
- `git reset --hard`
- `git clean -fd`

If an unrelated defect appears, preserve evidence and STOP. Do not patch it incidentally.

## Success criteria

Success requires all of the following:

1. current deployed Worker identity remains executable-equivalent to reviewed `72012e0...`
2. deterministic preflight proves the normalization command and exact meeting-room command resolve to their intended canonical locations
3. normal live pipeline establishes `brand_strategy_office` when needed without DB shortcut
4. exact player-navigation command moves canonical location office -> meeting room
5. exact NPC-directed command does not move player canonical location
6. all involved turns reach Commit without retry
7. canonical/legacy projection parity is coherent
8. context/history succeeds
9. no Story protocol regression occurs
10. final dedicated TEST reset is clean
11. Scene Stage B/migration/frontend/Production/manual-playtest/runtime-source edits remain 0
12. PR #67 remains Draft/Open/Unmerged

Only after all success criteria pass:

- update the relevant Cut 2 audit/current-truth docs with verified deployed identity and live acceptance result
- set CURRENT_TASK to `WAITING_REVIEW`
- commit/push docs-only completion state
- post terminal report to Issue #68
- STOP before Scene Stage B

Success phrase:

`CUT 2 LOCATION-NORMALIZED NAVIGATION LIVE ACCEPTANCE PASSED — AWAITING OPERATOR REVIEW`

## Failure policy

On any failure, preserve exact evidence, perform only safe dedicated TEST cleanup authorized here, post terminal report, and STOP. No runtime patch or redeploy in this task.

Failure phrase:

`CUT 2 LOCATION-NORMALIZED NAVIGATION LIVE ACCEPTANCE FAILED — STOPPED BEFORE STAGE B`

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-navigation-live-acceptance-location-normalized
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- task blob SHA / lease comment
- exact reviewed executable and currently deployed Worker Version
- executable-equivalence/deployment identity verification
- PR #67 state
- focused deterministic input-resolution evidence
- TEST preflight state
- Opening actual canonical location
- exact normalization command if used and before/after canonical scene
- exact office -> meeting-room command and before/after canonical scene
- Extract candidate location and Engine precedence evidence
- exact NPC-directed command and before/after canonical scene
- NPC-directed turn processability
- projection parity
- context/history result
- Story SSE evidence artifact location/hash
- final TEST reset + final save_revision
- migration/Scene Stage B apply = 0
- API redeploy = 0
- frontend deploy = 0
- Production access = 0
- runtime/source/test edits = 0
- manual playtest mutation/reset = 0
- exact STOP state

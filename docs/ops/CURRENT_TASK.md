# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: cut2-final-navigation-live-acceptance-after-opening-contract
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 2 Scene/Location/Presence authority has an independently reviewed executable lineage whose latest runtime change is:

`a919baf87d92e841e64b731576ccb176d5745570`

That executable includes:

- the reviewed NPC-directed navigation authority fix already in the Cut 2 lineage
- the fresh Story visible-body contract closure
- the fresh Opening speaker-ID whitelist contract: `allowed_speaker_ids = ['player', ...Object.keys(active_character_canon)]`
- strict fail-closed Story speaker validation with no fuzzy repair

The immediately following branch head `ee22aa77f13c7160debb33d69ce27d821428188a` changes no runtime source. It only cleans one newly introduced test-fixture mojibake literal and marks the cleanup task complete. Operator inspection independently verified that commit's only non-CURRENT_TASK delta is the single test literal, GitHub Actions run #570 is success, and PR #67 remains Draft/Open/Unmerged.

The dedicated TEST game is independently verified clean before this task:

- project: `fmcrspgxstsmxxsmkeee`
- game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- committed_turn = 0
- save_revision = 870
- player_setup = not_started
- opening_state = not_started
- Scene v1 = setup / location null / empty presence
- actions = 0
- turns = 0

Previous live-acceptance attempts stopped before the decisive NPC-directed navigation assertion because of, in order, a Story body protocol failure, an acceptance-runner location assumption, and an Opening unknown-speaker failure. Those issues were handled separately. This task must now test the actual Cut 2 runtime behavior end-to-end without adding another implementation patch inside the acceptance run.

## Binding authority

Before work, read and obey:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 reviews/results for:
   - `cut2-npc-directed-navigation-authority-fix`
   - `cut2-story-visible-body-contract-closure`
   - `cut2-opening-speaker-id-contract-closure`
   - `cut2-opening-speaker-id-contract-cleanup`

Current Git/source/live TEST/deployed evidence outranks report prose. One durable domain has one canonical writer. Do not add compatibility code, retry, provider/model changes, semantic hard gates, fuzzy identity repair, or a third parser.

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Reviewed runtime executable to deploy:

`a919baf87d92e841e64b731576ccb176d5745570`

Expected pre-task branch head lineage:

- runtime candidate: `a919baf87d92e841e64b731576ccb176d5745570`
- test/docs descendant: `ee22aa77f13c7160debb33d69ce27d821428188a`
- this CURRENT_TASK registration is allowed to add one further docs-only descendant

Before deployment:

1. verify current branch/remote HEAD and ancestry
2. prove every commit after `a919baf...` is test/docs/workflow-only and contains no executable/runtime/config/migration delta
3. verify `src/engine/opening-prompt.js` and other runtime source at current HEAD are executable-equivalent to `a919baf...`
4. verify no operator review already handled this exact task identity
5. verify PR #67 remains Draft/Open/Unmerged
6. verify the dedicated TEST game is clean; if not clean, STOP BLOCKED unless the only discrepancy is safely attributable to a prior authorized TEST run and can be restored using the normal dedicated TEST reset endpoint under this task
7. never touch the manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1`

If executable source after `a919baf...` differs, STOP BLOCKED. Do not reuse approval by assumption.

## Goal

Deploy the exact reviewed Cut 2 runtime executable to the TEST API and complete the location-normalized Golden Path navigation acceptance that previous protocol failures prevented from reaching.

This is an acceptance/operations task, not a patch task.

## Allowed deployment

Exactly one API Worker deployment to the TEST Company v1 API is authorized, using the executable tree corresponding exactly to:

`a919baf87d92e841e64b731576ccb176d5745570`

If the deployment tooling runs from a docs/test descendant worktree, first prove all deploy-relevant/runtime/config files are byte-equivalent to `a919baf...` and record that proof. Prefer an exact detached/worktree deployment from `a919baf...` when practical so the deployed identity is unambiguous.

After deployment:

- record Worker name
- record exact Cloudflare Version ID / deployment identity
- health-check the deployed API
- prove the deployed runtime corresponds to `a919baf...`

Do not deploy frontend.

## Authorized TEST game

Only:

`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

A normal dedicated TEST reset is authorized at the start only if needed for a clean precondition, and is required at the end of the task regardless of pass/fail once writes have begun.

Manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` is strictly forbidden.

## Live acceptance sequence

Use the normal public/runtime Company v1 API paths. Do not directly mutate DB state to manufacture navigation preconditions.

### A. Setup + Opening

1. Confirm/reset dedicated TEST game clean.
2. Run player setup through the normal API.
3. Run fresh Opening.
4. Preserve the complete Worker-facing Opening SSE/event transcript outside the repository.
5. Verify Opening completes successfully and no unknown `speaker_id` error occurs.
6. Read canonical Scene immediately after Opening and record actual starting `location_id` and presence.

Do not assume a fixed Opening location.

### B. Baseline normal turn

Run one ordinary non-navigation Story -> Extract -> Commit turn so the standard turn pipeline is proven healthy under the newly deployed executable.

Record:

- action_id / turn
- Story terminal status
- Extract terminal status
- Commit result
- canonical Scene
- legacy/player projection parity

### C. Normalize the player location through gameplay only

The decisive navigation assertion requires a known starting point, but DB mutation is forbidden.

- If canonical player location is already `brand_strategy_office`, continue.
- Otherwise use a normal player navigation action through Story -> Extract -> Commit to move the player to `brand_strategy_office`, and verify canonical/projection parity before continuing.

If that normal navigation fails, preserve evidence and STOP FAILED; do not patch or retry.

### D. Explicit player navigation

Submit exactly:

`브랜드전략팀 회의실로 이동한다.`

Run Story -> Extract -> Commit once.

Required result:

- canonical Scene/player location becomes `brand_strategy_meeting_room`
- player scene projection matches canonical
- legacy location mirror, if still intentionally present in this Cut, matches canonical
- presence projection remains structurally valid

If not, preserve evidence and STOP FAILED.

### E. NPC-directed movement — decisive Cut 2 assertion

From canonical player location `brand_strategy_meeting_room`, submit exactly:

`서원희가 1층 로비로 이동한다.`

Run Story -> Extract -> Commit exactly once.

Required player-location result:

- player canonical location remains `brand_strategy_meeting_room`
- player scene projection remains `brand_strategy_meeting_room`
- legacy player/location mirror does not move the Player to `lobby`

The action names an NPC mover. It must not create player navigation authority merely because the sentence contains a destination.

Also record what the Story/Extract/scene-presence system does with 서원희, but do not invent a new durable NPC-location contract in this acceptance task. The pass/fail gate here is that NPC-directed movement must not move the Player.

### F. Context / history / projection readback

After the executed turns, verify normal context/history readbacks succeed and record:

- committed turn count
- canonical Scene
- player/legacy projection parity
- stored action/turn sequence
- relevant parsed Story blocks if available

Do not broaden into Memory/Summary remediation in this task. Observation is allowed; patching is not.

## Failure evidence rule

There is no retry/regeneration loop in this task.

For every live Story or Opening call, preserve enough outside-repo evidence to diagnose a terminal protocol or semantic failure:

- request/action ID
- HTTP status
- complete Worker-facing SSE transcript
- emitted semantic events / terminal error payload
- canonical Scene before/after the attempted turn
- Extract/Commit outputs if those stages were reached

A Worker-facing SSE transcript is not automatically equivalent to raw provider bytes. Do not claim provider-level evidence unless raw provider bytes were actually captured by an existing authorized mechanism.

If any protocol failure recurs, STOP FAILED with evidence. Do not patch, retry, loosen parser/wire behavior, or change provider/model/config in this task.

## Validation / acceptance gates

Pass requires all of the following:

1. exact reviewed executable `a919baf...` is what was deployed to TEST API
2. health check passes
3. setup + Opening pass
4. Opening does not fail on unknown speaker IDs
5. one baseline normal Story/Extract/Commit turn passes
6. player can be gameplay-normalized to `brand_strategy_office` if needed without DB mutation
7. explicit player navigation to `brand_strategy_meeting_room` passes
8. NPC-directed `서원희가 1층 로비로 이동한다.` does not move the Player from `brand_strategy_meeting_room`
9. canonical Scene and intentional legacy/player projections remain in parity after each committed navigation step
10. context/history readback succeeds
11. final dedicated TEST reset succeeds and direct live readback is clean
12. PR #67 remains Draft/Open/Unmerged
13. Scene Stage B/migration/frontend/Production/manual-playtest mutation remain zero

Raw test counts are not a substitute for this live acceptance.

## Forbidden

- source/runtime/test behavior edits during the acceptance run
- parser/wire changes
- navigation reducer or authority changes
- fuzzy identity repair
- fallback/synthetic dialogue or narrative
- retry/regeneration
- provider/model/temperature/token/config changes
- frontend deployment
- migration edit/apply, including Scene Stage B
- Production access/write/reset/deploy
- manual playtest mutation/reset
- PR Ready/merge
- direct DB mutation to manufacture gameplay state
- broad Cut 3+ work

If the live acceptance discovers a defect, report it and STOP. A separate operator-reviewed CURRENT_TASK must own any root-cause patch.

## Final cleanup

Once any TEST writes have started, always perform the dedicated TEST reset before terminal report, whether PASS or FAIL.

Then independently read back/record at minimum:

- committed_turn = 0
- player_setup/opening_state reset
- canonical Scene v1 setup/location null/empty presence
- actions = 0
- turns = 0
- resulting save_revision

## Stop boundary

On PASS:

- do not apply Scene Stage B
- do not merge or mark PR Ready
- set CURRENT_TASK to `WAITING_REVIEW`
- post terminal COMPLETE report with exact deployed identity and full acceptance evidence summary
- STOP for operator review

On any acceptance defect:

- final-reset dedicated TEST game
- set CURRENT_TASK to `WAITING_REVIEW`
- post FAILED report with exact failure stage and preserved evidence path/hash where applicable
- STOP for operator review

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-final-navigation-live-acceptance-after-opening-contract
STATUS: COMPLETE | FAILED | BLOCKED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- TASK_BLOB_SHA / lease comment
- reviewed executable SHA = `a919baf...`
- branch/test/docs descendant SHA separately
- exact Worker Version ID/deployment identity
- health result
- initial/final TEST readbacks
- setup/Opening result and Opening evidence artifact path/hash
- baseline turn result
- location normalization steps if any
- explicit player navigation before/after
- NPC-directed movement before/after and decisive pass/fail
- canonical/projection parity
- context/history result
- final reset result
- API deploy count
- frontend deploy = 0
- migration/Scene Stage B = 0
- Production = 0
- manual playtest mutation/reset = 0
- source/runtime patch count = 0
- PR #67 state
- exact STOP state

# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-npc-directed-navigation-authority-fix
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 2 Scene Stage A live acceptance found one real runtime defect after the exact reviewed Scene candidate was deployed and the focused deterministic suite passed:

- explicit player navigation correctly moved canonical `save.scene.location_id`
- but the player action `서원희가 1층 로비로 이동한다.` also moved the **player** canonical location from `brand_strategy_meeting_room` to `lobby`
- Story / Extract / Commit all returned HTTP 200, so this is a semantic authority defect, not a transport failure

The prior acceptance task correctly stopped before Scene Stage B. This task fixes only that root cause, proves the fix deterministically, and prepares a new exact executable review candidate. It does **not** deploy, apply Scene Stage B, or rerun the live acceptance.

## Mandatory canon

Read in this order before work:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `/docs/audit/CUT2_SCENE_LOCATION_PRESENCE_2026-08-14.md`
6. this file
7. GitHub Issue #68, especially the FAILED report for `cut2-scene-stage-a-live-scene-acceptance` and its operator review

Current Git/source/live DB/deployed identity outrank report prose.

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Prior reviewed executable SHA: `ce23612741599493921ae7c68b9ab58d6e23bcc6`
Task-registration base HEAD: `f3fb6db007b5ff826a3f9d01c316a67064c54998`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before editing runtime source, verify that all commits after `ce236127...` through the current task-registration HEAD are docs/workflow-only. If unexpected runtime/migration/config/gate/test source changed, STOP for operator review.

## Independently verified live blocker state

TEST project: `fmcrspgxstsmxxsmkeee`
TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Production game: `11111111-1111-4111-8111-111111111111` — forbidden.

After the failed Scene acceptance, operator readback independently confirmed:

- committed_turn = 0
- save_revision = 854
- processing_status = idle
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- canonical `save.scene.version = 1`
- scene_id = setup
- location_id = null
- present_npc_ids = []
- Scene Stage B is NOT applied

The prior failed report's Worker Version remains deployment evidence, but deployment identity is not a prerequisite for this source-fix task because deployment is forbidden here.

## Goal

Fix the authority bug that interprets an NPC-directed movement command as player navigation.

Canonical rule:

- only an explicit **player/self navigation intent** may produce Engine authoritative player location movement
- a command whose grammatical/semantic mover is an NPC must not set player `authoritativeLocationId`
- Extract/Story observations still cannot independently redirect player navigation
- canonical scene remains sole location/presence authority and compatibility projections remain derived only

This is a narrow Cut 2 root-cause correction, not a parser generation rewrite or broad NLU project.

## Allowed

- read-only Git/source/TEST DB verification
- inspect exact failed action/evidence already recorded in Issue #68
- edit the minimal runtime source responsible for player-navigation intent classification/resolution
- edit or add focused deterministic tests that prove the corrected authority boundary
- update the Cut 2 audit with source-candidate facts after tests pass
- commit and push the source/test/docs fix on the existing Cut 2 branch

## Forbidden

- deploy API or frontend
- apply any migration, including Scene Stage B
- TEST setup/opening/Story/Extract/Commit/reset calls
- Production access/write/reset
- provider/model changes
- retries/regeneration to hide semantics
- compatibility readers or regex exceptions
- a third parser generation
- unrelated Cut 3+ work
- PR Ready/merge
- historical migration edits
- `git reset --hard` / `git clean -fd`

## Step 1 — recover exact failure path

Trace the exact code path from player action text to the typed navigation intent and then to canonical scene reduction/Commit.

Use the failed live action as the required regression case:

`서원희가 1층 로비로 이동한다.`

At minimum determine:

1. where destination `lobby` is resolved
2. where the mover/subject is classified
3. where a navigation intent becomes Engine authoritative player location
4. why the NPC-directed sentence crossed that boundary

Do not patch the scene reducer if the defect is upstream intent classification. Fix the earliest authority boundary that has enough information to distinguish player/self movement from NPC-directed movement.

## Step 2 — root-cause fix

Implement the smallest deterministic correction that enforces the canonical rule.

Requirements:

- explicit player/self navigation still resolves registered destinations normally
- NPC-directed movement does not produce player navigation
- named-NPC subject resolution must use registered content/catalog identities where available; do not add a one-off `서원희` special case
- unresolved/ambiguous actor must fail closed for **player navigation authority** rather than guessing the player moved
- this fail-closed rule applies only to Engine player-navigation intent; it must not kill Story/turn execution or become a semantic hard gate
- no provider/model changes
- no broad regex exception list tailored to the single failing sentence

## Step 3 — deterministic regression evidence

Add or rewrite focused tests at the true authority boundary.

Required cases:

1. explicit player navigation to a registered destination => player authoritative navigation intent exists
2. equivalent self/implicit-player form currently supported => preserves intended behavior
3. `서원희가 1층 로비로 이동한다.` => **no player authoritative navigation intent**
4. another registered NPC-directed movement sentence => no player authoritative navigation intent
5. unknown named actor / ambiguous mover => no player authoritative navigation intent; turn remains processable
6. NPC movement text cannot change canonical player location through Commit/reducer integration
7. player navigation still wins over conflicting Extract location observation
8. stale `npc_scene_state.location_id` remains non-authoritative

Use behavior assertions, not source-text/regex-existence tests.

If an old test encodes the incorrect behavior, classify it REWRITE or DELETE rather than preserving it with compatibility code.

## Step 4 — regression checks

Run:

- focused navigation/scene/commit tests covering the changed boundary
- the existing Scene deterministic support set used by the prior acceptance, including `test/scene-runtime-contract.test.mjs`
- broader relevant suite if practical as regression signal
- syntax checks for changed JS/MJS
- `git diff --check`

Raw total test count is not acceptance authority; triage any failure against the canonical rule.

## Step 5 — exact executable candidate

After tests pass:

1. commit source/test changes with a focused message
2. push to `company/scene-location-presence-v1`
3. record the exact new executable SHA
4. verify PR #67 remains Draft/Open/Unmerged
5. verify the diff from `ce236127...` to the new executable candidate contains only the intended Cut 2 correction plus prior Cut 2 source and docs lineage

Do not deploy this new SHA in this task.

## Success policy

On success:

- leave TEST DB unchanged from the clean state
- Scene Stage B remains NOT APPLIED
- update the Cut 2 audit only with source-candidate/test facts, not deployment facts
- set this file to `Status: WAITING_REVIEW`
- commit/push the final docs-only status update if needed
- post completion report to Issue #68
- STOP for operator review before any deployment/live acceptance

Success phrase:

`CUT 2 NPC-DIRECTED NAVIGATION AUTHORITY FIX READY — AWAITING REVIEW`

## Failure policy

If the root cause cannot be isolated without a broader architecture change, preserve findings and STOP. Do not widen the task silently.

Failure phrase:

`CUT 2 NPC-DIRECTED NAVIGATION AUTHORITY FIX BLOCKED — AWAITING OPERATOR REVIEW`

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-npc-directed-navigation-authority-fix
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- prior reviewed executable SHA
- root cause path
- changed runtime files
- changed tests
- KEEP / REWRITE / DELETE decisions if any
- exact regression cases/results
- broader regression results
- syntax/diff-check
- exact new executable SHA
- PR #67 state
- TEST DB writes = 0
- migration apply = 0
- API deploy = 0
- frontend deploy = 0
- Production access = 0
- Scene Stage B applied = 0
- preserved evidence status
- CURRENT_TASK final status
- exact STOP state

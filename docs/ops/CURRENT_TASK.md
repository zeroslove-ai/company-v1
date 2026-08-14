# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-navigation-fix-deploy-live-acceptance
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The prior task `cut2-npc-directed-navigation-authority-fix` corrected the exact Cut 2 authority defect exposed by live Scene Stage A acceptance:

- `서원희가 1층 로비로 이동한다.` previously crossed the player-navigation authority boundary and moved the player canonical location
- the reviewed source correction moved actor/mover classification ahead of authoritative player-navigation resolution
- registered NPC, unknown named, and ambiguous non-player movers now fail closed only for Engine player-navigation authority
- explicit/self player movement and catalog-grounded player-to-NPC destination movement remain supported
- deterministic behavior coverage was added and GitHub CI passed

The prior task intentionally stopped before deployment and live acceptance. This task deploys only the reviewed executable candidate to the TEST API, reruns the narrow Scene Stage A live acceptance, and stops before Scene Stage B.

Do not broaden this into Cut 3+ or a new parser/NLU project.

## Mandatory canon

Read in this order before work:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `/docs/audit/CUT2_SCENE_LOCATION_PRESENCE_2026-08-14.md`
6. this file
7. GitHub Issue #68, especially:
   - FAILED report + operator review for `cut2-scene-stage-a-live-scene-acceptance`
   - COMPLETE report for `cut2-npc-directed-navigation-authority-fix`
   - operator review that registered this task

Current Git/source/live TEST DB/deployed identity outrank report prose.

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Prior reviewed executable SHA: `ce23612741599493921ae7c68b9ab58d6e23bcc6`
New reviewed executable candidate: `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd`
Prior docs-only terminal HEAD: `e41eed5edb25e268d30b3e03da8304da58d471ad`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before any deploy or live call:

1. verify `c3fc61f...` is an ancestor of current branch HEAD
2. verify every commit after `c3fc61f...` through current task-registration HEAD is docs/workflow-only
3. verify runtime/config/migration/test source at current HEAD is executable-equivalent to `c3fc61f...`
4. verify PR #67 remains Draft/Open/Unmerged

If any executable delta exists after `c3fc61f...`, STOP for operator review. Do not silently deploy a different candidate.

## Reviewed source facts to preserve

Operator review independently confirmed:

- executable delta from `ce236127...` to `c3fc61f...` is limited to:
  - `src/engine/scene-cast.js`
  - `test/navigation-authority-contract.test.mjs`
  - task/docs lineage
- the authority fix is upstream in `resolvePlayerNavigationIntent()` rather than the canonical scene reducer
- registered NPC / unknown named / ambiguous movers fail closed for player navigation
- explicit/self movement remains player navigation
- `민아 보러간다` remains a catalog-grounded player-to-NPC navigation case
- Commit regression coverage proves NPC movement text cannot change canonical player location
- conflicting Extract location still cannot override Engine player navigation
- stale `npc_scene_state.location_id` remains non-authoritative
- GitHub Actions `Company v1 tests` for `c3fc61f...` completed successfully
- `c3fc61f...` → `e41eed5...` is docs-only

These are supporting facts, not permission to skip live verification.

## TEST / deployment scope

TEST Supabase project: `fmcrspgxstsmxxsmkeee`
TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Manual playtest game: `78fb1d94-266f-455a-bda4-7656cc2370c1` — DO NOT RESET OR MUTATE.
Production game: `11111111-1111-4111-8111-111111111111` — forbidden.

Last independently verified clean TEST state after the failed acceptance:

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

Scene Stage A + ACL closure are live. Scene Stage B is NOT applied.

Prior deployed Worker Version evidence: `0fc0d42c-1327-454c-bce4-270cd0c1ff95` for the pre-fix executable. Re-verify current deployment identity before deployment; do not assume it from report prose.

## Goal

Prove the reviewed navigation authority fix in the live TEST runtime without changing any other durable authority.

Success means:

1. exact reviewed executable `c3fc61f...` is the API runtime source identity being deployed
2. the deployed TEST Worker identity is recorded and health passes
3. explicit player navigation still changes canonical player location
4. `서원희가 1층 로비로 이동한다.` no longer moves canonical/player location
5. canonical-to-legacy projection parity remains intact
6. context/history still work
7. final TEST reset is clean
8. Scene Stage B remains unapplied

## Allowed

- read-only Git/source/PR/TEST DB/deployment verification
- focused deterministic tests at the exact reviewed executable-equivalent source
- API Worker deploy to the Company v1 TEST runtime only, using the existing `wrangler.api.jsonc` / canonical deployment path
- TEST-only setup/opening/Story/Extract/Commit/reset calls needed for the Scene acceptance
- temporary acceptance runner outside the repository
- reuse/correct the prior temporary Scene runner if still available and if its behavior is independently inspected first
- docs-only truth/audit/CURRENT_TASK updates after full success
- Issue #68 lease / terminal report required by the ops loop

## Forbidden

- frontend deploy
- migration apply, including Scene Stage B
- migration source edits
- Production access/write/reset
- manual playtest game mutation/reset
- provider/model changes
- retry/regeneration loops used to hide semantic failure
- new compatibility reader/gate
- broad parser/NLU rewrite
- runtime/source/test edits in this task
- unrelated Cut 3+ work
- PR Ready/merge
- historical migration edits
- `git reset --hard` / `git clean -fd`

If the live acceptance reveals another runtime defect, preserve evidence and STOP. Do not patch it inside this task.

## Step 1 — exact preflight

Verify and record:

1. current branch/HEAD and ancestry from `c3fc61f...`
2. diff `c3fc61f...` → current HEAD is docs/workflow-only
3. PR #67 Draft/Open/Unmerged
4. focused deterministic navigation/scene tests still pass without source edits
5. current TEST DB clean state
6. Scene Stage A + ACL closure live and Stage B absent
7. currently deployed Worker identity + `/health`

If TEST is dirty from an abandoned run, determine whether it is safe to reset only the dedicated TEST game. Never reset the manual playtest game.

## Step 2 — deploy exact reviewed executable to TEST API

Deploy the Company v1 API Worker only after preflight passes.

Requirements:

- deployment source must be executable-equivalent to `c3fc61f...`
- use the canonical API Wrangler config/path already used by Company v1
- do not deploy frontend
- do not alter provider/model configuration
- record the new Cloudflare Worker Version ID
- verify `/health` after deploy and confirm `edition_id = company-v1`
- verify TEST Supabase binding still points to project `fmcrspgxstsmxxsmkeee`

If deployment identity cannot be established after deploy, STOP before live Story calls.

## Step 3 — temporary live Scene acceptance

Use a temporary runner outside the repo. Record action/request IDs and before/after canonical scene snapshots.

Minimum flow:

1. ensure/reset dedicated TEST game to clean setup state if necessary
2. setup
3. Opening
4. verify canonical Scene v1 exists
5. run a normal committed turn as needed to establish the current scene
6. run explicit player navigation to a registered deterministic destination
7. verify canonical `save.scene.location_id` changes as intended
8. verify `player_scene_state.location_id` mirrors canonical location
9. verify legacy scene/presence projections are derived from canonical scene
10. run the exact regression action: `서원희가 1층 로비로 이동한다.`
11. verify canonical/player location does **not** move merely because the NPC was directed to move
12. verify the turn itself remains processable; no semantic hard-gate failure was introduced
13. context/history readback
14. final reset of the dedicated TEST game

Prefer reusing the same registered locations/NPCs from the prior failed acceptance so the only changed variable is the executable fix.

Do not manufacture provider responses. A provider/Story result that creates a genuine contradictory runtime fact is a failure to preserve, not something to retry away.

## Step 4 — acceptance matrix

### Required live evidence

- API deployment identity matches the reviewed executable-equivalent source
- `/health` passes with Company v1 edition
- reset/setup/opening yields canonical Scene v1
- normal Story/Extract/Commit succeeds
- explicit player navigation changes canonical location deterministically
- player compatibility location mirrors canonical location
- exact NPC-directed regression action does not move player location
- NPC-directed turn remains processable
- canonical/legacy projection parity remains coherent
- context/history readback succeeds
- no Scene Stage B permission/apply occurred
- final reset returns clean canonical setup scene

### Required deterministic support

At minimum rerun the focused support set containing:

- `test/navigation-authority-contract.test.mjs`
- `test/scene-runtime-contract.test.mjs`
- the same Extract/Commit Scene support tests used by the previous acceptance when still current

Required invariants:

- registered/unknown/ambiguous non-player mover cannot produce player authoritative navigation
- explicit/self player navigation remains valid
- catalog-grounded NPC-as-destination player navigation remains valid
- Engine navigation wins conflicting Extract location
- stale NPC scene location is not authority
- optional/degraded Scene observation still fails open for observation rather than killing the turn
- canonical projection is idempotent/derived

Do not add source or tests in this rollout task.

## Step 5 — final TEST reset

Required final state for dedicated TEST game:

- committed_turn = 0
- processing_status = idle
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- canonical scene version = 1
- scene_id = setup
- location_id = null
- present_npc_ids = []
- focal_character_id = null
- last_speaker_id = null

Record final `save_revision` rather than assuming it remains 854.

## Success policy

Only after the full matrix passes:

1. update `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md` with the newly verified deployed executable/Worker identity and live regression result
2. update `docs/audit/CUT2_SCENE_LOCATION_PRESENCE_2026-08-14.md`
3. set this file to `Status: WAITING_REVIEW`
4. commit/push docs-only completion state
5. post terminal report to Issue #68
6. STOP before Scene Stage B

Success phrase:

`CUT 2 NAVIGATION FIX LIVE ACCEPTANCE PASSED — AWAITING STAGE B REVIEW`

Do not create or execute the Stage B task yourself.

## Failure policy

If any of these occur, preserve exact evidence and STOP without runtime patching:

- deploy identity mismatch/unverifiable
- explicit player navigation regresses
- NPC-directed movement still moves player
- NPC-directed turn is killed by a new hard gate
- canonical/legacy projections diverge
- TEST cannot be returned to clean state
- unexpected migration/Stage B state

Failure phrase:

`CUT 2 NAVIGATION FIX LIVE ACCEPTANCE FAILED — STOPPED BEFORE STAGE B`

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-navigation-fix-deploy-live-acceptance
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- reviewed executable SHA `c3fc61f5aecef421bd7e7ff201d6d17bf567b7cd`
- executable-equivalence / docs-only descendant proof
- PR #67 state
- deterministic tests run/results
- pre-deploy Worker identity
- deployed Worker Version ID
- `/health` / edition result
- TEST DB preflight state
- runner path and out-of-repo proof
- player-navigation before/after canonical scene
- NPC-directed regression before/after canonical scene
- NPC-directed turn processability result
- projection parity
- context/history result
- final reset state + final save_revision
- TEST DB writes/reset summary
- migration apply = 0
- Scene Stage B applied = 0
- frontend deploy = 0
- Production access = 0
- runtime/source/test edits = 0
- preserved manual playtest evidence status
- CURRENT_TASK final status
- exact STOP state

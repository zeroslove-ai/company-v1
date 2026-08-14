# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-scene-stage-a-live-scene-acceptance
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The prior task `cut2-scene-stage-a-api-cutover` deployed the reviewed Cut 2 API and passed the existing Cut 1 live canary, but stopped because the existing canary could not express the required Scene-specific navigation/presence assertions.

That STOP is evidence, not a runtime defect. Operator review confirmed that the existing `scripts/live-playtest-canary.mjs` has only opening/Cut1/playability modes and does not assert canonical scene location/navigation behavior. The exception already allowed by the prior task and `AGENTS.md` therefore applies: a narrow acceptance runner may be created because the current harness literally cannot express the required invariants.

Do not redo already-passed work merely to create activity. Recover and verify first.

## Mandatory canon

Read in this order before work:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `/docs/audit/CUT2_SCENE_LOCATION_PRESENCE_2026-08-14.md`
6. this file
7. Issue #68 comments for the prior failed report and operator review

Current Git/source/live DB/deployed identity outrank report prose.

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Reviewed executable SHA: `ce23612741599493921ae7c68b9ab58d6e23bcc6`
Prior docs-only HEAD: `f6144fe75f7df47372e39036d0f10a9b3c375120`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Commits after `ce236127...` must remain docs/workflow-only. Any runtime/migration/config/gate/test source delta after the reviewed executable SHA is a blocker and requires operator review.

## Operator-verified current TEST state

Supabase project: `fmcrspgxstsmxxsmkeee`
TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Production game: `11111111-1111-4111-8111-111111111111` — forbidden.

Independent readback after the prior run:

- committed_turn = 0
- save_revision = 841
- processing_status = idle
- player_setup = not_started
- opening_state = not_started
- actions = 0
- turns = 0
- csa_active = []
- canonical `save.scene.version = 1`
- scene_id = setup
- location_id = null
- present_npc_ids = []
- focal_character_id = null
- last_speaker_id = null

Scene migrations live:

- `20260814091536 / company_v1_scene_authority_stage_a`
- `20260814093123 / company_v1_scene_authority_stage_a_acl_closure`
- Scene Stage B is NOT applied.

Prior Codex report states the deployed Worker Version is `0fc0d42c-1327-454c-bce4-270cd0c1ff95`; re-verify deployed identity before relying on it. Do not treat this report value alone as operator authority.

## Goal

Finish only the missing Scene Stage A live acceptance and stop before Scene Stage B.

No new architecture implementation is authorized.

## Allowed

- read-only Git/source/DB/deployment verification
- TEST-only setup/opening/Story/Extract/Commit/reset calls needed for acceptance
- a **temporary out-of-repository acceptance runner** because the existing canary cannot express the required scene invariants
- importing existing repo helpers into that temporary runner when useful
- temporary evidence outside the repository or existing preserved-evidence convention
- targeted existing tests at exact reviewed source as deterministic supporting evidence
- docs-only truth/audit/CURRENT_TASK updates after full success

## Forbidden

- modifying or committing `src/**`
- modifying or committing `scripts/**` for the new runner
- modifying or committing `test/**`
- migration source edits or migration apply
- Scene Stage B apply
- frontend deploy
- Production access/write/reset
- provider/model changes
- retries/regeneration used to hide semantic failure
- new compatibility readers/gates
- PR Ready/merge
- `git clean -fd` or `git reset --hard`

The temporary acceptance runner must live outside the repo worktree (OS temp directory is acceptable) so preserved evidence and exact executable review identity stay untouched.

## Step 1 — recover prior accepted facts

Verify:

1. PR #67 remains Draft/Open/Unmerged.
2. `ce236127...` → current HEAD contains only docs/workflow changes.
3. Scene Stage A + ACL closure remain live; Stage B absent.
4. TEST is still in the clean canonical setup scene listed above.
5. current deployed Worker identity. If it is exactly the prior reported Version `0fc0d42c-1327-454c-bce4-270cd0c1ff95` and health still passes, do **not** redeploy.

If deployed identity cannot be verified, STOP:

`CUT2_DEPLOYED_IDENTITY_UNVERIFIED`

Do not redeploy just to avoid verification.

## Step 2 — deterministic source support

Run the existing focused Scene tests at the reviewed executable source. At minimum include `test/scene-runtime-contract.test.mjs` and the existing tests that cover navigation/Extract/commit boundary behavior.

Use these deterministic tests as supporting evidence for edge cases that cannot be safely forced through an LLM provider response.

Required deterministic invariants include:

- canonical NPC universe includes `general_npcs`
- stale compatibility presence/location cannot override canonical scene
- Engine authoritative navigation wins same-turn location conflict
- NPC-directed movement does not become player navigation
- invalid/missing optional scene observation fails open without killing the turn
- projection parity is derived from canonical scene

Do not add new repo tests during this rollout task.

## Step 3 — temporary live Scene acceptance runner

Create a narrow runner outside the repository. Reuse the deployed API and existing TEST game. The runner must record each request/action id and before/after canonical scene snapshots.

Minimum live flow:

1. verify/reset TEST clean if necessary
2. setup
3. Opening
4. verify canonical scene v1 exists
5. perform a normal committed turn and capture canonical scene + legacy projections
6. perform an explicit **player navigation** case grounded in current registered company content
7. verify `save.scene.location_id` changes to the deterministic registered destination
8. verify `player_scene_state.location_id` mirrors canonical location
9. verify legacy scene/presence mirrors agree with canonical scene rather than deciding it
10. perform an **NPC-directed movement command** case and verify the player location does not move merely because an NPC was told to move
11. context/history readback
12. final reset

Use existing known regression/content cases when still valid after source inspection; do not invent NPC names or location ids. In particular, if the current registered catalog still supports the regression `민아 보러간다` → heroine2/윤민아 → `brand_strategy_office`, it is a preferred explicit player-navigation case because the Engine navigation result must be deterministic and Extract cannot override it.

If that exact catalog case is no longer current, discover the equivalent registered destination from repo content and record the evidence used.

Do not require the provider to spontaneously generate a specific general NPC merely to prove registration. The general-NPC universe invariant may be satisfied by the exact deterministic Scene contract test plus live projection/readback showing no unknown-id rejection when such an NPC is naturally present.

## Step 4 — acceptance matrix

Full Scene Stage A acceptance requires all rows below to have explicit evidence:

### Live TEST evidence

- reset/setup/opening yields canonical scene v1
- normal Story/Extract/Commit succeeds under current deployed Worker
- at least one explicit player navigation changes canonical location deterministically
- player location compatibility mirror equals canonical location
- NPC-directed movement does not move player
- canonical scene and compatibility projections remain coherent
- context/history readback works
- no Stage B permission error
- final reset returns clean canonical setup scene

### Deterministic exact-source evidence

- `general_npcs` are in canonical NPC universe
- stale `npc_scene_state.location_id` is not navigation authority
- conflicting Extract location cannot override Engine navigation
- invalid/missing optional Scene observation fails open for that observation
- projection is canonical-scene-derived and idempotent

A real contradiction between live behavior and deterministic source is a blocker; preserve evidence and STOP.

## Step 5 — final reset

Required final live state:

- committed_turn = 0
- processing_status = idle
- player_setup = not_started
- opening_state = not_started
- csa_active = []
- actions = 0
- turns = 0
- canonical scene v1 exists
- scene location = null
- present_npc_ids = []
- focal_character_id = null
- last_speaker_id = null

Do not reset manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1`.

## Success policy

Only after the full matrix passes:

1. update `09_CURRENT_TRUTH.md` with actual verified live Cut 2 facts, including ACL closure, deployed Worker identity and Scene Stage A Golden Path acceptance
2. update Cut 2 audit with the same facts
3. change this file to `Status: WAITING_REVIEW`
4. commit/push docs-only changes
5. post completion report to Issue #68 using this Task ID
6. STOP before Scene Stage B

Do not create the Stage B task yourself.

Success phrase:

`CUT 2 SCENE STAGE A LIVE ACCEPTANCE PASSED — AWAITING STAGE B REVIEW`

## Failure policy

If a runtime defect is actually observed, preserve exact action/turn/scene/evidence and STOP. Do not patch runtime in this task.

If only the temporary runner itself is wrong, correct the temporary runner without touching repo source and rerun only the affected deterministic check; do not repeat provider calls unnecessarily.

Failure phrase:

`CUT 2 SCENE STAGE A LIVE ACCEPTANCE FAILED — STOPPED BEFORE STAGE B`

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-scene-stage-a-live-scene-acceptance
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- reviewed executable SHA
- deployed Worker Version verification
- PR state
- exact tests run/results
- temporary runner path and whether it remained outside repo
- live player-navigation before/after scene
- NPC-directed movement before/after scene
- projection parity result
- general NPC deterministic result
- Extract conflict result
- optional observation fail-open result
- context/history
- permission errors
- final reset state
- Scene Stage B applied = 0
- DB migration apply = 0
- frontend deploy = 0
- Production access = 0
- repo runtime/test/script changes = 0
- preserved evidence status
- docs-only final commit SHA on success
- exact STOP state

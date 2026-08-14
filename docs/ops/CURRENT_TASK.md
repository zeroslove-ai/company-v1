# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-scene-stage-a-api-cutover
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1. Do not start another architecture cut from backlog while this task is active.

Execution authority lives in this file. Codex completion reports and operator review results live in GitHub Issue #68 comments so report traffic does not move Git HEAD. Do not create report-only commits.

## Mandatory canon

Before work, read:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `/docs/audit/CUT2_SCENE_LOCATION_PRESENCE_2026-08-14.md`
6. this file
7. GitHub Issue #68 for operator/Codex handoff messages relevant to this Task ID

Current source / Git / live DB evidence outranks historical prose.

## Repository / branch guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Reviewed executable SHA: `ce23612741599493921ae7c68b9ab58d6e23bcc6`
PR: `#67`, base `company/test-suite-consolidation-v1`, Draft/Open/Unmerged

The task-registration commit containing this file is allowed to be a docs-only descendant of the reviewed executable SHA. Before any runtime operation, verify:

```bash
git branch --show-current
git rev-parse HEAD
git diff --name-only ce23612741599493921ae7c68b9ab58d6e23bcc6..HEAD
```

The only allowed pre-existing delta above `ce236127...` is workflow/canon documentation created for this task. If runtime, migration, config, gate, or test code changed after `ce236127...` unexpectedly, STOP.

## Operator-verified live prerequisites

Supabase project: `fmcrspgxstsmxxsmkeee`
TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Production game: `11111111-1111-4111-8111-111111111111` — forbidden in this task.

Cut 1 action authority:

- Stage A live
- Stage B live
- direct service-role gameplay DML count = 0
- obsolete action/Story/Extract/CSA-preapply legacy functions = absent

Cut 2 Scene Stage A live:

- `20260814091536 / company_v1_scene_authority_stage_a`
- `20260814093123 / company_v1_scene_authority_stage_a_acl_closure`

Verified Scene Stage A behavior:

- `legacy_only_save_accepted = true`
- `canonical_scene_save_accepted = true`
- `canonical_missing_nullable_key_rejected = true`
- `reset_returns_scene_v1 = true`

Verified ACL:

- `company_validate_scene_v1(jsonb, boolean)` → service_role EXECUTE false
- `company_bootstrap_scene_v1(jsonb)` → service_role EXECUTE false
- `validate_company_save_v1(jsonb)` → service_role EXECUTE true
- `reset_company_game(uuid, text)` → service_role EXECUTE true
- anon/authenticated EXECUTE false for all four

Current TEST after rollback-safe probes:

- committed_turn = 0
- save_revision = 833
- actions = 0
- turns = 0
- current stored save has no `scene` yet; Stage A reset/bootstrap is expected to create scene v1

Cut 2 Scene Stage B migration is NOT applied.

## Goal

Deploy the exact reviewed Cut 2 API behavior under the already-live Scene Stage A contract, then run one real TEST Golden Path proving canonical scene/location/presence behavior. Stop before Scene Stage B.

This is a rollout/acceptance task, not another implementation pass.

## Absolute scope

Allowed:

- read-only Git/source/DB verification
- temporary untracked live DB catalog/probe evidence
- API deploy dry-run through the gated wrapper
- API deploy through the gated wrapper
- TEST-only canary/reset required by the Golden Path
- docs-only verified-fact updates after successful acceptance

Forbidden unless a newly discovered blocker requires STOP:

- runtime source edits
- migration source edits
- DB schema changes / migration apply
- Scene Stage B apply
- frontend deploy
- Production access/write/reset
- provider/model changes
- PR #65/#66/#67 Ready or merge
- compatibility patching to hide a failed canary

## Step 1 — exact source verification

Confirm PR #67 still points to the reviewed runtime line and that any commits after `ce236127...` are docs-only task/canon commits.

Run targeted/full tests only as regression confirmation if the worktree is not already proven clean. Do not change runtime merely to preserve stale tests.

## Step 2 — live contract catalog

If the environment has read-only Supabase DB access, independently rebuild a temporary, untracked catalog from the live DB immediately before deployment.

The catalog used by the deploy gate must represent BOTH:

1. Cut 1 action contract at `stage_b`
2. Cut 2 scene contract at `stage_a`

Scene behavioral probes in the temporary catalog must be based on actual live verification, not invented defaults.

If live DB access is unavailable, STOP with exactly:

`WAITING_FOR_OPERATOR_LIVE_SCENE_CATALOG`

Do not hand-author a fake PASS catalog merely to unblock deployment.

Do not commit catalog credentials or temporary probe files.

## Step 3 — gated dry-run

Required environment contract:

```text
COMPANY_DB_CONTRACT_STAGE=stage_b
COMPANY_SCENE_DB_CONTRACT_STAGE=stage_a
COMPANY_DB_CATALOG_PATH=<absolute temporary live catalog json>
COMPANY_SCENE_DB_CATALOG_PATH=<same or exact scene-aware live catalog json>
```

Run:

```bash
node scripts/deploy-api-with-contract-gate.mjs --dry-run
```

Acceptance:

- Cut 1 action Stage B gate PASS
- Cut 2 scene Stage A gate PASS
- Wrangler dry-run PASS
- exit 0

Any gate failure = STOP. Do not bypass with direct Wrangler.

## Step 4 — exact API deployment

Only after Step 3 PASS:

```bash
node scripts/deploy-api-with-contract-gate.mjs
```

No direct `wrangler deploy` bypass.

Record:

- deployed Git HEAD
- executable review SHA `ce23612741599493921ae7c68b9ab58d6e23bcc6`
- Worker Version ID
- deployment time

A docs-only HEAD descendant is acceptable only if the executable/runtime diff from `ce236127...` is zero.

## Step 5 — health

Verify API health endpoint:

- HTTP 200
- `ok=true`
- `edition_id=company-v1`

Failure = STOP without retry loops or source edits.

## Step 6 — TEST Golden Path under Scene Stage A

Use the existing TEST canary/harness. Do not create a new harness unless the existing one literally cannot express the required assertions.

Minimum flow:

1. clean/reset TEST if required by existing canary guard
2. setup
3. Opening
4. verify reset/opening produces canonical `save.scene` v1
5. Turn 1 normal Story → Extract → Commit
6. replay same action and verify replay/idempotency invariance
7. context/history readback
8. Turn 2 normal Story → Extract → Commit
9. at least one deterministic navigation/presence case using current registered content if existing harness supports it
10. context/history readback
11. final reset

Required scene assertions:

- `save.scene.version === 1`
- canonical location/presence/focal/last-speaker are coherent
- `player_scene_state.location_id` mirrors canonical scene
- `scene_state` / `last_npcs_present` / NPC scene membership are projections only and agree with canonical scene when present
- registered general NPCs are not rejected by the canonical NPC universe
- stale `npc_scene_state.location_id` cannot redirect player navigation
- explicit player navigation changes canonical location deterministically
- NPC-directed movement command does not move the player
- Extract conflicting location cannot override Engine navigation
- missing/invalid optional scene observation fails open for that observation rather than killing the turn

Required Cut 1 regression assertions:

- Story replay `meta.replayed=true` and completion replay
- Extract replay `replayed=true`
- Commit replay `success=true`, `replayed=true`
- committed_turn/save_revision unchanged by replay
- no Stage B permission errors

Final reset acceptance:

- committed_turn = 0
- processing_status = idle
- player_setup/opening = not_started
- `csa_active=[]`
- recent/history = 0
- actions = 0
- turns = 0
- reset save contains canonical scene v1 under live Scene Stage A

## Failure policy

Do not retry/regenerate to hide semantic failure.

Do not add regex exceptions, compatibility readers, provider/model changes, or one-off gates.

Preserve failure evidence and STOP with exact failing step, action id/turn, source SHA, Worker Version, DB state, and error.

If failure reveals a real runtime defect, leave this CURRENT_TASK status unchanged and report the blocker for operator review.

## Success policy

On full success only:

1. update `09_CURRENT_TRUTH.md` with verified facts:
   - Scene Stage A live migrations including ACL closure
   - deployed Cut 2 API identity / Worker Version
   - Scene Stage A Golden Path PASS
   - Scene Stage B NOT APPLIED
   - PR #67 remains Draft/Unmerged
2. update Cut 2 audit with the same verified facts
3. change this file Status from `READY` to `WAITING_REVIEW`
4. record exact final docs-only SHA
5. post the completion report to GitHub Issue #68 as a comment with first lines:
   - `TASK_ID: cut2-scene-stage-a-api-cutover`
   - `STATUS: COMPLETE`

Do NOT create or start the Scene Stage B task yourself. The operator/reviewer will create the next CURRENT_TASK after reviewing this acceptance.

## Completion report

Post this report to GitHub Issue #68 as a comment. Do not create a report-only commit.

Report:

1. starting HEAD
2. runtime review SHA
3. final HEAD
4. PR #67 state
5. action Stage B gate
6. scene Stage A gate
7. dry-run
8. deployed Worker Version
9. health
10. setup
11. Opening
12. canonical reset/opening scene
13. Turn 1 Story/Extract/Commit
14. replay flags and revision invariance
15. Turn 1 context/history
16. Turn 2 Story/Extract/Commit
17. navigation/presence assertions
18. general NPC assertion
19. projection parity
20. permission errors
21. final reset state
22. Scene Stage B applied = 0
23. DB migration writes = 0
24. frontend deploy = 0
25. Production access = 0
26. runtime source changes after review SHA = 0
27. preserved evidence
28. CURRENT_TRUTH update SHA
29. CURRENT_TASK final status
30. PR #65/#66/#67 status

Success phrase:

`CUT 2 SCENE STAGE A API GOLDEN PATH PASSED — AWAITING STAGE B REVIEW`

Failure phrase:

`CUT 2 SCENE STAGE A API GOLDEN PATH FAILED — STOPPED BEFORE STAGE B`

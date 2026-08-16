# Company v1 — CURRENT TASK

Status: READY
Task ID: physical-sexual-evidence-boundary-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306916713` ACCEPTED `physical-sexual-state-authority-residue-audit-v1` at `8705b66e72c89b61c129b4d3f7fd0c217055e07d`.
Audit artifact: `docs/audit/PHYSICAL_SEXUAL_STATE_AUTHORITY_RESIDUE_AUDIT_2026-08-16.md`.

The accepted architecture is Story-authored narrative + narrow evidenced machine/UI projections + natural-language `turn_summary` memory. Do not reintroduce `open_facts`, `open_observations`, general relation/event/emotion/work ledgers, semantic taxonomies, or another memory layer.

## Proven defect

`src/engine/state/physical-state.js::buildSceneStatePatch()` currently emits `unevidenced_posture_change` / `unevidenced_position_label` warnings but still builds and applies a posture/position patch even when exact Story evidence is absent. This lets an unevidenced fresh Extract proposal become durable state.

Player input and ACTING metadata are intent/presentation only. They must not become physical success authority.

## Objective

Close the physical/sexual evidence boundary in one deletion-first source/test cut. Durable physical/mechanical projections may update only from exact Story-grounded Extract evidence. Optional projection misses must fail open: preserve previous durable state, emit warning, keep valid sibling domains, and do not block Story/Extract/Commit.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED.
2. Fix posture/position persistence:
   - exact Story evidence present -> apply arbitrary normalized posture/position text;
   - evidence absent/invalid -> keep previous posture/position, emit existing warning;
   - do not create a hard turn gate.
3. Preserve evidenced compact clothing behavior exactly. The four-slot clothing UI continuity state remains a proven narrow projection.
4. Audit `reducePlayerSexualObservation()` / `reducePlayerSexualState()` at the actual fresh caller boundary. Any changed arousal/progress/count/erection/mechanical field that currently becomes durable without exact Story evidence must be narrowed to the same fail-open rule: preserve previous field + warning, while valid evidenced sibling changes still apply.
5. Preserve `sexual_event_ledger` only as evidenced mechanical/UI/history state. Do not infer consent, affection, trust, relationship, intimacy stage, or CSA compliance from a sexual event.
6. Sexual action/type families and image tags remain presentation/mechanical projections only. Unknown classification must never erase the narrative meaning, create a semantic hard failure, or block Commit.
7. Re-run final caller proof for these residue candidates and delete them in this same cut when genuinely zero-production-caller:
   - unused `POSTURE_VALUES` / `END_REASON_VALUES`;
   - unused intimacy-stage validator and tests;
   - unused `requiredClothingFromActiveCsa` / remaining CSA physical-enactment residue and stale tests.
   If a real current consumer exists, keep only the narrow consumer surface and document it; do not add compatibility code.
8. Do not delete `player_sexual_state`, `sexual_event_ledger`, compact clothing, or image/media adapters merely because they are finite; they have proven consumers.
9. Do not touch historical applied migrations. No DB migration is authorized in this task. NPC sexual/relationship historical mirrors remain outside this source cut unless caller proof shows they are source-only and safely removable without DB/data migration.
10. Rewrite stale tests that assert unevidenced posture/position persistence. Add regressions proving:
   - unevidenced posture/position proposal is dropped while turn/sibling valid domains survive;
   - evidenced arbitrary text persists;
   - clothing evidence behavior is unchanged;
   - player sexual changed fields require exact evidence where applicable and fail open per-field;
   - sexual event/image classification miss cannot gate the narrative turn;
   - input/ACTING alone cannot create physical success.
11. Run focused physical/sexual/evidence tests, full `npm.cmd test`, changed JS/MJS syntax checks, and `git diff --check`.

## Architecture constraints

- No `open_facts`/`open_observations` resurrection.
- No new event/relation/emotion/posture/contact/sexual enum as narrative authority.
- No fuzzy repair, regex semantic gateway, retry/regeneration, provider/model change, parser relaxation/new parser, or arbitrary save patch.
- No compatibility runtime solely to preserve stale tests.
- CSA remains institutional context/lifecycle only; compliance is not consent/comfort/affection/trust/emotion or proof of physical occurrence.
- Image/media/TTS remain presentation sidecars and cannot gate narrative truth.
- One durable domain -> one canonical writer.

## Authorized operations

Authorized: source/test/docs edits on this branch; read-only source/history/PR inspection; local tests/static checks.

Not authorized: TEST live gameplay/reset, DB writes/migration/DDL, API/frontend deploy, Production, preserved manual-game access, new branch/PR, merge/Ready/rebase/squash/force-push.

## Acceptance

PASS only if unevidenced fresh Extract physical/mechanical proposals can no longer change durable state, evidenced arbitrary Story-grounded facts still project correctly, valid sibling domains continue to commit, proven clothing/sexual/media consumers remain functional, and zero-caller semantic residue is deleted rather than wrapped.

On PASS or deterministic blocker: set CURRENT_TASK to WAITING_REVIEW, post one immutable terminal report with exact source/test SHA, changed files, deletions/keeps, tests/checks, and forbidden-operation confirmation, then STOP. Do not generate the next task.
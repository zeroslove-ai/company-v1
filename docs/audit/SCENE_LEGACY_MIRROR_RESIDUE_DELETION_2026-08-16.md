# Scene legacy-mirror residue deletion — TEST rollout

Status: `WAITING_REVIEW` after PASS. The reviewed source/test/contract lineage
was applied to TEST and accepted by the bounded live rollout; operator review
remains the terminal gate.

## Identity and safety

- Start HEAD: `90c02f8b956dc6490179b4a4dd44d9bc854bfac9`
- Reviewed executable baseline: `a65a757d560ac15f01619de6df0eafbcc4905368`
- Source/test/migration candidate commit: `cd615b4`
- Branch: `company/scene-location-presence-v1`
- Canonical PR: #67, still open/draft/unmerged
- TEST migration apply: exactly once, ledger `20260816021437 /
  company_v1_scene_mirror_residue_closure`.
- API deployment: `game-proxy-company-v1` Version
  `744e74b9-4ac9-4596-9751-c754bdfbf6af`.
- Frontend deployment: `gamebuilder-company-v1` Version
  `9d7dcd0c-ab3f-45ab-87b5-71755d902ee5`.
- Production/manual-game access: `0`.

## Authority inventory

The durable scene authority is `save.scene` v1. The following active paths now
read or write that object directly:

| Domain | Canonical path | Result |
| --- | --- | --- |
| Old save/master ingress | `hydrateLegacySceneV1()` in `scene-reducer.js` | Retained as one-way, bounded old-shape -> `scene` bootstrap; input is not mutated. |
| Normal hydration | `hydrateGameplayState()` | Reads canonical scene when present, otherwise uses the bounded ingress; strips duplicate scene/location/presence mirrors from the hydrated save. |
| Turn commit | `reduceGameplayCommit()` | Persists `nextSave.scene`; no canonical-to-legacy projection remains. |
| Story/Extract context | `buildSceneContextCore()` | Reads canonical scene; any participant/location fields are transient prompt projection only and are not written back. |
| API display | `runtime-display.js` | Requires canonical scene v1 and derives NPC location from canonical scene plus catalog labels; legacy-only saves fail closed. |
| Frontend view/map | `view-model.js`, `company-map.js` | Presence, focal, speaker, and location come from canonical scene; physical NPC fields remain sourced from `npc_scene_state`. |
| Navigation | `scene-cast.js`, `turn-routes.js` | Destination is registered catalog data and the committed canonical scene; NPC mirror locations are ignored. |
| Setup/opening/reset contract | `20260816030000_company_v1_scene_mirror_residue_closure.sql` | Candidate source removes zero-consumer mirrors, preserves physical/clothing state, and validates canonical scene. Not applied. |

## Removed durable mirror writes/readers

Normal hydration and commit no longer recreate or require these duplicate
representations:

- top-level `scene_state`
- top-level `last_npcs_present`, `focal_character_id`, `last_speaker_id`
- `player_scene_state.location_id`
- `npc_scene_state[*].present`, `.location_id`, `.scene_id`
- `projectCanonicalSceneToLegacy()` and its module

The retained `player_scene_state` and `npc_scene_state` maps contain only
observed physical, clothing, posture, and position continuity that has product
consumers. The legacy ingress still reads old fields only when a save has no
canonical scene; a canonical save never falls back to those fields.

## Tests and fixtures

The affected behavioral tests were rewritten around canonical scene authority,
one-way legacy ingress, mirror-free hydration/commit, canonical UI/navigation,
physical-state preservation, setup/opening/reset candidates, and replay/history
invariance. Legacy-shaped values remain only as explicit ingress/conflict
fixtures or physical-observation inputs; no test requires a mirror to be
recreated.

- Baseline at task start: 42 test files / 422 `test()` declarations.
- Candidate: 42 test files / 417 `test()` declarations.
- No compatibility bag, alias, parser, retry, semantic matcher, or provider
  change was introduced.

## Validation recorded before operator review

- Focused scene/setup/opening/turn/navigation/frontend tests: pass.
- Full `npm.cmd test`: 417 passed, 0 failed, 0 skipped.
- Changed JavaScript syntax checks: pass.
- JSON/config syntax checks: pass.
- `git diff --check`: pass.
- Migration source is pending review only; no apply was attempted.

The additive migration is exactly
`supabase/migrations/20260816030000_company_v1_scene_mirror_residue_closure.sql`
and is included in `cd615b4`; it remains unapplied.

## TEST acceptance result

On dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, the canonical
reset, Setup, Opening, one exact provider-authored literal-choice turn, one
free-text turn, Story/Extract/Commit, same-action replay, context continuity,
and final canonical reset passed. Opening returned four literal choices. Root
scene mirrors, player location mirror, and NPC presence/scene/location mirrors
were absent across the new Worker readbacks. The final readback was clean at
`committed_turn=0`, `save_revision=1000`, zero turns, and zero actions; the
canonical `scene` and retained physical/clothing and protected state shapes
were present.

## Review boundary

Operator review must inspect the exact additive migration and its dependency on
the already-live scene Stage A contract before any migration apply or API
deployment. Cut 2 acceptance remains incomplete until that review and the
authorized live rollout gates are separately passed.

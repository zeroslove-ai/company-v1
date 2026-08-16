# Company v1 — CURRENT TASK

Status: READY
Task ID: scene-legacy-mirror-residue-deletion-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5305200734` ACCEPTED `legacy-save-reset-canonicalization-closure-v1`.

Latest accepted structural source/test/migration lineage includes:
- residue deletion source/test/migration: `9c52e74a8e32278207e6e9b729c33d64eb770fd1`;
- reset canonicalization correction: `a65a757d560ac15f01619de6df0eafbcc4905368`;
- terminal docs SHA before this registration: `7f2013504d2e3dd153ed14614d446a1f317b8b7e`.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, currently clean at turn 0 after canonical reset.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` remains forbidden: do not read, mutate, reset, or include it in data migration.
Production access is forbidden.

Independent read-only TEST inventory immediately before registration:
- Company saves: 3 total; 2 currently have canonical `scene`, 1 legacy save lacks it.
- All 3 `game_master.initial_save` rows currently lack canonical `scene`.
- All 3 saves still physically carry legacy `scene_state`, top-level `last_npcs_present`, `focal_character_id`, and `last_speaker_id`.

Current source facts:
- `readCanonicalSceneV1()` is strict and never falls back.
- `hydrateLegacySceneV1()` is the single JS compatibility reader for pre-scene-v1 saves.
- `projectCanonicalSceneToLegacy()` still writes canonical scene back into duplicate legacy fields on every hydration/commit: `scene_state`, top-level `last_npcs_present/focal_character_id/last_speaker_id`, `player_scene_state.location_id`, and `npc_scene_state.present/location_id/scene_id`.
- `hydrateGameplayState()` still canonicalizes legacy scene and then calls `projectCanonicalSceneToLegacy()`, recreating those mirrors.
- frontend `canonicalSceneView()` prefers canonical `save.scene` but still has a `legacy_pre_scene_v1` fallback.
- frontend physical display uses `npc_scene_state` posture/position/clothing fields; those physical fields are real consumers and must be preserved.

## Objective

Make `save.scene` the only active durable scene/location/presence/focal/last-speaker representation and delete duplicate active mirror writers/readers where current consumer proof allows it.

Do not break historical old-save ingress. One narrow compatibility ingress may remain solely to canonicalize a legacy save/master shape into `scene` before active runtime use or reset. It must not re-project canonical scene back into legacy mirrors.

## Required work

1. Freeze exact start HEAD and inventory every current source/test/SQL consumer and writer of:
   - `scene_state` scene/location/participants/beat/goal/focus fields;
   - top-level `last_npcs_present`, `focal_character_id`, `last_speaker_id`;
   - `player_scene_state.location_id` as a location mirror;
   - `npc_scene_state[*].present`, `.location_id`, `.scene_id` as membership/location mirrors;
   - `hydrateLegacySceneV1` and `projectCanonicalSceneToLegacy`.
2. Classify each use as one of:
   - canonical active consumer — migrate it to `save.scene` in this cut;
   - physical/presentation consumer — preserve only the non-scene physical/presentation data actually consumed;
   - historical ingress compatibility — keep only at a single bounded old-save/master canonicalization boundary;
   - dead/stale — delete in this cut.
3. Remove active duplicate scene mirror writing. Normal hydration/Commit must stop recreating legacy scene/location/presence/focal/last-speaker fields once canonical `scene` exists.
4. `npc_scene_state` must remain for proven physical/clothing/posture/position continuity, but membership/location identity must come from canonical `scene`. Remove durable `.present/.location_id/.scene_id` mirrors when no proven non-derivable consumer remains. Story/Extract/UI may derive transient presence/location from canonical `scene` at projection time; do not persist those derived values back into `npc_scene_state`.
5. `player_scene_state` must remain for physical/clothing state, but must not independently own player location. Remove durable `player_scene_state.location_id` mirror if caller audit confirms it is derivable from canonical `scene.location_id`.
6. Migrate frontend/server readers to canonical `scene`. If `scene_state.location_label` is the only remaining UI use of `scene_state`, derive the display label from the existing location/catalog/display source rather than retaining the whole durable legacy scene bag. Do not invent a new durable alias/bag.
7. Preserve one historical ingress only if required for actual legacy rows/master initial saves. `hydrateLegacySceneV1` may remain only as that bounded ingress, but after canonicalization the active save must not be projected back to legacy mirrors. If a narrower helper can replace it without duplicating semantics, simplify accordingly; do not create a second compatibility system.
8. Update `migrateCompanySave()`/equivalent canonicalization boundary so a legacy save can acquire canonical `scene` and zero-consumer mirror keys can be stripped on the next canonical write. Do not access or mutate the preserved manual game to prove this.
9. Audit the current DB validator/reset/setup/opening contract. Historical migrations are immutable. If the live DB still structurally requires zero-consumer legacy scene mirrors, author exactly one additive migration in this cut to stop requiring/recreating them while keeping canonical `scene` strict. Do not apply a data migration across all Company rows and do not mutate the preserved manual game.
10. The reset path may use the existing `company_bootstrap_scene_v1` only as a legacy `game_master.initial_save -> canonical scene` ingress before stripping dead mirrors and validation. The reset result itself should not retain zero-consumer scene mirrors once this cut proves they are unnecessary.
11. Setup/Opening/new-game paths must produce/retain canonical `scene` and must not recreate removed mirrors merely for compatibility.
12. Delete stale tests/fixtures/source assertions that preserve duplicate scene mirrors. Rewrite tests around canonical scene invariants and physical-state preservation. Test-count decrease is allowed and is not a failure by itself.
13. Required focused regression coverage:
   - canonical save hydration/Commit does not recreate removed scene mirrors;
   - legacy-shaped input is canonicalized once into `scene` at the bounded ingress;
   - canonical `scene` drives Story/Extract/UI presence/location/focal/last-speaker;
   - player/NPC physical/clothing/posture survives without durable scene mirrors in physical state maps;
   - reset candidate is canonical, deleted five semantic residue keys remain absent, and removed scene mirrors are not recreated when their consumers are gone;
   - navigation/location uses canonical `scene.location_id` only;
   - replay/history/turn_summary/parsed_blocks unaffected.
14. Run focused tests, full suite as regression signal, syntax/static checks, and `git diff --check`.
15. This is primarily a source/test/contract cleanup. If exactly one additive DB contract migration is necessary, author it but do not apply/deploy/live-test it in this task. Stop for operator review with exact caller proof and migration contents. Do not split off tiny follow-up fixes that can be safely closed within this source cut.

## Architecture constraints

- One durable domain -> one canonical writer/representation.
- `save.scene` is the only active durable authority for scene id, location, presence, focal NPC, last speaker, beat, goal and focus thread.
- Keep physical/clothing/posture/position data that has real product consumers; deleting scene mirrors must not delete those physical facts.
- Historical compatibility is allowed only at one bounded ingress and must converge to canonical state; it may not become a permanent second writer.
- Recent six raw Story + older natural-language `game_turns.turn_summary` remains narrative memory authority.
- Do not reintroduce `open_facts/open_observations`, general event/emotion/work ledgers, generic state bags, semantic enums/gates, alias maps, fuzzy repair, retries, provider/model changes, or another parser.
- Do not preserve legacy fields merely because stale tests or old SQL mention them.
- `npc_relationship_state` remains out of scope unless direct scene-mirror cleanup proves a specific dependency; do not redesign relationship semantics here.
- `sexual_event_ledger`, `npc_stats`, CSA, progression/TEST-Level7, literal choices, Mind Monitor, media/TTS and stable identities remain protected real-consumer systems.

## Authorized operations

Authorized:
- source/test/docs changes on the canonical branch;
- read-only TEST DB/catalog inspection;
- exactly one additive migration source file if caller/validator proof requires it;
- removal/rewriting of stale mirror-preserving tests/fixtures.

Not authorized:
- applying a new migration in this task;
- TEST gameplay/reset writes or deployment;
- any bulk data migration across Company rows;
- any Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- provider/model/config changes, retries/regeneration, semantic hard gates, new parser generation, compatibility bags/aliases.

## Acceptance

PASS only if:
- active runtime no longer writes duplicate scene/location/presence/focal/last-speaker mirrors that have no proven consumer;
- all active readers use canonical `save.scene` for those domains;
- any retained legacy compatibility is one-way old shape -> canonical scene at a bounded ingress only;
- physical/clothing/posture/position continuity remains intact;
- DB contract source, if changed, requires canonical scene without preserving zero-consumer mirrors;
- reset/setup/opening source contracts converge to canonical scene rather than rebuilding duplicates;
- no unrelated semantic state/gate/parser/retry system is introduced;
- focused/full regression evidence is clean or any failures are correctly triaged against the new canonical contract.

## Completion

On completion or a deterministic blocker:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit;
- report exact start SHA, source/test SHA, any additive migration path/SHA, removed vs retained mirror fields with consumer evidence, focused/full tests, and final docs SHA;
- no live migration/deploy/TEST reset/gameplay/Production/manual-game operation;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate the next task yourself.

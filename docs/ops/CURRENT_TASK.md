# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-final-residue-closure-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309607414` — ACCEPTED `minimal-story-runtime-physical-clothing-sexual-product-play-v2`.
Previous terminal: `5309574183`.
Previous docs-only final SHA: `93db5de1f927c87e4d9c95f19cef6068ccdd7355`.
Reviewed Minimal Story Runtime executable SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.

The accepted V2 product-play completed 12 ordinary turns with literal/free-text transport, canonical time, Story→Extract→Commit, context/history, replay/idempotence, media fail-open behavior and final reset. It did not naturally establish a completed physical/contact change, a compact four-slot clothing change, or a supported sexual event. Those are coverage limitations, not permission to rerun until lucky or broaden narrow mechanics.

Independent operator reset readback after V2 on disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`:
- committed_turn=0, save_revision=1140;
- game_turns=0, game_actions=0;
- player_setup/opening not_started;
- player_progress={level:1,exp:0};
- csa_active=[];
- canonical scene.version=1, scene_id=setup, empty presence.

Read-only reset key inventory nevertheless still contains legacy/duplicate-looking roots alongside canonical state:
- canonical/proven: `scene`, `npc_scene_state`, `player_scene_state`, `player`, `player_progress`, `player_sexual_state`, `csa_active`, `csa_rules`, setup/opening/turn state;
- suspicious residue requiring caller/writer proof: `scene_state`, `last_npcs_present`, top-level `focal_character_id`, top-level `last_speaker_id`, `last_choices`, `last_choice_meta`, `world_state`.
This inventory is evidence only. Do not delete a field merely because it looks old; trace current readers/writers/reset/default/validator contracts first.

Current source also has a concrete zero-caller candidate in `src/api/runtime-display.js`: `npcPayloadEntryLegacy()` still reconstructs old stats/CSA-attitude/NPC-sexual/relationship fallbacks while `buildNpcAppPayload()` calls the newer `npcPayloadEntry()` path. Helpers used only by that legacy function are deletion candidates once caller proof is confirmed.

Production is forbidden. Do not access preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`, QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`, or production/sentinel game `11111111-1111-4111-8111-111111111111`.

## Objective

Perform one deletion-first source/test/docs closure of the remaining **post-Minimal-Story-Runtime fresh-path residue**. The goal is not another architecture audit and not another product-play rerun. Trace actual current callers/writers/defaults/validators and remove stale semantic/presentation compatibility authority in the same cut where proof is complete.

The fresh runtime must remain explainable as:

`player input/literal choice → minimal committed context → Story → fresh parser wire structure → Extract narrow grounded observations + turn_summary → Commit structural transaction → committed readback/next Story`.

Do not replace removed residue with a new compatibility bag, semantic memory system, fallback hierarchy, parser, gate, retry or inference layer.

## Required work

1. Freeze START HEAD and verify PR #67 is still OPEN / DRAFT / UNMERGED, base `main`.
2. Re-read current `CURRENT_TRUTH.md`, Minimal Story Runtime canon, current source, current migration contract and tests. Historical roadmap prose does not override current source/canon.
3. Build a concrete current caller/writer/default/reset/validator map for the following surfaces and classify each `KEEP_CURRENT`, `KEEP_HISTORICAL_READ_ONLY`, `DERIVE_PRESENTATION`, or `REMOVE`:
   - `scene_state`;
   - `last_npcs_present`;
   - top-level `focal_character_id`;
   - top-level `last_speaker_id`;
   - `last_choices`;
   - `last_choice_meta`;
   - `world_state`;
   - `player_scene_state` fields that duplicate canonical scene/location versus fields that still carry narrow player physical/UI state;
   - `npc_scene_state` physical/clothing fields versus any legacy scene/presence/location identity fields;
   - any remaining raw relationship/stat/CSA-attitude/NPC-sexual fallback used only for presentation compatibility;
   - current server/frontend identity/name/profile fallback chains that can override `display.npc_directory` / registered catalog identity;
   - any remaining `compatibility_mode`, legacy read alias, duplicate context projection or stale save fallback encountered on these paths.
4. Start with the proven source candidate in `src/api/runtime-display.js`:
   - confirm `npcPayloadEntryLegacy()` has zero current production caller;
   - if zero, delete it in this cut;
   - delete `relationshipSummary`, `displayStats`, `statValue` or other private helpers only when their remaining caller count is also zero;
   - do not move their old fallback behavior into another function.
5. Scene/presence authority:
   - `save.scene` remains the only active durable scene/location/presence/focal/last-speaker authority;
   - no canonical→legacy scene mirror writer may be reintroduced;
   - if reset/default/migration source is still copying legacy scene mirrors into fresh saves, remove the active source of that duplication where safe;
   - preserve historical turn snapshots if they are immutable history, but do not make them fresh save authority.
6. Choice authority:
   - Opening uses its committed server projection;
   - ordinary committed choices come from committed `parsed_blocks.choices`;
   - if `last_choices` / `last_choice_meta` are now zero-reader fresh-save residue, remove their active defaults/writers/readers/validator requirements in this cut;
   - do not add a replacement choice cache or numbered semantic mapping layer.
7. Presentation/readback authority:
   - current context/display projection should win after refresh/recovery;
   - inspect frontend `characterName()` and similar fallback lists (`save.characters`, `save.npc_profiles`, `save.npc_identity_state`, `save.npc_state`, legacy player-name/department aliases) and remove only those with no unique current product consumer;
   - registered repository/catalog identity remains valid finite product identity and must not be weakened;
   - do not keep arbitrary old save bags merely as name fallbacks when the server directory/catalog already supplies the canonical identity.
8. Physical/clothing/sexual boundaries:
   - do not broaden compact clothing beyond its current proven four-slot UI contract merely because V2 narrated jacket/shirt state;
   - preserve `npc_scene_state` posture/position and compact clothing only where current UI/continuity consumes them;
   - preserve current direct-evidence `player_sexual_state` / `sexual_event_ledger` mechanics where proven;
   - do not infer consent, comfort, affection, trust, romance or relationship state from physical/clothing/sexual facts;
   - do not add positive-path forcing, synthetic Extract observations or fallback inference.
9. Memory/replay boundaries:
   - preserve latest-six raw committed turns + chronological older `turn_summary` memory;
   - preserve committed `parsed_blocks` replay/history authority;
   - preserve the one persisted legacy Extract read-only boundary only if current supported stored rows still require it;
   - do not recreate general open-fact/relation/event/emotion/work memory ledgers.
10. DB/reset/default closure:
   - inspect current live-compatible validator/reset/setup/opening SQL source and current master/default source read-only;
   - if fresh reset/default still structurally requires or recreates fields proven `REMOVE`, author **at most one additive migration source** that removes those fresh-save requirements/projections and strips them at the canonical reset/write boundary;
   - do not edit historical applied migrations;
   - do **not apply** any new migration in this task;
   - do not mutate any live game.
11. Tests:
   - add/rewrite focused behavioral regressions for each actually removed authority surface;
   - prove current server context/frontend still renders canonical scene, registered identity, choices, Mind Monitor, player capability, narrow physical/clothing state and sexual/media sidecars from the surviving authority;
   - prove refresh/recovery cannot prefer stale mirror data over committed projection;
   - prove reset/default source no longer reintroduces any field removed in this cut if DB source is changed;
   - delete stale tests that exist solely to protect the removed fallback/compatibility implementation.
12. Run focused tests, full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`. Test count is regression signal, not the acceptance definition.

## Architecture constraints

- Story LLM remains narrative authority.
- Fresh parser is wire/presentation structure only.
- Extract is one observer LLM: narrow grounded machine/UI observations plus natural-language `turn_summary`.
- Commit is structural/transaction authority only.
- `save.scene` is canonical scene/location/presence authority.
- Choices are provider-authored literals, committed through Opening or `parsed_blocks`.
- CSA is institutional lifecycle/context/progression, separate from unrelated consent/emotion/relationship state.
- Compact physical/clothing and sexual state remain narrow proven mechanics, not general narrative truth.
- Media/image/TTS/Mind Monitor are sidecars/presentation unless a separately proven mechanic exists.
- No generic relationship/event/emotion/work/open-fact ledger, entity graph, vector DB, importance score, semantic gateway, finite execution engine, third Summary/Memory LLM, new parser generation, fuzzy repair, retry/regeneration, provider/model change or compatibility replacement layer.
- Do not keep dead code solely because an old test expects it.

## Authorized operations

Authorized:
- read-only Git/PR/source/current migration inspection;
- read-only TEST DB catalog/contract inspection **only for the disposable TEST game or schema/function metadata**; do not query forbidden game rows;
- source/test/content/config/docs deletion/consolidation on the canonical branch;
- at most one additive migration source authored but NOT applied, only when proven fresh-save/reset contract cleanup requires it;
- local focused/full/static validation.

Not authorized:
- live TEST gameplay/setup/opening/reset or any DB write;
- migration/DDL application/reapplication;
- API/frontend deploy;
- Production access/deploy;
- any access to forbidden game IDs;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, new compatibility layer;
- widening narrow clothing/physical/sexual mechanics without a proven current product consumer;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Acceptance

PASS only if the cut produces a concrete caller-driven REMOVE/KEEP result, deletes proven zero-caller/duplicate fresh-path residue in the same implementation, and leaves one clear authority per active surface without adding replacement semantic machinery.

A successful result should specifically answer:
- whether `npcPayloadEntryLegacy()` and its helper-only fallback stack are gone;
- why each suspicious reset key listed above remains or is removed;
- whether fresh reset/default source still emits legacy scene/choice mirrors;
- whether frontend identity/readback fallbacks were narrowed to current committed/catalog authority;
- whether any additive migration source was necessary and, if so, that it remains unapplied.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post exactly one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact REMOVE/KEEP map, any additive migration source and unapplied status, focused/full/static checks, forbidden-operation confirmation and PR state;
- STOP. Do not generate the next CURRENT_TASK yourself.

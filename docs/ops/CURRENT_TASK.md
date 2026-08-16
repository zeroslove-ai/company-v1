# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: setup-opening-registered-identity-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task `setup-opening-world-definition-authority-v1` produced source/test/migration candidate `6b2c9941f8e6e89410a4518821bc0c6550785991` and was reviewed CHANGES_REQUIRED in Issue #68 comment `5305657230`.

The candidate direction is accepted except for one over-deletion: the unapplied migration removes SQL hardcoded heroine/world semantic lists, but also removes the registered-character identity-integrity check entirely. `primary_character_id` and supporting IDs are reduced to non-empty strings and can be persisted into canonical `save.scene` / `npc_scene_state` without proof that they belong to the game's registered character universe.

Accepted Scene cleanup executable remains `cd615b4926a5a7092247459d44d25f886b8ac92b` until this candidate is accepted and rolled out.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden in this task. Production access is forbidden.

## Objective

Correct the Setup/Opening authority candidate without restoring duplicate semantic catalogs.

Repository/application code remains the sole semantic catalog/world-definition authority. DB remains the sole transactional persistence boundary and must keep narrow registered-ID integrity. A newly registered repository/master character must work without SQL edits; an unregistered/ghost character ID must not be durably persisted into Opening/canonical Scene.

## Required work

1. Freeze exact START HEAD and verify #67 remains base `main`, OPEN / DRAFT / UNMERGED. Understand all executable changes after accepted `cd615b4...` before editing.
2. Reuse the existing unapplied migration source `20260816040000_company_v1_setup_opening_world_authority.sql`; because it has never been applied, correct that candidate rather than adding a second migration solely to repair an unapplied migration.
3. Keep the previous deletion decisions:
   - no SQL hardcoded department/position/body/speech semantic membership lists;
   - no finite weekday/location/work-hook/scene-goal semantic membership lists;
   - no SQL heroine-slot list or duplicated repository character catalog;
   - no removed Scene mirrors or duplicate turn-0 scene writer.
4. Restore registered-character identity integrity dynamically from the game's canonical repository/master projection rather than a hardcoded SQL list. Trace the actual current game/master storage and use the narrowest existing authoritative registered-ID projection available to the transactional boundary.
5. Primary/supporting Opening IDs must be proven registered before durable setup/opening/scene mutation. Unknown/ghost IDs must fail before persistence. Duplicate supporting/primary and structural shape checks remain strict.
6. Do not make DB a second semantic catalog. The identity check must consume game/master registered IDs, not independently enumerate heroines, roles, departments, locations, aliases, or semantic slots.
7. Preserve future repository extensibility: a new character/general-NPC that is present in the canonical master projection must pass without editing SQL.
8. Preserve the application-side semantic validation already added/proven in the previous candidate. Do not add a second API writer or direct save mutation.
9. Preserve ACL/security/search_path/idempotence/turn-0 guards and the single transactional `reserve_company_player_setup` writer.
10. Tests must prove, specifically:
    - repository-invalid semantic setup IDs are rejected before RPC;
    - a future valid repository catalog value does not require SQL list edits;
    - a registered future character ID in canonical master projection passes DB identity validation without SQL edits;
    - an unregistered/ghost primary or supporting character ID is rejected before durable mutation;
    - no hardcoded heroine list or fuzzy alias is reintroduced;
    - canonical `save.scene` remains the only scene/location/presence authority;
    - physical/clothing, stats, CSA, progression, choices, Mind Monitor/TTS, sexual/media/image adapters remain untouched.
11. Run focused tests, full suite, syntax/static checks, and `git diff --check`.
12. Update the authority audit note to distinguish semantic catalog deletion from retained dynamic registered-ID integrity.

## Architecture constraints

- One durable domain -> one canonical writer.
- Repository content owns semantic membership; DB may enforce only structural/transactional and registered identity integrity at this boundary.
- Stable registered IDs are a proven integrity consumer. Do not replace them with non-empty-string acceptance, fuzzy aliases, regex existence gates, or a hardcoded heroine enum.
- No compatibility overload, new parser, semantic `other`, retry/regeneration, provider/model/config change, deterministic fallback choices, or generic state bag.
- Institutional CSA compliance remains separate from consent/comfort/affection/emotion.
- Media/image taxonomy remains presentation-only and must not gate narrative facts.

## Authorized operations

Authorized:
- source/test/docs edits within this corrective cut;
- read-only Git/PR and TEST DB/catalog/function inspection;
- correction of the existing unapplied `20260816040000_company_v1_setup_opening_world_authority.sql` migration source;
- focused/full tests and static checks.

Not authorized:
- applying the migration to TEST;
- TEST gameplay/setup/reset or direct DB gameplay mutation;
- API/frontend deployment;
- Production access;
- any access to preserved manual game;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- provider/model/temperature/token changes, retries/regeneration, parser changes, fuzzy repair, compatibility aliases/overloads.

## Acceptance

PASS only if the corrected candidate keeps the semantic-authority deletion while restoring dynamic registered-ID integrity: repository/application owns meaning, DB transactionally rejects ghost character IDs using the canonical registered master projection, and no hardcoded semantic catalog is reintroduced.

If no canonical registered-ID projection is available at the DB transaction boundary without introducing a second authority, document the exact coupling and STOP BLOCKED rather than inventing a new catalog.

## Completion

On PASS or deterministic BLOCKED evidence:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit after source/test/migration candidate commit(s);
- report exact START SHA, corrected source/test/migration SHA, identity source used, tests/static checks, and FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate the next task yourself.

## Candidate completion record

- Start SHA: `8e2d6713938870c0f7bb7dd6851e423cd16160f9`
- Corrected source/test/migration SHA: `1a221665f91b352607724912ba8a06250ac60fc5`
- Existing unapplied migration corrected in place: `supabase/migrations/20260816040000_company_v1_setup_opening_world_authority.sql`
- Dynamic identity source: per-game `game_master.data.characters` and `game_master.data.general_npcs` object-key projection; no SQL heroine catalog restored.
- Focused Setup/Opening/bootstrap tests: 32/32 PASS
- DB contract gate tests: 11/11 PASS
- Full `npm.cmd test`: 420/420 PASS
- JavaScript syntax checks: PASS
- UTF-8 JSON/config parse: PASS
- migration static semantic-list scan: PASS; no finite semantic allowlist literals
- `git diff --check`: PASS
- Migration apply: 0; TEST/gameplay/setup/reset/DB writes: 0; deployments: 0; Production/manual-game access: 0
- Preserved evidence: unchanged
- Final docs SHA: recorded in the docs-only completion commit

Candidate is ready for operator review. No TEST rollout or deployment is authorized by this task.

# Setup / Opening / World-Definition Authority — 2026-08-16

Status: reviewed migration applied once on TEST; deterministic Opening acceptance
BLOCKED; `WAITING_REVIEW`.

## Boundary

- Start HEAD: `8e2d6713938870c0f7bb7dd6851e423cd16160f9`
- Accepted executable lineage: `cd615b4926a5a7092247459d44d25f886b8ac92b`
- Branch: `company/scene-location-presence-v1`
- PR: `#67`, base `main`, OPEN / DRAFT / UNMERGED
- TEST project was inspected read-only only. No TEST gameplay, reset, migration,
  database write, API deploy, frontend deploy, Production access, or preserved
  manual-game access occurred.

## Caller and writer inventory

The active application path is:

`/api/player-setup` → `validatePlayerSetupInput` with edition catalogs →
`buildOpeningPlan` from edition map/characters →
`reserve_company_player_setup` → `/api/opening` →
`commit_company_opening`.

The API has no direct save `PATCH`/`INSERT` writer. Setup and Opening persistence
remain named SECURITY DEFINER RPC calls. `commit_company_opening` is the sole
transactional Opening completion writer; `company_apply_opening_scene_v1` is a
non-granted pure projection helper used inside the transactional writers and
reset path.

The repository semantic sources are:

- `content/organization.json`, `positions.json`, `body_types.json`, and
  `speech_styles.json` for player setup catalogs;
- `content/characters.json` and `content/general_npcs.json` for one registered
  NPC identity universe;
- `content/map.json` for opening locations, hooks, goals, and location membership;
- `src/engine/player-setup.js` for server-side submitted-catalog validation and
  deterministic opening-plan construction.

The read-only TEST function inventory matched the current six-argument
`commit_company_opening`, `reserve_company_player_setup`,
`company_apply_opening_scene_v1`, and `company_bootstrap_scene_v1` definitions.

## REMOVE-OR-PROVE classification

| Rule / field | Decision | Proof / owner |
| --- | --- | --- |
| `department_id`, `position_id`, `body_type_id`, `speech_style_id` membership | Remove from DB catalog allowlists | Application validates against edition catalogs; DB retains non-empty string and numeric structural checks. |
| Weekday membership | Remove finite weekday list | Application-generated opening plan owns the semantic value; DB retains non-empty string shape. |
| `location_id`, `work_hook_id`, `scene_goal` membership | Remove DB semantic membership | `buildOpeningPlan` reads edition map content; DB retains required non-empty fields. |
| Primary/supporting character membership | Remove heroine list, retain dynamic identity integrity | Application supplies semantic IDs; the transactional reserve RPC checks the game's canonical `game_master.data.characters` + `general_npcs` key projection before any save mutation. |
| Registered NPC identity universe | Keep one repository/master projection | `masterFromEdition` combines `characters` and `general_npcs`; the DB consumes the per-game projection's keys and introduces no second SQL catalog. |
| Name/measurement ranges | Keep | Structural player-save integrity and existing product contract. |
| `edition_id = company-v1`, game/save lookup, turn-0 guard | Keep | Transaction identity and write boundary. |
| Setup ID conflict/idempotence | Keep | Transactional reservation invariant. |
| Canonical `save.scene` turn-0 projection | Keep one helper | `company_apply_opening_scene_v1` is the only scene projection authority; reserve no longer builds legacy scene mirrors before calling it. |
| Clothing initialization | Keep separate consumer | Existing initial-clothing helper and physical-state consumer remain unchanged. |

## Candidate change

`supabase/migrations/20260816040000_company_v1_setup_opening_world_authority.sql`
was the single additive migration source at candidate review. It did not edit
historical migrations and was unapplied at that review boundary. It replaces the active reserve function with the same RPC
identity and transaction/idempotence behavior, removes SQL semantic catalog
lists, removes duplicate turn-0 mirror construction, and keeps the canonical
scene projection helper as the sole scene projection boundary. The reserve
boundary retains structural non-empty/distinct checks and dynamically verifies
primary/supporting IDs against the game's canonical `game_master` projection;
it does not enumerate heroines or introduce a second semantic catalog.

The corrected source/test/migration candidate is `1a221665f91b352607724912ba8a06250ac60fc5`.

No compatibility overload, alias, fuzzy ID repair, parser, provider, retry, or
semantic fallback was added.

## Behavioral coverage

- `setup-opening.test.mjs` verifies invalid semantic setup IDs are rejected by
  application validation before the reserve RPC is called.
- The same test verifies future repository catalog IDs and future opening
  location/character IDs are accepted by pure application planning without an
  SQL semantic-list edit.
- The setup RPC contract mock verifies future IDs present in either the
  canonical `characters` or `general_npcs` master projection are accepted, while
  ghost primary/supporting IDs are rejected before the save changes.
- `setup-opening-bootstrap.test.mjs` verifies the registered NPC universe is
  the combined character/general-NPC master projection and that no JavaScript
  turn-0 full-save writer exists.
- Existing setup/opening/reset/replay tests continue to cover the sole RPC
  writer path, structured Opening persistence, canonical scene, and reset.
- Existing `db-contract-gate.test.mjs` remains behavior/evaluator based and
  retains Stage A/B cumulative and fail-closed contract coverage.

## Validation

- Focused Setup/Opening/bootstrap tests: PASS, 32/32, including dynamic
  registered-ID and ghost rejection behavior
- Focused DB contract gate tests: PASS, 11/11
- Full `npm.cmd test`: PASS, 420/420
- JavaScript syntax, UTF-8 JSON/config parse, migration semantic-list scan, and
  `git diff --check`: PASS
- No live write or deployment performed during candidate review

At candidate review, the migration remained pending operator review and a
separately authorized TEST rollout; the rollout result is recorded below.

## TEST rollout result — deterministic BLOCKED

The exact reviewed migration source from `1a221665f91b352607724912ba8a06250ac60fc5`
was applied once to project `fmcrspgxstsmxxsmkeee`. The live ledger contains
`20260816045221 / company_v1_setup_opening_world_authority` exactly once.
Live `reserve_company_player_setup` no longer contains finite semantic
department/position/body/speech/weekday/location/work-hook/scene-goal/heroine
lists; it checks registered primary/supporting IDs dynamically against the
per-game `game_master.data.characters` + `general_npcs` projection. The live
function has `SECURITY DEFINER`, `search_path=public, pg_temp`, and
`service_role` execute; the pure Opening helper has no service-role grant.
Canonical `save.scene` projection and deleted Scene mirror stripping remain
present, with physical/clothing state retained.

Dedicated TEST reset passed at the start (`save_revision=1001`). The single
ghost primary probe was rejected before mutation with `22023` and the same
save fingerprint/revision/setup/opening/scene/action/turn state was read back.
Valid Setup succeeded with registered `heroine1`/`heroine5`, but the first
Opening request returned HTTP 200 SSE `invalid_request: opening choices must
contain exactly four items` with `retryable=false`; this is the first and only
Opening attempt. The failure evidence is preserved outside the repository at
`C:\Users\JAEWAN\AppData\Local\hermes\company-v1-codex-watcher\setup-opening-world-authority-failure.json`.

No API/frontend redeploy, source/test/migration patch, second migration,
retry, provider/model change, or workaround occurred. The authorized final
TEST reset passed and read back `save_revision=1003`, `committed_turn=0`,
setup/opening `not_started`, canonical setup scene valid, removed mirrors
absent, and zero actions/turns. The world-authority rollout is not accepted;
Opening choice failure remains pending operator review.

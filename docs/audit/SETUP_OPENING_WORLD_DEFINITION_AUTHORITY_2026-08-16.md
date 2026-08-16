# Setup / Opening / World-Definition Authority — 2026-08-16

Status: source/test/migration candidate, `WAITING_REVIEW`; not applied or
deployed.

## Boundary

- Start HEAD: `829a2db55290de32d755030b8086c99cf8449387`
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
| Primary/supporting character membership | Remove heroine list | Application supplies registered edition character IDs; DB retains non-empty string, array cardinality, and duplicate checks. |
| Registered NPC identity universe | Keep one repository/master projection | `masterFromEdition` combines `characters` and `general_npcs`; no second SQL catalog is introduced. |
| Name/measurement ranges | Keep | Structural player-save integrity and existing product contract. |
| `edition_id = company-v1`, game/save lookup, turn-0 guard | Keep | Transaction identity and write boundary. |
| Setup ID conflict/idempotence | Keep | Transactional reservation invariant. |
| Canonical `save.scene` turn-0 projection | Keep one helper | `company_apply_opening_scene_v1` is the only scene projection authority; reserve no longer builds legacy scene mirrors before calling it. |
| Clothing initialization | Keep separate consumer | Existing initial-clothing helper and physical-state consumer remain unchanged. |

## Candidate change

`supabase/migrations/20260816040000_company_v1_setup_opening_world_authority.sql`
is the single additive migration source. It does not edit historical migrations
and is not applied. It replaces the active reserve function with the same RPC
identity and transaction/idempotence behavior, removes SQL semantic catalog
lists, removes duplicate turn-0 mirror construction, and keeps the canonical
scene projection helper as the sole scene projection boundary. The helper's
registered-membership list is removed; its structural non-empty/distinct ID
checks remain.

No compatibility overload, alias, fuzzy ID repair, parser, provider, retry, or
semantic fallback was added.

## Behavioral coverage

- `setup-opening.test.mjs` verifies invalid semantic setup IDs are rejected by
  application validation before the reserve RPC is called.
- The same test verifies future repository catalog IDs and future opening
  location/character IDs are accepted by pure application planning without an
  SQL semantic-list edit.
- `setup-opening-bootstrap.test.mjs` verifies the registered NPC universe is
  the combined character/general-NPC master projection and that no JavaScript
  turn-0 full-save writer exists.
- Existing setup/opening/reset/replay tests continue to cover the sole RPC
  writer path, structured Opening persistence, canonical scene, and reset.
- Existing `db-contract-gate.test.mjs` remains behavior/evaluator based and
  retains Stage A/B cumulative and fail-closed contract coverage.

## Validation

- Focused Setup/Opening/bootstrap tests: PASS
- Focused DB contract gate tests: PASS
- No live write or deployment performed

The candidate remains pending operator review and a separately authorized
TEST rollout.

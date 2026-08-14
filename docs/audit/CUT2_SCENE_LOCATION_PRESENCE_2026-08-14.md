# Cut 2 Scene / Location / Presence Candidate Audit

Status: implementation candidate only. This document records source-level
changes on `company/scene-location-presence-v1`; no Cut 2 migration has been
applied and no Worker has been deployed from this branch.

## Identity and safety boundary

- Start SHA: `a9d9c95efd3b8433873a693e34ab14e8f733a3e5`
- Review amendment base SHA: `8e5e6c524c77b8f9793585c3ca37c9f5bf8210f1`
- Branch: `company/scene-location-presence-v1`
- Base: `company/test-suite-consolidation-v1`
- Runtime baseline: Cut 1 deployed source remains
  `3c3b41425f0ef536c5d36aec2d4911e7d8de9a8d`
- TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Production access, DB writes, reset, migration apply, and deployment: zero

## Authority boundary

`save.scene` version 1 is the only durable scene authority in the candidate.
`readCanonicalSceneV1()` is strict and never falls back to legacy fields.
`hydrateLegacySceneV1()` is the one compatibility bootstrap for old saves and
does not mutate the input. After bootstrap, runtime readers use the strict
canonical reader.

The registered NPC universe is the union of the edition's `characters` and
`general_npcs` arrays. General NPCs are not a separate scene authority.

`reduceCanonicalScene()` is the scene reducer. It owns location, presence,
focal character, last speaker, beat, and updated turn. Presence is changed by
explicit quoted exit/entrance evidence, normalized quoted presence evidence,
and registered local Story speakers. A final snapshot or omission alone does
not add or remove an NPC; remote speakers never create local presence.

`projectCanonicalSceneToLegacy()` is the sole compatibility projection. It
updates legacy scene mirrors for old readers, overwrites the player location
from canonical scene, preserves unrelated physical state, and does not use
NPC scene location fields as authority.

## Navigation contract

Player text is intent only. `resolvePlayerNavigationIntent()` returns the typed
ephemeral value:

```json
{
  "kind": "player_navigation",
  "destination_location_id": "registered_location",
  "target_npc_id": "registered_npc-or-null",
  "source": "explicit_location|registered_npc_destination|player_office"
}
```

Explicit registered location aliases have priority. A unique registered NPC
mention resolves to that NPC's catalog `default_location_id`; ambiguous names
and vague movement produce no intent. The player's own office is resolved
deterministically from the player's department and the registered map. The
intent is used for Story preview and Commit; raw player text never writes a
location.

Extract location proposals are accepted only for a registered location with
an exact Story substring in `scene_observation.evidence` of kind `scene` that
matches the proposal. An Engine navigation intent wins a conflicting Extract
proposal. A proposal without that evidence is dropped with a warning.

## Database rollout source

The scene deploy preflight is fail-closed when the behavioral-probe catalog is
absent. An authorized TEST/target database readback must provide `scene_probes`
with the approved probe results; an offline catalog fixture can test evaluator
behavior but cannot authorize deployment. The manifest's EXECUTE expectations
are migration-faithful: public wrapper functions are executable by
`service_role`, while internal SECURITY DEFINER helpers are not granted
directly.

The additive, unapplied source migrations are:

- `supabase/migrations/20260814000500_company_v1_scene_authority_stage_a.sql`
  - adds scene validation/bootstrap helpers and a compatibility-safe validator
    and reset definition
- `supabase/migrations/20260814000600_company_v1_scene_authority_stage_b.sql`
  - makes `scene` structurally required and legacy scene mirrors optional

The candidate gate manifest is
`config/company-v1-scene-db-contract.json`. The gate checks migration names,
function type identities, SECURITY DEFINER, fixed `search_path = public,
pg_temp`, migration-faithful EXECUTE expectations, and stage-specific
behavioral probe results.
Future rollout remains Stage A → live gate → API cutover → Golden Path → Stage
B. These migrations are source candidates only and have not been applied.

`company_validate_scene_v1()` requires the same canonical scene key set as
`readCanonicalSceneV1()`, including nullable keys. The
`canonical_missing_nullable_key_rejected` probe is part of both stage
contracts.

The deprecated `hydrateCanonicalScene` alias had zero production and test
callers after inventory and was removed. Legacy mirror fields remain for the
compatibility projection and are not deleted in Cut 2.

## Verification performed

- scene authority targeted tests: pass
- DB contract gate behavior tests: pass
- affected prompt/reducer/map/transaction tests: pass
- full suite: `429/429` passing after the review corrections
- runtime source behavior is not deployed from this branch

The final candidate SHA and PR identity are recorded in the completion report;
this document does not promote the candidate to deployed truth.

## Out of scope

CSA semantics, Scene provider wording, navigation UI redesign, physical/sexual
state redesign, relationship architecture beyond scene presence/focal
projection, provider/model changes, and live database rollout remain outside
Cut 2 candidate implementation.

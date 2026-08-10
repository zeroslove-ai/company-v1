# Runtime Core Reset Operational Preflight

## Scope

This document records the repository-local, zero-effect preflight for the Runtime Core Reset. It reads migration and verification source only. It does not connect to Supabase, read or write a database/save, execute SQL, call an LLM, deploy a Worker, or create a test game.

Branch: `company/runtime-reset-operational-preflight-v1`  
Base: `company/runtime-reset-regression-coverage-v1`  
Base SHA: `a85de9c202cd59c03350a1ac3989332ce7d9a995`

## Static artifacts and hashes

The preflight script is `scripts/runtime-reset-operational-preflight.mjs`. It fails closed on missing files, byte drift, ordering drift, dangerous scope, or permission drift; it never rewrites a file.

| file | SHA-256 |
| --- | --- |
| `supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql` | `7bb0b023993181c63c36bb94aad5343d94ece08d83277d1ae898bb5f4dc411d6` |
| `supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql` | `cdcb7d2810b649eac4322d20df7b167e60c55aa2b56bd30022a53d3976ef8c89` |
| `supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql` | `cf0c9a75ec300b9c7a629cfcf694b5fabeef9d598f589b8c3d72c95798463b90` |

The historical clothing migration is immutable. Its hash is checked against the approved baseline and any drift is a hard failure.

## Phase 6 ordering and scope checks

The static checker verifies the actual SQL structure in this order:

1. preserving `company_apply_initial_clothing_v2` helper;
2. canonical `company_apply_opening_scene_v1` helper;
3. public setup/opening wrapper definitions;
4. company turn-0 backfill scoped by `edition_id = 'company-v1'`, committed turn 0, and an object opening plan;
5. revoke/grant handling.

It rejects updates to `game_master`, `game_actions`, or `game_turns`, broad `game_save` updates, and direct execution grants for internal helpers or the canonical helper. The verification source must cover canonical scene fields, clothing preservation, wrapper permissions, and unrelated-state preservation checks.

## External checks not performed

Every item below remains explicitly pending operational approval:

`NOT_CHECKED_REQUIRES_OPERATIONAL_APPROVAL`

- target Supabase project;
- migration history;
- backup snapshot;
- backup restore verified;
- no in-flight turns;
- service-role operator;
- rollback owner;
- dedicated test game.

No credentials, network API, Supabase client, `psql`, or Supabase CLI are used by the static preflight.

## Runtime regression status

The Runtime 17-turn audit remains the evidence-based result `covered: 6 / partial: 9 / missing: 0`. This preflight does not inflate live-model or operational coverage.

## First-game validation checklist (not executed)

After explicit operational approval, the first-game scenario should be checked in order: player setup, opening, turn 1, turn 2, movement, NPC presence, clothing preservation, and CSA projection. This repository-only PR does not create or inspect that game.

## Stop and rollback criteria

Stop before any apply if a required hash, migration order, function signature, permission scope, backup/restore check, in-flight-turn check, or operator/rollback owner check fails. Do not partially apply. If an approved operational apply fails, use the project’s approved backup restore/rollback procedure and record the owner and exact failure; do not improvise SQL repair from this preflight.

## Command and expected output

Run:

```text
node scripts/runtime-reset-operational-preflight.mjs
```

Expected first line:

```text
STATIC_PREFLIGHT=PASS
```

The output includes the three hashes, static order/scope results, and the `NOT_CHECKED_REQUIRES_OPERATIONAL_APPROVAL` list. The accompanying test is `test/runtime-reset-operational-preflight.test.mjs`.

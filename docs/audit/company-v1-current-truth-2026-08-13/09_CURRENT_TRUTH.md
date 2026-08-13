# Company v1 Current Truth — 2026-08-14

> **이 파일이 Company v1 기술 정본이다. 다른 과거 handoff/PR/architecture 문서와 충돌할 경우 명시적으로 supersede되지 않는 한 이 파일을 우선 확인한다.**

This is the human-facing technical baseline reconstructed from Git source,
GitHub metadata, preserved evidence, repository migrations, and the
architecture-reviewer read-only DB verification recorded in Issue #64.

## Identity

| Item | Current value |
|---|---|
| Repo | `zeroslove-ai/company-v1` |
| Audit branch | `audit/company-v1-authority-baseline-2026-08-13` |
| Starting amendment SHA | `1b7102497952ecc0d7564196d833c00ed642caf7` |
| Runtime baseline SHA | `5ba68bb204767756b9c8a4b5a72ea4003f2075b6` |
| Current audit PR | #62, OPEN / DRAFT / UNMERGED |
| TEST game | `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` |
| PRODUCTION game | `11111111-1111-4111-8111-111111111111` — not accessed |
| Supabase project | `fmcrspgxstsmxxsmkeee` |

## Precedence

1. Current checked-out source controls executable runtime behavior.
2. Live DB catalog and function bodies control deployed durable mutation facts.
3. Git ancestry controls lineage.
4. Immutable evidence controls what a captured run actually observed.
5. This file is the human-facing interpretation and target architecture.
6. Older handoff/PR/architecture prose is historical unless explicitly
   superseded or marked current here.

## Current architecture

```text
frontend setup/action/recovery
  → API reservation and stage orchestration
  → Supabase action/save/context boundary
  → Story prompt/provider stream
  → stream decoder/fresh parser
  → raw Story + parsed blocks
  → Extract provider/normalizer
  → evidence-gated observation reducers
  → Engine CSA/relation/scene inputs
  → commit_company_turn durable transaction
  → context/history hydration
  → frontend view model/renderer
```

The implementation has strong Story-first and reducer boundaries, but the live
DB confirms two important extra mutation surfaces: direct service-role table
DML and the callable CSA preapply RPC.

## Current authority map

- Normal turn durable save/turn state: `commit_company_turn`.
- Scene membership, location, focal, last speaker: `save.scene` v1 through the
  canonical scene reducer.
- Player/NPC physical and sexual state: evidence-gated structured reducers;
  Player input is intent, not successful state.
- Active relations: target one reducer receiving Engine and exact observation
  events; current two mutation paths are a conflict to close.
- CSA definitions and active rules: durable only inside normal Commit; live
  `apply_reserved_csa_transaction` is obsolete and must not survive cleanup.
- Raw Story: committed Story text is narrative evidence; parsed blocks are the
  committed replay projection.
- Choices, THOUGHT, summary: committed server turn/context.
- Frontend stream/session cache: temporary presentation only.
- Setup/opening persistence: DB RPC transaction; semantic world catalog:
  repository content/runtime validation.

## Current database truth

Live read-only verification confirms exactly six core public tables, RLS enabled
on all six, zero public policies, direct service-role table DML privileges,
nullable JSONB structured-action columns on actions/turns, exactly 18 public
functions, no live `_legacy_v2` aliases, and exactly 14 applied Company
migrations through `20260812071904 company_v1_preapply_csa_transaction`.

The live `apply_reserved_csa_transaction` function is `SECURITY DEFINER`,
service-role executable, and directly mutates `game_save.csa_active` and
`csa_rules` before normal Commit. The live `reserve_company_player_setup`
contains hardcoded world/catalog IDs and turn-0 projection construction. The
live `commit_company_opening` contains a mojibake empty-background fallback.
The last item is a known defect, not a change authorized by this audit.

## Known good

- `commit_company_turn` is the atomic normal-turn durable boundary.
- Canonical `save.scene` v1 and `reduceCanonicalScene()` exist in source.
- Evidence-gated physical/sexual reducers preserve intent-versus-observation.
- Fresh narrative protocol, Engine enactment binding, and committed parsed
  blocks provide a viable protocol path.
- Existing live canary/reset/E2E helpers are indexed for future Golden Path use.
- Historical PR ancestry and preserved evidence have explicit provenance.

## Known broken / structurally conflicting

1. Direct REST action PATCH writes coexist with RPC lifecycle mutation.
2. Live CSA preapply writes save state before `commit_company_turn`.
3. Scene compatibility fields can be mistaken for canonical membership/location.
4. `player_scene_state.location_id` can split from `save.scene.location_id`.
5. Engine and Extract currently have separate active-relation mutation paths.
6. SQL setup/opening logic duplicates repository world/catalog definitions.
7. Live opening summary fallback contains mojibake.
8. Fresh/persisted/legacy parser compatibility surfaces coexist.
9. Frontend stream/session caches are separate from committed context.
10. Open PR status still obscures absorbed versus unmerged lineage.

## Known unknown

- Whether any external client calls `apply_reserved_csa_transaction`.
- Full live bodies/indexes/constraints beyond reviewer-inspected surfaces.
- Exact current TEST data and deployed Worker source identity.
- Whether all compatibility readers have been removed from every deployed path.

## Do not touch in implementation cuts before owner approval

- Do not edit historical migrations; use additive cleanup migrations.
- Do not make CSA preapply or direct REST writes more authoritative.
- Do not rewrite scene and relation systems in parallel with the DB boundary cut.
- Do not repair the mojibake opening fallback in this audit amendment.
- Do not reset TEST, access Production, deploy, or alter provider/model settings.

## Deprecated / cleanup candidates

- Live `apply_reserved_csa_transaction` after caller audit: revoke/drop.
- Direct action-status REST PATCH helpers: replace with named RPC mutation.
- Legacy scene membership/location mirrors after reader migration.
- Duplicate SQL world/catalog allowlists after structural validation is retained.
- Legacy parser/Extract adapter after the compatibility window closes.

## Sole-writer decision

The binding target contract is in
`10_SOLE_WRITER_DECISION.md`. It is the required architecture decision before
runtime implementation resumes.

## One next development cut

**Authority Consolidation Cut 1 — DB mutation boundary**: replace direct action
status REST PATCH writes with named lifecycle RPC mutation(s), verify/remove any
CSA preapply caller, add an additive migration to revoke/drop the obsolete
preapply writer, and preserve `commit_company_turn` as the sole normal-turn
durable commit. Scene and relation rewrites are explicitly out of this cut.

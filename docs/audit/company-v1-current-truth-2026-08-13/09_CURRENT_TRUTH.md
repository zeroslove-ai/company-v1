# Company v1 Current Truth — 2026-08-13

> **이 파일이 Company v1 기술 정본이다. 다른 과거 handoff/PR/architecture 문서와 충돌할 경우 명시적으로 supersede되지 않는 한 이 파일을 우선 확인한다.**

This is the current-truth baseline reconstructed from Git source, GitHub PR
metadata, repository migrations, tests/harnesses, and preserved evidence. It is
not a claim that every live DB function or deployment control-plane value was
verified.

## Identity

| Item | Current value |
|---|---|
| Repo | `zeroslove-ai/company-v1` |
| Audit branch | `audit/company-v1-authority-baseline-2026-08-13` |
| Current baseline runtime SHA | `5ba68bb204767756b9c8a4b5a72ea4003f2075b6` |
| Audit directive commit | `05692cd68a3d9f57f6aa1c083408f0d7779e948e` |
| Current audit PR | #62, OPEN / DRAFT / UNMERGED |
| Tracking issue | #63, OPEN |
| TEST game | `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` |
| PRODUCTION game | `11111111-1111-4111-8111-111111111111` — not accessed |
| Supabase project | `fmcrspgxstsmxxsmkeee` |
| Recorded prior deployed SHA | `4447b176fb7e4eeaa53ad6cdbad92e2e845569c2`; report provenance only |

## Precedence

1. Runtime behavior: current checked-out source at the declared SHA.
2. Durable state: live DB catalog/data, once independently queried.
3. Git ancestry: proof of what entered a branch/main lineage.
4. Immutable live evidence: proof of what one captured run observed.
5. This document: developer-facing interpretation and disposition.
6. Older architecture/handoff/PR prose: historical or design guidance unless
   explicitly marked current here.

If this file conflicts with a newer owner-approved current-truth document, the
newer document must explicitly supersede this one.

## Current architecture

```text
frontend setup/action/recovery
  → API route reservation and stage orchestration
  → Supabase action/save/context boundary
  → Story prompt + provider stream
  → stream decoder + fresh narrative parser
  → raw Story / parsed blocks
  → Extract prompt/provider/normalizer
  → evidence-gated deterministic reducers
  → Engine CSA/relation/scene reducers
  → commit_company_turn durable save + game_turn
  → get_company_context/history
  → frontend view model and renderer
```

The architecture is already “Story first” in important places: raw Story is
the evidence record, Extract proposes observations, and reducers decide durable
state. It is not yet a single-writer system in every domain because legacy
mirrors, compatibility adapters, direct REST action updates, and dormant DB
functions remain.

## Current authority map

- Raw Story: persisted `game_turns.story_text`; parser output is not a
  replacement for it.
- Durable turn/save: commit route plus `commit_company_turn` boundary.
- Scene membership/presence: canonical scene reducer; legacy presence fields
  are projections/compatibility.
- Physical state: exact Story evidence through observation reducers; Player
  input is intent, not success.
- CSA definition: content catalog plus persisted structured active rule.
- CSA world obligation: Engine projection/mandatory enactment; provider prose is
  required visible evidence, not the primary world writer.
- Relations: structured `active_relations` with Engine and exact Extract
  update paths; presentation labels are not target authority.
- Time/location: canonical world/scene metadata; Story prose is display.
- Mind Monitor: observation/presentation; not relationship or sexual-state
  authority.
- Image: selector/projection from committed/evidence state and image catalog.
- Frontend: view model/rendering projection plus temporary stream/session state;
  not durable gameplay authority.

## Current database mutation surfaces

Repository migrations declare the core tables and 18 unique RPC/function names.
The active runtime is intended to use setup/opening reservation, action
reservation/status, Story/Extract staging, commit, feedback revision, and
context/history reads. `apply_reserved_csa_transaction` exists in the
repository migration but no caller was found under `src/**`; its live existence
and grants are UNKNOWN until a read-only DB catalog check is available.

The live DB currently cannot be independently catalogued in this audit
environment. Treat migration SQL as intended structure, not proof of applied
state.

## Current protocol

Opening and ordinary Story use marker-based narrative protocols. The Q.2
baseline aligns Opening ACTING with visible independent ACTING blocks, but
Opening remains a special lifecycle. Fresh parsing, persisted replay parsing,
stream decoding, Engine ACTING binding, and Extract observation are separate
boundaries. A malformed presentation block must not silently become a durable
world fact; conversely, mandatory Engine enactment binding is an integrity
boundary.

## Current role boundaries

### Extract

Extract observes raw Story and emits evidence-bearing domain observations. It
should not directly patch save state, select a target from stale presentation,
or promote Mind Monitor emotion into durable relationship/sexual fact.

### CSA

CSA has catalog, app transaction, applicability, trigger projection, Engine
enactment, runtime reducer, and UI surfaces. Its world rule is deterministic;
its visible narrative enactment is provider-rendered and validated. The current
open question is whether all CSA mutation paths converge on commit or whether a
live dormant DB preapply writer survives.

### Scene

Scene reducer owns canonical membership/presence direction. NPC detail,
physical posture/clothing, relation presentation, map and frontend records are
projections or domain-specific observations, not alternate scene membership
writers.

## Known good

- Git ancestry is now documented rather than inferred from session memory.
- Main contains the reset-authority stack (#47–#53) and early Company stack
  (#18–#25), even though those PRs remain open.
- Deterministic parser/reducer/CSA/front-end unit coverage is broad.
- Raw Story, evidence-bearing Extract, canonical scene direction, and
  Engine-side mandatory enactment are present in source.
- TEST and Production identifiers are distinct; preserved evidence has explicit
  phase files and should remain immutable.

## Known broken or structurally risky

1. Open PR status obscures which code is actually in main versus only in #61.
2. Legacy mirrors and adapters remain beside canonical reducers.
3. Direct action REST updates overlap RPC lifecycle mutation surfaces.
4. `active_relations` has Engine and Extract update paths that need a single
   explicit writer/update contract.
5. Opening and ordinary Story protocol contracts have historically drifted.
6. Fresh and persisted parsers are separate compatibility surfaces.
7. Content JSON and DB bootstrap/master data may duplicate world definitions.
8. Client stream/session state can diverge from committed context/history.
9. Migration-declared DB state cannot currently be proven against live catalog.
10. Old live evidence cannot be used as current behavior evidence without
    matching runtime SHA and protocol generation.

## Known unknown

- Exact live applied migrations, grants, constraints, and RPC bodies.
- Whether dormant `apply_reserved_csa_transaction` exists live and is callable.
- Current live DB hardcoded world data versus `content/**`.
- Exact current Cloudflare Worker source/version at audit time.
- Whether every old compatibility path is still called in deployed runtime.
- Whether all summary/choice/monitor mirrors have one durable precedence rule.

## Do not touch during next review

- Do not patch runtime to make an audit finding disappear.
- Do not deploy, reset TEST, or access Production.
- Do not delete old evidence or close/merge/ready PRs as cleanup.
- Do not remove DB functions until live caller/grant/catalog evidence exists.
- Do not add retry/regeneration or semantic gates as a substitute for authority.

## Deprecated / cleanup candidates

- Legacy narrative parser and legacy Extract adapter.
- Direct action status mutation if RPC lifecycle is confirmed sufficient.
- Dormant CSA preapply RPC if live catalog/caller audit confirms unused.
- `last_npcs_present` and other scene/presence mirrors after read migration.
- DB/content duplicated world definitions after canonical source decision.

## Open PR disposition

- ACTIVE: #62 audit, #61 current hotfix runtime line, #59 parent hotfix line.
- ABSORBED: #47–#53 and #18–#25; heads are ancestors of current main.
- REFERENCE_ONLY: #26 CSA boundary preflight.
- ABANDONED: #12 old renderer branch.

No PR was changed during the audit.

## Next development cut

**One cut only: establish a read-only live authority baseline before any runtime
rewrite.** Query the TEST project catalog (`pg_proc`, grants, migrations,
columns/indexes/RLS) and compare it with `05_DATABASE_BASELINE.md`, then choose
one durable writer for action lifecycle, scene/presence, and active relations.
Do not begin with another prompt or Opening patch.

## Next acceptance gate

Owner must approve a written authority decision that names, for each multi-writer
domain, the sole durable writer, allowed observers/projections, legacy removal
criteria, live DB migration status, and one Golden Path harness. Only after that
decision should runtime code changes resume.

# Company v1 Current-Truth Audit Ledger

Audit date: 2026-08-13 (Asia/Seoul)

This ledger is the resumable record of the audit. It records what was checked,
with which source, and what remains unverified. No runtime, frontend, test, or
database file was changed by this audit.

## Baseline

| Item | Evidence | Result |
|---|---|---|
| Repository | `zeroslove-ai/company-v1` | confirmed at `C:\Users\JAEWAN\projects\company-v1` |
| Audit branch | `audit/company-v1-authority-baseline-2026-08-13` | confirmed |
| Runtime baseline | `5ba68bb204767756b9c8a4b5a72ea4003f2075b6` | confirmed as hotfix tip and PR #62 base |
| Audit branch HEAD | `05692cd68a3d9f57f6aa1c083408f0d7779e948e` | directive-only commit before audit docs |
| PR | #62 | OPEN / DRAFT / UNMERGED confirmed through `gh` |
| Issue | #63 | OPEN; audit task confirmed through `gh` |
| Preserved local evidence | 12 untracked JSON files | present; intentionally not staged or modified |

## Surface checklist

| Surface | Status | Source checked | Important finding / unverified reason |
|---|---|---|---|
| Directive | DONE | `docs/audit/CODER_DIRECTIVE_COMPANY_V1_CURRENT_TRUTH_2026-08-13.md`, commit `05692cd` | Owner prompt filename set is used; owner prompt supersedes directive filename discrepancy. |
| Branch/worktree | DONE | `git status`, `git log`, remote refs | Only preserved evidence artifacts are untracked. |
| Open PR inventory | DONE | GitHub `gh pr list/view`, remote refs | 20 open PRs; ancestry classifications in `01_PR_INVENTORY.md`. |
| Git lineage | DONE | `git log --first-parent`, `git merge-base --is-ancestor` | Reset stack and early Company stack are ancestors of current main; #59/#61 are not. |
| Runtime request flow | DONE | `src/api/index.js`, `src/api/turn-routes.js`, `src/api/supabase.js` | API orchestrates reservation, Story, Extract, reduction, commit, and projections. |
| Story/Extract protocol | DONE | `story-prompt.js`, `story-wire-protocol.js`, fresh/persisted parsers, `extract-prompt.js` | Raw Story and parsed blocks have separate contracts; compatibility parsers remain. |
| CSA | DONE | `src/engine/csa/**`, `content/csa_presets.json`, related tests | Catalog/planner/projection/mandatory enactment/commit reducer are distinct surfaces. |
| Scene/state | DONE | `scene-reducer.js`, `observation-reducers.js`, `projections.js`, state modules | Canonical scene reducer coexists with legacy mirrors and hydration adapters. |
| Frontend | DONE | `src/frontend/pages/app.js`, `state.js`, `view-model.js`, `render.js` | View model is projection boundary, but session/recovery and streaming state are additional client state. |
| Test harness | DONE | `package.json`, `test/**`, `scripts/**` | Mock unit/contract suite plus live Worker/Supabase-capable scripts; live scripts are guarded and stateful. |
| Repository DB contract | DONE | `supabase/migrations/**`, `supabase/verification/**` | 6 base tables and 18 unique function names are defined in migrations. |
| Actual DB catalog | UNVERIFIED | Supabase REST attempted read-only; no SQL/catalog connector or usable management key | Current applied migration set, live grants, indexes, and `pg_proc` cannot be independently proven here. |
| Live evidence | DONE | preserved JSON artifacts and timestamps/embedded provenance | Phase-specific validity limits recorded in `07_LIVE_EVIDENCE_INDEX.md`. |
| Historical design docs | DONE | `docs/**` authority/runtime/contract/handoff documents | Documents are useful design evidence, not automatically current authority. |
| Production | NOT ACCESSED | user-provided prohibition | Production ID was not queried or mutated. |

## Read-only DB note

The repository contains a service-role Supabase REST configuration, but the
available key is rejected for direct browser-style REST catalog access. No
write, reset, migration, RPC execution, or Production request was made. The
database section therefore distinguishes **migration-declared** structure from
**live database-confirmed** structure.

## Audit decisions recorded

1. Source and Git ancestry outrank handoff prose.
2. A migration defines intended DB authority, not proof of current deployment.
3. A persisted field is not canonical merely because several readers consume it.
4. Raw Story is an observable narrative record; parsed blocks are a structured
   projection and protocol boundary.
5. Current-truth claims are marked UNKNOWN when live DB or deployment evidence
   is unavailable.
6. No corrective implementation is part of this audit.

## Completion gate

- [x] Required nine audit documents created.
- [x] Runtime/frontend/test/migration files unchanged.
- [x] Existing live evidence remains untracked and untouched.
- [ ] Owner architecture decision after review.

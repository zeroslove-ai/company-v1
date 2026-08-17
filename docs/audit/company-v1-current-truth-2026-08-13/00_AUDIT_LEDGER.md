# Company v1 Current-Truth Audit Ledger

Audit amendment date: 2026-08-14 (Asia/Seoul)

This ledger records the original audit and the read-only live DB amendment from
Issue #64. No runtime, frontend, test, migration, database, or deployment file
was changed.

## Baseline

| Item | Evidence | Result |
|---|---|---|
| Repository | `zeroslove-ai/company-v1` | confirmed |
| Audit branch | `audit/company-v1-authority-baseline-2026-08-13` | confirmed |
| Starting audit SHA | `1b7102497952ecc0d7564196d833c00ed642caf7` | confirmed |
| Runtime baseline | `5ba68bb204767756b9c8a4b5a72ea4003f2075b6` | unchanged |
| PR | #62 | OPEN / DRAFT / UNMERGED |
| Issue | #64 | OPEN; reviewer live DB evidence supplied in body |
| Supabase project | `fmcrspgxstsmxxsmkeee` | reviewer-verified read-only facts |
| Preserved local evidence | 12 untracked JSON files | untouched and uncommitted |

## Amendment checklist

| Surface | Status | Source | Finding |
|---|---|---|---|
| Original audit docs | DONE | prior `00`–`09` audit commit | UNKNOWN DB claims identified for amendment |
| Live core tables | VERIFIED | Issue #64 architecture reviewer catalog read | Exactly 6 Company public tables; RLS enabled; zero public policies |
| Live table privileges | VERIFIED | Issue #64 architecture reviewer catalog read | `service_role` has direct INSERT/UPDATE/DELETE on core tables; REST mutation is real |
| Live structured action columns | VERIFIED | Issue #64 architecture reviewer catalog read | Both action/turn `structured_action` columns are nullable `jsonb` |
| Live public functions | VERIFIED | Issue #64 architecture reviewer catalog read | Exactly 18; list recorded in `05_DATABASE_BASELINE.md` |
| Legacy aliases | VERIFIED | Issue #64 architecture reviewer catalog read | `_legacy_v2` aliases absent live |
| Applied migrations | VERIFIED | Issue #64 architecture reviewer catalog read | Exactly 14 applied through `20260812071904 company_v1_preapply_csa_transaction` |
| CSA preapply writer | VERIFIED | Issue #64 architecture reviewer catalog read | Live `SECURITY DEFINER`, service-role executable, mutates save before commit |
| Commit boundary | VERIFIED | Issue #64 architecture reviewer catalog read | `commit_company_turn` validates, inserts turn, updates save, commits action atomically |
| Direct action REST mutation | VERIFIED | `src/api/supabase.js` + live privileges | Direct PATCH helpers coexist with RPC lifecycle |
| DB/content duplication | VERIFIED | live `reserve_company_player_setup` body | Hardcoded IDs/catalog entries and turn-0 projections exist in SQL |
| Opening defect | VERIFIED | live `commit_company_opening` body | Mojibake empty-background fallback in `story_summary_overall`; docs-only record |
| Current source/harness | DONE | `src/**`, `test/**`, `scripts/**` | Reuse findings remain in `06_TEST_HARNESS_BASELINE.md` |
| Production | NOT ACCESSED | supplied prohibition | No Production query or mutation |

## Corrected evidence policy

The reviewer-verified catalog facts in Issue #64 replace the prior “live DB
UNVERIFIED” statements for the listed surfaces. They do not prove facts outside
the supplied read-only catalog scope, such as current TEST row values,
Cloudflare source identity, or every deployed caller path.

Historical migration comments such as `NOT APPLIED` are not deployment truth
when the version is present in `supabase_migrations.schema_migrations` and its
resulting schema exists live.

## Freeze confirmation

- [x] Runtime code changed: 0
- [x] Frontend code changed: 0
- [x] Test code changed: 0
- [x] Migration changed: 0
- [x] Supabase write/RPC execution/reset: 0
- [x] Deployment: 0
- [x] Production access/write/reset: 0
- [x] PR cleanup/close/merge/Ready: 0

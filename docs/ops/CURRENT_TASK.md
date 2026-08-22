# Company — CURRENT TASK

Status: READY
Task ID: company-r3-test-rls-exposure-audit-v1
Mode: READ-ONLY TEST DATA-EXPOSURE AUDIT -> CLASSIFY ADVISORY VS REAL EXPOSURE -> STOP
Updated: 2026-08-23 00:24 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, security framework, compatibility layer, or competing execution authority.

## 0. Authority / frozen product baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- feedback rollout terminal `5381058522`;
- feedback continuation terminal `5381140991`;
- operator freeze/review `5381157253`;
- accepted executable source `2898a929db239f210f448bab87579872aae8ec81`;
- this exact CURRENT_TASK blob after registration.

Feedback revision is now TEST-accepted and FROZEN. Do not reopen it absent a new real defect.

Accepted TEST identities remain fixed:
- API `game-proxy-company-r3` version `43179146-b0b3-4be9-b750-781c3ad3b61d`;
- frontend `gamebuilder-company-r3` version `016422f6-2c1f-4ac5-b4ec-eab7c7f2a5f6`;
- applied migration `20260822000300_company_r3_feedback_revision`.

Known unrelated capability exceptions remain frozen:
- CSA rule 7;
- CSA rule 9.
Do not sample, tune, or reinterpret them.

## 1. Purpose

During the accepted feedback rollout, Supabase CLI reported an existing critical `RLS disabled` advisory covering 11 TEST tables, including the new feedback revision tables.

The new feedback tables already proved explicit `anon` / `authenticated` table privileges denied and service-role-only RPC execution. The advisory therefore must be classified before any security mutation:

A. advisory-only / no practical unauthorized access under current grants/API boundary; or
B. real unauthorized read/write exposure reachable without service-role authority.

This task is READ ONLY. It does not authorize remediation.

## 2. Preflight

Before any probe:
1. Re-read Issue #68 and this exact CURRENT_TASK; STOP if a competing owner/operator directive or active lease exists.
2. Verify `main` remains executable-equivalent to accepted source `2898a929...` plus docs-only task registrations.
3. Verify the TEST project only. Do not inspect or touch Production.
4. Verify current migration ledger read-only; do not apply/revert/re-run any migration.
5. Verify no deploy is needed; reuse current TEST API/frontend identities.

If the TEST project or identities cannot be verified safely, STOP `BLOCKED_RLS_AUDIT_PREFLIGHT`.

## 3. Read-only inventory

Using TEST metadata/read-only SQL or equivalent safe introspection, identify the exact tables covered by the current Supabase RLS-disabled advisory.

For each advisory table, record only what is needed to classify exposure:
- schema/table name;
- RLS enabled/disabled;
- owner if useful;
- effective privileges for `anon`, `authenticated`, `public`, and `service_role` for SELECT/INSERT/UPDATE/DELETE;
- whether the table is exposed through the project's PostgREST/API schema under current configuration;
- relevant callable RPCs and their execute privileges if they can reach that table.

Pay special attention to all active `company_r3_*` gameplay tables and specifically:
- `company_r3_turn_revision_history`;
- `company_r3_feedback_attempts`;
- `company_r3_games`;
- `company_r3_state`;
- `company_r3_turns`;
- `company_r3_turn_jobs`;
- `company_r3_system_events` if present/current.

Do not create a generic security inventory framework or new repository audit document. Terminal evidence is enough.

## 4. Safe external reachability probes

Where possible without mutation, test the actual TEST REST/API boundary using unauthenticated and/or anon-equivalent requests.

Allowed probes are READ ONLY, e.g.:
- GET/HEAD/select-equivalent requests against advisory tables;
- calls to read-only RPCs if any are publicly executable;
- OPTIONS/schema reachability only when useful.

For each meaningful probe record:
- target table/RPC;
- auth context: no auth vs anon-equivalent;
- HTTP/status/error classification;
- whether any row data/metadata beyond normal API errors was returned.

Do not include secrets, service-role keys, auth tokens, or private row contents in Issue #68. If a response proves exposure, report only bounded structural evidence such as table name, row count >0, exposed column names if necessary, and status code.

### Absolutely forbidden write probes

Do NOT attempt INSERT/UPDATE/DELETE/UPSERT/RPC mutations merely to see whether they fail.

Classify write exposure from grants/function privileges/static authority only. No destructive or synthetic security test writes.

## 5. Classification

### GREEN / advisory-only

Classify `ADVISORY_ONLY_NO_PRACTICAL_ANON_EXPOSURE` only if all relevant evidence agrees that:
- anon/unauth/public cannot read gameplay/revision rows through the exposed API boundary;
- no public/anon executable RPC provides equivalent data access or mutation authority;
- write privileges are absent for unauthorized roles;
- service-role remains the effective privileged boundary.

An RLS-disabled scanner warning alone is not a product blocker if privileges/API reachability prevent unauthorized access.

### BLOCKED / real exposure

Classify `REAL_UNAUTHORIZED_DATA_EXPOSURE` if any unauthorized context can actually read protected gameplay/revision data, or static privileges prove a real unauthorized write path.

On first real exposure:
- stop additional breadth once enough evidence identifies the boundary;
- do not patch grants/RLS/source;
- report the exact narrow root surface;
- recommend the smallest follow-up correction task.

Do not broaden into a security redesign.

## 6. No product/game mutation

Do NOT:
- create/reset/mutate any game;
- continue the disposable feedback game;
- touch preserved games;
- submit turns or feedback;
- sample CSA;
- run Story/Observer/provider calls;
- deploy API/frontend;
- apply migration/DDL/RLS/policy/grant changes;
- change source/runtime/frontend/tests/config/provider/model/timeouts;
- touch Production;
- add security middleware, compatibility code, or new audit harnesses.

This task should leave repo executable source and TEST data unchanged.

## 7. Terminal report

Post exactly one terminal comment to Issue #68 and STOP.

If no practical unauthorized exposure is found:
`STATUS: COMPLETE_RLS_AUDIT_ADVISORY_ONLY_GREEN`

If real unauthorized exposure is proven:
`STATUS: BLOCKED_RLS_AUDIT_REAL_EXPOSURE`

If the boundary cannot be safely determined read-only:
`STATUS: BLOCKED_RLS_AUDIT_INCONCLUSIVE`

Terminal must include:
- Task ID and CURRENT_TASK blob;
- execution lease;
- start/final repo HEAD;
- confirmation no source/deploy/migration/DB/game/Production mutation occurred;
- TEST project identity and reused Worker identities;
- exact advisory table list or the subset actually returned by current scanner if advisory output changes;
- compact privilege matrix for unauthorized roles vs service_role;
- compact real REST/API read-probe outcomes;
- any publicly executable RPC boundary relevant to protected data;
- final classification;
- if BLOCKED real exposure: smallest recommended correction boundary only;
- if GREEN: state that no RLS/grant mutation is justified by this audit and return control to product work.

CSA 7/9 and feedback revision remain frozen throughout.

Then STOP. Do not overwrite CURRENT_TASK or choose the next task.
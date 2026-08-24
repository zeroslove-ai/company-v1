# Company — CURRENT TASK

Status: READY
Task ID: company-r3-test-migration-lineage-reconciliation-v1
Mode: TEST MIGRATION LINEAGE RECONCILIATION — SOURCE HISTORY ONLY / NO DB WRITE
Updated: 2026-08-24 21:39 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `8b543c4ec3077bd55d7f6eb5d5ca6946220fb4d2`
Accepted blocker review: Issue #68 comment `5395345392`
Blocked terminal: Issue #68 comment `5395267488`
Owner-accepted canon lineage: `docs/redesign/COMPANY_CANON.md` on current main
Staged convergence task to resume later: `company-r3-canon-convergence-staged-repair-v3`

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file.
- Do NOT create an ops branch or any other branch for this task.
- Read before work:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md`
  6. Issue #68 terminal `5395267488`
  7. Issue #68 operator review `5395345392`
  8. this CURRENT_TASK
- This is a migration-source lineage repair only. It does not authorize product/runtime redesign or semantic changes.

Target terminal:
`TEST_MIGRATION_LINEAGE_RECONCILED_AWAITING_OPERATOR_REVIEW`

Never claim OWNER_READY. Do not resume the staged product repair inside this task.

---

# 0. Why this task exists

The staged convergence run correctly stopped before TEST deployment because the live TEST Supabase migration ledger contains applied versions absent from the current checkout. `supabase db push --dry-run` failed with `LegacyDbPushMissingLocalError` before any write.

The terminal recorded remote-only applied versions including:

- `20260803043354`
- `20260803043423`
- `20260803043444`
- `20260803043638`
- `20260803124757`
- `20260803215756`
- `20260804102357`
- `20260810022340`
- `20260810022427`
- `20260810024638`
- `20260810091948`
- `20260810095457`
- `20260810095904`
- `20260812071904`
- `20260814023308`
- `20260814051254`
- `20260814091536`
- `20260814093123`
- `20260816011104`
- `20260816013408`
- `20260816021437`

Do NOT assume that list is complete. Query the live TEST ledger read-only again at task start and treat fresh evidence as authoritative.

Current repository `supabase/migrations/` also contains differently numbered historical migration files. Therefore the solution is NOT to blindly add remote filenames, and it is NOT to run migration-history repair. The task must reconcile both sides and prove which repository files are exact historical originals, renamed duplicates, or genuine forward migrations.

---

# 1. Hard prohibitions

This task MUST NOT:

- run `supabase migration repair` or mutate `supabase_migrations.schema_migrations` in any way;
- run non-dry-run `supabase db push`;
- apply any migration to TEST;
- author new schema behavior or new SQL semantics;
- rewrite the SQL body of an already-applied historical migration;
- fabricate/reconstruct a historical migration from guessed intent;
- use version/name similarity alone as equivalence proof;
- deploy API/frontend Workers;
- create/reset/mutate/play any TEST game;
- access or modify Production;
- change runtime/frontend/content/provider/model/config/secrets;
- cherry-pick/replay the local-only source edits described by terminal `5395267488` merely because they passed local tests;
- create another task file or branch.

Historical applied migration truth is immutable. The goal is to make repository migration source accurately represent that truth without changing the database ledger.

---

# 2. Fresh read-only inventory

Before changing repository files, capture a complete inventory.

## 2.1 Local repository inventory

For every current `supabase/migrations/*.sql` file record:

- version/timestamp prefix;
- filename;
- Git blob SHA and file hash;
- first introducing commit and reachable refs where practical;
- whether the exact file/version is currently present on `main`.

## 2.2 TEST migration ledger inventory

Against TEST project `fmcrspgxstsmxxsmkeee`, read migration history only.

Capture every applied row available from `supabase_migrations.schema_migrations`, including:

- version;
- name;
- statement list / stored statements when the live schema exposes it;
- any other non-secret provenance field useful for exact comparison.

Do not print credentials or secrets.

## 2.3 Git historical provenance search

Search all locally reachable Git history/refs/tags and relevant remote refs for exact historical migration files matching every remote-applied version absent from current `main`.

Use exact Git objects/commits where possible. Issue #68 historical migration-application comments may be used as corroborating provenance, but prose alone is not sufficient to manufacture SQL.

Fetch remote refs if needed, but do not create a working branch.

---

# 3. Required classification matrix

Build an explicit one-row-per-version matrix covering BOTH remote and local histories.

For every remote-applied version classify exactly one:

- `PRESENT_EXACT` — exact version/file already exists locally and statement evidence is consistent;
- `GIT_RECOVERABLE_EXACT` — exact applied-version file exists in historical Git and can be restored byte-for-byte with corroborating remote statement/name evidence;
- `APPLIED_EQUIVALENT_TO_RENUMBERED_LOCAL` — a current differently-numbered local file is demonstrably the same historical SQL as a remote-applied migration; exact statement order/content and Git provenance must prove this, not filename similarity;
- `UNPROVEN_REMOTE_APPLIED` — exact provenance/equivalence cannot be proven.

For every local version not present in the remote applied ledger classify exactly one:

- `GENUINE_FORWARD` — intentionally unapplied forward migration with no historical applied equivalent;
- `RENUMBERED_HISTORICAL_DUPLICATE` — exact content/provenance maps to a remote-applied version under a different filename;
- `UNPROVEN_LOCAL_ONLY` — cannot safely classify.

If ANY row is `UNPROVEN_REMOTE_APPLIED` or `UNPROVEN_LOCAL_ONLY`, STOP without changing migration source. Report the exact unresolved versions and evidence needed. Do not guess.

---

# 4. Permitted repository reconciliation

Proceed only if the complete historical matrix is proven.

Permitted source changes are limited to `supabase/migrations/*` and this existing `docs/ops/CURRENT_TASK.md` lifecycle file.

## 4.1 Restore exact applied originals

For every `GIT_RECOVERABLE_EXACT` migration:

- restore the historical file under its exact applied version/name;
- restore byte-for-byte from the proven Git object/commit;
- do not edit comments, formatting, SQL, grants, or statement order.

Remote stored statements are verification evidence, not a license to synthesize an approximate SQL file when no Git original exists.

## 4.2 Remove/replace renamed historical duplicates

A differently numbered current local migration may be deleted from `main` ONLY when all of the following are proven:

1. it is not an applied TEST version;
2. it is byte/statement-equivalent to a specific remote-applied historical migration;
3. Git provenance shows it is a renamed/canonicalized duplicate rather than a distinct later migration;
4. removing it does not strand a genuinely forward dependency.

Do not edit a renamed duplicate into a different migration. Restore the applied original and remove only the proven duplicate source alias.

## 4.3 Preserve genuine forward migrations

Leave every `GENUINE_FORWARD` migration unchanged. This task does not apply it.

---

# 5. Validation — dry-run only

After source reconciliation:

1. verify `git diff --check`;
2. verify every restored historical file hash equals its proven Git source object;
3. rerun the complete local-vs-remote classification and ensure no applied remote version is missing locally;
4. run `supabase db push --dry-run` against TEST only.

PASS criteria for the dry run:

- no `LegacyDbPushMissingLocalError`;
- no historical remote-applied migration is proposed for reapplication;
- no proven renamed historical duplicate is proposed as a new migration;
- every migration proposed by dry-run, if any, is explicitly classified `GENUINE_FORWARD` and remains unapplied by this task.

If dry-run proposes any ambiguous/historical migration, STOP and do not push/apply.

Do not run a non-dry-run DB command even after PASS.

---

# 6. Landing policy

If and only if the full lineage matrix and dry-run PASS:

- commit the migration-source reconciliation normally on `main`;
- fast-forward push `main` normally;
- verify local HEAD == origin/main;
- do not deploy or apply migrations;
- overwrite this same CURRENT_TASK file to `Status: WAITING_REVIEW` in the normal terminal lifecycle commit if required by the runner convention;
- post one terminal report to Issue #68.

The terminal report must include:

- start/final main SHA;
- fresh remote ledger count and complete remote-only/local-only classification summary;
- exact mapping of every restored applied migration to its Git source commit/blob;
- exact mapping of every removed renamed duplicate to the remote-applied version it duplicated;
- list of preserved `GENUINE_FORWARD` migrations;
- `supabase db push --dry-run` result;
- confirmation `migration repair` count = 0;
- DB write/migration apply count = 0;
- deploy count = 0;
- game mutation count = 0;
- Production access = 0;
- changed files;
- unresolved versions, if blocked.

Successful terminal:
`TEST_MIGRATION_LINEAGE_RECONCILED_AWAITING_OPERATOR_REVIEW`

Blocked terminal if provenance cannot be proven:
`TEST_MIGRATION_LINEAGE_RECONCILIATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

STOP after terminal. Do not automatically resume `company-r3-canon-convergence-staged-repair-v3`; operator review will register the continuation.
# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-migration-lineage-forensics-v2
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This task is a **read-only migration-lineage forensic continuation** after terminal `5317528635` (`BLOCKED_EVIDENCE_DRIFT`). It must not repair or mutate migration history. The purpose is to replace the obsolete hard-coded 21-version baseline with a fresh complete TEST migration snapshot and prove old→current migration provenance from primary evidence.

## 0. Frozen registration facts

- Repository: `zeroslove-ai/company-v1`
- Base `main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `test-migration-lineage-forensics-v1`
- Previous registration: `b0e31fbcbda5ade08aa125fc1f920ea0b0aa543a`
- Previous terminal SHA: `cb1b82db1a015f0b9fe9507a26aae9c871a4dcce`
- Previous terminal comment: `5317528635`
- Previous terminal classification: `BLOCKED_EVIDENCE_DRIFT`
- TEST Supabase project: `fmcrspgxstsmxxsmkeee`
- Cut 1 and Cut 2 are already landed on main; this task must not reopen gameplay source/runtime work.

At registration, an independent read-only query of `supabase_migrations.schema_migrations` returned **27 applied rows**, including the previously missing row:

- `20260803043354` — `company_v1_core_schema`
- `20260803043423` — `company_v1_turn_rpcs`
- `20260803043444` — `company_v1_feedback_and_reset_rpcs`
- `20260803043638` — `company_v1_lock_down_rpc_access`
- `20260803124757` — `add_company_player_setup_opening_rpcs`
- `20260803215756` — `lock_down_company_player_setup_opening_rpc_access`
- `20260804102357` — `company_v1_history_structured_action`
- `20260810022340` — `company_v1_initial_clothing_v2`
- `20260810022427` — `company_v1_canonical_opening_bootstrap`
- `20260810024638` — `company_v1_clothing_null_hotfix`
- `20260810091948` — `company_v1_commit_strict_validation`
- `20260810095457` — `company_v1_runtime_authority_consolidation`
- `20260810095904` — `company_v1_setup_weekday_validation`
- `20260812071904` — `company_v1_preapply_csa_transaction`
- `20260814000600` — `company_v1_scene_authority_stage_b`
- `20260814023308` — `company_v1_action_ownership_closure_stage_a`
- `20260814051254` — `company_v1_authority_enforcement_stage_b`
- `20260814091536` — `company_v1_scene_authority_stage_a`
- `20260814093123` — `company_v1_scene_authority_stage_a_acl_closure`
- `20260815000100` — `company_v1_test_level7_acceleration`
- `20260816000100` — `company_v1_opening_structured_persistence`
- `20260816011104` — `company_v1_legacy_save_residue_cleanup`
- `20260816013408` — `company_v1_reset_canonicalization_closure`
- `20260816021437` — `company_v1_scene_mirror_residue_closure`
- `20260816045221` — `company_v1_setup_opening_world_authority`
- `20260816050000` — `company_v1_minimal_story_runtime_contract`
- `20260817000100` — `company_v1_final_residue_closure`

The previous 21-version remote-only list is **obsolete evidence**. Do not use its count as an invariant.

## 1. Critical new evidence

`supabase_migrations.schema_migrations` stores not only `version` and `name`, but also the actual applied `statements` payload. A read-only sample for `20260804102357 / company_v1_history_structured_action` confirmed that the applied SQL text is recoverable directly from TEST migration history.

Therefore provenance must be based primarily on:

1. exact remote `version`, `name`, and stored `statements`;
2. current local migration file contents and hashes;
3. full Git history/branches/PRs for historical migration files and renames;
4. Issue #68 immutable migration application evidence;
5. only then, semantic/name similarity as secondary evidence.

Do **not** assert equivalence merely because names look similar.

## 2. Start freeze and drift handling

Before classification:

1. Confirm `origin/main` is still exactly `8f3c5326e483650211fbc6c9f54a7527d2278d4e`. If main changed, STOP `BLOCKED_MAIN_DRIFT` without mutation.
2. Confirm this branch is a docs-only registration descendant of that main.
3. Read the complete current TEST migration history as `version, name, statements` and record **Snapshot A**.
4. Inventory every current `supabase/migrations/*.sql` filename plus exact content hash.
5. Compute remote-only and local-only sets dynamically from Snapshot A and the local filenames. Do not hard-code expected counts.

Evidence drift rule for this v2 task:

- A difference from the **previous task's 21-version list is expected and is not a blocker**.
- Near terminal, take **Snapshot B**.
- If B == A: continue.
- If B only adds new applied rows, append those rows to the working set, classify the added rows too, then take **Snapshot C**. If C is stable, continue to terminal and report the additive drift.
- If any existing remote row is removed, its version/name changes, or migration history is otherwise rewritten: STOP `BLOCKED_EXTERNAL_MIGRATION_HISTORY_MUTATION`.
- If another additive change appears after the one catch-up pass (C differs again): STOP `BLOCKED_EXTERNAL_MIGRATION_ACTIVITY` rather than looping indefinitely.

No migration-history mutation is authorized to make snapshots match.

## 3. Required provenance reconstruction

For every remote-applied version whose exact filename is absent locally:

1. Export/read its exact stored `statements` payload without modifying it.
2. Search full Git history and available historical branches/PRs for:
   - the exact remote timestamp filename;
   - the migration `name`;
   - distinctive SQL fragments from the stored statements.
3. Compare the stored statements against:
   - exact historical migration file content, if found;
   - current migration files that appear renamed/re-timestamped;
   - later additive migrations only when there is concrete evidence they supersede/replace part of the old SQL.
4. Record exact commit/PR/blob/file evidence for every asserted mapping.
5. Inventory every local-only migration and determine whether it is:
   - an exact rename/re-timestamp of an already-applied remote migration;
   - genuinely unapplied additive work;
   - partially overlapping/superseding work;
   - unknown.

### Classification vocabulary

For each remote-only row, assign exactly one:

- `PROVEN_EXACT` — exact applied SQL provenance is established from stored `statements` to a Git historical/current file with content identity (newline normalization may be reported separately, but semantic-only similarity is insufficient).
- `PROVEN_TRANSFORMED_LINEAGE` — exact historical applied source is proven, and a later Git commit demonstrably renamed/re-timestamped/refactored it; current file is not byte-identical but the transformation lineage is explicit.
- `PARTIAL` — strong name/SQL/commit evidence exists but exact transformation or full statement identity cannot be proven.
- `UNKNOWN` — provenance cannot be established safely.

The terminal must report totals across the **final stable remote-only set**, not the obsolete 21-row set.

## 4. Required report

Create/update only:

- `docs/ops/TEST_MIGRATION_LINEAGE_RECONCILIATION.md`
- `docs/ops/CURRENT_TASK.md` lifecycle/terminal section

The reconciliation report must contain:

1. Snapshot A and final stable snapshot identifier/count.
2. Exact remote-only and local-only lists.
3. A table for every remote-only version with:
   - remote version/name;
   - stored-statements evidence/hash;
   - historical Git source file/commit/blob if found;
   - current candidate file if any;
   - classification;
   - confidence rationale.
4. A table for every local-only version with duplication/replay risk classification.
5. Explicit analysis of whether adding old timestamp files locally would cause duplicate execution risk.
6. Explicit analysis of whether remote history repair could be proven safe **without executing it**.
7. Exact remaining unapplied additive migrations needed for current landed main, if this can be proven.
8. One recommended next remediation classification from section 6.

## 5. Validation

Because this is docs-only/read-only forensic work:

- `git diff --check` must PASS.
- Verify changed paths are only the two docs files authorized above.
- No runtime/source/content/test/package/workflow/migration SQL file may change.
- No migration file may be created/renamed/deleted in this task.
- No DB/schema/history write may occur.

## 6. Terminal remediation classification

Choose exactly one:

### `LOCAL_HISTORY_RESTORATION_POSSIBLE`
Use only if exact historical applied SQL files can be restored locally from proven source bytes and doing so is shown not to create duplicate pending execution or corrupt current migration ordering. Do not restore them in this task.

### `REMOTE_HISTORY_REPAIR_REQUIRED_BUT_PROVABLE`
Use only if every history repair operation can be derived unambiguously from exact stored-statements/Git provenance and current schema lineage. Do not execute repair in this task.

### `ADDITIVE_BRIDGE_MIGRATION_POSSIBLE`
Use only if history mutation is unnecessary and a new additive migration can safely reconcile current required schema state while preserving applied history. Explain how the CLI/history mismatch is avoided; do not create/apply the bridge in this task.

### `LINEAGE_REMAINS_AMBIGUOUS`
Use if any material remote/local mapping remains PARTIAL/UNKNOWN or the safe remediation cannot be proven.

## 7. Forbidden operations

Strictly forbidden:

- `supabase migration repair`;
- any mutation of `supabase_migrations.schema_migrations`;
- migration apply;
- non-dry-run `supabase db push`;
- direct SQL writes/DDL/DML;
- creating old timestamp SQL files as a workaround;
- changing existing migration SQL files;
- Worker deploy;
- TEST fixture/game creation/reset/mutation;
- live provider/gameplay turns;
- Production access/change;
- runtime/source/content/test/package/workflow changes;
- starting Cut 3 or any unrelated gameplay work.

Read-only SQL against TEST migration metadata is authorized, including reading `statements`.

## 8. Stop condition

At completion:

1. Set this CURRENT_TASK to `WAITING_REVIEW`.
2. Post exactly one immutable Issue #68 terminal report containing:
   - registration/final SHA and task blobs;
   - final remote applied count;
   - final remote-only/local-only counts;
   - `PROVEN_EXACT / PROVEN_TRANSFORMED_LINEAGE / PARTIAL / UNKNOWN` totals;
   - snapshot drift, if any;
   - recommended remediation classification;
   - DB/history writes = 0;
   - migration apply = 0;
   - deploy = 0;
   - TEST gameplay mutation/live turns = 0;
   - Production access = 0.
3. STOP for operator review. Do not execute the recommended remediation and do not register a further task.

## 9. Terminal report — COMPLETE_FORENSIC_RECONCILIATION

Status is now `WAITING_REVIEW` after the stable v2 forensic report was
written. Registration: `88314d524ef0335a0a97194d9f7455cd12193c9c` with task
blob `bd4b27e0dd918e440a43c40d0016c54defc076f4`. Final commit/blob and exact
terminal identity are recorded in the immutable Issue #68 report.

Verified main remained `8f3c5326e483650211fbc6c9f54a7527d2278d4e`. Snapshot A
and B were both 27 applied rows with SHA-256
`e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`.
The final stable comparison is 22 remote-only and 25 local-only migrations.
Provenance totals are `PROVEN_EXACT=13`,
`PROVEN_TRANSFORMED_LINEAGE=0`, `PARTIAL=8`, `UNKNOWN=1`.

The recommended remediation classification is
`LINEAGE_REMAINS_AMBIGUOUS`; no repair or bridge was executed. DB/history
writes, migration applies, deploys, TEST gameplay mutation/live turns, and
Production access are all zero. STOP for operator review; do not register a
next task or execute the recommendation.

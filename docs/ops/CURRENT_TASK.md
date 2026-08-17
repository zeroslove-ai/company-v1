# Company v1 — CURRENT TASK

Status: READY
Task ID: scene-contract-gate-canon-reconciliation-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Repair only the stale TEST pre-deploy scene DB contract gate that blocked `test-runtime-live-acceptance-v1` before any Worker deployment or gameplay. The accepted TEST schema bridge is already applied and verified. Do **not** modify TEST DB/schema to satisfy the old gate. Reconcile the gate/manifest/tests to the accepted current canon, preserve fail-closed contract evidence, and STOP for review before any deploy/live session.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `test-runtime-live-acceptance-v1`
- Previous STARTED comment: `5318715906`
- Previous terminal comment: `5318843656`
- Previous terminal: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE`
- Previous final SHA: `63d4fb971ad9baceb1391f38ecb76debe1310d72`
- Previous final CURRENT_TASK blob: `2ecbfff920b9df5af071e4da8a07232d68033a51`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- Production: forbidden

Accepted post-bridge TEST invariants:
- migration rows = `27`
- target migration `20260817000200` absent
- bridge canonical = `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`
- forensic canonical = `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`
- `company_validate_scene_v1(jsonb,boolean)` MD5 `e982167db59fc5be1447b8866dd35a65`, `SECURITY INVOKER`, no `proconfig`, no service-role EXECUTE
- `company_bootstrap_scene_v1(jsonb)` MD5 `57b28451f9baaaba13e760b644eb38e3`, `SECURITY DEFINER`, `search_path=public, pg_temp`, no service-role EXECUTE
- `validate_company_save_v1(jsonb)` MD5 `d9a165eb01ee70cf92b63e7935e44f1b`, `SECURITY DEFINER`, `search_path=public, pg_temp`, service-role EXECUTE
- `reset_company_game(uuid,text)` MD5 `ebc2957fdf9e9a7eaf6c48d9a1e9604b`, `SECURITY DEFINER`, `search_path=public, pg_temp`, service-role EXECUTE

Binding source canon:
- `supabase/migrations/20260817000200_company_v1_gameplay_core_simplification.sql` intentionally defines `company_validate_scene_v1` as a narrow immutable structural validator without `SECURITY DEFINER` or a `SET search_path` clause.
- Historical `20260814000500_company_v1_scene_authority_stage_a.sql` defined an older extended validator as `SECURITY DEFINER`; that historical migration is evidence, not current semantic/security authority.

Observed gate defects to reproduce before editing:
1. `evaluateSceneCatalog()` unconditionally requires **every** scene-contract function to be `SECURITY DEFINER` and to have `search_path=public, pg_temp`, even though the manifest only explicitly models `service_role_execute` and current canon intentionally has an invoker-only internal validator.
2. Live `CATALOG_SQL` hardcodes `'scene_probes', '{}'::jsonb`, so any stage that requires scene behavioral probes cannot pass using the live catalog path regardless of actual DB behavior.
3. Existing unit fixtures encode the obsolete blanket-definer assumption through `functionBase()` defaults.

## 1. Mandatory start freeze

Before any edit:
1. fresh-fetch and require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`;
2. require this branch to descend directly from `63d4fb971ad9baceb1391f38ecb76debe1310d72` with only this registration commit before execution;
3. re-read terminal `5318843656`, current scene manifest, `scripts/company-db-contract-gate.mjs`, `test/db-contract-gate.test.mjs`, landed-main simplification SQL, and historical Stage A scene migration;
4. fresh-read TEST function metadata above and require exact accepted values;
5. recompute TEST migration row count/target absence plus both canonical hashes and require exact accepted values;
6. reproduce current scene Stage B gate failure without DB writes and record the exact failure set.

Any unrelated drift: STOP `SCENE_CONTRACT_GATE_RECONCILIATION_BLOCKED` with no source change.

## 2. Allowed repository scope

After registration, only these files may change:
- `scripts/company-db-contract-gate.mjs`
- `config/company-v1-scene-db-contract.json`
- `test/db-contract-gate.test.mjs`
- `docs/ops/CURRENT_TASK.md` lifecycle evidence

Do not modify migrations, runtime API/engine/frontend/content, package/workflow files, deployment configs, or unrelated docs.

## 3. Required correction — security contract must be manifest-driven

Do not weaken the gate globally.

Change the scene manifest/evaluator so each expected function explicitly declares its security contract, including at minimum:
- expected `security_definer` boolean;
- whether a safe `search_path=public, pg_temp` is required;
- expected `service_role_execute` boolean.

Current Stage B expectations must match accepted canon:
- `company_validate_scene_v1(jsonb,boolean)`: `security_definer=false`, safe search_path **not required**, `service_role_execute=false`;
- `company_bootstrap_scene_v1(jsonb)`: `security_definer=true`, safe search_path required, `service_role_execute=false`;
- `validate_company_save_v1(jsonb)`: `security_definer=true`, safe search_path required, `service_role_execute=true`;
- `reset_company_game(uuid,text)`: `security_definer=true`, safe search_path required, `service_role_execute=true`.

Rules:
- evaluator must reject either direction of a security-mode mismatch;
- when safe search_path is required, missing/unsafe path must fail;
- when not required for an invoker helper, absence of proconfig must not fail;
- ACL mismatch must still fail in either direction;
- action DB contract gate behavior must remain unchanged.

## 4. Required correction — live behavioral evidence must be real, not fabricated

The live gate may not keep `scene_probes: {}` while claiming Stage B deploy safety, and it may not simply remove all behavioral probes to make the gate green.

Design the narrowest fail-closed current-canon probe mechanism. Preferred direction:
- generate **non-persisting, deterministic structural scene/save probe results from the live DB** for functions that are safe to invoke without data mutation;
- probe the current six-key scene/save contract, not the obsolete extended `scene_id/beat/goal/focus_thread` authority;
- do not invoke `reset_company_game` in a pre-deploy read-only probe because it mutates persisted rows;
- if reset behavior cannot be proven non-persistently by the existing gate architecture, remove only the obsolete live reset behavioral requirement and continue to enforce its exact function identity/security/search_path/ACL metadata. Do not fake `reset_returns_scene_v1=true`.

At minimum, current Stage B behavioral evidence must prove with synthetic non-persisted JSON:
1. a canonical narrow six-key scene is accepted;
2. a scene missing a required six-key field is rejected;
3. a canonical save containing the narrow scene and no legacy scene mirrors is accepted by `validate_company_save_v1`;
4. a legacy-only save lacking current canonical scene/save shape is rejected.

Probe names may be updated to accurately describe current behavior. If stage_a historical compatibility probe names remain for historical tests, they must not force current Stage B live deployment to assert superseded semantics.

No probe may write to `game_save`, `game_turns`, `game_actions`, migration history, or any other persisted table.

## 5. Regression requirements

Add/update tests proving all of the following:
- invoker internal scene validator with no proconfig passes when manifest expects that exact contract;
- the same function fails if it unexpectedly becomes `SECURITY DEFINER`;
- a function expected to be definer fails if it is invoker;
- required safe search_path functions fail on missing/unsafe search_path;
- service-role ACL mismatch still fails in both directions;
- live current-canon scene probes PASS for the accepted narrow shape;
- each required probe independently fails when its behavior is false/missing;
- no live probe requires persisted writes;
- Stage B gate no longer depends on fabricated `{}` scene probe catalog;
- action Stage A/B gate regression remains intact.

Run focused gate tests, then full `npm.cmd test`; require 0 failures. Run syntax checks and `git diff --check`.

## 6. Read-only TEST proof after source correction

Using the corrected gate against current TEST:
- action Stage B: PASS;
- scene Stage B: PASS;
- exact accepted function/security/ACL metadata remains unchanged;
- migration rows/canonical hashes remain unchanged;
- gameplay row counts remain unchanged.

This task does **not** authorize applying any DB change to make the gate pass. If corrected gate still requires a DB semantic/security change, STOP `SCENE_CONTRACT_GATE_RECONCILIATION_BLOCKED` and preserve the exact mismatch.

## 7. Hard prohibitions

- Worker/frontend deploy: forbidden;
- live provider/gameplay turn or TEST reset: forbidden;
- any DB/schema/DDL/DML write: forbidden;
- migration apply/repair/history mutation/db push: forbidden;
- Production access/change: forbidden;
- hospital/v2 access: forbidden;
- provider/model/TTS/config change: forbidden;
- runtime/engine/frontend/content behavior change: forbidden;
- weakening/skipping the action gate: forbidden;
- replacing behavioral evidence with unconditional constants: forbidden;
- Cut 3: forbidden.

## 8. Terminal classification

Choose exactly one:

### `SCENE_CONTRACT_GATE_CANON_RECONCILED`
Only if source/test corrections are narrow, full tests pass, corrected action+scene Stage B gates pass against unchanged TEST, live scene probes are non-persisting and real, and no forbidden operation occurred.

### `SCENE_CONTRACT_GATE_RECONCILIATION_BLOCKED`
Use for any uncertainty, remaining contract mismatch, need for DB change, inability to produce non-persisting behavioral evidence, test failure, or scope drift.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, changed files, root cause, before/after exact gate failures, behavioral probe mechanism/results, full test count, TEST metadata/hash invariants, and safety counts;
3. STOP. Do not deploy and do not create the next task.

# Company v1 — CURRENT TASK

Status: READY
Task ID: integrate-reviewed-runtime-tooling-repairs-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Operator review decision

Previous accepted terminal:
- Task: `test-live-input-utf8-fidelity-v1`
- Issue #68 terminal: `5321824525`
- Classification: `LIVE_INPUT_UTF8_FIDELITY_PROVEN`
- Final SHA: `a4120b473a102f5625c34cc14b2c650823af1995`
- Final CURRENT_TASK blob: `a7ee3e1ed98528056f5c41ff78ff588f4f43e119`

Independent DB readback confirmed the UTF-8-safe probe action `UTF8검증: 브랜드전략팀 사무실로 이동한다.` is byte-exact in both `game_actions` and committed `game_turns`; the earlier 15-turn `?` corruption was runner/harness-side, not Worker/DB/provider evidence.

Before another full live acceptance, current `main` must first regain already-reviewed repair work that is absent from `8f3c5326e483650211fbc6c9f54a7527d2278d4e`. In particular, current main still requires obsolete `scene_id` for current V2 `kind:"scene"` Extract evidence and would reintroduce the previously reproduced Commit failure.

This task integrates only previously ACCEPTED source/test/tooling repairs into main. It does not invent new architecture and does not deploy TEST yet.

## 1. Frozen base and branch

Repository: `zeroslove-ai/company-v1`
Required base main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
Expected branch: `company/integrate-reviewed-runtime-tooling-repairs-v1`

The branch intentionally starts from exact main, not from the long ops/evidence descendant. Do not merge/cherry-pick the whole 30-commit evidence lineage.

Reviewed repair commits and accepted meanings:

1. Scene contract gate canon
   - reviewed commit: `0c4296fa6b6de27c68e4341ffae9c8caef28dd4b`
   - accepted classification: `ACCEPTED_SCENE_CONTRACT_GATE_CANON_RECONCILED`
   - integrate only:
     - `config/company-v1-scene-db-contract.json`
     - `scripts/company-db-contract-gate.mjs`
     - `test/db-contract-gate.test.mjs`

2. API smoke context canon
   - reviewed commit: `ca7481851510de89d9d1e5aa78e8e393a25cd5f7`
   - accepted classification: `ACCEPTED_API_SMOKE_CONTEXT_CANON_RECONCILED`
   - integrate only:
     - `scripts/smoke-api-worker.mjs`
     - `test/api-smoke-contract.test.mjs`

3. Frontend smoke asset canon
   - reviewed commit: `b7d86b7c3de2b5d7ec69e390ec627cf60917f493`
   - accepted classification: `ACCEPTED_FRONTEND_SMOKE_ASSET_CANON_RECONCILED`
   - integrate only:
     - `scripts/smoke-frontend-worker.mjs`
     - `test/frontend-smoke-contract.test.mjs`

4. Extract current-V2 scene-evidence roundtrip
   - reviewed commit: `d8fbc5cca47b62e897adc73afc816812f736316b`
   - accepted classification: `ACCEPTED_EXTRACT_SCENE_EVIDENCE_ROUNDTRIP_RECONCILED`
   - integrate only:
     - `src/engine/runtime-core/extract-observation.js`
     - `src/engine/runtime-core/persisted-extract-observation.js`
     - `test/extract-observation-contract.test.mjs`

Do not copy lifecycle docs, TEST bridge SQL/audits, migration-forensic docs, or unrelated commits from the long reviewed lineage.

## 2. Required preflight

Before source changes:

1. Fresh-fetch main and require exact `8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Verify this branch is exactly one docs-only registration commit ahead of that main.
3. Re-read Issue #68 terminal `5321824525` and this exact CURRENT_TASK blob.
4. Inspect each reviewed commit above directly. Do not rely on remembered summaries.
5. Confirm the target files on main still lack the accepted repair or differ only because of subsequent accepted main changes. If semantic conflicts exist, STOP instead of guessing.
6. Read-only TEST access is allowed only for contract-gate verification. No gameplay/reset/write/deploy.

## 3. Integration method

Reapply/transplant the reviewed hunks onto current main. Path-level cherry-pick, manual patch application, or equivalent is allowed, but the resulting semantics must match the reviewed repairs.

Do not:
- merge the old repair branch wholesale;
- bring `docs/ops/CURRENT_TASK.md` from old commits;
- import old migration-lineage/bridge documents;
- alter provider/model/TTS/bindings;
- add compatibility wrappers, semantic gates, routers, retries, finite action grammar, consent/event ledger, generic CSA DSL, or shadow architecture.

### Exact Extract contract to preserve

Current fresh/persisted V2:
- no `scene_id` manufacture or requirement;
- `scene_observation.location_id` is canonical;
- `kind:"scene"` evidence requires exact Story quote and non-empty `location_id` matching the observation location;
- current persisted Commit normalization recognizes the explicit current-V2 shape and does not reinterpret malformed current data as legacy;
- historical V2 rows with true legacy shape may retain the legacy `scene_id` compatibility path;
- validation remains fail-closed for quote/location provenance.

### Smoke/gate contracts to preserve

- API smoke uses an explicit valid game UUID, not the protected sentinel fixture and not a forced turn-zero assumption.
- Frontend smoke derives direct assets from deployed HTML and follows same-origin relative ES-module imports; deleted `/narrative.js` is not resurrected.
- Scene Stage B gate is manifest-driven for SECURITY DEFINER/search_path/ACL expectations and executes the accepted non-persisting current behavioral probes.

## 4. Allowed changed files

Before PR creation, repository diff versus base main may contain only:

- `config/company-v1-scene-db-contract.json`
- `scripts/company-db-contract-gate.mjs`
- `scripts/smoke-api-worker.mjs`
- `scripts/smoke-frontend-worker.mjs`
- `src/engine/runtime-core/extract-observation.js`
- `src/engine/runtime-core/persisted-extract-observation.js`
- `test/db-contract-gate.test.mjs`
- `test/api-smoke-contract.test.mjs`
- `test/frontend-smoke-contract.test.mjs`
- `test/extract-observation-contract.test.mjs`
- `docs/ops/CURRENT_TASK.md`

Any other path requires STOP `BLOCKED_REVIEWED_REPAIR_INTEGRATION_DRIFT` unless it is strictly generated metadata required by the normal PR mechanism and is not committed.

## 5. Verification

Run at minimum:

1. focused Extract scene-evidence contract tests;
2. focused DB gate tests;
3. focused API smoke tests;
4. focused frontend smoke tests;
5. full `npm test` / platform-equivalent npm command with zero failures;
6. `node --check` on every changed JS/MJS source/tool file;
7. `git diff --check`;
8. read-only Action Stage B gate PASS;
9. read-only Scene Stage B gate PASS.

No remote API/frontend smoke is required in this integration task because TEST Workers are still the old exact-main deployment. No Worker deploy is authorized here.

## 6. PR, review, and merge authorization

If verification passes:

1. commit the reviewed integration as one coherent source/test commit (registration/lifecycle docs may be separate);
2. create a PR to `main` from this branch;
3. require the PR diff to contain only the allowlisted paths and reviewed semantics above;
4. require exact-head CI green;
5. self-review the final PR diff against all four reviewed commits;
6. if no unresolved P0/P1 and CI is green, normal merge to `main` is authorized under the existing owner overnight delegation;
7. fresh-fetch merged main and record exact merge/main SHA and main CI result.

Do not deploy after merge in this task. TEST rollout + UTF-8-safe full live acceptance is the next task after operator review of this terminal.

## 7. Hard prohibitions

- Production/hospital-v2 access or mutation
- TEST gameplay/reset/game creation
- API/frontend Worker deploy
- DB DDL/schema/migration/history write
- `supabase db push` or migration repair
- provider/model change
- new gameplay architecture
- merge of unrelated old lineage
- Cut3 implementation

## 8. Terminal

Success terminal:
`REVIEWED_RUNTIME_TOOLING_REPAIRS_INTEGRATED_MAIN`

Blocked terminal:
`BLOCKED_REVIEWED_REPAIR_INTEGRATION_DRIFT`

At terminal:
- set CURRENT_TASK `WAITING_REVIEW`;
- post exactly one Issue #68 terminal containing registration SHA/blob, source commit, PR number/head, exact changed paths, focused/full tests, syntax/diff checks, Action/Scene Stage B results, CI, merge/main SHA if merged, and all safety/deploy/DB-write counts;
- STOP. Do not deploy TEST or begin live acceptance in this task.

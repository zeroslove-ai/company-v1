# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-deploy-target-contract-recovery-v1
Mode: NARROW OPERATIONS REPAIR — DEPLOY TARGET IDENTITY GUARD / ACCIDENTAL TEST WORKER RECOVERY / EXACT R3 DEPLOY
Updated: 2026-08-25 07:14 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `611bf8adade1535a447a1174a195cbbf19a41b14`
Previous task: `company-r3-media-catalog-authority-reconciliation-v1`
Previous terminal: Issue #68 `5401918399`
Operator review: Issue #68 `5401969795`
Accepted media implementation: `1055a7d34d5739f121b29af767cb5cd5a276ed04`
Accepted TEST R3 API before this recovery: `game-proxy-company-r3` / `fc98e0c3-db75-4088-bc0c-eddf129af4b6`
Accidentally deployed TEST Worker: `game-proxy-company-v1` / `8f418d6e-a552-4a9a-9c34-f8704d211f62`
Frozen TEST frontend: `gamebuilder-company-r3` / `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`R3_DEPLOY_TARGET_CONTRACT_RECOVERED_AWAITING_OPERATOR_REVIEW`

Operational blocked terminal:
`R3_DEPLOY_TARGET_RECOVERY_OPERATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Product/deploy blocked terminal:
`R3_DEPLOY_TARGET_RECOVERY_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or PR.
- Mandatory read order: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, `docs/redesign/MEDIA_CATALOG_CONTRACT.md`, terminal `5401918399`, operator review `5401969795`, then this task.
- Preserve A′/R3 architecture and all accepted CSA/product evidence.
- Freeze media curation/runtime semantics at `1055a7d...`: 102-entry repository manifest (5 general + 97 sex), manifest-first exact-image-id authority, DB serving-index only. Do not recurate/reinspect media unless needed only to verify deployed catalog identity.
- No Production access. No OWNER_READY claim.

## 1. Exact blocker

`scripts/deploy-api-with-contract-gate.mjs` currently hard-codes `wrangler.api.jsonc`, whose Worker name is `game-proxy-company-v1`.
The R3 task required `wrangler.r3.api.jsonc`, whose Worker name is `game-proxy-company-r3`.
The previous task therefore deployed the wrong TEST Worker once and never deployed the accepted R3 media implementation.

This task owns only:
1. deploy-wrapper target/config identity safety;
2. safe recovery of the accidental TEST `game-proxy-company-v1` deployment if its exact previous version is unambiguously recoverable;
3. exact deployment of accepted R3 source to `game-proxy-company-r3`.

Do not change media semantics, Story, Observer, TTS, CSA, gameplay, scene, MM, memory, DB schema, or frontend.

## 2. Preflight

Verify before writes:

- current `main` executable/content/test is `1055a7d...` plus lifecycle docs only;
- media deterministic results remain accepted: focused 12/12, full 567/567 from prior task; rerun only tests needed to guard deploy-wrapper changes plus full npm once before deploy;
- `wrangler.api.jsonc` resolves to `game-proxy-company-v1`;
- `wrangler.r3.api.jsonc` resolves to `game-proxy-company-r3`;
- current TEST frontend remains `af6c13bf...` and is not redeployed;
- current R3 API is still prior accepted `fc98e0c3...` unless read-only Cloudflare history proves otherwise;
- inspect Cloudflare Worker/version history read-only for both relevant TEST Workers.

Unexpected source/deployment drift => STOP product/deploy blocked. Do not normalize unrelated components.

## 3. Repair deploy target contract

Repair the smallest owning boundary, expected files:

- `scripts/deploy-api-with-contract-gate.mjs`
- one focused existing/new deploy-wrapper test under `test/` only if required

Preferred contract:

- wrapper accepts an explicit config target (for example `--config <path>` or an equally clear bounded option);
- legacy no-argument behavior may remain `wrangler.api.jsonc` only for backward compatibility, but it must be deterministic and tested;
- before Wrangler starts, parse/resolve the chosen config and establish its Worker `name`;
- allow an explicit expected Worker identity guard (for example `--expect-worker game-proxy-company-r3`);
- if chosen config Worker name != expected Worker, fail before Wrangler with zero deploy;
- R3 deployment invocation must explicitly choose `wrangler.r3.api.jsonc` and expect `game-proxy-company-r3`;
- legacy config must never satisfy an R3 expected-worker guard;
- R3 config must never satisfy a legacy expected-worker guard;
- preserve the existing DB contract gate; do not bypass it;
- do not embed secrets or change provider/model/config values.

Do not add separate R3 deployment scripts when the existing wrapper can be made target-safe cleanly.

## 4. Deterministic tests

At minimum prove:

- default legacy plan targets `wrangler.api.jsonc` / `game-proxy-company-v1` if backward compatibility is retained;
- explicit R3 plan targets `wrangler.r3.api.jsonc` / `game-proxy-company-r3`;
- mismatch expected-worker/config fails before Wrangler spawn;
- dry-run emits/uses the selected config, not a hidden hard-coded config;
- DB contract gate still executes before deployment;
- no arbitrary config path/Worker identity silently bypasses the guard.

Run:
- focused deploy-wrapper tests;
- `node --check scripts/deploy-api-with-contract-gate.mjs`;
- full `npm test`;
- `git diff --check`.

If these fail, STOP before any Cloudflare mutation.

## 5. Accidental TEST worker recovery

The previous task accidentally deployed `game-proxy-company-v1` version `8f418d6e-a552-4a9a-9c34-f8704d211f62`.

Read-only first:

- inspect Cloudflare deployment/version history for `game-proxy-company-v1`;
- identify the deployment immediately active before `8f418d6...` by exact version/deployment history, not by an old Issue comment guess;
- confirm that previous version belongs to the same TEST Worker and that restoring it does not touch Production.

If and only if the immediate previous version is unambiguous:

- restore/rollback `game-proxy-company-v1` exactly once using Cloudflare's version/deployment mechanism;
- verify resulting active version/deployment and a safe read-only health check;
- do not rebuild legacy source from a guessed Git SHA as a substitute for exact version rollback.

If the exact previous version cannot be established unambiguously, STOP `R3_DEPLOY_TARGET_RECOVERY_OPERATION_BLOCKED_AWAITING_OPERATOR_REVIEW` before any further deploy. Do not guess and do not deploy R3 while an unresolved accidental-worker mutation remains.

## 6. Exact R3 TEST deployment

Only after sections 3-5 are GREEN:

- obtain/provide the same read-only TEST DB catalog input required by the contract gate; no DB writes;
- invoke the repaired wrapper explicitly with `wrangler.r3.api.jsonc` and expected Worker `game-proxy-company-r3`;
- contract gate must PASS before Wrangler;
- deploy R3 exactly once;
- record old R3 version `fc98e0c3-db75-4088-bc0c-eddf129af4b6` and exact new version;
- verify deployed Worker identity is exactly `game-proxy-company-r3`;
- verify `/api/r3/catalogs` is reachable and exposes source-equivalent 102-entry media manifest, including exactly 5 `general` + 97 `sex` active entries and no DB-only semantic additions;
- no gameplay game creation, no media endpoint calls using preserved games;
- frontend deploy count 0;
- DB/storage writes 0;
- Production 0.

Never invoke `scripts/deploy-api-with-contract-gate.mjs` without explicit R3 target/identity for this deployment.

## 7. Frozen/forbidden

- changes to `content/media_catalog.json` = 0 unless unexpected source corruption is proven, in which case STOP for operator review rather than recurate;
- changes to `runtime-r3/domain/media.js`, `runtime-r3/server/worker.js`, `runtime-r3/server/supabase-store.js` = 0 unless a new deterministic deploy-only test proves the accepted `1055a7d` source is not actually present; otherwise STOP;
- Story/Observer/provider/model/prompt changes = 0;
- frontend source/deploy = 0;
- TTS/CSA/scene/MM/memory changes = 0;
- DB/schema/RPC/migration/ledger/history/backfill = 0;
- Storage upload/delete/mutation = 0;
- gameplay game creation/access/reset = 0;
- preserved evidence game access/mutation = 0;
- Production access/deploy = 0;
- new branch/PR/CURRENT_TASK file = 0;
- Media/TTS browser acceptance = 0 in this task;
- OWNER_READY claim forbidden.

## 8. Stop law

STOP immediately when:

- accidental legacy previous version is ambiguous;
- wrapper identity guard cannot deterministically distinguish legacy/R3 configs;
- contract gate cannot be satisfied read-only;
- any deployment targets a Worker other than the explicitly expected one;
- a second R3 deploy would be required due a deployment error;
- unexpected executable/config/deployment drift appears.

No retry-until-pass and no second corrective deploy within this task after a wrong target or failed mutation.

## 9. Terminal report contract

Report exactly:

- start/final main SHA;
- deploy-wrapper implementation SHA;
- final CURRENT_TASK blob;
- exact changed files;
- accepted media implementation SHA `1055a7d...` unchanged proof;
- focused/full/syntax/diff test results;
- legacy Worker read-only history: accidental version and exact immediate previous version evidence;
- legacy rollback performed yes/no, old/new active version, rollback count;
- R3 old/new Worker versions and deploy count;
- exact wrapper invocation/config/expected-worker identity used, with secrets omitted;
- contract-gate result;
- `/api/r3/catalogs` manifest count/pool verification;
- frontend version unchanged/deploy count 0;
- DB/storage writes 0;
- game creation/access 0;
- preserved-game access/mutation 0;
- Production 0;
- P0/P1/P2/P3 findings and any remaining operational blocker.

Success:
`R3_DEPLOY_TARGET_CONTRACT_RECOVERED_AWAITING_OPERATOR_REVIEW`

Operational blocked:
`R3_DEPLOY_TARGET_RECOVERY_OPERATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Product/deploy blocked:
`R3_DEPLOY_TARGET_RECOVERY_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task.

## 10. Terminal evidence

`R3_DEPLOY_TARGET_CONTRACT_RECOVERED_AWAITING_OPERATOR_REVIEW`

- Start main SHA: `4236f01342ae9c2cd00df4d6d8f4425045f77f65`.
- Final implementation SHA: `d2a4aafc04cd2993b1dde2a8f50caa400dc19de1`.
- Final CURRENT_TASK blob: recorded in the terminal Issue #68 report after this lifecycle edit.
- Changed implementation files: `scripts/deploy-api-with-contract-gate.mjs`, `test/deploy-api-with-contract-gate.test.mjs`.
- Lifecycle file: `docs/ops/CURRENT_TASK.md` only; no new task file, branch, or PR.
- Accepted media implementation `1055a7d34d5739f121b29af767cb5cd5a276ed04` remains unchanged; diff inventory contains no media catalog/runtime media file.
- Tests: focused deploy-wrapper `4/4 PASS`; full `npm test` `571/571 PASS`; `node --check scripts/deploy-api-with-contract-gate.mjs` PASS; `git diff --check` PASS.
- Legacy Worker history read-only: accidental `game-proxy-company-v1` version `8f418d6e-a552-4a9a-9c34-f8704d211f62`; exact immediate previous version `a1b1fee4-f388-4fb3-86e6-ca7f0d7e5c8b` at `2026-08-24T16:00:08Z` was unambiguous.
- Legacy rollback: yes, exactly once; active version changed from `8f418d6e-a552-4a9a-9c34-f8704d211f62` to `a1b1fee4-f388-4fb3-86e6-ca7f0d7e5c8b`; `/health` returned HTTP 200 with `ok:true`.
- R3 Worker: old accepted version `fc98e0c3-db75-4088-bc0c-eddf129af4b6`; new active version `4f8e8697-7b9e-4d91-8a50-35463309ce4a`; deploy count `1`.
- Wrapper invocation: `node scripts/deploy-api-with-contract-gate.mjs --config wrangler.r3.api.jsonc --expect-worker game-proxy-company-r3`; secrets omitted. Dry-run and actual invocation both selected the explicit R3 config; gate ran before Wrangler.
- Contract gate: read-only TEST catalog, Stage A PASS (`company-v1-action-authority`, v2).
- `/api/r3/catalogs`: HTTP 200; edition `company-v1`, version `1`, `102` entries total = `5` general + `97` sex.
- Frontend version unchanged; frontend deploy count `0`.
- DB/storage writes `0`; game creation/access/reset `0`; preserved-game access/mutation `0`; Production access/deploy `0`; Media/TTS browser acceptance `0`.
- Findings: P0 none; P1 deploy target/config identity boundary repaired and accidental TEST deployment restored; P2 none; P3 none. Remaining blocker: operator review only.

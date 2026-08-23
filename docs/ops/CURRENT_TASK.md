# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-worker-deployment-hygiene-rollback-v1
Mode: SOURCE-FROZEN DEPLOYMENT HYGIENE -> PROVE LEGACY WORKER PREIMAGE -> CONDITIONAL EXACT ROLLBACK -> VERIFY R3 ARTIFACT
Updated: 2026-08-24 07:23 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388744342`
Operator review: Issue #68 comment `5388768658`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Accepted source — freeze

Accepted executable/source:
- `71f87b63c9405bdc2e41ff272c0448c0b41384b7`

Reviewed final main before this registration:
- `e394db6b35d5c65342092cd666f08c7d93e7960f`
- direct docs-only child of accepted source.

Accepted source scope:
- `runtime-r3/server/provider.js`
- `runtime-r3/server/worker.js`
- `test/r3-observer-failure-provenance.test.mjs`
- sanitized Observer failure + finish-reason provenance only.

Accepted validation:
- focused: 46/46 PASS
- full `npm.cmd test`: 546/546 PASS
- changed JS/MJS syntax: PASS
- `git diff --check`: PASS
- Wrangler R3 API dry-run: PASS

Accepted diagnostic disposition:
- `OBSERVER_JSON_INVALID_NOT_REPRODUCED`
- fresh game `7307c77b-f4bd-46df-ac45-4c5cbee190d5` completed three distinct ordinary committed turns with non-empty Observer raw/applied output and no Observer failure.
- Do NOT change `max_tokens`, model, prompt, timeout, retry, parser/normalizer, media/TTS, frontend, DB, or gameplay semantics based on the non-reproduction.

## 1. Deployment exception that must be closed

During the preceding diagnostic, the runner disclosed two unintended deployments before the final correct R3 deployment:

1. Wrong legacy worker deployment:
- `game-proxy-company-v1@991cf884-fb35-4c67-8152-b19e7a155b23`
- config/entrypoint family: `wrangler.api.jsonc` -> `src/api/index.js`
- this is a separate legacy Company worker, not the R3 worker.

2. Wrong entrypoint under R3 name:
- `game-proxy-company-r3@383c1836-7e2a-4290-b165-dfa0879cf591`
- superseded later in the same run.

Final intended R3 deployment:
- `game-proxy-company-r3@2a6419bb-9147-443d-8552-cf2fd309ae2c`
- correct config/entrypoint: `wrangler.r3.api.jsonc` -> `runtime-r3/worker-entry.js`.

Frontend remained:
- `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`.

The R3 source is accepted. This task is operational hygiene only.

## 2. Goal

Prove the current Cloudflare deployment state and remove only the proven accidental legacy-worker deployment if it is still current.

Required outcome:
- `game-proxy-company-r3` remains exactly on the intended R3 artifact `2a6419bb-9147-443d-8552-cf2fd309ae2c` with no redeploy if already correct;
- `game-proxy-company-v1` must not remain on accidental `991cf884-fb35-4c67-8152-b19e7a155b23` if the exact immediately preceding deployment/version can be independently identified and restored safely;
- no guess-based rollback.

## 3. Mandatory read-only preflight

Before any deployment mutation:

1. Verify current `main` is a docs-only descendant of source `71f87b63...` and product source is unchanged.
2. Read Cloudflare version/deployment history for BOTH:
   - `game-proxy-company-v1`
   - `game-proxy-company-r3`
3. Record for each:
   - currently active version/deployment id;
   - immediately preceding deployment/version where available;
   - deployment timestamps/order;
   - script/config identity or metadata sufficient to distinguish legacy `src/api/index.js` from R3 `runtime-r3/worker-entry.js`.
4. For `game-proxy-company-v1`, prove whether `991cf884-fb35-4c67-8152-b19e7a155b23` is still the active deployment.
5. If it is active, prove the exact version immediately before it. Do not infer the preimage from commit history alone.
6. For `game-proxy-company-r3`, prove the active deployment is exactly `2a6419bb-9147-443d-8552-cf2fd309ae2c`.

If Cloudflare history cannot identify the exact legacy preimage, STOP:
`BLOCKED_LEGACY_WORKER_PREIMAGE_UNKNOWN`

If R3 current deployment is not `2a6419bb-9147-443d-8552-cf2fd309ae2c`, STOP:
`BLOCKED_R3_DEPLOYMENT_DRIFT`

Do not repair either blocker by guessing.

## 4. Conditional legacy rollback only

Only if ALL are proven:
- current `game-proxy-company-v1` is accidental version `991cf884-fb35-4c67-8152-b19e7a155b23`;
- an exact immediately preceding deployment/version is identifiable from Cloudflare history;
- that preimage is demonstrably the prior active `game-proxy-company-v1` artifact;

then restore exactly that prior version using the narrowest Cloudflare version/deployment rollback mechanism available.

Requirements:
- rollback/deploy count for `game-proxy-company-v1`: at most 1;
- no source rebuild when exact version rollback is available;
- do not deploy `main` source to reconstruct an assumed legacy artifact;
- after rollback, re-read deployment history/current state and prove active version equals the exact preimage.

If `game-proxy-company-v1` is already no longer on `991cf884...`, perform ZERO mutation and record the current active version plus why no rollback is needed.

## 5. R3 verification

For `game-proxy-company-r3`:
- expected current version is exactly `2a6419bb-9147-443d-8552-cf2fd309ae2c`;
- if exact, deploy count = 0;
- verify health/bare endpoint only if available without gameplay mutation;
- do not redeploy just to refresh timestamps.

Do not touch frontend deployment.

## 6. Hard prohibitions

Do NOT:
- edit product source, tests, content, configs, migrations, or scripts;
- change Observer/Story prompt/model/options/max_tokens/timeouts;
- change normalizer/media/TTS/frontend behavior;
- run gameplay turns, reset/retry/regenerate games, or mutate preserved fixtures;
- write DB state or apply migrations/DDL;
- touch Production;
- create a new branch or CURRENT_TASK path;
- use force deployment, arbitrary version reconstruction, or guessed rollback target;
- start TTS acceptance or holistic V5 inside this task.

This task may perform only the one proven legacy-worker rollback described above.

## 7. Repository validation

Because source is frozen:
- run full `npm.cmd test` and expect 546/546 unless the environment itself prevents it;
- `git diff --check` PASS;
- source diff from accepted `71f87b63...` must remain zero;
- only final `docs/ops/CURRENT_TASK.md` status update may be committed by this task.

## 8. GREEN exit

GREEN disposition:
`WORKER_DEPLOYMENT_HYGIENE_GREEN`

Requires:
- exact current R3 version `2a6419bb-9147-443d-8552-cf2fd309ae2c` verified, zero R3 redeploy;
- legacy worker accidental version not left active:
  - either it was already superseded and no mutation was needed, OR
  - exact previous version was proven and restored once;
- no source/config/frontend/DB/gameplay/Production changes;
- repository source remains frozen;
- preserved fixtures untouched.

If GREEN, stop WAITING_REVIEW. The next operator task should return to source-frozen projection-first TTS end-to-end acceptance. Do not start it yourself.

## 9. Completion report

Post a NEW Issue #68 terminal comment recording:
- start main / final main / final task blob;
- accepted source `71f87b63...`;
- Cloudflare current/history evidence for both worker names;
- accidental legacy version current/not-current determination;
- exact legacy preimage version if identified;
- rollback count and exact rollback target if rollback occurred;
- final active version of both workers;
- R3 deploy count 0 unless task correctly BLOCKED before mutation;
- frontend deploy count 0;
- full test count and diff check;
- source/config/DB/gameplay/Production mutation counts;
- preserved fixtures untouched;
- exact disposition.

Then overwrite this SAME file in place to `Status: WAITING_REVIEW`, push main, post terminal, and stop.

## 10. Terminal evidence (deployment hygiene complete; review required)

Execution identity:
- TASK_ID: `company-r3-worker-deployment-hygiene-rollback-v1`
- CURRENT_TASK blob at lease: `a294a65bdce432fa03837d3a7fef33fac68cb977`
- expected branch: `main`
- start main: `9f6ed8590e47131bed8e64e3774e45a8c59e0c46`
- accepted executable/source: `71f87b63c9405bdc2e41ff272c0448c0b41384b7`
- final main before this control-file update: `9f6ed8590e47131bed8e64e3774e45a8c59e0c46`

Read-only preflight and proof:
- `game-proxy-company-v1` history ended at accidental version `991cf884-fb35-4c67-8152-b19e7a155b23` (version created `2026-08-23T22:03:12.282Z`, deployment `d0ed99f7-799e-4fda-b4d4-aebe02fed91f`, 100%).
- The immediately preceding v1 deployment was version `7ea46aaf-493f-4323-bc1f-f5ab8d47477d` (version created `2026-08-19T05:29:34.673Z`, deployment `3ca187c9-c72b-4e40-9294-d9dfb5878064`, 100%).
- Cloudflare `versions view` proved both v1 versions have the identical script etag `1f665e2b302ffda4a8ae6985a7a06bace14fc1203251966cdf8058e426e8c72e`, handlers, compatibility date, and legacy bindings. The repository `wrangler.api.jsonc` identifies this worker family as `src/api/index.js`; the R3 artifact has a distinct etag and R3 binding set. The preimage was therefore exact and independently ordered, not reconstructed from source.
- `game-proxy-company-r3` history ended at intended version `2a6419bb-9147-443d-8552-cf2fd309ae2c` (version created `2026-08-23T22:05:59.647Z`, deployment `feb075b6-cb37-4d58-a927-bd9248ccf1bb`, 100%), with R3 etag `cb48e4ceb4acb2f80eb3fd4a97f358bae0fd2dcc15379540d136a40d0565e901` and `R3_GAME_ACCESS_SECRET`; no R3 redeploy was performed in this task.

Authorized mutation and final verification:
- exactly one Cloudflare rollback was performed: `game-proxy-company-v1` -> exact version `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
- rollback deployment `63adc570-a107-476e-bb51-d139016eb9b1`, created `2026-08-23T22:22:52.449Z`, is 100% on the proven preimage;
- post-rollback history confirms v1 active version `7ea46aaf...` and R3 active version remains exactly `2a6419bb...`;
- health checks were read-only: R3 `/api/r3/catalogs` = 200 and legacy `/health` = 200;
- R3 deployment count in this task: 0; frontend deployment count: 0; v1 rollback count: 1.

Repository and scope validation:
- full `npm.cmd test`: `546 passed, 0 failed`;
- `git diff --check`: PASS;
- product source diff from accepted `71f87b63c9405bdc2e41ff272c0448c0b41384b7`: zero; only this existing control file is being updated;
- no source/config/test/content/frontend/DB/gameplay/provider/model/prompt/token/timeout/Production changes; no migration or DB write;
- preserved fixtures were not read or mutated in this task; no gameplay turn, reset, retry, or regeneration was run.
- terminal disposition: `WORKER_DEPLOYMENT_HYGIENE_GREEN`.
- final task blob SHA: record after this in-place update and push.

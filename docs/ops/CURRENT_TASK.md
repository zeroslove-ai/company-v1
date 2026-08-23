# Company — CURRENT TASK

Status: READY
Task ID: company-r3-story-canonical-player-identity-main-landing-v1
Mode: ACCEPT GREEN IDENTITY SOURCE -> LAND EXACT SOURCE ON MAIN -> PROVE SOURCE EQUIVALENCE -> NO REDEPLOY/REPLAY
Updated: 2026-08-24 03:26 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387708812`
Operator review: Issue #68 comment `5387727514`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Why this task exists

`company-r3-story-canonical-player-identity-v1` is functionally GREEN, but its accepted product source was committed on a temporary source branch rather than on main.

Accepted identity source:
- source commit `8199c8b7b4b86ac936b9785b19f2340a40336ef1`
- source branch `company-r3-story-canonical-player-identity-v1`
- Draft PR #101
- parent/common base `32abd45802e53d5f6ea567b854f54f9997e2b205`

Current main before this registration:
- `8d9eee6c920278e7762af2bdc1fced07cf58fd82`
- this is the docs-only WAITING_REVIEW child of the same registration/base lineage.

The branches therefore diverge only because:
- source side contains the accepted product/test commit;
- main side contains the terminal `docs/ops/CURRENT_TASK.md` handoff commit.

Independent compare from current main to accepted source shows exactly these intended product/test files on the source side:
- `runtime-r3/domain/memory.js`
- `runtime-r3/server/provider.js`
- `test/r3-player-identity-contract.test.mjs`

No other product file belongs to this landing.

## 1. Accepted GREEN evidence — freeze

Do not re-design the identity correction.

Accepted implementation behavior:
- every Story turn receives canonical player name, department label, and formal position/rank label;
- exact identity labels are hard Story facts;
- Story may not normalize/downgrade/upgrade/invent business-card, badge, introduction, signature, formal title, department, or rank identity;
- no DB/profile writer, Observer, frontend, CSA, media, provider/model/config, retry/regeneration, second LLM, or post-hoc output-rewrite path was added.

Accepted validation:
- focused identity/opening/turn checks: 44 PASS;
- full `npm.cmd test`: 536/536 PASS;
- changed JS/MJS syntax: PASS;
- `git diff --check`: PASS.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `53a91cb4-9317-4198-8d7c-52a9e8e34571`, deployed from accepted source `8199c8b...`;
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`, unchanged.

Accepted live identity fixtures — READ ONLY:
- executive `a78b91bd-4216-4e31-91ab-fd2705f0a99c`: `서윤호 / 신사업TF / 임원`, Opening + 6 ordinary turns including refresh/history, no alternate rank;
- junior `6b8ba038-50f0-408b-8210-20fed28bd0bc`: `홍길동 / 브랜드전략팀 / 인턴`, Opening + 3 ordinary turns, no executive identity leak.

Other preserved games — READ ONLY:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`;
- holistic V1 failure `f84aa0f0-6658-41a2-8fed-c307d4d2e219`;
- CSA repair fixture `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`;
- holistic V2 identity failure `4b050667-cca3-43a0-b483-d16c86a2873e`.

Do not open/reset/revise/retry/mutate any preserved or accepted fixture in this landing task.

## 2. Landing method — exact source only

This is a repository-lineage correction, not a source-development task.

On `main` only:
1. fetch remote state and verify current main is the registration/task lineage expected by this CURRENT_TASK;
2. verify `8199c8b7b4b86ac936b9785b19f2340a40336ef1` is GitHub-resolvable and its parent is the expected pre-task registration base;
3. verify its changed paths are exactly the three accepted identity source/test files listed above;
4. land that exact commit onto current main using a normal clean cherry-pick (or an equivalent Git operation that preserves the exact file contents and commit patch semantics);
5. do not manually retype/reimplement the patch;
6. do not merge any unrelated PR/branch or include any unrelated source change.

Expected landing shape:
- one product/test landing commit on top of the current docs/task lineage;
- exact source-file content equivalent to `8199c8b...` for all three accepted files.

If cherry-pick conflicts in any product/test file, STOP `BLOCKED_LANDING_CONFLICT` before resolving by hand. Report the exact conflict and do not synthesize a new implementation.

`docs/ops/CURRENT_TASK.md` may differ from the source branch because main owns the current operator task. That docs difference is expected and must not be used as a reason to reimplement source.

## 3. Mandatory equivalence proof

After landing, prove all of the following:
- `git diff 8199c8b7b4b86ac936b9785b19f2340a40336ef1 -- runtime-r3/domain/memory.js runtime-r3/server/provider.js test/r3-player-identity-contract.test.mjs` is empty;
- the three corresponding file blobs/content are byte-equivalent to the accepted source;
- comparing accepted source to landed main shows no product/runtime/frontend/content/config/migration differences other than expected docs/task lineage;
- no second identity implementation or cleanup was added.

If any of those three files differ semantically or byte-wise from accepted source, STOP `FAILED_SOURCE_EQUIVALENCE`; do not patch around it in this task.

## 4. Validation after landing

Run only deterministic repository validation needed to prove the landing did not alter the accepted patch:
- focused identity contract/opening/provider tests;
- full `npm.cmd test`;
- `node --check` for changed JS/MJS files;
- `git diff --check`.

Expected counts may remain 536 full tests; do not fail solely because total count changes if every test is accounted for, but investigate any unexpected suite drift before proceeding.

No product source edits are authorized to make a test pass. If the exact accepted source fails now, STOP and report the first deterministic mismatch.

## 5. Deployment / live behavior

Expected deployment count: ZERO.

The currently accepted TEST API `53a91cb4-9317-4198-8d7c-52a9e8e34571` was already deployed from exact source `8199c8b...` and passed executive/junior live acceptance.

Therefore:
- verify the TEST API version is still exactly `53a91cb4-9317-4198-8d7c-52a9e8e34571`;
- verify frontend remains exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
- if source-equivalence is proven, DO NOT redeploy API merely because main now has a different cherry-pick commit SHA;
- DO NOT repeat executive/junior live acceptance;
- DO NOT create a fresh gameplay fixture in this landing task.

If deployed versions have independently drifted, STOP `BLOCKED_DEPLOYMENT_DRIFT` and report; do not silently redeploy under this task.

## 6. PR #101 cleanup boundary

Draft PR #101 is source evidence, not a second landing authority.

After main landing and equivalence are proven:
- do not merge PR #101 into main a second time;
- it may be closed as superseded/landed-by-exact-cherry-pick if the available tooling permits a truthful note;
- do not force-push or rewrite its source branch;
- failure to close the stale Draft PR is not a product failure and must not block the landing acceptance.

## 7. Forbidden operations

Do not:
- create any new branch, worktree, CURRENT_TASK path, recovery branch, or replacement PR;
- modify the identity implementation beyond exact landing;
- touch `runtime-r3/**` except through the exact accepted cherry-pick;
- touch frontend/content/provider-model/config/secrets;
- change DB/schema/RPC/migration/RLS/grants;
- deploy Production;
- redeploy TEST when source-equivalence proves the existing Worker is already exact;
- run new gameplay/retry/regeneration/reset;
- mutate preserved fixtures.

## 8. GREEN definition

GREEN only if:
- exact accepted identity source `8199c8b...` is landed on `main`;
- the three accepted files are byte-equivalent to the source commit;
- no unrelated product/source file is changed;
- focused/full/syntax/diff checks pass;
- TEST API remains `53a91cb4-9317-4198-8d7c-52a9e8e34571` and frontend remains `71416b75-9cca-45ee-9b32-7cf209f16395`;
- deployment count remains zero;
- gameplay write/reset/retry count remains zero;
- repository main and deployed product source are now source-equivalent.

Do not claim owner-ready. If GREEN, stop at WAITING_REVIEW. The next operator task will restart holistic owner-style acceptance from entirely NEW clean campaigns on the now-aligned main lineage.

## 9. Terminal protocol

At completion report:
- starting main SHA;
- accepted source SHA `8199c8b...`;
- landing commit SHA and final main SHA;
- exact changed paths in landing;
- source-equivalence proof result;
- focused/full/syntax/diff results;
- TEST API/frontend versions and deployment count;
- gameplay/reset/retry count = 0;
- PR #101 state if touched;
- exact disposition: `MAIN_SOURCE_LANDING_GREEN`, `BLOCKED_LANDING_CONFLICT`, `FAILED_SOURCE_EQUIVALENCE`, or `BLOCKED_DEPLOYMENT_DRIFT`.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, post the terminal report to Issue #68, and stop.

Do not create/start the holistic task yourself.
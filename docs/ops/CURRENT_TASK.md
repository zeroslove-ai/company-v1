# Company — CURRENT TASK

Status: READY
Task ID: company-r3-same-game-reset-deployed-integration-v1
Mode: TRACE DEPLOYED SAME-GAME RESET BOUNDARY -> MINIMAL FIX -> DEPLOY AFFECTED TEST ARTIFACTS -> BARE-PUBLIC RESET ACCEPTANCE
Updated: 2026-08-23 22:46 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5386310717`
Operator review: Issue #68 comment `5386362005`
Priority override: Issue #68 comment `5386179970`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve

Accepted executable/source after the CSA draft cut:
- `fad4d7f5cd637cf77b9613335eeaef2302c03853`

Current main before this registration:
- `5577cb98761102881a4727c0c3dc0e18f7610e16`
- this is the accepted source plus the docs-only WAITING_REVIEW record.

Current TEST artifacts from the reviewed terminal:
- API `game-proxy-company-r3` version `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff`
- Frontend `gamebuilder-company-r3` version `74f14b2c-fcb0-47ce-b14d-ecb90ece7ff1`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze unless direct contradictory evidence appears:
- first-day/first-arrival Opening and selected department/rank preservation;
- exact player agency/navigation;
- committed player-inner-thought and character-specific first-person Mind Monitor;
- Story-owned four-choice projection including previously accepted terminal formatting variants;
- chronological CSA APPLY/CHANGE/REMOVE, one operation = one normal Story turn;
- high-parity five-tab CSA draft UI and one-pending-operation chronology;
- ordinary post-CSA turns contain no stale `csa_operation`;
- refresh/re-entry and mobile behavior already accepted outside reset.

CSA dirty-close native-confirm live automation remains an acceptance-harness limitation, not a reason to reopen CSA in this task.

Do not change image/TTS, timeline/history presentation, provider/model/config, CSA semantics, choice semantics, or unrelated narrative behavior.

## 1. Decisive deployed reset defect

Historical owner-readiness evidence game, READ-ONLY ONLY:
- `51efe18b-1bc3-435f-a178-bb2d8ee223e4`

Observed once after 10 ordinary committed turns:
- visible `초기화` control and confirmation were used;
- original tab became unresponsive during reset processing;
- same-game re-entry/read-only checks at approximately 5s and 18s still showed Turn 10, old Opening and old chronology;
- no canonical fresh Opening/Turn0 appeared.

Known static path:
`frontend resetGame() -> POST /api/r3/games/:game_id/reset -> resetResponse() -> store.resetGame() -> company_r3_reset_game RPC -> existing Opening stream`

Existing local reset contract tests pass.
Historical migration `20260823000100_company_r3_same_game_reset` was previously applied to TEST.

Therefore:
- do NOT redesign reset from scratch;
- do NOT add a second reset endpoint/path;
- do NOT mutate the historical evidence game;
- locate the first deployed integration boundary that diverges from the local contract and repair only that boundary.

## 2. Mandatory pre-edit deployed-boundary trace

Before changing source, inspect current main and current deployed TEST behavior and classify the first failure boundary.

Use fresh disposable TEST games for any mutation. Historical/preserved games are read-only.

Trace, with evidence, in this order:
A. visible reset control/confirmation and frontend `resetGame()` dispatch;
B. network `POST /api/r3/games/:id/reset` request, status, response/SSE lifecycle;
C. Worker route `resetResponse()` invocation and error handling;
D. store `resetGame()` call and exact RPC invocation;
E. TEST `company_r3_reset_game` function existence/signature/grants and durable post-RPC state;
F. existing Opening generation/stream kickoff after reset;
G. Opening terminal/commit/context readback;
H. frontend reconciliation/render/busy-state release after reset.

Before network mutation, inspect read-only:
- source route/store/frontend reset implementations;
- migration `20260823000100_company_r3_same_game_reset`;
- TEST migration/function presence and deployed API version/source lineage where available.

Do not infer the root from the old symptom alone.

On one fresh disposable game, establish a small but real pre-reset chronology, then use the visible reset exactly once. Capture enough evidence to identify the first divergent layer. Do not retry-until-pass.

If the first fresh reproduction unexpectedly passes end-to-end, do not invent a fix. Repeat only the post-reset readback/refresh/next-turn acceptance described below and report whether the prior defect was deployment drift/intermittent; source changes require a deterministic defect.

## 3. Canonical reset product contract

Preserve the existing intended same-game reset semantics. Do not invent new profile/setup semantics.

Owner-visible contract:
- same game ID remains in use;
- reset clears prior gameplay chronology/state according to the existing reset contract;
- user returns directly to a fresh canonical Opening/Turn0, not to the stale old turn and not to a permanently busy screen;
- existing player setup/profile needed by the Opening remains consistent with the current reset contract;
- old turns/actions/jobs/history/context cannot leak into the new run;
- active CSA from the old run is cleared if the canonical reset contract already specifies that;
- fresh Opening has the normal first-arrival product framing, player thought/MM and four usable choices;
- after reset, the next ordinary choice/free input commits exactly one new Turn1.

Do not reset or mutate preserved owner/manual fixtures.

## 4. Correction rules

After the first failure boundary is proven, make the smallest fix at that boundary.

Allowed only when evidence requires it:
- frontend reset lifecycle/reconciliation/busy-state fix;
- existing R3 reset route/response fix;
- existing store/RPC call plumbing fix;
- exact TEST deployment correction;
- if and only if the deployed RPC itself is proven defective and cannot be corrected at a non-DB layer, one forward-only additive migration may replace/fix the function definition.

DB rule:
- never edit or reapply the historical applied migration;
- no schema redesign, new reset namespace or parallel writer;
- any additive migration must be justified by exact deployed function evidence and must preserve the existing reset contract.

Forbidden:
- second reset endpoint or fallback reset path;
- client-side fake reset that only clears UI;
- direct table writes from frontend/API as a workaround;
- provider retry/regeneration loop;
- provider/model/temperature/token/timeout change;
- Story/Observer semantic changes;
- CSA redesign;
- Production deployment;
- owner/preserved-game mutation.

Reset failure must surface a bounded error and release permanent busy state; do not leave the UI blocked indefinitely.

## 5. Deterministic regressions

Add/maintain focused tests for the proven boundary. At minimum preserve/prove:
1. visible reset handler makes exactly one request after confirmation;
2. duplicate reset dispatch is fenced while busy;
3. reset route invokes only the canonical `store.resetGame()` path;
4. store invokes the intended `company_r3_reset_game` RPC contract exactly once;
5. successful reset cannot return stale pre-reset committed context;
6. existing Opening pipeline is used after reset, not a fallback writer;
7. reset completion releases frontend busy state and renders new Turn0;
8. reset failure releases busy state and exposes an actionable error without pretending success;
9. old choices/history/current turn/CSA projection cannot remain authoritative after successful reset;
10. refresh/re-entry after reset reconstructs the new Turn0 from server state;
11. next post-reset player action is a clean ordinary Turn1 with exact literal and no stale `csa_operation`;
12. already-GREEN agency/navigation/choice-tail/CSA/draft contracts remain green.

Run:
- focused R3 reset/store/API/frontend tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

## 6. TEST deployment

Deploy only artifacts actually changed by the proven fix.

- If frontend changed, deploy exact source to `gamebuilder-company-r3` TEST.
- If API/runtime/store changed, deploy exact source to `game-proxy-company-r3` TEST.
- If a justified forward-only migration is required, apply only that new migration to TEST and verify its exact function signature/grants/result.
- preserve bindings/secrets exactly; do not print/rotate/recreate them.
- no Production.

Record exact source SHA, affected Worker version(s), and migration status if any.

## 7. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, storage preseed, or direct-API gameplay substitute for the visible acceptance.
Fresh disposable TEST games only.

### Gate A — same-game reset closure

Create a fresh game through visible Setup -> Opening.
Build at least 3 committed ordinary turns. Include enough state that stale chronology would be obvious; if convenient and stable, activate one CSA rule through the visible app before reset so reset clearing of active CSA is also observable.

Record immediately before reset:
- same game ID;
- current turn;
- visible latest Story/choices;
- server readback of committed chronology/state needed to distinguish old/new run.

Then use visible `초기화` and confirmation exactly once.

Require:
- exactly one reset request;
- no permanent hang/unresponsive tab;
- canonical reset/Opening stream reaches terminal normally;
- same game ID now presents fresh Turn0 Opening;
- old chronology is absent from current server context/history/readback according to reset contract;
- no stale active CSA/state from the old run where reset contract says it clears;
- fresh Opening has four usable choices, natural player inner thought and Mind Monitor;
- no stale old choice/action/story remains as current UI;
- no console/page/network blocker.

If it fails, STOP. Do not retry. Report exact first failing boundary A-H plus request/response/SSE and independent readback.

### Gate B — refresh/re-entry

On the successfully reset same game:
- refresh/re-enter the bare public URL;
- require the same new Turn0 Opening/current context, not the old run;
- verify history/current state does not resurrect stale chronology.

### Gate C — first post-reset turn

From that reset Turn0:
- click one visible choice OR submit one clear Korean free input;
- require exactly one normal `/turn` request/SSE/commit;
- exact player literal remains Story center;
- committed turn becomes Turn1;
- no stale `csa_operation`, reset flag or old-run action identity leaks into payload/context.

### Gate D — mobile spot-check

At approximately 390x844 on a fresh disposable game or the same accepted fixture before any further mutation:
- reset control remains reachable;
- confirmation/reset progress does not create a blocking overlay residue;
- after successful reset, Turn0 choices/direct input remain reachable.

Do not repeat destructive reset merely for mobile if desktop already proved the same endpoint and a non-destructive mobile reachability check is sufficient.

## 8. GREEN criteria

GREEN only if:
- first deployed failure boundary is evidenced;
- fix is minimal and does not create a parallel reset authority;
- visible same-game reset returns to canonical fresh Opening/Turn0;
- independent readback and refresh agree with that new run;
- old chronology does not reappear;
- first post-reset Turn1 commits normally;
- busy/error lifecycle is safe;
- focused/full tests pass;
- exact affected TEST artifact(s) are deployed and verified;
- no Production/preserved-game/forbidden work occurred.

Do NOT claim owner-ready after this task.

## 9. After this cut

Only after reset is GREEN, remaining owner-remediation order resumes:
1. approved-media image projection + character-aware server TTS;
2. timeline/current-scene presentation residue;
3. return to the deferred CSA dirty-close live-confirm limitation if still materially relevant;
4. final holistic owner-style long-play acceptance.

## 10. Terminal report

Post one terminal report to Issue #68 with:
- status `WAITING_REVIEW`, `FAILED`, or `BLOCKED`;
- source/final main SHA and CURRENT_TASK blob;
- exact first failure boundary A-H;
- changed files and why;
- test results;
- TEST deployment versions/migration status;
- fresh disposable fixture IDs;
- before-reset vs after-reset server/readback facts;
- visible reset request/SSE/result;
- refresh/re-entry and post-reset Turn1 result;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not generate the next task.
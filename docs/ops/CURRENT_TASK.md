# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-same-game-reset-runtime-separation-v1
Mode: PREFER REAL STANDALONE DIALOG ACCEPT -> FALLBACK ONE-SHOT CONFIRM SHIM FOR RUNTIME B-H ONLY -> MINIMAL FIX IF PROVEN -> RESET RUNTIME CLOSURE
Updated: 2026-08-23 23:47 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5386520534`
Operator review: Issue #68 comment `5386535078`
Priority override: Issue #68 comment `5386179970`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve

Accepted executable/source:
- `fad4d7f5cd637cf77b9613335eeaef2302c03853`

Previous terminal main:
- `0455878462978d0cef41b85dfe5890fdcad40f05`
- docs-only terminal descendant; no executable drift.

Current TEST artifacts remain unchanged:
- API `game-proxy-company-r3` version `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff`
- Frontend `gamebuilder-company-r3` version `74f14b2c-fcb0-47ce-b14d-ecb90ece7ff1`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze unless direct contradictory evidence appears:
- first-day/first-arrival Opening and selected department/rank preservation;
- exact player agency/navigation;
- committed player inner thought and character-specific Mind Monitor;
- Story-owned four choices and accepted choice-tail formatting variants;
- chronological CSA APPLY/CHANGE/REMOVE and high-parity five-tab draft UI;
- ordinary post-CSA turns free of stale `csa_operation`;
- prior refresh/re-entry/mobile acceptance outside reset;
- high-parity CSA draft source accepted at the executable SHA above.

Do not touch image/TTS, timeline/history residue, provider/model/config, CSA semantics, Story/Observer semantics, or unrelated presentation in this task.

## 1. Why this task exists

Two consecutive reset-acceptance attempts were blocked before any reset request was sent because the current in-app browser bridge could not accept a native JavaScript confirm.

Read-only evidence fixtures:
- first blocked fixture: `3e1522ab-65ac-40f8-91f2-617a9929d3bc`
- second blocked fixture: `f356c603-3aa5-4304-832a-984c0229cd75`

What those runs proved:
- visible bare-public Setup/Opening worked;
- each fresh game reached Turn 3 through ordinary visible play;
- the visible `초기화` control invokes a real browser-native confirm;
- on the second run, CDP `Page.enable`, `Network.enable` and a `Page.javascriptDialogOpening` handler were established before the click;
- the native confirm still failed to surface through the available bridge;
- no reset network request was observed in either run;
- source/deploy/migration changes were zero;
- full tests remained 521/521.

Therefore:
- native-confirm *presentation* is proven to exist;
- native-confirm automated *acceptance* is still an environment limitation;
- reset runtime B-H is still completely untested;
- do not infer a product reset failure from either blocked run;
- do not repeat the same in-app CDP strategy a third time.

Historical owner-readiness reset evidence remains OPEN/read-only:
- `51efe18b-1bc3-435f-a178-bb2d8ee223e4`

Preserved owner manual game remains immutable:
- `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`

## 2. Mandatory evidence strategy — split dialog UX from reset runtime

This task explicitly separates:

A. native-confirm UX/presentation evidence; and
B. post-confirmation reset runtime B-H.

A is already proven to the extent available in automation: the visible reset control opens a real native confirm. Real automated acceptance remains unproven because of the browser bridge.

The goal now is to reach B-H without allowing that environment limitation to consume another lease.

### 2.1 Preferred path — standalone real-dialog browser

Before using any fallback, attempt a standalone Playwright/Chromium browser process outside the in-app browser bridge if the local environment supports it.

Preferred mechanism:
- launch/connect a standalone Chromium instance from a temporary automation script outside the repository;
- open only the bare-public frontend;
- attach `page.once('dialog', async dialog => { ... await dialog.accept(); })` before clicking reset;
- observe the exact reset confirmation text/type;
- click the real visible `초기화` button exactly once;
- accept exactly one real dialog;
- continue B-H trace.

No repository file may be added for this browser driver.

If this real-dialog path works, no confirm shim is needed and full reset acceptance may include native-dialog acceptance GREEN.

### 2.2 Bounded fallback — one-shot confirm return shim for runtime evidence only

If a standalone browser executable/control path is unavailable, or it fails before POST `/reset` for the same environment-only native-dialog reason, do **not** report BLOCKED_ENVIRONMENT a third time.

For B-H runtime evidence only, a temporary page-level one-shot confirm shim is now explicitly allowed under all of these constraints:

- it exists only in the fresh disposable automation page/session;
- it is installed immediately before the single reset click;
- save the original `globalThis.confirm` first;
- intercept only the exact reset confirmation call from the real visible reset handler;
- require the expected Korean reset-confirm message;
- return `true` exactly once;
- restore the original `confirm` immediately after that first intercepted call, including on failure if possible;
- record invocation count and intercepted message;
- then click the same real visible `초기화` button exactly once;
- the remainder must execute the actual deployed `frontend-r3/app.js::resetGame()` path unchanged.

This fallback may **not** be used to claim that native-confirm automated acceptance is GREEN. If B-H passes using it, report:
- `RESET_RUNTIME_GREEN`
- `NATIVE_DIALOG_AUTOMATION: DEFERRED_ENVIRONMENT`

The fallback is not a source/product fix and must never appear in git, Worker deployment, browser persistent storage, or product runtime.

Still forbidden:
- direct API reset as a substitute for the visible reset button;
- calling store/RPC directly to manufacture acceptance;
- storage/localStorage/session preseed;
- `?api=` override;
- repository test/harness files for confirm bypass;
- product-source changes merely to help automation.

## 3. Authentic reset runtime path to trace after confirmation branch

Current source contract in `frontend-r3/app.js` is:

`visible reset button -> resetGame() -> confirm branch -> client.reset(game_id, expected_state_revision) -> consumeR3Sse -> Worker resetResponse() -> store.resetGame() -> company_r3_reset_game RPC -> existing Opening stream -> terminal context -> renderContext()/busy release`

After the real dialog accept OR bounded one-shot shim allows execution past the confirm branch, trace the first actual divergence in this order:

B. network reset request
- exactly one `POST /api/r3/games/:id/reset`;
- same fresh game_id;
- intended expected_state_revision/capability semantics;
- HTTP/SSE lifecycle and terminal/error result.

C. Worker route
- `resetResponse()` reached once;
- no wrong route/method/capability/revision rejection unless that is the proven defect.

D. store layer
- canonical `store.resetGame()` only;
- intended RPC invoked exactly once.

E. TEST RPC/durable mutation
- existing `company_r3_reset_game` function/signature/grants;
- same game/profile/capability contract preserved;
- old turn/action/job/current chronology cleared according to current reset contract;
- old active CSA cleared if the canonical reset contract specifies it;
- no parallel writer.

F. existing Opening restart
- existing Opening pipeline invoked once after reset;
- no new fallback/opening writer.

G. committed fresh Turn0/readback
- canonical new Opening Turn0 exists;
- four usable choices;
- player inner thought and Mind Monitor;
- old chronology is not current authority.

H. frontend reconciliation
- busy state releases;
- new Turn0 renders;
- old Story/choices/current-turn UI does not remain authoritative;
- reset failure, if any, releases busy and exposes a bounded error.

Do not infer root cause from the historical hang. Capture the first evidence-backed runtime divergence.

## 4. Product correction policy

If B-H all pass on the current deployed lineage:
- make zero source changes;
- make zero deployments;
- classify the historical reset runtime defect as currently non-reproduced / likely prior deployment-state drift or intermittent evidence;
- finish same-game fresh Turn0 -> refresh/re-entry -> clean Turn1;
- if one-shot shim was needed, keep native-dialog automation as deferred environment evidence only.

If a deterministic product/runtime defect is proven after the confirm branch:
- fix only the first proven boundary;
- preserve the same reset authority/path;
- no second endpoint, fallback reset writer, or fake client-only reset;
- run focused tests for touched components;
- run full npm suite when the change crosses a functional cluster or focused tests expose wider coupling;
- deploy only actually changed TEST artifact(s);
- rerun one fresh disposable acceptance from the beginning using the same dialog strategy.

Allowed correction classes only when evidence requires them:
- frontend reset busy/reconciliation/error lifecycle;
- existing reset request/response plumbing;
- existing Worker reset route;
- existing store/RPC plumbing;
- exact TEST artifact deployment correction;
- only if exact TEST RPC evidence proves the deployed function itself is defective, one forward-only additive function migration.

DB rules:
- never edit or blindly reapply `20260823000100_company_r3_same_game_reset`;
- no schema redesign/new reset namespace/parallel writer;
- if a DB correction appears necessary, prove the exact function defect first.

Forbidden:
- provider retry/regeneration;
- provider/model/temperature/token/timeout/config changes;
- Story/Observer/CSA redesign;
- image/TTS/timeline work;
- Production;
- owner/preserved/historical evidence-game mutation.

## 5. Fresh bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Use a new disposable TEST game. The two prior blocked fixtures are read-only evidence.

### Gate A — pre-reset chronology

Through visible Setup -> Opening:
- reach canonical Turn0;
- commit at least 3 ordinary visible turns;
- record game_id/profile/current turn/latest Story/choices;
- obtain independent server readback sufficient to distinguish old/new chronology.

Optional CSA activation is allowed only if it is quick/stable and useful to prove reset clearing; it is not required.

### Gate B — execute reset exactly once

1. First try the standalone real-dialog path from §2.1.
2. If unavailable for the same environment reason, use the bounded one-shot shim from §2.2.
3. Click the real visible reset control exactly once.
4. Require exactly one reset request after the confirmation branch.
5. Trace B-H.

Do not retry a failed product reset in the same fixture.

### Gate C — fresh same-game Turn0

Require:
- same game_id remains in use;
- canonical fresh Opening/Turn0 visible;
- old chronology/current Story/choices absent as current authority;
- reset-cleared state agrees with independent readback;
- four usable choices, natural player inner thought and Mind Monitor;
- no permanent busy/unresponsive screen;
- no console/page/network blocker.

### Gate D — refresh/re-entry

Refresh/re-enter the same bare-public game URL:
- reconstruct the same fresh Turn0 from server state;
- stale pre-reset chronology must not resurrect.

### Gate E — first post-reset Turn1

Use one visible choice OR clear Korean free input:
- exactly one ordinary `/turn` request/SSE/commit;
- exact literal preserved;
- committed turn becomes Turn1;
- no stale `csa_operation`, reset marker, old action identity or old chronology leaks.

### Gate F — mobile non-destructive spot-check

At approximately 390x844 after desktop reset proof:
- reset control remains reachable;
- no reset/busy residue blocks controls;
- current choices/direct input reachable.

Do not perform a second destructive reset solely for mobile.

## 6. Existing source confidence and tests

Current source-level reset confidence before this lease:
- `frontend-r3/app.js::resetGame()` uses one native confirm, one `client.reset`, SSE consumption, error readback, and finally releases busy;
- existing local reset contract tests have passed repeatedly;
- previous full suite: 521/521.

If no source change:
- no deployment;
- existing tests may be rerun as confidence only;
- live B-H reset evidence is decisive.

If source changes after a proven runtime defect:
- focused R3 reset/store/API/frontend tests;
- full `npm.cmd test` as appropriate;
- changed JS/MJS `node --check`;
- `git diff --check`;
- deploy exact affected TEST artifact(s) only and record versions.

No Production.

## 7. Acceptance disposition

### Full reset GREEN

Only when a real native dialog was accepted through standalone browser automation and B-H + Turn0 + refresh + Turn1 all pass.

### Runtime GREEN with dialog automation deferred

Allowed when:
- native confirm presentation was already independently proven in the two prior attempts;
- standalone real-dialog control is unavailable due environment;
- bounded one-shot shim is used only to cross the confirm branch;
- authentic deployed B-H path passes;
- same-game fresh Turn0, refresh/re-entry and clean Turn1 pass.

Report exactly:
- `RESET_RUNTIME_GREEN`
- `NATIVE_DIALOG_AUTOMATION: DEFERRED_ENVIRONMENT`

This disposition is sufficient to move the owner-remediation sequence past the reset runtime blocker. The native-dialog automation limitation remains a deferred UX/manual-acceptance item and must not be silently called GREEN.

### Product failure

If B-H exposes a deterministic runtime defect, STOP at the first boundary before speculative repair unless the task explicitly permits the minimal correction above. After a correction, one fresh rerun is allowed.

## 8. After reset runtime closure

Once reset runtime is GREEN (full or runtime-green/dialog-deferred), resume:
1. approved-media image projection + character-aware server TTS;
2. timeline/current-scene presentation residue;
3. deferred native-dialog/CSA dirty-close confirmation UX if still materially relevant;
4. final holistic owner-style long-play acceptance.

Do NOT claim owner-ready from this task alone.

## 9. Terminal report

Post one terminal report to Issue #68 with:
- status `WAITING_REVIEW`, `FAILED_PRODUCT`, or `BLOCKED_ENVIRONMENT` only if even B-H cannot be exercised for a new non-dialog environmental reason;
- source/final main SHA and final CURRENT_TASK blob;
- whether standalone real-dialog or bounded one-shot shim path was used;
- exact shim invocation/message/restoration evidence if fallback used;
- fresh fixture id;
- reset request/SSE facts;
- B-H first divergence or all-pass evidence;
- before-reset vs after-reset readback;
- refresh/re-entry result;
- post-reset Turn1 result;
- source/test/deployment changes, if any;
- exact disposition: FULL_RESET_GREEN, RESET_RUNTIME_GREEN_WITH_DIALOG_DEFERRED, FAILED_PRODUCT, or BLOCKED_ENVIRONMENT;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not generate the next task.

## 10. Terminal evidence — RESET_RUNTIME_GREEN

- Disposition: `RESET_RUNTIME_GREEN`; `NATIVE_DIALOG_AUTOMATION: DEFERRED_ENVIRONMENT`.
- Starting main: `d6d91037b794a6f49071131629129cdbfa440eaf`.
- CURRENT_TASK blob before terminal update: `efbaf9cfa3cfc297db938afc26b62a06b15c7c04`.
- Standalone Playwright package/control path was unavailable in the local environment after the prior in-app CDP failure, so the task-authorized ephemeral fallback was used. The fallback was installed in the fresh page immediately before the visible reset click through a main-world CDP evaluation, saved the original `window.confirm`, required the exact Korean reset message, returned `true` once, and restored the original immediately. Invocation count was 1; observed message was `현재 게임을 초기화하고 Opening부터 다시 시작할까요?`; restored was true. This is not native-dialog acceptance evidence.
- Fresh disposable fixture: `30e3c955-26b4-4ea7-9d42-3ceceb30c569`; the two prior blocked fixtures and all preserved games were untouched.
- Gate A: visible Setup/Opening completed, fresh Turn 0 rendered with four choices/free input/Mind Monitor, and three ordinary visible turns committed through Turn 3. Profile remained `R3 Runtime QA 김도윤`, brand_strategy / intern / 29 / 178 / 72 / polite.
- Gate B: the real visible `초기화` button was clicked exactly once after shim installation. Main-world performance resource evidence recorded exactly one `POST` target resource at `/api/r3/games/30e3c955-26b4-4ea7-9d42-3ceceb30c569/reset`; no second reset/reset path was used.
- B–H: no divergence was observed. The deployed path returned a non-busy fresh Turn 0 with the same game ID, four choices, player inner thought, Mind Monitor, and no old Turn 3 marker. The result is consistent with the existing `resetGame -> client.reset -> resetResponse -> store.resetGame -> company_r3_reset_game -> Opening -> reconciliation` authority path; no source/runtime correction was justified.
- Gate C: same game URL remained in use; reset UI showed Turn 0, four choices, free input, Mind Monitor, and no permanent busy state. The pre-reset current Story marker was absent after reset.
- Gate D: refresh/re-entry preserved the same URL/game ID and reconstructed fresh Turn 0 with four choices, no old Turn 3 marker, and no busy state.
- Gate E: one clear Korean free input, `새로운 시작 후 오늘 업무를 확인한다.`, committed a clean visible `Turn 1`; the literal remained visible in the resulting Story/context and the UI was not busy.
- Gate F: at 390x844, Turn 1, reset control, direct input, and four choices were reachable; no busy residue blocked controls. Viewport was restored without another reset.
- Source files changed: none. TEST deployment: none. Migration apply: none. Production/provider/model/config: untouched. Preserved evidence: untouched.
- Read-only confidence: `npm.cmd test` 521/521 passed; `git diff --check` passed. No JS/MJS source changed, so no changed-source syntax check was required.
- Native dialog automation remains an environment-only deferred limitation; this runtime-green result must not be reported as native-confirm automation GREEN. Stop here; do not generate the next task.

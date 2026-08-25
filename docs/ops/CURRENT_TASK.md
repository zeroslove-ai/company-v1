# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-csa-conflict-copy-core-p1-continuation-v1
Mode: TARGETED P1 CONTINUATION — STRUCTURED CSA CONFLICT ERROR ENVELOPE / PLAYER-FACING COPY / DEFERRED CORE ACCEPTANCE
Updated: 2026-08-25 09:02 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `362c3762f183c03fb832c1502951749ed48c40cf`
Previous task: `company-r3-cross-boundary-core-p1-correction-v1`
Previous terminal: Issue #68 `5402820678`
Operator + whole-canon review: Issue #68 `5402873107`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Accepted partial implementation SHA: `02f87e8c2ffe728f1eb2602344b202acc88fc839`
Accepted TEST API from previous terminal: `game-proxy-company-r3` / `cda59b9b-68da-4e84-ac7f-7aca7c1b946b`
Accepted TEST frontend from previous terminal: `gamebuilder-company-r3` / `be422eae-d701-4068-bcda-53d2856d0df7`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`CSA_CONFLICT_COPY_CORE_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_CONFLICT_COPY_CORE_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, branch, ops branch, implementation branch, or PR.
- Mandatory read order before any edit:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
  5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
  7. previous terminal `5402820678`
  8. operator/whole-canon review `5402873107`
  9. this task
- Preserve A′/R3: server-owned turn kernel + one Story + one post-Story observer + atomic Commit + optional sidecars.
- Preserve the accepted implementation at `02f87e8...`; do not redesign or reopen already-passed NAV/S7/S1 semantics without new evidence.
- No product-law change is authorized or needed. Current canon/contracts already define the expected conflict behavior.

### Preserved evidence — READ ONLY

Never reset/retry/mutate:
- `4261b592-e6b9-44cb-a5a7-05057a22ee83` — previous core-P1 fresh browser campaign and W3↔M1 UI-copy blocker.
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `b91607f4-6945-44eb-87a3-6f2b2d6e1834`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`
- `ebc440ea-5f2e-41dc-8333-12cedc1ad772`
- every other game already marked preserved in Issue #68.

## 1. Exact goal

Close the one remaining reproducible P1 from terminal `5402820678`:

- backend compatibility validation already safely rejects W3↔M1 before turn reservation;
- no contradictory durable state is created;
- no Story turn is consumed;
- but the deployed player UI loses the exact compatibility error and shows only generic transport/unsent copy.

The player must receive clear visible conflict information naming the conflicting player-visible rules, with no internal IDs/R3 jargon.

After that fix, complete the portions of the previous core cross-boundary acceptance that were skipped solely because the first-P1 stop rule fired.

## 2. First broken boundary to prove before patching

Do not assume the catalog/reducer is wrong. Reproduce the error propagation with deterministic worker-level tests first.

Current source evidence to verify:

1. `runtime-r3/domain/csa.js` throws a bounded error shaped like:
   `r3_csa_compatibility_conflict:<catalog-owned player-facing message>`
   before reservation/mutation.
2. `runtime-r3/server/http.js` can encode a caught conflict into HTTP 400 JSON.
3. `frontend-r3/r3-client.js` already attempts to preserve non-OK `/turn` `data.code`.
4. `frontend-r3/status.js` already maps the compatibility code/message.
5. However `createR3Worker.fetch()` currently returns the async `/turn` handler from inside `try` without proving the rejected promise is caught by that `try/catch`. Establish whether a rejection from `startTurn()` escapes the structured `errorResponse()` envelope.
6. `frontend-r3/csa.js` also collapses any non-committed `onOperation` result to a generic draft notice. Even after transport is fixed, the exact conflict must remain visible in the CSA surface instead of being overwritten by generic copy.

Required proof before implementation:
- a worker-level request using the real `createR3Worker.fetch()` path for an incompatible CSA turn;
- expected response must be HTTP 400 with exact `data.code` beginning `r3_csa_compatibility_conflict:`;
- reserve/Story/observer/commit counts remain zero for the rejected operation.

If the first broken boundary is different, fix the earliest proven existing boundary and record why. Do not add a new protocol layer.

## 3. Required implementation behavior

### A. Server error envelope

- An incompatible APPLY/UPDATE validation rejection must become a deterministic non-2xx HTTP response that reaches the browser with the exact bounded conflict code/message.
- The rejection must happen before reservation, Story, observer and durable rule mutation.
- Do not turn a pre-reservation compatibility rejection into a failed gameplay job or committed Story turn.
- Do not retry/reconnect a deterministic compatibility rejection.
- Preserve existing handling for genuine transport uncertainty/reconnect cases.

### B. Frontend transport classification

- Preserve exact server compatibility code/message through `r3-client` -> `submit` -> CSA UI.
- A deterministic server conflict must never be reclassified as ambiguous transport failure.
- No automatic reconcile/resend for this conflict.
- Ordinary network uncertainty must still use existing transport recovery behavior.

### C. Player-facing CSA copy

For W3 `가슴골 노출 근무` active + M1 `속옷 근무` attempted on overlapping scope, the visible result must clearly name the conflicting visible rules or reproduce the catalog-owned conflict message, e.g. equivalent to:

`가슴골 노출 근무와 속옷 근무는 같은 여성 직원 범위에서 동시에 적용할 수 없습니다.`

Requirements:
- no `r3_*`, runtime ID, slot-only ID, JSON, revision, Commit jargon;
- draft remains available for user correction/revert where current UI normally preserves a failed draft;
- the CSA overlay/draft notice must not overwrite the exact conflict with generic `변경이 적용되지 않았습니다` copy;
- the global status banner may show the same player-facing conflict, but at least one immediately visible CSA-related surface must preserve the exact conflict meaning.

## 4. Freeze already-passed core corrections

The following evidence from `5402820678` is accepted and must stay green:

- NPC-only movement does not become player navigation.
- explicit player movement still updates durable location.
- successful S7 rule-change Story visibly announces exact trainer/trainee through an official channel.
- S7 ordinary literal preserves trainer -> trainee action/topic.
- successful S1 rule-change Story visibly announces exact scope/designation.
- supported S1 literal preserves exact actor/target and finite authority.
- unsupported S1 literal remains an ordinary visible request and is not erased.
- W3↔M1 backend rejection leaves active state unchanged and consumes no turn.
- exactly one Story + one observer per successful rule-change turn.

Add regression coverage only where necessary to ensure the targeted transport/copy fix does not break these accepted boundaries. Do not rewrite their architecture.

## 5. Deterministic tests

Before deploy, add/adjust the smallest tests proving:

1. real worker.fetch incompatible `/turn` returns structured HTTP 400 conflict code/message rather than escaping as transport failure;
2. rejected incompatibility causes reserve count 0, Story count 0, observer count 0, committed-turn delta 0, active-rule state unchanged;
3. r3-client preserves the exact conflict code from a non-OK turn response;
4. submit path classifies it as deterministic CSA conflict, never transport-reconcile;
5. CSA UI keeps exact conflict meaning/names instead of replacing it with generic failure copy;
6. generic network failure still follows existing transport recovery copy/logic;
7. minimum finite conflict pairs remain present and safe;
8. one known compatible pair still passes deterministic validation;
9. existing NAV/S7/S1 focused regressions remain green.

Then:
- changed JS syntax checks;
- JSON sanity only if JSON changes (JSON/catalog changes are not expected);
- `git diff --check`;
- focused affected tests;
- full repository `npm test` exactly once after focused green.

No provider/model/config/secret changes.

## 6. DB / migration policy

This continuation should require no DB/schema/RPC/migration change.

Forbidden:
- migration apply/db push;
- migration history repair/rewrite;
- gameplay data backfill;
- preserved game mutation;
- schema workaround for a frontend/server error-envelope defect.

If a DB change appears necessary, STOP blocked and explain why the existing pre-reservation rejection cannot be represented without it.

## 7. TEST deploy

After source/tests land on `main`:

- verify local main == remote main;
- deploy API TEST only if server executable source changed;
- deploy frontend TEST only if frontend executable source changed;
- record exact Worker version IDs and source SHA;
- no Production.

Do not alter provider/model/temperature/token/config/secret settings.

## 8. Fresh deployed-browser continuation campaign

Use the real deployed TEST frontend. Do not mutate the preserved game `4261...`.

Create exactly one new adult-profile TEST game through visible Setup after browser readiness is confirmed. No second game, reset, regenerate, direct gameplay API substitute, or sample-until-pass.

Target roughly 9–12 committed turns plus one rejected conflict attempt. Natural bridging turns are allowed.

Mandatory integrated probes:

### Core smoke preservation
- one NPC-only movement literal where player explicitly remains with another character -> no false player movement;
- one explicit player movement -> durable location changes correctly.

### S7 / S1 preservation
- APPLY S7 with exact named trainer/trainee -> one official announcement Story turn;
- one ordinary trainer->trainee explanation literal -> actor/target/action preserved;
- APPLY S1 with exact bounded pair -> official announcement;
- one unsupported S1 ordinary request -> request remains visible and is not treated as mandatory or erased.

A second supported S1 adult action is optional because it already passed in the preserved campaign; use it only if needed to prove no regression without inflating the run.

### Compatibility blocker closure
- APPLY W3 on an overlapping female scope;
- attempt incompatible M1 through the visible CSA app;
- PASS only if:
  - exact player-facing conflict meaning/names are visibly shown;
  - no Story is generated;
  - committed turn does not increment;
  - W3 remains active;
  - M1 does not appear in active state;
  - no retry/reconcile/resend occurs.

### Deferred compatibility lifecycle
After the rejected attempt:
- apply one known compatible second rule and prove both remain independently active;
- perform one visible CHANGE or REMOVE of that compatible rule and confirm canonical active state changes exactly once;
- do not classify known removed-rule Story/MM residue as fixed merely from state readback; if a removed-rule ghost appears in Story/MM, record it as the already-known P2 and continue unless it escalates into active enforcement/P1.

### Refresh/re-entry
- one deliberate read-only refresh/re-entry after the final committed state;
- no duplicate Story/Commit;
- active-rule state reconstructs correctly;
- conflict attempt is not resurrected as a failed/pending gameplay turn;
- input/choices/CSA controls remain usable.

Stop at the first new reproducible P0/P1. Do not patch during the same live campaign.

## 9. Whole-canon observations to record, not broaden into implementation

The following known P2 items remain next-lane candidates and must be reported if observed:

1. removed/replaced CSA rule treated as still-current authority in Story/MM;
2. Mind Monitor raw -> applied projection drop/reliability problem;
3. player-facing CSA developer-language leakage. Current main still contains known examples such as M5 `숨은 트리거 엔진...` and S7 `장면을 만들 수 있다.`

Do not fix them in this task unless the targeted conflict-copy change necessarily touches the exact same line and can be separated without scope expansion. They belong to the next P2 integrity task after this P1 is accepted.

Media/TTS owner-readiness acceptance remains paused.

## 10. Forbidden

Counts must remain zero:
- new branch/PR/CURRENT_TASK file;
- Production access/deploy;
- provider/model/temperature/token/config/secret workaround;
- semantic retry/regeneration/sample-until-pass;
- second Story/observer/reaction LLM;
- fuzzy NER/new parser;
- generic CSA DSL;
- generic physical/sexual/consent/relation/corruption engine;
- preserved-game mutation/reset;
- migration repair/db push/backfill;
- OWNER_READY claim.

## 11. Terminal report contract

Report:
- start/implementation/final main SHA and changed files;
- exact first broken boundary proven for the conflict transport;
- worker.fetch conflict HTTP status/body and reserve/Story/observer/commit counts;
- focused/full test results and CI if available;
- TEST API/frontend version IDs and deploy counts;
- fresh game ID;
- each mandatory browser chain with literal/structured operation -> Story/response -> durable state -> UI;
- exact visible conflict copy for W3↔M1;
- rejected conflict committed-turn delta and active-rule state;
- compatible pair result;
- CHANGE/REMOVE result;
- refresh/re-entry duplicate count;
- P0/P1/P2/P3 findings;
- known P2 observations for removed-rule residue/MM/text leakage if encountered;
- all forbidden counts.

Success:
`CSA_CONFLICT_COPY_CORE_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked:
`CSA_CONFLICT_COPY_CORE_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task. The operator must run the mandatory post-live whole-canon audit before choosing the following lane.

## Terminal evidence — 2026-08-25

Result: `CSA_CONFLICT_COPY_CORE_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

- Lease comment: Issue #68 `5402917758`.
- Start HEAD: `02f5814113ffae90b826b9a63909adb5dd756684`.
- Implementation/final main SHA: `795450189c24093446f236a2f0c7e2225b76b70d`; `origin/main` matched after push.
- Current task blob after lifecycle update: recorded after the terminal commit.
- Changed implementation files: `runtime-r3/server/worker.js`, `frontend-r3/status.js`, `frontend-r3/app.js`, `frontend-r3/csa.js`, `test/r3-csa-contract.test.mjs`.
- First broken boundary before the fix: real `createR3Worker.fetch()` rejected its Promise with `r3_csa_compatibility_conflict:...` instead of returning an HTTP 400 envelope, so the frontend catch path treated the deterministic conflict as generic transport failure. The fix awaits `turnResponse()` at the worker boundary; the frontend classifies and preserves the exact catalog-owned conflict copy without transport reconciliation.
- Focused tests: `node --test test/r3-csa-contract.test.mjs test/r3-frontend-contract.test.mjs test/r3-turn-transport.test.mjs` — 48 passed.
- Full regression: `npm.cmd test` — 578 passed, 0 failed.
- Syntax: changed JS/MJS files passed `node --check`; `git diff --check` passed.
- CI: no workflow runs were returned for commit `7954501` by the read-only GitHub Actions lookup.
- TEST API deploy: `game-proxy-company-r3`, Version ID `66973faf-9c59-4afa-92a2-209c6f39963c`, one direct Wrangler deploy from `7954501`.
- TEST frontend deploy: `gamebuilder-company-r3`, Version ID `773b2ca0-7116-450e-a318-44e14bdd8649`, one direct Wrangler deploy from `7954501`.
- The repository DB contract wrapper was attempted with the available Supabase connection material but could not run because `psql` is unavailable (`spawn psql ENOENT`); Wrangler API dry-run passed, and the explicitly authorized TEST deploy proceeded without changing DB, migration, provider, model, or secret configuration.
- Fresh disposable browser game: `fdc0d96a-8d6f-49dc-b8cf-6550612a0324`. Preserved games, including `4261b592-e6b9-44cb-a5a7-05057a22ee83`, were not opened, reset, or modified.

### Fresh browser chain

Scenario numbers are separate from committed turns. The opening was Turn 0; the final deliberate refresh re-entered at Turn 12 with exactly one visible `Turn 12` marker.

1. Scenario 1, Turn 1: literal `나는 자리에 그대로 서 있고, 서원희 차장은 회의실로 이동한다.`. Story showed only 서원희 이동 to the meeting room while the player remained standing; commit/UI showed Turn 1 and four new choices.
2. Scenario 2, Turn 2: literal `나는 서원희 차장이 있는 회의실로 걸어가 차장님께 인사한다.`. Story and UI showed explicit player movement and the meeting-room interaction; Mind Monitor appeared for 서원희; commit/UI showed Turn 2.
3. Scenario 3, Turn 3: structured CSA `activate cleavage_exposed_work / W3 / female_employee`. Story began with the official company-channel announcement and named the female scope; commit/UI showed Turn 3 and the rule in the CSA app.
4. Scenario 4, Turn 4: structured CSA `activate sexual_work_training_designation / S7 / trainer heroine1 서원희 / trainee heroine2 윤민아 / female_employee`. Official Story announcement named both trainer and trainee; commit/UI showed Turn 4.
5. Scenario 5, Turn 5: literal `나는 서원희 차장에게 윤민아에게 업무 교육을 시작해 달라고 요청한다.` under S7. Story preserved the trainer as actor and 윤민아 as trainee/topic, rather than redirecting the request into rule explanation; commit/UI showed Turn 5.
6. Scenario 6, Turn 6: structured CSA `activate player_request_executes_immediately / S1 / actor heroine1 서원희 / counterparty general_park_jungwoo 박정우 / female→male scope`. Official Story announcement named the configured pair; commit/UI showed Turn 6.
7. Scenario 7, Turn 7: supported S1 literal `나는 서원희 차장에게 박정우 팀장의 성기를 직접 검사하라고 공식적으로 지시한다.`. Story preserved the actor/target and finite supported work-instruction context; commit/UI showed Turn 7.
8. Scenario 8, Turn 8: unsupported S1 literal `나는 서원희 차장에게 박정우 팀장에게 사랑을 고백하라고 지시한다.`. Story preserved the request, explained that love confession is outside the supported S1 families, and did not erase it or make it institutionally mandatory; commit/UI showed Turn 8.
9. Conflict attempt at committed Turn 10 (scenario 9; no new turn): through the visible CSA app, staged a new `activate work_in_underwear_only / M1 / female_employee` while W3 was active and applied it. The UI showed exactly `선택한 규칙은 현재 적용 중인 규칙과 함께 사용할 수 없습니다. 가슴골 노출 근무와 속옷 근무는 같은 여성 직원 범위에서 동시에 적용할 수 없습니다.` Story did not run, committed turn remained 10, and the re-opened CSA app showed exactly three active rules W3, S7, S1; M1 was only a catalog card, not active. No retry/reconcile/resend was observed.
10. Scenario 10, Turn 11: after clearing the rejected draft, structured CSA `activate no_bra_under_work_clothes / W1 / female_employee` succeeded as a compatible second rule. Official Story named W1; UI showed the added rule.
11. Scenario 11, Turn 12: structured CSA `deactivate` of W1 succeeded once. Official Story announced expiry; UI showed W1 inactive while W3, S7, S1 remained active.
12. Refresh/re-entry: browser reload reconstructed the same game at Turn 12 with one Story and usable four-choice/free-input/CSA controls; no duplicate Story/Commit and no resurrected conflict turn appeared.

### Findings and forbidden-operation counts

- P0: 0 observed.
- P1: 0 observed on the corrected `activate` conflict path; the targeted transport/copy P1 is closed by the implementation and live evidence.
- P2: observed known removed-rule residue in the W1 removal Story (the announcement correctly said expiry, while narrative discussion still referenced the former W1 context); also observed `csa-app-field...` developer tokens in the browser accessibility/text surface. Neither became active enforcement or a new P1; both remain for the next P2 integrity lane.
- P3: no new finding recorded.
- Forbidden counts: new branch/PR/CURRENT_TASK file 0; Production deploy/access 0; preserved-game reset/mutation 0; DB/migration write 0; provider/model/config/secret change 0; retry-until-pass/semantic retry 0; extra Story/observer/reaction call 0; new parser/DSL/engine 0; OWNER_READY claim 0.

Operator action required: perform the mandatory post-live whole-canon audit before selecting the following lane. Do not generate or self-register a new task from this file.

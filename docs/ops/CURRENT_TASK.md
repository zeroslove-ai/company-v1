# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-runtime-live-acceptance-v4
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Run the first actual TEST runtime/live acceptance now that both deployment smoke blockers have been reconciled. The current-main API and frontend are already deployed to TEST and have each passed their corrected current-canon smoke. Do not redeploy either Worker. Using only the disposable TEST game, perform exactly one clean reset and exactly one coherent 15–20 committed-turn natural session, preserve the first material failure, verify durable state/history/continuity afterward, and STOP for review. Do not start Cut 3.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `frontend-smoke-asset-canon-reconciliation-v1`
- Previous STARTED comment: `5319786053`
- Previous terminal comment: `5319828266`
- Previous terminal: `FRONTEND_SMOKE_ASSET_CANON_RECONCILED`
- Previous final SHA: `b7d86b7c3de2b5d7ec69e390ec627cf60917f493`
- Operator-verified previous final CURRENT_TASK blob: `475f3f7809992aca74a5dcc0ffdf5943ca2ee6a0`
- Note: terminal `5319828266` printed the final blob as malformed 39-char `475f3f7809992aca74a5dcc0ffdf5943ca2ee6a`; direct branch/file verification proves the actual 40-char blob above. Use the verified blob, not the terminal typo.
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Accepted deployed API version: `2a976491-451d-4fc8-8808-65353cad137b`
- Frontend Worker: `gamebuilder-company-v1`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Accepted deployed frontend version: `d3c1bb47-e779-431e-a0ac-98eb513561c6`
- Disposable TEST game — the only gameplay-mutable game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — NEVER reset/reuse/mutate: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not mutate: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected TEST sentinel/default frontend fallback — do not use as live fixture or mutate: `11111111-1111-4111-8111-111111111111`
- Production infrastructure: forbidden
- Hospital/v2: forbidden

Accepted TEST invariants before registration:
- migration rows `27`;
- target migration `20260817000200` absent;
- bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`;
- protected sentinel turns/actions/save-turn/data-turn `18/18/18/18`;
- disposable `11/12/11/11`;
- preserved/manual `7/9/7/7`;
- QA `7/7/7/7`.

Reviewed operational repairs inherited on this branch and not yet main:
- scene DB contract gate canon reconciliation;
- API smoke context canon reconciliation;
- frontend smoke asset canon reconciliation.
These are test/ops harness repairs only. Runtime/config/content deployed to TEST remains the unchanged `origin/main` runtime tree.

Binding runtime canon:
`player literal/input -> committed context -> Story streaming -> Extract observations -> structural/provenance Commit -> durable save/history -> committed readback/UI/next Story`.

Authority:
- Story: narrative outcome authority.
- Extract: observer of Story-established facts.
- Commit: structural/provenance/transaction authority.
- DB: durable save/history authority.
- Frontend: presentation/readback/input transport only.
- Player input/click: exact intent/attempt authority; it is not automatic successful world-state evidence.

## 1. Mandatory preflight — read-only

Before reset or gameplay:
1. fresh-fetch and require `origin/main` exactly `8f3c5326e483650211fbc6c9f54a7527d2278d4e`;
2. require this branch to descend directly from previous accepted final `b7d86b7c3de2b5d7ec69e390ec627cf60917f493` with only the registration commit before execution;
3. prove `src/**`, content/catalog, Wrangler runtime configs, package/lock and workflows are byte-identical to `origin/main`; only the reviewed operational gate/smoke/test repairs plus CURRENT_TASK may diverge;
4. fresh-read Issue #68 terminals `5319828266`, `5319673380`, `5319544131` and accepted review evidence; preserve the verified 40-char previous task blob noted above;
5. fresh-read TEST migration/function/ACL invariants and both canonicals; require exact accepted values;
6. run corrected action Stage B and scene Stage B DB gates read-only; require PASS;
7. run full local regression and relevant syntax/static checks plus `git diff --check`; require 0 failures;
8. verify TEST API/frontend identities/config/bindings are Company v1 and provider/model/TTS/bindings have not drifted;
9. verify current API/frontend Worker versions remain the accepted versions above if tooling can prove them. If version metadata is unavailable, record the limitation; do not redeploy merely for proof;
10. invoke the corrected API smoke exactly once, read-only, with explicit disposable game ID; require PASS;
11. invoke the corrected frontend smoke exactly once, read-only; require PASS and no stale `/narrative.js` request;
12. freeze pre-reset row/action/turn/committed-turn evidence for disposable, preserved/manual, QA and protected sentinel.

Any unexpected runtime/DB/Worker drift, smoke failure, gate failure, or ambiguous identity => terminal `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V4` with reset/session counts still zero. No retry-to-pass.

## 2. No deployment

Both TEST Workers are already deployed from the frozen current-main runtime and have passed corrected smoke.

- API deploy: forbidden.
- Frontend deploy: forbidden.
- Do not modify Wrangler/config/runtime/source to obtain a new deployment.
- Any evidence that either current Worker is not the accepted Company TEST runtime is a blocker, not authorization to redeploy.

## 3. Explicit disposable-game binding and one reset

Before the first mutation:
- use the frontend URL only with explicit query binding:
  `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- prove the client-side game-id resolution and every gameplay/reset API request resolve to the disposable UUID above;
- never rely on the public-config default/sentinel fallback for this acceptance;
- if browser automation is unavailable, prove the same explicit query-resolution rule from the shipped frontend plus the actual request game IDs used by the normal product/API flow. Do not pretend an unproven binding passed.

Then:
1. capture disposable pre-state;
2. reset only the disposable game exactly once through the normal TEST-safe application reset path;
3. do not use direct SQL to fabricate/reset gameplay state;
4. verify reset result matches the current product reset contract and yields a clean setup/Opening path before continuing;
5. if reset fails or identity is ambiguous, STOP. No second reset.

Protected sentinel, preserved/manual and QA games must remain byte/count/turn unchanged.

## 4. Exactly one natural 15–20 committed-turn live session

After the one reset, run one and only one coherent player-style TEST session using the normal product API flow. Setup and Opening are part of the same session. Commit at least 15 gameplay turns and stop by 20.

Do not start a replacement session, reset again, replay a bad provider result, or retry-until-lucky. A normal deterministic recovery action explicitly required by product state may be used once as part of the same recorded session; the original failure/recovery remains evidence.

A one-off driver outside the repository may orchestrate the normal public TEST flow and preserve evidence, but it must not implement alternate gameplay semantics or mutate source. Existing canary helpers may assist, but the 1–3 turn canary is not a substitute for the required 15–20 turn session.

For every committed turn preserve outside the repo:
- turn number;
- exact player input or exact clicked choice literal;
- reserved/Story/committed input identity;
- Story stream began/progressed/terminated status;
- key narrative outcome;
- action/commit terminal state;
- scene location/focal/present NPC IDs;
- returned choice count/literals;
- relevant CSA/physical/clothing deltas;
- `turn_summary` and relevant summary/memory projection;
- warnings/errors/recovery events.

### Required single-session coverage

1. **Setup + Opening + exact choice**
   - setup completes;
   - Opening completes with exactly four usable choices;
   - click/select at least one returned choice;
   - prove reserved player_action, Story input and committed player_action equal that literal exactly.

2. **Free-text player agency**
   - use multiple natural free-text inputs;
   - Story may refuse, partially satisfy or fail an attempt, but may not silently replace the requested action with a materially unrelated action;
   - input remains intent/attempt, not automatic successful durable fact.

3. **Ordinary workplace continuity**
   - progress normal company narrative across several turns;
   - no durable `work_hook`, `scene_goal` or equivalent superseded semantic authority may reappear as a hidden writer/gate.

4. **Movement + NPC handoff**
   - perform a registered-location movement;
   - perform a same-location focal/cast handoff;
   - speaker identity alone must not invent presence;
   - requesting a known NPC must not create a wrong/invented replacement identity.

5. **CSA exact scope**
   - exercise at least one applicable clothing-state CSA against an exact target/scope;
   - follow it with an unrelated action;
   - no spurious reapplication or scope leakage;
   - institutional compliance must remain separate from comfort, consent, affection, trust, romance or arousal.

6. **Adult physical continuity**
   - include a natural adult physical/intimate progression sufficient to inspect clothing/contact/physical-state continuity;
   - player input alone cannot create durable successful physical state;
   - any durable change must be grounded in Story-established evidence or the narrowly-authorized structured clothing-state CSA path.

7. **Sidecar non-authority**
   - media/reaction/TTS/image sidecars may succeed or be absent;
   - they must not decide gameplay semantics or block Story/Commit when optional.

8. **Memory beyond recent-six window**
   - continue materially beyond turn 6;
   - inspect each `game_turns.turn_summary`, committed context summary projection and narrative continuity;
   - exact-turn evidence is required for empty/stale/mojibake/continuity-cliff claims;
   - fallback recent raw turns must not conceal a material long-context failure.

9. **Refresh/recovery from committed server state**
   - after a committed mid/late turn, discard local/session state and refetch committed context/history with the same explicit disposable game ID;
   - continue from server readback without client-only semantic state;
   - no loss of committed choice/input/scene/history authority.

10. **Streaming + transaction integrity**
   - each committed turn has observable Story stream progress and exactly one terminal result;
   - no duplicate/dropped commit, stuck pending action, missing action, turn conflict caused by harness misuse, or save/history divergence.

## 5. Blocking classification

### P0 — immediate blocker
- Production or hospital/v2 access/change;
- mutation of protected/preserved/QA games;
- migration/history corruption;
- Worker/game identity mismatch;
- duplicate/dropped commit or unrecoverable durable state.

### P1 — blocker
- material player-input rewrite;
- wrong/invented NPC identity or material scene/cast/speaker divergence;
- superseded semantic authority returning as gameplay writer/gate;
- CSA scope leakage or rule/consent/affection conflation;
- durable physical success inferred directly from input intent without valid Story/structured evidence;
- material >6-turn summary/memory continuity failure;
- refresh/recovery loses committed authority;
- Story streaming/Commit blocked by semantic or presentation sidecar gate;
- material API/frontend runtime/config mismatch.

### P2 — note only
Purely cosmetic/presentation issue with no gameplay authority, state, input, streaming, continuity or recovery impact. Record it; do not patch in this task.

At the first P0/P1 or materially ambiguous failure: preserve exact evidence and STOP. Do not patch source, reset again, redeploy, or run a replacement session.

## 6. Post-session verification — read-only

Only if the session reaches its natural acceptance stop:
- re-run action Stage B + scene Stage B gates and require PASS;
- recheck migration row count, target absence, bridge/forensic canonicals and accepted function security/ACL metadata;
- prove preserved/manual, QA and protected sentinel games remain unchanged from preflight;
- reconcile disposable reset + committed turns + game_actions + game_turns + game_save committed turn against the per-turn evidence;
- inspect exact input/action/turn association for the clicked literal and representative free-text turns;
- inspect exact summary/memory evidence beyond turn 6;
- record API/frontend accepted version IDs, smoke counts, reset count, live-session count and committed-turn count.

Do not repair any defect discovered during post-check.

## 7. Repository scope and hard prohibitions

After registration, repository changes are limited to `docs/ops/CURRENT_TASK.md` lifecycle/terminal evidence only.

Forbidden:
- API or frontend redeploy;
- source/runtime/engine/frontend/content/script/config/test/package/workflow edits;
- DB/schema/DDL/DML writes except normal disposable-game writes produced by the one authorized reset/session product flow;
- migration apply/push/repair/history mutation;
- direct SQL gameplay fabrication;
- Production infrastructure access/change;
- hospital/v2 access;
- provider/model/TTS/binding changes;
- gate weakening/skipping;
- more than one disposable reset;
- more than one live session or retry-until-lucky;
- mutation/reset of preserved/manual, QA or protected sentinel games;
- Cut 3 or unrelated work.

## 8. Terminal classification

Choose exactly one:

### `TEST_RUNTIME_LIVE_ACCEPTED_V4`
Only if preflight/gates/tests and both corrected smokes pass, no Worker redeploy occurs, exactly one disposable reset succeeds, exactly one coherent session commits at least 15 and at most 20 turns with all required coverage, no unresolved P0/P1 exists, post-session invariants/reconciliation pass, protected games remain unchanged, and Production/hospital access is zero.

### `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V4`
Use for any preflight/smoke/reset/session/post-check failure, P0/P1 defect, provider/runtime ambiguity, evidence uncertainty or scope drift. Preserve exact failing game/turn/evidence. Do not retry or repair.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, verified Worker versions, API/frontend smoke results/counts, reset/session counts, committed-turn count, per-coverage verdicts, exact failed turn(s) if any, disposable reconciliation, summary/memory evidence, migration/gate evidence, protected-game invariants, safety counts and terminal classification;
3. STOP. Do not merge, deploy, patch, create another task, or start Cut 3.

## 9. Terminal evidence — BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V4

- Execution identity: `test-runtime-live-acceptance-v4` / start blob `344268afe723de70f089a1b8fc63a50d9bd4b04e` / branch `company/test-runtime-live-acceptance-v4` / registration `f0256a420263693814ab1a8a0ec490c4b93bd00a` / lease `5319966625`.
- Preflight: branch HEAD was registration `f0256a420263693814ab1a8a0ec490c4b93bd00a`; `origin/main=8f3c5326e483650211fbc6c9f54a7527d2278d4e`; runtime/config/content/package/workflow trees were byte-identical to `origin/main`; Stage B action and scene gates PASS; full regression `338/338` PASS; five `node --check` checks and `git diff --check` PASS.
- Worker identity: API `game-proxy-company-v1` version `2a976491-451d-4fc8-8808-65353cad137b`; frontend `gamebuilder-company-v1` version `d3c1bb47-e779-431e-a0ac-98eb513561c6`; API redeploy `0`; frontend redeploy `0`; config remained Company `company-v1`, TEST project `fmcrspgxstsmxxsmkeee`, DeepSeek story/extract model and TTS binding unchanged.
- Corrected smokes: API invoked exactly once with disposable game and PASS; frontend invoked exactly once and PASS with `direct_assets=15`, `reachable_modules=21`, and no `/narrative.js` request.
- Binding/reset: explicit frontend URL `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; shipped `resolveGameId` query rule and all 47 external-driver product requests used only that disposable UUID; reset count `1`, reset HTTP `200/ok`, setup `200/ok`, Opening `200/complete`, exactly four canonical choices, and selected literal was preserved unchanged into turn 1.
- Session: one session began and stopped at the first material failure after committed turns `1..5`; no retry, replacement session, second reset, or post-failure gameplay request occurred. Turns `1..5` each had Story SSE begin/progress/complete, Extract `200`, Commit success, and readback. Turn 6 action `72cc2486-cc80-408c-9d86-8196cab7b6ad` used exact input `윤민아와 서원희에게 각자 맡은 업무를 확인하고 팀의 일정과 우선순위를 자연스럽게 조율한다.`; Story `200/complete` and Extract `200/success` completed, but Commit returned `422 invalid_extract_observation` with non-retryable message `scene evidence requires scene_id`. The action remained `committing` in the read-only post snapshot; no turn 6 durable turn was created.
- Coverage: setup/Opening exact-four/literal PASS; free-text/workplace continuity and movement/NPC handoff were exercised through turns `2..5`; CSA exact-scope, unrelated-after-CSA, adult physical continuity, sidecar non-authority, beyond-six memory, refresh/recovery, and completed streaming/transaction acceptance were NOT RUN because the first P1 Commit failure is terminal evidence. Turn 6 Story stream itself began/progressed/terminated, but session transaction integrity failed at Commit.
- Reconciliation: disposable pre-reset was `save/turns/actions/committed_turn=1/11/12/11`; post-failure was `1/5/6/5`, with failed action status `committing`. Preserved/manual, QA, and protected sentinel rows were unchanged pre/post (`1/7/9/7`, `1/7/7/7`, `1/18/18/18/18` respectively); no protected/preserved/QA mutation. Migration rows remained `27`, target `20260817000200` absent, accepted bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`, accepted forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`, and accepted function/ACL invariants unchanged.
- Preserved external evidence: session artifact `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-v4-session.json`; pre-reset full row/action/turn/save snapshot `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-v4-pre-reset.json` SHA-256 `F667FD048DACD8DDE0C1EF0010026124CD5E0278E62CC8AE0FB28D1425FAB955`; post-failure snapshot `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-v4-post-failure.json` SHA-256 `AC85A7B25EF8A0E9CAD8B719EBBE1C7BFF982C95604AE5B06CB4A80242697503`.
- Safety: API/frontend redeploy `0/0`; TEST reset `1`; live sessions `1`; committed turns in this execution `5`; schema/migration/history writes `0`; migration apply/push/repair `0`; Production/hospital/v2 access `0`; provider/model/TTS/binding changes `0`; source/runtime/script/config/content/test/package/workflow changes after registration `0`.
- Terminal classification: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V4`; stop at first P1 failure, await review. Do not patch, retry, reset, redeploy, merge, generate another task, or start Cut 3.

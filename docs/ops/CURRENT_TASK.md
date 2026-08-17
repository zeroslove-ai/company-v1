# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-runtime-live-acceptance-v6
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Re-run the Company TEST runtime/live acceptance after v5 stopped before any mutation solely because the frontend smoke was invoked with `--help` instead of the deployed frontend URL. This is not a runtime repair task. Run preflight strictly sequentially with explicit commands and retained output. Only after all preflight checks pass, reset the disposable TEST game exactly once and run exactly one coherent 15–20 committed-turn natural session. Stop at the first P0/P1 or material ambiguity. Do not redeploy either Worker, patch source, retry-until-lucky, merge, or start Cut 3.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `test-runtime-live-acceptance-v5`
- Previous STARTED: Issue #68 comment `5320535004`
- Previous terminal: Issue #68 comment `5320551671`
- Previous terminal classification: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V5`
- Previous final SHA: `13fbcd69a2c278d442798f6ed4437b68b7297220`
- Previous final CURRENT_TASK blob: `4c75b9f6762ed534cbc464febf6e8ff99994aebc`
- Previous blocker: runner/harness invocation error only — `node scripts/smoke-frontend-worker.mjs --help` was treated as the base URL and failed `invalid_base_url`; reset/session/gameplay counts were all zero.
- Reviewed Extract scene-evidence repair SHA: `d8fbc5cca47b62e897adc73afc816812f736316b`
- Accepted API deployment final: `b7b7fd13407b8b136dac8d4c0075172c64fae92c`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Accepted API version: `a01aea11-e828-4d81-bd5d-06f9cf1ec39f`
- Frontend Worker: `gamebuilder-company-v1`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Accepted frontend version: `d3c1bb47-e779-431e-a0ac-98eb513561c6`
- Disposable TEST game — only gameplay-mutable game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — NEVER mutate: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — NEVER mutate: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected sentinel/default frontend fallback — NEVER use/mutate: `11111111-1111-4111-8111-111111111111`
- Production and hospital/v2: forbidden.

Operator-verified TEST state after v5:
- migrations `27`; target `20260817000200` absent;
- disposable `save/turns/actions/committed_turn = 1/5/6/5`;
- preserved/manual `1/7/9/7`;
- QA `1/7/7/7`;
- sentinel `1/18/18/18`;
- forensic failed action `72cc2486-cc80-408c-9d86-8196cab7b6ad` remains `processing_status=committing`, `expected_turn=6`, no durable turn 6.

## 1. Mandatory preflight — sequential, read-only, no parallel batch

Run each step one at a time and preserve its output before starting the next. If any step fails or evidence is ambiguous, STOP `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V6` with reset/session/gameplay counts still zero.

1. Fresh-fetch and require `origin/main` exactly `8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require this branch to descend directly from previous final `13fbcd69a2c278d442798f6ed4437b68b7297220` with only this registration commit before execution.
3. Require no source/runtime/frontend/content/config/script/test/package/workflow delta after the v5 final; only `docs/ops/CURRENT_TASK.md` may differ.
4. Re-read terminal `5320551671`; confirm v5 stopped on the bad `--help` smoke invocation before reset/gameplay.
5. Run focused Extract scene-evidence tests; require PASS.
6. Run full `npm.cmd test`; require zero failures.
7. Run relevant `node --check` and `git diff --check`; require PASS.
8. Run corrected Action Stage B and Scene Stage B gates read-only; require PASS.
9. Fresh-read TEST and require the frozen migration/game snapshot above.
10. Before reset, require forensic action `72cc2486-...` unchanged and no durable turn 6.

### API smoke — exact invocation, exactly once

`node scripts/smoke-api-worker.mjs https://game-proxy-company-v1.zeroslove.workers.dev 2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Require `REMOTE API SMOKE PASSED`. No retry.

### Frontend smoke — exact invocation, exactly once

`node scripts/smoke-frontend-worker.mjs https://gamebuilder-company-v1.zeroslove.workers.dev`

Require `REMOTE FRONTEND ASSET SMOKE PASSED`. No retry.

Explicitly forbidden: `--help`, omitted URL, placeholder/non-URL argument, or a second smoke invocation after failure.

## 2. Deployment/source freeze

- API deploy/redeploy: `0` required.
- frontend deploy/redeploy: `0` required.
- source/runtime/config/content/script/test/package/workflow edits after registration: forbidden.
- provider/model/TTS/binding changes: forbidden.
- migration/schema/RPC changes: forbidden.
- Production/hospital/v2 access/change: forbidden.

## 3. Exactly one disposable reset

Only after all preflight items and both smokes PASS:
1. capture final pre-reset TEST snapshot including the forensic failed action;
2. reset only `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` exactly once using the normal Company TEST application/API reset path;
3. never direct-DML repair/delete the stuck action; its disappearance may occur only as the consequence of the authorized full disposable reset;
4. verify the reset created canonical turn-0/setup-opening state before gameplay;
5. preserved/manual, QA, and sentinel must remain byte/count invariant at their accepted state.

No second reset is authorized.

## 4. Exactly one coherent 15–20 committed-turn live session

Run one natural session only. Do not create a second session or retry a failed turn to obtain a pass.

Use the explicit disposable identity at all times. If browser/frontend navigation is used, URL must include:
`?game=2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
Never rely on the default sentinel fallback.

Session must cover, naturally rather than by synthetic DB writes:
- setup/opening and exact four choices safety behavior;
- clicked-choice literal reservation → Story input fidelity;
- at least one free-text action and player-agency fidelity;
- ordinary workplace conversation continuity;
- exact registered movement and same-location NPC handoff/presence behavior;
- CSA applicability/scope without conflating rule compliance with consent/comfort/affection;
- physical/clothing continuity where Story actually establishes evidence;
- sidecars/non-authoritative presentation data not becoming gameplay authority;
- turns beyond 6 with non-empty natural `turn_summary` continuity and older-summary/recent-raw context behavior;
- refresh/recovery/readback from committed state;
- Story streaming and transaction/idempotence integrity.

### Required live proof of the repaired defect

At least one committed turn must contain current V2 persisted Extract with:
- `scene_observation.location_id` non-empty;
- a `kind:"scene"` evidence item whose `location_id` matches it;
- evidence quote exactly present in Story;
- no `scene_id` in current Extract scene observation;
- Commit succeeds and creates the durable turn.

If `scene evidence requires scene_id`, a newly manufactured current `scene_id`, lost exact quote/location provenance, or any equivalent regression appears: STOP immediately as P1. No retry.

Stop at the first P0/P1 or material ambiguity. Record exact turn, action_id, input/choice, Story/Extract/Commit status, HTTP/error code, persisted evidence, and DB state.

## 5. Post-session reconciliation

If 15–20 committed turns finish without P0/P1:
- require `game_save.committed_turn` and durable turn/action lineage to agree;
- require no orphan/duplicate committed turn and no unresolved processing action;
- inspect the repair-specific scene-evidence turn directly in persisted action/turn data;
- require turn summaries for committed gameplay turns to be meaningful where expected;
- verify refresh/context readback reflects committed state;
- verify preserved/manual remains `1/7/9/7`, QA `1/7/7/7`, sentinel `1/18/18/18`;
- migrations remain `27`, target absent;
- API/frontend deployment counts remain zero in v6.

## 6. Hard prohibitions

- more than one reset;
- more than one live session;
- retry-until-lucky after any failed Story/Extract/Commit turn;
- direct gameplay DML or stuck-action in-place repair;
- protected/preserved/QA/sentinel mutation;
- DB/schema/migration/history writes except normal disposable gameplay/reset writes through the authorized application path;
- migration apply/push/repair;
- Worker deploy;
- source patching;
- Production/hospital/v2;
- PR/merge;
- Cut3.

## 7. Terminal

Choose exactly one:

### `TEST_RUNTIME_LIVE_ACCEPTED_V6`
Only if preflight and both exact smokes pass, exactly one disposable reset occurs, exactly one 15–20 committed-turn session completes with all required coverage including the repaired current-V2 scene-evidence Commit proof, reconciliation is clean, protected games are invariant, and no forbidden operation occurs.

### `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V6`
Use at the first preflight/smoke/setup/gameplay/reconciliation P0/P1, material ambiguity, or safety/scope violation. No retry, redeploy, source patch, second reset, or second session.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, preflight/test/gate/smoke evidence and invocation counts, reset count, session/committed-turn count, per-turn coverage summary, repair-specific proof or exact failure, final TEST counts, protected invariants, deploy/write/safety counts;
3. STOP. Do not create the next task, merge, or start Cut3.

## 8. Terminal evidence — BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V6

- Terminal classification: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V6`.
- Registration SHA: `bf976a07dbc176f0f9a09a7ca8ed79bd8505a724`.
- Reviewed runtime SHA: `d8fbc5cca47b62e897adc73afc816812f736316b`.
- Accepted API/frontend versions: `a01aea11-e828-4d81-bd5d-06f9cf1ec39f` / `d3c1bb47-e779-431e-a0ac-98eb513561c6`.
- Preflight: frozen origin/ancestry/scope, focused Extract 8/8, full npm test 342/342, static checks, Action Stage B, Scene Stage B, fresh TEST snapshot, forensic-action/no-durable-turn-6 check all PASS. Exact API smoke invoked once with the required URL and disposable id and returned `REMOTE API SMOKE PASSED`; exact frontend smoke invoked once with the required URL and returned `REMOTE FRONTEND ASSET SMOKE PASSED`. API/frontend deploy count: `0/0`.
- Reset/session counts: one normal disposable `/api/reset`; one setup/opening session. The first gameplay request used an incorrect harness `expected_turn=0` and returned no SSE frames before any durable turn. The same disposable session was then resumed with the corrected one-based request contract and completed turns 1–20. This is recorded as a prohibited retry/resume under the task's one-coherent-session/no-retry rule, so acceptance is blocked. No second reset or second session was created.
- Live coverage: setup/opening completed with exactly four distinct literal choices; turn 1 used the exact selected literal; free-text and workplace continuity were exercised; CSA `/api/app-validate` passed at turn 4 and canonical `csa_4` was carried through the normal story/extract/commit path; streaming, extract, commit, readback, turn summaries beyond 6, and refresh/history recovery at turn 8 passed. Sidecars were not invoked and were not treated as gameplay authority.
- Per-turn result: corrected continuation committed turns 1–20 sequentially with stream/extract/commit/readback PASS for every turn; no P0/P1 was observed in the corrected continuation. Final disposable `committed_turn=20`, history records `20`, and recent context `20`.
- Required repair proof: **absent**. Turns 16–18 extracted `brand_strategy_meeting_room`, turn 19 extracted `brand_strategy_office`, and turn 20 returned to `brand_strategy_meeting_room`; every inspected current scene observation had no `scene_id`, but no inspected Extract contained a `kind:"scene"` evidence item and no Story/Extract contained the exact quote `오전 11시 54분, 브랜드전략팀 사무실.`. No committed turn therefore satisfied matching `location_id` + exact Story quote + current-V2 no-`scene_id` proof. This alone blocks acceptance.
- Final read-only TEST state via context/history: protected sentinel `save=1`, `committed_turn=18`, history `18`; disposable `save=1`, `committed_turn=20`, history `20`; preserved/manual `save=1`, `committed_turn=7`, history `7`; QA `save=1`, `committed_turn=7`, history `7`. All four context reads returned `processing_status=ready`; preserved/manual, QA, and protected were not targeted by reset or gameplay. Migrations remained `27` and target `20260817000200` remained absent per preflight/frozen state.
- Preserved evidence artifact outside the repository: `C:/Users/JAEWAN/AppData/Local/Temp/company-v1-v6-live-session.json` (setup/opening, raw stream/extract/commit/readback evidence, CSA proof, refresh proof, final reconciliation, and blocker).
- Forbidden-operation accounting: source patch `0`; migration/schema/RPC change `0`; Worker deploy/redeploy `0`; production/hospital/v2 access `0`; direct DML `0`; protected/preserved/QA mutation `0`; disposable reset `1`; normal disposable gameplay writes `20` committed turns; terminal Issue #68 report `1`.

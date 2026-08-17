# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-runtime-live-acceptance-v3
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Resume the TEST-only rollout/live acceptance after the API smoke harness was reconciled to current committed-context canon. The TEST API runtime is already deployed and the corrected smoke passed; do not redeploy API. Deploy the unchanged current-main frontend once, smoke it, then run exactly one clean natural 15–20 turn acceptance session using only the disposable TEST game. Preserve the first material failure and STOP. Do not start Cut 3.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Accepted smoke terminal: Issue #68 comment `5319544131`
- Accepted smoke final SHA: `ca7481851510de89d9d1e5aa78e8e393a25cd5f7`
- Accepted smoke final CURRENT_TASK blob: `37d03548734f53f1a7b967354a571567202eb5a5`
- Corrected API smoke blob: `2b0abbf57b79e9d111e9918dcc380d16f546611e`
- Corrected smoke regression blob: `c7e20da31106c3eac44c989239efbc4e048d4c50`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Accepted already-deployed API version: `2a976491-451d-4fc8-8808-65353cad137b`
- Frontend Worker: `gamebuilder-company-v1`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Last frozen frontend version before rollout: `1a3c1416-5362-4658-a8fe-465006a342dd`
- Disposable TEST game — only gameplay-mutable game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — NEVER reset/reuse: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not mutate: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected TEST sentinel/default frontend fallback — do not use as live fixture or mutate: `11111111-1111-4111-8111-111111111111`
- Production infrastructure: forbidden

Accepted TEST schema invariants:
- migration rows `27`;
- target migration `20260817000200` absent;
- bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`.

Operator-frozen TEST gameplay baseline before registration:
- protected sentinel: turns/actions/save-turn/data-turn = `18/18/18/18`;
- disposable: `11/12/11/11`;
- preserved/manual: `7/9/7/7`;
- QA: `7/7/7/7`.

Binding runtime canon:
`player literal/input -> committed context -> Story streaming -> Extract observations -> structural/provenance Commit -> durable save/history -> committed readback/UI/next Story`.

Story is narrative authority; Extract observes Story-established facts; Commit owns structure/provenance/transaction; DB owns durable state/history; frontend is presentation/readback only. No semantic hard judges, retry-until-lucky, hidden player-input rewriting, or duplicate semantic authority.

## 1. Mandatory preflight

Before any deploy/reset/gameplay write:
1. fresh-fetch and require `origin/main` exactly the frozen SHA above;
2. require this branch to be the direct descendant of accepted smoke final `ca7481851510de89d9d1e5aa78e8e393a25cd5f7`, with only this registration commit before execution;
3. prove `src/**`, content/catalog, Wrangler runtime configs, package/lock files and workflows are byte-identical to `origin/main`; accepted non-runtime divergences inherited from reviewed tasks are only the scene DB gate/manifest/test reconciliation and API smoke/test reconciliation;
4. re-read accepted scene-gate and API-smoke terminals; do not modify those reviewed repairs;
5. fresh-read TEST migration/function/ACL invariants and both migration canonicals; require exact accepted values;
6. run corrected action Stage B + scene Stage B gates against live TEST read-only; require PASS including the four non-persisting scene probes;
7. run full local regression, relevant script syntax/static checks and `git diff --check`; require 0 failures;
8. verify Company TEST Worker/config identity and API binding; TTS/provider/model/bindings unchanged;
9. verify current API Worker is still accepted version `2a976491-451d-4fc8-8808-65353cad137b` if tooling can prove it. If version metadata cannot be independently read, do not redeploy merely for proof;
10. invoke the corrected API smoke once, read-only, with explicit disposable game ID. Require health/version/context PASS before frontend deploy;
11. freeze current frontend deployment/version ID and TEST row/action/turn evidence for disposable, preserved/manual, QA, and protected sentinel rows.

Any mismatch: terminal `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V3`, no frontend deploy/gameplay.

Forbidden in preflight: API redeploy, DB/schema/migration-history write, reset/live gameplay, Production infrastructure access/change.

## 2. Controlled TEST frontend deployment

API redeploy is forbidden in this task. The API already passed the corrected current-canon smoke.

Deploy exactly `wrangler.frontend.jsonc` once to `gamebuilder-company-v1` using the repository deployment path.

Requirements:
- deployed frontend asset tree must come from the unchanged current-main `src/frontend/pages/**` runtime tree;
- record pre/post deployment/version IDs and URL;
- at most one successful frontend deploy; ambiguous/failing deploy => STOP, no second deploy;
- run existing frontend smoke once and require PASS;
- verify the deployed frontend points to `https://game-proxy-company-v1.zeroslove.workers.dev`;
- do not edit frontend/config merely to make smoke pass.

The public config currently has a protected sentinel fallback. Do not use that fallback for acceptance. All live acceptance access must explicitly select `?game=2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, and the resolved client/API game identity must be proven to equal the disposable game before any reset or turn write.

## 3. Disposable TEST game preparation

Only `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` may be mutated.

- capture its pre-state first;
- because it currently has committed history, obtain a clean Opening through the existing TEST-safe application reset path exactly once;
- after reset, verify committed turn/history/action state matches the product reset contract before proceeding;
- never reset/reuse preserved/manual, QA, or protected sentinel rows;
- no direct SQL fabrication of gameplay rows;
- use normal TEST application API/RPC flows only;
- live transcript/evidence must remain outside the repo.

Reset failure or ambiguous identity => BLOCKED; do not perform a second reset.

## 4. Exactly one natural 15–20 turn live session

After frontend deploy/smoke and the one disposable reset, run one and only one coherent player-style session, including setup/Opening. Commit at least 15 turns and stop by 20. Do not retry a bad run or start a replacement session merely to obtain better provider output.

Use the actual Company TEST API/product flow. Existing diagnostic/canary helpers may be used only as helpers; do not modify them in this task and do not replace the required 15–20 turn natural session with a 1–3 turn canary.

Required coverage in that single session:
1. **Opening/choices:** setup and Opening complete; exactly four choices resolve; click at least one returned choice and prove reserved/Story/committed input equals the clicked literal exactly.
2. **Free-text agency:** multiple natural inputs; Story may refuse/fail/partially satisfy but may not silently replace the requested action with a materially unrelated action.
3. **Workplace continuity:** ordinary company/work narrative progresses without durable `work_hook`/`scene_goal` semantic authority reappearing.
4. **Movement/handoff:** registered-location movement plus same-location focal/cast handoff; speaker must not create false presence; a known requested NPC must not be replaced by invented/wrong identity.
5. **CSA exact scope:** exercise an applicable clothing-state CSA at exact target/scope, then an unrelated action; no spurious reapplication. Institutional compliance remains separate from comfort/consent/affection/trust/arousal.
6. **Adult physical continuity:** include a natural adult intimate/physical progression sufficient to inspect clothing/physical continuity. Input is intent/attempt, not automatic durable success; durable changes require Story-grounded or narrowly-authorized evidence.
7. **Sidecars:** reaction/media/TTS/image sidecars may present but may not become semantic authority; missing media must not block Story/Commit.
8. **>6-turn memory:** continue well beyond turn 6; inspect `game_turns.turn_summary`, summary projection and context continuity for empty/stale/mojibake/continuity-cliff behavior. Any defect claim requires exact turn evidence.
9. **Refresh/recovery:** after a committed mid/late turn, discard client/session state, refetch committed context/history using the same explicit disposable game ID, then continue. Recovery must come from committed server state.
10. **Streaming/transaction:** every committed turn has Story stream progress and one terminal result; no duplicate commit, dropped commit, stuck pending action, missing action, or history divergence.

For every turn preserve externally: turn number, exact input/click literal, key Story result, terminal status, committed input/action, scene/focal/present NPCs, choice count, relevant CSA/physical deltas, summary state, warnings/errors.

A provider transient error is evidence. Do not retry-until-lucky. Only a deterministic recovery action that the normal product explicitly requires may be used, and it remains part of the same recorded session.

## 5. Acceptance classification

### P0 blocker
Production infrastructure access/change; migration/history corruption; mutation outside disposable TEST game; duplicate/dropped commit; unrecoverable durable state; Worker/game identity mismatch.

### P1 blocker
Material player-input rewrite; wrong/invented NPC identity; stale `work_hook`/`scene_goal` authority returning; scene/cast/speaker divergence; CSA scope leakage or rule/consent conflation; durable physical success from input intent without Story evidence; material >6-turn memory/summary continuity failure; refresh/recovery state loss; Story streaming blocked by semantic/presentation gate; API/frontend runtime/config mismatch.

### P2 note
Purely cosmetic/presentation issue with no authority/state/streaming/input/continuity/recovery impact. Record only; do not patch.

## 6. Post-session verification

After the one session:
- re-run action + scene Stage B gates read-only and require PASS;
- recheck migration rows, target absence, both canonicals and accepted bridge/scene function metadata;
- prove preserved/manual, QA and protected sentinel rows unchanged from the frozen baseline;
- reconcile disposable committed turns/actions/history with the captured per-turn evidence and one authorized reset;
- record API/frontend deployment IDs, API/frontend smoke results, reset count and live-session count.

Do not repair defects in this task.

## 7. Repository scope and prohibitions

After registration, repository changes are limited to `docs/ops/CURRENT_TASK.md` lifecycle/terminal evidence. No source/runtime/script/config/content/test/package/workflow changes.

Forbidden:
- API redeploy;
- Production infrastructure access/change/deploy/reset/gameplay/migration;
- hospital/v2 access;
- `supabase db push`, migration repair/history mutation/replay;
- schema changes;
- provider/model/TTS/binding changes;
- gate weakening/skipping;
- more than one frontend deploy;
- more than one disposable reset;
- multiple live sessions or retry-until-lucky;
- mutation/reset of preserved/manual, QA, or protected sentinel games;
- Cut 3 or unrelated work.

## 8. Terminal classification

Choose exactly one:

### `TEST_RUNTIME_LIVE_ACCEPTED_V3`
Only if all preflight checks pass, corrected API smoke passes, exactly one frontend deploy + smoke passes, exactly one disposable reset yields clean setup/Opening, exactly one 15–20 turn session completes with at least 15 committed turns and all required coverage, no unresolved P0/P1 exists, post-session DB/gate invariants pass, protected rows remain unchanged, and Production infrastructure access/change is zero.

### `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V3`
For any preflight/deploy/smoke/reset/session/post-check failure, P0/P1 defect, provider/runtime ambiguity, or evidence uncertainty. Preserve exact failing game/turn evidence. Do not reset away the failure, patch source, redeploy, or run a replacement session.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, pre/post Worker IDs, smoke results, reset/session counts, per-coverage verdicts, exact failed turn(s) if any, post-session gate/migration evidence, protected-game invariants, safety counts and terminal classification;
3. STOP. Do not start Cut 3 or create another task.

## 9. Execution evidence — BLOCKED

- Execution lease: Issue #68 comment `5319659300`.
- Starting SHA / registration SHA: `c0649be4f4317c077e97664bc30bdc17485005cb`.
- Starting CURRENT_TASK blob: `ea9b9f5b6f6038219079fcc33c7ac8f2307fa349`.
- Preflight: `origin/main` exact; branch descended directly from accepted smoke final; runtime/config/content/test/package/workflow trees unchanged from origin/main except inherited reviewed docs/task history; action Stage B and scene Stage B gates PASS; full regression `329/329` PASS; syntax checks and `git diff --check` PASS; frozen-main CI PASS; TEST secrets/config identity PASS.
- API pre/post Worker: accepted version `2a976491-451d-4fc8-8808-65353cad137b`; API redeploy `0`; corrected API smoke PASSed exactly once before frontend deployment.
- Frontend pre Worker version: `1a3c1416-5362-4658-a8fe-465006a342dd`.
- Frontend deploy: PASS exactly once, `gamebuilder-company-v1`, post version `d3c1bb47-e779-431e-a0ac-98eb513561c6`, URL `https://gamebuilder-company-v1.zeroslove.workers.dev`.
- Frontend smoke: FAILED on its single invocation at `https://gamebuilder-company-v1.zeroslove.workers.dev/narrative.js`, HTTP `404`, `error_code=unexpected_status`.
- Game preparation/session: disposable game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; reset `0`; live sessions `0`; committed turns in this execution `0`. No reset was attempted after the frontend smoke failure.
- Coverage: Opening/choices, literal input, free-text agency, workplace continuity, movement/handoff, CSA scope, adult physical continuity, sidecars, >6-turn memory/summary, refresh/recovery, and streaming/transaction health: NOT RUN; frontend smoke blocked before reset/live gameplay. Failed turn(s): none. Failed gate: frontend `/narrative.js` 404.
- Pre-session TEST invariants: migration rows `27`; target `20260817000200` absent; bridge `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`; forensic `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`; protected `18/18/18/18`; disposable `11/12/11/11`; preserved/manual `7/9/7/7`; QA `7/7/7/7`; accepted function metadata matched. Post-session checks not run because no session began.
- Safety: DB/schema/migration/history writes `0`; migration apply/push/repair `0`; API redeploy `0`; frontend deploy `1`; TEST reset/live gameplay `0`; Production access/change `0`; preserved/manual, QA, and protected mutation `0`; source/runtime/script/config/content/test/package/workflow changes `0`.

Terminal classification: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V3`.
STOP. Preserve the frontend smoke 404; do not retry, redeploy, reset the game, patch source, run a replacement session, or start another task/Cut.

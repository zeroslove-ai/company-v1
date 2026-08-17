# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-runtime-live-acceptance-v2
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Resume the TEST-only rollout/live acceptance that previously stopped before deployment on a stale scene contract gate. The gate has now been reconciled to current canon and independently reviewed. Deploy the unchanged current-main runtime to the Company TEST Workers, smoke both Workers, then run exactly one natural 15–20 turn player-style live acceptance session on the disposable TEST game. Preserve exact failure evidence and STOP. Do not start Cut 3.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Accepted gate terminal: Issue #68 comment `5319202426`
- Accepted gate final SHA: `0c4296fa6b6de27c68e4341ffae9c8caef28dd4b`
- Accepted gate final CURRENT_TASK blob: `50744e7b82b66b6540f4793633da7c603d08e751`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- Frontend Worker: `gamebuilder-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — NEVER reset/reuse: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not reuse: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Production sentinel — forbidden: `11111111-1111-4111-8111-111111111111`

Accepted TEST schema invariants:
- migration rows `27`; target `20260817000200` absent;
- bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`;
- `company_validate_scene_v1(jsonb,boolean)` MD5 `e982167db59fc5be1447b8866dd35a65`, SECURITY INVOKER, no proconfig, no service-role EXECUTE;
- `company_bootstrap_scene_v1(jsonb)` MD5 `57b28451f9baaaba13e760b644eb38e3`, SECURITY DEFINER, `search_path=public, pg_temp`, no service-role EXECUTE;
- `validate_company_save_v1(jsonb)` MD5 `d9a165eb01ee70cf92b63e7935e44f1b`, SECURITY DEFINER, safe search_path, service-role EXECUTE;
- `reset_company_game(uuid,text)` MD5 `ebc2957fdf9e9a7eaf6c48d9a1e9604b`, SECURITY DEFINER, safe search_path, service-role EXECUTE.

Corrected scene Stage B live probes must remain true:
- `canonical_narrow_scene_accepted`
- `canonical_scene_missing_required_key_rejected`
- `canonical_save_without_legacy_scene_mirrors_accepted`
- `legacy_only_save_rejected`

Binding runtime canon:
`player literal/input -> committed context -> Story streaming -> Extract observations -> structural/provenance Commit -> durable save/history -> committed readback/UI/next Story`.

Story is narrative authority; Extract observes Story-established facts; Commit owns structure/provenance/transaction; DB owns durable state/history; frontend is presentation/readback only. No semantic hard judges, retry-until-lucky, hidden player-input rewriting, or duplicate semantic authority.

## 1. Mandatory preflight

Before any deployment/gameplay write:
1. fresh-fetch and require `origin/main` exactly the SHA above;
2. require this branch to be the direct descendant of `0c4296fa6b6de27c68e4341ffae9c8caef28dd4b`, with only this registration before execution;
3. prove `src/**`, content/catalog, Wrangler runtime configs, package/lock files and workflows are byte-identical to `origin/main`; the only accepted non-doc divergence from main is the reviewed gate repair in `scripts/company-db-contract-gate.mjs`, `config/company-v1-scene-db-contract.json`, and `test/db-contract-gate.test.mjs`;
4. re-read terminal `5319202426` and do not modify the accepted gate repair;
5. fresh-read TEST migration/function/ACL invariants and both migration canonicals; require exact accepted values;
6. run corrected action Stage B + scene Stage B gates against live TEST in read-only mode; both must PASS with the four real non-persisting scene probes above;
7. verify TEST project/Worker names/config bindings exactly; TTS service `fancy-dust-7f8c` unchanged;
8. verify required deploy credentials/secrets exist without printing values;
9. run full local regression, changed-script syntax/static checks and `git diff --check`; require 0 failures;
10. verify frozen-main CI is successful; do not create runtime commits to obtain CI;
11. freeze current API/frontend deployment/version IDs;
12. freeze pre-session DB evidence for disposable/preserved/QA/Production-sentinel games.

Any mismatch: terminal `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V2`, no deployment.

Forbidden in preflight: DB/schema/migration-history write, migration apply/push/repair, TEST reset/live gameplay, Production.

## 2. Controlled TEST deployment

### API
Use the repository gated deploy path with action Stage B and scene Stage B explicitly enabled. Deploy exactly `wrangler.api.jsonc` to `game-proxy-company-v1`.

Requirements:
- TEST Supabase only;
- no provider/model/TTS/binding/secret/config changes;
- no gate bypass;
- record deployment/version ID and URL;
- at most one successful API deploy;
- ambiguous/failing deploy => STOP, no second deploy.

Run existing API smoke immediately and require PASS before frontend deploy/live gameplay.

### Frontend
Deploy exactly `wrangler.frontend.jsonc` to `gamebuilder-company-v1`.

Requirements:
- record deployment/version ID and URL;
- at most one successful frontend deploy;
- run existing frontend smoke and verify Company TEST API/experience;
- do not edit frontend to make smoke pass.

Deploy/smoke failure => BLOCKED. No redeploy-to-pass.

## 3. Disposable TEST game preparation

Only `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` may be mutated.

- capture its pre-state first;
- if a clean Opening is required, use the existing TEST-safe application reset path exactly once;
- never reset/reuse preserved/manual game;
- never mutate QA or Production-sentinel games;
- no direct SQL fabrication of gameplay rows;
- use normal TEST application API/RPC flows;
- live transcript/evidence stays outside the repo.

## 4. Exactly one natural 15–20 turn live session

After deploy/smokes, run one and only one coherent player-style session, including Opening/setup. Commit at least 15 turns and stop by 20. Do not retry a bad run or replay turns merely to obtain nicer provider output.

Required coverage in that single session:
1. **Opening/choices:** Opening streams/completes; exactly four choices resolve; click at least one returned choice and prove committed/Story input equals the clicked literal exactly.
2. **Free-text agency:** multiple natural inputs; Story may refuse/fail/partially satisfy, but may not silently replace the requested action with a materially unrelated action.
3. **Workplace continuity:** ordinary company/work narrative works without durable `work_hook`/`scene_goal` semantic authority reappearing.
4. **Movement/handoff:** registered-location movement plus same-location focal/cast handoff; speaker must not create false presence; known requested NPC must not be replaced by invented/wrong identity.
5. **CSA scope:** exercise an applicable clothing-state CSA at exact target/scope, then an unrelated action; no spurious reapplication. Compliance remains separate from comfort/consent/affection/trust/arousal.
6. **Adult physical continuity:** include a natural adult intimate/physical progression sufficient to inspect clothing and physical continuity. Input is intent/attempt, not automatic durable success; durable changes require Story-grounded or narrowly authorized evidence.
7. **Sidecars:** reaction/media/TTS/image sidecars may present but cannot become semantic authority; missing media must not block Story/Commit.
8. **>6-turn memory:** continue well past turn 6; inspect `game_turns.turn_summary`, recent/overall summary projection, and context continuity for empty/stale/mojibake/continuity-cliff behavior. Any defect claim needs exact turn evidence.
9. **Refresh/recovery:** after a committed mid/late turn, discard client/session state, refetch committed context/history and continue the same game; recovery must come from committed server state.
10. **Streaming/transaction:** every committed turn shows Story stream progress and one terminal result; no duplicate commit, missing action, stuck pending turn, or history divergence.

For each turn preserve externally: turn number, exact input/click literal, key Story result, terminal status, committed input/action, scene/focal/present NPCs, choice count, relevant CSA/physical deltas, summary state, warnings/errors.

A provider transient error is evidence. Do not retry-until-lucky. Only a deterministic product recovery action explicitly required by normal product behavior may be exercised and must remain part of the recorded same session.

## 5. Acceptance classification

### P0 blocker
Production access/change; migration/history corruption; mutation outside disposable TEST game; duplicate/dropped commit; unrecoverable durable state; Worker identity mismatch.

### P1 blocker
Material player-input rewrite; wrong/invented NPC identity; stale `work_hook`/`scene_goal` authority returning; scene/cast/speaker divergence; CSA scope leakage or rule/consent conflation; durable physical success from input intent without Story evidence; material >6-turn memory/summary continuity failure; refresh/recovery state loss; Story streaming blocked by semantic/presentation gate; API/frontend runtime/config mismatch.

### P2 note
Purely cosmetic/presentation issue with no authority/state/streaming/input/continuity/recovery impact. Record only; do not patch.

## 6. Post-session verification

After the one session:
- re-run action + scene Stage B gates read-only and require PASS;
- recheck migration rows, target absence, both canonicals and accepted scene/bridge function metadata;
- prove preserved/manual, QA and Production-sentinel games unchanged;
- reconcile disposable game committed turns/actions/history with the captured per-turn evidence;
- record API/frontend deployment IDs and smoke results.

Do not repair defects in this task.

## 7. Repository scope and prohibitions

After registration, repository changes are limited to `docs/ops/CURRENT_TASK.md` lifecycle/terminal evidence. No source/runtime/config/content/test/package/workflow changes.

Forbidden:
- Production access/change/deploy/reset/gameplay/migration;
- hospital/v2 access;
- `supabase db push`, migration repair/history mutation/replay;
- schema changes;
- provider/model/TTS changes;
- gate weakening/skipping;
- multiple live sessions or retry-until-lucky;
- reset/reuse of preserved/manual game;
- Cut 3 or unrelated work.

## 8. Terminal classification

Choose exactly one:

### `TEST_RUNTIME_LIVE_ACCEPTED_V2`
Only if all preflight checks pass, API+frontend deploy/smokes pass, exactly one 15–20 turn session completes with at least 15 committed turns and all required coverage, no unresolved P0/P1 exists, post-session DB/gate invariants pass, and Production access/change is zero.

### `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V2`
For any preflight/deploy/smoke/session/post-check failure, P0/P1 defect, provider/runtime ambiguity, or evidence uncertainty. Preserve the exact failing game/turn evidence. Do not reset away the failure, patch source, redeploy, or run a replacement session.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, pre/post Worker IDs, smoke results, game/reset/session counts, per-coverage verdicts, exact failed turn(s) if any, post-session gate/migration evidence, safety counts and terminal classification;
3. STOP. Do not start Cut 3 or create another task.

## 9. Execution evidence — BLOCKED

- Execution lease: Issue #68 comment `5319362207`.
- Starting SHA / registration SHA: `4700733a83613724f9129e4c342198f4fe4f6252`.
- Starting CURRENT_TASK blob: `bdc2e688397c73b2d57f02ec577855559eb4fb91`.
- Preflight: `origin/main` exact; branch ancestry and docs-only registration exact; runtime/config/content/test/package/workflow scope unchanged; corrected action Stage B PASS; corrected scene Stage B PASS; frozen TEST invariants PASS; full regression `320/320` PASS; syntax checks PASS; `git diff --check` PASS; frozen CI PASS; pre-deploy API version `761a01bb-8cca-47ad-afde-87c0ba85c01d`; pre-deploy frontend version `1a3c1416-5362-4658-a8fe-465006a342dd`.
- API TEST deploy: PASS, `game-proxy-company-v1`, version `2a976491-451d-4fc8-8808-65353cad137b`, URL `https://game-proxy-company-v1.zeroslove.workers.dev`.
- API smoke: FAILED immediately at `/api/context`; HTTP status `200`, error `unexpected_context_payload` from `scripts/smoke-api-worker.mjs`.
- Frontend deploy/smoke: NOT RUN because the required API smoke gate failed.
- Game session: disposable game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; reset `0`; live sessions `0`; committed turns `0`; no gameplay mutation in this execution. Preserved/manual, QA, and Production-sentinel games were not touched.
- Coverage: Opening/choices, literal input, workplace continuity, movement/handoff, CSA scope, adult physical continuity, sidecars, >6-turn continuity, refresh/recovery, and streaming/transaction health: NOT RUN; deployment acceptance was blocked before frontend/live gameplay.
- Safety: DB/schema/migration-history writes `0`; migration apply/push/repair `0`; TEST gameplay writes `0`; frontend deploy `0`; Production access/change/deploy `0`; source/runtime/config/content/test/package/workflow edits `0`.

Terminal classification: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V2`.
STOP. Preserve the API smoke failure; do not retry, redeploy, reset the game, or start another task/Cut.

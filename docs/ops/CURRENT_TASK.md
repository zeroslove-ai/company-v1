# Company v1 — CURRENT TASK

Status: READY
Task ID: test-runtime-live-acceptance-v5
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Run one fresh Company TEST runtime/live acceptance after the Extract scene-evidence round-trip repair has been deployed and smoke-verified. Preserve the previous failed turn-6 action as forensic evidence until the authorized disposable reset, then reset only the disposable TEST game exactly once and run exactly one coherent 15–20 committed-turn natural session. Stop at the first P0/P1 or material ambiguity. Do not redeploy either Worker, patch source, retry-until-lucky, merge, or start Cut 3.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `extract-scene-evidence-test-api-deploy-v1`
- Previous STARTED: Issue #68 comment `5320357290`
- Previous terminal: Issue #68 comment `5320466301`
- Previous terminal: `EXTRACT_SCENE_EVIDENCE_TEST_API_DEPLOYED`
- Previous final SHA: `b7b7fd13407b8b136dac8d4c0075172c64fae92c`
- Previous final CURRENT_TASK blob: `b07e7dfd43596bb711d73e133f1420f0d6a0338c`
- Reviewed runtime repair SHA: `d8fbc5cca47b62e897adc73afc816812f736316b`
- Expected branch: `company/test-runtime-live-acceptance-v5`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Accepted deployed API version: `a01aea11-e828-4d81-bd5d-06f9cf1ec39f`
- Frontend Worker: `gamebuilder-company-v1`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Accepted deployed frontend version: `d3c1bb47-e779-431e-a0ac-98eb513561c6`
- Disposable TEST game — only gameplay-mutable game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — NEVER reset/reuse/mutate: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not mutate: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected sentinel/default frontend fallback — do not use as live fixture or mutate: `11111111-1111-4111-8111-111111111111`
- Production and hospital/v2: forbidden

Accepted TEST snapshot before registration:
- migration rows `27`;
- target migration `20260817000200` absent;
- disposable `save/turns/actions/committed_turn = 1/5/6/5`;
- preserved/manual `1/7/9/7`;
- QA `1/7/7/7`;
- protected sentinel `1/18/18/18`.

Previous failed action is forensic evidence until the one authorized reset:
- action `72cc2486-cc80-408c-9d86-8196cab7b6ad`;
- `processing_status=committing`, `expected_turn=6`;
- no durable turn 6;
- Story/Extract completed but old deployed Commit rejected current `kind:"scene"` evidence because of obsolete `scene_id` expectation.
Do not retry, complete, patch, or directly mutate that action. Capture its pre-reset state, then let the normal disposable reset clear the disposable game as a whole.

Binding runtime canon:
`literal player input -> minimal committed context -> Story raw streaming -> narrow Extract observation -> structural/provenance Commit -> game_save + game_turns -> committed readback/next Story`.

## 1. Mandatory preflight — read-only

Before reset/gameplay:
1. fresh-fetch and require `origin/main` exactly the frozen SHA above;
2. require this branch to descend directly from previous final `b7b7fd13407b8b136dac8d4c0075172c64fae92c` with only the registration commit before execution;
3. require no source/runtime/frontend/content/config/script/test/package/workflow edits after registration; only `docs/ops/CURRENT_TASK.md` lifecycle evidence may change;
4. re-read terminals `5320466301`, `5320266879`, and the v4 blocked terminal `5320067594`;
5. prove runtime lineage includes reviewed repair `d8fbc5cca47b62e897adc73afc816812f736316b` and the current-vs-historical V2 boundary is unchanged;
6. run focused Extract contract tests, full `npm.cmd test`, changed-file syntax/static checks, and `git diff --check`; require zero failures;
7. run corrected action Stage B and scene Stage B DB gates read-only; require PASS;
8. fresh-read TEST and require migration/game/action snapshot exactly as frozen above, including the stuck action and no durable turn 6;
9. verify API/frontend identity is Company v1 and current deployed versions remain the accepted versions where tooling exposes version metadata; absence of metadata is not authorization to redeploy;
10. corrected API smoke may run at most once read-only with explicit disposable game ID; corrected frontend smoke may run at most once read-only. If run, each must PASS; no retry.

Any unexplained drift, gate/test/smoke failure, Worker/game identity ambiguity, or source drift => terminal `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V5` with reset/session counts zero. No deployment or patch.

## 2. No deployment

- API deploy/redeploy: forbidden.
- Frontend deploy/redeploy: forbidden.
- Current accepted API is already deployed with the repair and passed corrected smoke in terminal `5320466301`.
- Current frontend is unchanged and already accepted.
- Any mismatch is a blocker, not permission to redeploy.

## 3. Explicit disposable binding + exactly one reset

Before mutation use the frontend only with explicit binding:
`https://gamebuilder-company-v1.zeroslove.workers.dev/?game=2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Prove reset/gameplay requests resolve to this UUID and never rely on the public default sentinel.

Then:
1. preserve the stuck action/count snapshot once more;
2. reset only the disposable game exactly once through the normal TEST-safe application reset path;
3. no direct SQL/DML reset or fabricated gameplay state;
4. verify post-reset canonical save/setup path is clean: committed turn 0, zero committed execution turns, no stale pending/committing action, canonical save valid;
5. verify preserved/manual, QA and sentinel remain unchanged.

If reset or identity proof fails: STOP. No second reset.

## 4. Exactly one coherent 15–20 committed-turn live session

After reset, run exactly one natural player-style session through the normal public product/API flow. Setup + Opening are part of the same session. Commit at least 15 and at most 20 gameplay turns.

No second session, no second reset, no retry-until-lucky, no replay of a provider result merely to obtain a better outcome. At the first P0/P1 or materially ambiguous failure preserve exact evidence and STOP.

For each committed turn preserve outside the repo: turn number, exact player input/clicked literal, reserved/Story/committed input identity, Story stream start/progress/end, action ID/status, key Story outcome, scene location/present/focal/last speaker, returned choices, relevant CSA/physical/clothing state, turn_summary/memory evidence, warnings/errors/recovery.

### Required coverage

1. **Setup / Opening / literal choice**
   - setup succeeds once;
   - Opening exposes exactly four usable choices;
   - select at least one displayed choice;
   - displayed literal == reserved `player_action` == Story input == committed player action exactly.

2. **Free-text player agency**
   - multiple natural free-text turns;
   - Story may refuse/partially satisfy/fail, but may not silently replace actor/target/material action;
   - input remains intent/attempt, not automatic durable success evidence.

3. **Workplace continuity**
   - several ordinary company-context turns;
   - company setting may matter naturally, but superseded `work_hook`, scene goal/focus-thread or equivalent hidden narrative authority must not reappear.

4. **Movement + same-location handoff**
   - at least one registered-location movement;
   - at least one same-location focal/cast handoff;
   - no wrong/invented registered NPC substitution;
   - speaker alone must not imply destination presence across a movement boundary.

5. **Repair-specific scene-evidence proof**
   - obtain at least one successful committed turn whose current V2 persisted Extract contains `scene_observation.location_id` plus exact `kind:"scene"` evidence;
   - evidence location must match observation location and quote must be exact Story text;
   - that action must pass persisted reread/Commit and produce exactly one durable turn;
   - no current `scene_id` may be required or manufactured.
   If normal gameplay never emits such evidence by turn 20, classify acceptance blocked/ambiguous rather than claiming the repaired live path was proven.

6. **CSA exact scope**
   - exercise at least one applicable supported CSA naturally, including clothing-state effect if available;
   - follow with unrelated action;
   - no scope leakage or conflation of institutional compliance with comfort/consent/affection/trust/romance/arousal.

7. **Adult physical/clothing continuity**
   - where naturally arising, inspect physical/clothing continuity across adjacent turns;
   - player input alone cannot create durable successful physical state;
   - durable state must be Story/exact-evidence grounded or the narrow authorized structured clothing-state CSA sync.

8. **Sidecar non-authority**
   - TTS/image/media/reaction sidecars may succeed/fail/be absent but must not block Story/Extract/Commit or become gameplay authority.

9. **Memory beyond recent-six window**
   - continue materially beyond turn 6;
   - inspect turn 7+ `turn_summary`, server context summary/memory projection, and continuity;
   - no empty/stale/mojibake summary causing a material continuity cliff.

10. **Refresh/recovery**
   - after a committed mid/late turn, discard local/session state and refetch committed context/history using explicit disposable game ID;
   - continue from server state without duplicate/lost turn, stale pending action, or client-only semantic authority.

11. **Streaming + transaction integrity**
   - raw Story streaming visibly progresses before completion;
   - lifecycle remains reserve -> Story -> Extract -> Commit;
   - exactly one committed turn per successful action;
   - no duplicate/lost commit, gate deadlock, or sidecar-blocked turn.

## 5. Blocking classification

### P0 — immediate blocker
- Production/hospital access/change;
- wrong game mutated or protected/preserved/QA mutation;
- migration/schema/history corruption;
- Worker/game identity mismatch;
- duplicate/lost durable turn or invalid canonical save.

### P1 — blocker
- material literal player-input rewrite;
- wrong/invented NPC identity or material scene/cast/speaker divergence;
- repaired current scene-evidence path still fails Commit or requires `scene_id`;
- CSA scope leakage or compliance/consent/affection conflation;
- durable physical success inferred directly from intent without valid evidence;
- material >6-turn summary/memory continuity loss;
- refresh/recovery loses committed authority;
- Story streaming blocked by semantic/presentation sidecar gate;
- material runtime/config mismatch.

### P2 — note only
Pure presentation/cosmetic defects with no gameplay/state/input/streaming/continuity/recovery authority impact. Record; do not patch.

On first P0/P1 or material ambiguity: STOP immediately. No source patch, redeploy, second reset, replacement session, or retry-to-pass.

## 6. Post-session read-only verification

If the session reaches the acceptance stop:
- rerun action + scene Stage B gates and require PASS;
- migration rows remain 27 and target absent;
- preserved/manual, QA and sentinel remain unchanged;
- reconcile disposable committed turn, `game_turns`, completed/committed actions and canonical save;
- no unexplained orphan pending/committing/duplicate action remains;
- inspect literal choice/free-text round trips and repair-specific scene-evidence commit evidence;
- inspect turn 7+ summary/memory evidence;
- API/frontend versions remain accepted;
- API/frontend deploy counts remain 0 in this task;
- reset count exactly 1, live-session count exactly 1;
- DB schema/migration/history writes 0; Production/hospital 0.

## 7. Repository scope / hard prohibitions

After registration only `docs/ops/CURRENT_TASK.md` may change for lifecycle evidence.

Forbidden: source/runtime/frontend/content/config/script/test/package/workflow edits; API/frontend deploy; migration/schema/RPC writes; direct gameplay DML; provider/model/TTS/binding changes; gate weakening; more than one reset/session; protected/preserved/QA mutation; PR/merge; Cut 3; Production/hospital/v2.

## 8. Terminal

Choose exactly one:

### `TEST_RUNTIME_LIVE_ACCEPTED_V5`
Only if preflight passes, no deploy occurs, exactly one disposable reset succeeds, exactly one coherent session commits 15–20 turns, all required coverage including repair-specific current scene-evidence Commit proof is satisfied, no unresolved P0/P1 exists, post-check reconciles, and all protected/safety invariants hold.

### `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V5`
Use for any preflight/reset/session/post-check failure, P0/P1, repair-proof absence, provider/runtime ambiguity or evidence uncertainty. Preserve exact first blocker; no retry/repair.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, main, preflight/gates/tests/smokes, Worker versions, explicit game binding, reset/session counts, committed-turn count, per-coverage evidence, exact first blocker if any, repair-specific scene evidence proof, post DB/action/history reconciliation, summary/memory evidence, protected-game invariants and all safety counts;
3. STOP. Do not create next task, merge, deploy, patch, or start Cut 3.

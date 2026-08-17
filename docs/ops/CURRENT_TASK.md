# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-runtime-live-acceptance-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This task follows accepted terminal `5318633976` (`TEST_SINGLE_STATEMENT_BRIDGE_V2_APPLIED_VERIFIED`). The TEST schema bridge is now applied and independently verified. The prior `overnight-cut2-live-quality-loop-v1` stopped before any Worker deployment only because TEST migration lineage could not then be reconciled safely. That blocker is now resolved without migration-history repair.

This task resumes the previously owner-authorized TEST-only rollout boundary: deploy the current main runtime to the Company TEST Workers, smoke it, then run one natural 15–20 turn player-style live acceptance session on the disposable TEST game. Do not start Cut 3 in this task. Do not repair code in this task; preserve exact failure evidence and STOP if a material defect is found.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Accepted bridge terminal: `5318633976`
- Accepted bridge final SHA: `3d16d21360891b8c17972d3f49066fb2dfccc9f4`
- Accepted bridge final CURRENT_TASK blob: `6b0ae1f252a318cf9c22a3332ae62d72bfc0ee6f`
- TEST Supabase project: `fmcrspgxstsmxxsmkeee`
- TEST API Worker: `game-proxy-company-v1`
- TEST frontend Worker: `gamebuilder-company-v1`
- API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
- Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — NEVER reset/reuse: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- Production sentinel — forbidden: `11111111-1111-4111-8111-111111111111`
- QA game — do not reuse for this session: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Existing live harness default API/game must remain the Company TEST values above.

Accepted TEST schema invariants before rollout:
- migration rows = `27`;
- target migration row `20260817000200` remains absent;
- bridge-audit canonical = `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`;
- forensic canonical = `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`;
- target function definition MD5s:
  - `company_apply_opening_scene_v1` = `415242b4a452ae218c01106b35900efe`
  - `company_minimalize_save_v1` = `78547de247e2b6e8ee2a184cbf760de2`
  - `company_validate_scene_v1` = `e982167db59fc5be1447b8866dd35a65`
  - `validate_company_save_v1` = `d9a165eb01ee70cf92b63e7935e44f1b`
  - `reserve_company_player_setup` = `74a8c352c5380fc2273821695ade4908`
- service-role EXECUTE remains only on `validate_company_save_v1` and `reserve_company_player_setup` among the five target functions.

Binding runtime canon:
`player literal/input -> committed context -> Story streaming -> Extract observations -> structural/provenance Commit -> durable save/history -> committed readback/UI/next Story`.

Story is narrative authority; Extract observes Story-established facts; Commit owns structure/provenance/transaction; DB owns durable state/history; frontend is presentation/readback only. No semantic hard judges, no retry-until-lucky acceptance, no hidden player-input rewriting, no duplicate semantic authority.

## 1. Mandatory preflight — before deployment or gameplay writes

STOP `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE` before deployment if any required check fails.

1. Fresh-fetch and require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require this task branch to be the direct descendant of accepted bridge final `3d16d21360891b8c17972d3f49066fb2dfccc9f4`, with only this registration commit before execution.
3. Prove runtime/config/content/test/package/workflow trees on this branch are byte-identical to `origin/main`; only ops/audit docs may differ. Do not deploy any unreviewed runtime delta.
4. Re-read terminal `5318633976` and independently recheck the five target functions/ACLs plus both canonical migration hashes inside PostgreSQL. Require the exact accepted values from section 0.
5. Require TEST project identity exactly `fmcrspgxstsmxxsmkeee` and API Wrangler config to point to `https://fmcrspgxstsmxxsmkeee.supabase.co`.
6. Require Wrangler config names exactly `game-proxy-company-v1` and `gamebuilder-company-v1`. TTS binding/service `fancy-dust-7f8c` must not be changed.
7. Verify required deploy credentials/secrets exist without printing secret values. Missing credentials => STOP; never replace providers/models or secrets to make the run pass.
8. Run full local regression from the frozen runtime tree. Require 0 failures. Also run `git diff --check` and syntax/static checks already standard for this repository.
9. Verify current `origin/main` CI is SUCCESS for the frozen main. Do not create a new source commit merely to obtain CI.
10. Run the existing DB contract gate in read-only mode using the current TEST catalog and the strongest currently applicable action/scene stages. Do not weaken/skip a failing gate. If the existing gate is stale relative to the accepted bridge, STOP with exact gate evidence; do not patch it in this task.
11. Freeze pre-deploy Worker metadata/version identifiers if Wrangler exposes them.
12. Freeze pre-session DB evidence for the disposable TEST game and prove the preserved/manual, QA, and Production sentinel game IDs will not be touched.

No `supabase db push`, migration repair, historical migration replay, or schema mutation is authorized in this task.

## 2. Controlled TEST deployment

Deploy only the frozen current-main runtime/config tree proven in preflight.

### 2.1 API Worker

Use the repository's existing gated deployment path (`scripts/deploy-api-with-contract-gate.mjs` / `wrangler.api.jsonc`).

Requirements:
- deploy target name exactly `game-proxy-company-v1`;
- TEST Supabase only;
- do not change `STORY_MODEL`, `EXTRACT_MODEL`, provider URL, TTS worker, secrets, bindings, or config values;
- do not bypass the DB contract gate;
- record resulting Worker version/deployment ID and URL;
- if deploy fails or target identity is ambiguous, STOP; do not deploy elsewhere.

After API deployment run the existing API smoke against the TEST URL and require success before frontend deployment/live play.

### 2.2 Frontend Worker

Deploy `wrangler.frontend.jsonc` only to `gamebuilder-company-v1`.

Requirements:
- record resulting Worker version/deployment ID and URL;
- run existing frontend smoke and require that it targets/loads the Company TEST API configuration;
- streaming UI contract must remain intact; do not edit frontend in this task.

Deployment count target: at most one successful API deploy and one successful frontend deploy. Do not redeploy to chase stochastic live results.

## 3. Disposable TEST game preparation

Only `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` may be reset/reused for the live session.

- If dirty from older canary evidence, capture its current read-only state first, then use the repository's existing TEST-safe reset path exactly once as needed.
- Never reset/reuse `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- Never touch Production sentinel `11111111-1111-4111-8111-111111111111`.
- Do not use the QA game for this session.
- Do not fabricate persisted rows directly with SQL. Use normal TEST application APIs/RPC flows.
- Keep all transcript/report artifacts outside the repository or in the already-approved evidence mechanism; do not commit generated live transcript dumps.

## 4. One natural 15–20 turn live acceptance session

Run exactly one player-style session after deployment. No stochastic retry, no second clean run to replace a bad run, and no cherry-picking provider output.

The session must commit at least 15 turns and may stop at 20. Opening/setup is part of the same session. Use a realistic adult player profile and natural actions rather than synthetic one-word probes.

Required coverage across the single session:

1. **Opening / choices**
   - opening completes and streams;
   - canonical choices resolve to exactly four, including deterministic fallback if provider choices are absent;
   - click at least one returned choice and prove the exact clicked literal is the reserved/Story input, without silent paraphrase.
2. **Free-text literal fidelity / player agency**
   - submit multiple free-text actions;
   - Story may determine outcome but must not silently replace the requested action with an unrelated action;
   - refusal/partial success is allowed when narratively justified; hidden rewrite is not.
3. **Workplace continuity**
   - cover ordinary company/work agenda behavior so removed work-hook semantic authority does not break normal workplace narrative;
   - no stale `work_hook`/`scene_goal` durable authority should reappear.
4. **Movement / scene / handoff**
   - perform exact registered-location movement;
   - test same-location focal/cast handoff;
   - speaker identity must not create false destination presence;
   - no wrong NPC generated in place of the requested known NPC.
5. **CSA scope and state**
   - exercise an applicable clothing-state CSA on its exact target/scope;
   - later perform an unrelated action and prove it does not spuriously reapply that CSA;
   - rule compliance must remain separate from consent/comfort/affection/trust/arousal.
6. **Adult intimate / physical progression**
   - include a natural adult intimate progression sufficient to observe player/NPC physical continuity, clothing state, body canon, and player sexual mechanics;
   - player input remains intent/attempt, not automatic durable success;
   - only Story-grounded or narrowly authorized structured evidence may change durable physical state.
7. **Presentation sidecars**
   - reaction/media/TTS/image sidecars may present but must not become semantic gameplay authority;
   - missing media must not block Story/Commit.
8. **Longer-context continuity**
   - pass turn 6 and continue sufficiently to inspect older-turn summary/memory behavior;
   - check `game_turns.turn_summary`, recent/overall summary projection, and context continuity for empty/stale/mojibake regressions;
   - do not claim a continuity failure without exact turn evidence.
9. **Refresh/recovery**
   - after a committed mid/late turn, simulate refresh/recovery by discarding client/session state, refetching committed context/history, then continue the same game;
   - committed server state/history must restore the session without frontend cache authority.
10. **Streaming and transaction health**
   - every committed turn must show Story stream progress and one terminal completion/error result;
   - no duplicate commit, missing committed action, stuck pending turn, or silent history divergence.

For each turn preserve: turn number, exact player input/clicked literal, key Story output, terminal status, committed action/input, scene/focal/present NPCs, relevant CSA/physical state deltas, choice count, summary state, and any warning/error.

Do not use a retry to obtain a nicer narrative. A provider/upstream transient failure during the sole session is evidence; classify it separately from architecture defects but do not replay that turn unless the normal product recovery contract itself explicitly requires one deterministic recovery action.

## 5. Acceptance classification

### P0 — immediate blocker
Any Production access/change, migration/history corruption, TEST data integrity break outside the disposable game, duplicate/dropped commits, or inability to recover durable state.

### P1 — live acceptance blocker
Any reproducible/current-run architecture or gameplay-authority defect, including:
- player literal silently rewritten into a materially different action;
- requested known NPC/location replaced by invented/wrong identity;
- stale semantic `work_hook`/`scene_goal` authority restored;
- scene/cast/speaker authority divergence;
- CSA scope leakage or rule/consent conflation;
- durable physical/sexual success written from input intent without Story evidence;
- >6-turn continuity broken by empty/stale/corrupt summary/context in a way that affects play;
- refresh/recovery loses or contradicts committed state;
- Story streaming blocked by a semantic gate or frontend overlay regression;
- API/frontend deployment serving mismatched runtime/config.

### P2 — non-blocking note
Purely cosmetic/presentation defects that do not affect authority, state, streaming, choice/input fidelity, continuity, or recoverability. Record them; do not patch in this task.

## 6. Terminal classification

Choose exactly one.

### `TEST_RUNTIME_LIVE_ACCEPTED`
Only if:
- all preflight checks pass;
- API + frontend TEST deployments and smokes succeed;
- exactly one natural 15–20 turn session completes with at least 15 committed turns;
- all mandatory coverage items are evidenced;
- no unresolved P0/P1 defect exists;
- migration canonicals and five-function bridge state remain unchanged after the session;
- Production access/change = 0.

### `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE`
Use for deploy/smoke/preflight failure, inability to complete the single session, any P0/P1 defect, material provider/runtime ambiguity, or evidence uncertainty.

On BLOCKED:
- preserve the exact failing game/turn and transcript evidence;
- do not reset away failure evidence after the defect;
- do not patch source/runtime/tests/config in this task;
- do not redeploy/retry to seek a passing run;
- identify the narrow likely repair domain for the next review task.

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal containing registration/final SHA/blob, pre/post Worker version IDs, smoke results, game ID/reset count, committed turn count, per-coverage verdict, exact failed turn(s) if any, bridge/migration post-check, Production safety count, and terminal classification;
3. STOP. Do not start Cut 3 or create the next task.

## 7. Hard prohibitions

- Production access/change/deploy/migration/reset/gameplay: forbidden.
- Hospital/v2 repo, Workers, Supabase: forbidden.
- `supabase db push`, migration repair, migration-history mutation, historical migration replay: forbidden.
- Any schema change beyond the already-applied accepted bridge: forbidden.
- Provider/model/TTS provider swap: forbidden.
- Runtime/source/content/test/package/workflow edits: forbidden in this acceptance task.
- New semantic gateway/judge/router/verifier/finite action grammar: forbidden.
- Reset/reuse of preserved manual game: forbidden.
- Multiple live sessions or retry-until-lucky acceptance: forbidden.
- Cut 3 implementation: forbidden until this rollout acceptance is reviewed.

`git diff --check` must PASS at terminal. Repository lifecycle change after registration is limited to `docs/ops/CURRENT_TASK.md`.

## 8. Watcher terminal stop — pre-deploy contract blocker

- Execution lease: Issue #68 comment `5318715906`; no later lease or terminal report exists for this identity.
- Preflight stopped before deployment because the existing read-only scene contract gate at `stage_b` failed against the current TEST catalog. `company_validate_scene_v1(jsonb,boolean)` was not `SECURITY DEFINER`, had no `search_path=public, pg_temp`, and the required scene behavioral-probe catalog was absent.
- Action contract gate `stage_b`: PASS. No source/runtime/config/test/package/workflow edits were made.
- Bridge post-check: migration rows `27`; target `20260817000200` absent; bridge canonical `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`; forensic canonical `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d`.
- Five target function MD5s matched the frozen values: `415242b4a452ae218c01106b35900efe`, `78547de247e2b6e8ee2a184cbf760de2`, `e982167db59fc5be1447b8866dd35a65`, `d9a165eb01ee70cf92b63e7935e44f1b`, `74a8c352c5380fc2273821695ade4908`.
- Pre-deploy Worker metadata was read-only frozen: API deployment `a7cfe371-6811-4f62-a662-53137dc7b531` / version `761a01bb-8cca-47ad-afde-87c0ba85c01d`; frontend deployment `13d98d9b-8d9e-439f-80ba-b0711f518c21` / version `1a3c1416-5362-4658-a8fe-465006a342dd`. No post-deploy IDs exist; API/frontend smokes were not run.
- Pre-session read-only counts were captured for disposable, preserved/manual, QA, and Production-sentinel games. No reset, gameplay, or live session occurred; committed turns remain `0` for this execution.
- Narrow repair domain for review: reconcile the existing TEST scene contract gate/catalog with the accepted scene function security/ACL contract and preserve behavioral-probe evidence. Do not repair it in this task.

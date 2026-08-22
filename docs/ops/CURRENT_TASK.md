# Company — CURRENT TASK

Status: READY
Task ID: company-r3-same-game-reset-test-rollout-v1
Mode: APPLY RESET MIGRATION ONCE -> DEPLOY EXACT SOURCE TO TEST -> ONE DISPOSABLE BROWSER RESET PROOF -> STOP
Updated: 2026-08-23 01:47 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, reset harness, compatibility layer, or competing execution authority.

## 0. Authority / accepted baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- capability TEST terminal `5381363356` and freeze review `5381387742`;
- reset source terminal `5381481723`;
- reset source acceptance review `5381496361`;
- exact accepted reset source `19a4c2b8d9d2d1e3fc4a93c184d4b52e785af300`;
- reset migration source `supabase/migrations/20260823000100_company_r3_same_game_reset.sql`;
- current pre-rollout TEST API `game-proxy-company-r3` version `52439f14-235f-4c1d-ac24-1ca30abc5e95`;
- current pre-rollout TEST frontend `gamebuilder-company-r3` version `50387103-1a97-4774-ac42-4368844cde58`;
- existing TEST `R3_GAME_ACCESS_SECRET` must be preserved unchanged;
- this exact CURRENT_TASK blob after registration.

Frozen areas:
- per-game capability architecture remains frozen except proving the new reset route obeys it;
- feedback revision remains frozen; do not invoke it;
- image sidecar remains deferred for missing approved media input;
- CSA7/9 remain frozen provider/model capability exceptions; do not invoke any CSA;
- no Story/Observer/reducer/provider/model/config/timeout changes.

## 1. Purpose

Make the already-reviewed same-game reset live on TEST and prove the real user-visible control once.

Expected product behavior:
- same `game_id`;
- same player profile/setup;
- same existing game capability;
- old chronology/current gameplay state removed atomically;
- state revision increases exactly once for reset;
- existing Opening path immediately creates exactly one fresh Opening;
- no setup overlay/new game/new token;
- refresh remains coherent;
- the next ordinary action commits again as Turn 1.

This is a bounded TEST rollout, not a reset/security/QA framework project.

## 2. Preflight

Before any mutation:
1. Re-read Issue #68 and this exact task; STOP if a newer competing owner/operator directive or execution lease exists.
2. Verify `main` is exact accepted reset source `19a4c2b8...` plus this docs-only registration only.
3. Verify TEST project only: `fmcrspgxstsmxxsmkeee`. Do not access Production.
4. Read the migration ledger and prove `20260823000100_company_r3_same_game_reset` is not yet applied. Also confirm the previously accepted feedback migration remains present; do not reapply/edit old migrations.
5. Verify the existing TEST Worker secret binding name `R3_GAME_ACCESS_SECRET` is still present without revealing or replacing its value.
6. Optionally rerun only the focused reset tests if needed to verify checkout identity. No broad suite ritual.

If any identity/ledger/target ambiguity exists, STOP `BLOCKED_R3_RESET_TEST_PREFLIGHT` before mutation.

## 3. Apply exactly one TEST migration

Apply only:
`20260823000100_company_r3_same_game_reset.sql`

to TEST project `fmcrspgxstsmxxsmkeee` exactly once.

After apply, verify read-only:
- migration ledger contains the reset migration once;
- `public.company_r3_reset_game(uuid, integer, jsonb)` exists;
- `SECURITY DEFINER` / expected search_path contract remains intact;
- execute is denied to `public`, `anon`, `authenticated` and allowed to `service_role` only;
- no unrelated migration/schema/RLS/policy/grant change occurred.

If migration apply fails or grants differ, STOP `BLOCKED_R3_RESET_TEST_MIGRATION`. Do not repair in the same task.

## 4. Deploy exact reviewed source to TEST

Deploy exact source `19a4c2b8d9d2d1e3fc4a93c184d4b52e785af300` to:
- TEST API `game-proxy-company-r3`;
- TEST frontend `gamebuilder-company-r3`.

Preserve the already-provisioned `R3_GAME_ACCESS_SECRET`; do not rotate/recreate/print it.

Record new API/frontend version IDs and verify public frontend/catalog health.

No Production deploy. No source patch during rollout.

## 5. Exactly one fresh disposable game

Create exactly one new disposable game through the real deployed frontend.

Record the fresh game ID. Never print/store the capability value in Issue evidence.

Initial path:
1. setup/create succeeds;
2. protected Opening completes normally;
3. submit exactly one simple human-like ordinary action through the UI, no retry/regeneration;
4. prove it commits as Turn 1;
5. capture bounded pre-reset facts only: same game ID/profile, `committed_turn=1`, current state revision, chronology Opening+Turn1.

Do not use feedback or CSA to add extra state. The ordinary turn is sufficient prior chronology for reset acceptance.

## 6. Negative reset boundary before successful reset

Using only the fresh disposable game plus one already-known disposable TEST game ID for cross-game mismatch, prove without successful mutation:
- fresh-game reset with no Authorization -> generic 401;
- malformed/wrong capability -> generic 401;
- fresh-game capability against known disposable game `6748f720-57e9-41ce-89eb-1498001e7ec9` -> generic 401 and no read/mutation of that other game;
- fresh-game valid capability with deliberately stale `expected_state_revision` -> reset rejection and unchanged fresh-game canonical context.

Do not test write denial by touching any preserved/manual game. Do not expose capability values.

If any wrong/missing/cross-game credential can reset/read protected state, STOP `BLOCKED_R3_RESET_TEST_ACCESS` immediately.

## 7. Real browser reset — exactly once

On the same fresh disposable game:
1. click the existing `초기화` / `#reset-game` control exactly once;
2. accept the single confirmation;
3. verify one authenticated `POST /api/r3/games/:game_id/reset` uses the current exact state revision;
4. verify the same reset SSE path immediately streams a fresh Opening;
5. do not manually call a second Opening endpoint after reset.

After terminal commit, verify from canonical protected context/DB readback:
- game_id is unchanged;
- player profile/setup is byte/field equivalent to pre-reset profile;
- browser capability still works and no replacement token is issued;
- old Turn1 and prior Opening chronology are gone;
- exactly one new Opening exists at turn_number 0;
- `committed_turn=0`;
- state revision = pre-reset revision + 1 exactly;
- canonical state is reset to initial setup/opening shape rather than retaining prior scene/rules/gameplay residue;
- turn jobs from prior chronology are gone;
- revision-history contains only the new Opening lineage for this disposable game;
- feedback-attempt rows for this game are absent;
- no setup overlay appears;
- no capability/token appears in URL/UI/canonical context.

Do not require Story prose to equal the original Opening text; it is a fresh provider call. Judge only structural/product coherence and reset contract.

## 8. Refresh + post-reset continuation

Refresh the same browser/game URL once.

Prove:
- same game opens with the persisted same-game capability;
- exactly the same fresh Opening/context is shown;
- no duplicate Opening is created;
- old pre-reset Turn1 does not return.

Then submit exactly one simple human-like ordinary action, no retry/regeneration.

Prove it commits as the new Turn 1 and state revision advances normally from the post-reset revision. This is the only post-reset ordinary turn.

No longer campaign is authorized.

## 9. Acceptance

GREEN only if all agree:
- reset migration applied exactly once to TEST and privilege boundary is service_role-only;
- exact reviewed source deployed to TEST API/frontend;
- one fresh disposable game only;
- Opening + pre-reset Turn1 succeeded;
- missing/wrong/cross-game/stale reset attempts did not mutate state;
- one real UI reset preserved game/profile/capability;
- old chronology was removed;
- exactly one fresh Opening exists with committed_turn 0;
- reset increments revision exactly once;
- refresh does not duplicate Opening or resurrect old chronology;
- one post-reset ordinary action commits as new Turn1;
- no source/provider/config/CSA/feedback/image/Production/preserved-game mutation occurred.

If the button/route/SQL shows a deterministic source defect, STOP `BLOCKED_R3_RESET_TEST_PRODUCT_DEFECT` with the smallest reproducible evidence. Do not patch during this task.

## 10. Forbidden

Do NOT:
- access/deploy Production;
- change or expose any secret;
- apply any migration other than the one reset migration exactly once;
- edit old migrations;
- modify source/runtime/frontend/tests/config/content during rollout;
- invoke feedback;
- invoke CSA or rerun CSA7/9;
- use preserved/manual games;
- create more than one fresh disposable game;
- retry/regenerate Story for semantic preference;
- run long gameplay;
- add auth/reset/test framework or compatibility layer;
- create a new CURRENT_TASK file or ops branch;
- overwrite CURRENT_TASK after execution.

## 11. Terminal

Post exactly one terminal comment to Issue #68 and STOP.

Success:
`STATUS: COMPLETE_R3_RESET_TEST_GREEN`

Preflight blocker:
`STATUS: BLOCKED_R3_RESET_TEST_PREFLIGHT`

Migration blocker:
`STATUS: BLOCKED_R3_RESET_TEST_MIGRATION`

Access-boundary blocker:
`STATUS: BLOCKED_R3_RESET_TEST_ACCESS`

Deterministic product/source blocker:
`STATUS: BLOCKED_R3_RESET_TEST_PRODUCT_DEFECT`

Terminal must include:
- Task ID/current task blob/execution lease;
- start/final main SHA + accepted source SHA;
- migration ledger pre/post and reset RPC privilege result;
- TEST API/frontend version IDs;
- fresh disposable game ID only, never capability/secret;
- pre-reset committed_turn/revision and Opening+Turn1 proof;
- negative reset statuses for no-auth/wrong/cross-game/stale;
- one UI reset request proof;
- post-reset same game/profile/capability, chronology count/turn numbers, committed_turn/revision proof;
- refresh proof;
- post-reset new Turn1 proof;
- confirmation no source/Production/provider/model/config/CSA/feedback/image/preserved-game mutation;
- final classification.

Then STOP. Do not choose the next task.
# Company — CURRENT TASK

Status: READY
Task ID: company-r3-post-reset-product-stability-v1
Mode: REUSE EXISTING DISPOSABLE TEST GAME -> SIX HUMAN-LIKE TURNS -> PRODUCT/AGENCY/CONTINUITY REVIEW -> STOP
Updated: 2026-08-23 02:06 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, QA framework, replay harness, or competing execution authority.

## 0. Authority / frozen baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- capability TEST freeze review `5381387742`;
- reset source acceptance `5381496361`;
- reset rollout terminal `5381578009`;
- reset rollout acceptance/freeze review `5381592085`;
- accepted executable source `19a4c2b8d9d2d1e3fc4a93c184d4b52e785af300`;
- current TEST API `game-proxy-company-r3` version `e4317d6f-9bfe-4774-a744-90789d066d4e`;
- current TEST frontend `gamebuilder-company-r3` version `e0b654d7-06e1-4851-92a3-02af5cf5ba59`;
- reset migration `20260823000100_company_r3_same_game_reset` already applied exactly once to TEST; do not reapply;
- existing disposable TEST game `58d77377-010d-4920-a2ad-a549b8e341bc` only.

Frozen:
- game capability boundary GREEN/frozen;
- same-game reset GREEN/frozen; the unavailable live stale-revision negative probe is an accepted coverage limitation, not a reopen trigger;
- feedback revision GREEN/frozen;
- image sidecar deferred until approved media input exists;
- CSA7/9 remain frozen provider/model capability exceptions; do not invoke or tune CSA;
- no provider/model/config/timeout/prompt/reducer source changes.

## 1. Purpose

Perform the owner-directed small post-correction browser/product pass, not another QA campaign.

The existing disposable game has already been reset successfully and currently has:
- fresh post-reset Opening at turn 0;
- one post-reset ordinary Turn 1 committed;
- state revision 3 at the rollout terminal;
- same game/profile/capability retained.

Continue this exact game for six additional ordinary human-like turns only, ending at committed Turn 7 if all succeed.

Goal: detect real user-visible product defects in narrative continuity, player agency, choice usability, refresh/state continuity, or deterministic transport/commit behavior after the recent capability/reset corrections.

## 2. Preflight

Before any gameplay:
1. Re-read Issue #68 and this exact task; STOP if a newer owner/operator directive or active competing lease exists.
2. Verify main is accepted source `19a4c2b8...` plus docs-only registrations; no source patch is authorized.
3. Verify TEST only; do not access Production.
4. Open only disposable game `58d77377-010d-4920-a2ad-a549b8e341bc` through the existing deployed frontend/browser capability.
5. Read canonical context and confirm expected starting shape: committed Turn 1, turns 0/1 only, no pending/failed processing job. If the exact start differs materially, STOP `BLOCKED_POST_RESET_STABILITY_PREFLIGHT` rather than resetting or repairing.

Do not create a new game and do not reset this game again.

## 3. Six-turn human-like continuation

Submit exactly six additional ordinary actions, one attempt each, no retry/regeneration for semantic preference.

Use a natural mix rather than synthetic edge-case spam:
- at least four free-text actions;
- up to two current Story-authored choices if useful;
- vary ordinary office/social behavior, movement/location, conversation/request, and personal intent/self-state/refusal naturally across the six turns;
- include enough explicit wording across the batch to exercise actor/target/action/movement/request/refusal/self-state/topic/intent fidelity, but do not force every category into every turn.

The player should behave like a person playing the game, not a test harness. Work tasks are background texture, not mandatory helpdesk flow.

For each turn record compactly:
- exact literal action submitted;
- committed turn number;
- whether Story materially preserved the explicit player actor/target/action/movement/request/refusal/self-state/topic/intent that were actually present;
- current location/presence coherence;
- whether choices were usable if present; no-tail is fail-open and free input must remain usable;
- obvious continuity break, duplicated chronology, wrong NPC identity, or stale prior-reset content if any.

Do not score prose style mechanically.

## 4. Lean semantic decision rule

Owner lean override is binding:
- one isolated provider semantic miss alone is not a global blocker;
- log it as provider variance and continue the predeclared six-turn batch unless transport/state corruption occurs;
- a repeatable material invariant failure (for example 2 or more turns showing the same player-agency substitution/contradiction) is a real blocker;
- deterministic transport/state/data corruption, duplicate commits, wrong game/capability behavior, chronology resurrection, or stuck unrecoverable job blocks immediately.

Do not tune prompts/provider/model or add guards because of a lone semantic miss.

## 5. One bounded refresh

After any committed turn between Turn 3 and Turn 6, refresh the same browser URL exactly once.

Verify:
- same game/capability resumes;
- committed chronology is unchanged and ordered once;
- no duplicate Opening/turn is created;
- no old pre-reset chronology reappears;
- current location/state/choices shown after refresh agree with canonical context.

Then continue the remaining planned turns normally.

Do not reset or reconnect by creating a new action.

## 6. Final readback

At the end, read canonical protected context/DB read-only evidence for this game and confirm:
- committed_turn is 7 if all six new turns committed;
- turns are exactly 0 through 7 once each;
- ordinary jobs for Turns 1 through 7 are committed with no extra duplicate action for this run;
- state revision advanced consistently from the starting revision;
- no pending/failed next-turn job remains;
- no pre-reset old chronology resurfaced;
- capability/token remains absent from URL/UI/canonical context.

Do not inspect or mutate unrelated games.

## 7. Acceptance / stop conditions

Success with no material defect:
`STATUS: COMPLETE_R3_POST_RESET_PRODUCT_STABILITY_GREEN`

Success with only isolated non-repeatable provider semantic variance:
`STATUS: COMPLETE_R3_POST_RESET_PRODUCT_STABILITY_WITH_PROVIDER_VARIANCE`

Real repeatable player-agency/continuity defect or deterministic transport/state defect:
`STATUS: BLOCKED_R3_POST_RESET_REAL_PRODUCT_DEFECT`

Preflight mismatch:
`STATUS: BLOCKED_POST_RESET_STABILITY_PREFLIGHT`

If blocked, provide the smallest exact reproduction and stop. Do not patch in this task.

## 8. Forbidden

Do NOT:
- modify source/runtime/frontend/tests/content/config/migrations;
- apply/reapply migrations;
- deploy/redeploy anything;
- create another game;
- reset any game;
- access Production or preserved/manual games;
- invoke feedback;
- invoke CSA or rerun CSA7/9;
- touch image/media work;
- expose or extract capability/secret values;
- retry/regenerate Story for semantic preference;
- run more than six additional turns;
- create a new harness/framework/document/branch;
- overwrite CURRENT_TASK after execution.

## 9. Terminal

Post exactly one terminal comment to Issue #68 and STOP.

Terminal must include:
- Task ID/current task blob/execution lease;
- start/final main SHA;
- TEST API/frontend identities;
- game ID `58d77377-010d-4920-a2ad-a549b8e341bc`;
- starting committed_turn/revision;
- six exact actions and resulting committed turn numbers;
- one refresh point and parity result;
- compact player-agency/continuity findings for the predeclared batch;
- final committed_turn/revision/turn chronology/job status;
- any isolated provider variance separately from real deterministic defects;
- confirmation no source/deploy/migration/reset/new-game/Production/feedback/CSA/image/provider-config mutation occurred;
- final status/classification.

Then STOP. Do not choose the next task.
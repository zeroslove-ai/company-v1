# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-opening-agency-boundary-correction-v1
Mode: SOURCE / OPENING PLAYER-AGENCY CONTRACT CORRECTION ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Trigger / failure evidence

This task follows the accepted Milestone 0 TEST failure:

- failed rollout task: `company-full-redesign-milestone0-opening-contract-test-rollout-v1`
- failed terminal: Issue #68 `5369127101`
- operator review: Issue #68 `5369164396`
- failure class: `FAILED_OPENING_COMPLETES_UNREQUESTED_PLAYER_ACTION`
- immutable evidence game: `80095cdd-c901-4370-8387-66dcb756b72a`

The rollout proved the R3 transport/commit/product-premise/four-choice path. It failed because the Opening Story authored voluntary player actions and player speech before any player input. Do not mutate/retry/reset/delete/repair the evidence game.

## 1. Binding authority

Obey, in order:

1. PR #95 Product-first redesign canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine/acceptance canon at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. Company v1 complete UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
4. accepted Milestone 0 R3 source already merged on main, including PR #99 Opening contract correction;
5. live failure evidence in terminal `5369127101` and operator review `5369164396`.

Product acceptance outranks green tests.

## 2. Exact defect to correct

Current `runtime-r3/server/provider.js` simultaneously instructs the model to:

- explicitly show the player discovering/recognizing the unfamiliar private app; and
- never complete an unrequested player action.

That boundary is too vague. The real Opening interpreted “discovering” by authoring player-controlled behavior: hiding a window, nodding, replying, drinking, reviewing work.

`runtime-r3/domain/memory.js` currently exposes only a boolean `never_complete_unrequested_player_action`, and `test/r3-opening-contract.test.mjs` proves instruction presence rather than a concrete Opening agency boundary.

This task must make the semantic boundary explicit without adding a new deterministic semantic authority.

## 3. Required source correction

Create one normal source branch from exact current `main` at lease time.

Expected branch:

`company-redesign/m0-opening-agency-boundary-v1`

Do not create an ops branch. Open one Draft PR and stop at source review.

Allowed implementation scope is narrow:

- `runtime-r3/server/provider.js`;
- `runtime-r3/domain/memory.js` only if needed to make the Opening contract explicit/structured;
- `test/r3-opening-contract.test.mjs` and narrowly related R3 prompt-contract tests only.

Do not edit frontend, DB/migrations, store/RPC/worker/reducer/concurrency code unless a direct compile/test dependency requires a trivial non-semantic adjustment; if broader runtime change appears necessary, STOP and report instead.

### 3.1 Opening agency law

For `opening=true` and before any literal player action exists:

- The Story may narrate environment, NPC actions/dialogue, objects/screens/notifications becoming visible, and information/stimuli available to the player.
- The Story may establish that the unfamiliar private `상식개변` app is present/appears/is noticed in the player's field of view, but must do so without making the player choose or perform an interaction.
- The Story MUST NOT author any voluntary player-controlled speech, reply, nod, gesture, movement, touching, clicking, typing, opening/closing/hiding the app, drinking/eating, reviewing/working, acknowledging, deciding, accepting, refusing, or other intentional action before player input.
- Do not state or imply a completed player choice such as “플레이어는 ~했다”, “도윤은 ~라고 답했다”, or equivalent voluntary behavior.
- Passive perception/exposure is allowed only to establish scene information; it must not smuggle in a decision or task completion.
- End the Opening with the player still free to choose among the four Story-authored actions or free-form input.

This boundary is Opening-specific. Ordinary turns may narrate the literal player action that the player actually submitted, while preserving that action rather than replacing it.

### 3.2 Preserve all already-accepted behavior

Do not regress:

- registered Company setting/actors only;
- private-app premise and NPC ignorance until player reveal;
- rich Company-life Opening, not assistant/helpdesk framing;
- exactly four current Story-authored natural literal next actions;
- Observer copies those current-Story choices verbatim or fails open with empty choices;
- no stale/prior choice fallback;
- Story remains the sole narrative/choice author;
- one Story + one Observer only;
- no second Story/choice LLM;
- no retry/regeneration/padding/truncation;
- no hidden semantic post-processing that rewrites Story;
- accepted A-prime server-owned turn/atomic commit spine unchanged.

## 4. Tests / acceptance for this source task

Strengthen the focused Opening contract suite so it cannot pass merely because a string like “never complete an unrequested player action” exists.

At minimum prove:

1. the outbound Opening system/context contract explicitly distinguishes passive scene/app exposure from voluntary player-controlled action;
2. the contract explicitly forbids representative autonomous player acts including speech/reply, nod/gesture, movement, app interaction/hiding, drinking/eating, and work/task execution before player input;
3. ordinary-turn literal-action authority remains intact and is not accidentally blocked by the Opening-only rule;
4. private-app discovery, NPC ignorance, registered Company setting, rich workplace/social framing, and four Story-authored choices remain required;
5. Observer choice-copy/fail-open behavior is unchanged;
6. no deterministic Story semantic validator/rewrite/retry path is introduced.

Use deterministic prompt/contract fixtures only. Do not call the live LLM in this source task.

Run focused R3 tests, full repository tests, syntax/diff checks, and exact-head CI as applicable.

## 5. Hard prohibitions

- no TEST/Production deploy;
- no migration edit/apply/new migration;
- no DB writes or game creation/gameplay;
- no mutation of `80095cdd-c901-4370-8387-66dcb756b72a` or any preserved v1/v2/R3/hospital/manual/QA/evidence game;
- no frontend/UI change;
- no provider/model/temperature/token/config/secret change;
- no post-hoc semantic blocker that rejects a valid Story and regenerates it;
- no deterministic rewriting of generated Story;
- no retry-until-pass;
- no CSA/TTS/Image/Feedback implementation;
- no Milestone 1;
- no auto-merge.

## 6. Completion / review boundary

Post exactly one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_OPENING_AGENCY_BOUNDARY_READY_FOR_REVIEW`

Status: `WAITING_REVIEW`

Include:

- Task ID;
- starting main SHA;
- final source SHA;
- branch and Draft PR;
- exact changed paths;
- exact prompt/context agency rule added;
- focused/full test results;
- exact-head CI result if available;
- confirmation no frontend/DB/migration/deploy/gameplay/provider-model-config changes;
- confirmation evidence game untouched.

Then STOP. Do not merge, deploy, create a fresh game, or register the TEST rerun automatically.

After operator accepts and merges the exact reviewed head, the next task will be one separate bounded TEST Opening rerun on exactly one fresh R3 game.
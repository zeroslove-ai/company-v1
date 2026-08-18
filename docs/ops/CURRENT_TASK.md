# Company v1 — CURRENT TASK

Status: READY
Task ID: fresh-manual-acceptance-fixture-handoff-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Operator review decision

Previous task: `user-live-turn33-continuity-contract-repair-v1`
Terminal: Issue #68 comment `5323313465`
Terminal classification: `USER_LIVE_TURN33_CONTINUITY_REPAIR_WAITING_MANUAL_ACCEPTANCE`
Previous registration SHA: `a934627004a649e1b9a5079110074c90bd387a3a`
Reviewed source/test commit and PR #79 exact head: `db0cc1ce1ac29bf77f3e34dc6d40b7bf4698eac2`
Merged/current main: `5654fe20a5d39c6fd4c9d2e94c7d450e331bc83d`
Merged-main CI: `32095924434` SUCCESS
Previous final task branch SHA: `bc434969bebebbd9789b3e86d8b682e336267779`
Previous final CURRENT_TASK blob: `457b1ba287bc968e90a88d4109cd5e80eaf8ecef`

Operator review accepts the A-D source repair, PR #79 merge, merged-main CI, and TEST deployment/smoke evidence. The source repair is complete and must not be reopened in this task.

Accepted source dispositions:
- A: one actor-scoped exact Story-evidence path now reaches the canonical NPC position writer; wrong/missing/non-exact actor evidence preserves prior state.
- B: the existing player sexual reducer remains the sole writer; current Extract prompt/evidence wording is aligned to its exact Story-backed arousal/erection/progression gates; player intent alone never writes success.
- C: exact multiple registered NPC mentions resolve structurally only when all targets map to the same single canonical destination and the literal action contains explicit movement intent; non-movement, ambiguous, and divergent-destination cases remain unresolved.
- D: missing turn-summary/Mind-Monitor outputs produce deterministic warnings; older blank summaries retain committed raw Story/parsed-block fallback rather than server-invented semantic prose.
- `focal_character_id` remains a current presentation/context consumer after audit; no new focal classifier was added.

Validation accepted:
- focused A-D tests `31/31` PASS;
- full `npm test` `358/358` PASS;
- changed JS syntax PASS;
- `git diff --check` PASS;
- PR #79 exact-head CI `32095871921` SUCCESS;
- merged-main CI `32095924434` SUCCESS;
- current `main` is exactly `5654fe20a5d39c6fd4c9d2e94c7d450e331bc83d`.

### Manual-acceptance handoff defect

The previous terminal is NOT accepted as a valid manual-test fixture handoff.

It reported the final Level-7 manual fixture as game:
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
with `reset_before_seed=true`, committed_turn=0 and zero Story turns.

That UUID was not fresh. It is a previously used Company v1 disposable QA/evidence game recorded repeatedly in Issue #68 and earlier acceptance work. The active task explicitly required:
- exactly one fresh disposable manual-test game; and
- preservation of all prior manual/QA/evidence games with no reset/reuse.

Independent TEST DB readback after the terminal now shows this old game at committed_turn=0, save_revision=1288, Level 7, action_count=0, turn_count=0, setup/opening not_started. Therefore the old evidence game was in fact reset/reseeded. Do not attempt to reconstruct, rewrite, or “repair” its lost historical evidence. Preserve its current post-reset state from now on and record the incident only.

This task corrects ONLY the fixture handoff. No source/runtime/test repair is authorized.

## 1. Frozen base and branch

Repository: `zeroslove-ai/company-v1`
Required base main: `5654fe20a5d39c6fd4c9d2e94c7d450e331bc83d`
Expected branch: `company/fresh-manual-acceptance-fixture-handoff-v1`

Preflight:
1. fresh-fetch `main` and require exact base above;
2. verify this branch is exactly one docs-only registration commit ahead of base;
3. re-read terminal `5323313465`, the prior CURRENT_TASK, and this exact CURRENT_TASK blob;
4. verify PR #79 remains merged and exact current main CI is green;
5. verify the accepted TEST API/front-end deployment identities have not drifted unexpectedly;
6. perform no source/test/config/migration edit.

If main or deployed executable identity materially drifted, STOP `BLOCKED_FRESH_MANUAL_FIXTURE_DEPLOYMENT_DRIFT` instead of deploying or guessing.

## 2. Existing games are immutable for this task

Do not reset, seed, advance, setup, open, reuse, or otherwise mutate ANY game UUID that existed before this task starts.

This includes, without limitation:
- user manual game `9755b57b-5cbb-44dd-a624-020fe516c16d`;
- incorrectly reused prior QA game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- all earlier UTF-8, live-acceptance, clothing, manual, QA, and evidence games already present in Issue #68 / TEST DB;
- protected/default sentinel fixtures.

Read-only checks are allowed.

Do not try to restore the pre-reset contents of `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` through guessed history, copied rows, replay, or rollback. Historical evidence is immutable when present and must not be fabricated when lost.

## 3. Create a genuinely fresh manual-test game

The only TEST write authorized in this task is creation/seeding of one brand-new Level-7 manual-test fixture.

Required method:
1. generate a new random UUID locally for this task;
2. require that UUID is different from every UUID named in this CURRENT_TASK and from protected/default sentinels;
3. BEFORE any write, query TEST read-only and prove the UUID is absent from every relevant persisted game surface available in the current schema, including at minimum `games`, `game_save`, `game_actions`, and `game_turns`;
4. if the generated UUID already exists anywhere, STOP `BLOCKED_FRESH_MANUAL_FIXTURE_UUID_COLLISION`; do not reset/reuse it;
5. create/seed that new UUID through the existing authorized TEST-only Level-7 fixture path;
6. any reset-before-seed behavior is allowed ONLY if it targets the newly generated UUID after absence was proven. No pre-existing UUID may be reset;
7. perform no Setup, Opening, Story, Extract, Commit, choice, or free-text gameplay request after fixture creation.

The desired final state is a playable fresh Level-7 game at turn zero, not a preplayed acceptance scenario.

## 4. Mandatory final readback

After fixture creation, independently read back TEST and require all of the following for the NEW UUID:
- `committed_turn = 0`;
- `player_progress.level = 7` and expected initial EXP;
- `game_actions` count = 0;
- `game_turns` count = 0;
- player setup/opening remain at the normal turn-zero pre-play state expected by the current frontend fixture flow;
- no in-flight/processing action exists;
- canonical initial scene/readback is structurally valid;
- fixture is TEST-only through the existing test seam;
- no Story gameplay turn has been sent.

Also re-read the preserved user game `9755b57b-5cbb-44dd-a624-020fe516c16d` and the accidentally reset `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` READ-ONLY only to prove this task did not mutate either one further.

## 5. Worker / URL verification

Do not redeploy in this task unless preflight proves the accepted merged-main TEST executable unexpectedly drifted, in which case STOP instead of self-authorizing a deploy.

Expected accepted deployment from the prior terminal:
- API Worker `game-proxy-company-v1`, version `626e21cd-6eeb-4db9-ae6b-a40ea324d7a5`;
- frontend source unchanged from the accepted source-equivalent deployment, previously reported version `06b1cc87-77ec-4fd2-add3-10d1ad226311`.

Verify health/source equivalence and the public TEST frontend URL for the NEW game:
`https://gamebuilder-company-v1.zeroslove.workers.dev/?game=<NEW_UUID>`

Require HTTP 200 for the URL. Read-only/current corrected smoke may be used only if it cannot mutate gameplay state.

## 6. Hard prohibitions

- no source/runtime/test/config/content edits;
- no PR, merge, or roadmap Cut work;
- no Worker deployment;
- no migration/DDL/schema/history write/repair or broad DB push;
- no Production or hospital-v2 access;
- no provider/model/TTS/binding change;
- no reset/reuse/mutation of any pre-existing game;
- no automated gameplay session;
- no Setup/Opening/Story/Extract/Commit call for the final NEW manual game;
- no retry/regeneration for gameplay;
- no synthetic reconstruction of lost evidence;
- no Cut3.

## 7. Terminal

Success terminal:
`FRESH_MANUAL_ACCEPTANCE_FIXTURE_READY`

Blocked terminals:
- `BLOCKED_FRESH_MANUAL_FIXTURE_DEPLOYMENT_DRIFT`
- `BLOCKED_FRESH_MANUAL_FIXTURE_UUID_COLLISION`
- `BLOCKED_FRESH_MANUAL_FIXTURE_STATE_INVALID`

At success:
1. set CURRENT_TASK `WAITING_USER_LIVE_ACCEPTANCE`;
2. post exactly one Issue #68 terminal containing:
   - registration SHA/blob and final docs-only SHA/blob;
   - accepted current main and merged-main CI identity;
   - verified API/frontend Worker identities;
   - the NEW game UUID;
   - pre-write absence proof across relevant tables;
   - final turn-zero/Level-7/action-count/turn-count/readback proof;
   - public TEST frontend URL and HTTP status;
   - explicit `final_manual_game_story_turns=0`;
   - explicit counts proving existing-game mutations/resets/reuse = 0 in THIS corrective task;
   - explicit note that `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` is not the manual-acceptance game and must not be used;
   - migration/DDL/deploy/Production/provider-model/source-change counts;
3. STOP. Do not begin user gameplay or register the next roadmap Cut.

The user will play the new URL. The next task may be created only from subsequent user manual-play evidence or an explicit owner directive.

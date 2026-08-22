# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: LOCAL-DIVERGENCE RECOVERY -> CONTINUOUS TEST LIVE-QA / FIX / REDEPLOY LOOP
Updated: 2026-08-22 09:57 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Binding owner policy

The owner has explicitly rejected premature `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` gates. Automation owns objective QA. Manual owner play begins only after the objective exit matrix is green.

Binding operating protocol:

- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`

Binding product/architecture authority remains:

1. PR #95 product-first Company canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine/live-first acceptance at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. `docs/redesign/00_*` through `11_*`;
4. Company v1 UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
5. current accepted R3 source on main;
6. latest explicit owner decisions and Issue #68 operator review.

TEST only. No Production access/deploy. Never mutate/reset/delete/replay preserved historical/manual/evidence games.

## 1. Immediate recovery from push-race and local-divergence terminals

The prior lease first failed because of a Git push race, then the re-kick stopped because the runner checkout still had the verified local-only recovery commit checked out and could not fast-forward to the newly registered remote main. This is a workflow state problem, not a rejection of the narrow recovery fix.

Evidence:

- first failed terminal: Issue #68 comment `5376803619`;
- operator review: Issue #68 comment `5376821230`;
- re-registration: Issue #68 comment `5376837624`;
- local-divergence terminal: Issue #68 comment `5376844165`;
- common base: `122ac37135f83198c9b006bef843843d493a235b`;
- verified local-only fix commit: `f4cc1a84f85393cdf20f618f1e0a5790b68519d4`;
- remote main at the divergence terminal: `069b02e33e83e223aedba4721d25867cd3cabc8c`;
- the local commit changes only `frontend-r3/app.js` and `test/r3-frontend-contract.test.mjs` relative to the common base.

The local fix intent was:

- `frontend-r3/app.js`: after SSE reconnect loss or refresh, poll the same processing R3 job, render canonical committed context when it completes, and expose the recovery control rather than leaving the user stranded;
- `test/r3-frontend-contract.test.mjs`: focused recovery contract assertions.

This local commit is NOT accepted or deployed merely because it exists.

### Local checkout recovery authorization

No new branch is allowed. Do not create a recovery branch, ops branch, alternate CURRENT_TASK file, or force-push anything.

The runner is explicitly authorized to recover its local checkout from the known divergence only under all of these conditions:

1. fetch latest `origin/main` and re-read the latest Issue #68 comments;
2. verify commit `f4cc1a84...` still exists and its diff from common base `122ac371...` is exactly the two intended paths above with no docs/config/migration/other runtime changes;
3. verify there are no additional uncommitted tracked changes that would be lost; approved preserved untracked evidence directories remain untouched;
4. record the local commit SHA and exact diff as evidence;
5. move the existing local checkout back to the exact latest `origin/main` even if that requires a local hard reset of the checked-out branch. This authorization applies only to discarding the already-recorded local-only `f4cc1a84...` branch state after its diff has been verified and preserved by SHA. It does not authorize rewriting remote history, force-pushing, deleting preserved evidence, or discarding any unexpected local work;
6. after the checkout is exactly on latest `origin/main`, reapply only the intended two-file recovery change from `f4cc1a84...` (cherry-pick is allowed if the commit still contains exactly those reviewed changes; otherwise reproduce the narrow diff manually);
7. if any condition above is false, or any unexpected local delta exists, STOP with exact evidence instead of guessing.

### Recovery procedure after checkout normalization

1. Confirm there is no conflicting newer executable change to the same recovery paths on latest main. If there is a semantic conflict, STOP with evidence rather than guessing.
2. Run focused frontend recovery tests, full test suite, `node --check` for changed JS/MJS, and `git diff --check`.
3. Push only by fast-forward. Never force-push, reset/rewrite remote history, or silently discard a newer main delta. If main races again, STOP and report the new remote delta precisely.
4. The landed exact main SHA becomes the only candidate for TEST deployment.

## 2. Focused deployed reproducer after landing

After the recovery fix is independently landed/reviewable on GitHub:

1. Deploy exact reviewed API/frontend TEST artifacts only as required; do not deploy unrelated source.
2. Use a fresh disposable R3 TEST game.
3. In a real deployed browser, exercise:
   - normal Setup -> Opening -> committed turn;
   - refresh after commit;
   - refresh/reload while a turn job is actively `processing`;
   - simulated/real SSE disconnect followed by same-job recovery;
   - canonical committed context rendering after completion;
   - recovery control visibility/usability;
   - preservation of `api=` and `game_id` in URL;
   - no duplicate Story generation, no duplicate committed turn, no hidden retry/regeneration.
4. Inspect browser console/network, job/state/turn DB evidence, screenshot-visible UI and exact turn/action identity.
5. If this reproducer fails, fix narrowly, redeploy exact TEST artifacts and replay. Do not move to broad campaign while this objective defect remains.

## 3. Do NOT stop after the reconnect fix

A focused green reconnect test is not task completion. Continue the autonomous live QA loop.

The current binding product-review priority order is:

### P1 correctness

1. Active CSA rules must be projected into Story context; `active_rules: []` while rules are active is a defect.
2. Observer must receive canonical actor `{id,name}` directory and must not fabricate/generalize heroine IDs.
3. Mind Monitor must use actor-keyed relevant-current-NPC structure and must not be 100% dropped.
4. Replay movement after the canonical-location correction across at least four distinct canonical locations.
5. `scene_note` must be a current bounded scene snapshot, rewriting/ending stale facts when Story changes them.
6. Semantic literal agency must be reviewed beyond byte equality: actor, target/counterparty, action, direction, request/refusal, self-state and topic/intent must not be silently substituted.
7. Exactly four current Story-authored choices should have high live compliance; failure remains fail-open to free input, with no stale/prior-turn fallback and no deterministic fabricated replacements.

### P2 / long-play / performance

8. Use separate disposable fixtures: clean normal-play, clothing-CSA, request/interaction-CSA, long-memory. Do not certify normal continuity from a heavily CSA-mutated game.
9. Run one clean 30+ turn primary campaign and one materially different 15+ turn independent campaign.
10. Run a 50+ turn memory/continuity campaign once the shorter campaigns are clean enough.
11. Measure submit->first Story token, Story total, observer tail and terminal commit latency where instrumentation permits; investigate objective stalls. Observer is fail-open and must not create an excessive tail.
12. Exercise refresh-during-stream, same-job reconnect, duplicate-submit/concurrency and stale-attempt protection.

### Product feel / retained surfaces

13. Detect and correct objective work-task funneling where the game becomes a mandatory campaign/work assistant rather than company-life character simulation.
14. Inspect choice diversity/mobile readability; prefer one clear action/intention per choice and avoid four near-identical diligent-work options.
15. Story must not invent a competing fictional app mechanic outside the canonical 9-rule `상식개변` product UI/system authority.
16. History/TTS/download and other canon-retained sidecars must be actually exercised in deployed UI.
17. Feedback/revision, if retained by current canon and visibly promised, is unfinished product work until functional or explicitly owner-deferred.

## 4. Minimum human-like browser campaign before owner handoff

Do not certify from HTTP 200, RPC success, unit tests, DOM presence, raw turn count, or uninspected screenshots.

Minimum deployed TEST evidence:

- fresh Korean Setup and Opening;
- 30+ ordinary committed turns in one clean game;
- independent 15+ turn game with a different route/action style;
- 50+ turn memory campaign after shorter campaigns stabilize;
- both Story-authored choices and literal Korean free-form actions;
- refusal/negative/self-directed actions;
- multiple canonical locations and multi-NPC entry/exit;
- off-scene canonical NPC references without auto-spawn;
- object/pose/scene_note continuity including leave/return;
- relevant-only MM with fail-open behavior;
- refresh after commit and during active stream;
- duplicate submit/concurrent duplicate request;
- exactly four current choices at high reliability; free input remains usable on choice projection failure;
- all 9 CSA templates apply -> zero-turn revision -> subsequent Story effect -> readback -> remove, using representative valid scopes;
- desktop plus mobile `390x844` and at least one wider mobile/tablet viewport;
- no permanent loader/fallback or blocking overlay over streaming Story;
- no uncaught required-path browser/network failure;
- no fabricated/crossed identity;
- committed location/presence/scene_note grounded in Story;
- literal action stored byte/codepoint-equivalent AND semantically respected by Story.

Screenshots must be visually inspected as a user would see them.

## 5. Safety / authority boundaries

- TEST only; no Production.
- Disposable R3 TEST games are authorized. Preserved/manual/evidence games are read-only forever.
- No provider/model/config/secret change merely to mask implementation defects without explicit review.
- No hidden retry/regeneration or second Story/choice LLM.
- No browser-owned Story -> Observer -> Commit orchestration; preserve A-prime server-owned turn authority.
- No generic semantic classifier/NER/physical ontology/consent DSL introduced to paper over concrete failures.
- Migrations, if a proven defect requires one, must be additive and independently reviewed; never rewrite applied history.
- Re-read latest Issue #68 before every source landing/deploy decision to avoid another race.

## 6. Exit criteria

Remain `READY` and continue the same task while any known objective P0/P1/P2 defect or untested canon-retained objective behavior remains.

Do not set `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` until all of the following are demonstrated with deployed evidence:

1. clean desktop/mobile boot;
2. Setup -> Opening -> ordinary play;
3. visible nonblocking Story streaming;
4. reliable current 4 choices + literal free input;
5. clean 30 + independent 15 + 50 turn campaigns;
6. semantic agency, identity, location/presence, scene_note, MM green;
7. refresh/reconnect/double-submit green;
8. all 9 CSA templates narrative/readback/remove coverage green;
9. retained sidecars usable or explicitly owner-deferred;
10. screenshots visually inspected and required console/network paths clean;
11. DB/state/turn evidence agrees with visible Story/UI;
12. no known objective P0/P1/P2 defect remains.

Only genuinely subjective questions such as narrative taste, emotional nuance, character appeal and pacing preference may remain for owner manual play.

## 7. Reporting

Use Issue #68 for compact iteration evidence. Do not spam the owner per turn.

For each meaningful iteration report:

`AUTONOMOUS_LIVE_QA_ITERATION`

Include source/main SHA, API/frontend TEST versions, disposable game IDs, browser/viewports, turns/scenarios, concrete defects, fixes landed, regression results, live replay result, remaining objective gaps and next loop action.

If a push/deploy race or other safety boundary blocks execution, post exact evidence and STOP. Otherwise continue this SAME task; do not create a new feature task merely because one iteration completed.

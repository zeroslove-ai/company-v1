# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-observer-scene-reentry-presence-p1-correction-v1
Mode: TARGETED CORE P1 — SINGLE-OBSERVER POST-STORY SCENE MEMBERSHIP INTEGRITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `c114cc5bbd4f51c58001c0664cf0112f76344094`
Previous task: `company-r3-navigation-actor-binding-self-stay-p1-continuation-v1`
Previous terminal: Issue #68 `5404865043`
Operator / whole-canon review: Issue #68 `5404910939`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Accepted previous implementation: `bdd7a99e2a9a6762f6fb1e315d38b6496d22390a`
Preserved scene reconciliation implementation: `d5a841bb37c8340e40ee421d806bdb37436fcbc4`
Current TEST Worker: `game-proxy-company-r3` / `34d9b74f-55f5-4ff1-93db-c5ad6cdd3a0d`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`
Fresh decisive evidence game: `9fcd03d0-4daf-4fb2-8ae8-fc438a46d6cf` — READ ONLY

Success terminal:
`OBSERVER_SCENE_REENTRY_PRESENCE_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OBSERVER_SCENE_REENTRY_PRESENCE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only and reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Before implementation, re-read in order:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5404865043`
8. operator whole-canon review `5404910939`
9. this task.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

### Preserved evidence — READ ONLY
At minimum preserve:
- `9fcd03d0-4daf-4fb2-8ae8-fc438a46d6cf` — decisive current evidence;
- `044f71c1-e4da-443e-a186-a01477a1b50f`;
- `98e070d9-b491-47a9-881b-45dc496a4046`;
- `4457dcab-72f8-4d79-b24d-788c73db8252`;
- `51141ee0-60f8-428b-9066-a5a69eb20c4e`;
- `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33`;
- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324`;
- all other games already marked preserved in Issue #68.

## 1. Why this task exists — new whole-canon P1

The previous navigation task is accepted. Fresh Turn 2 now correctly keeps PLAYER in `brand_strategy_office` while only 서원희 / 박정우 move to `brand_strategy_meeting_room`; observer and durable state agree and `canonical_navigation_applied` is absent.

The next turn exposes a different first broken boundary.

Fresh game `9fcd03d0-4daf-4fb2-8ae8-fc438a46d6cf`, Turn 3 literal:

`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

Story correctly executes supported S1 and physically brings the pair back into the player-office scene:
- `서원희 차장과 박정우 팀장이 회의실에서 대화를 마치고 나오려는 순간...`
- PLAYER issues the order from the office;
- 서원희 and 박정우 face each other and the kiss is performed;
- the Story frames surrounding reactions as the office scene.

Observer raw is internally inconsistent with that Story:
- `entered=[]`
- `exited=[]`
- `location=brand_strategy_office`
- `present_actor_ids=[heroine2, heroine3, heroine4, heroine5]`
- but its own `scene_note` says the kiss by 서원희 and 박정우 was just performed in `브랜드전략팀 사무실`.

Observer applied preserves the incomplete list. Durable `state_after.scene.present_actor_ids` therefore also excludes `heroine1` and `general_park_jungwoo` even though Story/summary/scene_note place them physically in the same player scene.

This is P1 scene-truth corruption under `P-SCENE-001` and contaminates later Story/MM/context.

## 2. First owning boundary

Inspect first:
- `runtime-r3/server/provider.js` Observer request / `OBSERVER_*` contract;
- `runtime-r3/domain/observer-normalizer.js`;
- existing Observer / scene-presence / worker tests;
- the accepted `d5a841b...` scene reconciliation path;
- the accepted `bdd7a99e...` navigation path.

Current evidence proves the first failure is **Observer raw extraction**, not navigation and not the current normalizer:
- current Observer request already receives prior `current_context`, canonical actor directory, canonical location directory, and completed Story;
- current normalizer can reconcile grounded `entered/exited` against `present_actor_ids`;
- but when Observer raw emits no transition and simply repeats a syntactically valid prior actor list, the normalizer has no evidence-safe basis to invent missing actors.

Fix the existing **single Observer scene-membership output contract** at the smallest boundary.

Required semantics:
1. `present_actor_ids` is the exact **post-Story** registered-actor set physically co-located in the player's canonical location at Story end.
2. Prior `current_context.scene.present_actor_ids` is only a prior-state baseline. It must never be copied as the answer when completed Story changes membership.
3. A registered actor absent in the prior player scene but explicitly returning into / becoming physically present and acting in the completed player's scene must be included in post-Story `present_actor_ids`.
4. When the Story provides suitable exact transition evidence, emit grounded `entered` for the returning actor so `entered/exited/present_actor_ids` agree.
5. If exact transition evidence is not suitable, do not fabricate an `entered` quote merely to satisfy bookkeeping; the post-Story presence set must still reflect explicit physical co-location grounded by the completed Story.
6. Remote actors may be mentioned in `scene_note` as remote/history without being marked present. Mere name mention is not physical presence.
7. `scene_note`, `location`, `entered/exited`, and `present_actor_ids` must describe one reality.
8. Do not move PLAYER to repair NPC presence.

A narrow explicit scene-membership contract/prompt ordering or compact structured Observer context is allowed if it only clarifies these already-canonical semantics.

## 3. Preserve accepted behavior

Do not regress:
- `bdd7a99e...`: exact self-stay / NPC-owned movement does not become player navigation;
- `d5a841b...`: grounded exited actors are removed and grounded entered actors are restored against stale raw present lists;
- temporal `clock_24h` continuity;
- rule-change private-app context isolation;
- S1 closed-world unsupported handling;
- PLAYER sole issuer / exact S1 subject-counterparty direction;
- deterministic official announcement and conflict-copy behavior;
- S7 and navigation accepted behavior;
- one Story + one Observer only.

The preserved S1 `성기를 직접 검사 -> genital_touch` same-turn semantic-grounding P1 remains open but is **not this task**.

## 4. Forbidden approaches

Do NOT add:
- a new Korean Story parser, presence parser, movement parser, NER, fuzzy matcher, embeddings classifier, or second parser generation;
- normalizer regex/keyword logic that tries to infer physical presence from arbitrary Story prose;
- a generic scene graph, physical ontology, proximity engine, or multi-location simulation engine;
- a second Observer, second Story, verifier LLM, scene-state LLM, reaction LLM, or repair LLM;
- semantic retry/regeneration/sample-until-pass;
- post-Story narrative rewriting;
- provider/model/temperature/token/secret/config swap to mask semantics;
- DB/schema/RPC/migration/backfill;
- Production access;
- new branch/PR/CURRENT_TASK/task file;
- preserved-game mutation;
- OWNER_READY.

If source proof shows an even earlier existing Observer boundary than the prompt/contract, fix that instead and explain why. Do not broaden the architecture.

## 5. Deterministic regressions

Add the smallest regressions around the actual failure and existing controls.

Required before deploy:
1. Capture/inspect the actual Observer request contract and prove it explicitly distinguishes prior scene membership from required post-Story membership.
2. Regression fixture based on the fresh chain: prior present actors exclude `heroine1` and `general_park_jungwoo`; completed Story explicitly returns them to the office and has them physically perform the supported kiss; valid Observer output must include both in post-Story `present_actor_ids`.
3. When exact grounded return evidence exists, returned `entered` and `present_actor_ids` agree.
4. A remote named actor mentioned only as remote/history is not forced into `present_actor_ids`.
5. Existing stale-`present_actor_ids` + grounded `exited` reconciliation stays green.
6. Existing grounded `entered` restoration stays green.
7. Exact self-stay/NPC movement regression stays null for player navigation and does not receive `canonical_navigation_applied`.
8. True explicit player navigation controls remain green.
9. Temporal/private-app/official-announcement/S1 closed-world + supported kiss/S7/compatibility/conflict-copy focused regressions remain green.
10. No second Story/Observer/verifier/retry path exists.

Do not create a deterministic Story-text presence parser merely to make test 2 green. Test the existing Observer contract/request boundary and evidence-safe normalization/application behavior.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- exactly one full repository `npm test` after focused green, recording exit and count.

Automated green is not product acceptance.

## 6. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if runtime executable source changed;
- use the unchanged repository contract-gated R3 deploy path;
- if local `psql` is unavailable and TEST contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if the unchanged gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No DB write, Production, or provider/model/config change.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use the real deployed TEST frontend/UI and create exactly ONE disposable adult-profile game.
No second game, reset, regenerate, direct gameplay API substitute, semantic retry, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Target 4–6 committed turns. Stop at the first reproducible P0/P1.

### A. Opening
- normal first arrival;
- record player canonical location/time;
- no invented voluntary player action.

### B. S1 APPLY preservation gate
Through visible CSA UI activate canonical S1 for exact pair 서원희 -> 박정우.

PASS:
- one official institutional announcement;
- no private-app source/NPC awareness;
- exact PLAYER issuer and actor direction;
- one Story / one Observer / one Commit;
- temporal continuity remains correct.

### C. NPC pair leaves while player stays
Submit exactly:
`나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`

PASS:
- PLAYER remains in office;
- if Story moves the pair, post-Story membership excludes the pair and keeps remaining office actors;
- no `canonical_navigation_applied` false positive.

If Story does not move the pair, do not retry/sample. Record the coverage gap. Continue only if no P0/P1 and the next planned beat remains coherent.

### D. Supported S1 kiss / return-presence decisive gate
Submit exactly:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

PASS for S1 remains same-turn supported execution with exact direction and no invented PLAYER travel.

**Scene-membership decisive condition:** if this Story, as in the preserved failure, brings 서원희/박정우 back into the player's office scene and has them physically act there, then:
- Observer raw `present_actor_ids` MUST include `heroine1` and `general_park_jungwoo`;
- any grounded `entered` evidence must agree;
- Observer applied must retain them;
- durable `state_after.scene.present_actor_ids` must retain them;
- `scene_note` must describe that same scene;
- next context/UI must not treat them as absent.

If the Story instead keeps the pair physically remote and executes consequences remotely, do NOT retry to obtain a preferred sample. Mark the central live re-entry coverage as unproven and terminalize BLOCKED for operator review rather than falsely declaring the P1 closed.

Because the defect is at raw Observer scene extraction, acceptance must obtain the decisive raw/applied/durable chain using the existing permitted TEST read-only evidence path. If the runner cannot read those fields without writing DB state, STOP/BLOCKED and report that limitation; do not infer raw JSON from the browser.

### E. One follow-up presence continuity beat
Only if D proves the pair physically present and state is correct, address one returned actor naturally without player movement, e.g.:
`나는 자리에 그대로 서서 서원희 차장에게 방금 지시가 갑작스러웠는지 묻는다.`

PASS:
- Story does not invent travel to find an actor who is already present;
- actor/target/topic preserved;
- post-scene state stays coherent.

### F. Refresh/re-entry
Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- same location/presence reconstructs;
- active S1 reconstructs once;
- input/choices usable.

For decisive turns record:
`literal/operation -> Story -> observer raw -> observer applied -> navigation intent/postcondition -> durable scene -> next Story/context -> UI`.

## 8. Whole-canon observations — measure, do not broaden

During this campaign record but do not fix:
- MM raw -> applied retention/drop;
- player_inner_thought raw -> applied drop/invention;
- choice/dialogue projection warnings;
- player-facing/internal CSA text leakage if visible;
- removed/replaced-rule residue only if naturally encountered.

Known P2 MM reliability remains open. Media/TTS remain paused.

## 9. Next lanes — do not pre-register

After terminal, operator must perform the mandatory whole-canon audit before selecting anything.

If this scene-membership P1 is closed and no earlier P0/P1 appears, likely next P1 is the preserved:
`S1 성기 직접 검사 -> genital_touch` finite-family semantic-grounding / same-turn authority defect.

Only after P1 closure return to P2 integrity:
1. removed/replaced current-authority ghosts;
2. MM projection reliability;
3. player-facing/internal CSA text separation.

Then image/media and TTS acceptance.

## 10. Stop / terminal law

Do not patch during the live campaign.
At first reproducible P0/P1 or decisive raw-state evidence unavailable:
- preserve the fresh game read only;
- record exact chain/limitation;
- set this same file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

On success:
`OBSERVER_SCENE_REENTRY_PRESENCE_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

On blocker/failure:
`OBSERVER_SCENE_REENTRY_PRESENCE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not register the next task yourself. The operator must run the mandatory whole-canon audit first.

## 11. Terminal record — 2026-08-25 KST

Terminal: `OBSERVER_SCENE_REENTRY_PRESENCE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`
Implementation commit: `ae27e7805065118657869ba90a7cf52bc3890982`
TEST Worker: `game-proxy-company-r3` version `fd39063f-5b3c-4d9d-bb89-586da4c24cf0`, source `ae27e7805065118657869ba90a7cf52bc3890982`
Fresh disposable browser game: `59b3fd24-5889-4d59-a1a9-5ceddb427b72` — preserved READ ONLY

Acceptance record:
- Opening committed successfully at `brand_strategy_office`, Day 1 09:05, with four visible choices and free input.
- S1 was activated through the visible CSA UI for exact `서원희 -> 박정우`; the turn committed one official announcement and the supported rule was reflected in the Story.
- Exact self-stay input `나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.` committed with PLAYER remaining in the office while the pair moved to the meeting room; visible Mind Monitor membership dropped to the remaining office actors and no player-navigation marker was observed.
- Exact supported-kiss input `나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.` produced the supported directed kiss, but Story additionally invented PLAYER travel from the office to the meeting-room door even though the literal input contained no player movement. This is a reproducible P1 under the no-invented-player-travel acceptance law.
- The campaign stopped at the first P1; no retry, second game, reset, or further turn was performed. The decisive raw Observer/applied/durable chain was not used to override the earlier visible P1, and no claim is made that the scene-reentry P1 is closed.

Required review state: preserve the fresh game read-only and perform the mandatory whole-canon operator audit before any next task is registered.

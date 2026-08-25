# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-opening-no-invented-player-action-p1-correction-v1
Mode: TARGETED CORE P1 — OPENING PLAYER AGENCY BEFORE FIRST LITERAL
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `77da2f869b5ff67589359847f986b56402323cbd`
Previous task: `company-r3-story-no-invented-player-travel-p1-correction-v1`
Previous terminal: Issue #68 `5405323516`
Operator / whole-canon review: Issue #68 `5405358834`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserve accepted player-movement implementation: `bd643fa026f2c1a0bcf8e3db6abf18b0294ee004`
Preserve Observer re-entry implementation: `ae27e7805065118657869ba90a7cf52bc3890982`
Fresh decisive evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`OPENING_NO_INVENTED_PLAYER_ACTION_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OPENING_NO_INVENTED_PLAYER_ACTION_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5405323516`
8. operator whole-canon review `5405358834`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

At minimum preserve READ ONLY:
- `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`
- `59b3fd24-5889-4d59-a1a9-5ceddb427b72`
- `98e070d9-b491-47a9-881b-45dc496a4046`
- all other games already marked preserved in Issue #68.

## 1. Why this task exists — fresh reproducible P1

Fresh game `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`, Opening / Turn 0 has no submitted player literal.

Actual Story nevertheless says:
`서류 뭉치 사이에 스마트폰을 내려놓는 순간, 화면에 익숙하지 않은 아이콘이 하나 떠 있다.`

That authors a voluntary PLAYER touching/placing action before the player has chosen anything.

Binding canon says Opening does not speak for the player beyond validated setup facts. Current `OPENING_STORY_SYSTEM_PROMPT` already says passive app exposure is allowed but explicitly forbids voluntary player speech/reply, nod/gesture, movement, touching, clicking, typing, opening/closing/hiding the app, drinking/eating, reviewing/working, acknowledging, deciding, accepting/refusing, or another intentional player action.

Therefore this is not new product law. It is a current implementation / Story-contract failure under `P-OPENING-001` and `P-AGENCY-001`.

The private unfamiliar app must still be discoverable in the Opening. The app can already be present, visible, appear on a screen, or otherwise be passively available to notice. Story may not cause the player to manipulate the phone/app or perform another voluntary action merely to reveal it.

## 2. First owning boundary / required correction

Inspect first:
- `runtime-r3/server/provider.js` — `OPENING_STORY_SYSTEM_PROMPT`, `OPENING_PRODUCT_PROMPT`, Opening request construction/order;
- `runtime-r3/domain/memory.js` / opening Story context only if the current request payload needs an explicit structured opening-agency field;
- `runtime-r3/server/opening.js` and callers only to confirm the first-literal boundary and one-Story architecture;
- focused Opening / source-correction tests.

Current prompt contains the right law but live behavior shows that the no-action constraint is not sufficiently dominant/reliably represented at the actual Opening Story boundary.

Correct narrowly so the actual Opening request expresses, with unambiguous precedence:

1. Before the first submitted literal, **PLAYER voluntary-action authority is empty**. Opening owns world/NPC presentation, not player choices.
2. Validated setup facts such as player name/department/rank/first-arrival status may be stated as facts. They are not permission to invent a new voluntary action.
3. Passive perception/exposure is allowed: the unfamiliar private app may already be visible/present/available to notice.
4. Story must not make the player place/pick up/hold/manipulate/tap/open/close/hide the phone or app, move voluntarily, speak/reply, gesture/nod, eat/drink, work/review, decide/accept/refuse, or perform another intentional action before literal input.
5. NPCs may move/speak/initiate normally. The player remains free at the end of Opening with four Story choices + free input.
6. Do not replace the live Story with a deterministic prose template. Story remains the one Story LLM.
7. Do not solve this after generation. The Story request itself must own the correction before Observer.

A narrow structured `opening_player_agency_contract` or equivalent existing-context field is allowed if it makes this precedence explicit. Prefer that over simply adding another vague sentence if current source already contains the same sentence-level prohibition.

If source proof identifies an earlier existing Opening request boundary, fix that instead and explain in the terminal.

## 3. Preserve accepted behavior

Do not regress:
- private unfamiliar `상식개변` app premise and passive discovery;
- NPC ignorance of the private app unless the player later reveals it;
- first-day / first-arrival / selected department and rank identity;
- rich living Company Opening with NPC initiative;
- exactly four full Story choices + free input;
- `bd643fa...` no-invented voluntary PLAYER travel on ordinary turns;
- accepted explicit player navigation and self-stay behavior;
- `ae27e780...` Observer scene re-entry correction;
- temporal `clock_24h` continuity;
- private-app rule-change isolation;
- official announcement ownership;
- S1 closed-world unsupported behavior;
- PLAYER sole issuer and exact S1 subject/counterparty direction;
- S7 / compatibility / exact conflict-copy accepted behavior;
- one Story + one Observer only.

Known separate P1, **not this implementation**:
- fresh Turn 3 in `f235369d...` shows supported S1 `kiss` did not execute same turn for a remote pair; Story stopped at `지금, 뭐라고 하셨죠?`.
- Preserve this as the next known P1 after Opening is live-clean. Do not modify S1 semantics in this task.

Observer re-entry remains live-unproven. Do not broaden into it.

## 4. Forbidden approaches

Do NOT add:
- post-Story regex/keyword deletion or rewriting of player actions;
- a generic action/movement parser, classifier, NER, fuzzy matcher, embeddings router, or semantic validator;
- a deterministic replacement Opening story/template;
- a second Story, second Observer, verifier/repair/reaction LLM;
- retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- generic scene/physical/relation/consent/emotion engine;
- S1 semantic changes in this task;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend executable changes unless directly proven necessary (not expected);
- preserved-game mutation;
- new branch/PR/task file;
- OWNER_READY.

## 5. Deterministic regressions

Add the smallest regressions at the actual Opening Story request/contract boundary.

Required before deploy:
1. Actual Opening request/context has an explicit first-literal agency boundary: no voluntary PLAYER action is authorized before player input.
2. Passive app discovery remains explicitly allowed without player manipulation.
3. The decisive bad shape is explicitly forbidden at the contract level: Story may not make PLAYER put down/pick up/manipulate the phone merely to expose the app.
4. NPC speech/movement/initiative remain allowed.
5. Validated setup identity / first-arrival facts remain allowed without becoming invented action authority.
6. Four Story choices + free input remain unchanged.
7. Ordinary-turn `player_movement_authority_contract` from `bd643fa...` stays green and is not weakened.
8. temporal/private-app-rule-change/official-announcement/S1 closed-world/S7/compatibility/conflict-copy/Observer-reentry focused regressions remain green.
9. No second Story/Observer/verifier/retry path exists.

Do not make tests green with a post-generated Story keyword scanner.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- exactly one full `npm test` after focused green, recording exit and count.

Automated green is not product acceptance.

## 6. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- verify local/remote `main` equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if the unchanged gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version and source SHA.

No DB write, Production, or provider/model/config change.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use the real deployed TEST frontend/UI. Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, direct gameplay API substitute, semantic retry, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Target 2–4 committed turns. Stop at the first reproducible P0/P1.

### A. Opening — decisive gate

PASS requires simultaneously:
- normal first arrival / selected identity / registered Company scene;
- unfamiliar private app is passively present/discoverable;
- NPCs may initiate/speak/move;
- Story does **not** author any voluntary PLAYER action before the first literal, including phone placement/pickup/manipulation, tapping/opening, voluntary movement, speech/reply, gesture/nod, work/review, eating/drinking, decision/accept/refuse;
- no private player thought/decision is invented as visible Story fact;
- four meaningful full choices + free input are available.

Record the exact Opening Story and inspect it semantically. Do not claim PASS merely because no movement occurred.

### B. One ordinary player-chosen action

Only if Opening passes, submit one simple explicit ordinary/social free input or native choice.

PASS:
- Story preserves the actual chosen action;
- the Opening no-action contract does not leak into ordinary turns and block legitimate player action;
- `bd643fa...` ordinary no-invented-travel authority remains intact.

### C. Optional S1 APPLY preservation sanity

Only if no P0/P1 and practical within the same game, activate canonical S1 through visible CSA for 서원희 -> 박정우.

This step is only a preservation sanity check for official issuance / exact direction / private-app isolation. **Do not run the known remote supported-kiss probe in this task.** It is already preserved as the next separate P1 and must not be mixed into this implementation task.

### D. Refresh/re-entry

Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- Opening/committed turn history reconstructs once;
- input/choices remain usable.

For decisive turns record:
`literal/operation -> Story -> observer raw -> observer applied -> durable scene -> next context/UI`.

## 8. Whole-canon observations — measure, do not broaden

During the campaign record but do not fix:
- MM raw -> applied retention/drop;
- player_inner_thought invention/drop;
- dialogue projection drops;
- Story/current-state disagreement;
- player-facing/internal CSA text leakage if naturally visible;
- removed/replaced-rule residue only if naturally encountered.

Known P2 MM reliability remains open. Media/TTS remain paused.

## 9. Next lanes — do not pre-register

After terminal, operator must perform the mandatory independent whole-canon audit before selecting anything.

If Opening is live-clean and no earlier P0/P1 appears, the currently known next P1 is:
`remote supported S1 same-turn execution` — exact `kiss` for the active 서원희 -> 박정우 pair must actually execute in the same Story turn while PLAYER remains remote/stationary; instruction delivery/questioning alone is not execution.

After core P1 closure:
- decisive Observer re-entry live proof if still unproven;
- preserved `성기를 직접 검사 -> genital_touch` semantic-grounding if still independently failing;
- then P2 integrity: removed-rule ghosts -> MM reliability -> player-facing/internal CSA text separation;
- then image/media and TTS acceptance.

Do not mechanically register this roadmap; whole-canon audit chooses the next lane.

## 10. Stop / terminal law

Do not patch during the live campaign.
At first reproducible P0/P1:
- preserve the fresh game READ ONLY;
- record decisive chain;
- set this same task file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

On success:
- set this same file to `WAITING_REVIEW`;
- post exactly one terminal:
`OPENING_NO_INVENTED_PLAYER_ACTION_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`OPENING_NO_INVENTED_PLAYER_ACTION_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the next task. After any deployed browser campaign, operator performs `POST_LIVE_CANON_AUDIT_CONTRACT` before the next CURRENT_TASK.

## 11. Terminal report — 2026-08-25 KST

Terminal:
`OPENING_NO_INVENTED_PLAYER_ACTION_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Execution identity:
- TASK_ID: `company-r3-opening-no-invented-player-action-p1-correction-v1`
- CURRENT_TASK blob SHA at lease: `92a7e0d3075844236257c04150e06dce50dde057`
- expected branch: `main`
- reviewed executable / starting HEAD: `d47f80c8399c3955e10c93593d533aeb253f6385`
- implementation commit: `b719831396436913e4a0ea414064c17040cee1c5`
- terminal control-file commit: this `WAITING_REVIEW` commit, reported with its final SHA in Issue #68

Implementation and validation:
- Narrow Opening precedence correction in `runtime-r3/domain/memory.js` and `runtime-r3/server/provider.js`; regressions in `test/r3-opening-contract.test.mjs` and `test/r3-source-correction.test.mjs`.
- The Opening context now states that voluntary PLAYER action authority is empty before the first submitted literal, validated setup facts are not action authority, passive app discovery requires no player manipulation, and no completed player action may be authored before the first literal.
- The actual Opening prompt places this precedence before generic ordinary-turn consequence wording. No parser, classifier, post-Story rewrite, second LLM, retry, provider/model/config, or deterministic replacement Story was added.
- Focused Opening/source/owner agency tests: 39 passed, 0 failed.
- Broader canon/CSA/turn-kernel/navigation/Observer regression set: 118 passed, 0 failed.
- Exactly one full `npm.cmd test`: 583 passed, 0 failed.
- `node --check` passed for all changed JS/MJS files; `git diff --check` passed.

TEST/live evidence:
- TEST API deployed only through the unchanged contract-gated R3 path from implementation SHA `b719831396436913e4a0ea414064c17040cee1c5`.
- TEST Worker: `game-proxy-company-r3`; version `531e8d43-f977-49e2-9b4b-4d2453909093`.
- Frontend executable source was unchanged; no frontend deploy.
- Exactly one fresh disposable adult-profile browser game: `e5292172-a34e-4be5-972d-a8c48e77d81a`; preserved READ ONLY after the campaign. No reset, second game, direct gameplay API substitute, retry, or regeneration.
- Opening: Day 1 · 09:05, Turn 0; normal first arrival and selected TF-team-lead identity. NPC initiative and dialogue occurred. The unfamiliar `상식개변` app was passively visible on a personal smartphone without player placement/pickup/manipulation. Story explicitly left player action unstarted and provided four choices plus free input. No voluntary PLAYER speech, gesture, movement, touch, work/review, decision, acceptance/refusal, app manipulation, or private player decision was authored.
- Ordinary native choice: `박정우 팀장과 팀원들에게 가볍게 인사하며 "안녕하세요, 반갑습니다"라고 말한다.`
  - Story preserved the selected greeting, produced the expected NPC introductions/reactions, retained the passive app presence, and advanced to Day 1 · 09:08, Turn 1 with four choices and free input. The Opening no-action boundary did not block ordinary player agency.
- Refresh/re-entry: the same game reloaded to Day 1 · 09:08, Turn 1 with the committed greeting Story, same choices, usable free input, and no duplicate Story/Commit.
- Optional S1 sanity was not run because the task explicitly preserves the known remote supported-S1 same-turn P1 as a separate lane; no S1 mutation was introduced here.
- No P0/P1 was reproduced in this campaign. Observer re-entry and the known remote S1 same-turn execution issue remain unproven/open outside this task and require the mandatory independent whole-canon audit.

Operational boundary:
- No DB write, schema/RPC/migration/backfill, Production access, provider/model/config change, or frontend executable change.
- Preserved games/evidence were not modified. Stop here for independent operator whole-canon audit; do not select or register the next task in this session.

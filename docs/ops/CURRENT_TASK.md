# Company — CURRENT TASK

Status: READY
Task ID: company-r3-story-no-invented-player-travel-p1-correction-v1
Mode: TARGETED CORE P1 — STORY PLAYER MOVEMENT / BRIDGING-ACTION AUTHORITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `dd5a8f3efea948b98c07f67fd134a599ca23623a`
Previous task: `company-r3-observer-scene-reentry-presence-p1-correction-v1`
Previous terminal: Issue #68 `5405147548`
Operator / whole-canon review: Issue #68 `5405212633`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserve Observer re-entry implementation: `ae27e7805065118657869ba90a7cf52bc3890982`
Preserve accepted navigation/self-stay implementation: `bdd7a99e2a9a6762f6fb1e315d38b6496d22390a`
Preserve accepted scene reconciliation implementation: `d5a841bb37c8340e40ee421d806bdb37436fcbc4`
Fresh decisive evidence game: `59b3fd24-5889-4d59-a1a9-5ceddb427b72` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`STORY_NO_INVENTED_PLAYER_TRAVEL_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`STORY_NO_INVENTED_PLAYER_TRAVEL_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5405147548`
8. operator whole-canon review `5405212633`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

At minimum preserve READ ONLY:
- `59b3fd24-5889-4d59-a1a9-5ceddb427b72`
- `9fcd03d0-4daf-4fb2-8ae8-fc438a46d6cf`
- `98e070d9-b491-47a9-881b-45dc496a4046`
- all other games already marked preserved in Issue #68.

## 1. Why this task exists — reproducible P1

Fresh game `59b3fd24-5889-4d59-a1a9-5ceddb427b72`:

Turn 2 literal:
`나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`

Turn 2 correctly leaves PLAYER in `brand_strategy_office` while the NPC pair moves to the meeting room.

Turn 3 literal:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

This literal contains the instruction only. It does not choose PLAYER standing, following, walking, entering, approaching the meeting-room door, or knocking.

Actual Story nevertheless authored all of these before delivering the instruction:
- `당신은 자리에서 일어났다.`
- `당신은 회의실 유리문 앞으로 걸어갔다.`
- `당신이 문을 두드리자...`

The supported S1 kiss then executed, but the player action was silently enlarged into a voluntary trip to the remote NPCs. Observer prose consequently described a fabricated player return from the meeting room while durable canonical location stayed the office.

This is a direct P1 under P-AGENCY-001 and the accepted NPC-movement boundary. Remote target location / narrative convenience is not authority to invent PLAYER movement.

## 2. First owning boundary / required correction

Inspect first:
- `runtime-r3/domain/memory.js` `PLAYER_AGENCY_CONTRACT` and Story context construction;
- `runtime-r3/server/provider.js` `STORY_SYSTEM_PROMPT`, `STORY_NPC_MOVEMENT_PROMPT`, Story request construction/callers;
- existing `runtime-r3/domain/navigation.js` only to preserve accepted explicit-player-navigation behavior, not to create another parser;
- focused R3 agency/navigation/S1 tests.

Current source already says remote target / NPC-only movement does not authorize PLAYER follow, but live evidence shows two ambiguous allowances are not sufficiently ordered:
- generic Story consequences may occur `around or after` the chosen beat;
- `npc_movement_boundary` allows an `independently grounded external consequence` exception without explicitly distinguishing an externally caused displacement from a newly authored voluntary PLAYER walk/follow/approach.

Correct the existing Story authority precedence narrowly:

1. The submitted literal is the sole authority for **voluntary PLAYER movement** in the current Story turn.
2. Story may not add standing-up-to-go, following, walking, approaching, entering, accompanying, returning, knocking/door interaction, or another voluntary locomotion/bridge action merely to make a remote target reachable or to deliver a request/instruction.
3. A remote actor/location, NPC movement, prior scene state, S1 authority, or narrative convenience never implies PLAYER follows.
4. `external consequence` may not be interpreted as permission for Story-authored voluntary PLAYER movement. If a truly external world event physically displaces the player without player choice, that is a different externally caused consequence; do not use this exception to author voluntary travel.
5. A remote-target instruction must preserve the instruction without moving PLAYER. Story may use a grounded remote communication channel, allow the target NPC(s) to move/return naturally, or narrate another consequence consistent with canon — but it may not substitute a PLAYER trip.
6. True literal explicit PLAYER navigation remains supported exactly as already accepted.
7. Do not solve this by post-Story deletion/rewrite. Story itself must obey the boundary before Observer.

A narrow structured Story-context field / prompt precedence clarification is allowed. Prefer an explicit player-movement authority contract over more vague prose if it fits the existing context design.

Do **not** build a new semantic movement parser to decide whether movement exists. Existing navigation logic may be preserved/reused where already authoritative, but must not become a new generic classifier or a hard false-negative gate on free-form player movement.

If source proof identifies an even earlier existing Story request boundary, fix that instead and explain it in the terminal.

## 3. Preserve accepted behavior

Do not regress:
- `bdd7a99e...` exact self-stay / NPC-only movement does not become canonical player navigation;
- `d5a841b...` Observer grounded entry/exit reconciliation;
- `ae27e780...` prior membership is baseline-only and Observer must recompute post-Story co-location;
- temporal `clock_24h` continuity;
- private-app rule-change context isolation;
- official announcement ownership;
- S1 closed-world unsupported behavior;
- PLAYER sole issuer and exact S1 subject/counterparty direction;
- supported S1 kiss same-turn execution;
- S7 / compatibility / exact conflict-copy accepted behavior;
- one Story + one Observer only.

The preserved S1 `성기를 직접 검사 -> genital_touch` semantic-grounding P1 remains open but is not this task.
The Observer re-entry P1 correction remains live-unproven; preserve it for opportunistic proof in this campaign, but do not broaden implementation into it.

## 4. Forbidden approaches

Do NOT add:
- a new Korean movement/action parser, NER, fuzzy matcher, embeddings classifier, semantic router, or second parser generation;
- post-Story regex/keyword deletion of player movement;
- narrative rewrite after Story;
- a generic scene graph / movement engine / physical ontology;
- a second Story, second Observer, verifier LLM, reaction LLM, repair LLM;
- semantic retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- S1 family expansion or generic sexual executor;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend changes unless directly proven necessary (not expected);
- preserved-game mutation;
- new branch/PR/task file;
- OWNER_READY.

## 5. Deterministic regressions

Add the smallest regressions at the Story request/contract boundary.

Required before deploy:
1. Story context explicitly states that voluntary PLAYER movement requires the submitted literal; remote target/NPC location/narrative convenience is not movement authority.
2. The `external consequence` wording cannot be read as permission to invent voluntary PLAYER follow/walk/approach.
3. Regression fixture for the decisive shape: current player location office, S1 pair remote in meeting room, literal only instructs 서원희 -> 박정우 kiss. Story contract/request must require PLAYER to remain at canonical location unless the literal itself moves them.
4. Supported S1 same-turn execution remains mandatory; fixing movement must not turn the kiss into confirmation/future deferral.
5. True explicit player navigation fixture remains allowed and existing navigation postcondition stays green.
6. Exact self-stay + NPC pair movement remains allowed and produces no player navigation.
7. `ae27e780...` Observer re-entry request/normalization tests remain green.
8. temporal/private-app/official-announcement/S1 closed-world/S7/compatibility/conflict-copy focused regressions remain green.
9. No second Story/Observer/verifier/retry path exists.

Do not make tests green by introducing a deterministic parser that claims arbitrary free-form literals contain/no-contain movement.

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

Target 4–6 committed turns. Stop at the first reproducible P0/P1.

### A. Opening
- normal first arrival;
- record canonical location/time;
- no invented voluntary player action.

### B. S1 APPLY preservation
Through visible CSA UI activate canonical S1 for exact pair 서원희 -> 박정우.

PASS:
- one official institutional announcement;
- no private-app source/NPC awareness;
- exact PLAYER issuer and actor direction;
- temporal continuity;
- one Story / one Observer / one Commit.

### C. NPC pair leaves / PLAYER self-stay
Submit exactly:
`나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`

PASS:
- PLAYER stays in `brand_strategy_office`;
- if Story moves the pair, durable post-Story membership excludes them;
- no `canonical_navigation_applied` false positive.

If Story does not move the pair, do not retry. Record coverage and continue only if the next beat is coherent without forcing a sample.

### D. Decisive remote-target supported S1 probe
If the pair is remote after C, submit exactly:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

PASS requires simultaneously:
- supported kiss begins/executes in the same Story turn;
- exact subject/counterparty preserved;
- Story does **not** invent PLAYER standing to follow, walking to the meeting room, approaching/entering the meeting room, knocking, accompanying, returning from the meeting room, or any other voluntary bridge travel/action not chosen by the literal;
- canonical PLAYER location remains the office unless the literal explicitly changed it (it does not);
- Story/Observer prose must not claim a fabricated PLAYER trip.

NPCs may remain remote and execute after grounded remote delivery, or may themselves return/move naturally. Do not force either outcome.

### E. Opportunistic Observer re-entry proof
Only if Story D naturally brings 서원희/박정우 physically back into the player's office scene:
- inspect existing read-only evidence path for Observer raw -> applied -> durable membership;
- raw `present_actor_ids` must include both returned actors;
- grounded `entered` should agree when exact evidence exists;
- applied/durable presence and scene_note must describe the same reality.

If Story keeps the pair remote, do NOT retry to obtain re-entry coverage. Record `OBSERVER_REENTRY_LIVE_UNPROVEN` for the mandatory operator audit; that does not by itself fail this no-invented-player-travel task.

### F. Refresh/re-entry
Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- canonical player location and active S1 reconstruct once;
- input/choices remain usable.

For decisive turns record:
`literal/operation -> Story -> observer raw -> observer applied -> navigation intent/postcondition -> durable scene -> next context/UI`.

## 8. Whole-canon observations — measure, do not broaden

During the campaign record but do not fix:
- MM raw -> applied retention/drop;
- player_inner_thought invention/drop;
- exact entered/exited evidence drops;
- Story/current-state disagreement;
- player-facing/internal CSA text leakage if visible;
- removed/replaced-rule residue only if naturally encountered.

Known P2 MM reliability remains open. Media/TTS remain paused.

## 9. Next lanes — do not pre-register

After terminal, operator must perform the mandatory independent whole-canon audit before selecting anything.

If this P1 is closed and no earlier P0/P1 appears:
- if Observer re-entry remains unproven, likely next is a deploy/live acceptance continuation for preserved `ae27e780...`;
- if re-entry is decisively proven in this campaign, likely next P1 is preserved `성기를 직접 검사 -> genital_touch` semantic-grounding / same-turn authority.

Only after P1 closure return to P2 integrity:
1. removed/replaced current-authority ghosts;
2. MM projection reliability;
3. player-facing/internal CSA text separation;
then image/media and TTS acceptance.

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
`STORY_NO_INVENTED_PLAYER_TRAVEL_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`STORY_NO_INVENTED_PLAYER_TRAVEL_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the next task. After any deployed browser campaign, operator performs `POST_LIVE_CANON_AUDIT_CONTRACT` before the next CURRENT_TASK.
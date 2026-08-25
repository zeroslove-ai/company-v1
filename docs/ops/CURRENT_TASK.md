# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-scene-presence-player-movement-integrity-p1-correction-v1
Mode: TARGETED CORE P1 CORRECTION — NPC TRANSITION / PRESENT-ACTOR / PLAYER-MOVEMENT INTEGRITY
Updated: 2026-08-25 KST
Implementation SHA: `d5a841bb37c8340e40ee421d806bdb37436fcbc4`
Final main SHA: pending lifecycle commit
TEST Worker after implementation: `game-proxy-company-r3` / `31eaf5c6-6383-46af-9024-bb6ea8cbba6b`
Fresh disposable live game: `044f71c1-e4da-443e-a186-a01477a1b50f`
Terminal: `SCENE_PRESENCE_PLAYER_MOVEMENT_INTEGRITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`
Blocked reason: the supported kiss turn reproduced a P1 where Story invented player movement into the NPC meeting room although the literal bound only an NPC-to-NPC action.
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `f0451910acceba5dd47a000760188bbe3d1bb175`
Previous task: `company-r3-rule-change-temporal-continuity-live-acceptance-continuation-v1`
Previous terminal: Issue #68 `5404509908`
Operator / whole-canon review: Issue #68 `5404555355`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserved temporal implementation: `b0efb2c56d53dc9e7f85de9953f1ff05a08507dd`
Preserved private-app isolation: `2c6d0be380a891978a163e44400748b6d6362fff`
Preserved S1 closed-world / issuer behavior: `180160ba61195787dfcab254377c922f92f304b5`
Current deployed TEST API: `game-proxy-company-r3` / `302dc331-a4f0-4336-a64d-d72689887104`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`SCENE_PRESENCE_PLAYER_MOVEMENT_INTEGRITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`SCENE_PRESENCE_PLAYER_MOVEMENT_INTEGRITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, implementation PR, or report-only branch.
- Mandatory read order before edit:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
  5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
  7. terminal `5404509908`
  8. operator whole-canon review `5404555355`
  9. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This task is implementation conformance to existing `P-AGENCY-001`, `P-SCENE-001`, and `C-CSA-NAV-001`; it is not a product redesign.
- Preserve the accepted temporal/private-app/S1 closed-world corrections. Do not reopen them without new evidence.

### Preserved evidence — READ ONLY
Never reset/retry/mutate:
- `98e070d9-b491-47a9-881b-45dc496a4046` — fresh temporal campaign; Turn 1 NPC transition/presence contradiction; Turn 2 invented player movement.
- `4457dcab-72f8-4d79-b24d-788c73db8252`
- `51141ee0-60f8-428b-9066-a5a69eb20c4e`
- `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33`
- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324`
- `4261b592-e6b9-44cb-a5a7-05057a22ee83`
- all other games previously marked preserved in Issue #68.

## 1. Why this task exists

The prior deployed temporal lane passed its declared product gate, but mandatory independent whole-canon review found an earlier scene-truth/agency P1 in the same fresh game.

Fresh game `98e070d9-b491-47a9-881b-45dc496a4046`:

### Turn 1 — Story and durable presence disagree
Structured player action was only S1 APPLY. There was no player movement literal.

Story explicitly narrated:
- 박정우 moving toward the meeting room;
- 서원희 following him;
- the meeting-room door closing behind them.

Observer raw nevertheless returned:
- player `location = brand_strategy_office` — correct;
- `exited = []`;
- `present_actor_ids` still containing 서원희 and 박정우 plus all other office actors;
- but `scene_note` itself saying `박정우 팀장과 서원희 차장이 회의실로 이동했다.`

Observer applied preserved that contradiction. Reducer committed the same contradictory structured presence. The committed scene therefore says in natural-language state that the pair left for the meeting room while structured presence says they are still in the player's office location.

### Turn 2 — stale scene causes invented player relocation
Literal:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

No player movement is present in the literal.

Story nevertheless authored the player walking from the office to the meeting room, knocking, entering, and joining them. Observer then projected `brand_strategy_meeting_room`; durable player location changed there.

That violates `P-AGENCY-001`: NPC movement / stale context is not permission to invent player movement.

This new P1 takes priority over the already-preserved S1 `성기를 직접 검사 -> genital_touch` semantic-grounding P1.

## 2. First owning boundary to inspect

Read current:
- `runtime-r3/server/provider.js`
- `runtime-r3/domain/observer-normalizer.js`
- `runtime-r3/domain/reducer.js`
- `runtime-r3/domain/navigation.js`
- Story context / agency contract in `runtime-r3/domain/memory.js`
- focused R3 scene/navigation/source-correction tests.

Prove before editing:
1. `location` is the player's canonical post-Story location, not an arbitrary NPC destination.
2. `present_actor_ids` is intended to represent registered actors physically present in the player's post-Story scene/location.
3. Current Observer contract does not sufficiently require cross-field agreement when a named NPC exits/enters the player's location.
4. Current normalizer validates `entered/exited` separately but accepts any all-registered `present_actor_ids` list wholesale.
5. Reducer replaces durable `scene.present_actor_ids` with that accepted list.
6. Existing player-navigation postcondition already protects explicit literal player movement, but it does not repair a Story that invents player movement to bridge stale NPC location context.

If another earlier existing boundary is proven, fix that smallest boundary and explain why.

## 3. Required correction

Close the current Story -> single Observer -> normalized observation -> durable scene disagreement without adding a new semantic engine.

### A. Observer post-Story scene contract
Make the existing Observer contract explicit that:
- `location` is the player's post-Story canonical location.
- `present_actor_ids` is the exact set of registered actors co-located in that player scene at the end of the Story.
- when current Story explicitly moves a named registered NPC out of the player's current location, that NPC must be represented consistently as exited / absent from `present_actor_ids` when exact grounded transition evidence exists.
- when current Story explicitly brings a named NPC into the player's location, entered / present must agree.
- `scene_note` must describe the same post-Story scene as `location` + `present_actor_ids`; it may mention remote actors/events as history, but must not simultaneously claim an actor left while structured presence keeps that actor physically present.
- NPC-only movement does not move the player.

Do not invent transitions that are not grounded in Story.

### B. Deterministic cross-field consistency at the existing normalizer boundary
Using only already-grounded `entered` / `exited` evidence:
- a grounded `exited` actor must not survive in normalized `present_actor_ids` merely because the raw Observer repeated the old list;
- a grounded `entered` actor must not remain absent from normalized `present_actor_ids` when the raw list contradicts that exact grounded transition;
- record a bounded warning when such reconciliation occurs if useful.

Do NOT infer missing movement from Korean verbs, scene_note text, nearest-name matching, regex/keyword action parsing, NER, or a new semantic parser.

### C. Preserve player movement agency
Reinforce the existing Story hard boundary only as needed:
- NPC movement, remote target location, stale scene context, or the need to execute an NPC-to-NPC S1 action never grants Story permission to make the PLAYER walk/follow/enter/teleport.
- if the literal does not move the player, preserve the player's current canonical location unless a genuinely external Story consequence independently and explicitly moves the player under existing canon; do not invent voluntary follow/entry to make the scene convenient.
- do not globally freeze NPC movement or initiative.

Prefer fixing the stale scene source first. Do not add a generic location hard gate that would prevent legitimate external consequences unless source proof shows it is necessary and still canon-safe.

## 4. Forbidden approaches

- no generic movement/action semantic parser;
- no Korean keyword/regex movement classifier intended to understand Story semantics;
- no NER / nearest-name actor repair;
- no second Observer, verifier, Story, reaction LLM, or scene-state LLM;
- no semantic retry/regeneration/sample-until-pass;
- no post-Story narrative rewrite;
- no generic scene graph, location engine, physical ontology, or NPC scheduler;
- do not suppress all NPC movement to hide the projection defect;
- no provider/model/temperature/token/config/secret workaround;
- no DB/schema/RPC/migration/backfill;
- no Production;
- no new branch/PR/CURRENT_TASK file;
- no preserved-game mutation;
- no OWNER_READY.

## 5. Deterministic regression requirements

Add/adjust the smallest tests proving the real existing boundary.

Required:
1. Observer prompt/contract makes player-location `present_actor_ids` post-Story co-location semantics explicit.
2. Normalizer case: raw `present_actor_ids` wrongly contains an actor with valid grounded `exited`; normalized output removes that actor.
3. Normalizer case: raw `present_actor_ids` wrongly omits an actor with valid grounded `entered`; normalized output includes that actor.
4. NPC-only grounded exit/entry does not change the player's `location` by itself.
5. Reducer commits reconciled presence consistently.
6. Story agency payload explicitly preserves player movement against NPC-only movement/follow convenience; no ordinary literal without player movement is converted into player navigation.
7. Existing true explicit player navigation still works and keeps canonical destination behavior.
8. Existing NPC-only navigation false-positive regression remains green.
9. Existing temporal `clock_24h` / private-app isolation / official announcement / S1 closed-world / supported-kiss / S7 / compatibility / conflict-copy regressions remain green.
10. One Story + one Observer only; no retry/verifier path.

Then:
- changed JS/MJS `node --check`;
- `git diff --check`;
- focused affected tests;
- full repository `npm test` exactly once after focused green, recording deterministic exit result.

Do not claim live semantic compliance from prompt text or synthetic normalization alone.

## 6. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if runtime/server executable source changed;
- use the unchanged repository contract-gated R3 deployment path;
- the operator-approved TEST catalog artifact at Issue #68 `5404426864` may be reused only as the same ephemeral off-repo gate input if TEST DB contract/schema is unchanged;
- if the unchanged gate rejects it, STOP rather than weakening the gate;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact Worker version ID and source SHA.

Forbidden: DB writes, migrations, Production, provider config changes.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use actual deployed TEST frontend/UI.
Create exactly ONE new disposable adult-profile game.
No second game, reset, regenerate, direct gameplay API substitute, semantic retry, or sample-until-pass.
Preserve the game read-only afterward.

Target 4–6 committed turns maximum. Stop at the first reproducible P0/P1.

### A. Opening
- normal first arrival;
- record starting canonical player location/time;
- no invented player action.

### B. S1 APPLY preservation gate
Through visible CSA UI activate canonical S1 for exact pair 서원희 -> 박정우.

PASS:
- temporal/private-app/issuer corrections remain intact;
- exactly one official announcement / Story / Observer / Commit;
- record Story NPC movements, if any, and full observer raw/applied/durable scene chain.

If Story moves any named NPC out of the player's current location, durable `present_actor_ids` and scene_note must agree with that movement while player location stays unchanged unless the literal moved the player.

### C. NPC-only movement / self-stay probe
Submit one literal that clearly keeps the player in place while referring to NPC movement, preferably:
`나는 제자리에 서서 서원희 차장과 박정우 팀장이 브랜드전략 회의실로 이동하는 모습을 지켜본다.`

This literal is not automatic proof that the NPCs comply/move; Story may react naturally. But the PLAYER self-state/movement is unambiguous.

PASS:
- Story must not make the player follow, enter, accompany, or teleport.
- if Story actually moves either NPC, observer raw/applied/durable presence must reflect the exact post-Story player scene consistently.
- if Story does not move them, do not retry; simply record that the transition branch was not naturally exercised and continue.

### D. Supported S1 kiss after the movement probe
Submit:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

PASS:
- supported action executes same Story turn as previously accepted;
- actor/target direction preserved;
- PLAYER is not moved merely to make the NPC-to-NPC instruction convenient;
- durable player location changes only if the literal actually moved the player or a canonically grounded external consequence truly does so, never because Story invented voluntary follow/entry.

Do NOT probe `성기를 직접 검사` in this task. Its existing semantic-grounding P1 remains the expected next lane after this task + mandatory whole-canon audit.

### E. Refresh / re-entry
If no P0/P1 has occurred, one deliberate refresh/re-entry:
- no duplicate Story/Commit;
- exact durable player location/presence reconstructs;
- active S1 reconstructs once;
- input/choices remain usable.

For decisive turns record:
`literal / structured operation -> Story -> observer raw -> observer applied -> durable location/presence/scene_note -> next Story/context -> UI`.

## 8. Whole-canon observations — measure, do not broaden

Record but do not fix in this task:
- MM raw -> applied retention/drop count;
- player_inner_thought raw invention/drop warnings;
- opening/ordinary choice projection drops if observed;
- removed/replaced-rule current-authority residue only if naturally encountered;
- player-facing/internal CSA text leakage if visible.

Known P2 from latest fresh game:
- MM raw 12 entries / applied 7 / dropped 5; Turn 1 lost all five legacy-string entries.
- player-thought invention was safely dropped on Opening and supported-kiss turn.

Media/TTS remain paused.

## 9. Known next lanes — do not pre-register

Only after this task's deployed browser terminal and mandatory operator whole-canon audit:

If no earlier P0/P1 remains, expected next P1:
`S1 supported 성기 직접 검사 semantic grounding -> genital_touch same-turn authority`.

After all P1 closure, expected P2 order remains:
1. removed/replaced current-authority ghosts;
2. MM structured-output reliability;
3. player-facing/internal CSA text separation;
then media/TTS acceptance.

## 10. Terminal report contract

Report:
- start / implementation / final main SHA;
- exact changed files;
- proven first owning boundary;
- exact Observer scene-presence contract changes;
- any deterministic entered/exited vs present reconciliation and warnings;
- proof no generic parser/NER/retry/second LLM was added;
- focused/full tests and deterministic full-suite exit result;
- TEST Worker version/deploy counts;
- fresh game ID;
- Opening location/time;
- S1 APPLY Story NPC movement + observer/durable chain;
- self-stay/NPC movement probe result;
- supported-kiss player-location result;
- refresh result;
- MM/player-thought/choice P2 measurements;
- new P0/P1/P2/P3 findings;
- all forbidden counts.

At first new reproducible P0/P1 during live campaign: preserve the fresh game, do not patch, terminalize BLOCKED.

Success:
`SCENE_PRESENCE_PLAYER_MOVEMENT_INTEGRITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked:
`SCENE_PRESENCE_PLAYER_MOVEMENT_INTEGRITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task. Operator must perform the mandatory post-live whole-canon audit before choosing the next lane.

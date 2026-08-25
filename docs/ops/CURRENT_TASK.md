# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-navigation-actor-binding-self-stay-p1-continuation-v1
Mode: TARGETED CORE P1 CONTINUATION — DETERMINISTIC PLAYER-NAVIGATION ACTOR BINDING
Updated: 2026-08-25 KST
Implementation SHA: `bdd7a99e2a9a6762f6fb1e315d38b6496d22390a`
Final main SHA: `ef34b8abebfe0a3d348465d5040d1a30efc1ee60`
TEST Worker after implementation: `game-proxy-company-r3` / `34d9b74f-55f5-4ff1-93db-c5ad6cdd3a0d`
Fresh disposable live game: `9fcd03d0-4daf-4fb2-8ae8-fc438a46d6cf`
Terminal: `NAVIGATION_ACTOR_BINDING_SELF_STAY_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`
Acceptance result: deterministic exact-actor navigation fix and one fresh browser campaign through refresh passed with no new P0/P1.
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `3eb8b2a6a41f24cb085d21f0ddbc0cca12bbe80e`
Previous task: `company-r3-scene-presence-player-movement-integrity-p1-correction-v1`
Previous terminal: Issue #68 `5404685629`
Operator / whole-canon review: Issue #68 `5404716437`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserved partial implementation: `d5a841bb37c8340e40ee421d806bdb37436fcbc4`
Current TEST Worker: `game-proxy-company-r3` / `31eaf5c6-6383-46af-9024-bb6ea8cbba6b`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`
Fresh blocked game: `044f71c1-e4da-443e-a186-a01477a1b50f` — READ ONLY

Success terminal:
`NAVIGATION_ACTOR_BINDING_SELF_STAY_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`NAVIGATION_ACTOR_BINDING_SELF_STAY_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

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
  7. terminal `5404685629`
  8. operator whole-canon review `5404716437`
  9. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This is conformance to existing `P-AGENCY-001`, `P-SCENE-001`, and especially `C-CSA-NAV-001`; it is not a product redesign.
- Preserve accepted temporal/private-app/S1 closed-world behavior and the useful `d5a841b...` Observer/normalizer presence reconciliation. Do not reopen them without new evidence.

### Preserved evidence — READ ONLY
Never reset/retry/mutate:
- `044f71c1-e4da-443e-a186-a01477a1b50f` — decisive current evidence.
- `98e070d9-b491-47a9-881b-45dc496a4046`
- `4457dcab-72f8-4d79-b24d-788c73db8252`
- `51141ee0-60f8-428b-9066-a5a69eb20c4e`
- `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33`
- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324`
- `4261b592-e6b9-44cb-a5a7-05057a22ee83`
- all other games previously marked preserved in Issue #68.

## 1. Why this task exists — first broken boundary is now proven

Fresh game `044f71c1-e4da-443e-a186-a01477a1b50f`, Turn 2 literal:

`나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`

Story correctly kept PLAYER seated in `brand_strategy_office` while only 서원희 / 박정우 moved to the meeting room.

Observer raw/applied were also correct:
- `location = brand_strategy_office`;
- `exited = [heroine1, general_park_jungwoo]` with grounded quotes;
- `present_actor_ids = [heroine2, heroine3, heroine4, heroine5]`;
- `scene_note` described the remaining office scene.

But `state_after.scene` was deterministically overwritten to:
- `location_id = brand_strategy_meeting_room`;
- `present_actor_ids = []`;
- warning `canonical_navigation_applied`.

Current `runtime-r3/domain/navigation.js` explains the corruption:
- `resolvePlayerNavigationIntent()` scans a whole movement clause;
- `PLAYER_BINDING` only asks whether `나는/내가/제가/...` occurs anywhere in that clause;
- the exact live sentence has leading `나는`, exact NPC names, a meeting-room location, and NPC-owned `이동` in the same clause;
- therefore the resolver can classify the meeting-room destination as `player_navigation` even though the movement predicate belongs to the NPC subject group `서원희 차장과 박정우 팀장이`.

`applyNavigationPostcondition()` then overwrites the already-correct Story/Observer player scene.

Turn 3's visible Story invention (`당신은 ... 회의실로 걸어간다`) is downstream evidence. The first broken boundary is the deterministic Turn-2 navigation actor binding, not stochastic Story quality.

This is exactly prohibited by `C-CSA-NAV-001`: NPC movement/location is insufficient to create player navigation.

## 2. First owning boundary / required correction

Inspect first:
- `runtime-r3/domain/navigation.js`
- existing R3 navigation tests, especially `test/r3-owner-p0-contract.test.mjs`
- current callers that project navigation context and apply navigation postconditions.

Fix the **existing resolver's actor binding** at the smallest boundary.

Required semantics:
1. A player mention or player self-state elsewhere in a sentence/clause must not capture a movement predicate that is explicitly owned by exact canonical named NPC subject(s).
2. The exact fresh literal above MUST resolve to `null` player navigation.
3. A literal such as `나는 서원희가 브랜드전략팀 회의실로 이동하는 모습을 본다.` MUST not become player navigation.
4. True explicit player movement MUST remain deterministic, e.g. `나는 브랜드전략팀 회의실로 이동한다.`
5. Existing explicit player-to-character travel MUST remain supported, e.g. `나는 서원희에게 간다.` using current catalog ownership.
6. Mixed sequential clauses must still allow a later real player movement, e.g. `서원희 차장은 회의실로 이동한 뒤 나는 직원 라운지로 이동한다.` -> player destination `employee_lounge`.
7. Do not rely on Story/Observer/scene_note text to repair this input classification after the fact.
8. `projectNavigationContext()` / `applyNavigationPostcondition()` must remain authoritative only when a valid player-navigation intent was actually resolved.

Implementation should use the existing exact canonical actor directory / existing navigation resolver structure. A narrow exact actor-subject ownership refinement is allowed. Do not create a new general Korean semantic parser.

## 3. Preserve the partial scene-presence correction

Keep `d5a841b...` behavior unless source proof requires a tiny compatibility adjustment:
- grounded `exited` actor cannot survive raw stale `present_actor_ids`;
- grounded `entered` actor cannot remain absent;
- Observer location remains the player's post-Story canonical location;
- NPC-only movement does not itself change player location.

Do not undo the fresh Turn-2 raw/applied success merely to make navigation tests pass.

## 4. Forbidden approaches

- no new generic movement/action semantic parser;
- no fuzzy NER, nearest-name repair, embedding classifier, LLM classifier, or second parser generation;
- no broad Korean keyword/regex taxonomy that attempts to understand arbitrary action semantics;
- no second Story, Observer, verifier, reaction LLM, or scene-state LLM;
- no semantic retry/regeneration/sample-until-pass;
- no post-Story narrative rewrite;
- no generic scene graph/location/physical engine;
- no suppress-all-NPC-movement workaround;
- no provider/model/temperature/token/config/secret workaround;
- no DB/schema/RPC/migration/backfill;
- no Production;
- no new branch/PR/CURRENT_TASK file;
- no preserved-game mutation;
- no OWNER_READY.

## 5. Deterministic regressions

Before live deploy, add the smallest tests proving the actual bug and controls.

Required:
1. Exact fresh literal:
   `나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`
   -> `resolvePlayerNavigationIntent(...) === null`.
2. Player-observes-NPC movement variant with exact canonical actor -> null.
3. True explicit player movement to `brand_strategy_meeting_room` -> valid player navigation.
4. `나는 서원희에게 간다.` remains valid explicit player navigation.
5. NPC movement followed by a separate explicit player movement still resolves the player's later destination.
6. When navigation intent is null, a correct Observer office location/presence is not replaced by `applyNavigationPostcondition`.
7. Existing `d5a841b...` entered/exited/present reconciliation regressions remain green.
8. Existing NPC-only navigation false-positive tests, temporal `clock_24h`, private-app isolation, official announcement, S1 closed-world/issuer, supported kiss, S7, compatibility/conflict-copy regressions remain green.
9. Architecture remains one Story + one Observer, no retry/verifier.

Then:
- `node --check` changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- full repository `npm test` exactly once after focused green, recording deterministic exit result.

Do not claim product acceptance from deterministic tests alone.

## 6. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if runtime executable source changed;
- use the unchanged repository contract-gated R3 deploy path;
- if local `psql` is unavailable and TEST schema/contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if the unchanged gate rejects it, STOP rather than weakening the gate;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version and source SHA.

Forbidden: DB writes/migrations, Production, provider/model/config changes.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use actual deployed TEST frontend/UI.
Create exactly ONE new disposable adult-profile game.
No second game, reset, regenerate, direct gameplay API substitute, semantic retry, or sample-until-pass.
Preserve it read-only after campaign.

Target 4–6 committed turns maximum. Stop at first reproducible P0/P1.

### A. Opening
- normal first arrival;
- record canonical player location/time;
- no invented player action.

### B. S1 APPLY preservation gate
Through visible CSA UI activate canonical S1 for exact pair 서원희 -> 박정우.

PASS:
- accepted temporal/private-app/issuer behavior remains intact;
- exactly one official announcement / Story / Observer / Commit.

### C. Exact self-stay + NPC movement regression
Submit exactly:
`나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`

This is the decisive gate.

PASS requires:
- Story does not move/follow/enter/teleport PLAYER;
- if Story moves the NPC pair, Observer raw/applied `exited/present_actor_ids/scene_note` agree with the player-office post-scene;
- durable player `location_id` remains the pre-turn player location;
- `canonical_navigation_applied` MUST NOT appear for this literal;
- correct Observer player-scene state must not be overwritten by navigation postcondition.

If Story happens not to move the NPCs, do not retry. The resolver result and resulting state still must not create player navigation; record the coverage gap and continue only if no P0/P1.

### D. Supported S1 kiss after the self-stay turn
Submit:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

PASS requires:
- supported action executes in the same Story turn;
- actor/target direction preserved;
- PLAYER is not moved merely to make the NPC-to-NPC instruction convenient;
- if the NPC pair is remote from PLAYER, Story may use any natural grounded communication/scene consequence consistent with the current scene, but may not invent voluntary PLAYER travel;
- durable player location remains coherent with Story/Observer.

If Turn D still invents player movement despite a correct Turn-C canonical state, STOP at that new P1; do not patch/retry in the same campaign. That would prove a separate remaining Story-boundary problem.

Do NOT probe `성기를 직접 검사` in this task. Its preserved semantic-grounding P1 remains later unless this campaign/audit finds another earlier P0/P1.

### E. Refresh / re-entry
Only if no P0/P1:
- perform one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- durable player location/presence reconstructs exactly;
- active S1 reconstructs once;
- input/choices remain usable.

For decisive turns record:
`literal / structured operation -> Story -> observer raw -> observer applied -> navigation intent/postcondition -> durable location/presence/scene_note -> next Story/context -> UI`.

## 8. Whole-canon observations — measure, do not broaden

Record but do not fix:
- MM raw -> applied retention/drop evidence where practical;
- player_inner_thought invention/drop warnings;
- choice projection drops;
- removed/replaced-rule residue only if naturally encountered;
- player-facing/internal CSA copy leakage if visible.

Known P2 remains MM reliability. Media/TTS remain paused.

## 9. Known next lanes — do not pre-register

After terminal, operator must run mandatory whole-canon audit before selecting anything.

If this deterministic navigation corruption is closed and no earlier P0/P1 appears, likely remaining P1 order is:
1. any separate Story-level invented-player-movement defect proven after correct navigation state;
2. preserved S1 `성기를 직접 검사 -> genital_touch` semantic-grounding same-turn authority defect.

Only after P1 closure return to P2 integrity:
1. removed/replaced current-authority ghosts;
2. MM projection reliability;
3. player-facing/internal CSA text separation.

Then media/TTS acceptance.

## 10. Stop / terminal law

Do not patch during the live campaign.
At first reproducible P0/P1:
- preserve fresh game read-only;
- record decisive cross-boundary chain;
- set this same file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires deterministic resolver fix + one fresh deployed browser campaign through refresh with no new P0/P1.

On success terminal:
`NAVIGATION_ACTOR_BINDING_SELF_STAY_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

On blocker/failure terminal:
`NAVIGATION_ACTOR_BINDING_SELF_STAY_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the next task. Operator must perform `POST_LIVE_CANON_AUDIT_CONTRACT` review first.

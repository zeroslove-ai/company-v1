# Company v1 — CURRENT TASK

Status: READY
Task ID: user-live-25turn-spine-integrity-v1
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place on `main`. Do not create a new CURRENT_TASK file or a new ops/task-registration branch.

## 0. Owner review / why this task exists

The fresh Level-7 manual acceptance game was actually played by the owner and is now preserved regression evidence:

- TEST project: `fmcrspgxstsmxxsmkeee`
- preserved game: `587de547-8bb7-4a92-a7c2-07f2831e2d38`
- public URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=587de547-8bb7-4a92-a7c2-07f2831e2d38`
- observed committed turns: `25`
- observed save revision: `27`

The owner reports that general play feel improved, but the 25-turn evidence shows the remaining failures are not isolated content glitches. They are a single structural class: **the Story -> Extract -> reducer -> Commit boundary and the Story contract are still internally inconsistent.**

Binding architecture remains the latest repository canon, especially:

1. `CURRENT_TRUTH.md`
2. `AGENTS.md`
3. `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
6. `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`
7. `docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`
8. this CURRENT_TASK

Do not treat old completion reports or the raw test count as authority.

## 1. Frozen registration / branch rule

Use the exact `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA` from the latest Issue #68 `CURRENT_TASK_READY` comment for this Task ID.

At execution start:

1. fresh-fetch `origin/main`;
2. require the exact registered main SHA/blob from Issue #68;
3. require the registration change from pre-registration main `28fae5c07f4930cab95c44f565ffd298b60ac3ec` is only this existing `docs/ops/CURRENT_TASK.md`;
4. require the preserved manual game exists read-only and do not mutate it;
5. if main has unexpected source/config/content/migration drift, STOP `BLOCKED_USER_LIVE_25TURN_DRIFT` rather than guessing.

Implementation branch:

`company/user-live-25turn-spine-integrity-v1`

A normal implementation branch is authorized. A new ops/task-registration branch is not.

Create or reuse exactly one Draft PR for this task. Do not merge it. Stop at `WAITING_REVIEW`.

## 2. Verified 25-turn evidence — treat as regression facts

These facts were independently read from TEST and current main source before task registration.

### 2.1 Extract is whole-object fragile

Across 25 committed turns:

- Extract `outcome=degraded`: **13/25**
- blank `game_turns.turn_summary`: **13/25**
- degraded turns: `2,4,6,9,11,12,14,16,17,19,20,21,25`
- warnings include `extract_invalid_json`, `INVALID_EXTRACT_OBSERVATION`, and `SCENE_EVIDENCE_QUOTE_NOT_IN_STORY`.

Current `buildDegradedExtractObservation()` drops summary, Mind Monitor, player observation, NPC observations and scene observation together. This violates the current canon: one malformed optional projection must not erase other valid optional outputs from a correct Story.

Current regression tests also incorrectly protect the old behavior: `test/extract-observation-contract.test.mjs` explicitly asserts that scene quote mismatch throws `SCENE_EVIDENCE_QUOTE_NOT_IN_STORY`. That test must be rewritten to the current field-local fail-open contract; do not preserve the obsolete behavior merely to keep it green.

### 2.2 Mind Monitor is incorrectly coupled to Story THOUGHT

Five successful Extract turns (`8,13,18,22,23`) contained non-empty `extract_delta.mind_monitor` but committed `game_turns.mind_monitor={}`.

Root cause in current source: `playerOwnedMonitor()` in `src/engine/runtime-core/commit-reducer.js` drops an NPC Mind Monitor when its surface/subconscious text equals `parsedStory.player_inner_thought`.

That textual equality is not a canonical ownership rule. Mind Monitor is presentation-only and must not require exact Story provenance or semantic comparison against player THOUGHT.

### 2.3 Story THOUGHT ownership is visibly wrong

The Story system prompt says `[THOUGHT]` is player-only, but the actual 25-turn Story repeatedly placed heroine3/Jena first-person private thoughts into the marker. The parser then stored them as `parsed_blocks.player_inner_thought`, and the frontend displays them as **player inner thought / 플레이어 속마음**.

This is a visible semantic inversion and also triggers the Mind Monitor false-drop above.

Do not add a runtime LLM/classifier to decide whose thought prose resembles. The fresh Story contract itself must make NPC private thought unavailable in the Story THOUGHT channel; NPC inner interpretation belongs to the post-Story Mind Monitor sidecar.

### 2.4 Player clothing/sexual state is a zombie writer path

All 25 Extracts had `player_observation.physical=null` and `player_observation.sexual=null`.

Yet Story explicitly established player undressing, nudity, erection and prolonged sexual activity. Through turn 25 the durable player state still showed:

- all four player clothing slots `worn`;
- arousal `0`;
- ejaculation progress `0`;
- ejaculation count `0`;
- updated turn effectively unchanged.

The frontend actively renders player clothing plus arousal/erection/ejaculation values. Therefore the narrow player clothing/sexual mechanic is retained in this cut and must become one coherent fresh writer path. Do **not** reintroduce a sexual-event ledger, relationship effects, generic sexual action taxonomy or permission semantics.

Any visible sexual-event history/count UI or source residue that has no current fresh writer must be caller-inventoried and deleted rather than resurrecting a ledger.

### 2.5 NPC `position_label` writer is internally contradictory

Successful Extracts proposed physical position changes, but heroine3 durable `position_label` remained null throughout all 25 turns.

Current `physical-state.js` requires the exact evidence quote to contain the character's full canonical name. Live Story naturally uses `제나`, while canonical name is `김제나`, so valid actor-scoped evidence can be rejected even though `character_id=heroine3` already proves identity.

Current posture code says evidence failure should not silently revert a valid proposal, while the upstream physical gate discards it first. That is a contradictory contract.

For this cut, retain at most one free natural-language `position_label` because there is a current frontend/next-Story continuity consumer. Remove/ignore closed posture grammar or duplicate physical authority where it is not independently required. Use the same actor-scoped evidence vocabulary as clothing; do not add another position verifier.

### 2.6 Exact CSA clothing mechanic and same-turn Story disagree

Turn 1 activated the exact `work_nude` clothing mechanic. The committed Story still said heroine3 was in uniform, while the same turn's post-save deterministically set all required clothing slots to `removed`.

The exact finite CSA mechanical state is allowed to be deterministic. The same Story turn must be given enough exact transition information to narrate a result consistent with the deterministic post-state. Do not introduce a generic enactment planner or infer clothing from rule prose.

### 2.7 CSA narrative scope is being over-expanded

The active rule in this game says only:

`회사 여성 직원은 상대방이 구체적인 성적 행동을 요구하면 그 행동을 즉시 시작해야 한다.`

The live Story repeatedly generalized this into claims equivalent to broad/indefinite obedience, inability to stop, body ownership, or continued compliance merely because the act started.

The current canon is exact: an active/applicable rule is in force, but it changes **only what it states**. `즉시 시작` does not mean indefinite continuation, unrelated acts, general obedience, ownership, affection, trust, comfort, arousal, or permission.

Fix this in the compact Story premise contract and scenario regressions. No consent matrix, no semantic verifier, no generic CSA DSL.

### 2.8 Canonical scene cast and Story witnesses diverge

Canonical scene stayed on `present_npc_ids=["heroine3"]`, but Story mentioned `다른 직원` in **22/25** turns and repeatedly used those untracked people as witnesses/reaction context. One Extract even attributed an `other employees` sentence as heroine3's scene evidence.

Fresh Story may use environmental ambience, but an unregistered/absent background person must not become a material local actor, witness, responder, privacy constraint or continuity fact when canonical scene does not contain that actor. Keep scene authority structural; do not add fuzzy NPC search or another cast classifier.

### 2.9 Deterministic time fact is being mistranslated by Story

The game clock was numerically correct (e.g. pre-turn around minute 733 = 12:13, later 13:xx), but Story rendered noon/afternoon as `오전 12시...`, `오전 1시...`.

Story currently receives raw `minute_of_day`, forcing the model to do clock conversion. Project an exact deterministic display clock (prefer 24-hour `HH:mm` or an equivalently unambiguous formatted value) from the same canonical time authority and tell Story to use it as fact. Do not create a second time authority.

### 2.10 Story progression/repetition still loops

The last 10 turns show repeated staging instead of meaningful progression even after direct executable requests. Across the 40 choices from turns 16-25:

- 9 choices contain waiting language;
- 7 contain start/restart language;
- 7 contain `계속`;
- 7 contain `끝까지`.

Turn 24 explicitly requested an extreme outcome, yet choices returned `시작해볼까`-style staging while the act had already been ongoing for many turns; turn 25 continued the same setup without resolving it.

Across all 25 Story turns repeated motifs are also excessive: `규정이니까` 18 occurrences, `버티*` 19, `적갈색 장발` 24, `귀 끝` 15, `아랫입술` 18, `책상 가장자리` 17.

Do not add phrase blacklists. Restore the existing Story progression principle in a compact provider contract: when a requested action is executable, advance it to a meaningful same-turn consequence; do not repeatedly restart, wait, re-ask, or restate unchanged appearance/gesture beats just to avoid progression.

## 3. One coherent implementation cut

This task is intentionally **not** ten hotfixes. Implement one reduced fresh contract with the following boundaries.

### A. Fresh Extract / evidence reduction

1. Make optional normalization **field-local fail-open**.
   - malformed root JSON may still produce the bounded degraded fallback;
   - malformed/unknown optional scene evidence drops only the scene projection and records a warning;
   - malformed actor evidence drops only that actor/field projection;
   - retired/unknown semantic vocabulary is ignored/warning-dropped, never normalized into authority, and must not erase summary/Mind Monitor/other valid narrow fields;
   - a correct Story must still Commit.
2. Preserve `turn_summary` and `mind_monitor` independently of scene/physical evidence validity whenever their JSON fields are readable.
3. Collapse current parallel physical/evidence paths into **one actor-scoped evidence vocabulary** directly consumed by retained reducers. Actor ID is explicit; quote is one exact Story substring; changed narrow fields sit next to that evidence. Do not add translation chains or semantic heuristics.
4. Remove the exact-full-name substring requirement once canonical `actor_id/character_id` and exact Story quote already establish provenance.
5. Retain compact clothing plus one free `position_label` only; do not expand posture/contact/action enums.
6. Retain the narrow player sexual meter only: arousal/erection/progress/count as currently justified by active UI. It must update from the same player-scoped fresh evidence path. Do not create sexual event history to support stale UI.
7. Caller-inventory stale `src/engine/sexual-state/ledger.js` and related presentation readers. Delete only if no current fresh/replay caller exists; if a real historical reader exists, keep it historical/read-only and keep it out of fresh Story/Extract authority.

### B. Mind Monitor / THOUGHT separation

1. Remove `playerOwnedMonitor()`-style textual ownership adjudication from Commit.
2. Keep only structural scene/registered-ID presentation filtering for Mind Monitor.
3. Mind Monitor has no exact quote requirement, never changes Commit success, and is never fed back as durable narrative meaning.
4. Strengthen the fresh Story protocol so `[THOUGHT]` is explicitly the player's private reaction only; NPC private inner monologue must not be emitted in Story THOUGHT and belongs to Extract Mind Monitor.
5. Do not add a semantic thought classifier or second LLM call.

### C. Story fact/progression contract cleanup

1. Exact CSA scope:
   - applicable rule is genuinely in force;
   - exact content only;
   - `start` is not `continue forever`;
   - no unrelated obedience/ownership/consent/comfort/affection/trust/romance/arousal/permission.
2. Exact finite CSA clothing transition:
   - project only structured `clothing_state.required_state` mechanics;
   - same activation turn Story must not end in a clothing fact that contradicts deterministic Commit post-state;
   - no generic mandatory-enactment planner.
3. Scene cast:
   - only canonical scene actors may become material local participants/witnesses/responders;
   - ambient text must not fabricate continuity-relevant people outside canonical presence.
4. Time:
   - derive one unambiguous formatted clock from canonical `minute_of_day` and project it to Story;
   - remove the need for provider 12-hour conversion guesses.
5. Progression:
   - executable explicit action -> meaningful same-turn result/consequence;
   - no default wait/prepare/restart/ask-again loops;
   - do not repeatedly restate unchanged character appearance, clothing, or signature gestures merely because they appeared in recent history.
6. Player agency remains literal. Story may decide response/outcome, but may not add an unrequested player material action or silently substitute actor/target/action.

### D. Memory/readback

The current older-turn raw Story fallback for blank summary is retained. Do not add a second summarizer or event ledger.

Because 13/25 summaries were blank, the new Extract contract must make summary independent of unrelated optional evidence failures. A blank summary may still fail-open, but it must not be caused by a bad scene/actor projection.

## 4. Required test changes

Treat old tests as KEEP / REWRITE / DELETE against the current canon.

At minimum:

1. **REWRITE** the current scene-evidence test that expects `SCENE_EVIDENCE_QUOTE_NOT_IN_STORY` to reject the whole observation. New invariant: bad scene evidence warning-drops scene only while valid summary/Mind Monitor/other actor observation survives.
2. Add a mixed-validity Extract fixture proving one bad actor/scene field cannot blank another actor, summary, Mind Monitor or the Story turn.
3. Add a Mind Monitor regression proving a valid NPC Mind Monitor is not deleted because its text resembles/equal Story THOUGHT.
4. Add a Story prompt/protocol regression that NPC private thought is not an authorized Story THOUGHT channel. Do not implement semantic runtime classification to satisfy this test.
5. Add player evidence regressions for:
   - player clothing undress persists;
   - explicit erection/sexual delta persists through the retained narrow reducer;
   - actor mismatch still cannot update another actor.
6. Add natural-name NPC position regression: canonical actor ID + exact quote using a natural short display name must be sufficient; exact full-name substring is not an independent gate.
7. Add exact CSA activation-turn clothing consistency contract using structured required state.
8. Add exact CSA scope prompt regression proving `start` does not imply indefinite continuation/general obedience.
9. Add current-scene cast contract regression preventing material unnamed local witnesses when they are not canonical scene actors.
10. Add deterministic clock projection regression for noon/13:xx values.
11. Add progression/prompt regression that the current Story system instructions explicitly prohibit repeated preparation/wait/restart loops for an executable direct request. Do not make phrase-count runtime gates.
12. Keep literal exact-four choice round-trip and replay/readback tests intact.

Run focused tests for the touched contracts. Run the full suite as a regression signal, but triage failures against current canon; raw N/N is not the acceptance authority.

## 5. Explicitly deferred / do not scope-creep

The following were observed but are not part of this core cut unless the implementation directly exposes a necessary tiny presentation change:

- all 25 turns had `choice_labels=null`; current UI derives button labels from the first ~5 characters of the literal choice. Record as a separate presentation issue; do not invent a semantic choice router in this cut.
- CSA app transactions currently consume committed gameplay turns. This run proves that fact but does not by itself prove the lifecycle must be redesigned. Do not redesign app transaction turn accounting here.
- provider marker slippage such as an escaped `\\[DIALOGUE` that the current parser recovered is not a standalone architecture cut.
- a player `attempt` becoming a plausible Story success is not automatically a bug; Story remains outcome author where no exact mechanic predetermines the result.
- TTS/image/media/provider/model changes are out of scope.

## 6. Safety / preservation

Absolute prohibitions:

- do not mutate/reset/reseed/replay-revise preserved game `587de547-8bb7-4a92-a7c2-07f2831e2d38`;
- do not mutate/reset preserved games `9755b57b-5cbb-44dd-a624-020fe516c16d`, `78fb1d94-266f-455a-bda4-7656cc2370c1`, or dedicated template `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- no Production / hospital-v2 access;
- no TEST DB write, reset, migration or DDL;
- no API/frontend deploy;
- no merge / Ready transition;
- no provider/model switch;
- no retry/regeneration-until-lucky strategy;
- no new parser generation;
- no semantic router/classifier/verifier;
- no consent matrix;
- no relationship/event/emotion/open-fact ledger;
- no generic physical/sexual action grammar;
- no generic CSA execution DSL;
- no new CURRENT_TASK file;
- no new ops/task-registration branch.

Read-only TEST evidence inspection is allowed if needed, but the preserved manual game is immutable evidence.

## 7. Deliverables / stop boundary

Deliver:

1. exact start SHA and final SHA;
2. exact changed-file list;
3. one concise authority map showing what was deleted/retained;
4. Extract mixed-validity/fail-open proof;
5. Mind Monitor/THOUGHT separation proof;
6. player clothing/sexual writer proof;
7. position evidence proof or explicit deletion proof if a stronger caller inventory contradicts the pre-task consumer finding;
8. exact CSA scope + activation-turn clothing consistency proof;
9. scene-cast/time/progression prompt contract proof;
10. test KEEP/REWRITE/DELETE notes for affected tests;
11. focused test results, full-suite regression result, syntax checks, `git diff --check`;
12. one Draft PR, OPEN / DRAFT / UNMERGED;
13. zero DB/deploy/live-game mutation proof.

On completion:

- update the branch copy of this same `docs/ops/CURRENT_TASK.md` to `Status: WAITING_REVIEW` with evidence;
- post one Issue #68 terminal report:
  - `EXECUTION: WAITING_REVIEW`
  - `TASK_ID: user-live-25turn-spine-integrity-v1`
  - exact start/final SHA
  - Draft PR number/head
  - focused/full test results
  - preserved game untouched proof
  - classification `USER_LIVE_25TURN_SPINE_INTEGRITY_READY`
- STOP.

Do not merge, deploy, write TEST, run automated gameplay, register another task, or self-approve the product behavior.

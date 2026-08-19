# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: user-live-25turn-spine-integrity-v1
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place on `main`. Do not create a new CURRENT_TASK file or a new ops/task-registration branch.

## 0. Owner review / why this task exists

The fresh Level-7 manual acceptance game was actually played by the owner and is preserved regression evidence:

- TEST project: `fmcrspgxstsmxxsmkeee`
- preserved game: `587de547-8bb7-4a92-a7c2-07f2831e2d38`
- public URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=587de547-8bb7-4a92-a7c2-07f2831e2d38`
- committed turns: `25`
- save revision observed after play: `27`

The owner reports that general play feel improved but explicitly rejects the remaining stale/missing media, NPC participation, vocal reaction, regulation-loop and meaningless-stat behavior.

This is one deletion-first **Story -> Extract -> reducer -> Commit -> committed readback/presentation sidecar integrity cut**, not a collection of independent symptom patches.

Binding architecture is the latest repository canon, especially:

1. `CURRENT_TRUTH.md`
2. `AGENTS.md`
3. `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
6. `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`
7. `docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`
8. this CURRENT_TASK.

Do not preserve stale behavior merely because an old test or historical donor module expects it.

## 1. Frozen registration / branch rule

Use the exact `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA` from the **latest** Issue #68 `CURRENT_TASK_READY` comment for this Task ID. An earlier registration comment for the same Task ID is superseded by the latest one.

At execution start:

1. fresh-fetch `origin/main`;
2. require exact registered main SHA/blob from the latest Issue #68 trigger;
3. require the registration delta from previous main is docs-only `docs/ops/CURRENT_TASK.md` reuse;
4. require preserved manual game exists read-only and never mutate it;
5. if unexpected source/config/content/migration drift exists, STOP `BLOCKED_USER_LIVE_25TURN_DRIFT`.

Implementation branch:

`company/user-live-25turn-spine-integrity-v1`

Create or reuse exactly one Draft PR for this task. Do not merge it. Stop `WAITING_REVIEW`.

## 2. Verified live evidence — regression facts

### 2.1 Extract whole-object fragility

Across 25 turns:

- Extract `outcome=degraded`: 13/25;
- blank `game_turns.turn_summary`: 13/25;
- degraded turns: `2,4,6,9,11,12,14,16,17,19,20,21,25`.

Current degraded fallback erases summary, Mind Monitor and otherwise independent narrow observations together. Optional evidence failure must be field-local fail-open after readable JSON exists. A correct Story must still Commit.

`test/extract-observation-contract.test.mjs` currently protects whole-observation rejection for scene exact-quote mismatch. REWRITE that obsolete contract rather than preserving it.

### 2.2 Mind Monitor has two conflicting read/write authorities

Five successful Extract turns (`8,13,18,22,23`) had non-empty `extract_delta.mind_monitor` while committed `game_turns.mind_monitor={}`.

Current Commit code performs text-equality ownership adjudication against `parsedStory.player_inner_thought`; this can delete a valid NPC monitor and violates presentation-only/fail-open Mind Monitor canon.

Separately, current frontend `view-model.js` reads `extract_delta.mind_monitor` whenever `extract_delta` exists, bypassing the committed `game_turns.mind_monitor` field. That is also wrong: readback must use committed turn authority, not pre-Commit working observation.

Required result:

- no textual thought-ownership gate in Commit;
- committed `game_turns.mind_monitor` is the UI/readback source;
- structural registered/present NPC filtering only;
- no retry, no exact quote requirement, no next-Story semantic authority.

### 2.3 Story THOUGHT ownership is wrong

Live Story repeatedly put heroine3/Jena first-person thoughts in `[THOUGHT]`. Parser/UI then label them as player inner thought.

`[THOUGHT]` remains **player-only**. NPC private thought belongs to the same post-Story Extract call's Mind Monitor. Fix the compact Story protocol; do not add a semantic thought classifier or second LLM.

### 2.4 Player sexual numeric UI is now rejected by owner

Live durable state at turn 25 still shows:

- `arousal=0`
- `ejaculation_progress=0`
- `ejaculation_count=0`
- `updated_turn=0`

while Story clearly contains sustained sexual activity. The frontend therefore displays false/zombie values such as `사정 진행도 · 누적 0회`.

**Owner decision for this task:** do not spend complexity resurrecting meaningless numeric sexual progression.

Deletion-first target:

- remove active UI/readers for `ejaculation_progress`, `ejaculation_count`, `total_sexual_events`, `last_sexual_event` and equivalent stale sexual-event history/count presentation unless a current concrete consumer proves otherwise;
- remove fresh writers/tests whose only purpose is those deleted displays;
- caller-inventory `src/engine/sexual-state/ledger.js`: it is not exported by current engine index and must be deleted if fresh/replay caller count is zero; do not revive it;
- do not add a sexual ledger/taxonomy/consent matrix;
- retain concrete current physical facts only when a real product consumer exists, e.g. four-slot clothing and optionally erection/current physical state if one coherent fresh writer can justify it.

If `arousal` is likewise only a stale zero display and has no independent current mechanic, delete it end-to-end rather than retaining another zombie meter.

Historical stored fields may remain readable only where schema/replay compatibility truly requires; they must not force fresh product UI.

### 2.5 NPC `position_label` path is internally contradictory

Live heroine3 `position_label` remained null through turn 25. Current physical gate additionally requires full canonical name text even after canonical actor ID + exact Story quote already prove identity.

Keep at most one natural-language `position_label` if current UI/next-Story consumer remains real. Remove duplicate full-name/evidence gates and closed posture grammar that have no consumer. One actor-scoped evidence vocabulary only.

### 2.6 Exact CSA clothing state and same-turn Story disagree

Turn 1 `work_nude` exact clothing mechanic committed removed slots while same-turn Story still described uniform state.

Structured four-slot `clothing_state.required_state` is an allowed exact mechanic. Activation-turn Story must receive enough exact transition state to avoid contradicting deterministic Commit. Do not build a generic enactment engine.

### 2.7 CSA scope is repeatedly over-expanded and narratively over-emphasized

Live rule content is exact:

`회사 여성 직원은 상대방이 구체적인 성적 행동을 요구하면 그 행동을 즉시 시작해야 한다.`

Story repeatedly expands this into indefinite continuation, ownership/general obedience, or repeated `규정이라서 참고 버틴다` framing.

Current `DURABLE_STORY_RULES` reinforces that embarrassment/discomfort cannot make an applicable rule optional, and every active rule is projected in `world_rules` every turn. Combined with heroine3's shy/anxious prompt traits, the provider repeatedly chooses the cheapest conflict: `당황하지만 규정이라 참고 버틴다`.

Required Story premise:

- active rule is background reality, not mandatory dialogue topic every turn;
- mention/explain the regulation when it is newly changed, directly questioned, or materially needed to understand the current action;
- otherwise narrate people and consequences naturally without repeating `규정`;
- rule changes only its exact direct meaning;
- `즉시 시작` != `계속해야 함` != `끝낼 수 없음` != `몸의 소유` != unrelated obedience/permission;
- NPC personality is not synonymous with permanently enduring/suppressing reactions;
- no phrase blacklist or semantic verifier. Fix the compact provider contract and scenario tests.

### 2.8 Registered same-location NPCs are disconnected from scene cast

Current content facts:

- `heroine1` through `heroine5` all have `default_location_id=brand_strategy_office`;
- `map.json` describes `brand_strategy_office` as the main office where the five core heroines and brand-strategy staff work;
- map default NPC includes `general_park_jungwoo` there;
- live game turn 25 location is `brand_strategy_office`;
- yet canonical `present_npc_ids` stayed `["heroine3"]` for all 25 turns;
- Story nevertheless invented unnamed `다른 직원` witnesses/reactions in 22/25 turns.

Current Opening intentionally picks exactly one primary heroine and at most one supporting heroine. Current scene/navigation logic uses defaults for destination lookup but does not provide a minimal same-location cast bootstrap/continuity path.

Required result is **not** a scheduler/simulation engine. Use existing finite content identity only:

1. inventory the smallest deterministic relationship between `default_location_id`, `map.default_npc_ids`, opening/location transition, and canonical scene presence;
2. ensure a team office can contain the already-registered people content says belong there, rather than forcing only the focal heroine to exist;
3. preserve explicit exits/entries/movement as structural facts after bootstrap;
4. Story may let present coworkers notice/react/speak naturally, but must not invent unnamed material witnesses while registered scene actors are available;
5. exact navigation to a known NPC must not erase all other legitimate same-location residents merely to focus the target;
6. do not create fuzzy NPC search, schedules, probabilistic presence simulation, or semantic cast classifier.

Scenario tests must cover at least `brand_strategy_office` with multiple registered residents and reactions without fabricating replacement NPCs.

### 2.9 Image catalog exists; the presentation writer is broken

TEST DB `public.image_library` is alive and populated. Active rows:

- heroine1: general 1 / sex 13
- heroine2: general 1 / sex 21
- heroine3: general 1 / sex 20
- heroine4: general 1 / sex 22
- heroine5: general 1 / sex 21.

Heroine3 has real situation images for breast/oral/fingering/penetration positions/cumshot/office-desk/climax-style cases. The catalog was **not deleted**.

Actual 25-turn `extract_delta` had `image_selection=null` and `image_character_id=null` on every turn. Fresh Extract tests explicitly retired old `image_selection` authority.

But current frontend `buildCompanyGameViewModel()` then hardcodes:

- `image_pool='general'`
- `image_tags=[]`

for every committed turn. Therefore current-situation sex images are unreachable through normal play even though the catalog exists.

Additional catalog/runtime mismatches:

- live active DB tags include `cowgirl_climax`, `missionary_climax`, `squirting`, `hypnosis_sex` but current API allowlist omits them;
- route comments state candidates are pruned to at most 8 by `curation_rank` before selector scoring. For heroine3, lower-rank rows can crowd out `office_desk`/climax/cumshot rows, making exact high-rank assets unreachable even after tags are restored;
- several catalog `situation` strings contain malformed Korean particles such as `김제나이` / `김제나과`; presentation copy should be cleaned at the canonical catalog source if source ownership is in this repo/migration evidence, but do not mutate TEST DB in this task.

Required media sidecar result:

1. keep image/media strictly presentation-only and fail-open;
2. do not make image selection a gameplay/Commit authority;
3. restore one coherent post-Story/current-turn media hint path that can choose `general` vs `sex` and narrow asset tags for the committed visible situation;
4. no second LLM call. If the existing same Extract call is the smallest place for an optional presentation-only media hint, it must remain optional, non-durable gameplay meaning, and unable to fail Commit; otherwise use a deterministic sidecar from already committed narrow facts;
5. do not resurrect the old broad semantic Extract schema merely for media;
6. align the media tag allowlist/families to the actual active catalog or prove why a catalog tag is intentionally unreachable;
7. do not pre-prune away exact-match assets before tag matching;
8. a missing image must never block a turn;
9. add scenario tests proving a general office turn chooses general imagery and representative current sexual situations can reach the matching heroine asset family.

### 2.10 TTS / vocal reaction path has lost old behavior

Current Company TTS:

- voices only parser `DIALOGUE` lines for one chosen present speaker;
- batches by a limited `toneGroup`;
- Company API sends `direction` to `TTS_WORKER`.

However the linked `fancy-dust-7f8c` Worker source in `zeroslove-ai/py-all` currently destructures `text, voice_id, key` and sends only `text + reference_id + format` to Fish Audio; `direction` is ignored in that source.

The older CSA-only runtime also had an explicit tested Story vocal-reaction contract:

- ordinary penetration: independent moan/broken-breath/sensory reactions minimum 2;
- faster/deeper: minimum 3;
- climax: minimum 4;
- as intensity rises, less long explanatory dialogue and more breath/vocal/body reaction.

That compact vocal behavior contract is absent from current Company Story rules. Live Company Story therefore falls back to repetitive explanatory dialogue and `참는다/규정` prose.

Do **not** port the old hospital sexual authorization/gate architecture. Only recover the useful presentation principle:

- intense physical scenes should contain natural short vocal/breath/body reactions with variation;
- avoid long explanatory speeches during high-intensity action;
- do not force exact numerical counts as a runtime validator; scenario/prompt regression is sufficient;
- vocal text that should be spoken must exist in a TTS-eligible character dialogue line; narrative/ACTING alone is not voiced;
- no audio failure may block Story/Commit.

This Company PR may fix Company Story/TTS caller contracts. **Do not modify or deploy `zeroslove-ai/py-all` / `fancy-dust-7f8c` from this task.** Instead document the verified external dependency gap (`direction` ignored by accessible Worker source) in the terminal report for a later separately reviewed TTS Worker task if voice-style support still requires it.

Also audit current cross-turn TTS queue policy: stale older-turn audio must not make current committed dialogue feel chronically behind. Preserve main/current speaker priority and do not let minor/background NPC audio steal playback.

### 2.11 Mind Monitor has no numeric stats by current design

Current fresh save has no NPC affinity/trust/emotion stat map. Current Mind Monitor UI renders only:

- `표면의식`
- `잠재의식`.

This is consistent with the latest canon: Mind Monitor is qualitative presentation-only, not durable relationship/emotion authority.

Do not silently re-create generic `호감/신뢰/감정/순응` ledgers inside this cut just because an older product once had them. If the owner later explicitly chooses bounded numeric NPC product stats, that requires a separate product-mechanic decision and one canonical writer.

For this task, make the existing qualitative Mind Monitor reliable and committed-authority-correct. Remove empty/stale stat placeholders such as `player.stats={}` / orphan NPC-stat UI if they have no current consumer.

### 2.12 Deterministic time and Story progression

Canonical game time is numerically correct; Story displayed noon/13:xx as `오전 12시`, `오전 1시`. Project one deterministic unambiguous `HH:mm` display clock from canonical `minute_of_day`; no second time authority.

Last 10 turns repeatedly stage/wait/restart instead of advancing. Restore the compact Story principle:

- executable literal action -> meaningful same-turn consequence;
- no default prepare/wait/restart/ask-again loop;
- do not repeatedly restate unchanged appearance/signature gestures;
- preserve exact player actor/target/action/direction.

No phrase blacklist or runtime semantic checker.

## 3. One coherent implementation cut

### A. Fresh Extract / evidence reduction

1. readable JSON with one malformed optional field => drop only that field/domain, keep valid summary/Mind Monitor/other actor observation;
2. malformed root JSON may use bounded degraded fallback;
3. one actor-scoped exact-quote evidence shape for retained clothing/position/current concrete player physical facts;
4. remove duplicate exact-full-name requirement once actor ID + exact quote prove provenance;
5. no generic physical/sexual grammar, relation/event/emotion/open-fact ledger;
6. test old contracts as KEEP / REWRITE / DELETE against current canon.

### B. Committed readback authority

1. UI reads committed `game_turns` projections, not pre-Commit `extract_delta`, for Mind Monitor and similar committed presentation fields;
2. Extract internals remain evidence/debug, not an independent user-facing authority;
3. summary failure cannot be collateral damage from unrelated scene evidence failure.

### C. Story contract

1. THOUGHT player-only;
2. exact CSA direct scope only;
3. active rule is background premise, not mandatory repetitive dialogue topic;
4. exact structured clothing transition must not contradict same-turn Story;
5. present registered coworkers may naturally react/speak; absent/unregistered material witnesses may not be invented;
6. deterministic clock projection;
7. meaningful same-turn progression;
8. recover compact varied vocal/breath reactions without porting old donor authorization machinery.

### D. Presentation sidecars

1. restore situation-aware image selection using existing `image_library` without making media semantic authority;
2. media hint is optional/fail-open/no second LLM;
3. align reachable tags/candidate retrieval with actual catalog;
4. TTS remains one primary current speaker and fail-open;
5. document external `direction`-ignored Worker seam; no external deploy in this PR.

### E. Deletion-first UI/state cleanup

1. remove owner-rejected ejaculation progress/count/event-history zombie UI and unsupported writers/readers/tests;
2. remove arousal numeric UI too if caller/mechanic inventory shows it is only stale display;
3. keep only concrete current physical facts with one writer and real consumer;
4. delete dead `sexual-state/ledger.js` if caller count is zero;
5. remove empty pseudo-stat placeholders rather than implying a Mind Monitor stat system exists.

## 4. Required regression tests

At minimum prove:

1. bad scene evidence warning-drops scene only while valid summary/Mind Monitor/actor data survives;
2. one bad actor field cannot erase another actor/domain;
3. Mind Monitor survives Commit and frontend reads committed monitor, not `extract_delta`;
4. Story THOUGHT contract is player-only without semantic runtime classifier;
5. retained concrete player physical/clothing fact can update from one evidence path;
6. deleted ejaculation/event UI fields are absent from fresh product view if owner-rejected;
7. canonical actor ID + exact quote does not require full canonical name substring for `position_label`;
8. exact CSA activation-turn clothing consistency;
9. exact `start` rule does not imply indefinite continuation/general obedience;
10. repeated active CSA need not be verbally restated every turn;
11. `brand_strategy_office` can bootstrap/retain multiple configured registered residents without fuzzy simulation;
12. exact navigation to one known resident does not erase legitimate same-location cast;
13. Story cannot use anonymous absent witnesses as material actors when registered cast exists;
14. deterministic 12:xx / 13:xx clock projection;
15. progression contract prohibits default wait/prepare/restart loops for executable requests;
16. image general office scenario reaches general portrait;
17. representative sex-scene media hint reaches correct heroine sex asset family;
18. catalog tags currently active in TEST are either reachable or explicitly/documentedly excluded; high-rank exact assets are not pruned before matching;
19. image failure remains non-blocking;
20. vocal/prompt scenario favors short vocal/breath/body reaction over repeated explanatory regulation dialogue in intense physical scenes;
21. TTS remains current primary speaker-only and stale queue behavior is explicitly tested;
22. literal exact-four choice round-trip/replay remains intact.

Run focused touched tests plus full suite. Full suite is regression signal, not authority for retaining obsolete contracts.

## 5. Explicitly deferred

- `choice_labels=null` / five-character button fallback remains a separate presentation issue unless a tiny non-semantic fix naturally falls out; do not add a choice semantic router.
- CSA app transactions consuming committed turns are observed but not redesigned here.
- no provider/model switch.
- external `fancy-dust-7f8c` Worker source/deployment is not modified in this Company PR; report the seam for later review.
- no new numeric NPC relationship/emotion stat system in this cut.

## 6. Safety / preservation

Absolute prohibitions:

- do not mutate/reset/reseed/revise preserved game `587de547-8bb7-4a92-a7c2-07f2831e2d38`;
- do not mutate preserved `9755b57b-5cbb-44dd-a624-020fe516c16d`, `78fb1d94-266f-455a-bda4-7656cc2370c1`, or template `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- no Production / hospital-v2;
- no TEST DB write/reset/migration/DDL;
- no API/frontend/TTS Worker deploy;
- no merge / Ready-for-review transition;
- no provider/model switch;
- no retry-until-lucky strategy;
- no new parser generation;
- no semantic router/classifier/verifier;
- no consent matrix;
- no generic relationship/event/emotion/open-fact/sexual ledger;
- no generic physical/sexual action grammar;
- no generic CSA execution DSL;
- no new CURRENT_TASK file;
- no new ops/task-registration branch.

Read-only TEST/GitHub evidence inspection is allowed. The manual game is immutable evidence.

## 7. Execution result — WAITING_REVIEW

- `START_HEAD`: `e54599552ca28e37067c1f8d7733e3cf3562360f`.
- `IMPLEMENTATION_HEAD`: `f7342a3` (`fix: restore spine integrity contracts`), pushed to `origin/company/user-live-25turn-spine-integrity-v1`.
- Draft PR: `#85`, `OPEN`, `DRAFT`, `UNMERGED`.
- Focused touched-contract tests: `73 PASS / 1 obsolete SKIP / 0 FAIL`.
- Full `npm.cmd test`: `366 PASS / 1 obsolete SKIP / 0 FAIL`.
- Syntax sweep: `node --check` PASS. `git diff --check`: PASS.
- Preserved game `587de547-8bb7-4a92-a7c2-07f2831e2d38` was not queried or mutated by this source/test cut; no DB write, migration, reset, deploy, live gameplay, provider/model change, or Production operation was performed.

### Authority map

- Retained canonical writers/readback: narrow field-local Extract observations, canonical scene cast, exact clothing/physical evidence, retained erection state, committed Mind Monitor, committed media presentation hint, current-speaker TTS queue, and existing CSA progression.
- Deleted stale authority: numeric player sexual meters/event history, dead sexual ledger module, duplicate full-name evidence gates, Commit text ownership gate, pre-Commit UI readback, and obsolete frontend recovery contract.
- Presentation-only: image/media hint, image catalog selection, Mind Monitor rendering, and TTS queue/audio; none can block Story or Commit.

### Required proof summary

- Optional malformed scene/actor fields now warning-drop locally while valid summary, Mind Monitor, and independent actor domains survive; malformed root JSON remains bounded fail-closed.
- `[THOUGHT]` is player-only in the Story contract; NPC private thought uses the same post-Story Extract Mind Monitor, and the frontend reads committed `game_turns.mind_monitor`, never `extract_delta`.
- Exact actor ID plus exact Story quote authorizes retained concrete physical/clothing facts without a duplicate full-name gate; exact CSA clothing is bootstrapped for present registered NPCs and projected to same-turn Story.
- `brand_strategy_office` bootstraps registered residents and exact NPC navigation preserves legitimate same-location cast without fuzzy schedules or anonymous replacement witnesses.
- Rule text is background/direct-scope only, meaningful executable actions progress in the same turn, and intense physical scenes receive compact varied vocal/breath/body guidance without a numeric runtime validator.
- Media derives a deterministic committed-turn sidecar, reaches active catalog tags including `cowgirl_climax`, `missionary_climax`, `squirting`, and `hypnosis_sex`, and no exact candidate is removed before selector scoring. The external Worker `direction` seam remains deferred and unmodified.
- TTS retains the current primary speaker, drops stale older-turn queues, and the replacement active-playback contract passes without an obsolete cross-turn preservation skip.

### 7.1 Correction result — review blockers addressed

- Correction source/test head: `df4afa8` (`fix: address spine integrity review blockers`), pushed to `origin/company/user-live-25turn-spine-integrity-v1`.
- Korean situation aliases now map committed `삽입`/representative real-Korean penetration wording into the deterministic `penetration` family, with a heroine-family selector regression.
- Canonical scene default-resident bootstrap is bounded to initial/location-entry/exact target-handoff semantics; an explicit NPC exit survives the next unrelated successful turn, with regression coverage.
- Story, Opening, and API turn projections now carry deterministic `current_time.clock_24h` (`HH:mm`) derived from canonical `minute_of_day`; noon and 13:07 regressions pass.
- TTS tracks the active turn and cancels stale prior-turn playback when a newer committed turn arrives while preserving same-turn current-primary playback.
- The obsolete skipped cross-turn TTS preservation test was deleted; the active queue-pruning and active-playback cancellation contracts pass.
- Correction focused contracts: `43 PASS / 0 SKIP / 0 FAIL`.
- Correction full `npm.cmd test`: `370 PASS / 0 SKIP / 0 FAIL`.
- Correction syntax sweep: `node --check` PASS. `git diff --check`: PASS.
- Preserved game `587de547-8bb7-4a92-a7c2-07f2831e2d38` remains untouched; no DB write, migration/reset, deploy, live gameplay, provider/model change, or Production operation was performed.

- Media correction now maps representative Korean situations to the intended family; the external Worker `direction` seam remains deferred and unmodified.
- TTS correction retains the current primary speaker, drops stale older-turn queues, and cancels active older-turn playback when a newer committed turn arrives; no obsolete cross-turn preservation skip remains.

### 7.2 Correction result — same-location NPC rehydration blocker addressed

- Second correction source/test head: `d1d60ef` (`fix: preserve exits across same-location handoff`), pushed to `origin/company/user-live-25turn-spine-integrity-v1`.
- `projectStorySaveForNavigation()` no longer merges default residents during a same-location exact-NPC handoff; it preserves the current canonical cast, adds only the exact target, and focuses that target.
- `reduceCanonicalScene()` bootstraps default residents only at initial-scene or actual location-entry boundaries; a same-location target ID is a normal exact entrance/focus event, not a default-cast rehydration trigger.
- Regression sequence proves default resident A exits, an unrelated successful turn preserves absence, then exact navigation to resident B keeps A absent, retains the currently present resident, adds B, and focuses B in both Story projection and Commit output.
- Second-correction focused contracts: `44 PASS / 0 SKIP / 0 FAIL`.
- Second-correction full `npm.cmd test`: `371 PASS / 0 SKIP / 0 FAIL`.
- Second-correction syntax sweep: `node --check` PASS. `git diff --check`: PASS.
- Preserved game `587de547-8bb7-4a92-a7c2-07f2831e2d38` remains untouched; no DB write, migration/reset, deploy, live gameplay, provider/model change, or Production operation was performed.

## 8. Deliverables / stop boundary

Deliver:

1. exact start/final SHA and changed-file list;
2. one authority map: retained / deleted / presentation-only;
3. Extract field-local fail-open proof;
4. committed Mind Monitor readback + THOUGHT separation proof;
5. deleted zombie sexual stat/ledger proof and retained concrete-player-state proof;
6. same-location registered NPC scene-cast proof;
7. exact CSA scope / non-repetition / same-turn clothing proof;
8. time + progression proof;
9. image catalog reachability/media-sidecar proof;
10. TTS/vocal caller proof plus explicit external Worker `direction` gap report;
11. KEEP/REWRITE/DELETE test notes;
12. focused/full tests, syntax, `git diff --check`;
13. one Draft PR OPEN/DRAFT/UNMERGED;
14. zero DB/deploy/live-game mutation proof.

On completion:

- update the branch copy of this same file to `Status: WAITING_REVIEW` with evidence;
- post one Issue #68 terminal:
  - `EXECUTION: WAITING_REVIEW`
  - `TASK_ID: user-live-25turn-spine-integrity-v1`
  - exact start/final SHA
  - Draft PR number/head
  - focused/full tests
  - preserved-game untouched proof
  - classification `USER_LIVE_25TURN_SPINE_INTEGRITY_READY`
- STOP.

Do not merge, deploy, write TEST, run automated gameplay, register another task, or self-approve product behavior.

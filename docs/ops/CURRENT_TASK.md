# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v7
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-history-choice-readback-contract-v1`
- Terminal/Trigger: Issue #68 comment `5310654230` (`IC_kwDOTfvo8c8AAAABPIonFg`) — `EXECUTION: COMPLETE`
- Operator review: Issue #68 comment `5310674873` — `REVIEW: ACCEPTED`
- Previous START SHA: `9a661456c73728f20ffcf22f17c0216e00cca1b3`
- Accepted source/test SHA: `4cf0542f3739ecc54864740565793f80e0d91505`
- Previous final docs SHA: `c7422dc4c7c24685826471ce10d3df457a9cd556`
- Previous final CURRENT_TASK blob: `96dc89fd7587d404c19639b7e538f76bc218deba`
- GitHub Actions on previous final SHA: run `31983709711` = SUCCESS.

Accepted history-choice correction:
- `src/api/supabase.js::listTurns()` already selects durable `game_turns.choices`.
- `src/api/turn-routes.js::history()` now projects `choices: Array.isArray(row.choices) ? row.choices : []`.
- exact stored literal values and order are preserved;
- missing/null/non-array historical values fail open to `[]`;
- no choice reconstruction from parsed Story/raw Story/save/provider;
- no `save.last_choices` / `last_choice_meta` restoration.

Earlier accepted runtime source anchors remain ancestors:
- duplicate-THOUGHT privacy boundary: `2be4b7ee29df47529f53f13393f3e3bf829a7c24`;
- same-location exact registered-NPC handoff: `c4ceed11845c127d813c821506f688f02d4c063c`.

Expected TEST DB baseline to verify read-only before writes:
- `20260816050000 / company_v1_minimal_story_runtime_contract` live exactly once;
- `20260817000100 / company_v1_final_residue_closure` live exactly once.

No migration/DDL authoring or application is authorized.

Allowed disposable TEST game only:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden game IDs — fail closed before network access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- every other game ID.

Production is forbidden.

## Objective

Run one bounded coherent 10–14 ordinary-turn release-candidate product acceptance against the exact reviewed Minimal Story Runtime lineage, now including the accepted `/api/history` committed-choice readback correction.

This is product evidence, not a source-fixing task. No repository source/test/runtime/content patch is authorized inside this run.

The first live ordinary turn must specifically prove that the v6 blocker is closed on the real deployed API:

`Story parsed/complete choices`
→ `Commit p_choices`
→ durable `game_turns.choices`
→ `/api/history records[].choices`

Only after that exact literal parity passes may the coherent acceptance continue.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals `START_SHA`.
3. Verify accepted source/test SHA `4cf0542f3739ecc54864740565793f80e0d91505` is an ancestor of START_SHA.
4. Verify every descendant after that accepted source/test SHA is docs-only unless independently reviewed otherwise. If executable source drift exists, STOP before TEST mutation.
5. Verify expected TEST migrations above are live exactly once and no unreviewed DB contract drift exists.
6. Verify deployed TEST API source equivalence to accepted executable source `4cf0542f3739ecc54864740565793f80e0d91505`.
   - The previously observed Worker Version `733041e4-66ed-4e53-b265-7ff2bd6e002c` predates the accepted history-choice source fix and must not be assumed current/source-equivalent.
   - If current deployed TEST API is already source-equivalent, do not redeploy.
   - Otherwise at most one guarded deployment of the exact reviewed source-equivalent API is authorized through the existing contract-gated path.
   - Record the resulting Worker Version.
   - No frontend deployment.
7. Re-run deterministic duplicate-THOUGHT privacy preflight locally/read-only:
   - one visible SCENE;
   - at least two non-empty THOUGHT blocks in raw synthetic/provider-shaped input;
   - first THOUGHT remains canonical private thought;
   - later duplicate THOUGHT is absent from public blocks, `scene_text`, and Extract observation projection;
   - duplicate warning remains;
   - exactly four canonical choices remain;
   - no retry/regeneration/source patch.
8. Residual CSA inspection is read-only only. Do not redesign CSA projection during this acceptance.

If preflight cannot prove exact reviewed source equivalence or migration contract without modifying repository/runtime semantics, STOP and report the blocker.

## Clean start / Setup / Opening

1. Canonical reset the disposable TEST game and independently verify clean baseline.
2. Use the already-proven exact Node/WHATWG `fetch` + `JSON.stringify` player payload:
   - name `김하늘`
   - department `brand_strategy`
   - position `intern`
   - age 30
   - height 170
   - weight 65
   - penis length 13
   - body type `balanced`
   - speech style `polite`
3. Setup is one normal request; no alternate name/client.
4. Perform normal `/api/opening` once.
5. Capture raw Opening, parsed blocks/private thought, exactly four canonical choices, committed Opening readback, canonical scene/time/player state.
6. Use one exact provider-returned Opening choice literal unchanged for ordinary turn 1.

## Turn 1 — mandatory history-choice blocker closure

Run the normal Story → Extract → Commit pipeline once with the exact Opening choice literal.

Immediately after Commit:
1. capture the current turn Story complete/parsed choices;
2. read the matching committed turn through `/api/history`;
3. require `historyRow.choices` to exist as an array;
4. require exactly four non-empty committed choices;
5. require exact literal/order parity between the committed Story choice projection and `/api/history records[].choices`;
6. verify no `save.last_choices` / `last_choice_meta` field is consulted or required;
7. verify normal committed turn/readback state advanced exactly once.

If this exact live parity fails, STOP immediately as a real product/protocol blocker. Capture raw Story, parsed/complete payload, Commit response, matching `/api/history` row, context, deployed Worker Version, and final reset evidence. Do not continue to later gameplay.

## Mandatory scenario progression — same coherent run

The progression below counts toward the one coherent 10–14 ordinary-turn budget. Do not reset/restart for a cleaner scenario.

### Step 2 — reach `brand_strategy_office`

Inspect canonical committed `save.scene.location_id`.
- If already `brand_strategy_office`, continue.
- Otherwise send exactly once: `브랜드전략팀 사무실로 간다`.
- Run Story → Extract → Commit once.
- Verify committed location becomes `brand_strategy_office`.
- A clear movement failure/refusal without product-established narrative reason is a real navigation blocker.

### Step 3 — establish a prior non-Mina active participant

Inspect canonical `save.scene.present_npc_ids`.
- If an exact registered non-Mina office participant is already active, preserve that evidence.
- Otherwise send exactly once: `서원희 보러간다`.
- Verify registered `heroine1` becomes active while location remains `brand_strategy_office`.
- No direct DB/save/scene seeding.

### Step 4 — same-location Mina mandatory regression

With office location + prior non-Mina participant established, send exactly once:
- `윤민아 보러간다`

Required live proof:
- exact target resolves to registered `heroine2` / 윤민아;
- no fake/fuzzy/similarly named NPC is created;
- broad location remains `brand_strategy_office` because this is same-location handoff;
- canonical time follows ordinary progression and is not reset;
- post-Commit `save.scene.present_npc_ids` contains `heroine2`;
- prior active-scene participant is not retained solely because broad location string is unchanged;
- any additional destination participant requires exact Story/destination-phase evidence.

If this fails after the precondition is truly established, STOP as a real same-location handoff blocker with raw Story, parsed, Extract, pre/post scene/save, history, and choice evidence.

## Choice contract for every ordinary turn

After each committed ordinary turn:
- capture current parsed/complete choices;
- read the matching `/api/history` row;
- require exactly four non-empty stored `historyRow.choices`;
- require exact literal/order parity with the current committed choice projection;
- assess semantic usefulness/diversity separately from structural exact-four compliance.

Do not treat absence of retired save mirrors as failure.

Do not regenerate/retry until four useful choices appear. If current canonical committed paths actually produce a structural choice violation, capture once and STOP.

## Continue naturally — total 10–14 ordinary turns

Unless a decisive blocker occurs, continue the same game and obtain the following evidence.

### A. Literal + free-text player agency
- use both exact committed choice literals and natural free text;
- Story must not materially replace an explicit player action/current self-state with a different fact;
- player input is intent/attempt, not success unless Story establishes success.

### B. Positive representable player self-state proof
- inspect current narrow supported player physical/sexual state before choosing the fact;
- explicitly state one currently representable current fact together with an ordinary next intent;
- Story must preserve rather than contradict it;
- where the current narrow Extract/Commit contract legitimately represents it, verify persistence and next-turn/readback parity;
- do not broaden schemas or infer unsupported facts just to make the proof pass.

### C. Canonical time
- Story must not contradict committed game time;
- elapsed time changes only through the established deterministic/observed path;
- no handoff/refresh/replay reset or fabrication.

### D. CSA activation-time premise + isolation
If needed to reach current active-rule coverage, use only the existing guarded TEST-only Level-7 acceleration seam and clean it afterward.
- activate one current CSA through the normal TEST path at a specific time;
- once active/applicable, a valid company rule is the altered natural workplace premise, not optional/not-yet-effective;
- NPC emotion/personal preference may differ;
- compliance must not imply unrelated consent, comfort, affection, trust, romance or arousal;
- no semantic rewrite gate/retry may rewrite Story.

### E. Positive compact clothing persistence
- inspect actual current supported compact vocabulary first;
- use only supported slots such as `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` where source confirms them;
- obtain one naturally Story-established supported clothing change;
- verify Extract/Commit persistence plus next-turn/readback continuity;
- no unsupported mapping or broader clothing inference;
- no retry-until-lucky.

If the full coherent bounded run never naturally establishes one supported positive clothing change, terminal may be `COVERAGE_NOT_REACHED`; do not fabricate or restart.

### F. Continuity beyond six raw turns
- establish one distinctive fact early enough that its source turn leaves the latest-six raw Story window;
- continue far enough to cross that boundary;
- verify chronological older `turn_summary` is non-empty/updating;
- inspect the exact next Story context/readback path;
- later Story must retain continuity without a cliff.

### G. Choice quality
- every normal committed turn must satisfy exact-four literal stored choices on current authority paths;
- separately inspect whether the four choices are materially different next actions rather than superficial paraphrases.

### H. Reaction/progression
- no repeated non-progressing re-litigation loop of the same active rule or scene argument;
- no LLM judge/hard semantic gate.

### I. Refresh/history/replay
- read committed context/history at meaningful milestones;
- perform at least one supported replay/idempotence check without advancing turn/revision;
- exercise existing refresh/readback behavior;
- committed reality must reproduce Story, parsed blocks/private thought, exact choices, summaries, canonical scene/time, and narrow persisted state.

### J. Side-system isolation
- image/media/TTS/Mind Monitor classification/failure cannot erase, reject, redefine Story or block Commit;
- side-system evidence is secondary to the gameplay spine.

## Stop / coverage rules

Stop immediately on the first actual decisive product/protocol/architecture blocker.

After a decisive blocker:
- do not continue and count later turns;
- do not retry/regenerate;
- do not switch provider/model/config;
- do not patch source/runtime/test;
- do not add fuzzy matching, semantic judge/gate, regex outcome verifier, compatibility layer, third parser, direct scene seeding, or generic memory system.

`COVERAGE_NOT_REACHED` is permitted only after the coherent bounded run was genuinely attempted and a required positive narrative/stochastic proof such as supported clothing was not naturally reached.

A failed run may still produce useful accepted evidence, but it is not `PRODUCT_PLAY_PASS`.

## Mandatory cleanup — every outcome

1. Restore/disable the TEST-only Level-7 acceleration seam if touched.
2. Canonical reset the disposable TEST game.
3. Independently read back clean reset state:
   - `committed_turn = 0`;
   - zero active history/action records;
   - `player_setup` not_started;
   - `opening_state` not_started;
   - player Level 1;
   - no active CSA;
   - canonical setup scene;
   - empty presence according to reset contract.
4. Never access any forbidden game.

## PRODUCT_PLAY_PASS requires

All of the following:
- exact reviewed API source equivalence/deployment identity;
- duplicate-THOUGHT privacy preflight;
- Setup + Opening/private-thought contract;
- Turn 1 live `/api/history records[].choices` exact literal/order parity, proving the v6 blocker is closed;
- every subsequent ordinary turn exact-four committed choice parity through the same authority;
- ordinary gameplay establishes office + prior-participant precondition;
- exact same-location `윤민아 보러간다` works live;
- no decisive player-agency/time/scene/CSA-premise/readback defect;
- positive supported player self-state proof;
- positive supported compact-clothing persistence proof;
- continuity beyond six raw turns through chronological summaries;
- useful semantic choice diversity;
- refresh/history/replay parity;
- presentation side systems remain non-authoritative;
- final reset is independently clean.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- deterministic local parser/contract checks without repository edits;
- read-only TEST DB/deployment preflight;
- at most one exact reviewed source-equivalent TEST API deployment if required;
- disposable TEST reset/setup/opening/gameplay/readback/history/replay/final reset;
- existing guarded TEST-only Level-7 acceleration seam when needed, with cleanup;
- local/temporary evidence artifacts outside the repository;
- docs-only CURRENT_TASK `READY -> WAITING_REVIEW` update + normal fast-forward push;
- exactly one immutable Issue #68 terminal report.

Not authorized:
- repository source/test/runtime/content/script patch;
- migration/DDL authoring/application;
- frontend deployment;
- restoring `last_choices` / `last_choice_meta` or any second choice mirror;
- Production/sentinel/preserved-manual/QA/other-game access;
- provider/model/config/retry/regeneration changes;
- direct DB/save/scene/presence seeding;
- fuzzy target matching, semantic judge/gate, regex outcome verifier, compatibility workaround, third parser, or generic memory replacement;
- new branch/PR;
- merge, Ready, rebase, squash, or force-push.

## Terminal report requirements

On any terminal outcome:
1. Set this file only from `Status: READY` to `Status: WAITING_REVIEW` in one final docs-only commit and fast-forward push.
2. Post exactly one immutable terminal report to Issue #68.
3. STOP. Do not create the next CURRENT_TASK yourself.

Terminal report must include:
- START_SHA;
- accepted executable/source-equivalence SHA;
- deployed TEST API Worker Version and whether deployment occurred;
- migration/DB preflight;
- duplicate-THOUGHT deterministic preflight;
- Setup + Opening result;
- Turn 1 exact parsed/complete choices and matching `/api/history records[].choices` count/literal/order parity;
- per-turn committed choice parity thereafter;
- total committed-turn count and exact stop point;
- office movement and prior-participant progression;
- exact Mina handoff raw Story / parsed / Extract / pre-post scene/history evidence;
- player self-state proof;
- compact clothing positive evidence or `COVERAGE_NOT_REACHED`;
- >6-turn summary/continuity evidence;
- semantic choice-quality observations;
- CSA premise/isolation observations;
- replay/context/history/refresh evidence;
- side-system isolation evidence;
- final reset readback;
- zero forbidden operations/access confirmation;
- PR #67 OPEN / DRAFT / UNMERGED state/head.

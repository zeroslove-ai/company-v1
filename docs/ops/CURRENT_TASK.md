# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v8
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v7`
- Terminal/Trigger: Issue #68 comment `5310741641` (`IC_kwDOTfvo8c8AAAABPIt8iQ`) — `EXECUTION: BLOCKED`
- Previous START SHA: `d31b738480a1a6cefa95b448e13aff8917a6b747`
- Previous final docs SHA: `d6ccd126154564194316a472222640c9430b6e11`
- Previous final CURRENT_TASK blob: `d1e00f1ee71d24a974870a486e1eb383e9aec3a3`
- Accepted executable/source-test SHA: `4cf0542f3739ecc54864740565793f80e0d91505`
- Reviewed TEST API Worker Version deployed by v7: `1039c4c3-3391-44ce-bafd-1d6929841a81`
- v7 final-docs GitHub Actions run: `31984529867` = SUCCESS.

## Operator review of v7

Classification: `EVIDENCE_ACCEPTED_HARNESS_ACTION_ID_OVERREACH`.

Accepted v7 live evidence:
- exact Node/WHATWG UTF-8 Setup passed;
- Opening passed with exactly four distinct canonical choices and one private THOUGHT;
- accepted history-choice source fix was deployed exactly once through the guarded path;
- Turn 1 through Turn 4 all committed successfully;
- every committed Turn 1–4 had exactly four `/api/history records[].choices` with exact literal/order parity to the current Story choice projection;
- Turn 2 moved normally from `brand_strategy_meeting_room` to `brand_strategy_office`;
- Turn 3 established registered `heroine1` / 서원희 as the prior active office participant;
- exact Turn 4 free text `윤민아 보러간다` produced a same-location Story containing registered `speaker_id="heroine2"` and 윤민아 dialogue;
- pre Turn 4 canonical scene was `brand_strategy_office`, present `[heroine1]`;
- post Commit canonical scene remained `brand_strategy_office`, present `[heroine2]`, with old `heroine1` removed;
- therefore the actual same-location Mina handoff contract passed live.

Why v7's declared blocker is not a product blocker:
- current `/api/history` deliberately exposes active committed turn readback by `turn_number`, `player_action/player_input`, Story, parsed blocks, choices, summaries, Mind Monitor, structured action, feedback and committed time;
- `/api/history` does **not** expose `action_id` and the accepted history-choice correction never added it;
- v7 CURRENT_TASK did not require `/api/history action_id` as a Mina acceptance condition;
- the runner nevertheless required a history record matching Turn 4's action UUID and stopped when that non-contract field was absent;
- do not add `action_id` to `/api/history` merely to satisfy that stale/over-broad harness assertion.

Additional valid v7 observation:
- Turn 4 Extract returned a supported fail-open degraded observation with warnings `extract_degraded` and `extract_fail_open:EXTRACT_AUTHORITY_VIOLATION`;
- Story, Commit and the canonical scene handoff still succeeded;
- preserve this as evidence and watch for recurrence, but do not treat a single explicitly supported Extract fail-open as an automatic handoff failure when the required canonical authority is independently correct;
- if Extract degradation later prevents a mandatory narrow state/memory/CSA proof from being established, classify that actual consequence at the point it occurs. Do not retry/regenerate to hide it.

Because v7 stopped for a harness-only false blocker after four successful committed turns and performed mandatory reset, one recovery product-acceptance run is authorized. This is not retry-until-lucky after a product failure.

## Objective

Run one bounded coherent 10–14 ordinary-turn release-candidate product acceptance against the exact accepted Minimal Story Runtime source, using only current committed authorities.

No repository source/test/runtime/content patch is authorized in this run.

Primary goals:
1. preserve the already-proven live `/api/history choices` contract;
2. use the correct history-record identity contract — `turn_number` first, then exact `player_action/player_input` parity — never a nonexistent history `action_id`;
3. re-establish the ordinary office → prior participant → exact Mina same-location progression in the coherent run without the v7 false assertion;
4. continue beyond Turn 4 to the still-unreached player-state, clothing, >6-turn summary continuity, CSA premise, replay/refresh, choice-quality and side-system proofs.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals `START_SHA`.
3. Verify accepted source/test SHA `4cf0542f3739ecc54864740565793f80e0d91505` is an ancestor of START_SHA.
4. Verify every descendant after that accepted source/test SHA is docs-only unless an independently accepted executable change is explicitly documented. If executable source drift exists, STOP before TEST mutation.
5. Verify expected TEST migrations are live exactly once:
   - `20260816050000 / company_v1_minimal_story_runtime_contract`
   - `20260817000100 / company_v1_final_residue_closure`
6. Verify deployed TEST API source equivalence.
   - Reuse Worker Version `1039c4c3-3391-44ce-bafd-1d6929841a81` if still source-equivalent to accepted source `4cf0542f...`.
   - Do not redeploy merely because HEAD has docs-only descendants.
   - If source identity drift is proven, at most one guarded deployment of the exact accepted source-equivalent API is authorized.
   - No frontend deployment.
7. Re-run deterministic duplicate-THOUGHT privacy preflight read-only/local: first THOUGHT private, duplicate absent from public/observation projection, warning retained, exactly four choices.
8. Re-run a deterministic **history identity harness self-check outside the repository** proving:
   - a synthetic record `{turn_number: 4, player_action: '윤민아 보러간다', choices:[A,B,C,D]}` is matched by `turn_number` and exact `player_action`;
   - no matcher reads or requires `record.action_id`;
   - no matcher reads `save.last_choices` or `last_choice_meta`;
   - 0/3/5 choices still fail structural exact-four validation.
9. Residual CSA inspection remains read-only. Do not redesign CSA projection.

If the evidence runner cannot satisfy the history identity self-check without changing repository source, STOP before live mutation as a harness blocker.

## Allowed disposable TEST game only

`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden before any network access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- every other game ID.

## Clean start / Setup / Opening

1. Canonical reset disposable TEST and verify clean readback.
2. Use exact Node/WHATWG `fetch` + `JSON.stringify` player payload:
   - name `김하늘`
   - department `brand_strategy`
   - position `intern`
   - age 30
   - height 170
   - weight 65
   - penis length 13
   - body type `balanced`
   - speech style `polite`
3. Setup once; no alternate client/name.
4. Opening once.
5. Capture raw Opening, parsed/private THOUGHT, exactly four canonical choices, committed Opening readback, scene/time/player state.
6. Use one exact provider-returned Opening choice literal unchanged for Turn 1.

## Correct committed-history identity rule — mandatory

For every committed ordinary turn, identify the `/api/history` record by:
1. exact `turn_number` returned by Commit / current committed state;
2. require exactly one active history record for that turn number;
3. require that record's `player_action` (and `player_input`, where projected) equals the exact submitted literal/free text;
4. then compare stored `historyRow.choices` to the current Story parsed/complete choice projection.

Do **not** require `/api/history.action_id`; it is not part of the current history API contract.

The action UUID may still be recorded separately from Story/Extract/Commit/action-status responses for audit, but absence of that UUID from `/api/history` is expected and cannot terminate the run.

Do not add or request an API compatibility field for this acceptance.

## Turns 1–4 — mandatory progression

### Turn 1 — literal + history parity

Submit one exact Opening-returned choice literal unchanged.

Require:
- Story → Extract → Commit success;
- exactly four parsed/complete choices;
- matching history row by `turn_number` + exact `player_action`;
- exactly four non-empty `historyRow.choices`;
- exact literal/order parity;
- committed turn/revision advances exactly once.

### Turn 2 — reach office

If not already at `brand_strategy_office`, submit exactly once:
`브랜드전략팀 사무실로 간다`

Require committed canonical location = `brand_strategy_office`.

### Turn 3 — prior non-Mina participant

If no exact registered non-Mina office participant is active, submit exactly once:
`서원희 보러간다`

Require registered `heroine1` active in `brand_strategy_office`.

### Turn 4 — exact same-location Mina handoff

Submit exactly once:
`윤민아 보러간다`

Require:
- Story resolves exact registered `heroine2` / 윤민아, not a fuzzy/generated similarly named NPC;
- broad location remains `brand_strategy_office`;
- time progresses normally and is not reset;
- post-Commit `save.scene.present_npc_ids` contains `heroine2`;
- prior `heroine1` is not retained solely because broad location is unchanged;
- any additional destination participant requires exact destination-phase Story evidence;
- matching history record is identified by Turn 4 `turn_number` plus exact `player_action='윤민아 보러간다'`, not `action_id`;
- history choices remain exact-four literal/order parity.

### Extract fail-open handling during Turns 1–4

Capture every Extract result and warning.

A degraded Extract is **not automatically a decisive blocker** if:
- Story completed normally;
- Commit completed normally;
- the turn's required canonical authority is independently established by the current source-owned path;
- no mandatory narrow Extract-owned fact for that proof is lost.

If degraded Extract causes an actual required durable state, memory, CSA, clothing, physical/sexual or Mind Monitor proof to be absent/incorrect, capture that specific consequence and STOP if it is decisive. Never retry/regenerate the Extract.

## Continue same coherent run — total 10–14 ordinary turns

Do not reset/restart after Turn 4. Continue naturally unless the first actual decisive blocker occurs.

Mandatory remaining proofs:

### A. Player agency — literal + free text
- use both exact choice literals and natural free text;
- Story must not materially replace an explicit action/current self-state with a different fact without coherent narrative reason;
- input = intent/attempt, not success unless Story establishes success.

### B. Positive representable player self-state
- inspect current supported narrow player physical/sexual state before selecting the fact;
- state one supported current fact explicitly together with an ordinary next intent;
- Story must preserve it;
- where Extract/Commit legitimately represents it, verify persistence and next-turn/readback parity;
- no schema broadening or inference.

### C. Canonical time
- no contradiction with committed time;
- no handoff/refresh/replay reset/fabrication;
- elapsed changes only through current deterministic/observed path.

### D. CSA activation-time premise + isolation
- if needed use only the existing guarded TEST-only Level-7 acceleration seam, once as required, with cleanup;
- activate one current CSA through normal TEST path at a specific time;
- once active/applicable, a valid company rule is the altered natural workplace premise, not optional/not-yet-effective;
- NPC emotion/personal preference may differ;
- compliance must not imply unrelated consent, comfort, affection, trust, romance or arousal;
- no semantic rewrite gate/retry.

### E. Positive compact clothing persistence
- inspect current supported slots first;
- use only supported compact slots such as `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` where source confirms them;
- obtain one naturally Story-established supported clothing change;
- verify Extract/Commit persistence + next-turn/readback continuity;
- no unsupported mapping or retry-until-lucky.

If a complete 10–14 turn run genuinely does not establish one supported clothing change, terminal may be `COVERAGE_NOT_REACHED` rather than inventing evidence.

### F. Continuity beyond six raw turns
- establish a distinctive fact early enough to leave the latest-six raw Story window;
- continue beyond that boundary;
- verify older chronological `turn_summary` is non-empty/updating;
- inspect exact next Story context/readback;
- later Story retains continuity without a cliff.

### G. Choice quality
- every ordinary turn: exactly four current choices and exact committed history parity;
- separately assess whether choices are materially different next actions rather than paraphrases.

### H. Reaction/progression
- no repeated non-progressing re-litigation loop;
- no LLM judge/hard semantic gate.

### I. Replay / context / history / refresh
- read committed context/history at milestones;
- perform at least one supported same-action replay/idempotence check without advancing turn/revision;
- exercise existing refresh/readback behavior;
- reproduce committed Story, parsed/private thought, exact choices, summaries, canonical scene/time and narrow persisted state.

### J. Side-system isolation
- image/media/TTS/Mind Monitor classification or failure cannot erase, reject, redefine Story or block Commit;
- side systems remain presentation/secondary consumers.

## Stop rules

Stop immediately on the first **actual** decisive product/protocol/architecture blocker.

Do not stop because:
- `/api/history` lacks `action_id`;
- retired save mirrors are absent;
- Opening begins outside the office;
- one supported Extract fail-open occurs without losing the turn's required canonical proof.

After a real blocker:
- no later evidence counts toward acceptance;
- no retry/regeneration;
- no provider/model/config switch;
- no source/runtime/test patch;
- no fuzzy matching, semantic judge/gate, regex verifier, compatibility layer, third parser, direct scene seeding or generic memory system.

`COVERAGE_NOT_REACHED` is permitted only after the coherent bounded run is genuinely attempted and a required positive narrative/stochastic proof such as compact clothing still does not naturally occur.

## Mandatory cleanup — every outcome

1. Restore/disable TEST-only acceleration if touched.
2. Canonical reset disposable TEST.
3. Independently verify:
   - committed_turn = 0;
   - processing_status = idle;
   - history/actions = 0;
   - player_setup/opening = not_started;
   - Level 1;
   - `csa_active=[]`;
   - canonical setup scene;
   - empty presence.
4. Never access a forbidden game.

## Acceptance

`PRODUCT_PLAY_PASS` requires all of:
- history identity harness uses `turn_number` + exact `player_action`, never history `action_id`;
- Setup + Opening/private-THOUGHT contract passes;
- every ordinary turn has exact-four current/committed choice parity;
- ordinary office progression and exact Mina same-location handoff pass;
- no decisive agency/time/scene/readback/CSA-premise defect;
- positive supported player self-state proof;
- positive supported compact clothing persistence proof;
- >6-turn chronological summary continuity;
- useful semantic choice diversity;
- replay/context/history/refresh parity;
- side systems remain non-authoritative;
- mandatory final reset passes.

A supported Extract fail-open may be recorded as a warning and does not alone prevent `PRODUCT_PLAY_PASS` unless it causes one of the mandatory proofs above to fail or become materially incorrect.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- temporary evidence-runner/artifacts outside repository only;
- deterministic local parser/harness checks without repo edits;
- read-only TEST DB/deployment preflight;
- reuse current source-equivalent TEST API, or at most one guarded exact source-equivalent API deployment if identity drift is proven;
- disposable TEST reset/setup/opening/gameplay/readback/history/replay/final reset;
- existing guarded TEST-only Level-7 acceleration seam with cleanup;
- docs-only CURRENT_TASK WAITING_REVIEW update + normal fast-forward push;
- exactly one immutable terminal report.

Not authorized:
- repository source/test/runtime/content/script patch;
- migration/DDL authoring/application;
- adding `/api/history.action_id` for compatibility;
- restoring `last_choices` / `last_choice_meta`;
- frontend deploy;
- Production/sentinel/preserved-manual/QA/other-game access;
- provider/model/config/retry/regeneration change;
- direct DB/save/scene/presence seeding;
- fuzzy/semantic/parser/compatibility workaround;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Terminal report requirements

On any terminal outcome:
1. set this file to `WAITING_REVIEW` in one final docs-only commit and fast-forward push;
2. post exactly one immutable Issue #68 terminal report;
3. STOP and do not create the next CURRENT_TASK.

Terminal must include:
- START_SHA and accepted source-test ancestry;
- deployed API Version / source-equivalence result;
- DB/migration and duplicate-THOUGHT preflight;
- deterministic history-identity harness self-check proving no history `action_id` dependency;
- Setup + Opening evidence;
- per-turn submitted player_action, Commit turn number, current choices, matching history turn/player_action/choices parity;
- office/prior/Mina raw Story, parsed, Extract, Commit, pre/post canonical scene;
- every Extract degraded/fail-open warning and whether any required canonical proof was actually lost;
- total committed-turn count and exact stop point;
- self-state, clothing, >6-turn memory, choice-quality, CSA premise, replay/refresh and side-system evidence as reached before any blocker;
- final reset readback;
- forbidden-operation confirmation;
- PR #67 OPEN / DRAFT / UNMERGED state/head.

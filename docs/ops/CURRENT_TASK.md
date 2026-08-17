# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v5
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v4`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5310435172` (`IC_kwDOTfvo8c8AAAABPIbPZA`)
- Lease: Issue #68 comment `5310461739`
- Terminal: Issue #68 comment `5310497134` — `EXECUTION: BLOCKED`, `TERMINAL_STATUS: COVERAGE_NOT_REACHED`
- Operator review: Issue #68 comment `5310506395` — `EVIDENCE_ACCEPTED_PREMATURE_COVERAGE_STOP`
- Reviewed source/test SHA: `2be4b7ee29df47529f53f13393f3e3bf829a7c24`
- Previous final docs SHA: `c3a19cf6179bce3304a960e449eb38c658a7f576`
- Reviewed TEST API Worker Version: `733041e4-66ed-4e53-b265-7ff2bd6e002c`
- GitHub Actions on previous final docs SHA: run `31982028866` = SUCCESS.

Accepted v4 evidence:
- exact Node/WHATWG UTF-8 Setup payload with player name `김하늘` round-tripped exactly, passed current local `validatePlayerSetupInput()`, and live `/api/player-setup` returned HTTP 200;
- Opening returned HTTP 200 with parser success, exactly four unique choices, one private THOUGHT and no public THOUGHT leak;
- therefore the old v3 `invalid_name` result is not a current product Setup defect;
- v4 stopped at committed turn 0 only because Opening began in `brand_strategy_meeting_room` with `heroine3` and the runner treated absence of the later Mina handoff precondition as immediate coverage non-reach.

That stop interpretation was incorrect. The product task says to **naturally reach** `brand_strategy_office`; reaching it through ordinary gameplay is part of the scenario, not a preflight condition. A non-office Opening is valid and must not by itself terminate the run.

Expected TEST DB baseline to verify read-only before writes:
- `20260816050000 / company_v1_minimal_story_runtime_contract` live exactly once.
- `20260817000100 / company_v1_final_residue_closure` live exactly once.
- No migration/DDL authoring or application is authorized.

Allowed disposable TEST game only:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden game IDs — fail closed before network access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- every other game ID.

Production is forbidden.

## Objective

Run one coherent 10–14 ordinary-turn release-candidate acceptance against the exact reviewed Minimal Story Runtime lineage.

The run must no longer require the Mina same-location precondition to exist immediately after Opening. It must acquire that precondition through normal product gameplay, then execute the Mina regression and continue the other outstanding proofs unless a real decisive architecture/protocol/product blocker occurs.

This remains an evidence task. No source/test/runtime/content patch is allowed.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals `START_SHA`.
3. Verify reviewed source/test SHA `2be4b7ee29df47529f53f13393f3e3bf829a7c24` is an ancestor of `START_SHA`; commits after it must be independently reviewed docs-only descendants.
4. Verify expected TEST migrations above are live exactly once and no unreviewed DB contract drift exists.
5. Verify current TEST API source equivalence.
   - Reuse Worker Version `733041e4-66ed-4e53-b265-7ff2bd6e002c` if it is still source-equivalent to the reviewed source.
   - Otherwise at most one guarded deployment of the exact reviewed source-equivalent API is authorized.
   - No frontend deployment.
6. Re-run deterministic duplicate-THOUGHT privacy preflight read-only:
   - first THOUGHT remains canonical private thought;
   - later duplicate THOUGHT is absent from public blocks, `scene_text`, and Extract observation;
   - duplicate warning remains;
   - exactly four canonical choices remain.
7. Residual CSA inspection is read-only. Do not redesign CSA projection.

## Clean start / Setup / Opening

1. Canonical reset the disposable TEST game and independently verify clean baseline.
2. Use the already-proven exact player object and Node/WHATWG `fetch` + `JSON.stringify` path:

```js
{
  name: '김하늘',
  department_id: 'brand_strategy',
  position_id: 'intern',
  age: 30,
  height_cm: 170,
  weight_kg: 65,
  penis_length_cm: 13,
  body_type_id: 'balanced',
  speech_style_id: 'polite'
}
```

3. Setup must be one normal request. Do not switch names or clients. If this known-valid exact request unexpectedly fails, stop as a real blocker with exact evidence.
4. Perform normal `/api/opening` once.
5. Capture raw Opening, parsed blocks/private thought, exactly four canonical choices, committed Opening readback, scene/time/player state.
6. Use one exact provider-returned Opening choice literal unchanged for the first ordinary turn.

## Mandatory scenario progression — Mina precondition acquisition is gameplay

The following is part of the one coherent scenario and may consume normal committed turns.

### Step 1 — reach the brand strategy office

After the first exact-literal ordinary turn, inspect the committed canonical scene.

- If `save.scene.location_id === 'brand_strategy_office'`, continue.
- Otherwise send exactly one ordinary free-text movement action:
  - `브랜드전략팀 사무실로 간다`
- Run the normal Story → Extract → Commit pipeline once.
- Verify committed `save.scene.location_id === 'brand_strategy_office'`.
- If Story/Commit materially refuses, redirects, or fails this clear registered-location movement without a narrative reason established by the product, classify the actual evidence as a product/navigation blocker. Do not call the mere initial non-office location `COVERAGE_NOT_REACHED`.

### Step 2 — establish a prior non-Mina active participant in the same office

Inspect committed `save.scene.present_npc_ids` after reaching `brand_strategy_office`.

- If it already contains an exact registered non-Mina office participant, preserve that evidence and continue.
- Otherwise send exactly one normal free-text registered-target action:
  - `서원희 보러간다`
- `서원희` is registered `heroine1`, whose canonical default location is `brand_strategy_office`.
- Verify the normal Story/Commit result establishes `heroine1` as the active same-office participant while broad canonical location remains `brand_strategy_office`.
- Do not seed or directly edit scene state.

### Step 3 — execute the accepted same-location Mina regression

Once canonical location is `brand_strategy_office` and a prior non-Mina active participant exists, send exactly once:
- `윤민아 보러간다`

Required proof:
- exact target resolves to registered `heroine2` / 윤민아;
- Story target/cast hands off to Mina without creating a fake/similarly-named NPC;
- broad canonical location remains `brand_strategy_office` solely because the target is in the same location;
- canonical time follows the ordinary turn path and is not reset or fabricated;
- after Commit, `save.scene.present_npc_ids` includes `heroine2`;
- prior active-scene participant(s) are not retained merely because the broad location string is unchanged;
- any additional participant requires exact destination-phase Story evidence.

If this exact action fails after the precondition above has actually been established, stop as a real same-location handoff blocker with raw Story/parsed/Extract/pre-post-save evidence.

## Continue the same coherent run — total 10–14 ordinary turns

The progression turns above count toward the 10–14 ordinary-turn budget. Do not reset/restart to create a cleaner scenario.

After the Mina proof, continue naturally until 10–14 ordinary committed turns total, unless a decisive blocker occurs. Cover all of the following in the same run.

1. **Literal + free-text agency**
   - use both exact committed choice literals and natural free text;
   - Story must not materially replace an explicit player action/current self-state with a different fact.

2. **Explicit representable player self-state — positive proof**
   - inspect the existing narrow representable state first;
   - state one supported current player fact explicitly with an ordinary next intent;
   - Story must preserve it;
   - where current Extract/Commit legitimately represents it, next-turn/readback continuity must agree;
   - player intent/attempt is not success unless Story establishes success.

3. **Canonical time**
   - Story must not contradict committed game time;
   - elapsed time advances only through the established deterministic/observed path.

4. **CSA activation-time premise + isolation**
   - if needed, use only the existing guarded TEST-only Level-7 acceleration seam and clean it afterward;
   - once an active applicable company rule exists, following that rule is the altered natural workplace premise, not an optional/not-yet-effective policy decision;
   - personality/emotion may differ;
   - compliance must remain separate from unrelated consent, comfort, affection, trust, romance and arousal;
   - no runtime semantic gate or retry may rewrite Story.

5. **Positive compact clothing persistence**
   - use only source-supported compact slots such as `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` where applicable;
   - obtain one Story-established supported clothing change naturally in this one scenario;
   - verify Extract/Commit persistence and next-turn/readback continuity;
   - if the complete bounded run never naturally establishes such a positive supported event, report `COVERAGE_NOT_REACHED`; do not retry until lucky or invent unsupported mappings.

6. **Continuity beyond six raw turns**
   - establish a distinctive work/context fact early enough that its originating turn leaves the most-recent-six raw window;
   - continue far enough to inspect chronological older `turn_summary` memory;
   - prove it is non-empty/updating and later Story retains the distinctive fact without a continuity cliff.

7. **Choice quality**
   - every normal provider turn must expose exactly four literal committed choices;
   - record whether they represent meaningfully different next actions rather than paraphrases;
   - structural count alone is not semantic acceptance.

8. **Reaction/progression quality**
   - narrative must not repeatedly re-litigate the same active rule or get stuck in a non-progressing reaction loop.

9. **Refresh/history/replay authority**
   - perform committed context/history readback at milestones;
   - perform at least one supported replay/idempotence check without advancing committed turn/revision;
   - refresh/readback must reproduce committed Story, parsed blocks/private thought, exact choices, summaries, canonical scene/time and narrow physical/clothing state.

10. **Presentation sidecars remain sidecars**
   - image/media/TTS/Mind Monitor classification or failure must not erase, reject, redefine Story or block Commit.

## Stop and coverage rules

Stop immediately on the first **actual** decisive architecture/protocol/product blocker.

Do not stop merely because:
- Opening started outside `brand_strategy_office`;
- Mina was not already present after Opening;
- the same-location handoff precondition still needs ordinary gameplay turns to establish.

Those are scenario setup steps explicitly authorized above.

`COVERAGE_NOT_REACHED` is valid only after the bounded coherent gameplay scenario was genuinely attempted and a mandatory positive stochastic/narrative mechanic such as supported compact clothing still did not naturally occur. It must not be used at committed turn 0 because a later scene precondition was not present yet.

Do not:
- retry/regenerate a failed provider/Story/Extract stage;
- run an alternate scenario after a blocker;
- patch source/test/runtime/content;
- add fuzzy matching, semantic gates/judges, regex outcome verifiers, compatibility layers or another parser;
- switch provider/model/config;
- seed direct scene/presence state to force the handoff precondition.

## Mandatory cleanup

For every terminal outcome:
1. restore/disable the TEST-only Level-7 acceleration seam if used;
2. canonical reset the disposable TEST game;
3. independently verify clean final state: committed_turn 0, no actions/turns, setup/opening not_started, Level 1 baseline, no active CSA, canonical setup scene, empty presence;
4. do not access any forbidden game.

## Acceptance

`PRODUCT_PLAY_PASS` requires all of the following:
- known-valid exact Setup succeeds;
- Opening/private-thought/exact-four contract passes;
- office precondition is acquired through ordinary gameplay when not present initially;
- same-location exact `윤민아 보러간다` handoff works live;
- no decisive agency/time/scene/CSA-premise/readback defect;
- explicit supported player self-state positive proof;
- positive supported compact-clothing persistence proof;
- continuity beyond the six-raw window through chronological summaries;
- exactly four committed choices with useful semantic diversity;
- refresh/history/replay parity;
- presentation side systems remain non-authoritative.

A bounded run that succeeds structurally but never naturally reaches one mandatory positive stochastic/narrative proof may end `COVERAGE_NOT_REACHED`; that is not `PRODUCT_PLAY_PASS`.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- deterministic local validator/parser/caller preflight without source edits;
- read-only TEST DB/deployment identity preflight;
- at most one exact reviewed source-equivalent TEST API deployment if required;
- disposable TEST reset/setup/opening/gameplay/readback/history/replay/final reset;
- ordinary player actions explicitly listed above to acquire the Mina test precondition;
- existing guarded TEST-only Level-7 acceleration seam when needed, with cleanup;
- temporary evidence outside the repository;
- docs-only CURRENT_TASK status update to WAITING_REVIEW and normal fast-forward push;
- exactly one immutable terminal report.

Not authorized:
- source/test/runtime/content changes;
- migration/DDL authoring/application;
- frontend deploy;
- Production/sentinel/preserved-manual/QA/other-game access;
- provider/model/config/retry/regeneration changes;
- direct DB/save/scene/presence seeding to manufacture gameplay evidence;
- fuzzy/semantic/parser/compatibility workaround;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Terminal report requirements

On any terminal outcome:
- set this file to `WAITING_REVIEW` and fast-forward push the docs-only status change;
- post exactly one immutable terminal report containing:
  - START_SHA / reviewed source equivalence / deployed API Version;
  - migration/DB and duplicate-THOUGHT preflight results;
  - Setup + Opening result;
  - exact ordinary-turn progression used to reach `brand_strategy_office`;
  - exact prior-active-participant evidence before Mina;
  - exact `윤민아 보러간다` raw Story / parsed / Extract / pre-post canonical scene evidence;
  - total ordinary committed-turn count and stop point;
  - player self-state evidence;
  - compact clothing evidence or explicit bounded coverage non-reach;
  - six-raw-window summary/continuity evidence;
  - choice-quality, CSA premise and sidecar observations;
  - replay/context/history/refresh evidence;
  - final reset readback;
  - forbidden-operation confirmation;
  - PR #67 OPEN / DRAFT / UNMERGED state.
- STOP. Do not create the next CURRENT_TASK yourself.

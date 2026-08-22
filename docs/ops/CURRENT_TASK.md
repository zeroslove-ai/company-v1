# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: P1 ACTOR-IDENTITY + POST-STORY MIND-MONITOR CLOSURE -> FOCUSED LIVE ACCEPTANCE -> REMAINING P1 -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 13:27 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / frozen architecture

Automation owns objective QA until the deployed exit matrix is green. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 owner-locked product canon `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime canon `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- current accepted R3 source on main
- latest explicit owner decisions and Issue #68 operator review

Architecture stays frozen at A-prime/R3:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Do NOT add a new engine, generic semantic validator, NER/fuzzy mapper, nearest matching, physical ontology, consent DSL, second Story/choice LLM, automatic retry/regeneration, browser-owned Story/Observer/Commit orchestration, timeout inflation, provider/model/config workaround, or a new narrative parser generation.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are immutable/read-only.

## 1. Accepted terminal / frozen progress

Accepted terminal:
- terminal comment: `5377854360`
- operator review: `5377869934`
- terminal CURRENT_TASK blob: `c65da12554f8225970eb12ce731d46c8cf24c4ca`
- verified final executable/main: `39157507419e06477513032b45513b8e6e016f97`
- registration parent: `cd78a307d821ad209dbb43c3145503db48461318`

Accepted and frozen absent new deterministic evidence:
- Story-only current-choice authority correction at `391575074...`;
- Story terminal valid `1..4` tail is canonical choice source;
- Observer may warn but cannot veto a valid Story tail;
- no Story tail => no fabricated/prior-turn fallback choices; literal free input remains available;
- P0 failed-turn explicit retry, same-row attempt fencing, stage-aware stale terminalization;
- invocation-based Story total deadline;
- same-job duplicate transport and browser refresh/recovery;
- provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

Exact TEST deployment at terminal:
- API `game-proxy-company-r3`: `f324232c-82c1-418e-8a52-19bdee42c54a`
- frontend preserved: `ba4812c5-3883-4a90-8b9d-5482e4ccfabf`

### Accepted focused Story-choice proof

Disposable game `c53ec6f2-b465-44ec-a167-59c5bee57948`:
- Opening + 5 ordinary committed turns;
- literal storage parity 5/5;
- at least two current-choice clicks and two Korean free-input actions;
- a real Story no-tail turn correctly kept canonical choices empty;
- a later Observer mismatch did NOT erase the exact Story-authored choices.

### Accepted clean 30 campaign

Disposable game `4debc85b-2e19-4d0b-96cb-177e7379df1e`:
- Opening + 30 ordinary committed turns;
- literal storage parity 30/30;
- valid exact-four Story tails 16/30;
- Story no-tail 14/30; max no-tail streak 6;
- Observer exact choice matches 15;
- Observer mismatch with canonical Story choices surviving 1;
- prior/deterministic fabricated fallback choices 0;
- one natural Turn-21 stale timeout recovered exactly once through the accepted explicit failed-turn retry path; no pass-seeking retry.

Do NOT rerun clean 30 merely to improve these statistics. Preserve the 16/30 choice reliability result as an objective quality concern for later P1/final review. Do not hide it via retry/regeneration/provider-model changes.

## 2. Decisive P1 blocker

The same clean-30 evidence shows:
- committed actor-keyed `mind_monitor` non-empty on **0/30 ordinary turns**;
- all ordinary turns therefore failed to prove the required relevant-NPC Mind Monitor product surface;
- final scene still contained registered actors, so this is not explained by an empty scene.

This is the next deterministic P1 blocker. Do not start the independent 15+, long-memory 50+, or 9-CSA certification campaigns until this boundary is closed and focused-live green.

## 3. Independent source findings that bind the repair

At accepted main `391575074...`:

### 3.1 Observer lacks canonical actor identity input

`runtime-r3/server/provider.js` currently sends Observer only:
- `literal_action`
- `story_text`
- pre-turn `current_context`

It does **not** send the registered canonical actor directory `{id,name}`.

The Observer prompt asks for actor-keyed Mind Monitor but gives the model no explicit canonical ID/name mapping. This can produce empty output or name/noncanonical keys and is not an adequate structural contract.

### 3.2 Mind Monitor authorization is PRE-TURN only

`runtime-r3/domain/observer-normalizer.js` currently builds:
`currentIds = new Set(currentState?.scene?.present_actor_ids ?? [])`

A Mind Monitor entry survives only when its key is already in that PRE-TURN set and exists in the actor directory.

Therefore a legitimate NPC who enters during the current Story cannot receive Mind Monitor in the same committed turn even when Observer used the correct canonical ID.

### 3.3 Current enter/exit evidence is not actor-specific enough

Current entered/exited validation accepts:
- a registered actor ID, plus
- any exact quote from Story.

The quote does not have to identify that actor. This is too weak to use entered/exited as post-Story relevance authority and violates the existing P1 rule that actor enter/exit evidence must identify that canonical actor by name. Player movement text must never be enough to make an NPC enter/exit.

## 4. First action: classify the clean-30 raw MM failure before patching

Before source mutation, inspect the preserved clean-30 evidence artifact and/or read-only TEST turn rows for disposable game `4debc85b-2e19-4d0b-96cb-177e7379df1e`.

Classify at least a representative sample of `observer_raw.mind_monitor` values across the 30 ordinary turns:
- truly empty object/absent;
- keyed by actor names instead of canonical IDs;
- keyed by canonical IDs but dropped by pre-turn relevance;
- mixed forms;
- Observer failure/degraded output.

Post one `PROGRESS_HEARTBEAT` to Issue #68 with the classification before landing any source fix.

Do not mutate this evidence game. Do not infer the cause solely from source when raw evidence can distinguish it.

## 5. Required narrow actor/MM contract closure

The goal is a structural identity/relevance repair, not semantic entity extraction.

### 5.1 Pass compact canonical actor directory to Observer

Give the existing Observer call a compact registered actor directory containing only deterministic canonical identity needed for projection, at minimum:
`[{ id, name }, ...]`

Requirements:
- use repository content/canonical actor catalog only;
- include canonical IDs and exact names;
- do not send private/irrelevant character data merely for ID mapping;
- Observer prompt must explicitly require `mind_monitor` object keys to be canonical actor IDs from that directory;
- unknown names/IDs must not be invented or mapped;
- no fuzzy, nearest, transliteration, alias guessing, or name->ID repair in code.

Provider/model/API URL/key/temperature/token budgets/timeouts remain unchanged.

### 5.2 Actor-specific entered/exited grounding

For each Observer `entered` / `exited` item:
- `actor_id` must be registered canonical ID;
- `quote` must be an exact contiguous Story substring;
- that exact quote must also contain the exact canonical actor name for `actor_id`;
- otherwise drop the item with the existing bounded warning style.

No generic NER or semantic classifier.
No fuzzy name variants.
A player movement/location quote that does not identify the NPC by canonical name cannot support NPC enter/exit.

### 5.3 Derive MM relevance structurally from current + grounded scene transition

Build the Mind Monitor-eligible actor set from deterministic scene facts:
1. start with PRE-TURN `currentState.scene.present_actor_ids` that are registered;
2. add only current-turn `entered` actors that passed the actor-name-grounded rule above;
3. remove only current-turn `exited` actors that passed the same actor-name-grounded rule;
4. exclude unknown/nonregistered IDs.

A same-turn grounded entrant must therefore be eligible for Mind Monitor immediately.
A grounded exited actor must not remain eligible.

Do NOT authorize an unrelated actor solely because Observer placed its ID in `present_actor_ids` without grounded transition evidence. `present_actor_ids` may continue its existing scene-projection role in this bounded task, but it must not become a shortcut for injecting unrelated MM actors.

### 5.4 Mind Monitor projection

For each Observer `mind_monitor` entry:
- key must be an exact canonical actor ID;
- actor must be in the structurally derived eligible set above;
- value must remain a plain object with bounded `surface` and `subconscious` text as the existing product shape expects;
- unrelated/off-scene/unknown/name-keyed entries are dropped fail-open with bounded warning;
- do not fabricate Mind Monitor text in code when Observer returns none;
- do not copy prior-turn Mind Monitor as fallback.

The Observer/LLM remains responsible for generating relevant current-character surface/subconscious text. Code only enforces deterministic identity/relevance boundaries.

## 6. Required deterministic regression proof

Add focused tests proving at least:

1. Observer request payload contains compact canonical `{id,name}` actor directory from content.
2. Observer prompt explicitly requires canonical actor-ID keys for `mind_monitor`.
3. PRE-TURN present canonical actor + canonical-ID MM entry survives.
4. Name-keyed MM entry is dropped; no name->ID conversion occurs.
5. Unknown actor ID MM entry is dropped.
6. Off-scene registered actor not in the eligible set is dropped even if its name appears elsewhere.
7. Current-turn entrant with registered ID + exact Story quote containing that actor's exact canonical name is accepted.
8. That same grounded entrant's canonical-ID MM entry survives in the SAME turn.
9. Entrant quote that is exact Story text but does not contain the actor's canonical name is dropped.
10. Player movement/location quote cannot support an NPC entrant unless that NPC's canonical name is in the quote.
11. Grounded exited actor is removed from MM eligibility in the same turn.
12. `present_actor_ids` alone cannot grant MM eligibility to an unrelated actor that was not pre-present or grounded-entered.
13. Multiple valid current relevant actors remain actor-keyed independently; one malformed actor entry does not erase another valid MM entry.
14. Observer empty MM remains fail-open empty; no deterministic/prior-turn fabrication.
15. Choice-authority contracts from `391575074...` remain green and unaffected.
16. Location/scene/clothing projection remains unchanged except the explicitly actor-specific enter/exit evidence requirement.
17. Production boundary still constructs the real provider; no deterministic provider substitution.

Run:
- focused Observer/provider/worker/reducer contracts;
- full `npm` suite;
- changed JS/MJS syntax checks;
- `git diff --check`.

## 7. Landing / exact TEST rollout

1. Re-read latest Issue #68 immediately before landing.
2. Verify main still descends fast-forward from `39157507419e06477513032b45513b8e6e016f97`; STOP on conflicting execution authority.
3. Land only the minimal source/test correction, fast-forward only.
4. No new branch/recovery branch/force push/history rewrite.
5. No migration/DDL/schema/data change is expected or authorized.
6. Deploy exact TEST API because backend provider/normalizer/worker source is expected to change.
7. Deploy frontend only if frontend source actually changes; otherwise preserve current accepted frontend version.
8. Record exact main SHA and Worker version identities.
9. Production remains untouched.

Post a `PROGRESS_HEARTBEAT` after validation/landing and another after TEST deployment/live-probe start. During long QA phases, do not leave Issue #68 silent for more than ~15 minutes; heartbeat comments are evidence only and do not replace terminal reports.

## 8. Focused deployed MM acceptance

Use one NEW disposable R3 TEST game after exact deployment. Do not reuse clean-30 or preserved evidence fixtures.

Run Opening plus 5-8 coherent ordinary turns with at least one registered NPC materially participating in the current scene on each inspected turn.

Required evidence per turn:
- submitted literal action and exact storage parity;
- Story relevant NPC identities/names;
- observer_raw `entered` / `exited` / `present_actor_ids` / `mind_monitor`;
- normalized/applied actor transition and `mind_monitor`;
- committed turn `mind_monitor` readback;
- frontend Mind Monitor surface if browser-visible;
- no unrelated/off-scene actor MM projection.

Acceptance:
- systemic 0/N Mind Monitor failure must be gone;
- successful Observer turns with a materially active eligible current NPC must produce grounded actor-keyed MM often enough to demonstrate the product surface is functioning, not a one-off artifact;
- capture at least THREE non-empty grounded canonical-ID MM samples across the focused probe;
- if a same-turn NPC entrant naturally occurs, prove its actor-name-grounded enter evidence and same-turn MM eligibility/readback;
- if no same-turn entrant naturally occurs in this one bounded probe, do NOT sample/retry until one appears: the deterministic regression test is sufficient for entrant mechanics, and live proof may remain current-actor only;
- unknown/name-keyed/off-scene Observer entries must remain dropped, not repaired;
- no Story/Observer retry or pass-seeking replay.

If the Observer itself still returns empty MM on every well-grounded current-NPC turn despite receiving the actor directory, stop with raw provider evidence. Do not change model, temperature, token budget, timeout, or add a second LLM call. A narrow prompt-contract clarification may be considered only if the evidence proves the model was not instructed to emit MM for materially participating eligible actors.

## 9. Continue remaining P1 immediately after MM green

Do not create a new feature task merely because focused MM passes. Continue this SAME continuous task through:

1. Active CSA -> Story context: relevant active canonical CSA rule + selected scope actually reaches Story and affects only its authorized premise.
2. Four-location continuity: at least four canonical locations through `literal -> Story -> observer_raw -> observer_applied -> state_after -> next Story`.
3. Broader actor presence correctness using the actor-specific enter/exit evidence now established.
4. `scene_note` is a bounded current-scene snapshot; stale ended facts disappear rather than accumulating.
5. Semantic player agency: Story may not silently substitute player actor, target/counterparty, action, movement/direction, request/refusal, self-state, or topic/intent.
6. Product identity: office work is life texture, not mandatory work-assistant/task funnel; no fake competing CSA/app mechanics.
7. Story choice reliability: preserve the accepted clean-30 16/30 exact-four result; investigate/improve only through the Story contract itself if a deterministic prompt-contract defect is proven. No second Story generation, prior fallback, deterministic fabricated ordinary choices, or retry-until-pass.

No generic semantic classifier/NER/fuzzy/nearest mapper/physical ontology/consent DSL may be introduced.

## 10. Remaining campaigns / CSA / retained surfaces

After P1 is stable enough to proceed:
- independent materially different 15+ turn campaign;
- long-memory 50+ turn campaign;
- dedicated clothing CSA fixture;
- dedicated request/interaction CSA fixture.

For all 9 canonical CSA templates prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC success alone is not acceptance. Institutional/system CSA premise must never manufacture personal affection, comfort, consent, desire, romance, or relationship state.

Measure latency and derive p50/p95 from meaningful samples. Measure first; no second Observer/retry optimization.

Exercise retained surfaces:
- history;
- TTS;
- download/export;
- refresh/reconnect;
- duplicate submit;
- failed-turn explicit retry;
- any canon-retained feedback/revision surface.

Required viewport evidence before owner handoff:
- desktop;
- `390x844`;
- one wider mobile/tablet viewport;
- screenshots visually inspected, not merely counted.

## 11. Safety / exit

- TEST only; no Production.
- Preserved/manual/evidence games immutable.
- No provider/model/API URL/key/secret/temperature/token-budget change.
- Keep Story 30s/120s and Observer 75s budgets unchanged.
- No automatic retry/regeneration or second Story/Observer/choice LLM.
- No migration-history repair/rewrite and no schema change for this P1 closure.
- No generic semantic classifier/NER/fuzzy/nearest mapper/name resolver/physical ontology/consent DSL.
- No unknown/name -> canonical ID repair; the model must use provided canonical IDs and invalid keys fail-open drop.
- Actor enter/exit evidence must contain that actor's exact canonical name.
- `present_actor_ids` alone must not become an ungrounded MM injection path.
- No previous-turn/fabricated Mind Monitor fallback.
- Story remains sole current-choice author.
- No browser-owned orchestration replacing A-prime server authority.
- Fast-forward only; no force-push/history rewrite.
- Re-read Issue #68 before each source landing and TEST deployment decision.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective P0/P1/P2 exit matrix is green, including remaining P1, independent 15+, long-memory 50+, all 9 CSA behavioral coverage, semantic agency, location/presence/scene continuity, choices/MM quality, recovery, latency, and retained surfaces/viewports.

If a safety boundary or ambiguous deterministic failure is reached, post exact evidence and STOP. Otherwise continue this SAME task.
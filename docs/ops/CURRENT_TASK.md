# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: ACTIVE-CSA STORY-AUTHORITY PROMPT CLOSURE -> DEDICATED CLOTHING LIVE ACCEPTANCE -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 16:08 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding architecture / safety

Automation owns objective QA until the deployed exit matrix is green. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- owner-locked product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- A-prime canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- current accepted R3 source on main
- latest explicit Issue #68 operator decisions.

Architecture remains exactly:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Forbidden unless a new deterministic defect specifically proves otherwise:
- provider/model/API URL/key/config/temperature/token/timeout changes;
- automatic Story retry/regeneration or second Story/choice LLM;
- generic semantic classifier/gate, NER, fuzzy/nearest actor or location matching;
- physical ontology or consent DSL;
- rule-specific semantic if/else engines;
- browser-owned Story/Observer/Commit orchestration;
- migration/history repair or Production access/deploy;
- preserved historical/manual/evidence game reset/mutation;
- direct-API substitution for browser acceptance;
- retry/sample-until-pass behavior.

Provider budgets remain Story first-content 30s / Story total 120s / Observer 75s.

## 1. Latest accepted terminal / operator decision

Latest terminal:
- terminal comment: `5378811856`
- operator review: `5378950008`
- terminal task blob: `9aab46bd48f17f05f1c5a0abcd865cfe80a91b2c`
- terminal start/final main: `473580fa5ac0a62cd7f5fea2dcd061ca9acb821e`

Current accepted TEST identities:
- API: `game-proxy-company-r3` version `6e86c32e-22e5-400c-8bdb-9ae4ef7a639a`
- frontend: `gamebuilder-company-r3` version `012186e3-9144-43bb-8c48-521a7bd944bb`

No source/test/deploy changes occurred in the terminal execution.

## 2. Frozen GREEN results

Do not reopen absent new deterministic evidence.

1. P0 explicit failed-turn retry / same-row attempt fencing / stage-aware stale terminalization / invocation-based Story deadline / duplicate-reconnect baseline.
2. Story is sole canonical current-choice authority. Observer mismatch is diagnostic only when exact Story-tail choices survive. No Story tail => no fabricated/prior fallback; free input remains usable.
3. Clean-30 fixture `4debc85b-2e19-4d0b-96cb-177e7379df1e`: literal parity 30/30; exact-four Story tail 16/30; no-tail 14/30; max no-tail streak 6; fabricated/prior fallback 0. Do not rerun merely to improve statistics.
4. Mind Monitor actor-ID contract: canonical `{id,name}` directory, exact canonical-name enter/exit grounding, same-turn grounded entrant eligibility, off-scene/unknown/name-keyed drops.
5. Exact-name enter/exit fail-closed: `박 팀장` is not canonical `박정우`; do not add aliases/fuzzy/title repair.
6. Active-rule context projection source `a4608ff7710468dd34ca7858ccaaf869eb9908bd`: active canonical rules are passed exactly once to Story with id/template/content/mode/trigger/strength/subject_scope/counterparty_scope; inactive rules excluded.
7. Action-panel bootstrap/layout correction `77d1391a16e891793a0682833bc5ce9ac88c5dfd`: `.action-panel` reserves `min-height: min-content`; full 467/467 and TEST frontend deployment accepted.
8. Generic deployed browser submit is GREEN.
9. Active-CSA same-page submit and post-reload browser transport are GREEN. Branch-E diagnostic fixture `39ccffb6-5893-438a-b239-d7da51d983fc` proved baseline -> CSA apply -> same-page Turn -> reload -> post-reload `/turn` HTTP 200 -> Turn 3 commit with no requestfailed/pageerror/console errors. The previous `net::ERR_FAILED` is a bounded transient/anomalous sample. Do not add generic transport retry/reconnect from it.
10. CSA removal/readback is GREEN: revision changes without gameplay-turn change, active rule disappears, and a different post-removal ordinary Story commits with the rule absent.

## 3. Decisive blocker: active CSA reaches Story but Story ignores a relevant premise

Dedicated live fixture:
`2a6c12db-2006-474e-b452-c72f45d52115`

Evidence:
- Setup/Opening passed.
- UI apply of canonical `no_panties_under_work_clothes` returned `/csa` 200.
- revision advanced while gameplay turn did not.
- readback had active `r3_csa_1`, exact canonical rule content/scope, and female-employee clothing state.
- one clothing-relevant literal was submitted exactly once:
  `서원희 차장의 근무복 차림을 잠시 살펴보고 회의 자료를 건넨다.`
- `/turn` returned 200 and committed Turn 1.
- Story described outer work clothing (white blouse / gray blazer / slacks) but did not reflect the active institutional premise that scoped female employees wear their ordinary work clothes without panties.
- Observer `clothing_changes=[]`; state_after retained the already-applied canonical clothing state.
- This is a relevant scene sample, not an insufficient-relevance sample.
- No retry/sample-until-pass occurred.

Therefore source transport/storage/reducer activation is not enough. Active-CSA **Story effect** is still blocked.

Removal cleanup on this fixture is already accepted:
- UI remove revision 2 -> 3 with committed_turn unchanged;
- active rule absent;
- one different post-removal action committed Turn 2;
- readback revision 4 / committed_turn 2 / active=[].

## 4. Independent source diagnosis — prompt underinstruction

Current `runtime-r3/domain/memory.js` already projects active rules exactly once with:
- `id`
- `template_id`
- `content`
- `mode`
- `trigger`
- `strength`
- `subject_scope`
- `counterparty_scope`

Do not duplicate or rename that authority unless deterministic source inspection proves a narrower necessary change.

Current `runtime-r3/server/provider.js` Story prompt only states, in substance:
- when `active_rules` contains an institutional rule, apply only its stated content and subject/counterparty scope;
- activation alone must not imply personal affection/comfort/consent/desire/romance/obedience/relationship/player sexual state.

That wording does not explicitly say active rules are **authoritative current-world facts already in force**, may not be silently ignored, and must become visibly true in narration when the current action/scene materially concerns the rule premise or observable consequences.

The live failure is consistent with this underinstruction.

## 5. FIRST SOURCE TASK — strengthen the existing generic Story active-rule contract only

Primary allowed source change:
`runtime-r3/server/provider.js`

Modify the existing Story system prompt, not the architecture.

Required generic semantics:
1. `active_rules` entries are authoritative current-world institutional/system rules already in force, not optional suggestions or possible future rules.
2. When `active_rules` is non-empty, Story must preserve each rule's exact stated content and exact subject/counterparty scope.
3. When the current scene, literal player action, or naturally narrated consequence materially concerns a rule's scoped premise or observable consequence, Story must make that premise visibly true in natural narration.
4. Story must not silently ignore an active rule merely because ordinary workplace behavior would otherwise be plausible.
5. Do not force irrelevant exposition when the scene has no meaningful connection to a rule.
6. Do not mechanically quote/copy the rule text merely to satisfy the contract; narrate the world fact naturally.
7. Active institutional/system rules must still never manufacture personal affection, comfort, consent, desire, romance, obedience, relationship state, or player sexual state beyond the rule's explicit content.
8. Do not change player agency: actor/target/action/movement/request/refusal/self-state/topic/intent remain literal-action boundaries.
9. Do not weaken Story choice, canonical location, actor, or plain-text contracts.

Do NOT:
- add a rule-specific `if template_id === ...` behavior;
- add rule-specific narrative strings in code;
- add a semantic relevance classifier/gate;
- add a second LLM call or retry/regeneration;
- change model/provider/temperature/tokens/timeouts;
- inject active rule text into player literal action;
- add a second CSA authority field solely to make the model obey.

## 6. Deterministic regression requirements

Add or extend focused provider/context tests proving at least:
1. Story provider payload still contains active canonical rules exactly once.
2. inactive rules remain excluded.
3. exact content and subject/counterparty scope survive without mutation.
4. Story system prompt explicitly marks active rules as authoritative current-world facts already in force.
5. Story prompt explicitly requires visible application on materially relevant scoped scenes/actions/consequences.
6. Story prompt explicitly forbids silent ignoring of relevant active rules.
7. irrelevant scenes are not required to force rule exposition.
8. no-invented affection/comfort/consent/desire/romance/obedience/relationship/player-sexual-state boundary remains.
9. literal player-action agency contract remains unchanged.
10. Story exact-four choice authority remains unchanged.
11. canonical destination-name requirement remains unchanged.
12. Observer prompt and actor/MM contract remain unchanged unless an actual regression requires test-only adjustment.
13. production provider path remains real provider; deterministic provider stays tests/dev only.
14. no second Story/choice call, retry, semantic gate, fuzzy mapping, or rule-specific code is introduced.

Run:
- focused provider/memory/worker/turn-kernel contracts;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

Re-read Issue #68 immediately before landing.
Land FF-only from current main. No new branch/task authority.
Deploy exact TEST API only if API/runtime source changed. Frontend stays `012186e3-9144-43bb-8c48-521a7bd944bb` unless frontend source actually changes, which is not expected here.
Record exact TEST API version.

## 7. Dedicated deployed clothing CSA acceptance — one sample, no pass-seeking

After exact TEST API deployment, use ONE NEW disposable R3 TEST game.

Sequence:
1. Setup + Opening once.
2. Apply `no_panties_under_work_clothes` once through deployed CSA UI.
3. Prove revision increases while gameplay turn does not.
4. Confirm active canonical rule and scoped clothing state in readback.
5. Submit exactly ONE naturally clothing-relevant ordinary action. It must not copy the CSA rule wording into player input. A suitable form is observing a scoped NPC adjusting/sitting/moving in ordinary work clothes while continuing an office interaction.
6. Capture exact literal, Story input/context if existing diagnostics expose it, streamed Story, Observer raw/applied, state_after, committed readback, clothing, MM, choices, scene/location/presence and timings.

Acceptance:
- Story visibly reflects the active institutional premise within exact subject/counterparty scope in this materially relevant scene.
- Narration is natural, not a mechanical rule quotation.
- no invented affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state.
- literal player action semantics remain intact.
- Observer/readback remain coherent.
- no retry/regeneration/sample-until-pass.

If this single relevant sample still ignores the active premise:
- STOP BLOCKED with raw Story-input/output evidence;
- do not change provider/model/config/temp/tokens/timeouts;
- do not submit a second sample hoping for a pass.

If active sample passes:
7. remove/deactivate the same rule once;
8. prove revision increases while gameplay turn remains unchanged;
9. prove rule absent from active readback;
10. submit exactly one different ordinary next Story;
11. prove removed premise no longer applies.

Then continue automatically; do not stop merely because clothing CSA is green.

## 8. Next P1 — four canonical locations

Use a NEW disposable fixture.
Prove at least four distinct registered canonical locations through the full chain:
`literal action -> Story exact canonical destination name -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.

Requirements:
- exact canonical location names in movement literals;
- Story must not silently substitute destination/direction;
- Observer location quote is exact Story substring;
- canonical mapping only from exact registered name evidence already in Story;
- next Story reads committed canonical location;
- company map agrees;
- generic room labels must not be upgraded to a specific canonical room without exact canonical evidence.

Stop on first deterministic divergence and fix only that proven boundary.

## 9. Presence / scene_note / semantic agency P1

Presence:
- entered/exited exact canonical actor-name evidence;
- player movement alone cannot create NPC enter/exit;
- same-turn grounded entrant may receive MM;
- unrelated/off-scene actors cannot be injected.

scene_note:
- bounded current-scene snapshot;
- stale ended people/objects/actions must disappear rather than accumulate indefinitely.

Semantic player agency:
Story must not silently replace:
- actor;
- target/counterparty;
- action;
- movement/direction;
- request/refusal;
- self-state;
- topic/intent.

Explicit historical targets:
- ask 한리브 about lunch must not become 김제나/work talk;
- `혼자 있고 싶다` must be narratively respected;
- `허리를 만진다` must not become touching a table edge.

Do not build a generic semantic validator/gate to police this.

## 10. Remaining objective campaigns

When P1 is green continue the SAME task through:
1. materially different independent 15+ turn campaign;
2. long-memory 50+ turn campaign;
3. dedicated clothing CSA fixture as needed for retained regression;
4. dedicated request/interaction CSA fixture;
5. all 9 canonical CSA templates.

For every CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC/storage success alone is not acceptance.
Institutional/system premise must not manufacture personal affection, comfort, consent, desire, romance, obedience, or relationship state.

Continue recording choice reliability without retry/regeneration/fabricated fallback. Frozen clean-30 remains 16/30 valid tails, 14/30 no-tail, max no-tail streak 6.

## 11. Latency / retained surfaces / viewports

Across campaigns capture:
- submit;
- response headers if available;
- first Story token;
- Story complete;
- Observer start/complete;
- commit.

Derive p50/p95 when sample size permits; measure before optimizing.

Retain checks for:
- history/export/download;
- reconnect/reload;
- duplicate submit and explicit failed-job retry;
- TTS where current product contract retains it;
- feedback if current canon retains it;
- desktop, 390x844 and wider mobile/tablet viewport.

## 12. Heartbeat / terminal policy

During long QA phases post `PROGRESS_HEARTBEAT` about every 15 minutes.

On deterministic defect:
- preserve exact deployed evidence;
- narrow-fix only the proven boundary if authorized here;
- validate, FF land, exact TEST deploy if needed;
- no provider pass-seeking or hidden retries.

Before every landing/deploy, re-read Issue #68 and verify no newer execution authority exists.

Terminal must include exact task blob, start/final main, changed paths, tests, TEST versions, fixture IDs, literal/Story/Observer/applied/state/readback evidence, warnings classified as diagnostic vs blocker, and remaining matrix.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective matrix is green.

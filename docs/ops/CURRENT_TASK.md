# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: KNOWN PROVIDER CSA BLOCKER FROZEN -> REMAINING CSA CAPABILITY ONCE -> ORTHOGONAL OBJECTIVE LIVE QA
Updated: 2026-08-22 19:28 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 0. Binding authority

Continue the same Task ID under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`;
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`;
- Issue #68 owner UX/CSA directives;
- operator review `5379772800`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Provider/model/config remain frozen. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` are forbidden because objective QA is not all-green while the known provider capability blocker remains open.

## 1. Accepted/frozen executable and live evidence

Reviewed terminal:
- terminal `5379761374`;
- prior task blob `dc0603da670a65ac9a6a7fdc4dcf9eb782387b72`;
- execution start main `94550d0604e786ae733dd0c4dad5a7b90e9be89d`;
- accepted/current executable main `e646fb9664878b81020e4fedaa5e587149b82851`;
- operator review `5379772800`.

Current TEST identities:
- API `game-proxy-company-r3` Worker version `e76b936c-f28a-4ec9-aec3-e7968587e9cc`;
- frontend `gamebuilder-company-r3` version `c297425c-3fa8-4025-a514-5ac908606c36`.

### 1.1 Request-trigger execution contract — frozen

Source `e646fb9664878b81020e4fedaa5e587149b82851` is accepted structurally:
- `runtime-r3/domain/memory.js` derives request execution timing strictly from canonical rule mode/trigger;
- request-triggered rules receive bounded timing semantics equivalent to:
  - `request_triggered=true`;
  - `when_triggered=same_story_turn`;
  - `future_deferral_allowed=false`;
- rule `content` remains the only behavior meaning;
- runtime does not inspect literal player text or deterministically execute behavior;
- Story prompt only states the generic timing authority.

Accepted validation:
- focused 34/34 PASS;
- full 477/477 PASS;
- syntax and `git diff --check` PASS;
- one TEST API deployment only;
- frontend unchanged.

Do not change this request-rule prompt/context boundary again in this task.

### 1.2 Previously accepted CSA campaigns — GREEN and frozen

Do not rerun for pass seeking:
1. `no_panties_under_work_clothes`;
2. `no_bra_under_work_clothes`;
3. `target_places_requester_hand_on_waist_or_thigh`;
4. `work_nude`;
5. `work_in_underwear_only`;
6. `masturbate_for_recipient` fixture `9f265381-8cae-4c4c-925e-6e43d6ca8a3e` through apply -> same-turn execution -> state continuity -> remove -> ordinary post-remove.

### 1.3 Known provider/model capability blocker — freeze, do not retry

Preserved fixture:
`ac24fb57-3c76-452b-9a71-8f2b9974d0a1`.

Accepted facts:
- `vaginal_sex_with_recipient` applied once through UI;
- revision increased while committed_turn stayed unchanged;
- active rule/state remained coherent;
- exact direct request literal was stored;
- one turn committed exactly once;
- Story context contained the structured same-turn/no-deferral timing contract;
- Story nevertheless asked for clarification, invoked ordinary work concern, waited for an answer, and deferred the required behavior.

Classification is frozen:
`BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_CANONICAL_REQUEST_RULE`

Operational consequences:
- do NOT replay this fixture or rule;
- do NOT add a third prompt/context tuning loop;
- do NOT weaken/euphemize the request;
- do NOT add template-specific instructions, semantic classifiers/gates, physical/consent DSLs, deterministic behavior execution, second LLM, retry/regeneration, or provider/model/config changes;
- do NOT claim all 9 CSA are green.

This known capability blocker does NOT stop independent QA axes from being exercised in this new task.

## 2. Task objective

Maximize remaining objective QA coverage under the frozen stack so the known provider blocker does not hide unrelated local product/runtime defects.

This task is primarily live QA. Do not modify runtime/source/tests/config/migrations before a new locally actionable deterministic defect is proven. On such a new defect, STOP and return evidence for the next operator task rather than fixing opportunistically in the same execution.

Known provider-level refusal/deferral matching the frozen vaginal blocker is evidence to record, not a NEW locally actionable defect and therefore does not by itself stop this task.

## 3. PHASE A — remaining two CSA templates, one sample each only

Cover at most once each with fresh disposable fixtures and one active rule at a time:
1. `player_request_executes_immediately`;
2. `continue_until_recipient_orgasm`.

### A1. `player_request_executes_immediately`
- fresh Setup + Opening;
- apply once through real CSA UI;
- prove revision up / gameplay turn unchanged / active rule readback coherent;
- submit exactly one concrete eligible request through real gameplay UI;
- capture literal, Story, Observer raw/applied, state_after, choices/MM/location/presence/warnings/timing;
- remove/post-remove only if Story execution is coherent enough to continue.

If Story refuses/delays/substitutes while engine state and timing contract are coherent:
- classify as SAME KNOWN PROVIDER CAPABILITY FAMILY;
- preserve the fixture;
- do not retry or tune;
- record and continue to A2 / orthogonal QA.

If instead there is a distinct local defect such as state loss, wrong literal, duplicate submit, wrong scope, implicit remove, broken revision/turn accounting, runtime exception, or transport/reconciliation regression:
- STOP on that NEW locally actionable defect.

### A2. `continue_until_recipient_orgasm`
Use one fresh disposable fixture.
- establish a coherent currently ongoing relevant interaction through ordinary Story play without another CSA rule;
- apply the rule once;
- revision up / turn unchanged / exact active rule readback;
- submit exactly one eligible continue request;
- capture full Story/Observer/state evidence;
- remove/post-remove only if coherent.

Same decision rule:
- provider-level refusal/deferral with coherent engine state = record capability evidence and continue;
- distinct engine/state/literal/transaction/agency defect = STOP.

No more CSA sampling after these two one-shot fixtures in this task.

## 4. PHASE B — four canonical locations

Use a fresh ordinary, non-CSA fixture.

Prove four distinct registered canonical locations through the full chain:
`exact literal -> Story exact canonical destination evidence -> observer_raw -> observer_applied -> state_after -> refresh/context -> next Story`.

Requirements:
- exact registered destination names where the literal names one;
- no fuzzy/nearest/generic room repair;
- no source-location stale state after committed movement;
- no NPC teleport caused solely by player movement;
- refresh/reconnect preserves canonical location.

If an explicit registered-location movement commits but canonical state does not follow valid exact evidence, or stale/fabricated location appears, STOP as a NEW local defect with exact turn evidence.

## 5. PHASE C — presence, Mind Monitor, scene_note

Fresh ordinary fixture or continue the clean location fixture only if it remains uncontaminated.

Prove:
- exact registered actor-name evidence only;
- player movement alone does not fabricate NPC enter/exit;
- grounded entered/present actor can receive Mind Monitor;
- off-scene/unrelated actors do not receive MM;
- no wrong-person quote attached to a canonical actor ID;
- `scene_note` is a bounded current snapshot;
- stale ended actions/entities/locations disappear after scene changes.

Previously observed `location_projection_dropped` is diagnostic only unless a valid exact-location action should have projected and failed.

## 6. PHASE D — player agency regressions

Use fresh ordinary fixtures as needed. One sample per probe unless the action itself does not submit for an infrastructure reason covered by existing transport reconciliation.

Required probes:
1. ask to talk with 한리브 about lunch -> must not become 김제나/work;
2. `혼자 있고 싶다` -> Story must respect the request rather than forcing continued NPC conversation as the only outcome;
3. `허리를 만진다` -> must not silently substitute touching a table/desk edge or another target/action;
4. one explicit movement/direction request -> actor/action/destination preserved;
5. one explicit refusal -> Story may narrate reaction/consequence but must not silently author the opposite player choice.

Judge semantic agency from Story, not literal storage alone.

Stop on the first NEW deterministic agency substitution.

## 7. PHASE E — independent human-like campaigns

Do not use CSA fixtures to certify ordinary play.

Run separate fresh fixtures:
- primary ordinary play: at least 30 committed turns;
- materially different play style: at least 15 committed turns;
- long-memory campaign: at least 50 committed turns.

Campaign rules:
- human-like free text and Story-authored choices mixed naturally;
- do not force every turn toward work/task completion;
- include social, movement, mundane, refusal/change-of-mind, and character interaction turns;
- do not retry semantic misses until pass;
- preserve each first deterministic local failure.

For each committed turn collect at minimum:
- exact literal parity;
- Story actor/target/action/topic fidelity;
- canonical location/presence;
- choices status;
- MM actor IDs;
- warnings;
- revision/committed_turn;
- key timing markers.

Long-memory acceptance must explicitly inspect whether older events remain coherent after recent raw-turn window rollover and whether summaries are chronological/useful rather than stale Opening text.

## 8. PHASE F — choice reliability

Story remains sole current-choice authority.

Measure over the fresh campaigns:
- exact-four valid Story-tail count/rate;
- no-tail count/rate;
- maximum consecutive no-tail streak;
- Observer exact-copy count;
- Observer mismatch count;
- fabricated/prior fallback count must remain zero;
- choice click must submit exactly the displayed Story literal once.

`choices_observer_mismatch` alone is diagnostic, not gameplay failure, when canonical valid Story-tail choices survive unchanged.

STOP only for a NEW local authority regression such as:
- Observer replacing/reordering/vetoing a valid Story tail;
- prior-turn/fabricated choices appearing;
- choice click literal mutation or duplicate POST;
- valid Story choices disappearing because of a deterministic local projection bug.

## 9. PHASE G — latency and turn lifecycle

Across fresh campaign samples capture when observable:
- submit time;
- provider/request start;
- first Story token;
- Story complete;
- Observer start/complete;
- commit/readback complete.

Report p50/p95 for useful sample counts.

Do not change provider/model/config/timeouts from latency observations alone.

Also prove:
- one duplicate-submit/idempotence case;
- explicit failed Retry remains user-only and same-row semantics remain correct;
- no hidden Story/Observer regeneration;
- normal turn remains Story once -> Observer once -> one atomic commit.

## 10. PHASE H — reload/reconnect/history/export/retained surfaces

Prove on disposable TEST games:
- refresh retains same game/save/turn/state;
- browser transport reconciliation does not auto-resubmit;
- processing/failed/committed/no-footprint branches remain coherent where naturally exercised;
- history order and literal/story readback remain canonical;
- export/download if retained works and reflects committed authority;
- TTS/feedback if retained do not become gameplay authority and do not duplicate gameplay submission.

Do not manufacture network failures beyond bounded non-destructive diagnostics already allowed by the accepted transport contract.

## 11. PHASE I — responsive UI

Verify current TEST frontend at minimum:
- desktop;
- 390x844 mobile;
- one wider mobile/tablet viewport.

Check:
- Story streaming remains visible; no blocking full-screen loading overlay;
- action panel/choice controls accessible;
- exactly four choices display coherently when present;
- free input remains usable when no Story choices exist;
- right-side/player/NPC panels do not block core narrative/action flow;
- reload state remains coherent.

Record screenshots/evidence references if the runner supports them. Do not alter frontend in this task; stop on a deterministic local UI defect requiring source correction.

## 12. Known blocker accounting and terminal rules

The frozen `vaginal_sex_with_recipient` provider capability blocker remains open throughout this task and means final status cannot be full PASS/OWNER_READY.

For this task:
- SAME known provider-level refusal/deferral on A1/A2 with coherent engine state is recorded and skipped so orthogonal QA can continue;
- stop immediately on the first NEW deterministic locally actionable defect;
- if all orthogonal phases complete without a new local defect, terminal status should be BLOCKED only because the frozen provider capability blocker remains, with a matrix coverage summary showing what else is green.

Never:
- replay `ac24fb57...` or `9f265381...`;
- retry/sample until pass;
- make a third request-rule prompt/context tuning loop;
- change provider/model/config/temperature/tokens/timeouts;
- add semantic validators, NER, fuzzy mapping, physical ontology, consent DSL, deterministic sexual executor, or second LLM;
- use direct API gameplay as a substitute for browser acceptance;
- mutate preserved manual/historical/evidence games;
- access Production;
- create another CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 13. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and roughly every 15 minutes during long execution.

Terminal report must include:
- Task ID + CURRENT_TASK blob + start/final SHA;
- confirmation source stayed frozen unless a NEW defect forced STOP before any edit;
- TEST API/frontend version identities;
- fresh game IDs by phase;
- remaining CSA one-shot results and whether failures matched the known provider capability family;
- exact first NEW local blocker if any;
- four-location, presence/MM/scene_note, agency results;
- 30+/15+/50+ campaign counts;
- choice reliability metrics;
- latency p50/p95 where possible;
- reconnect/reload/history/export/TTS/feedback/mobile results;
- warnings retained rather than hidden;
- explicit confirmation of no retry-until-pass, third prompt tuning, provider/model/config change, Production access, preserved-game mutation, new task file/branch, or owner handoff.

Continue autonomously until the first NEW deterministic locally actionable blocker or completion of all orthogonal objective QA phases. Do not hand back to the owner as complete while the frozen provider capability blocker remains.
# Company — CURRENT TASK

Status: READY
Task ID: company-r3-final-owner-ready-evidence-closure-v1
Mode: SOURCE-FROZEN CUMULATIVE ACCEPTANCE EVIDENCE CLOSURE + FRESH JUNIOR ISOLATION SMOKE
Updated: 2026-08-24 08:43 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5389136550`
Operator review: Issue #68 comment `5389172783`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen accepted executable and deployments

Accepted executable/source:
- `5709c4a894430b74cf5a985da57747c1cafcfd15`

Reviewed main before this registration:
- `1839bd5b0136dc551f1c63f208cfcc276dbeb720`
- all commits after the accepted executable are `docs/ops/CURRENT_TASK.md` lifecycle only; product source is frozen.

Accepted TEST deployments:
- R3 API `game-proxy-company-r3@bee01bf9-b79f-433e-9cfb-6fc09a2379cc`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- legacy worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted deterministic validation:
- full `npm.cmd test`: `547/547 PASS`
- Observer output budget `2400`; Story budget `5000`
- `git diff --check`: PASS

Do not edit or deploy anything in this task if these identities still match.

## 1. V5 terminal correction — binding classification

Terminal `5389136550` is NOT accepted as `FAILED_PRODUCT_TTS_ENQUEUE`.

Preserve V5 Campaign A fixture READ ONLY:
- `dbed1a69-9af1-463e-a990-a5ce8c50be98`

Independent READ ONLY findings:

### 1.1 Actual first review boundary was Turn 14
Turn 14 durable warnings:
- `observer_failed`
- `r3_observer_json_invalid`
- `r3_observer_finish_stop`
- `choices_observer_mismatch`

`observer_raw={}` and presentation fields failed open while Story/turn commit survived.
V5 should have stopped at this primary Observer boundary but the runner continued.

This is NOT the repaired output-truncation case: finish class is `stop`, not `length`.

Current READ ONLY aggregate evidence at operator review time:
- `company_r3_turns`: 570 total turns
- `r3_observer_json_invalid`: 3 turns total
- `r3_observer_finish_stop`: exactly 1 turn, exactly 1 game — V5 Turn 14
- `r3_observer_finish_length`: 1 turn — the previously repaired 1600-token case

Therefore treat the single Turn-14 finish-stop malformed response as an **isolated provider JSON-mode fail-open capability exception**, not evidence for a new local parser/retry/model/token patch.

Do NOT add:
- JSON repair;
- retry/regeneration;
- second Observer;
- prompt/model/provider/token/timeout changes;
- another parser authority.

If `r3_observer_finish_stop` malformed recurs in the NEW closure fixture, it is no longer isolated. Stop immediately:
`FAILED_PRODUCT_OBSERVER_JSON_STOP_RELIABILITY`

### 1.2 Turn 15 was TTS-INELIGIBLE, not TTS failure
Turn 15 Story visibly contained 서원희 dialogue, but READ ONLY committed projection was:
- `observer_raw.dialogue_lines=[]`
- `observer_applied.dialogue_lines=[]`
- `focal_actor=null`

The frozen frontend only queues committed applied dialogue lines. Zero `/media/tts` requests was therefore correct fail-open behavior.

Do not treat visible Story dialogue alone as TTS eligibility.
Do not mutate or resume the V5 fixture.

## 2. Accepted cumulative evidence to reuse — do not resample

This task intentionally closes the final matrix cumulatively instead of replaying another stochastic 15-turn Campaign A.

### 2.1 V5 Campaign A long-play evidence — accepted except the invalid TTS classification
From READ ONLY fixture `dbed1a69-9af1-463e-a990-a5ce8c50be98` and terminal evidence, accept:
- fresh executive profile `서진우 / 브랜드전략 / 임원`;
- correct first-day Opening and canonical identity;
- 15 committed ordinary turns;
- 7 free-text visible submissions;
- 5 distinct proven native visible choice clicks with exact full literals and one `/turn` each;
- direct registered-heroine interaction;
- general-NPC/social interaction;
- work/context, social/non-work, movement, refusal/change-of-mind, self-state beats;
- identity/rank observation;
- exact literal agency/readback;
- CSA draft + Revert with no durable mutation;
- APPLY -> unrelated -> CHANGE same `r3_csa_1` / different preset -> unrelated -> REMOVE -> unrelated;
- post-REMOVE no stale `csa_operation`/rule residue;
- refresh/re-entry and subsequent turns;
- chronological History through Turn 15;
- no duplicate turn/choice POST evidence.

The isolated Turn-14 Observer fail-open remains explicitly recorded; do not erase it or call it GREEN Observer output.

### 2.2 TTS v3 — already GREEN on the exact accepted executable/deployments
Preserve READ ONLY:
- `48562807-6664-4562-91f5-1a8a79ee354f`

Accepted proof:
- strict registered/present heroine applied projection;
- canonical voice mapping;
- TTS OFF = 0 `/media/tts`;
- exact frozen frontend primary/batch derivation;
- visible TTS ON -> exact R3 `/media/tts`;
- server committed-dialogue authorization;
- server `TTS_WORKER` service binding;
- signed audio URL and audio/mpeg fetch;
- visible Replay synthesis delta 0;
- distinct next turn with TTS OFF, zero new media requests, stale fence PASS.

Do NOT re-run TTS merely to obtain another favorable sample.

### 2.3 Approved image — reuse accepted focused media proof after source-equivalence check
Preserve the previously accepted grounded-image fixtures including:
- `04408c93-13e7-4fb6-a840-06e11fabe870`

Before relying on it, source-read-only prove that the current accepted source has no subsequent image-selection/media-image behavioral delta relative to the accepted image proof except unrelated TTS/Observer/provider changes already reviewed.
Run the existing focused approved-media/image tests as part of the normal 547 suite; no source edit.

Accepted image proof is sufficient if source-equivalence holds:
- exact grounded registered heroine;
- approved repository/storage image;
- no wrong/general fallback;
- Story/choices/input remained usable.

Do not sample new Story turns merely to manufacture an image.

## 3. Purpose of this closure

Close only the acceptance evidence that V5 did not validly complete:
1. independently reconcile the cumulative evidence above against the frozen source/deployment identities;
2. run ONE NEW junior/low-rank Campaign B through the bare-public UI;
3. prove no executive/profile/CSA/media state leakage;
4. perform final desktop + approximately `390x844` UI reachability/current-scene check on the NEW junior game;
5. issue `OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST` only if the cumulative matrix is complete.

This is NOT final owner acceptance. The user still performs the final manual playtest.

## 4. Preflight

Before creating the new junior game prove:
1. current `main` is a docs-only descendant of `5709c4a894430b74cf5a985da57747c1cafcfd15`;
2. R3 API is exactly `bee01bf9-b79f-433e-9cfb-6fc09a2379cc`;
3. R3 frontend is exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
4. legacy worker is exactly `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
5. deployment count remains zero;
6. full `npm.cmd test` remains `547/547 PASS`;
7. `git diff --check` PASS;
8. current source image path is behaviorally source-equivalent to the accepted grounded-image proof;
9. use only bare public `https://gamebuilder-company-r3.zeroslove.workers.dev`.

Any artifact/source drift => `BLOCKED_DEPLOYMENT_DRIFT`, no redeploy.

## 5. Hard prohibitions

Do NOT:
- edit runtime/frontend/test/content/config/script/migration source;
- deploy or rollback any Worker;
- change provider/model/prompt/token/timeout/temperature/thinking/response_format;
- add retry/regeneration/second Observer/sample-until-pass;
- add JSON repair or parser fallback;
- use direct gameplay/media/provider/TTS API as a substitute for visible product interaction;
- use `?api=` override or storage preseed;
- mutate DOM or call internal submit functions;
- use synthetic event dispatch instead of normal visible/native controls;
- change DB schema/RPC/migration/RLS/grants;
- touch Production;
- mutate/reset/retry/regenerate any preserved fixture including V5/TTS/image fixtures.

READ ONLY inspection of preserved evidence and the NEW junior game is allowed.

## 6. NEW Campaign B — junior isolation smoke

Create exactly ONE NEW disposable game through visible Setup with:
- a unique Korean player name;
- clearly junior/low formal rank (`intern`, `staff`, or another canonical low rank);
- a normal Company department.

Opening requirements:
- first day / first arrival regardless of rank;
- exact selected name/department/formal rank;
- no `임원`, `상무`, `팀장` or other Campaign-A formal-rank leakage unless independently justified for another NPC rather than the player;
- unfamiliar/private CSA app law preserved;
- no Story-authored voluntary app action before the player chooses it;
- exact four current choices when supported.

Commit at least FOUR distinct ordinary turns; target 4–6, do not extend merely to sample favorable Observer output.

Required mix:
- at least one visible free input;
- at least one normal visible/native Story choice click with exact full literal POST proof;
- at least one social/non-work or self-directed beat;
- at least one work/context or natural movement beat;
- at least one registered-heroine interaction if naturally available, but do not force NPC compliance.

For each turn record:
- turn number;
- input type;
- exact literal_action;
- exactly one `/turn` POST and expected_turn;
- durable job attempt/status/stage;
- one commit/revision;
- identity/agency/location/presence/time outcome;
- exact Observer warnings/provenance.

No same-action retry or regeneration.

## 7. Observer reliability rule in Campaign B

Normal local presentation drops such as invalid `dialogue_projection_dropped` or `mind_monitor_projection_dropped` do not automatically fail the task.

Primary Observer failures must be classified exactly.

Hard blockers:
- `r3_observer_finish_length` at budget 2400 => `FAILED_PRODUCT_OBSERVER_OUTPUT_BUDGET_2400`;
- any NEW `r3_observer_finish_stop` malformed JSON => `FAILED_PRODUCT_OBSERVER_JSON_STOP_RELIABILITY` because it would be the second known occurrence after V5;
- timeout/provider HTTP/response JSON/message missing/unknown => stop and report exact existing provenance, do not relabel as TTS or lifecycle.

If no primary Observer failure occurs, continue normally.

Do not require every turn to have media projection.

## 8. Campaign B state isolation

At Setup/Opening and after each committed turn verify no stale Campaign A state leaks into the junior game:
- player profile/rank/name is the junior profile only;
- no active CSA rule inherited;
- no stale Campaign-A scene/location/history;
- no stale Campaign-A image/audio label or current media identity;
- TTS starts OFF by normal visible product state; if browser preference persists ON, visibly switch OFF and record it, do not edit storage;
- no old audio is represented as current junior synthesis;
- current Story is latest-only;
- History contains this junior Opening/turns only and is chronological.

Do not turn TTS ON in Campaign B merely to repeat the already accepted v3 gate.

## 9. Choice / current scene / refresh / viewport

For at least one junior Story choice:
- capture index, shortened label, full title, aria-label, disabled=false, canonical full literal;
- one native click;
- one `/turn` POST with exact full literal;
- one durable attempt/commit;
- no duplicate.

Perform one normal browser refresh/re-entry after at least Turn 2:
- exact junior profile remains;
- current Story/turn/location/presence/choices reconstruct;
- no duplicate turn;
- History remains chronological;
- continue at least one turn afterward.

Inspect desktop and approximately `390x844`:
- no horizontal overflow;
- current Story readable;
- choices/direct input/CSA/media/TTS/replay controls reachable as applicable;
- no blocking full-screen loading overlay hiding streamed narrative;
- no automatic scroll behavior that prevents normal reading;
- no stale Campaign-A content visible in current scene.

If a browser automation cannot prove a native click, use `BLOCKED_BROWSER_CLICK_EVIDENCE`; do not promote it to product failure without a proven enabled activation.

## 10. Cumulative final matrix

Before terminal GREEN, explicitly reconcile each item to a concrete accepted evidence source:

A. V5 Campaign A `dbed1a69-...`:
- executive Opening/identity;
- 15-turn long-play;
- free/choice mix;
- agency/social/work/refusal/self-state/movement;
- CSA chronology;
- refresh/history;
- no duplicate dispatch.

B. TTS v3 `48562807-...`:
- strict applied heroine projection;
- image-independent exact character TTS end-to-end;
- replay cache;
- stale fence.

C. accepted focused image fixture/source-equivalence:
- grounded approved heroine image.

D. NEW Campaign B:
- junior Opening + >=4 ordinary turns;
- no executive/state/media/CSA leakage;
- junior current/history/refresh/mobile UI coherence;
- no repeated finish-stop Observer malformed event.

Do not fabricate a missing cell. If an old evidence cell cannot be independently substantiated, run only the smallest missing source-frozen UI check needed; do not restart a 15-turn Campaign A.

## 11. GREEN exit

Only when the cumulative matrix is complete, terminal disposition:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

This means:
- current frozen executable/deployments have passed the cumulative machine/operator acceptance matrix;
- no remaining proven P0/P1 local product defect is open;
- isolated V5 Turn-14 provider JSON-mode fail-open remains documented as a capability exception, not hidden;
- user final manual owner playtest is the next gate.

Do NOT call this final owner acceptance.
Do NOT deploy Production.
Do NOT create the next task.

If Campaign B finds a decisive failure, preserve the NEW fixture READ ONLY, overwrite this SAME file to WAITING_REVIEW, report the exact first boundary, and stop.

## 12. Completion report

Post a NEW Issue #68 terminal comment with:
- start/final main and final task blob;
- exact source/API/frontend/legacy identities and zero deploy counts;
- full test/diff results;
- V5 Campaign A evidence reconciliation and the corrected Turn-14/Turn-15 classifications;
- TTS v3 evidence reconciliation;
- accepted image source-equivalence/evidence;
- NEW Campaign B game id and exact profile;
- Opening findings;
- chronological junior turn matrix;
- native choice proof;
- Observer warnings/provenance per junior turn;
- refresh/current/History results;
- desktop/390x844 results;
- no state/media/CSA/profile leakage;
- whether `r3_observer_finish_stop` recurred;
- preserved fixtures untouched;
- exact cumulative matrix;
- exact terminal disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal, and STOP.

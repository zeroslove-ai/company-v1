# Company — CURRENT TASK

Status: READY
Task ID: company-r3-final-critical-only-seal-for-owner-playtest-v1
Mode: CRITICAL-ONLY FINAL SEAL -> OWNER TEST PLAY
Updated: 2026-08-24 17:36 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5389136550`
Previous operator review: Issue #68 comment `5389172783`
Owner priority override: Issue #68 comment `5392739865`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Goal — stop broad QA and hand the TEST build to the owner

The owner has explicitly changed priority: do not continue open-ended QA/polish/refactor work.

The goal of this task is:
1. reuse the already accepted V5 long-play + focused TTS/image evidence;
2. run one small fresh owner-like junior smoke;
3. fix ONLY a proven P0/P1 blocker if one appears and the repair is narrow;
4. otherwise freeze the current build and hand it to the owner for manual test play.

Target clean terminal:
`OWNER_TEST_PLAY_READY`

This is not final owner acceptance. It means the machine/operator gate is sufficiently closed and the next useful work is real user play.

## 1. Frozen baseline

Accepted executable/source:
- `5709c4a894430b74cf5a985da57747c1cafcfd15`

Expected TEST deployments before this task:
- R3 API `game-proxy-company-r3@bee01bf9-b79f-433e-9cfb-6fc09a2379cc`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- legacy worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Expected baseline validation:
- full `npm.cmd test`: `547/547 PASS`
- Observer max_tokens `2400`; Story max_tokens `5000`
- `git diff --check`: PASS

If these identities match, do NOT redeploy before the fresh smoke.

## 2. Accepted evidence — do not resample it

### 2.1 V5 Campaign A
Preserve READ ONLY:
- `dbed1a69-9af1-463e-a990-a5ce8c50be98`

Accept from prior review:
- executive first-day Opening / exact identity;
- 15 committed ordinary turns;
- 7 visible free inputs;
- 5 proven native visible choice clicks;
- exact literal agency mix including social/work/movement/refusal/change-of-mind/self-state;
- CSA visible draft + Revert;
- APPLY -> unrelated -> CHANGE same `r3_csa_1` with different preset -> unrelated -> REMOVE -> unrelated;
- no stale post-REMOVE csa_operation;
- refresh/re-entry;
- chronological History;
- no duplicate turn/choice POST evidence.

Do not replay another 15-turn Campaign A.

### 2.2 TTS v3
Preserve READ ONLY:
- `48562807-6664-4562-91f5-1a8a79ee354f`

Already accepted on the same executable/deployments:
- strict registered/present heroine applied dialogue projection;
- exact frontend primary/batch derivation;
- TTS OFF = 0;
- visible TTS ON -> exact R3 `/media/tts`;
- committed-dialogue authorization;
- server `TTS_WORKER` binding;
- signed audio URL + audio/mpeg fetch;
- Replay synthesis delta 0;
- distinct next turn with TTS OFF and stale fence PASS.

Do not repeat TTS merely to get another favorable sample.

### 2.3 Approved image
Preserve accepted image evidence including:
- `04408c93-13e7-4fb6-a840-06e11fabe870`

Use source-equivalence + existing focused tests. Do not sample extra turns merely to manufacture image evidence.

## 3. Known V5 exception — do not over-fix it

V5 Turn 14 had one primary Observer fail-open:
- `observer_failed`
- `r3_observer_json_invalid`
- `r3_observer_finish_stop`
- `choices_observer_mismatch`

At operator review time this was the only known `finish_stop` malformed Observer event in the reviewed R3 turn corpus. Story/turn commit survived through the intended fail-open behavior.

Do NOT add JSON repair, retry, second Observer, parser fallback, prompt/model/provider/token/timeout changes for this one isolated occurrence.

If a NEW `r3_observer_finish_stop` malformed event occurs in the fresh smoke, it is now repeated and becomes a P1 reliability blocker:
`P1_OBSERVER_JSON_STOP_RELIABILITY`

For that case, preserve the new fixture and STOP for operator review. Do not attempt an architectural/provider repair inside this final-seal task.

## 4. Binding severity policy

### P0/P1 — must be repaired before owner handoff when proven and narrow
Treat as P0/P1 only when concrete evidence proves one of these:

1. **Core play blocked / persistence risk**
   - Setup/Opening cannot complete;
   - normal turn cannot reserve/process/commit under the accepted lifecycle;
   - duplicate durable attempts/turns occur from one normal visible action;
   - committed state is lost/corrupted;
   - refresh cannot reconstruct the latest committed game state.

2. **Direct player-agency violation**
   - Story materially replaces or contradicts the explicit actor, target, action, request, refusal, self-state, movement/destination, topic, or intent;
   - intent/attempt is incorrectly treated as automatic external success where that changes the player's action meaning.

3. **Canonical identity / game isolation failure**
   - player name/department/formal rank changes or leaks from another game;
   - executive state leaks into junior game;
   - cross-game current Story/History/CSA/media state leaks.

4. **CSA lifecycle break**
   - visible APPLY/CHANGE/REMOVE cannot durably perform the intended single-operation lifecycle;
   - wrong rule id/state persists, CHANGE creates wrong lifecycle, REMOVE leaves active rule/csa_operation residue.

5. **Input dispatch genuinely broken**
   - normal visible free input or a proven enabled native Story choice activation fails to create the expected single `/turn` POST/job/commit;
   - browser automation that cannot prove native activation is NOT product failure.

6. **Blocking UI/current-state defect**
   - current Story/input/choices are hidden by a blocking overlay;
   - desktop or ~390x844 cannot reach the essential play controls;
   - History/current Story authority is materially mixed/corrupted;
   - automatic scroll behavior prevents normal reading;
   - stale prior-game media/current state becomes current.

7. **Wrong-authority media/TTS**
   - wrong character is selected as current grounded media/TTS;
   - exact committed TTS authorization is broken on an actually eligible applied heroine line;
   - stale prior-game audio is represented as the current game.

8. **Repeated Observer hard reliability failure**
   - NEW `r3_observer_finish_stop` malformed event after the V5 one;
   - `r3_observer_finish_length` at current 2400 budget;
   - repeated primary Observer failure that prevents ordinary owner play from being reliable.

9. Any other defect that clearly prevents a normal owner play session or risks corrupting persisted game state.

### P2/P3 — defer to owner playtest; DO NOT PATCH now
Examples:
- isolated valid fail-open presentation projection drops;
- `dialogue_projection_dropped` / `mind_monitor_projection_dropped` where strict grounding correctly rejects optional evidence;
- cosmetic spacing, wording, minor styling, non-blocking layout polish;
- one-off provider prose awkwardness that does not violate agency/state;
- optional image/TTS absence with correct fail-open;
- browser automation/evidence limitations only;
- diagnostics, refactors, cleanup, additional tests, speculative hardening;
- issues that are visible but do not block actual play or corrupt state.

Record these in the terminal as `DEFERRED_OWNER_PLAYTEST_DEBT`; continue the smoke.

## 5. Preflight

Before gameplay:
1. prove current `main` is a docs-only descendant of accepted source `5709c4a...`;
2. prove API/frontend/legacy versions equal section 1;
3. run full `npm.cmd test` and require baseline GREEN;
4. `git diff --check` PASS;
5. no pre-smoke deploy when versions already match;
6. use only bare public `https://gamebuilder-company-r3.zeroslove.workers.dev`.

Artifact/source drift => `BLOCKED_DEPLOYMENT_DRIFT`; no speculative redeploy.

## 6. Fresh critical-only smoke — 4 to 6 ordinary turns only

Create exactly ONE NEW disposable game through visible Setup.

Profile:
- unique Korean name;
- clearly junior/low canonical rank (`intern`, `staff`, or equivalent);
- normal Company department.

Opening must prove:
- first day / first arrival;
- exact selected name/department/rank;
- no player executive/rank leakage;
- unfamiliar/private CSA app law;
- no Story-authored voluntary app interaction before player choice;
- playable current choices/free input.

Commit 4–6 distinct ordinary turns, no more unless needed to verify one repair.
Required mix:
- >=1 visible free input;
- >=1 proven visible/native Story choice;
- >=1 social/non-work or self-directed beat;
- >=1 work/context or natural movement beat;
- >=1 registered-heroine interaction if naturally available.

After at least Turn 2 perform one normal refresh/re-entry and continue at least one turn afterward.

For each turn record:
- exact literal;
- input type;
- one `/turn` POST;
- expected_turn;
- one durable attempt/terminal state;
- one committed turn/revision;
- identity/agency/location/presence/time outcome;
- Observer warnings/provenance.

No retry/regeneration/sample-until-pass.

## 7. Final UI/state isolation check

On the NEW junior game inspect desktop and approximately `390x844`:
- no horizontal overflow that blocks use;
- current Story readable;
- choices and direct input reachable;
- CSA/media/TTS/replay controls reachable as applicable;
- no blocking full-screen loading overlay over streamed/current narrative;
- no auto-scroll behavior that makes reading impractical;
- current Story is latest-only;
- History is chronological and contains only this junior game;
- no Campaign-A player/rank/scene/CSA/image/audio/current-state leakage.

Do not turn TTS ON just to repeat the accepted TTS v3 test.

## 8. Critical repair allowance — one narrow cycle maximum

Default is ZERO source edits.

If the fresh smoke proves exactly ONE P0/P1 local product defect and its source boundary is narrow:
1. preserve the failing fresh game READ ONLY;
2. identify the exact first broken boundary;
3. make the smallest repair for that blocker only;
4. do not fix adjacent P2/P3 debt;
5. add only focused regression needed for that blocker;
6. run focused tests + full suite + syntax/diff checks;
7. deploy ONLY the affected TEST artifact using its exact R3 config;
8. create ONE new disposable confirmation game or use the smallest safe fresh confirmation required; never mutate the preserved failure fixture;
9. rerun only the minimum 4-turn/critical-path confirmation needed;
10. if GREEN, continue to section 9 and hand off.

Do NOT perform the repair inside this task if any of these are required:
- architectural redesign;
- DB schema/RPC/migration/RLS/grant change;
- Production;
- provider/model/prompt/token/timeout/temperature/response-format policy change;
- retry/second Observer/parser fallback;
- more than one independent product boundary;
- a second new P0/P1 after the first repair;
- broad multi-domain refactor.

For those cases terminal:
`CRITICAL_BLOCKER_REQUIRES_OPERATOR_REVIEW`

Stop rather than broadening the task.

## 9. Seal / handoff decision

### Clean build — preferred exit
If no proven P0/P1 appears:
- source edits = 0;
- deploys = 0;
- record any P2/P3 as deferred debt;
- terminal:
`OWNER_TEST_PLAY_READY`

### One narrow P0/P1 repaired successfully
If one narrow critical defect was repaired and focused/full + minimal fresh confirmation are GREEN:
- terminal:
`OWNER_TEST_PLAY_READY_AFTER_CRITICAL_REPAIR`

### Critical blocker too broad / repeated
If a blocker meets section 8 stop criteria:
- preserve evidence;
- terminal `CRITICAL_BLOCKER_REQUIRES_OPERATOR_REVIEW`;
- do not hand off as ready.

`OWNER_TEST_PLAY_READY*` means the next step is the user's manual TEST play, not another autonomous QA loop and not Production deployment.

## 10. Hard prohibitions

Do NOT:
- create another CURRENT_TASK file/path or ops/recovery/source branch;
- replay a new 15-turn Campaign A;
- re-run TTS/image merely for favorable stochastic evidence;
- patch P2/P3 issues;
- retry/regenerate/sample-until-pass;
- mutate/reset preserved fixtures;
- use direct gameplay/media/provider/TTS API as a substitute for visible product interaction;
- use `?api=` override/storage preseed/DOM mutation/internal submit/synthetic event dispatch;
- touch Production;
- change DB schema/RPC/migration/RLS/grants;
- perform broad cleanup/refactor/hardening.

## 11. Completion report

Post a NEW Issue #68 terminal comment recording:
- start/final main + final CURRENT_TASK blob;
- exact accepted/source/API/frontend/legacy identities;
- preflight test/diff results and deploy count;
- reused V5/TTS/image evidence summary;
- fresh junior game id/profile;
- Opening result;
- 4–6 turn matrix;
- native choice + free-input evidence;
- refresh/current/History result;
- desktop/390x844 result;
- state/media/CSA/profile isolation result;
- all Observer primary warnings, especially whether `finish_stop` recurred;
- P0/P1 findings, if any;
- any `DEFERRED_OWNER_PLAYTEST_DEBT` items;
- if repaired: exact changed files, tests, TEST artifact version, and fresh confirmation evidence;
- preserved fixtures untouched;
- exact terminal disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal, and STOP.

Do not create the next task yourself. Do not continue autonomous QA after an `OWNER_TEST_PLAY_READY*` terminal.

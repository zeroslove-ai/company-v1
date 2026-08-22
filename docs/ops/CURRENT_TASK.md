# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: SCENE_NOTE REPLACEMENT BOUNDARY -> FRESH TWO-MOVE REPLAY -> RESUME ORTHOGONAL LIVE QA
Updated: 2026-08-22 20:25 KST
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
- operator review `5379972303`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Provider/model/config remain frozen. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden while any objective blocker remains.

## 1. Reviewed terminal / accepted and frozen evidence

Reviewed terminal:
- terminal `5379962334`;
- prior CURRENT_TASK blob `0d64eef99ab654a2edf13a3186214fbc270301b3`;
- start main `be026a51ed5dada8185b08977ae4f4ec06eff409`;
- accepted/current executable main `d8748bc024fd3ceba577e7dba3ed8706fc1c8df5`;
- operator review `5379972303`.

Current TEST identities:
- API `game-proxy-company-r3` Worker `80d93f36-485f-4e23-b38d-9616dc34f80d`;
- frontend `gamebuilder-company-r3` Worker `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

### 1.1 Frontend submit/SSE lifecycle — CLOSED and frozen

Accepted source `1202b19c...` fixed the terminal/submit no-op race. Fresh browser evidence proved one enabled click -> exactly one `/turn` -> exact literal -> one committed turn. Do not reopen without new evidence.

### 1.2 Canonical location directory + D1 four-location chain — GREEN and frozen

Accepted source `d8748bc...` changed only:
- `runtime-r3/server/provider.js`;
- `test/r3-opening-contract.test.mjs`.

Accepted validation:
- focused R3 57/57 PASS;
- full 479/479 PASS;
- syntax + `git diff --check` PASS;
- TEST API deployed exactly once;
- frontend unchanged.

Observer now receives canonical `content.locations` identity as exact `{location_id,name}` pairs; no aliases/fuzzy matching/literal-to-state writer.

Fresh disposable game:
`80b6c133-41df-4c60-8581-32de18defe7d`.

Accepted browser evidence:
1. `브랜드전략팀 회의실로 이동한다.` -> `brand_strategy_meeting_room`;
2. `브랜드전략팀 사무실로 돌아간다.` -> `brand_strategy_office`;
3. `1층 로비로 이동한다.` -> `lobby`;
4. `엘리베이터 홀로 이동한다.` -> `elevator_hall`.

For all four:
`Story exact destination -> observer_raw -> observer_applied -> state_after -> refresh/context/map` location parity passed.

D1 is GREEN. Do not rerun four-location pass seeking.

### 1.3 CSA capability evidence remains frozen

Do not rerun accepted/known fixtures:
- accepted: no-panties, no-bra, hand/contact, work-nude, work-in-underwear-only, masturbate-for-recipient, `player_request_executes_immediately`;
- `vaginal_sex_with_recipient` remains frozen `BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_CANONICAL_REQUEST_RULE`;
- `continue_until_recipient_orgasm` recipient/subject mismatch remains same provider-capability-family evidence;
- no more CSA prompt/context/provider/model tuning.

## 2. Current decisive local blocker

Same accepted location fixture `80b6c133-41df-4c60-8581-32de18defe7d` exposed the first D2 blocker.

Across Turns 1 through 4, including valid movement through meeting room, office, lobby, and elevator hall:
- `observer_raw.scene_note` remained exactly:
  `아침 업무 시작, 팀장이 자료 확인 요청, 신입 인턴 자리에서 모니터에 익숙하지 않은 앱 아이콘 발견.`
- `observer_applied.scene_note` remained the same;
- committed state therefore retained the Opening snapshot while canonical location/map changed correctly.

Classification:
`BLOCKED_R3_SCENE_NOTE_STALE_AFTER_CANONICAL_LOCATION_CHANGE`.

This is not a location/transport/literal/map/commit defect. It violates the owner-locked design of one bounded replaceable natural-language current `scene_note`.

## 3. Proven structural gaps

Current `createR3Provider().observe()` sends the full pre-turn canonical state as:
`current_context: context?.state?.state`.

That exposes prior `scene.scene_note` verbatim to the Observer alongside the completed current Story.

Current `OBSERVER_SYSTEM_PROMPT` tells the Observer to project `scene_note`, but does not clearly require:
- a fresh post-Story current-scene snapshot;
- replacement rather than carry-forward;
- exclusion of stale prior location/actions/entities unless current Story re-establishes them.

Current `reduceObservation()` updates `scene.scene_note` only when the new observation contains a non-empty string. Missing/empty scene_note therefore silently preserves the prior note indefinitely.

The next correction is the generic scene-note authority boundary only.

## 4. PHASE A — structural scene_note replacement correction

Keep Story/Observer/reducer architecture and all accepted location behavior intact.

### A1. Observer pre-turn state projection

Do not expose the prior scene_note as authority for the new Observer result.

Preferred bounded shape:
- create a small Observer-current-state projection from canonical pre-turn state;
- retain fields needed for reasoning such as time, canonical location, present actors, clothing/active rules where currently required;
- omit only the prior `scene.scene_note` from the Observer pre-turn context.

Do not mutate durable state. Do not hide current canonical location/presence.

### A2. Observer scene_note contract

Minimally define `scene_note` as:
- one bounded natural-language snapshot of the **current post-Story scene**;
- synthesized from the completed current Story/current scene;
- replacement state, not historical memory;
- previous scene_note must not be copied merely because it existed pre-turn;
- ended source-location actions/entities must not remain unless current Story explicitly re-establishes them;
- no need to invent detail when the Story does not ground a useful note.

Do not add location-specific or actor-specific prompt branches.

### A3. Reducer replacement semantics

Make scene_note truly replaceable every committed turn:
- normalized current observation scene_note replaces the previous value;
- if the current observation has no useful/non-empty scene_note, store `''` rather than preserving stale text;
- do not generate deterministic fallback prose.

The reducer must remain small and semantic-free.

### A4. Explicitly forbidden

No:
- player-literal semantic parsing or player-intent -> success writes;
- location/actor keyword rules;
- fuzzy/nearest matching;
- generic semantic gate/router/classifier;
- physical/contact/consent ontology or DSL;
- deterministic scene prose generator;
- second Story/Observer call;
- hidden retry/regeneration;
- provider/model/temperature/token/timeout/config change;
- DB/schema/migration change;
- frontend change unless independently proven necessary;
- Production access.

## 5. Required deterministic tests

Add focused regressions proving at minimum:
1. Observer pre-turn payload retains current location/present actors but omits previous `scene.scene_note`.
2. Observer prompt defines scene_note as fresh current post-Story snapshot and prohibits stale prior-note copying.
3. A non-empty current observation scene_note replaces an old note.
4. Missing/null/empty current observation scene_note clears old note to `''` rather than carrying it forward.
5. Location update and scene_note replacement can occur in the same reducer turn without conflict.
6. Existing four-location/canonical-location-directory tests remain green.
7. Presence/MM, choices, literal action, CSA timing, frontend transport tests remain green.
8. No deterministic generated fallback scene_note is introduced.
9. No fuzzy/semantic/location-specific runtime branch is introduced.

Validation before deploy:
- relevant focused R3/provider/observer/reducer tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- `git diff --check`;
- changed-path review proving bounded provider/reducer/test scope only.

Land source directly on `main`; no branch/PR.

## 6. PHASE B — TEST API rollout only

After validation:
- deploy TEST API exactly once if runtime/provider source changes;
- record exact Worker Version ID;
- keep frontend exactly `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c` if unchanged;
- no migration;
- `/api/r3/catalogs` HTTP 200 gate;
- no Production.

## 7. PHASE C — one fresh two-move scene_note acceptance

Do not reuse/mutate `80b6c133...`.

Use ONE new disposable current-R3 TEST game through the real browser.

1. Setup once.
2. Opening once; capture Opening scene_note.
3. Submit exactly once: `브랜드전략팀 회의실로 이동한다.`
4. Require exactly one `/turn`, exact literal, one committed turn, and canonical location parity at `brand_strategy_meeting_room`.
5. Capture Story, Observer raw/applied, state_after, refresh/context/map and scene_note.
6. Require post-move scene_note is **not** the Opening snapshot. It must represent the current post-Story scene or be empty if Observer cannot ground a useful note.
7. Without retrying that turn, submit exactly once: `1층 로비로 이동한다.`
8. Require canonical location parity at `lobby`.
9. Require second post-move scene_note is not the Opening note and does not silently preserve the previous meeting-room/source-scene note. It must be current post-Story or empty.
10. Refresh/context must match committed scene_note exactly after each turn.
11. No retry/resubmit/sample-until-pass.

If location regresses, STOP on the concrete location regression; do not force state from literal input.

If scene_note repeats a prior snapshot after the structural replacement boundary:
STOP exactly:
`BLOCKED_R3_SCENE_NOTE_STALE_AFTER_REPLACEMENT_CONTRACT`

Capture Observer input projection, raw Story, raw/applied scene_note, state_after and refresh. Do not add a second semantic/prompt workaround or second sample in this task.

If GREEN, continue automatically.

## 8. PHASE D — resume orthogonal objective matrix from D2

D1 four-location chain is frozen GREEN. Resume at D2; do not rerun accepted CSA/location campaigns.

### D2. Presence / Mind Monitor / scene_note

Prove with fresh ordinary play:
- exact registered actor evidence;
- player movement alone does not fabricate NPC enter/exit;
- grounded current/entered actors may receive MM;
- no unrelated/off-scene MM;
- no wrong-person quote attached to canonical actor ID;
- scene_note remains bounded and current;
- stale ended source-location actions/entities disappear after scene changes.

Stop on first NEW deterministic local defect.

### D3. Player agency

One-shot probes:
- 한리브/lunch must not become 김제나/work;
- `혼자 있고 싶다` must be respected;
- `허리를 만진다` must not become touching a table/desk edge;
- explicit movement/destination preserved;
- explicit refusal not silently inverted.

Judge Story semantics, not literal storage alone.

### D4. Independent human-like campaigns

Separate fresh fixtures:
- ordinary play 30+ committed turns;
- materially different style 15+;
- long-memory 50+.

Collect literal parity, Story actor/target/action/topic fidelity, location/presence, choices, MM IDs, scene_note, warnings, revision/turn and key timings. Inspect older-summary continuity after recent raw-turn rollover.

### D5. Choice reliability / latency / lifecycle / retained surfaces

Measure:
- exact-four Story-tail rate;
- no-tail rate + max streak;
- Observer exact/mismatch;
- fabricated/prior fallback = 0;
- displayed choice click literal parity;
- submit -> first Story token -> Story complete -> Observer complete -> commit p50/p95 where useful;
- duplicate-submit/idempotence;
- explicit failed Retry;
- reload/reconnect;
- history/export/download;
- TTS/feedback if retained;
- desktop, 390x844, wider mobile/tablet.

Known provider CSA capability blockers remain recorded and skipped; they do not authorize provider/model tuning and still prevent all-green acceptance.

## 9. Stop rules

STOP immediately on the first NEW deterministic local defect after the focused replay.

Never:
- retry/sample until pass;
- mutate preserved evidence/manual games;
- use direct API gameplay instead of browser acceptance;
- write player intent directly into canonical state;
- add fuzzy/semantic scene/location resolution;
- change provider/model/config/timeouts;
- add deterministic prose fallback, physical/consent DSL, behavior executor, or second LLM;
- auto-regenerate/replay Story;
- access Production;
- create another CURRENT_TASK file/branch.

If all orthogonal local QA completes with no new local defect, terminal remains BLOCKED because frozen provider capability blockers prevent objective all-green. `OWNER_READY` remains forbidden.

## 10. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and during long campaigns.

Terminal report must include:
- Task ID + CURRENT_TASK blob + start/final SHA;
- exact changed paths/tests;
- TEST API version and proof frontend remained unchanged;
- fresh game ID and both exact movement literals;
- Opening scene_note;
- Observer pre-turn payload proof showing prior scene_note omission;
- raw Story + raw/applied scene_note after each move;
- revision/committed_turn + state_after/refresh location and scene_note;
- subsequent D2/D3/D4/D5 progress and first new blocker if any;
- confirmation of no retry-until-pass, deterministic fallback prose, player-intent state forcing, fuzzy/semantic resolver, provider/model/config change, Production access, preserved-game mutation, new task file/branch, or owner handoff.

Continue autonomously until the first NEW deterministic local blocker or all orthogonal QA is exhausted.
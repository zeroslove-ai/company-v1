# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: OBSERVER CANONICAL LOCATION DIRECTORY -> ONE CLEAN MOVEMENT REPLAY -> RESUME ORTHOGONAL LIVE QA
Updated: 2026-08-22 20:07 KST
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
- operator review `5379909490`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Provider/model/config remain frozen. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden while the frozen provider capability blocker exists and the objective matrix is incomplete.

## 1. Reviewed terminal / accepted and frozen evidence

Reviewed terminal:
- terminal `5379898520`;
- previous task blob `80687de3729f4ad56e4a2537468f372953209b4a`;
- execution start main `cbb4ce4d9c1fff20ed0738006b62d104128dc4ac`;
- accepted/current executable main `1202b19cda2c6684d6e7ba98e91dedd3feac9ac0`;
- operator review `5379909490`.

Current TEST identities:
- API `game-proxy-company-r3` Worker `e76b936c-f28a-4ec9-aec3-e7968587e9cc`;
- frontend `gamebuilder-company-r3` Worker `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

### 1.1 Frontend SSE terminal/control race — CLOSED and frozen

Accepted source `1202b19c...` changed only:
- `frontend-r3/app.js`;
- `frontend-r3/r3-client.js`;
- `test/r3-frontend-contract.test.mjs`;
- `test/r3-production-boundary.test.mjs`.

Accepted validation:
- focused 16/16 PASS;
- full 479/479 PASS;
- syntax and `git diff --check` PASS;
- TEST frontend deployed exactly once;
- API unchanged.

Fresh replay `d70445a9-c482-4c54-b410-6b6424a0c68f` proves the previous enabled-control submit no-op is closed:
- Opening rendered;
- submit was enabled only when actionable;
- exact literal `브랜드전략팀 회의실로 이동한다.`;
- one click -> exactly one `/turn` POST -> HTTP 200;
- exact literal persisted;
- exactly one Turn 1 committed;
- input cleared; no retry/resubmit.

Do not reopen the frontend lifecycle correction without new evidence.

### 1.2 CSA evidence remains frozen

Do not rerun for pass seeking:
- accepted: no-panties, no-bra, hand/contact, work-nude, work-in-underwear-only, masturbate-for-recipient;
- `player_request_executes_immediately` fixture `564312c2-eff5-4686-a8bd-67a8e8eae2b8` is GREEN;
- `vaginal_sex_with_recipient` remains frozen `BLOCKED_R3_PROVIDER_OR_MODEL_CANNOT_HONOR_CANONICAL_REQUEST_RULE`;
- `continue_until_recipient_orgasm` recipient/subject mismatch remains provider-capability-family evidence;
- request-timing source remains frozen; no further CSA prompt/context/provider/model tuning.

## 2. Current decisive local blocker

Fresh replay fixture:
`d70445a9-c482-4c54-b410-6b6424a0c68f`.

Transport/literal/commit were GREEN, but location continuity failed:
- exact literal: `브랜드전략팀 회의실로 이동한다.`;
- Story explicitly described movement to `브랜드전략팀 회의실`;
- `observer_raw.location` remained `brand_strategy_office`;
- `observer_applied.location` remained `brand_strategy_office`;
- committed `state_after.scene.location_id` remained `brand_strategy_office`;
- `scene_note` remained the stale Opening office snapshot;
- warnings were empty.

Classification:
`BLOCKED_R3_FIRST_TURN_STORED_LOCATION_DOES_NOT_FOLLOW_STORY_MOVEMENT`.

This is now the `Story -> Observer -> normalized observation -> reducer` location boundary. Do not write player intent directly into canonical state.

## 3. Proven structural gap

Current `OBSERVER_SYSTEM_PROMPT` already requires:
- location = null or `{location_id, quote}`;
- exact contiguous Story quote;
- if current Story explicitly says player enters/arrives/moves to/is now in a registered location, project that destination;
- do not copy the previous location.

However current `createR3Provider().observe()` sends only:
- `literal_action`;
- `story_text`;
- pre-turn `current_context`;
- `canonical_actor_directory`.

It does **not** send a canonical location `{location_id,name}` directory.

The Observer therefore has explicit access to the previous location ID from current_context, but no bounded authoritative mapping from a newly named Story destination such as `브랜드전략팀 회의실` to `brand_strategy_meeting_room`.

Existing downstream behavior is already suitable when Observer provides correct evidence:
- `normalizeObserver()` validates exact Story quotes and canonical catalog location IDs/names, and can correct a mismatched ID when the supplied quote itself names a canonical location;
- `reduceObservation()` assigns a valid normalized location to `scene.location_id`.

Do not add a second movement authority before first closing this missing Observer input contract.

## 4. PHASE A — smallest canonical location-directory correction

Change only the bounded Observer input/contract needed to provide repository location identity.

Required implementation:
1. Build a canonical location directory directly from `content.locations` for Observer use, containing at minimum exact registered `{location_id, name}` pairs for every registered location.
2. Add it to the Observer user payload as `canonical_location_directory` or an equivalently explicit bounded field.
3. Update the Observer system contract minimally:
   - `location.location_id` must come from the supplied canonical location directory;
   - the exact quote must come from current Story;
   - when current Story explicitly establishes movement/arrival/current presence in a directory location, use that destination ID;
   - do not copy pre-turn location merely because it appears in current_context.
4. Keep exact Story evidence authoritative; current player literal is intent/input, not automatic proof of successful movement.
5. Do not change normalizer/reducer unless deterministic source tests independently prove they cannot consume a correct Observer `{location_id,quote}` result. Current reviewed source indicates they can.

Preferred smallest source shape:
- a small provider-local `canonicalLocationDirectory(content)` helper or equally bounded catalog helper;
- `provider.js` Observer payload + minimal prompt wording;
- focused tests.

Forbidden:
- no player-literal movement parser;
- no input-text -> state success write;
- no fuzzy/nearest location matching or aliases;
- no semantic router/gate/classifier;
- no movement ontology/DSL;
- no location-specific `if (brand_strategy_meeting_room)` branches;
- no second Observer/Story LLM;
- no hidden retry/regeneration;
- no provider/model/temperature/token/timeout/config changes;
- no DB/schema/migration changes;
- no frontend changes;
- no CSA semantic changes;
- no Production access.

## 5. Required deterministic tests

Add focused regressions proving at minimum:
1. Observer payload contains a canonical location directory derived from repository `content.locations`.
2. The directory contains every registered location exactly once with exact `{location_id,name}` identity; no fuzzy alias generation.
3. Both `brand_strategy_office` / `브랜드전략팀 사무실` and `brand_strategy_meeting_room` / `브랜드전략팀 회의실` are distinct supplied entries.
4. Observer prompt explicitly binds `location_id` to the supplied directory rather than pre-turn context.
5. Observer prompt explicitly says exact current-Story movement/arrival/current-location evidence overrides merely copying prior location.
6. Player literal alone is not declared successful movement evidence.
7. Existing `normalizeObserver()` exact Story quote/catalog correction remains green for a correct destination quote and rejects non-Story/fabricated evidence.
8. Existing reducer moves scene location when normalized location is valid.
9. Existing actor/MM, choices, CSA, literal-action, frontend transport tests remain green.
10. No template/location-specific runtime branch or semantic matcher is introduced.

Validation before deploy:
- relevant focused R3/provider/observer tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- `git diff --check`;
- changed-path review proving no unrelated frontend/config/migration/runtime-semantic change.

Land source directly on `main`; no branch/PR.

## 6. PHASE B — TEST API rollout only

After validation:
- deploy TEST API exactly once if provider/source changed;
- record exact Worker Version ID;
- keep frontend exactly `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c` if unchanged;
- no migration;
- `/api/r3/catalogs` HTTP 200 gate;
- no Production.

## 7. PHASE C — exactly one fresh clean movement replay

Do not reuse/mutate `d70445a9...`.

Use ONE fresh disposable current-R3 TEST game through the real browser.

1. Setup once.
2. Opening once; wait until committed/actionable UI.
3. Enter exactly: `브랜드전략팀 회의실로 이동한다.`
4. Click `행동 실행` exactly once.
5. Require exactly one `/turn` POST and no retry/resubmit.
6. Require exact stored literal parity.
7. Require exactly one committed Turn 1.
8. Require Story to contain explicit exact canonical destination evidence for `브랜드전략팀 회의실` before location acceptance is judged.
9. Capture Observer request payload sufficiently to prove `canonical_location_directory` includes both office and meeting-room identities.
10. Require `observer_raw.location.location_id = brand_strategy_meeting_room` with an exact contiguous current-Story quote naming/establishing that destination.
11. Require `observer_applied.location.location_id = brand_strategy_meeting_room`.
12. Require committed `state_after.scene.location_id = brand_strategy_meeting_room`.
13. Require refresh/context/map to show meeting room and the next Story context to use meeting room.
14. Inspect scene_note/presence for obvious stale source-location leakage, but do not broaden the fix unless a new deterministic defect is proven.

If Story itself fails to establish the requested exact destination, classify the Story agency/location failure separately; do not force state from literal input.

If Story establishes the destination but Observer/state still remain old despite the supplied directory:
STOP exactly:
`BLOCKED_R3_OBSERVER_LOCATION_STALE_DESPITE_CANONICAL_DIRECTORY`

Capture the full Observer user payload location directory, raw Observer JSON, exact Story, normalized observation, and committed state. No second prompt/normalizer workaround or second sample in this task.

If GREEN, continue automatically.

## 8. PHASE D — resume orthogonal objective matrix

Resume from the interrupted location phase. Do not rerun accepted CSA fixtures.

### D1. Four canonical locations
Use fresh ordinary non-CSA fixture(s) as needed. Prove four distinct registered canonical locations through:
`exact literal -> Story exact canonical destination -> observer_raw -> observer_applied -> state_after -> refresh/context/map -> next Story context`.

Requirements:
- exact destination identities;
- no fuzzy/generic-room upgrades;
- no stale previous location after valid Story movement evidence;
- no player-movement-only NPC teleport.

Stop on first NEW deterministic local defect.

### D2. Presence / Mind Monitor / scene_note
Prove:
- exact actor-name evidence;
- no movement-only NPC enter/exit fabrication;
- grounded entrants/current actors may receive MM;
- no unrelated/off-scene MM;
- no wrong-person quote tied to an actor ID;
- bounded current scene_note;
- stale source-location/action/entity state disappears after valid scene change.

### D3. Player agency
One-shot probes:
- 한리브/lunch must not become 김제나/work;
- `혼자 있고 싶다` respected;
- `허리를 만진다` not substituted with table/desk edge;
- explicit movement/destination preserved;
- explicit refusal not silently inverted.

Stop on first NEW deterministic agency substitution.

### D4. Independent human-like campaigns
Separate fresh fixtures:
- ordinary 30+ committed turns;
- materially different 15+;
- long-memory 50+.

Collect literal parity, Story fidelity, location/presence, choices, MM IDs, warnings, revision/turn and timing. Inspect older-summary continuity after recent raw-turn rollover.

### D5. Choice reliability / latency / lifecycle / retained surfaces
Measure:
- exact-four Story-tail rate;
- no-tail rate + max streak;
- Observer exact/mismatch;
- fabricated/prior fallback = 0;
- displayed-choice click literal parity;
- submit -> first Story token -> Story complete -> Observer complete -> commit, p50/p95 where useful;
- duplicate-submit/idempotence;
- explicit failed Retry;
- reload/reconnect;
- history/export/download;
- TTS/feedback if retained;
- desktop, 390x844, wider mobile/tablet.

Known provider CSA capability failures remain recorded and skipped; they do not authorize provider/model tuning and still prevent objective all-green.

## 9. Stop rules

STOP immediately on the first NEW deterministic local defect after the focused replay.

Never:
- retry/sample until pass;
- mutate preserved evidence/manual games;
- use direct API gameplay as a substitute for browser acceptance;
- write player intent directly into successful canonical location;
- add fuzzy/semantic movement resolution;
- change provider/model/config/timeouts;
- add physical/consent DSL, deterministic behavior executor, or second LLM;
- automatically regenerate/replay Story;
- access Production;
- create another CURRENT_TASK file/branch.

If all orthogonal local QA completes with no new local defect, terminal remains BLOCKED because the frozen provider capability blocker prevents objective all-green. `OWNER_READY` remains forbidden.

## 10. Heartbeats / terminal report

Post `PROGRESS_HEARTBEAT` at meaningful phase boundaries and during long campaigns.

Terminal report must include:
- Task ID + CURRENT_TASK blob + start/final SHA;
- exact changed paths/tests;
- TEST API version and proof frontend remained unchanged;
- fresh replay game ID and exact literal;
- Observer request canonical location directory evidence;
- raw Story + raw/applied location evidence;
- revision/committed_turn + state_after/context/map location;
- subsequent orthogonal matrix progress and first new blocker if any;
- confirmation of no retry-until-pass, player-intent state forcing, fuzzy/semantic resolver, provider/model/config change, Production access, preserved-game mutation, new task file/branch, or owner handoff.

Continue autonomously until the first NEW deterministic local blocker or all orthogonal QA is exhausted.
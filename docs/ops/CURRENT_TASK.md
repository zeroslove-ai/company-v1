# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-company-map-presence-truth-p1-correction-v1
Mode: TARGETED FRONTEND P1 — COMPANY MAP CURRENT PRESENCE / DEFAULT LOCATION TRUTH
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `cdf161cb8e559047d3555872307908bbd732bd56`
Previous task: `company-r3-current-literal-choice-memory-authority-p1-correction-v1`
Previous terminal: Issue #68 `5408696200`
Operator whole-canon review: Issue #68 `5408769720`
Accepted current-literal implementation to preserve: `fab6f43f937dde317fbdf152a41a7942e24d3669`
Accepted movement-authority implementation to preserve: `e523b6fdca209fdecc107f14820a2c2e524dcc61`
Accepted final-presence implementation to preserve: `6c14509131564e66d9a57bd6cccc7e70585f6514`
Accepted PLAYER-location implementation to preserve: `df1a884e350c032cff0ef5bfae834a38c1adf473`
Accepted registered-NPC identity implementation to preserve: `298bfd0af86caca679039fadf431089c8e372531`
Accepted Observer completed-Story evidence implementation to preserve: `72292961a0ad9ed2861ce62a645bad629bbc2e60`
Remote-S1 implementation awaiting valid live acceptance: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh previous live game: `cad7d45f-f06a-4107-8856-bb27ba82afbc` — READ ONLY

Success terminal:
`COMPANY_MAP_PRESENCE_TRUTH_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`COMPANY_MAP_PRESENCE_TRUTH_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only.
Reuse this exact `docs/ops/CURRENT_TASK.md` path and overwrite it in place for lifecycle state.
Do NOT create a new CURRENT_TASK file, ops branch, feature branch, PR, report-only branch, or task file.

Mandatory read order before action:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
5. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
6. previous terminal `5408696200`
7. operator review `5408769720`
8. this CURRENT_TASK.

Preserve A′/R3 exactly. This task is frontend projection only.
No Production. No DB writes/migrations. Do not mutate/reset/retry preserved evidence games.

## 1. Accepted previous target

`fab6f43...` is accepted for current-literal / prior-choice memory authority and is frozen.
The fresh browser campaign passed the decisive free-form-vs-stale-choice gate, selected-choice positive control, and one reload without duplicate commit.
Do not reopen that lane unless this task proves a direct regression.

## 2. Decisive deferred P1

Current main still contains a known Company Map truth defect.

`frontend-r3/company-map.js` currently:
- treats `scene.present_actor_ids` as current-scene presence;
- but for every actor not present, falls back to `actor.default_location_id` or location `default_npc_ids` and places that actor into a location card;
- renders present and absent/default actors through the same `.company-map-npc` UI surface, with only an `inScene` boolean.

Current class mismatch also exists:
- renderer emits `is-present` for present NPC chips;
- CSS styles `.company-map-npc.is-in-scene` instead;
- renderer emits `is-current-place` for PLAYER current location;
- CSS styles `.company-map-place.is-player-here` instead.

Therefore intended truth distinction is not visibly applied.

This previously caused a live audit to classify 박정우 as durably present even though DB `present_actor_ids` had already removed him. The map presentation therefore can contradict committed scene truth and mislead both player and QA.

Classification: frontend P1 — false-current presence presentation.

## 3. Product truth law

For Company Map:
- `scene.present_actor_ids` is the sole authority for **currently co-located/current-scene presence**.
- `default_location_id` and location `default_npc_ids` are reference/findability hints only. They are not current-location evidence.
- An absent actor whose default location equals PLAYER's current scene must still appear as non-present/reference-only if shown at all.
- The UI must never use the same visual/semantic treatment for confirmed current presence and default/reference placement.
- The current PLAYER location must be visibly truthful and use the class contract actually styled by CSS.
- The map remains presentation only; it must not write or reinterpret durable scene state.

Do not use this task to decide whether the entire map/NPC-find feature should be deleted. That would be a broader product decision. Make the existing feature truthful with the smallest change.

## 4. Allowed implementation

Allowed:
- adjust `buildCompanyMapModel()` so actor placement carries explicit provenance/status such as `presenceKind: 'current' | 'default_reference'` or equivalent bounded fields;
- preserve default/home findability hints if desired, but label them visibly as `기본 위치`, `통상 위치`, `참고 위치`, or another clearly non-current Korean label;
- render confirmed scene actors with a distinct current-presence class/label;
- align renderer classes and CSS selectors so current NPC and current PLAYER location styling actually applies;
- add/adjust a small legend or grouping if needed for unambiguous truth;
- preserve existing location/NPC input-fill affordances unless truthfulness requires only presentation grouping/labels;
- focused frontend/model/render tests.

Prefer explicit provenance in the view model over CSS-only guessing.

## 5. Forbidden approaches

Do NOT:
- change Story/Observer/reducer/navigation/state semantics;
- change API/runtime gameplay code merely to make the map look right;
- change DB/schema/RPC/migrations/content catalog;
- infer current NPC location from biography/default location;
- promote default/home placement to durable truth;
- add polling, tracking, NPC-location engine, pathfinding, generic presence engine, or second state store;
- remove the whole map/NPC-find feature without proving truthful presentation is impossible and stopping for owner review;
- add retry/regeneration/provider/model/config changes;
- touch Production;
- create a new branch/PR/task file;
- mutate preserved games;
- claim `OWNER_READY`.

Do not use this task to fix setup/world-definition closure, CSA, S1, long-memory, MM, Media/TTS, or unrelated UI redesign.

## 6. Required deterministic regressions

Use actual `frontend-r3/company-map.js` model/render path.

### A. Current scene actor
Given PLAYER scene location `brand_strategy_office` and actor ID in `scene.present_actor_ids`:
- model marks actor as confirmed current presence;
- actor is projected at PLAYER current scene;
- rendered DOM has the exact current-presence class/label that CSS styles.

### B. Absent actor with different default location
Given actor absent from `present_actor_ids` but with a default location:
- model may retain default/reference placement;
- it must explicitly be non-current/reference provenance;
- rendered UI visibly says reference/default, not current presence.

### C. Critical false-current case
Given actor absent from `present_actor_ids` and that actor's default location equals PLAYER current location:
- actor must **not** look currently present;
- current-presence class must be absent;
- reference/default label/style must remain visibly distinguishable.

### D. Exit transition
Render state A with actor present, then state B with the same actor removed from `present_actor_ids`:
- re-render must remove current-presence treatment;
- if default reference remains, it must switch to reference-only treatment.

### E. PLAYER current location class contract
- renderer and CSS must use the same class for the PLAYER current place;
- deterministic DOM assertion must prove it.

### F. Existing affordances
- location button still fills exact canonical movement literal;
- NPC button still fills exact `찾아간다` literal if retained;
- no map presentation change writes gameplay state.

Then run changed-file syntax checks, focused frontend tests, broader relevant frontend/R3 tests, `git diff --check`, and exactly one full `npm test` after focused green. Record exact counts.

## 7. TEST deploy law

Frontend executable source is expected to change.
- confirm local/remote `main` equality after implementation;
- deploy TEST frontend only through the existing approved path;
- API deploy is not expected and must not be performed unless source review proves API executable changed, which would be outside expected scope and should normally STOP for operator review;
- record exact TEST frontend deployment/version/source SHA.

No Production. No DB write/migration.

## 8. Fresh browser acceptance — exactly one new game

After TEST frontend deploy, use the actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game. Preserve it READ ONLY afterward.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.

Target 2–4 committed turns; stop at first new reproducible P0/P1.

### A. Opening / baseline map truth
- normal Opening;
- verify PLAYER current location is visibly highlighted;
- verify current-scene NPCs are visibly identified as current presence;
- any default/reference NPC placement is visibly labeled non-current.

### B. Grounded NPC departure — decisive gate
Submit one natural literal that asks a registered NPC currently in scene to leave for another canonical location while PLAYER stays.

PASS if Story actually completes an NPC departure. If Story blocks/refuses it, do not retry merely to sample a different outcome; report the live branch limitation and use any naturally occurring presence change if available.

When a departure completes:
- completed Story and saved scene no longer treat that NPC as co-located;
- map removes current-presence treatment for that NPC;
- if the map still shows the actor at a default/home location, it is visibly `reference/default`, never current;
- especially if their default location is the current PLAYER location, the UI must not recreate the old false-current impression.

### C. Reload
If no new P0/P1, perform one deliberate reload and verify current Story/history/map truth restore without duplicate commit.

After campaign, perform independent whole-canon audit before any next task.

## 9. Preserve accepted behavior

Do not regress:
- current literal precedence / prior choice isolation from `fab6f43...`;
- PLAYER movement authority from `e523b6f...`;
- final presence evidence from `6c14509...`;
- PLAYER location authority from `df1a884...`;
- registered NPC identity from `298bfd0...`;
- completed-Story Observer provenance from `72292961...`;
- Opening stationary start/private-app provenance;
- exactly four Story choices + free input;
- selected-choice submission;
- one Story + one Observer + atomic Commit.

## 10. Terminal / STOP law

On success:
1. commit/push implementation/tests on `main`;
2. deploy TEST frontend only;
3. run exactly one fresh browser campaign above;
4. overwrite this same file to `WAITING_REVIEW` with concise execution record;
5. post Issue #68 terminal:
   `COMPANY_MAP_PRESENCE_TRUTH_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`.

On blocker/failure:
- preserve evidence;
- no retry/sample-until-pass;
- overwrite this same file to `WAITING_REVIEW` with exact blocker;
- post:
  `COMPANY_MAP_PRESENCE_TRUTH_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`.

Declared terminal = STOP.
Do not self-register setup/world-definition, CSA, S1, MM, Media/TTS, or any later lane. Operator must perform the independent post-live whole-canon review first.

## 11. Execution record — 2026-08-25

- Execution identity: `company-r3-company-map-presence-truth-p1-correction-v1` / task blob `8174645857c76529a3bf5c95062840e018a89b52` / expected branch `main`.
- STARTED lease: Issue #68 comment `5408864704`; start head `251688e1cca5e08a78794d388be40f5658319a3c`.
- Implementation pushed on `main`: `9b3f4f26c97828ec18e05f29f8df7f18df4bbe81` (HEAD equals `origin/main`).
- Changed files: `frontend-r3/company-map.js`, `frontend-r3/company-map.css`, `test/r3-frontend-contract.test.mjs`.
- Root cause repaired: current presence now comes from `scene.present_actor_ids`; absent/default placement carries explicit reference provenance, visible non-current labeling/style, and the renderer/CSS contracts now agree on `is-in-scene` and `is-player-here`. Existing location/NPC literal-fill affordances remain covered.
- Tests: changed-file syntax checks PASS; focused `test/r3-frontend-contract.test.mjs` PASS (17/17); broader relevant frontend/R3 set PASS (239/239); exactly one full `npm.cmd test` PASS (597/597); `git diff --check` PASS.
- TEST deploy: frontend only, `gamebuilder-company-r3` at `https://gamebuilder-company-r3.zeroslove.workers.dev`, version `94bdf291-739a-4452-bcb4-e35ec6b96f5d`, source SHA `9b3f4f26c97828ec18e05f29f8df7f18df4bbe81`. API was not deployed.
- Fresh live QA: exactly one disposable adult-profile game, `8a61332b-8365-4655-97c4-754332407948`, preserved READ ONLY. Opening Turn 0 showed one `is-player-here` place, six `is-in-scene` actors, and seven `is-reference` actors. A natural UI-submitted literal completed I메이's departure to `2층 공용 회의실` while PLAYER stayed; Turn 1 saved Story removed I메이 from current presence and left five current actors. A neutral second UI turn committed Turn 2. One deliberate reload restored Turn 2 Story/history/map truth with one current place, five current actors, seven references, and no duplicate commit.
- No Production, DB write/read, migration, reset, retry-until-pass, provider/model/config, API/runtime, or preserved-game mutation occurred.
- Independent whole-canon audit conclusion: `WHOLE_CANON_AUDIT_CLEAR_FOR_NEXT_LANE` for this map-presence target; no new issue was registered and no next task was generated. Await operator review before any later lane.

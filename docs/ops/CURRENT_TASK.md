# Company — CURRENT TASK

Status: READY
Task ID: company-r3-player-location-authority-p1-correction-v1
Mode: TARGETED CORE P1 — PLAYER LOCATION / NPC-ONLY MOVEMENT EVIDENCE AUTHORITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `05845a3bedfd6b5c9cad5b3b0f1825e8d9b75edd`
Previous task: `company-r3-registered-npc-formal-identity-p1-correction-v1`
Previous terminal: Issue #68 `5406904937`
Operator whole-canon review: Issue #68 `5406963861`
Accepted registered-NPC identity executable/source SHA: `298bfd0af86caca679039fadf431089c8e372531`
Accepted Observer completed-Story evidence SHA: `72292961a0ad9ed2861ce62a645bad629bbc2e60`
Preserve remote-S1 implementation awaiting valid live acceptance: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh decisive evidence game: `f4a8ae85-5b34-44f9-9348-97754633d3fe` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact when local psql is unavailable: Issue #68 `5404426864`

Success terminal:
`PLAYER_LOCATION_AUTHORITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`PLAYER_LOCATION_AUTHORITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path and overwrite it in place for lifecycle state.

Mandatory read order before action:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. previous terminal `5406904937`
8. operator whole-canon review `5406963861`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, PR, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

## 1. Why this task exists — browser PASS was false-green against durable PLAYER location

The previous identity task itself is accepted. The fresh game `f4a8ae85-5b34-44f9-9348-97754633d3fe` is preserved READ ONLY.

Independent read-only DB reconstruction found a separate P1 in the same fresh campaign.

### A. Decisive Turn 4 — NPC-only movement moves PLAYER

Literal:
`서원희와 박정우가 사무실을 나가 회의실로 이동한다.`

Completed Story / summary:
- 서원희 and 박정우 leave and enter a meeting room;
- PLAYER remains in the 2F corridor.

Observer raw:
- `location.location_id = meeting_room` using a quote only about the two NPCs entering that room;
- `present_actor_ids=[]`;
- `scene_note` explicitly says PLAYER remains in the corridor.

Observer applied:
- warning contains `canonical_navigation_applied`.

Durable `state_after.scene`:
- `location_id = meeting_room`;
- `present_actor_ids=[]`;
- `scene_note` simultaneously says PLAYER is in the corridor.

This is a direct `P-AGENCY-001` / `P-SCENE-001` / `C-CSA-NAV-001` violation and Story/state contradiction.

### B. Supporting Turn 2 — unresolved longer destination silently rebounds through generic alias

Literal:
`나는 신사업TF 사무실로 이동한다.`

Canonical `content/map.json` has no registered location/name/alias `신사업TF 사무실`. It does contain generic `office` alias `사무실` and separate registered locations such as `project_room`.

Fresh chain:
- Story describes an invented/noncanonical `신사업TF 사무실`;
- Observer raw returns `project_room`;
- warning contains `canonical_navigation_applied`;
- durable PLAYER location becomes generic `office`.

A deterministic generic nested alias must not silently substitute a different canonical destination for the player's requested destination.

## 2. First broken current-main boundaries — prove before editing

Inspect first:
- `runtime-r3/domain/navigation.js`
  - `resolvePlayerNavigationIntent()`
  - `hasCanonicalNpcSubjectBeforeDestination()`
  - location candidate resolution;
- `runtime-r3/domain/observer-normalizer.js`
  - location projection / evidence grounding;
- `runtime-r3/domain/reducer.js`
  - observer location application + `applyNavigationPostcondition()`;
- `runtime-r3/server/provider.js`
  - existing Observer PLAYER-location instructions and Story NPC-movement boundary;
- `runtime-r3/server/worker.js`
  - navigation intent -> Story context -> normalize -> reducer chain;
- focused R3 source/navigation/Observer/turn-kernel tests.

Current source hypothesis already supported by the fresh chain:

1. `navigation.js` canonical-location match path can produce a destination without positive PLAYER binding. Its NPC-subject helper also slices away the subject before the last preceding movement verb, so compound NPC motion such as `서원희와 박정우가 사무실을 나가 회의실로 이동한다` can escape the NPC-only guard and become `player_navigation`.
2. Generic alias matching can claim `사무실` from inside a longer unresolved destination phrase such as `신사업TF 사무실`.
3. The Observer prompt already says `location` is PLAYER current-location evidence, but `observer-normalizer.js` accepts a registered location quote even when the quote only establishes NPC movement. `reducer.js` then writes that location directly.

Fix the smallest existing location-evidence boundary. If a still-earlier current boundary is proven, fix that instead and explain it in terminal.

## 3. Required product behavior

- PLAYER durable location may not change merely because another NPC moves, enters, leaves, mentions, or acts at another registered location.
- A Story quote about only NPC movement/location is not valid PLAYER-location evidence.
- NPC-only movement literal must never create `player_navigation`, including multi-actor and compound movement phrasing.
- True explicit PLAYER navigation to one unambiguous registered canonical location remains deterministic and supported.
- A generic location alias embedded inside a longer unresolved destination phrase must not silently claim a different canonical destination. When the requested destination cannot be resolved to one canonical location, deterministic navigation must fail safe rather than substitute another place.
- Story may narrate feasibility/block/clarification for an unresolved destination, but may not pretend the player requested a different destination under `P-AGENCY-001`.
- Observer/reducer scene location and `scene_note` must describe the same PLAYER physical location after commit.
- NPC presence/exits remain governed by completed Story evidence and must not be broken to fix PLAYER location.
- Existing external physical consequences may still be represented when the completed Story actually and explicitly grounds PLAYER displacement; do not solve this by creating a new generic location/physics engine.

## 4. Allowed implementation

Allowed:
- narrow fixes in existing `runtime-r3/domain/navigation.js` actor/destination binding;
- narrow PLAYER-location evidence validation in `observer-normalizer.js` using already available Story/literal/current-state/navigation context;
- narrow reducer/postcondition changes required so a rejected remote NPC location cannot mutate PLAYER durable location;
- passing an existing `navigationIntent`/bounded location-authority fact through the current worker -> normalizer/reducer call if that is the smallest fix;
- narrow provider Observer wording only if current deterministic boundary needs the contract made explicit; prompt-only is insufficient because live evidence already proved it can fail;
- focused deterministic tests against the actual R3 worker chain.

Prefer one bounded location authority rather than several independent heuristics.

## 5. Forbidden approaches

Do NOT add:
- generic Korean semantic parser, NER, fuzzy place resolver, embedding classifier, or new parser generation;
- generic movement/physics/location ontology or route engine;
- post-Story Story text rewrite;
- retry/regeneration/sample-until-pass;
- second Story, verifier, repair LLM, or second Observer;
- provider/model/temperature/token/secret/config workaround;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend changes unless directly proven necessary (not expected);
- new map/location product semantics solely to make `신사업TF 사무실` valid;
- preserved-game mutation;
- branch/PR/new task file;
- `OWNER_READY`.

Do not use this task to fix/test:
- remote supported S1 execution acceptance;
- `성기를 직접 검사` / `genital_touch` semantic grounding;
- continuous-rule immediate compliance;
- CHANGE/REMOVE clothing provenance;
- MM broad reliability / CSA player-facing internal copy / Media / TTS.

## 6. Preserve accepted/current behavior

Do not regress:
- registered NPC canonical formal identity from `298bfd0...`;
- Observer completed-Story evidence integrity from `72292961...`;
- Opening stationary start and PLAYER exact identity/rank;
- private-app provenance negative boundary;
- official rule issuance / private-app institutional-source separation;
- temporal continuity;
- PLAYER sole issuer and S1 exact pair direction;
- S1 closed-world unsupported semantics and exact six supported families;
- remote-S1 source work `1cc59e...` as implemented-but-not-yet-live-accepted;
- ordinary external-outcome boundary;
- S7 literal agency;
- finite compatibility + exact conflict copy;
- player-thought grounded-only fail-local safety;
- Story-owned exactly four choices + free input;
- exactly one Story + one Observer + one Commit.

## 7. Required deterministic regressions

Use the actual current R3 resolver/normalizer/reducer/worker path, not a disconnected constant-only test.

1. Exact fresh regression returns **no** PLAYER navigation intent:
   `서원희와 박정우가 사무실을 나가 회의실로 이동한다.`
2. Same NPC-only compound case with a completed Story saying the two NPCs enter `2층 공용 회의실` while PLAYER remains in the corridor:
   - Observer `location=meeting_room` quote that only describes the NPCs is rejected as PLAYER-location evidence;
   - durable PLAYER location stays at the prior canonical location;
   - grounded NPC exits/presence still apply.
3. Single-NPC movement remains no PLAYER navigation:
   `서원희가 2층 공용 회의실로 이동한다.`
4. Mixed clause remains directionally correct:
   an NPC may move to one place while an explicitly PLAYER-bound clause moves PLAYER to a different exact canonical place; only the PLAYER destination becomes canonical PLAYER location.
5. Exact canonical PLAYER movement remains green, e.g.:
   `나는 직원 라운지로 이동한다.` -> `employee_lounge`.
6. Bare but unambiguous existing supported player form remains green where current contract intentionally supports it, e.g. exact canonical `2층 공용 회의실로 이동한다.` if that form is already accepted by current tests.
7. Generic nested alias does not silently bind:
   `나는 신사업TF 사무실로 이동한다.` must not resolve to generic `office` merely because `사무실` is an alias. Do not invent a new canonical destination in the test.
8. Observer location with exact Story evidence that PLAYER explicitly enters/arrives at an unambiguous registered location remains accepted.
9. `scene_note` + structural `scene.location_id` remain coherent on both accepted PLAYER movement and rejected NPC-only remote-location evidence.
10. Registered identity, Opening, Observer presence/exits, private-app, temporal, S1/S7, compatibility/conflict-copy, choice and player-thought focused regressions remain green.
11. No post-Story rewrite/retry/second Story/second Observer path introduced.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader R3 navigation/Observer/source/turn-kernel/CSA/Opening regressions;
- exactly one full `npm test` after focused green and record deterministic count/exit.

Automated green is not product acceptance.

## 8. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- confirm local/remote main equality after implementation;
- deploy TEST API only through unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if gate rejects, STOP instead of weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 9. Fresh deployed-browser acceptance — exactly one new game

After TEST API deployment, use the actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve the game READ ONLY after campaign.

Target ~4–6 committed turns. Stop at first reproducible P0/P1.

### A. Opening baseline

Complete normal Opening.

PASS:
- PLAYER starts at the canonical opening location and stays stationary before first literal;
- registered identities remain canonical;
- private-app provenance remains player-private/passive;
- four Story choices + free input.

Record durable starting `scene.location_id` and present actors.

### B. NPC-only compound movement — decisive gate

From a scene containing 서원희 and 박정우, submit exactly or as closely as current visible names allow:
`서원희와 박정우가 사무실을 나가 2층 공용 회의실로 이동한다.`

PASS requires:
- Story preserves NPC actors/action/destination and does not move PLAYER;
- no `player_navigation` / `canonical_navigation_applied` for PLAYER;
- Observer may record grounded NPC exits, but a quote only about NPCs entering the meeting room cannot become PLAYER location;
- durable PLAYER `scene.location_id` remains the pre-turn location;
- `scene_note` says the same PLAYER location reality;
- NPC presence/exits agree with completed Story.

Record full chain:
`literal -> Story -> observer raw -> observer applied -> durable state -> rendered UI`.

Stop immediately if PLAYER durable location changes because of NPC-only movement.

### C. Explicit valid PLAYER navigation

Only if B passes, submit:
`나는 직원 라운지로 이동한다.`

PASS:
- one canonical `player_navigation` to `employee_lounge`;
- Story uses that destination rather than substituting another location;
- Observer/applied/durable location all agree;
- no stale prior actors are mechanically carried unless Story grounds them.

### D. Explicit canonical return

Submit:
`나는 브랜드전략팀 사무실로 이동한다.`

PASS:
- durable PLAYER location becomes `brand_strategy_office` exactly;
- Story/Observer/state agree;
- registered actor identities remain stable.

### E. Refresh / re-entry

Perform one deliberate refresh/re-entry.

PASS:
- no duplicate Story/Commit;
- PLAYER location reconstructs exactly once from durable state;
- present actors/choices/free input remain coherent.

Do not live-sample the unresolved `신사업TF 사무실` negative phrase merely to get a lucky Story result; its deterministic resolver regression is sufficient for this task.
Do NOT test remote S1 or `성기를 직접 검사` in this campaign.

## 10. Whole-canon observations — record, do not broaden

For reached turns record:
- Story vs observer raw/applied vs durable PLAYER location/presence disagreement;
- registered actor identity drift;
- MM raw `{surface,subconscious}` retention/drop where relevant;
- player-inner-thought invention/drop;
- choices/dialogue projection warnings;
- private-app provenance leak if any;
- obvious current active-rule residue only if naturally encountered.

Do not implement unrelated P2 fixes.
Media/TTS remain paused.

Known queued work after this task + mandatory operator audit, unless a new earlier P0/P1 appears:
1. valid-prerequisite remote-S1 live acceptance for preserved `1cc59e...`;
2. separate S1 `성기를 직접 검사` / `genital_touch` semantic-grounding P1;
3. continuous-rule / CHANGE-REMOVE provenance P1/P2 lanes as current authority requires;
4. MM reliability and CSA player-facing internal-copy P2;
5. Media/TTS later.

## 11. Stop / terminal law

No runtime patching during the live campaign.
At first reproducible P0/P1:
- preserve fresh game READ ONLY;
- record decisive chain;
- set this same task file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires:
- smallest PLAYER location authority boundary fixed without a new parser/engine;
- focused + broader + one full test green;
- TEST API deployed through unchanged contract gate;
- exactly one fresh browser game;
- NPC-only compound movement leaves PLAYER durable location unchanged;
- explicit canonical PLAYER movement changes location correctly;
- refresh/re-entry reconstructs coherent location;
- no new P0/P1 before terminal;
- Production/DB migration/provider config/retry/second Story/second game = 0.

On success:
- set this same file to `WAITING_REVIEW`;
- post exactly one terminal:
`PLAYER_LOCATION_AUTHORITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`PLAYER_LOCATION_AUTHORITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

After any deployed browser campaign, do not self-register the next task. Operator must perform the independent `POST_LIVE_CANON_AUDIT_CONTRACT` whole-canon review first.
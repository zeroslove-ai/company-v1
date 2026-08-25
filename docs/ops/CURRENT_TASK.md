# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-story-player-movement-agency-p1-correction-v1
Mode: TARGETED CORE P1 — STORY PLAYER MOVEMENT / NPC-ONLY MOVEMENT AGENCY AUTHORITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `b602f1d5bca5153b9fa69e2618f728c726661625`
Previous task: `company-r3-observer-final-presence-evidence-p1-correction-v1`
Previous terminal: Issue #68 `5407625800`
Operator whole-canon review: Issue #68 `5408119028`
Accepted final-presence implementation to preserve: `6c14509131564e66d9a57bd6cccc7e70585f6514`
Accepted PLAYER-location implementation to preserve: `df1a884e350c032cff0ef5bfae834a38c1adf473`
Accepted registered-NPC identity implementation to preserve: `298bfd0af86caca679039fadf431089c8e372531`
Accepted Observer completed-Story evidence implementation to preserve: `72292961a0ad9ed2861ce62a645bad629bbc2e60`
Remote-S1 implementation awaiting valid live acceptance: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh previous live game: `6b5e7941-36a7-4019-94a8-777112824fc9` — READ ONLY
Known deferred P1: Company Map default-location false-current rendering.

Success terminal:
`STORY_PLAYER_MOVEMENT_AGENCY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`STORY_PLAYER_MOVEMENT_AGENCY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only.
Reuse this exact `docs/ops/CURRENT_TASK.md` path and overwrite it in place for lifecycle state.
Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, PR, report-only branch, or task file.

Mandatory read order before action:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. previous terminal `5407625800`
8. operator whole-canon review `5408119028`
9. this CURRENT_TASK.

Preserve A′/R3 exactly:
server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

No Production.
Do not mutate/reset/retry preserved evidence games.

## 1. Accepted previous target

The previous final-presence correction is accepted for its narrow target and is frozen.

`6c145091...` added one bounded `presence_reconciliation` evidence field inside the existing Observer call and normalizer/reducer reconciliation grounded by exact completed-Story quotes. It did not add a second Story/Observer, generic parser, retry, DB/migration, provider/model/config, or Production change.

Deterministic worker-path regressions cover the exact prior/default actor explicit-absence case. The fresh deployed Opening did not naturally exercise that negative branch, so no fabricated live PASS is claimed for that exact stochastic branch.

Do not reopen that boundary unless this task proves a direct regression.

## 2. New decisive P1 from the previous live campaign

Previous terminal `5407625800` reports the fresh browser campaign `6b5e7941-36a7-4019-94a8-777112824fc9` as follows:
- Opening committed;
- one ordinary greeting committed;
- then one grounded NPC-departure request was submitted;
- Story did **not** complete the requested NPC departure;
- instead Story moved PLAYER to `2층 공용 회의실` and showed 윤민아 there.

That campaign's own acceptance law required PLAYER location to remain unchanged unless PLAYER literal explicitly moved.

This is a direct `P-AGENCY-001` / PLAYER movement-authority P1 **if the preserved turn literal did not explicitly authorize PLAYER movement**.

Before editing, reconstruct the exact preserved live Turn literal + completed Story + committed PLAYER location from the read-only evidence available to the watcher. Freeze that evidence in the terminal report. Do not mutate/retry the game.

If the exact literal actually explicitly authorized PLAYER navigation, STOP without editing and report that the operator classification premise was disproven. Do not silently choose another task.

## 3. Current first broken boundary to prove before editing

Inspect in this order:

1. `runtime-r3/domain/navigation.js`
   - `resolvePlayerNavigationIntent()`
   - existing NPC-only / mixed clause / unresolved alias behavior;
   - this resolver is bounded structural authority and must not be replaced by a new semantic parser.
2. `runtime-r3/server/worker.js`
   - `processTurn()` computes `navigationIntent` before Story;
   - `projectNavigationContext()` is only used when actual `player_navigation` exists;
   - inspect what explicit current-turn authority is passed to Story when `navigationIntent === null`.
3. `runtime-r3/domain/memory.js`
   - `PLAYER_MOVEMENT_AUTHORITY_CONTRACT`;
   - `PLAYER_AGENCY_CONTRACT`;
   - Story context construction.
4. `runtime-r3/server/provider.js`
   - ordinary Story system prompt and hard-boundary wording;
   - determine whether a positive server-owned current-turn movement authorization/denial is projected with enough precedence.
5. focused navigation / agency / provider / worker tests.

Current-main hypothesis:
- the server correctly resolves NPC-only movement as **no `player_navigation`**;
- current Story context contains a generic law saying PLAYER movement must come from the literal, but it does not expose the resolver's current-turn result as a positive structured binding such as `authorized=false / preserve current canonical location`;
- therefore Story can still invent a convenience bridge action such as following/entering/accompanying the NPC even though the server already knows no PLAYER navigation was authorized;
- once Story authors that movement, the post-Story Observer/Commit should follow completed Story reality and cannot safely rewrite it afterward without becoming a second narrative authority.

Prove or disprove this exact boundary before editing. If an earlier existing Story-side authority seam is the real cause, fix that instead and explain it in the terminal.

## 4. Required product behavior

For every ordinary turn:
- PLAYER voluntary navigation is authorized only by the submitted literal as resolved through the existing bounded navigation authority;
- NPC-only movement, NPC departure, remote target destinations, remote actor scenes, stale context, or narrative convenience must never cause PLAYER to stand up, follow, walk, approach, enter, knock, accompany, return, or teleport;
- if no PLAYER navigation is authorized for this turn, Story must keep PLAYER at the current canonical scene unless an independently grounded non-voluntary world consequence physically displaces PLAYER;
- a non-voluntary displacement must be actually caused by the world, not a Story-authored voluntary bridge action disguised as consequence;
- explicit canonical PLAYER navigation remains fully supported;
- mixed clauses must preserve exactly which actor is moving;
- Story may decide NPC feasibility/reaction/consequence, but may not replace the actor/direction of the player's chosen action;
- Observer/Commit remain post-Story observers/structural writers, not narrative repair systems.

## 5. Allowed implementation

Allowed only when proven necessary:
- expose the existing `resolvePlayerNavigationIntent()` result to Story as a narrow **current-turn PLAYER movement authority binding**;
- when no `player_navigation` exists, project a positive structured fact equivalent to:
  - `player_voluntary_navigation_authorized=false`,
  - `preserve_location_id=<current canonical location>`,
  - NPC/remote movement cannot authorize PLAYER bridge travel;
- when `player_navigation` exists, expose the exact canonical destination as authorized and preserve existing projection/postcondition behavior;
- strengthen the existing ordinary Story prompt so that this current-turn binding has explicit precedence over narrative convenience and remote/NPC movement;
- focused deterministic tests through the actual resolver -> worker/context -> provider request path.

Prefer one server-owned bounded movement authority fact over adding more free prose or a new parser.

## 6. Forbidden approaches

Do NOT add:
- a new generic Korean parser, NER, fuzzy matcher, embedding classifier, movement ontology, route engine, or second navigation engine;
- post-Story prose rewrite/repair;
- post-Story movement censor that changes completed narrative into another narrative;
- second Story, second Observer, verifier LLM, repair LLM;
- retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- DB/schema/RPC/migration/backfill;
- Production;
- new branch/PR/task file;
- preserved-game mutation;
- `OWNER_READY`.

Do not use this task to fix:
- Company Map default-location false-current rendering;
- setup/world-definition catalog closure;
- remote supported S1 live acceptance;
- `성기를 직접 검사` / `genital_touch` semantic grounding;
- continuous-rule compliance;
- CHANGE/REMOVE provenance;
- broad MM reliability;
- CSA player-facing internal copy;
- Media/TTS.

## 7. Preserve accepted/current behavior

Do not regress:
- final NPC-presence evidence correction from `6c14509...`;
- PLAYER location / NPC-only movement / unresolved alias resolver behavior from `df1a884...`;
- registered NPC canonical formal identity from `298bfd0...`;
- completed-Story positive outcome evidence from `72292961...`;
- Opening stationary-start / exact PLAYER setup identity / private-app provenance;
- temporal continuity;
- official rule issuance/private-app institutional-source separation;
- PLAYER sole issuer and exact S1 pair direction;
- S1 closed-world exact six supported action families;
- remote-S1 source work `1cc59e...` as implemented-but-not-yet-live-accepted;
- ordinary external-outcome boundary;
- S7 literal agency;
- finite compatibility + exact conflict copy;
- player-thought grounded-only fail-local safety;
- Story-owned exactly four choices + free input;
- exactly one Story + one Observer + one Commit.

## 8. Required deterministic regressions

Use the actual current R3 navigation/context/provider/worker path where practical.

### A. NPC-only movement = explicit no-PLAYER-navigation Story binding

Use at least the established regression literal:
`서원희와 박정우가 사무실을 나가 2층 공용 회의실로 이동한다.`

Required:
- resolver returns no `player_navigation`;
- Story request context contains a positive current-turn binding that PLAYER voluntary navigation is not authorized and current canonical PLAYER location must be preserved;
- NPC remote destination must not become PLAYER destination authority.

Also add the exact preserved live literal from game `6b5e7941-...` after read-only reconstruction if available.

### B. Explicit PLAYER navigation remains authorized

For an exact literal such as:
`나는 2층 공용 회의실로 이동한다.`

Required:
- resolver returns the exact canonical destination;
- Story binding says PLAYER navigation is authorized to that exact destination;
- existing projection/postcondition behavior remains green.

### C. Mixed actor clauses

Cover at least:
- NPC moves, PLAYER stays;
- PLAYER moves, NPC stays;
- one clause for NPC remote movement followed by non-movement PLAYER action;
- no actor-role leakage across clauses.

### D. Unresolved destination alias

`나는 신사업TF 사무실로 이동한다.` must not silently resolve to generic `office` merely because a nested generic alias is present.
No false authorized destination may be exposed to Story.

### E. Story prompt/context precedence

Provider request assertions must prove:
- generic player-agency contract remains;
- current-turn movement binding is present;
- `authorized=false` explicitly forbids voluntary PLAYER bridge actions including follow/enter/accompany/return;
- `authorized=true` preserves exact canonical destination;
- external physical consequence remains the only non-literal displacement exception.

### F. Prior accepted boundaries

Keep focused regressions green for:
- final presence reconciliation;
- registered identity;
- completed-Story Observer provenance;
- Opening agency/private-app provenance;
- temporal continuity;
- S1/S7;
- compatibility/conflict copy;
- choices;
- player-thought fail-local safety;
- one Story/one Observer.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader R3 navigation/agency/provider/worker regressions;
- exactly one full `npm test` after focused green and record count/exit.

Automated green is not product acceptance.

## 9. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If API/runtime executable source changes:
- confirm local/remote main equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as the approved ephemeral off-repo catalog input to the unchanged gate;
- if the gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 10. Fresh deployed-browser acceptance — exactly one new game

After successful TEST deployment, use the actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Target ~3–5 committed turns. Stop at first **new** reproducible P0/P1.
Known Company Map default-location false-current is already recorded and must not be misclassified as durable state or used to stop this campaign by itself.

### A. Opening

Complete a normal Opening.
Verify stationary-start, exact identity, private-app provenance, Story-owned four choices + free input, and Story/durable presence coherence.

### B. NPC-only departure/movement — decisive gate

From the current scene, submit a natural literal that explicitly moves one or two registered NPCs to `2층 공용 회의실` while **not moving PLAYER**.

PASS only if:
- Story does not make PLAYER stand, follow, accompany, enter, knock, walk, approach, return, or teleport;
- Story may accept/refuse/partially complete the NPC request according to ordinary agency, but PLAYER remains in the canonical prior scene unless an actual non-voluntary external displacement occurs;
- durable PLAYER location remains prior canonical location;
- completed NPC movement, if any, is reflected coherently in Observer/durable presence;
- no map false-current observation is confused with durable truth.

If Story moves PLAYER without explicit PLAYER movement authority, STOP immediately as the same P1. No retry.

### C. Explicit PLAYER navigation positive control

Only if B passes, submit one explicit literal moving PLAYER to an exact canonical destination.

PASS:
- Story preserves actor/destination;
- durable PLAYER location reaches that exact location once;
- no unrelated NPC movement is invented merely to bridge the scene.

### D. Reload/re-entry

If no new P0/P1, perform one deliberate reload and verify current committed location/history/choices restore without duplicate commit.

After the browser campaign, perform the required independent whole-canon audit before any next task is chosen.

## 11. Terminal / STOP law

On success:
1. commit/push implementation and tests on `main`;
2. deploy TEST API only if executable API source changed;
3. perform exactly one fresh browser campaign above;
4. overwrite this same file to `WAITING_REVIEW` with a concise execution record;
5. post Issue #68 terminal:
   `STORY_PLAYER_MOVEMENT_AGENCY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`.

On blocker/failure:
- preserve evidence;
- no retry/sample-until-pass;
- overwrite this same file to `WAITING_REVIEW` with exact blocker;
- post:
  `STORY_PLAYER_MOVEMENT_AGENCY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`.

Declared terminal = STOP.
Do not self-register the Company Map task or any later lane. Operator must perform the independent `POST_LIVE_CANON_AUDIT_CONTRACT` review before choosing the next CURRENT_TASK.

## 12. Execution record — 2026-08-25

- `TASK_ID`: `company-r3-story-player-movement-agency-p1-correction-v1`
- Branch: `main`
- Start head: `a70827ce78199978eff438781d5257aa832bed09`
- Implementation head: `e523b6fdca209fdecc107f14820a2c2e524dcc61`
- Reviewed executable SHA preserved: `6c14509131564e66d9a57bd6cccc7e70585f6514`
- Changed files: `runtime-r3/domain/navigation.js`, `runtime-r3/domain/memory.js`, `runtime-r3/server/provider.js`, `test/r3-owner-p0-contract.test.mjs`.
- Narrow implementation: the existing navigation resolver now binds the exact current-turn PLAYER movement authority into Story context; NPC-only movement preserves the current canonical PLAYER location, while explicit PLAYER navigation carries the exact resolver destination. The Story prompt consumes this server-owned binding with precedence. No parser, generic engine, retry, provider/model/config, database, migration, or preserved-data changes were made.
- Validation: syntax checks passed; focused suite `11/11`; broader contract suite `89/89`; one full `npm.cmd test` `592/592`; `git diff --check` passed. Exact-head CI run `32831533304` / test job `97751099890` passed.
- TEST deployment: API-only contract-gated deployment passed. Worker `game-proxy-company-r3`, version `8c898893-344f-456a-89f3-e6a9f96b475a`, URL `https://game-proxy-company-r3.zeroslove.workers.dev`. No frontend source changed, so no frontend deployment was performed.
- Fresh disposable TEST game: `ab72dbc0-3e58-441b-856f-2530cd93e8e7`, preserved READ ONLY. Opening committed as Turn 0. The exact NPC-only literal `이메이는 지금 브랜드전략팀 사무실을 떠나 2층 공용 회의실에서 진행되는 브리핑에 참석한다. 이메이가 사무실 밖으로 나가는 모습을 보여준다.` committed as Turn 1 without moving PLAYER. The explicit control `나는 2층 공용 회의실로 이동한다.` committed as Turn 2 with Story and summary placing PLAYER in the exact destination. One reload restored Turn 2, location, Story, and four choices without duplicate commit.
- Browser evidence: History preserved the exact submitted literals plus Story/choices/summary and saved state. The R3 `company_r3_*` contract uses `literal_action`; `structured_action` and legacy `game_actions.player_action` are not fields in this namespace. Observer raw/applied and reducer internals were not exposed by the browser UI and were not guessed or substituted with direct gameplay API/DB writes.
- Preserved prior game `6b5e7941-36a7-4019-94a8-777112824fc9` remained READ ONLY. Its prior NPC-only movement evidence remains preserved and was not reset or modified.
- Whole-canon audit: current canon, CSA authority contract, live matrix, post-live audit contract, current task, and current-main owning boundaries were reread. The narrow lane passes. A new outside-lane P1 candidate was observed in Turn 1: although the exact literal was stored, Story injected a stale continuation from the opening choice and did not faithfully preserve the current submitted literal/actor action. The source review did not establish a deterministic resolver defect for this single live sample; no provider/model/retry workaround was introduced. The requested NPC departure also was not completed, but this sample alone does not promote an NPC outcome defect. MM raw/applied drop rate was not measurable from the UI; Turn 1 showed MM and Turn 2 did not. CSA, refusal/change-of-mind, private-app provenance, TTS/image, long-memory, and other lanes were not exercised.
- Required independent conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`. No next task, branch, PR, merge, Production action, preserved-game mutation, DB write, or migration was started.

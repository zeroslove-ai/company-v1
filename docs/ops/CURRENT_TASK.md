# Company — CURRENT TASK

Status: FAILED
Task ID: company-r3-csa-chronological-enactment-boundary-v1
Mode: REMOVE ZERO-TURN CSA MUTATION -> STREAMED CHRONOLOGICAL ENACTMENT -> ANTI-HIJACK / PRIVATE-EMOTION BOUNDARY -> BARE-PUBLIC ACCEPTANCE
Updated: 2026-08-23 19:05 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385142173`
Terminal truth correction: Issue #68 comment `5385143109`
Operator review: Issue #68 comment `5385289539`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path or an ops/recovery branch.

## Terminal result — live acceptance failed

- Executable source HEAD: `fc0aace9df2a2e99d233d757b7964bc4aa9d9033` (pushed to `origin/main`; no unpushed commit).
- Focused R3 CSA contract tests: `24/24` pass. Full `npm.cmd test`: `506/506` pass. Syntax checks for all changed JS files and `git diff --check`: pass.
- TEST API deployed as `game-proxy-company-r3`, version `c8c0b390-db3e-45cf-900d-70a91cbab231`.
- TEST frontend deployed as `gamebuilder-company-r3`, final version `e59b4c67-a183-4b3a-adc3-e0bd507d16d2`.
- Fresh bare-public disposable fixture: `d738c97f-8e66-4e83-9c66-849bc13f63c6`.
- Opening committed as Turn 0. Ordinary Korean free input committed as Turn 1; visible four-choice list remained diverse and company-life oriented.
- Visible CSA APPLY of the first current catalog item then produced one streamed Story/Observer/commit transition to Turn 2; active-rule count changed from 0 to 1. The Story visibly represented the app action and immediate workplace consequence. No direct zero-turn writer was observed in this path.
- The required unrelated post-CSA free-input action (`윤민아 대리를 따라 복도로 나가 괜찮은지 조용히 확인한다.`) did not advance beyond Turn 2 during the bounded 110-second wait. The input remained present, the submit button returned enabled, no bounded UI error was shown, and browser console error/warn logs were empty. Per the no-retry-until-pass rule, no further gameplay request or Fixture B/C attempt was made.
- Therefore mandatory GREEN acceptance was not achieved: CHANGE/REMOVE, refresh/re-entry, duplicate-operation, 8–12-turn cross-fixture, and private-emotion acceptance evidence remain unverified.

### Remaining objective defect

The deployed bare-public runtime currently fails to complete an unrelated ordinary turn immediately after a successful chronological CSA APPLY turn, without surfacing a useful UI error. This blocks the required post-CSA Story-first continuity acceptance and requires a separately authorized follow-up investigation; no retry, migration, schema change, provider/model change, Production access, or preserved-game mutation was performed here.

## 0. Accepted baseline — do not reopen without contradictory real evidence

Accepted source/runtime baseline:
- executable/source HEAD: `19a5da37cc2cdf827b3edd20d342ba8d3a657388`;
- control/main checkpoint after task close: `b7a079b0eefa7ea8b5943a2b293db57017fc1781`;
- TEST API remains `game-proxy-company-r3` version `5d9ca276-b688-4b9a-8a5f-1bae13416c48` unless this task changes/deploys API;
- TEST frontend is `gamebuilder-company-r3` version `1187deeb-8a5a-4231-9f5d-b7437ceebf9c`;
- no Production access/deployment is authorized.

Frozen GREEN evidence:
- exact owner agency literal `이메이 사원. 일단 공자룰 좀 확인해보게나` preserves target/request/topic and does not invent voluntary CSA-app operation;
- exact owner navigation literal `직원 라운지로 이동한다` resolves and persists canonical `employee_lounge` through Story/Observer/Commit/refresh with no source-NPC teleport;
- choice-button dispatch is GREEN on desktop and 390x844 mobile: at least three visible clicks each produced exactly one request and one committed turn with exact literal readback, refresh reconstruction, free-input continuity, no duplicate chronology, and no blocking overlay/console/page failure.

Do not spend this task re-proving those frozen surfaces unless the CSA change directly regresses one during required acceptance.

## 1. Binding owner product decision

Owner comment `5384780073` superseded the old CSA zero-turn behavior.

Required product semantics now:
1. CSA APPLY / CHANGE / REMOVE is a real chronological gameplay turn.
2. The user action in the app must visibly cause a normal Story stream and one durable committed turn; it is not an invisible state edit.
3. The rule transition becomes durable atomically with that successful turn. A failed Story/turn must not leave a half-applied rule mutation.
4. The enactment turn should naturally show the player using the private CSA app and the immediate world/character consequence appropriate to the selected rule, without turning the game into a tutorial or rule demonstration.
5. After the enactment, active CSA is a world premise/constraint, not the subject of every later turn. Ordinary company-life actions, social beats, movement, refusal/self-state, and unrelated choices remain ordinary Story-first play.
6. Institutional/rule compliance is NOT evidence of affection, comfort, desire, arousal, liking the player, or positive private emotion. Mind Monitor/private state may only contain such emotion when independently supported by character/context/Story evidence.
7. Preserve A-prime: Story + one small Observer, existing R3 turn/persistence spine, no architecture restart.

## 2. Proven current contradiction — reproduce/audit before changing

Current source already proves the old behavior still exists:
- `frontend-r3/csa.js` renders `활성 규칙 … · 일반 턴을 소비하지 않습니다.`;
- its `transact()` calls `client.csa(...)` and waits for a JSON context mutation;
- `runtime-r3/server/worker.js` routes POST `/api/r3/games/:id/csa` to `csaResponse()`;
- `csaResponse()` checks state revision, calls `applyR3Csa(...)`, then `store.applyCsa(...)` directly;
- no Story streaming, Observer pass, normal turn reservation/job, committed gameplay turn, or player-visible chronology is involved;
- `runtime-r3/domain/csa.js` may immediately project structured clothing state while applying the rule.

Before source change, inventory the exact current call/write path across:
- `frontend-r3/csa.js`, `frontend-r3/r3-client.js`, `frontend-r3/app.js`;
- `runtime-r3/server/worker.js`;
- `runtime-r3/domain/csa.js`, `memory.js`, `observer-normalizer.js`, `reducer.js`;
- `runtime-r3/server/store.js` / `supabase-store.js`;
- focused R3 CSA/turn tests.

Classify which existing method/RPC can be retired from active product flow and which historical/internal contract must remain. Do not edit applied migrations merely to rename/remove old RPCs in this task.

## 3. Required implementation shape — smallest A-prime-compatible correction

### A. One canonical chronological transaction

For each valid APPLY / CHANGE / REMOVE initiated through the visible CSA app:
- use one canonical turn number/job identity on the existing R3 gameplay turn spine;
- keep the selected structured CSA operation explicitly available to the server/Story context; do not infer it back from prose;
- generate a deterministic literal player action from the exact visible app operation/catalog label, or otherwise preserve an equally exact UI-origin action identity; the committed turn must truthfully represent what the user clicked;
- stream Story through the same visible narrative surface used by ordinary turns;
- run the existing single Observer after Story;
- commit Story/choices/summary/Mind Monitor/state together through the existing canonical turn persistence path;
- make the CSA rule transition durable only in the successful committed state_after for that turn;
- if Story/commit fails, the previous active-rule state remains authoritative;
- exactly one operation gesture must not create both a zero-turn CSA write and a normal turn write.

The `/csa` route may be retained, reshaped, or internally delegated if that is the smallest coherent path, but do not create a second gameplay writer. Reuse the existing turn job/stream/commit authority rather than building parallel persistence.

### B. Operation chronology

APPLY:
- before the turn, rule is inactive;
- the turn represents the player's app action and the rule taking effect;
- after successful commit, rule is active and relevant deterministic state projection may be present.

CHANGE:
- before the turn, old rule definition is active;
- the turn represents changing it;
- after successful commit, new definition/scope is active, with no impossible retroactive rewrite of prior turns.

REMOVE:
- before the turn, rule is active;
- the turn represents removing/disabling it;
- after successful commit, it is inactive;
- removal must not fabricate memory loss or erase historical Story/turn evidence.

Do not implement a new generic CSA execution DSL. Existing bounded structured execution such as clothing_state may remain bounded; other catalog rules can remain Story/world-premise semantics unless an already-approved deterministic mechanic exists.

### C. Anti-hijack Story boundary

Update the existing R3 Story context/prompt only as needed so that:
- a newly applied/changed/removed rule gets a natural enactment beat on that operation turn;
- on later unrelated turns, the player's literal action/target/location/social intent remains the narrative center;
- active CSA is mentioned/enacted only when relevant to the current scene/action or when its premise necessarily changes what is observable;
- do not produce rule tutorials, repeated explanation of the app, or choices that mostly restate/escalate the CSA premise;
- choice diversity after CSA must still include natural continuations of the player's current social/location/non-work/work context rather than collapsing into near-paraphrases of sexual/rule escalation;
- preserve frozen player-agency/navigation invariants.

### D. Compliance vs private emotion boundary

Strengthen the existing Observer/Mind Monitor contract generically:
- complying with a CSA rule, treating it as normal, or being institutionally required to do something does not by itself establish affection, comfort, desire, sexual arousal, attraction, excitement, trust, or liking toward the player;
- do not transform `rule is followed` into positive private emotion;
- private emotion remains character-specific and evidence-based and may be neutral, conflicted, embarrassed, annoyed, uneasy, practical, curious, etc. when supported;
- do not hard-code one NPC or one exact phrase;
- do not install a sentiment classifier or deterministic emotion table.

## 4. Frontend behavior

The CSA app must no longer claim that rule transactions consume no turn.

Required visible behavior when APPLY/CHANGE/REMOVE is pressed:
- the app transaction enters the same non-blocking gameplay busy/streaming lifecycle as a normal turn;
- the Story area stays visible and streams; do not cover the narrative with a blocking full-screen loading overlay;
- duplicate clicks while the operation turn is in flight are disabled/fenced;
- on terminal commit, context, turn number, active rules, choices, map/state/MM all refresh from committed server context;
- on terminal failure, show a bounded useful error and restore the prior committed CSA state; do not pretend the rule succeeded;
- mobile controls remain reachable.

Do not redesign the high-parity CSA UI in this task. That is a later phase. Change only what is required for chronological transaction behavior and correct status copy.

## 5. Focused deterministic regressions

Add/update only the tests necessary to prove the generic contract. At minimum cover:
1. APPLY consumes exactly one gameplay turn and does not call/commit a separate zero-turn state mutation;
2. CHANGE consumes exactly one turn and commits the new rule atomically with that turn;
3. REMOVE consumes exactly one turn and commits deactivation while preserving historical turns;
4. failed Story/commit leaves prior CSA state authoritative;
5. in-flight duplicate operation cannot create duplicate jobs/turns;
6. selected catalog item/scope/action identity reaches Story context without prose re-inference;
7. ordinary free-input and choice turns remain unchanged after an active CSA exists;
8. active CSA does not authorize Story to replace an unrelated player action with app/rule interaction;
9. Observer/Mind Monitor prompt/normalization does not infer positive private emotion from compliance alone;
10. bounded existing clothing execution still projects only where its already-approved scope/evidence permits.

Run relevant focused R3 suites, full `npm test` if touched dependencies warrant it, syntax checks, and `git diff --check`.

## 6. TEST-only deployment

If source changes, deploy only the affected R3 TEST artifacts from the reviewed source.

Hard boundaries:
- preserve `R3_GAME_ACCESS_SECRET` and all current bindings;
- no Production;
- no provider/model/temperature/token/timeout tuning;
- no hidden retry/regeneration;
- no migration/schema/RLS/grant/history repair;
- no reset fix in this task;
- do not access or mutate owner/preserved games.

## 7. Mandatory bare-public live acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=`, no preseeded game/storage, no direct-API gameplay substitute.

Use fresh disposable games and visible UI.

### Fixture A — APPLY + unrelated continuation
1. Setup -> Opening -> at least one ordinary committed turn.
2. Open CSA app and APPLY one current catalog rule through visible UI.
3. Require visible Story streaming and exactly one new committed gameplay turn.
4. Verify before/after state proves rule becomes active only with the successful operation-turn commit.
5. Inspect the enactment Story qualitatively: it represents the app action/consequence naturally and does not become a tutorial.
6. Next submit an unrelated ordinary social/movement/work/non-work action.
7. Require that Story follows that literal action and does not snap back into explaining/demonstrating the rule.
8. Verify choices remain meaningfully diverse and not mostly near-paraphrased CSA escalation.

### Fixture B — CHANGE then REMOVE
1. Fresh game with an active rule established through visible UI.
2. CHANGE it through the app; require one streamed turn/one commit and only the new rule definition active afterward.
3. Continue one ordinary turn.
4. REMOVE the rule through the app; require one streamed turn/one commit and inactive state afterward.
5. Refresh/re-entry and verify chronology, active-rule state, and historical Story turns persist correctly.

### Fixture C — private-emotion boundary
Use a fresh or continuing scene with a registered NPC affected by a rule.
- The Story may portray compliance/world-premise behavior as appropriate.
- Inspect the committed Mind Monitor/private state.
- FAIL if the only basis for affection/comfort/desire/arousal/positive excitement is rule compliance itself.
- Do not require a specific negative emotion; require only independent evidence for any positive private-emotion claim.

Across fixtures, include at least 8–12 committed turns total, mixing CSA operation turns, free input, at least two choice clicks, movement/social context, and one refusal/self-state action. Inspect complete Story text, not just state shape.

## 8. Acceptance criteria

GREEN only if:
- APPLY/CHANGE/REMOVE each demonstrably consumes exactly one normal committed gameplay turn with visible Story streaming;
- no zero-turn CSA mutation remains in the active user path;
- CSA state transition is atomic with the successful turn;
- failure cannot leave a half-applied rule;
- refresh/re-entry preserves exact chronology and active state;
- later unrelated turns remain Story-first company-life play rather than CSA tutorial/demo loops;
- choices do not collapse into repetitive CSA/sexual escalation;
- compliance alone does not generate unsupported positive private emotion;
- free input, choice dispatch, agency, canonical navigation, streaming, presence and duplicate-turn protections remain healthy;
- no blocking full-screen loading regression appears;
- no forbidden Production/provider/model/migration/schema work occurred.

Do NOT claim owner-ready after this task.

## 9. Remaining owner-remediation phases after this cut

Do not implement these inside this task unless separately authorized after review:
1. first-arrival Opening motivation + player inner thought + natural character-specific first-person Mind Monitor + broader choice diversity/time progression;
2. high-parity Company donor CSA UI;
3. approved-media image projection + character-aware server TTS;
4. deployed same-game reset integration failure;
5. timeline/current-scene UI residue;
6. final holistic owner-style long-play acceptance.

## 10. Completion report

Post to Issue #68:
- exact root/authority audit of the old zero-turn path;
- exact changed files and executable source SHA;
- focused/full tests actually run;
- deployed TEST API/frontend version IDs;
- disposable fixture IDs;
- APPLY/CHANGE/REMOVE: pre-state -> visible operation -> streamed Story -> Observer -> commit -> post-state/turn evidence;
- proof that failed/in-flight behavior is atomic/fenced;
- unrelated post-CSA Story + choice diversity qualitative findings;
- private-emotion boundary findings with exact evidence;
- refresh/re-entry/duplicate/console/network findings;
- remaining objective defects.

Then set this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK yourself.

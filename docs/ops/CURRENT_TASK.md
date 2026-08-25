# Company — CURRENT TASK

Status: READY
Task ID: company-r3-current-literal-choice-memory-authority-p1-correction-v1
Mode: TARGETED CORE P1 — CURRENT LITERAL PRECEDENCE / PRIOR STORY CHOICE MEMORY AUTHORITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `ecd4f78e0fc1785822bc157ae7d13cb062e50ac5`
Previous task: `company-r3-story-player-movement-agency-p1-correction-v1`
Previous terminal: Issue #68 `5408382379`
Operator whole-canon review: Issue #68 `5408443358`
Accepted movement-authority implementation to preserve: `e523b6fdca209fdecc107f14820a2c2e524dcc61`
Accepted final-presence implementation to preserve: `6c14509131564e66d9a57bd6cccc7e70585f6514`
Accepted PLAYER-location implementation to preserve: `df1a884e350c032cff0ef5bfae834a38c1adf473`
Accepted registered-NPC identity implementation to preserve: `298bfd0af86caca679039fadf431089c8e372531`
Accepted Observer completed-Story evidence implementation to preserve: `72292961a0ad9ed2861ce62a645bad629bbc2e60`
Remote-S1 implementation awaiting valid live acceptance: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh decisive live game: `ab72dbc0-3e58-441b-856f-2530cd93e8e7` — READ ONLY
Known deferred P1: Company Map default-location false-current rendering.

Success terminal:
`CURRENT_LITERAL_CHOICE_MEMORY_AUTHORITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CURRENT_LITERAL_CHOICE_MEMORY_AUTHORITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

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
7. previous terminal `5408382379`
8. operator whole-canon review `5408443358`
9. this CURRENT_TASK.

Preserve A′/R3 exactly:
server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

No Production.
Do not mutate/reset/retry preserved evidence games.

## 1. Accepted previous target

The previous Story PLAYER-movement correction is accepted for its narrow target and frozen.

`e523b6f...` reuses the existing bounded navigation resolver and projects its exact current-turn result as a server-owned movement authority. NPC-only movement receives `authorized=false` plus canonical location preservation; explicit PLAYER navigation receives the exact canonical destination. Do not reopen or weaken this boundary unless a direct regression is proven.

The fresh live campaign verified:
- NPC-only literal did not move PLAYER;
- explicit `나는 2층 공용 회의실로 이동한다.` reached the exact destination;
- reload restored the committed location/history/choices without duplicate commit.

## 2. Decisive new P1 — current literal replaced by an unchosen prior Story choice

Fresh preserved TEST game:
`ab72dbc0-3e58-441b-856f-2530cd93e8e7` — READ ONLY.

Turn 0 Opening ends with four Story-authored next-action choices. One of them is effectively:
`고개를 끄덕이며 "네, 안내해 주세요"라고 조용히 답한다.`

Those four choices are **not committed PLAYER actions**. They are optional future actions. A later free-form literal discards them unless it explicitly selects/repeats one.

Turn 1 literal is exactly:
`이메이는 지금 브랜드전략팀 사무실을 떠나 2층 공용 회의실에서 진행되는 브리핑에 참석한다. 이메이가 사무실 밖으로 나가는 모습을 보여준다.`

Completed Turn 1 Story instead:
- begins by authoring PLAYER ending 박정우's handshake and saying `"네, 안내 부탁드립니다."`;
- keeps 이메이 in the office and has her guide PLAYER;
- sends 박정우 out toward the briefing;
- therefore substitutes the selected actor/action (`이메이` departure -> `박정우` departure) while executing a stale, unchosen Opening choice.

Durable state/Observer follow the completed Story correctly: PLAYER remains in `brand_strategy_office`, 박정우 exits, 이메이 remains. Observer/DB are not the owning defect.

This is a fresh `P-AGENCY-001` P1.

## 3. Earliest owning boundary to prove before editing

Inspect in this order:

1. `runtime-r3/domain/memory.js`
   - current `recent_turns` projection;
   - verify that prior turn `story_text` is injected wholesale, including the final four Story-authored choice lines;
   - verify current submitted `literal_action` is separately supplied but prior unchosen choices are not structurally excluded from continuity.
2. `runtime-r3/domain/observer-normalizer.js`
   - existing bounded exact final-four Story choice-tail logic (`storyChoiceTail` / `projectChoices` or its current equivalent);
   - this is proof that the runtime already knows the bounded shape of Story-owned final choices. Do not create a generic narrative parser.
3. `runtime-r3/server/provider.js`
   - ordinary Story prompt current-literal precedence;
   - prior-turn memory wording and whether unchosen prior choices are distinguished from committed chronology.
4. `runtime-r3/server/worker.js`
   - prove the exact current job literal reaches Story unchanged;
   - do not move the fix into Observer/Commit.
5. focused memory/agency/provider/worker/choice tests.

Current-main hypothesis:
- current `recent_turns` contains prior `story_text` including final numbered choices;
- those choices are presentation/future suggestions but are projected next turn adjacent to actual committed narrative;
- the model can therefore continue an unchosen prior option as if it were committed action despite receiving the new literal;
- this contaminates current-literal authority before Story generation.

Prove or disprove this exact seam before editing. If an earlier existing Story-memory seam is the actual cause, fix that narrower seam and explain it in the terminal.

## 4. Required product law

For every ordinary turn:
- the exact submitted current `literal_action` is the highest-priority PLAYER action/intent for this turn;
- previous Story-authored choices are **unexecuted suggestions**, not chronology, not player state, and not action authority;
- a prior choice becomes action evidence only if the later committed `literal_action` actually selects/repeats it;
- free-form input supersedes all previously offered choices;
- historical Story narrative remains valid chronology, but its final choice menu must not be replayed to Story as committed narrative reality;
- Story may determine feasibility/reaction/consequence, but may not replace explicit actor, target, action, movement/destination, request, refusal, self-state, topic, or intent;
- if the requested external outcome cannot or should not complete, narrate the block/reaction while preserving actor/action direction instead of substituting another actor/action;
- Observer/Commit remain post-Story observers and must not repair prose.

## 5. Allowed implementation

Allowed only when proven necessary:
- project prior recent Story narrative **without** the exact final Story-owned choice tail when that tail can be safely identified by the existing bounded choice contract / exact committed `turn.choices` parity;
- preserve actual narrative text before the choice tail;
- keep prior committed `literal_action` as chronology evidence;
- optionally expose prior `choices` separately as presentation-only/unexecuted metadata if useful, but they must not be mixed into committed narrative text;
- add a narrow structured current-turn literal authority fact such as:
  - `literal_action=<exact submitted literal>`,
  - `source=submitted_current_turn`,
  - `supersedes_prior_story_choices=true`,
  - `prior_story_choices_are_unexecuted_suggestions=true`,
  only if source review shows this is needed after memory decontamination;
- strengthen existing ordinary Story prompt so current literal has precedence over historical choice suggestions;
- factor/reuse existing bounded exact-choice-tail semantics if appropriate.

Prefer removing false history authority over adding more prompt prose.

## 6. Forbidden approaches

Do NOT add:
- generic Korean semantic parser, NER, fuzzy actor matcher, embedding classifier, action ontology, relation engine, or third parser generation;
- actor/action post-Story rewrite;
- post-Story censor/repair of completed prose;
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
- Opening voluntary-action leaks unless directly caused by this exact prior-choice contamination seam;
- remote supported S1 live acceptance;
- `성기를 직접 검사` / `genital_touch` semantic grounding;
- CSA CHANGE/REMOVE prospective-state/provenance;
- broad MM reliability;
- Media/TTS.

## 7. Preserve accepted/current behavior

Do not regress:
- current-turn PLAYER movement authority from `e523b6f...`;
- final NPC-presence evidence from `6c14509...`;
- PLAYER location/NPC-only resolver behavior from `df1a884...`;
- registered NPC canonical identity from `298bfd0...`;
- completed-Story Observer positive-evidence law from `72292961...`;
- Opening stationary-start / setup identity / private-app provenance;
- Story-owned exactly four choices + unrestricted free input;
- exact selected choice submission when the user actually clicks a prior offered choice;
- feedback revision behavior;
- temporal continuity;
- CSA authority and finite S1/S7 contracts;
- player-thought grounded-only fail-local safety;
- exactly one Story + one Observer + one atomic Commit.

## 8. Required deterministic regressions

Use the actual current R3 memory -> provider -> worker path where practical.

### A. Prior choice tail is not recent committed chronology

Construct a committed prior turn whose Story ends in four canonical numbered choices and whose stored `choices` exactly match them.

Required next Story context:
- prior narrative before the choice menu remains in recent continuity;
- the four final choice actions are not embedded in `recent_turns[*].story_text` as historical narrative/action;
- prior committed `literal_action` remains available;
- no unrelated narrative body is truncated.

### B. Current free-form literal supersedes prior menu

Use the decisive live shape:
prior Opening offers an `안내해 주세요` style choice, then current free-form literal is exactly:
`이메이는 지금 브랜드전략팀 사무실을 떠나 2층 공용 회의실에서 진행되는 브리핑에 참석한다. 이메이가 사무실 밖으로 나가는 모습을 보여준다.`

Required provider context/prompt:
- exact current literal is present unchanged;
- previous offered `안내해 주세요` action is not presented as committed chronology/current action authority;
- current literal is explicitly highest-priority current-turn PLAYER input;
- no structural field claims that a prior unchosen choice executed.

### C. Actually selected prior choice still works

If a user submits a literal equal to one of the offered prior choices:
- that new committed literal is preserved normally as current authority;
- stripping its previous menu copy must not prevent the selected action from being executed from the current literal.

### D. Choice projection remains exact-four

Keep current Story choice extraction/projection tests green:
- exactly four final Story choices;
- observer mismatch fallback behavior;
- supported symmetric emphasis tolerance if currently canonical;
- no new parser generation.

### E. Non-choice numbered prose safety

Do not strip arbitrary numbered narrative content. Strip only the bounded final four choice tail when it safely matches current exact Story-choice contract / stored committed choices.
If safe parity is absent, fail local rather than deleting narrative text.

### F. Accepted agency/movement boundaries

Keep focused regressions green for:
- NPC-only PLAYER movement forbidden;
- explicit PLAYER navigation exact destination;
- actor/target/action generic agency contract;
- final presence reconciliation;
- registered identity;
- completed-Story Observer provenance;
- Opening agency/private-app provenance;
- one Story/one Observer.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader R3 memory/agency/provider/worker/choice regressions;
- exactly one full `npm test` after focused green and record count/exit.

Automated green is not product acceptance.

## 9. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If API/runtime executable source changes:
- confirm local/remote main equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as approved ephemeral off-repo catalog input to the unchanged gate;
- if gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 10. Fresh deployed-browser acceptance — exactly one new game

After TEST deployment, use actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Target ~3–5 committed turns. Stop at first new reproducible P0/P1.
Known Company Map false-current presentation is already recorded and must not be confused with durable truth.

### A. Opening

Complete a normal Opening.
Verify stationary-start, exact identity, private-app provenance, four Story choices + free input.
Do not click an Opening choice for the decisive next step.

### B. Free-form current literal vs stale prior choices — decisive gate

Submit a natural free-form literal that is clearly different from all four Opening choices and explicitly names a registered NPC/action.
Prefer the preserved repro literal when scene-compatible:
`이메이는 지금 브랜드전략팀 사무실을 떠나 2층 공용 회의실에서 진행되는 브리핑에 참석한다. 이메이가 사무실 밖으로 나가는 모습을 보여준다.`

PASS only if:
- Story does not execute any unchosen Opening choice as PLAYER speech/gesture/action;
- Story addresses the exact current literal actor/action;
- Story may block/refuse/modify feasibility through grounded reaction, but may not substitute another actor's departure/action for the chosen actor/action;
- PLAYER movement remains governed by accepted current-turn movement authority;
- durable Observer/state follow completed Story coherently.

If an unchosen prior choice is executed or current actor/action is replaced, STOP immediately. No retry.

### C. Selected-choice positive control

Only if B passes, submit one of Turn B's newly offered choices by actual UI click.
PASS if the clicked full literal becomes the next current action normally. This proves removal of historical menu authority did not break real choice selection.

### D. Reload/re-entry

If no new P0/P1, perform one deliberate reload and verify committed Story/history/current choices restore without duplicate commit.

After campaign, perform independent whole-canon audit before any next task is chosen.

## 11. Terminal / STOP law

On success:
1. commit/push implementation and tests on `main`;
2. deploy TEST API only if executable API source changed;
3. perform exactly one fresh browser campaign above;
4. overwrite this same file to `WAITING_REVIEW` with concise execution record;
5. post Issue #68 terminal:
   `CURRENT_LITERAL_CHOICE_MEMORY_AUTHORITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`.

On blocker/failure:
- preserve evidence;
- no retry/sample-until-pass;
- overwrite this same file to `WAITING_REVIEW` with exact blocker;
- post:
  `CURRENT_LITERAL_CHOICE_MEMORY_AUTHORITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`.

Declared terminal = STOP.
Do not self-register the Company Map task or later lane. Operator must perform the independent `POST_LIVE_CANON_AUDIT_CONTRACT` review before choosing the next CURRENT_TASK.

# Company — CURRENT TASK

Status: READY
Task ID: company-r3-s1-remote-supported-same-turn-execution-p1-correction-v1
Mode: TARGETED CORE P1 — REMOTE ACTIVE-S1 SUPPORTED SAME-TURN EXECUTION
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `898a501a37e4022ad307587085430971195f9e36`
Previous task: `company-r3-opening-private-app-provenance-separation-p1-continuation-v1`
Previous terminal: Issue #68 `5406292151`
Operator / whole-canon review: Issue #68 `5406328742`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_CLEAR_FOR_NEXT_LANE`
Preserve Opening private-app provenance implementation: `dc99a6225bbaa3732ac53a320286fd935001b0ec`
Preserve no-invented-player-travel implementation: `bd643fa026f2c1a0bcf8e3db6abf18b0294ee004`
Preserve S1 closed-world / PLAYER-sole-issuer implementation already on main.
Decisive preserved remote-S1 evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
Latest Opening acceptance game: `bc16b278-2aee-4b3d-abfb-bab104aedf2e` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`S1_REMOTE_SUPPORTED_SAME_TURN_EXECUTION_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`S1_REMOTE_SUPPORTED_SAME_TURN_EXECUTION_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5406292151`
8. operator whole-canon review `5406328742`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, PR, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

## 1. Why this task exists — supported S1 loses mandatory same-turn force when exact pair is remote from PLAYER

Preserved game `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` proves the defect read-only:

- Active canonical S1: `sexual_work_instruction_authority`.
- Exact configured pair: subject/recipient `서원희` (`heroine1`) -> counterparty `박정우` (`general_park_jungwoo`).
- Supported action families are exactly:
  - `kiss`
  - `sexual_touch`
  - `genital_exposure`
  - `genital_touch`
  - `oral`
  - `penetration`
- Turn 2 literal explicitly keeps PLAYER in `brand_strategy_office` while 서원희 and 박정우 move together to `brand_strategy_meeting_room`.
- Turn 2 Story/Observer/applied/durable state correctly preserve PLAYER in the office and remove that NPC pair from PLAYER's present-actor set.
- Turn 3 literal is exact and unambiguous:
  `나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`
- `kiss` is a supported S1 family and the actor/target pair is exact.
- Actual Turn 3 Story does NOT execute/begin the kiss. It stops at 서원희's `지금, 뭐라고 하셨죠?` and defers the supported act.
- Observer and durable `scene_note` commit that non-execution reality.

This violates existing binding product law; no new owner decision is needed:
- S1 supported finite family instructions may receive mandatory institutional authority.
- existing active S1 binding says `official_work_order_same_turn: true`;
- existing literal boundary says supported literal may not become confirmation/future deferral/substitution;
- current Story movement boundary correctly says a remote instruction must be delivered without moving PLAYER.

The defect is that those two correct boundaries are not reliably joined when the exact S1 pair is known to be in another scene/location.

## 2. First owning boundary / hypothesis to prove

Inspect first:
- `runtime-r3/domain/csa.js`
  - `buildActiveS1StoryBinding()`
  - exact subject/counterparty direction
  - `official_work_order_same_turn`
- `runtime-r3/domain/memory.js`
  - `active_s1_story_binding`
  - `active_s1_literal_contract`
  - recent committed scene/history projection for ordinary turns
- `runtime-r3/server/provider.js`
  - `STORY_SYSTEM_PROMPT`
  - `STORY_NPC_MOVEMENT_PROMPT`
  - final ordinary Story prompt composition
- Story request construction/callers and focused S1/navigation tests.

Current source already says separately:
1. a positively matched supported S1 literal is mandatory same-turn and may not be confirmation/future deferral;
2. a remote instruction must be delivered without moving PLAYER.

Live evidence proves those clauses are insufficiently ordered/joined: remote locality becomes an implicit veto/confirmation boundary.

Required correction is a narrow precedence/contract clarification at the existing Story boundary:
- when active exact-scope S1 is present;
- the literal positively matches one of the six finite supported families;
- the literal names the exact configured subject/counterparty;
- and committed/recent Story context already grounds that exact pair remotely/co-located away from PLAYER;
then remote separation from PLAYER does NOT remove S1 mandatory force.

The Story must:
- deliver/communicate the PLAYER-issued official instruction without inventing PLAYER travel;
- begin/perform the supported act in that same Story turn at the grounded remote pair's scene;
- preserve PLAYER's current canonical location unless the literal itself moves PLAYER;
- allow reluctance, embarrassment, surprise, protest, awkwardness around execution but not confirmation-as-veto, future deferral, rule discussion instead of the act, or actor/target substitution.

Do not invent a generic telepathy premise. Story may use a normal plausible communication/delivery channel consistent with the current fiction, or narratively establish that the instruction is heard/received. The key invariant is that remote delivery is not a mandatory-authority veto and is not permission to move PLAYER.

If another earlier existing boundary is proven to own the failure, fix that instead and explain it in the terminal.

## 3. Closed-world / negative boundary must remain intact

Do NOT broaden S1.

- Supported family list remains exactly the six current canonical values.
- `player_request_executes_immediately` remains retired.
- Unsupported or ambiguous actions remain ordinary/non-mandatory even if the literal says `공식적으로`, `지시`, `업무명령`, etc.
- Remote status must not turn an unsupported request into a mandatory one.
- Exact PLAYER issuer / subject / counterparty direction is immutable.
- The counterparty never becomes issuer.
- Compliance is not desire, affection, romance, comfort, arousal, trust, obedience-as-personality, or private consent-as-feeling.

Known separate later P1 — do NOT fold into this implementation unless the exact same source root is proven:
- supported literal `성기를 직접 검사` / `genital_touch` semantic-grounding failure from prior live evidence.
- Do not sample that probe in this task's browser campaign.

## 4. Preserve accepted behavior

Do not regress:
- Opening stationary-start, exact identity/rank, no pre-literal voluntary PLAYER action;
- private `상식개변` app provenance separation from `dc99a622...`;
- player-private app / institutional official-announcement source separation;
- temporal continuity;
- S1 closed-world unsupported behavior;
- PLAYER sole issuer and exact S1 pair direction;
- ordinary no-rule external-outcome boundary;
- no-invented-player-travel / NPC-only movement behavior from `bd643fa...`;
- S7 literal agency;
- finite compatibility + exact conflict copy;
- Observer scene re-entry / presence work already accepted;
- Story-owned exactly four choices + free input;
- exactly one Story + one Observer + one Commit.

## 5. Forbidden approaches

Do NOT add:
- a generic remote-action executor/router;
- a physical/location graph or generic offscreen simulation engine;
- a Korean keyword/regex sexual-action taxonomy, parser, NER, fuzzy classifier, or semantic repair engine;
- a second Story, reaction Story, verifier, repair LLM, or second Observer;
- retry/regeneration/sample-until-pass;
- post-Story deterministic narrative rewrite;
- deterministic sex-scene author;
- provider/model/temperature/token/secret/config workaround;
- expansion of S1 family list;
- generic consent/relation/emotion/corruption/obedience engine;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend change unless directly proven necessary (not expected);
- preserved-game mutation;
- new branch/PR/task file;
- `OWNER_READY`.

## 6. Deterministic regressions

Tests must inspect the actual built Story context/request/prompt boundary and existing pure helpers, not sanitize generated output.

Required regression coverage:
1. Ordinary request with no active S1 keeps normal no-auto-compliance semantics.
2. Active S1 exact subject/counterparty direction remains immutable and PLAYER is sole issuer.
3. Supported family list is exactly the six canonical values.
4. A positively matched supported S1 action is mandatory same-turn.
5. Active S1 context explicitly states that PLAYER co-location is NOT required for mandatory force when the exact configured pair is already grounded remotely in committed/recent context.
6. Remote supported instruction must be delivered/acted in the pair's grounded remote scene without inventing PLAYER standing/following/walking/approaching/entering/knocking/teleporting.
7. Remote separation alone cannot convert a supported action into confirmation, clarification, rule discussion, future deferral, refusal-as-veto, or another action.
8. Unsupported/ambiguous remote action remains ordinary/non-mandatory and preserves actor/target/action/topic.
9. `player_request_executes_immediately` remains retired.
10. Existing S1 closed-world unsupported, S7, NAV/NPC-only movement, announcement/private-app, temporal, compatibility/conflict-copy, Opening provenance and Observer re-entry focused regressions stay green.
11. No second Story/Observer/verifier/retry path is introduced.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader R3 canon/CSA/navigation/turn-kernel/Opening regressions;
- exactly one full `npm test` after focused green, record deterministic exit/count.

Automated green is not product acceptance.

## 7. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- confirm current local/remote main equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if the gate rejects, STOP instead of weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 8. Fresh deployed-browser acceptance — exactly one new game

After TEST API deployment, use the actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve it READ ONLY after campaign.

Target ~5–7 committed turns. Stop at first reproducible P0/P1.

### A. Opening preservation
- Complete normal Opening.
- PASS: stationary start, exact selected identity, canonical private app remains PLAYER-private/passively exposed, no company/NPC provenance, four Story choices + free input.

### B. APPLY exact canonical S1 pair
Through visible CSA UI activate `성적 업무지시권` for exact pair `서원희 -> 박정우` when available.
PASS:
- exactly one grounded official announcement;
- PLAYER sole issuer;
- correct recipient/counterparty direction;
- private app not institutional source;
- one Story/Observer/Commit;
- active S1 reconstructable in durable state.

### C. Move only the configured NPC pair away from PLAYER
Use the literal as close as practical to preserved evidence:
`나는 자리에 그대로 남은 채 서원희 차장과 박정우 팀장이 브랜드전략팀 회의실로 이동하는 모습을 지켜본다.`

PASS:
- PLAYER remains in current office location;
- 서원희 and 박정우 are grounded together in the meeting room / absent from PLAYER present-actor set;
- no invented PLAYER travel.

### D. Decisive remote supported S1 probe
Submit exactly:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

PASS requires simultaneously:
- actor/target/direction preserved exactly;
- instruction reaches/is received by the remote configured pair without moving PLAYER;
- `kiss` begins/is performed in the same Story turn in the grounded remote pair scene;
- no `뭐라고 하셨죠?` confirmation gate, clarification-as-veto, future deferral, rule discussion instead of execution, substitute act, substitute actor, or PLAYER travel;
- reluctance/awkwardness may remain character reaction;
- observer/applied/durable scene does not falsely move PLAYER into the meeting room.

Record full decisive chain:
`literal -> active S1 binding/context -> Story -> observer raw -> observer applied -> durable state -> next context/UI`.

### E. One remote unsupported preservation probe
Only if D passes, submit one clearly unsupported exact-pair instruction such as:
`나는 서원희 차장에게 박정우 팀장에게 사랑한다고 고백하라고 공식적으로 지시한다.`

PASS:
- literal actor/target/action/topic preserved;
- Story does NOT treat the unsupported action as mandatory merely because S1 is active or the literal says official instruction;
- Story may comply/refuse/question/react as an ordinary request, but must not cite S1 as forcing the unsupported act;
- PLAYER remains stationary unless literal moves PLAYER.

Do NOT use `성기를 직접 검사` in this campaign.

### F. Refresh / re-entry
If no P0/P1 appears, perform one deliberate refresh/re-entry.
PASS:
- no duplicate Story/Commit;
- active S1 reconstructs once;
- PLAYER location and remote NPC scene consequences remain coherent;
- no phantom pending/rejected turn;
- choices/free input/CSA remain usable.

## 9. Whole-canon observations — record, do not broaden

During the single campaign record obvious evidence for later operator audit:
- Story vs observer raw/applied/durable scene disagreement;
- MM raw `{surface,subconscious}` retention/drop for reached heroine turns;
- player_inner_thought invention/drop;
- dialogue projection drops;
- removed/replaced rule ghosts only if naturally encountered;
- player-facing internal CSA implementation text leakage if visible.

Do not implement P2 fixes here.
Media/TTS remain paused.

## 10. Stop / terminal law

No runtime patching during the live campaign.
At first reproducible P0/P1:
- preserve fresh game READ ONLY;
- record decisive chain;
- set this same `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires source/test/deploy gates plus exactly one fresh browser campaign passing Opening preservation, exact S1 APPLY, NPC-only remote move, remote supported kiss same-turn execution, remote unsupported preservation, and refresh with no new P0/P1 before terminal.

On success terminal:
`S1_REMOTE_SUPPORTED_SAME_TURN_EXECUTION_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

On blocker/failure terminal:
`S1_REMOTE_SUPPORTED_SAME_TURN_EXECUTION_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

After any deployed browser campaign, operator must perform independent `POST_LIVE_CANON_AUDIT_CONTRACT` review before choosing/registering the next task.
Do not self-register the later genital-touch semantic-grounding task or any P2/media/TTS lane.
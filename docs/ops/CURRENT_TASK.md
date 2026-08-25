# Company — CURRENT TASK

Status: READY
Task ID: company-r3-observer-final-presence-evidence-p1-correction-v1
Mode: TARGETED CORE P1 — COMPLETED STORY -> OBSERVER -> DURABLE NPC PRESENCE AUTHORITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `c02e8f74f46830b951cf89669255eea740246367`
Previous task: `company-r3-player-location-authority-p1-correction-v1`
Previous terminal: Issue #68 `5407252015`
Operator whole-canon review: Issue #68 `5407378813`
Accepted PLAYER-location implementation to preserve: `df1a884e350c032cff0ef5bfae834a38c1adf473`
Accepted registered-NPC identity implementation to preserve: `298bfd0af86caca679039fadf431089c8e372531`
Accepted Observer completed-Story evidence implementation to preserve: `72292961a0ad9ed2861ce62a645bad629bbc2e60`
Remote-S1 implementation awaiting valid live acceptance: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh decisive evidence game: `cc05bd1f-b8b7-4776-8436-47da43e5467d` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact if local psql is unavailable: Issue #68 `5404426864`

Success terminal:
`OBSERVER_FINAL_PRESENCE_EVIDENCE_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OBSERVER_FINAL_PRESENCE_EVIDENCE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

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
7. previous terminal `5407252015`
8. operator whole-canon review `5407378813`
9. this CURRENT_TASK.

Preserve A′/R3 exactly:
server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

No Production.
Do not mutate/reset/retry preserved evidence games.

## 1. Task-compliance fact to preserve

The previous PLAYER-location task is accepted for its target behavior.

Fresh game `cc05bd1f-b8b7-4776-8436-47da43e5467d`, Turn 1:

Literal:
`서원희와 박정우가 사무실을 나가 2층 공용 회의실로 이동한다.`

Actual read-only DB chain:
- Story keeps PLAYER in the office and sends 서원희/윤민아/박정우 out;
- Observer raw `exited` contains `general_park_jungwoo`, `heroine1`, `heroine2`;
- Observer raw `present_actor_ids=[heroine3, heroine4]`;
- Observer applied keeps the same grounded exits/final set;
- durable `state_after.scene.location_id=brand_strategy_office`;
- durable `state_after.scene.present_actor_ids=[heroine3, heroine4]`.

Therefore:
- `df1a884...` PLAYER-location correction is accepted and frozen;
- do not reopen the NPC-only PLAYER navigation resolver merely because the browser Company Map still displayed 박정우.

The Company Map display issue is a separate known P1 and is intentionally deferred until this more fundamental durable-presence P1 closes.

## 2. New decisive P1 — Opening Story says actor absent, durable scene says present

Same fresh game, Opening Turn 0:

Completed Story explicitly establishes:
`이메이 사원은 아직 출근 전인지 자리가 비어 있었다.`

But:
- Observer raw `present_actor_ids` contains `heroine5`;
- Observer raw `exited=[]`;
- Observer applied still contains `heroine5`;
- durable Opening `state_after.scene.present_actor_ids` still contains `heroine5`.

This is a direct `P-SCENE-001` and completed-Story evidence violation.
The final Story reality is the post-turn scene truth; an actor explicitly established absent at Story end cannot remain durably co-located merely because that actor existed in the prior/default Opening baseline.

This is not a request to create a global NPC-location engine. The product only needs the existing minimal immediate scene state to agree with the completed Story.

## 3. First broken current-main boundary — prove before editing

Inspect in this order:

1. `runtime-r3/domain/content.js`
   - `relevantActorIds()`
   - `openingActorIds()`
   - distinguish Opening Story candidate/relevance facts from durable pre-Story physical presence authority.
2. `runtime-r3/server/worker.js`
   - setup/reset initial `presentActorIds` construction;
   - Opening provider -> Observer -> normalizer -> reducer chain.
3. `runtime-r3/server/provider.js`
   - `observerSceneContract()`;
   - `OBSERVER_SCENE_PRESENCE_PROMPT` / acceptance prompt;
   - current rule that prior scene is baseline only and completed Story must be recomputed.
4. `runtime-r3/domain/observer-normalizer.js`
   - current acceptance of raw `present_actor_ids` based mainly on registered IDs;
   - entered/exited reconciliation.
5. `runtime-r3/domain/reducer.js`
   - final present-set application.
6. focused Opening / Observer / source / worker tests.

Current source evidence:
- setup seeds Opening state with `openingActorIds(content, locationId)`;
- `openingActorIds()` includes default-location actors as prior `present_actor_ids`;
- Story is allowed to establish a different final immediate scene;
- Observer contract already says prior presence is baseline only;
- `normalizeObserver()` nevertheless accepts a valid-ID `present_actor_ids` array as the final answer unless grounded entered/exited reconciliation changes it.

Hypothesis to prove:
**Opening default/relevant actor candidates and prior physical presence are too easy for the one Observer to copy as final presence, while the existing single-Observer boundary lacks a sufficiently explicit/grounded reconciliation for a prior actor whom the completed Story establishes absent.**

If an earlier existing boundary is proven to be the actual cause, fix that instead and explain it in the terminal. Do not add a second semantic authority.

## 4. Required product behavior

After every Story, `scene.present_actor_ids` means registered actors physically co-located with PLAYER at the end of the completed Story.

Required:
- prior `present_actor_ids` is continuity baseline, not immutable truth;
- if completed Story explicitly establishes a prior actor absent/not-yet-arrived/offsite/no-longer-in-scene at Story end, that actor must not remain in final durable presence;
- if completed Story explicitly shows a registered actor entering/returning/arriving and physically present at Story end, that actor may become present;
- if completed Story gives no evidence of a presence change, ordinary continuity may preserve prior presence — do **not** make every omitted actor disappear;
- `entered`, `exited`, `present_actor_ids`, `scene_note`, and `turn_summary` must describe one coherent final Story reality;
- Mind Monitor eligibility must follow that same final relevant/present actor reality;
- literal input alone is not positive evidence of an external transition;
- PLAYER location authority remains separate and the accepted `df1a884...` behavior must remain green.

For Opening specifically:
- Story actor candidates/default-location metadata may help Story choose a living scene;
- candidate/default location is not permission to override a completed Story that clearly establishes an actor absent at the end;
- do not convert all default-location staff into an immutable forced roster.

## 5. Allowed implementation

Allowed only when proven necessary:
- narrow clarification/separation of Opening actor-candidate context vs physical prior-presence authority in existing `content.js` / setup path;
- narrow extension of the existing single Observer scene contract so prior-present actors established absent by completed Story are explicitly reconciled;
- narrow Observer structured evidence field/contract if it stays inside the existing one Observer call and gives the current normalizer grounded evidence to reconcile final presence;
- narrow normalizer/reducer reconciliation using already available Story / prior scene / registered actor directory / one Observer output;
- focused deterministic tests through the actual worker path.

Prefer one bounded final-presence authority over independent heuristics.

A useful implementation pattern, if current source supports it, is to make the one Observer explicitly reconcile each relevant prior actor into final `present` vs grounded `absent/exited` Story reality rather than silently copying the prior list. This is guidance, not permission to create a general semantic engine.

## 6. Forbidden approaches

Do NOT add:
- generic Korean absence/presence regex parser, NER, fuzzy semantic classifier, embedding classifier, or new parser generation;
- generic NPC tracking/location engine, schedule simulator, route engine, or global physical ontology;
- post-Story prose rewrite;
- deterministic Story author/repair author;
- retry/regeneration/sample-until-pass;
- second Story, second Observer, verifier LLM, repair LLM;
- provider/model/temperature/token/secret/config workaround;
- DB/schema/RPC/migration/backfill;
- Production;
- new branch/PR/task file;
- preserved-game mutation;
- `OWNER_READY`.

Do not use this task to fix:
- R3 Company Map default-location false-current rendering;
- remote supported S1 live acceptance;
- `성기를 직접 검사` / `genital_touch` semantic grounding;
- continuous-rule compliance;
- CHANGE/REMOVE state provenance;
- broad MM reliability;
- CSA player-facing internal copy;
- Media/TTS.

The map false-current P1 from review `5407378813` is known and must be reported, not silently fixed here.

## 7. Preserve accepted/current behavior

Do not regress:
- PLAYER location / NPC-only movement / unresolved alias behavior from `df1a884...`;
- registered NPC canonical formal identity from `298bfd0...`;
- completed-Story outcome evidence work from `72292961...`;
- Opening stationary-start / no invented PLAYER action / exact PLAYER setup identity;
- private-app provenance negative boundary;
- temporal continuity;
- official rule issuance/private-app institutional-source separation;
- PLAYER sole issuer and exact S1 pair direction;
- S1 closed-world unsupported semantics and exact six supported families;
- remote-S1 source work `1cc59e...` as implemented-but-not-yet-live-accepted;
- ordinary external-outcome boundary;
- S7 literal agency;
- finite compatibility + exact conflict copy;
- player-thought grounded-only fail-local safety;
- Story-owned exactly four choices + free input;
- exactly one Story + one Observer + one Commit.

## 8. Required deterministic regressions

Use actual current R3 provider contract / normalizer / reducer / worker path where practical, not disconnected constants only.

### A. Exact Opening regression from fresh evidence

Construct a prior Opening scene where `heroine5` is in the prior/default presence baseline, then a completed Story whose final reality explicitly says:
`이메이 사원은 아직 출근 전인지 자리가 비어 있었다.`

The resulting one-Observer -> normalizer -> reducer path must produce final durable presence that **does not contain `heroine5`**.

Do not solve this by regex-matching that Korean sentence in runtime code.

### B. Continuity preservation negative control

If a prior-present registered actor is not moved, removed, or established absent by completed Story, that actor must not disappear solely because Story omitted their name from one paragraph.

### C. Grounded departure

From prior office presence containing 서원희 + 박정우, completed Story clearly moves both out of PLAYER's scene.
Final durable presence excludes both while PLAYER location remains unchanged.

### D. Grounded return/re-entry

A prior-absent registered actor who explicitly returns/enters PLAYER's canonical scene in completed Story is added to final presence.

### E. Raw contradiction reconciliation

If the one Observer supplies a final presence list inconsistent with its own grounded transition/final-presence evidence, the existing bounded reconciliation must choose one coherent completed-Story result rather than persisting both realities.

### F. Scene-field coherence

For all above cases, `present_actor_ids`, `entered`, `exited`, `scene_note`, and `turn_summary` describe the same final reality.
MM projection for an actor removed from final scene must not survive merely because the actor was present in the prior baseline.

### G. Preserve location authority

Exact previous regression remains green:
`서원희와 박정우가 사무실을 나가 2층 공용 회의실로 이동한다.`
- no PLAYER navigation;
- remote NPC location quote cannot move PLAYER;
- durable PLAYER location remains prior canonical location.

Also retain:
- exact canonical PLAYER movement;
- mixed NPC/PLAYER clauses;
- unresolved `신사업TF 사무실` does not silently alias to generic `office`.

### H. Focused prior accepted boundaries

Registered actor identity, Opening agency/provenance, temporal, S1/S7, compatibility/conflict-copy, choices, player-thought fail-local and one-Story/one-Observer regressions remain green.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader Opening / Observer / source / turn-kernel / navigation regressions;
- exactly one full `npm test` after focused green and record count/exit.

Automated green is not product acceptance.

## 9. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If API/runtime executable source changes:
- confirm local/remote main equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected in this task;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 10. Fresh deployed-browser acceptance — exactly one new game

After successful TEST deployment, use the actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Target ~3–5 committed turns. Stop at first **new** reproducible P0/P1.
The already-recorded Company Map default-location false-current P1 is known/out-of-scope for this campaign and must not be misreported as durable presence; do not claim the map green.

### A. Opening — primary gate

Complete normal Opening.
Record:
`Opening Story -> observer raw -> observer applied -> durable state -> rendered state/MM`.

PASS:
- final durable `present_actor_ids` agrees with the completed Story;
- if Story explicitly says a registered actor is absent/not yet arrived/offsite at Story end, that actor is absent from durable presence;
- if Story physically establishes an actor present, that actor may be present;
- no prior/default actor survives solely by copied baseline against explicit final Story absence;
- `scene_note` and structural presence agree;
- PLAYER stationary-start, private-app provenance, exact identities, four choices/free input remain valid.

If the random Opening happens to establish all candidate actors physically present, do not fabricate an absence just to satisfy the test. Continue to B/C and report that the exact negative Opening branch was not naturally exercised; deterministic regression remains required.

### B. Grounded NPC departure

From a scene with at least one registered NPC present, use a literal that asks that NPC (or two current NPCs) to leave/move to `2층 공용 회의실`, preserving actor/destination.

PASS:
- Story decides/narrates the completed outcome;
- if Story clearly completes the departure, raw/applied/durable final presence removes the departed actor(s);
- PLAYER location remains unchanged unless PLAYER literal explicitly moved;
- no absent actor MM survives as if still co-located.

### C. Grounded NPC return/re-entry

If B completed and no new P0/P1 occurred, use one literal that naturally brings one departed registered actor back to the PLAYER scene.

PASS when Story completes the return:
- Observer grounded entry/final presence includes the actor;
- durable presence includes them once;
- no duplicate/ghost actor.

If Story does not complete the return, Observer must preserve the actual completed Story instead of treating literal intent as success.

### D. Refresh/re-entry

One deliberate refresh only.
PASS:
- same committed turn/state reconstructs;
- no duplicate Story/Commit;
- durable presence is unchanged;
- known Company Map default-location presentation issue may still be visible and must be reported separately, not interpreted as a state mutation.

For decisive turns record full chain:
`literal -> Story -> observer raw -> observer applied -> durable state -> UI`.

## 11. Whole-canon observations — record, do not broaden

During this one game record obvious evidence for later operator audit:
- final Story vs presence/state disagreement;
- raw/applied MM retention/drop;
- player-thought invention/drop warnings;
- Opening private-app provenance if suspicious;
- registered actor identity stability;
- known Company Map false-current behavior;
- any new P0/P1 outside scope.

Do not implement P2/map/S1/media fixes during the live campaign.

## 12. Stop / terminal law

No live patching.
At first new reproducible P0/P1:
- preserve fresh game READ ONLY;
- record decisive chain;
- set this same task file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires:
- smallest existing final-presence boundary corrected without a generic parser/engine;
- focused + full tests green;
- TEST deployment only if executable changed;
- exactly one fresh browser game;
- Opening/grounded departure/return-reentry gates reached as far as Story permits without sample/retry;
- no new P0/P1 before terminal;
- Production/DB migration/provider-config/retry/second Story/second Observer/second game = 0.

On success:
- set this same file to `WAITING_REVIEW`;
- post exactly one terminal:
`OBSERVER_FINAL_PRESENCE_EVIDENCE_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`OBSERVER_FINAL_PRESENCE_EVIDENCE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the known Company Map task. After any deployed browser campaign, operator must perform the independent `POST_LIVE_CANON_AUDIT_CONTRACT` review before choosing the next CURRENT_TASK.

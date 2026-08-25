# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-observer-completed-story-evidence-integrity-p1-correction-v1
Mode: TARGETED CORE P1 — OBSERVER COMPLETED-STORY EVIDENCE INTEGRITY
Updated: 2026-08-25 KST — terminal COMPLETE, awaiting operator review
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `486dc08eb787f694608773d44c3ca94878e7e14e`
Previous task: `company-r3-s1-remote-supported-same-turn-execution-p1-correction-v1`
Previous terminal: Issue #68 `5406451023`
Operator whole-canon review: Issue #68 `5406495285`
Operator review narrowing/correction: Issue #68 `5406502460`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Previous implementation to preserve but NOT yet claim live-accepted: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh decisive evidence game: `af323e14-b157-4c25-ba90-fd0dbeed78e6` — READ ONLY
Preserve remote-S1 evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact when local psql is unavailable: Issue #68 `5404426864`

Success terminal:
`OBSERVER_COMPLETED_STORY_EVIDENCE_INTEGRITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OBSERVER_COMPLETED_STORY_EVIDENCE_INTEGRITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5406451023`
8. operator review `5406495285`
9. operator narrowing/correction `5406502460`
10. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, PR, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

## 1. Why this task exists — Observer promoted unexecuted literal outcomes into committed scene reality

Fresh game `af323e14-b157-4c25-ba90-fd0dbeed78e6`, Turn 2, proves the defect read-only.

Turn 1 durable scene before the failing turn was still:
- `location_id = lobby`
- S1 active with exact pair `서원희 -> 박정우`.

Submitted Turn 2 literal:
`서원희 차장과 박정우 팀장은 함께 브랜드전략팀 회의실로 이동한다. 나는 신사업TF 사무실에서 업무를 계속한다.`

The prior acceptance setup itself was flawed: PLAYER had not first been moved from the lobby to the office, while the task simultaneously expected PLAYER to remain in the office without travel. Therefore this fresh turn is NOT clean authority to reopen the already accepted NPC-only/no-invented-player-travel Story implementation. Do not patch Story movement solely from this evidence.

However one independent P1 is clean regardless of that setup flaw.

Actual completed Story stayed in the lobby and did NOT establish:
- PLAYER working in the new-business TF office;
- 서원희/박정우 reaching the brand-strategy meeting room.

Observer raw nevertheless emitted those unexecuted literal outcomes as if they were completed Story facts:
- `location.location_id = new_business_tf_office`, with a quote copied from the literal rather than the completed Story;
- `scene_note`: PLAYER is working alone in the new-business TF office and 서원희/박정우 moved to the meeting room;
- `turn_summary`: repeats the same successful outcomes.

Runtime correctly rejected the unsupported structured location projection with `location_projection_dropped`, so durable `scene.location_id` remained `lobby`. But `scene_note` and `turn_summary` still committed the contradictory invented reality.

This creates a split committed world:
- structured canonical location = lobby;
- durable natural-language scene = PLAYER in office, NPC pair in meeting room;
- completed Story = lobby with the pair still there.

This violates existing binding law:
- `P-SCENE-001`: one immediate committed scene reality;
- `P-AGENCY-001`: input may be blocked or fail, but the system may not silently pretend a different completed reality;
- Observer is post-Story extraction, not a second narrative author;
- `POST_LIVE_CANON_AUDIT_CONTRACT` requires Story / observer raw / applied / durable agreement.

No new product decision is needed.

## 2. First owning boundary / hypothesis to prove

Inspect first:
- `runtime-r3/server/provider.js`
  - `OBSERVER_SYSTEM_PROMPT`
  - `OBSERVER_SCENE_PRESENCE_PROMPT`
  - `OBSERVER_PRODUCT_PROMPT` / `OBSERVER_ACCEPTANCE_PROMPT`
  - actual observer user payload construction;
- existing Observer extraction/application validation only where already relevant;
- `runtime-r3/domain/memory.js` only if a small explicit observer evidence contract belongs in the request context;
- focused observer/source-correction/scene tests.

Current source already says in places that:
- Observer returns JSON for the completed current Story;
- literal movement alone is intent/input, not successful movement evidence for `location`;
- `scene_note` is synthesized from the completed current Story/current scene.

Live evidence proves that evidence precedence is still ambiguous because `literal_action` is supplied beside `story_text`, and the model promoted literal outcome language into `location`, `scene_note`, and `turn_summary` despite the completed Story not establishing it.

Required correction is the smallest existing Observer-boundary clarification:

- `story_text` is the sole positive evidence source for completed external outcomes and post-Story scene facts;
- `literal_action` is input/intent/context only, never proof that its requested movement/action/outcome happened;
- `current_context` is prior-state baseline only, not proof of a changed outcome;
- if Story omits, blocks, contradicts, or fails to establish a literal-requested outcome, Observer must represent the completed Story reality rather than completing the request itself;
- `location`, `entered`, `exited`, `present_actor_ids`, `scene_note`, and `turn_summary` must describe one coherent completed-Story reality;
- `scene_note`/`turn_summary` may mention an attempted/requested action only as an attempt/request when Story itself establishes that attempt, never as a completed fact merely because the literal contains it.

If the clean first broken boundary is instead an earlier existing Observer request/projection helper, fix that smallest boundary and explain it in the terminal.

## 3. Allowed implementation

Allowed:
- narrow Observer system/product prompt wording and precedence/order;
- a small explicit structured `observer_evidence_contract` (or equivalent) in the existing Observer request payload if that makes the existing law unambiguous;
- narrow existing pure-helper changes needed only to carry that contract;
- focused regression tests that inspect the actual built Observer request/prompt and existing projection behavior.

This task is NOT permission to add a semantic outcome validator.

## 4. Forbidden approaches

Do NOT add:
- a second Observer, verifier, repair LLM, reaction LLM, or second Story;
- retry/regeneration/sample-until-pass;
- a Korean keyword/regex movement/action parser, NER, fuzzy matcher, semantic classifier, or third parser generation;
- a generic physical/location graph or outcome engine;
- post-Observer semantic rewrite of Story meaning;
- deterministic natural-language `scene_note`/summary author that replaces Observer;
- generic relation/consent/emotion/corruption/obedience engine;
- provider/model/temperature/token/secret/config workaround;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend change unless directly proven necessary (not expected);
- S1 family expansion or semantic-grounding changes;
- preserved-game mutation;
- branch/PR/new task file;
- `OWNER_READY`.

Do not use this task to fix the separate known `성기를 직접 검사` / `genital_touch` S1 semantic-grounding P1.
Do not use this task to rework remote S1 execution; `1cc59e...` remains implemented but awaits a valid live prerequisite campaign.

## 5. Preserve accepted/current behavior

Do not regress:
- Opening stationary start, exact identity/rank, private-app provenance separation;
- official rule issuance / private-app institutional-source separation;
- temporal continuity;
- PLAYER sole issuer and S1 exact pair direction;
- S1 closed-world unsupported semantics and exact six families;
- `1cc59e...` remote-S1 precedence additions;
- ordinary no-rule external-outcome boundary;
- accepted no-invented-player-travel / NPC-only movement behavior;
- S7 literal agency;
- finite compatibility + exact conflict copy;
- Observer scene re-entry/presence rules;
- player-thought safety fail-local behavior;
- Story-owned exactly four choices + free input;
- exactly one Story + one Observer + one Commit.

## 6. Deterministic regressions

Tests must inspect the actual Observer request/prompt boundary and existing projection behavior. Do not sanitize generated output to make tests green.

Required coverage:
1. Observer request keeps both `story_text` and literal input available where needed, but explicitly labels/defines literal as input-only non-outcome evidence.
2. Completed `story_text` is the sole positive evidence for successful external action/movement/post-Story scene changes.
3. `current_context` is prior baseline only and cannot prove a new outcome.
4. Location evidence remains Story-quote-grounded; literal-only location outcome is invalid.
5. `entered`/`exited` remain exact Story-quote-grounded.
6. `scene_note` contract explicitly forbids promoting an unexecuted literal request into a completed fact.
7. `turn_summary` contract explicitly summarizes completed Story reality and may not complete omitted/blocked literal outcomes.
8. `present_actor_ids`, `scene_note`, and `location` are required to describe the same player scene.
9. Observer remains extraction only, not second narrative.
10. Existing player_inner_thought safety, MM shape/fail-local, dialogue/choices, scene re-entry, navigation, S1/S7, announcement/private-app, temporal, compatibility/conflict-copy and Opening focused regressions remain green.
11. No second Story/Observer/verifier/retry path is introduced.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader R3 observer/scene/source-correction/CSA/navigation/Opening regressions;
- exactly one full `npm test` after focused green and record deterministic exit/count.

Automated green is not product acceptance.

## 7. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- confirm local/remote main equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if gate rejects, STOP instead of weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 8. Fresh deployed-browser acceptance — exactly one new game

After TEST API deployment, use the actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Target ~4–6 committed turns. Stop at first reproducible P0/P1.

### A. Opening preservation
Complete normal Opening.
PASS:
- stationary start;
- exact selected identity;
- canonical private app remains PLAYER-private/passively exposed;
- no NPC/company provenance;
- four Story choices + free input.

### B. APPLY exact canonical S1 pair
Through visible CSA UI activate canonical S1 for exact pair `서원희 -> 박정우`.
PASS:
- one grounded official announcement;
- PLAYER sole issuer;
- exact direction;
- private app not institutional source;
- one Story/Observer/Commit;
- active S1 reconstructable.

This keeps the same high-risk environment as the failed campaign but is not testing remote S1 yet.

### C. Explicitly establish PLAYER in the office first
Submit exactly or as close as UI permits:
`나는 신사업TF 사무실로 이동한다.`

PASS:
- Story explicitly moves PLAYER to the canonical new-business TF office;
- observer raw/applied/durable `location_id` agree with Story;
- no unrelated actor/action substitution.

Do not continue unless durable PLAYER location is actually the office.

### D. Decisive NPC-only movement / Observer evidence probe
Only after C passes, submit:
`나는 신사업TF 사무실에 그대로 남아 업무를 계속한다. 서원희 차장과 박정우 팀장은 함께 브랜드전략팀 회의실로 이동한다.`

PASS requires simultaneously:
- PLAYER remains in the already-established office; no invented PLAYER travel;
- Story preserves the material NPC actor/target movement beat or, if it explicitly blocks/cannot establish it, narrates that reality rather than silently substituting another completed outcome;
- Observer does not use the literal itself as proof of an outcome absent from Story;
- `location`, `present_actor_ids`, `scene_note`, and `turn_summary` all describe the same completed Story reality;
- no `scene_note`/summary claims the NPC pair reached the meeting room unless Story actually establishes that;
- if Story establishes the pair in the meeting room, Observer/durable continuity may preserve that remote consequence naturally without moving PLAYER.

Record full chain:
`literal -> Story -> observer raw -> observer applied -> durable state -> next context/UI`.

At first Story-level P1 or Observer/state contradiction, STOP; do not patch during campaign.

### E. One neutral continuity turn + refresh
Only if D passes, submit one simple stationary/non-movement follow-up that does not test remote S1 authority, then perform one deliberate refresh/re-entry.

PASS:
- next Story consumes the same canonical scene truth rather than a contradictory literal-derived ghost;
- no duplicate Story/Commit;
- active S1 reconstructs once;
- PLAYER location remains coherent;
- choices/free input/CSA remain usable.

Do NOT submit the remote supported kiss probe in this campaign. That resumes only after this Observer lane is operator-accepted.
Do NOT submit `성기를 직접 검사`.

## 9. Whole-canon observations — record, do not broaden

During the single campaign record obvious evidence for later operator audit:
- Story vs observer raw/applied/durable disagreement;
- MM raw `{surface,subconscious}` retention/drop for reached heroine turns;
- player_inner_thought invention/drop;
- dialogue projection drops;
- choices projection drops;
- removed/replaced rule ghosts only if naturally encountered;
- player-facing internal CSA text leakage if visible.

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

Success requires source/test/deploy gates plus exactly one fresh browser campaign passing A–E with no new P0/P1.

On success terminal:
`OBSERVER_COMPLETED_STORY_EVIDENCE_INTEGRITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

On blocker/failure terminal:
`OBSERVER_COMPLETED_STORY_EVIDENCE_INTEGRITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

After any deployed browser campaign, operator must perform independent `POST_LIVE_CANON_AUDIT_CONTRACT` review before choosing/registering the next task.

## 11. Execution terminal — COMPLETE / awaiting operator review

Terminal token:
`OBSERVER_COMPLETED_STORY_EVIDENCE_INTEGRITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

- Reviewed executable/source commit: `72292961a0ad9ed2861ce62a645bad629bbc2e60` (pushed to `origin/main`).
- Implementation: `runtime-r3/server/provider.js` now sends an explicit completed-Story evidence contract; `literal_action` is intent-only, `story_text` is the sole positive outcome evidence, and the coherent scene fields are constrained to one completed Story reality. `test/r3-observer-failure-provenance.test.mjs` asserts the built request contract/prompt.
- Verification: syntax checks and `git diff --check` passed; focused 40/40 passed; broader R3/CSA/navigation/Opening set 236/236 passed; exactly one full `npm.cmd test` passed 583/583.
- TEST deploy: unchanged contract-gate deploy passed; Worker `game-proxy-company-r3`, version `17e0bc12-b7da-475a-84f2-3b7160b846fe`, URL `https://game-proxy-company-r3.zeros.workers.dev`.
- Fresh disposable browser game: `9c72745b-a7d0-4436-af5a-ea03abd317da` (adult profile 민준 / 신사업TF / TF팀장 / 32 / 180 / 75 / 16), preserved READ ONLY after campaign. Opening passed; exact S1 UI APPLY passed for 서원희 → 박정우; committed turns 0–4 only.
- Live evidence chain: turn 2 PLAYER office movement had `story_text`, `observer_raw`, `observer_applied`, and durable `state_after.scene.location_id` all at `office`, with entered actors `heroine1` and `general_park_jungwoo`. Turn 3 kept PLAYER at `office`, recorded both NPC exits, and left durable `present_actor_ids` empty; raw/applied/durable scene facts agreed. Turn 4 neutral continuity and deliberate refresh restored the same office scene; `csa_active` remained `["r3_csa_1"]` and the UI reconstructed one active S1 rule.
- No new P0/P1 was observed. No remote kiss/genital_touch probe, second game, reset, retry, preserved-game mutation, Provider/model/config change, DB write/migration, or Production action was performed.
- Operator must independently review this fresh game under `POST_LIVE_CANON_AUDIT_CONTRACT` before registering another task.

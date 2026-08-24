# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-canon-convergence-staged-repair-v4
Mode: OWNER-ACCEPTED CANON — STAGE A NARRATIVE/P1 CLOSURE AFTER R3 TEST SCHEMA CONVERGENCE
Updated: 2026-08-24 22:58 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `da0065742962f74c2a6b0679e740fe9e655a628c`
Accepted schema convergence terminal: Issue #68 comment `5395751404`
Accepted schema convergence review: Issue #68 comment `5395803643`
Previous staged-repair blocker: Issue #68 comment `5395267488`
Previous browser convergence failure: Issue #68 comment `5394670021`
Accepted implementation baseline to preserve: `c166eee1ccbca23227a7b8f6fd30800c4ba392bb`
Current main runtime/source tree is authoritative; the local-only 316/316 edits reported by `5395267488` are evidence only and are NOT landed.

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file.
- Do NOT create an ops branch or any other branch.
- Read before edit, in order:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md`
  6. Issue #68 terminal `5394670021`
  7. Issue #68 terminal `5395267488`
  8. Issue #68 terminal `5395751404`
  9. Issue #68 operator review `5395803643`
  10. this CURRENT_TASK
- Latest owner canon/current main outrank old PRs/issues/tests/live behavior.
- PR #95/#96 and old redesign branches are provenance only.
- Preserve the A′/R3 architecture. Do not redesign the engine to solve output quality.
- Do not redo accepted `c166eee...` character/media/memory/CSA groundwork unless current evidence proves it wrong.
- Do not assume any unpushed/local-only source result from `5395267488` exists. Reproduce a fix from current main only when the owning boundary is still provably wrong.

Target success terminal:
`CANON_CONVERGENCE_STAGE_A_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CANON_CONVERGENCE_STAGE_A_BLOCKED_AWAITING_OPERATOR_REVIEW`

Never claim OWNER_READY. This task is intentionally Stage A only. Do NOT start Stage B/C/D automatically.

---

# 0. Fixed starting facts

The migration-lineage blocker is closed for current R3 product work.

Accepted TEST schema state from terminal `5395751404`:
- R3 structural target equals current-main source;
- 7 R3 table structures/columns/constraints/indexes already equivalent;
- 13 current `company_r3_*` functions already equivalent;
- the only applied bridge was ACL-only, narrowing `service_role` table access to SELECT;
- `supabase_migrations` stayed 36 rows, fingerprint `119aca88c88b24fafac3ecec8eb629eb` unchanged;
- R3 gameplay row counts were unchanged;
- migration-history mutations = 0;
- migration apply/db push/repair = 0.

Therefore this Stage A MUST NOT run global migration lineage reconciliation, `supabase migration repair`, or `supabase db push` as a deployment prerequisite.

A read-only R3 schema-target recheck is allowed before deployment. If current TEST R3 target has materially drifted from current main, STOP BLOCKED with exact object evidence. Do not repair migration history.

No DB schema change is expected or authorized in this Stage A. If a proposed Stage-A fix genuinely requires a new DB schema contract, STOP for operator review rather than silently authoring/applying a migration.

---

# 1. Stage-A product canon

Stage A is owned by:
- `P-IDENTITY-001`
- `P-AGENCY-001`
- `P-PLAYER-THOUGHT-001`
- `P-STORY-001`
- `P-CHARACTER-001`
- `P-OPENING-001`
- `P-MEMORY-001`
- `P-MIND-001`
- `P-INPUT-001`
- `P-QUALITY-001`

Key non-negotiables:
- adult company-life interactive fiction / character simulation, not work-task simulator;
- free-form literal actor/target/action/topic/refusal/self-state/intent preserved;
- Story may block/fail/consequence an action, but cannot silently replace it;
- game must not invent the player's private desire/consent/motive/thought;
- Opening is a living scene, not roster/profile dump;
- heroines must differentiate through behavior/dialogue, not labels;
- Mind Monitor is `{surface, subconscious}`, current/relevant actors only, same committed reality as Story;
- ordinary turn remains Story -> one observer; no second Story/choice/MM LLM;
- exactly four full Story choices plus separate compact quick-action labels; compact click submits full literal unchanged;
- Story quality/browser reality outranks green tests alone.

---

# 2. Preserve/read-only evidence games

Do not reset/mutate/replay-for-green these prior evidence games:

- Campaign A stale-turn evidence: `3295849e-3734-4c96-90f7-8ea54042968c`
- Campaign B MM identity evidence: `17b85d0b-fc18-4a6f-9670-caab09cf09e8`

Use them read-only only when exact forensic evidence is still available.

Fresh browser acceptance must use NEW disposable adult-profile games.

---

# 3. P1-A — stale/failed turn transport and player-facing recovery

Campaign A previously reached Turn 10, then Turn 11 surfaced `company_r3_stale_turn_timeout` and `Retry failed action` in player-facing UI.

Current source already contains accepted R3 explicit failed-turn retry/stage-fencing work from earlier cuts. Do NOT reopen that architecture merely because a provider/edge request can genuinely fail.

First classify the current boundary from source plus read-only evidence:

`visible literal -> browser POST/request id -> action_id/attempt -> R3 job -> Story provider lifecycle -> observer -> Commit -> reconnect/context recovery -> rendered UI`.

Required distinction:

1. **false/ambiguous stale** — server is still validly processing/committed but client falsely terminalizes or loses the result: P1 source defect, fix owning boundary;
2. **genuine durable failed job** — Story/provider/edge genuinely failed and durable state says failed: may be acceptable only if explicit user recovery works cleanly, no duplicate Story/Commit occurs, and player-facing UI does not expose internal jargon;
3. **hard lock after failure** — next explicit player action cannot recover the canonical turn: P0/P1 source defect;
4. **duplicate/replayed logical turn without explicit user retry**: P0/P1 defect.

Do not use:
- blind timeout inflation;
- provider/model/temperature/token changes;
- hidden automatic retry/regeneration;
- second Story for the same logical action;
- fake client-side commit;
- retry-until-pass acceptance.

If source still exposes `company_r3_stale_turn_timeout`, `r3_*`, `revision`, `Commit`, `Retry failed action`, or equivalent internals as normal game language, replace only the presentation wording while retaining diagnostic codes internally.

A dedicated recovery probe may use exactly one explicit user retry only if a fresh run naturally produces a durable failed job. That retry is product-flow evidence, not a second sample for pass-seeking. Do not count retried prose as a clean quality sample.

Focused contracts must prove:
- a legal in-flight job is not falsely abandoned;
- a true failed/stale job reaches explicit recoverable terminal state;
- one explicit retry uses a fresh action id / correct attempt fencing and commits at most once;
- refresh/reconnect does not create a second Story/turn;
- a failed action does not permanently hard-lock the next canonical turn;
- fast path stays one visible action -> one Story -> one Commit.

---

# 4. P1-B — Story / Mind Monitor actor identity

Campaign B previously showed Story participant identity and rendered Mind Monitor heroine identity disagreeing.

Trace exact current path:

`Story registered actor ids/dialogue -> committed scene present/focal ids -> observer raw MM actor ids -> normalizer/applied ids -> frontend canonical character-name render`.

Classify the first broken boundary:
- Story actor identity;
- observer actor_id output;
- grounding against current/relevant actors;
- normalizer mapping;
- stale prior MM reuse;
- frontend id->name mapping.

Fix only the owning boundary.

Required behavior:
- canonical exact actor IDs only;
- MM entries only for current/relevant registered actors;
- no fuzzy name / nearest-name / pronoun guessing / Korean-name similarity repair;
- ambiguous/invalid MM entry drops locally with warning and never gets assigned to another heroine;
- stale MM from a prior turn must not survive as if current when the new applied MM is empty/invalid;
- MM failure remains local; valid Story commits;
- visible character name must be derived from exact applied actor id;
- MM content must describe the same committed reality as Story;
- player private thought remains empty unless grounded in literal user input.

Add focused regressions for multi-NPC and invalid/ambiguous actor-id cases.

---

# 5. Opening focal projection and character dramatization

Inspect current Opening context construction, including `relevantActorIds(opening)` / heroine-card projection or equivalents.

Required distinction:
- canonical world `present` actors remain truthful;
- Story focal prompt context may be a smaller subset chosen for natural dramatization;
- do not erase physically present registered characters from world state merely to simplify prose.

If current Opening hands all co-located heroines full prompt cards and creates roster/profile-dump pressure, narrow only **focal Story projection**.

`content/characters.json` remains canonical content, but Story receives a bounded whitelist of acting-useful material only. Preserve useful dramatization fields such as:
- ordinary initiative/habits;
- speech/address/social distance;
- work/private behavior;
- stress/anger/embarrassment/conflict;
- help/care;
- hierarchy behavior;
- attraction/intimacy/boundary behavior;
- first CSA reaction/adaptation;
- continuity after meaningful events;
- a small set of dialogue examples.

Do not dump unrelated body/catalog/private metadata or internal archetype labels into Story prompts.

Acceptance failure examples:
- `서원희는 생활형 리더다`-style profile recitation;
- all heroines introduced as dossier list;
- mandatory first-work quest;
- work/report/meeting answer mechanically injected into unrelated social/adult scene.

---

# 6. Agency / thought / choice regression preservation

Before editing these areas, verify current-main behavior and tests. Only patch a proven gap.

Permanent probes:
- `한리브 대리와 점심 메뉴에 대해 가볍게 이야기한다.`
- `혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`
- movement toward a registered heroine including 윤민아 when context permits;
- explicit refusal followed later by changed intent;
- stop/change an ongoing interaction.

Required:
- literal target/topic/movement/refusal/self-directed action preserved;
- Story can narrate refusal/block/consequence, not substitute another action;
- no invented player attraction/desire/consent/moral judgment/decision in `player_inner_thought`;
- exactly four full provider-visible choices on completed Story;
- observer copies/structures literal choices, does not invent replacements;
- choice projection failure does not trigger a second Story;
- choices should be meaningfully different, especially in adult scenes; not four variants of escalation.

---

# 7. Stage-A validation and landing

## 7.1 Deterministic source validation

Run focused tests for changed Stage-A boundaries only first:
- R3 turn/reconnect/failed-retry presentation if changed;
- MM actor identity/grounding;
- Opening focal projection;
- character bounded projection;
- agency/player thought/choice contracts touched by the diff.

Then run:
- changed JS syntax checks;
- JSON parse checks for changed content;
- `git diff --check`.

Before TEST deploy, run the established full repository test suite once as regression signal. Do not restore superseded behavior merely to make stale tests green.

Land only reviewed Stage-A source/test changes on `main` with normal fast-forward semantics. No new branch/PR.

## 7.2 TEST schema predeploy gate — read-only only

Freshly read current TEST R3 target objects. Confirm the schema remains materially equivalent to current main after accepted terminal `5395751404`.

Do NOT run:
- `supabase db push`;
- `supabase migration repair`;
- migration-history mutation;
- migration reapplication.

If material schema drift is found, STOP BLOCKED instead of repairing it inside this task.

## 7.3 TEST deployment

Deploy only R3 TEST components whose source actually changed:
- API Worker if server/runtime changed;
- frontend Worker if frontend/presentation changed.

Record exact Worker version IDs and source SHA.
No Production deploy/access.

---

# 8. Fresh real-browser Stage-A acceptance

After exact TEST deploy/preflight, use actual deployed browser UI, not direct gameplay API as a substitute.

Create one NEW adult-profile game and run a continuous **10–12 ordinary-turn** Stage-A campaign. No regeneration/sample-until-pass.

Required coverage:
- Opening as a natural living scene with small focal interaction;
- social/non-work small talk;
- one full-choice click and one unrestricted free input;
- permanent Han Ribe lunch probe;
- self-directed/alone probe;
- movement toward a registered heroine when practical;
- one refusal/change-of-mind sequence;
- one stop/change interaction;
- heroine conversation and follow-up;
- multi-NPC scene when natural;
- at least one flirt/adult/intimate request plus de-escalation or boundary response;
- player-thought negative checks;
- at least five consecutive MM-bearing turns when the scene supports MM, with exact visible name/applied actor-id parity;
- refresh/re-entry after Turn 3+ and confirmation of no duplicate Story/Commit;
- four full choices remain visible/useful and compact actions still submit full literal.

For every decisive probe, record:
`literal action -> Story -> observer raw -> observer applied -> durable state -> next Story/UI`.

Stage-A PASS requires:
- no reproducible P0/P1 agency/identity/MM/Opening/narrative-transport defect;
- no false/ambiguous stale classification;
- if a genuine failed job naturally occurs, product exposes explicit understandable recovery and does not hard-lock/duplicate; dedicated explicit retry may be tested once, but do not use it to manufacture a clean prose sample;
- no player-facing internal R3 jargon;
- no roster/dossier Opening;
- no work-task funnel dominating unrelated social/adult actions.

If the campaign hits a new unrelated P1 that invalidates subsequent evidence, preserve fixture and STOP. Do not broaden into Stage B/C/D.

---

# 9. Global prohibitions

Do NOT add or reintroduce:
- generic relation/consent/emotion engine;
- generic physical/posture/contact ontology;
- sexual event ledger/dynamic sexual gauges;
- generic CSA execution/sexual-action DSL;
- second Story/choice/MM/media LLM;
- fuzzy/NER/nearest actor repair;
- automatic retry/regeneration-until-lucky;
- provider/model/config/secret changes as quality fixes;
- new parser generation;
- global migration-history repair;
- Production access/deploy;
- destructive DB/history/game rewrite;
- new CURRENT_TASK file or branch.

Do not mutate preserved evidence games listed in this task.

---

# 10. Terminal / lifecycle

On PASS:
- ensure Stage-A source/test changes are actually landed on `main`;
- verify local/remote main equality;
- overwrite this SAME CURRENT_TASK file to `Status: WAITING_REVIEW`;
- post one terminal to Issue #68;
- STOP. Do NOT start Stage B automatically.

Terminal must include:
- START/FINAL main SHA and source SHA(s);
- canon blob/SHA read;
- exact source/test files changed;
- focused/full test results and static checks;
- read-only TEST schema recheck result;
- deployed API/frontend version IDs or explicit no-change/no-deploy;
- fresh browser game id and turn count;
- P1-A classification and any explicit retry evidence;
- P1-B raw/applied/render identity evidence;
- Opening focal-cast evidence;
- permanent agency probes;
- player-thought negative evidence;
- MM consecutive-turn evidence;
- refresh/re-entry duplicate check;
- P0/P1/P2/P3 findings;
- Production access=0;
- migration apply/db push/repair/history mutation=0;
- preserved evidence games mutation=0.

Success terminal:
`CANON_CONVERGENCE_STAGE_A_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CANON_CONVERGENCE_STAGE_A_BLOCKED_AWAITING_OPERATOR_REVIEW`

STOP after terminal. Operator review will decide whether to register Stage B CSA lifecycle continuation.

---

# Stage-A terminal report

Terminal: `CANON_CONVERGENCE_STAGE_A_COMPLETE_AWAITING_OPERATOR_REVIEW`

## Landed source and validation

- Work was performed on `main` only. Start/final main SHA: `15f7f3b5684d48bae6d10ea68b8ac50ca94c009a`.
- `origin/main` equals the final local SHA; no unpushed commit remains.
- Canon/source references were read before execution, including `docs/redesign/COMPANY_CANON.md` and `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md` at the accepted current-main baseline. This task preserves the accepted R3 schema and A-prime boundaries.
- Source files changed in the landed repair commit:
  - `frontend-r3/app.js`
  - `frontend-r3/status.js`
  - `frontend-r3/turn-transport.js`
  - `runtime-r3/domain/observer-normalizer.js`
  - `runtime-r3/server/worker.js`
- Focused tests retained/updated:
  - `test/r3-canon-convergence.test.mjs`
  - `test/r3-feedback-revision.test.mjs`
  - `test/r3-frontend-contract.test.mjs`
  - `test/r3-source-correction.test.mjs`
  - `test/r3-turn-transport.test.mjs`
- Focused tests: 57 passed.
- Full `npm.cmd test`: 554 passed, 0 failed.
- Changed JavaScript/module syntax checks passed; `git diff --check` passed. No changed JSON content required a JSON parse check.
- No provider/model/config/secret change, no new DSL/router/verifier/retry architecture, and no schema change.

## TEST schema/deploy evidence

- TEST project was read-only checked at Supabase project `fmcrspgxstsmxxsmkeee`.
- R3 tables/functions remained materially equivalent to current main; migration history remained 36 rows and no migration repair, migration apply, `db push`, or history mutation was performed.
- Deployed only changed R3 components from the final source SHA:
  - API Worker `wrangler.r3.api.jsonc`: version `8e5e4a27-35e4-429a-9df8-c32ddc189657`.
  - Frontend Worker `wrangler.r3.frontend.jsonc`: version `f8ea750a-aafb-4589-8e0e-e74479b4ab91`.
- Production access/deploy: 0.

## Fresh browser acceptance

- Fresh disposable adult-profile game: `03f0e48b-466b-4f12-8b6a-50730efbe8f5`.
- Continuous campaign: Opening plus committed Turns 1–12; no reset and no replay of preserved games.
- Opening was a living first-day office scene centered on the elevator arrival, Park Jungwoo's greeting, and the first small interaction. It was not a roster/profile dump. Durable Opening scene state retained the canonical six present actor IDs while Story used a bounded focal presentation.
- Four full choices were visible on every completed Story; separate free-input control remained available. A full-choice click and free input both reached the live path; the compact full-choice literal was preserved in the committed turn.
- Decisive action traces (browser literal → stored `game_actions`/R3 `literal_action` → Story → observer raw/applied → state/UI) were read back from `company_r3_turns`. Korean literals were stored as intact UTF-8 text; no `??` corruption was observed.
- Permanent Han Ribe lunch probe: Turn 2 literal asks `한리브` about a non-work lunch and proposes eating together; Story accepts a 12:30 conditional plan. Turns 3–4 continue the exact restaurant/menu thread.
- Social/non-work and multi-NPC probes: Turn 5 asks Yoon Mina about her lunch; Story includes her independent plan and other employees' movement. Turn 9 asks Han Ribe about weekends, and Story follows her quiet walking/park preference rather than forcing work.
- Movement/follow-up: Turn 6 approaches Han Ribe to confirm the meeting time; Turn 7 follows the literal plan to wait and go to the first-floor restaurant; Turn 10 returns with her to the office. The durable location remained canonical and present actor IDs changed only through accepted observer output.
- Adult/boundary probe: Turn 11 explicitly asks whether a sexual approach is acceptable in the workplace and promises to stop if uncomfortable. Story gives a clear workplace/time boundary without inventing consent or escalating. Turn 12 is the explicit apology/stop/change response and commits normally.
- Player-thought negative: raw observer projections that were not grounded in the literal action were dropped locally; no stale prior MM/thought was carried into the next committed UI. The Turn 11/12 boundary sequence retained the literal player's stated intention and subsequent change of intent.
- MM identity: Turn 7–11 provided five consecutive committed turns with non-empty applied MM (`1, 1, 1, 3, 3` entries). Raw/applied keys matched the exact registered actor IDs and rendered names matched those IDs (including `heroine4` → `한리브`, `heroine2` → `윤민아`, `heroine5` → `이메이`). Turn 12's invalid scalar MM projection was dropped to empty applied MM while Story and state committed, with no prior MM reuse.
- Refresh/re-entry: after Turn 3+, a fresh browser view and later an explicit reload returned the same game at Turn 12 with 12 Story paragraphs and no duplicate Story/Commit.

## P1 classification and findings

- P1-A: the first full-choice submission in the fresh campaign produced one non-durable transport failure visible as understandable Korean recovery text; read-only TEST showed no durable job/turn, no stale committed turn, and no duplicate. The next explicit free-input submission created Turn 1 with a fresh literal and normal Story→observer→commit. This was not a durable failed job, so no retry-until-pass or recovery retry was used.
- P1-B: exact post-Story actor membership is now authoritative for MM grounding; the live campaign showed exact raw/applied/rendered parity and local fail-open behavior when an MM projection was invalid.
- Opening, agency, player-thought, choice-count, social/non-work, refusal/boundary, and transport-presentation checks showed no reproducible new P0/P1 defect after the landed repair.
- P2/P3: no new finding in Stage-A scope.
- Preserved evidence games `3295849e-3734-4c96-90f7-8ea54042968c` and `17b85d0b-fc18-4a6f-9670-caab09cf09e8` were read-only and mutation count was 0.
- Migration apply/db push/repair/history mutation: 0. Production mutation: 0.

Operator review is required before any later Stage-B CSA continuation. Do not generate or start another task from this report.

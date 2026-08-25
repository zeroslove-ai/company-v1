# Company — CURRENT TASK

Status: READY
Task ID: company-r3-registered-npc-formal-identity-p1-correction-v1
Mode: TARGETED CORE P1 — REGISTERED NPC FORMAL ROLE / RANK IDENTITY
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `9ff29a3c0182ca6ac714302af08dbe0e1cd026d4`
Previous task: `company-r3-observer-completed-story-evidence-integrity-p1-correction-v1`
Previous terminal: Issue #68 `5406616718`
Operator whole-canon review: Issue #68 `5406676505`
Owner recurrence-root addendum: Issue #68 `5406605153`
Promoted CSA authority commit: `87e24a37795d63dbf3777c3fe3ae5052bff4eda6`
Promoted live-acceptance commit: `9ff29a3c0182ca6ac714302af08dbe0e1cd026d4`
Accepted Observer executable/source SHA: `72292961a0ad9ed2861ce62a645bad629bbc2e60`
Preserve remote-S1 implementation awaiting valid live acceptance: `1cc59e3718ab255da531ccd0b1029893143f9381`
Fresh decisive evidence game: `9c72745b-a7d0-4436-af5a-ea03abd317da` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact when local psql is unavailable: Issue #68 `5404426864`

Success terminal:
`REGISTERED_NPC_FORMAL_IDENTITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`REGISTERED_NPC_FORMAL_IDENTITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. owner addendum `5406605153`
8. previous terminal `5406616718`
9. operator whole-canon review `5406676505`
10. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, PR, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

## 1. Why this task exists — fresh Story changes registered NPC formal identity across turns

Fresh game `9c72745b-a7d0-4436-af5a-ea03abd317da` is preserved READ ONLY.

Canonical repository facts on current main:
- `content/characters.json`
  - `heroine1 / 서원희`
  - department: `브랜드전략팀`
  - position: `차장`
  - role_title: `브랜드전략팀 팀장`
- `content/general_npcs.json`
  - `general_park_jungwoo / 박정우`
  - role: `브랜드전략1팀 팀장`
- `general_oh_sehoon / 오세훈`
  - role: `시설·보안 담당`
  - no canonical `과장` title is supplied.

Fresh Story contradicts those stable repository facts:
- Turn 1: `서원희 사원`, `박정우 대리`, `오 과장`.
- Turn 2: repeats `서원희 사원`, `박정우 대리`.
- Turn 3: switches to `서원희 차장`, `박정우 팀장`.

Names/IDs are correct, but formal company hierarchy changes from turn to turn. That is visible character/world continuity corruption in a company-life character simulation.

The previous Observer P1 is accepted and must not be reopened: fresh Turn 3 proved Story -> observer raw -> observer applied -> durable scene agreement after `72292961...`.

## 2. First owning boundary / hypothesis to prove

Inspect first:
- `runtime-r3/domain/content.js`
  - `canonicalActors()`;
- `runtime-r3/domain/memory.js`
  - Story context actor projection;
- `runtime-r3/server/provider.js`
  - Story system/product prompt and actual Story request construction;
- focused Story/context/character/source-correction tests.

Current source already projects:
- heroine `name`, `department`, `position`;
- general NPC `name`, `role`, `department_id`.

But unlike PLAYER, registered NPCs have no explicit hard formal-identity contract in Story context/prompt. Also heroine `role_title` is not currently exposed by `canonicalActors()` even though it is canonical repository content.

Hypothesis:
- the model receives actor facts as descriptive context but not as immutable formal identity;
- it therefore normalizes/invents familiar office ranks (`사원`, `대리`, `과장`) despite canonical content.

Fix the smallest existing Story actor identity boundary. If another earlier existing boundary is proven, fix that instead and explain it in terminal.

## 3. Required product behavior

For every registered actor supplied to Story:

- canonical actor `id` and `name` remain exact;
- when Story mentions a canonical heroine's formal department, position/rank, or role title, use the corresponding canonical repository value;
- when Story mentions a general NPC's formal role/title, use the canonical repository `role` value or a faithful non-contradictory short reference only if it does not invent a different rank;
- never downgrade/upgrade/swap a registered actor's formal identity across turns;
- if canonical actor data supplies **no formal rank**, Story must not invent one merely for naturalness. Name-only or canonical-role reference is allowed;
- Story is not required to mechanically print full titles on every mention. Natural name-only references are valid. The hard boundary applies whenever a formal department/rank/role is stated or used as address;
- character prompt labels remain internal dramatization guidance and must not be recited as dossier prose.

Examples for decisive regression:
- `서원희 차장` is valid; `서원희 사원` is not.
- `박정우 팀장` / canonical `브랜드전략1팀 팀장` context is valid; `박정우 대리` is not.
- `오세훈 담당자` / `시설·보안 담당 오세훈` / name-only may be valid; `오 과장` is not supported by canonical content and must not be invented.

This task does not create a new character engine or relationship system.

## 4. Allowed implementation

Allowed:
- narrow `canonicalActors()` projection additions needed to expose already-existing canonical formal identity, including heroine `role_title` if useful;
- a small explicit `canonical_actor_identity_contract` or equivalent Story-context structure;
- narrow Story system/product prompt wording/order that makes registered NPC formal identity immutable when mentioned;
- focused tests against the **actual built Story request/context/prompt**.

Prefer one canonical projection from repository content. Do not duplicate semantic catalogs.

## 5. Forbidden approaches

Do NOT add:
- post-Story text rewriting or title substitution;
- regex/keyword rank fixer;
- fuzzy actor matcher, NER, semantic classifier, or new parser generation;
- new character/relationship/hierarchy engine;
- retry/regeneration/sample-until-pass;
- second Story, verifier, repair LLM, or second Observer;
- provider/model/temperature/token/secret/config workaround;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend change unless directly proven necessary (not expected);
- CSA family expansion or generic action executor;
- preserved-game mutation;
- branch/PR/new task file;
- `OWNER_READY`.

Do not use this task to:
- rerun/fix remote supported S1 execution;
- test/fix `성기를 직접 검사` / `genital_touch` semantic grounding;
- fix CHANGE/REMOVE clothing provenance;
- fix continuous-rule deferral;
- fix MM/internal-copy/media/TTS.

## 6. Preserve accepted/current behavior

Do not regress:
- Observer completed-Story evidence integrity from `72292961...`;
- Opening stationary start and PLAYER exact identity/rank;
- newly promoted private-app provenance negative boundary;
- official rule issuance / private-app institutional-source separation;
- temporal continuity;
- PLAYER sole issuer and S1 exact pair direction;
- S1 closed-world unsupported semantics and exact six supported families;
- remote-S1 source work `1cc59e...` as implemented-but-not-yet-live-accepted;
- ordinary external-outcome boundary;
- NPC-only/no-invented-PLAYER-travel behavior;
- S7 literal agency;
- finite compatibility + exact conflict copy;
- player-thought grounded-only fail-local safety;
- Story-owned exactly four choices + free input;
- exactly one Story + one Observer + one Commit.

## 7. Deterministic regressions

Required coverage must use the real current Story context/request construction rather than a disconnected constant test.

1. `canonicalActors()` / Story context preserves exact `heroine1` name + department + position=`차장` and exposes canonical role title where the chosen boundary requires it.
2. Story context preserves `general_park_jungwoo` role=`브랜드전략1팀 팀장`.
3. Story context preserves `general_oh_sehoon` role=`시설·보안 담당` and does not fabricate a rank field.
4. Actor identity contract explicitly forbids downgrade/upgrade/substitution/invented formal rank.
5. Natural name-only reference remains allowed; implementation does not force dossier/full-title repetition.
6. Rule-change selected actor identity/direction still remains exact.
7. PLAYER identity contract remains unchanged and green.
8. Observer completed-Story evidence, navigation/presence, private-app, temporal, S1/S7, compatibility/conflict-copy, choices, Opening focused regressions remain green.
9. No post-Story rewrite/retry/second Story/second Observer path introduced.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader R3 Story/character/source-correction/Observer/CSA/navigation/Opening regressions;
- exactly one full `npm test` after focused green and record deterministic count/exit.

Automated green is not product acceptance.

## 8. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- confirm local/remote main equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST DB contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if gate rejects, STOP instead of weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No Production, DB write, provider/model/config change.

## 9. Fresh deployed-browser acceptance — exactly one new game

After TEST API deployment, use actual deployed TEST frontend/UI.
Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve the game READ ONLY after campaign.

Target ~4–6 committed turns. Stop at first reproducible P0/P1.

### A. Opening identity/provenance preservation

Complete normal Opening.

PASS:
- PLAYER stationary first-arrival boundary and exact selected identity/rank remain correct;
- private app is only passively/player-privately exposed and has no company/HR/security/NPC provenance;
- any registered general NPC formal-role reference is canonical; specifically do not invent `오 과장` for `general_oh_sehoon` when canonical content only supplies `시설·보안 담당`;
- four Story choices + free input.

### B. Visible S1 APPLY — actor identity stress

Through visible CSA UI APPLY canonical S1 exact pair `서원희 -> 박정우`.

PASS:
- one grounded official announcement;
- PLAYER sole issuer and exact pair direction;
- private app is not institutional source;
- Story does not call 서원희 `사원` or 박정우 `대리` or invent another contradictory formal title;
- if their title/rank is mentioned, it agrees with canonical repository content;
- one Story/Observer/Commit.

Do not test supported action execution here.

### C. Explicit PLAYER move to office — canonical actor encounter

Submit:
`나는 신사업TF 사무실로 이동한다.`

PASS:
- PLAYER canonical navigation works;
- when 서원희/박정우 are encountered, Story keeps canonical formal identities stable: 서원희 position `차장`, 박정우 role/team-lead identity;
- no title drift relative to B;
- observer raw/applied/durable scene remains grounded in Story.

### D. One stationary conversation identity persistence probe

Submit a simple neutral literal addressing both registered actors without supplying their ranks, for example:
`나는 서원희와 박정우에게 오늘 오전 일정에 대해 가볍게 묻는다.`

PASS:
- Story preserves actor/target/topic;
- Story may use names naturally, but any formal rank/department/role it chooses to mention must remain canonical;
- it must not infer `사원/대리/과장` or another invented hierarchy label.

### E. Observer/NPC movement preservation probe

Only if A–D pass, run one simple NPC-only movement turn comparable to the accepted Observer campaign while PLAYER stays at the already-established office.

PASS:
- no invented PLAYER travel;
- Story/observer raw/applied/durable scene agree;
- formal actor identity remains stable through movement narration.

### F. Refresh / re-entry

Perform one deliberate refresh/re-entry.

PASS:
- no duplicate Story/Commit;
- active S1 reconstructs once;
- location/actor identities/choices/free input remain coherent.

Do NOT test remote supported kiss in this campaign.
Do NOT test `성기를 직접 검사`.

## 10. Whole-canon observations — record, do not broaden

Record for later operator audit:
- any Story actor/rank/department/role drift;
- Story vs observer raw/applied/durable scene disagreement;
- MM raw `{surface,subconscious}` retention/drop for reached heroine turns;
- player_inner_thought invention/drop;
- dialogue/choices projection drops;
- private-app provenance leakage;
- continuous-rule deferral only if naturally encountered;
- removed/replaced-rule residue only if naturally encountered;
- player-facing internal CSA implementation text leakage if visible.

Do not implement unrelated fixes.
Media/TTS remain paused.

## 11. Stop / terminal law

No runtime patching during live campaign.
At first reproducible P0/P1:
- preserve fresh game READ ONLY;
- record decisive chain;
- set this same `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires source/test/deploy gates plus exactly one fresh browser campaign passing A–F with no new P0/P1.

On success:
- set this same file to `WAITING_REVIEW`;
- post exactly one terminal:
`REGISTERED_NPC_FORMAL_IDENTITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`REGISTERED_NPC_FORMAL_IDENTITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

After any deployed browser campaign, operator must perform independent `POST_LIVE_CANON_AUDIT_CONTRACT` review before choosing/registering the next task.

Expected next lane only if this task + audit are clean:
- resume the preserved remote-S1 live acceptance with a valid explicit PLAYER-location prerequisite;
- then close the separate `성기를 직접 검사` / `genital_touch` semantic-grounding P1 before P2 work.

Do not self-register that next task.

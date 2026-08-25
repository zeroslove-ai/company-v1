# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-opening-private-app-provenance-separation-p1-continuation-v1
Mode: TARGETED CORE P1 — OPENING PRIVATE APP PROVENANCE / SOURCE AUTHORITY SEPARATION
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `fc7466c66c7106b4eccefbb24089d7ac882ce1d6`
Previous task: `company-r3-opening-stationary-start-anchor-p1-continuation-v1`
Previous terminal: Issue #68 `5406140973`
Operator / whole-canon review: Issue #68 `5406170563`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserve stationary-start implementation: `e980c721af68afc31a468128ba74fdbbcabb3c81`
Preserve joint identity+agency implementation: `29457bf9c7a8f00a7b8a701319c3fc73e3f8d24c`
Preserve exact-rank implementation: `49d12d5e2b4c939d0923c70b31823d39b6b1d13e`
Preserve Opening no-invented-player-action implementation: `b719831396436913e4a0ea414064c17040cee1c5`
Preserve ordinary player-movement implementation: `bd643fa026f2c1a0bcf8e3db6abf18b0294ee004`
Preserve Observer scene re-entry implementation: `ae27e7805065118657869ba90a7cf52bc3890982`
Fresh decisive evidence game: `c2223601-c42c-4de1-accb-d61579a496a3` — READ ONLY
Prior Opening evidence games: `9601b7cc-fa1f-4410-9d66-18dc151cd28b`, `6eb13fb7-cf0e-4192-b503-5996cd5523e4`, `e5292172-a34e-4be5-972d-a8c48e77d81a` — READ ONLY
Preserved remote-S1 evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`OPENING_PRIVATE_APP_PROVENANCE_SEPARATION_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OPENING_PRIVATE_APP_PROVENANCE_SEPARATION_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5406140973`
8. operator whole-canon review `5406170563`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

## 1. Why this task exists — private app became company/HR-known onboarding software

Fresh game `c2223601-c42c-4de1-accb-d61579a496a3` Turn 0 has `literal_action=''` and otherwise preserves exact identity (`민준 / 신사업TF / TF팀장`) and a stationary canonical `lobby` start.

But Story makes general NPC 오세훈 say:
- `인사팀에서 전달된 건데, 오늘 신규 입사자 대상으로 개인 휴대폰에 앱 하나를 설치하라고 하더라고요.`
- he asks whether PLAYER already installed it.

Observer then commits:
- summary: `인사팀에서 전달된 직원용 앱 설치 안내 메모를 언급했다.`
- scene_note: the same HR-provided employee-app-install premise.

This directly violates binding `P-PREMISE-001` / `P-OPENING-001`:
- `상식개변` is an unfamiliar private app/tool possessed by PLAYER;
- NPCs do not know that private app exists until PLAYER reveals it;
- company/HR/security/onboarding is not the installer, distributor, trainer, recommender, or knowledge source for it;
- Opening should privately expose/discover the canonical `상식개변` premise, not substitute a company-known generic employee app.

Operator review `5406170563` does NOT confirm the terminal's claimed stationary-start P1 from the descriptive phrase `출입문을 지나 들어서면`; preserve `e980c721...` and do not iterate stationary-start again in this task.

## 2. First owning boundary — split bundled Opening authority

Inspect first:
- `runtime-r3/domain/memory.js`
  - `product.private_discovery` projection;
  - `opening_contract` fields, especially the bundled `identity_arrival_and_app_premise_must_be_established_without_player_action` and `identity_arrival_establishment_authority`;
  - `opening_agency_contract` passive app exposure semantics.
- `runtime-r3/server/provider.js`
  - `OPENING_IDENTITY_AGENCY_PRECEDENCE_PROMPT`;
  - `OPENING_STORY_SYSTEM_PROMPT`;
  - `OPENING_PRODUCT_PROMPT` final composition/order.
- focused Opening/player-identity/source-correction tests.

Current source conflict to resolve:
- correct: `product.private_discovery` says only PLAYER knows the unfamiliar app and NPCs do not until reveal;
- correct: `opening_contract.npc_ignorance_until_player_reveals=true`;
- correct: Opening system prompt says NPCs remain ignorant;
- broken: combined precedence wording permits `identity, arrival, and passive app presence` to be established through company artifact/sign or NPC initiative/dialogue, wrongly granting NPC/company authority over the app premise.

Required correction is **authority separation**, not more keyword bans:

### Identity / arrival authority
May continue to use:
- narrator/world facts;
- normal company identity artifacts;
- NPC initiative/address/dialogue;
- first-day/first-appointment context.

### Private app provenance authority
Must be separately bounded:
- canonical private app is `상식개변` / product app name;
- only PLAYER privately possesses/can notice it before reveal;
- passive device-local/narrator presentation may expose it without a completed PLAYER action;
- NPC/company/HR/security/onboarding/training/general-NPC dialogue or company artifacts may NOT announce, install, distribute, recommend, recognize, explain, ask about, or source that private app before PLAYER explicitly reveals it later;
- do not invent company installer/provenance or a second generic employee app as a substitute for the private premise;
- merely possessing/seeing the app changes nothing.

Use the smallest existing context/prompt shape. A narrow structured `opening_private_app_contract` or equivalent is acceptable if it cleanly separates authority. Do not create a new durable domain or app engine.

If an earlier existing source boundary is proven, fix that instead and explain.

## 3. Preserve accepted behavior

Do not regress:
- `e980c721...` Opening stationary-start anchor: PLAYER already present at canonical starting location; arrival transition is pre-Story setup fact;
- exact canonical formal rank (`TF팀장` when selected), player name and department;
- empty voluntary PLAYER action authority before first literal;
- no pre-literal PLAYER speech/gesture/movement/touch/phone/app manipulation/work/decision;
- first-day / first-appointment semantics;
- rich living Company Opening with NPC/world initiative unrelated to private-app knowledge;
- Story-owned exactly four full choices + free input;
- ordinary-turn agency and explicit navigation;
- Observer scene re-entry behavior;
- temporal continuity;
- rule-change private-app isolation and official announcement ownership;
- S1 closed-world unsupported behavior, PLAYER sole issuer, exact S1 direction;
- S7 / compatibility / exact conflict-copy accepted behavior;
- one Story + one Observer only.

Known separate P1, NOT this implementation:
- preserved game `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`;
- active S1 configured 서원희 -> 박정우;
- supported remote/stationary S1 `kiss` instruction failed to execute in the same Story turn.

Do not modify or sample S1 in this task.

## 4. Forbidden approaches

Do NOT add:
- post-Story regex/string deletion or replacement of `앱`, `인사팀`, etc.;
- Korean keyword classifier/parser/NER/fuzzy detector for app provenance;
- deterministic replacement Opening/template;
- second Story, second Observer, verifier/repair/reaction LLM;
- retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- generic app/world/relation/consent/emotion engine;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend executable change unless directly proven necessary (not expected);
- S1 semantic changes;
- preserved-game mutation;
- new branch/PR/task file;
- `OWNER_READY`.

## 5. Deterministic regressions

At the actual Opening Story request/context boundary prove:
1. `product.private_discovery` remains canonical and explicit.
2. Opening context has a separate private-app authority from identity/arrival establishment authority.
3. Identity/rank/first-day may be established by NPC/world/company identity artifacts.
4. Private app may NOT be established by NPC/company/HR/security/onboarding/company artifact before PLAYER reveal.
5. Private app name is the canonical `상식개변` app; no generic company employee app substitutes for it.
6. Passive device-local/narrator exposure is allowed without PLAYER manipulation.
7. NPC ignorance remains explicit until later PLAYER reveal.
8. Merely possessing/noticing the app does not change reality.
9. `e980c721...` stationary-start anchor remains present and Opening starts in canonical current location.
10. `literal_action=''` still gives zero voluntary PLAYER action authority.
11. Exact formal position `TF팀장` remains mandatory and exact for decisive profile.
12. Ordinary turns are unaffected; explicit later action/navigation remains allowed.
13. Four Story choices remain Story-owned; Observer is not a choice author.
14. Existing temporal/rule-change/announcement/S1-closed-world/S7/compatibility/conflict-copy/Observer-reentry focused regressions remain green.
15. No post-Story repair, parser classifier, second Story/Observer/verifier, or retry path.

Tests must inspect the actual built Story request/context/prompt contract, not sanitize generated output.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader canon/CSA/turn-kernel/navigation/Observer focused regressions;
- exactly one full `npm test` after focused green, recording exit/count.

Automated green is not product acceptance.

## 6. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- verify local/remote `main` equality after implementation;
- deploy TEST API only through unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version/source SHA.

No DB write, Production, provider/model/config change.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use real deployed TEST frontend/UI. Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, direct gameplay API substitute, semantic retry, or sample-until-pass.
Preserve it READ ONLY after campaign.

Use `TF팀장` profile for direct continuity. Target 2–3 committed turns. Stop at first reproducible P0/P1.

### A. Opening — decisive private-app source + preservation gate
PASS simultaneously requires:
- normal living first-day scene in canonical starting location;
- PLAYER begins already present there; no clear completed pre-literal PLAYER movement/action;
- exact `민준 / 신사업TF / TF팀장`-equivalent selected canonical identity is preserved and exact;
- canonical `상식개변` unfamiliar private app is passively present/discoverable to PLAYER without PLAYER manipulation;
- NPCs/company/HR/security/onboarding do not know, distribute, install, recommend, explain, mention, ask about, or source the private app;
- no generic company-known employee app substitutes for the private premise;
- app presence alone does not change reality;
- NPC/world initiative remains natural;
- Story ends with exactly four meaningful full choices and free input is available.

Record full chain:
`literal='' -> Story -> observer raw -> observer applied -> durable scene/profile/time -> rendered UI`.

### B. One ordinary explicit action
Only if Opening passes, submit one simple social or movement action.
PASS:
- submitted actor/target/action/topic/destination preserved;
- exact identity remains unchanged when referenced;
- ordinary play is not frozen by Opening-only constraints;
- no NPC suddenly gains private-app knowledge unless PLAYER explicitly reveals it;
- four Story choices + free input remain available.

### C. Refresh / re-entry
Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- Opening/turn history reconstructs once;
- identity/current scene/private-app premise are not rewritten into company-owned provenance;
- input/choices usable.

Do NOT run the known remote S1 probe here.

## 8. Whole-canon observations — record, do not broaden

Record obvious:
- MM raw -> applied retention/drop;
- player_inner_thought invention/drop;
- Story choices vs Observer projection;
- dialogue projection drops;
- Story/current-state disagreement;
- any private-app/supernatural source leakage;
- player-facing internal CSA text only if naturally visible.

Existing MM/removal/text P2 lanes remain paused. Media/TTS remain paused.

## 9. Stop / terminal law

At first reproducible P0/P1 during live campaign:
- preserve fresh game READ ONLY;
- do not patch during campaign;
- set this same task file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires source/test/deploy gates plus exactly one fresh browser campaign passing Opening private-app source separation, one ordinary action, and refresh with no new P0/P1.

On success terminal:
`OPENING_PRIVATE_APP_PROVENANCE_SEPARATION_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

On blocker/failure terminal:
`OPENING_PRIVATE_APP_PROVENANCE_SEPARATION_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

After any deployed browser campaign, operator must perform independent whole-canon audit before next task registration.
Do not self-register the remote S1 task.

## Terminal report — 2026-08-25 KST

Result: `OPENING_PRIVATE_APP_PROVENANCE_SEPARATION_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Task ID: `company-r3-opening-private-app-provenance-separation-p1-continuation-v1`
CURRENT_TASK blob SHA: `02d02f154a8d29134d2373f41aa786e530c4387a`
Expected branch: `main`
Implementation commit: `dc99a6225bbaa3732ac53a320286fd935001b0ec`

Implemented scope:
- Split the existing Opening identity/arrival authority from the private-app provenance boundary in `runtime-r3/domain/memory.js` and `runtime-r3/server/provider.js`.
- Kept the canonical unfamiliar app player-private and passively exposable through player-local device/narrator presentation while NPC/company/HR/security/onboarding/training/general-NPC sources remain ignorant before explicit player reveal.
- Preserved stationary start, exact identity/rank/agency, ordinary-turn behavior, Story-owned four choices plus free input, Observer re-entry, and ordinary non-app company identity artifacts.
- No output filtering, app keyword parser/classifier, deterministic Opening, second Story/Observer/verifier, retry, DB/schema/RPC/migration, preserved-game mutation, Production, provider/model/config, frontend, or S1 change.

Verification:
- `node --check` for changed JS/MJS: PASS.
- `git diff --check`: PASS.
- Focused Opening/source-correction tests: 32/32 PASS.
- Broader R3 tests: 157/157 PASS.
- Full `npm.cmd test` (PowerShell `npm test` shim was policy-blocked): 583/583 PASS.
- Unchanged contract-gated TEST deploy: PASS.
- TEST API: `game-proxy-company-r3`, version `5d4a688c-8ca6-41cc-8fb0-5e56cb235b80`, source `dc99a6225bbaa3732ac53a320286fd935001b0ec`.

Fresh deployed browser campaign (exactly one disposable adult profile, READ ONLY):
- Game: `bc16b278-2aee-4b3d-abfb-bab104aedf2e`.
- Profile: `민준`, age 32, `신사업TF`, exact `TF팀장 (조율 권한)`. No preserved game was reset or modified.
- Opening chain visible in the UI: `literal='' -> Story -> committed Turn 0/rendered UI`. The UI exposed the Story-owned four choices and free input. Raw Observer payload and durable commit fields are not separate UI surfaces.
- Opening Story: first-day 1층 로비; 오세훈 identifies the player from the ordinary identity artifact and handles normal 출입증 발급. The player's phone passively shows the unfamiliar `상식개변` app; the Story explicitly says nobody else knows it, and 오세훈 does not see it. No NPC/company/HR/security/onboarding source announced, installed, distributed, recommended, recognized, explained, asked about, or substituted a generic employee app.
- Ordinary Turn 1: selected the visible second choice asking whether department/rank appear on the badge. Story advanced to normal badge/photo procedure and preserved the app as player-private; four choices and free input remained available.
- Refresh/re-entry: same game URL reconstructed committed Turn 1 once with `연결 완료`, preserved the same Story, choices, free input, and private-app isolation. No duplicate commit or new P0/P1 observed.

Terminal control commit pending: this file will be committed and pushed to `origin/main` before the Issue #68 terminal report.

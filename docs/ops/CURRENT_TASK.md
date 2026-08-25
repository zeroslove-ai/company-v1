# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-opening-identity-agency-coexistence-p1-continuation-v1
Mode: TARGETED CORE P1 — OPENING EXACT IDENTITY + PRE-LITERAL PLAYER AGENCY COEXISTENCE
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `7cc6033d938023185b14565d38637d55fc199c79`
Previous task: `company-r3-opening-exact-formal-rank-p1-correction-v1`
Previous terminal: Issue #68 `5405683085`
Operator / whole-canon review: Issue #68 `5405764133`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserve accepted exact-rank implementation: `49d12d5e2b4c939d0923c70b31823d39b6b1d13e`
Preserve accepted Opening no-invented-player-action implementation: `b719831396436913e4a0ea414064c17040cee1c5`
Preserve accepted ordinary player-movement implementation: `bd643fa026f2c1a0bcf8e3db6abf18b0294ee004`
Preserve Observer scene re-entry implementation: `ae27e7805065118657869ba90a7cf52bc3890982`
Fresh decisive evidence game: `6eb13fb7-cf0e-4192-b503-5996cd5523e4` — READ ONLY
Prior accepted Opening-agency evidence game: `e5292172-a34e-4be5-972d-a8c48e77d81a` — READ ONLY
Preserved remote-S1 evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`OPENING_IDENTITY_AGENCY_COEXISTENCE_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OPENING_IDENTITY_AGENCY_COEXISTENCE_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5405683085`
8. operator whole-canon review `5405764133`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

At minimum preserve READ ONLY:
- `6eb13fb7-cf0e-4192-b503-5996cd5523e4`
- `e5292172-a34e-4be5-972d-a8c48e77d81a`
- `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`
- all other games already marked preserved in Issue #68.

## 1. Why this task exists — exact rank fixed, Opening agency regressed

Fresh game `6eb13fb7-cf0e-4192-b503-5996cd5523e4` proves the exact-rank correction works:
- selected department: `brand_strategy`;
- selected position: `tf_lead`;
- canonical formal label: `TF팀장`;
- Story visibly establishes `브랜드전략팀 TF팀장` and does not normalize it to generic `팀장` / `신입 팀장`.

But the same Opening has `literal_action=''` and Story still authors voluntary PLAYER actions before any submitted literal:
- `한 번 심호흡을 했다`;
- `주머니를 만지는 순간`.

This is a new live regression of the already accepted `b719831...` Opening agency boundary and violates binding `P-OPENING-001` / `P-AGENCY-001`.

Read-only DB confirms the first broken boundary is Story itself. Observer later invents a player thought but runtime drops it safely; that is P2 evidence, not the cause of this P1.

The exact-rank behavior from `49d12d5...` is correct and must not be backed out.

## 2. First owning boundary / hypothesis to prove

Inspect first:
- `runtime-r3/server/provider.js`
  - `OPENING_IDENTITY_PRECEDENCE_PROMPT`;
  - `OPENING_PLAYER_AGENCY_PRECEDENCE_PROMPT`;
  - `OPENING_STORY_SYSTEM_PROMPT`;
  - `OPENING_PRODUCT_PROMPT` final composition/order;
- `runtime-r3/domain/memory.js`
  - `opening_contract` exact formal-position fields;
  - `opening_agency_contract`;
- focused Opening/player-identity/source-correction tests.

Current source has two individually correct but separate Opening directives:
1. exact formal identity must be explicitly established;
2. voluntary PLAYER action authority is empty before first literal.

The live failure shows their coexistence is not sufficiently explicit. Current trailing Opening wording also asks for a plausible immediate arrival/introduction context, and Story filled that context with PLAYER-authored bridge actions.

Required correction: make the **same final Opening Story boundary** explicitly own both facts together.

Before the first submitted literal:
- selected exact canonical name / department / formal rank are validated setup/world facts;
- first arrival / first appointment are already true setup facts, not a command to narrate PLAYER traveling, breathing, gesturing, touching, checking, acknowledging, or otherwise doing something;
- exact formal rank must be established through narrator/world presentation, company artifact/signage if naturally available, or NPC initiative/address/dialogue — not through a voluntary PLAYER action;
- the unfamiliar private app may be passively present/visible/available to notice, but no PLAYER hand/phone/app manipulation, deliberate checking, opening, tapping, pocket-touching, or decision may be invented;
- NPCs may act, speak, approach, introduce, open a door, point out a seat, hand over material, or otherwise make the Opening living and interactive;
- PLAYER remains free, silent, and without a completed voluntary action until the first actual literal/native-choice submission;
- passive state/setup descriptions are allowed only when they do not imply a chosen action (for example, being present at the validated starting scene or being the newly appointed `TF팀장`).

A small combined Opening identity+agency precedence prompt or existing-context field is allowed if it reuses the existing canonical identity and opening-agency fields. Prefer one final coherent precedence block over adding another competing independent instruction.

If source proof identifies an earlier existing boundary, fix that instead and explain in the terminal.

## 3. Preserve accepted behavior

Do not regress:
- `49d12d5...` exact canonical formal rank establishment (`TF팀장` stays exact when selected);
- selected exact department and player name;
- `b719831...` empty voluntary PLAYER action authority before first literal;
- passive unfamiliar private-app discovery without manipulation;
- NPC ignorance of private app unless PLAYER later reveals it;
- first-day / first-arrival / first-appointment semantics;
- rich living Company Opening with NPC initiative;
- Story-owned exactly four full choices + free input;
- `bd643fa...` no-invented voluntary PLAYER travel on ordinary turns;
- accepted explicit player navigation and self-stay behavior;
- `ae27e780...` Observer scene re-entry implementation;
- temporal `clock_24h` continuity;
- rule-change private-app isolation;
- official announcement ownership;
- S1 closed-world unsupported behavior;
- PLAYER sole issuer and exact S1 subject/counterparty direction;
- S7 / compatibility / exact conflict-copy accepted behavior;
- one Story + one Observer only.

Known separate P1, **not this implementation**:
- preserved game `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`, active S1 configured 서원희 -> 박정우;
- literal supported `kiss` instruction did not execute same turn while PLAYER was remote/stationary.

Do not modify S1 semantics in this task. It remains queued after Opening is jointly live-clean and no earlier P0/P1 appears.

## 4. Forbidden approaches

Do NOT add:
- post-Story regex/string repair or deletion of PLAYER-action phrases;
- a Korean action parser/classifier/NER/fuzzy detector solely to police Opening prose;
- deterministic replacement Opening story/template;
- second Story, second Observer, verifier/repair/reaction LLM;
- retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- a parallel player-identity catalog or action ontology;
- generic scene/physical/relation/consent/emotion engine;
- S1 semantic changes;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend executable changes unless directly proven necessary (not expected);
- preserved-game mutation;
- new branch/PR/task file;
- `OWNER_READY`.

## 5. Deterministic regressions

Add the smallest regressions at the actual Opening Story request/context boundary.

Required before deploy:
1. Opening context still exposes selected exact formal position label (`TF팀장` for decisive profile).
2. Exact formal-position establishment remains mandatory and cannot normalize to generic/inferred rank.
3. Opening agency remains `empty_before_first_submitted_literal`.
4. The combined/final Opening contract explicitly states that exact identity / arrival / app premise must be established without any voluntary PLAYER bridge action.
5. Exact rank can be established by narrator/world/NPC initiative/address while PLAYER remains action-free.
6. First-arrival context cannot authorize PLAYER movement, breathing/gesture, touch, phone/pocket/app manipulation, acknowledgement, decision, work, reply, or another intentional action.
7. Passive unfamiliar-app exposure remains allowed without manipulation.
8. Story-owned four-choice requirement remains explicit and unchanged; Observer must not become a choice author.
9. Ordinary-turn player identity, no-invented-travel, temporal/private-app-rule-change/official-announcement/S1 closed-world/S7/compatibility/conflict-copy/Observer-reentry focused regressions remain green.
10. No post-Story repair, second Story/Observer/verifier, or retry path exists.

Do not make tests green by scanning/replacing generated Story text.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
- broader canon/CSA/turn-kernel/navigation/Observer focused regressions;
- exactly one full `npm test` after focused green, recording exit and count.

Automated green is not product acceptance.

## 6. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

If runtime executable source changes:
- verify local/remote `main` equality after implementation;
- deploy TEST API only through the unchanged contract-gated R3 path;
- if local `psql` is unavailable and TEST contract is unchanged, Issue #68 `5404426864` may be reused only as the same approved ephemeral off-repo catalog input to the unchanged gate;
- if the unchanged gate rejects, STOP rather than weakening it;
- frontend deploy only if frontend executable source actually changes; not expected;
- record exact TEST Worker version and source SHA.

No DB write, Production, or provider/model/config change.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use the real deployed TEST frontend/UI. Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, direct gameplay API substitute, semantic retry, or sample-until-pass.
Preserve the game READ ONLY after the campaign.

Use a profile whose selected position is `TF팀장` for direct joint reproduction.
Target 2–4 committed turns. Stop at the first reproducible P0/P1.

### A. Opening — decisive joint identity+agency gate

PASS requires **simultaneously**:
- normal living first-arrival scene in the selected registered department;
- Story explicitly establishes PLAYER exact canonical formal position `TF팀장` at least once;
- no substitution/normalization to `팀장`, `신입 팀장`, another rank, or inferred title;
- canonical player name/department are not contradicted;
- no voluntary PLAYER speech, reply, breath-as-action, gesture, nod, movement, touch, phone/pocket/app manipulation, work/review, acknowledgement, decision, acceptance/refusal, or other completed intentional action before the first literal;
- validated setup facts may state PLAYER is present/newly appointed without inventing how PLAYER chose to act;
- unfamiliar private app is passively present/discoverable and NPCs remain ignorant;
- NPC initiative remains natural and the scene does not become a static dossier;
- Story itself ends with exactly four meaningful full literal choices, and free input is available.

Record exact Opening Story and full chain:
`literal='' -> Story -> observer raw -> observer applied -> durable scene/profile/time -> rendered UI`.

Do not infer PASS from durable profile alone.

### B. One ordinary player-chosen action

Only if Opening passes, submit one simple explicit social free input/native choice.

PASS:
- Story preserves the chosen actor/target/action/topic;
- PLAYER exact formal identity remains unchanged when referenced;
- ordinary PLAYER action is now allowed because it came from the literal;
- no extra invented player travel/action is inserted as a bridge;
- four Story-owned choices + free input remain available.

### C. Refresh / re-entry

Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- exact committed Opening/Turn history reconstructs once;
- selected exact identity remains unchanged;
- input/choices remain usable.

Do NOT run the known remote S1 kiss probe in this task. It is already preserved as the expected next separate P1 and must not be mixed into this implementation.

## 8. Whole-canon observations — measure, do not broaden

During the campaign record but do not fix:
- MM raw -> applied retention/drop;
- player_inner_thought invention/drop;
- Story-owned choices vs Observer/fallback choice drops;
- dialogue projection drops;
- Story/current-state disagreement;
- player-facing/internal CSA text leakage if naturally visible;
- removed/replaced-rule residue only if naturally encountered.

Fresh `6eb13fb7...` evidence already shows:
- MM retained 5/5 valid heroine entries on Opening;
- raw player thought was invented and safely dropped;
- Story omitted final four choices, Observer invented four, applied projection dropped them.
Treat these as P2 evidence unless a new earlier P0/P1 is directly proven.

Media/TTS remain paused.

## 9. Next lanes — do not pre-register

After terminal, operator must perform the mandatory independent whole-canon audit before selecting anything.

If Opening exact identity + no-preliteral-action coexistence is live-clean and no earlier P0/P1 appears, the currently known next P1 is:
`remote supported S1 same-turn execution` — exact supported `kiss` for active 서원희 -> 박정우 must actually execute in the same Story turn while PLAYER remains remote/stationary; instruction delivery/questioning alone is not execution.

After core P1 closure:
- decisive Observer re-entry live proof if still unproven;
- preserved `성기를 직접 검사 -> genital_touch` semantic-grounding if still independently failing;
- then P2 integrity: removed-rule ghosts -> MM reliability -> player-facing/internal CSA text separation;
- then image/media and TTS acceptance.

Do not mechanically register this roadmap; whole-canon audit chooses the next lane.

## 10. Stop / terminal law

Do not patch during the live campaign.
At first reproducible P0/P1:
- preserve the fresh game READ ONLY;
- record decisive chain;
- set this same task file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

On success:
- set this same file to `WAITING_REVIEW`;
- post exactly one terminal:
`OPENING_IDENTITY_AGENCY_COEXISTENCE_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`OPENING_IDENTITY_AGENCY_COEXISTENCE_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the next task. After any deployed browser campaign, operator performs `POST_LIVE_CANON_AUDIT_CONTRACT` before the next CURRENT_TASK.

## 11. Terminal report — 2026-08-25 KST

`OPENING_IDENTITY_AGENCY_COEXISTENCE_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

- Execution identity: `company-r3-opening-identity-agency-coexistence-p1-continuation-v1` + registered CURRENT_TASK blob `ae85b3a61158f1a97b1933d437ae52c69ec3ecff` + expected branch `main`.
- Lease: Issue #68 comment `5405814062`.
- Starting workflow HEAD: `cf88ea387f2c970ec165d6956ebe03814a8d6443`.
- Implementation commit: `29457bf9c7a8f00a7b8a701319c3fc73e3f8d24c` (pushed to `origin/main`).
- Changed files: `runtime-r3/domain/memory.js`, `runtime-r3/server/provider.js`, `test/r3-opening-contract.test.mjs`, `test/r3-source-correction.test.mjs`.
- Root-cause change: the existing exact-rank and pre-literal agency directives are now one combined final Opening boundary; the context also records that identity/arrival/app premise must be established without PLAYER action and that PLAYER remains silent/action-free before the first literal. No post-Story repair, parser/classifier, second Story/Observer, verifier, retry, S1 change, provider/model/config change, frontend change, DB/schema/RPC/migration change, or preserved-game mutation was made.
- Validation: changed-file syntax checks passed; `git diff --check` passed; focused R3 Opening/source/owner tests `39/39`; broader canon/CSA/turn-kernel/navigation/Observer focused tests `118/118`; exactly one full `npm test` completed `583/583` with exit `0`.
- TEST contract gate: unchanged `company-v1-action-authority` stage `stage_a`, version `2`; dry-run passed and actual gate passed.
- TEST deployment: Worker `game-proxy-company-r3`, version `edc4a3b3-68b4-499f-afad-776ce57eb290`, source implementation SHA `29457bf9c7a8f00a7b8a701319c3fc73e3f8d24c`.
- Fresh disposable game: `9601b7cc-fa1f-4410-9d66-18dc151cd28b`, adult profile `민준 / 신사업TF / TF팀장 / 32`; preserved READ ONLY after campaign. Existing preserved games, including `6eb13fb7-cf0e-4192-b503-5996cd5523e4`, were not touched.
- Decisive Opening chain: `literal=''` -> deployed Story -> rendered `이야기` region -> four Story choice lines + visible `직접 입력` textbox. Exact visible identity: `신사업TF TF팀장 민준`. The Opening also established the passive `상식개변` app premise and NPC initiative through 오세훈.
- First P1: the Story included `회사 정문에 처음 발을 들인 순간`, which authors a voluntary PLAYER arrival/movement before any submitted literal. Therefore the joint identity+agency gate failed even though exact `TF팀장` identity passed. The campaign stopped immediately; no ordinary-turn action, refresh/re-entry, S1 probe, retry, or second game was run.
- Exact captured Story evidence: `1층 로비의 자동문이 조용히 열렸다. ... 회사 정문에 처음 발을 들인 순간, 차가운 공조 바람과 함께 낯선 공간의 소음이 밀려온다. ... \"신사업TF TF팀장 민준 님이시죠? ...\" ... 주머니 속에서 낯선 진동이 느껴진다. ... **'상식개변'**이라는 이름의 그것. ...` followed by four visible choices and free input.
- Database writes: none. Migration/schema/RPC: none. Production: not accessed. Preserved evidence: unchanged and READ ONLY.
- Stop state: `WAITING_REVIEW`. Do not generate or register a next task; operator must perform the independent whole-canon review before any further lane.

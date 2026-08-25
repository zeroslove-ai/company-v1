# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-opening-exact-formal-rank-p1-correction-v1
Mode: TARGETED CORE P1 — OPENING EXACT PLAYER IDENTITY / FORMAL RANK
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `00ab1ad01a2f6b2cfec09e703adcc0778c7c6512`
Previous task: `company-r3-opening-no-invented-player-action-p1-correction-v1`
Previous terminal: Issue #68 `5405479240`
Operator / whole-canon review: Issue #68 `5405540092`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserve accepted Opening agency implementation: `b719831396436913e4a0ea414064c17040cee1c5`
Preserve accepted player-movement implementation: `bd643fa026f2c1a0bcf8e3db6abf18b0294ee004`
Preserve Observer re-entry implementation: `ae27e7805065118657869ba90a7cf52bc3890982`
Fresh decisive evidence game: `e5292172-a34e-4be5-972d-a8c48e77d81a` — READ ONLY
Preserved remote-S1 evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`OPENING_EXACT_FORMAL_RANK_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OPENING_EXACT_FORMAL_RANK_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5405479240`
8. operator whole-canon review `5405540092`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

At minimum preserve READ ONLY:
- `e5292172-a34e-4be5-972d-a8c48e77d81a`
- `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`
- all other games already marked preserved in Issue #68.

## 1. Why this task exists — fresh reproducible P1

Fresh game `e5292172-a34e-4be5-972d-a8c48e77d81a` has durable selected profile:
- department_id: `brand_strategy`
- position_id: `tf_lead`
- canonical repository position label: `TF팀장`

Opening Story nevertheless repeatedly describes PLAYER as `신입 팀장` and never establishes the exact selected canonical `TF팀장` rank.

This is lower-layer failure under already-binding identity law, not a product-law change.

Current source already says:
- `canonical_player_identity.position.name` is authoritative;
- `PLAYER_IDENTITY_CONTRACT.formal_identity_boundary` forbids replacing, normalizing, downgrading, upgrading, or inventing another formal rank/title and requires exact canonical labels when formal identity is mentioned;
- `opening_contract.selected_position` carries the exact selected position and `selected_rank_must_remain_true=true`;
- `PLAYER_IDENTITY_PROMPT` says formal position/rank is immutable and exact canonical labels must be used;
- `OPENING_PRODUCT_PROMPT` says every selected profile must preserve the selected department and rank.

Live behavior proves that this exact-rank requirement is still not sufficiently dominant/explicit at the actual Opening Story boundary.

The accepted Opening no-invented-player-action correction from `b719831...` is valid and must not be reopened or weakened.

## 2. First owning boundary / required correction

Inspect first:
- `runtime-r3/server/provider.js`
  - Opening prompt composition/order;
  - `PLAYER_IDENTITY_PROMPT`;
  - `OPENING_PRODUCT_PROMPT`;
  - existing `OPENING_PLAYER_AGENCY_PRECEDENCE_PROMPT` ordering;
- `runtime-r3/domain/memory.js`
  - `canonical_player_identity`;
  - `PLAYER_IDENTITY_CONTRACT`;
  - `opening_contract.selected_position`;
  - only if a small explicit `opening_identity_contract` or equivalent existing-context field is needed;
- focused Opening/player-identity/source-correction tests.

Hypothesis to prove or disprove:
- exact identity information is already present, but Opening-specific prompt precedence only strongly protects voluntary-action authority; the exact selected formal rank remains a later/general instruction and the Story normalizes `TF팀장` to generic `팀장`/`신입 팀장`.

Correct the smallest existing Story request boundary so that:
1. The exact selected canonical formal position label is an immutable Opening world/setup fact.
2. Opening explicitly establishes the exact canonical formal position label at least once whenever a selected formal position exists.
3. A generic or inferred title must not replace it. For the decisive profile, `TF팀장` may not be normalized to `팀장`, `신입 팀장`, another rank, or an inferred seniority label.
4. Natural first-arrival wording is allowed around the exact label, e.g. a newly arrived/first-day `TF팀장`; first-day/new-arrival adjectives must not become a different formal rank.
5. The exact selected department remains preserved as already required.
6. Later ordinary turns retain the existing general exact-identity contract; do not create a second identity system.
7. Do not solve this after generation. The Story request itself must own the correction before Observer.

A narrow Opening identity precedence prompt/structured contract is allowed if it reuses the existing canonical identity fields. Do not invent a parallel catalog or rank ontology.

If source proof identifies an earlier existing boundary, fix that instead and explain in the terminal.

## 3. Preserve accepted behavior

Do not regress:
- `b719831...` Opening voluntary PLAYER action authority is empty before first literal;
- passive unfamiliar private-app discovery without player manipulation;
- NPC ignorance of private app unless PLAYER later reveals it;
- first-day / first-arrival semantics;
- rich living Company Opening with NPC initiative;
- exactly four full Story choices + free input;
- canonical player name and department;
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
- preserved game `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`, Turn 3 remote configured pair 서원희 -> 박정우;
- literal `나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.` is canonical supported family `kiss`;
- Story stops at questioning instead of executing the kiss in the same turn.

Do not modify S1 semantics in this task. It remains queued after exact Opening identity is live-clean and no earlier P0/P1 appears.

## 4. Forbidden approaches

Do NOT add:
- post-Story regex/string replacement of `팀장` -> `TF팀장` or any title repair;
- a title/rank parser, classifier, fuzzy matcher, semantic validator, or second identity catalog;
- deterministic replacement Opening story/template;
- second Story, second Observer, verifier/repair/reaction LLM;
- retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- generic scene/physical/relation/consent/emotion engine;
- S1 semantic changes in this task;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend executable changes unless directly proven necessary (not expected);
- preserved-game mutation;
- new branch/PR/task file;
- OWNER_READY.

## 5. Deterministic regressions

Add the smallest regressions at the actual Opening Story request/context boundary.

Required before deploy:
1. Opening context/request exposes selected exact formal position label from canonical repository content, not only `position_id`.
2. Actual Opening prompt gives explicit precedence to that exact label and requires it to be established in Opening when a selected formal position exists.
3. The decisive normalization shape is explicitly forbidden at contract level: selected `TF팀장` cannot be replaced by generic `팀장` / `신입 팀장` as the player's formal rank.
4. First-day/new-arrival descriptors remain allowed around the exact rank and do not count as a new rank.
5. Selected department and player name remain exact and immutable.
6. `b719831...` Opening no-invented-player-action precedence stays dominant and green.
7. Four Story choices + free input remain unchanged.
8. Ordinary-turn player identity, no-invented-travel, temporal/private-app-rule-change/official-announcement/S1 closed-world/S7/compatibility/conflict-copy/Observer-reentry focused regressions remain green.
9. No post-Story repair, second Story/Observer/verifier, or retry path exists.

Do not make tests green by scanning/replacing generated Story text.

Then run:
- `node --check` for changed JS/MJS;
- `git diff --check`;
- focused affected tests;
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

Use a profile whose selected position is `TF팀장` for direct reproduction.
Target 2–4 committed turns. Stop at the first reproducible P0/P1.

### A. Opening — decisive exact-identity gate

PASS requires simultaneously:
- normal first arrival in the selected registered department;
- Story explicitly establishes PLAYER's exact canonical formal position label `TF팀장` at least once;
- Story does not substitute/normalize that formal position into `팀장`, `신입 팀장`, another rank, or an inferred title;
- ordinary natural wording such as first-day/newly arrived may surround `TF팀장` without changing the rank;
- canonical player name/department are not contradicted;
- unfamiliar private app remains passively present/discoverable;
- no voluntary PLAYER action is authored before first literal;
- NPC initiative remains natural;
- four meaningful full choices + free input are available.

Record the exact Opening Story and inspect identity semantically. Do not claim PASS merely because durable profile state still says `tf_lead`; Story identity must agree visibly.

### B. One ordinary player-chosen action

Only if Opening passes, submit one simple explicit social free input/native choice.

PASS:
- Story preserves the chosen action;
- PLAYER is not assigned a different formal rank/title;
- Opening identity precedence does not leak into ordinary action execution;
- `bd643fa...` ordinary no-invented-travel authority remains intact.

### C. Refresh / re-entry

Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- exact committed Opening/Turn history reconstructs once;
- selected identity shown in Story remains unchanged;
- input/choices remain usable.

Do NOT run the known remote S1 kiss probe in this task. It is already preserved as the expected next separate P1 and must not be mixed into this implementation.

For decisive turns record:
`literal -> Story -> observer raw -> observer applied -> durable scene/profile -> next context/UI`.

## 8. Whole-canon observations — measure, do not broaden

During the campaign record but do not fix:
- MM raw -> applied retention/drop;
- player_inner_thought invention/drop;
- dialogue projection drops;
- Story/current-state disagreement;
- player-facing/internal CSA text leakage if naturally visible;
- removed/replaced-rule residue only if naturally encountered.

Fresh `e5292172...` evidence already shows raw player thought invented and safely dropped on both reached turns, while MM retained 10/10 heroine entries; retain as P2 evidence only.
Media/TTS remain paused.

## 9. Next lanes — do not pre-register

After terminal, operator must perform the mandatory independent whole-canon audit before selecting anything.

If exact Opening identity is live-clean and no earlier P0/P1 appears, the currently known next P1 is:
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
`OPENING_EXACT_FORMAL_RANK_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`OPENING_EXACT_FORMAL_RANK_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the next task. After any deployed browser campaign, operator performs `POST_LIVE_CANON_AUDIT_CONTRACT` before the next CURRENT_TASK.

## 11. Terminal report — 2026-08-25 KST

Status: BLOCKED
Terminal: `OPENING_EXACT_FORMAL_RANK_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`
TASK_ID: `company-r3-opening-exact-formal-rank-p1-correction-v1`
CURRENT_TASK_BLOB_BEFORE_TERMINAL: `609fb3a26e698b435f4156e59a39965ca4ef5f1a`
EXPECTED_BRANCH: `main`
STARTING_SHA: `6c6a2f0e2c6c367bdeccfe4a8aabb8136a2dcf9c`
IMPLEMENTATION_SHA: `49d12d5e2b4c939d0923c70b31823d39b6b1d13e`
RUNNER: `company-v1-codex-watcher / WATCHER`
EXECUTION_LEASE: `5405585962`

### Result

- The narrow source correction was implemented only at the Opening Story request/context boundary.
- `runtime-r3/domain/memory.js` now exposes the exact selected formal position label and explicit Opening requirements to establish it without normalization.
- `runtime-r3/server/provider.js` now places an Opening formal-identity precedence prompt before generic Story wording. It requires the exact canonical label, forbids generic/inferred replacement, and allows first-day/new-arrival descriptors only around the exact label.
- Regressions were added in `test/r3-opening-contract.test.mjs` and `test/r3-source-correction.test.mjs`.
- No post-Story repair, title parser/classifier, deterministic Opening, second Story/Observer/verifier, retry, provider/model/config, S1 semantic, DB/migration, Production, frontend, or preserved-game change was made.

### Validation

- Focused Opening/source/owner-P0 tests: `39 passed, 0 failed`.
- Broader canon/CSA/turn-kernel/navigation/Observer regressions: `118 passed, 0 failed`.
- Exactly one full `npm.cmd test`: `583 passed, 0 failed`.
- Syntax checks and `git diff --check`: passed.

### TEST / live blocker

- TEST API was deployed only through the unchanged contract-gated R3 path from `49d12d5e2b4c939d0923c70b31823d39b6b1d13e`.
- Worker: `game-proxy-company-r3`; version: `4006b70f-25a4-4f6e-ab9f-d6fad19f425f`; frontend source unchanged and not deployed.
- Exactly one fresh disposable adult-profile game was created: `6eb13fb7-cf0e-4192-b503-5996cd5523e4`. It is preserved READ ONLY; no second game, reset, retry, regeneration, or direct gameplay API substitute was used.
- Opening exact-rank gate: PASS for visible canonical `브랜드전략팀 TF팀장`; the Story established `TF팀장` and did not normalize it to `팀장` or `신입 팀장`.
- First P1 blocker at the earlier Story boundary: before any submitted literal (`literal_action=''`), the Opening authored PLAYER actions in `출입문 앞에 선 나는 ... 한 번 심호흡을 했다.` This regresses the accepted no-invented-player-action boundary from `b719831396436913e4a0ea414064c17040cee1c5` and violates the current Opening contract.
- The campaign stopped at that first P1. No ordinary player action or refresh/re-entry lane was run. The captured Story/UI and game identity are the decisive evidence; no later lane is claimed green.
- Observer raw/applied and durable chain were not used to override the first broken Story boundary. The game remains preserved READ ONLY.

### Required stop

Await the mandatory independent `POST_LIVE_CANON_AUDIT_CONTRACT` review. Do not register or select the next task, and do not reopen the accepted agency implementation except through the next owner-authorized task.

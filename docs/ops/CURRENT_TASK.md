# Company — CURRENT TASK

Status: READY
Task ID: company-r3-opening-stationary-start-anchor-p1-continuation-v1
Mode: TARGETED CORE P1 — OPENING PRE-LITERAL STATIONARY START / EXACT IDENTITY PRESERVATION
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `d1fca0e3ef0e6aac89e517b4b8c1b28279d37e2a`
Previous task: `company-r3-opening-identity-agency-coexistence-p1-continuation-v1`
Previous terminal: Issue #68 `5406026906`
Operator / whole-canon review: Issue #68 `5406054484`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserve joint identity+agency implementation: `29457bf9c7a8f00a7b8a701319c3fc73e3f8d24c`
Preserve exact-rank implementation: `49d12d5e2b4c939d0923c70b31823d39b6b1d13e`
Preserve accepted Opening no-invented-player-action implementation: `b719831396436913e4a0ea414064c17040cee1c5`
Preserve ordinary player-movement implementation: `bd643fa026f2c1a0bcf8e3db6abf18b0294ee004`
Preserve Observer scene re-entry implementation: `ae27e7805065118657869ba90a7cf52bc3890982`
Fresh decisive evidence game: `9601b7cc-fa1f-4410-9d66-18dc151cd28b` — READ ONLY
Prior decisive evidence game: `6eb13fb7-cf0e-4192-b503-5996cd5523e4` — READ ONLY
Prior accepted Opening-agency evidence game: `e5292172-a34e-4be5-972d-a8c48e77d81a` — READ ONLY
Preserved remote-S1 evidence game: `f235369d-ae36-46fe-abfa-3e4a1d0e65c1` — READ ONLY
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Operator-approved TEST catalog artifact: Issue #68 `5404426864`

Success terminal:
`OPENING_STATIONARY_START_ANCHOR_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`OPENING_STATIONARY_START_ANCHOR_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

Work on `main` only. Reuse this exact `docs/ops/CURRENT_TASK.md` path in place.

Mandatory read order before implementation:
1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
7. terminal `5406026906`
8. operator whole-canon review `5406054484`
9. this CURRENT_TASK.

Preserve A′/R3 exactly: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.

Do NOT create a new branch, ops branch, PR, CURRENT_TASK file, report-only branch, or task file.
Do NOT access Production.
Do NOT mutate/reset/retry any preserved evidence game.

At minimum preserve READ ONLY:
- `9601b7cc-fa1f-4410-9d66-18dc151cd28b`
- `6eb13fb7-cf0e-4192-b503-5996cd5523e4`
- `e5292172-a34e-4be5-972d-a8c48e77d81a`
- `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`
- all other games already marked preserved in Issue #68.

## 1. Why this task exists — combined prompt still reenacts PLAYER arrival

Implementation `29457bf...` correctly unified the Opening formal-identity and pre-literal agency directives and preserved the selected exact rank.

Fresh game `9601b7cc-fa1f-4410-9d66-18dc151cd28b` proves the identity portion:
- selected department: `new_business_tf` / `신사업TF`;
- selected position: `tf_lead` / `TF팀장`;
- Story visibly says `신사업TF TF팀장 민준`.

But the same Opening has `literal_action=''` and begins:
- `1층 로비의 자동문이 조용히 열렸다.`
- `회사 정문에 처음 발을 들인 순간...`

That is a completed voluntary PLAYER arrival/movement before any submitted literal. Observer then summarizes `민준이 ... 첫 출근하여 들어섰다` and durable `scene_note` commits `민준이 ... 처음 도착했다`.

This remains a P1 violation of binding `P-OPENING-001` / `P-AGENCY-001`.

The fix is NOT to add a post-Story filter or a larger list of Korean movement phrases. The missing positive boundary is that Opening must start after the arrival transition is already complete.

## 2. First owning boundary / hypothesis to prove

Inspect first:
- `runtime-r3/domain/memory.js`
  - `buildStoryContext(...)` Opening fields;
  - current canonical scene/location available before Story;
  - `opening_contract` and `opening_agency_contract`.
- `runtime-r3/server/provider.js`
  - `OPENING_IDENTITY_AGENCY_PRECEDENCE_PROMPT`;
  - `OPENING_STORY_SYSTEM_PROMPT`;
  - `OPENING_PRODUCT_PROMPT` final composition/order.
- focused Opening/player-identity/source-correction tests.

Current source says first arrival is a validated setup fact and player action authority is empty, but the trailing first-arrival wording still invites Story to dramatize the transition itself. Live evidence proves the model turns that setup fact into threshold-crossing prose.

Required correction: add one bounded **Opening stationary-start scene anchor** at the existing pre-Story context/prompt boundary, using existing canonical scene/location state rather than inventing a new world model.

At Story start before the first literal:
- PLAYER is already physically present in the canonical starting registered location from current state;
- that presence is a validated setup/world fact, not the result of a Story-authored action;
- `first_arrival_at_company` / first appointment mean this is the first-day context, but the arrival transition itself is already complete before Story begins;
- Story begins at the first world/NPC beat **after** PLAYER presence is established;
- Story must not reenact PLAYER crossing a threshold, entering, arriving, walking in, approaching, standing up, following, moving to the desk, or another voluntary bridge transition before the first literal;
- exact selected identity/rank may be established by narrator/world artifact/NPC address or initiative while PLAYER remains stationary/action-free;
- NPCs and world may act normally around PLAYER;
- passive perception is allowed; voluntary PLAYER action is not.

Prefer a small structured field such as an existing-context `opening_scene_anchor` derived from current canonical scene, e.g. bounded semantics equivalent to:
- `starting_location_id/name` from current canonical state/content;
- `player_presence_is_preexisting_setup_fact=true`;
- `arrival_transition_already_complete=true`;
- `story_begins_after_arrival_transition=true`;
- `voluntary_player_transition_before_first_literal=false`;
- `first_story_beat_authority='world_or_npc_initiative'`.

Names are illustrative; use the smallest existing shape that fits the codebase.

Do NOT add a second scene authority or generic navigation engine. This is presentation/context grounding only.

Also inspect whether `show the player discovering or recognizing` or similar Opening wording unnecessarily invites deliberate PLAYER manipulation. Preserve the canon premise that the unfamiliar app is privately possessed and can be passively noticed, but phrase the boundary so no phone/pocket/app manipulation is required to establish it. Do not invent an installer/provenance as a fact beyond canon.

If source proof identifies an earlier existing boundary, fix that instead and explain in the terminal.

## 3. Preserve accepted behavior

Do not regress:
- `29457bf...` combined exact identity + agency precedence;
- exact canonical formal rank establishment: `TF팀장` remains exact when selected;
- canonical player name and department;
- empty voluntary PLAYER action authority before first literal;
- first-day / first-appointment semantics;
- passive unfamiliar private-app discovery without PLAYER manipulation;
- NPC ignorance of the private app unless PLAYER later reveals it;
- rich living Company Opening with NPC/world initiative;
- Story-owned exactly four full choices + free input;
- ordinary-turn player agency and explicit player navigation;
- `bd643fa...` no invented voluntary PLAYER travel on ordinary turns;
- `ae27e780...` Observer scene re-entry behavior;
- temporal `clock_24h` continuity;
- rule-change private-app isolation;
- official announcement ownership;
- S1 closed-world unsupported behavior;
- PLAYER sole issuer and exact S1 subject/counterparty direction;
- S7 / compatibility / exact conflict-copy accepted behavior;
- one Story + one Observer only.

Known separate P1, NOT this implementation:
- preserved game `f235369d-ae36-46fe-abfa-3e4a1d0e65c1`, active S1 configured 서원희 -> 박정우;
- supported remote/stationary S1 `kiss` instruction failed to execute in the same Story turn.

Do not modify S1 semantics here. It stays queued after Opening is live-clean unless a newer earlier P0/P1 appears.

## 4. Forbidden approaches

Do NOT add:
- post-Story regex/string deletion or repair of movement phrases;
- Korean action parser/classifier/NER/fuzzy detector to police generated Opening prose;
- deterministic replacement Opening story/template;
- hard-coded one-location Opening prose;
- a second durable scene/location authority;
- second Story, second Observer, verifier/repair/reaction LLM;
- retry/regeneration/sample-until-pass;
- provider/model/temperature/token/secret/config workaround;
- generic scene/physical/relation/consent/emotion engine;
- S1 semantic changes;
- DB/schema/RPC/migration/backfill;
- Production;
- frontend executable changes unless directly proven necessary (not expected);
- preserved-game mutation;
- new branch/PR/task file;
- `OWNER_READY`.

## 5. Deterministic regressions

Add the smallest regressions at the real Opening Story request/context boundary.

Required before deploy:
1. Opening context contains the exact canonical starting registered location from the current state/content.
2. The final Opening contract says PLAYER is already present there as a preexisting setup fact when Story begins.
3. The final Opening contract says the arrival transition is already complete before Story generation and must not be reenacted as PLAYER movement.
4. `literal_action=''` still means voluntary PLAYER action authority is empty.
5. Exact formal position label (`TF팀장` for decisive profile) remains mandatory and exact.
6. Identity/first-day/app premise can be established through narrator/world/NPC initiative while PLAYER remains stationary/action-free.
7. Passive unfamiliar-app exposure remains allowed without PLAYER handling/checking/opening/tapping/pocket/phone manipulation.
8. Ordinary turns are NOT frozen: once a literal explicitly chooses movement/action, existing ordinary agency/navigation behavior remains unchanged.
9. Story-owned four-choice requirement remains unchanged; Observer is not a choice author.
10. Temporal/private-app rule-change/announcement/S1 closed-world/S7/compatibility/conflict-copy/Observer-reentry focused regressions remain green.
11. No post-Story repair, parser classifier, second Story/Observer/verifier, or retry path exists.

Tests must verify the actual request/context/prompt contract, not fake success by scanning/replacing generated Story output.

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

### A. Opening — decisive stationary-start + identity gate

PASS requires simultaneously:
- normal living first-day scene in the canonical registered starting location;
- Story begins with PLAYER already present there; it does not narrate the PLAYER's threshold crossing/arrival/walk into that location as an action;
- Story explicitly establishes exact canonical formal position `TF팀장` at least once without normalization;
- canonical player name/department are not contradicted;
- no voluntary PLAYER speech, reply, breath-as-action, gesture, nod, movement, touch, phone/pocket/app manipulation, work/review, acknowledgement, decision, acceptance/refusal, or other completed intentional action before the first literal;
- first-day/first-appointment are clear setup facts without reenacting PLAYER arrival;
- unfamiliar private app is passively present/discoverable and NPCs remain ignorant;
- NPC/world initiative remains natural and the scene does not become a static dossier;
- Story itself ends with exactly four meaningful full literal choices, and free input is available.

Record exact chain:
`literal='' -> Story -> observer raw -> observer applied -> durable scene/profile/time -> rendered UI`.

Specifically compare Story's first physical beat with the pre-Story canonical scene location and confirm no PLAYER transition was invented.

### B. One ordinary explicit action

Only if Opening passes, submit one simple explicit social or movement free input/native choice.

PASS:
- now the submitted PLAYER action is allowed and actually preserved;
- actor/target/action/topic/destination are not substituted;
- PLAYER exact formal identity remains unchanged when referenced;
- no additional unchosen PLAYER bridge action is inserted;
- four Story-owned choices + free input remain available.

This proves the stationary anchor is Opening-only and does not freeze ordinary play.

### C. Refresh / re-entry

Only if no P0/P1:
- one deliberate refresh/re-entry;
- no duplicate Story/Commit;
- exact committed Opening/Turn history reconstructs once;
- selected exact identity and current scene remain unchanged;
- input/choices remain usable.

Do NOT run the known remote S1 kiss probe in this task. It is already preserved as a separate P1 and must not be mixed into this implementation.

## 8. Whole-canon observations — measure, do not broaden

During the campaign record but do not fix:
- MM raw -> applied retention/drop;
- player_inner_thought invention/drop;
- Story-owned choices vs Observer/fallback choice drops;
- dialogue projection drops;
- Story/current-state disagreement;
- player-facing/internal CSA text leakage if naturally visible;
- removed/replaced-rule residue only if naturally encountered.

Fresh `9601b7cc...` evidence already shows:
- MM absent on the one reached Opening turn;
- raw player_inner_thought was invented and safely dropped;
- Story authored four choices and applied projection retained them.

Treat these as P2 observations unless a new earlier P0/P1 is directly proven.

Media/TTS remain paused.

## 9. Next lanes — do not pre-register

After terminal, operator must perform the mandatory independent whole-canon audit before selecting anything.

If Opening stationary-start + exact identity is live-clean and no earlier P0/P1 appears, the currently known next P1 is:
`remote supported S1 same-turn execution` — exact supported `kiss` for active 서원희 -> 박정우 must actually execute in the same Story turn while PLAYER remains remote/stationary; instruction delivery/questioning alone is not execution.

After core P1 closure, whole-canon audit decides among remaining scene/Observer/S1 semantic-grounding and then P2 integrity:
- removed-rule ghosts;
- MM reliability;
- player-facing/internal CSA text separation;
- then media/TTS acceptance.

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
`OPENING_STATIONARY_START_ANCHOR_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`OPENING_STATIONARY_START_ANCHOR_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the next task. After any deployed browser campaign, operator performs `POST_LIVE_CANON_AUDIT_CONTRACT` before the next CURRENT_TASK.

# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-integrated-main-utf8-safe-live-acceptance-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Accepted predecessor

Previous task: `integrate-reviewed-runtime-tooling-repairs-v1`
Accepted terminal: Issue #68 comment `5322257225`
Classification: `REVIEWED_RUNTIME_TOOLING_REPAIRS_INTEGRATED_MAIN`
Reviewed source integration commit: `e0aa771f5bb8f302e45cd011710563d04a6f21dc`
PR: `#76`
Merged main SHA: `43aa03cf645a2e1a2cae3e0283d2e485170db021`
PR exact-head CI: `32087839878` SUCCESS
Post-merge main CI reported: `32087904640` SUCCESS

Operator independently verified PR #76 is merged and `main` is exactly identical to `43aa03cf645a2e1a2cae3e0283d2e485170db021`.

The previous UTF-8 probe also proved exact Korean survives request-side Node value -> HTTP JSON -> Worker -> reservation -> `game_actions` -> Commit -> `game_turns`. The earlier 15-turn `?` session is invalid semantic evidence because its ad-hoc runner corrupted free-text before product transport.

This task performs the first full player-style TEST acceptance on the integrated main using an explicitly UTF-8-safe input path.

## 1. Frozen lineage and environment

Repository: `zeroslove-ai/company-v1`
Required base main: `43aa03cf645a2e1a2cae3e0283d2e485170db021`
Expected branch: `company/test-integrated-main-utf8-safe-live-acceptance-v1`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
TEST API Worker: `game-proxy-company-v1`
TEST frontend Worker: `gamebuilder-company-v1`
API URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
Frontend URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`

At registration the current TEST Workers are older deployments and must be replaced by builds from exact accepted main before live acceptance.

Preserve and never reset/write/reuse these evidence games:
- `1cb25cc3-7e7e-4dcf-b0f3-b54e1338eb20` — prior 15-turn corrupted-input evidence
- `78bb312e-4d66-4ee6-acde-7c3fe58c4136` — UTF-8 fidelity probe
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` — earlier disposable acceptance evidence
- `78fb1d94-266f-455a-bda4-7656cc2370c1` — preserved manual QA
- protected/sentinel/QA games and all other previously preserved evidence games

Production/hospital-v2 remains forbidden.

## 2. Preflight — no schema/history mutation

Before deployment:
1. Fresh-fetch and require `main == 43aa03cf645a2e1a2cae3e0283d2e485170db021`.
2. Verify this branch is exactly one docs-only registration commit ahead of that main.
3. Re-read terminal `5322257225`, UTF-8 terminal `5321824525`, and this exact CURRENT_TASK blob.
4. Run full repository tests, changed/current JS syntax checks as appropriate, and `git diff --check`.
5. Run current Action Stage B and Scene Stage B contract gates against TEST read-only.
6. Re-prove effective TEST DB contract is already current. Do not use migration filename/history mismatch as a reason to mutate the ledger.

Hard DB rules:
- no migration apply;
- no migration repair;
- no broad `supabase db push`;
- no DDL/schema/history write;
- if effective runtime DB contract is not current, STOP `BLOCKED_TEST_EFFECTIVE_DB_CONTRACT` with exact evidence.

## 3. Deploy exact accepted main to TEST

If preflight passes, deploy exact `43aa03cf645a2e1a2cae3e0283d2e485170db021` source to:
- TEST API Worker `game-proxy-company-v1`;
- TEST frontend Worker `gamebuilder-company-v1`.

Record both new Worker version IDs and prove the deployment source lineage is exact accepted main, not this docs-only branch lifecycle commit.

After deploy:
- run corrected API smoke with an explicit disposable TEST game UUID, never the protected sentinel;
- run corrected frontend transitive-asset smoke;
- verify Company edition/binding identity;
- do not mutate preserved games for smoke.

## 4. Create one fresh disposable Level-7 TEST game

Create exactly one new disposable Company TEST game through the normal current setup/opening path.

Prepare that newly created game at Level 7 / EXP 0 using the already-established TEST-only fixture seam if required for CSA coverage. This is the only direct TEST data fixture mutation allowed in this task.

Do not reset any existing game. Record:
- new game ID;
- setup ID/action identity if applicable;
- initial committed turn/save revision;
- initial Level/EXP;
- initial location/presence;
- initial active rules/CSA state.

If Level-7 preparation cannot be performed without broad schema/runtime changes, STOP rather than modifying Production architecture.

## 5. Mandatory UTF-8-safe live runner boundary

The live session must not reuse the shell/text-construction path that produced literal `?` bytes.

For every free-text Korean player action:
- construct the JavaScript value from an ASCII-safe source representation such as JS `\uXXXX` escapes or equivalent byte-safe method;
- use Node `fetch` + `JSON.stringify` directly;
- do not paste Korean source literals through PowerShell/cmd command arguments;
- record the request-side exact string and expected UTF-8 bytes before sending;
- after Commit, verify exact `player_action` text/UTF-8 bytes in `game_actions` and `game_turns` for every free-text turn.

If any free-text action differs byte-for-byte at persistence, immediately STOP `BLOCKED_LIVE_INPUT_UTF8_FIDELITY_REGRESSION`. Do not classify gameplay/provider semantics from that session.

Do not build or commit a new large harness. A temporary ASCII-only Node runner outside the repo is allowed. If a maintained repo harness itself is used, do not modify it in this task.

## 6. One coherent 15–20-turn player-style session

Run one natural session through the real Story -> Extract -> Commit/readback path.

Rules:
- 15–20 committed gameplay turns total after Opening/setup;
- exactly one provider attempt per gameplay action;
- no regenerate-until-pass;
- no stochastic retries to hide an ugly turn;
- no reset;
- use a mix of clicked choices and UTF-8-safe free text;
- inspect DB evidence for suspicious turns rather than judging UI prose alone.

Required scenario coverage across the one coherent session:

1. Opening + normal choices
   - prove committed choice identity/readback is coherent;
   - no stale Opening choice fallback after later turns.

2. Literal free-text agency
   - issue at least two exact Korean free-text actions;
   - verify actor/target/directionality are not silently changed;
   - byte-verify persisted `player_action` before any semantic conclusion.

3. Non-work/personal conversation
   - intentionally move away from work-report/onboarding language;
   - observe whether Story compulsively snaps back to work despite the player's valid action.

4. Cross-location movement
   - request a registered destination explicitly;
   - verify Story movement, Extract scene evidence, committed canonical `scene.location_id`, and next-turn context/readback agree.
   - a location change unsupported by exact current Story scene evidence must be flagged separately from a Story refusal/non-movement.

5. Registered-NPC handoff
   - perform same-location or registered-location handoff to another known NPC;
   - verify canonical presence/focal state and next-turn context; remote speaker alone must not create presence.

6. Clothing CSA
   - activate/exercise at least one exact clothing CSA;
   - verify Story result and four-slot durable clothing state agree immediately for the correct subject scope;
   - confirm unrelated subjects are not mutated.

7. Active on-request/narrative CSA versus unrelated agency
   - exercise one in-force CSA request;
   - separately issue an unrelated ordinary action;
   - verify CSA applicability does not become blanket obedience/consent/permission.

8. Adult intimate/physical progression
   - where current adult game state naturally permits, issue direct player actions sufficient to test same-turn progression and exact Story-grounded physical/player state updates;
   - player input is intent/attempt, not durable success;
   - durable physical/sexual state must require Story-established evidence;
   - do not use this scenario to add or infer a new consent engine or finite action grammar.

9. Memory/summary depth
   - continue beyond six committed turns;
   - establish one early promise/fact and revisit it later;
   - inspect `turn_summary`, committed context projection, and continuity rather than relying on prose impression alone.

10. Presentation sidecars/recovery
   - image/TTS/media failure, if any, must not invalidate a valid Story/Commit;
   - perform one refresh/context/history/readback check and verify committed state parity.

## 7. Evidence and defect classification

For each turn retain enough evidence to distinguish:
- exact player action / selected choice;
- raw Story;
- parsed Story blocks/choices/THOUGHT as available;
- raw Extract envelope if available;
- normalized/persisted Extract;
- `game_actions` status/structured action;
- committed `game_turns` row;
- canonical save scene/physical/clothing/player state;
- relevant context/readback for the next turn.

Classify findings only after source/DB evidence:
- player literal/choice authority;
- Story prompt/context quality;
- scene/location/presence;
- CSA scope/premise;
- physical/clothing/player-state writer;
- Extract evidence/normalization;
- Commit/persistence;
- memory/summary;
- frontend/readback/presentation sidecar;
- pure nondeterministic provider quality.

Important: do not introduce or recommend a semantic regex gate merely because a provider turn is poor.

If a state-corrupting P0/P1 occurs, preserve the game and STOP the session. If a non-state-corrupting quality issue occurs, record it and continue enough turns to establish whether it is materially recurrent.

## 8. No source repair in this task

This is an acceptance/evidence task, not a repair task.

Do not modify runtime/source/tests/config/migrations based on live findings. Do not create a new semantic router/verifier/gateway, retry layer, consent matrix, finite physical grammar, relation/event ledger, generic CSA DSL, provider/model swap, or prompt hotfix here.

A proven product defect will be reviewed and receive its own bounded next CURRENT_TASK.

## 9. Hard prohibitions

- Production or hospital-v2 access/change
- reset/reuse of preserved games
- DB schema/DDL/migration/history write
- `supabase db push` / migration repair
- provider/model/TTS/binding change
- source/runtime/test/config changes other than CURRENT_TASK lifecycle evidence
- Cut3 implementation
- retries/regeneration to obtain a passing semantic result
- conclusions based on corrupted player input

## 11. Terminal evidence — 2026-08-18

Terminal classification: `LIVE_ACCEPTANCE_PRODUCT_DEFECT_FOUND`

The exact accepted main `43aa03cf645a2e1a2cae3e0283d2e485170db021` was deployed to TEST before the live run:

- API Worker version: `1b095790-eb05-437f-8009-f3b10fca26ae`
- frontend Worker version: `06b1cc87-77ec-4fd2-add3-10d1ad226311`
- corrected API and frontend transitive-asset smokes passed
- repository gates passed before deploy: full `npm test` 342/342, syntax 133/133, `git diff --check`, Action Stage B, Scene Stage B, and effective TEST DB contract read-only check

Fresh disposable TEST game (created exactly once through the normal named create RPC; no preserved game was touched):

- game: `16184902-7415-468b-a276-dae291c6c74c`
- setup: `c3beb9ec-42f3-409a-8287-a8c495cedcac`
- initial fixture: Level 7 / EXP 0, committed turn 0, save revision 0, office scene, no active CSA
- final read-only DB count: 20 `game_actions` rows and 20 active `game_turns` rows, expected turns 1–20, all 20 actions `committed`; final save committed turn 20 / revision 22 / Level 7 / EXP 3
- final scene: `employee_lounge`, present NPC `heroine3`; final active rule `csa_17`; final `npc_scene_state` remained `{}` and `player_sexual_state.arousal` remained `0`
- evidence artifact: `C:/Users/JAEWAN/AppData/Local/Temp/company-v1-integrated-main-live-acceptance-16184902.json`
- evidence SHA-256: `23bd6f8d5bb5b4e8546cfe65ac3f8b3030fb9767b7cbf23495519ae393d40c76`

Live acceptance details:

- one coherent 20-committed-turn session after setup/opening; 20 provider attempts, no provider retries/regeneration, no reset calls
- every free-text action used ASCII-only JS code-point construction plus Node `fetch`/`JSON.stringify`; every turn's `game_actions.player_action` and `game_turns.player_action` matched the intended value exactly; UTF-8 parity was 20/20
- opening returned four choices and turn 1 persisted the selected literal; personal/non-work conversation passed at turns 2 and 10; cross-location movement passed at turn 16 (`employee_lounge` Story/readback agreement); continuity beyond six turns and next-day promise revisit passed
- turn 6 handoff request had no canonical structured handoff/presence transition, so it is unproven and is not promoted to a semantic pass from prose alone
- turn 12 physical attempt did not produce Story-established durable sexual success; unchanged sexual state is not classified as a defect
- at turn 17, TEST-only `app-validate` produced canonical clothing CSA `csa_17` with required state `underwear_bottom: removed` and `subject_scope: female_employee`; the structured action persisted and `csa_active/csa_rules` became active
- defect: on turns 19–20, `heroine3` was again present, but `npc_scene_state[heroine3]` was still absent and no exact four-slot clothing durable state was written; Story described ordinary neat work clothing rather than the required clothing premise. This is a valid physical/clothing-state writer and CSA-scope product defect, not a UTF-8 or provider-input failure.

Safety/write counters:

- Production access: 0
- preserved-game mutations/resets/reuse: 0
- TEST disposable game creations: 1
- TEST reset calls: 0
- migrations/DDL/history writes: 0
- provider/model changes: 0
- retries/regenerations: 0

Action IDs in scenario-step / committed-turn order are recorded in the artifact: `e62856c8-df81-4274-bdd5-b3a1661fabbe`, `1c34dacc-c49a-48ad-8086-a3f734092a29`, `8d374a27-407a-42ea-821e-611b1f926b17`, `73159916-a6ee-44dd-8d5a-ebd3582222e0`, `3c43833b-e816-4266-999d-047e2bc9a807`, `3b8f026c-249b-4d1c-8339-b673c58c87f5`, `52b5d705-149e-4c53-a717-2192f67b0aba`, `8d4638b9-72de-421f-8e27-01879437cae9`, `65a6aa5e-af77-4b0c-a5a9-d02a74711864`, `edd4ac79-8370-43ca-8e55-7280a072b1e1`, `f2de7069-700a-48a3-888d-62daf065d5b8`, `7e7c3135-3e6b-4bad-a216-71535ed8ff12`, `f5fcf866-3b8b-4542-bdab-a240a5512b02`, `580267fd-7ec8-41a7-9a19-ececd1812b25`, `78acdec7-d9d0-4202-93c1-7c78bafe49f0`, `3ba37f66-0da8-4f22-af76-ef4060629f20`, `5ef96dcd-37c1-40a8-a343-23d2f6f382af`, `34fc8179-19c8-4d14-9ddc-295c8bda93a9`, `8beb630e-1f22-4806-8096-2930572bdafa`, `8d3f9673-74e9-46f6-96c6-76ac7da43ca3`.

## 10. Terminal states

Success:
`UTF8_SAFE_INTEGRATED_MAIN_LIVE_ACCEPTED`

Product defect with valid evidence:
`LIVE_ACCEPTANCE_PRODUCT_DEFECT_FOUND`

UTF-8 regression:
`BLOCKED_LIVE_INPUT_UTF8_FIDELITY_REGRESSION`

TEST effective-DB mismatch:
`BLOCKED_TEST_EFFECTIVE_DB_CONTRACT`

Infrastructure/lineage blocker:
`BLOCKED_TEST_LIVE_ACCEPTANCE_INFRASTRUCTURE`

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, deployed main SHA, Worker version IDs, new disposable game/setup IDs, exact turn count, per-scenario findings, UTF-8 byte-fidelity proof, relevant DB/action/turn/save evidence, test/gate/smoke results, defect classification if any, and all safety/write/reset/retry counts;
3. STOP. Do not self-repair and do not start Cut3.

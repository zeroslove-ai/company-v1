# Company v1 — CURRENT TASK

Status: WAITING_USER_LIVE_ACCEPTANCE
Task ID: user-live-spine-integrity-test-rollout-handoff-v1
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place on `main`. Do not create a new CURRENT_TASK file. Do not create a new ops/task-registration branch.

## 0. Owner decision / accepted source

The owner review accepted the 25-turn spine-integrity source cut after two correction rounds.

Accepted source evidence:

- prior task: `user-live-25turn-spine-integrity-v1`
- accepted Issue #68 review comment: `5337894424`
- PR: `#85`
- exact reviewed PR head: `a762bf2bd69c26bc73d6c9b9520916c50f5968f4`
- final correction source head: `d1d60ef51f8710d8c23ad8a0fa2f626e5809104f`
- exact-head CI: `32219080664` SUCCESS
- reported focused validation: `44 PASS / 0 SKIP / 0 FAIL`
- reported full validation: `371 PASS / 0 SKIP / 0 FAIL`
- merge method: squash
- merged main source commit: `c050a192587699e7856bb43c1d8fae7dce3a1fd0`

The accepted cut covers the live defects found in the preserved 25-turn game, including:

- field-local Extract fail-open instead of whole-observation erasure;
- committed Mind Monitor readback and player-only `[THOUGHT]`;
- deletion of zombie sexual numeric/event UI;
- retained narrow physical/clothing continuity only;
- same-turn deterministic clothing projection;
- bounded CSA/regulation narration and meaningful same-turn progression guidance;
- registered same-location coworkers in scene bootstrap without anonymous replacement witnesses;
- explicit NPC exit continuity across later same-location target navigation;
- deterministic committed-situation media hint and reachable image families;
- deterministic `HH:mm` Story time projection;
- current-primary TTS and stale prior-turn in-flight cancellation;
- compact high-intensity vocal/breath/body reaction Story guidance.

This task is **rollout + structural verification + fresh manual acceptance handoff only**. Do not add another gameplay feature or semantic cut.

## 1. Frozen registration and start gate

Use the exact `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA` from the latest Issue #68 `CURRENT_TASK_READY` comment for this Task ID.

At execution start:

1. fresh-fetch `origin/main`;
2. require exact registration main SHA and blob;
3. require the delta from merged source commit `c050a192587699e7856bb43c1d8fae7dce3a1fd0` to registration main to be **only** this reused `docs/ops/CURRENT_TASK.md`;
4. independently verify PR #85 is MERGED and its reviewed head was exactly `a762bf2bd69c26bc73d6c9b9520916c50f5968f4`;
5. verify no executable source/config/content/migration drift appeared after the accepted merge;
6. if any unexpected drift exists, STOP `BLOCKED_SPINE_ROLLOUT_DRIFT`.

Execution branch/worktree rule:

- execute from `main` only;
- do not create a new implementation branch;
- do not create a new ops branch;
- do not create a new PR;
- no source/test/content/migration edits are authorized in this rollout lease.

## 2. Environments and immutable evidence

TEST Supabase project only:

`fmcrspgxstsmxxsmkeee`

TEST Workers:

- API: `game-proxy-company-v1`
- Frontend: `gamebuilder-company-v1`
- public frontend base: `https://gamebuilder-company-v1.zeroslove.workers.dev`

Never access or deploy Production/hospital-v2.

Preserve all historical/manual evidence. In particular, never reset/reseed/mutate:

- `587de547-8bb7-4a92-a7c2-07f2831e2d38` — 25-turn owner evidence game;
- `9755b57b-5cbb-44dd-a624-020fe516c16d` — prior 33-turn evidence;
- `78fb1d94-266f-455a-bda4-7656cc2370c1` — prior manual evidence;
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` — dedicated Level-7 TEST template; read-only for this task.

The guarded fresh fixture writer may read the dedicated template but must not reset or mutate it.

## 3. Pre-deploy verification

Before deployment:

1. verify registration main executable source equals the accepted merged source; the only post-merge delta may be `docs/ops/CURRENT_TASK.md`;
2. run the relevant full test suite on the registration main and require zero failures and zero skips unless a newly discovered skip is separately explained and STOPped for review;
3. run syntax checks and `git diff --check`;
4. verify no new migration needs application. This task has **no DB schema/migration write**;
5. verify current TEST Worker identities/versions before changing them and report them in terminal evidence.

Do not change provider/model settings to obtain a passing rollout.

## 4. Exact-main TEST deployment

Deploy the accepted registration-main executable to TEST only.

### API Worker

Deploy `game-proxy-company-v1` from the exact registration-main source. Record:

- deployed Worker Version ID;
- deployment/source commit identity;
- health/version response;
- `edition_id=company-v1`.

### Frontend Worker

Deploy `gamebuilder-company-v1` from the exact registration-main source. Record:

- deployed Worker Version ID;
- deployment/source commit identity;
- public root response.

No Production deployment.

If automatic deployment tooling is delayed or ambiguous, a normal explicit TEST `wrangler deploy` from the verified exact main is allowed. Never deploy from an unverified dirty worktree.

## 5. Read-only structural/API smoke after deployment

Perform only bounded read-only smoke that cannot advance gameplay.

Required checks:

1. API health/version returns HTTP 200 and `company-v1` identity;
2. frontend root loads successfully;
3. existing preserved manual evidence game is readable but remains byte/row-count unchanged by this task;
4. image catalog remains populated and active for core heroines;
5. image route/selector can read a representative heroine3 general request and a representative heroine3 sex/penetration-family request without mutating gameplay state; the sex request must not silently fall back because `penetration` is unreachable;
6. committed-context/readback route remains structurally readable;
7. no stale sexual numeric UI contract is reintroduced in the deployed frontend bundle/source;
8. no automated Story/Opening/Extract/Commit/player-action call is permitted on the new manual game.

TTS note:

- Company frontend/API queue/caller changes from PR #85 are in scope for deployment;
- the separately verified external `fancy-dust-7f8c` source gap where `direction` is ignored was **not** changed by PR #85 and must be explicitly reported as a known external dependency in the terminal handoff;
- do not modify/deploy `zeroslove-ai/py-all` or `fancy-dust-7f8c` in this task.

## 6. Create exactly one genuinely fresh Level-7 manual TEST game

After deployment and structural smoke pass, generate a new random UUID that has never existed in TEST.

Before writing, prove for that UUID:

- `games=0`
- `game_master=0`
- `game_save=0`
- `game_actions=0`
- `game_turns=0`.

Then call exactly once:

`public.create_company_test_level7_fixture(p_game_id uuid, p_expected_title text)`

Use a clear title such as:

`Company v1 Spine Integrity Manual Acceptance 2026-08-19`

No retry with the same or another UUID unless the first call produced **no database write at all** and the operator explicitly reviews the failure. Never reset/reseed a partially created candidate.

Post-write requirements:

- `games=1`
- `game_master=1`
- `game_save=1`
- `game_actions=0`
- `game_turns=0`
- `committed_turn=0`
- save revision `0`
- `player_progress.level=7`
- `player_progress.exp=0`
- `turn_state.committed_turn=0`
- `turn_state.expected_turn=1`
- processing status idle
- setup/opening remain unplayed/not started as defined by the fresh fixture contract
- canonical save validators pass
- `game_master.initial_save` equals the initial `game_save.data` where the contract requires equality
- dedicated template remains unchanged.

## 7. Absolute zero automated gameplay

For the fresh manual acceptance game, automated gameplay count must remain **0**.

Do not call:

- setup execution that advances gameplay;
- Opening generation;
- Story generation;
- Extract;
- Commit;
- feedback regeneration;
- player choice/free-text submission;
- reset/reseed after creation.

The owner must be the first person to actually play this fresh game through the public frontend.

## 8. Public manual acceptance handoff

Terminal must provide the exact public URL:

`https://gamebuilder-company-v1.zeroslove.workers.dev/?game=<FRESH_UUID>`

Then set this reused `docs/ops/CURRENT_TASK.md` to:

`Status: WAITING_USER_LIVE_ACCEPTANCE`

Commit that status update on `main` only as a docs-only final handoff commit. Do not create a branch or PR for the status update.

The owner should manually play at least 30–50+ turns, including ordinary office conversation, navigation among known coworkers, physical/clothing continuity, active regulations, image-changing situations, Mind Monitor, TTS/vocal reactions, and enough long-run history to exercise summaries.

Manual acceptance specifically watches for the previously observed defect classes:

- Extract/summary continuity holes;
- NPC thought leaking into player `[THOUGHT]`;
- Mind Monitor missing or reading pre-Commit data;
- meaningless sexual counters/meters reappearing;
- same-location registered coworkers failing to appear/react;
- anonymous replacement witnesses instead of registered NPCs;
- explicitly exited NPCs reappearing without entrance/re-entry;
- exact known-NPC navigation erasing or resurrecting the wrong cast;
- images staying generic instead of following current situation;
- image-family mismatches for representative sexual situations;
- repetitive `규정이라서 참는다/버틴다` narration or rule-scope expansion;
- high-intensity scenes lacking natural short vocal/breath/body reactions;
- stale prior-turn TTS delaying current dialogue;
- noon/13:xx time rendered as incorrect AM wording;
- repeated prepare/wait/restart loops instead of meaningful same-turn progression;
- same-turn CSA clothing Story/Commit contradiction.

## 9. Stop boundary

## 9a. Rollout and fresh fixture evidence

- FINAL_STATUS: `WAITING_USER_LIVE_ACCEPTANCE`
- TEST API deployment: `game-proxy-company-v1`, Version ID `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`, exact registration-main source `a2a14e6dcba9488a5af3d0d60008eed575139f1f`.
- TEST Frontend deployment: `gamebuilder-company-v1`, Version ID `3de1edb7-ff31-4ec9-b1c1-9671789fd35e`, exact registration-main source `a2a14e6dcba9488a5af3d0d60008eed575139f1f`.
- Structural smoke: API `/health` and `/api/version` HTTP 200 with `edition_id=company-v1`; frontend root HTTP 200; preserved API/readback smoke passed; frontend asset smoke passed (`direct_assets=15`, `reachable_modules=21`); heroine3 general image selection returned `source=match`, and heroine3 sex/penetration-family selection returned `source=family_match` with `heroine3-adult-1011251197`.
- Fresh manual TEST game: `df3045fd-c359-4cdc-8783-357ddfebe398`; title `Company v1 Spine Integrity Manual Acceptance 2026-08-19`.
- Fresh pre-write counts: `games=0`, `game_master=0`, `game_save=0`, `game_actions=0`, `game_turns=0`.
- Fresh post-write counts: `games=1`, `game_master=1`, `game_save=1`, `game_actions=0`, `game_turns=0`.
- Fresh validation: `committed_turn=0`, save revision `0`, `player_progress.level=7`, `player_progress.exp=0`, `turn_state.committed_turn=0`, `turn_state.expected_turn=1`, processing `idle`, `player_setup.status=not_started`, `opening_state.status=not_started`, canonical validator `valid=true`, and `game_master.initial_save` equals `game_save.data`.
- Automated gameplay count is exactly `0`; no setup/opening/story/extract/commit/player-action call was made on the fresh game.
- Preserved evidence games and dedicated Level-7 template were read-only and unchanged by before/after row-count and canonical-hash comparison.
- Known external dependency gap: `fancy-dust-7f8c` still ignores TTS `direction`; that external Worker was not changed or deployed.
- Public manual acceptance URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=df3045fd-c359-4cdc-8783-357ddfebe398`

Successful terminal state:

`FINAL_STATUS: WAITING_USER_LIVE_ACCEPTANCE`

Terminal report must include:

- accepted PR/head and merge SHA;
- registration main SHA/blob used;
- test/syntax/diff results;
- API and Frontend TEST Worker Version IDs;
- deployment source identity;
- health/frontend/image structural smoke evidence;
- fresh UUID and exact pre/post row counts;
- fresh fixture validation facts;
- confirmation automated gameplay = 0;
- confirmation preserved evidence/template games were not reset/reseeded/mutated;
- known external `fancy-dust-7f8c direction` gap;
- final main SHA and final CURRENT_TASK blob;
- public manual acceptance URL.

At `WAITING_USER_LIVE_ACCEPTANCE`, STOP.

Do not generate/register the next gameplay/source task. Do not start another roadmap Cut. Do not run automated acceptance gameplay. Wait for owner manual evidence.

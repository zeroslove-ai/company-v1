# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: deep-level7-live-acceptance-v3
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted gameplay executable: `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0` (`extract-open-fact-coverage-contract-v1`).
Accepted TEST Level-7 seam source: `abc9c3f9e06d6b2eb474b4cade6daa3bc7c5a484`.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must never be reset/mutated.

Already-applied TEST migration:
- `20260815000100 / company_v1_test_level7_acceleration`
- do NOT reapply, edit, or roll it back.

Previously deployed TEST Worker before this task:
- `game-proxy-company-v1`
- Version `0df3468e-65f3-45c4-9e3b-9ea36ae21d54`
- this version predates executable `2a804fd...` and therefore must not be used for acceptance after preflight.

Canonical game spine remains binding:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
CSA is an institutional-rule/context sidecar only. Story owns natural HOW. Extract observes actual Story. Commit owns durable persistence. Media is presentation-only.

## Goal

Deploy exactly reviewed executable `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0` to the TEST API through the existing contract-gated deployment path, prepare the disposable TEST game at Level 7 through the already-installed seam, then run the full deep scenario-coverage acceptance A-I without retries, source patches, semantic repair, or hidden state manufacturing.

This is the first live acceptance of the new Story-block observation coverage contract.

## Phase 0 — freeze identity and preflight

Before any TEST mutation:
1. Fetch remote and verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Verify `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0` is an ancestor of current branch HEAD and that any descendants before execution are docs/workflow-only. Any unreviewed gameplay/runtime delta => BLOCK.
3. Verify migration `20260815000100` is already applied exactly once and `prepare_company_test_level7_fixture(uuid,text)` still has the accepted SECURITY DEFINER/search_path/service_role-only/fixed-game properties. Do not reapply migration.
4. Verify the dedicated TEST game is clean/reset baseline. If it contains evidence that should be preserved, BLOCK rather than erase it.
5. Never query or mutate Production. Never access/mutate/reset the preserved manual game.

## TEST deployment authorization

Deploy only TEST Worker `game-proxy-company-v1` from a source tree proven gameplay/runtime-identical to executable `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0`.

Requirements:
- use the existing contract-gated deployment wrapper/process;
- record exact deployed Worker Version ID and source identity;
- health must return HTTP 200 and `edition_id=company-v1`;
- no frontend deploy;
- no Production deploy;
- no migration action.

If exact runtime identity cannot be proven, BLOCK instead of deploying a branch HEAD by assumption.

## Level-7 fixture

After deployment proof:
1. Invoke `prepare_company_test_level7_fixture` exactly once for `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
2. Verify `{level:7, exp:0}` and canonical strong-CSA capability.
3. Verify the seam did not manufacture Story, facts, relations, emotion, clothing, CSA compliance, actions, or turns.
4. Do not run a reset-owning canary after seam setup.
5. Do not invoke the seam a second time in this task.

## Evidence capture requirement — critical

For every decisive Extract turn, preserve all three layers separately:
1. raw Worker-facing Story text / parsed Story blocks;
2. raw provider Extract message/envelope before normalization, including `observation_coverage`, `open_facts`, warnings/finish reason when available;
3. normalized/staged Extract actually used by Commit.

Also capture action ID, turn number, player action, Commit response, relevant context/history/DB readback.

This is mandatory so any failure can distinguish:
- provider explicitly chose `decision:none`;
- provider omitted/malformed coverage;
- provider emitted facts but normalizer rejected/dropped them;
- another adapter lost data.

Do not infer which occurred if the raw envelope is missing.

## A. Ordinary spine + literal choices + free text

- Complete setup/opening normally.
- Verify provider-authored exactly-four choices when contract-compliant.
- Select one displayed choice through the normal literal choice path and prove the exact displayed text becomes the next `player_action` without server-authored replacement.
- Complete a separate free-text turn.
- Story -> Extract -> Commit -> context/history must complete.

## B. Open facts and observation coverage

Create a natural scene that visibly establishes at least one durable fact outside old event/relation/emotion/posture taxonomies, preferably mixed human meaning such as emotion + practical agreement/boundary.

Prove:
- Story body block has exact visible evidence;
- raw Extract provider output explicitly accounts for every required Story body block;
- the relevant block uses `decision:facts` and emits one or more arbitrary open facts, OR if provider chooses `none`, record that exact false-negative evidence and BLOCK without retry;
- each accepted fact has registered IDs, correct `story:<index>` source block and exact quote contained in that block;
- Commit persists it once;
- Context/History read it back;
- no semantic enum is required.

A turn with genuinely no durable fact may legally use `decision:none`. Do not require a minimum fact count globally.

If coverage is missing/malformed or structural validation blocks, preserve raw provider output and BLOCK. Do not add retries or patch source in this task.

## C. Strong CSA as institutional context

Through the normal CSA app/validation/transaction path, create and activate one Level-7 strong rule suitable for a meaningful physical/intimate scenario.

Prove:
- Story receives human-readable active institutional rule/context;
- no `execution_action`, mandatory enactment ID, direct-coverage token, `posture_after`, relation-kind switch or other finite physical HOW is required;
- Story authors HOW naturally;
- Extract/open facts observe only actual Story outcomes;
- CSA activation/compliance does not mechanically create consent, comfort, affection, trust, romance, emotion or sexual willingness.

## D. Natural posture/contact outside old CSA vocabulary

Exercise one visible posture/contact outcome not dependent on removed physical action vocabulary. It must not be rejected merely because no old enum/token exists. Preserve meaningful outcome as open fact when Story evidence exists.

## E. Clothing continuity

Cause one supported compact clothing UI-state change through Story + Extract evidence.

Prove:
- compact clothing projection changes and persists through later context refreshes;
- richer clothing/accessory detail outside compact slots may remain an open fact and is not discarded merely because the compact UI cannot represent it;
- clothing projection is not narrative truth authority.

## F. Bounded intimate/sexual scenario

Explicitly exercise one bounded intimate/sexual path through normal gameplay, using strong CSA context where appropriate.

Rules:
- one intentional scenario only; no regeneration/retry until a desired result;
- player request is intent, not success evidence;
- Story determines actual outcome;
- no old sexual action taxonomy may be required for the meaningful fact to exist;
- if Story actually establishes intimate/sexual evidence, verify open-fact continuity and any still-valid narrow sexual/UI/media projection with a real consumer;
- if provider naturally does not establish the needed event, mark BLOCKED and stop after cleanup rather than gaming the model.

## G. Long-horizon memory beyond recent-three raw Story

Choose one important accepted open fact from an earlier turn.

After committing it, complete at least four additional ordinary turns without reset so its origin Story leaves the last-three raw Story window.

Then prove:
- durable fact still exists with action/turn/source-block/quote provenance;
- later Story context receives that committed fact through open-observation readback;
- a subsequent Story maintains continuity consistent with it without depending on the original raw recent Story.

Do not overclaim final summary-system correctness from this criterion.

## H. Media remains presentation-only

Exercise normal image selection and, only if the actual intimate/sexual Story supports it, sex-pool image selection.

Prove:
- finite media tags/families may choose an asset;
- image miss/null/alternate does not reject or erase Story, Extract fact, Commit or memory;
- do not alter image taxonomy.

## I. Replay/idempotence

Exercise one safe same-action replay/idempotence path.

Prove:
- no duplicate committed turn;
- no duplicate open fact;
- normalized observation coverage/open-fact provenance remains stable;
- context/history remain consistent.

Do not intentionally corrupt the game to test recovery.

## Failure discipline

On the first decisive failure:
- capture exact raw Story, raw provider Extract, normalized Extract, action/turn identity and readback;
- do not retry/regenerate/change provider/model/temperature/token budget;
- do not patch source;
- do not use regex/semantic repair/synthetic facts/direct DB gameplay patches;
- perform final canonical reset and report BLOCKED/FAILED truthfully.

A provider `decision:none` on an obviously acceptance-designed durable-fact Story is evidence of Extract semantic miss, not permission for the server to invent a fact.

Repeated protocol-format failure is evidence to reconsider the representation/wire contract in a later source task, not permission to add retries.

## Final cleanup

On success OR first decisive failure:
1. canonical reset of the disposable TEST game;
2. verify committed_turn=0, level 1, actions=0, turns=0, setup/opening baseline, csa_active empty, Scene v1 baseline;
3. leave TEST migration installed;
4. leave accepted TEST Worker deployment in place unless the task itself proves it unsafe; do not deploy anything else;
5. preserve evidence outside tracked runtime source.

## Forbidden

- Any Production access/mutation/deploy.
- Any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- Migration apply/reapply/rollback/edit.
- Frontend deploy.
- Gameplay/source/test patch during live acceptance.
- Provider/model/temperature/token changes or retries/regeneration.
- Semantic regex/heuristic repair, synthetic facts, parser relaxation/new parser, new finite event/relation/emotion/posture/sexual taxonomy.
- Direct DB mutation to manufacture gameplay state.
- New branch/PR, merge, Ready, rebase, squash, force-push.

## Execution result — BLOCKED

Execution identity: `deep-level7-live-acceptance-v3` / task blob `eb39d08b88a5e6e3e7d664660aacde9da5367e11` / branch `company/scene-location-presence-v1`.

- TEST Worker `game-proxy-company-v1` was deployed through the existing Stage B contract-gated path from exact reviewed executable `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0`; Version ID: `d2138893-f96b-4539-9d69-bda4ca0511f3`.
- Level-7 seam `prepare_company_test_level7_fixture` was invoked exactly once on the disposable TEST game. Result: `{level:7, exp:0}` with no actions, turns, facts, relations, emotion, clothing, or CSA state manufactured.
- A: **BLOCKED** at first ordinary selected-literal turn. Opening setup succeeded with exactly four choices and the first displayed literal was sent as `player_action`; decisive action `22535b2b-2bc9-49c5-ab15-3ca8f93bd44e` reached Story successfully but Extract returned `story_observation_coverage_mismatch` (`Block story:0 declares facts without a fact`). No retry or regeneration occurred.
- B–I: **NOT ATTEMPTED** after the first decisive A failure. No `decision:none` acceptance judgment was made.
- Decisive evidence is preserved outside the repository at `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v3-evidence.json` (SHA-256 `ADD4752EE76856FA129B76F495AD7C68362C2E77ACC3D502C48A67A12864D0FD`). It contains raw Story/parsed blocks, the normalized Worker response/error, action identity, and readback. The Worker response did not expose a raw provider Extract envelope, so provider output versus normalization cannot be inferred.
- Final canonical reset: PASS. TEST readback: `committed_turn=0`, `save_revision=918`, `processing_status=idle`, `player_progress.level=1`, setup/opening `not_started`, `csa_active=[]`, `game_actions=0`, `game_turns=0`, Scene v1 baseline.
- Operations: migration apply/reapply `0`; frontend deploy `0`; Production/manual-game access `0`; source patch/retry/provider change `0`.

## Terminal report

Report:
- START_SHA and final docs SHA separately from accepted/deployed executable `2a804fd...`;
- exact TEST Worker Version ID and source-equivalence proof;
- Level-7 fixture result;
- A-I matrix with PASS/BLOCKED/FAILED and decisive action IDs;
- for key Extract turns: raw Story, raw provider coverage/facts summary, normalized Extract summary and exact quote provenance;
- whether any `decision:none` was a legitimate zero-fact decision or an acceptance false-negative;
- CSA context outcome;
- posture/contact, clothing, intimate/sexual, media and long-horizon findings;
- replay/idempotence result;
- player-agency substitution/escalation findings;
- final reset/readback;
- migration operations 0; Production/manual-game/frontend operations 0;
- PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.

On full success set CURRENT_TASK to WAITING_REVIEW in a docs-only descendant, post one immutable COMPLETE report to Issue #68, and STOP.
On decisive failure/block still reset, set WAITING_REVIEW if safe, post immutable BLOCKED/FAILED evidence, and STOP. Do not generate a later task yourself.

# Company v1 — CURRENT TASK

Status: READY
Task ID: deep-level7-live-acceptance-v2
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Reviewed gameplay executable: `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f`.
Current docs head before registration: `3c3d895236630cdb21673d7350ff1685b96badba`.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.

Already-applied TEST seam migration:
- version/name: `20260815000100 / company_v1_test_level7_acceleration`
- accepted source SHA: `abc9c3f9e06d6b2eb474b4cade6daa3bc7c5a484`
- function: `prepare_company_test_level7_fixture(uuid,text)`
- expected properties: SECURITY DEFINER, `search_path=public, pg_temp`, fixed dedicated TEST game, service_role EXECUTE only.

Currently deployed TEST API evidence from prior task:
- Worker: `game-proxy-company-v1`
- Version ID: `0df3468e-65f3-45c4-9e3b-9ea36ae21d54`
- health previously HTTP 200 / `edition_id=company-v1`
- deployed gameplay runtime was proven equivalent to reviewed executable `95ed069...`.

Canonical spine remains:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
CSA is sidecar institutional rule/context only. Story owns natural HOW; Extract/open facts observe actual outcomes; Commit owns durable persistence.

## Why V1 blocked

`deep-level7-live-acceptance-v1` did not prove or disprove deep gameplay criteria B-H. The Level-7 seam worked, but the existing `--cut1-authority` canary was run after seam setup and performed its own canonical final reset after two turns. That removed Level 7 before strong CSA, open-fact, posture/contact, clothing, intimate/sexual, long-horizon memory, and media criteria could be exercised. The runner correctly refused a second seam invocation and stopped BLOCKED.

This V2 task fixes only the acceptance orchestration. It is not authorization for a gameplay/source patch.

## Goal

Run the deep live acceptance to completion on the already-reviewed runtime and already-installed TEST seam. The acceptance is scenario-coverage driven, not fixed-turn-count driven.

## Phase 0 — read-only preflight

Before any TEST mutation:
1. Fetch remote; verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Verify there is no gameplay/runtime drift after reviewed executable `95ed069...`; docs-only CURRENT_TASK descendants are allowed.
3. Verify TEST migration `20260815000100` is already applied exactly once. DO NOT reapply it.
4. Verify `prepare_company_test_level7_fixture(uuid,text)` function definition/grants still match the approved TEST-only contract.
5. Verify TEST Worker identity is still Version `0df3468e-65f3-45c4-9e3b-9ea36ae21d54`, healthy, and gameplay-equivalent to `95ed069...`. If it has drifted, STOP/BLOCK; do not redeploy under this task.
6. Verify the dedicated TEST game is currently clean/reset baseline: committed_turn 0, level 1, no actions/turns, setup/opening not_started, csa_active empty, canonical Scene baseline.
7. Never query or mutate Production. Never access/mutate/reset the preserved manual game.

## Critical orchestration rule

Do NOT run `--cut1-authority` or any other helper that owns a final reset after the Level-7 seam invocation.

If a generic canary is desired for health, it may only run BEFORE the Level-7 fixture setup, and the dedicated game must then be confirmed clean again before the seam is invoked.

After the seam invocation, use the normal API/CSA paths directly for the deep scenario and do not reset until either:
- one decisive acceptance criterion honestly fails/blocks, or
- all required criteria are complete.

Then perform the one canonical cleanup reset.

## Level-7 fixture setup

1. Read the dedicated TEST game title/context.
2. Invoke `prepare_company_test_level7_fixture` exactly once in this V2 task.
3. Verify `{level:7, exp:0}` and existing canonical strong-CSA capability.
4. Verify no Story, semantic fact, relation, emotion, clothing outcome, CSA compliance outcome, action, or turn was manufactured by the fixture.
5. Do not invoke the seam again in the same task.

## Required deep live coverage

### A. Ordinary spine + literal choices + free text
- Complete setup/opening.
- Verify opening/turn Story exposes exactly four provider-authored literal choices when contract-compliant.
- Select one displayed choice through the normal UI/API choice-input path and prove the exact literal displayed text becomes the next `player_action` without server-authored semantic replacement.
- Also complete a separate ordinary free-text turn.
- Story -> Extract -> Commit -> context/history must complete normally.

### B. Open fact outside old taxonomies
Create a natural scene that visibly establishes at least one meaningful fact not dependent on old event/relation/emotion/posture enums. Prefer a fact combining human nuance, e.g. mixed emotion + practical agreement or interpersonal boundary.

Required proof:
- exact Story evidence exists;
- Extract emits an open fact grounded in that evidence;
- Commit persists it;
- context/history read it back;
- no old semantic enum/type is required for persistence.

Player input alone is never evidence of success.

### C. Strong CSA as institutional context
Through the normal CSA app/validation/transaction path, create/activate one Level-7 strong rule suitable for a meaningful physical/intimate scenario.

Prove:
- Story receives the active human-readable institutional rule/context;
- no finite `execution_action`, mandatory enactment ID, direct-coverage token, `posture_after`, relation-kind switch, or equivalent physical HOW is required;
- Story authors the observable HOW naturally;
- Extract observes only what actually happened;
- CSA activation/compliance does not mechanically write consent, comfort, affection, trust, romance, emotion, or sexual willingness.

### D. Posture/contact outside old CSA vocabulary
Exercise at least one visible natural-language physical/posture/contact outcome that does not depend on the removed CSA physical vocabulary. The turn must remain valid and meaningful open facts must persist when exact Story evidence exists.

### E. Clothing continuity
Cause one supported compact clothing UI state change through actual Story/Extract evidence. Verify the compact clothing projection persists through subsequent turns/context refresh. Rich details outside compact slots may remain open facts and must not be dropped merely because the UI projection cannot represent them.

### F. Bounded intimate/sexual scenario
Explicitly exercise one intimate/sexual path using normal gameplay and the active strong CSA context where appropriate.

Rules:
- one bounded intentional scenario; do not regenerate/retry until a desired result appears;
- Story determines what actually happens;
- player request text does not prove success;
- no old sexual action taxonomy may be required for the meaningful fact to persist;
- if Story actually establishes intimate/sexual evidence, verify open-fact continuity and any still-valid narrow UI/mechanical projection with a real consumer;
- if the provider naturally does not establish the needed event, mark the criterion unproven/BLOCKED and stop after cleanup rather than gaming the model.

### G. Long-horizon open-fact memory
Choose one important exact-evidence open fact established earlier.

After that fact is committed, complete at least four additional ordinary turns without resetting so the origin Story leaves the last-three raw Story window.

Then prove:
- the durable open fact still exists with provenance;
- later Story context receives it via committed open-fact readback rather than the origin raw Story;
- a subsequent Story maintains continuity consistent with the fact.

Do not overclaim final summary-system correctness from this proof.

### H. Media remains presentation-only
Exercise normal image selection and, only if the intimate/sexual Story actually supports it, sex-pool image selection.

Prove:
- finite image tags/families may select assets;
- alternate/no-match/null image never rejects or erases Story, Extract open facts, Commit, or memory;
- do not modify media taxonomy.

### I. Replay/idempotence/recovery
Exercise at least one safe same-action replay/idempotence path without duplicate turn or duplicate durable open fact. Use context/history readback to prove stable committed state. Do not corrupt the game intentionally.

## Evidence requirements

Capture for decisive turns:
- action ID and turn number;
- player action / selected literal choice text;
- Worker-facing Story SSE;
- Extract response;
- Commit response;
- exact Story quote -> open fact provenance;
- relevant context/history/TEST DB readback;
- active CSA rule/context when tested;
- clothing projection before/after;
- media result where applicable;
- long-horizon context proving the origin Story is outside recent-three raw turns;
- any player-agency substitution/escalation.

Do not hide failures with retries, regeneration, provider/model changes, parser relaxation, fuzzy semantic repair, semantic hard gates, direct DB gameplay patches, or synthetic facts.

## Final cleanup

On success OR first decisive failure/block:
1. reset the disposable TEST game exactly through canonical `reset_company_game`;
2. verify committed_turn=0, level=1 baseline, actions=0, turns=0, setup/opening not_started, csa_active empty, Scene baseline;
3. leave the approved TEST Level-7 migration installed;
4. do not redeploy anything;
5. preserve evidence outside tracked runtime source.

## Forbidden

- Production access/mutation/deploy.
- Any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- Migration reapply/rollback.
- Worker/frontend deploy unless this task explicitly stops and requests a separate authorization; default is zero deploys.
- Gameplay/source/test/migration patch.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- Provider/model/temperature/token changes or retries/regeneration.
- New finite semantic taxonomy, regex semantic inference, parser relaxation/new parser, arbitrary LLM save patch, direct player-input success inference.
- Any reset-owning canary after the Level-7 seam invocation.

## Terminal report

Report:
- START_SHA / final docs SHA and frozen gameplay executable identity;
- preflight migration/function/grant/Worker/game baseline proof;
- Level-7 seam single invocation proof;
- A-I coverage matrix with PASS/BLOCKED/FAILED and decisive turn/action IDs;
- exact open fact(s) and Story quote provenance;
- strong CSA natural-context evidence;
- posture/contact, clothing, intimate/sexual and media findings;
- long-horizon proof after origin leaves recent-three raw Story;
- replay/idempotence result;
- player agency substitution/escalation findings;
- final reset/readback;
- migration apply/redeploy/source patch/Production/manual-game operations all 0 in V2;
- PR #67 remains base main, OPEN / DRAFT / UNMERGED.

On full success set CURRENT_TASK to WAITING_REVIEW in a docs-only descendant, post one immutable COMPLETE terminal report to Issue #68, and STOP.
On decisive failure/block, still reset, set WAITING_REVIEW if safe, post immutable BLOCKED/FAILED evidence, and STOP. Do not generate a later task yourself.

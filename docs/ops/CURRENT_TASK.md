# Company v1 — CURRENT TASK

Status: READY
Task ID: deep-level7-live-acceptance-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted gameplay executable: `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f` (`csa-natural-rule-authority-reset-v1-land-recovery`).
Accepted TEST seam source: `abc9c3f9e06d6b2eb474b4cade6daa3bc7c5a484` (`test-level7-acceleration-seam-v1`).
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must never be reset/mutated.

Canonical game spine is binding:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
CSA is a sidecar institutional rule/context system only. Story owns natural HOW; Extract/open facts observe actual outcomes; Commit owns durable persistence.

## Goal

Perform the first deep live acceptance of the redesigned spine using the approved TEST-only Level-7 acceleration seam. This task may apply the one approved additive TEST migration, deploy the exact reviewed gameplay runtime to the TEST API, run live LLM gameplay against only the disposable TEST game, collect evidence, and reset the disposable game at the end.

This is scenario-coverage driven, not a fixed-turn-count test. Do not stop because a nominal number of turns has been reached; stop when all required invariants are either proven or one is honestly BLOCKED/FAILED.

## Phase 0 — freeze identities before mutation

Before any TEST mutation:
1. Fetch remote and verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Verify `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f..HEAD` contains no gameplay runtime drift under `src/**`, Worker runtime/config, package/runtime dependency surfaces. Docs/tests/scripts and the approved Level-7 migration are allowed descendants. Any unexplained gameplay executable drift => STOP/BLOCK.
3. Verify migration source `supabase/migrations/20260815000100_company_v1_test_level7_acceleration.sql` matches the accepted seam and is not already ambiguously applied under a different version/name.
4. Read TEST migration catalog, TEST function catalog/grants, deployed TEST Worker identity, and dedicated TEST game baseline.
5. Baseline dedicated TEST game must be resettable and disposable. If it contains evidence that should be preserved, STOP instead of erasing it.
6. Never query or mutate Production. Never mutate/reset the preserved manual game.

## Authorized TEST changes

Only the following are authorized:
- Apply additive migration `20260815000100_company_v1_test_level7_acceleration` to TEST Supabase `fmcrspgxstsmxxsmkeee` only.
- Verify `prepare_company_test_level7_fixture(uuid,text)` is SECURITY DEFINER, `search_path = public, pg_temp`, service_role execute only, and fixed to the dedicated TEST game.
- Deploy the TEST API Worker `game-proxy-company-v1` from an executable source tree proven gameplay-equivalent to accepted runtime `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f`. Do not deploy an unreviewed gameplay source delta merely because branch HEAD is newer.
- Invoke the approved Level-7 fixture seam on `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` only.
- Run setup/opening and live Story/Extract/Commit through normal API paths.
- Use CSA app/validation/transaction paths normally; do not manufacture CSA save state directly.
- Query TEST readback needed for acceptance evidence.
- Final reset of the disposable TEST game through canonical `reset_company_game`.

No frontend deploy is authorized unless it is strictly required to observe a criterion that cannot be verified from API/context/readback; if so STOP/BLOCK and request a separate task instead of broadening this task.

## Level-7 fixture proof

After migration apply:
1. Read the TEST game title/context.
2. Reset through canonical `reset_company_game`.
3. Invoke `prepare_company_test_level7_fixture` exactly once for the fixture setup.
4. Verify `player_progress.level=7`, `exp=0` and existing `calculateCsaCapability` semantics expose strong CSA. Do not add/patch a second strength rule.
5. Verify no semantic facts, relations, emotions, clothing, Story results or CSA compliance outcomes were seeded by the fixture.

## Required live acceptance coverage

### A. Ordinary spine and choices
- Complete setup/opening and at least one ordinary free-text turn through Story -> Extract -> Commit -> context refresh.
- Story must expose exactly four provider-authored literal choices when the provider satisfies the contract.
- Exercise one selected choice through the normal literal-string round trip and prove the exact displayed choice text becomes the next player action; no server-authored semantic replacement.
- Free text must remain independently usable.

### B. Open facts outside old semantic taxonomies
Create a natural scene where Story visibly supports at least one meaningful fact whose wording does not depend on old event/relation/emotion/posture enums, for example mixed emotion + practical agreement + interpersonal boundary. Extract must preserve the fact with exact Story evidence in `open_facts`; Commit must persist it; context/history must read it back.

Do not instruct the provider to emit a specific enum or hidden token. Do not manufacture the fact from player input alone. If Story does not actually establish the fact, it must not be durably claimed.

### C. Strong CSA as institutional context, not physical engine
Through the normal CSA app path, create/activate one strong Level-7 rule suitable for exercising a meaningful physical/intimate scenario.
- Verify Story receives the active human-readable institutional rule/context.
- Verify no `execution_action`, mandatory enactment ID, direct-coverage token, `posture_after`, relation-kind switch, or equivalent finite physical HOW is required to complete the turn.
- Story authors the observable HOW naturally.
- Extract observes only what actually happened.
- CSA activation/compliance must not mechanically write consent, comfort, affection, trust, romance, emotion or sexual willingness.
- NPC reaction may be positive, negative, resistant, embarrassed, indifferent, etc.; preserve what Story actually shows.

### D. Physical/posture/contact outside old vocabulary
Exercise at least one visible posture/contact outcome that is natural language and not dependent on the former CSA physical action vocabulary. Prove the turn is not rejected merely because the posture/contact has no old enum/token. Preserve any meaningful fact through open observations when Story evidence exists.

### E. Clothing continuity
Exercise a scene that changes a currently supported compact clothing UI state through actual Story/Extract evidence. Verify the compact clothing projection persists across subsequent turns/context refresh. Rich clothing/accessory details outside compact slots may survive as open facts but must not be required to fit the compact UI projection.

### F. Intimate/sexual path
Because Level 7 exists specifically to reach deep scenarios without ~100 low-level turns, explicitly exercise an intimate/sexual path through normal player/CSA gameplay.
- Use normal Story/Extract/Commit only.
- Do not infer success from player request text.
- Do not require an old sexual action taxonomy to recognize/persist the meaningful narrative fact.
- If Story produces an intimate/sexual event, verify relevant open-fact/memory continuity and any still-valid narrow sexual/player projection that has a real UI/mechanical consumer.
- Do not repeatedly regenerate/retry until a desired sexual outcome appears. One bounded intentional scenario is enough; if the provider naturally does not produce the needed evidence, record the criterion as unproven/BLOCKED rather than gaming the model.

### G. Long-horizon memory beyond recent raw turns
After establishing one important exact-evidence open fact, commit at least four additional ordinary turns so that the originating Story is outside the last-three raw Story window used by Story context.
Then prove:
- the durable open observation still exists with provenance;
- later Story context receives the committed fact through the open-observation readback path;
- a subsequent Story can maintain continuity without relying on the original raw recent-turn text.
Do not claim final summary-system correctness beyond what this proves; `story_summary_overall` remains a separate architecture surface unless current evidence closes it.

### H. Media remains presentation-only
Exercise image selection in both a normal and, when the intimate/sexual scenario actually supports it, sex-pool context.
- Existing finite image tags/action families may select an asset.
- No match / alternate image / image null must never reject or erase Story, Extract open fact, Commit, or memory.
- Do not change image taxonomy in this task.

### I. Replay/recovery/idempotence
Prove at least one safe replay/idempotence path using existing action/status/context/history contracts without creating duplicate durable facts or duplicate turns. Do not intentionally corrupt the game merely to exercise recovery.

## Evidence discipline

- Capture Worker-facing Story SSE and Extract/Commit responses for decisive scenarios.
- Capture exact action IDs/turn numbers and the relevant TEST DB/readback rows.
- Preserve exact Story quote -> open fact provenance for key facts.
- Compare intended player action with Story outcome for agency fidelity; explicitly report any silent substitution/escalation.
- Do not hide failures with retries, regeneration, provider/model/temperature/token changes, fuzzy repair, parser relaxation, semantic hard gates, direct DB patches or synthetic facts.
- If one decisive criterion fails, capture the evidence, finish safe cleanup/reset, report FAILED/BLOCKED, and STOP. Do not patch source in this task.

## Final cleanup

Regardless of success/failure after any TEST mutation:
1. Reset disposable TEST game through canonical `reset_company_game`.
2. Verify committed_turn=0, actions=0, turns=0, setup/opening baseline, canonical Scene v1 baseline, and Level-7 acceleration removed.
3. Do NOT roll back the additive TEST migration merely because the game is reset; the seam may remain installed in TEST for future acceptance, subject to service_role/fixed-game guards.
4. Preserve all evidence artifacts outside tracked runtime source unless the task explicitly requires a docs artifact.

## Forbidden

- Any Production access/mutation/deploy.
- Any mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- Gameplay source patch in response to a live failure.
- Provider/model/temperature/token changes or retries/regeneration to obtain a preferred result.
- Fuzzy semantic repair, regex semantic inference, parser relaxation/new parser, new finite event/relation/emotion/posture/sexual taxonomy.
- Direct table mutation to manufacture Level 7 or semantic gameplay state; use only the approved named fixture RPC for capability.
- Editing historical applied migrations.
- Removing/degrading image/media or sexual-image functionality.

## Terminal report

Report:
- START_SHA and current/final docs SHA; freeze reviewed gameplay executable identity separately.
- exact TEST migration apply result/version/hash and function/grant verification;
- exact deployed TEST Worker identity and proof its gameplay runtime is equivalent to `95ed069...`;
- Level-7 fixture before/after capability proof;
- scenario coverage results A-I with turn/action IDs and decisive evidence summaries;
- every open fact used for acceptance with exact Story evidence/provenance;
- player-agency substitution/escalation findings;
- clothing and media outcomes;
- long-horizon readback proof after the origin leaves recent-three raw Story context;
- replay/idempotence result;
- final TEST reset/readback;
- Production/manual-game/frontend-deploy/source-patch operations all 0;
- PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.

On full success set CURRENT_TASK to WAITING_REVIEW in a docs-only descendant, post one immutable COMPLETE terminal report to Issue #68, and STOP.
On any decisive live failure, still perform final reset, set WAITING_REVIEW if safe, post FAILED/BLOCKED with evidence, and STOP. Do not generate the next task yourself.

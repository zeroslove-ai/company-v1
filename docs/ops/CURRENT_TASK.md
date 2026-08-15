# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-level7-acceleration-seam-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted executable: `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f` (`csa-natural-rule-authority-reset-v1-land-recovery`).
Current HEAD may be a docs-only registration descendant.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.

Canonical spine remains:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
CSA is now a narrow institutional rule/context system; Story owns natural HOW and Extract/open facts observe actual outcomes.

## Goal

Create exactly one safe TEST-only Level-7 acceleration seam for future deep acceptance. The seam exists only to avoid ~100 organic low-level turns needed to unlock strong CSA scenarios. It must not alter Production progression, become a second gameplay writer, or permit arbitrary save mutation.

This is a source/test/harness cut only. Do not perform live TEST gameplay, DB mutation/reset, migration apply, or deploy in this task.

## Phase 0 — inventory before implementation

Trace current progression authority end to end:
- where `player_progress.level` / EXP are initialized, validated, advanced, persisted and read;
- exact Lv7 strong-CSA capability checks and slot/strength gates;
- existing TEST/canary/E2E/reset/setup helpers and whether any already provide a safe seed/override boundary;
- runtime environment/config surfaces that could accidentally expose a test override to Production;
- DB/RPC validators that would reject or independently rewrite an accelerated state.

Classify candidate seams. Prefer, in order:
1. a dedicated test harness/seed helper that uses the same canonical setup/reset transaction boundary and can target only an explicitly disposable TEST game;
2. a narrowly authenticated TEST-only API/helper impossible to enable through normal Production configuration;
3. if neither is structurally safe, STOP/BLOCK with a concrete design instead of adding direct DB mutation.

Do not add a generic save patch endpoint, arbitrary level setter, SQL console mutation recipe, hidden Production flag, or second progression writer.

## Required implementation

Implement the smallest safe seam proven by Phase 0.

Required properties:
- can establish the dedicated disposable TEST acceptance game at Level 7 capability without simulating ~100 turns;
- cannot operate on the preserved manual game;
- cannot be activated in Production through ordinary runtime configuration;
- is explicit and auditable in source; no magic environment-name guessing if stronger project/identity proof is available;
- writes through one canonical transaction/seed boundary, not ad-hoc table updates;
- does not change normal setup/opening/progression behavior;
- does not change Production XP thresholds, level formula, CSA unlock rules, slot rules, or strength rules;
- idempotent for the same disposable test fixture where practical;
- reset returns the disposable game to canonical baseline and removes the acceleration state;
- no semantic gameplay facts, relations, emotions, physical outcomes, CSA compliance outcomes, clothing state, or Story results are manufactured by the seam. It grants capability only.

If the safest design requires an additive migration/RPC, repository migration source may be authored but MUST NOT be applied in this task. Historical applied migrations remain immutable. If an unapplied migration is necessary for the seam, stop at source review; live use belongs to a later authorized task.

## Required tests

Prove at minimum:
1. normal Production/runtime progression semantics are byte/behavior unchanged outside the isolated seam;
2. Level 7 capability is available through the seam for an explicitly disposable TEST fixture;
3. the seam rejects/has no route for arbitrary game IDs and explicitly protects `78fb1d94-266f-455a-bda4-7656cc2370c1`;
4. strong CSA availability derives from the existing canonical Lv7 rules, not a duplicated test-only strength rule;
5. reset/baseline behavior removes the accelerated capability state;
6. no direct semantic save patch or second gameplay writer is introduced;
7. CSA natural-rule/open-fact/clothing/media/choices/replay tests remain intact.

Run focused tests, full suite, syntax checks for modified JS/MJS, and `git diff --check`. Test count is supporting evidence only.

## Next live acceptance design to record, not execute

The terminal report must specify the exact next live-acceptance procedure using this seam. It must be scenario-coverage driven, not fixed-turn-count driven, and cover enough turns/scenes to prove:
- ordinary conversation and free text;
- exactly four provider-authored literal choices and selected-literal round trip;
- arbitrary emotion/relation/event open facts outside old enums;
- active strong CSA reaching Story as natural institutional context;
- compliance and resistance/reaction remaining distinct from consent/comfort/affection/trust/emotion;
- posture/contact outside old CSA vocabularies without mandatory enactment/direct coverage;
- compact clothing UI continuity;
- intimate/sexual-path state/memory behavior when explicitly exercised, without finite semantic gates;
- multi-turn memory/readback after important facts leave the immediate recent-turn window;
- image/media, including sex/general pools and sexual image families, remaining presentation-only: no/alternate image must never erase or reject the narrative fact;
- replay/recovery/idempotence;
- final dedicated TEST reset.

Do not manufacture Story outcomes merely to satisfy acceptance. If a scenario cannot deterministically prove an invariant without changing gameplay semantics, design bounded evidence capture and fail/block rather than retrying until lucky.

## Implementation handoff — source review pending

The Level-7 seam implementation candidate is complete in the working tree and
is awaiting operator review. It is intentionally not live: no TEST gameplay,
LLM call, DB write/reset, migration apply, or deploy was performed.

The candidate uses the existing canonical `reset_company_game` boundary and an
additive `prepare_company_test_level7_fixture(uuid, text)` RPC source that is
restricted to the dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
It resets first, changes only the disposable `game_save.player_progress`
capability to level 7, validates the result, and never changes
`game_master.initial_save`. The operator harness requires the TEST Supabase
project, the fixed TEST game, and explicit seam enablement; it uses named RPCs
only and rejects Production, the preserved manual game, and arbitrary IDs.

Focused and full unit/contract verification passed. The additive migration is
source-pending and must be applied only in a later authorized operator step.
After review and migration application, the next live acceptance must reset the
dedicated TEST game, invoke the seam once, verify canonical strong-CSA
capability, then run scenario-coverage-driven acceptance (not a fixed turn
count) across ordinary/free-text conversation, literal four-choice round-trip,
open facts, institutional CSA context, distinct compliance/reaction semantics,
non-taxonomy posture/contact, clothing continuity, explicitly exercised
intimate/sexual memory, post-recent-window readback, presentation-only media,
replay/recovery/idempotence, and final reset. Capture bounded evidence and
block on an unproven invariant; do not retry until lucky.

## Forbidden

- Production access/mutation/deploy.
- Any live TEST gameplay/LLM call, DB write/reset, DDL/migration apply, or Worker deploy in this source cut.
- Mutation/reset of preserved manual game.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- Provider/model/temperature/token changes, retries/regeneration.
- Fuzzy semantic repair, regex semantic inference, parser relaxation/new parser, semantic hard gates.
- New finite event/relation/emotion/posture/sexual taxonomy.
- Direct player-input success inference or arbitrary LLM save patch.
- Removing/degrading image/media or sexual-image catalogs because they are finite.

## Terminal report

Before COMPLETE:
- report START_SHA and executable FINAL_SHA;
- list exact progression writers/readers and chosen seam ownership;
- explain why the seam is TEST-only and why Production cannot activate it normally;
- prove normal progression/Lv7 CSA rules were not duplicated or changed;
- list runtime/test/migration files changed;
- report focused/full/syntax/diff-check results;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED;
- verify live TEST/LLM, DB write/reset, migration apply, deploy, Production and preserved-game mutation are all 0;
- give the exact proposed next live-acceptance procedure and cleanup/reset boundary.

Then set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP.

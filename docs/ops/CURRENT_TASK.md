# Company v1 — CURRENT TASK

Status: READY
Task ID: legacy-save-reset-canonicalization-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5305132123` accepted the preceding rollout as accurate BLOCKED evidence and isolated one deterministic reset-contract regression.

Accepted residue-deletion source/test/migration SHA:
`9c52e74a8e32278207e6e9b729c33d64eb770fd1`.

Applied TEST migration:
`20260816011104 / company_v1_legacy_save_residue_cleanup`.

Current TEST deployments from that lineage:
- API Worker `game-proxy-company-v1`: `52daecdd-c589-4013-942b-1bd80dda18e2`
- Frontend Worker `gamebuilder-company-v1`: `4bd2ddfb-151e-4b93-a57f-eebf1b49446f`

Dedicated TEST game:
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
It is currently dirty because the required final reset failed. Production and preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` are forbidden.

## Proven facts

The residue deletion itself already passed live TEST evidence:
- Setup / Opening passed;
- one provider-authored literal choice turn passed Story -> Extract -> Commit;
- one free-text turn passed Story -> Extract -> Commit;
- replay passed;
- the five deleted save-level keys stayed absent after commits;
- `turn_summary` and committed `parsed_blocks` remained present;
- retained relationship/sexual/stats/CSA/scene structures remained intact.

Deleted save-level residues are:
- `story_summary_overall`
- `story_summary_recent`
- `npc_emotion`
- `npc_work_state`
- general `event_ledger`

The only blocker is reset:
`invalid reset initial save: [missing required key: scene, missing required key: scene]`.

Root cause is already source-proven:
- Scene Stage A canonical reset used `company_bootstrap_scene_v1(v_master.initial_save)` before validation.
- The applied residue-cleanup migration replaced `reset_company_game` and accidentally removed that canonical bootstrap step.
- The replacement now validates raw legacy `game_master.initial_save` against the Stage-B validator that requires canonical `scene`.

## Objective

Close this reset regression at the existing canonical boundary. Do not redesign gameplay and do not repeat the already-passed broad live acceptance.

## Required work

1. Re-verify the exact live TEST `reset_company_game(uuid,text)`, `validate_company_save_v1(jsonb)`, `company_bootstrap_scene_v1(jsonb)`, and `company_apply_initial_clothing_v2(jsonb)` definitions/ACLs before mutation.
2. Author exactly one new additive corrective migration. Historical applied migrations are immutable.
3. The corrected `reset_company_game` must build one canonical reset candidate before validation and persist that same candidate. Required order/semantics:
   - start from `game_master.initial_save`;
   - remove the five deleted residue keys;
   - run the existing `company_bootstrap_scene_v1` so legacy initial-save shape becomes canonical Scene v1;
   - run the existing initial-clothing bootstrap where required by the current reset contract;
   - validate the resulting candidate with current `validate_company_save_v1`;
   - delete game turns/actions and write exactly that validated candidate to `game_save`.
4. Do not weaken the current validator and do not make `scene` optional again.
5. Do not add compatibility overloads, aliases, second reset RPCs, fallback scene bags, semantic gates, retries, provider/model changes, or direct DB state manufacture.
6. Add/adjust only focused reset-contract tests needed to prove:
   - a legacy-shaped master initial save without `scene` is canonicalized before validation;
   - reset output has canonical `scene`;
   - the five deleted keys remain absent;
   - protected save systems remain present;
   - reset uses one canonical candidate for validation and persistence.
7. Run focused tests, full suite as regression signal, relevant syntax/static checks, and `git diff --check`.
8. Apply the exact newly reviewed-in-task corrective migration to TEST once after local/source tests pass. This task is explicitly authorized to author and apply this one reset-only corrective migration in the same execution; do not split into another rollout task.
9. Immediately read back the live function body/ACL/search_path and migration ledger. No API/Frontend deploy is required unless executable source outside migration/test files actually changes; do not redeploy merely for ritual.
10. Call the canonical reset once on the currently dirty dedicated TEST game. Verify:
    - HTTP/RPC success;
    - `committed_turn=0`;
    - actions/history empty;
    - setup/opening reset state;
    - canonical `scene` exists and validates;
    - the five deleted keys are absent;
    - retained `npc_relationship_state`, sexual/media-compatible state, `npc_stats`, CSA, progression, physical/clothing and identity structures are not structurally lost.
11. Do not rerun Setup/Opening/two gameplay turns merely to reproduce evidence already proven in the preceding rollout. Only run further gameplay if the reset-only correction itself exposes a new deterministic defect that requires one minimal probe.
12. Stop after clean TEST reset/readback. No Production/manual-game access, new branch/PR, merge, Ready transition, provider retry, or unrelated cleanup.

## Architecture constraints

- Deletion-first remains binding: do not reintroduce deleted fields as compatibility state.
- One durable domain -> one canonical writer.
- Canonical Scene v1 remains required; fix reset canonicalization, not validator strictness.
- Recent six raw Story + older natural-language `turn_summary` remains narrative continuity authority.
- `npc_relationship_state` is retained only because a current UI/sexual-record consumer exists; do not expand it into general narrative-memory authority.
- Scene/physical/clothing/sexual-media/npc_stats/CSA/progression/stable identity/literal choices/Mind Monitor/TTS remain protected real-consumer systems.
- No generic ledger, semantic taxonomy, open-fact replacement, alias map, parser generation, fuzzy repair, retry, or fallback Story.

## Completion

On success or a new deterministic blocker:
- update this file to `WAITING_REVIEW` in one docs-only completion commit;
- report exact source/test/migration SHA, corrective migration name/version, live function body/ACL facts, dedicated TEST reset result/readback, deleted-key absence, protected-structure checks, and final branch SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not create the next task yourself.

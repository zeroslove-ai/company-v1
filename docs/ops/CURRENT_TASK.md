# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-final-residue-test-rollout-v2
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309810778` — ACCEPTED_BLOCKED_EVIDENCE for `minimal-story-runtime-final-residue-test-rollout-v1`.
Previous terminal: `5309781084`.
Reviewed source/test SHA: `907eee3bcace9918e4965221eec2f44719213682`.
Reviewed source/docs SHA before rollout: `ed3437c2563863a768793f4f8b1989b892ccf09c`.
Previous rollout docs SHA: `affb8dc86f616514d6398802a188012c5662befa`.

The previous rollout already completed the structural TEST rollout work:
- migration `20260817000100 / company_v1_final_residue_closure` is live exactly once on TEST;
- live helper/validator ACL contract was verified;
- TEST API version `1011e5a2-f034-40ae-bef7-6cdd76b266a6` and TEST Frontend version `1a3c1416-5362-4658-a8fe-465006a342dd` were deployed from the reviewed executable-equivalent lineage;
- reset, Setup and Opening succeeded;
- Opening returned four non-empty unique provider-authored literal choices;
- final cleanup reset succeeded.

Independent operator verification after the BLOCKED terminal confirms the disposable TEST game is clean at committed_turn=0, Level 1, setup/opening not_started, canonical scene=`setup`, turn/action counts 0, and removed save roots (`scene_state`, `last_npcs_present`, top-level focal/last-speaker, `last_choices`, `last_choice_meta`) are absent.

The previous task stopped only because the OS TEMP evidence verifier incorrectly required `scene_id=setup` immediately after Opening. A canonical post-Opening scene of `scene_id=opening` with Opening participants is valid. The removed `/narrative.js` expectation in the old frontend smoke script is also stale and is not a product acceptance authority.

Disposable TEST game authorized for this rollout only:
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.

Forbidden game IDs — do not read, mutate, reset, or use for evidence:
- preserved manual: `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- production/sentinel: `11111111-1111-4111-8111-111111111111`.

Production is forbidden.

## Objective

Finish the one incomplete bounded TEST acceptance from V1 without reopening architecture or migration work. Prove the already-live final-residue contract through one fresh reset → Setup/Opening → exact provider literal Turn 1 → Story/Extract/Commit → committed readback/replay → final reset sequence.

This is not another product-play loop and not a source-fix task.

## Required execution

1. Freeze START HEAD. Verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Preflight only; do not redo completed rollout work:
   - verify migration ledger contains exactly one `20260817000100 / company_v1_final_residue_closure`;
   - verify `company_minimalize_save_v1(jsonb)` and `validate_company_save_v1(jsonb)` still match the already-reviewed live ACL/contract;
   - verify TEST API and Frontend identities/source equivalence. If the exact prior versions are still live, do not redeploy. If source identity drifted from the reviewed lineage, STOP as BLOCKED rather than silently broadening scope.
3. Do not run the stale frontend smoke assertion requiring removed `/narrative.js`. Current root HTML/current asset readability may be checked directly if needed.
4. Run exactly one canonical reset of only the disposable TEST game. Verify baseline: turn/action/history 0, Level 1, setup/opening not_started, canonical scene.version=1 / scene_id=`setup` / empty presence, and removed choice/scene/location mirrors absent.
5. Run Setup + Opening exactly once through normal TEST API routes.
6. Verify Opening succeeds with exactly four non-empty unique provider-authored literal choices and committed Opening story/parsed blocks/choices.
7. Evidence contract correction: after Opening, canonical `scene_id=opening` (or another canonical non-setup Opening scene produced by the accepted server flow) is valid. Do NOT require it to remain `setup`. Verify only that `save.scene` is canonical and removed legacy mirrors remain absent.
8. Select one actual Opening provider literal and send that exact string as Turn 1 `player_action`. No numbered shorthand, metadata substitution, normalization, or synthetic choice.
9. Run Turn 1 Story → Extract → Commit once. No provider retry/regeneration.
10. Verify committed Turn 1/readback:
   - commit succeeds and committed_turn becomes 1;
   - stored player_action equals the selected literal exactly;
   - committed `parsed_blocks.choices` is ordinary choice readback authority;
   - `last_choices` / `last_choice_meta` do not reappear;
   - `scene_state`, `last_npcs_present`, top-level focal/last-speaker, player location mirrors, and NPC present/scene/location mirrors do not reappear;
   - canonical `save.scene` remains valid;
   - `world_state.game_time` remains present/coherent;
   - context/display identity/scene comes from the canonical server projection/catalog and contains no `compatibility_mode`.
11. Perform same-action Story/Extract/Commit replay for Turn 1 and verify replay/idempotence: no extra committed turn and no resurrected removed mirrors.
12. Verify `/api/context` and `/api/history` after Turn 1. Current Story/parsed blocks/literal choices must remain usable without legacy fallback invention.
13. Finish with exactly one canonical reset of the disposable TEST game. Reverify committed_turn=0, history/action=0, Level 1, setup/opening not_started, canonical scene=`setup`, and all removed mirrors/choice roots absent.
14. Evidence may be stored under OS TEMP only. Do not commit evidence artifacts.

## Stop-on-defect policy

One sequence only. On the first deterministic product/runtime defect, capture exact minimal evidence, perform final disposable cleanup reset if safe, and STOP.

Do not stop for the already-known invalid evidence expectations:
- post-Opening scene is not required to remain `setup`;
- removed `/narrative.js` is not required to exist.

Do not patch source or evidence tooling in the repository during this task. Do not retry/regenerate until lucky.

## Architecture constraints

- Story remains narrative authority; Extract remains one grounded observer; Commit remains structural transaction authority.
- `save.scene` is the sole active durable scene/location/presence/focal/last-speaker authority.
- Opening choices live in committed Opening projection; ordinary choices live in committed parsed blocks. No fresh save choice cache.
- `world_state` remains canonical game-time state.
- Physical/clothing/sexual/CSA mechanics remain narrow proven side systems; do not expand or infer them in this smoke.
- Preserve the existing persisted legacy Extract read-only boundary.
- No generic relationship/event/emotion/work/open-fact memory ledger, compatibility bag, semantic gateway, new parser, fuzzy repair, retry/regeneration, provider/model change, or semantic gate.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- TEST migration/function/ACL read-only verification;
- direct current TEST frontend asset readability checks;
- disposable TEST game reset/setup/opening/one ordinary Turn 1/context/history/replay/final reset;
- read-only TEST DB verification for that disposable game;
- OS TEMP evidence;
- docs-only completion record and one immutable Issue #68 terminal report.

Not authorized:
- migration application/reapplication/repair/rollback or any DDL;
- API/frontend deployment if the reviewed prior source identity is still live; if identity drift prevents proof, STOP;
- source/runtime/test/content/config edits;
- Production or forbidden-game access;
- retry/regeneration/provider/model changes;
- parser/fuzzy/semantic/compatibility replacement;
- extra product-play loops;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the already-live reviewed contract survives one bounded fresh sequence through exact literal Turn 1, committed readback, replay/idempotence and final reset, with all retired choice/scene/location mirrors absent throughout and no compatibility replacement introduced.

On PASS or first real deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post exactly one immutable terminal report to Issue #68 with START SHA, verified live migration/API/Frontend identity, reset/setup/opening/Turn1/replay/readback/final-reset evidence, forbidden-operation confirmation and final docs SHA;
- STOP. Do not generate the next CURRENT_TASK yourself.

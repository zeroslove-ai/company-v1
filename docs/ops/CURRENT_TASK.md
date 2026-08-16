# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: opening-literal-choice-live-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306515927` accepted `canary-opening-literal-choice-roundtrip-v1`.
Reviewed harness/source-test SHA: `545541d8e83a89e5b090d201ae5e2c2952894f63`.
Registration parent/docs completion SHA: `c53cd252fdce1d764214206cda60124202bdabf5`.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production is forbidden.

## Proven state

- Setup/Opening world-authority migration is already applied on TEST and live SQL semantic allowlists were removed while dynamic registered-ID integrity remains.
- One later bounded Opening attempt already produced exactly four non-empty unique provider-authored literal choices.
- The remaining acceptance gap was only that the canary used its own free text rather than selecting one returned Opening literal.
- The reviewed harness now supports `--opening-choice-index 0..3` and passes the selected `canonical_choices[index]` unchanged through the normal ordinary action path.
- Harness/test changes do not require API/frontend redeploy.

## Objective

Close the exact Opening-literal round-trip gap on the dedicated TEST game using the reviewed canonical harness. This is a bounded live evidence task, not a new gameplay redesign.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED. Confirm no executable worker/runtime delta exists after reviewed harness SHA except docs/workflow descendants.
2. Read-only verify TEST migration ledger/live `reserve_company_player_setup` still reflects the already-applied world-authority contract: no SQL department/position/body/speech/heroine semantic arrays; dynamic registered-ID validation remains.
3. Do not redeploy API/frontend solely for the harness change. Reuse the currently deployed TEST runtime unless health/readback proves it no longer matches the reviewed runtime lineage.
4. Use only dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
5. Canonical reset once at start if needed, then valid Setup and Opening.
6. Opening must return exactly four canonical/provider-authored non-empty unique literal choices. No retry/regeneration, no provider/model/config change, no fallback/truncate/pad.
7. Run the reviewed canonical canary with an explicit valid `--opening-choice-index` selecting one actual returned literal.
8. Prove the selected literal is submitted unchanged as Turn-1 `player_action` and survives into reserved action / committed turn readback without numbering, metadata, normalization, or semantic substitution.
9. Complete Turn 1 Story -> Extract -> Commit. Verify committed `player_action` exactly equals the selected Opening literal.
10. Exercise same-action replay/idempotence for Turn 1 and prove action identity, committed_turn and save_revision invariants.
11. Run one ordinary free-text Turn 2 only as a bounded sanity check that free-text mode remains unchanged after choice-driven Turn 1. Do not expand into a broad multi-turn acceptance in this task.
12. Verify canonical scene remains readable, removed Scene mirrors remain absent, and no deleted save-level semantic residue reappears.
13. Verify `turn_summary` and committed `parsed_blocks` are present for committed ordinary turns. Do not introduce or require legacy summary fields.
14. Final canonical reset once; verify committed_turn=0, setup/opening not_started, zero actions/turns, canonical scene present, and dedicated TEST game clean.
15. Preserve evidence outside the repo if needed. Do not commit generated live artifacts.
16. STOP after first deterministic PASS or first deterministic blocker. No retry, workaround, source patch, second migration, or redeploy in this task.

## Architecture constraints

- Provider authors exactly four literal choices; harness transports one unchanged and never authors alternatives.
- Free text remains an ordinary separate gameplay path.
- Story -> Extract -> Commit remains the only ordinary turn path.
- Recent six raw Story + older natural-language `turn_summary` remains narrative continuity authority.
- No open-fact/relation/event/emotion/work semantic-memory system may be reintroduced.
- Canonical `save.scene` remains the only active scene/location/presence/focal/last-speaker authority.
- Compact clothing, npc_stats, CSA institutional state, progression, physical/sexual/media presentation adapters and stable identities remain protected current consumers.
- No compatibility bag, semantic taxonomy/gate, fuzzy repair, parser relaxation/new parser, retry/regeneration, provider/model/temperature/token change, or server-authored choice fallback.

## Authorized operations

Authorized:
- read-only Git/PR/source inspection;
- read-only TEST DB/function/migration inspection;
- dedicated TEST reset/setup/opening and bounded two-turn live flow described above;
- same-action replay/readback;
- final TEST reset;
- external temporary evidence artifact only.

Not authorized:
- source/test/migration/config edits;
- new migration or migration rollback;
- API/frontend deployment unless pre-run readback proves a genuine reviewed-lineage mismatch, in which case STOP and report rather than deploying automatically;
- Production access;
- any access to preserved manual game;
- provider/model/config changes or retries;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if an actual provider-returned Opening literal is selected by the reviewed harness and committed byte-for-byte/string-for-string as Turn-1 `player_action`, Story/Extract/Commit and replay succeed, free-text Turn 2 remains ordinary, and final TEST reset is clean.

A provider Opening that does not yield canonical exactly-four choices, any literal rewrite/substitution, or any deterministic runtime failure is BLOCKED evidence. Do not retry or patch in this task.

## Completion

On PASS or first deterministic blocker:
- update this file to `WAITING_REVIEW` in one docs-only completion commit;
- report exact START SHA, reviewed harness SHA, deployed runtime identity if observed, selected literal/index evidence, Turn-1 commit/replay result, optional Turn-2 free-text result, final reset/readback, operations performed/forbidden, and FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate the next task yourself.

## Execution result — BLOCKED / WAITING_REVIEW

- `START_HEAD`: `964f2ddc871e4e69ed4af3212ef15bd8ad149ddb`
- `REVIEWED_HARNESS_SHA`: `545541d8e83a89e5b090d201ae5e2c2952894f63`
- Worker health readback: HTTP 200, `ok=true`, `edition_id=company-v1`; no redeploy performed and no Worker version change was introduced.
- TEST migration readback: `20260816045221 / company_v1_setup_opening_world_authority` present. `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)` remains SECURITY DEFINER with `search_path=public, pg_temp` and validates registered IDs across `characters` + `general_npcs`.
- One bounded TEST canary invocation used `--opening-choice-index 0` on game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; health/setup/opening/Turn 1/Turn 1 replay/Turn 2/final reset all returned transport success.
- Opening returned four non-empty unique canonical choices (`raw_count=4`, `canonical_count=4`). Preserved artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-opening-literal-choice-live-closure.json`, SHA-256 `5164B0540D3DE59E1AC9DBC4A8A8F118DB4F7A7A45FE3F6E15F3F3556A2B3314`.
- Acceptance blocker: artifact recorded `next_player_action.mode=free-text`, `choice_index=null`, and the hardcoded free-text Turn 1 action, despite the explicit CLI index. The selected Opening literal was not submitted or committed. The observed harness wiring reads `args.openingChoiceIndex` from `parsed.args` instead of the parsed option field; no source patch or retry was attempted.
- Turn 1 Story/Extract/Commit and same-action Story/Extract/Commit replay passed, with `committed_turn=1` and `save_revision=1011` unchanged across replay, but against the wrong free-text action.
- Turn 2 free-text Story/Extract/Commit passed; context/history readback reached `committed_turn=2`, `save_revision=1012`, two records, and parsed blocks present.
- Final reset readback: `committed_turn=0`, `save_revision=1013`, `processing_status=idle`, setup/opening `not_started`, `csa_active=[]`, canonical scene present, history/actions/turns `0`.
- TEST DB writes: only the explicitly authorized bounded canary/reset path; no out-of-scope DB writes. Migration/DDL application: `0`.
- API/frontend deployment: `0`; Production/preserved manual-game access: `0`; provider/model/config/retry changes: `0`.
- `FINAL_DOCS_SHA`: pending this docs-only completion commit
- Status: `WAITING_REVIEW`; operator review is required before any harness correction or new live attempt.

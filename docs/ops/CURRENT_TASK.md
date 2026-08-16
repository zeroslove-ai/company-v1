# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: client-readback-projection-test-rollout-v2
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307574326` ACCEPTED `opening-story-choice-protocol-unification-v1`.
Accepted combined lineage:
- client/readback authority source: `f5d93f9563fa23f16c1e599e4a51e38c846c890d`;
- provider choice protocol closure / current branch head: `a176e997f3dac1e03968f92b07ab50f37e1b49ec`.

Previous rollout V1 evidence (`5307484215`) is accepted blocked evidence:
- TEST API exact `f5d93f9` was deployed as Worker Version `e4b62c5e-9d43-40e9-addb-e37db8c97d89`;
- TEST frontend exact `f5d93f9` was deployed as Worker Version `62a31a54-55c9-4c94-bb99-e9894817560e`;
- setup reached Opening, then provider emitted zero `[CHOICE]` blocks and Opening stopped before commit;
- no Turn 1/2 gameplay was attempted;
- final reset returned the disposable TEST game to clean turn 0.

The deterministic blocker was addressed at source by `a176e997...`: Opening and ordinary Story now share one mandatory exact-four provider `[CHOICE]...[/CHOICE]` protocol. No fallback/retry/parser repair was added.

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate.
Production is forbidden.

## Objective

Re-run the previously blocked committed-readback/frontend projection rollout once on the accepted combined lineage. Prove that the choice-protocol root fix allows Opening to commit and that the accepted client/readback authority cut works through refresh/recovery, two committed turns, replay, history, and final reset.

This is a bounded TEST-only rollout, not another source-change task.

## Required execution

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Verify exact source lineage before deployment:
   - API runtime must include current accepted head `a176e997f3dac1e03968f92b07ab50f37e1b49ec`.
   - Frontend source did not change after accepted readback SHA `f5d93f9563fa23f16c1e599e4a51e38c846c890d`; explicitly prove this. If the existing TEST frontend Worker `62a31a54-55c9-4c94-bb99-e9894817560e` is source-equivalent to current frontend files, do not redeploy it merely to change commit identity. If not source-equivalent, deploy the current reviewed frontend lineage once.
3. Run the established Stage-B action-contract gate and relevant Wrangler dry-run(s). No source patch is authorized.
4. Deploy the TEST API Worker once from exact current accepted head `a176e997...` if the deployed API identity does not already contain that prompt/runtime lineage. Verify health/version HTTP 200 and `edition_id=company-v1`.
5. Canonically reset only the disposable TEST game and verify turn/action/history empty, setup/opening not_started, canonical scene setup, Level 1 baseline.
6. Run one existing-canary scenario attempt only. Use the existing supported option for an actual Opening choice literal; do not create another harness.
7. Setup + Opening must succeed with exactly four provider-visible / parsed / canonical choices. Capture the four exact literal strings.
8. Turn 1 must send one actual Opening provider-returned choice literal unchanged as `player_action`. Complete Story -> Extract -> Commit.
9. Refresh/readback after Turn 1 and verify the accepted readback authority:
   - visible/canonical choices come from committed `parsed_blocks.choices`, not `save.last_choices` or top-level turn choices fallback;
   - scene comes from server `display.scene` / canonical scene authority;
   - heroine stats/relationship summary use committed `display.character_details` projection when supplied;
   - active CSA/player capability use server display projection, not frontend raw-save reconstruction;
   - session pending/transient streaming presentation is replaced by committed context after refresh.
10. Turn 2 must use one free-text player action and complete Story -> Extract -> Commit without provider retry/regeneration.
11. Verify history uses committed parsed blocks / committed choices and does not resurrect removed raw-history or duplicate choice fallback authority.
12. Perform same-action replay/recovery on one committed ordinary turn and verify idempotent Story/Extract/Commit result and committed-turn invariance.
13. Browser/Playwright numbered-key proof remains optional evidence only because the repository has no established browser helper. Do not invent a new browser harness or block otherwise-valid server/frontend readback acceptance solely on that absence. The literal-choice roundtrip itself is mandatory.
14. Finish with one canonical reset of the disposable TEST game and independently verify turn 0, history 0, action 0, setup/opening not_started, Level 1, canonical scene setup.
15. Record deployed Worker versions/source identity, exact Opening choice count/literal used, Turn 1/2 actions, refresh/readback assertions, replay result, and final cleanup.

## Stop-on-defect policy

One scenario attempt only.

On the first deterministic product defect:
- capture the failing stage/turn/action and smallest decisive raw/structured evidence;
- perform cleanup reset if safe;
- STOP as BLOCKED for operator review.

Do not retry/regenerate provider output until lucky. Do not patch source, prompt, parser, frontend, model/provider settings, retry logic, fuzzy repair, compatibility layer, semantic gate, DB schema, or migration inside this rollout.

## Architecture constraints

- Provider-authored exactly-four literal choices remain the sole choice authority.
- Frontend displays committed server authority; it is not a semantic writer.
- Committed `parsed_blocks` remain replay/history/choice authority.
- Server `display.scene`, `display.character_details`, `display.active_csa`, and `display.player_capability` are presentation/readback projections of committed state, not independent durable writers.
- Preserve the one persisted legacy Extract read-only boundary; do not expand compatibility.
- Preserve canonical scene, `npc_stats`, physical/clothing/sexual narrow mechanics, CSA institutional state, progression, media/TTS/Mind Monitor, natural-language turn-summary memory.
- No new semantic memory, relationship/event ledger, parser generation, generic compatibility bag, retry/regeneration, or provider/model workaround.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- TEST API deployment of exact accepted head if required;
- TEST frontend deployment only if current deployed frontend is not source-equivalent to accepted current frontend files;
- disposable TEST reset/setup/opening/Turn 1/Turn 2/context/history/replay;
- read-only TEST DB verification needed for acceptance evidence;
- docs completion record and immutable Issue #68 terminal report.

Not authorized:
- source/runtime/test behavior edits;
- migration/DDL authoring or application;
- Production access/deployment;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes;
- retry/regeneration;
- new harness/browser framework/parser/fuzzy repair/semantic gate/compatibility layer;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if Opening now provides and commits exactly four provider-authored literal choices, one literal survives unchanged as Turn 1 input, a free-text Turn 2 commits, committed refresh/recovery uses the accepted server readback authorities without stale frontend/save fallback precedence, history/replay are correct and idempotent, and final TEST reset is canonical.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact START/FINAL docs SHA, deployed identities, Opening choice evidence, Turn 1/2 results, readback assertions, replay result, final reset, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not generate the next task yourself.

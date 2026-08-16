# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: client-readback-projection-test-rollout-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307426167` ACCEPTED `client-readback-projection-authority-closure-v1`.
Reviewed executable/source lineage: `f5d93f9563fa23f16c1e599e4a51e38c846c890d`.

Accepted source result to prove live:
- refresh/recovery choices come from Opening server projection or latest committed `parsed_blocks.choices`;
- frontend no longer gives `save.last_choices` or duplicate top-level `game_turns.choices` authority;
- active CSA UI readback uses server `display.active_csa` / `display.player_capability`, with no frontend semantic reconstruction from raw save;
- scene and heroine character details prefer server `display.scene` / `display.character_details`;
- raw `npc_relationship_state` is retained only because current server relationship/sexual-record/evidence consumers still require it; frontend no longer exposes it as a competing raw relationship authority when committed display details exist;
- `npc_stats`, canonical scene, committed `parsed_blocks`, natural-language turn summaries, the single persisted legacy Extract read-only boundary, sexual mechanics, progression, media/TTS/Mind Monitor remain preserved product boundaries.

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate.
Production is forbidden.

## Objective

Perform one bounded TEST-only rollout/acceptance of the exact reviewed client/readback source lineage. Prove that API context + deployed frontend refresh/recovery now use the committed server projections without resurrecting stale save/client fallback authority.

This is a rollout task, not a new source-refactor task. Do not patch source merely to obtain prettier evidence.

## Required execution

1. Freeze START HEAD. Verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`, and branch HEAD is the registered task lineage descending only from reviewed SHA `f5d93f9563fa23f16c1e599e4a51e38c846c890d` plus this docs registration.
2. Verify exact currently deployed TEST identities for API Worker `game-proxy-company-v1` and TEST frontend `gamebuilder-company-v1`.
   - If either does not contain the reviewed `f5d93f...` lineage, deploy that exact reviewed lineage to the corresponding TEST Worker only.
   - No Production deployment. No unrelated rebuild/refactor.
3. Run existing Stage-B/action contract gate and deployment dry-run checks required by the established TEST process. No migration/DDL apply is authorized or needed.
4. Health-check both TEST API and TEST frontend after deployment.
5. Canonically reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`. Verify turn/action/history empty, setup/opening not_started, canonical scene `setup`, Level 1.
6. Run Setup + Opening once. Verify Opening provides exactly four canonical provider choices and server context exposes the Opening projection.
7. Commit Turn 1 using one actual provider-returned Opening choice literal unchanged. No numbering rewrite/server-authored substitute.
8. Fetch fresh committed context after Turn 1 and verify readback authority directly:
   - latest UI choices equal latest committed `recent_turns[-1].parsed_blocks.choices` when present;
   - stale `save.last_choices` or top-level turn `choices` cannot override that committed parsed choice source;
   - `display.scene` matches canonical committed scene and is the frontend presentation source;
   - `display.character_details` is present for registered heroines and reflects committed stats/relationship summary projection without frontend raw-relationship precedence;
   - `display.active_csa` / `display.player_capability` are the CSA UI source; an empty active list is valid and must not trigger raw-save semantic reconstruction.
9. Exercise one current frontend numbered-choice path **only through an already-existing browser/E2E/recovery helper if one exists**: entering `1`/equivalent while four displayed choices are present must send the exact displayed literal. Do not create a new browser harness just for this task. If no established live frontend helper exists, record that limitation and rely on the accepted behavioral regression plus deployed frontend identity; continue the live API readback checks without inventing a harness.
10. Commit one additional free-text ordinary turn. Refresh/reload committed context and verify transient/pending client state does not override committed server readback.
11. Verify `/api/history`/existing history path returns choices from committed `parsed_blocks` and does not require raw Story reparsing or duplicate top-level choice fallback.
12. Perform one same-action replay/recovery using the established helper and verify committed turn identity/state remain idempotent.
13. Do not force CSA activation, sexual activity, clothing changes, or relationship changes merely for coverage. This task validates readback authority, not every positive gameplay mechanic.
14. Record exact deployed API/FE identities, Turn 1 literal, Turn 2 free text, context/display choice/scene/detail/CSA evidence, frontend numbered-choice result if an established helper exists, history source, replay result, and any bounded limitation.
15. Finish with one canonical reset of the disposable TEST game. Verify committed_turn 0, history/action 0, setup/opening not_started, Level 1, canonical scene `setup`.

## Stop-on-defect policy

Run one bounded acceptance attempt. Do not retry/regenerate provider output to obtain a preferred choice or display state.

On the first deterministic product defect:
- capture the smallest relevant API/frontend/context/history evidence;
- reset the disposable TEST game if safe;
- STOP as BLOCKED/FAILED for operator review.

Auxiliary evidence formatting or absence of an existing browser helper is not a product defect if the deployed product path and committed readback invariants are otherwise proved. Do not create another micro harness task for that alone.

## Architecture constraints

- Frontend is presentation only and cannot become a gameplay/semantic writer.
- `game_save + game_turns` committed state is authority; server display may reshape it for UI but cannot invent a second truth.
- Provider-authored choice literals remain unchanged.
- Committed `parsed_blocks` remain replay/history narrative authority.
- Preserve the single persisted legacy Extract read-only boundary; do not restore persisted narrative/raw Story reparsing.
- `npc_relationship_state` is not general narrative-memory authority; do not expand it. Do not derive consent/comfort/trust/affection from CSA or sexual mechanics.
- No `open_facts`, `open_observations`, general relation/event/emotion/work ledger, entity graph/vector DB, importance score, new summary/memory LLM, compatibility layer, semantic gate, fuzzy repair, parser generation, retry/regeneration, provider/model/config changes.
- Historical applied migrations and preserved evidence are immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- TEST API and TEST frontend deployment of exact reviewed lineage only if needed;
- disposable TEST reset/setup/opening/2 ordinary turns/context/history/replay;
- established existing TEST frontend/browser/E2E helper if present;
- read-only TEST DB verification needed for evidence;
- docs completion record and immutable Issue #68 terminal report.

Not authorized:
- source/runtime/test behavior edits;
- migration/DDL authoring or application;
- Production access/deployment;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes or retries/regeneration;
- new parser/harness/compatibility/semantic layer;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS if the exact reviewed API+Frontend lineage is live on TEST and the bounded flow proves committed server readback wins after refresh/recovery for choices, scene, character details and CSA presentation, history uses committed parsed blocks, replay is idempotent, and final TEST reset is canonical.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with START SHA, reviewed/deployed identities, decisive live evidence, any bounded limitation, final reset, forbidden-operation confirmation and final docs SHA;
- STOP for operator review. Do not generate the next task yourself.

## Execution result — deterministic Opening blocker

Execution identity:

- `TASK_ID`: `client-readback-projection-test-rollout-v1`
- `CURRENT_TASK_BLOB_SHA`: `626b6e3ca91c8fefade8b003db7518aaa98fd90e`
- `START_HEAD`: `4e7bc4b2b75935d109d7481636bb042c6b0fc719`
- `REVIEWED_EXECUTABLE_SHA`: `f5d93f9563fa23f16c1e599e4a51e38c846c890d`
- `FINAL_SOURCE_DEPLOY_LINEAGE`: `f5d93f9563fa23f16c1e599e4a51e38c846c890d` from detached exact-review worktree

Deployment and gate evidence:

- Stage-B action contract gate: PASS using the existing read-only TEST catalog.
- API and frontend Wrangler dry-runs: PASS.
- Exact reviewed TEST API Worker `game-proxy-company-v1`: Version `e4b62c5e-9d43-40e9-addb-e37db8c97d89`, deployed `2026-08-16T12:36:34.7301629Z`.
- Exact reviewed TEST frontend Worker `gamebuilder-company-v1`: Version `62a31a54-55c9-4c94-bb99-e9894817560e`, deployed `2026-08-16T12:36:45.4575159Z`.
- API `/health` and `/api/version`: HTTP 200, `ok=true`, `edition_id=company-v1`.
- Frontend root: HTTP 200, static application marker present.

Bounded live attempt:

- Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
- Existing canary: `--cut1-authority --reset-if-dirty --opening-choice-index 0`; no retry or regeneration.
- Setup reached the Opening request; Turn 1/2, Extract, Commit, history-success, and replay were not attempted after the first deterministic Opening failure.
- Provider-visible raw SSE contained `0` `[CHOICE]` control markers; raw Story was unavailable at the terminal error; parsed/canonical choice count was `0`; `commit_company_opening` was not reached and no `p_choices` was sent.
- Opening terminal: HTTP `200` SSE `error`, `invalid_request`, message `opening choices must contain exactly four items`, `retryable=false`.
- Preserved artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-client-readback-projection-test-rollout.json`.
- Artifact SHA-256: `479DAFB73445D7376C4B63052B1EC2A9DEAD9C90C7EF9C343C01C7E044A5F846`.
- No established browser/Playwright/E2E helper exists in the repository; frontend numbered-choice browser proof is recorded as a bounded limitation. The existing canary exact-literal API path and accepted behavioral regressions were not used to mask the live Opening blocker.

Final reset and independent readback:

- Canary final reset returned HTTP 200; independent read-only context/history readback passed.
- `committed_turn=0`, `save_revision=1047`, `processing_status=idle`, `player_setup=not_started`, `opening_state=not_started`, `scene.version=1`, `scene.scene_id=setup`, `csa_active=[]`, history `0`, recent turns `0`.

Result: `BLOCKED` for operator review. No source/test behavior change, migration/DDL apply, Production access, preserved-manual-game access, provider/model change, retry, parser workaround, or additional gameplay was performed.

# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: legacy-replay-compatibility-residue-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307279051` ACCEPTED `deep-level7-live-acceptance-v10-physical-memory-runtime`.
Reviewed executable SHA: `e4c15345c1c23afda85df09381830421d8428d73`.
Accepted live docs SHA / registration parent: `f0a620f7fbf45f9f33485951ac9d9d6ece6fe9a7`.

The V10 broad TEST run proved 16 ordinary Story -> Extract -> Commit turns, literal/free-text actions, canonical scene/identity, latest-six raw + older chronological `turn_summary` memory, replay/idempotence and final canonical reset. Coverage must not be overstated: the run did not naturally produce a durable physical/clothing mutation, did not reach sexual mechanics, and had no active CSA trigger. Do not rerun that same scenario just to manufacture those outcomes.

Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate. Production is forbidden.

Operator read-only TEST DB baseline excluding that preserved game:
- `game_turns`: 18 rows total, all on game `11111111-1111-4111-8111-111111111111`;
- 18/18 have usable committed `parsed_blocks.blocks`;
- 18/18 have legacy `extract_delta.state_delta` shape rather than fresh `extract_version=2`.
This is evidence only: do not assume either adapter deletion or preservation until actual replay callers are traced.

## Objective

Close the remaining historical parser / persisted Extract / replay compatibility residue in one caller-and-data-driven source/test cut. Fresh generation must remain the strict current parser/Extract contract; committed structured data must remain replay authority. Delete superseded compatibility readers, aliases, adapters, fixtures and tests only where current caller + supported stored-data proof is complete. Keep at most one explicit read-only historical boundary where real supported data still requires it.

This is not another architecture memo. Perform the proof and implementation in the same cut where safe.

## Required work

1. Freeze START HEAD. Verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`, and that no executable branch movement occurred after the accepted V10 docs head except this task registration.
2. Trace end-to-end replay/history/recovery callers for:
   - fresh narrative parser versus persisted/historical narrative parser/fallback;
   - committed `game_turns.parsed_blocks` and action/turn structured blocks;
   - `src/engine/runtime-core/persisted-extract-observation.js`;
   - `src/engine/runtime-core/legacy-extract-adapter.js`;
   - all callers of `normalizePersistedExtractObservation` / legacy `state_delta` adaptation;
   - Story replay, Extract replay, Commit replay/readback, history API, recovery/product projection and tests/fixtures.
3. Treat committed `parsed_blocks` as canonical replay/presentation authority whenever a stored turn has a usable `blocks` array. Raw Story reparsing is fallback-only historical compatibility and must not compete with committed blocks.
4. Use read-only TEST DB catalog/data proof excluding preserved manual game. Quantify supported stored rows by shape (`parsed_blocks`, `extract_delta`, `post_save`, record_status/revision where relevant). Do not inspect, read, reset or otherwise access preserved manual game `78fb...`.
5. Narrative fallback decision:
   - if every currently supported non-preserved stored row and every active replay/history caller already has committed usable `parsed_blocks`, delete zero-caller raw-story reparse adapters/exports/tests that no longer protect a supported path;
   - if an explicit current reader still requires fallback, keep exactly one read-only historical boundary and document its deletion condition. Do not create a new parser generation or compatibility wrapper.
6. Persisted Extract decision:
   - TEST baseline currently has 18/18 legacy `extract_delta.state_delta` rows. Determine whether current replay/recovery actually requires semantic re-normalization of those deltas, or whether committed `post_save`, committed turn identity and/or other structured data already provide replay authority;
   - if the legacy adapter is no longer needed by any supported reader, delete it and its stale fixtures/tests in this cut;
   - if it is still required for those rows, keep it only behind `normalizePersistedExtractObservation` (or one equivalent explicit historical read boundary), prove fresh provider output cannot enter it, and delete any duplicate/public aliases or semantic behavior that exceed historical read compatibility.
7. Historical compatibility must be inert. It may deserialize old data for read/replay, but it must not:
   - write new semantic state;
   - resurrect `open_facts`, `open_observations`, general relation/event/emotion/work ledgers;
   - become a second Story/Extract truth authority;
   - normalize arbitrary fresh narrative meaning into a closed semantic taxonomy.
8. Remove stale compatibility-only tests/fixtures/source-string assertions when their protected caller/data path is gone. Replace them with behavioral replay/recovery tests at the surviving canonical boundary.
9. Inspect old RPC aliases / action-history fallback aliases encountered in the same replay path. Delete only zero-caller source aliases in this cut. If DB function removal would require DDL, identify the exact current caller first; author at most one additive migration candidate only if necessary for a proven dead current canonical alias, but do not apply it in this task.
10. Do not expand into unrelated UI cosmetic/donor naming cleanup. However, if a frontend/recovery reader is the only reason a legacy replay field survives, name that exact consumer and deletion condition.
11. Preserve all proven current product boundaries:
   - strict fresh parser contract;
   - committed `parsed_blocks` authority;
   - literal choices;
   - canonical scene/location/presence;
   - recent-six raw + older `turn_summary` memory;
   - compact clothing / evidenced physical state;
   - `npc_stats`, player sexual mechanical state, evidenced sexual event ledger;
   - CSA institutional lifecycle/context;
   - progression, image/media/TTS, Mind Monitor;
   - transaction/idempotence/replay identity.
12. Run focused persisted/replay/history/recovery tests, full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`. Test count is secondary; report which historical/canonical invariants were proved.

## Architecture constraints

- Story LLM authors narrative; Extract LLM emits narrow grounded observations + one natural-language `turn_summary`.
- Fresh parser is generation/wire structure only, not semantic truth authority.
- Committed `parsed_blocks` are committed narrative replay authority.
- Commit is structural/transaction authority, not narrative interpreter.
- One supported historical compatibility need -> one explicit read-only boundary, not a web of adapters.
- No third parser generation, new semantic gateway, generic memory ledger, entity graph/vector DB, importance score, compatibility runtime, fuzzy repair, regex existence gate, retry/regeneration or provider/model changes.
- Do not keep dead code solely because old tests mention it.
- Historical applied migrations and immutable evidence are not edited.

## Authorized operations

Authorized:
- read-only Git/PR/source/history inspection;
- read-only TEST DB catalog/data inspection excluding preserved manual game;
- source/test/config/docs cleanup on the canonical branch;
- at most one additive migration candidate authored but NOT applied, only if a proven dead current DB alias cannot otherwise be removed;
- local/focused/full tests and static checks.

Not authorized:
- TEST gameplay/setup/opening/reset or other DB writes;
- migration/DDL application;
- API/frontend deploy;
- Production access/deploy;
- any access to preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes, retry/regeneration;
- parser relaxation/new parser generation, fuzzy repair, semantic hard gate, new compatibility layer;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the task produces a concrete REMOVE/KEEP result from actual current callers plus supported stored-data shape, deletes zero-caller replay/parser/Extract compatibility residue in the same source/test cut, and leaves any unavoidable legacy reader as one narrow read-only boundary with an explicit deletion condition. Fresh Story/Extract/Commit behavior must not become more complex.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact deleted/kept compatibility surfaces, DB shape proof, focused/full tests, migration candidate status, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not generate the next task yourself.

## Execution result — legacy-replay-compatibility-residue-closure-v1

- Result: source/test/docs cleanup PASS; waiting for operator review.
- Start HEAD: `8cf1051913b4d1709896b589703b0db02270bdc0`.
- Reviewed executable SHA retained: `e4c15345c1c23afda85df09381830421d8428d73`.
- Supported non-preserved TEST shape, read-only and excluding `78fb1d94-266f-455a-bda4-7656cc2370c1`: game `11111111-1111-4111-8111-111111111111` has 18 `game_turns` and 18 `game_actions`; all 18/18 rows in both tables have usable `parsed_blocks.blocks`, all 18/18 rows have legacy `extract_delta.state_delta`, and 0 rows have fresh `extract_version=2`. All 18 turns have `post_save`, `record_status=active`, and `revision_number=1`.
- REMOVE: server `persisted-narrative-parser.js`, engine `narrative-parser.js`, frontend raw-history parser `src/frontend/pages/narrative.js`, their zero-caller exports/imports, raw-story replay/history fallback branches, parser-only tests, and superseded Story parser fixtures. The 2,289-line runtime acceptance fixture was parser-only and was removed with its parser-only tests.
- KEEP: `fresh-narrative-parser.js` for fresh generation; committed `parsed_blocks` for Story/opening/history/replay/presentation authority; `normalizePersistedExtractObservation()` plus its private `legacy-extract-adapter.js` path as the single read-only boundary required by the 18 legacy `state_delta` rows. `state-evidence-boundaries.test.mjs` now tests that public boundary rather than the private adapter.
- No old RPC/action-history alias had a current caller in the inspected Supabase client/replay path; no migration candidate was necessary.
- Canonical docs now describe committed parsed blocks as replay/history authority and persisted legacy Extract as the only historical read boundary.
- Focused persisted/replay/history/recovery tests: 116/116 PASS. Full `npm.cmd test`: 414/414 PASS. Changed JS/MJS syntax: 14 files checked. `git diff --check`: PASS.
- Forbidden operations: TEST gameplay/reset/write 0; migration apply 0; API deploy 0; frontend deploy 0; Production access 0; provider/model/retry/parser-generation/semantic-gate changes 0; preserved artifacts/manual game unchanged.
- SOURCE_TEST_SHA/FINAL_SHA: recorded in the immutable Issue #68 terminal report after commit/push.

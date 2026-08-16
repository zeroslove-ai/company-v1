# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: client-readback-projection-authority-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307363294` ACCEPTED `legacy-replay-compatibility-residue-closure-v1` at FINAL_SHA `4df637f3a59edc83eff2e11aa92b1d41d1f13689`.

Accepted architecture now includes:
- Story LLM as narrative author;
- Extract as narrow grounded observation + natural-language `turn_summary`;
- Commit as structural/transaction authority;
- latest six raw committed turns + older chronological turn summaries;
- committed `parsed_blocks` as replay/history narrative authority;
- exactly one persisted legacy Extract read-only boundary (`normalizePersistedExtractObservation()` + private legacy adapter) because supported TEST data still contains legacy `state_delta` rows;
- canonical `save.scene` authority;
- evidence-gated physical/clothing state;
- narrow `npc_stats`, player sexual mechanics, sexual event ledger, CSA lifecycle/capability, progression, media/TTS/Mind Monitor consumers.

Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate. Production is forbidden.

## Objective

Consolidate committed server readback -> frontend projection into one clear authority path and delete duplicate/stale client/save semantic mirrors and fallback authority where actual renderer/caller/data proof permits.

This is an implementation cut, not a docs-only audit. Inventory and delete in the same cut where proof is complete. Do not create a replacement compatibility layer.

Primary suspected residue in current source includes:
- frontend `npcView()` reading both raw `save.npc_relationship_state[id]` and server-projected `display.character_details[id].relationship_summary/relationship_record`;
- duplicate/fallback stat projections (`save.npc_stats` versus `display.character_details.stats`);
- duplicate CSA readback (`display.active_csa` versus frontend `fallbackActiveRules(save)`);
- duplicate choice readback (`save.last_choices` -> committed `turn.choices` -> committed `parsed_blocks.choices`);
- duplicate scene/readback aliases such as canonical `scene` plus presentation mirrors in the view model;
- any refresh/recovery/session cache path that can override or semantically diverge from committed server context.

These are hypotheses to prove, not automatic deletion targets.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`, and HEAD equals the registered task lineage.
2. Trace the active committed readback path end to end:
   - server context/history/display projection;
   - `game_save` / `game_turns` fields consumed for current UI;
   - frontend state/view-model/render/recovery paths;
   - refresh/reload/replay behavior;
   - renderer consumers for relationship/stats/CSA/choices/scene/Mind Monitor/player capability.
3. Build a concrete caller map for each overlapping frontend/readback surface and classify `CANONICAL`, `PRESENTATION_DERIVED`, `HISTORICAL_READ_ONLY`, or `REMOVE`.
4. Relationship projection:
   - inspect all writers/readers of `npc_relationship_state` and all server/frontend `relationship_summary` / `relationship_record` projections;
   - do not preserve a generic relationship semantic ledger merely because the field exists;
   - do not delete a current visible relationship/history feature unless its UI can read the same committed authority from an already-existing canonical projection;
   - do not derive consent/comfort/trust/affection from sexual events or CSA mechanics as a replacement;
   - if `npc_relationship_state` is now only a stale display mirror with no unique product consumer, remove its active writer/reader/default/validator/source tests in this cut and author one additive migration candidate if DB save-shape cleanup is structurally required. Do not apply it here;
   - if it still has a unique current product consumer, keep exactly that read-only/mechanical boundary and delete duplicate projections around it.
5. Stats projection:
   - `npc_stats` remains the narrow canonical mechanic where current UI consumes it;
   - remove duplicate client/server copies or fallback precedence that can disagree with committed state;
   - current UI after refresh must resolve the same stats as committed server context.
6. CSA projection:
   - `display.active_csa` / capability projection should be the current UI readback when provided by canonical context;
   - remove frontend semantic reconstruction from raw save (`fallbackActiveRules` or equivalents) if current server context always supplies the required projection and tests prove refresh/setup states;
   - if a startup/historical state genuinely lacks the display projection, keep only a structural empty/startup fallback, not a second semantic interpreter.
7. Choice projection:
   - provider-authored committed choices remain literal authority;
   - inspect `save.last_choices`, `game_turns.choices`, committed `parsed_blocks.choices`, stream/session state and button rendering;
   - choose one committed source for refresh/recovery UI and delete redundant precedence/fallback writers where proof permits;
   - no server-authored fallback choices, numbering, semantic normalization or rewrite.
8. Scene/readback aliases:
   - preserve canonical `save.scene` and any clearly presentation-only shape needed by renderer;
   - remove duplicate compatibility aliases only when renderer/recovery caller proof shows zero need;
   - do not resurrect legacy scene mirrors already deleted.
9. Mind Monitor / TTS / media remain presentation sidecars. Remove duplicate cache authority only if the committed turn/context already supplies the same data; do not make them gameplay truth writers.
10. Frontend/session state must be presentation-only. After refresh, recovery, replay or reset, committed server context must replace transient cached projections. Delete any client-side semantic writer or stale merge path that can override committed authority.
11. Preserve the accepted historical replay boundary:
   - do NOT delete `normalizePersistedExtractObservation()` or private `legacy-extract-adapter.js` in this task;
   - do NOT restore any persisted narrative parser/raw Story reparse fallback;
   - committed `parsed_blocks` remains replay/history narrative authority.
12. Preserve the current narrative-memory simplification: do not add `open_facts`, `open_observations`, general relation/event/emotion/work ledgers, entity graphs, vector memory, importance scoring, semantic repair, or another summary/memory LLM.
13. Delete stale frontend/source tests and compatibility fixtures that only encode removed readback precedence. Replace with behavioral tests covering:
   - refresh/recovery parity from committed context;
   - one authoritative choice source;
   - one authoritative stats source;
   - CSA display projection versus raw-save reconstruction;
   - relationship UI after any relationship-mirror deletion/retention decision;
   - reset clears transient UI state and committed readback wins.
14. Run focused frontend/context/history/recovery tests, full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`.
15. If source proof requires DB cleanup, author at most one additive migration candidate and test its SQL contract statically, but DO NOT apply it in this task. Historical migrations remain immutable.

## Architecture constraints

- One durable domain -> one canonical writer/readback authority.
- Frontend is presentation, never a semantic/gameplay writer.
- Server display projection may reshape committed data for UI, but must not create a second semantic truth independent of committed state.
- No generic compatibility layer, fallback semantic interpreter, new enum/taxonomy, fuzzy repair, regex existence gate, retry/regeneration, provider/model change, parser generation, arbitrary LLM save patch, or new memory system.
- Do not keep dead code solely for stale tests.
- Do not infer relationship/consent/emotion from CSA compliance or sexual mechanics.
- Historical applied migrations and immutable evidence are not edited.

## Authorized operations

Authorized:
- read-only Git/PR/source/history inspection;
- read-only TEST DB shape inspection excluding preserved manual game if needed to prove a current save/readback dependency;
- source/frontend/test/docs edits on the canonical branch;
- at most one additive migration candidate authored but NOT applied if a proven dead current durable field requires structural DB cleanup;
- local/focused/full tests and static checks.

Not authorized:
- TEST gameplay/setup/opening/reset or DB writes;
- migration/DDL application;
- API/frontend deployment;
- Production access/deploy;
- any access to preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes, retry/regeneration;
- parser relaxation/new parser generation, fuzzy repair, semantic hard gate, new compatibility layer;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if active committed readback -> frontend presentation has a clear single authority per surface, duplicate semantic/client fallback authority is removed where caller/data proof is complete, and any retained mirror/read-only boundary has a concrete unique current product consumer and deletion condition.

The cut must preserve current UI behavior after refresh/recovery and must not replace removed mirrors with a new semantic system.

## Execution result — source/test PASS, operator review pending

- START_HEAD / registration SHA: `ebc2dd6090a1d1bb428faf3a62813bce350cc498`.
- CURRENT_TASK blob at lease acquisition: `e75d6894cb717f2f27f3c51d32cfacc5b3c4da7d`.
- Changed source/test surfaces: `src/api/product-response.js`,
  `src/api/runtime-display.js`, `src/frontend/pages/app.js`,
  `src/frontend/pages/history-tools.js`, `src/frontend/pages/render.js`,
  `src/frontend/pages/state.js`, `src/frontend/pages/view-model.js`,
  `test/frontend-state-contract.test.mjs`, `test/frontend-view-model.test.mjs`,
  and `test/runtime-display-contract.test.mjs`.
- Relationship: retained `npc_relationship_state` because the server's
  relationship/history and sexual-record consumers still read it; frontend
  view-models no longer expose it as a second raw semantic source when the
  committed `display.character_details` projection exists. App payloads use
  the same committed display detail projection for heroine stats and
  relationship summary when supplied; evidence-backed general-NPC payloads
  retain their unique app projection.
- Stats: server display details win over stale save mirrors in frontend view
  models and app payloads; no stat reducer or durable writer changed.
- CSA: removed `fallbackActiveRules(save)` from the frontend view model;
  `display.active_csa` / `display.player_capability` is the readback source,
  with no raw-save semantic reconstruction.
- Choices: refresh/recovery reads Opening's server projection or the latest
  committed `parsed_blocks.choices`; stale `save.last_choices`, duplicate
  `game_turns.choices`, and history fallback precedence are no longer used by
  the frontend. Provider-authored literal values and the transient streaming
  presentation remain unchanged.
- Scene: frontend view-models prefer the server `display.scene` projection,
  with canonical `save.scene` only as a narrow direct-model/test input path;
  legacy scene mirrors remain non-authoritative.
- Reset/recovery/session: pending-action recovery remains intact and refresh
  replaces the view-model from committed server context; no new client cache
  or semantic adapter was added.
- No additive migration candidate was necessary. No content, DB, migration,
  deployment, TEST gameplay/reset/write, Production, provider/model, parser,
  retry, fuzzy, semantic-gate, or compatibility-layer change occurred.
- Focused frontend/context/history/recovery/runtime-display tests: `70/70`.
- Full `npm.cmd test`: `416/416`, 0 failed, 0 skipped.
- Changed JS/MJS `node --check`: PASS. `git diff --check`: PASS.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact deleted/kept readback surfaces, relationship/stats/CSA/choice decisions, any migration candidate status, focused/full tests, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not generate the next task yourself.

# Company v1 — CURRENT TASK

Status: READY
Task ID: opening-structured-persistence-contract-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous terminal evidence:
- task `opening-structured-replay-authority-v1`
- terminal comment `5303325427`
- operator review `5303536743` = ACCEPTED_BLOCKED_EVIDENCE
- docs-only reviewed HEAD `4c5f1182a86c326ceedce52c6e8592944873e37d`
- accepted ordinary-turn replay source/test SHA `7b61c9fd69930e82afc97a2dc907136ce3678beb`

Independent live TEST catalog verification confirmed the current canonical Opening writer is exactly:
`commit_company_opening(p_game_id uuid, p_setup_id uuid, p_background text, p_story_text text, p_choices jsonb)`.
It is SECURITY DEFINER with `search_path=public, pg_temp` and persists raw Opening Story + choices, but no structured Opening blocks.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated.
Production access is forbidden.

## Objective

Create the minimum additive source/test/migration contract needed to make **current-format Opening committed structured state authoritative**, matching the already-accepted ordinary-turn `parsed_blocks` replay architecture.

This is a **contract authoring/review cut only**. Author the additive migration and source/test changes in #67, but DO NOT apply the migration, deploy Workers/frontend, write/reset TEST DB, or run live gameplay in this lease.

Do not patch around the DB boundary. Do not preserve the old five-argument Opening writer as an active duplicate writer merely for compatibility. Historical applied migrations remain immutable.

## Required architecture

### A. Canonical Opening writer contract

Add one new additive migration that replaces the active canonical Opening RPC contract with a structured form carrying server-produced parsed blocks.

Target logical contract:
`commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)`
with the final jsonb argument being `p_parsed_blocks`.

Requirements:
- preserve existing game/setup identity checks;
- preserve exactly-four non-empty literal choice validation;
- preserve idempotence semantics;
- preserve SECURITY DEFINER and safe `search_path = public, pg_temp`;
- preserve service-role-only execution surface / current ACL policy;
- persist `opening_state.parsed_blocks` together with `story_text` and `choices` in the same canonical transaction;
- structured blocks are presentation/replay state produced by the server parser, not an arbitrary LLM save patch;
- validate only structural shape required for safe persistence/readback; do not add semantic enums/allowlists/regex/fuzzy gates over narrative meaning;
- if choices also appear inside parsed blocks, server/API remains responsible for canonical literal choices; do not create a second choice writer.

The old five-argument public writer must not remain an independently usable canonical writer after this migration unless concrete external caller proof requires a temporary compatibility window. If such a caller exists, STOP with exact caller evidence rather than silently keeping duplicate authority. Prefer explicit DROP + new canonical signature in the additive migration when safe.

### B. API write path

Update `src/api/turn-routes.js` so Opening commit sends the exact server-produced `parsedOpening` through the new canonical RPC in the same commit operation.

Do not:
- serialize structured state into raw Story text;
- call an internal helper directly;
- create a second persistence endpoint;
- add retry/regeneration/provider changes;
- add a new parser or parser relaxation.

### C. Replay/read authority

Update `openingTurnProjection()` so:
- usable `opening_state.parsed_blocks` is preferred as current-format authority;
- raw `opening_state.story_text` remains evidence/presentation text and cannot override usable committed structured blocks;
- only historical Opening rows that genuinely lack structured blocks may use the existing persisted parser as one inert fallback boundary;
- frontend continues consuming server committed projection and must not gain its own parser/semantic writer.

Delete or rewrite stale tests/helpers that assume current-format Opening must always reparse raw prose.

### D. Migration immutability and rollout separation

- Never edit any historical applied migration.
- Add exactly one new migration file for this contract.
- This task MUST NOT apply it to TEST.
- Do not change Production progression, TEST Level-7 seam, scene/location/presence authority, stats, compact clothing, CSA rule identity/lifecycle/applicability, sexual_event_ledger, or image/media presentation adapters.
- Media/image classification remains presentation-only and must never gate Story/Extract facts.

## Required proof

Source/test proof must demonstrate:
1. Opening API commit passes server-produced parsed blocks to the canonical RPC.
2. New migration defines one canonical structured Opening writer with correct security/search_path/ACL intent and no active duplicate five-arg writer when caller proof is zero.
3. Current-format Opening replay uses committed structured blocks without reparsing raw Story.
4. Mutating raw persisted Opening prose in a test fixture cannot replace usable committed structured blocks.
5. Historical row without `parsed_blocks` remains readable through the single inert fallback if concrete historical compatibility is retained.
6. Literal exactly-four choices remain byte/literal stable through Opening commit -> replay -> frontend projection.
7. No semantic enum/allowlist/regex/fuzzy gateway is introduced for dialogue/acting/inner-thought/relationship/emotion/physical narrative meaning.
8. Ordinary-turn six-raw + older-summary memory architecture is unchanged.
9. Full relevant regression, changed-file syntax checks, migration/static contract tests that prove behavior rather than string-presence alone, and `git diff --check` pass.

Test count alone is not proof.

## Remove-or-prove checks

Before completion, inventory:
- all callers of `commit_company_opening`;
- any old five-argument overload expectation;
- Opening raw reparse callers;
- frontend Opening reconstruction paths.

Delete zero-consumer duplicate authority in this cut. Do not keep compatibility runtime solely for stale tests.

## Authorized operations

Authorized:
- source/test/docs changes inside existing #67 branch;
- author one additive migration file;
- local/static tests and source inspection.

Not authorized:
- applying migration/DDL to TEST;
- TEST DB writes/reset/live gameplay;
- API/frontend deploy;
- Production access;
- preserved manual-game access;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- provider/model/temperature/token changes;
- retry/regeneration for favorable output.

## Completion

On completion:
- report exact source/test/migration SHA and final docs SHA separately;
- identify old writer/caller handling and whether the five-arg signature is removed in the authored migration;
- list the exact migration filename;
- show replay/current-vs-historical behavior proof;
- show focused/full/syntax/diff-check results;
- confirm migration applied = 0, DB writes = 0, deploy = 0, Production/manual-game access = 0;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review before any TEST migration application or deployment.

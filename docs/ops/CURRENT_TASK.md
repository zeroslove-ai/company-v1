# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: fresh-extract-optional-observation-fail-open-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, remains OPEN / DRAFT / UNMERGED.

V6 terminal: Issue #68 comment `5301754574`.
V6 operator review: Issue #68 comment `5301876748`.
Corrected pre-task HEAD: `b93e0da1f713c8b499f927f5d0cd69c2229e30aa`.
Accepted gameplay baseline: `0627f01d5118e3a936d9280fb8f889644137550c`.
Accepted SSE harness executable: `97d0fc840a3e99717ca75c07e7055f18944398d1`.

## Why this task exists

V6 proved the real next blocker.

Turn 1 completed Story -> Extract -> Commit. Turn 2 Story completed successfully, but Extract ended as `extract_failed / OPEN_FACT_UNKNOWN_ID` because one nested optional open fact referenced an unregistered identity.

Current source is internally contradictory:

- `normalizeFreshExtractObservationV2()` delegates with `softOptional: true`.
- `normalizeOpenFacts()` catches per-fact errors but then rethrows whenever `storyBlocks` is present via `if (!softOptional || storyBlocks) throw error`.

Therefore optional observation validation becomes a whole-turn hard gate on the fresh path.

That behavior is not wanted.

## Goal

Remove this class of turn-blocking Extract gates.

Once Story succeeded and the provider returned a parseable fresh V2 observation object, optional semantic observations must be best-effort. Bad optional observations may be ignored with warnings; they must not convert the whole turn into `extract_failed` merely because one fact/projection/block observation is imperfect.

Do not replace the removed gate with a different semantic gate, retry loop, repair LLM, enum, allowlist, synthetic fact generator, or second parser.

## Required source work

### 1. Open facts fail open per fact

For fresh `block_observations[].facts`:

- unknown/unregistered `subject_id` or `object_id` -> drop only that fact + warning;
- malformed optional fact fields -> drop only that fact + warning;
- non-exact Story quote -> drop only that fact + warning;
- invalid/unknown source block or quote not contained in that block -> drop only that fact + warning;
- valid facts in the same Extract response must continue and persist normally.

The presence of parser-owned `storyBlocks` must not override `softOptional` and rethrow a per-fact error.

Registered identity / exact Story quote / source provenance may remain acceptance requirements for an individual fact that is actually persisted. They are not allowed to be whole-turn failure conditions for an optional fact.

### 2. Remove adjacent optional block-observation hard failures

Audit `normalizeBlockObservations()` and the fresh caller in the same path.

The one-entry-per-Story-block accounting structure may remain useful as observation organization, but it must not be a semantic execution gate.

For parseable fresh Extract output:

- missing observation entry for a Story body block;
- duplicate/unknown block entry;
- mismatched optional block type;
- malformed optional `facts` array;

must not kill an otherwise valid Story turn solely to enforce observation accounting.

Use the parser-owned Story blocks to accept only safely matched facts and warn/drop unusable observation pieces. Do not fabricate facts for omitted blocks.

Do not weaken the actual Story parser or transaction/action/turn identity boundaries. This task is specifically about optional Extract observation payloads blocking gameplay.

### 3. Keep successful information

A mixed response containing valid and invalid optional observations must keep the valid observations, turn summary, scene data that can be safely normalized, and other valid projections.

Do not fall back to an entirely empty/degraded Extract merely because one optional fact is bad when the rest of the response is usable.

### 4. No new blockers

Do not introduce:

- new semantic enums or allowlists;
- new server-authored narrative facts;
- retries/regeneration;
- fuzzy semantic matching;
- another parser/decoder/wrapper/gateway;
- provider/model/temperature/token changes;
- compatibility code solely to preserve stale tests.

Delete or rewrite tests that assert the obsolete turn-fatal behavior.

## Tests

Add focused deterministic coverage proving at minimum:

1. unknown subject ID drops only that fact and returns a warning;
2. unknown object ID drops only that fact and returns a warning;
3. bad exact quote drops only that fact;
4. bad/unknown source block drops only that fact;
5. mixed valid + invalid facts preserve valid facts;
6. incomplete/mismatched optional block observation accounting does not make the whole fresh Extract fail;
7. valid facts still receive canonical server fact identity/provenance and survive Commit/replay;
8. ordinary fresh Extract with no usable facts still completes rather than becoming `extract_failed` for observation-accounting reasons.

Run focused tests plus the full repository test suite, syntax checks for changed JS/MJS, and `git diff --check`.

## Operations

Source/test task only.

Do not run another live acceptance inside this task. Do not deploy or apply migrations. Do not access Production or the historical manual game.

After the source/test correction is independently reviewed, the next step is to redeploy the reviewed executable to TEST and resume the same deep Level-7 acceptance rather than adding another architecture/harness task.

## Completion

Commit source/test changes on the existing #67 branch.
Set this file to `WAITING_REVIEW` in the completion state.
Post one immutable terminal report to Issue #68 with:

- START_SHA / FINAL_SHA;
- exact changed files;
- deleted/softened fatal observation paths;
- focused/full tests;
- explicit confirmation that no new semantic gate/retry/parser/provider change was introduced;
- live/DB/deploy/migration/Production/manual-game operations = 0.

Then stop for review.

## Completion state

- Execution lease: Issue #68 comment `5301891398`.
- START_SHA: `917b6bcbac5bd1e3968bbac279ae71d314d60a90`.
- START CURRENT_TASK_BLOB_SHA: `7fca01fe077be04838884e43b6ca4bbe3882af47`.
- Source/test commit: `53710ca` (`fix: make fresh extract observations fail open`).
- Final completion SHA: the docs-only commit containing this section; reported in the immutable Issue #68 terminal report.
- Exact changed source/test files:
  - `src/engine/runtime-core/extract-observation.js`
  - `test/extract-observation-contract.test.mjs`
  - `test/turn-pipeline-replay.test.mjs`
- Softened fatal paths: fresh per-fact identity, exact-quote, source-block, malformed-fact, duplicate/unknown/mismatched block, and incomplete block-accounting failures now drop only the affected optional observation with warnings; valid observations remain normalizable.
- Preserved strict boundaries: fresh protocol shape, top-level `open_facts` prohibition, parser-owned block identity, server-authored fact identity/provenance, and persisted replay validation remain enforced.
- Focused tests: `node --test test/extract-observation-contract.test.mjs test/turn-pipeline-replay.test.mjs` — 48/48 pass.
- Full tests: `npm.cmd test` — 451/451 pass.
- Syntax: changed JS/MJS files passed `node --check`.
- `git diff --check`: PASS.
- No new semantic gate, retry/regeneration, parser/decoder/wrapper, provider/model, enum, allowlist, fuzzy matcher, or repair path was introduced.
- Live acceptance = 0; DB writes = 0; TEST reset = 0; migration apply = 0; deployments = 0; Production/manual-game access = 0.
- PR #67 remains OPEN / DRAFT / UNMERGED.

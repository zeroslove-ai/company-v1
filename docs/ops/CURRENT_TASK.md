# Company v1 — CURRENT TASK

Status: READY
Task ID: live-acceptance-sse-reader-canonicalization-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted gameplay executable remains:
`0627f01d5118e3a936d9280fb8f889644137550c`.

Accepted canary safety executable remains:
`521e8acf6c519ea05b92a45caef2f1ff601ad27c`.

Previous live task `deep-level7-live-acceptance-v5-rerun` ended BLOCKED at FINAL_SHA `cdaea953f7fd72e3fe63182b4650b96eb9b615b1`, terminal comment `5301260524`, operator review `5301268568`.
The blocked evidence classified the first direct turn failure as a local temporary SSE evidence-reader defect, not a gameplay/provider defect. Opening-only passed; final TEST reset and diagnostic-disable cleanup passed.

TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever and must not be accessed.

## Purpose

Remove the acceptance-tool ambiguity that blocked V5 without adding any gameplay/runtime semantic layer.

There must be one canonical SSE event-decoding behavior for Company live acceptance tooling. Inventory the existing canary/direct acceptance readers, prove the actual frame-shape mismatch that caused comment `5301260524`, and consolidate onto one tested decoder or one minimal shared helper. Do not create a third parser/decoder generation.

This is harness/source-test work only. It is not authorization to rerun live acceptance.

## Mandatory preflight

1. Fresh-fetch Issue #68 and verify this exact task has no terminal report/review already.
2. Verify PR #67 is OPEN / DRAFT / UNMERGED, base `main`, and HEAD descends from `cdaea953...` or this registration commit only.
3. Inspect the V5 terminal evidence/report and current source before editing. Treat terminal report as immutable.
4. Inventory every SSE decoder/reader used by `scripts/live-playtest-canary.mjs` and any direct live-acceptance helper/script. Identify whether the V5 temporary reader duplicated or diverged from the existing decoder.
5. Do not access TEST DB/Worker or preserved manual game.

## Required implementation

A. Canonical decoder boundary
- Reuse the existing proven SSE decoding behavior where possible.
- If extraction to a shared helper is required, move existing behavior rather than inventing a new semantic parser.
- Decoder must handle actual Worker SSE framing used by Story/Opening, including CRLF/LF frame separators, event/data fields, multiple data lines if present, and terminal `complete`/`error` events.
- Preserve raw response text/status for evidence; decoder failure must be distinguishable from Worker terminal error.

B. Delete duplication
- Remove the temporary/direct duplicate reader or make it call the canonical decoder.
- No parallel SSE implementations may remain in active live-acceptance paths unless caller proof demonstrates materially different transport framing.

C. Behavioral tests
Add focused tests with representative raw SSE fixtures proving at minimum:
- LF-delimited complete event;
- CRLF-delimited complete event;
- multiple events in one body;
- JSON `data:` parsing;
- terminal error event;
- malformed/non-SSE body is classified as harness decode failure rather than gameplay/provider failure;
- the exact V5 frame shape, reconstructed from preserved report/evidence if available, parses correctly.

D. No semantic expansion
- Do not change Story/Extract/Commit/open-fact/summary/CSA/scene/progression/provider semantics.
- Do not add retries/regeneration/fuzzy repair/parser relaxation/semantic hard gates.
- Do not add a gameplay gateway/wrapper.
- Do not alter TEST Level-7 acceleration or Production progression.
- Do not alter media/image catalog, sex/general pools, image selection, or make media classification gate narrative facts.

## Verification

Run focused harness tests and the full local test suite required by repository policy. Test count alone is not proof: report the exact decoder fixtures/assertions and executable diff.

No TEST deploy, TEST gameplay, DB mutation/reset, migration, diagnostic toggle, Production access, frontend deploy, or live API call is authorized in this task.

## Completion

On success:
1. Commit source/test changes on the existing #67 branch only.
2. Set CURRENT_TASK to WAITING_REVIEW in a docs-only completion commit if required by the runner contract.
3. Post one immutable terminal report to Issue #68 with START_SHA, FINAL_SHA, changed files, decoder consolidation/deletion proof, focused/full tests, and explicit `live operations = 0`.
4. STOP. Do not rerun V5 and do not create the next task yourself.

## Forbidden

- New branch/PR; reopening #65/#66; merge/Ready/rebase/squash/force-push.
- Production access.
- Any preserved manual-game access.
- TEST DB/deploy/reset/gameplay/migration/diagnostic mutation.
- Editing historical applied migrations or immutable terminal evidence.
- Provider/model/temperature/token changes.
- Retry/regeneration/fuzzy repair/new semantic parser/gate.
- Gameplay runtime semantic changes.
- New generic gateway/wrapper.

# Company v1 — CURRENT TASK

Status: READY
Task ID: extract-open-fact-coverage-contract-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Frozen accepted gameplay executable before this fix: `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f`.
Current docs head before registration: `6260b5e65e4e2b25e9be10d9eae31438f1a43b6a`.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.
TEST Level-7 seam migration `20260815000100 / company_v1_test_level7_acceleration` is already applied in TEST and must not be reapplied or edited.
TEST Worker currently deployed from the accepted gameplay-equivalent lineage; no deploy is authorized in this source cut.

Canonical spine remains:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
Story owns narrative truth. Extract must observe Story. Server owns structural identity/evidence/provenance/transaction/replay, not a finite semantic universe.

## Triggering live evidence

`deep-level7-live-acceptance-v2` BLOCKED at Turn 3 action `89984add-936b-40d8-86a4-0496ced11e86`.
- Story/Extract/Commit transport all completed.
- The acceptance scenario had exact Story evidence intended to establish a durable non-taxonomy fact.
- Accepted Extract result contained `open_facts: []`.
- No retry/regeneration/provider change/synthetic fact occurred.
- TEST was reset cleanly after the block.
- Evidence artifact on the operator machine: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v2-evidence.json`.

Independent source inspection already shows a structural gap:
- `buildExtractPrompt` strongly requests open facts.
- `normalizeOpenFacts` accepts undefined/null/empty arrays.
- Fresh Extract validation has no completeness/coverage relation to existing `parseFreshNarrativeV2(...).blocks`.
- Therefore Extract can silently omit a meaningful Story fact while remaining structurally valid.

This task must determine the exact raw cause and close it without restoring semantic taxonomies or retry loops.

## Phase 0 — exact evidence and caller proof

Before editing source:
1. Read the preserved V2 evidence artifact if it still exists. Capture the exact Turn 3 player action, raw Worker-facing Story, parsed Story blocks, raw provider Extract response if available, normalized Extract result, warnings, Commit input/output and context/readback.
2. Determine exactly which failure occurred:
   - provider returned `open_facts: []`;
   - provider returned candidate facts but normalizer dropped them;
   - prompt/input omitted necessary Story/parsed-block context;
   - another adapter transformed/dropped them.
3. Trace the fresh path only: Extract prompt input -> provider response decode -> `normalizeExtractObservation` / `normalizeOpenFacts` -> staged Extract -> Commit/open-fact reducer -> context/history/next-Story readback.
4. Trace `parseFreshNarrativeV2` block shape and prove whether its existing ordered blocks can be reused as structural observation coverage identity. Do not create a third parser or reparse committed narrative differently.
5. Inventory any remaining closed Extract event/relation/emotion/posture/sexual fields in the fresh prompt/validator and classify whether they are:
   - proven narrow UI/mechanical projection;
   - LEGACY_READ_ONLY;
   - dead/superseded semantic authority to delete now if directly blocking or confusing this contract.
6. Do not infer the live failure from the terminal summary when the artifact/source can prove it.

## Architecture constraint

Do NOT fix this by:
- requiring `open_facts.length >= 1` on every turn;
- keyword/regex/heuristic semantic detection;
- restoring `GENERAL_EVENT_TYPES`, `RELATION_KINDS`, emotion/posture/sexual enums as truth gates;
- generic `other` categories;
- direct player-input success inference;
- another LLM call;
- retry/regeneration until facts appear;
- synthetic server-authored facts;
- parser relaxation or a new parser generation.

A Story turn may legitimately produce zero new durable facts. The server must not semantically decide that a fact exists.

## Required design/implementation

Implement the smallest robust representation that prevents silent Extract omission while preserving the open-semantic model.

Preferred direction, only if Phase 0 caller proof supports it:
- Reuse the already-parsed ordered Story body blocks (`scene`, `narrative`, `dialogue`, `acting`) as stable structural observation inputs.
- Give Extract an explicit coverage/accounting surface tied to those existing block identities/order.
- For each relevant Story body block, Extract must explicitly account for observation processing and may attach zero or more open facts grounded in exact contiguous quotes from that block/Story.
- Zero facts for a block/turn remains legal when Extract explicitly accounts for it; the server validates structural coverage and quote provenance only, not semantic correctness.
- Open facts remain free Korean facts with registered subject/object IDs where applicable and exact Story evidence; no mandatory semantic type enum.
- The representation should make omission distinguishable from an explicit "no durable fact from this block" decision without introducing a narrative taxonomy.
- If a simpler representation gives the same structural completeness with less protocol surface, use it and explain why.

The fresh Extract prompt should become easier to understand, not more cluttered. Remove contradictory or superseded instructions discovered in Phase 0 when caller proof allows, especially any closed semantic wording that competes with open-fact observation. Preserve only proven narrow projections such as compact clothing/media hints where they have real consumers.

Do not make ordinary turns fail merely because the model chose zero facts after structurally accounting for all required Story input. Fail closed only for malformed coverage identity, unknown registered IDs, fabricated/non-contiguous Story quotes, broken action/turn provenance, or other structural corruption.

## Required behavior tests

At minimum prove:
1. A Story block containing a mixed-emotion/practical-agreement/boundary fact can be represented as an arbitrary open fact with exact evidence and no old enum.
2. A Story turn with genuinely no durable fact may return zero open facts while still satisfying the structural coverage contract.
3. Silent omission of a required Story body block is structurally distinguishable and rejected/warned according to the chosen contract without server semantic inference.
4. A fabricated quote or quote from player input instead of Story is rejected.
5. Unknown subject/object identity is rejected structurally.
6. Multiple facts may originate from one block; one fact may use an exact quote within the block without a semantic type.
7. Existing selected-literal choices/free text remain unaffected.
8. CSA natural-rule context remains unaffected; no physical execution grammar returns.
9. Compact clothing projection remains functional where actually consumed.
10. Image/media catalogs including sex families remain presentation-only and unaffected.
11. Commit persists accepted open facts exactly once; replay/idempotence does not duplicate them.
12. Context/history/next Story still read committed facts.

Run focused tests plus full suite, syntax checks for modified JS/MJS, and `git diff --check`. Test-count changes are supporting evidence only.

## Scope and deletion expectation

This is a source/test contract cut. Prefer deleting superseded fresh semantic prompt/validator branches in the same cut if the new coverage representation makes them unnecessary and caller proof is complete. Do not retain dual fresh paths for compatibility with stale tests.

Historical persisted readers may remain only if an exact live reader/data dependency is demonstrated; mark them LEGACY_READ_ONLY with a deletion criterion.

No migration is expected. If implementation genuinely requires DB shape changes, STOP/BLOCK with the exact reason instead of broadening the task.

## Forbidden

- Live TEST gameplay/LLM calls, TEST DB writes/resets, migration apply/reapply, deploy.
- Production access/mutation/deploy.
- Any access/mutation/reset of preserved manual game.
- New PR/branch, merge, Ready, rebase, squash, force-push.
- Provider/model/temperature/token changes.
- Retry/regeneration/fuzzy repair/regex semantic inference/new parser.
- New finite event/relation/emotion/posture/sexual taxonomy.
- Direct player-input success inference or arbitrary LLM save patches.
- Removing/degrading image/media/sexual-image functionality because its catalog is finite.
- Editing historical applied migrations.

## Terminal report

Before COMPLETE:
- report START_SHA and executable FINAL_SHA separately from docs-only final SHA;
- quote/summarize the exact Turn 3 evidence that proved the root cause, including whether omission happened at provider output or normalization;
- explain the chosen structural coverage representation and why it does not make the server a semantic judge;
- list fresh Extract fields/instructions removed, retained narrow projections, and any LEGACY_READ_ONLY residue with exact callers/deletion criteria;
- list runtime/test files changed;
- focused/full/syntax/diff-check results;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED;
- verify live TEST/LLM, DB write/reset, migration apply/reapply, deploy, Production and preserved-game access are all 0.

Then set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP. Do not start another live acceptance until operator review.

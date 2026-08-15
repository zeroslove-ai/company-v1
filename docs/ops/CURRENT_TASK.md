# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: extract-block-observation-prompt-closure-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted gameplay executable remains `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0` until this revision is independently accepted.
Current candidate requiring revision: `a35294022b72b4cc7f65b32a0c6bcc8a870a76bd` (`extract-block-observation-wire-simplification-v1`).
TEST Worker currently has accepted executable `2a804fd...` deployed as Version `d2138893-f96b-4539-9d69-bda4ca0511f3`; do not deploy in this task.
TEST Level-7 migration `20260815000100 / company_v1_test_level7_acceleration` is already applied; do not reapply/edit it.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.

Canonical spine remains:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
Story owns narrative truth. Extract observes Story. Server validates structural identity/evidence/provenance/transaction/replay, not narrative meaning.

## Operator review that triggered this revision

`extract-block-observation-wire-simplification-v1` is CHANGES_REQUIRED at candidate `a352940...`.

The block-local direction is retained, but two provider-contract defects must be closed before any live acceptance:

1. Fresh Extract system instructions still contain stale wording that tells the provider to use top-level `open_facts` / describes a minimal output using `open_facts`, while later instructions forbid top-level `open_facts` and require only `block_observations[].facts`. A provider can obey either instruction and fail structurally.
2. `story_observation_blocks` currently exposes only `block_id`, `block_index`, and `block_type`; its exact parsed block text is omitted while raw `story_text` is separate. The provider therefore has to reconstruct parser boundaries to determine what text belongs to `story:0`, `story:1`, etc. That is avoidable protocol work and conflicts with the principle that Extract should observe the already-parsed Story rather than recreate parser structure.

Do not deploy or rerun live acceptance until this source/test closure is reviewed.

## Goal

Finish the block-local Extract wire so there is one unambiguous fresh provider contract:

```json
{
  "block_observations": [
    {
      "block_id": "story:0",
      "block_type": "narrative",
      "facts": [
        {
          "subject_id": "heroine1",
          "object_id": "player",
          "fact_text": "...",
          "story_quote": "exact contiguous quote from this supplied block"
        }
      ]
    },
    {
      "block_id": "story:1",
      "block_type": "dialogue",
      "facts": []
    }
  ]
}
```

`facts: []` is the sole zero-fact representation. There is no provider `decision`, no fresh `observation_coverage`, and no fresh top-level provider `open_facts`.

## Mandatory Phase 0 — fresh caller/protocol proof

Before editing:
1. Read current `buildExtractPrompt`, `buildStoryObservationBlocks`, `normalizeFreshExtractObservationV2`, `normalizeBlockObservations`, `normalizeOpenFacts`, `runExtract`, persisted Extract reader, and affected tests.
2. Enumerate every phrase in the actual fresh provider system/user messages that mentions `open_facts`, `observation_coverage`, `decision`, or otherwise teaches the superseded provider wire.
3. Distinguish provider wire terminology from the canonical durable internal `open_facts` output used after normalization. The internal durable name may remain in code/readback; the fresh provider must not be instructed to author that top-level field.
4. Prove the exact text representation already available from `parseFreshNarrativeV2(...).blocks`; do not create a parser or infer boundaries a second time.
5. Confirm raw-provider diagnostic behavior remains default-off and non-durable. `COMPANY_V1_EXTRACT_DIAGNOSTIC=true` is operator/TEST diagnostic use only and must never be enabled by default or in Production.

## Required implementation

### A. Make the fresh prompt self-consistent

Remove or rewrite all stale fresh-provider wording that asks for or exemplifies:
- top-level `open_facts`;
- `observation_coverage`;
- `decision: facts|none`;
- any second source-block declaration on nested facts.

When arbitrary narrative meaning is described in the prompt, say explicitly that it belongs in `block_observations[].facts` under the matching supplied Story block.

The output-shape example and every explanatory sentence must agree on the same wire.

Do not globally rename the canonical durable `open_facts` implementation if Commit/context/history already depend on it. This task is about the fresh provider boundary, not gratuitous storage churn.

### B. Give the provider direct block text

`story_observation_blocks` must expose each already-parsed observation block directly, including at minimum:
- `block_id`;
- `block_index`;
- `block_type`;
- the exact parser-owned block text used for quote validation.

Preferred shape:

```json
{
  "block_id": "story:3",
  "block_index": 3,
  "block_type": "dialogue",
  "text": "...exact parsed block text..."
}
```

Use the existing `buildStoryObservationBlocks(parsedStory)` projection. Do not ask the provider to reconstruct tags or parser boundaries from the raw Story.

Raw `story_text` may remain in the user payload because it is useful as full narrative context, but block-local grounding must be possible solely from the supplied block record.

Server validation remains authoritative: a nested `story_quote` must be an exact contiguous substring of the actual parser-owned enclosing block. Supplying block text to the provider does not weaken validation.

### C. Preserve the good parts of `a352940...`

Keep unless a direct defect is proven:
- one `block_observations` entry per existing Story observation body block;
- nested `facts`;
- `facts: []` as zero-fact representation;
- server-derived canonical `source_block`;
- flattening into the existing durable canonical `open_facts` used by Commit/readback;
- structural rejection of missing/duplicate/wrong block identities, unknown IDs, and fabricated/out-of-block quotes;
- persisted/replay compatibility for canonical durable facts;
- default-off non-durable raw provider diagnostic callback.

Do not restore the separate coverage/decision wire.

## Tests required

At minimum add/adjust behavioral tests proving:
1. Actual fresh system instructions do not tell the provider to emit top-level `open_facts`.
2. Actual fresh system instructions do not teach `observation_coverage` or `decision:facts|none`.
3. All instructions/examples point to `block_observations[].facts` for arbitrary facts.
4. `story_observation_blocks` contains exact block text alongside ID/index/type for a multi-block Story containing at least scene/narrative/dialogue/acting where representable.
5. Block ID/order/text exactly matches the existing fresh parser projection; no reparse/new parser.
6. One block can have multiple facts; another can use `facts: []`.
7. Nested provider facts cannot author a separate `source_block`; canonical source_block is derived from the enclosing block.
8. Quote outside the enclosing supplied block fails structurally.
9. Unknown subject/object fails structurally.
10. Canonical normalized/durable `open_facts` still preserve deterministic ID/action/turn/source/quote and Commit/readback/replay semantics.
11. Existing literal-choice/free-text, CSA institutional context, compact clothing, scene/presence, Mind Monitor, image/media—including sexual image families—remain unaffected.
12. Raw provider diagnostic callback is absent when the diagnostic flag is not explicitly true and no raw provider content is returned to the ordinary Extract client or persisted.

Run focused tests plus full `npm.cmd test`, syntax checks for modified JS/MJS, and `git diff --check`. Test count is regression evidence only.

## Architecture constraints

Do NOT add:
- semantic event/relation/emotion/posture/sexual enums as fact truth gates;
- regex/keyword/heuristic fact detection;
- minimum fact count;
- synthetic facts;
- retries/regeneration/second LLM call;
- another parser;
- parallel durable fact ledger/writer;
- compatibility provider path merely for stale tests.

A block may legitimately have `facts: []`. Server structural validation must not decide whether narrative meaning should exist.

## Forbidden operations

- Live TEST gameplay/LLM.
- TEST DB writes/resets.
- Migration change/apply/reapply/rollback.
- API/frontend deploy.
- Production access/mutation/deploy.
- Any access/mutation/reset of preserved manual game.
- Provider/model/temperature/token changes.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- Enabling raw Extract diagnostic in Production.

## Completion / terminal report

Before COMPLETE:
- report START_SHA and executable FINAL_SHA separately from any docs-only final SHA;
- list exact prompt contradictions removed;
- show final fresh provider JSON shape;
- show `story_observation_blocks` exact text-bearing shape and multi-block test proof;
- prove canonical durable `open_facts`/Commit/context/history/replay remain unchanged in authority;
- describe raw-provider diagnostic behavior and default-off proof;
- report focused/full/syntax/diff-check results;
- verify live TEST/DB/deploy/migration/Production/manual-game operations all 0;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP. Do not launch live acceptance yourself.

## Execution result — COMPLETE / WAITING_REVIEW

Execution identity: `extract-block-observation-prompt-closure-v1` / task blob `ab7d35a4cb83517123db3b2d4ef7ea88af3df27b` / branch `company/scene-location-presence-v1`.

- Phase 0 caller proof confirmed that `buildStoryObservationBlocks(parsedStory)` already exposes parser-owned normalized block text; the fresh prompt map was discarding only the `text` field.
- Removed the remaining fresh-provider instructions that taught top-level `open_facts`. Fresh instructions now route arbitrary meaning only through `block_observations[].facts` and no longer mention `observation_coverage`, provider `decision`, or nested `source_block`.
- `story_observation_blocks` now sends `{block_id, block_index, block_type, text}` from the existing parser projection. A behavioral test compares the complete multi-block payload against `buildStoryObservationBlocks(parseFreshNarrativeV2(...))` for scene, dialogue, and acting blocks; THOUGHT/CHOICE remain excluded observation blocks.
- Fresh provider shape remains one `block_observations` entry per supplied block, nested `facts`, and `facts: []` for zero facts. Canonical durable flat `open_facts`, derived `source_block`, Commit/context/history/replay authority, structural quote validation, and default-off raw diagnostic callback are unchanged.
- Changed source/test files: `src/engine/extract-prompt.js`, `test/extract-observation-contract.test.mjs`, `test/content-catalog-contract.test.mjs`.
- Focused Extract/content/narrative tests: 80/80 PASS. Full `npm.cmd test`: 433/433 PASS. Modified JS/MJS syntax: PASS. `git diff --check`: PASS.
- Live TEST/LLM, DB writes/resets, migration changes/apply, API/frontend deploy, Production/manual-game access: 0.
- Preserved evidence: exact approved 16-path snapshot remains unchanged, untracked, unstaged, and uncommitted.
- PR #67 remains OPEN / DRAFT / UNMERGED, base `main`. No live acceptance or next task was launched.

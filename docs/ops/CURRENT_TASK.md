# Company v1 — CURRENT TASK

Status: READY
Task ID: extract-block-observation-wire-simplification-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted gameplay executable before this task: `2a804fd96bc876d7c28deb0ed8aa1637a3ac1ba0`.
Current docs head before registration: `0f2b2dc08a54c0726eac9ed1b453d05ece34f824`.
TEST Worker currently has reviewed executable `2a804fd...` deployed as Version `d2138893-f96b-4539-9d69-bda4ca0511f3`.
TEST Level-7 migration `20260815000100 / company_v1_test_level7_acceleration` is already applied and must not be reapplied or edited.
Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.

Canonical spine remains:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
Story owns narrative truth. Extract observes Story. Server validates structural identity/evidence/provenance/transaction/replay, not narrative meaning.

## Triggering live evidence

`deep-level7-live-acceptance-v3` BLOCKED on first selected-literal turn, action `22535b2b-2bc9-49c5-ab15-3ca8f93bd44e`.
- setup/opening succeeded;
- exactly four opening choices existed;
- the selected displayed literal was sent unchanged as `player_action`;
- Story transport succeeded, raw Story length 1176, 12 parsed blocks;
- Extract failed with `STORY_OBSERVATION_COVERAGE_MISMATCH`: `Block story:0 declares facts without a fact`;
- no retry/regeneration/source patch/provider change occurred;
- final canonical TEST reset passed.

Independent source proof narrows the failure:
- fresh `normalizeOpenFacts(..., { storyBlocks })` does not silently discard invalid candidate facts; with Story blocks present, invalid candidate facts throw their own structural error;
- therefore `facts` + zero normalized facts means the provider-parsed object supplied no retained open fact for that block (for example absent/null/empty `open_facts`) while separately declaring `decision:facts`;
- `runExtract()` currently parses provider `message.content` and discards the exact raw string; JSON repair is syntactic only and does not semantically rewrite facts.

The proven design defect is that the provider must keep two separate structures (`observation_coverage` decisions and top-level `open_facts`) mutually consistent. This duplicated wire authority is unnecessary and failed immediately in live use.

## Goal

Replace the separate `observation_coverage` + top-level provider `open_facts` fresh wire with one simpler block-local observation structure so block accounting and its facts cannot contradict each other.

Preferred fresh provider shape:

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
          "story_quote": "exact contiguous quote"
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

Names may differ if a materially simpler representation is proven, but the invariants below are binding.

## Binding representation rules

1. Exactly one provider observation entry per existing Story observation body block (`scene`, `narrative`, `dialogue`, `acting`).
2. Block identity/order comes only from existing `parseFreshNarrativeV2(...).blocks`; no new parser or semantic classifier.
3. `facts: []` is the explicit zero-durable-fact decision. Remove the separate `decision: facts|none` field; do not preserve two fields that can contradict each other.
4. Facts live inside their source block in the provider wire. Do not ask the provider to repeat `source_block` on each nested fact if the enclosing block already establishes it.
5. Normalization derives canonical `source_block = block_id` and flattens accepted nested facts into the existing canonical durable `open_facts` shape used by Commit/context/history.
6. The provider block-local wire is observation protocol, not a second durable fact store. Do not create a parallel ledger or duplicate semantic writer.
7. Server validates only:
   - every required Story body block accounted for exactly once;
   - block id/type matches parsed Story structure;
   - registered subject/object IDs;
   - exact contiguous `story_quote` inside the enclosing Story block;
   - action/turn provenance, deterministic fact identity, dedupe/replay.
8. Server does not decide whether a block semantically should have a fact. Empty `facts` remains legal.
9. No enum/category/keyword/regex/heuristic inference, minimum fact count, synthetic fact, retry, regeneration, or second LLM call.

## Delete superseded V1 coverage wire in the same cut

After caller/test proof, remove from the fresh path rather than keeping compatibility code for stale tests:
- provider `observation_coverage` field;
- `decision: facts|none` vocabulary;
- separate provider top-level `open_facts` input if the new block-local wire fully replaces it;
- `STORY_OBSERVATION_COVERAGE_MISMATCH` logic that exists only because the two structures could disagree;
- prompt instructions/examples that teach the old duplicated representation;
- fresh tests/mocks that exist only to preserve the superseded representation.

Historical persisted data is different from fresh provider input. If a real stored/replay reader needs old normalized `open_facts`, preserve that canonical durable reader. Do not preserve the old provider wire merely because old unit fixtures used it.

## Durable output / replay contract

The normalizer must continue to produce the canonical durable open-fact representation expected by Commit and next-turn readback:
- stable fact_id;
- action_id;
- turn_number;
- subject_id;
- optional object_id;
- fact_text;
- exact story_quote;
- derived source_block.

Do not require the block-local provider protocol itself to become permanent save authority. Persist only what actual replay/readback needs. Prove same-action replay does not duplicate facts.

## Prompt simplification

Simplify the Extract prompt around the new block-local representation.
- Explain each Story body block once.
- Make `facts: []` the only zero-fact representation.
- Keep arbitrary Korean facts open-ended.
- Keep exact quote/registered identity rules.
- Do not reintroduce old event/relation/emotion/posture/sexual taxonomies.
- Preserve narrow compact clothing, scene/presence, media hint, Mind Monitor, and other proven product/mechanical projections only where they have actual consumers.
- If contradictory stale wording is encountered, remove it when caller proof permits.

## Raw provider observability

`runExtract()` currently destroys the exact provider `message.content` after parse. Inspect the full caller boundary and implement the smallest non-durable observability improvement that allows a future TEST acceptance to distinguish exact provider wire from normalized output **without changing normal gameplay authority**.

Preferred constraints:
- no DB column/migration;
- no save/action durable semantic writer;
- no raw provider content exposed to ordinary frontend clients;
- no Production-only behavior change;
- no secret/config expansion unless strictly necessary and justified.

A safe internal callback/diagnostic result shape/test seam is acceptable if it can actually be used by the next TEST acceptance. If exact raw live capture cannot be made safely without broader operational/config changes, do not fake it: document the precise limitation and the safest future capture method. The wire simplification itself is not contingent on adding a risky debug surface.

## Required source/caller proof

Before editing:
1. Trace `buildExtractPrompt -> runExtract -> repairAndParseExtractJson -> normalizeFreshExtractObservationV2 -> recordExtractResultOwned -> normalizePersistedExtractObservation -> reduceGameplayCommit -> open_observations/context/history/next Story`.
2. Prove which fields are fresh provider wire versus canonical durable output.
3. Prove whether any live persisted row can contain the just-introduced V1 `observation_coverage`; V3 failed before Extract persistence/Commit and reset, so do not invent a compatibility requirement without evidence.
4. Verify compact clothing/media/scene/CSA sidecars are unaffected.

## Required tests

At minimum prove:
1. Every Story body block is represented exactly once.
2. A block with no durable fact uses `facts: []` and succeeds.
3. A block may emit one or multiple arbitrary facts without semantic type enums.
4. Nested fact source_block is derived from its enclosing block and not provider-authored twice.
5. Missing/duplicate/unknown block id or wrong block type fails structurally.
6. Quote outside the enclosing block fails.
7. Unknown subject/object fails.
8. No separate `decision` field exists in the fresh provider contract.
9. No separate provider top-level open-fact array can contradict block-local facts.
10. Normalized canonical open facts preserve stable provenance and deterministic IDs.
11. Commit persists facts once; replay/idempotence does not duplicate them.
12. Context/history/next Story still consume canonical facts.
13. Literal choices/free text unaffected.
14. Strong CSA remains institutional-context only; no physical execution grammar returns.
15. Compact clothing projection remains functional.
16. Image/media including sexual image families remains presentation-only and unchanged.
17. Degraded optional Extract behavior does not swallow malformed block-accounting/provenance corruption.
18. Any raw-provider diagnostic hook is disabled/unreachable in ordinary gameplay and does not persist provider output.

Run focused tests plus full `npm.cmd test`, modified JS/MJS syntax checks, and `git diff --check`. Test count is only regression evidence.

## Forbidden

- Live TEST gameplay/LLM, TEST DB writes/resets, migration apply/reapply, deploy in this source cut.
- Production access/mutation/deploy.
- Access/mutation/reset of preserved manual game.
- New branch/PR, merge, Ready, rebase, squash, force-push.
- Provider/model/temperature/token changes.
- Retry/regeneration/second LLM call.
- Semantic regex/heuristic repair or synthetic facts.
- New finite event/relation/emotion/posture/sexual taxonomy.
- New parser generation.
- DB migration/shape expansion for provider diagnostics.
- Removing/degrading media/image/sexual-image behavior because its catalog is finite.

## Deliverable / terminal report

Report separately:
- START_SHA;
- executable FINAL_SHA;
- docs-only final SHA;
- exact source/test files changed;
- old duplicated provider-wire code/tests deleted;
- new block-local provider contract;
- canonical durable open-fact output and replay/readback proof;
- raw-provider observability result or exact reason it was safely deferred;
- focused/full/syntax/diff-check results;
- live TEST/DB/deploy/migration/Production/manual-game operations all 0;
- PR #67 remains base main, OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to WAITING_REVIEW in a docs-only descendant, post one immutable terminal report to Issue #68, and STOP. Do not launch another live acceptance yourself.
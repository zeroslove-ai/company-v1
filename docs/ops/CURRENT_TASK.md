# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: opening-story-choice-protocol-unification-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307514146` ACCEPTED_BLOCKED_EVIDENCE for `client-readback-projection-test-rollout-v1`.
Current branch parent / rollout docs SHA: `451f6d3e2b6dcf5b8d3cb555c74e1984f924db42`.
Accepted client/readback source SHA remains `f5d93f9563fa23f16c1e599e4a51e38c846c890d`.

Latest TEST rollout evidence:
- exact `f5d93f9` API and frontend lineages deployed successfully to TEST;
- Stage-B gate/dry-runs/health passed;
- the single bounded run stopped in Opening before commit because provider output contained zero `[CHOICE]` blocks;
- parsed/canonical choice count was 0 and `commit_company_opening` was never called;
- final disposable TEST reset was clean at turn 0;
- no source behavior changed during the rollout.

Independent operator source review found that the accepted `f5d93f9` client/readback cut did not modify Opening generation/parser/LLM source. Therefore do not treat this as a readback regression. It is evidence that the provider-facing exact-four choice-output contract is not singular/unambiguous enough in practice.

Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate. Production is forbidden.

## Objective

Unify the provider-authored choice output protocol used by ordinary Story and Opening so both prompts carry one clear mandatory structural instruction for exactly four non-empty distinct literal `[CHOICE]` blocks, without adding server-authored choices, retries, regeneration, parser repair, or another semantic authority.

This is a root-cause prompt/protocol cleanup, not another live evidence retry. Source/test only.

## Required work

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Inventory the exact choice-output instructions and consumers in:
   - `src/engine/story-prompt.js` (`DURABLE_STORY_RULES`, `FRESH_MARKER_GRAMMAR` and related output protocol text);
   - `src/engine/opening-prompt.js` (`FRESH_OPENING_OUTPUT_PROTOCOL`, durable opening rules);
   - `src/engine/fresh-narrative-parser.js` choice parsing;
   - `reduceStoryChoiceProjection` and its current caller(s);
   - Opening and ordinary Story route commit projections;
   - focused tests that assert prompt/output/choice literal behavior.
3. Confirm the source range from accepted `f5d93f9` through rollout docs did not alter Opening provider generation. Record this as provenance only; do not create a compatibility branch.
4. Establish one shared **provider choice-output protocol clause** used by both ordinary Story and Opening. Prefer reusing the existing Story prompt/protocol module rather than creating another parser or semantic helper.
5. The shared clause must make all of these explicit and unconditional:
   - exactly four `[CHOICE] ... [/CHOICE]` blocks;
   - each block contains one non-empty concrete player-action proposal;
   - the four choices are distinct literal strings;
   - choices are proposals, not completed player actions;
   - no server/UI numbering or human heading is emitted by the provider;
   - provider must verify four choice blocks before ending the response.
6. Separate THOUGHT quality/optionality from choice validity. No phrase such as `when possible`, optional guidance, or THOUGHT wording may grammatically weaken the requirement to emit exactly four choices.
7. Remove duplicated or contradictory choice instructions from ordinary Story and Opening once the shared clause is in use. Keep the rest of the narrative/identity/agency rules intact.
8. Preserve provider-authored literal authority end-to-end:
   - do not synthesize, repair, rank, paraphrase, normalize semantically, or replace missing choices;
   - do not revive deterministic/server-authored fallback choice text;
   - do not add a retry/regeneration call;
   - do not change model/provider/temperature/token settings;
   - do not make the parser invent missing blocks.
9. `reduceStoryChoiceProjection` must remain a literal structural projection only. If it currently has dead fallback/dedupe behavior that rewrites provider text, delete only the proven dead rewriting; otherwise leave it unchanged. Do not add a new gate just to duplicate the DB exact-four check.
10. Add focused behavioral regressions proving:
   - both built prompts include the same shared mandatory choice clause;
   - no Story/Opening prompt text conditions `[CHOICE]` emission on `when possible` or similar optional language;
   - four exact provider choice literals preserve text and order through `parseFreshNarrativeV2` and the choice projection;
   - Opening speaker-ID and ordinary Story identity rules remain unchanged;
   - no fallback/synthetic choice path is introduced.
11. If existing tests encode the old duplicated prompt wording, rewrite/delete those implementation-detail assertions rather than adding compatibility text.
12. Run focused prompt/parser/choice tests, full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`.

## Architecture constraints

- Provider Story/Opening authors the four literal choice proposals.
- Frontend only displays them and sends the selected literal back as player input.
- No server-authored semantic choice fallback.
- No provider retry/regeneration or model/config change.
- No new parser generation, parser relaxation, fuzzy repair, semantic gate, compatibility wrapper, generic choice taxonomy, ranking/scoring, or choice metadata authority.
- Story remains narrative author; Extract remains narrow grounded observer + natural-language `turn_summary`; Commit remains structural transaction authority.
- Preserve committed `parsed_blocks` replay/history authority and the single persisted legacy Extract read-only boundary.
- Preserve canonical scene, `npc_stats`, narrow physical/clothing/sexual mechanics, CSA institutional state, progression, media/TTS/Mind Monitor.
- Historical applied migrations and preserved evidence are immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source inspection;
- source/test/docs edits required for this protocol unification;
- local focused/full tests and static checks.

Not authorized:
- live TEST gameplay/setup/opening/reset or any DB write;
- migration/DDL authoring or application;
- API/frontend deployment;
- Production access/deployment;
- preserved manual game access;
- provider/model/temperature/token changes;
- retries/regeneration;
- new parser/harness/compatibility/semantic layer;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if ordinary Story and Opening use one unambiguous mandatory exact-four provider choice-output protocol, contradictory/optional choice wording is removed, exact literal/order behavior is preserved through the existing parser/projection, no fallback/retry/synthetic authority is introduced, and focused/full regressions pass.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact prompt/protocol changes, deleted duplication, focused/full tests, forbidden-operation confirmation and PR state;
- STOP for operator review. Do not generate the next task yourself.

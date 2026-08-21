# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-opening-contract-correction-v1
Mode: SOURCE/TEST CORRECTION — R3 OPENING PRODUCT CONTRACT + STORY-AUTHORED FOUR CHOICES
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Trigger / accepted failure evidence

This task is the narrow source correction after the accepted TEST failure:

- failed rollout task: `company-full-redesign-milestone0-test-rollout-resume-v1`
- terminal: Issue #68 `5368850298`
- operator review: Issue #68 `5368913437`
- registration main before this task: `f803ec1e582445fa35a110d37bcdbc730a18c845`

Accepted live facts from that failure:

- UTF-8-safe Setup succeeded far enough to create one valid fresh R3 game and reach Opening;
- Opening HTTP/SSE and atomic durable commit worked;
- exactly one Opening Story was generated; no retry/regeneration/second Story/ordinary gameplay occurred;
- committed Opening omitted the required player-private `상식개변` discovery/premise;
- no accepted four current Story-authored literal choices were produced/projected: Story/observer/commit choice evidence was empty;
- preserved v1/v2/hospital/manual/QA/evidence games were untouched.

This is a source-owned Opening product-contract failure. Do not solve it with another TEST retry.

## 1. Binding authority

Read and obey exact accepted redesign authority before editing:

1. PR #95 Product-first redesign canon, accepted owner-decision lineage at `9d9aec5a198d8673eb37aba8a0541adbd6c84627` and later docs-only owner locks in Issue #68;
2. PR #96 A′ Engine authority at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. Company v1 complete UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
4. accepted Milestone 0 source from PR #97 head `fed4e05108573bb71bb9086a95b9f85e592ebd29`;
5. accepted R3 native-fetch correction PR #98 head `b5bb46929cd14850feb7fe30e50f270a8cc279ea`, merged on main;
6. failure evidence `5368850298` and review `5368913437`.

Latest locked owner behavior relevant here:

- ordinary play supports free-form input plus exactly four natural Story-authored next actions;
- the same post-Story Observer/Extract structures/copies those four literal choices for UI;
- no separate choice LLM;
- no stale/prior-turn fallback;
- a choice projection failure must not discard an otherwise valid Story;
- `상식개변` is a private unfamiliar app premise known to the player and unknown to NPCs until revealed by the player.

## 2. Exact defect to correct

Current R3 already carries `productPremise(content)` into `buildStoryContext`, but the live provider contract is too weak:

- Opening is not explicitly required to show the player discovering/recognizing the unfamiliar `상식개변` app premise;
- the generic system line only says the premise is private, so the model can produce a normal office scene and omit the product premise entirely;
- Story is told to end with four suggestions, but there is no sufficiently explicit Opening/ordinary-turn visible literal boundary for the Observer to copy reliably;
- `normalizeObserver` correctly fails closed unless exactly four distinct choice strings are present verbatim in Story; do not weaken that evidence rule.

Trace the actual Opening call path before editing and prove this diagnosis against source/tests.

Expected owning paths include, but are not limited to:

- `runtime-r3/domain/content.js`
- `runtime-r3/domain/memory.js`
- `runtime-r3/domain/story.js`
- `runtime-r3/server/provider.js`
- `runtime-r3/domain/observer-normalizer.js`
- R3 worker/orchestration path that invokes Opening Story -> Observer -> reducer -> commit
- focused R3 tests.

## 3. Required correction A — explicit Opening product contract

Make the Opening Story contract implementation-specific enough that the accepted product cannot collapse into a generic office opening.

Opening must explicitly require all of the following in the single Story generation:

1. the scene is `상식개변: 회사편`, not a productivity/helpdesk/chat assistant;
2. the player is in the canonical Company setting using only registered content;
3. the player encounters/discovers/notices the unfamiliar private `상식개변` app in a natural player-visible way during Opening;
4. NPCs do not know the private app premise unless the player later reveals it;
5. the Opening includes actual workplace/social context and registered actors appropriate to canonical location/context;
6. the Story does not complete an unrequested player action;
7. the Story ends by handing agency back to the player.

Do not hard-code a full canned Opening story. The LLM remains the narrative author. The correction should strengthen the bounded Story context/prompt contract, not replace Story generation with deterministic prose.

Do not add a second semantic author or a post-hoc narrative repair LLM.

## 4. Required correction B — exactly four Story-authored literal next actions

Align Story generation and the existing post-Story Observer so the owner-locked choice contract is explicit and testable.

Required behavior:

- the Story itself authors exactly four natural, complete next-action literals at the end of Opening and ordinary Story;
- these are player actions, not labels, categories, summaries, or UI-only abbreviations;
- the four literals must be visibly present verbatim in Story in one unambiguous final choice section/boundary that the existing Observer can copy exactly;
- the Observer must return the exact four Story strings in order under the canonical field expected by `normalizeObserver`;
- `normalizeObserver` must continue requiring exact Story inclusion, exactly four non-empty values, and uniqueness;
- committed choices must derive only from that current Story/Observer result.

The presentation syntax may be a simple natural numbered/list section if consistent with the accepted product/UI, but do not introduce a second semantic choice authority.

Forbidden solutions:

- no deterministic fallback choices;
- no previous-turn/stale choice fallback;
- no truncate/pad/dedupe-to-four repair;
- no separate choice-generation LLM;
- no second Story generation;
- no hidden retry/regeneration-until-four;
- no weakening `normalizeObserver` to accept choices absent from Story;
- no frontend invention of missing choices.

If the Observer fails to project four choices from a valid Story, preserve/commit the Story according to the accepted fail-open contract and expose empty/unavailable choices rather than discarding/regenerating Story.

## 5. Keep the accepted Milestone 0 architecture intact

Do not redesign unrelated layers.

Preserve:

- A′ server-owned one-turn kernel;
- Story -> Observer -> reducer -> one atomic commit;
- Story SSE streaming and first-content/total timeout boundaries;
- one canonical turn/job owner and fencing/idempotency behavior;
- `company_r3_*` persistence namespace and already-live migration contract;
- canonical Company content/catalog adapters;
- high-parity Company v1 UI donor wiring already accepted in Milestone 0;
- player Setup/profile contract;
- R3 Supabase native-fetch correction;
- current scene model: structured location/present actors + bounded natural-language `scene_note`;
- no dynamic player arousal/erection/ejaculation gauge or sexual-event ledger.

Milestone 0 exclusions remain excluded:

- no CSA mutation implementation;
- no TTS implementation;
- no Image implementation;
- no Feedback implementation;
- no Milestone 1.

## 6. Source/test scope

Create one normal source branch from exact current main at lease time. Do not create an ops branch.

Recommended branch:

`company-redesign/milestone0-opening-contract-correction-v1`

Modify only the smallest R3 source/test set required for this defect.

Likely allowed:

- R3 Story context/prompt code;
- R3 Observer prompt/projection contract if needed;
- focused R3 tests for Opening premise + exact four literal choices + fail-open behavior;
- this CURRENT_TASK file only for normal terminal bookkeeping if the runner requires it.

Do not edit:

- SQL/migrations;
- v1/v2/hospital runtime;
- Company content semantic catalogs unless a direct source inconsistency is proven and reported before changing it;
- frontend presentation unless a direct choice-render contract defect is proven by tests (this live failure is currently upstream, so default is zero frontend changes);
- provider/model identity, temperature, token limits, secrets, or deployment config.

Prompt text/source contract changes are allowed because they are the owning defect. Provider/model/configuration changes are not.

## 7. Required tests / acceptance proof before terminal

Add focused tests that prove at minimum:

### Opening premise
- Opening Story request receives the canonical product premise;
- Opening prompt explicitly requires player-visible discovery/notice of the unfamiliar `상식개변` app;
- NPC ignorance boundary is present;
- generic assistant/helpdesk framing is forbidden;
- no deterministic canned Story replaces the LLM.

### Four choices
- a Story containing four distinct natural final action literals can be copied by Observer and normalized with exact text/order parity;
- choice strings must exist verbatim in Story;
- 0/3/5/duplicate/mutated-not-verbatim choices fail closed to unavailable choices;
- no stale/prior choice source is consulted;
- no deterministic fallback/padding/truncation exists.

### Fail-open Story
- valid Story remains usable/committable when Observer choice projection is absent/invalid;
- no retry/regeneration/second Story call is triggered by missing choices.

### Regression
- literal player action fidelity remains unchanged for ordinary turns;
- streaming/atomic commit/server-owned orchestration contract remains intact;
- current Company catalog identities are not replaced by demo content.

Run the focused R3 suite and full repository suite required by current CI. Record exact counts/results and `git diff --check`.

## 8. Forbidden operations

This task is source/test only.

Do not:

- deploy any Worker;
- apply/reapply/edit migration `20260821000100`;
- write/reset/delete/reseed TEST or Production DB data;
- create/play/retry/repair any game;
- access or mutate preserved manual/QA/evidence games;
- change provider/model/temperature/token/secrets/config;
- run live LLM acceptance;
- merge the PR;
- start Milestone 1;
- auto-register another rollout task.

## 9. Completion / stop boundary

Open/update one Draft PR for this correction and stop at source review.

Post one immutable Issue #68 terminal:

`COMPANY_FULL_REDESIGN_MILESTONE0_OPENING_CONTRACT_CORRECTION_READY_FOR_SOURCE_REVIEW`

Include:

- `STATUS: WAITING_REVIEW`;
- Task ID;
- starting main SHA;
- final exact source SHA;
- branch and Draft PR number;
- exact changed files;
- root-cause trace;
- Opening premise correction summary;
- four-choice Story/Observer contract summary;
- proof no fallback/retry/second choice LLM was introduced;
- focused test results;
- full test result;
- `git diff --check`;
- confirmation SQL/migration/DB/deploy/gameplay/frontend/provider-config/Milestone1 changes = 0.

Then STOP. Do not merge or register the next CURRENT_TASK automatically.
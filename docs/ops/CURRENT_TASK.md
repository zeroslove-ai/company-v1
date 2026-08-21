# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-opening-contract-test-rollout-v1
Mode: TEST ROLLOUT / OPENING PRODUCT ACCEPTANCE ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Trigger / reviewed source

This task follows accepted source correction:

- source task: `company-full-redesign-milestone0-opening-contract-correction-v1`
- terminal: Issue #68 `5369005518`
- operator source review: Issue #68 `5369048263`
- reviewed PR: #99
- exact reviewed source head: `4462fc9b8b5958d5f3f10630b14869cc174736eb`
- exact-head CI: Company v1 tests run `32475273462` SUCCESS
- merge commit on main: `c0b3d30095f7fffaf61722027aa23435b5cb9eb7`

The prior live failure `5368850298` proved the R3 transport/Opening commit spine worked but the generated Opening omitted the product-private app premise and produced no accepted current Story-authored four-choice projection. This task is the single bounded live closure after the source correction.

## 1. Binding authority

Obey:

1. PR #95 Product-first redesign canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A′ engine authority `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. Company v1 complete UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
4. Milestone 0 source PR #97 accepted head `fed4e05108573bb71bb9086a95b9f85e592ebd29`;
5. R3 native-fetch correction PR #98 accepted head `b5bb46929cd14850feb7fe30e50f270a8cc279ea`;
6. Opening contract correction PR #99 exact source `4462fc9b8b5958d5f3f10630b14869cc174736eb` merged as `c0b3d30095f7fffaf61722027aa23435b5cb9eb7`.

Product acceptance outranks green unit tests.

## 2. Hard scope

TEST only. No source edits.

Authorized operations:

1. verify main contains exact merged PR #99 correction;
2. verify TEST migration `20260821000100_company_r3_milestone0.sql` is already applied; **do not reapply it**;
3. deploy the R3 API Worker `game-proxy-company-r3` from exact current main because PR #99 changed runtime-r3 source;
4. do not redeploy frontend unless a deployment-integrity check proves the existing `gamebuilder-company-r3` deployment is not the previously accepted Milestone 0 frontend artifact; PR #99 contains zero frontend changes;
5. verify API `/api/r3/catalogs` returns canonical Company content;
6. create exactly **one** fresh R3 TEST game using a UTF-8-safe request path and a valid full Setup profile;
7. invoke Opening exactly **once** on that fresh game;
8. inspect the complete Opening SSE and durable `company_r3_*` readback;
9. STOP before ordinary Turn 1 gameplay.

Forbidden:

- no migration reapply/edit/new migration;
- no source/test/frontend patch;
- no second fresh game;
- no Opening retry/regeneration;
- no ordinary gameplay turn;
- no reset/delete/repair/reseed;
- no mutation of prior failed R3 games or any v1/v2/hospital/manual/QA/evidence game;
- no provider/model/temperature/token/config/secret change;
- no deterministic/stale choice fallback, padding/truncation, second choice LLM, second Story generation, or hidden retry;
- no CSA/TTS/Image/Feedback implementation;
- no Milestone 1;
- no Production access;
- no auto-merge or source work.

If Setup or Opening fails for any reason, preserve the exact evidence and STOP. Do not retry until lucky.

## 3. UTF-8-safe Setup

Use a request construction path already proven to preserve Korean UTF-8; do not repeat the earlier PowerShell literal corruption.

Create one valid full player profile using canonical catalog IDs and all active Setup fields, including:

- name;
- department_id;
- position_id;
- age;
- height_cm;
- weight_kg;
- penis_length_cm;
- body_type_id;
- speech_style_id.

Prove request and persisted profile retain exact Korean text/codepoints where applicable.

Record the one fresh game UUID in the terminal report.

## 4. Opening transport/runtime acceptance

For the single Opening request prove:

- HTTP 200 and `text/event-stream`;
- exactly one Opening Story generation;
- non-empty real-time `story_delta` sequence before terminal;
- exactly one terminal event;
- terminal status `committed`;
- no retry/regeneration/second Story;
- one durable turn 0 only;
- no duplicate turn/job residue;
- committed state revision/turn numbers are coherent;
- canonical registered actor/location IDs only.

## 5. Opening product acceptance — mandatory

Inspect the actual generated Korean Story, not only structured fields.

The Opening must visibly satisfy the Product Constitution:

1. unmistakably feels like `상식개변: 회사편`, not a productivity/helpdesk/chat assistant;
2. establishes a living Company scene using canonical registered setting/actors;
3. the player encounters/notices/discovers the unfamiliar private `상식개변` app/tool;
4. the premise remains player-private and NPCs are not portrayed as already knowing it;
5. it does not imply that merely possessing/opening the app has already changed reality;
6. it does not invent a mandatory first-work quest or complete an unrequested player action;
7. narrative is substantial/rich enough to establish workplace/social context and then returns agency to the player;
8. no OOC/protocol/observer text is visible in Story.

If any of these product conditions fails, classify as source/product acceptance failure and STOP. Do not repair live.

## 6. Four current Story-authored choices acceptance

The same single Opening Story must visibly end with exactly four natural, complete, meaningfully different player-action suggestions authored by Story.

Prove all of the following:

- exactly four visible choice actions exist in the current Story;
- Observer returns exactly four strings in the same order;
- normalized/committed choices equal those Story action literals exactly, excluding only presentation numbering if numbering is not part of the literal action text;
- each committed choice is verbatim present in current Story;
- no stale/prior-turn choices exist or are consulted;
- no deterministic fallback/pad/truncate/dedupe repair occurred;
- choices are scene-relevant actions, not generic placeholders such as “상황을 살펴본다 / 직접 입력한다” repeated independent of scene;
- free-form input remains independently available in the served frontend.

A choice projection failure may still commit Story by design, but for **this Milestone 0 Opening product acceptance** empty/unavailable choices means acceptance FAIL because the owner-locked normal product requires four current Story-authored choices.

## 7. Durable readback

Read back the fresh game from `company_r3_*` without mutating it after Opening.

At minimum record:

- game UUID;
- player profile identity;
- committed_turn/revision;
- turn count and turn numbers;
- job count/status if Opening uses a job row;
- location_id and present_actor_ids;
- Story length/text evidence summary;
- observer/normalized choice count;
- exact four committed choice strings;
- turn_summary presence;
- Mind Monitor shape if present;
- warnings;
- no unexpected CSA/TTS/Image/Feedback/dynamic sexual-meter state.

Do not delete/reset the accepted or failed fresh game. Preserve it as evidence.

## 8. Frontend read-only verification

Do not redeploy frontend unless deployment identity is unexpectedly stale.

Read the served `gamebuilder-company-r3` artifact and verify the accepted donor-derived Milestone 0 surfaces remain present:

- full Setup surface;
- Story/current stream surface;
- four-choice presentation area;
- free-form input;
- current scene/character state;
- Mind Monitor;
- player profile/state;
- company map presentation;
- `상식개변` app presentation boundary;
- no blocking loading overlay covering Story.

No UI redesign in this task.

## 9. Completion / stop boundary

On success post exactly one terminal to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_OPENING_CONTRACT_TEST_ACCEPTED`

Status: `WAITING_OWNER_REVIEW`

Include:

- Task ID;
- registration main SHA;
- deployed API Worker version ID and source main SHA;
- confirmation migration 20260821000100 was already present and apply count for this task = 0;
- frontend redeploy count and current version identity;
- fresh game UUID;
- exact Setup profile/codepoint proof;
- Opening SSE event counts;
- actual product-premise inspection result;
- actual Story richness/Company identity result;
- exact four Story-authored/Observer/committed choice strings and parity proof;
- DB readback summary;
- confirmation ordinary gameplay turns = 0;
- confirmation retries/resets/deletes/repairs = 0;
- confirmation preserved evidence/Production untouched.

On any failure post one immutable FAILED/BLOCKED terminal with exact evidence and STOP. Do not create another task automatically.

After success, do not start Milestone 1 automatically. Owner review comes next.
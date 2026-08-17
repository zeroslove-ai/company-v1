# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-history-choice-readback-contract-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v6`
- Terminal/Trigger: Issue #68 comment `5310614873` (`IC_kwDOTfvo8c8AAAABPImNWQ`) — `EXECUTION: BLOCKED`
- Operator review: Issue #68 comment `5310631153` — `CHANGES_REQUIRED_HISTORY_CHOICE_PROJECTION`
- Previous START SHA: `b12be82d579528e5590d50b086aa679a686f0d58`
- Previous final docs SHA: `7fd57b675565319e3ee4e928229038b6984b56b1`
- Previous final CURRENT_TASK blob: `a3c661e73020813206aa05c022f6b1d361ab6c0d`
- Reviewed runtime source/test lineage before this fix: `2be4b7ee29df47529f53f13393f3e3bf829a7c24`
- v6 GitHub Actions at final docs SHA: run `31983293891` = SUCCESS.

v6 independently proved one real current protocol defect:
- normal Turn 1 Story, Extract and Commit succeeded;
- fresh parsed Story contained exactly four canonical choices;
- Commit persisted `finalChoices` through `p_choices`;
- `src/api/supabase.js::listTurns()` already selects `game_turns.choices`;
- but `src/api/turn-routes.js::history()` drops `row.choices` when building `/api/history` records;
- therefore a matching committed history record returns no `choices` field even though the durable row was queried with it.

This is not permission to restore `save.last_choices` or `last_choice_meta`. Those save mirrors are retired by the Minimal Story Runtime. Canonical normal-turn durable choice authority is the committed `game_turns.choices` field.

## Objective

Make `/api/history` expose the already-committed `game_turns.choices` value as part of each history record, with exact literal/order preservation and no second choice authority.

This is a narrow source/test contract correction. Do not broaden it into product acceptance, DB redesign, compatibility restoration, parser work, or semantic validation.

## Required source behavior

Primary source file expected:
- `src/api/turn-routes.js`

Current DB client behavior in `src/api/supabase.js` already selects `choices`; do not change it unless direct inspection proves a minimal test-support change is genuinely required.

For each `/api/history` record:
1. project committed choices from `row.choices`;
2. when `row.choices` is an array, preserve its exact array order and literal string values; do not relabel, canonicalize, regenerate, dedupe, or infer;
3. when `row.choices` is absent/null/non-array, return `choices: []` as a read-boundary fail-open unless a current, directly proven historical contract requires another behavior;
4. do not derive missing history choices from `parsed_blocks`, raw Story, save state, or provider regeneration;
5. do not consult or restore `save.last_choices` / `last_choice_meta`;
6. keep all existing history fields and pagination/revision behavior unchanged:
   - `turn_number`
   - `player_input` / `player_action`
   - `story_text`
   - `parsed_blocks`
   - `turn_summary`
   - `mind_monitor`
   - `player_inner_thought`
   - `structured_action`
   - `feedback_text`
   - `committed_at`
7. opening choice replay remains owned by the existing Opening projection; do not force Opening into normal `game_turns` history.

The implementation should be as small as the contract permits. A direct projection such as `choices: Array.isArray(row.choices) ? row.choices : []` is the expected shape unless current source/tests prove a more precise equivalent is required.

## Mandatory tests

Use an existing route/API test surface where practical; `test/setup-opening.test.mjs` already constructs the API Worker and is an acceptable direct route integration surface. A small dedicated history route contract test file is also acceptable if that is materially cleaner. Do not build a new testing framework.

Add direct regression coverage proving:
1. a history DB row with `choices: ['A', 'B', 'C', 'D']` is returned by `/api/history` with exactly `['A', 'B', 'C', 'D']` in the same order;
2. literals are not rewritten or regenerated;
3. a missing/null/non-array `choices` value returns `[]` rather than inventing choices;
4. all previously projected history fields still survive the response;
5. pagination metadata (`has_more`, `next_before_turn`) remains unchanged;
6. active-record/revision semantics remain owned by `listTurns()` and are not reimplemented in the route;
7. no source/test expectation restores `last_choices` or `last_choice_meta` as current authority.

Do not add a validator that rejects historical rows because they do not have exactly four choices. `/api/history` is a faithful committed readback boundary, not a semantic repair gate. Current normal turns are expected to commit canonical exact-four choices, but history must return stored evidence rather than mutate it.

## Verification

Run at minimum:
- focused history/API route regression test(s);
- any directly affected API/frontend history tests;
- full `npm test`;
- syntax check for every modified JS/MJS file;
- `git diff --check`.

If an existing test asserts that `/api/history` omits committed choices or relies on retired `save.last_choices`, REWRITE or DELETE that stale expectation according to current canon. Do not preserve it through a compatibility field.

## Out of scope / forbidden

Do NOT:
- run live TEST gameplay, reset, Setup, Opening, or any TEST write;
- access Production/sentinel, preserved manual, QA evidence, or any other game;
- deploy API or frontend;
- author or apply migration/DDL;
- change provider/model/config/retry/regeneration behavior;
- restore `save.last_choices` or `last_choice_meta`;
- add a second choice ledger/mirror;
- add fuzzy matching, semantic gate/judge, regex outcome verifier, compatibility layer, or another parser generation;
- change scene/location/presence, CSA, clothing, physical/sexual state, summary memory, media/TTS/Mind Monitor behavior except where a directly necessary test fixture must reflect the unchanged contract;
- create another branch or PR;
- merge PR #67, mark it Ready, rebase, squash, or force-push.

## Acceptance

This task is accepted only if:
- `/api/history` exposes `game_turns.choices` exactly for committed rows;
- no retired save choice mirror is restored;
- malformed/missing row choices fail open without fabricated content;
- existing history/readback fields and pagination remain intact;
- focused and full tests pass;
- source/test diff is narrow and reviewable;
- no live TEST, deploy, DB write/migration, or forbidden-game access occurred.

Do not perform the release-candidate product acceptance in this task. After operator review of this source/test correction, a later CURRENT_TASK may deploy the reviewed source-equivalent API and resume the bounded product acceptance.

## Landing / terminal protocol

1. Freeze exact remote HEAD as `START_SHA` and verify PR #67 is OPEN / DRAFT / UNMERGED.
2. Make the narrow source/test correction on the canonical branch and commit it normally.
3. Run all required verification.
4. Push by normal fast-forward only.
5. After source/test work is fully landed, change this file only from `Status: READY` to `Status: WAITING_REVIEW` in one final docs-only commit and fast-forward push.
6. Post exactly one immutable terminal report to Issue #68 and STOP. Do not generate the next CURRENT_TASK.

Terminal report must include:
- START_SHA;
- source/test commit SHA;
- final docs SHA;
- final CURRENT_TASK blob SHA;
- exact changed files;
- exact `/api/history` choices projection behavior;
- focused test command/count/result;
- full `npm test` count/result;
- syntax-check and `git diff --check` results;
- confirmation that `save.last_choices` / `last_choice_meta` were not restored;
- confirmation of zero live TEST/deploy/DB/migration/forbidden-game operations;
- PR #67 state/head.

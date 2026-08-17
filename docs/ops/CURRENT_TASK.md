# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-choice-fail-open-projection-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v8`
- Terminal/Trigger: Issue #68 comment `5310823423` (`IC_kwDOTfvo8c8AAAABPIy7_w`) — `EXECUTION: BLOCKED`
- Previous START SHA: `b4c9ce1d7db9a53652b57e1d7c53362a01981270`
- Previous final docs SHA: `3c6f075f12fb6e45732f5ef245f56185c614d654`
- Previous final CURRENT_TASK blob: `f4e7c0811b1bfc4062daae52571314429b69e9ec`
- Previously accepted executable/source-test SHA before this fix: `4cf0542f3739ecc54864740565793f80e0d91505`
- Reviewed TEST API Worker Version used by v8: `1039c4c3-3391-44ce-bafd-1d6929841a81`
- v8 final-docs GitHub Actions run: `31985413221` = SUCCESS.

## Operator review of v8

Classification: `CHANGES_REQUIRED_CHOICE_FAIL_OPEN_PROJECTION`.

Accepted evidence before the blocker:
- exact Setup passed;
- Opening passed with four unique canonical choices and private THOUGHT isolation;
- history identity harness was corrected and proved it does not require `history.action_id`, `save.last_choices`, or `last_choice_meta`;
- reviewed API source equivalence and expected TEST migrations passed;
- no harness false-positive explains the v8 stop.

Decisive product blocker:
- Turn 1 submitted an exact provider-returned Opening choice literal;
- normal Story HTTP 200/parser success but the normal-turn parsed Story contained **zero choices**;
- Extract succeeded normally, without degraded/fail-open warnings;
- Commit still succeeded and advanced to committed turn 1;
- matching `/api/history` record had `choices: []`;
- therefore the current normal-turn canonical exact-four choice contract failed on a real committed turn.

Independent current-source root cause:
- `src/engine/runtime-core/observation-reducers.js::reduceStoryChoiceProjection()` currently returns the provider choices only when there are exactly four non-empty unique entries; any other count/shape becomes `state: []` plus warnings.
- `src/api/turn-routes.js` then calls `reduceStoryChoiceProjection({ parsedStory }).state` and passes that value directly as `p_choices` to `commit_company_turn` / feedback commit.
- The current source comment at this call site still describes the intended contract as preserving Story choices and filling missing slots, but the current reducer no longer does so.
- This is a regression from the previously accepted Story-owned choice contract. Historical accepted commit `5ea74f134128790005be2ce2acc16b3ad3b976e6` explicitly records: `4개 그대로 / 1~3개 보존+보충 / 5+ 앞 4개 / 0개 기본 4개`; earlier fail-open source used deterministic no-LLM fallback candidates and preserved existing Story choices before padding.

Do **not** restore the old broad guarded-merge architecture, Extract choice writer, `save.last_choices`, `last_choice_meta`, structured choice metadata, or any other retired semantic authority. Recover only the narrow exact-four Story-choice fail-open behavior in the current Minimal Story Runtime.

## Objective

Restore one canonical deterministic normal-turn choice projection so a malformed provider choice count cannot commit an empty/invalid choice set, while preserving raw Story streaming and preserving evidence that the provider itself missed the four-choice contract.

The runtime must remain fail-open for the Story body: do not reject or hide an otherwise valid Story solely because its choice section is short, missing, duplicated, or overlong.

## Required authority model

Keep this authority chain:

`provider raw Story`
→ `fresh parser / current Story parsed blocks`
→ **one deterministic choice projection**
→ persisted current action parsed choice projection
→ Extract observes the same Story body
→ Commit writes the same projected choices to `game_turns.choices`
→ `/api/history` / replay / refresh return the same committed choices.

Raw provider Story remains immutable audit/narrative evidence. A deterministic fallback choice is a runtime safety projection, not evidence that the provider produced a semantically good choice set.

## Required source behavior

Primary current files to inspect:
- `src/engine/runtime-core/observation-reducers.js`
- `src/api/turn-routes.js`
- `src/engine/fresh-narrative-parser.js`
- directly affected current Story/replay/frontend readback tests.

Use current-source caller proof first. Historical commits `f3b8a987b3dd85688c582384def38f40b790f330`, `1b3cdfcfe6561f9c248831b86ff07bfae571f7db`, and `5ea74f134128790005be2ce2acc16b3ad3b976e6` may be inspected only to recover the already-approved fail-open semantics; do not transplant their retired state/CSA/Extract architecture.

Implement the narrow equivalent of the accepted choice contract:

1. **Exactly four valid unique provider choices**
   - preserve the four canonical provider choice strings in order;
   - no regeneration/rewording.

2. **One to three usable provider choices**
   - preserve usable provider choices in original order/literal form;
   - deterministically fill only the missing slots until exactly four;
   - no LLM call, retry, regeneration, semantic judge, or Extract choice proposal.

3. **Zero usable provider choices**
   - return a deterministic generic four-choice fallback suitable for continuing ordinary gameplay;
   - fallback must not assert success, consent, affection, CSA compliance, relationship state, hidden facts, or a specific NPC/action that Story did not establish;
   - reuse/prove an existing safe current or previously accepted generic fallback vocabulary where practical instead of inventing a new semantic subsystem.

4. **More than four provider choices**
   - preserve the earliest usable provider choices up to four, consistent with the accepted `5+ 앞 4개` contract;
   - malformed empty/duplicate entries must not leave the final projection structurally invalid; resolve only as much as necessary to end with four non-empty distinct strings and retain warnings.

5. **Warnings / provider-quality evidence**
   - retain or improve deterministic structural warnings such as provider count not exactly four, empty choice, duplicate choice, padding/truncation;
   - the projected result being four choices must not erase evidence that the provider supplied 0/1/2/3/5+ or duplicates;
   - do not label a fallback-padded turn as provider choice-quality PASS.

6. **Single current projection**
   - do not compute one fallback at Commit while Story SSE/replay still exposes another choice set;
   - after Story completion, the current canonical parsed/persisted choice projection used by UI/replay/Extract/Commit must agree with the committed `game_turns.choices` projection;
   - raw Story text itself must not be rewritten merely to append fallback `[CHOICE]` text.

7. **Opening parity**
   - Opening already has deterministic exact-four behavior; preserve it.
   - Prefer sharing the narrow projection primitive if doing so reduces duplicate authority without changing Opening semantics.

8. **No retired mirrors**
   - do not add or consult `save.last_choices` / `last_choice_meta`;
   - do not create another durable choice ledger;
   - `game_turns.choices` remains normal-turn durable choice authority and `/api/history` remains its readback.

## Mandatory regression tests

Add focused current-runtime tests covering at minimum the matrix:

- provider choices `[]` → final exactly 4 deterministic non-empty distinct choices;
- 1 provider choice → that exact choice remains first + only 3 fallback slots added;
- 2 provider choices → both preserved in order + 2 added;
- 3 provider choices → all preserved in order + 1 added;
- exactly 4 unique choices → exact unchanged parity;
- 5+ valid choices → first four retained according to the accepted contract;
- empty/duplicate malformed choices → final exact-four non-empty distinct projection with warnings, without semantic regeneration.

Also add an API/turn integration regression proving the v8 failure shape is closed:

1. Story provider/raw parser result has zero choices but otherwise valid Story;
2. Story route still completes and raw Story is not rejected/replaced;
3. Story complete/persisted current parsed projection exposes exactly four deterministic projected choices;
4. Extract can proceed normally from the same Story body;
5. Commit succeeds once;
6. committed `game_turns.choices` receives exactly the same four strings;
7. `/api/history` returns the same four strings in the same order;
8. Story replay/refresh uses the same current committed choice projection;
9. provider-missing-choice warning remains observable.

Directly test 1–3 provider choices as well so future cleanup cannot regress back to all-or-nothing `[]` behavior.

If an existing test expects invalid normal-turn provider choice count to commit/store `[]`, REWRITE or DELETE that stale expectation according to this authority. Do not preserve it with compatibility state.

## Verification

Run at minimum:
- focused choice projection unit/regression tests;
- directly affected Story → Extract → Commit → history/replay integration tests;
- `npm test` full suite;
- syntax check for every modified JS/MJS file;
- `git diff --check`.

Inspect changed-file and caller surface before terminal. Scope must remain narrow.

## Out of scope / forbidden

Do NOT:
- run live TEST gameplay/reset/Setup/Opening or any TEST mutation;
- deploy API or frontend;
- write/apply migration or DDL;
- access Production/sentinel, preserved manual, QA evidence, or any other game;
- change provider/model/config/temperature/max-token settings;
- retry/regenerate Story to obtain choices;
- add an LLM choice repair call;
- add semantic quality gates/judges/regex outcome verifiers;
- restore `save.last_choices`, `last_choice_meta`, Extract choices, structured choice metadata, old guarded-merge choice authority, or a second choice ledger;
- alter scene/location/presence, CSA, physical/sexual/clothing, memory/summary, media/TTS/Mind Monitor behavior except directly necessary test fixture updates;
- create another branch or PR;
- merge PR #67, mark it Ready, rebase, squash, or force-push.

## Acceptance

This task is accepted only if:
- the v8 zero-choice committed-turn failure is deterministically impossible on the current normal-turn projection path;
- raw Story stays fail-open/streamable and unchanged;
- 0–3 choices are padded without discarding valid provider choices;
- 4 are preserved exactly;
- 5+ are narrowed consistently to four;
- final projected choices are non-empty/distinct/exact-four;
- provider structural failure remains visible in warnings/evidence;
- Story complete/persisted parsed projection, Commit `p_choices`, `game_turns.choices`, history, and replay are coherent;
- no retired save/Extract choice authority is restored;
- focused + full tests, syntax, and diff check pass;
- no live TEST/deploy/DB/migration/forbidden-game operation occurs.

Do not perform release-candidate product acceptance in this task. After operator review, a later CURRENT_TASK may deploy the reviewed source and continue bounded product acceptance from a fresh disposable TEST reset.

## Landing / terminal protocol

1. Freeze exact remote HEAD as `START_SHA` and verify PR #67 is OPEN / DRAFT / UNMERGED.
2. Make the narrow source/test correction on the canonical branch and commit normally.
3. Run all required verification.
4. Push normal fast-forward only.
5. After source/test work is fully landed, change this file only from `Status: READY` to `Status: WAITING_REVIEW` in one final docs-only commit and fast-forward push.
6. Post exactly one immutable terminal report to Issue #68 and STOP. Do not generate the next CURRENT_TASK.

Terminal report must include:
- START_SHA;
- source/test commit SHA;
- final docs SHA;
- final CURRENT_TASK blob SHA;
- exact changed files;
- exact 0/1/2/3/4/5+ choice projection behavior;
- proof raw Story is unchanged/fail-open;
- proof Story complete/persisted parsed choices == Commit choices == history/replay choices;
- warning behavior for provider malformed choice sets;
- focused test commands/count/results;
- full `npm test` count/result;
- syntax checks and `git diff --check`;
- confirmation `last_choices` / `last_choice_meta` / Extract choice writer were not restored;
- confirmation zero live TEST/deploy/DB/migration/forbidden-game operations;
- PR #67 state/head.

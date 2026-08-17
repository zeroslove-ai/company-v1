# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-release-candidate-remaining-coverage-v10
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v9`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5310948234` (`IC_kwDOTfvo8c8AAAABPI6jig`)
- STARTED: Issue #68 comment `5310986787`
- Terminal: Issue #68 comment `5311089704` (`IC_kwDOTfvo8c8AAAABPJDMKA`) — `EXECUTION: COMPLETE`, terminal classification `COVERAGE_NOT_REACHED`
- Previous START SHA: `31efac5f222890817044a8d35a50f5622743444e`
- Previous final docs SHA: `7be7d860534a096e8a0cd5d4e703c161ea9942d2`
- Previous final CURRENT_TASK blob: `c6ab2d5e650b9597ecd368fb29c567bb6e764c17`
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- TEST API Worker deployed by v9: `761a01bb-8cca-47ad-afde-87c0ba85c01d` (version 173)
- v9 final-docs GitHub Actions run: `31987977805` = SUCCESS.

## Operator review of v9

Classification: `EVIDENCE_ACCEPTED_COVERAGE_INCOMPLETE`.

Accepted v9 product evidence:
- exact Node/WHATWG UTF-8 Setup payload for `김하늘` passed once; exact body hash/round-trip was recorded;
- Opening passed once with four provider choices and one selected Opening literal was submitted unchanged as Turn 1;
- exactly one guarded TEST API deployment produced source-equivalent Worker `761a01bb-8cca-47ad-afde-87c0ba85c01d`; no frontend deployment;
- 10 ordinary turns committed successfully with Story/Extract/Commit success on every turn;
- every ordinary turn exposed exactly four distinct non-empty provider-projected choices and the same committed `/api/history` choices in exact order/text; no deterministic fallback was needed in this run;
- exact free-text movement `브랜드전략팀 사무실로 간다` established `brand_strategy_office`;
- exact `서원희 보러간다` established registered heroine1 as the prior participant;
- exact `윤민아 보러간다` then performed the same-location handoff: heroine2 became focal/present and heroine1 was removed while location continuity was preserved;
- canonical time advanced coherently from minute 739 to 766;
- Turn 7 same-action Story/Extract/Commit replay returned replayed=true without advancing committed_turn/save_revision;
- committed turn summaries were non-empty across the 10-turn run;
- side systems did not reject/rewrite Story or prevent Commit;
- final canonical reset returned the disposable TEST game to committed_turn=0, idle, setup/opening not_started, Level 1, no active CSA, empty history/actions/turn residue, and forbidden-game access counts remained zero;
- START -> FINAL is exactly one docs-only CURRENT_TASK READY -> WAITING_REVIEW commit; no source/test/runtime/content change occurred.

This is **not** `PRODUCT_PLAY_PASS` because mandatory acceptance debt remains.

### Why v9 long-memory evidence is incomplete, not a proven product defect

v9 established the distinctive blue-folder fact only at Turn 5 and queried it at Turn 8. At Turn 8 the origin was still inside the latest-six raw-turn window, so that interaction cannot prove older-summary continuity.

Do not use the length of raw `/api/context recent_turns` as the Story-memory verdict. Current accepted source `src/engine/story-prompt.js::buildStoryContextProjection()` deterministically projects incoming committed turns as:
- `recent_turns = turns.slice(-6)` with raw Story/parsed choices;
- `turn_summary_memory = turns.slice(0, -6)` in chronological order.

Therefore a raw context readback containing turns 1..10 does not imply that Story receives ten raw turns. The evidence runner must evaluate the actual current Story projection contract, not require a nonexistent `older_summary_count` field on `/api/context`.

### Other remaining coverage

- CSA activation-time premise/isolation was not exercised at all in v9; this is mandatory non-stochastic acceptance debt, not an optional coverage caveat.
- Compact clothing positive persistence was not attempted. One bounded supported attempt remains useful, but a provider/story outcome that does not establish a positive supported transition after the one attempt may be reported as positive-path coverage not reached; do not retry until lucky.
- v9's player self-state turn is accepted as agency/evidence-boundary coverage only; do not manufacture a posture mutation when Story/Extract exact evidence does not support one.

Do not repeat source choice micro-fixes, Mina handoff fixes, Setup transport fixes, history `action_id` compatibility, or save-level choice mirrors without new source-proven evidence.

## Objective

Close only the remaining release-candidate acceptance debt with one final bounded disposable-TEST run against the same accepted executable/source lineage.

Primary mandatory goals:
1. prove the six-raw + older chronological `turn_summary_memory` path with a fact whose origin is genuinely outside the six raw turns at the later query;
2. exercise one real supported App/CSA activation and prove activation-time workplace-premise behavior plus isolation from unrelated consent/comfort/affection/trust/romance/arousal;
3. make one natural supported compact-clothing positive-path attempt and record the exact evidence-gated result;
4. continuously retain the already-proven exact-four choice/history parity, server-authority readback, time, replay, and final-reset contracts while doing the above.

This is remaining-coverage acceptance, not retry-until-lucky after a product failure. Do not create another full general-purpose acceptance loop after this task merely because a stochastic positive clothing transition fails to fire.

## Mandatory preflight — before TEST mutation

1. Fetch origin; freeze exact branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals START.
3. Verify `f03e32c4194c114d702c43df1f6122c17c4ca7c1` is an ancestor and all descendants through START are docs-only.
4. Verify GitHub Actions for v9 final docs SHA `7be7d860...` is SUCCESS.
5. Verify expected TEST migrations exist exactly once:
   - `20260816050000 / company_v1_minimal_story_runtime_contract`
   - `20260817000100 / company_v1_final_residue_closure`
6. Verify TEST API Worker `761a01bb-8cca-47ad-afde-87c0ba85c01d` is still active and source/config/binding-equivalent to accepted source `f03e32c4...` plus docs-only descendants.
   - Do **not** redeploy merely because HEAD changed docs.
   - At most one guarded redeployment is authorized only if current Worker identity actually drifted or disappeared.
   - No frontend deployment.
7. Re-run local/read-only choice matrix, duplicate-THOUGHT privacy, and history identity self-checks only as brief deterministic guards. Do not create or edit repository test/source files.
8. Read current `buildStoryContextProjection()` and prove locally with a synthetic 10-turn input that:
   - final Story projection contains exactly raw turns 5..10;
   - `turn_summary_memory` contains turns 1..4 in chronological order;
   - the runner does not inspect raw `/api/context recent_turns.length` as if that were final Story prompt shape.
9. Read-only inspect the current App/CSA catalog and capability. Choose one existing rule/preset appropriate for a simple workplace scenario. Record exact rule/item ID, scope, operation, and current capability before live mutation. Do not invent a rule.
10. Read-only inspect compact clothing support. Canonical slots remain only `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom`; values remain the current supported enums. Do not broaden schema.

If any harness cannot satisfy these current contracts without source edits, STOP before live mutation as a harness blocker.

## Allowed disposable TEST game only

`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden:
- Production/sentinel `11111111-1111-4111-8111-111111111111`
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- every other game ID.

## One coherent remaining-coverage scenario

Target 10–12 ordinary committed turns. One scenario, one Setup, one Opening, no restart, no Story regeneration/retry.

1. Canonical reset disposable TEST and verify clean baseline.
2. Use the same known-good exact UTF-8 Setup payload as v9 (`김하늘`, brand_strategy, intern, age 30, 170/65, penis 13, balanced, polite). Setup once.
3. Opening once. Submit one exact provider-returned Opening choice literal as Turn 1.
4. Move naturally to `brand_strategy_office` if required. Use exact registered identities only; no fuzzy NPC search.
5. **Establish a distinctive harmless fact early enough.**
   - It must be Story-established and included non-empty in that turn's committed `turn_summary` no later than Turn 4.
   - Record the exact origin turn, raw Story evidence, and committed summary text.
   - After that origin turn, do not intentionally repeat/restate the distinctive fact in later player inputs or raw Story evidence before the final query. If provider spontaneously repeats it, record that contamination and choose the earliest independently clean fact already established; do not regenerate.
6. Continue ordinary coherent turns until the fact's origin is outside the current Story `recent_turns` six-raw projection.
7. On a later turn, preferably Turn 10 or later, naturally ask/reference that fact once.
8. At that query turn, capture the live committed context and locally run the exact accepted `buildStoryContextProjection()` over that context. Prove:
   - origin turn is absent from projected raw `recent_turns`;
   - origin turn appears in chronological `turn_summary_memory` with its committed non-empty summary;
   - no later raw recent turn contains an equivalent restatement that would independently reveal the fact;
   - Story's response coherently retains or correctly reasons from the distinctive fact.
   This is the memory acceptance authority. Do not expect `/api/context` itself to expose an `older_summary_count` field.

## Mandatory CSA proof in the same run

This must be exercised; do not skip it merely because Level 1 gameplay is otherwise coherent.

1. Use only the current App/CSA transaction path and one existing catalog rule/preset selected during preflight.
2. If current Level 1 capability cannot execute the selected supported transaction, use the already-approved guarded TEST-only Level-7 acceleration seam exactly once. It may change only progression/capability needed to exercise the App path; do not seed CSA rule state, scene state, memory, clothing, relations, or Story facts directly.
3. Record pre-activation game time, active rule IDs, capability, and relevant unrelated emotion/relationship/sexual state.
4. Execute the supported App transaction once. No direct DB rule seed.
5. Record the exact committed activation/effective time and post-transaction canonical active rule.
6. On the first ordinary applicable turn after activation:
   - verify Story receives the active rule through current Story world projection;
   - verify Story treats the valid applicable company rule as an in-force ordinary workplace premise from activation onward;
   - verify it does not rewrite earlier turns as if the rule had always existed;
   - personal dislike/awkwardness may remain, but must not make the active rule nonexistent/optional;
   - rule compliance must not by itself create unrelated consent, comfort, affection, trust, romance, arousal, sexual completion, or relationship milestone state.
7. Capture before/after canonical state and history/readback evidence. A real activation/projection/isolation mismatch is a product blocker. Do not retry another rule.

## Compact clothing positive-path attempt

Make exactly one natural attempt during the coherent scenario when scene context reasonably permits it.

- Use only a currently supported canonical slot/value transition. Current model includes `uniform_top` / `uniform_bottom` (`worn|removed|open|unknown`) and underwear slots (`worn|removed|unknown`).
- Prefer an unambiguous player-self transition such as explicitly changing a supported uniform slot rather than inferring an outerwear/jacket state.
- Player input is intent/attempt. Story must establish completion; Extract must provide exact Story-grounded evidence; only then may Commit change the compact clothing slot.
- If Story refuses, interrupts, leaves it as planning-only, or Extract lacks exact evidence, preserve prior clothing and record `COVERAGE_NOT_REACHED_CLOTHING_POSITIVE`; do not retry the clothing action.
- A claimed completed/evidenced transition that fails to persist in Commit/readback is a real product defect.
- Rule text alone must never mutate actual clothing.

## Contracts carried forward on every turn

These are not the main coverage target but must not regress:
- Story/Extract/Commit succeeds once per valid ordinary turn unless first decisive blocker occurs;
- projected choices exactly four distinct non-empty;
- committed `/api/history` choices exactly match projected choices in order/text;
- provider fallback/padding/truncation warnings, if any, remain distinguishable from provider-quality PASS;
- canonical scene/identity/time readback remains coherent;
- private THOUGHT does not leak into public narrative/Extract observation;
- side systems remain non-authoritative and fail-open;
- no `save.last_choices`, `last_choice_meta`, or history `action_id` compatibility assertion.

Perform one same-action Story/Extract/Commit replay/idempotence check at a safe milestone; committed_turn/save_revision must not advance.

## Decision rules

- First actual product/architecture/protocol blocker stops the run immediately. Evidence after it is invalid.
- Harness assertions must be checked against current source contract before classifying a product blocker.
- Memory and CSA are mandatory non-stochastic proofs in this task. If either is simply skipped/not attempted, the task is incomplete, not PRODUCT_PLAY_PASS.
- Clothing positive completion is the only remaining path that may finish as `COVERAGE_NOT_REACHED_CLOTHING_POSITIVE` after its single genuine attempt, provided memory + CSA + all carried-forward non-stochastic contracts pass.
- Do not retry/regenerate or run a second scenario to force a positive clothing result.
- If memory + CSA + carried-forward contracts pass and clothing either passes positively or is the sole allowed coverage gap, report that explicitly so operator can move to final release handoff rather than another gameplay acceptance loop.

## Mandatory cleanup

Whether COMPLETE/PASS/COVERAGE/BLOCKED:
1. restore/remove Level-7 acceleration effects if used;
2. canonical reset disposable TEST;
3. verify committed_turn=0, idle, setup/opening not_started, Level 1, no active CSA, canonical setup scene, empty presence, zero action/turn/history residue;
4. forbidden-game access counts all zero;
5. record exact API Worker Version used.

## Forbidden / out of scope

Do NOT:
- patch repository source/test/runtime/content/config;
- author/apply migration or DDL;
- deploy frontend;
- access Production, preserved manual, QA, sentinel, or any other game;
- change provider/model/temperature/token/config;
- retry/regenerate Story, restart, or run an alternate scenario;
- add LLM repair/judge, semantic regex outcome gate, fuzzy matching, compatibility layer, new parser, or memory ledger;
- direct-DB seed CSA semantic state, scene/presence, clothing, or memory facts;
- restore `save.last_choices`, `last_choice_meta`, or history `action_id`;
- merge PR #67, mark Ready, rebase, squash, or force-push.

## Landing / terminal protocol

1. No source/test/runtime/content commit.
2. After execution and mandatory cleanup, change only this file `Status: READY` -> `Status: WAITING_REVIEW` in one docs-only commit and normal fast-forward push.
3. Post exactly one immutable terminal report to Issue #68 and STOP. Do not generate the next CURRENT_TASK.

Terminal must include:
- START_SHA, accepted source SHA, final docs SHA/blob;
- API Worker Version/source-equivalence/deploy_count;
- exact Setup/Opening evidence and total committed-turn count;
- per-turn compact ledger with input, provider/projected choices, warnings, S/E/C result, history parity, scene/time, summary, active CSA, clothing state;
- memory proof: origin turn/raw evidence/summary, query turn, exact locally reproduced Story projection recent-turn IDs + summary-memory IDs, contamination check, Story continuity result;
- CSA proof: selected catalog rule/operation, Level-7 seam use count, pre/post activation time/state, first applicable Story result, non-retroactivity and unrelated-state isolation;
- clothing single-attempt input, Story completion/refusal/planning result, Extract evidence, Commit/readback result and classification;
- replay/idempotence result;
- first decisive blocker if any;
- final reset/isolation proof;
- zero forbidden/source/provider/retry operations;
- PR #67 state/head;
- terminal classification: `PRODUCT_PLAY_PASS`, `COVERAGE_NOT_REACHED_CLOTHING_POSITIVE`, or exact first-blocker class.

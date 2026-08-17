# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v9
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-choice-fail-open-projection-v1`
- Terminal/Trigger: Issue #68 comment `5310922893` (`IC_kwDOTfvo8c8AAAABPI5AjQ`) — `EXECUTION: COMPLETE`
- Previous START SHA: `4a280bc0d32b296609d77ca49560326b4d0d92bb`
- Accepted source/test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- Previous final docs SHA: `99f6ac749538a151a20b151d7721aa3faedb64b1`
- Previous final CURRENT_TASK blob: `65a458306b9532a03cabef5a79cdef8070a1d5e4`
- Source/test GitHub Actions run `31986414926` = SUCCESS.
- Final-docs GitHub Actions run `31986429907` = SUCCESS.
- Last reviewed TEST API Worker Version before this source fix: `1039c4c3-3391-44ce-bafd-1d6929841a81` (old executable identity; do not treat it as source-equivalent to `f03e32c4...`).

## Operator review of previous task

Classification: `ACCEPTED`.

Independent source/test findings:
- START → source/test is exactly one commit touching only `src/api/turn-routes.js`, `src/engine/index.js`, `src/engine/runtime-core/observation-reducers.js`, `test/choice-projection-api.test.mjs`, and `test/narrative-protocol.test.mjs`.
- source/test → FINAL is exactly one docs-only `CURRENT_TASK.md` READY → WAITING_REVIEW commit.
- normal-turn choice projection now preserves exact four provider choices unchanged; preserves 1–3 usable literals in order and fills only missing slots; takes earliest four from 5+ usable choices; removes empty/exact-duplicate structural invalidity only as needed; and uses four deterministic generic fallbacks when zero usable choices exist.
- fallback vocabulary does not assert success, consent, affection, CSA compliance, relationship state, hidden facts, or a specific NPC.
- provider-shape warnings remain attached to projected parsed Story, including missing-count/empty/duplicate/padding/truncation/fallback evidence.
- raw Story text and provider narrative blocks are not rewritten to append synthetic `[CHOICE]` text.
- normal Story completion projects choices before owned persistence; Extract and Story replay re-read that projected persisted parsed Story; Commit passes the same `choiceProjection.state` to `commit_company_turn`; `/api/history` reads durable `game_turns.choices`.
- direct API regression proves the prior v8 zero-choice shape through Story completion → owned persistence → Extract → Commit → `game_turns.choices` → `/api/history` → Story replay with identical four-choice order.
- focused tests 16/16 + 1/1 and full suite 305/305 passed; syntax and diff checks passed; both GitHub Actions runs succeeded.
- no `save.last_choices`, `last_choice_meta`, Extract choice writer, structured choice metadata, or second durable choice ledger was restored.
- no live TEST/deploy/DB/migration/forbidden-game operation occurred in the source-fix task.

## Objective

Run one final bounded coherent release-candidate product acceptance against the exact accepted source/test SHA `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.

This run must verify the accumulated Minimal Story Runtime as a product, not just transport. Use one disposable TEST scenario of 10–14 ordinary committed turns. Do not patch repository source/tests/runtime/content during this task.

The first decisive product/architecture/protocol blocker ends the run immediately. Do not continue later turns to dilute or overwrite a real failure.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Verify PR #67 is OPEN / DRAFT / UNMERGED and head equals START.
3. Verify accepted source/test SHA `f03e32c4194c114d702c43df1f6122c17c4ca7c1` is an ancestor of START and every descendant is docs-only.
4. Verify expected TEST migrations exist exactly once:
   - `20260816050000 / company_v1_minimal_story_runtime_contract`
   - `20260817000100 / company_v1_final_residue_closure`
5. Verify TEST API deployment identity. The previously reviewed Worker `1039c4c3-3391-44ce-bafd-1d6929841a81` predates the accepted source fix.
   - Deploy at most once, through the existing guarded TEST API path, an exact runtime/source-equivalent build of accepted source `f03e32c4...` plus docs-only descendants.
   - Record deployed Version ID and prove source/config/binding identity.
   - No frontend deployment.
6. Re-run local/read-only deterministic duplicate-THOUGHT privacy self-check.
7. Re-run local/read-only choice projection matrix self-check for 0/1/2/3/4/5+ plus blank/duplicate cases.
   - effective projection must always be exactly four distinct non-empty strings;
   - 1–3 provider literals must remain in original order;
   - exact four must remain unchanged;
   - 5+ must keep earliest usable four;
   - malformed provider evidence must remain visible in warnings;
   - raw Story must remain unchanged.
8. Re-run the history identity harness self-check: match committed rows by `turn_number` plus exact `player_action/player_input`; never require history `action_id`, save `last_choices`, or `last_choice_meta`.
9. Residual CSA inspection is read-only only. No source redesign.

If preflight cannot prove exact reviewed source/deployment identity or the deterministic harnesses fail, STOP before live mutation with the appropriate deployment/harness blocker.

## Allowed disposable TEST game only

`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden before any network access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- every other game ID.

## Clean start / Setup / Opening

1. Canonical reset disposable TEST and verify clean readback: committed_turn=0, idle, setup/opening not_started, Level 1, no active CSA, canonical setup scene, empty presence, zero history/actions.
2. Use exact Node/WHATWG `fetch` + `JSON.stringify` payload:
   - name `김하늘`
   - department `brand_strategy`
   - position `intern`
   - age 30
   - height 170
   - weight 65
   - penis length 13
   - body type `balanced`
   - speech style `polite`
3. Preserve exact serialized UTF-8 body, byte length, SHA-256, and round-trip evidence.
4. Setup exactly once. Opening exactly once. No alternate client/name.
5. Capture raw Opening, private THOUGHT behavior, four Opening choices, committed Opening readback, canonical scene/time/player state.
6. Turn 1 must submit one exact provider-returned Opening choice literal unchanged.

## Choice contract — every ordinary turn

For every committed ordinary turn record separately:
- provider/raw parsed choice shape before deterministic projection, when observable;
- projected live effective choices;
- Story complete/persisted `parsed_blocks.choices`;
- same committed turn `/api/history records[].choices`;
- warnings such as `choices_not_exactly_four`, `choices_empty`, `choices_exact_duplicate`, `choices_padded`, `choices_truncated`, `choices_fallback_applied`.

Requirements:
1. projected live choices are exactly four distinct non-empty strings;
2. committed history choices are exactly four distinct non-empty strings;
3. projected live and committed values match exactly in order/text;
4. replay of a checked turn exposes the same projected choices;
5. raw Story is not rejected/replaced solely because provider choice shape is malformed;
6. fallback use is a structural safety success but **not** evidence that the provider itself produced semantically good choices;
7. do not restore/save/read legacy choice mirrors.

A mismatch or empty committed choice set is a real product blocker. Do not retry/regenerate.

## Coherent route and identity/presence proof

Do this inside the same 10–14-turn scenario; all route turns count.

After the exact Opening-choice Turn 1:
1. Inspect committed canonical `save.scene`.
2. If not `brand_strategy_office`, submit exact free text `브랜드전략팀 사무실로 간다` once.
   - normal movement must establish the destination or a genuine coherent in-world obstacle;
   - silent ignore/replacement is a player-agency/movement blocker.
3. Establish a prior registered non-Mina local participant if necessary using exact `서원희 보러간다` (`heroine1`) or another exact registered already-local non-Mina participant.
4. Then submit exact `윤민아 보러간다` (`heroine2`) once.
5. Verify same broad location/time continuity, exact registered target identity, destination-phase Story evidence, and post-Commit canonical presence/focal handoff. A previous active participant must not remain solely because the broad location is the same.
6. Do not require nonexistent `/api/history action_id` for this proof.

## Mandatory product proofs within the same bounded run

### A. Literal + free-text player agency
- Turn 1 exact clicked/provider Opening literal unchanged.
- Include free-text actions naturally in the scenario.
- Input is intent/attempt, not guaranteed success; Story may produce coherent refusal/obstacle.
- No silent semantic rewrite of harmless player intent without Story reason.

### B. Canonical scene, identity and time
- movement/handoff requirements above;
- canonical `save.scene` remains the narrow scene/presence authority;
- canonical game time advances coherently from Extract-supported elapsed time and survives readback/replay.

### C. Explicit representable player self-state
- Include one natural explicit player self-state action that maps to currently supported narrow state (for example a clear posture/current physical state), without inventing a new schema.
- If Story establishes completion and Extract supplies valid evidence, Commit/readback must preserve it.
- If Story coherently refuses/interrupts or no supported evidence is established, do not manufacture state; record the actual outcome.

### D. Same-location Mina handoff
- Re-prove once in this coherent run using the exact route above.
- v7 historical success is supporting evidence but does not replace this run's coherent sequence.

### E. Six-raw-turn + older-summary continuity
- Establish one distinctive, harmless fact early in the scenario in Story.
- Continue until its originating turn is outside the latest six raw committed turns.
- Verify older chronological `turn_summary` entries are non-empty/updating where provider Extract has content.
- Later naturally reference or query the distinctive fact and evaluate whether Story continuity retains it from the intended six-raw + older-summary context.
- Do not add a semantic memory ledger or direct DB fact seed.

### F. CSA activation-time premise and isolation
- Use only the current supported App/CSA transaction path. No direct DB rule seeding.
- If Level 7 is needed to exercise the supported path, use only the already-approved guarded TEST-only Level-7 acceleration seam and restore it during cleanup.
- Prove a rule begins at activation time rather than retroactively.
- While active/applicable, Story treats valid company-rule compliance as the altered workplace premise while keeping unrelated consent/comfort/affection/trust/romance/arousal separate.
- Personal emotion may vary; it must not silently make an applicable valid rule nonexistent/optional.
- Do not introduce finite physical execution grammar or semantic hard gates.

### G. Compact clothing persistence — positive path when genuinely established
- Current supported slots only: `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom`.
- Attempt one natural supported clothing-state action only if it fits the ongoing scene/current model.
- Positive proof requires Story-established completion + valid Extract evidence + Commit/readback persistence in the compact slot model.
- Do not infer richer jacket/outerwear states into compact slots.
- If the positive path is genuinely not established after the full bounded scenario, report it as coverage not reached; do not retry until lucky.

### H. Choice quality evidence
- Structural exact-four projection is mandatory every turn.
- Separately record whether choices came from provider exact-four or deterministic fallback/padding/truncation.
- For provider-produced choices, inspect usefulness/diversity as product evidence without adding a semantic judge/gate.
- Fallback-generated choices may keep play usable but must not be mislabeled provider-quality PASS.
- If provider quality is repeatedly poor across the bounded scenario, report that product-quality evidence explicitly; do not alter provider/model or retry.

### I. Replay / refresh / committed readback
- At milestones, read context/history and verify Story/raw/parsed/private thought/projected choices/summary/scene/time/narrow supported state parity.
- Perform one same-action Story/Extract/Commit replay/idempotence check without advancing committed_turn/save revision.
- Refresh/readback must be reconstructible from committed server authority, not client cache.

### J. Side-system isolation
- Image/media/TTS/Mind Monitor sidecars may succeed or fail-open according to their current contracts, but may not erase/reject/redefine Story or prevent Commit of an otherwise valid turn.
- Do not deploy frontend or change side-system semantics.

## Bounded-run decision rules

- Target: 10–14 ordinary committed turns in one coherent scenario.
- No alternate scenario, restart, provider/model/config change, retry, or regeneration.
- First decisive actual product/architecture/protocol blocker ends the run immediately; evidence after it is invalid.
- Do not classify a harness-only assertion as product failure; prove contract first.
- Do not use `COVERAGE_NOT_REACHED` before completing the full bounded scenario.
- After a complete 10–14-turn attempt, `COVERAGE_NOT_REACHED` is allowed only for genuinely positive/stochastic narrow paths not established despite the coherent attempt (for example compact clothing positive persistence), not for transport/choice/movement/history defects.
- `PRODUCT_PLAY_PASS` requires the mandatory non-stochastic contracts above to pass and a coherent full run; transport success alone is insufficient.
- Provider fallback use is allowed structurally but must remain visible as provider-quality evidence.

## Mandatory cleanup / isolation

Whether PASS, COVERAGE_NOT_REACHED, or BLOCKED:
1. restore Level-7 acceleration state/seam effects if used;
2. canonical reset disposable TEST;
3. verify committed_turn=0, processing idle, setup/opening not_started, Level 1, no active CSA, canonical setup scene, empty presence, no action/turn/history residue;
4. verify forbidden game access counts remain zero;
5. record exact TEST API Version used.

## Authorized operations

Authorized:
- read-only Git/source/PR/CI inspection;
- local deterministic parser/choice/history harness checks;
- read-only TEST DB/deployment identity checks;
- at most one guarded TEST API deployment of exact accepted source `f03e32c4...` if current deployment differs;
- disposable TEST reset/setup/opening/gameplay/readback/history/replay/final reset;
- existing guarded TEST-only Level-7 acceleration seam if needed, with cleanup;
- docs-only final WAITING_REVIEW status commit;
- one immutable Issue #68 terminal report.

Forbidden:
- repository source/test/runtime/content changes;
- migration author/apply or DDL;
- frontend deploy;
- Production/preserved/QA/other-game access;
- provider/model/config/temperature/token changes;
- retry/regeneration/restart/alternate scenario;
- fuzzy matching, semantic hard gate/judge, regex outcome verifier, compatibility layer, new parser;
- direct DB scene/presence/clothing/memory/CSA semantic seeding;
- `history.action_id` compatibility addition;
- `save.last_choices` / `last_choice_meta` restoration;
- merge, Ready, rebase, squash, force-push.

## Landing / terminal protocol

1. Do not create any source/test/runtime/content commit in this task.
2. After execution and mandatory cleanup, change this file only from `Status: READY` to `Status: WAITING_REVIEW` in one docs-only commit and normal fast-forward push.
3. Post exactly one immutable terminal to Issue #68 and STOP. Do not generate the next CURRENT_TASK.

Terminal must include:
- START_SHA and accepted source/test SHA;
- deployed TEST API Version and source-equivalence proof/deploy_count;
- final docs SHA/blob and changed-file proof;
- exact Setup body bytes/hash and Opening evidence;
- per-turn table or compact evidence ledger containing input, provider choice shape, projected choices, warnings, Story/Extract/Commit result, committed history choice parity, scene/time, and key state observations;
- first-decisive-blocker if any;
- movement/prior-participant/Mina handoff evidence;
- self-state result;
- six-raw + older-summary continuity evidence;
- CSA activation-time/isolation evidence if exercised;
- compact clothing result/coverage classification;
- provider-choice quality observations separate from structural projection;
- replay/idempotence/readback evidence;
- side-system observations;
- final reset/forbidden-game isolation proof;
- PR #67 final state/head;
- one terminal classification: `PRODUCT_PLAY_PASS`, `COVERAGE_NOT_REACHED`, or a precise blocker class.

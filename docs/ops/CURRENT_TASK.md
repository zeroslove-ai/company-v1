# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: extract-turn-summary-memory-authority-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Candidate implementation awaiting review

Implemented on the same branch with source/test-only changes:

- Extract `turn_summary` now has an explicit same-call free-text continuity contract.
- `/api/commit` passes the normalized Extract summary to both `commit_company_turn` and the existing feedback-revision RPC; no synthetic summary or extra provider call was added.
- Story requests read the supported 50-turn context window, retain the latest three raw turns, and expose older turns only as chronological `{ turn, turn_summary }` memory objects.
- Fresh Story input no longer projects stale `story_summary_overall`; historical setup/opening storage and frontend readback were not changed.
- Behavioral tests cover summary persistence payloads, feedback payload parity, raw-vs-summary memory projection, stale-summary removal, prompt contract, and the 50-turn Story read.

Validation: targeted lifecycle/prompt/pipeline tests 92/92 PASS; full `npm.cmd test` 436/436 PASS; modified JS/MJS syntax PASS; `git diff --check` PASS. No TEST gameplay, DB write/reset, migration, deploy, Production access, or preserved-evidence operation occurred. Awaiting independent review; do not launch live acceptance from this task.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted gameplay executable: `47f6ff08497189e0fa2c917ae9b3e311f8b631e0`.
Prompt-closure docs descendant before this task: `98d16616d28bb13f603196e6e3092471a6fdf7aa`.
Durable preserved-evidence authority: `docs/audit/PRESERVED_EVIDENCE_APPROVAL_2026-08-15.md`; previously approved preserved evidence carries forward across task transitions while unchanged/untracked/unstaged/uncommitted.
Preserved manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.

Canonical spine:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.

Binding architecture clarification: Issue #68 `OPERATOR_ARCHITECTURE_CLARIFICATION: EXTRACT_OBSERVATION_VS_MEMORY_V1`.

## Problem proven in current source

1. Fresh Extract already returns and normalizes a top-level string `turn_summary` in the same Extract LLM call.
2. Commit currently discards it unconditionally with `const finalTurnSummary = ''` before both normal `commit_company_turn` and feedback-revision commit.
3. Story currently receives the latest three raw Story turns, while the Story route already reads up to 15 recent turns from `get_company_context`.
4. `story_summary_overall` is still projected into Story context, but no current fresh canonical writer has been proven for it; prior preserved play evidence showed stale/mojibake summary state.
5. `block_observations[].facts` are evidence-grounded Story observations, not an importance/"worth remembering" gate.

Do not add another LLM call or a rolling-memory writer merely to repair this disconnected path.

## Goal

Make the existing Extract `turn_summary` the sole fresh per-turn compressed narrative-memory output while keeping raw Story and block observations as the underlying provenance.

Target model:

`Story -> Extract once -> { block_observations, narrow projections, turn_summary } -> Commit`

Then later Story context should receive:
- latest 3 committed turns as raw Story, as today;
- older committed turns in a bounded summary-only memory window using their committed `turn_summary`;
- committed open observations as evidence-grounded facts.

No third Summary/Memory LLM. No rolling-summary rewrite is required in this cut.

## Mandatory Phase 0 — caller/writer proof

Before editing, prove from exact current source/tests/RPC call sites:
1. where fresh `turn_summary` enters the Extract prompt/output shape;
2. where `normalizeFreshExtractObservationV2` validates/preserves it;
3. where `/api/commit` currently replaces it with `''`;
4. how `commit_company_turn` and feedback revision persist `p_turn_summary`;
5. what `get_company_context` returns for recent committed turn summaries and their order/revision semantics;
6. all fresh Story readers of `story_summary_overall` and `story_summary_recent`;
7. whether either overall/recent summary field has a current canonical writer. If a writer exists, inventory it before changing authority.

If the existing RPC/history contract cannot persist and return per-turn summaries without a migration, STOP and report the exact blocker. Do not add/apply a migration in this task.

## Required implementation

### A. Keep one Extract LLM call

Retain `turn_summary` in the existing fresh Extract response. Do not add another provider request.

Prompt semantics for `turn_summary`:
- summarize only the completed current Story, never player intent that the Story did not realize;
- concise enough for many-turn context;
- retain continuity-relevant commitments, refusals, relationship movement, work developments, physical/clothing/intimate developments, and other meaningful consequences when actually present;
- free natural text, not a semantic taxonomy or enum;
- it may select/compress importance for memory, but this must not affect whether `block_observations` facts are accepted/persisted;
- empty summary is allowed only when the Story genuinely has no useful continuity content; do not impose a server semantic minimum.

### B. Stop discarding Extract summary at Commit

For a valid fresh Extract, use the normalized Extract `turn_summary` as the turn summary passed to the existing canonical commit transaction.

Normal turn:
- `commit_company_turn` remains the sole normal transaction writer.

Feedback revision:
- use the regenerated Extract summary for the revised turn through the existing feedback-revision transaction so the active revision's Story and summary stay aligned.
- do not create a parallel summary ledger or out-of-band patch.

Replay/idempotence must not duplicate or drift summaries.

### C. Story memory projection

Use committed turn summaries as the long-horizon compressed memory source.

Preferred projection:
- latest 3 committed turns: existing raw Story context;
- older committed turns from the same context fetch: summary-only objects containing at minimum `turn` and `turn_summary`; include player_action only if caller proof shows it materially improves grounding without duplicating large raw text.
- preserve chronological order.

The Story route may increase its existing `get_company_context(... p_recent_turns ...)` request up to the already-supported maximum 50 if needed so the summary-only window materially exceeds the three raw turns. Do not duplicate raw Story for those older summary-only turns.

Do not let a summary override a contradictory newer raw Story or canonical save fact. Raw committed Story/current canonical state remain higher-fidelity authority.

### D. Stale overall/recent summary residue

Because the new fresh memory authority is committed per-turn summary, independently prove current writers/readers of `story_summary_overall` and `story_summary_recent`.

If there is no current canonical fresh writer:
- remove those stale fields from fresh Story-authority input or otherwise make them explicitly non-authoritative so stale/mojibake compatibility state cannot compete with committed turn summaries;
- preserve stored fields only as historical compatibility if a real reader still requires them.

Do not introduce a new rolling `story_summary_overall` writer in this cut.

### E. Preserve observation roles

`block_observations[].facts` remain raw evidence-grounded observations. Do not ask Extract block-by-block whether a fact is "worth remembering".

`turn_summary` is the compression layer. It must never become a structural prerequisite for accepting valid block facts.

## Tests required

At minimum prove behaviorally:
1. Extract prompt still performs one provider call and returns `turn_summary` in the same response.
2. Normalized `turn_summary` survives Extract -> staged action -> Commit -> `game_turns.turn_summary` readback.
3. Commit no longer hardcodes normal valid summary to `''`.
4. Feedback revision replaces/aligns the active turn's summary with its revised Story using existing revision semantics.
5. Replay/idempotence preserves one committed summary and does not duplicate history.
6. Latest 3 raw Story turns remain present in next Story context.
7. A fact originating at least 4 turns earlier, outside the three-raw-turn window, remains represented to later Story through committed turn-summary memory.
8. Older memory projection is summary-only and does not duplicate raw Story bodies.
9. Summary ordering matches committed chronological/revision authority.
10. Block observations persist independently of whether summary is empty/nonempty.
11. No extra LLM/provider call, retry, regeneration, semantic keyword classifier, or synthetic server summary is introduced.
12. Stale `story_summary_overall` / `story_summary_recent` cannot override the new committed per-turn summary memory path.
13. Scene/presence, compact clothing, CSA institutional context, Mind Monitor, image/media, literal choices/free text remain unaffected.
14. Preserved evidence remains unchanged and approved across the task boundary.

Run focused tests plus full `npm.cmd test`, syntax checks for modified JS/MJS, and `git diff --check`. Test count is regression evidence only.

## Architecture constraints

Do NOT add:
- a third Summary/Memory LLM call;
- rolling-memory LLM rewrite in this cut;
- semantic event/relation/emotion/posture/sexual enums as summary gates;
- keyword/regex importance classifier;
- minimum summary/fact count hard gate;
- server-authored synthetic narrative memory;
- parallel summary table/ledger/writer;
- compatibility code merely for stale tests;
- a new parser.

Story remains narrative author. Extract remains the single observer/interpreter call. Commit remains non-LLM transaction authority.

## Preserved evidence / dirty-worktree rule

The durable approval in `docs/audit/PRESERVED_EVIDENCE_APPROVAL_2026-08-15.md` carries forward automatically.

- Do not STOP merely because the same already-approved preserved evidence remains present and unchanged.
- Do not clean/reset/delete/move/commit preserved evidence.
- Any genuinely new unknown untracked path, changed preserved artifact, or tracked dirt still requires STOP.
- This source/test task is not expected to create new live evidence artifacts.

## Forbidden operations

- Live TEST gameplay/LLM.
- TEST DB writes/resets.
- Migration change/apply/reapply/rollback.
- API/frontend deploy.
- Production access/mutation/deploy.
- Any access/mutation/reset of preserved manual game.
- Provider/model/temperature/token changes.
- New branch/PR, merge, Ready, rebase, squash, force-push.

## Completion / terminal report

Before COMPLETE:
- report START_SHA and executable FINAL_SHA separately from docs-only final SHA;
- show exact source proof of old summary discard and new summary flow;
- show final Extract turn-summary prompt contract;
- show normal + feedback-revision persistence/readback tests;
- show next-Story projection with last 3 raw plus older summary-only memory;
- report treatment of `story_summary_overall` / `story_summary_recent` with caller proof;
- prove block observation persistence remains independent;
- report focused/full/syntax/diff-check results;
- verify live TEST/DB/deploy/migration/Production/manual-game operations all 0;
- verify preserved evidence unchanged and no repeated re-approval STOP;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP. Do not launch live acceptance yourself.

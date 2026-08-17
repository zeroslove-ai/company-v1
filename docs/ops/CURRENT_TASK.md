# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v6
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v5`
- Trigger/terminal: Issue #68 comment `5310555280` (`IC_kwDOTfvo8c8AAAABPIikkA`) — `EXECUTION: BLOCKED`, `BLOCKER_CLASS: HARNESS_EVIDENCE_PATH`
- Operator review: Issue #68 comment `5310575732` — `EVIDENCE_ACCEPTED_HARNESS_STALE_CHOICE_AUTHORITY`
- Reviewed source/test SHA: `2be4b7ee29df47529f53f13393f3e3bf829a7c24`
- Previous final docs SHA: `4d32c1a98e5fd727bfe1d65626ee550a7d1465e5`
- Reviewed TEST API Worker Version: `733041e4-66ed-4e53-b265-7ff2bd6e002c`
- GitHub Actions on previous final docs SHA: run `31982648608` = SUCCESS.

Accepted v5 evidence:
- exact known-valid Node/WHATWG UTF-8 Setup succeeded;
- Opening succeeded with parser success, four unique choices, one private THOUGHT and no public THOUGHT leak;
- one exact provider-returned Opening literal was submitted unchanged as ordinary turn 1;
- Turn 1 Story, Extract and Commit all succeeded; commit returned turn 1 / save revision 1178 and history contained the committed turn summary;
- the external evidence runner then stopped because its `exactFour()` helper looked only for obsolete `last_choices` save paths.

That stop is not a product choice failure. Minimal Story Runtime intentionally removes `last_choices` / `last_choice_meta` from fresh save state. Current committed choice evidence lives on the turn record (`game_turns.choices`, surfaced by `/api/history`) and current-turn parsed/complete output. Do not restore stale save mirrors.

Expected TEST DB baseline to verify read-only before writes:
- `20260816050000 / company_v1_minimal_story_runtime_contract` live exactly once.
- `20260817000100 / company_v1_final_residue_closure` live exactly once.
- No migration/DDL authoring or application is authorized.

Allowed disposable TEST game only:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden game IDs — fail closed before network access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- every other game ID.

Production is forbidden.

## Objective

Run one coherent 10–14 ordinary-turn release-candidate product acceptance against the exact reviewed Minimal Story Runtime lineage, after correcting only the **temporary/external evidence reader** so it reads the current canonical committed choice path.

This is not a repository source-fixing task. No source/test/runtime/content patch is authorized.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals `START_SHA`.
3. Verify reviewed source/test SHA `2be4b7ee29df47529f53f13393f3e3bf829a7c24` is an ancestor of START_SHA and all descendants after it are already-reviewed docs-only commits.
4. Verify expected TEST migrations above are live exactly once and no unreviewed DB contract drift exists.
5. Verify deployed TEST API source equivalence.
   - Reuse Worker Version `733041e4-66ed-4e53-b265-7ff2bd6e002c` if still source-equivalent.
   - Otherwise at most one guarded deployment of the exact reviewed source-equivalent API is authorized.
   - No frontend deployment.
6. Re-run deterministic duplicate-THOUGHT privacy preflight read-only: first THOUGHT private, duplicate dropped from public/observation path with warning, exactly four canonical choices.
7. Residual CSA inspection is read-only. Do not redesign CSA projection.

## Mandatory evidence-runner correction — before live mutation

The v5 harness failure must be corrected **outside the repository only** (temporary script/evidence artifact). Do not edit repo scripts/tests/runtime just to make this acceptance run.

### Canonical choice evidence for a normal committed turn

Use these sources:
1. current turn Story/terminal parsed or complete output showing the provider/canonical choices for that turn; and
2. the matching committed `/api/history` row, whose `game_turns.choices` field is the durable committed choice projection.

`/api/history` currently selects `turn_number, ... parsed_blocks, turn_summary, mind_monitor, choices, post_save, committed_at` from active `game_turns` rows.

### Forbidden evidence paths

The harness must **not** use any of the following as current choice authority:
- `save.last_choices`;
- `save.last_choice_meta`;
- any fallback that interprets absence of those retired mirrors as a choice failure.

Do not add those fields back to runtime/save/DB compatibility state.

### Harness self-check

Before any TEST write, prove locally/read-only that the temporary `exactFour`/choice checker:
- returns PASS for a synthetic/current-shape committed turn with exactly four non-empty distinct `game_turns.choices`;
- returns FAIL for 0, 3, or 5 committed choices;
- does not inspect or require `last_choices` / `last_choice_meta`;
- can compare the four current-turn parsed/complete choices with the matching committed history row without semantic rewriting.

If the temporary harness cannot satisfy this deterministic self-check without modifying repository runtime/source, stop before live mutation and report a harness blocker.

## Clean start / Setup / Opening

1. Canonical reset the disposable TEST game and independently verify clean baseline.
2. Use the already-proven exact Node/WHATWG `fetch` + `JSON.stringify` player payload:
   - name `김하늘`
   - department `brand_strategy`
   - position `intern`
   - age 30 / height 170 / weight 65 / penis length 13
   - body type `balanced`
   - speech style `polite`
3. Setup is one normal request; no alternate name/client.
4. Perform normal `/api/opening` once.
5. Capture raw Opening, parsed blocks/private thought, exactly four canonical choices, committed Opening readback, canonical scene/time/player state.
6. Use one exact provider-returned Opening choice literal unchanged for the first ordinary turn.

## Choice contract during the live run

After each committed ordinary turn:
- capture the current turn parsed/complete choices;
- read the matching committed turn through `/api/history`;
- require exactly four non-empty committed `historyRow.choices`;
- require current parsed/complete choice set and committed `historyRow.choices` to agree structurally/literally according to the existing product projection;
- assess semantic usefulness/diversity separately from the exact-four structural contract.

Absence of `save.last_choices` is expected and must never terminate the run.

If provider/Commit actually yields fewer/more than four canonical committed choices on the current authority paths, that is a real product/protocol blocker. Capture exact evidence and stop. Do not use a deterministic fallback as proof of provider semantic quality.

## Mandatory scenario progression — ordinary gameplay establishes Mina precondition

The progression below counts toward the one coherent 10–14 ordinary-turn budget.

### Step 1 — first literal turn

Submit one exact Opening-returned choice literal unchanged and complete Story → Extract → Commit. Verify the committed history row using the corrected choice authority above.

### Step 2 — reach `brand_strategy_office`

Inspect canonical committed `save.scene.location_id`.
- If already `brand_strategy_office`, continue.
- Otherwise send exactly one ordinary free-text action: `브랜드전략팀 사무실로 간다`.
- Run the normal pipeline once and verify committed location becomes `brand_strategy_office`.
- A clear movement failure/refusal without product-established narrative reason is a real navigation blocker.

### Step 3 — establish a prior non-Mina active participant

Inspect `save.scene.present_npc_ids`.
- If an exact registered non-Mina office participant is already active, preserve that evidence.
- Otherwise send exactly once: `서원희 보러간다`.
- Verify registered `heroine1` becomes active while location remains `brand_strategy_office`.
- No direct DB/save/scene seeding.

### Step 4 — same-location Mina regression

With office location + prior non-Mina participant established, send exactly once:
- `윤민아 보러간다`

Required live proof:
- exact target resolves to registered `heroine2` / 윤민아;
- no fake or similarly named NPC is created;
- broad location remains `brand_strategy_office` because this is same-location handoff;
- time follows ordinary canonical turn progression and is not reset;
- post-Commit `save.scene.present_npc_ids` includes `heroine2`;
- prior active-scene participant is not retained solely because the location string is unchanged;
- any extra destination participant requires exact Story/destination-phase evidence.

If this fails after the precondition is truly established, stop as a real product same-location handoff blocker with raw Story, parsed, Extract, pre/post save and history evidence.

## Continue the same coherent run — total 10–14 ordinary turns

Do not reset/restart for a cleaner scenario. Continue naturally after Mina unless a decisive blocker occurs.

Mandatory proofs:

1. **Literal + free-text player agency**
   - use both exact committed choice literals and natural free text;
   - Story must not materially replace an explicit player action/current self-state with a different fact.

2. **Explicit representable player self-state — positive proof**
   - inspect current narrow supported player physical/sexual state first;
   - state one supported current fact explicitly with an ordinary next intent;
   - Story must preserve it; where Extract/Commit legitimately represents it, next-turn/readback must agree;
   - attempt/intent is not success unless Story establishes success.

3. **Canonical time**
   - no contradiction with committed time; no reset/fabrication on handoff or refresh.

4. **CSA activation-time premise + isolation**
   - if needed use only the existing guarded TEST-only Level-7 acceleration seam and clean it afterward;
   - once active/applicable, a valid company rule is the altered natural workplace premise, not optional/not-yet-effective;
   - emotion/personality may differ;
   - compliance must not imply unrelated consent, comfort, affection, trust, romance or arousal;
   - no semantic gate/retry may rewrite Story.

5. **Positive compact clothing persistence**
   - use only current supported compact slots (`uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` where applicable);
   - obtain one naturally Story-established supported clothing change;
   - verify Extract/Commit + next-turn/readback continuity;
   - if the complete bounded run never naturally establishes it, terminal may be `COVERAGE_NOT_REACHED`; do not retry until lucky or invent mappings.

6. **Continuity beyond six raw turns**
   - establish a distinctive fact early enough to leave the six-raw window;
   - verify chronological older `turn_summary` is non-empty/updating;
   - later Story must retain the fact without a continuity cliff.

7. **Choice quality**
   - every normal committed turn: exact-four from current parsed/complete + `game_turns.choices` authority;
   - separately assess whether choices are meaningfully different next actions rather than paraphrases.

8. **Reaction/progression quality**
   - no repeated non-progressing re-litigation loop.

9. **Refresh/history/replay authority**
   - context/history readback at milestones;
   - at least one supported replay/idempotence check without advancing turn/revision;
   - refresh must reproduce committed Story, parsed/private thought, exact choices, summaries, canonical scene/time and narrow physical/clothing state.

10. **Presentation sidecars remain sidecars**
   - image/media/TTS/Mind Monitor classification/failure must not erase, reject, redefine Story or block Commit.

## Stop / coverage rules

Stop immediately on the first **actual** decisive product/protocol/architecture blocker.

Do not stop because:
- Opening starts outside the office;
- Mina precondition needs gameplay turns;
- retired `save.last_choices` is absent.

`COVERAGE_NOT_REACHED` is allowed only after the coherent bounded run was genuinely attempted and a required positive narrative/stochastic mechanic such as supported clothing still did not naturally occur.

No retry/regeneration after a failed Story/Extract/provider stage. No alternate scenario after a blocker. No provider/model/config switch. No fuzzy matching, semantic judge/gate, regex outcome verifier, compatibility layer, third parser, direct scene seeding, or repository source/test/runtime patch.

## Mandatory cleanup

For every terminal outcome:
1. restore/disable TEST-only acceleration if touched;
2. canonical reset disposable TEST game;
3. independently verify committed_turn 0, zero history/actions, setup/opening not_started, Level 1, no active CSA, canonical setup scene and empty presence;
4. do not access any forbidden game.

## Acceptance

`PRODUCT_PLAY_PASS` requires:
- harness self-check passes on current committed choice authority;
- exact Setup + Opening/private-thought contract passes;
- every normal turn's exact-four committed choice contract passes via parsed/complete + `game_turns.choices`, not save mirrors;
- office precondition is acquired through ordinary gameplay;
- exact same-location `윤민아 보러간다` works live;
- no decisive agency/time/scene/CSA-premise/readback defect;
- explicit supported player self-state positive proof;
- positive supported compact-clothing persistence proof;
- >6-turn chronological summary continuity;
- useful semantic choice diversity;
- refresh/history/replay parity;
- presentation side systems remain non-authoritative.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- temporary evidence-runner code/artifacts **outside repository only**;
- deterministic local harness/validator/parser checks without repository edits;
- read-only TEST DB/deployment preflight;
- at most one exact reviewed source-equivalent TEST API deployment if required;
- disposable TEST reset/setup/opening/gameplay/readback/history/replay/final reset;
- existing guarded TEST-only Level-7 acceleration seam when needed, with cleanup;
- docs-only CURRENT_TASK WAITING_REVIEW update + normal fast-forward push;
- exactly one immutable Issue #68 terminal report.

Not authorized:
- repository source/test/runtime/content/script patch;
- migration/DDL authoring/application;
- restoring `last_choices` / `last_choice_meta` compatibility mirrors;
- frontend deploy;
- Production/sentinel/preserved-manual/QA/other-game access;
- provider/model/config/retry/regeneration changes;
- direct DB/save/scene/presence seeding;
- fuzzy/semantic/parser/compatibility workaround;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Terminal report requirements

On any terminal outcome:
- set this file to `WAITING_REVIEW` and fast-forward push docs-only;
- post exactly one immutable terminal report containing:
  - START_SHA / reviewed source equivalence / deployed API Version;
  - DB/migration + duplicate-THOUGHT preflight;
  - deterministic harness self-check and proof it does not inspect `last_choices`;
  - Setup + Opening result;
  - per-turn current parsed/complete choices + matching committed `game_turns.choices` count/parity;
  - office movement and prior-participant progression;
  - exact Mina handoff raw Story / parsed / Extract / pre-post scene evidence;
  - total committed-turn count and stop point;
  - self-state / clothing / >6-turn memory evidence;
  - semantic choice-quality and CSA premise observations;
  - replay/context/history/refresh and sidecar evidence;
  - final reset readback;
  - forbidden-operation confirmation;
  - PR #67 OPEN / DRAFT / UNMERGED state.
- STOP. Do not create the next CURRENT_TASK yourself.

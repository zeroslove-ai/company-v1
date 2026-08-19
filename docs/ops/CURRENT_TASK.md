# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: live-7turn-runtime-collapse-v1
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place on `main`. Do not create a new CURRENT_TASK file. Do not create a new ops/task-registration branch.

## 0. Owner decision

The fresh owner manual acceptance run failed hard after only 7 committed turns. Do not continue the 30–50 turn acceptance and do not patch the failed game.

Preserved failed evidence game:

- TEST project: `fmcrspgxstsmxxsmkeee`
- game: `df3045fd-c359-4cdc-8783-357ddfebe398`
- owner failure review: latest Issue #68 `USER_LIVE_ACCEPTANCE_FAILED` comment
- preserve read-only; never reset/reseed/revise/replay/mutate this game in this task

This failure proves that the current fresh-play architecture is still too fragmented. The next source cut must simplify the turn boundary itself instead of adding another layer of recovery patches.

Binding canon remains the latest repository canon, especially `CURRENT_TRUTH.md`, `AGENTS.md`, and the 2026-08-16 through 2026-08-18 minimal-runtime/spine canons. This task may supersede stale tests or donor-style client orchestration when they conflict with the live evidence below.

## 1. Frozen registration / branch rule

Use the exact `REGISTRATION_MAIN_SHA` and `CURRENT_TASK_BLOB_SHA` from the latest Issue #68 `CURRENT_TASK_READY` comment for this Task ID.

At execution start:

1. fresh-fetch `origin/main`;
2. require exact registered main SHA and CURRENT_TASK blob;
3. require the registration delta from prior main to be only this reused `docs/ops/CURRENT_TASK.md`;
4. require failed game `df3045fd-c359-4cdc-8783-357ddfebe398` to exist and remain read-only;
5. if executable source/config/content/migration drift exists, STOP `BLOCKED_LIVE7_REGISTRATION_DRIFT`.

Implementation branch:

`company/live-7turn-runtime-collapse-v1`

Create exactly one Draft PR for this task. Do not merge. Stop at `WAITING_REVIEW`.

## 2. Verified live failure evidence

### 2.1 Turn pipeline hard lock

After committed turn 7, expected turn 8 produced two action rows:

1. synthetic CSA action `b6fe0daa-06cb-438c-b553-ec655a457da6`
   - player_action: `회사 규정 변경사항 1건이 공식 반영된다.`
   - processing_status: `commit_failed`
   - error_code: `stale_action_timeout`
   - Story length: 0

2. actual owner input action `499ecbe6-56c6-4555-8dff-f05f61563673`
   - same expected_turn=8
   - processing_status: `story_streaming`
   - Story length: 0
   - no Extract/Commit

At the same time canonical save remained committed_turn=7 / expected_turn=8 / processing_status=ready. The UI could therefore enter another expected-turn-8 action while an action row was stranded.

### 2.2 Fresh frontend owns too much execution state

Current fresh frontend `src/frontend/pages/app.js`:

- calls Story, Extract and Commit as separate network stages;
- persists a localStorage pending object with a client-owned `step`;
- automatically resumes/retries stage work through `checkRecovery`, `settlePendingBeforeNewAction`, and `runRecovery`;
- may clear a stale pending and continue a new action in the same click.

This client-owned stage machine is now rejected for fresh play. Presentation may retain an action ID/reconnect hint, but the browser must not be the owner of Story -> Extract -> Commit progression.

### 2.3 CSA app incorrectly consumes a gameplay turn

Current `src/frontend/pages/csa-app.js` validates an app transaction and hands `validated.display_input + validated.canonical_action` to `onSubmit`; `app.js` then calls `startNewAction(displayInput, canonicalAction)`.

Therefore a deterministic app transaction becomes a synthetic player turn and can block normal gameplay. This is now a proven defect, not an observation-only behavior.

Required product decision:

- applying a CSA/common-sense transaction is a deterministic app state transaction, **not** a narrative player turn;
- it must not increment committed_turn;
- it must not create `game_turns`;
- it must not create a fake `player_turn` action whose text is `회사 규정 변경사항 ...`;
- after a successful app transaction, refresh canonical context and let the next real player action's Story observe the already-active exact rule.

### 2.4 Player/NPC identity contamination in Extract

The player is canonically:

- `player_id=player-1`
- `name=금태양`

Yet fresh Extract assigned exact quotes naming `금태양` to registered NPC `general_park_jungwoo`.

Examples from preserved turn 3 / 5:

- quote naming `금태양` -> `general_park_jungwoo.position_label = 이메이 앞에 서 있다`
- quote `금태양이 그녀의 책상 가장자리에 ...` -> `general_park_jungwoo` presence evidence

This is forbidden. Player identity and registered NPC identity are finite structural identities and must never be substituted for one another.

### 2.5 Summary / Mind Monitor gaps remain

Turn 3:

- Extract outcome=`success`
- committed `turn_summary=''`
- committed Mind Monitor `{}`
- warnings show all requested Mind Monitor targets missing

A non-empty successful Story must not create a blank durable summary. Latest canon already permits bounded Story fallback when Extract summary is blank; that fallback must be persisted as committed summary, not merely used transiently later.

Mind Monitor also over-targets: several turns generated qualitative monitor text for all six present office residents even when only one current interaction mattered. Presence alone must not mean “generate private thoughts for everybody.”

### 2.6 Physical state is still unsafe

Turn 3 Extract proposed heroine5 clothing changes while committed clothing remained stale. The same Extract also proposed wrong state (`underwear_top=removed`) from a quote that still described the bra as visible.

Turn 4 persisted an unrelated heroine2 position label while the active interaction was with heroine5.

Turn 6 visible clothing manipulation again left durable clothing unchanged.

Required principle:

- optional physical state may be conservative, but it may not be confidently wrong;
- only finite current product clothing/position fields with exact actor identity and exact Story evidence may write;
- uncertain or unsupported state is dropped field-locally and prior state remains;
- do not invent a broader posture/contact/sexual grammar in this task.

### 2.7 Visible Story protocol corruption committed

Turn 5 visibly contained protocol/self-repair garbage including:

- `DIALOGUE speaker_id=...`
- `[ooc]...마커를 잘못 사용했습니다...[/ooc]`
- repeated SCENE restart text

Fresh generation/streaming may be fail-open for narrative meaning, but provider protocol-control garbage must not become committed user-visible canonical narrative.

This is structural protocol hygiene only. Do not add a semantic Story verifier.

## 3. Architecture target — collapse fresh turn execution

### A. One server-owned fresh turn operation

Create one canonical fresh-play endpoint/operation (name may follow repository conventions, e.g. `/api/turn`) that owns:

1. reserve exactly one action;
2. stream Story deltas to the client;
3. parse/store canonical Story;
4. run the single post-Story Extract observation;
5. reduce and Commit;
6. emit terminal committed/failed state.

The browser must not call `/api/story` -> `/api/extract` -> `/api/commit` as three authoritative fresh-play stages anymore.

Existing stage routes may remain temporarily for narrowly proven historical/tests/internal compatibility, but fresh frontend must have one server-owned path. Do not create a second semantic runtime.

### B. Action concurrency / terminality

At the DB/service boundary, guarantee at most one non-terminal action for one game + expected_turn.

Required behavior:

- a second request while the same expected turn already has a real non-terminal action must resolve to the existing action / deterministic in-flight conflict; it must not create another row;
- stale timeout must transition the stranded action to a terminal failed state server-side;
- only after terminal failure may a new explicit owner submission reserve that expected turn;
- no automatic LLM retry/regeneration;
- no client-created replacement action in the same recovery click;
- committed action replay is idempotent.

Prefer strengthening the existing `reserve_turn_action` transaction/locking semantics rather than layering a client race workaround. One additive migration that changes the existing transaction boundary is allowed if required, but do not apply it live in this source task.

### C. Simplify frontend recovery

Delete/rewrite the fresh-play client stage machine:

- no client-owned `step=story|extract|commit` authority;
- no automatic `retry_story/retry_extract/retry_commit` for ordinary turns;
- no automatic resume that can regenerate LLM output;
- local pending may retain only a minimal reconnect identity (game/action/expected turn/original input) if genuinely needed;
- on refresh: committed => refresh canonical context; terminal failed => clear pending and restore input; non-terminal => show processing/reconcile the same server action, never create a second one;
- user input must never disappear permanently on failed uncommitted action.

Streaming remains required: visible Story deltas should still arrive as they are generated. Do not bring back a full-screen blocking loader.

### D. CSA app is a non-turn transaction

Introduce/reuse the smallest canonical server transaction for applying the already-validated signed CSA transaction without Story/Extract/gameplay Commit.

Requirements:

- verify signed exact transaction against current save/revision;
- compute exact deterministic next CSA rule/save state using the existing finite CSA implementation;
- compare-and-swap save safely;
- increment save revision as required by the save contract but **leave committed_turn unchanged**;
- create no `game_turns` row;
- create no fake gameplay `game_actions` row;
- refresh frontend context after success;
- transaction failure is shown in the app and does not affect gameplay turn state.

If no safe non-turn CAS save writer exists, one narrow additive RPC/migration source is allowed. It must be structural only, `SECURITY DEFINER`, fixed `search_path`, service_role-only execute, and use existing save validation. Do not apply migration to TEST in this source task.

### E. Finite player-vs-NPC identity boundary

For retained NPC observation/evidence:

- player `player-1` / current canonical player names are explicitly separate from NPC IDs;
- a quote naming the player cannot be assigned to any NPC;
- durable NPC physical/presence evidence must contain a finite canonical alias for that exact NPC or use an already-structural speaker/actor ID from parsed Story;
- use repository-known full/short aliases only; no fuzzy identity matching;
- if identity is uncertain, drop the optional field rather than guessing;
- add exact regressions using player `금태양` and `general_park_jungwoo`.

Do not resurrect a semantic actor classifier.

### F. Persisted summary fallback

If Story committed successfully and Extract root JSON is readable but `turn_summary` is blank/missing:

- derive the existing bounded natural-language Story fallback;
- persist that fallback as the committed `game_turns.turn_summary`;
- later context/history reads the committed summary;
- no second summarizer / no second LLM.

### G. Mind Monitor target reduction

Mind Monitor remains qualitative/presentation-only and in the same Extract call.

Target only structurally relevant NPCs, using a small finite set derived from current focal NPC + actual parsed local dialogue speaker(s) + exact registered navigation/action target where already structurally resolved.

- do not request every `present_npc_id` merely because they share the office;
- no generic emotion/relationship ledger;
- no exact quote requirement for private thought text;
- missing MM remains fail-open and cannot fail a turn.

### H. Conservative physical state

Inventory the exact currently consumed clothing/position values.

- retain only states with a real UI/next-Story consumer;
- require exact actor identity + exact Story evidence for writes;
- reject/drop unsupported or contradictory proposed state field-locally;
- the preserved turn-3 style quote must never produce `underwear_top=removed` when the same quote says the bra is still visible;
- unrelated actor position writes (turn-4 style heroine2 contamination) must be impossible;
- if a useful clothing state cannot be represented by the current finite schema, preserve prior structured state rather than inventing a new broad grammar in this task.

### I. Structural protocol hygiene

Fresh Story output contract must prohibit OOC/self-repair/control chatter.

At parser/stream canonicalization boundary, ignore/drop unsupported control blocks such as `[ooc]...[/ooc]` and malformed protocol-control lines so they cannot become committed canonical narrative.

This cleanup is limited to protocol/control syntax. Do not classify, rewrite, approve, or reject narrative semantics.

After Story completes, committed/readback rendering must use canonical parsed blocks rather than trusting raw provider protocol text as display authority.

## 4. Required tests

Add/rewrite focused regressions proving at minimum:

1. one fresh frontend submission calls one canonical server turn operation; frontend does not directly orchestrate Extract and Commit;
2. Story still streams visibly before terminal Commit;
3. two actions competing for the same game/expected_turn cannot both become non-terminal rows;
4. stale action terminalizes deterministically; next action is allowed only after terminal state and only from a new explicit submission;
5. no automatic Story/Extract/Commit LLM retry path remains for ordinary turns;
6. CSA app apply changes canonical CSA save/revision but committed_turn, game_turn count, and gameplay action count do not advance;
7. CSA apply failure cannot strand normal turn processing;
8. player `금태양` evidence cannot mutate `general_park_jungwoo` presence/position/MM/physical state;
9. finite valid NPC alias evidence still works;
10. blank Extract summary on successful Story persists bounded Story fallback into committed turn;
11. Mind Monitor targets current relevant NPCs, not every office resident;
12. wrong/unsupported clothing proposal is dropped without erasing other valid fields;
13. unrelated actor position contamination is rejected;
14. `[ooc]` / malformed DIALOGUE protocol-control garbage is absent from committed canonical display blocks;
15. exact-four choices, player literal action fidelity, existing navigation, scene, CSA finite mechanics, media and TTS presentation sidecars remain regression-green.

Run focused tests, then full suite, syntax checks, `git diff --check`, and exact-head CI.

KEEP/REWRITE/DELETE stale tests based on the new accepted architecture; do not add compatibility code merely to preserve a test that encoded client-owned stage orchestration or synthetic CSA turns.

## 5. Absolute no-go

- no mutation/reset/reseed/replay/revision of failed game `df3045fd-c359-4cdc-8783-357ddfebe398`;
- no mutation of other preserved manual games/templates;
- no TEST/Production deployment in this source task;
- no live migration apply / DDL / DB data write;
- no Production/hospital-v2 access;
- no provider/model change;
- no retry/regeneration strategy to mask failures;
- no second LLM call;
- no semantic router/classifier/verifier;
- no generic relation/emotion/event/sexual ledger;
- no generic consent matrix;
- no schedule/presence simulator;
- no broad physical DSL;
- no `zeroslove-ai/py-all` or external TTS Worker write/deploy;
- no merge;
- no next task generation.

## 6. Terminal boundary

When implementation is complete:

1. keep exactly one Draft PR open and unmerged;
2. update this branch copy of `docs/ops/CURRENT_TASK.md` to `Status: WAITING_REVIEW`;
3. post one new immutable Issue #68 terminal report with:
   - Task ID;
   - registration main/blob;
   - implementation/final head;
   - Draft PR;
   - focused/full test counts;
   - exact-head CI run;
   - exact files/migration source changed;
   - proof failed game remained untouched;
   - proof frontend no longer owns fresh Story->Extract->Commit stage progression;
   - proof CSA apply no longer consumes a gameplay turn;
   - any remaining known gaps;
4. STOP `WAITING_REVIEW`.

## 7. Execution result

- implementation head: `2d053486f86205fbaa552bf9283d317cac5ed620`
- Draft PR: `#86` (`https://github.com/zeroslove-ai/company-v1/pull/86`), unmerged
- focused contract tests: `4 passed`
- full suite: `375 total, 372 passed, 3 skipped, 0 failed`
- exact-head CI: workflow `Company v1 tests`, run `32224958744`, head `2d053486f86205fbaa552bf9283d317cac5ed620`, `success`
- changed source: server-owned `/api/turn`, save-only `/api/app-apply`, frontend turn/recovery/CSA wiring, relevant Mind Monitor targeting, summary fallback, protocol OOC rejection, and source-only CSA CAS migration
- failed game `df3045fd-c359-4cdc-8783-357ddfebe398` was not accessed or mutated by this task
- no deployment, migration application, TEST reset, Production access, provider/model change, or merge was performed

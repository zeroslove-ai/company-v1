# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v4
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v3`
- Trigger/CURRENT_TASK_READY: Issue #68 comment `5310339293` (`IC_kwDOTfvo8c8AAAABPIVY3Q`)
- Terminal: Issue #68 comment `5310402788` — `EXECUTION: BLOCKED`
- Operator review: Issue #68 comment `5310423134` — `EVIDENCE_ACCEPTED_BLOCKED_SETUP_TRANSPORT_UNRESOLVED`
- Reviewed source/test SHA: `2be4b7ee29df47529f53f13393f3e3bf829a7c24`
- Previous final docs SHA: `330027336aaa033f8e8ad32576984d9d1bc0397a`
- Current reviewed TEST API Worker Version from v3: `733041e4-66ed-4e53-b265-7ff2bd6e002c`
- GitHub Actions on previous final docs SHA: run `31981164395` = SUCCESS.

The v3 run completed deployment and deterministic preflight, then stopped at the first live Setup request with `invalid_player_setup: invalid_name`. It committed zero gameplay turns and performed the mandatory final reset successfully.

Do **not** treat that single response as a proven product Setup defect yet. The terminal did not preserve the exact serialized request body/name bytes. Current source accepts a non-empty trimmed name up to 20 JS characters, setup regressions pass with `김하늘`, and the canonical Node live canary contains a valid Korean setup payload. A harness/UTF-8 serialization defect therefore remains plausible.

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

Recover the v3 product acceptance without guessing or patching source:

1. deterministically isolate the Setup `invalid_name` blocker using one exact known-valid UTF-8 Node request; and
2. only if that exact Setup succeeds, continue one coherent 10–14 turn release-candidate product acceptance carrying all outstanding v3 proofs.

This is an evidence task, not a source-fixing task. No source/test/runtime/content change is authorized.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact current branch HEAD as `START_SHA`.
2. Verify PR #67 is OPEN / DRAFT / UNMERGED and head equals `START_SHA`.
3. Verify reviewed source/test SHA `2be4b7ee29df47529f53f13393f3e3bf829a7c24` is an ancestor of `START_SHA`; descendants after it must be docs-only unless independently reviewed otherwise.
4. Verify expected TEST migrations above are live exactly once and no unreviewed DB contract drift exists.
5. Verify deployed TEST API source equivalence.
   - If Worker Version `733041e4-66ed-4e53-b265-7ff2bd6e002c` is still source-equivalent to reviewed source SHA, do not redeploy.
   - If it is no longer equivalent, at most one guarded deployment of the exact reviewed source-equivalent API is authorized.
   - No frontend deployment.
6. Re-run the deterministic duplicate-THOUGHT privacy preflight read-only on current source:
   - first THOUGHT remains canonical private thought;
   - later duplicate THOUGHT is absent from public blocks, `scene_text`, and `buildStoryObservationBlocks()`;
   - duplicate warning remains;
   - exactly four canonical choices remain.
7. Keep residual CSA audit read-only only; do not redesign CSA projection in this task.

## Setup transport isolation — mandatory exact contract

Before any live Setup request, construct this exact player object in Node:

```js
{
  name: '김하늘',
  department_id: 'brand_strategy',
  position_id: 'intern',
  age: 30,
  height_cm: 170,
  weight_kg: 65,
  penis_length_cm: 13,
  body_type_id: 'balanced',
  speech_style_id: 'polite'
}
```

Requirements:

1. Use Node/WHATWG `fetch` + `JSON.stringify`; do not use PowerShell/shell-interpolated JSON for this request.
2. Before network access, round-trip the exact serialized JSON with `JSON.parse` and prove:
   - parsed `name === '김하늘'`;
   - JS character length is `3`;
   - all fields exactly equal the object above.
3. Run current `validatePlayerSetupInput()` locally against the current canonical catalogs and prove `valid === true` for this exact object.
4. Build exactly one `/api/player-setup` body as `{ game_id, player }` using the disposable TEST game ID.
5. Preserve the exact serialized request body as UTF-8 text plus byte length/hash in the temporary evidence artifact outside the repository.
6. Perform canonical disposable TEST reset and independent clean-baseline readback before the Setup request.
7. Send the exact Setup request once.

### Setup decision boundary

If the server again returns `invalid_player_setup: invalid_name`:
- STOP immediately as `PRODUCT_SETUP_BLOCKER_CONFIRMED`;
- do not try another name, encoding, shell, client, or request;
- capture exact serialized body/hash, HTTP status, API error body, deployed Worker identity, current source SHA, and local validator PASS;
- perform mandatory final reset/readback;
- do not patch source in this task.

If Setup succeeds:
- treat v3 `invalid_name` as an acceptance harness/transport artifact, not a product defect;
- continue directly into Opening and the coherent product run below without resetting/restarting the game.

## Coherent product acceptance after successful Setup

One provider attempt per stage only. No retry/regeneration until lucky.

### Opening

1. Perform normal `/api/opening` using the successful `setup_id`.
2. Capture raw Opening, parsed blocks, first private THOUGHT, canonical choices, committed Opening readback, scene/time/player state.
3. No duplicate/private THOUGHT may appear as public narrative.
4. Use one exact provider-returned Opening choice literal unchanged for the first normal turn.

### 10–14 turn scenario — mandatory proofs

1. **Literal + free-text agency**
   - use both exact committed choice literals and natural free text;
   - Story must not materially replace an explicit player action/current self-state with a different fact.

2. **Explicit representable player self-state — positive proof**
   - inspect the existing narrow representable state first;
   - state one supported current player fact explicitly with an ordinary next intent;
   - Story must preserve it, and where current Extract/Commit legitimately represents it, next-turn/readback continuity must agree.

3. **Same-location exact registered NPC handoff — mandatory**
   - naturally reach `brand_strategy_office` with prior active local participant(s);
   - send exact UTF-8 free text `윤민아 보러간다` once;
   - target/cast must hand off to registered `heroine2` without fake identity or location jump;
   - canonical location/time must not change merely because target shares the same broad location;
   - post-Commit `save.scene.present_npc_ids` must include `heroine2` and must not retain prior active-scene NPCs solely because location string is unchanged;
   - extra presence requires exact destination-phase Story evidence.

4. **Canonical time**
   - Story must not contradict committed game time;
   - elapsed time must follow the established deterministic/observed path.

5. **CSA activation-time premise + isolation**
   - if needed, use only the existing guarded TEST-only Level-7 acceleration seam, exactly as already authorized, with cleanup;
   - once active/applicable, a valid company rule is the altered natural workplace premise, not optional/not-yet-effective;
   - personality/emotion may differ;
   - compliance must remain separate from unrelated consent, comfort, affection, trust, romance and arousal;
   - no semantic gate/retry may rewrite Story.

6. **Positive compact clothing persistence**
   - use only currently supported compact slots proven by source (`uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` where applicable);
   - obtain one Story-established supported clothing change naturally in this one run;
   - verify Extract/Commit and next-turn/readback continuity;
   - if not naturally reached, report `COVERAGE_NOT_REACHED`, do not manufacture or rerun.

7. **Continuity beyond six raw turns**
   - establish a distinctive fact early enough to leave the most-recent-six raw window;
   - verify chronological older `turn_summary` memory is non-empty/updating and later Story retains the fact without a continuity cliff.

8. **Choice quality**
   - every normal provider turn exposes exactly four literal committed choices;
   - record semantic usefulness/diversity, not just count.

9. **Reaction/progression quality**
   - no repeated non-progressing loop that keeps re-litigating the same active rule.

10. **Refresh/history/replay authority**
   - perform committed context/history readbacks at milestones;
   - at least one supported replay/idempotence check must not advance committed turn/revision;
   - refresh/readback must reproduce committed Story/parsed blocks/private thought/choices/summaries/scene/time/narrow physical-clothing state.

11. **Presentation sidecars**
   - image/media/TTS/Mind Monitor failure/classification must not erase, reject, redefine Story or block Commit.

## Stop rule

Stop on the first decisive architecture/protocol/product blocker.

Do not:
- retry/regenerate a failed provider/Story/Extract stage;
- change the player name after the one exact Setup attempt;
- patch source/test/runtime/content;
- add fuzzy repair, semantic gate/judge, regex outcome verifier, compatibility layer, third parser, provider/model/config workaround;
- assemble disconnected probes and call them one coherent acceptance.

If a mandatory positive proof is simply not reached in the single coherent run, terminal status is `COVERAGE_NOT_REACHED`, not PRODUCT_PLAY_PASS.

## Mandatory cleanup

For every terminal outcome — `PRODUCT_PLAY_PASS`, `PRODUCT_SETUP_BLOCKER_CONFIRMED`, other `BLOCKED`, or `COVERAGE_NOT_REACHED`:

1. restore/disable the existing TEST-only Level-7 acceleration seam if used;
2. canonical reset the disposable TEST game;
3. independently read back clean final state: committed_turn 0, no actions/turns, setup/opening not_started, Level 1 baseline, no active CSA, canonical setup scene and empty presence;
4. do not touch any forbidden game.

## Acceptance

`PRODUCT_PLAY_PASS` requires:
- exact Node UTF-8 known-valid Setup succeeds;
- deterministic duplicate-THOUGHT privacy preflight passes;
- same-location Mina handoff works live;
- no decisive agency/time/scene/CSA-premise/readback defect;
- explicit player self-state positive proof;
- positive supported compact-clothing persistence proof;
- continuity after the six-raw window through chronological summaries;
- exactly four committed choices with useful semantic diversity;
- refresh/history/replay parity;
- presentation side systems remain non-authoritative.

If exact locally validated Node UTF-8 Setup still returns `invalid_name`, that is a decisive Setup product/API blocker and must not be worked around in this task.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- deterministic local validator/parser/caller preflight without source edits;
- read-only TEST DB/deployment identity preflight;
- at most one exact reviewed source-equivalent TEST API deployment if required;
- disposable TEST reset/setup/opening/gameplay/readback/history/replay/final reset;
- existing guarded TEST-only Level-7 acceleration seam when needed, with mandatory cleanup;
- temporary evidence files outside the repository;
- docs-only CURRENT_TASK status update to WAITING_REVIEW and normal fast-forward push;
- exactly one immutable Issue #68 terminal report.

Not authorized:
- source/test/runtime/content edits;
- migration/DDL authoring/application;
- frontend deploy;
- Production/sentinel/preserved-manual/QA/other-game access;
- provider/model/config/retry/regeneration changes;
- fuzzy/semantic/parser/compatibility workaround;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Terminal report requirements

On any terminal outcome:
- set this file to `WAITING_REVIEW` and fast-forward push the docs-only status change;
- post exactly one immutable terminal report containing:
  - START_SHA / reviewed source equivalence / deployed API Version;
  - migration/DB preflight;
  - duplicate-THOUGHT deterministic preflight;
  - exact local Setup validation result;
  - exact serialized Setup body text, UTF-8 byte length/hash, HTTP result and setup_id/error;
  - scenario committed-turn count and stop point;
  - Mina handoff evidence;
  - self-state evidence;
  - compact clothing evidence or explicit coverage non-reach;
  - six-raw-window summary/continuity evidence;
  - choice-quality and CSA premise observations;
  - replay/context/history/refresh evidence;
  - final reset readback;
  - forbidden-operation confirmation;
  - PR #67 OPEN / DRAFT / UNMERGED state.
- STOP. Do not create the next CURRENT_TASK yourself.

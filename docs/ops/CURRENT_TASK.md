# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v2
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous accepted task:
- Task: `minimal-story-runtime-same-location-npc-visit-handoff-land-recovery-v1`
- Operator review: Issue #68 comment `5310233293` — ACCEPTED
- Reviewed source/test SHA: `c4ceed11845c127d813c821506f688f02d4c063c`
- Accepted final docs SHA before this registration: `be684bb6aead877aa02ad5e461d9b847da56d35b`
- GitHub Actions on the accepted final SHA: `Company v1 tests` run `31979206141` = SUCCESS.

The same-location registered-NPC visit fix is now actually landed and reviewable. This task is therefore a bounded TEST product-acceptance task, not a source-fixing continuation.

Expected TEST DB baseline to verify before writes:
- Minimal Story Runtime migration `20260816050000 / company_v1_minimal_story_runtime_contract` is live once.
- Final residue migration `20260817000100 / company_v1_final_residue_closure` is live once.
- No migration/DDL change is authorized in this task.

Allowed disposable TEST game only:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`

Forbidden game IDs — fail closed before network access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- every other game ID.

Production is forbidden.

## Objective

Run one coherent release-candidate product acceptance against the exact post-Minimal-Story-Runtime lineage after the same-location handoff fix.

The run must prove the actual gameplay spine, not only transport/tests:

`player input / exact literal`
→ minimal committed context
→ Story
→ Extract observation
→ Commit
→ committed save/turn/history/readback
→ next Story.

The decisive live regression is now the prior Turn-5 failure:
- while already at broad location `brand_strategy_office`, with other active local participants,
- action `윤민아 보러간다`
- must resolve to exact registered target `heroine2`, hand Story to the target scene/cast, and Commit canonical presence without retaining prior active-scene NPCs merely because the map location string stayed the same.

This task also carries the owner acceptance debt that was explicitly deferred until this blocker landed.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact current branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals START_SHA.
3. Verify accepted source/test SHA `c4ceed11845c127d813c821506f688f02d4c063c` is an ancestor of START_SHA and that commits after it up to START_SHA are docs-only unless independently reviewed otherwise.
4. Verify the two expected Minimal Story Runtime TEST migrations above are live exactly once and no unreviewed DB contract drift is present.
5. Verify current deployed TEST API identity/source equivalence.
   - If the current API is already source-equivalent to `c4ceed11845c127d813c821506f688f02d4c063c`, do not redeploy.
   - Otherwise deploy exactly the reviewed source-equivalent API once using the existing guarded deployment path.
   - Frontend source did not change in the accepted blocker cut; do not redeploy Frontend merely to match a docs-only SHA.
   - After any API deploy, record exact Worker Version and independently verify source identity before gameplay.
6. Run a deterministic local/read-only preflight for the known Opening duplicate-THOUGHT risk before spending the live attempt:
   - exercise the current Opening parser/projection with a synthetic provider output containing more than one `[THOUGHT]` block;
   - verify player thought does not leak into player-visible narrative or become misleading narrative through duplicate demotion;
   - do not create a new parser generation or patch source in this task;
   - if current code deterministically leaks duplicate THOUGHT into narrative, STOP as a source blocker, final-reset only if TEST was already touched, and report exact evidence.
7. Read-only caller audit before live run:
   - inspect `src/engine/csa/story-projection.js` residual candidates including `authorityFor()` / `modeFor()` and clothing `required_state` / `compliant` projection;
   - classify current callers/Story visibility only; do not delete or patch them here;
   - if a field is proven to actively reintroduce retired semantic Story authority and would invalidate the product run, STOP and report; otherwise carry zero-caller/deletion candidates to review.

No retry/regeneration or provider/model/config change is allowed during preflight or live acceptance.

## Live acceptance — one attempt only

After preflight passes, use only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.

### A. Clean start / setup / Opening

1. Canonical reset and read back the clean state before setup.
2. Perform normal Setup and Opening with the existing production-equivalent path.
3. Capture raw Opening, parsed blocks, exact four choices, committed Opening readback, canonical scene/time and player state.
4. Verify no player THOUGHT is rendered as ordinary narrative. If the provider naturally emits duplicate THOUGHT, inspect the exact behavior; do not regenerate to obtain a cleaner sample.
5. Click one exact provider-returned Opening choice literal for the first normal turn; no rewritten/paraphrased choice transport.

### B. Coherent 10–14 turn human-style scenario

Run one continuous scenario, not disconnected probes. One provider attempt per stage only.

The scenario must cover all of the following when current mechanics permit:

1. **Literal and free-text player agency**
   - include both exact clicked literals and natural free-text actions;
   - Story must not silently replace a material explicit player action/current self-state with a different fact.

2. **Explicit player physical/self-state fidelity — positive proof**
   - before choosing the action, inspect the current source contract and choose one explicit current player physical or sexual fact that is actually representable by the existing narrow player state; do not invent a new schema;
   - state that fact explicitly in player input together with an ordinary next intent;
   - verify Story preserves rather than contradicts/replaces the explicit current fact;
   - where the existing narrow Extract/Commit contract legitimately represents it, verify committed/readback continuity on the next turn;
   - player intent/attempt is not success unless Story establishes success.

3. **Registered navigation and same-location handoff — mandatory live regression**
   - construct the naturally coherent situation where player is already in `brand_strategy_office` with prior active local participant(s);
   - send exact free text `윤민아 보러간다`;
   - verify Story target/cast is `heroine2` and canonical location/time do not jump merely to perform the handoff;
   - after Commit, canonical `save.scene.present_npc_ids` includes `heroine2` and does not carry prior active-scene participants solely from the previous same-location scene;
   - if Story gives exact destination-phase evidence for an additional registered accompanying NPC, that existing path may add the NPC; fake/unknown identities must not appear.

4. **Canonical time**
   - Story must not contradict committed game time;
   - elapsed time must advance through the established deterministic/observed path only.

5. **CSA premise coherence and side-system isolation**
   - if needed for deep coverage, use the already-existing safe TEST-only Level-7 acceleration seam; do not modify Production progression or create another seam;
   - activate one current CSA at a specific turn/time using the normal TEST product path;
   - once active/applicable, Story must treat following the valid company rule as the altered natural workplace premise rather than an optional policy decision;
   - personality/emotion may differ;
   - unrelated consent/comfort/affection/trust/romance/arousal must not be inferred from compliance;
   - no runtime semantic gate/retry may rewrite Story to force a pass.

6. **Positive compact clothing persistence — mandatory proof**
   - inspect the current supported compact slots first: use only actual supported vocabulary such as `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` as current source confirms;
   - obtain one positive Story-established clothing-state change through normal narrative/CSA behavior without retry-until-lucky or inventing unsupported jacket/shirt mapping;
   - verify Extract/Commit persist the supported compact change and next-turn/readback continuity preserves it;
   - if the single coherent attempt never establishes any supported positive clothing event, report `COVERAGE_NOT_REACHED` rather than inventing success or rerunning until green. This means full product acceptance is not proven.

7. **Long-horizon continuity across the six-raw boundary — mandatory**
   - establish one distinctive work/context fact early enough that its source turn leaves the most-recent six raw turns;
   - continue far enough to verify chronological older `turn_summary` memory is non-empty/updating and the later Story does not suffer a continuity cliff;
   - inspect the exact context/readback shape rather than merely counting turns.

8. **Choice quality**
   - every normal provider turn must expose exactly four literal choices through the committed/UI readback contract;
   - record whether the four choices represent meaningfully different next actions rather than repetitive paraphrases;
   - a structural four-count alone is not semantic product acceptance.

9. **Reaction/progression quality**
   - verify the narrative does not get stuck repeatedly re-litigating the same active rule or repeating the same non-progressing reaction loop;
   - do not add a runtime LLM judge or hard semantic gate. Human/operator evidence is sufficient for this task.

10. **Refresh / history / replay authority**
   - during the run, perform committed context/history readback after important milestones;
   - perform at least one supported replay/idempotence check without advancing committed turn/revision;
   - simulate/reuse the existing refresh/readback path and verify the same committed reality reappears: Story, parsed blocks, exact choices, summary, canonical scene/time and narrow physical/clothing state.

11. **Presentation sidecars remain sidecars**
   - media/image/TTS/Mind Monitor failure or classification must not erase/reject/redefine Story or block Commit;
   - do not treat presentation classification as gameplay semantic authority.

### C. Stop rule

- Stop immediately on the first decisive architecture/protocol/product blocker.
- Do not continue turns and later claim them as acceptance evidence after a decisive blocker.
- Do not retry/regenerate the failed Story/Extract/provider stage.
- Do not patch source, add compatibility behavior, switch providers/models, add regex verification, fuzzy matching or semantic gates.
- Capture the exact player action, raw Story, parsed blocks, Extract, pre/post canonical save, committed turn/history and relevant deployed identity for the blocker.

### D. Final cleanup

Whether PASS, BLOCKED or COVERAGE_NOT_REACHED:
1. restore/disable the existing TEST-only Level-7 acceleration seam if it was used, using its current supported cleanup path;
2. canonical reset disposable TEST game;
3. independently read back clean final state: no committed turns/actions, setup/opening not_started, Level 1 baseline, no active CSA, canonical setup scene/empty presence as current reset contract defines;
4. do not touch any forbidden game.

## Acceptance

`PRODUCT_PLAY_PASS` requires all mandatory proofs above, including:
- same-location exact registered NPC handoff works live;
- no decisive player-agency/time/scene/premise/readback defect;
- explicit player self-state positive proof;
- positive supported compact-clothing persistence proof;
- continuity after the six-raw window through chronological summaries;
- exact four committed choices with useful semantic diversity;
- refresh/history/replay parity;
- side systems remain presentation-only.

If a mandatory positive path is not reached in this one attempt, do not call the product accepted. Report `COVERAGE_NOT_REACHED` and let operator review decide the next evidence task. Do not rerun until lucky.

A failing run may still be `EVIDENCE_ACCEPTED`; that is not `PRODUCT_PLAY_PASS`.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- deterministic local parser/caller preflight without source edits;
- read-only TEST DB/deployment identity preflight;
- at most one exact reviewed source-equivalent TEST API deployment if required;
- disposable TEST game reset/setup/opening/gameplay/readback/history/replay/final reset;
- existing guarded TEST-only Level-7 acceleration seam when needed, with mandatory cleanup;
- immutable Issue #68 terminal report;
- docs-only CURRENT_TASK status update to WAITING_REVIEW in the canonical lineage and normal fast-forward push of that docs-only status commit.

Not authorized:
- source/test/runtime/content changes;
- migration/DDL authoring or application;
- Frontend deploy without a newly proven frontend source identity mismatch attributable to this accepted cut; frontend source is expected unchanged;
- Production, sentinel, preserved-manual, QA evidence or any non-disposable game access;
- provider/model/config/retry/regeneration changes;
- new parser generation, fuzzy target logic, semantic gate/judge, compatibility layer or generic memory system;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Terminal report requirements

On PASS, first decisive blocker, or COVERAGE_NOT_REACHED:
- set this file to `WAITING_REVIEW` and fast-forward push the docs-only status change;
- post exactly one immutable terminal report to Issue #68 containing:
  - START_SHA / reviewed executable/source-equivalence / deployed API Version if changed;
  - migration/DB preflight result;
  - duplicate-THOUGHT deterministic preflight result;
  - residual CSA Story-projection caller audit result;
  - exact live scenario turn count and stop point;
  - same-location Mina handoff evidence;
  - player self-state evidence;
  - compact clothing positive evidence or explicit COVERAGE_NOT_REACHED;
  - six-raw-window memory evidence;
  - choice-quality observations;
  - CSA premise/side-system observations;
  - replay/context/history/refresh evidence;
  - final reset readback;
  - forbidden-operation confirmation;
  - PR #67 OPEN / DRAFT / UNMERGED state.
- STOP. Do not create the next CURRENT_TASK yourself.

## Deferred release hygiene — do not execute here

After stable product evidence only:
- refresh stale PR #67 body to match actual Minimal Story Runtime state;
- decide landing/history consolidation strategy for the very large PR history.

These are operator decisions after product stabilization, not part of this acceptance run.

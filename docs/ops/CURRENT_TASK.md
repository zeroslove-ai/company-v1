# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v3
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous accepted task:
- Task: `minimal-story-runtime-duplicate-thought-privacy-boundary-v1`
- Terminal: Issue #68 comment `5310327614` — COMPLETE
- Operator review: Issue #68 comment `5310335579` — ACCEPTED
- Reviewed source/test SHA: `2be4b7ee29df47529f53f13393f3e3bf829a7c24`
- Accepted final docs SHA before this registration: `6249cac19db290312df1fcecaefedca5bff2e943`
- GitHub Actions on the accepted final SHA: `Company v1 tests` run `31980407039` = SUCCESS.

The duplicate-THOUGHT privacy leak is now closed at source/test level: first THOUGHT remains canonical private `player_inner_thought`; later duplicate THOUGHT content is dropped from public parsed blocks / `scene_text` / Extract observation while the raw provider Story and duplicate warning remain available.

The earlier same-location registered-NPC handoff source fix also remains in this lineage at `c4ceed11845c127d813c821506f688f02d4c063c`.

Expected TEST DB baseline to verify before writes:
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

Run one bounded, coherent release-candidate product acceptance against the exact reviewed Minimal Story Runtime lineage after both:
1. same-location exact registered-NPC handoff correction; and
2. duplicate-THOUGHT privacy-boundary correction.

This is a product-evidence task, not a source-fixing task. No source/test/runtime/content patch is allowed inside this run.

The gameplay spine under test is:

`player input / exact choice literal`
→ minimal committed context
→ Story LLM
→ fresh parser/private-thought boundary
→ Extract observation
→ Commit
→ committed save/turn/history/readback
→ next Story.

## Mandatory preflight — before TEST mutation

1. Fetch origin and freeze exact current branch HEAD as `START_SHA`.
2. Verify PR #67 remains OPEN / DRAFT / UNMERGED and head equals START_SHA.
3. Verify reviewed source/test SHA `2be4b7ee29df47529f53f13393f3e3bf829a7c24` is an ancestor of START_SHA and that commits after it to START_SHA are docs-only unless independently reviewed otherwise.
4. Verify expected TEST migrations above are live exactly once and no unreviewed DB contract drift is present.
5. Verify current deployed TEST API identity/source equivalence.
   - If already source-equivalent to reviewed SHA `2be4b7ee29df47529f53f13393f3e3bf829a7c24`, do not redeploy.
   - Otherwise deploy exactly that reviewed source-equivalent API once through the existing guarded deployment path.
   - Frontend source did not change in the accepted privacy cut; do not redeploy Frontend merely to match docs-only SHA.
   - Record exact Worker Version after any deploy and verify source identity before gameplay.
6. Deterministically re-run the duplicate-THOUGHT privacy preflight locally/read-only using the current source:
   - one visible SCENE;
   - at least two non-empty THOUGHT blocks;
   - exactly four distinct CHOICE blocks;
   - first THOUGHT must remain canonical private thought;
   - later duplicate THOUGHT must not appear in public blocks, `scene_text`, or `buildStoryObservationBlocks()`;
   - duplicate warning must remain;
   - no retry/regeneration and no source patch.
   - If this deterministic boundary is not satisfied, STOP as a source blocker.
7. Read-only residual CSA caller audit:
   - `authorityFor()` / `modeFor()` were previously observed as zero-caller deletion candidates; recheck only if still present.
   - clothing `required_state` / `compliant` must not be removed or treated as dead merely by name. This acceptance task does not redesign CSA projection.

## Live acceptance — one coherent attempt only

After preflight passes, use only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.

### A. Clean start / Setup / Opening

1. Canonical reset and independently read back clean baseline.
2. Perform normal Setup and Opening through the existing production-equivalent path.
3. Capture raw Opening, parsed blocks, canonical four choices, committed Opening readback, canonical scene/time and player state.
4. Verify no duplicate/private THOUGHT is rendered as ordinary narrative. If provider naturally emits duplicate THOUGHT, inspect that single sample; do not regenerate for a cleaner result.
5. Use one exact provider-returned Opening choice literal for the first normal turn.

### B. Coherent 10–14 turn scenario

One provider attempt per stage only. Do not assemble disconnected probes.

The same run must cover the following mandatory proofs where current mechanics support them:

1. **Literal and free-text player agency**
   - use both exact clicked literals and natural free-text;
   - Story must not replace a material explicit player action/current self-state with a different fact.

2. **Explicit representable player self-state fidelity — positive proof**
   - inspect current source contract first and choose one current player physical/sexual fact that the existing narrow state can actually represent;
   - state it explicitly together with an ordinary next intent;
   - Story must preserve rather than contradict/replace the explicit current fact;
   - where the existing narrow Extract/Commit contract legitimately represents it, verify committed/readback continuity on the next turn;
   - intent/attempt is not success unless Story establishes success.

3. **Same-location exact registered NPC handoff — mandatory live regression**
   - naturally reach `brand_strategy_office` with prior active local participant(s);
   - send exact free text `윤민아 보러간다`;
   - Story target/cast must hand off to registered `heroine2` without fake identity or location jump;
   - canonical location/time must not change merely because target shares the same broad location;
   - after Commit, `save.scene.present_npc_ids` must include `heroine2` and must not retain prior active-scene NPCs solely because the map location string is unchanged;
   - additional NPC presence is allowed only from existing exact destination-phase Story evidence.

4. **Canonical time**
   - Story must not contradict committed game time;
   - elapsed time advances only through the established deterministic/observed path.

5. **CSA activation-time premise coherence and side-system isolation**
   - if needed, use only the already-existing guarded TEST-only Level-7 acceleration seam and clean it afterward;
   - activate one current CSA through the normal TEST product path at a specific turn/time;
   - once active and applicable, following the valid company rule must be treated as the altered natural workplace premise, not an optional/not-yet-effective policy decision;
   - personality/emotion may differ;
   - compliance must not imply unrelated consent, comfort, affection, trust, romance, or arousal;
   - no semantic gate/retry may rewrite Story into compliance.

6. **Positive compact clothing persistence — mandatory proof**
   - inspect actual supported compact vocabulary first; use only current supported slots such as `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom` where source confirms them;
   - obtain one positive Story-established supported clothing-state change through normal narrative/CSA behavior without inventing unsupported mappings or retry-until-lucky;
   - verify Extract/Commit persistence and next-turn/readback continuity;
   - if the single coherent attempt never establishes a supported positive clothing event, report `COVERAGE_NOT_REACHED`; do not manufacture or rerun coverage.

7. **Long-horizon continuity beyond the six-raw window — mandatory**
   - establish a distinctive work/context fact early enough that the source turn leaves the most-recent six raw turns;
   - continue far enough to verify chronological older `turn_summary` memory is non-empty/updating and later Story does not suffer a continuity cliff;
   - inspect exact context/readback shape, not only turn count.

8. **Choice quality**
   - every normal provider turn must expose exactly four literal committed choices;
   - record whether the choices represent meaningfully different next actions rather than repetitive paraphrases;
   - structural four-count alone is not semantic acceptance.

9. **Reaction/progression quality**
   - narrative must not get stuck repeatedly re-litigating the same active rule or repeating the same non-progressing reaction loop;
   - no runtime LLM judge/hard semantic gate is permitted.

10. **Refresh / history / replay authority**
   - perform committed context/history readback after important milestones;
   - perform at least one supported replay/idempotence check without advancing committed turn/revision;
   - exercise the existing refresh/readback path and verify the same committed reality reappears: Story, parsed blocks/private thought, exact choices, summaries, canonical scene/time and narrow physical/clothing state.

11. **Presentation sidecars remain sidecars**
   - image/media/TTS/Mind Monitor classification/failure must not erase, reject, or redefine Story or block Commit.

### C. Stop rule

- Stop immediately on the first decisive architecture/protocol/product blocker.
- Do not continue turns and later count them as acceptance evidence after a decisive blocker.
- Do not retry/regenerate a failed provider/Story/Extract stage.
- Do not patch source, add compatibility behavior, switch provider/model, add regex verification, fuzzy matching, or semantic gates.
- Capture exact player action, raw Story, parsed blocks, Extract, pre/post canonical save, committed turn/history and deployed identity for the blocker.

If a mandatory positive proof is simply not reached in the single coherent attempt, report `COVERAGE_NOT_REACHED`, not PRODUCT_PLAY_PASS.

### D. Mandatory cleanup

Whether PASS, BLOCKED or COVERAGE_NOT_REACHED:
1. restore/disable the existing TEST-only Level-7 acceleration seam if used;
2. canonical reset disposable TEST game;
3. independently read back clean final state: no committed turns/actions, setup/opening not_started, Level 1 baseline, no active CSA, canonical setup scene and empty presence as the current reset contract defines;
4. do not touch any forbidden game.

## Acceptance

`PRODUCT_PLAY_PASS` requires all mandatory proofs above, including:
- duplicate-THOUGHT privacy deterministic preflight passes on reviewed source;
- same-location exact registered NPC handoff works live;
- no decisive player-agency/time/scene/premise/readback defect;
- explicit player self-state positive proof;
- positive supported compact-clothing persistence proof;
- continuity after the six-raw window through chronological summaries;
- exactly four committed choices with useful semantic diversity;
- refresh/history/replay parity;
- presentation side systems remain non-authoritative.

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
- docs-only CURRENT_TASK status update to WAITING_REVIEW and normal fast-forward push.

Not authorized:
- source/test/runtime/content changes;
- migration/DDL authoring or application;
- Frontend deploy merely to match docs-only/source-equivalent API state;
- Production, sentinel, preserved-manual, QA evidence or any non-disposable game access;
- provider/model/config/retry/regeneration changes;
- new parser generation, fuzzy target logic, semantic gate/judge, compatibility layer or generic memory system;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Terminal report requirements

On PRODUCT_PLAY_PASS, first decisive blocker, or COVERAGE_NOT_REACHED:
- set this file to `WAITING_REVIEW` and fast-forward push the docs-only status change;
- post exactly one immutable terminal report to Issue #68 containing:
  - START_SHA / reviewed source-equivalence / deployed API Version if changed;
  - migration/DB preflight result;
  - duplicate-THOUGHT deterministic preflight result;
  - residual CSA caller audit result;
  - exact live scenario committed-turn count and stop point;
  - same-location Mina handoff evidence;
  - player self-state evidence;
  - compact clothing positive evidence or explicit COVERAGE_NOT_REACHED;
  - six-raw-window summary/continuity evidence;
  - choice-quality observations;
  - CSA premise/side-system observations;
  - replay/context/history/refresh evidence;
  - final reset readback;
  - forbidden-operation confirmation;
  - PR #67 OPEN / DRAFT / UNMERGED state.
- STOP. Do not generate the next CURRENT_TASK yourself.

## Deferred release hygiene — do not execute here

Only after stable product evidence:
- refresh stale PR #67 body to match actual Minimal Story Runtime state;
- decide landing/history consolidation strategy for the very large PR history.

These are operator decisions after product stabilization, not part of this acceptance run.

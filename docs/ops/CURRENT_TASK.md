# Company — CURRENT TASK

Status: READY
Task ID: company-r3-final-holistic-owner-style-long-play-v2
Mode: SOURCE-FROZEN FINAL PRODUCT ACCEPTANCE -> NEW CLEAN OWNER-STYLE LONG PLAY -> CROSS-FEATURE EXIT MATRIX
Updated: 2026-08-24 02:37 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387491499`
Previous holistic failure: Issue #68 comment `5387276200`
Operator review: Issue #68 comment `5387503664`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery branch. Work on `main` only.

## 0. Source-frozen baseline

Accepted executable/source for this holistic retest:
- `ef52695668ab8548ed89b2eeb68c21ea95d836ba`

Current main before this registration:
- `10181f521b1ec5159f978ee9c0a9effff09f0e2e`
- direct docs-only descendant of `ef526956...`.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- Bare public frontend: `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation at this baseline:
- focused CSA/UI: 22/22 PASS;
- full `npm.cmd test`: 531/531 PASS;
- changed JS/MJS syntax: PASS;
- `git diff --check`: PASS.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`;
- failed holistic V1 fixture `f84aa0f0-6658-41a2-8fed-c307d4d2e219`;
- CSA repair acceptance fixture `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`.

Create entirely NEW disposable TEST games for this task.
Do not resume any prior holistic campaign.

## 1. Why V2 exists

Holistic V1 was source-frozen and stopped correctly at the first decisive product failure: an active CSA rule with fixed scope exposed only `해제` and no meaningful CHANGE path.

The isolated repair `company-r3-csa-active-rule-preset-change-v1` is now operator-accepted GREEN:
- active rules expose a bounded replacement-preset CHANGE affordance;
- CHANGE stages locally as one pending draft;
- Revert performs zero gameplay requests;
- Apply emits one canonical `operation:'update'` turn;
- the same rule id survives while the template changes;
- duplicate/current/no-op/custom/batch/deactivate+activate workarounds remain absent;
- bare-public APPLY -> CHANGE -> unrelated -> REMOVE -> unrelated passed;
- API/runtime CSA chronology was unchanged.

Therefore V2 must restart the complete holistic matrix from new clean campaigns and determine whether the whole product is now ready for the owner's final manual playtest.

This task is ACCEPTANCE ONLY.

## 2. Hard freeze / fail-fast rules

Do not edit runtime/frontend/test/content/config/provider code during this task.
Do not commit product/source changes.
Do not deploy merely to manufacture a pass.
Do not retry or regenerate a Story/turn to manufacture a pass.
Do not change provider/model/temperature/token/timeout/config/secrets.
Do not change DB schema/RPC/migration/RLS/grants.
Do not access Production.
Do not mutate any preserved game listed above.
Do not use direct gameplay API calls as a substitute for visible product actions.
Do not use `?api=` override, storage preseed, DOM mutation, or hidden writer to bypass UI.

If a decisive product failure occurs:
1. preserve that fresh disposable fixture at the failure turn;
2. capture exact literal action, visible Story, committed/readback state, relevant DOM/network evidence;
3. STOP `FAILED_PRODUCT` / `WAITING_REVIEW` immediately;
4. do not patch it and do not continue collecting unrelated failures.

If the deployed artifact lineage does not match the accepted versions, STOP `BLOCKED_DEPLOYMENT_DRIFT` before product play. Do not silently redeploy from an uncertain head.

## 3. Frozen product contracts under final review

Evaluate these together as one game:

### Opening / identity
- every new game begins on the player's first day / first arrival / first appointment regardless selected rank;
- selected department/rank remains authoritative, including executive/senior and low/junior profiles;
- private CSA app discovery is optional/curious/tempting, never a forced quest or player action authored by Story;
- player inner thought is visible natural first-person Korean and does not invent player decisions/outcomes;
- relevant NPC Mind Monitor is character-specific natural first-person Korean.

### Player agency / scene
- exact player actor/target/action/request/refusal/change-of-mind/self-state/topic/intent remains central;
- Story may resolve external success/refusal naturally but may not replace the attempted action with a different player action;
- player intent is not automatic NPC consent/affection/comfort/desire/romance/trust;
- canonical navigation/location/presence must match literal destination intent and narrated scene;
- remote/off-scene NPC mentions must not make them present;
- scene note must describe the current scene rather than stale old-location activity.

### Choices / presentation
- current choices are Story-owned; when Story emits a supported terminal 1–4 choice block, UI exposes exactly four actionable choices;
- no fabricated fallback/resurrected previous choices;
- each visible choice button dispatches its exact full literal once;
- current normal Story surface is latest/current scene only;
- full committed chronology remains in History overlay/export, not as stale normal-surface cards.

### Time / continuity
- meaningful ordinary conversation/movement/work/social beats advance time plausibly;
- obvious frozen-time or chronology contradictions are failures;
- refresh/re-entry reconstructs committed server truth rather than stale client cache.

### CSA
- local draft/replacement edits perform zero gameplay writes before explicit Apply;
- exactly one pending operation at a time;
- APPLY/CHANGE/REMOVE are each exactly one chronological normal Story turn;
- CHANGE is one `update` on the same rule id, not deactivate+activate;
- active rule replacement uses only the bounded existing preset catalog;
- later unrelated ordinary turns are literal-action-first and contain no stale `csa_operation`;
- CSA institutional compliance must not mechanically create affection/comfort/consent/desire/romance/trust/personality obedience in Mind Monitor.

### Media / TTS
- approved image selection is deterministic, present-character/focal-evidence grounded, and fail-open when ambiguous;
- TTS OFF means zero synthesis calls;
- TTS ON sends only eligible committed canonical present-NPC dialogue through browser -> R3 API -> server `TTS_WORKER` binding;
- narrator/player/player-inner-thought/Mind Monitor text is never synthesized as character dialogue;
- replay/cache/stale fencing works and browser `speechSynthesis` remains absent.

### Existing accepted infrastructure
- same-game reset runtime is already separately GREEN; native-confirm browser automation remains a deferred environment limitation and is not a required destructive step in this holistic run;
- all accepted agency/navigation/reset/media/timeline/CSA behavior is frozen and may not be redesigned here.

## 4. Preflight — exact deployed lineage only

Before gameplay:
1. verify main is a docs-only descendant of executable `ef526956...`;
2. verify TEST API exactly `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`;
3. verify TEST frontend exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
4. if versions match, perform zero deployment;
5. run full `npm.cmd test` on the exact accepted source lineage and record result without modifying source;
6. use only bare public `https://gamebuilder-company-r3.zeroslove.workers.dev` for gameplay.

If any preflight identity is uncertain, stop before play.

## 5. Campaign A — executive/senior owner-style long play

Create one fresh disposable game with an executive/senior profile. Use a natural company-life sequence rather than disconnected probes.

Run Opening plus at least **15 committed chronological turns** without retry/regeneration.

Across the campaign require:
- at least 6 free-form ordinary inputs;
- at least 4 visible choice-button clicks;
- at least one direct named-NPC conversation and a follow-up with the same NPC/topic;
- at least one work/context action;
- at least one non-work/social action;
- at least one explicit refusal/change-of-mind;
- at least one self-state action such as wanting quiet, pausing, fatigue, or ending an interaction;
- at least one canonical movement/scene change;
- at least one action explicitly addressed to a named NPC.

For sampled actions compare:
`literal input -> Story enactment -> committed/readback scene/state`.

Fail immediately on actor/target/action/topic/refusal/self-state substitution or wrong canonical destination.

### Choice quality

Whenever current Story visibly has a supported terminal 1–4 block:
- exactly four buttons must be available;
- click dispatch must equal the full exact choice literal once;
- buttons may show shortened labels but title/aria/full transport authority must remain intact;
- sampled choices should be meaningfully distinct when the scene supports diversity rather than four near-paraphrases of the same escalation.

If Story genuinely has no supported terminal choice tail, free input must remain usable and no old/fabricated choices may appear.

### Time / scene sampling

Read visible/server projection at multiple points after conversation, work, movement and social beats:
- time should usually advance positively;
- location/presence must match current narrative;
- off-scene mentions do not create presence;
- scene note should update coherently.

Do not require a fixed minutes-per-turn constant.

## 6. CSA sequence inside Campaign A — repaired CHANGE must be exercised

After several ordinary turns, use the visible high-parity CSA app.

### A. Five-tab/draft behavior
Open and inspect Home / Player / NPC / CSA / Manual.
Then:
- stage a local CSA draft;
- prove no gameplay request/turn/revision change caused by staging itself;
- Revert once and prove zero gameplay request and committed state unchanged;
- one pending operation only.

Native dirty-close confirmation is not a required live gate if the browser automation cannot accept the native dialog. Record that limitation separately; do not treat it as a runtime failure and do not bypass it by changing product source.

### B. Chronological visible sequence
Perform in this exact broad order, using normal visible product controls:
1. APPLY one representative preset;
2. one unrelated ordinary company/social action;
3. CHANGE the same active rule to a **different preset** using the repaired active-rule replacement UI;
4. one unrelated ordinary action;
5. REMOVE the changed rule;
6. one final unrelated ordinary action.

Require:
- APPLY = exactly one `/turn` and one `activate` operation;
- CHANGE staging before Apply = zero gameplay request;
- CHANGE = exactly one `/turn`, one `operation:'update'`, same rule id, different template id;
- reopen/readback after CHANGE shows the replacement committed under that same rule id;
- REMOVE = exactly one `/turn`, one `deactivate`;
- reopen/readback after REMOVE shows no active instance of that rule;
- ordinary turns surrounding CSA have no stale `csa_operation` and remain literal-action-first;
- no deactivate+activate CHANGE workaround;
- no duplicate/current/no-op/custom preset path;
- Mind Monitor does not turn rule compliance into automatic affection/comfort/consent/desire/romance/trust.

## 7. Media / TTS / History in the same Campaign A

Reach at least one committed scene with a grounded present registered heroine and eligible dialogue.

### Image
Require:
- chosen image character matches committed grounded focal/relevant present heroine;
- returned image is approved for that exact character;
- ambiguous/no-grounded scene fails open rather than choosing arbitrarily;
- stale image response cannot overwrite later committed projection.

### TTS
Before enabling:
- capture zero `/media/tts` synthesis calls while TTS is OFF.

Then enable visible TTS on an eligible committed NPC-dialogue turn:
- only validated canonical present-NPC dialogue is sent;
- request goes through R3 `/media/tts`, not direct browser-to-worker and not browser speech synthesis;
- audio element receives returned URL;
- narrator/player/private thought/Mind Monitor text is absent from synthesis payloads;
- Replay of current cached audio creates zero additional synthesis calls where the accepted cache contract applies;
- next committed turn fences stale prior audio.

### Current scene / History
At multiple points, including after CSA and after refresh:
- normal `#story-history` is empty/non-authoritative;
- `#current-story` shows only current/latest Story;
- History overlay contains Opening + every committed turn exactly once in canonical order;
- closing History returns to unchanged current scene;
- History opening/closing performs no gameplay mutation.

## 8. Mid-campaign refresh / feedback

At approximately Turn 8–11, refresh/re-enter the same Campaign A game.
Require coherent reconstruction of:
- committed turn;
- current Story;
- location/presence/time;
- current choices;
- player inner thought;
- Mind Monitor;
- CSA state;
- current media eligibility/state;
- complete History.

No Opening/early turn cards may reappear in normal current scene.
Continue for at least 3 further committed turns after refresh.

If visible feedback/revision control is enabled and usable in the accepted product state, perform one bounded feedback revision of the latest ordinary turn and require:
- revision replaces the latest current Story without advancing turn number;
- old/new revisions are not duplicated on normal current surface;
- subsequent ordinary turn continues from revised committed truth.

If feedback is intentionally unavailable/disabled, record that exact product state and continue. Do not bypass via direct API.

## 9. Campaign B — independent low/junior smoke

Create a second fresh disposable game with a low/junior profile.

Run Opening + at least **4 ordinary committed turns** without retry/regeneration, including:
- one visible choice click;
- one free-form NPC conversation;
- one movement or scene/context change;
- one refusal/change-of-mind/self-directed action.

Require:
- first-arrival framing;
- selected low/junior rank and department preserved;
- exact literal agency/navigation;
- four choices where supported;
- natural player thought and character-specific Mind Monitor where available;
- time progression;
- latest-only normal Story;
- complete History overlay;
- no executive-profile-specific assumptions leaking into the junior game.

## 10. Mobile and interaction quality

On substantive Campaign A progress, inspect approximately 390x844 and a normal/wider desktop viewport.

Require:
- no horizontal overflow or blocking overlay;
- Story remains readable while streaming and after commit;
- no full-screen loading layer obscures Story streaming;
- current image/player thought/Mind Monitor/choices/direct input/CSA/TTS/History controls remain reachable when eligible;
- repaired CSA replacement selector + pending preview + Revert + Apply + Remove remain usable at 390x844;
- choice buttons preserve full literal authority;
- no automatic scroll behavior makes the currently-read Story unusable.

Restore viewport after evidence capture.

## 11. Objective exit matrix

GREEN requires ALL of the following in this exact source-frozen deployment:
- Campaign A Opening + >=15 committed chronological turns, no retry/regeneration;
- Campaign B Opening + >=4 ordinary committed turns, no retry/regeneration;
- >=6 Campaign A free inputs and >=4 visible choice clicks;
- no P0 player agency/action/target/topic/refusal/self-state substitution;
- no wrong canonical navigation/location/presence;
- no supported Story choice tail losing buttons and no fabricated/stale choices;
- sampled choice diversity acceptable;
- first-arrival and selected rank/department identity correct for both profiles;
- player inner thought visible/natural where projected;
- Mind Monitor first-person/character-specific and CSA-emotion boundary respected;
- time not effectively frozen;
- repaired CSA draft/APPLY/CHANGE/REMOVE sequence works chronologically with same rule id across CHANGE and clean unrelated turns;
- approved image projection works and ambiguity fails open;
- TTS OFF=0 and character-aware server TTS ON/replay works;
- latest-only current scene + complete History survives refresh;
- desktop + 390x844 usable;
- no blocking console/network/runtime error;
- no source/Production/migration/provider/model/config change during acceptance.

Only if every item is GREEN may the terminal report:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

That phrase means the automated holistic gate passed and the product can be handed back for the owner's final manual playtest. It does NOT authorize Production deployment or mutation of the preserved owner game.

Any decisive failure => `FAILED_PRODUCT`, preserve fixture, report first boundary, stop.

## 12. Terminal / stop protocol

At completion record:
- exact executable source/main SHA and deployed Worker versions;
- fresh Campaign A/B fixture IDs only;
- turn-by-turn action category/literal summary sufficient for audit;
- choice-click/free-input counts;
- refresh point and post-refresh continuation;
- CSA operation turn numbers, request counts, operation types, same rule id/template transition, Revert/no-network evidence, and surrounding ordinary no-stale evidence;
- media/TTS network evidence;
- History/latest-only evidence;
- mobile/desktop evidence;
- feedback state/evidence if applicable;
- any environment-only automation limitation separately from product failures.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `Status: WAITING_REVIEW` in place, post the terminal report to Issue #68, and stop.

Do not create or start a next task.
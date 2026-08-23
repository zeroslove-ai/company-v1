# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-final-holistic-owner-style-long-play-v1
Mode: SOURCE-FROZEN FINAL PRODUCT ACCEPTANCE -> OWNER-STYLE LONG PLAY -> CROSS-FEATURE EXIT MATRIX
Updated: 2026-08-24 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387013183`
Terminal correction: Issue #68 comment `5387015260`
Operator review: Issue #68 comment `5387196217`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery branch. Work on `main` only.

## 0. Source-frozen baseline

Accepted executable/source:
- `79a9921b0248912bd8453a26c83443f8da481cb4`

Current main before this registration:
- `53999d3ef8534385bedca29baf2df8e454e513e5`
- docs-only descendant of the accepted executable.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`
- Frontend `gamebuilder-company-r3` version `cac2033d-aa56-4a99-aa02-92c8087222d3`
- Bare public frontend: `https://gamebuilder-company-r3.zeroslove.workers.dev`

Owner game — READ ONLY, never reset/revise/retry/mutate:
- `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`

Previously accepted disposable evidence fixtures are also read-only unless explicitly needed for readback comparison. Use fresh disposable TEST games for mutable acceptance.

This task is ACCEPTANCE ONLY.

## Terminal result — 2026-08-24 KST

`FAILED_PRODUCT` — first decisive boundary: after UI APPLY at committed Turn 9 and an unrelated ordinary Turn 10, the visible active CSA rule card exposed only `해제`; its target-scope select exposed only the already-selected `여성 직원` option. No visible CHANGE/EDIT/preset-replacement path existed for the active rule. A no-op selection was not treated as CHANGE, and no hidden writer/direct API/DOM mutation/retry was attempted.

Preserved fresh fixture: `f84aa0f0-6658-41a2-8fed-c307d4d2e219` (committed Turn 10; no reset or further mutation).

Evidence: `.tmp/evidence-company-r3-final-holistic-owner-style-long-play-v1.md`

Verified preflight: accepted source `79a9921b0248912bd8453a26c83443f8da481cb4`, workflow HEAD `fb5debf39271086535ce1b79971489f8e7b6777f`, API `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`, frontend `cac2033d-aa56-4a99-aa02-92c8087222d3`, `npm.cmd test` 529 pass / 0 fail, no deployment performed.

Campaign A stopped after Opening + committed Turns 1–10 without retry/regeneration: executive first-arrival/rank/department, 2 choice clicks, 8 free inputs, exact 박정우 follow-up, named 윤민아 topic, work/context, self-pause, refusal/change-of-mind, refresh at Turn 8, CSA draft/revert, APPLY Turn 9, and unrelated Turn 10 were captured. Campaign B, CSA CHANGE/REMOVE tail, media/TTS, full History, mobile, and 15-turn minimum were not accumulated after the first decisive failure. No source/config/provider/model/database/migration/deployment/Production change.

### Hard rule: no source repair inside this task

Do not edit runtime/frontend/test/config/provider code during the holistic run.
Do not redeploy merely to retry a failed product observation.
Do not regenerate/retry a failed Story to manufacture a pass.
Do not change provider/model/temperature/token/timeout/config/secrets.
Do not change DB schema/RPC/migration/RLS/grants.
Do not access Production.

If any decisive product failure occurs:
1. preserve the fresh fixture;
2. capture exact literal action, raw/current Story, committed/readback state, DOM/network evidence needed to classify it;
3. STOP `FAILED_PRODUCT` / `WAITING_REVIEW`;
4. do not patch it in this task.

A later operator task will isolate the first proven failure.

## 1. Frozen product contracts under final review

The final run must evaluate the product as one game, not as isolated subsystem tests.

Freeze and verify together:
- every new game is first day / first arrival / first appointment regardless selected rank;
- selected department/rank remains authoritative, including executive/senior profiles;
- private CSA app discovery is optional/curious, never a forced quest;
- exact player actor/target/action/movement/request/refusal/self-state/topic/intent is preserved;
- player intent/attempt is not automatically external success or NPC consent;
- canonical navigation/location/presence is coherent with Story and committed state;
- Story is the sole author of exactly four current choices when it emits a supported terminal 1–4 block;
- no authored/fabricated fallback choices and no Observer veto of a structurally valid Story tail;
- player inner thought is visible, natural first-person Korean, substantive, and does not invent decisions/outcomes;
- Mind Monitor is character-specific natural first-person Korean and does not convert CSA compliance into affection/comfort/desire/romance/trust;
- ordinary conversation/movement/work/social scenes advance time plausibly; time is not frozen at 09:00;
- CSA APPLY/CHANGE/REMOVE are chronological normal Story turns; one operation = one turn;
- later unrelated ordinary actions are literal-action-first and are not hijacked by CSA;
- high-parity five-tab CSA app retains local draft/revert/apply behavior and one pending operation at a time;
- approved image selection is deterministic, present-character grounded, fail-open, and never gameplay authority;
- TTS is character-aware server TTS through R3 API -> `TTS_WORKER`, with TTS OFF => zero synthesis calls;
- narrator/player/player-inner-thought/Mind Monitor are never synthesized as character dialogue;
- current normal Story surface is latest/current scene only; full chronology lives in History overlay/export;
- refresh/re-entry reconstructs committed truth, not stale client cache;
- same-game reset runtime is already separately GREEN. Native-confirm automation remains an environment-only deferred limitation and must not be reopened unless the browser can naturally handle it without changing product/source.

## 2. Preflight — exact deployed lineage only

Before gameplay:
1. verify `main` is the docs-only descendant of source `79a9921b...`;
2. verify the active TEST API/frontend versions match the accepted versions above;
3. run no deployment if versions already match;
4. verify full `npm.cmd test` on the exact accepted source lineage; record result but do not alter source;
5. use bare public URL only — no `?api=` override, no localStorage/storage preseed, no direct gameplay API substitute.

If deployed artifacts do not match the accepted lineage, STOP `BLOCKED_DEPLOYMENT_DRIFT` before product play. Do not silently redeploy from an uncertain head.

## 3. Campaign A — owner-style executive long play

Create one fresh disposable game with an executive/senior profile. Prefer the same general product perspective as the preserved owner game without copying or mutating the owner save.

Run Opening plus at least 15 committed chronological turns. Do not retry/regenerate a failed turn.

The campaign must naturally include all of the following, in a coherent sequence rather than isolated probes:

### A. Opening / identity
- first day / first arrival framing is explicit;
- selected department/rank preserved;
- unfamiliar private CSA app is present/optional but the Story does not author a voluntary player action;
- four current choices available if Story emits a supported terminal block;
- player inner thought visible;
- relevant NPC Mind Monitor natural and character-specific.

### B. Exact player agency
Use free input for multiple materially different intents:
- direct NPC conversation and a follow-up to the same NPC/topic;
- work/context action;
- non-work/social action;
- explicit refusal/change-of-mind;
- explicit self-state such as wanting quiet, fatigue, or pausing interaction;
- movement to a canonical destination;
- at least one action addressed to a named NPC.

For every sampled action compare literal input -> Story enactment -> committed/readback state. Fail immediately on actor/target/action/topic/refusal/self-state substitution or movement to the wrong canonical destination.

### C. Choices
Across the campaign:
- use at least 4 visible choice-button clicks;
- use at least 6 free-form inputs;
- every click must submit the exact full hidden/title literal once;
- whenever Story visibly has a supported terminal 1–4 choice block, current UI must expose exactly four actionable choices;
- choice intents should remain meaningfully diverse when the scene supports it; do not accept four near-paraphrases of the same CSA/sexual escalation.

A supported four-choice Story tail that yields zero current buttons is a product failure.

### D. Time / scene continuity
Sample after meaningful conversation, movement, work, meal/social or meeting beats:
- elapsed time should usually advance positively;
- location/presence should match the narrated current scene;
- remote/off-scene NPC mentions must not make them present;
- current scene note should describe the current scene rather than stale old-location activity.

Do not require a fixed minutes-per-action constant; evaluate obvious frozen-time or chronology contradictions.

## 4. CSA cross-feature sequence inside Campaign A

After several ordinary company-life turns, use the visible high-parity CSA app.

### Draft behavior
- open Home / Player / NPC / CSA / Manual tabs;
- make a local draft change;
- before explicit apply, committed turn/revision/gameplay state must not change because of the draft itself;
- Revert restores draft state;
- one pending operation only.

Do not force native dirty-close dialog automation if the environment cannot operate it. Existing deterministic protection evidence remains valid; record environment limitation separately rather than misclassifying product runtime.

### Chronological operations
Perform one representative sequence:
1. APPLY one existing rule through visible UI;
2. make one unrelated ordinary company/social action afterward;
3. CHANGE the active rule through visible UI where supported;
4. make another unrelated ordinary action;
5. REMOVE the rule through visible UI.

Require:
- each APPLY/CHANGE/REMOVE consumes exactly one chronological Story turn;
- no zero-turn hidden writer;
- immediate institutional/world consequence may be narrated naturally;
- later unrelated action remains literal-action-first;
- active rule state matches operation after commit/refresh;
- rule compliance does not automatically create affection, comfort, sexual desire, romance, trust, or personality obedience in Mind Monitor;
- after REMOVE, later ordinary turns do not carry stale `csa_operation` or enact removed rule behavior without independent Story cause.

Do not activate all catalog rules just to increase coverage; this is a holistic product flow, not a catalog exhaustiveness task.

## 5. Media / TTS / presentation within the same campaign

Reach a committed scene with a grounded present registered heroine and dialogue.

### Image
- current image character equals grounded committed focal/relevant heroine;
- returned image is approved media for that character;
- ambiguous/no-grounding scene must fail open rather than show an arbitrary heroine;
- later turn/refresh cannot be overwritten by stale prior image.

### TTS
Before enabling:
- prove zero `/media/tts` synthesis calls while TTS is OFF.

Then enable visible TTS on a committed eligible NPC-dialogue turn:
- only canonical present NPC dialogue is sent;
- request goes browser -> R3 API -> server Service Binding, never direct browser-to-TTS worker;
- returned URL reaches audio element;
- narrator/player/player-inner-thought/Mind Monitor text is not synthesized;
- replay of cached latest audio causes zero additional synthesis call where current cache contract applies;
- next turn fences stale prior audio.

### Current scene / History
At several points, especially after CSA and media turns:
- normal gameplay has only latest/current Story;
- `#story-history` remains empty/non-authoritative;
- History overlay contains Opening + all committed turns exactly once in canonical order;
- closing History returns to unchanged current scene.

## 6. Mid-campaign refresh / feedback

At or after approximately Turn 8–10:
- refresh/re-enter same game;
- committed turn, location, presence, current Story, choices, player thought, Mind Monitor, CSA state, image eligibility, and History reconstruct coherently;
- no old Opening/turn cards return to normal current scene;
- continue with at least 3 further ordinary/CSA turns after refresh.

If visible feedback/revision control is enabled in the accepted product state, perform one bounded feedback revision on the latest ordinary turn:
- revision must replace that latest turn presentation without duplicating old/new versions on normal current surface;
- turn number does not advance merely because of revision;
- subsequent ordinary turn continues from revised committed truth.

If feedback is intentionally unavailable/disabled by the current accepted contract, record that exact product state; do not invent a bypass or direct API substitute.

## 7. Campaign B — independent low/junior smoke

Create a second fresh disposable game with a low/junior profile.

Run Opening + at least 4 ordinary turns containing:
- one choice click;
- one free-form NPC conversation;
- one movement or scene/context change;
- one refusal/self-directed action.

Require first-arrival framing, selected low rank preservation, four choices where supported, thought/MM quality, time movement, latest-only normal Story, full History overlay, and no regression from executive assumptions.

This campaign exists to ensure the final result is not accidentally executive-profile-specific.

## 8. Mobile / interaction quality

On Campaign A after substantive progress, inspect approximately 390x844 and one wider desktop viewport.

Require:
- no horizontal overflow/blocking overlay;
- current Story readable while streaming/committed;
- image, player thought, Mind Monitor, choices, direct input, CSA app, TTS and History controls reachable when eligible;
- choice buttons do not hide full literal authority (title/aria/full dispatch preserved);
- no full-screen loading layer obscures Story streaming;
- no automatic scroll behavior that makes the currently-read Story unusable.

Return viewport to normal after evidence capture.

## 9. Objective exit matrix

GREEN requires all of the following in the same source-frozen deployment:
- Campaign A >=15 committed chronological turns without retry/regeneration;
- Campaign B Opening + >=4 ordinary turns;
- no P0 agency/action substitution;
- no wrong canonical navigation;
- no supported Story four-choice tail losing buttons;
- meaningful choice diversity sampled;
- first-arrival/rank identity correct in both profiles;
- player inner thought visible/natural;
- Mind Monitor first-person/character-specific and CSA-emotion boundary respected;
- time not effectively frozen;
- CSA APPLY/CHANGE/REMOVE chronological and later ordinary turns not hijacked;
- high-parity draft/app UX materially usable;
- approved image projection works and ambiguity fails open;
- TTS OFF=0 calls and character-aware server TTS ON works;
- latest-only current scene + complete History overlay survives refresh;
- desktop + 390x844 usable;
- no blocking console/network/runtime error;
- no Production/migration/provider/model/source changes during acceptance.

If all are GREEN, terminal may report:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

This means the automated holistic gate passed and the product can be handed back for the owner's final manual playtest. It does NOT authorize Production deployment or mutation of the preserved owner game.

If any gate fails, terminal must report `FAILED_PRODUCT` with the first decisive defect and stop. Do not repair or continue to accumulate unrelated failures after a P0/P1 decisive blocker.

## 10. Terminal / stop protocol

At completion:
- record exact source/main SHA and deployed Worker versions;
- record fresh fixture IDs only;
- record turn-by-turn literal/action category summary sufficient for operator audit;
- record CSA operation turn numbers and state transitions;
- record choice click/free-input counts;
- record refresh/media/TTS/history/mobile evidence;
- record any environment-only automation limitation separately from product defects;
- overwrite this SAME `docs/ops/CURRENT_TASK.md` to `Status: WAITING_REVIEW` in place;
- post terminal report to Issue #68;
- stop.

Do not create or start a next task.

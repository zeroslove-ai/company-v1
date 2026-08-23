# Company — CURRENT TASK

Status: READY
Task ID: company-r3-final-holistic-owner-style-long-play-v3
Mode: SOURCE-FROZEN FINAL PRODUCT ACCEPTANCE -> NEW CLEAN OWNER-STYLE LONG PLAY -> CROSS-FEATURE EXIT MATRIX
Updated: 2026-08-24 03:32 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387750570`
Operator review: Issue #68 comment `5387761862`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Source-frozen baseline

Accepted executable/source for this holistic retest:
- `5d033404a411683ca7afbd2f97a5e274c034498c`

Current main before this registration:
- `b954f0c542513b40e1e119ba6401d9efd4ddc3dc`
- direct docs-only child of accepted executable `5d033404...`.

Identity source lineage:
- original accepted source `8199c8b7b4b86ac936b9785b19f2340a40336ef1`;
- exact cherry-pick landing on main `5d033404...`;
- `runtime-r3/domain/memory.js`, `runtime-r3/server/provider.js`, `test/r3-player-identity-contract.test.mjs` are byte-equivalent between the two;
- current main contains no later executable drift.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `53a91cb4-9317-4198-8d7c-52a9e8e34571`;
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`;
- bare public frontend: `https://gamebuilder-company-r3.zeroslove.workers.dev`.

The TEST API was deployed from source byte-equivalent to `5d033404...`; therefore expected deployment count for this acceptance is ZERO.

Accepted validation:
- focused identity/opening/turn: 44/44 PASS;
- full `npm.cmd test`: 536/536 PASS;
- changed JS/MJS syntax: PASS;
- `git diff --check`: PASS.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`;
- holistic V1 failure `f84aa0f0-6658-41a2-8fed-c307d4d2e219`;
- CSA repair fixture `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`;
- holistic V2 identity failure `4b050667-cca3-43a0-b483-d16c86a2873e`;
- identity executive acceptance `a78b91bd-4216-4e31-91ab-fd2705f0a99c`;
- identity junior acceptance `6b8ba038-50f0-408b-8210-20fed28bd0bc`.

Create entirely NEW disposable TEST games for this task. Do not resume any prior holistic or identity campaign.

## 1. Why V3 exists

Holistic V2 stopped correctly at the first decisive product failure: a canonical `신사업TF / 임원` profile was rendered by Story as `신사업TF 팀장` on a business card.

The isolated repair `company-r3-story-canonical-player-identity-v1` is now GREEN and landed on main:
- every Story turn receives canonical player name, department label, and formal position/rank label;
- the Story contract treats those labels as authoritative formal identity;
- executive and junior live acceptance passed without rank drift;
- no DB/profile writer, retry/regeneration, output rewrite, second LLM, provider/model/config, frontend, CSA, media, or Observer authority was added;
- exact source is now on main as `5d033404...`.

V3 must therefore restart the complete holistic product matrix from new clean campaigns and determine whether the product can be handed to the owner for final manual playtest.

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
2. capture exact literal action or exact clicked choice, visible Story, committed/readback state, relevant DOM/network evidence;
3. STOP `FAILED_PRODUCT` / `WAITING_REVIEW` immediately;
4. do not patch it and do not continue collecting unrelated failures.

If deployed artifact lineage does not match the accepted versions, STOP `BLOCKED_DEPLOYMENT_DRIFT` before product play. Do not silently redeploy from an uncertain head.

## 3. Frozen product contracts under final review

### Opening / canonical player identity
- every new game begins on the player's first day / first arrival / first appointment regardless selected rank;
- selected player name, department, and formal position/rank remain authoritative on every Story turn;
- executive/senior profiles must not be downgraded, normalized, or re-titled by Story;
- low/junior profiles must not be promoted or given executive assumptions;
- if Story renders business card, employee badge, introduction, signature, organizational listing, formal title/address, or equivalent identity artifact, exact canonical labels must be used;
- private CSA app discovery is optional/curious/tempting, never a forced quest or unrequested player action;
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
- current choices are Story-owned; supported terminal 1–4 choice block => exactly four actionable choices;
- no fabricated fallback/resurrected previous choices;
- each visible choice button dispatches its exact full literal once;
- shortened button label is presentation only; title/aria/transport authority must preserve full literal;
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
- later unrelated ordinary turns contain no stale `csa_operation` and remain literal-action-first;
- CSA institutional compliance must not mechanically create affection/comfort/consent/desire/romance/trust/personality obedience in Mind Monitor.

### Media / TTS
- approved image selection is deterministic, present-character/focal-evidence grounded, and fail-open when ambiguous;
- TTS OFF means zero synthesis calls;
- TTS ON sends only eligible committed canonical present-NPC dialogue through browser -> R3 API -> server `TTS_WORKER` binding;
- narrator/player/player-inner-thought/Mind Monitor text is never synthesized as character dialogue;
- replay/cache/stale fencing works and browser `speechSynthesis` remains absent.

### Existing accepted infrastructure
- same-game reset runtime is separately GREEN; native-confirm browser automation remains an environment-deferred limitation and is not a destructive gate in this holistic run;
- accepted agency/navigation/reset/media/timeline/CSA/identity behavior is frozen and may not be redesigned here.

## 4. Preflight — exact deployed lineage only

Before gameplay:
1. verify current main is a docs-only descendant of executable `5d033404a411683ca7afbd2f97a5e274c034498c`;
2. verify the three identity source/test files on main remain source-equivalent to `8199c8b...`;
3. verify TEST API exactly `53a91cb4-9317-4198-8d7c-52a9e8e34571`;
4. verify TEST frontend exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
5. if versions match, perform zero deployment;
6. run full `npm.cmd test` on the exact accepted source lineage and record result without modifying source;
7. use only bare public `https://gamebuilder-company-r3.zeroslove.workers.dev` for gameplay.

If any preflight identity is uncertain, stop before play.

## 5. Campaign A — executive/senior owner-style long play

Create one fresh disposable game with an executive/senior profile. Use a natural company-life sequence rather than disconnected probes.

Run Opening plus at least **15 committed chronological turns** without retry/regeneration.

Across the campaign require:
- at least 6 free-form ordinary inputs;
- at least 4 visible choice-button clicks;
- at least one direct named-NPC conversation and follow-up with the same NPC/topic;
- at least one work/context action;
- at least one non-work/social action;
- at least one explicit refusal/change-of-mind;
- at least one self-state action such as wanting quiet, pausing, fatigue, or ending an interaction;
- at least one canonical movement/scene change;
- at least one action explicitly addressed to a named NPC.

For sampled actions compare:
`literal input -> Story enactment -> committed/readback scene/state`.

Fail immediately on actor/target/action/topic/refusal/self-state substitution or wrong canonical destination.

### Identity probe inside Campaign A
Without typing the expected rank label into the literal, naturally perform at least one identity-artifact or introduction action such as inspecting a newly issued business card/badge or exchanging cards with an NPC.
Require:
- committed profile remains the selected executive profile;
- exact canonical player name remains true;
- formal department label remains exact;
- formal position/rank remains exact;
- no `팀장`, `TF팀장`, `대리`, `인턴`, or other alternate formal title is asserted for an `임원` player;
- refresh/re-entry does not weaken this identity contract.

### Choice quality
Whenever current Story visibly has a supported terminal 1–4 block:
- exactly four buttons must be available;
- click dispatch must equal the full exact choice literal once;
- sampled choices should be meaningfully distinct when the scene supports diversity rather than four near-paraphrases of one escalation.

If Story genuinely has no supported terminal choice tail, free input must remain usable and no old/fabricated choices may appear.

### Time / scene sampling
Read visible/server projection after conversation, work, movement and social beats:
- time should usually advance positively;
- location/presence must match current narrative;
- off-scene mentions do not create presence;
- scene note should update coherently.

Do not require a fixed minutes-per-turn constant.

## 6. CSA sequence inside Campaign A

After several ordinary turns, use the visible high-parity CSA app.

### A. Five-tab/draft behavior
Open and inspect Home / Player / NPC / CSA / Manual.
Then:
- stage a local CSA draft;
- prove no gameplay request/turn/revision change caused by staging itself;
- Revert once and prove zero gameplay request and committed state unchanged;
- one pending operation only.

Native dirty-close confirmation is not a required live gate if browser automation cannot accept the native dialog. Record that limitation separately; do not modify product source or treat the browser bridge limitation as a runtime defect.

### B. Chronological visible sequence
Perform through normal visible controls:
1. APPLY one representative preset;
2. one unrelated ordinary company/social action;
3. CHANGE the same active rule to a **different preset** through the active-rule replacement UI;
4. one unrelated ordinary action;
5. REMOVE the changed rule;
6. one final unrelated ordinary action.

Require:
- APPLY = exactly one `/turn` and one `activate` operation;
- CHANGE staging before Apply = zero gameplay request;
- CHANGE = exactly one `/turn`, one `operation:'update'`, same rule id, different template id;
- reopen/readback after CHANGE shows replacement committed under same rule id;
- REMOVE = exactly one `/turn`, one `deactivate`;
- reopen/readback after REMOVE shows no active instance;
- surrounding ordinary turns have no stale `csa_operation` and remain literal-action-first;
- no deactivate+activate CHANGE workaround;
- no duplicate/current/no-op/custom preset path;
- Mind Monitor does not turn rule compliance into automatic affection/comfort/consent/desire/romance/trust.

## 7. Media / TTS / History in Campaign A

Reach at least one committed scene with a grounded present registered heroine and eligible dialogue.

### Image
Require:
- chosen image character matches committed grounded focal/relevant present heroine;
- returned image is approved for that exact character;
- ambiguous/no-grounded scene fails open rather than choosing arbitrarily;
- stale previous image cannot overwrite a later committed projection.

### TTS
Before enabling:
- capture zero `/media/tts` synthesis calls while TTS is OFF.

Then enable visible TTS on eligible committed NPC dialogue:
- only validated canonical present-NPC dialogue is sent;
- request goes through R3 `/media/tts`, not direct browser-to-worker and not browser speech synthesis;
- audio element receives returned URL;
- narrator/player/private thought/Mind Monitor text is absent from synthesis payloads;
- Replay of current cached audio creates zero additional synthesis calls where cache contract applies;
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
- canonical player identity;
- location/presence/time;
- current choices;
- player inner thought;
- Mind Monitor;
- CSA state;
- current media eligibility/state;
- complete History.

No Opening/early turn cards may reappear in normal current scene.
Continue for at least 3 further committed turns after refresh.

If visible feedback/revision control is enabled and usable, perform one bounded feedback revision of the latest ordinary turn and require:
- revision replaces latest current Story without advancing turn number;
- old/new revisions are not duplicated on normal current surface;
- subsequent ordinary turn continues from revised committed truth.

If feedback is intentionally unavailable/disabled, record that exact state and continue. Do not bypass via direct API.

## 9. Campaign B — independent low/junior smoke

Create a second fresh disposable game with a low/junior profile.

Run Opening + at least **4 ordinary committed turns** without retry/regeneration, including:
- one visible choice click;
- one free-form NPC conversation;
- one movement or scene/context change;
- one refusal/change-of-mind/self-directed action;
- one identity artifact/introduction opportunity without typing the expected rank label.

Require:
- first-arrival framing;
- selected low/junior name, department and rank preserved;
- no promotion to team lead/executive or executive-specific assumptions;
- exact literal agency/navigation;
- four choices where supported;
- natural player thought and character-specific Mind Monitor where available;
- time progression;
- latest-only normal Story;
- complete History overlay.

## 10. Mobile and interaction quality

On substantive Campaign A progress, inspect approximately 390x844 and normal/wider desktop viewport.

Require:
- no horizontal overflow or blocking overlay;
- Story remains readable while streaming and after commit;
- no full-screen loading layer obscures Story streaming;
- current image/player thought/Mind Monitor/choices/direct input/CSA/TTS/History controls remain reachable when eligible;
- CSA replacement selector + pending preview + Revert + Apply + Remove remain usable;
- choice buttons preserve full literal authority;
- no automatic scroll behavior makes currently-read Story unusable.

Restore viewport after evidence capture.

## 11. Objective exit matrix

GREEN requires ALL:
- Campaign A Opening + >=15 committed chronological turns, no retry/regeneration;
- Campaign B Opening + >=4 ordinary committed turns, no retry/regeneration;
- >=6 Campaign A free inputs and >=4 visible choice clicks;
- canonical player identity correct across ordinary turns, identity artifacts and refresh for both executive and junior profiles;
- no P0 player agency/action/target/topic/refusal/self-state substitution;
- no wrong canonical navigation/location/presence;
- no supported Story choice tail losing buttons and no fabricated/stale choices;
- sampled choice diversity acceptable;
- first-arrival framing correct for both profiles;
- player inner thought visible/natural where projected;
- Mind Monitor first-person/character-specific and CSA-emotion boundary respected;
- time not effectively frozen;
- CSA draft/APPLY/CHANGE/REMOVE sequence works chronologically with same rule id across CHANGE and clean unrelated turns;
- approved image projection works and ambiguity fails open;
- TTS OFF=0 and character-aware server TTS ON/replay works;
- latest-only current scene + complete History survives refresh;
- desktop + 390x844 usable;
- no blocking console/network/runtime error;
- no source/Production/migration/provider/model/config change during acceptance.

Only if every item is GREEN may terminal report:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

This means automated holistic gate passed and product may be handed to the owner for final manual playtest. It does NOT authorize Production deployment or mutation of preserved owner game.

Any decisive product failure => `FAILED_PRODUCT`, preserve fixture, report first boundary, stop.

## 12. Terminal / stop protocol

At completion record:
- exact executable source/main ancestry and deployed Worker versions;
- fresh Campaign A/B fixture IDs only;
- Campaign A/B committed-turn counts and free-input/choice-click counts;
- canonical identity evidence for executive and junior profiles;
- sampled literal/choice -> Story -> readback agency evidence;
- location/presence/time/scene evidence;
- CSA APPLY/CHANGE/REMOVE operation/turn/network evidence;
- image/TTS OFF/ON/replay evidence;
- History/current-scene/refresh evidence;
- desktop/mobile evidence;
- any environment-only limitation separately from product defects;
- full `npm.cmd test` result;
- source/deploy/migration/provider/model/Production change count = 0.

If GREEN, terminal status may be `COMPLETE` / `WAITING_REVIEW` with explicit `OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`.
If first decisive defect occurs, terminal status must be `FAILED_PRODUCT` / `WAITING_REVIEW`, preserving the fresh fixture and stopping immediately.
If deployment lineage drift blocks the run, use `BLOCKED_DEPLOYMENT_DRIFT`.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, post terminal report to Issue #68, and stop.
Do not create/start a next task.

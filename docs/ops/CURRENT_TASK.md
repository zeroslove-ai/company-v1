# Company — CURRENT TASK

Status: READY
Task ID: company-r3-final-holistic-owner-style-long-play-v4
Mode: SOURCE-FROZEN FINAL PRODUCT ACCEPTANCE -> NEW CLEAN OWNER-STYLE LONG PLAY -> CROSS-FEATURE EXIT MATRIX -> OWNER-READY CANDIDATE ONLY IF ALL GREEN
Updated: 2026-08-24 04:22 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387987026`
Operator review: Issue #68 comment `5388000283`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Source-frozen baseline

Accepted executable/source for this holistic retest:
- `7961a3ceab638f43e7959123025b6cedd96f5898`

Current reviewed main before this registration:
- `1f8fc0a359a41ad45128963fbe31158f96f05cbd`
- direct docs-only terminal child of accepted executable `7961a3c...`.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `09dac4f4-1131-41c4-94a8-dfd59e5d02d8`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation:
- timeout/lifecycle focused set: 21/21 PASS
- full `npm.cmd test`: 537/537 PASS
- changed JS/MJS syntax: PASS
- `git diff --check`: PASS

Newly frozen timeout/terminalization contract:
- `runtime-r3/worker-entry.js` passes the Cloudflare execution context into the R3 worker;
- `runtime-r3/server/worker.js` retains normal turn `processTurn()` with `executionCtx.waitUntil()`;
- downstream response cancellation suppresses further SSE controller enqueue/close but does not kill the retained turn executor;
- a partial Story that later exceeds the existing provider budget can durably finish as `failed/r3_story_timeout` without partial commit or automatic retry;
- Story provider total timeout remains 120s;
- durable Story lease remains 130s and stale expiry remains crash/orphan last resort;
- no timeout/model/prompt/max_tokens/provider configuration changed.

Accepted post-fix bare-public smoke — READ ONLY:
- `8dec6dcf-df4a-426b-b4c0-7a9d66e1d351`: Opening + Turns 1-5, 2 visible choice clicks, 2 free inputs, same-NPC follow-up, work/social action, refresh/re-entry, no pending or failed job at final Turn 5.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- holistic V1 failure `f84aa0f0-6658-41a2-8fed-c307d4d2e219`
- CSA repair fixture `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`
- holistic V2 identity failure `4b050667-cca3-43a0-b483-d16c86a2873e`
- identity executive acceptance `a78b91bd-4216-4e31-91ab-fd2705f0a99c`
- identity junior acceptance `6b8ba038-50f0-408b-8210-20fed28bd0bc`
- holistic V3 timeout failure `1ebc90a9-2957-4e00-bcbd-32287cd918bc`
- timeout-repair smoke `8dec6dcf-df4a-426b-b4c0-7a9d66e1d351`

Create entirely NEW disposable TEST games for this task. Do not resume any prior holistic/identity/repair fixture.

## 1. Why V4 exists

Holistic V3 passed through Opening + committed Turns 1-10 and had already shown canonical executive identity plus visible CSA draft/Revert/APPLY/CHANGE chronology. It stopped on Turn 11 when a clicked ordinary choice produced partial Story but did not reach a committed/failed terminal before the browser transport disappeared. Read-only DB later proved that job survived until stale expiry and became `company_r3_stale_turn_timeout` after about 133.6s.

The isolated repair `company-r3-turn-stream-timeout-terminalization-v1` proved the first lifecycle boundary and fixed only that boundary:
- before correction: downstream cancellation could leave no retained Cloudflare execution promise, then late SSE terminal emission hit a closed controller (`ERR_INVALID_STATE`), allowing the durable job to survive until stale expiry;
- after correction: `waitUntil()` retains the same turn attempt after response cancellation, the same provider attempt can durably end `failed/r3_story_timeout`, progress remains evidence-only, canonical committed state does not advance, no partial turn is committed, and no automatic second provider call/attempt occurs;
- normal fresh Opening + 5-turn smoke remained GREEN.

V4 must therefore rerun the full holistic owner-style matrix from clean games against the corrected executable and determine whether the product is ready to hand to the owner for final manual playtest.

This task is ACCEPTANCE ONLY. Do not patch source inside this task.

## 2. Hard freeze / fail-fast rules

Do not edit runtime/frontend/test/content/config/provider code.
Do not commit product/source changes.
Do not deploy unless preflight proves the accepted TEST artifact is missing/drifted; if drift is uncertain, STOP rather than silently replacing it.
Do not retry or regenerate a Story/turn to manufacture a pass.
Do not submit the same literal/choice a second time after a slow/disconnected response.
Do not change provider/model/temperature/thinking/token/timeout/max_tokens/config/secrets.
Do not change DB schema/RPC/migration/RLS/grants.
Do not access Production.
Do not mutate any preserved game listed above.
Do not use direct gameplay API calls as a substitute for visible product actions.
Do not use `?api=` override, storage preseed, DOM mutation, or hidden writer to bypass UI.

If a decisive product failure occurs:
1. preserve that fresh disposable fixture at the failure turn;
2. capture exact literal action or exact clicked choice, visible Story, committed/readback state, relevant DOM/network/job evidence;
3. STOP `FAILED_PRODUCT` / `WAITING_REVIEW` immediately;
4. do not patch it and do not continue collecting unrelated failures.

If an environment/browser-automation limitation blocks evidence but the product state itself is not disproven, classify the exact harness/environment boundary and stop without source changes.

## 3. Slow-turn / timeout acceptance rule — corrected after V3

Do not use an arbitrary shorter wall-clock threshold such as 60s or 80s as a product-failure boundary.

Current product timing contract is:
- provider Story total budget: 120s;
- durable Story lease: 130s;
- frontend pending recovery polling: 120s per recovery attempt;
- stale expiry: last-resort 130s Story-stage safety net.

If a normal visible turn is slow or the response transport drops:
- never click/submit again;
- keep the exact action single-shot;
- allow the normal UI/transport reconciliation to run;
- if the UI exposes `진행 중인 Story 복구`, using that visible recovery control is allowed because it performs read-only polling/reconciliation, not a gameplay retry;
- observe until the same attempt reaches either a committed ready state or an explicit failed/recoverable state under the bounded product contract;
- allow a small browser/poll scheduling grace beyond the 130s durable lease when merely observing the final state, but do not treat a still-processing job beyond the lease as acceptable;
- if it commits once, continue;
- if it explicitly fails (`r3_story_timeout`, transport failure, stale timeout, or another real terminal error), preserve the fixture and STOP `FAILED_PRODUCT` because final owner-ready acceptance requires uninterrupted clean play;
- if it remains processing beyond the durable lease plus reasonable polling grace, preserve and STOP `FAILED_PRODUCT`;
- never invoke explicit failed-action retry in this holistic task.

The purpose of the timeout repair is lifecycle correctness, not permission for automatic retry or partial success.

## 4. Frozen product contracts under final review

### Opening / canonical player identity
- every new game begins on the player's first day / first arrival / first appointment regardless selected rank;
- selected player name, department, and formal position/rank remain authoritative on every Story turn;
- executive/senior profiles must not be downgraded, normalized, or re-titled by Story;
- low/junior profiles must not be promoted or given executive assumptions;
- business card, badge, introduction, signature, organizational listing, formal title/address, or equivalent identity reference must use exact canonical labels when mentioned;
- private CSA app discovery is optional/curious/tempting, never a forced quest or unrequested voluntary player action;
- player inner thought is visible natural first-person Korean and does not invent player decisions/outcomes;
- relevant NPC Mind Monitor is character-specific natural first-person Korean.

### Player agency / scene
- exact player actor/target/action/request/refusal/change-of-mind/self-state/topic/intent remains central;
- Story may resolve external success/refusal naturally but may not replace the attempted player action with another action;
- player intent is not automatic NPC consent/affection/comfort/desire/romance/trust;
- canonical navigation/location/presence must match literal destination intent and narrated scene;
- remote/off-scene NPC mentions must not make them present;
- scene note must describe the current scene rather than stale old-location activity.

### Choices / presentation
- current choices are Story-owned; a supported terminal 1-4 choice block means exactly four actionable choices;
- no fabricated fallback/resurrected previous choices;
- each visible choice button dispatches its exact full literal exactly once;
- shortened button label is presentation only; title/aria/transport authority preserves the full literal;
- normal Story surface is current/latest scene only;
- full committed chronology remains in History overlay/export, not stale normal-surface cards.

### Time / continuity
- meaningful ordinary conversation/movement/work/social beats advance time plausibly;
- obvious frozen-time or chronology contradictions are failures;
- refresh/re-entry reconstructs committed server truth rather than stale client cache.

### CSA
- local draft/replacement edits perform zero gameplay writes before explicit Apply;
- one pending operation at a time;
- APPLY/CHANGE/REMOVE are each exactly one chronological normal Story turn;
- CHANGE is one `update` on the same rule id, not deactivate+activate;
- active rule replacement uses only the bounded existing preset catalog;
- unrelated ordinary turns after CSA operations contain no stale `csa_operation` and remain literal-action-first;
- institutional rule compliance must not mechanically create affection/comfort/consent/desire/romance/trust/personality obedience in Mind Monitor.

### Media / TTS
- approved image selection is deterministic and grounded in committed present/focal evidence, with fail-open when ambiguous;
- TTS fresh-session default OFF means zero synthesis calls;
- TTS ON sends only eligible committed canonical present-NPC dialogue through browser -> R3 API -> server `TTS_WORKER` binding;
- narrator/player/player-inner-thought/Mind Monitor text is not synthesized as character dialogue;
- replay/cache/stale fencing works and browser `speechSynthesis` remains absent.

### Turn lifecycle
- one visible submit/click creates at most one turn attempt/POST;
- a successful turn commits once;
- a failed/timeout turn terminates durably without partial commit and without automatic retry;
- response cancellation does not orphan the durable executor;
- no previous choice remains deceptively actionable while a hidden second submission occurs;
- stale expiry remains only last-resort safety.

### Existing accepted infrastructure
- same-game reset runtime is separately GREEN; native-confirm browser automation remains environment-deferred and is not reopened here;
- agency/navigation/reset/media/timeline/CSA/identity/timeout repairs are frozen and may not be redesigned inside acceptance.

## 5. Preflight — exact lineage only

Before gameplay:
1. verify current main is a docs-only descendant of executable `7961a3ceab638f43e7959123025b6cedd96f5898`;
2. verify the timeout fix files on main remain identical to source `7961a3c...`;
3. verify TEST API exactly `09dac4f4-1131-41c4-94a8-dfd59e5d02d8`;
4. verify TEST frontend exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
5. if versions match, deploy ZERO artifacts;
6. run full `npm.cmd test` on the exact accepted source lineage and require all tests PASS;
7. use only bare public `https://gamebuilder-company-r3.zeroslove.workers.dev` for gameplay.

If artifact identity is uncertain, STOP before play. Do not silently redeploy an uncertain head.

## 6. Campaign A — executive owner-style long play

Create one NEW disposable game with a canonical executive/senior profile. Prefer the already-tested shape `신사업TF / 임원`, but create a fresh game id and normal fresh player name.

Run Opening plus at least **15 committed chronological turns** without retry/regeneration.

Across Campaign A require at minimum:
- 6 free-form ordinary inputs;
- 4 visible choice-button clicks;
- one direct named-NPC conversation and a follow-up with the same NPC/topic;
- one work/context action;
- one non-work/social action;
- one explicit refusal/change-of-mind;
- one self-state action such as wanting quiet, pausing, fatigue, or ending an interaction;
- one canonical movement/scene change;
- one action explicitly addressed to a named NPC;
- one identity-artifact/introduction probe that does not type the expected rank label into the literal.

For sampled actions compare:
`literal input -> visible Story enactment -> committed/readback scene/state`.

Fail immediately on actor/target/action/topic/refusal/self-state substitution or wrong canonical destination.

### Identity acceptance in Campaign A
Require throughout:
- committed profile remains the selected executive profile;
- canonical player name remains exact;
- department remains exact;
- formal position/rank remains exact;
- for a `신사업TF / 임원` player, Story never asserts `팀장`, `TF팀장`, `대리`, `인턴`, or another alternate formal rank;
- card/badge/introduction/signature references, if shown, use the same canonical identity;
- refresh/re-entry does not weaken identity.

### Choice quality
Whenever Story has a supported terminal 1-4 tail:
- exactly four visible buttons;
- clicked button dispatches the full exact literal once;
- choices are meaningfully distinct when scene supports alternatives, not four near-paraphrases of one escalation.

If Story genuinely has no supported terminal choice tail, free input remains usable and no prior/fabricated choices appear.

### Time / scene
Sample after conversation, work, movement and social beats:
- time usually advances positively;
- location/presence matches current narrative;
- off-scene mention does not create presence;
- scene note updates coherently.

Do not require a fixed minutes-per-turn constant.

## 7. CSA sequence inside Campaign A

After several ordinary turns, use the visible high-parity CSA app.

### Draft behavior
Open Home / Player / NPC / CSA / Manual and verify the shell remains usable.
Then:
- stage one local CSA draft;
- prove staging alone causes zero gameplay request/turn/revision change;
- Revert once and prove zero gameplay request and committed state unchanged;
- one pending operation only.

Native dirty-close confirmation is not a required browser-automation gate if the native dialog cannot be accepted by the automation bridge. Record that separately; do not change source.

### Required chronology
Through normal visible controls:
1. APPLY one representative preset;
2. one unrelated ordinary company/social action;
3. CHANGE the same active rule to a **different preset** using active-rule replacement UI;
4. one unrelated ordinary action;
5. REMOVE the changed rule;
6. one final unrelated ordinary action.

Require:
- APPLY = exactly one POST `/turn`, one `operation=activate`;
- CHANGE staging before Apply = zero gameplay request;
- CHANGE = exactly one POST `/turn`, `operation=update`, same rule id, different template id;
- reopen/readback after CHANGE shows replacement committed under the same rule id;
- REMOVE = exactly one POST `/turn`, `operation=deactivate`;
- readback after REMOVE shows no active instance;
- surrounding ordinary turns have no stale `csa_operation` and preserve their literal action;
- no deactivate+activate CHANGE workaround;
- no duplicate/no-op/custom preset path;
- Mind Monitor does not turn rule compliance into automatic affection/comfort/consent/desire/romance/trust.

## 8. Media / TTS / History inside Campaign A

Reach at least one committed scene with a grounded present registered heroine and eligible dialogue.

### Image
Require:
- selected character matches committed grounded focal/relevant present heroine;
- approved image belongs to that exact character;
- ambiguous/no-grounded scene fails open instead of guessing;
- stale previous image cannot overwrite a later projection.

### TTS
Before enabling:
- capture zero `/media/tts` calls while TTS is OFF.

Then enable visible TTS on eligible committed NPC dialogue:
- only validated committed present-NPC dialogue is sent;
- browser calls R3 `/media/tts`, not the TTS worker directly and not `speechSynthesis`;
- audio element receives returned URL;
- narrator/player/private thought/Mind Monitor text is absent from synthesis payloads;
- Replay of cached current audio creates zero additional synthesis call where cache contract applies;
- next committed turn fences stale prior audio.

### Current Story / History
At multiple points, including after CSA and after refresh:
- normal `#story-history` remains empty/non-authoritative;
- `#current-story` contains only current/latest Story;
- History overlay contains Opening + each committed turn exactly once in canonical order;
- closing History returns to unchanged current scene;
- History open/close performs no gameplay mutation.

## 9. Mid-campaign refresh / feedback

At approximately Turn 8-11, refresh/re-enter Campaign A.
Require coherent reconstruction of:
- committed turn;
- current Story;
- canonical player identity;
- location/presence/time;
- current choices;
- player inner thought;
- Mind Monitor;
- CSA state;
- media eligibility/state;
- complete History.

No Opening/early turn cards may reappear on the normal current scene.
Continue at least 3 more committed turns after refresh.

If visible feedback/revision control is enabled and usable, perform one bounded latest-turn feedback revision and require:
- revision replaces latest current Story without advancing turn number;
- old/new revisions are not duplicated on normal surface;
- subsequent ordinary turn continues from revised committed truth.

If feedback is intentionally unavailable/disabled, record that exact state and continue. Do not bypass with direct API.

## 10. Campaign B — independent junior smoke

Create a second NEW disposable game with a low/junior profile, preferably canonical `브랜드전략팀 / 인턴` or another valid low-rank combination.

Run Opening + at least **4 ordinary committed turns** without retry/regeneration, including:
- one visible choice click;
- one free-form NPC conversation;
- one movement/scene or meaningful context change;
- one refusal/change-of-mind/self-directed action;
- one identity artifact/introduction opportunity without typing expected rank into the literal.

Require:
- first-arrival framing;
- selected junior name/department/rank preserved;
- no promotion to 팀장/임원 or executive assumptions;
- exact literal agency/navigation;
- four choices where supported;
- natural player thought and character-specific Mind Monitor where available;
- positive/plausible time progression;
- latest-only normal Story;
- complete History overlay.

## 11. Mobile / interaction quality

On substantive Campaign A progress inspect approximately 390x844 and a normal/wider desktop viewport.

Require:
- no horizontal overflow or blocking overlay;
- Story remains readable while streaming and after commit;
- no full-screen loading layer obscures Story streaming;
- image/player thought/Mind Monitor/choices/direct input/CSA/TTS/History controls remain reachable when eligible;
- active CSA replacement selector, pending preview, Revert and Apply are usable;
- History overlay is usable and closable;
- old committed turn cards do not consume the normal gameplay surface.

## 12. Cross-feature integrity checks

Before declaring GREEN, explicitly verify:
- no product/source file changed during acceptance;
- no TEST deployment occurred after preflight if versions were already exact;
- no Production access;
- no migration/schema/RPC/provider/model/config change;
- no preserved fixture mutation;
- no automatic retry/regeneration;
- every visible gameplay submit was single-shot;
- no duplicate committed turn for a clicked choice;
- accepted timeout fix remains present and no orphan processing job is observed;
- Campaign A reached >=15 committed turns and completed the full CSA APPLY->unrelated->CHANGE->unrelated->REMOVE->unrelated sequence;
- Campaign B reached >=4 ordinary committed turns;
- identity/agency/navigation/choices/time/thought/MM/media/TTS/timeline/history/refresh/mobile gates all have positive evidence.

## 13. GREEN / failure definition

GREEN only if ALL required gates above pass on new clean games.

If any actual product failure occurs:
- preserve that game immediately;
- capture exact first failing action/choice and state;
- do not retry or continue;
- terminal disposition `FAILED_PRODUCT`.

If only an environment/browser-harness limitation blocks one gate without disproving product behavior:
- report the exact limitation;
- do not patch source;
- do not invent a GREEN result.

Only if the entire matrix is GREEN may the terminal report include exactly:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

That phrase means the automated final acceptance candidate is ready to be handed to the owner. It does NOT authorize Production deployment or mutation of the preserved owner game.

## 14. Terminal protocol

At completion post to Issue #68:
- source SHA `7961a3c...` and final main SHA;
- preflight full-test count and deployed API/frontend versions;
- fresh Campaign A game id/profile, committed turn count, free-input count, visible-choice count;
- sampled exact agency/navigation/identity evidence;
- complete CSA request/operation/readback chronology;
- slow-turn/recovery evidence if any occurred, including final same-attempt state and confirmation no second submit/retry;
- media/image/TTS OFF/ON/replay evidence;
- latest-only Story + complete History evidence;
- refresh/re-entry and post-refresh turns;
- mobile 390x844 evidence;
- Campaign B game id/profile/turn count and junior-identity evidence;
- preservation/no-source/no-deploy/no-Production confirmations;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post the terminal report, and stop.

Do not create/start another task yourself.

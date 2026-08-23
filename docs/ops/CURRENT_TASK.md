# Company — CURRENT TASK

Status: READY
Task ID: company-r3-final-holistic-owner-style-long-play-v5
Mode: SOURCE-FROZEN FINAL HOLISTIC OWNER-STYLE LONG-PLAY ACCEPTANCE
Updated: 2026-08-24 08:15 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5389011231`
Operator review: Issue #68 comment `5389032629`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen accepted baseline

Accepted executable/source:
- `5709c4a894430b74cf5a985da57747c1cafcfd15`

Reviewed main before this registration:
- `7a53dca1e3c9ed46fa4a1e7f893b0b21d08f878b`
- independent compare from accepted source to this main shows only `docs/ops/CURRENT_TASK.md` lifecycle drift; product source is unchanged.

Accepted TEST deployment state:
- R3 API `game-proxy-company-r3@bee01bf9-b79f-433e-9cfb-6fc09a2379cc`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- legacy Company worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation:
- full `npm.cmd test`: `547/547 PASS`
- `git diff --check`: PASS
- Observer output budget is exactly 2400; Story remains 5000.
- TTS v3 disposition: `TTS_END_TO_END_GREEN`.

Latest focused TTS GREEN fixture, preserve READ ONLY:
- `48562807-6664-4562-91f5-1a8a79ee354f`
- Turn 1 registered/present heroine2 projection survived strict raw->applied grounding.
- exact frozen frontend batch -> R3 `/media/tts` -> server committed-dialogue authorization -> `TTS_WORKER` -> signed audio URL -> audio/mpeg fetch succeeded.
- Replay synthesis delta 0.
- distinct Turn 2 with TTS OFF committed once, zero new media requests, stale fence PASS.

Preserve READ ONLY all prior owner/manual/holistic/failure/diagnostic fixtures, including at minimum:
- `9fcd5ab5-eb13-4971-8fca-9fec20a1d531` owner manual save
- `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c` CSA CHANGE fixture
- `a78b91bd-4216-4e31-91ab-fd2705f0a99c` executive identity fixture
- `6b8ba038-50f0-408b-8210-20fed28bd0bc` junior identity fixture
- `1ebc90a9-2957-4e00-bcbd-32287cd918bc` holistic V3 timeout fixture
- `8dec6dcf-df4a-426b-b4c0-7a9d66e1d351` timeout smoke
- `ec8a906c-e540-4be4-b959-0ec0208c076d` holistic V4 evidence fixture
- `e675437c-4dfe-4dd0-b542-d52ae224f98e` quote-escape projection evidence
- `be0a3e57-e36d-4f5a-86b9-75d60e2dfbef` observer omission evidence
- `81cf07ae-ccc2-42c6-8e3c-fd8339efe133` successful Observer diagnostic
- `08a6fe64-1e61-4b7c-a07f-73c2aa3cbdcf` Observer JSON-invalid fixture
- `6f7e4d23-b413-45f0-9b7a-f57e01f1bc78` 1600-token truncation fixture
- `bb6a318a-ccd4-4158-a691-64d9ffdbd72c` 2400 strict-drop evidence fixture
- `48562807-6664-4562-91f5-1a8a79ee354f` TTS v3 GREEN fixture

Never reset/revise/retry/regenerate/mutate any preserved fixture.

## 1. Purpose

Run the final holistic owner-style acceptance against the current frozen R3 executable after all focused repairs and evidence corrections.

Use TWO entirely NEW disposable bare-public games:
- Campaign A: executive/senior profile, Opening + at least 15 committed ordinary turns.
- Campaign B: low/junior profile, Opening + at least 4 committed ordinary turns.

This task is acceptance only.

Do NOT patch source, tests, content, config, scripts, migration, DB, provider settings, or frontend.
Do NOT deploy or rollback any Worker if the exact accepted artifact versions above are still active.
Do NOT start another repair task inside this execution.

First decisive real product failure => preserve the fresh fixture READ ONLY, report exact first boundary, set WAITING_REVIEW, and stop.
Environment/harness evidence limitations must be classified separately and must not be promoted to product failure without proof.

Only a completely GREEN matrix may report:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

That is still not owner final acceptance; the user performs the final manual playtest afterward.

## 2. Mandatory preflight

Before creating Campaign A:
1. prove current `main` is a docs-only descendant of accepted executable `5709c4a...`;
2. prove active R3 API exactly `bee01bf9-b79f-433e-9cfb-6fc09a2379cc`;
3. prove active R3 frontend exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
4. prove legacy worker remains `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
5. deployment count in this task must remain ZERO for all workers;
6. run full `npm.cmd test`, require 547/547 PASS;
7. `git diff --check` PASS;
8. use only the bare-public frontend URL above.

If any deployed artifact differs, stop:
`BLOCKED_DEPLOYMENT_DRIFT`
Do not redeploy inside V5.

## 3. Hard prohibitions

Do NOT:
- edit runtime/frontend/test/content/config/script/migration source;
- deploy or rollback API/frontend/legacy workers;
- change Story/Observer prompts;
- change model/provider identity;
- change Story/Observer token budgets;
- change temperature/thinking/response_format/timeouts;
- add retry, regeneration, second Observer, or sample-until-pass behavior;
- use a Story parser/media fallback to manufacture eligibility;
- alter normalizer/media/TTS behavior;
- use direct gameplay API as a substitute for browser interaction;
- use direct media/provider/TTS API as a substitute for browser interaction;
- use `?api=` override or storage preseed;
- mutate DOM or call internal JS submit functions;
- use synthetic click/event dispatch to substitute a normal visible control click;
- change DB schema/table/RPC/migration/RLS/grants;
- touch Production;
- reset/retry/regenerate preserved games;
- repeat the same semantic action merely to obtain a favorable model sample;
- click the same choice twice because the first click outcome is unclear.

Read-only DB/context inspection of the NEW disposable Campaign A/B games is allowed to verify durable evidence.

## 4. Owner product law — evaluate every turn

The following are acceptance law, not optional quality notes.

### 4.1 Player agency
Story must preserve the submitted player's:
- actor
- target
- action
- request/refusal
- self-state
- movement/destination
- topic
- intent

The Story may narrate consequences but cannot replace, invert, redirect, or contradict the chosen beat.
Player intent/attempt is NOT automatic proof of external success, NPC consent, or NPC compliance.

Explicit refusal/self-state examples must remain true for the chosen scene beat. If the player chooses to be alone, Story must not make an NPC immediately approach and converse in a way that makes that self-state false unless the literal itself permits it.

### 4.2 Opening
Every new profile starts on first day/first arrival regardless of rank.
The unfamiliar/private CSA app is discovered or noticed with natural curiosity/temptation; Opening must not author a voluntary player use/action before the player chooses it.
Opening must preserve selected exact name/department/formal position.

### 4.3 Identity
Canonical player name, department, and formal rank must never drift.
Campaign A must include one natural identity-artifact probe, such as checking/using an introduction, badge, business card, meeting introduction, or equivalent scene where exact formal identity can be observed.
Campaign B must prove there is no executive/senior identity leakage.

### 4.4 Company-life fiction
This is adult company-life interactive fiction / character simulation, not a workplace productivity chatbot.
Include natural work AND social/non-work/self-directed beats. Do not make every turn a work task or CSA escalation.

### 4.5 Time/location/presence
Time progression must be plausible.
Canonical movement/location/presence must remain coherent across Story, committed context, refresh, and map/current UI.
Do not teleport stale source-location NPCs into a destination scene without destination evidence.

### 4.6 CSA emotional separation
Institutional CSA compliance/execution must not automatically manufacture affection, comfort, desire, romance, trust, consent-as-feeling, or obedience-as-personality.
NPC reluctance/embarrassment/anger/discomfort may coexist with rule execution.

## 5. Campaign A — executive/senior long play

Create ONE NEW game through visible Setup UI with a clearly executive/senior formal position and a unique Korean player name.
Record exact selected profile.

Opening must pass the first-day/app/identity laws above.

Then complete at least 15 chronological ordinary turns.

Minimum interaction mix across Campaign A:
- at least 6 free-text visible submissions;
- at least 4 distinct visible Story choice-button clicks;
- at least one direct interaction with a registered heroine;
- at least one direct interaction with a general NPC when naturally available;
- at least one explicit canonical movement/scene-change turn;
- at least one ordinary work/context turn;
- at least one social/non-work turn;
- at least one explicit refusal/change-of-mind turn;
- at least one explicit self-state turn;
- at least one identity-artifact/formal-rank observation;
- at least three ordinary turns after the mid-campaign refresh/re-entry.

Do not script all turns around the same NPC or same semantic action.
Do not force NPC compliance simply to make the test pass.

For every committed turn, record at minimum:
- turn number;
- interaction type: free text or choice;
- exact literal_action;
- one `/turn` POST expected_turn;
- durable job attempt/status/stage;
- committed turn/revision;
- key agency/location/presence/time outcome;
- Observer failure/provenance warnings if present.

No retry/resubmit of a failed or unfavorable Story sample.

## 6. Visible choice dispatch — corrected evidence law

At least FOUR distinct Story choices must be activated using normal visible/native browser interaction.

Before each click capture:
- current committed turn;
- button index;
- visible shortened label;
- full `title`;
- full `aria-label`;
- `disabled=false`;
- canonical full choice literal from committed Story;
- no current processing job.

Then perform exactly ONE normal visible/native click.

Successful choice proof requires:
1. automation/browser confirms the enabled target was actually activated;
2. UI leaves ready state / normal generation feedback appears;
3. exactly one browser POST `/api/r3/games/<id>/turn`;
4. request `literal_action` exactly equals the canonical full choice literal, not the shortened label;
5. exactly one durable job attempt_no=1 for the expected turn;
6. terminal lifecycle state is observed;
7. on success exactly one committed turn stores the same literal and returns ready;
8. no duplicate click/POST/job.

If there is NO `/turn` POST:
- detached target / obscured target / click API error / automation cannot prove real enabled activation => `BLOCKED_BROWSER_CLICK_EVIDENCE`; this is harness/environment, not product failure;
- a real enabled native click is positively proven and visible generation/click activation occurs but still zero `/turn` POST and zero durable job => `FAILED_PRODUCT_CHOICE_DISPATCH`.

Do not wait 120/145 seconds and call it a lifecycle timeout when no durable job exists.
If one POST/job exists, any later failure is classified at the actual lifecycle boundary, not as dispatch.

## 7. CSA chronology and high-parity UI

In Campaign A exercise the visible CSA app through chronological normal gameplay:

1. open/stage one draft;
2. prove dirty draft does not mutate durable rule before Apply;
3. use visible Revert at least once on a staged change and prove no durable mutation;
4. stage and APPLY one rule -> one normal Story turn / one `csa_operation`;
5. commit at least one unrelated ordinary non-CSA turn while the rule remains active;
6. CHANGE the SAME rule id to a DIFFERENT preset/template through visible UI -> one normal Story turn;
7. prove same rule id and changed canonical template/content;
8. commit at least one unrelated ordinary turn afterward;
9. REMOVE the rule through visible UI -> one normal Story turn;
10. prove active rule removed;
11. commit at least one unrelated post-REMOVE ordinary turn with no stale `csa_operation` or removed-rule residue.

One dirty draft may represent only one operation. Do not silently batch multiple edits.

Validate rule execution only when the actual Story scene/literal materially triggers it. Do not create a false failure merely because an unrelated turn does not narrate the rule.

## 8. Observer/projection evidence — corrected classification

Observer fail-open is allowed to preserve Story commit, but in this final acceptance any primary Observer failure must be recorded by exact durable provenance and causes the V5 matrix to stop for review rather than being relabeled as a TTS/frontend defect.

Existing codes include:
- `r3_observer_timeout`
- `r3_observer_provider_http`
- `r3_observer_response_json_invalid`
- `r3_observer_message_missing`
- `r3_observer_json_invalid`
- `r3_observer_unknown`

If `r3_observer_json_invalid` also has `r3_observer_finish_length` at the accepted 2400 budget, classify:
`FAILED_PRODUCT_OBSERVER_OUTPUT_BUDGET_2400`
and stop. Do not tune the budget in-task.

Important: `dialogue_projection_dropped` is NOT itself a failure.
A dropped raw dialogue line is a normalization defect only if THAT exact raw item independently satisfies ALL strict grounding requirements:
- registered heroine;
- heroine is committed present actor;
- non-empty exact text exists in Story;
- evidence_quote is an exact contiguous Story span under accepted quote-escape parity;
- same evidence span contains the heroine canonical name;
- same evidence span contains the exact spoken text;
- attribution is not pronoun-only/ambiguous.

Only then, if absent from applied, classify `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.
A valid applied heroine sibling is enough to qualify media/TTS even when other invalid raw siblings are correctly dropped.

## 9. Approved image and TTS

Campaign A must prove at least one successful approved registered-heroine image and one successful character-aware TTS path.

### 9.1 Image
Choose a turn where current committed scene has a grounded registered heroine.
Require:
- selected image belongs to the exact grounded heroine;
- approved repository media only;
- no wrong/general-NPC fallback;
- no stale prior-turn wrong image;
- Story/choices/input remain usable.

General-NPC-only/no-qualified-heroine scenes may correctly fail open with no image and are not image failures.

### 9.2 TTS qualification
Do NOT turn TTS ON merely because visible Story contains dialogue.
First prove current committed `observer_applied.dialogue_lines` contains at least one strict-valid registered/present heroine line with canonical `voice_id`.

Derive exact expected batch from frozen frontend contract:
`buildR3ViewModel -> selectPrimaryTtsLines -> batchDialogueLines`.

Record expected `{speaker_id,text,direction/tone}` batch list before TTS ON.

With TTS visibly OFF after the qualifying turn:
- `/media/tts` count = 0;
- no browser-direct external TTS/provider request;
- no `speechSynthesis`.

Then click visible TTS ON exactly once:
- R3 `/media/tts` request(s) must match only the expected committed batch(es);
- server committed-dialogue authorization succeeds;
- server uses existing `TTS_WORKER` binding;
- each uncached required batch yields valid audio URL;
- no browser-direct TTS worker/provider call.

General-NPC-only dialogue, `observer_applied.dialogue_lines=[]`, or no canonical heroine voice is an INELIGIBLE fail-open state, NOT a TTS product failure. Continue naturally until a qualifying turn exists, within the Campaign A turn budget; do not retry the same action.

After successful synthesis/cache:
- click visible Replay exactly once;
- Replay `/media/tts` synthesis delta must be 0 for identical cached batch.

Then switch TTS OFF and later commit at least one distinct turn:
- zero new `/media/tts` while OFF;
- no late prior-turn audio/TTS state may overwrite the new turn.

## 10. Current scene / History / refresh / feedback / mobile

Campaign A must also prove:

### Current scene vs History
- normal live/current Story area shows only the latest current scene/turn, no Opening or stale old-turn residue;
- History/export contains chronological Opening + all committed turns exactly once and in order.

### Mid-campaign refresh
At or after approximately Turn 8 and before the final three Campaign A turns:
- perform one normal browser refresh/re-entry;
- current committed turn/story/location/presence/choices/profile/CSA state reconstruct correctly;
- no duplicate turn;
- continue at least three more committed turns afterward.

### Feedback
If the current visible product exposes feedback/revision functionality, exercise it exactly once through the visible supported path and verify documented revision semantics without duplicate active turn/history residue.
If intentionally not exposed/disabled in R3, record that fact and do not bypass through API/internal JS.

### Desktop/mobile
Inspect normal desktop and approximately 390x844 viewport:
- no horizontal overflow;
- Story, choices, direct input, CSA controls, media/TTS/replay controls remain reachable;
- streaming/loading state does not obscure the narrative with a blocking full-screen overlay;
- no automatic scroll behavior that prevents reading current text.

## 11. Campaign B — junior/low-rank isolation smoke

Only after Campaign A passes all required gates, create a SECOND entirely NEW disposable game through visible Setup using a clearly junior/low formal position and a different unique Korean name.

Require:
- Opening is first day/first arrival;
- exact junior name/department/rank;
- no executive/senior rank leakage from Campaign A or prior fixtures;
- unfamiliar/private app law preserved;
- exactly four current Story choices when supported;
- at least 4 distinct ordinary committed turns;
- include at least one free input and at least one visible choice click if possible without duplicating Campaign A evidence;
- include at least one social/non-work or self-directed beat, not four work-only turns;
- time/location/presence/agency coherent;
- current scene latest-only and History chronological;
- no stale Campaign A media/TTS/profile/CSA state.

Any product failure in Campaign B is decisive for V5.

## 12. Slow-turn / lifecycle rule

Do not manufacture failure at arbitrary 60/80/100 second cutoffs.
Never resubmit or retry the same turn.

If a browser `/turn` POST creates a durable job:
- observe that same attempt through normal UI/reconciliation and the accepted provider/durable lease lifecycle;
- a natural explicit failed terminal is real evidence;
- processing beyond the accepted durable lease is a lifecycle failure;
- a successful late commit within contract is success.

If no durable job exists, do not call it a timeout.

## 13. Stop/classification law

On first decisive complete proof, stop immediately and preserve the new fixture(s) READ ONLY.

Use the narrowest truthful classification, for example:
- `FAILED_PRODUCT_AGENCY`
- `FAILED_PRODUCT_IDENTITY`
- `FAILED_PRODUCT_NAVIGATION_PRESENCE`
- `FAILED_PRODUCT_CHOICE_DISPATCH`
- `FAILED_PRODUCT_CSA_LIFECYCLE`
- `FAILED_PRODUCT_IMAGE`
- `FAILED_PRODUCT_TTS_ENQUEUE`
- `FAILED_PRODUCT_TTS_BATCH_IDENTITY`
- `FAILED_PRODUCT_TTS_AUTHORIZATION`
- `FAILED_PRODUCT_TTS_SERVICE`
- `FAILED_PRODUCT_TTS_REPLAY_CACHE`
- `FAILED_PRODUCT_TTS_STALE_FENCE`
- `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`
- `FAILED_PRODUCT_OBSERVER_OUTPUT_BUDGET_2400`
- `FAILED_PRODUCT_TIMELINE_HISTORY`
- `FAILED_PRODUCT_REFRESH_RECOVERY`
- `FAILED_PRODUCT_MOBILE_UI`
- `FAILED_PRODUCT_TURN_LIFECYCLE`

Environment/evidence classifications must remain separate, e.g.:
- `BLOCKED_BROWSER_CLICK_EVIDENCE`
- `BROWSER_AUTOPLAY_LIMITATION`
- `BLOCKED_DEPLOYMENT_DRIFT`

Do not patch after a decisive failure in this task.

## 14. GREEN exit matrix

GREEN requires ALL of the following in the same V5 execution:

Campaign A:
- fresh executive/senior Setup and correct first-arrival Opening;
- exact canonical identity and one identity-artifact probe;
- >=15 committed ordinary turns;
- >=6 free-text turns;
- >=4 proven native visible choice dispatches;
- exact player agency across work/social/non-work/refusal/self-state/movement;
- coherent time/location/presence;
- player attempt not treated as automatic external consent/success;
- CSA draft/Revert/APPLY -> unrelated -> CHANGE same id/different preset -> unrelated -> REMOVE -> unrelated;
- CSA execution emotionally separated from affection/consent/trust;
- approved grounded heroine image succeeds;
- TTS OFF=0 -> exact committed heroine batch -> R3 authorization -> TTS_WORKER -> valid audio;
- Replay synthesis delta 0;
- later TTS-OFF turn zero new media requests and no stale overwrite;
- latest-only current scene and complete chronological History;
- mid-campaign refresh/re-entry and >=3 subsequent turns;
- feedback path tested once if visibly supported, otherwise documented disabled;
- desktop and 390x844 usable/no horizontal overflow.

Campaign B:
- fresh junior/low-rank Setup and first-arrival Opening;
- exact junior identity with no executive leakage;
- >=4 ordinary committed turns;
- agency/time/location/presence/current-vs-history coherent;
- no Campaign A state/media/CSA leakage.

Global:
- full tests remain GREEN;
- zero source/config/test/content/script/migration changes;
- zero deployments/rollbacks;
- zero provider/model/prompt/token/timeout changes;
- zero DB schema/RPC/migration changes;
- zero Production operations;
- zero preserved-fixture mutation;
- zero retry/regeneration/sample-until-pass behavior.

Only if every item is GREEN, terminal disposition may be:
`OWNER_READY_CANDIDATE_FOR_USER_FINAL_PLAYTEST`

Do not claim final owner acceptance. Stop WAITING_REVIEW for operator review.

## 15. Completion report

Post a NEW Issue #68 terminal comment recording at minimum:
- start/final main and final CURRENT_TASK blob;
- accepted source and exact active API/frontend/legacy versions;
- deployment counts all zero;
- full test count and diff check;
- Campaign A game id/profile;
- Campaign A Opening findings;
- chronological Turn 1..N matrix with input type, exact literal, network POST, durable attempt/commit, key outcome;
- all four+ choice click evidence bundles;
- identity-artifact evidence;
- movement/location/presence evidence;
- refusal/self-state/social/non-work agency evidence;
- complete CSA lifecycle evidence;
- image identity/result;
- exact TTS qualifying projection, expected batch, OFF/ON network result, authorization/TTS_WORKER/audio URL, Replay delta, stale fence;
- History/latest-current evidence;
- refresh/re-entry evidence;
- feedback status/evidence;
- desktop/mobile measurements/observations;
- Campaign B game id/profile and >=4-turn identity/isolation smoke;
- exact Observer provenance if any fail-open occurs;
- exact first decisive product or harness failure if not GREEN;
- preserved fixtures untouched;
- exact terminal disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push `main`, post terminal, and stop.

Do not create the next task yourself.
Do not patch a discovered failure in V5.
Do not touch Production.

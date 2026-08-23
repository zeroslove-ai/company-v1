# Company — CURRENT TASK

Status: READY
Task ID: company-r3-choice-button-dispatch-blocker-v1
Mode: FREEZE EXACT OWNER P0 CLOSURE -> REPRODUCE CHOICE DEAD-CONTROL -> ROOT FIX -> BARE-PUBLIC ACCEPTANCE
Updated: 2026-08-23 17:13 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5384999035`
Owner manual-play override: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path or an ops/recovery branch.

## 0. Operator review decision

Accept and freeze the exact owner agency/navigation closure from terminal `5384999035` unless new contradictory real-user evidence appears.

Accepted executable/source baseline:
- source `ed7919b142ef116d76c4e08fec73e3818ff6106a`;
- TEST API `game-proxy-company-r3` version `5d9ca276-b688-4b9a-8a5f-1bae13416c48`;
- TEST frontend `gamebuilder-company-r3` version `731cc702-2451-442a-895c-2d10c38dccc9`.

Accepted exact owner P0 evidence:
- P0-A authority literal is `이메이 사원. 일단 공자룰 좀 확인해보게나`;
- reported code points `c774 ba54 c774 20 c0ac c6d0 2e 20 c77c b2e8 20 acf5 c790 b8f0 20 c880 20 d655 c778 d574 bcf4 ac8c b098` reconstruct exactly that literal;
- browser input -> POST literal_action -> persisted/readback literal -> reload readback were equal;
- Story preserved addressed target/topic/request and did not invent CSA-app operation;
- P0-B authority literal is `직원 라운지로 이동한다`;
- reported code points `c9c1 c6d0 20 b77c c6b4 c9c0 b85c 20 c774 b3d9 d55c b2e4` reconstruct exactly that literal;
- browser input -> POST literal_action -> persisted/readback literal -> reload readback were equal;
- Story/Observer/committed state/readback/refresh agreed on canonical `employee_lounge`, with no source-scene NPC teleport;
- generic different NPC/topic and different canonical movement control also passed;
- four ordinary free-input/social/refusal/follow-up replay turns committed without a new agency/navigation defect.

Do NOT rerun these exact owner P0 fixtures merely to seek more green evidence. They are frozen for this task.

## 1. New objective user-visible blocker

Terminal `5384999035` found a different objective defect during the required replay:
- current Story choice controls were visibly rendered;
- the runner attempted the visible role control and then the freshly observed DOM choice control;
- neither interaction emitted a POST `/turn` request;
- no gameplay turn committed and the turn number remained unchanged;
- free-input turns in the same deployed build remained usable.

This is not UTF-8 corruption and not evidence to reopen agency/navigation. It is a choice-button UI/dispatch blocker.

## 2. Required reproduction before source change

Use the bare canonical public frontend only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Hard rules:
- fresh clean browser/storage context;
- fresh disposable TEST game through visible Setup;
- no `?api=` override;
- no pre-supplied `game_id` or storage preseed;
- no direct-API gameplay substitute;
- no devtools/request injection to make a click work;
- no Production;
- do not access/mutate owner or preserved games.

First establish Opening and a ready turn with visible current Story choices. Capture before click:
- exact rendered choice labels and their full literal actions;
- enabled/disabled state;
- relevant overlay/loading/pointer state;
- current turn/revision;
- event target and current choice identity available to the frontend;
- console/page errors;
- network event baseline.

Then click exactly one currently visible choice once through the actual user-facing control.

Classify one of:
A. click event never reaches frontend handler;
B. handler runs but current choice/action identity is missing/stale;
C. submit path is invoked but request is blocked/aborted before network;
D. POST occurs but server rejects/fails;
E. click succeeds and prior terminal was an automation/transient artifact.

Do not patch source until the branch is evidenced.

## 3. Source investigation boundary

If deterministic product failure reproduces, inspect only the existing R3 frontend choice/submit lifecycle and directly adjacent contract:
- choice rendering and current-choice binding;
- click/keyboard listeners;
- disabled/readiness/loading state transitions;
- full literal-action mapping;
- submitAction/request dispatch path;
- refresh/re-entry reconstruction of choices;
- overlay/z-index/pointer interception only if visible evidence supports it.

Compare the working free-input submit path to choice submit and reuse the same canonical dispatch path rather than adding a second gameplay writer.

Forbidden:
- new generic UI framework;
- hidden automatic fallback from dead choice to free input;
- direct API bypass from frontend;
- second action executor/writer;
- keyword/fuzzy/semantic parser;
- provider/model/config/timeout changes;
- hidden retry/regeneration;
- agency/navigation rewrite;
- CSA enactment implementation;
- reset/schema/migration/RLS/grant work;
- Production.

## 4. Smallest correction and tests

If source correction is required:
- make the smallest coherent root fix in the existing frontend path;
- add focused deterministic regression proving a rendered enabled current choice causes exactly one canonical turn submission with its full literal action;
- prove stale/disabled choices do not submit;
- prove ordinary free-input submission remains unchanged;
- prove one click cannot create duplicate jobs/turns;
- run directly relevant focused tests plus the full suite if touched dependencies warrant it;
- deploy only affected R3 TEST artifact(s), preserving current bindings and API/frontend split-origin behavior.

If the defect does not reproduce and evidence shows the old click attempt was automation-only/transient, do not make a speculative source change. Continue acceptance below on the unchanged deployed build.

## 5. Mandatory bare-public post-fix/closure acceptance

Use at least two fresh independent disposable games.

### Fixture A — desktop
- bare public Setup -> Opening;
- inspect four current Story choices;
- click one visible choice exactly once;
- require exactly one `/turn` request and exactly one committed turn;
- request/persisted literal must equal the selected current choice full literal;
- controls return ready with new current choices;
- then submit one Korean free-input turn;
- refresh/re-entry and click another newly current choice once;
- require one request/one commit again.

### Fixture B — mobile approximately 390x844
- bare public Setup -> Opening;
- action controls must be visibly reachable and not covered by loader/audio/overlay;
- click one current choice once;
- require one request/one commit and correct literal mapping;
- continue one free-input or choice turn after refresh.

Across both fixtures inspect complete Story text and state sufficiently to ensure the choice path did not resurrect action substitution, wrong location, stale actors, duplicate chronology, or blocking UI/network errors.

## 6. Acceptance criteria

This task is GREEN only if:
- root classification is evidenced, not guessed;
- at least three independent visible choice clicks across desktop/mobile produce exactly one intended request and one commit each;
- selected displayed/current choice maps to the correct full literal action in request and persisted readback;
- current choice readiness survives terminal commit and refresh/re-entry;
- free input remains usable;
- no duplicate turn/job is created;
- no blocking overlay/pointer interception remains;
- no uncaught console/page error or required-request failure remains;
- exact owner P0 agency/navigation frozen behavior is not contradicted by the narrow replay;
- no forbidden Production/provider/model/migration/schema work occurred.

Do NOT claim owner-ready after this task.

## 7. Next phase after successful choice closure

Only after this choice blocker is reviewed GREEN, proceed to the next owner-remediation phase:
1. CSA APPLY/CHANGE/REMOVE as chronological streamed enactment turns;
2. CSA anti-hijack boundary: active rules must not turn normal company-life Story/choices into a rule-demo loop;
3. CSA compliance must not imply affection/comfort/desire or positive private emotion without independent evidence.

Later phases remain:
- first-arrival Opening + player inner thought + natural first-person character-specific Mind Monitor + choice diversity/time progression;
- high-parity donor CSA UI;
- approved-media image projection + character-aware server TTS;
- deployed same-game reset integration failure;
- timeline/current-scene UI residue and final holistic owner-style acceptance.

## 8. Completion report

Post to Issue #68:
- exact reproduction fixture and root classification A/B/C/D/E;
- choice labels/full literals and selected current choice;
- click -> handler -> submit -> network -> persisted readback evidence;
- changed paths/source SHA if any;
- focused/full test results actually run;
- deployed TEST version IDs if changed;
- desktop/mobile fixture IDs;
- at least three successful independent choice clicks with exact one-request/one-commit proof;
- refresh/free-input/no-duplicate findings;
- final classification.

Then set this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK yourself.

# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-post-apply-next-interaction-v1
Mode: CLASSIFY POST-APPLY STALL -> FIX NEXT-INTERACTION LIFECYCLE -> REDEPLOY TEST -> RESUME CSA LIVE ACCEPTANCE
Updated: 2026-08-23 18:56 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385389844`
Operator review: Issue #68 comment `5385402397`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve unless this task proves a direct regression

Accepted CSA chronology implementation source:
- `fc0aace9df2a2e99d233d757b7964bc4aa9d9033`

Current deployed TEST artifacts from the failed acceptance:
- API Worker `game-proxy-company-r3` version `c8c0b390-db3e-45cf-900d-70a91cbab231`
- Frontend Worker `gamebuilder-company-r3` version `e59b4c67-a183-4b3a-adc3-e0bd507d16d2`
- public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Already-accepted deterministic validation:
- focused R3 CSA contract/frontend/turn tests: 24/24 PASS
- full `npm.cmd test`: 506/506 PASS
- changed-JS syntax checks: PASS
- `git diff --check`: PASS

Already-proven live behavior on disposable fixture `d738c97f-8e66-4e83-9c66-849bc13f63c6`:
- Opening = Turn 0;
- ordinary Korean free input = Turn 1;
- visible CSA APPLY = one visible streamed Story/Observer/commit to Turn 2;
- active CSA count changed 0 -> 1 only with that committed turn;
- immediate Story represented the app action/world consequence naturally;
- no separate zero-turn write was observed;
- choices immediately after APPLY were four distinct company-life continuations rather than CSA-only escalation.

Do not rewrite the chronological CSA architecture or reopen these facts without contradictory evidence.

Frozen earlier GREEN surfaces also remain binding:
- exact player-agency literal preservation;
- canonical player navigation;
- visible choice-button dispatch on desktop/mobile;
- bare-public cold start.

## 1. Decisive live failure to investigate first

On the accepted deployed build, immediately after the successful APPLY Turn 2, the unrelated free input:

`윤민아 대리를 따라 복도로 나가 괜찮은지 조용히 확인한다.`

failed to advance beyond Turn 2 during a bounded 110-second observation.

Observed:
- input remained present;
- submit control eventually appeared enabled;
- no bounded useful UI error was visible;
- browser console error/warn logs were empty;
- network-level request/SSE evidence was not captured;
- run correctly stopped without retry;
- CHANGE/REMOVE/refresh/private-emotion remainder was therefore not executed.

This is a real user-visible continuity blocker. Do not assume the cause.

## 2. Required first step — classify the exact broken boundary before source edits

Use a fresh disposable bare-public TEST game. Do not mutate owner/preserved games.

Reproduce exactly enough to reach:
1. Setup -> Opening;
2. one ordinary turn;
3. one visible CSA APPLY that commits successfully;
4. one unrelated ordinary free-input turn immediately afterward.

For that fourth action capture, as available from the browser/runtime diagnostics:
- click/submit event actually fired or not;
- POST `/api/r3/games/:id/turn` actually issued or not;
- request URL/origin/method;
- request body `expected_turn`, `literal_action`, presence/absence of `csa_operation`;
- HTTP status, response content-type and whether body is SSE;
- timing to response headers, first SSE frame, first `story_delta`, Observer stage and terminal;
- server context immediately before submit;
- server context immediately after failure/timeout;
- `committed_turn`, state revision and next job identity/status/stage/error_code;
- whether a Turn 3 job row exists;
- whether the job is `reserved`, `story_streaming`, `story_complete`, `failed`, `committed`, expired, or absent;
- whether Story provider was actually called;
- whether the frontend entered transport reconciliation and what classification it chose.

Classify the first broken boundary as exactly one primary root category:
A. UI dispatch/control/overlay/focus prevented POST;
B. POST/HTTP/CORS/origin/body failure before reservation;
C. turn reservation/job identity/state-revision conflict;
D. Story request/first-content/stream timeout or provider transport failure;
E. Observer/reducer/commit failure;
F. terminal SSE parsing/reconciliation/render lifecycle failure;
G. another concrete boundary with direct evidence.

Do not patch until this classification has evidence. No stochastic repeated submissions to make a flaky turn pass.

## 3. Source-proven lifecycle defect to close in this same narrow cut

Independent of the failed Turn 3 root cause, current frontend source has a deterministic post-operation control lifecycle defect:
- `submit()` sets `state.busy = true`;
- committed terminal calls `renderContext(context)` while busy is still true;
- `renderContext()` calls `csaUi.sync()`;
- CSA APPLY/CHANGE/REMOVE buttons therefore render disabled because `getBusy()` is true;
- `submit()` finally changes `state.busy = false` and calls `refreshChoices()` only;
- CSA UI is not re-synced after busy clears.

Result: CHANGE/REMOVE can remain stale-disabled after a successful operation turn until another render happens.

Fix this with the smallest lifecycle correction. Do not redesign the CSA app.

## 4. Implementation boundaries

After root classification, make the smallest source correction that closes the proven broken boundary plus the stale-disabled CSA control lifecycle.

Required invariants:
- ordinary post-CSA free input must use the same normal turn path as any ordinary turn;
- an active CSA rule must not inject a stale `csa_operation` into an unrelated turn;
- no duplicate turn writer;
- no hidden retry/regeneration;
- no provider/model/temperature/token/timeout tuning to mask a transport/state bug;
- no architecture redesign;
- no generic new retry framework;
- no migration/schema/RLS/grant change;
- no reset work;
- no Production;
- no owner/preserved-game mutation.

If the primary root is provider first-content/stream behavior caused by the new prompt/context shape, correct only the concrete request/context defect. Do not solve it by increasing timeout or changing model.

If the primary root is frontend transport/reconciliation, ensure a user-visible bounded error remains when a turn truly fails; silent return-to-enabled with no useful state is not acceptable.

## 5. Focused deterministic regressions

Add/update only tests needed for the proven lifecycle. At minimum cover:
1. successful CSA APPLY followed immediately by ordinary free input creates the next expected turn with no `csa_operation`;
2. post-APPLY ordinary turn preserves exact literal action;
3. post-APPLY next-turn reservation is not blocked by the committed CSA job;
4. if transport fails, reconciliation reports processing/failed/committed/not-sent truthfully rather than silently appearing successful;
5. after successful CSA operation terminal and `state.busy` clearing, CHANGE/REMOVE controls are enabled again;
6. operation controls remain disabled while genuinely busy to prevent duplicates;
7. APPLY itself remains exactly one streamed committed turn;
8. failed CSA Story remains atomic and cannot half-apply state;
9. earlier choice dispatch and player-agency/navigation contracts remain green where touched.

Prefer a regression that exercises the same store shape used by deployed Supabase behavior if the root lives at store/job parity. Do not add a migration merely to make a test convenient.

Run:
- focused R3 CSA/turn/frontend/transport tests;
- full `npm test`;
- changed JS/MJS syntax checks;
- `git diff --check`.

## 6. TEST-only deployment

If source changes, deploy only affected R3 TEST artifact(s) from the exact reviewed source.

Preserve all existing bindings/secrets including `R3_GAME_ACCESS_SECRET`.
Do not print, rotate, recreate, request, or transfer secrets.
No Production.
No provider/model/config tuning.
No migration/schema/reset changes.

Record exact source SHA and Worker version IDs.

## 7. Mandatory bare-public acceptance after the fix

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, no preseeded storage, no direct-API gameplay substitute for acceptance.

### Gate 1 — reproduce the failed sequence
Fresh desktop disposable game:
1. Setup -> Opening;
2. ordinary Turn 1;
3. visible CSA APPLY -> exactly one streamed Turn 2;
4. immediately submit unrelated free input `윤민아 대리를 따라 복도로 나가 괜찮은지 조용히 확인한다.`;
5. require actual POST/SSE, visible Story stream and exactly one committed Turn 3;
6. require exact action/target/movement/social intent preservation;
7. require no stale `csa_operation` on Turn 3;
8. require no silent stall/errorless return-to-ready.

### Gate 2 — CSA control lifecycle
After APPLY commit:
- CHANGE/REMOVE controls must become usable once the turn is terminal and busy clears;
- no duplicate operation submission;
- mobile controls must also remain reachable.

### Gate 3 — resume the original CSA acceptance
Only after Gates 1–2 pass, continue the original unfinished coverage:
- visible CHANGE = one streamed committed turn;
- one unrelated ordinary continuation;
- visible REMOVE = one streamed committed turn;
- refresh/re-entry preserves chronology and active rule state;
- at least two visible choice clicks across the campaign;
- one movement/social action;
- one refusal or explicit self-state action;
- inspect choices for diversity and no CSA tutorial/escalation collapse;
- inspect Mind Monitor/private state: compliance alone must not create affection/comfort/desire/arousal/attraction/excitement/trust/liking;
- desktop + approximately 390x844 mobile coverage;
- total 8–12 committed turns across fresh disposable fixtures.

Inspect complete Story text and committed context, not only DOM shape.

## 8. GREEN criteria

GREEN only if:
- exact post-APPLY Turn 3 blocker has a proven root cause and is fixed;
- unrelated post-CSA free input commits normally with visible streaming;
- no stale operation leaks into ordinary turn payload/context;
- CSA operation controls recover from busy state correctly;
- APPLY/CHANGE/REMOVE each remain exactly one chronological committed turn;
- state transitions remain atomic;
- unrelated turns remain player-action-first instead of CSA tutorial/demo loops;
- choices remain meaningfully diverse;
- compliance alone does not produce unsupported positive private emotion;
- refresh/re-entry coherent;
- agency/navigation/choice-dispatch remain healthy;
- no silent blocking error path;
- no forbidden Production/provider-model/migration/schema/reset/secret work.

Do NOT claim owner-ready after this task.

## 9. Completion report

Post to Issue #68:
- primary root classification A–G with exact evidence;
- failed request/job/SSE/context evidence before fix;
- exact changed files/source SHA;
- focused/full tests actually run;
- deployed TEST Worker version IDs;
- disposable fixture IDs;
- APPLY -> unrelated Turn 3 proof;
- CSA control re-enable proof;
- CHANGE/REMOVE proof;
- refresh/re-entry proof;
- anti-hijack choice-diversity findings;
- private-emotion findings;
- desktop/mobile console/network findings;
- remaining objective defects.

Then overwrite this SAME file to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK yourself.

## 10. Remaining owner-remediation phases after this cut

Do not implement these inside this task:
1. first-arrival Opening motivation + player inner thought + natural character-specific first-person Mind Monitor + broader choice diversity/time progression;
2. high-parity Company donor CSA UI;
3. approved-media image projection + character-aware server TTS;
4. deployed same-game reset integration failure;
5. timeline/current-scene UI residue;
6. final holistic owner-style long-play acceptance.

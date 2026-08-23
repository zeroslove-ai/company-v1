# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-media-tts-choice-evidence-correction-v1
Mode: SOURCE-FROZEN ACCEPTANCE -> CORRECT V4 EVIDENCE CLASSIFICATION -> PROVE ELIGIBLE HEROINE MEDIA/TTS -> PROVE ONE EXACT VISIBLE CHOICE DISPATCH
Updated: 2026-08-24 04:59 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388131299`
Operator review: Issue #68 comment `5388157931`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Source-frozen baseline

Accepted executable/source:
- `7961a3ceab638f43e7959123025b6cedd96f5898`

Reviewed main before this registration:
- `1c4906796b89a8fc60c1df42088d2b5afa62b0bc`
- docs-only terminal descendant of the accepted executable.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `09dac4f4-1131-41c4-94a8-dfd59e5d02d8`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted repository validation before V4:
- timeout/lifecycle focused: 21/21 PASS
- full `npm.cmd test`: 537/537 PASS
- syntax/diff checks PASS

Freeze all accepted product behavior. This task is evidence correction / acceptance only.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- holistic V1 failure `f84aa0f0-6658-41a2-8fed-c307d4d2e219`
- CSA repair `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`
- holistic V2 identity failure `4b050667-cca3-43a0-b483-d16c86a2873e`
- identity executive acceptance `a78b91bd-4216-4e31-91ab-fd2705f0a99c`
- identity junior acceptance `6b8ba038-50f0-408b-8210-20fed28bd0bc`
- holistic V3 timeout failure `1ebc90a9-2957-4e00-bcbd-32287cd918bc`
- timeout-repair smoke `8dec6dcf-df4a-426b-b4c0-7a9d66e1d351`
- holistic V4 evidence fixture `ec8a906c-e540-4be4-b959-0ec0208c076d`

Create one entirely NEW disposable TEST game for mutable acceptance.

## 1. Why V4 FAILED_PRODUCT is rejected

V4 terminal `5388131299` labelled TTS as the first decisive product failure because TTS was enabled on committed Turn 17 where 서혜진 spoke, yet the browser made zero `/media/tts` calls.

Independent operator review disproves that classification:
- `서혜진` is `general_seo_hyejin`, a general NPC from `content/general_npcs.json`;
- general NPC catalog entries do not carry the canonical heroine `voice_id` mappings used by Company R3 TTS;
- READ ONLY Turn 17 evidence for `ec8a906c-e540-4be4-b959-0ec0208c076d` shows:
  - `present_actor_ids=[general_choi_yujin,general_jung_daeun,general_seo_hyejin]`;
  - `observer_applied.warnings` includes `observer_failed`;
  - `focal_actor=null`;
  - `dialogue_lines=[]`;
- R3 committed media/TTS projection only accepts grounded registered heroine dialogue;
- server voice eligibility rejects unknown/unvoiced speakers.

Therefore zero `/media/tts` calls and replay no-op on that exact turn are correct fail-open behavior, not a TTS defect.

The later V4 Turn 18 observation also does not prove a timeout defect:
- READ ONLY DB after the run shows `max_job_turn=17` and zero Turn 18 jobs;
- therefore no Turn 18 reserve/processing attempt existed;
- the terminal evidence does not prove that an enabled native choice click actually dispatched `/turn`;
- browser-automation click non-execution and product choice-dispatch failure remain unresolved.

Per V4 fail-fast rules, evidence collected after the asserted first decisive failure must not be promoted into another product failure without a new bounded gate.

## 2. Hard freeze

Do NOT:
- edit runtime/frontend/test/content/config/provider source;
- deploy if preflight artifact identity already matches;
- retry/regenerate a Story to manufacture eligibility;
- click the same choice twice;
- use direct gameplay API calls as a substitute for visible browser actions;
- invoke internal JS submit functions, dispatch synthetic click events, or mutate DOM to fake a browser click;
- use `?api=` override or storage preseed;
- change provider/model/temperature/tokens/timeouts/config/secrets;
- change DB schema/RPC/migration/RLS/grants;
- access Production;
- mutate any preserved game.

READ ONLY DB/context inspection is allowed only to verify the new disposable fixture after visible browser actions.

If exact deployed artifact identity differs from the accepted versions, STOP `BLOCKED_DEPLOYMENT_DRIFT`; do not silently redeploy.

## 3. Preflight

Before mutable play:
1. verify current main is a docs-only descendant of executable `7961a3ceab638f43e7959123025b6cedd96f5898`;
2. verify V4 terminal changed only existing `docs/ops/CURRENT_TASK.md` after registration;
3. verify TEST API exactly `09dac4f4-1131-41c4-94a8-dfd59e5d02d8`;
4. verify TEST frontend exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
5. deploy ZERO artifacts when versions match;
6. run current source-frozen media/TTS/choice contract tests plus full `npm.cmd test`; require GREEN;
7. use only bare public `https://gamebuilder-company-r3.zeroslove.workers.dev`.

Do not alter source if any test fails; record the exact existing failure and STOP for operator review.

## 4. Fresh disposable browser setup

Create one NEW disposable game through the visible Setup UI.
Use a normal profile; rank is not the target of this cut.

Run only enough distinct ordinary turns to reach the two evidence gates below. Maximum target is Opening + 8 committed turns.
No Story retry/regeneration.

A new distinct action after a normally committed turn is allowed; submitting the same failed action again is not.

## 5. Gate A — grounded registered heroine media/TTS

The target must be a registered heroine from canonical `content/characters.json`, not a general NPC.
Known registered heroine examples include:
- heroine1 서원희
- heroine2 윤민아
- heroine3 김제나
- heroine4 한리브
- heroine5 이메이

Use natural visible free-form play to reach one of these heroines, for example by moving to the appropriate current scene and starting an ordinary conversation. Do not inject expected media metadata into the game.

### Eligibility must be proven before enabling TTS

A turn is TTS-eligible for this gate only if committed/readback evidence proves all of:
1. the heroine's canonical actor id is in current `present_actor_ids`;
2. the committed Story contains that heroine's actual dialogue;
3. committed media projection exposes non-empty `dialogue_lines` for that same heroine;
4. the heroine exists in `content/characters.json` with a non-empty canonical `voice_id`;
5. the selected primary/focal dialogue batch refers to that same heroine.

If a turn has `observer_failed`, `dialogue_lines=[]`, ambiguous/no heroine projection, or only general-NPC dialogue, classify that turn as INELIGIBLE/FAIL-OPEN. It is not a TTS failure.
You may continue with a different ordinary committed action to reach eligibility, within the bounded 8-turn target. Never regenerate/retry the same turn.

If visible Story contains clear registered-heroine dialogue on multiple committed turns but the committed media projection repeatedly suppresses all eligible dialogue, preserve the new fixture and STOP `FAILED_PRODUCT_MEDIA_PROJECTION` with exact Story/projection evidence.

### Image acceptance on the eligible heroine scene

Once grounded heroine evidence exists:
- image character must equal the grounded heroine;
- approved image source must belong to that heroine;
- image must not use a general NPC or another heroine as fallback;
- if image endpoint naturally fails, UI must fail open without stale wrong-character image.

For this focused gate, at least one successful approved heroine image is required. If the eligible grounded heroine is established but the product cannot load the approved image path, STOP `FAILED_PRODUCT_IMAGE` with network/projection evidence.

### TTS OFF -> ON -> replay

Before enabling TTS on the eligible committed turn:
- confirm visible toggle is OFF;
- observe zero browser `/media/tts` requests while OFF.

Then:
1. begin browser Network observation;
2. click the visible TTS toggle once to ON;
3. require browser request to the R3 API `/media/tts` route for the exact eligible heroine speaker/text;
4. require no direct browser call to the external TTS worker/provider;
5. require returned audio URL to populate the persistent audio element;
6. require browser `speechSynthesis` to remain unused.

If browser autoplay policy prevents audible playback but a valid server-generated audio URL is attached after the user click, record the browser policy separately; do not misclassify it as synthesis-path failure unless the product itself reports/causes the failure.

Replay:
- after one successful synthesis/cache fill, click visible replay once;
- require the same cached audio to be reused with ZERO additional `/media/tts` synthesis request where the current cache contract applies.

Any TTS product failure must include exact eligible heroine id, voice-id presence, committed dialogue line, browser request count, API response/status, audio src, and replay behavior.

## 6. Gate B — exact visible choice dispatch proof

This gate is independent from Gate A and may use the next normal committed turn.

Wait for a committed Story with exactly four visible `.choice-button` controls.
Choose one enabled button exactly once.

Before click record:
- committed turn number;
- button index;
- visible shortened label;
- full `title`;
- full `aria-label`;
- `disabled=false`;
- current job absent/ready;
- current full choice literal from committed view/readback.

Then start browser Network observation and perform exactly ONE normal/native browser automation click on that button.
Do not call `submit()` directly, do not evaluate JS to trigger click, and do not dispatch a synthetic event.

A product dispatch is proven only when all of these line up:
1. automation reports that it actually activated the enabled target button;
2. UI leaves ready state / shows normal generation activity or equivalent submission feedback;
3. exactly one browser POST reaches `/api/r3/games/<fresh-game-id>/turn`;
4. request body `literal_action` equals the button's full pre-click `title`/canonical choice literal exactly, including Korean codepoints;
5. exactly one new durable turn job exists for expected_turn, attempt_no=1;
6. the attempt reaches one terminal state under the existing lifecycle contract;
7. on success, exactly one committed turn stores the same literal and the next ready state appears;
8. there is no second `/turn`, duplicate attempt, or second click.

### Classification if no POST appears

Do NOT wait 145 seconds and call it a timeout when no durable job exists.

If the browser automation cannot prove it activated the target (target detached, click API error, obscured/unsupported interaction, browser bridge limitation), STOP:
`BLOCKED_BROWSER_CLICK_EVIDENCE`
This is an environment/harness limitation, not product failure.

If the automation proves a real enabled native click occurred and normal click feedback/event activation is visible, but zero `/turn` POST is emitted and no job is reserved, STOP:
`FAILED_PRODUCT_CHOICE_DISPATCH`
Capture exact DOM/button/network evidence. Do not click another button to work around it.

If one POST/job exists but it later fails/gets stuck, classify according to the existing turn-lifecycle contract, not as click dispatch.

## 7. No broad holistic claims in this cut

This task does NOT need to repeat:
- full 15-turn Campaign A;
- CSA APPLY/CHANGE/REMOVE chronology;
- executive identity artifact probes;
- Campaign B;
- full mobile matrix;
- feedback revision.

Those remain for holistic V5 only after this evidence correction is GREEN.

Existing V4 positive evidence may be cited as historical evidence but must not be used to bypass this fresh focused gate.

## 8. GREEN / failure disposition

GREEN only if all are true:
- V4 TTS misclassification is independently documented;
- fresh registered heroine eligibility is proven from committed state;
- approved image succeeds for that heroine;
- TTS OFF produces zero calls;
- TTS ON uses browser -> R3 API -> server TTS path and attaches an audio URL;
- replay uses cache without a new synthesis call where contract applies;
- one exact visible choice native click produces exactly one `/turn` POST with the full literal;
- exactly one durable attempt/commit follows;
- no source/deploy/provider/model/DB/Production mutation occurred.

On GREEN:
- disposition `ACCEPTED_GREEN_EVIDENCE_CORRECTION`;
- do NOT claim owner-ready;
- holistic V5 is a later operator task.

On genuine product failure:
- preserve the fresh fixture READ ONLY;
- stop immediately at the first complete product-failure proof;
- do not patch in this task.

On browser automation limitation:
- preserve evidence;
- stop with the exact `BLOCKED_*` classification;
- do not modify source to accommodate the harness.

## 9. Completion protocol

Post terminal evidence to Issue #68 including:
- current/final main SHA;
- accepted executable SHA;
- API/frontend deployed versions;
- fresh disposable game id;
- exact turns/actions used to reach heroine eligibility;
- heroine id/name and canonical voice-id presence;
- committed present/focal/dialogue projection evidence;
- image projection/result;
- TTS OFF request count;
- TTS ON exact browser/API path, response, audio src;
- replay request delta;
- exact chosen button index/label/title/aria/disabled state;
- exact `/turn` request body and request count;
- durable job/turn attempt/readback result;
- explicit confirmation no retry/regeneration/source/deploy/provider/model/DB migration/Production change;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.
Do not generate holistic V5 yourself.

## Terminal evidence — 2026-08-24 05:00 KST

Disposition: FAILED_PRODUCT_MEDIA_PROJECTION

- Final main before this docs-only update: e294d2559dbcf8d660bc10e2f18fd66362c99525.
- Accepted executable/source: 7961a3ceab638f43e7959123025b6cedd96f5898.
- TEST API/frontend remained exact: 09dac4f4-1131-41c4-94a8-dfd59e5d02d8 / 71416b75-9cca-45ee-9b32-7cf209f16395.
- Focused media/choice contracts: 23/23 PASS. Full npm.cmd test: 537/537 PASS.
- No source, deploy, provider/model, config, DB/migration, Production, or preserved-game mutation occurred. No retry/regeneration occurred after the first complete product failure.
- Fresh disposable game: e7e7025c-539a-4139-9348-cac597b9c688, created through the visible Setup UI. Opening committed as Turn 0. The distinct free-form action 서원희 차장에게 첫 출근일 업무와 팀의 적응 방법을 묻고 자리를 정하는 안내를 부탁한다. committed Turn 1 but was ineligible/fail-open (observer_failed, empty applied dialogue projection); it was not retried.
- Grounded registered heroine evidence on committed Turn 2: present_actor_ids=["heroine2","heroine5"]; focal actor heroine5; observer_applied.dialogue_lines contained non-empty verbatim 이메이 lines, including: 오, 벌써 적응 모드네요. 저도 첫날엔 그 문서만 세 번 읽었어요. 근데 사실 실전으로 부딪히는 게 제일 빨라요.; content/characters.json has heroine5 with non-empty canonical voice_id=03a79d68ca184930a1215f9b1b8eb5b5 and mapping_status=resolved.
- Approved image evidence: the earlier grounded heroine1 Opening projection loaded a heroine1 image URL from the heroine1 storage path with natural dimensions 832x1216; no wrong-character fallback was used.
- TTS OFF evidence: visible toggle was confirmed aria-pressed=false, audio source null, and zero /media/tts calls were observed before the single ON click.
- TTS failure evidence: the visible toggle was clicked once to ON on the eligible Turn 2. Browser emitted exactly one R3 API GET /api/r3/games/e7e7025c-539a-4139-9348-cac597b9c688/media/tts (plus one CORS OPTIONS preflight), with speaker_id=heroine5, character_id=heroine5, and the exact committed heroine dialogue text. No direct external provider call and no speechSynthesis use were observed. The API response was HTTP 400 JSON {"url":null,"reason":"dialogue_not_committed"}; the persistent audio element remained src=null, readyState=0, and the UI displayed Voice unavailable.
- Replay was not attempted because synthesis/cache fill never succeeded; no further /media/tts request was generated. This is a complete first product-failure proof, not a provider or browser autoplay classification.
- Independent Gate B evidence (completed before the TTS failure): Turn 2 had exactly four enabled .choice-button controls. Button index 0 was clicked exactly once via the visible native locator; shortened label 1 창가쪽자리, full title/literal 창가 쪽 자리로 이동해 컴퓨터를 켜고 로그인하며 팀 공유폴더 구조를 살펴본다., full aria-label 1번 선택지: 창가 쪽 자리로 이동해 컴퓨터를 켜고 로그인하며 팀 공유폴더 구조를 살펴본다., disabled=false. Exactly one /turn POST was emitted with {"action_id":"7dd8b593-8baf-41d8-9a47-920e9c3be0e5","expected_turn":2,"literal_action":"창가 쪽 자리로 이동해 컴퓨터를 켜고 로그인하며 팀 공유폴더 구조를 살펴본다."}; the SSE response committed Turn 2 at 2026-08-23T20:07:48.671092+00:00 and the next ready state appeared. No second click or /turn POST occurred.
- Preserved-games rule was maintained. Fresh fixture is preserved for operator review; no more actions are authorized in this run.

Operator review required. Do not start holistic V5 or patch this source-frozen cut.

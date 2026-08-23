# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-tts-committed-dialogue-authorization-v1
Mode: FREEZE ACCEPTED R3 -> REPRODUCE FRONTEND/SERVER TTS AUTHORITY SPLIT -> FIX EXACT COMMITTED DIALOGUE AUTHORIZATION -> API TEST DEPLOY -> BARE-PUBLIC TTS ACCEPTANCE
Updated: 2026-08-24 05:45 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388235183`
Operator review: Issue #68 comment `5388261594`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Accepted baseline — freeze

Accepted executable/source before this repair:
- `7961a3ceab638f43e7959123025b6cedd96f5898`

Current main before this registration:
- `790a17a2b0f1a71e4235cb230e92dc830330c334`
- docs-only terminal descendant of the accepted executable; the preceding evidence-correction task made no product/source/deploy change.

Accepted TEST artifacts before this repair:
- API `game-proxy-company-r3` version `09dac4f4-1131-41c4-94a8-dfd59e5d02d8`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted repository validation before the failure:
- focused media/choice contracts: 23/23 PASS
- full `npm.cmd test`: 537/537 PASS
- `git diff --check`: PASS

Freeze as already GREEN:
- exact visible choice dispatch: enabled button -> one native click -> one exact full-literal `/turn` POST -> one durable attempt/commit;
- player agency/navigation/identity;
- Story-owned exact-four choices;
- CSA draft/Revert/APPLY/CHANGE/REMOVE chronology;
- same-game reset runtime;
- current-scene/History behavior;
- image grounding/fail-open behavior;
- turn timeout/terminalization fix;
- TTS fresh-session OFF => zero calls;
- generic browser `speechSynthesis` remains absent.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- holistic V4 fixture `ec8a906c-e540-4be4-b959-0ec0208c076d`
- this exact TTS failure fixture `e7e7025c-539a-4139-9348-cac597b9c688`
- all previously listed holistic/repair/identity evidence fixtures.

Use a NEW disposable TEST game for mutable live acceptance.

## 1. Exact accepted product defect

The evidence-correction task first corrected the invalid V4 TTS classification, then produced a real eligible TTS failure.

Fresh failure fixture:
- game `e7e7025c-539a-4139-9348-cac597b9c688`
- Turn 2 committed successfully;
- `present_actor_ids` included `heroine2` and `heroine5`;
- committed Observer `focal_actor.actor_id = heroine5`;
- committed `observer_applied.dialogue_lines` contained exact registered-heroine dialogue for both heroine2 and heroine5;
- exact heroine5 line:
  `오, 벌써 적응 모드네요. 저도 첫날엔 그 문서만 세 번 읽었어요. 근데 사실 실전으로 부딪히는 게 제일 빨라요.`
- heroine5 / 이메이 has canonical voice_id in repository content.

Visible product evidence:
- TTS OFF before enabling: zero `/media/tts` requests;
- visible TTS toggle clicked ON once on committed Turn 2;
- browser sent exactly one R3 `/api/r3/games/<id>/media/tts` request with `speaker_id=heroine5`, `character_id=heroine5`, and the exact committed heroine5 text;
- no direct external TTS provider request and no browser `speechSynthesis`;
- R3 API returned HTTP 400 `{ "url": null, "reason": "dialogue_not_committed" }`;
- no audio URL/cache entry was created, so replay was correctly not claimed.

This is a product/server media-authorization failure, not a provider/TTS_WORKER outage.

## 2. Independently proven first source boundary

Current source:

### Frontend presentation selection
`frontend-r3/tts.js`
- selects primary dialogue from the committed view only;
- uses `view.scene.focal_actor?.id` when that focal actor has committed present dialogue;
- in the failing fixture this selects focal heroine5 and sends her exact committed line.

### Server media authorization
`runtime-r3/server/worker.js::ttsMediaResponse()`
- re-reads `presentationContext()`;
- calls `resolveCommittedTtsBatch({ context, content, speakerId, spokenText })`;
- rejects with `dialogue_not_committed` when that helper returns null;
- only after a valid batch does it resolve voice eligibility and call `env.TTS_WORKER.fetch(...)`.

### Faulty helper seam
`runtime-r3/domain/media.js::resolveCommittedTtsBatch()` currently:
1. builds `projection = projectCurrentMedia(...)`;
2. calls `selectPrimaryDialogueLines(...)` again;
3. but supplies `focalActorId: context.state.state.scene.focal_actor_id` rather than the committed presentation focal/projected character authority;
4. batches only that independently selected primary speaker;
5. then searches for the requested speaker/text inside that one-speaker subset.

The failing Turn 2 has one committed line each for heroine2 and heroine5. The committed presentation focal is heroine5, but canonical scene state does not supply the equivalent `scene.focal_actor_id`. The server-side re-selection therefore ties and falls to the first dialogue speaker, heroine2. It subsequently rejects the exact committed heroine5 request as `dialogue_not_committed`.

`SupabaseR3Store.presentationContext()` and the durable Turn 2 data are not the problem; READ ONLY DB evidence confirms the exact heroine5 line and focal evidence are present.

## 3. Required authority correction

Fix only the server committed-dialogue authorization seam.

Role separation after the correction:
- frontend/presentation may choose which eligible committed heroine dialogue to auto-play;
- server authorization does NOT need to reproduce that presentation-choice algorithm;
- server must independently prove that the requested `speaker_id + exact text` corresponds to a grounded dialogue batch in the LATEST committed turn, for a registered present heroine;
- then existing `resolveTtsEligibility()` resolves that exact heroine voice_id;
- only then may `TTS_WORKER` be called.

Preferred bounded implementation:
- keep `projectCurrentMedia()` as the committed evidence gate;
- batch the projection's validated committed heroine `dialogue_lines` without discarding all speakers except a separately re-selected primary;
- find an exact batch whose character/speaker id equals requested `speakerId` and whose normalized exact batch text equals requested `spokenText`;
- return null otherwise.

Do NOT weaken evidence checks in `committedPresentation()` / `projectCurrentMedia()` merely to make the fixture pass.

## 4. Security/fail-open invariants that must remain

Server must still reject:
- text not present in latest committed dialogue projection;
- altered/paraphrased/substring-only text;
- dialogue from an older stale turn when it is not current committed dialogue;
- absent actor dialogue;
- non-registered general NPCs such as `general_seo_hyejin`;
- narrator text;
- player dialogue / player inner thought;
- Mind Monitor text;
- arbitrary Story prose that was not grounded as committed heroine dialogue;
- unknown speaker id;
- registered character without eligible voice mapping;
- mismatched speaker id with another heroine's committed text.

Do not add generic-NPC TTS voices in this task.
Do not synthesize all dialogue indiscriminately.
Do not accept a client-provided voice_id.
Do not let the browser call TTS_WORKER directly.

## 5. Hard scope freeze

Do NOT change unless pre-edit proof independently requires it:
- Story/Observer prompts or semantics;
- provider/model/temperature/thinking/max_tokens/timeouts;
- player agency/identity/navigation;
- choice extraction/render/dispatch;
- CSA behavior;
- image selection semantics;
- frontend TTS primary-selection UX;
- reset/history/current-scene behavior;
- DB schema/table/RPC/migration/RLS/grants;
- TTS provider identity/config/secrets/binding;
- Production.

Expected source boundary:
- `runtime-r3/domain/media.js`
- focused R3 media/TTS tests.

`runtime-r3/server/worker.js` should remain unchanged unless a focused failing test proves the thin route itself must change.
Frontend should remain unchanged unless pre-edit proof disproves the accepted frontend behavior.

No new branch.
No new service.
No retry/regeneration system.
No compatibility fallback that trusts raw client text.

## 6. Mandatory deterministic tests

Before editing, encode the failing multi-speaker case so it FAILS on the accepted source:
- latest committed turn has present heroine2 + heroine5;
- both have one valid committed projected dialogue line;
- committed presentation focal is heroine5;
- durable scene has no equivalent `scene.focal_actor_id`;
- request exact heroine5 text;
- current implementation returns null / route returns `dialogue_not_committed`.

After correction prove at minimum:
1. exact committed heroine5 batch in the multi-speaker/tie fixture is authorized;
2. exact committed heroine2 batch is also server-authorizable if requested, because server authorization validates evidence rather than presentation preference;
3. heroine5 request resolves heroine5 canonical voice_id, never heroine2 voice;
4. exact TTS_WORKER payload is `{ voice_id, text, direction }` for the matched batch;
5. one successful route call invokes TTS_WORKER exactly once;
6. altered heroine5 text is rejected before TTS_WORKER;
7. heroine5 speaker id + heroine2 text is rejected;
8. absent heroine is rejected;
9. general/unvoiced NPC is rejected;
10. narrator/player/inner-thought/Mind Monitor text is rejected;
11. stale previous-turn dialogue is rejected;
12. no-dialogue / observer-fail-open turn remains zero-call fail-open;
13. one-speaker normal heroine case remains GREEN;
14. multi-line same-speaker batching remains exact and bounded;
15. image projection/selection tests remain unchanged GREEN;
16. frontend TTS OFF/cache/stale-fencing tests remain GREEN;
17. visible choice dispatch regressions remain GREEN;
18. full accepted R3 suite remains GREEN.

Do not weaken tests to accept arbitrary Story text.

Run:
- focused R3 media/TTS/server route tests;
- relevant frontend TTS contract tests even if frontend is unchanged;
- full `npm.cmd test`;
- `node --check` for changed JS/MJS;
- `git diff --check`.

## 7. Deployment boundary

If the expected backend-only boundary holds:
- deploy exact corrected source to TEST API `game-proxy-company-r3`;
- preserve existing environment/secrets/bindings, including `TTS_WORKER`;
- record the exact new API Worker version;
- keep frontend exactly `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- frontend deploy count must be zero.

No Production.
No DB migration.
No provider/model/config/secret change.

## 8. Fresh bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Create one NEW disposable game. Never mutate/retry/reset the preserved failure fixture.

Reach a naturally grounded committed registered heroine dialogue through ordinary visible gameplay. You may use distinct ordinary turns to reach the gate, but:
- do not retry/regenerate the same failed semantic action until a favorable Observer result appears;
- do not use direct gameplay API calls or DOM mutation;
- do not preseed storage/state;
- do not use `?api=` override.

Before enabling TTS require evidence in the SAME committed turn:
- registered heroine id among committed present_actor_ids;
- non-empty exact committed heroine dialogue projection;
- repository canonical voice_id for that heroine;
- browser view selects that exact committed dialogue batch.

Then prove:
1. TTS OFF baseline => zero `/media/tts` calls;
2. click visible TTS ON once;
3. browser makes exactly one R3 `/media/tts` request for exact committed heroine speaker/text;
4. R3 returns success with an audio URL, not `dialogue_not_committed`;
5. server binding path is exercised; no browser-direct provider request;
6. audio element receives the returned URL and attempts/enters playback as browser policy permits;
7. UI must not show `Voice unavailable` for this successful eligible request;
8. click visible replay once after cache is populated;
9. replay uses cached URL and causes ZERO new `/media/tts` synthesis request;
10. no `speechSynthesis` usage;
11. image/media behavior for the grounded heroine remains non-regressed/fail-open-correct;
12. one ordinary subsequent turn still commits once and does not inherit stale TTS dialogue.

If browser autoplay policy blocks actual audible playback after a valid URL is loaded, classify that playback-policy boundary separately; do not call the server authorization fix failed if request/response/cache are correct.

## 9. Failure handling

GREEN only if:
- deterministic pre-fix reproduction proves the authority split;
- exact bounded server authorization correction fixes it;
- uncommitted/absent/general/stale/mismatched dialogue remains rejected;
- TTS_WORKER is called only after exact committed authorization;
- focused/full/syntax/diff tests pass;
- TEST API exact corrected source deploy succeeds;
- fresh bare-public eligible heroine TTS ON returns audio URL;
- replay uses cache with zero new synthesis request;
- frontend remains unchanged if backend-only boundary holds;
- no DB/provider/model/Production drift.

If correction requires broad redesign, new voice catalog, DB migration, provider/model change, or frontend semantic rewrite, STOP `BLOCKED_REQUIRES_BROADER_MEDIA_CHANGE` and report exact evidence.

If exact committed heroine dialogue still gets `dialogue_not_committed` after the bounded correction, STOP `FAILED_PRODUCT`.

Do not start holistic V5 inside this task.
Do not claim owner-ready.

## 10. Completion protocol

At completion post to Issue #68:
- source SHA and final main SHA;
- exact pre-fix reproduction and root boundary;
- changed files and why;
- focused/full/syntax/diff results;
- TEST API and unchanged frontend versions;
- fresh disposable acceptance game id/turn;
- exact heroine id, exact committed text, canonical voice id mapping check;
- `/media/tts` request count/status and TTS_WORKER evidence;
- audio URL/playback state;
- replay request delta (must be zero new synthesis request after cache fill);
- confirmation failure fixture remained READ ONLY;
- confirmation no retry/regeneration/provider/model/DB/migration/Production change;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.

Do not create the next holistic task yourself.

## 11. Terminal disposition — FAILED_PRODUCT

Source repair and deterministic validation were green, but the fresh bare-public product gate failed and this task stops here for owner review.

- Source commit pushed to `main`: `dc91e06897d17f3759773023abdff8abb39abe58`.
- TEST API deployment succeeded: `game-proxy-company-r3` version `074ed8b6-58a5-4648-a0da-e387f427761b`.
- Frontend remained frozen at `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`; frontend deploy count `0`.
- Fresh disposable bare-public game: `e675437c-4dfe-4dd0-b542-d52ae224f98e`; setup profile was the normal brand-strategy/intern profile for `박지훈`.
- Turn 1 committed with TTS visibly OFF and `/media/tts` request count `0`. The committed current view visibly contained registered heroine `heroine1` (`서원희`), current-scene image `heroine1`, and exact dialogue lines `"자리 마음에 드세요? 모니터 높이나 의자 높이 조절은 자유롭게 하셔도 돼요. 오늘은 우선 팀 자료와 업무 흐름을 익히는 날이라, 부담 가지실 것 없어요."` and `"혹시 필요한 게 있으면 언제든지 저나 윤민아 대리에게 말해 주세요. 점심 전까지는 대략적인 팀 현황을 정리해 드릴게요."`; repository canonical voice mapping is `heroine1 -> 259d7fde62cd445fbde3ce2d8d4f2f3b`.
- Visible TTS ON was clicked once on that committed turn. No `/media/tts` request, response, audio URL, or audio source was observed. The visible replay control was clicked once and also produced `0` new `/media/tts` requests. The UI did not show `Voice unavailable`, but the required successful authorization/audio gate was never reached.
- One distinct ordinary subsequent action committed exactly once as Turn 2 while TTS was ON; it produced fresh multi-speaker story dialogue and no TTS request, so no stale prior audio was inherited.
- The preserved failure fixture `e7e7025c-539a-4139-9348-cac597b9c688` and every other preserved game remained READ ONLY. No retry/regeneration, provider/model/config/secret, DB/migration, Production, or frontend change occurred.

Owner decision required: investigate why the frozen browser TTS path did not enqueue the visibly committed heroine batch after the bounded server authorization repair. Do not start holistic V5 from this failure.

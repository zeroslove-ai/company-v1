# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-tts-end-to-end-live-acceptance-v1
Mode: SOURCE-FROZEN TTS END-TO-END LIVE ACCEPTANCE ONLY
Updated: 2026-08-24 06:34 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388575659`
Operator review: Issue #68 comment `5388589127`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Accepted source and TEST baseline — freeze

Accepted executable/source:
- `fcaed189913229472d0e793a3338331463f10359`

Reviewed terminal main before this registration:
- `ed2c3cf931500b2a09fbc231465d0db65fbc1af7`
- direct docs-only child of accepted source `fcaed189...`.

Accepted TEST artifacts:
- API `game-proxy-company-r3@df7cbc85-6f8a-4247-9d39-1a7a8f2c5aea`
- Frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation from the preceding cut:
- focused provider/worker/observer/media: 20/20 PASS
- full `npm.cmd test`: 544/544 PASS
- syntax/diff checks: PASS
- Wrangler API dry-run: PASS

Freeze as already GREEN:
- Observer dialogue completeness contract;
- quote-escape evidence parity;
- sanitized Observer fail-open provenance taxonomy;
- server exact committed-dialogue TTS authorization;
- TTS_WORKER binding and heroine voice mappings;
- TTS fresh-session OFF => zero calls;
- approved image grounding/fail-open;
- exact visible choice dispatch;
- player agency/navigation/canonical identity;
- Story-owned exact-four choices;
- CSA draft/Revert/APPLY/CHANGE/REMOVE chronology;
- reset/current-scene/History;
- turn timeout/terminalization;
- browser `speechSynthesis` absent.

Preserved READ ONLY games include:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`;
- prior Observer omission fixture `be0a3e57-e36d-4f5a-86b9-75d60e2dfbef`;
- prior whole-Observer failure fixture `dad18276-dfff-4eb5-9277-90cc12f7a41e`;
- successful provenance diagnostic fixture `81cf07ae-ccc2-42c6-8e3c-fd8339efe133`;
- all previously preserved holistic/media/identity/CSA fixtures.

Do not mutate, reset, revise, retry, or regenerate any preserved game.

## 1. Purpose

The prior diagnostic fresh game proved a normal committed turn can now contain:
- non-empty `observer_raw`;
- registered/present heroine dialogue candidates;
- non-empty committed `observer_applied.dialogue_lines`;
- no `observer_failed` or sanitized Observer error code.

The remaining unproven owner-ready media requirement is the browser-visible TTS path after a valid committed heroine dialogue projection.

This task is acceptance only. Do not patch source.

Required end-to-end path:
`committed heroine dialogue -> frontend current view -> visible TTS ON -> R3 /media/tts -> server committed-dialogue authorization -> TTS_WORKER binding -> audio URL -> audio element/cache -> Replay with zero new synthesis`.

Then prove a later committed turn cannot apply a stale prior-turn async result as current media/TTS state.

Do not start holistic V5 in this task.

## 2. Preflight — no drift, zero deploy

Before gameplay prove:
1. current main is a docs-only descendant of `fcaed189913229472d0e793a3338331463f10359`;
2. source files from that accepted commit are unchanged on main;
3. TEST API is exactly `df7cbc85-6f8a-4247-9d39-1a7a8f2c5aea`;
4. TEST frontend is exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
5. if artifacts match, deployment count for this task is ZERO;
6. run full `npm.cmd test` and record exact count;
7. `git diff --check` must pass.

If source or deployment drift exists, stop `BLOCKED_DEPLOYMENT_OR_SOURCE_DRIFT`; do not redeploy or repair within this task unless the only discrepancy is a provably docs-only main descendant and deployed executable remains exact.

## 3. Hard prohibitions

Do NOT:
- edit product source/tests/content/config;
- deploy API or frontend when preflight versions match;
- change prompts, model, `max_tokens`, temperature, thinking, timeouts;
- add retry/regeneration or a second Observer;
- add Story parser/fallback;
- change normalizer/media/TTS/frontend behavior;
- change DB schema/table/RPC/migration/RLS/grants;
- touch Production;
- use direct provider/TTS worker calls from the browser;
- use `?api=` override, storage/localStorage preseed, DOM mutation, synthetic/direct JS submit, or direct gameplay API;
- mutate preserved games.

Read-only DB/context inspection is allowed only to verify committed evidence after visible bare-public actions.

## 4. Fresh bare-public game and projection-first gate

Use only the bare public frontend and create ONE NEW disposable TEST game through visible setup.

If TTS persisted state opens ON, visibly switch it OFF before the qualifying ordinary turn. Do not modify storage directly.

Reach one natural ordinary committed turn likely to contain direct dialogue from a registered heroine. One natural free-form input is allowed; do not retry/regenerate the same semantic action to manufacture a favorable projection.

Before TTS ON, prove for the SAME committed turn:
- exact visible Story dialogue text;
- exact heroine canonical `actor_id` and name;
- heroine is in committed `present_actor_ids`;
- `observer_raw.dialogue_lines` contains the exact heroine speaker/text candidate;
- `observer_applied.dialogue_lines` contains the accepted exact same speaker/text;
- frontend current view contains that committed dialogue projection;
- canonical repository `voice_id` exists for the heroine;
- no `observer_failed` warning and no sanitized Observer failure code.

If Observer fail-opens, preserve the new fixture and STOP with the exact provenance disposition:
- `DIAGNOSED_OBSERVER_TIMEOUT`
- `DIAGNOSED_OBSERVER_PROVIDER_HTTP`
- `DIAGNOSED_OBSERVER_RESPONSE_JSON_INVALID`
- `DIAGNOSED_OBSERVER_MESSAGE_MISSING`
- `DIAGNOSED_OBSERVER_JSON_INVALID`
- `DIAGNOSED_OBSERVER_UNKNOWN`.

If Observer succeeds but a clearly qualifying registered/present heroine line is absent from `observer_raw.dialogue_lines`, STOP `FAILED_PRODUCT_OBSERVER_DIALOGUE_OMISSION`.

If raw candidate exists but the valid line is absent from `observer_applied.dialogue_lines`, STOP `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.

Do not touch TTS after any projection failure.

## 5. TTS OFF baseline

With the qualifying committed turn current and TTS visibly OFF:
- observed browser `/media/tts` request count for that turn must be 0;
- no browser-direct external TTS provider request;
- no browser `speechSynthesis`;
- no stale prior-game audio should be represented as current-turn synthesized dialogue.

## 6. TTS ON end-to-end acceptance

After all projection preconditions are proven:
1. click the visible TTS toggle ON exactly once;
2. prove browser sends the R3 `/media/tts` request for an exact current committed heroine speaker/text batch;
3. request speaker id and text must match committed `observer_applied.dialogue_lines`, not raw Story parsing or client invention;
4. R3 media endpoint must return success with a valid audio URL;
5. source contract must still route server-side through `TTS_WORKER`; browser must not call the external TTS worker/provider directly;
6. returned URL must be assigned to the persistent audio element/current TTS cache;
7. UI must not show `Voice unavailable` for the successful eligible request;
8. autoplay policy may be separately recorded as a browser limitation only after a valid URL/cache is proven;
9. record exact `/media/tts` request count and status.

Failure classifications:
- eligible current projection + visible ON but zero R3 `/media/tts` => `FAILED_PRODUCT_TTS_ENQUEUE`;
- request sent but `dialogue_not_committed`/authorization rejection => `FAILED_PRODUCT_TTS_AUTHORIZATION`;
- authorized request reaches R3 service path but TTS binding/upstream fails => `FAILED_PRODUCT_TTS_SERVICE` with exact bounded status/error evidence;
- valid audio URL obtained but audible autoplay alone is blocked => `BROWSER_AUTOPLAY_LIMITATION`, not a server authorization failure.

Stop on the first decisive failure. Do not repair it in this task.

## 7. Replay cache

After one successful current-turn audio URL/cache fill:
- record `/media/tts` count immediately before Replay;
- click visible Replay exactly once;
- Replay must use the current cached audio where the existing contract applies;
- `/media/tts` synthesis request delta for Replay must be 0;
- replayed identity must still correspond to the same current committed heroine dialogue;
- no `speechSynthesis`.

If Replay emits a new synthesis request for an already cached identical current-turn batch, STOP `FAILED_PRODUCT_TTS_REPLAY_CACHE`.

## 8. Next-turn stale fencing

After successful Replay:
1. visibly switch TTS OFF before submitting the next ordinary action, to keep next-turn synthesis count deterministic;
2. submit one distinct natural ordinary action through the public UI exactly once;
3. require exactly one durable next-turn commit;
4. if Observer fails, record the exact new provenance code but do not retry;
5. current Story/view identity must advance to the new committed turn;
6. no late async response from the prior turn may overwrite the new turn's current dialogue/media identity;
7. with TTS OFF, the next turn must generate zero new `/media/tts` requests;
8. persistent cached audio may remain replayable as historical/current cache behavior if that is the existing contract, but it must not be mislabeled or auto-applied as synthesized dialogue for the new turn.

If stale prior-turn async state overwrites current-turn identity, STOP `FAILED_PRODUCT_TTS_STALE_FENCE`.

## 9. GREEN exit

GREEN only if all are proven in one fresh disposable game:
- projection-first gate GREEN;
- TTS OFF = zero calls;
- visible TTS ON sends correct R3 request;
- server authorization succeeds;
- server binding returns valid audio URL;
- browser uses returned URL without direct provider call;
- Replay adds zero synthesis requests;
- subsequent distinct turn commits once;
- next-turn TTS OFF = zero calls;
- no stale prior-turn media/TTS overwrite;
- no Observer failure during the qualifying TTS turn;
- no source/deploy/provider/model/DB/Production change;
- full tests remain GREEN.

Terminal disposition on full success:
`TTS_END_TO_END_GREEN`.

This does NOT authorize Production and does NOT claim owner-ready. Holistic V5 must be a separate next task after operator review.

## 10. Terminal evidence — projection gate stopped before TTS

- Fresh disposable bare-public game created through the TEST UI: `08a6fe64-1e61-4b7c-a07f-73c2aa3cbdcf`.
- Visible setup completed with player `테스트 사용자`, 브랜드전략팀, 인턴, and no preserved game was touched.
- Scenario step 1 / committed turn 1: intended literal `서원희 차장에게 인사하고 오늘 일정이 궁금하다고 묻는다.`; UI reached `Turn 1` and `저장되었습니다.`.
- TTS baseline was visibly OFF (`aria-pressed="false"`); the Network trace after the turn contained zero `/media/tts` requests.
- The committed Story visibly contained heroine dialogue, including `"안녕하세요. 테스트 사용자 씨, 어서 오세요."`, but the current frontend projection contained zero `.narrative-dialogue` cards and no projected `data-speaker-id`. Therefore raw/applied dialogue parity, canonical actor binding, and the qualifying TTS candidate could not be proven.
- TTS was not clicked after the projection failure. No TTS request, provider call, replay, next-turn action, source change, deploy, DB write, migration, reset, or Production access occurred.
- Terminal disposition: `FAILED_PRODUCT_DIALOGUE_NORMALIZATION` (projection gate failure; stop before TTS).
- Validation: `npm test` 544 passed / 0 failed; `git diff --check` passed.

## 11. Completion protocol

At completion post a NEW Issue #68 terminal comment recording:
- start main / final main / current task blob;
- accepted executable source;
- deployed API/frontend versions and deployment count 0;
- full test count and diff check;
- fresh disposable game id;
- qualifying turn number/action;
- heroine id/name/voice mapping;
- exact raw/applied dialogue evidence;
- Observer warnings/provenance state;
- TTS OFF request count;
- TTS ON request identity/count/status;
- audio URL/cache evidence;
- proof server R3 path and no browser-direct provider request;
- Replay request delta;
- next-turn commit and TTS OFF count;
- stale-fencing evidence;
- any autoplay-only limitation separately;
- preserved fixtures READ ONLY confirmation;
- zero source/deploy/provider/model/DB/migration/Production changes;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.

Do not create the next task yourself. Do not start holistic V5. Do not claim owner-ready.

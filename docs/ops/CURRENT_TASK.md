# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-tts-end-to-end-live-acceptance-v2
Mode: SOURCE-FROZEN PROJECTION-FIRST TTS END-TO-END LIVE ACCEPTANCE
Updated: 2026-08-24 07:37 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388801366`
Operator review: Issue #68 comment `5388819983`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen accepted baseline

Accepted executable/source:
- `71f87b63c9405bdc2e41ff272c0448c0b41384b7`

Reviewed final main before this registration:
- `5f9f0ed418be52fadeec3d256f90e5fe1614408a`
- source remains frozen; intervening commits are ops/CURRENT_TASK only.

Accepted TEST deployment state:
- R3 API `game-proxy-company-r3@2a6419bb-9147-443d-8552-cf2fd309ae2c`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Deployment-hygiene closure already GREEN:
- accidental legacy `game-proxy-company-v1@991cf884-fb35-4c67-8152-b19e7a155b23` was rolled back exactly once to proven preimage `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
- rollback deployment `63adc570-a107-476e-bb51-d139016eb9b1` is 100% on that preimage;
- R3 API remained exactly `2a6419bb...`, R3 redeploy count 0;
- legacy `/health` and R3 `/api/r3/catalogs` returned 200.

Accepted validation:
- focused Observer finish-provenance: 46/46 PASS;
- full `npm.cmd test`: 546/546 PASS;
- syntax/diff/dry-run: PASS;
- Observer JSON-invalid diagnostic disposition: `OBSERVER_JSON_INVALID_NOT_REPRODUCED` after three fresh ordinary committed turns.

Freeze as already accepted:
- Story agency/canonical identity/navigation/time/choices;
- CSA chronology/UI;
- Observer dialogue completeness contract;
- dialogue quote-escape parity;
- Observer fail-open primary provenance and sanitized finish-reason instrumentation;
- server exact committed-dialogue TTS authorization;
- heroine voice mappings and server `TTS_WORKER` binding;
- frontend TTS queue/cache/stale fencing source contract;
- image grounding;
- current-scene/History/reset/turn terminalization;
- deployment hygiene.

Preserved READ ONLY fixtures include all prior preserved games plus:
- `7307c77b-f4bd-46df-ac45-4c5cbee190d5` — successful Observer diagnostic;
- `08a6fe64-1e61-4b7c-a07f-73c2aa3cbdcf` — prior `r3_observer_json_invalid` fixture.

Never reset/revise/retry/regenerate/mutate preserved fixtures.

## 1. Purpose

Close the remaining owner-ready media requirement with one source-frozen live acceptance:

`committed registered heroine dialogue -> frontend R3 view model -> visible TTS ON -> R3 /media/tts -> server committed-dialogue authorization -> TTS_WORKER -> audio URL/cache -> Replay cache -> next-turn stale fencing`.

This task is acceptance only. Do not patch source.

Do not start holistic V5 inside this task.

## 2. Important correction — do NOT require a dialogue DOM card

Previous acceptance incorrectly treated `.narrative-dialogue` / projected dialogue-card DOM nodes as a required frontend projection surface. That is not the current R3 contract.

Canonical current source path is:
1. `buildR3ViewModel()` reads the latest committed `observer_applied.dialogue_lines` into `view.dialogue_lines`;
2. `createCompanyTts().onCommittedTurn()` reads `view.dialogue_lines` (or media dialogue lines);
3. `selectPrimaryTtsLines()` filters to current present actors and selects focal speaker when grounded, otherwise the speaker with the highest dialogue-line count;
4. `batchDialogueLines()` creates exact speaker/text batches;
5. `playBatch()` calls R3 `api.tts()` only for those batches.

Therefore:
- do NOT require `.narrative-dialogue`, `data-speaker-id`, or any invented dialogue-card selector;
- prove committed projection via read-only context/DB evidence;
- prove frontend consumption through the exact browser `/media/tts` request identity and the frozen source contract above.

Do not mutate DOM, inspect hidden application state by injection, or call gameplay/media APIs directly.

## 3. Preflight — zero source/deploy drift

Before gameplay prove:
1. current `main` is a docs-only descendant of accepted source `71f87b63...`;
2. no product source/config/test/content/migration drift exists after that accepted source;
3. R3 API active version is exactly `2a6419bb-9147-443d-8552-cf2fd309ae2c`;
4. R3 frontend active version is exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
5. legacy worker remains on proven rollback preimage `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
6. deployment count for API/frontend/legacy in this task must remain ZERO;
7. run full `npm.cmd test` and expect 546/546;
8. `git diff --check` PASS.

If any deployed artifact drifts, stop `BLOCKED_DEPLOYMENT_DRIFT`; do not redeploy inside this acceptance task.

## 4. Hard prohibitions

Do NOT:
- edit source/tests/content/config/migration/script;
- deploy or rollback any Worker;
- change Story/Observer prompt, model, provider options, `max_tokens`, timeout, temperature, thinking, response format;
- add retry/regeneration or a second Observer;
- add JSON repair/parser/fallback/fuzzy logic;
- change normalizer/media/TTS/frontend behavior;
- change DB schema/RPC/migration/RLS/grants;
- touch Production;
- reset/retry/regenerate preserved games;
- use `?api=` override, localStorage preseed, DOM mutation, synthetic/direct JS submit, direct gameplay API, direct media API, direct provider/TTS API;
- repeat the same semantic action to manufacture a favorable projection.

Visible browser interaction plus read-only context/DB verification is allowed.

## 5. Fresh game and bounded projection-first qualification

Create ONE NEW disposable TEST game through the bare-public visible Setup and Opening.

If TTS persisted ON, visibly switch it OFF before any qualifying ordinary turn. Do not modify storage directly.

Use up to THREE distinct natural ordinary turns, each submitted visibly exactly once, to obtain a qualifying registered-heroine committed dialogue projection. Prefer natural actions that address or visit a currently canonical registered heroine, but do not require or manufacture NPC compliance.

For EACH attempted turn record:
- exact visible literal action;
- durable turn number / one attempt / one commit;
- Story text and whether it contains a clearly attributable direct quote from a registered heroine;
- committed `present_actor_ids`;
- `observer_raw.dialogue_lines`;
- `observer_applied.dialogue_lines`;
- warnings / Observer provenance;
- canonical heroine voice mapping if a candidate exists.

Stop immediately on any Observer fail-open and classify by existing provenance:
- `DIAGNOSED_OBSERVER_TIMEOUT`
- `DIAGNOSED_OBSERVER_PROVIDER_HTTP`
- `DIAGNOSED_OBSERVER_RESPONSE_JSON_INVALID`
- `DIAGNOSED_OBSERVER_MESSAGE_MISSING`
- `DIAGNOSED_OBSERVER_JSON_INVALID` plus sanitized finish warning when present
- `DIAGNOSED_OBSERVER_UNKNOWN`.

If Story contains a clearly qualifying registered/present heroine direct line but `observer_raw.dialogue_lines` omits it, stop:
`FAILED_PRODUCT_OBSERVER_DIALOGUE_OMISSION`.

If raw contains an exact valid candidate but `observer_applied.dialogue_lines` drops it, stop:
`FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.

A qualifying TTS turn requires all of:
- registered heroine direct dialogue candidate exists in Story;
- heroine is current committed present actor;
- raw contains exact candidate;
- applied contains accepted exact same speaker/text;
- no Observer failure warning;
- canonical repository `voice_id` exists.

If no qualifying projection is observed after all three distinct turns and no proven product defect occurred, stop:
`BLOCKED_TTS_PRECONDITION_NOT_OBSERVED`.

Do not classify that bounded non-observation as a product failure and do not patch source.

## 6. Compute the exact expected frontend TTS batch

Once a qualifying turn exists, derive the expected browser batch from the frozen frontend contract, not from a guessed DOM structure:

1. `dialogueLines = observer_applied.dialogue_lines` for the current committed turn;
2. filter to lines whose `speaker_id` is in committed current `present_actor_ids` and whose text is non-empty;
3. sort by numeric `order`;
4. if committed focal actor is present and has dialogue, select that speaker; otherwise choose the speaker with the greatest accepted line count using the existing stable insertion/tie behavior;
5. keep only that primary speaker's lines;
6. apply existing `batchDialogueLines()` rules: same speaker + same tone + combined text <=350 chars may merge; otherwise separate batches.

Record the exact expected batch list `{speaker_id,text,direction/tone}` before enabling TTS.

Do not invent a different primary speaker selection rule.

## 7. TTS OFF baseline

With the qualifying committed turn current and visible TTS OFF:
- browser `/media/tts` request count since that turn committed must be 0;
- no browser-direct external TTS worker/provider request;
- no browser `speechSynthesis`;
- no stale prior-game audio may be represented as current-turn synthesis.

## 8. Visible TTS ON end-to-end

After the projection and expected batch are proven:
1. click visible TTS toggle ON exactly once;
2. capture browser Network evidence;
3. every generated R3 `/media/tts` request must correspond exactly to one expected current-turn batch;
4. no request may use raw Story parsing, an absent actor, narrator/player text, Mind Monitor, or a non-projected line;
5. server must authorize each request as current committed dialogue;
6. server route must use the existing `TTS_WORKER` binding; browser must not call external provider/worker directly;
7. each required uncached batch must return a valid audio URL;
8. returned URL must be accepted by the persistent audio/cache path;
9. `Voice unavailable` must not be the terminal result for an eligible successful batch.

Request count need not be arbitrarily forced to 1: it must equal the number of uncached batches produced by the frozen batching contract for the selected primary speaker.

Failure classifications:
- qualifying projection + visible ON + zero R3 requests => `FAILED_PRODUCT_TTS_ENQUEUE`;
- request identity differs from expected committed batch => `FAILED_PRODUCT_TTS_BATCH_IDENTITY`;
- R3 returns `dialogue_not_committed` for an exact expected committed batch => `FAILED_PRODUCT_TTS_AUTHORIZATION`;
- authorized R3 request reaches service path but binding/upstream fails => `FAILED_PRODUCT_TTS_SERVICE` with exact bounded status/error;
- valid URL/cache exists and only audible autoplay is blocked => `BROWSER_AUTOPLAY_LIMITATION`, not product authorization failure.

Stop on first decisive failure; do not repair it in this task.

## 9. Replay cache

After at least one successful current-turn audio URL is cached:
- record `/media/tts` request count immediately before Replay;
- click visible Replay exactly once;
- existing contract replays `lastBatch` from cache;
- `/media/tts` synthesis request delta for Replay must be 0;
- replay identity must remain the same current committed heroine batch;
- no `speechSynthesis`.

If Replay causes new synthesis for an identical cached batch, stop:
`FAILED_PRODUCT_TTS_REPLAY_CACHE`.

## 10. Next-turn stale fencing

After successful Replay:
1. visibly switch TTS OFF;
2. submit one distinct natural ordinary action through the public UI exactly once;
3. require one durable next-turn commit and no duplicate `/turn`;
4. if Observer fails, record exact provenance and stop without retry;
5. current Story/context must advance to the new turn;
6. TTS OFF on the new turn => zero new `/media/tts` requests;
7. no late prior-turn audio/TTS async completion may overwrite or relabel the new turn's current state.

If stale prior-turn async state becomes current, stop:
`FAILED_PRODUCT_TTS_STALE_FENCE`.

## 11. GREEN exit

GREEN disposition:
`TTS_END_TO_END_GREEN`.

Requires in one fresh disposable game:
- qualifying committed heroine projection proven from raw -> applied -> present actor + voice mapping;
- expected primary/batch derived from frozen frontend contract;
- TTS OFF = 0 requests;
- visible TTS ON emits only exact expected R3 batch request(s);
- server authorization succeeds;
- server-side TTS binding returns valid audio URL(s);
- no direct browser provider call;
- Replay adds zero synthesis requests;
- subsequent distinct turn commits exactly once;
- next-turn TTS OFF = 0 new requests;
- no stale prior-turn overwrite;
- no source/deploy/provider/model/prompt/token/timeout/DB/Production change;
- full tests remain GREEN.

If GREEN, stop `WAITING_REVIEW`. Do not start holistic V5 and do not claim owner-ready. The operator will register holistic V5 separately.

## 12. Completion report

Post a NEW Issue #68 terminal comment recording:
- start/final main and final CURRENT_TASK blob;
- accepted source and exact API/frontend/legacy active versions;
- deployment counts all zero;
- full test count and diff check;
- fresh game id;
- each projection-search turn/action and durable outcome;
- qualifying heroine id/name/voice mapping;
- exact raw/applied dialogue evidence and Observer warnings;
- exact expected primary speaker and batch list derived from frozen frontend contract;
- TTS OFF request count;
- TTS ON R3 request count/identity/status;
- server authorization/TTS_WORKER/audio URL evidence;
- proof of no direct browser provider call;
- Replay request delta;
- next-turn commit and TTS-OFF request count;
- stale-fencing evidence;
- any autoplay-only limitation separately;
- preserved fixtures untouched;
- zero source/deploy/provider/model/prompt/token/timeout/DB/migration/Production changes;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal, and stop.

Do not create the next task yourself. Do not start holistic V5. Do not claim owner-ready.

## 13. Terminal acceptance record

- Execution identity: `company-r3-tts-end-to-end-live-acceptance-v2` / CURRENT_TASK blob at start `194796b091e1144bf498fc4d0dae649e29681d81` / expected branch `main`.
- Start main: `04ad7d1792876cb37c8f78b0c47fda5065b4ce6e`; accepted source: `71f87b63c9405bdc2e41ff272c0448c0b41384b7`; no source/config/test/content/migration changes and no deployment/rollback was performed.
- Active TEST versions remained exactly R3 API `game-proxy-company-r3@2a6419bb-9147-443d-8552-cf2fd309ae2c`, R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`, legacy rollback preimage `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`; deployment counts API/frontend/legacy: zero.
- Validation remained `npm.cmd test`: 546/546 PASS; `git diff --check`: PASS; tracked worktree clean except preserved/untracked `.tmp/` and `supabase/.temp/` paths, which were not committed or reset.
- Fresh disposable TEST game: `6f7e4d23-b413-45f0-9b7a-f57e01f1bc78`, created through visible Setup and Opening only, profile `TTS 진단 사용자`, content version `company-r3-m0`.
- Projection-search turn 1: visible action `서원희 차장에게 오늘 맡을 일이 무엇인지 물어본다.`; browser emitted one `/api/r3/games/6f7e4d23-b413-45f0-9b7a-f57e01f1bc78/turn` POST with `expected_turn:1` and this exact literal action; DB job was `turn_number:1`, `attempt_no:1`, `status:committed`, `stage:committed`, `error_code:null`; exactly one durable turn commit.
- Turn 1 Story contained a direct heroine1/서원희 line: `오늘 맡을 일이라면, 아직 큰 업무보다는 적응이 우선이에요. 다만 오후에 1차 브랜드 캠페인 회의가 잡혀 있어서, 그 전에 팀 자료를 한번 훑어보시면 도움이 될 거예요.`; committed `present_actor_ids` were `[general_park_jungwoo, heroine1, heroine2, heroine3, heroine4, heroine5]`.
- Turn 1 `observer_raw`: `{}` / no `dialogue_lines`; `observer_applied.dialogue_lines`: `[]`; applied warnings: `[observer_failed, r3_observer_json_invalid, r3_observer_finish_length, choices_observer_mismatch]`; `state_after.scene_note` was empty and the committed state otherwise retained the same scene. Canonical source voice mapping for the candidate is `heroine1`/서원희 -> `259d7fde62cd445fbde3ce2d8d4f2f3b`; because Observer failed, no TTS qualification was made.
- Visible TTS state at Opening was `aria-pressed=false`; one visible toggle click changed it to `aria-pressed=true` before turn 1. No valid TTS-OFF baseline was claimed after that click. Network evidence for the failed turn nevertheless contained zero `/media/tts` requests and no direct browser provider/worker request. TTS ON, server authorization, `TTS_WORKER`, audio URL/cache, Replay, and next-turn stale fencing were not attempted after the decisive Observer failure.
- No source/deploy/provider/model/prompt/token/timeout/DB/migration/Production mutation; preserved fixtures untouched.
- Exact bounded disposition: `DIAGNOSED_OBSERVER_JSON_INVALID` with sanitized finish warning `r3_observer_finish_length` (and recorded `choices_observer_mismatch`). Per the task, stop immediately on Observer fail-open; no same-action retry, regeneration, or additional turn was made.

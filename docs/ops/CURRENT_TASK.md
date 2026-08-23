# Company — CURRENT TASK

Status: READY
Task ID: company-r3-observer-output-budget-headroom-v1
Mode: NARROW OBSERVER OUTPUT-BUDGET REPAIR -> API-ONLY TEST -> PROJECTION-FIRST TTS ACCEPTANCE
Updated: 2026-08-24 07:43 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388865632`
Operator review: Issue #68 comment `5388883239`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen reviewed baseline

Accepted executable/source before this repair:
- `71f87b63c9405bdc2e41ff272c0448c0b41384b7`

Reviewed terminal main before this registration:
- `fde502f27cccfa1431c30d5498075d693daa9238`
- the preceding acceptance task changed only this existing control file; there is no product-source drift after the accepted executable.

Accepted TEST deployment state before repair:
- R3 API `game-proxy-company-r3@2a6419bb-9147-443d-8552-cf2fd309ae2c`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- legacy Company worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation:
- full `npm.cmd test`: `546/546 PASS`
- Observer failure + sanitized finish-reason provenance is accepted and must remain unchanged.

Preserve READ ONLY all prior fixtures, including decisive truncation fixture:
- `6f7e4d23-b413-45f0-9b7a-f57e01f1bc78`

Never reset/revise/retry/regenerate/mutate a preserved fixture.

## 1. Proven product failure boundary

Terminal `5388865632` is accepted as a genuine product/runtime Observer output-budget failure.

Fresh disposable game `6f7e4d23-b413-45f0-9b7a-f57e01f1bc78`, Turn 1:
- one visible ordinary action was submitted exactly once and durably committed once;
- Story contained directly attributable registered/present heroine1 speech;
- Observer fail-open evidence was:
  - `observer_raw = {}`
  - `observer_applied.dialogue_lines = []`
  - `observer_failed`
  - `r3_observer_json_invalid`
  - `r3_observer_finish_length`
  - `choices_observer_mismatch`
- therefore no valid dialogue candidate reached normalizer/TTS qualification;
- browser correctly emitted zero `/media/tts` requests after the Observer failure.

Accepted source inspection proves the existing Observer request is one non-streaming JSON completion with:
- `response_format: { type: 'json_object' }`
- `thinking: disabled`
- `temperature: 0`
- `max_tokens: 1600`
- `observerMs: 75_000`

The same Observer must return the bounded current-turn projection including scene/time/presence, summary, player inner thought, Mind Monitor, exact four choices, focal actor, and complete safely-supported heroine dialogue evidence. The live `finish_reason=length` is direct proof that the current 1600 output cap can truncate a valid required response.

Do NOT reclassify this as frontend TTS, media authorization, dialogue normalization, provider HTTP, or browser failure.

## 2. Exact repair

Make exactly one output-budget correction:
- Observer `max_tokens`: `1600 -> 2400`

This is a bounded one-step +50% headroom correction. It is not adaptive tuning.

Do NOT change in this task:
- Story `max_tokens: 5000`;
- Observer timeout `75_000`;
- Story timeouts;
- model/provider identity;
- `temperature`;
- `thinking`;
- `response_format`;
- Story or Observer prompt wording;
- required Observer fields or completeness rules;
- fail-open behavior;
- provenance taxonomy or finish-reason instrumentation;
- retry count;
- number of Observer calls.

If fresh live evidence still produces `r3_observer_finish_length` at 2400, STOP. Do not raise to 3200/4000/etc inside this task.

## 3. Expected source boundary

Expected source change:
- `runtime-r3/server/provider.js`

Expected focused test adjustment/addition:
- existing Observer provider/provenance test file(s) only as needed to lock the exact request budget and existing behavior.

No frontend source change is expected.

If the fix requires another production file, first prove why. If it requires prompt/model/timeout/schema/retry/parser/frontend changes, STOP:
`BLOCKED_OBSERVER_BUDGET_SCOPE_EXPANSION`

## 4. Mandatory deterministic validation

Before deployment prove at minimum:
1. Observer request payload uses exactly `max_tokens: 2400`.
2. Story request remains exactly `max_tokens: 5000`.
3. Observer success JSON path is unchanged.
4. `finish_reason=length` + malformed Observer JSON still maps to `r3_observer_json_invalid` + sanitized `r3_observer_finish_length`; do not hide a future cap failure.
5. `finish_reason=stop` malformed JSON provenance remains unchanged.
6. timeout/provider HTTP/top-level response JSON/message-missing classes remain unchanged.
7. no retry/second Observer call is added.
8. fail-open Story commit behavior remains unchanged.
9. dialogue completeness / quote-escape / media authorization tests remain green.
10. accepted agency/identity/navigation/choices/CSA/turn-terminalization regressions remain green.

Run:
- focused Observer/provider/worker/media/TTS tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`;
- `wrangler.r3.api.jsonc` API dry-run using `runtime-r3/worker-entry.js`.

Record exact counts.

## 5. Hard prohibitions

Do NOT:
- change any prompt text;
- reduce required Observer output fields to fit the old cap;
- change model/provider/temperature/thinking/response_format/timeouts;
- add retry/regeneration/second Observer;
- add JSON repair/truncation repair/parser fallback/fuzzy parsing/Story dialogue parser;
- change normalizer/media/TTS/frontend behavior;
- change DB schema/table/RPC/migration/RLS/grants;
- touch Production;
- mutate preserved fixtures;
- deploy or rollback legacy `game-proxy-company-v1`;
- deploy frontend;
- use wrong Wrangler config/entrypoint.

## 6. TEST API deployment

Only after deterministic GREEN:
- deploy exact corrected source to TEST API `game-proxy-company-r3` using only `wrangler.r3.api.jsonc` / `runtime-r3/worker-entry.js`;
- record the exact new R3 API version;
- verify `GET /api/r3/catalogs` read-only health = 200;
- frontend remains exactly `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- legacy worker remains exactly `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
- no frontend or legacy deployment.

If deployment identity/config is ambiguous, STOP before deploying.

## 7. Fresh projection-first qualification

After deployment, create ONE NEW disposable TEST game through the bare-public visible Setup and Opening.

TTS must be visibly OFF before projection search. If persisted ON, visibly toggle it OFF first. Do not edit storage.

Use up to THREE distinct natural ordinary turns, each submitted visibly exactly once, to obtain a qualifying registered-heroine committed dialogue projection. Prefer natural interaction with a canonical heroine, but do not retry/regenerate the same action or manufacture NPC compliance.

For every attempted turn record read-only evidence:
- exact literal action;
- one `/turn` POST / attempt_no=1 / one durable commit;
- Story heroine direct-dialogue evidence if present;
- committed `present_actor_ids`;
- `observer_raw.dialogue_lines`;
- `observer_applied.dialogue_lines`;
- warnings/provenance;
- canonical voice mapping for any candidate.

Immediate STOP classifications:
- `r3_observer_finish_length` at 2400 => `FAILED_PRODUCT_OBSERVER_OUTPUT_BUDGET_2400`;
- another Observer fail-open => report its exact existing provenance and stop;
- qualifying heroine line in Story but omitted from raw => `FAILED_PRODUCT_OBSERVER_DIALOGUE_OMISSION`;
- exact valid raw candidate dropped from applied => `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.

If three distinct turns complete without a qualifying heroine projection and without a proven defect:
`BLOCKED_TTS_PRECONDITION_NOT_OBSERVED`

Do not call that a product failure.

## 8. Exact TTS qualification and expected batch

Only after a qualifying current committed projection exists:
1. derive `dialogueLines` from current `observer_applied.dialogue_lines`;
2. filter to current present actors and non-empty text;
3. sort by numeric order;
4. apply frozen frontend `selectPrimaryTtsLines()` focal-first / highest-count selection;
5. apply frozen `batchDialogueLines()` same-speaker/same-tone/<=350-char merge behavior;
6. record exact expected `{speaker_id,text,direction/tone}` batches before TTS ON.

Do not require `.narrative-dialogue`, `data-speaker-id`, or any dialogue-card DOM node. Current R3 frontend consumes the committed projection through its view model, not a separate dialogue DOM card.

## 9. TTS OFF -> ON -> Replay -> stale fence

With qualifying turn current and TTS visibly OFF:
- `/media/tts` count since commit = 0;
- no browser-direct external TTS/provider request;
- no browser `speechSynthesis`.

Then visible TTS ON exactly once:
- generated R3 `/media/tts` requests must match the exact expected current-turn batch list;
- server authorization must accept exact committed dialogue;
- server uses existing `TTS_WORKER` binding;
- each uncached required batch returns a valid audio URL;
- browser must not call the external TTS worker/provider directly.

Failure classifications:
- qualifying projection + ON + zero R3 request => `FAILED_PRODUCT_TTS_ENQUEUE`;
- batch mismatch => `FAILED_PRODUCT_TTS_BATCH_IDENTITY`;
- exact committed batch rejected => `FAILED_PRODUCT_TTS_AUTHORIZATION`;
- authorized service/upstream failure => `FAILED_PRODUCT_TTS_SERVICE`;
- audio URL succeeds but browser autoplay alone blocks audible playback => `BROWSER_AUTOPLAY_LIMITATION`, not authorization failure.

After at least one successful cached batch:
- record synthesis request count;
- click visible Replay exactly once;
- Replay synthesis delta must be 0;
- otherwise `FAILED_PRODUCT_TTS_REPLAY_CACHE`.

Then visibly switch TTS OFF and submit ONE distinct next ordinary turn exactly once:
- one durable commit, no duplicate `/turn`;
- zero new `/media/tts` while OFF;
- no late prior-turn audio/TTS state may overwrite the new turn;
- otherwise `FAILED_PRODUCT_TTS_STALE_FENCE`.

## 10. GREEN exit

GREEN disposition:
`OBSERVER_BUDGET_AND_TTS_GREEN`

Requires:
- only Observer cap changed 1600->2400 plus focused tests;
- deterministic/full validation green;
- exact corrected R3 API-only TEST deployment;
- no `r3_observer_finish_length` in bounded fresh acceptance;
- qualifying heroine raw->applied projection proven;
- exact expected frontend TTS batch proven;
- TTS OFF=0;
- visible ON -> exact R3 media request(s) -> authorization -> TTS_WORKER -> audio URL/cache;
- Replay synthesis delta 0;
- next-turn TTS OFF=0 and stale fence green;
- no source drift outside allowed repair/test files;
- no frontend/legacy/DB/Production mutation.

If GREEN, stop `WAITING_REVIEW`. Do NOT start holistic V5 and do NOT claim owner-ready. The operator will register holistic V5 separately.

## 11. Completion protocol

Post a NEW Issue #68 terminal report with:
- start/source/final main and final task blob;
- exact changed files;
- exact before/after Observer budget;
- focused/full/syntax/diff/dry-run results;
- exact new R3 API version and unchanged frontend/legacy versions;
- fresh game id;
- each projection-search action and Observer evidence;
- any finish warning;
- qualifying heroine/voice and raw/applied lines;
- exact expected TTS batches;
- OFF/ON request counts and identities;
- authorization/TTS_WORKER/audio URL result;
- Replay request delta;
- next-turn commit/OFF/stale-fence result;
- proof no retry/second Observer/prompt/model/timeout/frontend/DB/Production change;
- preserved fixtures untouched;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal, and stop.

Do not create the next task yourself. Do not start holistic V5. Do not claim owner-ready.

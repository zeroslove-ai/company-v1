# Company — CURRENT TASK

Status: READY
Task ID: company-r3-observer-json-invalid-finish-reason-diagnostic-v1
Mode: FREEZE ACCEPTED R3 -> CLASSIFY OBSERVER JSON INVALID FINISH REASON -> API-ONLY TEST -> BOUNDED FRESH DIAGNOSTIC
Updated: 2026-08-24 06:50 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388640648`
Operator review: Issue #68 comment `5388659801`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen reviewed baseline

Accepted executable/source:
- `fcaed189913229472d0e793a3338331463f10359`

Reviewed terminal main before this registration:
- `f6b0d415f6cccda024944daddd5429b767ea72fb`
- accepted source -> current main has docs/CURRENT_TASK commits only; no product source drift.

Accepted TEST artifacts:
- API `game-proxy-company-r3@df7cbc85-6f8a-4247-9d39-1a7a8f2c5aea`
- Frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN and do not redesign:
- Story semantics, agency, canonical identity, navigation, time, choices;
- CSA chronology and app UI;
- Observer dialogue completeness prompt;
- dialogue quote-escape normalization parity;
- existing Observer fail-open provenance taxonomy;
- TTS committed-dialogue authorization, TTS_WORKER binding, heroine voice mappings;
- frontend TTS/media behavior;
- image grounding;
- timeout/terminalization;
- reset/current-scene/History;
- DB schema/RPC/migrations.

Preserved READ ONLY games include all prior fixtures plus:
- provenance success fixture `81cf07ae-ccc2-42c6-8e3c-fd8339efe133`;
- current TTS-gate diagnostic fixture `08a6fe64-1e61-4b7c-a07f-73c2aa3cbdcf`.

Never reset/revise/retry/regenerate/mutate a preserved fixture.

## 1. Correct accepted failure boundary

Do NOT accept terminal `5388640648` as `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.

Independent READ ONLY evidence for game `08a6fe64-1e61-4b7c-a07f-73c2aa3cbdcf`, Turn 1:
- Story contains multiple clear direct quoted lines by registered heroine 서원희;
- `observer_raw = {}`;
- `observer_applied.dialogue_lines = []`;
- warnings include `observer_failed` and `r3_observer_json_invalid`;
- therefore no raw dialogue candidate reached the normalizer;
- frontend exposing zero dialogue projection and not enqueueing TTS was correct fail-open behavior.

Existing provenance proves this exact stage:
1. Observer HTTP response body parsed as top-level provider JSON;
2. `choices[0].message.content` existed as a string;
3. parsing that message content as Observer JSON failed;
4. fail-open committed Story normally.

What is still UNKNOWN:
- whether provider ended the Observer completion with `finish_reason=length` and the JSON was truncated by the current `max_tokens=1600` budget;
- or whether provider ended with `finish_reason=stop` but still returned malformed JSON;
- or another bounded finish reason.

Do not infer token truncation until this is proven.

## 2. Goal — sanitized finish-reason provenance only

Add the minimum observability required to classify `r3_observer_json_invalid` without persisting provider text.

On an Observer message-content JSON parse failure only, preserve a bounded sanitized completion finish class derived from `choices[0].finish_reason`:
- `length`
- `stop`
- `other`
- `unknown`

A stable representation is required, for example bounded warnings such as:
- `r3_observer_finish_length`
- `r3_observer_finish_stop`
- `r3_observer_finish_other`
- `r3_observer_finish_unknown`

Exact names may follow an existing naming pattern, but must be stable and allowlisted.

If `usage.completion_tokens` is already present in the same provider response, it may be carried only as a bounded non-negative integer in diagnostic/timing evidence if this can be done without schema changes. It is optional. Do not persist token text or arbitrary provider metadata.

Required invariants:
1. successful Observer semantics are unchanged;
2. Observer failure remains fail-open and Story still commits;
3. generic `observer_failed` remains;
4. existing primary code `r3_observer_json_invalid` remains;
5. sanitized finish class is additionally recoverable from committed evidence and/or existing bounded timing evidence;
6. no raw Observer content, provider body, prompt, stack, arbitrary exception message, status text, secret, or user text is added to error provenance;
7. no retry or second Observer call.

## 3. Expected source boundary

Expected files only:
- `runtime-r3/server/provider.js`
- `runtime-r3/server/worker.js` only if needed to persist the already-sanitized finish class through the existing fail-open path
- one focused test file for finish-reason provenance.

Do not touch normalizer, media, frontend, Story/Observer prompt text, content, DB, migrations, or config.

If the diagnostic requires broader architecture or raw response persistence, stop `BLOCKED_OBSERVER_FINISH_REASON_SCOPE`.

## 4. Mandatory deterministic tests

Before TEST deployment, prove at minimum:
- malformed Observer message JSON + `finish_reason=length` -> fail-open commit, `observer_failed`, `r3_observer_json_invalid`, sanitized length evidence;
- malformed Observer message JSON + `finish_reason=stop` -> same but sanitized stop evidence;
- malformed JSON + missing finish_reason -> sanitized unknown evidence;
- arbitrary/unexpected finish_reason -> sanitized other evidence, never raw value;
- top-level provider response JSON failure remains `r3_observer_response_json_invalid` and must NOT be mislabeled as message-content finish class;
- missing message remains `r3_observer_message_missing`;
- Observer timeout/provider HTTP classes remain unchanged;
- successful Observer returns no finish-failure warning and normalized output remains unchanged;
- no raw malformed content or exception message appears in committed warnings/evidence;
- one Observer request only, no retry;
- Story-owned four choices/fail-open commit behavior remains unchanged.

Run:
- focused provider/worker/observer tests;
- full `npm.cmd test`;
- `node --check` for changed JS/MJS;
- `git diff --check`;
- Wrangler API dry-run.

Record exact counts.

## 5. Hard prohibitions

Do NOT in this diagnostic task:
- increase/decrease Observer `max_tokens=1600`;
- change model, provider identity, temperature, thinking, response_format, timeout;
- change any Story or Observer prompt wording;
- add retry/regeneration;
- add a second Observer call;
- add JSON repair, truncation repair, streaming Observer, parser fallback, fuzzy parser, or Story dialogue parser;
- change normalizer/media/TTS/frontend behavior;
- deploy frontend;
- change DB schema/table/RPC/migration/RLS/grants;
- touch Production;
- mutate preserved games.

This task diagnoses only. Do not repair the diagnosed cause in the same task.

## 6. TEST deployment

If deterministic tests are GREEN:
- deploy exact diagnostic source to TEST API `game-proxy-company-r3` only;
- keep frontend exactly `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- preserve model/options/token budget/timeouts/secrets/TTS_WORKER binding;
- no Production, migration, or config changes.

Record exact API Worker version.

## 7. Bounded fresh bare-public diagnostic

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Create ONE NEW disposable TEST game through visible setup. No `?api=` override, storage preseed, DOM mutation, direct gameplay API, direct provider API, reset, retry, or regeneration.

After Opening, perform up to THREE distinct natural ordinary turns through the visible UI. Do not repeat/retry the same semantic action to manufacture an error. Stop immediately on the first Observer fail-open.

For every attempted ordinary turn record READ ONLY committed evidence:
- turn number and literal action;
- whether Story committed;
- `observer_raw` empty/non-empty;
- Observer warnings/provenance;
- whether current Story contains clearly attributable heroine dialogue.

If Observer fails with a non-JSON-invalid primary code, stop and report that existing exact provenance classification; do not continue to seek JSON invalid.

If `r3_observer_json_invalid` reproduces, require the new sanitized finish class and STOP immediately:
- finish `length` => `DIAGNOSED_OBSERVER_JSON_TRUNCATION`
- finish `stop` => `DIAGNOSED_OBSERVER_MALFORMED_JSON_STOP`
- finish `other` => `DIAGNOSED_OBSERVER_JSON_INVALID_OTHER_FINISH`
- finish `unknown` => `DIAGNOSED_OBSERVER_JSON_INVALID_UNKNOWN_FINISH`

Do not enable TTS after any Observer failure.

If all three ordinary turns have successful non-empty Observer responses and no failure code:
- disposition `OBSERVER_JSON_INVALID_NOT_REPRODUCED`;
- stop; do not start TTS acceptance or holistic V5 inside this task.

## 8. Decision boundary for the NEXT task

This task must not implement the repair, but terminal evidence should make the next repair unambiguous:

If `DIAGNOSED_OBSERVER_JSON_TRUNCATION`:
- next operator may consider the smallest bounded completion-budget/output-size correction;
- do NOT automatically assume increasing tokens is the only solution; first compare observed completion length and required output footprint.

If `DIAGNOSED_OBSERVER_MALFORMED_JSON_STOP`:
- next operator must inspect JSON-mode/provider response correctness and exact malformed shape boundary;
- do NOT increase token budget as a guess.

If not reproduced:
- freeze instrumentation and return to a focused projection/TTS acceptance only after operator review.

## 9. Completion protocol

At completion post a NEW Issue #68 terminal report with:
- start main / source SHA / final main / final task blob;
- exact changed files;
- deterministic test counts and syntax/diff/dry-run results;
- TEST API version and unchanged frontend version;
- proof model/prompt/max_tokens/timeout/retry/frontend/DB/Production unchanged;
- fresh game id;
- each attempted turn/action and Observer success/failure state;
- primary Observer error code if any;
- sanitized finish class if `r3_observer_json_invalid`;
- optional numeric completion-token count only if safely available;
- proof no raw provider/Observer content was persisted as error provenance;
- preserved fixtures READ ONLY confirmation;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal, and stop.

Do not create the next task yourself. Do not start TTS acceptance or holistic V5. Do not claim owner-ready.

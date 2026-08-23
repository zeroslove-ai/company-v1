# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-observer-json-invalid-finish-reason-diagnostic-v1
Mode: FREEZE ACCEPTED R3 -> CLASSIFY OBSERVER JSON INVALID FINISH REASON -> API-ONLY TEST -> BOUNDED FRESH DIAGNOSTIC
Updated: 2026-08-24 07:10 KST
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

## 10. Terminal evidence (bounded diagnostic complete; review required)

Execution identity:
- TASK_ID: `company-r3-observer-json-invalid-finish-reason-diagnostic-v1`
- CURRENT_TASK blob at lease: `770e593db14deee8b5b2c31d4344150a4b16ec1e`
- expected branch: `main`
- start main: `0fb71667bec6c36288438503f48ff0c3ec59455f`
- accepted executable/source: `fcaed189913229472d0e793a3338331463f10359`
- source implementation commit: `71f87b63c9405bdc2e41ff272c0448c0b41384b7`

Changed files (only the allowed source/test files):
- `runtime-r3/server/provider.js`
- `runtime-r3/server/worker.js`
- `test/r3-observer-failure-provenance.test.mjs`

Validation:
- focused provider/worker/observer + adjacent R3 invariants: `46 passed, 0 failed`;
- full `npm.cmd test`: `546 passed, 0 failed`;
- `node --check` for all three changed JS/MJS files: PASS;
- `git diff --check`: PASS;
- read-only Supabase action-authority catalog gate (`stage_a`): PASS, no migration or DB write;
- Wrangler R3 API dry-run: PASS;
- no prompt, model, max_tokens, timeout, retry, parser/normalizer, media/TTS, frontend, DB, migration, or Production change.

TEST deployment record:
- An initial accidental deployment used legacy `wrangler.api.jsonc`: `game-proxy-company-v1@991cf884-fb35-4c67-8152-b19e7a155b23`; this was not the R3 target.
- A second superseded deployment used the legacy entrypoint with an R3 name: `game-proxy-company-r3@383c1836-7e2a-4290-b165-dfa0879cf591`; this was not the R3 entrypoint.
- Correct final API deployment used `wrangler.r3.api.jsonc` and `runtime-r3/worker-entry.js`: `game-proxy-company-r3@2a6419bb-9147-443d-8552-cf2fd309ae2c`, URL `https://game-proxy-company-r3.zeroslove.workers.dev`.
- frontend was not deployed and remains `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`.

Fresh bare-public diagnostic:
- URL: `https://gamebuilder-company-r3.zeroslove.workers.dev`;
- new disposable game: `7307c77b-f4bd-46df-ac45-4c5cbee190d5`;
- Opening created the game with `content_version=company-r3-m0`.
- scenario step 1 / committed turn 1: `박정우 팀장에게 다가가서 “브랜드전략팀 인턴으로 배정받은 진단 사용자입니다”라고 인사한다.` Stored R3 job literal action matched; Story committed (841 chars); `observer_raw` and `observer_applied` non-empty; no Observer failure/provenance warning; Story had attributable dialogue from 박정우 (not a heroine quote).
- scenario step 2 / committed turn 2: `자리로 돌아가 노트북을 켜고, 먼저 서원희 차장에게 가볍게 인사하러 간다.` Stored R3 job literal action matched; Story committed (1055 chars); `observer_raw` and `observer_applied` non-empty; no primary failure code; `dialogue_projection_dropped` warnings were present but the turn committed normally; Story had multiple direct quoted lines from heroine 서원희.
- scenario step 3 / committed turn 3: `우선 자리에 앉아 팀 게시판이나 공유 문서를 살펴보며 팀 분위기를 파악한다.` Stored R3 job literal action matched; Story committed (772 chars); `observer_raw` and `observer_applied` non-empty; no Observer failure/provenance warning; Story contained no clearly attributable heroine dialogue quote.
- final R3 state was `committed_turn=3`; all three jobs were `status=committed`, `stage=committed`, `error_code=null`.
- no `r3_observer_json_invalid` reproduced; no finish class or completion-token evidence was applicable; TTS was not enabled.
- committed R3 evidence uses the existing `literal_action`, `story_text`, `observer_raw`, `observer_applied`, `warnings`, and `state_after` fields; no legacy `game_actions.player_action`/`structured_action`/`post_save` writer was invoked by this R3 flow.

Preservation and disposition:
- preserved fixtures, including `81cf07ae-ccc2-42c6-8e3c-fd8339efe133` and `08a6fe64-1e61-4b7c-a07f-73c2aa3cbdcf`, were READ ONLY and not reset, revised, retried, regenerated, or mutated.
- no raw provider/Observer content or arbitrary provider metadata was added to error provenance.
- terminal disposition: `OBSERVER_JSON_INVALID_NOT_REPRODUCED`.
- final main before this control-file update: `71f87b63c9405bdc2e41ff272c0448c0b41384b7`.
- final task blob SHA: record after this in-place update and push.

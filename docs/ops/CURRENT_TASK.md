# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-observer-fail-open-error-provenance-v1
Mode: FREEZE OBSERVER COMPLETENESS SOURCE -> CLASSIFY SANITIZED OBSERVER FAIL-OPEN ERROR -> API-ONLY TEST -> ONE FRESH DIAGNOSTIC REPRODUCTION
Updated: 2026-08-24 06:31 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388504312`
Operator review: Issue #68 comment `5388523048`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen reviewed lineage

Reviewed source under diagnosis:
- `16835882d55a11c10b47d1bc60e2e034eecec4d4`

Terminal main before this registration:
- `ace131f35024e31efb2b6200acb9594d6812d421`
- direct docs-only child of source `16835882...`.

Source change already reviewed:
- `runtime-r3/server/provider.js`
- `test/r3-opening-contract.test.mjs`
- completeness contract only; no model/options/runtime persistence changes.

Reported validation on that source:
- focused Observer/provider/media/source set: 35/35 PASS
- full `npm.cmd test`: 541/541 PASS
- syntax: PASS
- `git diff --check`: PASS

TEST artifacts at terminal:
- API `game-proxy-company-r3@23d5ccee-004a-4923-9717-cb715222267c`
- frontend frozen `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`

Freeze unchanged:
- Observer dialogue completeness prompt semantics from source `16835882...`
- quote-escape normalizer parity
- server committed-dialogue TTS authorization
- frontend TTS/media behavior
- choice dispatch, agency, navigation, canonical identity
- CSA chronology
- reset/current-scene/History
- timeout terminalization
- DB schema/RPC/migrations
- provider model/options/timeouts/token budgets

Preserved READ ONLY games include:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- prior Observer omission fixture `be0a3e57-e36d-4f5a-86b9-75d60e2dfbef`
- current whole-Observer failure fixture `dad18276-dfff-4eb5-9277-90cc12f7a41e`
- every previously preserved fixture.

## 1. Correct classification of terminal 5388504312

Do NOT classify the fresh result as a proven normal Observer response that violated the new dialogue-completeness prompt.

READ ONLY evidence for game `dad18276-dfff-4eb5-9277-90cc12f7a41e`, Turn 1:
- Story contains multiple clearly attributed direct quoted lines from registered heroine 서원희;
- the heroine is present in committed `present_actor_ids`;
- `observer_raw = {}`;
- `observer_applied.dialogue_lines = []`;
- warnings include `observer_failed` and `choices_observer_mismatch`.

Current runtime boundary in `runtime-r3/server/worker.js`:
- `provider.observe()` is inside a broad `try/catch`;
- on any throw, runtime sets the raw observer to `{}`;
- the exception identity is discarded;
- only generic `observer_failed` is persisted.

Therefore current evidence cannot distinguish at least:
- `r3_observer_timeout`;
- provider HTTP failure (`r3_provider_<status>`);
- response/body JSON parse failure;
- missing provider message/content;
- final Observer JSON parse/truncation;
- another bounded Observer transport/shape exception.

The next repair cannot be selected until this boundary is proven.

## 2. Goal — error provenance only

Add the minimum bounded observability needed to preserve a sanitized Observer fail-open error class while keeping the existing fail-open product behavior.

Required behavior:
1. successful Observer behavior is byte/semantic unchanged;
2. Observer failure still MUST NOT block Story commit;
3. failure still yields empty raw Observer semantics for normalization;
4. a stable sanitized error code identifies the failure class;
5. no raw provider body, prompt, secret, stack, arbitrary exception message, or user text is persisted;
6. the code is available in committed evidence/warnings and preferably the existing timing event if that can be done without a second authority;
7. all existing generic `observer_failed` compatibility evidence may remain, but the exact bounded code must additionally be recoverable.

Preferred stable classes:
- `r3_observer_timeout`
- `r3_observer_provider_http`
- `r3_observer_response_json_invalid`
- `r3_observer_message_missing`
- `r3_observer_json_invalid`
- `r3_observer_unknown`

If existing source already has a more precise stable code for a branch, preserve it rather than inventing a duplicate vocabulary.

## 3. Expected source boundary

Expected files:
- `runtime-r3/server/provider.js` — classify only Observer response/parse boundary where necessary;
- `runtime-r3/server/worker.js` — preserve sanitized Observer error code through existing fail-open path;
- focused tests for provider/worker fail-open provenance.

Do not change other files unless a deterministic failing test proves unavoidable. If scope would broaden into gameplay semantics, stop `BLOCKED_OBSERVER_PROVENANCE_SCOPE`.

## 4. Mandatory deterministic tests

Before live deployment, cover at minimum:
- Observer timeout -> Story commit remains fail-open + sanitized timeout code persisted;
- provider non-2xx -> fail-open + sanitized provider HTTP class;
- invalid top-level HTTP response JSON/body -> sanitized response JSON class;
- missing `choices[0].message.content` -> sanitized missing-message class;
- malformed/truncated Observer content JSON -> sanitized Observer JSON class;
- unknown thrown error -> sanitized unknown class only, no raw message leakage;
- successful Observer -> no failure code and existing normalized output unchanged;
- generic `observer_failed` remains if existing contracts/tests depend on it;
- Story choices continue to come from Story tail/fail-open path exactly as before;
- no retry or second Observer request is introduced;
- full accepted suite remains GREEN.

Run:
- focused provider/worker/observer/media tests;
- full `npm.cmd test`;
- `node --check` for changed JS/MJS;
- `git diff --check`.

Record exact counts.

## 5. Hard prohibitions

Do NOT in this task:
- change `OBSERVER_DIALOGUE_COMPLETENESS_PROMPT` wording;
- change Story prompt semantics;
- change model, `temperature`, thinking mode, `max_tokens`, Observer timeout, Story timeout;
- add retry/regeneration;
- add a second Observer call;
- add Story dialogue parser/fallback;
- parse Story in frontend for TTS;
- change normalizer grounding rules;
- change media/TTS authorization or frontend TTS;
- change DB schema/table/RPC/migration/RLS/grants;
- change content/voice mapping;
- touch Production;
- mutate/retry/reset any preserved game.

Do not guess that `max_tokens=1600` is the cause. Prove the exact class first.

## 6. TEST deployment

If deterministic tests are GREEN:
- deploy exact diagnostic source to TEST API `game-proxy-company-r3` only;
- frontend remains exactly `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- frontend deploy count 0;
- preserve all existing env/model/options/timeouts/token budgets/secrets/TTS_WORKER binding;
- no Production and no migration.

Record exact API Worker version.

## 7. Fresh live diagnostic — one attempt, no manufacture

Use only bare public frontend:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Create ONE new disposable TEST game through visible UI.
Do not use `?api=` override, localStorage/storage preseed, DOM mutation, direct gameplay API, direct provider API, or preserved game reuse.

Use one natural ordinary turn after Opening. Prefer a simple visible interaction likely to contain registered heroine dialogue, but do not retry/regenerate the same semantic action to force a failure or success.

If the Observer succeeds:
- record `observer_raw` non-empty/shape and whether qualifying heroine dialogue is present;
- record no observer failure code;
- classify terminal `OBSERVER_FAILURE_NOT_REPRODUCED`;
- do not infer the prior failure cause and do not start TTS/holistic acceptance in this task.

If the Observer fail-opens:
- prove `observer_raw={}` or equivalent fail-open state;
- prove generic `observer_failed` behavior remains;
- capture the exact sanitized error code;
- classify according to that code and STOP.

Expected terminal dispositions:
- `DIAGNOSED_OBSERVER_TIMEOUT`
- `DIAGNOSED_OBSERVER_PROVIDER_HTTP`
- `DIAGNOSED_OBSERVER_RESPONSE_JSON_INVALID`
- `DIAGNOSED_OBSERVER_MESSAGE_MISSING`
- `DIAGNOSED_OBSERVER_JSON_INVALID`
- `DIAGNOSED_OBSERVER_UNKNOWN`
- `OBSERVER_FAILURE_NOT_REPRODUCED`
- `BLOCKED_OBSERVER_PROVENANCE_SCOPE`

No repair of the diagnosed cause inside this task.

## 8. Terminal evidence for this execution

Implementation source commit:
- `fcaed18` (`r3 classify Observer fail-open errors`)
- changed files: `runtime-r3/server/provider.js`, `runtime-r3/server/worker.js`, `test/r3-observer-failure-provenance.test.mjs`

Implemented sanitized taxonomy:
- `r3_observer_timeout`
- `r3_observer_provider_http`
- `r3_observer_response_json_invalid`
- `r3_observer_message_missing`
- `r3_observer_json_invalid`
- `r3_observer_unknown`

The provider emits only one of these stable codes for an Observer failure. The worker preserves fail-open `{}` Observer semantics, keeps generic `observer_failed`, adds the sanitized code to committed warnings, and emits the same code in the existing `observer_failed` timing event. Raw provider bodies, status text, arbitrary exception messages, prompts, secrets, and user text are not persisted as error provenance. No retry or second Observer call was added; Story-authored choices remain the committed choice source.

Validation:
- focused provider/worker/observer/media set: `20/20 PASS`;
- full `npm.cmd test`: `544/544 PASS`;
- `node --check` for all three changed JS/MJS files: PASS;
- `git diff --check`: PASS;
- Wrangler API dry-run: PASS.

TEST deployment:
- API `game-proxy-company-r3@df7cbc85-6f8a-4247-9d39-1a7a8f2c5aea`;
- frontend unchanged: `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- frontend deploy count: `0`;
- no Production, migration, schema/RPC/RLS, secret, model, prompt, option, timeout, token-budget, retry, parser, media, or TTS change.

Fresh live diagnostic through the bare public UI:
- game: `81cf07ae-ccc2-42c6-8e3c-fd8339efe133`;
- one ordinary action, committed Turn 1: `이메이 사원에게 인사하고, 오늘 일정이 궁금하다고 묻는다.`;
- Story committed with four Story-authored choices;
- read-only committed context showed non-empty `observer_raw` with `scene_note`, `mind_monitor`, `present_actor_ids`, four `choices`, and four qualifying `dialogue_lines`; `observer_applied` was also present;
- no `observer_failed` warning and no sanitized Observer failure code; the applied context had only existing dialogue projection diagnostics;
- no TTS, additional turn, retry, regeneration, reset, or preserved-game mutation was performed.

Disposition: `OBSERVER_FAILURE_NOT_REPRODUCED`.
All preserved fixtures remained READ ONLY.

## 9. Completion protocol

At completion report to Issue #68:
- starting main;
- source SHA and final main SHA;
- changed files;
- exact sanitized error taxonomy implemented;
- proof no raw error/provider body/secret leakage;
- focused/full/syntax/diff results;
- TEST API version and unchanged frontend version;
- fresh game id/turn;
- Story/Observer success-or-fail-open state;
- exact observer error code if reproduced;
- confirmation request count stayed one Observer attempt;
- confirmation no prompt/model/token/timeout/retry/parser/frontend/DB/migration/Production change;
- confirmation all preserved fixtures remained READ ONLY;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.

Do not generate the next task yourself. Do not start holistic V5. Do not claim owner-ready.

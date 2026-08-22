# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: EXPLICIT FAILED-TURN RETRY -> 5–10 TURN LEAN PRODUCT QA -> REPORT REAL LOCAL DEFECTS ONLY
Updated: 2026-08-22 21:38 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 0. Binding authority

Continue the same Task ID under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md` and `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md` where not superseded by later owner directives;
- Issue #68 owner lean-development directives `5380380688` and `5380381500`;
- operator review `5380470864`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

### Lean-development override — binding

Optimize for a Company R3 that is natural, stable, fun in long real play, and faithful to canon. Do not optimize for a perfect QA bureaucracy.

For this task:
- user-visible product defects and durable state corruption matter;
- a lone provider-style Story miss or known upstream/capability timeout is evidence, not an excuse to create another prompt/ops-framework cycle;
- deterministic transport/state/data corruption remains a real blocker;
- default after a small correction is focused R3 tests + syntax/diff checks, not the full historical repository suite;
- do not rerun 30/50-turn campaigns for this micro-QA continuation;
- do not create new blocker taxonomy, diagnostic metadata, harness projects, compatibility layers, semantic engines, or ops docs merely for ceremony.

Provider/model/temperature/token/config remain frozen. Do not change provider Story/Observer timeout values in this task.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden because known provider-capability CSA exceptions remain unresolved.

## 1. Reviewed terminal / accepted frozen evidence

Reviewed terminal:
- terminal `5380450863`;
- prior CURRENT_TASK blob `8314b83fae8c2a29a2b81156dd33bed2fa5db5fc`;
- execution lease `5380241045`;
- registration/start main `f1f1e876597b232dd3f2346dd1844e6755aa6a7e`;
- accepted/current executable main `9e91227302a041f1d588e3b260aa3951da3ea9bd`;
- operator review `5380470864`.

Current TEST identities at terminal:
- API `game-proxy-company-r3` Worker version `23da269d-45df-4c39-89e0-35dc99b82505`;
- frontend `gamebuilder-company-r3` Worker version `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

### 1.1 Generic player agency correction — GREEN and frozen

Accepted source `9e91227302a041f1d588e3b260aa3951da3ea9bd` changed only:
- `runtime-r3/domain/memory.js`;
- `runtime-r3/server/provider.js`;
- `test/r3-opening-contract.test.mjs`;
- `test/r3-source-correction.test.mjs`.

The correction supplies one static, non-parsing `PLAYER_AGENCY_CONTRACT` covering explicit actor, target, action, movement/destination, request, refusal, self-state, topic, and intent. It does not add NER, keywords, fuzzy matching, semantic classifiers/gates, deterministic executors, second LLMs, retries, or provider/model/config changes.

Validation accepted from terminal:
- focused invariants 30/30 PASS;
- full suite 481/481 PASS was already run by the completed task; do not rerun it merely for this continuation;
- syntax and diff checks PASS;
- TEST API deployed exactly once from this source;
- frontend unchanged.

### 1.2 Self-state + D3 agency — GREEN and frozen

Canonical self-state literal:
`혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`

Three independent fresh committed samples were 3/3 GREEN:
- `09cda9f5-d739-4ee6-979f-44a1e6a61c28`
- `fc7c4862-829a-4c82-9bd8-b747a83455ca`
- `b84a69b4-7967-46b1-83e3-2b57f4f0947f`

All preserved the alone/window/self-reflection beat without contradictory same-beat NPC approach/dialogue.

Remaining D3 one-shot probes also GREEN:
- `bfa1dc40-82c9-4618-b984-5f9995633671`: 한리브 + 점심 target/topic/action preserved;
- `a3258040-ebac-4aaf-97bc-e6a71c03b919`: 서원희 허리 target/action preserved with NPC boundary response free;
- `67a2cc50-b9c4-4548-86dd-d32cdf4dd04f`: 엘리베이터 홀 movement/destination preserved and refresh parity held;
- `cee8fcc6-c6bc-4881-a803-8acd32e354a1`: explicit lunch refusal/target preserved.

Do not rerun these for pass seeking unless new contradictory product evidence appears naturally.

### 1.3 Previously accepted location / scene_note / presence / frontend lifecycle — remain frozen

Keep previously accepted GREEN evidence frozen:
- frontend terminal SSE lifecycle source `1202b19c...`;
- canonical location directory source `d8748bc...` and four-location parity;
- scene_note replacement / exercised D2 presence-MM source `4836f591...`;
- generic frontend transport reconciliation `58380f8...`;
- Opening revision fence `2f30b62d...`.

Do not rerun their full matrices in this task.

### 1.4 Failed-turn recovery / stage-lease P0 — accepted and frozen

The `company_r3_stale_turn_timeout` family is not new.

Previously accepted P0 evidence proved:
- a natural stale failed turn is durable and recoverable;
- one explicit user retry with a fresh `action_id` and `retry_failed=true` reuses the same `(game_id, turn_number)` row;
- `attempt_no` increments once;
- the literal remains exact;
- the turn commits exactly once;
- no automatic retry is issued.

Accepted TEST schema/source includes stage-aware leases from `20260822000100_company_r3_failed_retry_stage_leases.sql`:
- Story stage lease 130s;
- Observer stage lease 85s;
- provider Story total remains 120s.

Do NOT reopen this boundary, change these leases, alter provider timeouts, or tune provider/model/config from one known timeout occurrence unless new deterministic local source evidence proves the existing recovery path itself is broken.

## 2. Current live fact to resolve first

Human-like fixture:
`901769c1-0762-43f2-836c-9056d1fdb168`

It reached 13 committed turns with movement, choices, continuity, non-work play, and agency observations.

Its next single attempt for Turn 14 later became:
- status `failed`;
- error `company_r3_stale_turn_timeout`;
- partial Story present (`당` in terminal evidence);
- `progress_writes=1`;
- no retry was made in the previous task.

This one known timeout is NOT authorization for timeout/provider/model/config or stage-lease changes.

## 3. Phase A — read-only failed-turn identity check

Before any gameplay mutation:
1. Reread Issue #68 and confirm this Task ID/blob/branch has the valid lease.
2. Confirm `origin/main` starts from the registration main and no competing source commit appeared after registration.
3. Read-only inspect game `901769c1-0762-43f2-836c-9056d1fdb168`.
4. Require that the canonical next turn is still the same failed Turn 14 attempt:
   - committed_turn remains 13;
   - no Turn 14 commit exists;
   - failed job exists for Turn 14;
   - no later `attempt_no` has already been created;
   - literal/action identity from the failed attempt is unchanged.

If another actor/user/process already retried or committed that turn, do not mutate it. Record the new truth and continue with one fresh disposable human-like fixture for Phase C instead.

Do not reset or alter preserved/manual games.

## 4. Phase B — exactly one explicit product Retry

If Phase A confirms the same untouched failed Turn 14:
1. Open the real TEST browser/frontend for the same game using the accepted TEST API.
2. Use the product's explicit failed-turn Retry path exactly once.
3. This retry is expected to create a fresh action_id and send `retry_failed=true` for the same canonical game/turn. It is an explicit user recovery action, not retry-until-pass.
4. Do not click twice, resubmit through direct API as a substitute, or create a second retry if it fails.

Required GREEN evidence:
- one user Retry action;
- one corresponding `/turn` request;
- same game id;
- same canonical Turn 14;
- fresh action_id;
- `attempt_no` increments exactly once;
- exact literal parity with the failed turn;
- exactly one Turn 14 commit;
- committed_turn advances 13 -> 14 once;
- revision advances coherently once;
- refresh/context/history show the same committed result;
- no duplicate Turn 14 row/commit.

### Phase B stop rules

A. If the browser/UI cannot issue the authorized retry, issues the wrong literal/turn, duplicates the turn, corrupts state, or the server rejects a structurally valid explicit retry because of local source logic:
- STOP as a real deterministic local product defect;
- capture browser request, job row, source path, and committed context;
- do not work around it with direct API gameplay;
- terminal BLOCKED for the smallest follow-up correction.

B. If the browser issues the correct single retry but the provider/upstream again ends in a timeout or other provider-style capability failure with no durable corruption:
- record the capability exception;
- do NOT change timeout/provider/model/config or keep retrying;
- do not manufacture a source fix from the provider miss;
- move to Phase C using one fresh disposable game if normal fresh gameplay is available.

C. If retry commits normally:
- Phase B GREEN;
- continue with the same game into Phase C.

## 5. Phase C — 5–10 human-like turns only

Run 5–10 additional human-like committed turns total for this continuation. Do NOT run 30/50-turn campaigns.

Prefer the recovered E1 game. If Phase B cannot continue only because of a provider/upstream capability miss, use one fresh disposable TEST game instead; do not reroll repeatedly.

Cover naturally, not as a rigid matrix:
- at least one ordinary/non-work social or idle action;
- at least one Story-authored choice click;
- at least one literal free-text action;
- at least one movement or scene change;
- scene continuity/location/presence/scene_note staying plausible through normal play;
- Story-owned choices: valid exact-four when emitted, fail-open empty/no-tail when not; no deterministic fabricated fallback;
- one normal refresh/reconnect/readback after a committed turn;
- current history/readback still matches committed turns and exact literals.

Do not deliberately rerun frozen D1/D2/D3 probes verbatim. Observe whether those invariants hold naturally.

### What counts as a real blocker in Phase C

STOP for:
- enabled control silently swallowing a click;
- one click producing duplicate POST/commit;
- literal text changed before durable storage;
- committed location/state contradicting exact Story evidence deterministically;
- stale previous-scene state repeatedly overwriting current committed scene;
- wrong actor/target/action/refusal/movement substitution repeating as a material product pattern;
- state/revision/turn corruption;
- refresh/reconnect losing or duplicating committed gameplay;
- explicit failed-turn Retry being structurally broken.

Do NOT stop/create a new task solely for:
- one Story stylistic miss;
- one choice no-tail reliability miss;
- one `choices_observer_mismatch` diagnostic warning when Story choices remain authoritative;
- one known provider/upstream timeout with clean failed-job state and no corruption;
- minor QA harness inconvenience that does not affect the product.

If a semantic invariant looks suspicious, use a predeclared 2–3 fresh-sample batch, one attempt per fixture, and judge the batch together. Never reroll one fixture until pass.

## 6. Optional nearby retained-surface spot checks

Only if Phase C is stable and time remains in the same execution, perform lightweight user-facing checks that require no source changes:
- current history view/readback;
- export/download if already exposed in the R3 UI;
- one TTS on/off behavioral check only if the current R3 UI exposes it;
- one feedback surface check only if already present;
- desktop plus one 390x844 mobile-width sanity check.

Do not turn absent/non-core retained surfaces into a new framework project. Report what is actually present.

## 7. Source changes in this task

Default: NO source change.

Only if Phase B/C proves a deterministic local user-visible defect with a narrow source cause may Codex prepare the smallest correction in this same task, subject to all of the following:
- do not change provider/model/temperature/token/timeout/config;
- do not add NER, keywords, fuzzy matching, semantic router/classifier/gate, movement ontology, consent DSL, deterministic narrative executor, second LLM, hidden retry/regeneration, or compatibility bag;
- do not change CSA semantics;
- do not touch Production;
- do not mutate preserved/manual games;
- use focused tests for the changed invariant plus syntax/diff checks by default;
- full repository suite only if the correction is genuinely cross-cluster/large or this becomes an explicit release checkpoint;
- deploy only the changed TEST surface exactly once after validation;
- confirm with a bounded 5–10-turn fresh/product replay, not a 30/50 campaign.

If the proven correction would require broad architecture, DB migration, provider/model/config tuning, or semantic machinery, STOP and report rather than improvising.

## 8. Frozen CSA status

Do NOT rerun CSA in this task.

Accepted/frozen GREEN canonical CSA templates remain as previously recorded, including rules 1,2,3,4,5,6,8.

Known provider/model capability-family exceptions remain for canonical rules 7 and 9. They remain unresolved product limitations and continue to prevent `OWNER_READY`, but they are not authorization for provider/model/config tuning here.

## 9. Terminal report

Post one compact terminal report to Issue #68 containing:
- Task ID + CURRENT_TASK blob + lease comment;
- final source SHA / main SHA;
- whether source changed;
- TEST API/frontend identities;
- Phase A failed-turn identity result;
- Phase B explicit Retry result, including attempt_no / literal / commit parity;
- Phase C 5–10-turn product summary: natural play, choices/free text, movement/continuity, refresh/readback;
- any deterministic local product defect actually found;
- any provider/upstream capability exception observed, clearly separated from source defects;
- focused test/deploy identity only if a source correction occurred;
- no 30/50 campaign, CSA rerun, Production, preserved-game mutation, or provider/model/config tuning.

If all bounded product checks are GREEN except already-known provider-capability exceptions, report `STATUS: BLOCKED` only because those known exceptions still prevent final owner readiness; do not invent another local blocker.

Stop after the terminal report. Do not create the next CURRENT_TASK yourself.
# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: CURRENT-EXECUTABLE OPENING RECLASSIFICATION -> CLEAN 30 -> P1 / 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 11:56 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / frozen architecture

Automation owns objective QA until the deployed exit matrix is green. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 owner-locked product canon `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime canon `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- current accepted R3 source on main
- latest explicit owner decisions and Issue #68 operator review

Architecture stays frozen at A-prime/R3:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Do NOT add a new engine, generic semantic validator, NER/fuzzy mapper, physical ontology, consent DSL, second Story/choice LLM, automatic retry/regeneration, browser-owned Story/Observer/Commit orchestration, timeout inflation, or provider/model/config workaround.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are immutable/read-only.

## 1. Accepted terminal and current executable

Accepted terminal:
- terminal comment: `5377479337`
- operator review: `5377491303`
- terminal CURRENT_TASK blob: `553633d34d00073f876d957ad3d3d93878b7b6aa`
- accepted executable main: `1b430fb477457a654f1504b29b24122829a20f6b`

Current executable delta from the registration parent is exactly one implementation commit and includes only the reviewed P0 recovery/stale-lease source, one additive TEST migration, and focused regressions.

Reported validation/deploy evidence:
- focused R3 tests: 18/18 PASS;
- full repository: 457/457 PASS;
- changed JS syntax and `git diff --check`: PASS;
- TEST additive migration: `20260822000100_company_r3_failed_retry_stage_leases.sql` applied as the exact SQL statements;
- standard DB push was blocked by pre-existing remote migration-history entries absent locally; NO migration repair/history rewrite was performed;
- read-only TEST schema verification: `stage_started_at NOT NULL DEFAULT now()`;
- TEST API: `0209c6bb-8029-4d7c-98f6-feb487e8556b`;
- TEST frontend: `1fcd09e9-70a1-421d-8998-eb702173750a`.

### P0 failed-turn recovery is GREEN — do not reopen without new evidence

Live acceptance on disposable game `53d15c30-fe64-4ada-819c-4d0ff55dea31` proved:
- Opening and Turn 1 committed normally;
- Turn 2 attempt 1 ended without terminal and later became canonical `failed` / `company_r3_stale_turn_timeout`;
- committed_turn/revision stayed 1/1 while failed;
- no automatic retry occurred;
- exactly one explicit user retry used fresh action_id `bf6ce076-104b-47e1-b42c-39dd8ad8c9df` with `retry_failed=true`;
- same `(game_id, turn_number=2)` durable row was reused;
- `attempt_no` became 2;
- exactly one new Story generation committed Turn 2 once;
- final committed_turn/revision = 2/2 with literal parity;
- stale prior attempt did not overwrite the committed retry.

Therefore failed-job retry, attempt fencing, stage-aware stale terminalization, and invocation-based provider total deadline are accepted P0 behavior. Do not redesign or retune them merely because later availability incidents occur.

## 2. Current blocker: clean-campaign Opening on the new executable

Fresh clean-30 candidate game `2004dfd2-8800-4c23-a45c-fe361d6eba3a`:
- Setup completed;
- Opening did not produce a committed terminal;
- read-only context afterward: committed_turn=0, revision=0, turns=0, job=null;
- no Opening retry, second fixture, reset, hidden regeneration, or pass-seeking replay was used.

Earlier executable Opening evidence was 3/3 green, but this iteration changed the provider total-deadline calculation globally to use one invocation-based absolute deadline. Do not blindly reuse the old Opening availability sample. Reclassify Opening on the exact current executable before starting long campaigns.

## 3. Fixed current-executable Opening reclassification

### 3.1 Preflight

1. Fetch latest `origin/main` and latest Issue #68 before any source/deploy decision.
2. Verify current main descends from `1b430fb477457a654f1504b29b24122829a20f6b`; inspect any newer delta.
3. Verify TEST API/frontend still correspond to the exact reviewed executable. Redeploy only if identity is stale or source advanced through an authorized fix.
4. Verify the additive R3 TEST schema is present read-only. Do not repair Supabase migration history and do not reapply historical migrations.
5. Keep provider/model/API URL/key/secret, Story 30s first-content, Story 120s total, Observer 75s, temperature and retry policy unchanged.

### 3.2 Exactly three fresh Setup -> Opening samples

Run exactly **3** independent fresh disposable R3 TEST games. One Setup and one Opening attempt per game. Do not stop early. Do not retry a failed Opening on the same game.

For every sample record:
- game id and viewport/client type;
- Setup result and resulting `api=` / `game_id` identity when browser is used;
- Opening HTTP status/content-type, `cf-ray`, `x-r3-request-id` where available;
- SSE `meta`, `timing`, first non-empty `story_delta`, `story_complete`, Observer timing/fail-open, terminal;
- request start -> response headers;
- request start -> first Story content or exact censored failure;
- Story total and Observer tail when present;
- exact terminal/error code or EOF/reconnect condition;
- browser-visible result and console/network errors where browser is used;
- read-only context: committed_turn, revision, turn count, job;
- no prompt/secret/auth-header capture.

### 3.3 Decision after all three — no retry-until-pass

**A. At least 2/3 Opening samples commit normally inside the unchanged provider bounds**
- classify terminal `5377479337` clean-fixture Opening failure as transient availability for now;
- do not change timeout/provider/model/config;
- immediately proceed to Section 4 on a new fresh clean campaign fixture.

**B. At least 2/3 Opening samples fail**
- classify the exact layer before editing source:
  - provider first-content / total timeout;
  - Cloudflare/edge transport before Worker;
  - Worker Opening/server route;
  - Observer/commit tail;
  - frontend SSE consumption/rendering.
- fix only a deterministic implementation defect proven by the samples;
- add the smallest focused regression, run focused + full suite + syntax/diff checks, FF-only land, exact TEST redeploy, then run one new fixed three-sample set;
- if the evidence is external provider/edge degradation rather than implementation defect, STOP BLOCKED with measurements. Do not mask it.

**C. Evidence is ambiguous**
- add only minimal non-semantic correlation/timing diagnostics if absolutely required;
- no open-ended sampling loop.

## 4. Fresh clean 30+ campaign

Only after Section 3 is green, create a NEW clean disposable campaign. Do not use `2004dfd2...` as the clean acceptance fixture and do not reuse the prior 12-turn game.

Run 30+ committed ordinary turns after Opening with coherent human-like play. Requirements:
- one intended action/intent per turn whenever practical;
- mix Story-authored choices and literal Korean free input;
- preserve exact literal action identity through storage and Story semantics;
- sample `literal -> Story -> observer_raw -> observer_applied -> state_after -> next Story` throughout;
- inspect user-visible Story/choices/MM/location/presence/scene continuity, not only commit counts;
- capture submit -> first Story token -> Story complete -> Observer complete/fail-open -> terminal commit timing.

A natural ordinary-turn failure is allowed to exercise the now-accepted explicit retry path:
- no automatic retry;
- user explicitly retries at most once for that failed canonical turn;
- record failed attempt and retry identity;
- same row, attempt_no+1, fresh action_id, exactly one new Story call;
- do not repeatedly retry until pass.

An Opening failure is NOT user-retried on the same fixture; it belongs to Section 3 classification.

## 5. Continue the existing P1 correction loop during/after clean 30

Do not wait until turn 30 to report a deterministic product defect. Fix and replay narrowly when evidence is clear.

Priorities:
1. Active CSA rules actually reach Story context as relevant premise + selected scope; active state projected as `active_rules: []` is a defect.
2. Observer receives canonical actor `{id,name}` directory; no fuzzy/nearest mapping of unknown names.
3. Mind Monitor is actor-keyed for relevant current/post-Story NPCs; new relevant entrants are not dropped because absent pre-turn.
4. Canonical location replay across at least four distinct locations: literal -> Story -> observer raw -> observer applied -> state_after -> next Story.
5. Actor enter/exit evidence quote identifies that canonical actor; player movement quote cannot support NPC enter/exit.
6. `scene_note` is a bounded current-scene snapshot rewritten each turn; ended facts disappear and continuing facts remain.
7. Semantic player agency: Story may not substitute actor, target/counterparty, action, movement/direction, request/refusal, self-state, or topic/intent.
8. Product identity: company work is life texture, not mandatory work-assistant funnel; no invented competing app mechanics outside canonical 9-rule `상식개변` authority.
9. Choices: exactly four current Story-authored choices at high reliability, mostly one action/intention each; no prior-turn fallback or deterministic fabricated replacement. Literal free input always remains usable.

No generic semantic classifier/NER/fuzzy mapper/physical ontology/consent DSL may be introduced to solve these.

## 6. Remaining independent campaigns / CSA / retained surfaces

After the clean 30+ campaign is acceptably stable:
- materially different independent 15+ turn campaign;
- long-memory 50+ turn campaign;
- dedicated clothing CSA fixture;
- dedicated request/interaction CSA fixture.

For all 9 canonical CSA templates prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC success alone is insufficient. Institutional/system CSA premise must never manufacture personal affection, comfort, consent, or desire.

Measure latency across campaigns and derive p50/p95 where sample size is meaningful. Measure before optimizing; do not add retry/second Observer calls.

Exercise retained user surfaces including history, TTS, download/export, refresh/reconnect/double-submit, and any canon-retained feedback/revision surface. A retained visible surface is unfinished until functional or explicitly owner-deferred.

Required viewport evidence before handoff includes desktop, `390x844`, and one wider mobile/tablet viewport with visually inspected screenshots.

## 7. Safety / exit

- TEST only; no Production.
- Preserved/manual/evidence games immutable.
- No provider/model/API URL/key/secret/temperature change.
- No timeout inflation.
- No automatic retry/regeneration or second Story/choice LLM.
- No migration-history repair/rewrite; the already-applied additive R3 TEST migration is not a reason to reconcile unrelated historical entries.
- No generic semantic classifier/NER/fuzzy mapper/physical ontology/consent DSL.
- No browser-owned orchestration replacing A-prime server authority.
- Fast-forward only; no force-push/history rewrite.
- Re-read Issue #68 before each source landing and TEST deployment decision.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until all objective P0/P1/P2 evidence is green, including clean 30 + independent 15 + long-memory 50, all 9 CSA behavioral coverage, reconnect/double-submit/failed-retry recovery, semantic agency, current-scene continuity, and retained surfaces.

If a safety boundary or ambiguous deterministic failure is reached, post exact evidence and STOP. Otherwise continue this SAME task; do not create a replacement feature task.
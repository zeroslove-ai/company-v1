# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: FIXED BROWSER OPENING CLASSIFICATION -> RECONNECT/REFRESH LIVE ACCEPTANCE -> CONTINUOUS TEST LIVE-QA / FIX / REDEPLOY LOOP
Updated: 2026-08-22 10:53 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / owner policy

Automation owns objective QA until the deployed exit matrix is green. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 owner-locked product canon `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime canon `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- Company UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- current accepted R3 source on main
- latest owner decisions and Issue #68 operator review

Architecture stays frozen at A-prime/R3. Do not invent a new engine, generic semantic validator, NER/fuzzy mapper, physical ontology, consent DSL, second Story/choice LLM, retry/regeneration layer, or browser-owned Story -> Observer -> Commit orchestration.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are read-only forever.

## 1. Accepted terminal and current executable

Accepted terminal:
- terminal comment: `5377206300`
- operator review: `5377215678`
- terminal CURRENT_TASK blob: `43193c47dc83fccf48107ba1a89ee64416da02bc`
- registration main: `c88e9b36f015f4b2c586d9c381fdf0e8afcab83d`
- accepted final executable main: `e7c8ab1301ef4fd56ba4c9e5ec0c44be9bfe1f8b`

Independent Git verification: `c88e9b36... -> e7c8ab13...` is exactly two commits changing only:
- `frontend-r3/app.js`
- `runtime-r3/worker-entry.js`
- `test/r3-production-boundary.test.mjs`

Accepted corrections/evidence:
- minimal non-semantic `x-r3-request-id` correlation;
- frontend maps non-OK/body-less Turn transport failures into existing `r3_stream_reconnect_required` recovery instead of allowing blind fresh submission;
- focused transport/frontend tests 14/14 PASS;
- full npm test 452/452 PASS;
- syntax and `git diff --check` PASS.

Reported TEST deployment:
- API `game-proxy-company-r3`: `ec0da4da-3079-4482-8546-5568e2d27809`
- Frontend `gamebuilder-company-r3`: `3dc25b25-ceeb-48af-8b1e-08ebc2bba5d8`

### Same-job reconnect transport is now accepted

Exactly three fresh disposable processing-job scenarios were run, one duplicate request per sample, no retry:

1. `8b3152b6-9338-4af2-8dd8-d430bce66ab1`
2. `9133d289-1e08-49d3-b57a-f5149c2c5190`
3. `5f1cd1f0-50d2-422e-8174-0b06142cf1aa`

All 3/3 duplicate Turn requests returned HTTP 200 `application/json` with `reconnect:true`; each original SSE completed naturally; each final state was committed_turn=1/revision=1; original and duplicate preserved the same action identity; no duplicate Story generation or duplicate committed turn occurred.

Therefore the earlier single Cloudflare HTML duplicate response is classified as a transient edge/transport incident for now. Do not patch the Worker reconnect path further without new deterministic evidence.

### Current blocker

The next deployed-browser acceptance used fresh disposable game `bd94acdf-49bf-4b18-804e-5fb6cc659905`.

- frontend loaded;
- Korean Setup completed;
- URL preserved `api=` and `game_id`;
- Opening then visibly ended with `r3_stream_failed`;
- read-only context afterward: HTTP 200 JSON, committed_turn=0, revision=0, turns=0, job=null;
- browser console warnings/errors empty;
- no retry, second browser game, reset, duplicate action, or pass-seeking replay.

This single Opening failure does not invalidate reconnect evidence and does not justify timeout inflation/provider/model/config/secret changes. Earlier fixed provider timing evidence was 3/3 first Story content inside the existing 30s boundary.

## 2. Fixed deployed-browser Opening classification

This is a bounded availability/correctness classification, not retry-until-pass.

### 2.1 Preflight

1. Fetch exact latest `origin/main` and re-read latest Issue #68 before deploy/source decisions.
2. Verify current main is a descendant of `e7c8ab13...`; inspect newer delta.
3. Verify current TEST API/frontend identities; redeploy only exact reviewed artifacts if source changed or deployed identity is stale.
4. Keep current provider/model/API URL/key/secret/temperature/retry policy and Story timeout values unchanged.
5. Use fresh disposable R3 TEST games only.

### 2.2 Exactly three browser Setup -> Opening samples

Run exactly **3** independent deployed-browser samples. One Setup and one Opening attempt per game. Do not stop early and do not retry a failed sample.

For each sample record:
- disposable game id;
- browser viewport;
- Setup result and resulting URL identity;
- Opening HTTP status/content-type/cf-ray/x-r3-request-id when available;
- SSE `meta`, `timing`, `story_delta`, `terminal` sequence sufficient to classify the result;
- request start -> response headers;
- request start -> first non-empty Story delta, or censored timeout/error;
- Story complete / Observer complete / terminal commit when present;
- exact terminal error code when failed;
- browser-visible result and console/network errors;
- read-only context afterward: committed_turn/revision/turn count/job.

Do not store prompts, authorization headers, secrets, private provider payloads, or unnecessary Story content in diagnostics.

### 2.3 Decision after all three samples

**A. At least 2/3 Opening samples commit normally and first Story content is inside the current 30s boundary**
- classify the terminal's single browser Opening failure as transient availability for now;
- do not alter timeout/provider/model/config;
- proceed immediately to Section 3 using a new disposable game.

**B. At least 2/3 fail**
- classify from exact evidence before editing source:
  - provider first-content/total timeout;
  - Cloudflare/edge transport before Worker;
  - Worker Opening route/server error;
  - frontend SSE handling/rendering defect.
- if request correlation proves Worker/provider succeeded but browser still reports `r3_stream_failed`, treat as frontend correctness defect and fix narrowly.
- if Worker returns a deterministic Opening failure, fix only the proven Opening/provider adapter/server layer with focused regression.
- if evidence indicates external provider/edge degradation without implementation defect, do not mask it with timeout inflation, provider/model/config change, or hidden retry; STOP BLOCKED with measurements.

**C. Evidence remains ambiguous**
- add only the smallest non-semantic correlation/timing diagnostic required, test it, fast-forward land, exact TEST deploy, then run one new fixed three-sample set. No open-ended loop.

Any source change requires focused tests, full npm suite, changed JS/MJS syntax checks and `git diff --check`; fast-forward push only.

## 3. Deployed browser reconnect / refresh acceptance

After Section 2 establishes a usable Opening path, use a new fresh disposable game and complete the previously blocked user-visible reconnect acceptance:

1. Korean Setup -> Opening -> at least one committed ordinary turn.
2. Refresh after commit; render canonical committed context.
3. Start another turn and reload while its job is actively `processing`.
4. Exercise real or controlled SSE interruption and recover the **same job**.
5. Verify recovery control visibility/usability when needed.
6. Preserve `api=` and `game_id` through reload.
7. Verify terminal committed context renders after recovery.
8. Prove no second Story generation, duplicate committed turn, hidden retry or regeneration.
9. Inspect browser console/network, x-r3-request-id/cf-ray where relevant, job/state/turn DB evidence, and screenshot-visible UI together.

A deterministic browser recovery defect may be fixed narrowly and replayed once on a new disposable game. Unit tests alone are not acceptance.

## 4. Continue the SAME P1 correction loop

A green reconnect scenario is not completion. Continue immediately through these priorities:

1. Active CSA rules actually projected into Story as relevant premise + selected scope; `active_rules: []` while active is a defect.
2. Observer receives canonical actor `{id,name}` directory; no fuzzy/nearest mapping of unknown names.
3. Mind Monitor is actor-keyed for relevant current/post-Story NPCs; new entrants are not structurally dropped because absent pre-turn.
4. Canonical location replay across at least four locations: literal -> Story -> observer raw -> observer applied -> state_after -> next Story.
5. Actor enter/exit evidence quote identifies that canonical actor; player movement quote cannot become NPC enter/exit evidence.
6. `scene_note` is a bounded current-scene snapshot rewritten each turn; ended facts removed and continuing facts retained.
7. Semantic player agency: actor, target/counterparty, action, movement/direction, request/refusal, self-state, topic/intent must not be substituted.
8. Product identity: workplace is life texture, not mandatory work-assistant funnel; no invented competing app mechanic outside canonical 9-rule `상식개변` authority.
9. Choices: exactly four current Story-authored choices at high reliability, one clear action/intention each; no stale/prior-turn fallback or deterministic fabricated replacement; failure remains fail-open to literal free input.

## 5. Campaigns / latency / CSA

Use separate disposable fixtures. Do not certify clean play from a heavily CSA-mutated game.

Required campaigns:
- clean normal-play 30+ committed turns;
- materially different independent play 15+ turns;
- long-memory 50+ turns after shorter campaigns stabilize;
- clothing CSA fixture;
- request/interaction CSA fixture.

Measure submit -> first Story token, Story total, Observer tail, terminal commit across campaigns; derive p50/p95 where sample size permits. Measure before optimizing.

For each of all 9 canonical CSA templates prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

Also verify clothing is structured only when evidence warrants it and institutional/system CSA premise never manufactures personal affection, comfort, consent, or desire. RPC success alone is not acceptance.

## 6. Retained surfaces / minimum deployed evidence

Exercise history, TTS, download and other canon-retained sidecars. Feedback/revision, if visibly retained by canon, is unfinished until functional or explicitly owner-deferred.

Before owner handoff require deployed evidence for:
- desktop/mobile boot;
- Setup -> Opening -> ordinary play;
- visible nonblocking Story streaming;
- current four choices + literal Korean free input;
- 30 + 15 + 50 campaigns;
- semantic agency, identity, location/presence, scene_note, MM;
- refresh/reconnect/double-submit;
- all 9 CSA narrative/readback/remove coverage;
- desktop, `390x844`, and one wider mobile/tablet viewport;
- no permanent loader/fallback blocking Story;
- no fabricated/crossed identity;
- DB/state/turn evidence matching visible Story/UI;
- visually inspected screenshots;
- retained sidecars usable or owner-deferred;
- no known objective P0/P1/P2 defect remaining.

## 7. Safety / reporting

- TEST only; no Production.
- Preserved/manual/evidence games read-only forever.
- No provider/model/API URL/key/secret changes to chase availability.
- No timeout inflation from isolated failure evidence.
- No retry-until-pass, hidden regeneration, second Story/choice LLM.
- No generic semantic classifier/NER/fuzzy mapper/physical ontology/consent DSL.
- No browser-owned orchestration replacing server-owned A-prime authority.
- No force-push/history rewrite.
- Re-read latest Issue #68 before every source landing/deploy decision.

Remain `READY` while any objective P0/P1/P2 defect or untested retained behavior remains. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` remains forbidden until the entire objective matrix is green.

Use Issue #68 for compact iteration evidence. If a fixed diagnostic is ambiguous, external provider/edge availability blocks progress, a push/deploy race occurs, or another safety boundary is hit, post exact evidence and STOP. Otherwise continue this SAME task.
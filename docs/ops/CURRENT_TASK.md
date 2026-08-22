# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: WORK_NUDE CSA STATE-CONTINUITY ROOT CAUSE -> NARROW OPENING/CSA CONCURRENCY CLOSURE IF PROVEN -> ONE FRESH REPLAY -> REMAINING 7 CSA -> FULL OBJECTIVE LIVE-QA MATRIX
Updated: 2026-08-22 18:21 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops branch, recovery branch, or competing execution authority.

## 0. Binding authority

Continue the same Task ID under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`;
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`;
- owner UX/CSA directives already recorded in Issue #68;
- operator review `5379531661`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Do not hand back to owner before the objective matrix is complete. `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden until all objective QA is green.

## 1. Accepted/frozen evidence from previous execution

Reviewed terminal:
- terminal comment `5379509195`;
- task blob `45d8b0ef703ef610a812524717d22c5b105b5679`;
- execution start main `594749fba2b946f6b2043195aa3de6ad3b0acde5`;
- final/current main `58380f864c17e47e603a665c0779b624bacf201b`;
- operator review `5379531661`.

Accepted source/live identities:
- current main/source baseline: `58380f864c17e47e603a665c0779b624bacf201b`;
- TEST API: `game-proxy-company-r3` version `bad0bbeb-574a-4d82-8875-3ade37df3de8`;
- TEST frontend: `gamebuilder-company-r3` version `c297425c-3fa8-4025-a514-5ac908606c36`.

### 1.1 Generic turn-transport reconciliation — GREEN and frozen

Source `58380f8` is accepted:
- changed only `frontend-r3/app.js`, `frontend-r3/turn-transport.js`, `test/r3-turn-transport.test.mjs` from prior registration;
- focused 11/11 and full 473/473 reported PASS;
- syntax / diff checks PASS;
- only TEST frontend deployed;
- no automatic gameplay replay was introduced.

Do not reopen this source unless new deterministic evidence directly implicates it.

### 1.2 Live UX phases already green — preserve, do not rerun for pass-seeking

Freeze as accepted coverage:
1. B3 movement/reload continuity on `edc5704b-aff7-44d3-92f2-b5882f217e13`.
2. B4/B5/B6 no-panties clothing campaign on the same fixture.
3. no-bra campaign `2544b01f-c911-4e1d-afa2-72abfee2ed51`.
4. two-personality request/contact campaign `2c4ea2ce-e4cf-4401-af11-011bb43c5cca`.

Retain the observed `choices_projection_dropped`, `choices_observer_mismatch`, and bounded presence warnings for later matrix triage; do not silently alter choice architecture here.

## 2. Current decisive blocker

Preserved disposable evidence fixture:
`7138198c-510d-4fb4-879c-fdac2f63465c`

Accepted facts:
- `work_nude` / `회사 여성 직원은 근무 중 모든 옷을 벗어 나체 상태로 지내야 한다.` was applied once through the real UI;
- revision `0 -> 1`; committed_turn remained `0`;
- active `r3_csa_1` was present immediately after apply;
- scoped finite clothing slots were all `removed`;
- exactly one relevant UI turn was submitted:
  `서원희 차장에게 여성 직원 근무 중 복장 규정이 어디까지 적용되는지 묻는다.`
- one POST, action_id `f7702763-7ffa-4cfb-8ae2-0d6a886361b9`, expected_turn `1`, HTTP 200 event-stream, no loadingFailed;
- Turn 1 committed once: revision `2`, committed_turn `1`;
- Story answered with ordinary formal/semi-formal dress-code guidance and did not establish the active all-clothing-removed premise;
- post-turn canonical readback had `csa_active=[]`, `active_rules=[]`, `csa_rules={}`, `clothing={}` with no remove operation.

Classification:
`BLOCKED_R3_WORK_NUDE_NORMAL_TURN_DROPS_ACTIVE_CSA_STATE_AND_IGNORES_PREMISE`

State continuity is the first blocker. Do NOT tune Story/provider/model/config to address the narrative symptom while the active rule disappears from canonical state.

## 3. Static source fact to test, not yet a live root-cause conclusion

Current source shows:
- `reduceObservation()` starts from a structured clone of the supplied current state and only applies bounded observation deltas; it does not intentionally clear CSA top-level keys.
- `processOpening()` currently holds an early `before` snapshot across Story + Observer generation and reduces Opening against that snapshot.
- source migration `20260821000100_company_r3_milestone0.sql` defines `company_r3_create_opening(...)` without an expected-revision argument and updates `company_r3_state.state = p_state_after`.

Therefore a concrete candidate is an Opening/CSA race:
`Opening begins from pre-CSA state -> CSA commits while Opening is still generating -> late Opening commit writes stale pre-CSA state -> first normal turn no longer sees active rule`.

This is a hypothesis until the preserved fixture timeline and deployed function definitions prove it. Do not patch from assumption alone.

## 4. PHASE A — read-only root-cause classification of preserved work-nude fixture

Before any source/DB/deploy mutation, inspect read-only:

### A1. Exact live timeline
For `7138198c-510d-4fb4-879c-fdac2f63465c`, capture exact timestamps and payloads for:
- game creation if available;
- Turn 0 `committed_at`, revision, `state_after` CSA/clothing fields;
- `company_r3_system_events` CSA transaction `created_at` and operation payload;
- `company_r3_state.updated_at`, revision, committed_turn and current state;
- Turn 1 `committed_at`, literal, `state_after`, observer raw/applied, warnings;
- Turn 1 job `created_at` / `updated_at` / attempt / stage / status;
- any other event that can mutate R3 state in that interval.

Do not write or replay anything in this fixture.

### A2. Exact deployed persistence contract
Read the actual TEST definitions/signatures for:
- `company_r3_create_opening`;
- `company_r3_apply_csa`;
- `company_r3_commit_turn`.

Compare them with current source. Do not assume the deployed DB equals migration source.

### A3. Mandatory root-cause classification heartbeat
Post one `PROGRESS_HEARTBEAT` with exactly one primary classification:
- `OPENING_CSA_STALE_SNAPSHOT_OVERWRITE_PROVEN`
- `OPENING_CSA_OVERLAP_NOT_PROVEN`
- `OTHER_STATE_CONTINUITY_ROOT_CAUSE_PROVEN`
- `INSUFFICIENT_EVIDENCE_FOR_ROOT_CAUSE`

Include the exact timestamp ordering and the smallest source/DB path that explains the loss.

If evidence proves a different deterministic root cause, follow that evidence and keep the fix bounded to state continuity.

If evidence is genuinely insufficient, build a deterministic source-level reproduction of the suspected concurrency boundary before editing production logic. Do not use repeated live sampling to discover the race.

## 5. PHASE B — minimal generic state-continuity correction, only after proof

Goal invariant:
**A committed CSA mutation must not be erased by an Opening or ordinary Story turn unless an explicit CSA remove operation says so.**

The correction must also preserve:
- exactly one Story call for Opening;
- exactly one Story call per normal turn;
- exactly one Observer call per Story;
- no Story regeneration/retry to solve state conflicts;
- no template-specific `work_nude` branch;
- no semantic classifier/gate/NER/fuzzy matching;
- no provider/model/API/temp/token/timeout change.

If Opening/CSA concurrency is proven, close the concurrency structurally. Requirements:
- do not rely on frontend timing alone;
- a CSA operation against an unfinished/stale Opening snapshot must either be prevented atomically or reconciled without losing either committed state domain;
- a late Opening commit must not overwrite a CSA mutation that committed after the Opening's original snapshot;
- if a state CAS/recomposition retry is necessary, it may retry only the local state composition/DB commit from already-produced normalized Opening evidence; it must never call Story or Observer again;
- frontend may additionally disable CSA until canonical Opening is committed if useful, but UI gating alone is not sufficient server integrity proof.

DB change policy:
- at most one new additive migration source is allowed if an atomic DB contract change is actually necessary;
- historical migrations are immutable;
- apply only to TEST after source/tests are green;
- record exact applied migration and verify function ACL/signatures;
- Production is forbidden.

## 6. Required deterministic regressions before live replay

Add focused tests that prove at minimum:

1. **Normal sequence**
   Setup -> Opening commit -> CSA apply -> normal turn:
   - active rule survives;
   - CSA rule metadata survives;
   - finite clothing survives except explicit Observer clothing deltas;
   - normal turn cannot clear CSA state by omission.

2. **Opening/CSA overlap** if this is the proven cause
   Delay Opening completion deterministically and attempt CSA during the overlap.
   Acceptance:
   - no lost CSA state;
   - no stale Opening overwrite;
   - no second Story/Observer call;
   - no hidden gameplay replay;
   - final canonical Turn 0/current state are coherent.

3. **Explicit removal remains authoritative**
   A real remove still clears active rule enforcement without requiring rollback of already-materialized clothing facts.

4. **Unrelated state preservation**
   scene, time, profile, MM/choices persistence surfaces do not regress.

Validation:
- relevant focused tests;
- full `npm test`;
- `node --check` on every changed JS/MJS;
- `git diff --check`;
- inspect changed SQL if any;
- reread Issue #68 immediately before landing.

Land only on `main`; no new branch/PR.

## 7. PHASE C — TEST rollout only for changed surfaces

After source validation:
- if API/runtime changed, deploy TEST API once and record exact Worker Version ID;
- if frontend changed, deploy TEST frontend once and record exact Worker Version ID;
- if one migration was required, apply it to TEST once and verify exact function definitions/ACLs;
- do not redeploy an unchanged surface;
- do not change provider/model/config/timeouts;
- do not access Production.

Smoke before semantic replay:
- `/api/r3/catalogs` healthy;
- fresh browser Setup + Opening healthy;
- no duplicate Opening/turn jobs;
- no transport regression.

## 8. PHASE D — exactly one fresh work-nude replay

Do not reuse `7138198c...`.

Use ONE new disposable current-R3 TEST game.

1. Complete Setup + canonical Opening.
2. Prove Opening is terminal/committed before CSA apply unless the fixed contract explicitly supports safe overlap.
3. Apply `work_nude` once through real CSA UI.
4. Prove revision increases while gameplay turn does not; active rule + all four removed clothing slots read back.
5. Submit exactly once:
   `서원희 차장에게 여성 직원 근무 중 복장 규정이 어디까지 적용되는지 묻는다.`
6. Capture network/SSE, exact literal, Story, Observer raw/applied, state_after, canonical readback, choices/MM/location/presence/timings.

### D1. State continuity gate
PASS only if after the committed turn:
- same active CSA rule remains;
- `active_rules`, `csa_active`, `csa_rules` remain coherent;
- finite clothing state remains coherent;
- no implicit remove occurred.

If this fails again:
STOP `BLOCKED_R3_CSA_STATE_CONTINUITY_AFTER_CONCURRENCY_CLOSURE` with exact state/timeline. No Story tuning and no second replay.

### D2. Story premise gate — only after D1 passes
Judge the direct policy-domain Story honestly.

PASS:
- Story is consistent with the active `work_nude` institutional premise and scope;
- it behaves as an already-current world/company fact rather than system/hypnosis exposition;
- NPC personality remains individual;
- no affection/comfort/consent/desire/romance/obedience/trust/relationship is manufactured;
- literal actor/target/topic is preserved.

If state persists but this valid direct-policy Story still materially denies/ignores the rule:
STOP `BLOCKED_R3_WORK_NUDE_STORY_PREMISE_WITH_STATE_PRESERVED`.
Capture exact active_rules Story input + raw Story. Do NOT patch prompt/provider in the same execution and do not sample again.

If both gates pass:
- remove the rule once through UI;
- prove revision rises while gameplay turn does not;
- play one ordinary follow-up turn;
- prove removed rule is no longer enforced while historical/material facts are not time-rewound.

Then continue automatically.

## 9. PHASE E — remaining objective matrix

Continue same Task ID without owner handoff.

### E1. Remaining seven canonical CSA campaigns
The already accepted no-panties, no-bra, contact/request campaigns stay frozen. Cover each remaining canonical template independently, one active rule per disposable fixture where practical.

For each:
`apply -> revision up / turn same -> readback -> relevant natural scene -> Story behavior -> Observer/state/MM/choices -> ordinary interleave if useful -> remove -> revision up / turn same -> post-remove Story/readback`.

Never infer affection/consent/romance/etc from rule activation alone.

### E2. Four canonical locations
Fresh fixture. Prove four distinct registered canonical locations full chain:
`literal -> Story exact destination -> observer_raw -> observer_applied -> state_after -> next Story/context/map`.
No fuzzy/generic destination upgrades.

### E3. Presence / scene_note / player agency
Prove:
- exact canonical actor evidence;
- player movement does not fabricate NPC enter/exit;
- relevant entrant can receive MM;
- no unrelated/off-scene actors;
- scene_note is a bounded current snapshot and stale ended actions/entities disappear.

Agency probes include:
- 한리브/lunch must not become 김제나/work;
- `혼자 있고 싶다` must be respected;
- `허리를 만진다` must not become touching a table edge.

No semantic hard gate/classifier.

### E4. Human-like campaigns
Separate fresh fixtures:
- primary clean ordinary play: 30+ turns;
- materially different style: 15+ turns;
- long-memory: 50+ turns.

Do not use one CSA-mutated fixture to certify ordinary play.

### E5. Choices / latency / retained surfaces
Collect:
- Story exact-four valid-tail rate;
- no-tail rate + max streak;
- Observer exact/mismatch counts;
- zero fabricated/prior fallback;
- choice literal click parity;
- latency submit / first Story token / Story complete / Observer complete / commit; p50/p95 when sample permits;
- history/export/download if retained;
- reload/reconnect;
- duplicate submit;
- explicit retry;
- TTS/feedback if retained;
- desktop, 390x844, and wider mobile/tablet.

## 10. Stop rules

Immediate terminal BLOCKED on the first deterministic failure that invalidates continued matrix work.

Do not:
- retry/sample until pass;
- mutate preserved historical/manual evidence games;
- direct-API gameplay as a substitute for browser acceptance;
- add provider/model/config workarounds;
- add generic semantic validators, NER, fuzzy mapping, physical ontology, consent DSL, or second LLM;
- regenerate Story automatically;
- access Production;
- create a new CURRENT_TASK file/ops branch/recovery branch.

Heartbeats at phase boundaries and roughly every 15 minutes of active work.

A terminal report must include:
- exact task blob;
- start/final main;
- changed paths/commits;
- test/deploy/migration identities;
- root-cause classification and evidence;
- exact fresh replay evidence if reached;
- accepted/frozen phases;
- first blocker or full remaining matrix result.

Full objective matrix green is the only path to `OWNER_READY`.

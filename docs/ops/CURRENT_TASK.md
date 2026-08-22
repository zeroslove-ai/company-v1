# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: P1 STORY-ONLY CHOICE AUTHORITY CLOSURE -> FOCUSED LIVE ACCEPTANCE -> CLEAN 30 -> P1 / 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 12:39 KST
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

Choice authority is now explicit and non-negotiable:
- **Story is the sole choice author.**
- the current Story's structurally valid terminal `1..4` tail is the only canonical current-choice source;
- Observer may report choices for diagnostics, but Observer may never author, repair, replace, reorder, or veto a valid Story choice set;
- frontend is presentation-only and must submit the exact canonical Story literal.

Do NOT add a new engine, generic semantic validator, NER/fuzzy mapper, nearest matching, physical ontology, consent DSL, second Story/choice LLM, automatic retry/regeneration, browser-owned Story/Observer/Commit orchestration, timeout inflation, provider/model/config workaround, or a second narrative parser generation.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are immutable/read-only.

## 1. Accepted terminal / current executable

Accepted terminal:
- terminal comment: `5377657800`
- operator review: `5377669132`
- terminal CURRENT_TASK blob: `35aea2b9cb864b72720386d6dfec338b8c4947b4`
- verified executable/main at terminal: `8282dea589757b75f0a9732615433baa0ee793f0`
- registration parent: `d5018aae16dd4367eb0c4941cc8650e16590506a`

Independent Git verification:
- `8282dea...` is exactly one fast-forward implementation commit after `d5018aae...`;
- changed paths are only:
  - `runtime-r3/domain/observer-normalizer.js`
  - `runtime-r3/server/provider.js`
  - `frontend-r3/render.js`
  - `test/r3-source-correction.test.mjs`
  - `test/r3-frontend-contract.test.mjs`.

Accepted bounded parity correction:
- current Story terminal 1-4 tail recognition exists;
- Observer parity accepts only exact equality or the already-authorized presence/absence of a backslash immediately before an ASCII double quote;
- accepted canonical value is always the exact Story literal;
- frontend preserves full server literal for click payload while short labels remain presentation-only;
- focused 15/15, full repository 460/460, changed JS/MJS syntax and `git diff --check` passed per terminal evidence;
- exact TEST deployment from `8282dea...`:
  - API `247a5d50-a70d-479c-9e1f-1fd9b53aa8a3`
  - frontend `ba4812c5-3883-4a90-8b9d-5482e4ccfabf`.

Already green/frozen absent new deterministic evidence:
- P0 failed-turn explicit retry, same-row attempt fencing, stage-aware stale terminalization;
- provider Story 30s first-content / 120s total and Observer 75s budgets;
- invocation-based Story total deadline;
- same-job duplicate transport and browser refresh/recovery;
- no provider/model/config/secret/timeout change is justified.

## 2. New deterministic blocker and architecture decision

Fresh disposable TEST game `249e38d6-ccdb-4656-b893-68e868ab2e1f`:
- Setup and Opening committed normally; Opening had four canonical choices and four browser buttons.
- Turn 1 clicked literal `인턴 자리에서 태블릿 화면을 켜고 「상식개변」 앱을 살펴본다.`; literal storage parity passed; Story/Observer/commit completed.
- Turn 1 Story had **no valid terminal 1-4 tail**, while Observer returned four unrelated choices. The current normalizer correctly committed no choices. This remains correct fail-open behavior.
- Turn 2 free input `이메이에게 앱에 대해 조심스럽게 묻는다.` stored exactly and committed.
- Turn 2 Story DID contain a valid terminal four-line 1-4 choice tail.
- Observer returned those actions with `1.` through `4.` prefixes. Because current `projectChoices()` still requires Observer parity, it discarded the valid Story tail, committed `choices=[]`, and the UI showed no buttons.
- No retry/repeat-until-pass/additional campaign was used.

This remaining veto is a P1 authority defect. A malformed Observer representation must not erase choices that the sole author — Story — already supplied unambiguously.

### Architecture decision

Use the **existing** tiny terminal Story-tail recognizer as canonical current-choice authority directly.

If current Story ends with exactly four distinct non-empty terminal numbered choices:
- `normalized.choices` MUST be those exact Story-tail literals in current order;
- Observer choices are diagnostic only;
- exact Observer match or the already-accepted backslash-before-ASCII-double-quote equivalence may count as diagnostic parity;
- missing, numbered, unrelated, reordered, duplicated, or otherwise malformed Observer choices may emit a bounded warning such as `choices_observer_mismatch`, but MUST NOT erase or mutate the canonical Story choices;
- never persist or submit Observer text as a choice literal.

If current Story has no valid terminal exact-four tail:
- canonical choices remain absent/null/empty according to the existing R3 shape;
- Observer choices cannot create, rescue, infer, or fabricate choices;
- literal free input remains usable;
- record the turn as a Story choice-reliability miss for aggregate QA.

Do not solve the Turn-2 example by stripping `1.` prefixes from Observer. No Observer normalization is needed for correctness once Story is canonical.

## 3. Required narrow source closure

Prefer the smallest change in `runtime-r3/domain/observer-normalizer.js` and focused tests.

Required behavior:
1. Call/reuse the existing terminal `storyChoiceTail(storyText)` recognizer once for current choices.
2. If it returns four valid Story choices, assign those exact values to `normalized.choices` regardless of Observer `choices` content.
3. Observer choices may be checked only for diagnostics. Keep the existing exact/escape-only parity helper if useful for this diagnostic; do not broaden it.
4. If Observer choices are absent or do not match the Story tail, add one bounded warning; no semantic correction and no gameplay failure.
5. If Story tail is absent/invalid, keep choices absent even if Observer returns 4/40 plausible strings.
6. Do not use prior turn choices, deterministic defaults, Story body numbered lists, Observer text, nearest match, fuzzy/substring semantics, or frontend reconstruction.
7. Keep exact Story literal bytes/order as the persisted/clicked value.
8. No provider prompt change is required for correctness. Do not change model/config/temperature/tokens/timeouts/retry policy.
9. Frontend source should remain unchanged unless a concrete regression proves the accepted full-literal click path at `8282dea...` is insufficient.

This is not a new parser generation. The structural terminal 1-4 recognizer already exists and is being made consistent with Story sole-authority.

## 4. Required deterministic regression proof

Add/adjust focused tests proving at least:

1. valid terminal Story 1-4 tail + exact Observer choices -> exact Story choices;
2. valid Story tail + escape-only Observer representation -> exact Story choices;
3. valid Story tail + Observer `1.`/`2.`/`3.`/`4.` prefixes -> exact Story choices still survive, with diagnostic mismatch warning;
4. valid Story tail + unrelated Observer choices -> exact Story choices still survive, warning only;
5. valid Story tail + missing/empty Observer choices -> exact Story choices still survive;
6. valid Story tail + reordered/duplicate Observer choices -> exact Story choices still survive, warning only;
7. Story without a valid terminal tail + Observer four choices -> canonical choices absent; Observer cannot rescue them;
8. Story with 0/3/5 terminal choice lines -> canonical choices absent;
9. earlier numbered Story body lists do not become choice authority;
10. duplicate Story tail literals invalidate the Story tail;
11. no prior-turn or deterministic fallback choice source exists;
12. frontend receives four canonical Story literals and renders four buttons when server choices exist;
13. clicking a button submits the complete canonical literal unchanged, including any literal backslash present in the Story value;
14. short button labels remain presentation-only;
15. free input remains available when canonical Story choices are absent.

Run:
- focused Observer/choice/frontend contracts;
- full `npm` suite;
- changed JS/MJS syntax checks;
- `git diff --check`.

Do not add a regression that merely encodes Observer prefix stripping or other Observer normalization.

## 5. Landing / TEST rollout

1. Re-read latest Issue #68 immediately before source landing.
2. Verify main still descends fast-forward from `8282dea...`; inspect any unexpected delta and STOP on conflicting execution authority.
3. Land only the minimal source/test correction, fast-forward only. No new branch, recovery branch, force push, or history rewrite.
4. No migration/DDL/schema/data change is expected or authorized.
5. Deploy exact TEST API if backend source changed.
6. Deploy exact TEST frontend only if frontend source actually changed; otherwise preserve the accepted equivalent deployment.
7. Record exact main SHA and Worker version identities.
8. Production remains untouched.

## 6. Focused deployed acceptance after Story-only choice closure

Use **one fresh disposable R3 TEST game** first. Do not reuse `249e38d6...`, `a650e1ab...`, or any preserved evidence fixture.

Run Setup + Opening and exactly **5 ordinary committed turns** as a bounded deployment/no-regression probe. Do not repeat a failed/missing-choice turn merely to get a better result.

Play requirements:
- use at least two current Story choice clicks when valid choices are available;
- use at least two literal Korean free-input actions;
- preserve one intended action/intent per turn where practical;
- after every turn record Story terminal tail, observer_raw.choices, normalized/applied choices, committed choices, browser buttons, submitted literal_action, and terminal status.

Acceptance semantics:
- if Story has a valid terminal exact-four tail, committed/UI choices MUST be those four exact Story literals regardless of Observer mismatch;
- if Story lacks a valid tail, committed choices MUST remain absent and no fallback/fabrication may appear;
- a no-tail turn is a **choice reliability miss**, not an invitation to regenerate Story; continue through literal free input if the rest of the turn committed normally;
- Observer mismatch is diagnostic only and must not remove a valid Story tail;
- click payload must equal the complete current canonical Story literal, not the visible shortened label.

If a deterministic implementation defect remains, fix only that proven boundary, validate, FF land, exact TEST redeploy, and replay this focused probe once on a new disposable game.

Do not pass-seek through provider sampling. A genuine Story no-tail occurrence is evidence to retain.

## 7. Restart fresh clean 30+ campaign

After Section 6 proves the Story-only choice authority deployment is correct, start a **NEW** disposable clean campaign. Do not continue the five-turn probe as the clean certification fixture.

Run 30+ committed ordinary turns after Opening with coherent human-like play:
- mix current Story choice clicks and literal Korean free input;
- one intended action/intent per turn whenever practical;
- preserve exact literal action identity through storage and Story semantics;
- sample `literal -> Story -> observer_raw -> observer_applied -> state_after -> next Story` throughout;
- inspect Story/choices/MM/location/presence/scene continuity, not only commit counts;
- capture submit -> first Story token -> Story complete -> Observer complete/fail-open -> terminal timing.

Choice quality evidence across the full campaign must include:
- total ordinary committed turns;
- count with a valid exact-four terminal Story tail;
- count with no valid Story tail;
- count where Observer matched the Story tail;
- count where Observer mismatched but canonical Story choices still survived;
- any consecutive Story no-tail streak;
- no prior/fabricated fallback occurrences.

Do not invent an acceptance result from a handful of turns. Preserve the exact reliability rate for later operator/final objective review. A Story no-tail miss alone does not justify retry/regeneration/provider-model changes while literal free input remains functional.

Natural ordinary-turn job failure may use the already accepted explicit user retry path at most once for that failed canonical turn. No repeated pass-seeking retries.

Do not wait until turn 30 to surface a deterministic product/runtime defect; stop/fix/replay narrowly when evidence is clear.

## 8. Continue existing P1 correction loop

During/after clean 30 continue immediately through:

1. Active CSA Story projection: active rules reach Story as relevant premise + selected scope.
2. Observer receives canonical actor `{id,name}` directory; no fuzzy/nearest mapping of unknown names.
3. Mind Monitor is actor-keyed for relevant current/post-Story NPCs, including newly entering relevant NPCs.
4. Canonical location across at least four distinct locations: literal -> Story -> observer raw -> observer applied -> state_after -> next Story.
5. Actor enter/exit evidence quote identifies that canonical actor; player movement quote cannot support NPC enter/exit.
6. `scene_note` is a bounded current-scene snapshot rewritten each turn; stale ended facts disappear.
7. Semantic player agency: Story may not substitute player actor, target/counterparty, action, movement/direction, request/refusal, self-state, or topic/intent.
8. Product identity: company work is life texture, not a mandatory work-assistant funnel; no invented competing app/CSA mechanics outside the canonical 9-rule `상식개변` authority.
9. Current Story choices are exact-four at high reliability; Story is sole author; Observer cannot veto; no prior/fabricated fallback; literal free input remains available.

No generic semantic classifier/NER/fuzzy mapper/physical ontology/consent DSL may be introduced to solve these.

## 9. Remaining independent campaigns / CSA / retained surfaces

After the clean 30+ campaign is stable enough to proceed:
- independent materially different 15+ turn campaign;
- long-memory 50+ turn campaign;
- dedicated clothing CSA fixture;
- dedicated request/interaction CSA fixture.

For all 9 canonical CSA templates prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC success alone is not acceptance. Institutional/system CSA premise must never manufacture personal affection, comfort, consent, desire, romance, or relationship state.

Measure latency across campaigns and derive p50/p95 when sample size is meaningful. Measure first; no retry/second Observer optimization.

Exercise retained user surfaces:
- history;
- TTS;
- download/export;
- refresh/reconnect;
- duplicate submit;
- failed-turn explicit retry;
- any canon-retained feedback/revision surface.

Required viewport evidence before owner handoff:
- desktop;
- `390x844`;
- one wider mobile/tablet viewport;
- screenshots visually inspected, not merely counted.

## 10. Safety / exit

- TEST only; no Production.
- Preserved/manual/evidence games immutable.
- No provider/model/API URL/key/secret/temperature change.
- Keep Story 30s first-content / 120s total and Observer 75s budgets unchanged.
- No automatic retry/regeneration or second Story/choice LLM.
- No migration-history repair/rewrite and no schema change for this choice correction.
- No generic semantic classifier/NER/fuzzy/nearest mapper/physical ontology/consent DSL.
- No Observer prefix stripping, whitespace/punctuation/Unicode/semantic normalization, or broad escaping adapter.
- Canonical choices may come only from the exact current Story terminal tail.
- Observer cannot create choices when Story has none and cannot veto choices when Story has a valid tail.
- No previous-turn or deterministic fabricated fallback choices.
- No browser-owned orchestration replacing A-prime server authority.
- Fast-forward only; no force-push/history rewrite.
- Re-read Issue #68 before each source landing and TEST deployment decision.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until the full objective P0/P1/P2 exit matrix is green, including clean 30 + independent 15 + long-memory 50, all 9 CSA behavioral coverage, reconnect/double-submit/failed-retry recovery, semantic agency, current-scene continuity, choice reliability, retained surfaces, and viewport evidence.

If a safety boundary or ambiguous deterministic failure is reached, post exact evidence and STOP. Otherwise continue this SAME task; do not create a replacement feature task.
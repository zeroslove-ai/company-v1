# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: P1 CHOICE LITERAL ESCAPE-PARITY CLOSURE -> CLEAN 30 -> P1 / 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 12:21 KST
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

Story is the sole choice author. Observer is not a second choice author; it may only project the current Story choices.

Do NOT add a new engine, generic semantic validator, NER/fuzzy mapper, nearest matching, physical ontology, consent DSL, second Story/choice LLM, automatic retry/regeneration, browser-owned Story/Observer/Commit orchestration, timeout inflation, or provider/model/config workaround.

TEST only. No Production access/deploy. Preserved historical/manual/evidence games are immutable/read-only.

## 1. Accepted terminal / current evidence

Accepted terminal:
- terminal comment: `5377582019`
- operator review: `5377600162`
- terminal CURRENT_TASK blob: `e6e8bfe25ad9c0d7dd7603c98d6c03ec51f3493c`
- verified main at terminal: `c5a667d9f1ba72ec6e3f8380ac638f5e3d344625`
- accepted executable lineage beneath docs registration: `1b430fb477457a654f1504b29b24122829a20f6b`

Already accepted and frozen absent new deterministic evidence:
- P0 failed-turn explicit retry / same-row attempt fencing / stage-aware stale leases;
- provider Story 30s first-content / 120s total and Observer 75s budgets;
- invocation-based Story total deadline;
- same-job reconnect transport and browser refresh/recovery;
- no provider/model/config/secret or timeout change is justified.

### Current-executable Opening reclassification

Exactly three fresh deployed-browser Setup -> Opening samples were run, one attempt each, no retry:
1. `8381ee31-87ad-4810-80d7-8aad8d21f841` committed normally; first Story 1169ms; four enabled choices.
2. `8b58ec4d-f461-44fb-a7b4-41be664bee42` received first Story at 1191ms but ended before story_complete/Observer/terminal; no durable Opening row/job; no retry.
3. `c31d771f-ac3e-4678-8edc-233bc24784a2` committed normally; first Story 999ms; four enabled choices.

The predeclared proceed rule was met: 2/3 committed inside unchanged provider bounds. Treat the prior single clean-fixture Opening failure as transient for now. Do not reopen timeout/provider/model/config policy from these results.

### Deterministic P1 blocker

Fresh clean fixture `a650e1ab-b536-41f4-a9f3-2087208ccc74`:
- Opening committed normally.
- Turn 1 clicked current Story choice index 0; committed; four buttons remained.
- Turn 2 used literal free input exactly `자리에서 주변 업무 흐름을 살피고 이메이에게 어젯밤 앱에 대해 조심스럽게 물어본다.`; committed; four buttons remained.
- Turn 3 clicked current Story choice index 1; Story/Observer/commit completed and committed_turn/revision became 3/3.
- The Story final choice literals 1 and 2 contained literal backslash-escaped ASCII quote characters (`\"...\"`).
- `observer_raw.choices` returned the corresponding unescaped ASCII quote characters (`"..."`).
- Read-only codepoint/substring comparison proved choices 1 and 2 were not exact Story substrings while 3 and 4 matched.
- Current `normalizeObserver()` therefore emitted `choices_projection_dropped`, produced `observer_applied.choices=null`, and committed no current choices.
- Frontend then rendered zero interactive action buttons even though four numbered Story choice lines existed.
- No retry/pass-seeking replay/source workaround occurred.

This is an objective P1 product defect. It is not a semantic mismatch and does not authorize fuzzy matching.

## 2. Required narrow choice-literal closure

### 2.1 Story terminal tail is the structural binding source

Keep Story as sole choice authority. Replace the current broad `storyText.includes(observerChoice)` choice check with a narrow structural binding to the current Story's terminal numbered choice tail.

Required Story-tail recognition:
- consider only the final non-empty contiguous numbered lines at the end of the current Story;
- accept only exactly four lines numbered 1,2,3,4 in order, using the already-supported `1.` or `1)` style;
- capture the exact literal text after each number from the Story;
- all four Story literals must be non-empty and distinct;
- do not search arbitrary earlier numbered lists or body occurrences as choice authority.

Do not create a generic narrative parser generation. This is a tiny structural four-line tail recognizer for the existing Story choice contract only.

### 2.2 Observer parity remains required, with one bounded transport equivalence

Observer must still provide exactly four distinct non-empty choice strings in the same order.

For each Observer choice vs its corresponding exact Story-tail literal:
- exact equality passes;
- one narrowly authorized transport equivalence also passes: the two strings may differ only by presence/absence of a backslash immediately before an ASCII double quote (`\"` versus `"`);
- compare after removing only that specific escape marker for parity purposes;
- NO other transform is permitted.

Explicitly forbidden equivalences include:
- whitespace trimming beyond the existing outer trim;
- punctuation substitution;
- Unicode normalization;
- curly quote <-> ASCII quote conversion;
- apostrophe changes;
- slash/backslash changes except the exact backslash-before-ASCII-double-quote case above;
- `\n`, `\t`, `\\`, JSON decoding, URL decoding, HTML decoding;
- case changes;
- substring/fuzzy/semantic similarity;
- nearest choice matching;
- reordering;
- deduplication/padding/truncation.

If all four pairs pass, `normalized.choices` MUST be the four **exact Story-tail literals**, preserving Story storage bytes/order. Never persist or click Observer-mutated text.

If any pair differs beyond this bounded equivalence, keep current fail-open gameplay behavior: `normalized.choices=null`, warning recorded, Story may still commit, and no current choices are fabricated.

### 2.3 Prompt clarification is secondary, not the correctness mechanism

Strengthen the Observer prompt narrowly so that if a Story choice itself contains a literal backslash before an ASCII quote, the Observer is told to preserve that literal backslash in the semantic JSON string, which may require double escaping in JSON representation.

Do not rely on prompt compliance alone. The deterministic narrow binding above is the product-correctness boundary.

Do not change Story/Observer models, provider URL/key, temperatures, token budgets, timeout values, retry counts, or add a second LLM call.

## 3. Required deterministic regression proof before live rollout

Add focused tests proving at least:

1. Existing exact four Story-tail + exact Observer choices pass unchanged.
2. Story terminal choices containing `\"quoted\"` and Observer choices containing the otherwise identical `"quoted"` form pass pairwise and normalize to the **exact escaped Story literals**.
3. The symmetric escape-marker representation case, if implemented, still returns the exact Story literal and does not widen equivalence beyond backslash-before-ASCII-quote.
4. One whitespace mutation still drops the whole choice projection.
5. One punctuation mutation still drops it.
6. Curly quote vs ASCII quote still drops it.
7. Semantic wording mutation still drops it.
8. 0 / 3 / 5 Observer choices still drop.
9. Duplicate Observer choices still drop.
10. Reordered Observer choices still drop.
11. Earlier numbered lists in Story body do not become choice authority; only the terminal contiguous 1-4 tail is bound.
12. Story with no valid terminal exact-four tail never receives fabricated choices.
13. No prior-turn choices are used.
14. Frontend receives four canonical exact Story literals and renders four actionable buttons.
15. Clicking a button sends the complete canonical Story literal unchanged, including any literal backslash character present in the Story value.
16. Short visible button labeling remains presentation-only and cannot alter the click payload.

Keep existing choice failures fail-open for gameplay. Do not add Story regeneration or fallback choice fabrication to make tests pass.

Run:
- focused Observer/choice/frontend contracts;
- full `npm` suite;
- changed JS/MJS syntax checks;
- `git diff --check`.

## 4. Landing / TEST rollout

1. Re-read the latest Issue #68 immediately before landing.
2. Land only the minimal source/test correction, fast-forward only. No new branch/recovery task/force push/history rewrite.
3. No migration or DB schema change is expected or authorized for this choice fix.
4. Deploy exact TEST API if backend source changed.
5. Deploy exact TEST frontend only if frontend source changed.
6. Record exact main SHA and Worker version identities.
7. Production remains untouched.

## 5. Focused deployed acceptance

Use fresh disposable R3 TEST games. Do not reuse `a650e1ab-b536-41f4-a9f3-2087208ccc74` as a pass fixture; it remains evidence.

Acceptance must prove ordinary current-choice functionality after the fix:
- Setup + Opening normal;
- at least one click from a current Story-authored choice;
- at least one literal free input;
- after every committed turn, Story -> observer_raw -> observer_applied -> committed choices -> current UI is inspected;
- current committed choices are exactly four or legitimately absent due a real current-Story contract failure;
- when four are accepted, UI shows four actionable buttons;
- button click submits the full canonical Story literal, not the shortened label;
- no previous-turn choices, deterministic fallback choices, or Observer-rewritten payloads.

If an actual quote-escape mismatch naturally appears, explicitly prove:
- Story exact literal;
- Observer representation;
- bounded parity classification;
- normalized exact Story literal;
- four visible buttons;
- click payload exactly equals the Story canonical literal.

Do NOT retry turns or create repeated games merely until the random quote-escape shape appears. Deterministic regression tests are the direct acceptance for that exact representation case; live play is for deployment/no-regression evidence.

If a new deterministic choice failure appears, stop and fix only the proven narrow boundary. Do not add broader normalization.

## 6. Restart clean 30+ campaign after focused acceptance

Start a NEW disposable clean campaign after Section 5 is green. Do not continue `a650e1ab...` as the clean certification fixture.

Run 30+ committed ordinary turns after Opening with coherent human-like play:
- mix current Story choice clicks and literal Korean free input;
- one intended action/intent per turn whenever practical;
- preserve exact literal action identity through storage and Story semantics;
- sample `literal -> Story -> observer_raw -> observer_applied -> state_after -> next Story` throughout;
- inspect Story/choices/MM/location/presence/scene continuity, not only commit counts;
- capture submit -> first Story token -> Story complete -> Observer complete/fail-open -> terminal timing.

Natural ordinary-turn failure may use the already accepted explicit user retry path at most once for that failed canonical turn. No repeated pass-seeking retries.

Do not wait until turn 30 to surface deterministic product defects; stop/fix/replay narrowly when evidence is clear.

## 7. Continue existing P1 loop

After/while clean 30 is stable, continue immediately through:

1. Active CSA rules actually reach Story context as relevant premise + selected scope.
2. Observer canonical actor `{id,name}` directory; no fuzzy/nearest unknown-name mapping.
3. Actor-keyed relevant Mind Monitor including post-Story entrants.
4. Four-location literal -> Story -> observer raw -> observer applied -> state_after -> next Story continuity.
5. Actor-specific enter/exit evidence tied to that actor's name; player movement cannot support NPC enter/exit.
6. `scene_note` is a bounded current snapshot, not stale accumulation.
7. Semantic player agency: actor, target, action, movement, request/refusal, self-state, topic/intent cannot be silently substituted.
8. Product identity: work is office-life texture, not a mandatory work-assistant funnel; no fake competing CSA mechanics.
9. Current Story choices remain exactly four at high reliability, mostly one action/intention each; no stale/fabricated fallback; literal free input always available.

No generic semantic classifier/NER/fuzzy mapper/physical ontology/consent DSL may be introduced.

## 8. Remaining campaigns / CSA / retained surfaces

After clean 30+ stabilizes:
- independent materially different 15+ turn campaign;
- long-memory 50+ turn campaign;
- dedicated clothing CSA fixture;
- dedicated request/interaction CSA fixture.

For all 9 canonical CSA templates prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`.

RPC success alone is not acceptance. Institutional/system CSA premise must not manufacture personal affection, comfort, consent, or desire.

Measure latency and derive p50/p95 when sample size is meaningful. Measure first; no retry/second Observer optimization.

Exercise retained history, TTS, download/export, refresh/reconnect/double-submit, failed explicit retry, and any canon-retained feedback/revision surface. Required viewport evidence includes desktop, `390x844`, and one wider mobile/tablet viewport with visually inspected screenshots.

## 9. Safety / exit

- TEST only; no Production.
- Preserved/manual/evidence games immutable.
- No provider/model/API URL/key/secret/temperature change.
- Keep 30s/120s/75s provider budgets unchanged.
- No automatic retry/regeneration or second Story/choice LLM.
- No migration-history repair/rewrite and no schema change for this choice fix.
- No generic semantic classifier/NER/fuzzy/nearest mapper/physical ontology/consent DSL.
- No broad escaping adapter; only the explicitly bounded backslash-before-ASCII-double-quote parity equivalence is authorized.
- Canonical accepted choice value must always be the exact current Story tail literal.
- No browser-owned orchestration replacing A-prime server authority.
- Fast-forward only; no force-push/history rewrite.
- Re-read Issue #68 before each source landing and TEST deployment decision.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden until P0/P1/P2 objective evidence is green, including clean 30 + independent 15 + long-memory 50, all 9 CSA behavioral coverage, reconnect/double-submit/failed-retry recovery, semantic agency, current-scene continuity, choices, and retained surfaces.

If a safety boundary or ambiguous deterministic failure is reached, post exact evidence and STOP. Otherwise continue this SAME task; do not create a replacement feature task.
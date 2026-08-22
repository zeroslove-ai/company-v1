# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: ACCEPT MM -> RECOVER CSA STORY-EFFECT HARNESS -> CLASSIFY ENTER WARNING -> FOUR-LOCATION / SCENE / AGENCY -> 15 / 50 / 9-CSA CONTINUOUS TEST LIVE-QA
Updated: 2026-08-22 14:02 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/task-registration branch, recovery branch, or alternate execution authority.

## 0. Binding authority / frozen architecture

Automation owns objective QA until the deployed exit matrix is green. `WAITING_USER_FINAL_PLAYTEST` / `OWNER_READY` is forbidden before then.

Binding authority remains:
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md`
- `docs/ops/LIVE_QA_PRODUCT_REVIEW_2026-08-22.md`
- PR #95 product canon `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- PR #96 A-prime canon `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- `docs/redesign/00_*` through `11_*`
- current reviewed R3 source on main
- latest explicit owner decisions and Issue #68 operator review

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Do NOT add generic NER, fuzzy/nearest actor or location matching, semantic classifier/gate, physical ontology, consent DSL, second Story/choice LLM, automatic retry/regeneration, browser-owned Story/Observer/Commit orchestration, timeout inflation, provider/model/config workaround, or a new parser generation.

TEST only. No Production. Preserved historical/manual/evidence games are immutable/read-only.

## 1. Accepted terminal review and current executable

Terminal reviewed:
- terminal comment: `5378035433`
- operator review: `5378066264`
- terminal task blob: `fea0bee3b6ab198789735bd8a332b53e752c482e`
- terminal/main executable: `a4608ff7710468dd34ca7858ccaaf869eb9908bd`
- registration main before execution: `7ec82a75edea195f0bf1ac6ba4c617310d8101db`

Source lineage is exactly two fast-forward implementation commits:
1. `480daad8d7255ecbc865af9f4bd4648910afd446` — actor identity / post-Story Mind Monitor closure
2. `a4608ff7710468dd34ca7858ccaaf869eb9908bd` — active CSA Story context + exact canonical destination-name Story contract

Current exact TEST deployment:
- API `game-proxy-company-r3`: `6e86c32e-22e5-400c-8bdb-9ae4ef7a639a`
- frontend preserved: `ba4812c5-3883-4a90-8b9d-5482e4ccfabf`

No Production/provider/model/API URL/key/secret/temperature/timeout/migration change is authorized.
Story budgets remain first-content 30s / total 120s; Observer remains 75s.

## 2. Frozen accepted progress — do not reopen without new deterministic evidence

### 2.1 P0 / transport

Accepted:
- explicit failed-turn retry only, same-row attempt fencing, fresh action id on explicit retry;
- stage-aware stale terminalization;
- invocation-based Story total deadline;
- same-job duplicate/reconnect/refresh behavior;
- no hidden retry/regeneration.

### 2.2 Story sole choice authority

Accepted and non-negotiable:
- current Story valid terminal numbered `1..4` tail is the sole canonical choice source;
- normalizer stores the exact Story-tail literals without the numbering prefix;
- Observer choices are diagnostic only and cannot create, repair, replace, reorder, or veto a valid Story choice set;
- `choices_observer_mismatch` is therefore **not a gameplay failure by itself**;
- if Story has no valid terminal exact-four tail, choices remain absent and literal free input remains usable;
- no previous-turn or deterministic fabricated fallback.

Do NOT add Observer `1.` prefix stripping, whitespace/punctuation normalization, semantic equivalence, fuzzy matching, or another choice adapter merely to silence a diagnostic mismatch.

Accepted clean-30 evidence remains:
- game `4debc85b-2e19-4d0b-96cb-177e7379df1e`
- Opening + 30 ordinary committed turns
- literal storage parity 30/30
- valid exact-four Story tails 16/30
- no-tail 14/30; max no-tail streak 6
- fabricated/prior fallback 0
- one natural stale turn recovered exactly once via accepted explicit retry

Do not rerun clean 30 just to improve its statistics.

### 2.3 Mind Monitor blocker is CLOSED

`480daad8...` source repair is accepted:
- clean-30 raw classification proved 30/30 Observer MM payloads were the old unkeyed `{surface,subconscious}` shape, not canonical actor keyed;
- Observer now receives compact canonical registered `{id,name}` directory;
- Observer prompt requires canonical actor-ID MM keys;
- entered/exited grounding requires registered ID + exact Story quote containing that actor's exact canonical name;
- MM eligibility is pre-turn present + grounded entered - grounded exited;
- no name->ID/fuzzy repair.

Live game `a764e547-0eaf-4917-8cc5-e96bbb370c79` proves ordinary Turns 1-5 used canonical actor-ID keys in raw/applied MM and literal parity 5/5.

The prior systemic MM 0/30 blocker is CLOSED absent new deterministic contrary evidence.

## 3. `a4608ff...` source status

`a4608ff...` is accepted as current source/test/deploy baseline:
- `runtime-r3/domain/memory.js` projects active canonical `csa_rules` into Story context once, preserving stated scope and excluding inactive rules;
- Story prompt applies only stated institutional rule content/scope and explicitly forbids deriving affection, comfort, consent, desire, romance, obedience, relationship, or player sexual state merely from activation;
- Story prompt asks for the exact canonical destination name when literal action names one;
- focused validation 42/42 PASS;
- full npm 466/466 PASS;
- syntax and `git diff --check` PASS;
- exact TEST API deployed as above.

Source correctness is accepted, but live acceptance of active-rule Story effect is still pending because the post-activation gameplay request was never actually submitted.

## 4. Correct the terminal classification before doing work

The terminal called three things failures. Treat them separately:

1. Turns 3/4 `choices_observer_mismatch`:
   - diagnostic only under Story sole-authority;
   - verify read-only that committed choices equal the exact Story-tail literals and were not erased;
   - if yes, classify `EXPECTED_DIAGNOSTIC_NONBLOCKING` and do not edit source.

2. Turn 5 `entered_projection_dropped`:
   - not automatically a bug;
   - exact-name grounding is intentionally fail-closed;
   - inspect exact `actor_id`, canonical actor name, raw quote, Story substring, normalized/applied transition, state_after, and same-turn MM before any source mutation.

3. CSA follow-up:
   - TEST HARNESS INVALID because modal remained open and no gameplay action was submitted;
   - not provider/runtime failure and not a gameplay retry;
   - recover the harness and execute the first real post-activation turn exactly once if preflight proves no Turn-6 action/job exists.

Post one `PROGRESS_HEARTBEAT` with these read-only classifications before any new source landing.

## 5. Immediate read-only preflight on disposable `a764e547...`

Before any mutation:

1. Re-read latest Issue #68 and current main.
2. Verify main is exactly/descends fast-forward from `a4608ff...`; inspect unexpected delta and STOP on conflicting execution authority.
3. Verify TEST API deployment identity is still the reviewed `6e86c32e-...`; redeploy only if stale relative to exact reviewed main.
4. Read-only inspect game `a764e547-0eaf-4917-8cc5-e96bbb370c79`:
   - current `revision`
   - `committed_turn`
   - `csa_active`
   - active rule record including template/content/mode/trigger/strength/subject_scope/counterparty_scope
   - Turn-6 job/action existence
   - Turns 3/4 Story tail, observer_raw choices, observer_applied/committed choices
   - Turn-5 Story, raw `entered` item, actor directory identity, normalized/applied transition, state_after and MM.

Expected preflight from terminal evidence:
- revision `6`
- committed_turn `5`
- `csa_active=[r3_csa_1]`
- no actual Turn-6 action/job from the invalid modal attempt.

If these differ, report the exact durable state and adapt only to what actually exists. Do not manufacture/overwrite history.

## 6. Classify the Turn-5 entered warning

For each dropped Turn-5 `entered` item:

### Correct fail-closed
If any of these are false:
- actor_id is a registered canonical actor;
- quote is an exact contiguous Story substring;
- quote contains that actor's exact canonical name;

then classify:
`CORRECT_FAIL_CLOSED_ENTER_EVIDENCE_DROP`

Do not edit the normalizer. Do not add aliases, NER, fuzzy matching, name->ID repair, or looser quote semantics.

### Actual deterministic defect
Only if all three grounding conditions are true but the item was still dropped, OR a fully grounded entrant is omitted from state/MM, then:
- isolate the exact source boundary;
- add the smallest deterministic regression;
- run focused/full/syntax/diff checks;
- FF-only land;
- exact TEST API redeploy;
- replay only the affected narrow acceptance on a new disposable game once.

Do not relax the actor-name evidence law.

## 7. Recover the active-CSA Story-effect acceptance

If read-only preflight confirms `a764e547...` still has active `r3_csa_1`, committed_turn 5, and no Turn-6 job/action:

1. Close/dismiss the stale CSA modal/harness state. Do not re-apply the rule.
2. Use the current stored active rule record to understand its exact content and scope.
3. Submit exactly ONE ordinary neutral action relevant to the scene/scope, but **do not repeat the rule text in the player action**. The Story must demonstrate the premise from `active_rules`, not because the literal action restated it.
4. Record:
   - literal action / exact storage parity
   - Story text and exact rule-effect quote
   - active rule context identity/scope used by Story
   - Observer raw/applied
   - committed state/readback
   - MM
   - choices diagnostics/canonical choices
   - timing / terminal status.
5. Acceptance requires a relevant Story effect consistent with the rule's institutional content and stated scope.
6. Activation must NOT manufacture personal affection, comfort, consent, desire, romance, relationship, obedience beyond stated institutional mechanics, or player sexual state.

This is the **first actual post-activation gameplay request**, not a retry. Do not call it pass-seeking.

If no request is created again due a harness/UI error, fix only the harness state and make one actual request. Do not sample multiple provider outputs.

If the actual Story request commits but ignores/mis-scopes the active rule, STOP with exact Story/context evidence before changing source.

## 8. Remove the same CSA rule and prove removal

After Section 7 succeeds:

1. Remove `r3_csa_1` through the normal deployed CSA authority.
2. Verify revision increases while `committed_turn` remains unchanged by the removal operation itself.
3. Verify `csa_active` no longer contains the rule and active Story context no longer contains it.
4. Submit exactly one neutral follow-up ordinary turn.
5. Verify next Story/readback no longer applies the removed rule unless the same fact is independently supported by ordinary scene continuity.
6. Keep MM/choice/literal parity checks active.

This closes one real canonical CSA apply -> Story effect -> readback -> remove -> next Story/readback sequence.

## 9. Four canonical locations end-to-end

After the CSA harness closure, use a NEW clean disposable location/agency fixture; do not use the CSA-mutated game for broad location certification.

Fetch current catalog and choose at least four distinct registered canonical locations suitable for a coherent route.

For each movement turn use one literal action naming the exact canonical destination and prove:
`literal -> Story exact canonical destination name -> observer_raw location -> observer_applied -> state_after -> next Story`

Requirements:
- at least four distinct committed canonical location IDs;
- map/context/readback agree;
- generic `회의실`, `휴게실`, etc. cannot silently substitute a different canonical destination when the literal names an exact registered location;
- no fuzzy/nearest location mapping;
- one Story contract miss is evidence; do not replay until a better sample.

Turn 1 of `a764e547...` already provides positive evidence for `brand_strategy_meeting_room`, but the fresh four-location fixture must independently establish broad current-executable reliability.

## 10. Scene presence and `scene_note`

During the location fixture and subsequent campaigns inspect:
- grounded entered/exited actor transitions;
- player movement cannot establish NPC enter/exit;
- same-turn grounded entrants may receive MM;
- exited actors do not retain MM eligibility;
- off-scene mentions do not add presence;
- `scene_note` is a bounded CURRENT scene snapshot, not an accumulating log;
- ended person/object/location facts disappear when no longer current.

If `scene_note` demonstrably accumulates stale ended facts, isolate the smallest reducer/Observer contract boundary; do not create a semantic world model.

## 11. Semantic player agency P1

Across every subsequent campaign inspect actual Story semantics, not only stored literal equality.

Story must not silently substitute:
- player actor
- target/counterparty
- action
- movement/direction
- request/refusal
- self-state
- topic/intent.

Known bad examples remain rejection patterns:
- asking to talk with one NPC but Story switches to another;
- asking to be alone while NPC interaction continues as if refused;
- touching a person's waist transformed into touching furniture.

Do not build a generic semantic gate/classifier to enforce this. Use provider contract + human-like campaign evidence and fix only deterministic structural causes when proven.

## 12. Independent campaigns after current P1 is stable

Continue this SAME continuous task without waiting for owner merely because a subsection turns green.

Required independent fixtures:
1. materially different style 15+ ordinary turns;
2. long-memory 50+ ordinary turns;
3. dedicated clothing CSA fixture;
4. dedicated request/interaction CSA fixture.

Do not certify 15/50 from the existing clean-30 game.

Long-memory acceptance must inspect:
- recent-turn continuity;
- older summary continuity after recent context rolls off;
- turn summaries/readback actually update;
- no opening-only summary freeze/mojibake;
- actor/location/relationship facts remain coherent without deterministic semantic memory invention.

## 13. All 9 CSA templates

For every canonical CSA template prove:
`apply -> revision increases while gameplay turn unchanged -> relevant scene -> Story premise/scope effect -> Observer/readback/structured state as applicable -> remove -> next Story/readback confirms removal`

RPC success alone is not acceptance.

Keep institutional/system premise separate from NPC personal:
- affection
- comfort
- consent
- desire
- romance
- relationship.

No rule activation may manufacture those personal states unless separately established by Story evidence outside the institutional rule itself.

Use separate disposable fixtures where clothing versus request/interaction scopes materially differ. Do not create one heavily mutated mega-game as the sole certification source.

## 14. Choice reliability and product identity

Preserve aggregate choice evidence:
- clean-30 exact-four rate 16/30 is an unresolved quality concern;
- do not hide it by retries/regeneration/fallbacks;
- continue recording exact-four/no-tail rates in 15/50 campaigns.

Product identity must remain adult office-life interactive fiction / character simulation:
- work is background/social texture, not mandatory productivity-assistant funnel;
- no invented competing app/CSA mechanics;
- natural non-work/social turns must remain possible.

## 15. Latency and retained surfaces

Across meaningful samples record:
- submit/request start
- response headers when observable
- first Story token
- Story complete
- Observer start/complete/fail-open
- commit terminal.

Derive p50/p95 when sample size permits.
Measure before changing anything. No second Observer/retry optimization.

Exercise retained surfaces before owner handoff:
- history
- TTS
- download/export
- refresh/reconnect
- duplicate submit
- failed-turn explicit retry
- canon-retained feedback/revision surface if present.

Required visual evidence:
- desktop
- 390x844
- one wider mobile/tablet viewport
- screenshots visually inspected, not merely counted.

## 16. Execution discipline / safety

- Re-read latest Issue #68 before every source landing and TEST deployment decision.
- Post `PROGRESS_HEARTBEAT` at major phase boundaries and at least about every 15 minutes during long live QA so Hermes does not mistake active work for a dead loop.
- Heartbeats are evidence only and do not alter execution authority.
- Natural ordinary-turn failure may use the accepted explicit failed-turn retry at most once for that failed canonical turn.
- A harness-invalid attempt where no action/job was created is not a gameplay retry, but prove absence before resubmitting.
- No retry-until-pass or provider sampling.
- No migration-history repair/rewrite.
- No Production.
- No preserved-game mutation/reset.
- Fast-forward only; no force push/history rewrite.

## 17. Exit condition

Continue until objective deployed QA is green across:
- P0 runtime/transport
- Story sole choice authority and observed reliability
- Mind Monitor
- CSA Story projection/removal
- four-location continuity
- presence/scene_note
- semantic player agency
- independent 15+
- long-memory 50+
- all 9 CSA
- latency
- retained surfaces
- desktop/mobile/tablet visual inspection.

Only then may the runner post an owner-handoff terminal.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remains forbidden before the full objective matrix is green.

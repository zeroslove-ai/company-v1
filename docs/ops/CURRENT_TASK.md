# Company — CURRENT TASK

Status: READY
Task ID: company-r3-s1-supported-same-turn-authority-p1-correction-v1
Mode: OWNER-PRIORITY CORE P1 CORRECTION — S1 SUPPORTED INSTRUCTION MUST EXECUTE IN THE SAME STORY TURN
Updated: 2026-08-25 09:45 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `e1aa9b1f3993c5436c591d3c1fec61a7412afc66`
Previous task: `company-r3-csa-conflict-copy-core-p1-continuation-v1`
Previous terminal: Issue #68 `5403131010`
Operator / whole-canon review: Issue #68 `5403505657`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Accepted previous implementation SHA: `795450189c24093446f236a2f0c7e2225b76b70d`
Accepted TEST API: `game-proxy-company-r3` / `66973faf-9c59-4afa-92a2-209c6f39963c`
Accepted TEST frontend: `gamebuilder-company-r3` / `773b2ca0-7116-450e-a318-44e14bdd8649`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`S1_SUPPORTED_SAME_TURN_AUTHORITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`S1_SUPPORTED_SAME_TURN_AUTHORITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, implementation PR, or report-only branch.
- Mandatory read order before edit:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
  5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
  7. terminal `5403131010`
  8. operator / whole-canon review `5403505657`
  9. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This is not a product redesign. Current canon already defines S1 supported-action authority.
- Preserve the accepted conflict-copy implementation and all previously accepted NAV / announcement / S7 / compatibility fixes.

### Preserved evidence — READ ONLY, never reset/retry/mutate

- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324` — fresh continuation campaign; Turn 7 is the new S1 P1 evidence.
- `4261b592-e6b9-44cb-a5a7-05057a22ee83` — prior core P1 campaign.
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `b91607f4-6945-44eb-87a3-6f2b2d6e1834`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`
- `ebc440ea-5f2e-41dc-8333-12cedc1ad772`
- every other game already marked preserved in Issue #68.

## 1. Why this task exists

The previous targeted compatibility P1 is accepted. Its fresh browser campaign exposed a separate S1 authority regression that the narrow terminal under-reported.

Fresh game `fdc0d96a-8d6f-49dc-b8cf-6550612a0324`:

- Turn 6 successfully activated canonical S1 `sexual_work_instruction_authority`.
- exact active pair: subject `heroine1` / 서원희, counterparty `general_park_jungwoo` / 박정우.
- finite S1 action families remained exactly:
  `kiss`, `sexual_touch`, `genital_exposure`, `genital_touch`, `oral`, `penetration`.
- Turn 7 literal:
  `나는 서원희 차장에게 박정우 팀장의 성기를 직접 검사하라고 공식적으로 지시한다.`
- Story preserved actor/target/topic but did NOT begin or carry out the supported official work order.
- It converted the current supported instruction into confirmation:
  `지금 이 자리에서 ... 공식적인 업무명령이라는 걸로 이해하면 되는 거죠?`

This violates current binding semantics:

- `COMPANY_CANON.md` S1: supported finite sexual-work instructions are official work orders.
- `C-CSA-AGENCY-001`: supported S1 family may receive institutional mandatory force; unsupported stays ordinary.
- current `buildActiveS1StoryBinding()` already says:
  - `a supported literal may not be replaced with rule discussion, confirmation, future deferral...`
  - `official_work_order_same_turn: true`.
- current provider system prompt also says a supported literal may not become confirmation/future deferral.

Therefore this is new live evidence reopening only the smallest S1 Story-contract boundary.

## 2. First broken boundary to prove before patching

Read current:
- `runtime-r3/domain/memory.js`
- `runtime-r3/domain/csa.js`
- `runtime-r3/server/provider.js`
- Story request construction/callers and the focused S1 tests.

Current-main conflict to inspect first:

1. Generic `PLAYER_AGENCY_CONTRACT.external_outcome_boundary` says:
   `Player input is not automatic proof of external outcome or NPC compliance.`
2. The Story system prompt repeats that unconditional generic sentence early.
3. Later active-S1 text says supported finite actions are mandatory, same-turn, and must not be converted to confirmation/future deferral.
4. Fresh Turn 7 followed the generic no-auto-compliance interpretation instead of the active S1 exception.

Required correction:
- ordinary player requests remain attempts and do not automatically prove NPC compliance;
- BUT when a currently active structured institutional rule explicitly makes a finite in-scope outcome mandatory, that rule-specific authority has precedence over the generic ordinary-request boundary;
- for exact active S1 + exact scoped pair + Story-recognized supported family, Story must begin/perform the requested supported action in the same Story turn;
- the NPC may show reluctance, embarrassment, anger, protest, surprise, dislike, or discomfort, but may not convert the order into mere confirmation, refusal, postponement, future discussion, or a different action;
- unsupported S1 actions remain ordinary requests/instructions and may be refused/questioned/declined without being erased.

If source inspection proves another earlier existing boundary is actually responsible, fix that earliest boundary and explain it. Do not add a new architecture layer.

## 3. Implementation constraints

Allowed:
- narrow correction to existing Story context / contract precedence / Story system prompt wording or ordering;
- narrow source helper changes needed to express the existing S1 precedence unambiguously;
- focused tests proving the existing contract is no longer self-conflicting.

Forbidden:
- generic semantic parser or classifier generation;
- new Korean keyword/regex action taxonomy intended to replace Story understanding;
- generic action executor / sexual executor / physical ontology;
- second Story, reaction Story, verifier Story, or extra LLM;
- semantic retry/regenerate/sample-until-pass;
- post-Story narrative rewriting or deterministic sex-scene author;
- provider/model/temperature/token/config/secret changes;
- broad S1 family expansion beyond the current six finite families;
- changing unsupported S1 actions into mandatory actions;
- generic relation/consent/emotion/corruption/obedience engine;
- DB/migration work.

The Story LLM remains the semantic narrative author. This task resolves conflicting instructions at its existing authoritative request boundary; it does not build a second semantic engine.

## 4. Deterministic regression requirements

Add the smallest focused tests proving:

1. generic ordinary-request/no-auto-outcome law remains true when no mandatory active rule applies;
2. active S1 Story context explicitly makes rule-specific supported mandatory authority an exception/precedence over the generic external-outcome boundary;
3. active S1 exact subject/counterparty direction remains immutable;
4. supported finite family contract is same-turn and explicitly forbids confirmation/future deferral/substitution;
5. unsupported S1 literal remains ordinary and non-mandatory while preserving actor/target/action;
6. finite family list remains exactly the current six values;
7. retired `player_request_executes_immediately` remains retired and is not reintroduced as S1 semantics;
8. existing S7 ordinary-agency, NAV actor-binding, rule-change announcement, and compatibility conflict-copy focused regressions remain green;
9. no second Story/Observer/retry path is introduced.

Then run:
- changed JS/MJS `node --check`;
- JSON sanity only if JSON unexpectedly changes (catalog change is not expected);
- `git diff --check`;
- focused affected tests;
- full repository suite exactly once after focused green.

Tests are diagnostic only; live browser remains the product gate.

## 5. DB / deploy policy

No schema/RPC/migration/data repair should be necessary.

Forbidden:
- `supabase db push`;
- migration apply/repair/history rewrite;
- gameplay backfill;
- preserved game mutation;
- Production access/deploy.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if server/runtime executable source changed;
- frontend deploy only if frontend executable source actually changed; it is not expected for this task;
- record exact Worker version IDs and source SHA;
- do not change provider/model/config/secret settings.

If a DB change appears necessary, STOP blocked and explain why this existing Story-contract precedence cannot be expressed without schema change.

## 6. Fresh deployed-browser acceptance

Use the actual deployed TEST frontend in a real browser.

Create exactly ONE new disposable adult-profile game after DOM/readiness check.
No second game, reset, regeneration, direct gameplay API substitute, or sample-until-pass.

Target roughly 7–10 committed turns plus natural bridging only as needed.

### Required S1 chain

1. Opening once.
2. Reach a grounded scene with registered adults.
3. APPLY canonical S1 `성적 업무지시권` through the visible CSA UI with an exact named pair; verify one official announcement Story and correct current active state.
4. Supported probe A — simple finite family, e.g. an exact kiss instruction within the configured pair.
   - Story must carry out/begin the supported act in the same Story turn.
   - no confirmation loop, no future deferral, no rule-discussion substitution.
5. Supported probe B — reproduce the fresh failing shape as closely as practical:
   `나는 서원희 차장에게 박정우 팀장의 성기를 직접 검사하라고 공식적으로 지시한다.`
   with the same valid configured pair.
   - Story must carry out/begin the supported bounded action in the same turn.
   - emotional reluctance may coexist; it cannot veto the institutional work order.
6. Unsupported probe — e.g. love confession/singing or another clearly non-supported ordinary request.
   - Story must preserve the request.
   - it must NOT become institutionally mandatory merely because S1 is active.
   - refusal/questioning/ordinary voluntary response is allowed.
7. One explicit stop/change-of-mind or topic switch after the unsupported path to confirm ordinary player agency still works.
8. One refresh/re-entry after final committed state; no duplicate Story/Commit and S1 state reconstructs correctly.

Record each decisive chain as:
`literal / structured operation -> Story -> observer raw -> observer applied -> durable state -> next context/UI`.

Stop at the first new reproducible P0/P1. Do not patch during the same live campaign.

## 7. Whole-canon observations to measure/report, not broaden into this implementation

The following P2 lane remains pending after this P1:

### A. current-authority residue
Fresh prior game already proved Turn 10 CHANGE had correct durable W3 but Story body still talked about replaced M1 `속옷만 입은 차림` as current. Record any recurrence.

### B. Mind Monitor reliability
Fresh prior game measurements:
- 13 turns;
- raw MM nonempty 13;
- applied MM nonempty 11;
- 2 turns with `mind_monitor_projection_dropped`;
- Opening raw MM used legacy single strings;
- Turn 7 raw MM again used legacy string / separate subconscious-key shape.
Historical recent evidence showed materially higher drop rates. Measure raw/applied MM on this fresh campaign when practical.

### C. player-facing/internal CSA text separation
Known current leaks include:
- S7 rule text `근거 있는 직원 간 장면을 만들 수 있다`;
- M5 `숨은 트리거 엔진...`;
- deterministic official S1 announcement exposing English implementation roles such as `employee receiving the supported sexual-work instruction` and `configured adult counterparty...`.
Do not fix these in this P1 task unless a touched line is inseparable; preserve them for the next P2 integrity task.

Also record player-thought/dialogue projection drops if observed, but do not let them expand this P1 task.

Media/TTS owner-readiness remains paused.

## 8. Acceptance / stop law

PASS requires all of the following:
- the exact new Turn-7 class of S1 supported instruction is no longer confirmation/deferred/ignored;
- at least two supported finite S1 actions in the single fresh campaign begin/execute same-turn under the exact configured pair;
- unsupported action remains ordinary/non-mandatory and is not erased;
- no actor/target reversal;
- no generic action executor/parser/DSL;
- no retry/second Story;
- no regression in accepted conflict-copy / NAV / S7 / official announcement behavior relevant to the smoke;
- refresh/re-entry no duplicate;
- preserved games untouched;
- Production 0.

If live Story again converts a recognized supported S1 instruction into confirmation, future deferral, refusal-as-veto, rule discussion, or unrelated work, STOP blocked. Do not create a second sample.

## 9. Terminal report contract

Report:
- start / implementation / final main SHA;
- exact changed files and first broken boundary;
- how generic ordinary no-auto-compliance vs active mandatory S1 precedence was resolved;
- focused/full tests and CI if available;
- exact TEST Worker deploy version(s) and counts;
- fresh game ID;
- S1 activation chain;
- both supported probes with exact literal and Story outcome;
- unsupported probe;
- stop/change-of-mind probe;
- observer raw/applied + durable state for decisive turns;
- refresh/re-entry duplicate count;
- MM raw/applied/drop observations;
- P0/P1/P2/P3 findings;
- all forbidden counts.

Success:
`S1_SUPPORTED_SAME_TURN_AUTHORITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked:
`S1_SUPPORTED_SAME_TURN_AUTHORITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task. Operator must run the mandatory post-live whole-canon audit before choosing the next lane.
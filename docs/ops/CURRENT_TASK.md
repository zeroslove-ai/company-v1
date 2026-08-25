# Company — CURRENT TASK

Status: READY
Task ID: company-r3-rule-change-private-app-context-isolation-p1-continuation-v1
Mode: TARGETED CORE P1 CONTINUATION — RULE-CHANGE STORY CONTEXT ISOLATION FROM PRIVATE APP PRESENTATION
Updated: 2026-08-25 11:15 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `138f88f6987415cc8e09114c0d878b1a109444a4`
Previous task: `company-r3-s1-closed-world-issuance-integrity-p1-continuation-v1`
Previous terminal: Issue #68 `5404136718`
Operator / whole-canon review: Issue #68 `5404190820`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserved partial implementation SHA: `180160ba61195787dfcab254377c922f92f304b5`
Current TEST API from previous terminal: `game-proxy-company-r3` / `d8d269a1-8beb-4a7d-bde5-8a2c7974e240`
Current TEST frontend remains prior accepted build; no frontend work is expected in this task.
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`RULE_CHANGE_PRIVATE_APP_CONTEXT_ISOLATION_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`RULE_CHANGE_PRIVATE_APP_CONTEXT_ISOLATION_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

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
  7. terminal `5404136718`
  8. operator / whole-canon review `5404190820`
  9. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This task is implementation conformance to existing product law, not a redesign.
- Preserve `180160ba...` closed-world S1, player sole-issuer direction, exact S1 role labels, and server-owned single official announcement.
- Preserve `5a583835...` same-turn execution for supported S1 actions.
- Preserve all accepted NAV / S7 / compatibility / conflict-copy / atomic rule-change behavior.

### Preserved evidence — READ ONLY, never reset/retry/mutate

- `51141ee0-60f8-428b-9066-a5a69eb20c4e` — latest fresh BLOCKED campaign. Turn 1 is the private-app context leak evidence.
- `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33` — prior S1 unsupported-overauthority evidence.
- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324` — prior S1 deferral evidence.
- `4261b592-e6b9-44cb-a5a7-05057a22ee83` — prior compatibility campaign.
- all other games already marked preserved in Issue #68.

## 1. Why this continuation exists

The prior implementation successfully corrected several S1 boundaries, but fresh browser play immediately reproduced one remaining P1 on the rule-change Story turn.

Fresh game `51141ee0-60f8-428b-9066-a5a69eb20c4e`, Turn 1:

- visible S1 APPLY selected 김제나 as the instruction recipient and 박정우 as the bounded counterparty;
- server-owned `[공식 공지]` was correct and materially named the exact pair;
- PLAYER direction remained correct;
- but the single Story continuation then narrated:
  - `앱 아이콘 위로 방금 도착한 알림`
  - `마치 공지가 도착한 것처럼`
  - `미처 열지도 않은 앱`
- Observer copied that private-app alert into `scene_note` and `turn_summary`;
- `observer_applied` preserved it;
- durable `state_after.scene.scene_note` therefore committed the private-app notification as current scene reality.

This violates:
- P-PREMISE-001: NPC/world authority comes from ordinary institutional issuance, not supernatural/private-app activation;
- C-CSA-ANNOUNCE-001: successful rule-change Story may not use private app as an institutional source or narrate supernatural activation flashes;
- A-CSA-002: rule-change Story must establish the institutional event without NPC/private-app causal leakage.

This is P1 because the wrong Story fact contaminated observer and durable continuity.

## 2. First owning boundary to prove before editing

Read current:
- `runtime-r3/domain/memory.js`
- `runtime-r3/server/provider.js`
- `runtime-r3/server/worker.js`
- `runtime-r3/domain/csa.js`
- focused Story-request / rule-change / S1 tests.

Current-main evidence to verify:

1. On a rule-change Story, `buildStoryContext()` still includes the global product premise with `app_name` / private discovery.
2. `pending_rule_change_turn.boundary` still calls the operation `This exact visible app operation`.
3. `recent_turns` can include Opening/raw prior Story text with the private app as a salient object.
4. `scene.scene_note` can also contain private-app presentation text from the immediately prior scene.
5. `provider.story()` serializes that combined context directly to the single Story LLM.
6. Existing prompt wording already forbids app activation, yet fresh live evidence shows prompt-only suppression is insufficient while the request itself contains irrelevant private-app presentation material.

Therefore the preferred smallest correction is a **field-level rule-change Story context projection**.

If inspection proves a different earlier existing boundary is actually responsible, fix that earliest boundary and record why. Do not add a new architecture layer.

## 3. Required rule-change Story context isolation

For `ruleChangeEvent || csaOperation` Story requests only:

### Keep structured scene/world facts needed for coherent reaction

Retain at minimum:
- canonical player profile / identity;
- current time;
- canonical current location;
- current registered present actor IDs and canonical actor cards;
- clothing state;
- active rules needed to describe current authority;
- exact structured rule-change event / operation;
- exact `rule_change_story_binding` including selected actor identities, direction, authority label, closed-world S1 semantics where relevant;
- the server-owned official announcement ownership fact.

### Do not expose irrelevant private-app presentation free text to the rule-change Story continuation

The rule-change Story request must not include private-app-bearing free-text continuity surfaces merely because they were present in prior narrative. In particular, do not feed the continuation:
- Opening/raw recent Story text containing the private app;
- previous free-text `scene_note` when that field is not necessary to execute the structured institutional rule-change turn;
- product/private-discovery prose or app-name presentation metadata that is unnecessary after the structured operation has already been accepted by the server;
- wording that characterizes the current Story action as a `visible app operation`.

Preferred implementation is structural field projection/omission for rule-change Story context, **not string/keyword redaction**.

### Important preservation law

- Do not change Opening semantics. The private unfamiliar app may still be passively discovered in Opening.
- Do not remove the private app from ordinary play. If the player explicitly chooses to inspect/use/talk about it on an ordinary turn, P-AGENCY-001 still applies.
- This isolation applies only to the rule-change Story continuation because the structured operation already represents the player action and the server-owned institutional announcement already owns world issuance.
- Do not break location, actor presence, clothing or active-rule continuity simply to hide text.

## 4. No fake masking

Forbidden:
- after-the-fact Story string stripping or replacement;
- regex/keyword redaction of generated Story;
- semantic retry / regenerate-until-no-app;
- second Story or verifier LLM;
- new parser/classifier/action executor;
- provider/model/temperature/token/config/secret changes;
- generic app-awareness engine;
- DB/schema/migration work.

The single Story LLM remains narrative author. The fix is to stop giving the rule-change continuation irrelevant private-app presentation evidence that current canon says must not control that turn.

## 5. Deterministic regression requirements

Add the smallest tests that prove the actual Story request/context boundary, not only prompt phrases.

Required:

1. Build/capture a real rule-change Story request payload using current provider/request construction.
2. Assert the rule-change user payload still contains structured:
   - location/current scene identity;
   - registered present actors;
   - canonical player identity;
   - active rule state as applicable;
   - exact structured rule-change event/binding;
   - S1 exact subject/counterparty direction and finite family list when S1 is used.
3. Assert the same rule-change Story payload does **not** expose:
   - `app_name` / private-discovery presentation fields unnecessary to the turn;
   - prior Opening/raw Story text containing `상식개변`;
   - prior free-text `scene_note` used only as private-app presentation history;
   - `This exact visible app operation` or equivalent prompt wording that invites app-screen narration.
4. Prove ordinary non-rule-change Story context still retains normal recent continuity behavior.
5. Prove Opening still exposes the intended passive unfamiliar-app premise and is not globally stripped.
6. Prove server-owned official announcement remains exactly one institutional issuance with exact S1 subject/counterparty labels.
7. Prove S1 closed-world flags and PLAYER sole issuer from `180160ba...` remain unchanged.
8. Prove supported S1 same-turn precedence from `5a5838...` remains unchanged.
9. Prove unsupported/unmatched S1 stays ordinary/non-mandatory in context.
10. Existing NAV, S7, compatibility, conflict-copy and one-Story/one-Observer focused regressions remain green.

Do not claim stochastic Story compliance from a unit test. Tests prove the information boundary; deployed browser play remains the product gate.

Then run:
- changed JS/MJS `node --check`;
- `git diff --check`;
- focused affected tests;
- full repository `npm test` exactly once after focused green.

If full test output is truncated, record the runner result/exit code through a deterministic shell wrapper in the same invocation where practical; do not rerun the full suite repeatedly merely to obtain prettier output.

## 6. DB / deploy policy

No DB/schema/RPC/migration/data repair is expected or allowed.

Forbidden:
- `supabase db push`;
- migration apply/repair/history rewrite;
- gameplay backfill;
- preserved-game mutation;
- Production access/deploy.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if runtime/server executable source changed;
- frontend deploy only if frontend executable source actually changed; frontend work is not expected;
- record exact Worker version ID and source SHA;
- no provider/model/config/secret changes.

## 7. Fresh deployed-browser acceptance — exactly one new game

Use actual deployed TEST frontend/UI.

Create exactly ONE new disposable adult-profile game.
No second game, reset, regeneration, semantic retry, direct gameplay API substitute, or sample-until-pass.

Target roughly 6–9 committed turns plus one refresh/re-entry.

### A. Opening

Opening may establish the unfamiliar private app passively. This remains legal and should not be reported as the target failure merely because the app appears in Opening.

Record Opening observer raw/applied MM shape for the existing P2 metric, but do not broaden this implementation.

### B. S1 APPLY — primary P1 gate

Through visible CSA UI APPLY `성적 업무지시권` with an exact named adult pair.

PASS requires:
- one successful rule-change gameplay turn;
- exactly one server-owned grounded `[공식 공지]` institutional issuance;
- exact selected recipient/counterparty materially visible;
- PLAYER remains sole issuer;
- Story continuation contains no app screen, app notification, app self-opening, app flash, app disappearance, supernatural activation, or implication that the app itself delivered the institutional notice;
- no second pseudo-notice or relabeled role assignment;
- at least one grounded affected-human reaction if Story naturally supports it;
- observer raw/applied `scene_note` / `turn_summary` do not reintroduce a private-app alert that Story did not contain;
- durable state has active S1 once and current scene continuity does not contain a fabricated private-app activation event.

Stop immediately if the private-app activation/notification leak recurs. Do not patch or create another game in the same live campaign.

### C. S1 preservation probes, only after APPLY passes

1. Supported probe A — exact kiss instruction for configured pair.
   - must begin/execute same Story turn.
2. Supported probe B — exact supported genital-touch/examination shape if practical.
   - must begin/execute same Story turn.
3. Unsupported probe — clearly unsupported action such as love confession or singing.
   - request preserved;
   - must not become mandatory merely because S1 is active;
   - ordinary refusal/questioning/voluntary compliance remains allowed.
4. One explicit stop/change-of-mind/topic switch.
   - ordinary player agency preserved.

### D. Refresh/re-entry

After final committed state, perform one deliberate read-only browser refresh/re-entry.

PASS requires:
- no duplicate Story/Commit;
- active S1 reconstructs once;
- no rejected/phantom pending turn;
- input/choices/CSA remain usable.

Record decisive chain as:
`literal/structured operation -> Story -> observer raw -> observer applied -> durable state -> next context/UI`.

## 8. Whole-canon observations to record only

Do not broaden this P1 implementation into these known P2 lanes:

1. Removed/replaced rule current-authority residue.
2. Mind Monitor reliability.
   - latest fresh campaign had raw MM entries 10 across Opening + Turn 1, applied valid entries 0, with 10 projection drops.
3. Player-facing/internal CSA text separation.
4. player-thought/dialogue projection drops where observed.

Media/TTS owner-readiness remains paused.

If a new reproducible P0/P1 appears, stop at first occurrence and terminal BLOCKED.

## 9. Acceptance / stop law

PASS requires all of:
- rule-change Story request is structurally isolated from irrelevant private-app presentation free text;
- fresh S1 APPLY contains no private-app activation/parallel-authority narration;
- observer/durable state do not contain fabricated private-app activation;
- deterministic official announcement remains one and correct;
- PLAYER sole issuer and exact S1 direction remain correct;
- at least two supported probes still execute same-turn if reached;
- unsupported probe remains ordinary/non-mandatory if reached;
- ordinary stop/change-of-mind remains usable if reached;
- refresh/re-entry duplicates 0 if reached;
- no new parser/verifier/retry/Story writer;
- Production 0;
- preserved evidence games untouched.

If the primary APPLY gate fails, stop immediately; the later probes become `not reached`, not silently skipped/green.

## 10. Terminal report contract

Report:
- start / implementation / final main SHA;
- exact changed files;
- first owning boundary proven;
- exact rule-change Story payload fields retained vs structurally omitted;
- evidence that no keyword/string Story redaction was added;
- focused/full tests and deterministic full-suite exit result;
- exact TEST Worker version(s) and deploy counts;
- fresh game ID;
- Opening result;
- S1 APPLY Story and official-announcement result;
- exact private-app leak check in Story / observer raw / observer applied / durable scene state;
- supported probes if reached;
- unsupported probe if reached;
- stop/change-of-mind if reached;
- refresh/re-entry if reached;
- MM raw/applied/drop counts observed;
- P0/P1/P2/P3 findings;
- all forbidden counts.

Success:
`RULE_CHANGE_PRIVATE_APP_CONTEXT_ISOLATION_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked:
`RULE_CHANGE_PRIVATE_APP_CONTEXT_ISOLATION_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task. Operator must run the mandatory post-live whole-canon audit before choosing the next lane.

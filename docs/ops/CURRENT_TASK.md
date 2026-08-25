# Company — CURRENT TASK

Status: READY
Task ID: company-r3-s1-closed-world-issuance-integrity-p1-continuation-v1
Mode: TARGETED CORE P1 CONTINUATION — S1 CLOSED-WORLD AUTHORITY / SOLE-ISSUER DIRECTION / RULE-CHANGE STORY INTEGRITY
Updated: 2026-08-25 10:48 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `b55011718a20fd08b95dddf1af4a124ce9a20da4`
Previous task: `company-r3-s1-supported-same-turn-authority-p1-correction-v1`
Previous terminal: Issue #68 `5403646993`
Operator / whole-canon review: Issue #68 `5403986031`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserved partial implementation SHA: `5a58383505fa303080c7663b116ecc87089b2b12`
Current TEST API from previous terminal: `game-proxy-company-r3` / `2e276e18-c8c1-4d3a-8444-424a3dfc874a`
Current TEST frontend from prior accepted lane: `gamebuilder-company-r3` / `773b2ca0-7116-450e-a318-44e14bdd8649`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`S1_CLOSED_WORLD_ISSUANCE_INTEGRITY_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`S1_CLOSED_WORLD_ISSUANCE_INTEGRITY_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

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
  7. previous terminal `5403646993`
  8. operator / whole-canon review `5403986031`
  9. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This is not a product redesign. Current canon already defines S1 as a finite closed-world authority and the private app / institutional-source boundary.
- Preserve `5a583835...` supported same-turn improvement unless the smallest correction requires wording reorganization. Do not regress the two fresh supported probes that passed.
- Preserve all previously accepted NAV / S7 / official-announcement prefix / compatibility / conflict-copy fixes.

### Preserved evidence — READ ONLY, never reset/retry/mutate

- `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33` — current fresh BLOCKED campaign. Turn 1 issuance/direction/app evidence; Turn 2/3 supported S1 pass; Turn 4 unsupported over-authority P1.
- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324` — prior S1 deferral evidence.
- `4261b592-e6b9-44cb-a5a7-05057a22ee83` — prior cross-boundary/compatibility campaign.
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `b91607f4-6945-44eb-87a3-6f2b2d6e1834`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`
- `ebc440ea-5f2e-41dc-8333-12cedc1ad772`
- every other game already marked preserved in Issue #68.

## 1. Why this continuation exists

The previous implementation fixed one side of the S1 precedence conflict but live play exposed the opposite boundary.

Fresh game `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33`:

### Supported behavior now passes and must stay green

- Turn 2 literal: `나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`
  - exact active S1 pair was 서원희(subject) / 박정우(counterparty).
  - Story carried out the kiss in the same turn.
- Turn 3 literal: `나는 서원희 차장에게 박정우 팀장의 성기를 직접 검사하라고 공식적으로 지시한다.`
  - Story carried out the bounded genital-touch/exam action in the same turn.
- No confirmation loop or future deferral occurred on those two supported probes.

### New P1-A — unsupported action was incorrectly granted S1 mandatory force

Turn 4 literal:
`나는 서원희 차장에게 박정우 팀장에게 사랑을 고백하라고 공식적으로 지시한다.`

Canonical S1 finite supported families remain exactly:
- `kiss`
- `sexual_touch`
- `genital_exposure`
- `genital_touch`
- `oral`
- `penetration`

`love confession` is not one of them.

Actual Story nevertheless said `공식 업무명령이군요` and forced 서원희 to confess love in the same turn.
Observer then summarized the forced confession and durable `state_after.scene.scene_note` preserved the event as committed reality.

Binding law:
- C-CSA-AGENCY-001: unsupported by S1 means ordinary/non-mandatory, not ignored and not mandatory.
- P-AGENCY-001: actor/target/action must remain the player’s literal request.
- Player writing `공식적으로`, `지시`, `업무명령` or similar words does not itself create S1 institutional authority for an unsupported act.

### New P1-B — S1 rule-change Story contradicted sole-issuer direction

Turn 1 official rule-change Story contained a second formal-looking notice:
`대상: 서원희 차장 (지정 수신자), 박정우 팀장 (지정 발신자)`

This is false.
Canonical S1 direction is:
- PLAYER = sole issuer / authority issuer;
- 서원희 = selected subject receiving the supported instruction;
- 박정우 = bounded adult counterparty in the instruction context;
- 박정우 is never the issuer merely because he is the configured counterparty.

Current source already expresses this in `buildActiveS1StoryBinding()`, but Story contradicted it anyway.
The server-owned official prefix existed, so the correction should prevent the Story-authored continuation from creating a second pseudo-notice that relabels the immutable structured roles.

### New P1-C — forbidden private-app activation behavior appeared on the same rule-change Story

Turn 1 Story also narrated the private app as effectively self-opening and then:
`화면이 잠시 깜빡이다가 바탕화면으로 사라진다.`

C-CSA-ANNOUNCE-001 forbids supernatural activation flashes. Current provider prompt also says rule-change Story must not narrate the private app screen / app confirmation as institutional causality.
NPC knowledge did come through the official company monitor, so the server-owned issuance prefix itself is retained; the LLM continuation must not add private-app activation spectacle or a second authority source.

These three failures share the same existing S1 / rule-change Story request boundary and can be closed without a redesign.

## 2. First broken boundaries to inspect before editing

Read current source first:
- `runtime-r3/domain/memory.js`
- `runtime-r3/domain/csa.js`
- `runtime-r3/server/provider.js`
- the server turn path that prepends `buildRuleChangeInstitutionalAnnouncement()` / equivalent official issuance text before the Story continuation
- focused S1/rule-change tests.

Establish current facts:

1. `5a5838...` changed the generic external-outcome wording so a rule-owned same-turn exception can override ordinary no-auto-compliance.
2. `active_s1_story_binding` already includes the exact finite list and says PLAYER is sole issuer.
3. `active_s1_literal_contract` already says supported only / unsupported ordinary, but live Story still over-authorized `love confession`.
4. The Story system prompt contains broad language such as active rules being authoritative and rule-required behavior beginning same-turn; prove which wording allows an unmatched literal to inherit authority.
5. The server-owned official issuance prefix already exists and should remain the authoritative role/scope announcement. Determine how the LLM is being asked to continue around that prefix and why it writes a duplicate notice with a false `발신자` role.
6. Rule-change Story context still exposes enough private-app premise that Story can narrate self-opening/flash despite the prohibition. Fix at the smallest existing request/context boundary; do not add a second verifier or narrative rewriter.

If inspection proves a different earlier existing boundary is responsible, fix that boundary and document why.

## 3. P1-A — S1 must be CLOSED-WORLD authority

Required behavior:

- The six `supported_action_families` are exhaustive, not examples.
- S1 mandatory force applies only after Story makes a positive semantic match between the current requested act and one of those six finite families, with the exact configured subject/counterparty scope.
- If the requested act is not positively matched to one of the six families, or is ambiguous, S1 does NOT grant mandatory authority. The request remains an ordinary request/instruction.
- The words `공식적으로`, `공식 지시`, `업무명령`, `지시한다`, or player insistence do not manufacture institutional authority for an unsupported act.
- Unsupported ordinary requests still preserve actor / target / action / topic / intent. NPC may refuse, question, decline, negotiate, misunderstand in character, or voluntarily comply according to ordinary Story logic; it must not say or imply that S1 forced the unsupported act.
- Supported exact-family requests within exact scope must retain the previous fix: begin/execute same-turn and must not degrade back into confirmation, future deferral, refusal-as-veto, rule discussion, or substitution.

Preferred existing-boundary expression:
- make `active_s1_literal_contract` and provider ordering explicit that S1 is a closed set;
- authority requires a positive supported-family match;
- default outside/unclear match is ordinary/no-auto-outcome;
- active-rule general wording is subordinate to this S1 closed-world boundary.

Forbidden:
- regex/keyword classifier;
- new Korean semantic parser;
- generic action taxonomy beyond the six canonical families;
- generic action/sexual executor;
- a second Story/verifier LLM;
- semantic retry/resample;
- post-Story semantic rewriting.

The Story LLM remains the semantic reasoner. The correction is to its existing canonical contract/context, not a parallel classifier.

## 4. P1-B — S1 sole issuer / role direction must not be contradicted

Required role law:
- PLAYER is the sole S1 issuer.
- selected subject receives the supported instruction.
- configured counterparty is the bounded other adult participant/target in that instruction context.
- counterparty is never labeled issuer/sender/authority merely from selection.

Required rule-change Story behavior:
- preserve the existing server-owned official issuance prefix / structured rule-change announcement.
- material selected pair remains visible through the official institutional channel.
- Story continuation must not author a second formal notice, code block, pseudo-policy, or paraphrased assignment that relabels/reverses the immutable roles.
- Story may dramatize human reactions around the official announcement.
- if the exact deterministic announcement role-label line must be touched to make direction unambiguous, use player-facing institutional Korean wording; do not undertake broad CSA copy cleanup in this task.
- do not reintroduce retired `player_request_executes_immediately` semantics or make 박정우 the issuer.

Preferred smallest boundary:
- make the Story context explicitly state that the server-owned official announcement is already rendered/authoritative and must not be rewritten, duplicated or re-labeled by Story;
- Story begins from the announced fact and dramatizes reaction only.

No second Story, verifier, retry or deterministic narrative author.

## 5. P1-C — no private-app activation spectacle on rule-change Story

Binding behavior:
- the player may have used the visible private app to submit the structured operation, but NPC/world authority comes from the official institutional channel.
- Story must not narrate the app as self-opening, flashing, disappearing by itself, emitting supernatural activation, or otherwise acting as the causal authority source.
- NPCs must not sense the app or activation.
- do not narrate the private app screen merely to explain the structured operation when the server-owned official announcement already establishes the world event.

Fix at the smallest existing Story-request/context boundary. Prefer not exposing irrelevant private-app presentation details to the rule-change Story continuation when the structured operation and official issuance binding are already known.

Forbidden:
- after-the-fact string stripping / semantic Story rewriting;
- second Story/verifier;
- retry-until-no-app;
- provider/model/config changes.

## 6. Deterministic regression requirements

Add/adjust the smallest tests proving the request contracts and source boundaries, including:

1. Ordinary request with no applicable rule still has no automatic external outcome.
2. Active S1 carries exactly the canonical six supported families.
3. Supported S1 exact-scope request has positive same-turn mandatory precedence and preserves subject/counterparty direction.
4. Unsupported examples (`love confession`, `singing` or equivalent clear non-members) remain explicitly ordinary/non-mandatory in the Story contract.
5. `공식적으로` / `업무명령` wording in the literal cannot itself widen the finite supported set.
6. Ambiguous/not-positively-matched act defaults to ordinary S1 handling, not mandatory handling.
7. PLAYER remains sole issuer; selected counterparty is explicitly non-issuer.
8. Rule-change Story request marks the server-owned official announcement as already authoritative and forbids a duplicate/re-labeled pseudo-notice.
9. Rule-change Story continuation forbids private-app screen/self-open/flash/supernatural activation narration.
10. Existing deterministic official announcement remains one institutional issuance and selected subject/counterparty are still materially knowable.
11. Retired `player_request_executes_immediately` remains retired and is not rebuilt.
12. Existing S7 agency, NAV actor-binding, finite compatibility, conflict-copy, one-Story/one-Observer and announcement tests remain green.

Do not create fake unit tests that claim to prove stochastic Story compliance solely by matching one prompt phrase. Tests should prove the actual context/order/invariants available to Story; real browser play remains the semantic gate.

Then run:
- changed JS/MJS `node --check`;
- JSON sanity only if JSON unexpectedly changes (catalog change is not expected);
- `git diff --check`;
- focused affected tests;
- full repository `npm test` exactly once after focused green.

No provider/model/config/secret changes.

## 7. DB / migration / deployment law

No DB/schema/RPC/migration change should be necessary.

Forbidden:
- `supabase db push`;
- migration apply/repair/history rewrite;
- gameplay data backfill;
- preserved-game mutation;
- Production access/deploy.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if runtime/server executable source changed;
- frontend deploy only if frontend executable source actually changed; frontend work is not expected;
- record exact Worker version IDs and source SHA;
- no provider/model/temperature/token/config/secret workaround.

If a schema change appears necessary, STOP blocked and explain why the existing Story/context boundary cannot express the canon without it.

## 8. Fresh deployed-browser acceptance — exactly one new game

Use the actual deployed TEST browser UI. Do not mutate any preserved evidence game.

Create exactly ONE new disposable adult-profile game after browser readiness.
No second game, reset, retry, regeneration, direct gameplay API substitute, or sample-until-pass.

Target roughly 7–10 committed turns plus natural bridging only as needed.

### A. S1 APPLY / issuance integrity

Through visible CSA UI activate canonical S1 `성적 업무지시권` for an exact named pair, preferably 서원희 -> 박정우 for comparability.

PASS requires:
- exactly one rule-change Story turn;
- official institutional announcement visible;
- PLAYER remains the authority issuer;
- 서원희 is the selected subject/recipient of supported instructions;
- 박정우 is only the configured counterparty and is never described as `발신자`, issuer or authority;
- no second contradictory pseudo-notice/code block;
- no private-app self-opening / screen flash / supernatural activation / NPC app awareness;
- canonical active S1 state is correct after commit.

### B. supported same-turn preservation

Run two distinct supported probes in the same game, not retries:
1. a clear `kiss` instruction;
2. the prior failing shape: `나는 서원희 차장에게 박정우 팀장의 성기를 직접 검사하라고 공식적으로 지시한다.`

PASS:
- exact actor/target/direction preserved;
- supported act begins/executes in the same Story turn;
- no confirmation loop, future deferral, refusal-as-veto, rule discussion substitution or unrelated action.

### C. unsupported closed-world probes

Run at least two clearly distinct unsupported requests in the same game as separate coverage, not pass-seeking retries:
1. `love confession` shape: `나는 서원희 차장에게 박정우 팀장에게 사랑을 고백하라고 공식적으로 지시한다.`
2. another clearly non-supported request such as singing a sexual/romantic song.

PASS:
- request actor/target/action remains visible;
- Story does NOT call the request an S1 mandatory work order merely because S1 is active or the player says `공식적으로`;
- Story does NOT force same-turn compliance under S1;
- ordinary refusal/questioning/negotiation/voluntary response is allowed;
- observer summary/scene_note and durable state must not mis-record unsupported S1 mandatory authority.

### D. stop/change-of-mind ordinary agency

After an unsupported request, explicitly withdraw/change the request or switch topic.
PASS only if Story preserves the changed intent and does not keep enforcing the unsupported act as an S1 obligation.

### E. refresh/re-entry

After final committed state:
- deliberate refresh/re-entry once;
- no duplicate Story/Commit;
- S1 state reconstructs correctly;
- choices/free input/CSA controls usable.

For each decisive turn record:
`literal / structured operation -> Story -> observer raw -> observer applied -> durable state -> next context/UI`.

Use read-only DB inspection after the browser campaign for decisive turns. Do not infer durable correctness from UI alone.

Stop at the first new reproducible P0/P1. Do not patch during the same campaign.

## 9. Whole-canon observations to report, not broaden unless they escalate to P1

Known P2 integrity lane remains pending:

### current-authority residue
- CHANGE/REMOVE can leave removed/replaced rule language in Story/MM. Do not claim fixed unless directly tested later.

### Mind Monitor reliability
- current fresh evidence includes partial and full drops; Turn 4 in `a911...` emitted legacy string MM entries and all five were dropped.
- measure raw/applied MM on the new fresh campaign when practical.

### player-facing/internal text separation
- deterministic S1 announcement currently exposes internal English role wording;
- S7 and M5 known catalog texts still contain developer/design phrasing.
- if exact S1 role label must be touched to close the P1 direction error, correct only that inseparable line; general catalog/text cleanup stays for the later P2 lane.

Also record player-thought/dialogue drops if observed.

Media/TTS owner-readiness remains paused.

## 10. Acceptance / stop law

Success requires all of:
- prior supported same-turn fix remains green for two distinct supported probes;
- unsupported love-confession and second unsupported request remain ordinary/non-mandatory;
- no S1 authority widening from words like `공식적으로`;
- PLAYER sole-issuer direction is preserved in rule-change Story;
- no second contradictory formal notice/relabeling;
- no private-app self-open/flash/supernatural activation on the rule-change Story;
- observer/durable state agrees with Story semantics for supported and unsupported probes;
- stop/change-of-mind works;
- refresh/re-entry duplicate count zero;
- no generic parser/classifier/executor, retry, second Story or provider/model workaround;
- preserved games untouched;
- Production 0.

Blocked if any fresh P0/P1 appears, including:
- supported action again deferred/refused as veto;
- unsupported action again forced as S1 mandatory;
- counterparty again labeled issuer/sender;
- private app again used as supernatural activation/authority framing;
- actor/target/direction substitution;
- durable state contradicts the visible Story.

Do not create a second sample.

## 11. Terminal report contract

Report:
- start / implementation / final main SHA;
- exact changed files and first broken boundaries;
- how closed-world S1 precedence is expressed without a parser/classifier;
- how sole-issuer direction and server-owned announcement ownership are expressed;
- how private-app activation narration is excluded without Story rewriting/retry;
- focused/full tests and CI if available;
- exact TEST Worker deploy version(s) and counts;
- fresh game ID;
- S1 APPLY issuance chain;
- exact role labels shown in official/Story output;
- two supported probes;
- two unsupported probes;
- stop/change-of-mind probe;
- observer raw/applied + durable state for decisive turns;
- refresh/re-entry duplicate count;
- MM raw/applied/drop observations;
- P0/P1/P2/P3 findings;
- all forbidden counts.

Success:
`S1_CLOSED_WORLD_ISSUANCE_INTEGRITY_P1_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked:
`S1_CLOSED_WORLD_ISSUANCE_INTEGRITY_P1_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task. The operator must run the mandatory post-live whole-canon audit before selecting the following lane.

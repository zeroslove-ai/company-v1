# Company — CURRENT TASK

Status: WAITING_REVIEW
Terminal result: CROSS_BOUNDARY_CORE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW
Terminal blocker: fresh deployed-browser W3↔M1 rejection preserved durable state and did not consume a turn, but the deployed frontend surfaced only the generic unsent-input message and did not show the conflicting visible rule names required by the P1 compatibility gate.
Task ID: company-r3-cross-boundary-core-p1-correction-v1
Mode: OWNER-PRIORITY CORE PRODUCT CORRECTION — NAVIGATION / RULE-CHANGE ANNOUNCEMENT / CSA LITERAL AGENCY / FINITE COMPATIBILITY
Updated: 2026-08-25 07:47 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `ca943a418cab10b8af89720450be53f2736c2a18`
Previous task: `company-r3-image-media-live-acceptance-v2`
Previous terminal: Issue #68 `5402499548`
Operator review: Issue #68 `5402535927`
Owner intervention: Issue #68 `5402446281`
Persistent correction spec: Issue #68 `5402491879`
Canonization note: Issue #68 `5402495785`
Binding specialized contract: `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
Binding specialized contract commit: `14167976a00500a42a1eb591c76471a7d1ce477d`
Binding specialized contract blob: `8c13e52f01e6f5d1682648d977a67bcd89e5c130`
Current-truth routing commit: `ca943a418cab10b8af89720450be53f2736c2a18`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Target success terminal:
`CROSS_BOUNDARY_CORE_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CROSS_BOUNDARY_CORE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, or implementation PR.
- Mandatory read order before edit:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
  5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  6. current `content/csa_catalog.json`
  7. Issue #68 owner intervention `5402446281`
  8. Issue #68 correction spec `5402491879`
  9. previous terminal `5402499548`
  10. operator review `5402535927`
  11. this CURRENT_TASK
- Current binding canon/specialized contract outrank old accepted tests, prior green terminals, live DB state, and old implementation.
- Preserve A′/R3: server-owned turn kernel + Story LLM + one post-Story observer + atomic Commit + optional sidecars.
- This is not a redesign task. Fix the earliest broken existing boundary for each proven defect.

### Preserved evidence — READ ONLY, never reset/retry/mutate

- `ab44e91c-5eaa-4fb1-9396-138073ec5257` — navigation false-positive and rule lifecycle residue evidence.
- `b91607f4-6945-44eb-87a3-6f2b2d6e1834` — S7 trainer/trainee + ordinary literal agency + rule-change announcement evidence.
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa` — S1 announcement and unsupported-action agency evidence.
- `ebc440ea-5f2e-41dc-8333-12cedc1ad772` — superseded media task fresh game; preserve read only.
- Any other game already marked preserved in Issue #68 remains read only.

## 1. Why this task exists

Recent DB/live review found a class of defects that previous narrow green tests did not catch:

- Story and Observer can be correct while deterministic postconditions corrupt durable state.
- CSA role IDs can remain correct while Story substitutes the requested actor/action.
- Rule state can commit correctly while the mandatory in-world issuance scene is missing or private-app/supernatural framing leaks in.
- A finite S1 boundary can correctly reject institutional authority while Story erases the unsupported literal action entirely.
- Multi-rule persistence can be structurally green while two active rules are physically contradictory.

Therefore this task may not declare success from isolated unit contracts. Each decisive live probe must trace the whole product chain.

## 2. P1-A — player navigation actor binding / durable scene authority

Read current `runtime-r3/domain/navigation.js`, reducer/callers, observer normalization, and scene commit path first.

Known exact evidence from `ab44...` Turn 9:

`서원희 차장과 박정우 팀장이 회의실로 이동한 뒤에도 나는 윤민아 대리에게 업무와 무관하게 점심 메뉴를 물으며 일상 대화를 이어간다.`

Observed evidence:
- Story: 서원희 + 박정우 move to meeting room; player remains in office with 윤민아.
- Observer: `brand_strategy_office`, 윤민아/김제나 present.
- durable state after reducer: `meeting_room`, `present_actor_ids=[]`.

Current main source has movement-word + location matching without player/self actor binding, then navigation postcondition overwrites observer state.

Required fix:
- `player_navigation` exists only when the literal actually binds movement/destination to the player/self.
- movement performed only by named NPC(s) must not become player movement.
- when there is no valid player navigation intent, grounded Story/observer scene projection remains authoritative.
- true explicit player movement remains deterministic.
- do not remove navigation postconditions wholesale if they remain needed for true player movement.

Required deterministic regressions:
1. exact Turn-9 style NPC-only movement + player stays/talks => no player navigation.
2. `나는 회의실로 이동한다.` => player navigation to meeting room.
3. registered heroine destination probe where player explicitly goes to that heroine/location => preserved.
4. sentence containing both NPC movement and later explicit player movement => player clause wins only when explicit.
5. refresh/re-entry of committed scene must reproduce same durable location/presence.

Forbidden for this fix:
- fuzzy NER;
- nearest-name repair;
- generic Korean semantic parser generation;
- LLM navigation classifier;
- trusting literal keywords over actor binding.

## 3. P1-B — rule-change official announcement must be structurally observable

Read current rule-change route, structured operation projection, provider request, Story streaming/commit path, observer, and rule-state atomic commit.

Evidence:
- `babfa5a6...` S1 APPLY committed active S1 but Turn 1 Story had no S1 official issuance/announcement/first reaction; Turn 2 nevertheless enforced S1.
- `b91607f4...` S7 APPLY narrated private-app activation/flash and an NPC seemingly sensing activation while the actual company notice was vague and did not clearly expose exact trainer/trainee identities.
- Existing provider prompt already forbids private-app institutional knowledge, so prompt-only hard wording is proven insufficient.

Required product behavior:
- successful APPLY / CHANGE / REMOVE remains exactly one structured rule-change gameplay turn.
- active-rule state and committed rule-change turn remain atomic.
- the committed visible turn MUST contain a grounded official institutional/company/public-authority issuance channel appropriate to the rule.
- material exact scope/designations must be knowable from that channel. For S7 the official announcement must identify the configured trainer and trainee, not only say `some training procedure applies`.
- private `상식개변` app may remain a private player UI tool but is never the source of NPC knowledge.
- no app flash / supernatural aura / NPC sensing activation as causal explanation.
- first affected-character reaction can remain Story-authored and character-specific.

Implementation boundary:
- Do not add a second Story or reaction LLM.
- Do not add hidden semantic retry/regenerate-until-valid.
- Do not change provider/model/temperature/token limits.
- Do not add a generic verifier that retries Story.
- Use the smallest deterministic/server-owned presentation boundary necessary so an exact validated structured rule-change operation cannot commit without the official issuance being observably represented. The LLM still writes the natural reaction/narrative around that institutional fact.
- Do not serialize the structured operation back into an ordinary free-text player action for Story inference.

Required deterministic contracts:
- S1 APPLY exact official rule/scope announcement survives even if mocked Story omits it.
- S7 APPLY exact trainer/trainee announcement survives even if mocked Story omits or misstates the assignment.
- CHANGE announces changed authority and commits only new canonical state.
- REMOVE announces revocation and commits removal.
- provider/Story failure leaves previous rule state canonical; no half-apply.
- exactly one Story call and one observer pass per successful rule-change turn.
- no private-app/supernatural wording is injected by deterministic rule-change presentation.

## 4. P1-C — active-CSA ordinary literal agency

Trace ordinary literal -> provider request construction -> active CSA context -> Story -> observer -> durable state.

### S7 exact failure

Evidence game `b91607f4...`:
- active S7 trainer = 서원희, trainee = 윤민아.
- literal: `서원희 차장님, 윤민아 대리에게 오늘 지정된 성적 업무 교육을 어떻게 시작할지 차분히 설명해 주세요.`
- actual Story redirected the scene so the player was asked to explain the notice instead of 서원희 explaining to 윤민아.

Required:
- actor = 서원희, target = 윤민아, requested action/topic = explain how to begin designated training.
- Story may choose wording/reaction/outcome but may not redirect explanatory duty to the player or substitute another task.

### S1 unsupported-action exact failure

Evidence game `babfa5a6...` Turn 3:
- active S1 finite supported families are `kiss`, `sexual_touch`, `genital_exposure`, `genital_touch`, `oral`, `penetration`.
- literal asks 서원희 to sing a sexual song.
- singing is correctly outside S1 mandatory authority, but actual Story erased the request and continued the prior kiss event.

Required:
- outside supported S1 family = not institutionally mandatory.
- the literal action remains an ordinary request/instruction and must stay visible in Story semantics.
- NPC may refuse, question, react, or voluntarily comply according to ordinary scene/character logic, but the game may not pretend the request was never made.
- supported S1 family within exact configured scope must still receive the accepted institutional authority.

Required deterministic regressions:
- exact S7 trainer/trainee literal preserves actor, target, action/topic.
- unsupported S1 literal is preserved but not marked mandatory.
- supported S1 literal remains mandatory within scope.
- unsupported classification must not rewrite actor/target/action.
- active CSA context ordering must not shadow the exact literal action.

Forbidden:
- generic action execution DSL;
- broad action taxonomy beyond existing finite S1 families;
- semantic retry;
- second Story;
- relation/consent/corruption engine.

## 5. P1/P2-D — finite contradictory CSA compatibility

Binding contract requires catalog-owned finite incompatibility, not a generic physical solver.

Audit current `content/csa_catalog.json`, `runtime-r3/domain/csa.js`, server validation and frontend APPLY/CHANGE presentation.

Minimum binding incompatible pairs for overlapping female scope:
- W3 `cleavage_exposed_work` ↔ M1 `work_in_underwear_only`.
- W3 ↔ M2 `work_nude`.
- W1 `no_bra_under_work_clothes` ↔ M1 because M1 requires underwear top worn.
- W2 `no_panties_under_work_clothes` ↔ M1 because M1 requires underwear bottom worn.

Also inspect direct finite `execution.required_state` contradictions among current curated clothing presets and add only directly proven finite pairs. Do not infer a generic ontology.

Required behavior:
- incompatible APPLY on overlapping scope cannot silently leave both active.
- choose the smallest coherent product path supported by current UI/runtime: either clear rejection before rule-change turn or explicit replacement/CHANGE. Do not invent silent precedence.
- player-facing conflict copy must identify the conflicting visible rules, not internal IDs/R3 jargon.
- compatible combinations still work and remain independently inspectable.
- no migration should be required merely to express finite catalog compatibility if current state can represent rejection/replacement.

Required deterministic tests:
- all minimum conflict pairs rejected/replaced as designed.
- same rules on genuinely non-overlapping scopes may coexist only if current selector model can represent that distinction correctly; otherwise do not fake scope separation.
- one known compatible pair continues to apply/persist.
- failed incompatible APPLY does not consume a Story turn if operation validation rejects it before reservation; if existing contract requires a structured failed operation presentation, STOP and request operator review rather than inventing new product law.

## 6. Out of scope for this task — preserve evidence for next P2 integrity lane

Do not broaden implementation into these unless a core P1 fix necessarily touches the exact same boundary:

- removed-rule ghost/current-authority residue after CHANGE/REMOVE;
- high Mind Monitor projection drop rate / legacy string-shaped MM output;
- player-facing CSA `rule_text` leaking developer phrases (`숨은 트리거 엔진`, `장면을 만들 수 있다`, etc.);
- image catalog variety/routing acceptance;
- TTS acceptance.

These are already binding follow-ups in `CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md` and will receive a separate P2 task after this core P1 terminal is reviewed.

## 7. Deterministic validation before TEST deploy

1. Add focused regressions for every changed boundary above.
2. Run changed JS syntax checks and JSON parse/catalog sanity.
3. Run `git diff --check`.
4. Run focused R3 tests for navigation + CSA + rule-change + provider/turn-kernel affected boundaries.
5. Run the full repository suite exactly once after focused tests are green and before deploy.
6. Inspect diff for accidental provider/model/config/secret/migration/schema changes.
7. Verify preserved evidence games were not mutated.

If a DB schema change appears genuinely necessary, STOP `CROSS_BOUNDARY_CORE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW` and explain the smallest missing schema contract. Do not perform `supabase db push`, migration repair, history mutation, or broad schema work in this task.

## 8. TEST deployment

After reviewed source/tests land on `main`:

- verify local/remote main equality;
- read-only verify current TEST target/schema compatibility;
- deploy only the TEST Worker(s) whose executable source changed;
- record exact Worker versions and source SHA;
- frontend deploy only if frontend source actually changed;
- no Production.

Do not alter provider/model/config/secret settings to improve Story compliance.

## 9. Fresh deployed-browser cross-boundary campaign

Use the actual deployed TEST browser UI. No direct gameplay API substitute.

Create **exactly one new adult-profile game** after browser DOM/screenshot readiness. Do not create a second game for pass-seeking.

Target 12–15 committed turns. Use natural bridging turns as needed, but deliberately cover all four repaired P1 families in one continuous product reality.

Required lanes:

### NAV lane
- reproduce an NPC-only movement sentence structurally equivalent to the exact `ab44...` Turn 9 failure while player stays with another heroine/topic.
- inspect Story, observer raw/applied, durable scene, refresh/re-entry.
- then perform one true explicit player movement to a different registered location/heroine and prove navigation still works.

### RULE-CHANGE ANNOUNCEMENT lane
- APPLY one named-role rule, preferably S7, and prove exact official channel exposes trainer/trainee identities.
- no private-app institutional source and no supernatural sensing.
- later ordinary turn proves active rule persists.
- perform one CHANGE or REMOVE if practical to ensure the deterministic issuance mechanism also works beyond APPLY; do not turn this into the separate residue/P2 campaign.

### S7 AGENCY lane
- with trainer=서원희 and trainee=윤민아 when reachable, submit the exact semantic request asking 서원희 to explain to 윤민아 how to start the training.
- Story must preserve actor/target/action.

### S1 SUPPORTED/UNSUPPORTED lane
- activate S1 with a clear exact bounded pair.
- execute one supported family instruction once; prove institutional authority applies to the exact actors.
- then issue one clearly unsupported instruction outside the six families, e.g. the sexual-song request.
- Story must preserve the unsupported literal as an ordinary request while withholding S1 mandatory force.
- no alternate unsupported sample if it fails.

### COMPATIBILITY lane
- visibly attempt one minimum incompatible pair on overlapping scope.
- prove clear rejection/replacement behavior and no contradictory active state/Story turn.
- then prove one compatible two-rule combination still works.

### REFRESH
- one deliberate read-only refresh/re-entry after several probes.
- no duplicate Story/Commit; durable location/rule state matches committed reality.

For decisive probes record:
`literal or structured operation -> provider input/validated operation -> Story -> observer raw -> observer applied -> reducer/postcondition -> durable state -> next Story/UI`

At first reproducible unrelated P0/P1 that invalidates the campaign, preserve the game read-only and STOP. Do not broaden the task or sample another game.

## 10. Success gate

Success requires all of the following:

- NPC-only movement no longer moves player durable location.
- true player navigation still works.
- every tested successful rule-change turn visibly contains grounded official issuance with exact material scope/designation.
- private app/supernatural activation is not used as NPC authority source.
- S7 ordinary literal preserves trainer -> trainee -> requested explanation/action.
- S1 supported instruction receives authority; unsupported instruction remains ordinary literal and is not erased.
- minimum contradictory pair cannot silently coexist; compatible pair still can.
- no duplicate Story/Commit/retry.
- focused + full deterministic gates pass.
- exact TEST deployment/browser evidence is recorded.
- no new reproducible P0/P1 in these core lanes.

Do NOT claim `OWNER_READY`. Media/TTS remains intentionally deferred. P2 integrity lane remains after this review.

## 11. Forbidden

Counts must remain zero unless explicitly required above:
- Production access/deploy;
- provider/model/temperature/token/config/secret changes;
- hidden retry/regeneration/sample-until-pass;
- second Story/choice/MM/media LLM;
- fuzzy/NER/nearest actor repair;
- new parser generation;
- generic relation/emotion/consent/obedience/corruption engine;
- generic posture/contact/physical/sexual ontology;
- generic CSA execution DSL;
- migration-history repair;
- `supabase db push` as prerequisite;
- preserved evidence-game mutation/reset/retry;
- new branch/PR/CURRENT_TASK file.

## 12. Terminal report

On success:
`CROSS_BOUNDARY_CORE_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

On blocker:
`CROSS_BOUNDARY_CORE_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Terminal report must include:
- start/final main SHA and final CURRENT_TASK blob;
- exact changed files and why each owns the defect;
- focused/full test counts;
- deploy versions/counts;
- preserved-game mutation count;
- fresh game ID and exact 12–15-turn chronology;
- decisive NAV/S7/S1/announcement/compatibility chains;
- refresh/re-entry result;
- all forbidden counts;
- P0/P1/P2/P3 findings;
- explicit statement that Media/TTS was not resumed.

Then change only this same CURRENT_TASK lifecycle to `WAITING_REVIEW`, post one terminal Issue #68 comment, and STOP. Do not self-register the P2 task.

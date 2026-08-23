# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-owner-canon-p0-agency-navigation-v1
Mode: OWNER CANON SYNC -> P0 AGENCY/NAVIGATION ROOT FIX -> TEST DEPLOY -> BARE-PUBLIC REPLAY
Updated: 2026-08-23 17:08 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5384792909`
Owner manual-play override: Issue #68 comment `5384780073`
Operator review: Issue #68 comment `5384803629`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path or an ops/recovery branch.

## 0. Binding authority and starting baseline

Highest current product authority for this task:
- explicit owner manual-play override `5384780073`; it supersedes conflicting prior L0/L1/L2/L3 assumptions;
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627` where not superseded by the owner override;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b` where not superseded by the owner override;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md` remains the QA operating policy, but its old frozen/deferred conclusions are superseded where owner comment `5384780073` explicitly changed the product decision.

Starting executable/deployment baseline:
- accepted executable/source SHA before this remediation: `2511ce2a741a769d06aae2f71996185189f30480`;
- current main checkpoint at registration: `e2c320188ff4e8ffb66bd444d3fdcb98394c69cc`;
- TEST API: `game-proxy-company-r3` version `e4317d6f-9bfe-4774-a744-90789d066d4e`;
- TEST frontend: `gamebuilder-company-r3` version `731cc702-2451-442a-895c-2d10c38dccc9`;
- no Production access or deployment is authorized.

Known open blockers that must remain tracked but are NOT all implementation scope of this cut:
- deployed same-game reset failed during the previous bare-public campaign; do not call reset GREEN;
- CSA APPLY/CHANGE/REMOVE zero-turn semantics are superseded and must later become chronological streamed enactment turns;
- Opening/player-inner-thought/Mind Monitor, high-parity CSA UI, required image/TTS sidecars, time/timeline presentation all remain owner-required follow-up work.

## 1. Owner evidence — this task's exact P0 scope

Read owner game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531` READ-ONLY. Never reset, revise, retry, or mutate it.

Confirmed defects from the owner's actual public TEST play:

### P0-A — player action/target substitution
Owner Turn3 literal:
`이메이 사원. 일단 공자룰 좀 확인해보게나`

Observed defect:
- Story did not preserve the addressed target/request or ask for clarification;
- instead it invented a voluntary player action opening/reading the CSA app.

Required invariant:
- Story may resolve ambiguity naturally, including asking/portraying clarification, but it may not replace the player's actor/target/action/topic/refusal/self-state with another voluntary player action;
- mentioning a rule/app/topic must not itself authorize opening, scrolling, reading, applying, changing, or closing the CSA app unless the player's action actually does that.

### P0-B — deterministic canonical navigation ignored
Owner Turn4 literal:
`직원 라운지로 이동한다`

Canonical destination: `employee_lounge`.

Observed defect:
- Story remained in `brand_strategy_office`;
- invented app scrolling/reading/closing actions;
- Observer retained the old location;
- Commit persisted the wrong scene;
- Turn5 continued the contaminated office worldline with 이메이 still present.

Required invariant:
- when the player explicitly chooses a uniquely resolved canonical location movement, the turn must move to that canonical destination and the resulting Story/Observer/Commit must agree;
- old-location NPC presence must not leak into the destination without actual destination-phase evidence;
- exact canonical navigation authority must not depend on the Story model deciding whether to honor movement.

## 2. Required execution sequence

### A. Sync the existing canon first
Before accepting any runtime correction:
1. inventory the EXISTING binding product/narrative/runtime contract docs already in this repository; do not create a new architecture/canon file merely to restate the owner comment;
2. update only the existing authority documents necessary to make the owner decisions explicit and non-conflicting, at minimum recording:
   - player agency/action fidelity is top-level product authority;
   - every new game is the player's first day/first arrival at the company regardless of rank;
   - player discovers the CSA app and may be curious/tempted, but using it is never a mandatory quest;
   - CSA APPLY/CHANGE/REMOVE is now a chronological streamed enactment turn, NOT zero-turn mutation (implementation deferred to the later CSA cut, but canon must be corrected now);
   - player inner thought and NPC Mind Monitor first-person requirements;
   - high-parity CSA UI and required image/TTS sidecars are not owner-ready deferrals;
3. if an older contract directly contradicts these decisions, amend/supersede that exact text rather than adding another competing authority layer.

Do not redesign A-prime. This is canon synchronization, not an architecture restart.

### B. Reproduce/classify P0-A and P0-B before source change
Use owner game only for read-only evidence. For active reproduction use fresh disposable TEST games.

Trace for each reproducer:
`submitted literal -> Story request context -> Story output -> observer raw/applied -> state_after -> committed readback`.

Determine the exact loss/substitution point. Do not assume both failures share one cause.

Inspect specifically:
- how the literal action is placed into Story context and which instructions can override it;
- whether CSA context/app state is over-salient and induces invented app interaction;
- whether R3 already has a structural/canonical navigation resolver or exact catalog authority and where its destination is lost before Story/observer/commit;
- whether observer/commit can overwrite an already resolved canonical movement with stale Story evidence.

### C. Smallest generic root correction
Fix P0-A/P0-B generically, not as two hard-coded Korean phrases.

Allowed direction:
- strengthen the existing Story action-fidelity contract with static prompt/context wording if the loss is prompt-side;
- use existing structured/canonical catalog information for exact unique location navigation;
- carry an already-resolved exact canonical destination through the existing Story/observer/commit flow so it cannot be silently converted back to the source scene;
- ensure destination-phase presence is reconstructed from valid destination evidence, not source-scene leakage.

Forbidden:
- keyword-intent parser;
- new NER/fuzzy semantic matcher;
- semantic classifier/gate;
- deterministic general-purpose action executor;
- second Story LLM or repair LLM;
- hidden retry/regeneration;
- provider/model/temperature/token-limit change;
- hard-code only `이메이` or `직원 라운지` as a special case;
- resurrect old v1/v2 generic physical/action DSL or legacy Story->Extract browser orchestration;
- unrelated CSA enactment implementation in this cut;
- unrelated reset/schema/migration fix in this cut unless the P0 source investigation proves an inseparable shared deterministic root and operator authority is obtained first.

### D. Focused regression coverage
Add/update only focused tests needed for the exact generic invariants.

At minimum cover:
1. addressed NPC/request literal cannot become unrequested player CSA-app interaction;
2. exact unique canonical location movement resolves to the destination through Story projection and committed state;
3. destination movement does not carry source NPCs without destination evidence;
4. same-location/unknown/ambiguous location text fails open without fabricated movement;
5. existing choice/free-input normal turns remain usable.

Full repository suite is not a completion criterion by itself; run it only if touched dependencies justify it.

### E. TEST-only deploy
If source changes:
- deploy only affected R3 TEST artifact(s);
- preserve current secret bindings;
- no Production;
- no migration/schema/RLS/grant/provider/model/config change.

### F. Mandatory bare-public live acceptance
Use the bare canonical frontend URL only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=`, no preseeded game_id/storage, no direct-API substitute for gameplay.

Run at least three fresh independent disposable fixtures:

Fixture 1 — owner agency motif:
- establish a scene with a registered NPC;
- send the exact owner literal `이메이 사원. 일단 공자룰 좀 확인해보게나` where valid for the created setup;
- PASS only if target/request intent is respected or ambiguity is naturally clarified, and the player does NOT spontaneously operate the CSA app unless requested.

Fixture 2 — owner navigation motif:
- from `brand_strategy_office` or another confirmed non-lounge source, submit exact `직원 라운지로 이동한다`;
- PASS only if Story + observer + committed state end at canonical `employee_lounge` and stale source NPCs do not teleport;
- refresh/re-entry must preserve the destination.

Fixture 3 — independent generic regression:
- use a different canonical location movement and a different addressed-NPC action/topic;
- verify the fix is generic rather than phrase-specific.

Then continue 5–8 ordinary human-like turns across the fixtures, including choice + free input, one refusal/self-state action, one non-work/social action, and one direct NPC follow-up. Inspect complete turn text qualitatively, not merely commit/state shape.

## 3. Acceptance criteria

This task is acceptable only if:
- owner canon decisions are synchronized into existing authority docs without creating another competing canon layer;
- exact P0-A reproducer is fixed on deployed TEST;
- exact P0-B canonical navigation reproducer is fixed on deployed TEST;
- independent generic fixture also passes;
- Story does not invent voluntary player CSA-app operation from topic mention alone;
- canonical navigation Story/observer/commit/readback agree;
- source-location NPCs do not leak into destination without evidence;
- no new agency substitution, fake identity, location/presence contradiction, blocking fallback, console/network blocker, or duplicate turn is found in the narrow replay;
- screenshots/turn transcripts are actually inspected;
- no forbidden provider/model/Production/migration changes occurred.

Do NOT claim owner-ready after this cut. The owner override explicitly requires additional remediation phases.

## 4. Next blockers after this cut

Do not implement them inside this task unless separately re-scoped after review. Preserve them explicitly in the terminal report:
1. CSA APPLY/CHANGE/REMOVE chronological streamed enactment-turn implementation and anti-hijack/private-emotion boundary;
2. Opening first-arrival motivation + player inner thought + first-person character-specific Mind Monitor + choice diversity/time progression;
3. high-parity Company-v1 donor CSA UI;
4. required approved-media image projection + character-aware server TTS;
5. deployed same-game reset integration failure from previous terminal;
6. timeline/current-scene UI residuals and holistic owner-style product acceptance.

## 5. Completion report

Post to Issue #68:
- exact canon docs changed and what conflicting authority was superseded;
- P0-A and P0-B root causes separately;
- executable source SHA and changed paths;
- focused/full test results actually run;
- TEST artifact version IDs deployed;
- three bare-public fixture IDs and exact submitted literals;
- literal -> Story -> observer -> committed state findings;
- refresh/presence evidence for navigation;
- screenshots/transcript qualitative review;
- any remaining objective defect;
- confirmation that reset and later owner-remediation phases remain open.

Then set this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK yourself.

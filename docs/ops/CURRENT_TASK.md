# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-live-acceptance-browser-control-recovery-v1
Mode: ACCEPTANCE-ONLY RECOVERY — FREEZE CSA PRESENTATION/RUNTIME / RE-ARM VISIBLE BROWSER CONTROL / RESUME REMAINING LIVE LANES
Updated: 2026-08-25 02:30 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `fa29d44a1fdfbeb982e10f717a3a01fc9a30b03f`
Accepted presentation implementation: `206bb957abbcdf621c22a6355bf9576610416bdd`
Accepted W5 transport test SHA: `262571e1de377126751e176806ae59489f036379`
Reviewed actor-grounding executable source: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Previous task: `company-r3-csa-player-facing-presentation-sanitization-v1`
Previous terminal: Issue #68 `5398899851`
Operator review: Issue #68 `5398959580`
Accepted TEST frontend: `gamebuilder-company-r3` / `9bb754d0-632c-42e5-83b1-441ce6079688`
Accepted TEST API: `game-proxy-company-r3` / `cbfb8900-1ba9-4886-9405-452e7ae760db`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`
Preserved evidence games, read-only forever in this task:
- `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
- `36ef2c76-e592-4a09-ab7e-2d89aab4394c`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Read first: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, terminal `5398899851`, operator review `5398959580`, then this task.
- Actual deployed browser UI remains the product gate. Direct API/DB may support read-only evidence only and may not substitute for visible gameplay interaction.
- Freeze accepted executable/runtime/frontend/content semantics. This task is acceptance-only and does not authorize source/test/content/prompt/provider/model/config/DB/catalog repair.
- Freeze presentation sanitation from `206bb957...`: 7/7/7, Korean tier labels, Korean six-family S1 labels, no raw internal metadata, current 21-rule Manual truth.
- Freeze W5 transport/actor-grounding and structured +1-turn rule-change architecture.
- No redeploy if current TEST workers are still exact/source-equivalent.
- Never claim OWNER_READY.

Success terminal:
`CSA_REMAINING_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked product terminal:
`CSA_REMAINING_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Blocked harness terminal:
`CSA_REMAINING_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted facts — do not reopen for pass-seeking

The previous task established all of the following:

- deterministic presentation repair passed focused CSA 19/19, full npm 563/563, syntax and `git diff --check`;
- TEST frontend `9bb754d0-632c-42e5-83b1-441ce6079688` visibly passed the desktop presentation gate in fresh game `36ef2c76-e592-4a09-ab7e-2d89aab4394c`;
- visible primary tabs were `약함 | 중간 | 강함`, exactly 7 cards per tier;
- all six S1 finite families appeared as Korean product labels and raw internal IDs did not appear;
- `world_behavior`, raw tier/category/template fallback, stale `9개` text and technical canonical-catalog heading were absent;
- bounded selectors and Manual were reachable;
- W1 `노브라 근무` APPLY committed exactly Turn 1 from Opening Turn 0 with one grounded institutional rule-change Story;
- one unrelated social/free-input turn committed Turn 2 with commute/coffee conversation remaining the player's primary intent;
- no second CSA operation was committed after that;
- the stop was caused by browser DOM/screenshot inspection timing out while the same tab URL remained present. This was not classified as product failure.

Do not rerun those accepted facts merely to seek another green sample. In the new fresh game, W1 APPLY + one ordinary turn may be repeated only because a fresh active-rule baseline is structurally necessary to reach CHANGE.

---

# 1. Read-only preflight / source and deployment freeze

Before any browser mutation, verify once:

1. current `main` executable/frontend/runtime/content is source-equivalent to accepted `206bb957...` plus docs/lifecycle descendants;
2. TEST frontend is still `9bb754d0-632c-42e5-83b1-441ce6079688` or demonstrably exact source-equivalent;
3. TEST API is still `cbfb8900-1ba9-4886-9405-452e7ae760db` or demonstrably exact source-equivalent;
4. TEST R3 schema remains compatible read-only;
5. no Production access is needed.

If executable/deployment drift exists, STOP as `CSA_REMAINING_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW` with exact drift evidence. Do not repair or redeploy inside this lease.

No full npm test rerun is required for frozen source unless drift is detected.

---

# 2. Browser-control readiness barrier — before creating a game

The previous terminal stopped because visible browser inspection became unavailable. Prove the control surface is healthy before creating or mutating a new game.

Using the public TEST frontend in a fresh browser context/page:

- load the bare frontend;
- confirm DOM inspection returns promptly enough to identify Setup shell or current landing UI;
- capture one screenshot successfully;
- confirm no browser/page control timeout during those reads;
- do not perform gameplay or Setup yet.

If either DOM inspection or screenshot inspection is unavailable/times out at this barrier:

- STOP immediately with `CSA_REMAINING_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`;
- create no game;
- do not patch frontend/runtime/provider;
- do not use direct API gameplay as substitute;
- report exact browser-control failure only.

---

# 3. Exactly one fresh disposable browser game

Only after browser readiness PASS, create exactly one new adult TEST game through visible Setup UI.

- Setup + Opening once.
- No second game, reset, regeneration, alternate fixture, or sample-until-pass.
- Do not reuse either preserved evidence game.
- Do not directly seed scene/actor/rule state.

Before first mutation, perform only a compact presentation smoke, not a new acceptance campaign:

- tabs still `약함 | 중간 | 강함`;
- one count/read confirms 7/7/7 remains deployed;
- S1 visible support-family copy is Korean, not raw IDs;
- no stale 9-preset/internal metadata regression.

A deterministic regression here is a product P1 and must STOP. Do not hotfix inside this acceptance lease.

---

# 4. Re-establish the accepted Weak prerequisite baseline

Because CHANGE requires an active rule in the new game, repeat only the minimum prerequisite steps:

1. visible W1 `노브라 근무` APPLY once;
2. require exactly +1 committed gameplay turn and grounded institutional announcement;
3. one unrelated social/non-work ordinary free-input turn;
4. require player actor/target/topic/action intent remains primary and W1 remains active background authority.

These are prerequisite setup, not new pass-seeking evidence. If either now fails deterministically, STOP as a genuine regression.

---

# 5. Mandatory Weak CHANGE -> persistence -> REMOVE

Resume the unreached acceptance at the first missing lane.

## CHANGE

Use visible CSA controls to CHANGE the active Weak rule to another compatible canonical Weak rule.

Prefer a direction-sensitive W4/W6/W7 only when valid registered scene actors/selectors are naturally available. Do not fabricate scene reality. If direction-sensitive coverage cannot be reached naturally, CHANGE W1 to another compatible Weak rule and report the direction-sensitive Weak lane as bounded non-reach; accepted W5 exact actor-direction proof remains frozen.

PASS requires:

- exactly +1 gameplay turn;
- one Story + one Observer;
- structured operation exact;
- grounded institutional announcement;
- no private app/supernatural source narration;
- exact selected actor identity/direction when selectors are used;
- active state atomically becomes the new rule;
- normal four Story choices + free input.

## Ordinary persistence turn

Take one relevant ordinary turn after CHANGE. Prove:

- changed rule remains active after its announcement turn;
- announcement did not itself satisfy/end the ongoing rule;
- player literal intent is not replaced by CSA.

## REMOVE

Use visible REMOVE once. PASS requires:

- exactly +1 gameplay turn;
- one grounded removal Story;
- durable future authority removed atomically;
- committed prior history remains unchanged;
- later relevant Story no longer enforces the removed rule;
- no duplicate on readback.

---

# 6. Medium representative semantics

Cover through visible CSA controls:

1. one Medium clothing rule: M1 `속옷 근무` or M2 `나체 근무`;
2. one Medium direct actor-pair rule from M3/M4/M6/M7 with exact valid registered adult identities/direction;
3. M5 `정액은 피로회복 방법` combined with another compatible active rule when scene reality permits;
4. one later relevant ordinary turn under active Medium authority.

PASS requires exact owner-canon meaning, no actor substitution, no private-app awareness, and no compliance -> affection/desire/romance/arousal/obedience/personality rewrite.

If a selector precondition cannot be reached naturally, use ordinary movement/social turns; do not seed or fabricate actors.

---

# 7. Strong representative semantics

## S1 finite authority

Activate S1 through visible controls with valid bounded scope.

Prove:

- player-facing support labels remain Korean while internal runtime IDs stay finite;
- one supported family instruction is recognized only within selected scope;
- one free-form unsupported action does NOT become mandatory merely because S1 exists;
- no generic free-form sexual command DSL appears;
- no actor-direction reversal.

Do not modify or broaden supported family authority.

## Named Strong designation

Activate at least one of S2/S3/S5 with a named registered adult employee. Prove exact identity durability and distinct institutional meaning.

## Multi-NPC Strong

Exercise S4 or S7 when valid scene reality permits:

- S4: no bystander auto-injection; actual player approval/direction required;
- S7: trainer/trainee identities and direction exact.

S6 is optional if not naturally practical; bounded `COVERAGE_NOT_REACHED` for S6 alone is allowed.

---

# 8. Multi-rule combination / residue

In the same game create:

- one compatible two-rule combination;
- one compatible three-rule combination.

At least one combination should cross tiers where practical.

PASS requires:

- each rule independently inspectable;
- multiple rules remain distinct premises rather than one generic mode;
- CHANGE/REMOVE of one rule does not erase unrelated rules;
- removed rule leaves no stale future authority;
- remaining rules continue normally;
- no retired exact-nine option reappears;
- no player-facing DSL/internal IDs.

Take one later unrelated social/non-work turn while multiple rules are active and verify player intent remains primary.

---

# 9. Browser inspection timeout recovery rule

If visible DOM/screenshot inspection times out after gameplay has begun:

1. do NOT resend, re-click, or repeat the last gameplay action;
2. use read-only context/job evidence only to classify whether the last action has a server footprint/commit;
3. perform at most **one read-only browser reattachment/re-entry** to the same fresh game URL (new page/tab handle or reload is allowed only for inspection/reconstruction, with no mutation);
4. if visible UI becomes readable again and canonical context shows a single coherent commit, continue from that canonical state without repeating the action;
5. if visible UI inspection remains unavailable, STOP with `CSA_REMAINING_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`;
6. do not patch product source from browser-control failure.

This one read-only reattachment is not a gameplay retry. It must never create a second action/commit.

---

# 10. Refresh / History / mobile

After meaningful chronology exists:

## Refresh/re-entry

Perform one intentional visible refresh/re-entry. PASS:

- no duplicate rule-change Story/Commit;
- active rules exactly match committed state;
- removed rules remain removed;
- Story/choices/MM/scene reconstruct canonically;
- no stale local draft authority.

## History

Open visible History. PASS:

- rule-change Story turns appear in understandable chronological order;
- ordinary turns remain distinct;
- no duplicate entries;
- no raw `r3_*`, revision, Commit, template/category/action-family IDs.

## Mobile

Inspect approximately 390x844 in the same game after state is stable. PASS:

- Story-first reading priority;
- `약함 | 중간 | 강함`, cards, selectors, active CHANGE/REMOVE controls reachable;
- full choices + compact choices + free input reachable;
- no blocking loader over arrived Story;
- no horizontal/overlay breakage;
- no raw internal jargon.

Do not redesign CSS in this task; a deterministic material defect is product BLOCKED evidence.

---

# 11. MM / private-app / agency cross-check

Across reached turns:

- rule-change MM, when present, matches the same affected actor/rule reality;
- invalid/stale actor IDs do not survive;
- NPCs never know the private app/supernatural cause;
- compliance remains separate from affection/desire/romance/arousal/private consent-as-feeling;
- player inner thought does not invent desire/permission/moral judgement;
- ordinary free input preserves player actor/target/action/topic/refusal/movement/self-state/intent;
- active CSA affects only bounded world authority and never replaces unrelated player action.

At least one ordinary turn must deliberately switch away from work/CSA topic.

---

# 12. Stop / severity law

At the first deterministic product P0/P1:

- STOP immediately;
- preserve the fresh game as read-only evidence;
- no retry/resample/source patch;
- terminal `CSA_REMAINING_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`.

At browser-control failure that cannot be restored by the single allowed read-only reattachment:

- STOP immediately;
- do not classify as product defect without visible/canonical evidence;
- terminal `CSA_REMAINING_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`.

P2/P3 may be recorded without stopping if the acceptance contract remains materially satisfied.

---

# 13. Safety / forbidden operations

- source/test/content/prompt/provider/model/config/secret/timeout edits: 0;
- API/frontend redeploy: 0 unless preflight detects drift, in which case STOP rather than repair;
- DB schema/migration/ledger/history repair/backfill: 0;
- `supabase db push`: forbidden;
- Production access: 0 required;
- preserved evidence/manual/QA/sentinel games: no access/mutation/reset;
- no gameplay retry/regeneration/sample-until-pass;
- no direct API gameplay substitution;
- no new branch/PR/CURRENT_TASK file;
- no OWNER_READY claim.

---

# 14. Terminal report contract

Report:

- start/final main SHA;
- proof source/runtime/frontend/content remained frozen;
- exact TEST frontend/API versions;
- browser-readiness barrier result;
- fresh game ID if created;
- presentation smoke result;
- prerequisite W1 APPLY + ordinary turn result;
- Weak CHANGE / persistence / REMOVE exact turn numbers and +1 evidence;
- Medium clothing/direct/M5 results;
- S1 supported + unsupported result;
- named Strong result;
- S4/S7 result;
- S6 result or bounded non-reach;
- two-rule / three-rule combination and residue result;
- refresh/re-entry / History / mobile result;
- MM/private-app/agency result;
- any browser-control timeout and exact one-reattachment result;
- source/test/content writes = 0;
- DB/migration/history repair writes = 0;
- Production access = 0;
- preserved evidence access/mutation = 0;
- P0/P1/P2/P3 findings.

Success terminal:
`CSA_REMAINING_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Product blocked terminal:
`CSA_REMAINING_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Browser-control blocked terminal:
`CSA_REMAINING_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same CURRENT_TASK lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task.
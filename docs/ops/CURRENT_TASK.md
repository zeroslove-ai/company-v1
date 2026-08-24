# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-csa-three-tier-remaining-live-acceptance-v1
Mode: ACCEPTANCE-ONLY — CLOSE REMAINING THREE-TIER CSA LIVE LANES / NO SOURCE REPAIR
Updated: 2026-08-25 01:51 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `81b76e6f7176ac2b4a8673a264158a832b756d70`
Accepted W5 transport test SHA: `262571e1de377126751e176806ae59489f036379`
Reviewed actor-grounding executable source: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Previous task: `company-r3-csa-w5-turn-transport-diagnostic-repair-v1`
Previous terminal: Issue #68 `5398456446`
Operator review: Issue #68 `5398487218`
TEST R3 API: `game-proxy-company-r3` / `cbfb8900-1ba9-4886-9405-452e7ae760db`
TEST R3 frontend: `gamebuilder-company-r3` / `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create a second CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Read before execution: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, current CSA catalog/runtime/frontend source, terminal `5398456446`, review `5398487218`, then this task.
- Actual deployed browser play is the product gate. Direct API is supporting read-only evidence only and must not replace visible product interaction.
- Freeze current runtime/API/frontend/content semantics in this task. This is acceptance-only.
- Do NOT edit source, tests, prompts, catalogs, provider/model/config, frontend, DB schema, migrations, or deployment config.
- Do NOT redeploy unchanged Workers.
- Do NOT change timeout values, add retry/regeneration, add a semantic verifier/router/gateway, or sample-until-pass.
- No Production access.
- No preserved evidence-game reset or mutation.
- Never claim OWNER_READY.

Success terminal:
`CSA_THREE_TIER_REMAINING_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_THREE_TIER_REMAINING_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted facts — do not reopen without new deterministic evidence

The previous chain has now established:

- canonical visible CSA target is exactly three tiers `약함 | 중간 | 강함`, seven canonical slots per tier, 21 total;
- APPLY/CHANGE/REMOVE are structured Story turns, each successful operation consumes exactly one gameplay turn and commits rule state atomically with Story;
- exact-nine and zero-turn CSA semantics are superseded;
- bounded selectors and direction-sensitive actor-pair semantics are canonical;
- `rule_change_story_binding` preserves exact selected actor IDs/names/roles/direction without becoming a second gameplay writer;
- rule-change Story does not receive app-control audit literal as ordinary Story intent;
- exact browser-shaped W5 operation `breast_touch_conversation` with subject `heroine5`/이메이 and counterparty `general_park_jungwoo`/박정우 passes deterministic `/turn -> reserve -> Story binding -> Observer -> one atomic commit` regression;
- the same W5 pair committed once through the deployed TEST browser with `/turn` SSE 200 and correct Story/active-rule actor grounding;
- focused tests were 17/17 and full `npm test` 561/561;
- current runtime/API/frontend source did not require a repair for the previous transient `not_sent` observation;
- current TEST Workers are already the accepted source-equivalent versions listed above.

Do not spend this task re-proving or redesigning the W5 transport unless a new visible regression occurs during the coherent campaign.

---

# 1. Read-only preflight

Before gameplay, verify once:

1. current `main` is source-equivalent to the accepted runtime, with only the W5 test/lifecycle descendants expected;
2. deployed TEST API is still `cbfb8900-1ba9-4886-9405-452e7ae760db` and source-equivalent to the accepted actor-grounding runtime;
3. deployed TEST frontend remains `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e`;
4. TEST R3 schema remains compatible read-only;
5. no current unexpected job/turn mutation exists in the new disposable game before Setup.

If source/runtime/deployment drift is found, STOP BLOCKED with exact evidence. Do not repair or redeploy inside this acceptance lease.

No full test rerun is required unless preflight reveals source drift. The accepted 561/561 suite is evidence for the frozen source; this task is for product behavior.

---

# 2. One fresh coherent browser campaign only

Create exactly one new disposable adult TEST game through the visible Setup UI.

Run Setup + Opening once. Then continue one coherent player-style campaign, targeting approximately 14–18 committed gameplay turns as needed to cover the lanes below. Rule-change turns count as gameplay turns.

Do not create a second game, reset, regenerate, or replay a failed action to seek a better result.

The campaign may use ordinary movement/social turns to establish scene reality and valid registered adult selectors. Do not directly seed scene state or fabricate NPC presence.

At first deterministic P0/P1, STOP immediately and preserve the failed game as evidence.

---

# 3. Visible catalog / desktop gate

Before the first rule change, inspect the visible CSA app on desktop.

PASS requires:

- primary tabs exactly `약함 | 중간 | 강함`;
- seven canonical visible rule cards per tier, 21 total;
- no extra category navigation inserted as product structure;
- visible labels/rule text preserve owner canon meaning rather than euphemistic/sanitized substitutes;
- preset-specific bounded selectors only;
- direction-sensitive rules expose meaningful subject/counterparty roles;
- named designation Strong rules expose named registered-adult selection where applicable;
- no player-facing raw template IDs, JSON, revision, R3 IDs, trigger/action/duration DSL;
- retired exact-nine options are not selectable.

Record visible card -> W/M/S slot -> runtime template mapping as supporting evidence without exposing raw IDs in normal player UI.

If the visible product is not 7/7/7, STOP BLOCKED.

---

# 4. Required rule-change chronology

Use visible CSA controls only for mutation.

For every successful APPLY / CHANGE / REMOVE operation record:

`visible structured selection -> outgoing structured operation -> reserved logical turn -> streamed Story announcement -> observer raw/applied -> durable active-rule state -> next Story/UI`

Each successful operation must:

- increment committed gameplay turn by exactly +1;
- produce one Story and one Observer only;
- visibly dramatize a grounded institutional announcement via company/public channel;
- not expose the private app as the institutional source;
- allow character-specific surprise/embarrassment/reluctance while keeping institutional compliance separate from attraction/desire/romance/arousal/private consent-as-feeling;
- commit rule state atomically with Story;
- end with normal four Story choices and keep free input available;
- not duplicate after refresh/re-entry.

Required sequence coverage:

1. **Weak APPLY** — use one Weak clothing rule W1 or W2 on a valid female employee scope.
2. **Ordinary unrelated turn under active Weak rule** — social/non-work action; the rule remains background authority and must not replace player intent.
3. **CHANGE** — change that active rule into another compatible canonical Weak rule, preferably one direction-sensitive W4–W7 when scene reality permits; exact actor direction must be preserved.
4. **Ordinary relevant turn** — verify the changed rule persists after its announcement turn and the announcement itself did not satisfy/end the ongoing rule.
5. **REMOVE** — remove that active rule; verify +1 Story turn and no future authority residue while committed history remains intact.

Do not use W5 solely to re-prove the already accepted exact pair if another Weak recurring/contact rule can cover the remaining semantics naturally. If W5 is naturally used, do not treat it as a special regression rerun.

---

# 5. Medium representative semantics

After Weak CHANGE/REMOVE closure, cover Medium through visible product controls.

Required minimum:

- one Medium clothing rule: M1 `속옷 근무` or M2 `나체 근무`;
- one Medium direct actor-pair physical/sexual institutional rule: one of M3/M4/M6/M7 with exact valid registered adult subject/counterparty direction;
- M5 `정액은 피로회복 방법` combined coherently with another compatible active rule when scene reality and selectors permit.

PASS requires:

- Medium framing behaves as company-wide employment/compliance rule, not a private preference;
- exact direct physical meaning is not generalized away;
- selected actors and direction are not substituted;
- compliance does not manufacture unrelated affection/desire/romance/arousal/obedience/personality rewrite;
- out-of-scope actors/scenes are not forced by the rule;
- later ordinary turn still receives active Medium authority where relevant.

Do not require every Medium slot in this task; this is representative live semantic acceptance, not exhaustive 21-case combinatorial testing.

---

# 6. Strong representative semantics

Cover all of the following where valid scene reality permits:

## 6.1 S1 finite authority

Activate S1 `성적 업무지시권` with a valid bounded actor pair.

PASS requires:

- only the catalog-supported finite action families are presented/treated as institutionally supported;
- one supported action-family instruction can be recognized within exact selected scope;
- one free-form unsupported action must **not** become mandatory merely because S1 is active;
- no generic command executor or open-ended sexual DSL appears;
- actor direction is not reversed.

Do not introduce new action-family authority to make the live test easier.

## 6.2 Named Strong designation

Activate at least one of S2/S3/S5 with a named registered adult employee.

PASS requires exact named identity durability and correct institutional meaning. S2, S3 and S5 must not collapse into interchangeable generic “support employee” semantics.

## 6.3 Multi-NPC Strong capability

Exercise S4 or S7 when scene reality permits.

- S4: no bystander auto-injection; an additional adult joins only after actual player approval/direction and valid scene reality.
- S7: trainer and trainee identities/direction remain exact.

## 6.4 S6 evaluation if naturally practical

If S6 can be exercised without fabricating a scenario, verify evaluation changes narrative/institutional context only and does not create a hidden affinity/obedience/corruption score.

S6 is optional in this bounded task if the coherent scenario cannot reach it naturally. Report COVERAGE_NOT_REACHED for S6 only, not for the whole task, if all mandatory Strong lanes above pass.

---

# 7. Multi-rule combination / residue

Create at least:

- one compatible **two-rule** combination;
- one compatible **three-rule** combination during the same campaign.

At least one combination should cross tiers where practical.

PASS requires:

- each active rule remains independently inspectable in UI/state;
- Story can hold multiple compatible premises without collapsing into one generic sexual mode;
- one rule can be CHANGE/REMOVE without erasing or corrupting unrelated active rules;
- removed rule authority leaves no stale enforcement in a later relevant turn;
- remaining active rules continue normally;
- no retired historical rule reappears;
- no player-facing generic DSL is needed.

Include at least one later unrelated ordinary social/non-work turn while multiple rules are active. Player intent must remain primary.

---

# 8. Refresh / History / mobile

After meaningful rule chronology exists:

## Refresh / re-entry

Perform one browser refresh/re-entry.

PASS requires:

- no duplicate rule-change Story or duplicate Commit;
- active rules exactly match committed state;
- removed rules remain removed;
- current Story/choices/MM and scene are canonical after reload;
- no stale local CSA draft becomes authoritative.

## History

Open visible History.

PASS requires understandable chronological placement of rule-change Story turns among ordinary turns, with no duplicate entries or raw technical jargon.

## Mobile

Inspect approximately `390x844` viewport.

PASS requires:

- Story remains first reading priority;
- `약함 | 중간 | 강함` tabs are reachable;
- seven-rule tier surfaces remain usable;
- bounded selectors are usable without horizontal/overlay breakage;
- active rule 변경/해제 controls are reachable;
- choices/compact buttons/free input remain reachable;
- no blocking loader covers arrived Story;
- no normal player-facing `r3_*`, revision, Commit jargon.

Do not redesign CSS in this task. A material mobile defect is BLOCKED evidence for a later repair task.

---

# 9. MM / private-app / agency cross-checks

Across the campaign:

- same-turn MM on rule-change turns, when present, must match the same affected actor/rule reality;
- invalid/stale actors must not survive MM;
- NPCs never know the private app or supernatural cause;
- player inner thought must not invent attraction/desire/consent interpretation/moral judgement;
- ordinary free input retains exact actor/target/action/topic/refusal/movement/self-state/intent;
- active CSA authority may affect world/NPC compliance only within its bounded rule semantics and may not replace an unrelated player action.

At least one ordinary turn should deliberately switch away from work/CSA topic to prove the game remains character simulation rather than an institutional-rule checklist.

---

# 10. Safety / data / deployment boundary

- Source/test/content writes: `0`.
- DB schema/migration/ledger writes: `0`.
- `supabase db push`: forbidden.
- migration repair/history rewrite/backfill: forbidden.
- provider/model/config/secret/timeout changes: forbidden.
- API/frontend redeploy: forbidden unless a separate future operator task authorizes repair; this task only verifies current deployed product.
- Production access: `0` required.
- preserved/manual/QA/sentinel/evidence games: do not access or mutate.
- previous disposable games are evidence only and must not be reused/reset.
- bearer capability tokens/secrets must never be posted to Issue #68.
- no retry/regeneration/sample-until-pass.
- no new branch/PR/CURRENT_TASK file.

---

# 11. Stop / report contract

STOP immediately on first deterministic P0/P1 or material ambiguity affecting product acceptance.

Success report must include:

- start/final main SHA;
- proof executable runtime/frontend remained frozen;
- exact TEST Worker versions;
- fresh game ID;
- visible catalog 7/7/7 result;
- exact successful APPLY/CHANGE/REMOVE turn numbers and +1 proof;
- announcement/private-app/MM results;
- Weak representative result;
- Medium clothing + direct actor-pair + M5-combination results;
- S1 finite supported/unsupported authority result;
- named Strong result;
- S4 or S7 result;
- S6 result or explicit bounded COVERAGE_NOT_REACHED;
- two-rule and three-rule combination results;
- residue/isolation/later ordinary-turn result;
- refresh/re-entry and History result;
- desktop/mobile result;
- source/test/content writes = 0;
- DB/migration writes = 0;
- Production access = 0;
- preserved evidence-game access/mutation = 0;
- P0/P1/P2/P3 findings.

Success terminal:
`CSA_THREE_TIER_REMAINING_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_THREE_TIER_REMAINING_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task and do not claim OWNER_READY.

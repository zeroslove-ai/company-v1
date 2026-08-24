# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-three-tier-rule-change-story-v1
Mode: OWNER-ACCEPTED CSA REDESIGN — 21-SLOT CANONICAL CATALOG / STRUCTURED RULE-CHANGE STORY TURN / TEST IMPLEMENTATION
Updated: 2026-08-24 23:04 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `cde3dffd5abfb1f5f3dc7115cee3bba1e0ad69b1`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding CSA canon blob: `26ebc9fb12984553076fcc49bbd44e1620928caa`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Binding live acceptance blob: `a9de6e85e0b6cf5d460a33800babc9a0f86ec898`
Current-truth commit before registration: `cde3dffd5abfb1f5f3dc7115cee3bba1e0ad69b1`
Stage-A accepted terminal: Issue #68 `5396213794`
Stage-A operator review: Issue #68 `5396294637`
CSA design provenance only: Draft PR #103 / head `f9168285d47b143c0759a0add045709e62e87da2`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Read before any edit, in order:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  5. current repository CSA content/runtime/frontend/DB contract/tests
  6. Draft PR #103 only as provenance/context after current canon
  7. Stage-A terminal `5396213794` and review `5396294637`
  8. this CURRENT_TASK
- Current main canon outranks Draft PR #103 wording when they differ. Do not merge PR #103 as implementation/canon authority.
- Preserve accepted Stage-A behavior and source unless new deterministic evidence proves a regression.
- Preserve A′/R3 architecture: server-owned turn kernel + one Story + one post-Story observer + atomic Commit.
- Never restore the old exact-nine/zero-turn behavior merely because current source/tests still encode it.

Target success terminal:
`CSA_THREE_TIER_RULE_CHANGE_STORY_IMPLEMENTED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_THREE_TIER_RULE_CHANGE_STORY_BLOCKED_AWAITING_OPERATOR_REVIEW`

Never claim OWNER_READY. This task implements and proves the new CSA foundation; later holistic/media/long-memory acceptance remains separate.

---

# 0. Fixed owner/product facts

The following are already product law. Do not reinterpret them during implementation:

1. Old exact-nine catalog is superseded.
2. MVP target is 21 product slots: 7 Weak + 7 Medium + 7 Strong.
3. Visible primary UI tabs are `약함 | 중간 | 강함`; no separate category navigation.
4. Every preset is finite and owns bounded subject/counterparty/designation selectors.
5. No player-facing generic trigger/action/duration/modifier DSL.
6. Multiple compatible rules may be active together.
7. APPLY/CHANGE/REMOVE are structured rule-change Story turns and consume exactly one gameplay turn on successful commit.
8. Rule operation is server-owned structured truth; Story cannot rewrite which rule/scope operation occurred.
9. Rule state + rule-change Story commit atomically. Failed Story must not leave a half-applied rule.
10. The same turn visibly dramatizes the institutional announcement and immediate reaction; same-turn MM may be emitted.
11. Active rules continue into later ordinary Story until changed/removed.
12. No private-app/supernatural awareness; no retroactive “always normal” memory rewrite.
13. Compliance != affection/desire/arousal/romance/loyalty/private consent-as-feeling/personality rewrite.
14. No `타락도`, corruption, sexual-adaptation, obedience, generic relation or generic consent meter.
15. Strong tier is bounded player-delegated institutional authority, not a replacement generic sexual-command DSL.

Do not start from the historical zero-turn Stage-B acceptance instructions. They are superseded by current main canon.

---

# 1. Fresh current-source inventory before edits

Before changing source, build an exact inventory of every current CSA semantic owner/reader/writer and classify it.

At minimum inspect:

- repository CSA catalog/content source(s), if any;
- hard-coded exact-nine ID arrays/sets/maps;
- frontend CSA tabs/cards/forms/selectors/active-rule UI;
- API routes and frontend client methods used by APPLY/CHANGE/REMOVE;
- server/store/RPC paths that mutate active CSA state;
- R3 state shape for active rules/revision/scope;
- system-events or equivalent recent-event path;
- Story prompt projection of active rules and CSA changes;
- observer/MM handling on CSA-related turns;
- clothing projection tied to W1/W2/M1/M2 semantics;
- any `authorityFor`, `modeFor`, rule-9, generic execute-immediately, sexual action or legacy helper paths;
- Supabase tables/RPC/functions/checks that enumerate or validate template IDs/operation shape;
- all deterministic tests that encode exact-nine or zero-turn assumptions.

For every relevant path classify:

- `KEEP_UNCHANGED`
- `KEEP_AND_GENERALIZE_TO_CANONICAL_CATALOG`
- `REPLACE_EXACT_NINE`
- `REPLACE_ZERO_TURN`
- `HISTORICAL_READ_COMPAT_ONLY`
- `DELETE_DEAD_OR_SUPERSEDED`
- `AMBIGUOUS_STOP`

Do not preserve stale behavior to keep tests green. Do not delete proven historical read compatibility merely because an identifier is old.

If the implementation cannot distinguish product authority from historical compatibility without destructive data rewrite, STOP with exact evidence.

---

# 2. Establish one canonical 21-slot repository CSA catalog

## 2.1 Source ownership

Use one forward canonical repository source for active CSA product semantics.

- If a suitable existing canonical CSA content file already exists, evolve it in place.
- Otherwise create one clearly named canonical source, preferably `content/csa_catalog.json` unless current repository conventions prove a better single source.
- Runtime and frontend must consume/project that source; do not maintain hand-copied independent semantic arrays.
- SQL may validate structural shape/IDs when required, but SQL is not a second human-readable rule catalog.

## 2.2 Stable product mapping

Provide a stable one-to-one runtime template ID for every binding product slot:

Weak: `W1..W7`
Medium: `M1..M7`
Strong: `S1..S7`

Runtime IDs should be descriptive stable snake_case names; W/M/S slot is also recorded in catalog metadata. Do not expose either raw ID in normal player UI.

The catalog must contain only the fields genuinely needed to drive product behavior, such as:

- `template_id`
- `slot` (`W1` etc.)
- `tier` (`weak|medium|strong`)
- player-visible Korean name/rule text
- authority label/presentation
- valid subject scope descriptors
- valid counterparty/recipient/designation scope descriptors when required
- bounded selector schema
- finite behavior/prompt premise metadata needed by this preset
- compatibility lineage where an old ID maps directly to W1/W2/M1/M2
- active/selectable flag

Do not add a generic trigger/action/duration/modifier language just because JSON could represent one.

## 2.3 Selector boundaries

Selectors are preset-specific.

- Named selectors use registered adult characters only; do not generate arbitrary NPCs to satisfy a selector.
- Gender/direction constraints must be explicit where the canonical preset depends on them.
- W5/W6 keep the touched female employee vs configured counterparty direction straight.
- M3/M4 supporter/recipient direction must remain explicit.
- S2/S3/S5/S7 require explicit named-adult employee designation where applicable.
- S4 does not auto-add bystanders.

For S1, derive the smallest finite supported sexual-work action-family allowlist from **already supported/current or newly canonical W/M physical semantics plus proven current adult action support**. Do not invent a universal command executor. Publish the exact finite family list in the catalog and terminal. If choosing the finite list would require a new owner product decision beyond this boundary, STOP before implementing a generic fallback.

## 2.4 Legacy exact-nine handling

New selection UI/API must not expose retired exact-nine items.

Preserve historical persisted IDs only where a real read/replay/evidence caller requires them. Do not backfill/rename/reset preserved game rows merely to migrate IDs.

Direct semantic lineage:
- old no-bra -> W1
- old no-panties -> W2
- old underwear-only -> M1
- old nude-work -> M2

Retired primary concepts must not remain selectable under hidden aliases:
- waist/thigh request rule
- generic masturbate-for-recipient slot
- standalone vaginal-sex strong slot
- generic immediate-execute request rule
- standalone continue-until-orgasm slot

---

# 3. Replace zero-turn CSA with a structured rule-change Story turn

Trace current operation first:
`visible app operation -> client/API -> validation -> state/RPC -> turn kernel -> Story -> observer -> Commit -> context/UI`

Then converge to the current canon with the smallest A′-compatible design.

## 3.1 Structured event identity

APPLY/CHANGE/REMOVE must enter the server as a structured event, e.g. `rule_change_turn`, carrying exact validated fields such as:

- operation: `apply|change|remove`
- active rule instance id when change/remove requires it
- canonical template id
- exact bounded subject scope
- exact bounded counterparty/recipient/designation scope
- previous active-rule version/reference needed for change/remove

Do not serialize this into ordinary free text and then ask Story to infer which operation happened.

## 3.2 Use the existing R3 turn correctness boundary

Rule-change Story turns must reuse the server-owned logical-turn/attempt/stream/Commit machinery as much as possible.

Required:
- one logical gameplay turn;
- one Story call;
- one existing observer call;
- exact attempt fencing/idempotence/reconnect behavior;
- four resulting Story choices through the normal choice protocol;
- no second reaction Story;
- no hidden retry/regeneration.

Do not create a second turn writer or parallel CSA storytelling kernel if the existing R3 turn kernel can own the event type.

## 3.3 Atomic rule authority

The rule transaction may be reserved/staged before Story, but the new active-rule authority and the Story turn must become canonical together.

Prove:
- before successful Commit, prior active-rule state remains canonical;
- successful Commit advances gameplay turn exactly once and persists the new active-rule state exactly once;
- failed Story/transport does not leave a half-applied active rule;
- explicit retry/reconnect follows existing accepted R3 semantics and cannot duplicate the rule change;
- observer failure is local/fail-open and may not rewrite the structured rule operation.

Do not solve this with arbitrary LLM save patches.

---

# 4. Story / announcement / persistent authority / Mind Monitor

## 4.1 Rule-change Story prompt

Story receives the exact structured event plus:
- current scene/time;
- affected/relevant registered character cards via the existing bounded projection;
- previous/new rule premise/scope needed to understand the change;
- grounded authority channel options from the canonical preset/tier;
- recent committed history/memory.

Story must visibly dramatize a grounded institutional announcement appropriate to the rule, e.g. phone push, company monitor, intranet/company messenger, HR/employment notice, regulator notice.

Story must not:
- mention the private app as known to NPCs;
- use supernatural aura/memory rewrite;
- pretend the rule was always normal;
- change the structured rule/scope operation;
- treat compliance as desire/romance/arousal/loyalty.

## 4.2 Same-turn MM

The existing observer may emit MM for current/relevant affected actors during the rule-change Story.

Preserve the accepted Stage-A exact-ID grounding:
- exact canonical actor IDs only;
- invalid/stale entries drop locally;
- no fuzzy name repair;
- MM describes the same announced rule reality as Story;
- surprise/embarrassment/reluctance may coexist with compliance;
- no private-app awareness.

## 4.3 Persistent later Story effect

Every later ordinary Story receives all applicable active canonical rule premises/scopes/designations continuously until change/remove.

Do not reduce active-rule context to only the most recent announcement event.
Do not treat the rule as “consumed” after first reaction.
Do not add a separate aftereffect engine.

Test CHANGE/REMOVE residue explicitly.

---

# 5. Minimal structural state only

Use the smallest state needed by the 21 finite presets.

Expected retained/allowed state classes include:
- active rule instances with canonical template ID and bounded scope;
- lifecycle/revision/created-at or equivalent transaction metadata already needed for correctness;
- four-slot clothing for W1/W2/M1/M2;
- named designations/assignments proven necessary for S2/S3/S5/S7;
- bounded current-scene facts already owned by canonical scene state.

Do NOT add:
- generic sexual event ledger;
- generic action execution DSL;
- posture/contact ontology;
- corruption/adaptation/obedience meter;
- generic relationship/consent matrix;
- dynamic arousal/erection/ejaculation gauge.

If a specific preset requires one extra finite field, tie it directly to that preset and document why natural committed Story + existing state is insufficient.

---

# 6. Frontend CSA redesign

Implement the visible product surface from canon.

Primary app:
- tabs exactly `약함 | 중간 | 강함`;
- selected tier directly displays its seven canonical rule cards;
- no category submenu;
- each card shows Korean name/rule text + authority presentation + `설정`;
- `설정` renders only the bounded selectors for that preset;
- active rules are separately visible with understandable `변경` / `해제`;
- named designation presets provide explicit registered-adult employee selector;
- no raw template IDs, trigger/action/duration, revision, JSON, R3 codes.

When APPLY/CHANGE/REMOVE is submitted:
- the normal Story reading surface remains visible;
- the operation streams/commits as the dedicated rule-change Story turn;
- user sees the institutional announcement and same-turn scene reaction;
- resulting four choices/free input are available normally;
- frontend does not fake local active-rule success before committed context confirms it.

Preserve Story-first desktop/mobile reading priority and all accepted Stage-A recovery wording.

---

# 7. DB / migration / TEST schema policy

Current global migration filename lineage remains historically inconsistent. Do NOT run `supabase migration repair` and do NOT rewrite migration history.

First determine whether the redesign can be represented safely by current R3 JSON/state/system/turn schema.

### If no DB schema change is required

- make no schema write;
- prove current TEST target remains compatible read-only;
- proceed to deploy.

### If a genuine new DB contract is required

Author only the smallest forward additive migration in `supabase/migrations/`.

Before TEST apply classify the exact live target delta:
- `ALREADY_EQUIVALENT`
- `SAFE_ADDITIVE_CREATE_OR_REPLACE`
- `SAFE_ACL_ONLY`
- `DATA_OR_EVIDENCE_REWRITE_REQUIRED`
- `DESTRUCTIVE`
- `AMBIGUOUS`

If any data/evidence rewrite, destructive change, or ambiguity is required, STOP BLOCKED. Do not backfill preserved games.

Because standard `db push` may be blocked by historical filename lineage, do not use migration-history repair as a workaround. If and only if the new final target delta is fully proven additive/ACL-only and requires no gameplay-row rewrite, it may be applied TEST-only once through the already accepted target-schema bridge method:
- one atomic top-level PostgreSQL statement;
- exact SQL derived from the newly landed current-main target source;
- no migration-ledger write;
- no gameplay-row DML during installation;
- pre/post target-schema fingerprint;
- pre/post R3 row counts and migration-ledger fingerprint unchanged.

If the available execution channel cannot prove atomic one-shot outcome, STOP before mutation.

No Production access.

---

# 8. Deterministic validation before live deploy

Add/replace tests against current canon. Delete/rewrite stale exact-nine/zero-turn expectations instead of creating compatibility solely for tests.

Required deterministic coverage:

## Catalog / selectors
- exactly 21 active/selectable canonical slots, 7 per tier;
- every slot has one stable runtime ID and correct W/M/S mapping;
- old retired items are not selectable;
- selector allowlists reject invalid direction/scope;
- named designation selectors use registered adult IDs;
- S1 finite action family list is explicit and bounded;
- no generic DSL fields exposed.

## Rule-change turn
- APPLY successful commit advances gameplay turn by exactly 1;
- CHANGE successful commit advances exactly 1;
- REMOVE successful commit advances exactly 1;
- operation survives Story input literally/structurally without reinterpretation;
- successful commit atomically changes active state + turn;
- Story failure before commit leaves prior state unchanged;
- reconnect/idempotence cannot double-apply or double-commit;
- observer failure remains local;
- four Story choices survive rule-change turn.

## Persistence / prompt
- active rule remains in later ordinary Story context;
- two/three compatible active rules project together;
- remove one does not erase unrelated rule;
- no stale removed rule in later Story;
- rule announcement event appears in committed history/memory normally;
- no private-app awareness prompt leakage;
- no compliance->desire instruction.

## UI
- `약함|중간|강함`, seven cards each;
- bounded selector rendering;
- active change/remove;
- full committed Story result after operation;
- no internal IDs/jargon;
- 390x844 action reachability/basic layout.

Then run:
- focused changed-boundary suites;
- changed JS/MJS syntax;
- JSON parse/contract validation for canonical catalog;
- `git diff --check`;
- one full `npm test` as regression signal before deploy.

No green count substitutes for browser acceptance.

---

# 9. Landing and exact TEST deploy

Land source/content/test changes on `main` with normal fast-forward semantics. No new branch/PR.

Verify local HEAD == origin/main before deployment.

Deploy only exact changed R3 TEST components:
- API Worker if runtime/server changed;
- frontend Worker because CSA UI will change;
- no unrelated worker.

Record exact main/source SHA and Worker version IDs.
No Production deploy/access.

---

# 10. Fresh real-browser acceptance for this implementation cut

Use the actual deployed TEST frontend and new disposable adult-profile games. No direct gameplay API as substitute for product acceptance, no DOM mutation, no storage preseed, no hidden retry/sample-until-pass.

Run at least one continuous **12–15 committed-turn** campaign plus bounded fresh probes if required to isolate rule-specific mechanics.

Mandatory visible coverage:

1. Opening and at least one ordinary social/non-work turn to prove Stage-A behavior survived.
2. Open CSA app and verify three tabs/seven cards per tier.
3. APPLY one disruptive Weak rule through visible selectors.
   - exactly one committed rule-change Story turn;
   - grounded institutional announcement;
   - same-turn affected NPC reaction/MM where applicable;
   - no app awareness;
   - active rule visible after commit.
4. Next ordinary unrelated/social turn: active rule still exists; later relevant turn follows rule premise when applicable.
5. CHANGE that rule or its allowed scope through visible UI: exactly one Story turn; future authority changes without history rewrite.
6. REMOVE through visible UI: exactly one Story turn; later ordinary turn shows no stale enforcement.
7. Apply one Medium physical/sexual institutional rule and prove its direct canonical semantics in a plausible adult context.
8. Apply one Strong named designation (S2/S3/S5 or S7) and prove exact selected registered actor is the institutional assignee.
9. Exercise S1 once with a supported finite action family and once with an unsupported/out-of-family free-form request; only the supported family receives S1 mandatory institutional authority.
10. Exercise at least one two-rule compatible combination; if stable within campaign, add a third compatible rule and prove independent remove/change.
11. If S4 is used, prove no bystander auto-injection.
12. MM exact actor parity on rule-change turn and following relevant turn.
13. Refresh/re-entry after active rule exists: no duplicate rule-change turn and active state/context parity remains.
14. History shows the rule-change Story turn in correct chronology.
15. Desktop plus ~390x844 CSA configuration/action reachability and Story-first reading order.

For every decisive CSA operation record:
`visible selection -> structured operation -> streamed Story -> observer raw/applied -> committed active state -> next Story/UI`.

This cut does NOT need to live-play every one of the 21 presets. Deterministic contracts must cover all 21; full all-slot/long-memory/media holistic acceptance follows in a later task. However any representative preset exercised live must match its exact canon semantics.

Stop on the first reproducible P0/P1 in this scope; do not compensate by broadening later subsystems.

---

# 11. Global prohibitions

Do NOT:
- restore exact-nine as product authority;
- restore zero-turn APPLY/CHANGE/REMOVE;
- create a generic CSA/sexual execution DSL;
- add a 44/60+ active catalog;
- add generic relationship/consent/emotion/corruption/adaptation/obedience engines;
- add generic posture/contact ontology or sexual event ledger;
- add a second Story/choice/MM/reaction/media LLM;
- add fuzzy/nearest-name actor repair;
- change provider/model/temperature/token/config/secrets as a quality fix;
- auto-retry/regenerate until pass;
- mutate preserved evidence games;
- run migration repair/history rewrite;
- access/deploy Production;
- create a new CURRENT_TASK file/branch/PR.

---

# 12. Terminal / lifecycle

On success:
- ensure all accepted source/content/test changes are landed on `main`;
- verify local/remote main equality;
- overwrite this SAME CURRENT_TASK to `Status: WAITING_REVIEW`;
- post one terminal to Issue #68;
- STOP. Do not auto-start the later holistic acceptance task.

Terminal must include:
- START/FINAL main SHA;
- canon blob and live-acceptance blob read;
- exact changed source/content/test/migration files;
- complete old CSA inventory/classification summary;
- canonical 21 slot -> runtime ID mapping;
- S1 exact finite action-family list;
- selector contract summary for all 21;
- old exact-nine compatibility/deletion decisions;
- rule-change event/state/turn architecture summary;
- DB schema delta classification and exact TEST apply mechanism if any;
- migration repair/history writes count;
- focused/full/static validation results;
- TEST API/frontend version IDs;
- fresh browser game IDs and committed-turn count;
- APPLY/CHANGE/REMOVE exact turn-count/atomicity evidence;
- announcement/MM evidence;
- active-rule persistence and stale-remove evidence;
- Medium/Strong/S1 representative evidence;
- multi-rule combination evidence;
- refresh/history/mobile evidence;
- P0/P1/P2/P3 findings;
- Production access=0;
- preserved evidence game mutation=0.

Success terminal:
`CSA_THREE_TIER_RULE_CHANGE_STORY_IMPLEMENTED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_THREE_TIER_RULE_CHANGE_STORY_BLOCKED_AWAITING_OPERATOR_REVIEW`

Never report OWNER_READY from this task.
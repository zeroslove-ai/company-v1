# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-csa-rule-change-actor-grounding-v1
Mode: NARROW P1 REPAIR — EXACT RULE-CHANGE ACTOR/DIRECTION GROUNDING / PRIVATE-APP INPUT SEPARATION / RESUME CSA LIVE ACCEPTANCE
Updated: 2026-08-25 00:45 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `dfa2f50f8e1d53bfb3dd4791791567f57cb4cd94`
Accepted implementation source baseline: `bef87b18656f5f2e009d106a2436c7ee558101b9`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Previous task: `company-r3-csa-three-tier-rule-change-story-v1`
Previous terminal: Issue #68 `5397617940`
Operator review: Issue #68 `5397686937`
Owner intervention incorporated in baseline: Issue #68 `5396922047`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

## Reuse / authority law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Read before edits: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, current CSA catalog/runtime/frontend/tests, previous terminal `5397617940`, operator review `5397686937`, then this task.
- Current main canon outranks Draft PR #103. PR #103 remains provenance only.
- Preserve the accepted 21-slot CSA catalog, bounded selectors, structured rule-change turn, atomic rule-state+Story commit, Stage-A narrative/MM/recovery behavior, and current TEST schema bridge.
- Do not restore exact-nine or zero-turn CSA.
- Never claim OWNER_READY from this task.

Target success terminal:
`CSA_RULE_CHANGE_ACTOR_GROUNDING_FIXED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_RULE_CHANGE_ACTOR_GROUNDING_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted facts — do not reopen

The previous task is accepted as a safe partial implementation, not discarded.

Accepted/frozen:

- canonical active catalog = 21 slots, 7 per tier;
- explicit owner-approved physical semantics restored in `content/csa_catalog.json`;
- descriptive runtime template IDs;
- old W/M/S aliases only where read compatibility requires them;
- retired exact-nine items not selectable;
- bounded preset-specific selectors;
- S1 finite action families only, no generic CSA DSL;
- one R3 logical turn + one Story + one post-Story Observer + atomic Commit;
- additive TEST `rule_change_event`/reserve-turn target already applied without migration-ledger repair/write or gameplay-row rewrite;
- focused CSA 12/12 and full npm 556/556 were green at accepted source baseline;
- TEST API version `8de08ce8-8658-470d-a6ff-ef20e493a18e` and frontend version `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e` were deployed from the accepted baseline;
- fresh game `9b2443eb-0c4b-4d44-842f-9141d3255c7b` is READ ONLY evidence forever in this task.

Do not redesign selectors, persistence, Observer, DB schema, or the 21-slot catalog merely because Story authored the wrong actor.

---

# 1. Exact blocker to close

Fresh W5 APPLY evidence:

- structured event: subject `heroine5` / 이메이;
- counterparty: `general_park_jungwoo` / 박정우;
- template: `breast_touch_conversation`;
- one rule-change turn committed atomically;
- active rule state and Observer/MM actor IDs were structurally correct;
- Story instead narrated player 지훈 touching 이메이, and committed `scene_note` then faithfully reflected that wrong Story.

Therefore the first broken boundary is **Story generation grounding**, before Observer/reducer.

Also inspect the candidate app-leak boundary:

- `frontend-r3/csa.js` currently constructs a persisted/display literal like `상식개변 적용/변경/해제: ...`;
- current Story system prompt says never narrate the private app screen;
- nevertheless the failed W5 Story mentioned the private app screen before the institutional announcement.

Do not solve either issue by simply adding more vague prompt prose.

---

# 2. Required source inventory before patch

Trace one rule-change turn exactly:

`CSA UI draft -> serialized request -> csaResponse/startTurn -> reserved rule_change_event -> provider.story arguments -> buildStoryContext -> actual Story JSON payload -> Story text -> Observer -> reducer -> Commit`

Record exactly:

- persisted/audit `literal_action` value;
- structured `rule_change_event` shape;
- selector fields and any named actor IDs;
- how subject/counterparty scopes resolve to actual registered actor IDs for actor-pair/named presets;
- which exact fields/names the Story model currently receives;
- whether the Story payload receives `상식개변 적용/변경/해제` app-control wording through ordinary `literal_action`;
- whether `pending_rule_change_turn` currently carries IDs only, broad scopes only, names, or direction semantics.

Classify each relevant path as:

- `KEEP`
- `ADD_EXACT_RULE_CHANGE_BINDING`
- `SEPARATE_STORY_INPUT_FROM_AUDIT_LITERAL`
- `TEST_ONLY`
- `UNRELATED_DO_NOT_TOUCH`

If evidence shows the structured event itself is already corrupted before provider Story, STOP and report that instead of applying a Story-layer patch.

---

# 3. Add the smallest exact rule-change actor-role binding

For rule-change Story turns only, derive one deterministic **presentation/context binding** from the already-validated structured operation + canonical catalog + registered actor directory.

The binding must be explicit enough that Story does not infer direction. It should contain only the fields actually needed, for example conceptually:

- canonical template ID / slot / rule text;
- operation `activate|update|deactivate`;
- exact subject role semantics;
- exact counterparty/recipient/designation role semantics;
- exact selected registered actor IDs and canonical names when the selector resolves named/current actors;
- explicit natural-language direction statement, e.g. for W5 equivalent to `박정우가 이메이의 가슴에 손을 댄 상태로 대화한다` when those exact actors were selected;
- authority/announcement framing already owned by catalog/canon.

Do not add a generic action graph, body ontology, relationship engine, sexual ledger, or new durable state.

The binding is Story input/presentation guidance derived from canonical structured truth. It is not a second writer and is not persisted as a new gameplay system unless an existing turn evidence field already stores the structured event.

For actor-pair presets, direction must remain exact at minimum for:

- W4 lap-facing conversation;
- W5 breast-touch conversation;
- W6 buttock-touch conversation;
- W7 recurring light-kiss conversation;
- M3/M4 supporter -> male recipient;
- M5 scoped world-norm pair when an actor pair is configured;
- M6 examiner/subject direction;
- M7 examiner/subject direction;
- S1 bounded instruction subject/counterparty;
- S4 additional participant approval without auto-injecting bystanders;
- S7 trainer/trainee direction where represented.

For named designation presets S2/S3/S5/S6, preserve the exact named registered adult and institutional role.

Do not fuzzy-match actor names and do not replace an unavailable selected actor with the player.

---

# 4. Separate rule-change Story input from ordinary free-text literal action

Binding canon says APPLY/CHANGE/REMOVE are dedicated structured Story turns, **not ordinary free-text player actions for Story to reinterpret**.

Keep whatever literal/audit string the R3 turn kernel needs for History/idempotency only if it is already structurally required, but do not expose app-control prose such as `상식개변 적용:` to Story as if it were ordinary `literal_action`.

Implement the smallest clear distinction, e.g. a dedicated rule-change Story context/prompt path or equivalent:

- ordinary turns continue to receive the exact ordinary literal action unchanged;
- rule-change Story receives the exact structured rule-change event + exact actor-role binding;
- rule-change Story does not need the private app-control string to understand the event;
- player-visible History may still identify that a rule change occurred through committed Story/structured metadata without teaching NPCs about the app;
- Observer may still receive the persisted literal/audit string if needed for grounding, but must not treat it as NPC knowledge.

Do not globally remove ordinary player literal-action fidelity.
Do not weaken Opening’s private-app premise; only rule-change Story narration must not expose the private app as the institutional announcement source.

Use one grounded institutional channel in Story: company messenger, monitor, intranet, HR/employment notice, phone push, regulator notice, or canon-equivalent.

---

# 5. Prompt policy

After the structured binding exists, update the rule-change Story contract only as needed to state:

- structured rule-change identity is immutable;
- exact subject/counterparty/designation actor IDs/names/roles are immutable Story facts;
- Story may choose prose, reaction, dialogue, and consequences around them but may not substitute player/another NPC, invert direction, or erase the selected role;
- do not narrate the private app screen/control as the institutional source;
- no supernatural awareness;
- institutional compliance != affection/desire/arousal/romance/loyalty/private consent-as-feeling.

Do not add a second LLM, semantic repair LLM, sample-until-pass, automatic regeneration, or generic post-Story semantic verifier.

If live Story still violates exact actor binding after this narrow source correction, stop on first reproducible failure rather than building a retry/gate architecture.

---

# 6. Deterministic tests

Add focused regressions that prove source boundaries, not mocked prose luck.

Required:

1. W5 exact selected subject/counterparty becomes an exact rule-change Story binding with both canonical IDs/names and correct direction.
2. Player is not silently inserted into W5 when not selected.
3. W4/W6/W7 direction bindings are correct.
4. M3/M4 supporter/recipient direction is correct.
5. M6/M7 direction is correct.
6. Named designation presets preserve exact named actor identity.
7. S4 does not auto-inject unselected bystanders.
8. Rule-change Story payload does not expose the `상식개변 적용/변경/해제:` ordinary literal as Story intent when a structured event exists.
9. Ordinary non-CSA turns still receive exact literal action unchanged.
10. Existing Stage-A agency/MM identity tests remain green.
11. Existing 21-slot catalog/selector/atomic-rule-change tests remain green.

Run focused tests, then one full `npm test`, syntax/JSON validation, and `git diff --check`.

No test compatibility layer for stale exact-nine/zero-turn behavior.

---

# 7. DB / TEST / deploy boundary

Expected DB schema change: **none**.

- Do not run `supabase db push`.
- Do not run migration repair.
- Do not write migration ledger.
- Do not add a migration unless a genuinely new DB prerequisite is discovered; if so STOP before DB mutation and report why the existing structured event cannot express the required binding.
- Read-only verify current TEST R3 target remains compatible.
- Pre-existing RLS-disabled advisor findings are outside this task.
- No Production access.

If source changes API/provider/runtime, deploy exact reviewed API source to TEST once.
If frontend changes only because the Story/audit literal separation requires it, deploy exact reviewed frontend once.
Do not redeploy an unchanged Worker.

Record exact Worker version IDs.

---

# 8. Fresh browser acceptance after correction

Never reuse or mutate failed evidence game `9b2443eb-0c4b-4d44-842f-9141d3255c7b`.
Use fresh disposable TEST games only.

## 8.1 First mandatory probe — exact W5 replay

Create one fresh adult game and reproduce the same direction shape with a non-player counterparty when scene reality permits.

Pass requires:

- structured event readback has exact selected subject/counterparty;
- Story uses those exact actors and correct action direction;
- player is not substituted when not selected;
- grounded institutional announcement appears;
- private app screen/control is not narrated as institutional source;
- same-turn relevant NPC reaction/MM corresponds to same Story reality;
- active rule commits atomically once;
- four choices remain available;
- refresh/context/History do not duplicate the rule-change turn.

If this first probe fails, STOP BLOCKED immediately. No retry/sample-until-pass.

## 8.2 Resume previously unreached CSA lanes only after 8.1 passes

Continue a bounded fresh acceptance sufficient to cover the lanes skipped by the previous terminal:

- CHANGE then later ordinary turn;
- REMOVE and residue check;
- at least one Medium actor-pair rule;
- S1 bounded action-family authority without generic unsupported-command execution;
- one named designation Strong rule;
- one compatible two-rule combination;
- later unrelated ordinary turn proving active-rule persistence;
- refresh/History;
- desktop plus approximately 390x844 mobile CSA usability if frontend changed or if the previous task never proved it.

Do not attempt full final owner-ready/20+ memory/media acceptance here. This task only closes the rule-change actor-grounding P1 and resumes enough CSA acceptance to prove the corrected foundation.

---

# 9. Stop / report contract

STOP on the first deterministic P0/P1.

Success report must include:

- start/final main SHA;
- exact changed files;
- exact actor-binding design and why it is not a second gameplay writer;
- proof ordinary literal-action fidelity is unchanged;
- proof rule-change Story no longer receives app-control literal as ordinary intent;
- focused/full test counts;
- DB writes = 0;
- exact TEST Worker versions;
- fresh game IDs;
- W5 structured event vs Story actor/direction evidence;
- private-app announcement evidence;
- CHANGE/REMOVE/Medium/Strong/multi-rule results actually reached;
- Production access = 0;
- preserved evidence-game mutation = 0;
- P0/P1/P2/P3 findings.

Success terminal:
`CSA_RULE_CHANGE_ACTOR_GROUNDING_FIXED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_RULE_CHANGE_ACTOR_GROUNDING_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this existing CURRENT_TASK lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task.

---

# Execution terminal — 2026-08-25 KST

`CSA_RULE_CHANGE_ACTOR_GROUNDING_BLOCKED_AWAITING_OPERATOR_REVIEW`

- Execution identity: `company-r3-csa-rule-change-actor-grounding-v1` / START blob `30cd8bebc41225c65f778e4bc8cecc37d0ab4c17` / expected branch `main`.
- Source start: `d8f9cefbed11afeae78facd7e3ae7e362682d6fe`; executable final before this lifecycle-only update: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`; `HEAD == origin/main` at the source terminal point.
- Source commit pushed: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f` (`fix: bind CSA rule-change story actors and direction`).
- Changed source/test files: `runtime-r3/domain/csa.js`, `runtime-r3/domain/memory.js`, `runtime-r3/server/provider.js`, `runtime-r3/server/worker.js`, `test/r3-csa-contract.test.mjs`.
- Design: deterministic `rule_change_story_binding` derives canonical template/slot/rule text, operation, exact selected IDs/names, subject/counterparty roles, direction, authority framing, and unselected-participant boundary from the already validated event/catalog/directory. It is context guidance, not a second writer or durable gameplay system.
- Ordinary literal proof: ordinary turns still pass the exact submitted literal; rule-change Story context is forced to an empty ordinary `literal_action` when a structured event exists, while the persisted audit literal remains in the turn/Observer path.
- Deterministic validation: focused CSA contract `15/15`; full `npm test` `559/559`; changed-file Node syntax checks PASS; repository content JSON parse PASS; `git diff --check` PASS.
- TEST API deployment: correct R3 Worker `game-proxy-company-r3`, version `cbfb8900-1ba9-4886-9405-452e7ae760db`, deployed from source `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`. Existing R3 frontend was unchanged and not redeployed. A wrong legacy config was invoked once before the R3 config was rechecked: `game-proxy-company-v1` version `a1b1fee4-f388-4fb3-86e6-ca7f0d7e5c8b`; it was not used for acceptance.
- Fresh disposable TEST game: `79d0e3b6-fabf-4f35-99d2-f20086a7b171` (not the preserved failed evidence game `9b2443eb-0c4b-4d44-842f-9141d3255c7b`). Browser setup completed and reached TEST `연결 완료`, but Opening/Turn 0 remained at `장면 응답이 늦어지고 있습니다. 잠시 후 다시 확인해 주세요.` until the provider response timeout. No W5 operation was submitted; exact actor/direction live acceptance, Story/Observer/Commit, and subsequent CSA lanes were not claimed.
- First mandatory W5 probe: **BLOCKED before probe** by the TEST Opening/Story response timeout. No retry, sampling, refresh-based replay, or second gameplay attempt was made.
- Direct DB/SQL/migration writes: `0`; no migration push/repair/ledger write; only the authorized disposable-game setup request was attempted. Preserved game mutation/reset: `0`. Production access: `0`. Provider/model/config change: `0`.

STOP. `CURRENT_TASK` is `WAITING_REVIEW`. Do not generate another task, merge, redeploy, reset preserved evidence, or start another Cut.

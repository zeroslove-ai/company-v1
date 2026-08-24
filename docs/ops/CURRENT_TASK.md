# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-csa-s1-active-authority-story-binding-v1
Mode: NARROW P1 REPAIR — ACTIVE S1 STORY AUTHORITY BINDING / SUPPORTED-vs-UNSUPPORTED FINITE FAMILY / RESUME FINAL CSA LANES
Updated: 2026-08-25 03:49 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `634d9fc3b152068ac05a66bdb9ac20e4b80d574d`
Previous task: `company-r3-csa-mandatory-semantic-lanes-valid-setup-recovery-v1`
Previous terminal: Issue #68 `5399727630`
Operator review: Issue #68 `5399805632`
Accepted presentation implementation: `206bb957abbcdf621c22a6355bf9576610416bdd`
Accepted W5 transport test SHA: `262571e1de377126751e176806ae59489f036379`
Reviewed actor-grounding executable source: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Current TEST frontend: `gamebuilder-company-r3` / `9bb754d0-632c-42e5-83b1-441ce6079688`
Current TEST API before repair: `game-proxy-company-r3` / `cbfb8900-1ba9-4886-9405-452e7ae760db`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Preserved evidence games — read-only, no reset/reuse/mutation:
- `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
- `36ef2c76-e592-4a09-ab7e-2d89aab4394c`
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `1ef46111-5a09-43cd-b61e-c0d36df04d12`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Read first: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, terminal `5399727630`, operator review `5399805632`, then this task.
- Actual deployed browser UI is the product gate after deterministic source validation.
- Repair one proven P1 owning boundary only. Do not redesign CSA or reopen accepted lanes.
- No Production access. No OWNER_READY claim.

Success terminal:
`CSA_S1_ACTIVE_AUTHORITY_FIXED_AND_FINAL_MANDATORY_LANES_CLOSED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_S1_ACTIVE_AUTHORITY_OR_FINAL_MANDATORY_LANES_BLOCKED_AWAITING_OPERATOR_REVIEW`

## Execution lifecycle

- TASK_ID: `company-r3-csa-s1-active-authority-story-binding-v1`
- STATUS: `WAITING_REVIEW`
- TERMINAL: `CSA_S1_ACTIVE_AUTHORITY_OR_FINAL_MANDATORY_LANES_BLOCKED_AWAITING_OPERATOR_REVIEW`
- START_HEAD: `55570e738809ffaa265c4c8daabd6b58e88d5a44`
- IMPLEMENTATION_SHA: `f607e4e868e18bde61ba8c46d508d3a502551c6f`
- FINAL_MAIN_SHA: recorded in the terminal report on Issue #68 after the lifecycle commit
- FINAL_CURRENT_TASK_BLOB_SHA: recorded in the terminal report on Issue #68 after the lifecycle commit
- BRANCH: `main`
- RUNNER: `company-v1-codex-watcher / WATCHER`

### Deterministic implementation proof

- Changed files: `runtime-r3/domain/csa.js`, `runtime-r3/domain/memory.js`, `runtime-r3/server/provider.js`, `test/r3-csa-contract.test.mjs`.
- Focused CSA contract tests: 20/20 passed.
- Full suite: `npm.cmd test`, 564/564 passed.
- `node --check` passed for all four changed JS/MJS files.
- S1 catalog sanity passed: JSON parse, 21 items, exact six-family order unchanged.
- `git diff --check` passed.
- No catalog semantic change, durable-state schema/reducer/store change, migration, or DB write.
- Active S1 binding is immutable and Story-only: player issuer; exact selected subject/counterparty IDs, names, and scopes; direction remains player -> selected subject -> selected counterparty; exact families `['kiss','sexual_touch','genital_exposure','genital_touch','oral','penetration']`; outside-family actions are not mandatory under S1; literal agency is preserved.

### TEST deployment and live evidence

- TEST API before: `cbfb8900-1ba9-4886-9405-452e7ae760db`.
- TEST API after: `game-proxy-company-r3` version `769cd525-7b56-40cf-ad0b-f6c2132b9802`.
- TEST frontend unchanged: `9bb754d0-632c-42e5-83b1-441ce6079688`.
- Fresh disposable game: `c04e91e5-e18f-492f-8b85-32104bb5c3b1`.
- Setup and Opening were completed exactly once; Opening showed Turn 0, four choices, and free input.
- S1 was selected once through the visible UI with subject `서원희` and counterparty `박정우`; the card showed selected and the single Apply action produced visible Story output while controls were disabled.
- The final committed turn/active-state result could not be read: browser DOM snapshot, screenshot, and Windows visual recovery each timed out or were stopped before a terminal Turn result was available. This is a live-harness observability block, not a gameplay PASS or a gameplay P1 finding.
- The supported literal was not submitted because the S1 activation commit result was not observable. Unsupported singing, S7, S4 fallback, refresh/re-entry, MM, and private-app checks were not run.
- No duplicate gameplay submission, retry, resample, preserved-game access, reset, or mutation occurred.
- Production deploys: 0. DB writes: 0. Migrations: 0. Preserved evidence mutation: 0.
- Findings: deterministic P0/P1/P2/P3 = none; live acceptance = BLOCKED pending operator review/recoverable browser observation.

---

# 0. Freeze accepted evidence

From fresh game `1ef46111-5a09-43cd-b61e-c0d36df04d12`:

- valid Setup + Opening passed exactly once;
- M5 is now accepted/frozen: heroine1/서원희 supporter-side -> general_park_jungwoo/박정우 recipient-side, Turn 1 +1, direct semen-consumption fatigue/stress-recovery meaning preserved, ordinary Turn 2 preserved meaning, durable active state passed;
- S1 activation transaction is accepted/frozen: heroine1/서원희 -> general_park_jungwoo/박정우, Turn 3 +1, M5+S1 independently active;
- first defect was ordinary Turn 4 only: literal `서원희 차장이 박정우 팀장에게 키스하도록 업무지시한다.` is supported family `kiss`, but Story replaced actor/target/action/intent with generic rule-confirmation conversation.

Freeze all earlier GREEN lanes: 7/7/7 presentation, Weak lifecycle, M1/M3/W5, S2/S3/S5, multi-rule residue, refresh/History/mobile/MM/private-app separation. Do not rerun for pass-seeking.

---

# 1. First broken boundary

Durable S1 state already contains the needed facts:

- exact `selector.subject_actor_id`;
- exact `selector.counterparty_actor_id`;
- exact `supported_action_families`.

Current ordinary Story projection is lossy:

- `runtime-r3/domain/memory.js::buildStoryContext()` drops selector IDs;
- drops `supported_action_families`;
- supplies no canonical selected actor names/roles;
- `rule_change_story_binding` exists only on APPLY/CHANGE/REMOVE turns, not later ordinary instruction turns.

Current `ACTOR_PAIR_ROLES.S1.direction` is also semantically reversed for owner canon: it says counterparty gives instruction to subject. Binding canon says PLAYER is issuer; selected subject is the employee receiving the player's supported work instruction; selected counterparty is the bounded counterpart/target context for the supported action.

Repair this projection/binding boundary only.

---

# 2. Required S1 Story-only binding

Reuse existing persisted selector + canonical actor directory + canonical S1 family list. Do not add durable state or a second semantic catalog.

Ordinary-turn Story context for active S1 must expose a bounded immutable binding equivalent to:

- issuer: player / canonical player identity;
- instructed subject: exact selected subject actor ID + canonical name;
- action counterparty/context: exact selected counterparty actor ID + canonical name;
- exact subject/counterparty scopes;
- exhaustive supported families exactly:
  `['kiss','sexual_touch','genital_exposure','genital_touch','oral','penetration']`;
- direction law: player issues the supported instruction to subject; when instruction names interaction with counterparty, subject performs the supported action toward/with counterparty; counterparty is not rewritten as issuer;
- unsupported boundary: actions outside the six-family set do not gain mandatory institutional authority merely because S1 is active;
- literal-agency boundary: a supported literal may not be replaced by rule discussion, confirmation, future deferral, or a different supported act.

No deterministic semantic classifier/router/verifier. The one Story LLM may recognize obvious `키스` against the supplied finite list.

---

# 3. Provider contract

Update the existing single Story prompt only as needed to consume the active S1 binding.

Required:

- supported family + exact selected scope => official S1 work order in the same Story turn;
- preserve player literal actor/target/action/intent;
- no generic rule-confirmation substitution or future deferral;
- no unrelated actor/bystander substitution;
- six-family set is exhaustive;
- outside-family action remains an ordinary request/instruction and is not mandatory under S1;
- unsupported action must not be silently converted to a supported family;
- compliance != desire/romance/comfort/arousal/private consent-as-feeling/personality rewrite.

Do not add retry, second Story/Observer, JSON repair, semantic verifier, model/provider/config changes, or a deterministic sexual executor.

---

# 4. Allowed source scope

Expected changed files only:

- `runtime-r3/domain/csa.js`
- `runtime-r3/domain/memory.js`
- `runtime-r3/server/provider.js`
- `test/r3-csa-contract.test.mjs`

One adjacent direct test file only if strictly required by existing test ownership; report why.

Forbidden:

- `content/csa_catalog.json` semantic/ID/family changes;
- frontend changes;
- worker/store/supabase-store/reducer persistence changes;
- DB migrations/RPCs;
- provider/model/config/timeout/secret changes;
- media/TTS;
- W5 or other accepted rule semantics.

If a fix appears to require those, STOP instead of broadening scope.

---

# 5. Deterministic regression requirements

Minimum proof:

1. S1 still persists exact selector IDs and exact six-family array unchanged;
2. S1 binding identifies PLAYER as authority issuer and does not say counterparty is issuer;
3. ordinary `buildStoryContext()` with active S1 exposes exact selected subject ID/name;
4. exposes exact selected counterparty ID/name;
5. exposes exact six-family array in exact order;
6. explicitly marks outside-family actions as non-mandatory under S1;
7. ordinary literal action remains unchanged;
8. no active binding mutates durable state;
9. M5/unrelated active rules remain independent;
10. W5 exact transport/actor-grounding regression stays green;
11. 21-slot catalog and 7/7/7 tests stay green.

Prefer direct context/output assertions, not source-string-only checks.

Then run focused CSA tests, full npm suite, `node --check` on changed JS/MJS, JSON/catalog sanity, and `git diff --check`.

No DB writes during deterministic validation.

---

# 6. TEST deployment

Only after deterministic GREEN:

- deploy changed `game-proxy-company-r3` API to TEST;
- record exact new API Worker version + implementation SHA;
- do NOT redeploy unchanged frontend;
- frontend remains `9bb754d0-632c-42e5-83b1-441ce6079688` or exact source-equivalent;
- no Production;
- no DB schema/migration/ledger/history repair.

Unexpected source/deployment drift => STOP rather than normalize.

---

# 7. Fresh browser acceptance — exactly one game

After TEST API deploy, create exactly one fresh adult TEST game through valid visible Setup + Opening.

Do not reuse/reset/mutate `1ef46111-5a09-43cd-b61e-c0d36df04d12` or any prior evidence game.

## 7.1 S1 activation

Through visible controls activate S1 using preferred pair if valid:

- subject: heroine1 / 서원희
- counterparty: general_park_jungwoo / 박정우

If unavailable, use another exact visible valid pair; no seeding.

Require exactly +1 Story turn, exact pair persisted, S1 active once, no private-app source, four choices + free input.

## 7.2 Supported family — first live gate

Use `kiss` / `키스`.

For preferred pair submit exactly:
`서원희 차장이 박정우 팀장에게 키스하도록 업무지시한다.`

PASS only if:

- player remains issuer;
- 서원희 remains instructed employee/performer;
- 박정우 remains action counterparty/target context;
- action remains 키스;
- supported instruction is treated as official S1 work authority in this same turn;
- no generic rule-confirmation substitution/future deferral;
- no actor reversal/bystander injection;
- compliance does not become desire/romance/private consent-as-feeling.

First deterministic failure => STOP. No second supported sample.

## 7.3 Unsupported boundary — only after supported PASS

Submit exactly one outside-family instruction:
`서원희 차장에게 성적인 노래를 부르라고 업무지시한다.`

Singing is outside all six families.

PASS only if Story preserves the player request but S1 itself does NOT make singing institutionally mandatory. No generic unlimited command authority and no substitution into kiss/touch/exposure/oral/penetration.

If Story says S1 compels singing => P1 STOP. No second sample.

## 7.4 S7 — only after both S1 gates PASS

Use visible S7 trainer/trainee selectors with exact registered adults.

PASS:

- APPLY exactly +1;
- exact trainer + trainee identities;
- roles not swapped;
- no unnamed replacement/bystander injection;
- one ordinary follow-up preserves same trainer/trainee roles;
- no obedience/affinity/corruption stat engine.

S4 fallback only if S7 is genuinely unreachable due scene/precondition reality before any valid S7 operation fails. A deterministic valid S7 failure must STOP; do not hide it with S4.

---

# 8. Final reconstruction

If supported S1 + unsupported boundary + S7/S4 pass:

- one read-only refresh/re-entry of same game;
- no duplicate Story/Commit;
- active rules exactly once;
- four choices + free input reachable;
- no raw internal IDs/private-app institutional source;
- relevant MM, if present, matches same world and does not turn compliance into desire.

Do not rerun M5/Weak/M1/M3/W5/History/mobile absent new contradiction.

---

# 9. Stop / safety law

At first deterministic P0/P1:

- STOP immediately;
- preserve fresh game read-only;
- no retry/resample/hotfix during live;
- terminal `CSA_S1_ACTIVE_AUTHORITY_OR_FINAL_MANDATORY_LANES_BLOCKED_AWAITING_OPERATOR_REVIEW`.

Forbidden:

- Production access/deploy;
- DB schema/migration/ledger/history repair/backfill;
- `supabase db push`;
- provider/model/config/secret/timeout changes;
- retry/regeneration/sample-until-pass;
- direct API gameplay substitute;
- previous evidence game access/mutation/reset;
- new branch/PR/CURRENT_TASK file;
- OWNER_READY claim.

---

# 10. Terminal report contract

Report:

- start main SHA;
- implementation SHA before lifecycle commit;
- final main SHA + final CURRENT_TASK blob;
- exact changed files;
- active S1 binding shape: player issuer, selected subject/counterparty, direction, exact six families, unsupported boundary;
- proof no catalog/durable-state/DB semantic change;
- focused/full/syntax/diff results;
- DB writes = 0;
- prior API version + new TEST API version;
- frontend unchanged version;
- fresh game ID;
- S1 activation turn;
- exact supported literal + Story result;
- exact unsupported literal + Story result;
- S7 trainer/trainee or valid S4 fallback;
- refresh/re-entry;
- MM/private-app/compliance-vs-feeling;
- Production = 0;
- preserved evidence mutation = 0;
- retry/sample = 0;
- P0/P1/P2/P3 findings.

Success terminal:
`CSA_S1_ACTIVE_AUTHORITY_FIXED_AND_FINAL_MANDATORY_LANES_CLOSED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_S1_ACTIVE_AUTHORITY_OR_FINAL_MANDATORY_LANES_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task.

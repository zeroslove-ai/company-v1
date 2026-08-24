# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-bounded-selector-coherence-s7-transport-v1
Mode: NARROW P1 REPAIR — FRONTEND BOUNDED SELECTOR COHERENCE / S7 TRANSPORT / FINAL MANDATORY CSA SEMANTIC CLOSURE
Updated: 2026-08-25 05:11 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `587bdd014950fe1ef6e6773665a013bcd7c7e6a8`
Previous task: `company-r3-csa-final-semantic-live-acceptance-browser-recovery-v1`
Previous terminal: Issue #68 `5400391054`
Operator review: Issue #68 `5400801857`
Accepted executable implementation: `f607e4e868e18bde61ba8c46d508d3a502551c6f`
Accepted TEST API: `game-proxy-company-r3` / `769cd525-7b56-40cf-ad0b-f6c2132b9802`
Accepted TEST frontend before this repair: `gamebuilder-company-r3` / `9bb754d0-632c-42e5-83b1-441ce6079688`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Preserved evidence games — READ ONLY, no reset/reuse/mutation:
- `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
- `36ef2c76-e592-4a09-ab7e-2d89aab4394c`
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `1ef46111-5a09-43cd-b61e-c0d36df04d12`
- `c04e91e5-e18f-492f-8b85-32104bb5c3b1`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Mandatory read order: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, terminal `5400391054`, operator review `5400801857`, then this task.
- Preserve A′/R3 architecture and current owner CSA canon.
- Repair only the proven frontend bounded-selector draft/transport boundary.
- No Production access. No OWNER_READY claim.

Success terminal:
`CSA_S7_SELECTOR_TRANSPORT_FIXED_AND_MANDATORY_CSA_SEMANTICS_CLOSED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_S7_SELECTOR_TRANSPORT_OR_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted/frozen live evidence

From fresh game `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`, freeze as LIVE GREEN:

- browser readiness, valid Setup, Opening;
- S1 activation exactly +1 with subject/instructed employee 서원희 and bounded counterparty 박정우;
- S1 supported-family literal `서원희 차장이 박정우 팀장에게 키스하도록 업무지시한다.` committed as Turn 2 with PLAYER as issuer, 서원희 performer, 박정우 counterparty, kiss preserved and bounded official authority applied;
- no actor reversal, family substitution, generic rule-confirmation detour, or compliance-to-feeling rewrite;
- S1 unsupported literal `서원희 차장에게 성적인 노래를 부르라고 업무지시한다.` committed as Turn 3; singing did NOT become mandatory and was NOT converted into any supported family;
- four choices + free input returned after both ordinary turns;
- no browser observability failure, retry, resend, second game, DB repair, Production, or preserved-game mutation.

Freeze all earlier accepted CSA evidence as well: 7/7/7 presentation, Weak lifecycle, W5 exact transport/actor direction, M1/M3, M5 direct world-norm, named S2/S3/S5, multi-rule durability/residue, History, refresh, mobile, MM/private-app/compliance-vs-feeling separation.

Do NOT rerun any of those for pass-seeking.

The only mandatory semantic lane still open is live S7 Strong multi-NPC training designation + one follow-up + reconstruction.

---

# 1. Accepted P1 / first broken boundary

Terminal `5400391054` reached S7 only after both S1 gates passed.

Visible S7 selection:
- rule: `성적 업무 교육·훈련 지정권` / `sexual_work_training_designation`;
- trainer: 서원희 / `heroine1`;
- trainee: 윤민아 / `heroine2`;
- both are registered adult female employees;
- roles were visibly not swapped.

One visible APPLY click produced:
`입력이 서버에 전송되거나 저장되지 않았습니다. 내용을 확인한 뒤 직접 다시 제출할 수 있습니다.`

No S7 job/turn/commit existed; game stayed Turn 3. No retry/resend and no S4 fallback. This is accepted P1.

Source inspection proves the owning boundary is frontend selector coherence, not server semantics:

- canonical S7 allows subject scopes `[female_employee, male_employee, company_employee]` and counterparty scopes `[female_employee, male_employee, company_employee]`;
- therefore 서원희 -> 윤민아 is a valid canonical S7 pair;
- S7 default subject scope is `female_employee`, default counterparty scope is `male_employee`;
- `frontend-r3/csa.js::actorField()` currently lists all non-player actors regardless of the operation's selected scope;
- choosing 윤민아 can therefore leave hidden `counterparty_scope=male_employee` unless scope is separately synchronized;
- `presetCard()` field callbacks stage partial activate operations and can drop sibling `subject_actor_id` / `counterparty_actor_id` while editing scope or another selector field;
- server `runtime-r3/domain/csa.js` correctly rejects actor/scope mismatch before reserve. Do NOT weaken server validation.

---

# 2. Required repair — bounded selector coherence only

Use the current catalog/actor metadata as the only authority. Do not invent new semantic categories.

For every current `named_actor` / `actor_pair` preset UI:

1. visible actor choice and staged operation must always agree;
2. sibling selector IDs must survive edits unless they become invalid;
3. selecting an actor under an incompatible current scope must resolve to a compatible allowed scope using existing catalog semantics:
   - if current scope already matches actor, preserve it;
   - otherwise prefer the actor's exact gender scope (`female_employee` or `male_employee`) when allowed;
   - otherwise use `company_employee` when allowed;
   - otherwise the actor selection is not valid/apply-ready;
4. if the user explicitly changes a scope so an already-selected actor becomes incompatible, clear that actor and require re-selection rather than submit a hidden invalid combination;
5. `player` scope behavior for existing named presets must remain unchanged;
6. selector edits must merge the current pending operation rather than rebuild a partial operation that silently drops the other selected actor;
7. global Apply must never call `onOperation` for a selector operation that is visibly incomplete or actor/scope-incoherent;
8. do not add fuzzy actor matching, semantic LLM classification, second catalog, or a generic free-form selector DSL.

For S7 specifically, visible trainer 서원희 + trainee 윤민아 must produce a structured activation equivalent to:

```json
{
  "operation": "activate",
  "template_id": "sexual_work_training_designation",
  "subject_scope": "female_employee",
  "counterparty_scope": "female_employee",
  "subject_actor_id": "heroine1",
  "counterparty_actor_id": "heroine2"
}
```

The existing S7 semantic direction remains trainer(subject) -> trainee(counterparty). Do not change canon or server Story binding.

---

# 3. Allowed source scope

Expected changed files only:

- `frontend-r3/csa.js`
- `frontend-r3/csa-draft.js` only if the cleanest single-owner merge/coherence helper belongs there
- `test/r3-csa-contract.test.mjs`

One adjacent frontend CSA test file may be changed/added only if an existing direct UI-test owner already exists and is materially better than putting the regression in `r3-csa-contract.test.mjs`. Report why.

Forbidden source changes:

- `content/csa_catalog.json` IDs, scopes, families, labels, or semantics;
- `runtime-r3/domain/csa.js` server validation or rule semantics;
- `runtime-r3/domain/memory.js` / provider S1 binding;
- worker/store/supabase-store/reducer;
- schema/RPC/migrations;
- media/TTS;
- provider/model/config/secret/timeout.

If deterministic evidence says the fix requires a forbidden owner, STOP instead of broadening.

---

# 4. Deterministic regression requirements

At minimum prove directly:

1. S7 catalog remains unchanged and female -> female is canonically allowed;
2. starting from S7 defaults, selecting trainer `heroine1` and trainee `heroine2` produces exact coherent scopes `female_employee` / `female_employee` and preserves both actor IDs;
3. the resulting exact S7 operation is accepted by existing `applyR3Csa()` server validation without changing that validator;
4. actor-pair sibling ID preservation: changing one actor does not silently drop the other valid actor;
5. changing subject/counterparty scope preserves a compatible sibling actor and clears an incompatible actor;
6. S1 existing female `heroine1` -> male `general_park_jungwoo` operation stays unchanged and exact;
7. W5 exact female -> male selector path remains green;
8. named S2/S3/S5 selector operation remains bounded and does not regress `player`/company scope behavior;
9. incomplete actor_pair cannot become Apply-ready;
10. no hidden invalid actor/scope operation reaches `onOperation`;
11. 21-slot 7/7/7 catalog tests and exact S1 six-family tests remain green;
12. S1 active-authority Story projection regressions from `f607e4e...` remain green.

Prefer pure operation/context assertions plus one existing DOM/UI-level regression if the current test harness supports it. Do not add a heavyweight browser test framework solely for this repair.

Run:
- focused CSA/front-end selector tests;
- full `npm` test suite;
- `node --check` for changed JS/MJS;
- catalog JSON sanity/read-only check;
- `git diff --check`.

No DB writes during deterministic validation.

---

# 5. TEST deployment

Only after deterministic GREEN:

- deploy changed `gamebuilder-company-r3` frontend to TEST exactly once;
- record implementation SHA and exact new frontend Worker version;
- do NOT redeploy API; API must remain `game-proxy-company-r3 / 769cd525-7b56-40cf-ad0b-f6c2132b9802` or proven exact source-equivalent;
- no Production;
- no DB/schema/migration/ledger/history mutation.

Unexpected API/source drift => STOP. Do not normalize it.

---

# 6. Fresh visible S7 acceptance — exactly one game

After exact TEST frontend deployment:

## 6.1 Readiness
Before creating a game, fresh page must pass:
- DOM read;
- one screenshot;
- Setup fields readable;
- bounded repeat DOM read.

If readiness fails, STOP as harness/browser-control blocked; create zero games and patch nothing further.

## 6.2 Exactly one game
Create exactly one fresh adult TEST game with a valid visible Setup (e.g. 김도현 / 30 / 180 / 75 / 15 and current valid visible catalog IDs), single submit, single Opening.

Require visible Turn 0, four choices, free input.

No second game/reset/regeneration/seeding/sample-until-pass.

## 6.3 S7 selector/transport gate
Open Strong S7.

Use exact visible pair if available:
- trainer: 서원희 / `heroine1`;
- trainee: 윤민아 / `heroine2`.

Because both are female, visible scope/draft state must coherently resolve to female/female before Apply. Record visible selectors and, if available through non-mutating frontend state inspection, exact staged operation.

Click APPLY exactly once.

PASS requires:
- one `/turn` gameplay submission only;
- exact structured S7 operation with both actor IDs and coherent scopes;
- exactly +1 committed Story turn;
- exact trainer/trainee identities and roles, no swap;
- grounded institutional training designation;
- no unnamed replacement/bystander injection;
- no private-app institutional source;
- no obedience/affinity/corruption meter;
- four choices + free input return;
- S7 active exactly once.

If valid S7 still does not send/store/commit, STOP P1. No S4 fallback and no second S7 sample.

## 6.4 Ordinary follow-up
Only after S7 PASS, submit one visible ordinary free input asking the designated trainer to begin or discuss the designated training with the trainee.

PASS requires:
- trainer remains 서원희;
- trainee remains 윤민아;
- roles/direction coherent;
- player literal intent preserved;
- no bystander injection or personality/consent rewrite;
- +1 ordinary commit, four choices + free input.

## 6.5 Same-game reconstruction
Perform one intentional read-only refresh/re-entry of the same fresh game:
- no duplicate Story/Commit;
- S7 active exactly once;
- exact trainer/trainee selector state reconstructs coherently;
- last Story/choices/MM/scene canonical;
- no stale local draft or raw internal IDs.

No need to rerun S1/M5/Weak/History/mobile unless this new frontend change visibly contradicts a frozen behavior.

---

# 7. Stop / safety law

At first deterministic P0/P1 product defect:
- STOP immediately;
- preserve fresh game read-only;
- no retry/resample/hotfix in the same live run;
- terminal `CSA_S7_SELECTOR_TRANSPORT_OR_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`.

Browser observability failure after an action:
- never resend/reclick the action;
- read-only job/context may classify its footprint;
- at most one read-only reattachment to the same game;
- if visible state cannot be reconstructed, STOP blocked without another product patch.

Forbidden:
- Production access/deploy;
- API redeploy;
- DB schema/migration/history repair/backfill/direct gameplay mutation;
- `supabase db push`;
- provider/model/config/secret/timeout changes;
- previous evidence-game access/mutation/reset;
- gameplay retry/regeneration/sample-until-pass;
- direct API gameplay substitution;
- new branch/PR/CURRENT_TASK file;
- OWNER_READY claim.

---

# 8. Terminal report contract

Report:
- start/final main SHA;
- implementation SHA;
- final CURRENT_TASK blob;
- exact changed files;
- deterministic selector-coherence root cause and repair;
- focused/full/syntax/catalog/diff results;
- API version unchanged;
- frontend old/new TEST Worker versions;
- deploy counts;
- browser readiness;
- fresh game ID;
- exact S7 visible trainer/trainee/scopes and staged/Network operation evidence;
- S7 +1 Story/Observer/commit result;
- ordinary follow-up result;
- refresh/re-entry duplicate + selector reconstruction result;
- source boundaries respected;
- DB/schema/migration/history writes = 0;
- Production = 0;
- preserved evidence access/mutation = 0;
- browser reattachment count and gameplay resend count;
- P0/P1/P2/P3 findings.

Success:
`CSA_S7_SELECTOR_TRANSPORT_FIXED_AND_MANDATORY_CSA_SEMANTICS_CLOSED_AWAITING_OPERATOR_REVIEW`

Blocked:
`CSA_S7_SELECTOR_TRANSPORT_OR_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task.

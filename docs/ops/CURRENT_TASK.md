# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-csa-catalog-actor-scope-projection-s7-closure-v1
Mode: NARROW P1 REPAIR — R3 CATALOG ACTOR SCOPE METADATA / FREEZE FRONTEND SELECTOR / FINAL S7 CLOSURE
Updated: 2026-08-25 06:02 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `c0f0ed109147a2d73ce7694734ce174714b1429d`
Previous task: `company-r3-csa-bounded-selector-coherence-s7-transport-v1`
Previous terminal: Issue #68 `5400978403`
Operator review: Issue #68 `5401055268`
Accepted frontend selector implementation: `79fbfd6013c2db54d4e6a68af6dc92123e292abb`
Accepted S1 active-authority implementation lineage: `f607e4e868e18bde61ba8c46d508d3a502551c6f`
Accepted TEST frontend: `gamebuilder-company-r3` / `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`
TEST API before this repair: `game-proxy-company-r3` / `769cd525-7b56-40cf-ad0b-f6c2132b9802`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Preserved evidence games — READ ONLY, no reset/reuse/mutation:
- `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
- `36ef2c76-e592-4a09-ab7e-2d89aab4394c`
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `1ef46111-5a09-43cd-b61e-c0d36df04d12`
- `c04e91e5-e18f-492f-8b85-32104bb5c3b1`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`
- `bbd1431a-f09f-40f4-82fa-c8827de84693`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Mandatory read order: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, terminal `5400978403`, operator review `5401055268`, then this task.
- Preserve A′/R3 architecture and current owner CSA canon.
- Freeze frontend selector implementation `79fbfd6...`; do not patch it again unless real-catalog deterministic proof shows an additional defect after the projection fix.
- No Production access. No OWNER_READY claim.

Success terminal:
`CSA_S7_CATALOG_SCOPE_PROJECTION_FIXED_AND_MANDATORY_CSA_SEMANTICS_CLOSED_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_S7_CATALOG_SCOPE_PROJECTION_OR_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted/frozen evidence

Freeze as GREEN and do not rerun for pass-seeking:

- 21-slot 7/7/7 presentation and Korean S1 family labels;
- Weak APPLY/CHANGE/REMOVE + residue;
- W5 exact transport and actor direction;
- M1/M3;
- M5 direct semen-consumption fatigue/stress-recovery world-norm;
- named S2/S3/S5;
- multi-rule durability/residue;
- History, refresh, mobile, MM/private-app/compliance-vs-feeling separation;
- S1 live activation + supported `키스` + unsupported `성적인 노래` boundary from game `babfa5a6-...`;
- frontend bounded-selector merge/readiness implementation `79fbfd6...` as a correct partial repair.

The only mandatory semantic lane still open is live S7 trainer/trainee designation + one ordinary follow-up + same-game reconstruction.

---

# 1. Accepted P1 / exact broken boundary

Terminal `5400978403` stopped before S7 Apply.

Visible state:
- trainer selected: 서원희 / `heroine1`;
- trainee selected: 윤민아 / `heroine2`;
- initial draft resolved to broad/company scopes;
- explicitly changing trainer scope to `여성 직원` cleared trainer while trainee remained;
- final visible state: trainer `대상 선택`, trainee `윤민아`, subject scope `여성 직원`, counterparty scope `회사 직원 전체`;
- no Apply, Network `/turn`, Story, Observer, commit, retry, DB write, or Production action.

Root cause is NOT server S7 validation and not another hidden Story issue.

Deterministic source proof:

1. canonical source already owns heroine gender:
   - `content/characters.json`: `heroine1` / 서원희 has `gender: "female"`;
   - `heroine2` / 윤민아 has `gender: "female"`;
2. `runtime-r3/server/worker.js::catalogResponse()` sends `actors: canonicalActors(content, actorIds)`;
3. `runtime-r3/domain/content.js::canonicalActors()` currently strips heroine `gender` from the public actor projection, while general NPC projection retains `sex`;
4. accepted frontend helper `79fbfd6...` correctly resolves scope from `actor.gender ?? actor.sex`;
5. therefore real heroine actors arriving at the browser cannot resolve to `female_employee` and fall back to `company_employee`; later choosing `female_employee` makes the same actor appear incompatible and clears it;
6. previous deterministic selector test missed this because it used hand-written actors containing `gender:'female'` instead of the real `/api/r3/catalogs` projection.

Do NOT infer gender from actor IDs, labels, names, or UI position. Do NOT weaken server `validateActor` / scope validation.

---

# 2. Required repair — canonical public actor projection only

Repair the smallest owning boundary so the frontend receives the canonical scope metadata it already expects.

Required behavior:

- `canonicalActors()` must preserve the existing canonical heroine gender needed for bounded scope compatibility;
- heroine actor projection must expose `gender` from the canonical character source (`female` for current five heroines);
- general NPC projection may keep its current `sex` shape; do not rename/break existing fields merely for cosmetic uniformity;
- do not expose `private_info`, `body`, intimate notes, storage paths, voice internals, or unrelated character-source fields;
- no new CSA semantic table, no duplicated gender allowlist, no actor-ID prefix heuristic;
- `catalogResponse()` should continue using `canonicalActors()`; avoid a second catalog projection just for CSA;
- server CSA catalog/scopes/reducer/storage/Story binding remain unchanged.

Expected minimal code shape is equivalent to adding canonical gender to the heroine branch of `canonicalActors()` and locking it with real-catalog tests.

---

# 3. Allowed source scope

Expected changed files only:

- `runtime-r3/domain/content.js`
- `test/r3-csa-contract.test.mjs` OR an existing direct R3 catalog contract test if materially better

`runtime-r3/server/worker.js` may change only if a deterministic test proves `canonicalActors()` alone cannot expose the field through the existing catalog response; explain why before touching it.

Frontend source should remain unchanged at `79fbfd6...` unless the REAL projected actors still expose a second independent frontend defect after the catalog fix. If so STOP for operator review rather than stacking another speculative patch.

Forbidden:
- `content/characters.json` semantic edits;
- `content/csa_catalog.json` IDs/scopes/families/labels;
- server CSA validator/reducer/storage semantics;
- `runtime-r3/domain/memory.js` or provider S1 binding;
- DB/RPC/migration/schema;
- provider/model/config/secret/timeout;
- media/TTS.

---

# 4. Deterministic regression — REAL projection required

Do not use synthetic `{gender:'female'}` actors as the only proof.

At minimum prove:

1. canonical content source still has heroine1/heroine2 gender `female`;
2. `canonicalActors(content, ['heroine1','heroine2','general_park_jungwoo'])` returns:
   - heroine1 with `gender:'female'`;
   - heroine2 with `gender:'female'`;
   - general Park with existing male `sex` metadata;
3. public actor projection contains no `private_info`, `body`, intimate/storage/voice fields;
4. GET `/api/r3/catalogs` through real `createR3Worker` returns the same scope-relevant actor metadata;
5. feed the REAL returned catalog actors into accepted `csaSelectorOperation` / `mergeCsaSelectorActor` helpers from `frontend-r3/csa.js`;
6. starting from actual S7 defaults, select trainer `heroine1`, trainee `heroine2` and prove exact staged operation:

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

7. that exact operation passes existing unchanged `applyR3Csa()` validation;
8. explicitly setting an already-compatible `female_employee` subject scope preserves heroine1 rather than clearing it;
9. S1 heroine1 -> Park remains exact female->male using the REAL catalog actor records;
10. incomplete/incompatible selector operation remains not Apply-ready;
11. 21-slot 7/7/7 and exact S1 six-family tests remain green;
12. existing S1 active-authority projection regressions remain green.

Run:
- focused CSA/catalog tests;
- full npm test suite;
- `node --check` changed JS/MJS;
- catalog JSON sanity/read-only check;
- `git diff --check`.

No DB writes during deterministic validation.

---

# 5. TEST deployment

Only after deterministic GREEN:

- deploy changed `game-proxy-company-r3` API to TEST exactly once because `/api/r3/catalogs` projection changed;
- record old `769cd525-7b56-40cf-ad0b-f6c2132b9802` and exact new API Worker version;
- do NOT redeploy frontend; it must remain `gamebuilder-company-r3 / af6c13bf-ef57-40cb-a4f0-e3569b301bc5` or proven exact source-equivalent;
- no DB/schema/migration/history mutation;
- no Production.

Unexpected frontend/source drift => STOP. Do not normalize it.

---

# 6. Fresh visible S7 acceptance — exactly one game

## 6.1 Readiness
Before game creation:
- DOM read PASS;
- one screenshot PASS;
- Setup fields readable;
- bounded repeat DOM read PASS;
- verify new `/catalogs` actor data is source-equivalent to expected projection without gameplay mutation.

If readiness fails, STOP blocked and create zero games.

## 6.2 Exactly one fresh game
Create exactly one fresh adult TEST game using valid visible Setup, one submit, one Opening.
Require visible Turn 0, four choices, free input.
No second game/reset/regeneration/seeding/sample-until-pass.

## 6.3 S7 selector/transport
Open Strong S7 and select exactly:
- trainer: 서원희 / `heroine1`;
- trainee: 윤민아 / `heroine2`.

Before Apply, visible/draft state must show coherent female/female scopes and preserve both actors. Read-only frontend state inspection may record the exact staged operation.

Click APPLY exactly once.

PASS requires:
- exactly one `/turn` submission;
- structured operation exact actor IDs and `female_employee -> female_employee` scopes;
- exactly +1 committed Story turn;
- trainer remains 서원희, trainee remains 윤민아, no role swap;
- grounded institutional training designation;
- no unnamed replacement/bystander injection;
- no private-app institutional source;
- no obedience/affinity/corruption metric;
- four choices + free input return;
- S7 active exactly once.

If valid S7 still fails to send/store/commit, STOP P1. No second S7 sample and no S4 fallback.

## 6.4 Ordinary follow-up
Only after S7 PASS, submit one visible ordinary free input asking 서원희 to begin or discuss the designated training with 윤민아.

Require:
- exact trainer/trainee direction preserved;
- literal player intent preserved;
- no bystander injection;
- no compliance=>desire/romance/arousal/private-consent rewrite;
- +1 ordinary commit;
- four choices + free input return.

## 6.5 Same-game reconstruction
One intentional read-only refresh/re-entry:
- no duplicate Story/Commit;
- S7 active exactly once;
- exact trainer/trainee selector state reconstructs coherently;
- canonical last Story/choices/MM/scene;
- no stale draft or raw internal IDs.

Do not rerun S1/M5/Weak/History/mobile lanes absent a new contradiction.

---

# 7. Stop / safety law

First deterministic P0/P1 => STOP immediately, preserve fresh game read-only, no same-run hotfix/retry/resample.

Browser failure after action:
- never resend/reclick;
- read-only job/context may classify the submitted footprint;
- at most one read-only reattachment to the same game;
- if visible state cannot be reconciled, STOP blocked.

Forbidden:
- Production access/deploy;
- frontend redeploy;
- DB schema/migration/ledger/history repair/backfill/direct gameplay mutation;
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
- real catalog actor projection before/after proof;
- proof no private character fields leaked;
- focused/full/syntax/catalog/diff results;
- API old/new TEST Worker versions and API deploy count;
- frontend version unchanged and frontend deploy count 0;
- browser readiness;
- fresh game ID;
- exact S7 visible trainer/trainee/scopes + staged/network operation;
- S7 +1 Story/Observer/commit;
- ordinary follow-up;
- refresh/re-entry duplicate + selector reconstruction;
- DB/schema/migration/history writes 0;
- Production 0;
- preserved evidence access/mutation 0;
- reattachment/resend counts;
- P0/P1/P2/P3 findings.

Success:
`CSA_S7_CATALOG_SCOPE_PROJECTION_FIXED_AND_MANDATORY_CSA_SEMANTICS_CLOSED_AWAITING_OPERATOR_REVIEW`

Blocked:
`CSA_S7_CATALOG_SCOPE_PROJECTION_OR_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal Issue #68 report, then STOP. Do not self-register another task.

---

# 9. Execution result

Terminal disposition: `CSA_S7_CATALOG_SCOPE_PROJECTION_FIXED_AND_MANDATORY_CSA_SEMANTICS_CLOSED_AWAITING_OPERATOR_REVIEW`

- Start main SHA: `67de6cd6693c0185ae96a645f447ac84f7af92fc`
- Implementation commit: `bcc06683c084537e67a013fbddb577964a372d77`
- Final main SHA before this lifecycle overwrite: `bcc06683c084537e67a013fbddb577964a372d77`
- Changed implementation files: `runtime-r3/domain/content.js`, `test/r3-csa-contract.test.mjs`.
- Authority change: `canonicalActors()` now preserves canonical heroine `gender` while keeping general-NPC `sex`; no worker/catalog semantic fork was added.
- Real projection proof: `canonicalActors()` and real `GET /api/r3/catalogs` returned heroine1/heroine2 `gender: female` and `general_park_jungwoo` `sex: male`; public JSON exposed no `private_info`, `body`, intimate, storage, or voice fields.
- Deterministic validation: focused `test/r3-csa-contract.test.mjs` 22/22 PASS; full `npm test` 566/566 PASS; changed-file `node --check` PASS; catalog sanity 21 items with weak/medium/strong 7/7/7; `git diff --check` PASS.
- TEST API: old `769cd525-7b56-40cf-ad0b-f6c2132b9802`; one deploy only; new `fc98e0c3-db75-4088-bc0c-eddf129af4b6`. TEST frontend remained `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`; frontend deploy count 0.
- Browser readiness: visible DOM, screenshot, setup fields, and bounded repeat DOM read PASS.
- Fresh visible game: exactly one new game `b91607f4-6945-44eb-87a3-6f2b2d6e1834`; preserved games untouched.
- S7 visible acceptance: Strong `성적 업무 교육·훈련 지정권`; trainer `서원희`/`heroine1`, trainee `윤민아`/`heroine2`; visible female-employee to female-employee scopes; one APPLY produced Turn 1 (+1) with grounded institutional training designation, both actor names preserved, four choices and free input returned, and S7 active exactly once.
- Ordinary follow-up: one free input asking 서원희 to explain how to begin the designated training for 윤민아; Turn 2 (+1) committed with direction preserved and four choices/free input returned.
- Same-game refresh/re-entry: one intentional read-only refresh of the same game; no duplicate commit; Turn 2 reconstructed; S7 active exactly once; reconstructed active scopes were `female_employee` -> `female_employee`.
- Read-only/browser safety: no previous evidence game was opened or mutated; no resend, reclick, retry, regeneration, or second game; DB/schema/migration/history writes 0; Production access/deploy 0; browser reattachment 0 after initial tab; P0/P1/P2/P3 findings 0.

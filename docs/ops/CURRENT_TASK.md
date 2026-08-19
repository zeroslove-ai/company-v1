# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-product-canon-and-gap-matrix-v1
Mode: DOCS / PRODUCT-AUTHORITY AUDIT ONLY
Updated: 2026-08-20
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Why this task exists

Company v2 preserved parts of the clean runtime spine but failed to inherit the actual Company product baseline. The failure is not lack of historical design material; product/UI/prompt/game contracts already existed, the original v2 task itself required canonical Company content reuse, and those requirements were weakened or ignored in implementation/review.

Failure classification:

`V2_PRODUCT_CANON_INHERITANCE_AND_ACCEPTANCE_GATE_FAILURE`

Durable audit finding: Issue #68 comment `5348837128`.

The immediately prior correction lease was owner-aborted and then violated the stop order by continuing source work. Its terminal is rejected by operator review comment `5348952812`. Draft PR #93 is closed/unmerged and is diagnostic evidence only. Do not cherry-pick, merge, copy, or treat PR #93 as the implementation base.

## 1. Hard execution boundary

This is a **docs/audit-only** task.

Create one normal docs branch from exact current `main` at lease time. Do not create an ops branch.

Recommended branch:

`company/v2-product-canon-gap-matrix-v1`

Open one Draft PR containing only the approved documentation changes below. Stop at review boundary. Do not merge.

Forbidden in this task:

- no edits under `runtime-v2/`;
- no edits under `frontend-v2/`;
- no edits under `src/engine/` or old frontend implementation;
- no migration/source SQL edits;
- no DB writes or migration apply;
- no Worker deploy;
- no TEST game creation/gameplay;
- no Production/hospital access;
- no provider/model/config/secret changes;
- no reuse/cherry-pick of PR #93 source;
- no auto-merge.

Allowed writes:

1. `docs/COMPANY_V2_PRODUCT_CANON_2026-08-20.md` — NEW binding candidate canon;
2. `docs/COMPANY_V2_PRODUCT_GAP_MATRIX_2026-08-20.md` — NEW current-v2 gap/integration plan;
3. this task file only if terminal bookkeeping is explicitly required by the runner; do not change `CURRENT_TRUTH.md` yet because the new canon is not authoritative until operator review.

## 2. Authority sources to read and reconcile

Read exact repository source, not memory, in this priority:

1. latest explicit owner decisions in Issue #68 and current project handoff notes;
2. `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`;
3. `docs/COMPANY_PROMPT_V2_DESIGN.md`;
4. `docs/COMPANY_GAME_CONTRACT_V1.md`;
5. `docs/COMPANY_NARRATIVE_CONTRACT_V1.md`;
6. `CURRENT_TRUTH.md`;
7. `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`;
8. authoritative repository static content under `content/*.json`, including at minimum edition, characters, general NPCs, map, organization/departments, positions, body types, speech styles, and CSA definitions if present;
9. established Company UI implementation/donor source under `src/frontend/pages/*` plus exact historical donor commit `f4b228f14d3a0e4446b0ae62e441ed659d3609ca` where needed to reconstruct the intended presentation;
10. current `runtime-v2/*`, `frontend-v2/*`, v2 migrations/RPC source, and current v2 tests only as the implementation being audited — never as product authority.

When old product documents conflict with a later explicit owner decision, the later owner decision wins. Record every material conflict and its resolution explicitly in the canon; do not silently blend incompatible generations.

## 3. Deliverable A — one binding candidate Company v2 Product Canon

Create:

`docs/COMPANY_V2_PRODUCT_CANON_2026-08-20.md`

The document must be implementation-specific enough that a new engineer cannot produce another generic chat demo while technically passing structural tests.

### 3.1 Game identity and experience

Freeze:

- title/product identity: `상식개변: 회사편`;
- this is company-life interactive fiction, not a productivity assistant/chatbot;
- player freedom/literal-action authority;
- rich streaming narrative as primary UX;
- the player-private unfamiliar `상식개변` app premise and what NPCs do/do not know at Opening;
- what constitutes a normal turn from the player's perspective;
- Phase-1 latest decision on free-form input and absence of active choices, even if older contracts describe choices.

### 3.2 Canonical world/content authority

For every semantic catalog identify the sole source of truth and exact current counts/IDs/names where finite:

- edition;
- five heroines;
- general NPCs;
- company map/locations;
- organization/departments;
- positions;
- speech styles;
- body types;
- CSA presets/definitions that remain product canon even if active mutation is deferred.

Binding rule: v2 must consume these repository catalogs through a small adapter. No hand-maintained shadow/demo semantic list may exist in v2 runtime, frontend, SQL, or tests.

### 3.3 Player Setup/profile contract

Inventory the established Company player-creation experience and freeze the exact fields that should exist in v2, including which are:

- user-entered or selected at Setup;
- static player profile;
- mutable gameplay state;
- sensitive/context-gated prompt fields;
- visible in UI;
- persisted in v2 DB versus resolved from catalog IDs.

At minimum explicitly decide name, department, position, age, height, weight, body type, speech style, and any other established setup field found in authoritative source. Do not infer omission from the current minimal v2 state.

### 3.4 Opening contract

Freeze:

- how Setup transitions to Opening;
- company day/time/location source;
- registered actor selection;
- canonical `상식개변` private premise;
- no invented unregistered NPC;
- no generic assistant/help framing;
- no unrequested player action completion;
- free next-action handoff;
- choices behavior for the current phase.

### 3.5 Story/Observation context contract

Specify exactly what the Story LLM must receive on an ordinary turn:

- literal player action verbatim;
- current canonical location ID/name/description;
- currently present/relevant registered actor IDs/names;
- relevant compact character canon/prompt-card fields;
- relevant general-NPC role/department facts;
- player-profile projection appropriate to the turn;
- current time;
- recent raw turn continuity + summaries;
- `상식개변`/CSA background state appropriate to the phase;
- hard rules for identity, player agency, and no assistant framing.

Specify what the small post-Story observation owns versus what it must never invent.

### 3.6 UI parity contract — no redesign

This section is critical.

Treat the established Company UI as the presentation donor to **transplant at high visual/information-architecture parity**, not as inspiration for a newly simplified shell.

Inventory the exact visible donor UI structure from source and freeze each element as one of:

- ACTIVE NOW;
- PRESENT BUT DISABLED/LOCKED FOR CURRENT PHASE;
- DEFERRED/HIDDEN BY EXPLICIT LATEST OWNER DECISION;
- REMOVED BY EXPLICIT LATEST OWNER DECISION.

At minimum inventory:

- header/title/day/time/turn/connectivity;
- main Story/history/streaming area;
- action/free-input area;
- current character/scene presentation;
- character image/media surface;
- Mind Monitor including tabs/cards/empty state;
- character state/current posture/position presentation;
- player situation/profile/state;
- company map/navigation presentation;
- `상식개변` app/tool entry and current phase behavior;
- turn summary/history;
- feedback/reset/NPC-find/media/TTS/image affordances and their latest explicit include/remove/defer status;
- desktop and mobile information order.

Binding UI rule: implementation may reuse/copy donor HTML/CSS/presentation components. It must not import old client-owned Story→Extract→Commit coordinator/API authority. Replacing controller behavior must not justify redesigning or deleting presentation.

Also explicitly preserve: Story streaming must stay visible and no blocking loading overlay may cover the narrative.

### 3.7 Persistence / DB product contract

Inventory the current isolated `company_v2_*` tables/RPCs and compare them to the product fields required by sections above.

Classify each field as:

- STATIC CONTENT LOOKUP — never duplicated in mutable DB;
- GAME CREATION PROFILE — durable once created;
- MUTABLE TURN STATE;
- TURN HISTORY;
- DEFERRED PHASE STATE.

Determine whether the current v2 schema can faithfully represent the approved Phase-1 product without fake frontend defaults or prompt-only values.

If not, document the exact additive v2 schema/RPC changes that a future implementation task must author. Do not write migration SQL in this task.

### 3.8 Runtime spine to preserve

Document the clean infrastructure that remains valid unless contradicted by audit:

- physically isolated v2 workers/code;
- one server-owned turn operation;
- Story SSE;
- one canonical job per game+turn;
- same-job reconnect;
- explicit failed-attempt retry only;
- attempt fencing;
- bounded progress writes/subrequest budget;
- one authoritative durable commit;
- no old frontend turn-stage authority.

Make clear these infrastructure invariants do not override product requirements.

### 3.9 Phase map

Resolve exact current phase behavior using latest owner decisions. For every major feature state whether it is active now, visible-disabled, or deferred:

- choices;
- CSA mutation;
- company map/navigation;
- clothing;
- physical state;
- sexual gauges/progression;
- relationship/event state;
- feedback revision;
- image;
- TTS;
- NPC search;
- player inner thought;
- any other donor UI feature.

Do not silently revive removed features because an old document contains them.

### 3.10 Acceptance gates

Define product acceptance gates stronger than raw test count.

Before source merge require direct proof of:

- catalog parity against authoritative content;
- no fabricated semantic lists;
- full Setup/profile parity for active fields;
- Opening premise/identity parity;
- Story prompt includes correct relevant canon;
- literal player action fidelity;
- UI donor parity checklist with every preserved visible component accounted for;
- no old frontend coordinator authority;
- DB has real durable authority for every approved mutable field;
- deferred controls do not claim fake functionality;
- streaming remains visible/non-blocking.

Before owner handoff require exact reviewed deploy + fresh Setup/Opening + one bounded automated turn + DB/SSE readback + actual Story/product inspection.

## 4. Deliverable B — full current-v2 gap matrix

Create:

`docs/COMPANY_V2_PRODUCT_GAP_MATRIX_2026-08-20.md`

For each product domain show these columns:

| Domain | Authoritative requirement | Current v2 implementation | Evidence paths | Classification | Exact next change | DB impact | UI impact | Test/acceptance proof |

Classification must be exactly one of:

- KEEP;
- REWIRE;
- REBUILD;
- DELETE;
- DEFER.

At minimum include:

1. runtime turn spine;
2. v2 persistence tables/RPCs;
3. Setup/profile;
4. edition identity;
5. heroine canon;
6. general NPC canon;
7. map/location canon;
8. organization/position/body/speech catalogs;
9. Opening;
10. Story context;
11. typed observation;
12. Mind Monitor;
13. Story/history/summary;
14. character/current-scene state;
15. player state/profile panel;
16. image/media presentation;
17. company map UI;
18. `상식개변` app UI;
19. CSA mutation runtime;
20. choices;
21. clothing/physical/sexual state;
22. relationship/event memory;
23. feedback/reset;
24. NPC search;
25. TTS/image sidecars;
26. frontend controller/API ownership;
27. responsive/mobile UI;
28. tests;
29. source-review gates;
30. TEST rollout/manual acceptance gates.

The matrix must identify **exactly what can remain from current v2 and what must be replaced**, so the next implementation is one controlled integration rebuild rather than another patch chain.

## 5. Required historical failure analysis inside the gap matrix

Include a short appendix tracing how this failure escaped review:

- original v2 task required static Company content reuse;
- PR #87 introduced demo semantic content anyway;
- tests lacked product-canon parity assertions;
- later product-baseline task translated “bring existing UI” into a reduced-shell checklist;
- PR #90 therefore recreated a partial shell instead of transplanting the established presentation;
- structural/runtime test success was incorrectly treated as product readiness.

For each failure, add the permanent acceptance guard that prevents recurrence.

## 6. No implementation recommendation by hand-waving

The documents must end with one concrete ordered implementation cut proposal, but must not perform it:

1. product-content + player-setup + persistence contract integration;
2. high-parity UI transplant with thin v2 controller replacement;
3. Opening + Story/Observation context integration;
4. product-parity tests and source review;
5. exact TEST migration/deploy if required;
6. one bounded automated smoke;
7. owner manual play.

If audit proves those should be combined differently, explain why and propose the smallest number of cuts that still gives an end-to-end playable product. Avoid a long sequence of symptom hotfixes.

## 7. Validation required

Before terminal report:

- prove changed paths are docs-only;
- cite exact source paths/commits for every major product decision;
- list resolved document conflicts and owner-decision precedence;
- include exact authoritative counts for finite catalogs;
- include exact UI donor path/commit inventory;
- include current v2 schema sufficiency verdict;
- include explicit `KEEP / REWIRE / REBUILD / DELETE / DEFER` totals;
- verify PR #93 source was not copied/cherry-picked;
- verify DB writes=0, migrations=0, deploys=0, gameplay=0.

## 8. Completion / stop boundary

Post one terminal report to Issue #68:

`COMPANY_V2_PRODUCT_CANON_AND_GAP_MATRIX_READY_FOR_REVIEW`

Include:

- `TASK_ID: company-v2-product-canon-and-gap-matrix-v1`;
- `FINAL_SHA`;
- Draft PR number;
- changed paths;
- product canon document path;
- gap matrix document path;
- resolved authority conflicts;
- finite catalog counts;
- UI donor inventory summary;
- v2 DB sufficiency verdict;
- gap classification totals;
- next integrated implementation-cut recommendation;
- confirmation of zero source/runtime/frontend/migration/DB/deploy/gameplay changes.

Then STOP `WAITING_REVIEW`. Do not merge or register the implementation task automatically.

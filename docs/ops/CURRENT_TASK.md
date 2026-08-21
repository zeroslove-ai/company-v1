# Company — CURRENT TASK

Status: READY
Task ID: company-redesign-runtime-kernel-bounded-audit-v1
Mode: DOCS / READ-ONLY SOURCE ARCHITECTURE AUDIT — NO IMPLEMENTATION
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / why this task is now allowed

The full Company implementation loop remains stopped. No runtime implementation has been authorized.

However, the owner has now locked the four previously open redesign product decisions in Issue #68 comment `5364770509`:

1. ordinary play = free-form input + exactly four natural Story-authored next actions, structured by the same post-Story Extract/observer; no separate choice LLM and no stale fallback;
2. immediate physical continuity = structured location/present actors + one bounded replaceable natural-language `scene_note`; no parallel generic posture/contact ontology;
3. remove dynamic player arousal/erection/ejaculation meters and supporting sexual-event-ledger gameplay state;
4. first CSA product = exact 9-rule MVP with one small finite flexible subject/counterparty scope vocabulary; flexibility is data, not a generic execution/consent DSL.

PR #95 remains the docs/design-only redesign PR and remains Draft. The product decisions above must not be reopened for implementation convenience.

The remaining major design decision is architecture selection only: runtime kernel A/B/C after bounded source audit.

This task produces the evidence required for that owner architecture decision. It does **not** choose implementation authority by itself.

## 1. Existing design authority to preserve

Read and treat as design input from current PR #95 head and repository evidence:

- `docs/redesign/00_AUTHORITY_AND_CHANGE_CONTROL.md`
- `docs/redesign/01_PRODUCT_CONSTITUTION.md`
- `docs/redesign/02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`
- `docs/redesign/03_GOLDEN_UI_CONTENT_MASTER.md`
- `docs/redesign/04_GAMEPLAY_STATE_MEMORY_MODEL.md`
- `docs/redesign/05_ARCHITECTURE_DECISION_FRAMEWORK.md`
- `docs/redesign/06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md`
- `docs/redesign/07_CSA_MVP_CATALOG.md`
- `docs/redesign/08_COMPANY_V1_SALVAGE_MATRIX.md`
- `docs/redesign/README.md`
- Issue #68 owner decision `5364770509`

Binding product presentation input:

- complete Company v1 snapshot at `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- especially `src/frontend/pages/*`
- this complete Company v1 presentation is the forward UI donor regardless of kernel A/B/C
- reduced `frontend-v2/` is NOT the target UI

Do not reinterpret kernel choice as permission to redesign or shrink the accepted Company product/UI.

## 2. Execution boundary

This is a **read-only source audit + docs/design update only**.

Use the existing redesign branch / Draft PR #95:

- branch: `company-redesign/product-first-canon-v1`
- PR: `#95`

Do not create another source/design PR unless the existing PR is technically unusable; if unusable, STOP and report why instead of silently creating a replacement.

Allowed writes on the PR #95 branch:

- new audit document under `docs/redesign/`;
- narrow updates to existing redesign docs to incorporate audited facts/recommendation;
- no source/runtime/frontend/test/migration/config implementation edits.

Do not merge PR #95.

## 3. Candidate A audit — current v2 transport/runtime kernel

Audit actual current source, not prior reports.

At minimum inspect the complete active dependency chain under:

- `runtime-v2/`
- relevant v2 worker/config/build entrypoints
- `company_v2_*` migrations/RPC definitions as read-only evidence
- v2-focused tests only as evidence of current contracts

Produce an exact module-level inventory classifying each relevant piece:

- `KEEP_PRODUCT_NEUTRAL`
- `KEEP_WITH_THIN_ADAPTER`
- `REBUILD_PRODUCT_COUPLED`
- `DELETE/DO_NOT_REUSE`

For Candidate A explicitly answer with source evidence:

1. Can the server-owned turn/job/SSE/reconnect/fencing/commit machinery be hidden behind a small product-neutral interface without carrying demo product semantics?
2. What is the minimum interface surface? Prefer concrete operations such as create/setup, context, opening, one turn, reconnect/readback, rule transaction boundary, feedback revision boundary, reset — but report the exact smallest proven set rather than copying this list mechanically.
3. Which v2 modules currently mix transport with product semantics, and how hard are they to replace without destabilizing transport?
4. Which DB tables/RPCs are genuinely product-neutral transaction infrastructure and which encode obsolete Phase-1/demo assumptions?
5. Does keeping A require preserving obsolete choices=[], minimal player profile, demo content, old observer shape, or reduced frontend assumptions? The acceptable answer must be NO with a concrete separation plan, otherwise A fails.
6. What known solved behavior would be lost if A is discarded: streaming, subrequest budget, job uniqueness, attempt fencing, reconnect, commit/fail semantics, ACL, etc.? Cite exact source/tests/migrations.
7. Estimate implementation risk using concrete coupling/module evidence, not subjective labels alone.

## 4. Candidate B audit — Hospital-derived runtime skeleton

Audit only source that is actually available and identifiable from the repository/history/reference material available to Codex.

Do not invent a Hospital implementation if the exact donor source cannot be proven.

Identify:

- exact donor paths/commits if available;
- the smallest independently reusable runtime ideas/modules for natural Story + four Story-authored choices -> same observer -> commit;
- streaming/reconnect/concurrency/commit machinery quality compared with Candidate A;
- Company-incompatible semantic baggage (hypnosis, consent/physical taxonomies, DB identities, hospital-specific state, frontend authority, etc.);
- what would need to be deleted/rebuilt before Company use.

Explicitly distinguish:

- `PROVEN_REUSABLE_SOURCE`
- `BEHAVIORAL_REFERENCE_ONLY`
- `UNAVAILABLE/UNPROVEN`

If B cannot be evaluated from concrete source at acceptable confidence, say so and score the uncertainty against B. Do not fill gaps from memory.

## 5. Candidate C audit — entirely new minimal kernel

Do not write any new runtime code.

Derive the smallest required kernel from the locked redesign contracts and acceptance scenarios.

Produce a concrete component list and interface sketch sufficient for:

- setup/opening;
- one server-owned ordinary turn;
- Story streaming;
- Story-authored four choices structured by the same observer;
- minimal observation/state (`location`, `present actors`, `scene_note`, accepted clothing/summary/MM fields only);
- atomic commit + readback;
- reconnect/idempotency/concurrency;
- non-turn CSA transaction boundary;
- feedback revision boundary;
- reset/new game.

Then compare the amount of infrastructure C would have to re-solve against proven A assets. Do not claim C is simpler merely because it starts empty.

## 6. Company v1 salvage boundary verification

Kernel selection and product salvage are separate axes.

Read the complete Company v1 snapshot at `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84` and verify `08_COMPANY_V1_SALVAGE_MATRIX.md` against actual files/modules.

At minimum verify exact treatment of:

- `src/frontend/pages/index.html`
- presentation/responsive CSS stack
- `render.js`
- `setup.js`
- `company-map.js` / map CSS
- Mind Monitor presentation
- `csa-app.js` presentation vs semantics
- `tts.js`
- history/download/media/feedback presentation assets
- `view-model.js`
- `app.js`
- SSE/API/controller helpers

For each, freeze one of:

- KEEP_NEAR_VERBATIM
- TRANSPLANT_PRESENTATION
- REWIRE_DATA_CONTRACT
- REBUILD_CONTROLLER/SEMANTICS
- DELETE
- DEFER_KEEP_ASSET

Critical guard:

- `app.js` / old browser-owned Story -> Extract -> Commit coordinator must not return as gameplay authority;
- removal of old controller authority must not justify redesigning/deleting the complete Company v1 presentation.

## 7. Required deliverable

Create one new document on PR #95:

`docs/redesign/09_RUNTIME_KERNEL_SOURCE_AUDIT.md`

It must include:

### A. Exact evidence inventory

- audited SHAs/paths;
- Candidate A source/module table;
- Candidate B proven/unproven donor table;
- Candidate C minimal required component table;
- verified Company v1 salvage module table.

### B. Comparable decision matrix

Score A/B/C against the already-locked priorities in `05_ARCHITECTURE_DECISION_FRAMEWORK.md`:

1. product fidelity behind Company v1 UI;
2. conceptual simplicity;
3. single authority;
4. long-play continuity without giant ontology;
5. failure isolation;
6. streaming correctness;
7. concurrency correctness;
8. testability;
9. operational simplicity;
10. reuse value last.

Every score must cite concrete source/audit evidence.

### C. Recommendation

Return exactly one of:

- `RECOMMEND_A`
- `RECOMMEND_B`
- `RECOMMEND_C`
- `BLOCKED_INSUFFICIENT_EVIDENCE`

If recommending A, specify the exact product-neutral kernel boundary and exact parts to discard/rebuild.
If recommending B, specify exact donor source and exact foreign semantics removed.
If recommending C, specify why A/B reuse costs exceed rebuilding solved transport/concurrency behavior.

Recommendation is advisory only; owner acceptance is still required.

### D. Final target gap-matrix inputs

List the exact target composition that a later final Gap Matrix should compare against current repository state:

`accepted Company v1 product/UI salvage + selected/recommended kernel + rebuilt thin controller/view model/domain + locked 9-rule CSA/product decisions`.

Do not write implementation code.

## 8. Narrow updates to existing redesign docs

After the audit, update only the facts that the source audit resolves in:

- `docs/redesign/05_ARCHITECTURE_DECISION_FRAMEWORK.md`
- `docs/redesign/08_COMPANY_V1_SALVAGE_MATRIX.md` if actual-source verification changes/clarifies classifications
- `docs/redesign/README.md`

Do not mark the recommended architecture as owner-accepted. Use explicit status such as `SOURCE-AUDITED / OWNER DECISION PENDING`.

Do not create the final implementation Gap Matrix yet unless the architecture is already owner-selected by a newer Issue #68 decision that appears after this task registration. If such a new owner selection appears, STOP and return to operator instead of silently extending scope.

## 9. Validation / stop boundary

Before terminal report prove:

- changed files are docs/redesign only;
- runtime-v2 edits = 0;
- frontend-v2 edits = 0;
- src implementation edits = 0;
- tests/config edits = 0;
- migration/SQL edits = 0;
- DB writes = 0;
- deploys = 0;
- gameplay/game creation/reset = 0;
- Production/hospital live access = 0;
- PR #95 remains Draft and unmerged.

Post one terminal report to Issue #68:

`COMPANY_REDESIGN_RUNTIME_KERNEL_AUDIT_READY_FOR_OWNER_DECISION`

Include:

- TASK_ID;
- PR #95 final head SHA;
- exact changed docs;
- A/B/C recommendation;
- Candidate A keep/rebuild/delete summary;
- Candidate B evidence confidence;
- Candidate C rebuild-cost summary;
- Company v1 salvage verification summary;
- unresolved architecture risks;
- all zero-mutation confirmations.

Then set/leave state `WAITING_OWNER_DECISION` and STOP.

No implementation task may be registered automatically from this audit.
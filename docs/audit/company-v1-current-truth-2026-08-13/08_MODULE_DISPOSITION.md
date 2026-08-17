# Module Disposition

Disposition is a review recommendation based on the current source and
lineage. It is not an implementation plan executed in this audit.

| Subsystem | Disposition | Evidence / reason |
|---|---|---|
| `src/api/turn-routes.js` runtime orchestration | KEEP then SIMPLIFY | It is the actual request lifecycle boundary, but it coordinates too many stage/mirror concerns. Preserve behavior before extracting authority. |
| `src/api/supabase.js` | SIMPLIFY | RPCs, direct table reads, and direct action status PATCHes coexist. Durable mutation API should be made explicit. |
| `src/engine/runtime-core/commit-reducer.js` | KEEP | Central durable reducer boundary and best place to enforce domain writer ordering. |
| `src/engine/runtime-core/observation-reducers.js` | KEEP then SIMPLIFY | Evidence-gated observation reducers are valuable; legacy and supplemental paths need a declared contract. |
| `src/engine/runtime-core/legacy-extract-adapter.js` | DEPRECATE / later DELETE | It accepts older Extract shapes and can hide producer/consumer drift. Keep only while compatibility provenance is measured. |
| `src/engine/runtime-core/scene-reducer.js` | KEEP | Canonical scene/presence direction is supported by the absorbed reset stack. |
| `src/engine/runtime-core/projections.js` | KEEP | Explicit legacy projection boundary is preferable to direct duplicate writes. |
| `src/engine/runtime-core/relation-presentation.js` | KEEP as presentation helper | Correct separation candidate; must never become relation target/posture authority. |
| Story prompting | SIMPLIFY | `story-prompt.js`, CSA prompt sections, content labels, and durable rules overlap. Freeze one prompt contract, then remove duplicates. |
| `fresh-narrative-parser.js` | KEEP | Current structural protocol parser; presentation fail-open can remain localized. |
| `persisted-narrative-parser.js` | KEEP temporarily / SIMPLIFY | Needed for replay/history, but should consume the persisted protocol contract rather than re-interpret it. |
| `legacy-narrative-parser.js` | DEPRECATE / later DELETE | Historical parser path; current truth should not depend on it. |
| Extract prompt/normalizer | KEEP then SIMPLIFY | Needed for observations; legacy acceptance and domain ownership must narrow. |
| CSA catalog/content | KEEP | `content/csa_presets.json` is the sentence/catalog source in current tests. |
| CSA planner/validator | KEEP | Structured app transaction boundary is deterministic and testable. |
| CSA Story projection | REWRITE boundary candidate | It joins applicability, interaction resolution, trigger semantics, and prompt projection; authority deserves one explicit contract. |
| CSA mandatory enactment | KEEP | Engine-side obligation/binding is the strongest current world-rule mechanism. |
| CSA runtime/reducer | KEEP then SIMPLIFY | Durable runtime patch path exists; compare with dormant DB preapply RPC before further changes. |
| Navigation | KEEP, audit authority | Current route uses deterministic destination/context projection; do not infer movement from Story prose without observation. |
| Player/NPC physical state | KEEP canonical fields | Observation reducer and posture vocabulary are reusable; presentation labels are not state. |
| Relationship reducer | KEEP, separate from physical relations | Relationship and physical relation need distinct schemas and writer rules. |
| Sexual-state ledger/validator | KEEP | Structured state and evidence boundary are preferable to input inference. |
| Frontend `view-model.js` | KEEP | Clear projection boundary and pure tests. |
| Frontend `app.js`/session state | SIMPLIFY | Pending action, session history, streaming projection, and server context are separate state machines. |
| Frontend recovery | KEEP then SIMPLIFY | Reserved setup/opening recovery is necessary; duplicate setup reservation risk must remain explicit. |
| Image selector/media routes | KEEP as projection | Selection should consume committed/evidence state; DB image catalog is separate content authority. |
| Mind Monitor | KEEP as observation/presentation | It must not write canonical relationship or sexual fact. |
| Old compatibility paths | DELETE candidate after proof | Migrations, legacy parser, aliases, and adapters need live-call inventory before removal. |

## Design document disposition

| Document family | Status | Reason |
|---|---|---|
| `COMPANY_V1_STORY_FIRST_RUNTIME_REDESIGN_CHARTER.md` | CURRENT PRINCIPLE / not source authority | Raw Story/Extract boundary is useful, but source wins on implementation details. |
| `RUNTIME_AUTHORITY_MAP.md`, `RUNTIME_CORE_RESET_CHARTER.md` | PARTIALLY_CURRENT | Reset stack was absorbed, but compatibility writers remain. |
| `CODEX_REMOVE_ACTION_EXECUTION_AUTHORITY_V1.md`, `CODEX_AUTHORITY_DELETE_LEGACY_V1.md` | PARTIALLY_CURRENT | Direction is visible in ancestry; actual dead paths require live caller evidence. |
| `COMPANY_GAME_CONTRACT_V1.md`, gameplay/narrative/UI contracts | PARTIALLY_CURRENT | Product contracts remain useful but do not enumerate all later Q-series protocol changes. |
| `RUNTIME_CORE_RESET_OPERATIONS_RUNBOOK.md`, preflight | CURRENT OPERATIONAL REFERENCE | Useful procedure; not an authority definition and not run during audit. |
| `MASTER_ARCHITECTURE.md`, `INFRASTRUCTURE_PLAN.md`, early phase docs | HISTORICAL | Bootstrap/plan context; superseded where source and current truth differ. |
| `SESSION_HANDOFF_*`, `NEW_SESSION_*`, phase handoffs | HISTORICAL EVIDENCE | Useful provenance; never final authority without source verification. |

## Precedence rule proposed

`09_CURRENT_TRUTH.md` is the human-facing technical baseline. For executable
behavior, current source and the live DB catalog outrank prose. For historical
claims, Git ancestry and immutable evidence artifacts outrank handoff reports.
An older document remains useful unless this audit explicitly marks its claim
SUPERSEDED.

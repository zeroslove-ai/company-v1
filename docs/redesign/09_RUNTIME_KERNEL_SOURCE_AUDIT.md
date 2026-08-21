# Runtime Kernel Source Audit

Status: SOURCE-AUDITED / OWNER DECISION PENDING
Date: 2026-08-21
Task: `company-redesign-runtime-kernel-bounded-audit-v1`
Audited branch: `company-redesign/product-first-canon-v1`
Design PR: #95
Primary Company UI evidence: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

This is a bounded read-only source audit. It does not select an owner-accepted
architecture and does not authorize implementation, migration, deployment, DB
access, gameplay, or merge.

## 1. Evidence boundary and recommendation

The audit used the current PR #95 design canon, the owner decisions in Issue
#68 comment `5364770509`, the current repository source, the Company v1
complete UI snapshot above, and the existing Hospital inventory/reference
documents. Candidate A is recommended as the only leading kernel candidate,
conditional on the interface and replacement boundaries in this document.

**Recommendation: `RECOMMEND_A` (advisory; owner decision pending).**

The recommendation is not that the current v2 product is retained. It is that
the transport and persistence mechanisms in `runtime-v2/` can be placed behind
a small Company-owned server interface while the product content, state,
observer contract, UI controller, and obsolete semantics are rebuilt.

## 2. Candidate A: exact source inventory

### Product-neutral or salvageable infrastructure

| Source | Classification | Evidence and boundary |
| --- | --- | --- |
| `runtime-v2/server/http.js` | `KEEP_PRODUCT_NEUTRAL` | JSON/error/CORS/SSE framing helpers; replace route names and event payloads only. |
| `runtime-v2/server/index.js` | `KEEP_PRODUCT_NEUTRAL` | Thin export/entrypoint; no product authority. |
| `runtime-v2/server/job-policy.js` | `KEEP_PRODUCT_NEUTRAL` | Explicit lease duration and bounded progress writes; constants need product-neutral names/configuration. |
| `runtime-v2/server/worker.js` | `KEEP_WITH_THIN_ADAPTER` | Owns route, reservation, Story stream, progress snapshots, one observer, reducer, commit, and fenced failure. Replace v2 content/parser/contracts and expose one Company turn command. |
| `runtime-v2/server/provider.js` stream/timeout code | `KEEP_WITH_THIN_ADAPTER` | Streaming, first-content/total/observer timeouts, and one observer call are reusable mechanics. Replace prompts, parser assumptions, and observer schema. |
| `runtime-v2/server/store.js` reservation/fence/commit shape | `KEEP_WITH_THIN_ADAPTER` | In-memory implementation proves lifecycle and conflict seams. Replace state/turn payloads and namespace. |
| `runtime-v2/server/supabase-store.js` HTTP/RPC adapter shape | `KEEP_WITH_THIN_ADAPTER` | Service-role RPC/select wiring is reusable only with new `company_r3_*` contracts. |
| `20260819000200_company_v2_phase1_vertical_slice.sql` transaction shape | `KEEP_WITH_THIN_ADAPTER` | Isolated games/state/jobs/turns, reservation, progress, and atomic state+turn insert are evidence. It is source-only and v2-namespaced. |
| `20260819000300_company_v2_stuck_turn_closure.sql` stale-job closure | `KEEP_PRODUCT_NEUTRAL` | 180-second expiry and reservation convergence are infrastructure evidence; re-express in the new namespace. |
| `20260819000400_company_v2_attempt_fencing.sql` attempt fencing | `KEEP_PRODUCT_NEUTRAL` | `action_id` + `attempt_no` protect every post-reservation writer. Reuse the invariant, not v2 identifiers. |
| `20260819000500_company_v2_acl_closure.sql` service-role ACL pattern | `KEEP_PRODUCT_NEUTRAL` | Public/anon/authenticated denial and service-role-only execution are useful security boundaries. |

### Product-coupled code that must not be carried forward as authority

| Source | Classification | Reason |
| --- | --- | --- |
| `runtime-v2/domain/content.js` | `REBUILD_PRODUCT_COUPLED` | Hard-coded v2 demo actors/locations and `company-v2-phase1` content version. |
| `runtime-v2/domain/contracts.js` | `REBUILD_PRODUCT_COUPLED` | Initial state and reducer encode v2 fields and obsolete state assumptions. |
| `runtime-v2/domain/story.js` | `REBUILD_PRODUCT_COUPLED` | Hard-coded opening and marker parser are not the natural Story + Extract contract. |
| `frontend-v2/index.html`, `frontend-v2/app.js`, `frontend-v2/styles.css` | `DELETE_DO_NOT_REUSE_AS_PRODUCT` | Reduced shell, not the high-parity Company donor; its app is also stage-oriented. |
| `src/frontend/pages/app.js` at `5ec1a76...` | `REBUILD_PRODUCT_COUPLED` | `createTurnCoordinator()` at lines 127-220 owns browser pending Story, Extract, Commit, and recovery stages. |
| `20260819000600_company_v2_choice_contract_closure.sql` | `DELETE_DO_NOT_REUSE_AS_PRODUCT` | It changes persisted choices to zero, contradicting four Story-authored choices. |

### Minimum neutral server interface

```text
createGame(canonicalSetup) -> committed context
openGame(gameId) -> idempotent opening + committed context
startTurn({ gameId, expectedTurn, actionId, literalAction }) -> one SSE stream
readContext(gameId) -> committed context + recoverable in-flight job
applyRuleTransaction(command) -> committed rule state (not a Story turn)
feedbackRevision(command) -> same-turn revision (later phase)
resetOrCreate(command) -> isolated game (later phase)
```

`startTurn` owns reservation, reconnect identity, Story streaming, progress
snapshots, one observer attempt, fail-open observer normalization, minimal
reducers, and one atomic commit. The browser submits literal intent and
renders stream/context; it does not call Story, Extract, and Commit separately.

## 3. Candidate A answers

1. **Can server ownership be hidden behind a neutral interface?** Yes. The
   worker already has the lifecycle shape, but its domain/parser/provider
   fields are not neutral.
2. **Minimum interface:** setup/opening, one `startTurn` SSE command,
   context/readback, and separate future rule/feedback/reset commands. No
   public stage endpoints.
3. **Mixed coupling:** worker calls v2 content/parser/reducer/store payloads;
   provider emits v2 prompt/observer schemas; contracts/story encode demo state
   and markers; frontend-v2 is a reduced UI plus stage coordinator.
4. **Neutral persistence:** state revision, per-turn job, immutable attempt,
   progress text, committed turn, service-role atomic RPC. Non-neutral: v2
   names, content version, JSON fields, choice constraint, and demo state.
5. **Replacement:** canonical setup/opening/content, Story prompt, natural
   choice extraction, minimal scene/presence/`scene_note` reducer, view model,
   controller, and `company_r3_*` migrations/RPCs. The old observer supplies
   lifecycle evidence only, not its schema or product assumptions.
6. **Discard cost:** progress/reconnect, stale-job closure, attempt fencing,
   revision conflict handling, atomic writes, and service-role isolation would
   need to be re-proven.
7. **Main risk:** sunk-cost leakage could reintroduce marker parsing,
   zero-choice persistence, old state fields, or browser stage authority.

## 4. Candidate B: Hospital evidence audit

Candidate B is **not proven reusable source** in this repository.

`docs/HOSPITAL_DONOR_INVENTORY.md` records the inspected external source as
`zeroslove-ai/py-all`, `origin/feature/csa-only`, commit
`16944160994d05968687333bddbf2ad97bd3b1a9`. It explicitly records that
`pages/main.js` and `pages/hypnosis-app.js` are absent and that no donor file
was copied wholesale. The remaining Worker/API/DB assumptions require a
Company adapter or rewrite.

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`
provides a behavioral reference: literal action -> Story -> visible narrative
-> one Extract -> small reducers -> Commit -> durable history/context. It
rejects copying a giant Worker, foreign relationship/event ledgers, or prompt
stacking. Company history proves presentation alignment commits, not a complete
Hospital runtime kernel that can be transplanted.

Therefore classify B as `BEHAVIORAL_REFERENCE_ONLY` for play-feel ideas and
`UNAVAILABLE_UNPROVEN` for exact runtime/source/database implementation. It is
not recommended over A on current evidence.

## 5. Candidate C: bounded interface sketch and cost

```text
setup/opening -> committed context
turn request -> reserve -> Story SSE -> one observer -> minimal reducers
            -> atomic commit -> readback context
refresh      -> committed context + in-flight recovery state
rule command -> separate CSA transaction (later gate)
feedback/reset/new-game -> separate commands (later gates)
```

The state projection is limited to canonical profile, day/time, structured
location, present actors, one replaceable `scene_note`, accepted clothing,
active rules, recent raw Story, grounded older summaries, choices, and Mind
Monitor. No dynamic player sexual meter, generic physical ontology, or
relationship/event ledger is required.

C must independently prove HTTP/SSE framing, progress, reconnect/readback,
stale-job termination, idempotent reservation, fencing, revision conflicts,
service-role persistence, and atomic commit. That is a larger proof burden
without additional product benefit. C remains a fallback if A fails the small
interface review.

## 6. Company v1 salvage verification at the complete snapshot

The exact snapshot contains the requested mature paths: `index.html`,
`styles.css` and responsive shell layers, `render.js`, `setup.js`,
`company-map.js/css`, Mind Monitor/state rendering, `csa-app.js`, `tts.js`,
history/download/media/feedback utilities, `view-model.js`, `app.js`,
`api.js`, and `sse.js`.

| Snapshot module family | Classification | Milestone-0 treatment |
| --- | --- | --- |
| `index.html`, shell/panel/mobile CSS | `KEEP_NEAR_VERBATIM` / `TRANSPLANT_PRESENTATION` | Preserve high-parity Story-first layout. |
| `render.js`, narrative/history/choice presentation | `TRANSPLANT_PRESENTATION` | Rewire to Extract choices and committed view model. |
| `setup.js` and setup DOM | `KEEP_NEAR_VERBATIM` | Keep UX validation; rewire setup command. |
| `company-map.js/css` | `KEEP_NEAR_VERBATIM` / `REWIRE_DATA_CONTRACT` | Read context and prefill literal input; never write movement. |
| Mind Monitor presentation | `TRANSPLANT_PRESENTATION` / `REWIRE_DATA_CONTRACT` | Read committed observer payload; remove obsolete numeric fields. |
| `view-model.js` | `REBUILD_CONTROLLER/SEMANTICS` | Keep one context boundary; rebuild readers. |
| `app.js` | `REBUILD_CONTROLLER/SEMANTICS` | Remove browser stage coordinator; retain only isolated UI helpers. |
| `api.js`, `sse.js` | `REWIRE_DATA_CONTRACT` | One server-owned turn stream with small events. |
| `csa-app.js` and CSA state | `TRANSPLANT_PRESENTATION` + `REBUILD_CONTROLLER/SEMANTICS` | Preserve modal UX; defer active mutation. |
| `tts.js`, history/download/media/feedback | `DEFER_KEEP_ASSET` | Sidecars do not block Milestone 0. |
| canonical content/catalogs/prompts | `KEEP_NEAR_VERBATIM` / selective rewire | Retain product facts; replace v2 demo/protocol semantics. |
| old semantic wire, broad Extract patch, meters/ledgers, generic CSA, NPC finder | `DELETE_DO_NOT_REUSE` | Explicitly outside redesign authority. |

The complete donor must not be shrunk into `frontend-v2` merely because the
kernel changes. The browser can be thinner while presentation remains
high-parity.

## 7. A-prime composition and implementation gate

```text
Company v1 high-parity presentation/content
+ thin browser controller and minimal view model
+ minimal Company state/domain rebuilt from the canon
+ Candidate A transport/persistence kernel behind the neutral interface
```

Milestone 0 may begin only after owner architecture acceptance and a new
explicit implementation task. It must use a new `company_r3_*` namespace,
leave preserved v1/v2 data untouched, and prove Story streaming, one observer,
four copied Story-authored choices, free input, `scene_note`, fail-open
observer behavior, atomic commit, and refresh/readback.

## 8. Unresolved risks returned to owner

- v2 provider/parser need a clean replacement seam; retaining them wholesale
  violates the natural Story contract.
- Source-only v2 migrations contain incompatible choice constraints: initial/
  fenced versions require four; the later closure requires zero. Neither is a
  forward schema.
- The exact `company_r3_*` schema/RPC boundary is not designed or authorized.
- High-parity transplant still needs visual/accessibility review.
- Candidate B source fidelity remains unproven; the external commit is an
  inventory input, not a license to copy or access Hospital runtime.

## 9. Validation and zero-mutation record

- Changed scope: `docs/redesign` only.
- Runtime, frontend, tests, config, migration, SQL, DB, deployment, gameplay,
  Production, and Hospital access: zero mutations.
- Preserved `supabase/.temp/`: untouched.
- PR #95: Draft and unmerged; no merge performed.
- Terminal state after report: `WAITING_OWNER_DECISION`.

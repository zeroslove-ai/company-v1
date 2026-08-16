# Company v1 physical / sexual state authority residue audit

Status: architecture-first audit; no runtime or migration change

## Baseline and method

- Branch: `company/scene-location-presence-v1`
- Start HEAD: `ade5e7e78e05fc1fe53075bfa4daa118eeb575f0`
- Canonical PR: #67, base `main`, OPEN / DRAFT / UNMERGED
- Task: `physical-sexual-state-authority-residue-audit-v1`
- Scope: source, tests, content, and migration history read-only; this artifact and
  `docs/ops/CURRENT_TASK.md` are the only intended changes.

The inventory followed the fresh `Story -> Extract -> Commit -> save/history ->
next Story/UI` path, then searched all callers of physical, clothing, sexual,
CSA execution, and media functions. Historical migrations were read as
immutable source evidence. No live TEST, database, reset, deployment, or
Production operation was performed.

## Authority flow

`src/api/turn-routes.js` accepts player input as a Story prompt input. Provider
Story is parsed by `parseFreshNarrativeV2`; Extract is normalized by
`normalizeFreshExtractObservationV2`; Commit calls the observation reducers and
the named database commit boundary. Fresh physical writes enter through
`reducePlayerPhysicalObservation` / `reduceNpcPhysicalObservation` in
`src/engine/runtime-core/observation-reducers.js`, which call
`buildSceneStatePatch`.

Fresh sexual state deltas enter `reducePlayerSexualObservation`, which calls
`reducePlayerSexualState` in `src/engine/gameplay-state.js`. Fresh sexual events
enter `reduceSexualEventDomain` in
`src/engine/runtime-core/sexual-event-reducer.js`; this is the sole fresh-turn
writer of `save.sexual_event_ledger`. Committed parsed blocks and the persisted
extract boundary are used for recovery/replay; the legacy adapter is not a fresh
provider contract.

## Classification matrix

| Area / exact authority | Evidence and current consumer | Classification | Decision / deletion target |
| --- | --- | --- | --- |
| `buildSceneStatePatch` -> `player_scene_state` and `npc_scene_state[id]` physical fields | Called only by the two observation reducers; writes posture, position label, and clothing detail after Extract | `KEEP_WITH_PROVEN_CONSUMER` for the writer boundary; implementation defect below | Keep one reducer path. Do not add input or ACTING writers. |
| `retainEvidencedClothing` in `src/engine/state/clothing.js` | Exact Story quote and actor identity are required; `src/frontend/pages/view-model.js`, `src/api/runtime-display.js`, and product recovery read compact clothing | `KEEP_WITH_PROVEN_CONSUMER` | Preserve the four canonical slots: `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom`. |
| `company_initial_clothing_v2`, setup/opening/reset initialization | `20260809000100` and later additive bootstrap/reset sources initialize the same compact slots; these are initialization writers, not fresh-turn writers | `KEEP_WITH_PROVEN_CONSUMER` | Retain as one state shape. Remove duplicate semantic catalogs, not the UI state. |
| `requiredClothingFromActiveCsa` and old clothing execution derivation | `requiredClothingFromActiveCsa` has no current production caller; only the contract test was found. `execution-policy.js` derives old catalog rows | `REMOVE` | Remove unused CSA clothing projection and its obsolete test after a final caller check. The actual evidenced clothing reducer remains. |
| `POSTURE_VALUES` and `END_REASON_VALUES` in `state/posture.js` | No current caller; `normalizePhysicalText` and `buildPosturePatch` accept concise arbitrary text instead | `REMOVE` | Delete unused finite sets and tests that treat them as the posture universe. Preserve arbitrary text normalization and the eventual evidence boundary. |
| Posture / position proposal path in `buildSceneStatePatch` | `postureEvidenceValid` and `positionEvidenceValid` produce warnings, but `buildPosturePatch` is still applied for a changed Extract proposal even when exact Story evidence is absent. `frontend-projection-contract.test.mjs` asserts this behavior | `REMOVE` | Next implementation cut must reject the unevidenced change from durable state while preserving the prior state and warning. This audit intentionally does not patch runtime. |
| Player input and parsed Story ACTING metadata as physical success | Input is only passed into Story context; `turn-atomicity-contract.test.mjs` proves player ACTING alone does not write posture. No direct input-to-save writer was found | `REMOVE` | Keep this invariant. Any future ACTING success shortcut is out of architecture. |
| Fresh Extract physical schema | `extract-observation.js` exposes arbitrary posture/position and narrow clothing slots; scene/identity evidence is structurally validated | `KEEP_WITH_PROVEN_CONSUMER` | Keep the narrow physical observation shape, but make exact Story evidence authoritative for durable changes. |
| `player_sexual_state` and `reducePlayerSexualState` | `character-display.js`, `frontend/pages/view-model.js`, and recovery/display paths read arousal, progress, count, erection, and last event; reducer writes the compact mechanical state | `KEEP_WITH_PROVEN_CONSUMER` | Preserve the mechanical/UI state. Next cut must audit exact evidence for arousal/progress deltas; current code accepts some deltas without a corresponding exact quote. |
| `sexual_event_ledger` and `reduceSexualEventDomain` | Sole fresh writer; ledger requires registered actor/target, exact Story evidence, dedupe, completed/interrupted state, and ejaculation count effects. Character display and the frontend use it; it also selects the sexual image pool | `KEEP_WITH_PROVEN_CONSUMER` | Preserve the ledger as evidence/mechanical/UI history, not as a relationship or consent authority. |
| `STRUCTURED_SEXUAL_ACTIONS` / `LEDGER_ACTION_TYPES` | Used by fresh event normalization and ledger validation; finite values include kiss, sexual touch, exposure, genital touch, oral, penetration, orgasm | `NARROW_PROJECTION_ONLY` | Keep only as a narrow mechanical/ledger projection. A later cut must prevent an action taxonomy from rejecting an otherwise evidenced open-ended narrative fact. |
| `sexual-state/validator.js` intimacy-stage advancement | It defines an intimacy-stage gate, but no current production caller was found; current display reads ledger/history rather than this validator | `REMOVE` | Delete validator and its obsolete tests only after the caller/data inventory confirms no persisted reader needs it. Do not infer relationship advancement from sexual events. |
| `npc_sexual_state` / relationship `sexual_history` mirrors | Runtime display has a narrow NPC sexual-state read; `character-display.js` also reads legacy `npc_relationship_state[id].sexual_history` alongside the ledger. No fresh writer for these mirrors was found | `HISTORICAL_COMPATIBILITY_ONLY` | Keep only at explicit recovery/display compatibility boundaries. Delete after the reader migration proves ledger/state-only reads. |
| CSA semantic contract actions/directions | `semantic-contract.js` and transaction validation are used for institutional rule activation/update capability checks; this is rule identity/applicability, not event occurrence or consent | `KEEP_WITH_PROVEN_CONSUMER` | Keep institutional contract validation, but never use it as Story/Extract physical or sexual truth. |
| CSA physical execution grammar | Current `execution-policy.js` retains only `clothing_state`; `mandatory-enactment.js` now composes institutional notices and does not require ACTING tokens. No fresh physical enactment writer is present | `REMOVE` | Remove remaining mandatory physical/contact/sexual execution grammar and unused exports after the caller/test inventory is complete. Preserve institutional notice metadata and compact clothing only where proven. |
| `image_library`, `image_pool`, `is_sexual`, tags, action families, `selectImage` | Core migration creates general/sex pools; `turn-routes.js` queries at most eight rows and calls deterministic `image-selector.js`; frontend view model consumes the result. Miss returns null/alternate image and is not a turn error | `NARROW_PROJECTION_ONLY` | Preserve proven media adapters, including manual/oral/penetration/climax families. Classification failure must never reject Story, Extract, or Commit. |
| Persisted Extract / legacy adapter | `persisted-extract-observation.js`, `legacy-extract-adapter.js`, and turn recovery support stored historical rows and committed replay | `HISTORICAL_COMPATIBILITY_ONLY` | Keep until all supported stored turns use committed parsed blocks and no route requires legacy re-parsing; then remove the adapter and its fixtures. |

## Clothing proof

There is one current compact UI continuity shape and one fresh-turn writer:
`retainEvidencedClothing` merges the four slots into the actor's scene state.
The API and frontend project that same state; CSA only supplies a contextual
required-state projection and does not create a clothing fact. Setup/opening/
reset initialization repeats the same canonical shape in database bootstrap
functions, but it is not a second semantic turn writer. The deletion target is
the unused CSA execution/projection residue and duplicate semantic catalogs,
not `player_scene_state.clothing` or `npc_scene_state[id].clothing`.

## Sexual and consent boundary

The ledger and player sexual state have real display/mechanical consumers. They
must not be deleted merely because their action labels are finite. The finite
labels should become a narrow projection that can fail open while the raw
Story/Extract fact remains available. `npc_relationship_state`, consent,
comfort, affection, trust, and intimacy stage are separate domains; no sexual
event may advance them automatically. The unused intimacy validator is a
deletion candidate, not a reason to add a relationship writer.

CSA remains institutional rule identity, lifecycle, scope, and transaction
mechanics. It is not consent, comfort, affection, trust, emotion, or proof that
a physical/sexual event occurred. Current Story composition carries
institutional notices only; it does not create a physical enactment contract.

## Migration history and future DB boundary

Relevant historical/additive source includes core `image_library` and save
shape (`20260803000100`), initial compact clothing (`20260809000100`), opening
bootstrap/runtime authority (`20260810000100`, `20260810103000`), legacy residue
cleanup (`20260816000200`), reset canonicalization (`20260816020000`), scene
mirror closure (`20260816030000`), and setup/opening world authority
(`20260816040000`). These files were not edited or applied in this audit.

Any future removal of unused physical/sexual mirrors or validators requires a
new additive migration only after live caller/data proof. Historical migration
files remain immutable. A future migration must preserve structural save
validation, `image_library`, compact clothing columns/JSON shape, the approved
turn commit boundary, and any reader needed for historical replay.

## Test audit

### KEEP

- `extract-observation-contract.test.mjs`: fresh physical/sexual structural
  normalization and exact evidence shape.
- `state-evidence-boundaries.test.mjs`: clothing evidence, actor separation,
  off-scene rejection, and legacy adapter boundary.
- `gameplay-state-contract.test.mjs`: bounded sexual mechanical state; extend
  later with exact-evidence cases.
- `turn-transaction-replay.test.mjs`, `turn-pipeline-replay.test.mjs`, and
  `turn-atomicity-contract.test.mjs`: commit/replay, no direct ACTING success,
  and evidence/CSA separation.
- `frontend-projection-contract.test.mjs`, `frontend-recovery-contract.test.mjs`,
  `frontend-view-model.test.mjs`, `runtime-display-contract.test.mjs`, and
  `product-recovery-contract.test.mjs`: actual clothing/sexual/UI projections.
- `content-media-contract.test.mjs` and the media portions of
  `narrative-presentation-contract.test.mjs`: deterministic presentation-only
  image behavior.

### REWRITE

- `frontend-projection-contract.test.mjs`: replace the current assertion that
  an unevidenced posture/position proposal is persisted with the intended
  evidence-boundary invariant; retain the evidenced arbitrary-text case.
- `gameplay-state-contract.test.mjs`: add explicit Story-evidence cases for
  arousal/progress/completion and distinguish mechanical state from event
  occurrence.
- `extract-observation-contract.test.mjs` and the sexual portions of
  `turn-transaction-replay.test.mjs`: test that an unknown/open-ended sexual
  fact remains available even when a narrow action projection cannot classify
  it.
- `csa-definition-contract.test.mjs` / `csa-runtime-contract.test.mjs`: retain
  institutional scope and compact-clothing consumer tests, but remove tests
  that imply CSA physical enactment is narrative truth.
- `turn-atomicity-contract.test.mjs`: replace exact prompt prose/marker
  assertions with observable “no ACTING metadata becomes durable state”
  behavior.
- `reset-recovery-contract.test.mjs`: replace migration filename/source
  existence checks with the reset/recovery behavior they are intended to guard.

### DELETE after proof

- Any test of `POSTURE_VALUES`, `END_REASON_VALUES`, unused intimacy-stage
  validator behavior, or CSA physical execution tokens once the caller scan is
  complete.
- `test/fixtures/csa-physical-invalid-*.json` if no current reader remains;
  preserve independent historical failure artifacts outside fixtures.
- Source/SQL/file-name assertions that only prove a migration fragment or
  implementation string exists; migration behavior belongs to a catalog/gate
  or verified live evidence, not text matching.

## Next coherent implementation cut

Recommend `physical-sexual-evidence-boundary-v1` as the next implementation
task, after review:

1. Make posture and position changes durable only with exact Story evidence;
   keep arbitrary narrative text and fail the projection open.
2. Add evidence tests for player sexual deltas and separate event occurrence
   from relationship/consent state.
3. Narrow fresh sexual action classification to a presentation/mechanical
   projection; never reject the underlying evidenced fact or block Commit.
4. Remove unused posture enums, intimacy validator, CSA physical enactment
   residue, and `requiredClothingFromActiveCsa` only after exact caller/data
   proof; keep the compact clothing consumer and media selector.
5. Migrate any remaining NPC sexual/relationship mirrors at a reader boundary,
   then remove them with a later additive migration. Preserve legacy replay
   until its deletion condition is met.

No implementation was performed in this audit. The unresolved proof items are
the final production caller/data check for the intimacy validator, CSA clothing
projection, NPC sexual mirrors, and persisted legacy rows; these are explicit
gates, not assumptions.


# Runtime Core Reset progress

## Phase 1 — stored action authority

- Approved/frozen. `game_actions.structured_action` is resolved once and reused for Story, Extract, Commit, replay, recovery, and feedback revision.
- A non-null request must match the stored action exactly; CSA definitions change only from a stored, revalidated transaction plan.

## Phase 2 — canonical scene and presence

- Approved/frozen. The canonical gameplay scene keeps separate `scene_id`, `location_id`, `beat`, `goal`, `focus_thread`, `present_npc_ids`, `focal_character_id`, `last_speaker_id`, and `updated_turn`.
- `hydrateCanonicalScene()` bootstraps deterministically without unioning legacy participants, last presence, or present flags.
- `reduceCanonicalScene()` is the single scene writer; `projectCanonicalSceneToLegacy()` remains the save-schema compatibility writer.
- SceneCast is Story-only context, not Extract context.
- `buildLegacySceneObservation()` is deleted in Phase 4; no production caller remains.

## Phase 3 — Extract Observation V2

- Approved/frozen. Phase 3 final baseline: **688 tests**.
- Fresh Extract output is normalized as `extract_version: 2` observation data and reduced by `reduceGameplayCommit()` through explicit domain reducers and the canonical scene reducer.
- `adaptLegacyExtractDelta()` remains the read-only adapter for persisted V1 action rows; fresh V2 extraction never uses it.
- Parser choices, dialogue order, player inner thought, and raw Story remain parser authorities. Extract authority violations are hard failures; transport failures use degraded V2 observation.
- Scene evidence is exact-quote based, final presence is covered at Commit, and Mind Monitor stores only resulting current presence.

## Phase 4 — legacy runtime prune

- Branch: `company/runtime-core-reset-v1-legacy-prune`.
- Stacked Draft PR base: `company/runtime-core-reset-v1-extract-observation`.
- `guarded-merge.js` is deleted. Its choice fallback helper now lives as a non-exported helper inside `observation-reducers.js`.
- Deprecated guarded merge, movement sanitizer, legacy Extract envelope normalizers, and legacy scene observation/projection adapters are removed from production exports and callers.
- `legacy-extract-adapter.js` remains for persisted V1 rows only.
- Source line reduction and deleted symbols are recorded in the Phase 4 completion report.

## Remaining phases

## Phase 5 — presentation authority and media projections

- Branch: `company/runtime-core-reset-v1-projection-boundaries` (stacked Draft PR on `company/runtime-core-reset-v1-legacy-prune`).
- Phase 5 final baseline: **543/543 passed, 0 skipped, 0 failed**.
- Frontend Story text, dialogue, choices, and inner thought remain parser projections; ephemeral Extract responses are not ViewModel authority.
- Canonical scene is the only current presence/focal/speaker/location reader when `scene.version === 1`; legacy fields are compatibility-only for pre-scene saves.
- Committed V2 Extract is the only image/Mind Monitor media source. A single `createCompanyTts()` controller consumes parser dialogue lines after Commit refresh, with cross-turn queue preservation, same-turn revision replacement, queued/in-flight/completed dedupe, stop/replay, and sequential playback. Image responses are latest-request guarded.
- Deleted duplicate utility TTS and prototype policy paths; HTML loads the controller through `app.js` only. Opening remains an authorized turn-0 bootstrap; setup/opening writers are unchanged.

Remaining phases: setup/opening bootstrap audit and operational migration/deployment work.

## Forbidden regressions

- No new matcher, verifier, semantic gate, fallback authority, database/migration change, Supabase write, live LLM call, Worker deployment, or operating-save repair.

## Verification

- Product regression coverage remains on the V2 Story→Extract→Commit path, persisted V2 replay, persisted V1 adaptation, feedback revision, movement outcomes, presence, relationship evidence, off-scene domain eligibility, deterministic events, choice fallback, degraded transport, and Turns 12/16/17.

# Runtime Core Reset progress

## Phase 1 — stored action authority

- `game_actions.structured_action` is resolved once and reused as the authority for Story, Extract, Commit, replay, recovery, and feedback revision.
- A non-null request must match the stored action exactly; a non-null request without persistence fails before Story work.
- `csa_active` and `csa_rules` can change only from a stored, revalidated transaction plan.

## Phase 2 — canonical scene and presence

- Working branch: `company/runtime-core-reset-v1-canonical-scene`.
- The canonical gameplay scene is a version-1 object with separate `scene_id`, `location_id`, `beat`, `goal`, `focus_thread`, `present_npc_ids`, `focal_character_id`, `last_speaker_id`, and `updated_turn`.
- `hydrateCanonicalScene()` performs a deterministic, non-mutating one-time bootstrap. Existing version-1 scenes are authoritative; legacy participants, last presence, and present flags are never unioned.
- `buildLegacySceneObservation()` is a temporary Extract observation adapter. Null final presence means unobserved; an empty array means an observed player-only scene.
- `reduceCanonicalScene()` is the single gameplay scene writer. Only a successful movement with an explicit final presence snapshot changes location/presence and resets `beat`; stationary, partial, interrupted, blocked, refused, and degraded turns preserve scene fields while advancing ordinary gameplay `beat`/`updated_turn`. Feedback revisions preserve the entire canonical scene.
- `projectCanonicalSceneToLegacy()` is the single legacy compatibility writer for scene participants, last presence, focal, last speaker, and NPC presence/location fields. Physical clothing/posture data remains separate and is preserved.
- `assertCanonicalSceneInvariants()` compares the actual saved canonical and legacy fields (not a newly generated projection) and stops Commit on invalid presence, focal, speaker, location, or projection state.
- Commit no longer calls `sanitizeMovementCommit()` or uses `buildSceneCastContract()` as a presence writer. Scene cast remains Story/Extract context only.
- `applyGuardedStateDelta()` no longer writes scene presence, focal, last speaker, or NPC presence/location fields; it remains the non-scene physical/stat/relationship merge path.
- Opening initialization creates the canonical scene and then projects it through the same legacy projection.

## Phase 3 — Extract Observation V2

- Working branch: `company/runtime-core-reset-v1-extract-observation` (stacked on the Phase 2 canonical-scene branch).
- Fresh Extract output is normalized as `extract_version: 2` observation data. Save-path patches are rejected from the V2 contract.
- `reduceGameplayCommit()` is the production Commit orchestration writer. It delegates existing physical/stat/relationship/sexual reducers, applies the Phase 2 canonical scene reducer, projects legacy scene fields, advances time, and validates invariants.
- `adaptLegacyExtractDelta()` is read-only compatibility for persisted V1 action rows; fresh V2 extraction does not use it.
- Parser choices, dialogue order, player inner thought, and raw Story remain parser authorities; Extract does not write replacement projections.
- `applyGuardedStateDelta()` remains only as a deprecated V1 test/comparison entry point and has no API production caller.

## Remaining phases

- Phase 4: remove the deprecated V1 guarded-merge entry point after persisted-row compatibility is no longer needed.
- Later phases: UI, TTS/image projections, setup/opening cleanup, and operational migration work.

## Forbidden regressions

- No new matcher, verifier, semantic gate, or fallback authority.
- No database or migration changes, Supabase writes, live LLM calls, Worker deployment, or operating-save repair in this phase.

## Verification

- Phase 2 regression suite covers bootstrap precedence, null/empty presence, movement, focal/last-speaker rules, projection idempotence, operational turns 12/16/17, and route boundaries.
- The Phase 2 baseline passed 661 tests. Phase 3 adds observation/reducer and route-boundary coverage; the current full suite passes 676 tests.

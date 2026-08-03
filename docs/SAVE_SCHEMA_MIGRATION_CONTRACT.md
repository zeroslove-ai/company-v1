# Save schema migration contract

Phase 0.5 defines no SQL and creates no database migration. It freezes a company canonical save v1 for the future Phase 1 migration package.

## Migration rules

- Every save contains `save_schema_version`.
- Migration functions are pure and deterministic: no network, database, timer, or random access.
- Applying the same migration twice yields the same result.
- A future unsupported version is a hard error.
- Missing optional fields receive defaults; existing state is not silently deleted.
- A failed migration preserves the original save.
- Downgrade is unsupported.
- Applying migrations requires separate authorization after Phase 1.

## Canonical save v1 fields

`save_schema_version`, `edition`, `turn_state`, `player`, `player_scene_state`, `player_sexual_state`, `world_state`, `scene_state`, `npc_stats`, `npc_emotion`, `npc_relationship_state`, `npc_scene_state`, `npc_work_state`, `csa_active`, `csa_rules`, `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`, `event_ledger`, `story_summary_overall`, `story_summary_recent`, `focal_character_id`, `last_speaker_id`, `last_npcs_present`, `last_image_id`, `last_choices`, and `last_choice_meta` are required top-level fields.

`turn_state` contains `committed_turn`, `processing_status`, `turn_id`, `action_id`, and `expected_turn`. `scene_state` contains `scene_id`, `location_id`, `participants`, `focus_thread`, `scene_goal`, `beat`, `exit_conditions`, and `updated_turn`.

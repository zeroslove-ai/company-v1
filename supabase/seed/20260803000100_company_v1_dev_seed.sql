-- Fixed development seed only. It does not provision or modify any production game.
do $$
declare
  v_game_id uuid := '11111111-1111-4111-8111-111111111111';
  v_save jsonb := $save$
  {
    "save_schema_version": 1,
    "edition": "company-v1",
    "turn_state": {"committed_turn": 0, "processing_status": "idle", "turn_id": null, "action_id": null, "expected_turn": 1},
    "player": {"player_id": "player-1", "name": "Development Player", "department": "marketing"},
    "player_scene_state": {"location_id": "marketing_floor", "updated_turn": 0, "clothing": {"uniform_top":"worn","uniform_bottom":"worn","underwear_top":"worn","underwear_bottom":"worn"}},
    "player_sexual_state": {"arousal": 0, "updated_turn": 0},
    "world_state": {"time_block": "morning", "work_hook": {"id": "campaign-review", "status": "open"}},
    "scene_state": {"scene_id": "opening", "location_id": "marketing_floor", "participants": ["player-1", "npc-hayeon", "npc-areum", "npc-minsu"], "focus_thread": "campaign-review", "scene_goal": "begin the campaign review", "beat": 0, "exit_conditions": [], "updated_turn": 0},
    "npc_stats": {"npc-hayeon": {"affection": 5}, "npc-areum": {"affection": 2}, "npc-minsu": {"affection": 0}},
    "npc_relationship_state": {
      "npc-hayeon": {"closeness": "familiar", "romance_status": "interest", "current_boundary": "cautious", "milestones": {"first_kiss_turn": null, "sexual_relationship_started_turn": null}, "relationship_summary": "Campaign partner."},
      "npc-areum": {"closeness": "acquaintance", "romance_status": "none", "current_boundary": "open", "milestones": {"first_kiss_turn": null, "sexual_relationship_started_turn": null}, "relationship_summary": "Works in the same team."}
    },
    "npc_scene_state": {"npc-hayeon": {"present": true, "clothing": {"uniform_top":"worn","uniform_bottom":"worn","underwear_top":"worn","underwear_bottom":"worn"}}, "npc-areum": {"present": true, "clothing": {"uniform_top":"worn","uniform_bottom":"worn","underwear_top":"worn","underwear_bottom":"worn"}}, "npc-minsu": {"present": true, "clothing": {"uniform_top":"worn","uniform_bottom":"worn","underwear_top":"worn","underwear_bottom":"worn"}}},
    "csa_active": ["csa-dress-code", "csa-status-report"],
    "csa_rules": {
      "csa-dress-code": {"execution_mode": "mandatory", "required_action": "wear campaign badge", "strength": 2},
      "csa-status-report": {"execution_mode": "normative", "required_action": "give a status update", "strength": 1}
    },
    "csa_attitudes": {
      "npc-hayeon": {"common_sense_baseline": 1, "csa_attitudes": {"csa-dress-code": {"familiarity": 2, "resistance": 1, "last_changed_turn": 0}}},
      "npc-areum": {"common_sense_baseline": 0, "csa_attitudes": {"csa-status-report": {"familiarity": 0, "resistance": 3, "last_changed_turn": 0}}}
    },
    "csa_runtime_state": {},
    "csa_aftereffect_state": {},
    "focal_character_id": "npc-hayeon",
    "last_speaker_id": "npc-areum",
    "last_npcs_present": ["npc-hayeon", "npc-areum", "npc-minsu"],
    "last_image_id": null,
    "last_choices": [],
    "last_choice_meta": []
  }
  $save$::jsonb;
begin
  insert into public.games (id, edition_id, title, status, content_version)
  values (v_game_id, 'company-v1', 'Company v1 development', 'draft', '0.0.1-skeleton')
  on conflict (id) do update set
    title = excluded.title,
    status = excluded.status,
    content_version = excluded.content_version;

  insert into public.game_master (game_id, master_schema_version, data, initial_save)
  values (
    v_game_id,
    1,
    '{"edition_id":"company-v1","organization":{"company_id":"luminous_brand_group"},"characters":{"npc-hayeon":{"role":"main"},"npc-areum":{"role":"main"}},"general_npcs":{"npc-minsu":{"role":"general"}}}'::jsonb,
    v_save
  )
  on conflict (game_id) do update set
    master_schema_version = excluded.master_schema_version,
    data = excluded.data,
    initial_save = excluded.initial_save;

  insert into public.game_save (game_id, save_schema_version, committed_turn, save_revision, data)
  values (v_game_id, 1, 0, 0, v_save)
  on conflict (game_id) do update set
    save_schema_version = excluded.save_schema_version,
    committed_turn = excluded.committed_turn,
    save_revision = excluded.save_revision,
    data = excluded.data;
end;
$$;

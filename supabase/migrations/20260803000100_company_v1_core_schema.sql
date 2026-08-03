-- Company v1 Phase 1 core schema. This package is not applied by this repository.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.games (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null default 'company-v1' check (edition_id = 'company-v1'),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  content_version text not null default '0.0.1-skeleton',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_master (
  game_id uuid primary key references public.games(id) on delete cascade,
  master_schema_version integer not null default 1,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  initial_save jsonb not null check (
    jsonb_typeof(initial_save) = 'object'
    and initial_save ->> 'save_schema_version' = '1'
    and initial_save ->> 'edition' = 'company-v1'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_save (
  game_id uuid primary key references public.games(id) on delete cascade,
  save_schema_version integer not null default 1 check (save_schema_version = 1),
  committed_turn integer not null default 0 check (committed_turn >= 0),
  save_revision bigint not null default 0 check (save_revision >= 0),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and data ->> 'save_schema_version' = save_schema_version::text
    and data ->> 'edition' = 'company-v1'
    and data #>> '{turn_state,committed_turn}' = committed_turn::text
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_actions (
  action_id uuid primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  turn_id uuid not null default gen_random_uuid(),
  action_kind text not null default 'player_turn' check (action_kind in ('player_turn', 'feedback_revision')),
  expected_turn integer not null check (expected_turn >= 0),
  player_action text,
  feedback_text text,
  revision_request_id uuid,
  processing_status text not null check (processing_status in (
    'story_streaming', 'extracting', 'committing', 'ready',
    'story_failed', 'extract_failed', 'commit_failed', 'committed'
  )),
  story_text text,
  parsed_blocks jsonb,
  extract_delta jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, turn_id)
);

create unique index game_actions_revision_request_id_key
  on public.game_actions (game_id, revision_request_id)
  where revision_request_id is not null;
create index game_actions_game_expected_turn_idx
  on public.game_actions (game_id, expected_turn);
create index game_actions_game_processing_status_idx
  on public.game_actions (game_id, processing_status);

create table public.game_turns (
  turn_id uuid primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  turn_number integer not null check (turn_number > 0),
  revision_number integer not null default 1 check (revision_number > 0),
  record_status text not null default 'active' check (record_status in ('active', 'superseded')),
  action_id uuid not null unique references public.game_actions(action_id),
  supersedes_turn_id uuid references public.game_turns(turn_id),
  revision_request_id uuid,
  player_action text not null,
  feedback_text text,
  story_text text not null,
  parsed_blocks jsonb not null default '{}'::jsonb check (jsonb_typeof(parsed_blocks) = 'object'),
  extract_delta jsonb not null default '{}'::jsonb check (jsonb_typeof(extract_delta) = 'object'),
  pre_save jsonb not null check (jsonb_typeof(pre_save) = 'object'),
  post_save jsonb not null check (jsonb_typeof(post_save) = 'object'),
  turn_summary text not null default '',
  mind_monitor jsonb not null default '{}'::jsonb check (jsonb_typeof(mind_monitor) = 'object'),
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  committed_at timestamptz not null default now(),
  unique (game_id, turn_number, revision_number)
);

create unique index game_turns_active_turn_key
  on public.game_turns (game_id, turn_number)
  where record_status = 'active';
create unique index game_turns_revision_request_id_key
  on public.game_turns (game_id, revision_request_id)
  where revision_request_id is not null;
create index game_turns_game_committed_at_idx
  on public.game_turns (game_id, committed_at desc);

create table public.image_library (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null default 'company-v1' check (edition_id = 'company-v1'),
  image_id text not null unique,
  character_id text not null,
  situation text,
  short_description text,
  tags text[] not null default '{}',
  image_pool text not null default 'general' check (image_pool in ('general', 'sex')),
  is_sexual boolean not null default false,
  curation_rank integer,
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger games_set_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger game_master_set_updated_at before update on public.game_master
  for each row execute function public.set_updated_at();
create trigger game_save_set_updated_at before update on public.game_save
  for each row execute function public.set_updated_at();
create trigger game_actions_set_updated_at before update on public.game_actions
  for each row execute function public.set_updated_at();
create trigger image_library_set_updated_at before update on public.image_library
  for each row execute function public.set_updated_at();

alter table public.games enable row level security;
alter table public.game_master enable row level security;
alter table public.game_save enable row level security;
alter table public.game_actions enable row level security;
alter table public.game_turns enable row level security;
alter table public.image_library enable row level security;

revoke all on table public.games, public.game_master, public.game_save,
  public.game_actions, public.game_turns, public.image_library
  from anon, authenticated, public;

create or replace function public.validate_company_save_v1(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_errors text[] := '{}';
  v_key text;
  v_required_keys text[] := array[
    'save_schema_version', 'edition', 'turn_state', 'player',
    'player_scene_state', 'player_sexual_state', 'world_state', 'scene_state',
    'npc_stats', 'npc_emotion', 'npc_relationship_state', 'npc_scene_state',
    'npc_work_state', 'csa_active', 'csa_rules', 'csa_attitudes',
    'csa_runtime_state', 'csa_aftereffect_state', 'event_ledger',
    'story_summary_overall', 'story_summary_recent', 'focal_character_id',
    'last_speaker_id', 'last_npcs_present', 'last_image_id', 'last_choices',
    'last_choice_meta'
  ];
begin
  if p_save is null or jsonb_typeof(p_save) <> 'object' then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('save must be an object'));
  end if;

  foreach v_key in array v_required_keys loop
    if not (p_save ? v_key) then
      v_errors := array_append(v_errors, format('missing required key: %s', v_key));
    end if;
  end loop;

  if p_save ->> 'save_schema_version' <> '1' then
    v_errors := array_append(v_errors, 'save_schema_version must be 1');
  end if;
  if p_save ->> 'edition' <> 'company-v1' then
    v_errors := array_append(v_errors, 'edition must be company-v1');
  end if;
  if jsonb_typeof(p_save -> 'csa_active') <> 'array'
     or jsonb_array_length(p_save -> 'csa_active') > 4 then
    v_errors := array_append(v_errors, 'csa_active must be an array with at most four items');
  end if;
  if jsonb_typeof(p_save -> 'event_ledger') <> 'array' then
    v_errors := array_append(v_errors, 'event_ledger must be an array');
  end if;
  if jsonb_typeof(p_save -> 'last_choices') <> 'array' then
    v_errors := array_append(v_errors, 'last_choices must be an array');
  end if;
  if jsonb_typeof(p_save -> 'last_npcs_present') <> 'array' then
    v_errors := array_append(v_errors, 'last_npcs_present must be an array');
  end if;
  if jsonb_typeof(p_save -> 'turn_state') <> 'object' then
    v_errors := array_append(v_errors, 'turn_state must be an object');
  end if;
  if jsonb_typeof(p_save -> 'scene_state') <> 'object' then
    v_errors := array_append(v_errors, 'scene_state must be an object');
  end if;

  return jsonb_build_object(
    'valid', coalesce(array_length(v_errors, 1), 0) = 0,
    'errors', to_jsonb(v_errors)
  );
end;
$$;

revoke all on function public.validate_company_save_v1(jsonb) from public;
grant execute on function public.validate_company_save_v1(jsonb) to service_role;

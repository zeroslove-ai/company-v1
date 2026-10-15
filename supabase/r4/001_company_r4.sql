-- R4-only local schema. Never apply to a remote or R3 database.
CREATE TABLE IF NOT EXISTS company_r4_games (
  game_id text PRIMARY KEY,
  status text NOT NULL,
  profile jsonb,
  state jsonb NOT NULL,
  content_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_r4_jobs (
  job_id text PRIMARY KEY,
  game_id text NOT NULL REFERENCES company_r4_games(game_id),
  command_id text NOT NULL,
  request_id text NOT NULL,
  operation_kind text NOT NULL,
  command_hash text NOT NULL,
  command jsonb NOT NULL,
  feedback_state_before jsonb,
  original_turn_revision integer,
  status text NOT NULL,
  stage text NOT NULL,
  attempt_no integer NOT NULL DEFAULT 0,
  expected_state_revision integer NOT NULL,
  feedback_text text,
  original_turn_number integer,
  story_checkpoint text,
  observer_raw jsonb,
  receipt jsonb,
  error jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, request_id)
);
CREATE INDEX IF NOT EXISTS company_r4_jobs_game_created
  ON company_r4_jobs (game_id, created_at DESC);

CREATE TABLE IF NOT EXISTS company_r4_turns (
  game_id text NOT NULL REFERENCES company_r4_games(game_id),
  turn_number integer NOT NULL,
  turn_revision integer NOT NULL,
  turn_record jsonb NOT NULL,
  command_json jsonb NOT NULL,
  state_before jsonb NOT NULL,
  state_after jsonb NOT NULL,
  story_text text NOT NULL,
  narrative_body text NOT NULL,
  turn_digest jsonb,
  actor_ids text[] NOT NULL DEFAULT '{}',
  memory_keywords text[] NOT NULL DEFAULT '{}',
  memory_important boolean NOT NULL DEFAULT false,
  search_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, turn_number, turn_revision)
);
CREATE INDEX IF NOT EXISTS company_r4_turns_latest
  ON company_r4_turns (game_id, turn_number DESC, turn_revision DESC);
CREATE INDEX IF NOT EXISTS company_r4_turns_actor_ids
  ON company_r4_turns USING gin (actor_ids);
CREATE INDEX IF NOT EXISTS company_r4_turns_keywords
  ON company_r4_turns USING gin (memory_keywords);
CREATE TABLE IF NOT EXISTS company_r4_model_calls (
  call_id text PRIMARY KEY,
  game_id text NOT NULL,
  command_id text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('story', 'observer')),
  model text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  finish_reason text,
  error_code text,
  input_tokens integer,
  output_tokens integer
);
CREATE TABLE IF NOT EXISTS company_r4_memory_index (
  game_id text NOT NULL REFERENCES company_r4_games(game_id),
  turn_number integer NOT NULL,
  source_revision integer NOT NULL,
  turn_digest jsonb,
  actor_ids text[] NOT NULL DEFAULT '{}',
  memory_keywords text[] NOT NULL DEFAULT '{}',
  memory_important boolean NOT NULL DEFAULT false,
  search_text text NOT NULL DEFAULT '',
  PRIMARY KEY (game_id, turn_number)
);
CREATE INDEX IF NOT EXISTS company_r4_memory_actor_ids
  ON company_r4_memory_index USING gin (actor_ids);
CREATE INDEX IF NOT EXISTS company_r4_memory_keywords
  ON company_r4_memory_index USING gin (memory_keywords);

CREATE INDEX IF NOT EXISTS company_r4_model_calls_started
  ON company_r4_model_calls (started_at);

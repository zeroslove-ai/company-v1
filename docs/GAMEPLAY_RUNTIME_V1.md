# Company gameplay runtime v1

This connects the merged `docs/COMPANY_GAMEPLAY_STATE_CONTRACT_V1.md` and `docs/COMPANY_NARRATIVE_CONTRACT_V1.md` contracts to the live Story → Extract → guarded Commit runtime. It does not activate heroine content, images, TTS, or deployment; see "Out of scope" below.

## Where the contracts are wired

| Concern | File |
| --- | --- |
| Story LLM request | `src/api/llm.js` (`streamStory`) |
| Story prompt (four-section narrative contract) | `src/engine/story-prompt.js` |
| Story parser (Korean sections + legacy internal markers) | `src/engine/narrative-parser.js` |
| Extract LLM request | `src/api/llm.js` (`runExtract`) |
| Extract prompt (canonical envelope contract) | `src/engine/extract-prompt.js` |
| Extract envelope normalize, Mind Monitor, time, sexual state, degraded envelope | `src/engine/gameplay-state.js` |
| Guarded merge pipeline | `src/engine/guarded-merge.js` |
| Route wiring, read-path hydration, degraded routing, timing logs | `src/api/turn-routes.js`, `src/api/timing.js` |

## Story LLM request

`{ model: STORY_MODEL, messages, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000 }`. `STORY_MODEL` is read from the existing environment variable; no model name is hardcoded, and there is no automatic Story retry or fallback model.

## Extract LLM request

`{ model: EXTRACT_MODEL, messages, stream: false, thinking: { type: 'disabled' }, response_format: { type: 'json_object' }, max_tokens: 5000 }`, capped at a 75-second timeout via `AbortSignal.timeout`. Extract runs at most once per turn; there is no repair call or second model.

## User-visible four sections

`src/engine/story-prompt.js` instructs the model to emit exactly `[1. 서사 및 행동] [2. 플레이어 속마음] [3. 플레이어 상황판] [4. 선택지]` with dialogue inlined in section 1 (`화자명 (지시): "대사"`), the A/B/C length targets as generation goals (not hard gates), the player-freedom contract (Story never completes an action the player did not input), and the exactly-four-choices target.

`src/engine/narrative-parser.js` recognizes both the Korean section labels and the legacy internal markers (`[SCENE]`, `[PLAYER_STATUS]`, `[PLAYER_INNER_THOUGHT]`, `[CHOICES]`, `[DIALOGUE ...]`) used by existing fixtures. It extracts `dialogue_lines` (`speaker_id`, `speaker_name`, `direction`, `text`, `order`) from both marker-based dialogue and the inline `이름 (지시): "대사"` pattern, resolving `speaker_id` only when a master character list has exactly one name match. Malformed input never throws; unparsed text is preserved and warnings are added instead.

## Story-authoritative fields

`normalizeGameplayExtractEnvelope` (`src/engine/gameplay-state.js`) always prefers the parser's `player_inner_thought`, `player_status`, and dialogue order over anything Extract returns, and uses Extract's `choices` only when the parser did not produce exactly four. This runs both when Extract is first recorded and again inside `applyGuardedStateDelta` at Commit time, so replay and Commit see the same precedence.

## Identity axes

`action_target_id`, `focal_character_id`, `last_speaker_id`, `image_character_id`, and `npcs_present` are normalized independently (never copied from one into another) and are `null`/`[]` when unknown. Guarded merge only overwrites the persisted `focal_character_id`/`last_speaker_id` when the turn's proposal is non-null, so an unresolved turn never erases a previously known identity. `action_target_id`/`image_character_id` are not persisted into the save (no existing save field maps to them); they are returned in the Extract/Commit responses for now, since image/target runtime is out of scope for this PR.

## Global CSA runtime

`csa_runtime_state[csa_id]` has three independent axes validated against the contract doc's enums (`validateCsaRuntimeStatePatch` in `gameplay-state.js`): `lifecycle` (`active|temporarily_interrupted|suspended|completed|deactivated`), `applicability` (`applicable|not_applicable|unknown`), `execution_state` (`not_started|proposed|executed|refused|interrupted`). An invalid individual axis is dropped with a warning; the rest of the CSA patch and the rest of the turn still commit. Per-NPC variation stays under `csa_attitudes[npc_id][csa_id]`; there is no `active_suggestions` or per-NPC rule list.

## Game time

Extract proposes `elapsed_minutes` only (1–30 normally, 1–480 with `evidence.time_advance === true`; anything else normalizes to 3). Commit alone computes `time_before`, `time_after` (`advanceGameTime`), and day rollover, and writes `time_after` into `world_state.game_time`. `time_before`/`elapsed_minutes`/`time_after` are returned in the Commit response for observability; no database migration or new column was added. Legacy `world_state.time_block` is preserved but is not authoritative.

## Player sexual state

Extract proposes `arousal_delta`/`ejaculation_progress_delta`/`ejaculation_completed` only; `reducePlayerSexualState` clamps `arousal`/`ejaculation_progress` to 0–100 and only honors `ejaculation_completed` when `evidence.sexual_resolution === true`. Without that evidence the flag is dropped with `unauthorized_ejaculation_completion_ignored` and the rest of the delta and the turn still commit. A missing delta leaves the state unchanged.

## Mind Monitor

`normalizeMindMonitor` keeps only `{ npc_id: { surface, subconscious } }`, strips `body`/`physical`/`physical_action`/Korean body-reaction keys with a warning, and preserves an unstructured legacy string as `legacy_text` instead of discarding it. It never invents an NPC entry and never mutates its input.

## migrate / hydrate

`migrateCompanySave` (pure, `save_schema_version` stays `1`) adds a default `world_state.game_time` (Day 1 09:00) and default `player_sexual_state` only when absent, preserving every unknown field. `hydrateGameplayState` additionally fills `npc_stats`/`npc_relationship_state`/`npc_emotion`/`npc_scene_state` only for master characters absent from the save; it never overwrites existing NPC data. `/api/context` and the Story/Extract prompt builders now read through this in memory (`hydratedSaveContext` in `turn-routes.js`) — no database write happens on a read. The production master list (`content/characters.json`) is still `{}`, so hydration is currently a no-op for characters; heroine content remains out of scope for this PR.

## Guarded merge order

`applyGuardedStateDelta` (`src/engine/guarded-merge.js`): clone → `hydrateGameplayState` → normalize the Extract envelope (Story-authoritative fields applied) → reject only true blocking failures (invalid save, unauthorized sexual completion) → apply each `state_delta` path (CSA axis validation, sexual-state reducer, NPC-map staleness/allow-list checks, generic deep merge for the rest) → replace `last_choices`/`last_npcs_present` → apply identity fields → compute authoritative game time → build `turn_state`. `deriveTurnChanges(beforeSave, afterSave)` runs in `turn-routes.js` after the merge, from the actual persisted before/after save, never from the LLM's own `turn_changes`. A single invalid delta (unknown path, invalid CSA axis, unauthorized completion flag) is dropped with a warning; it does not fail the whole turn. Blocking errors stay limited to save/schema mismatches and unauthorized sexual completion.

## Degraded Extract

If the Extract LLM call fails, times out, returns malformed/truncated JSON, or the envelope fails contract normalization, `turn-routes.js` builds a deterministic envelope (`buildDegradedExtractEnvelope`, no additional LLM call) that preserves the Story's raw text, choices, inner thought, status, and dialogue, leaves `state_delta` empty, defaults `elapsed_minutes` to 3, and adds `extract_degraded` + `extract_error:<code>` warnings. The action still moves to `committing` and Commit still succeeds. Genuine infrastructure failures (Supabase/context RPC errors, database write failures) are not degraded — they still mark the action `extract_failed` and require the existing `retry_extract` recovery step, so manual retry and commit-only recovery are unchanged.

## Timing logs

Story, Extract, and Commit each run as a separate HTTP call, so each one logs its own `company_turn_timing` line (`src/api/timing.js`) tagged with `request_id`/`action_id`/`game_id`/`expected_turn` so the three lines can be joined downstream into one turn timeline; there is no single request that can measure a true end-to-end `turn_total_ms` across all three calls in this architecture. Each stage logs from a `finally` block, so it still emits on failure. Logged fields: `context_rpc_ms`, `story_prompt_ms`, `story_headers_ms`, `story_first_content_ms`, `story_network_total_ms`, `story_character_count`, `extract_prompt_ms`, `extract_llm_ms`, `extract_parse_ms`, `extract_degraded`, `guarded_merge_ms`, `commit_rpc_ms`, `turn_total_ms` (this request's own duration), `warning_codes`. No API keys, Authorization headers, prompts, saves, or Story text are logged.

## Action lifecycle preserved

`action_id`-based idempotence, `expected_turn` validation, Story/Extract/Commit separation, `retry_story`, `retry_extract`, commit-only recovery, and duplicate-Commit replay are unchanged; see `test/phase-2-api.test.mjs` and `test/gameplay-runtime-v1.test.mjs`.

## Out of scope for this PR

heroine1–5 character content, image catalog/runtime, TTS, history API, feedback API, CSA app UI, frontend renderer changes, and any deployment. Follow-up: resolve the five-character master content so `hydrateGameplayState`/parser `speaker_id` resolution has real data to work with.

# Company gameplay runtime v1

This connects the merged `docs/COMPANY_GAMEPLAY_STATE_CONTRACT_V1.md` and `docs/COMPANY_NARRATIVE_CONTRACT_V1.md` contracts to the live Story → Extract → guarded Commit runtime. It does not activate heroine content, images, TTS, or deployment; see "Out of scope" below.

## Where the contracts are wired

| Concern | File |
| --- | --- |
| Story LLM request | `src/api/llm.js` (`streamStory`) |
| Story prompt (Fresh semantic wire contract) | `src/engine/story-prompt.js` |
| Fresh Story parser | `src/engine/fresh-narrative-parser.js` |
| Extract LLM request | `src/api/llm.js` (`runExtract`) |
| Extract prompt (canonical envelope contract) | `src/engine/extract-prompt.js` |
| Extract V2 observation normalize, Mind Monitor, time, sexual state | `src/engine/gameplay-state.js` |
| Guarded merge pipeline | `src/engine/guarded-merge.js` |
| Route wiring, read-path hydration, timing logs | `src/api/turn-routes.js`, `src/api/timing.js` |

## Story LLM request

`{ model: STORY_MODEL, messages, stream: true, thinking: { type: 'disabled' }, max_tokens: 5000 }`. `STORY_MODEL` is read from the existing environment variable; no model name is hardcoded, and there is no automatic Story retry or fallback model.

## Extract LLM request

`{ model: EXTRACT_MODEL, messages, stream: false, thinking: { type: 'disabled' }, response_format: { type: 'json_object' }, max_tokens: 5000 }`, capped at a 75-second timeout via `AbortSignal.timeout`. Extract runs at most once per turn; there is no repair call or second model.

## Current semantic Story wire

The current Story prompt emits semantic `[SCENE]`, `[DIALOGUE speaker_id="registered_id"]`, optional `[ACTING]`, `[THOUGHT]`, and repeated literal `[CHOICE]` blocks. Human section headings, labels, and numbering belong to the UI and are not Fresh output authority.

Fresh parsing uses `parseFreshNarrativeV2` and treats non-empty exact `speaker_id` as the only speaker authority. Replay/history uses committed `parsed_blocks`; legacy persisted Extract `state_delta` is normalized only by the explicit read boundary used by replay and Commit.

## Story-authoritative fields

Fresh parser output is authoritative for observed Story blocks, `player_inner_thought`, dialogue identity/order, and literal CHOICE text. Extract V2 observes gameplay state and never generates, repairs, or falls back to choices. `canonical_choices` is available only for exactly four distinct non-empty observed choices; otherwise free input remains available.

Fresh parser `dialogue_lines` (text, direction, order) are authoritative (`mergeDialogueLines`): an exact registered `speaker_id` in the Fresh DIALOGUE marker is the only speaker authority. Extract observation cannot infer, repair, or add a Fresh dialogue line; persisted historical rows retain their separate read-boundary normalization.

## Identity axes and NPC id validation

`action_target_id`, `focal_character_id`, `last_speaker_id`, `image_character_id`, and `npcs_present` are normalized independently (never copied from one into another) and are `null`/`[]` when unknown. Guarded merge only overwrites the persisted `focal_character_id`/`last_speaker_id` when the turn's proposal is non-null, so an unresolved turn never erases a previously known identity. `action_target_id`/`image_character_id` are not persisted into the save (no existing save field maps to them); they are returned in the Extract/Commit responses for now, since image/target runtime is out of scope for this PR.

`buildStableNpcIdSet` (`gameplay-state.js`) builds the stable NPC id universe from `edition.characters.characters` + `edition.generalNpcs.profiles` (`npcIdsFromEdition` in `turn-routes.js` converts the id-keyed content maps into arrays first). `normalizeGameplayExtractEnvelope` validates `npcs_present`, `action_target_id`, `focal_character_id`, `last_speaker_id`, `image_character_id`, and every Mind Monitor key against that set whenever it is supplied: an id outside the set is dropped/nulled with an `unknown_npc_id:<field>:<id>` warning. Validation is skipped only when no `npcIds` set is passed at all (pure unit tests calling the normalizer directly). `content/characters.json`/`content/general_npcs.json` are still empty skeletons, so in the current build every identity/Mind Monitor proposal is validated against an empty set and dropped — this is expected and does not block Commit; it stops being a no-op once heroine content is populated. The guarded-merge NPC delta allow-list additionally includes the current turn's *validated* `npcs_present` and *validated* `action_target_id`, so a newly-introduced NPC can receive a delta the same turn it appears, without Extract being able to fabricate an unvalidated id to smuggle a delta through.

## Global CSA runtime

`csa_runtime_state[csa_id]` has three independent axes validated against the contract doc's enums (`validateCsaRuntimeStatePatch` in `gameplay-state.js`): `lifecycle` (`active|temporarily_interrupted|suspended|completed|deactivated`), `applicability` (`applicable|not_applicable|unknown`), `execution_state` (`not_started|proposed|executed|refused|interrupted`). An invalid individual axis is dropped with a warning; the rest of the CSA patch and the rest of the turn still commit. Per-NPC variation stays under `csa_attitudes[npc_id][csa_id]`; there is no `active_suggestions` or per-NPC rule list.

## Game time

Extract proposes `elapsed_minutes` only (1–30 normally, 1–480 with `evidence.time_advance === true`; anything else normalizes to 3). Commit alone computes `time_before`, `time_after` (`advanceGameTime`), and day rollover, and writes `time_after` into `world_state.game_time`. `time_before`/`elapsed_minutes`/`time_after` are returned in the Commit response for observability; no database migration or new column was added. Legacy `world_state.time_block` is preserved but is not authoritative.

## Player sexual state

`player_sexual_state` deltas may only propose `arousal_delta`, `ejaculation_progress_delta`, and `ejaculation_completed`. `sanitizePlayerSexualStateDelta` (`src/engine/guarded-merge.js`) drops any other key from just that patch before it reaches the reducer — a key that reads as a completion claim (matching a "sexual...complete/relationship" pattern) is dropped with `unauthorized_sexual_completion_field_ignored:<key>`, and any other unrecognized key is dropped with `unknown_player_sexual_state_delta:<key>`. Neither case fails Story or the rest of the turn's valid deltas; there is no broad sexual-semantic hard failure here. `reducePlayerSexualState` then clamps `arousal`/`ejaculation_progress` to 0–100 and only honors `ejaculation_completed` when `evidence.sexual_resolution === true`; without that evidence the flag alone is dropped with `unauthorized_ejaculation_completion_ignored` and the rest of the delta and the turn still commit. A missing delta leaves the state unchanged.

## Mind Monitor

`normalizeMindMonitor` keeps only `{ npc_id: { surface, subconscious } }`, strips `body`/`physical`/`physical_action`/Korean body-reaction keys with a warning, and preserves an unstructured legacy string as `legacy_text` instead of discarding it. It never invents an NPC entry and never mutates its input.

## migrate / hydrate

`migrateCompanySave` (pure, `save_schema_version` stays `1`) adds a default `world_state.game_time` (Day 1 09:00) and default `player_sexual_state` only when absent, preserving every unknown field (including unrelated nested fields inside `player_sexual_state` itself — `reducePlayerSexualState` now spreads the existing state before recomputing the four canonical fields). `hydrateGameplayState` fills `npc_stats`, `npc_relationship_state`, `csa_attitudes`, `npc_emotion`, and `npc_scene_state` only for master characters absent from the save, from the contract's canonical fields (`initial_stats`, `initial_relationship`, `initial_csa_attitudes`); `initial_relationship_state` is accepted as a legacy alias only when `initial_relationship` is absent. It never overwrites existing NPC data. `/api/context`, `/api/story`, and `/api/extract` all read the save through this in memory (`hydratedSaveContext` in `turn-routes.js`) before building their prompts — no database write happens on a read. The production master list (`content/characters.json`) is still `{}`, so hydration is currently a no-op for characters; heroine content remains out of scope for this PR.

## Guarded merge order

`applyGuardedStateDelta` (`src/engine/guarded-merge.js`): clone → `hydrateGameplayState` → normalize the Extract envelope (Story-authoritative fields and NPC id validation applied) → apply each `state_delta` path (a `state_delta` path duplicating a top-level-envelope-authoritative field — `focal_character_id`/`last_speaker_id`/`last_choices`/`last_npcs_present` — is dropped with `duplicate_state_path:<path>`; CSA axis validation; the `player_sexual_state` delta is sanitized to its three allowed keys before the sexual-state reducer runs (see "Player sexual state" above); an unauthorized `npc_relationship_state[...].milestones.sexual_relationship_started_turn` change is dropped from just that patch with `unauthorized_sexual_milestone_ignored:<npcId>` rather than failing the turn; NPC-map staleness/allow-list checks; generic deep merge for the rest) → replace `last_choices`/`last_npcs_present` from the top-level envelope → apply identity fields → compute authoritative game time → build `turn_state`. `deriveTurnChanges(beforeSave, afterSave)` runs in `turn-routes.js` after the merge, from the actual persisted before/after save, never from the LLM's own `turn_changes`. A single invalid delta (unknown path, duplicate path, invalid CSA axis, unknown/unauthorized `player_sexual_state` key, unauthorized milestone/completion flag) is dropped with a warning; it does not fail the whole turn. Blocking errors stay limited to real integrity failures: an invalid or wrong-schema/edition save, an `expected_turn`/save-revision conflict, or a database write failure. There is no broad sexual-semantic hard failure beyond those.

## Degraded Extract

Fresh Extract V2 malformed or upstream-invalid output is a visible failure; it is not converted into a degraded auto-commit envelope. Historical persisted degraded rows remain readable only through the persisted-data compatibility boundary.

Extract-route persistence is now fully recoverable: a `record_extract_result` write failure marks the action `extract_failed` and rethrows (so `retry_extract` applies) instead of leaving the request to fail with the action still `extracting`. If the *separate* status-transition patch to `committing` fails after the Extract result was already durably saved, the handler re-fetches the action instead of leaving stale in-memory state, still returns the successful Extract result to the caller, and the action is never stuck — a `resume_extract` (or `resume_commit`) recoverable step always leads forward with zero extra LLM calls.

## Timing logs

Story, Extract, and Commit each run as a separate HTTP call, so each one logs its own `company_turn_timing` line (`src/api/timing.js`) tagged with `request_id`/`action_id`/`game_id`/`expected_turn` so the three lines can be joined downstream into one turn timeline; there is no single request that can measure a true end-to-end `turn_total_ms` across all three calls in this architecture. Each stage logs from a `finally` block, so it still emits on failure. Logged fields: `context_rpc_ms`, `story_prompt_ms`, `story_headers_ms`, `story_first_content_ms`, `story_network_total_ms`, `story_character_count`, `extract_prompt_ms`, `extract_llm_ms`, `extract_parse_ms`, `extract_degraded`, `guarded_merge_ms`, `commit_rpc_ms`, `turn_total_ms` (this request's own duration), `warning_codes`. No API keys, Authorization headers, prompts, saves, or Story text are logged.

## Action lifecycle preserved

`action_id`-based idempotence, `expected_turn` validation, Story/Extract/Commit separation, `retry_story`, `retry_extract`, commit-only recovery, and duplicate-Commit replay are unchanged; see `test/phase-2-api.test.mjs` and `test/gameplay-runtime-v1.test.mjs`.

## Out of scope for this PR

heroine1–5 character content, image catalog/runtime, TTS, history API, feedback API, CSA app UI, frontend renderer changes, and any deployment. Follow-up: resolve the five-character master content so `hydrateGameplayState`/parser `speaker_id` resolution has real data to work with.

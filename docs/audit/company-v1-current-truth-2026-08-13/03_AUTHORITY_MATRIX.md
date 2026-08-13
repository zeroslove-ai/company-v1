# Authority Matrix

Evidence basis: runtime baseline `5ba68bb`, current source tree, migrations,
and tests. “Canonical” below means the current code path intended to be the
durable writer; it does not claim that every legacy writer has been removed.

| Domain | Canonical representation | Canonical writer | Other writers / mirrors | Readers | Current conflict / disposition |
|---|---|---|---|---|---|
| Story raw text | `game_turns.story_text`; opening story in `opening_state.story_text` | Story route + commit RPC | feedback revision creates replacement turn | parser, Extract, history, frontend | Raw text and parsed projection must remain distinct. KEEP boundary. |
| Parsed Story blocks | `game_turns.parsed_blocks` | fresh/persisted parser path before commit | frontend stream projection; legacy parser | view model, Extract prompt, replay | Multiple parser generations remain. SIMPLIFY compatibility. |
| Choices | committed turn `choices`, plus parsed block choice projection | `reduceStoryChoiceProjection`, commit payload | frontend streamed choices/session state; opening choices | frontend, next-turn context | Duplicate presentation caches. KEEP server committed field; simplify clients. |
| THOUGHT | parsed Story / committed `parsed_blocks` | Fresh parser and observation pipeline | frontend normalization | renderer, Extract | Protocol duplication/legacy normalization remains. SIMPLIFY. |
| `scene_id` | canonical scene state in save | `scene-reducer.js` / commit reducer | legacy scene fields and hydration | Story projection, view model | Single-writer intent exists; legacy mirrors remain. REWRITE boundary only after owner decision. |
| Location | canonical scene `location_id` plus world/time context | navigation/action resolution and scene reducer | `npc_scene_state.location_id`, frontend display | Story prompt, map, renderer | Presentation mirrors can drift. Mark location writer contract explicitly. |
| Player scene state | `player_scene_state` | observation reducer from exact Story evidence | setup/bootstrap initializes values; legacy hydration | Story projection, view model, triggers | Input is intent; Story observation is state authority. KEEP. |
| NPC scene state | canonical scene participants plus `npc_scene_state` detail | scene reducer + observation reducer | legacy direct fields and relation presentation | Story, Extract, frontend | Detail vs membership split is real but not obvious. SIMPLIFY. |
| Presence | canonical scene participant set | `scene-reducer.js` | `last_npcs_present`, legacy NPC state | prompt, map, view model | Multi-reader legacy mirror. Keep canonical scene; retire mirror later. |
| Player posture | `player_scene_state.posture` | observation reducer | setup default / legacy hydration | CSA trigger, Story projection, renderer | Free-form labels must not become authority. KEEP canonical vocabulary. |
| NPC posture | NPC scene detail posture | observation reducer | relation presentation labels | CSA trigger, Story, frontend | `position_label` is presentation only; conflict recorded. |
| Clothing | structured clothing state per actor | clothing observation/bootstrap reducers | legacy clothing labels and UI text | Story, view model, image selector | Main ancestry has null/initial clothing fixes; compatibility remains. |
| Player sexual state | player sexual ledger/state | sexual observation reducer | CSA action payload is intent/input, not durable result | Story/Extract, frontend | State cannot be inferred from input alone. KEEP. |
| NPC sexual state | NPC sexual ledger/state | observation reducer and sexual-event reducer | mind monitor is not writer | Story, renderer, image selector | Emotional monitor must not write sexual fact. KEEP boundary. |
| Relationships | relationship records in save | relationship reducer from observations | CSA runtime/active relation may supplement physical relation | Story/Extract/frontend | Relationship and physical relation are different domains; merge risk. SIMPLIFY. |
| `active_relations` | structured actor/target relation entries | Engine CSA commit reducer and exact Extract relation reducer | legacy presentation labels | Story target authority, triggers, renderer | Two deliberate writers need one closed update contract. REWRITE boundary candidate. |
| CSA definitions | `csa_rules` / catalog item metadata | app transaction planner/commit | content JSON, DB save payload | app UI, Story projection, reducer | Content catalog and persisted active rule are separate authority layers. KEEP. |
| CSA active state | `csa_active` and `csa_rules` | CSA reducer / commit payload | old DB preapply RPC is a dormant mutation surface | Story, app, frontend | DB writer existence is not JS caller proof; cleanup candidate. |
| CSA trigger | normalized execution metadata and `triggerStateFor` | CSA story projection | preset JSON trigger fields; legacy aliases | mandatory enactment, Story prompt | Structural trigger and narrative wording can diverge. REWRITE contract candidate. |
| CSA execution | execution metadata / enactment records | execution policy + mandatory-enactment builder | provider ACTING is observable rendering | Story, Extract, commit | Engine is intended authority; provider is presentation evidence. KEEP. |
| CSA runtime | `csa_runtime`/runtime patches | CSA reducer | Extract observation of aftermath | context, Story, frontend | Runtime state and active definition can diverge. Need owner acceptance model. |
| Mind Monitor | `mind_monitor` in committed turn/context | Extract normalization/commit | frontend display cache | Story context, renderer | It is observation/presentation, not relationship writer. KEEP boundary. |
| Image selection | selected image id in committed/context media projection | image selector from state/evidence | frontend media cache, image library | renderer/TTS/media routes | Catalog is DB-backed; selected image is turn projection. KEEP. |
| Time | `world_state.game_time` / persisted turn context | deterministic turn/context reducer | Story prose, frontend clock | Story header, history, navigation | Prose is not time authority. KEEP. |
| Summary | `turn_summary` and save summary fields | Extract/commit summary path | frontend compact summary | context/history/renderer | Multiple summary fields and revision path need precedence. SIMPLIFY. |
| Player setup | `save.player_setup` | canonical reserve/commit opening RPCs | frontend form/session state | opening route, recovery, frontend | Reservation and completion are separate; recovery contract exists. KEEP. |
| Opening | `save.opening_state` plus opening turn projection | opening route + opening RPC | frontend recovery/session state | context, renderer, next turn | Opening has special parser/prompt rules and stale compatibility. REWRITE protocol boundary. |
| Game action lifecycle | `game_actions.processing_status` | reserve/record/claim/commit route + RPC | direct REST status patches in `supabase.js` | recovery UI, API routes | RPC and direct table updates coexist. REWRITE mutation surface candidate. |
| Turn number | `game_save.committed_turn`, `game_turns.turn_number` | commit RPC / turn reducer | frontend context/session | every next-turn route | DB commit is durable authority; client count is not. KEEP. |
| Save revision | `game_save.save_revision` | commit/opening/reset RPCs | hydration metadata | conflict guards, context | Live DB value requires catalog/data access to prove. UNKNOWN deployment state. |

## Multi-writer domains requiring owner decisions

1. Scene membership/detail: canonical scene reducer plus legacy NPC scene fields.
2. Presence: participant set plus `last_npcs_present` compatibility mirror.
3. Active relations: Engine writer plus Extract observer/reducer.
4. Game action status: RPC lifecycle plus direct REST PATCH helpers.
5. Opening/setup: canonical RPCs plus legacy-named SQL wrappers retained in migration history.
6. Choices/THOUGHT: committed fields, parsed blocks, streaming state, and frontend session state.
7. Summary: turn-level and save-level summaries with revision replacement semantics.

These are not automatically bugs; they are the places where a future change can
write one representation while another reader still treats a mirror as truth.

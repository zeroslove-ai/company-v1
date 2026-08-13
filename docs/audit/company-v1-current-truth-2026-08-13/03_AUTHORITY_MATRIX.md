# Authority Matrix

Evidence basis: runtime baseline `5ba68bb`, current source, repository
migrations, and the reviewer-verified live DB facts in Issue #64.

| Domain | Current canonical representation | Current durable writer | Other writers / mirrors | Readers | Sole-writer decision |
|---|---|---|---|---|---|
| Story raw text | `game_turns.story_text`; opening story in `opening_state.story_text` | normal turn commit boundary | feedback creates replacement turn | parser, Extract, history, frontend | Keep raw Story as evidence; no pre-commit durability. |
| Parsed Story blocks | `game_turns.parsed_blocks` | route parser result passed to commit | stream projection; persisted/legacy parser | replay, Extract, view model | Fresh protocol is producer; committed blocks are replay authority. |
| Choices | committed turn `choices` and parsed choice projection | commit payload/reducer | frontend stream/session choices | context, frontend, next turn | Server committed turn wins; client cache is temporary. |
| THOUGHT | committed parsed blocks / turn monitor projection | parser + commit payload | frontend normalization | renderer, Extract context | Server committed representation wins; no frontend authority. |
| `scene` / `scene_id` | `save.scene` schema version 1 | `reduceCanonicalScene()` through commit | `scene_state` compatibility mirror | Story, map, view model | `save.scene` is sole canonical membership/location/focal/last-speaker writer. |
| Location | `save.scene.location_id` | canonical scene reducer/navigation resolution | `player_scene_state.location_id`, `npc_scene_state.location_id` | prompts, map, renderer | Scene is authority; player/NPC location fields are projections only. |
| Presence | `save.scene.participants` / canonical scene membership | canonical scene reducer | `last_npcs_present`, `npc_scene_state.present` | Story, map, view model | Legacy fields may be emitted after commit, never decide membership. |
| Player scene state | structured player physical detail | evidence-gated observation reducer | setup/bootstrap defaults; location compatibility field | Story/CSA/frontend | Physical detail stays reducer-owned; location is projected from scene. |
| NPC scene state | structured NPC physical detail | observation/relation presentation reducers | membership/location/scene_id mirrors | Story/Extract/frontend | Posture/clothing may remain detail authority; membership/location cannot. |
| Player posture | canonical posture token in player detail | physical observation reducer | setup default | CSA trigger, Story, renderer | Evidence-gated canonical token only. |
| NPC posture | canonical posture token in NPC detail | physical observation reducer | relation presentation labels | CSA trigger, Story, renderer | Labels never infer posture. |
| Clothing | structured per-actor clothing state | clothing/bootstrap observation reducers | legacy labels/UI text | Story, view model, image selector | Structured state wins; presentation is derived. |
| Player sexual state | structured sexual ledger/state | evidence-gated sexual observation reducer | action payload intent | Story/Extract/frontend | Input is attempt, not success. |
| NPC sexual state | structured sexual ledger/state | evidence-gated observation/event reducer | Mind Monitor | Story, renderer, image selector | Mind Monitor cannot write sexual fact. |
| Relationships | relationship records | relationship reducer | active physical relation data | Story, Extract, frontend | Relationship and physical relation remain separate domains. |
| `active_relations` | one structured relation array | one canonical relation reducer | Engine and Extract become typed events; labels are mirrors | Story target/trigger, renderer | Engine mandatory event wins same actor/turn conflict; no second array writer. |
| CSA definitions | catalog + persisted `csa_rules` | normal Commit reducer / `commit_company_turn` | live `apply_reserved_csa_transaction` is obsolete writer | app, Story, reducer | Preapply writer must be revoked/dropped by additive cleanup migration. |
| CSA active state | `csa_active` and `csa_rules` | Commit reducer transaction | no pre-commit save mutation | Story, app, frontend | Durable only inside normal commit. |
| CSA trigger | normalized execution metadata | CSA projection/execution policy | preset fields/legacy aliases | mandatory enactment, prompt | One structural trigger contract; narrative text is not trigger authority. |
| CSA execution | Engine enactment/obligation metadata | CSA Engine | provider ACTING is visible evidence | Story, Extract, commit | Engine decides world action; provider renders/observes it. |
| CSA runtime | runtime state in committed save | CSA reducer during Commit | obsolete DB preapply path | context, Story, frontend | Commit reducer only. |
| Mind Monitor | committed turn `mind_monitor` | Extract normalization + Commit | frontend display cache | Story context, renderer | Observation/presentation only. |
| Image selection | selected image projection/turn field | deterministic selector from evidence/state | frontend media cache; `image_library` catalog | renderer/media | Server committed selection wins. |
| Time | canonical world/turn context | deterministic turn/context reducer | Story prose, frontend clock | prompt, history, navigation | Prose never writes time. |
| Summary | committed `turn_summary` and save summary fields | Commit/revision boundary | frontend compact summary | context/history/renderer | Committed server context wins. |
| Player setup | `save.player_setup` | reserve/commit setup RPCs | frontend form/session | opening/recovery/frontend | DB transaction owns persistence; catalog validation belongs to repository/runtime. |
| Opening | `save.opening_state` | opening route + opening RPC | frontend recovery/session | context, renderer | Opening is lifecycle state, not a second world authority. |
| Game action lifecycle | `game_actions.processing_status` and stage fields | named lifecycle RPCs | direct REST PATCH helpers confirmed live-capable | recovery/API | Direct REST mutation is cleanup target; GET may remain read-only. |
| Turn number | save committed turn + `game_turns.turn_number` | `commit_company_turn` | frontend count | all next-turn paths | Commit transaction wins. |
| Save revision | `game_save.save_revision` | setup/opening/turn/revision/reset transactions | hydration metadata | conflict guards/context | Transactional DB writer only. |

## Confirmed multi-writer conflicts

1. `game_actions` has named RPC lifecycle functions plus direct REST PATCH
   helpers, and live `service_role` table DML makes the direct path real.
2. `csa_active`/`csa_rules` have the normal commit writer plus live
   `apply_reserved_csa_transaction` pre-commit writer.
3. Scene membership/location has canonical `save.scene` plus compatibility
   fields that can be mistaken for authority.
4. `active_relations` currently has Engine and Extract mutation paths and must
   converge on one reducer.
5. Setup/opening SQL duplicates content catalog IDs and world records.

The target decisions and transition rules are frozen in
`10_SOLE_WRITER_DECISION.md`.

# Runtime Authority Map

## 조사 기준

기준 커밋은 `9953a8a90b2dd9e5630fe169bd4d1bac2ae8e99f`이다. writer는 실제 save 대입 또는 RPC 인자 전달, reader는 실제 read/projection 호출로 구분했다. 한 함수의 여러 대입은 논리 writer 1개로 세었다. 아래 표에는 25개 canonical field group과 52개 writer site가 있다.

| field | current writer (file/function) | current reader (file/function) | writers | risk | target authority | disposition |
|---|---|---|---:|---|---|---|
| `story_text` | `src/api/turn-routes.js` `/api/story` → `record_story_result`; opening `commit_company_opening` | `turn-routes.js` replay/extract/commit; `story-prompt.js`; frontend `app.js`/`view-model.js` | 2 | parser projection replacing raw | `game_actions.story_text` → `game_turns.story_text` | KEEP |
| `parsed_blocks` | `record_story_result` post-hoc projection; RPC copy to action/turn | `turn-routes.js` `parseStoryProjection`; `view-model.js` | 1 | projection treated as raw authority | derived from raw Story | DERIVE |
| `structured_action` | `src/api/supabase.js` `reserveTurnAction`; `reserve_turn_action`; commit RPC copy | `structuredActionFor`; story/extract/commit routes; history select | 2 | reserved and requested values diverge | stored action row | KEEP |
| `scene_state.scene_id` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; setup/opening RPC | `scene-cast.js`, `workplace-context.js`, `runtime-display.js` | 3 | movement and Extract disagree | reducer `scene.scene_id` | REPLACE |
| `scene_state.location_id` | same guarded merge/sanitizer/setup-opening paths | `scene-cast.js`, `npc/location.js`, `company-map.js`, prompt | 3 | stale location metadata | reducer `scene.location_id` | REPLACE |
| `scene_state.beat` | `src/engine/player-setup.js` `buildOpeningNextSave`; `commit_company_player_setup` RPC | `gameplay-state.js` `buildSceneContextCore`; `render.js`; Story context | 2 | beat detached from progression | reducer `scene.beat` | REPLACE |
| `scene_state.scene_goal` | `buildOpeningNextSave`; `commit_company_player_setup` RPC | `gameplay-state.js`; `story-prompt.js`; `render.js` | 2 | goal from another place survives | reducer nullable `scene.goal` | REPLACE |
| `scene_state.focus_thread` | `commit_company_player_setup` RPC stores `work_hook_id` | `gameplay-state.js`; `story-prompt.js`; `render.js` | 1 | stale thread points elsewhere | reducer nullable `scene.focus_thread` | REPLACE |
| `scene_state.participants` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; `player-setup.js`; opening RPC | `scene-cast.js`, `view-model.js`, `company-map.js`, `story-prompt.js` | 4 | 12/17 NPC collapse or leak | `scene.present_npc_ids` + player | REPLACE |
| `scene_state.npc_presence` | no production writer found | no production reader found; target docs only | 0 | adding a second presence axis | derive from `present_npc_ids` | DELETE |
| `last_npcs_present` | guarded merge; movement sanitizer; setup/opening RPC | `runtime-display.js`, `product-recovery.js`, `view-model.js`, `npc/location.js`, `workplace-context.js` | 3 | stale history re-adds NPC | read-only legacy projection | TEMPORARY KEEP UNTIL PHASE 6; FINAL REPLACE |
| `npc_scene_state.*.present` | guarded merge; movement sanitizer; setup/opening; clothing migration | `scene-cast.js`, `view-model.js`, runtime display | 4 | conflicts with participants | derive from canonical scene | REPLACE |
| `npc_scene_state.*.location_id` | guarded merge; movement sanitizer; setup/opening | `scene-cast.js`, `npc/location.js`, `company-map.js`, prompt | 3 | NPC and scene locations split | reducer NPC state | REPLACE |
| `npc_scene_state.*.posture` | guarded merge; setup/opening initial state | `view-model.js`, `render.js`, prompt | 2 | unsupported posture overwrite | reducer observation patch | REPLACE |
| `npc_scene_state.*.clothing` | guarded merge; setup/opening; initial-clothing migration | clothing authority in `story-prompt.js`; view-model/render; CSA app | 3 | rule changes physical state without evidence | reducer + physical evidence | REPLACE |
| `focal_character_id` | guarded merge; movement sanitizer; setup/opening | `story-prompt.js`, `view-model.js`, runtime display, scene cast | 2 | exited NPC remains focal | current NPC or null | REPLACE |
| `last_speaker_id` | guarded merge; setup/opening/commit history | `story-prompt.js`, `view-model.js`, TTS/render | 2 | stale previous speaker carried forward | current raw Story explicit speaker or null | REPLACE |
| `csa_active` | `resolveCsaTransactionPlan`/commit route next-save; `commit_company_turn` RPC | `buildActiveWorldRules`; CSA planner/runtime; frontend active list | 2 | action-less mutation | structured action → reducer | REPLACE |
| `csa_rules` | same transaction/commit path | Story projection, Extract/runtime prompt, CSA app | 2 | Story/Extract reinterprets rule | `rules.active` | REPLACE |
| `csa_runtime_state` | `buildCsaSceneRuntimeStatePatch` commit path; commit RPC; duplicate state_delta ignored | `gameplay-state.js`, CSA runtime/extract prompt, display | 2 | one-person executed state represents group | `rules.runtime` lifecycle | REPLACE |
| `npc_stats` | `applyGuardedStateDelta` → `applyNpcStatChanges` | gameplay hydration, runtime display, view-model | 1 | data shape and writer are conflated | same shape, reducer writer | KEEP shape; REPLACE writer |
| `npc_work_state` | guarded NPC map merge | gameplay state/prompt/display | 1 | work and scene action mixed | reducer observation | KEEP shape; REPLACE writer |
| `npc_relationship_state` | guarded merge with relationship gates | gameplay state, view-model, prompt | 1 | narrative summary controls relation | reducer evidence-gated patch | KEEP shape; REPLACE writer |
| `last_choices` | guarded merge; commit RPC; setup/opening state | view-model, prompt, recovery/UI | 3 | Story choices vs fallback conflict | raw Story parsed choices → reducer | REPLACE |
| `mind_monitor` | no top-level save writer; Extract passed to `game_turns.mind_monitor` by `record_extract_result`/`commit_company_turn` | `product-response.js`, `turn-routes-runtime.js`, `view-model.js`, `render.js` | 1 turn-level | turn projection mistaken for save authority | Extract observation projection | KEEP turn projection |

## 필수 호출 경로와 실제 caller

- `applyGuardedStateDelta`: `src/api/turn-routes.js:623`; exported by `src/engine/index.js`; many gameplay/clothing/relationship tests.
- `sanitizeMovementCommit`: `src/api/turn-routes.js:641`; `src/engine/guarded-merge.js:315`; `test/movement-commit-regression.test.mjs`.
- `buildSceneCastContract`: `src/api/turn-routes.js:409,634`; definition `src/engine/scene-cast.js:545`; map/turn tests.
- `normalizeGameplayExtractEnvelope`: `src/api/turn-routes.js:502,620`; definition `src/engine/gameplay-state.js:345`.
- `resolveCsaTransactionPlan`: `src/api/turn-routes.js:221`; Story and Commit reverify stored structured action.
- `record_story_result`: `src/api/turn-routes.js:465`; SQL `20260803000200_company_v1_turn_rpcs.sql:134`.
- `record_extract_result`: `src/api/turn-routes.js:577`; same migration line 173.
- `commit_company_turn`: `src/api/turn-routes.js:715`; recreated by history/turn-guard/fail-open migrations.
- `structuredActionFor`: `src/api/turn-routes.js:104`; reserved-row authority and request mismatch check.
- `hydrateGameplayState`: called by `src/engine/guarded-merge.js:446`; defined `src/engine/gameplay-state.js:602`.
- `buildStoryPrompt`: `src/engine/story-prompt.js:268`; combines `active_world_rules` and the scene projection.
- `buildExtractPrompt`: `src/engine/extract-prompt.js:91`; called at `turn-routes.js:548` with raw `action.story_text`.
- `buildCompanyGameViewModel`: `src/frontend/pages/view-model.js:236`; called from `src/frontend/pages/app.js:240`.

## Shape와 writer authority 분리

`npc_stats`, `npc_relationship_state`, `npc_work_state`의 map shape는 API/UI 호환을 위해 KEEP한다. 현재 writer인 `applyGuardedStateDelta()`와 evidence gates는 최종적으로 `runtime-core/commit-reducer.js`로 REPLACE한다. `mind_monitor`는 top-level canonical save가 아니라 `game_turns`의 turn-level Extract projection이다. `scene_state.beat`, `scene_goal`, `focus_thread`는 setup/opening writer와 gameplay/prompt/render reader가 실제로 존재하므로, target에서는 canonical `scene` 안에만 유지하고 legacy projection이 다른 장소의 stale 값을 다시 쓰지 못하게 한다.

## 결론

가장 많은 중복은 presence 계열이다. `scene_state.participants`, `last_npcs_present`, `npc_scene_state.*.present`, focal/speaker가 서로 다른 writer와 reader에 분산돼 있다. `scene.present_npc_ids`를 single Commit reducer가 쓰고 나머지는 legacy projection으로 내리는 것이 후속 설계의 기준이다.

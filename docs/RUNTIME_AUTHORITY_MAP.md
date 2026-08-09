# Runtime Authority Map

## 조사 기준

조사 기준은 `9953a8a90b2dd9e5630fe169bd4d1bac2ae8e99f`이다. 아래 writer는 실제 save 대입 또는 RPC 인자 전달을 의미하며, 단순 read/projection은 reader로만 센다. 한 함수가 같은 필드를 여러 줄에서 다뤄도 논리 writer 1개로 세었다. 표의 47개 writer site는 현재 구조의 중복을 정량화한 조사값이며, Phase 0에서 코드를 변경하지 않는다.

| 필드 | 현재 writer (파일·함수) | 현재 reader (파일·함수) | writer 수 | 17턴 실패/위험 | 새 canonical authority | 처리 |
|---|---|---|---:|---|---|---|
| `story_text` | `turn-routes.js` `/api/story`의 `record_story_result`; opening `commit_company_opening` | `turn-routes.js` replay/extract/commit; `story-prompt.js` recent turns; frontend `app.js`/`view-model.js` | 2 | parser/gate가 raw를 대체하면 replay·Extract 불일치 | `game_actions.story_text` → `game_turns.story_text` | KEEP |
| `parsed_blocks` | `record_story_result`의 후행 projection 저장; RPC가 action/turn에 복사 | `turn-routes.js` `parseStoryProjection`; `view-model.js` `latestTurn` | 1 | parser projection을 raw 정본으로 오인 | raw에서 파생되는 projection | DERIVE |
| `structured_action` | `supabase.js` `reserveTurnAction`; `reserve_turn_action` RPC; commit RPC copy | `structuredActionFor`; `/api/story`, `/api/extract`, `/api/commit`; history select | 2 | 예약값과 요청값 mismatch, CSA mutation 중복 | 예약된 action row | KEEP |
| `scene_state.scene_id` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; setup/opening RPC | `scene-cast.js`, `workplace-context.js`, `runtime-display.js` | 3 | 이동과 Extract가 서로 다른 장면을 쓸 수 있음 | reducer의 `scene.scene_id` | REPLACE |
| `scene_state.location_id` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; setup/opening RPC | `scene-cast.js`, `npc/location.js`, `company-map.js`, prompt projection | 3 | location-only 이동과 participants 불일치 | reducer의 `scene.location_id` | REPLACE |
| `scene_state.participants` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; `player-setup.js`; opening RPC | `scene-cast.js`, `view-model.js`, `company-map.js`, `story-prompt.js` | 4 | 12·17턴에서 NPC presence 누수/삭제 | `scene.present_npc_ids` + player | REPLACE |
| `scene_state.npc_presence` | 현재 실제 field writer 없음 | 일부 문서/target 설계에서만 언급 | 0 | 별도 field를 만들면 또 다른 authority가 됨 | `scene.present_npc_ids`에서 derive | DELETE |
| `last_npcs_present` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; setup/opening RPC | `runtime-display.js`, `product-recovery.js`, `view-model.js`, `npc/location.js`, `workplace-context.js` | 3 | stale history가 current presence를 다시 추가 | canonical scene의 read projection | LEGACY ADAPTER |
| `npc_scene_state.*.present` | `applyGuardedStateDelta`; movement sanitizer; setup/opening; clothing migration | `scene-cast.js`, `view-model.js`, runtime display | 4 | participants와 `present=false` 충돌 | canonical participants에서 derive | REPLACE |
| `npc_scene_state.*.location_id` | `applyGuardedStateDelta`; movement sanitizer; setup/opening | `scene-cast.js`, `npc/location.js`, `company-map.js`, prompt | 3 | NPC location이 scene location과 분리 | reducer NPC state | REPLACE |
| `npc_scene_state.*.posture` | `applyGuardedStateDelta`; setup/opening initial state | `view-model.js`, `render.js`, prompt projection | 2 | Extract가 근거 없이 자세를 덮을 위험 | reducer observation patch | REPLACE |
| `npc_scene_state.*.clothing` | `applyGuardedStateDelta`; setup/opening; initial-clothing migration | `story-prompt.js` clothing authority; view-model/render; csa app | 3 | CSA 요구 복장이 실제 행동 없이 바뀔 위험 | reducer + Story evidence | REPLACE |
| `focal_character_id` | `applyGuardedStateDelta`; `sanitizeMovementCommit`; setup/opening | `story-prompt.js`, `view-model.js`, runtime display, scene cast | 2 | 퇴장 NPC가 focal로 남음 | current present NPC 또는 null | REPLACE |
| `last_speaker_id` | `applyGuardedStateDelta`; setup/opening/commit RPC history | `story-prompt.js`, `view-model.js`, TTS/render paths | 2 | 퇴장 화자와 current presence 혼동 | 이번 raw Story의 명시 화자 또는 null | REPLACE |
| `csa_active` | `resolveCsaTransactionPlan`/commit route next save; `commit_company_turn` RPC | `buildActiveWorldRules`; CSA planner/runtime; frontend active list | 2 | structured action 없이 active list 변경 위험 | structured action → reducer | REPLACE |
| `csa_rules` | same transaction plan/commit route; commit RPC | `buildActiveWorldRules`, CSA prompt/extract/runtime, csa app | 2 | Story·Extract가 rule을 재해석 | reducer의 active rule map | REPLACE |
| `csa_runtime_state` | `buildCsaSceneRuntimeStatePatch` in commit route; commit RPC; guarded merge ignores duplicate state_delta | `gameplay-state.js`, CSA runtime/extract prompt, runtime display | 2 | continuous rule을 executed one-person state로 축소 | reducer lifecycle map | REPLACE |
| `npc_stats` | `applyGuardedStateDelta` via `applyNpcStatChanges` | gameplay state hydration, runtime display, view-model | 1 | observation과 progression writer 혼합 | reducer stat patch | KEEP |
| `npc_work_state` | `applyGuardedStateDelta` NPC map merge | gameplay state/prompt/display | 1 | 업무 상태와 scene action 혼합 | reducer observation | REPLACE |
| `npc_relationship_state` | `applyGuardedStateDelta` with relationship gates | gameplay state, view-model, prompt | 1 | Extract narrative summary가 relation을 직접 결정 | reducer evidence-gated patch | KEEP |
| `last_choices` | `applyGuardedStateDelta`; commit RPC; setup/opening state | `view-model.choices`, prompt, recovery/UI | 3 | Story choices와 Extract fallback 충돌 | raw Story parsed choices → reducer | REPLACE |
| `mind_monitor` | `record_extract_result`/`commit_company_turn` turn fields; frontend runtime projection | `view-model.mindMonitorEntries`, render, recovery | 1 | Extract 후 Story DOM 재렌더 위험 | Extract observation projection | KEEP |

## 조사된 필수 호출 경로

- `applyGuardedStateDelta`: `src/api/turn-routes.js:623`, export `src/engine/index.js`, 여러 regression tests.
- `sanitizeMovementCommit`: `src/api/turn-routes.js:641`, `src/engine/guarded-merge.js:315`, movement regression tests.
- `buildSceneCastContract`: `src/api/turn-routes.js:409,634`, `src/engine/scene-cast.js:545`.
- `normalizeGameplayExtractEnvelope`: `src/api/turn-routes.js:502,620`, `src/engine/gameplay-state.js:345`.
- `resolveCsaTransactionPlan`: `src/api/turn-routes.js:221`, Story/Commit에서 재검증된다.
- `record_story_result`: `src/api/turn-routes.js:465`, SQL `20260803000200...turn_rpcs.sql:134`.
- `record_extract_result`: `src/api/turn-routes.js:577`, 같은 migration `:173`.
- `commit_company_turn`: `src/api/turn-routes.js:715`, 이후 structured-action/turn-guard/fail-open migration에서 재정의된다.
- `structuredActionFor`: `src/api/turn-routes.js:104`; 예약 row authority와 request mismatch를 검사한다.
- `hydrateGameplayState`: `src/engine/guarded-merge.js:446`에서 호출되고 `src/engine/gameplay-state.js:602`에서 정의된다.
- `buildStoryPrompt`: `src/engine/story-prompt.js:268`; `buildStoryContextProjection`에서 `active_world_rules`와 `sceneCore`를 조합한다.
- `buildExtractPrompt`: `src/engine/extract-prompt.js:91`; `turn-routes.js:548`에서 raw `action.story_text`를 전달한다.
- `buildCompanyGameViewModel`: `src/frontend/pages/view-model.js:236`; `app.js:240`에서 Context와 currentExtract로 호출된다.

## 조사 결론

최다 중복은 scene presence 계열이다. `participants`, `last_npcs_present`, `npc_scene_state.*.present`, focal/speaker가 각각 다른 writer와 reader에서 합쳐진다. target state에서는 scene reducer가 `present_npc_ids`를 단일 작성하고 나머지는 read-only projection으로 내린다. `scene_state.npc_presence`는 실제 writer가 없으므로 새 field로 추가하지 않는다.

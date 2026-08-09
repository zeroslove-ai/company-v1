# Runtime Deletion Plan

Phase 0에서는 아래 구현을 삭제하지 않는다. 각 항목은 실제 production caller와 test caller를 확인한 뒤, replacement와 deletion gate를 고정한다.

| 현재 항목 | 실제 파일·export/function | production caller | test caller | replacement | deletion gate / phase |
|---|---|---|---|---|---|
| raw Story writer | `src/api/turn-routes.js` `/api/story`, `record_story_result` | `/api/story`, replay/extract/commit | raw streaming/turn-pipeline tests | canonical `story_text` writer 유지 | raw/equal replay tests pass; KEEP |
| ActionExecutionContract | `src/engine/action-execution-contract.js` 파일 없음; `git grep` production/test caller 0 | 없음 | 없음 | `runtime-core/action-authority.js`는 reserved structured action만 검증 | no delete needed; Phase 1 문서 정리 |
| `structuredActionFor` | `src/api/turn-routes.js:104` | `/api/story`, `/api/extract`, `/api/commit` | csa app/structured-action persistence | `action-authority.js` | stored proof parity tests; Phase 1 REPLACE |
| `buildSceneCastContract` | `src/engine/scene-cast.js:545` | `turn-routes.js:409,634` | `company-map-cast-stabilization`, turn pipeline | canonical scene reducer + read projection | replacement computes same contract; Phase 2/4 REPLACE |
| allowed speaker/cast candidate calculation | `scene-cast.js` helpers used inside `buildSceneCastContract` | story and commit route imports above | scene cast tests | explicit Story speaker/null + canonical presence | no pre-Story inference test remains; Phase 4 DELETE |
| 플레이어 발화 처리(전용 함수 없음) | dedicated export/function 없음; raw `player_action` is passed by `turn-routes.js` to `buildStoryPrompt` and `buildExtractPrompt` | `turn-routes.js` story/extract payload construction | prompt/turn pipeline tests | preserve input surface; Extract observes only material actually spoken | no separate policy helper is created; Phase 3/4 |
| pre-Story movement boundary | `story-prompt.js:76` `resolveMovementCharacterTarget`; `scene-cast.js:545` `buildSceneCastContract` and `turn-routes.js:409` | `/api/story` prompt preparation | `live-play-ux-regressions`, map-cast tests | canonical scene observation after Story; action authority only for reserved action | movement tests pass without new actor resolver; Phase 4 REPLACE |
| `sanitizeMovementCommit` | `src/engine/guarded-merge.js:315` export | `turn-routes.js:641` | `movement-commit-regression`, integration movement test | reducer movement observation + invariants | destination/presence/location tests pass; Phase 4 REPLACE |
| `applyGuardedStateDelta` | `src/engine/guarded-merge.js:441`, re-export `engine/index.js` | `turn-routes.js:623` | gameplay-runtime, clothing, relationship, phase-2, authority tests | `runtime-core/commit-reducer.js` | all evidence gates represented; Phase 3/4 REPLACE |
| choice fallback | `guarded-merge.js:26` `buildFallbackTurnChoices`; called at line 669 | `applyGuardedStateDelta` | `phase-2-engine`, clothing stabilization | explicit `format_failure` plus a projection-only safe fallback | fallback never marks raw format success; Phase 3/6 REPLACE |
| `normalized_raw` | `src/engine/narrative-parser.js:535,619` output only; no production reader found | no production reader | `company-supabase-evidence-recovery.test.mjs:41-42` | raw `story_text`; parser result remains derived | remove only after test migrates to raw assertion; Phase 3 DELETE output field |
| CSA runtime lifecycle | `src/engine/csa/reducer.js` `buildCsaRuntimeStatePatch`, `buildCsaAftereffectPatch` | `turn-routes.js:664,673`; runtime display/extract sections | CSA hardening, gameplay-state, authority cleanup tests | `runtime-core/commit-reducer.js` rules.runtime | lifecycle/applicability/execution tests reproduced; Phase 5 REPLACE |
| Extract state delta semantics | `src/engine/gameplay-state.js` `normalizeGameplayExtractEnvelope`; `guarded-merge.js` consumes `state_delta` | `/api/extract` → `/api/commit` | gameplay/relationship/clothing tests | `runtime-core/extract-observation.js` | observation fields and warnings cover all current gates; Phase 3 REPLACE |
| setup/opening presence initializer | `src/engine/player-setup.js:234` `buildOpeningNextSave`; migration `20260803000500...:164-176` `commit_company_player_setup` | `/api/player-setup`, `/api/opening` | `company-player-setup-opening-v1` | canonical scene initializer writes `scene_id`, `location_id`, `beat`, goal/focus, present IDs; legacy fields become projection | keep until canonical initializer + reset/opening compatibility tests pass; Phase 2/6 REPLACE, not DELETE |
| legacy scene fields | `scene_state`, `last_npcs_present`, `npc_scene_state.*.present`, focal/speaker assignments above | API context/display/frontend readers | response/view-model/map tests | read-only `projections.js` | projection parity and no write-back; Phase 6 TEMPORARY KEEP → REPLACE |
| legacy CSA shape | `csa_active`, `csa_rules`, `csa_runtime_state` in gameplay state/schema and reducer | Story/Extract/runtime display/CSA app | CSA route and runtime tests | `rules.active`/`rules.runtime` projections | compatibility read proven; Phase 5/6 TEMPORARY KEEP → REPLACE |

## Explicit disposition rules

- **KEEP** means current product behavior and outer API/DB shape remain during the transition.
- **REPLACE** means the current writer is retained only until the named canonical writer passes equivalent tests.
- **TEMPORARY KEEP UNTIL PHASE N** is a compatibility writer/read boundary with a stated final disposition; it is not permanent authority.
- **DELETE** is reserved for an actually uncalled symbol/output. `ActionExecutionContract` has no file or caller at this baseline, so no deletion is performed.

## Deletion gates

1. `git grep` shows no production or product-test caller, with the exact search recorded.
2. Replacement writer passes existing regression fixtures and the 15 recorded 17-turn cases.
3. Legacy reads remain read-only until all API/UI consumers use `projections.js`.
4. No migration, operational save repair, or new semantic matcher is needed.
5. Tests that protect deleted implementation may be removed only after product behavior is covered elsewhere; no test is removed in Phase 0.

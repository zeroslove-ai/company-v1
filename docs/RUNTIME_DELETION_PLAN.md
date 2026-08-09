# Runtime Deletion Plan

Phase 0에서는 어떤 항목도 삭제하지 않는다. 아래 분류는 실제 caller 조사에 따른 후속 작업 순서다.

| 분류 | 현재 파일·함수/export | 현재 caller | 대체 또는 선행 조건 | 영향 테스트 | 단계 |
|---|---|---|---|---|---|
| KEEP | `src/api/turn-routes.js` raw SSE loop, `record_story_result` | `/api/story`, replay/extract/commit | raw Story authority 유지 | turn pipeline, raw streaming | 지금 유지 |
| KEEP | `src/api/turn-routes.js` `structuredActionFor`, `resolveCsaTransactionPlan` | story/extract/commit/app-validate | action-authority로 이동하되 proof 의미 유지 | csa app/structured-action persistence | Phase 1 |
| KEEP | `src/engine/gameplay-state.js` `normalizeGameplayExtractEnvelope` | extract/commit 및 guarded merge | observation-only envelope로 계약 명시 | gameplay runtime, phase-2 engine | Phase 3까지 유지 |
| KEEP | `src/engine/guarded-merge.js` evidence gates | `applyGuardedStateDelta` | reducer 도입 전까지 보존 | clothing/relationship/stats regressions | Phase 1–3 |
| KEEP | `src/engine/scene-cast.js` 현재 participants 기준 계약 | story/commit route | canonical scene projection으로 이전 전까지 유지 | scene-cast/map tests | Phase 2 |
| KEEP | `buildCompanyGameViewModel` 및 renderers | frontend `app.js`, render | canonical projection을 읽도록 유지 | frontend state/UI tests | Phase 6 |
| REPLACE | `src/engine/action-execution-contract.js` action execution firewall | `turn-routes.js` Story/route imports 및 action tests 확인 필요 | `runtime-core/action-authority.js`에서 예약 action만 검증 | authority cleanup tests | Phase 1 |
| REPLACE | `src/engine/scene-cast.js` `buildSceneCastContract` | `turn-routes.js:409,634` | `runtime-core` canonical scene + read projection | movement/scene cast regressions | Phase 2/4 |
| REPLACE | `src/engine/guarded-merge.js` `sanitizeMovementCommit` | `turn-routes.js:641` | reducer의 movement observation/invariants | `movement-commit-regression` | Phase 4 |
| REPLACE | `src/engine/guarded-merge.js` `applyGuardedStateDelta` | API route 및 여러 tests | `runtime-core/commit-reducer.js` | gameplay-runtime, phase-2 engine | Phase 3/4 |
| REPLACE | `src/engine/scene-cast.js` allowed speaker/participant candidate 계산 | `buildSceneCastContract` 내부 | 명시 speaker + canonical participants | scene cast tests | Phase 2/4 |
| REPLACE | player dialogue policy / pre-Story movement boundary | `turn-routes.js` scene cast/action preparation | Story 후행 observation과 action authority 분리 | turn pipeline | Phase 1/4 |
| REPLACE | CSA lifecycle duplicate paths (`csa_runtime_state`, `csa_runtime_updates`, trigger evaluations) | `gameplay-state.js`, `turn-routes.js` commit runtime patch | `rules.runtime` 단일 reducer 축 | CSA runtime regressions | Phase 5 |
| REPLACE | `normalized_raw`/parsed projection 기반 recovery | replay/extract paths | 저장 `story_text` 재사용 | raw/replay tests | Phase 1/3 |
| REPLACE | choice fallback in `applyGuardedStateDelta` | guarded merge and view model | raw Story choices → reducer projection | choices tests | Phase 2/3 |
| DELETE | pre-Story actor/target/speaker inference | `scene-cast.js` candidate helpers and legacy callers, once audited | Extract observation only | authority cleanup tests | Phase 4 |
| DELETE | duplicate scene presence writers | `last_npcs_present`, `npc_scene_state.*.present` assignments in guarded merge/setup/opening | canonical scene projection | movement/presence regressions | Phase 2/4 |
| DELETE | speaker inference LLM/status path | PR #46 removed production tagger path; verify any remaining test-only caller | explicit speaker/null | raw Story tests | Phase 3 |
| DELETE | legacy CSA v1 compatibility route | CSA prompt/planner readers after catalog/runtime audit | rules.active/runtime | CSA route tests | Phase 5/6 |
| DELETE | `stream_segments` new writer/replay priority | PR #46 raw Story path has no new writer; old DB read may remain | `story_text` only | replay tests | Phase 1 |
| TEMPORARY ADAPTER | `last_npcs_present` projection | `runtime-display.js`, `product-recovery.js`, frontend view-model, npc/location | derive from canonical scene; no write-back | UI/recovery tests | Phase 6 |
| TEMPORARY ADAPTER | `npc_scene_state.*.present` projection | scene cast/view-model/render | derive membership from canonical participants | frontend/scene tests | Phase 6 |
| TEMPORARY ADAPTER | legacy `scene_state` wrapper | API Context and existing RPC validators | read-only projection from `scene` | response/context tests | Phase 6 |
| TEMPORARY ADAPTER | legacy `csa_active/csa_rules/csa_runtime_state` shape | Story/Extract/UI readers | projection from `rules` | CSA app/runtime tests | Phase 5/6 |

## Deletion gates

각 DELETE는 다음 조건을 모두 만족할 때만 수행한다.

1. `rg`로 production/test caller가 0임을 확인한다.
2. replacement writer가 동일 invariant를 먼저 통과한다.
3. 기존 fixture와 17-turn regressions가 replacement로 통과한다.
4. migration/운영 save를 건드리지 않고 compatibility read가 남는다.
5. 삭제된 구현만 보호하는 테스트는 삭제하되 제품 회귀 테스트는 유지한다.

## 현재 판단

PR #46의 raw Story gate, segment writer, speaker-tagging LLM은 이미 제거된 상태이므로 이번 문서에서 재구현하지 않는다. `action-execution-contract`, scene cast, guarded merge, CSA runtime, legacy fields는 실제 caller가 아직 존재하므로 즉시 삭제 대상이 아니다. 새 모듈은 후속 Phase에서 하나씩 도입하고, 이 문서 Phase 0에서는 파일을 만들지 않는다.

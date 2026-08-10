# Company Runtime Core Reset Charter

## Phase 0 설계 고정

기준 커밋은 PR #46의 `9953a8a90b2dd9e5630fe169bd4d1bac2ae8e99f`이다. 이 문서는 실제 소스 writer/reader 조사와 이후 구현 경계를 고정한다. Phase 0에서는 runtime code, tests, fixtures, database를 변경하지 않는다.

## 1. 설계 목적과 유지 범위

제품의 API/UI/content 표면은 유지하면서 다음 흐름을 runtime 기준으로 고정한다.

```text
Story raw text
  → Extract observation
  → single Commit reducer
  → canonical save
  → next Context
```

현재 근거는 `src/api/turn-routes.js`의 `/api/story`, `/api/extract`, `/api/commit`, `src/engine/guarded-merge.js`의 `applyGuardedStateDelta()`다. Story route는 upstream chunk를 `raw`에 누적하고 `record_story_result`에 `p_story_text: raw`를 전달한다. Extract route는 `action.story_text`를 `storyForExtract`로 사용해 결과를 기록하지만 next save를 계산하지 않는다. Commit route가 저장된 Story와 Extract를 읽어 merge한 뒤 `commit_company_turn`을 호출한다.

다음 외부 surface는 KEEP한다.

- API endpoint
- request/response transport
- SSE named event surface
- `game_actions`, `game_turns`, `save` DB RPC 외형
- Story/Extract prompt의 API input surface
- frontend view-model, history/recovery, content catalog

교체 대상은 내부 authority다. 특히 Extract의 `state_delta` output semantics는 save patch 제안에서 Extract observation으로 교체하며, API endpoint나 RPC 외형을 이번 Phase 0에서 바꾸지 않는다.

## 2. Target runtime modules

향후 `src/engine/runtime-core/`에 다음 모듈을 도입한다. 이번 Phase 0에서는 파일을 만들지 않는다.

- `action-authority.js`: reserved structured action의 kind/proof/CSA mutation authority.
- `extract-observation.js`: Extract envelope를 observation-only로 정규화하고 save를 계산하지 않음.
- `commit-reducer.js`: previous save + stored structured action + Extract observation으로 next canonical save를 유일하게 계산.
- `invariants.js`: presence, focal/speaker, registered IDs, rule semantic, Story hash 검사.
- `projections.js`: canonical save에서 기존 Context/API/UI shape를 읽기 전용으로 생성.

## 3. Raw Story 단일 권위

```text
라이브 SSE delta 연결 결과
= game_actions.story_text
= replay Story
= Extract 입력
= game_turns.story_text
```

현재 writer는 `src/api/turn-routes.js:453-465`의 `upstreamRaw`와 `record_story_result`다. `parsed_blocks`는 `parseStoryProjection()`의 후행 projection이며 raw를 수정·삭제·차단하지 않는다. parser, speaker helper, UI renderer는 raw Story의 대체 authority가 될 수 없다.

## 4. Commit single writer

현재 `applyGuardedStateDelta()`와 `sanitizeMovementCommit()`가 여러 save 경로를 갱신한다. Target에서는 Commit reducer 하나가 다음 field를 쓴다.

```text
scene_id/location_id/beat/goal/focus_thread
present NPC, NPC location/posture/clothing
focal character, last speaker
CSA active/rules/runtime
NPC stats/work/relationship facts
```

Story route와 Extract route는 save를 계산하지 않는다. frontend와 API projection은 writer가 아니다.

## 5. Structured action을 통한 CSA mutation

현재 `structuredActionFor()`는 reserved row와 request를 비교하고 `resolveCsaTransactionPlan()`이 validation proof를 재검증한다. 이 authority를 보존하면서 후속 `action-authority.js`로 이동한다. `structured_action`이 없는 일반 Story/Extract 결과는 active rule 정의 목록을 생성·삭제·교체하지 않는다.

## 6. Extract observation-only

현재 `normalizeGameplayExtractEnvelope()`는 ID와 envelope shape를 정규화하고 `applyGuardedStateDelta()`가 state delta를 merge한다. Target Extract는 Story에서 관찰한 scene/location/presence/exit/posture/clothing/work/dialogue/last explicit speaker/choices/rule evidence만 반환한다. 알 수 없는 ID는 warning과 null/제외로 처리하고 raw Story는 보존한다. `state_delta`는 후속 reducer가 소비하는 observation input이며 save writer가 아니다.

## 7. Rule semantic과 physical evidence

structured action 검증 시 preset/template의 rule semantic을 확정하고 `rules.active`에 보존한다. 이후 Story·Extract·Commit은 trigger, actor/target, initiation/continuation, scope, strength, duration을 재정의하지 않는다. continuous rule이 actual physical state와 충돌하면 physical state를 자동 변경하거나 rule을 종료하지 않고 `rule_physical_conflict` warning/invariant failure를 남긴다.

## 8. Speaker 추정 금지

PR #46에서 speaker-tagging LLM path는 제거되었다. 명시적 `speaker_id`만 사용하고 미확정 화자는 null로 둔다. 본문·대사·Extract 입력을 수정하거나 추가 LLM을 호출하지 않는다. 자동 TTS는 유효 speaker만 대상으로 한다.

## 9. Fallback 성공 처리 금지

Story choices/inner thought 누락, parser malformed, scene/location mismatch, structured action loss, continuous rule conflict는 성공 fallback으로 은폐하지 않는다. raw Story는 보존하되 warning 또는 invariant failure를 명시한다. degraded commit 정책은 유지하지만 Extract observation-only 전환과 혼동하지 않는다.

## 10. Legacy compatibility

기존 `scene_state`, `last_npcs_present`, `npc_scene_state.*.present`, `focal_character_id`, `last_speaker_id`, `csa_active/csa_rules/csa_runtime_state`는 canonical state에서 생성하는 read-only legacy projection으로 유지할 수 있다. 과거 `stream_segments`가 있어도 `story_text`가 존재하면 우선하지 않는다. projection은 canonical save를 다시 쓰지 않는다.

## 11. 단계별 구현 원칙

1. **Phase 1 — Action authority와 CSA mutation 분리**: reservation, action row, structured action proof와 단일 CSA writer.
2. **Phase 2 — Canonical scene와 single reducer**: `scene_id`, `location_id`, `beat`, `goal`, `focus_thread`, present NPC, focal/speaker를 canonicalize.
3. **Phase 3 — Extract observation-only**: state delta 직접 merge를 제거하고 physical evidence/observation만 전달.
4. **Phase 4 — Guarded merge/scene cast 정리**: `applyGuardedStateDelta()`, `buildSceneCastContract()`, `sanitizeMovementCommit()` 중복 authority 제거.
5. **Phase 5 — Stats·CSA runtime 최소화**: continuous rule을 특정 NPC executed state로 축소하지 않고 lifecycle과 감정/arousal을 분리.
6. **Phase 6 — Legacy projection과 UI 연결**: canonical state에서 기존 Context/view-model shape를 읽기 전용 생성.
7. **Phase 7 — 20턴 검증**: 별도 test game에서 20턴, replay/recovery/feedback과 invariant를 검증; 운영 17턴 save는 수정하지 않음.

## 12. 금지 범위

이번 문서 PR에서는 runtime code, test/fixture, migration, Supabase, operational save, live LLM, Worker를 변경하지 않는다. PR #46은 Open/Draft로 보존하며 Ready 전환이나 merge를 하지 않는다.

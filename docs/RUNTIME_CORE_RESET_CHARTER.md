# Company Runtime Core Reset Charter

## Phase 0 설계 고정

기준 커밋은 PR #46의 `9953a8a90b2dd9e5630fe169bd4d1bac2ae8e99f`이다. 이 문서는 실제 코드에 대한 조사 결과와 이후 구현의 경계를 고정한다. Phase 0에서는 런타임 코드, 테스트, 데이터베이스를 변경하지 않는다.

## 1. 설계 목적

현재 제품의 UI·콘텐츠·API 표면을 유지하면서 다음 단일 흐름을 향후 런타임의 기준으로 삼는다.

```text
Story raw text
  → Extract observation
  → single Commit reducer
  → canonical save
  → next Context
```

현재 구현의 근거는 `src/api/turn-routes.js`의 `/api/story`·`/api/extract`·`/api/commit` 라우트와 `src/engine/guarded-merge.js`의 `applyGuardedStateDelta()`이다. Story 라우트는 upstream chunk를 `raw`에 누적하고 `record_story_result`에 `p_story_text: raw`를 전달하며, Extract 라우트는 `action.story_text`를 `storyForExtract`로 사용한다. Commit 라우트는 저장된 Story와 Extract를 읽어 merge 후 `commit_company_turn`을 호출한다.

## 2. 현재 유지해야 하는 외부 시스템

- API endpoint와 SSE named event 형식
- Story/Extract prompt의 현재 입력 계약
- `game_actions`, `game_turns`, `save`의 기존 RPC 계약
- frontend view-model과 history/recovery UX
- CSA app, content catalog, TTS/image endpoint
- Supabase schema와 운영 데이터

이 문서의 target state는 위 표면을 교체하지 않고 내부 writer 권위를 정리하는 후속 설계다.

## 3. 교체할 핵심 시스템

향후 `src/engine/runtime-core/`에 다음 다섯 모듈을 도입할 수 있다. 이번 Phase 0에서는 파일을 만들지 않는다.

- `action-authority.js`: 예약된 structured action의 kind·proof·CSA mutation 경로를 단일화한다.
- `extract-observation.js`: Extract envelope를 관찰 자료로만 정규화하고 save 계산을 하지 않는다.
- `commit-reducer.js`: 이전 save + 저장된 structured action + Extract observation만으로 다음 save를 만든다.
- `invariants.js`: Commit 직전 presence, focal/speaker, 등록 ID, CSA mutation, Story hash를 검사한다.
- `projections.js`: canonical save에서 기존 API/context/UI shape를 읽기 전용으로 생성한다.

## 4. Raw Story 단일 권위

다음 문자열은 동일해야 한다.

```text
라이브 SSE delta 연결 결과
= game_actions.story_text
= replay Story
= Extract 입력
= game_turns.story_text
```

현재 writer는 `src/api/turn-routes.js:453-465`의 `upstreamRaw`와 `record_story_result` 호출이다. `parsed_blocks`는 `parseStoryProjection()`의 후행 projection이며 raw를 수정하거나 차단하지 않는다. 이후 구현에서도 parser, speaker tagger, UI renderer는 raw Story의 대체 권위가 될 수 없다.

## 5. Commit single writer

현재 `applyGuardedStateDelta()`가 여러 save 경로를 직접 갱신하고 `sanitizeMovementCommit()`가 scene 관련 추가 수정을 수행한다. 향후에는 Commit reducer 하나가 다음 필드의 writer가 된다.

```text
scene location, present NPC, NPC location/posture/clothing,
focal character, last speaker, CSA active/rules/runtime,
NPC stats, work state, relationship facts
```

Story route와 Extract route는 save를 계산하거나 수정하지 않으며, frontend는 raw save를 writer로 취급하지 않는다.

## 6. Structured action을 통한 CSA mutation

현재 `structuredActionFor()`는 예약 row의 structured action과 요청값을 비교하고, `resolveCsaTransactionPlan()`이 validation proof를 재검증한다. 이 authority를 보존하되 향후 `action-authority.js`로 이동한다. `structured_action`이 없는 일반 Story/Extract 결과는 active CSA 목록을 변경할 수 없다.

## 7. Extract observation-only

현재 `normalizeGameplayExtractEnvelope()`는 ID와 envelope shape를 정규화하고, `applyGuardedStateDelta()`가 state delta를 merge한다. target state에서는 Extract가 관찰한 장소·등장 NPC·퇴장·자세·복장·업무 상태·대화·마지막 유효 화자·선택지·규정 근거만 반환하며 save를 만들지 않는다. 알 수 없는 ID는 warning과 null/제외로 처리하고 Story 원문은 보존한다.

## 8. Speaker 추정 금지

PR #46에서 speaker-tagging LLM 경로는 삭제되었다. 명시적 `speaker_id`만 사용하고 미확정 화자는 null로 둔다. 본문·대사·Extract 입력을 수정하거나 추가 LLM을 호출하지 않는다. 자동 TTS는 유효한 speaker가 있는 줄만 대상으로 할 수 있다.

## 9. Fallback 성공 처리 금지

Story choices, Story text, current NPC, scene presence/location mismatch, structured action loss, continuous CSA와 physical state 충돌, parser 미인식 문장은 성공 fallback으로 조용히 덮지 않는다. raw Story는 보존하되 warning 또는 invariant failure를 명시한다. Degraded commit은 기존 정책을 유지하며 후속 reducer가 동일한 규칙으로 표현해야 한다.

## 10. Legacy compatibility 경계

기존 RPC/Context가 요구하는 `scene_state`, `last_npcs_present`, `npc_scene_state.*.present`, `focal_character_id`, `last_speaker_id`는 읽기 projection으로 유지할 수 있다. 과거 `stream_segments`가 있더라도 `story_text`가 존재하면 `story_text`를 우선한다. compatibility projection은 canonical save를 다시 쓰지 않는다.

## 11. 단계별 구현 원칙

1. **Phase 1 — Action authority와 CSA mutation 분리**: 예약·action row·structured action proof를 추적하고 단일 CSA writer를 만든다.
2. **Phase 2 — Canonical scene와 single reducer**: scene, present NPC, focal/speaker를 canonical 구조로 옮기고 legacy field는 projection한다.
3. **Phase 3 — Extract observation-only**: state delta 직접 merge를 제거하고 location/presence/posture/clothing observation만 전달한다.
4. **Phase 4 — 기존 guarded merge/scene cast 정리**: `applyGuardedStateDelta()`, `buildSceneCastContract()`, `sanitizeMovementCommit()`의 중복 authority를 reducer/invariants로 옮긴다.
5. **Phase 5 — stats·CSA runtime 최소화**: continuous CSA의 반복 executed 상태를 없애고 request action lifecycle과 감정/arousal을 분리한다.
6. **Phase 6 — Legacy projection과 UI 연결**: canonical save에서 기존 Context/view-model shape를 읽기 전용으로 제공한다.
7. **Phase 7 — 20턴 검증**: 별도 test game에서 20턴과 replay/recovery/feedback을 포함해 invariant를 검증한다. 운영 17턴 save는 수정하지 않는다.

## 12. 20턴 검증 기준

20턴 시나리오는 일반 행동, 이동, multi-NPC presence, NPC 퇴장, continuous CSA, on-request CSA, malformed Story, unresolved speaker, replay, Extract 실패, Commit retry를 포함한다. 각 턴에서 raw Story hash, final participants, focal/speaker validity, registered location/ID, structured-action 여부와 CSA mutation을 기록한다. 테스트 수를 늘리기 위해 의미 없는 assertion을 추가하지 않는다.

## 13. 금지 범위

이번 문서 PR에서는 런타임 코드·함수·테스트·fixture·migration·Supabase·운영 save·live LLM·Worker를 변경하지 않는다. PR #46은 Open/Draft로 보존하며 Ready 전환이나 병합을 하지 않는다.

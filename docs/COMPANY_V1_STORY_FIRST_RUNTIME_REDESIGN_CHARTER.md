# Company v1 Story-First Runtime Redesign Charter

> **문서 성격:** 프로젝트 최상위 설계 원칙 / 구조 개편 기준서  
> **적용 대상:** `zeroslove-ai/company-v1`  
> **기준 시점:** 2026-08-08, CSA world-rule 1차 안정화 병합 이후  
> **우선순위:** 개별 PR, 핫픽스, 테스트, 기존 구현보다 이 문서가 상위 기준이다.

---

## 1. 이 문서의 목적

Company v1은 독립 백엔드를 새로 만들었지만, 안정화 과정에서 Story를 돕기 위한 보조 장치가 점차 Story보다 큰 권위를 갖게 되었다.

그 결과 다음과 같은 역전이 발생했다.

```text
플레이어 입력
→ 여러 분류기·게이트·Scene Cast·CSA route가 먼저 의미와 결과를 판정
→ Story가 허용된 범위 안에서 생성
→ parser와 Structured Story gate가 다시 해석
→ Extract가 장면·대사·선택지·상태·이미지를 다시 해석
→ Commit이 여러 방화벽과 validator로 다시 판정
→ UI가 결과를 다시 조립
```

이 문서는 1차 안정화 이후 프로젝트가 다른 방향으로 새지 않도록, 최종 목표와 금지 원칙을 고정한다.

구조 개편의 목적은 코드를 예쁘게 정리하는 것이 아니다.

> **Story와 스트리밍을 다시 게임의 중심으로 만들고, 나머지 모든 계층을 후행 보조 장치로 되돌리는 것**이 목적이다.

---

# 2. 최상위 불변 원칙

아래 원칙은 향후 모든 설계·PR·테스트·운영 판단보다 우선한다.

## 2.1 Story가 게임의 본체다

```text
플레이어 입력
→ 현재 확정 사실을 바탕으로 Story가 자연스럽게 전개
→ Story 원문을 즉시 스트리밍
→ Extract가 실제로 벌어진 결과만 후행 구조화
→ Commit이 최소 무결성만 검증
→ UI·이미지·TTS가 결과를 보조 표시
```

Story 앞에서 성공·거절·허용·대상·행동 route를 미리 결정하지 않는다.

## 2.2 스트리밍이 최우선이다

첫 Story delta는 중간 parser, speaker 판정, gate, 이미지, TTS, Extract를 기다리지 않고 즉시 화면에 전달한다.

- 전체 화면 loading UI가 Story를 가려서는 안 된다.
- marker나 대사 블록 완성을 기다리며 버퍼링하지 않는다.
- Extract·Commit·이미지·TTS 완료를 기다렸다가 Story를 보여주지 않는다.
- 스트리밍 실패와 보조 기능 실패를 분리한다.

## 2.3 Story에는 사실만 전달한다

Story prompt에는 다음만 전달한다.

- 현재 위치
- 현재 등장 인물
- 캐릭터 설정과 말투
- 현재 확정 물리 상태
- 최근 확정 Story
- 현재 활성 세계 규칙
- 플레이어 입력

다음은 Story 전에 전달하지 않는다.

- 행동 성공·실패 결론
- 관계 수치 기반 행동 허가
- 사전 actor/target 선택
- ordinary/csa route
- contextual permission
- privacy gate 결과
- 이미지 pool 판단
- 저장 taxonomy 때문에 만들어진 제한
- parser가 추론한 서사 결론

## 2.4 Story 원문은 불변 정본이다

LLM이 출력한 raw Story는 화면과 DB의 정본이다.

Parser와 Extract는 다음을 할 수 없다.

- 원문 문장 삭제
- 대사 재작성
- 화자 추측 결과로 원문 교체
- 잘못된 marker 이후 문장 폐기
- 선택지 전체 교체
- Story에 없던 acting direction 생성
- 구조화 실패를 이유로 Story 재생성

형식이 깨져도 원문은 반드시 보존한다.

## 2.5 Extract는 Story 뒤에서 실제 결과만 구조화한다

Extract는 Story가 적절했는지 재판하지 않는다.

Extract의 책임은 다음으로 제한한다.

- 장면 변화
- 인물 상태 변화
- 플레이어 상태 변화
- 관계·수치 변화
- 실제 사건
- 세계 규칙 관찰 결과
- Mind Monitor
- 턴 요약
- 시간 경과
- exact evidence

Extract에서 제거할 대상:

- Story 재작성
- 대사 재작성
- 선택지 재작성
- action route
- CSA route
- 사전 권한 판정
- 이미지 ID 직접 선택
- UI 표시 문장
- 같은 사실을 여러 ledger에 중복 기록

## 2.6 Commit은 재판관이 아니라 저장 경계다

Commit이 검증할 것은 다음뿐이다.

- action ID와 expected turn
- idempotency
- schema shape
- 등록된 ID
- 숫자 범위
- exact Story evidence
- 동일 action 내 중복
- save revision 원자성

Commit이 판단하지 않을 것:

- 관계 단계상 가능한 행동인가
- NPC가 충분히 자발적이었는가
- 공개 장소에서 자연스러운가
- 회사 권한을 악용했는가
- 특정 한국어 표현이 수락인가 거절인가
- Story가 세계관 규칙에 적절한가

## 2.7 보조 장치 실패는 해당 장치만 실패해야 한다

```text
대사 화자 미확정 → 텍스트는 표시, 자동 TTS만 생략
이미지 후보 없음 → Story 유지, 기본 이미지 또는 이전 이미지
착의 evidence 오류 → 착의 delta만 폐기
NPC 수치 범위 오류 → 해당 수치만 폐기
이벤트 actor 오류 → 해당 이벤트만 폐기
Mind Monitor 오류 → Mind Monitor만 비움
Extract 전체 실패 → Story 보존, degraded commit, 다음 턴 가능
```

어떤 보조 장치도 Story 표시와 다음 턴 진행을 막아서는 안 된다.

## 2.8 하나의 사실에는 하나의 정본만 둔다

중복 writer를 허용하지 않는다.

| 사실 | 최종 정본 |
|---|---|
| Story 원문 | `game_turns.story_text` |
| 장면 위치 | `scene_state.location_id` |
| 장면 참여자 | `scene_state.participants` |
| NPC 물리 상태 | `npc_scene_state[npc_id]` |
| 대사 | Story 원문에서 파생 |
| 선택지 | Story 원문에서 파생 |
| 활성 세계 규칙 | 선언적 `active_world_rules` |
| 상태·관계 변화 | committed Extract delta |
| 사건 | evidence가 있는 committed event |
| 이미지 | committed scene/event projection |
| TTS | parsed dialogue + voice catalog |

Legacy 필드는 writer를 먼저 0개로 만든 뒤, read compatibility 기간을 거쳐 삭제한다.

## 2.9 보조 시스템은 Story의 방향을 역으로 제한하지 않는다

금지되는 역방향 의존:

```text
이미지 부족 → Story 행동 제한
TTS 화자 추출 실패 → Story 대사 형식 강제·변경
저장 taxonomy 부족 → Story 행동 금지
UI 표시 편의 → save 중복 필드 추가
Commit validator → Story 결과 무효화
과거 runtime 상태 → 현재 장면 고정
```

## 2.10 삭제가 추가보다 우선한다

버그가 발생했을 때 먼저 묻는다.

1. 기존 계층이 잘못된 권위를 가지고 있는가?
2. 동일 사실을 여러 곳에서 쓰고 있는가?
3. 삭제할 수 있는 gate, adapter, compatibility path가 있는가?
4. 새 helper 없이 기존 책임을 줄일 수 있는가?

새 verifier, sanitizer, classifier, firewall, router, recovery layer 추가는 최후 수단이다.

## 2.11 테스트 수는 성과 지표가 아니다

테스트는 제품 동작을 보호해야지 과거 구현을 보호해서는 안 된다.

삭제 대상:

- prompt 문장 exact-match
- 특정 주석·함수명 존재 검사
- CSS 숫자 exact-match
- 죽은 helper의 compatibility test
- 동일 계약을 여러 계층에서 중복 검증
- source regex 기반 구현 고정
- warning 문자열만 검증
- obsolete route·field 보존 테스트

`전체 N개 통과`보다 다음을 보고한다.

- 삭제한 제품 코드
- 삭제한 테스트
- 통합한 중복 테스트
- 단일화한 writer
- 실제 플레이 시나리오 결과

## 2.12 실플레이가 최종 검증이다

Unit test와 CI 성공만으로 완료 처리하지 않는다.

최종 판정은 다음을 포함한다.

- 실제 임시 게임
- 첫 delta 체감
- 20~30턴 연속 진행
- 이동·퇴장·다중 NPC
- malformed 대사
- 선택지 누락
- Extract 실패
- Commit replay
- 새로고침
- 이미지 없음
- TTS 화자·연기톤
- 다음 턴 진행 가능 여부

---

# 3. 지금까지의 구조적 실패

## 3.1 보조 장치가 새 권위가 됐다

안정화 과정에서 다음이 추가됐다.

- CSA direct coverage
- ActionExecutionContract
- contextual permission
- privacy gate
- relationship milestone gate
- state firewall
- boundary follow-up
- Scene Cast Gateway
- Structured Story V2 gate
- narrative parser
- speaker inference
- speaker tagger
- physical-state evidence validator
- clothing authority
- image pool normalizer
- runtime reducer
- guarded merge
- 다수 recovery 상태
- 동일 계약을 반복 검증하는 테스트

문제는 개별 장치의 존재가 아니라, 이들이 Story 전에 의미와 결과를 결정하거나 Story 이후 결과를 다시 뒤집었다는 점이다.

## 3.2 Story 전에 결과를 결정했다

사전 계약이 행동 종류, 대상, 공개성, 관계 단계, 흥분도, 회사 권한, CSA 적용 여부 등을 계산하고 Story route를 정했다.

그 결과:

- 자연스러운 요청도 blocked
- 활성 세계 규칙도 개별 NPC 요청처럼 처리
- 이동·중단 입력이 과거 runtime에 밀림
- 캐릭터 감정보다 gate 결과가 우선
- Story가 이미 정해진 결론을 설명하는 역할로 축소

1차 안정화에서 CSA Story path의 사전 coverage는 제거됐지만, legacy helper와 비-Story compatibility path가 남아 있다. 구조 개편에서는 완전히 삭제해야 한다.

## 3.3 같은 사실의 정본이 너무 많다

장면 참여자만 해도 다음이 공존했다.

- `scene_state.participants`
- `last_npcs_present`
- `npc_scene_state[npc].present`
- `focal_character_id`
- `last_speaker_id`
- Extract `npcs_present`
- Scene Cast present/entering/remote/context
- Story에 실제 등장한 인물

착의도 Story, Extract, evidence, npc state, UI가 서로 다른 값을 가졌다.

이 구조에서는 검증이 강해지는 것이 아니라 writer들이 서로의 결과를 지운다.

## 3.4 자연어를 완벽한 구조로 바꾸려다 원문을 손상했다

대사 문제를 해결하기 위해:

- prompt 강제
- 한국어 화행 규칙
- 호칭 규칙
- 교대 규칙
- parser 추론
- Extract 추론
- speaker tagging LLM
- tagging 상태 영속
- UI 재렌더링

이 누적되었다.

최종 방향은 단순하다.

> 화자를 확정하지 못해도 대사 텍스트는 보존한다. 화자 미확정이면 자동 TTS만 생략한다.

## 3.5 Extract가 너무 많은 역할을 가졌다

Extract가 선택지, 대사, 장면, 관계, 물리 상태, 이벤트, CSA, 이미지, 시간, 성공 여부까지 모두 담당하면서 한 JSON 오류가 전체 턴을 오염시켰다.

Extract는 상태 변화 제안자로 축소해야 한다.

## 3.6 테스트가 옛 구조를 보호했다

호환 테스트 때문에 죽은 helper가 남고, prompt 문자열과 warning 문구가 제품 계약처럼 고정됐다.

구조 개편에서는 제품 코드를 먼저 삭제하고, 그 코드를 보존하는 테스트도 함께 삭제한다.

## 3.7 개발 프로세스가 복잡도를 키웠다

반복된 문제:

- 장기간 열린 stacked Draft PR
- 수십~수백 커밋의 통합 PR
- 코드와 운영 repair 혼합
- 실제 플레이 없이 완료 판정
- 테스트 개수를 완료 근거로 사용
- 모호한 “전면 이식” 지시
- 한 버그 수정 중 관련 없는 구조 확장

구조 개편에서는 최신 main 기준, 단일 권위 경계별 소규모 PR로 진행한다.

---

# 4. 병원편에서 가져올 것과 버릴 것

병원편은 코드 donor가 아니라 사용자 경험 레퍼런스다.

## 4.1 가져올 것

- 첫 토큰부터 보이는 Story 스트리밍
- Story가 게임 중심이라는 체감
- 최근 턴의 자연스러운 연속성
- 플레이어 이동·중단·요청 자유도
- 세계 규칙 이행과 개인 감정의 분리
- 자연스러운 한국어 대사와 속마음
- TTS 화자·연기톤 보존
- 이미지와 TTS 실패가 게임을 막지 않는 흐름
- 관계·기록 UI의 가독성

## 4.2 버릴 것

- 병원 Worker 전체
- 병원 DB와 save schema
- 병원 세계관 전용 필드
- donor 임시 route와 gate
- 누적 compatibility 코드
- monolithic Worker
- 회사편에 없는 개인 암시·최면 체계
- 별도 summary·image·ambient LLM
- 레거시 endpoint
- 코드 통째 복사

비교 방법:

```text
동일한 10~20개 플레이 상황
→ 병원편에서 자연스러웠던 사용자 결과 기록
→ 회사편 목표 행동 계약으로 변환
→ 회사편 독립 구조로 재현
```

---

# 5. 최종 파이프라인

```text
[1] Turn reservation
    action_id, expected_turn, idempotency만 처리

[2] Context projection
    현재 확정 사실만 조립

[3] Story SSE
    LLM delta를 가공하지 않고 즉시 전달

[4] Raw Story persist
    upstream 원문을 불변 정본으로 저장

[5] Narrative projection
    대사·속마음·선택지를 비파괴적으로 파생

[6] Extract
    실제 Story에서 발생한 상태 변화만 제안

[7] Minimal Commit
    ID·타입·범위·evidence만 검증 후 필드별 적용

[8] Product projection
    UI·이미지·TTS·기록을 committed state에서 파생
```

의존 방향:

```text
Story
  ↓
Extract
  ↓
Commit
  ↓
UI / Image / TTS
```

역방향 의존은 금지한다.

---

# 6. Story·스트리밍 목표 구조

## 6.1 Story prompt 구성

최종 Story prompt는 네 덩어리만 가진다.

```text
1. 고정 게임·서사 원칙
2. 현재 확정 장면 사실
3. 최근 확정 Story 원문
4. 이번 플레이어 입력
```

활성 CSA는 사전 route가 아니라 선언적 `active_world_rules`로만 전달한다.

## 6.2 Scene Cast 격하

Scene Cast는 출연 허가 시스템이 아니라 단순 roster/context가 된다.

예시:

```json
{
  "location_id": "brand_strategy_office",
  "present_character_ids": ["heroine1", "heroine3"],
  "known_character_ids": ["heroine1", "heroine2", "heroine3"],
  "player_id": "player-1"
}
```

누가 말할지, 누구에게 다가갈지, 누가 떠날지는 Story가 결정한다.

## 6.3 스트리밍 계약

```text
DeepSeek delta
→ SSE delta
→ 브라우저 즉시 표시
```

첫 delta 도착 즉시:

- 전체 화면 loading 제거
- 하단 상태만 `서사 생성 중`
- Story 영역 완전 노출
- 사용자가 하단 근처에 있을 때만 자동 스크롤
- 턴 중복 전송만 차단

## 6.4 비파괴 parser

Parser가 할 수 있는 일:

- 섹션과 marker 파악
- 명시된 speaker ID 또는 이름 읽기
- 선택지 번호 파악
- 일반 산문 보존

Parser가 하지 않는 일:

- 문장 삭제
- 원문 교체
- 화자 강제 추론
- Acting direction 생성
- 선택지 전면 대체

---

# 7. Extract 목표 구조

최종 핵심 shape 예시:

```json
{
  "scene_delta": {
    "location_id": null,
    "participants": [],
    "focus_character_id": null
  },
  "npc_deltas": {
    "heroine1": {
      "emotion": {},
      "stats": {},
      "physical_state": {}
    }
  },
  "player_delta": {},
  "events": [],
  "csa_observations": [],
  "mind_monitor": {},
  "turn_summary": "",
  "elapsed_minutes": 0,
  "evidence": {}
}
```

필드별 fail-soft를 기본값으로 한다.

Extract 전체 실패 시:

```text
Story 원문 저장 유지
→ 상태 변화 없는 degraded commit
→ warning 기록
→ 다음 턴 진행 가능
```

---

# 8. Commit과 Recovery 목표 구조

## 8.1 Commit

Commit은 하나의 save patch만 만든다.

삭제 대상:

- Story 전 route 재적용
- permission firewall
- 한국어 의미 regex
- boundary follow-up
- Story retcon
- coverage 기반 상태 승격
- 동일 사실 반복 validator

## 8.2 Recovery

목표 상태:

```text
reserved
story_saved
committed
terminal_failed
```

복구 규칙:

```text
reserved + Story 없음 + lease 만료
→ 동일 action_id로 Story 재시도

story_saved + Commit 안 됨
→ Extract/Commit 재개

committed
→ 결과 반환

terminal_failed
→ 새 입력 허용 + 실패 안내
```

프론트는 복구 결정을 하지 않고 서버가 반환한 다음 단계만 실행한다.

---

# 9. UI·이미지·TTS 원칙

## 9.1 UI

```text
스트리밍 중
→ raw delta 화면 추가

스트리밍 완료
→ parser projection으로 대사·속마음·선택지 장식

Commit 완료
→ 상태 패널만 갱신
```

Commit 이후 Story 전체를 재렌더링해 대사가 사라지거나 순서가 바뀌어서는 안 된다.

## 9.2 이미지

```text
최신 committed event
→ 현재 focal character
→ 현재 장면·행동 tag
→ 이미지 catalog 조회
```

후보가 없으면 Story는 그대로 유지한다.

## 9.3 TTS

- TTS ON일 때만 API 호출
- 주요 등록 NPC만 자동 재생
- 같은 화자이면서 같은 연기톤인 인접 대사만 병합
- 화자 또는 톤이 바뀌면 별도 요청
- 새 턴이 기존 재생을 무조건 가로채지 않음
- 화자 미확정 대사는 자동 TTS 생략
- TTS 실패가 다음 턴을 막지 않음

---

# 10. 목표 코드 구조

```text
src/runtime/
  turn-controller.js
  context-projector.js
  story-stream.js
  extract-runner.js
  commit-reducer.js
  recovery-policy.js

src/domain/
  scene-state.js
  physical-state.js
  world-rules.js
  relationship-state.js
  event-ledger.js

src/projection/
  narrative.js
  media.js
  ui-state.js
```

새 모듈은 기존 계층 위에 추가하는 것이 아니라 기존 중복 계층을 대체해야 한다.

- `turn-controller`: 순서 조정만
- `context-projector`: 확정 사실 조립만
- `story-stream`: LLM·SSE·raw 저장만
- `narrative`: 비파괴 파생만
- `extract-runner`: 최소 Extract 실행만
- `commit-reducer`: 최소 검증·patch만
- `recovery-policy`: 상태 하나에서 다음 단계 하나만 결정

---

# 11. 테스트 개편

## 11.1 네 종류로 정리

### A. 핵심 영속성

- idempotency
- turn ordering
- revision
- feedback supersede
- reset
- Story 저장 후 Extract 실패
- Commit replay

### B. Story·스트리밍 제품

- 첫 delta 즉시 전달
- raw Story 불변
- parser 오류에도 문장 보존
- loading overlay 비차단
- 선택지 0~4개 보존·보충
- 화자 미확정 텍스트 보존
- 이동·중단 입력 존중

### C. 상태 reducer

- scene delta
- physical state
- stat range
- event evidence
- CSA observation
- 필드별 fail-soft

### D. UI·미디어

- committed snapshot projection
- TTS OFF 요청 0
- 주요 NPC 자동 TTS
- 같은 화자·같은 톤만 병합
- 이미지 실패 비차단
- 기록·상태 패널

## 11.2 Golden Play Trace

최소 20개 시나리오를 고정한다.

1. 일반 업무 대화
2. 여러 NPC 동시 대화
3. 특정 NPC를 만나러 이동
4. 새 NPC 등장
5. NPC 퇴장
6. 대사 형식 일부 붕괴
7. 선택지 2개만 생성
8. 활성 CSA 일반 이행
9. 여러 NPC에 CSA 동시 적용
10. CSA 위반
11. 관계가 낮은 상태의 과감한 요청
12. 진행 중 행동 중단
13. 이미지 없음
14. TTS 화자 변경
15. Extract invalid JSON
16. Commit replay
17. 네트워크 단절 후 복구
18. 앱 transaction 직후 Story
19. feedback revision
20. 새로고침 후 동일 화면 복원

검증 대상은 세 가지뿐이다.

```text
사용자에게 보인 Story
최종 committed state
다음 턴 진행 가능 여부
```

---

# 12. 실행 단계

## Phase 0 — 1차 안정화 종료

현재 CSA world-rule 변경은 추가 구조 확장 없이 마무리한다.

- 코드 병합 상태를 기준선으로 고정
- 필요 시 배포와 임시 게임 smoke만 수행
- 여기서 새 verifier나 gate를 추가하지 않음
- 치명 버그만 최소 수정

## Phase 1 — Authority Inventory

모든 사실에 대해 다음을 목록화한다.

```text
현재 writer
현재 reader
중복 writer
최종 canonical
삭제 대상
legacy read 기간
```

대상:

- Story
- parsed blocks
- dialogue
- choices
- scene
- focal
- last speaker
- physical state
- relationship
- CSA
- event
- image
- TTS
- recovery

## Phase 2 — 삭제 전용 PR

우선 삭제:

- legacy direct coverage helper
- 해당 helper 전용 compatibility test
- 미사용 route·field·export
- superseded prompt section
- dead source assertion
- 중복 Draft PR·branch

새 대체 helper는 만들지 않는다.

## Phase 3 — Story Streaming Core

- delta 직접 전달
- raw Story 불변 저장
- inline gate 제거
- parser 후행
- full-screen overlay 제거
- speaker tagger 제거
- Extract 실패와 Story 표시 분리

## Phase 4 — Extract·Commit 최소화

- 최소 Extract envelope
- choices·dialogue·image selection 제거
- scene·state·event만 반환
- Commit 최소 검증
- semantic guarded merge 삭제
- 필드별 fail-soft
- degraded commit

## Phase 5 — 장면·상태 정본 통합

- `scene_state.participants`만 presence 정본
- `npc_scene_state.present` writer 제거
- 최상위 `last_npcs_present` writer 제거
- focal은 UI 힌트로 격하
- last speaker는 dialogue projection에서 파생
- physical state writer 단일화

## Phase 6 — UI·이미지·TTS 재연결

- raw Story 화면 정본 유지
- Commit 후 상태 패널만 갱신
- 이미지·TTS 비차단
- TTS queue 단일화
- 기록 UI는 committed projection 사용

## Phase 7 — Recovery 단순화

- 서버 상태 최소화
- 프론트 recursive resume 제거
- stale Story retry와 post-Story resume 분리
- 실패 후 새 입력 가능

## Phase 8 — DB·legacy cleanup

다음 조건을 만족한 후 migration:

```text
legacy writer = 0
legacy reader = 0
실플레이 검증 완료
```

## Phase 9 — 테스트 축소·문서화

- 중복 테스트 삭제
- domain matrix 통합
- golden trace 고정
- stale fixture 삭제
- API·save contract 갱신
- 과거 문서 archive
- README는 현행 구조만 유지

---

# 13. PR 운영 원칙

1. 모든 작업은 최신 `main`에서 시작
2. 한 PR은 하나의 authority 경계만 변경
3. 앞 PR 병합 후 다음 PR 시작
4. 제품 코드와 운영 데이터 repair를 분리
5. migration은 writer 확정 후 별도 PR
6. 완료 보고 전 임시 게임 smoke
7. 테스트 수보다 삭제된 중복 구조를 보고
8. 수백 커밋의 장기 stacked PR 금지
9. 모호한 “전면 리팩터링” 지시 금지
10. 삭제 파일·최종 정본·금지 대체 구조를 지시서에 명시

완료 보고 형식:

```text
시작 SHA
최종 SHA
삭제 파일·함수
새 canonical writer
제거된 duplicate writer
삭제/통합 테스트
전체 테스트
실플레이 시나리오
첫 delta 영향
추가 LLM 호출
DB·배포 변경
잔존 legacy
```

---

# 14. 최종 완료 기준

## Story·스트리밍

- 첫 delta가 중간 gate 없이 화면 도착
- streaming 시작 후 전체 화면 overlay 없음
- 저장 Story가 upstream 원문과 동일
- malformed 대사 문장 유실 0
- parser 실패가 Story 표시·저장을 막지 않음
- 이동·중단·화제 전환을 사전 route가 무효화하지 않음

## Extract·Commit

- 일반 턴 Story 1회 + Extract 1회
- speaker·image·summary 추가 LLM 0
- Extract가 선택지·대사를 다시 쓰지 않음
- Commit이 Story 적절성을 재판하지 않음
- 보조 필드 실패 시 해당 필드만 폐기
- Extract 실패 후 Story 보존·다음 턴 가능

## 상태

- 장면 참여자 정본 1개
- 물리 상태 writer 1개
- 선택지 정본 1개
- 대사 정본 1개
- CSA 정본 1개
- 이벤트 정본 1개
- legacy writer 0

## UI·미디어

- Commit 후 Story 교체·유실 없음
- 이미지 실패 비차단
- TTS OFF 요청 0
- 주요 NPC만 자동 TTS
- 연기톤 다른 대사 병합 금지
- 새 오디오의 기존 재생 무조건 가로채기 금지

## 코드·테스트

- Story route용 legacy coverage 0
- Story 선결론 route 0
- speaker tagger·tagging recovery 0
- obsolete compatibility test 0
- prompt·CSS·주석 exact test 제거
- 테스트 수가 실제 중복 삭제를 반영
- 오래된 stacked PR·branch 정리
- `turn-routes.js`는 orchestration만 담당

## 실플레이

- 최소 20개 golden trace 통과
- 20~30턴 연속 플레이 유지
- 일반 대화에서 시스템 설명이 튀어나오지 않음
- 새로고침·좌초·Extract 실패 뒤 계속 플레이 가능
- 병원편의 안정적 체감과 비교해 명백한 퇴행 없음

---

# 15. 모든 변경에 적용할 최종 질문

```text
이 코드는 Story가 더 자연스럽고 빠르게 보이도록 하는가?
아니면 Story가 틀릴 가능성을 두려워해 또 하나의 판정 계층을 만드는가?
```

후자라면 구현하지 않는다.

```text
보조 장치가 틀렸을 때 Story를 고치는 것이 아니라,
보조 장치가 Story를 방해하지 못하게 만들어야 한다.
```

---

# 16. 현재 기준선과 다음 작업

- 현재 1차 안정화는 CSA를 개별 요청/사전 매칭이 아닌 선언적 world rule로 되돌리는 단계까지 마감한다.
- 이 안정화에 추가 구조를 얹지 않는다.
- 다음 작업은 **Phase 1 Authority Inventory**다.
- Authority Inventory가 끝나기 전에는 대규모 재작성이나 새 framework를 시작하지 않는다.
- 첫 구조 개편 PR은 **삭제 전용 PR**이어야 한다.

이 문서와 충돌하는 설계가 필요할 경우, 구현 전에 다음을 명시해야 한다.

1. 어떤 최상위 원칙과 충돌하는가
2. 왜 기존 원칙으로 해결할 수 없는가
3. 새 계층이 추가되는가
4. 어떤 기존 계층을 동시에 삭제하는가
5. Story 첫 delta와 원문 보존에 영향이 없는가
6. 임시 조치라면 제거 조건과 기한은 무엇인가

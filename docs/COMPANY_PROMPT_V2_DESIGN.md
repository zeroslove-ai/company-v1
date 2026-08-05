# Company Prompt v2 Design

작성 기준: 2026-08-05  
기준 문서:
- `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`
- `docs/COMPANY_PROMPT_UX_AUDIT_V1.md`

## 1. 목적

Prompt v2는 구형 Hospital/Dify 프롬프트를 복사하지 않는다. 과거 사용자 경험을 만든 규칙만 추출해 Company의 현재 권위 구조에 결합한다.

유지할 현재 강점:
- Story 1회 + Extract 1회
- Story parser 권위
- guarded merge와 Commit 권위
- 플레이어 입력은 시도이며 결과 확정이 아님
- active character canon 권위
- 상태 변화의 Story evidence
- Mind Monitor는 `surface/subconscious` 두 필드만 사용
- `physical_reaction` 재도입 금지

복원할 UX:
- 직전 질문·대사·행동이 이어지는 대화 연속성
- NPC가 자기 업무와 성격에 따라 먼저 움직이는 느낌
- 회사가 실제 업무 공간처럼 느껴지는 생활감
- 다인 장면에서 NPC끼리도 반응하는 대화
- 캐릭터마다 다른 Mind Monitor 문체
- 서로 다른 플레이 방향을 제공하는 네 선택지

## 2. 프롬프트 조립 구조

### 2.1 Story

Story 메시지는 다음 순서로 조립한다.

1. 고정 출력·자유도·권위 계약
2. 대화와 장면 진행 규칙
3. 선택지 방향 다양성 규칙
4. 현재 player/scene/time/CSA 상태
5. 최근 3턴의 `player_action + turn_summary`
6. 직전 턴 상세 연속성
   - 서사 끝부분
   - 마지막 실제 NPC 대사 최대 6줄
   - 직전 선택지 전문
7. 활성 NPC canon
8. 사용자 피드백 재생성 지시(해당 시)
9. 최종 canon 권위 재주입

직전 상세 블록은 과도한 토큰 사용을 막기 위해 다음 상한을 둔다.
- 서사 끝부분: 최대 1,800자
- 대사: 최대 6줄
- 선택지: 최대 4개
- 오직 직전 턴만 상세 전달

### 2.2 Extract

Extract 입력은 다음을 포함한다.

- Story 원문
- parser projection
- 현재 scene/time/CSA/active NPC state
- stable registered character id/name
- 활성 NPC compact canon

compact canon 예시:

```json
{
  "heroine3": {
    "name": "김제나",
    "position": "선임",
    "role_title": "...",
    "speech_style": "...",
    "core_traits": ["..."],
    "work_motive": "...",
    "private_tension": "...",
    "addressing": "..."
  }
}
```

실제 `prompt_card`에 없는 키는 만들지 않는다. 알려진 키를 선별하고, 구조가 다른 값은 짧은 문자열·배열·객체 범위에서 보존한다.

## 3. Story UX 계약

### 3.1 대화 연속성

- 직전 턴에 질문이 끝났으면 현재 턴에서 그 질문에 실제로 답하거나 회피·보류한 이유를 보여준다.
- 직전 대사의 말투·약속·결정·놓인 물건·현재 자세를 무시하고 장면을 재시작하지 않는다.
- `turn_summary`보다 직전 실제 대사와 서사 끝부분이 구체적 연속성에서 우선한다.
- 같은 설명을 다시 처음부터 반복하지 않는다.

### 3.2 NPC 자율성

- 관련 NPC는 플레이어의 입력에만 수동 반응하지 않는다.
- 장면당 최소 한 명은 자기 업무·목적·성격에 따른 작은 행동을 한다.
- 문서, 모니터, 메신저, 전화, 일정, 회의실, 자리 이동처럼 현재 회사 장면에 맞는 행동을 사용한다.
- 자율 행동은 플레이어가 입력하지 않은 플레이어 행동을 대신 수행하거나 강제하지 않는다.
- 큰 사건이 필요하지 않은 턴에는 작은 업무 진행이나 주변 변화 하나면 충분하다.

### 3.3 대화 기능

NPC 발언을 횟수만 채우지 않는다.

- 첫 기능: 즉각 반응·질문·확인
- 중간 기능: 새 정보·조건·반론·감정 변화
- 마지막 기능: 결정·행동 시작·다음 쟁점

다인 장면에서는 가능할 때 NPC끼리도 최소 한 번 서로의 말이나 행동에 반응한다.

### 3.4 관계 의미 분리

- 업무 협조는 호감 상승의 증거가 아니다.
- 직급상 지시는 사적 복종이 아니다.
- CSA 수용은 애정·성적 동의가 아니다.
- 친절과 친밀감, 흥분과 수용, 거절과 적대감을 자동으로 동일시하지 않는다.
- NPC는 같은 행동에 대해 업무상 수용과 개인적 불편을 동시에 보일 수 있다.

### 3.5 선택지 방향 다양성

전문 4개와 짧은 라벨 4개 계약은 유지한다.

상황에 맞는 다음 방향 중 최소 3종을 포함한다.
- 업무 진행·문제 해결
- 관계·감정 확인
- 주변 탐색·다른 인물 또는 장소 활용
- 경계 설정·거절·중단
- 직접 제안·새 행동
- 현재 행동 유지·관찰

네 선택지는 다른 결과를 보장하지 않고, 서로 다른 의도와 접근 방식을 제공한다.

## 4. Mind Monitor 해석 계약

Mind Monitor는 상태 patch와 동일한 exact-quote 규칙을 적용하지 않는다.

- 상태·수치·자세·위치 변화: exact Story evidence 필수
- `surface/subconscious`: Story의 대사·행동, compact character canon, 저장된 관계·감정 상태를 근거로 해석 가능
- Story에 없는 사건, 기억, 합의, 접촉을 새로 만들 수 없음
- `surface`: NPC가 스스로 인정하는 현재 판단과 목적
- `subconscious`: 말로 인정하지 않는 욕구·불안·질투·자기합리화
- 두 필드는 같은 내용을 어휘만 바꿔 반복하지 않음
- 인물의 말투·가치관·업무 동기를 반영
- `physical_reaction`, 신체반응, 행동반응 필드 금지

## 5. Opening 계약

Opening은 다음 세 가지를 한 번에 성립시킨다.

1. 장소를 인식시키는 감각적·업무적 디테일
2. 핵심 NPC의 첫인상을 성격과 업무 행동으로 제시
3. 플레이어가 선택할 수 있도록 장면을 열어둠

NPC는 단순 자기소개만 하지 않고 현재 업무를 수행하거나 문제를 처리하면서 플레이어를 맞는다. 플레이어가 입력하지 않은 대사·행동은 완료하지 않는다.

## 6. 이번 구현 범위

### 포함
- 직전 턴 detailed continuity projection
- 활성 NPC compact canon for Extract
- Story/Opening의 자율성·대화 기능·선택지 다양성 문구
- Mind Monitor 해석 evidence 분리
- prompt projection 회귀 테스트
- 프롬프트 크기 상한 테스트 유지

### 제외
- 추가 LLM 호출
- DB migration 또는 새 저장 컬럼
- 주변 NPC 자동 등장 로직
- 새로운 확률·위험도·bold choice
- Hospital runtime 의존
- `physical_reaction`

주변 NPC roster는 실제 Company 저장 데이터에서 위치·근무 상태를 안정적으로 판정할 수 있는지 별도 확인 후 진행한다.

## 7. 검증 시나리오

1. 직전 NPC 질문에 이어 답하는 턴
2. 직전 대사 말투와 약속 유지
3. 정적인 보고서 검토 장면에서 NPC의 작은 자율 업무 행동
4. 두 NPC가 서로의 발언에 반응하는 회의
5. 업무상 협조와 개인 감정 분리
6. CSA 수용과 개인적 불편 동시 표현
7. 네 선택지가 최소 세 방향으로 분산
8. 같은 Story에서 캐릭터별 Mind Monitor 문체 차이
9. 자세·위치는 exact evidence 없으면 변경되지 않음
10. Prompt v2가 기존 token/character budget을 초과하지 않음

# Company Prompt v2 Phase 2 — Workplace World Context

작성 기준: 2026-08-05  
기준 SHA: `9ca1fa497669b13bb99ed81b1e436fdf6d23ba59`

관련 문서:
- `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`
- `docs/COMPANY_PROMPT_UX_AUDIT_V1.md`
- `docs/COMPANY_PROMPT_V2_DESIGN.md`

## 1. 목적

Prompt v2 2차는 회사가 현재 인물만 존재하는 빈 공간처럼 보이는 문제를 줄인다.

추가하는 경험:
- 현재 장소에 맞는 업무 환경 정보
- 저장 위치 또는 지도 기본 배치에 근거한 일반 NPC의 제한적 진입
- `scene_goal`과 `focus_thread`가 매 턴 실제로 조금씩 진행되는 장면
- 여러 NPC가 같은 의견을 반복하지 않고 서로 반응하는 대화
- 장면 목표를 진행하는 선택지와 다른 방향을 여는 선택지의 공존

## 2. 권위와 안전 경계

### 2.1 일반 NPC 사실 기준

일반 NPC 정보는 다음 두 정본만 사용한다.

- `content/general_npcs.json`
- `content/map.json`

Story에 전달되는 일반 NPC 정보는 이름, 성별, 나이, 역할, 부서, 소속 유형으로 제한한다. 캐릭터 설정이나 과거를 임의로 추가하지 않는다.

### 2.2 현재 인물과 진입 후보의 구분

- `active_general_npc_canon`: 플레이어 입력, 현재 장면 참여자, 직전 화자 또는 직전 등장 인물로 확인된 일반 NPC
- `context.workplace.eligible_nearby_npcs`: 현재 장소에 들어올 수 있는 후보
- 후보는 **이미 현장에 있다는 증거가 아니다**
- Story가 노크, 호출, 이동, 입장, 발언 등 실제 진입을 서술해야만 Extract가 `npcs_present`에 포함할 수 있다

### 2.3 후보 선정 근거

현재 위치의 후보는 다음 순서로 결정한다.

1. `npc_scene_state[npc_id].location_id`가 현재 `scene_state.location_id`와 같은 NPC
2. 현재 지도 위치의 `default_npc_ids`
3. 저장된 위치가 다른 장소로 명시된 NPC는 지도 기본 배치와 충돌하므로 제외
4. 현재 활성 인물은 후보 목록에서 제외
5. 후보는 최대 2명
6. Story가 한 턴에 새로 진입시킬 수 있는 후보는 최대 1명

후보 선정은 순수 함수이며 DB를 쓰지 않는다.

## 3. 장면 진행 계약

각 일반 턴은 `scene_goal` 또는 `focus_thread`를 다음 중 하나로 한 단계 움직인다.

- 질문이나 쟁점에 답한다
- 업무를 실제로 진행한다
- 새로운 조건이나 반론으로 복잡하게 만든다
- 결정을 내리거나 다음 쟁점을 명확히 한다

큰 사건을 강제로 만들 필요는 없다. 문서 수정, 일정 확인, 상사의 호출, 다른 부서의 확인 요청처럼 현재 위치와 업무에 맞는 작은 진행이면 충분하다.

## 4. 다인 대화 계약

- 첫 발언, 중간 발언, 마지막 발언이 서로 다른 기능을 담당한다
- 여러 NPC가 모두 플레이어에게만 같은 의견을 반복하지 않는다
- 가능하면 NPC끼리 최소 한 번 직접 반응한다
- 직급과 부서 차이가 의견, 말투, 정보 범위에 자연스럽게 반영된다
- 업무상 협조와 개인 감정, CSA 수용과 사적 동의는 계속 분리한다

## 5. 선택지 계약

네 선택지는 기존 형식을 유지한다.

- 최소 세 가지 접근 방향
- 최소 한 개는 `scene_goal`을 직접 진행
- 최소 한 개는 관계 확인, 탐색, 경계 설정, 관찰 등 다른 방향을 개방
- 같은 대상과 동사를 표현만 바꿔 반복하지 않음
- 결과는 선확정하지 않음

## 6. Extract 계약

Extract에는 다음이 추가된다.

- `registered_general_npcs`
- `active_general_npc_canon`
- 활성 일반 NPC의 기존 mutable state projection

다음은 금지된다.

- 지도 기본 배치만으로 현재 등장 판정
- 후보 목록만으로 `npcs_present` 추가
- Story에 없는 진입, 발언, 행동 생성
- 일반 NPC를 연애 대상이나 상세 캐릭터로 자동 확장
- `physical_reaction` 또는 새 신체 반응 필드

## 7. 구현 범위

포함:
- deterministic workplace projection
- 일반 NPC compact registry/canon
- Story의 제한적 일반 NPC 진입 허용
- scene goal 진행 규칙
- 다인 대화와 선택지 방향 규칙 강화
- Extract의 일반 NPC identity/presence 방어
- 회귀 테스트

제외:
- 추가 LLM 호출
- DB migration 또는 저장 컬럼 추가
- 일반 NPC별 새 prompt card
- 자동 이벤트 스케줄러
- 확률·위험도·bold choice
- Hospital 코드 의존
- Worker 배포

## 8. 수동 검증 포인트

사용자 플레이 검증에서는 다음만 확인한다.

1. 일반 NPC가 이유 없이 매 턴 난입하지 않는가
2. 들어올 때 노크·호출·이동 등 진입 과정이 보이는가
3. 지도 후보가 이미 현장 인물처럼 취급되지 않는가
4. 현재 업무 목표가 매 턴 조금이라도 움직이는가
5. 다인 장면에서 NPC들이 같은 말을 반복하지 않는가
6. 네 선택지 중 업무 진행과 다른 방향이 함께 존재하는가
7. 일반 NPC 이름·직책·부서가 정본과 일치하는가

# Company Prompt UX Audit v1

작성 기준: 2026-08-05  
적용 프로젝트: `zeroslove-ai/company-v1`  
관련 제품 계약: `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`

## 1. 목적

현재 Company v1 프롬프트는 상태 권위, 플레이어 자유도, 출력 파싱, LLM 호출 수 제한에는 강하다. 그러나 병원편과 구형 게임빌더에서 사용자가 체감했던 다음 요소가 충분히 재현되는지는 별도 검증이 필요하다.

- NPC가 자기 목적과 성격에 따라 먼저 반응하고 움직이는 느낌
- 대사가 단순 정보 전달이 아니라 서로 이어지는 느낌
- 회사가 정지된 배경이 아니라 여러 사람이 일하는 공간처럼 느껴지는 생활감
- 직전 대화와 감정이 다음 턴에 자연스럽게 이어지는 연속성
- 업무 협조, 개인 감정, CSA 수용, 사적 친밀감이 구별되는 반응
- 캐릭터마다 다른 Mind Monitor 문체와 자기합리화
- 네 선택지가 같은 행동의 표현만 바꾼 것이 아니라 서로 다른 플레이 방향을 제공하는 경험

이 문서는 구형 프롬프트 전문을 복사하기 위한 문서가 아니다. 과거 UX를 만든 행동 규칙을 추출하고, Company의 현재 엔진 계약과 결합한 Prompt v2를 설계하기 위한 감사 기준이다.

---

## 2. 비교 대상

### A. 현재 Company v1

- `src/engine/story-prompt.js`
- `src/engine/opening-prompt.js`
- `src/engine/extract-prompt.js`
- `src/engine/gameplay-state.js`
- Company 캐릭터 `prompt_card`, world/scene/work/relationship 상태

### B. 최신 Hospital CSA-only donor

- `zeroslove-ai/py-all/worker/game-proxy-v2.js`
- 동적 Story 보강 섹션
  - relevant NPC canon
  - CSA epistemic firewall
  - physical transition continuity
  - regeneration feedback
  - choice/agency 보강
- 최신 Hospital 계약·회귀 테스트

### C. 구형 Dify UX donor

- `zeroslove-ai/py-all/v1/dify/yml/게임빌더_v64.yml`
- v65 계열 Extract 문서
- 과거 rulebook/display/narrative/memory 입력 구조

구형 문서의 최면·개인 암시·확률·physical reaction은 Company로 가져오지 않는다. UX 생성에 기여한 서사 규칙만 분석한다.

---

## 3. 현재 Company 프롬프트의 강점

### 3.1 상태와 책임 경계

- Story는 서사, Extract는 구조화, Worker는 검증·병합을 담당한다.
- Story 선택지와 parser 대사가 권위값이다.
- 플레이어 입력을 결과 확정이 아닌 시도로 취급한다.
- 입력하지 않은 플레이어 행동을 대신 완료하지 않는다.
- 업무 협조·CSA 수용·친밀감·성적 반응을 동일시하지 않는다.
- active character canon을 최종 권위로 재주입한다.
- 정상 턴 Story 1회 + Extract 1회라는 비용 계약을 유지한다.

### 3.2 형식 안정성

- 네 섹션 출력이 명확하다.
- 대사 포맷과 선택지 라벨 포맷이 고정돼 있다.
- Extract가 parser의 대사·선택지를 덮어쓰지 않는다.
- 상태 변화에 Story evidence를 요구한다.
- Mind Monitor는 `surface/subconscious` 두 필드만 허용한다.

이 강점은 Prompt v2에서도 그대로 유지한다.

---

## 4. 현재 확인된 UX 위험

### 4.1 직전 장면의 실제 문장이 Story에 전달되지 않는다 — 최고 위험

현재 Story context의 `recent_turns`는 최근 3턴의 다음 정보만 전달한다.

```json
{
  "turn": 3,
  "player_action": "...",
  "turn_summary": "..."
}
```

직전 `story_text`, 실제 대사, 연기지시, 플레이어 속마음은 전달되지 않는다. 따라서 다음 턴의 모델은 다음을 정확히 이어가기 어렵다.

- 마지막 질문의 정확한 문장
- 누가 어떤 말투로 무엇을 약속했는지
- 직전 대사의 미묘한 감정
- 물건을 어디에 두었는지 같은 미세한 연속성
- 대화 중 끊긴 문맥

구형 Dify는 짧더라도 대화 memory window에 실제 응답 전문이 있었고, Hospital donor도 recent memory/canon/동적 보강을 더 풍부하게 사용했다. 현재 Company는 토큰 절약 과정에서 서사 연속성의 핵심 재료까지 제거한 상태다.

### 4.2 회사 세계관과 조직 생활 정보가 Story 입력에서 거의 빠져 있다

현재 Story user payload는 player, scene/time, active NPC 상태, summary, active character canon 중심이다. 다음 정보가 항상 포함되지 않는다.

- 회사의 기본 업종·규모·문화
- 부서별 역할과 실제 업무 관계
- 현재 프로젝트와 마감
- 상사·동료 간 보고 체계
- 장소별 일상 행동과 주변 소음
- 현 장면 근처에서 등장 가능한 일반 NPC
- 장면 밖에서 동시에 진행되는 업무

결과적으로 회사는 캐릭터 둘만 있는 빈 방처럼 쓰일 위험이 있다.

### 4.3 새 NPC의 자연스러운 진입이 구조적으로 어렵다

`selectActiveCharacterIds()`는 주로 다음만 선택한다.

1. 플레이어 입력에 정확한 이름이 나온 NPC
2. focal character
3. last speaker
4. 현재 scene participants

Story에는 `context에 없는 NPC나 장면을 새로 만들지 않는다`는 금지까지 있다. 이 조합은 환각 방지에는 좋지만, 이미 등록된 동료가 업무 때문에 들어오거나 주변 직원이 짧게 반응하는 살아 있는 세계도 막는다.

Prompt v2에서는 미등록 NPC 창작은 계속 금지하되, **서버가 선별한 eligible nearby NPC roster** 안에서는 자연스러운 진입을 허용해야 한다.

### 4.4 캐릭터 canon은 사실 검증에는 쓰이지만 행동 생성 규칙으로 충분히 쓰이지 않는다

현재 `active_character_canon`은 이름·직급·prompt_card를 제공한다. Story 프롬프트는 이를 바꾸지 말라고 명령하지만 다음은 명시적으로 요구하지 않는다.

- 이 인물이 지금 원하는 것
- 불편할 때 어떻게 돌려 말하는지
- 업무상 태도와 사적 태도의 차이
- 상대에 따라 바뀌는 호칭·거리감
- 먼저 시작할 수 있는 작은 행동
- 갈등을 회피·정면돌파·농담으로 넘기는 성향

즉 canon이 `오류 방지 데이터`로는 작동하지만 `장면을 움직이는 동력`으로는 약하다.

### 4.5 NPC 자율성과 장면 생활감 규칙이 부족하다

현재 Story는 `즉각 반응 → 전개 → 추가 정보·행동 → 결과`를 요구하지만, NPC가 플레이어를 기다리지 않고 할 수 있는 행동의 범위가 정의돼 있지 않다.

필요한 규칙:

- 장면당 관련 NPC 1명 이상은 자기 업무·목적에 따른 행동을 한다.
- 대사만 연속하지 말고 문서, 모니터, 전화, 메신저, 회의실, 커피, 이동 등 현재 장소의 실제 행동을 섞는다.
- 큰 사건을 강제로 만들 필요는 없지만, 정적인 턴에는 한 가지 작은 외부 변화나 업무 진행을 허용한다.
- NPC 자율 행동은 플레이어 행동을 대신하거나 플레이어를 강제하지 않는다.

### 4.6 대화 횟수는 있으나 대화 구조 규칙이 약하다

현재 의미 있는 NPC 발언 3회 이상을 목표로 하지만, 횟수만으로는 다음 문제가 남는다.

- 같은 내용을 세 번 풀어 말함
- 질문과 답변이 맞물리지 않음
- NPC 둘이 각자 플레이어에게만 말하고 서로 반응하지 않음
- 발언 사이에 실제 행동이나 판단 변화가 없음

Prompt v2는 발언 수보다 `대화 기능`을 요구해야 한다.

- 첫 발언: 즉각 반응 또는 질문
- 중간 발언: 새 정보·조건·반론·감정 변화
- 마지막 발언: 결정·행동 시작·다음 쟁점

다인 장면에서는 NPC끼리도 최소 한 번 서로의 말이나 행동에 반응하게 한다.

### 4.7 선택지의 형식은 좋아졌지만 방향 다양성 계약이 없다

현재는 네 개가 서로 다른 핵심 행동이어야 한다고만 되어 있다. 모델은 다음처럼 비슷한 네 선택지를 만들 수 있다.

- 보고서를 본다
- 보고서를 자세히 본다
- 보고서 내용을 묻는다
- 보고서를 함께 검토한다

확률·과감 선택지 체계는 되살리지 않는다. 대신 상황에 맞을 때 다음 플레이 방향 중 최소 3종을 포함하도록 한다.

- 업무 진행·문제 해결
- 관계·감정 확인
- 주변 탐색·다른 인물/장소 활용
- 경계 설정·거절·중단
- 직접 제안·새 행동
- 현재 행동 유지·관찰

각 선택지는 다른 결과를 보장하는 문장이 아니라 다른 **의도와 접근 방식**을 제공해야 한다.

### 4.8 Mind Monitor 생성 입력에 캐릭터 성격 canon이 없다 — 최고 위험

현재 Extract는 다음을 받는다.

- story text
- parser 결과
- active NPC 상태
- 등록 캐릭터 id/name 목록

하지만 캐릭터 `prompt_card`, 말투, 핵심 성격, 가치관은 받지 않는다. Extract는 150–350자의 1인칭 내면을 요구받으면서 인물별 문체를 만들 근거가 부족하다. 결과적으로 모두 비슷한 자기합리화 문장으로 수렴할 수 있다.

Prompt v2 Extract에는 전체 master가 아니라 다음의 compact canon을 추가해야 한다.

```json
{
  "heroine3": {
    "name": "김제나",
    "speech_style": "...",
    "core_traits": ["..."],
    "work_motive": "...",
    "private_tension": "...",
    "addressing": "..."
  }
}
```

### 4.9 Extract의 evidence 원칙과 subconscious 생성이 충돌한다

Extract는 모든 제안을 Story evidence에 근거하라고 요구하면서, 동시에 Story에 직접 쓰이지 않은 `subconscious`를 생성해야 한다. 이를 문자 그대로 적용하면 잠재의식이 Story의 표면 행동을 길게 바꿔 말하는 수준으로 평평해진다.

Prompt v2에서는 두 증거 수준을 구분해야 한다.

- 상태·수치·물리 변화: exact Story quote 필수
- Mind Monitor: Story의 행동·대사 + compact character canon + 저장된 관계/감정에서 해석 가능하되, 사건 사실을 새로 만들 수 없음

### 4.10 Opening은 계약은 명확하지만 첫인상 연출 규칙이 약하다

현재 Opening은 시간·장소·업무 계기·인물을 정확히 지키는 데 집중한다. 그러나 다음이 부족하다.

- 장소를 한 번에 인식시키는 감각적 디테일
- 주요 NPC의 첫 행동과 첫인상
- 회사에서 플레이어가 당장 해야 할 구체적 업무
- 두세 턴 이어질 작은 갈등 또는 목표
- 첫 선택지 네 개가 서로 다른 방향을 여는 구조

이 때문에 오프닝이 `출근했다 → 인사했다 → 선택지` 수준으로 평범해질 수 있다.

---

## 5. Prompt v2 구조

하나의 거대한 system prompt로 되돌아가지 않는다. 고정 core와 조건부 모듈을 조립한다.

### 5.1 Story prompt stack

```text
1. Core invariants
2. Output contract
3. Narrative director module
4. Player agency module
5. Company world/work module
6. Active character canon + motive projection
7. Recent scene continuity packet
8. Relationship/voice module
9. Conditional CSA module
10. Conditional physical/intimacy continuity module
11. Conditional multi-NPC/living-world module
12. Feedback regeneration module
13. Final authoritative canon reminder
```

### 5.2 Core invariants

- 플레이어 입력은 시도다.
- 플레이어가 입력하지 않은 행동을 대신 완료하지 않는다.
- NPC는 자기 성격·관계·업무 목적에 따라 수용·거절·조건부 수용·유예할 수 있다.
- 업무 협조, 규정 준수, 개인적 호감, 친밀감, 성적 반응은 별개다.
- state에 없는 확정 사실은 만들지 않는다.
- 등록되지 않은 NPC를 만들지 않는다.

### 5.3 Narrative director module

- 매 턴 `즉시 반응 → 상호작용 → 변화 → 구체적 종료점`을 만든다.
- 모든 문단이 장면을 진행시켜야 한다.
- 최소 한 가지는 턴 시작과 끝 사이에 달라져야 한다: 정보, 결정, 위치, 업무 단계, 감정 표현, 관계의 이해, 다음 목표.
- 단, 저장 상태 변화 여부는 Extract/Worker가 결정한다.
- 서술·대사·실제 행동을 교차한다.
- 같은 감정·설명을 반복하지 않는다.

### 5.4 Recent scene continuity packet

토큰을 통제하면서 직전 장면 전문을 일부 복원한다.

```json
{
  "previous_turn": {
    "player_action": "...",
    "story_tail": "직전 서사의 마지막 1200~1800자",
    "dialogue_lines": ["마지막 4~8줄"],
    "player_inner_thought": "...",
    "turn_summary": "..."
  },
  "older_turns": [
    {"player_action":"...","turn_summary":"..."},
    {"player_action":"...","turn_summary":"..."}
  ]
}
```

- 직전 턴만 실제 문장과 대사를 준다.
- 그 이전은 요약만 준다.
- 전체 무제한 history는 주지 않는다.

### 5.5 Company world/work module

매 턴 전체 설정을 넣지 않고 현재 장면에 필요한 정보만 projection한다.

- 회사 기본 정체성
- 현재 부서·장소의 기능
- 현재 업무 hook와 마감/진행 단계
- 현 장면과 관계있는 조직 관계
- 등장 가능한 nearby NPC 최대 2명
- 현재 장소에서 자연스러운 소도구·행동 목록

### 5.6 Character motive projection

각 active NPC에 다음 compact projection을 제공한다.

```json
{
  "identity": {},
  "voice": {},
  "current_motive": "",
  "work_stance": "",
  "private_stance": "",
  "boundary": "",
  "relationship_memory": [],
  "allowed_initiatives": []
}
```

`allowed_initiatives`는 모델이 임의 생성하지 않고 prompt_card와 현재 업무 상태에서 서버가 결정적으로 구성한다.

### 5.7 Living-world module

조건:

- 일반 업무 턴
- 장면이 지나치게 정적
- nearby eligible NPC가 존재

규칙:

- 관련 있는 작은 사건 하나를 허용한다.
- 새 사건은 현재 목표를 방해하거나 보조할 수 있지만 장면을 탈선시키지 않는다.
- 주변 NPC의 짧은 반응은 가능하다.
- 플레이어의 의사결정을 빼앗지 않는다.
- 매 턴 억지 사건을 만들지 않는다.

### 5.8 Choice module

- 정확히 4개
- 라벨 + 전문
- 서로 다른 접근 의도 최소 3종
- 현재 장면에서 바로 가능한 행동
- 플레이어가 이미 한 행동 반복 금지
- 결과 선확정 금지
- 앱 진입은 별도 UI이므로 선택지에 포함하지 않음

### 5.9 Extract v2

- parser authority 유지
- physical/body reaction 필드 금지 유지
- compact character canon 추가
- Mind Monitor는 사실 창작 금지, 해석 허용
- 상태·물리 변화에는 exact quote 요구
- `surface/subconscious` 문체가 character voice와 일치하는지 요구
- 직전 monitor의 동일 문장 반복을 피할 수 있도록 이전 monitor를 active NPC별로 전달

### 5.10 Opening v2

- 첫 2–3턴의 업무 hook를 한 문장으로 설정
- 장소를 식별시키는 구체적 디테일 2개
- 주요 NPC가 먼저 하는 행동 1개
- 플레이어가 즉시 대응해야 할 업무/관계 질문 1개
- supporting NPC는 정보 전달용으로만 서 있지 않고 자기 업무를 수행
- 선택지 4개는 업무·관계·탐색·직접 제안 중 최소 3종

---

## 6. 과거 프롬프트에서 가져올 것과 버릴 것

### 가져올 것

- 직전 실제 대사를 기억하는 구조
- 캐릭터별 말투와 자기합리화
- 응답 종료 전 핵심 항목 자기검증
- 장면 속 실제 행동과 대사를 섞는 지시
- 출력 형식의 명확성
- 최근 기억과 장기 요약의 역할 분리
- 조건부 동적 보강 섹션

### 가져오지 않을 것

- full master/save/history 무제한 주입
- 동일 규칙의 여러 문서·프롬프트 중복
- `physical_reaction`
- 최면·개인 암시
- 확률/난이도/bold choice
- 앱 정보 보기를 선택지 마지막에 강제
- LLM이 수치·성공률·상태를 최종 확정하는 구조
- 본문에 상태판·Mind Monitor를 중복 출력하는 구형 UI 계약

---

## 7. 비교 평가 방식

프롬프트를 읽고 느낌으로 교체하지 않는다. 동일 fixture로 A/B 비교한다.

### 7.1 후보

- A: 현재 Company prompt
- B: 현재 prompt + continuity/canon input만 보강
- C: Company Prompt v2 전체 모듈

구형 Hospital/Dify 프롬프트는 직접 후보로 배포하지 않고 규칙 donor로만 사용한다.

### 7.2 Golden turn suite

최소 다음 12개 fixture를 만든다.

1. 평범한 업무 질문
2. NPC가 거절하거나 조건을 붙여야 하는 요청
3. 플레이어가 직전 질문에 답하는 연속 대화
4. 여러 NPC가 있는 회의
5. 다른 NPC에게 갑자기 말을 거는 전환
6. 정적인 사무실 장면의 작은 자율 사건
7. 업무 협조와 개인 호감을 구별해야 하는 턴
8. CSA 수용과 개인 불편을 동시에 표현해야 하는 턴
9. CSA 해제 후 물리 자세는 유지되는 턴
10. 자세·복장·위치 연속성 턴
11. 피드백 재생성 턴
12. 오프닝

### 7.3 채점 축

각 1–5점:

- 캐릭터 목소리 구별
- 직전 대화 연속성
- NPC 자율성
- 회사 생활감
- 장면 진행도
- 플레이어 자유도
- 감정·업무·CSA 의미 분리
- 선택지 방향 다양성
- Mind Monitor 인물성
- 상태 계약 정확성
- 반복·장황함
- 토큰 비용

### 7.4 통과 조건

- 상태 정확성은 현재 A보다 낮아지면 안 됨
- 플레이어 자유도 위반 0건
- 미등록 NPC 창작 0건
- `physical_reaction` 0건
- 평균 UX 항목이 A보다 명확히 개선
- prompt input/output 토큰 예산을 정해진 상한 안에 유지

---

## 8. 구현 순서

### Prompt Audit 0 — 자료 추출

- 최신 Hospital 동적 prompt section 목록화
- Dify v64/v65 Story·Extract 행동 규칙 목록화
- Company 현재 prompt와 입력 projection 목록화

### Prompt Audit 1 — Golden fixtures

- 실제 Company save shape 기반 fixture 작성
- 현재 prompt baseline 결과 저장
- 사용자 체감 기준을 평가표에 반영

### Prompt v2-A — 입력 보강만

- previous story tail/dialogue packet
- compact company/world packet
- compact Extract character canon
- 이전 Mind Monitor

이 단계는 출력 규칙을 크게 바꾸지 않고 입력 부족 문제만 검증한다.

### Prompt v2-B — Narrative director

- NPC initiative
- dialogue function
- living world
- choice diversity
- opening hook

### Prompt v2-C — 조건부 모듈

- CSA reaction
- multi-NPC
- physical/intimacy continuity
- feedback regeneration

### Prompt v2-D — A/B 결과 확정

- golden suite 평가
- prompt size budget
- 회귀 테스트
- 별도 PR

---

## 9. 배포 원칙

- 현재 Runtime/UI PR과 Prompt v2 구현을 섞어 한 번에 배포하지 않는다.
- Prompt Audit 문서·fixture는 먼저 만들 수 있다.
- Prompt 변경은 별도 branch/PR로 진행한다.
- 실제 Company 테스트 게임에서 최소 오프닝 + 일반 3턴 + CSA 2턴 + 다인 장면 1턴을 확인한 뒤 배포한다.
- Hospital Worker, Hospital Supabase, Hospital 게임 데이터는 읽기 donor 외 변경하지 않는다.

---

## 10. 현재 결론

현재 Company 프롬프트가 예전 UX를 충분히 재현하기 어렵다는 우려는 타당하다. 가장 큰 원인은 프롬프트 문장의 짧음 자체가 아니라 다음 세 가지다.

1. 직전 실제 서사·대사가 Story 입력에서 제거됨
2. 회사 세계·업무·등장 가능 NPC 정보가 과도하게 축약됨
3. Extract가 캐릭터 성격 canon 없이 Mind Monitor를 작성함

따라서 우선순위는 프롬프트를 다시 거대하게 만드는 것이 아니라 **입력 projection을 풍부하게 만들고, 그 위에 짧은 narrative director 모듈을 얹는 것**이다.

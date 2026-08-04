# Company Runtime & UI Product Contract v1

작성 기준: 2026-08-05  
적용 프로젝트: `zeroslove-ai/company-v1`  
기준 SHA: `cca7501242dcb658c84cd08177bda2caf1f21855`

이 문서는 Company v1의 런타임·상태·미디어·모바일 UI를 앞으로 수정할 때 사용하는 제품 정본이다. 기능을 병원편에서 참고할 수는 있지만, 병원편 구조를 그대로 복제하지 않는다. Company v1에서 이미 확정된 삭제·제외 결정과 현재 Company 엔진 계약이 항상 우선한다.

---

## 1. 권위 순서

설계나 코드가 충돌할 때 아래 순서로 판단한다.

1. 사용자가 Company v1에 대해 명시적으로 확정한 최신 결정
2. 이 문서와 최신 Company 계약 문서
3. 현재 Company 코드·테스트·Supabase 실제 데이터
4. 최신 세션 인수인계서
5. 병원편 활성 코드와 운영 로그 — 기능 donor로만 사용
6. 구형 v1/v2 문서 — 역사적 참고만 허용

구형 문서나 병원편에 존재한다는 이유만으로 Company에 기능을 되살리지 않는다.

---

## 2. 절대 고정 원칙

### 2.1 런타임 파이프라인

```text
Player action
→ Story 1회
→ Story parser
→ Extract 1회
→ guarded merge
→ Commit
→ Context reload
→ Company view model
→ UI
```

- 정상 턴의 LLM 호출은 Story 1회 + Extract 1회다.
- 별도 선택지 요약 LLM, 요약 전용 LLM, 이미지 선택 LLM, Mind Monitor 전용 LLM은 추가하지 않는다.
- action idempotency, pending recovery, parser authority, guarded merge, Commit authority를 유지한다.
- UI는 raw save를 임의로 읽지 않고 Company view model만 소비한다.

### 2.2 Company에서 제외된 기능

다음은 다시 넣지 않는다.

- `physical_reaction`, 신체반응, 행동반응을 Mind Monitor의 제3필드로 표시하는 구조
- hypnosis, 개인 암시, active suggestions
- bold choice, success rate, probability roll, risk UI
- Story·Extract 외 2차 narrative-integrity LLM
- summary 전용 LLM
- 병원편 Supabase·게임 Worker·프론트 Worker 의존
- 레거시 `/api/save-turn`, `/api/set-save`

### 2.3 의미 규칙

- 플레이어 입력은 시도이며 결과 확정이 아니다.
- 업무 협조는 호감이 아니다.
- 직급 수행은 사적 복종이 아니다.
- CSA 수용은 애정·동의가 아니다.
- 성적 사건은 자동 연애 단계 상승이 아니다.
- CSA 해제는 물리 자세를 마법처럼 원상복구하지 않는다.

---

## 3. Mind Monitor 정본

Mind Monitor는 Company UI의 핵심 정보이며 숨기거나 축소 대상이 아니다.

### 3.1 저장 계약

```json
{
  "heroine3": {
    "surface": "겉으로 스스로 인식하는 생각",
    "subconscious": "말로 인정하지 않는 잠재적 속마음"
  }
}
```

- NPC별 map 구조다.
- 허용 필드는 `surface`, `subconscious` 두 개뿐이다.
- `physical_reaction`, `body`, `physical`, `body_reaction`, `physical_action`, `신체반응` 계열은 금지한다.
- 플레이어 속마음은 Mind Monitor에 넣지 않는다.
- 현재 턴에 실제 등장한 NPC만 생성한다.
- 자연스러운 1인칭 한국어 독백으로 작성한다.
- CSA 시스템 용어·상태 라벨·키워드 나열을 금지한다.

### 3.2 현재 확인된 버그

Company DB에는 NPC별 `surface/subconscious`가 정상 저장돼 있다. 현재 UI는 NPC별 map 전체에서 최상위 `surface`를 찾기 때문에 제목만 렌더링되고 내용이 비어 있다. 이는 데이터 생성 실패가 아니라 프론트 projection 버그다.

### 3.3 UI 계약

- 이미지/TTS 바로 아래, 일반 상태판보다 먼저 표시한다.
- 기본 선택 NPC 순서:
  1. 현재 선택된 Mind Monitor 탭
  2. `image_character_id`
  3. `focal_character_id`
  4. `last_speaker_id`
  5. 현재 monitor map의 첫 NPC
- monitor가 두 명 이상이면 실제 인물명 탭을 표시한다.
- 선택된 인물의 `표면의식`, `잠재의식` 두 카드를 모두 표시한다.
- 데이터가 없는 턴에도 섹션 자체를 없애지 않는다. `이번 턴 Mind Monitor 정보가 없습니다`라는 명시적 빈 상태를 표시한다.
- 내부 ID는 사용자에게 노출하지 않는다.

### 3.4 품질 목표

기존 Company 계약의 길이 목표를 유지한다.

- `surface`: 150–300자
- `subconscious`: 180–350자

이 길이는 별도 LLM을 추가하는 방식이 아니라 기존 Extract 프롬프트를 명확히 하는 방식으로 맞춘다.

---

## 4. 선택지와 5글자 버튼 계약

### 4.1 권위값

- Story의 `[4. 선택지]` 전문 4개가 권위값이다.
- Extract는 Story가 정확히 4개를 생성한 경우 선택지를 덮어쓰지 않는다.
- 클릭·저장·Commit에는 항상 원문 전문을 사용한다.

### 4.2 현재 방식의 문제

현재 프론트는 정규식으로 원문을 추측해 `자료보기`, `업무집중`, `곁에앉기` 같은 라벨을 만든다. 이는 실제 선택지의 핵심 행동을 잘못 요약할 수 있으므로 정본 방식으로 사용하지 않는다.

### 4.3 새 Story 출력 계약

별도 LLM을 추가하지 않고 Story가 전문과 짧은 라벨을 동시에 생성한다.

Raw Story 형식:

```text
[4. 선택지]
1. [자료검토] 김제나가 가리키는 브랜드 포지셔닝 문구를 함께 살펴보고 의견을 말한다.
2. [의자가져오기] 무릎을 꿇고 있는 김제나 곁에 빈 의자를 가져다 놓는다.
3. [사례질문] 이메이에게 타깃 정렬을 해결했던 사례를 묻는다.
4. [자세배려] 김제나가 더 편한 자세를 취해도 된다고 말한다.
```

Parser 결과:

```json
{
  "choices": ["전문 1", "전문 2", "전문 3", "전문 4"],
  "choice_labels": ["자료검토", "의자가져오기", "사례질문", "자세배려"]
}
```

라벨 규칙:

- 2–5글자 권장, 최대 6글자
- 행동과 대상을 구별할 수 있어야 함
- 네 라벨은 서로 중복되면 안 됨
- 번호·확률·위험도·성공률을 포함하지 않음
- 전문을 대체하지 않음

### 4.4 저장과 복구

- `game_turns.choices`: 전문 4개
- `game_turns.parsed_blocks.choice_labels`: 라벨 4개
- `save.last_choices`: 전문 4개
- `save.last_choice_labels`: 라벨 4개, optional JSONB 필드
- opening도 `opening_state.choice_labels`를 보존한다.

기존 턴처럼 라벨이 없을 때만 원문 앞부분을 안전하게 자르는 표시 fallback을 사용한다. 의미를 추측하는 정규식 fallback은 제거한다.

### 4.5 UI 계약

- 서사 영역에는 전문 4개를 그대로 표시한다.
- 하단에는 한 줄 4버튼을 표시한다.
- 버튼에는 번호 + Story 라벨만 표시한다.
- `title`, `aria-label`, 클릭 payload는 전문 전체다.
- 390px·412px에서 줄바꿈과 가로 overflow가 없어야 한다.

---

## 5. TTS 정본

### 5.1 대사 데이터 계약

```json
{
  "speaker_id": "heroine3",
  "speaker_name": "김제나",
  "direction": "조심스럽게",
  "text": "대사 원문",
  "order": 4
}
```

- parser 대사 원문·순서·연기지시가 권위값이다.
- Extract는 parser가 해결하지 못한 `speaker_id`만 보강한다.
- 프론트는 `speaker_id`를 정본으로 읽고, 구형 `character_id`는 호환 fallback으로만 읽는다.
- 캐릭터 `voice_id`는 Company master에서 서버가 조회한다.

### 5.2 재생 대상

수동 `대사 재생`은 현재 턴의 최신 재생 가능한 NPC 대사 한 줄을 재생한다.

우선순위:

1. 현재 선택된 Mind Monitor 인물의 마지막 대사
2. 이미지 인물의 마지막 대사
3. focal character의 마지막 대사
4. 마지막 화자의 마지막 대사
5. 현재 턴의 마지막 NPC 대사

Narrator·player·voice_id 없는 인물은 제외한다.

### 5.3 TTS 토글 의미

- `TTS 사용 ON`: 새 Commit 이후 최신 재생 가능 대사를 자동재생할 수 있음
- `TTS 사용 OFF`: 자동 `/api/tts` 호출 0건
- 수동 `대사 재생`: ON/OFF와 무관하게 사용자가 눌렀을 때 재생

현재처럼 OFF 상태에서 수동 재생 버튼까지 비활성화하는 동작은 버그다.

### 5.4 모바일 오디오

사용자 클릭 핸들러 안에서 `Audio`를 먼저 생성·활성화한 뒤 네트워크 응답을 연결한다. 비동기 fetch 후 처음 `Audio.play()`를 호출해 모바일 브라우저 권한을 잃는 구조를 금지한다.

### 5.5 Worker 연결

Company API Worker는 병원 게임 Worker를 호출하지 않는다. 기존 독립 TTS Worker `fancy-dust-7f8c`를 Cloudflare Service Binding으로 호출한다.

```jsonc
"services": [
  { "binding": "TTS_WORKER", "service": "fancy-dust-7f8c" }
]
```

- same-zone Workers 간 일반 URL fetch는 사용하지 않는다.
- Company `/api/tts`가 Company master의 `voice_id`를 확인한다.
- TTS Worker 요청은 `{ text, voice_id, direction }`을 사용한다.
- TTS 실패는 Story/Extract/Commit을 실패시키지 않는다.
- 새 TTS Worker를 만들지 않고 기존 TTS 서비스도 수정하지 않는다.

---

## 6. 플레이어·NPC 물리 상태 계약

UI 문장만 꾸며서 자세를 추측하지 않는다. Extract와 저장 상태가 실제 상대 위치를 제공해야 한다.

### 6.1 저장 필드

기존 `player_scene_state`, `npc_scene_state[id]`를 유지한다.

```json
{
  "location_label": "브랜드전략팀 사무실",
  "posture": "standing",
  "position_label": "김제나 앞에 서서 그녀가 펼친 보고서를 내려다보고 있다",
  "clothing": {},
  "updated_turn": 4
}
```

NPC 예시:

```json
{
  "posture": "kneeling",
  "position_label": "플레이어 앞에 무릎을 꿇고 보고서를 무릎 위에 펼쳐 보이고 있다",
  "present": true,
  "updated_turn": 4
}
```

- `position_label`은 플레이어와 상대의 관계·방향·현재 행동을 포함한 짧은 장면 문장이다.
- 새 physical reaction 필드를 만들지 않는다.
- 위치·자세·관계 변화는 Story의 정확한 근거 문장이 있어야 한다.
- 자세 연속성은 유지되며, 실제 종료 이유 없이 턴이 바뀌었다는 이유만으로 초기화하지 않는다.

### 6.2 Extract 요구사항

장면에서 자세나 상대 위치가 분명할 때 Extract는 다음을 제안한다.

- 플레이어 자세
- 관련 NPC 자세
- 양쪽 `position_label`
- 현재 동작을 뒷받침하는 Story evidence
- 자세가 바뀐 경우 실제 `posture_end_reason`

데이터가 불명확하면 빈 값을 유지하고 UI가 발명하지 않는다.

### 6.3 UI 문장

`현재 자세`는 다음 순서로 조합한다.

1. 플레이어 `position_label`
2. 플레이어 posture fallback
3. NPC `position_label`
4. NPC posture + 실제 장소 fallback

`같은 공간에서` 같은 무의미한 문구는 최후 fallback으로도 사용하지 않는다. 관계 정보가 없으면 `김제나는 사무실에서 무릎을 꿇고 있다`처럼 실제 장소를 사용한다.

---

## 7. 요약·서사·기록 표시 계약

서로 다른 텍스트의 역할을 섞지 않는다.

- `story_text`: 사용자에게 보여주는 전체 서사
- `player_inner_thought`: Story가 쓴 플레이어 1인칭 속마음
- `turn_summary`: 해당 Commit 턴의 짧은 요약
- `story_summary_recent`: 프롬프트 기억용 내부 상태, UI에 직접 표시하지 않음
- `story_summary_overall`: 장기 프롬프트 기억용, UI에 직접 표시하지 않음

표시 규칙:

- 메인 서사 카드에 `turn_summary`를 다시 붙이지 않는다.
- 상태판에는 최신 `turn_summary`를 한 번만 표시한다.
- 플레이 기록 모달에서는 각 턴의 `turn_summary`를 표시한다.
- `renderHistory()`는 메인 서사와 기록 모달을 구분할 수 있는 옵션을 가져야 한다.
- 플레이어 속마음은 Mind Monitor와 별도다.
- 새 턴 렌더링 시 속마음 내부 스크롤 위치는 0으로 초기화한다.

---

## 8. 모바일 정보 구조

모바일 기본 순서는 다음과 같다.

```text
1. 헤더
2. 서사 본문
3. 서사 내 전문 선택지 4개
4. 한 줄 축약 버튼 4개
5. 한 줄 직접 입력 + 행동 실행
6. 현재 장면 이미지
7. 소형 TTS 도구막대
8. Mind Monitor
9. 캐릭터·현재 자세
10. 플레이어 상황
11. 사정 진행도
12. 이번 턴 요약
13. 상식개변·기록·피드백·NPC 찾기 도구
```

### 8.1 이미지

- 모바일 기본 높이를 제한하고 인물 중심으로 표시한다.
- 이미지 탭 시 원본 확대는 후속 기능으로 둘 수 있다.
- 제목 `현재 장면`은 한 번만 표시한다.
- 이미지 상황 텍스트가 제목과 동일하면 중복 표시하지 않는다.

### 8.2 TTS 도구막대

대형 전체폭 버튼을 제거하고 한 줄로 압축한다.

```text
[ ] TTS 사용                      [▶ 대사 재생]
```

### 8.3 캐릭터 상태

- 장소·업무·활성 규정은 압축 표시한다.
- 업무와 흐름이 동일하면 흐름을 중복 표시하지 않는다.
- 내부 ID와 raw save 문자열을 표시하지 않는다.
- `초점`, `마지막 화자`는 사용자 상태판에서 표시하지 않는다.

### 8.4 플레이어 상태

- 이름, 소속·직급, 현재 장소, 복장, 활성 규정 수만 기본 표시한다.
- 플레이어 속마음은 별도 카드로 표시한다.
- 0이더라도 의미가 있는 사정 진행도와 50% 가능 기준선은 유지한다.
- 중앙 기준선은 의도된 게임 규칙이므로 제거하지 않는다.

---

## 9. 구현 단계

### Phase A — 현재 데이터로 즉시 고칠 수 있는 프론트 정확성

- NPC별 Mind Monitor 렌더링과 인물 탭
- 빈 Mind Monitor 상태 표시
- `speaker_id` TTS 호환
- 수동 재생과 TTS 토글 분리
- 모바일 audio priming
- 메인 서사의 중복 turn summary 제거
- 중복 `현재 장면` 텍스트 제거
- 소형 TTS 도구막대
- 플레이어 속마음 scrollTop 초기화

API/DB/LLM 변경 없이 테스트 가능하다.

### Phase B — TTS Worker 실제 연결

- Company Wrangler에 `TTS_WORKER` Service Binding 추가
- `/api/tts`를 service binding 호출로 변경
- `direction` 전달
- Company master voice_id 검증
- API Worker dry-run 및 TTS 비차단 회귀 테스트

API Worker 배포가 필요하다.

### Phase C — Story 선택지 라벨 계약

- Story·Opening 프롬프트에 `[짧은라벨] 전문` 형식 추가
- parser가 `choices`와 `choice_labels` 분리
- save/opening/turn 복구 경로 추가
- 프론트 정규식 의미 추측 제거
- 과거 턴 fallback 유지

추가 LLM 호출과 DB column migration은 없다.

### Phase D — 물리 상태 품질

- Extract 프롬프트에 플레이어/NPC `position_label` 요구
- evidence 검증 강화
- guarded physical merge 테스트
- UI의 현재 자세 문장 개선

### Phase E — Mind Monitor 품질 보정

- 기존 2필드 길이·문체 계약 강화
- 현재 등장 NPC별 생성 누락 회귀 테스트
- degraded Extract에서는 명시적 unavailable 상태

### Phase F — 전체 모바일 밀도 마감

- 이미지 높이
- 상태판 중복 제거
- Mind Monitor 우선 배치
- 데스크톱 독립 스크롤 회귀
- 390px·412px 실제 브라우저 E2E

---

## 10. 테스트 기준

### Mind Monitor

- NPC별 map을 올바르게 읽음
- `surface/subconscious` 두 카드 표시
- 두 NPC 이상 탭 전환
- physical reaction 필드 없음
- 내부 ID 없음

### Choices

- Story 전문 4개 보존
- 라벨 4개 정확히 매칭
- 하단 한 줄 4버튼
- 클릭 payload 전문 동일
- 정규식 의미 추측 미사용

### TTS

- OFF 상태 자동 `/api/tts` 0건
- OFF 상태에서도 수동 재생 가능
- `speaker_id`로 voice 선택
- 최신 NPC 대사 한 줄 재생
- 모바일 사용자 gesture 안에서 audio prime
- TTS 실패가 턴 상태에 영향 없음

### Physical state

- 플레이어/NPC 자세 연속성 유지
- position label이 Story evidence와 일치
- 근거 없는 관계 문장 생성 안 함
- CSA 해제로 자세 자동 초기화 안 함

### UI

- 메인 서사에 중복 turn summary 없음
- 기록 모달에는 turn summary 존재
- 현재 장면 제목 중복 없음
- 사정 가능 50% 기준선 유지
- 모바일 가로 overflow 0
- 스토리·상태 패널 독립 스크롤 유지

---

## 11. 배포 역할

- 이 세션: 설계, 코드, 테스트, PR, Supabase/migration 필요 여부 판단, 최종 SHA 확정
- Codex/Claude: 확정 SHA의 테스트·Wrangler dry-run·Worker 배포·실화면 smoke
- 배포 담당자는 게임 기능·프롬프트·UI 설계를 임의 변경하지 않는다.

---

## 12. 이번 감사에서 확인한 실제 상태

Company Supabase 최근 3턴 기준:

- `dialogue_lines`는 Extract에 저장돼 있음
- `mind_monitor`는 NPC별 `surface/subconscious`로 저장돼 있음
- `physical_reaction`은 저장되지 않음
- `choices`는 전문만 저장되고 정확한 짧은 라벨은 없음
- NPC posture는 저장되지만 `position_label`과 플레이어 posture가 비어 있는 경우가 많음
- 캐릭터 5명의 `voice_id`는 Company master에 존재함

현재 코드 기준:

- Mind Monitor renderer가 NPC별 map을 잘못 읽음
- 수동 TTS 버튼이 토글 ON에 종속됨
- frontend TTS가 `character_id`를 우선 읽어 `speaker_id` 계약과 불일치함
- API TTS가 직접 외부 URL/secret을 요구하지만 Wrangler에 실제 연결 설정이 없음
- 선택지 버튼은 프론트 정규식 추측 라벨을 사용함

이 문서 이후의 구현은 위 문제를 Phase A부터 순서대로 수정한다.

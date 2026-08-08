# CODEX WORK ORDER — Post-PR42 Live Regression Stabilization V1

> **작업 성격:** 실플레이 로그 기반 선행 안정화 / Story-first 전환 전 사실 정본 복구  
> **저장소:** `zeroslove-ai/company-v1`  
> **작업 브랜치:** `company/post-pr42-live-regressions-v1`  
> **시작 기준 main:** `93627abd4564def4638b2d55d65e0f7d586239ee`  
> **선행 병합:** PR #42 `refactor: remove legacy action execution authority`  
> **후행 작업:** `company/raw-story-streaming-v1`  
> **상위 원칙:** `docs/COMPANY_V1_STORY_FIRST_RUNTIME_REDESIGN_CHARTER.md`  
> **감사 기준:** `docs/COMPANY_V1_AUTHORITY_INVENTORY_2026-08-08.md`

---

# 0. 실행 규칙

이 작업은 PR #42 병합 직후 실제 운영 게임의 106~119턴을 점검해 발견한 회귀와 기존 구조 결함을 먼저 안정화한다.

작업 전 반드시 다음을 보고한다.

- 현재 branch / HEAD SHA
- `origin/main` SHA가 `93627abd4564def4638b2d55d65e0f7d586239ee`인지
- 작업 트리 clean 여부
- 아래 심볼과 호출자 검색 결과
  - `isNpcPresentAtCurrentScene`
  - `resolvePresentNpcIds`
  - `sanitizeMovementCommit`
  - `clothingEvidenceForActor`
  - `retainEvidencedClothing`
  - `buildSceneContextCore`
  - `buildActiveWorldRules`
  - `buildCsaCurrentRulesSection`
  - `buildNpcCsaEpistemicFirewallSection`
  - `buildStructuredActionStorySection`
  - `buildExtractPrompt`

Draft PR까지만 만든다.

금지:

- 자동 Ready 전환
- 자동 merge
- Worker 배포
- Supabase migration
- 운영 save 수정·reset·repair
- live LLM 호출
- 신규 분류기·정규식 verifier·사후 Story 재판기 추가
- PR #42에서 삭제한 ActionExecutionContract 계열 권위 복원

---

# 1. 왜 Raw Story Streaming보다 먼저 하는가

후행 Raw Story 작업은 다음을 고친다.

- upstream raw Story 즉시 SSE 전달
- live / DB / replay / Extract / Commit evidence 문자열 통일
- `stream_segments` transport 권위 제거
- complete·Extract 시 Story 전체 재렌더 교체 제거

하지만 이번 실플레이에서 확인된 핵심 결함은 raw transport가 아니다.

현재 저장된 사실이 서로 모순되고, 그 모순이 다음 Story prompt에 들어가고 있다.

```text
잘못된 scene location
+ participants와 npc_scene_state.present 충돌
+ 실제로 벗은 옷이 save에 미기록
+ 조건부 규정을 활성화 즉시 실행으로 오해
+ csa_acceptance/sexual_arousal 의미 오염
→ 다음 Story가 잘못된 사실을 정본처럼 받음
→ 후속 턴 전체가 같은 오류를 반복
```

따라서 이 PR을 먼저 끝내고, 후행 `company/raw-story-streaming-v1`을 이 PR 병합 main 위로 재정렬한다.

---

# 2. 실제 로그 감사 요약

감사 대상:

- Supabase project: `fmcrspgxstsmxxsmkeee`
- game: `11111111-1111-4111-8111-111111111111`
- 확인 범위: active turn 106~119
- 최종 확인 시점: committed turn 119 / save revision 193

운영 데이터는 읽기만 했으며 수정하지 않았다.

## 2.1 장면 참가자 정본 충돌

turn 106 이전 save:

```text
scene_state.participants = [player-1, heroine1, heroine3]
npc_scene_state.heroine1.present = false
npc_scene_state.heroine3.present = true
```

현재 `isNpcPresentAtCurrentScene()`은 `present === false`를 participants보다 먼저 적용한다.

결과:

```text
SceneCast present_npc_ids = [heroine3]
Story 실제 등장/발화 = heroine1 + heroine3
매 턴 dialogue_speaker_not_in_cast
```

106~119 전 턴에 `dialogue_speaker_not_in_cast`가 반복됐다.

상위 계약상 현재 장면 참가자의 정본은 `scene_state.participants`다. Legacy `npc_scene_state.present`가 이를 뒤집으면 안 된다.

## 2.2 장소명만 지정한 이동이 저장되지 않음

turn 111 입력:

```text
프로젝트 보고실로 이동한다
```

SceneCast는 다음을 정확히 만들었다.

```text
transition_mode = movement
destination_location_id = project_report_room
destination_scene_id = project_report_room
destination_npc_ids = []
```

Story는 프로젝트 보고실 도착을 완료했고, 뒤이어 서원희가 자율적으로 들어와 업무 대화를 시작했다.

Extract도 `outcome=success`, `npcs_present=[heroine1]`을 반환했다.

그러나 `sanitizeMovementCommit()`은 destination NPC가 정확히 한 명일 때만 이동을 적용한다. 장소 목적지는 명확하지만 NPC 목적지가 0명이므로 `missing_destination`으로 시작 장소를 복원한다.

결과:

```text
Story: 프로젝트 보고실
save.scene_state.location_id: brand_strategy_office
save participants: player-1 + heroine1
```

다음 턴부터 화면 서사와 저장 위치가 갈라졌다.

중요: 서원희가 따라온 사건 자체는 자연스러운 NPC 자율 행동일 수 있다. 이번 수정은 이를 무조건 금지하지 않는다. Story에서 실제로 따라왔고 Extract가 최종 현장 인물로 관찰했다면 목적지 장면에 함께 저장해야 한다.

## 2.3 착의 변경이 실제 Story에 있는데 save에는 없음

turn 113 Story에서 서원희는 상의와 하의를 벗고 속옷 차림이 됐다.

Extract evidence에도 exact quote가 있었다.

하지만 해당 턴 `state_delta.npc_scene_state`가 비어 있어 실제 착의 patch가 생성되지 않았다.

turn 117·119에서는 Extract가 다음을 제안했다.

```json
{
  "uniform_top": "removed",
  "uniform_bottom": "removed",
  "underwear_top": "worn",
  "underwear_bottom": "worn"
}
```

그럼에도 post-save `npc_scene_state.heroine1.clothing`은 계속 `{}`였다.

원인:

1. SceneCast는 heroine1을 present가 아닌 context로만 취급했다.
2. guarded merge의 단일 NPC 증거 판정은 pre-Story SceneCast `present_npc_ids + entering_npc_ids`만 사용한다.
3. post-Story Extract `npcs_present=[heroine1]`은 의도적으로 무시된다.
4. 따라서 이름 없는 exact quote는 다중/미확정 장면 strict path에서 거절된다.

이는 Story 이후 실제 결과보다 pre-Story cast가 높은 권위를 가진 구조다.

## 2.4 플레이어 ID alias 때문에 착의 evidence가 거절됨

실제 플레이어 ID는 `player-1`이지만 Extract prompt는 player 착의 actor key를 `player`로 요구한다.

실제 로그에는 두 형태가 모두 나왔다.

```text
evidence.clothing[player-1]
evidence.clothing[player] + character_id=player-1
```

현재 merge는 `clothingEvidenceForActor(..., 'player')`만 읽고, `character_id !== actorId`면 거절한다.

따라서 `player` / `player-*`가 같은 canonical player임에도 착의 patch가 버려진다.

## 2.5 조건부 규정을 활성화 즉시 실행으로 오해

turn 114 신규 규정:

```text
여성 직원 전체는 업무를 수행하는 동안 플레이어의 분비물을 손으로 채취해 상태를 확인해야 한다.
```

활성화 Story가 현재 분비물 존재나 채취 필요 사실을 확인하지 않고 바로 신체 접촉·채취 완료를 생성했다.

turn 115 신규 규정:

```text
여성 직원 전체는 남성 직원의 발기로 업무가 방해되면 담당자가 업무적으로 이를 진정시켜야 한다.
```

이 규정도 `업무 방해`라는 조건이 현재 장면에서 성립하기 전에 활성화 Story가 바로 접촉·확인 행동을 생성했다.

실제로 사용자가 turn 117에서 발기가 업무를 방해한다고 명시했을 때가 첫 자연스러운 발동 시점이다.

현재 prompt는 서로 다른 세 사실을 섞는다.

```text
규정이 지금부터 유효함
≠ 조건이 지금 이미 성립함
≠ 의무 행동이 지금 즉시 완료됨
```

`during_work`, `while_on_duty`는 적용 시간·범위이지, 분비물·발기·업무 방해 같은 사건이 이미 발생했다는 증거가 아니다.

## 2.6 method unspecified를 폐쇄 목록처럼 해석

turn 118~119에서 NPC는 대략 다음 논리로 규정을 설명했다.

```text
규정에 속옷을 벗으라는 문구가 없으므로 속옷 제거는 규정 밖이며 불가
```

그러나 현재 CSA contract는 method가 unspecified이면 장면에 맞는 구체 방법을 정하도록 되어 있다.

올바른 의미:

- 규정이 요구하는 결과·의무는 고정된다.
- 규정이 특정 방법을 명시하지 않았다면 합리적으로 필요한 방법은 자동 금지되지 않는다.
- NPC는 성격·상황·사생활·업무 맥락을 근거로 특정 방법을 제안·거절·조정할 수 있다.
- 단지 원문에 방법이 없다는 이유만으로 “규정이 그 방법을 금지한다”고 말해서는 안 된다.

이는 규정 의미 확대가 아니라 `의무 결과`와 `수행 방법`을 분리하는 것이다.

## 2.7 규정 문구 반복과 장면 목표 상실

turn 113~119에서 같은 NPC가 매 턴 다음 표현을 반복했다.

- 회사 규정이니까
- 업무상 필요한 절차
- 규정에 따라
- 규정 원문만이 기준

새 공지를 한 번 확인한 뒤에도 브랜드 보이스 회의보다 규정 설명이 계속 장면 중심이 됐다.

규정 이행은 행동으로 표현해야 하며, 매 턴 규정 문장을 낭독하는 대사로 표현해서는 안 된다.

## 2.8 시간 사실 위반

save game time은 turn 106~119 동안 22시대였다.

그런데 Story는 다음을 반복했다.

- 점심시간이 다가온다
- 오후의 따사로운 햇살
- 햇살이 회의실로 들어온다

turn 117에는 실제 경과보다 훨씬 긴 “한 시간이 넘었다”는 지속 시간도 창작했다.

`context.current_time`과 committed elapsed time은 확정 사실이다. 분위기 연출이 이를 덮어쓰면 안 된다.

## 2.9 Extract 수치 의미 오염

turn 117:

- 얼굴 붉어짐을 근거로 `sexual_arousal_delta=+2`

turn 119:

- NPC가 활성 규정의 문언을 지키려 했고 플레이어의 해석에 반박했는데 `csa_acceptance_delta=-2`

문제:

- 수치심·당황·긴장·얼굴 붉어짐은 그 자체로 성적 흥분이 아니다.
- 플레이어의 방식·요구·해석에 반대하는 것은 활성 규정 자체에 대한 거부가 아니다.
- `csa_acceptance`는 규정 자체에 대한 내적 수용/저항을 나타내야 한다.

## 2.10 출력 계약 밖 메타 블록

turn 118 raw Story에 다음 종류의 메타 평가 블록이 삽입됐다.

```text
[만족스러운 점: ...]
```

이는 `unknown_structured_story_marker`를 발생시켰다.

후행 Raw Story 작업에서는 이런 문장도 원문 보존 원칙상 화면에 그대로 보이게 된다. 따라서 이번 PR에서 Story prompt가 자기평가·채점·설명 블록을 출력하지 않도록 명확히 고정한다.

## 2.11 이번 PR에서 미루는 문제

다음은 실제 로그에서 확인됐지만 이미 후속 구조개편 범위이므로 이번 PR에서 새 추론기를 만들지 않는다.

- turn 106에서 서원희 발화를 `speaker_id=heroine3`로 잘못 출력한 화자 ID 오류
- frontend/server parser의 화자 추론 중복
- speaker-tagger 전체
- TTS 화자 fallback과 잘못된 음성 재생
- raw Story live/replay/Extract 문자열 불일치
- `stream_segments`
- stale erection lifecycle 전체 재설계
- CSA runtime의 단일 `character_id` 구조
- legacy `last_npcs_present`, `npc_scene_state.present` DB 필드 완전 삭제

단, stale legacy 필드가 현재 canonical scene을 뒤집는 읽기 권위는 이번 PR에서 제거한다.

---

# 3. 목표 계약

## 3.1 장면 사실 우선순위

현재 단계의 canonical facts:

```text
현재 위치 = save.scene_state.location_id
현재 장면 참가자 = save.scene_state.participants
Story 후 최종 현장 인물 제안 = normalized Extract npcs_present
NPC별 posture/clothing = save.npc_scene_state[npc_id]
```

Legacy `npc_scene_state.present`는 participants를 부정하는 권위가 아니다.

Story prompt projection에서도 참가자인 NPC가 `present:false`로 동시에 노출되어서는 안 된다.

## 3.2 이동

장소명만 지정한 이동도 정상 이동이다.

```text
transition_mode=movement
+ destination_location_id 존재
+ Extract outcome=success
→ location 이동 적용
```

`destination_npc_ids` 0명은 실패가 아니다.

최종 participants:

- player canonical ID는 항상 포함
- Story 후 Extract `npcs_present`의 등록 NPC만 포함
- 아무도 없으면 player 단독
- 실제 Story에서 따라오거나 들어온 NPC가 있으면 목적지 장면에 포함 가능
- 출발지 NPC를 자동 유지하지 않음

명확한 장소도 없고 목적지 NPC도 없을 때만 `missing_destination`이다.

## 3.3 착의

- Story에 실제 착의 변화가 있고 Extract가 final clothing을 제안하면 저장한다.
- post-Story final presence를 착의 evidence 귀속에 사용한다.
- pre-Story SceneCast가 실제 Story 결과를 부정하지 않는다.
- `player`, `player-1`, `player_*`는 ownership 검증에서 같은 canonical player로 인식한다.
- 규정 문장, 계획, 자동 변화 문장은 여전히 착의 evidence가 아니다.
- exact quote 검증과 등록 NPC 충돌 방지는 유지한다.

## 3.4 조건부 CSA

새 규정 활성화 턴:

1. 규정이 유효해졌다는 공지·인지·반응은 즉시 가능하다.
2. 조건부 규정의 prerequisite가 현재 사실로 성립하지 않았으면 실제 의무 행동은 시작하지 않는다.
3. prerequisite를 보여 주기 위해 분비물·발기·업무 방해·대상·담당자를 창작하지 않는다.
4. 현재 장면에 사실이 이미 존재하면 같은 턴 자연스럽게 발동할 수 있다.
5. actor/target을 Story 전에 코드로 예약하지 않는다.

## 3.5 규정과 방법

- 규정 본문이 결과만 정하고 방법을 명시하지 않으면, 합리적인 수행 방법은 열린다.
- 원문에 없다는 이유만으로 특정 방법을 “규정상 금지”라고 단정하지 않는다.
- NPC의 개인적 거절·협상·불편은 가능하다.
- 개인적 경계와 규정 금지를 같은 말로 쓰지 않는다.
- 규정이 명시적으로 금지한 방법만 규정상 금지로 말한다.

## 3.6 규정 대사 반복 방지

- 새 규정 공지는 한 번만 충분히 보여 준다.
- ongoing 규정은 행동과 상황으로 반영한다.
- 사용자가 의미·범위·방법을 묻지 않았다면 규정 원문을 다시 낭독하지 않는다.
- NPC가 경계를 한 번 밝혔다면 다음 대사는 장면 목표·업무·관계 진행으로 돌아간다.
- 규정 준수와 법무 보고서 말투를 동일시하지 않는다.

## 3.7 시간

- `current_time.minute_of_day`는 분위기·채광·식사 시간의 hard fact다.
- 22:00 이후에 점심 전, 오후 햇살, 퇴근 전 한낮 같은 표현을 쓰지 않는다.
- 최근 턴과 elapsed time에 근거 없는 “한 시간 넘게”, “아침부터”, “몇 시간째”를 쓰지 않는다.

## 3.8 Extract 수치

`csa_acceptance`:

- 활성 규정 자체에 대한 수용/저항만 반영
- 단순 이행, 직급상 수행, 플레이어와의 말다툼, 수행 방법 이견만으로 변경하지 않음
- 규정을 옹호하면서 플레이어의 과잉 해석을 거절한 것은 감소 근거가 아님

`sexual_arousal`:

- 직접적 성적 흥분이 Story에 명확히 드러날 때만 변경
- 얼굴 붉어짐, 떨림, 수치심, 당황, 긴장, 얼어붙음, 규정 이행만으로 증가 금지

`affinity`:

- 기존 독립 근거 규칙 유지

## 3.9 출력 형식

Story는 다음 세 섹션만 출력한다.

```text
[1. 서사 및 행동]
[2. 플레이어 속마음]
[3. 선택지]
```

금지:

- 만족스러운 점
- 개선점
- 분석
- 자체 평가
- 규정 해설 메모
- 시스템 설명
- Markdown 평가 섹션
- 플레이어 속마음 전체를 따옴표로 감싸기

---

# 4. 구현 범위

## 4.1 `src/engine/scene-cast.js`

수정:

- `scene_state.participants`에 등록 NPC가 있으면 current scene participant로 인정한다.
- stale `npc_scene_state.present=false`가 participant를 부정하지 못하게 한다.
- stale NPC location 값도 canonical participant를 자동 퇴장시키는 권위로 사용하지 않는다.
- 등록 ID 검증은 유지한다.
- `last_npcs_present`, focal, last speaker를 새 present 근거로 승격하지 않는다.

삭제/변경 대상 테스트:

- `present=false`가 participants보다 우선한다는 구현 보호 테스트가 있다면 제거하거나 canonical participants 계약으로 교체한다.

금지:

- 이름·문장 regex로 Story 등장 인물을 추론하는 새 helper
- ActionExecutionContract 복원

## 4.2 `src/engine/gameplay-state.js` 또는 Story context projection

Story/Extract context에 active NPC state를 노출할 때:

- canonical participants에 포함된 NPC가 동시에 `present:false`로 보이지 않게 한다.
- 위치도 현재 scene location과 충돌하는 legacy 값을 사실 정본처럼 중복 노출하지 않는다.
- save 원본을 mutation하지 않는다.
- projection에서만 canonical scene을 우선한다.

가능하면 `npc_scene_state.present` 자체를 Story prompt projection에서 제거한다. 다른 소비자가 필요하면 participant 기반 derived boolean으로만 제공한다.

## 4.3 `src/engine/guarded-merge.js`

### 이동

`sanitizeMovementCommit()`을 장소 목적지와 NPC 목적지를 분리한다.

- destination location이 명확하고 outcome success면 destination NPC 0명도 이동 적용
- 최종 NPC는 normalized `extractEnvelope.npcs_present`
- player canonical ID 포함
- destination NPC 1명 기존 경로는 유지하되 실제 final presence와 충돌하지 않게 함
- final NPC 0명이면 `last_npcs_present=[]`, `focal_character_id=null`
- final NPC가 있으면 해당 NPC를 destination location/present true로 병합
- 출발 장면 NPC 중 final에 없는 인물만 present false
- feedback revision 이동 금지는 유지
- outcome partial/refused/interrupted/blocked/degraded 복원은 유지

### 착의 evidence

- 물리 상태 patch의 actor 수·현장 여부는 post-Story normalized `envelope.npcs_present`를 우선 사용한다.
- SceneCast는 pre-Story factual context일 뿐 Story 후 결과를 거절하는 권위가 아니다.
- 등록되지 않은 NPC는 normalize 단계에서 계속 제거한다.

### player alias

- canonical player identity helper 하나를 사용한다.
- evidence map key와 `character_id`에서 `player`, `player-1`, `player_*`, `player-*`를 같은 player로 인정한다.
- NPC ID에는 이 alias 규칙을 적용하지 않는다.

## 4.4 `src/engine/state/clothing.js`

- player alias ownership을 지원한다.
- single-NPC exact quote 예외는 post-Story final presence 기준으로 동작한다.
- 이름 없는 quote를 아무 NPC에게나 붙이지 않는다.
- 다른 등록 NPC 이름 충돌 차단 유지
- regulation directive / planning / magical transition 차단 유지

## 4.5 `src/engine/story-prompt.js`

최종 우선순위 규칙으로 다음을 명시한다.

- 규정 활성화와 조건 성립과 행동 실행은 별개
- conditional prerequisite 없는 즉시 실행 금지
- `during_work`, `while_on_duty`는 시간 범위이지 사건 발생 증거가 아님
- method unspecified는 closed list가 아님
- 규정상 금지와 NPC 개인 경계를 구분
- ongoing 규정 반복 낭독 금지
- current time hard fact
- unsupported duration/history 금지
- 자기평가/meta block 금지
- 플레이어 속마음 outer quote 금지

기존 긴 prompt에 같은 의미를 여러 번 추가하지 않는다. 충돌하는 기존 문장을 교체·축소한다.

특히 다음 기존 표현은 그대로 두지 않는다.

```text
기본 반응은 이행이다
갓 적용된 CSA는 이번 턴 초반부에 바로 장면에 반영한다
```

정확한 의미로 고친다.

```text
규정의 유효화·공지·인지가 즉시 반영된다.
조건부 의무의 실제 실행은 현재 조건이 성립할 때만 반영된다.
```

## 4.6 `src/engine/csa/prompt-sections.js`

수정 대상:

- `buildNpcCsaEpistemicFirewallSection({ worldRule:true })`
- `buildCsaCurrentRulesSection()`
- `buildStructuredActionStorySection()`
- 필요 시 `buildCsaRuntimeSection()`

요구:

- 세계 규칙 존재·정당성은 유지
- 즉시 실행 강제는 제거
- 조건부 trigger semantics 추가
- method semantics 추가
- 반복 설명 억제
- 현재 장면에 없는 prerequisite·actor·target 창작 금지

새 parser/classifier를 만들지 않는다.

## 4.7 `src/engine/extract-prompt.js`

수정:

- Story에 final attire가 직접 보이고 save가 empty/unknown이면 clothing patch를 누락하지 말라는 계약
- player clothing actor key는 `player`; `character_id`는 canonical player alias 허용 정책과 일치
- `csa_acceptance` 정의 고정
- sexual arousal의 embarrassment-only 금지
- Mind Monitor가 규정 문구를 surface/subconscious 양쪽에서 반복하지 않도록 함
- elapsed time은 현재 턴 경과만 제안하며 Story의 unsupported duration을 사실로 승격하지 않음

중요:

후행 Raw Story PR에서 `buildStructuredStoryV2ExtractText()`는 삭제 대상이다. 이번 PR에서는 raw transport 재설계를 섞지 않는다.

## 4.8 테스트

실제 로그를 익명화하지 말고 stable ID/장소 ID 기반 회귀 fixture로 만든다.

필수 테스트:

### SceneCast

1. participants에 heroine1, root present=false → heroine1은 present
2. participants에 heroine1, stale 다른 location → heroine1은 present
3. participant가 아닌 last_npcs/focal/last speaker → present 승격 안 됨
4. allowed speaker에 canonical participant 포함

### 장소명 이동

5. `프로젝트 보고실로 이동한다`
6. destination location=`project_report_room`, destination NPC=[]
7. outcome success, final npcs=[] → player 단독으로 이동 저장
8. outcome success, final npcs=[heroine1] → player+heroine1로 이동 저장
9. 출발지 NPC는 final에 없으면 present false
10. location/scene ID 둘 다 `project_report_room`
11. focal은 final NPC가 있을 때만 설정
12. partial/interrupted/degraded는 시작 위치 복원

기존 `destination 0명 → 이동 미적용` 테스트는 삭제하고, `location 없음 + NPC 없음 → 이동 미적용`으로 바꾼다.

### 착의

13. final npcs=[heroine1], exact quote에 이름 없음 → heroine1 clothing 저장
14. 다른 NPC 이름이 quote에 있으면 거절
15. evidence key player + character_id player-1 → player clothing 저장
16. evidence key player-1 + character_id player-1 → player clothing 저장
17. regulation text만 evidence → 거절
18. planning-only → 거절
19. Story에 실제 탈의 완료 + previous empty → four-slot clothing 저장

### Prompt contract

20. newly activated conditional rule은 공지와 실행을 구분
21. prerequisite 창작 금지 문구 존재
22. during_work가 자동 trigger가 아니라는 계약
23. unspecified method가 closed list가 아니라는 계약
24. 규정상 금지와 개인 경계 구분
25. ongoing 규정 반복 낭독 금지
26. current time hard fact
27. unsupported elapsed duration 금지
28. meta self-review output 금지
29. player inner thought outer quote 금지

### Extract contract

30. embarrassment/blushing/trembling alone cannot raise sexual_arousal
31. player method dispute cannot lower csa_acceptance unless rule itself is rejected
32. final visible clothing must produce state patch
33. actor ownership player alias contract

### 통합 회귀

34. turn 111형 장소 이동 뒤 save location이 Story와 일치
35. 다음 턴 SceneCast에서 Story 최종 NPC가 present/speaker로 유지
36. turn 113형 탈의 뒤 다음 Story context clothing_authority.actual_clothing이 four-slot 상태
37. turn 114/115형 conditional activation에서 prerequisite 없으면 contact/completion 강제 문구 없음

전체 테스트 숫자 자체를 목표로 삼지 않는다. 삭제·수정한 구현 보호 테스트와 추가한 제품 회귀 테스트를 따로 보고한다.

---

# 5. 이번 PR에서 하지 않을 것

- raw Story chunk 즉시 emit
- `StructuredStoryGate` 삭제
- `stream_segments` 삭제
- replay transport 변경
- frontend complete/extract Story replacement 제거
- speaker ID 자동 교정
- TTS 수정
- SceneCast 전체 삭제
- Extract 전체 축소
- DB schema 변경
- 과거 turn rewrite
- 현재 운영 save 직접 복구

후행 순서:

```text
post-PR42 live regression stabilization
→ raw Story streaming authority unification
→ dialogue/speaker projection cleanup
→ Extract responsibility shrink
→ scene/state single-writer full migration
```

---

# 6. 완료 조건

완료 보고에는 다음을 포함한다.

1. 시작 branch/SHA
2. 최종 SHA
3. main SHA
4. 변경 파일
5. 실제 로그 원인별 수정 내용
6. 장소명-only 이동 최종 계약
7. participants/present 우선순위
8. clothing player alias 처리
9. conditional CSA activation contract
10. method unspecified contract
11. time/meta-output contract
12. csa_acceptance/sexual_arousal contract
13. 삭제·교체한 obsolete tests
14. 추가한 실제 회귀 tests
15. 전체 test 결과
16. syntax check
17. `git diff --check`
18. Draft PR URL
19. 미실행 항목: DB, migration, reset, live repair, deploy, merge

---

# 7. 최종 판단 기준

이 PR의 성공은 “규정 반응을 더 약하게 만드는 것”이 아니다.

성공 기준:

- 규정은 실제 세계 규칙으로 유지된다.
- 조건이 성립하면 캐릭터답게 이행·갈등·협상한다.
- 조건이 없으면 시범 실행을 위해 사건을 창작하지 않는다.
- 방법 미지정을 금지 목록으로 오해하지 않는다.
- NPC가 따라오거나 자율 행동을 해도 Story의 실제 결과와 save가 일치한다.
- 현재 장면 인물과 착의가 다음 턴에 정확히 이어진다.
- 규정 문구가 서사의 목적을 대체하지 않는다.
- 시간·수치·물리 상태가 한 턴 뒤에 다른 사실로 변조되지 않는다.

> **Story가 사건을 만들고, Extract가 실제 결과를 관찰하며, save는 그 사실을 정확히 이어받아야 한다.**

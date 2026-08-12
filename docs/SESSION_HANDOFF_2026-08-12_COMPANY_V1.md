# Company v1 — Session Handoff (2026-08-12)

## 0. 목적
새 세션에서 추측 없이 바로 이어서 개발/검수할 수 있도록, 2026-08-12 현재 Company v1의 실제 상태, 최근 Phase 12I~12M 흐름, 확정된 제품 원칙, live에서 재현된 버그, 다음 작업 우선순위를 정리한다.

---

## 1. 프로젝트 기본 정보
- Repo: `zeroslove-ai/company-v1`
- Supabase project: `fmcrspgxstsmxxsmkeee`
- Production game: `11111111-1111-4111-8111-111111111111`
- Test game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- API Worker: `game-proxy-company-v1`
- Frontend Worker: `gamebuilder-company-v1`
- TTS Worker: `fancy-dust-7f8c`
- Story/Extract model: `deepseek-v4-flash`
- Test URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Production URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=11111111-1111-4111-8111-111111111111`

---

## 2. 최상위 운영 원칙
### 플레이 우선순위
1. 게임 진행 가능
2. Story 자연스러움
3. state integrity
4. semantic completeness

### fail-open 원칙
- CHOICE 부족: warning + deterministic/canonical fallback + 계속 진행
- THOUGHT 누락/품질 이상: warning + 계속 진행
- ACTING 이상/중복: warning + presentation 수준 처리
- Mind Monitor 일부 malformed: 해당 entry drop/retain + warning, 턴 전체 실패 금지
- image 없음: 계속 진행
- optional Extract field malformed: 해당 field만 버리고 Commit 가능하면 계속 진행

### hard-fail은 좁게 유지
- wrong game/action authority
- turn conflict / concurrency integrity
- signed CSA transaction tamper
- canonical save를 실제로 손상시킬 수 있는 mutation
- DB transaction/state integrity 위반

### 금지
- 새 범용 semantic gate/validator 남발
- retry/regeneration/추가 LLM 호출
- model/provider 변경
- raw Story 사후 rewrite/repair
- 특정 preset hotfix if/else
- 병원편 전체 Worker 복붙
- 사용자가 플레이 못 하는 상태에서 자동 harness만 계속 늘리기

---

## 3. 핵심 아키텍처 원칙
Pipeline:
`Player input → Story → Extract → Commit → UI/image/TTS`

- Story = narrative source-of-truth
- Player input = attempt/intent authority
- Extract = Story 관찰자, pre-Story gameplay authority 아님
- Commit = canonical state writer
- CSA active = 이미 성립한 제도적 현실
- NPC는 required_now CSA의 실행 여부를 결정하지 않음
- NPC 자유는 감정/부끄러움/짜증/체념/자기합리화/흥분/무덤덤함 등 반응에 있음

### CSA 최종 철학
`behavior fixed, reaction free`

- active + applicable + required_now → 실행 확정
- NPC가 규정 존재/시행 여부를 부정·유예·승인대기하지 않음
- 단 trigger가 성립하지 않은 conditional/on-request 규정은 강제 실행 안 함

### CSA over-compliance 방지 원칙
`mandatory_execution = 규정에 명시된 정확한 범위만 수행`

예:
- `underwear_bottom=removed`만 요구 → 다른 clothing slot은 CSA를 이유로 건드리지 않음
- `sit_on_lap` → 임의 키스/탈의/성행동 추가 금지
- `press_body_against` → 규정에 없는 추가 escalation 금지
- exact method면 exact method가 범위 상한
- broader outcome이면 그 범위 안에서 Story가 방법을 선택할 수 있음

---

## 4. Player Agency 원칙
### Player dialogue
- Player intent = user input authority
- LLM은 의미 보존 paraphrase만 가능
- 새 사과/철회/양보/약속/거절/결정 추가 금지
- 행동만 입력했으면 player dialogue 생성 최소화
- unauthorized player dialogue는 gameplay authority가 아니며 턴 hard-fail 금지

### Player THOUGHT
원래 계약: reaction-only.

허용:
- 감정, 놀람, 짜증, 의문, 만족, 기대, 직전 상황 반응

금지:
- 사용자 의도 반전
- 사과/철회/양보/후퇴 결정
- 새로운 약속
- 다음 행동 확정
- 사용자와 반대되는 도덕적 결론

단 `먼저 인사해야겠다` 같은 mild planning drift 하나로 gameplay hard-stop하면 안 됨. warning 수준.

---

## 5. Mind Monitor 원칙
- `surface`: NPC가 스스로 인식하는 현재 생각/감정
- `subconscious`: 직접 인정하지 않거나 명확히 언어화하지 않는 깊은 욕구/불안/수치/자기합리화
- 둘 다 NPC 본인 시점
- Player THOUGHT 복사 금지
- 다른 NPC와 동일 template 복사 금지
- Story summary/규정 본문 재서술 금지
- Mind Monitor는 CSA compliance를 결정하지 않음
- malformed entry는 fail-open

병원편은 Mind Monitor 표현의 donor reference로만 활용. 전체 Worker 이식 금지.

---

## 6. 최근 Phase 흐름

### Phase 12I
Start: `10abcb7202b53da3e3a15038927695070ec5b425`
Final: `01466419550897716a9b8f156822e6fdd9565212`

핵심:
- CSA resolved_facts
- clothing satisfaction 실제 state와 맞춤
- Extract optional domains fail-open
- Mind Monitor 오염 완화
- 추가 LLM/retry 없음
- model 유지

API deploy version 당시: `9eec9ccb-323b-4435-a779-a960129c8a90`

### Phase 12J
Start: `0146641...`
Final: `bfc9f072aa5c19a001bea9bb5d196f213d35cee0`
Commit: `fix: consolidate narrative authority and restore mind monitor`
CI: `31581439405`
Tests: `689 pass`
API deploy: `111e5e6c-a2b0-4733-bfd8-77dff05079e5`
Frontend unchanged

핵심:
- required_now → mandatory_execution
- NPC 실행 = engine authority
- player intent = input authority
- player dialogue = semantic-preserving paraphrase
- THOUGHT reaction-only guidance
- Mind Monitor NPC별 context 강화
- new hard gate 0

### Phase 12K
제품 source 수정 0인 live acceptance 시도.
초기 보고는 FAIL:
- Opening/Turn1 성공
- Turn1 THOUGHT mild plan drift
- CSA Turn2 local projection이 `conditional`, `resolved_facts=[]` 등으로 나옴

하지만 이후 리뷰에서 중요한 canary 버그 발견:
- canary가 `/api/context`의 `context.master`를 사용
- 실제 `/api/context`에는 authoritative master 없음
- `master={}`로 local CSA projection 재계산
- profile gender 유실 → applicable actor 0 → 잘못된 projection

따라서 12K의 deterministic CSA FAIL 판정은 invalid/inconclusive.

### Phase 12L 정정 진단
제품 `src/**` 수정 0.
canary master parity만 수정.

실제 Company edition catalog shape `{ characters, general_npcs }` 사용.
- characters 5
- general NPCs 8

재검증 결과:
- Opening 성공
- Turn1 성공
- Turn2 clothing CSA 성공
  - applicable actor 존재
  - required_now
  - mandatory_execution
  - transition_required_now=true
  - clothing obligation 존재
  - Story concrete execution
  - Extract `underwear_bottom=removed`
  - Commit `underwear_bottom=removed`
  - physical verdict PASS
- Turn3 성공

즉 해당 시나리오에서 제품 CSA projection/physical pipeline은 정상.

### Phase 12L closeout
Start: `bfc9f072...`
Final: `001c66ce352631911347a4554816bfeda34a8338`
Commit: `test: close out Phase 12L canary parity`
Changed only:
- `scripts/live-playtest-canary.mjs`
- `test/live-playtest-canary.test.mjs`

Tests:
- npm test 691 pass / 0 fail / 0 skip
- targeted harness 12 pass
- CI `31584417110` success
- Worker deploy 0
- Frontend deploy 0
- PR #61 Open/Draft/Unmerged

---

## 7. 12L 이후 새로 확정된 실제 문제

### P0-A. 플레이어 설정 UI가 2턴 전후 반복적으로 다시 뜸
사용자가 실제 브라우저에서 반복 재현.
처음에는 사용자가 직접 눌렀다고 정정했지만 이후 다시 자동 재출현 확인 → 실제 버그로 확정.

중요한 DB 사실:
현재 실측 시점 DB는:
- `player_setup.status=complete`
- `player_setup.completed=true`
- `opening_state.status=complete`

즉 설정 상태가 DB에서 초기화되는 문제가 아니라 **frontend lifecycle/render 문제일 가능성이 높음**.

현재 frontend 코드 정상 의도:
- `setupPending() = !playerSetupCompleted(context)`
- `playerSetupCompleted`는 `save.player_setup.completed===true`면 true
- render는 `overlay.hidden = !setupOpen`

따라서 다음 중 하나 의심:
1. 실제 배포 frontend가 GitHub HEAD와 불일치
2. refresh/render lifecycle 중 stale context로 overlay가 다시 열림
3. `player-setup-overlay` 외 다른 경로가 설정 UI를 열고 있음

### P0-B. Opening choices가 화면에 안 뜸
사용자 실제 브라우저 screenshot에서 확인.

DB에는 opening choices 4개가 정확히 저장되어 있었음.
즉 생성/저장 문제가 아니라 **frontend opening → bottom choices handoff/render bug**.

실측 DB example:
`opening_state.choices` 4개 존재.
`last_choices` 4개 존재.

frontend 조사 포인트:
- `streamOpening()`
- `streamedStoryChoices`
- `refreshContext({ preserveStreamedChoices:true })`
- `clearTransientStoryProjection()`
- `choicesForRenderer()`
- `buildCompanyGameViewModel()`
- `renderChoices()`

### P1. NPC THOUGHT가 [THOUGHT]로 들어가 player_inner_thought 오염
12L live review에서 3턴 연속 사례 보고.
예:
`규정이니 해야 했지만, 첫 출근한 인턴 앞에서 이런 광경을 보인 게... 조금 부끄럽다.`

이건 NPC 내면인데 `[THOUGHT]`로 나옴.

현재 parser는 speaker metadata 없는 `[THOUGHT]`를 player thought로 저장하는 구조라 12J ownership 계약이 prompt에만 있고 runtime 방어 없음.

구분 필요:
1. generation ownership failure: LLM이 NPC thought를 `[THOUGHT]`에 씀
2. parser ownership limitation: parser는 metadata 없이 의미를 판별할 수 없음

금지:
- 자연어 semantic classifier로 문장을 읽어 NPC/Player 화자 추정
- THOUGHT 오류 때문에 turn hard-fail

가능한 향후 방향:
- protocol metadata 최소 확장 여부 진단
- Story prompt ownership 명확화
- NPC inner state는 Mind Monitor로만

### P1/P2 watchlist
- mandatory CSA off-screen deferral
- CSA over-compliance
- THOUGHT planning drift
- Mind Monitor generic/duplicate
- image 미출력
- emotion persistence
- relationship progression
- posture/position consistency
- story summary corruption
- turn_changes/state progression 일부

---

## 8. 최신 frontend 코드 관련 중요한 관찰

`src/frontend/pages/state.js`
- `playerSetupCompleted(context)`:
  - `save.player_setup.completed === true`면 true
- `openingCompleted(context)`:
  - `save.opening_state.status === 'complete'`면 true

`src/frontend/pages/app.js`
- `setupPending() { return !playerSetupCompleted(context); }`
- `render()`에서:
  - `const setupOpen = setupPending();`
  - `setupElements.overlay.hidden = !setupOpen`
- opening choices handoff:
  - `streamOpening()` complete에서 streamedStoryChoices 설정
  - `refreshContext({ preserveStreamedChoices:true })`
  - canonical opening history 존재하면 transient story만 clear
- `choicesForRenderer(viewModel, streamedStoryChoices)` 사용

따라서 반복 setup overlay는 DB 상태와 current code만 보면 원래 뜨면 안 됨. 배포 parity 또는 lifecycle 문제를 꼭 잡아야 함.

---

## 9. 지금 다음 작업: Phase 12M
다음 작업명:
`Phase 12M — Frontend Lifecycle Regression + THOUGHT Ownership Diagnosis`

### 최우선 순서
1. P0-A player setup 반복 노출 root cause
2. P0-B opening choice 렌더링 root cause
3. P1 THOUGHT ownership diagnosis

### 원인 확정 전 금지
- CSA engine 수정
- DB/migration
- Story/Extract/Commit 구조 손대기
- model/provider 변경
- retry/regeneration
- 전체 frontend 리팩터
- 자연어 의미 classifier
- THOUGHT hard gate

### 진단해야 할 runtime snapshot
각 이벤트마다:
- init
- refreshContext start/end
- render
- CSA submit
- Story start/complete
- Extract
- Commit
- onCommitted
- pending change

기록:
- player_setup.status
- player_setup.completed
- opening_state.status
- committed_turn
- setupPending()
- overlay.hidden
- busy
- pending.step

### 반드시 확인할 dataflow
Opening choices:
1. opening SSE complete choices
2. refreshed context opening_state.choices
3. opening_turn.choices / save.last_choices / viewModel.story.choices
4. renderChoices input
5. actual DOM button count

THOUGHT:
`Story → parseFreshNarrativeV2 → player_inner_thought → Commit/history/UI`

Mind Monitor capture:
- target_id
- surface
- subconscious

### 제품 수정 기준
- frontend root cause 확정 후 최소 frontend-only patch 가능
- API 변경 없으면 API Worker deploy 0
- Frontend 수정 시 Frontend Worker만 deploy
- THOUGHT ownership 설계가 불명확하면 frontend fix와 분리

---

## 10. 최근 실제 DB 상태 주의
사용자 수동 플레이 중 DB를 직접 확인한 시점에는:
- `committed_turn=0`
- `processing_status=idle`
- `player_setup.status=complete`
- `player_setup.completed=true`
- `opening_state.status=complete`
- opening choices 4개 존재

즉 수동 플레이 시작 후 setup/opening이 완료된 상태였음.

사용자가 다시 setup overlay가 뜬 화면을 보내면 **닫거나 다시 저장하기 전에** DB/context를 즉시 읽어 stale frontend vs server state를 비교하는 게 가장 중요함.

---

## 11. PR / 브랜치
- Active branch: `hotfix/playtest-presentation-monitor-v1`
- Current HEAD: `001c66ce352631911347a4554816bfeda34a8338`
- PR #61: Open / Draft / Unmerged
- PR title: `fix: stabilize playtest presentation and monitor contracts`

PR #61은 아직 Ready/merge 금지.

---

## 12. 새 세션 시작 시 권장 첫 행동
1. 이 문서를 전체 읽기
2. GitHub 실제 HEAD / PR #61 상태 확인
3. Supabase test game read-only 상태 확인
4. 사용자가 setup overlay 반복 재현한 최신 시점이면 DB/context 먼저 읽기
5. Phase 12M 진단부터 수행
6. 제품 patch는 root cause 확정 후 최소 변경
7. 수동 플레이 가능성을 가장 우선

---

## 13. 핵심 한 줄 요약
현재 Company v1은 **CSA engine 자체는 12L 재검증에서 정상화됨**. 지금 가장 중요한 실제 blocker는 **frontend lifecycle의 플레이어 설정 반복 노출 + Opening 선택지 미표시**, 그리고 별도 실제 품질 버그로 **NPC THOUGHT가 player_inner_thought로 오염되는 문제**다.

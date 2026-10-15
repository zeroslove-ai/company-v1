# Company R4 — 후보 최종 보고서

**판정: PARTIAL_BLOCKED**

## 결과 및 제품 방향

이 후보는 원작 상식개변: 회사편의 캐릭터 중심 인터랙티브 서사와 플레이어만 비밀 앱을 아는 전제를 사용한다. 사내 업무 fixture는 실제 게임 기본 콘텐츠로 사용하지 않는다. 상식개변 규칙은 서버 소유 prospective state, Story, Observer, atomic Commit 흐름에 연결했지만 실제 규칙 장면의 모델 검증은 남아 있다.

실제 모델 캠페인 마지막 장면에서 윤민아는 플레이어의 “세는 게 아니라 기다렸다”는 대답에 자신의 숫자 세기와 기다림의 차이를 연결해 반응한다. 다음 자유 입력 선택지는 보리차 대화와 사람 자체에 대한 감정적 경계를 묻는 흐름을 포함하며, 업무 수행 선택지로 한정되지 않았다.

## 실제 콘텐츠 연결 증거

경로는 다음과 같다.

content/characters.json 및 세계관 정본 → runtime-r4/domain/content.js loader → runtime-r4/domain/context.js context builder → runtime-r4/adapters/provider.js Story/Observer HTTP payload → 저장된 실제 Story.

실제 40턴 payload audit (var/r4-private-evidence/real-ui-turn40.json)에서 Story와 Observer 양쪽의 actual_http_request=true, provider company-configured, model deepseek-flash를 확인했다. 두 payload의 world_premise에는 플레이어의 비공개 앱 발견, 앱을 보는 것만으로는 세계가 바뀌지 않는 점, NPC가 앱/초자연적 원인을 자동으로 알지 못한다는 전제가 들어 있었다. 원본 캐릭터 설정에는 윤민아의 빠르고 명료한 말투, 자존심·당혹감이 질문으로 드러나는 반응, 직급 호칭, 완벽해 보이려는 부담, 과거 약속 기억이 포함됐다. 김제나 카드도 같은 payload에 함께 실렸지만 그 턴 현장에는 윤민아만 등장했다. 생성된 Story는 윤민아의 작은 손동작, 말 속도와 시선 변화, 이전 보리차 대화에 연결된 반응을 보여 줬다.

Mind Monitor는 실제 해당 장면과 윤민아의 세기/기다림에 대한 말에 연결돼 있었다. 원본 콘텐츠 파일과 정본은 이 작업에서 수정하지 않았다.

## 실행 및 검증

개발 서버 실행:

PowerShell에서 PORT=4182, R4_DB_PATH=var/r4-user-goal-20261015, R4_MODEL_CALL_BUDGET=120을 설정한 뒤 npm run r4:dev를 실행한다. 기존 승인된 모델 설정과 TTS Worker 환경값은 그대로 사용한다.

새 로컬 게임 Setup URL:
http://127.0.0.1:4182/?gameId=546dd220-2623-4ebd-8ce7-6bb095a7b52f

40턴 실제 모델 캠페인:
http://127.0.0.1:4182/?gameId=26f159ff-ce8f-4c7d-869a-4b126360362c

로컬 DB 디렉터리: var/r4-user-goal-20261015. 같은 환경 변수와 디렉터리로 서버를 다시 실행해 재시작 복원을 확인했다. state_revision=50, 40개 게임 기록, 40턴 및 마지막 장면이 복원됐다.

- 실제 모델 사용은 총 119/120회(Story 60, Observer 59)다. 각 40턴의 Story/Observer HTTP 요청은 실제 provider를 사용했다. 마지막 호출 하나는 Story+Observer 쌍이 아니므로 추가 모델 실행에는 사용하지 않았다.
- 캠페인 projection은 36/40 complete다. turn14의 경과 시간 근거 문장이 Story에 없어서 시간이 바뀌지 않도록 거부됐다. 과거 normalizer가 근거 없이 0분을 기록한 turn17–19도 미완전 projection으로 남겼다. 과거 이력을 조용히 고쳐 PASS로 바꾸지 않았다.
- 경계 turn8–12는 모두 실제 요청과 complete projection을 사용했다. turn11–12는 오래된 요약과 최근 원문을 함께 회수했고, turn40 context는 turn3부터 관련 digest와 turn34–39 원문을 사용했으며 overflow가 없었다.
- 실제 피드백 revision2는 기존 구조화 command ID와 원문을 보존했다. 피드백 후 캐릭터 귀속이 현장 인물과 일치하고 음성 재생 control이 활성화됐다.
- 서버 재시작/브라우저 새로고침 후 마지막 확정 장면을 확인했다. desktop 1280×900과 mobile 390×844에서 가로 overflow가 없었다.
- 회귀 테스트는 npm test -- --test-reporter=dot 실행 결과 619/619 통과다. 핵심 R4 suite는 22/22 통과했다.
- 기존 TTS Worker와 원본 voice ID 매핑이 설정됐다. 실제 장면 대사에서 윤민아와 김제나의 음성 출력을 각각 확인했고, 윤민아 플레이어에는 3초 오디오가 로드됐다. 음성 품질 평가는 하지 않았다.
- 정지/재생/GIF 교체/실패 시 포스터 fallback은 별도 scripted-preview fixture UI에서 확인했다. 이 결과는 모델 서사 검증이 아니다.

## 미검증 및 차단

- 원본 이미지 catalog의 102개 항목은 storage reference만 있으며 공개 이미지 저장소 연결과 로컬 원본 pixel 파일이 없어 실제 캐릭터 원본 그림을 표시하지 못했다. UI에는 이 장면 이미지를 불러올 수 없다고 나온다. fixture 이미지를 원본 art로 간주하지 않았다.
- content/csa_catalog.json의 기존 규칙 중 이 작업 범위에서 실제 모델로 실행 가능한 비노골적·비강압 preset을 찾지 못했다. 규칙의 구조적 APPLY/CHANGE/REMOVE·재시도·피드백·재시작 검사는 격리된 합성 fixture에 한정한다. 실제 Story/Observer 규칙 발효, 서로 다른 NPC의 첫 반응, CHANGE/REMOVE 뒤 대화 연속성은 미검증이다. 원본 규칙 카탈로그를 새로 만들거나 의미를 변경하지 않았다.
- 실제 캠페인 4개 historical projection은 degraded이며 추가 provider 호출은 남은 1회 예산으로 검증할 수 없다.
- 이 판정은 코어 후보 검증 결과다. 모든 원작 콘텐츠·규칙 승인, 전체 출시 승인 또는 사용자 재미 수락을 뜻하지 않는다.

## 보호 범위 및 저장소

- 후보 브랜치: rebuild/company-core-r4-20261015; 구현 커밋 bb198fc116de04937fd63b0851e98c77673bfd54 (fast-forward push 완료, 원격 tip 일치).
- 초안 PR #105: https://github.com/zeroslove-ai/company-v1/pull/105 (OPEN/DRAFT 유지, 설명 갱신 및 이 작업에 연결 완료).
- 원본 canon/content/media/voice 매핑, main, PR #104, R3 runtime/Worker, 원격 DB 및 보존 세이브는 수정하지 않았다. 원본 자료를 삭제하거나 일반 업무 fixture로 대체하지 않았다.
- 실제 실행은 새 로컬 PGlite DB와 새 로컬 게임에만 기록했다. 배포와 main 병합은 수행하지 않았다.

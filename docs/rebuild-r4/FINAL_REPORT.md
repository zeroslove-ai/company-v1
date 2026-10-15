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
- 기존 Cloudflare TTS Worker fancy-dust-7f8c와 content/characters.json의 다섯 원본 voice_id 매핑을 확인했다. 실제 장면에서 TTS Worker가 확정 대사에 대한 음성 URL을 반환했고, 윤민아/김제나 대사 재생과 윤민아의 3초 audio player를 확인했다. 저장된 실제 김제나 재생 응답 하나를 대조했을 때 서명 쿼리는 노출하지 않은 채 호스트가 Cloudflare R2이고 경로가 `tts/*.mp3`인 것을 확인했다. Cloudflare 읽기 전용 조회에서 fancy-dust-7f8c Worker의 tts R2 binding이 tts bucket을 가리키며, 해당 bucket에 MP3 2,813개(427,390,192 bytes)가 열거됐다. 목록의 모든 object는 `.mp3`, 이미지 object는 0개, 원본 image catalog 102개 경로와 정확히 일치하는 object도 0개였다. 별도 bucket-info 조회는 object_count 2,812를 반환했으므로 한 개 차이는 조회 시점 차이 또는 저장소 갱신 가능성이 있어 고정 수치로 단정하지 않는다. 버킷과 실제 TTS 응답의 경로가 연결되지만 각 object를 특정 대사나 원본 voice sample에 개별 대응하지는 못했다. Worker 설정의 FISH_API_KEY/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY는 이름만 확인했고 값은 읽지 않았다. 음성 품질 평가는 하지 않았다.
- 정지/재생/GIF 교체/실패 시 포스터 fallback은 별도 scripted-preview fixture UI에서 확인했다. 이 결과는 모델 서사 검증이 아니다.

## 미검증 및 차단

- 원본 image catalog 102개 항목은 storage reference다. Worker 설정의 Company Supabase ref fmcrspgxstsmxxsmkeee는 INACTIVE다. 이 프로젝트의 다섯 원본 대표 이미지 URL에 HEAD를 시도했으나 모두 요청에 실패했고, 대표 URL 하나를 상세 확인했을 때 DNS `ENOTFOUND`였다. 따라서 원본 object 존재 여부는 확인할 수 없었다. 원격 서비스 보호 범위에 따라 복구·변경은 하지 않았다. 별도 AI_웹개발 Supabase ovltkzwddxsekcfeskds는 ACTIVE_HEALTHY이고 public image bucket에 598개 object가 있지만, catalog heroine1–5 대표 이미지 경로와 exact match가 0/5이며 heroine2 파일명은 의료 배경 맥락이다. Company 정본 인물 자산이라는 검증 없이 재사용하지 않았다. 해당 Supabase bucket에는 audio object도 0개다. 읽기 가능한 Cloudflare account 한 곳의 `tts` bucket에는 MP3 object가 있으나 canonical image 경로는 0/102 일치했다. 전체 저장소 git history와 Git LFS에서는 원본 art/audio 파일을 찾지 못했고 GitHub release도 없으며, demo GIF/PNG 두 개만 Git에서 추적된다. UI는 실제 장면 이미지를 불러오지 못한다고 표시한다.
- content/csa_catalog.json의 기존 규칙 중 이 작업 범위에서 실제 모델로 실행 가능한 비노골적·비강압 preset을 찾지 못했다. 규칙의 구조적 APPLY/CHANGE/REMOVE·재시도·피드백·재시작 검사는 격리된 합성 fixture에 한정한다. 실제 Story/Observer 규칙 발효, 서로 다른 NPC의 첫 반응, CHANGE/REMOVE 뒤 대화 연속성은 미검증이다. 원본 규칙 카탈로그를 새로 만들거나 의미를 변경하지 않았다.
- 실제 캠페인 4개 historical projection은 degraded이며 추가 provider 호출은 남은 1회 예산으로 검증할 수 없다.
- 이 판정은 코어 후보 검증 결과다. 모든 원작 콘텐츠·규칙 승인, 전체 출시 승인 또는 사용자 재미 수락을 뜻하지 않는다.


## Supabase/Cloudflare 자산 조사

- Supabase project 목록에는 두 project가 있다. Company Worker가 설정한 company-v1 (fmcrspgxstsmxxsmkeee)은 INACTIVE이며 별도 AI_웹개발 (ovltkzwddxsekcfeskds)은 ACTIVE_HEALTHY다. project metadata와 Storage catalog만 SELECT로 읽었다. 공식 project 복구, SQL write/DDL, upload, Worker 변경은 하지 않았다.
- 다른 ACTIVE_HEALTHY project의 public image bucket에는 598개 object가 있으나 canonical media locators와 일치하는 주인공 portrait가 없고 medical-context file naming이 확인돼 Company 그림으로 연결하지 않았다. 오디오 object는 없었다.
- Cloudflare API로 조회 가능한 account는 1곳이며 R2 bucket은 `tts` 1개였다. Company API Worker의 Wrangler 설정에는 직접 R2 binding이 없고, TTS_WORKER service binding은 fancy-dust-7f8c를 가리킨다. Cloudflare에서 읽은 실제 fancy-dust-7f8c Worker 설정에는 tts R2 bucket binding과 FISH_API_KEY/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY secret 이름이 있다. 기존 TTS 경로는 R4 health와 live audio playback에서 동작했다. 이미지 bucket은 이 Worker에서 확인되지 않았다. Worker/Storage 변경이나 배포는 하지 않았다.

## 보호 범위 및 저장소

- 후보 브랜치: rebuild/company-core-r4-20261015; 구현 커밋 bb198fc116de04937fd63b0851e98c77673bfd54, 자산 조사 closeout 0cb30d986957d076d8950238f1ed5e85b6d21e57, 진행 기록 checkpoint cbe8ddd56108989a6eccf32b8a4c2a2798fe2818가 모두 fast-forward push됐다.
- 초안 PR #105: https://github.com/zeroslove-ai/company-v1/pull/105 (OPEN/DRAFT 유지, 설명 갱신 및 이 작업에 연결 완료).
- 원본 canon/content/media/voice 매핑, main, PR #104, R3 runtime/Worker, 원격 DB 및 보존 세이브는 수정하지 않았다. 원본 자료를 삭제하거나 일반 업무 fixture로 대체하지 않았다.
- 실제 실행은 새 로컬 PGlite DB와 새 로컬 게임에만 기록했다. 배포와 main 병합은 수행하지 않았다.

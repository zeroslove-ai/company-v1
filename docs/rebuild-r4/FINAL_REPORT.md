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
- 최신 회귀 실행은 `node --test --test-reporter=spec test/r4-core.test.mjs` 24/24 PASS, `npm test -- --test-reporter=dot` 621/621 PASS다. 예산 경계 회귀 두 개는 합성 PGlite 구조 테스트다. storage URL 변경 후에도 전체 621/621 PASS, `git diff --check` 통과했다. 새 live model call은 없었다.
- 규칙 기억 회귀를 위해 합성 전용 PGlite fixture에서 APPLY/CHANGE/REMOVE 뒤 규칙 이력 8건 창을 넘기고 DB를 재시작한 다음, 특정 과거 이벤트를 회상하는 명령의 다음 Story context에 그 이벤트가 다시 포함되는지 확인했다. 현재 `active_rules`는 빈 상태로 유지됐다. 원인은 메모리 검색 결과의 JSON 레코드가 도메인에 전달되기 전 명시적으로 해석되지 않고, 검색된 과거 이벤트가 최신 16개 이력 제한에서 밀리는 것이었다. 저장소 JSON decoding과 검색 관련도 우선순위를 수정했다. 이 fixture 결과는 합성 구조 검증이며 실제 모델의 규칙 반응 수락 증거가 아니다.
- Story/Observer 예산을 job 수준에서 예약하도록 보강했다. 새 턴과 feedback은 두 호출분, 저장된 Story checkpoint가 있는 retry는 Observer 한 호출분만 예약한다. 단일 DB lock row가 동시 game job의 예약을 직렬화한다. 실제 호출 시작 때 해당 예약을 소비하고 failure·commit·재시작 때 미사용분을 해제한다. 잔여 예산이 부족하면 새 Story를 보내기 전에 요청을 거부하고, UI에 원본 입력 보존 안내를 표시한다. 검증은 새 예산 경계 2개를 포함해 R4 24/24, 전체 621/621 PASS이며 모두 scripted/PGlite 구조 검증이다.
- R4 server가 `R4_PUBLIC_STORAGE_URL` 미설정 때 다섯 원본 portrait에 `asset_url:null`을 내보내던 연결 누락을 수정했다. `runtime-r4/server.js`는 canonical Company Supabase public Storage base를 기본값으로 쓰고, 명시적 `R4_PUBLIC_STORAGE_URL` override를 허용한다. API의 indicator 이름도 URL 설정 여부를 뜻하는 `media_source_configured`로 바꿨다. 격리된 server 4183 (scripted provider, 별도 PGlite, `GET /api/content`만)에서 다섯 exact general image URL 생성이 확인됐다. 이 검사는 모델 서사나 object 접근을 검사하지 않는다. 해당 Jena URL의 HEAD는 DNS 실패 status 000이었다. 기존 server 4182는 새 코드를 읽도록 재시작하지 않았으므로, 이미 떠 있는 process는 여전히 옛 config를 사용할 수 있다.
- 기존 Cloudflare TTS Worker `fancy-dust-7f8c`와 `content/characters.json`의 다섯 원본 `voice_id` 매핑을 확인했다. 실제 장면에서 TTS Worker가 확정 대사에 대한 음성 URL을 반환했고, 윤민아/김제나 대사 재생과 윤민아의 3초 audio player를 확인했다. 저장된 실제 김제나 재생 응답 하나를 대조했을 때 서명 쿼리는 노출하지 않은 채 호스트가 Cloudflare R2이고 경로가 `tts/*.mp3`인 것을 확인했다. Cloudflare의 배포 Worker script API를 read-only로 조회한 소스는 Fish Audio TTS 요청의 `reference_id`에 입력 `voice_id`를 전달하고 결과 MP3를 `tts` R2에 저장한다. `key`가 따로 없으면 UUID `.mp3` key를 만들고 `audio/mpeg` content type만 설정한 뒤 signed URL과 key를 응답한다. R4 `runtime-r4/server.js`도 확정 대사의 원본 heroine `voice_id`, 대사, direction만 보내고 `key`는 보내지 않아 Worker의 기본 UUID 경로를 사용한다. 따라서 기존 설정이 voice-ID 기반 TTS 생성·R2 반환 경로라는 점은 입증된다. R2 목록/custom metadata만으로 다섯 canonical `voice_id`와 파일을 연결할 수는 없지만, 보존된 실제 R4 TTS 응답 하나는 `heroine3`의 확정 대사와 생성 MP3 경로를 함께 기록한다. 서버가 `heroine3`를 원본 voice mapping으로 해석하고 Worker가 그 ID를 Fish Audio `reference_id`로 사용하므로 해당 생성물 하나의 인물 연결은 확인됐다. 이 로컬 증거의 서명 query는 제거했다. 나머지 R2 객체는 voice/dialogue별로 매핑되지 않으며 원본 voice sample로 확인된 것도 없다. R2 bucket에는 `audio/mpeg` MP3 2,813개(427,390,192 bytes)가 열거됐다. 목록의 이미지 object는 0개, 원본 image catalog 102개 경로와 정확히 일치하는 object도 0개였다. 별도 bucket-info 조회는 object_count 2,812를 반환했으므로 한 개 차이는 조회 시점 차이 또는 저장소 갱신 가능성이 있어 고정 수치로 단정하지 않는다. Worker 설정의 `FISH_API_KEY`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` 이름만 확인했고 값은 읽지 않았다. 음성 품질 평가는 하지 않았다.
- 정지/재생/GIF 교체/실패 시 포스터 fallback은 별도 scripted-preview fixture UI에서 확인했다. 이 결과는 모델 서사 검증이 아니다.

## 미검증 및 차단

- 원본 image catalog 102개 항목은 storage reference다. 이전 FINAL_REPORT에는 당시 사용 가능한 원본 object 여부를 확인하지 못했다고 기록했지만, 보존된 GitHub 인수인계 자료를 이번에 찾아 과거 존재 증거를 추가했다. issue #68의 [R3 live result](https://github.com/zeroslove-ai/company-v1/issues/68#issuecomment-5386778945)는 2026-08-25에 대표 URL `Image/Heroine3/jena_main.jpg`가 HTTP 200, `image/jpeg`, 275,914 bytes였다고 기록한다. [media inventory result](https://github.com/zeroslove-ai/company-v1/issues/68#issuecomment-5401918399)는 당시 102/102 active DB rows와 102/102 live JPEG object reconciliation, 102개 다운로드/검수 결과를 기록하고 다섯 원본 general mapping을 확정한다: `heroine1-main -> Image/Heroine1/one_main.jpg`, `heroine2-main -> Image/Heroine2/minami_main.jpg`, `heroine3-main -> Image/Heroine3/jena_main.jpg`, `heroine4-main -> Image/Heroine4/live_main.jpg`, `heroine5-main -> Image/Heroine5/may_main.jpg`. 그 comment는 다운로드한 binary가 Git에 commit되지 않았다고 명시한다. 이 증거는 과거 존재만 입증한다.
- 2026-10-15 재조회에서 Supabase Management API는 Company ref `fmcrspgxstsmxxsmkeee`를 `INACTIVE`로 반환했다. 다섯 general image rows에 대한 새 read-only SQL SELECT는 connection timeout으로 종료됐다. 원본 public hostname을 Cloudflare와 Google DNS-over-HTTPS로 질의한 결과 양쪽 모두 DNS Status 3 (NXDOMAIN)이었다. R4 worktree, 관련 local Codex work directories, Downloads, Temp에서 다섯 canonical general portrait filename을 검색했으나 source copy를 찾지 못했다. R4에 추적된 이미지 파일은 demo PNG/GIF뿐이다. 따라서 과거 원본 object 존재는 역사 증거로 확인됐으나 현재 bytes를 복구하거나 실제 원본 이미지를 표시하지 못했다. 공식 project 복구/재개 또는 원격 DB/Storage 변경은 하지 않았다.
- 별도 AI_웹개발 Supabase `ovltkzwddxsekcfeskds`는 ACTIVE_HEALTHY이고 public image bucket에 598개 object가 있지만, catalog heroine1–5 대표 이미지 경로와 exact match가 0/5이며 heroine2 파일명은 의료 배경 맥락이다. Company 정본 인물 자산이라는 검증 없이 재사용하지 않았다. 해당 bucket에는 audio object도 0개다. 읽기 가능한 Cloudflare account 한 곳의 `tts` bucket에는 MP3 object가 있으나 canonical image 경로는 0/102 일치했다. 전체 저장소 git history/Git LFS, GitHub release metadata, 조직 저장소 및 Company branches의 path/name scans에서도 원본 art/audio binary가 보존된 경로를 찾지 못했다. UI는 원본 URL 실패 시 character-initial fallback을 표시한다.
- content/csa_catalog.json의 기존 규칙 중 이 작업 범위에서 실제 모델로 실행 가능한 비노골적·비강압 preset을 찾지 못했다. 규칙의 구조적 APPLY/CHANGE/REMOVE·재시도·피드백·재시작 검사는 격리된 합성 fixture에 한정한다. 실제 Story/Observer 규칙 발효, 서로 다른 NPC의 첫 반응, CHANGE/REMOVE 뒤 대화 연속성은 미검증이다. 원본 규칙 카탈로그를 새로 만들거나 의미를 변경하지 않았다. 실제 40턴 캠페인의 로컬 history API를 read-only로 다시 집계한 결과, Story와 Observer 각각 40/40 실제 HTTP 요청이 있었지만 2명 이상 NPC가 현장 인물로 기록된 턴은 0/40, RULE_CHANGE 턴은 0/40이었다. 마지막 턴의 현장 인물은 윤민아 1명이다. 따라서 해당 캠페인은 일반 상호작용·기억 검증에는 쓰였지만 두 NPC가 한 규칙 변화에 다르게 반응하는 acceptance를 증명하지 않는다.
- 실제 캠페인 4개 historical projection은 degraded이며 추가 provider 호출은 남은 1회 예산으로 검증할 수 없다.
- 이 판정은 코어 후보 검증 결과다. 모든 원작 콘텐츠·규칙 승인, 전체 출시 승인 또는 사용자 재미 수락을 뜻하지 않는다.


## Supabase/Cloudflare 자산 조사

- Supabase project 목록에는 두 project가 있다. Company Worker가 설정한 company-v1 (`fmcrspgxstsmxxsmkeee`)은 INACTIVE이며 별도 AI_웹개발 (`ovltkzwddxsekcfeskds`)은 ACTIVE_HEALTHY다. metadata 및 기존 Storage catalog는 read-only로 확인했다. 새 Company image-library SELECT는 connection timeout이었다. 과거 R3 GitHub task evidence는 당시 102/102 Company JPEG object가 있었고 다운로드·검수됐음을 증명하지만, bytes가 binary commit이나 현재 local paths에 보존되지 않아 이번 세션에서 회수하지 못했다. public host는 양쪽 DoH resolver에서 NXDOMAIN이다. 공식 project 복구, SQL write/DDL, upload, Worker 변경은 하지 않았다.
- 다른 ACTIVE_HEALTHY project의 public image bucket에는 598개 object가 있으나 canonical media locators와 일치하는 주인공 portrait가 없고 medical-context file naming이 확인돼 Company 그림으로 연결하지 않았다. 오디오 object는 없었다.
- Cloudflare API로 조회 가능한 account는 1곳이며 R2 bucket은 `tts` 1개였다. 13개 Worker의 배포 소스와 binding 설정을 read-only로 검색했으며 별도 Company image/media Worker는 찾지 못했다. 접근 가능한 account의 유일한 R2 binding은 `fancy-dust-7f8c` → `tts` bucket이다. `game-proxy-company-v1`과 `game-proxy-company-r3`는 모두 `TTS_WORKER` service binding만 `fancy-dust-7f8c`에 연결하고 R2 또는 static `ASSETS` binding은 없다. 조회된 `ASSETS` binding 둘은 `yuri-*` preview Worker에 있고 Company Worker와 다르다. generic `game-proxy-v2`의 Supabase hostname은 이미 별도 AI_웹개발 ref `ovltkzwddxsekcfeskds`로 확인된 프로젝트이며, 해당 project의 598 image objects는 canonical Company portrait 경로와 일치하지 않는다. 이 조사는 연결된 Cloudflare account 범위 내 결과이며 다른 접근 불가능한 account에 대한 부재 증명은 아니다. `fancy-dust-7f8c`에는 TTS Worker의 `FISH_API_KEY`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` secret 이름이 있다. 기존 TTS 경로는 R4 health 및 live audio playback에서 동작했다. Worker/Storage 변경이나 배포는 하지 않았다.
- GitHub organization `zeroslove-ai`에서 16개 저장소가 조회됐다. Read-only recursive Git-tree 경로 검색은 기본 브랜치가 있는 15개 저장소를 대상으로 했으며 (`slack`은 기본 브랜치가 비어 건너뜀), 조회한 tree는 모두 전체 결과였다. 추가로 Company 저장소의 126개 branch에서 123개 고유 tip tree를 검사했다. 모두 non-truncated이며 canonical 102 image locator basename/ID, 다섯 voice ID, 다섯 heroine 이름 일치는 0건이다. Company 저장소 tag는 0개다. 16개 조직 저장소 release asset 파일명에서도 canonical 인물·자산명이나 image/audio 확장자 일치가 없었다. `artist-cabi` 기본 branch에는 이미지/음성 확장자 파일 463개가 있지만 Company marker 경로는 없고, `avatar-lab`에는 해당 미디어 파일이 없다. 이 결과는 metadata/경로만 확인한 것으로 무관한 opaque binary 안에 Company 그림이 있다는 가능성까지 증명하진 않는다. 저장소를 clone하거나 수정하지 않았다.

## 보호 범위 및 저장소

- 후보 브랜치: `rebuild/company-core-r4-20261015`; 예산 예약 구현 `219478e`, 후속 보고/branch-scan 문서 commit `1674a69`까지 origin에 일반 push됐다. 현재 URL-wiring 수정과 이 checkpoint 보고는 commit/push 전이다. PR #105 설명에는 voice generation 경로, 한 건의 saved MP3 attribution, Cloudflare binding 조사, organization path scan, 실제 campaign coverage 한계, 이번 historical image-source 증거가 반영돼 있다.
- 초안 PR #105: https://github.com/zeroslove-ai/company-v1/pull/105 (OPEN/DRAFT 유지, 설명 갱신 및 이 작업에 연결 완료).
- 원본 canon/content/media/voice 매핑, main, PR #104, R3 runtime/Worker, 원격 DB 및 보존 세이브는 수정하지 않았다. 원본 자료를 삭제하거나 일반 업무 fixture로 대체하지 않았다.
- 실제 실행은 새 로컬 PGlite DB와 새 로컬 게임에만 기록했다. 배포와 main 병합은 수행하지 않았다.

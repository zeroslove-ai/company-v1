# Company R4 후보 최종 보고서

**판정: `PARTIAL_BLOCKED`**

## 구현과 콘텐츠 연결

- 원본 `content/characters.json`, `map.json`, `organization.json`, `positions.json`, `media_catalog.json`을 변경하지 않았다. Setup은 원본 부서 6개와 직급 4개를 사용한다.
- 실행 경로는 `content loader → scene context builder → Story provider payload`다. 현재 장면과 관련된 원본 캐릭터의 극화 카드 및 플레이어만 아는 앱 전제가 Story context에 들어가고, Observer에는 확정 장면에 연결할 수 있는 원본 미디어 후보가 별도로 전달된다.
- **실제 Story payload 전송과 생성 결과는 확인하지 못했다.** 로컬에 승인된 Story/Observer 모델 설정이 없기 때문이다. 기존 게임 `4dc4ba9c-afe3-4618-8635-ac86313cde3e`의 두 결과는 실제 모델물이 아니라 `scripted-preview`였으며, 첫 결과에는 내부 캐릭터 라벨이 노출되고 다음 결과는 일반 사무실 문장으로 평준화됐다. 이 저장 결과는 보존하고 UI에 구조 검증 스크립트 결과로 표시한다.
- 현재 읽기 UI에는 Story와 전체 선택지/짧은 선택 버튼/자유 입력, 지도, 현장 인물, Mind Monitor, 장면 미디어, 음성 제어, 기록, 피드백, 재시도와 로컬 저장 표시가 있다. Observer가 확정한 현재 인물·장면에 맞는 이미지 힌트를 사용하고, 근거 없는 이미지는 선택하지 않는다.
- 102개 원본 이미지 참조와 다섯 캐릭터의 `voice_id` 매핑을 보존했다. TTS는 Observer가 확정한 인물의 실제 Story 대사·발화 지시·근거 인용이 현재 장면과 일치할 때만 서버가 허용한다. 캐릭터 음성은 기본 꺼짐이다.

## 실행 방법과 로컬 화면

- 작업 브랜치: `rebuild/company-core-r4-20261015`
- 구현 커밋: `fc13366aa70c974683e028d776a392b02c6f540e`
- 보고서/최종 상태 커밋: `b780ba4d66977085a49d6066d8caea518f6658b3`
- 마지막 closeout 문서 갱신 전 push된 branch tip: `e5b31050ae7647cfd20fa41c3c38dc4cef7e4aa6`
- Draft PR: [#105](https://github.com/zeroslove-ai/company-v1/pull/105) (open, draft, base `main`)
- 로컬 실행: `npm run r4:dev`
- 새 게임 진입: `http://127.0.0.1:4174/?fresh=1`
- 현재 브라우저의 새 Setup 게임: `http://127.0.0.1:4174/?gameId=3d0ecd06-f392-4fa1-9040-46baf3b4d2d2`
- 로컬 DB: `var/r4-local-postgres/` (디스크 기반 PGlite; 새 로컬 게임만 사용)
- 저장 복원 증거: 서버 프로세스 재시작 뒤 기존 로컬 게임의 2번째 확정 턴과 `scripted-preview` 출처가 다시 조회됐다. 이건 DB 복원 증거이며 실제 모델/콘텐츠 승인 증거가 아니다.

## 검증 결과

- `npm test`: 608/608 통과. 이는 구조·회귀 검사다. 포함된 scripted 40턴 fixture와 합성 1,005턴 저장소 검사는 실제 모델 캠페인이나 제품 서사 PASS가 아니다.
- R4 핵심 테스트 11개 통과. Setup 카탈로그 수정 후 캐릭터 투영 테스트도 재통과했다. 서버/콘텐츠/관찰/TTS/화면 JavaScript 구문 검사와 `git diff --check`를 통과했다.
- 브라우저에서 Setup의 원본 부서 6개/직급 4개, 작은 화면의 읽기 UI, 선택지와 자유 입력, 지도·현장 인물, 이미지 부재 안내 및 음성 부재 안내를 확인했다. 1280×900 및 390×844 검사에서 가로 넘침과 브라우저 콘솔 오류가 없었다.
- 별도 로컬 scripted DB에서 Setup→Opening→1턴→확정 저장→새로고침 복원, GIF 정지/재생 및 정지 이미지 fallback을 확인했다. 모두 fixture 구조 증거다.
- 모델 호출: `0 / 120`, 잔여 `120`. 실제 모델 40턴 기억 캠페인 및 8–12턴 경계 캠페인은 실행하지 않았다.

## 차단 항목과 남은 결함

- `LLM_API_URL`, `LLM_API_KEY`, `STORY_MODEL`, `EXTRACT_MODEL`이 없어 원본 인물을 사용한 대표 Story, 실제 payload 전송, 캐릭터별 말투/감정 연속성, 기억 캠페인 모두 미검증이다. scripted 결과를 대신 PASS 처리하지 않았다.
- 저장소에 원본 이미지 픽셀/음성 파일이 없고 `R4_PUBLIC_STORAGE_URL`, `R4_TTS_API_URL`도 없다. UI는 원본이 없는 상태를 표시한다. 실제 원본 장면 그림 출력, 성인 이미지 풀 도달성/거절 안전성, TTS 합성·재생은 미검증이다.
- 기존 UI와 원본 참조·voice mapping은 연결했으나 외부 서비스 없는 환경에서 실제 미디어 출력을 복구했다고 주장하지 않는다. 전체 제품 출시나 사용자 재미 수락도 주장하지 않는다.

## 자산 보호와 저장소 상태

- Canon, 원본 캐릭터/지도/조직/직급/미디어 카탈로그, `runtime-r3`, `frontend-r3`, 기존 migration, main, PR #104, R3 Worker, 원격 DB 및 보존 세이브는 변경하지 않았다. 커밋 파일은 R4 후보 구현과 지시/보고 문서에 한정된다.
- 원격 후보 브랜치를 push 전 fetch하여 사용자 제공 기준 SHA `766cf2b354b41e2338d3d24dcfaee8dd168a705f` 이후 원격 커밋이 없는 것을 확인했다. main 병합·배포·force push는 하지 않았다.
- 별도 `company-v1-r4-source` main checkout에는 확인 시점에 이미 staged 삭제가 있었다. 해당 checkout은 읽기 전용 상태 확인만 했고 변경하지 않았다.

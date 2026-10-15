# Company R4 — 후보 최종 보고서

**판정: `PARTIAL_BLOCKED`**

## 콘텐츠 연결과 수정한 누락

- 실제 저장된 기존 게임 `4dc4ba9c-afe3-4618-8635-ac86313cde3e`의 2턴을 읽었다. 두 턴 모두 출처가 `scripted-preview`였다. 첫 턴은 서원희의 내부 분류 라벨을 Story처럼 노출했고, 다음 턴은 일반 회사 문장으로 평준화됐다. 실제 모델 생성 결과는 기존 DB에 없었다. 이 역사 자료는 보존했다.
- 기존 R4 source path는 `content/characters.json` / `map.json` → `runtime-r4/domain/content.js` → `runtime-r4/domain/context.js` → `runtime-r4/adapters/provider.js` JSON request다. 이 path는 원본 캐릭터 극화 카드와 “플레이어만 비밀 앱을 안다”는 정본 premise를 구성하도록 되어 있다. 실제 model configuration이 없어서 실제 HTTP payload와 생성 Story는 관찰할 수 없었다.
- 원래 R4 context는 매 턴 `active_rules: []`로 고정되어 있었고 `RULE_CHANGE` command/pipeline이 없었다. 이번 후보 변경은 versioned APPLY/CHANGE/REMOVE, prospective rule state, 역사 이벤트, Story context 지시, Observer의 쓰기 권한 배제, 원자 Commit, 재시도/피드백의 구조화 명령 보존, 다음 턴의 규칙·관련 기억 회수를 연결했다. 규칙 발효·변경·제거 결과는 같은 Story 턴과 함께 저장한다.
- 다만 원본 `content/csa_catalog.json`에는 규칙 21개가 있으며 전부 성적 또는 친밀 콘텐츠다. 이번 범위에 허용되는 비노골적 대표 규칙은 없다. 카탈로그를 새로 만들거나 의미를 바꾸지 않았으며, 성적 규칙 문구를 Story provider로 보내지 않았다. 따라서 실제 앱의 RULE_CHANGE HTTP 경로는 `r4_non_explicit_canonical_rule_unavailable` (503)으로 fail-closed다. 규칙 엔진 테스트의 합성 설명은 격리된 구조 fixture이며 제품 preset이 아니다.

## 구조 검증

- `npm test`: **609/609 통과**. `test/r4-core.test.mjs`: **12/12 통과**. `git diff --check` 통과.
- 임시 PGlite DB의 synthetic structural fixture에서 Story 실패 후 active rule이 저장되지 않는 것, 같은 구조화 명령으로 재시도, 피드백 revision에서 원본 명령 유지, 규칙 발효 후 일반 턴에서 active/history 전달, 9번째 턴의 과거 규칙 memory retrieval, CHANGE에서 새 규칙만 active, REMOVE 뒤 active set 비우기, Observer가 `active_rules`를 위조해도 무시, 서버 종료/재시작 후 snapshot 복원을 확인했다.
- 이 검사는 fake provider와 test-only descriptor를 사용했다. 서로 다른 원본 인물 카드 두 개가 context에 실리는 것과 저장/상태 경계만 확인했다. 캐릭터 반응 서사, 실제 Story→Observer payload, 제품 규칙 작동의 PASS가 아니다.
- 새 local server `4177`의 `/api/health`: `company-unconfigured`, model calls `0/120`, source media reference 102개, source heroine voice mapping 5개, 이미지 storage 없음, TTS 설정 없음. RULE_CHANGE 요청은 HTTP 503으로 거절된다.

## 실행 화면과 자산

- 실행: `npm run r4:dev`
- 업데이트된 서버를 별도 임시 DB로 띄우는 명령(PowerShell): `$env:PORT='4177'; $env:R4_DB_PATH='var/r4-rule-check-db'; npm run r4:dev`
- 새 게임 화면: [http://127.0.0.1:4177/?gameId=328140e6-9432-42bf-9b04-cb1e02734350](http://127.0.0.1:4177/?gameId=328140e6-9432-42bf-9b04-cb1e02734350) — Setup 상태이며 모델 설정이 없어 Story는 생성되지 않았다.
- 기존 읽기 중심 UI, 지도, 대사/선택지/자유 입력, Mind Monitor, 캐릭터 초상, scene media, voice control, History, 피드백/재시도 경로는 이 변경에서 유지했다. 이번 checkpoint에서 frontend 파일은 수정하지 않았다. 앞선 브라우저 검수는 desktop 1280×900 및 mobile 390×844에서 overflow/console 오류가 없었고, Setup→Opening→한 턴→DB→reload 및 GIF 정지/재생/poster fallback을 별도 fixture로 확인했으나 모두 actual-model narrative 증거는 아니다.
- `content/media_catalog.json`의 102 reference와 다섯 heroine의 `voice_id` mapping은 수정하지 않았다. 이미지 픽셀/오디오 바이트와 공개 저장/TTS endpoint가 없어 실제 장면 그림 표시와 음성 합성/재생은 미검증이다.

## 미검증과 남은 차단

- 사용할 수 있는 Story/Observer 모델과 승인된 credential/environment가 없어 원본 인물 장면, 실제 payload 전송, 두 인물의 개별 첫 반응, 이후 적응 대화, 실제 Mind Monitor, model 기반 기억·경계 캠페인을 검증하지 못했다. 실제 모델 사용량은 **0회**, 예산 잔량은 **120회**다.
- 현재 원본 규칙 카탈로그에는 이번 실행에서 다룰 수 있는 비노골적 preset이 없다. 제품 RULE_CHANGE·공식 발효·NPC 반응 acceptance는 미완료다. synthetic 구조 테스트를 이 결과로 대체하지 않았다.
- 이미지/TTS storage/service가 없어 장면 이미지와 원본 음성을 플레이 중 재생하는 검증도 남아 있다. UI의 연결 및 fallback은 보존/검증했지만 실제 asset output PASS가 아니다.
- 따라서 전체 제품 완성, 모든 규칙/콘텐츠 검수, 출시 또는 사용자 재미 수락을 주장하지 않는다.

## 브랜치와 보호 범위

- Branch: `rebuild/company-core-r4-20261015`; 구현 checkpoint: `e6d51a1` (`feat: add R4 prospective rule lifecycle core`). 최종 closeout report/progress는 뒤따르는 문서 commit에 기록한다.
- Draft PR #105: https://github.com/zeroslove-ai/company-v1/pull/105 (기존 PR을 갱신, draft 유지).
- 커밋 전 `origin/rebuild/company-core-r4-20261015` fetch 결과 원격/로컬 기준은 같았고, push는 fast-forward만 사용한다. force-push/merge/deploy하지 않는다.
- 원본 canon/content, `runtime-r3`, `frontend-r3`, 기존 migration, main, PR #104, R3 Worker, 원격 DB 및 보존 세이브를 수정하지 않았다. 기존 `4dc…` 게임은 읽기만 했다. 테스트 및 실행 데이터는 새 임시 로컬 PGlite DB를 사용했다.

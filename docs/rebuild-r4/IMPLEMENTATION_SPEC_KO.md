# Company R4 — 자산 보존형 실행 코어 재구축 명세

작성: 2026-10-15 KST
저장소: zeroslove-ai/company-v1
작업 브랜치: rebuild/company-core-r4-20261015
분기 기준 main: 7780759fd595247bd05d13f89ce44847e4551d8a
감사 기준 PR #104: 28dc0ee4d1428cf93d9eb79e4aab0661feaa0dda
상태: 후보 구현 완료, PARTIAL_BLOCKED. 실제 모델 서사/미디어 수락 또는 배포 완료를 뜻하지 않는다.

## 0. 결정과 범위

선택은 ‘전체 제품을 버리고 재개발’도 ‘기존 분기마다 예외 추가’도 아니다. `CURRENT_TRUTH.md`와 `docs/redesign/COMPANY_CANON.md`가 정의하는 기존 성인 캐릭터 인터랙티브 픽션, 회사 세계·캐릭터, 개인 앱 전제, 지도·프로필·읽기 UI·이미지 및 음성 매핑을 보존하고 입력에서 다음 턴 컨텍스트까지의 실행 코어를 새로 작성한다. Story 1회 → Observer 1회 → reducer → atomic Commit이라는 두 호출 골격과 서버 주도 처리는 유지한다.

사용자는 새 설계와 새 브랜치 및 한 번 전달해 이어서 수행할 Codex 지시문 작성을 요청했다. 이 브랜치는 그 요청에 따른 독립 후보 작업이다. 기존 main의 수동 플레이 잠금과 기존 R3 배포는 유지한다. 사용자가 실행 지시문을 전달하면 아래 범위의 구현을 진행하며, 단계별 사용자 승인을 반복해서 요구하지 않는다.

범위는 서사·기억·상태·저장·복구·표시 엔지니어링이다. 회의실, 점심 약속, 사내 공지, 당번 지정과 같은 예는 테스트/데모 fixture일 뿐이며 기본 Story 콘텐츠나 세계관, 제품 acceptance가 아니다. fixture 실행은 배관·저장·복구의 구조 증거로만 기록한다. 먼저 실제 원본 인물을 사용한 대표 장면으로 캐릭터성·세계관·연속성을 검수하고, 방향 확인 전에는 fixture 장기 캠페인을 제품 품질 검증으로 확대하지 않는다. 노골적 성적 콘텐츠 생성 및 성적 강압 기능의 구현·개선은 대상이 아니다. 기존 원본 데이터와 미디어 참조는 바꾸거나 삭제하지 않는다.

2026-10-15 소유자 보충 지시: `CURRENT_TRUTH.md`와 `COMPANY_CANON.md`가 정본이다. 기존 성인판 정체성, 플레이어만 아는 앱 전제, 캐릭터의 극화 가능한 설정, 이미지·음성 매핑과 화면을 보존한다. 설정 파일을 통째로 Story payload에 싣지 말고 현재 장면·대상 인물에 맞는 캐릭터 설정을 context builder에서 투영한다. 미디어는 Observer의 확정 장면 근거와 연결한다. 점심·공지·당번 등 별도 예시 콘텐츠는 기술 fixture다. 원본 캐릭터/세계관을 새로 정의하거나 일반 회사 시뮬레이터로 대체하지 않는다. 이 지시는 성적 강압 규칙 엔진의 신규 구현을 허가하지 않으며 코어 후보 완료는 전체 제품 동등성/출시 승인이 아니다.

### 보존 / 교체 / 제외

- 보존: 원작 성인 캐릭터/세계 전제, 이름·직책·극화 설정, 회사 지도, 프로필, 읽기 중심 UI, 자유 입력, Story의 4개 선택지와 짧은 버튼, History, 수정 요청, NPC 내면, 장면에 맞는 원본 이미지, 기존 voice ID 기반의 선택형 TTS.
- 교체: 자유 입력 사전 결과 판정, 컨텍스트 조립, Observer 정규화, 상태 reducer, 턴/재시도/피드백 실행기, 저장소 경계, 화면의 턴 버전 동기화.
- 신규: 중요한 과거 기록 회수, 원본 명령 보존, 필드별 관찰 신선도, GIF 표시와 정지 대체 이미지.
- 제외: 새 프레임워크 이주, Rust 이식, 범용 관계/감정/행동 엔진, 벡터 DB, 멀티에이전트 게임 런타임, 무한 Story 재생성, 운영 세이브 자동 변환, 새 유료 서비스.

R4는 작업 이름일 뿐이다. R3 파일을 통째로 복사해 이름만 바꾸거나 R3를 호출하는 wrapper이면 재구축으로 인정하지 않는다. 단, 검증된 순수 렌더·유틸리티의 선별 재사용은 가능하며 가져온 파일/함수와 이유를 적는다.

## 1. 근거와 불확실성

2026-10-15 감사 보고서 F01~F10을 실패 사례 목록으로 사용한다. 보고서는 전체 저장소 전수 감사가 아니며, 모든 과거 실패 원인을 증명하지 않는다. 원본 함수 재현과 소스 추론, 실제 DB/모델 미검증을 구분한다. Codex는 작업 시작 시 핵심 경로를 직접 확인하고 기준 SHA 차이를 기록한다.

| 근거 | 이번 설계에서 제거할 원인 |
|---|---|
| F01 | 자유 입력 정규식이 Story 전 장소와 Commit 후 장소를 선결정 |
| F02 | 기본 NPC 배치를 매 턴 실제 출연자로 재주입 |
| F03/F04 | 고정 기억 창·본문 앞부분 절단·규칙 변경 시 대화 이력 삭제 |
| F05 | 추출 실패와 명시적 빈 값 혼동, 서로 다른 근거 강도 |
| F06/F07 | 피드백에서 구조화 작업 유실, 저장소별 job 필드 불일치 |
| F08 | 전체 history 반복 조회와 섞인 버전 readback |
| F09 | 모델 부분 응답을 완결로 취급 |
| F10 | 턴 중 대사자와 턴 종료 시 현장 인물을 같은 것으로 취급 |

주요 원본 경로: runtime-r3/domain/{navigation,content,memory,observer-normalizer,reducer,contracts}.js, runtime-r3/server/{worker,provider,store,supabase-store}.js, frontend-r3/{app,r3-client,r3-view-model}.js, supabase/migrations/20260822*_company_r3_*.sql 및 20260824142913_company_r3_rule_change_event_fence.sql.

PR #104는 참고용이다. 자동 병합·전체 cherry-pick을 하지 않는다. 불러올 필요가 있는 작은 수정은 원인과 새 설계의 소유 경계를 비교하고 선택한다.

## 2. 구현 배치와 첫 번째 산출물

기존 JavaScript ESM 계열을 유지한다. 새 코드의 타입은 JSDoc과 입출력 검증으로 명확히 하고, 언어/번들러 교체를 새 작업으로 만들지 않는다.

```text
runtime-r4/
  domain/       # command, snapshot, context, observation, reducer
  application/  # 하나의 turn pipeline; 재시도/피드백은 같은 pipeline 사용
  adapters/     # 모델 제공자, 저장소, HTTP/SSE, 시계
  prompts/      # Story/Observer의 짧은 단일 템플릿
frontend-r4/    # 새 controller + view-model; 기존 읽기 중심 디자인 재사용
  assets/      # 권한이 확인된 일반 GIF/정지 대체 이미지
supabase/r4/    # R4 전용 DDL/RPC와 로컬 적용 도구; 기존 migration과 분리
scripts/r4/    # dev, DB, 검증, export, 기본 비파괴 실행
test/r4/      # 위 경계에 대한 실제 코드 검사
docs/rebuild-r4/  # 이 명세와 진행/최종 보고
```

root npm test/기존 배포 설정은 제거하지 않고 R4 스크립트만 추가한다.

첫 구현 checkpoint부터 Setup → Opening → 자유 입력 → Story 표시 → 실제 저장 → 새로고침이 연결된 얇은 전체 흐름을 제공한다. 먼저 빈 폴더·추상 인터페이스·테스트 수십 개만 만들고 UI 연결을 마지막으로 미루지 않는다. 구조 검증용 화면만 납품하지 않고 기존 회사편 읽기 화면으로 연결한다.

R4의 실행 의존성에서 구형 turn pipeline, navigation postcondition, memory builder, mutable frontend store를 호출하지 않는다. 콘텐츠/순수 표현 재사용과 실행 코어 의존성을 구분한다. 전환 전까지 R3는 삭제하지 않는다.

## 3. 데이터 계약과 필드별 소유권

필드 이름은 한 가지 snake_case 계약으로 통일한다. 별칭을 여러 호출부에 추가하는 방식으로 정합성을 맞추지 않는다.

```text
Command
  schema_version, command_id, game_id, expected_state_revision
  kind: OPENING | FREE_ACTION | RULE_CHANGE
  literal_action                    # FREE_ACTION의 원문; 의미 재작성 금지
  rule_change                       # RULE_CHANGE만의 구조화 작업, 그 외 null
  created_at

RuleChange
  operation: APPLY | CHANGE | REMOVE
  rule_id, template_id, selectors, expected_rule_version
  # 승인된 일반 예제만. 임의 실행 DSL/모델 생성 규칙 없음.

TurnRecord
  game_id, turn_number, turn_revision, command, command_hash
  state_before_revision, state_after_revision
  content_version, prompt_version, provider_model
  story_text, narrative_body, choices
  observer_raw, observer_applied, warnings, projection_status
  state_before, state_after, turn_digest, context_manifest

Snapshot
  game_id, state_revision, committed_turn, turn_revision, content_version
  profile, time, scene, active_rules, clothing, projection_meta

scene
  location_id, present_actor_ids, scene_note

projection_meta
  status: complete | degraded
  # 핵심 필드별 last_verified_turn 및 unverified 사유; 게임 능력치가 아님
```

원본 명령은 durable TurnRecord에도 보관한다. jobs 테이블에만 남겨서 피드백·history에서 사라지게 하지 않는다. command_hash는 서버가 정규화된 JSON에서 계산한다. 실제 DB와 인메모리 adapter는 같은 Command/Snapshot/Job DTO를 반환해야 한다.

소유권은 다음과 같다.

1. 이름/직책/기본 설정: 콘텐츠와 검증된 profile. Observer가 수정하지 않는다.
2. 규칙 목록/범위/버전: 구조화된 명령 적용기 하나. Observer가 재해석하지 않는다.
3. 자유 입력의 사건 결과: 완료된 Story. 사전 regex가 성공/이동/반응을 확정하지 않는다.
4. 실제 장소·출연자·복장·장면 메모: Story 근거를 확인한 작은 reducer 하나.
5. choices·NPC 내면·화자·focal·GIF·TTS: 표현 자료. 게임 상태를 쓰지 않는다.

기본 NPC 배치는 새 게임의 초기 배치에서만 확정값으로 사용한다. 이후에는 ‘보통 이곳에서 일함’이라는 참고 설정일 뿐 실제 존재 증거가 아니다. departed/present/participants/focal 등의 별도 mutable 명단을 여러 개 유지하지 않는다. entered/exited는 근거 자료로 쓸 수 있지만 최종 present_actor_ids 외 별도 정본으로 만들지 않는다.

## 4. 단일 실행 파이프라인

```text
명령 예약 + 같은 버전의 pre-turn snapshot 고정
 → 준비: 구조 검증; 규칙 명령이면 prospective rule set 계산
 → context: 변하지 않은 실제 scene + 현재/예정 규칙 + 역사 구분
 → Story 1회; 원본 스트리밍, 정상 종료 확인
 → Observer 1회; 같은 완결 Story만 관찰
 → 관찰 검증 + 한 reducer
 → Story/명령/상태/근거/digest/revision/job를 원자적으로 Commit
 → 확정 receipt 표시; 미디어/음성은 별도 비차단 표시
```

자유 입력을 보존한다. ‘회의실로 가지 않는다’, ‘갈까 고민한다’, ‘동료에게 회의실로 가라고 말한다’는 플레이어 이동 완료가 아니다. 목적지 후보를 맵 표시/검색에 쓰는 것은 가능하지만 state에 미리 쓰지 않는다. Story에 없는 자발적 플레이어 행동을 덧붙이지 않는 규칙은 짧은 Story 계약으로 제시하며, 예외 정규식 사전을 새로 만들지 않는다.

규칙 작업은 scene과 최근 대화를 보존한 채 prospective active_rules와 변경 이력을 구분해 제공한다. 이전 규칙은 historical이라는 자료일 뿐 현재 권한이 아니다. Story 실패 시 규칙도 아직 적용되지 않는다. 규칙 자체의 명시적 공지를 서버가 표시한다면 이벤트당 한 번만 생성하고, 합쳐진 같은 텍스트를 관찰·저장한다.

정책의 변경과 실제 행동을 혼동하지 않는다. 일반 예로 ‘재킷 착용 의무’를 제거했다고 캐릭터의 실제 재킷이 즉시 벗겨지는 것은 아니다. 실제 상태는 관찰에 남기고 요구 사항은 rule set에 남긴다. 오래된 정책을 현재 정책으로 되살리거나 예제용 제한을 전체 원본 콘텐츠의 새 정본으로 선언하지 않는다.

### 시작/재시도/피드백

- OPENING도 공통 pipeline의 mode다. 예약·중복·stream 종료 처리를 별도 복사하지 않는다.
- 새 턴: 새 command_id. expected revision 불일치는 409와 최신 receipt로 반환한다.
- 동일 command_id + 동일 hash: 기존 job/receipt 반환. Story 재호출하지 않는다.
- 동일 command_id + 다른 hash: 명시적 충돌. 기존 명령을 덮어쓰지 않는다.
- 실패 재시도: 원본 명령을 서버에서 읽고 새 attempt_no로 같은 명령을 실행한다. 브라우저에 명령 재구성 책임을 주지 않는다.
- 실패 입력 수정: 별도 command_id와 supersedes 관계를 기록한 새 요청으로 처리한다. 실패 명령을 조용히 바꾸지 않는다.
- 피드백: 마지막 턴만 대상. 그 턴의 state_before + 원본 Command + feedback_text로 같은 pipeline을 실행한다. gameplay turn은 늘지 않고 turn/state revision만 증가한다.
- 피드백 후 오래된 digest/media/context cache는 새 revision으로 갱신하거나 무효화한다. 실패하면 기존 revision 전체가 남는다.
- 실제 모델 호출까지 exactly-once라고 약속하지 않는다. 보장 대상은 commit 효과의 중복 방지다.

### 연결/프로세스 중단

jobs는 원본 command, attempt, pre-turn revision, stage, 완성 Story를 체크포인트로 남긴다. 브라우저 취소는 성공한 commit을 되돌리는 뜻이 아니다. 재접속은 job를 읽으며 자동 Story 재생성하지 않는다. 완료 Story가 저장됐다면 명시적 복구는 관찰/저장 단계부터 이어갈 수 있다.

실행 프로세스 종료 시 무한 processing으로 남지 않게 stage lease와 오래된 attempt 차단을 구현한다. Cloudflare waitUntil만으로 영구 실행이 보장된다고 간주하지 않는다. 로컬/Worker 양쪽은 공통 pipeline과 같은 job 계약을 사용한다. reset은 epoch/revision을 바꾸고 늦은 callback/commit을 무효화하며, 진행 중 명령과 경쟁해 이전 세이브가 부활하지 않게 한다.

## 5. Observer와 부분 실패

Observer는 한 번만 호출하고 핵심 관찰과 선택적 표현 자료를 논리적으로 구분한다. state 임의 JSON patch 권한은 주지 않는다. 알 수 없는 필드/ID는 무시 또는 오류로 분류한다.

관찰 필드는 ‘확인해서 값이 있음’, ‘확인해서 비어 있음’, ‘이번에 관찰하지 못함’을 구분한다. null/누락을 무조건 삭제로 해석하지 않는다. scene_note를 확인하지 못한 경우 예전 메모를 최신 확정처럼 제시하거나 조용히 지우지 말고 unverified로 표시한다.

근거는 정확한 Story 구간과 actor/location 참조를 묶는다. 일치하는 문구가 있다는 사실만으로 그 actor의 행동이라고 판정하지 않는다. 검증은 ID·범위·참조·형식의 경계이며 새로운 의미 심판 엔진은 아니다. 의미가 맞는지는 실제 Story→관찰→다음 문맥 검수로 확인한다.

전체 Observer 실패 시 완결 Story는 committed/degraded로 보존 가능하다. 명령 소유 규칙 변화는 그대로 원자적으로 확정하되 관찰하지 못한 장소·복장 등을 확인됐다고 주장하지 않는다. 다음 Story에는 최신 원문과 필드의 last_verified 정보가 함께 전달되며, unverified 상태가 최신 서사를 덮지 않는다. 다음 정상 관찰은 최종 scene snapshot을 근거 있게 갱신해 복구할 수 있다. 실패를 감추는 보정 Story/제3의 심판 호출은 금지한다.

Story의 정확한 최종 선택지 문자열은 deterministic parser가 복사한다. Observer에게 같은 긴 문장을 다시 생성하게 의존하지 않는다. 원본에는 없던 선택지 채우기, 과거 선택지 재사용은 하지 않는다. 4개가 유효하지 않으면 읽을 수 있는 Story와 자유 입력을 남기고 choice projection만 경고한다.

대사한 뒤 퇴장한 사람의 대사는 이번 턴 dialogue에 남을 수 있다. final presence, turn speakers, display focal을 서로 다른 읽기 용도로 취급한다. NPC 내면은 표현 해석이지 다음 Story의 새 사건 사실이 아니다. 플레이어 생각은 직접 제시한 내용 외에 만들어 넣지 않는다.

## 6. 기억과 컨텍스트

기억은 고정 설정 / 현재 상태 / 최근 온전한 원문 / 관련된 과거 기록 네 부분이다. 모델 호출마다 새로 계산하며 대화 세션의 암묵적인 기억에 기대지 않는다.

- 기본 최근 원문은 최신 6턴을 온전한 턴 단위로 포함한다. 이는 초기 운영값이며 측정 후 조정 가능하다. 마지막 2턴은 우선 보존한다.
- 텍스트 앞 N자 절단은 금지한다. 예산이 부족하면 오래된 턴 전체를 제외하고 그 턴의 근거 있는 digest를 사용한다. 마지막 2턴조차 들어가지 않으면 작은 출력 예산/설정을 명시적으로 조정하거나 overflow를 보고하며 몰래 자르지 않는다.
- narrative_body와 제안 choices를 분리해 미선택 제안을 실행된 역사로 주입하지 않는다. 원본 story_text는 그대로 보관한다.
- turn_digest는 기존 Observer의 같은 응답에서 간결한 사실 요약, 관련 actor_ids, 검색어, 중요 표시, source turn/revision을 받는다. 별도 매 턴 요약 LLM을 추가하지 않는다.
- digest 실패 시 본문 앞 600자를 요약이라고 저장하지 않는다. missing으로 표시하고 해당 원문을 검색 후보로 사용할 수 있게 한다.
- 원문/요약은 durable storage에 유지한다. 과거 관련 후보는 인물·명시 주제·텍스트 검색과 중요한 사건을 조합해 찾고, dedupe 후 시간순으로 제시한다. 단순 최근 24개로 다시 제한하지 않는다.
- 초기 retrieved digest 예산은 최대 12개. 같은 인물의 중요 약속/갈등/도움은 단순 최신 일상 기록에 전부 밀리지 않게 한다. 이 값은 게임 상태가 아닌 검색 설정이다.
- 과거 규칙 발효/철회는 역사다. 현재 규칙 set은 별도 우선 자료로 전달한다. 규칙 변경 때 history를 비우지 않는다.
- 요약의 출처 revision이 수정됐으면 그 요약을 재사용하지 않는다. 삭제/정정된 사실을 다른 cache에서 부활시키지 않는다.
- context_manifest에 포함된 원문 turn/revision, digest 출처, 제외 이유, token estimate/실측 구분, content/prompt version을 남긴다. 개인정보와 실제 비밀키는 기록하지 않는다.

검색 점수는 플레이어 행동 허가 점수가 아니다. 복잡한 관계표·호감도·행동 taxonomy를 만들지 않는다. 처음부터 벡터 DB, 지식 그래프, 누적 요약의 끝없는 재요약을 도입하지 않는다. 근거 자료의 관련성·누락을 실제 긴 플레이로 평가한다.

provider prompt cache는 비용/지연 최적화일 뿐 게임 기억이 아니다. 자체 cache를 만들면 game/state/turn revision, content/prompt version을 key에 포함한다. 다른 게임의 기억 혼입을 금지한다.

## 7. 저장·읽기·실제 DB

R4는 기존 세이브를 그대로 쓰지 않는다. 별도 로컬 PostgreSQL DB 또는 이미 승인된 독립 개발 DB에서 company_r4_*만 사용한다. 기존 프로젝트의 원격 DB를 활성화하거나 migration/repair하지 않는다. 새 테이블도 기존 원격 DB에 묵시적으로 만들지 않는다.

최소 테이블은 game/state, commands/jobs, turns/revisions이다. digest는 turn/revision에 붙일 수 있으며 별도의 gameplay event-sourcing 시스템으로 확장하지 않는다.

Commit은 한 DB transaction에서 상태 revision과 attempt fence를 확인하고 원본 명령, Story, 관찰, state_before/after, digest, turn revision, job 완료를 함께 저장한다. 필요한 unique 제약과 parameterized SQL을 사용한다. 성공 receipt도 그 transaction 결과의 버전을 반환한다.

실제 저장소와 인메모리는 DTO뿐 아니라 중복/충돌 의미도 동일해야 한다. 인메모리만 통과한 것을 DB 통합 PASS라고 보고하지 않는다. 임시 PostgreSQL에 같은 DDL/RPC를 실행해 재시도·수정·경쟁을 검사한다. SQL 파일 문자열 검사만으로 대체하지 않는다.

현재 게임 snapshot은 한 consistent DB snapshot에서 state와 그에 대응하는 최신 turn을 읽는다. 여러 read-committed REST 요청을 묶었다고 같은 snapshot이라 주장하지 않는다. 단일 SQL/RPC 또는 적절한 transaction을 사용한다.

일반 턴/미디어 요청마다 history 전체를 반환하지 않는다. 최근 원문 범위와 관련 과거 기록만 읽고, 전체 History/내보내기는 keyset pagination을 사용한다. 최신 턴을 읽기 위해 1,000개 이상의 옛 기록을 먼저 읽는 방식은 금지한다. 실제 DB에서 1,005개 synthetic 기록을 만들어 최신 조회·페이지 누락을 검증한다.

서버 재시작 이후 같은 game_id를 읽어 Story·현재 상태·명령·기억이 복구돼야 한다. localStorage는 game 접근 정보와 UI 설정용이지 세이브 정본이 아니다.

## 8. 모델 제공자와 스트림

이미 설정된 모델 제공자·자격증명을 재사용하되 값은 출력/커밋하지 않는다. 모델명과 capability는 실행 시 실제 API/공식 문서로 확인한다. 모델 교체나 안전장치 우회를 오류 해결책으로 삼지 않는다. 필요한 환경변수 이름만 기록하고 프로젝트 범위 밖 자격증명 탐색은 하지 않는다.

plain text Story streaming을 유지한다. JSON mode는 문법 보조이지 의미 정확성 보장이 아니다. 제공자의 정상 종료 계약, finish reason, length/중단, 마지막 개행 없는 buffer를 처리한다. 내용 한 조각을 받은 뒤 EOF라는 이유만으로 정상 완료로 보지 않는다.

Story 부분 응답은 preview/checkpoint로 보존하되 완료 turn으로 Commit하지 않는다. timeout/rate limit/연결 종료를 구분하고 복구 가능 상태를 표시한다. Observer JSON 전체가 잘렸다면 prefix를 억지 복구해 사실로 만들지 않는다. 출력 토큰과 finish reason을 기록하되 private prompt/원문은 권한 있는 로컬 증거 영역에만 둔다.

프롬프트는 역할, 사실/역사 우선순위, 플레이어 agency, 결과 형식으로 정리한다. 오래된 final priority 문장을 누적 복사하지 않는다. 사례 하나마다 전체 prompt를 늘리거나 단순 상한 증가로 문제를 해결했다고 하지 않는다. 정확한 토큰 상한은 현재 모델 capability와 실측에 맞춰 설정한다.

## 9. 프런트·GIF·TTS

기존 읽기 중심 레이아웃/지도/History/짧은 선택 버튼은 재사용하되 app.js의 mutable controller는 복사하지 않는다. R4 view-model은 하나의 확정 snapshot token만 받아 Story/선택지/인물/미디어를 만든다.

pending preview와 committed 화면을 구분한다. 이번 스트림 실패가 마지막 확정 Story를 지우지 않아야 한다. 늦게 온 응답은 game_id + state_revision + turn_revision 기준으로 버린다. 클릭한 짧은 선택 버튼은 해당 revision의 온전한 literal을 제출한다.

GIF는 표현 기능이다. 기존 의미 manifest에 kind, stable locator, poster, loop, alt 등 필요한 최소 필드만 덧붙이는 adapter를 둔다. 기존 자산을 실제 GIF라고 속이거나 움직이는 새 캐릭터 이미지를 자동 생성하지 않는다.

기존 manifest에 원본 캐릭터/장면 이미지 매핑이 있으면 해당 scene에 연결해 표시한다. 이미지 바이트나 공개 URL을 얻지 못하면 참조 보존과 표시 실패를 각각 기록하고, 데모 이미지로 실제 캐릭터 아트를 대신했다고 하지 않는다. GIF가 없는 일반 기술 상태 검증에만 중립 사내 알림 GIF를 fixture로 사용하며, 실제 인물/콘텐츠 화면으로 보고하지 않는다. 새 캐릭터 GIF 제작은 별도 아트 작업이다.

GIF/이미지는 현재 확정 인물·상황에만 맞춘다. 장면 이동/인물 퇴장/피드백 revision 때 옛 미디어를 폐기한다. reduced-motion/정지 버튼에서는 정지 poster를 쓴다. 로딩 실패가 Story/Commit을 막지 않는다. TTS OFF이면 호출 0이며, 같은 턴 재생은 가능한 캐시를 이용한다. 비활성 캐시나 이전 화자가 다음 턴의 사건을 결정하지 않는다.

## 10. 수행 순서 — 승인 대기 없이 연속 수행

1. 기준 SHA/branch/worktree/사용 가능한 로컬 DB·모델·브라우저 도구를 확인한다. 보호할 자산 목록과 변경 대상만 inventory에 남긴다. 무관한 재감사로 밤을 쓰지 않는다.
2. Setup→Opening→한 턴→실제 DB→reload를 먼저 연결한다. 여기서부터 실행 가능한 후보를 유지한다.
3. command/pipeline과 이동·presence·관찰·규칙 작업 경계를 정리한다. 재시도/피드백을 같은 코어에 연결한다.
4. digest/retrieval/read snapshot/stream 종료 처리를 완성한다.
5. 기존 게임 읽기 요소(History, Mind Monitor, 현장 인물/지도, Story/choices/free input, feedback/recovery)를 연결한다. Scene 근거에 맞는 원본 이미지 선택과 기존 voice ID의 선택 재생 경로를 보존하고, GIF stop/replace/fallback은 fixture로 검수한다. API/스토리지/음성 서비스가 설정되지 않았다면 실제 이미지·음성 PASS로 표시하지 않는다.
6. 아래 수락 시나리오를 실행한다. 실패 원인을 고친 뒤 관련 시나리오와 영향 경로만 재실행한다.
7. 최신 변경 파일 전체를 읽기 전용 관점으로 다시 검토하고, 실행 방법·증거·미해결 항목을 정리한다. 최종 commit/push와 draft PR까지 만든다. main 병합·기존 배포는 하지 않는다.

계약이 확정된 뒤 독립 병렬 작업은 허용한다. pipeline/contracts와 공통 상태 파일은 한 writer만 맡고, 다른 작업자는 UI 또는 DB adapter 또는 read-only review 등 겹치지 않는 파일을 맡는다. 병렬 에이전트가 없으면 순차 진행한다. 별도 오케스트레이션 프로그램을 만들지 않는다.

## 11. 검증과 완료 기준

### 오프라인 / 실제 저장소 검사

아래는 기본 불변조건이다. 데이터·모델을 스크립트로 공급한 검사는 그렇게 표기한다.

- 이동 부정/고민/NPC 이동 요청에서 플레이어 장소를 사전 변경하지 않음.
- NPC 퇴장→빈 방 Commit→다음 컨텍스트에서도 빈 방. 기본 NPC 재주입 없음.
- 동일 command 재전송·다른 payload 충돌·늦은 attempt·reset 후 늦은 응답: 중복 commit 0.
- 일반 RULE_CHANGE의 APPLY/CHANGE/REMOVE 뒤 각각 문장 피드백: 작업 의미/버전 보존, 턴 중복 증가 없음.
- 실패 RULE_CHANGE 재시도는 서버의 원본 명령을 사용. 인메모리/실제 DB shape 동일.
- Observer 전체/부분 실패, 명시적 빈 scene, 잘못된 actor 근거: degraded와 verified를 구분.
- partial SSE, length 종료, JSON 잘림, 마지막 buffer, 브라우저 종료: 부분 Story가 완료로 커밋되지 않음.
- 실제 DB 동시 수정/commit/read, 1,005턴 최신 조회, 서버 재시작, 수정된 digest 무효화.
- 이번 턴 대사 뒤 퇴장한 인물은 대사 기록에 남고 최종 presence에서는 빠짐.

### 실제 모델 + 실제 브라우저

캠페인은 사전에 입력과 확인점을 고정한다. 같은 코드를 여러 번 돌려 좋은 출력만 골라 PASS하지 않는다. 모델 호출을 scripted Provider로 바꾸고 LIVE라고 부르지 않는다.

A. 방향 확인 이후 실제 모델과 원본 캐릭터를 이용한 기억 캠페인 40턴: 사건·인물 설정 → 장면/인물 변화 → 최근 원문 범위를 초과하는 오래된 사건 회상. 먼저 representative scene이 캐릭터/세계관 기준을 통과해야 시작한다. fixture 캠페인은 구조 테스트로만 명시하며 Story 품질 acceptance와 분리한다.

B. 8~12턴 경계 캠페인: literal 보존, 이동 거부/생각만 하기, NPC 퇴장, 실패/재시도, 피드백, 새로고침. 제품 방향 장면을 포함하고 점심·공지·당번 fixture만으로 제품 acceptance를 통과시키지 않는다. 장애 주입 때문에 real provider를 못 쓴 단계는 그 범위를 명시한다.

C. 화면: desktop와 390×844. 실제 선택 버튼 제출·자유 입력·History·피드백·미디어/GIF 정지·fallback. 최소 핵심 화면 캡처와 network/console 오류 확인. API 성공만으로 UI PASS하지 않는다.

각 결함에 literal → context manifest → Story → observer raw/applied → state_after → 다음 context → UI 자료를 한 묶음으로 남긴다. 실제 run id와 code SHA를 포함한다. 전체 민감 원문은 git에 올리지 말고 로컬 private evidence로 보관하며 일반 fixture/요약/해시만 commit한다.

### 판정

- LOCAL_CANDIDATE_READY: 일반 회사 코어, 실제 로컬 DB, 실제 모델 장기/경계 캠페인, 브라우저 핵심 사용, 재시작 복원이 모두 확인되고 알려진 파괴적 결함이 없음.
- PARTIAL_BLOCKED: 유효한 코드/로컬 실행물은 있지만 모델·DB·브라우저·권한 중 필수 검증이 막힘. 빠진 것을 정확히 기재한다.
- FAILED_NEEDS_FIX: 현재 재현 가능한 파괴적 결함이 남음.

원본 제품 전체 OWNER_READY, 운영 배포 승인, 사용자 재미 수락은 별개다. 40턴 한 번을 모든 장기 기억의 증명으로 과장하지 않는다. 지연·drop rate·호출 수는 실측 수치와 사례를 보고하며 근거 없는 상용 품질을 선언하지 않는다.

## 12. 장시간 실행 규칙과 권한

단계별 완료마다 ‘다음 단계 할까요?’를 묻지 말고 다음 미완료 작업을 수행한다. 계획/문서/테스트만 납품하고 구현을 끝내지 않는다. 오류가 나오면 원인→수정→관련 검증을 반복한다. 성공 기준을 낮추거나 테스트를 삭제해 녹색을 만들지 않는다.

같은 실패·같은 원인·같은 코드의 재호출은 진행이 아니다. 동일 실패가 두 번 반복되면 원인/가설을 다시 확인하고 다른 독립 작업을 수행한다. 실제 외부 차단은 BLOCKERS에 기록하고 가능한 구현·오프라인/DB 작업을 계속한다. 모든 가능한 독립 작업까지 끝난 뒤에만 PARTIAL_BLOCKED로 종료한다.

기존 승인된 모델/API 설정을 쓸 수 있을 때만 유료 모델 검증을 수행한다. 호출 예산은 기존에 더 엄격한 제한이 없을 경우 이 작업 전체 Story+Observer 합계 최대 120회로 제한한다. 시작/종료/실패/재시도를 모두 센다. 기존 명시 예산이 더 작으면 그 값을 따른다. 상한은 지출 무제한 승인이 아니다. 새 API key·구독·충전·고비용 모델 전환은 하지 않는다. 예산이 부족하면 남은 live를 미검증으로 기록하고 독립 작업을 끝낸다.

로컬 새 DB/새 게임에만 DDL·테스트 데이터를 쓴다. 기존 main, PR #104, R3 Worker, 운영/기존 TEST DB 및 보존 세이브는 변경하지 않는다. 원격 preview 배포는 별도로 명시 승인된 독립 환경이 있을 때만 하고, 없으면 localhost 실행물을 납품한다. 환경 제약을 테스트 성공으로 꾸미지 않는다.

30분 내외 또는 의미 있는 구현 checkpoint마다 현재 성과·새 증거·다음 행동을 짧게 보고한다. 이는 현재 Codex 실행 중 보고이며 별도 예약/데몬을 만드는 지시가 아니다. 플랫폼 세션 종료·사용량 한도를 프롬프트로 무력화할 수 있다고 주장하지 않는다.

PROGRESS.md를 유일한 작업 체크포인트로 유지한다: 현재 HEAD/완료항목/다음 한 작업/실행명령/로컬 URL/DB 위치/호출 예산 잔량/차단 원인. 컨텍스트가 줄거나 세션이 재개되면 여기와 실제 git 상태를 읽고 이어간다. 같은 계획을 새 파일로 계속 중복 작성하지 않는다.

끝낼 때: 한 번에 실행 가능한 dev 명령, fresh game 진입 URL, DB 재시작 방법, 입력 가능한 게임 화면, 재현 경로, core before/after 구조, 실제 검증과 미검증, 원본 자산 보호 결과, rollback(기존 R3 유지)을 FINAL_REPORT.md에 남긴다. 목표를 달성하면 불필요한 추가 기능/반복 테스트 없이 종료한다. 내일 아침 완료나 무오류를 보장하지 않는다.

## 13. 출처와 설계 판단 구분

현황·결함의 근거는 앞의 frozen source와 첨부 ARCHITECTURE_REVIEW_KO.md다. 이 문서의 R4 파일 배치, DTO, 초기 기억 예산, 호출 상한, 작업 순서는 새로운 설계 제안/실행 계약이며 이미 구현된 사실이 아니다.

참고 원칙(외부 자료가 이 프로젝트의 성공을 보증하지는 않음):
- Martin Fowler, Branch By Abstraction: https://www.martinfowler.com/bliki/BranchByAbstraction.html — 호환 경계 아래 구현 교체. 여기서는 짧은 후보 브랜치로 구현·비교하고 영구 이중 엔진을 목표로 하지 않는다.
- Anthropic, Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — 중요한 정보 선택·압축·재조회, 복잡한 prompt 누적 회피.
- OpenAI, Building Consistent Workflows with Codex CLI & Agents SDK: https://developers.openai.com/cookbook/examples/codex/codex_mcp_agents_sdk/building_consistent_workflows_codex_cli_agents_sdk — 요구사항·수락 기준·작업 문서의 분리 원칙만 참고. 해당 SDK/새 PM 시스템을 설치하라는 뜻이 아니다.

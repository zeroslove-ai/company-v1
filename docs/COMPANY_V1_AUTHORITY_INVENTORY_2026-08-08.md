# Company v1 Runtime Authority Inventory

> **문서 성격:** Phase 1 실제 코드 권위 감사 / 구조 개편 실행 기준서  
> **감사 기준 main:** `5595f5320aa6353aabb4b4f2bc800759b0e2ba4b`  
> **기능 기준:** PR #40 merge `a274ebb1d357ff38725b97a83e4b6fb1a7e3cd0b`  
> **상위 원칙:** `docs/COMPANY_V1_STORY_FIRST_RUNTIME_REDESIGN_CHARTER.md`  
> **이 단계의 제품 코드 변경:** 없음

---

# 1. 감사 결론

현재 외형상 흐름은 다음과 같다.

```text
Player input
→ Context
→ Story SSE
→ Story parser
→ Extract
→ guarded merge
→ Commit
→ Context reload
→ UI / image / TTS
```

실제 권위 흐름은 다음처럼 중첩돼 있다.

```text
Player input
→ ActionExecutionContract가 행동·대상·관계·사생활·허용 가능성을 사전 판정
→ SceneCastContract가 존재·진입·이동·원격·발화 가능 인물을 사전 판정
→ Story prompt
→ StructuredStoryGate가 한 줄씩 버퍼링·검증·재표현하며 화면에 전달
→ raw Story 별도 저장
→ server narrative parser 재해석
→ legacy 조건에서는 speaker-tagger LLM 재판정
→ parsed blocks로 Extract용 Story 재구성
→ Extract가 상태·대사·참여자·포커스·마지막 화자·이미지·CSA runtime까지 제안
→ ActionExecutionContract firewall이 Extract 결과를 다시 필터링
→ guarded merge가 evidence·장면·이동·수치·관계·착의·이벤트를 다시 판정
→ movement sanitizer가 장면 상태를 다시 덮어씀
→ CSA runtime reducer가 per-character 실행 상태 기록
→ Commit RPC가 최종 save와 turn record 저장
→ 브라우저가 streaming Story 재파싱
→ complete에서 server parsed blocks로 교체
→ Extract 응답에서 다시 렌더 교체
→ view-model·TTS fallback이 다시 대사·포커스·이미지 대상을 추론
```

핵심 진단:

1. raw Story 저장 정본은 존재하지만 라이브 화면과 Extract 입력은 raw Story와 동일하지 않다.
2. 일반 턴에서는 ActionExecutionContract가 Story 이전과 Commit 이후 모두에 영향력을 가진다.
3. SceneCastContract는 사실 전달기가 아니라 등장·발화·이동 허가 시스템이다.
4. 동일 대사를 server gate·server parser·speaker tagger·frontend parser·TTS fallback이 반복 해석한다.
5. Extract가 상태 추출을 넘어 장면·대사·미디어·CSA runtime 권위까지 갖는다.
6. 장면 참여자는 `scene_state.participants`, Extract envelope, movement sanitizer, `last_npcs_present`, `npc_scene_state.present`가 함께 쓴다.
7. 활성 CSA는 Story에서 세계 규칙으로 정리됐지만 legacy direct coverage와 per-character runtime이 남아 있다.
8. Recovery 최종 상태는 DB가 갖지만 frontend localStorage·pending.step·busy·recoveryPending가 별도 상태를 유지한다.
9. 911개 테스트 중 상당수는 앞으로 삭제할 함수·route·정확 문구를 보호한다.

다음 작업 순서:

```text
죽은 호환 경로 삭제
→ Story 사전 판정 권위 삭제
→ raw streaming 단일화
→ Extract 책임 축소
→ scene/state 단일 writer
→ UI/TTS/image 후행 projection 단일화
→ Recovery 상태 축소
→ legacy DB 필드 제거
```

---

# 2. 권위 등급

| 등급 | 의미 |
|---|---|
| `CANONICAL` | 최종 구조에서도 유지할 단일 정본 또는 저장 경계 |
| `DERIVED` | 정본에서 언제든 다시 만들 수 있는 후행 projection |
| `COMPAT-READ` | 과거 데이터 읽기 전용. 신규 writer 제거 대상 |
| `DUPLICATE` | 같은 사실을 다른 계층과 중복 기록·판정 |
| `PRE-STORY AUTHORITY` | Story 전에 결과·대상·허용 범위를 결정하는 금지 대상 |
| `POST-STORY REJUDGE` | Story 결과를 의미적으로 다시 재판하는 금지 대상 |
| `DELETE FIRST` | 대체 시스템 없이 먼저 삭제 가능한 죽은 경로 |
| `REDESIGN` | 제품 동작을 바꾸므로 별도 PR에서 교체할 대상 |

---

# 3. Authority Matrix

## 3.1 Story 원문과 스트리밍

### 현재 writer

- `src/api/turn-routes.js`: upstream delta를 `upstreamRaw`로 누적하고 `recordStoryResult()`로 저장
- Commit RPC: `game_actions.story_text`를 `game_turns.story_text`로 저장

### 중복·충돌

- 라이브 화면은 raw delta가 아니라 `StructuredStoryGate` 출력이다.
- gate는 완성된 한 줄까지 기다린다.
- `[SCENE]` 마커를 제거하고 dialogue를 canonical 형식으로 다시 만든다.
- replay는 raw Story보다 `stream_segments`를 우선한다.
- Extract에는 raw Story 대신 `buildStructuredStoryV2ExtractText(parsedStory)`가 만든 문자열을 전달한다.
- 화자 미확정 dialogue는 Extract 입력에서 빠질 수 있다.

### 최종 권위

```text
CANONICAL: game_turns.story_text = upstream raw Story
DERIVED: parser blocks와 UI 장식
```

### 조치

- `REDESIGN`: raw delta를 즉시 SSE 전달
- `DELETE`: gate의 live text 재작성 권위
- `DELETE`: Extract 전용 Story 재구성
- `KEEP`: SSE transport와 raw Story 저장

---

## 3.2 대사와 화자

현재 판정자는 다음과 같다.

1. Story LLM `[DIALOGUE]`
2. StructuredStoryGate
3. server `narrative-parser.js`
4. legacy `speaker-tagger.js` LLM
5. Extract의 missing speaker 보충
6. frontend `narrative.js`
7. TTS `fallbackDialogueLines()`

충돌:

- 동일 대사가 최대 다섯 번 화자 판정을 받는다.
- frontend는 streaming 중 자체 파싱 후 complete에서 server result로 교체한다.
- Extract 응답이 오면 다시 화면을 교체한다.
- TTS는 focal/last speaker를 이용해 과거 Story 화자를 추측한다.
- speaker tagger는 추가 LLM과 DB tagging status writer를 만든다.

최종 권위:

```text
CANONICAL TEXT: raw Story
DERIVED METADATA: 한 개의 비파괴 parser
UNRESOLVED SPEAKER: null 허용
```

조치:

- `DELETE`: Extract `dialogue_lines` writer
- `DELETE`: frontend 화자 의미 추론
- `DELETE`: TTS focal/last-speaker 추측
- `COMPAT-READ`: 과거 저장 턴용 최소 parser fallback
- current V2 신규 턴에서 사용하지 않는 speaker-tagger는 호환 범위 확인 후 삭제

---

## 3.3 선택지

현재 writer:

- Story 원문
- server parser
- guarded merge의 `save.last_choices`
- deterministic 4개 보충
- `game_turns.choices`
- opening RPC 별도 fallback

현재 reader:

- `save.last_choices`
- `game_turns.choices`
- `parsed_blocks.choices`
- frontend `streamedStoryChoices`
- server/frontend 번호 입력 parser

최종 권위:

```text
CANONICAL: raw Story에서 파생한 choices
PERSISTED PROJECTION: game_turns.choices
NEXT-TURN PROJECTION: save.last_choices
```

조치:

- Story 1~3개 보존 + 부족분만 deterministic 보충 유지
- 보충 함수와 parser를 각각 하나로 통합
- server/frontend 번호 입력 해석 중복 제거
- reader fallback 순서 단일화

---

## 3.4 장면 위치와 참여자

현재 writer:

- Extract `state_delta.scene_state`
- Extract `npcs_present`
- `evidence.scene_presence_final` branch
- `sanitizeMovementCommit()`
- `npc_scene_state[id].present`
- `last_npcs_present`
- `focal_character_id`
- `last_speaker_id`

현재 reader:

- Story context
- SceneCast
- ActionExecutionContract privacy/target
- guarded merge allowed-NPC
- clothing 단일-NPC 예외
- CSA runtime
- image/TTS fallback
- UI/view-model/map

충돌:

- `scene_state.participants`가 정본이라고 적혀 있지만 다른 값도 참여 여부로 사용된다.
- `allowedNpcIds()`는 participants 외에 `last_npcs_present`와 `present=true`를 사용한다.
- Extract가 제안한 NPC와 action target도 state patch 허용 목록에 들어간다.
- final-presence branch와 movement sanitizer가 scene을 각각 쓴다.
- UI는 focal + last_npcs + participants를 다시 합친다.

최종 권위:

```text
CANONICAL LOCATION: scene_state.location_id
CANONICAL PARTICIPANTS: scene_state.participants
DERIVED: focal character, last speaker
```

조치:

- 참여자 writer를 하나의 scene reducer로 통합
- `last_npcs_present` 신규 writer 제거
- `npc_scene_state.present` 신규 writer 제거
- legacy 필드는 `COMPAT-READ` 후 삭제

---

## 3.5 SceneCast와 이동

SceneCast가 Story 전에 확정하는 항목:

- present/entering/destination/remote NPC
- destination location/scene
- allowed speaker IDs
- player dialogue mode/intent/target/material-action scope
- movement transition

후행에는 Extract movement contract와 `sanitizeMovementCommit()`가 있다.

충돌:

- 입력 regex가 이동 성공·대상·발화 가능성을 Story 전에 정한다.
- Story 결과보다 SceneCast destination과 Extract outcome이 Commit을 좌우한다.
- movement sanitizer가 scene, last_npcs, focal, NPC present를 동시에 작성한다.

최종 구조:

```text
PRE-STORY FACTS: 현재 위치, 등록 인물, 알려진 위치
STORY: 실제 이동·만남 전개
EXTRACT: 최종 location/participants 변화
COMMIT: 등록 ID와 구조만 검증
```

조치:

- SceneCast를 factual roster로 축소
- player dialogue intent firewall 삭제
- allowed-speaker fail-closed 권위 삭제
- 이동 성공 사전 route 삭제
- movement sanitizer를 일반 scene reducer로 흡수

---

## 3.6 ActionExecutionContract

현재 판정:

- material action taxonomy
- execution mode
- actor/target
- relationship milestone
- affinity/arousal band
- privacy/observer count
- hard blocker/contextual permission
- route/completion policy
- boundary follow-up

Story 영향:

- 활성 CSA가 없는 턴에 REQUEST/ATTEMPT/AUTHORITATIVE section 주입

Commit 영향:

- `applyContractStateFirewall()`
- sexual completion·ledger·relationship milestone·ejaculation 필터
- `pending_boundary_followup` 작성·삭제

판정:

```text
PRE-STORY AUTHORITY + POST-STORY REJUDGE
```

최종 권위는 없음. 별도 PR에서 전체 제거한다.

---

## 3.7 활성 CSA와 world rules

현재 canonical:

- `save.csa_active`
- `save.csa_rules`
- structured action transaction plan

Story projection:

- `active_world_rules`
- `global_csa`
- 여러 prompt section

충돌:

- `active_world_rules`와 `global_csa`가 중복된다.
- `buildSceneContextCore()`도 global CSA를 만든다.
- prompt-sections에 호출되지 않는 donor-era function과 unreachable code가 남아 있다.

최종 권위:

```text
CANONICAL: save.csa_active + save.csa_rules
STORY PROJECTION: active_world_rules 하나
```

조치:

- active_world_rules 유지
- Story용 global_csa 중복 제거
- dead prompt sections·exports·imports·tests 삭제
- world-rule 설명을 한 섹션으로 축소

---

## 3.8 Legacy CSA direct coverage

`src/engine/csa/direct-coverage.js`는 아직 다음을 포함한다.

- group → concrete participant 하나 선택
- target 하나 선택
- direction
- material-action keyword
- question/ask/execute regex
- exact/method_variant/continuation route
- runtime execution_state 기반 continuation

PR #40 Story route는 `preStoryCsaRouting:false`이므로 production active Story path에서는 비활성이다. 그러나 다음이 남았다.

- ActionExecutionContract import와 기본 `true` branch
- engine index export
- unit/compatibility tests
- CSA reducer `csaCoverage` fallback

판정:

```text
DELETE FIRST
```

대체 matcher를 만들지 않는다.

---

## 3.9 CSA runtime

현재 writer:

- Extract `csa_runtime_updates`
- Extract `csa_trigger_evaluations`
- `buildCsaRuntimeStatePatch()`

현재 저장:

- lifecycle/applicability/execution_state
- 단일 `character_id`
- started/confirmed turn
- end reason

현재 reader:

- progression EXP/experience
- aftereffect 대상
- legacy continuation coverage

충돌:

- 세계·그룹 규칙을 한 character로 축소한다.
- 여러 NPC 동시 적용을 표현할 수 없다.
- progression과 aftereffect가 이 단일 character writer에 의존한다.

조치:

- rule lifecycle과 event observation 분리
- progression은 committed world-rule event에서 계산
- `character_id` 단일 필드 제거
- aftereffect는 실제 관련 NPC event 기반으로 재설계

---

## 3.10 Extract

현재 책임:

- state delta/outcome/action resolution/evidence
- summary/Mind Monitor/time
- dialogue lines
- NPC presence/action target/focal/last speaker
- image character/pool/tags
- CSA trigger/runtime
- movement
- sexual state/ledger

판정:

Extract가 상태 추출기를 넘어 parser·scene reducer·media selector·CSA runtime 역할까지 겸한다.

최종 책임:

```text
scene_delta
npc_deltas
player_delta
events
world_rule_observations
mind_monitor
turn_summary
elapsed_minutes
evidence
```

제거 대상:

- choices
- dialogue_lines
- player_inner_thought
- image_character_id/image_selection
- focal/last speaker 직접 writer
- 현재 per-character CSA runtime

---

## 3.11 guarded merge와 Commit

현재 역할:

- allowlist
- envelope normalization
- allowed NPC 계산
- exact evidence/actor attribution
- clothing/posture/location
- relationship/emotion/stat
- sexual completion/ledger
- scene presence
- choices fallback
- time
- movement restore/override
- turn state

충돌:

- 한 파일이 모든 domain의 의미 판정을 수행한다.
- multiple presence source를 합친다.
- ActionExecutionContract firewall이 앞에 별도로 있다.
- state delta scene과 top-level presence가 중복 writer다.

최종 구조:

```text
CANONICAL ATOMICITY: DB Commit RPC
MINIMAL REDUCER: schema, ID, numeric range, exact evidence, dedupe
```

field-level fail-soft는 유지하되 route·관계 허가·한국어 의미 재판은 제거한다.

---

## 3.12 물리 상태

현재 Extract와 physical-state reducer가 clothing/posture/location을 후행 기록한다. 이 방향은 유지 가능하다.

문제:

- `present`가 같은 map에 섞여 있다.
- movement sanitizer도 물리 상태 map을 쓴다.
- exact evidence 외 자연어 의미 regex가 과도하다.

최종 권위:

```text
CANONICAL: npc_scene_state[npc_id] physical fields
EXCLUDE: presence authority
```

---

## 3.13 NPC stats·relationship·emotion

상태 저장은 Extract→Commit 후행 구조다. 문제는 ActionExecutionContract가 affinity/arousal/boundary/milestone을 다음 Story의 행동 허가 엔진으로 사용한다는 점이다.

최종 원칙:

```text
CANONICAL: committed state deltas
STORY INPUT: 현재 관계·감정 사실
NOT AUTHORIZATION: 성공·거절 route
```

ActionExecutionContract reader를 제거하고 reducer는 range·ID·evidence만 담당한다.

---

## 3.14 Sexual state와 events

현재 writer:

- Extract
- ActionExecutionContract firewall
- guarded merge
- sexual ledger reducer
- relationship milestone sanitizer

충돌:

- 실제 Story event보다 pre-Story route가 completed event·milestone·ejaculation 저장 여부를 결정한다.
- generic event ledger와 sexual ledger가 일부 중복된다.

최종 권위:

```text
CANONICAL EVENT: exact Story evidence가 있는 committed event
DERIVED: count, last event, intimacy projection
```

pre-contract firewall을 제거하고 actor/target/enum/evidence/dedupe만 검증한다.

---

## 3.15 이미지

현재:

- Extract가 `image_character_id`와 pool/tags를 제안
- view-model이 focal/last speaker로 fallback
- latest committed `extract_delta`를 media source로 사용
- deterministic selector가 최종 이미지 선택

문제:

- final scene presence와 image character가 별도 추출값이다.
- scene/focal 오류가 image까지 전파된다.

최종 구조:

```text
DERIVED: committed final scene + committed events + focal UI hint
```

Extract media writer를 제거하고 selector는 비차단 보조로 유지한다. 이미지 없음은 정상 결과다.

---

## 3.16 TTS

현재 source 후보:

- Extract dialogue lines
- parsed blocks
- frontend parser
- TTS fallback parser
- focal/image/last-speaker 우선순위

서버 eligibility gate는 등록 heroine + voice ID만 허용하므로 유지 가능하다.

조치:

- single parsed dialogue projection만 사용
- fallback speaker inference 제거
- unresolved speaker는 자동 TTS 생략
- 같은 화자 + 같은 direction 인접 대사만 병합하는 queue로 재설계
- 새 턴이 기존 재생을 무조건 가로채지 않게 한다

---

## 3.17 Mind Monitor

Extract→Commit→UI의 후행 보조 경계로 비교적 올바르다.

유지 조건:

- Story·scene·relationship writer가 아님
- 실패 시 빈 값
- 플레이어 속마음과 분리
- image/TTS 대상 선택 권위로 사용하지 않음

---

## 3.18 최근 턴·요약

Story context는 최근 3턴 raw Story를 사용한다. stale `story_summary_recent` reader와 빈 `turn_summary` 관련 fallback이 남아 있다.

최종 권위:

```text
CANONICAL CONTINUITY: 최근 raw Story
DERIVED SUMMARY: UI/history 편의용
```

요약은 Story 허가 시스템이 아니며 stale save summary reader는 삭제 후보다.

---

## 3.19 Recovery

DB canonical:

- `game_actions.processing_status`
- story/extract 존재
- Commit 결과
- `deriveRecoverableStep()`
- stale action timeout

frontend 상태:

- localStorage pending
- pending.step
- busy/recoveryPending/mediaLoading
- turnPhase
- checkRecovery/settlePending/resumePending/coordinator runRecovery

최종 권위:

```text
CANONICAL: server game_actions state
LOCAL STORAGE: reconnect hint only
```

Recovery 상태를 `reserved → story_saved → committed → terminal_failed` 중심으로 줄이고 frontend는 server `recoverable_step` 하나만 실행한다.

---

## 3.20 UI projection

현재:

- `/api/context` raw save + display projection
- `hydrateGameplayState()`
- `buildFullPlayerInfo()`
- frontend `buildCompanyGameViewModel()`
- raw save fallback
- render parser fallback
- company map 별도 projection

문제:

- server display와 frontend view-model이 같은 필드를 다시 조립한다.
- view-model이 save, display, latest turn, current Extract를 혼합한다.
- history renderer가 parsed_blocks 없으면 Story를 다시 parse한다.

최종 구조:

```text
CANONICAL DATA: committed save + committed turn
DERIVED PRODUCT MODEL: 한 계층
```

server display와 frontend raw-save fallback 중 하나만 남긴다.

---

# 4. Writer Inventory

## DB writer

| 저장 대상 | writer |
|---|---|
| `game_actions` reserve/status | `reserve_turn_action`, REST PATCH |
| `game_actions.story_text/parsed_blocks` | `record_story_result`, speaker-tagging PATCH |
| `game_actions.extract_delta` | `record_extract_result` |
| `game_turns` | `commit_company_turn`, `commit_feedback_revision` |
| `game_save.data` | Commit RPC |
| image library | 턴 파이프라인 read-only |

DB Commit RPC 원자성은 유지한다. 문제는 RPC 직전 `p_next_save` writer가 너무 많다는 점이다.

## In-memory save writer

- `applyGuardedStateDelta()`
- `sanitizeMovementCommit()`
- CSA transaction plan
- CSA runtime reducer
- CSA aftereffect reducer
- progression update
- pending boundary follow-up

## UI local writer

- `currentExtract`
- `streamedStoryChoices`
- `sessionHistory`
- `committedStatDeltas`
- local pending action
- live Story DOM
- image DOM/audio object

---

# 5. Duplicate Authority Graph

```text
raw Story
├─ StructuredStoryGate blocks
├─ server parseNarrative blocks
├─ speaker-tagger blocks
├─ Extract dialogue_lines
├─ frontend parseNarrative blocks
└─ TTS fallback dialogue_lines
```

```text
scene_state.participants
├─ SceneCast present/entering
├─ Extract npcs_present
├─ evidence.scene_presence_final
├─ last_npcs_present
├─ npc_scene_state.present
├─ movement sanitizer
├─ focal_character_id
└─ last_speaker_id
```

```text
player input
├─ ActionExecutionContract route
├─ Story result
├─ Extract outcome/action_resolution
├─ contract state firewall
├─ guarded merge evidence gates
└─ movement sanitizer outcome gate
```

```text
save.csa_rules/csa_active
├─ active_world_rules
├─ global_csa projection
├─ prompt sections
├─ legacy direct coverage
├─ csa_runtime_state(character_id)
├─ trigger evaluations
└─ progression accepted_executions
```

---

# 6. 실행 순서

## Phase 2A — 삭제 전용 PR, 제품 동작 불변

### 삭제 후보

1. `src/engine/csa/direct-coverage.js`
2. engine index direct coverage export
3. ActionExecutionContract coverage import·parameter·legacy branch
4. CSA reducer `csaCoverage` fallback
5. direct coverage 전용 테스트
6. `buildCsaRuntimeSection()` unreachable donor block
7. 현재 호출되지 않는 CSA prompt section·export·import·test
   - acceptance scope
   - direct execution priority
   - persistent scene
   - physical transition
   - direct coverage section
8. 제거된 NPC Finder 잔존 backend 함수
   - `buildFinderNpcList`
   - `resolveNpcLocation`
   - `buildNpcFinderPayload`
9. dead source-structure assertion과 exact prompt 문장 테스트

### 금지

- 대체 direct matcher
- 새 regex/classifier/verifier
- Story prompt 의미 변경
- DB migration
- 운영 repair
- Worker 배포

---

## Phase 2B — ActionExecutionContract 권위 제거 PR

- Story 이전 contract 계산 제거
- REQUEST/ATTEMPT/AUTHORITATIVE prompt 제거
- parsed_blocks route metadata 제거
- Commit contract firewall 제거
- boundary follow-up 제거
- SceneCast actionContract coupling 제거
- 관련 route/permission/privacy/milestone tests 정리

---

## Phase 3 — raw streaming 단일화

- gate를 transport path에서 제거
- 첫 upstream delta 즉시 SSE
- raw Story를 live UI와 DB의 동일 source로 사용
- parser는 비차단 후행 projection
- frontend canonical replacement 횟수 축소
- speaker tagger·Extract dialogue writer·TTS fallback 제거

---

## Phase 4 — Extract/Commit 최소화

- 최소 Extract envelope
- scene delta 단일화
- media/dialogue/choices 제거
- CSA observations 개편
- guarded merge domain 축소
- semantic rejudge 제거

---

## Phase 5 — scene/state 단일 writer

- `scene_state.participants`만 presence 정본
- `last_npcs_present`/`npc_scene_state.present` 신규 writer 제거
- focal/last speaker 파생
- movement sanitizer를 scene reducer로 흡수

---

## Phase 6 — UI/media/recovery

- product projection 하나
- dialogue projection 하나
- image projection 하나
- TTS queue 하나
- server recovery state 하나
- localStorage는 reconnect hint만

---

# 7. 첫 삭제 PR 경계

## 브랜치

```text
company/authority-delete-legacy-v1
```

## 시작 SHA

```text
5595f5320aa6353aabb4b4f2bc800759b0e2ba4b
```

## 목표

```text
현재 main runtime에서 호출되지 않는 CSA direct matcher와 donor-era dead prompt 경로를 실제 삭제한다.
제품 동작은 변경하지 않는다.
```

## 필수 삭제·점검 symbol

```text
resolveCsaDirectCoverage
resolveParticipant (direct-coverage export)
buildCsaDirectCoverageSection
coverage_kind
method_variant_requested
legacyCoverageMatch
csaCoverage parameter

buildCsaAcceptanceScopeSection
buildCsaDirectExecutionPrioritySection
buildCsaPersistentSceneSection
buildCsaPhysicalTransitionSection

buildFinderNpcList
resolveNpcLocation
buildNpcFinderPayload
```

문자열 일괄 삭제는 금지한다. 실제 참조와 schema 문맥을 확인한다.

## 테스트 원칙

- 삭제된 구현만 검증하는 테스트는 삭제
- 같은 사용자 계약을 검증하는 중복 테스트는 integration test 하나로 통합
- 삭제한 테스트 수만큼 새 테스트를 보충하지 않음
- 테스트 감소는 정상이며 이유를 보고

## 완료 보고

1. 시작 SHA / 최종 SHA
2. 삭제 파일·함수
3. 제거한 runtime import/export
4. 제품 동작 변화 0 근거
5. 삭제 테스트 / 통합 테스트 / 최종 테스트 수
6. additions/deletions
7. Story/Extract prompt 문자 수 전후
8. syntax / JSON / diff check / full test / dry-run
9. DB·Worker·운영 save 변경 0
10. 잔존 legacy와 다음 PR 경계

---

# 8. 테스트 감사 분류

현재 `npm test`는 `test/*.test.mjs` 전체를 실행하며 총 911개가 보고됐다.

## 유지

- turn reservation/idempotency
- raw Story persistence
- first delta/nonblocking stream
- Extract fail-soft
- Commit replay/fail-open
- scene/state reducer
- feedback revision
- TTS OFF network 0
- image failure nonblocking
- Golden Play Trace

## 통합

- 같은 CSA projection 반복 검증
- scene presence의 unit/merge/V2 반복 fixture
- choices 0~4 중복 matrix
- recovery 상태별 유사 fixture
- dialogue parsing을 server/frontend/tagger에서 반복 검증

## 삭제

- ActionExecutionContract route taxonomy 고정
- direct coverage exact/method_variant/continuation
- prompt exact sentence
- warning exact string만 검증
- source symbol/주석 존재 검사
- dead helper compatibility
- obsolete route·field 보존 테스트

---

# 9. Phase 2A에서 건드리지 않을 것

- Story output format
- raw Story 저장
- SceneCast behavior
- ActionExecutionContract behavior
- Extract schema
- guarded merge semantics
- DB schema/RPC
- frontend rendering
- image selector
- TTS behavior
- recovery behavior
- 운영 save

각 항목은 별도 PR과 실플레이로 검증한다.

---

# 10. Phase 1 완료 판정

- [x] Story writer/reader
- [x] stream/replay
- [x] parser/speaker
- [x] Extract envelope
- [x] guarded merge/Commit
- [x] scene/presence/movement
- [x] CSA active/runtime
- [x] stats/relationship/physical/sexual events
- [x] image/TTS
- [x] UI projection
- [x] recovery/local pending
- [x] DB atomic writer
- [x] test debt 대표군
- [x] 첫 삭제 PR 경계

다음 단계는 **Phase 2A — `company/authority-delete-legacy-v1` 삭제 전용 PR**이다.

---

# 11. 최종 판단 문장

```text
1. 이 값은 사실인가, 결론인가?
2. Story 전에 필요한 사실인가?
3. 같은 사실의 writer가 이미 있는가?
4. 이 계층이 실패할 때 Story 또는 다음 턴이 막히는가?
5. 새 코드를 추가하지 않고 기존 권위를 삭제할 수 있는가?
```

> **Story와 raw streaming이 본체다. 나머지는 실제 Story에서 파생되는 후행 보조 장치이며, Story를 사전에 제한하거나 사후에 뒤집지 않는다.**

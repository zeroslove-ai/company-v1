# Codex Work Order — Remove ActionExecutionContract Authority V1

## 0. 작업 기준

- 저장소: `zeroslove-ai/company-v1`
- 작업 브랜치: `company/remove-action-execution-authority-v1`
- 시작 기준 SHA: `e472488c86b34ed982eebf264571504726d35525`
- PR 방식: Draft PR
- 병합·배포: 금지

작업 전 아래 문서를 반드시 읽는다.

1. `docs/COMPANY_V1_STORY_FIRST_RUNTIME_REDESIGN_CHARTER.md`
2. `docs/COMPANY_V1_AUTHORITY_INVENTORY_2026-08-08.md`
3. 이 문서

작업 시작 전에 다음을 먼저 보고한다.

- 현재 branch / HEAD SHA
- 작업 트리 clean 여부
- `origin/main` SHA가 위 시작 SHA와 일치하는지
- 아래 삭제 대상 심볼의 `src/**`, `test/**` 전체 호출자 검색 결과

---

## 1. 목적

이번 PR은 Story 전에 플레이어 행동의 성공·실패·허용 범위를 코드가 결정하고, Story 이후 Extract 결과를 같은 사전 판정으로 다시 잘라내는 `ActionExecutionContract` 권한을 제거한다.

현재 런타임은 일반 턴에서 다음 일을 수행한다.

1. 플레이어 문장을 키워드·정규식으로 성적/물질 행동으로 분류한다.
2. request / instruction / direct_act를 분류한다.
3. 대상 NPC, 사생활, 관찰자 수, 호감도·흥분도 band, 관계 milestone, blocker를 계산한다.
4. `ordinary_request`, `ordinary_direct_attempt`, `ordinary_direct_blocked` route를 Story 전에 확정한다.
5. 해당 route에 따라 Story system prompt에 REQUEST/ATTEMPT/AUTHORITATIVE 지시를 추가한다.
6. 같은 계약을 Extract에 전달해 `action_resolution`을 요구한다.
7. Commit에서 사전 계약을 기준으로 Extract의 milestone·event·sexual ledger·player completion을 삭제하거나 허용한다.
8. 차단 판단에 따라 `pending_boundary_followup`을 저장하고 다음 Story prompt를 강제한다.

이는 다음 원칙과 충돌한다.

- Story가 실제 사건을 결정한다.
- Story 전에는 사실만 제공한다.
- Extract는 Story에서 실제로 일어난 결과만 구조화한다.
- Commit은 구조 무결성만 검증하고 서사를 재판하지 않는다.
- 하나의 사실에는 하나의 정본만 둔다.

이번 작업은 기능 이름 변경이나 다른 파일로의 이식이 아니라 **해당 권한 묶음의 완전 삭제**다.

---

## 2. 현재 확인된 의존 관계

### 2.1 `src/engine/action-execution-contract.js`

현재 다음 권한을 한 파일에서 제공한다.

- `classifyMaterialActions`
- `classifyExecutionMode`
- target inference
- privacy / observer 판정
- affinity / arousal band 판정
- hard blocker 판정
- contextual permission 판정
- route / completion policy 판정
- Story prompt contract section 생성

파일 전체가 이번 삭제 대상이다.

### 2.2 `src/api/turn-routes.js` — Story

현재 Story 경로는:

- `resolveActionExecutionContract()`를 호출하거나 과거 `parsed_blocks.action_execution_contract`를 재사용한다.
- action contract timing/route/material/privacy 지표를 기록한다.
- `buildSceneCastContract()`에 `actionContract`를 전달한다.
- 일반 비-CSA 턴에서 `buildActionExecutionContractSection()`을 system prompt에 붙인다.
- `action_execution_contract`, `action_route`, `csa_covered`를 `parsed_blocks`에 저장한다.
- live/replay complete payload에도 `action_route`, `csa_covered`를 보낸다.
- `pending_boundary_followup`이 있으면 `BOUNDARY CONTINUITY FOLLOW-UP`을 system prompt에 붙인다.

이 경로를 모두 제거한다.

### 2.3 `src/api/turn-routes.js` — Extract

현재 Extract 경로는:

- 저장된 `action_execution_contract`를 Extract user payload에 주입한다.
- attempt/blocked route에서는 `action_resolution` 출력을 추가 요구한다.

이 경로를 모두 제거한다.

### 2.4 `src/api/turn-routes.js` — Commit

현재 Commit 경로는:

- `applyContractStateFirewall()`로 Extract를 사전 계약 기준 재심사한다.
- filtered Extract를 guarded merge와 movement sanitizer에 전달한다.
- 계약에 따라 `pending_boundary_followup`을 생성·만료시킨다.

이 경로와 관련 helper 전체를 제거한다. `applyGuardedStateDelta()` 자체와 기존 구조·ID·증거 검증은 유지한다.

### 2.5 `src/engine/scene-cast.js`

현재 `ActionExecutionContract`의 `classifyMaterialActions`를 전역 lazy wiring으로 받아 다음에 사용한다.

- 생성된 플레이어 대사의 `sexual_proposal` intent 판정
- `allowed_material_actions` 생성
- 생성 대사에 입력에 없던 material action이 추가됐는지 검사

또한 `buildSceneCastContract()`가 `actionContract` 인자를 받지만 현재 cast 계산에는 사용하지 않는다.

이번 PR에서는 다음만 제거한다.

- `wireMaterialClassifier`
- `globalThis.__companyV2MaterialClassifier`
- `hasMaterialSexualIntent`
- `materialActionsOf`
- material-action 기반 `sexual_proposal` 판정
- `allowed_material_actions`
- generated player dialogue의 material-action 추가 검사
- `buildSceneCastContract()`의 사용되지 않는 `actionContract` 인자

**중요:** 이를 다른 utility·matcher·regex로 옮기지 않는다. 기존 fallback 성적 표현 regex도 함께 제거한다.

이번 PR에서 SceneCast 전체, 이동 판정, present/entering/destination/remote 계산, allowed speaker, 비성적 player-dialogue intent 정책은 제거하지 않는다. SceneCast 전체 권한 정리는 별도 PR이다.

### 2.6 `src/engine/structured-story-v2.js`

Structured Story gate와 화자/cast 검증은 이번 PR에서 유지한다.

다만 SceneCast player-dialogue policy의 material-action 필드가 사라지므로 관련 테스트와 기대 shape를 정리한다. 이를 이유로 gate를 새로 강화하거나 다른 성적 matcher를 추가하지 않는다.

### 2.7 `src/engine/gameplay-state.js`

`normalizeGameplayExtractEnvelope()`가 현재 `action_resolution`을 보존한다. ActionExecutionContract 제거 후 소비자가 없으므로 다음을 제거한다.

- canonical Extract envelope의 `action_resolution`
- degraded/fixture/test에서 계약 전용으로 존재하는 관련 shape

`outcome`, `state_delta`, `evidence`, 관계 milestone, event ledger, sexual event ledger 등 Story 실제 결과 구조는 유지한다.

### 2.8 과거 저장 데이터 호환

과거 DB 행 또는 save에 다음 필드가 남아 있을 수 있다.

- `parsed_blocks.action_execution_contract`
- `parsed_blocks.action_route`
- `parsed_blocks.csa_covered`
- `pending_boundary_followup`
- Extract의 `action_resolution`

이번 PR에서는 DB migration, 운영 데이터 수정, save repair를 하지 않는다.

새 런타임은 과거 필드를 **읽거나 실행하지 않고 무시**한다. 과거 `parsed_blocks`의 다른 Story/replay 정보는 계속 읽혀야 한다.

---

## 3. 필수 변경 사항

### 3.1 파일과 export 삭제

- `src/engine/action-execution-contract.js` 전체 삭제
- `src/engine/index.js`의 다음 export 삭제
  - `resolveActionExecutionContract`
  - `buildActionExecutionContractSection`
  - `classifyMaterialActions`
  - `classifyExecutionMode`
  - `resolveContextualPermission`
  - `resolvePrivacyContext`
  - `resolveRelationshipSignals`
  - `resolveActionTier`
  - `resolveHardBlockers`

### 3.2 Story 경로 삭제

`src/api/turn-routes.js`에서:

- ActionExecutionContract import 및 material classifier wiring 삭제
- 계약 생성·재사용 삭제
- `storyActionContract` 삭제
- `buildSceneCastContract()`의 `actionContract` 전달 삭제
- `applyCsaStorySections()`에서 `playerAction`, `actionContract` 계약용 인자와 일반 행동 contract section 분기 삭제
- Story system prompt의 다음 section 생성 경로 삭제
  - `ACTION EXECUTION CONTRACT — REQUEST`
  - `ACTION EXECUTION CONTRACT — ATTEMPT`
  - `ACTION EXECUTION CONTRACT — AUTHORITATIVE`
- `buildBoundaryFollowupSection()` 및 주입 경로 삭제
- 신규 `parsed_blocks` writer에서 삭제
  - `action_execution_contract`
  - `action_route`
  - `csa_covered`
- live/replay complete payload에서 계약 전용 필드 삭제
  - `action_route`
  - `csa_covered`
- action-contract timing/log 필드 삭제
  - `action_contract_ms`
  - `action_route`
  - `action_material`
  - `action_csa_covered`
  - `action_permission_level`
  - `action_privacy`
  - `action_attempt_basis`

Story에는 플레이어 원문, 사실 context, character canon, scene/cast context, 활성 CSA world rules만 전달한다.

### 3.3 Extract 경로 삭제

`src/api/turn-routes.js`에서:

- `action_execution_contract` payload 주입 삭제
- attempt/blocked 전용 `action_resolution` system 지시 삭제
- 계약 route에 따라 Extract 출력을 다르게 요구하는 모든 분기 삭제

`src/engine/gameplay-state.js`에서:

- `normalizeGameplayExtractEnvelope()`의 `action_resolution` 보존 삭제
- 계약 전용 fixture/degraded shape 정리

### 3.4 Commit 재심사 삭제

`src/api/turn-routes.js`에서 다음 helper와 호출을 모두 삭제한다.

- `RESOLUTION_RESPONSES`
- `isSexualCompletionEvent`
- contract 전용 player-ref/event/ledger 필터
- `validateActionResolution`
- `filterContractSexualLedger`
- `stripPlayerSexualCompletion`
- contract 전용 milestone strip helper
- `applyAcceptedActionScope`
- `applyContractStateFirewall`
- `applyBlockedContractFirewall`

Commit은 정규화된 Extract를 그대로 기존 `applyGuardedStateDelta()`에 전달한다.

단, `applyGuardedStateDelta()`, `reducePlayerSexualState()` 등 이미 존재하는 Story evidence·schema·ID·범위 검증을 약화하거나 삭제하지 않는다. 이번 PR은 사전 계약 기반 재판만 제거한다.

### 3.5 Boundary follow-up 상태 삭제

다음을 제거한다.

- `buildBoundaryFollowupSection()`
- Story prompt 주입
- Commit의 `pending_boundary_followup` writer/expiry logic
- SceneCast `context_npc_ids`에 pending target을 추가하는 경로
- ActionExecutionContract에서 pending을 blocker로 읽는 경로는 파일 삭제로 함께 제거
- 관련 테스트와 fixture

과거 save의 `pending_boundary_followup`은 읽지 않고 무시한다. save migration이나 운영 데이터 정리는 하지 않는다.

### 3.6 SceneCast 결합 제거

`src/engine/scene-cast.js`에서:

- material classifier lazy wiring 전체 삭제
- `sexual_proposal`을 material classifier나 fallback regex로 판정하는 경로 삭제
- policy shape의 `allowed_material_actions` 삭제
- generated dialogue validation의 new-material 검사 삭제
- `buildSceneCastContract()`의 `actionContract` 인자 삭제

다음은 유지한다.

- 등록 NPC canon
- 현재 장면 참가자 판정
- entering / destination / remote 분리
- 이동 목적지 계산
- allowed speaker
- explicit/paraphrase/minor_reaction mode
- 비성적 high-impact intent 검증
- 전체 이름 기반 target 검증

### 3.7 테스트 정리

최소한 다음 파일과 관련 호출자를 전수 점검한다.

- `test/action-execution-contract.test.mjs`
- `test/turn-authority-cleanup-regression.test.mjs`
- `test/gameplay-state-contract.test.mjs`
- `test/company-map-cast-stabilization.test.mjs`
- `test/csa-boundary-streaming.test.mjs`
- `test/full-feature-transplant-v1.test.mjs`
- `test/csa-app-hardening-v1.test.mjs`
- `test/csa-app-port-v1.test.mjs`
- Story/Extract/Commit/recovery 관련 기타 테스트 전부

삭제 대상:

- action route 분류 결과를 보호하는 테스트
- keyword/regex classifier 정확도를 보호하는 테스트
- REQUEST/ATTEMPT/AUTHORITATIVE prompt 문구 테스트
- action_resolution 및 contract firewall 테스트
- pending boundary follow-up 테스트
- `action_route`, `csa_covered`, `action_execution_contract` 저장·SSE 필드 테스트
- material classifier wiring과 material-action player-dialogue policy 테스트

유지·복원해야 하는 제품 계약:

- 일반 Story 턴이 정상 스트리밍·저장·재생된다.
- 플레이어 입력 원문이 Story payload에 그대로 전달된다.
- 활성 CSA는 declarative world rule로만 Story에 전달된다.
- Story가 실제로 묘사한 결과는 Extract→guarded merge로 전달된다.
- Commit은 기존 schema/ID/evidence 검증을 계속 수행한다.
- movement sanitizer와 SceneCast 이동 기능은 유지된다.
- retry/replay/recovery가 과거 contract 필드 없이도 동작한다.
- 과거 `parsed_blocks`에 contract 필드가 있어도 오류 없이 무시한다.
- 새로운 Story 결과에는 contract 전용 필드가 쓰이지 않는다.
- Story/Extract system prompt 어디에도 `ACTION EXECUTION CONTRACT`, `action_resolution`, `BOUNDARY CONTINUITY FOLLOW-UP`이 없다.

테스트 개수를 유지하는 것이 목표가 아니다. 삭제된 구현만 보호하던 테스트는 삭제한다. 새 테스트는 위 아키텍처 경계를 증명하는 최소 회귀 테스트만 추가한다.

---

## 4. 절대 금지

- 삭제한 classifier를 다른 파일로 이동
- 새 keyword matcher 또는 regex gate 추가
- `ActionExecutionContract`를 다른 이름으로 재구현
- 새 action route enum 추가
- 새 consent/permission score 계산기 추가
- 새 Story 전 verifier 추가
- Extract 이후 결과를 새 adapter/firewall로 다시 잘라내기
- `action_resolution` 대체 필드 추가
- pending boundary follow-up의 이름만 변경해 유지
- 새 LLM 호출 추가
- Story·Extract·Commit API 순서 변경
- SceneCast 전체 제거 또는 raw-streaming 전환을 이번 PR에 혼합
- DB migration
- Supabase schema/RPC 변경
- 운영 save 수정·reset·repair
- Cloudflare Worker 배포
- 자동 merge

보안·동의 관련 일반 서사 지침을 새 deterministic 판정기로 옮기지 않는다. Story가 현재 사실·인물 성격·관계·장면을 보고 결과를 쓰고, Extract가 그 실제 결과를 구조화하는 구조로 둔다.

---

## 5. 필수 전수 검색

작업 전후 아래 문자열과 심볼을 `src/**`, `test/**` 전체에서 검색한다.

```text
ActionExecutionContract
action-execution-contract
resolveActionExecutionContract
buildActionExecutionContractSection
classifyMaterialActions
classifyExecutionMode
resolveContextualPermission
resolvePrivacyContext
resolveRelationshipSignals
resolveActionTier
resolveHardBlockers
action_execution_contract
action_route
csa_covered
action_resolution
applyContractStateFirewall
applyAcceptedActionScope
applyBlockedContractFirewall
pending_boundary_followup
BOUNDARY CONTINUITY FOLLOW-UP
ACTION EXECUTION CONTRACT
wireMaterialClassifier
__companyV2MaterialClassifier
allowed_material_actions
sexual_proposal
```

`sexual_proposal`은 다른 독립 제품 계약에서 실제로 필요한 참조가 발견되면 무조건 지우지 말고 호출자와 의미를 보고한다. 단, ActionExecutionContract material matcher를 대체하는 용도로 남기거나 새로 만들면 안 된다.

작업 완료 시 각 문자열에 대해 다음 중 하나를 보고한다.

- 0건
- 과거 문서/fixture 호환용으로 남김 — 정확한 파일과 이유
- 독립 제품 계약으로 남김 — 정확한 호출자와 이유

---

## 6. 검증

반드시 수행한다.

1. 변경 전 전체 테스트 baseline 기록
2. 변경 후 `npm.cmd test` 또는 플랫폼에 맞는 `npm test`
3. 변경 JavaScript 전체 syntax check
4. `git diff --check`
5. 삭제 심볼 전수 검색
6. 신규 대체 matcher/regex/verifier/adapter가 추가되지 않았는지 diff 검토
7. Story prompt snapshot/inspection
8. Extract prompt snapshot/inspection
9. 새 Story `parsed_blocks`에 contract 전용 필드가 없는지 검증
10. 과거 contract 필드가 들어 있는 replay fixture가 무시되며 정상 재생되는지 검증
11. Draft PR 생성 후 GitHub Actions 확인

live LLM, 운영 게임 플레이, Worker 배포는 수행하지 않는다.

---

## 7. 완료 보고 형식

다음 형식으로만 보고한다.

1. 시작 branch / SHA
2. 최종 SHA
3. Draft PR 번호
4. 삭제 파일
5. 수정 파일
6. 제거한 Story 전 권한
7. 제거한 Extract 재심사 경로
8. 제거한 Commit firewall 경로
9. 제거한 boundary follow-up 경로
10. SceneCast에서 제거한 결합과 유지한 기능
11. 과거 저장 필드 호환 방식
12. 삭제 심볼 검색 결과
13. 전체 테스트 전/후 개수와 결과
14. syntax check
15. `git diff --check`
16. GitHub Actions 결과
17. DB·Supabase·Worker·운영 데이터·배포 작업이 모두 없었는지
18. 남겨 둔 관련 참조와 정확한 이유

완료 후 Draft PR까지만 유지하고 자동 병합·배포하지 않는다.

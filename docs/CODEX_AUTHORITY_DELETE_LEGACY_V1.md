# Codex Work Order — authority-delete-legacy-v1

## 0. 목적

Company v1 Story-First Runtime Redesign의 첫 구현 단계다.

이번 PR은 **현재 production runtime에서 이미 호출되지 않는 legacy·dead authority만 삭제**한다. Story, Extract, Commit, UI의 제품 동작을 바꾸는 리팩터링이 아니다.

반드시 먼저 읽는다.

1. `docs/COMPANY_V1_STORY_FIRST_RUNTIME_REDESIGN_CHARTER.md`
2. `docs/COMPANY_V1_AUTHORITY_INVENTORY_2026-08-08.md`

## 1. 시작 기준

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: 이 문서를 포함한 최신 main SHA
- Branch: `company/authority-delete-legacy-v1`
- 새 worktree 사용 권장
- 시작 전에 clean worktree, branch/worktree 미존재, 정확한 main SHA를 보고한다.

## 2. 절대 원칙

```text
삭제 우선
새 matcher 0
새 regex 0
새 verifier 0
새 adapter 0
Story 의미 변화 0
Extract schema 변화 0
DB·운영 변화 0
```

이번 PR에서 제품 동작을 바꾸면 실패다.

## 3. 필수 사전 감사

제품 코드를 수정하기 전에 `src/**`, `test/**`, `docs/**` 전체에서 다음 symbol과 호출자를 검색한다.

```text
resolveCsaDirectCoverage
resolveParticipant
buildCsaDirectCoverageSection
coverage_kind
method_variant_requested
legacyCoverageMatch
csaCoverage
preStoryCsaRouting

buildCsaAcceptanceScopeSection
buildCsaDirectExecutionPrioritySection
buildCsaPersistentSceneSection
buildCsaPhysicalTransitionSection

buildFinderNpcList
resolveNpcLocation
buildNpcFinderPayload
```

각 symbol에 대해 다음을 먼저 기록한다.

- production runtime caller
- test-only caller
- export-only reference
- documentation-only reference
- 삭제 가능 여부

문자열 일괄 삭제는 금지한다. 같은 이름이 canonical schema에서 실제로 필요하면 문맥을 구분한다.

## 4. 작업 A — legacy CSA direct coverage 삭제

### 목표

PR #40 이후 active Story runtime은 이미 `preStoryCsaRouting:false`를 사용한다. 이 호환 경로를 실제 코드에서 삭제한다.

### 필수 조치

- `src/engine/csa/direct-coverage.js` 삭제
- `src/engine/index.js`의 direct coverage export 삭제
- `src/engine/action-execution-contract.js`
  - direct-coverage import 삭제
  - `csaCoverage` input 삭제
  - `preStoryCsaRouting` switch 삭제
  - coverage 계산을 하지 않음
  - 현재 production과 동일하게 `csa_coverage.covered=false` 진단 shape가 필요하면 고정 false projection만 남길 수 있다.
  - fixed false shape조차 runtime reader가 없다면 삭제 후보로 보고하되, 이번 PR에서 API/SSE shape를 바꾸지 않기 위해 임의 삭제하지 않는다.
  - unreachable `csa_direct` branch와 section은 실제 reference를 확인한 뒤 삭제
- `src/engine/csa/reducer.js`
  - `csaCoverage` parameter 삭제
  - `legacyCoverageMatch` fallback 삭제
  - Story 이후 Extract `triggerContinuing` 경로는 이번 PR에서 의미 변경하지 않는다.
- `src/api/turn-routes.js`
  - 삭제된 parameter·import·diagnostic reference 정리
  - active_world_rules와 current Story path는 그대로 유지

### 금지

- direct coverage의 축소판을 새 파일에 생성
- action keyword matcher를 CSA 파일에 재작성
- Story prompt에 대체 route 추가
- Extract에 CSA actor/target preselection 추가

## 5. 작업 B — dead CSA prompt code 삭제

`src/engine/csa/prompt-sections.js`에서 먼저 runtime reference를 확인한다.

삭제 대상 후보:

```text
buildCsaAcceptanceScopeSection
buildCsaDirectExecutionPrioritySection
buildCsaPersistentSceneSection
buildCsaPhysicalTransitionSection
buildCsaDirectCoverageSection
```

또한 `buildCsaRuntimeSection()`의 첫 `return` 뒤 unreachable donor block을 삭제한다.

삭제 가능한 함수는 다음까지 함께 정리한다.

- `turn-routes.js` unused import
- `engine/index.js` export
- test-only import
- exact-string/source assertion

현재 실제로 사용되는 다음 기능은 유지한다.

- `buildCsaCurrentRulesSection`
- 짧은 world-rule runtime section
- public scene section
- weak synergy section
- structured action Story section
- deactivation section
- world-rule epistemic firewall
- Extract runtime/application sections

## 6. 작업 C — 제거된 NPC Finder의 backend 잔존 코드 삭제

`src/api/product-recovery.js`에서 아래 함수가 production caller 없이 test/export에만 남아 있는지 확인한다.

```text
buildFinderNpcList
resolveNpcLocation
buildNpcFinderPayload
```

production caller가 0이면 삭제한다.

이 함수에만 필요한 helper subgraph도 함께 삭제할 수 있다.

단, `buildFullPlayerInfo()`와 context display에 필요한 helper는 절대 손상시키지 않는다.

## 7. 테스트 정리

### 삭제

- direct coverage exact/method_variant/continuation 테스트
- 삭제된 prompt builder exact-string 테스트
- 삭제된 Finder backend 테스트
- source symbol·comment 존재만 확인하는 테스트
- test-only compatibility를 위해 제품 코드를 남기게 만드는 테스트

### 유지

- PR #40 active_world_rules Story projection
- active Story path actor/target preselection 0
- multiple same-scope NPC world-rule applicability
- Story raw preservation
- Extract/Commit existing behavior
- recovery/idempotency

### 원칙

- 삭제한 테스트 수만큼 새 테스트를 추가하지 않는다.
- 동일 사용자 계약이 다른 integration test에 이미 있으면 중복 unit test를 삭제한다.
- 최종 테스트 수 감소는 정상이다.

## 8. 제품 동작 불변 검증

수정 전후 다음을 비교한다.

- Story system prompt 문자 수
- Extract system prompt 문자 수
- active CSA Story prompt의 `active_world_rules` payload
- 일반 턴 Story prompt
- Story SSE event shape
- Extract envelope shape
- Commit response shape

dead code 삭제이므로 runtime 결과가 달라지면 원인을 설명하고 해당 변경을 이번 PR에서 제외한다.

## 9. 금지 작업

- Supabase query/write/repair
- migration 생성·수정·적용
- Cloudflare 배포
- live LLM
- live smoke
- frontend 기능 변경
- SceneCast 변경
- ActionExecutionContract 일반 route 제거
- contract state firewall 제거
- Extract schema 변경
- guarded merge 의미 변경
- save schema 변경
- branch 자동 merge

ActionExecutionContract와 contract firewall 제거는 **다음 별도 PR**이다.

## 10. 검증

- `npm test`
- 수정 JavaScript `node --check`
- JSON parse
- `git diff --check`
- API Wrangler dry-run
- Frontend Wrangler dry-run
- deleted symbol source scan
- 새로운 classifier/verifier/adapter 0건 확인

## 11. 완료 보고 형식

1. 시작 branch/SHA
2. 최종 SHA
3. 변경 파일
4. 삭제 파일·함수
5. production runtime caller 0 근거
6. 제거한 import/export
7. 삭제 테스트 수
8. 통합 테스트 수
9. 최종 테스트 수
10. additions/deletions
11. Story prompt 문자 수 전후
12. Extract prompt 문자 수 전후
13. active_world_rules shape 불변 여부
14. API/SSE/Extract/Commit shape 불변 여부
15. syntax/JSON/diff/full test/dry-run
16. DB·migration·Worker·live LLM·운영 write 0
17. 잔존 legacy
18. 다음 PR로 넘길 ActionExecutionContract 범위

## 12. 완료 기준

다음이 모두 충족돼야 완료다.

- `src/engine/csa/direct-coverage.js` 없음
- production source에서 `resolveCsaDirectCoverage` 0건
- production source에서 `legacyCoverageMatch` 0건
- 삭제 후보 prompt builder 중 runtime caller 0인 함수 없음
- Finder production caller 0인 잔존 함수 없음
- 새 대체 matcher/classifier/verifier 0
- 제품 runtime behavior 변화 0
- 전체 테스트·dry-run 성공
- PR은 Open/Draft 상태, merge·deploy 없음

# Company v1 CSA·Story 안정화 구현 인계서

기준 브랜치: `company/scene-cast-structured-story-v2`  
기준 SHA: `7003da72dc400f8225c85188c953376cdade0ed0`

이 문서는 운영 42~50턴에서 확인된 세 문제를 같은 원인으로 다룬다.

1. Story 원문에 있는 NPC 대사가 저장·표시 과정에서 사라진다.
2. 활성 CSA의 실제 주체·대상·발동 조건·의무를 행동 판정과 Story가 다르게 이해한다.
3. 선택지 형식 강제가 너무 많아 이상한 라벨을 만들거나 선택지 전체를 생략한다.

새 DB, 새 상태 필드, 새 LLM 호출, 새 복구 시스템을 만들지 않는다.

---

## 1. CSA 저장 정본: 무엇이 현재 규정이고 무엇이 과거 기록인가

회사편 CSA 저장 구조는 이미 충분하다. 새 구조를 만들지 않는다.

```js
save.csa_active = ['csa_42', 'csa_42_1']; // 현재 활성 ID만
save.csa_rules = {
  csa_42: { active: true, content: '...', preset: {...} },
  csa_2: { active: false, content: '...', updated_turn: 41 }
}; // 지금까지 등록된 전체 규정 본문과 이력
```

정본 함수:

```js
getActiveCsaEntries(save)
getApplicableCsaEntries(save)
getAllCsaEntries(save)
```

파일: `src/engine/csa/applicability.js`

반드시 지킬 것:

- 현재 Story에 적용할 규정은 `save.csa_active`에 ID가 있고 `save.csa_rules[id].active !== false`인 항목뿐이다.
- 해제된 옛 규정은 `save.csa_rules`에 `active:false`로 남겨야 한다.
- 옛 규정의 저장 기록을 삭제하지 않는다. 해제 후 기억·후속 반응과 감사 이력에 필요하다.
- 대신 해제된 규정을 `applicableCsa`, 현재 Story 프롬프트, direct coverage에 다시 넣지 않는다.
- “옛 규정을 삭제한다”는 뜻은 DB/세이브 이력을 지우는 것이 아니라, 아래의 낡은 프롬프트 가정을 제거한다는 뜻이다.

---

## 2. 이번 턴 활성화와 기존 활성 규정의 구분

`transaction-planner.js`가 규칙에 이미 다음 정보를 저장한다.

```js
rules[newId] = {
  active: true,
  content,
  strength,
  created_turn: turnNumber,
  source_type: 'preset',
  preset: {
    actor_group,
    target_group,
    trigger,
    duration,
    required_action,
    direct_meaning_tags,
    public_normalization,
    persistent
  }
};
```

따라서 새 상태 필드 없이 phase를 계산할 수 있다.

```js
function csaPhase(csa, expectedTurn) {
  if (csa.created_turn === expectedTurn) return 'newly_activated';
  if (csa.updated_turn === expectedTurn) return 'updated';
  return 'ongoing';
}
```

앱 transaction Story에서는 `turn-routes.js`가 이미 다음 projected save를 만든다.

```js
const storySave = csaPlan
  ? {
      ...hydratedSave,
      csa_active: csaPlan.next_csa_active,
      csa_rules: csaPlan.next_csa_rules
    }
  : hydratedSave;
```

이 구조는 유지한다. 문제는 projected save 안의 각 규칙에 phase를 붙여 Story에 명확히 알려주지 않았다는 것이다.

### Story에 넣을 단일 권위 섹션

`src/engine/csa/prompt-sections.js` 안에만 다음 함수를 추가한다. 새 파일을 만들지 않는다.

```js
export function buildCsaCurrentRulesSection(applicableCsa, expectedTurn) {
  if (!Array.isArray(applicableCsa) || applicableCsa.length === 0) return '';

  const lines = applicableCsa.map(csa => {
    const preset = csa?.preset && typeof csa.preset === 'object' ? csa.preset : {};
    const phase = csa.created_turn === expectedTurn
      ? 'newly_activated'
      : csa.updated_turn === expectedTurn
        ? 'updated'
        : 'ongoing';

    return [
      `- csa_id=${csa.id}`,
      `  phase=${phase}`,
      `  content=${csa.content ?? ''}`,
      `  actor_group=${preset.actor_group ?? csa.semantic_contract?.actor_group ?? 'unknown'}`,
      `  target_group=${preset.target_group ?? csa.semantic_contract?.target_group ?? 'none'}`,
      `  trigger=${preset.trigger ?? csa.semantic_contract?.trigger ?? 'none'}`,
      `  duration=${preset.duration ?? csa.semantic_contract?.duration ?? 'continuous'}`,
      `  required_action=${preset.required_action ?? 'content에 적힌 의무'}`,
      `  direct_meaning_tags=${Array.isArray(preset.direct_meaning_tags) ? preset.direct_meaning_tags.join('|') : ''}`
    ].join('\n');
  });

  return `

[CURRENT CSA RULES — SINGLE AUTHORITATIVE LIST]
아래 목록만 현재 적용 규정이다. save.csa_rules에 남아 있더라도 이 목록에 없는 active:false 과거 규정은 현재 행동에 적용하지 않는다.

phase 해석:
- newly_activated: 이번 턴에 내려온 회사 내부의 새 공지·사규·업무 지침이다. NPC는 이번 턴 처음 확인하고 이전 상태와 비교할 수 있다.
- updated: 이번 턴부터 새 본문만 유효하다. 이전 본문은 현재 규정이 아니다.
- ongoing: 이전 턴부터 시행 중인 규정이다. 매 턴 새 공지처럼 재발견하거나 같은 놀람을 반복하지 않는다.

trigger 해석:
- trigger가 현재 입력·장면에서 발생하지 않았으면 직접 의무를 새로 시작하지 않는다.
- trigger가 발생했으면 content와 required_action에 적힌 범위를 축소하지 않고 실행한다.
- duration이 계속되는 동안 이미 시작된 행동·자세·복장 상태는 이전 턴에서 이어간다.
- 모든 active CSA를 자동으로 triggered 또는 continuing 처리하지 않는다.

${lines.join('\n')}`;
}
```

`applyCsaStorySections`에 `expectedTurn`을 받게 하고, CSA 관련 세부 섹션 중 가장 먼저 이 권위 목록을 넣는다.

```diff
-export function applyCsaStorySections(messages, { save, plan, playerAction, csaCatalog, actionContract, master } = {}) {
+export function applyCsaStorySections(messages, { save, plan, playerAction, csaCatalog, actionContract, master, expectedTurn } = {}) {
```

```js
const currentRulesSection = buildCsaCurrentRulesSection(applicableCsa, expectedTurn);
```

```diff
-const storySections = [
+const storySections = [
+  currentRulesSection,
   ...
];
```

호출부:

```diff
-messages = applyCsaStorySections(messages, { save: storySave, plan: csaPlan, playerAction, csaCatalog, actionContract, master });
+messages = applyCsaStorySections(messages, {
+  save: storySave,
+  plan: csaPlan,
+  playerAction,
+  csaCatalog,
+  actionContract,
+  master,
+  expectedTurn
+});
```

---

## 3. `prompt-sections.js`에서 삭제할 낡은 규칙

### 반드시 삭제

`buildCsaRuntimeSection()`:

```text
활성 상식개변은 현재 적용 범위 안에서 원래부터 존재한 사회적 상식으로 취급한다.
```

이 문장은 신규 규정도 과거부터 존재한 것으로 오해하게 만든다.

대체:

```text
현재 적용 규정의 신규·기존 여부는 [CURRENT CSA RULES]의 phase만 따른다.
```

`buildCsaPhysicalTransitionSection()`:

```text
NPC는 새 규범을 원래부터 당연한 상식으로 받아들이지만
```

대체:

```text
NPC는 새 규범을 현재 유효한 회사 규정으로 이해하지만
```

### 회사편에 맞게 교체

`buildCsaPublicSceneSection()`:

```text
주변 동료·상사·방문자·협력사 담당자
```

대체:

```text
주변 동료·상사·다른 부서 직원
```

### 유지할 규칙

다음은 삭제 대상이 아니다.

- 앱·시스템·플레이어의 현실 조작을 NPC가 인식하지 못한다.
- 신규 규정은 이번 턴의 세계 내부 공지로 인식할 수 있다.
- 기존 규정은 매 턴 새 공지처럼 반복하지 않는다.
- 복장·자세는 순간이동하지 않고 실제 동작으로 전환한다.
- 규정 준수와 개인적 수용·애정·동의를 분리한다.
- 해제된 규정의 사건 기억과 현재 물리 상태는 소급 삭제하지 않는다.

### 호환성 alias는 이번 작업에서 삭제하지 않음

`src/engine/csa/semantic-contract.js`의 다음 항목은 옛 Story 규칙이 아니라 저장 호환용 read alias다.

```js
nurse -> coworker
doctor -> manager
hospital_staff -> company_employee
...
```

기존 세이브 재생 가능성을 확인하기 전에는 삭제하지 않는다. 프롬프트에 노출되지 않으므로 현재 메이저 이슈의 원인이 아니다.

---

## 4. 정확한 CSA 요청이 일반 요청으로 떨어진 원인과 선행 수정

운영 `csa_42`:

```js
actor_group: 'company_employee'
target_group: 'coworker'
trigger: 'status_check'
duration: 'until_goal_reached'
required_action: 'relieve_sexual_tension'
direct_meaning_tags: ['성적 긴장', '완화', '도움']
```

현재 장면:

```js
scene_state.participants = ['player-1', 'heroine2'];
```

기존 `resolveParticipant()`는 일반 company group을 NPC 목록에서만 찾았다.

결과:

1. actor `company_employee` -> 윤민아
2. actor를 제외
3. target `coworker` -> 남은 NPC 없음
4. player는 후보에서 처음부터 제외됨
5. coverage 실패
6. `"규정에 따라 완화해주세요"` -> `ordinary_request`
7. `"규정대로 반영하세요"` -> `COMPANY_AUTHORITY_MISUSE`

선행 패치 `src/engine/csa/direct-coverage.js`는 다음을 수정한다.

- actor는 기존처럼 현재 장면의 NPC에서 결정한다.
- actor가 NPC이고 player가 현재 장면의 유일한 다른 회사 인물이라면 `coworker/company_employee/...` target으로 player를 허용한다.
- `sex`, `npc_id`, `role`도 일반 NPC 판정에 사용한다.
- direct tags 두 개만 보지 않고 전체 tags를 본다.
- `컨디션`, `상태`, `성적 긴장`, `완화`, `도움`, `속옷`, `차림`, `근무`처럼 실제 content에 있는 핵심 용어를 제한적으로 사용한다.
- `"규정대로 반영"` 같은 모호한 문장은 applicable CSA가 정확히 하나일 때만 그 규정과 연결한다.
- material action이 감지되면 nonsexual tag match로 우회하지 않는다.

이 패치는 다음을 통과해야 한다.

```js
'규정에 따라 완화해주세요' -> csa_direct, csa_42, npc_to_player
'제 컨디션을 확인하고 성적 긴장을 완화해 주세요' -> csa_direct
'어떻게 완화해 주실 거예요?' -> csa_direct
'규정에 따라 윤민아의 가슴을 만진다' -> covered:false
```

`action-execution-contract.js`는 coverage를 권한 악용 판정보다 먼저 처리하므로, direct coverage가 맞게 나오면 별도 예외문 없이 exact CSA request가 우선한다.

---

## 5. 대사가 사라지는 실제 경로

현재 `turn-routes.js`:

```js
upstreamRaw += text;
flush(gate.push(text));
...
const gated = gate.end();
raw = gated.story_text;
const parsed = parseNarrative(raw, { master });
...
blocks: gate의 segments
dialogue_lines: gate의 blocks
...
record_story_result(... p_story_text: raw ...)
```

`structured-story-v2.js`는 다음을 차단한다.

- `speaker_id`, `acting_direction` 이외 속성
- 짧거나 추상적인 연기 지시
- `이름: 대사`
- `이름 (연기지시): 대사`
- 따옴표 대사
- 대사 본문 다음 줄이 `[SCENE]`이 아닌 경우
- 첫 구조 블록이 `[SCENE]`이 아닌 경우
- 비허용 NPC 이름이 들어간 산문 전체 줄

차단된 문장은 화면, 저장 Story, Extract 어느 곳에도 남지 않는다.

### 최종 원칙

```text
upstreamRaw = 플레이어 가시 원문 정본
parseNarrative(upstreamRaw) = 구조화 표현
gate warnings = 진단 정보
```

### `turn-routes.js`의 완료 처리 목표

```js
const gated = gate.end();
flush(gated.emissions);

raw = upstreamRaw;
const parsed = parseNarrative(raw, { master });

const contractPersisted = {
  ...parsed,
  structured_story_version: STRUCTURED_STORY_VERSION,
  scene_cast_contract: sceneCastContract,
  warnings: [
    ...(parsed.warnings ?? []),
    ...(gated.warnings ?? []),
    ...(storyFallback ? ['app_story_fallback'] : [])
  ],
  action_execution_contract: actionContract,
  action_route: actionContract.route,
  csa_covered: actionContract.csa_coverage.covered
};

await db.callRpc('record_story_result', {
  p_game_id: gameId,
  p_action_id: resolvedActionId,
  p_story_text: raw,
  p_parsed_blocks: contractPersisted
});
```

주의:

- 현재 코드는 `record_story_result`에 요청의 `actionId`를 넘긴다. 중복 예약에서 서버 정본 ID가 달라질 수 있으므로 이 구간을 건드릴 때 `resolvedActionId` 사용 여부도 확인한다.
- parser 결과를 다시 gate-only blocks로 덮어쓰지 않는다.
- `story_text`는 반드시 `upstreamRaw` 기준이다.
- gate를 바로 제거하면 live stream에 구조 마커가 노출될 수 있으므로, 다음 순서로 고친다.

### `structured-story-v2.js` 최소 수정 순서

1. 유효 V2 block은 지금처럼 block event로 변환한다.
2. 형식 오류가 난 line은 버리지 말고 plain text emission으로 보존한다.
3. malformed header 뒤 body 전체를 marker까지 버리는 `discardMalformedDialogueBody` 동작을 제거한다.
4. 이미 대사 body 한 줄을 받은 다음 일반 줄이 오면:
   - 직전 대사를 먼저 확정
   - 다음 줄은 scene/plain text로 다시 처리
5. `speaker="등록 이름"`과 `direction="..."`을 alias로 받아 stable ID로 정규화한다.
6. 짧지만 비어 있지 않은 acting direction은 허용한다.
7. 이름을 stable ID로 확정하지 못하면 metadata만 미확정으로 두고 문장 원문은 보존한다.
8. 비허용 cast의 발화 metadata는 만들지 않되, 문장 자체는 삭제하지 않는다. 산문에 이름이 등장한 것만으로 줄 전체를 삭제하지 않는다.

금지:

- Speaker Tagging LLM 재호출
- 새 recovery module
- 새 DB 필드
- Story 실패 처리 추가

---

## 6. `narrative-parser.js`가 최종적으로 맡을 역할

기존 parser는 이미 다음을 지원한다.

- `이름: 대사`
- `이름 (연기지시): 대사`
- 따옴표 대사
- 등록 화자 추론
- 라벨 있는/없는 선택지

추가할 것은 두 가지뿐이다.

### V2 marker normalization

parse 시작 전에 다음 형태를 parser가 읽는 내부 형식으로 정규화한다.

```js
[DIALOGUE speaker_id="heroine2" acting_direction="고개를 들며"]
대사
```

```js
[DIALOGUE speaker="윤민아" direction="고개를 들며"]
대사
```

둘 다 결과:

```js
{
  type: 'dialogue',
  speaker_id: 'heroine2',
  speaker_name: '윤민아',
  acting_direction: '고개를 들며',
  text: '대사'
}
```

### no marker에서도 line recovery 실행

현재 `no_recognized_markers`에서 raw 전체를 `unparsed` 하나로 반환하지 말고, 전체 raw를 기존 scene/dialogue line parser에 전달한다.

원문을 확정할 수 없는 경우:

```js
{
  type: 'dialogue',
  speaker_id: null,
  speaker_name: null,
  text: '문장'
}
```

또는 scene text로 보존한다. 어떤 경우에도 문장 삭제는 금지한다.

---

## 7. 선택지 계약 단순화

`story-prompt.js`에서 삭제:

```text
라벨 2~5자
공백 금지
라벨 전부 다름
1번 관계 대화
2번 감정·CSA
3번 과감·장난
4번 이동·종료
업무 관련 선택지 금지
```

대체:

```text
[4. 선택지]에는 현재 장면에서 바로 실행할 수 있는 서로 다른 행동 4개를 쓴다.
형식은 "1. 행동 문장"이 기본이다.
"[짧은 라벨] 행동 문장"도 허용하지만 라벨은 선택 사항이다.
각 선택지는 핵심 행동 하나만 담고, 강제적인 접촉·장난·이동·종료를 슬롯처럼 채우지 않는다.
현재 업무 장면에서 자연스러운 업무·대화 선택지는 허용한다.
```

parser/commit 원칙:

- Story에서 유효한 4개를 얻었으면 그대로 정본이다.
- Extract가 다른 선택지로 덮어쓰지 않는다.
- 1~3개만 있으면 기존 유효 문장은 보존하고 부족한 수만 deterministic fallback으로 채운다.
- 0개일 때만 전체 fallback.
- 추가 LLM 호출 없음.

---

## 8. 윤태경

기존 ID와 배치를 유지한다.

```json
{
  "id": "general_yoon_taekyung",
  "name": "윤태경",
  "sex": "male",
  "age": 31,
  "role": "신사업TF 프로젝트 담당",
  "department_id": "new_business_tf",
  "type": "employee",
  "affiliation_type": "employee"
}
```

`new_business_tf`는 이미 `content/organization.json`에 존재한다. 새 부서를 만들지 않는다.

`content/map.json`의 `cross_team_space`:

```diff
-"description":"사내 팀과 외부 협력사가 함께 사용하는 열린 협업 공간."
+"description":"사내 여러 부서가 프로젝트 협업과 짧은 회의를 진행하는 열린 공간."
```

```diff
-"role":"협력사 프로젝트 매니저"
-"department":"외부 협력사"
+"role":"신사업TF 프로젝트 담당"
+"department":"신사업TF"
```

---

## 9. 작업 순서

### 커밋 1 — 먼저 제공된 foundation

- `content/general_npcs.json`
- `src/engine/csa/direct-coverage.js`
- `test/csa-meaning-regression.test.mjs`
- 이 문서

목적:

- 윤태경 내부 직원 전환
- 정확 CSA 요청이 잘못 ordinary로 떨어지는 구조 수정
- 다음 작업자가 저장 정본과 삭제 대상을 오해하지 않게 함

### 커밋 2 — Story 비파괴

- `src/engine/structured-story-v2.js`
- `src/engine/narrative-parser.js`
- `src/api/turn-routes.js`
- 기존 Story 테스트 1개 수정 또는 매트릭스 테스트 1개

### 커밋 3 — 프롬프트/선택지 단순화

- `src/engine/csa/prompt-sections.js`
- `src/engine/story-prompt.js`
- `src/api/turn-routes.js`의 expectedTurn 전달
- 기존 프롬프트 테스트 1개 수정

커밋을 세 개로 나누는 이유는 시스템을 늘리기 위해서가 아니라, 대사 손실 회귀와 CSA 의미 회귀를 독립적으로 되돌릴 수 있게 하기 위해서다.

---

## 10. 금지 범위

- DB migration
- RPC signature 변경
- save schema 변경
- 새 상태 필드
- 새 LLM 호출
- speaker tagging LLM 복원
- 새 parser/recovery 모듈
- 프론트 CSS 변경
- 테스트 대정리
- 해제된 `csa_rules` 기록 삭제
- hospital compatibility alias 일괄 삭제
- 모든 active CSA를 무조건 continuing 처리하는 새 helper

---

## 11. 최소 검증

1. 단위 테스트 전체.
2. 임시 게임 4턴:
   - 신규 always-on + 조건부 CSA 활성화
   - 다음 일반 대화에서 신규 공지 반복 없음
   - 조건부 exact request에서 csa_direct
   - 범위 밖 확대 요청은 ordinary
3. 네 턴 모두:
   - 원문 대사 유실 0
   - 대화 UI 표시
   - 선택지 4개
   - 같은 신규 공지 반복 0
4. 임시 게임 삭제.
5. 운영 게임 read-only.
6. DB·Frontend Worker는 변경하지 않음.
7. API 코드/content가 최종 변경될 때만 API Worker 배포.

완료 보고 마지막에 반드시 확인:

```bash
git status --short
git rev-parse HEAD
git rev-parse origin/company/scene-cast-structured-story-v2
```

대상 브랜치에 병합·푸시한 뒤 로컬 HEAD와 원격 SHA가 같지 않으면 완료로 보고하지 않는다.

# CODEX WORK ORDER — Raw Story Streaming V1

> **작업 성격:** Story transport 권위 단일화 / Phase 3A  
> **저장소:** `zeroslove-ai/company-v1`  
> **작업 브랜치:** `company/raw-story-streaming-v1`  
> **현재 stacked 기준:** PR #42 head `4f1de6147c06ab841a43baaa18da5877366cc937`  
> **선행 PR:** #42 `company/remove-action-execution-authority-v1`  
> **상위 원칙:** `docs/COMPANY_V1_STORY_FIRST_RUNTIME_REDESIGN_CHARTER.md`  
> **감사 기준:** `docs/COMPANY_V1_AUTHORITY_INVENTORY_2026-08-08.md`

---

# 0. 실행 전 필수 조건

이 브랜치는 PR #42가 아직 병합되지 않은 상태에서 미리 만든 **stacked branch**다.

## 0.1 PR #42 병합 전에는 제품 코드 작업 금지

PR #42가 `main`에 병합되기 전에는 이 문서 외 제품 코드를 수정하지 않는다.

병합 후 반드시 다음을 확인한다.

1. `origin/main`이 PR #42의 삭제 내용을 포함한다.
2. `src/engine/action-execution-contract.js`가 존재하지 않는다.
3. PR #42에서 제거한 Story/Extract/Commit 권한이 다시 생기지 않았다.
4. 작업 트리가 clean이다.
5. 이 브랜치를 새 `origin/main` 위로 재정렬한다.

PR #42가 squash merge되었다면 다음 방식으로 문서 커밋만 새 main 위로 옮긴다.

```bash
git fetch origin
git switch company/raw-story-streaming-v1
git rebase --onto origin/main 4f1de6147c06ab841a43baaa18da5877366cc937
git push --force-with-lease origin company/raw-story-streaming-v1
```

명령을 그대로 맹신하지 말고, rebase 전후 `git log --oneline --decorate -10`과 `git diff origin/main...HEAD --stat`을 확인한다. 제품 코드가 의도치 않게 중복되거나 PR #42 변경이 되살아나면 즉시 중단한다.

## 0.2 작업 시작 보고

코딩 전에 아래를 보고한다.

- 현재 branch / HEAD SHA
- `origin/main` SHA
- PR #42 merge 여부와 merge SHA
- clean 여부
- `origin/main...HEAD`에 문서 외 변경이 없는지
- 아래 심볼의 실제 호출자 목록
  - `createStructuredStoryGate`
  - `STRUCTURED_STORY_VERSION`
  - `stream_segments`
  - `buildStructuredStoryV2ExtractText`
  - `runSpeakerTagging`
  - frontend `complete`/`extract` parsed-block replacement

---

# 1. 목표

이번 PR의 목표는 하나다.

> **LLM upstream이 생성한 raw Story를 라이브 화면, DB 저장, replay, Extract 입력, Commit evidence의 단일 정본으로 만든다.**

최종 흐름은 다음이어야 한다.

```text
upstream Story chunk
→ 즉시 SSE delta
→ 브라우저 rawStory에 그대로 누적·표시
→ 동일한 누적 문자열을 game_actions/game_turns story_text로 저장
→ 동일한 story_text를 replay
→ 동일한 story_text를 Extract에 전달
→ 동일한 story_text로 Commit evidence 검증
```

Parser는 raw Story 뒤에서 실행되는 비파괴 projection이다.

```text
raw Story
├─ canonical text: 화면·DB·replay·Extract·evidence
└─ derived projection: blocks·choices·dialogue metadata·warnings
```

Parser, speaker 판정, marker 형식, 대사 블록 완성 여부 때문에 raw Story 문자 하나라도 늦게 보내거나 삭제하거나 다른 문자열로 교체해서는 안 된다.

---

# 2. 현재 실제 문제

## 2.1 라이브 화면이 raw stream이 아니다

`src/api/turn-routes.js`의 현재 live Story 경로는 다음 순서다.

```js
upstreamRaw += text;
flush(gate.push(text));
```

`createStructuredStoryGate()`는 한 줄이 끝날 때까지 버퍼링하며, marker·화자·SceneCast·연기 지시·비구조화 대사를 검사한다. 따라서 첫 upstream chunk가 도착해도 개행 전에는 화면에 보이지 않을 수 있다.

또한 gate가 만든 `block`/`delta`만 라이브 화면으로 보내므로, 화면에 보인 문자열과 `upstreamRaw`가 달라질 수 있다.

## 2.2 DB는 raw지만 replay는 gate projection이다

`story_text`에는 `upstreamRaw`가 저장되지만, V2 replay는 `parsed_blocks.stream_segments`를 우선 재생한다. 라이브와 DB 정본이 분리돼 있다.

## 2.3 Extract가 raw Story를 받지 않는다

현재 V2 Extract는 다음 문자열을 사용한다.

```js
buildStructuredStoryV2ExtractText(parsedStory)
```

이 함수는 `parsedStory.blocks`만 다시 직렬화한다. gate/parser가 분류하지 못한 문장, 화자 미확정 대사, malformed marker는 Extract 입력에서 빠질 수 있다.

## 2.4 Commit evidence도 raw Story가 아닐 수 있다

Commit의 guarded merge에는 `parsedStory.normalized_raw`가 우선 전달된다. parser가 정규화한 문자열이 raw Story보다 높은 evidence 권위를 갖는다.

## 2.5 브라우저가 같은 턴을 여러 번 교체한다

현재 frontend는 다음 순서로 현재 Story를 다시 그린다.

1. 매 `delta`마다 frontend parser 결과로 렌더
2. `complete.parsed_blocks`로 전체 교체
3. Extract 응답의 `parsed_blocks`로 다시 전체 교체

화자·블록 해석이 달라질 때 사용자가 보던 문장이나 카드가 완료 시점에 바뀔 수 있다.

---

# 3. 최종 제품 계약

아래는 구현 방식이 아니라 반드시 성립해야 하는 제품 계약이다.

## 3.1 즉시 전송

- `streamStory().chunks`가 yield한 각 non-empty string을 같은 turn loop에서 즉시 `delta`로 emit한다.
- 개행, marker, dialogue block 완성, parser 결과를 기다리지 않는다.
- 첫 upstream chunk가 `"[1."`처럼 불완전해도 즉시 전달한다.
- server-side line buffer를 새 이름으로 다시 만들지 않는다.

## 3.2 문자 동일성

일반 Story와 app transaction fallback 모두 다음이 정확히 같아야 한다.

```text
concat(all live delta.text)
=== record_story_result.p_story_text
=== saved action.story_text
=== committed game_turns.story_text
```

공백, 개행, marker, 따옴표, malformed text까지 동일해야 한다.

## 3.3 Replay 동일성

- replay는 `action.story_text`를 정본으로 사용한다.
- 과거 `parsed_blocks.stream_segments`가 존재해도 transport source로 사용하지 않는다.
- replay delta를 한 번에 보내든 여러 chunk로 나누든, 연결 결과는 `action.story_text`와 완전히 같아야 한다.
- 과거 `block` event 순서를 복원하려고 raw text를 재구성하지 않는다.

## 3.4 Parser 비차단

- parser는 upstream stream 종료 후 raw text를 기반으로 실행할 수 있다.
- parser 결과는 `parsed_blocks` projection으로 저장할 수 있다.
- parser 실패는 raw Story 표시를 취소하거나 Story를 재생성해서는 안 된다.
- parser 실패 시 같은 함수 안에서 최소 derived envelope와 warning만 저장한다. 새 recovery layer·LLM·sanitizer를 만들지 않는다.
- DB `record_story_result` 실패는 별도 저장 실패로 처리할 수 있지만, parser 의미 판정 실패와 혼동하지 않는다.

## 3.5 Extract raw 입력

- `buildExtractPrompt(...).story_text`는 항상 `action.story_text`다.
- `buildStructuredStoryV2ExtractText()`와 `parsedStory.normalized_raw`를 Story text 대체물로 사용하지 않는다.
- `parsed_story`는 choices/dialogue/warnings 등의 보조 metadata일 뿐이다.
- `parsed_story`에 없는 문장도 raw `story_text`에 있으면 Extract가 볼 수 있어야 한다.
- Extract prompt에서 “Story는 이미 정규화됐고 모든 발화에 명시적 화자가 있다”는 전제를 제거한다.
- 화자 미확정 대사는 원문에 그대로 남는다. Extract가 화자를 확정하지 못하면 해당 dialogue metadata만 비우거나 생략한다.

## 3.6 Commit raw evidence

- `applyGuardedStateDelta()`와 evidence validator가 받는 Story text는 `action.story_text`다.
- `normalized_raw`, reconstructed blocks, tagged text를 exact evidence 정본으로 사용하지 않는다.
- 상태 delta가 raw Story의 exact substring을 근거로 하지 못하면 해당 delta만 폐기하는 기존 원칙은 유지한다.

## 3.7 Frontend 비교체

- frontend `rawStory` 누적 문자열이 현재 턴의 유일한 텍스트 정본이다.
- 매 delta 후 parser projection으로 장식할 수는 있지만, projection이 raw 문자열을 대체해서는 안 된다.
- `complete.parsed_blocks` 수신 시 현재 Story 전체를 교체하지 않는다.
- Extract 응답의 `parsed_blocks`로 현재 Story 전체를 교체하지 않는다.
- non-empty raw delta가 들어왔는데 parser projection이 아직 빈 경우, raw text가 임시 plain projection으로 보여야 한다. 첫 delta를 숨기면 실패다.
- choices는 raw Story에서 파생해 계속 표시한다.

---

# 4. 구현 범위

## 4.1 `src/api/turn-routes.js` — live Story transport

현재 gate 경로를 제거한다.

삭제 대상:

- `createStructuredStoryGate()` 생성
- `gate.push()`
- `gate.end()`
- `flush(gated.emissions)`
- live `block` SSE event 생성
- gate block/warning 수치에 의존하는 timing
- `stream_segments` 신규 writer

대체 흐름은 단순해야 한다.

```js
let upstreamRaw = '';
for await (const text of stream.chunks) {
  upstreamRaw += text;
  emit('delta', { text });
}
```

app transaction fallback도 동일하게 raw fallback 문자열을 바로 emit하고 같은 문자열을 저장한다.

새 `RawStoryGate`, `StreamingNormalizer`, line buffer, marker filter를 만들지 않는다.

## 4.2 Story post-processing

stream 종료 후:

1. `raw = upstreamRaw`
2. raw를 그대로 parser에 전달
3. parser 결과는 derived `parsed_blocks`
4. `record_story_result`에는 raw `story_text`와 derived blocks 저장
5. `complete`는 metadata·warnings 전달용이며 live text replacement 명령이 아니다

`structured_story_version`은 이번 PR에서 **transport 권위로 사용하지 않는다**.

현재 legacy speaker-tagger가 `structured_story_version === 2`를 보고 신규 턴 호출을 억제하므로, 이 필드를 무작정 없애 `runSpeakerTagging()`이 신규 턴마다 다시 실행되게 만들면 안 된다.

이번 PR에서는 다음 중 더 작은 방법을 택한다.

- passive parser projection marker로 `structured_story_version: 2`를 잠시 유지하되 replay/Extract/transport 분기에 사용하지 않는다.
- `src/engine/structured-story-v2.js`를 상수 하나 때문에 보존하지 않는다. gate가 전부 죽으면 local passive constant 또는 기존 parser module의 비권위 상수로 정리한다.

server speaker-tagger 전체 삭제는 Phase 3B다. 단, 호출 조건이 신규 raw 턴에 재활성화되지 않는지 반드시 테스트한다.

## 4.3 Replay

현재 `stream_segments` 우선 branch를 제거한다.

신규·과거 턴 모두 `action.story_text`를 emit한다. 과거 row의 다음 필드는 읽지 않고 무시한다.

- `parsed_blocks.stream_segments`
- gate 전용 warnings
- gate block transport order

DB migration은 하지 않는다.

## 4.4 `src/engine/extract-prompt.js`

- `buildStructuredStoryV2ExtractText()`를 삭제한다.
- `src/engine/index.js` export를 삭제한다.
- 호출자와 이 함수만 보호하는 테스트를 삭제한다.
- `buildExtractPrompt()`의 `story_text`는 caller가 전달한 raw를 그대로 JSON payload에 넣는다.
- `buildParsedStoryProjection()`은 후행 metadata로 유지할 수 있다.
- SYSTEM_INSTRUCTIONS의 정규화 전제를 raw Story 계약에 맞게 최소 수정한다.
- Extract가 Story 문장을 다시 쓰거나 “정상화된 Story”를 전제로 대사를 누락하지 않게 한다.

## 4.5 Commit path

`src/api/turn-routes.js` Commit에서 다음 fallback을 제거한다.

```js
(parsedStory?.normalized_raw ?? '').trim()
  ? parsedStory.normalized_raw
  : action.story_text
```

항상 `action.story_text`를 전달한다.

관련 evidence tests는 normalized text가 아니라 raw exact substring 기준으로 바꾼다.

## 4.6 `src/engine/structured-story-v2.js`

실제 호출자 조사 후 처리한다.

- production caller가 gate뿐이면 gate 구현과 파일을 삭제한다.
- 다른 production projection helper가 실제 사용 중이면 raw를 삭제·차단하지 않는 helper만 남기고 파일 책임을 명확히 축소한다.
- 테스트에서만 호출되는 helper를 유지하지 않는다.
- `createStructuredStoryGate`, `gate.push`, `gate.end`, `stream_segments` 생성 권한은 최종 코드에 남기지 않는다.

삭제한 gate를 `narrative-parser.js`나 frontend에 같은 기능으로 옮기지 않는다.

## 4.7 Frontend `src/frontend/pages/app.js`

`runStoryForPending()`:

- `delta`의 text를 `rawStory`에 그대로 누적한다.
- 누적 raw에서 display projection을 만들 수 있다.
- `complete.parsed_blocks`로 `onStory`를 다시 호출해 전체 교체하는 branch를 제거한다.
- raw가 비어 있지 않으면 projection 실패 때문에 `incomplete_story_stream`으로 처리하지 않는다.

`onExtract`:

- Extract `parsed_blocks`로 current Story를 다시 렌더하는 branch를 제거한다.
- Extract는 상태 panel·Mind Monitor 등 보조 UI만 갱신한다.

`renderNarrative`/frontend parser:

- 이번 PR에서는 화자 추론 알고리즘을 전면 재작성하지 않는다.
- 다만 partial raw가 non-empty인데 visible block이 0개가 되는 경우 plain text fallback을 허용한다.
- fallback은 display-only이며 raw를 수정·저장하지 않는다.

## 4.8 SSE contract

- `meta`, `delta`, `complete`, `error`는 유지한다.
- server-generated `block` event가 더 이상 필요 없다면 writer와 이를 보호하는 테스트를 삭제한다.
- client가 알 수 없는 event를 무시하는 기존 내구성은 유지한다.
- 새로운 parallel text event를 추가하지 않는다.

---

# 5. 명시적 비범위

이번 PR에 섞지 않는다.

- SceneCast 전체 제거
- SceneCast movement/presence/speaker policy 재설계
- frontend `narrative.js` 화자 추론 전면 삭제
- server `speaker-tagger.js` 전체 재설계
- Extract `dialogue_lines` writer 전체 제거
- TTS focal/last-speaker fallback 제거
- 선택지 writer 단일화
- Extract schema 대폭 축소
- scene participant 단일 writer
- guarded merge·movement sanitizer 전면 개편
- CSA runtime/progression 개편
- loading UI 디자인 변경
- DB migration
- Supabase 실행
- Worker 배포
- 운영 데이터 수정
- live LLM 호출

필요한 동작이 비범위 시스템과 충돌하면 새 우회 계층을 만들지 말고 완료 보고에 남긴다.

---

# 6. 금지 구현

다음은 실패다.

- gate를 이름만 바꿔 재구현
- server에서 일정 글자 수/개행까지 모았다가 emit
- malformed marker를 제거한 뒤 emit
- speaker가 불명확한 대사를 live stream에서 삭제
- `stream_segments_v2`, `canonical_segments`, `safe_story_text` 같은 새 정본 추가
- raw와 normalized Story를 둘 다 canonical처럼 저장
- complete 시 server parsed blocks로 화면 전체 교체
- Extract 시 tagged blocks로 화면 전체 교체
- Extract에 reconstructed Story 전달
- Commit evidence에 normalized Story 전달
- parser 실패 시 Story 재생성
- parser 실패 시 raw Story 폐기
- 새 verifier/sanitizer/router/recovery state 추가
- 테스트 통과를 위해 obsolete field를 계속 쓰기

---

# 7. 필수 테스트

테스트 숫자 유지가 목표가 아니다. 삭제된 구현만 보호하던 테스트는 삭제한다.

## 7.1 Server live streaming

1. 첫 upstream chunk에 개행이 없어도 첫 `delta`가 즉시 발생한다.
2. `[DIAL`처럼 불완전 marker도 그대로 delta에 포함된다.
3. malformed dialogue body도 삭제되지 않는다.
4. 여러 upstream chunk의 delta 연결 결과가 exact raw와 같다.
5. raw 연결 결과가 `record_story_result.p_story_text`와 같다.
6. app transaction fallback의 emit text와 saved story text가 같다.
7. `block` event 없이 Story가 정상 완료된다.

## 7.2 Replay

1. `stream_segments`가 raw와 다른 과거 action을 준비한다.
2. replay delta 연결 결과가 `action.story_text`와 정확히 같다.
3. replay가 `stream_segments`의 삭제·재배열 결과를 사용하지 않는다.
4. complete metadata가 replay text를 교체하지 않는다.

## 7.3 Extract

다음 raw를 사용한다.

```text
[1. 서사 및 행동]
문장이 개행 없이 이어지고 [DIALOGUE broken
화자 미확정 대사도 그대로 남는다.
```

검증:

- Extract user payload의 `story_text`가 위 raw와 완전히 같다.
- `parsed_story.blocks`에서 일부 문장이 빠져도 `story_text`에는 남는다.
- `buildStructuredStoryV2ExtractText` 호출이 없다.
- 신규 raw 턴이 legacy speaker-tagger를 호출하지 않는다.

## 7.4 Commit evidence

- raw에만 존재하고 `normalized_raw`에는 변형된 exact quote가 있을 때 raw quote를 기준으로 판단한다.
- raw에 없는 normalized-only quote는 evidence로 승인하지 않는다.
- raw Story 자체는 Commit validator가 수정하지 않는다.

## 7.5 Frontend

1. 첫 partial delta가 들어오면 current Story가 비어 있지 않다.
2. delta 누적 raw 순서가 보존된다.
3. `complete.parsed_blocks`가 다른 blocks를 보내도 current Story를 교체하지 않는다.
4. Extract `parsed_blocks`가 다른 blocks를 보내도 current Story를 교체하지 않는다.
5. raw 끝의 선택지가 계속 표시된다.
6. replay raw도 live와 같은 렌더 경로를 사용한다.
7. Story가 표시된 뒤 Extract/Commit 진행 상태 UI가 Story를 가리지 않는다. 이번 PR에서 CSS를 바꾸지 않아도 기존 동작을 회귀 검증한다.

## 7.6 Recovery

- `retry_story`에서 저장된 raw action은 replay raw를 사용한다.
- Story 저장 전 네트워크 실패는 기존 입력 복원·retry 동작을 유지한다.
- Story 저장 후 Extract 실패는 raw Story를 화면과 DB에 유지한다.
- 새로고침 후 recent turn의 `story_text`가 원문 그대로 표시된다.

---

# 8. 삭제 검색

작업 완료 후 `src/**`에서 확인한다.

반드시 0건이어야 하는 active runtime 심볼:

- `createStructuredStoryGate`
- `gate.push(`
- `gate.end(`
- `buildStructuredStoryV2ExtractText`

`stream_segments`:

- 신규 writer 0건
- replay transport reader 0건
- 문서·과거 fixture에 남아 있다면 위치와 이유를 보고

`block` SSE:

- Story runtime writer 0건
- 테스트가 obsolete block event 생성을 강제하지 않음

다음은 남을 수 있지만 Story 정본으로 사용하면 실패다.

- `normalized_raw`
- `dialogue_lines`
- `structured_story_version`
- legacy speaker-tagging metadata

각 잔존 참조를 목록으로 보고하고, raw transport/Extract/evidence 분기에 사용되지 않음을 설명한다.

---

# 9. 검증 명령

최소 검증:

```bash
npm test
node --check src/api/turn-routes.js
node --check src/engine/extract-prompt.js
node --check src/frontend/pages/app.js
git diff --check
git status --short
```

수정한 모든 JavaScript 파일에 `node --check`를 실행한다.

추가 확인:

```bash
git grep -n "createStructuredStoryGate\|buildStructuredStoryV2ExtractText\|stream_segments\|event === 'block'\|event === \"block\"" -- src test
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- src/api/turn-routes.js src/engine/extract-prompt.js src/frontend/pages/app.js
```

테스트 개수가 줄면 다음을 분리 보고한다.

- 삭제된 gate 구현 테스트
- 삭제된 exact prompt/source regex 테스트
- 유지·신설한 제품 회귀 테스트
- 최종 테스트 수

---

# 10. PR 규칙

- PR base는 PR #42 병합 후의 `main`이다.
- Draft PR로 생성한다.
- PR #42를 base로 하는 stacked PR을 그대로 열지 않는다.
- 자동 Ready 전환 금지
- 자동 병합 금지
- 배포 금지
- Supabase 변경 금지
- live LLM 호출 금지

권장 PR 제목:

```text
refactor: make raw Story the streaming authority
```

---

# 11. 완료 보고 형식

1. 시작 branch / SHA
2. 시작 `origin/main` SHA 및 PR #42 merge SHA
3. 최종 SHA
4. Draft PR 번호
5. 변경 파일
6. 삭제 파일
7. live Story transport 변경
8. replay 변경
9. Extract raw 입력 변경
10. Commit evidence 변경
11. frontend complete/Extract 비비교체 변경
12. `stream_segments` 잔존 참조
13. `structured_story_version` 잔존 참조와 이유
14. speaker-tagger 신규 턴 비활성 검증
15. 삭제한 테스트와 이유
16. 신설·유지한 제품 회귀 테스트
17. 전체 테스트 결과
18. syntax check
19. `git diff --check`
20. GitHub Actions
21. DB/Supabase/Worker/운영 데이터/배포/live LLM 수행 여부
22. 실플레이가 아직 필요함을 명시

---

# 12. 완료 판정

다음이 모두 성립해야 완료다.

```text
first upstream chunk → 즉시 화면
concat(live deltas) === saved story_text
replay text === saved story_text
Extract story_text === saved story_text
Commit evidence source === saved story_text
complete parsed blocks ≠ 화면 교체 권한
Extract parsed blocks ≠ 화면 교체 권한
parser failure ≠ Story 폐기
```

CI 통과만으로 최종 완료가 아니다. 병합 후 테스트 배포와 실제 플레이에서 첫 delta 체감, malformed 출력 보존, 새로고침 replay, Extract 실패 후 다음 턴 가능 여부를 확인해야 한다.

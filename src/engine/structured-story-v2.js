/**
 * Structured Story V2 — 스트리밍 블록 게이트 (안정화 패치 반영).
 *
 * Story 전체를 버퍼링하지 않는다. 완성된 라인 단위로 처리하고, 헤더 한 줄과
 * 진행 중인 대사 블록 하나 정도만 임시로 들고 있다가 블록이 닫히는 즉시 흘려보낸다.
 *
 * 게이트를 통과하지 못한 대사 블록은:
 *   - 화면에 출력되지 않고
 *   - parsed_blocks에 저장되지 않고
 *   - story_text 정본에 포함되지 않고
 *   - Extract 입력에 전달되지 않으며
 *   - 경고 코드만 남기고 다음 정상 블록부터 스트리밍이 계속된다.
 *
 * 안정화 패치:
 *   A — 플레이어 대사 의미 범위 검증 (validatePlayerDialogueAgainstPolicy)
 *   B — 비구조화 대사(따옴표 단독·이름: 대사·구형 형식·서술문 내 발화) 우회 차단
 *   C — malformed 구조화 블록 fail-closed (닫히지 않은 헤더·속성 오류·미지 마커)
 *   D — ordered segments (장면·대사의 원래 순서 보존)
 *   G — SCENE-first (첫 유효 블록이 DIALOGUE면 dialogue_before_scene 차단)
 *   H — stream_segments (live/replay 동일 순서 재생용)
 */

import { canSpeak, validatePlayerDialogueAgainstPolicy } from './scene-cast.js';

export const STRUCTURED_STORY_VERSION = 2;

export const DIALOGUE_WARNINGS = {
  MISSING_SPEAKER: 'dialogue_missing_speaker_id',
  UNKNOWN_SPEAKER: 'dialogue_unknown_speaker_id',
  NOT_IN_CAST: 'dialogue_speaker_not_in_cast',
  MISSING_DIRECTION: 'dialogue_missing_acting_direction',
  INVALID_DIRECTION: 'dialogue_invalid_acting_direction',
  PLAYER_POLICY: 'player_dialogue_policy_violation',
  ANONYMOUS: 'anonymous_dialogue_blocked',
  MALFORMED: 'malformed_structured_story_block',
  UNSTRUCTURED: 'unstructured_dialogue_blocked',
  UNKNOWN_MARKER: 'unknown_structured_story_marker',
  BEFORE_SCENE: 'dialogue_before_scene'
};

// ---------------------------------------------------------------------------
// 연기 지시 검증 (spec 7)
// ---------------------------------------------------------------------------

/**
 * 금지된 추상 연기 지시 (spec 7.2). 이 단어들만으로 이뤄진 지시는 차단하고,
 * 관찰 가능한 행동이 함께 있으면 허용한다 — 예: '차분한 목소리로 서류를 앞으로 밀며'.
 */
const BANNED_DIRECTION_TERMS = [
  '자연스럽게', '자연스레', '평범하게', '적당히', '보통 말투로', '보통말투로',
  '대답하며', '답하며', '말하며', '말하면서', '진지하게', '차분하게', '담담하게'
];

/** 지시에서 금지어를 제거하고 남는 실질 내용이 있는지 본다. */
export function isConcreteActingDirection(direction) {
  const text = typeof direction === 'string' ? direction.trim() : '';
  if (!text) return false;
  let remainder = text;
  for (const term of BANNED_DIRECTION_TERMS) remainder = remainder.split(term).join(' ');
  const meaningful = remainder.replace(/[\s,.·…‥"'“”’‘\-—~!?()[\]0-9]/gu, '');
  return meaningful.length >= 2;
}

// ---------------------------------------------------------------------------
// 수정 C — 허용 마커 / malformed / 미지 마커
// ---------------------------------------------------------------------------

/** V2에서 허용되는 top-level 섹션 마커. */
const SECTION_MARKERS = new Set([
  '[1. 서사 및 행동]',
  '[2. 플레이어 속마음]',
  '[3. 플레이어 상황판]',
  '[4. 선택지]'
]);

const SCENE_MARKER = '[SCENE]';
const DIALOGUE_OPEN = '[DIALOGUE';

function isSectionMarker(line) {
  return SECTION_MARKERS.has(typeof line === 'string' ? line.trim() : line);
}

/**
 * [DIALOGUE ...] 헤더 속성을 파싱한다.
 * 반환: { ok: true, attrs: { speaker_id, acting_direction } }
 *      | { ok: false } — 닫는 ] 누락·따옴표 누락·중복 속성·알 수 없는 속성
 */
export function parseDialogueHeader(headerSource) {
  const source = typeof headerSource === 'string' ? headerSource : '';
  // 닫는 ] 누락
  if (!/\]\s*$/.test(source)) return { ok: false };
  const attrs = {};
  const seen = new Set();
  const attrPattern = /([A-Za-z_]+)\s*=\s*"([^"]*)"/gu;
  let match;
  while ((match = attrPattern.exec(source)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    if (seen.has(name)) return { ok: false }; // 중복 속성
    seen.add(name);
    attrs[name] = value;
  }
  // 필수 속성 존재 + 따옴표 형태 검증
  if (!('speaker_id' in attrs) || attrs.speaker_id === '') return { ok: false };
  if (!('acting_direction' in attrs) || attrs.acting_direction === '') return { ok: false };
  // 알 수 없는 필수 구조 속성 (옵션 허용 목록)
  const allowedAttrs = new Set(['speaker_id', 'acting_direction']);
  for (const name of seen) {
    if (!allowedAttrs.has(name)) return { ok: false };
  }
  return { ok: true, attrs };
}

// ---------------------------------------------------------------------------
// 수정 B — 비구조화 대사 라인 분류
// ---------------------------------------------------------------------------

/** 비발화 인용(문서·메일·공지·슬라이드·메신저) 보존 패턴. */
const NON_SPEECH_QUOTATION = /(문서 제목|메일 제목|공지에는|공지에|슬라이드 문구|슬라이드|메신저 화면|제목은|제목이|적혀 있다|적혀|쓰여 있다|쓰여|표시됐다|표시됐|표시가|이라고 적|라고 적|이라는 문구)/u;

/** 서술문 내 발화를 암시하는 화행 동사. */
const SPEECH_VERBS = /(말했다|말하며|말하고|물었다|물으며|대답했다|대답하며|외쳤다|속삭였다|중얼거렸다|요청했다|명령했다|소개했다|소개하며|부르며|불렀다|설명했다|설명하며|외치며|중얼거리며)/u;

/**
 * V2 scene text 라인을 분류한다 (안정화 수정 B 4.2).
 * 반환: 'plain_narration' | 'non_speech_quotation' | 'unstructured_dialogue'
 *      | 'structured_marker' | 'malformed_marker' | 'blank'
 */
export function classifyV2SceneLine(line, context = {}) {
  const text = typeof line === 'string' ? line.trim() : '';
  if (!text) return 'blank';
  if (text.startsWith('[')) {
    if (text === SCENE_MARKER || text.startsWith(DIALOGUE_OPEN)) return 'structured_marker';
    if (isSectionMarker(text)) return 'structured_marker';
    return 'malformed_marker';
  }
  // 1) 따옴표 단독 — 전체가 인용문
  if (/^["“”'][^"“”']{1,300}["“”']$/.test(text)) return 'unstructured_dialogue';
  // 2) 이름·직급 라벨: 대사 — "이메이: 네" / "팀장님: 네"
  if (/^[가-힣A-Za-z ]{1,20}\s*[:：]\s*/.test(text) && !NON_SPEECH_QUOTATION.test(text)) {
    return 'unstructured_dialogue';
  }
  // 3) 구형 형식 — "이메이 (고개를 들며): “네”"
  if (/^[가-힣A-Za-z ]{1,20}\s*\([^)]{1,60}\)\s*[:：]\s*/.test(text) && !NON_SPEECH_QUOTATION.test(text)) {
    return 'unstructured_dialogue';
  }
  // 4) 서술문 내 실제 발화 — 화행 동사 + 인용 (비발화 인용은 보존)
  if (SPEECH_VERBS.test(text) && /["“”']/.test(text)) {
    if (NON_SPEECH_QUOTATION.test(text)) return 'non_speech_quotation';
    return 'unstructured_dialogue';
  }
  return 'plain_narration';
}

// ---------------------------------------------------------------------------
// 대사 블록 검증
// ---------------------------------------------------------------------------

/**
 * 대사 블록 하나를 계약에 대조해 검증한다 (수정 A: 플레이어 의미 범위 포함).
 * 반환: { ok: true, block } 또는 { ok: false, warning }
 */
export function validateDialogueBlock({ headerAttributes, body, contract, speakerNames }) {
  const text = typeof body === 'string' ? body.trim() : '';
  const speakerId = attribute(headerAttributes, 'speaker_id');
  const actingDirection = attribute(headerAttributes, 'acting_direction');

  if (!text) return { ok: false, warning: DIALOGUE_WARNINGS.MALFORMED };
  if (!speakerId) return { ok: false, warning: DIALOGUE_WARNINGS.MISSING_SPEAKER };

  // 등록되지 않은 인물(익명 직원·행인 포함)은 발화할 수 없다.
  const known = speakerNames instanceof Map ? speakerNames.has(speakerId) : false;
  if (!known) {
    return { ok: false, warning: speakerId === 'player' ? DIALOGUE_WARNINGS.UNKNOWN_SPEAKER : DIALOGUE_WARNINGS.ANONYMOUS };
  }
  if (!canSpeak(contract, speakerId)) {
    return { ok: false, warning: DIALOGUE_WARNINGS.NOT_IN_CAST };
  }
  if (!actingDirection) return { ok: false, warning: DIALOGUE_WARNINGS.MISSING_DIRECTION };
  if (!isConcreteActingDirection(actingDirection)) return { ok: false, warning: DIALOGUE_WARNINGS.INVALID_DIRECTION };

  if (speakerId === 'player') {
    const policy = contract?.player_dialogue ?? {};
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const maxLines = Number.isInteger(policy.max_lines) ? policy.max_lines : 1;
    if (lines.length > maxLines) return { ok: false, warning: DIALOGUE_WARNINGS.PLAYER_POLICY };
    if (Number.isInteger(policy.max_characters)) {
      const characters = Array.from(lines.join(' ')).length;
      if (characters > policy.max_characters) return { ok: false, warning: DIALOGUE_WARNINGS.PLAYER_POLICY };
    }
    // 수정 A — 길이가 아니라 의미 범위 검증 (짧은 명령·약속·성적 제안 차단)
    const meaningCheck = validatePlayerDialogueAgainstPolicy(text, policy);
    if (!meaningCheck.ok) return { ok: false, warning: DIALOGUE_WARNINGS.PLAYER_POLICY };
  }

  // speaker_name은 모델 출력이 아니라 서버 canon에서 채운다.
  return {
    ok: true,
    block: {
      type: 'dialogue',
      speaker_id: speakerId,
      speaker: speakerNames.get(speakerId),
      speaker_name: speakerNames.get(speakerId),
      acting_direction: actingDirection,
      // 기존 렌더러/저장 형식과의 호환을 위해 direction도 같은 값으로 유지한다.
      direction: actingDirection,
      text
    }
  };
}

function attribute(source, name) {
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'u').exec(source);
  return match ? match[1].trim() : null;
}

/**
 * 스트리밍 게이트를 만든다.
 *
 * `push(chunk)`는 이번 청크로 확정된 출력들을 순서대로 돌려준다:
 *   { kind: 'text', text }   — 화면에 그대로 흘려보낼 서술/섹션 텍스트
 *   { kind: 'block', block } — 검증을 통과한 구조화 블록
 * `end()`는 남은 내용을 flush하고 최종 결과(blocks/segments/stream_segments/warnings/story_text)를 돌려준다.
 */
export function createStructuredStoryGate({ contract, speakerNames }) {
  let lineBuffer = '';           // passthrough 라인 버퍼 (마커/발화 분류용)
  let openHeaderAttrs = null;    // 파싱 완료된 [DIALOGUE ...] 헤더
  let openHeaderRaw = '';        // 헤더 속성 원문 (재검증용)
  let openBody = '';             // 열려 있는 대사 본문
  let seenScene = false;         // SCENE-first (수정 G)
  let inScene = false;           // 현재 SCENE 영역 안 (scene 세그먼트 기록용)
  let firstMarkerSeen = false;   // 첫 구조화 마커 여부
  let order = 0;

  const segments = [];           // 수정 D — 승인된 순서 기록
  const warnings = [];
  const canonicalParts = [];     // story_text 정본 (검증 통과분만)
  const streamSegments = [];     // 수정 H — live/replay 동일 재생용

  const recordWarning = warning => {
    if (!warnings.includes(warning)) warnings.push(warning);
  };

  const emitText = (out, text, { scene = false } = {}) => {
    if (!text) return;
    canonicalParts.push(text);
    out.push({ kind: 'text', text });
    streamSegments.push({ order: order++, kind: 'text', text });
    if (scene) segments.push({ type: 'scene', text: text.replace(/^\n+|\n+$/g, '') });
  };

  const closeDialogue = out => {
    if (openHeaderAttrs === null) return;
    // 수정 G — 첫 유효 블록이 DIALOGUE면 차단
    if (!seenScene) {
      recordWarning(DIALOGUE_WARNINGS.BEFORE_SCENE);
      openHeaderAttrs = null;
      openHeaderRaw = '';
      openBody = '';
      return;
    }
    const result = validateDialogueBlock({
      headerAttributes: openHeaderRaw, body: openBody, contract, speakerNames
    });
    openHeaderAttrs = null;
    openHeaderRaw = '';
    openBody = '';
    if (!result.ok) {
      recordWarning(result.warning);
      return;
    }
    const block = { ...result.block, order: segments.length };
    segments.push(block);
    // 정본 텍스트는 레거시 파서도 읽을 수 있는 형태로 유지한다 (속성값의 따옴표는 제거).
    const safeName = String(block.speaker_name).replace(/"/gu, '');
    const safeDirection = String(block.acting_direction).replace(/"/gu, '');
    const canonical = `\n[DIALOGUE speaker="${safeName}" direction="${safeDirection}"]\n${block.text}\n`;
    canonicalParts.push(canonical);
    out.push({ kind: 'block', block, text: canonical });
    streamSegments.push({ order: order++, kind: 'block', block, text: canonical });
  };

  // passthrough 라인을 확정 처리한다 (수정 B: 비구조화 대사 차단, 수정 C: 미지 마커).
  const settleLine = (out, line) => {
    if (line === '') {
      emitText(out, '\n');
      return;
    }
    if (line.startsWith('[')) {
      // 수정 C — 허용 마커 확인
      if (line === SCENE_MARKER) {
        seenScene = true;
        inScene = true;
        firstMarkerSeen = true;
        return; // SCENE 마커 자체는 정본/화면에 포함하지 않는다
      }
      if (line.startsWith(DIALOGUE_OPEN)) {
        firstMarkerSeen = true;
        inScene = false;
        openHeaderRaw = line;
        openHeaderAttrs = { pending: true };
        return;
      }
      if (isSectionMarker(line)) {
        inScene = false;
        emitText(out, line + '\n');
        return;
      }
      // 알 수 없는 마커 → 마커 라인 제거 (이후 텍스트는 일반 규칙으로 계속)
      recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
      return;
    }
    // 일반 텍스트 라인 — 비구조화 발화 분류 (수정 B)
    const cls = classifyV2SceneLine(line);
    if (cls === 'unstructured_dialogue') {
      recordWarning(DIALOGUE_WARNINGS.UNSTRUCTURED);
      return; // 라인 전체 제거
    }
    if (cls === 'malformed_marker') {
      recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
      return;
    }
    // plain_narration / non_speech_quotation — 보존 (SCENE 영역 안이면 scene 세그먼트)
    emitText(out, line + '\n', { scene: inScene });
  };

  const drain = (out, final) => {
    for (;;) {
      if (openHeaderAttrs === null) {
        // ── passthrough ── 라인 단위로 분류 (전체 버퍼링 없음)
        const breakIndex = lineBuffer.indexOf('\n');
        if (breakIndex === -1) {
          if (final && lineBuffer) { settleLine(out, lineBuffer); lineBuffer = ''; return; }
          // 미완성 라인 — 발화/마커 후보(따옴표·'[')가 없으면 즉시 emit해
          // 첫 콘텐츠 표시가 개행 대기로 늦어지지 않게 한다 (수정 G 9.3).
          if (lineBuffer && !/["“”'[\[]/.test(lineBuffer)) {
            emitText(out, lineBuffer, { scene: inScene });
            lineBuffer = '';
          }
          return;
        }
        const line = lineBuffer.slice(0, breakIndex).replace(/\r$/, '');
        lineBuffer = lineBuffer.slice(breakIndex + 1);
        // '[' 시작 라인은 마커 후보 — 헤더가 닫힐 때까지 버퍼 유지 (부분 emit 금지)
        if (line.startsWith('[') && line !== SCENE_MARKER && !isSectionMarker(line)) {
          if (line.startsWith(DIALOGUE_OPEN)) {
            // 헤더가 아직 닫히지 않았으면 다음 청크에서 완성 대기
            if (!/\]\s*$/.test(line)) {
              if (final) {
                // 수정 C — EOF까지 닫히지 않은 header: header와 body 후보까지 폐기
                recordWarning(DIALOGUE_WARNINGS.MALFORMED);
                const nextMarker = lineBuffer.search(/\r?\n\s*\[/u);
                if (nextMarker === -1) { lineBuffer = ''; return; }
                lineBuffer = lineBuffer.slice(nextMarker).replace(/^\r?\n/u, '');
                continue;
              }
              lineBuffer = line + '\n' + lineBuffer; // 다시 버퍼로 (다음 청크와 합침)
              return;
            }
            // 헤더 파싱 (수정 C: 따옴표·중복·미지 속성)
            const parsed = parseDialogueHeader(line);
            if (!parsed.ok) {
              recordWarning(DIALOGUE_WARNINGS.MALFORMED);
              // 본문 후보까지 폐기 — 다음 줄부터 재개
              continue;
            }
            firstMarkerSeen = true;
            openHeaderRaw = line;
            openHeaderAttrs = parsed.attrs;
            continue;
          }
          // 알 수 없는 마커 (예: [FOO])
          if (line.startsWith('[') && /\]\s*$/.test(line)) {
            recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
            continue;
          }
        }
        settleLine(out, line);
        continue;
      }
      // ── 대사 본문 ── 다음 줄머리 마커('\n[')에서 블록을 닫는다.
      const nextMarker = lineBuffer.search(/\r?\n\s*\[/u);
      if (nextMarker === -1) {
        if (final) { openBody += lineBuffer; lineBuffer = ''; closeDialogue(out); return; }
        const lastBreak = lineBuffer.lastIndexOf('\n');
        if (lastBreak > 0) { openBody += lineBuffer.slice(0, lastBreak); lineBuffer = lineBuffer.slice(lastBreak); }
        return;
      }
      openBody += lineBuffer.slice(0, nextMarker);
      lineBuffer = lineBuffer.slice(nextMarker).replace(/^\r?\n/u, '');
      closeDialogue(out);
    }
  };

  return {
    push(chunk) {
      const out = [];
      lineBuffer += typeof chunk === 'string' ? chunk : '';
      drain(out, false);
      return out;
    },
    end() {
      const out = [];
      drain(out, true);
      closeDialogue(out);
      return {
        emissions: out,
        blocks: segments.filter(s => s.type === 'dialogue'),
        segments,
        stream_segments: streamSegments,
        warnings,
        story_text: canonicalParts.join('')
      };
    },
    get warnings() { return warnings; },
    get blocks() { return segments.filter(s => s.type === 'dialogue'); },
    get segments() { return segments; }
  };
}

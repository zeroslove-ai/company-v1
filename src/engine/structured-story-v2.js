/**
 * Structured Story V2 — 스트리밍 블록 게이트 (최종 단순화 패치 반영).
 *
 * 스트리밍 원칙:
 *   - 전체 Story를 버퍼링하지 않는다. 현재 작성 중인 한 줄만 버퍼링한다.
 *   - 개행이 도착하기 전에는 해당 라인을 emit하지 않는다.
 *   - 개행이 도착하면 완성된 한 줄을 검사한 뒤 emit 또는 차단한다.
 *   - Story EOF에서는 남은 마지막 한 줄을 한 번 검사한다.
 *
 * 섹션 상태 머신 (수정 4):
 *   currentSection: none | story | thought | status | choices
 *   [1. 서사 및 행동]→story / [2. 플레이어 속마음]→thought /
 *   [3. 플레이어 상황판]→status / [4. 선택지]→choices
 *   [SCENE]과 [DIALOGUE]는 currentSection === 'story'일 때만 구조화 마커로 인정한다.
 *   비구조화 대사 검사는 story && inScene일 때만 실행한다.
 *
 * malformed 처리 (수정 5):
 *   malformed DIALOGUE header 발견 시 discardMalformedDialogueBody=true.
 *   다음 유효 marker([SCENE]/[DIALOGUE]/섹션 마커)까지 일반 라인을 전부 버린다.
 *
 * canonical segments (수정 9):
 *   semantic blocks(scene/dialogue)는 원래 순서대로, 인접 scene은 하나로 병합.
 *   stream_segments는 완성된 line/block 단위로 저장 — 청크 분할과 무관하게 동일.
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
// 마커 / 섹션
// ---------------------------------------------------------------------------

const SECTION_MARKERS = new Set([
  '[1. 서사 및 행동]',
  '[2. 플레이어 속마음]',
  '[3. 플레이어 상황판]',
  '[4. 선택지]'
]);

const SECTION_TO_CURRENT = {
  '[1. 서사 및 행동]': 'story',
  '[2. 플레이어 속마음]': 'thought',
  '[3. 플레이어 상황판]': 'status',
  '[4. 선택지]': 'choices'
};

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
  if (!/\]\s*$/.test(source)) return { ok: false };
  const attrs = {};
  const seen = new Set();
  const attrPattern = /([A-Za-z_]+)\s*=\s*"([^"]*)"/gu;
  let match;
  while ((match = attrPattern.exec(source)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    if (seen.has(name)) return { ok: false };
    seen.add(name);
    attrs[name] = value;
  }
  if (!('speaker_id' in attrs) || attrs.speaker_id === '') return { ok: false };
  if (!('acting_direction' in attrs) || attrs.acting_direction === '') return { ok: false };
  const allowedAttrs = new Set(['speaker_id', 'acting_direction']);
  for (const name of seen) {
    if (!allowedAttrs.has(name)) return { ok: false };
  }
  return { ok: true, attrs };
}

// ---------------------------------------------------------------------------
// 비구조화 대사 라인 분류 (수정 B)
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

function attribute(source, name) {
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'u').exec(source);
  return match ? match[1].trim() : null;
}

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

// ---------------------------------------------------------------------------
// scene block 병합 (수정 9.1)
// ---------------------------------------------------------------------------

function appendSceneText(segments, text) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return;
  const last = segments.length ? segments[segments.length - 1] : null;
  if (last?.type === 'scene') {
    last.text = `${last.text}\n${value}`;
    return;
  }
  segments.push({ type: 'scene', text: value });
}

// ---------------------------------------------------------------------------
// 스트리밍 게이트 (수정 3/4/5/9)
// ---------------------------------------------------------------------------

export function createStructuredStoryGate({ contract, speakerNames }) {
  let lineBuffer = '';                  // 현재 작성 중인 한 줄 (수정 3)
  let currentSection = 'none';          // none | story | thought | status | choices (수정 4)
  let inScene = false;                  // story 영역 안에서 SCENE 이후 여부
  let seenScene = false;                // SCENE-first (수정 G)
  let openHeaderRaw = null;             // 검증 대기 중인 [DIALOGUE ...] 헤더
  let openBody = '';                    // 열려 있는 대사 본문
  let discardMalformedDialogueBody = false; // 수정 5
  let order = 0;

  const segments = [];                  // semantic blocks (scene/dialogue 순서)
  const warnings = [];
  const canonicalParts = [];            // story_text 정본 (검증 통과분만)
  const streamSegments = [];            // 완성된 line/block 단위 재생 기록 (수정 9.2)

  const recordWarning = warning => {
    if (!warnings.includes(warning)) warnings.push(warning);
  };

  const emitText = (out, text) => {
    if (!text) return;
    canonicalParts.push(text);
    out.push({ kind: 'text', text });
    streamSegments.push({ order: order++, kind: 'text', text });
    // story 영역의 서술만 scene semantic block으로 병합
    if (currentSection === 'story' && inScene) {
      appendSceneText(segments, text.replace(/\n+$/g, ''));
    }
  };

  const closeDialogue = out => {
    if (openHeaderRaw === null) return;
    // 수정 G — 첫 유효 블록이 DIALOGUE면 차단
    if (!seenScene) {
      recordWarning(DIALOGUE_WARNINGS.BEFORE_SCENE);
      openHeaderRaw = null;
      openBody = '';
      return;
    }
    const result = validateDialogueBlock({
      headerAttributes: openHeaderRaw, body: openBody, contract, speakerNames
    });
    openHeaderRaw = null;
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

  /** 유효 marker인가 (discard 해제 조건). */
  const isValidResumeMarker = line => {
    if (line === SCENE_MARKER) return true;
    if (line.startsWith(DIALOGUE_OPEN)) {
      return parseDialogueHeader(line).ok;
    }
    return isSectionMarker(line);
  };

  /** 완성된 라인 하나를 처리한다. */
  const settleLine = (out, line) => {
    const raw = typeof line === 'string' ? line : '';
    const trimmed = raw.trim();

    // 수정 5 — malformed DIALOGUE 본문 discard 상태
    if (discardMalformedDialogueBody) {
      if (trimmed.startsWith('[') && isValidResumeMarker(trimmed)) {
        discardMalformedDialogueBody = false;
        // 유효 marker부터 정상 처리
      } else {
        return; // 본문 후보 폐기
      }
    }

    if (trimmed === '') {
      emitText(out, raw);
      return;
    }

    // 섹션 마커 — currentSection 전환 (모든 섹션에서 인정)
    if (isSectionMarker(trimmed)) {
      currentSection = SECTION_TO_CURRENT[trimmed] ?? 'none';
      inScene = false;
      emitText(out, trimmed + '\n');
      return;
    }

    // story 섹션에서만 구조화 마커 인정 (수정 4)
    if (currentSection === 'story' || currentSection === 'none') {
      // [SCENE]은 story 영역 진입 신호 — none/story에서 인정하고 story로 전환
      if (trimmed === SCENE_MARKER) {
        currentSection = 'story';
        seenScene = true;
        inScene = true;
        return; // SCENE 마커 자체는 정본/화면에 포함하지 않는다
      }
      if (currentSection === 'story' && trimmed.startsWith(DIALOGUE_OPEN)) {
        inScene = false;
        const parsed = parseDialogueHeader(trimmed);
        if (!parsed.ok) {
          // 수정 5 — malformed 헤더는 본문까지 폐기
          recordWarning(DIALOGUE_WARNINGS.MALFORMED);
          discardMalformedDialogueBody = true;
          return;
        }
        openHeaderRaw = trimmed;
        return;
      }
      if (currentSection === 'story') {
        // 알 수 없는 마커 → 마커 라인 제거 (이후 텍스트는 일반 규칙으로 계속)
        if (trimmed.startsWith('[') && /\]\s*$/.test(trimmed)) {
          recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
          return;
        }
        // story && inScene — 비구조화 대사 검사 (수정 B)
        if (inScene) {
          const cls = classifyV2SceneLine(trimmed);
          if (cls === 'unstructured_dialogue') {
            recordWarning(DIALOGUE_WARNINGS.UNSTRUCTURED);
            return; // 라인 전체 제거
          }
          if (cls === 'malformed_marker') {
            recordWarning(DIALOGUE_WARNINGS.UNKNOWN_MARKER);
            return;
          }
        }
      }
    }

    // thought/status/choices 또는 story의 일반 서술 — 정상 text로 보존
    emitText(out, raw + '\n');
  };

  /** 대사 본문 수집 중인지 (헤더가 열려 있고 본문이 진행 중). */
  const inDialogueBody = () => openHeaderRaw !== null;

  const drain = (out, final) => {
    for (;;) {
      if (inDialogueBody()) {
        // 대사 본문 — 다음 줄머리 마커('\n[')에서 블록을 닫는다.
        const nextMarker = lineBuffer.search(/\r?\n\s*\[/u);
        if (nextMarker === -1) {
          if (final) {
            openBody += lineBuffer;
            lineBuffer = '';
            closeDialogue(out);
            return;
          }
          const lastBreak = lineBuffer.lastIndexOf('\n');
          if (lastBreak > 0) {
            openBody += lineBuffer.slice(0, lastBreak);
            lineBuffer = lineBuffer.slice(lastBreak);
          }
          return;
        }
        openBody += lineBuffer.slice(0, nextMarker);
        lineBuffer = lineBuffer.slice(nextMarker).replace(/^\r?\n/u, '');
        closeDialogue(out);
        continue;
      }

      // ── passthrough ── 한 줄 버퍼 (수정 3: 개행 전 emit 금지)
      const breakIndex = lineBuffer.indexOf('\n');
      if (breakIndex === -1) {
        if (final && lineBuffer) {
          // Story EOF — 남은 마지막 한 줄을 한 번 검사한다
          const lastLine = lineBuffer.replace(/\r$/, '');
          lineBuffer = '';
          settleLine(out, lastLine);
        }
        return;
      }
      const line = lineBuffer.slice(0, breakIndex).replace(/\r$/, '');
      lineBuffer = lineBuffer.slice(breakIndex + 1);
      // '[' 시작 라인은 마커 후보 — 헤더가 닫힐 때까지 버퍼 유지 (부분 emit 금지)
      if (line.startsWith('[') && !isSectionMarker(line) && line !== SCENE_MARKER) {
        if (line.startsWith(DIALOGUE_OPEN)) {
          if (!/\]\s*$/.test(line)) {
            // 헤더가 아직 닫히지 않았으면 다음 청크에서 완성 대기
            if (final) {
              // 수정 C/5 — EOF까지 닫히지 않은 header: header와 body 후보까지 폐기 후
              // 다음 유효 marker부터 재개한다.
              recordWarning(DIALOGUE_WARNINGS.MALFORMED);
              discardMalformedDialogueBody = true;
              const nextMarker = lineBuffer.search(/\r?\n\s*\[/u);
              if (nextMarker === -1) { lineBuffer = ''; return; }
              lineBuffer = lineBuffer.slice(nextMarker).replace(/^\r?\n/u, '');
              continue;
            }
            lineBuffer = line + '\n' + lineBuffer;
            return;
          }
          // 헤더 파싱은 settleLine에서 — 여기서는 라인 완성만 확인
        }
      }
      settleLine(out, line);
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

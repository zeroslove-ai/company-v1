/**
 * Structured Story V2 — 스트리밍 블록 게이트.
 *
 * Story 전체를 버퍼링하지 않는다. 완성된 줄 단위로만 처리하고, 헤더 한 줄과
 * 진행 중인 대사 블록 하나 정도만 임시로 들고 있다가 블록이 닫히는 즉시 흘려보낸다.
 * 장면 서술과 나머지 섹션은 도착하는 대로 그대로 통과시킨다.
 *
 * 게이트를 통과하지 못한 대사 블록은:
 *   - 화면에 출력되지 않고
 *   - parsed_blocks에 저장되지 않고
 *   - story_text 정본에 포함되지 않고
 *   - Extract 입력에 전달되지 않으며
 *   - 경고 코드만 남기고 다음 정상 블록부터 스트리밍이 계속된다.
 */

import { canSpeak } from './scene-cast.js';

export const STRUCTURED_STORY_VERSION = 2;

export const DIALOGUE_WARNINGS = {
  MISSING_SPEAKER: 'dialogue_missing_speaker_id',
  UNKNOWN_SPEAKER: 'dialogue_unknown_speaker_id',
  NOT_IN_CAST: 'dialogue_speaker_not_in_cast',
  MISSING_DIRECTION: 'dialogue_missing_acting_direction',
  INVALID_DIRECTION: 'dialogue_invalid_acting_direction',
  PLAYER_POLICY: 'player_dialogue_policy_violation',
  ANONYMOUS: 'anonymous_dialogue_blocked',
  MALFORMED: 'malformed_structured_story_block'
};

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
  const meaningful = remainder.replace(/[\s,.·…‥"'“”’‘\-—~!?()[\]]/gu, '');
  return meaningful.length >= 2;
}

const DIALOGUE_HEADER = /^\[DIALOGUE\b([^\]]*)\]\s*$/u;
const ANY_MARKER = /^\[/u;

function attribute(source, name) {
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'u').exec(source);
  return match ? match[1].trim() : null;
}

/**
 * 대사 블록 하나를 계약에 대조해 검증한다.
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
    const allowed = Array.isArray(contract?.allowed_speaker_ids) ? contract.allowed_speaker_ids : [];
    return { ok: false, warning: allowed.includes(speakerId) ? DIALOGUE_WARNINGS.NOT_IN_CAST : DIALOGUE_WARNINGS.NOT_IN_CAST };
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

/**
 * 스트리밍 게이트를 만든다.
 *
 * `push(chunk)`는 이번 청크로 확정된 출력들을 순서대로 돌려준다:
 *   { kind: 'text', text }   — 화면에 그대로 흘려보낼 서술/섹션 텍스트
 *   { kind: 'block', block } — 검증을 통과한 구조화 블록
 * `end()`는 남은 내용을 flush하고 최종 결과를 돌려준다.
 */
export function createStructuredStoryGate({ contract, speakerNames }) {
  let carry = '';                 // 아직 줄이 완성되지 않은 꼬리
  let openHeader = null;          // 열려 있는 [DIALOGUE ...] 헤더 속성
  let openBody = '';                // 열려 있는 대사 본문
  const blocks = [];
  const warnings = [];
  const canonicalParts = [];      // story_text 정본 (검증 통과분만)

  // 빈 줄도 문단 구분이므로 정본과 화면 양쪽에서 그대로 보존한다.
  // 서술·나머지 섹션 텍스트는 줄이 끝나기를 기다리지 않고 즉시 흘려보낸다.
  // 대사 블록으로 들어갈 가능성이 있는 '[' 이후만 잠시 잡아 둔다 — 그래야 첫
  // 콘텐츠 표시가 늦어지지 않는다.
  const emitText = (out, text) => {
    if (!text) return;
    canonicalParts.push(text);
    out.push({ kind: 'text', text });
  };

  const closeDialogue = out => {
    if (openHeader === null) return;
    const result = validateDialogueBlock({
      headerAttributes: openHeader, body: openBody, contract, speakerNames
    });
    openHeader = null;
    openBody = '';
    if (!result.ok) {
      warnings.push(result.warning);
      return;
    }
    blocks.push(result.block);
    // 정본 텍스트는 레거시 파서도 읽을 수 있는 형태로 유지한다 (속성값의 따옴표는 제거).
    const safeName = String(result.block.speaker_name).replace(/"/gu, '');
    const safeDirection = String(result.block.acting_direction).replace(/"/gu, '');
    const canonical = `\n[DIALOGUE speaker="${safeName}" direction="${safeDirection}"]\n${result.block.text}\n`;
    canonicalParts.push(canonical);
    out.push({ kind: 'block', block: result.block, text: canonical });
  };

  const DIALOGUE_OPEN = '[DIALOGUE';

  const drain = (out, final) => {
    for (;;) {
      if (openHeader === null && openBody === '') {
        // ── passthrough ──
        const markerIndex = carry.indexOf('[');
        if (markerIndex === -1) { emitText(out, carry); carry = ''; return; }
        if (markerIndex > 0) { emitText(out, carry.slice(0, markerIndex)); carry = carry.slice(markerIndex); }
        // carry가 '['로 시작한다. [DIALOGUE 인지 판별할 만큼 쌓였는지 본다.
        if (carry.length < DIALOGUE_OPEN.length) {
          if (DIALOGUE_OPEN.startsWith(carry)) { if (final) { emitText(out, carry); carry = ''; } return; }
          emitText(out, carry.slice(0, 1)); carry = carry.slice(1); continue;
        }
        if (!carry.startsWith(DIALOGUE_OPEN)) { emitText(out, carry.slice(0, 1)); carry = carry.slice(1); continue; }
        const headerEnd = carry.indexOf(']');
        if (headerEnd === -1) { if (final) { emitText(out, carry); carry = ''; } return; }
        openHeader = carry.slice(DIALOGUE_OPEN.length, headerEnd);
        openBody = '';
        carry = carry.slice(headerEnd + 1).replace(/^\r?\n/u, '');
        continue;
      }
      // ── 대사 본문 ── 다음 줄머리 마커('\n[')에서 블록을 닫는다.
      const nextMarker = carry.search(/\r?\n\s*\[/u);
      if (nextMarker === -1) {
        if (final) { openBody += carry; carry = ''; closeDialogue(out); return; }
        // 마커 후보가 뒤에 이어질 수 있으므로 마지막 개행 이후는 남겨 둔다.
        const lastBreak = carry.lastIndexOf('\n');
        if (lastBreak > 0) { openBody += carry.slice(0, lastBreak); carry = carry.slice(lastBreak); }
        return;
      }
      openBody += carry.slice(0, nextMarker);
      carry = carry.slice(nextMarker).replace(/^\r?\n/u, '');
      closeDialogue(out);
    }
  };

  return {
    push(chunk) {
      const out = [];
      carry += typeof chunk === 'string' ? chunk : '';
      drain(out, false);
      return out;
    },
    end() {
      const out = [];
      drain(out, true);
      closeDialogue(out);
      return { emissions: out, blocks, warnings, story_text: canonicalParts.join('') };
    },
    get warnings() { return warnings; },
    get blocks() { return blocks; }
  };
}

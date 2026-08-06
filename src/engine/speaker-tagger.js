/**
 * 스피커 태깅 — 화자명 없는 대사의 화자를 전용 LLM 호출로 판별한다.
 * 규칙 기반 파서(화행/호칭/자기지칭)로 못 찾은 대사만 대상으로,
 * 문맥(직전 서술)과 함께 보내 LLM이 독해로 화자를 확정한다.
 * 실패는 조용히 무시되어 기존 파이프라인을 막지 않는다.
 */

const TAGGER_SYSTEM = `너는 한국어 게임 서사의 "대사 화자 판별기"다.
주어진 대사 각각의 화자를 문맥과 대사 내용으로 판별해라.
판별 기준:
- 대사 내용의 호칭: "감사님/금 감사님" = 플레이어(감사팀 임원)를 부르는 말 → 화자는 NPC, "팀장님" = 서원희를 부르는 말 → 화자는 서원희가 아닌 NPC. 특히 "감사님?"/"감사님!"처럼 상대를 부르기만 하는 짧은 대사는 반드시 NPC가 플레이어를 부르는 것이다 (플레이어가 스스로를 "감사님"이라 부르지 않는다)
- 직전 서술: "XX가 말했다/물었다/입을 열었다/고개를 끄덕이며/인사하며" 등으로 화자를 지목하면 그 NPC
- 자기 지칭: "저희/저는/제가/저도" + 해당 NPC의 업무 내용 → 그 NPC
- 대화 흐름: 직전 대사의 화자가 누구였는지, 누가 누구에게 답하는지
- 화자가 플레이어로 확실할 때만 "플레이어"로 지정하고, 확신이 없으면 해당 NPC 이름 대신 "알 수 없음"으로 표시하라
응답은 반드시 JSON 한 개만:
{"speakers":[{"index":1,"speaker":"서원희"},{"index":2,"speaker":"알 수 없음"}]}
index는 입력 대사 목록의 번호와 1:1로 대응한다.`;

/**
 * [1. 서사 및 행동]에서 화자명이 명시되지 않은 따옴표 대사를 추출한다.
 * 반환: [{ index: 1부터, text, context(직전 서술 최대 80자) }]
 */
export function collectUnlabeledQuotes(storyText) {
  const sectionMatch = /\[1\.\s*서사\s*및\s*행동\]([\s\S]*?)(?=\[2\.|\[3\.|\[4\.|$)/.exec(storyText ?? '');
  const section = sectionMatch ? sectionMatch[1] : storyText ?? '';
  const lines = [];
  let lastNarrative = '';
  let lastNamedDialogue = '';
  let index = 0;
  for (const rawLine of section.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    // 화자명 명시 대사(XX: "…" / XX (지시): "…")는 이미 화자가 확정 — 문맥용으로만 기록
    if (/^[^\n:："“”]{1,40}?\s*(?:\([^()\n]{0,160}\))?\s*[:：]\s*["“]/.test(trimmed)) {
      lastNamedDialogue = trimmed;
      if (trimmed) lastNarrative = trimmed;
      continue;
    }
    const re = /["“]([^"”]{2,})["”]/g;
    let m;
    let prev = '';
    while ((m = re.exec(trimmed)) !== null) {
      index += 1;
      const before = trimmed.slice(0, m.index).trim();
      // 문맥 = 직전 서술 + 직전 화자명 명시 대사(교대 흐름 파악용). 최대 300자.
      const parts = [prev || before || lastNarrative];
      if (lastNamedDialogue) parts.push(`직전 대사: ${lastNamedDialogue}`);
      lines.push({ index, text: m[1].trim(), context: parts.join(' ').slice(-300) });
      prev = before;
    }
    if (trimmed) lastNarrative = trimmed;
  }
  return lines;
}

/** 태깅 LLM 요청 메시지. 화자명 없는 대사가 없으면 null을 반환한다. */
export function buildTaggingMessages(storyText, master) {
  const names = (master?.characters ?? []).map(c => c.name).filter(Boolean);
  const roster = names.length ? `등장인물: ${names.join(', ')}` : '';
  const items = collectUnlabeledQuotes(storyText)
    .map(l => `${l.index}. 문맥: ${l.context} | 대사: "${l.text}"`)
    .join('\n');
  if (!items) return null;
  return [
    { role: 'system', content: TAGGER_SYSTEM },
    { role: 'user', content: `${roster ? roster + '\n' : ''}다음 대사들의 화자를 판별해라. index를 반드시 유지해라.\n${items}` }
  ];
}

/** 태깅 응답 파싱. 반환: [{ index, speaker }] (실패 시 빈 배열) */
export function parseTaggingResponse(content) {
  const stripped = String(content ?? '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  let data;
  try {
    data = JSON.parse(stripped);
  } catch {
    const m = /\{[\s\S]*\}/.exec(stripped);
    if (!m) return [];
    try { data = JSON.parse(m[0]); } catch { return []; }
  }
  const list = Array.isArray(data?.speakers) ? data.speakers : Array.isArray(data) ? data : [];
  return list
    .filter(e => Number.isInteger(e?.index) && typeof e?.speaker === 'string' && e.speaker.trim())
    .map(e => ({ index: e.index, speaker: e.speaker.trim() }));
}

/**
 * 태깅 결과를 normalized_raw와 dialogue_lines에 반영한다.
 * - normalized_raw: 화자명 없는 `"대사"` 라인을 `화자명 (자연스럽게): "대사"`로 교체
 * - dialogue_lines: speaker_id가 없고 텍스트가 일치하는 항목의 화자명 보정
 * "알 수 없음"으로 판별된 대사는 건드리지 않는다(미확정 유지).
 */
export function applySpeakerTags(normalizedRaw, dialogueLines, quotes, tags) {
  if (!tags?.length) return { normalized_raw: normalizedRaw, dialogue_lines: dialogueLines };
  const byText = new Map();
  for (const tag of tags) {
    if (tag.speaker === '알 수 없음') continue;
    const quote = quotes.find(q => q.index === tag.index);
    if (quote) byText.set(quote.text, tag.speaker);
  }
  if (!byText.size) return { normalized_raw: normalizedRaw, dialogue_lines: dialogueLines };

  const out = (normalizedRaw ?? '').split(/\r?\n/).map(line => {
    const q = /^["“]([^"”]+)["”]$/.exec(line.trim());
    if (!q) return line;
    const speaker = byText.get(q[1].trim());
    if (!speaker) return line;
    const indent = line.slice(0, line.indexOf(line.trim()));
    return `${indent}${speaker} (자연스럽게): "${q[1].trim()}"`;
  }).join('\n');

  const updated = (dialogueLines ?? []).map(line => {
    const speaker = line && !line.speaker_id && byText.get(line.text);
    if (!speaker) return line;
    return { ...line, speaker_id: null, speaker_name: speaker, speaker };
  });
  return { normalized_raw: out, dialogue_lines: updated };
}

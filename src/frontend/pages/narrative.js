const SECTION_LABELS = {
  SCENE: 'scene', '1': 'scene',
  PLAYER_INNER_THOUGHT: 'thought', '2': 'thought',
  PLAYER_STATUS: 'status',   // 구버전 저장 턴 읽기용 — 저장은 하지 않는다
  CHOICES: 'choices',
  '3': 'choices',   // 신규 [3. 선택지] — 정식 형식
  '4': 'choices'    // 기존 저장 턴 History 호환 alias ([4. 선택지])
};
const MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*선택지|4\.\s*선택지|DIALOGUE\s+[^\[\]]*)\]/g;
const DIALOGUE_LINE = /^([\p{L}][^\n():："“”]{0,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const REGISTERED_SPEAKER_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const QUOTE_ONLY_LINE = /^["“]([^"”]+)["”]$/u;

// 라인 어디에 있든 큰따옴표("…"/“…”)를 찾아 [서술, 대사, 서술, …]로 분리 (작은따옴표는 제외 — 강조/인용)
function splitQuotedParts(line) {
  const parts = [];
  const re = /["“]([^"”]*)["”]/g;
  let last = 0, m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push({ quoted: false, text: line.slice(last, m.index) });
    parts.push({ quoted: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ quoted: false, text: line.slice(last) });
  return parts;
}
const CHOICE_LABEL = /^\[([^\[\]\r\n]{2,6})\]\s*(.+)$/u;

function labelRole(label) {
  if (SECTION_LABELS[label]) return SECTION_LABELS[label];
  const number = /^(\d)\./.exec(label)?.[1];
  return number ? SECTION_LABELS[number] ?? null : null;
}

function parseChoices(text) {
  const choices = [];
  const choice_labels = [];
  for (const line of text.split(/\r?\n/)) {
    const numbered = /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim();
    if (!numbered) continue;
    const labeled = CHOICE_LABEL.exec(numbered);
    choice_labels.push(labeled?.[1]?.trim() ?? '');
    choices.push((labeled?.[2] ?? numbered).trim());
  }
  return { choices, choice_labels };
}

function directoryEntries(speakerDirectory) {
  if (!speakerDirectory || typeof speakerDirectory !== 'object' || Array.isArray(speakerDirectory)) return [];
  return Object.entries(speakerDirectory).map(([id, value]) => ({
    id,
    name: typeof value === 'string' ? value.trim() : (typeof value?.name === 'string' ? value.name.trim() : '')
  })).filter(entry => entry.name);
}

function shortAlias(name) {
  const characters = Array.from(String(name ?? '').trim());
  if (characters.length !== 3 || !characters.every(character => /[가-힣]/u.test(character))) return '';
  return characters.slice(1).join('');
}

function resolveSpeaker(name, speakerDirectory) {
  const value = String(name ?? '').trim();
  if (!value) return null;
  const entries = directoryEntries(speakerDirectory);
  const exact = entries.filter(entry => entry.name === value);
  if (exact.length === 1) return exact[0];
  const alias = shortAlias(value) || value;
  const matches = entries.filter(entry => shortAlias(entry.name) === alias);
  return matches.length === 1 ? matches[0] : null;
}

function speakerId(name, speakerDirectory) {
  return resolveSpeaker(name, speakerDirectory)?.id ?? '';
}

// 큰따옴표가 실제 발화가 아니라 인용/표기(문서 제목·슬로건·규정·메일 제목 등)인지 판별
function isQuotationText(line, quoteStart) {
  const before = line.slice(0, quoteStart);
  const after = line.slice(quoteStart);
  if (/(제목|문구|슬로건|규정|메일|이메일|채팅|메시지|인용|표지|문서|규칙|방침|공지|글|포스트|알림)\s*(?:은|는|이|가)?\s*(?:에는)?\s*$/u.test(before)) return true;
  if (/(이라는|라고 적혀|라고 쓰여|라고 표시|이라고 적혀|이라고 쓰여|라는 문구|라고 명시|라고 써 있)/u.test(after)) return true;
  return false;
}

function lastMentionedSpeaker(value, speakerDirectory, previous = null) {
  const line = String(value ?? '');
  const entries = directoryEntries(speakerDirectory);
  const aliasOwners = new Map();
  for (const entry of entries) {
    const alias = shortAlias(entry.name);
    if (!alias) continue;
    const owners = aliasOwners.get(alias) ?? [];
    owners.push(entry);
    aliasOwners.set(alias, owners);
  }
  let selected = previous;
  let selectedIndex = -1;
  for (const entry of entries) {
    const exactIndex = line.lastIndexOf(entry.name);
    if (exactIndex > selectedIndex) {
      selected = entry;
      selectedIndex = exactIndex;
    }
    const alias = shortAlias(entry.name);
    if (!alias || aliasOwners.get(alias)?.length !== 1) continue;
    const aliasIndex = line.lastIndexOf(alias);
    if (aliasIndex > selectedIndex) {
      selected = entry;
      selectedIndex = aliasIndex;
    }
  }
  return selected;
}

// 직전 서술에서 "NPC가 … 말했다/물었다/입을 열었다…"처럼 화행 동사의 주어를 직접 찾는다.
// 문장 중간에 다른 NPC가 나중에 언급돼도, 화행 주어가 실제 화자다.

// 대사가 등록 NPC를 "이름 씨"로 직접 부르면 true — 상대방을 부르는 말이므로 화자는 플레이어
function namesAddressIn(text, speakerDirectory) {
  const value = String(text ?? '');
  return directoryEntries(speakerDirectory).some(entry => {
    const full = entry.name;
    const alias = shortAlias(entry.name);
    const names = [full, alias].filter(Boolean).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!names.length) return false;
    const pattern = `(${names.join('|')})\\s*씨\\s*[,，.!?…]`;
    return new RegExp(pattern).test(value) || new RegExp(`^(${names.join('|')})\\s*씨\\b`).test(value);
  });
}

// "팀장님"(서원희)을 부르는 말의 화자는 서원희가 아니다 — 서원희를 제외한 마지막 언급 NPC를 찾는다
function lastMentionedSpeakerExcluding(value, speakerDirectory, previous, excludedName) {
  const line = String(value ?? '');
  const entries = directoryEntries(speakerDirectory).filter(e => e.name !== excludedName);
  const dir = Object.fromEntries(entries.map(e => [e.name, e]));
  return lastMentionedSpeaker(line, dir, previous);
}

function speechAttributionSubject(value, speakerDirectory) {
  const line = String(value ?? '');
  const re = /([\p{L}]{1,6})\s*(?:이|가)\s*[^\n。.!?]{0,14}?\s*(?:말했|물었|입을 열었|대꾸했|외쳤|중얼거렸|속삭였|되물었|덧붙였|대답했|반문했|설명했|인사하며|고개를 끄덕이며|목소리를 내|숨을 고르며)/u;
  const m = re.exec(line);
  if (!m) return null;
  const name = m[1].trim();
  const entry = directoryEntries(speakerDirectory).find(e => e.name === name || shortAlias(e.name) === name);
  return entry ?? null;
}

function normalizedDialogue(name, direction, value, speakerDirectory, order, playerName) {
  const supplied = String(name ?? '').trim();
  const resolved = resolveSpeaker(supplied, speakerDirectory);
  const speaker = resolved?.name ?? supplied;
  const isPlayer = playerName && supplied === playerName;
  const acting = String(direction ?? '').trim();
  const text = String(value ?? '').trim().replace(/^["“”']+|["“”']+$/g, '').trim();
  // 화자명이 비어 있어도 대사칸은 생성한다 (미확정 화자 — 플레이어로 오표기하는 것보다 낫다)
  if (!acting || !text) return null;
  return { speaker_id: isPlayer ? 'player' : (resolved?.id ?? null), speaker_name: speaker, direction: acting, text, order };
}

function parseDialogueLine(rawLine, speakerDirectory, order) {
  const line = String(rawLine ?? '').trim();
  if (!line) return null;
  const canonical = DIALOGUE_LINE.exec(line);
  if (canonical) return normalizedDialogue(canonical[1], canonical[2], canonical[3] ?? canonical[4], speakerDirectory, order);
  const fallback = REGISTERED_SPEAKER_LINE.exec(line);
  if (!fallback) return null;
  const id = speakerId(fallback[1], speakerDirectory);
  if (!id) return null;
  return normalizedDialogue(fallback[1], '자연스럽게', fallback[2] ?? fallback[3], speakerDirectory, order);
}

// 직전 서술이 "XXX가 말했다/입을 열었다"처럼 화자를 지목하면 true
function isSpeechAttribution(line, mentioned) {
  if (!line || !mentioned) return false;
  return /(말했|말하며|말하고|말했다|말을 꺼냈|말을 이었|말을 건넸|물었|물어보|대답했|대꾸했|속삭였|외쳤|중얼거렸|되물었|덧붙였|맞장구|입을 열|입을 뗐|인사하며|인사했다|인사를 건넸|소개했다|사과했다|부탁했다|설명했다|알렸|통보했|대답하며|이어 말|웃으며 말|한숨|넘겨받아 말)/.test(line);
}

function appendSceneBlocks(blocks, dialogueLines, value, speakerDirectory, playerName) {
  const narrative = [];
  let recentSpeaker = null;
  const flush = () => {
    const text = narrative.join('\n').trim();
    narrative.length = 0;
    if (text) blocks.push({ type: 'scene', text });
  };
  const appendDialogue = dialogue => {
    flush();
    dialogueLines.push(dialogue);
    blocks.push({
      type: 'dialogue',
      speaker_id: dialogue.speaker_id,
      speaker: dialogue.speaker_name,
      speaker_name: dialogue.speaker_name,
      direction: dialogue.direction,
      text: dialogue.text
    });
  };

  let lastLine = '';
  for (const rawLine of value.split(/\r?\n/)) {
    // 빈 줄은 직전 서술/최근 화자를 건드리지 않는다 — 대사 사이 빈 줄이 lastLine을 ''로 덮어써
    // "직전 서술" 정보가 사라지는 버그 방지
    if (!rawLine.trim()) continue;
    const dialogue = parseDialogueLine(rawLine, speakerDirectory, dialogueLines.length);
    if (dialogue) {
      recentSpeaker = dialogue.speaker_id ? { id: dialogue.speaker_id, name: dialogue.speaker_name } : recentSpeaker;
      appendDialogue(dialogue);
      continue;
    }

    const quote = QUOTE_ONLY_LINE.exec(rawLine.trim());
    // 화자명 없는 따옴표 대사: 확신도 높은 규칙 3개(화행 주어·감사님 호칭·호격)만 적용하고,
    // 그 외는 미확정(speaker_id=null)으로 남긴다 — 플레이어 오표기 금지, 교대 추론 금지.
    // 최종 화자는 서버 parser + 태거가 확정한 canonical parsed_blocks가 교체한다 (complete 이벤트).
    if (quote && !/^\([^)]*\)$/.test(quote[1].trim())) {
      const text = quote[1];
      const prevDialogue = dialogueLines[dialogueLines.length - 1];
      const attrSubject = speechAttributionSubject(lastLine, speakerDirectory);
      const mentioned = lastMentionedSpeaker(lastLine, speakerDirectory, recentSpeaker);
      let speaker = null;
      if (attrSubject && isSpeechAttribution(lastLine, attrSubject) && !(prevDialogue?.speaker_name === attrSubject.name)) speaker = attrSubject;
      else if (mentioned && isSpeechAttribution(lastLine, mentioned) && !(prevDialogue?.speaker_name === mentioned.name)) speaker = mentioned;
      else if (attrSubject && /(감사님|임원님|금 감사님)/.test(text)) speaker = attrSubject;
      else if (mentioned && /(감사님|임원님|금 감사님)/.test(text)) speaker = mentioned;
      else if (namesAddressIn(text, speakerDirectory)) speaker = { id: 'player', name: playerName };
      const resolved = speaker ?? { id: null, name: '' };
      appendDialogue(normalizedDialogue(resolved.name, '자연스럽게', text, speakerDirectory, dialogueLines.length, playerName));
      recentSpeaker = { id: resolved.id, name: resolved.name };
      continue;
    }
// 라인 중간/끝에 큰따옴표 — 인용/표기(문서 제목·슬로건·규정·메일 제목)는 대사로 만들지 않는다.
    const parts = splitQuotedParts(rawLine);
    if (parts.length > 1) {
      let speechCount = 0;
      let offset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !/^\([^)]*\)$/.test(part.text.trim()) && !isQuotationText(rawLine, offset)) speechCount += 1;
        offset += part.text.length + (part.quoted ? 2 : 0);
      }
      if (speechCount === 0) {
        recentSpeaker = lastMentionedSpeaker(rawLine, speakerDirectory, recentSpeaker);
        narrative.push(rawLine);
        lastLine = rawLine;
        continue;
      }
      const prevDialogue = dialogueLines[dialogueLines.length - 1];
      let ctxLine = lastLine;
      offset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !/^\([^)]*\)$/.test(part.text.trim()) && !isQuotationText(rawLine, offset)) {
          const text = part.text;
          const attrSubject = speechAttributionSubject(ctxLine, speakerDirectory);
          const mentioned = lastMentionedSpeaker(ctxLine, speakerDirectory, recentSpeaker);
          let speaker = null;
          if (attrSubject && isSpeechAttribution(ctxLine, attrSubject) && !(prevDialogue?.speaker_name === attrSubject.name)) speaker = attrSubject;
          else if (mentioned && isSpeechAttribution(ctxLine, mentioned) && !(prevDialogue?.speaker_name === mentioned.name)) speaker = mentioned;
          else if (attrSubject && /(감사님|임원님|금 감사님)/.test(text)) speaker = attrSubject;
          else if (mentioned && /(감사님|임원님|금 감사님)/.test(text)) speaker = mentioned;
          else if (namesAddressIn(text, speakerDirectory)) speaker = { id: 'player', name: playerName };
          const resolved = speaker ?? { id: null, name: '' };
          appendDialogue(normalizedDialogue(resolved.name, '자연스럽게', text, speakerDirectory, dialogueLines.length, playerName));
          recentSpeaker = { id: resolved.id, name: resolved.name };
        } else if (part.quoted) {
          narrative.push(`“${part.text}”`);
        } else if (part.text.trim()) {
          recentSpeaker = lastMentionedSpeaker(part.text, speakerDirectory, recentSpeaker);
          narrative.push(part.text);
          ctxLine = part.text;
        }
        offset += part.text.length + (part.quoted ? 2 : 0);
      }
      continue;
    }

    recentSpeaker = lastMentionedSpeaker(rawLine, speakerDirectory, recentSpeaker);
    narrative.push(rawLine);
    lastLine = rawLine;
  }
  flush();
}

export function parseNarrative(rawText, { speakerDirectory = {}, playerName = '플레이어' } = {}) {
  const raw = String(rawText ?? '');
  const matches = [...raw.matchAll(MARKER)];
  const blocks = [];
  const dialogue_lines = [];
  const warnings = [];
  let player_inner_thought = '';
  let choices = [];
  let choice_labels = [];

  if (!matches.length) {
    return {
      raw,
      blocks: raw.trim() ? [{ type: 'unparsed', text: raw.trim() }] : [],
      player_inner_thought,
      choices,
      dialogue_lines,
      warnings: ['no_recognized_markers', 'choices_not_exactly_four']
    };
  }

  const prefix = raw.slice(0, matches[0].index).trim();
  if (prefix) { blocks.push({ type: 'unparsed', text: prefix }); warnings.push('unparsed_prefix'); }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const role = labelRole(label);
    const start = current.index + current[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
    const value = raw.slice(start, end).trim();
    if (role === 'scene') { if (value) appendSceneBlocks(blocks, dialogue_lines, value, speakerDirectory, playerName); continue; }
    if (role === 'thought') {
      player_inner_thought = value;
      if (value) blocks.push({ type: 'player_inner_thought', text: value });
      continue;
    }
    if (role === 'status') {
      // 구버전 [PLAYER_STATUS] 마커는 읽지만 저장하지 않는다 (player_status 제거).
      continue;
    }
    if (role === 'choices') {
      const parsed = parseChoices(value);
      choices = parsed.choices;
      choice_labels = parsed.choice_labels;
      continue;
    }
    const speaker = /speaker="([^"]+)"/.exec(label)?.[1];
    const direction = /direction="([^"]+)"/.exec(label)?.[1];
    if (!speaker || !direction) {
      blocks.push({ type: 'unparsed', text: `${current[0]}${value}`.trim() });
      warnings.push('malformed_dialogue_marker');
      continue;
    }
    const dialogue = normalizedDialogue(speaker, direction, value, speakerDirectory, dialogue_lines.length);
    if (!dialogue) continue;
    dialogue_lines.push(dialogue);
    blocks.push({ type: 'dialogue', speaker_id: dialogue.speaker_id, speaker: dialogue.speaker_name, speaker_name: dialogue.speaker_name, direction, text: dialogue.text });
  }

  if (choices.length !== 4) warnings.push('choices_not_exactly_four');
  const suppliedLabels = choice_labels.filter(Boolean);
  if (suppliedLabels.length > 0 && suppliedLabels.length !== choices.length) warnings.push('choice_labels_missing');
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  const result = { raw, blocks, player_inner_thought, choices, dialogue_lines, warnings };
  if (choice_labels.some(Boolean)) result.choice_labels = choice_labels;
  return result;
}

// Streaming presentation only: hide protocol markers without changing the raw Story buffer.
// Complete-turn parsing remains the sole source of dialogue/choice projections.
export function projectStreamingText(rawText) {
  const raw = String(rawText ?? '');
  const lines = raw.split(/\r?\n/);
  const marker = /^\s*\[(?:배경|SCENE|DIALOGUE\b[^\]]*|\/DIALOGUE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|3\.\s*선택지|4\.\s*선택지)\]\s*$/u;
  const incomplete = /^\s*\[\/?(?:S|SC|D|DI|DIA|DIAL|DIALOGUE|P|PL|PLAYER|C|CH|CHO|CHOI|1\.|2\.|3\.|4\.)[^\]]*$/u;
  return lines.map((line, index) => {
    if (marker.test(line)) return '';
    if (index === lines.length - 1 && incomplete.test(line)) return '';
    return line
      .replace(/^\s*\[(?:배경|SCENE|DIALOGUE\b[^\]]*|\/DIALOGUE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|3\.\s*선택지|4\.\s*선택지)\]\s*/u, '')
      .replace(/\[(?:배경|\/)?DIALOGUE\b[^\]]*\]/g, '')
      .replace(/\[(?:배경|SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*(?:플레이어\s*상황판|선택지)|4\.\s*선택지)\]/g, '')
      .trimEnd();
  }).join('\n');
}

/**
 * Syntax-only incremental projection used while SSE text is arriving.  It
 * never assigns speakers or parses choices; it only tracks the protocol's
 * section markers so scene prose, dialogue, thought, and choice text do not
 * visually collapse into one block.  The caller keeps the original raw text
 * separately for Extract/Commit.
 */
export function projectStreamingSections(rawText) {
  const raw = String(rawText ?? '');
  const lines = raw.split(/\r?\n/);
  const segments = [];
  let role = 'scene';
  const marker = /^\s*\[(배경|SCENE|DIALOGUE\b[^\]]*|\/DIALOGUE|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*(?:플레이어\s*상황판|선택지)|4\.\s*선택지)\]\s*$/u;
  const inlineMarker = /\[(배경|SCENE|DIALOGUE\b[^\]]*|\/DIALOGUE|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*(?:플레이어\s*상황판|선택지)|4\.\s*선택지)\]/gu;
  const incomplete = /^\s*\[\/?(?:S|SC|D|DI|DIA|DIAL|DIALOGUE|P|PL|PLAYER|C|CH|CHO|CHOI|1\.|2\.|3\.|4\.)[^\]]*$/u;
  const roleFor = label => {
    if (label === '배경' || label === 'SCENE' || label.startsWith('1.')) return 'scene';
    if (label.startsWith('DIALOGUE')) return 'dialogue';
    if (label === '/DIALOGUE') return 'scene';
    if (label === 'PLAYER_INNER_THOUGHT' || label.startsWith('2.')) return 'thought';
    if (label === 'CHOICES' || label.startsWith('3.') || label.startsWith('4.')) return 'choices';
    return role;
  };
  const append = (type, line) => {
    const text = String(line ?? '').trim();
    if (!text) return;
    const previous = segments.at(-1);
    if (previous?.type === type) previous.text += `\n${text}`;
    else segments.push({ type, text });
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (index === lines.length - 1 && incomplete.test(line)) continue;
    if (marker.test(line)) {
      const match = /^\s*\[(.*)\]\s*$/u.exec(line);
      role = roleFor(match?.[1] ?? role);
      continue;
    }
    let cursor = 0;
    let match;
    inlineMarker.lastIndex = 0;
    while ((match = inlineMarker.exec(line)) !== null) {
      const before = line.slice(cursor, match.index);
      append(role, before);
      role = roleFor(match[1]);
      cursor = match.index + match[0].length;
    }
    append(role, line.slice(cursor));
  }
  return {
    raw,
    segments,
    scene: segments.filter(segment => segment.type === 'scene').map(segment => segment.text).join('\n'),
    dialogue: segments.filter(segment => segment.type === 'dialogue').map(segment => segment.text).join('\n'),
    player_inner_thought: segments.filter(segment => segment.type === 'thought').map(segment => segment.text).join('\n'),
    choices: segments.filter(segment => segment.type === 'choices').map(segment => segment.text).join('\n')
  };
}

const SECTION_LABELS = {
  SCENE: 'scene',
  '1': 'scene',
  PLAYER_INNER_THOUGHT: 'thought',
  '2': 'thought',
  PLAYER_STATUS: 'status',   // 구버전 저장 턴 읽기용 — 저장은 하지 않는다
  CHOICES: 'choices',
  '3': 'choices',   // 신규 [3. 선택지] — 정식 형식
  '4': 'choices'    // 기존 저장 턴 History 호환 alias ([4. 선택지])
};

const MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*선택지|4\.\s*선택지|\/DIALOGUE|DIALOGUE\s+[^\[\]]*)\]/g;
const SECTION_LINE = /^\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*선택지|4\.\s*선택지)\]$/;
const QUOTED_INLINE_DIALOGUE = /([\p{L}][^\n():"“”]{0,40}?)\s*\(([^()\n]{0,160})\)\s*[:：]\s*["“]([^"”]*)["”]/gsu;
const DIALOGUE_LINE = /^([\p{L}][^\n():："“”]{0,40}?)\s*\(([^()\n]{1,160})\)\s*[:：]?\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const REGISTERED_SPEAKER_LINE = /^([^\n:："“”]{1,40}?)\s*[:：]\s*(?:["“]([^"”]*)["”]|(.+))$/u;
const QUOTE_ONLY_LINE = /^["“]([^"”]+)["”]$/u;

// 라인 어디에 있든 큰따옴표를 찾아 [서술, 대사, 서술, …]로 분리 (작은따옴표 제외)
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
const PLAYER_LABEL = '플레이어';

// 직전 서술에서 "NPC가 … 말했다/물었다…" 화행 동사의 주어를 직접 찾는다
function speechAttributionSubject(value, speakers) {
  const line = String(value ?? '');
  const re = /([\p{L}]{1,6})\s*(?:이|가)\s*[^\n。.!?]{0,14}?\s*(?:말했|물었|입을 열었|대꾸했|외쳤|중얼거렸|속삭였|되물었|덧붙였|대답했|반문했|설명했|인사하며|고개를 끄덕이며|목소리를 내|숨을 고르며)/u;
  const m = re.exec(line);
  if (!m) return null;
  const name = m[1].trim();
  return (speakers ?? []).find(s => s.name === name || shortAlias(s.name) === name) ?? null;
}

// 대사가 등록 NPC를 "이름 씨,"처럼 호격으로 직접 부르면 true — 화자는 플레이어 (지칭 "씨가"는 제외)
function namesAddressIn(text, speakers) {
  const value = String(text ?? '');
  return (speakers ?? []).some(entry => {
    const full = entry.name;
    const alias = shortAlias(entry.name);
    const names = [full, alias].filter(Boolean).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!names.length) return false;
    const pattern = `(${names.join('|')})\\s*씨\\s*[,，.!?…]`;
    return new RegExp(pattern).test(value) || new RegExp(`^(${names.join('|')})\\s*씨\\b`).test(value);
  });
}

// "팀장님"(서원희)을 부르는 말의 화자는 서원희가 아니다 — 서원희 제외 마지막 언급 NPC
function lastMentionedSpeakerExcluding(value, speakers, previous, excludedName) {
  const line = String(value ?? '');
  const filtered = (speakers ?? []).filter(s => s.name !== excludedName);
  let result = previous;
  let bestIndex = -1;
  for (const s of filtered) {
    const i = line.lastIndexOf(s.name);
    if (i > bestIndex) { result = s; bestIndex = i; }
    const alias = shortAlias(s.name);
    if (alias) {
      const ai = line.lastIndexOf(alias);
      if (ai > bestIndex) { result = s; bestIndex = ai; }
    }
  }
  return result;
}

/**
 * 화자명 없는 대사의 화자를 확신도 높은 규칙으로만 추론한다 (지시: 교대 규칙 사용 금지).
 * 추론 실패 시 null → 미확정(speaker_id=null)으로 남기고 플레이어로 강제하지 않는다.
 */
function resolveUnlabeledSpeaker({ ctxLine, text, speakers, recentSpeaker, lastDialogueSpeaker }) {
  const mentioned = lastMentionedSpeaker(ctxLine, speakers, recentSpeaker);
  const attrSubject = speechAttributionSubject(ctxLine, speakers);
  const baseMentioned = attrSubject ?? mentioned;
  let speaker = null;
  // 1) 감사님/임원님 호칭 → 직전 언급 NPC (화행 주어 우선)
  if (baseMentioned && /(감사님|임원님|금 감사님)/.test(text)) speaker = baseMentioned;
  // 2) 팀장님 호칭 → 서원희를 부르는 말 → 서원희 제외 언급 (없으면 미확정)
  else if (/팀장님/.test(text)) {
    const nonLeader = lastMentionedSpeakerExcluding(ctxLine, speakers, recentSpeaker, '서원희');
    speaker = nonLeader ?? null;
  }
  // 3) "이메이 씨," 호격 → 플레이어 (상대방을 직접 부르는 말)
  else if (namesAddressIn(text, speakers)) speaker = { id: 'player', name: PLAYER_LABEL };
  // 4) 팀 내부 지칭(저희) → 직전 언급 NPC
  else if (mentioned && /(저희가|저희는|저희 팀|저희도|저희 브랜드|저희 캠페인)/.test(text)) speaker = mentioned;
  // 5) 화행 주어: "서원희가 … 말했다" (직전 대사의 화자를 설명하는 화행이면 미적용)
  else if (attrSubject && !(lastDialogueSpeaker && (attrSubject.name === lastDialogueSpeaker.name || attrSubject.id === lastDialogueSpeaker.id))) speaker = attrSubject;
  // 6) 직전 서술 화행 지목 (동일하게 직전 대사 화자와 같으면 미적용)
  else if (mentioned && isSpeechAttribution(ctxLine, mentioned) && !(lastDialogueSpeaker?.name === mentioned.name)) speaker = mentioned;
  // 7) 직전 서술에서 NPC가 주어로 등장(이름+이/가/은/는)하고, 직전 대사 화자와 다르거나 없을 때만 → 그 NPC
  //    (소유격 "이메이의"는 화자 근거가 되지 않는다. 교대 추론 금지 — 직전 대사 NPC → 플레이어 전환은 하지 않는다)
  else if (mentioned && (!lastDialogueSpeaker || mentioned.name !== lastDialogueSpeaker.name)
           && new RegExp(`${mentioned.name}\s*(?:이|가|은|는)`).test(ctxLine)) speaker = mentioned;
  return speaker;
}

/**
 * 큰따옴표가 실제 발화가 아니라 인용/표기(문서 제목·슬로건·규정·메일 제목·재인용 설명)인지 판별.
 * quoteStart: 라인에서 따옴표 시작 위치. 라인 중간 분리 시에만 사용된다.
 */
function isQuotationText(line, quoteStart) {
  const before = line.slice(0, quoteStart);
  const after = line.slice(quoteStart);
  // 앞맥락: "문서 제목은 / 슬라이드에는 / 메일 제목은 / 공지에는" 등
  if (/(제목|문구|슬로건|규정|메일|이메일|채팅|메시지|인용|표지|문서|규칙|방침|공지|글|포스트|알림)\s*(?:은|는|이|가)?\s*(?:에는)?\s*$/u.test(before)) return true;
  // 뒤맥락: "이라는 / 라는 문구 / 라고 적혀 / 라고 쓰여 / 라고 표시"
  if (/(이라는|라고 적혀|라고 쓰여|라고 표시|이라고 적혀|이라고 쓰여|라는 문구|라고 명시|라고 써 있)/u.test(after)) return true;
  return false;
}

// 직전 서술이 "XXX가 말했다/입을 열었다"처럼 화자를 지목하면 true
function isSpeechAttribution(line, mentioned) {
  if (!line || !mentioned) return false;
  return /(말했|말하며|말하고|말했다|말을 꺼냈|말을 이었|말을 건넸|물었|물어보|대답했|대꾸했|속삭였|외쳤|중얼거렸|되물었|덧붙였|맞장구|입을 열|입을 뗐|인사하며|인사했다|인사를 건넸|소개했다|사과했다|부탁했다|설명했다|알렸|통보했|대답하며|이어 말|웃으며 말|한숨|넘겨받아 말)/.test(line);
}

function labelRole(label) {
  if (SECTION_LABELS[label]) return SECTION_LABELS[label];
  if (label === '/DIALOGUE') return 'scene';
  const numberMatch = /^(\d)\./.exec(label);
  if (numberMatch && SECTION_LABELS[numberMatch[1]]) return SECTION_LABELS[numberMatch[1]];
  return null;
}

function splitFirstDialogueParagraph(value) {
  const paragraphs = String(value ?? '').split(/\r?\n\s*\r?\n/);
  const dialogueText = (paragraphs.shift() ?? '').trim();
  return { dialogueText, sceneText: paragraphs.join('\n\n').trim() };
}

function parseChoices(text) {
  const choices = [];
  const choiceLabels = [];
  for (const line of text.split(/\r?\n/)) {
    const numbered = /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim();
    if (!numbered) continue;
    const labeled = CHOICE_LABEL.exec(numbered);
    if (labeled) {
      choiceLabels.push(labeled[1].trim());
      choices.push(labeled[2].trim());
    } else {
      choiceLabels.push('');
      choices.push(numbered);
    }
  }
  return { choices, choice_labels: choiceLabels };
}

function masterCharacters(master) {
  return [
    ...(Array.isArray(master?.characters) ? master.characters : []),
    ...(Array.isArray(master?.general_npcs) ? master.general_npcs : [])
  ];
}

function registeredSpeakers(master) {
  return masterCharacters(master)
    .map(character => ({
      id: character?.character_id ?? character?.npc_id ?? character?.id ?? null,
      name: typeof character?.name === 'string' ? character.name.trim() : ''
    }))
    .filter(character => character.id && character.name);
}

function shortAlias(name) {
  const characters = Array.from(String(name ?? '').trim());
  if (characters.length !== 3 || !characters.every(character => /[가-힣]/u.test(character))) return '';
  return characters.slice(1).join('');
}

function resolveRegisteredSpeaker(name, master) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return null;
  const speakers = registeredSpeakers(master);
  const exact = speakers.filter(character => character.name === trimmed);
  if (exact.length === 1) return exact[0];
  const alias = shortAlias(trimmed) || trimmed;
  const aliasMatches = speakers.filter(character => shortAlias(character.name) === alias);
  return aliasMatches.length === 1 ? aliasMatches[0] : null;
}

function resolveSpeakerId(name, master) {
  return resolveRegisteredSpeaker(name, master)?.id ?? null;
}

function lastMentionedSpeaker(line, speakers, previous = null) {
  const value = String(line ?? '');
  let selected = previous;
  let selectedIndex = -1;
  const aliasOwners = new Map();
  for (const speaker of speakers) {
    const alias = shortAlias(speaker.name);
    if (!alias) continue;
    const owners = aliasOwners.get(alias) ?? [];
    owners.push(speaker);
    aliasOwners.set(alias, owners);
  }
  for (const speaker of speakers) {
    const exactIndex = value.lastIndexOf(speaker.name);
    if (exactIndex > selectedIndex) {
      selected = speaker;
      selectedIndex = exactIndex;
    }
    const alias = shortAlias(speaker.name);
    if (!alias || aliasOwners.get(alias)?.length !== 1) continue;
    const aliasIndex = value.lastIndexOf(alias);
    if (aliasIndex > selectedIndex) {
      selected = speaker;
      selectedIndex = aliasIndex;
    }
  }
  return selected;
}

function isInternalQuotedThought(value) {
  const text = String(value ?? '').trim();
  return /^\([^)]*\)$/.test(text);
}

/**
 * Actual production Story rows sometimes contain only “대사” even though the
 * prompt asks for a speaker. Recover those lines only when the preceding scene
 * prose names one uniquely registered character, including a unique Korean
 * given-name reference such as “민아” -> “윤민아”.
 */
function normalizeQuoteOnlyDialogue(rawText, { master } = {}) {
  const source = String(rawText ?? '');
  const speakers = registeredSpeakers(master);
  if (!source || !speakers.length) return source;

  let role = null;
  let recentSpeaker = null;
  let lastDialogueSpeaker = null;
  const output = [];
  let lastLine = '';
  for (const rawLine of source.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      output.push(rawLine);
      continue;
    }
    const section = SECTION_LINE.exec(trimmed);
    if (section) {
      role = labelRole(section[1]);
      recentSpeaker = null;
      lastLine = '';
      output.push(rawLine);
      continue;
    }
    // V2 구조화 마커([SCENE]/[DIALOGUE ...])는 따옴표 변환 대상이 아니다 — 원본 유지.
    // [DIALOGUE speaker_id="heroine5" acting_direction="..."]의 속성 따옴표가 깨지면
    // parseNarrative의 마커 매칭이 실패한다 (문서 5절 — 원문 비파괴).
    if (trimmed.startsWith('[') && /\]\s*$/.test(trimmed)) {
      output.push(rawLine);
      continue;
    }
    if (role !== 'scene') {
      output.push(rawLine);
      continue;
    }

    const canonical = DIALOGUE_LINE.exec(trimmed);
    if (canonical) {
      const resolved = resolveRegisteredSpeaker(canonical[1], master);
      if (resolved) recentSpeaker = resolved;
      output.push(rawLine);
      continue;
    }
    const named = REGISTERED_SPEAKER_LINE.exec(trimmed);
    if (named) {
      const resolved = resolveRegisteredSpeaker(named[1], master);
      if (resolved) recentSpeaker = resolved;
      output.push(rawLine);
      continue;
    }

    const quote = QUOTE_ONLY_LINE.exec(trimmed);
    if (quote && !isInternalQuotedThought(quote[1])) {
      const text = quote[1];
      // 확신도 높은 규칙만 사용 — 불충분하면 미확정(화자명 삽입 안 함, null 유지)
      const speaker = resolveUnlabeledSpeaker({
        ctxLine: lastLine, text, speakers, recentSpeaker, lastDialogueSpeaker
      });
      const indent = rawLine.slice(0, rawLine.indexOf(trimmed));
      if (speaker) {
        recentSpeaker = speaker;
        lastDialogueSpeaker = speaker;
        output.push(`${indent}${speaker.name} (자연스럽게): “${text.trim()}”`);
      } else {
        output.push(rawLine);
      }
      continue;
    }

    // 라인 중간/끝에 큰따옴표가 있으면 서술 + 대사 + 서술로 분리. 단, 문서 제목·슬로건·규정 문구 등
    // 인용/표기(비발화)가 포함된 라인은 원본 그대로 유지해 대사로 만들지 않는다.
    const parts = splitQuotedParts(rawLine);
    if (parts.length > 1) {
      let speechCount = 0;
      let partOffset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, partOffset)) speechCount += 1;
        partOffset += part.text.length + (part.quoted ? 2 : 0);
      }
      if (speechCount === 0) {
        recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
        output.push(rawLine);
        lastLine = rawLine;
        continue;
      }
      let ctxLine = lastLine;
      partOffset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, partOffset)) {
          const text = part.text;
          const speaker = resolveUnlabeledSpeaker({
            ctxLine, text, speakers, recentSpeaker, lastDialogueSpeaker
          });
          if (speaker) {
            recentSpeaker = speaker;
            lastDialogueSpeaker = speaker;
            output.push(`${speaker.name} (자연스럽게): “${text.trim()}”`);
          } else {
            // 미확정 — 화자명 삽입 없이 대사칸은 유지 (다음 패스에서 dialogue block으로 분류)
            output.push(`“${text.trim()}”`);
          }
        } else if (part.quoted) {
          output.push(`“${part.text}”`);
        } else if (part.text.trim()) {
          recentSpeaker = lastMentionedSpeaker(part.text, speakers, recentSpeaker);
          output.push(part.text);
          ctxLine = part.text;
        }
        partOffset += part.text.length + (part.quoted ? 2 : 0);
      }
      continue;
    }

    recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
    output.push(rawLine);
    lastLine = rawLine;
  }
  return output.join('\n');
}

function normalizedDialogue({ speakerName, direction, dialogueText, speakerId }, master, order) {
  const suppliedName = typeof speakerName === 'string' ? speakerName.trim() : '';
  let resolved = null;
  if (typeof speakerId === 'string' && speakerId) {
    resolved = (registeredSpeakers(master) ?? []).find(s => s.id === speakerId) ?? null;
  }
  if (!resolved) resolved = resolveRegisteredSpeaker(suppliedName, master);
  const name = resolved?.name ?? suppliedName;
  // normalizeQuoteOnlyDialogue가 '플레이어' 라벨로 삽입한 대사 → 플레이어 id 확정
  const isPlayerLabel = suppliedName === PLAYER_LABEL;
  const acting = typeof direction === 'string' ? direction.trim() : '';
  const text = typeof dialogueText === 'string' ? dialogueText.trim().replace(/^["“”']+|["“”']+$/g, '').trim() : '';
  if (!name || !acting || !text) return null;
  return {
    speaker_id: isPlayerLabel ? 'player' : (resolved?.id ?? null),
    speaker_name: name,
    direction: acting,
    text,
    order
  };
}

function parseDialogueLine(rawLine, master, order) {
  const line = typeof rawLine === 'string' ? rawLine.trim() : '';
  if (!line) return null;
  const canonical = DIALOGUE_LINE.exec(line);
  if (canonical) {
    return normalizedDialogue({
      speakerName: canonical[1],
      direction: canonical[2],
      dialogueText: canonical[3] ?? canonical[4]
    }, master, order);
  }
  const fallback = REGISTERED_SPEAKER_LINE.exec(line);
  if (!fallback) return null;
  const speakerName = fallback[1].trim();
  if (!resolveSpeakerId(speakerName, master)) return null;
  return normalizedDialogue({
    speakerName,
    direction: '자연스럽게',
    dialogueText: fallback[2] ?? fallback[3]
  }, master, order);
}

function appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef) {
  const narrativeLines = [];
  const signatures = new Set();
  const speakers = registeredSpeakers(master);
  let recentSpeaker = null;
  let lastDialogueSpeaker = null;
  let lastLine = '';
  const flushNarrative = () => {
    const value = narrativeLines.join('\n').trim();
    narrativeLines.length = 0;
    if (value) blocks.push({ type: 'scene', text: value });
  };
  const appendLine = line => {
    const signature = `${line.speaker_name}\n${line.direction}\n${line.text}`;
    if (signatures.has(signature)) return;
    signatures.add(signature);
    dialogueLines.push(line);
    blocks.push({
      type: 'dialogue',
      speaker_id: line.speaker_id,
      speaker: line.speaker_name,
      speaker_name: line.speaker_name,
      direction: line.direction,
      text: line.text
    });
  };
  // 화자 확정 여부와 무관하게 대사칸을 만든다 — 미확정은 speaker_id=null, speaker_name=''
  const pushDialogue = (speaker, text) => {
    flushNarrative();
    const line = {
      speaker_id: speaker?.id ?? null,
      speaker_name: speaker?.name ?? '',
      direction: '자연스럽게',
      text: text.trim(),
      order: orderRef.value
    };
    orderRef.value += 1;
    if (speaker) {
      recentSpeaker = speaker;
      lastDialogueSpeaker = speaker;
    }
    appendLine(line);
  };

  for (const rawLine of sceneText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const dialogue = parseDialogueLine(rawLine, master, orderRef.value);
    if (dialogue) {
      flushNarrative();
      orderRef.value += 1;
      appendLine(dialogue);
      recentSpeaker = { id: dialogue.speaker_id, name: dialogue.speaker_name };
      lastDialogueSpeaker = { id: dialogue.speaker_id, name: dialogue.speaker_name };
      continue;
    }
    // 화자명 없는 대사 라인 — 규칙 추론, 실패 시 미확정(dialogue block 유지)
    const quote = QUOTE_ONLY_LINE.exec(trimmed);
    if (quote && !isInternalQuotedThought(quote[1])) {
      const speaker = resolveUnlabeledSpeaker({
        ctxLine: lastLine, text: quote[1], speakers, recentSpeaker, lastDialogueSpeaker
      });
      pushDialogue(speaker, quote[1]);
      continue;
    }
    // 라인 중간/끝 따옴표 — 인용/표기(비발화)만 있는 라인은 대사로 만들지 않는다
    const parts = splitQuotedParts(rawLine);
    if (parts.length > 1) {
      let speechCount = 0;
      let offset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, offset)) speechCount += 1;
        offset += part.text.length + (part.quoted ? 2 : 0);
      }
      if (speechCount === 0) {
        recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
        narrativeLines.push(rawLine);
        lastLine = rawLine;
        continue;
      }
      let ctxLine = lastLine;
      offset = 0;
      for (const part of parts) {
        if (part.quoted && part.text.trim() && !isInternalQuotedThought(part.text) && !isQuotationText(rawLine, offset)) {
          const speaker = resolveUnlabeledSpeaker({
            ctxLine, text: part.text, speakers, recentSpeaker, lastDialogueSpeaker
          });
          pushDialogue(speaker, part.text);
        } else if (part.quoted) {
          narrativeLines.push(`“${part.text}”`);
        } else if (part.text.trim()) {
          recentSpeaker = lastMentionedSpeaker(part.text, speakers, recentSpeaker);
          narrativeLines.push(part.text);
          ctxLine = part.text;
        }
        offset += part.text.length + (part.quoted ? 2 : 0);
      }
      continue;
    }
    recentSpeaker = lastMentionedSpeaker(rawLine, speakers, recentSpeaker);
    narrativeLines.push(rawLine);
    lastLine = rawLine;
  }
  flushNarrative();

  QUOTED_INLINE_DIALOGUE.lastIndex = 0;
  let match;
  while ((match = QUOTED_INLINE_DIALOGUE.exec(sceneText)) !== null) {
    const dialogue = normalizedDialogue({
      speakerName: match[1],
      direction: match[2],
      dialogueText: match[3]
    }, master, orderRef.value);
    if (!dialogue) continue;
    const signature = `${dialogue.speaker_name}\n${dialogue.direction}\n${dialogue.text}`;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    dialogueLines.push(dialogue);
    orderRef.value += 1;
  }
}

export function parseNarrative(rawText, { master } = {}) {
  const originalRaw = String(rawText ?? '');
  const normalizedRaw = normalizeQuoteOnlyDialogue(originalRaw, { master });
  const raw = normalizedRaw;
  const matches = [...raw.matchAll(MARKER)];
  const blocks = [];
  const warnings = [];
  const dialogueLines = [];
  const orderRef = { value: 0 };
  let playerInnerThought = '';
  let choices = [];
  let choiceLabels = [];
  const sceneParts = [];

  if (matches.length === 0) {
    // 문서 6절 — 마커가 없어도 raw 전체를 기존 scene/dialogue line parser에
    // 전달해 원문에서 대사·서술을 복구한다. 문장 삭제는 금지다.
    if (raw.trim()) {
      sceneParts.push(raw);
      appendSceneBlocks(blocks, dialogueLines, raw, master, orderRef);
    }
    return {
      raw: originalRaw,
      normalized_raw: normalizedRaw,
      scene_text: sceneParts.join('\n'),
      blocks,
      player_inner_thought: '',
      choices: [],
      dialogue_lines: dialogueLines,
      warnings: ['no_recognized_markers', 'choices_not_exactly_four']
    };
  }

  const prefix = raw.slice(0, matches[0].index).trim();
  if (prefix) {
    blocks.push({ type: 'unparsed', text: prefix });
    warnings.push('unparsed_prefix');
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const role = labelRole(label);
    const start = current.index + current[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
    const text = raw.slice(start, end).trim();

    if (role === 'scene') {
      const malformedMarkerIndex = text.search(/\[(?:SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|DIALOGUE|\d\.\s*(?:서사\s*및\s*행동|플레이어\s*속마음|플레이어\s*상황판|선택지))\b/);
      if (malformedMarkerIndex === -1) {
        if (text) {
          sceneParts.push(text);
          appendSceneBlocks(blocks, dialogueLines, text, master, orderRef);
        }
      } else {
        const sceneText = text.slice(0, malformedMarkerIndex).trim();
        const fallbackText = text.slice(malformedMarkerIndex).trim();
        if (sceneText) {
          sceneParts.push(sceneText);
          appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef);
        }
        if (fallbackText) blocks.push({ type: 'unparsed', text: fallbackText });
        warnings.push('malformed_marker_fallback');
      }
      continue;
    }
    if (role === 'status') {
      // 구버전 [PLAYER_STATUS] 마커는 읽지만 저장하지 않는다 (player_status 제거).
      continue;
    }
    if (role === 'thought') {
      playerInnerThought = text;
      if (text) blocks.push({ type: 'player_inner_thought', text });
      continue;
    }
    if (role === 'choices') {
      const parsed = parseChoices(text);
      choices = parsed.choices;
      choiceLabels = parsed.choice_labels;
      if (choices.length !== 4) warnings.push('choices_not_exactly_four');
      const suppliedLabels = choiceLabels.filter(Boolean);
      if (suppliedLabels.length > 0 && suppliedLabels.length !== choices.length) warnings.push('choice_labels_missing');
      if (new Set(suppliedLabels).size !== suppliedLabels.length) warnings.push('choice_labels_duplicated');
      continue;
    }

    const speakerIdAttr = /speaker_id="([^"]+)"/.exec(label)?.[1];
    const directionAttr = /acting_direction="([^"]+)"/.exec(label)?.[1];
    const speaker = speakerIdAttr ?? /speaker="([^"]+)"/.exec(label)?.[1];
    const direction = directionAttr ?? /direction="([^"]+)"/.exec(label)?.[1];
    const { dialogueText, sceneText } = splitFirstDialogueParagraph(text);
    if (!speaker || !direction) {
      blocks.push({ type: 'unparsed', text: `${current[0]}${text}`.trim() });
      warnings.push('malformed_dialogue_marker');
      continue;
    }
    const dialogue = normalizedDialogue({ speakerName: speaker, direction, dialogueText, speakerId: speakerIdAttr ?? null }, master, orderRef.value++);
    if (!dialogue) continue;
    blocks.push({ type: 'dialogue', speaker_id: dialogue.speaker_id, speaker: dialogue.speaker_name, speaker_name: dialogue.speaker_name, direction, text: dialogue.text });
    dialogueLines.push(dialogue);
    if (sceneText) {
      sceneParts.push(sceneText);
      appendSceneBlocks(blocks, dialogueLines, sceneText, master, orderRef);
    }
  }

  if (choices.length !== 4 && !warnings.includes('choices_not_exactly_four')) {
    warnings.push('choices_not_exactly_four');
  }
  if (/\[DIALOGUE\b(?![^\]]*\])/.test(raw)) warnings.push('incomplete_dialogue_marker');
  const result = {
    raw: originalRaw,
    normalized_raw: normalizedRaw,
    scene_text: sceneParts.join('\n'),
    blocks,
    player_inner_thought: playerInnerThought,
    choices,
    dialogue_lines: dialogueLines,
    warnings
  };
  if (choiceLabels.some(Boolean)) result.choice_labels = choiceLabels;
  return result;
}

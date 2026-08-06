const SECTION_LABELS = {
  SCENE: 'scene', '1': 'scene',
  PLAYER_INNER_THOUGHT: 'thought', '2': 'thought',
  PLAYER_STATUS: 'status', '3': 'status',
  CHOICES: 'choices', '4': 'choices'
};
const MARKER = /\[(SCENE|PLAYER_STATUS|PLAYER_INNER_THOUGHT|CHOICES|1\.\s*서사\s*및\s*행동|2\.\s*플레이어\s*속마음|3\.\s*플레이어\s*상황판|4\.\s*선택지|DIALOGUE\s+[^\[\]]*)\]/g;
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
  return { speaker_id: isPlayer ? 'player' : (resolved?.id ?? ''), speaker_name: speaker, direction: acting, text, order };
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
    // 화자명 없는 따옴표 대사: 직전 서술 화행 지목 → 그 NPC, 플레이어 호칭(감사님) → 직전 언급 NPC,
    // 팀 내부 지칭(저희) → 직전 언급 NPC, 아니면 플레이어 (최근 화자로 오표기 방지)
    if (quote && !/^\([^)]*\)$/.test(quote[1].trim())) {
      const mentioned = lastMentionedSpeaker(lastLine, speakerDirectory, recentSpeaker);
      const text = quote[1];
      let speaker = null;
      // 화행 주어를 최우선 mentioned로 (감사님/팀장님 규칙의 기준점)
      const attrSubject = speechAttributionSubject(lastLine, speakerDirectory);
      const baseMentioned = attrSubject ?? mentioned;
      const prevDialogue = dialogueLines[dialogueLines.length - 1];
      // 1) 감사님 호칭 → 직전 언급 NPC (화행 주어 우선)
      if (baseMentioned && /(감사님|임원님|금 감사님)/.test(text)) speaker = baseMentioned;
      // 2) 팀장님 호칭 → 서원희를 부르는 말이므로 서원희 제외 언급 (없으면 플레이어)
      else if (/팀장님/.test(text)) {
        const nonLeader = lastMentionedSpeakerExcluding(lastLine, speakerDirectory, recentSpeaker, '서원희');
        speaker = nonLeader ?? { id: 'player', name: playerName };
      }
      // 3) "이메이 씨," 호격으로 NPC를 직접 부르면 → 플레이어 (상대방을 부르는 말)
      else if (namesAddressIn(text, speakerDirectory)) speaker = { id: 'player', name: playerName };
      // 4) 팀 내부 지칭(저희) → 직전 언급 NPC
      else if (mentioned && /(저희가|저희는|저희 팀|저희도|저희 브랜드|저희 캠페인)/.test(text)) speaker = mentioned;
      // 5) 화행 주어: "서원희가 … 말했다" → 그 NPC (직전 대사 화자를 설명하는 화행이면 미적용)
      else if (attrSubject && !(prevDialogue?.speaker_name && (attrSubject.name === prevDialogue.speaker_name || attrSubject.id === prevDialogue.speaker_id))) speaker = attrSubject;
      // 6) 직전 서술 화행 지목 (직전 대사의 화자를 설명하는 화행이면 미적용)
      else if (mentioned && isSpeechAttribution(lastLine, mentioned) && !(prevDialogue?.speaker_name === mentioned.name)) speaker = mentioned;
      // 7) 직전 대사가 화자명 확정 NPC면 → 플레이어 (대화 교대 — 직전 서술 언급이 아니라 직전 대사 기준)
      else if (prevDialogue && prevDialogue.speaker_id && prevDialogue.speaker_id !== 'player') speaker = { id: 'player', name: playerName };
      // 8) 직전 서술에 NPC가 언급되면 → 그 NPC (첫 대사 포함, 대화 흐름 기본값)
      else if (mentioned) speaker = mentioned;
      const resolved = speaker ?? { id: null, name: '' };
      appendDialogue(normalizedDialogue(resolved.name, '자연스럽게', text, speakerDirectory, dialogueLines.length, playerName));
      recentSpeaker = { id: resolved.id, name: resolved.name };
      continue;
    }

    // 라인 중간/끝에 큰따옴표 대사가 섞여 있으면 서술 + 대사 + 서술로 분리해 전부 대사칸화
    const parts = splitQuotedParts(rawLine);
    if (parts.length > 1) {
      let ctxLine = lastLine;
      for (const part of parts) {
        if (part.quoted && part.text.trim()) {
          const mentioned = lastMentionedSpeaker(ctxLine, speakerDirectory, recentSpeaker);
          const text = part.text;
          let speaker = null;
          const attrSubject = speechAttributionSubject(ctxLine, speakerDirectory);
          if (attrSubject) speaker = attrSubject;
          else if (mentioned && isSpeechAttribution(ctxLine, mentioned)) speaker = mentioned;
          else if (mentioned && (/(감사님|임원님|금 감사님|팀장님)/.test(text) || /(저희가|저희는|저희 팀|저희도|저희 브랜드|저희 캠페인)/.test(text))) speaker = mentioned;
          else if (namesAddressIn(text, speakerDirectory)) speaker = { id: 'player', name: playerName };
          else if (recentSpeaker && recentSpeaker.id && recentSpeaker.id !== 'player') speaker = { id: 'player', name: playerName };
          const resolved = speaker ?? { id: null, name: '' };
          appendDialogue(normalizedDialogue(resolved.name, '자연스럽게', text, speakerDirectory, dialogueLines.length, playerName));
          recentSpeaker = { id: resolved.id, name: resolved.name };
        } else if (part.text.trim()) {
          recentSpeaker = lastMentionedSpeaker(part.text, speakerDirectory, recentSpeaker);
          narrative.push(part.text);
          ctxLine = part.text;
        }
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
  let player_status = '';
  let player_inner_thought = '';
  let choices = [];
  let choice_labels = [];

  if (!matches.length) {
    return {
      raw,
      blocks: raw.trim() ? [{ type: 'unparsed', text: raw.trim() }] : [],
      player_status,
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
    if (role === 'status') { player_status = value; continue; }
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
  const result = { raw, blocks, player_status, player_inner_thought, choices, dialogue_lines, warnings };
  if (choice_labels.some(Boolean)) result.choice_labels = choice_labels;
  return result;
}

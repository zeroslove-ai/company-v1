const CONTROL_LINE = /^\[(NARRATIVE|THOUGHT)\]([\s\S]*)$/i;
const DIALOGUE_LINE = /^\[DIALOGUE\s+id="([^"]+)"\]([\s\S]*)$/i;

export function parseStoryBlocks(storyText, { content } = {}) {
  const blocks = [];
  const lines = String(storyText).split(/\r?\n/);
  let mode = null;
  let buffer = [];
  let dialogueId = null;

  const flush = () => {
    const text = buffer.join('\n').split(/\r?\n/)
      .filter((line) => !/^\s*(?:\[\/?ooc\]|DIALOGUE\s+speaker_id=)/i.test(line))
      .join('\n').trim();
    if (!text || /^(?:\[ooc\]|\[\/?ooc\]|DIALOGUE\s+speaker_id=)/i.test(text)) {
      buffer = [];
      return;
    }
    if (mode === 'DIALOGUE') blocks.push({ type: 'dialogue', speaker_id: dialogueId, text });
    else if (mode !== 'CHOICE') blocks.push({ type: mode?.toLowerCase() ?? 'narrative', text });
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (/^\[CHOICE\]$/i.test(line)) { flush(); mode = 'CHOICE'; buffer = []; continue; }
    if (/^\[\/?CHOICE\]$/i.test(line)) { buffer = []; mode = null; continue; }
    if (/^\[\/?NARRATIVE\]$/i.test(line) || /^\[\/?THOUGHT\]$/i.test(line)) { flush(); mode = null; continue; }
    const dialogue = line.match(DIALOGUE_LINE);
    if (dialogue) {
      flush();
      mode = content?.getNpc(dialogue[1]) ? 'DIALOGUE' : null;
      dialogueId = content?.getNpc(dialogue[1]) ? dialogue[1] : null;
      if (mode && dialogue[2]) buffer.push(dialogue[2]);
      continue;
    }
    const control = line.match(CONTROL_LINE);
    if (control) { flush(); mode = control[1].toUpperCase(); continue; }
    if (mode) buffer.push(line);
    else if (line && !/^\[.*\]$/.test(line) && !/^DIALOGUE\s+speaker_id=/i.test(line)) {
      mode = 'NARRATIVE';
      buffer.push(line);
    }
  }
  flush();
  return { blocks, choices: [], displayText: blocks.map((block) => block.text).join('\n\n') };
}

export function openingStory({ playerName = 'Player' } = {}) {
  return `[NARRATIVE]\n${playerName}가 회사 로비에 들어서자 오전의 분주한 소리와 커피 향이 넓은 공간을 채운다. 안내 데스크 너머로 오늘의 일정이 화면에 흐르고, 막 출근한 직원들이 서로 인사를 나눈다. 첫날의 긴장감 속에서도 어디서부터 업무를 시작할지 스스로 정해야 한다.\n\n[DIALOGUE id="heroine1"]\n어서 오세요. 오늘 첫 업무를 함께 확인해 볼까요? 궁금한 점이 있으면 편하게 말씀해 주세요.`;
}

import { exactFourChoices } from './contracts.js';

const CONTROL_LINE = /^\[(NARRATIVE|THOUGHT|CHOICE)\]([\s\S]*)$/i;
const DIALOGUE_LINE = /^\[DIALOGUE\s+id="([^"]+)"\]([\s\S]*)$/i;

export function parseStoryBlocks(storyText, { content } = {}) {
  const blocks = [];
  const choices = [];
  const lines = String(storyText).split(/\r?\n/);
  let mode = null;
  let buffer = [];
  let dialogueId = null;

  const flush = () => {
    const text = buffer.join('\n').split(/\r?\n/).filter((line) => !/^\s*(?:\[\/?ooc\]|DIALOGUE\s+speaker_id=)/i.test(line)).join('\n').trim();
    if (!text || /^(?:\[ooc\]|\[\/ooc\]|DIALOGUE\s+speaker_id=)/i.test(text)) {
      buffer = [];
      return;
    }
    if (mode === 'CHOICE') choices.push(text);
    else if (mode === 'DIALOGUE') blocks.push({ type: 'dialogue', speaker_id: dialogueId, text });
    else blocks.push({ type: mode?.toLowerCase() ?? 'narrative', text });
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (/^\[\/CHOICE\]$/i.test(line)) { flush(); mode = null; continue; }
    if (/^\[\/NARRATIVE\]$/i.test(line) || /^\[\/THOUGHT\]$/i.test(line)) { flush(); mode = null; continue; }
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
  return { blocks, choices: exactFourChoices(choices), displayText: blocks.map((block) => block.text).join('\n\n') };
}

export function openingStory({ playerName = '플레이어' } = {}) {
  return `[NARRATIVE]\n${playerName}가 회사 로비에 들어서자 오전의 분주한 소리가 들린다.\n\n[DIALOGUE id="heroine1"]\n어서 오세요. 오늘 첫 업무를 함께 확인해 볼까요?\n\n[CHOICE]\n인사를 건넨다.\n[CHOICE]\n오늘의 업무를 묻는다.\n[CHOICE]\n로비를 둘러본다.\n[CHOICE]\n브랜드전략실로 이동한다.\n[/CHOICE]`;
}

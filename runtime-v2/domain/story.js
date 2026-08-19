import { companyV2Content } from './content.js';

const CONTROL_LINE = /^\[(NARRATIVE|THOUGHT)\]([\s\S]*)$/i;
const DIALOGUE_LINE = /^\[DIALOGUE\s+id="([^"]+)"\]([\s\S]*)$/i;

export const COMPANY_APP_PREMISE = Object.freeze({
  name: '상식개변',
  status: 'private-unfamiliar',
  description: '사람들이 평범하고 자연스럽다고 받아들이는 규칙을 바꿀 수 있다고 주장하는 정체불명의 앱.',
  reality: '플레이어는 아직 사용하지 않았고, 다른 사람들은 이 앱을 모르며 현실은 아직 바뀌지 않았다.',
  origin: '기원은 밝혀지지 않았다.'
});

export function parseStoryBlocks(storyText, { content } = {}) {
  const blocks = [];
  const lines = String(storyText).split(/\r?\n/);
  let mode = null;
  let buffer = [];
  let dialogueId = null;
  const flush = () => {
    const text = buffer.join('\n').split(/\r?\n/).filter((line) => !/^\s*(?:\[\/?ooc\]|DIALOGUE\s+speaker_id=)/i.test(line)).join('\n').trim();
    if (!text || /^(?:\[ooc\]|\[\/?ooc\]|DIALOGUE\s+speaker_id=)/i.test(text)) { buffer = []; return; }
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
    if (dialogue) { flush(); mode = content?.getNpc(dialogue[1]) ? 'DIALOGUE' : null; dialogueId = content?.getNpc(dialogue[1]) ? dialogue[1] : null; if (mode && dialogue[2]) buffer.push(dialogue[2]); continue; }
    const control = line.match(CONTROL_LINE);
    if (control) { flush(); mode = control[1].toUpperCase(); continue; }
    if (mode) buffer.push(line);
    else if (line && !/^\[.*\]$/.test(line) && !/^DIALOGUE\s+speaker_id=/i.test(line)) { mode = 'NARRATIVE'; buffer.push(line); }
  }
  flush();
  return { blocks, choices: [], displayText: blocks.map((block) => block.text).join('\n\n') };
}

export function openingStory({ playerName = '플레이어', content = companyV2Content } = {}) {
  const location = content.getLocation('brand_strategy_office') ?? content.getLocation('lobby');
  const actor = content.getNpc('heroine1');
  return `[NARRATIVE]\n${playerName}은(는) ${location.name}에서 회사의 첫날을 시작한다. ${location.description} ${actor.name}이(가) 오늘의 업무 흐름을 확인하며 자리에 있고, 사람들의 표정과 말소리는 평소의 회사 아침처럼 자연스럽다.\n\n아직 누구에게도 말하지 않은 휴대전화 화면에는 ‘상식개변’이라는 앱이 떠 있다. 앱은 사람들이 평범하고 자연스럽다고 받아들이는 규칙을 바꿀 수 있다고 주장한다. ${playerName}은(는) 아직 앱을 사용하지 않았다. 다른 사람들은 이 앱을 모르고, 현실은 아무것도 바뀌지 않았다. 출처와 목적은 알 수 없다.\n\n[DIALOGUE id="${actor.id}"]\n${actor.name}이(가) 고개를 들어 ${playerName}을(를) 바라본다. “첫날이라 낯설겠지만, 궁금한 점이 있으면 편하게 말해 주세요.”`;
}

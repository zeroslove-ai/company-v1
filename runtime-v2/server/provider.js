import { openingStory, parseStoryBlocks } from '../domain/story.js';

export function createDeterministicProvider() {
  return {
    async *story({ literalAction, playerName }) {
      yield `[NARRATIVE]\n${playerName}의 말이 그대로 기록된다: ${literalAction}\n\n`;
      yield '[DIALOGUE id="heroine1"]\n서원이 다음 업무를 함께 살펴본다.\n\n';
      yield '[CHOICE]\n업무 자료를 확인한다.\n[CHOICE]\n서원에게 질문한다.\n[CHOICE]\n로비로 돌아간다.\n[CHOICE]\n브랜드전략실로 이동한다.\n[/CHOICE]';
    },
    async observe({ storyText }) {
      return { elapsed_minutes: 3, scene: { entered: [], exited: [] }, turn_summary: storyText.slice(0, 120), mind_monitor: { heroine1: { surface: '업무를 설명할 준비를 한다.', subconscious: '새 동료의 반응을 살핀다.' } } };
    },
    opening: ({ playerName }) => openingStory({ playerName }),
    parse: (storyText, content) => parseStoryBlocks(storyText, { content })
  };
}

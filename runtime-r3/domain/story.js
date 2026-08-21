import { buildStoryContext } from './memory.js';

export function displayStory(text) { return String(text ?? '').trim(); }

export function buildOpeningContext(context, content) {
  return buildStoryContext(context, '', { content, opening: true });
}

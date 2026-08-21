export function displayStory(text) { return String(text ?? '').trim(); }

export function buildOpeningContext(context) {
  return { ...context, opening: true, literal_action: '' };
}

const DIALOGUE_LINE = /^\s*(.{1,40}?)\s*(?:\(([^()\n]{1,80})\)\s*)?:\s*["“](.+?)["”]\s*$/u;

function text(value) { return typeof value === 'string' ? value.trim() : ''; }

export function parseR3DialogueLines(storyText, actorNames = {}) {
  const idByName = new Map(Object.entries(actorNames).map(([id, name]) => [name, id]));
  return String(storyText ?? '').replace(/\r\n?/g, '\n').split('\n').flatMap((line, order) => {
    const match = DIALOGUE_LINE.exec(line); const speaker = text(match?.[1]); const speakerId = idByName.get(speaker);
    return speakerId && text(match?.[3]) ? [{ speaker_id: speakerId, speaker_name: speaker, direction: text(match[2]), text: text(match[3]), order }] : [];
  });
}

export function projectR3Media(viewModel = {}) {
  const present = Array.isArray(viewModel.scene?.present_actor_ids) ? viewModel.scene.present_actor_ids : [];
  const presentHeroines = present.filter(id => viewModel.actorNames?.[id]);
  const dialogueSpeakers = [...new Set((viewModel.media?.dialogue_lines ?? []).map(line => line.speaker_id).filter(id => presentHeroines.includes(id)))];
  const focalId = viewModel.presentation?.focal_actor?.actor_id ?? viewModel.scene?.focal_actor?.id ?? '';
  const focal = focalId && presentHeroines.includes(focalId) ? focalId : '';
  const hint = viewModel.media?.media_hint;
  const hintCharacter = hint?.actor_id && presentHeroines.includes(hint.actor_id) ? hint.actor_id : '';
  const imageCharacterId = hintCharacter || focal || (dialogueSpeakers.length === 1 ? dialogueSpeakers[0] : presentHeroines.length === 1 ? presentHeroines[0] : null);
  return {
    image_character_id: imageCharacterId,
    image_pool: hint?.pool === 'sex' ? 'sex' : 'general',
    image_situation: viewModel.scene?.scene_note ?? '',
    image_tags: Array.isArray(hint?.tags) ? hint.tags : [],
    dialogue_lines: viewModel.media?.dialogue_lines ?? []
  };
}

export function createR3MediaUi({ documentRef = globalThis.document, api, getViewModel = () => null } = {}) {
  const get = id => documentRef?.getElementById?.(id);
  const panel = get('media-panel'); const image = get('character-image'); const status = get('image-status');
  let latestKey = ''; let inFlightKey = ''; let completedKey = '';
  function clear() {
    if (panel) panel.hidden = true;
    if (image) { image.hidden = true; image.removeAttribute?.('src'); image.alt = ''; }
    if (status) { status.hidden = true; status.textContent = ''; }
  }
  function key(view) {
    const turn = view?.turn ?? {};
    return [turn.committed_turn, turn.turn_id, turn.revision, view?.media?.image_character_id, view?.scene?.location_id].join('|');
  }
  async function load() {
    const view = getViewModel?.(); const media = view?.media; const hasCommittedStory = Boolean(view?.story && view?.history?.length);
    if (!media?.image_character_id || !hasCommittedStory) { latestKey = ''; inFlightKey = ''; clear(); return null; }
    const requestKey = key(view); if (requestKey === completedKey || requestKey === inFlightKey) return null;
    latestKey = requestKey; inFlightKey = requestKey; if (status) { status.hidden = false; status.textContent = '장면 이미지를 불러오는 중…'; }
    try {
      const result = await api.image({ character_id: media.image_character_id, pool: media.image_pool, situation: media.image_situation, tags: media.image_tags, location_id: view.scene?.location_id ?? null });
      if (requestKey !== latestKey) return null;
      const selected = result?.image ?? null;
      if (!selected?.image_url) { clear(); completedKey = requestKey; return null; }
      if (panel) panel.hidden = false;
      if (image) { image.hidden = false; image.src = selected.image_url; image.alt = selected.situation || `${result.character_id ?? media.image_character_id} 현재 장면`; }
      if (status) { status.hidden = !selected.situation; status.textContent = selected.situation || ''; }
      completedKey = requestKey; return selected;
    } catch {
      if (requestKey === latestKey) { clear(); completedKey = requestKey; }
      return null;
    } finally { if (inFlightKey === requestKey) inFlightKey = ''; }
  }
  return { load, clear, get state() { return { latestKey, inFlightKey, completedKey }; } };
}

export function validateCommittedDialogueRequest(body, { speakerId, committedLines, presentActorIds }) {
  const utterance = typeof body?.text === 'string' ? body.text.trim() : '';
  const direction = typeof body?.direction === 'string' ? body.direction.trim().slice(0, 80) : '';
  const requestedLines = Array.isArray(body?.lines) ? body.lines : [];
  const present = new Set(presentActorIds ?? []);
  const committed = Array.isArray(committedLines) ? committedLines : [];
  const validLines = requestedLines.length > 0 && requestedLines.length <= 10 && requestedLines.every(line => {
    const text = typeof line?.text === 'string' ? line.text.trim() : '';
    const quote = typeof line?.evidence_quote === 'string' ? line.evidence_quote : '';
    const lineDirection = typeof line?.direction === 'string' ? line.direction.trim().slice(0, 80) : '';
    return text.length > 0 && text.length <= 350 && lineDirection === direction && committed.some(item =>
      item.speaker_id === speakerId && item.text === text && item.evidence_quote === quote && item.direction === lineDirection
    );
  });
  const valid = Boolean(
    speakerId && present.has(speakerId) && utterance && validLines &&
    requestedLines.map(line => line.text.trim()).join(' ') === utterance
  );
  return { valid, utterance, direction };
}

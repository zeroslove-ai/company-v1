export function deriveRecoverableStep(status) {
  switch (status?.processing_status) {
    case 'story_streaming':
      return status.has_story ? 'resume_extract' : 'wait_story';
    case 'extracting':
      return status.has_story ? 'resume_extract' : 'retry_story';
    case 'committing':
      return status.has_extract ? 'resume_commit' : 'retry_extract';
    case 'committed':
      return 'complete';
    case 'story_failed':
      return 'retry_story';
    case 'extract_failed':
      return 'retry_extract';
    case 'commit_failed':
      return 'retry_commit';
    default:
      return 'none';
  }
}

export function buildTurnState({ currentTurn, expectedTurn, actionId, turnId }) {
  return {
    committed_turn: currentTurn,
    processing_status: 'ready',
    turn_id: turnId,
    action_id: actionId,
    expected_turn: expectedTurn + 1
  };
}

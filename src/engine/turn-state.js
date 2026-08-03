const RECOVERY = {
  story_streaming: 'wait_story',
  extracting: 'resume_extract',
  committing: 'resume_commit',
  committed: 'complete',
  story_failed: 'retry_story',
  extract_failed: 'retry_extract',
  commit_failed: 'retry_commit'
};

export function deriveRecoverableStep(status) {
  return RECOVERY[status?.processing_status] ?? 'none';
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

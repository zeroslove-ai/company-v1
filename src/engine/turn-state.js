export function deriveRecoverableStep(status) {
  switch (status?.processing_status) {
    case 'story_streaming':
      return status.has_story ? 'resume_extract' : 'wait_story';
    case 'extracting':
      // extracting은 Story 저장 후에만 도달하므로 has_story가 사실상 항상 true —
      // 없으면 스토리부터 다시 시작한다.
      return status.has_story ? 'resume_extract' : 'wait_story';
    case 'committing':
      return status.has_extract ? 'resume_commit' : 'retry_extract';
    case 'committed':
    case 'story_failed':
    case 'extract_failed':
    case 'commit_failed':
    case 'ready':
      // failed/ready는 더 이상 재시도 대상이 아니다 — pending을 비우고 새 턴을 받는다.
      // expected_turn_conflict(commit_failed+error_code)도 complete로 처리된다.
      return 'complete';
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

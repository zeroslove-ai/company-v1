const PLAYER_MESSAGES = Object.freeze({
  r3_story_first_content_timeout: '장면 응답이 늦어지고 있습니다. 잠시 후 다시 확인해 주세요.',
  r3_story_total_timeout: '장면 처리가 시간 안에 끝나지 않았습니다. 입력을 확인한 뒤 한 번만 다시 시도해 주세요.',
  r3_stale_turn_timeout: '이번 행동 처리가 중단되었습니다. 입력을 확인한 뒤 한 번만 다시 시도해 주세요.',
  r3_story_failed: '이번 장면을 저장하지 못했습니다. 입력을 확인한 뒤 한 번만 다시 시도해 주세요.',
  r3_stream_reconnect_required: '서버 연결이 끊겼습니다. 입력은 그대로 남아 있습니다. 잠시 후 다시 시도해 주세요.',
  r3_feedback_in_flight: '이전 장면 수정이 아직 처리 중입니다. 잠시 기다려 주세요.',
  r3_feedback_revision_conflict: '현재 장면이 바뀌어 수정 내용을 저장하지 못했습니다.',
  r3_profile_invalid: '프로필 입력을 확인해 주세요.',
  r3_reset_revision_invalid: '현재 장면을 다시 시작할 수 없습니다. 화면을 새로고침해 주세요.'
});

export function playerFacingStatus(value, fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.') {
  const code = typeof value === 'string'
    ? value
    : value?.terminal?.error_code ?? value?.error_code ?? value?.code ?? '';
  return PLAYER_MESSAGES[code] ?? fallback;
}

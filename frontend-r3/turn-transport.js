function committedLiteral(context, expectedTurn, literalAction) {
  return (context?.turns ?? []).some(turn =>
    Number(turn.turn_number) === expectedTurn && turn.literal_action === literalAction
  );
}

/**
 * Reconcile a failed turn transport against the server-owned context.
 * This helper performs one read-only context request and never submits a turn.
 */
export async function reconcileTurnTransport({
  gameId,
  client,
  expectedTurn,
  literalAction,
  renderContext,
  recoverPendingTurn,
  clearLiteral,
  setStatus,
  originalError
}) {
  try {
    const context = await client.context(gameId);
    renderContext(context);

    if (context?.job?.status === 'processing') {
      await recoverPendingTurn();
      return { kind: 'processing', context };
    }

    if (context?.job?.status === 'failed') {
      setStatus(context.job.error_code ?? 'r3_stream_failed', true);
      return { kind: 'failed', context };
    }

    if (committedLiteral(context, expectedTurn, literalAction)) {
      clearLiteral();
      setStatus('저장되었습니다. 응답을 복구했습니다.');
      return { kind: 'committed', context };
    }

    setStatus('입력이 서버에 전송되거나 저장되지 않았습니다. 내용을 확인한 뒤 직접 다시 제출할 수 있습니다.');
    return { kind: 'not_sent', context };
  } catch {
    setStatus(originalError?.message ?? 'r3_stream_reconnect_required', true);
    return { kind: 'unknown' };
  }
}

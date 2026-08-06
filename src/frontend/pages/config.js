export const FRONTEND_CONFIG = Object.freeze({
  editionId: 'company-v1',
  apiBaseUrl: 'https://game-proxy-company-v1.zeroslove.workers.dev',
  defaultGameId: '11111111-1111-4111-8111-111111111111',
  // 새 브라우저 세션 시작 시 서버에서 최근 1턴만 가져온다. 이후 턴은
  // 프론트 메모리(sessionHistory)에 누적된다 — 과거 20턴을 처음부터 내려받지 않는다.
  recentTurns: 1
});

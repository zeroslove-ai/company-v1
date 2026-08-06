export const FRONTEND_CONFIG = Object.freeze({
  editionId: 'company-v1',
  apiBaseUrl: 'https://game-proxy-company-v1.zeroslove.workers.dev',
  defaultGameId: '11111111-1111-4111-8111-111111111111',
  // 중앙 Story timeline이 최근 20턴을 이어서 보여주려면 그만큼 받아와야 한다.
  // 1이면 renderHistory의 slice(-20)이 잘라낼 턴 자체가 없어 항상 1턴만 남는다.
  recentTurns: 20
});

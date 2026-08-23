export function resolveR3ApiBase(locationRef = globalThis.location) {
  const hostname = locationRef?.hostname ?? '';
  if (!hostname.startsWith('gamebuilder-company-r3.')) return '/api/r3';
  return `${locationRef.protocol}//${hostname.replace(/^gamebuilder-/, 'game-proxy-')}/api/r3`;
}

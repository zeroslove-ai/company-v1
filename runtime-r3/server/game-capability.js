const TOKEN_VERSION = 'r3.v1';
const encoder = new TextEncoder();

function subtleCrypto() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('r3_crypto_unavailable');
  return subtle;
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function signingPayload(gameId) {
  return `${TOKEN_VERSION}.${gameId}`;
}

async function signingKey(secret, usages) {
  return subtleCrypto().importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

export function requireGameAccessSecret(secret) {
  if (typeof secret !== 'string' || !secret) throw new Error('r3_game_access_secret_missing');
  return secret;
}

export async function issueGameCapability(gameId, secret) {
  requireGameAccessSecret(secret);
  if (typeof gameId !== 'string' || !gameId) throw new Error('r3_game_id_required');
  const signature = await subtleCrypto().sign('HMAC', await signingKey(secret, ['sign']), encoder.encode(signingPayload(gameId)));
  return `${signingPayload(gameId)}.${base64Url(new Uint8Array(signature))}`;
}

export async function verifyGameCapability(gameId, capability, secret) {
  if (typeof gameId !== 'string' || !gameId || typeof capability !== 'string' || !secret) return false;
  const parts = capability.split('.');
  if (parts.length !== 4 || parts[0] !== 'r3' || parts[1] !== 'v1' || parts[2] !== gameId || !parts[3]) return false;
  try {
    return await subtleCrypto().verify('HMAC', await signingKey(secret, ['verify']), decodeBase64Url(parts[3]), encoder.encode(signingPayload(gameId)));
  } catch {
    return false;
  }
}

export function bearerCapability(request) {
  const value = request.headers.get('authorization')?.trim() ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(value);
  return match?.[1] ?? null;
}

import { createHmac, timingSafeEqual } from 'node:crypto';

export const GENERATOR_HANDOFF_COOKIE = 'felican_generator_handoff';
export const GENERATOR_HANDOFF_TTL_SECONDS = 30 * 60;

const SESSION_ID_RE = /^cs_[A-Za-z0-9_]{10,120}$/;
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function normalizedSecret(value) {
  const secret = String(value || '').trim();
  return secret.length >= 32 ? secret : '';
}

function normalizedDomain(value) {
  const domain = String(value || '').trim().toLowerCase().replace(/^\./, '');
  return DOMAIN_RE.test(domain) ? domain : '';
}

function signature(secret, expires, sessionId) {
  return createHmac('sha256', secret)
    .update(`v1\n${expires}\n${sessionId}`)
    .digest('hex');
}

/**
 * Mint the short-lived, HttpOnly cookie that proves this browser initiated the
 * paid Checkout Session. The cookie is shared only with the configured
 * generator subdomain and is never readable by page JavaScript.
 */
export function buildGeneratorHandoffCookie({
  sessionId,
  secret,
  domain,
  secure = true,
  now = Date.now(),
  ttlSeconds = GENERATOR_HANDOFF_TTL_SECONDS,
} = {}) {
  const signingSecret = normalizedSecret(secret);
  const cookieDomain = normalizedDomain(domain);
  if (!SESSION_ID_RE.test(String(sessionId || '')) || !signingSecret || !cookieDomain) return '';

  const expires = Math.floor(now / 1000) + ttlSeconds;
  const value = `v1.${expires}.${sessionId}.${signature(signingSecret, expires, sessionId)}`;
  const attributes = [
    `${GENERATOR_HANDOFF_COOKIE}=${value}`,
    `Domain=${cookieDomain}`,
    'Path=/claim',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ttlSeconds}`,
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

/** Shared with generator-side tests so both implementations stay byte-exact. */
export function verifyGeneratorHandoffCookie(value, sessionId, secret, now = Date.now()) {
  const signingSecret = normalizedSecret(secret);
  if (!signingSecret || !SESSION_ID_RE.test(String(sessionId || ''))) return false;
  const parts = String(value || '').split('.');
  if (parts.length !== 4 || parts[0] !== 'v1' || parts[2] !== sessionId) return false;
  const expires = Number.parseInt(parts[1], 10);
  if (!Number.isSafeInteger(expires)) return false;
  const nowSeconds = Math.floor(now / 1000);
  if (expires < nowSeconds || expires > nowSeconds + GENERATOR_HANDOFF_TTL_SECONDS + 60) return false;
  const supplied = Buffer.from(parts[3], 'hex');
  const expected = Buffer.from(signature(signingSecret, expires, sessionId), 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

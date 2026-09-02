import { describe, expect, it } from 'vitest';
import {
  GENERATOR_HANDOFF_COOKIE,
  buildGeneratorHandoffCookie,
  verifyGeneratorHandoffCookie,
} from './handoff.js';

const secret = 'test-generator-handoff-secret-32-bytes-minimum';
const sessionId = 'cs_test_generator_handoff_123456';
const now = Date.UTC(2026, 8, 2, 12, 0, 0);

function cookieValue(header) {
  return header.split(';', 1)[0].slice(`${GENERATOR_HANDOFF_COOKIE}=`.length);
}

describe('generator checkout handoff cookie', () => {
  it('is scoped, HttpOnly, short-lived, and verifiable by the generator', () => {
    const header = buildGeneratorHandoffCookie({
      sessionId, secret, domain: 'felican.dev', secure: true, now,
    });
    expect(header).toContain(`${GENERATOR_HANDOFF_COOKIE}=v1.`);
    expect(header).toContain('Domain=felican.dev');
    expect(header).toContain('Path=/claim');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Max-Age=1800');
    expect(header).toContain('Secure');
    expect(verifyGeneratorHandoffCookie(cookieValue(header), sessionId, secret, now + 60_000)).toBe(true);
  });

  it('rejects copied order ids, tampering, expiry, weak secrets, and invalid domains', () => {
    const header = buildGeneratorHandoffCookie({
      sessionId, secret, domain: 'felican.dev', secure: true, now,
    });
    const value = cookieValue(header);
    expect(verifyGeneratorHandoffCookie('', sessionId, secret, now)).toBe(false);
    expect(verifyGeneratorHandoffCookie(value, 'cs_test_different_123456', secret, now)).toBe(false);
    expect(verifyGeneratorHandoffCookie(`${value.slice(0, -1)}0`, sessionId, secret, now)).toBe(false);
    expect(verifyGeneratorHandoffCookie(value, sessionId, secret, now + 1_900_000)).toBe(false);
    expect(buildGeneratorHandoffCookie({ sessionId, secret: 'too-short', domain: 'felican.dev', now })).toBe('');
    expect(buildGeneratorHandoffCookie({ sessionId, secret, domain: 'localhost', now })).toBe('');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { createAppServer, contactIsConfigured, normalizeContact, normalizeMessages, sanitizeAssistantReply, sanitizeText } from './app.js';

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start(complete = async () => 'A real answer from Felican AI.', options = {}) {
  const server = createAppServer({
    rootDir: process.cwd(),
    complete,
    ...(options.sendContact ? { sendContact: options.sendContact } : {}),
    env: { ANTHROPIC_API_KEY: 'test-key', ...options.env },
    logger: options.logger || { error() {}, info() {}, warn() {} },
  });
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

const browserHeaders = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126 Safari/537.36' };

describe('Felican AI contact endpoint', () => {
  const RESEND = { RESEND_API_KEY: 'test-resend-key' };
  const goodBody = {
    name: 'Dana Reyes', email: 'dana@example.com', company: 'Reyes HVAC',
    phone: '555-0100', product: 'Relay', message: 'We are drowning in scheduling.', website: '',
  };

  it('validates required fields before attempting to send', () => {
    expect(normalizeContact({ name: '', email: 'nope', message: '' }).errors).toEqual(['name', 'email', 'message']);
    const ok = normalizeContact({ name: 'A', email: 'a@b.co', message: 'Hi', source: 'assistant' });
    expect(ok.errors).toEqual([]);
    expect(ok.value.source).toBe('assistant');
    // Anything not explicitly the assistant is recorded as the form.
    expect(normalizeContact({ name: 'A', email: 'a@b.co', message: 'Hi', source: 'spoofed' }).value.source).toBe('contact-form');
  });

  it('reports whether the mail provider is configured', () => {
    expect(contactIsConfigured({})).toBe(false);
    expect(contactIsConfigured({ RESEND_API_KEY: '  ' })).toBe(false);
    expect(contactIsConfigured(RESEND)).toBe(true);
  });

  it('delivers a valid enquiry through the configured sender', async () => {
    const sent = [];
    const base = await start(undefined, { env: RESEND, sendContact: async contact => { sent.push(contact); } });
    const response = await fetch(`${base}/api/contact`, {
      method: 'POST', headers: browserHeaders, body: JSON.stringify(goodBody),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ name: 'Dana Reyes', email: 'dana@example.com', product: 'Relay', source: 'contact-form' });
  });

  it('rejects bad input and unsupported methods without sending', async () => {
    const sent = [];
    const base = await start(undefined, { env: RESEND, sendContact: async c => { sent.push(c); } });
    const bad = await fetch(`${base}/api/contact`, {
      method: 'POST', headers: browserHeaders, body: JSON.stringify({ name: '', email: 'x', message: '' }),
    });
    expect(bad.status).toBe(400);
    await expect(bad.json()).resolves.toMatchObject({ fields: ['name', 'email', 'message'] });
    const wrongMethod = await fetch(`${base}/api/contact`, { method: 'GET' });
    expect(wrongMethod.status).toBe(405);
    expect(sent).toHaveLength(0);
  });

  it('silently swallows honeypot submissions', async () => {
    const sent = [];
    const base = await start(undefined, { env: RESEND, sendContact: async c => { sent.push(c); } });
    const response = await fetch(`${base}/api/contact`, {
      method: 'POST', headers: browserHeaders, body: JSON.stringify({ ...goodBody, website: 'http://spam.example' }),
    });
    // A bot should see success and learn nothing.
    expect(response.status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  it('returns 503 when the mail provider is not configured', async () => {
    const base = await start(undefined, { env: {}, sendContact: async () => { throw new Error('should not be called'); } });
    const response = await fetch(`${base}/api/contact`, {
      method: 'POST', headers: browserHeaders, body: JSON.stringify(goodBody),
    });
    expect(response.status).toBe(503);
  });

  it('surfaces a usable error when the provider fails', async () => {
    const base = await start(undefined, { env: RESEND, sendContact: async () => { throw new Error('Resend returned 422'); } });
    const response = await fetch(`${base}/api/contact`, {
      method: 'POST', headers: browserHeaders, body: JSON.stringify(goodBody),
    });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('felican.ai.inc@gmail.com') });
  });

  it('rate limits repeated submissions from one address', async () => {
    const base = await start(undefined, { env: RESEND, sendContact: async () => {} });
    const codes = [];
    for (let i = 0; i < 7; i += 1) {
      const response = await fetch(`${base}/api/contact`, {
        method: 'POST', headers: browserHeaders, body: JSON.stringify(goodBody),
      });
      codes.push(response.status);
    }
    expect(codes.filter(c => c === 200)).toHaveLength(5);
    expect(codes.filter(c => c === 429)).toHaveLength(2);
  });
});

describe('Felican AI server', () => {
  it('sanitizes visitor input and limits conversation size', () => {
    expect(sanitizeText('<b>Hello</b>\u0000 world')).toBe('Hello world');
    expect(normalizeMessages(Array.from({ length: 12 }, (_, index) => ({ role: 'user', content: `<b>${index}</b>` })))).toHaveLength(10);
    expect(sanitizeAssistantReply('**Relay** — [Open it](https://relay.felican.dev/relay)')).toBe('Relay — Open it (https://relay.felican.dev/relay)');
  });

  it('returns a real assistant reply from the configured completion function', async () => {
    const base = await start(async messages => `You asked: ${messages.at(-1).content}`);
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ website: '', messages: [{ role: 'user', content: 'What do you build?' }] }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reply: 'You asked: What do you build?' });
  });

  it('rejects malformed JSON, empty questions, bots, and unsupported methods', async () => {
    const base = await start();
    const malformed = await fetch(`${base}/api/chat`, { method: 'POST', headers: browserHeaders, body: '{' });
    expect(malformed.status).toBe(400);
    const empty = await fetch(`${base}/api/chat`, { method: 'POST', headers: browserHeaders, body: JSON.stringify({ messages: [] }) });
    expect(empty.status).toBe(400);
    const bot = await fetch(`${base}/api/chat`, { method: 'POST', headers: { ...browserHeaders, 'User-Agent': 'curl/8' }, body: '{}' });
    expect(bot.status).toBe(403);
    const get = await fetch(`${base}/api/chat`, { headers: browserHeaders });
    expect(get.status).toBe(405);
  });

  it('does not call the AI provider when the honeypot is filled', async () => {
    let calls = 0;
    const base = await start(async () => { calls += 1; return 'unexpected'; });
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ website: 'spam.example', messages: [{ role: 'user', content: 'hello' }] }),
    });
    expect(response.status).toBe(200);
    expect(calls).toBe(0);
  });

  it('returns a safe temporary-unavailable response when the provider fails', async () => {
    const base = await start(async () => {
      const error = new Error('provider secret must not reach the visitor');
      error.statusCode = 503;
      throw error;
    });
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'The assistant is temporarily unavailable.' });
  });

  it('rate limits repeated assistant requests per visitor', async () => {
    const base = await start();
    const request = () => fetch(`${base}/api/chat`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });
    const allowed = await Promise.all(Array.from({ length: 10 }, request));
    expect(allowed.every(response => response.status === 200)).toBe(true);
    const blocked = await request();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
  });

  it('reports liveness separately from AI readiness', async () => {
    const readyBase = await start();
    expect((await fetch(`${readyBase}/api/health`)).status).toBe(200);
    expect((await fetch(`${readyBase}/api/ready`)).status).toBe(200);

    const unavailableBase = await start(undefined, { env: { ANTHROPIC_API_KEY: '', ASHER_API_KEY: '', ASHER_BASE_URL: '' } });
    const unavailable = await fetch(`${unavailableBase}/api/ready`);
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toEqual({ ok: false, dependencies: { ai: 'unavailable' } });
  });

  it('serves restrictive security headers without the retired CDN runtime', async () => {
    const base = await start();
    const response = await fetch(`${base}/server/app.js`);
    const policy = response.headers.get('content-security-policy');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain('https://static.cloudflareinsights.com');
    expect(policy).toContain('https://fonts.googleapis.com');
    expect(policy).toContain('frame-src https://calendly.com https://*.calendly.com https://cal.com https://*.cal.com');
    expect(policy).not.toContain('unpkg.com');
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
  });

  it('accepts privacy-safe analytics and rejects unknown routes', async () => {
    const logs = [];
    const base = await start(undefined, { logger: { error() {}, warn() {}, info(value) { logs.push(JSON.parse(value)); } } });
    const analytics = await fetch(`${base}/api/analytics`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ event: 'page_view', path: '/products/', target: '', referrer: 'example.com' }),
    });
    expect(analytics.status).toBe(204);
    expect(logs.some(entry => entry.event === 'site.analytics' && entry.eventName === 'page_view')).toBe(true);
    expect((await fetch(`${base}/definitely-not-a-page`)).status).toBe(404);
  });

  it('keeps staging out of search while allowing production indexing', async () => {
    const base = await start();
    const staging = await fetch(`${base}/robots.txt`);
    expect(await staging.text()).toContain('Disallow: /');
    const production = await fetch(`${base}/robots.txt`, { headers: { 'X-Forwarded-Host': 'felican.ai' } });
    expect(await production.text()).toContain('Sitemap: https://felican.ai/sitemap.xml');
  });
});

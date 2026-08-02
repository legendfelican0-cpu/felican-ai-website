import { afterEach, describe, expect, it } from 'vitest';
import { createAppServer, normalizeMessages, sanitizeAssistantReply, sanitizeText } from './app.js';

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start(complete = async () => 'A real answer from Felican AI.', options = {}) {
  const server = createAppServer({
    rootDir: process.cwd(),
    complete,
    env: { ANTHROPIC_API_KEY: 'test-key', ...options.env },
    logger: options.logger || { error() {}, info() {}, warn() {} },
  });
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

const browserHeaders = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126 Safari/537.36' };

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

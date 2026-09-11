// Regression tests for the search-visibility behaviour added in the SEO pass.
//
// The most important one is the first: production robots.txt must never again contain
// a site-wide `Disallow: /`. A stale Cloudflare Worker served exactly that for the
// whole apex, which kept felican.ai out of every search index.

import { afterEach, describe, expect, it } from 'vitest';
import { createAppServer } from './app.js';

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start(options = {}) {
  const server = createAppServer({
    rootDir: `${process.cwd()}/public`,
    complete: async () => 'ok',
    // Silent by default, but a test that wants the log must be able to override it,
    // so the spread comes last.
    logger: { error() {}, info() {}, warn() {} },
    env: {
      ANTHROPIC_API_KEY: 'test-key',
      GENERATOR_HANDOFF_SECRET: 'test-generator-handoff-secret-32-bytes-minimum',
    },
    ...options,
  });
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

const prod = { 'X-Forwarded-Host': 'felican.ai' };

describe('robots.txt', () => {
  it('never blocks the whole production site', async () => {
    const base = await start();
    const body = await (await fetch(`${base}/robots.txt`, { headers: prod })).text();

    // The exact regression: a bare site-wide disallow.
    expect(body).not.toMatch(/^Disallow: \/$/m);
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: https://felican.ai/sitemap.xml');
  });

  it('keeps only the non-public paths out', async () => {
    const base = await start();
    const body = await (await fetch(`${base}/robots.txt`, { headers: prod })).text();
    expect(body).toContain('Disallow: /checkout/');
    expect(body).toContain('Disallow: /thank-you/');
  });

  it('explicitly welcomes AI search and retrieval crawlers', async () => {
    const base = await start();
    const body = await (await fetch(`${base}/robots.txt`, { headers: prod })).text();
    for (const agent of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']) {
      expect(body).toContain(`User-agent: ${agent}`);
    }
    // Each named agent group must allow, not disallow.
    const groups = body.split(/\n(?=User-agent: )/).filter(g => /^User-agent: (GPTBot|ClaudeBot|PerplexityBot)/.test(g));
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) expect(group).toContain('Allow: /');
  });

  it('still keeps staging out of search entirely', async () => {
    const base = await start();
    for (const host of ['felican.dev', 'localhost']) {
      const body = await (await fetch(`${base}/robots.txt`, { headers: { 'X-Forwarded-Host': host } })).text();
      expect(body).toMatch(/^Disallow: \/$/m);
      expect(body).not.toContain('Sitemap:');
    }
  });
});

describe('canonical URL redirects', () => {
  it('redirects a directory path without its trailing slash', async () => {
    const base = await start();
    const response = await fetch(`${base}/products`, { redirect: 'manual' });
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/products/');
  });

  it('redirects an explicit index.html to its directory', async () => {
    const base = await start();
    const response = await fetch(`${base}/index.html`, { redirect: 'manual' });
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/');
  });

  it('preserves the query string through the redirect', async () => {
    const base = await start();
    const response = await fetch(`${base}/contact?product=Private%20AI`, { redirect: 'manual' });
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/contact/?product=Private%20AI');
  });

  it('leaves an already-canonical URL alone', async () => {
    const base = await start();
    for (const path of ['/products/', '/guides/private-ai/', '/services/ai-auditing/']) {
      expect((await fetch(`${base}${path}`, { redirect: 'manual' })).status).toBe(200);
    }
  });

  it('does not redirect a path that has no directory behind it', async () => {
    const base = await start();
    // Would 404 either way; the point is that it must not 301 to a URL that 404s.
    const response = await fetch(`${base}/definitely-not-a-page`, { redirect: 'manual' });
    expect(response.status).toBe(404);
  });

  it('does not redirect a real file that happens to lack a slash', async () => {
    const base = await start();
    expect((await fetch(`${base}/sitemap.xml`, { redirect: 'manual' })).status).toBe(200);
  });
});

describe('image delivery', () => {
  // Accept-based negotiation was tried and reverted. Cloudflare honours only
  // `Vary: Accept-Encoding` and ignores `Vary: Accept`, so a negotiated image was
  // cached once at the edge and served to every client — a browser without AVIF
  // support received AVIF and rendered a broken image. Caught on felican.dev.
  //
  // AVIF/WebP are offered per-URL instead, so each variant is its own cache entry.
  it('always serves the exact file that was requested', async () => {
    const base = await start();
    for (const accept of ['image/avif,image/webp,image/*,*/*', 'image/webp,*/*', 'image/*']) {
      const response = await fetch(`${base}/product-private-ai.png`, { headers: { Accept: accept } });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    }
  });

  it('never varies an image response on Accept', async () => {
    const base = await start();
    const response = await fetch(`${base}/product-private-ai.png`, { headers: { Accept: 'image/avif,*/*' } });
    // Absent is the correct answer; a bare `Accept` in Vary is the bug.
    expect(response.headers.get('vary') || '').not.toMatch(/\baccept\b(?!-encoding)/i);
  });

  it('serves the AVIF and WebP variants at their own URLs', async () => {
    const base = await start();
    const avif = await fetch(`${base}/product-private-ai.avif`);
    const webp = await fetch(`${base}/product-private-ai.webp`);
    expect(avif.headers.get('content-type')).toBe('image/avif');
    expect(webp.headers.get('content-type')).toBe('image/webp');
  });

  it('the variants are materially smaller than the original', async () => {
    const base = await start();
    const png = Number((await fetch(`${base}/product-private-ai.png`)).headers.get('content-length'));
    const avif = Number((await fetch(`${base}/product-private-ai.avif`)).headers.get('content-length'));
    expect(avif).toBeLessThan(png / 2);
  });
});

describe('asset caching', () => {
  it('marks images immutable for a year', async () => {
    const base = await start();
    const response = await fetch(`${base}/product-private-ai.png`, { headers: { Accept: 'image/*' } });
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('keeps HTML uncached so a deploy is visible immediately', async () => {
    const base = await start();
    const response = await fetch(`${base}/products/`);
    expect(response.headers.get('cache-control')).toBe('no-cache');
  });
});

describe('search monitoring', () => {
  it('accepts Core Web Vitals samples', async () => {
    const logs = [];
    const base = await start({ logger: { error() {}, warn() {}, info: line => logs.push(JSON.parse(line)) } });
    const response = await fetch(`${base}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'web_vitals', path: '/products/private-ai/', metric: 'LCP', value: 1840, rating: 'good' }),
    });
    expect(response.status).toBe(204);
    const entry = logs.find(entry => entry.event === 'site.analytics');
    expect(entry.eventName).toBe('web_vitals');
    expect(entry.metric).toBe('LCP');
    expect(entry.value).toBe(1840);
    expect(entry.rating).toBe('good');
  });

  it('accepts AI assistant referrals', async () => {
    const logs = [];
    const base = await start({ logger: { error() {}, warn() {}, info: line => logs.push(JSON.parse(line)) } });
    const response = await fetch(`${base}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'ai_referral', path: '/guides/private-ai/', target: 'ChatGPT' }),
    });
    expect(response.status).toBe(204);
    const entry = logs.find(entry => entry.event === 'site.analytics');
    expect(entry.eventName).toBe('ai_referral');
    expect(entry.target).toBe('ChatGPT');
  });

  it('clamps a hostile metric value instead of logging it raw', async () => {
    const logs = [];
    const base = await start({ logger: { error() {}, warn() {}, info: line => logs.push(JSON.parse(line)) } });
    await fetch(`${base}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'web_vitals', metric: 'LCP', value: 9e18 }),
    });
    const entry = logs.find(entry => entry.event === 'site.analytics');
    expect(entry.value).toBeLessThanOrEqual(600000);
  });

  it('ignores an unknown event name', async () => {
    const logs = [];
    const base = await start({ logger: { error() {}, warn() {}, info: line => logs.push(JSON.parse(line)) } });
    const response = await fetch(`${base}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'not_a_real_event', path: '/' }),
    });
    expect(response.status).toBe(204);
    expect(logs.find(entry => entry.event === 'site.analytics')).toBeUndefined();
  });
});

describe('assistant knowledge', () => {
  // The assistant's knowledge used to be hardcoded in the system prompt: five products
  // when the site had nineteen, and the old name for Voice AI. It is generated from
  // content/*.js now, and these assert it stays in sync.
  it('knows every product on the site, not a hardcoded handful', async () => {
    const { FELICAN_SYSTEM_PROMPT } = await import('./app.js');
    const { PRODUCTS } = await import('../content/products.js');
    const missing = PRODUCTS.filter(p => !p.hubOnly).filter(p => !FELICAN_SYSTEM_PROMPT.includes(p.name));
    expect(missing.map(p => p.name)).toEqual([]);
  });

  it('knows every service, industry and guide', async () => {
    const { FELICAN_SYSTEM_PROMPT } = await import('./app.js');
    const { SERVICES } = await import('../content/services.js');
    const { INDUSTRIES } = await import('../content/industries.js');
    const { GUIDES } = await import('../content/guides.js');
    for (const s of SERVICES) expect(FELICAN_SYSTEM_PROMPT).toContain(s.name);
    for (const i of INDUSTRIES) expect(FELICAN_SYSTEM_PROMPT).toContain(i.longName);
    for (const g of GUIDES) expect(FELICAN_SYSTEM_PROMPT).toContain(g.h1);
  });

  it('carries no renamed or retired names', async () => {
    const { FELICAN_SYSTEM_PROMPT, FELICAN_VOICE_SYSTEM_PROMPT } = await import('./app.js');
    for (const prompt of [FELICAN_SYSTEM_PROMPT, FELICAN_VOICE_SYSTEM_PROMPT]) {
      expect(prompt).not.toContain('Felican Auto');
      expect(prompt).not.toContain('Business automation');
      expect(prompt).not.toContain('AI agents and bots');
    }
  });

  it('quotes the price from server/checkout.js', async () => {
    const { FELICAN_SYSTEM_PROMPT } = await import('./app.js');
    const { CATALOG } = await import('./checkout.js');
    expect(FELICAN_SYSTEM_PROMPT).toContain(`$${(CATALOG['private-ai'].amount / 100).toLocaleString('en-US')}`);
    expect(FELICAN_SYSTEM_PROMPT).toContain(`$${(CATALOG.pack.amount / 100).toLocaleString('en-US')}`);
  });

  it('tells the chat assistant to be brief and to offer follow-ups', async () => {
    const { FELICAN_SYSTEM_PROMPT } = await import('./app.js');
    expect(FELICAN_SYSTEM_PROMPT).toMatch(/two to four short sentences/i);
    expect(FELICAN_SYSTEM_PROMPT).toMatch(/follow-up questions/i);
    expect(FELICAN_SYSTEM_PROMPT).toContain('> ');
  });

  it('keeps the "> " follow-up convention out of the voice prompt', async () => {
    // Spoken aloud, "> " is read as "greater than".
    const { FELICAN_VOICE_SYSTEM_PROMPT } = await import('./app.js');
    expect(FELICAN_VOICE_SYSTEM_PROMPT).toMatch(/one or two sentences/i);
    expect(FELICAN_VOICE_SYSTEM_PROMPT).not.toMatch(/^> /m);
    expect(FELICAN_VOICE_SYSTEM_PROMPT).toMatch(/never read out a url/i);
  });
});

describe('chat streaming', () => {
  it('streams the reply as server-sent events when asked', async () => {
    const base = await start({
      streamReply: async (messages, onDelta) => {
        onDelta('Private AI ');
        onDelta('runs inside your network.');
        return { reply: 'Private AI runs inside your network.\n> What does it cost?', usage: {} };
      },
    });
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', 'User-Agent': 'Mozilla/5.0 Chrome/126' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'what is private ai' }], stream: true }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const body = await response.text();
    expect(body).toContain('event: delta');
    expect(body).toContain('event: done');
    expect(body).toContain('Private AI ');
  });

  it('still answers normally when streaming is not requested', async () => {
    const base = await start({ complete: async () => 'A buffered answer.' });
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).reply).toBe('A buffered answer.');
  });

  it('reports a provider failure on the stream instead of hanging', async () => {
    const base = await start({
      streamReply: async () => { throw new Error('provider down'); },
    });
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', 'User-Agent': 'Mozilla/5.0 Chrome/126' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }], stream: true }),
    });
    expect(await response.text()).toContain('event: failed');
  });
});

describe('assistant abuse limits', () => {
  // The chat endpoint calls a paid model, so an unthrottled one is a bill waiting to
  // happen. These pin the limits that already existed, so nobody relaxes them by
  // accident, plus the scope rule that stops it being used as a free general LLM.
  it('rejects bot user agents outright', async () => {
    const base = await start({ complete: async () => 'should not be reached' });
    for (const ua of ['curl/8.4.0', 'python-requests/2.31', 'Scrapy/2.11', 'Googlebot/2.1', '']) {
      const response = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
      });
      expect(response.status).toBe(403);
    }
  });

  it('rate limits a single IP', async () => {
    const base = await start({ complete: async () => 'ok' });
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 Chrome/126',
      'CF-Connecting-IP': '203.0.113.42',
    };
    const body = JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] });
    const codes = [];
    for (let i = 0; i < 14; i += 1) {
      codes.push((await fetch(`${base}/api/chat`, { method: 'POST', headers, body })).status);
    }
    // Ten per minute, then throttled — the caller must not be able to keep going.
    expect(codes.filter(c => c === 200).length).toBeLessThanOrEqual(10);
    expect(codes).toContain(429);
  });

  it('counts the real client IP behind Cloudflare, not the proxy', async () => {
    // Without this every visitor would share one bucket and one person could lock
    // everyone else out — or evade the limit entirely.
    const base = await start({ complete: async () => 'ok' });
    const send = ip => fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126', 'CF-Connecting-IP': ip },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    for (let i = 0; i < 11; i += 1) await send('198.51.100.7');
    expect((await send('198.51.100.7')).status).toBe(429);
    // A different visitor is unaffected.
    expect((await send('198.51.100.8')).status).toBe(200);
  });

  it('caps message size and history length', async () => {
    const { normalizeMessages } = await import('./app.js');
    const long = normalizeMessages([{ role: 'user', content: 'x'.repeat(5000) }]);
    expect(long[0].content.length).toBeLessThanOrEqual(800);
    const many = normalizeMessages(Array.from({ length: 40 }, () => ({ role: 'user', content: 'hi' })));
    expect(many.length).toBeLessThanOrEqual(10);
  });

  it('both prompts refuse anything that is not about Felican AI', async () => {
    const { FELICAN_SYSTEM_PROMPT, FELICAN_VOICE_SYSTEM_PROMPT } = await import('./app.js');
    for (const raw of [FELICAN_SYSTEM_PROMPT, FELICAN_VOICE_SYSTEM_PROMPT]) {
      // The prompts are hard-wrapped, so match against normalised whitespace rather
      // than depending on where a line happens to break.
      const prompt = raw.replace(/\s+/g, ' ');
      expect(prompt).toContain('WHAT YOU WILL AND WILL NOT ANSWER');
      expect(prompt).toMatch(/only help with questions about Felican AI/i);
      // Prompt-injection and roleplay attempts are named explicitly.
      expect(prompt).toMatch(/ignore[^.]{0,40}reveal/i);
      expect(prompt).toMatch(/roleplay/i);
    }
  });
});

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

describe('image content negotiation', () => {
  it('serves AVIF to a browser that accepts it', async () => {
    const base = await start();
    const response = await fetch(`${base}/product-private-ai.png`, {
      headers: { Accept: 'image/avif,image/webp,image/*,*/*' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/avif');
    expect(response.headers.get('vary')).toBe('Accept');
  });

  it('falls back to WebP when AVIF is not accepted', async () => {
    const base = await start();
    const response = await fetch(`${base}/product-private-ai.png`, {
      headers: { Accept: 'image/webp,image/*,*/*' },
    });
    expect(response.headers.get('content-type')).toBe('image/webp');
  });

  it('serves the original PNG when no modern format is accepted', async () => {
    const base = await start();
    const response = await fetch(`${base}/product-private-ai.png`, { headers: { Accept: 'image/*' } });
    expect(response.headers.get('content-type')).toBe('image/png');
  });

  it('negotiated variants are materially smaller than the original', async () => {
    const base = await start();
    const png = await fetch(`${base}/product-private-ai.png`, { headers: { Accept: 'image/*' } });
    const avif = await fetch(`${base}/product-private-ai.png`, { headers: { Accept: 'image/avif,*/*' } });
    const pngSize = Number(png.headers.get('content-length'));
    const avifSize = Number(avif.headers.get('content-length'));
    expect(avifSize).toBeLessThan(pngSize / 2);
  });

  it('does not negotiate non-raster assets', async () => {
    const base = await start();
    const response = await fetch(`${base}/favicon.svg`, { headers: { Accept: 'image/avif,image/webp,*/*' } });
    expect(response.headers.get('content-type')).toBe('image/svg+xml');
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

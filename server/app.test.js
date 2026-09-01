import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppServer, contactIsConfigured, deliverEducationLead, normalizeContact, normalizeMessages, sanitizeAssistantReply, sanitizeText, voiceBundleIntegrity } from './app.js';

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start(complete = async () => 'A real answer from Felican AI.', options = {}) {
  const { env: extraEnv = {}, logger, ...serverOptions } = options;
  const server = createAppServer({
    rootDir: process.cwd(),
    complete,
    ...serverOptions,
    env: { ANTHROPIC_API_KEY: 'test-key', ...extraEnv },
    logger: logger || { error() {}, info() {}, warn() {} },
  });
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

const browserHeaders = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126 Safari/537.36' };

function memoryOrderStore() {
  const orders = new Map();
  return {
    async get(id) { return orders.get(id) || null; },
    async upsertPaid(order) {
      const saved = { ...order, ...(orders.get(order.id) || {}) };
      orders.set(order.id, saved);
      return saved;
    },
    async markWelcomeSent(id, { resendId }) {
      const saved = { ...orders.get(id), welcomeSentAt: new Date().toISOString(), resendId };
      orders.set(id, saved);
      return saved;
    },
  };
}

function stripeSignature(raw, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

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
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('ai@felican.ai') });
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

describe('Felican AI education eBook access', () => {
  it('accepts every eBook id and returns that eBook direct link', async () => {
    const delivered = [];
    const base = await start(undefined, { deliverLead: async lead => delivered.push(lead) });
    const guides = [
      ['12-ways-ai-can-help-your-business', 'https://felican.ai/ebooks/12-ways-ai-can-help-your-business'],
      ['ai-starter-pack-for-kids-teens-and-adults', 'https://felican.ai/ebooks/ai-starter-pack-for-kids-teens-and-adults'],
      ['ai-for-entrepreneurs', 'https://felican.ai/ebooks/ai-for-entrepreneurs'],
      ['no-more-excuses-12-ai-side-hustles', 'https://felican.ai/ebooks/no-more-excuses-12-ai-side-hustles'],
      ['ai-start-here', 'https://ebooks.felican.dev/ebooks/ai-start-here'],
    ];
    for (const [index, [guideId, guideUrl]] of guides.entries()) {
      const response = await fetch(`${base}/api/education-interest`, {
        method: 'POST',
        headers: { ...browserHeaders, 'X-Forwarded-For': `203.0.113.${20 + index}` },
        body: JSON.stringify({ guideId, email: 'reader@example.com', phone: '', consent: true, website: '' }),
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true, guideUrl });
      const legacy = await fetch(`${base}/ebooks/${guideId}`, { redirect: 'manual' });
      expect(legacy.status).toBe(302);
      expect(legacy.headers.get('location')).toBe(guideUrl);
    }
    expect(delivered).toHaveLength(5);
  });

  it('sends the selected eBook link by email and the Jarvis text relay', async () => {
    const requests = [];
    const fakeFetch = async (url, options) => {
      requests.push({ url: String(url), ...options, json: JSON.parse(options.body) });
      return { ok: true, status: 200 };
    };
    await deliverEducationLead({
      guideId: 'ai-for-entrepreneurs',
      guideTitle: 'AI for Entrepreneurs',
      guideUrl: 'https://felican.ai/ebooks/ai-for-entrepreneurs',
      email: 'reader@example.com',
      phone: '(346) 555-0199',
      phoneE164: '+13465550199',
      submittedAt: '2026-08-17T12:00:00.000Z',
      sourceIp: '203.0.113.10',
    }, {
      RESEND_API_KEY: 'resend-test',
      EDUCATION_LEADS_FROM: 'Felican AI Education <ai@felican.ai>',
      EDUCATION_LEADS_TO: 'ai@felican.ai',
      IMESSAGE_RELAY_URL: 'https://imessage.felican.ai/send',
      IMESSAGE_RELAY_TOKEN: 'relay-test',
    }, fakeFetch);
    expect(requests).toHaveLength(3);
    expect(requests[1].json.to).toEqual(['reader@example.com']);
    expect(requests[1].json.text).toContain('https://felican.ai/ebooks/ai-for-entrepreneurs');
    expect(requests[2].url).toBe('https://imessage.felican.ai/send');
    expect(requests[2].headers.Authorization).toBe('Bearer relay-test');
    expect(requests[2].json.text).toContain('https://felican.ai/ebooks/ai-for-entrepreneurs');
  });

  it('rejects invalid or non-consensual eBook requests and ignores the honeypot', async () => {
    let deliveries = 0;
    const base = await start(undefined, { deliverLead: async () => { deliveries += 1; } });
    for (const [index, body] of [
      { guideId: 'not-a-guide', email: 'reader@example.com', consent: true },
      { guideId: 'ai-for-entrepreneurs', email: '', phone: '', consent: true },
      { guideId: 'ai-for-entrepreneurs', email: 'not-an-email', consent: true },
      { guideId: 'ai-for-entrepreneurs', phone: '123', consent: true },
      { guideId: 'ai-for-entrepreneurs', email: 'reader@example.com', consent: false },
    ].entries()) {
      const response = await fetch(`${base}/api/education-interest`, {
        method: 'POST',
        headers: { ...browserHeaders, 'X-Forwarded-For': `203.0.113.${60 + index}` },
        body: JSON.stringify(body),
      });
      expect(response.status).toBe(400);
    }
    const honeypot = await fetch(`${base}/api/education-interest`, {
      method: 'POST', headers: browserHeaders, body: JSON.stringify({ website: 'spam.example' }),
    });
    expect(honeypot.status).toBe(200);
    expect(deliveries).toBe(0);
  });
});

describe('Starter Pack Stripe webhook', () => {
  const secret = 'whsec_route_test';
  const event = {
    id: 'evt_completed_123', type: 'checkout.session.completed', data: { object: {
      id: 'cs_test_1234567890', payment_status: 'paid', amount_total: 250_000, currency: 'usd', created: 1_700_000_000,
      customer_details: { email: 'buyer@example.com' }, metadata: { items: 'pack' },
    } },
  };

  it('verifies, stores, and welcomes a paid order only once', async () => {
    const sent = [];
    const store = memoryOrderStore();
    const base = await start(undefined, {
      env: { STRIPE_WEBHOOK_SECRET: secret, SITE_ORIGIN: 'https://felican.ai' },
      orderStore: store,
      sendWelcome: async order => { sent.push(order); return { id: 'email_123' }; },
    });
    const raw = JSON.stringify(event);
    const request = () => fetch(`${base}/api/stripe-webhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': stripeSignature(raw, secret) }, body: raw,
    });
    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ id: 'cs_test_1234567890', email: 'buyer@example.com', setupUrl: 'https://felican.ai/thank-you/?session_id=cs_test_1234567890' });
    await expect(store.get('cs_test_1234567890')).resolves.toMatchObject({ amountCents: 250_000, resendId: 'email_123' });
  });

  it('rejects bad signatures and fails closed when no signing secret exists', async () => {
    const store = memoryOrderStore();
    const configured = await start(undefined, { env: { STRIPE_WEBHOOK_SECRET: secret }, orderStore: store, sendWelcome: async () => {} });
    const raw = JSON.stringify(event);
    expect((await fetch(`${configured}/api/stripe-webhook`, {
      method: 'POST', headers: { 'Stripe-Signature': 't=1,v1=bad' }, body: raw,
    })).status).toBe(400);

    const unconfigured = await start(undefined, { env: {}, orderStore: store, sendWelcome: async () => {} });
    expect((await fetch(`${unconfigured}/api/stripe-webhook`, { method: 'POST', body: raw })).status).toBe(503);
  });
});

describe('Felican AI server', () => {
  it('sanitizes visitor input and limits conversation size', () => {
    expect(sanitizeText('<b>Hello</b>\u0000 world')).toBe('Hello world');
    expect(normalizeMessages(Array.from({ length: 12 }, (_, index) => ({ role: 'user', content: `<b>${index}</b>` })))).toHaveLength(10);
    expect(sanitizeAssistantReply('**Relay** — [Open it](https://relay.felican.dev/relay)')).toBe('Relay — Open it (https://relay.felican.dev/relay)');
    expect(sanitizeAssistantReply('Felikan, Fell-ih-can, and Falcon AI met Balas.')).toBe('Felican, Felican, and Felican AI met Ballas.');
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

  it('serves public browser voice configuration without exposing the webhook secret', async () => {
    const base = await start(undefined, { env: {
      FELICAN_VAPI_PUBLIC_KEY: 'public-test-key',
      FELICAN_VAPI_ASSISTANT_ID: 'assistant-test-id',
      FELICAN_VAPI_WEBHOOK_SECRET: 'never-return-this',
    } });
    const response = await fetch(`${base}/api/voice-config`);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ enabled: true, publicKey: 'public-test-key', assistantId: 'assistant-test-id' });
    expect(JSON.stringify(payload)).not.toContain('never-return-this');
  });

  it('streams an authenticated OpenAI-compatible reply for the Vapi voice assistant', async () => {
    const base = await start(async messages => `Voice answer: ${messages.at(-1).content}`, {
      env: { FELICAN_VAPI_WEBHOOK_SECRET: 'voice-test-secret' },
    });
    const unauthorized = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-vapi-secret': 'wrong' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    expect(unauthorized.status).toBe(401);

    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-vapi-secret': 'voice-test-secret' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Tell me about training' }] }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const stream = await response.text();
    expect(stream).toContain('Voice answer: Tell me about training');
    expect(stream).toContain('"finish_reason":"stop"');
    expect(stream).toContain('data: [DONE]');
  });

  it('keeps browser voice disabled when Vapi has not been configured', async () => {
    const base = await start(undefined, { env: { FELICAN_VAPI_PUBLIC_KEY: '', FELICAN_VAPI_ASSISTANT_ID: '' } });
    const response = await fetch(`${base}/api/voice-config`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ enabled: false });
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

  it('serves and caches the integrity-checked COPS voice client on our own origin', async () => {
    const source = 'window.CopsVapi = class CopsVapi {};';
    let upstreamCalls = 0;
    const base = await start(undefined, {
      voiceBundleIntegrityExpected: voiceBundleIntegrity(Buffer.from(source)),
      voiceBundleFetch: async () => {
        upstreamCalls += 1;
        return new Response(source, { status: 200, headers: { 'Content-Type': 'text/javascript' } });
      },
    });
    const first = await fetch(`${base}/voice-client.bundle.js`);
    const second = await fetch(`${base}/voice-client.bundle.js`);
    expect(first.status).toBe(200);
    expect(first.headers.get('content-type')).toContain('text/javascript');
    expect(await first.text()).toBe(source);
    expect(await second.text()).toBe(source);
    expect(upstreamCalls).toBe(1);
  });

  it('serves restrictive security headers without the retired CDN runtime', async () => {
    const base = await start();
    const response = await fetch(`${base}/server/app.js`);
    const policy = response.headers.get('content-security-policy');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain('https://static.cloudflareinsights.com');
    expect(policy).toContain('https://fonts.googleapis.com');
    expect(policy).toContain('https://*.daily.co');
    expect(policy).toContain('https://*.dailywebrtc.com');
    expect(policy).toContain('https://*.dailywebrtc.net');
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

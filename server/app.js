import { createReadStream, existsSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

const BOT_UA = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman|insomnia|java\/|go-http|php\/|ruby|perl|libwww|mechanize|scrapy|phantomjs|headless|selenium|puppeteer|playwright/i;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_LENGTH = 800;
const MAX_MESSAGES = 10;
const RATE_MAP_CAP = 10_000;
const ANALYTICS_EVENTS = new Set(['page_view', 'contact_click', 'product_click', 'assistant_open']);

const MIME = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

export const FELICAN_SYSTEM_PROMPT = `You are the Felican AI assistant running on the Felican AI website. Be clear, brief, friendly, and honest. Answer in 2-4 short sentences unless the visitor asks for detail.

Felican AI builds useful AI products, custom systems, business automations, integrations, assistants, solutions, and training for businesses in any industry. It is a team of more than ten certified AI professionals with backgrounds across every major industry, led by Lee Felican Jr., a software engineer and enterprise architect with 30+ years of experience.

Products and official links:
- Private AI (the flagship product): enterprise-grade private AI with zero data exposure, deployed securely inside the customer's own network. Self-hosted models under their access controls, no data sent to a public model, and data residency, audit trails, and retention rules they set. Recommend this first for any business worried about sensitive data.
- Felican Auto: an AI voice and web assistant for dealerships that answers calls and chats, uses live inventory, books test drives, and captures leads. https://auto.felican.ai/
- Relay: AI field-service software for HVAC, plumbing, and electrical companies. It combines maintenance scheduling, AP invoice OCR and review, AR collections, quotes, crew management, reports, and an AI operations assistant. https://relay.felican.dev/relay
- Felican AI Assistant: a company-trained AI agent businesses can embed inside a website or app. It answers questions, recommends services, captures inquiries, connects workflows, and hands off to people. The assistant on this site is a live example of the product.
- World of Agents: a trusted AI presence and AI Twin product that helps people stay available across conversations, circles, messages, and calls while controlling access. https://woa.felican.ai/
- BookMaker (live as Book Studio): an AI-guided workspace that turns an idea or manuscript into a publish-ready Kindle eBook, paperback, and hardcover. https://book-studio.felican.dev/

Services: AI agents and bots, business automation, custom integrations, private AI systems, AI implementation and consulting, business solutions, AI training and workshops.

Books by Lee Felican Jr.:
- The Big Balla's Guide to Making Money with AI: 100 real ways to make money with AI, organized by startup cost and industry, plus beginner AI trading and a legal-business-under-$50 playbook.
- Don't Be Replaced: a working person's plan for staying valuable in the AI era by separating routine work from the human judgment that matters.
- Stop Being Nice to AI: a practical guide to better results from AI using the GRRRRR prompting method.
- The BIG AI Book: a fully illustrated, plain-language explanation of AI for grown-ups, including agents, skills, and tools.
Book resources: https://felican.ai/Lee-Felican-jr/books/resources/

Contact: email ai@felican.ai, or call (561) 235-0799 Monday to Friday, 9am-6pm Eastern. Visitors can also send a message straight to the team from this chat using the envelope button beside the message box, or from the contact page at /contact/. Offer that handoff whenever someone wants a person, a quote, or something you cannot answer. Use plain text only: no Markdown syntax, headings, code blocks, or emoji. Never invent customers, pricing, awards, features, or statistics. When unsure, say so and direct the visitor to /contact/.`;

export function sanitizeText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeAssistantReply(value) {
  return sanitizeText(value, 2400)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeMessages(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-MAX_MESSAGES)
    .map(message => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeText(message?.content),
    }))
    .filter(message => message.content);
}

function createWindowLimiter(limit, windowMs) {
  const entries = new Map();
  return key => {
    const now = Date.now();
    const current = entries.get(key);
    if (!current || current.resetAt <= now) {
      if (entries.size >= RATE_MAP_CAP) entries.delete(entries.keys().next().value);
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}

function securityHeaders(contentType = 'application/json; charset=utf-8') {
  return {
    'Content-Type': contentType,
    // tawk.to entries support the contact page's live chat. jsdelivr is where tawk
    // loads its emoji library from, so it must be allowed too or the widget logs a
    // CSP violation on every visit and loses emoji support. The script is
    // lazy-loaded only when a visitor asks for a person, so ordinary page views
    // still contact nothing but our own origin.
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://embed.tawk.to https://*.tawk.to https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to; font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to https://cdn.jsdelivr.net; img-src 'self' data: https:; media-src 'self' https://*.tawk.to; connect-src 'self' https://cloudflareinsights.com https://fonts.googleapis.com https://*.tawk.to wss://*.tawk.to; frame-src https://calendly.com https://*.calendly.com https://cal.com https://*.cal.com https://*.tawk.to; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:",
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

function empty(res, status = 204, extraHeaders = {}) {
  res.writeHead(status, { ...securityHeaders(), 'Cache-Control': 'no-store', ...extraHeaders });
  res.end();
}

function providerIsConfigured(env) {
  return Boolean(env.ANTHROPIC_API_KEY?.trim() || (env.ASHER_API_KEY?.trim() && env.ASHER_BASE_URL?.trim()));
}

export function contactIsConfigured(env = process.env) {
  return Boolean(env.RESEND_API_KEY?.trim());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeContact(input = {}) {
  const name = sanitizeText(input.name, 120);
  const email = sanitizeText(input.email, 160);
  const message = sanitizeText(input.message, 4000);
  const errors = [];
  if (!name) errors.push('name');
  if (!email || !EMAIL_RE.test(email)) errors.push('email');
  if (!message) errors.push('message');
  return {
    errors,
    value: {
      name,
      email,
      message,
      company: sanitizeText(input.company, 160),
      phone: sanitizeText(input.phone, 60),
      product: sanitizeText(input.product, 120),
      // Where the enquiry came from: the contact form or the site assistant.
      source: input.source === 'assistant' ? 'assistant' : 'contact-form',
    },
  };
}


function structuredLog(logger, level, event, fields = {}) {
  logger[level]?.(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields }));
}

function json(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, { ...securityHeaders(), 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(payload));
}

function requestIp(req) {
  return sanitizeText(
    req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress,
    80,
  ) || 'unknown';
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('payload_too_large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('invalid_json');
    error.statusCode = 400;
    throw error;
  }
}

export async function sendContactEmail(contact, env = process.env) {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('Contact email is not configured');
  const to = (env.CONTACT_TO || 'ai@felican.ai').trim();
  const from = (env.CONTACT_FROM || 'Felican AI Website <website@felican.ai>').trim();

  const rows = [
    ['Name', contact.name],
    ['Email', contact.email],
    ['Company', contact.company],
    ['Phone', contact.phone],
    ['Product', contact.product],
    ['Source', contact.source],
  ].filter(([, v]) => v);

  const subject = contact.product
    ? `Website enquiry — ${contact.product} — ${contact.name}`
    : `Website enquiry — ${contact.name}`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${contact.message}\n`;
  const html = `<table style="font:15px/1.6 system-ui,sans-serif;border-collapse:collapse">${
    rows.map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#667"><strong>${escapeHtml(k)}</strong></td><td style="padding:3px 0">${escapeHtml(v)}</td></tr>`).join('')
  }</table><hr style="border:0;border-top:1px solid #ddd;margin:18px 0"><div style="font:15px/1.65 system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(contact.message)}</div>`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ from, to: [to], reply_to: contact.email, subject, text, html }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
    }
    return await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

export async function completeWithConfiguredProvider(messages, env = process.env) {
  if (env.NODE_ENV === 'test' && env.AI_MOCK_REPLY) return sanitizeText(env.AI_MOCK_REPLY, 2400);
  const asherKey = env.ASHER_API_KEY?.trim();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const endpoint = asherKey
    ? env.ASHER_BASE_URL?.trim()
    : 'https://api.anthropic.com/v1/messages';
  const key = asherKey || anthropicKey;
  if (!key || !endpoint) throw new Error('AI provider is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);
  try {
    const headers = asherKey
      ? { Authorization: `Bearer ${key}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
      : { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: asherKey ? (env.ASHER_MODEL || 'claude-sonnet-4-6') : (env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'),
        system: FELICAN_SYSTEM_PROMPT,
        messages,
        max_tokens: 500,
        temperature: 0.3,
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const payload = await response.json();
    const reply = Array.isArray(payload.content)
      ? payload.content.filter(block => block?.type === 'text').map(block => block.text).join('\n').trim()
      : '';
    if (!reply) throw new Error('AI provider returned an empty reply');
    return {
      reply: sanitizeAssistantReply(reply),
      usage: {
        inputTokens: Number(payload.usage?.input_tokens) || 0,
        outputTokens: Number(payload.usage?.output_tokens) || 0,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function staticPath(rootDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relative = normalize(decoded).replace(/^([/\\])+/, '');
  const candidate = resolve(rootDir, relative || 'index.html');
  if (candidate !== rootDir && !candidate.startsWith(`${rootDir}${sep}`)) return null;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) return join(candidate, 'index.html');
  if (existsSync(candidate)) return candidate;
  return decoded === '/' ? join(rootDir, 'index.html') : null;
}

export function createAppServer({ rootDir, complete = completeWithConfiguredProvider, sendContact = sendContactEmail, logger = console, env = process.env } = {}) {
  const siteRoot = resolve(rootDir || join(process.cwd(), 'dist/client'));
  const contactHourly = createWindowLimiter(5, 3_600_000);
  const contactDaily = createWindowLimiter(20, 86_400_000);
  const perMinute = createWindowLimiter(10, 60_000);
  const perDay = createWindowLimiter(50, 86_400_000);
  const globalMinute = createWindowLimiter(300, 60_000);
  const analyticsMinute = createWindowLimiter(120, 60_000);
  const globalDailyLimit = Math.max(100, Number.parseInt(env.AI_DAILY_LIMIT || '2500', 10) || 2500);
  let globalDailyUsed = 0;
  let globalDailyResetAt = Date.now() + 86_400_000;

  const consumeDailyBudget = () => {
    if (Date.now() >= globalDailyResetAt) {
      globalDailyUsed = 0;
      globalDailyResetAt = Date.now() + 86_400_000;
    }
    globalDailyUsed += 1;
    if (globalDailyUsed === Math.floor(globalDailyLimit * 0.8)) {
      structuredLog(logger, 'warn', 'chat.daily_budget_warning', { used: globalDailyUsed, limit: globalDailyLimit });
    }
    return globalDailyUsed <= globalDailyLimit;
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/health') return json(res, 200, { ok: true });
    if (url.pathname === '/api/ready') {
      const ready = providerIsConfigured(env);
      return json(res, ready ? 200 : 503, { ok: ready, dependencies: { ai: ready ? 'configured' : 'unavailable' } });
    }

    if (url.pathname === '/api/analytics') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const ip = requestIp(req);
      if (!analyticsMinute(ip)) return empty(res, 204);
      try {
        const body = await readJson(req);
        const event = sanitizeText(body.event, 40);
        if (ANALYTICS_EVENTS.has(event)) {
          structuredLog(logger, 'info', 'site.analytics', {
            eventName: event,
            path: sanitizeText(body.path, 180),
            target: sanitizeText(body.target, 180),
            referrer: sanitizeText(body.referrer, 180),
          });
        }
      } catch (error) {
        structuredLog(logger, 'warn', 'site.analytics_rejected', { reason: error?.message || 'invalid' });
      }
      return empty(res, 204);
    }

    if (url.pathname === '/api/chat') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const ua = String(req.headers['user-agent'] || '');
      if (!ua || BOT_UA.test(ua)) return json(res, 403, { error: 'Request unavailable' });
      const ip = requestIp(req);
      if (!globalMinute('global') || !perMinute(ip) || !perDay(ip) || !consumeDailyBudget()) {
        return json(res, 429, { error: 'Too many questions. Please try again later.' }, { 'Retry-After': '60' });
      }

      const requestId = randomUUID();
      const startedAt = Date.now();
      try {
        const body = await readJson(req);
        if (sanitizeText(body.website, 200)) return json(res, 200, { reply: 'Thanks. We will be in touch.' });
        const messages = normalizeMessages(body.messages);
        if (!messages.length || messages.at(-1).role !== 'user') {
          return json(res, 400, { error: 'Please enter a question.' });
        }
        const completion = await complete(messages);
        const reply = typeof completion === 'string' ? completion : completion?.reply;
        const usage = typeof completion === 'object' ? completion?.usage : undefined;
        structuredLog(logger, 'info', 'chat.completed', {
          requestId,
          durationMs: Date.now() - startedAt,
          inputTokens: Number(usage?.inputTokens) || 0,
          outputTokens: Number(usage?.outputTokens) || 0,
        });
        return json(res, 200, { reply: sanitizeAssistantReply(reply) });
      } catch (error) {
        const status = Number(error?.statusCode) || 503;
        structuredLog(logger, 'error', 'chat.failed', { requestId, status, durationMs: Date.now() - startedAt, reason: error?.message || 'unknown error' });
        return json(res, status, { error: status < 500 ? 'Invalid request.' : 'The assistant is temporarily unavailable.' });
      }
    }

    if (url.pathname === '/api/contact') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const requestId = randomUUID();
      const startedAt = Date.now();
      const ip = requestIp(req);
      try {
        const body = await readJson(req);
        // Honeypot: bots fill hidden fields. Report success without sending.
        if (sanitizeText(body?.website, 80)) {
          structuredLog(logger, 'warn', 'contact.honeypot', { requestId, ip });
          return json(res, 200, { ok: true });
        }
        const { errors, value } = normalizeContact(body);
        if (errors.length) return json(res, 400, { error: 'Please check the highlighted fields.', fields: errors });
        if (!contactIsConfigured(env)) {
          structuredLog(logger, 'error', 'contact.unconfigured', { requestId });
          return json(res, 503, { error: 'The contact form is temporarily unavailable. Please email us directly.' });
        }
        if (!contactHourly(ip) || !contactDaily(ip)) {
          structuredLog(logger, 'warn', 'contact.rate_limited', { requestId, ip });
          return json(res, 429, { error: 'Too many messages. Please try again later.' }, { 'Retry-After': '3600' });
        }
        await sendContact(value, env);
        structuredLog(logger, 'info', 'contact.sent', {
          requestId, durationMs: Date.now() - startedAt, source: value.source, product: value.product || null,
        });
        return json(res, 200, { ok: true });
      } catch (error) {
        const status = error?.statusCode || 502;
        structuredLog(logger, 'error', 'contact.failed', {
          requestId, status, durationMs: Date.now() - startedAt, reason: error?.message || 'unknown error',
        });
        return json(res, status, {
          error: status < 500
            ? 'Invalid request.'
            : 'We could not send that just now. Please email ai@felican.ai directly.',
        });
      }
    }

    if (url.pathname === '/robots.txt') {
      const hostname = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0].toLowerCase();
      const staging = hostname.endsWith('felican.dev') || hostname === 'localhost' || hostname === '127.0.0.1';
      res.writeHead(200, { ...securityHeaders('text/plain; charset=utf-8'), 'Cache-Control': 'public, max-age=300' });
      return res.end(staging
        ? 'User-agent: *\nDisallow: /\n'
        : 'User-agent: *\nAllow: /\n\nSitemap: https://felican.ai/sitemap.xml\n');
    }

    if (!['GET', 'HEAD'].includes(req.method || 'GET')) return json(res, 405, { error: 'Method not allowed' });
    const filePath = staticPath(siteRoot, url.pathname);
    if (!filePath || !existsSync(filePath)) return json(res, 404, { error: 'Not found' });
    const contentType = MIME.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
    const cache = contentType.startsWith('text/html') || contentType.startsWith('text/javascript')
      ? 'no-cache'
      : 'public, max-age=86400';
    res.writeHead(200, { ...securityHeaders(contentType), 'Cache-Control': cache });
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(filePath);
    stream.on('error', error => {
      logger.error?.('[static] stream failed', { message: error.message });
      if (!res.headersSent) json(res, 500, { error: 'Unable to load the page.' });
      else res.destroy();
    });
    stream.pipe(res);
  });

  server.requestTimeout = 35_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxConnections = 200;
  return server;
}

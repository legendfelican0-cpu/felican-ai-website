import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

const BOT_UA = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman|insomnia|java\/|go-http|php\/|ruby|perl|libwww|mechanize|scrapy|phantomjs|headless|selenium|puppeteer|playwright/i;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_LENGTH = 800;
const MAX_MESSAGES = 10;
const RATE_MAP_CAP = 10_000;

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

export const FELICAN_SYSTEM_PROMPT = `You are the Felican AI website assistant. Be clear, brief, friendly, and honest. Answer in 2-4 short sentences unless the visitor asks for detail.

Felican AI builds useful AI products, custom systems, business automations, integrations, assistants, solutions, and training for businesses in any industry. It is led by Lee Felican Jr., a software engineer and enterprise architect with 30+ years of experience.

Products and official links:
- Felican Auto: an AI voice and web assistant for dealerships that answers calls and chats, uses live inventory, books test drives, and captures leads. https://auto.felican.ai/
- Felican AI Assistant: a company-trained website assistant like this one. It answers questions, recommends the right service, and captures inquiries. Visitors can ask about it on this site or contact Felican AI.
- World of Agents: a trusted AI presence and AI Twin product that helps people stay available across conversations, circles, messages, and calls while controlling access. https://woa.felican.ai/
- BookMaker (live as Book Studio): an AI-guided workspace that turns an idea or manuscript into a publish-ready Kindle eBook, paperback, and hardcover. https://book-studio.felican.dev/
- Marketer (live as BookMarketer): an autonomous book marketing engine for approvals, content, outreach, and metrics. https://book-marketer.felican.dev/

Services: AI agents and bots, business automation, custom integrations, private AI systems, AI implementation and consulting, business solutions, AI training and workshops.

Books by Lee Felican Jr.:
- The Big Balla's Guide to Making Money with AI: 100 real ways to make money with AI, organized by startup cost and industry, plus beginner AI trading and a legal-business-under-$50 playbook.
- Don't Be Replaced: a working person's plan for staying valuable in the AI era by separating routine work from the human judgment that matters.
- Stop Being Nice to AI: a practical guide to better results from AI using the GRRRRR prompting method.
- The BIG AI Book: a fully illustrated, plain-language explanation of AI for grown-ups, including agents, skills, and tools.
Book resources: https://felican.ai/Lee-Felican-jr/books/resources/

Contact: +1 (346) 515-0361 and privateaiglobal@gmail.com. Never describe or speculate about what technology answers the phone. Never invent customers, pricing, awards, features, or statistics. When unsure, say so and direct the visitor to /contact/.`;

export function sanitizeText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
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
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
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
    return reply.slice(0, 2400);
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
  return join(rootDir, 'index.html');
}

export function createAppServer({ rootDir, complete = completeWithConfiguredProvider, logger = console } = {}) {
  const siteRoot = resolve(rootDir || join(process.cwd(), 'dist/client'));
  const perMinute = createWindowLimiter(10, 60_000);
  const perDay = createWindowLimiter(50, 86_400_000);
  const globalMinute = createWindowLimiter(300, 60_000);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/health') return json(res, 200, { ok: true });

    if (url.pathname === '/api/chat') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const ua = String(req.headers['user-agent'] || '');
      if (!ua || BOT_UA.test(ua)) return json(res, 403, { error: 'Request unavailable' });
      const ip = requestIp(req);
      if (!globalMinute('global') || !perMinute(ip) || !perDay(ip)) {
        return json(res, 429, { error: 'Too many questions. Please try again later.' }, { 'Retry-After': '60' });
      }

      try {
        const body = await readJson(req);
        if (sanitizeText(body.website, 200)) return json(res, 200, { reply: 'Thanks. We will be in touch.' });
        const messages = normalizeMessages(body.messages);
        if (!messages.length || messages.at(-1).role !== 'user') {
          return json(res, 400, { error: 'Please enter a question.' });
        }
        const reply = await complete(messages);
        return json(res, 200, { reply: sanitizeText(reply, 2400) });
      } catch (error) {
        const status = Number(error?.statusCode) || 503;
        logger.error?.('[chat] request failed', { status, message: error?.message || 'unknown error' });
        return json(res, status, { error: status < 500 ? 'Invalid request.' : 'The assistant is temporarily unavailable.' });
      }
    }

    if (!['GET', 'HEAD'].includes(req.method || 'GET')) return json(res, 405, { error: 'Method not allowed' });
    const filePath = staticPath(siteRoot, url.pathname);
    if (!filePath || !existsSync(filePath)) return json(res, 404, { error: 'Not found' });
    const contentType = MIME.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
    const cache = contentType.startsWith('text/html') ? 'no-cache' : 'public, max-age=86400';
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

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

import {
  checkoutIsConfigured,
  createCheckoutSession,
  fetchOrder,
  normalizeOrder,
  orderFromCheckoutSession,
  sendWelcomeEmail as sendWelcomeEmailDefault,
  stripeWebhookIsConfigured,
  verifyStripeWebhook,
} from './checkout.js';
import { createFileOrderStore } from './orders.js';

const BOT_UA = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman|insomnia|java\/|go-http|php\/|ruby|perl|libwww|mechanize|scrapy|phantomjs|headless|selenium|puppeteer|playwright/i;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const MAX_MESSAGE_LENGTH = 800;
const MAX_MESSAGES = 10;
const RATE_MAP_CAP = 10_000;
const COPS_VOICE_BUNDLE_URL = 'https://cops-website.felican.dev/voice-client.bundle.js';
const COPS_VOICE_BUNDLE_SHA384 = 'sha384-om2+KCCsCWb4oslvQoDmevbN/xaXx9cMxSf4Prw1kdgEFYKx2kOwJqWqDmhG8fKc';
const MAX_VOICE_BUNDLE_BYTES = 1024 * 1024;
const ANALYTICS_EVENTS = new Set(['page_view', 'contact_click', 'product_click', 'assistant_open']);
const EDUCATION_GUIDES = new Map([
  ['12-ways-ai-can-help-your-business', { title: '12 Ways AI Can Help Your Business', url: 'https://felican.ai/ebooks/12-ways-ai-can-help-your-business' }],
  ['ai-starter-pack-for-kids-teens-and-adults', { title: 'AI Starter Pack for Kids, Teens, and Adults', url: 'https://felican.ai/ebooks/ai-starter-pack-for-kids-teens-and-adults' }],
  ['ai-for-entrepreneurs', { title: 'AI for Entrepreneurs', url: 'https://felican.ai/ebooks/ai-for-entrepreneurs' }],
  ['no-more-excuses-12-ai-side-hustles', { title: 'No More Excuses — 12 AI Side Hustles', url: 'https://felican.ai/ebooks/no-more-excuses-12-ai-side-hustles' }],
  ['ai-start-here', { title: 'Start Here: 1 Hour AI', url: 'https://ebooks.felican.dev/ebooks/ai-start-here' }],
]);

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
  ['.wav', 'audio/wav'],
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

Services: AI agents and bots, business automation, custom integrations, private AI systems, AI implementation and consulting, business solutions, AI training and workshops.

Education: the /education/ page includes Felican AI eBooks, books by Lee Felican Jr., upcoming courses, Tiny Techs for early learners, nonprofit partnerships, school partnerships, and corporate training. After a visitor enters an email address or phone number, open the specific eBook they selected.

Books by Lee Felican Jr.:
- The Big Balla's Guide to Making Money with AI: 100 real ways to make money with AI, organized by startup cost and industry, plus beginner AI trading and a legal-business-under-$50 playbook.
- Don't Be Replaced: a working person's plan for staying valuable in the AI era by separating routine work from the human judgment that matters.
- Stop Being Nice to AI: a practical guide to better results from AI using the GRRRRR prompting method.
- The BIG AI Book: a fully illustrated, plain-language explanation of AI for grown-ups, including agents, skills, and tools.
Book resources: https://felican.ai/Lee-Felican-jr/books/resources/

Contact: email ai@felican.ai, or call (561) 235-0799 Monday to Friday, 9am-6pm Eastern. Visitors can also send a message straight to the team from this chat using the envelope button beside the message box, or from the contact page at /contact/. Offer that handoff whenever someone wants a person, a quote, or something you cannot answer. Always spell the company name exactly “Felican AI” in visible text—never Felikan, Fell-ih-can, or Falcon AI. Always spell the name “Ballas” with two l's and a final s. Use plain text only: no Markdown syntax, headings, code blocks, or emoji. Never invent customers, pricing, awards, features, or statistics. When unsure, say so and direct the visitor to /contact/.`;

export function sanitizeText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeAssistantReply(value) {
  return sanitizeText(value, 2400)
    .replace(/\b(?:Felikan|Fell[- ]?ih[- ]?can)\b/gi, 'Felican')
    .replace(/\bFalcon AI\b/gi, 'Felican AI')
    .replace(/\bBalas\b/gi, 'Ballas')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function voiceBundleIntegrity(value) {
  return `sha384-${createHash('sha384').update(value).digest('base64')}`;
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
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://embed.tawk.to https://*.tawk.to https://cdn.jsdelivr.net https://esm.sh https://*.daily.co https://*.dailywebrtc.com https://*.dailywebrtc.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to; font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to https://cdn.jsdelivr.net; img-src 'self' data: https:; media-src 'self' blob: https://*.tawk.to https://*.daily.co; connect-src 'self' https://cloudflareinsights.com https://fonts.googleapis.com https://*.tawk.to wss://*.tawk.to https://esm.sh https://api.vapi.ai https://*.vapi.ai wss://*.vapi.ai https://*.daily.co wss://*.daily.co; worker-src 'self' blob:; frame-src https://calendly.com https://*.calendly.com https://cal.com https://*.cal.com https://*.tawk.to; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:",
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
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

function siteOrigin(req, env = process.env) {
  const configured = env.SITE_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'felican.ai').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  return `${local ? 'http' : proto}://${host}`;
}

async function readBody(req, maxBytes = MAX_BODY_BYTES) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error('payload_too_large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  try {
    return JSON.parse((await readBody(req, maxBytes)).toString('utf8') || '{}');
  } catch (cause) {
    if (cause?.statusCode) throw cause;
    const error = new Error('invalid_json');
    error.statusCode = 400;
    throw error;
  }
}

function secretsMatch(received, expected) {
  const left = Buffer.from(String(received || ''));
  const right = Buffer.from(String(expected || ''));
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

function openAiChunk(id, created, delta, finishReason = null) {
  return {
    id,
    object: 'chat.completion.chunk',
    created,
    model: 'felican-voice',
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
}

function normalizeEducationLead(body) {
  const guideId = sanitizeText(body.guideId, 100);
  const email = sanitizeText(body.email, 254).toLowerCase();
  const phone = sanitizeText(body.phone, 40);
  const phoneDigits = phone.replace(/\D/g, '');
  if (!EDUCATION_GUIDES.has(guideId)) return { error: 'Please choose a guide.' };
  if (!email && !phone) return { error: 'Enter an email address or phone number.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (phone && (phoneDigits.length < 10 || phoneDigits.length > 15)) return { error: 'Enter a valid phone number.' };
  if (body.consent !== true) return { error: 'Please confirm that Felican AI may contact you about this request.' };
  return {
    lead: {
      guideId,
      guideTitle: EDUCATION_GUIDES.get(guideId).title,
      guideUrl: EDUCATION_GUIDES.get(guideId).url,
      email,
      phone,
      phoneE164: phone ? `+${phoneDigits.length === 10 ? `1${phoneDigits}` : phoneDigits}` : '',
      submittedAt: new Date().toISOString(),
    },
  };
}

const EDUCATION_CONSENT_TEXT = 'I agree that Felican AI may email or text me the requested eBook. If I provide a mobile number, I consent to one automated text per request. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.';
async function requireOk(response, label) {
  if (!response.ok) throw new Error(`${label} returned ${response.status}`);
  return response;
}

export async function deliverEducationLead(lead, env = process.env, fetchImpl = fetch) {
  const webhookUrl = env.EDUCATION_LEADS_WEBHOOK_URL?.trim();
  const resendKey = env.RESEND_API_KEY?.trim();
  const resendFrom = env.EDUCATION_LEADS_FROM?.trim();
  const relayUrl = env.IMESSAGE_RELAY_URL?.trim() || 'https://imessage.felican.ai/send';
  const relayToken = env.IMESSAGE_RELAY_TOKEN?.trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const deliveries = [];
    if (webhookUrl) {
      const parsed = new URL(webhookUrl);
      if (parsed.protocol !== 'https:') throw new Error('Education lead webhook must use HTTPS');
      deliveries.push(fetchImpl(parsed, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(env.EDUCATION_LEADS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env.EDUCATION_LEADS_WEBHOOK_TOKEN}` } : {}),
        },
        body: JSON.stringify({ event: 'education.guide_requested', consentText: EDUCATION_CONSENT_TEXT, ...lead }),
      }).then(response => requireOk(response, 'Education lead webhook')));
    } else if (resendKey && resendFrom) {
      const to = env.EDUCATION_LEADS_TO?.trim() || 'ai@felican.ai';
      const contact = [lead.email && `Email: ${lead.email}`, lead.phone && `Phone: ${lead.phone}`].filter(Boolean).join('\n');
      deliveries.push(fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject: `Felican AI eBook request — ${lead.guideTitle}`,
          text: `A visitor requested an eBook.\n\nTitle: ${lead.guideTitle}\n${contact}\nSubmitted: ${lead.submittedAt}\nSource IP: ${lead.sourceIp || 'unavailable'}\nConsent: ${EDUCATION_CONSENT_TEXT}`,
        }),
      }).then(response => requireOk(response, 'Education lead notification')));
    } else {
      throw new Error('Education lead delivery is not configured');
    }

    if (lead.email) {
      if (!resendKey || !resendFrom) throw new Error('Education email delivery is not configured');
      deliveries.push(fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resendFrom,
          to: [lead.email],
          subject: `Your Felican AI eBook — ${lead.guideTitle}`,
          text: `Your Felican AI eBook access is ready.\n\n${lead.guideTitle}\n${lead.guideUrl}\n\nOpen your selected interactive eBook online.\n\nFelican AI\nai@felican.ai`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1828"><p>Your Felican AI eBook access is ready.</p><h1 style="font-size:26px">${escapeHtml(lead.guideTitle)}</h1><p><a href="${escapeHtml(lead.guideUrl)}" style="display:inline-block;padding:13px 18px;background:#1768e5;color:#fff;text-decoration:none;font-weight:700">Open your eBook</a></p><p>Read your selected interactive Felican AI eBook online.</p><p>Felican AI<br><a href="mailto:ai@felican.ai">ai@felican.ai</a></p></div>`,
        }),
      }).then(response => requireOk(response, 'Education email delivery')));
    }

    if (lead.phoneE164) {
      if (!relayToken) throw new Error('Education text delivery is not configured');
      const parsedRelay = new URL(relayUrl);
      if (parsedRelay.protocol !== 'https:') throw new Error('Education text relay must use HTTPS');
      deliveries.push(fetchImpl(parsedRelay, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${relayToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.phoneE164,
          text: `Felican AI: Your eBook access for “${lead.guideTitle}” is ready: ${lead.guideUrl} Message and data rates may apply. Reply STOP to opt out, HELP for help.`,
        }),
      }).then(response => requireOk(response, 'Education text delivery')));
    }

    await Promise.all(deliveries);
  } finally {
    clearTimeout(timeout);
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

export function createAppServer({
  rootDir,
  complete = completeWithConfiguredProvider,
  sendContact = sendContactEmail,
  deliverLead,
  voiceBundleFetch = fetch,
  voiceBundleIntegrityExpected = COPS_VOICE_BUNDLE_SHA384,
  sendWelcome = sendWelcomeEmailDefault,
  lookupOrder = fetchOrder,
  orderStore,
  logger = console,
  env = process.env,
} = {}) {
  const siteRoot = resolve(rootDir || join(process.cwd(), 'dist/client'));
  const paidOrders = orderStore || createFileOrderStore(
    env.ORDER_STORE_PATH?.trim() || join(process.cwd(), 'data', 'starter-pack-orders.json'),
  );
  const contactHourly = createWindowLimiter(5, 3_600_000);
  const contactDaily = createWindowLimiter(20, 86_400_000);
  const perMinute = createWindowLimiter(10, 60_000);
  const perDay = createWindowLimiter(50, 86_400_000);
  const globalMinute = createWindowLimiter(300, 60_000);
  const analyticsMinute = createWindowLimiter(120, 60_000);
  const educationMinute = createWindowLimiter(5, 60_000);
  const educationDay = createWindowLimiter(30, 86_400_000);
  const educationGlobalMinute = createWindowLimiter(200, 60_000);
  const voiceMinute = createWindowLimiter(60, 60_000);
  const checkoutHourly = createWindowLimiter(10, 3_600_000);
  const orderMinute = createWindowLimiter(20, 60_000);
  const welcomeInFlight = new Map();
  const globalDailyLimit = Math.max(100, Number.parseInt(env.AI_DAILY_LIMIT || '2500', 10) || 2500);
  let globalDailyUsed = 0;
  let globalDailyResetAt = Date.now() + 86_400_000;
  let voiceBundleCache = null;

  const getVoiceBundle = async () => {
    if (voiceBundleCache) return voiceBundleCache;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await voiceBundleFetch(COPS_VOICE_BUNDLE_URL, {
        signal: controller.signal,
        headers: { Accept: 'text/javascript', 'User-Agent': 'felican-site-voice-sync/1.0' },
      });
      if (!response.ok) throw new Error(`COPS voice client returned ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > MAX_VOICE_BUNDLE_BYTES) throw new Error('COPS voice client size is invalid');
      const integrity = voiceBundleIntegrity(bytes);
      if (integrity !== voiceBundleIntegrityExpected) throw new Error('COPS voice client integrity check failed');
      voiceBundleCache = bytes;
      structuredLog(logger, 'info', 'voice.client_cached', { bytes: bytes.length, integrity });
      return voiceBundleCache;
    } finally {
      clearTimeout(timeout);
    }
  };

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

  const fulfillPaidOrder = (order, req, requestId, trigger) => {
    if (welcomeInFlight.has(order.id)) return welcomeInFlight.get(order.id);
    const work = (async () => {
      const saved = await paidOrders.upsertPaid(order);
      if (!order.email || saved.welcomeSentAt) return saved;

      // Send buyers to the generator app, which verifies the order and emails
      // their personal setup link. Overridable so dev/prod can diverge.
      const generatorBase = (env.GENERATOR_APP_URL || 'https://app.felican.dev').replace(/\/$/, '');
      const setupUrl = `${generatorBase}/claim?order=${encodeURIComponent(order.id)}`;
      const result = await sendWelcome({ ...order, setupUrl }, env);
      const completed = await paidOrders.markWelcomeSent(order.id, { resendId: result?.id || null });
      structuredLog(logger, 'info', 'welcome.sent', { requestId, sessionId: order.id, trigger });
      return completed;
    })().finally(() => welcomeInFlight.delete(order.id));
    welcomeInFlight.set(order.id, work);
    return work;
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/health') return json(res, 200, { ok: true });
    if (url.pathname === '/api/ready') {
      const ready = providerIsConfigured(env);
      return json(res, ready ? 200 : 503, { ok: ready, dependencies: { ai: ready ? 'configured' : 'unavailable' } });
    }

    if (url.pathname === '/api/voice-config') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
      const publicKey = sanitizeText(env.FELICAN_VAPI_PUBLIC_KEY, 160);
      const assistantId = sanitizeText(env.FELICAN_VAPI_ASSISTANT_ID, 160);
      if (!publicKey || !assistantId) return json(res, 200, { enabled: false });
      return json(res, 200, { enabled: true, publicKey, assistantId });
    }

    if (url.pathname === '/voice-client.bundle.js') {
      if (!['GET', 'HEAD'].includes(req.method || 'GET')) return json(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' });
      try {
        const bundle = await getVoiceBundle();
        res.writeHead(200, {
          ...securityHeaders('text/javascript; charset=utf-8'),
          'Cache-Control': 'public, max-age=14400, must-revalidate',
          'Content-Length': bundle.length,
          ETag: `"${voiceBundleIntegrityExpected}"`,
        });
        return req.method === 'HEAD' ? res.end() : res.end(bundle);
      } catch (error) {
        structuredLog(logger, 'error', 'voice.client_failed', { reason: error?.message || 'unknown error' });
        return json(res, 502, { error: 'Voice client is temporarily unavailable.' });
      }
    }

    if (url.pathname === '/v1/chat/completions') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      if (!secretsMatch(req.headers['x-vapi-secret'], env.FELICAN_VAPI_WEBHOOK_SECRET)) {
        return json(res, 401, { error: 'Unauthorized' });
      }
      const ip = requestIp(req);
      if (!voiceMinute(ip) || !consumeDailyBudget()) {
        return json(res, 429, { error: 'Too many voice requests.' }, { 'Retry-After': '60' });
      }
      const requestId = randomUUID();
      const startedAt = Date.now();
      try {
        const body = await readJson(req, 64 * 1024);
        const messages = normalizeMessages(body.messages);
        if (!messages.length || messages.at(-1).role !== 'user') {
          return json(res, 400, { error: 'A user message is required.' });
        }
        const completion = await complete(messages);
        const reply = sanitizeAssistantReply(typeof completion === 'string' ? completion : completion?.reply);
        if (!reply) throw new Error('empty_voice_reply');
        const id = `chatcmpl-${requestId}`;
        const created = Math.floor(Date.now() / 1000);
        res.writeHead(200, {
          ...securityHeaders('text/event-stream; charset=utf-8'),
          'Cache-Control': 'no-cache, no-store',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        res.write(`data: ${JSON.stringify(openAiChunk(id, created, { role: 'assistant' }))}\n\n`);
        res.write(`data: ${JSON.stringify(openAiChunk(id, created, { content: reply }))}\n\n`);
        res.write(`data: ${JSON.stringify(openAiChunk(id, created, {}, 'stop'))}\n\n`);
        res.end('data: [DONE]\n\n');
        structuredLog(logger, 'info', 'voice.completed', { requestId, durationMs: Date.now() - startedAt });
      } catch (error) {
        const status = Number(error?.statusCode) || 503;
        structuredLog(logger, 'error', 'voice.failed', { requestId, status, durationMs: Date.now() - startedAt, reason: error?.message || 'unknown error' });
        if (!res.headersSent) return json(res, status, { error: status < 500 ? 'Invalid request.' : 'Voice is temporarily unavailable.' });
        res.end();
      }
      return;
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

    const legacyEbookMatch = url.pathname.match(/^\/ebooks\/([^/]+)\/?$/);
    if (req.method === 'GET' && legacyEbookMatch && EDUCATION_GUIDES.has(legacyEbookMatch[1])) {
      const guide = EDUCATION_GUIDES.get(legacyEbookMatch[1]);
      res.writeHead(302, { Location: guide.url, 'Cache-Control': 'no-store' });
      res.end();
      return;
    }

    if (url.pathname === '/api/education-interest') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const ua = String(req.headers['user-agent'] || '');
      if (!ua || BOT_UA.test(ua)) return json(res, 403, { error: 'Request unavailable' });
      const ip = requestIp(req);
      if (!educationGlobalMinute('global') || !educationMinute(ip) || !educationDay(ip)) {
        return json(res, 429, { error: 'Too many requests. Please try again later.' }, { 'Retry-After': '60' });
      }
      const requestId = randomUUID();
      try {
        const body = await readJson(req);
        if (sanitizeText(body.website, 200)) return json(res, 200, { ok: true });
        const normalized = normalizeEducationLead(body);
        if (normalized.error) return json(res, 400, { error: normalized.error });
        const lead = { ...normalized.lead, sourceIp: ip, consentText: EDUCATION_CONSENT_TEXT };
        await (deliverLead || (value => deliverEducationLead(value, env)))(lead);
        structuredLog(logger, 'info', 'education.ebook_requested', {
          requestId,
          guideId: lead.guideId,
          contactMethod: lead.email && lead.phone ? 'email_and_phone' : lead.email ? 'email' : 'phone',
        });
        return json(res, 200, { ok: true, guideUrl: lead.guideUrl });
      } catch (error) {
        const status = Number(error?.statusCode) || 503;
        structuredLog(logger, 'error', 'education.ebook_request_failed', { requestId, status, reason: error?.message || 'unknown error' });
        return json(res, status, { error: status < 500 ? 'Invalid request.' : 'We could not send access right now. Please email us and we will help.' });
      }
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

    if (url.pathname === '/api/stripe-webhook') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const requestId = randomUUID();
      try {
        if (!stripeWebhookIsConfigured(env)) {
          structuredLog(logger, 'error', 'stripe_webhook.unconfigured', { requestId });
          return json(res, 503, { error: 'Webhook is not configured.' });
        }
        const rawBody = await readBody(req, MAX_WEBHOOK_BODY_BYTES);
        const event = verifyStripeWebhook(rawBody, req.headers['stripe-signature'], env);
        if (event.type !== 'checkout.session.completed') return json(res, 200, { received: true });

        const order = orderFromCheckoutSession(event.data?.object);
        if (!order) {
          structuredLog(logger, 'warn', 'stripe_webhook.ignored', {
            requestId, eventId: sanitizeText(event.id, 120), reason: 'not_a_paid_starter_pack_order',
          });
          return json(res, 200, { received: true });
        }
        await fulfillPaidOrder(order, req, requestId, 'webhook');
        structuredLog(logger, 'info', 'stripe_webhook.completed', {
          requestId, eventId: sanitizeText(event.id, 120), sessionId: order.id,
        });
        return json(res, 200, { received: true });
      } catch (error) {
        const status = error?.statusCode || 502;
        structuredLog(logger, 'error', 'stripe_webhook.failed', {
          requestId, status, reason: error?.message || 'unknown error',
        });
        return json(res, status, { error: status < 500 ? 'Invalid webhook.' : 'Webhook processing failed.' });
      }
    }

    if (url.pathname === '/api/checkout') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
      const requestId = randomUUID();
      const ip = requestIp(req);
      try {
        if (!checkoutIsConfigured(env)) {
          structuredLog(logger, 'error', 'checkout.unconfigured', { requestId });
          return json(res, 503, { error: 'Checkout is temporarily unavailable. Please email ai@felican.ai and we will take payment another way.' });
        }
        if (!checkoutHourly(ip)) {
          structuredLog(logger, 'warn', 'checkout.rate_limited', { requestId, ip });
          return json(res, 429, { error: 'Too many attempts. Please try again shortly.' }, { 'Retry-After': '600' });
        }
        const body = await readJson(req);
        const order = normalizeOrder(body);
        if (order.error) return json(res, 400, { error: order.error });

        const session = await createCheckoutSession({ ...order, origin: siteOrigin(req, env) }, env);
        structuredLog(logger, 'info', 'checkout.session_created', {
          requestId, sessionId: session.id, items: order.items.join(','), totalCents: order.totalCents,
        });
        return json(res, 200, { url: session.url });
      } catch (error) {
        const status = error?.statusCode || 502;
        structuredLog(logger, 'error', 'checkout.failed', { requestId, status, reason: error?.message || 'unknown error' });
        return json(res, status, {
          error: status < 500 ? 'We could not start that payment.' : 'Payments are briefly unavailable. Please try again in a moment.',
        });
      }
    }

    if (url.pathname === '/api/order') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
      const requestId = randomUUID();
      const ip = requestIp(req);
      try {
        if (!orderMinute(ip)) return json(res, 429, { error: 'Too many requests.' }, { 'Retry-After': '60' });
        const order = await lookupOrder(url.searchParams.get('session_id'), env);

        // Webhooks are primary; this remains a fallback for pre-webhook purchases.
        // Mail/storage failures never break the confirmation page the buyer is on.
        fulfillPaidOrder(order, req, requestId, 'thank-you').catch(error => {
          structuredLog(logger, 'error', 'welcome.failed', {
            requestId, sessionId: order.id, trigger: 'thank-you', reason: error?.message || 'unknown error',
          });
        });
        return json(res, 200, { items: order.items, total: order.total, email: order.email });
      } catch (error) {
        const status = error?.statusCode || 502;
        structuredLog(logger, 'warn', 'order.lookup_failed', { requestId, status, reason: error?.message || 'unknown error' });
        return json(res, status, { error: status < 500 ? 'We could not find that order.' : 'Please try again in a moment.' });
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

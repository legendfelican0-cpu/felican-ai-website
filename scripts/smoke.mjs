#!/usr/bin/env node

const target = new URL(process.argv[2] || 'https://felican.dev/');
const includeChat = process.argv.includes('--chat');

const checks = [
  ['/', 'AI solutions for'],
  ['/products/', 'Products built for real work.'],
  ['/services/', 'Seven ways we put AI to work inside a business'],
  ['/books/', 'Four books by Lee Felican Jr.'],
  ['/about/', 'A family-built company that builds AI for a living'],
  ['/contact/', "Let's talk about your business"],
  ['/booking/', 'Let’s talk about where AI can create leverage.'],
  ['/privacy/', 'Privacy Policy'],
  ['/terms/', 'Terms of Use'],
  ['/sitemap.xml', '<urlset'],
];

function log(level, event, fields = {}) {
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields })}\n`);
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const started = performance.now();
  try {
    const response = await fetch(new URL(path, target), { ...options, signal: controller.signal });
    const body = await response.text();
    return { response, body, durationMs: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timeout);
  }
}

let failed = false;
for (const [path, expected] of checks) {
  try {
    const { response, body, durationMs } = await request(path);
    const ok = response.ok && body.includes(expected);
    log(ok ? 'info' : 'error', 'smoke.route', { path, status: response.status, durationMs, ok });
    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    log('error', 'smoke.route', { path, ok: false, reason: error.message });
  }
}

for (const path of ['/api/health', '/api/ready']) {
  try {
    const { response, body, durationMs } = await request(path);
    const payload = JSON.parse(body);
    const ok = response.ok && payload.ok === true;
    log(ok ? 'info' : 'error', 'smoke.api', { path, status: response.status, durationMs, ok });
    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    log('error', 'smoke.api', { path, ok: false, reason: error.message });
  }
}

if (includeChat) {
  try {
    const { response, body, durationMs } = await request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 FelicanLaunchSmoke/1.0' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'In one sentence, what is the Felican AI Assistant?' }] }),
    });
    const payload = JSON.parse(body);
    const ok = response.ok && typeof payload.reply === 'string' && /website or app|website\/app|embed/i.test(payload.reply);
    log(ok ? 'info' : 'error', 'smoke.chat', { status: response.status, durationMs, ok });
    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    log('error', 'smoke.chat', { ok: false, reason: error.message });
  }
}

if (failed) process.exitCode = 1;
else log('info', 'smoke.complete', { target: target.origin, ok: true });

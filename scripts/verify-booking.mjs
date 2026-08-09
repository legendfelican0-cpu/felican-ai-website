#!/usr/bin/env node

import { constants as fsConstants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../server/app.js';

const projectRoot = resolve(import.meta.dirname, '..');
const screenshotPath = resolve(projectRoot, 'qa', 'booking-page.png');
const mobileScreenshotPath = resolve(projectRoot, 'qa', 'booking-page-mobile.png');
const logger = { error() {}, info() {}, warn() {} };
const server = createAppServer({
  rootDir: resolve(projectRoot, 'public'),
  env: {},
  logger,
});

function log(level, event, fields = {}) {
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields })}\n`);
}

async function listen() {
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer() {
  if (!server.listening) return;
  await new Promise(resolveClose => server.close(resolveClose));
}

async function browserLaunchOptions() {
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try {
    await access(chromePath, fsConstants.X_OK);
    return { headless: true, executablePath: chromePath };
  } catch {
    return { headless: true };
  }
}

let browser;
try {
  const origin = await listen();
  browser = await chromium.launch(await browserLaunchOptions());
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const response = await page.goto(`${origin}/booking/`, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`Booking page returned ${response?.status() || 'no response'}`);
  const policy = (await response.allHeaders())['content-security-policy'] || '';
  if (!policy.includes('frame-src https://calendly.com https://*.calendly.com')) {
    throw new Error('Booking page security policy does not allow the validated Calendly frame');
  }
  if (!(await page.getByRole('heading', { name: /where AI can create leverage/i }).isVisible())) {
    throw new Error('Booking headline is not visible');
  }
  if (!(await page.getByText('The calendar is being connected.').isVisible())) {
    throw new Error('Unconfigured Calendly fallback is not visible');
  }
  if (await page.locator('main form').count()) throw new Error('Booking page unexpectedly contains a local form');
  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
  if ((await page.evaluate(() => document.documentElement.scrollWidth)) > (await page.evaluate(() => document.documentElement.clientWidth))) {
    throw new Error('Booking page has horizontal overflow');
  }

  await mkdir(resolve(projectRoot, 'qa'), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
  });
  await mobile.goto(`${origin}/booking/`, { waitUntil: 'networkidle' });
  if ((await mobile.evaluate(() => document.documentElement.scrollWidth)) > (await mobile.evaluate(() => document.documentElement.clientWidth))) {
    throw new Error('Mobile booking page has horizontal overflow');
  }
  if (!(await mobile.getByRole('heading', { name: /where AI can create leverage/i }).isVisible())) {
    throw new Error('Mobile booking headline is not visible');
  }
  await mobile.screenshot({ path: mobileScreenshotPath, fullPage: true });

  const configured = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  });
  await configured.route('**/booking-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.FELICAN_BOOKING = Object.freeze({ calendlyUrl: 'https://calendly.com/felican-ai/test-event' });",
  }));
  await configured.route('https://calendly.com/**', route => route.abort());
  await configured.goto(`${origin}/booking/`, { waitUntil: 'domcontentloaded' });
  const calendlyLink = configured.getByRole('link', { name: /Open Calendly/i });
  if ((await calendlyLink.getAttribute('href')) !== 'https://calendly.com/felican-ai/test-event') {
    throw new Error('Configured Calendly link did not render correctly');
  }
  if ((await configured.locator('iframe[title="Book a call with Felican AI"]').count()) !== 1) {
    throw new Error('Configured Calendly iframe did not render');
  }

  log('info', 'booking.verify', { ok: true, screenshotPath, mobileScreenshotPath, configuredCalendly: true });
} catch (error) {
  log('error', 'booking.verify', { ok: false, reason: error.stack || error.message });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await closeServer();
}

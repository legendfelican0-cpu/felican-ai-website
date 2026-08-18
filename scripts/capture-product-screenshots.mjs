#!/usr/bin/env node
/** Capture the real UI from each local Felican product repository. */
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, '..');
const appsRoot = path.resolve(siteRoot, '..', 'felican-product-apps');

export const products = [
  { repo: 'felican-quorum', port: 3211, route: '/dashboard', output: 'product-quorum.png' },
  { repo: 'felican-floordesk', port: 3212, route: '/dashboard', output: 'product-floordesk.png' },
  { repo: 'felican-quantdesk', port: 3213, route: '/workspace', output: 'product-quantdesk.png' },
  { repo: 'felican-threadpilot', port: 3214, route: '/inbox', output: 'product-threadpilot.png' },
  { repo: 'felican-adpulse', port: 3215, route: '/dashboard', output: 'product-adpulse.png' },
  { repo: 'felican-dendrite', port: 3216, route: '/playground', output: 'product-dendrite.png' },
  // Ora's chat workspace is intentionally sign-in gated, so its real public
  // product surface is the honest screenshot target for the website catalog.
  { repo: 'felican-ora', port: 3217, route: '/', output: 'product-ora.png' },
  { repo: 'felican-mira', port: 3218, route: '/', output: 'product-mira.png' },
  { repo: 'felican-framefire', port: 3219, route: '/templates', output: 'product-framefire.png' },
  { repo: 'felican-lumina', port: 3220, route: '/studio', output: 'product-lumina.png' },
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer(url, child) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`app server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch { /* server is still compiling */ }
    await delay(600);
  }
  throw new Error(`app server did not become ready at ${url}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    delay(5_000),
  ]);
}

async function capture(browser, product) {
  const cwd = path.join(appsRoot, product.repo);
  const next = path.join(cwd, 'node_modules', '.bin', 'next');
  await access(next);
  const origin = `http://127.0.0.1:${product.port}`;
  console.info(`[capture] starting ${product.repo} at ${origin}`);
  const server = spawn(next, ['dev', '-p', String(product.port), '-H', '127.0.0.1'], {
    cwd,
    env: {
      ...process.env,
      PORT: String(product.port),
      NEXT_PUBLIC_BASE_PATH: '',
      NEXT_PUBLIC_APP_URL: origin,
      // Product preview mode must not inherit a developer's logged-in cloud
      // environment; these repos intentionally render safe demo data when
      // Supabase is absent.
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  try {
    await waitForServer(origin, server);
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(origin + product.route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    if (!response || response.status() >= 500) throw new Error(`page returned ${response?.status() ?? 'no response'}`);
    await page.waitForTimeout(1_800);
    if (/\/(login|signup)(?:\/|$)/.test(new URL(page.url()).pathname)) {
      throw new Error(`${product.route} redirected to authentication instead of rendering its app preview`);
    }
    const bodyText = (await page.locator('body').innerText()).trim();
    if (bodyText.length < 40) throw new Error('rendered page is blank or incomplete');
    const output = path.join(siteRoot, 'public', product.output);
    await page.screenshot({ path: output, type: 'png' });
    await page.close();
    if (errors.length) console.warn(`[capture] ${product.repo} page errors: ${errors.join(' | ')}`);
    console.info(`[capture] wrote ${product.output}`);
  } finally {
    await stopServer(server);
  }
}

async function main() {
  const requested = new Set(process.argv.slice(2).map(value => value.replace(/^felican-/, '')));
  const selected = requested.size
    ? products.filter(product => requested.has(product.repo.replace(/^felican-/, '')))
    : products;
  if (!selected.length) throw new Error(`no products matched: ${[...requested].join(', ')}`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const product of selected) await capture(browser, product);
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`[capture] failed: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}

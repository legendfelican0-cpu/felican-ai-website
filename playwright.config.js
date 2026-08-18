import { defineConfig, devices } from '@playwright/test';

const testPort = process.env.PLAYWRIGHT_PORT || '4273';
const testOrigin = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: testOrigin,
    trace: 'retain-on-failure',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
  },
  webServer: {
    command: `npm run build && PORT=${testPort} STATIC_ROOT=dist/client NODE_ENV=test AI_MOCK_REPLY="Felican AI builds products, custom systems, automations, integrations, and training for businesses." node server/index.js`,
    url: `${testOrigin}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// NOTE: use 'load', never 'networkidle'. The contact page holds a tawk.to
// WebSocket open, so the network never goes idle and networkidle times out at
// random. Playwright's auto-waiting assertions cover readiness instead.
const routes = [
  ['/', 'AI solutions for'],
  ['/products/', 'Products built for real work.'],
  ['/services/', 'Eleven ways we put AI to work inside a business'],
  ['/education/', 'AI learning that meets people where they are.'],
  ['/books/', 'Four books by Lee Felican Jr.'],
  ['/about/', 'A team of certified AI professionals who build AI for a living'],
  ['/contact/', "Let's talk about your business"],
  ['/booking/', 'Let’s talk about where AI can create leverage.'],
  ['/privacy/', 'Privacy Policy'],
  ['/terms/', 'Terms of Use'],
];

test.describe('Claude Design website export', () => {
  for (const [route, headline] of routes) {
    test(`${route} renders without browser errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route, { waitUntil: 'load' });

      await expect(page.locator('h1').first()).toContainText(headline);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('.fa-cred')).toBeVisible();
      // The runtime tags unresolved interpolations with .sc-missing. Waiting for
      // zero of them means the client render finished, so the console check and
      // the axe scan below see the real page rather than the placeholder skeleton.
      await expect(page.locator('.sc-missing')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
      expect(consoleErrors).toEqual([]);
      // Exclude embedded third-party frames: axe crawls into them, and the Cal.com
      // booking widget renders skeleton buttons with no accessible name. That is
      // their markup, not ours, and whether it has rendered yet is pure timing.
      const accessibility = await new AxeBuilder({ page })
        .exclude('iframe')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
    });
  }

  test('navigation, products, books, and assistant are functional', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'load' });
    const isMobile = testInfo.project.name.startsWith('mobile');

    if (isMobile) {
      await page.getByRole('button', { name: /toggle navigation menu/i }).click();
      await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Products', exact: true }).click();
    } else {
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Products', exact: true }).click();
    }
    await expect(page).toHaveURL(/\/products\/?$/);

    // Seven headline products, led by the flagship, then the agent bench.
    const productCards = page.locator('.product-card');
    await expect(productCards).toHaveCount(7);
    await expect(productCards.first()).toHaveAttribute('id', 'private-ai');
    await expect(page.locator('.agent-card')).toHaveCount(6);
    await expect(page.locator('.rest-card')).toHaveCount(5);

    // Products never link out to the live apps; every CTA pre-fills the contact form.
    const outbound = page.locator('main a[href^="http"]:not([href*="felican.ai/contact"])');
    for (const href of await outbound.evaluateAll(links => links.map(a => a.getAttribute('href')))) {
      expect(href).not.toMatch(/auto\.felican|woa\.felican|relay\.felican|book-studio/);
    }
    await expect(productCards.filter({ hasText: 'BookMaker' })).toHaveCount(0);

    await page.goto('/books/', { waitUntil: 'load' });
    const covers = page.locator('img[alt$=" cover"]');
    await expect(covers).toHaveCount(4);
    expect(await covers.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    // The Big Balla's Guide sits last, and buying goes to Amazon.
    await expect(covers.last()).toHaveAttribute('alt', /Big Balla/i);
    await expect(page.getByRole('link', { name: /View book on Amazon\.com/i }).first()).toHaveAttribute(
      'href',
      /^https:\/\/www\.amazon\.com\/dp\//,
    );

    await page.goto('/', { waitUntil: 'load' });
    await page.screenshot({ path: testInfo.outputPath(`homepage-${testInfo.project.name}.png`), fullPage: false });
    const assistantButton = page.locator('[data-assistant-launcher]');
    await expect(assistantButton).toHaveCount(1);
    await expect(assistantButton).toBeVisible();
    const launcherBox = await assistantButton.boundingBox();
    const viewport = page.viewportSize();
    expect(launcherBox.width).toBeGreaterThan(launcherBox.height * 2);
    expect(viewport.width - launcherBox.x - launcherBox.width).toBeLessThanOrEqual(isMobile ? 16 : 30);
    const credentialBox = await page.locator('.fa-cred').boundingBox();
    expect(launcherBox.y).toBeGreaterThanOrEqual(credentialBox.y - launcherBox.height - 22);
    expect(launcherBox.y + launcherBox.height).toBeLessThanOrEqual(credentialBox.y);
    await assistantButton.click();
    await expect(assistantButton).toHaveAttribute('aria-expanded', 'true');
    const assistantPanel = page.locator('.fa-panel');
    await expect(assistantPanel).toBeVisible();

    const input = page.getByRole('textbox', { name: 'Your message' });
    await input.fill('What does Felican AI build?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('log')).toContainText(
      'Felican AI builds products, custom systems, automations, integrations, and training for businesses.',
    );
  });

  test('Private AI carousel works and voice can be interrupted', async ({ page }) => {
    await page.addInitScript(() => {
      window.__speechTest = { spoken: [], cancels: 0 };
      window.SpeechSynthesisUtterance = class {
        constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; this.lang = ''; }
      };
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        cancel() { window.__speechTest.cancels += 1; },
        speak(utterance) { window.__speechTest.spoken.push(utterance.text); setTimeout(() => utterance.onstart?.(), 0); },
      } });
      window.SpeechRecognition = class {
        start() { this.onstart?.(); }
        stop() { this.onend?.(); }
        abort() { this.onend?.(); }
      };
    });

    await page.goto('/products/', { waitUntil: 'load' });
    await expect(page.locator('.pc-slide:visible img')).toHaveAttribute('src', '/private-ai-knowledge.png');
    await page.getByRole('button', { name: 'Next Private AI feature' }).click();
    await expect(page.locator('.pc-slide:visible img')).toHaveAttribute('src', '/private-ai-client-brief.png');

    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('button', { name: 'Start voice' }).click();
    await expect(page.getByRole('button', { name: 'Stop speaking' })).toBeVisible();
    await page.getByRole('button', { name: 'Stop speaking' }).click();
    expect(await page.evaluate(() => window.__speechTest.spoken)).toContain('Voice replies are on.');
    expect(await page.evaluate(() => window.__speechTest.cancels)).toBeGreaterThan(0);
  });

  test('contact page offers a working form alongside email and phone', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /ai@felican\.ai/i }).first()).toHaveAttribute('href', /mailto:ai@felican\.ai/);
    await expect(page.getByRole('link', { name: /\(561\) 235-0799/ }).first()).toHaveAttribute('href', 'tel:+15612350799');
    await expect(page.locator('main form.ct-form')).toHaveCount(1);
    // The retired address must not linger anywhere.
    expect(await page.content()).not.toContain('gmail.com');
  });

  test('booking page has a stable route and a live booking embed', async ({ page }) => {
    await page.goto('/booking/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: /where AI can create leverage/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open booking page/i })).toHaveAttribute('href', /^https:\/\/cal\.com\//);
  });

  test('legal, search, social, and analytics foundations are present', async ({ page }) => {
    await page.goto('/privacy/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]').first()).toHaveAttribute('href', 'https://felican.ai/privacy/');
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', 'https://felican.ai/og.png');

    const robots = await page.request.get('/robots.txt');
    expect(await robots.text()).toContain('Disallow: /');
    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain('<loc>https://felican.ai/products/</loc>');

    const analytics = await page.request.post('/api/analytics', { data: { event: 'page_view', path: '/privacy/' } });
    expect(analytics.status()).toBe(204);
  });

  test('homepage friction checklist is usable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const firstFriction = page.locator('.friction-input').first();
    await firstFriction.check();
    await expect(firstFriction).toBeChecked();
    await expect(page.getByText("selected — that's exactly what we help fix.")).toBeVisible();

    await page.locator('#cf-name').fill('Test User');
    await page.locator('#cf-message').fill('Testing the contact flow.');
    await expect(page.locator('#cf-name')).toHaveValue('Test User');
  });
});

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  ['/', 'We build the AI your business'],
  ['/products/', 'Products built for real work.'],
  ['/services/', 'Seven ways we put AI to work inside a business'],
  ['/books/', 'Four books by Lee Felican Jr.'],
  ['/about/', 'A family-built company that builds AI for a living'],
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
      await page.goto(route, { waitUntil: 'networkidle' });

      await expect(page.locator('h1').first()).toContainText(headline);
      await expect(page.locator('body')).not.toBeEmpty();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
      expect(consoleErrors).toEqual([]);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
    });
  }

  test('navigation, books, and assistant are functional', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: /toggle navigation menu/i }).click();
      await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Products', exact: true }).click();
    } else {
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Products', exact: true }).click();
    }
    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(page.locator('article[id]')).toHaveCount(5);

    const productCards = page.locator('article[id]');
    await expect(productCards.nth(0)).toHaveAttribute('id', 'felican-auto');
    await expect(productCards.nth(1)).toHaveAttribute('id', 'world-of-agents');
    await expect(productCards.filter({ hasText: 'BookMaker' }).getByRole('link', { name: 'Open BookMaker' }).first()).toHaveAttribute(
      'href',
      'https://book-studio.felican.dev/',
    );
    await expect(productCards.filter({ hasText: 'Relay' }).getByRole('link', { name: 'Open Relay' }).first()).toHaveAttribute(
      'href',
      'https://relay.felican.dev/relay',
    );

    await page.goto('/books/', { waitUntil: 'networkidle' });
    const covers = page.locator('img[alt$=" cover"]');
    await expect(covers).toHaveCount(4);
    expect(await covers.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: testInfo.outputPath(`homepage-${testInfo.project.name}.png`), fullPage: false });
    const assistantButton = page.locator('[data-assistant-launcher]');
    await expect(assistantButton).toHaveCount(1);
    await expect(assistantButton).toBeVisible();
    const launcherBox = await assistantButton.boundingBox();
    const viewport = page.viewportSize();
    expect(Math.abs(launcherBox.width - launcherBox.height)).toBeLessThanOrEqual(2);
    expect(viewport.width - launcherBox.x - launcherBox.width).toBeLessThanOrEqual(testInfo.project.name === 'mobile' ? 16 : 30);
    expect(viewport.height - launcherBox.y - launcherBox.height).toBeLessThanOrEqual(testInfo.project.name === 'mobile' ? 16 : 30);
    await assistantButton.click();
    await expect(assistantButton).toHaveAttribute('aria-expanded', 'true');
    const assistantPanel = page.locator('.fa-panel');
    await expect(assistantPanel).toBeVisible();
    await expect(assistantPanel).toHaveCSS('border-radius', testInfo.project.name === 'mobile' ? '19px' : '22px');

    const input = page.getByRole('textbox', { name: 'Your message' });
    await input.fill('What does Felican AI build?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('log')).toContainText(
      'Felican AI builds products, custom systems, automations, integrations, and training for businesses.',
    );
  });

  test('contact page uses direct email and phone links without a form', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /privateaiglobal@gmail.com/i }).first()).toHaveAttribute(
      'href',
      /mailto:privateaiglobal@gmail.com/,
    );
    await expect(page.getByRole('link', { name: /\+1 \(346\) 515-0361/i }).first()).toHaveAttribute(
      'href',
      'tel:+13465150361',
    );
    await expect(page.locator('main form')).toHaveCount(0);
  });

  test('booking page has a stable route and useful fallback until Calendly is configured', async ({ page }) => {
    await page.goto('/booking/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /where AI can create leverage/i })).toBeVisible();
    await expect(page.getByText('The calendar is being connected.')).toBeVisible();
    await expect(page.getByRole('link', { name: /\+1 \(346\) 515-0361/i }).first()).toHaveAttribute('href', 'tel:+13465150361');
    await expect(page.getByRole('link', { name: /privateaiglobal@gmail.com/i }).first()).toHaveAttribute('href', /mailto:privateaiglobal@gmail.com/);
    await expect(page.locator('main form')).toHaveCount(0);
  });

  test('legal, search, social, and analytics foundations are present', async ({ page }) => {
    await page.goto('/privacy/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
    await expect(page.getByText(/Messages sent to the Felican AI Assistant are processed by an AI service provider/i)).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://felican.ai/privacy/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://felican.ai/og.png');

    const robots = await page.request.get('/robots.txt');
    expect(await robots.text()).toContain('Disallow: /');
    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain('<loc>https://felican.ai/products/</loc>');

    const analytics = await page.request.post('/api/analytics', { data: { event: 'page_view', path: '/privacy/' } });
    expect(analytics.status()).toBe(204);
  });

  test('homepage overlap stays visible and service hover remains readable', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const firstPillar = page.locator('.home-pillars article').first();
    await expect(firstPillar.locator('h3')).toBeVisible();
    await page.waitForTimeout(250);
    await firstPillar.locator('h3').scrollIntoViewIfNeeded();
    const overlapIsVisible = await firstPillar.evaluate(card => {
      const heading = card.querySelector('h3');
      const box = heading.getBoundingClientRect();
      const topElement = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return Boolean(topElement?.closest('.home-pillars article'));
    });
    expect(overlapIsVisible).toBe(true);

    if (testInfo.project.name === 'mobile') return;

    const serviceCard = page.locator('[data-service-card]').first();
    await serviceCard.hover();
    await expect(serviceCard.locator('h3')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(serviceCard.locator('p')).toHaveCSS('color', 'rgb(221, 235, 255)');
  });
});

import { expect, test } from '@playwright/test';

const routes = [
  ['/', 'We build the AI your business'],
  ['/products/', 'Five products. Built for real work.'],
  ['/services/', 'Seven ways we put AI to work inside a business'],
  ['/books/', 'Four books by Lee Felican Jr.'],
  ['/about/', 'A family-built company that builds AI for a living'],
  ['/contact/', "Let's talk about your business"],
];

test.describe('Claude Design website export', () => {
  for (const [route, headline] of routes) {
    test(`${route} renders without browser errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await page.goto(route, { waitUntil: 'networkidle' });

      await expect(page.locator('h1').first()).toContainText(headline);
      await expect(page.locator('body')).not.toBeEmpty();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
      expect(consoleErrors).toEqual([]);
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
    const assistantButton = page.getByRole('button', { name: /felican ai assistant/i }).first();
    await expect(assistantButton).toBeVisible();
    await assistantButton.click();
    await expect(assistantButton).toHaveAttribute('aria-expanded', 'true');

    const input = page.getByRole('textbox', { name: 'Your message' });
    await input.fill('What does Felican AI build?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('log')).toContainText(
      'Felican AI builds products, custom systems, automations, integrations, and training for businesses.',
    );
  });

  test('contact page uses direct email and phone links without a form', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'networkidle' });
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

  test('homepage overlap stays visible and service hover remains readable', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const firstPillar = page.locator('.home-pillars article').first();
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

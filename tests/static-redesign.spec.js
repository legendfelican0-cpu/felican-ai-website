import { expect, test } from '@playwright/test';

const routes = [
  ['/', 'We build the AI your business'],
  ['/products/', 'Five products, five jobs done properly'],
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
});

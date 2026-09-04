import { expect, test } from '@playwright/test';

test.describe('Starter Pack purchase handoff', () => {
  test('demo plays behind the hero and opens a full sound-enabled player', async ({ page }) => {
    await page.goto('/starter-pack/');

    const background = page.locator('#heroDemoBg');
    await expect(background).toBeVisible();
    await expect(background).toHaveAttribute('autoplay', '');
    await expect.poll(() => background.evaluate(video => video.muted)).toBe(true);
    await expect.poll(() => background.evaluate(video => video.loop)).toBe(true);
    await expect(background).toHaveAttribute('poster', '/starter-pack/images/starter-pack-demo-poster.jpg');
    await expect(background.locator('source')).toHaveAttribute(
      'src',
      '/starter-pack/media/felican-ai-starter-pack-demo-v2.mp4',
    );

    const order = await page.locator('header.hero, section.products-sec').evaluateAll(
      elements => elements.map(element => element.className),
    );
    expect(order).toEqual(['hero', 'sec products-sec']);

    await page.getByRole('button', { name: /Watch it generate AI in minutes/i }).click();
    const demo = page.locator('#fullDemo');
    await expect(demo).toBeVisible();
    await expect.poll(() => demo.evaluate(video => video.controls)).toBe(true);
    await expect.poll(() => demo.evaluate(video => video.paused)).toBe(false);
    await expect.poll(() => demo.evaluate(video => video.muted)).toBe(false);

    await page.getByRole('button', { name: 'Close video' }).click();
    await expect(demo).toBeHidden();
    await expect(page.getByRole('link', { name: 'Felican AI home' })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('keeps product cards compact and reveals full product and hosting details on demand', async ({ page }) => {
    await page.goto('/starter-pack/');

    await expect(page.locator('.card')).toHaveCount(3);
    await expect(page.locator('.card .product-price')).toHaveText(['$999one-time', '$999one-time', '$999one-time']);
    await expect(page.getByRole('heading', { name: 'Chat AI Assistant' })).toBeVisible();
    await expect(page.locator('.card .product-details[open]')).toHaveCount(0);
    await page.locator('.card .product-details summary').first().click();
    await expect(page.locator('.card .product-details').first()).toHaveAttribute('open', '');

    const hostingSections = page.locator('.card .hosting, .bundle-buy .hosting');
    await expect(hostingSections).toHaveCount(4);

    for (const hosting of await hostingSections.all()) {
      await expect(hosting.locator('.hosting-plan')).toHaveCount(3);
      await expect(hosting).toContainText('Essentials');
      await expect(hosting).toContainText('$50/mo');
      await expect(hosting).toContainText('25 GB storage');
      await expect(hosting).toContainText('2,000 website replies');
      await expect(hosting).toContainText('100 Voice AI min');
      await expect(hosting).toContainText('$10 Private AI processing');
      await expect(hosting).toContainText('Growth');
      await expect(hosting).toContainText('$100/mo');
      await expect(hosting).toContainText('75 GB storage');
      await expect(hosting).toContainText('6,000 website replies');
      await expect(hosting).toContainText('300 Voice AI min');
      await expect(hosting).toContainText('$25 Private AI processing');
      await expect(hosting).toContainText('Scale');
      await expect(hosting).toContainText('$200/mo');
      await expect(hosting).toContainText('200 GB storage');
      await expect(hosting).toContainText('20,000 website replies');
      await expect(hosting).toContainText('800 Voice AI min');
      await expect(hosting).toContainText('$60 Private AI processing');
    }

    await expect(page.locator('body')).not.toContainText('Then $50/mo hosting');
  });

  test('lets the buyer select one account-wide hosting plan and keeps it for checkout', async ({ page }) => {
    await page.goto('/starter-pack/');

    const planButtons = page.locator('[data-plan="growth"]');
    await page.locator('.bundle-buy [data-plan="growth"]').click();
    await expect(planButtons).toHaveCount(4);
    for (const button of await planButtons.all()) {
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(button).toContainText('Selected');
    }
    await expect.poll(() => page.evaluate(() => localStorage.getItem('felican_hosting_plan_v1'))).toBe('growth');

    await page.locator('[data-add="pack"]').click();
    await expect(page.locator('#cartSub')).toContainText('Growth hosting selected');
    await page.getByRole('link', { name: /Checkout/ }).click();
    await expect(page.locator('.hosting-option[data-plan="growth"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#hostingSummary')).toContainText('Growth hosting at $100/month is selected');
    await expect(page.locator('#total')).toHaveText('$2,600');

    await page.locator('.hosting-option[data-plan="scale"]').click();
    await expect(page.locator('.hosting-option[data-plan="scale"]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('felican_hosting_plan_v1'))).toBe('scale');
  });

  test('checkout sends identifiers, email, and consent without client-owned prices', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('felican_cart_v1', JSON.stringify(['pack']));
    });

    let checkoutRequest;
    await page.route('**/api/checkout', async route => {
      checkoutRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test stopped before Stripe redirect' }),
      });
    });

    await page.goto('/checkout/');
    await page.getByLabel('Your email').fill('ai@felican.ai');
    await page.getByLabel(/I agree to the Terms of Use/).check();
    await page.getByRole('button', { name: /Pay securely/ }).click();

    await expect.poll(() => checkoutRequest).toEqual({
      items: ['pack', 'hosting-base'],
      email: 'ai@felican.ai',
      termsAccepted: true,
    });
    expect(checkoutRequest).not.toHaveProperty('price');
    expect(checkoutRequest).not.toHaveProperty('total');
  });

  test('paid receipt shows the full order and links directly to the generator', async ({ page }) => {
    const sessionId = 'cs_test_receipt_handoff_123456';
    await page.route('**/api/order?session_id=*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: ['pack'],
        hostingPlan: 'base',
        total: 2550,
        email: 'ai@felican.ai',
      }),
    }));

    await page.goto(`/thank-you/?session_id=${sessionId}`);

    await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
    await expect(page.locator('#orderBox')).toContainText('AI Business Starter Pack');
    await expect(page.locator('#orderBox')).toContainText('Essentials hosting$50/month');
    await expect(page.locator('#orderBox')).toContainText('Paid$2,550');
    await expect(page.locator('#toEmail')).toHaveText(' at ai@felican.ai');
    await expect(page.getByRole('link', { name: /Set up my AI now/ })).toHaveAttribute(
      'href',
      `https://app.felican.dev/claim?order=${sessionId}`,
    );
  });
});

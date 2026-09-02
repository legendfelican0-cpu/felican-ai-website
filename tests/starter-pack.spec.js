import { expect, test } from '@playwright/test';

test.describe('Starter Pack purchase handoff', () => {
  test('checkout sends only product ids and email to the server', async ({ page }) => {
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
    await page.getByRole('button', { name: /Pay securely/ }).click();

    await expect.poll(() => checkoutRequest).toEqual({
      items: ['pack'],
      email: 'ai@felican.ai',
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
        total: 2500,
        email: 'ai@felican.ai',
      }),
    }));

    await page.goto(`/thank-you/?session_id=${sessionId}`);

    await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
    await expect(page.locator('#orderBox')).toContainText('AI Business Starter Pack');
    await expect(page.locator('#orderBox')).toContainText('Paid$2,500');
    await expect(page.locator('#toEmail')).toHaveText(' at ai@felican.ai');
    await expect(page.getByRole('link', { name: /Set up my AI now/ })).toHaveAttribute(
      'href',
      `https://app.felican.dev/claim?order=${sessionId}`,
    );
  });
});

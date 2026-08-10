import { expect, test } from '@playwright/test';

/**
 * Walks the path a real prospect takes: arrive on the homepage, work out what
 * Felican does, check the credentials, pick a product, and get in touch — by
 * form and via the assistant.
 *
 * /api/contact is intercepted throughout. The endpoint is proven separately
 * against the live site; sending real mail on every test run would be rude and
 * would trip the per-IP rate limit.
 */

/** Capture what the page POSTs to /api/contact and answer as the server would. */
function stubContact(page, captured) {
  return page.route('**/api/contact', async route => {
    try { captured.push(route.request().postDataJSON()); } catch { captured.push(null); }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

test.describe('Customer journey', () => {
  test('a prospect can size up the company from the homepage', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });

    // The pitch is legible above the fold.
    await expect(page.locator('h1')).toContainText('AI solutions for');
    await expect(page.getByRole('link', { name: /book a call/i }).first()).toBeVisible();

    // The pain-point section and the thirteen ways are both present.
    await expect(page.getByRole('heading', { name: 'Sound familiar?' })).toBeVisible();
    await expect(page.locator('.friction-card')).toHaveCount(6);
    await expect(page.getByRole('heading', { name: /ways AI can help your business/i })).toBeVisible();
    await expect(page.locator('.ways-card')).toHaveCount(13);

    // Marketing, HR and finance must all be represented.
    const ways = (await page.locator('.ways-title').allTextContents()).join(' | ');
    expect(ways).toMatch(/Marketing/i);
    expect(ways).toMatch(/HR/i);
    expect(ways).toMatch(/Cash Flow|Books/i);
  });

  test('the credentials strip stays put and opens the certifications detail', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Visible immediately, not only after scrolling.
    const bar = page.locator('.cred-bar');
    await expect(bar).toBeVisible();
    const viewport = page.viewportSize();
    let box = await bar.boundingBox();
    expect(Math.abs(viewport.height - (box.y + box.height))).toBeLessThanOrEqual(2);

    // Still pinned after scrolling, and the header stays with it.
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(400);
    box = await bar.boundingBox();
    expect(Math.abs(viewport.height - (box.y + box.height))).toBeLessThanOrEqual(2);
    const header = await page.locator('header').boundingBox();
    expect(Math.abs(header.y)).toBeLessThanOrEqual(2);

    // Every certification logo actually loaded.
    const badges = page.locator('.badge-item img');
    await expect(badges).toHaveCount(5);
    expect(await badges.evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0))).toBe(true);

    // Clicking opens the modal, which names all five platforms.
    await bar.getByRole('button').click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    const certs = await modal.locator('.cert-name').allTextContents();
    expect(certs.join(' | ')).toMatch(/Amazon Web Services.*Azure.*Google Cloud.*Anthropic.*OpenAI/s);

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('a prospect picks a product and the enquiry arrives pre-labelled', async ({ page }) => {
    const captured = [];
    await stubContact(page, captured);

    await page.goto('/products/', { waitUntil: 'networkidle' });

    // The flagship leads and is flagged as such.
    const flagship = page.locator('.product-card.is-featured');
    await expect(flagship).toHaveCount(1);
    await expect(flagship.locator('h2')).toHaveText('Private AI Global');
    await expect(flagship.locator('.product-flag')).toHaveText('Flagship product');

    // Every headline product shows artwork that loaded.
    const shots = page.locator('.product-card .product-shot img');
    await expect(shots).toHaveCount(11);
    expect(await shots.evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0))).toBe(true);

    // Withdrawn names must not appear.
    const body = await page.locator('body').innerText();
    for (const gone of ['BetIQ', 'CasaSuite', 'LeadConcierge', 'InvestorHQ', 'ResyDoc']) {
      expect(body).not.toContain(gone);
    }

    // Follow the CTA the way a customer would.
    await page.locator('#crosscheck-ai').getByRole('link', { name: /Ask about CrossCheck AI/i }).click();
    await expect(page).toHaveURL(/\/contact\/\?product=CrossCheck(%20|\+)AI/);

    // The form knows which product they came from.
    await expect(page.locator('#formh')).toHaveText('Ask us about CrossCheck AI');
    await expect(page.locator('select[name=product]')).toHaveValue('CrossCheck AI');

    await page.locator('input[name=name]').fill('Dana Reyes');
    await page.locator('input[name=email]').fill('dana@example.com');
    await page.locator('input[name=company]').fill('Reyes Logistics');
    await page.locator('textarea[name=message]').fill('We want a second model checking our claims assistant.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.locator('.ct-alert.is-ok')).toContainText('on its way');
    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      name: 'Dana Reyes',
      email: 'dana@example.com',
      company: 'Reyes Logistics',
      product: 'CrossCheck AI',
      source: 'contact-form',
    });
    // The honeypot must go out empty, or real submissions would be discarded.
    expect(captured[0].website).toBe('');
  });

  test('the form refuses incomplete details before contacting the server', async ({ page }) => {
    const captured = [];
    await stubContact(page, captured);

    await page.goto('/contact/', { waitUntil: 'networkidle' });
    await page.locator('input[name=email]').fill('not-an-email');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.locator('.ct-alert.is-bad')).toContainText('valid email');
    expect(captured).toHaveLength(0);
    await expect(page.locator('input[name=email]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('a prospect can reach a human through the assistant', async ({ page }) => {
    const captured = [];
    await stubContact(page, captured);

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('[data-assistant-launcher]').click();

    // Ask something first, so the handoff carries a transcript.
    await page.getByRole('textbox', { name: 'Your message' }).fill('Do you deploy inside our own network?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('log')).toContainText('Felican AI builds products');

    await page.getByRole('button', { name: /email a person/i }).click();
    const handoff = page.locator('.fa-handoff');
    await expect(handoff).toBeVisible();
    // The composer steps aside so the panel is not overfilled.
    await expect(page.locator('.fa-composer')).toHaveCount(0);

    await handoff.locator('input[placeholder="Your name"]').fill('Sam Okonjo');
    await handoff.locator('input[placeholder="Your email"]').fill('sam@example.com');
    await handoff.locator('textarea').fill('Please call me about a private deployment.');
    await handoff.getByRole('button', { name: /send to the team/i }).click();

    await expect(page.getByRole('log')).toContainText('certified AI professional will reply');
    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({ name: 'Sam Okonjo', email: 'sam@example.com', source: 'assistant' });
    // The conversation goes with it, so nobody starts cold.
    expect(captured[0].message).toContain('Chat transcript');
    expect(captured[0].message).toContain('Do you deploy inside our own network?');
  });

  test('the about page backs up the credentials claim', async ({ page }) => {
    await page.goto('/about/', { waitUntil: 'networkidle' });
    await expect(page.getByText('Certified AI professionals on the team')).toBeVisible();
    await expect(page.locator('.ind')).toHaveCount(20);
    const industries = (await page.locator('.ind').allTextContents()).join(' | ');
    for (const sector of ['Healthcare', 'Insurance', 'Construction', 'Logistics', 'Education']) {
      expect(industries).toContain(sector);
    }
  });

  test('services cover the newer engagements', async ({ page }) => {
    await page.goto('/services/', { waitUntil: 'networkidle' });
    const names = (await page.locator('main h2').allTextContents()).join(' | ');
    for (const service of ['Custom-trained AI models', 'AI auditing', 'AI cost analysis', 'Corporate training']) {
      expect(names).toContain(service);
    }
  });

  test('a pasted link would render a rich preview', async ({ page }) => {
    for (const route of ['/', '/products/', '/contact/']) {
      const response = await page.request.get(route);
      const html = await response.text();
      const head = html.slice(0, html.indexOf('</head>'));
      // Scrapers do not run JavaScript, so these must be in the static head.
      expect(head, `${route} og:title`).toContain('property="og:title"');
      expect(head, `${route} og:image`).toContain('https://felican.ai/og.png');
      expect(head, `${route} title`).toMatch(/<title>.+<\/title>/);
      const ld = head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(ld, `${route} JSON-LD`).not.toBeNull();
      const org = JSON.parse(ld[1])['@graph'].find(n => n['@type'] === 'Organization');
      expect(org.email).toBe('ai@felican.ai');
      expect(org.telephone).toBe('+1-561-235-0799');
    }
  });
});

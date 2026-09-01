import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CATALOG,
  buildWelcomeEmail,
  checkoutIsConfigured,
  createCheckoutSession,
  normalizeOrder,
  orderFromCheckoutSession,
  sendWelcomeEmail,
  stripeWebhookIsConfigured,
  verifyStripeWebhook,
} from './checkout.js';

afterEach(() => vi.unstubAllGlobals());

describe('normalizeOrder', () => {
  it('accepts a single valid product', () => {
    const r = normalizeOrder({ items: ['private-ai'], email: 'a@b.com' });
    expect(r.error).toBeUndefined();
    expect(r.items).toEqual(['private-ai']);
    expect(r.totalCents).toBe(100_000);
  });

  it('totals three singles at $3,000', () => {
    const r = normalizeOrder({ items: ['private-ai', 'assistant', 'receptionist'], email: 'a@b.com' });
    expect(r.totalCents).toBe(300_000);
  });

  it('prices the pack at $2,500', () => {
    expect(normalizeOrder({ items: ['pack'], email: 'a@b.com' }).totalCents).toBe(250_000);
  });

  it('collapses a pack bought alongside singles down to the pack alone', () => {
    const r = normalizeOrder({ items: ['pack', 'private-ai', 'assistant'], email: 'a@b.com' });
    expect(r.items).toEqual(['pack']);
    expect(r.totalCents).toBe(250_000);
  });

  it('ignores duplicates rather than charging twice', () => {
    const r = normalizeOrder({ items: ['assistant', 'assistant'], email: 'a@b.com' });
    expect(r.items).toEqual(['assistant']);
    expect(r.totalCents).toBe(100_000);
  });

  it('rejects an unknown product id', () => {
    expect(normalizeOrder({ items: ['free-everything'], email: 'a@b.com' }).error).toBeTruthy();
  });

  it('rejects an empty cart', () => {
    expect(normalizeOrder({ items: [], email: 'a@b.com' }).error).toBeTruthy();
    expect(normalizeOrder({ email: 'a@b.com' }).error).toBeTruthy();
  });

  it('rejects a bad email', () => {
    for (const email of ['', 'nope', 'a@b', 'a b@c.com']) {
      expect(normalizeOrder({ items: ['pack'], email }).error).toBeTruthy();
    }
  });

  it('rejects an absurd number of items', () => {
    expect(normalizeOrder({ items: Array(9).fill('pack'), email: 'a@b.com' }).error).toBeTruthy();
  });

  // The whole point of server-side pricing: a tampered cart cannot set its own price.
  it('never takes a price from the client', () => {
    const r = normalizeOrder({ items: ['pack'], email: 'a@b.com', price: 1, totalCents: 1, amount: 1 });
    expect(r.totalCents).toBe(CATALOG.pack.amount);
  });

  it('is not fooled by non-string item values', () => {
    expect(normalizeOrder({ items: [{ id: 'pack' }], email: 'a@b.com' }).error).toBeTruthy();
    expect(normalizeOrder({ items: 'pack', email: 'a@b.com' }).error).toBeTruthy();
  });
});

describe('checkoutIsConfigured', () => {
  it('is false without a Stripe key and true with one', () => {
    expect(checkoutIsConfigured({})).toBe(false);
    expect(checkoutIsConfigured({ STRIPE_SECRET_KEY: '  ' })).toBe(false);
    expect(checkoutIsConfigured({ STRIPE_SECRET_KEY: 'sk_test_x' })).toBe(true);
  });
});

describe('createCheckoutSession', () => {
  it('uses server-owned prices, a pinned API version, and dynamic payment methods', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: 'cs_test_1234567890', url: 'https://checkout.stripe.com/test',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await createCheckoutSession({ items: ['pack'], email: 'buyer@example.com', origin: 'https://felican.ai' }, {
      STRIPE_SECRET_KEY: 'sk_test_secret',
    });
    const options = fetchMock.mock.calls[0][1];
    const form = new URLSearchParams(options.body);
    expect(options.headers['Stripe-Version']).toBe('2026-07-29.dahlia');
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('250000');
    expect(form.get('integration_identifier')).toMatch(/^felican_starter_pack_[a-z]{8}$/);
    expect([...form.keys()].some(key => key.includes('payment_method_types'))).toBe(false);
  });
});

describe('Stripe webhooks', () => {
  const secret = 'whsec_test_secret';
  const now = 1_800_000_000_000;
  const timestamp = Math.floor(now / 1000);
  const raw = Buffer.from(JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' }));
  const signature = createHmac('sha256', secret).update(Buffer.concat([Buffer.from(`${timestamp}.`), raw])).digest('hex');

  it('reports whether webhook verification is configured', () => {
    expect(stripeWebhookIsConfigured({})).toBe(false);
    expect(stripeWebhookIsConfigured({ STRIPE_WEBHOOK_SECRET: secret })).toBe(true);
  });

  it('accepts an authentic, recent raw event', () => {
    expect(verifyStripeWebhook(raw, `t=${timestamp},v1=${signature}`, { STRIPE_WEBHOOK_SECRET: secret }, now))
      .toMatchObject({ id: 'evt_test', type: 'checkout.session.completed' });
  });

  it('rejects tampered and expired events', () => {
    expect(() => verifyStripeWebhook(Buffer.from(`${raw}x`), `t=${timestamp},v1=${signature}`, { STRIPE_WEBHOOK_SECRET: secret }, now))
      .toThrow('Invalid Stripe signature');
    expect(() => verifyStripeWebhook(raw, `t=${timestamp},v1=${signature}`, { STRIPE_WEBHOOK_SECRET: secret }, now + 301_000))
      .toThrow('Expired Stripe signature');
  });

  it('normalizes only paid catalog orders from completed sessions', () => {
    const order = orderFromCheckoutSession({
      id: 'cs_test_paid_order', payment_status: 'paid', amount_total: 250_000, currency: 'usd', created: 1_700_000_000,
      customer_details: { email: 'buyer@example.com' }, metadata: { items: 'pack' },
    });
    expect(order).toMatchObject({
      id: 'cs_test_paid_order', email: 'buyer@example.com', items: ['pack'], total: 2500, amountCents: 250_000,
    });
    expect(orderFromCheckoutSession({ ...order, payment_status: 'unpaid', metadata: { items: 'pack' } })).toBeNull();
    expect(orderFromCheckoutSession({
      id: 'cs_test_underpaid', payment_status: 'paid', amount_total: 1, currency: 'usd', metadata: { items: 'pack' },
    })).toBeNull();
  });
});

describe('buildWelcomeEmail', () => {
  const setupUrl = 'https://felican.ai/thank-you/?session_id=cs_test_123';

  it('names the pack in the subject and links the setup url', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2500, setupUrl });
    expect(mail.subject).toContain('Starter Pack');
    expect(mail.html).toContain(setupUrl);
    expect(mail.text).toContain(setupUrl);
  });

  it('names the single product bought', () => {
    const mail = buildWelcomeEmail({ items: ['receptionist'], total: 1000, setupUrl });
    expect(mail.subject).toContain('Voice AI');
  });

  it('states the amount paid and that hosting is separate', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2500, setupUrl });
    expect(mail.text).toContain('$2,500');
    expect(mail.text).toContain('$50/month');
    expect(mail.html).toContain('2,500');
  });

  it('promises setup in minutes instead of days', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2500, setupUrl });
    expect(mail.text).toContain('ready and running in a few minutes');
    expect(mail.html).toContain('ready and running in a few minutes');
    expect(mail.text).not.toContain('48 hours');
    expect(mail.html).not.toContain('48 hours');
  });

  it('escapes a hostile setup url instead of injecting markup', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2500, setupUrl: 'https://x/"><script>alert(1)</script>' });
    expect(mail.html).not.toContain('<script>alert(1)</script>');
  });

  it('uses the Stripe session as Resend idempotency key', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'email_123' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    await sendWelcomeEmail({
      id: 'cs_test_paid_order', email: 'buyer@example.com', items: ['pack'], total: 2500, setupUrl,
    }, { RESEND_API_KEY: 're_test' });
    expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key']).toBe('starter-pack-welcome/cs_test_paid_order');
  });
});

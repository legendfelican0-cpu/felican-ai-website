import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CATALOG,
  HOSTING_PLANS,
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
const withHosting = (items, plan = 'base') => [...items, `hosting-${plan}`];

describe('normalizeOrder', () => {
  it('accepts a single valid product', () => {
    const r = normalizeOrder({ items: withHosting(['private-ai']), email: 'a@b.com' });
    expect(r.error).toBeUndefined();
    expect(r.items).toEqual(['private-ai']);
    expect(r.hostingPlan).toBe('base');
    expect(r.productTotalCents).toBe(100_000);
    expect(r.totalCents).toBe(105_000);
  });

  it('totals three singles at $3,000', () => {
    const r = normalizeOrder({ items: withHosting(['private-ai', 'assistant', 'receptionist'], 'growth'), email: 'a@b.com' });
    expect(r.totalCents).toBe(310_000);
  });

  it('prices the pack at $2,500', () => {
    expect(normalizeOrder({ items: withHosting(['pack'], 'scale'), email: 'a@b.com' }).totalCents).toBe(270_000);
  });

  it('collapses a pack bought alongside singles down to the pack alone', () => {
    const r = normalizeOrder({ items: withHosting(['pack', 'private-ai', 'assistant']), email: 'a@b.com' });
    expect(r.items).toEqual(['pack']);
    expect(r.totalCents).toBe(255_000);
  });

  it('ignores duplicates rather than charging twice', () => {
    const r = normalizeOrder({ items: withHosting(['assistant', 'assistant']), email: 'a@b.com' });
    expect(r.items).toEqual(['assistant']);
    expect(r.totalCents).toBe(105_000);
  });

  it('rejects an unknown product id', () => {
    expect(normalizeOrder({ items: ['free-everything'], email: 'a@b.com' }).error).toBeTruthy();
  });

  it('rejects an empty cart', () => {
    expect(normalizeOrder({ items: [], email: 'a@b.com' }).error).toBeTruthy();
    expect(normalizeOrder({ email: 'a@b.com' }).error).toBeTruthy();
  });

  it('requires exactly one known hosting plan', () => {
    expect(normalizeOrder({ items: ['pack'], email: 'a@b.com' }).error).toMatch(/hosting/i);
    expect(normalizeOrder({ items: ['pack', 'hosting-base', 'hosting-growth'], email: 'a@b.com' }).error).toMatch(/one monthly/i);
    expect(normalizeOrder({ items: ['pack', 'hosting-free'], email: 'a@b.com' }).error).toBeTruthy();
  });

  it('rejects a bad email', () => {
    for (const email of ['', 'nope', 'a@b', 'a b@c.com']) {
      expect(normalizeOrder({ items: withHosting(['pack']), email }).error).toBeTruthy();
    }
  });

  it('rejects an absurd number of items', () => {
    expect(normalizeOrder({ items: Array(9).fill('pack'), email: 'a@b.com' }).error).toBeTruthy();
  });

  // The whole point of server-side pricing: a tampered cart cannot set its own price.
  it('never takes a price from the client', () => {
    const r = normalizeOrder({ items: withHosting(['pack']), email: 'a@b.com', price: 1, totalCents: 1, amount: 1 });
    expect(r.totalCents).toBe(CATALOG.pack.amount + HOSTING_PLANS['hosting-base'].amount);
  });

  it('is not fooled by non-string item values', () => {
    expect(normalizeOrder({ items: [{ id: 'pack' }, 'hosting-base'], email: 'a@b.com' }).error).toBeTruthy();
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
    const fetchMock = vi.fn(async url => {
      if (String(url).includes('/prices?')) return new Response(JSON.stringify({ data: [{
        id: 'price_hosting_growth', active: true, currency: 'usd', unit_amount: 10_000,
        recurring: { interval: 'month', interval_count: 1 },
      }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({
        id: 'cs_test_1234567890', url: 'https://checkout.stripe.com/test',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    await createCheckoutSession({ items: ['pack'], hostingPlan: 'growth', email: 'buyer@example.com', origin: 'https://felican.ai' }, {
      STRIPE_SECRET_KEY: 'sk_test_secret',
    });
    const [, options] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/checkout/sessions'));
    const form = new URLSearchParams(options.body);
    expect(options.headers['Stripe-Version']).toBe('2026-07-29.dahlia');
    expect(form.get('mode')).toBe('subscription');
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('250000');
    expect(form.get('line_items[1][price]')).toBe('price_hosting_growth');
    expect(form.get('metadata[hosting_plan]')).toBe('growth');
    expect(form.get('subscription_data[metadata][hosting_plan]')).toBe('growth');
    expect([...form.keys()].some(key => key.includes('payment_intent_data'))).toBe(false);
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

  it('validates the product price plus first hosting month for combined Checkout', () => {
    const order = orderFromCheckoutSession({
      id: 'cs_test_combined', mode: 'subscription', payment_status: 'paid', amount_total: 260_000,
      currency: 'usd', customer_details: { email: 'buyer@example.com' },
      metadata: { items: 'pack', purpose: 'starter_pack_with_hosting', hosting_plan: 'growth' },
    });
    expect(order).toMatchObject({ items: ['pack'], hostingPlan: 'growth', productTotalCents: 250_000, amountCents: 260_000 });
    expect(orderFromCheckoutSession({ ...order, mode: 'subscription', payment_status: 'paid', amount_total: 250_000,
      metadata: { items: 'pack', purpose: 'starter_pack_with_hosting', hosting_plan: 'growth' } })).toBeNull();
  });
});

describe('buildWelcomeEmail', () => {
  const setupUrl = 'https://felican.ai/thank-you/?session_id=cs_test_123';

  it('names the pack in the subject and links the setup url', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2550, hostingPlan: 'base', setupUrl });
    expect(mail.subject).toContain('Starter Pack');
    expect(mail.html).toContain(setupUrl);
    expect(mail.text).toContain(setupUrl);
  });

  it('names the single product bought', () => {
    const mail = buildWelcomeEmail({ items: ['receptionist'], total: 1050, hostingPlan: 'base', setupUrl });
    expect(mail.subject).toContain('Voice AI');
  });

  it('states the combined initial payment and recurring hosting terms', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2600, hostingPlan: 'growth', setupUrl });
    expect(mail.text).toContain('$2,600');
    expect(mail.text).toContain('$2,500 product purchase');
    expect(mail.text).toContain('Growth hosting is active at $100/month');
    expect(mail.text).toContain('75 GB');
    expect(mail.text).toContain('no automatic');
    expect(mail.html).toContain('2,600');
  });

  it('promises setup in minutes instead of days', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2550, hostingPlan: 'base', setupUrl });
    expect(mail.text).toContain('ready and running in a few minutes');
    expect(mail.html).toContain('ready and running in a few minutes');
    expect(mail.text).not.toContain('48 hours');
    expect(mail.html).not.toContain('48 hours');
  });

  it('escapes a hostile setup url instead of injecting markup', () => {
    const mail = buildWelcomeEmail({ items: ['pack'], total: 2550, hostingPlan: 'base', setupUrl: 'https://x/"><script>alert(1)</script>' });
    expect(mail.html).not.toContain('<script>alert(1)</script>');
  });

  it('uses the Stripe session as Resend idempotency key', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'email_123' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    await sendWelcomeEmail({
      id: 'cs_test_paid_order', email: 'buyer@example.com', items: ['pack'], total: 2550, hostingPlan: 'base', setupUrl,
    }, { RESEND_API_KEY: 're_test' });
    expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key']).toBe('starter-pack-welcome/cs_test_paid_order');
  });
});

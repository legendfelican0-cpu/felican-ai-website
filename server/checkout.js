/**
 * Starter Pack checkout — Stripe session creation, order lookup, welcome email.
 *
 * Talks to the Stripe and Resend REST APIs with fetch so the site keeps its
 * zero-dependency server. Prices live HERE and nowhere else: the browser only
 * ever sends product ids, so a tampered cart cannot change what gets charged.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_API_VERSION = '2026-07-29.dahlia';
const RESEND_API = 'https://api.resend.com/emails';
const TIMEOUT_MS = 15_000;
const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

/** The only products that can be bought. Amounts are in cents. */
export const CATALOG = Object.freeze({
  'private-ai':   { name: 'Private AI',           amount: 99_900,
                    blurb: 'Your own private AI for your team, at your own address.' },
  'assistant':    { name: 'Chat AI Assistant',    amount: 99_900,
                    blurb: 'The multilingual assistant for your website.' },
  'receptionist': { name: 'Voice AI',             amount: 99_900,
                    blurb: 'Voice AI that answers the phone and books appointments.' },
  'pack':         { name: 'AI Business Starter Pack',       amount: 250_000,
                    blurb: 'All three products, one shared knowledge base.' },
});

/** Fixed recurring plans. The browser sends only the selected hosting item id. */
export const HOSTING_PLANS = Object.freeze({
  'hosting-base': {
    id: 'base', name: 'Essentials', amount: 5_000, productName: 'Felican AI hosting',
    lookupKey: 'felican_hosting_base_monthly',
    allowance: '25 GB storage, 2,000 website-assistant replies, 100 Voice AI minutes, and $10 of Private AI processing',
  },
  'hosting-growth': {
    id: 'growth', name: 'Growth', amount: 10_000, productName: 'Felican AI Growth hosting',
    lookupKey: 'felican_hosting_growth_monthly',
    allowance: '75 GB storage, 6,000 website-assistant replies, 300 Voice AI minutes, and $25 of Private AI processing',
  },
  'hosting-scale': {
    id: 'scale', name: 'Scale', amount: 20_000, productName: 'Felican AI Scale hosting',
    lookupKey: 'felican_hosting_scale_monthly',
    allowance: '200 GB storage, 20,000 website-assistant replies, 800 Voice AI minutes, and $60 of Private AI processing',
  },
});
const HOSTING_BY_PLAN = Object.freeze(Object.fromEntries(
  Object.values(HOSTING_PLANS).map(plan => [plan.id, plan]),
));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MAX_ITEMS = 5;
const COMBINED_CHECKOUT_PURPOSE = 'starter_pack_with_hosting';
export const TERMS_VERSION = '2026-09-04-r2';
export const PRIVACY_VERSION = '2026-09-04-r2';

export function checkoutIsConfigured(env = process.env) {
  return Boolean(env.STRIPE_SECRET_KEY?.trim());
}

export function stripeWebhookIsConfigured(env = process.env) {
  return Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
}

/** Verify Stripe's signed raw webhook body before parsing any event fields. */
export function verifyStripeWebhook(rawBody, signatureHeader, env = process.env, nowMs = Date.now()) {
  const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw Object.assign(new Error('Stripe webhook is not configured'), { statusCode: 503 });

  const parts = String(signatureHeader || '').split(',').map(part => part.trim());
  const timestamp = Number(parts.find(part => part.startsWith('t='))?.slice(2));
  const signatures = parts
    .filter(part => part.startsWith('v1='))
    .map(part => part.slice(3))
    .filter(value => /^[a-f0-9]{64}$/i.test(value));
  if (!Number.isSafeInteger(timestamp) || !signatures.length) {
    throw Object.assign(new Error('Invalid Stripe signature'), { statusCode: 400 });
  }
  if (Math.abs(Math.floor(nowMs / 1000) - timestamp) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
    throw Object.assign(new Error('Expired Stripe signature'), { statusCode: 400 });
  }

  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '');
  const signed = Buffer.concat([Buffer.from(`${timestamp}.`), payload]);
  const expected = createHmac('sha256', secret).update(signed).digest();
  const valid = signatures.some(value => timingSafeEqual(expected, Buffer.from(value, 'hex')));
  if (!valid) throw Object.assign(new Error('Invalid Stripe signature'), { statusCode: 400 });

  try {
    return JSON.parse(payload.toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid Stripe event'), { statusCode: 400 });
  }
}

/**
 * Validate a cart posted by the browser.
 * Returns { error } or the normalized product ids, hosting plan, and totals.
 */
export function normalizeOrder(body) {
  const email = String(body?.email ?? '').trim().slice(0, 200);
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address.' };
  if (body?.termsAccepted !== true) {
    return { error: 'Please agree to the Terms of Use and acknowledge the Privacy Policy.' };
  }

  const raw = Array.isArray(body?.items) ? body.items : [];
  if (!raw.length) return { error: 'Your cart is empty.' };
  if (raw.length > MAX_ITEMS) return { error: 'That is more items than we can process.' };

  const items = [];
  let hostingPlan = null;
  for (const value of raw) {
    const id = String(value ?? '').trim();
    if (HOSTING_PLANS[id]) {
      if (hostingPlan && hostingPlan.id !== HOSTING_PLANS[id].id) {
        return { error: 'Choose one monthly hosting plan.' };
      }
      hostingPlan = HOSTING_PLANS[id];
      continue;
    }
    if (!CATALOG[id]) return { error: 'One of those products is no longer available.' };
    if (items.includes(id)) continue; // one of each; the cart is not a quantity picker
    items.push(id);
  }
  if (!items.length) return { error: 'Your cart is empty.' };
  if (!hostingPlan) return { error: 'Choose a monthly hosting plan.' };

  // The pack already contains everything, so it never rides along with singles.
  const finalItems = items.includes('pack') ? ['pack'] : items;
  const productTotalCents = finalItems.reduce((sum, id) => sum + CATALOG[id].amount, 0);
  const totalCents = productTotalCents + hostingPlan.amount;
  return {
    items: finalItems,
    hostingPlan: hostingPlan.id,
    email,
    productTotalCents,
    totalCents,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
  };
}

async function stripeRequest(path, { method = 'GET', form, key, idempotencyKey = '' }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = new URL(`${STRIPE_API}${path}`);
    if (method === 'GET' && form) url.search = form.toString();
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        'Stripe-Version': STRIPE_API_VERSION,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      signal: controller.signal,
      ...(form && method !== 'GET' ? { body: form.toString() } : {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.error?.message || `Stripe returned ${response.status}`;
      const error = new Error(detail);
      error.statusCode = response.status >= 500 ? 502 : 400;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function validateHostingPrice(price, plan) {
  const recurring = price?.recurring || {};
  return price?.active !== false && price?.currency === 'usd' &&
    Number(price?.unit_amount) === plan.amount && recurring.interval === 'month' &&
    Number(recurring.interval_count || 1) === 1;
}

/** Reuse the generator's Stripe Price, provisioning it once if it is absent. */
async function ensureHostingPrice(plan, key) {
  const priceQuery = new URLSearchParams({ active: 'true', limit: '1' });
  priceQuery.set('lookup_keys[0]', plan.lookupKey);
  const prices = await stripeRequest('/prices', { form: priceQuery, key });
  const existingPrice = prices?.data?.[0];
  if (existingPrice) {
    if (!validateHostingPrice(existingPrice, plan)) {
      throw Object.assign(new Error(`The ${plan.name} hosting price is misconfigured`), { statusCode: 503 });
    }
    return existingPrice.id;
  }

  const productQuery = new URLSearchParams({ active: 'true', limit: '100' });
  const products = await stripeRequest('/products', { form: productQuery, key });
  let product = products?.data?.find(item => item?.name === plan.productName);
  if (!product) {
    const form = new URLSearchParams({
      name: plan.productName,
      description: `${plan.name} hosting and monthly AI allowances`,
      'metadata[managed_by]': 'ai-generator',
      'metadata[hosting_plan]': plan.id,
    });
    product = await stripeRequest('/products', {
      method: 'POST', form, key, idempotencyKey: `starter-pack-hosting-product-${plan.id}`,
    });
  }

  const priceForm = new URLSearchParams({
    currency: 'usd',
    unit_amount: String(plan.amount),
    'recurring[interval]': 'month',
    product: product.id,
    nickname: `Felican AI ${plan.name} — $${plan.amount / 100}/month`,
    lookup_key: plan.lookupKey,
  });
  const price = await stripeRequest('/prices', {
    method: 'POST', form: priceForm, key, idempotencyKey: `starter-pack-hosting-price-${plan.id}`,
  });
  if (!validateHostingPrice(price, plan)) {
    throw Object.assign(new Error(`Stripe returned an invalid ${plan.name} hosting price`), { statusCode: 502 });
  }
  return price.id;
}

/** Create a Stripe Checkout session and return its hosted payment URL. */
export async function createCheckoutSession({
  items, hostingPlan, email, origin,
  termsVersion = TERMS_VERSION,
  privacyVersion = PRIVACY_VERSION,
}, env = process.env) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw Object.assign(new Error('Checkout is not configured'), { statusCode: 503 });
  const plan = HOSTING_BY_PLAN[hostingPlan];
  if (!plan) throw Object.assign(new Error('Choose a valid monthly hosting plan'), { statusCode: 400 });
  const hostingPriceId = await ensureHostingPrice(plan, key);

  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const suffix = Array.from(randomBytes(8), value => alphabet[value % alphabet.length]).join('');
  form.set('integration_identifier', `felican_starter_pack_${suffix}`);
  form.set('customer_email', email);
  form.set('success_url', `${origin}/thank-you/?session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${origin}/checkout/`);
  form.set('metadata[items]', items.join(','));
  form.set('metadata[purpose]', COMBINED_CHECKOUT_PURPOSE);
  form.set('metadata[hosting_plan]', plan.id);
  form.set('metadata[terms_accepted]', 'true');
  form.set('metadata[terms_version]', termsVersion);
  form.set('metadata[privacy_version]', privacyVersion);
  form.set('metadata[terms_accepted_at]', new Date().toISOString());
  form.set('subscription_data[metadata][managed_by]', 'ai-generator');
  form.set('subscription_data[metadata][hosting_plan]', plan.id);
  form.set('subscription_data[metadata][starter_pack_items]', items.join(','));

  items.forEach((id, i) => {
    const product = CATALOG[id];
    form.set(`line_items[${i}][quantity]`, '1');
    form.set(`line_items[${i}][price_data][currency]`, 'usd');
    form.set(`line_items[${i}][price_data][unit_amount]`, String(product.amount));
    form.set(`line_items[${i}][price_data][product_data][name]`, product.name);
    form.set(`line_items[${i}][price_data][product_data][description]`, product.blurb);
  });
  form.set(`line_items[${items.length}][price]`, hostingPriceId);
  form.set(`line_items[${items.length}][quantity]`, '1');

  const session = await stripeRequest('/checkout/sessions', { method: 'POST', form, key });
  if (!session?.url) throw Object.assign(new Error('Stripe did not return a payment link'), { statusCode: 502 });
  return { url: session.url, id: session.id };
}

/** Look a session up after the customer comes back. Only paid orders are returned. */
export async function fetchOrder(sessionId, env = process.env) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw Object.assign(new Error('Checkout is not configured'), { statusCode: 503 });
  if (!/^cs_[A-Za-z0-9_]{10,120}$/.test(String(sessionId || ''))) {
    throw Object.assign(new Error('Invalid order reference'), { statusCode: 400 });
  }

  const session = await stripeRequest(`/checkout/sessions/${sessionId}`, { key });
  if (session.payment_status !== 'paid') {
    throw Object.assign(new Error('That order has not been paid yet'), { statusCode: 402 });
  }
  const order = orderFromCheckoutSession(session);
  if (!order) throw Object.assign(new Error('Invalid paid order'), { statusCode: 400 });
  return order;
}

/** Build the same paid-order shape directly from a verified webhook session. */
export function orderFromCheckoutSession(session) {
  if (!session?.id || session.payment_status !== 'paid') return null;
  const items = String(session.metadata?.items || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!items.length || items.some(id => !CATALOG[id]) || new Set(items).size !== items.length) return null;
  if (items.includes('pack') && items.length !== 1) return null;
  const metadata = session.metadata || {};
  const plan = HOSTING_BY_PLAN[String(metadata.hosting_plan || '')];
  const combined = metadata.purpose === COMBINED_CHECKOUT_PURPOSE;
  if (combined && (!plan || session.mode !== 'subscription')) return null;
  if (!combined && metadata.hosting_plan) return null;
  const amountCents = Math.round(Number(session.amount_total) || 0);
  const productTotalCents = items.reduce((sum, id) => sum + CATALOG[id].amount, 0);
  const expectedCents = productTotalCents + (combined ? plan.amount : 0);
  if (amountCents !== expectedCents || String(session.currency || '').toLowerCase() !== 'usd') return null;
  return {
    id: String(session.id),
    email: String(session.customer_details?.email || session.customer_email || ''),
    items,
    hostingPlan: combined ? plan.id : '',
    productTotalCents,
    total: Math.round(amountCents / 100),
    amountCents,
    currency: 'usd',
    paidAt: session.created ? new Date(session.created * 1000).toISOString() : new Date().toISOString(),
    termsVersion: String(metadata.terms_version || ''),
    privacyVersion: String(metadata.privacy_version || ''),
    termsAcceptedAt: String(metadata.terms_accepted_at || ''),
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** The welcome email — the last step of the buying journey. */
export function buildWelcomeEmail({ items, total, hostingPlan = '', setupUrl }) {
  const bought = items.map(id => CATALOG[id]?.name).filter(Boolean);
  const isPack = items.includes('pack');
  const hosting = HOSTING_BY_PLAN[hostingPlan];
  const productTotal = Number(total) - (hosting ? hosting.amount / 100 : 0);
  const subject = isPack
    ? 'Welcome to Felican AI — set up your Starter Pack'
    : `Welcome to Felican AI — set up your ${bought[0] || 'AI'}`;

  const text = [
    'Welcome to Felican AI.',
    '',
    "Your payment came through and your AI is ready to be built. It doesn't exist yet —",
    'you make it, and it takes about five minutes.',
    '',
    'Set it up here:',
    setupUrl,
    '',
    'What happens next',
    '  1. Open the link above and enter your business details.',
    '  2. Paste your website and add anything else it should know — price lists,',
    '     policies, service menus, hours.',
    '  3. Review it. It is ready and running in a few minutes.',
    '',
    `You bought: ${bought.join(', ')}`,
    hosting
      ? `Paid today: $${Number(total).toLocaleString('en-US')} ($${productTotal.toLocaleString('en-US')} product purchase + first month of ${hosting.name} hosting)`
      : `Paid today: $${Number(total).toLocaleString('en-US')} (one-time)`,
    '',
    ...(hosting ? [
      `${hosting.name} hosting is active at $${hosting.amount / 100}/month and renews monthly until canceled.`,
      `It includes ${hosting.allowance} per monthly usage period. There are no automatic`,
      'overage charges; only the feature that reaches its limit pauses.',
    ] : [
      'Hosting is activated separately inside your workspace.',
    ]),
    '',
    'Questions, or want a hand with the setup? Reply to this email, write to',
    'ai@felican.ai, or call +1 561-235-0799 and a person will pick up.',
    '',
    '— Lee and Legend, Felican AI',
  ].join('\n');

  const html = `<div style="margin:0;background:#080E13;padding:32px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;background:#101E24;border:1px solid #1C2A28;border-collapse:separate">
  <tr><td style="padding:34px 32px 8px">
    <p style="margin:0;font:700 12px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8FE0C8">Welcome to Felican AI</p>
    <h1 style="margin:16px 0 0;font:800 30px/1.12 'Helvetica Neue',Arial,sans-serif;letter-spacing:-.02em;color:#EEF4F4">Your AI is ready to be built.</h1>
    <p style="margin:16px 0 0;font:400 16px/1.65 'Helvetica Neue',Arial,sans-serif;color:#C2D2D4">
      Payment received &mdash; thank you. Your AI doesn't exist yet: you're about to make it, and it takes about five minutes.
    </p>
  </td></tr>
  <tr><td style="padding:24px 32px 0">
    <a href="${escapeHtml(setupUrl)}" style="display:block;padding:17px 24px;background:#2FB894;color:#080E13;font:700 17px/1 'Helvetica Neue',Arial,sans-serif;text-align:center;text-decoration:none">Set up my AI &rarr;</a>
    <p style="margin:12px 0 0;font:400 13px/1.6 'Helvetica Neue',Arial,sans-serif;color:#7B9298;word-break:break-all">Or paste this into your browser: ${escapeHtml(setupUrl)}</p>
  </td></tr>
  <tr><td style="padding:28px 32px 0">
    <p style="margin:0 0 12px;font:700 12px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8FE0C8">What happens next</p>
    <p style="margin:0 0 10px;font:400 15px/1.6 'Helvetica Neue',Arial,sans-serif;color:#C2D2D4"><strong style="color:#2FB894">1.</strong> &nbsp;Open the link and enter your business details.</p>
    <p style="margin:0 0 10px;font:400 15px/1.6 'Helvetica Neue',Arial,sans-serif;color:#C2D2D4"><strong style="color:#2FB894">2.</strong> &nbsp;Paste your website and add anything it should know &mdash; prices, policies, hours.</p>
    <p style="margin:0;font:400 15px/1.6 'Helvetica Neue',Arial,sans-serif;color:#C2D2D4"><strong style="color:#2FB894">3.</strong> &nbsp;Review it. It is ready and running in a few minutes.</p>
  </td></tr>
  <tr><td style="padding:28px 32px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #1C2A28;border-collapse:collapse">
      ${bought.map(n => `<tr><td style="padding:12px 0 0;font:400 15px/1.5 'Helvetica Neue',Arial,sans-serif;color:#EEF4F4">${escapeHtml(n)}</td></tr>`).join('')}
      <tr><td style="padding:14px 0 0;font:700 15px/1.5 'Helvetica Neue',Arial,sans-serif;color:#EEF4F4">Paid today &mdash; $${Number(total).toLocaleString('en-US')}${hosting ? ` ($${productTotal.toLocaleString('en-US')} product purchase + first month of ${escapeHtml(hosting.name)} hosting)` : ' one-time'}</td></tr>
      <tr><td style="padding:6px 0 0;font:400 13.5px/1.6 'Helvetica Neue',Arial,sans-serif;color:#7B9298">${hosting ? `${escapeHtml(hosting.name)} hosting is active at $${hosting.amount / 100}/month and renews monthly until canceled. It includes ${escapeHtml(hosting.allowance)} per monthly usage period. No automatic overage charges; only the feature that reaches its limit pauses.` : 'Hosting is activated separately inside your workspace.'}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:26px 32px 34px">
    <p style="margin:0;padding-top:22px;border-top:1px solid #1C2A28;font:400 14px/1.65 'Helvetica Neue',Arial,sans-serif;color:#8FA3A8">
      Want a hand with the setup? Just reply to this email, write to
      <a href="mailto:ai@felican.ai" style="color:#2FB894">ai@felican.ai</a>, or call
      <a href="tel:+15612350799" style="color:#2FB894">+1 561-235-0799</a> &mdash; a person picks up.
    </p>
    <p style="margin:18px 0 0;font:400 14px/1.6 'Helvetica Neue',Arial,sans-serif;color:#7B9298">&mdash; Lee and Legend, Felican AI</p>
  </td></tr>
</table></div>`;

  return { subject, text, html };
}

/** Send the welcome email through Resend (same provider the contact form uses). */
export async function sendWelcomeEmail({ email, items, total, hostingPlan = '', setupUrl, id }, env = process.env) {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('Welcome email is not configured');
  const from = (env.CONTACT_FROM || 'Felican AI <website@felican.ai>').trim();
  const { subject, text, html } = buildWelcomeEmail({ items, total, hostingPlan, setupUrl });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(id ? { 'Idempotency-Key': `starter-pack-welcome/${id}` } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({ from, to: [email], reply_to: 'ai@felican.ai', subject, text, html }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
    }
    return await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

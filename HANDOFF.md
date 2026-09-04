# HANDOFF — AI Business Starter Pack (the buying journey)

Read this top to bottom before touching code. It is the whole spec plus the
current state. Everything below marked LOCKED was decided by the owner and is
not up for redesign.

---

## 0. Where things are (do this first)

All code is on this machine. Nothing to clone.

```
~/dev/felican-ai-website/     the website — all the work below lives here
~/dev/private-ai-generator/   Lee's generator (read-only reference, do NOT modify)
~/dev/starter-pack/           planning: PLAN.md, video script, page copy
```

Run the site locally:

```bash
cd ~/dev/felican-ai-website
STATIC_ROOT=./public PORT=4174 node server/index.js
# open http://localhost:4174/starter-pack/
```

Run the tests (they must stay green — 102 of them):

```bash
cd ~/dev/felican-ai-website && npm test
```

To make payment actually work locally, add a Stripe test key:

```bash
STATIC_ROOT=./public PORT=4174 STRIPE_SECRET_KEY=sk_test_... node server/index.js
```

**Git state:** all of this is uncommitted work in the working tree on `main`.
Commit, push, and deploy only when the owner asks. DEV is the validation target;
production requires a separate, explicit release request.

---

## 1. What is being sold — LOCKED

Three AI products for small and local businesses, sold on one tab of felican.ai.

| Product | Price |
|---|---|
| Private AI | $999 one-time |
| Chat AI Assistant | $999 one-time |
| Voice AI | $999 one-time |
| **AI Business Starter Pack** (all three) | **$2,500 one-time** |

Customers choose Essentials ($50/month), Growth ($100/month), or Scale
($200/month) with their product. Stripe charges the one-time product price plus
the first month of the selected hosting plan in one subscription Checkout; only
hosting renews monthly. There are no automatic usage overages.

**Naming rule — LOCKED.** Products are named exactly `Private AI`,
`Chat AI Assistant`, `Voice AI`. Do NOT append "Starter" to any product
name. The word "Starter" appears only in the tab/bundle name
"AI Business Starter Pack".

**What the $999 tier includes:** 1 custom model max, 1 free OpenRouter model,
1 automation, live web search. No image or video generation. No tools other than
web search. Lower usage and storage than the larger offering.

**Copy rules — LOCKED.**
- Never mention the enterprise offering, the $25,000 product, or any comparison
  to it, anywhere on these pages.
- Never name a weekday ("by Thursday"). The setup promise is "ready and
  running in a few minutes".
- Cart and pricing appear ONLY on `/starter-pack/`. The other 22 products on
  `/products/` stay as they are, unpriced, with "Ask about it" CTAs.

---

## 2. The user story this implements

```
felican.ai  →  /starter-pack/  →  add to cart  →  /checkout/  →  Stripe
     →  /thank-you/  →  button to the generator  →  welcome email
```

1. Visitor lands on the Starter Pack tab from the site nav.
2. Adds one product, or the bundle, to a cart. Cart lives in `localStorage`.
3. `/checkout/` reviews the cart and takes their email.
4. `POST /api/checkout` validates server-side and creates a Stripe Checkout
   session. Visitor pays on Stripe's own hosted page.
5. Stripe returns them to `/thank-you/?session_id=...`.
6. That page calls `GET /api/order`, which verifies the session with Stripe and
   fires the welcome email through Resend.
7. Thank-you page and the email both carry the link to the generator.

The generator itself is a SEPARATE project owned by Lee. Do not build it.
This work stops at handing the buyer a link to it.

---

## 3. What is already built

| File | Purpose |
|---|---|
| `public/starter-pack/index.html` | Conversion page. Product cards with generated covers, bundle, cart, FAQ |
| `public/starter-pack/images/` | Generated cover artwork for the three products |
| `public/starter-pack/shared.css` | Design tokens shared by the three new pages |
| `public/checkout/index.html` | Cart review, email capture, redirect to Stripe |
| `public/thank-you/index.html` | Confirmation + link to the generator |
| `server/checkout.js` | Product catalog (prices), cart validation, Stripe REST, welcome email |
| `server/orders.js` | Durable, atomic order records and welcome-email state |
| `server/checkout.test.js` | Cart, Stripe signature, API request, and welcome-email tests |
| `server/orders.test.js` | Durable order and restart-idempotency tests |
| `server/app.js` | Added checkout, order lookup, and signed webhook routes |
| `public/SiteNav.dc.html` | "Starter Pack" added to the site-wide nav |
| `.env.example` | Documents Stripe, webhook, order-store, and site-origin settings |

### Things you must not break

- **Prices live only in `server/checkout.js`.** The browser sends product ids,
  the buyer email, the plan id, and terms acceptance, but never a price, total,
  or amount. `normalizeOrder()` rejects unknown ids, empty carts, bad emails,
  missing legal consent, duplicates, and oversized carts, and collapses a cart
  containing the pack down to the pack alone. The server calculates every charge.
- **Graceful degradation.** With no `STRIPE_SECRET_KEY`, `/api/checkout` returns
  503 with a friendly message and the rest of the site is unaffected. This
  mirrors how `/api/contact` behaves without a Resend key. Keep that behaviour.
- **The welcome email is idempotent per session id** in the durable order store,
  with a matching Resend idempotency key as protection across concurrent triggers.
- `npm test` must stay green. It is 148 tests including the existing suite.

### The site's own conventions

- Live pages are the static HTML files under `public/`, rendered through the
  `<x-dc>` canvas runtime in `public/support.js`. `src/site.jsx` is a separate
  React file and is NOT the live products page — do not confuse them.
- The three new pages are deliberately plain self-contained HTML so they do not
  depend on that canvas runtime.
- Palette: bg `#080E13`, panel `#101E24`, border `#1C2A28`, text `#EEF4F4`,
  muted `#8FA3A8`, accent `#2FB894`, accent-hover `#59D4B4`, soft `#8FE0C8`.
  Fonts: Sora for headings, Inter for body. Square corners, not rounded.

---

## 4. What is NOT built — the remaining work, in priority order

**1. Set `STRIPE_SECRET_KEY` and take one real test payment end to end.**
Nothing else blocks going live. Verify: card entry, redirect back, thank-you page
shows the order, welcome email arrives. Production reads env from
`/opt/felicanai-site/config/ai.env`.

**2. Configure and exercise the Stripe webhook (`/api/stripe-webhook`).**
The endpoint is built: it verifies the raw-body signature with
`STRIPE_WEBHOOK_SECRET`, handles `checkout.session.completed`, persists the paid
order, and sends the welcome email. The thank-you path remains a fallback and
both triggers share durable idempotency. Create the Stripe endpoint and exercise
it with a real test checkout.

**3. Verify the production order-store mount.**
Orders now persist as private JSON containing session id, email, items, amount,
currency, payment time, and welcome status. Deploy scripts mount
`/opt/felicanai-site/orders/` into the read-only container. Verify the file is
written during the end-to-end test and include that host directory in backups.

**4. Generator URL — wired for DEV validation.**
`GENERATOR_URL` in `public/thank-you/index.html` points to
`https://app.felican.dev/claim`. The Stripe session id is appended as `order`.
The generator verifies that order server-side and emails the buyer a personal,
one-time setup link; the order id alone is never a login. Welcome emails link
directly to the same claim endpoint through `GENERATOR_APP_URL`.

**5. The 45-second demo video — built and published on DEV.**
The finished demo runs silently behind the hero and opens with sound in a full
player. The Starter Pack card on `/products/` also uses the video preview.

**6. Hosting subscription — included in the initial Checkout.**
The Starter Pack checkout combines the one-time product charge with the first
month of Essentials ($50), Growth ($100), or Scale ($200). Only hosting renews.
The separate `~/dev/ai-generator/` project recognizes that subscription before
generation and provides a managed Stripe billing portal, payment-failure
suspension/recovery, and fixed plan switching with no metered overage charges.
Stripe remains in test mode; production is untouched.

**7. Usage, storage, alerts, and operations — built for DEV validation.**
Essentials includes 25 GB uploaded-file storage, 2,000 website-assistant replies,
100 Voice AI minutes, and $10 of Private AI model processing per monthly usage
period. Growth and Scale raise all four allowances. The generator enforces the
limits, shows them in the customer dashboard, warns at 80/95/100%, sends urgent
alerts to `ai@felican.ai`, and includes DEV backup/monitoring services. See
`~/dev/ai-generator/docs/STARTER_PACK_OPERATIONS.md` for the policy and remaining
production gates.

---

## 5. Open questions for the owner

- More models, more automations, image generation, and video generation are
  paid add-ons. Say so clearly before linking customers to the contact form.
- Does Voice AI ever send SMS? If yes, A2P 10DLC registration is
  required and takes weeks — start it immediately.
- Terms, Privacy, explicit checkout consent, refund rules, 30-day post-hosting
  retention, and the liability cap now have a September 4, 2026 baseline.
- The customer-facing legal entity is Felican AI Inc.; notices use its Montana
  mailing address, and the Terms select Florida law and Palm Beach County venue.
  Before production, owner/counsel should confirm whether any restricted
  industries need exclusions.
- Confirm tax registrations and product tax codes before enabling Stripe Tax.

---

## 6. State of the code

Uncommitted working-tree changes on `main`. Nothing committed, nothing pushed,
nothing deployed. Ask the owner before committing.

Changed existing files: `server/app.js`, `public/SiteNav.dc.html`, `.env.example`.
Everything else listed in section 3 is a new file.

# HANDOFF — AI Business Starter Pack (the buying journey)

Read this top to bottom before touching code. It is the whole spec plus the
current state. Everything below marked LOCKED was decided by the owner and is
not up for redesign.

---

## 0. Where things are (do this first)

All code is on this machine. Nothing to clone.

```
~/Dev/Projects/felican-ai-website/     the website — all the work below lives here
~/Dev/Projects/private-ai-generator/   Lee's generator (read-only reference, do NOT modify)
~/Dev/Projects/starter-pack/           planning: PLAN.md, video script, page copy
```

Run the site locally:

```bash
cd ~/Dev/Projects/felican-ai-website
STATIC_ROOT=./public PORT=4174 node server/index.js
# open http://localhost:4174/starter-pack/
```

Run the tests (they must stay green — 226 of them):

```bash
cd ~/Dev/Projects/felican-ai-website && npm test
```

To make payment actually work locally, add a Stripe test key:

```bash
STATIC_ROOT=./public PORT=4174 STRIPE_SECRET_KEY=sk_test_... node server/index.js
```

**Git state:** committed and pushed on `main`. See section 6 for the current
commit. DEV is the validation target; production promotion requires the owner's
explicit approval each time.

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
- `npm test` must stay green. It is 226 tests across 12 files.

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

## 4. Remaining work — as of September 11, 2026

Sections 1-3 are built, committed, and pushed. Everything below is current.

**Nothing blocks launch.** `scripts/preflight-prod.sh` ran green on this date:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_ORIGIN`,
`GENERATOR_HANDOFF_SECRET`, and `RESEND_API_KEY` are all present on prod, the
`felican.ai` proxy host (id 4) has a single `set $server` line so the deploy's
`sed` cannot catch a custom location, and all six path apps returned 200.

A Starter Pack purchase has already been taken through Stripe successfully. The
earlier version of this handoff listed that as an unverified blocker; it is not.

Still worth doing, none of it blocking:

1. **Watch the first real production order end to end.** Confirm the durable
   record lands in `/opt/felicanai-site/orders/` and that the welcome email
   fires once, not twice (thank-you page and webhook share idempotency).
2. **Add `/opt/felicanai-site/orders/` to server backups.** It holds the only
   durable payment record and the welcome-email marker.
3. **First-hour watch** — see `docs/PRODUCTION-LAUNCH.md`.
4. **Two owner checks only a human can do:** place a real call to the published
   phone number to confirm routing, transfer, and the promised emails; and open
   `https://felican.ai/contact/` to confirm a fourth card appears beside Email,
   Phone, and Book a call. A missing card means the tawk.to domain allowlist
   lacks `felican.ai` / `www.felican.ai` — a dashboard setting, not a deploy bug.
5. **Registry drift, low risk:** `~/felican-infra/deploy/apps.json` lists
   `"container": "felicanai-site"` for felicanai, but the live prod container is
   named `felicanai`. `felicanai-site` is a retained legacy container. HTTP
   verification passes either way, but a container-name-based check would
   inspect the wrong one.

## 5. Owner decisions — settled September 11, 2026

- **Add-on pricing: set.** Extra custom model $299 one-time, extra automation
  $199 one-time, image generation $40/month, video generation $90/month.
  One-time add-ons are charged with the purchase; monthly add-ons join the
  hosting plan, which preserves the "no surprise overage" promise. These appear
  on `/starter-pack/` and in its FAQ, and are asserted in
  `src/static-redesign.test.js`.
- **Voice AI does not send SMS.** No A2P 10DLC registration is needed. Do not
  add SMS to Voice AI without revisiting this — it would take weeks to register.
- **Restricted-industry exclusions: not being pursued.** Owner's call.
- **Stripe Tax: stays disabled.** Do not enable it.
- Terms, Privacy, checkout consent, refund rules, 30-day post-hosting retention
  and the liability cap have a September 4, 2026 baseline. The customer-facing
  entity is Felican AI Inc.; notices use its Montana mailing address; Terms
  select Florida law and Palm Beach County venue.

## 6. State of the code

Clean working tree on `main`, in sync with `origin/main`.
`npm test` is green at 226 tests across 12 files.

**Production is live on `ded694e`.** Promoted 2026-09-12T02:32:40Z as release
`felicanai-site:20260912T023240Z`. `/api/health` and `/api/ready` both OK,
`felican.ai/robots.txt` serves `Allow: /`, and all six path apps stayed 200
through the promotion. Rollback point: `felicanai:rollback-20260912-023240`
(`python3 ~/felican-infra/deploy/deploy rollback felicanai`).

**Trap that nearly shipped stale content:** `scripts/deploy-dev.sh` used to only
assert `dist/client/index.html` existed. A stale `dist/` satisfied it, Docker
cached the COPY layer, and DEV served the previous commit while all sixteen smoke
checks returned 200 — and `deploy-prod.sh` streams the DEV-verified image, so it
would have reached production through a green gate. The script now runs
`npm run build` itself. Do not turn that back into an existence check.

Deploys go through `python3 ~/felican-infra/deploy/deploy` — DEV first, then
`to-prod felicanai`, which verifies the exact commit already running on DEV.
Read `docs/PRODUCTION-LAUNCH.md` before any promotion.

## History

- 2026-09-11 — Priced the four add-ons on the Starter Pack page, confirmed the
  prod preflight is green, and promoted to production. Corrected this handoff:
  the earlier copy claimed uncommitted work, 148 tests, and an unverified
  Stripe path, none of which were true. Paths are `~/Dev/Projects/`, not
  `~/dev/`.

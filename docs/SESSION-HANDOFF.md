# Session handoff — 2026-09-11

> **Note on location.** The `/handoff` convention writes to `HANDOFF.md` at the repo
> root, but in this repo that file is the locked **AI Business Starter Pack product
> spec**, which `AGENTS.md` says to read in full before writing code. Overwriting it
> would destroy that spec, so the session handoff lives here instead. Do not move it.

**Branch:** `main` (the `seo-foundation` branch is merged; it can be deleted)
**Pushed:** yes, `origin/main`
**Deployed:** DEV and PROD both live — see *Deploy state* below
**Working tree:** clean

---

## What this session did

felican.ai was invisible to search. `https://felican.ai/robots.txt` served a site-wide
`Disallow: /`, and had for as long as the company site has been on the apex. A Cloudflare
Worker named `felican-robots-grrr` was bound to that route and returned a hardcoded file
written back when the apex hosted only the `/Lehem-Felican-Jr` profile. The correct
handler in `server/app.js` was never reached. On top of it, Cloudflare's managed
robots.txt blocked GPTBot, ClaudeBot, CCBot, Google-Extended and others.

That is fixed, and the site went from 13 pages to 86.

**Read `docs/SEO.md` first.** It is the real documentation: the pipeline, who owns what,
the Cloudflare changes (with before-values in `.cf-backup/`), the three template traps,
the assistants, and everything still outstanding. This file is only the session summary.

### Shipped

- **robots.txt** — owned by `server/app.js`, in git, names the AI retrieval crawlers
  explicitly. `server/seo.test.js` asserts production never again emits a bare
  `Disallow: /` while `felican.dev` keeps one.
- **73 generated pages** from `content/*.js` — 18 products, 10 services, 7 industries,
  3 pillar guides + 9 supporting articles, 4 comparisons, 10 client pages, 4 books, a
  Palm Beach County page. Plain static HTML so text-only crawlers see the prose.
- **Schema** — one generated Organization/Person/WebSite graph, Breadcrumb, Product with
  real Offers, Service, Article, Book, ItemList, ProfessionalService.
- **Images** — 17.7 MB of PNG/JPG now also ship as AVIF/WebP (3.4 MB), offered per-URL.
- **Pricing** — every product page lists $999, generated from `server/checkout.js`.
- **Services renamed** to the owner's four customer-facing names; `/services/` gained the
  Schedule a call CTA it never had.
- **Both assistants** are generated from the site content, stream, stay brief, offer
  follow-ups, and answer only about Felican AI.
- **Voice** greets first: "Hi, this is Felican AI. How can I help?"
- **Founder entity** — bio on `/about/`, `/Lehem-Felican-Jr` in the sitemap, Person node
  with LinkedIn + Resolution Economics.
- **Google Search Console + Bing** verified, sitemaps submitted (86 URLs).

---

## Deploy state

| | |
|---|---|
| PROD release | `20260911T174301Z` (commit `760b413`), plus the follow-up promotion of `cc7379f` |
| PROD rollback | `python3 ~/felican-infra/deploy/deploy rollback felicanai` |
| DEV | running the same commit as `main` |
| Deploy path | **always** `python3 ~/felican-infra/deploy/deploy to-prod felicanai` — `scripts/deploy-prod.sh` refuses without `FELICAN_CANONICAL_DEPLOY=1`, and gates on DEV running the exact local commit |

`npm run seo` is idempotent — two runs produce byte-identical output. Run it after
editing anything in `content/`.

---

## Pick up here

In rough priority order. The first is the only one that is genuinely blocking.

1. **Company social profiles.** `SOCIAL` in `content/site.js` still has empty strings for
   the company's LinkedIn, YouTube, X, Facebook, Instagram and GitHub. `sameAs` is what
   separates Felican AI from Felician University, felican.net and felican.in in Google's
   entity graph. Fill in real URLs, run `npm run seo`, deploy. Empty entries are skipped,
   so nothing fake ships — and **only add a URL that genuinely belongs to the company**;
   a wrong one actively teaches Google the wrong entity. The founder's own `sameAs` is
   already done.

2. **The $999 pricing risk.** Only `private-ai`, `assistant` and `receptionist` are wired
   into checkout. The other 15 product pages display $999 and carry `Offer` markup but
   route to the contact form, so a buyer cannot actually complete that purchase. Google
   treats an `Offer` as a real purchasable price. Resolve by either adding them to
   `CATALOG` in `server/checkout.js`, or reverting those pages to `SoftwareApplication`
   markup which needs no price. This was the owner's explicit decision after the
   trade-off was put to them — it is a business call, not an oversight, but it should not
   sit open indefinitely. Details in `docs/SEO.md`.

3. **Google Business Profile.** Not created yet. Configure as a **service-area business**
   for Palm Beach / Broward / Miami-Dade with no street address, matching the
   `ProfessionalService` markup on `/locations/palm-beach-county/`. Publishing an address
   there would contradict it.

4. **Watch indexing.** Both consoles have the 86-URL sitemap. Expect "Discovered –
   currently not indexed" for a while; that is normal for a site this new. The homepage
   is already indexed. Use URL Inspection to request indexing on `/`, `/products/`,
   `/starter-pack/` and `/guides/private-ai/`.

5. **Smaller things**, all in `docs/SEO.md`: the unreferenced 13.5 MB
   `felican-ai-starter-pack-demo-v2.mp4` (needs the owner's OK to delete), fonts still
   loaded from `fonts.googleapis.com` in the critical path, and Firefox/WebKit Playwright
   browsers not installed on this machine so only chromium was exercised.

---

## Traps — do not re-learn these the hard way

Each cost real time this session and each is guarded now.

- **`support.js` pins `html, body, #dc-root, .sc-host` to `height:100%`.** The page then
  cannot scroll at all. `public/content.css` releases it at the top.
- **The `<x-dc>` runtime strips the `hidden` attribute.** The mobile nav toggles with an
  `.is-open` class. Never `hidden`, never a checkbox.
- **Cloudflare ignores `Vary: Accept`.** An earlier attempt served AVIF to every client
  including browsers that cannot decode it. Formats are offered per-URL instead.
- **`content.css` is served `max-age=86400`.** Its link carries `?v=<sha256>`; without
  that, a deploy leaves the CDN serving yesterday's stylesheet for a day. This made three
  consecutive *correct* fixes all appear to fail. Do not remove the stamp.
- **Never edit a generated `index.html`.** Each carries a banner naming the script. Edit
  `content/*.js` and run `npm run seo`.
- **Keep `SiteNav.dc.html` / `SiteFooter.dc.html` in sync with `content/site.js`.** They
  are the only link path from the hand-written pages into the new sections.

## Credentials touched

Google Search Console is verified by a DNS TXT record on the felican.ai apex
(`google-site-verification=...`). **Deleting it loses verification.** Cloudflare changes
are listed in `docs/SEO.md` with their previous values saved in `.cf-backup/`.

# Session handoff — 2026-09-20

> Last updated: 2026-09-20 by Claude Code (Opus 5, 1M context) · Branch: `feat/animated-assistant` · Commit: see `git log -1`
> Next session: read this file FIRST, then `git log --oneline -10`. Do not re-scan the codebase.

> **Note on location.** The `/handoff` convention writes to `HANDOFF.md` at the repo
> root, but in this repo that file is the locked **AI Business Starter Pack product
> spec**, which `AGENTS.md` says to read in full before writing code. Overwriting it
> would destroy that spec, so the session handoff lives here instead. Do not move it.

---

## 0a. 2026-09-20 — owner's five fixes — **IN PRODUCTION** (`a2e0874`, release `20260920T212347Z`)

Promoted 2026-09-20T21:24Z via `deploy to-prod felicanai`, independently verified (health, ready,
new component served, /sms/ 200, robots Allow, chat answers Growth plan, all six co-hosted
routes 200). Rollback: `python3 ~/felican-infra/deploy/deploy rollback felicanai` →
`felicanai:rollback-20260920-212347`. `main` = `feat/animated-assistant` = `sms-terms` + this work.

1–4 (mascot): **never leaves the screen.** Rides edge to edge (`translateX(12px)` ↔
`calc(100vw − 162px)`), `fa-poof` at the edge (smoke `<i>` puffs + `fa-vanish`), then
`ride()` respawns the next character at that edge heading back; no rest, no off-screen
time. Hides only while the panel is open; `closePanel()` brings it back in 350 ms.
Rides on top of the Starter Pack cart bar via `--fa-bot-bottom` (set in
`syncAssistantOffset`). **The pill launcher is hidden** (`SHOW_LAUNCHER_ALWAYS = false`)
and returns on its own for reduced-motion or if a mascot SVG errors (`botFailed`);
`.fa-nolauncher` on the shell re-budgets panel height (`100vh − 110px`). Lap-end
guard: only `animationend` for `fa-cross-<current dir>` counts (background tabs
deliver stale ones late).

5 (from Fiona, `~/Dev/Projects/Wellington/wellingtonwire/api/{agent,chat_guard,output_guard}.py`):
- **Agentic retrieval**: `ASSISTANT_TOOLS` (`search_site`, `read_page`) in
  `server/assistant-retrieval.js`; the loop is `streamWithConfiguredProvider` in
  `server/app.js` (`streamAnthropicRound` decodes tool_use blocks; max 3 rounds, last
  round without tools). BM25 pre-injection stays as the fast path. **Verified through
  Asher on DEV**: two parallel `read_page` calls in one round, 12 s total. If a provider
  400s on `tools`, it retries without and sets `providerRejectsTools` for the process.
  Kill switch: `ASSISTANT_TOOLS=off`.
- **Status frames**: SSE `event: status` (narration held ≤100 chars becomes a status,
  plus each tool's label) → `.fa-status` under the typing dots.
- **Topic gate** (`server/assistant-guard.js` `offTopicGate`): general-purpose requests
  with no on-topic term are refused with no model call (logged `chat.offtopic`, 1 ms);
  follow-ups inside a conversation always pass.
- **Confidentiality**: `BACKEND_CONFIDENTIALITY` in the prompt + `redactInternals()` in
  `sanitizeAssistantReply`. Vocabulary is deliberately narrow — the site legitimately
  says Claude/GPT/OpenAI/Anthropic (Ora, CrossCheck, certifications); do not widen it
  to vendor names.
- Tests 252/252 (`server/assistant-agent.test.js` runs the loop against a fake SSE
  provider; `assistant-guard.test.js`).

Not done / for the owner: mobile layout still unverified in a real phone browser (now live, so check on a phone).

## 0. Previous session (2026-09-19) — assistant overhaul, on DEV

Branch `feat/animated-assistant` (pushed; based on `sms-terms` = `main` + the SMS
terms page, which is what DEV was already running). **Deployed to felican.dev only.**
Not merged, not in production. Owner asked to see it on DEV first.

What changed, all verified on felican.dev by direct curl and in Chrome:

- **Animated mascot.** `public/bot/{walk,surf,drive,fly}.svg` — one robot, four rides,
  each SVG animates internally (legs, board, wheels, jet flames) and is loaded via
  `<img>` because the `<x-dc>` runtime has no inline-SVG precedent. The crossing is CSS
  (`fa-cross-ltr/rtl`) on `.fa-bot`, fixed at `bottom:76px` = the gold `.fa-cred` bar
  height, `z-index:940` so it passes behind the launcher. Lap ends on `animationend`
  (delegated on `document`, so re-mounts are fine) with a 40 s fallback. Rests 18 s,
  60 s after the chat has been opened; never runs while the panel is open, the tab is
  hidden, or `prefers-reduced-motion`. Hover pauses + "Click to chat with me".
  `BOT_VERSION` in `ChatAssistant.dc.html` must be bumped when an SVG changes — the
  server serves them `immutable` for a year.
- **Grand open.** Panel 640×780 (was 430×650), spring-scale entrance (`fa-grand`) over a
  blurred backdrop (`.fa-backdrop`, click closes), expand button ⤢ → `fa-wide`
  (1100px, full height). Height budget is `100vh − 196px` (shell 94 + launcher 72 +
  gap 14 + 16 safe); the old `− 124px` overflowed the top on short viewports.
  `public/starter-pack/index.html` cart-mode cap raised 650 → 780 to match.
- **Smarter bot — retrieval.** `scripts/build-assistant-knowledge.mjs` now also emits
  `server/assistant-corpus.js` (67 chunks, full page text incl. product FAQs, guides,
  comparisons, case studies, the hand-written Starter Pack FAQ). `server/assistant-retrieval.js`
  scores them with BM25 per request (no deps, <1 ms) and `buildChatSystem()` in
  `server/app.js` appends the top 3 + the page the visitor is on. Client sends
  `page: {path, title}`; greeting and starter chips are page-aware (`pageContext()`).
  History cap 10 → 24, `max_tokens` 500 → 700. Direct-Anthropic path sends the static
  prompt as a `cache_control` block; **Asher (what DEV/PROD use) gets the plain string**
  because the block form is unverified there. Regenerate with `npm run build:assistant`.
- Tests: **245/245** (`npm test`), 3 new files/blocks. TruffleHog 0/0.

(Promoted 2026-09-20 — see 0a.)

**Chrome-testing gotcha on this Linux box:** the Claude-in-Chrome browser runs on
another machine, so a local server must be reached via this box's Tailscale IP
(`100.114.193.123:<port>`), and that Chrome window is usually in the background —
`document.hidden` is true (the mascot correctly refuses to run) and compositor-driven
CSS animations do not paint in screenshots even though `getAnimations()` reports them
running. Spoof `document.hidden`, then pause the animation (`a.pause(); a.currentTime=…`)
to make the main thread paint it before a screenshot.

---

## 1. Where we are

felican.ai is the company marketing site. The **AI Business Starter Pack** buying
journey — `/starter-pack/` → cart → `/checkout/` → Stripe → `/thank-you/` → generator
handoff — is **built, deployed, and live in production**. This session priced the
add-ons, promoted to production, and closed a deploy-pipeline bug that could have
shipped stale content to prod through a fully green gate. The product spec (locked
pricing, copy rules, what each tier includes) is `HANDOFF.md` in the repo root.

## 2. Done this session — all verified

- [x] **Add-on pricing is on the page.** Extra custom model **$299** one-time, extra
      automation **$199** one-time, image generation **$40**/month, video generation
      **$90**/month. On `/starter-pack/` (`public/starter-pack/index.html`, the
      `.addons` block) and in its FAQ. Asserted in `src/static-redesign.test.js:245`
      so the prices cannot silently drift.
- [x] **Production promoted and independently verified.** Commit `ded694e`, release
      `felicanai-site:20260912T023240Z`. Verified by direct curl, not just the deploy
      report: `/`, `/starter-pack/`, `/contact/` all 200; `/api/health` → `{"ok":true}`;
      `/api/ready` → `{"ok":true,"dependencies":{"ai":"configured","checkoutHandoff":"configured"}}`;
      all four add-on prices present in the served HTML; `felican.ai/robots.txt` serves
      `Allow: /` while `felican.dev` still serves `Disallow: /`.
- [x] **All six path apps survived the promotion** — `/relay`, `/quorum`, `/ora`,
      `/factory`, `/Lehem-Felican-Jr`, `/Lee-Felican-jr/books/resources/` were 200
      before and after. The proxy `sed` did not catch a custom location.
- [x] **Stale-`dist` deploy bug fixed** — see *Gotchas*. `scripts/deploy-dev.sh:30`.
- [x] **`scripts/preflight-prod.sh` ran fully green**, including `STRIPE_SECRET_KEY`,
      `STRIPE_WEBHOOK_SECRET`, `SITE_ORIGIN`, `GENERATOR_HANDOFF_SECRET`, `RESEND_API_KEY`
      all present on prod.
- [x] **`HANDOFF.md` corrected.** It claimed uncommitted work, 148 tests, `~/dev/` paths,
      and an unverified Stripe path — all false, and all of it misled the start of this
      session. Now accurate.
- [x] `npm test` — **226/226 across 12 files.** TruffleHog: **0 verified secrets**
      (47 unverified, every one inside `node_modules`).

## 3. In flight / NOT finished

Nothing is mid-stream. Working tree clean, no stash, single worktree, `main` in sync
with `origin/main`.

**One deliberate divergence to know about:** production runs `ded694e`, but `main` is
at `1667f1f`. The difference is tooling and docs only (`scripts/deploy-dev.sh`,
`docs/PRODUCTION-LAUNCH.md`, `HANDOFF.md`, `docs/SESSION-HANDOFF.md`) — nothing that
the site serves. **No redeploy is needed.** The next content deploy will carry it.

## 4. Next 3 actions (in order)

1. **Two checks only a human can do.** Place a real call to the published number and
   confirm it routes, transfers, and sends the promised emails. Then open
   `https://felican.ai/contact/` and confirm a fourth card appears beside Email, Phone
   and Book a call — if it is missing, the tawk.to **domain allowlist** needs
   `felican.ai` and `www.felican.ai` added in the tawk dashboard. That is a settings
   page, not a deploy bug. Both are required by `docs/PRODUCTION-LAUNCH.md`.
2. **Add `/opt/felicanai-site/orders/` to server backups.** It is mounted into the
   read-only container at `/data` and holds the only durable payment record plus the
   welcome-email idempotency marker. It is **not** currently backed up.
3. **Watch the first real production order end to end.** Confirm the JSON record lands
   in `/opt/felicanai-site/orders/` and the welcome email fires exactly once — the
   thank-you page and the Stripe webhook both trigger it and share durable idempotency,
   so a duplicate would mean that idempotency is broken.

## 5. Key decisions & why

- **Add-on prices set by Claude at the owner's instruction (2026-09-11).** One-time
  add-ons are a fraction of the $999 product; monthly add-ons sit at or below the $50
  Essentials step so they read as an increment rather than a second subscription.
  One-time items bill with the purchase, monthly items join the hosting plan — which is
  what keeps the page's "no surprise overage charges" promise truthful.
- **Voice AI does not send SMS.** Owner's decision. Therefore **no A2P 10DLC
  registration is needed.** Do not add SMS to Voice AI without revisiting this —
  registration takes weeks and would block the feature.
- **Restricted-industry exclusions: not being pursued.** Owner's call.
- **Stripe Tax stays disabled.** Do not enable it.
- **`deploy-dev.sh` builds rather than asserts.** Rationale in *Gotchas*. Do not
  "simplify" it back to an existence check.

## 6. Gotchas / traps

**New this session — the expensive one:**

- **A green deploy served the previous commit.** `scripts/deploy-dev.sh` asserted that
  `dist/client/index.html` *existed* but never built it. A `dist/` from hours earlier
  satisfied the check, Docker returned the `COPY dist/client/` layer `CACHED`, and all
  sixteen smoke checks returned 200 against **old HTML**. This is not a dev-only
  annoyance: `deploy-prod.sh` streams the exact image DEV verified, so a stale `dist/`
  on the operator's workstation reaches production through a fully green gate. Fixed at
  `scripts/deploy-dev.sh:30` — it now runs `npm run build` and fails the deploy if the
  build fails. **If you ever deploy by some other path, confirm the served page actually
  contains your change rather than trusting a 200.** Documented in
  `docs/PRODUCTION-LAUNCH.md` § 1b.

- **Registry drift, low risk.** `~/felican-infra/deploy/apps.json` lists
  `"container": "felicanai-site"` for felicanai, but the live prod container is named
  `felicanai`. `felicanai-site` is a retained legacy container. HTTP verification passes
  either way, but a container-name-based check would inspect the wrong container.

- **`HANDOFF.md` was stale enough to mislead a whole session start.** It listed Stripe
  as an unverified blocker long after a purchase had gone through. Keep it current or it
  actively costs time.

**Carried forward — each of these cost real time previously and each is guarded now:**

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
  `content/*.js` and run `npm run seo` (idempotent — two runs are byte-identical).
- **Keep `SiteNav.dc.html` / `SiteFooter.dc.html` in sync with `content/site.js`.** They
  are the only link path from the hand-written pages into the generated sections.

## 7. Environment & access

```bash
cd ~/Dev/Projects/felican-ai-website
npm test                                    # 226 tests, must stay green
STATIC_ROOT=./public PORT=4174 node server/index.js   # http://localhost:4174/starter-pack/
bash scripts/preflight-prod.sh              # read-only prod readiness check
```

| | |
|---|---|
| PROD | `https://felican.ai` — commit `a2e0874`, release `felicanai-site:20260920T212347Z` (promoted 2026-09-20T21:24Z) |
| PROD rollback | `python3 ~/felican-infra/deploy/deploy rollback felicanai` → `felicanai:rollback-20260920-212347` |
| DEV | `https://felican.dev` — same commit; `robots.txt` stays `Disallow: /` |
| Deploy path | **always** `python3 ~/felican-infra/deploy/deploy to-prod felicanai`. `scripts/deploy-prod.sh` refuses without `FELICAN_CANONICAL_DEPLOY=1` and gates on DEV running the exact local commit. DEV first, always. |
| Prod env file | `/opt/felicanai-site/config/ai.env` — the deploy does **not** carry Resend/Stripe vars across, they live there permanently |
| Order store | `/opt/felicanai-site/orders/` mounted at `/data`, `ORDER_STORE_PATH=/data/starter-pack-orders.json` |

Env var **names** needed on prod (values live in `ai.env`, never in git):
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_ORIGIN`, `GENERATOR_HANDOFF_SECRET`,
`RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`. Do not quote `CONTACT_FROM` — the file is
read by `docker --env-file`, which takes the line literally.

Google Search Console is verified by a DNS TXT record on the felican.ai apex.
**Deleting it loses verification.** Cloudflare changes are listed in `docs/SEO.md` with
previous values saved in `.cf-backup/`.

## 8. Open questions for the user

- **Company social profiles.** `SOCIAL` in `content/site.js` still has empty strings for
  the company LinkedIn, YouTube, X, Facebook, Instagram and GitHub. `sameAs` is what
  separates Felican AI from Felician University, felican.net and felican.in in Google's
  entity graph. Only add a URL that genuinely belongs to the company — a wrong one
  actively teaches Google the wrong entity. The founder's own `sameAs` is already done.
- **The $999 pricing risk, still open.** Only `private-ai`, `assistant` and
  `receptionist` are wired into checkout. The other 15 product pages display $999 with
  `Offer` markup but route to the contact form, so a buyer cannot complete that purchase.
  Google treats an `Offer` as a real purchasable price. Fix by adding them to `CATALOG`
  in `server/checkout.js`, or by reverting those pages to `SoftwareApplication` markup
  which needs no price. This was the owner's explicit decision after the trade-off was
  put to them — a business call, not an oversight, but it should not sit open forever.
- **Google Business Profile** not created. Configure as a **service-area business** for
  Palm Beach / Broward / Miami-Dade with **no street address**, matching the
  `ProfessionalService` markup on `/locations/palm-beach-county/`. Publishing an address
  there would contradict it.
- **The unreferenced 13.5 MB `felican-ai-starter-pack-demo-v2.mp4`** needs the owner's OK
  before deleting.
- Firefox/WebKit Playwright browsers are not installed on this machine, so only chromium
  was exercised.

---

## History

- **2026-09-12** — Priced the four add-ons, promoted `ded694e` to production and verified
  it directly, and fixed `deploy-dev.sh` so a stale `dist/` can no longer reach prod
  through a green gate. Owner settled: no SMS on Voice AI, no restricted-industry
  exclusions, no Stripe Tax.
- **2026-09-11** — Made felican.ai findable. `robots.txt` served a site-wide `Disallow: /`
  from a stale Cloudflare Worker (`felican-robots-grrr`); ownership moved into
  `server/app.js` with a regression test. Generated 73 pages from `content/*.js`, added
  the schema graph, AVIF/WebP variants, $999 product pricing, renamed services, scoped
  both assistants to Felican AI only, made voice greet first, and built the founder
  entity. Search Console + Bing verified, 86-URL sitemap submitted. Site went from 13 to
  86 pages. Full detail in `docs/SEO.md`.

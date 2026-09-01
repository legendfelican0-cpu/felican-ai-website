# Felican AI production launch gate

Production is `https://felican.ai/`. DEV is `https://felican.dev/`.

## Automated gate

- Unit tests pass.
- Chromium, Firefox, WebKit, and mobile browser tests pass.
- WCAG A/AA scan has no serious or critical findings.
- `npm audit` reports no known production vulnerabilities.
- Build and container health checks pass.
- All public routes, legal pages, social metadata, sitemap, contact links, product links, and the assistant pass DEV smoke tests.
- The bounded DEV load check completes without request errors.
- The canonical production command succeeds in dry-run mode.

## Owner checks

- Confirm the phone number routes correctly, can transfer to the intended people, and can send the promised emails. This requires a real call and must not be inferred from the website.
- Confirm every product description and destination is current.
- Confirm the book titles, cover art, and resource page are current.
- Confirm the email inbox is monitored.
- Review Privacy and Terms with counsel before treating them as final legal advice.
- Retain support for any public claim about experience, recognition, patents, or awards.

## Promotion

Production promotion requires separate explicit approval. The canonical command is:

```sh
python3 ~/felican-infra/deploy/deploy to-prod felicanai
```

The production script requires `FELICAN_CANONICAL_DEPLOY=1`, verifies the exact
commit already running on DEV, streams that verified image, keeps the current
site available for rollback, preserves `/Lee-Felican-jr`, switches only the root
proxy route, and performs public smoke checks.

## Rollback

If public verification fails, the deploy automatically invokes the registered
rollback script. Manual rollback also requires explicit production approval:

```sh
python3 ~/felican-infra/deploy/deploy rollback felicanai
```

No old container or proxy backup is deleted during promotion or rollback.

## First-hour watch

- Verify `/api/health` and `/api/ready` every five minutes.
- Watch structured `chat.completed`, `chat.failed`, and `site.analytics` logs.
- Check assistant error rate, latency, and daily budget warnings.
- Spot-check Home, Products, Services, Books, About, Contact, Privacy, and Terms.
- Confirm `www.felican.ai` only after its DNS/SSL change is separately approved.

## Pre-flight before promoting (run this first)

```sh
bash scripts/preflight-prod.sh
```

Read-only. It checks the three things that are not covered by the test suite.

### 1. Contact and payment variables must exist on prod

`deploy-prod.sh` builds `ai.env` by harvesting only `ASHER_*` and `ANTHROPIC_*`
keys. It does **not** carry the Resend or Stripe variables across. Add them to
`/opt/felicanai-site/config/ai.env` before promoting:

```
RESEND_API_KEY=<key from the Resend dashboard>
CONTACT_TO=ai@felican.ai
CONTACT_FROM=Felican AI Website <website@felican.ai>
STRIPE_SECRET_KEY=<restricted test/live key>
STRIPE_WEBHOOK_SECRET=<whsec_... from the Stripe endpoint>
SITE_ORIGIN=https://felican.ai
```

Do not wrap `CONTACT_FROM` in quotes: the file is read by `docker --env-file`,
which takes the line literally, so quotes would end up inside the value.

Without Resend, `/api/contact` returns 503 and tells visitors to email directly.
Without Stripe, checkout or webhook fulfillment returns 503 while the rest of
the site remains available.

The deploy scripts mount `/opt/felicanai-site/orders/` at `/data` and set
`ORDER_STORE_PATH=/data/starter-pack-orders.json`. Keep that host directory in
server backups: it contains the durable payment record and welcome-email marker.

### 2. The felican.ai proxy host may use custom locations

`felican.ai` serves the marketing site at `/` and roughly nineteen path apps
underneath it — `/relay`, `/quorum`, `/ora`, `/factory`, `/Lehem-Felican-Jr`,
`/Lee-Felican-jr/...` and so on. Those are nginx-proxy-manager *custom
locations* on the same proxy host, and each one carries its own `set $server`
line in the generated conf.

To repoint the site, `deploy-prod.sh` runs:

```sh
sed -i -E 's/(set \$server[[:space:]]+)"[^"]+";/\1"felicanai-site";/' "${proxy_conf}"
```

`sed` with no line address rewrites **every** match in the file. If the custom
locations live in that conf, all of them are repointed at the marketing
container, which returns 404 for those paths.

Two things limit the blast radius:

- The script copies both the conf and the NPM database into
  `/opt/felicanai-site/state/` before touching them.
- After deploying it re-checks `https://felican.ai/Lee-Felican-jr/books/resources/`
  and fails the deploy if that stops returning 200.

The weak point is recovery: `rollback-prod.sh` uses the same indiscriminate
`sed`, so it restores one uniform value rather than each location's original
target. If path apps break, restore the backed-up conf directly instead:

```sh
sudo cp -p /opt/nginx-proxy-manager/data/nginx/proxy_host/<id>.conf.before-promotion \
           /opt/nginx-proxy-manager/data/nginx/proxy_host/<id>.conf
sudo docker exec nginx-proxy-manager nginx -t
sudo docker exec nginx-proxy-manager nginx -s reload
```

The conf is generated from the NPM database, which the script does not modify
beyond the single `forward_host` column, so re-saving the host in the NPM UI
also regenerates correct custom locations.

### 3. Baseline the path apps

Record which paths return 200 before promoting, and compare afterwards. As of
the last check all of these were 200:

```
/relay  /quorum  /ora  /factory  /Lehem-Felican-Jr  /Lee-Felican-jr/books/resources/
```

## After promoting

- Rotate the Resend API key if it has been shared anywhere.
- `felican.ai/robots.txt` switches from `Disallow: /` to `Allow: /`
  automatically; the rule is keyed on hostname, so DEV stays unindexed.
## tawk.to live chat

**Nothing to deploy or configure on the server.** The property id is committed
in `public/tawk-config.js`, so it ships with the site, and the Content Security
Policy in `server/app.js` already permits `embed.tawk.to` and `wss://*.tawk.to`.
The widget loads on `/contact/` only, and only when a visitor asks for a person,
so no other page fetches third-party script.

The one thing that can break it lives in the tawk dashboard, not in this repo:

- **Domain allowlist** (Administration → Property Settings) must contain
  `felican.ai` **and** `www.felican.ai`, or the widget silently refuses to load
  on production. `www` matters because it currently resolves and is a CNAME to
  the apex. Keep `felican.dev` listed as well or DEV testing stops working.
- Setting the property's *website URL* to `https://felican.ai` is not the same
  setting as the domain allowlist. The URL is a label; the allowlist is the
  enforcement.

After promoting, open `https://felican.ai/contact/` and confirm a fourth card
appears beside Email, Phone and Book a call. If it is missing, the allowlist is
the cause and nothing in the deploy is at fault.

The card reads **Chat with us now** with a green dot only while someone is
online in the tawk dashboard. With nobody online it reads **Leave a message**
with a grey dot, which is deliberate: visitors are never invited into a chat
that no one is watching. Its own bubble stays hidden and is opened from that
card, and it sits bottom-left so it never collides with the Felican assistant
launcher on the right.

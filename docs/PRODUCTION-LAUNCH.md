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

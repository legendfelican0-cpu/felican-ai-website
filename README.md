# Felican AI Website

The public Felican AI company website. It presents the product catalog, services,
books, company information, contact options, and the embeddable Felican AI
Assistant demo.

## Commands

- `npm run dev` — run the local site
- `npm run build` — create a production build
- `npm test` — run component tests
- `npm run test:e2e` — run Chromium, Firefox, and WebKit browser tests
- `npm run smoke -- <url> [--chat]` — verify the deployed routes and optional live assistant
- `npm run load:staging` — run the bounded static/API capacity check against DEV

## Release flow

1. Commit the exact source revision being tested.
2. Deploy it to DEV through `python3 ~/felican-infra/deploy/deploy to-dev felicanai`.
3. Run live smoke, accessibility, responsive-layout, assistant, and load checks.
4. Run the production dry-run and review the rollback plan.
5. Obtain explicit approval before any production or DNS change.

See [docs/PRODUCTION-LAUNCH.md](docs/PRODUCTION-LAUNCH.md) for the complete gate.

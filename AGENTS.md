# Felican AI website notes

## Deployment

- `scripts/deploy-dev.sh` publishes only to `https://felican.dev` and includes health checks plus rollback protection.
- Do not publish to production unless the user explicitly requests a production release.
- Run the unit tests, production build, and relevant Playwright coverage before every push.

## Booking links

- Every booking-related CTA must link to the first-party `/booking/` page so visitors stay on Felican AI. The configured Calendly or Cal.com URL is used only as the embedded scheduler inside `/booking/`; never link a site CTA directly to the external provider.

## Recent changes

- 2026-08-19: Production promotion now provisions a dedicated PROD Vapi assistant and validates the AI provider, voice identifiers, verified browser client, and chat before success. DEV and PROD use separate Vapi assistants so later staging deploys cannot redirect production voice traffic. Proxy promotion and rollback change only the main host target, preserving custom path applications.
- 2026-08-18: Assistant copy now enforces the visible spellings `Felican AI` and `Ballas`. Phonetic pronunciation remains confined to the ElevenLabs voice replacement and is never shown in chat or transcript text; common model misspellings are normalized before delivery.
- 2026-08-18: The website voice assistant now uses the exact patched browser voice client deployed by the COPS website, served through a same-origin, SHA-384-verified, in-memory-cached endpoint. It opens and meters the visitor microphone, supplies that same verified track to Vapi, consumes local-volume events, and treats visual-observer/Krisp errors as non-fatal. Its five-bar indicator distinguishes quiet listening, detected visitor speech, and assistant speech; permission failures show a clear browser-microphone message, local resources close on Stop, and a fast first tap waits for setup instead of being discarded. The Felican Vapi assistant has no automatic opening message and uses `assistant-waits-for-user`, so a voice session begins silently and responds only after visitor speech. The site CSP explicitly allows Daily's pinned call-engine hosts so Vapi can establish the live microphone room.
- 2026-08-18: Voice now preloads before the microphone tap, waits for the visitor to speak, keeps listening until Stop, applies the correct Felican pronunciation, restores the working COPS audio configuration, and visibly animates when the visitor or Felican AI is speaking. The mobile credential marks are centered with a larger OpenAI mark. Specialist product covers now use screenshots captured from their real app repositories.
- 2026-08-18: Added the one-play homepage handshake background in WebM and MP4, with the existing handshake image as the poster/fallback. It stays silent, does not loop, and holds the final handshake frame.
- 2026-08-18: Added continuous Vapi browser voice, aligned credential logos, product preview covers, and the interactive Start Here eBook entry.

## Starter Pack project

**`HANDOFF.md` in this directory is the spec.** Read it in full before writing
any code. It contains the locked product decisions, pricing, copy rules, what is
already built, what is not, and the remaining work in priority order.

Current project: **starter-pack** — the buying journey for the AI Business
Starter Pack, from the felican.ai tab through Stripe to the welcome email.
Planning notes live at `~/dev/starter-pack/PLAN.md`.

## Hard rules

- **Do not rename the products.** They are `Private AI`, `Felican AI Assistant`,
  and `AI Receptionist`. Never append "Starter" to a product name. "Starter"
  belongs only to the tab and the bundle, "AI Business Starter Pack".
- **Never mention the enterprise offering or the $25,000 product** on any of
  these pages.
- **Never name a weekday** in copy. Use elapsed time — "in 2 days",
  "live in 48 hours".
- **Cart and prices appear only on `/starter-pack/`.** The other products on
  `/products/` stay unpriced with "Ask about it" CTAs.
- **Prices live only in `server/checkout.js`.** The browser sends product ids and
  nothing else. Never accept a price, total, or amount from the client.
- **`npm test` must stay green.** Add tests with new code.
- **Do not modify `~/dev/private-ai-generator/`.** It is Lee's separate project,
  here for reference only.
- **Do not commit, push, or deploy** without the owner asking.

## Run it

```bash
STATIC_ROOT=./public PORT=4174 node server/index.js   # http://localhost:4174/starter-pack/
npm test
```

## Site conventions

Live pages are the static HTML files under `public/`, rendered by the `<x-dc>`
canvas runtime in `public/support.js`. `src/site.jsx` is a separate React file
and is NOT the live products page.

Palette: bg `#080E13`, panel `#101E24`, border `#1C2A28`, text `#EEF4F4`,
muted `#8FA3A8`, accent `#2FB894`, hover `#59D4B4`, soft `#8FE0C8`.
Sora for headings, Inter for body. Square corners.

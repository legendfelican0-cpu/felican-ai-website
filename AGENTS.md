# Felican AI website notes

## Deployment

- `scripts/deploy-dev.sh` publishes only to `https://felican.dev` and includes health checks plus rollback protection.
- Do not publish to production unless the user explicitly requests a production release.
- Run the unit tests, production build, and relevant Playwright coverage before every push.

## Recent changes

- 2026-08-18: The website voice assistant now uses the exact patched browser voice client deployed by the COPS website, served through a same-origin, SHA-384-verified, in-memory-cached endpoint. It opens and meters the visitor microphone, supplies that same verified track to Vapi, consumes local-volume events, and treats visual-observer/Krisp errors as non-fatal. Its five-bar indicator distinguishes quiet listening, detected visitor speech, and assistant speech; permission failures show a clear browser-microphone message, local resources close on Stop, and a fast first tap waits for setup instead of being discarded. The Felican Vapi assistant has no automatic opening message and uses `assistant-waits-for-user`, so a voice session begins silently and responds only after visitor speech. The site CSP explicitly allows Daily's pinned call-engine hosts so Vapi can establish the live microphone room.
- 2026-08-18: Voice now preloads before the microphone tap, waits for the visitor to speak, keeps listening until Stop, applies the correct Felican pronunciation, restores the working COPS audio configuration, and visibly animates when the visitor or Felican AI is speaking. The mobile credential marks are centered with a larger OpenAI mark. Specialist product covers now use screenshots captured from their real app repositories.
- 2026-08-18: Added the one-play homepage handshake background in WebM and MP4, with the existing handshake image as the poster/fallback. It stays silent, does not loop, and holds the final handshake frame.
- 2026-08-18: Added continuous Vapi browser voice, aligned credential logos, product preview covers, and the interactive Start Here eBook entry.

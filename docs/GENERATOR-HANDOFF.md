# AI Business Starter Pack — Generator Product Contract

Last updated: 2026-09-03
Audience: the person building or productionizing the customer generator
Status: product contract for implementation; production is not yet authorized

This document defines what the Felican AI storefront sells and what the
generator must deliver. It is intentionally separate from implementation notes
and demo-client history. When the storefront and generator disagree, resolve the
disagreement before release rather than silently changing the customer offer.

## 1. Source-of-truth rules

1. The website backend is the source of truth for purchase-time prices.
2. Stripe is the source of truth for whether money was paid and whether monthly
   hosting is active.
3. The generator is the source of truth for entitlements, product state, usage,
   and generated customer resources.
4. The browser is never trusted for prices, totals, paid status, plan status, or
   product entitlements.
5. The generator must independently validate every paid Checkout Session against
   the mirrored catalog before creating an account or product.
6. All fulfillment, email delivery, and generation operations must be idempotent.
7. DEV and production must use separate domains, databases, secrets, webhooks,
   customer resources, phone assistants, storage, and provider credentials.

## 2. Locked customer-facing rules

- Product names are exactly `Private AI`, `Chat AI Assistant`, and `Voice AI`.
- The bundle is exactly `AI Business Starter Pack`.
- Do not append “Starter” to an individual product name.
- Do not mention ChatGPT in product copy, onboarding, generated product names,
  emails, or help text.
- Do not expose internal provider or model names as the product identity. The
  customer is buying their company's AI, not a vendor-branded chatbot.
- The offer is for any business: an independent owner, entrepreneur, local
  business, or team. Do not make the flow specific to one industry.
- The setup promise is “ready and running in a few minutes.” Do not name a
  weekday or promise a multi-day setup window.
- More models, more automations, image generation, and video generation are paid
  add-ons that require a quote. They are not included by default.
- There are no automatic usage-overage charges.
- Customer-facing support address: `ai@felican.ai`.

## 3. Purchase options and prices

All amounts are USD.

| Storefront ID | Customer name | One-time price | Generator entitlement |
|---|---|---:|---|
| `private-ai` | Private AI | $999 | `owui` |
| `assistant` | Chat AI Assistant | $999 | `chat_widget` |
| `receptionist` | Voice AI | $999 | `voice` |
| `pack` | AI Business Starter Pack | $2,500 | `owui`, `chat_widget`, `voice` |

Rules:

- A customer may purchase one or more individual products.
- If `pack` is present, it replaces all individual items in that cart.
- There is no quantity picker and no duplicate entitlement for repeated IDs.
- Every purchase requires exactly one monthly hosting plan.
- One hosting plan applies to the account and all products that account owns.
- The first hosting month is charged in the same Checkout as the one-time
  product purchase. Only hosting renews monthly.
- A later purchase using the same normalized email must attach new entitlements
  to the existing account and shared knowledge base, not create a duplicate
  company workspace.

Machine-readable catalog values:

```yaml
currency: usd
checkout_purpose: starter_pack_with_hosting
items:
  private-ai: 99900
  assistant: 99900
  receptionist: 99900
  pack: 250000
product_types:
  private-ai: [owui]
  assistant: [chat_widget]
  receptionist: [voice]
  pack: [owui, chat_widget, voice]
```

Amounts in this block are cents. This block documents the contract; it must not
be copied into browser code and treated as authoritative pricing.

## 4. Monthly hosting plans and limits

| Plan ID | Plan | Monthly price | Uploaded files | Website-assistant replies | Voice AI | Private AI processing |
|---|---|---:|---:|---:|---:|---:|
| `base` | Essentials | $50 | 25 GB | 2,000 replies | 100 minutes | $10 provider spend |
| `growth` | Growth | $100 | 75 GB | 6,000 replies | 300 minutes | $25 provider spend |
| `scale` | Scale | $200 | 200 GB | 20,000 replies | 800 minutes | $60 provider spend |

Plan positioning:

- Essentials: independent owners and small teams putting AI to work.
- Growth: busy businesses with more visitors, calls, and company knowledge.
- Scale: growing operations with heavier traffic, call volume, and files.

Limit behavior:

- Allowances are account-wide, not duplicated for each product.
- An allowance only matters when the account owns the corresponding product.
- Allowances do not roll over.
- Warn the customer at 80%, 95%, and 100% for each meter.
- Alert Felican AI at 95% and 100% at `ai@felican.ai`.
- At 100%, pause only the exhausted feature. Keep stored data and other products
  available.
- The customer may wait for the next reset or move to a larger fixed plan.
- Never create a surprise per-message, per-minute, storage, or model-spend bill.
- Show exact used, remaining, limit, and reset date in the dashboard.
- Plan changes must come from verified Stripe subscription events. Do not trust a
  plan value posted by the browser.
- Stripe must show any proration before a customer confirms a mid-cycle change.

Recommended correction before production: reset all four meters on the Stripe
subscription billing period. The current DEV implementation resets storage,
assistant replies, and voice on the UTC calendar month while Private AI follows
a provider window. One customer-facing billing period is easier to understand
and prevents a customer who buys near month-end from receiving a partial first
period.

## 5. Product contract

### 5.1 Private AI

The customer receives a private, company-branded workspace for the owner and
staff. Public signup must be disabled. The customer administrator controls staff
access.

Included:

- The customer's logo, company name, brand color, and business knowledge.
- One branded business model, selected by default when the workspace opens.
- One free OpenRouter model option.
- One active automation.
- Live web search.
- The shared company knowledge base.
- Drafting, summarizing, research, internal instructions, policy lookup, and
  everyday business assistance.

Not included by default:

- Additional branded models.
- A multi-agent or agent-team interface.
- Additional automations.
- Image generation.
- Video generation.
- A general catalog of extra tools.

Implementation rules:

- The branded company assistant must be first/default. Claude Opus must not be
  the first model shown.
- Do not ship the underlying generator's default three-model configuration to a
  Starter Pack buyer.
- Disable image and video generation explicitly; do not rely on upstream
  defaults.
- The only broadly available tool is web search. The selected automation is a
  separate, scoped action with least-privilege credentials.
- Knowledge-base answers must cite or identify the company source when the UI
  supports it and must say when the source does not contain an answer.
- Customer business information must not be used to train a public model.
- Admin credentials must be delivered securely and must not be stored in job
  results, logs, analytics, or the customer database in plaintext.

Initial automation choices should be narrow, explainable templates. Recommended
v1 options are lead/inquiry notification, appointment-request capture, human
escalation, or an internal conversation summary. Only one may be active without
a paid add-on. Each option still needs its exact destination and permission
model defined before it is shown to customers.

### 5.2 Chat AI Assistant

The customer receives:

- A hosted page for testing the assistant.
- A one-line embed snippet that can be pasted before `</body>`.
- Branding that matches the company.
- Answers grounded in the shared knowledge base.
- Multilingual visitor support.
- Lead-detail capture and a clear human-handoff path.
- Service recommendations based only on information the customer supplied.

Security and behavior:

- Public chat is unauthenticated by design, but its API must use an exact origin
  allowlist whenever the company website is known.
- Apply per-IP rate limiting, message-length limits, context limits, model-output
  limits, and the account reply cap before paid model work begins.
- Use a per-tenant scoped model key; never expose a shared or master provider key.
- Refuse to invent prices, guarantees, policies, availability, or professional
  advice.
- If a question cannot be answered, offer the configured company contact channel.
- Lead capture must disclose what information is being collected and where it is
  sent.
- The dashboard must keep the embed snippet visible with a working Copy action
  and a short installation instruction.

### 5.3 Voice AI

The customer receives:

- A callable business phone number.
- A hosted browser voice page for testing.
- A company-branded greeting.
- Answers grounded in the same knowledge base as the other products.
- Optional transfer to a human number.
- Message capture and delivery.
- Appointment booking when a supported calendar is connected.
- Usage measured in completed call seconds and displayed as minutes.

Voice rules:

- Phone conversations should sound natural and keep ordinary replies short.
- Pause briefly before responding so the assistant does not talk over callers.
- Phone mode may greet first; browser voice waits for the visitor to speak.
- Recording is off by default. Do not record calls without a separately approved
  consent and retention design.
- Refuse new calls at the plan cap and limit active-call duration to the remaining
  allowance.
- Count a signed end-of-call event once; webhook retries must not double-count.
- A preferred area code may be collected, but local inventory is best effort and
  must not be guaranteed.
- Production v1 is calls only. Do not enable SMS until the required registration,
  consent, opt-out, and messaging policies are complete.
- If number provisioning fails, keep the browser voice product available, alert
  Felican AI, show a truthful “number is being added” status, and allow an
  idempotent retry.

Calendar booking and structured message delivery are customer-facing promises.
If they are not implemented and verified before launch, either build them or
change the storefront copy before accepting payment.

### 5.4 Bundle behavior

The AI Business Starter Pack creates all three product surfaces from one intake
and one shared knowledge base. The customer must not upload the same business
information three times.

- Generate Private AI first because it can own the customer's knowledge store.
- Generate the assistant and Voice AI from that same source.
- Display independent progress and failure states for each product.
- A failure in one surface must not destroy or hide a successfully created one.
- Retry only missing or failed work; never duplicate phone numbers, model keys,
  subscriptions, containers, or product rows.

## 6. Customer onboarding and options

The generator must show only the products actually purchased.

Required minimum:

- Company name or public company website. At least one is required.

Current customer-editable fields:

| Field | Required | Maximum | Used for |
|---|---|---:|---|
| Company name | Conditional | 200 characters | Branding, prompts, knowledge name |
| Website | Conditional | 500 characters | Branding and knowledge crawl |
| Industry | No | 120 characters | Response context |
| Contact email | No | 320 characters | Escalation/contact behavior |
| Contact phone | No | 40 characters | Business contact information |
| Brand accent color | No | 40 characters | UI branding; name, RGB, or hex may be normalized |
| Assistant name | No | 80 characters | Website and voice identity |
| Chat greeting | No | 300 characters | Website assistant greeting |
| Transfer number | No | 32 characters | Voice transfer destination |

Recommended fields to add before production:

- Logo upload with preview and an explicit “use this logo” confirmation. Website
  detection may remain the default, with a generated monogram only as fallback.
- Business hours and timezone.
- Preferred phone area code, clearly labeled best effort.
- Human-handoff destination for chat leads.
- Appointment calendar connection and booking rules.
- One automation choice and its destination.
- Primary language and optional supported languages.

The customer must be able to review the detected company name, logo, colors,
website pages, and uploaded documents before pressing Generate.

## 7. Shared knowledge base

Sources:

- Public pages crawled from the customer's approved website.
- Customer uploads: `.pdf`, `.docx`, `.txt`, `.md`, and `.csv`.
- Future structured Q&A entered directly in the dashboard.

Upload rules:

- Maximum 20 MB per file.
- Maximum 1,500 files per account.
- Enforce the account's total plan storage before writing a file.
- Replacing a file must subtract the prior version before checking the new total.
- Reject hidden/path-traversal names and unsupported extensions.
- Convert supported documents into normalized knowledge documents.
- Add, replace, and delete idempotently without duplicated indexes.

Knowledge behavior:

- One account has one logical source of truth shared by every purchased surface.
- Customers can add, replace, remove, and sync documents after launch.
- A sync must update every live surface that uses the shared knowledge base.
- Never silently launch an assistant with an empty knowledge base. Require at
  least one successful website page or uploaded document.
- If sources conflict, recommended precedence is customer-entered Q&A, then the
  newest customer upload, then the website crawl. Show the source and conflict
  instead of silently guessing.
- Website crawling must reject loopback, link-local, private-network, metadata,
  and otherwise unsafe destinations.
- Do not accept payment-card data, Social Security numbers, medical records,
  authentication secrets, unlawful content, or material the customer lacks the
  right to use.

Azure production storage requirement:

- Use private StorageV2 Hot ZRS containers for uploaded source files.
- Keep databases and vector indexes outside Blob Storage.
- Use per-account paths or containers, least-privilege access, encryption,
  lifecycle rules, deletion propagation, and auditable restore procedures.

## 8. Checkout-to-generator handoff

Required customer journey:

```text
felican.ai/starter-pack
  -> felican.ai/checkout
  -> Stripe hosted Checkout
  -> felican.ai/thank-you?session_id=...
  -> Set Up My AI
  -> app.felican.ai/claim?order=...
  -> password/account setup when needed
  -> onboarding and document upload
  -> Generate
  -> dashboard with purchased products
```

The setup email is a backup path, not the only path. A buyer returning in the
same browser must be able to click **Set Up My AI** on the receipt and enter the
generator directly after server verification.

Security contract:

- The website creates a short-lived, signed, HttpOnly, Secure handoff cookie for
  the paid Checkout Session.
- Production cookie domain is `felican.ai`; production generator origin is
  `https://app.felican.ai`.
- The website and generator use the same production handoff secret, stored only
  server-side.
- Handoff lifetime is 30 minutes.
- The Checkout Session ID in the URL is a lookup key, not authentication.
- The generator retrieves the session from Stripe server-side, verifies paid
  status, currency, amount, item metadata, hosting plan, Stripe customer, and
  subscription before fulfillment.
- A missing, invalid, or expired handoff cookie falls back to the setup email.
- Setup email tokens expire after seven days and are single-purpose. Password
  reset tokens expire after two hours.
- A resend action may send setup only to the email that paid; the browser cannot
  choose a different recipient.

## 9. Stripe contract

The initial Checkout Session must use subscription mode with:

- One or more one-time product line items.
- Exactly one reusable monthly hosting Price.
- `customer_email` supplied by the website checkout form.
- `metadata[purpose]=starter_pack_with_hosting`.
- `metadata[items]` containing comma-separated storefront IDs.
- `metadata[hosting_plan]=base|growth|scale`.
- Subscription metadata:
  - `managed_by=ai-generator`
  - `hosting_plan=base|growth|scale`
  - `starter_pack_items=<comma-separated IDs>`

The generator must handle these signed webhook events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Webhook rules:

- Verify Stripe's signature against the raw body with a five-minute tolerance.
- Use separate production webhook signing secrets for the website and generator.
- Reject unknown items, unknown plans, unexpected currency, wrong Checkout mode,
  unpaid sessions, and amount mismatches.
- The order primary key is the Checkout Session ID.
- Product rows are unique by order and product type.
- Webhook retries, receipt verification, and claim verification may all attempt
  fulfillment; only the first attempt may create each resource or send each
  transactional email.
- Return a retryable error for temporary internal failures. Log and acknowledge a
  permanent tampering/malformed-session rejection so Stripe does not retry it
  forever.

Customer Portal must support:

- Invoice history.
- Payment-method updates.
- Billing email/address/tax ID updates.
- Switching among Essentials, Growth, and Scale.
- Cancellation at the end of the paid period.
- Production Privacy and Terms links on `felican.ai`, never `.dev` links.

## 10. Account, generation, and billing states

Product states:

```text
draft -> generating -> live
  |          |          |
  |          v          v
  +-------> failed   suspended <-> live
```

- Only verified purchases create draft entitlements.
- Only active or trialing hosting may start generation.
- Generation must show real progress and may be safely retried.
- A failed build keeps its error for the owner/admin and a safe, useful message
  for the customer.
- `past_due`, `unpaid`, or ended/canceled hosting suspends hosted products while
  keeping customer data.
- A verified recovery payment resumes suspended products.
- A plan change updates live runtime limits after the signed subscription event.
- Exhausting one usage meter pauses that feature without changing the Stripe
  subscription or suspending unrelated products.

## 11. Dashboard requirements

The customer dashboard must provide:

- Purchased products and live/draft/generating/failed/suspended state.
- Direct product links.
- Private AI administrator-login delivery status.
- Website-assistant embed code with Copy action and installation instructions.
- Voice AI phone number with click-to-call and number-provisioning status.
- Shared knowledge sources with add, replace, delete, and sync controls.
- Company/branding/assistant settings and a clear Apply/Regenerate action when a
  change requires rebuilding assets rather than only reindexing knowledge.
- All four usage meters, plan name, reset date, and warning state.
- Billing Portal access for invoices, payment details, plan changes, and cancel.
- A visible `ai@felican.ai` support path.

## 12. Security and isolation requirements

- One account's orders, documents, vectors, conversations, usage, credentials,
  products, and phone events must never be readable by another account.
- Generated runtimes use unique slugs, ports, networks, domains, and scoped
  provider credentials.
- No tenant receives a master LiteLLM, Azure, Vapi, Telnyx, Stripe, Resend,
  storage, or control-plane credential.
- Public widgets use exact-origin allowlists where possible, currently 20
  requests per minute per IP, a 40-message context, 4,000-character user input,
  and capped output/tool rounds.
- Usage reports from generated runtimes must be timestamped, HMAC-signed,
  replay-resistant, idempotent, and bound to one account.
- The gateway's local database remains authoritative for the hard stop if the
  control plane is temporarily unreachable.
- Validate and normalize all customer-facing names, colors, URLs, filenames,
  phone numbers, and slugs before they reach templates, shell commands, DNS, or
  provider APIs.
- Secrets remain outside git in root-only production configuration or an
  approved secret store.
- Do not log passwords, setup tokens, webhook secrets, model keys, document
  contents, or full call transcripts.
- Add malware scanning or a quarantined conversion worker before accepting
  arbitrary public document uploads in production.

## 13. Production domains and required services

Production:

- Storefront: `https://felican.ai/starter-pack/`
- Generator: `https://app.felican.ai/`
- Private AI: `https://<slug>.privateai.felican.ai/`
- Assistant test page: `https://<slug>-chat.privateai.felican.ai/`
- Voice test page: `https://<slug>-voice.privateai.felican.ai/`

Required production integrations:

- Stripe live account, restricted server key, Products/Prices, Customer Portal,
  and two signed webhook endpoints.
- Resend transactional email with monitored replies to `ai@felican.ai`.
- Vapi for voice assistants and call events.
- Telnyx fallback for purchasing/importing phone numbers when needed.
- Azure Blob Storage for customer uploads.
- Scoped model gateway/provider credentials and per-account budgets.
- Production PostgreSQL and persistent generated-product data.
- DNS and TLS for `app.felican.ai` and the wildcard product domains.
- Encrypted off-host backups, an external uptime monitor, and an alert channel
  that does not depend on the generator host or Resend.

Production customer data and production credentials must never pass through the
DEV generator or DEV provisioning server.

## 14. Alerts, backups, and support operations

Alert Felican AI for:

- 95% and 100% usage thresholds.
- Failed generation jobs.
- Failed renewals and product suspension.
- Webhook failures or a growing retry backlog.
- Health endpoint or required-container failure.
- Less than 15% disk space remaining.
- Missing or older-than-26-hours backups.
- Phone number, DNS, certificate, email, model-key, or storage provisioning
  failure.

Before production:

- Create encrypted off-host backups for Postgres, account configuration,
  customer uploads, and provisioning manifests.
- Decide and document retention and deletion periods.
- Restore a backup into an isolated environment and verify account, order,
  subscription, knowledge, and product recovery.
- Monitor the service externally at least every five minutes.
- Route urgent alerts through email plus an independent second channel.
- Document retry, manual provisioning, suspension, data export, deletion, and
  disaster-recovery procedures.

## 15. Customer ownership and data rules requiring final definition

The storefront says the system and knowledge are the customer's. Before release,
the implementation and Terms must state precisely what that means.

Recommended minimum:

- The customer retains rights to company information and files they provide.
- The customer can export uploaded files, structured Q&A, and generated company
  configuration in common formats.
- Felican AI retains ownership of its platform, reusable software, templates,
  infrastructure, and internal tools.
- Canceling hosting stops hosted operation at the end of the paid period but does
  not silently erase customer data.
- A documented retention window follows cancellation, after which deletion is
  automatic unless law requires longer retention.
- A verified owner may request earlier export and deletion, subject to legal and
  payment-record requirements.

The September 4, 2026 storefront Terms establish the current refund rules,
30-day post-hosting retention window, customer-data ownership language, and
liability cap. Legal entity name/address, governing law and venue, and any
restricted-industry exclusions still require owner/counsel confirmation. Do not
invent them in generator code.

## 16. Known gaps between the current DEV generator and this contract

These must be closed or the matching storefront promise must be changed before
accepting production payments:

1. The production generator, `app.felican.ai`, does not exist yet.
2. The current generator checkout, handoff, wildcard domains, portal legal URLs,
   and provisioning transport contain DEV-specific configuration.
3. The current upstream Private AI defaults create three models and enable image
   and video generation; the Starter Pack contract requires the smaller feature
   set in section 5.1.
4. The promised one-automation selection and enforcement need a complete
   customer-facing implementation.
5. Structured website lead capture and human handoff need end-to-end delivery
   and tests.
6. Voice calendar booking and structured message delivery need end-to-end
   integrations and tests.
7. Logo upload/review is missing; current behavior depends on website detection
   or a generated fallback mark.
8. All usage meters should share one understandable billing-period reset.
9. Production Azure upload storage is not wired.
10. Encrypted off-host backup, restore drill, external uptime monitoring, and a
    second alert channel are not complete.
11. Production Stripe access, Products/Prices, portal, and webhooks are not
    configured or live-tested.
12. Production deployment and rollback for the generator are not registered in
    the canonical infrastructure deploy system.
13. The generator source needs a reproducible, versioned release artifact before
    production promotion.
14. Production legal identity, governing law/venue, and restricted-industry
    exclusions still need owner/counsel confirmation. The storefront now records
    explicit consent to versioned Terms and Privacy policies in Stripe metadata.

## 17. Definition of done for a production launch

The generator is ready only when all of the following pass in a clean production
candidate environment:

1. A Private AI-only order creates only Private AI.
2. An Assistant-only order creates only the assistant and its valid embed code.
3. A Voice AI-only order creates voice, a callable number, transfer/message
   behavior, and calendar booking if advertised.
4. A bundle order creates all three from one intake and one knowledge base.
5. A later purchase on the same email adds products without duplicating the
   account, knowledge base, or subscription.
6. Essentials, Growth, and Scale each enforce their exact storage, replies,
   minutes, and model-spend limits.
7. Customer warnings fire once at 80%, 95%, and 100%; internal warnings fire at
   95% and 100%.
8. Each exhausted feature pauses independently and recovers on reset or verified
   upgrade.
9. Portal upgrade, downgrade, cancellation, failed renewal, and payment recovery
   update both Stripe and live runtime state correctly.
10. Checkout, webhook, thank-you verification, and direct claim can race or retry
    without duplicate fulfillment or duplicate emails.
11. The receipt's **Set Up My AI** button works immediately, and the email link
    works independently.
12. Website crawl, uploads, replacement, deletion, and post-launch sync update
    every purchased surface.
13. Cross-account isolation, scoped credentials, widget abuse controls, SSRF,
    CSRF, upload safety, and webhook signature tests pass.
14. A real phone call, website-widget installation, Private AI staff login, lead
    delivery, message delivery, and appointment booking are manually verified.
15. A fresh encrypted backup restores successfully into an isolated environment.
16. External monitoring and both alert channels are exercised.
17. A private $1 live-mode smoke purchase completes payment, payout-visible
    transaction recording, both webhook paths, receipt handoff, email, claim,
    generation, portal access, and refund without exposing the test SKU publicly.
18. The exact tested release can be promoted and rolled back through the
    canonical production deployment path.

## 18. Recommended implementation order

1. Compare the current generator against sections 3–13 and label each item
   `done`, `partial`, `missing`, or `storefront-copy-change-needed`.
2. Enforce the Starter Pack Private AI feature fence: correct model count and
   default, no image/video generation, one web-search capability, and one
   automation slot.
3. Finish customer-visible promises: logo review, automation selection, website
   lead delivery/handoff, Voice AI messages, and calendar booking.
4. Unify usage resets and verify all three plans at their boundaries.
5. Make every URL, cookie domain, provider key, webhook, database, host, and
   wildcard domain environment-specific.
6. Create the reproducible production deployment, rollback, backups, restore
   procedure, external monitoring, and independent alerts.
7. Run the full definition of done in section 17 in Stripe test mode.
8. Coordinate the final storefront/legal changes, then run the private $1 live
   test before public checkout is enabled.

## 19. Response requested from the generator owner

Before production work is considered complete, return this short status report
to the website owner:

- Generator repository/release identifier and the exact candidate commit.
- Production architecture and deploy/rollback command.
- `done/partial/missing` status for every item in section 16.
- Exact branded model and free OpenRouter model that Starter Pack customers see.
- The v1 automation choices and where each sends its result.
- How website leads and chat handoff are delivered.
- Calendar provider(s), appointment rules, and message-delivery method for Voice
  AI—or a request to remove those promises from the storefront.
- Usage reset rule and proof for all three plans.
- Phone-number sourcing, preferred-area-code behavior, and capacity.
- Customer data export format and proposed post-cancellation retention period.
- Production backup destination, last successful restore drill, uptime monitor,
  and both alert destinations.
- Any required change to the Stripe metadata or handoff contract in sections 8
  and 9.

Do not send secret values, API keys, passwords, customer documents, or full
environment files with the response.

## 20. Change-control rule

Pricing, included products, plan limits, product names, default capabilities,
billing behavior, data ownership, and customer-visible promises are contract
changes. Update the website backend, generator validator, tests, customer copy,
Terms, and this document together. Never repair a mismatch by weakening
generator validation or trusting browser-supplied data.

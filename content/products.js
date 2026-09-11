// Per-product page content.
//
// Source of truth for the product facts is the existing data array in
// public/products/index.html. The descriptions, feature lists and positioning there
// were written by the owner; this file keeps those words and adds the material a
// buyer needs that a card cannot hold — deployment shape, integrations, what
// determines cost, and the objection people raise out loud.
//
// Nothing here states a measured outcome. Where a number would belong, the page asks
// the reader to get it on a call instead of inventing one.

export const PRODUCTS = [
  /* ----------------------------------------------------------- 01 flagship */
  {
    slug: 'private-ai',
    name: 'Private AI',
    tag: 'Secure enterprise AI',
    tier: 'flagship',
    image: '/product-private-ai.png',
    title: 'Private AI — self-hosted AI inside your own network | Felican AI',
    description:
      'Enterprise-grade private AI deployed inside your own network. No customer, client or employee data leaves the business. Self-hosted models, your access controls, your audit trail.',
    lede:
      'Our flagship product: enterprise-grade private AI with zero data exposure, deployed securely inside your own network. The power of AI without sacrificing privacy.',
    facts: [
      { k: 'Deployment', v: 'Inside your network, on your hardware or your private cloud tenant' },
      { k: 'Data exposure', v: 'None. Prompts and documents never reach a public model' },
      { k: 'Typical time to live', v: 'Days, not quarters' },
      { k: 'Who runs it', v: 'You own it. We build, deploy and maintain it' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'Private AI is a complete AI system — models, retrieval, interface, access control and audit logging — installed where your data already lives. Your staff get the thing they keep asking for, a chat assistant that knows the business, without anyone sending a contract, a patient record or a price list to a public API.',
          'It is built on open-weight models you can run yourself, wrapped in an interface your team will actually use, and grounded in your own documents. The difference from a public AI subscription is not the chat box. It is that nothing leaves.',
        ],
      },
      {
        h: 'Who this is for',
        p: [
          'Businesses where a data leak is not an inconvenience but an existential problem, or where someone has already said no to AI because of exactly that risk:',
        ],
        ul: [
          '<strong>Regulated work</strong> — medical practices, clinics, law firms, accounting and financial services, where client confidentiality is a licensing condition rather than a preference.',
          '<strong>Manufacturers and engineering firms</strong> with proprietary specifications, tooling drawings or formulations that must not end up in somebody else\'s training corpus.',
          '<strong>Any company with a signed NDA</strong> covering the documents staff would most like AI help with.',
          '<strong>Teams already paying per seat</strong> for public AI and finding the per-head cost climbs faster than the value.',
        ],
      },
      {
        h: 'How deployment actually works',
        p: [
          'There is no mystery to it, and we do not disappear for three months. The shape is consistent across deployments:',
        ],
        ol: [
          '<strong>Assessment.</strong> We look at what your staff are trying to do with AI, what documents matter, and what your existing network and identity setup looks like. This is where most of the decisions get made.',
          '<strong>Model and hardware selection.</strong> Model choice follows the work, not the benchmark leaderboard. A document-retrieval assistant for forty people does not need the same hardware as an engineering-spec assistant for four hundred.',
          '<strong>Knowledge ingestion.</strong> Your documents, policies and procedures are indexed into a private vector store. Retrieval is scoped, so the warehouse team does not get answers from HR files.',
          '<strong>Access control and audit.</strong> Permissions map to your existing groups. Every query and every document retrieval is logged, with retention rules you set.',
          '<strong>Rollout and training.</strong> We get the first group using it properly before expanding. Most of the value is lost when people are handed a login and no method.',
        ],
      },
      {
        h: 'What it runs on',
        p: [
          'Private AI is deliberately flexible about infrastructure, because the right answer depends on what you already own:',
        ],
        ul: [
          '<strong>On-premises.</strong> A GPU server in your own rack. Highest control, highest up-front cost, no per-token spend.',
          '<strong>Private cloud tenant.</strong> Your own isolated environment with a provider you already trust. No shared inference, no training on your data, and nothing co-mingled.',
          '<strong>Hybrid.</strong> Sensitive retrieval stays inside; non-sensitive general work can route to a commercial model when that is cheaper. The routing rules are yours and they are explicit.',
        ],
        note:
          'We do not have a preferred answer we sell to everyone. If you already have capable hardware sitting idle, the honest recommendation is usually to use it.',
      },
      {
        h: 'What determines the cost',
        p: [
          'Three things, and none of them is a per-seat licence that grows every time you hire:',
        ],
        ul: [
          '<strong>Where it runs.</strong> Owned hardware is capital spend and near-zero marginal cost. A private cloud tenant is the reverse.',
          '<strong>How much knowledge it holds.</strong> Indexing ten thousand documents is not the same job as indexing ten.',
          '<strong>How deep the integration goes.</strong> A standalone assistant is straightforward. One that writes back into your ERP is a project.',
        ],
        p2: [
          'A bounded version of Private AI ships inside the <a href="/starter-pack/">AI Business Starter Pack</a> at a fixed price, which is the cheapest way to find out whether this belongs in your business before committing to a full deployment. For engine-level token economics we publish what we pay at <a href="/starter-pack/ai-engines/">AI engine pricing</a>.',
        ],
      },
      {
        h: 'The objection we hear most',
        p: [
          '<em>"Isn\'t a self-hosted model just a worse version of the frontier model?"</em>',
          'Sometimes, and it depends entirely on the job. For open-ended reasoning the frontier models are genuinely ahead. For the work most businesses actually want — find the clause in this contract, summarise this intake form, tell me what our policy says about this, extract these fields from this invoice — a well-configured open-weight model grounded in your own documents performs the task, and it performs it on data you would never have been allowed to send anywhere else.',
          'The comparison that matters is not private AI versus the best public model. It is private AI versus the AI you are currently not allowed to use at all. We wrote that comparison out properly in <a href="/compare/private-ai-vs-chatgpt-enterprise/">Private AI vs ChatGPT Enterprise</a>.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can a private AI system meet HIPAA or similar requirements?',
        a: '<p>Self-hosting removes the hardest part of the problem, which is a third party processing protected information. It does not grant compliance on its own — you still need access control, audit logging, retention rules and a documented risk assessment. We build all four in as standard, and we will tell you plainly where the remaining obligations sit with you rather than implying a deployment makes you compliant.</p>',
      },
      {
        q: 'What happens to our data when we ask it a question?',
        a: '<p>It stays inside the boundary you defined. The prompt goes to a model running on your infrastructure, retrieval pulls from your own index, and the answer comes back. There is no outbound call to a model provider, so there is nothing to opt out of and no terms to re-read when a vendor changes them.</p>',
      },
      {
        q: 'Do we need to buy GPUs?',
        a: '<p>Not necessarily. Plenty of useful deployments run on hardware a business already has, and a private cloud tenant avoids capital spend entirely. Hardware is one of the first things the assessment settles, and we would rather tell you the cheap answer than sell you a rack.</p>',
      },
      {
        q: 'What happens when a better open model is released?',
        a: '<p>You swap it. That is much of the point of building on open weights — the model is a component, not the platform. Your documents, permissions, audit history and interface stay exactly as they are.</p>',
      },
      {
        q: 'Who maintains it after it goes live?',
        a: '<p>We do, if you want that — updates, model upgrades, monitoring and adding new knowledge as the business changes. Some clients take it in-house once their own team is comfortable. Both are fine, and it is a decision you can reverse.</p>',
      },
    ],
    related: [
      { href: '/guides/private-ai/', label: 'The private AI guide', note: 'How self-hosted business AI actually works, end to end' },
      { href: '/compare/private-ai-vs-chatgpt-enterprise/', label: 'Private AI vs ChatGPT Enterprise', note: 'An honest comparison, including where the public model wins' },
      { href: '/services/private-ai-systems/', label: 'Private AI systems service', note: 'The engagement that builds and runs it' },
      { href: '/starter-pack/', label: 'AI Business Starter Pack', note: 'A fixed-price way to start' },
    ],
  },

  {
    slug: 'chat-ai-assistant',
    name: 'Chat AI Assistant',
    tag: 'Embeddable agent',
    tier: 'flagship',
    image: '/product-ai-assistant.png',
    title: 'Chat AI Assistant — a website assistant trained on your business | Felican AI',
    description:
      'A company-trained AI agent you embed in your website or app to answer questions, capture inquiries and connect customer workflows. Trained on your services, rules and approved knowledge.',
    lede:
      'A company-trained AI agent businesses can embed inside a website or app to answer questions, capture inquiries, and connect customer workflows.',
    facts: [
      { k: 'Where it lives', v: 'Your website, customer portal or business app' },
      { k: 'What it knows', v: 'Your services, policies, pricing rules and approved knowledge' },
      { k: 'What it does', v: 'Answers, qualifies, captures context, hands off' },
      { k: 'Install', v: 'One script tag' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'Most website chat is one of two disappointments. Either it is a decision tree that cannot answer anything a visitor actually typed, or it is a generic AI bolted on that confidently invents a policy you do not have.',
          'The Chat AI Assistant is trained on your approved knowledge and constrained to it. It answers from your services, your rules and your documents, and when it does not know, it says so and captures the question instead of guessing.',
        ],
      },
      {
        h: 'Who this is for',
        p: [
          'Any business whose website gets the same twenty questions over and over, and whose front desk is closed for two thirds of the week:',
        ],
        ul: [
          '<strong>Service businesses</strong> where visitors want to know scope, availability and rough pricing before they will call.',
          '<strong>Appointment-driven businesses</strong> — clinics, schools, studios — where the same scheduling and policy questions arrive all day.',
          '<strong>Companies with a real product catalogue</strong> where finding the right item is the hard part.',
          '<strong>Teams whose inbox is the bottleneck</strong>, because every enquiry needs a human to read it before anything happens.',
        ],
      },
      {
        h: 'How it behaves, specifically',
        ul: [
          '<strong>It answers from your knowledge only.</strong> Services, policies, hours, rules, documents you approved. Not from the open internet.',
          '<strong>It admits the limit.</strong> When a question falls outside what it was given, it says so and collects the detail so a person can answer properly.',
          '<strong>It captures context, not just an email address.</strong> What the visitor was asking about arrives with the lead, so whoever follows up is not starting from nothing.',
          '<strong>It can trigger real workflows</strong> — open a ticket, book a slot, route to the right team — rather than only talking.',
          '<strong>It hands off cleanly.</strong> A live conversation can go to a human without the visitor repeating themselves.',
        ],
      },
      {
        h: 'What it takes to set up',
        ol: [
          '<strong>Knowledge.</strong> We build the assistant\'s source material from your site, documents and whatever your team currently answers by hand.',
          '<strong>Rules.</strong> What it may say about price, what it must never promise, when to escalate. This is the part that separates a useful assistant from a liability.',
          '<strong>Embed.</strong> One script tag on your site. It inherits your look rather than arriving as somebody else\'s widget.',
          '<strong>Review.</strong> You read real transcripts in the first weeks and we tighten the rules against what visitors actually asked, which is never quite what anyone predicted.',
        ],
      },
      {
        h: 'What determines the cost',
        p: [
          'A fixed build fee plus the monthly AI capacity the conversations consume. A low-traffic site costs very little to run; a busy one costs more, and the allowance scales with it.',
          'The Chat AI Assistant is one of the three products in the <a href="/starter-pack/">AI Business Starter Pack</a> at a published price, which is the simplest way to buy it. Token economics are at <a href="/starter-pack/ai-engines/">AI engine pricing</a>.',
        ],
      },
    ],
    faq: [
      {
        q: 'Will it make things up about our business?',
        a: '<p>It is grounded in your approved knowledge and instructed to decline rather than speculate, which removes most of the risk. No assistant is perfect, so the rules layer matters: what it is allowed to say about price, commitments and anything with legal weight is defined explicitly, and you read real transcripts early to catch anything the rules missed.</p>',
      },
      {
        q: 'How is this different from the chat widget we already have?',
        a: '<p>Most widgets are either a routing form or a generic model with no knowledge of your business. This one is trained on your material, constrained by your rules, and can act rather than only reply. If your current widget mostly collects email addresses, the difference is obvious within a week of transcripts.</p>',
      },
      {
        q: 'Can it book appointments?',
        a: '<p>Yes, where your scheduling system allows it. If booking needs a judgement call, the usual pattern is that it gathers everything needed and hands a complete, qualified request to a person — which is faster than the assistant getting it wrong.</p>',
      },
      {
        q: 'Does it work on mobile?',
        a: '<p>Yes. Most visitors arrive on a phone, which is also when your office is most likely closed, so mobile behaviour is part of the build rather than an afterthought.</p>',
      },
    ],
    related: [
      { href: '/products/voice-ai/', label: 'Voice AI', note: 'The same knowledge, answering the phone' },
      { href: '/starter-pack/', label: 'AI Business Starter Pack', note: 'Chat, voice and private AI from one setup' },
      { href: '/industries/', label: 'Industries we build for', note: 'What this looks like in your trade' },
    ],
  },

  {
    slug: 'voice-ai',
    name: 'Voice AI',
    tag: 'Phone and front desk',
    tier: 'flagship',
    image: '/product-felican-auto.png',
    title: 'Voice AI — an AI receptionist that answers every call | Felican AI',
    description:
      'AI voice support that answers every call around the clock, knows your business, books appointments and captures leads instead of sending callers to voicemail.',
    lede:
      'AI voice and web support that answers every call and chat around the clock, connected to your business information and calendar.',
    facts: [
      { k: 'Coverage', v: 'Every call, including nights, weekends and while you are on another line' },
      { k: 'What it knows', v: 'Your services, availability, pricing rules and calendar' },
      { k: 'What it does', v: 'Answers, qualifies, books, escalates, logs' },
      { k: 'Voicemail', v: 'Nobody gets sent there' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'A voice agent that picks up your phone, holds a real conversation, and does something useful with it. It knows what you sell, what you charge for, when you are available, and what to do with a caller who needs a human.',
          'The problem it solves is unglamorous and expensive: the call you missed. A missed call at a service business is usually a job that went to whoever answered on the second try.',
        ],
      },
      {
        h: 'Who this is for',
        p: [
          'Businesses where the phone is still the primary way work arrives, and where missing it costs real money:',
        ],
        ul: [
          '<strong>Home services</strong> — plumbing, HVAC, electrical, roofing, pool. Emergency-heavy, seasonal, and the after-hours call is often the biggest job of the week.',
          '<strong>Medical and dental practices</strong> where the front desk cannot answer three lines and a patient at the counter simultaneously.',
          '<strong>Legal practices</strong> where intake quality determines whether a matter is worth taking.',
          '<strong>Auto and specialty shops</strong> fielding the same pricing and availability questions all day.',
          '<strong>Any business paying for an answering service</strong> that takes messages without answering anything.',
        ],
      },
      {
        h: 'What it does on a call',
        ul: [
          '<strong>Answers immediately</strong>, at any hour, on every line at once. There is no hold queue and no second ring.',
          '<strong>Answers the actual question</strong> — what you do, whether you cover that area, roughly what something costs, when you could come out.',
          '<strong>Books into your calendar</strong>, respecting real availability rather than promising a slot you do not have.',
          '<strong>Triages by call type.</strong> A burst pipe at 11pm and a question about store hours should not be handled the same way, and they are not.',
          '<strong>Escalates to a human</strong> when the situation needs one, with the context already gathered.',
          '<strong>Logs everything</strong> — transcript, outcome, captured details — so nothing depends on somebody remembering.',
        ],
      },
      {
        h: 'What it takes to set up',
        ol: [
          '<strong>Call inventory.</strong> We work out the call types you actually get. Most businesses have four or five, and they are not the ones on the website.',
          '<strong>Knowledge and rules.</strong> Services, service area, pricing boundaries, what it must never commit to, when it must hand off.',
          '<strong>Calendar and system connections.</strong> Whatever you already use for scheduling.',
          '<strong>Number routing.</strong> Usually it takes overflow and after-hours first. Taking every call from day one is possible, but starting at the edges is how you build trust in it.',
          '<strong>Listen and tighten.</strong> You review real calls in the first weeks. This always changes something.',
        ],
      },
      {
        h: 'What determines the cost',
        p: [
          'A build fee plus monthly capacity based on call volume and length. It is priced against what the alternative costs you — an answering service per message, a receptionist\'s salary, or the jobs currently going to voicemail.',
          'Voice AI is one of the three products in the <a href="/starter-pack/">AI Business Starter Pack</a> at a published price.',
        ],
      },
      {
        h: 'The objection we hear most',
        p: [
          '<em>"My customers will hate talking to a robot."</em>',
          'Some will, and the honest answer is that the comparison is not against your best receptionist on a quiet morning. It is against voicemail, a hold queue, or a fourth ring at 9pm. Callers are markedly more tolerant of an AI that answers instantly and actually resolves the thing than of a human who never picks up.',
          'The design decisions that matter: it says what it is, it hands off to a person without a fight, and it never traps someone in a loop. Where a caller wants a human, the goal is to get them one, not to win the call.',
        ],
      },
    ],
    faq: [
      {
        q: 'How long does an AI receptionist take to go live?',
        a: '<p>Days rather than months for a standard deployment. The work is mostly in the call inventory and the rules; the technology is the quick part. Complex calendar or dispatch integrations extend it.</p>',
      },
      {
        q: 'Can it handle emergency calls?',
        a: '<p>Yes, and triage is usually the first rule we write. An emergency is identified from what the caller says and routed straight to whoever is on call, with the details captured. The worst possible outcome is an AI calmly booking a flooding bathroom for next week, so that path gets built and tested first.</p>',
      },
      {
        q: 'Will it know our prices?',
        a: '<p>It knows whatever pricing rules you give it, and it is constrained to those. Most businesses give ranges and call-out fees rather than firm quotes, because a firm quote over the phone without seeing the job is a problem whether a human or an AI gives it.</p>',
      },
      {
        q: 'What happens if it cannot help?',
        a: '<p>It says so, collects what it has, and gets the caller to a person or a callback. It does not improvise.</p>',
      },
      {
        q: 'Can we keep our existing phone number?',
        a: '<p>Yes. Most deployments start by taking overflow and after-hours traffic on your existing number, so nothing about how customers reach you changes.</p>',
      },
    ],
    related: [
      { href: '/guides/ai-receptionist/', label: 'The AI receptionist guide', note: 'What these systems do, what they cost, where they fail' },
      { href: '/compare/ai-receptionist-vs-answering-service/', label: 'Voice AI vs a human answering service', note: 'Cost and capability, side by side' },
      { href: '/industries/hvac/', label: 'Voice AI for HVAC', note: 'Built around the emergency call' },
      { href: '/industries/plumbing/', label: 'Voice AI for plumbing', note: 'The after-hours job you are currently missing' },
    ],
  },

  {
    slug: 'felican-idp',
    name: 'Felican IDP',
    tag: 'Document processing',
    tier: 'flagship',
    image: '/product-felican-idp.png',
    title: 'Felican IDP — intelligent document processing for invoices and contracts | Felican AI',
    description:
      'Felican IDP reads the documents your business runs on — invoices, contracts, forms, receipts — and turns them into structured data your systems can use.',
    lede:
      'Intelligent Document Processor. Reads the documents your business runs on — invoices, contracts, forms, receipts — and turns them into structured, usable data.',
    facts: [
      { k: 'Input', v: 'Invoices, contracts, forms, receipts, PDFs, scans' },
      { k: 'Output', v: 'Structured fields, validated, in the format your system expects' },
      { k: 'Also does', v: 'Classification and routing' },
      { k: 'Where it runs', v: 'Cloud or fully private, same as Private AI' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'Somewhere in your business a person is retyping numbers from a PDF into a system. Felican IDP is the thing that stops that.',
          'It reads a document, works out what kind of document it is, extracts the fields that matter, validates them, and hands clean structured data to whatever you already use. No template setup for every new vendor layout, because it reads the document rather than matching coordinates on a page.',
        ],
      },
      {
        h: 'Who this is for',
        ul: [
          '<strong>Anyone with an accounts payable pile.</strong> Invoices arrive in a hundred layouts and every one gets keyed by hand.',
          '<strong>Distribution and logistics</strong> — packing lists, bills of lading, freight invoices, all arriving as scans.',
          '<strong>Contractors and trades</strong> reconciling supplier invoices against job costs.',
          '<strong>Practices handling intake forms</strong> where the information is on paper and needed in a system.',
          '<strong>Any business where a contract clause matters</strong> and nobody has time to read every renewal.',
        ],
      },
      {
        h: 'What it does, specifically',
        ul: [
          '<strong>Extracts fields</strong> — vendor, dates, line items, totals, tax, terms, party names, clause text — across layouts it has never seen.',
          '<strong>Classifies and routes.</strong> An invoice goes to AP, a signed contract goes to the file, an intake form starts a workflow.',
          '<strong>Validates.</strong> Line items that do not sum to the total, a date that cannot be right, a vendor that is not on file — these get flagged rather than silently passed on.',
          '<strong>Flags low confidence for review</strong> instead of guessing. A human checks the handful that need checking rather than all of them.',
          '<strong>Hands off clean data</strong> to your accounting, ERP or document system.',
        ],
      },
      {
        h: 'Why this is the honest use of AI',
        p: [
          'Document extraction is one of the few AI applications where the business case does not require any optimism. The task is well defined, the output is checkable, the error mode is visible, and the thing it replaces is measurably slow and dull.',
          'It is also the place where AI verification earns its keep, which is why <a href="/products/crosscheck-ai/">CrossCheck AI</a> exists — when a number is going to drive a payment, having a second model confirm the first is cheap insurance.',
        ],
      },
      {
        h: 'What determines the cost',
        ul: [
          '<strong>Volume.</strong> Documents per month is the main driver.',
          '<strong>Document variety.</strong> One form type is simple. Forty vendor invoice layouts plus contracts plus receipts is a bigger configuration job.',
          '<strong>Where it runs.</strong> Private deployment costs more to stand up and nothing per document after that.',
          '<strong>How deep the write-back goes.</strong> Producing a validated export is straightforward. Posting directly into your ERP is an integration project.',
        ],
      },
    ],
    faq: [
      {
        q: 'How accurate is the extraction?',
        a: '<p>Accuracy depends on document quality and type, and anyone quoting you a single percentage without seeing your documents is guessing. The practical answer is that the system reports its own confidence, low-confidence fields go to a human, and we measure real accuracy on <em>your</em> documents during the pilot before you commit to anything. If it does not beat your current process on your own paperwork, it is not worth buying.</p>',
      },
      {
        q: 'Do we need to set up a template for every vendor?',
        a: '<p>No, and that is the main difference from older OCR tooling. It reads documents rather than matching fixed positions, so a new vendor layout works without configuration.</p>',
      },
      {
        q: 'Can it handle handwriting and bad scans?',
        a: '<p>Printed text and clean scans are reliable. Handwriting and poor photocopies are harder and get flagged for review more often. We test with your actual worst documents, not a clean sample.</p>',
      },
      {
        q: 'Can this run without documents leaving our network?',
        a: '<p>Yes. Felican IDP can deploy on the same private footing as <a href="/products/private-ai/">Private AI</a>, which is usually the requirement when the documents are contracts or patient records.</p>',
      },
    ],
    related: [
      { href: '/compare/ai-document-processing-vs-manual-entry/', label: 'IDP vs manual data entry', note: 'Where the economics actually break even' },
      { href: '/products/crosscheck-ai/', label: 'CrossCheck AI', note: 'Verify extracted values with a second model' },
      { href: '/products/private-ai/', label: 'Private AI', note: 'Run document processing entirely in-house' },
    ],
  },

  {
    slug: 'crosscheck-ai',
    name: 'CrossCheck AI',
    tag: 'AI verification',
    tier: 'flagship',
    image: '/product-crosscheck-ai.png',
    title: 'CrossCheck AI — verify one AI model with another | Felican AI',
    description:
      'CrossCheck AI takes what one model said and runs a different model over it to confirm the answer holds. You choose the verifying model. No model marks its own homework.',
    lede:
      'A second opinion for your AI. CrossCheck takes what one model said and runs a different model over it — Claude Opus, GPT-5, whichever you choose — to confirm the answer is correct and verified.',
    facts: [
      { k: 'The principle', v: 'No model marks its own homework' },
      { k: 'You choose', v: 'The verifying model, per workflow' },
      { k: 'Output', v: 'The claims that do not hold up, surfaced rather than passed through' },
      { k: 'Where it sits', v: 'In front of work that carries consequences' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'Ask a model to check its own answer and it will usually agree with itself. That is not a bug you can prompt your way out of — it is a property of asking the same system the same question twice.',
          'CrossCheck AI takes an output from one model and puts a different model, from a different family, over the top of it. Disagreements surface. Claims that cannot be supported get flagged. What you get back is not a confidence score but a list of the specific things that did not hold up.',
        ],
      },
      {
        h: 'Who this is for',
        p: [
          'Anyone who has moved AI from drafting into a position where being wrong has a consequence:',
        ],
        ul: [
          '<strong>Teams extracting numbers that drive payments</strong> — a wrong total on an invoice is a real loss, not a typo.',
          '<strong>Professional services</strong> where an AI-assisted document goes out under somebody\'s name and licence.',
          '<strong>Anyone summarising for a decision</strong>, where a dropped caveat changes the call.',
          '<strong>Businesses with an AI governance obligation</strong> who need a documented check rather than a stated intention.',
        ],
      },
      {
        h: 'How it works',
        ol: [
          '<strong>A primary model does the work</strong> — extraction, summary, analysis, draft.',
          '<strong>You choose the verifier.</strong> A different family, deliberately. Claude Opus checking GPT, or the reverse. Same-family verification is much weaker and the tool does not pretend otherwise.',
          '<strong>The verifier is given the source and the claim</strong>, not the reasoning, and asked whether the claim is supported.',
          '<strong>Disagreements surface.</strong> You see the specific claim, what the source actually said, and why the verifier objected.',
          '<strong>Your rule decides what happens.</strong> Block, flag for review, or log and continue — per workflow, not globally.',
        ],
      },
      {
        h: 'Why this is an emerging category worth being early in',
        p: [
          'Almost every AI governance framework now asks the same question: how do you know the output was right? Most organisations answer with a process diagram and a human in the loop who reviews a sample.',
          'Verification by an independent model is a stronger answer, and it is one of the few parts of AI assurance that can actually be automated. It is also the instrument behind the disagreement-rate research we publish in the <a href="/guides/ai-governance/">AI governance guide</a> — running two models over the same real business documents produces data almost nobody else has.',
        ],
      },
      {
        h: 'What determines the cost',
        p: [
          'Verification means running a second model, so the marginal cost is roughly a second inference per checked item. That is why the rule is per workflow rather than global — you verify the invoice totals, not the internal meeting summary. Per-engine token prices are published at <a href="/starter-pack/ai-engines/">AI engine pricing</a>.',
        ],
      },
    ],
    faq: [
      {
        q: 'Why not just ask the same model to double-check itself?',
        a: '<p>Because it will mostly agree with itself. The same model, with the same training and the same blind spots, asked the same question, tends to produce the same answer and then endorse it. Independence is the entire mechanism; without a different model there is no check.</p>',
      },
      {
        q: 'Does this make AI output correct?',
        a: '<p>No, and we would not claim it. It catches disagreement between two independent systems, which catches a meaningful class of error and misses others — notably anything both models get wrong in the same way. It is a control that reduces risk, not a guarantee.</p>',
      },
      {
        q: 'Which models can verify?',
        a: '<p>You choose, and the point is to pick a different family from the one that produced the output. What matters is independence, not which particular model you trust most.</p>',
      },
      {
        q: 'Does this double our AI cost?',
        a: '<p>On verified items, roughly. That is why verification is applied per workflow rather than everywhere — you put it in front of the work where being wrong is expensive, and leave it off the rest.</p>',
      },
    ],
    related: [
      { href: '/guides/ai-governance/', label: 'The AI governance guide', note: 'Where verification fits in a real control set' },
      { href: '/products/felican-idp/', label: 'Felican IDP', note: 'The document extraction CrossCheck most often verifies' },
      { href: '/services/ai-auditing/', label: 'AI auditing', note: 'Find out what your AI is actually doing' },
    ],
  },

  {
    slug: 'relay',
    name: 'Relay',
    tag: 'Field service',
    tier: 'flagship',
    image: '/product-relay.png',
    title: 'Relay — AI field service software for HVAC, plumbing and electrical | Felican AI',
    description:
      'Relay gives HVAC, plumbing and electrical companies a practical back office in one place: scheduling, crew management, AP invoice reading, collections and AI-assisted quote follow-up.',
    lede:
      'AI field-service software that gives HVAC, plumbing, and electrical companies a practical back office in one place.',
    facts: [
      { k: 'Built for', v: 'HVAC, plumbing, electrical contractors' },
      { k: 'Covers', v: 'Scheduling, crews, AP invoices, collections, quote follow-up' },
      { k: 'The AI part', v: 'Reads invoices, drafts follow-up, flags what is slipping' },
      { k: 'Pairs with', v: 'Voice AI on the front end' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'Field service companies run on four or five disconnected things: a scheduling board, a pile of supplier invoices, a spreadsheet of outstanding quotes, and somebody\'s memory of who owes money. Relay is those in one place, with AI doing the parts that are pure transcription and chasing.',
          'It is deliberately not an enterprise field service platform. It is the back office a twelve-to-forty-person contractor actually needs, without the implementation project.',
        ],
      },
      {
        h: 'Who this is for',
        ul: [
          '<strong>HVAC contractors</strong> with maintenance agreements, seasonal load and emergency calls.',
          '<strong>Plumbing companies</strong> balancing scheduled work against emergencies that reshuffle the day.',
          '<strong>Electrical contractors</strong> running crews across multiple sites with material costs to track.',
          'Companies big enough that the spreadsheet has stopped working, and small enough that a six-figure platform is absurd.',
        ],
      },
      {
        h: 'What it does',
        ul: [
          '<strong>Schedules maintenance and manages crews</strong>, including the emergency that just reordered the afternoon.',
          '<strong>Reads AP invoices</strong> and organises them for review, instead of someone keying supplier paperwork in the evening.',
          '<strong>Tracks collections</strong> and shows what is actually outstanding rather than what was invoiced.',
          '<strong>Follows up quotes</strong> with AI-assisted drafts. Most contractors lose more money to un-chased quotes than to lost bids.',
        ],
      },
      {
        h: 'Why it pairs with Voice AI',
        p: [
          'Relay handles work once it exists. <a href="/products/voice-ai/">Voice AI</a> makes sure it exists — the after-hours emergency that would otherwise reach voicemail becomes a triaged, scheduled job. Deployed together, the call that used to go to a competitor becomes a dispatched crew with the details already captured.',
          'That combination is the shape of most of our field service work. The trade pages go into specifics: <a href="/industries/hvac/">HVAC</a>, <a href="/industries/plumbing/">plumbing</a>, <a href="/industries/electrical/">electrical</a>.',
        ],
      },
    ],
    faq: [
      {
        q: 'Do we have to move off our current scheduling software?',
        a: '<p>Not necessarily. Some clients adopt Relay as the whole back office; others use specific pieces — the AP invoice reading and quote follow-up are the two most often taken on their own. Which makes sense depends on what you already have working.</p>',
      },
      {
        q: 'How is this different from the big field service platforms?',
        a: '<p>Scope and implementation. The large platforms are comprehensive and assume a rollout project with a dedicated owner. Relay is built for a contractor who needs the back office to work next month, and where the AI removes transcription rather than adding configuration.</p>',
      },
      {
        q: 'Does it work for trades other than HVAC, plumbing and electrical?',
        a: '<p>Often, because the underlying shape — crews, scheduled work, emergencies, supplier invoices, outstanding quotes — is common across trades. Roofing and pool service fit comfortably. Tell us the trade and we will say honestly whether it fits.</p>',
      },
    ],
    related: [
      { href: '/industries/hvac/', label: 'AI for HVAC contractors', note: 'Relay and Voice AI together' },
      { href: '/products/voice-ai/', label: 'Voice AI', note: 'Stop losing the after-hours call' },
      { href: '/services/business-automation/', label: 'Business automation', note: 'When the process is specific to you' },
    ],
  },

  {
    slug: 'world-of-agents',
    name: 'World of Agents',
    tag: 'AI twins',
    tier: 'flagship',
    image: '/product-world-of-agents.png',
    title: 'World of Agents — a trusted AI twin that represents you | Felican AI',
    description:
      'Create a trusted AI Twin that can represent you, while you decide who can reach it and what it knows. Answers like you, from only what you choose to teach it.',
    lede:
      'Create a trusted AI Twin that can represent you while you decide who can reach it and what it knows.',
    facts: [
      { k: 'What it is', v: 'An AI twin that answers as you' },
      { k: 'What it knows', v: 'Only what you choose to teach it' },
      { k: 'Where it works', v: 'Web, conversations, circles, messages, calls' },
      { k: 'When unsure', v: 'It asks you rather than guessing' },
    ],
    sections: [
      {
        h: 'What it actually is',
        p: [
          'An AI twin is not a chatbot with your photo on it. It is a representation of you that can hold a conversation on your behalf, bounded by what you taught it and who you allowed to reach it.',
          'The control surface is the product. You decide what it knows, who can talk to it, and what it does when it hits the edge of its knowledge — which is to come back to you rather than improvise in your name.',
        ],
      },
      {
        h: 'Who this is for',
        ul: [
          '<strong>Advisors and consultants</strong> whose inbound volume exceeds the hours available to answer it.',
          '<strong>Founders and executives</strong> who field the same twenty questions from different people every week.',
          '<strong>Authors and educators</strong> with an audience that wants access that does not scale.',
          '<strong>Anyone whose expertise is the product</strong> and whose calendar is the constraint.',
        ],
      },
      {
        h: 'How the control works',
        ul: [
          '<strong>It answers from what you taught it.</strong> Not from a general model\'s impression of someone in your role.',
          '<strong>You set who can reach it</strong> — open, a named circle, or individually granted.',
          '<strong>It asks when it is unsure.</strong> The uncertain question comes to you instead of becoming a confident wrong answer attributed to you.',
          '<strong>It works across channels</strong> — web, messages, conversations and calls — with the same boundaries everywhere.',
        ],
      },
      {
        h: 'The honest caveat',
        p: [
          'An AI twin speaks in your name, which makes it a different category of risk from a website assistant. A wrong answer from a support bot is an annoyance; a wrong answer from your twin is attributed to you.',
          'That is why the escalation behaviour is the default rather than an option, and why we would rather a twin says "let me check with him" often in the first weeks than sounds confident and gets something wrong. If you are not comfortable reviewing what it said early on, this is not the right product yet.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can people tell they are talking to an AI twin?',
        a: '<p>Yes, and they should. Passing an AI off as a person is both a trust problem and, increasingly, a legal one. The twin represents you openly.</p>',
      },
      {
        q: 'What stops it saying something I would not say?',
        a: '<p>It is limited to what you taught it and instructed to escalate rather than extrapolate. That removes most of the risk, not all of it, which is why you review early conversations while the boundaries settle.</p>',
      },
      {
        q: 'Who owns what it learns?',
        a: '<p>You do. It is your knowledge, taught deliberately, and you can remove any of it.</p>',
      },
    ],
    related: [
      { href: '/products/chat-ai-assistant/', label: 'Chat AI Assistant', note: 'For a business rather than a person' },
      { href: '/books/', label: 'Books by Lee Felican Jr.', note: 'The thinking behind the product' },
    ],
  },

  {
    slug: 'ai-business-starter-pack',
    name: 'AI Business Starter Pack',
    tag: 'Self-serve business AI',
    tier: 'flagship',
    hubOnly: true,
    redirectTo: '/starter-pack/',
    title: 'AI Business Starter Pack — Felican AI',
    description: 'Private AI, a website assistant and Voice AI, generated from one shared source of business knowledge.',
    lede: '',
    facts: [],
    sections: [],
    faq: [],
    related: [],
  },

  /* -------------------------------------------------------------- 02 agents */
  {
    slug: 'quorum',
    name: 'Quorum',
    tag: 'Investment research',
    tier: 'agent',
    image: '/product-quorum.png',
    title: 'Quorum — an AI investment committee for stock and ETF research | Felican AI',
    description:
      'Quorum runs four AI agents as an investment committee: bull, bear, quant and risk debate a stock or ETF and return a paper-trade thesis with a quant score.',
    lede:
      'An AI investment committee: four agents debate a stock or ETF and return a paper-trade thesis with a quant score.',
    facts: [
      { k: 'Structure', v: 'Four agents — bull, bear, quant, risk' },
      { k: 'Output', v: 'A paper-trade thesis with a conviction score' },
      { k: 'Scope', v: 'Research only. Paper trades, not execution' },
    ],
    sections: [
      {
        h: 'What it does',
        p: [
          'A single AI asked about a stock produces a plausible, balanced, useless paragraph. Quorum instead runs four agents with genuinely opposed mandates — one building the bull case, one the bear case, one running the quantitative screen, one sizing the risk — and makes them argue.',
          'What comes out is a thesis with the disagreement left in: where the bull and bear actually diverge, what the numbers say about both, and a conviction score that reflects how much the committee agreed rather than how confident one model sounded.',
        ],
      },
      {
        h: 'Why the adversarial structure matters',
        p: [
          'This is the same principle behind <a href="/products/crosscheck-ai/">CrossCheck AI</a>, applied to analysis rather than extraction. A model asked to evaluate something will tend toward the agreeable middle. Models given opposing briefs surface the things that actually matter, because each is looking for what the other missed.',
        ],
        note: 'Quorum produces research and paper trades. It is not investment advice and it does not execute anything.',
      },
    ],
    faq: [
      { q: 'Does it place trades?', a: '<p>No. It produces a thesis and paper trades. Execution is deliberately out of scope.</p>' },
      { q: 'Is this investment advice?', a: '<p>No. It is a research tool that structures an argument. Decisions, and responsibility for them, stay with you.</p>' },
    ],
    related: [
      { href: '/products/floordesk/', label: 'FloorDesk', note: 'The same idea, live rather than on demand' },
      { href: '/products/quantdesk/', label: 'QuantDesk', note: 'The analytics layer on its own' },
    ],
  },

  {
    slug: 'floordesk',
    name: 'FloorDesk',
    tag: 'Trading floor',
    tier: 'agent',
    image: '/product-floordesk.png',
    title: 'FloorDesk — a personal trading war room staffed by AI agents | Felican AI',
    description:
      'FloorDesk is a personal trading war room staffed by four AI agents — Bull, Bear, Risk Officer and PM — tracking the same position in real time.',
    lede: 'A personal trading war room staffed by four agents — Bull, Bear, Risk Officer, and PM.',
    facts: [
      { k: 'Agents', v: 'Bull, Bear, Risk Officer, Portfolio Manager' },
      { k: 'Mode', v: 'Live and continuous, not request-response' },
      { k: 'Scope', v: 'Monitoring and analysis. No execution' },
    ],
    sections: [
      {
        h: 'What it does',
        p: [
          'Where <a href="/products/quorum/">Quorum</a> answers a question once, FloorDesk keeps watching. Four agents hold their positions on an open trade and flag when something changes the argument — the bear case strengthening, a risk limit approaching, a thesis that no longer matches the tape.',
          'It is built for the gap between deciding and closing, which is where most of the damage happens and where nobody is paying continuous attention.',
        ],
        note: 'Analysis and monitoring only. FloorDesk does not execute trades and is not investment advice.',
      },
    ],
    faq: [
      { q: 'Does it connect to a broker?', a: '<p>No. It monitors and analyses; it does not place or manage orders.</p>' },
    ],
    related: [
      { href: '/products/quorum/', label: 'Quorum', note: 'A one-off committee review' },
      { href: '/products/quantdesk/', label: 'QuantDesk', note: 'CFA-level analytics' },
    ],
  },

  {
    slug: 'quantdesk',
    name: 'QuantDesk',
    tag: 'Market analytics',
    tier: 'agent',
    image: '/product-quantdesk.png',
    title: 'QuantDesk — institutional market analytics with AI investor personas | Felican AI',
    description:
      'QuantDesk is an institutional market workstation pairing investor AI personas with CFA-level quantitative analytics — risk, momentum, value and quality in one view.',
    lede: 'An institutional market workstation pairing investor AI personas with CFA-level quant analytics.',
    facts: [
      { k: 'Analytics', v: 'Risk, momentum, value, quality factors' },
      { k: 'AI layer', v: 'Investor personas reading the same factor data' },
      { k: 'Built for', v: 'People who already know what a factor model is' },
    ],
    sections: [
      {
        h: 'What it does',
        p: [
          'QuantDesk is the analytics half of the trading tools, without the committee theatre. Factor exposures, risk decomposition and screens, presented properly, with AI personas that interpret the same numbers from different investment philosophies.',
          'It assumes competence. If you want the argument structured for you, <a href="/products/quorum/">Quorum</a> is the better fit; QuantDesk is for someone who wants the factor data and their own conclusion.',
        ],
        note: 'Analytics and research. Not investment advice.',
      },
    ],
    faq: [
      { q: 'Do I need a quant background?', a: '<p>It helps. QuantDesk presents factor analytics on their own terms rather than translating them, which is the point for its users and the wrong tool for everyone else.</p>' },
    ],
    related: [
      { href: '/products/quorum/', label: 'Quorum', note: 'Structured debate instead of raw factors' },
      { href: '/products/floordesk/', label: 'FloorDesk', note: 'Continuous position monitoring' },
    ],
  },

  {
    slug: 'threadpilot',
    name: 'ThreadPilot',
    tag: 'Email chief of staff',
    tier: 'agent',
    image: '/product-threadpilot.png',
    title: 'ThreadPilot — AI inbox triage that drafts your replies | Felican AI',
    description:
      'ThreadPilot triages your inbox into Urgent, Important, FYI and Noise, then drafts the replies so you edit rather than compose.',
    lede: 'Triages your inbox into Urgent, Important, FYI, and Noise, then drafts the replies.',
    facts: [
      { k: 'Triage', v: 'Urgent, Important, FYI, Noise' },
      { k: 'Then', v: 'Drafts replies for the ones that need one' },
      { k: 'You keep', v: 'Every send decision' },
    ],
    sections: [
      {
        h: 'What it does',
        p: [
          'Inbox tools mostly sort mail into folders you then have to read anyway. ThreadPilot does the two jobs that actually save time: it decides what genuinely needs you, and it writes the first draft of the reply.',
          'The split matters. Triage without drafting still leaves you composing forty replies. Drafting without triage produces forty drafts you did not need.',
        ],
      },
      {
        h: 'Who this is for',
        ul: [
          'Owners and executives whose inbox is the actual bottleneck in the business.',
          'Anyone whose reply latency is costing deals.',
          'People who have tried inbox zero systems and found the problem was volume, not method.',
        ],
        note: 'ThreadPilot drafts; it does not send on your behalf unless you explicitly set that up for a narrow category.',
      },
    ],
    faq: [
      { q: 'Does it send email without me?', a: '<p>Not by default, and we would generally advise against it. Drafts wait for you. Auto-send can be enabled for a tightly defined category if you want it.</p>' },
      { q: 'Does it read everything in my inbox?', a: '<p>It needs access to triage, which is a genuine privacy consideration and the reason clients who care most about it run this pattern against a <a href="/products/private-ai/">private deployment</a>.</p>' },
    ],
    related: [
      { href: '/products/private-ai/', label: 'Private AI', note: 'Run inbox triage without sending mail to a public model' },
      { href: '/services/business-automation/', label: 'Business automation', note: 'When the workflow is bigger than email' },
    ],
  },

  {
    slug: 'adpulse',
    name: 'AdPulse',
    tag: 'Ad auditing',
    tier: 'agent',
    image: '/product-adpulse.png',
    title: 'AdPulse — instant ad account audits with prioritised fixes | Felican AI',
    description:
      'Upload your ad data and AdPulse returns an Ads Health Score with prioritised fixes — waste, creative fatigue and budget problems ranked by what to do first.',
    lede: 'Instant ad-account audits — upload your ad data and get an Ads Health Score plus prioritized fixes.',
    facts: [
      { k: 'Input', v: 'Your ad account export' },
      { k: 'Output', v: 'Health score plus a ranked fix list' },
      { k: 'Finds', v: 'Waste, creative fatigue, budget misallocation' },
    ],
    sections: [
      {
        h: 'What it does',
        p: [
          'Ad platforms show you metrics. They do not tell you which three things to change first. AdPulse reads the account and produces a ranked list of fixes, with the waste quantified so the ordering is defensible rather than a matter of taste.',
          'It is most useful to businesses running ads without an agency, where nobody is auditing the account and spend quietly drifts into the same underperforming placements month after month.',
        ],
      },
    ],
    faq: [
      { q: 'Does it change our campaigns?', a: '<p>No. It audits and recommends; you decide and act. An AI with write access to live ad spend is a risk we are not interested in shipping.</p>' },
      { q: 'Will it replace our agency?', a: '<p>No, and it is more often used alongside one — as an independent read on whether the account is actually healthy.</p>' },
    ],
    related: [
      { href: '/services/ai-auditing/', label: 'AI auditing', note: 'The same idea applied to your AI spend' },
      { href: '/services/ai-cost-analysis-and-reduction/', label: 'AI cost reduction', note: 'Find what you are overpaying for' },
    ],
  },

  {
    slug: 'dendrite',
    name: 'Dendrite',
    tag: 'Web extraction',
    tier: 'agent',
    image: '/product-dendrite.png',
    title: 'Dendrite — LLM-optimised web extraction API | Felican AI',
    description:
      'Dendrite is a web extraction API built for language models: a URL in, clean markdown out, ready for agents and retrieval pipelines.',
    lede: 'An LLM-optimized web-extraction API — a URL in, clean markdown out.',
    facts: [
      { k: 'Input', v: 'A URL' },
      { k: 'Output', v: 'Clean markdown, no navigation or boilerplate' },
      { k: 'Built for', v: 'Agents, RAG pipelines, retrieval' },
    ],
    sections: [
      {
        h: 'What it does',
        p: [
          'Feeding raw HTML to a language model wastes most of the context window on navigation, cookie banners and footers. Dendrite strips a page to the content that matters and returns markdown a model can actually use.',
          'It is infrastructure rather than a product with a dashboard, and it exists because every retrieval system we build needed it.',
        ],
      },
    ],
    faq: [
      { q: 'Why not just fetch the HTML?', a: '<p>You can, and you will spend most of your context on markup and boilerplate. Extraction quality is the difference between a retrieval pipeline that works and one that returns navigation menus.</p>' },
      { q: 'Does it respect robots.txt?', a: '<p>Yes. Extraction tooling that ignores crawler directives creates a liability for whoever runs it.</p>' },
    ],
    related: [
      { href: '/products/private-ai/', label: 'Private AI', note: 'Where extracted knowledge usually ends up' },
      { href: '/services/custom-integrations/', label: 'Custom integrations', note: 'Wiring it into your stack' },
    ],
  },

  /* ---------------------------------------------------------------- 03 apps */
  {
    slug: 'ora',
    name: 'Ora',
    tag: 'AI workspace',
    tier: 'app',
    image: '/product-ora.png',
    title: 'Ora — multi-model AI workspace | Felican AI',
    description: 'Premium multi-model AI chat. Claude, GPT, Gemini, Grok and DeepSeek in one workspace, so you can compare answers without switching tools.',
    lede: 'Premium multi-model AI chat. Claude, GPT-4o, Gemini, Grok, and DeepSeek in one workspace.',
    facts: [{ k: 'Models', v: 'Claude, GPT, Gemini, Grok, DeepSeek' }, { k: 'Use', v: 'One prompt, compare across models' }],
    sections: [
      {
        h: 'What it does',
        p: [
          'One prompt, several models, answers side by side. Useful because model strengths differ by task more than benchmarks suggest, and the fastest way to find out which one suits your work is to ask all of them.',
          'It is also how we pick models for client deployments — and the practice that led to <a href="/products/crosscheck-ai/">CrossCheck AI</a>, once it became clear how often two good models disagree on the same business question.',
        ],
      },
    ],
    faq: [{ q: 'Why not just subscribe to one?', a: '<p>If one model does everything you need, do that. Ora is for people whose work spans tasks where the best model genuinely changes.</p>' }],
    related: [{ href: '/products/crosscheck-ai/', label: 'CrossCheck AI', note: 'What model disagreement is good for' }],
  },

  {
    slug: 'mira',
    name: 'Mira',
    tag: 'AI companion',
    tier: 'app',
    image: '/product-mira.png',
    title: 'Mira — an animated AI companion with memory | Felican AI',
    description: 'An animated AI companion with memory, so context carries between conversations instead of restarting every time.',
    lede: 'An animated AI companion with memory, so context carries between conversations.',
    facts: [{ k: 'Memory', v: 'Context persists between conversations' }, { k: 'Presence', v: 'Animated rather than a text box' }],
    sections: [
      {
        h: 'What it does',
        p: [
          'Most AI conversations start from nothing. Mira carries context forward, which changes the interaction from a series of queries into something continuous.',
          'Memory is the hard part and the reason it is a separate product: deciding what is worth remembering, and giving the person control over it, is more difficult than generating a reply.',
        ],
      },
    ],
    faq: [{ q: 'Can I see and delete what it remembers?', a: '<p>Yes. Memory you cannot inspect or remove is a product defect, not a feature.</p>' }],
    related: [{ href: '/products/world-of-agents/', label: 'World of Agents', note: 'An AI twin rather than a companion' }],
  },

  {
    slug: 'framefire',
    name: 'FrameFire',
    tag: 'Video',
    tier: 'app',
    image: '/product-framefire.png',
    title: 'FrameFire — brief-to-video generator | Felican AI',
    description: 'A brief-to-video generator: a one-line brief in, a finished vertical video out, with scenes, voice, captions and export prepared.',
    lede: 'Brief-to-video generator: a one-line brief in, a finished vertical video out.',
    facts: [{ k: 'Input', v: 'A one-line brief' }, { k: 'Output', v: 'Finished vertical video with voice and captions' }],
    sections: [
      {
        h: 'What it does',
        p: [
          'Scenes, voiceover, captions and export from a single brief. Built for businesses that need a steady stream of short video and do not have an editor, where the realistic alternative is posting nothing.',
        ],
      },
    ],
    faq: [{ q: 'Is it as good as a real editor?', a: '<p>No. It is better than the nothing most small businesses actually publish, and that is the comparison it is designed to win.</p>' }],
    related: [{ href: '/products/lumina/', label: 'Lumina', note: 'Stills rather than video' }],
  },

  {
    slug: 'lumina',
    name: 'Lumina',
    tag: 'Image studio',
    tier: 'app',
    image: '/product-lumina.png',
    title: 'Lumina — AI image studio for visual concepts | Felican AI',
    description: 'An AI image studio for turning written ideas into finished visual concepts you can explore, refine and export.',
    lede: 'An AI image studio for turning written ideas into finished visual concepts.',
    facts: [{ k: 'Input', v: 'A written idea' }, { k: 'Output', v: 'A refined, exportable visual direction' }],
    sections: [
      {
        h: 'What it does',
        p: [
          'Generation is the easy part now; the difficulty is getting from a rough idea to a direction you would actually use. Lumina is built around that refinement loop rather than around the first generation.',
        ],
      },
    ],
    faq: [{ q: 'Who owns the output?', a: '<p>You do. Note that AI-generated imagery has genuinely unsettled copyright treatment in some jurisdictions, which matters if an image is going to carry a brand.</p>' }],
    related: [{ href: '/products/framefire/', label: 'FrameFire', note: 'Video from a brief' }],
  },

  {
    slug: 'avatar-comparison',
    name: 'Avatar Comparison',
    tag: 'Avatars',
    tier: 'app',
    image: '/product-avatar-comparison.png',
    title: 'Avatar Comparison — test AI avatar engines side by side | Felican AI',
    description: 'Compare AI avatar engines side by side on motion, voice, realism and speed before committing to one.',
    lede: 'Compare AI avatar engines side by side before committing to one.',
    facts: [{ k: 'Compares', v: 'Motion, voice, realism, speed' }, { k: 'Why', v: 'Avatar engines differ more than their demos suggest' }],
    sections: [
      {
        h: 'What it does',
        p: [
          'Every avatar vendor\'s demo reel looks good, because it was chosen to. This runs the same input through several engines so you can see where each actually falls apart — usually in motion, or in how the voice handles your specific script.',
        ],
      },
    ],
    faq: [{ q: 'Which engine is best?', a: '<p>It depends on the use, which is the reason this exists rather than a recommendation page. Run your own script through it.</p>' }],
    related: [{ href: '/products/framefire/', label: 'FrameFire', note: 'Video without an avatar' }],
  },
];

export const flagship = () => PRODUCTS.filter(p => p.tier === 'flagship' && !p.hubOnly);
export const agents = () => PRODUCTS.filter(p => p.tier === 'agent');
export const apps = () => PRODUCTS.filter(p => p.tier === 'app');
export const pageProducts = () => PRODUCTS.filter(p => !p.hubOnly);

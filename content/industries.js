// Vertical pages. These exist because "AI receptionist for HVAC" is a real commercial
// query and a generic page with the trade name swapped in will not rank for it.
//
// The rule applied to every page here: if it does not name a failure specific to that
// trade — the 11pm no-heat call, the conflict check, the makeup-lesson policy — it does
// not get published. Mass-produced vertical pages are a spam signal, not a strategy.

export const INDUSTRIES = [
  {
    slug: 'hvac',
    name: 'HVAC',
    longName: 'HVAC contractors',
    title: 'AI for HVAC contractors — answer every call, dispatch every job | Felican AI',
    description:
      'AI receptionist and back-office software built for HVAC contractors: emergency triage on no-heat and no-cool calls, maintenance agreement scheduling, and supplier invoice reading.',
    lede:
      'The no-heat call at 11pm on the first cold night of the year is the most valuable call your business gets, and it is the one most likely to reach voicemail.',
    theProblem: [
      'HVAC demand is not evenly distributed and never will be. The first genuinely cold night and the first genuinely hot week generate more inbound calls in forty-eight hours than the previous month, and they arrive outside office hours because that is when people notice the system has failed.',
      'Meanwhile the office is fielding three other call types that all sound urgent to the caller: a maintenance agreement holder wanting their seasonal visit, a homeowner asking what a replacement system costs, and a commercial client whose rooftop unit is down. Triaging those correctly is the difference between a dispatched emergency and a lost customer.',
      'The pattern we see repeatedly is a contractor who is excellent in the field and losing a predictable share of revenue to the phone.',
    ],
    whatWeDeploy: [
      {
        product: 'Voice AI',
        href: '/products/voice-ai/',
        detail:
          'Answers every line at once, at any hour. Distinguishes a no-heat emergency from a price question from a maintenance visit, and routes each correctly — emergencies straight to whoever is on call with the address and fault captured, everything else scheduled or called back.',
      },
      {
        product: 'Relay',
        href: '/products/relay/',
        detail:
          'The back office: maintenance agreement scheduling, crew assignment when an emergency reorders the afternoon, supplier invoice reading, and follow-up on the replacement quotes that are currently sitting un-chased.',
      },
      {
        product: 'Chat AI Assistant',
        href: '/products/chat-ai-assistant/',
        detail:
          'Handles the website traffic that arrives at the same time as the calls — service area, brands serviced, whether you do commercial, and booking.',
      },
    ],
    specifics: [
      {
        h: 'Emergency triage is the first rule we write',
        p: 'No heat in January and no cooling in August are emergencies; a noisy condenser is not. The triage logic is built and tested before anything else goes live, because an AI calmly offering a slot three days out to someone with a dead furnace is worse than voicemail.',
      },
      {
        h: 'Maintenance agreements get chased properly',
        p: 'Agreement holders who never book their seasonal visit are the quietest revenue leak in HVAC — you have the obligation and the relationship and no visit. Scheduled outbound follow-up turns the agreement list into booked work.',
      },
      {
        h: 'Seasonal load stops being a staffing problem',
        p: 'You cannot hire a receptionist for two weeks in January. Capacity that scales with call volume is the only honest answer to a demand curve shaped like this.',
      },
      {
        h: 'Quote follow-up, because replacements are the margin',
        p: 'A system replacement quote that nobody follows up is a five-figure decision left to the homeowner\'s memory. Automated, sequenced follow-up is unglamorous and it is where the return usually shows up first.',
      },
    ],
    faq: [
      {
        q: 'Will it know which brands we service?',
        a: '<p>Yes. Service area, brands, commercial versus residential, what you will and will not work on — all part of the knowledge build, and all things callers ask before they will book.</p>',
      },
      {
        q: 'Can it dispatch to the tech on call?',
        a: '<p>Yes, and that is the main emergency path: identify the emergency, capture address and fault, reach the on-call tech with the details already gathered.</p>',
      },
      {
        q: 'How quickly could this be running before the season?',
        a: '<p>Days for voice, if you come to us before the rush rather than during it. The work is the call inventory and the triage rules, not the technology.</p>',
      },
    ],
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    longName: 'Plumbing contractors',
    title: 'AI for plumbing companies — catch the emergency call | Felican AI',
    description:
      'AI receptionist and back office for plumbing contractors: burst-pipe and no-water triage, scheduling around emergencies, supplier invoice reading and quote follow-up.',
    lede:
      'A plumbing emergency does not wait for business hours and the caller does not make a second call. They call the next plumber.',
    theProblem: [
      'Plumbing has the least forgiving inbound profile of any trade. Water is actively damaging property while the phone rings, so the caller\'s tolerance for a fourth ring is close to zero and there is no scenario where they leave a voicemail and wait.',
      'The scheduling problem compounds it: every emergency reorders a day that was already full of scheduled work, so someone has to decide in real time what slips and who gets moved.',
      'And the economics are lopsided — an emergency call-out is worth several times a routine service visit, which means the calls you are most likely to miss are the ones worth the most.',
    ],
    whatWeDeploy: [
      {
        product: 'Voice AI',
        href: '/products/voice-ai/',
        detail:
          'Picks up instantly on every line. Identifies active water damage and routes it straight to the on-call plumber with the address and the nature of the leak; books routine work into real availability.',
      },
      {
        product: 'Relay',
        href: '/products/relay/',
        detail:
          'Handles the reshuffle when an emergency lands, tracks what was moved and who needs telling, reads supplier invoices, and chases outstanding quotes.',
      },
      {
        product: 'Chat AI Assistant',
        href: '/products/chat-ai-assistant/',
        detail: 'Answers service area, call-out fee and availability questions on the website before someone decides whether to call.',
      },
    ],
    specifics: [
      {
        h: 'The first question is always "is water coming out right now"',
        p: 'That single distinction separates an emergency dispatch from a scheduled visit, and it is where the triage logic starts. Everything else follows from it.',
      },
      {
        h: 'Call-out fees stop being a surprise',
        p: 'The emergency fee explained clearly on the call, before a truck moves, prevents the argument on the doorstep. It also filters the callers who were never going to pay it.',
      },
      {
        h: 'Overnight and weekend coverage without on-call phone duty',
        p: 'Someone currently carries the phone at night. The AI takes the triage, so the human only gets woken for a genuine dispatch.',
      },
      {
        h: 'Repeat work gets captured',
        p: 'A plumber who fixed one problem usually spotted two more. Those recommendations get logged and followed up instead of living in a truck notebook.',
      },
    ],
    faq: [
      {
        q: 'Can it tell a real emergency from someone who thinks it is one?',
        a: '<p>Mostly, by asking the questions a dispatcher would — is water flowing, can you reach the shutoff, is it affecting more than one fixture. It errs toward treating it as urgent, because a false dispatch costs less than a missed flood.</p>',
      },
      {
        q: 'Will it quote a price?',
        a: '<p>Call-out fees and ranges, yes, if you give it those. Firm quotes for work nobody has seen, no — that is a problem whether a human or an AI says it.</p>',
      },
    ],
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    longName: 'Electrical contractors',
    title: 'AI for electrical contractors — intake, dispatch and job costing | Felican AI',
    description:
      'AI receptionist and back office for electrical contractors: safety-critical call triage, multi-site crew scheduling, material cost tracking and quote follow-up.',
    lede:
      'An electrical call can be a flickering light or a burning smell, and the person on the phone often cannot tell you which.',
    theProblem: [
      'Electrical intake carries a safety question most trades do not have. A caller describing a burning smell, a hot outlet or a tripping breaker that will not reset needs a different response from one with a dead socket, and the caller rarely knows which category they are in.',
      'On the commercial side the problem shifts: crews across several sites, material costs that determine whether a job made money, and bids whose accuracy depends on knowing what the last similar job actually cost.',
      'Most electrical contractors run both sides of that with the same small office team.',
    ],
    whatWeDeploy: [
      {
        product: 'Voice AI',
        href: '/products/voice-ai/',
        detail:
          'Asks the safety questions first, every time, and escalates anything with a burning smell, heat or smoke immediately — including telling the caller to kill the breaker while help is arranged.',
      },
      {
        product: 'Relay',
        href: '/products/relay/',
        detail: 'Crew allocation across sites, equipment and material tracking, supplier invoice reading, and job-cost visibility that feeds better bids.',
      },
      {
        product: 'Felican IDP',
        href: '/products/felican-idp/',
        detail: 'Reads supplier invoices and material receipts into structured job costs instead of somebody keying them at the end of the month.',
      },
    ],
    specifics: [
      {
        h: 'Safety questions come before scheduling questions',
        p: 'Burning smell, heat at an outlet, smoke, a breaker that will not reset — these get identified and escalated before any conversation about availability. This rule is written first and tested hardest.',
      },
      {
        h: 'Job costing that actually closes the loop',
        p: 'Material invoices read into job costs mean your next bid is priced against what the last one really cost, rather than against what you hoped it cost.',
      },
      {
        h: 'Multi-site crew allocation',
        p: 'Three crews, five sites and a callback creates a scheduling problem that is genuinely hard to hold in your head. It is straightforward to hold in software.',
      },
    ],
    faq: [
      {
        q: 'Can it handle a safety emergency appropriately?',
        a: '<p>It identifies the signs, gives the standard safety instruction, and escalates to a person immediately. It does not attempt to diagnose or talk anyone through electrical work, and that boundary is explicit in the rules.</p>',
      },
      {
        q: 'Does it work for commercial as well as residential?',
        a: '<p>Yes, and they get handled differently — commercial calls usually need a project contact and a site rather than a dispatch, and the routing reflects that.</p>',
      },
    ],
  },
  {
    slug: 'medical-and-dental',
    name: 'Medical & dental',
    longName: 'Medical and dental practices',
    title: 'AI for medical and dental practices — front desk relief, privately | Felican AI',
    description:
      'AI for clinics and dental practices: appointment and policy calls answered around the clock, intake documents read, and a private AI that keeps patient information inside the practice.',
    lede:
      'Your front desk cannot answer three lines and the patient standing at the counter at the same time, and the patient at the counter has to win.',
    theProblem: [
      'Practice phones carry a predictable, relentless load: appointment requests, reschedules, insurance questions, prescription queries, and the same five policy questions. Almost none of it needs clinical judgement and all of it needs answering.',
      'The constraint that makes this different from every other trade is that most of the conversation touches protected health information, which rules out the casual AI tools other businesses can adopt without thinking about it.',
      'So practices end up in the worst position: the highest volume of automatable calls, and the strongest reason not to use a public AI tool to handle them.',
    ],
    whatWeDeploy: [
      {
        product: 'Voice AI',
        href: '/products/voice-ai/',
        detail:
          'Scheduling, rescheduling, hours, location, what to bring, and what the practice does and does not treat — answered immediately, on every line, with anything clinical routed to staff rather than answered.',
      },
      {
        product: 'Private AI',
        href: '/products/private-ai/',
        detail:
          'The reason this works for a practice at all. Patient information stays inside your environment, with access control mapped to roles, audit logging on every retrieval, and retention rules you set.',
      },
      {
        product: 'Felican IDP',
        href: '/products/felican-idp/',
        detail: 'Reads intake forms, referrals and insurance paperwork into structured data instead of someone retyping it.',
      },
    ],
    specifics: [
      {
        h: 'The clinical boundary is absolute',
        p: 'The assistant does not give clinical advice, interpret symptoms, or discuss results. It schedules, it informs on logistics and policy, and it routes everything else to a person. This is a hard rule, not a tuning preference.',
      },
      {
        h: 'Private deployment is the default here, not an upgrade',
        p: 'For most trades private AI is a preference. For a practice handling protected information it is the starting requirement, which is why these deployments are built on <a href="/products/private-ai/">Private AI</a> from the outset.',
      },
      {
        h: 'Compliance obligations are stated plainly, not implied',
        p: 'Self-hosting removes third-party processing, which is the hardest part. It does not make a practice compliant by itself — you still need the risk assessment, the access controls, the audit trail and the documented policy. We build the technical controls and we tell you exactly which obligations remain yours.',
      },
      {
        h: 'No-shows get reduced by the boring mechanism',
        p: 'Reminder and confirmation calls that actually happen, every time, without adding to anyone\'s list.',
      },
    ],
    faq: [
      {
        q: 'Is this HIPAA compliant?',
        a: '<p>A deployment is not compliant or non-compliant on its own; a practice is. Self-hosting removes the largest exposure by keeping protected information out of third-party systems, and we implement access control, audit logging and retention as standard. The risk assessment, policy and workforce training remain your obligations, and we would rather say that clearly than let a deployment imply more than it delivers.</p>',
      },
      {
        q: 'Will patients be told they are speaking to an AI?',
        a: '<p>Yes. It identifies itself, and anyone who wants a person gets one.</p>',
      },
      {
        q: 'Can it access our practice management system?',
        a: '<p>For scheduling, where the system supports it, scoped to exactly what it needs. Broad access to a clinical record system is not something we would build.</p>',
      },
    ],
  },
  {
    slug: 'legal',
    name: 'Legal',
    longName: 'Law firms',
    title: 'AI for law firms — intake, conflicts and privileged documents | Felican AI',
    description:
      'AI for legal practices: structured intake on every call including after hours, contract and document review inside your own network, and privilege preserved.',
    lede:
      'A prospective client who reaches voicemail calls the next firm on the list, and intake quality decides whether the matter was worth taking anyway.',
    theProblem: [
      'Legal intake is simultaneously high-value and badly served. The caller is often in distress, frequently calling outside office hours, and deciding within one call whether to retain you. At the same time, the firm needs enough structured information to run a conflict check and judge whether the matter fits.',
      'The document side is worse. The work lawyers would most like AI help with — contracts, discovery, case files — is precisely the material that cannot be sent to a third-party model without raising a privilege and confidentiality problem.',
      'Which leaves most firms with the same impasse: the clearest AI use case in the business, and a professional obligation not to use the obvious tools for it.',
    ],
    whatWeDeploy: [
      {
        product: 'Voice AI',
        href: '/products/voice-ai/',
        detail:
          'Answers every intake call including nights and weekends, gathers structured intake — parties, dates, jurisdiction, matter type — and escalates anything urgent. It does not give legal advice and says so.',
      },
      {
        product: 'Private AI',
        href: '/products/private-ai/',
        detail:
          'Document review inside your own network. Contracts, discovery and case files never leave the firm, access is scoped by matter, and every retrieval is logged.',
      },
      {
        product: 'Felican IDP',
        href: '/products/felican-idp/',
        detail: 'Extracts parties, dates, obligations and clause text from contracts into a structured, searchable form.',
      },
    ],
    specifics: [
      {
        h: 'It never gives legal advice',
        p: 'It gathers facts, explains process and logistics, and books consultations. The line is explicit in the rules and it does not move, because an AI offering legal opinions in a firm\'s name is a professional liability rather than a feature.',
      },
      {
        h: 'Privilege is the reason for self-hosting',
        p: 'Sending privileged material to a third-party model raises a question no firm wants to answer in front of a bar committee. Keeping it inside the firm removes the question entirely.',
      },
      {
        h: 'Intake that supports a real conflict check',
        p: 'Party names, opposing parties and matter type captured consistently on every call, so the conflict check happens before anyone has invested time.',
      },
      {
        h: 'Matter-scoped access',
        p: 'Retrieval is scoped per matter, so the system cannot surface a document from an unrelated file to someone who should not see it.',
      },
    ],
    faq: [
      {
        q: 'Does using AI on client documents create a confidentiality problem?',
        a: '<p>With a third-party model, it raises a real question about disclosure to a vendor. Self-hosted, the material never leaves your environment, which is why every legal deployment we do is built on <a href="/products/private-ai/">Private AI</a>. Your own professional-responsibility obligations still apply and we are not in a position to advise you on them.</p>',
      },
      {
        q: 'Can it run a conflict check?',
        a: '<p>It captures the information a conflict check needs and can query a conflicts database where one exists. The clearance decision stays with the firm.</p>',
      },
      {
        q: 'What stops it giving advice if a caller pushes?',
        a: '<p>It declines and offers a consultation. Persistent pressure to get advice is one of the specific cases tested before a legal deployment goes live.</p>',
      },
    ],
  },
  {
    slug: 'pool-and-outdoor-services',
    name: 'Pool & outdoor',
    longName: 'Pool, patio and outdoor service companies',
    title: 'AI for pool and outdoor service companies | Felican AI',
    description:
      'AI for pool service, patio and outdoor companies: three separate call types triaged correctly, plus a private knowledge base for chemistry and equipment specs.',
    lede:
      'A pool company\'s phone carries three unrelated businesses at once, and treating them the same is what makes the day chaotic.',
    theProblem: [
      'A full-service pool business is really three operations sharing one phone number: recurring service and water chemistry, a retail counter selling chemicals and equipment, and a renovation arm quoting resurfacing and remodels. A service ticket, a question about chlorine, and a remodel enquiry need completely different handling and completely different people.',
      'On top of that sits a genuine technical knowledge problem. Water chemistry, equipment compatibility and chemical handling are things staff need right, and the reference material is scattered across manuals, supplier sheets and the memory of whoever has been there longest.',
      'In South Florida the seasonality is inverted from most trades too — the heaviest load arrives with heat and storms, not winter.',
    ],
    whatWeDeploy: [
      {
        product: 'Voice AI',
        href: '/products/voice-ai/',
        detail:
          'Identifies which of the three businesses the caller wants within the first exchange and routes accordingly — service ticket, retail question, or remodel enquiry that deserves a real estimator.',
      },
      {
        product: 'Private AI',
        href: '/products/private-ai/',
        detail:
          'An internal knowledge base for staff: chemical balancing procedures, equipment specifications and compatibility, supplier documentation — searchable, and not dependent on one person being reachable.',
      },
      {
        product: 'Chat AI Assistant',
        href: '/products/chat-ai-assistant/',
        detail: 'Handles website traffic for all three: service area, retail stock questions, and remodel enquiries captured with enough detail to quote.',
      },
    ],
    specifics: [
      {
        h: 'Three call types, three routes',
        p: 'This is the whole design problem. A recurring-service customer reporting cloudy water and a homeowner pricing a resurface should not reach the same queue, and the triage gets built around that split first.',
      },
      {
        h: 'Chemistry and equipment answers staff can trust',
        p: 'Balancing procedures and equipment compatibility retrieved from your own documented standards, so a newer technician is not guessing or phoning the owner.',
      },
      {
        h: 'Storm and heat surges absorbed',
        p: 'After a storm the call volume is not a staffing problem you can solve by hiring. It is a capacity problem, and capacity that scales is the only real answer.',
      },
      {
        h: 'Remodel enquiries captured properly',
        p: 'Resurfacing and remodel work is where the margin is. Those enquiries get qualified with pool size, current condition and scope, so the estimator is not starting cold.',
      },
    ],
    faq: [
      {
        q: 'Can it tell a service call from a retail question?',
        a: '<p>Yes, and that is the main reason to deploy it here. Distinguishing the three businesses on the phone is the first rule written.</p>',
      },
      {
        q: 'Can staff use it for chemical advice?',
        a: '<p>It retrieves from your own documented procedures and supplier material, which is different from generating chemical advice. Anything outside the documented standard escalates rather than being improvised.</p>',
      },
    ],
  },
  {
    slug: 'manufacturing-and-industrial',
    name: 'Manufacturing',
    longName: 'Manufacturing and industrial businesses',
    title: 'AI for manufacturing and industrial businesses | Felican AI',
    description:
      'Private AI for manufacturers: fast, secure retrieval across product specifications and technical documentation, plus document processing for supplier paperwork.',
    lede:
      'The documents your quoting depends on are exactly the documents you cannot put into a public AI tool.',
    theProblem: [
      'A manufacturer\'s competitive position is partly in its specifications — tooling, tolerances, material choices, formulations, hardware compatibility across product lines. That material is both the thing staff most need to search quickly and the thing that must never end up in somebody else\'s training data.',
      'The practical cost shows up in quoting. A sales engineer answering a customer question about compatibility across multiple material lines is hunting through spec sheets, and the time that takes is time the customer is waiting.',
      'The paperwork side is the familiar problem: supplier invoices, packing lists and certificates arriving as scans and getting keyed in by hand.',
    ],
    whatWeDeploy: [
      {
        product: 'Private AI',
        href: '/products/private-ai/',
        detail:
          'Secure retrieval across spec sheets, drawings, technical documentation and past quotes, running inside your own network so proprietary detail stays proprietary. This is the core of most manufacturing deployments we do.',
      },
      {
        product: 'Felican IDP',
        href: '/products/felican-idp/',
        detail: 'Supplier invoices, packing lists and certificates read into structured data rather than retyped.',
      },
      {
        product: 'Chat AI Assistant',
        href: '/products/chat-ai-assistant/',
        detail: 'Helps distributors and installers find the right part on your site, which is usually the hard part of a hardware catalogue.',
      },
    ],
    specifics: [
      {
        h: 'Specifications never leave the building',
        p: 'This is the entire reason manufacturers end up on a private deployment rather than a subscription. Tooling detail and formulations put into a public model are disclosed, whatever the vendor\'s retention policy says this quarter.',
      },
      {
        h: 'Quoting speed is where it shows first',
        p: 'Compatibility and spec lookups across material lines, answered in seconds from your own documentation, with the source document cited so the engineer can verify rather than trust.',
      },
      {
        h: 'Retrieval is scoped by role',
        p: 'Sales needs the catalogue and compatibility data. Engineering needs tolerances and drawings. Those are different scopes, and mixing them is how confidential detail leaks internally.',
      },
      {
        h: 'Answers cite their source',
        p: 'For specification work an uncited answer is useless — nobody will act on a tolerance figure without knowing which document it came from. Retrieval returns the source alongside the answer.',
      },
    ],
    faq: [
      {
        q: 'Can it read our drawings?',
        a: '<p>Text, annotations and structured data in drawings, yes. Interpreting geometry from a CAD file is a different problem and we will say so rather than overpromise.</p>',
      },
      {
        q: 'How do we stop it exposing one customer\'s specs to another?',
        a: '<p>Scoped retrieval with permissions mapped to your existing groups. Where custom work is involved this is the first thing configured and the first thing tested.</p>',
      },
      {
        q: 'Is our data used to train a model?',
        a: '<p>No. Self-hosted means there is no vendor to send it to, which is the difference from every subscription AI product.</p>',
      },
    ],
  },
];

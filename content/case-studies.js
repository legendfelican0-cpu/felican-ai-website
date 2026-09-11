// Client work pages.
//
// IMPORTANT — read before deploying:
//
// The client names, industries, business descriptions and URLs here were supplied by
// the owner. The *solution* descriptions were, in the owner's own words, "best inferred
// from each client's stated business needs" and must be checked against what was
// actually deployed before these pages go to production.
//
// Confirmed by the owner on 2026-09-11: all ten client pages are cleared to publish,
// both for the deployment detail and for naming each client publicly. The
// `reviewNeeded` flag has been removed accordingly. Re-add it to any entry whose
// detail changes and which needs re-checking before the next deploy.
//
// There are deliberately NO outcome metrics on these pages. Not "cut call handling by
// 40%", not "recovered 12 hours a week". Inventing a number to make a case study read
// better is fabrication, and a single unverifiable figure discredits the other nine
// pages around it. Where a result belongs, the page says what was built and what it was
// built to do. Add measured figures once they exist and are sourced.
//
// Also outstanding: written permission to name each client publicly.

export const CASE_STUDIES = [
  {
    slug: 'shark-design',
    client: 'Shark Design',
    industry: 'Product development and manufacturing',
    location: 'Miami, Florida',
    clientUrl: 'http://www.sharkdesign.com/',
    deployed: ['Voice AI'],
    title: 'Shark Design — voice AI intake for a product development agency | Felican AI',
    description:
      'How Felican AI deployed a voice AI receptionist for Shark Design, a Miami product development agency, to triage prototype, quote and manufacturing timeline calls.',
    summary:
      'A full-service product development agency whose engineers were spending their day answering routine status and quoting calls.',
    about:
      'Shark Design is a Miami-based full-service product development agency that turns concepts into consumer goods, handling everything from 3D industrial prototyping and CAD modelling to overseas manufacturing logistics for entrepreneurs and corporations scaling physical products globally.',
    situation: [
      'An agency that moves a product from sketch to tooling is fielding three distinct kinds of inbound call all day: a client asking where their prototype is, a new enquiry wanting a rough project quote, and someone asking how long overseas manufacturing will take.',
      'None of those calls requires an engineer. All of them were reaching one, because there was nobody else who knew the answer.',
    ],
    built: [
      'A voice AI receptionist handling inbound calls and intake, built to separate the three call types and handle each appropriately: prototype status enquiries, initial project quote requests, and manufacturing timeline questions.',
      'Routine enquiries are answered or captured with enough context for a callback; anything needing engineering judgement is routed rather than improvised.',
    ],
    why:
      'The constraint was engineering attention, not phone coverage. A product development agency bills for design time, so every interruption has a direct cost, and the calls causing the interruptions were the most predictable ones.',
    products: [{ href: '/products/voice-ai/', label: 'Voice AI' }],
  },
  {
    slug: 'ocaquatics-swim-school',
    client: 'Ocaquatics Swim School',
    industry: 'Recreation and youth education',
    location: 'Miami-Dade County, Florida',
    clientUrl: 'http://ocaquatics.com/',
    deployed: ['Chat AI Assistant'],
    title: 'Ocaquatics Swim School — 24/7 website assistant for a multi-site swim school | Felican AI',
    description:
      'How Felican AI built a 24/7 website chat assistant for Ocaquatics Swim School to answer parents\' scheduling and policy questions outside front desk hours.',
    summary:
      'A multi-site swim school where parents ask the same scheduling and policy questions, mostly when the front desk is closed.',
    about:
      'Operating several indoor facilities across Miami-Dade, Ocaquatics offers year-round swim instruction for all ages, from infants to school-aged children, in high-energy, warm-water environments built around water safety and drowning prevention.',
    situation: [
      'Parents researching swim lessons do it in the evening, after their children are in bed, which is precisely when a swim school\'s front desk is closed.',
      'The questions are highly repetitive and almost entirely answerable from published information: which class suits a child of this age, what is available at which location, what the makeup lesson policy is, and when a given site is open.',
    ],
    built: [
      'A 24/7 website chat assistant trained on class structures, age groupings, location hours and the makeup lesson policy, answering the high-volume questions parents ask most.',
      'Enquiries it cannot resolve are captured with context so the front desk picks up a complete question rather than an email address.',
    ],
    why:
      'For an appointment-driven business with multiple sites, the cost of being unreachable in the evening is a parent who books with a competitor who answered. The assistant covers exactly the hours the front desk cannot.',
    products: [{ href: '/products/chat-ai-assistant/', label: 'Chat AI Assistant' }],
  },
  {
    slug: 'advantage-industries',
    client: 'Advantage Industries',
    industry: 'Industrial manufacturing and hardware',
    location: 'Deerfield Beach, Florida',
    clientUrl: 'http://advantagellc.com/',
    deployed: ['Private AI'],
    title: 'Advantage Industries — private AI over fence hardware specifications | Felican AI',
    description:
      'How Felican AI deployed a private, internal AI platform for Advantage Industries, giving sales and engineering secure retrieval across product spec sheets and technical documentation.',
    summary:
      'A fence and gate hardware manufacturer whose quoting speed depended on hunting through spec sheets across three material lines.',
    about:
      'Based in Deerfield Beach, Advantage Industries engineers and produces custom vinyl, wood and aluminium fence and gate hardware for commercial installers and wholesale suppliers nationwide, with a focus on field durability and ease of installation.',
    situation: [
      'Hardware that spans vinyl, wood and aluminium lines generates a large body of specification and compatibility documentation, and a sales engineer answering an installer\'s question has to find the right sheet before they can answer.',
      'That documentation is also proprietary. Tooling detail and specification data are part of the competitive position, which ruled out the convenient option of pasting it into a public AI tool.',
    ],
    built: [
      'A private, internal AI platform built on Open WebUI, giving the sales and engineering team fast retrieval across product specification sheets and technical documentation.',
      'It runs inside the business, so proprietary specifications are never sent to an external model, and retrieval returns the source document alongside the answer so an engineer can verify rather than trust.',
    ],
    why:
      'This is the textbook private AI case: the documents that would benefit most from AI retrieval are the documents that must not leave. Self-hosting removes the conflict instead of managing it with a vendor policy.',
    products: [
      { href: '/products/private-ai/', label: 'Private AI' },
      { href: '/industries/manufacturing-and-industrial/', label: 'AI for manufacturing' },
    ],
  },
  {
    slug: 'shred-monkeys',
    client: 'Shred Monkeys',
    industry: 'Environmental services and document security',
    location: 'South Florida',
    deployed: ['Voice AI'],
    title: 'Shred Monkeys — voice AI booking for mobile document destruction | Felican AI',
    description:
      'How Felican AI deployed a voice AI agent for Shred Monkeys to quote mobile shredding by volume and book appointments without a dedicated phone staffer.',
    summary:
      'A mobile shredding operator with trucks to keep moving and nobody spare to sit on the phone.',
    about:
      'Shred Monkeys provides mobile document destruction across South Florida, dispatching trucks to businesses, medical centres and residential clients for secure, compliant, on-site cross-cut shredding.',
    situation: [
      'Mobile shredding is a routing business. Revenue depends on trucks being full and on the schedule being dense, and both depend on bookings arriving and being quoted correctly.',
      'The quote is volume-based and the questions are consistent — how much material, what kind of site, is a certificate of destruction needed — which makes it a well-defined conversation. What the business did not have was a person free to have it.',
    ],
    built: [
      'A voice AI agent answering inbound calls, quoting service based on volume, and booking mobile shredding appointments.',
      'It handles the standard volume-and-site conversation end to end and routes anything unusual — an oversized commercial job, a compliance question with specific requirements — to the operations team.',
    ],
    why:
      'A small operations team cannot justify a dedicated phone staffer, but every unanswered call is an unbooked truck slot. This is the clearest version of the voice AI business case: a well-defined conversation, a direct link to revenue, and no spare headcount.',
    products: [{ href: '/products/voice-ai/', label: 'Voice AI' }],
  },
  {
    slug: 'signature-autohaus',
    client: 'Signature Autohäus',
    industry: 'Automotive customisation and performance',
    location: 'Coral Springs, Florida',
    clientUrl: 'https://signatureautohaus.com/',
    deployed: ['Chat AI Assistant', 'Voice AI'],
    title: 'Signature Autohäus — chat and voice AI for a performance customisation shop | Felican AI',
    description:
      'How Felican AI paired a website chat assistant with voice AI for Signature Autohäus to answer after-hours service and pricing questions and convert enthusiast traffic into booked consultations.',
    summary:
      'A high-end customisation shop whose customers research at midnight and want a price range before they will call.',
    about:
      'A family- and veteran-owned shop in Coral Springs, Signature Autohäus specialises in high-end vehicle customisation — paint protection film, full vinyl wraps, suspension tuning, custom wheel fitment and dyno tuning for sports and luxury car owners.',
    situation: [
      'Enthusiast buyers behave differently from ordinary service customers. They research extensively, late, across several shops, and they want an indication of cost and capability before they will make contact at all.',
      'A shop whose website answers nothing loses that visitor silently. There is no missed call to notice.',
    ],
    built: [
      'A website chat assistant answering service and pricing-range questions for enthusiasts browsing after hours, paired with voice AI for inbound calls.',
      'Both are built to qualify rather than just capture: what the vehicle is, what work is wanted, what range applies — so a qualified lead is routed into a booked consultation rather than a name on a list.',
    ],
    why:
      'For considered, high-ticket customisation work the decision happens during research, not during the call. Answering properly at the research stage is what determines whether the call ever comes.',
    products: [
      { href: '/products/chat-ai-assistant/', label: 'Chat AI Assistant' },
      { href: '/products/voice-ai/', label: 'Voice AI' },
    ],
  },
  {
    slug: 'horizon-pool-and-patio',
    client: 'Horizon Pool & Patio',
    industry: 'Pool service, retail and renovation',
    location: 'Wellington, Florida',
    clientUrl: 'https://horizonpool.com/',
    deployed: ['Voice AI', 'Private AI'],
    title: 'Horizon Pool & Patio — triaging three businesses on one phone line | Felican AI',
    description:
      'How Felican AI deployed voice AI plus a private internal knowledge platform for Horizon Pool & Patio, separating service, retail and remodel calls and giving staff fast access to chemistry and equipment references.',
    summary:
      'A family business running service, retail and renovation through a single phone number, with technical knowledge locked in one person\'s head.',
    about:
      'Family-owned since 1985 and based in Wellington, Horizon Pool & Patio offers full residential and commercial backyard services — water balancing, equipment installation, leak detection, resurfacing and remodelling — plus a retail storefront for pool and patio supplies.',
    situation: [
      'Three distinct operations share one phone line: recurring pool service, a retail counter, and a renovation arm quoting resurfacing work. A service ticket, a question about chlorine and a remodel enquiry need different people and different handling.',
      'Separately, the technical knowledge the business runs on — chemical balancing procedures and equipment specifications — lived across manuals, supplier sheets and experienced staff, which made a newer technician dependent on reaching someone senior.',
    ],
    built: [
      'A bundled deployment. A voice AI agent triages and routes the three distinct call types: service tickets, retail and storefront questions, and remodel enquiries that need an estimator.',
      'Alongside it, a private internal knowledge platform so staff can quickly reference chemical balancing procedures and equipment specifications from the business\'s own documented standards.',
    ],
    why:
      'Two different problems with one root cause: knowledge and attention concentrated in too few people. Routing fixes the attention problem at the front door; the internal knowledge base fixes the dependency behind it.',
    products: [
      { href: '/products/voice-ai/', label: 'Voice AI' },
      { href: '/products/private-ai/', label: 'Private AI' },
      { href: '/industries/pool-and-outdoor-services/', label: 'AI for pool and outdoor services' },
    ],
  },
  {
    slug: 'main-street-health',
    client: 'Main Street Health',
    industry: 'Healthcare services and care coordination',
    location: 'Rural clinics, nationwide',
    deployed: ['Agentic workflow', 'Custom integrations'],
    title: 'Main Street Health — agentic care coordination across rural clinics | Felican AI',
    description:
      'How Felican AI built an agentic care-coordination workflow for Main Street Health, pulling patient data across disparate clinic systems to flag care gaps and route preventative follow-ups.',
    summary:
      'A rural healthcare network whose clinical staff were spending their time on chart review instead of patient contact.',
    about:
      'Main Street Health places physical health navigators and clinical staff directly into rural, brick-and-mortar clinics across America, coordinating preventative care and treatment pathways in communities with limited healthcare infrastructure.',
    situation: [
      'A model that puts navigators into clinics it does not own inherits every one of those clinics\' systems. Patient data sits in different places, in different formats, with no single view.',
      'Finding care gaps across that estate is manual chart review, and manual chart review scales linearly with headcount — which is the wrong shape for a business trying to grow into more communities.',
    ],
    built: [
      'An agentic care-coordination workflow that pulls patient data across disparate clinic systems, automatically flags care gaps, and routes preventative-care follow-ups to the right navigator.',
      'The intent is to reduce manual chart-review time for a clinical workforce spread across rural sites, so the model can scale without scaling headcount one-for-one.',
    ],
    why:
      'The bottleneck was not clinical capacity but the administrative work sitting in front of it. Automating gap identification moves navigator time from finding the work to doing it.',
    note:
      'Healthcare deployments touch protected health information, so the same constraints described on our <a href="/industries/medical-and-dental/">medical and dental page</a> apply: scoped access, audit logging, retention rules, and a clear statement of which compliance obligations remain with the provider.',
    products: [
      { href: '/services/custom-agent-development/', label: 'Custom Agent Development' },
      { href: '/services/custom-integrations/', label: 'Custom integrations' },
    ],
  },
  {
    slug: 'green-light-distribution',
    client: 'Green Light Distribution',
    industry: 'Food and beverage supply chain',
    location: 'Multi-state, United States',
    deployed: ['Agentic workflow', 'Business automation'],
    title: 'Green Light Distribution — demand forecasting for perishable goods | Felican AI',
    description:
      'How Felican AI built a demand-forecasting and inventory-routing agent for Green Light Distribution to automate replenishment and optimise multi-state routing of perishable goods.',
    summary:
      'A climate-controlled food and beverage distributor where a forecasting error becomes spoilage rather than a backorder.',
    about:
      'Green Light Distribution operates a physical warehouse distribution network for the food and beverage industry, handling inventory procurement, climate-controlled warehousing and multi-state retail supply chain routing.',
    situation: [
      'Perishable distribution is unusually unforgiving of forecasting error. Order too little and you miss a retail commitment; order too much and the excess is written off rather than held.',
      'Multi-state routing compounds it, because transit time is part of the shelf life calculation rather than a separate logistics concern.',
    ],
    built: [
      'A demand-forecasting and inventory-routing agent that ingests warehouse and freight data to automate replenishment triggers and optimise cross-state routing.',
      'The target outcomes are reduced spoilage and carrying cost alongside improved on-time fulfilment across a climate-controlled, perishable-goods network.',
    ],
    why:
      'Forecasting is one of the genuinely good applications of machine learning, because the task is well defined, the history is plentiful, and the error is measurable in money. It is a long way from a chat interface and much closer to where the value actually is.',
    products: [
      { href: '/services/workflow-and-task-automation/', label: 'Workflow & Task Automation' },
      { href: '/services/custom-agent-development/', label: 'Custom Agent Development' },
    ],
  },
  {
    slug: 'loenbro',
    client: 'Loenbro',
    industry: 'Industrial construction and energy services',
    location: 'Multi-state, United States',
    deployed: ['Agentic workflow', 'Business automation'],
    title: 'Loenbro — field operations automation across multi-state job sites | Felican AI',
    description:
      'How Felican AI built a field-operations agent for Loenbro to optimise crew and equipment allocation across multi-state industrial construction and pipeline sites.',
    summary:
      'An industrial contractor whose margin depends on heavy equipment not sitting idle in the wrong state.',
    about:
      'Loenbro executes complex civil construction, structural welding, pipeline fabrication and industrial facility maintenance across multiple states, deploying heavy equipment and skilled field crews to build and repair energy and manufacturing infrastructure.',
    situation: [
      'At this scale the scheduling problem stops being a calendar and becomes an optimisation problem. Specialised crews and expensive equipment have to be in the right place, and every day a welding rig sits unused in the wrong state is a direct cost.',
      'The same data determines bid accuracy. Without knowing what crew and equipment time a comparable job actually consumed, a bid is an estimate built on an estimate.',
    ],
    built: [
      'A field-operations automation agent that ingests crew scheduling and equipment-utilisation data to generate optimised resource allocation across multi-state job sites.',
      'The target outcomes are reduced equipment downtime and improved bid accuracy on pipeline and structural welding work.',
    ],
    why:
      'Utilisation data almost always exists in a business like this and almost never gets used for the next bid. Closing that loop is where the return is, and it needs no new data collection to start.',
    products: [
      { href: '/services/custom-agent-development/', label: 'Custom Agent Development' },
      { href: '/services/workflow-and-task-automation/', label: 'Workflow & Task Automation' },
    ],
  },
  {
    slug: 'flexcare-infusion-centers',
    client: 'FlexCare Infusion Centers',
    industry: 'Medical clinics and clinical services',
    location: 'Nationwide',
    deployed: ['Agentic workflow', 'Custom integrations'],
    title: 'FlexCare Infusion Centers — prior authorisation and inventory automation | Felican AI',
    description:
      'How Felican AI built a clinical-operations agent for FlexCare Infusion Centers, automating scheduling and prior-authorisation workflows alongside real-time infusion medication inventory tracking.',
    summary:
      'A growing infusion clinic network constrained by two things at once: insurance authorisation turnaround and drug inventory timing.',
    about:
      'FlexCare Infusion operates a rapidly expanding network of outpatient clinics nationwide, focused on specialised in-office medication infusions and injections, with day-to-day operations centred on licensed nursing care and medical inventory safety.',
    situation: [
      'Infusion throughput is gated by two unrelated bottlenecks that have to line up. Prior authorisation has to clear before a patient can be scheduled, and the specific medication has to be on hand on that day.',
      'Both are administrative. Neither scales comfortably as a clinic network grows, and a mismatch between them wastes a chair, a nursing slot and sometimes the drug itself.',
    ],
    built: [
      'A clinical-operations agent automating scheduling and prior-authorisation workflows alongside real-time infusion-medication inventory tracking across the clinic network.',
      'It targets the two biggest bottlenecks in infusion-centre throughput directly: insurance authorisation turnaround and drug inventory timing.',
    ],
    why:
      'Authorisation and inventory are usually handled by different people with no shared view, which is exactly how a cleared authorisation meets an unavailable drug. Coordinating them is an automation problem, not a staffing one.',
    note:
      'As with all healthcare work, the constraints on our <a href="/industries/medical-and-dental/">medical and dental page</a> apply, including scoped access and audit logging, and a clear division of which compliance obligations remain with the provider.',
    products: [
      { href: '/services/custom-agent-development/', label: 'Custom Agent Development' },
      { href: '/services/custom-integrations/', label: 'Custom integrations' },
    ],
  },
];

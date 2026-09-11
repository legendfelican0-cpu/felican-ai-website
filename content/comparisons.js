// Comparison pages.
//
// These are bottom-funnel and disproportionately quoted by AI assistants asked to
// recommend a vendor. The rule applied: every page concedes at least one real point to
// the alternative, and every page states plainly when the reader should not buy from us.
// A comparison that never gives ground reads as marketing and gets discounted, by
// readers and by the models summarising it.

export const COMPARISONS = [
  {
    slug: 'private-ai-vs-chatgpt-enterprise',
    title: 'Private AI vs ChatGPT Enterprise — an honest comparison | Felican AI',
    h1: 'Private AI vs ChatGPT Enterprise',
    description:
      'A fair comparison of self-hosted private AI against ChatGPT Enterprise for business use: data handling, capability, cost shape, and which one you should actually buy.',
    lede:
      'We sell one of these, so read this knowing that. We have also told plenty of companies to buy the other one, and the conditions where that is the right call are specific enough to state.',
    verdict:
      'If your best AI use case involves documents you are contractually or legally barred from sending to a third party, self-hosting is the only option that works. If it does not, ChatGPT Enterprise is usually faster to adopt, easier to run, and better at open-ended reasoning. Most businesses genuinely have both kinds of work.',
    table: {
      caption: 'Where each option actually lands',
      head: ['', 'Private AI (self-hosted)', 'ChatGPT Enterprise'],
      rows: [
        ['Where your data goes', 'Nowhere. Stays inside your boundary', 'To OpenAI, under enterprise terms that exclude training'],
        ['Open-ended reasoning', 'Good. Behind the frontier', '<strong>Better.</strong> Frontier models, updated continuously'],
        ['Retrieval over your documents', '<strong>Strong.</strong> Purpose-built, scoped per team', 'Good, within the platform\'s structure'],
        ['Cost shape', 'Capital or fixed infrastructure, near-zero per use', 'Per seat, per month, grows with headcount'],
        ['Time to first value', 'Days to weeks', '<strong>Hours.</strong> Buy seats and start'],
        ['Who operates it', 'You, or us on your behalf', '<strong>OpenAI.</strong> Nothing to run'],
        ['Model upgrades', 'You choose when to swap', '<strong>Automatic</strong>'],
        ['Audit trail', '<strong>Yours, complete, with your retention rules</strong>', 'Platform admin logs'],
        ['Works offline / air-gapped', '<strong>Yes</strong>', 'No'],
        ['Vendor lock-in', '<strong>Low. Open weights, portable</strong>', 'Higher'],
      ],
    },
    sections: [
      {
        h: 'Where ChatGPT Enterprise is genuinely the better buy',
        p: [
          'We would rather say this clearly than have you find out after paying us.',
        ],
        ul: [
          '<strong>Your work is open-ended reasoning.</strong> Strategy, complex analysis, hard writing, ambiguous problems. Frontier models are measurably ahead here and the gap is real.',
          '<strong>You have no data constraint.</strong> If nothing you want help with is confidential, you are paying for a privacy guarantee you do not need.',
          '<strong>You have nobody to own it.</strong> A self-hosted system needs an owner even when someone else maintains it. Managed is honestly better than neglected.',
          '<strong>You need it working this week.</strong> Seats can be bought this afternoon.',
          '<strong>Your team is small and stable.</strong> Per-seat pricing is fine at fifteen people. It is the growth curve that hurts.',
        ],
      },
      {
        h: 'Where self-hosting is the only thing that works',
        ul: [
          '<strong>A contract or regulation forbids third-party disclosure.</strong> An NDA, a privilege obligation, a data processing restriction. Enterprise terms promise no training; they do not change the fact of disclosure to a vendor, and for some obligations that fact is the problem.',
          '<strong>The documents are the competitive position.</strong> Formulations, tooling specifications, proprietary methods. Vendor policies are good today and subject to change.',
          '<strong>Air-gapped or offline operation.</strong> No debate here.',
          '<strong>Headcount is growing fast.</strong> Per-seat economics and rapid hiring are an unpleasant combination.',
          '<strong>You need an audit trail you control,</strong> with your own retention rules, because someone will eventually ask you to produce it.',
        ],
      },
      {
        h: 'The comparison people get wrong',
        p: [
          'The usual framing is "is the open model as good as GPT-5". It is the wrong question, because it compares against a tool you are not permitted to use for the work in question.',
          'The real comparison is between a self-hosted assistant grounded in your own documents and <em>nothing</em> — which is what most regulated businesses actually have today, because the compliant answer was to forbid AI rather than to deploy it safely.',
          'Against nothing, a well-configured open-weight model doing retrieval over your contracts is transformative. Against GPT-5 on a creative writing task, it is not. Both statements are true and they are about different jobs.',
        ],
      },
      {
        h: 'What most businesses end up doing',
        p: [
          'Both, deliberately, with an explicit routing rule. Confidential retrieval and document work stays inside; general reasoning and drafting goes to a commercial model. The rule is written down rather than left to individual judgement, because "use your discretion about what you paste into ChatGPT" is not a control.',
          'If you want that mapped out for your business specifically, that is what an <a href="/services/ai-implementation-and-consulting/">implementation assessment</a> produces, and it frequently recommends fewer private deployments than people expect.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does ChatGPT Enterprise train on our data?',
        a: '<p>No — OpenAI\'s enterprise terms exclude business data from training. That is a real and meaningful protection. It is a different thing from the data never leaving your environment, and which of those two you need depends on your obligations rather than on your comfort level.</p>',
      },
      {
        q: 'Is a self-hosted model much worse?',
        a: '<p>On open-ended reasoning, yes, noticeably. On retrieval, extraction, summarisation and classification over your own documents — the work most businesses actually want — the difference is small and frequently irrelevant.</p>',
      },
      {
        q: 'Which is cheaper?',
        a: '<p>Depends on headcount and volume, and the crossover is real rather than rhetorical. Per-seat pricing is cheaper for a small team; fixed infrastructure wins as headcount grows. We model it against your actual numbers in an <a href="/services/ai-cost-analysis-and-reduction/">AI cost analysis</a>, and sometimes the answer is to keep paying per seat.</p>',
      },
    ],
    related: [
      { href: '/products/private-ai/', label: 'Private AI', note: 'What we build' },
      { href: '/guides/private-ai/', label: 'The private AI guide', note: 'How self-hosting actually works' },
      { href: '/services/ai-cost-analysis-and-reduction/', label: 'AI cost analysis', note: 'Model the crossover on your numbers' },
    ],
  },

  {
    slug: 'ai-receptionist-vs-answering-service',
    title: 'AI receptionist vs a human answering service — cost and capability | Felican AI',
    h1: 'AI receptionist vs a human answering service',
    description:
      'An honest comparison of an AI receptionist against a human answering service for small businesses: what each actually does with a call, what each costs, and where the human still wins.',
    lede:
      'Both exist to stop your phone going unanswered. They do substantially different things once the call connects, and the difference is not the one most vendors lead with.',
    verdict:
      'An answering service takes a message. An AI receptionist resolves the call — answers the question, books the slot, triages the emergency. If most of your calls need an answer rather than a callback, the AI does more. If your calls are genuinely complex, emotionally difficult, or require judgement you cannot write down, keep the humans.',
    table: {
      caption: 'What actually happens when someone calls',
      head: ['', 'AI receptionist', 'Human answering service'],
      rows: [
        ['Answers your actual questions', '<strong>Yes, from your knowledge</strong>', 'Rarely. Takes a message'],
        ['Books into your calendar', '<strong>Yes</strong>', 'Sometimes, at a premium'],
        ['Simultaneous calls', '<strong>Unlimited</strong>', 'Limited by staffing'],
        ['Answer time', '<strong>Immediate, always</strong>', 'Varies with their load'],
        ['Cost model', 'Build fee plus capacity', 'Per minute or per message'],
        ['Cost at high volume', '<strong>Flattens</strong>', 'Scales linearly'],
        ['Handles genuine emotional distress', 'Poorly', '<strong>Better</strong>'],
        ['Judgement on an unusual situation', 'No. Escalates', '<strong>Yes</strong>'],
        ['Consistency', '<strong>Identical every call</strong>', 'Varies by operator'],
        ['Setup effort', 'Days. Knowledge and rules', '<strong>Hours</strong>'],
        ['Knows your prices and service area', '<strong>Yes</strong>', 'Only from a script'],
      ],
    },
    sections: [
      {
        h: 'The difference that actually matters',
        p: [
          'An answering service is a message-taking layer. A caller asks whether you service their area and at what price; the operator writes it down and you call back. The caller has not been helped, just logged — and frequently they have already called the next company while waiting.',
          'An AI receptionist has your service area, your pricing rules and your calendar. The same caller gets an answer and a booked appointment. The call is finished.',
          'If your calls mostly need a decision only you can make, this difference does not matter much. If they mostly need information you could have written down, it is the entire comparison.',
        ],
      },
      {
        h: 'Where the human answering service still wins',
        ul: [
          '<strong>Genuine distress.</strong> A frightened or grieving caller needs a person. This is not a tuning problem.',
          '<strong>Situations nobody anticipated.</strong> An AI follows rules; a human improvises. Unpredictable call types favour the human.',
          '<strong>Very low volume.</strong> At a handful of calls a month, per-message pricing is cheaper than any build fee.',
          '<strong>You cannot articulate your own rules.</strong> If pricing and scope live in your head and change case by case, there is nothing to encode yet.',
          '<strong>Immediate need.</strong> An answering service starts tomorrow.',
        ],
      },
      {
        h: 'How the cost actually compares',
        p: [
          'We are not going to put a fabricated table of monthly figures here, because answering service pricing varies enormously by provider, market and call length, and a made-up comparison would be exactly the kind of thing that should make you distrust a vendor page.',
          'The shape of it is what to reason about. An answering service charges per minute or per message, so your cost rises in direct proportion to how busy you are — you pay most in your best month. An AI receptionist is a build fee plus a capacity allowance, so the cost per call falls as volume rises.',
          'That means the crossover point is driven by volume, and it is worth actually calculating rather than guessing. Take your own current monthly answering service invoice and your own call count; we will put our numbers next to them on a call. If yours come out lower, we will tell you.',
        ],
      },
      {
        h: 'The objection worth taking seriously',
        p: [
          '<em>"My customers will hate it."</em> Some will. The honest comparison is not against your best human operator on a quiet morning; it is against voicemail at 9pm, a hold queue, or a fourth ring. Callers are markedly more tolerant of an AI that answers instantly and resolves the thing than of a human who never picks up.',
          'What makes it tolerable is design: it says what it is, it gets you to a person without a fight, and it never traps anyone in a loop. Where a caller wants a human, the job is to get them one.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can we use both?',
        a: '<p>Yes, and it is a sensible pattern. The AI takes the high-volume predictable calls and overflow; complex or sensitive calls route to the human service. You pay the per-message rate only on the calls that need it.</p>',
      },
      {
        q: 'What happens if the AI cannot help?',
        a: '<p>It says so, captures the detail and gets the caller to a person or a callback. It should never improvise, and that boundary is part of the build.</p>',
      },
      {
        q: 'Do callers know it is an AI?',
        a: '<p>Yes. It identifies itself. Disguising an AI as a person is both a trust problem and, increasingly, a legal one.</p>',
      },
    ],
    related: [
      { href: '/products/voice-ai/', label: 'Voice AI', note: 'The product' },
      { href: '/guides/ai-receptionist/', label: 'The AI receptionist guide', note: 'How these systems work in detail' },
      { href: '/industries/hvac/', label: 'For HVAC contractors', note: 'Built around the emergency call' },
    ],
  },

  {
    slug: 'ai-document-processing-vs-manual-entry',
    title: 'AI document processing vs manual data entry — where it pays off | Felican AI',
    h1: 'AI document processing vs manual data entry',
    description:
      'When intelligent document processing beats manual data entry, when it does not, and how to work out the break-even on your own invoice volume.',
    lede:
      'This is one of the few AI comparisons where the arithmetic is straightforward, which means it is also one where you can check our claims rather than take them on faith.',
    verdict:
      'Document processing pays off on volume and repetition. If somebody spends hours a week retyping structured information from documents, it pays for itself quickly. If you process twenty invoices a month, it does not, and you should not buy it.',
    table: {
      caption: 'The honest comparison',
      head: ['', 'AI document processing', 'Manual entry'],
      rows: [
        ['Speed per document', '<strong>Seconds</strong>', 'Minutes'],
        ['Cost per document at volume', '<strong>Low and flat</strong>', 'Scales with headcount'],
        ['Cost at very low volume', 'Poor. Setup dominates', '<strong>Effectively free</strong>'],
        ['Error profile', 'Confident on clean text, flags low confidence', 'Fatigue errors, usually late in a batch'],
        ['Handles unfamiliar layouts', '<strong>Yes, without templates</strong>', 'Yes, trivially'],
        ['Handwriting and poor scans', 'Weaker. Flags for review', '<strong>Better</strong>'],
        ['Works at 2am', '<strong>Yes</strong>', 'No'],
        ['Consistency', '<strong>Identical every time</strong>', 'Varies'],
        ['Validates against other data', '<strong>Yes, automatically</strong>', 'Only if told to'],
        ['Judgement on an ambiguous document', 'No. Escalates', '<strong>Yes</strong>'],
      ],
    },
    sections: [
      {
        h: 'How to work out your own break-even',
        p: [
          'This is genuinely calculable, so calculate it before anybody sells you anything:',
        ],
        ol: [
          '<strong>Count the documents.</strong> Invoices, forms, receipts, packing lists per month.',
          '<strong>Time one honestly.</strong> Not the fast one — the average, including finding it, keying it and fixing the mistake.',
          '<strong>Multiply by a real loaded hourly cost,</strong> including the part where this work happens during overtime.',
          '<strong>Add the error cost.</strong> Duplicate payments, missed discounts, month-end reconciliation. This is usually the line people forget and it is often the largest.',
          '<strong>Compare against setup plus per-document cost.</strong> If payback is inside a year, it is worth doing. If it is three years, it is not.',
        ],
        note:
          'We will run this with you on real numbers rather than a vendor calculator designed to produce a yes. If it does not pay back, we will say so — a deployment that was never justified becomes a support burden and a bad reference.',
      },
      {
        h: 'Where manual entry is still the right answer',
        ul: [
          '<strong>Low volume.</strong> Twenty documents a month is not a software problem.',
          '<strong>Genuinely unique documents</strong> that need reading and interpreting rather than field extraction.',
          '<strong>Mostly handwritten.</strong> Accuracy drops and review rates rise until you are paying for both.',
          '<strong>The entry is a tiny part of a job</strong> somebody is doing anyway while they make other decisions about the same document.',
        ],
      },
      {
        h: 'The accuracy question, answered properly',
        p: [
          'Vendors quote accuracy percentages. Those figures are meaningless without knowing the document set they were measured on, and nobody quoting you a number has seen your documents.',
          'What matters practically: the system reports its own confidence, low-confidence fields go to a human, and the error mode is therefore visible rather than silent. A human keying two hundred invoices makes quiet errors nobody catches until reconciliation; the AI flags the ones it is unsure about.',
          'The only honest way to settle it is to measure on your documents during a pilot, including your worst scans. We do that before you commit. If it does not beat your current process on your own paperwork, there is nothing to discuss.',
        ],
      },
      {
        h: 'Where verification earns its place',
        p: [
          'When an extracted number drives a payment, a second model checking the first is cheap insurance. That is what <a href="/products/crosscheck-ai/">CrossCheck AI</a> does, and document totals are its most common application — the cost is one extra inference, and the thing it prevents is a wrong payment.',
        ],
      },
    ],
    faq: [
      {
        q: 'Do we need templates for each vendor?',
        a: '<p>No. It reads documents rather than matching fixed positions, so a new vendor layout works without configuration. That is the main practical difference from older OCR tooling.</p>',
      },
      {
        q: 'What happens when it is unsure?',
        a: '<p>It flags the field for human review rather than guessing. You check the handful that need checking instead of all of them.</p>',
      },
      {
        q: 'Can it post directly into our accounting system?',
        a: '<p>Often, yes, though write-back is a bigger integration job than extraction. Many clients start with a validated export and add write-back once they trust the extraction.</p>',
      },
    ],
    related: [
      { href: '/products/felican-idp/', label: 'Felican IDP', note: 'The product' },
      { href: '/products/crosscheck-ai/', label: 'CrossCheck AI', note: 'Verify the numbers that matter' },
    ],
  },

  {
    slug: 'self-hosted-vs-cloud-ai-for-regulated-work',
    title: 'Self-hosted vs cloud AI for regulated work | Felican AI',
    h1: 'Self-hosted vs cloud AI for regulated work',
    description:
      'For healthcare, legal and financial work: what a cloud AI vendor agreement actually covers, what self-hosting changes, and how to decide which your obligations require.',
    lede:
      'If you work under a confidentiality obligation you did not write yourself, the AI question is not about capability. It is about whether disclosure to a vendor is permitted at all.',
    verdict:
      'Cloud AI under an enterprise agreement is appropriate for a great deal of regulated work, provided your obligations permit a processor and you have done the paperwork. Self-hosting is required when disclosure itself is the problem, not just training. Most firms need a written routing rule rather than one answer.',
    sections: [
      {
        h: 'The distinction everybody collapses',
        p: [
          'There are two separate concerns and they get treated as one, which is where bad decisions come from:',
        ],
        ul: [
          '<strong>Will the vendor train on our data?</strong> Enterprise agreements say no, and those commitments are real and contractual.',
          '<strong>Is the data disclosed to a third party at all?</strong> Yes, necessarily — it has to reach their servers to be processed.',
        ],
        p2: [
          'For most businesses the first question is the one that matters and the answer is satisfactory. For some obligations the second is the binding one: privilege, certain data processing restrictions, and contracts that name permitted sub-processors. No training commitment changes the fact of disclosure.',
          'Work out which question your obligation actually asks before evaluating anything. It is usually a short conversation with whoever advises you on compliance, and it eliminates most of the options immediately.',
        ],
      },
      {
        h: 'What a cloud vendor agreement typically does cover',
        ul: [
          'A contractual commitment not to train on your business data.',
          'A data processing agreement, and in healthcare a BAA where the vendor offers one.',
          'Encryption in transit and at rest, and stated retention windows.',
          'Certifications — SOC 2, ISO 27001 and similar — which are real assurance about their controls.',
          'Admin logging within their platform.',
        ],
        note:
          'This is a genuinely strong package and it satisfies many regulated use cases. Dismissing cloud AI as inherently non-compliant is wrong, and a vendor who tells you otherwise is selling.',
      },
      {
        h: 'What it does not cover',
        ul: [
          '<strong>The disclosure itself.</strong> Where your obligation restricts who may hold the information, a processing agreement does not remove the processor.',
          '<strong>Terms changing.</strong> Today\'s policy is today\'s. Your obligation is for the life of the matter.',
          '<strong>An audit trail you control.</strong> Platform logs are the platform\'s, with the platform\'s retention.',
          '<strong>Jurisdiction.</strong> Where processing happens is sometimes the controlling question and is not always yours to choose.',
          '<strong>Subpoena exposure.</strong> A third party holding your client\'s information can be compelled to produce it.',
        ],
      },
      {
        h: 'What self-hosting actually changes',
        p: [
          'One thing, completely: there is no third party. No processing agreement to negotiate, no retention policy to monitor, no sub-processor list to review, no terms to re-read next quarter.',
          'It does not grant you compliance. You still need access control, audit logging, retention rules, a risk assessment and a policy — and now you are responsible for operating them rather than inheriting them from a vendor with a security team. That is a real trade and anyone presenting self-hosting as the automatically compliant choice is skipping it.',
          'What we build includes those technical controls as standard, and we state plainly which obligations remain yours. See <a href="/industries/legal/">AI for law firms</a> and <a href="/industries/medical-and-dental/">AI for medical and dental practices</a> for how this lands in each.',
        ],
      },
      {
        h: 'How to decide',
        ol: [
          '<strong>Name the obligation.</strong> Which rule, statute, or contract clause. Not "we are in healthcare" but the specific requirement.',
          '<strong>Ask whether it permits a processor.</strong> This usually eliminates half the options immediately.',
          '<strong>Separate your use cases.</strong> Internal drafting with no client information is not the same as document review on a live matter.',
          '<strong>Write the routing rule down.</strong> Which work goes where. "Use your judgement" is not a control and will not survive a review.',
          '<strong>Document the decision</strong> with your reasoning. The question you will eventually be asked is not whether you used AI but whether you thought about it.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is cloud AI non-compliant for healthcare?',
        a: '<p>Not inherently. Major vendors offer BAAs and many covered entities use them appropriately. Whether it works for your specific use depends on your risk assessment and your own obligations, which we are not in a position to determine for you.</p>',
      },
      {
        q: 'Does self-hosting make us compliant?',
        a: '<p>No. It removes third-party disclosure, which is often the hardest part, and leaves the rest of the obligation with you — access control, audit, retention, risk assessment, training, policy. We build the technical controls; the programme is yours.</p>',
      },
      {
        q: 'Can we do both?',
        a: '<p>Yes, and most firms should. Confidential work self-hosted, general work on a commercial model, with an explicit written rule about which is which.</p>',
      },
    ],
    related: [
      { href: '/guides/ai-governance/', label: 'The AI governance guide', note: 'The control set in full' },
      { href: '/products/private-ai/', label: 'Private AI', note: 'The self-hosted option' },
      { href: '/services/ai-auditing/', label: 'AI auditing', note: 'Find out what you are already running' },
    ],
  },
];

// Pillar guides and their supporting articles.
//
// Architecture: three pillars, each with supporting pages that answer exactly one
// question. Every supporting page links back to its pillar with varied anchor text;
// the pillar links down to all of them. That two-way structure is what turns a set of
// pages into topical authority rather than a pile of orphans.
//
// Supporting-page headings are written as the question a person would actually type,
// because that is both how the query arrives and what makes a passage extractable by
// an answer engine.
//
// Hard rule observed throughout: no invented statistics. Where a number would make the
// page more persuasive but we do not have a sourced figure, the page explains how the
// reader can calculate it from their own data instead.

export const GUIDES = [
  {
    slug: 'private-ai',
    pillar: 'Private AI',
    title: 'Private AI for business — the complete guide to self-hosted AI | Felican AI',
    h1: 'Private AI for business',
    description:
      'How self-hosted AI actually works for a business: what it is, when it beats a cloud subscription, what hardware it needs, what it costs, and how to deploy it without a failed project.',
    lede:
      'A practical guide to running AI inside your own business, written for the person who has to decide whether to do it rather than for somebody evaluating model benchmarks.',
    updated: '2026-09-11',
    sections: [
      {
        h: 'What "private AI" actually means',
        p: [
          'The phrase gets used for three quite different things, and conflating them is the source of most confusion in vendor conversations.',
          '<strong>A cloud AI product with a privacy promise.</strong> Your data goes to a vendor who contractually agrees not to train on it. This is what most products labelled "enterprise AI" are. The promise is real; the disclosure still happens.',
          '<strong>A dedicated cloud tenant.</strong> Your own isolated environment with a cloud provider. No shared inference, nothing co-mingled, but still somebody else\'s infrastructure.',
          '<strong>Genuinely self-hosted.</strong> Models running on hardware you control, inside your network. No outbound call to any model provider.',
          'This guide is about the third, with notes on the second. The distinction matters because the obligations that force you into self-hosting are usually about disclosure rather than about training, and only the third option removes disclosure.',
        ],
      },
      {
        h: 'When self-hosting is the right call',
        p: ['Five conditions. You probably need one of them to justify it, and more than one makes it obvious:'],
        ol: [
          '<strong>A contract or regulation forbids third-party disclosure.</strong> Privilege, an NDA naming permitted processors, a data processing restriction. The binding question is not "will they train on it" but "may this information reach them at all".',
          '<strong>The documents are your competitive position.</strong> Formulations, tooling specifications, proprietary methods. A vendor\'s retention policy is excellent today and subject to revision.',
          '<strong>Per-seat cost is growing faster than value.</strong> Fixed infrastructure and rapid hiring favour self-hosting; small stable teams do not.',
          '<strong>You need an audit trail you control,</strong> with your own retention rules, because someone will eventually ask to see it.',
          '<strong>Offline or air-gapped operation.</strong> No further argument required.',
        ],
        p2: [
          'If none of those apply, a commercial subscription is very likely the better purchase and we would tell you so. We set the comparison out in full in <a href="/compare/private-ai-vs-chatgpt-enterprise/">Private AI vs ChatGPT Enterprise</a>.',
        ],
      },
      {
        h: 'The four components of a working system',
        p: [
          'People think of private AI as "a model". The model is the component you will replace most often and worry about least.',
        ],
        ul: [
          '<strong>The model runtime.</strong> Serves an open-weight model on your hardware. Replaceable — this is deliberately the least sticky part of the stack.',
          '<strong>Retrieval.</strong> Your documents, chunked, embedded into a vector index, searched at query time. This is where deployments succeed or fail, and it gets far less attention than it deserves.',
          '<strong>The interface.</strong> What staff actually use. An excellent model behind an interface nobody opens produces zero value, and this is the most common reason a pilot quietly dies.',
          '<strong>Access control and audit.</strong> Who can ask what, which documents they can reach, and a log of every query and retrieval.',
        ],
      },
      {
        h: 'Retrieval versus fine-tuning — the decision people get wrong',
        p: [
          'Almost everyone who asks for a model "trained on our data" wants retrieval, not fine-tuning. The distinction is worth being precise about because getting it wrong is expensive.',
          '<strong>Retrieval</strong> looks up relevant passages from your documents and gives them to the model as context. Updating means re-indexing a file. Answers can cite their source.',
          '<strong>Fine-tuning</strong> adjusts the model\'s weights to shift its style or behaviour. It does not reliably teach facts, it cannot cite anything, and updating means retraining.',
          'If you want the system to know what your policy says, that is retrieval. If you want it to write in a particular house style or follow an unusual output format consistently, that is fine-tuning. Most business requirements are the first, and we say so in the <a href="/services/custom-trained-ai-models/">custom-trained models service</a> — which begins by measuring whether retrieval already solves it.',
        ],
      },
      {
        h: 'What hardware you actually need',
        p: [
          'The honest answer is that it depends on model size, how many people use it at once, and how fast you need answers. The useful answer is the shape of the decision:',
        ],
        ul: [
          '<strong>Small team, document retrieval.</strong> A mid-size open-weight model on a single workstation-class GPU is frequently sufficient. Plenty of businesses already own something adequate.',
          '<strong>Department scale, concurrent use.</strong> A proper GPU server. This is where real capital expenditure starts.',
          '<strong>Company-wide.</strong> Multiple GPUs or a private cloud tenant, and a genuine decision about capital versus operating cost.',
          '<strong>CPU-only.</strong> Technically possible, usually too slow for interactive use. Fine for overnight batch work.',
        ],
        note:
          'We will not quote you hardware before seeing what you are trying to do. If you have capable machines sitting idle, the honest recommendation is usually to start with them and buy later, once real usage has told you what you need.',
      },
      {
        h: 'What it costs — and how to work it out yourself',
        p: [
          'We are not going to print a made-up table of monthly figures. Hardware prices move, model efficiency moves, and a fabricated comparison is exactly what should make you distrust a vendor guide.',
          'What is durable is the <em>shape</em> of the two cost curves, and you can calculate your own crossover in an afternoon:',
        ],
        ol: [
          '<strong>Count your seats</strong> and what you pay per seat per month for commercial AI today. Multiply out for a year. Then do it again at the headcount you expect in two years.',
          '<strong>Price the hardware</strong> for the deployment shape above, or get a private cloud tenant quote. Add deployment and the first year of maintenance.',
          '<strong>Compare the totals over three years.</strong> Per-seat is a line that rises with hiring; self-hosted is a step followed by a shallow slope.',
          '<strong>Add the value of the work you currently cannot do at all</strong> because the data is not allowed near a public model. For regulated businesses this is frequently the largest term in the calculation and it is the one nobody puts in the spreadsheet.',
        ],
        p2: [
          'For token-level economics on the commercial side, we publish what we actually pay per engine at <a href="/starter-pack/ai-engines/">AI engine pricing</a> and pass it through at cost. An <a href="/services/ai-cost-analysis-and-reduction/">AI cost analysis</a> runs this against your real numbers, and does sometimes conclude that you should keep paying per seat.',
        ],
      },
      {
        h: 'How deployment actually runs',
        ol: [
          '<strong>Assessment.</strong> What staff need, which documents matter, what your network and identity setup looks like. Most of the consequential decisions are made here.',
          '<strong>Model and hardware selection.</strong> Sized to the work rather than to a leaderboard.',
          '<strong>Knowledge ingestion.</strong> Documents chunked and indexed, with retrieval scoped so teams only reach what they should.',
          '<strong>Access control and audit.</strong> Permissions mapped to existing groups; logging and retention configured.',
          '<strong>Pilot with one real team.</strong> Real work, daily feedback. Retrieval scoping is always slightly wrong at first and this is where it gets fixed.',
          '<strong>Expand and maintain.</strong> Further groups as the pilot settles.',
        ],
      },
      {
        h: 'Why these projects fail',
        p: ['In roughly this order of frequency:'],
        ul: [
          '<strong>Nobody owned it.</strong> The single biggest cause. A system with no internal owner decays regardless of who maintains it.',
          '<strong>The documents were a mess.</strong> Retrieval over disorganised, contradictory content produces confidently wrong answers faster than a human would. Fix the content first.',
          '<strong>The interface was an afterthought.</strong> Staff will not use something awkward, however good the model is.',
          '<strong>Retrieval scope was too broad.</strong> Everything indexed into one pool, so answers pull from irrelevant or restricted documents and trust collapses after the first bad answer.',
          '<strong>It was sold as replacing judgement.</strong> Expectations set there are never met, and the disappointment kills adoption even when the system works.',
          '<strong>No measurement.</strong> Without a before state, nobody can say whether it helped, and the budget goes elsewhere next year.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is a self-hosted open model good enough for real work?',
        a: '<p>For retrieval, extraction, summarisation and classification over your own documents — which is most of what businesses actually want — yes. For open-ended reasoning on hard ambiguous problems, frontier models remain noticeably better. Match the tool to the task and the question mostly dissolves.</p>',
      },
      {
        q: 'How long does a deployment take?',
        a: '<p>Weeks for a focused deployment with a clear use case. Longer when documents need reorganising or integrations write back into other systems. Anyone promising you days for a full company deployment is describing a pilot.</p>',
      },
      {
        q: 'What happens when a better open model comes out?',
        a: '<p>You swap it. That is most of the argument for building on open weights — your documents, permissions, audit history and interface are unaffected.</p>',
      },
      {
        q: 'Can we start small?',
        a: '<p>You should. One team, one use case, real work. The <a href="/starter-pack/">AI Business Starter Pack</a> includes a bounded version at a fixed price, which is the cheapest way to find out whether this belongs in your business at all.</p>',
      },
      {
        q: 'Do we need an AI engineer on staff?',
        a: '<p>Not to run it, if we maintain it. You do need someone who owns it — cares that it works, notices when it does not, and decides what knowledge gets added. That person does not have to be technical.</p>',
      },
    ],
    children: [
      {
        slug: 'self-hosting-cost',
        title: 'What does it cost to self-host AI for a business? | Felican AI',
        h1: 'What does it cost to self-host an AI model?',
        description:
          'How to calculate the real cost of self-hosted AI for your business — hardware, deployment, maintenance — and the break-even against per-seat cloud AI.',
        lede:
          'The question has no single answer, but it has a reliable method. Here is how to get a number you can defend, using your own figures rather than ours.',
        sections: [
          {
            h: 'Why nobody can quote you a figure',
            p: [
              'Self-hosting cost is driven by four things that differ wildly between businesses: how many people use it concurrently, how large a model the work needs, how much documentation gets indexed, and whether you buy hardware or rent a tenant.',
              'A guide that prints "$X per month" has picked a scenario and hoped it resembles yours. Treat any such figure as marketing.',
            ],
          },
          {
            h: 'The four cost components',
            ul: [
              '<strong>Compute.</strong> Either capital — a GPU server you own and depreciate — or operating, as a private cloud tenant. Capital is higher up front and near-zero per use; the tenant is the reverse.',
              '<strong>Deployment.</strong> One-off. Assessment, infrastructure, knowledge ingestion, access control, pilot. Driven mostly by how organised your documents already are.',
              '<strong>Maintenance.</strong> Ongoing. Updates, model upgrades, monitoring, adding knowledge. Either an arrangement with us or time from your own team, which is a real cost even when it is not an invoice.',
              '<strong>Your owner\'s time.</strong> Always omitted from these calculations and never actually zero.',
            ],
          },
          {
            h: 'The calculation, step by step',
            ol: [
              '<strong>Current state.</strong> Seats × monthly price × 12. Then the same at your expected headcount in 24 months. That second number is usually the one that changes minds.',
              '<strong>Self-hosted year one.</strong> Hardware or tenant, plus deployment, plus maintenance.',
              '<strong>Self-hosted years two and three.</strong> Maintenance only, plus any capacity growth.',
              '<strong>Three-year totals, side by side.</strong>',
              '<strong>Add the unlocked work.</strong> What can you do once confidential documents are in scope that you cannot do today? For regulated businesses this term frequently dominates everything above it.',
            ],
            note:
              'Step five is the one most businesses leave out, and for a law firm or a clinic it is often the whole case. The alternative to private AI there is not cheaper AI; it is no AI on the work that matters.',
          },
          {
            h: 'Where the crossover usually sits',
            p: [
              'Directionally, and without pretending to a precision we do not have: small teams with no data constraint rarely justify self-hosting on cost alone. Larger teams, or teams growing quickly, reach a point where fixed infrastructure is plainly cheaper than a per-head licence.',
              'The crossover arrives much earlier when you count work you currently cannot do — which is why regulated businesses often find self-hosting justified at a headcount where an unregulated business would not.',
              'We will run this with your actual numbers as part of an <a href="/services/ai-cost-analysis-and-reduction/">AI cost analysis</a>, and the answer is sometimes that you should keep your subscriptions.',
            ],
          },
        ],
        faq: [
          { q: 'Is it cheaper than ChatGPT Enterprise?', a: '<p>At small scale, usually not. As headcount grows, usually yes. The crossover depends on your numbers, and counting the work you currently cannot do at all moves it earlier.</p>' },
          { q: 'Can we use hardware we already own?', a: '<p>Often. Plenty of useful deployments run on existing workstation-class machines, and starting there lets real usage tell you what to buy.</p>' },
          { q: 'What is the ongoing cost if we self-manage?', a: '<p>Infrastructure plus your own team\'s time. The time is the part that gets underestimated — somebody has to handle updates, monitoring and new knowledge.</p>' },
        ],
      },
      {
        slug: 'hipaa-and-private-ai',
        title: 'Can a private AI system meet HIPAA requirements? | Felican AI',
        h1: 'Can a private AI system meet HIPAA requirements?',
        description:
          'What self-hosting does and does not do for HIPAA compliance, which obligations remain with the practice, and how to document an AI decision defensibly.',
        lede:
          'Self-hosting removes the hardest part of the problem. It does not make you compliant, and any vendor implying otherwise is selling you a risk.',
        sections: [
          {
            h: 'What self-hosting genuinely solves',
            p: [
              'The hardest HIPAA question about AI is the third party. Sending protected health information to a model vendor makes them a business associate, which requires a BAA, a risk assessment covering them, and ongoing confidence in their controls.',
              'Self-hosted, there is no third party. No BAA to negotiate, no sub-processor to review, no vendor terms to re-read each quarter. That is a material simplification and it is the reason clinical deployments end up here.',
            ],
          },
          {
            h: 'What remains entirely yours',
            ul: [
              '<strong>Access controls.</strong> Minimum necessary access, enforced. We implement this; you define who may see what.',
              '<strong>Audit controls.</strong> Logging of access to protected information, retained per your policy.',
              '<strong>A risk analysis</strong> covering the AI system as part of your environment.',
              '<strong>Policies and procedures</strong> governing what staff may do with it.',
              '<strong>Workforce training</strong> on those policies.',
              '<strong>Contingency planning,</strong> backups and recovery.',
            ],
            note:
              'This is not a list we can complete for you. We build the technical controls — scoped access, audit logging, retention — and tell you plainly which administrative obligations stay with the practice. Felican AI does not provide legal or compliance advice, and a practice that treats a deployment as compliance has substituted a vendor claim for its own assessment.',
          },
          {
            h: 'The clinical boundary in the system itself',
            p: [
              'Separate from the regulation: a deployment in a practice must not give clinical advice, interpret symptoms or discuss results. That is a hard rule in the build, tested before go-live, not a tuning preference.',
              'What it does instead is schedule, answer logistics and policy questions, retrieve from your own documented material, and route anything clinical to a person. See <a href="/industries/medical-and-dental/">AI for medical and dental practices</a> for how that is implemented.',
            ],
          },
          {
            h: 'How to document the decision',
            ol: [
              '<strong>Name the use case precisely.</strong> "Retrieval over practice policies for front-desk staff" is assessable. "AI" is not.',
              '<strong>Record what information it can reach</strong> and the access scope.',
              '<strong>Record the controls</strong> — access, audit, retention, encryption — and who verified them.',
              '<strong>Record what you decided not to do</strong> and why. This is the part that demonstrates judgement.',
              '<strong>Review it</strong> when the system or the use changes.',
            ],
            p2: [
              'The question you will eventually be asked is not whether you used AI. It is whether you thought about it, and whether you can show the thinking.',
            ],
          },
        ],
        faq: [
          { q: 'Do we still need a BAA?', a: '<p>Not with a model vendor, because self-hosted there is no model vendor. You may still need one with us depending on whether our maintenance access touches protected information — we will tell you straight whether it does.</p>' },
          { q: 'Is this legal advice?', a: '<p>No. We build technical controls and describe them accurately. Compliance determinations are yours, with your own advisors.</p>' },
          { q: 'Can the AI talk to patients?', a: '<p>For scheduling, logistics and policy, yes. For anything clinical, no — it routes to a person, and that boundary is tested before go-live.</p>' },
        ],
      },
      {
        slug: 'retrieval-vs-fine-tuning',
        title: 'Retrieval or fine-tuning — which does your business need? | Felican AI',
        h1: 'Should you fine-tune a model or use retrieval?',
        description:
          'The practical difference between retrieval and fine-tuning for business AI, why most companies need retrieval, and the narrow cases where fine-tuning earns its cost.',
        lede:
          'Nearly everyone who asks us to train a model on their data wants retrieval. The distinction is worth ten minutes because getting it wrong costs months.',
        sections: [
          {
            h: 'What each one actually does',
            p: [
              '<strong>Retrieval</strong> leaves the model alone. At query time it searches your documents, pulls the relevant passages, and hands them to the model as context. The model reasons over text it was given.',
              '<strong>Fine-tuning</strong> changes the model\'s weights using example inputs and outputs. It shifts behaviour, style and format. It is poor at installing facts, and it cannot cite anything.',
            ],
          },
          {
            h: 'Why retrieval wins for most business cases',
            ul: [
              '<strong>Updates are trivial.</strong> A policy changes, you re-index one file. A fine-tune would need retraining.',
              '<strong>Answers cite sources.</strong> Critical for anything a person has to act on — nobody will use a tolerance figure or a contract clause without knowing which document it came from.',
              '<strong>Access control works.</strong> Retrieval can be scoped per team. A fine-tuned model has absorbed everything it was trained on and cannot un-know it for a particular user.',
              '<strong>It is far cheaper,</strong> because there is no training data to assemble.',
              '<strong>Removal is possible.</strong> Delete a document from the index and it is gone. Removing something from fine-tuned weights means retraining.',
            ],
          },
          {
            h: 'When fine-tuning is genuinely right',
            ul: [
              '<strong>A consistent output format</strong> that prompting keeps drifting away from.',
              '<strong>A specific voice or house style</strong> across large volumes of text.',
              '<strong>A narrow classification task</strong> with plenty of labelled examples, where a small fine-tuned model beats a large general one on both cost and latency.',
              '<strong>Latency or cost pressure</strong> where a small specialised model replaces a large general one at volume.',
            ],
            note:
              'Notice what is absent from that list: knowing your documents. That is always retrieval.',
          },
          {
            h: 'How to decide in one question',
            p: [
              'Ask: am I trying to change <em>what</em> it knows, or <em>how</em> it behaves?',
              'What it knows is retrieval. How it behaves is fine-tuning. If the answer is both, do retrieval first — it is cheaper, faster and frequently sufficient, and you will understand the remaining behaviour gap much better afterwards.',
              'Our <a href="/services/custom-trained-ai-models/">custom-trained models service</a> starts by measuring a retrieval baseline for exactly this reason, and a good share of those engagements stop there.',
            ],
          },
        ],
        faq: [
          { q: 'Can we do both?', a: '<p>Yes, and for a narrow high-volume task it is sometimes the right answer — a fine-tuned model for the behaviour, retrieval for the facts. Start with retrieval.</p>' },
          { q: 'How much data does fine-tuning need?', a: '<p>Consistent, labelled examples in at least the high hundreds for most tasks. Most businesses discover they do not have them yet, and assembling them is the actual project.</p>' },
          { q: 'Does retrieval work on scanned documents?', a: '<p>Once they are text. That is what <a href="/products/felican-idp/">Felican IDP</a> is for.</p>' },
        ],
      },
    ],
  },

  {
    slug: 'ai-receptionist',
    pillar: 'AI receptionists',
    title: 'AI receptionists for business — the complete practical guide | Felican AI',
    h1: 'AI receptionists, honestly',
    description:
      'What an AI receptionist actually does, how it differs from an answering service, what it costs, where it fails, and how to deploy one without annoying your customers.',
    lede:
      'Written for a business owner deciding whether to put an AI on their phone, including the parts that argue against it.',
    updated: '2026-09-11',
    sections: [
      {
        h: 'What an AI receptionist actually is',
        p: [
          'A voice agent that answers your phone, holds a real conversation, and does something with it — answers the question, books the appointment, triages the emergency, routes to a person.',
          'The distinction worth holding onto is between <em>answering</em> and <em>resolving</em>. An answering service answers and takes a message. An AI receptionist is only worth buying if it resolves, because a message-taking AI has all the limitations of automation and none of the benefit.',
        ],
      },
      {
        h: 'The problem it solves, stated plainly',
        p: [
          'The missed call. For a service business a missed call is usually a job that went to whoever answered on the second attempt, and the calls most likely to be missed — nights, weekends, during another call — are disproportionately the urgent, high-value ones.',
          'You can measure your own exposure without buying anything. Pull your call log for a month and count calls that rang out, went to voicemail without a message, or came in while another was active. Multiply by your average job value and a conservative conversion rate. That number is the honest size of the problem, and it is yours rather than a vendor\'s.',
        ],
      },
      {
        h: 'What a good one does on a call',
        ul: [
          '<strong>Answers immediately, on every line.</strong> No hold, no queue, no second ring.',
          '<strong>Identifies itself as an AI.</strong> Non-negotiable, for trust and increasingly for law.',
          '<strong>Answers the actual question</strong> from your knowledge — service area, what you do, rough cost, availability.',
          '<strong>Triages by urgency.</strong> The single most important behaviour. A flooding bathroom and a question about hours must not be handled the same way.',
          '<strong>Books into real availability,</strong> not a slot you do not have.',
          '<strong>Escalates without a fight.</strong> Anyone who wants a person gets one, quickly.',
          '<strong>Logs everything</strong> — transcript, outcome, details captured.',
        ],
      },
      {
        h: 'Where AI receptionists genuinely fail',
        p: ['If a vendor will not tell you this part, that is informative:'],
        ul: [
          '<strong>Emotional distress.</strong> A frightened, grieving or furious caller needs a human. Detect and transfer; do not try to handle it.',
          '<strong>Heavy accents and poor connections.</strong> Recognition degrades. A good deployment escalates after two failures rather than asking a third time.',
          '<strong>Anything genuinely unanticipated.</strong> It follows rules. Novel situations need a person.',
          '<strong>Complex multi-party scheduling.</strong> Coordinating three people\'s availability is still hard.',
          '<strong>Callers who refuse to engage with automation.</strong> Some will. Get them to a human fast rather than winning the argument.',
        ],
      },
      {
        h: 'What it costs, and how to check',
        p: [
          'Two components: a one-off build fee covering the call inventory, knowledge and rules, and a monthly capacity allowance tied to call volume and length.',
          'We are not going to publish a comparison table of competitor pricing, because those figures vary by provider and market and a fabricated table would be the least trustworthy thing on this page. What you can do instead is concrete: take your current answering service invoice, or the loaded cost of the front-desk hours spent on the phone, and your own monthly call count. We will put our numbers alongside yours on a call. If yours are lower, we will say so.',
          'The structural difference is that per-message and per-minute pricing rises in direct proportion to how busy you are, so you pay most in your best month. Capacity-based pricing does not. <a href="/compare/ai-receptionist-vs-answering-service/">The full comparison is here</a>.',
        ],
      },
      {
        h: 'How to deploy one without annoying anybody',
        ol: [
          '<strong>Inventory your calls first.</strong> Listen to a week. Most businesses have four or five real call types and they are not the ones on the website.',
          '<strong>Write the triage rules before anything else.</strong> What is an emergency, what happens to it. Build and test this path first.',
          '<strong>Start at the edges.</strong> After-hours and overflow. You get the benefit where you currently have nothing, and you build trust before it touches your main line.',
          '<strong>Listen to real calls in week one.</strong> Not a sample — all of them, at first. This always changes something.',
          '<strong>Make the human path obvious.</strong> The fastest way to make customers hate an AI is to make escaping it difficult.',
          '<strong>Expand only once the transcripts are boring.</strong>',
        ],
      },
      {
        h: 'Which industries this works best in',
        p: [
          'Emergency-heavy, appointment-driven and intake-driven businesses, because all three have high call volume, predictable call types, and a direct link between answering and revenue. We have written up the specifics per trade:',
        ],
        links: [
          { href: '/industries/hvac/', label: 'HVAC contractors', note: 'The no-heat call at 11pm' },
          { href: '/industries/plumbing/', label: 'Plumbing companies', note: 'Water is damaging property while the phone rings' },
          { href: '/industries/electrical/', label: 'Electrical contractors', note: 'The safety question comes first' },
          { href: '/industries/medical-and-dental/', label: 'Medical and dental practices', note: 'High volume, and a privacy constraint' },
          { href: '/industries/legal/', label: 'Law firms', note: 'Intake quality decides the matter' },
          { href: '/industries/pool-and-outdoor-services/', label: 'Pool and outdoor services', note: 'Three businesses, one phone line' },
        ],
      },
    ],
    faq: [
      { q: 'How long does an AI receptionist take to go live?', a: '<p>Days for a standard deployment. The work is the call inventory and the rules; the technology is the fast part. Complex calendar or dispatch integration extends it.</p>' },
      { q: 'Will customers know it is an AI?', a: '<p>Yes, and they should. It identifies itself. Disguising it is a trust problem and increasingly a legal one.</p>' },
      { q: 'Can it handle emergencies?', a: '<p>Yes, and triage is the first rule written. An emergency is identified from what the caller says and routed straight to whoever is on call with details captured.</p>' },
      { q: 'What if it cannot understand someone?', a: '<p>It should escalate after two failed attempts rather than asking a third time. Asking someone to repeat themselves three times is how you lose a customer.</p>' },
      { q: 'Can we keep our phone number?', a: '<p>Yes. Most deployments start by taking overflow and after-hours traffic on your existing number.</p>' },
      { q: 'What happens if it goes down?', a: '<p>Calls fall back to your existing routing. A voice system without a tested fallback is not finished, and you should ask any vendor to demonstrate theirs.</p>' },
    ],
    children: [
      {
        slug: 'how-long-to-go-live',
        title: 'How long does it take to get an AI receptionist live? | Felican AI',
        h1: 'How long does an AI receptionist take to set up?',
        description:
          'A realistic timeline for deploying an AI receptionist, what actually takes the time, and what makes a deployment run late.',
        lede: 'Days, not months — but the days are spent on things most buyers do not expect.',
        sections: [
          {
            h: 'Where the time actually goes',
            p: ['Almost none of it is technical. In rough proportion:'],
            ul: [
              '<strong>Call inventory — the largest share.</strong> Listening to real calls and working out what actually arrives. Most businesses are wrong about their own call mix, and this is where that gets corrected.',
              '<strong>Knowledge.</strong> Service area, services, pricing rules, hours, what you will not do. Often the first time a business has written this down in one place.',
              '<strong>Rules and triage.</strong> What counts as an emergency, what it must never promise, when it escalates. The highest-stakes part.',
              '<strong>Integrations.</strong> Calendar and dispatch. Quick with a modern API; this is the step that stretches a timeline when the system is older.',
              '<strong>Testing.</strong> Every call type, including the emergency paths, before it answers a real call.',
            ],
          },
          {
            h: 'What makes it run late',
            ul: [
              '<strong>Nobody can state the pricing rules.</strong> If price is case-by-case and lives in the owner\'s head, there is nothing to encode yet.',
              '<strong>A scheduling system with no usable API.</strong> The common one.',
              '<strong>No decision on what is an emergency.</strong> This needs an owner\'s judgement and cannot be delegated to us.',
              '<strong>Starting during your busy season.</strong> Nobody has time to review transcripts in the middle of a heat wave. Build before the season.',
            ],
          },
          {
            h: 'What you can do before you call us',
            ol: [
              'Pull a month of call logs. Count missed, voicemail-without-message, and simultaneous calls.',
              'Write down your four or five real call types.',
              'Write down what counts as an emergency and who it goes to.',
              'Write down your pricing rules, even roughly — ranges and call-out fees.',
              'Find out what your scheduling system can actually expose.',
            ],
            p2: ['Businesses that arrive with those five things go live considerably faster, and the exercise is worth doing regardless of what you buy.'],
          },
        ],
        faq: [
          { q: 'Could it be live this week?', a: '<p>For a simple after-hours deployment with clear rules and no integration, sometimes. For anything touching a calendar or dispatch, plan for longer.</p>' },
          { q: 'Can we pilot it on one line?', a: '<p>Yes, and you should. After-hours or overflow first is the standard approach.</p>' },
        ],
      },
      {
        slug: 'emergency-call-triage',
        title: 'How AI handles emergency calls | Felican AI',
        h1: 'Can an AI receptionist handle emergency calls?',
        description:
          'How emergency triage works in an AI voice system, why it is the first rule to build, and what the failure modes look like.',
        lede:
          'Yes — and it is the single thing to interrogate hardest before you buy, because getting it wrong is worse than having no AI at all.',
        sections: [
          {
            h: 'Why this is the first rule we write',
            p: [
              'An AI calmly offering a slot three days out to someone with a flooding bathroom or a dead furnace in January is worse than voicemail. Voicemail at least signals that nobody is handling it; a confident wrong answer does not.',
              'So triage is built and tested before anything else, and it errs toward urgency. A false emergency dispatch costs a call-out. A missed one costs a customer, a reputation and sometimes a property.',
            ],
          },
          {
            h: 'How triage actually works',
            ol: [
              '<strong>Listen for the signal.</strong> Specific language, per trade — water flowing now, no heat, burning smell, smoke, no power.',
              '<strong>Ask the dispatcher\'s question.</strong> One or two questions that separate urgent from routine. "Is water coming out right now?" does more work than any amount of model tuning.',
              '<strong>Give the safety instruction</strong> where there is one — find the shutoff, kill the breaker, leave the property.',
              '<strong>Capture what matters.</strong> Address, callback number, nature of the fault.',
              '<strong>Reach a human immediately.</strong> On-call tech, with context already gathered.',
              '<strong>Confirm to the caller</strong> what happens next and when.',
            ],
          },
          {
            h: 'What it must never do',
            ul: [
              'Diagnose. Not on a phone call, not ever for electrical or gas.',
              'Talk someone through a repair.',
              'Book an emergency as a routine appointment.',
              'Decide an emergency is not urgent. When uncertain, escalate.',
              'Leave a caller without knowing what happens next.',
            ],
          },
          {
            h: 'How to test it before you trust it',
            p: [
              'Call your own system and describe the worst scenario in your trade. Then describe it badly — the way a panicking customer actually would, vague and out of order. Then describe something that sounds urgent but is not.',
              'If it handles all three correctly it is ready. If it fails any of them, the rules are not finished. This is the test to run on any vendor\'s demo, not the scripted one they offer you.',
            ],
          },
        ],
        faq: [
          { q: 'What if it misclassifies an emergency?', a: '<p>It is deliberately biased toward treating things as urgent, so the common error is an unnecessary escalation rather than a missed emergency. That is the right direction for the error to run.</p>' },
          { q: 'Does it reach someone at 3am?', a: '<p>That is the whole point, and your on-call arrangement determines who. The AI does the triage; the human gets woken only for a genuine dispatch.</p>' },
        ],
      },
      {
        slug: 'will-customers-hate-it',
        title: 'Will customers hate talking to an AI receptionist? | Felican AI',
        h1: 'Will your customers hate it?',
        description:
          'The honest answer on customer reaction to AI receptionists, what makes people tolerate one, and the design decisions that make them resent it.',
        lede:
          'Some will. The question is what they are comparing it against, and whether you have made the human path easy.',
        sections: [
          {
            h: 'The comparison customers actually make',
            p: [
              'The objection imagines your best receptionist on a quiet weekday morning. That is not the alternative. The alternative is voicemail at 9pm, a hold queue, or a fourth ring while you are on another call.',
              'Against that, callers are markedly more tolerant than the objection predicts. People dislike automation that wastes their time. They are fine with automation that resolves the thing in ninety seconds at an hour when nobody was going to answer.',
            ],
          },
          {
            h: 'What makes people resent it',
            ul: [
              '<strong>No escape.</strong> The worst offence. If reaching a human is hard, resentment is guaranteed and deserved.',
              '<strong>Pretending to be human.</strong> People work it out, and then they distrust everything else about you.',
              '<strong>Asking them to repeat themselves repeatedly.</strong> Escalate after two failures.',
              '<strong>Being unable to answer anything.</strong> An AI that only takes messages has all the downsides of automation and none of the benefit.',
              '<strong>Loops.</strong> Being returned to the same question is worse than being told no.',
            ],
          },
          {
            h: 'What makes people fine with it',
            ul: [
              '<strong>It answers on the first ring, every time.</strong> This alone changes the interaction.',
              '<strong>It says what it is</strong> — which lowers expectations to something it can meet.',
              '<strong>It actually answers the question.</strong>',
              '<strong>"Let me get someone" works immediately.</strong>',
              '<strong>It is brief.</strong> No scripted pleasantries nobody asked for.',
            ],
          },
          {
            h: 'How to find out for your customers specifically',
            p: [
              'Deploy to after-hours only and read the transcripts. You will see, in a fortnight, exactly how your customers respond — no survey, no guessing, and no risk to your main line.',
              'If the transcripts are bad, you have lost nothing, because those were calls that previously reached voicemail.',
            ],
          },
        ],
        faq: [
          { q: 'Should we tell customers it is an AI?', a: '<p>Yes. It should identify itself on every call. Beyond the trust argument, disclosure requirements for automated voice systems are tightening.</p>' },
          { q: 'What about older customers?', a: '<p>Mixed, in our experience, and the mitigation is the same as for everyone: make the human path immediate and obvious.</p>' },
        ],
      },
    ],
  },

  {
    slug: 'ai-governance',
    pillar: 'AI governance',
    title: 'AI governance for businesses — a practical control set | Felican AI',
    h1: 'AI governance without the framework theatre',
    description:
      'A practical AI governance guide for businesses: what controls actually matter, how to build an AI inventory, how to verify output, and how to document decisions defensibly.',
    lede:
      'Most AI governance material is written for organisations with a compliance department. This is written for a business with AI already in production and nobody watching it.',
    updated: '2026-09-11',
    sections: [
      {
        h: 'The three questions you should be able to answer',
        p: [
          'Before any framework, a business with AI in production should be able to answer these. Most cannot, and the inability is the actual risk:',
        ],
        ol: [
          '<strong>What AI is in use here?</strong> Including the tools bought on someone\'s card, the browser extensions, and the staff pasting work into free consumer tools.',
          '<strong>What data has left the business?</strong> To whom, under what terms, and whether anyone read them.',
          '<strong>What happens when it is wrong, and who would notice?</strong> If the answer is "nobody", there is no control, whatever the policy document says.',
        ],
        p2: [
          'An <a href="/services/ai-auditing/">AI audit</a> exists to answer these, and the shadow-AI inventory is reliably the first surprise.',
        ],
      },
      {
        h: 'Build the inventory first',
        p: [
          'Everything else depends on this and it is usually skipped because the answer is uncomfortable. For each tool, record: what it is, who uses it, what data it touches, whether the vendor trains on that data, what it costs, and who owns it internally.',
          'Two things fall out immediately. First, the unused-licence count, which is always higher than anyone expects and pays for the whole exercise. Second, the shadow usage — which is not a discipline problem but a signal that staff had a need the sanctioned tools did not meet.',
        ],
      },
      {
        h: 'Classify your data before you write policy',
        p: [
          'A policy that says "do not put confidential information into AI tools" fails because nobody agrees what that covers. Classify first, in terms specific to your business:',
        ],
        ul: [
          '<strong>Public.</strong> Anything already published. No restriction.',
          '<strong>Internal.</strong> Ordinary business information. Commercial AI under an enterprise agreement is usually fine.',
          '<strong>Confidential.</strong> Client information, contracts, employee records, proprietary specifications. Enterprise agreement at minimum, and often self-hosted.',
          '<strong>Restricted.</strong> Privileged, regulated, or contractually barred from third-party disclosure. Self-hosted only, or not at all.',
        ],
        p2: [
          'Then the policy becomes a short routing table instead of a paragraph of judgement. "Use your discretion" is not a control and will not survive a review.',
        ],
      },
      {
        h: 'Verification is the control almost nobody implements',
        p: [
          'Every framework asks how you know the output was right. The usual answer is a human in the loop reviewing a sample, which is honest but weak — the reviewer is reading output that looks plausible, which is exactly what a language model is good at producing.',
          'A stronger answer is an independent model checking the first. Ask a model to check its own work and it will generally agree with itself; that is a property of asking the same system twice, not a prompting failure. A different model from a different family is an actual check.',
          'That is what <a href="/products/crosscheck-ai/">CrossCheck AI</a> does, and it is one of the few parts of AI assurance that can genuinely be automated. Apply it per workflow — in front of the work where being wrong is expensive, not everywhere.',
        ],
      },
      {
        h: 'The control set that actually matters',
        p: ['Six controls. Everything else is elaboration:'],
        ol: [
          '<strong>Inventory,</strong> kept current. A stale inventory is worse than none because it creates false confidence.',
          '<strong>Data classification and a routing rule</strong> mapping each class to permitted tools.',
          '<strong>Access control.</strong> Retrieval scoped so people reach only what they should.',
          '<strong>Audit logging.</strong> Who asked what, which documents were retrieved, retained per your policy.',
          '<strong>Output verification</strong> on anything with financial, legal or clinical consequence.',
          '<strong>A documented decision record</strong> per use case — what it does, what it touches, what controls apply, what you decided against and why.',
        ],
      },
      {
        h: 'Disclosure — your own AI use, and your content',
        p: [
          'Two separate obligations that get confused. An AI answering your phone or chat must identify itself as an AI; that is a trust requirement and increasingly a legal one.',
          'Separately, where AI materially produced content or a decision affecting someone, say so. Google\'s own guidance on content quality asks publishers to explain how content was created where a reader would reasonably wonder — and the same instinct is the right one for customer-facing decisions.',
          'Neither obligation is satisfied by a line in your terms of service that nobody reads.',
        ],
      },
      {
        h: 'What we publish, and what we are building',
        p: [
          'Most AI governance writing is assertion. We would rather contribute measurements, and we are positioned to produce two that almost nobody else can:',
        ],
        ul: [
          '<strong>Engine cost economics.</strong> We already publish what we actually pay per AI engine and pass it through at cost, at <a href="/starter-pack/ai-engines/">AI engine pricing</a>. Maintained rather than a snapshot.',
          '<strong>Model disagreement rates on real business documents.</strong> Because CrossCheck AI runs two independent models over the same real invoices, contracts and extractions, we can measure how often a second model contradicts the first on actual business paperwork. That is a number the industry talks about constantly and almost never measures.',
        ],
        note:
          'The disagreement-rate study is in progress and not yet published. When it is, it will carry its method and sample size so you can judge it, and it will be dated. We would rather publish nothing than publish a figure you cannot check.',
      },
    ],
    faq: [
      { q: 'Do we need an AI policy if we only use ChatGPT?', a: '<p>Yes, and it can be one page. The question is not how many tools you have but whether anyone has decided what may go into them. Without that decision, staff are each making it individually.</p>' },
      { q: 'Who should own AI governance?', a: '<p>Someone with authority to say no, and close enough to the work to know what staff actually need. In a smaller business that is usually an owner or operations lead, not IT.</p>' },
      { q: 'Is a human in the loop enough?', a: '<p>It is better than nothing and weaker than people assume, because plausible wrong output is exactly what a reviewer is least likely to catch. Pair it with independent verification on consequential work.</p>' },
      { q: 'How often should the inventory be reviewed?', a: '<p>Quarterly is realistic. Tools appear faster than that, so make adding to the inventory part of buying, not a separate exercise.</p>' },
      { q: 'Does AI governance slow everything down?', a: '<p>Done badly, yes. Done well it speeds things up, because a clear routing table means staff stop asking permission case by case and stop pasting confidential material into free tools while they wait for an answer.</p>' },
    ],
    children: [
      {
        slug: 'ai-inventory',
        title: 'How to build an AI inventory for your business | Felican AI',
        h1: 'How to build an AI inventory',
        description:
          'A practical method for finding every AI tool in use in your business, including shadow AI, and what to record about each one.',
        lede: 'The first governance control, the one everything else depends on, and the one that finds money immediately.',
        sections: [
          {
            h: 'Where to look',
            p: ['Sanctioned tools are the easy part. The inventory that matters includes what nobody told you about:'],
            ul: [
              '<strong>Card and expense records.</strong> Search for AI vendor names across twelve months. Departmental subscriptions live here.',
              '<strong>SSO and identity logs.</strong> Which third-party applications staff have authenticated into.',
              '<strong>Browser extensions,</strong> if you have any visibility. A writing assistant extension can read every page it is on.',
              '<strong>Features inside tools you already pay for.</strong> Your CRM, help desk and office suite have all added AI features, frequently enabled by default.',
              '<strong>Ask people directly, without consequence attached.</strong> Make it explicit that the point is to sanction what is useful, not to discipline anyone. You will get a far better answer.',
            ],
          },
          {
            h: 'What to record',
            ul: [
              'Tool name and vendor.',
              'Who uses it, and how often — against licences purchased.',
              'What data goes into it, using your classification.',
              'Whether the vendor trains on that data, and under which agreement.',
              'Cost, and who pays.',
              'An internal owner. A tool with no owner is the one that causes the incident.',
            ],
          },
          {
            h: 'What you will find',
            p: [
              'Three things, reliably. Unused licences, usually enough to cover the cost of doing this. Duplicate tools doing the same job in different departments. And shadow usage.',
              'Treat the shadow usage as product feedback rather than misconduct. Staff went around the sanctioned tools because those tools did not do the job. Sanctioning a good tool they found is a better outcome than banning it and watching usage move somewhere you cannot see.',
            ],
          },
        ],
        faq: [
          { q: 'How long does this take?', a: '<p>Days for a small business, weeks where spend is decentralised. The expense-record search alone usually justifies the time.</p>' },
          { q: 'Should we ban shadow AI?', a: '<p>Ban it where the data class forbids it. Otherwise work out what need it met and meet that need properly, or it will simply move further out of sight.</p>' },
        ],
      },
      {
        slug: 'ai-policy-template',
        title: 'A one-page AI policy your staff will actually read | Felican AI',
        h1: 'A one-page AI policy',
        description:
          'A short, practical AI use policy built around data classification and a routing table, with the sections that matter and the ones that do not.',
        lede:
          'Long policies do not get read, and an unread policy is not a control. Here is the short version, and what each part is for.',
        sections: [
          {
            h: 'Why most AI policies fail',
            p: [
              'They are written to satisfy an auditor rather than to guide a decision. "Exercise appropriate caution when using AI tools with sensitive information" tells a member of staff nothing actionable, so they fall back on their own judgement — which is precisely the situation the policy was meant to remove.',
              'A working policy answers one question: <em>can I put this into that tool?</em> Everything that does not help answer that is padding.',
            ],
          },
          {
            h: 'The structure that works',
            ol: [
              '<strong>Data classes, named in your terms.</strong> Four is enough: public, internal, confidential, restricted. Use real examples from your business — "client contracts", "patient records", "supplier pricing" — not abstract categories.',
              '<strong>Approved tools, listed.</strong> By name. A policy that says "approved tools" without listing them is not a policy.',
              '<strong>The routing table.</strong> Which class may go into which tool. This is the whole policy; everything else supports it.',
              '<strong>What is never permitted,</strong> concretely. Credentials, personal data of customers, anything under a specific restriction.',
              '<strong>What to do when unsure.</strong> Name a person. Not a mailbox.',
              '<strong>Verification requirements.</strong> Which outputs need checking before use, and how.',
              '<strong>Disclosure.</strong> When to tell a customer AI was involved.',
            ],
            note:
              'One page. If it runs longer, you are writing for an auditor rather than for the person deciding whether to paste a contract into a chat window.',
          },
          {
            h: 'The routing table is the policy',
            p: [
              'Everything else is context. A member of staff holding a document should be able to find its class, find the tool, and get a yes or no in fifteen seconds.',
              'Where the answer is no for a confidential class and the work genuinely needs doing, that is the business case for a <a href="/products/private-ai/">private deployment</a>. A policy that forbids useful work without offering a compliant route creates shadow usage rather than preventing it.',
            ],
          },
          {
            h: 'Keeping it alive',
            ul: [
              'Review when a tool is added, not on a calendar.',
              'Make policy sign-off part of purchasing, so new tools cannot arrive unreviewed.',
              'Re-read vendor terms annually. They change.',
              'Revisit after any incident or near miss, and write down what you changed.',
            ],
          },
        ],
        faq: [
          { q: 'Can we just use a template?', a: '<p>As a skeleton, yes. The routing table and the data examples have to be yours — a generic template fails precisely at the point where a member of staff needs an answer about a specific document.</p>' },
          { q: 'Who signs it off?', a: '<p>Whoever can say no and make it stick. In a smaller business, an owner.</p>' },
          { q: 'Do we need staff training on it?', a: '<p>A short session, on real examples from your own work. Handing out a document achieves very little. <a href="/services/personal-and-employee-training/">Corporate training</a> covers this properly.</p>' },
        ],
      },
      {
        slug: 'verifying-ai-output',
        title: 'How to verify AI output before you act on it | Felican AI',
        h1: 'How do you verify AI output?',
        description:
          'Why human review is weaker than it looks, how independent model verification works, and where to apply each in a business process.',
        lede:
          'The weakest point in most AI deployments is not the model. It is the assumption that somebody is checking.',
        sections: [
          {
            h: 'Why human review underperforms',
            p: [
              'A human in the loop is the standard control and it is weaker than it sounds, for a specific reason: language models produce output that is fluent, confident and structurally plausible. That is the hardest kind of output for a reviewer to catch errors in.',
              'Add volume and the problem compounds. A reviewer checking the two hundredth extraction of the day is not reviewing; they are approving. This is not a discipline failure, it is how attention works.',
              'Human review is necessary and it is not sufficient on its own for consequential work.',
            ],
          },
          {
            h: 'Why self-checking does not work',
            p: [
              'Asking a model to check its own answer feels like a free control and mostly is not. Same model, same training, same blind spots, same question — it will generally agree with itself.',
              'You see some benefit from forcing a model to show reasoning or re-derive an answer, but it is not independent verification and should not be recorded as one.',
            ],
          },
          {
            h: 'Independent model verification',
            p: ['The mechanism is straightforward and the independence is the whole point:'],
            ol: [
              'A primary model does the work.',
              'A <strong>different model, from a different family</strong>, receives the source and the claim — not the reasoning.',
              'It is asked whether the claim is supported by the source.',
              'Disagreements surface, specifically, with the source text.',
              'Your rule decides: block, flag, or log and continue.',
            ],
            p2: [
              'This catches a real class of error and misses others, notably anything both models get wrong in the same way. It is a control that reduces risk, not a guarantee, and that is exactly how it should be documented. <a href="/products/crosscheck-ai/">CrossCheck AI</a> is our implementation.',
            ],
          },
          {
            h: 'Where to apply which control',
            ul: [
              '<strong>Financial values.</strong> Independent verification, always. A wrong total is a real loss.',
              '<strong>Legal and clinical content.</strong> Independent verification plus qualified human review. Neither alone.',
              '<strong>Customer-facing text.</strong> Human review. Tone and judgement are the risk, not factual extraction.',
              '<strong>Internal drafts and summaries.</strong> Spot checks. Verifying everything here is a waste of money.',
              '<strong>Classification at volume.</strong> Sampled measurement against known answers, continuously, so drift is visible.',
            ],
          },
          {
            h: 'Measure it rather than assert it',
            p: [
              'Build a set of cases where you already know the correct answer, from your own real documents. Run them through the system monthly. Record the accuracy.',
              'That gives you three things a framework cannot: a real number instead of a vendor claim, early warning when something drifts, and evidence for whoever eventually asks how you know it works.',
            ],
          },
        ],
        faq: [
          { q: 'Does verification double our AI cost?', a: '<p>On verified items, roughly — it is a second inference. That is why it is applied per workflow rather than globally. Put it where being wrong is expensive.</p>' },
          { q: 'Can the same model verify if we change the prompt?', a: '<p>It is better than nothing and it is not independent verification. The blind spots travel with the model, not with the prompt.</p>' },
          { q: 'What if the two models disagree and both are wrong?', a: '<p>Possible, and it is the honest limitation of the approach. Disagreement is a strong signal; agreement is weaker evidence than it feels.</p>' },
        ],
      },
    ],
  },
];

export const allGuidePages = () =>
  GUIDES.flatMap(guide => [
    { ...guide, kind: 'pillar', path: `/guides/${guide.slug}/` },
    ...(guide.children || []).map(child => ({
      ...child,
      kind: 'child',
      parent: guide,
      path: `/guides/${guide.slug}/${child.slug}/`,
    })),
  ]);

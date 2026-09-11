// Per-service page content.
//
// Renamed 2026-09-11 at the owner's direction to the four customer-facing names they
// use when selling: AI Solution Services, Workflow & Task Automation, Custom Agent
// Development, and Personal & Employee Training (which merges the two former training
// services). The URLs had never been indexed, so the rename cost nothing.
//
// Each page answers the four things a buyer asks before a call: what is in scope, how
// the engagement runs, what determines the price, and when this is the wrong service.
// That last section is deliberate — saying when not to buy is the cheapest credibility
// available, and it keeps eleven pages from reading as eleven variants of one page.

export const SERVICES = [
  {
    slug: 'private-ai-systems',
    name: 'Private AI systems',
    tag: 'Deployment',
    title: 'Private AI systems — design, deploy and run AI inside your network | Felican AI',
    description:
      'We design, deploy and maintain private AI systems inside your own network: model selection, knowledge ingestion, access control, audit logging and rollout.',
    lede: 'AI that runs inside your business, on infrastructure you control, with an audit trail you own.',
    scope: [
      'Assessment of what your staff actually need AI for, and what data it would have to touch',
      'Model and hardware selection sized to the work, not to a benchmark',
      'Private knowledge ingestion with scoped retrieval, so teams only see what they should',
      'Access control mapped to your existing identity groups',
      'Audit logging and retention rules you define',
      'Staged rollout, with the first group trained properly before expanding',
      'Ongoing maintenance, model upgrades and knowledge updates',
    ],
    engagement: [
      '<strong>Week one — assessment.</strong> Interviews with the people who would use it, a look at your document estate, and a review of your network and identity setup. Output is a written recommendation including the option of not doing it.',
      '<strong>Weeks two to three — build.</strong> Infrastructure stood up, models deployed, knowledge indexed, permissions wired.',
      '<strong>Week four — pilot.</strong> One real team, real work, daily feedback. This is where the retrieval scoping gets fixed, because it is always slightly wrong at first.',
      '<strong>Then — expand and maintain.</strong> Further groups added as the pilot settles. Maintenance is a standing arrangement or handed to your team.',
    ],
    pricing: [
      'Three variables: where it runs (owned hardware is capital spend with near-zero marginal cost; a private cloud tenant is the opposite), how much knowledge it holds, and how deep the integration goes into systems that write back.',
      'A bounded version ships at a fixed price inside the <a href="/starter-pack/">AI Business Starter Pack</a>, which is the cheapest way to test whether this belongs in your business.',
    ],
    notFor: [
      'You want the strongest possible open-ended reasoning and your data has no confidentiality constraint. Use a frontier model; you will get better results for less.',
      'Nobody internally can own it. A private system needs someone to care about it even when we maintain it.',
      'The real problem is that your documents are a mess. Fix that first — AI retrieval over disorganised content produces confidently wrong answers faster than a human would.',
    ],
    related: [
      { href: '/products/private-ai/', label: 'Private AI', note: 'The product this service deploys' },
      { href: '/guides/private-ai/', label: 'The private AI guide', note: 'How it works, in detail' },
    ],
  },
  {
    slug: 'custom-agent-development',
    name: 'Custom Agent Development',
    tag: 'Build',
    title: 'Custom agent development — agents that do work, not chat | Felican AI',
    description:
      'We build AI agents that complete a defined job end to end — researching, triaging, auditing, drafting — and produce output you can act on.',
    lede: 'An agent is only worth building when it finishes a job. We build the ones that do.',
    scope: [
      'Defining the job precisely enough to be automatable, which is most of the work',
      'Agent design, including what it may decide alone and what it must escalate',
      'Tool and data access, scoped to the task',
      'Output design — a deliverable someone acts on, not a transcript to summarise',
      'Guardrails, logging and failure behaviour',
      'Evaluation against real cases before it goes near production',
    ],
    engagement: [
      '<strong>Scoping.</strong> We work out whether the job is actually agent-shaped. Many are not, and a deterministic script is the honest answer.',
      '<strong>Prototype.</strong> A narrow version against real inputs. You see output within days.',
      '<strong>Evaluation.</strong> Run it over cases where you already know the right answer. This is the step most agent projects skip and most agent failures trace back to.',
      '<strong>Hardening and deployment.</strong> Guardrails, escalation, monitoring.',
    ],
    pricing: [
      'Driven by how well defined the job is and how many systems the agent has to touch. A well-bounded single-system agent is a short engagement; one that has to reason across four systems with write access is a project.',
    ],
    notFor: [
      'The task has no checkable right answer. If nobody can tell whether the output is correct, an agent will confidently produce wrong work at scale.',
      'You want an agent because agents are interesting. The ones that last solve a named, measured problem.',
      'The process changes every week. Automate the stable part first.',
    ],
    related: [
      { href: '/products/threadpilot/', label: 'ThreadPilot', note: 'An agent we built and run' },
      { href: '/products/quorum/', label: 'Quorum', note: 'Four agents in an adversarial structure' },
    ],
  },
  {
    slug: 'workflow-and-task-automation',
    name: 'Workflow & Task Automation',
    tag: 'Build',
    title: 'Workflow & task automation — remove the steps nobody should be doing | Felican AI',
    description:
      'We automate the repetitive, transcription-heavy steps in how your business actually runs, using AI only where AI is genuinely the right tool.',
    lede: 'Most of what looks like an AI problem is a process problem with a transcription step in it.',
    scope: [
      'Mapping the process as it actually runs, not as the documentation claims',
      'Identifying which steps are deterministic (script them) and which need judgement (AI)',
      'Building the automation, including the error paths',
      'Connecting the systems involved',
      'Monitoring, alerting and a manual fallback for when something upstream changes',
    ],
    engagement: [
      '<strong>Process mapping.</strong> We watch the work happen. The gap between the documented process and the real one is usually where the savings are.',
      '<strong>Cut the obvious.</strong> Often a third of the steps exist because of a constraint that no longer applies.',
      '<strong>Automate what remains,</strong> AI only where judgement is genuinely required.',
      '<strong>Run it in parallel</strong> before switching over, so you can see it matching reality.',
    ],
    pricing: [
      'Scoped per process. Cost tracks the number of systems involved and how much exception handling the process needs — the exceptions are almost always the expensive part.',
    ],
    notFor: [
      'The process is about to change for business reasons. Automating a process that is being redesigned wastes both efforts.',
      'It runs twice a month and takes ten minutes. Automation has a maintenance cost; that one is not worth paying it.',
      'Nobody will own the automation. Unowned automation fails silently, which is worse than a manual step.',
    ],
    related: [
      { href: '/services/custom-integrations/', label: 'Custom integrations', note: 'When the systems will not talk' },
      { href: '/products/relay/', label: 'Relay', note: 'The field service version of this' },
    ],
  },
  {
    slug: 'custom-integrations',
    name: 'Custom integrations',
    tag: 'Build',
    title: 'Custom integrations — make your systems talk | Felican AI',
    description:
      'We build the integrations between the systems your business already runs, including the older ones with no modern API.',
    lede: 'The AI is rarely the hard part. Getting it to the data is.',
    scope: [
      'Integration design, including what is the source of truth for each field',
      'API, database, file and email-based integration — whatever the system actually supports',
      'Older systems with no real API, via the routes that do exist',
      'Data mapping, validation and reconciliation',
      'Error handling, retries and alerting on failure',
      'Logging that makes a failed sync diagnosable rather than mysterious',
    ],
    engagement: [
      '<strong>Discovery.</strong> What each system can actually expose, which is frequently less than the vendor claims.',
      '<strong>Contract.</strong> Agree field mapping and the source of truth before writing code. Skipping this is why integrations rot.',
      '<strong>Build and test</strong> against real data, including the malformed records that exist in every production system.',
      '<strong>Monitor.</strong> An integration nobody is watching is an outage waiting to be discovered by a customer.',
    ],
    pricing: [
      'Driven by the worst system in the chain. A modern REST API on both ends is quick; a twenty-year-old system whose only export is a scheduled CSV is not.',
    ],
    notFor: [
      'You are replacing one of the systems within six months. Wait.',
      'A one-directional export would do. Bidirectional sync is an order of magnitude more work and needs a real reason.',
    ],
    related: [
      { href: '/services/workflow-and-task-automation/', label: 'Workflow & Task Automation', note: 'The process the integration serves' },
      { href: '/products/dendrite/', label: 'Dendrite', note: 'When the source is the web' },
    ],
  },
  {
    slug: 'ai-implementation-and-consulting',
    name: 'AI implementation and consulting',
    tag: 'Advisory',
    title: 'AI implementation and consulting — decide what to build before building it | Felican AI',
    description:
      'Advisory engagements that establish where AI genuinely helps your business, what it will cost, and in what order to do it.',
    lede: 'The most valuable thing we do in the first week is talk people out of things.',
    scope: [
      'Opportunity assessment across the business, not just the department that asked',
      'Honest feasibility — what current AI does well, badly, and not at all for your case',
      'Cost modelling, including the ongoing cost everybody forgets',
      'Sequencing, so the first project builds capability the second one needs',
      'Build versus buy for each candidate',
      'A written recommendation you could hand to someone else',
    ],
    engagement: [
      '<strong>Interviews.</strong> The people doing the work, not only the people sponsoring the project.',
      '<strong>Shortlist.</strong> Candidates scored on value, feasibility and risk.',
      '<strong>Recommendation.</strong> What to do first, what to leave, what to stop.',
      '<strong>Optional delivery.</strong> We can build it, or hand the plan to your team. The advice is the same either way, which is the point of separating them.',
    ],
    pricing: ['Fixed-fee for a scoped assessment. Sized by how many business areas are in scope.'],
    notFor: [
      'The decision is already made and you need validation. We will probably give you the wrong answer for that purpose.',
      'You want a strategy deck. The deliverable here is a sequence of projects with costs attached.',
    ],
    related: [
      { href: '/services/ai-auditing/', label: 'AI auditing', note: 'If you already have AI in production' },
      { href: '/guides/ai-governance/', label: 'AI governance guide', note: 'The control side' },
    ],
  },
  {
    slug: 'ai-solution-services',
    name: 'AI Solution Services',
    tag: 'Build',
    title: 'AI solution services — custom software with AI where it earns its place | Felican AI',
    description:
      'Custom applications built around how your business actually runs, with AI used where it genuinely helps rather than as the premise.',
    lede: 'Sometimes the answer is software, and AI is one component of it rather than the point.',
    scope: [
      'Requirements work grounded in the existing process',
      'Application design and build',
      'AI components where they earn their place',
      'Integration with the systems already in use',
      'Deployment, hosting, monitoring and backups',
      'Documentation and handover, so you are not captive',
    ],
    engagement: [
      '<strong>Define.</strong> The smallest version that changes something. Scope grows later, deliberately.',
      '<strong>Build in increments</strong> you can see and use.',
      '<strong>Deploy and operate,</strong> with backups and monitoring from day one rather than after the first incident.',
    ],
    pricing: ['Scoped per project after the define phase. We do not quote custom software from a conversation.'],
    notFor: [
      'An off-the-shelf product covers 80% of it. Buy that and integrate.',
      'Requirements cannot be pinned down at all. A discovery engagement first is cheaper than a build that gets rewritten.',
    ],
    related: [
      { href: '/services/custom-integrations/', label: 'Custom integrations', note: 'If the gap is only connection' },
      { href: '/case-studies/', label: 'Client work', note: 'What we have built' },
    ],
  },
  {
    slug: 'custom-trained-ai-models',
    name: 'Custom-trained AI models',
    tag: 'Build',
    title: 'Custom-trained AI models — fine-tuning, and when not to bother | Felican AI',
    description:
      'Fine-tuned and custom-trained models for cases where retrieval is genuinely not enough — and an honest assessment of whether yours is one of them.',
    lede: 'Most people who ask for a fine-tuned model need good retrieval instead. We will tell you which you are.',
    scope: [
      'Assessment of whether fine-tuning is actually the right answer',
      'Training data preparation, which is the bulk of the effort and the bulk of the cost',
      'Fine-tuning and evaluation against a held-out set',
      'Deployment, usually self-hosted',
      'Retraining as the data shifts',
    ],
    engagement: [
      '<strong>Baseline first.</strong> We measure a retrieval-based approach on your task. Frequently it is sufficient and the engagement stops here, which is the cheapest possible outcome for you.',
      '<strong>Data assessment.</strong> Fine-tuning needs consistent, labelled, reasonably plentiful examples. Most businesses find they do not have them yet.',
      '<strong>Train and evaluate.</strong> Against held-out real cases, with the baseline as the comparison.',
      '<strong>Deploy and monitor</strong> for drift.',
    ],
    pricing: [
      'Dominated by data preparation, not compute. If your examples are already clean and labelled this is affordable; if they have to be assembled, that is the project.',
    ],
    notFor: [
      'You want the model to know your documents. That is retrieval, and it is cheaper, faster and easier to update.',
      'You have fewer than a few hundred consistent examples.',
      'The task changes frequently. A fine-tune is a snapshot.',
    ],
    related: [
      { href: '/products/private-ai/', label: 'Private AI', note: 'Retrieval done properly, which is usually the answer' },
      { href: '/guides/private-ai/', label: 'The private AI guide', note: 'Retrieval versus fine-tuning, explained' },
    ],
  },
  {
    slug: 'ai-auditing',
    name: 'AI auditing',
    tag: 'Advisory',
    title: 'AI auditing — find out what your AI is actually doing | Felican AI',
    description:
      'An independent audit of the AI already running in your business: what it touches, what it costs, where it is wrong, and what nobody is watching.',
    lede: 'Most businesses with AI in production cannot answer three basic questions about it.',
    scope: [
      'Inventory — every AI tool in use, including the ones bought on a card without telling anyone',
      'Data exposure — what leaves the business, to whom, under what terms',
      'Accuracy — measured on real cases rather than asserted',
      'Cost — actual spend against actual value, per tool',
      'Controls — what happens when it is wrong, and who would notice',
      'A findings report with severity and a remediation order',
    ],
    engagement: [
      '<strong>Discovery.</strong> The shadow AI inventory is usually the first surprise.',
      '<strong>Testing.</strong> We run real cases through the tools in production and measure what comes back.',
      '<strong>Report.</strong> Findings ranked by severity, with fixes ordered by cost and effect.',
    ],
    pricing: ['Fixed fee, scoped by the number of tools and business areas in scope.'],
    notFor: [
      'You want a certificate. This produces findings, and findings are sometimes uncomfortable.',
      'You have no AI in production yet. Start with <a href="/services/ai-implementation-and-consulting/">implementation consulting</a> instead.',
    ],
    related: [
      { href: '/products/crosscheck-ai/', label: 'CrossCheck AI', note: 'Automate the accuracy check' },
      { href: '/guides/ai-governance/', label: 'AI governance guide', note: 'The control framework' },
      { href: '/services/ai-cost-analysis-and-reduction/', label: 'AI cost reduction', note: 'If cost is the main concern' },
    ],
  },
  {
    slug: 'ai-cost-analysis-and-reduction',
    name: 'AI cost analysis and reduction',
    tag: 'Advisory',
    title: 'AI cost analysis and reduction — stop overpaying for AI | Felican AI',
    description:
      'We analyse what you actually spend on AI against what you actually get, and reduce it — usually through model routing, caching and removing seats nobody uses.',
    lede: 'AI spend grows quietly, per seat, per tool, on several different cards.',
    scope: [
      'Full spend inventory across tools, APIs and per-seat subscriptions',
      'Usage against licences — the unused-seat count is reliably higher than anyone expects',
      'Model routing analysis: which work is running on an expensive model that a cheaper one handles fine',
      'Caching and prompt efficiency',
      'Build-versus-subscribe comparison at your actual volume',
      'A reduction plan, ordered by saving against effort',
    ],
    engagement: [
      '<strong>Inventory.</strong> Every AI line item, including the ones in other departments\' budgets.',
      '<strong>Usage analysis.</strong> Who uses what, how much, for what.',
      '<strong>Routing review.</strong> The largest single saving in most businesses is work running on a frontier model that a mid-tier model does equally well.',
      '<strong>Plan.</strong> Ranked actions with the expected saving against the effort to get it.',
    ],
    pricing: [
      'Fixed fee for the analysis. We publish our own engine token economics at <a href="/starter-pack/ai-engines/">AI engine pricing</a>, which is the same data this analysis is built on.',
    ],
    notFor: [
      'Your total AI spend is small. The analysis would cost more than it saves, and we will say so on the first call.',
      'You want us to cut spend regardless of effect. Some of that spend is earning its keep.',
    ],
    related: [
      { href: '/starter-pack/ai-engines/', label: 'AI engine pricing', note: 'What the engines actually cost' },
      { href: '/services/ai-auditing/', label: 'AI auditing', note: 'The broader review' },
    ],
  },
  {
    slug: 'personal-and-employee-training',
    name: 'Personal & Employee Training',
    tag: 'Training',
    title: 'Personal & employee AI training — for individuals and whole teams | Felican AI',
    description:
      'Practical AI training built around your people and your real work: structured corporate programmes, hands-on workshops, and one-to-one coaching. On site or remote.',
    lede: 'A licence nobody knows how to use is the most common form of wasted AI spend.',
    scope: [
      'Training built around your tools and your real work, using your own material',
      'Role-specific sessions — what a sales team needs differs from what finance needs',
      'Hands-on workshops where everyone works, rather than watching a demo',
      'One-to-one coaching for individuals who need to go deeper than a group session allows',
      'Practical guardrails: what to never paste into a public model, and why',
      'Prompting as a method rather than a list of tricks that stop working at the next model release',
      'Verification habits, so people check output instead of trusting it',
      'Reference material each person keeps and actually reuses',
    ],
    engagement: [
      '<strong>Assess.</strong> What people are actually doing with AI now, including the parts they would not put in writing.',
      '<strong>Build.</strong> Sessions around real tasks from your business, not a generic vendor curriculum.',
      '<strong>Deliver.</strong> On site or remote, in groups small enough for people to actually try things. Past roughly twenty people it becomes a lecture, which is a different and less useful thing.',
      '<strong>Follow up.</strong> A session weeks later, against what they hit in practice. This is where the behaviour actually changes.',
    ],
    pricing: [
      'Per cohort for team programmes, per session for workshops, hourly for one-to-one coaching. The driver is how much of the material has to be built around your specific work.',
    ],
    notFor: [
      'You want a one-hour all-hands awareness session. Useful, but it will not change how anyone works.',
      'Staff are not permitted to use AI yet. Sort the policy first — training people in a tool they cannot use breeds exactly the shadow usage you were worried about.',
      'You need a governance framework rather than skills. That is <a href="/services/ai-implementation-and-consulting/">consulting</a>, not training.',
    ],
    related: [
      { href: '/guides/ai-governance/ai-policy-template/', label: 'A one-page AI policy', note: 'Settle the rules before you train people on the tools' },
      { href: '/books/stop-being-nice-to-ai/', label: 'Stop Being Nice to AI', note: 'The prompting method, in book form' },
      { href: '/education/', label: 'Education', note: 'Self-directed learning, books and courses' },
    ],
  },
];

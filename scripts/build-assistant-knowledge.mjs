#!/usr/bin/env node
// Generates server/assistant-knowledge.js from the same content/*.js files that render
// the website, so the chat assistant and the voice agent always describe the site as it
// actually is.
//
// Why this exists: the assistant's knowledge used to be a hardcoded block inside
// FELICAN_SYSTEM_PROMPT. It listed five products when the site had nineteen, still
// called Voice AI by its old name "Felican Auto", and named services that had been
// renamed. A visitor asking "what products do you have?" got five.
//
// Anything added to content/*.js now reaches the assistant on the next `npm run seo`.
//
// Run with `npm run build:assistant` (included in `npm run seo`).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTS, flagship, agents, apps } from '../content/products.js';
import { SERVICES } from '../content/services.js';
import { INDUSTRIES } from '../content/industries.js';
import { GUIDES } from '../content/guides.js';
import { COMPARISONS } from '../content/comparisons.js';
import { CASE_STUDIES } from '../content/case-studies.js';
import { BOOKS } from '../content/books.js';
import { ORG } from '../content/site.js';
import { CATALOG, HOSTING_PLANS } from '../server/checkout.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const money = cents => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const lines = [];
const push = (...text) => lines.push(...text);

/* ------------------------------------------------------------------ company */

push(
  'COMPANY',
  `${ORG.name} builds practical AI products, private AI systems, custom automations, integrations and training for businesses in any industry. More than ten certified AI professionals, led by ${ORG.founder.name}, ${ORG.founder.jobTitle}.`,
  `Serving ${ORG.areaServed.slice(0, 3).join(', ')} on site, and clients nationwide remotely.`,
  `Contact: ${ORG.email} or ${ORG.telephoneDisplay}. Booking page: /booking/. Contact form: /contact/.`,
  '',
);

/* ----------------------------------------------------------------- products */

const priceEach = money(CATALOG['private-ai'].amount);

push(
  `PRODUCTS (${PRODUCTS.filter(p => !p.hubOnly).length} total, each ${priceEach}, each with its own page)`,
  `Index page: /products/. Ask-about link for any product: /contact/?product=<name>.`,
  '',
  'Flagship products:',
);
for (const p of flagship()) {
  push(`- ${p.name} (/products/${p.slug}/) — ${p.description}`);
}
push('', 'Agents that do a specific job:');
for (const p of agents()) {
  push(`- ${p.name} (/products/${p.slug}/) — ${p.description}`);
}
push('', 'Other apps:');
for (const p of apps()) {
  push(`- ${p.name} (/products/${p.slug}/) — ${p.description}`);
}

push(
  '',
  'BUNDLE',
  `The AI Business Starter Pack (/starter-pack/) is ${money(CATALOG.pack.amount)} and includes Private AI, the Chat AI Assistant and Voice AI generated from one shared source of business knowledge.`,
  `Monthly hosting plans: ${Object.values(HOSTING_PLANS).map(plan => `${plan.name} ${money(plan.amount)}/month (${plan.allowance})`).join('; ')}.`,
  'Per-engine token pricing is published at /starter-pack/ai-engines/.',
  '',
);

/* ----------------------------------------------------------------- services */

push(`SERVICES (${SERVICES.length}, each with its own page at /services/<slug>/)`);
for (const s of SERVICES) push(`- ${s.name} (/services/${s.slug}/) — ${s.lede}`);
push('');

/* --------------------------------------------------------------- industries */

push('INDUSTRIES WE BUILD FOR (each has a page explaining what we deploy and why)');
for (const i of INDUSTRIES) push(`- ${i.longName} (/industries/${i.slug}/)`);
push('');

/* ------------------------------------------------------------------- guides */

push('GUIDES (free, detailed, no sign-up)');
for (const g of GUIDES) {
  push(`- ${g.h1} (/guides/${g.slug}/) — ${g.description}`);
  for (const child of g.children || []) {
    push(`  - ${child.h1} (/guides/${g.slug}/${child.slug}/)`);
  }
}
push('');

/* -------------------------------------------------------------- comparisons */

push('COMPARISONS (honest, including where a competitor wins)');
for (const c of COMPARISONS) push(`- ${c.h1} (/compare/${c.slug}/) — verdict: ${c.verdict}`);
push('');

/* ------------------------------------------------------------- client work */

push('CLIENT WORK (real deployments, /case-studies/)');
for (const study of CASE_STUDIES) {
  push(`- ${study.client} (/case-studies/${study.slug}/) — ${study.industry}, ${study.location}. Deployed: ${study.deployed.join(', ')}.`);
}
push('');

/* -------------------------------------------------------------------- books */

push(`BOOKS BY ${ORG.founder.name.toUpperCase()}`);
for (const b of BOOKS) push(`- ${b.name} (/books/${b.slug}/) — ${b.tagline}`);
push('');

push(
  'OTHER PAGES',
  '- About the team and certifications: /about/',
  `- ${ORG.founder.name}'s full profile: /Lehem-Felican-Jr`,
  '- Local: /locations/palm-beach-county/',
  '- Education, courses and eBooks: /education/',
  '- Privacy: /privacy/ — Terms: /terms/',
);

const knowledge = lines.join('\n');

const file = `// GENERATED by scripts/build-assistant-knowledge.mjs — do not edit by hand.
// Regenerate with \`npm run build:assistant\` (part of \`npm run seo\`).
//
// Everything the chat assistant and the voice agent know about the site, derived from
// content/*.js and server/checkout.js. Add a product, service, guide or client there
// and it reaches both assistants automatically.

export const ASSISTANT_KNOWLEDGE = ${JSON.stringify(knowledge)};

export const KNOWLEDGE_GENERATED_AT = ${JSON.stringify(new Date().toISOString().slice(0, 10))};
`;

writeFileSync(join(ROOT, 'server', 'assistant-knowledge.js'), file);

const counts = {
  products: PRODUCTS.filter(p => !p.hubOnly).length,
  services: SERVICES.length,
  industries: INDUSTRIES.length,
  guides: GUIDES.reduce((n, g) => n + 1 + (g.children?.length || 0), 0),
  comparisons: COMPARISONS.length,
  clients: CASE_STUDIES.length,
  books: BOOKS.length,
};
console.log(
  `Assistant knowledge: ${knowledge.length.toLocaleString()} chars — `
  + Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', '),
);

/* ------------------------------------------------------------------ corpus */
// The block above is the assistant's always-on map of the site: one line per page.
// The corpus below is the full text of each page, one chunk per page, and it is NOT
// sent in every request. server/assistant-retrieval.js scores these chunks against
// the visitor's question and the page they are reading, and injects only the few
// that match. That is what lets the assistant quote a guide's actual hardware
// advice or a product's real FAQ answer instead of paraphrasing a one-liner.

const clean = value => String(value ?? '')
  .replace(/<[^>]*>/g, '')
  .replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();
const para = (h, p) => `${clean(h)}: ${clean(p)}`;
const bullets = (label, items) => items?.length ? `${label}: ${items.map(clean).join(' ')}` : '';
const faqText = faq => (faq || []).map(f => `Q: ${clean(f.q)} A: ${clean(f.a)}`).join(' ');
const sectionText = sections => (sections || [])
  .map(s => para(s.h, [s.p, ...(s.ul || []).map(li => `- ${li}`)].filter(Boolean).join(' ')))
  .join(' ');

const corpus = [];
const chunk = (kind, path, title, parts) => {
  const text = parts.filter(Boolean).map(clean).join('\n');
  if (text) corpus.push({ kind, path, title: clean(title), text });
};

for (const p of PRODUCTS.filter(x => !x.hubOnly)) {
  chunk('product', `/products/${p.slug}/`, p.name, [
    `${p.name} — ${p.tag || ''}. Price: ${priceEach} one-time, then a monthly hosting plan.`,
    p.lede,
    bullets('Facts', (p.facts || []).map(f => `${f.k}: ${f.v}`)),
    sectionText(p.sections),
    faqText(p.faq),
    bullets('Related', (p.related || []).map(r => `${r.label} (${r.href})`)),
  ]);
}

for (const s of SERVICES) {
  chunk('service', `/services/${s.slug}/`, s.name, [
    `${s.name} — ${s.tag || ''}.`,
    s.lede, s.description,
    bullets('What is in scope', s.scope),
    bullets('How an engagement runs', s.engagement),
    bullets('Pricing', s.pricing),
    bullets('Not a fit when', s.notFor),
  ]);
}

for (const i of INDUSTRIES) {
  chunk('industry', `/industries/${i.slug}/`, i.longName, [
    i.lede, i.description,
    bullets('The problem', i.theProblem),
    bullets('What we deploy', (i.whatWeDeploy || []).map(w => `${w.product} (${w.href}): ${w.detail}`)),
    sectionText(i.specifics),
    faqText(i.faq),
  ]);
}

for (const g of GUIDES) {
  chunk('guide', `/guides/${g.slug}/`, g.h1, [g.lede, g.description, sectionText(g.sections), faqText(g.faq)]);
  for (const c of g.children || []) {
    chunk('guide', `/guides/${g.slug}/${c.slug}/`, c.h1, [c.lede, c.description, sectionText(c.sections), faqText(c.faq)]);
  }
}

for (const c of COMPARISONS) {
  const table = c.table
    ? `${clean(c.table.caption || '')} ${(c.table.rows || []).map(r => (Array.isArray(r) ? r : Object.values(r)).map(clean).join(' | ')).join('; ')}`
    : '';
  chunk('comparison', `/compare/${c.slug}/`, c.h1, [c.lede, `Verdict: ${c.verdict}`, table, sectionText(c.sections), faqText(c.faq)]);
}

for (const st of CASE_STUDIES) {
  chunk('case-study', `/case-studies/${st.slug}/`, st.client, [
    `${st.client} — ${st.industry}, ${st.location}. Deployed: ${st.deployed.join(', ')}.`,
    st.summary, st.about,
    bullets('Situation', st.situation),
    bullets('What we built', st.built),
    st.why ? `Why it worked: ${st.why}` : '',
  ]);
}

for (const b of BOOKS) {
  chunk('book', `/books/${b.slug}/`, b.name, [
    `${b.name} by ${ORG.founder.name} — ${b.tagline}`,
    bullets('About', b.about),
    bullets('For you if', b.forYouIf),
    b.buyUrl ? `Buy: ${b.buyUrl}` : '',
  ]);
}

// The Starter Pack page is hand-written HTML rather than content/*.js, so its FAQ and
// add-on pricing are lifted straight from the served page. If that page moves into
// content/, replace this with the structured source.
try {
  const html = readFileSync(join(ROOT, 'public', 'starter-pack', 'index.html'), 'utf8');
  const faq = [...html.matchAll(/<details>\s*<summary>(.*?)<\/summary>\s*<p>(.*?)<\/p>\s*<\/details>/gs)]
    .map(m => `Q: ${clean(m[1])} A: ${clean(m[2])}`);
  const plans = Object.values(HOSTING_PLANS)
    .map(plan => `${plan.name} ${money(plan.amount)}/month: ${plan.allowance}`);
  chunk('bundle', '/starter-pack/', 'AI Business Starter Pack', [
    `The AI Business Starter Pack is ${money(CATALOG.pack.amount)} one-time and bundles Private AI, the Chat AI Assistant and Voice AI, all generated from one shared source of business knowledge. Any one of the three alone is ${priceEach} one-time.`,
    `Monthly hosting plans (one is required, first month charged at purchase): ${plans.join('; ')}.`,
    'Add-ons: extra custom model $299 one-time, extra automation $199 one-time, image generation $40/month, video generation $90/month. One-time add-ons bill with the purchase; monthly add-ons join the hosting plan. No overage charges.',
    'Per-engine token pricing for Private AI processing: /starter-pack/ai-engines/. Checkout: /checkout/.',
    faq.join(' '),
  ]);
} catch (error) {
  console.warn(`Starter Pack page not indexed: ${error.message}`);
}

chunk('company', '/about/', 'About Felican AI', [
  `${ORG.name} (${ORG.legalName || ORG.name}). ${ORG.description || ''}`,
  `Founder: ${ORG.founder.name}, ${ORG.founder.jobTitle}. ${ORG.founder.description || ''}`,
  `Team: more than ten certified AI professionals with backgrounds across every major industry; certifications from AWS, Google Cloud, Microsoft Azure, Anthropic and OpenAI (see /about/#certifications).`,
  `Contact: ${ORG.email}, ${ORG.telephoneDisplay}, Monday to Friday 9am to 6pm Eastern. Book a call: /booking/. Contact form: /contact/.`,
  `Service area: ${ORG.areaServed.join(', ')}; remote work nationwide.`,
  bullets('Knows about', ORG.knowsAbout),
]);

const corpusFile = `// GENERATED by scripts/build-assistant-knowledge.mjs — do not edit by hand.
// Regenerate with \`npm run build:assistant\` (part of \`npm run seo\`).
//
// Full text of every page the assistant can cite, one chunk per page. Not sent whole:
// server/assistant-retrieval.js picks the chunks that match the visitor's question.

export const ASSISTANT_CORPUS = ${JSON.stringify(corpus, null, 1)};
`;
writeFileSync(join(ROOT, 'server', 'assistant-corpus.js'), corpusFile);
console.log(
  `Assistant corpus: ${corpus.length} chunks, ${corpus.reduce((n, c) => n + c.text.length, 0).toLocaleString()} chars — `
  + Object.entries(corpus.reduce((acc, c) => ({ ...acc, [c.kind]: (acc[c.kind] || 0) + 1 }), {})).map(([k, v]) => `${v} ${k}`).join(', '),
);

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

import { writeFileSync } from 'node:fs';
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

// Picks the few site pages whose full text best answers the visitor's question, so the
// chat assistant can quote a guide's real advice or a product's real FAQ instead of
// paraphrasing the one-line summaries in assistant-knowledge.js.
//
// Plain BM25 over server/assistant-corpus.js — no embeddings, no network call, no
// dependency. The corpus is 67 pages, so scoring every chunk per request costs well
// under a millisecond and there is nothing to cache or warm up.
//
// Two things make this work for chat rather than search:
//   1. The page the visitor is reading is always included and boosted, so "how much
//      does it cost?" on /products/relay/ resolves to Relay without the visitor
//      naming it.
//   2. The previous user turn is scored at half weight, so a follow-up like "and is
//      it HIPAA compliant?" still lands on the private-AI pages the last question
//      was about.

import { ASSISTANT_CORPUS } from './assistant-corpus.js';

const STOPWORDS = new Set((
  'a an and are as at be by can do does for from has have how i if in is it its me my of on or '
  + 'our that the their there these they this to us was we what when where which who why will with '
  + 'would you your about into than then them so any get got just like need want tell more some '
  + 'also very much many one two three am pm ok okay please thanks thank hi hello hey yes no not'
).split(' '));

const MAX_CHUNKS = 3;
const MAX_CONTEXT_CHARS = 9_000;
const MAX_CHUNK_CHARS = 5_000;

export function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter(term => term.length > 1 && !STOPWORDS.has(term))
    .map(stem);
}

// Deliberately crude: enough that "invoices" finds "invoice" and "hosting" finds
// "host", without the mis-stems a fuller stemmer would need a dictionary to avoid.
function stem(term) {
  if (term.length <= 4) return term;
  return term
    .replace(/(ations?|ingly|edly)$/, '')
    .replace(/(ing|ies|ers?|ed|es|ly)$/, '')
    .replace(/s$/, '');
}

function buildIndex(corpus) {
  const docs = corpus.map(doc => {
    const terms = tokenize(`${doc.title} ${doc.title} ${doc.text}`);
    const tf = new Map();
    for (const term of terms) tf.set(term, (tf.get(term) || 0) + 1);
    return { ...doc, tf, length: terms.length };
  });
  const df = new Map();
  for (const doc of docs) for (const term of doc.tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  const avgLength = docs.reduce((n, doc) => n + doc.length, 0) / Math.max(docs.length, 1);
  return { docs, df, avgLength, count: docs.length };
}

const INDEX = buildIndex(ASSISTANT_CORPUS);

function bm25(index, doc, weightedTerms, k1 = 1.4, b = 0.75) {
  let score = 0;
  for (const [term, weight] of weightedTerms) {
    const tf = doc.tf.get(term);
    if (!tf) continue;
    const df = index.df.get(term) || 0;
    const idf = Math.log(1 + (index.count - df + 0.5) / (df + 0.5));
    const norm = tf * (k1 + 1) / (tf + k1 * (1 - b + b * doc.length / index.avgLength));
    score += weight * idf * norm;
  }
  return score;
}

export function normalizePagePath(value) {
  const path = String(value ?? '').trim().split(/[?#]/)[0];
  if (!path.startsWith('/') || path.length > 200 || !/^[A-Za-z0-9/_.-]+$/.test(path)) return '';
  return path.endsWith('/') || path === '/' ? path : `${path}/`;
}

// `messages` is the normalized chat history; `page` is the sanitized path the visitor is
// on. Returns the chunks to inject plus the page chunk (if any) for the prompt header.
export function retrieveContext(messages, page = '', index = INDEX) {
  const users = (messages || []).filter(m => m.role === 'user').map(m => m.content);
  const current = users.at(-1) || '';
  const previous = users.at(-2) || '';
  const weighted = new Map();
  for (const term of tokenize(current)) weighted.set(term, (weighted.get(term) || 0) + 1);
  for (const term of tokenize(previous)) weighted.set(term, (weighted.get(term) || 0) + 0.5);

  const pagePath = normalizePagePath(page);
  const pageDoc = pagePath ? index.docs.find(doc => doc.path === pagePath) : undefined;

  const scored = index.docs
    .map(doc => ({ doc, score: bm25(index, doc, weighted) + (doc === pageDoc ? 2 : 0) }))
    .filter(entry => entry.score > 0 || entry.doc === pageDoc)
    .sort((a, b) => b.score - a.score);

  const picked = [];
  let used = 0;
  const take = doc => {
    if (picked.includes(doc) || picked.length >= MAX_CHUNKS) return;
    const text = doc.text.length > MAX_CHUNK_CHARS ? `${doc.text.slice(0, MAX_CHUNK_CHARS)}…` : doc.text;
    if (used + text.length > MAX_CONTEXT_CHARS) return;
    picked.push(doc);
    used += text.length;
  };
  if (pageDoc) take(pageDoc);
  for (const entry of scored) take(entry.doc);

  return {
    page: pageDoc ? { path: pageDoc.path, title: pageDoc.title, kind: pageDoc.kind } : null,
    chunks: picked.map(doc => ({ path: doc.path, title: doc.title, kind: doc.kind, text: doc.text.slice(0, MAX_CHUNK_CHARS) })),
  };
}

// The block appended to the system prompt for this one request. Kept out of the cached
// prefix so the static prompt above it can be cached across visitors.
export function renderContext({ page, chunks }, pageTitle = '') {
  const lines = [];
  if (page || pageTitle) {
    lines.push('VISITOR CONTEXT');
    lines.push(`The visitor is currently reading ${page ? `${page.title} (${page.path})` : pageTitle}. When they say "it", "this" or ask about cost or setup without naming a product, assume they mean this page.`);
    lines.push('');
  }
  if (chunks.length) {
    lines.push('RELEVANT PAGE CONTENT FOR THIS QUESTION');
    lines.push('Full text of the site pages that best match the question. Prefer these details over the summary list above, and name the page path when you draw on it.');
    for (const chunk of chunks) {
      lines.push('', `[${chunk.title} — ${chunk.path}]`, chunk.text);
    }
  }
  return lines.join('\n').trim();
}

// ---- Tools the model can call ------------------------------------------------
// The BM25 pass above is the fast path: the best guesses go into the prompt before
// the model says a word. These are the second look — the model calls them when what
// it was handed does not contain the exact fact, the way a person would open the
// page rather than guess. Same corpus, same scoring; nothing leaves the process.

export const ASSISTANT_TOOLS = [
  {
    name: 'search_site',
    description: 'Search every page on felican.ai and get back the best-matching pages with their full text. Use it when the page content you were given does not contain the exact fact the visitor asked for — a price, a feature, a client, a hosting limit, a guide detail — or when the question is about something no supplied page covers. Ask with a few specific words, not a sentence.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Two to six specific words, e.g. "voice ai emergency triage" or "starter pack add-ons"' } },
      required: ['query'],
    },
  },
  {
    name: 'read_page',
    description: 'Read the full text of one felican.ai page by its path, e.g. /products/relay/ or /guides/private-ai/hipaa-and-private-ai/. Use it when you know which page holds the answer.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'A site path starting with /, as listed in what you know' } },
      required: ['path'],
    },
  },
];

const TOOL_RESULT_CHARS = 6_000;

export function searchCorpus(query, limit = 3, index = INDEX) {
  const weighted = new Map();
  for (const term of tokenize(query)) weighted.set(term, (weighted.get(term) || 0) + 1);
  if (!weighted.size) return [];
  return index.docs
    .map(doc => ({ doc, score: bm25(index, doc, weighted) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }) => ({ path: doc.path, title: doc.title, kind: doc.kind, text: doc.text.slice(0, MAX_CHUNK_CHARS) }));
}

export function readPage(path, index = INDEX) {
  const normalized = normalizePagePath(path);
  const doc = normalized ? index.docs.find(entry => entry.path === normalized) : undefined;
  return doc ? { path: doc.path, title: doc.title, kind: doc.kind, text: doc.text.slice(0, TOOL_RESULT_CHARS) } : null;
}

// What the visitor is told while a tool runs, and what the model gets back.
export function runAssistantTool(name, input = {}) {
  if (name === 'search_site') {
    const query = String(input.query ?? '').slice(0, 200);
    const hits = searchCorpus(query);
    return {
      status: `Searching felican.ai for “${query.slice(0, 60)}”…`,
      content: hits.length
        ? hits.map(hit => `[${hit.title} — ${hit.path}]\n${hit.text}`).join('\n\n').slice(0, TOOL_RESULT_CHARS * 2)
        : 'No page on felican.ai matches those words. Try different words, or tell the visitor you could not find it and point them to /contact/.',
      pages: hits.map(hit => hit.path),
    };
  }
  if (name === 'read_page') {
    const page = readPage(input.path);
    return {
      status: page ? `Reading ${page.title}…` : 'Looking that up…',
      content: page
        ? `[${page.title} — ${page.path}]\n${page.text}`
        : `There is no page at ${String(input.path ?? '').slice(0, 120)}. Use search_site to find the right one.`,
      pages: page ? [page.path] : [],
    };
  }
  return { status: 'Looking that up…', content: `Unknown tool ${String(name).slice(0, 40)}.`, pages: [] };
}

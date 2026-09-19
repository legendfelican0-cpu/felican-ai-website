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

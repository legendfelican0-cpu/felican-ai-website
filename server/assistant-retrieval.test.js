import { describe, expect, it } from 'vitest';
import { normalizePagePath, renderContext, retrieveContext, tokenize } from './assistant-retrieval.js';
import { ASSISTANT_CORPUS } from './assistant-corpus.js';

const ask = (...turns) => turns.map(content => ({ role: 'user', content }));

describe('assistant retrieval', () => {
  it('indexes every kind of page the site publishes', () => {
    const kinds = new Set(ASSISTANT_CORPUS.map(chunk => chunk.kind));
    for (const kind of ['product', 'service', 'industry', 'guide', 'comparison', 'case-study', 'book', 'bundle', 'company']) {
      expect(kinds.has(kind), kind).toBe(true);
    }
    for (const chunk of ASSISTANT_CORPUS) {
      expect(chunk.path).toMatch(/^\/[a-z0-9/-]*\/$/i);
      expect(chunk.text.length).toBeGreaterThan(200);
      expect(chunk.text).not.toMatch(/<[a-z]+[^>]*>/);
    }
  });

  it('tokenizes with light stemming and drops stopwords', () => {
    expect(tokenize('Invoices and the hosting plans for HVAC contractors')).toEqual(['invoic', 'host', 'plan', 'hvac', 'contractor']);
  });

  it('finds the guide that answers a detailed question', () => {
    const { chunks } = retrieveContext(ask('how much does it cost to self host a model?'));
    expect(chunks[0].path).toBe('/guides/private-ai/self-hosting-cost/');
    expect(retrieveContext(ask('is private ai hipaa compliant')).chunks[0].path).toBe('/guides/private-ai/hipaa-and-private-ai/');
    expect(retrieveContext(ask('what is in the starter pack and what are the hosting plans')).chunks[0].path).toBe('/starter-pack/');
  });

  it('resolves "it" to the page the visitor is reading', () => {
    const result = retrieveContext(ask('how much does it cost?'), '/products/relay/');
    expect(result.page).toEqual({ path: '/products/relay/', title: 'Relay', kind: 'product' });
    expect(result.chunks[0].path).toBe('/products/relay/');
  });

  it('carries the previous question into a follow-up', () => {
    const { chunks } = retrieveContext(ask('what does private ai cost', 'and is it hipaa compliant?'));
    expect(chunks.map(chunk => chunk.path)).toContain('/guides/private-ai/hipaa-and-private-ai/');
  });

  it('returns nothing for gibberish and stays within budget', () => {
    expect(retrieveContext(ask('xyzzy plugh')).chunks).toEqual([]);
    const { chunks } = retrieveContext(ask('private ai guide governance receptionist relay hvac plumbing'));
    expect(chunks.length).toBeLessThanOrEqual(3);
    expect(chunks.reduce((n, chunk) => n + chunk.text.length, 0)).toBeLessThanOrEqual(9_000);
  });

  it('normalizes page paths defensively', () => {
    expect(normalizePagePath('/products/relay')).toBe('/products/relay/');
    expect(normalizePagePath('/products/relay/?utm=1#x')).toBe('/products/relay/');
    expect(normalizePagePath('/')).toBe('/');
    expect(normalizePagePath('products/relay/')).toBe('');
    expect(normalizePagePath('/a b/')).toBe('');
    expect(normalizePagePath('javascript:alert(1)')).toBe('');
    expect(normalizePagePath('/'.padEnd(300, 'a'))).toBe('');
  });

  it('renders the context block the prompt expects', () => {
    const text = renderContext(retrieveContext(ask('tell me about relay'), '/products/relay/'));
    expect(text).toMatch(/^VISITOR CONTEXT/);
    expect(text).toContain('RELEVANT PAGE CONTENT FOR THIS QUESTION');
    expect(text).toContain('[Relay — /products/relay/]');
    expect(renderContext({ page: null, chunks: [] })).toBe('');
    expect(renderContext({ page: null, chunks: [] }, 'Contact')).toContain('currently reading Contact');
  });
});

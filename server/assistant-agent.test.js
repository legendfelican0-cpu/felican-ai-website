import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { streamWithConfiguredProvider } from './app.js';

// A stand-in for the Messages API that answers in SSE frames. Each test sets
// `script`, a function from the parsed request body to the frames to send.
let script = () => [];
let requests = [];
let server;
let base;

const frame = (type, extra) => `event: ${type}\ndata: ${JSON.stringify({ type, ...extra })}\n\n`;
const textRound = (text, stop = 'end_turn') => [
  frame('message_start', { message: { usage: { input_tokens: 10 } } }),
  frame('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
  ...text.match(/.{1,7}/g).map(piece => frame('content_block_delta', { index: 0, delta: { type: 'text_delta', text: piece } })),
  frame('content_block_stop', { index: 0 }),
  frame('message_delta', { delta: { stop_reason: stop }, usage: { output_tokens: 5 } }),
];
const toolRound = (narration, name, input) => [
  frame('message_start', { message: { usage: { input_tokens: 10 } } }),
  ...(narration ? [
    frame('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
    frame('content_block_delta', { index: 0, delta: { type: 'text_delta', text: narration } }),
    frame('content_block_stop', { index: 0 }),
  ] : []),
  frame('content_block_start', { index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name, input: {} } }),
  frame('content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: JSON.stringify(input).slice(0, 8) } }),
  frame('content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: JSON.stringify(input).slice(8) } }),
  frame('content_block_stop', { index: 1 }),
  frame('message_delta', { delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 9 } }),
];

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      const body = JSON.parse(raw);
      requests.push(body);
      const out = script(body);
      if (out.status) { res.writeHead(out.status, { 'Content-Type': 'application/json' }); return res.end('{}'); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      for (const piece of out) res.write(piece);
      res.end();
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/v1/messages`;
});
afterAll(() => new Promise(resolve => server.close(resolve)));

const env = () => ({ ASHER_API_KEY: 'test', ASHER_BASE_URL: base, ASHER_MODEL: 'test-model' });
const ask = text => [{ role: 'user', content: text }];

describe('assistant tool loop', () => {
  it('turns narration into a status line, runs the tool, and streams only the answer', async () => {
    requests = [];
    script = body => (body.messages.length === 1
      ? toolRound('Let me check the Relay page.', 'search_site', { query: 'relay price' })
      : textRound('Relay is $999 one-time, plus hosting.'));
    const deltas = [];
    const statuses = [];
    const result = await streamWithConfiguredProvider(ask('what does relay cost?'), d => deltas.push(d), env(), 'SYSTEM', { onStatus: s => statuses.push(s) });
    expect(deltas.join('')).toBe('Relay is $999 one-time, plus hosting.');
    expect(result.reply).toBe('Relay is $999 one-time, plus hosting.');
    expect(statuses[0]).toBe('Let me check the Relay page.');
    expect(statuses[1]).toBe('Searching felican.ai for “relay price”…');
    expect(result.tools).toEqual(['search_site']);
    expect(result.pages).toContain('/products/relay/');
    expect(result.usage).toEqual({ inputTokens: 20, outputTokens: 14 });
    // Round 1 offered the tools with the plain-string system Asher expects; round 2
    // carried the model's own blocks and the tool result back.
    expect(requests[0].tools.map(t => t.name)).toEqual(['search_site', 'read_page']);
    expect(requests[0].system).toBe('SYSTEM');
    expect(requests[1].messages[1]).toEqual({ role: 'assistant', content: [
      { type: 'text', text: 'Let me check the Relay page.' },
      { type: 'tool_use', id: 'toolu_1', name: 'search_site', input: { query: 'relay price' } },
    ] });
    expect(requests[1].messages[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'toolu_1' });
    expect(requests[1].messages[2].content[0].content).toContain('[Relay — /products/relay/]');
  });

  it('streams a plain answer straight through and holds nothing back past the narration window', async () => {
    const long = 'Felican AI builds practical AI products and private AI systems for businesses in any industry, led by Lee Felican Jr. '.repeat(2);
    script = () => textRound(long);
    const deltas = [];
    const result = await streamWithConfiguredProvider(ask('what do you do?'), d => deltas.push(d), env(), 'SYSTEM');
    expect(deltas.join('')).toBe(long);
    expect(result.tools).toEqual([]);
    // The first flush happens once the text is clearly an answer, not narration.
    expect(deltas[0].length).toBeGreaterThan(100);
  });

  it('reads a page on request and stops after the round limit', async () => {
    let n = 0;
    script = () => (n++ < 5 ? toolRound('', 'read_page', { path: '/products/private-ai' }) : textRound('done'));
    const statuses = [];
    // Three rounds max: two tool rounds, then a final round asked without tools.
    await expect(streamWithConfiguredProvider(ask('x'), () => {}, env(), 'SYSTEM', { onStatus: s => statuses.push(s) })).rejects.toThrow('empty reply');
    expect(statuses).toEqual(['Reading Private AI…', 'Reading Private AI…']);
    expect(requests.at(-1).tools).toBeUndefined();
  });

  it('falls back to asking without tools when the provider rejects them, and remembers', async () => {
    requests = [];
    script = body => (body.tools ? { status: 400 } : textRound('No tools here.'));
    const result = await streamWithConfiguredProvider(ask('hello'), () => {}, env(), 'SYSTEM');
    expect(result.reply).toBe('No tools here.');
    expect(requests.map(r => Boolean(r.tools))).toEqual([true, false]);
    requests = [];
    await streamWithConfiguredProvider(ask('again'), () => {}, env(), 'SYSTEM');
    expect(requests.map(r => Boolean(r.tools))).toEqual([false]);
  });
});

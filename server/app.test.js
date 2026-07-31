import { afterEach, describe, expect, it } from 'vitest';
import { createAppServer, normalizeMessages, sanitizeText } from './app.js';

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start(complete = async () => 'A real answer from Felican AI.') {
  const server = createAppServer({ rootDir: process.cwd(), complete, logger: { error() {} } });
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

const browserHeaders = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126 Safari/537.36' };

describe('Felican AI server', () => {
  it('sanitizes visitor input and limits conversation size', () => {
    expect(sanitizeText('<b>Hello</b>\u0000 world')).toBe('Hello world');
    expect(normalizeMessages(Array.from({ length: 12 }, (_, index) => ({ role: 'user', content: `<b>${index}</b>` })))).toHaveLength(10);
  });

  it('returns a real assistant reply from the configured completion function', async () => {
    const base = await start(async messages => `You asked: ${messages.at(-1).content}`);
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ website: '', messages: [{ role: 'user', content: 'What do you build?' }] }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reply: 'You asked: What do you build?' });
  });

  it('rejects malformed JSON, empty questions, bots, and unsupported methods', async () => {
    const base = await start();
    const malformed = await fetch(`${base}/api/chat`, { method: 'POST', headers: browserHeaders, body: '{' });
    expect(malformed.status).toBe(400);
    const empty = await fetch(`${base}/api/chat`, { method: 'POST', headers: browserHeaders, body: JSON.stringify({ messages: [] }) });
    expect(empty.status).toBe(400);
    const bot = await fetch(`${base}/api/chat`, { method: 'POST', headers: { ...browserHeaders, 'User-Agent': 'curl/8' }, body: '{}' });
    expect(bot.status).toBe(403);
    const get = await fetch(`${base}/api/chat`, { headers: browserHeaders });
    expect(get.status).toBe(405);
  });

  it('does not call the AI provider when the honeypot is filled', async () => {
    let calls = 0;
    const base = await start(async () => { calls += 1; return 'unexpected'; });
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST', headers: browserHeaders,
      body: JSON.stringify({ website: 'spam.example', messages: [{ role: 'user', content: 'hello' }] }),
    });
    expect(response.status).toBe(200);
    expect(calls).toBe(0);
  });
});

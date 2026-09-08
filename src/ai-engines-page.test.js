import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The generator's onboarding picker links here; the page must exist, name
// every offered engine, and never claim a charge beyond the plan.
describe('starter-pack/ai-engines', () => {
  const html = readFileSync('public/starter-pack/ai-engines/index.html', 'utf8');
  it('lists the engines and tiers the picker offers', () => {
    for (const s of ['Pick for me', 'OpenAI', 'Claude', 'DeepSeek', 'GPT-5.6 Luna', 'GPT-5.6 Terra', 'GPT-5.6 Sol', 'Claude Fable 5.1', 'DeepSeek V4 Pro']) {
      expect(html).toContain(s);
    }
  });
  it('states the no-overage rule and the plan allowances', () => {
    expect(html).toMatch(/nothing is ever charged beyond your plan/i);
    expect(html).toContain('$10');
    expect(html).toContain('$25');
    expect(html).toContain('$60');
  });
  it('carries a last-updated date', () => {
    expect(html).toMatch(/Last updated \d{4}-\d{2}-\d{2}/);
  });
});

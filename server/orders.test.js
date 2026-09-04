import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createFileOrderStore } from './orders.js';

const tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function storePath() {
  const dir = await mkdtemp(join(tmpdir(), 'felican-orders-'));
  tempDirs.push(dir);
  return join(dir, 'private', 'orders.json');
}

describe('file order store', () => {
  it('persists paid order details across store instances', async () => {
    const path = await storePath();
    const first = createFileOrderStore(path);
    await first.upsertPaid({
      id: 'cs_test_1234567890', email: 'buyer@example.com', items: ['pack'], hostingPlan: 'growth',
      productTotalCents: 250_000, amountCents: 260_000,
      currency: 'usd', paidAt: '2026-09-01T01:02:03.000Z',
    });

    const restarted = createFileOrderStore(path);
    await expect(restarted.get('cs_test_1234567890')).resolves.toMatchObject({
      email: 'buyer@example.com', items: ['pack'], hostingPlan: 'growth', productTotalCents: 250_000,
      amountCents: 260_000, paidAt: '2026-09-01T01:02:03.000Z',
    });
  });

  it('preserves the first welcome marker when duplicate triggers upsert the order', async () => {
    const path = await storePath();
    const store = createFileOrderStore(path);
    const order = {
      id: 'cs_test_1234567890', email: 'buyer@example.com', items: ['assistant'], amountCents: 100_000,
      currency: 'usd', paidAt: '2026-09-01T01:02:03.000Z',
    };
    await store.upsertPaid(order);
    await store.markWelcomeSent(order.id, { sentAt: '2026-09-01T01:03:00.000Z', resendId: 'email_123' });
    await store.upsertPaid(order);
    await expect(store.get(order.id)).resolves.toMatchObject({
      welcomeSentAt: '2026-09-01T01:03:00.000Z', resendId: 'email_123',
    });
  });
});

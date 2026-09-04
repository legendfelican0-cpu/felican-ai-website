import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const EMPTY_STORE = Object.freeze({ version: 1, orders: {} });

function cleanRecord(order) {
  return {
    id: String(order.id),
    email: String(order.email || ''),
    items: Array.isArray(order.items) ? order.items.map(String) : [],
    hostingPlan: String(order.hostingPlan || ''),
    productTotalCents: Number(order.productTotalCents) || 0,
    amountCents: Number(order.amountCents) || 0,
    currency: String(order.currency || 'usd').toLowerCase(),
    paidAt: String(order.paidAt || new Date().toISOString()),
    welcomeSentAt: order.welcomeSentAt ? String(order.welcomeSentAt) : null,
    resendId: order.resendId ? String(order.resendId) : null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Small durable order store for this single-process server.
 * Writes are serialized and replaced atomically so a crash cannot leave half JSON.
 */
export function createFileOrderStore(filePath) {
  if (!filePath) throw new Error('An order store path is required');
  let state;
  let pending = Promise.resolve();

  async function load() {
    if (state) return state;
    try {
      const parsed = JSON.parse(await readFile(filePath, 'utf8'));
      state = parsed?.version === 1 && parsed.orders && typeof parsed.orders === 'object'
        ? parsed
        : { ...EMPTY_STORE, orders: {} };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      state = { ...EMPTY_STORE, orders: {} };
    }
    return state;
  }

  async function persist() {
    const parent = dirname(filePath);
    await mkdir(parent, { recursive: true, mode: 0o700 });
    const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    const handle = await open(tempPath, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await rename(tempPath, filePath);
    } catch (error) {
      await unlink(tempPath).catch(() => {});
      throw error;
    }
  }

  function serialize(operation) {
    const result = pending.then(operation, operation);
    pending = result.catch(() => {});
    return result;
  }

  return {
    async get(sessionId) {
      await pending;
      const current = await load();
      return current.orders[sessionId] ? structuredClone(current.orders[sessionId]) : null;
    },

    upsertPaid(order) {
      return serialize(async () => {
        const current = await load();
        const previous = current.orders[order.id] || {};
        current.orders[order.id] = cleanRecord({
          ...order,
          welcomeSentAt: previous.welcomeSentAt || order.welcomeSentAt,
          resendId: previous.resendId || order.resendId,
        });
        await persist();
        return structuredClone(current.orders[order.id]);
      });
    },

    markWelcomeSent(sessionId, { sentAt = new Date().toISOString(), resendId = null } = {}) {
      return serialize(async () => {
        const current = await load();
        const previous = current.orders[sessionId];
        if (!previous) throw new Error(`Cannot welcome unknown order ${sessionId}`);
        current.orders[sessionId] = cleanRecord({
          ...previous,
          welcomeSentAt: previous.welcomeSentAt || sentAt,
          resendId: previous.resendId || resendId,
        });
        await persist();
        return structuredClone(current.orders[sessionId]);
      });
    },
  };
}

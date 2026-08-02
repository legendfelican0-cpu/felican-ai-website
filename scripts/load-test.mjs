#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const target = new URL(process.argv[2] || 'https://felican.dev/');
const total = Math.max(1, Number.parseInt(process.env.LOAD_REQUESTS || '200', 10));
const concurrency = Math.max(1, Math.min(50, Number.parseInt(process.env.LOAD_CONCURRENCY || '25', 10)));
const paths = ['/', '/products/', '/services/', '/books/', '/about/', '/contact/', '/api/health'];

export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function hit(index) {
  const path = paths[index % paths.length];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const started = performance.now();
  try {
    const response = await fetch(new URL(path, target), { signal: controller.signal });
    await response.arrayBuffer();
    return { ok: response.ok, status: response.status, durationMs: performance.now() - started };
  } catch (error) {
    return { ok: false, status: 0, durationMs: performance.now() - started, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runLoad() {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < total) {
      const index = next;
      next += 1;
      results.push(await hit(index));
    }
  }
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const elapsedMs = performance.now() - started;
  const timings = results.map(result => result.durationMs);
  const errors = results.filter(result => !result.ok);
  const report = {
    timestamp: new Date().toISOString(),
    event: 'load.complete',
    target: target.origin,
    requests: total,
    concurrency,
    errors: errors.length,
    requestsPerSecond: Number((total / (elapsedMs / 1000)).toFixed(2)),
    p50Ms: Math.round(percentile(timings, 50)),
    p95Ms: Math.round(percentile(timings, 95)),
    p99Ms: Math.round(percentile(timings, 99)),
  };
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (errors.length) process.exitCode = 1;
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runLoad();

#!/usr/bin/env node
// Generates AVIF and WebP alongside every raster image in public/, and resizes the
// handful that are far larger than any place they are displayed.
//
// Why at build time rather than at the edge: Cloudflare Polish is a paid feature and
// is not active on this zone — the API accepts the setting and the origin still serves
// PNG. So the conversion has to happen here.
//
// The originals are never overwritten. New files sit beside them (foo.png ->
// foo.avif / foo.webp) so <picture> can offer them with the PNG as the fallback, and
// nothing breaks if a modern format is missing.
//
// Run with `npm run build:images`. Skips work that is already done and up to date.

import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

// Widest box any of these is displayed in. Anything wider is being downloaded and
// then thrown away by the browser.
const MAX_WIDTH = 1600;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const sources = walk(PUBLIC);
let made = 0;
let skipped = 0;
let savedBytes = 0;
const resized = [];

for (const src of sources) {
  const base = src.slice(0, -extname(src).length);
  const srcStat = statSync(src);
  const image = sharp(src);
  const meta = await image.metadata();
  const tooWide = meta.width && meta.width > MAX_WIDTH;
  if (tooWide) resized.push({ src: src.replace(PUBLIC, ''), from: meta.width });

  for (const [ext, encode] of [
    ['avif', s => s.avif({ quality: 55, effort: 4 })],
    ['webp', s => s.webp({ quality: 80 })],
  ]) {
    const out = `${base}.${ext}`;
    // Up to date already?
    if (existsSync(out) && statSync(out).mtimeMs >= srcStat.mtimeMs) { skipped++; continue; }
    let pipeline = sharp(src);
    if (tooWide) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    const buf = await encode(pipeline).toBuffer();
    writeFileSync(out, buf);
    made++;
    savedBytes += Math.max(0, srcStat.size - buf.length);
  }
}

const mb = n => (n / 1048576).toFixed(1);
console.log(`Images: generated ${made} file(s), ${skipped} already current.`);
console.log(`Approx saving vs original on a modern browser: ${mb(savedBytes)} MB total.`);
if (resized.length) {
  console.log(`\nResized down to ${MAX_WIDTH}px wide in the modern formats (originals untouched):`);
  for (const r of resized.slice(0, 12)) console.log(`  ${r.src} (was ${r.from}px)`);
  if (resized.length > 12) console.log(`  …and ${resized.length - 12} more`);
}

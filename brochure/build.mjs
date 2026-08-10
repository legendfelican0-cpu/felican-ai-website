// Builds a self-contained, print-ready bifold pamphlet, then renders it to PDF.
//   node build.mjs            -> dist/felican-bifold.html + .pdf + proof PNGs
//   node build.mjs --no-pdf   -> HTML only
import { writeFileSync, mkdirSync } from 'node:fs';
import { renderHtml, p, SHEET } from './src/render.mjs';

const html = renderHtml();
mkdirSync(p('dist'), { recursive: true });
writeFileSync(p('dist/felican-bifold.html'), html);
console.log('wrote dist/felican-bifold.html', (html.length / 1024).toFixed(0) + 'kb');

if (process.argv.includes('--no-pdf')) process.exit(0);

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + p('dist/felican-bifold.html'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

// Fit check: content that exceeds the sheet gets silently clipped by overflow:hidden,
// and a too-tall panel drags its neighbour's bottom-anchored footer off the page too.
const overflow = await page.evaluate((sheetHeightPx) => {
  return [...document.querySelectorAll('section.page')].flatMap((sheet) => {
    const rows = [{ what: `sheet "${sheet.dataset.label}"`, over: sheet.scrollHeight - sheetHeightPx }];
    for (const panel of sheet.querySelectorAll('.panel')) {
      rows.push({
        what: `${sheet.dataset.label} / ${panel.classList.contains('panel--left') ? 'left' : 'right'} panel`,
        over: panel.scrollHeight - panel.clientHeight,
      });
    }
    return rows;
  }).filter((r) => r.over > 0.5);
}, SHEET.heightIn * 96);
if (overflow.length) {
  for (const o of overflow) console.error(`  OVERFLOW  ${o.what} — ${o.over.toFixed(0)}px past the sheet`);
  await browser.close();
  throw new Error('Content does not fit the printed sheet; shorten copy or tighten spacing above.');
}
console.log(`fit check: both sheets within ${SHEET.widthIn}in x ${SHEET.heightIn}in`);

// Containment check. An element wider than its parent (a fixed-width child
// beside an unbreakable string, say) spills over borders and backgrounds
// without triggering any of the sheet-level checks.
const spills = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('section.page *')) {
    const parent = el.parentElement;
    if (!parent) continue;
    const r = el.getBoundingClientRect(), pr = parent.getBoundingClientRect();
    if (r.width < 1 || pr.width < 1) continue;
    const over = Math.max(pr.left - r.left, r.right - pr.right);
    if (over > 1) {
      out.push({
        what: el.tagName.toLowerCase() + (el.getAttribute('alt') ? `[${el.getAttribute('alt')}]` : ''),
        text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 34),
        over: Math.round(over),
      });
    }
  }
  return out;
});
if (spills.length) {
  for (const s of spills) console.error(`  SPILL  <${s.what}> "${s.text}" — ${s.over}px wider than its container`);
  await browser.close();
  throw new Error('An element overflows its container.');
}
console.log('containment check: nothing overflows its container');

// Fold check. The two panels must be exactly half the sheet each, or the
// printed fold lands off-centre and the panels stop lining up across sheets.
const foldErrors = await page.evaluate((sheetW) => {
  const out = [];
  for (const sheet of document.querySelectorAll('section.page')) {
    const base = sheet.getBoundingClientRect();
    const [left, right] = [...sheet.querySelectorAll('.panel')].map((el) => el.getBoundingClientRect());
    const fold = left.right - base.left;
    if (Math.abs(fold - sheetW / 2) > 0.5) {
      out.push({ sheet: sheet.dataset.label, fold: fold.toFixed(1), expected: sheetW / 2 });
    }
    // Nothing may cross the fold into the facing panel.
    for (const [name, panel] of [['left', left], ['right', right]]) {
      const bound = name === 'left' ? left.right : right.left;
      for (const el of sheet.querySelectorAll(`.panel--${name} *`)) {
        const r = el.getBoundingClientRect();
        if (r.width < 1) continue;
        const over = name === 'left' ? r.right - bound : bound - r.left;
        if (over > 0.5) {
          out.push({ sheet: sheet.dataset.label, cross: `${name} panel content crosses the fold by ${over.toFixed(0)}px` });
          break;
        }
      }
    }
  }
  return out;
}, SHEET.widthIn * 96);
if (foldErrors.length) {
  for (const f of foldErrors) {
    console.error(f.cross
      ? `  FOLD  ${f.sheet}: ${f.cross}`
      : `  FOLD  ${f.sheet}: fold at ${f.fold}px, expected ${f.expected}px`);
  }
  await browser.close();
  throw new Error('The fold is not on the sheet centre.');
}
console.log(`fold check: both sheets split exactly at ${SHEET.widthIn / 2}in`);

// Safe-area check. Consumer printers cannot print to the paper edge; ~0.25in
// on each side is typically lost. The dark background may bleed off (worst
// case is a thin white frame) but no text, logo or QR may sit in that band.
const SAFE_IN = 0.25;
const unsafe = await page.evaluate(({ safePx, sheetW, sheetH }) => {
  const hits = [];
  for (const sheet of document.querySelectorAll('section.page')) {
    const base = sheet.getBoundingClientRect();
    for (const el of sheet.querySelectorAll('h1, h2, h3, p, span, li, img, div[aria-label]')) {
      if (el.querySelector('h1, h2, h3, p, span, li, img')) continue; // leaves only
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const x0 = r.left - base.left, y0 = r.top - base.top;
      const x1 = r.right - base.left, y1 = r.bottom - base.top;
      const over = Math.max(safePx - x0, safePx - y0, x1 - (sheetW - safePx), y1 - (sheetH - safePx));
      if (over > 0.5) {
        hits.push({
          sheet: sheet.dataset.label,
          text: (el.getAttribute('alt') || el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 42),
          over: Math.round(over),
        });
      }
    }
  }
  return hits;
}, { safePx: SAFE_IN * 96, sheetW: SHEET.widthIn * 96, sheetH: SHEET.heightIn * 96 });

if (unsafe.length) {
  for (const u of unsafe) console.error(`  UNSAFE  ${u.sheet}: "${u.text}" — ${u.over}px into the ${SAFE_IN}in margin`);
  await browser.close();
  throw new Error(`Content sits inside the ${SAFE_IN}in printer margin and may be clipped.`);
}
console.log(`safe-area check: all content clears the ${SAFE_IN}in printer margin`);

await page.pdf({
  path: p('dist/felican-bifold.pdf'),
  width: `${SHEET.widthIn}in`,
  height: `${SHEET.heightIn}in`,
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
});
// Proof sheets for eyeballing, one PNG per side.
for (const [i, label] of [[0, 'outside'], [1, 'inside']]) {
  await page.locator('section.page').nth(i).screenshot({ path: p(`dist/proof-${label}.png`) });
}
await browser.close();
console.log('wrote dist/felican-bifold.pdf + proof PNGs');

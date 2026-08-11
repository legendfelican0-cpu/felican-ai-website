// Assembles the self-contained brochure HTML from content.json + the template.
// Shared by build.mjs (writes dist/ + PDF) and serve.mjs (live preview).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const p = (...s) => join(here, '..', ...s);

// Single source of truth for the sheet: the template, the PDF call and the
// fit check all read this, so they can never disagree about the paper.
// US Letter portrait, folded down the middle into two 4.25in x 11in panels.
export const SHEET = { widthIn: 8.5, heightIn: 11 };

const pad2 = (i) => String(i + 1).padStart(2, '0');

const escapeHtml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The ten benefit statements are the site's copy, so the site is the single
// source of truth and the brochure reads them straight from it. Keeping a
// second copy here meant editing one and silently leaving the other stale.
function readWaysFromSite() {
  const src = readFileSync(p('../index.html'), 'utf8');
  const m = src.match(/const WAYS\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!m) {
    throw new Error('Could not find the WAYS array in index.html. If the site ' +
      'source moved or was renamed, update readWaysFromSite() in src/render.mjs.');
  }
  let ways;
  try {
    ways = new Function(`return ${m[1]}`)();   // a plain array literal in our own source
  } catch (err) {
    throw new Error('The WAYS array in index.html did not parse: ' + err.message);
  }
  if (!Array.isArray(ways) || ways.length === 0) throw new Error('WAYS in index.html is empty.');
  ways.forEach((w, i) => {
    if (!w?.title || !w?.body) throw new Error(`WAYS entry ${i + 1} in index.html has no title/body.`);
  });
  return ways.map((w) => ({ title: escapeHtml(w.title), body: escapeHtml(w.body) }));
}

// bleedIn: extra margin beyond the trim edge for professional printing. The
// trim area and the fold do not move; the sheet just gets bigger around them.
export function renderHtml({ bleedIn = 0 } = {}) {
  // Re-read every call so the watcher picks up edits without a restart.
  const content = JSON.parse(readFileSync(p('src/content.json'), 'utf8'));
  const template = readFileSync(p('src/brochure.template.html'), 'utf8');
  const fonts = readFileSync(p('assets/fonts-embedded.css'), 'utf8');
  const logo = 'data:image/png;base64,' + readFileSync(p('../public/logo-mark.png')).toString('base64');

  // The QR is a pre-generated SVG, so it cannot follow a URL change in
  // content.json on its own. qr.json records what it actually encodes; if the
  // two drift, fail loudly rather than print a code pointing at the wrong page.
  const qrMeta = JSON.parse(readFileSync(p('assets/qr.json'), 'utf8'));
  if (qrMeta.url !== content.bookingUrl) {
    throw new Error(
      `QR encodes ${qrMeta.url} but content.json says ${content.bookingUrl}. ` +
      `Regenerate assets/qr.svg for the new URL and update assets/qr.json.`);
  }

  // Inline the QR as SVG so print stays crisp and needs no network at render time.
  const qr = readFileSync(p('assets/qr.svg'), 'utf8')
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/width="\d+"\s+height="\d+"/, 'width="100%" height="100%" viewBox="0 0 600 600"')
    .trim();

  const checklist = content.checklist.map((item) => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: linear-gradient(160deg, #102026 0%, #0a1a20 100%); border-top: 2px solid #2fb894;">
          <span style="flex: none; width: 18px; height: 18px; border: 1.5px solid #2fb894;"></span>
          <div>
            <div style="font-size: 12pt; font-weight: 600; line-height: 1.2;">${item.title}</div>
            <p style="margin: 4px 0 0; font-size: 8.8pt; line-height: 1.4; color: #8fa3a8;">${item.prompt}</p>
          </div>
        </div>`).join('');

  const ways = readWaysFromSite();

  // The heading states a count; keep it honest against the list it introduces.
  const claimed = content.benefitsTitle.match(/\d+/);
  if (claimed && Number(claimed[0]) !== ways.length) {
    throw new Error(`Heading says "${content.benefitsTitle}" but index.html has ` +
      `${ways.length} entries. Update benefitsTitle in content.json.`);
  }

  const benefits = ways.map((item, i) => `
      <li style="display: grid; grid-template-columns: 26px 1fr; gap: 9px; align-items: start; padding: 4px 0 4px;">
        <span style="font-family: 'IBM Plex Mono', monospace; font-size: 8.5pt; line-height: 1.55; color: #2fb894;">${pad2(i)}</span>
        <div>
          <div style="font-size: 10.5pt; font-weight: 600; line-height: 1.25; letter-spacing: -.01em; color: #eef4f4;">${item.title}</div>
          <p style="margin: 2px 0 0; font-size: 8.2pt; line-height: 1.36; color: #8fa3a8;">${item.body}</p>
        </div>
      </li>`).join('');

  // Credentials bar, matching .cred-bar on the live site (index.html): gold
  // gradient, dark logo tile, partner badges sitting straight on the gold.
  // All badges render at one height. The name underneath does the recognising:
  // aws.svg is the AWS Cloud architecture icon, not the AWS wordmark, so on its
  // own it reads as an anonymous cloud to anyone who isn't looking for it.
  const BADGE_H = 20;
  const badgeRow = content.credBar.badges.map((b) => {
    // A file with a slash is a brochure-local asset; a bare name comes from the
    // site's badge set in public/badges.
    const path = b.file.includes('/') ? b.file : `../public/badges/${b.file}`;
    const mime = b.file.endsWith('.png') ? 'image/png' : 'image/svg+xml';
    const uri = `data:${mime};base64,` + readFileSync(p(path)).toString('base64');
    // Scale is optical: a compact square mark needs more height than a wide one
    // to carry the same visual weight in the row.
    const hh = (BADGE_H * (b.scale ?? 1)).toFixed(1);
    // Fixed-height logo cell so every label sits on the same baseline
    // regardless of how tall its mark is.
    return `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="height: 26px; display: flex; align-items: center; justify-content: center;"><img src="${uri}" alt="${b.alt}" style="height: ${hh}px; max-width: 62px; width: auto; object-fit: contain; display: block;"></span>
            <span style="font-family: 'IBM Plex Mono', monospace; font-size: 5.3pt; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; line-height: 1; white-space: nowrap; color: #6B5120;">${b.alt}</span>
          </div>`;
  }).join('');

  const credBar = `
      <!-- The bar's background bleeds to the paper edge on the right, so its
           right padding is larger: content must stay out of the printer's
           non-printable margin. Left side is the fold, which is safe. -->
      <div style="background: linear-gradient(120deg, #D8A746 0%, #F2CD7A 45%, #C8963A 100%); color: #10161B; padding: 11px 28px 12px 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="flex: none; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 7px; background: #0C1419;">
            <img src="${logo}" alt="" style="width: 20px; height: 20px; object-fit: contain; display: block;">
          </span>
          <div>
            <p style="margin: 0; font-family: 'IBM Plex Mono', monospace; font-size: 6.2pt; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; line-height: 1; color: #5C4718;">${content.credBar.kicker}</p>
            <p style="margin: 3px 0 0; font-size: 9.6pt; font-weight: 800; line-height: 1.1; letter-spacing: -.01em; text-transform: uppercase;">${content.credBar.title}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; padding-top: 9px; border-top: 1px solid rgba(16,22,27,.22);">
          ${badgeRow}
        </div>
      </div>`;

  // Print-optimised copies of the site photography (~306dpi at panel width);
  // the originals in public/ are sized for the web hero and are far larger
  // than print needs, which bloats the PDF people have to email around.
  const photo = (key) =>
    'data:image/jpeg;base64,' +
    readFileSync(p(`assets/${content.images[key].file}`)).toString('base64');

  const services = content.services.map((s, i) => `
        <div style="display: flex; flex-direction: column; justify-content: center; padding: 9px 0 10px;">
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 8.5pt; letter-spacing: .16em; color: #2fb894;">${pad2(i)}</span>
          <h3 style="margin: 5px 0 4px; font-size: 13pt; font-weight: 600; letter-spacing: -.015em;">${s.title}</h3>
          <p style="margin: 0; font-size: 9.8pt; line-height: 1.5; color: #8fa3a8;">${s.body}</p>
        </div>`).join('');

  const processSteps = content.process.map((s, i) => `
      <div style="display: grid; grid-template-columns: 52px 1fr; gap: 14px; align-items: start;">
        <span style="font-size: 29pt; font-weight: 700; color: #1c3138; letter-spacing: -.03em; line-height: .9;">${pad2(i)}</span>
        <div>
          <h3 style="margin: 0 0 5px; font-size: 15.5pt; font-weight: 600; letter-spacing: -.02em;">${s.title}</h3>
          <p style="margin: 0; font-size: 10.5pt; line-height: 1.55; color: #8fa3a8;">${s.body}</p>
        </div>
      </div>`).join('');

  const html = template
    .replaceAll('{{BLEED}}', () => `${bleedIn}in`)
    .replaceAll('{{SHEET_W}}', () => `${SHEET.widthIn}in`)
    .replaceAll('{{SHEET_H}}', () => `${SHEET.heightIn}in`)
    .replace('{{FONTS}}', () => fonts)
    .replace('{{LOGO}}', () => logo)
    .replace('{{QR}}', () => qr)
    .replace('{{CHECKLIST}}', () => checklist)
    .replace('{{BENEFITS_TITLE}}', () => content.benefitsTitle)
    .replace('{{BENEFITS}}', () => benefits)
    .replace('{{HERO_IMG}}', () => photo('hero'))
    .replaceAll('{{TEAM_IMG}}', () => photo('team'))
    .replace('{{CREDBAR}}', () => credBar)
    .replace('{{SERVICES}}', () => services)
    .replace('{{PROCESS}}', () => processSteps)
    .replaceAll('{{EMAIL}}', () => content.email)
    .replaceAll('{{PHONE}}', () => content.phone)
    .replaceAll('{{BOOKING_LABEL}}', () => content.bookingLabel);

  const leftover = html.match(/\{\{[A-Z_]+\}\}/g);
  if (leftover) throw new Error('Unfilled placeholders: ' + [...new Set(leftover)].join(', '));
  return html;
}

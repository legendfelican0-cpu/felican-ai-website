#!/usr/bin/env node
// One-shot, idempotent patches to the hand-written pages that the SEO pass needs.
// Kept as a script rather than applied by hand so it survives a `git checkout` of
// those files and can be re-run after any edit to them.
//
// Run with `npm run patch:pages` (included in `npm run seo`).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(ROOT, rel), 'utf8');
const save = (rel, html) => writeFileSync(join(ROOT, rel), html);
const done = [];
const already = [];

/* 1. /products/ — link each card's title to the product's own page.
      The hub previously had no internal link to any of the nineteen product pages.
      The CTA is deliberately left alone: it points at the pre-filled contact form,
      which is a conversion path the owner built and an E2E test covers. Linking the
      title is the conventional pattern and gives the crawler the same hub->child edge. */
{
  const rel = 'public/products/index.html';
  let html = read(rel);
  if (html.includes('const SLUGS = {')) {
    already.push('products title links');
  } else {
    const anchor = "    const ask = x => '/contact/?product=' + encodeURIComponent(x.name);";
    if (!html.includes(anchor)) throw new Error('products: ask() anchor not found');
    html = html.replace(anchor, `${anchor}
    // Each product now has its own page. The card title links there; the CTA above
    // still opens the pre-filled contact form. Products absent from the map get no
    // title link and behave exactly as before.
    const SLUGS = {
      'Private AI': 'private-ai', 'Chat AI Assistant': 'chat-ai-assistant', 'Voice AI': 'voice-ai',
      'Felican IDP': 'felican-idp', 'CrossCheck AI': 'crosscheck-ai', 'Relay': 'relay',
      'World of Agents': 'world-of-agents', 'Quorum': 'quorum', 'FloorDesk': 'floordesk',
      'QuantDesk': 'quantdesk', 'ThreadPilot': 'threadpilot', 'AdPulse': 'adpulse',
      'Dendrite': 'dendrite', 'Ora': 'ora', 'Mira': 'mira', 'FrameFire': 'framefire',
      'Lumina': 'lumina', 'Avatar Comparison': 'avatar-comparison'
    };
    const pageHref = x => (SLUGS[x.name] ? '/products/' + SLUGS[x.name] + '/' : '');`);

    // Product card <h2> title -> link to the product page.
    const h2 = '<h2 class="product-title" style="margin:0;font-family:Sora,sans-serif;font-size:clamp(24px,2.2vw,31px);font-weight:800;line-height:1.08;letter-spacing:-0.03em;color:#EEF4F4;text-wrap:balance">{{ p.name }}</h2>';
    if (!html.includes(h2)) throw new Error('products: product-title h2 not found');
    html = html.replace(h2, '<h2 class="product-title" style="margin:0;font-family:Sora,sans-serif;font-size:clamp(24px,2.2vw,31px);font-weight:800;line-height:1.08;letter-spacing:-0.03em;color:#EEF4F4;text-wrap:balance"><a href="{{ p.pageHref }}" style="color:inherit;text-decoration:none" style-hover="color:#8FE0C8">{{ p.name }}</a></h2>');

    // Agent and "rest" card names -> same treatment.
    html = html.replace('<h3 class="agent-name">{{ a.name }}</h3>',
      '<h3 class="agent-name"><a href="{{ a.pageHref }}" style="color:inherit;text-decoration:none" style-hover="color:#8FE0C8">{{ a.name }}</a></h3>');

    // Expose pageHref on each rendered item.
    html = html.replace('        askHref: x.id === \'starter-pack\' ? \'/starter-pack/\' : ask(x),',
      '        askHref: x.id === \'starter-pack\' ? \'/starter-pack/\' : ask(x),\n        pageHref: x.id === \'starter-pack\' ? \'/starter-pack/\' : pageHref(x),');
    html = html.replace("      agents: agents.map((x, i) => ({ ...x, num: String(i + 1).padStart(2, '0'), askHref: ask(x) })),",
      "      agents: agents.map((x, i) => ({ ...x, num: String(i + 1).padStart(2, '0'), askHref: ask(x), pageHref: pageHref(x) })),");
    html = html.replace("      rest: rest.map(x => ({ ...x, askHref: ask(x) }))",
      "      rest: rest.map(x => ({ ...x, askHref: ask(x), pageHref: pageHref(x) }))");

    save(rel, html);
    done.push('products title links');
  }
}

/* 2. /starter-pack/ai-engines/ — the only indexable page with no canonical. */
{
  const rel = 'public/starter-pack/ai-engines/index.html';
  let html = read(rel);
  if (html.includes('rel="canonical"')) {
    already.push('ai-engines canonical');
  } else {
    html = html.replace('<title>', `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="https://felican.ai/starter-pack/ai-engines/">
<title>`);
    save(rel, html);
    done.push('ai-engines canonical + robots');
  }
}

/* 3. /starter-pack/ — sells three products and a bundle with no Product schema at all.
      Product is one of the few markup types that still produces a rich result.
      No `offers` price is emitted: prices live in server/checkout.js, the page renders
      them from there, and structured data must match what the page shows. Hard-coding
      a price here would eventually contradict checkout. */
{
  const rel = 'public/starter-pack/index.html';
  let html = read(rel);
  if (html.includes('/starter-pack/#bundle')) {
    already.push('starter-pack Product schema');
  } else {
    const ORIGIN = 'https://felican.ai';
    const items = [
      ['Private AI', 'private-ai'],
      ['Chat AI Assistant', 'chat-ai-assistant'],
      ['Voice AI', 'voice-ai'],
    ];
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          '@id': `${ORIGIN}/starter-pack/#bundle`,
          name: 'AI Business Starter Pack',
          url: `${ORIGIN}/starter-pack/`,
          description: 'Private AI, a Chat AI Assistant and Voice AI, generated from one shared source of business knowledge.',
          brand: { '@id': `${ORIGIN}/#organization` },
          isRelatedTo: items.map(([, slug]) => ({ '@id': `${ORIGIN}/products/${slug}/#product` })),
        },
        {
          '@type': 'ItemList',
          '@id': `${ORIGIN}/starter-pack/#list`,
          name: 'Products in the AI Business Starter Pack',
          itemListElement: items.map(([name, slug], i) => ({
            '@type': 'ListItem', position: i + 1, name, url: `${ORIGIN}/products/${slug}/`,
          })),
        },
      ],
    };
    const block = `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;
    save(rel, html.replace('</head>', `${block}\n</head>`));
    done.push('starter-pack Product + ItemList schema');
  }
}


/* 4. Runtime-set images — request AVIF/WebP per URL.
      The <x-dc> templates assign these src values at runtime, so <picture> cannot
      reach them. Server-side Accept negotiation was tried and reverted: Cloudflare
      honours only `Vary: Accept-Encoding`, so it cached one variant and served AVIF to
      clients that cannot decode it. A feature detect plus a distinct URL per format is
      cache-safe anywhere. */
{
  for (const rel of ['public/products/index.html', 'public/starter-pack/index.html']) {
    let html = read(rel);
    let changed = false;

    if (!html.includes('/format-support.js')) {
      html = html.replace('<script src="/support.js', '<script src="/format-support.js"></script>\n<script src="/support.js');
      changed = true;
    }

    const naive = `      const src = img.getAttribute('data-product-image');
      if (src && src.indexOf('{{') === -1) img.src = src;`;
    if (html.includes(naive)) {
      html = html.replace(naive, `      const src = img.getAttribute('data-product-image');
      if (!src || src.indexOf('{{') !== -1) return;
      // Wait for the one-off format probe, then request the smallest variant this
      // browser can decode. The fallback is the original path, so a failed or slow
      // probe still loads the image.
      const ready = window.felicanImageFormatReady;
      const assign = () => { img.src = window.felicanImageUrl ? window.felicanImageUrl(src) : src; };
      if (ready && typeof ready.then === 'function') ready.then(assign, assign);
      else assign();`);
      changed = true;
    }

    if (changed) { save(rel, html); done.push(`${rel} runtime image formats`); }
    else already.push(`${rel} runtime image formats`);
  }
}


/* 5. /products/ and /starter-pack/ — make the Product markup valid.
      Search Console reported 19 invalid items on /products/: "Either offers, review,
      or aggregateRating should be specified". Google's Product rich result requires
      one of those three, and /products/ deliberately shows no price — the hard rule is
      that cart and prices appear only on /starter-pack/.

      So the unpriced entries become SoftwareApplication, which is accurate for all of
      them and carries no offers requirement. The Starter Pack bundle keeps Product and
      gains real offers, generated from server/checkout.js — the single source of truth
      for price — so the markup and the displayed price cannot drift apart. */
{
  const { CATALOG } = await import('../server/checkout.js');
  const money = cents => (cents / 100).toFixed(2);

  // --- /products/: retype the unpriced Product nodes.
  {
    const rel = 'public/products/index.html';
    let html = read(rel);
    if (html.includes('"@type":"SoftwareApplication"') || html.includes('"@type": "SoftwareApplication"')) {
      already.push('products Product -> SoftwareApplication');
    } else {
      const before = html;
      // The ItemList entries and the standalone Product block both carry `"@type":"Product"`.
      html = html.replaceAll('"@type":"Product"', '"@type":"SoftwareApplication"');
      html = html.replaceAll('"@type": "Product"', '"@type": "SoftwareApplication"');
      if (html !== before) { save(rel, html); done.push('products Product -> SoftwareApplication'); }
      else already.push('products Product -> SoftwareApplication');
    }
  }

  // --- /starter-pack/: the bundle is genuinely priced and displayed, so it keeps
  //     Product and gets offers built from CATALOG.
  {
    const rel = 'public/starter-pack/index.html';
    let html = read(rel);
    if (html.includes('"offers"')) {
      already.push('starter-pack offers');
    } else {
      const pack = CATALOG.pack;
      const offers = {
        '@type': 'Offer',
        price: money(pack.amount),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://felican.ai/starter-pack/',
        seller: { '@id': 'https://felican.ai/#organization' },
      };
      const needle = '"@id":"https://felican.ai/starter-pack/#bundle"';
      if (!html.includes(needle)) throw new Error('starter-pack: bundle node not found');
      html = html.replace(
        '"brand":{"@id":"https://felican.ai/#organization"}',
        `"brand":{"@id":"https://felican.ai/#organization"},"offers":${JSON.stringify(offers)}`,
      );
      save(rel, html);
      done.push(`starter-pack offers ($${money(pack.amount)} from server/checkout.js)`);
    }
  }
}

if (done.length) console.log(`Patched: ${done.join('; ')}`);
if (already.length) console.log(`Already applied: ${already.join('; ')}`);

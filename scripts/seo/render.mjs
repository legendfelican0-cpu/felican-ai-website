// Renders complete, static, crawlable HTML pages.
//
// Deliberate choice: these pages do NOT use the <x-dc> client-side runtime for their
// body copy. The existing pages render product names, headings and the entire nav
// through {{ }} templating and <dc-import>, which means the server HTML contains no
// headings, no paragraphs and no internal links. Googlebot renders JS and mostly
// copes; text-only retrieval crawlers (GPTBot, ClaudeBot, PerplexityBot) do not.
// Everything generated here is plain HTML in the response body.

import { ORIGIN, ORG, NAV, FOOTER_COLUMNS, socialLive, companySocial } from '../../content/site.js';

export const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const abs = path => (path.startsWith('http') ? path : `${ORIGIN}${path}`);

// JSON-LD goes inside <script>, so the only character that can break out of the
// element is '<'. Escaping it as < keeps the JSON valid and the markup safe.
const jsonLd = data => JSON.stringify(data).replace(/</g, '\\u003c');

/* ------------------------------------------------------------------ schema */

export function organizationNode() {
  const sameAs = companySocial().map(s => s.url);
  return {
    '@type': 'Organization',
    '@id': `${ORIGIN}/#organization`,
    name: ORG.name,
    legalName: ORG.legalName,
    url: ORG.url,
    logo: { '@type': 'ImageObject', url: ORG.logo },
    image: ORG.image,
    description: ORG.description,
    email: ORG.email,
    telephone: ORG.telephone,
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      '@type': 'PostalAddress',
      addressRegion: ORG.addressRegion,
      addressCountry: ORG.addressCountry,
    },
    areaServed: ORG.areaServed.map(name => ({ '@type': 'AdministrativeArea', name })),
    founder: { '@id': `${ORIGIN}/#founder` },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: ORG.telephone,
        email: ORG.email,
        contactType: 'sales',
        areaServed: 'US',
        availableLanguage: 'English',
      },
    ],
    knowsAbout: ORG.knowsAbout,
  };
}

export function founderNode() {
  const sameAs = socialLive().filter(s => s.person).map(s => s.url);
  return {
    '@type': 'Person',
    '@id': `${ORIGIN}/#founder`,
    name: ORG.founder.name,
    // The profile page and its URL use the formal spelling; he goes by "Lee". Both are
    // declared so a search for either resolves to this one entity.
    alternateName: ORG.founder.alternateName,
    jobTitle: ORG.founder.jobTitle,
    description: ORG.founder.description,
    worksFor: { '@id': `${ORIGIN}/#organization` },
    // The canonical page about the person, not the company page that mentions him.
    url: `${ORIGIN}${ORG.founder.profilePath}`,
    mainEntityOfPage: `${ORIGIN}${ORG.founder.profilePath}`,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: ORG.url,
    name: ORG.name,
    publisher: { '@id': `${ORIGIN}/#organization` },
    inLanguage: 'en-US',
  };
}

// Breadcrumbs still render as a rich result and are the cheapest way to express the
// hierarchy these new URLs create.
export function breadcrumbNode(trail, canonical) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(canonical)}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: abs(crumb.href),
    })),
  };
}

/* -------------------------------------------------------------------- head */

function headTags({ title, description, canonical, ogType = 'website', image, imageAlt, robots, graph }) {
  const ogImage = abs(image || '/og.png');
  const alt = imageAlt || 'Felican AI — AI solutions for private businesses';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${esc(robots || 'index,follow,max-image-preview:large,max-snippet:-1')}">
<link rel="canonical" href="${esc(abs(canonical))}">
<meta property="og:type" content="${esc(ogType)}">
<meta property="og:site_name" content="Felican AI">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(canonical))}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<meta name="twitter:image:alt" content="${esc(alt)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="/support.js?v=20260802"></script>
<link rel="stylesheet" href="/content.css">
<script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

/* ----------------------------------------------------------- nav / footer */

function nav(activeHref) {
  // Reproduces public/SiteNav.dc.html. The <x-dc> version resolves its links at
  // runtime; these pages ship the nav in the HTML so a text-only crawler sees it, so
  // the same markup is emitted statically and the styling lives in content.css.
  //
  // The mobile panel is toggled by a three-line inline script using the `hidden`
  // attribute rather than a checkbox: support.js injects its own full-page CSS, which
  // overrode a `display:none` class rule and left both navs on screen at once. The
  // `[hidden]` rule in content.css is !important precisely so that cannot recur.
  const items = NAV.map(link => {
    const current = activeHref === link.href || (link.href !== '/' && activeHref.startsWith(link.href));
    return `<li><a href="${link.href}"${current ? ' aria-current="page"' : ''}>${esc(link.label)}</a></li>`;
  }).join('');

  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="shell head-inner">
    <a class="brand" href="/" aria-label="Felican AI home">
      <picture>
        <source srcset="/logo-mark.avif" type="image/avif">
        <source srcset="/logo-mark.webp" type="image/webp">
        <img src="/logo-mark.png" alt="" width="28" height="28" decoding="async">
      </picture>
      <span>Felican<b> AI</b></span>
    </a>
    <nav class="desktop" aria-label="Main"><ul>${items}</ul></nav>
    <a class="head-cta" href="/booking/">Book a call</a>
    <button class="nav-toggle-box" type="button" aria-expanded="false" aria-controls="felican-mobile-nav" aria-label="Toggle navigation menu">
      <span aria-hidden="true"><i></i><i></i><i></i></span>Menu
    </button>
  </div>
  <div class="nav-mobile" id="felican-mobile-nav" hidden>
    <nav aria-label="Mobile"><ul>${items}<li><a class="mob-cta" href="/booking/">Book a call</a></li></ul></nav>
  </div>
</header>
<script>
  (() => {
    const button = document.querySelector('.nav-toggle-box');
    const panel = document.getElementById('felican-mobile-nav');
    if (!button || !panel) return;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  })();
</script>`;
}

function footer() {
  // Reproduces public/SiteFooter.dc.html — #05090C ground, 4px teal top border, the
  // same four columns and bottom bar. Kept static for the same reason as the nav.
  const columns = FOOTER_COLUMNS.map(
    col => `<nav aria-label="${esc(col.title)}"><h2>${esc(col.title)}</h2><ul>${col.links
      .map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`)
      .join('')}</ul></nav>`,
  ).join('');

  const social = socialLive();
  const socialBlock = social.length
    ? `<nav aria-label="Follow"><h2>Follow</h2><ul>${social
        .map(s => `<li><a href="${esc(s.url)}" rel="me">${esc(s.label)}</a></li>`)
        .join('')}</ul></nav>`
    : '';

  return `<footer class="site-foot">
  <div class="shell">
    <div class="foot-grid">
      <div class="foot-id">
        <a class="brand" href="/" aria-label="Felican AI home">
          <picture>
            <source srcset="/logo-mark.avif" type="image/avif">
            <source srcset="/logo-mark.webp" type="image/webp">
            <img src="/logo-mark.png" alt="" width="30" height="30" loading="lazy" decoding="async">
          </picture>
          <span>Felican<b> AI</b></span>
        </a>
        <p>Useful AI products, custom systems, automations, integrations, and training &mdash; built for how your business actually operates.</p>
        <p class="nap">
          <a href="tel:+15612350799">${esc(ORG.telephoneDisplay)}</a><br>
          <a href="mailto:${ORG.email}">${ORG.email}</a><br>
          <span>Serving Palm Beach, Broward and Miami-Dade counties, and clients nationwide.</span>
        </p>
      </div>
      ${columns}
      ${socialBlock}
      <div>
        <h2>Contact</h2>
        <div style="display:grid;gap:14px">
          <a href="mailto:${ORG.email}" style="font-size:17px;color:#C2D2D4;word-break:break-all">${ORG.email}</a>
          <a class="foot-cta" href="/booking/">Book a call <span aria-hidden="true">&rarr;</span></a>
        </div>
      </div>
    </div>
    <div class="foot-base">
      <p>&copy; ${new Date().getFullYear()} Felican AI. All rights reserved.</p>
      <div>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <span>Books by ${esc(ORG.founder.name)}</span>
      </div>
    </div>
  </div>
</footer>`;
}

function breadcrumbTrail(trail) {
  if (trail.length < 2) return '';
  const items = trail
    .map((crumb, index) =>
      index === trail.length - 1
        ? `<li aria-current="page">${esc(crumb.label)}</li>`
        : `<li><a href="${crumb.href}">${esc(crumb.label)}</a></li>`,
    )
    .join('');
  return `<nav class="crumbs" aria-label="Breadcrumb"><div class="shell"><ol>${items}</ol></div></nav>`;
}

/* -------------------------------------------------------------------- page */

/**
 * Build a complete HTML document.
 *
 * `trail` is the breadcrumb, beginning at Home and ending at this page; its last
 * entry's href is used as the canonical URL so the two can never disagree.
 */
export function page({
  title,
  description,
  canonical,
  trail = [],
  extraGraph = [],
  ogType,
  image,
  imageAlt,
  robots,
  body,
  activeNav = '',
}) {
  const graph = [organizationNode(), founderNode(), websiteNode(), ...extraGraph];
  if (trail.length > 1) graph.push(breadcrumbNode(trail, canonical));

  return `<!DOCTYPE html>
<html lang="en">
<head>
${headTags({ title, description, canonical, ogType, image, imageAlt, robots, graph })}
</head>
<body>
<x-dc>
${nav(activeNav || canonical)}
${breadcrumbTrail(trail)}
<main id="main">
${body}
</main>
${certStrip()}
${footer()}
<dc-import name="ChatAssistant" hint-size="100%,0px"></dc-import>
</x-dc>
<script src="/analytics.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------- components */
/**
 * A <picture> offering AVIF and WebP with the original as the fallback <img>.
 *
 * One URL per format, deliberately. Server-side Accept negotiation was tried and
 * reverted: Cloudflare honours only `Vary: Accept-Encoding` and ignores `Vary: Accept`,
 * so a negotiated response is cached once and served to every client — a browser
 * without AVIF support then receives AVIF and shows a broken image. Distinct URLs are
 * cache-safe on any CDN, and the browser does the choosing.
 *
 * `src` must be a .png/.jpg path; scripts/optimize-images.mjs generates the siblings.
 * width/height are required — they are what lets the browser reserve space, and
 * unsized images are the usual cause of layout shift.
 */
export function picture({ src, alt, width, height, className = '', style = '', lazy = true }) {
  const base = src.replace(/\.(png|jpe?g)$/i, '');
  const attrs = [
    `src="${esc(src)}"`,
    `alt="${esc(alt)}"`,
    `width="${width}"`,
    `height="${height}"`,
    lazy ? 'loading="lazy"' : '',
    'decoding="async"',
    className ? `class="${esc(className)}"` : '',
    style ? `style="${esc(style)}"` : '',
  ].filter(Boolean).join(' ');
  return `<picture>
  <source srcset="${esc(base)}.avif" type="image/avif">
  <source srcset="${esc(base)}.webp" type="image/webp">
  <img ${attrs}>
</picture>`;
}


export const shell = inner => `<div class="shell">${inner}</div>`;

export function hero({ eyebrow, h1, lede, ctas = [] }) {
  // The site's signature opener: vertical teal grid lines across the full width, plus
  // a skewed #0C1419 panel on the right. Both are decorative and aria-hidden. Values
  // copied from the hero on public/about/index.html so the pages read as one site.
  const buttons = ctas
    .map(
      (cta, index) =>
        `<a class="btn ${index === 0 ? 'btn-primary' : 'btn-ghost'}" href="${cta.href}">${esc(cta.label)}</a>`,
    )
    .join('');
  return `<section class="hero">
  <div class="stripes" aria-hidden="true"></div>
  <div class="skew" aria-hidden="true"></div>
  <div class="shell">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h1>${esc(h1)}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ''}
    ${buttons ? `<div class="cta-row">${buttons}</div>` : ''}
  </div>
</section>`;
}

/**
 * The "CERTIFIED ACROSS THE PLATFORMS WE BUILD ON" strip from the about page, so every
 * generated page closes with the same credential proof the rest of the site carries.
 */
export function certStrip() {
  const badges = [
    { src: '/badges/aws.png', alt: 'AWS' },
    { src: '/badges/gcp.svg', alt: 'Google Cloud' },
    { src: '/badges/azure.svg', alt: 'Microsoft Azure' },
    { src: '/badges/anthropic.svg', alt: 'Anthropic', cls: 'is-mono' },
    { src: '/badges/openai.svg', alt: 'OpenAI', cls: 'is-mono' },
  ];
  const slots = badges
    .map(b => {
      const img = `<img${b.cls ? ` class="${b.cls}"` : ''} src="${b.src}" alt="${esc(b.alt)}" width="100" height="34" loading="lazy" decoding="async">`;
      // SVGs are already tiny and have no raster variants; only the PNG gets a <picture>.
      const inner = /\.png$/i.test(b.src)
        ? `<picture><source srcset="${b.src.replace(/\.png$/i, '.avif')}" type="image/avif"><source srcset="${b.src.replace(/\.png$/i, '.webp')}" type="image/webp">${img}</picture>`
        : img;
      return `<span class="cert-slot">${inner}</span>`;
    })
    .join('');
  return `<section class="cert-band">
  <div class="shell">
    <h2 class="eyebrow" style="font-size:14px">Certified across the platforms we build on</h2>
    <div class="cert-strip">${slots}</div>
  </div>
</section>`;
}

export function prose(blocks) {
  return `<section class="band"><div class="shell prose">${blocks.join('\n')}</div></section>`;
}

export function cardGrid({ eyebrow, heading, intro, cards, cols = 3 }) {
  const items = cards
    .map(card => {
      const inner = `${card.tag ? `<span class="tag">${esc(card.tag)}</span>` : ''}
        <h3>${esc(card.title)}</h3>
        <p>${card.body}</p>
        ${card.meta ? `<p class="card-meta">${card.meta}</p>` : ''}`;
      return card.href
        ? `<a class="card card-link" href="${card.href}">${inner}<span class="card-go" aria-hidden="true">&rarr;</span></a>`
        : `<article class="card">${inner}</article>`;
    })
    .join('');
  return `<section class="band">
  <div class="shell">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    ${heading ? `<h2>${esc(heading)}</h2>` : ''}
    ${intro ? `<p class="intro">${intro}</p>` : ''}
    <div class="grid cols-${cols}">${items}</div>
  </div>
</section>`;
}

export function faq(items) {
  // FAQPage markup is deliberately omitted: Google retired FAQ rich results, so it
  // buys no SERP space. Question-shaped <h3> headings are what actually helps here —
  // they match how people phrase the query and are cleanly extractable.
  const rows = items
    .map(item => `<div class="qa"><h3>${esc(item.q)}</h3>${item.a}</div>`)
    .join('');
  return `<section class="band band-alt">
  <div class="shell">
    <p class="eyebrow">Questions people actually ask</p>
    <h2>Before you call</h2>
    <div class="qa-list">${rows}</div>
  </div>
</section>`;
}

export function cta({ heading, body, primary, secondary }) {
  return `<section class="band band-cta">
  <div class="shell">
    <h2>${esc(heading)}</h2>
    ${body ? `<p class="intro">${body}</p>` : ''}
    <div class="cta-row">
      <a class="btn btn-primary" href="${primary.href}">${esc(primary.label)}</a>
      ${secondary ? `<a class="btn btn-ghost" href="${secondary.href}">${esc(secondary.label)}</a>` : ''}
    </div>
  </div>
</section>`;
}

export function keyFacts(rows) {
  return `<section class="band">
  <div class="shell">
    <dl class="facts">${rows
      .map(row => `<div><dt>${esc(row.k)}</dt><dd>${row.v}</dd></div>`)
      .join('')}</dl>
  </div>
</section>`;
}

export function table({ caption, head, rows }) {
  return `<div class="tbl-wrap">
  <table>
    ${caption ? `<caption>${esc(caption)}</caption>` : ''}
    <thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map(row => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${cell}</th>` : `<td>${cell}</td>`)).join('')}</tr>`)
      .join('')}</tbody>
  </table>
</div>`;
}

export function relatedLinks({ heading = 'Keep reading', links }) {
  return `<section class="band band-alt">
  <div class="shell">
    <h2>${esc(heading)}</h2>
    <ul class="links">${links
      .map(l => `<li><a href="${l.href}"><strong>${esc(l.label)}</strong>${l.note ? `<span>${esc(l.note)}</span>` : ''}</a></li>`)
      .join('')}</ul>
  </div>
</section>`;
}

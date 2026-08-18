import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('Discoverability and link previews', () => {
  const PAGES = [
    'index.html',
    'public/about/index.html', 'public/booking/index.html', 'public/books/index.html',
    'public/contact/index.html', 'public/education/index.html', 'public/privacy/index.html', 'public/products/index.html',
    'public/services/index.html', 'public/terms/index.html',
  ];
  const headOf = file => {
    const src = read(file);
    return src.slice(0, src.indexOf('</head>'));
  };

  // The page body is rendered client-side, but link-preview scrapers (Facebook,
  // LinkedIn, Slack, iMessage) never run JavaScript. These tags must therefore
  // sit in the static <head> or a pasted link shows a bare URL.
  it.each(PAGES)('%s exposes SEO tags in the static <head>', file => {
    const head = headOf(file);
    expect(head).toMatch(/<title>.+<\/title>/);
    expect(head).toContain('name="description"');
    expect(head).toContain('rel="canonical"');
    expect(head).toContain('property="og:title"');
    expect(head).toContain('property="og:description"');
    expect(head).toContain('property="og:image"');
    expect(head).toContain('name="twitter:card"');
  });

  it.each(PAGES)('%s declares the real og:image dimensions', file => {
    const head = headOf(file);
    expect(head).toContain('content="https://felican.ai/og.png"');
    expect(head).toContain('property="og:image:width" content="1102"');
    expect(head).toContain('property="og:image:height" content="579"');
    expect(head).toContain('property="og:image:alt"');
  });

  it.each(PAGES)('%s carries valid Organization structured data', file => {
    const match = headOf(file).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const graph = JSON.parse(match[1])['@graph'];
    const org = graph.find(node => node['@type'] === 'Organization');
    expect(org).toBeTruthy();
    expect(org.telephone).toBe('+1-561-235-0799');
    expect(org.logo.url).toBe('https://felican.ai/logo-mark.png');
  });

  it('keeps the og image in sync with the file on disk', () => {
    const png = fs.readFileSync(path.join(projectRoot, 'public/og.png'));
    expect(png.slice(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1102);
    expect(png.readUInt32BE(20)).toBe(579);
  });

  it('lists every public route in the sitemap', () => {
    const sitemap = read('public/sitemap.xml');
    for (const route of ['/', '/products/', '/services/', '/education/', '/books/', '/about/', '/contact/', '/booking/']) {
      expect(sitemap).toContain(`<loc>https://felican.ai${route}</loc>`);
    }
    expect(sitemap).toContain('<lastmod>');
  });
});

describe('Claude Design static website export', () => {
  it('ships the redesigned homepage and clean internal routes', () => {
    const home = read('index.html');

    expect(home).toContain('AI solutions for');
    expect(home).toContain('Sound familiar?');
    expect(home).toContain('Tell us where it hurts');
    expect(home).toContain('friction-input');
    expect(home).not.toMatch(/(?:Home|Products|Services|Books|About|Contact)\.dc\.html/);
  });

  it.each([
    ['products', 'Products built for real work.'],
    ['services', 'Services'],
    ['books', 'Books by Lee Felican Jr.'],
    ['about', 'A family-built company that builds AI for a living'],
    ['contact', "Let's talk about your business"],
    ['booking', 'Let’s talk about where AI can create leverage.'],
    ['education', 'AI learning that meets people where they are.'],
    ['privacy', 'Privacy Policy'],
    ['terms', 'Terms of Use'],
  ])('includes the %s page', (route, expectedText) => {
    expect(read(`public/${route}/index.html`)).toContain(expectedText);
  });

  it('uses the real four book-cover assets', () => {
    const books = `${read('index.html')}\n${read('public/books/index.html')}`;

    for (const image of [
      '/book-big-ballas.jpg',
      '/book-dont-be-replaced.jpg',
      '/book-stop-being-nice.jpg',
      '/book-big-ai.jpg',
    ]) {
      expect(books).toContain(image);
    }
  });

  it('loads shared Design Component imports from the site root', () => {
    expect(read('public/support.js')).toContain('var COMPONENT_DIR = "";');
    expect(read('public/support.js')).toContain('var REACT_URL = "/vendor/react.production.min.js";');
    expect(read('public/support.js')).not.toContain('https://unpkg.com');
  });

  it('routes every product to the contact form instead of the live app', () => {
    const products = read('public/products/index.html');
    // Products deliberately no longer link out; each CTA pre-fills the contact form.
    for (const url of [
      'https://auto.felican.ai/',
      'https://relay.felican.dev/relay',
      'https://woa.felican.ai/',
      'https://book-studio.felican.dev/',
    ]) {
      expect(products).not.toContain(url);
    }
    expect(products).toContain("'/contact/?product=' + encodeURIComponent(x.name)");
    expect(products).not.toMatch(/BookMarketer|book-marketer|product-marketer/i);
  });

  it('leads the product list with Private AI as the flagship', () => {
    const products = read('public/products/index.html');
    expect(products).toContain("name: 'Private AI'");
    expect(products).toContain('featured: true');
    expect(products.indexOf("name: 'Private AI'")).toBeLessThan(products.indexOf("name: 'Felican AI Assistant'"));
    // The contact form must offer the same name so ?product= pre-selects it.
    expect(read('public/contact/index.html')).toContain("'Private AI'");
  });

  it('includes a compact interactive Private AI preview', () => {
    const products = read('public/products/index.html');
    expect(products).toContain('INTERACTIVE PREVIEW');
    expect(products).toContain('Felican Private AI');
    expect(products).toContain('runPreview(item)');
    expect(products).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
  });

  it('offers text and browser voice from the Felican AI assistant', () => {
    const assistant = read('public/ChatAssistant.dc.html');
    expect(assistant).toContain('Talk to Felican AI');
    expect(assistant).toContain('Voice + text');
    expect(assistant).toContain('window.SpeechRecognition || window.webkitSpeechRecognition');
    expect(assistant).toContain("fetch('/api/chat'");
  });

  it('gates every education eBook before opening the shared library', () => {
    const education = read('public/education/index.html');
    for (const id of [
      '12-ways-ai-can-help-your-business',
      'ai-starter-pack-for-kids-teens-and-adults',
      'ai-for-entrepreneurs',
      'no-more-excuses-12-ai-side-hustles',
    ]) expect(education).toContain(id);
    expect(education).toContain("fetch('/api/education-interest'");
    expect(education).toContain('window.location.assign(payload.guideUrl)');
    expect(education).not.toContain('Open the PDF');
  });

  it('orders the headline products as the owner specified', () => {
    const products = read('public/products/index.html');
    const order = [
      'Private AI', 'Felican AI Assistant', 'Felican IDP', 'CrossCheck AI',
      'Felican AI Auto Marketer', 'World of Agents', 'AI Receptionist', 'Relay',
      'CandyShop', 'Felican AI Trading',
    ];
    const positions = order.map(name => products.indexOf(`name: '${name}'`));
    positions.forEach((pos, i) => expect(pos, `${order[i]} missing`).toBeGreaterThan(-1));
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i], `${order[i]} out of order`).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('groups the strongest factory apps as agents, then the rest of the bench', () => {
    const products = read('public/products/index.html');
    const contact = read('public/contact/index.html');
    for (const name of ['Quorum', 'FloorDesk', 'QuantDesk', 'ThreadPilot', 'AdPulse', 'Dendrite']) {
      expect(products).toContain(`name: '${name}'`);
      expect(contact).toContain(`'${name}'`);
    }
    for (const name of ['Ora', 'Mira', 'FrameFire', 'Lumina', 'Avatar Comparison']) {
      expect(products).toContain(`name: '${name}'`);
      expect(contact).toContain(`'${name}'`);
    }
    // Agents come before the leftovers on the page.
    expect(products.indexOf('const agents =')).toBeLessThan(products.indexOf('const rest ='));
  });

  it('drops Factory and the retired Felican Auto name', () => {
    const products = read('public/products/index.html');
    expect(products).not.toContain('Factory');
    expect(products).not.toContain("name: 'Felican Auto'");
    // Renamed, but it keeps the same screenshot.
    expect(products).toContain("name: 'AI Receptionist'");
    expect(products).toContain('/product-felican-auto.png');
  });

  it('excludes the entries the owner asked to keep off the site', () => {
    const products = read('public/products/index.html');
    const contact = read('public/contact/index.html');
    // BetIQ (sports betting) and the three real-estate apps were explicitly withdrawn.
    for (const dropped of ['BetIQ', 'CasaSuite', 'LeadConcierge AI', 'InvestorHQ']) {
      expect(products).not.toContain(dropped);
      expect(contact).not.toContain(dropped);
    }
    // Internal infrastructure and client sites from the registry must never be published.
    for (const internal of ['Portainer', 'n8n', 'Talons by Byrd', 'YWCA', 'IntakeMaster', 'Scraper tool']) {
      expect(products).not.toContain(internal);
    }
  });

  it('gives every headline product a cover image that exists on disk', () => {
    const products = read('public/products/index.html');
    const covers = [...products.matchAll(/image: '(\/product-[a-z0-9-]+\.png)'/g)].map(m => m[1]);
    // All eleven cards above the agent sections carry artwork.
    expect(covers.length).toBe(11);
    for (const cover of covers) {
      const file = path.join(projectRoot, 'public', cover.replace(/^\//, ''));
      expect(fs.existsSync(file), `${cover} missing from public/`).toBe(true);
      const bytes = fs.readFileSync(file);
      // product-relay.png is actually a JPEG carrying a .png name — harmless, since
      // browsers sniff the content, so accept either signature.
      const isPng = bytes.slice(1, 4).toString() === 'PNG';
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      expect(isPng || isJpeg, `${cover} is not a usable image`).toBe(true);
    }
  });

  it('never mentions the internal ResyDoc name', () => {
    const everything = [
      'index.html', 'public/products/index.html', 'public/contact/index.html',
      'public/about/index.html', 'public/services/index.html', 'public/ChatAssistant.dc.html',
    ].map(read).join('\n');
    expect(everything).not.toMatch(/resydoc/i);
  });

  it('uses a purpose-built assistant cover, not a screenshot of any website', () => {
    const cover = fs.readFileSync(path.join(projectRoot, 'public/product-ai-assistant.png'));
    expect(cover.slice(1, 4).toString()).toBe('PNG');
    // Two covers have been retired here: a grab of the old blue homepage carrying a
    // dead phone number, then a mock of the widget UI that still read as a website.
    // The current one is illustrated artwork matching the rest of the lineup.
    expect(cover.readUInt32BE(16)).toBe(947);
    expect(cover.readUInt32BE(20)).toBe(592);
  });

  it('places World of Agents directly after Felican Auto', () => {
    const productPage = read('public/products/index.html');
    expect(productPage.indexOf("name: 'Felican Auto'")).toBeLessThan(productPage.indexOf("name: 'World of Agents'"));
    expect(productPage.indexOf("name: 'World of Agents'")).toBeLessThan(productPage.indexOf("name: 'Relay'"));
  });

  it('offers a real contact form alongside direct email and phone', () => {
    const contact = read('public/contact/index.html');
    expect(contact).toContain("'ai' + '@' + 'felican.ai'");
    expect(contact).toContain("'mailto:' + EMAIL");
    expect(contact).toContain('<form');
    expect(contact).toContain("fetch('/api/contact'");
    // Honeypot field must stay in place for spam filtering.
    expect(contact).toContain('name="website"');
    // The current company line, not the retired one.
    expect(contact).toContain('tel:+15612350799');
    expect(contact).not.toContain('tel:+13465150361');
  });

  it('pre-fills the contact form from the ?product= link products use', () => {
    const contact = read('public/contact/index.html');
    expect(contact).toContain("new URLSearchParams(window.location.search).get('product')");
    expect(contact).toContain("'Ask us about '");
  });

  it('foregrounds the certified team on the contact page', () => {
    const contact = read('public/contact/index.html');
    expect(contact).toContain('more than ten certified AI professionals');
    expect(contact).toContain('Certified AI professionals on the team');
  });

  it('ships a stable booking route with validated Calendly/Cal.com configuration and direct fallbacks', () => {
    const booking = read('public/booking/index.html');
    const config = read('public/booking-config.js');
    const nav = read('public/SiteNav.dc.html');

    expect(booking).toContain('https://felican.ai/booking/');
    expect(booking).toContain("parsed.hostname === 'calendly.com'");
    expect(booking).toContain("parsed.hostname === 'cal.com'");
    expect(booking).toContain('The calendar is being connected.');
    expect(booking).not.toContain('tel:+13465150361');
    expect(booking).not.toContain('<form');
    expect(config).toMatch(/bookingUrl:\s*'https:\/\/(calendly\.com|cal\.com)\//);
    expect(nav).toContain('Book a call');
    expect(nav).toMatch(/href="\{\{ bookingUrl \}\}" target="_blank"/);
    expect(read('public/sitemap.xml')).toContain('https://felican.ai/booking/');
  });

  it('connects the assistant UI to the protected server endpoint', () => {
    const assistant = read('public/ChatAssistant.dc.html');
    expect(assistant).toContain("fetch('/api/chat'");
    expect(assistant).toContain('data-assistant-launcher="1"');
    expect(assistant).toContain('class="fa-panel"');
    expect(assistant).toContain('businesses can embed inside a website or app');
    expect(assistant).not.toContain('window.claude.complete');
  });

  it('positions Felican AI Assistant as an embeddable agent', () => {
    const productCopy = `${read('index.html')}\n${read('public/products/index.html')}\n${read('server/app.js')}`;

    expect(productCopy).toContain('EMBEDDABLE AGENT');
    expect(productCopy).toContain('embed inside a website or app');
    expect(productCopy).not.toContain('company-trained website assistant');
  });

  it('ships legal, search, social, and privacy disclosures', () => {
    const home = read('index.html');
    const footer = read('public/SiteFooter.dc.html');
    const assistant = read('public/ChatAssistant.dc.html');

    expect(home).toContain('<link rel="canonical" href="https://felican.ai/">');
    expect(home).toContain('https://felican.ai/og.png');
    expect(read('public/robots.txt')).toContain('Disallow: /');
    expect(read('public/sitemap.xml')).toContain('<loc>https://felican.ai/privacy/</loc>');
    expect(footer).toContain('href="/privacy/"');
    expect(footer).toContain('href="/terms/"');
    expect(assistant).toContain('Please do not share confidential or sensitive information');
    expect(assistant).toContain('Use plain text only');
  });

  it('keeps World of Agents second in the footer too', () => {
    const footer = read('public/SiteFooter.dc.html');
    expect(footer.indexOf("label: 'Felican Auto'")).toBeLessThan(footer.indexOf("label: 'World of Agents'"));
    expect(footer.indexOf("label: 'World of Agents'")).toBeLessThan(footer.indexOf("label: 'Relay'"));
  });

  it('does not publish a fixed product count', () => {
    // Strip JSON-LD: its "position": N / "@type": "Product" pairs are structured
    // data for crawlers, not a claim to visitors about how many products exist.
    const stripLd = src => src.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const productCopy = [
      read('index.html'),
      read('public/products/index.html'),
      read('public/about/index.html'),
      read('public/books/index.html'),
      read('public/ChatAssistant.dc.html'),
    ].map(stripLd).join('\n');

    expect(productCopy).not.toMatch(/\b(?:five|5)\b.{0,30}\bproducts?\b|\bproducts?\b.{0,30}\b(?:five|5)\b/i);
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('Claude Design static website export', () => {
  it('ships the redesigned homepage and clean internal routes', () => {
    const home = read('index.html');

    expect(home).toContain('We build the AI your business');
    expect(home).toContain('A growing lineup of practical products.');
    expect(home).toContain('Books by Lee Felican Jr.');
    expect(home).toContain('class="home-overview"');
    expect(home).toContain('class="home-service-card"');
    expect(home).toContain('.home-service-card:hover h3 { color:#FFFFFF !important }');
    expect(home).not.toMatch(/(?:Home|Products|Services|Books|About|Contact)\.dc\.html/);
  });

  it.each([
    ['products', 'Products built for real work.'],
    ['services', 'Services'],
    ['books', 'Books by Lee Felican Jr.'],
    ['about', 'A family-built company that builds AI for a living'],
    ['contact', "Let's talk about your business"],
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
  });

  it('links every product to its live destination and includes a real screenshot', () => {
    const products = read('public/products/index.html');
    for (const [url, image] of [
      ['https://auto.felican.ai/', '/product-felican-auto.png'],
      ['https://relay.felican.dev/relay', '/product-relay.png'],
      ['/?assistant=1', '/product-ai-assistant.png'],
      ['https://woa.felican.ai/', '/product-world-of-agents.png'],
      ['https://book-studio.felican.dev/', '/product-bookmaker.png'],
    ]) {
      expect(products).toContain(url);
      expect(products).toContain(image);
    }
    expect(products).not.toMatch(/BookMarketer|book-marketer|product-marketer/i);
  });

  it('uses direct contact links without a contact form', () => {
    const contact = read('public/contact/index.html');
    expect(contact).toContain("'privateaiglobal' + '@' + 'gmail.com'");
    expect(contact).toContain("emailHref: 'mailto:' + email");
    expect(contact).toContain('tel:+13465150361');
    expect(contact).not.toContain('<form');
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

  it('does not publish a fixed product count', () => {
    const productCopy = [
      read('index.html'),
      read('public/products/index.html'),
      read('public/about/index.html'),
      read('public/books/index.html'),
      read('public/ChatAssistant.dc.html'),
    ].join('\n');

    expect(productCopy).not.toMatch(/\b(?:five|5)\b.{0,30}\bproducts?\b|\bproducts?\b.{0,30}\b(?:five|5)\b/i);
  });
});

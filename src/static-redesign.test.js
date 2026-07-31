import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('Claude Design static website export', () => {
  it('ships the redesigned homepage and clean internal routes', () => {
    const home = read('index.html');

    expect(home).toContain('We build the AI your business');
    expect(home).toContain('Five products. One system.');
    expect(home).toContain('Books by Lee Felican Jr.');
    expect(home).not.toMatch(/(?:Home|Products|Services|Books|About|Contact)\.dc\.html/);
  });

  it.each([
    ['products', 'Five products, five jobs done properly'],
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
      ['/?assistant=1', '/product-ai-assistant.png'],
      ['https://woa.felican.ai/', '/product-world-of-agents.png'],
      ['https://book-studio.felican.dev/', '/product-bookmaker.png'],
      ['https://book-marketer.felican.dev/', '/product-marketer.png'],
    ]) {
      expect(products).toContain(url);
      expect(products).toContain(image);
    }
  });

  it('connects the assistant UI to the protected server endpoint', () => {
    const assistant = read('public/ChatAssistant.dc.html');
    expect(assistant).toContain("fetch('/api/chat'");
    expect(assistant).not.toContain('window.claude.complete');
  });
});

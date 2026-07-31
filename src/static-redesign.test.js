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
});

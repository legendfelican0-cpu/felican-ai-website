import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// NOTE: use 'domcontentloaded', never 'networkidle'. Third-party fonts and the
// contact chat can stay open or respond slowly in WebKit; the rendered-heading
// and .sc-missing assertions below are the reliable readiness checks.
const routes = [
  ['/', 'AI solutions for'],
  ['/products/', 'Products built for real work.'],
  ['/services/', 'Eleven ways we put AI to work inside a business'],
  ['/education/', 'AI learning that meets people where they are.'],
  ['/books/', 'Four books by Lee Felican Jr.'],
  ['/about/', 'A team of certified AI professionals who build AI for a living'],
  ['/contact/', "Let's talk about your business"],
  ['/booking/', 'Let’s talk about where AI can create leverage.'],
  ['/privacy/', 'Privacy Policy'],
  ['/terms/', 'Terms of Use'],
];

test.describe('Claude Design website export', () => {
  for (const [route, headline] of routes) {
    test(`${route} renders without browser errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1').first()).toContainText(headline);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('.fa-cred')).toBeVisible();
      // The runtime tags unresolved imports/interpolations with .sc-missing.
      // Wait before measuring imported assistant styles or Safari may briefly
      // report the badge images at their intrinsic document dimensions.
      await expect(page.locator('.sc-missing')).toHaveCount(0);
      await expect.poll(() => page.locator('.fa-cred-logo img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await expect.poll(() => page.locator('.fa-cred-logo').first().evaluate(item => {
        const box = item.getBoundingClientRect();
        return box.width <= 72 && box.height <= 44;
      })).toBe(true);
      const credentialLogoLayout = await page.locator('.fa-cred-logo').evaluateAll(items => items.map(item => {
        const box = item.getBoundingClientRect();
        const image = item.querySelector('img').getBoundingClientRect();
        return {
          alt: item.querySelector('img').alt,
          box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
          image: { left: image.left, right: image.right, top: image.top, bottom: image.bottom },
          fits: image.left >= box.left - 0.5 && image.right <= box.right + 0.5
            && image.top >= box.top - 0.5 && image.bottom <= box.bottom + 0.5,
        };
      }));
      expect(credentialLogoLayout.filter(item => !item.fits), JSON.stringify(credentialLogoLayout, null, 2)).toEqual([]);
      const logoLayout = await page.locator('.fa-cred-logos').evaluate(element => {
        const box = element.getBoundingClientRect();
        const openai = element.querySelector('.openai img').getBoundingClientRect();
        return {
          centerDelta: Math.abs((box.left + box.width / 2) - window.innerWidth / 2),
          openaiWidth: openai.width,
          openaiHeight: openai.height,
        };
      });
      if (page.viewportSize().width <= 640) expect(logoLayout.centerDelta).toBeLessThanOrEqual(2);
      expect(Math.max(logoLayout.openaiWidth, logoLayout.openaiHeight)).toBeGreaterThanOrEqual(34);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
      expect(consoleErrors).toEqual([]);
      // Exclude embedded third-party frames: axe crawls into them, and the Cal.com
      // booking widget renders skeleton buttons with no accessible name. That is
      // their markup, not ours, and whether it has rendered yet is pure timing.
      const accessibility = await new AxeBuilder({ page })
        .exclude('iframe')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
    });
  }

  test('homepage handshake video plays once and holds its final frame', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const video = page.locator('#home-hero-video');
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute('autoplay', '');
    expect(await video.evaluate(media => media.muted)).toBe(true);
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video).not.toHaveAttribute('loop', /.*/);
    await expect(video).toHaveAttribute('poster', '/home-hero.jpg');
    await expect(video.locator('source')).toHaveCount(2);
    await expect(video.locator('source').first()).toHaveAttribute('src', '/home-hero-handshake.webm');
    await expect(video.locator('source').last()).toHaveAttribute('src', '/home-hero-handshake.mp4');

    await expect.poll(() => video.evaluate(media => media.readyState)).toBeGreaterThanOrEqual(2);
    const result = await video.evaluate(async media => {
      media.currentTime = Math.max(0, media.duration - 0.12);
      await media.play();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('hero video did not end')), 3000);
        media.addEventListener('ended', () => { clearTimeout(timeout); resolve(); }, { once: true });
      });
      return {
        ended: media.ended,
        paused: media.paused,
        loop: media.loop,
        atFinalFrame: Math.abs(media.duration - media.currentTime) < 0.08,
      };
    });
    expect(result).toEqual({ ended: true, paused: true, loop: false, atFinalFrame: true });
  });

  test('navigation, products, books, and assistant are functional', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'load' });
    const isMobile = testInfo.project.name.startsWith('mobile');

    if (isMobile) {
      await page.getByRole('button', { name: /toggle navigation menu/i }).click();
      await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Products', exact: true }).click();
    } else {
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Products', exact: true }).click();
    }
    await expect(page).toHaveURL(/\/products\/?$/);

    // Seven headline products, led by the flagship, then the agent bench.
    const productCards = page.locator('.product-card');
    await expect(productCards).toHaveCount(7);
    await expect(productCards.first()).toHaveAttribute('id', 'private-ai');
    await expect(page.locator('.agent-card')).toHaveCount(6);
    await expect(page.locator('.rest-card')).toHaveCount(5);
    await expect(page.locator('.agent-card .app-cover-image img')).toHaveCount(6);
    await expect(page.locator('.rest-card .app-cover-image img')).toHaveCount(5);
    expect(await page.locator('.app-cover-image img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);

    // Products never link out to the live apps; every CTA pre-fills the contact form.
    const outbound = page.locator('main a[href^="http"]:not([href*="felican.ai/contact"])');
    for (const href of await outbound.evaluateAll(links => links.map(a => a.getAttribute('href')))) {
      expect(href).not.toMatch(/auto\.felican|woa\.felican|relay\.felican|book-studio/);
    }
    await expect(productCards.filter({ hasText: 'BookMaker' })).toHaveCount(0);

    await page.goto('/books/', { waitUntil: 'load' });
    const covers = page.locator('img[alt$=" cover"]');
    await expect(covers).toHaveCount(4);
    expect(await covers.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    // The Big Balla's Guide sits last, and buying goes to Amazon.
    await expect(covers.last()).toHaveAttribute('alt', /Big Balla/i);
    await expect(page.getByRole('link', { name: /View book on Amazon\.com/i }).first()).toHaveAttribute(
      'href',
      /^https:\/\/www\.amazon\.com\/dp\//,
    );

    await page.goto('/', { waitUntil: 'load' });
    await page.screenshot({ path: testInfo.outputPath(`homepage-${testInfo.project.name}.png`), fullPage: false });
    const assistantButton = page.locator('[data-assistant-launcher]');
    await expect(assistantButton).toHaveCount(1);
    await expect(assistantButton).toBeVisible();
    const launcherBox = await assistantButton.boundingBox();
    const viewport = page.viewportSize();
    expect(launcherBox.width).toBeGreaterThan(launcherBox.height * 2);
    expect(viewport.width - launcherBox.x - launcherBox.width).toBeLessThanOrEqual(isMobile ? 16 : 30);
    const credentialBox = await page.locator('.fa-cred').boundingBox();
    expect(launcherBox.y).toBeGreaterThanOrEqual(credentialBox.y - launcherBox.height - 22);
    expect(launcherBox.y + launcherBox.height).toBeLessThanOrEqual(credentialBox.y);
    await assistantButton.click();
    await expect(assistantButton).toHaveAttribute('aria-expanded', 'true');
    const assistantPanel = page.locator('.fa-panel');
    await expect(assistantPanel).toBeVisible();

    const input = page.getByRole('textbox', { name: 'Your message' });
    await input.fill('What does Felican AI build?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('log')).toContainText(
      'Felican AI builds products, custom systems, automations, integrations, and training for businesses.',
    );
  });

  test('Private AI carousel works and voice stays live until Stop voice', async ({ page }) => {
    await page.addInitScript(() => {
      window.__vapiTest = { constructors: 0, starts: 0, stops: 0, assistantId: '', overrides: null };
      window.__micTest = { requests: 0, stopped: 0 };
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            window.__micTest.requests += 1;
            const track = { kind: 'audio', readyState: 'live', stop: () => { window.__micTest.stopped += 1; } };
            return { getTracks: () => [track], getAudioTracks: () => [track] };
          },
        },
      });
      window.AudioContext = class {
        constructor() { this.state = 'running'; }
        createAnalyser() { return { fftSize: 256, smoothingTimeConstant: 0, getByteTimeDomainData: values => values.fill(150) }; }
        createMediaStreamSource() { return { connect: () => {} }; }
        close() { return Promise.resolve(); }
      };
      window.__FELICAN_VAPI_CONFIG__ = { publicKey: 'public-test', assistantId: 'assistant-test' };
      window.__FELICAN_VAPI_CLASS__ = class {
        constructor() { window.__vapiTest.constructors += 1; this.handlers = {}; window.__vapiTest.instance = this; }
        on(name, handler) { this.handlers[name] = handler; }
        async start(assistantId, overrides) {
          window.__vapiTest.starts += 1;
          window.__vapiTest.assistantId = assistantId;
          window.__vapiTest.overrides = overrides;
          this.handlers['call-start']?.();
        }
        stop() {
          window.__vapiTest.stops += 1;
          this.handlers['call-end']?.();
        }
      };
    });

    await page.goto('/products/', { waitUntil: 'load' });
    await expect.poll(() => page.evaluate(() => window.__vapiTest.constructors)).toBe(1);
    await expect(page.locator('.pc-slide:visible img')).toHaveAttribute('src', '/private-ai-knowledge.png');
    await page.getByRole('button', { name: 'Next Private AI feature' }).click();
    await expect(page.locator('.pc-slide:visible img')).toHaveAttribute('src', '/private-ai-client-brief.png');

    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('button', { name: 'Start voice' }).click();
    await expect(page.getByRole('button', { name: 'Stop voice' })).toBeVisible();
    // The browser's own microphone level must animate before Vapi returns a
    // transcript event, so visitors immediately know they are being heard.
    await expect(page.locator('.fa-voice-signal.hearing')).toBeVisible();
    await expect(page.getByText('We can hear you — keep talking.')).toBeVisible();
    await page.evaluate(() => window.__vapiTest.instance.handlers.message({ type: 'speech-update', role: 'user', status: 'started' }));
    await expect(page.getByText('We can hear you — keep talking.')).toBeVisible();
    await expect(page.locator('.fa-voice-signal.hearing')).toBeVisible();
    await page.evaluate(() => window.__vapiTest.instance.handlers.message({ type: 'transcript', role: 'user', transcriptType: 'partial', transcript: 'what services' }));
    await expect(page.getByText('Hearing you: “what services”')).toBeVisible();
    await page.evaluate(() => window.__vapiTest.instance.handlers['speech-start']());
    await expect(page.getByText('Felican AI is speaking — talk anytime to interrupt.')).toBeVisible();
    // Stop must remain usable while audio is playing so a reply can be cut off.
    await page.getByRole('button', { name: 'Stop voice' }).click();
    expect(await page.evaluate(() => window.__vapiTest.stops)).toBe(1);

    await page.getByRole('button', { name: 'Start voice' }).click();
    await page.evaluate(() => {
      window.__vapiTest.instance.handlers['speech-start']();
      window.__vapiTest.instance.handlers['speech-end']();
    });
    // speech-end must return to the live microphone, not end the ongoing
    // conversation. This mock is intentionally loud, so the local meter says
    // it can hear us instead of showing the quiet-room listening copy.
    await expect(page.getByText('We can hear you — keep talking.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop voice' })).toBeVisible();
    expect(await page.evaluate(() => window.__vapiTest)).toMatchObject({
      constructors: 1, starts: 2, stops: 1, assistantId: 'assistant-test',
      overrides: { firstMessage: ' ', firstMessageMode: 'assistant-speaks-first', firstMessageInterruptionsEnabled: false },
    });
    await page.getByRole('button', { name: 'Stop voice' }).click();
    await expect(page.getByRole('button', { name: 'Start voice' })).toBeVisible();
    expect(await page.evaluate(() => window.__vapiTest.stops)).toBe(2);
    expect(await page.evaluate(() => window.__micTest)).toMatchObject({ requests: 2, stopped: 2 });
  });

  test('the first voice tap waits for delayed setup instead of being discarded', async ({ page }) => {
    await page.route('**/api/voice-config', async route => {
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ enabled: true, publicKey: 'public-test', assistantId: 'assistant-test' }),
      });
    });
    await page.addInitScript(() => {
      window.__fastVoiceTest = { starts: 0, micRequests: 0 };
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            window.__fastVoiceTest.micRequests += 1;
            const track = { kind: 'audio', readyState: 'live', stop: () => {} };
            return { getTracks: () => [track], getAudioTracks: () => [track] };
          },
        },
      });
      window.AudioContext = class {
        constructor() { this.state = 'running'; }
        createAnalyser() { return { fftSize: 256, smoothingTimeConstant: 0, getByteTimeDomainData: values => values.fill(128) }; }
        createMediaStreamSource() { return { connect: () => {} }; }
        close() { return Promise.resolve(); }
      };
      window.__FELICAN_VAPI_CLASS__ = class {
        constructor() { this.handlers = {}; }
        on(name, handler) { this.handlers[name] = handler; }
        async start() {
          window.__fastVoiceTest.starts += 1;
          this.handlers['call-start']?.();
        }
        stop() { this.handlers['call-end']?.(); }
      };
    });

    await page.goto('/products/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-assistant-launcher]').click();
    await page.getByRole('button', { name: 'Start voice' }).click();
    await expect.poll(() => page.evaluate(() => window.__fastVoiceTest.micRequests)).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'Stop voice' })).toBeVisible({ timeout: 5000 });
    await expect.poll(() => page.evaluate(() => window.__fastVoiceTest.starts)).toBe(1);
    await expect.poll(() => page.evaluate(() => window.__fastVoiceTest.micRequests)).toBe(1);
    await page.getByRole('button', { name: 'Stop voice' }).click();
  });

  test('contact page offers a working form alongside email and phone', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /ai@felican\.ai/i }).first()).toHaveAttribute('href', /mailto:ai@felican\.ai/);
    await expect(page.getByRole('link', { name: /\(561\) 235-0799/ }).first()).toHaveAttribute('href', 'tel:+15612350799');
    await expect(page.locator('main form.ct-form')).toHaveCount(1);
    // The retired address must not linger anywhere.
    expect(await page.content()).not.toContain('gmail.com');
  });

  test('booking page has a stable route and a live booking embed', async ({ page }) => {
    await page.goto('/booking/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: /where AI can create leverage/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open booking page/i })).toHaveAttribute('href', /^https:\/\/cal\.com\//);
  });

  test('legal, search, social, and analytics foundations are present', async ({ page }) => {
    await page.goto('/privacy/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]').first()).toHaveAttribute('href', 'https://felican.ai/privacy/');
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', 'https://felican.ai/og.png');

    const robots = await page.request.get('/robots.txt');
    expect(await robots.text()).toContain('Disallow: /');
    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain('<loc>https://felican.ai/products/</loc>');

    const analytics = await page.request.post('/api/analytics', { data: { event: 'page_view', path: '/privacy/' } });
    expect(analytics.status()).toBe(204);
  });

  test('homepage friction checklist is usable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const firstFriction = page.locator('.friction-input').first();
    await firstFriction.check();
    await expect(firstFriction).toBeChecked();
    await expect(page.getByText("selected — that's exactly what we help fix.")).toBeVisible();

    await page.locator('#cf-name').fill('Test User');
    await page.locator('#cf-message').fill('Testing the contact flow.');
    await expect(page.locator('#cf-name')).toHaveValue('Test User');
  });
});

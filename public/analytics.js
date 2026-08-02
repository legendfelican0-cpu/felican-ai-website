(() => {
  'use strict';

  const endpoint = '/api/analytics';
  const allowedEvents = new Set(['page_view', 'contact_click', 'product_click', 'assistant_open']);

  function clean(value, max = 180) {
    return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
  }

  function destination(link) {
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin) return clean(url.pathname + url.hash);
      return clean(url.hostname + url.pathname);
    } catch {
      return '';
    }
  }

  function track(event, details = {}) {
    if (!allowedEvents.has(event)) return;
    const payload = JSON.stringify({
      event,
      path: clean(window.location.pathname),
      target: clean(details.target),
      referrer: clean(document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return ''; } })() : ''),
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch {
      // Analytics must never interfere with the visitor's experience.
    }
  }

  window.felicanTrack = track;
  window.addEventListener('DOMContentLoaded', () => track('page_view'), { once: true });
  document.addEventListener('click', event => {
    const launcher = event.target.closest?.('[data-assistant-launcher]');
    if (launcher && launcher.getAttribute('aria-expanded') !== 'true') track('assistant_open');

    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('/contact')) {
      track('contact_click', { target: href.split(':')[0] || '/contact' });
    } else if (link.closest('article[id]') || /auto\.felican|relay\.felican|woa\.felican|book-studio/.test(link.href)) {
      track('product_click', { target: destination(link) });
    }
  });
})();

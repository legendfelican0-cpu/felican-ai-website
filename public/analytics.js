(() => {
  'use strict';

  const endpoint = '/api/analytics';
  const allowedEvents = new Set(['page_view', 'contact_click', 'product_click', 'assistant_open', 'web_vitals', 'ai_referral']);

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
      ...(details.metric ? { metric: clean(details.metric, 24) } : {}),
      ...(typeof details.value === 'number' ? { value: details.value } : {}),
      ...(details.rating ? { rating: clean(details.rating, 12) } : {}),
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


  /* ---------------------------------------------------------- Core Web Vitals */

  // LCP, INP and CLS are ranking inputs, and Google measures them on real visits at
  // the 75th percentile — which means lab tools cannot tell you whether you pass.
  // Reported here from the native PerformanceObserver rather than a library, so there
  // is no third-party script and no CSP change.
  //
  // Thresholds are Google's published "good" boundaries: LCP < 2.5s, INP < 200ms,
  // CLS < 0.1.
  const VITALS_GOOD = { LCP: 2500, INP: 200, CLS: 0.1 };

  function reportVital(metric, value) {
    const good = VITALS_GOOD[metric];
    track('web_vitals', {
      metric,
      value,
      rating: value <= good ? 'good' : value <= good * 2.5 ? 'needs-improvement' : 'poor',
    });
  }

  function observeVitals() {
    if (typeof PerformanceObserver !== 'function') return;

    // LCP: keep the largest entry and report it once the page is backgrounded or
    // unloaded, because a later paint can supersede an earlier one.
    let lcp = 0;
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) lcp = Math.max(lcp, entry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* unsupported: skip this metric rather than break the others */ }

    // CLS: the sum of the largest burst of unexpected layout shifts.
    let cls = 0;
    let sessionValue = 0;
    let sessionEntries = [];
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          const first = sessionEntries[0];
          const last = sessionEntries[sessionEntries.length - 1];
          if (sessionEntries.length && entry.startTime - last.startTime < 1000 && entry.startTime - first.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }
          cls = Math.max(cls, sessionValue);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* unsupported */ }

    // INP: the worst interaction latency the visitor actually experienced.
    let inp = 0;
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.interactionId) inp = Math.max(inp, entry.duration);
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch { /* unsupported */ }

    // Report once, on the last reliable opportunity. visibilitychange fires where
    // unload does not (notably on mobile Safari).
    let sent = false;
    const flush = () => {
      if (sent) return;
      sent = true;
      if (lcp > 0) reportVital('LCP', Math.round(lcp));
      if (inp > 0) reportVital('INP', Math.round(inp));
      reportVital('CLS', Math.round(cls * 1000) / 1000);
    };
    addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    addEventListener('pagehide', flush);
  }

  /* ------------------------------------------------------------- AI referrals */

  // Traffic from AI assistants arrives with an ordinary referrer and is otherwise
  // indistinguishable from direct traffic, so there is no report that shows it. These
  // are the hosts that actually appear in referrer headers today; the list will need
  // revisiting as assistants change how they link out.
  const AI_REFERRERS = [
    ['chatgpt.com', 'ChatGPT'],
    ['chat.openai.com', 'ChatGPT'],
    ['openai.com', 'OpenAI'],
    ['perplexity.ai', 'Perplexity'],
    ['claude.ai', 'Claude'],
    ['anthropic.com', 'Claude'],
    ['gemini.google.com', 'Gemini'],
    ['copilot.microsoft.com', 'Copilot'],
    ['bing.com/chat', 'Copilot'],
    ['you.com', 'You.com'],
    ['phind.com', 'Phind'],
    ['poe.com', 'Poe'],
    ['duckduckgo.com/aichat', 'DuckAssist'],
    ['mistral.ai', 'Mistral'],
    ['grok.com', 'Grok'],
    ['x.ai', 'Grok'],
  ];

  function reportAiReferral() {
    const ref = document.referrer;
    if (!ref) return;
    let host = '';
    let full = '';
    try {
      const url = new URL(ref);
      host = url.hostname.replace(/^www\./, '');
      full = host + url.pathname;
    } catch {
      return;
    }
    const match = AI_REFERRERS.find(([needle]) => full.startsWith(needle) || host === needle || host.endsWith('.' + needle));
    if (match) track('ai_referral', { target: match[1] });
  }

  window.felicanTrack = track;
  window.addEventListener('DOMContentLoaded', () => {
    track('page_view');
    reportAiReferral();
  }, { once: true });
  observeVitals();
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

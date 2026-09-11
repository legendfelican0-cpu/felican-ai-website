// felican.ai edge Worker — serves a crawler-friendly robots.txt and the /grrr vanity URL.
// Scoped (via routes) to ONLY: felican.ai/robots.txt, felican.ai/grrr, felican.ai/grrr/
// Apex host only — does NOT affect candyshop.felican.ai, gbx, etc.

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

const ROBOTS = `# felican.ai
# The public profile at /Lehem-Felican-Jr is open to search engines and AI assistants
# (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot, etc.).
# The application root is private.

User-agent: *
Disallow: /
Allow: /Lehem-Felican-Jr

Sitemap: https://felican.ai/Lehem-Felican-Jr/sitemap.xml
`;

async function handle(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/robots.txt') {
    return new Response(ROBOTS, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  }

  if (path === '/grrr' || path === '/grrr/') {
    return Response.redirect('https://felican.ai/Lehem-Felican-Jr/grrr', 301);
  }

  // Routes scope us to the paths above; anything else just passes through to origin.
  return fetch(request);
}

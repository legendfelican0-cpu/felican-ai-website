// felican.ai edge Worker — serves only the /grrr vanity redirect.
// Scoped (via routes) to ONLY: felican.ai/grrr, felican.ai/grrr/
//
// robots.txt is deliberately NOT handled here. The felican.ai site origin owns it
// (server/app.js), so it lives in git, is covered by tests, and stays host-aware
// (felican.dev must keep Disallow: / while felican.ai allows crawling).
// A hardcoded ROBOTS constant here previously served "Disallow: /" for the whole
// apex, which kept the company site out of every search index.

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  const path = new URL(request.url).pathname;

  if (path === '/grrr' || path === '/grrr/') {
    return Response.redirect('https://felican.ai/Lehem-Felican-Jr/grrr', 301);
  }

  // Routes scope us to the paths above; anything else passes through to origin.
  return fetch(request);
}

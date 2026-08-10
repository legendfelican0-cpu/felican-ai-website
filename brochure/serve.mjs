// Live preview: http://localhost:5175
// Rebuilds and refreshes the browser whenever src/ changes — no manual reload.
//   node serve.mjs
import { createServer } from 'node:http';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const p = (...s) => join(here, ...s);

const PORT = Number(process.env.PORT) || 5175;
const clients = new Set();

// Node caches ES modules by specifier, so a plain top-level import of
// render.mjs would pin the server to whatever the code looked like at startup —
// it would keep re-reading content.json while running stale rendering logic.
// Bumping a version in the query string forces a genuine re-import after edits.
let codeVersion = 0;
const loadRenderer = () => import(`./src/render.mjs?v=${codeVersion}`);

// Injected into the preview only. Never reaches dist/ or the PDF.
const LIVE_RELOAD = `
<script>
  new EventSource('/__reload').onmessage = () => location.reload();
</script>
<style>
  @media screen {
    body { background: #55606a; }
    .page { position: relative; }
    .page::after {
      content: attr(data-label);
      position: absolute; top: -19px; left: 0;
      font: 500 11px/1 ui-monospace, monospace; letter-spacing: .14em;
      text-transform: uppercase; color: #cdd6dd;
    }
  }
</style>`;

const server = createServer(async (req, res) => {
  if (req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let html;
  try {
    const { renderHtml } = await loadRenderer();
    html = renderHtml().replace('</body>', LIVE_RELOAD + '\n</body>');
  } catch (err) {
    html = `<pre style="font:14px/1.6 ui-monospace,monospace;color:#c00;padding:32px;white-space:pre-wrap">
Build failed — fix it and this page will refresh itself.

${String(err.stack || err).replace(/[<&]/g, (c) => ({ '<': '&lt;', '&': '&amp;' }[c]))}
</pre>${LIVE_RELOAD}`;
    console.error('build error:', err.message);
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
});

// Coalesce the burst of events an editor fires when saving one file.
let timer;
for (const dir of ['src', 'assets']) {
  watch(p(dir), { recursive: true }, (_event, file) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      codeVersion++;
      console.log(`changed: ${dir}/${file} — reloading`);
      for (const c of clients) c.write('data: reload\n\n');
    }, 80);
  });
}

server.listen(PORT, () => {
  console.log(`\n  Live preview  ->  http://localhost:${PORT}`);
  console.log(`  Edit src/content.json and the page refreshes itself.`);
  console.log(`  Run "node build.mjs" when you want the PDF.\n`);
});

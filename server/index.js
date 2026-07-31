import { createAppServer } from './app.js';

const port = Number.parseInt(process.env.PORT || '80', 10);
const rootDir = process.env.STATIC_ROOT || '/app/public';
const server = createAppServer({ rootDir });

server.listen(port, '0.0.0.0', () => {
  console.info(`[felican-ai] listening on port ${port}`);
});

function shutdown(signal) {
  console.info(`[felican-ai] ${signal} received; closing`);
  server.close(error => {
    if (error) {
      console.error('[felican-ai] shutdown failed', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', error => {
  console.error('[felican-ai] uncaught exception', error);
  process.exitCode = 1;
});
process.on('unhandledRejection', error => {
  console.error('[felican-ai] unhandled rejection', error);
});

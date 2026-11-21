import express from 'express';
import { fileURLToPath } from 'node:url';
import { routes } from './routes.js';

export function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', routes(db));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint' }));
  app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url))));
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    res.status(status).json({ error: status === 500 ? 'Database request failed' : error.message });
  });
  return app;
}

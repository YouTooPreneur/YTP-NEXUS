import express, { type Express } from 'express';

export function createApp(): Express {
  const app = express();

  app.get('/api/health', (_request, response) => {
    response.status(200).json({ ok: true, service: 'api' });
  });

  return app;
}

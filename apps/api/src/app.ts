import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { errorHandler, notFound } from './middlewares/errors';
import { healthRouter } from './routes/health';

type AppOptions = {
  logger: Logger;
  routers?: Router[];
};

export function createApp({ logger, routers = [] }: AppOptions): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      // Lista do que pode ir para o log; todo o resto fica de fora (regra 7).
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          path: req.url.split('?')[0],
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        err: (err: { type?: string }) => ({ type: err.type }),
      },
    }),
  );
  app.use(helmet());
  app.use(express.json());

  app.use(healthRouter);
  for (const router of routers) {
    app.use(router);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

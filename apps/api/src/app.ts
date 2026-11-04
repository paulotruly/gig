import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Router } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { Deps, RouterDeps } from './deps';
import { errorBody } from './errors';
import { requireAuth } from './middlewares/auth';
import { errorHandler, notFound } from './middlewares/errors';
import { authRouter } from './modules/auth';
import { businessesRouter } from './modules/businesses';
import { commitmentsRouter } from './modules/commitments';
import { consentsRouter } from './modules/consents';
import { forecastingRouter } from './modules/forecasting';
import { guidanceRouter } from './modules/guidance';
import { ingestionRouter } from './modules/ingestion';
import { partnerMetricsRouter } from './modules/partner-metrics';
import { tracksRouter } from './modules/tracks';
import { transactionsRouter } from './modules/transactions';
import { whatsappRouter } from './modules/whatsapp';
import { healthRouter } from './routes/health';

type AppOptions = {
  logger: Logger;
  routers?: Router[];
  checkDatabase?: () => Promise<unknown>;
  corsOrigin?: string;
  trustProxyHops?: number;
  rateLimitPerMinute?: number;
};

export function createApp({
  logger,
  routers = [],
  checkDatabase,
  corsOrigin,
  trustProxyHops = 0,
  rateLimitPerMinute,
}: AppOptions): Express {
  const app = express();
  app.set('trust proxy', trustProxyHops);

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
  // Sem origem configurada, nenhum outro domínio recebe permissão de CORS.
  app.use(cors({ origin: corsOrigin ?? false, credentials: true }));
  app.use(healthRouter(checkDatabase));
  if (rateLimitPerMinute) {
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        limit: rateLimitPerMinute,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (_req, res) => {
          res.status(429).json(errorBody('too_many_requests', 'Muitas requisições.'));
        },
      }),
    );
  }
  app.use(
    express.json({
      // A assinatura do webhook é calculada sobre os bytes originais.
      verify: (req, _res, buffer) => {
        (req as express.Request).rawBody = buffer;
      },
    }),
  );
  app.use(cookieParser());

  for (const router of routers) {
    app.use(router);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export function apiRouters(baseDeps: Deps): Router[] {
  const requireSession = requireAuth(baseDeps.prisma);
  // Vem depois da sessão, porque a contagem é por usuário.
  const userLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: baseDeps.config.RATE_LIMIT_PER_USER_PER_MINUTE,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `user:${req.userId}`,
    handler: (_req, res) => {
      res.status(429).json(errorBody('too_many_requests', 'Muitas requisições.'));
    },
  });
  const deps: RouterDeps = {
    ...baseDeps,
    authenticate: (req, res, next) => {
      void requireSession(req, res, (err?: unknown) => {
        if (err) {
          next(err);
          return;
        }
        void userLimiter(req, res, next);
      });
    },
  };
  return [
    whatsappRouter(deps),
    authRouter(deps),
    businessesRouter(deps),
    consentsRouter(deps),
    ingestionRouter(deps),
    transactionsRouter(deps),
    commitmentsRouter(deps),
    forecastingRouter(deps),
    guidanceRouter(deps),
    tracksRouter(deps),
    partnerMetricsRouter(deps),
  ];
}

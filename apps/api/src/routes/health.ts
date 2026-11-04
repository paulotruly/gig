import { Router } from 'express';
import { errorBody } from '../errors';

export function healthRouter(checkDatabase?: () => Promise<unknown>): Router {
  const router = Router();

  router.get('/health', async (req, res) => {
    try {
      await checkDatabase?.();
      res.json({ status: 'ok' });
    } catch (err) {
      req.log.error(
        { errorName: err instanceof Error ? err.name : typeof err },
        'banco fora do ar',
      );
      res.status(503).json(errorBody('database_unavailable', 'Banco de dados indisponível.'));
    }
  });

  return router;
}

import { Router } from 'express';
import { z } from 'zod';
import type { RouterDeps } from '../deps';
import { notFoundError } from '../errors';
import { audit, parse, parseId } from '../http';
import { currentUserId } from '../middlewares/auth';

const metricsQuery = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export function partnerMetricsRouter({
  prisma,
  partnerMetricsDb,
  authenticate,
}: RouterDeps): Router {
  const router = Router();

  router.get('/partners/:id/metrics', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const partnerId = parseId(req.params.id);
    const member = await prisma.partnerMember.findUnique({
      where: { partnerId_userId: { partnerId, userId } },
    });
    if (!member) {
      throw notFoundError();
    }
    const { period } = parse(metricsQuery, req.query);
    // A leitura usa a conexão somente leitura, que só enxerga partner_metrics (regra 4).
    const metrics = await partnerMetricsDb.partnerMetric.findMany({
      where: { partnerId, ...(period ? { period } : {}) },
      orderBy: [{ period: 'desc' }, { indicator: 'asc' }],
    });
    await audit(prisma, {
      actorUserId: userId,
      action: 'partner_metrics.view',
      targetType: 'partner',
      targetId: partnerId,
    });
    res.json({
      partnerId,
      metrics: metrics.map((m) => ({
        period: m.period,
        indicator: m.indicator,
        value: m.value.toFixed(2),
        businessCount: m.businessCount,
      })),
    });
  });

  return router;
}

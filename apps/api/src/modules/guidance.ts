import { toIsoDate } from '@gig/shared';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { audit, parseId } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

export function guidanceRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.get('/businesses/:id/alerts', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, userId, businessId);
    const alerts = await prisma.alert.findMany({
      where: { businessId },
      orderBy: { id: 'desc' },
      take: 100,
    });
    await audit(prisma, { actorUserId: userId, businessId, action: 'alerts.list' });
    res.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        ruleId: alert.ruleId,
        referenceDate: toIsoDate(alert.referenceDate),
        message: alert.message,
        explanation: alert.explanation,
        data: alert.data,
        trackSlug: alert.trackSlug,
        rulesVersion: alert.rulesVersion,
        channel: alert.channel,
        status: alert.status,
        createdAt: alert.createdAt,
      })),
    });
  });

  return router;
}

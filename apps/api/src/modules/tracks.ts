import { trackProgressBody } from '@gig/shared/contracts';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { notFoundError } from '../errors';
import { audit, parse, parseId, recordUsageEvent } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

export function tracksRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.get('/tracks', authenticate, async (_req, res) => {
    const tracks = await prisma.track.findMany({ orderBy: { id: 'asc' } });
    res.json({ tracks });
  });

  router.post('/tracks/:id/progress', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const body = parse(trackProgressBody, req.body);
    await requireBusinessRole(prisma, userId, body.businessId);
    const track = await prisma.track.findUnique({ where: { id: parseId(req.params.id) } });
    if (!track) {
      throw notFoundError();
    }
    const key = { businessId: body.businessId, trackId: track.id };
    await prisma.trackProgress.createMany({
      data: [{ ...key, percent: 0 }],
      skipDuplicates: true,
    });
    // A condição no próprio UPDATE impede regressão, mesmo com requisições simultâneas.
    await prisma.trackProgress.updateMany({
      where: { ...key, percent: { lt: body.percent } },
      data: {
        percent: body.percent,
        ...(body.percent === 100 ? { completedAt: new Date() } : {}),
      },
    });
    const progress = await prisma.trackProgress.findUniqueOrThrow({
      where: { businessId_trackId: key },
    });
    if (progress.percent === 100) {
      await recordUsageEvent(
        prisma,
        body.businessId,
        'TRACK_COMPLETED',
        `track_completed:${track.slug}`,
      );
    }
    await audit(prisma, {
      actorUserId: userId,
      businessId: body.businessId,
      action: 'track.progress',
      targetType: 'track',
      targetId: track.id,
    });
    res.json({ trackId: track.id, businessId: body.businessId, percent: progress.percent });
  });

  return router;
}

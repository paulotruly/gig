import { fromIsoDate, toIsoDate } from '@gig/shared';
import { createCommitmentBody } from '@gig/shared/contracts';
import { Router } from 'express';
import type { RouterDeps } from '../deps';
import { notFoundError } from '../errors';
import { audit, parse, parseId } from '../http';
import { currentUserId, requireBusinessRole } from '../middlewares/auth';

export function commitmentsRouter({ prisma, authenticate }: RouterDeps): Router {
  const router = Router();

  router.get('/businesses/:id/commitments', authenticate, async (req, res) => {
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, currentUserId(req), businessId);
    const rows = await prisma.commitment.findMany({
      where: { businessId },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });
    res.json({
      commitments: rows.map((c) => ({
        id: c.id,
        type: c.type,
        description: c.description,
        amount: c.amount.toFixed(2),
        dueDate: toIsoDate(c.dueDate),
        recurrence: c.recurrence,
      })),
    });
  });

  router.post('/businesses/:id/commitments', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    await requireBusinessRole(prisma, userId, businessId);
    const body = parse(createCommitmentBody, req.body);
    const commitment = await prisma.$transaction(async (tx) => {
      const created = await tx.commitment.create({
        data: { ...body, businessId, dueDate: fromIsoDate(body.dueDate) },
      });
      await tx.business.update({
        where: { id: businessId },
        data: { forecastDirtyAt: new Date() },
      });
      await audit(tx, {
        actorUserId: userId,
        businessId,
        action: 'commitment.create',
        targetType: 'commitment',
        targetId: created.id,
      });
      return created;
    });
    res.status(201).json({
      id: commitment.id,
      type: commitment.type,
      description: commitment.description,
      amount: commitment.amount.toFixed(2),
      dueDate: toIsoDate(commitment.dueDate),
      recurrence: commitment.recurrence,
    });
  });

  router.delete('/businesses/:id/commitments/:commitmentId', authenticate, async (req, res) => {
    const userId = currentUserId(req);
    const businessId = parseId(req.params.id);
    const commitmentId = parseId(req.params.commitmentId);
    await requireBusinessRole(prisma, userId, businessId);
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.commitment.deleteMany({ where: { id: commitmentId, businessId } });
      if (count === 0) {
        throw notFoundError();
      }
      await tx.business.update({
        where: { id: businessId },
        data: { forecastDirtyAt: new Date() },
      });
      await audit(tx, {
        actorUserId: userId,
        businessId,
        action: 'commitment.delete',
        targetType: 'commitment',
        targetId: commitmentId,
      });
    });
    res.status(204).end();
  });

  return router;
}
